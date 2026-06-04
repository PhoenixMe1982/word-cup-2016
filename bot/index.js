const { Bot } = require('grammy')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')

const TOKEN    = (process.env.BOT_TOKEN || '').trim()
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10)
const APP_URL  = (process.env.APP_URL || 'https://phoenixme1982.github.io/word-cup-2016/').trim()
const USERS_FILE = path.join(__dirname, 'users.json')

const REDIS_URL   = (process.env.UPSTASH_REDIS_REST_URL || '').trim()
const REDIS_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
const KEY_PREFIX  = (process.env.REDIS_KEY_PREFIX || '').trim()

const K = {
  users:       `${KEY_PREFIX}wc2026_users`,
  results:     `${KEY_PREFIX}wc2026_results`,
  leaderboard: `${KEY_PREFIX}wc2026_lb`,
  preds:  (matchId)  => `${KEY_PREFIX}wc2026_mp:${matchId}`,
  upreds: (userId)   => `${KEY_PREFIX}wc2026_up:${userId}`,
}

if (!TOKEN) { console.error('BOT_TOKEN not set'); process.exit(1) }

const bot = new Bot(TOKEN)

// ── Redis ──────────────────────────────────────────────────────────────────

async function redisExec(cmd, ...args) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([cmd, ...args]),
  })
  return (await res.json()).result
}

async function rget(key) {
  const v = await redisExec('GET', key)
  return v ? JSON.parse(v) : null
}

async function rset(key, val) {
  await redisExec('SET', key, JSON.stringify(val))
}

// ── User storage ───────────────────────────────────────────────────────────

async function loadUsers() {
  if (REDIS_URL && REDIS_TOKEN) return (await rget(K.users)) || {}
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) }
  catch { return {} }
}

async function persistUsers(users) {
  if (REDIS_URL && REDIS_TOKEN) { await rset(K.users, users); return }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

async function saveUser(chatId, firstName, username) {
  const users = await loadUsers()
  if (!users[chatId]) {
    users[chatId] = { chatId, firstName, username, joinedAt: new Date().toISOString() }
    await persistUsers(users)
    console.log(`New user: ${firstName} (@${username}) — total: ${Object.keys(users).length}`)
  }
}

async function removeUser(chatId) {
  const users = await loadUsers()
  delete users[chatId]
  await persistUsers(users)
}

// ── Broadcast ──────────────────────────────────────────────────────────────

async function broadcast(sendFn) {
  const users = await loadUsers()
  const ids = Object.keys(users)
  let sent = 0, failed = 0
  for (const id of ids) {
    try { await sendFn(id); sent++ }
    catch (e) { if (e.error_code === 403) await removeUser(id); failed++ }
    await new Promise(r => setTimeout(r, 50))
  }
  return { sent, failed, total: ids.length }
}

// ── Telegram initData validation ───────────────────────────────────────────

function validateInitData(initData) {
  if (!initData) { console.log('[auth] no initData'); return null }
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) { console.log('[auth] no hash'); return null }
    params.delete('hash')
    const checkStr = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest()
    const expected = crypto.createHmac('sha256', secret).update(checkStr).digest('hex')
    const match = hash === expected
    console.log(`[auth] token=${TOKEN.slice(0,10)} hash_match=${match}`)
    if (!match) return null
    const user = params.get('user')
    return user ? JSON.parse(user) : null
  } catch (e) { console.log('[auth] error:', e.message); return null }
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calcPoints(pred, result) {
  if (pred.home === result.home && pred.away === result.away) return 3
  const predOutcome = Math.sign(pred.home - pred.away)
  const realOutcome = Math.sign(result.home - result.away)
  return predOutcome === realOutcome ? 1 : 0
}

async function settleMatch(matchId, homeScore, awayScore) {
  const result = { home: homeScore, away: awayScore, settledAt: new Date().toISOString() }
  const results = (await rget(K.results)) || {}
  results[matchId] = result
  await rset(K.results, results)

  const matchPreds = (await rget(K.preds(matchId))) || {}
  for (const [userId, pred] of Object.entries(matchPreds)) {
    const pts = calcPoints(pred, result)
    if (pts > 0) await redisExec('ZINCRBY', K.leaderboard, pts, userId)
    const upreds = (await rget(K.upreds(userId))) || {}
    if (upreds[matchId]) {
      upreds[matchId].pts = pts
      await rset(K.upreds(userId), upreds)
    }
  }
  return Object.keys(matchPreds).length
}

// ── Express API ────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())
app.use(cors({
  origin: [
    'https://phoenixme1982.github.io',
    'https://word-cup-2016.vercel.app',
    /\.vercel\.app$/,
  ],
  methods: ['GET', 'POST'],
}))

// Auth middleware
function withAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data']
  const user = validateInitData(initData)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  req.tgUser = user
  next()
}

// GET /api/health
app.get('/api/health', (_, res) => res.json({ ok: true }))

// GET /api/results — all settled match results
app.get('/api/results', async (_, res) => {
  try {
    const results = (await rget(K.results)) || {}
    res.json(results)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/my-predictions — authenticated user's predictions
app.get('/api/my-predictions', withAuth, async (req, res) => {
  try {
    const upreds = (await rget(K.upreds(req.tgUser.id))) || {}
    res.json(upreds)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/predict — save a prediction
app.post('/api/predict', withAuth, async (req, res) => {
  try {
    const { matchId, home, away } = req.body
    if (!matchId || home == null || away == null) return res.status(400).json({ error: 'matchId, home, away required' })
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 20 || away > 20)
      return res.status(400).json({ error: 'Invalid score' })

    const results = (await rget(K.results)) || {}
    if (results[matchId]) return res.status(403).json({ error: 'Match already settled' })

    const userId = String(req.tgUser.id)

    // Store in match predictions index
    const mp = (await rget(K.preds(matchId))) || {}
    mp[userId] = { home, away }
    await rset(K.preds(matchId), mp)

    // Store in user predictions
    const up = (await rget(K.upreds(userId))) || {}
    up[matchId] = { home, away, savedAt: new Date().toISOString() }
    await rset(K.upreds(userId), up)

    // Ensure user is on leaderboard with at least 0 pts
    const score = await redisExec('ZSCORE', K.leaderboard, userId)
    if (score === null) await redisExec('ZADD', K.leaderboard, 0, userId)

    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/leaderboard?limit=50
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const raw = await redisExec('ZREVRANGE', K.leaderboard, 0, limit - 1, 'WITHSCORES')
    if (!raw) return res.json([])

    const users = await loadUsers()
    const entries = []
    for (let i = 0; i < raw.length; i += 2) {
      const userId = raw[i]
      const pts = parseInt(raw[i + 1]) || 0
      const u = users[userId] || {}
      entries.push({ userId, pts, firstName: u.firstName || 'Игрок', username: u.username || null, rank: entries.length + 1 })
    }
    res.json(entries)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/me — my rank + points
app.get('/api/me', withAuth, async (req, res) => {
  try {
    const userId = String(req.tgUser.id)
    const [score, rank] = await Promise.all([
      redisExec('ZSCORE', K.leaderboard, userId),
      redisExec('ZREVRANK', K.leaderboard, userId),
    ])
    const upreds = (await rget(K.upreds(userId))) || {}
    const total = Object.keys(upreds).length
    const correct = Object.values(upreds).filter(p => p.pts === 3).length
    const partial = Object.values(upreds).filter(p => p.pts === 1).length
    res.json({
      userId,
      pts: parseInt(score) || 0,
      rank: rank != null ? rank + 1 : null,
      predictions: total,
      exact: correct,
      outcome: partial,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/score — admin: settle match result
app.post('/api/score', async (req, res) => {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== TOKEN) return res.status(403).json({ error: 'Forbidden' })
  const { matchId, home, away } = req.body
  if (!matchId || home == null || away == null) return res.status(400).json({ error: 'matchId, home, away required' })
  try {
    const count = await settleMatch(matchId, home, away)
    res.json({ ok: true, scored: count })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

const appKeyboard = (label = '📊 Открыть приложение') => ({
  reply_markup: { inline_keyboard: [[{ text: label, web_app: { url: APP_URL } }]] }
})

// ── Bot commands ───────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const { id, first_name, username } = ctx.from
  await saveUser(id, first_name, username)
  return ctx.reply(
    `🏆 *FIFA World Cup 2026*\n\nПривет, ${first_name}\\! Следи за всеми матчами, группами, бомбардирами и сделай прогноз на победителя\\.`,
    { parse_mode: 'MarkdownV2', ...appKeyboard('🔮 Открыть приложение') }
  )
})

bot.command('stats', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const users = await loadUsers()
  const count = Object.keys(users).length
  const lbCount = await redisExec('ZCARD', K.leaderboard)
  return ctx.reply(`👥 Подписчиков: *${count}*\n🏅 В лидерборде: *${lbCount || 0}*`, { parse_mode: 'Markdown' })
})

// /score m01 2:1 — зафиксировать результат и начислить очки
bot.command('score', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const raw = ctx.message.text.replace(/^\/score\s*/, '').trim()
  const match = raw.match(/^(\w+)\s+(\d+):(\d+)$/)
  if (!match) return ctx.reply('Формат: /score m01 2:1')
  const [, matchId, h, a] = match
  try {
    const count = await settleMatch(matchId, parseInt(h), parseInt(a))
    return ctx.reply(`✅ Матч ${matchId} зафиксирован ${h}:${a}\nПодсчитано прогнозов: ${count}`)
  } catch (e) {
    return ctx.reply(`❌ Ошибка: ${e.message}`)
  }
})

bot.command('send', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const text = ctx.message.text.replace(/^\/send\s*/, '').trim()
  if (!text) return ctx.reply('Укажи текст: /send Текст сообщения')
  await ctx.reply('⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.api.sendMessage(id, text, { parse_mode: 'Markdown', ...appKeyboard() })
  )
  return ctx.reply(`✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

bot.command('result', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const raw = ctx.message.text.replace(/^\/result\s*/, '').trim()
  if (!raw) return ctx.reply('Пример: /result 🇫🇷 Франция 2:1 🇧🇷 Бразилия')
  const text = `⚽ *Результат матча — ЧМ 2026*\n\n${raw}\n\nОбновлена статистика групп и бомбардиров 👇`
  await ctx.reply('⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.api.sendMessage(id, text, { parse_mode: 'Markdown', ...appKeyboard('📊 Смотреть таблицу') })
  )
  return ctx.reply(`✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

bot.command('photo', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const raw = ctx.message.text.replace(/^\/photo\s*/, '').trim()
  const [photoUrl, caption = '🏆 FIFA World Cup 2026'] = raw.split('|').map(s => s.trim())
  if (!photoUrl) return ctx.reply('Пример: /photo https://img.jpg | Текст подписи')
  await ctx.reply('⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.api.sendPhoto(id, photoUrl, { caption, parse_mode: 'Markdown', ...appKeyboard('📲 Открыть приложение') })
  )
  return ctx.reply(`✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

bot.command('help', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  return ctx.reply(
    `*Команды администратора:*\n\n` +
    `/stats — подписчики и лидерборд\n\n` +
    `/score m01 2:1 — зафиксировать результат матча\n\n` +
    `/send текст — рассылка текста\n\n` +
    `/result 🇫🇷 Франция 2:1 🇧🇷 Бразилия — объявление результата\n\n` +
    `/photo url | подпись — рассылка с фото`,
    { parse_mode: 'Markdown' }
  )
})

bot.start({
  onStart: () => console.log(`✅ WC2026 Bot running | App: ${APP_URL} | Storage: ${REDIS_URL ? 'Redis' : 'file'}`),
}).catch((err) => {
  console.error('Bot crashed:', err.message)
  process.exit(1)
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`🌐 API server on port ${PORT}`))

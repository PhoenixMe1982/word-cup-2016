const { Bot } = require('grammy')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const { lookupMatchId, normTLA } = require('./match-lookup.js')
const { toRussianName } = require('./names-ru.js')

const TOKEN    = (process.env.BOT_TOKEN || '').trim()
const FDORG_TOKEN = (process.env.FDORG_TOKEN || '').trim()
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
  scorers:     `${KEY_PREFIX}wc2026_scorers`,
  keepers:     `${KEY_PREFIX}wc2026_keepers`,
  preds:  (matchId)  => `${KEY_PREFIX}wc2026_mp:${matchId}`,
  upreds: (userId)   => `${KEY_PREFIX}wc2026_up:${userId}`,
}

const STATIC_SCORERS = [
  { rank:1,  name:'Килиан Мбаппе',        team:'FRA', club:'Real Madrid',   goals:0, assists:0, matches:0, avatar:'⚡' },
  { rank:2,  name:'Лионель Месси',         team:'ARG', club:'Inter Miami',   goals:0, assists:0, matches:0, avatar:'🐐' },
  { rank:3,  name:'Эрлинг Холанд',         team:'NOR', club:'Man City',      goals:0, assists:0, matches:0, avatar:'💥' },
  { rank:4,  name:'Криштиану Роналду',     team:'POR', club:'Al-Nassr',      goals:0, assists:0, matches:0, avatar:'🦁' },
  { rank:5,  name:'Виниций Жуниор',        team:'BRA', club:'Real Madrid',   goals:0, assists:0, matches:0, avatar:'🔥' },
  { rank:6,  name:'Харри Кейн',            team:'ENG', club:'Bayern Munich', goals:0, assists:0, matches:0, avatar:'👑' },
  { rank:7,  name:'Лаутаро Мартинес',      team:'ARG', club:'Inter Milan',   goals:0, assists:0, matches:0, avatar:'🐂' },
  { rank:8,  name:'Букайо Сака',           team:'ENG', club:'Arsenal',       goals:0, assists:0, matches:0, avatar:'⭐' },
  { rank:9,  name:'Бернарду Силва',        team:'POR', club:'Man City',      goals:0, assists:0, matches:0, avatar:'🎯' },
  { rank:10, name:'Мемфис Депай',          team:'NED', club:'Atlético',      goals:0, assists:0, matches:0, avatar:'🦁' },
  { rank:11, name:'Дарвин Нуньес',         team:'URU', club:'Liverpool',     goals:0, assists:0, matches:0, avatar:'🔫' },
  { rank:12, name:'Луис Диас',             team:'COL', club:'Liverpool',     goals:0, assists:0, matches:0, avatar:'🐆' },
  { rank:13, name:'Ришарлисон',            team:'BRA', club:'Tottenham',     goals:0, assists:0, matches:0, avatar:'🕊️' },
  { rank:14, name:'Ламин Ямаль',           team:'ESP', club:'Barcelona',     goals:0, assists:0, matches:0, avatar:'🌟' },
  { rank:15, name:'Ромелу Лукаку',         team:'BEL', club:'Napoli',        goals:0, assists:0, matches:0, avatar:'🏋️' },
]

const STATIC_KEEPERS = [
  { rank:1, name:'Эмильяно Мартинес', team:'ARG', club:'Aston Villa',   matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:9.2 },
  { rank:2, name:'Тибо Куртуа',       team:'BEL', club:'Real Madrid',   matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:9.0 },
  { rank:3, name:'Мануэль Нойер',     team:'GER', club:'Bayern Munich', matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:8.8 },
  { rank:4, name:'Эдерсон',           team:'BRA', club:'Man City',      matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:8.7 },
  { rank:5, name:'Диого Кошта',       team:'POR', club:'Porto',         matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:8.6 },
  { rank:6, name:'Джордан Пикфорд',   team:'ENG', club:'Everton',       matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:8.4 },
  { rank:7, name:'Мик Маньян',        team:'FRA', club:'AC Milan',      matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:8.3 },
  { rank:8, name:'Фернандо Муслера',  team:'URU', club:'Galatasaray',   matches:0, cleanSheets:0, minutesWithoutGoal:0, saves:0, rating:7.9 },
]

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

// Время начала матчей (UTC, ms) — парсится из src/data.js, где время указано в МСК (UTC+3).
// Нужно для серверной блокировки прогнозов: клиентскую проверку можно обойти прямым запросом.
const KICKOFFS = (() => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data.js'), 'utf8')
    const months = { 'июня': 5, 'июля': 6 }
    const map = {}
    const re = /id:\s*'(m\d+)'[^\n]*?date:\s*'(\d+)\s+([а-яё]+)'[^\n]*?time:\s*'(\d+):(\d+)\s*МСК'/g
    let m
    while ((m = re.exec(raw))) {
      const [, id, day, mon, hh, mm] = m
      if (months[mon] == null) continue
      map[id] = Date.UTC(2026, months[mon], Number(day), Number(hh) - 3, Number(mm))
    }
    console.log(`[kickoffs] parsed ${Object.keys(map).length} match kickoff times`)
    return map
  } catch (e) {
    console.warn('[kickoffs] parse failed:', e.message)
    return {}
  }
})()

function calcPoints(pred, result) {
  if (pred.home === result.home && pred.away === result.away) return 3
  const predOutcome = Math.sign(pred.home - pred.away)
  const realOutcome = Math.sign(result.home - result.away)
  return predOutcome === realOutcome ? 1 : 0
}

async function settleMatch(matchId, homeScore, awayScore) {
  const results = (await rget(K.results)) || {}

  // Idempotency guard — same score already settled, skip to avoid double-counting
  const existing = results[matchId]
  if (existing && existing.home === homeScore && existing.away === awayScore) {
    console.log(`[settle] ${matchId} already settled ${homeScore}:${awayScore}, skip`)
    return 0
  }

  const result = { home: homeScore, away: awayScore, settledAt: new Date().toISOString() }
  results[matchId] = result
  await rset(K.results, results)

  const matchPreds = (await rget(K.preds(matchId))) || {}
  for (const [userId, pred] of Object.entries(matchPreds)) {
    const pts = calcPoints(pred, result)
    // Коррекция счёта: вычитаем очки, начисленные за предыдущий результат,
    // иначе повторный зачёт задваивает очки в лидерборде
    const oldPts = existing ? calcPoints(pred, existing) : 0
    const delta = pts - oldPts
    if (delta !== 0) await redisExec('ZINCRBY', K.leaderboard, delta, userId)
    const upreds = (await rget(K.upreds(userId))) || {}
    if (upreds[matchId]) {
      upreds[matchId].pts = pts
      await rset(K.upreds(userId), upreds)
    }
  }
  console.log(`[settle] ${matchId} → ${homeScore}:${awayScore}, processed ${Object.keys(matchPreds).length} predictions`)
  return Object.keys(matchPreds).length
}

// ── Изменение позиции относительно последнего зачёта ──────────────────────
// Реконструируем рейтинг ДО последнего зачтённого матча: у текущих очков
// вычитаем баллы, полученные именно за этот матч, и пересортировываем. Так
// получаем точное «изменение позиции по отношению к последнему зачёту» без
// хранения отдельных снимков в Redis (работает сразу после деплоя).
// Возвращает map userId -> delta (prevRank - currentRank): >0 поднялся,
// <0 опустился, 0 без изменений.
async function computeRankDeltas() {
  const raw = await redisExec('ZREVRANGE', K.leaderboard, 0, -1, 'WITHSCORES')
  if (!raw || raw.length === 0) return {}
  const cur = []
  for (let i = 0; i < raw.length; i += 2) {
    cur.push({ userId: raw[i], pts: parseInt(raw[i + 1]) || 0, currentRank: cur.length + 1 })
  }

  const results = (await rget(K.results)) || {}
  let last = null
  for (const [matchId, r] of Object.entries(results)) {
    if (!r?.settledAt) continue
    if (!last || r.settledAt > last.r.settledAt) last = { matchId, r }
  }

  const deltas = {}
  if (!last) {
    for (const e of cur) deltas[e.userId] = 0
    return deltas
  }

  const lastPreds = (await rget(K.preds(last.matchId))) || {}
  const lastResult = { home: last.r.home, away: last.r.away }
  for (const e of cur) {
    const p = lastPreds[e.userId]
    e.prevPts = e.pts - (p ? calcPoints(p, lastResult) : 0)
  }
  // Тай-брейк по текущему рангу: среди равных по prevPts сохраняем текущий
  // порядок, чтобы изменение позиции возникало только из-за реальных очков.
  const prev = [...cur].sort((a, b) => b.prevPts - a.prevPts || a.currentRank - b.currentRank)
  prev.forEach((e, i) => { e.prevRank = i + 1 })
  for (const e of cur) deltas[e.userId] = e.prevRank - e.currentRank
  return deltas
}

// ── Live data poller (football-data.org, every 5 min) ─────────────────────
// Render работает 24/7 (keep-alive), поэтому setInterval здесь надёжнее,
// чем GitHub Actions cron, который GitHub троттлит до раза в несколько часов.

const FD_STATUS_MAP = {
  SCHEDULED: 'upcoming', TIMED: 'upcoming', POSTPONED: 'upcoming', CANCELLED: 'upcoming',
  IN_PLAY: 'live', PAUSED: 'live', SUSPENDED: 'live',
  FINISHED: 'finished', AWARDED: 'finished',
}

const liveState = { updated: null, matchResults: {} }

async function pollFootballData() {
  if (!FDORG_TOKEN) return
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': FDORG_TOKEN },
    })
    if (!res.ok) {
      console.error(`[live] football-data.org ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return
    }
    const data = await res.json()
    const matches = data.matches || []
    const settled = (await rget(K.results)) || {}
    const next = {}
    let liveCount = 0

    for (const m of matches) {
      const matchId = lookupMatchId(normTLA(m.homeTeam?.tla || ''), normTLA(m.awayTeam?.tla || ''))
      if (!matchId) continue

      // Зачтённый в Redis матч — источник истины: football-data.org иногда
      // временно откатывает FINISHED обратно в SCHEDULED, не даём ему понизить статус
      if (settled[matchId]) {
        next[matchId] = { status: 'finished', scoreHome: settled[matchId].home, scoreAway: settled[matchId].away }
        continue
      }

      const status = FD_STATUS_MAP[m.status] || 'upcoming'
      const entry = { status }
      const score = m.score?.fullTime?.home != null ? m.score.fullTime
        : m.score?.halfTime?.home != null ? m.score.halfTime : null
      if (score) { entry.scoreHome = score.home; entry.scoreAway = score.away }
      if (status === 'live') {
        liveCount++
        if (m.minute != null) entry.time = String(m.minute)
      }
      next[matchId] = entry

      // Авто-зачёт очков: матч завершён, счёт есть, в Redis ещё не зачтён
      if (status === 'finished' && score && !settled[matchId]) {
        try {
          const count = await settleMatch(matchId, score.home, score.away)
          if (ADMIN_ID) {
            bot.api.sendMessage(ADMIN_ID,
              `⚽ *${m.homeTeam.name} ${score.home}:${score.away} ${m.awayTeam.name}*\nПрогнозов зачтено: ${count}`,
              { parse_mode: 'Markdown' }).catch(() => {})
          }
        } catch (e) {
          console.error(`[live] settle ${matchId} failed:`, e.message)
        }
      }
    }

    liveState.matchResults = next
    liveState.updated = new Date().toISOString()
    console.log(`[live] poll ok: ${Object.keys(next).length} matches, ${liveCount} live`)
  } catch (e) {
    console.error('[live] poll failed:', e.message)
  }
}

// ── Авто-обновление бомбардиров (football-data.org /scorers, бесплатный тариф) ──
// Голы и сыгранные матчи приходят из API; ассисты free-тариф не отдаёт —
// они сохраняются из ручных правок (/scorer). Привязка по player.id (fdId).

const lastWord = (s) => s.trim().split(/\s+/).pop().toLowerCase().replace(/ё/g, 'е')

async function pollScorers() {
  if (!FDORG_TOKEN) return
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/scorers?limit=100', {
      headers: { 'X-Auth-Token': FDORG_TOKEN },
    })
    if (!res.ok) {
      console.error(`[scorers] football-data.org ${res.status}`)
      return
    }
    const data = await res.json()
    const fdScorers = data.scorers || []
    if (fdScorers.length === 0) return

    const current = (await rget(K.scorers)) || []
    const added = []
    let changed = false

    for (const s of fdScorers) {
      const fdId = s.player?.id
      const tla = normTLA(s.team?.tla || '')
      const goals = s.goals || 0
      const matches = s.playedMatches || 0
      if (!fdId || !tla) continue

      let row = current.find(r => r.fdId === fdId)
      if (!row) {
        // Игрок мог быть добавлен вручную — ищем по команде и фамилии
        const ru = toRussianName(s.player.name)
        row = current.find(r => !r.fdId && r.team === tla && lastWord(r.name) === lastWord(ru.name))
        if (row) {
          row.fdId = fdId
          changed = true
        } else {
          row = {
            rank: current.length + 1,
            name: ru.name, team: tla, club: '',
            goals: 0, assists: 0, matches: 0,
            avatar: '⚽', fdId,
          }
          current.push(row)
          added.push({ name: ru.name, tla, goals, exact: ru.exact })
          changed = true
        }
      }
      if (row.goals !== goals || row.matches !== matches) {
        row.goals = goals
        row.matches = matches
        // Ассисты free-тариф не отдаёт (null) — не трогаем ручное значение
        if (s.assists != null) row.assists = s.assists
        changed = true
      }
    }

    if (!changed) return
    current.sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    current.forEach((r, i) => { r.rank = i + 1 })
    await rset(K.scorers, current)
    console.log(`[scorers] synced: ${fdScorers.length} from API, ${added.length} new`)

    if (added.length > 0 && ADMIN_ID) {
      const lines = added.map(a =>
        `⚽ ${a.name} (${a.tla}) — ${a.goals} гол.` +
        (a.exact ? '' : '\n⚠️ имя транслитерировано автоматически — проверь: /scorer ren N Имя')
      )
      bot.api.sendMessage(ADMIN_ID, `🥅 *Новые бомбардиры (авто)*\n\n${lines.join('\n')}`,
        { parse_mode: 'Markdown' }).catch(() => {})
    }
  } catch (e) {
    console.error('[scorers] poll failed:', e.message)
  }
}

// GET /api/live — текущее состояние всех матчей (статусы + счёт)
// Регистрируется ниже, после создания app.

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

// GET /api/live — live match state polled from football-data.org every 5 min
app.get('/api/live', (_, res) => res.json(liveState))

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

    // Серверная блокировка: после стартового свистка прогноз не принимается
    const kickoff = KICKOFFS[matchId]
    if (kickoff && Date.now() >= kickoff)
      return res.status(403).json({ error: 'Матч уже начался — приём прогнозов закрыт' })

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

    // Save user profile so leaderboard shows real name
    const { first_name, username } = req.tgUser
    await saveUser(userId, first_name, username)

    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/leaderboard?limit=50
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const raw = await redisExec('ZREVRANGE', K.leaderboard, 0, limit - 1, 'WITHSCORES')
    if (!raw) return res.json([])

    const [users, deltas] = await Promise.all([loadUsers(), computeRankDeltas()])
    const entries = []
    for (let i = 0; i < raw.length; i += 2) {
      const userId = raw[i]
      const pts = parseInt(raw[i + 1]) || 0
      const u = users[userId] || {}
      entries.push({ userId, pts, firstName: u.firstName || 'Игрок', username: u.username || null, rank: entries.length + 1, rankDelta: deltas[userId] ?? null })
    }
    res.json(entries)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/scorers — top scorers (Redis override or null → frontend uses static)
app.get('/api/scorers', async (_, res) => {
  try {
    const data = await rget(K.scorers)
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/goalkeepers — goalkeeper stats (Redis override or null → frontend uses static)
app.get('/api/goalkeepers', async (_, res) => {
  try {
    const data = await rget(K.keepers)
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/me — my rank + points
app.get('/api/me', withAuth, async (req, res) => {
  try {
    const userId = String(req.tgUser.id)
    const [score, rank, deltas] = await Promise.all([
      redisExec('ZSCORE', K.leaderboard, userId),
      redisExec('ZREVRANK', K.leaderboard, userId),
      computeRankDeltas(),
    ])
    const upreds = (await rget(K.upreds(userId))) || {}
    const total = Object.keys(upreds).length
    const correct = Object.values(upreds).filter(p => p.pts === 3).length
    const partial = Object.values(upreds).filter(p => p.pts === 1).length
    res.json({
      userId,
      pts: parseInt(score) || 0,
      rank: rank != null ? rank + 1 : null,
      rankDelta: deltas[userId] ?? null,
      predictions: total,
      exact: correct,
      outcome: partial,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/predictions/:userId — public, settled predictions for any user
app.get('/api/predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const [upreds, results] = await Promise.all([
      rget(K.upreds(userId)),
      rget(K.results),
    ])
    const allPreds = upreds || {}
    const allResults = results || {}
    const settled = Object.entries(allPreds)
      .filter(([, p]) => p.pts !== undefined)
      .map(([matchId, p]) => ({
        matchId,
        pred: { home: p.home, away: p.away },
        result: allResults[matchId] ? { home: allResults[matchId].home, away: allResults[matchId].away } : null,
        pts: p.pts,
      }))
    res.json(settled)
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

// /score m01 2:1 — зафиксировать точный счёт оконченного матча:
// показать цифры в «оконченных» в аппке + сверить очки лидерборда.
// settleMatch идемпотентна и delta-безопасна: повторный/корректирующий ввод
// НЕ задваивает очки (если счёт тот же — лидерборд не меняется).
bot.command('score', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const raw = ctx.message.text.replace(/^\/score\s*/, '').trim()
  const match = raw.match(/^(\w+)\s+(\d+):(\d+)$/)
  if (!match) return ctx.reply('Формат: /score m01 2:1')
  const [, matchId, hs, as] = match
  const h = parseInt(hs), a = parseInt(as)
  try {
    const count = await settleMatch(matchId, h, a)
    // Мгновенно отражаем счёт в аппке, не дожидаясь следующего поллинга (≤5 мин).
    // На последующих циклах поллер подтвердит это из results (источник истины).
    liveState.matchResults[matchId] = { status: 'finished', scoreHome: h, scoreAway: a }
    return ctx.reply(
      `✅ Матч ${matchId}: ${h}:${a}\n` +
      `• Счёт показан в «оконченных» в аппке (сразу; в Telegram перезайди в мини-апп, если кэш).\n` +
      `• Прогнозов сверено: ${count}. Очки delta-безопасны — задвоения нет.`
    )
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

// Обрабатывает одну строку команды /scorer; мутирует current, возвращает текст ответа
function applyScorerLine(args, current) {
  // add Имя TLA голы ассисты [матчи]
  if (args.toLowerCase().startsWith('add ')) {
    const parts = args.slice(4).trim().split(/\s+/)
    // Формат: последние 2-3 — числа; перед ними — TLA (3-4 буквы); перед TLA — имя
    const numParts = []
    let i = parts.length - 1
    while (i >= 0 && !isNaN(parseInt(parts[i]))) { numParts.unshift(parseInt(parts[i])); i-- }
    const tla  = parts[i] ? parts[i].toUpperCase() : null
    const name = parts.slice(0, i).join(' ')
    if (!name || !tla || numParts.length < 2)
      return '❌ Формат: /scorer add Имя TLA голы ассисты [матчи]'
    current.push({
      rank: current.length + 1,
      name, team: tla, club: '',
      goals: numParts[0], assists: numParts[1], matches: numParts[2] ?? 0,
      avatar: '⚽',
    })
    return `✅ Добавлен: ${name} (${tla}) ⚽${numParts[0]} 🅰️${numParts[1]} 🎮${numParts[2] ?? 0}`
  }

  // del N — удалить игрока по номеру
  if (args.toLowerCase().startsWith('del ')) {
    const n = parseInt(args.slice(4))
    if (!n || n < 1 || n > current.length)
      return `❌ del: номер игрока от 1 до ${current.length}`
    const [removed] = current.splice(n - 1, 1)
    return `🗑 Удалён: ${removed.name} (${removed.team})`
  }

  // ren N Новое Имя — переименовать (привязка fdId к API сохраняется)
  if (args.toLowerCase().startsWith('ren ')) {
    const m = args.slice(4).trim().match(/^(\d+)\s+(.+)$/)
    if (!m) return '❌ Формат: /scorer ren N Новое Имя'
    const n = parseInt(m[1])
    if (!n || n < 1 || n > current.length)
      return `❌ ren: номер игрока от 1 до ${current.length}`
    const old = current[n - 1].name
    current[n - 1].name = m[2].trim()
    return `✏️ ${old} → ${current[n - 1].name}`
  }

  // N голы ассисты [матчи] — обновить игрока
  const parts = args.split(/\s+/)
  const idx = parseInt(parts[0])
  if (!idx || idx < 1 || idx > current.length)
    return `❌ Номер игрока от 1 до ${current.length}. Добавить: /scorer add Имя TLA голы ассисты · Удалить: /scorer del N`
  const goals   = parseInt(parts[1])
  const assists = parseInt(parts[2])
  const matches = parseInt(parts[3])
  if (isNaN(goals) || isNaN(assists)) return '❌ Формат: /scorer N голы ассисты [матчи]'
  const player = current[idx - 1]
  player.goals = goals
  player.assists = assists
  if (!isNaN(matches)) player.matches = matches
  return `✅ ${player.name}: ⚽${player.goals} 🅰️${player.assists} 🎮${player.matches}`
}

bot.command('scorer', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const current = (await rget(K.scorers)) || []

  // Каждая строка сообщения — отдельная команда: можно вставлять пакетом
  const lines = ctx.message.text.split('\n')
    .map(l => l.replace(/^\/scorer(@\S+)?\s*/i, '').trim())
    .filter((l, i) => i === 0 || l)

  if (lines.length === 1 && !lines[0]) {
    // Лимит сообщения Telegram — 4096 символов. После автосинка бомбардиров
    // бывает 100+ игроков → полный список не влезает и ctx.reply падает с 400.
    // Режем по бюджету символов, сохраняя РЕАЛЬНЫЕ номера (правка по /scorer N
    // остаётся валидной для любого индекса). Plain-текст: имена из API могут
    // содержать спецсимволы legacy-Markdown.
    let out = ''
    let shown = 0
    for (let i = 0; i < current.length; i++) {
      const s = current[i]
      const line = `${i + 1}. ${s.name} (${s.team}) — ⚽${s.goals} 🅰️${s.assists} 🎮${s.matches}\n`
      if (out.length + line.length > 3500) break
      out += line
      shown++
    }
    const more = current.length - shown
    return ctx.reply(
      `Бомбардиры (${current.length}):\n\n${current.length ? out : '— пусто —\n'}` +
      (more > 0 ? `…и ещё ${more}. Правь по номеру напрямую: /scorer N голы ассисты\n` : '') +
      `\n📝 Обновить: /scorer N голы ассисты [матчи]\n` +
      `➕ Добавить: /scorer add Имя TLA голы ассисты [матчи]\n` +
      `🗑 Удалить: /scorer del N · ✏️ Имя: /scorer ren N Имя`
    )
  }

  const replies = lines.filter(Boolean).map(line => applyScorerLine(line, current))
  current.sort((a, b) => b.goals - a.goals || b.assists - a.assists)
  current.forEach((s, i) => { s.rank = i + 1 })
  await rset(K.scorers, current)
  return ctx.reply(replies.join('\n'))
})

bot.command('scorer_reset', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  await rset(K.scorers, [])
  return ctx.reply('✅ Список бомбардиров очищен')
})

bot.command('keeper', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const args = ctx.message.text.replace(/^\/keeper\s*/, '').trim()
  const current = (await rget(K.keepers)) || STATIC_KEEPERS.map(k => ({ ...k }))

  if (!args) {
    const lines = current.map((k, i) =>
      `${i + 1}. ${k.name} (${k.team}) — 🧤${k.cleanSheets} ⏱${k.minutesWithoutGoal}мин 🎮${k.matches}`
    )
    // Plain-текст: имена вратарей могут содержать спецсимволы legacy-Markdown.
    return ctx.reply(
      `Вратари:\n\n${lines.join('\n')}\n\n📝 Обновить: /keeper N сухие минуты матчи`
    )
  }

  const parts = args.split(/\s+/)
  const idx = parseInt(parts[0])
  if (!idx || idx < 1 || idx > current.length)
    return ctx.reply(`❌ Номер вратаря от 1 до ${current.length}`)

  const cleanSheets         = parseInt(parts[1])
  const minutesWithoutGoal  = parseInt(parts[2])
  const matches             = parseInt(parts[3])
  if (isNaN(cleanSheets) || isNaN(minutesWithoutGoal))
    return ctx.reply('❌ Формат: /keeper N сухие минуты [матчи]')

  const keeper = current[idx - 1]
  keeper.cleanSheets        = cleanSheets
  keeper.minutesWithoutGoal = minutesWithoutGoal
  if (!isNaN(matches)) keeper.matches = matches

  current.sort((a, b) => b.cleanSheets - a.cleanSheets || b.minutesWithoutGoal - a.minutesWithoutGoal)
  current.forEach((k, i) => { k.rank = i + 1 })

  await rset(K.keepers, current)
  return ctx.reply(`✅ ${keeper.name}: 🧤${keeper.cleanSheets} ⏱${keeper.minutesWithoutGoal}мин 🎮${keeper.matches}`)
})

bot.command('help', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  return ctx.reply(
    `*Команды администратора:*\n\n` +
    `/stats — подписчики и лидерборд\n\n` +
    `/score m01 2:1 — зафиксировать результат матча\n\n` +
    `/scorer — список бомбардиров\n` +
    `/scorer N голы ассисты [матчи] — обновить игрока #N\n` +
    `/scorer add Имя TLA голы ассисты [матчи] — добавить нового\n\n` +
    `/keeper — список вратарей\n` +
    `/keeper N сухие минуты [матчи] — обновить вратаря #N\n\n` +
    `/send текст — рассылка текста\n\n` +
    `/result 🇫🇷 Франция 2:1 🇧🇷 Бразилия — объявление результата\n\n` +
    `/photo url | подпись — рассылка с фото\n\n` +
    `💡 *Или просто отправь любое сообщение/фото — автоматически уйдёт всем*`,
    { parse_mode: 'Markdown' }
  )
})

// Any non-command message from admin → broadcast to all subscribers
bot.on('message', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return
  if (ctx.message.text?.startsWith('/')) return

  await ctx.reply('⏳ Рассылка...')

  let broadcastFn

  if (ctx.message.photo) {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
    const caption = ctx.message.caption || ''
    broadcastFn = (id) => bot.api.sendPhoto(id, fileId, {
      caption, parse_mode: 'Markdown', ...appKeyboard('📲 Открыть приложение'),
    })
  } else if (ctx.message.text) {
    const text = ctx.message.text
    broadcastFn = (id) => bot.api.sendMessage(id, text, {
      parse_mode: 'Markdown', ...appKeyboard(),
    })
  } else if (ctx.message.video) {
    const fileId = ctx.message.video.file_id
    const caption = ctx.message.caption || ''
    broadcastFn = (id) => bot.api.sendVideo(id, fileId, {
      caption, parse_mode: 'Markdown', ...appKeyboard('📲 Открыть приложение'),
    })
  } else {
    return ctx.reply('⚠️ Поддерживаются текст, фото и видео')
  }

  const { sent, failed, total } = await broadcast(broadcastFn)
  return ctx.reply(`✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

// Глобальная страховка: если обработчик команды бросит исключение (например,
// Telegram отверг Markdown-сообщение), бот раньше «молчал». Теперь логируем и
// сообщаем пользователю, что команда не выполнена — не оставляем в тишине.
bot.catch((err) => {
  const cmd = err.ctx?.message?.text || err.ctx?.update?.message?.text || '?'
  console.error(`[bot] handler error on "${cmd}":`, err.error?.message || err.error)
  err.ctx?.reply?.('⚠️ Команда не выполнена (ошибка форматирования или сети). Попробуй ещё раз.')
    .catch(() => {})
})

// Чистый long-polling: если на боте зачем-то выставлен webhook, getUpdates даёт
// 409 НАВСЕГДА (переживает рестарт) — команды не доходят. Снимаем вебхук перед
// стартом и стартуем с drop_pending_updates, чтобы не разгребать накопленную
// очередь. Если причина — второй потребитель getUpdates (дубль-инстанс), это
// видно в логе onStart-ошибки и в /api/_debug/bot (last_error_message).
async function startBot() {
  try {
    const info = await bot.api.getWebhookInfo()
    if (info.url) {
      console.warn(`[bot] webhook был выставлен (${info.url}) — снимаю для long-polling`)
    }
    await bot.api.deleteWebhook({ drop_pending_updates: false })
  } catch (e) {
    console.error('[bot] webhook check/delete failed:', e.message)
  }
  bot.start({
    drop_pending_updates: true,
    onStart: () => console.log(`✅ WC2026 Bot running | App: ${APP_URL} | Storage: ${REDIS_URL ? 'Redis' : 'file'}`),
  }).catch((err) => {
    console.error('Bot crashed:', err.message)
    if (err.message?.includes('409')) {
      console.error('409 Conflict — webhook или дубль-инстанс держит getUpdates. API stays up.')
    } else {
      process.exit(1)
    }
  })
}
startBot()

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`🌐 API server on port ${PORT}`))

if (FDORG_TOKEN) {
  pollFootballData()
  pollScorers()
  setInterval(pollFootballData, 5 * 60 * 1000)
  setInterval(pollScorers, 5 * 60 * 1000)
  console.log('⚽ Live poller started (football-data.org, every 5 min)')
} else {
  console.warn('⚠️ FDORG_TOKEN not set — live poller disabled, /api/live will be empty')
}

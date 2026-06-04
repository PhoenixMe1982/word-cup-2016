const { Bot } = require('grammy')
const fs = require('fs')
const path = require('path')

const TOKEN    = (process.env.BOT_TOKEN || '').trim()
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10)
const APP_URL  = (process.env.APP_URL || 'https://phoenixme1982.github.io/word-cup-2016/').trim()
const USERS_FILE = path.join(__dirname, 'users.json')

if (!TOKEN) { console.error('BOT_TOKEN not set'); process.exit(1) }

const bot = new Bot(TOKEN)

// ── Storage ────────────────────────────────────────────────────────────────

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) }
  catch { return {} }
}

function saveUser(chatId, firstName, username) {
  const users = loadUsers()
  if (!users[chatId]) {
    users[chatId] = { chatId, firstName, username, joinedAt: new Date().toISOString() }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    console.log(`New user: ${firstName} (@${username}) — total: ${Object.keys(users).length}`)
  }
}

function removeUser(chatId) {
  const users = loadUsers()
  delete users[chatId]
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

// ── Broadcast helper ───────────────────────────────────────────────────────

async function broadcast(sendFn) {
  const users = loadUsers()
  const ids = Object.keys(users)
  let sent = 0, failed = 0

  for (const id of ids) {
    try {
      await sendFn(id)
      sent++
    } catch (e) {
      if (e.error_code === 403) removeUser(id)
      failed++
    }
    await new Promise(r => setTimeout(r, 50))
  }
  return { sent, failed, total: ids.length }
}

const appKeyboard = (label = '📊 Открыть приложение') => ({
  reply_markup: {
    inline_keyboard: [[{ text: label, web_app: { url: APP_URL } }]]
  }
})

// ── Commands ───────────────────────────────────────────────────────────────

bot.command('start', (ctx) => {
  const { id, first_name, username } = ctx.from
  saveUser(id, first_name, username)
  return ctx.reply(
    `🏆 *FIFA World Cup 2026*\n\nПривет, ${first_name}\\! Следи за всеми матчами, группами, бомбардирами и сделай прогноз на победителя\\.`,
    { parse_mode: 'MarkdownV2', ...appKeyboard('🔮 Открыть приложение') }
  )
})

bot.command('stats', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const count = Object.keys(loadUsers()).length
  return ctx.reply(`👥 Подписчиков: *${count}*`, { parse_mode: 'Markdown' })
})

// /send текст — рассылка текста
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

// /result 🇫🇷 Франция 2:1 🇧🇷 Бразилия — карточка результата
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

// /photo url | подпись — фото + кнопка
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
    `/stats — кол-во подписчиков\n\n` +
    `/send текст — рассылка текста\n\n` +
    `/result 🇫🇷 Франция 2:1 🇧🇷 Бразилия — результат матча\n\n` +
    `/photo url | подпись — рассылка с фото`,
    { parse_mode: 'Markdown' }
  )
})

bot.start({
  onStart: () => console.log(`✅ WC2026 Bot running | App: ${APP_URL}`),
}).catch((err) => {
  // 409 happens when a previous instance is still polling — exit so Render restarts cleanly
  console.error('Bot crashed:', err.message)
  process.exit(1)
})

// HTTP-сервер нужен для Render Web Service (free tier)
const http = require('http')
const PORT = process.env.PORT || 10000
http.createServer((_, res) => { res.writeHead(200); res.end('OK') }).listen(PORT, () => {
  console.log(`🌐 Health server on port ${PORT}`)
})

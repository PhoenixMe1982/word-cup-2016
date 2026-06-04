const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')

const TOKEN    = process.env.BOT_TOKEN
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10)
const APP_URL  = process.env.APP_URL || 'https://phoenixme1982.github.io/word-cup-2016/'
const USERS_FILE = path.join(__dirname, 'users.json')

if (!TOKEN) { console.error('BOT_TOKEN not set'); process.exit(1) }

const bot = new TelegramBot(TOKEN, { polling: true })

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
      // 403 = user blocked the bot
      if (e.response?.statusCode === 403) removeUser(id)
      failed++
    }
    // Telegram rate limit: ~30 msg/sec — safe at 50ms delay
    await new Promise(r => setTimeout(r, 50))
  }
  return { sent, failed, total: ids.length }
}

// ── App keyboard ───────────────────────────────────────────────────────────

const appButton = (label = '📊 Открыть приложение') => ({
  reply_markup: {
    inline_keyboard: [[{ text: label, web_app: { url: APP_URL } }]]
  }
})

// ── Commands ───────────────────────────────────────────────────────────────

// /start — subscribe
bot.onText(/\/start/, (msg) => {
  const { id, first_name, username } = msg.from
  saveUser(id, first_name, username)

  bot.sendMessage(id,
    `🏆 *FIFA World Cup 2026*\n\nПривет, ${first_name}! Следи за всеми матчами, группами, бомбардирами и сделай прогноз на победителя турнира.`,
    { parse_mode: 'Markdown', ...appButton('🔮 Открыть приложение') }
  )
})

// /stats — admin: subscriber count
bot.onText(/\/stats/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return
  const users = loadUsers()
  const count = Object.keys(users).length
  bot.sendMessage(msg.chat.id, `👥 Подписчиков: *${count}*`, { parse_mode: 'Markdown' })
})

// /send <текст> — admin: text broadcast
// Пример: /send 🔥 Через час стартует матч открытия! Не пропусти!
bot.onText(/\/send (.+)/s, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return
  const text = match[1]

  bot.sendMessage(msg.chat.id, '⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.sendMessage(id, text, { parse_mode: 'Markdown', ...appButton() })
  )
  bot.sendMessage(msg.chat.id, `✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

// /result <флаг> <команда> <счёт> <флаг> <команда> [группа]
// Пример: /result 🇫🇷 Франция 2:1 🇧🇷 Бразилия Группа I
bot.onText(/\/result (.+)/s, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return
  const raw = match[1].trim()

  // Форматируем красивую карточку результата
  const text =
    `⚽ *Результат матча — ЧМ 2026*\n\n` +
    `${raw}\n\n` +
    `Обновлена статистика групп и бомбардиров 👇`

  bot.sendMessage(msg.chat.id, '⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.sendMessage(id, text, { parse_mode: 'Markdown', ...appButton('📊 Смотреть таблицу') })
  )
  bot.sendMessage(msg.chat.id, `✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

// /photo <url> | <подпись> — admin: фото + подпись + кнопка
// Пример: /photo https://example.com/banner.jpg | 🔥 Финал уже сегодня!
bot.onText(/\/photo (.+)/s, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return
  const [photoUrl, caption = '🏆 FIFA World Cup 2026'] = match[1].split('|').map(s => s.trim())

  bot.sendMessage(msg.chat.id, '⏳ Рассылка...')
  const { sent, failed, total } = await broadcast((id) =>
    bot.sendPhoto(id, photoUrl, {
      caption,
      parse_mode: 'Markdown',
      ...appButton('📲 Открыть приложение'),
    })
  )
  bot.sendMessage(msg.chat.id, `✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
})

// /help — admin: список команд
bot.onText(/\/help/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return
  bot.sendMessage(msg.chat.id,
    `*Команды администратора:*\n\n` +
    `/stats — кол-во подписчиков\n\n` +
    `/send текст — текстовая рассылка\n_Пример: /send 🔥 Матч через час!_\n\n` +
    `/result флаг команда счёт флаг команда — результат матча\n_Пример: /result 🇫🇷 Франция 2:1 🇧🇷 Бразилия_\n\n` +
    `/photo url | подпись — рассылка с фото\n_Пример: /photo https://img.jpg | 🏆 Финал!_`,
    { parse_mode: 'Markdown' }
  )
})

console.log(`✅ WC2026 Bot started | App: ${APP_URL}`)

const { Bot } = require('grammy')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const { MATCH_LOOKUP, lookupMatchId, normTLA, isKnockoutMatchId, extractFinalResult, liveDisplayScore } = require('./match-lookup.js')
const { calcPointsKnockout } = require('./scoring.js')
const { toRussianName } = require('./names-ru.js')

const TOKEN    = (process.env.BOT_TOKEN || '').trim()
const FDORG_TOKEN = (process.env.FDORG_TOKEN || '').trim()
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10)
const APP_URL  = (process.env.APP_URL || 'https://phoenixme1982.github.io/word-cup-2016/').trim()
// Гейт фичи плей-офф. Фича выкачена (отмашка дана) — по умолчанию ВКЛ: unset
// трактуется как включено, явное KNOCKOUT_ENABLED=0/false/no выключает приём
// нокаут-прогнозов. Согласовано с фронтом KNOCKOUT_LIVE=true в src/data.js.
const KNOCKOUT_ENABLED = !['0', 'false', 'no'].includes((process.env.KNOCKOUT_ENABLED || '').trim().toLowerCase())
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
  // Нокаут — отдельная стек-ветка (этап 2). Срабатывает ТОЛЬКО когда результат
  // помечен knockout: на групповых матчах флага нет → логика ниже не меняется.
  if (result.knockout) return calcPointsKnockout(pred, result)
  if (pred.home === result.home && pred.away === result.away) return 3
  const predOutcome = Math.sign(pred.home - pred.away)
  const realOutcome = Math.sign(result.home - result.away)
  return predOutcome === realOutcome ? 1 : 0
}

// Резолв победителя пары для ручного зачёта (/score). Принимает HOME/AWAY/H/A
// либо TLA одной из команд (резолвится через обратный MATCH_LOOKUP). Возвращает
// FD-формат 'HOME_TEAM'|'AWAY_TEAM' или null, если токен не распознан.
function resolveWinnerSide(matchId, tok) {
  const t = String(tok).toUpperCase()
  if (t === 'HOME' || t === 'H') return 'HOME_TEAM'
  if (t === 'AWAY' || t === 'A') return 'AWAY_TEAM'
  const pair = Object.keys(MATCH_LOOKUP).find((k) => MATCH_LOOKUP[k] === matchId)
  if (!pair) return null
  const [homeTLA, awayTLA] = pair.split('_')
  if (normTLA(t) === homeTLA) return 'HOME_TEAM'
  if (normTLA(t) === awayTLA) return 'AWAY_TEAM'
  return null
}

async function settleMatch(matchId, homeScore, awayScore, meta = {}) {
  const results = (await rget(K.results)) || {}

  // Idempotency guard — same score already settled, skip to avoid double-counting.
  // Очки зависят только от home/away, поэтому сверяем именно их. Доп. метаданные
  // (пенальти/победитель/длительность) дописываем даже при том же счёте — они
  // влияют лишь на отображение карточки, не на лидерборд.
  const existing = results[matchId]
  if (existing && existing.home === homeScore && existing.away === awayScore) {
    const merged = { ...existing, ...meta }
    if (JSON.stringify(merged) === JSON.stringify(existing)) {
      console.log(`[settle] ${matchId} already settled ${homeScore}:${awayScore}, no change`)
      return 0
    }
    results[matchId] = merged
    await rset(K.results, results)
    // На группе мета (penHome/winner/duration) — только отображение, очки не
    // зависят. На нокауте winner/reg/et ВЛИЯЮТ на очки (балл за серию + проход),
    // поэтому при их правке переначисляем delta-безопасно (как при коррекции
    // счёта). Иначе доустановка winner не доехала бы до лидерборда.
    if (!merged.knockout) {
      console.log(`[settle] ${matchId} meta refreshed (group), no rescore`)
      return 0
    }
    const koPreds = (await rget(K.preds(matchId))) || {}
    let rescored = 0
    for (const [userId, pred] of Object.entries(koPreds)) {
      const pts = calcPoints(pred, merged)
      const delta = pts - calcPoints(pred, existing)
      if (delta !== 0) { await redisExec('ZINCRBY', K.leaderboard, delta, userId); rescored++ }
      const upreds = (await rget(K.upreds(userId))) || {}
      if (upreds[matchId]) { upreds[matchId].pts = pts; await rset(K.upreds(userId), upreds) }
    }
    console.log(`[settle] ${matchId} knockout meta changed → rescored ${rescored}/${Object.keys(koPreds).length}`)
    return rescored
  }

  const result = { home: homeScore, away: awayScore, settledAt: new Date().toISOString(), ...meta }
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

// ── Разовая миграция: проставить winner застрявшим сериям пенальти ──────────
// m74 (GER-PAR) и m75 (NED-MAR) зафиксировались от FD без winner (серия пришла
// ничьей) → балл за серию и страховка за проход не начислились никому. Здесь
// проставляем реального прошедшего (оба раза — AWAY); settleMatch на том же
// счёте делает delta-переначисление. Идемпотентно: гард-флаг в Redis + пропуск
// матчей, у которых winner уже есть. После одного успешного прогона можно убрать.
const KO_PENS_WINNER_FIXES = [
  { id: 'm75', winner: 'AWAY_TEAM' }, // Нидерланды—Марокко → прошло Марокко
  { id: 'm74', winner: 'AWAY_TEAM' }, // Германия—Парагвай → прошёл Парагвай
]
async function migrateKnockoutPensWinner() {
  if (!REDIS_URL || !REDIS_TOKEN) return
  const FLAG = `${KEY_PREFIX}wc2026_migration:ko-pens-winner-v1`
  try {
    if (await rget(FLAG)) return
    const results = (await rget(K.results)) || {}
    for (const f of KO_PENS_WINNER_FIXES) {
      const r = results[f.id]
      if (!r) { console.log(`[migrate] ${f.id} нет в results — пропуск`); continue }
      if (r.winner) { console.log(`[migrate] ${f.id} уже winner=${r.winner} — пропуск`); continue }
      const meta = { knockout: true, winner: f.winner, duration: 'PENALTY_SHOOTOUT' }
      const n = await settleMatch(f.id, r.home, r.away, meta)
      console.log(`[migrate] ${f.id} winner=${f.winner} → переначислено прогнозов: ${n}`)
    }
    await rset(FLAG, { done: true, at: new Date().toISOString() })
    console.log('[migrate] ko-pens-winner-v1 завершена')
  } catch (e) {
    console.error('[migrate] ko-pens-winner-v1 ошибка:', e.message)
  }
}

// ── Разовая миграция: исправить счёт m83 (POR-CRO) 2:2 → 2:1 ────────────────
// football-data зачёл поздний гол Хорватии, ОТМЕНЁННЫЙ судьёй (третий случай
// после m37/m65) → в results попало 2:2 c winner=DRAW, невозможным для нокаута:
// никому не начислилась страховка за проход, сетка не продвигала Португалию.
// Реально: 2:1 в основное время (победный гол Рамоша в компенсированное).
// settleMatch на новом счёте delta-переначисляет от прежнего 2:2.
async function migrateM83Correction() {
  if (!REDIS_URL || !REDIS_TOKEN) return
  const FLAG = `${KEY_PREFIX}wc2026_migration:m83-score-v1`
  try {
    if (await rget(FLAG)) return
    const results = (await rget(K.results)) || {}
    if (results.m83) {
      const meta = { knockout: true, reg: { home: 2, away: 1 }, winner: 'HOME_TEAM' }
      const n = await settleMatch('m83', 2, 1, meta)
      liveState.matchResults.m83 = { status: 'finished', scoreHome: 2, scoreAway: 1, winner: 'HOME_TEAM' }
      console.log(`[migrate] m83 счёт 2:2→2:1 (POR прошла) → переначислено прогнозов: ${n}`)
    } else {
      console.log('[migrate] m83 нет в results — пропуск')
    }
    await rset(FLAG, { done: true, at: new Date().toISOString() })
    console.log('[migrate] m83-score-v1 завершена')
  } catch (e) {
    console.error('[migrate] m83-score-v1 ошибка:', e.message)
  }
}

// ── Разовая миграция: зачесть m88 (AUS-EGY) — серия пенальти ────────────────
// FD отдал fullTime кумулятивом 3:5 (1+2 : 1+4) без достоверного regularTime →
// гейт корректно удержал матч (не зафиксировал кривой счёт), но авто-зачёта не
// будет, пока FD не починит поля. Реально (подтверждено админом): 90′ 1:1,
// 120′ 1:1, серия 2:4 — прошёл ЕГИПЕТ. Фиксируем вручную с полной метой.
async function migrateM88Pens() {
  if (!REDIS_URL || !REDIS_TOKEN) return
  const FLAG = `${KEY_PREFIX}wc2026_migration:m88-pens-v1`
  try {
    if (await rget(FLAG)) return
    const results = (await rget(K.results)) || {}
    if (!results.m88) {
      const meta = {
        knockout: true, duration: 'PENALTY_SHOOTOUT',
        reg: { home: 1, away: 1 }, et: { home: 1, away: 1 },
        penHome: 2, penAway: 4, winner: 'AWAY_TEAM',
      }
      const n = await settleMatch('m88', 1, 1, meta)
      liveState.matchResults.m88 = {
        status: 'finished', scoreHome: 1, scoreAway: 1,
        penHome: 2, penAway: 4, winner: 'AWAY_TEAM', duration: 'PENALTY_SHOOTOUT',
      }
      console.log(`[migrate] m88 1:1 пен 2:4 (EGY прошёл) → зачтено прогнозов: ${n}`)
    } else {
      console.log('[migrate] m88 уже в results — пропуск')
    }
    await rset(FLAG, { done: true, at: new Date().toISOString() })
    console.log('[migrate] m88-pens-v1 завершена')
  } catch (e) {
    console.error('[migrate] m88-pens-v1 ошибка:', e.message)
  }
}

// ── Разовая миграция: починить разбивку 90′/120′ у m82 (BEL-SEN) ────────────
// FD прислал мусорную разбивку (reg 3:2, et 4:2 при итоге 3:2, без duration).
// Реально: 90′ 2:2 → доп. время 3:2 (Бельгия прошла). Неверный reg искажал зачёт
// за 90′. Проставляем верные reg/et/duration; settleMatch delta-переначисляет.
async function migrateM82ExtraTime() {
  if (!REDIS_URL || !REDIS_TOKEN) return
  const FLAG = `${KEY_PREFIX}wc2026_migration:m82-et-v1`
  try {
    if (await rget(FLAG)) return
    const results = (await rget(K.results)) || {}
    const r = results.m82
    if (r) {
      const meta = {
        knockout: true, duration: 'EXTRA_TIME',
        reg: { home: 2, away: 2 }, et: { home: 3, away: 2 }, winner: 'HOME_TEAM',
      }
      const n = await settleMatch('m82', 3, 2, meta) // итог за 120′ = 3:2
      console.log(`[migrate] m82 доп.время 2:2→3:2 → переначислено прогнозов: ${n}`)
    } else {
      console.log('[migrate] m82 нет в results — пропуск')
    }
    await rset(FLAG, { done: true, at: new Date().toISOString() })
    console.log('[migrate] m82-et-v1 завершена')
  } catch (e) {
    console.error('[migrate] m82-et-v1 ошибка:', e.message)
  }
}

// ── Ранжирование лидерборда с тай-брейками ────────────────────────────────
// Очки в Redis (sorted set) задают основной порядок, но при равенстве очков
// Redis сортирует лексикографически по userId (фактически случайно). Поэтому
// финальный порядок считаем в JS по каскаду тай-брейков (см. compareRank).

// Подгружаем по каждому участнику лидерборда статистику для тай-брейков:
// pts (из sorted set), число точных счетов (+3), число ЗАСЧИТАННЫХ прогнозов
// (у которых уже определён pts) и время первого прогноза (min savedAt).
async function loadRankingStats() {
  const raw = await redisExec('ZREVRANGE', K.leaderboard, 0, -1, 'WITHSCORES')
  if (!raw || raw.length === 0) return []
  const ids = []
  const ptsById = {}
  for (let i = 0; i < raw.length; i += 2) {
    ids.push(raw[i])
    ptsById[raw[i]] = parseInt(raw[i + 1]) || 0
  }
  const upredsList = await Promise.all(ids.map((id) => rget(K.upreds(id))))
  return ids.map((userId, idx) => {
    const up = upredsList[idx] || {}
    let exact = 0, settled = 0, firstAt = Infinity
    for (const p of Object.values(up)) {
      if (p.pts !== undefined) { settled++; if (p.pts === 3) exact++ }
      if (p.savedAt) {
        const t = Date.parse(p.savedAt)
        if (!Number.isNaN(t) && t < firstAt) firstAt = t
      }
    }
    return { userId, pts: ptsById[userId], exact, settled, firstAt }
  })
}

// Каскад приоритетов среди равных по очкам — следующий пункт сравнивается
// только при равенстве предыдущего:
//   1) больше точных счетов (прогнозов на +3);
//   2) больше засчитанных прогнозов;
//   3) раньше сделан первый прогноз (меньший savedAt);
//   4) стабильный фолбэк по userId (чтобы порядок не «прыгал»).
function compareRank(a, b) {
  return (b.pts - a.pts)
    || (b.exact - a.exact)
    || (b.settled - a.settled)
    || (a.firstAt - b.firstAt)
    || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0)
}

// ── Изменение позиции относительно последнего зачёта ──────────────────────
// Реконструируем рейтинг ДО последнего зачтённого матча: у текущих очков
// вычитаем баллы, полученные именно за этот матч, и пересортировываем. Так
// получаем точное «изменение позиции по отношению к последнему зачёту» без
// хранения отдельных снимков в Redis (работает сразу после деплоя).
// Возвращает map userId -> delta (prevRank - currentRank): >0 поднялся,
// <0 опустился, 0 без изменений.
// stats — результат loadRankingStats() (можно передать готовый, чтобы не читать
// Redis дважды); если не передан — подгружается сам.
async function computeRankDeltas(stats) {
  if (!stats) stats = await loadRankingStats()
  if (stats.length === 0) return {}
  // Текущий ранг — по тому же каскаду тай-брейков, что и в лидерборде.
  const cur = [...stats].sort(compareRank)
  cur.forEach((e, i) => { e.currentRank = i + 1 })

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

  // Реконструируем статистику ДО последнего зачёта: убираем у каждого баллы,
  // точный счёт и факт «засчитанного прогноза», полученные именно за этот матч
  // (savedAt/firstAt зачётом не меняется). Затем ранжируем тем же компаратором.
  const lastPreds = (await rget(K.preds(last.matchId))) || {}
  const lastResult = { home: last.r.home, away: last.r.away }
  const prev = cur.map((e) => {
    const p = lastPreds[e.userId]
    const gained = p ? calcPoints(p, lastResult) : 0
    return {
      userId: e.userId,
      pts: e.pts - gained,
      exact: e.exact - (gained === 3 ? 1 : 0),
      settled: e.settled - (p ? 1 : 0),
      firstAt: e.firstAt,
    }
  })
  prev.sort(compareRank)
  const prevRank = {}
  prev.forEach((e, i) => { prevRank[e.userId] = i + 1 })
  for (const e of cur) deltas[e.userId] = prevRank[e.userId] - e.currentRank
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

// Гейт фиксации итога живёт в match-lookup.js (extractFinalResult) — ЕДИНЫЙ для
// поллера, резервного sync-results.js и live-data.json. Группа: любой достоверный
// fullTime за 90′. Нокаут: итог обязан однозначно определять прошедшего (ничьей
// не бывает; winner=DRAW / противоречие счёту / 120′-ничья без серии ⇒ null) —
// матч удерживается как «идёт», а админ получает алерт для ручной проверки.

// Счётчик подряд идущих циклов, в которых FD отдаёт нокауту FINISHED, а итог не
// проходит гейт. Алерт шлём один раз — на ВТОРОМ подряд цикле (разовый «миг»
// FINISHED без полей — норма стабилизации фида, не спамим).
const holdAlerted = {}
function alertKnockoutHold(matchId, m) {
  holdAlerted[matchId] = (holdAlerted[matchId] || 0) + 1
  if (holdAlerted[matchId] !== 2 || !ADMIN_ID) return
  const ft = m.score?.fullTime || {}
  const ftStr = ft.home != null ? ` (FD fullTime ${ft.home}:${ft.away}, winner: ${m.score?.winner || '—'})` : ''
  bot.api.sendMessage(ADMIN_ID,
    `⚠️ *${m.homeTeam?.name} — ${m.awayTeam?.name}* (${matchId})\n` +
    `FD отдаёт FINISHED, но итог не проходит проверку нокаута — нет однозначного прошедшего${ftStr}.\n` +
    `Матч удержан как «идёт», очки не зачтены. Проверь реальный итог и зачти вручную:\n` +
    `/score ${matchId} H:A — победа в 90′\n` +
    `/score ${matchId} 1:1 дв 2:1 — доп. время\n` +
    `/score ${matchId} 1:1 TLA — серия пенальти (кто прошёл)`,
    { parse_mode: 'Markdown' }).catch(() => {})
}

// Поля карточки завершённого матча из записанного/полученного результата.
function finishedEntry(r) {
  const entry = { status: 'finished', scoreHome: r.home, scoreAway: r.away }
  if (r.penHome != null) { entry.penHome = r.penHome; entry.penAway = r.penAway }
  if (r.winner) entry.winner = r.winner
  if (r.duration) entry.duration = r.duration
  return entry
}

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
        next[matchId] = finishedEntry(settled[matchId])
        continue
      }

      // Строгий гейт: «завершён» = только подтверждённый финальный счёт (fullTime).
      const finalResult = extractFinalResult(m)
      const rawStatus = FD_STATUS_MAP[m.status] || 'upcoming'

      if (finalResult) {
        // Итог подтверждён → показываем как завершённый и зачитываем очки.
        delete holdAlerted[matchId]
        next[matchId] = finishedEntry(finalResult)
        try {
          const { home, away, ...meta } = finalResult
          const count = await settleMatch(matchId, home, away, meta)
          if (ADMIN_ID) {
            const pen = finalResult.penHome != null
              ? ` (пен. ${finalResult.penHome}:${finalResult.penAway})` : ''
            bot.api.sendMessage(ADMIN_ID,
              `⚽ *${m.homeTeam.name} ${finalResult.home}:${finalResult.away} ${m.awayTeam.name}*${pen}\nПрогнозов зачтено: ${count}`,
              { parse_mode: 'Markdown' }).catch(() => {})
          }
        } catch (e) {
          console.error(`[live] settle ${matchId} failed:`, e.message)
        }
        continue
      }

      // Итог НЕ подтверждён. Если FD уже отдаёт FINISHED, но гейт не пропустил
      // (нет fullTime / нокаут без однозначного прошедшего) — удерживаем матч
      // как 'live', чтобы карточка не показала непроверённый итог, и алертим
      // админа (нокаут, второй цикл подряд) — проверить реальный результат.
      if (rawStatus === 'finished' && isKnockoutMatchId(matchId)) alertKnockoutHold(matchId, m)
      else delete holdAlerted[matchId]
      const status = rawStatus === 'finished' ? 'live' : rawStatus
      const entry = { status }
      if (isKnockoutMatchId(matchId)) {
        // Нокаут: раздельные фазы — игровой счёт без голов серии, серия отдельно,
        // маркер фазы (reg/et/pens). Кумулятив «3:5» в карточку не попадает.
        const d = liveDisplayScore(m.score, m.minute)
        if (d) {
          entry.scoreHome = d.home; entry.scoreAway = d.away
          if (d.penHome != null) { entry.penHome = d.penHome; entry.penAway = d.penAway }
          if (d.phase !== 'reg') entry.phase = d.phase
        }
      } else {
        const liveScore = m.score?.fullTime?.home != null ? m.score.fullTime
          : m.score?.halfTime?.home != null ? m.score.halfTime : null
        if (liveScore) { entry.scoreHome = liveScore.home; entry.scoreAway = liveScore.away }
      }
      if (status === 'live') {
        liveCount++
        if (m.minute != null) entry.time = String(m.minute)
      }
      next[matchId] = entry
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

// Эндпоинт /scorers — это РЕЙТИНГ топ-бомбардиров по голам (desc). Одной страницы
// (limit=100) к плей-офф уже не хватает: забивших > 100, и игроки с 1 голом из
// хвоста (напр. эквадорцы) обрезаются и никогда не попадают в таблицу. Тянем ВСЕХ
// постранично через документированную пагинацию limit/offset.
// Защита: если offset не поддерживается (API отдаёт ту же первую страницу) —
// дедуп по player.id обнулит «свежих» и мы остановимся на топ-100 (как раньше,
// без регрессии). PAGE=100 — заведомо принимаемое значение лимита.
async function fetchAllFdScorers() {
  const PAGE = 100
  const all = []
  const seen = new Set()
  for (let offset = 0; offset < 1000; offset += PAGE) {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/scorers?limit=${PAGE}&offset=${offset}`,
      { headers: { 'X-Auth-Token': FDORG_TOKEN } },
    )
    if (!res.ok) {
      // Первая страница упала — это реальная ошибка; дальше — отдаём что набрали.
      if (offset === 0) { console.error(`[scorers] football-data.org ${res.status}`); return null }
      break
    }
    const page = (await res.json()).scorers || []
    if (page.length === 0) break
    const fresh = page.filter(s => s.player?.id && !seen.has(s.player.id))
    if (fresh.length === 0) break          // offset проигнорирован → дальше дублей нет смысла тянуть
    fresh.forEach(s => seen.add(s.player.id))
    all.push(...fresh)
    if (page.length < PAGE) break          // последняя (неполная) страница
  }
  return all
}

// Фантомные fdId из FD-фида (см. пояснение в pollScorers). Снос — в reconcileScorers.
// ВНИМАНИЕ: 3820 = Мехди Тареми (IRN) — реальный игрок; если Иран пройдёт дальше и он
// забьёт по-настоящему, убрать его id отсюда, иначе настоящий гол не зачтётся.
const BLOCKED_FDIDS = new Set([3820, 44033, 115828, 243911])

async function pollScorers() {
  if (!FDORG_TOKEN) return
  try {
    const fdScorers = await fetchAllFdScorers()
    if (fdScorers === null) return
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
      // FD free-фид приписывает некоторым игрокам чужие автоголы/отменённые голы
      // (Тареми — отменён по офсайду; Торстведт/Хухи/Нематов — автоголы соперников).
      // Эти fdId игнорируем, иначе поллер раз за разом воскрешает фантомные голы.
      if (BLOCKED_FDIDS.has(fdId)) continue

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
      // После расширения пагинации первый прогон может разом догрузить десятки
      // игроков из хвоста — полный список не влезет в одно сообщение (4096),
      // поэтому при большой пачке шлём краткую сводку.
      let msg
      if (added.length > 20) {
        const needCheck = added.filter(a => !a.exact).length
        msg = `🥅 *Новые бомбардиры (авто)*\n\nДогружено из API: ${added.length}.` +
          (needCheck ? `\n⚠️ ${needCheck} имён транслитерированы автоматически — проверь список: /scorer` : '')
      } else {
        const lines = added.map(a =>
          `⚽ ${a.name} (${a.tla}) — ${a.goals} гол.` +
          (a.exact ? '' : '\n⚠️ имя транслитерировано автоматически — проверь: /scorer ren N Имя')
        )
        msg = `🥅 *Новые бомбардиры (авто)*\n\n${lines.join('\n')}`
      }
      bot.api.sendMessage(ADMIN_ID, msg, { parse_mode: 'Markdown' }).catch(() => {})
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

// GET /api/_debug/bot — состояние long-polling. Если бот «молчит» на команды:
// webhook_url != null → выставлен вебхук (getUpdates даёт 409); pending большой
// и растёт → polling завис (обычно дубль/зомби-инстанс держит getUpdates).
app.get('/api/_debug/bot', async (_, res) => {
  try {
    const [info, me] = await Promise.all([bot.api.getWebhookInfo(), bot.api.getMe()])
    res.json({
      bot: me.username,
      polling_started: botPollingStarted,
      webhook_url: info.url || null,
      pending_update_count: info.pending_update_count,
      last_error_date: info.last_error_date || null,
      last_error_message: info.last_error_message || null,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

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
    const { matchId, home, away, et, penWinner } = req.body
    if (!matchId || home == null || away == null) return res.status(400).json({ error: 'matchId, home, away required' })
    const validScore = (h, a) => Number.isInteger(h) && Number.isInteger(a) && h >= 0 && a >= 0 && h <= 20 && a <= 20
    if (!validScore(home, away)) return res.status(400).json({ error: 'Invalid score' })

    const knockout = isKnockoutMatchId(matchId)
    // Гейт: приём нокаут-прогнозов закрыт, пока фича не включена (этап 2).
    if (knockout && !KNOCKOUT_ENABLED)
      return res.status(403).json({ error: 'Плей-офф ещё не открыт' })

    // Каскадная схема прогноза (только плей-офф): счёт 90′ → если ничья, счёт
    // 120′ (et) → если снова ничья, победитель серии (penWinner). Поля вне
    // каскада игнорируются. Принимаем и частичный каскад — фронт требует полноту.
    const pred = { home, away }
    if (knockout && home === away) {
      // Ничья в 90′ → каскад ОБЯЗАТЕЛЕН. Не принимаем неполный прогноз: иначе
      // частичное сохранение (напр. из инлайна на главной) перетёрло бы уже
      // сделанный полный прогноз. Фронт «Играть» всегда шлёт полный каскад.
      if (et == null || !validScore(et.home, et.away))
        return res.status(400).json({ error: 'Ничья в основное время — укажи счёт доп. времени (120′)' })
      pred.et = { home: et.home, away: et.away }
      if (et.home === et.away) {
        // Ничья в 120′ → обязателен победитель серии пенальти
        if (penWinner !== 'HOME' && penWinner !== 'AWAY')
          return res.status(400).json({ error: 'Ничья в доп. время — укажи победителя серии пенальти' })
        pred.penWinner = penWinner
      }
    }

    const results = (await rget(K.results)) || {}
    if (results[matchId]) return res.status(403).json({ error: 'Match already settled' })

    // Серверная блокировка: после стартового свистка прогноз не принимается
    const kickoff = KICKOFFS[matchId]
    if (kickoff && Date.now() >= kickoff)
      return res.status(403).json({ error: 'Матч уже начался — приём прогнозов закрыт' })

    const userId = String(req.tgUser.id)

    // Store in match predictions index
    const mp = (await rget(K.preds(matchId))) || {}
    mp[userId] = pred
    await rset(K.preds(matchId), mp)

    // Store in user predictions
    const up = (await rget(K.upreds(userId))) || {}
    up[matchId] = { ...pred, savedAt: new Date().toISOString() }
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
    // Полный набор участников + статистика для тай-брейков, затем сортировка
    // по каскаду приоритетов (compareRank) и срез top-N.
    const stats = await loadRankingStats()
    if (stats.length === 0) return res.json([])
    stats.sort(compareRank)

    const [users, deltas] = await Promise.all([loadUsers(), computeRankDeltas(stats)])
    const entries = stats.slice(0, limit).map((e, i) => {
      const u = users[e.userId] || {}
      return {
        userId: e.userId,
        pts: e.pts,
        firstName: u.firstName || 'Игрок',
        username: u.username || null,
        rank: i + 1,
        rankDelta: deltas[e.userId] ?? null,
      }
    })
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
    // Свой ранг берём из общего ранжирования (с тай-брейками), а не из ZREVRANK,
    // иначе для равных по очкам место разошлось бы со списком лидерборда.
    const stats = await loadRankingStats()
    stats.sort(compareRank)
    const deltas = await computeRankDeltas(stats)
    const idx = stats.findIndex(e => e.userId === userId)
    const myStat = idx >= 0 ? stats[idx] : null

    const upreds = (await rget(K.upreds(userId))) || {}
    const total = Object.keys(upreds).length
    const correct = Object.values(upreds).filter(p => p.pts === 3).length
    const partial = Object.values(upreds).filter(p => p.pts === 1).length
    res.json({
      userId,
      pts: myStat ? myStat.pts : 0,
      rank: idx >= 0 ? idx + 1 : null,
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
      .map(([matchId, p]) => {
        // Прогноз: базовый счёт + каскад плей-офф (et/penWinner), если был.
        const pred = { home: p.home, away: p.away }
        if (p.et) pred.et = { home: p.et.home, away: p.et.away }
        if (p.penWinner) pred.penWinner = p.penWinner

        // Итог: счёт + доп. поля нокаута (reg/et/пенальти/победитель) для
        // богатой карточки в лидерборде (как на странице «Играть»).
        const r = allResults[matchId]
        let result = null
        if (r) {
          result = { home: r.home, away: r.away }
          if (r.reg) result.reg = { home: r.reg.home, away: r.reg.away }
          if (r.et) result.et = { home: r.et.home, away: r.et.away }
          if (r.penHome != null) { result.penHome = r.penHome; result.penAway = r.penAway }
          if (r.winner) result.winner = r.winner
          if (r.duration) result.duration = r.duration
          if (r.knockout) result.knockout = true
        }
        return { matchId, pred, result, pts: p.pts }
      })
    res.json(settled)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/score — admin: settle match result
app.post('/api/score', async (req, res) => {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== TOKEN) return res.status(403).json({ error: 'Forbidden' })
  const { matchId, home, away, meta } = req.body
  if (!matchId || home == null || away == null) return res.status(400).json({ error: 'matchId, home, away required' })
  try {
    // Резервный путь (sync-results.js) может прислать поля нокаута. Берём только
    // белый список с валидацией. penHome/penAway/winner/duration — отображение
    // (на очки не влияют); knockout/reg/et нужны нокаут-скорингу calcPoints.
    const safeMeta = {}
    if (meta && typeof meta === 'object') {
      for (const k of ['penHome', 'penAway', 'winner', 'duration']) {
        if (meta[k] != null) safeMeta[k] = meta[k]
      }
      if (meta.knockout === true) {
        safeMeta.knockout = true
        const okScore = (s) => s && Number.isInteger(s.home) && Number.isInteger(s.away)
        if (okScore(meta.reg)) safeMeta.reg = { home: meta.reg.home, away: meta.reg.away }
        if (okScore(meta.et)) safeMeta.et = { home: meta.et.home, away: meta.et.away }
      }
    }
    const count = await settleMatch(matchId, home, away, safeMeta)
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
  // Формы:
  //   /score m01 2:1              — обычный/финальный счёт
  //   /score m75 1:1 MAR          — серия пенальти: последний токен = кто ПРОШЁЛ
  //                                 (HOME/AWAY/TLA); «прошёл ⇒ выиграл серию»
  //   /score m82 2:2 дв 3:2       — доп. время: 90′=2:2, 120′(итог)=3:2, победитель
  //                                 по 120′; при ничьей 120′ добавь прошедшего:
  //   /score m82 1:1 дв 1:1 MAR   — 120′ ничья → серия, MAR прошёл
  const match = raw.match(/^(\w+)\s+(\d+):(\d+)(?:\s+(?:дв|д\.в\.|et|ет)\s+(\d+):(\d+))?(?:\s+(\S+))?$/i)
  if (!match) return ctx.reply(
    'Формат:\n' +
    '• /score m01 2:1\n' +
    '• серия пенальти: /score m75 1:1 MAR\n' +
    '• доп. время: /score m82 2:2 дв 3:2'
  )
  const [, matchId, hs, as, ehs, eas, winTok] = match
  const h = parseInt(hs), a = parseInt(as)
  let meta = {}
  let finalH = h, finalA = a
  if (ehs != null) {
    // Доп. время: 90′ = h:a, 120′ (=итог) = eh:ea.
    const eh = parseInt(ehs), ea = parseInt(eas)
    finalH = eh; finalA = ea
    meta = { knockout: true, duration: 'EXTRA_TIME', reg: { home: h, away: a }, et: { home: eh, away: ea } }
    if (eh > ea) meta.winner = 'HOME_TEAM'
    else if (eh < ea) meta.winner = 'AWAY_TEAM'
    else {
      // Ничья и в 120′ → это серия пенальти, нужен прошедший.
      const side = winTok && resolveWinnerSide(matchId, winTok)
      if (!side) return ctx.reply('120′ ничья — добавь прошедшего (серия): /score m82 1:1 дв 1:1 MAR')
      meta.winner = side
      meta.duration = 'PENALTY_SHOOTOUT'
    }
  } else if (winTok) {
    const side = resolveWinnerSide(matchId, winTok)
    if (!side) return ctx.reply('Победитель серии: HOME/AWAY или TLA одной из команд пары (напр. MAR)')
    // duration помечает, что была серия → балл за серию начисляется по winner,
    // НЕ по цифрам пенальти (их из FD считаем недостоверными).
    meta = { knockout: true, winner: side, duration: 'PENALTY_SHOOTOUT' }
  } else if (isKnockoutMatchId(matchId)) {
    // Обычная форма на нокауте (победа в 90′): без knockout-меты результат
    // записался бы «групповым» и очки за проход/стек не начислились бы.
    if (h === a) return ctx.reply(
      `Нокаут не заканчивается ничьёй. Формы: /score ${matchId} 2:1 (в осн. время), ` +
      `«дв» для доп. времени, либо прошедший для серии (/score ${matchId} 1:1 POR)`
    )
    meta = { knockout: true, reg: { home: h, away: a }, winner: h > a ? 'HOME_TEAM' : 'AWAY_TEAM' }
  }
  try {
    const count = await settleMatch(matchId, finalH, finalA, meta)
    // Мгновенно отражаем счёт в аппке, не дожидаясь следующего поллинга (≤5 мин).
    // На последующих циклах поллер подтвердит это из results (источник истины).
    liveState.matchResults[matchId] = {
      status: 'finished', scoreHome: finalH, scoreAway: finalA,
      ...(meta.winner ? { winner: meta.winner } : {}),
      ...(meta.duration ? { duration: meta.duration } : {}),
    }
    const note = meta.duration === 'EXTRA_TIME' ? ` (д.в., 90′ ${h}:${a})`
      : meta.duration === 'PENALTY_SHOOTOUT' ? ` (пен., прошёл ${meta.winner === 'HOME_TEAM' ? 'хозяин' : 'гость'})` : ''
    return ctx.reply(
      `✅ Матч ${matchId}: ${finalH}:${finalA}${note}\n` +
      `• Счёт показан в «оконченных» в аппке (сразу; в Telegram перезайди в мини-апп, если кэш).\n` +
      `• Прогнозов сверено: ${count}. Очки delta-безопасны — задвоения нет.`
    )
  } catch (e) {
    return ctx.reply(`❌ Ошибка: ${e.message}`)
  }
})

// /pen m75 4:5 — вручную задать ВЕРНЫЙ счёт серии пенальти (хозяева:гости).
// Нужна, потому что football-data на сериях отдаёт недостоверный счёт (ничья).
// Счёт серии — источник истины: победитель = у кого больше (прошёл ⇒ выиграл),
// поэтому команда заодно проставляет winner и пересверяет очки. Матч должен быть
// уже зафиксирован (/score). Идемпотентно/delta-безопасно.
bot.command('pen', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return
  const raw = ctx.message.text.replace(/^\/pen\s*/, '').trim()
  const m = raw.match(/^(\w+)\s+(\d+):(\d+)$/)
  if (!m) return ctx.reply('Формат: /pen m75 4:5  (счёт серии пенальти — хозяева:гости)')
  const [, matchId, phs, pas] = m
  const ph = parseInt(phs), pa = parseInt(pas)
  if (ph === pa) return ctx.reply('Счёт серии не может быть ничейным — у кого-то больше (напр. 5:4)')
  try {
    const results = (await rget(K.results)) || {}
    const r = results[matchId]
    if (!r) return ctx.reply(`Матч ${matchId} ещё не зафиксирован — сначала /score ${matchId} H:A`)
    const winner = ph > pa ? 'HOME_TEAM' : 'AWAY_TEAM'
    const meta = { knockout: true, duration: 'PENALTY_SHOOTOUT', penHome: ph, penAway: pa, winner }
    const count = await settleMatch(matchId, r.home, r.away, meta)
    // Сразу отражаем в аппке (полный набор полей, чтобы /api/live не потерял пен/winner).
    liveState.matchResults[matchId] = {
      status: 'finished', scoreHome: r.home, scoreAway: r.away,
      penHome: ph, penAway: pa, winner, duration: 'PENALTY_SHOOTOUT',
    }
    return ctx.reply(
      `✅ ${matchId}: серия пенальти ${ph}:${pa} → прошёл ${winner === 'HOME_TEAM' ? 'хозяин' : 'гость'}\n` +
      `• Счёт серии показан на главной как «(пен. ${ph}:${pa})».\n` +
      `• Прогнозов пересверено: ${count} (очки delta-безопасны).`
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
    // бывает 100+ игроков → полный список в одно сообщение не влезает. Раньше
    // список обрезался («…и ещё N»), и игроков с хвоста нельзя было править.
    // Теперь бьём на НЕСКОЛЬКО сообщений по бюджету символов, сохраняя РЕАЛЬНЫЕ
    // номера (правка /scorer N валидна для любого индекса). Plain-текст: имена
    // из API могут содержать спецсимволы legacy-Markdown.
    const header = `Бомбардиры (${current.length}):\n\n`
    const footer =
      `\n📝 Обновить: /scorer N голы ассисты [матчи]\n` +
      `➕ Добавить: /scorer add Имя TLA голы ассисты [матчи]\n` +
      `🗑 Удалить: /scorer del N · ✏️ Имя: /scorer ren N Имя`

    if (current.length === 0) {
      return ctx.reply(`${header}— пусто —\n${footer}`)
    }

    // Группируем по сборной (так удобнее искать игрока), команды — по алфавиту.
    // ВАЖНО: номер в строке — это РЕАЛЬНЫЙ индекс в массиве current (i+1), по нему
    // работает /scorer N. Хранилище отсортировано по голам (этот же порядок идёт
    // в /api/scorers → доска бомбардиров на фронте), поэтому номера внутри
    // сборной идут не подряд — это нормально и нужно для корректной правки.
    // Внутри сборной игроки идут в порядке голов (current уже goals-sorted).
    const byTeam = {}
    current.forEach((s, i) => { (byTeam[s.team || '—'] ||= []).push({ ...s, n: i + 1 }) })
    const blocks = Object.keys(byTeam).sort().map((t) => {
      const rows = byTeam[t]
        .map((p) => `${p.n}. ${p.name} — ⚽${p.goals} 🅰️${p.assists} 🎮${p.matches}`)
        .join('\n')
      return `${t} (${byTeam[t].length}):\n${rows}`
    })

    // Бьём по бюджету (запас от 4096 под заголовок/футер/эмодзи-байты), но
    // НЕ дробим блок одной сборной между сообщениями (макс ~26 игроков ≈ 1100
    // символов, в бюджет всегда влезает).
    const BUDGET = 3500
    const chunks = []
    let cur = ''
    for (const block of blocks) {
      const piece = (cur ? '\n\n' : '') + block
      if (cur && cur.length + piece.length > BUDGET) { chunks.push(cur); cur = block }
      else cur += piece
    }
    if (cur) chunks.push(cur)

    // Заголовок — к первому сообщению, подсказка по командам — к последнему.
    // Шлём по порядку с небольшой паузой, чтобы не упереться в флуд-лимит чата.
    for (let i = 0; i < chunks.length; i++) {
      let msg = chunks[i]
      if (i === 0) msg = header + msg
      if (i === chunks.length - 1) msg = msg + footer
      else msg = msg + `\n— продолжение (${i + 2}/${chunks.length}) ниже —`
      await ctx.reply(msg)
      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 120))
    }
    return
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

  // Отчёт присылаем ВСЕГДА — даже если broadcast упал (например, хиккап Redis в
  // loadUsers). Раньше исключение здесь глушило отчёт целиком, и при серии фото
  // репорт приходил не по каждой рассылке. Теперь по каждой — успех или ошибка.
  try {
    const { sent, failed, total } = await broadcast(broadcastFn)
    return ctx.reply(`✅ Готово: ${sent}/${total} отправлено, ${failed} ошибок`)
  } catch (e) {
    console.error('[broadcast] failed:', e.message)
    return ctx.reply(`⚠️ Рассылка не завершилась: ${e.message}. Попробуй отправить ещё раз.`)
  }
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
let botPollingStarted = false
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
    onStart: () => { botPollingStarted = true; console.log(`✅ WC2026 Bot running | App: ${APP_URL} | Storage: ${REDIS_URL ? 'Redis' : 'file'}`) },
  }).catch((err) => {
    botPollingStarted = false
    console.error('Bot polling error:', err.message)
    if (err.message?.includes('409')) {
      // Другой потребитель getUpdates (чаще всего зомби-инстанс, оставшийся после
      // деплоя) держит long-poll → наш getUpdates падает с 409. РАНЬШЕ мы просто
      // логировали и НЕ повторяли — бот «молчал» навсегда, пока не рестартнёшь.
      // Теперь повторяем через 15с: как только конфликтующий инстанс отвалится,
      // мы перехватываем getUpdates и бот оживает без ручного вмешательства.
      console.error('409 Conflict — повторю запуск polling через 15с')
      setTimeout(startBot, 15000)
    } else {
      process.exit(1)
    }
  })
}
startBot()

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`🌐 API server on port ${PORT}`))

// Разовые миграции (гард-флаг в Redis — на повторных деплоях не срабатывают).
// Поллер эти матчи не трогает (они уже в results). m74/m75 — winner серий;
// m82 — верная разбивка 90′/120′ + duration; m83 — счёт 2:2→2:1 (отменённый гол).
migrateKnockoutPensWinner()
migrateM82ExtraTime()
migrateM83Correction()
migrateM88Pens()

if (FDORG_TOKEN) {
  pollFootballData()
  pollScorers()
  setInterval(pollFootballData, 5 * 60 * 1000)
  setInterval(pollScorers, 5 * 60 * 1000)
  console.log('⚽ Live poller started (football-data.org, every 5 min)')
} else {
  console.warn('⚠️ FDORG_TOKEN not set — live poller disabled, /api/live will be empty')
}

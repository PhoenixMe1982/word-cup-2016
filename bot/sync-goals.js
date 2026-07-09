#!/usr/bin/env node
// Заполняет авторов голов (игрок + минута) по матчам ПЛЕЙ-ОФФ из API-Football
// и вписывает их в public/live-data.json → matchResults[matchId].goals.
//
// Почему именно сюда: update-live-data.js делает `next = { ...prev, status }`,
// то есть СОХРАНЯЕТ ранее записанные поля (в т.ч. goals) между запусками cron —
// значит записанные здесь голы не будут затёрты живым апдейтом счёта. Фронт
// читает live-data.json и рендерит goals в раскрытой карточке матча (раздел ЧМ →
// Плей-офф). Группового этапа не касаемся (P4 — только плей-офф).
//
// Запуск: APIFOOTBALL_KEY=… node bot/sync-goals.js
// Идемпотентно: пишет файл только при реальных изменениях.

const fs = require('fs')
const path = require('path')
const { isKnockoutMatchId } = require('./match-lookup.js')
const { afEnabled, afGetGoals } = require('./af-crosscheck.js')

const OUT_PATH = path.join(__dirname, '..', 'public', 'live-data.json')

// Окно дат плей-офф ЧМ-2026 (1/16 стартует 28 июня, финал ~19 июля). UTC-строки.
function knockoutDays() {
  const days = []
  const start = Date.UTC(2026, 5, 27) // 27 июня (запас на смещение таймзоны старта)
  const end = Date.UTC(2026, 6, 20)   // 20 июля
  for (let t = start; t <= end; t += 86400000) {
    days.push(new Date(t).toISOString().slice(0, 10))
  }
  return days
}

async function main() {
  if (!afEnabled()) {
    console.error('[sync-goals] APIFOOTBALL_KEY не задан — нечем ходить в API-Football')
    process.exit(1)
  }

  let store
  try {
    store = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
  } catch {
    store = { matchResults: {} }
  }
  const matchResults = store.matchResults || (store.matchResults = {})

  // Нужен доступ к дневному фиду для маппинга fixture → matchId. afGetGoals сам
  // ходит по дню (кэш), поэтому здесь просто перебираем дни и известные пары.
  // Чтобы не гадать, какие matchId в какой день, берём id из уже завершённых
  // записей live-data.json (плей-офф) и пробуем каждый день окна — afGetGoals
  // вернёт голы только для совпавшего дня, для остальных null.
  const koFinished = Object.keys(matchResults).filter(
    (id) => isKnockoutMatchId(id) && matchResults[id]?.status === 'finished',
  )
  if (koFinished.length === 0) {
    console.log('[sync-goals] завершённых матчей плей-офф в live-data.json нет — нечего заполнять')
    return
  }

  const days = knockoutDays()
  let changed = 0
  for (const matchId of koFinished) {
    let goals = null
    for (const day of days) {
      const g = await afGetGoals(matchId, day)
      if (g && g.length > 0) { goals = g; break }
      // пустой массив (матч найден, но событий нет) тоже валиден — фиксируем «0 голов»
      if (g && g.length === 0 && goals == null) goals = g
    }
    if (goals == null) {
      console.log(`[sync-goals] ${matchId}: голы не найдены (нет в фиде AF или имена не смаппились)`)
      continue
    }
    const prev = JSON.stringify(matchResults[matchId].goals || null)
    if (prev !== JSON.stringify(goals)) {
      matchResults[matchId].goals = goals
      changed++
      console.log(`[sync-goals] ${matchId}: ${goals.length} гол(ов) → ${goals.map((x) => `${x.player} ${x.minute}'`).join(', ')}`)
    }
  }

  if (changed === 0) {
    console.log('[sync-goals] изменений нет')
    return
  }
  store._goalsSyncedAt = new Date().toISOString()
  fs.writeFileSync(OUT_PATH, JSON.stringify(store, null, 2) + '\n', 'utf8')
  console.log(`[sync-goals] обновлено матчей: ${changed}. Записан ${OUT_PATH}`)
}

main().catch((e) => {
  console.error('[sync-goals] Fatal:', e.message)
  process.exit(1)
})

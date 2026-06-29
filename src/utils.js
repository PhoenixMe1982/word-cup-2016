const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

// dateStr: "11 июня", timeStr: "22:00 МСК" (MSK = UTC+3)
// Returns a Date, or null if the strings can't be parsed
export function matchUTCDate(dateStr, timeStr) {
  const timePart = (timeStr || '').split(' ')[0]
  const [hStr, mStr] = timePart.split(':')
  const h = parseInt(hStr)
  const m = parseInt(mStr)
  const parts = (dateStr || '').trim().split(' ')
  const day = parseInt(parts[0])
  const monthIdx = RU_MONTHS.indexOf(parts[1]?.toLowerCase())
  if (isNaN(day) || monthIdx === -1 || isNaN(h) || isNaN(m)) return null
  // MSK is UTC+3 — subtract 3h to get UTC
  return new Date(Date.UTC(2026, monthIdx, day, h - 3, m))
}

// Компаратор для строгой хронологической сортировки матчей по времени начала
// (раньше → выше). Матчи без распознанной даты/времени уезжают в конец.
export function compareKickoff(a, b) {
  const ta = matchUTCDate(a.date, a.time)?.getTime() ?? Infinity
  const tb = matchUTCDate(b.date, b.time)?.getTime() ?? Infinity
  return ta - tb
}

// ── Скоринг плей-офф (зеркало bot/scoring.js) ───────────────────────────────
// ВАЖНО: держать идентичным calcPointsKnockout на бэкенде. Используется только
// для отображения очков в карточке; источник истины — бэкенд (myPred.pts).
//   pred:   { home, away, et?:{home,away}, penWinner?:'HOME'|'AWAY' }
//   result: { reg:{home,away}, et?:{home,away}, penHome?, winner }
function knOutcome(h, a) { return h > a ? 'HOME' : h < a ? 'AWAY' : 'DRAW' }
function knNormWinner(w) {
  if (w === 'HOME_TEAM' || w === 'HOME') return 'HOME'
  if (w === 'AWAY_TEAM' || w === 'AWAY') return 'AWAY'
  return null
}
function knStage(ph, pa, rh, ra, exact, out) {
  if (ph === rh && pa === ra) return exact
  return knOutcome(ph, pa) === knOutcome(rh, ra) ? out : 0
}
export function predAdvancer(pred) {
  if (pred.home !== pred.away) return knOutcome(pred.home, pred.away)
  if (pred.et && pred.et.home !== pred.et.away) return knOutcome(pred.et.home, pred.et.away)
  if (pred.penWinner) return knNormWinner(pred.penWinner)
  return null
}

// Возвращает разбивку очков по стадиям + сумму (для подписи в карточке).
export function calcKnockoutBreakdown(pred, result) {
  const reg = result.reg || { home: result.home, away: result.away }
  const p90 = knStage(pred.home, pred.away, reg.home, reg.away, 3, 1)
  let p120 = 0
  const reached120 = pred.home === pred.away && !!pred.et
  if (reached120 && result.et) p120 = knStage(pred.et.home, pred.et.away, result.et.home, result.et.away, 2, 1)
  let pPen = 0
  const reachedPens = reached120 && pred.et.home === pred.et.away && !!pred.penWinner
  if (reachedPens && result.penHome != null && knNormWinner(pred.penWinner) === knNormWinner(result.winner)) pPen = 1
  let pAdv = 0
  const realAdv = knNormWinner(result.winner)
  const pAdvSide = predAdvancer(pred)
  if (realAdv && pAdvSide && pAdvSide === realAdv) pAdv = 1
  return { p90, p120, pPen, pAdv, total: p90 + p120 + pPen + pAdv }
}

export function calcKnockoutPoints(pred, result) {
  return calcKnockoutBreakdown(pred, result).total
}

// Returns { time: "HH:MM", date: "D месяц" } in the device's local timezone
export function toLocalDateTime(dateStr, timeStr) {
  const d = matchUTCDate(dateStr, timeStr)
  if (!d) return { time: timeStr, date: dateStr }
  const localH = d.getHours().toString().padStart(2, '0')
  const localM = d.getMinutes().toString().padStart(2, '0')
  return {
    time: `${localH}:${localM}`,
    date: `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`,
  }
}

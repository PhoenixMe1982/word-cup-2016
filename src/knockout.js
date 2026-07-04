// Хелперы резолва сетки плей-офф (кто прошёл дальше) — единый источник для
// сетки на главной и для раздела стадий в «ЧМ». Работают по живым матчам
// (byId — карта id → match с подмешанными результатами из /api/live).
import { KNOCKOUT_TREE } from './data.js'

// Победитель пары: только у завершённого матча. Приоритет — поле winner с
// бэкенда; иначе по счёту, при ничьей — по пенальти.
//
// ВАЖНО: команды матча плей-офф в статике часто null (резолвятся по сетке).
// Раньше winnerCode при null home/away сразу возвращал null — из-за этого
// победитель матча следующей стадии (1/8+) НЕ поднимался в сетку и не давал
// флаг в лидерборде. Теперь при отсутствии команд их РЕКУРСИВНО резолвим из
// питающих пар (нужен byId). Это делает winnerCode/resolveTeams взаимно
// рекурсивными: победитель каскадится до финала.
export function winnerCode(m, byId) {
  if (!m || m.status !== 'finished') return null
  let home = m.home
  let away = m.away
  if ((home == null || away == null) && byId) {
    const r = resolveTeams(m, byId)
    home = r.home; away = r.away
  }
  if (home == null || away == null) return null
  if (m.winner === 'HOME_TEAM') return home
  if (m.winner === 'AWAY_TEAM') return away
  if (m.winner === 'DRAW') return null
  if (m.scoreHome == null || m.scoreAway == null) return null
  if (m.scoreHome > m.scoreAway) return home
  if (m.scoreHome < m.scoreAway) return away
  if (m.penHome != null && m.penAway != null) return m.penHome > m.penAway ? home : away
  return null
}

// Проигравший пары (для матча за 3-е место — встречаются проигравшие 1/2).
export function loserCode(m, byId) {
  const w = winnerCode(m, byId)
  if (!w) return null
  const { home, away } = resolveTeams(m, byId)
  if (home == null || away == null) return null
  return w === home ? away : home
}

// Эффективные команды матча: статические (если проставлены), иначе резолв по
// дереву — победители (или проигравшие для bronze) питающих пар. byId
// прокидывается вглубь → резолв работает на любую глубину сетки.
export function resolveTeams(m, byId) {
  let home = m.home
  let away = m.away
  const feeders = KNOCKOUT_TREE[m.id]
  if (feeders && (home == null || away == null)) {
    const pick = m.stage === 'bronze' ? loserCode : winnerCode
    if (home == null) home = pick(byId[feeders[0]], byId)
    if (away == null) away = pick(byId[feeders[1]], byId)
  }
  return { home, away }
}

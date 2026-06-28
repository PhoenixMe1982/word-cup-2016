// Хелперы резолва сетки плей-офф (кто прошёл дальше) — единый источник для
// сетки на главной и для раздела стадий в «ЧМ». Работают по живым матчам
// (byId — карта id → match с подмешанными результатами из /api/live).
import { KNOCKOUT_TREE } from './data.js'

// Победитель пары: только у завершённого матча. Приоритет — поле winner с
// бэкенда; иначе по счёту, при ничьей — по пенальти.
export function winnerCode(m) {
  if (!m || m.home == null || m.away == null) return null
  if (m.status !== 'finished') return null
  if (m.winner === 'HOME_TEAM') return m.home
  if (m.winner === 'AWAY_TEAM') return m.away
  if (m.scoreHome == null || m.scoreAway == null) return null
  if (m.scoreHome > m.scoreAway) return m.home
  if (m.scoreHome < m.scoreAway) return m.away
  if (m.penHome != null && m.penAway != null) return m.penHome > m.penAway ? m.home : m.away
  return null
}

// Проигравший пары (для матча за 3-е место — встречаются проигравшие 1/2).
export function loserCode(m) {
  const w = winnerCode(m)
  if (!w || m.home == null || m.away == null) return null
  return w === m.home ? m.away : m.home
}

// Эффективные команды матча: статические (если проставлены), иначе резолв по
// дереву — победители (или проигравшие для bronze) питающих пар.
export function resolveTeams(m, byId) {
  let home = m.home
  let away = m.away
  const feeders = KNOCKOUT_TREE[m.id]
  if (feeders && (home == null || away == null)) {
    const pick = m.stage === 'bronze' ? loserCode : winnerCode
    if (home == null) home = pick(byId[feeders[0]])
    if (away == null) away = pick(byId[feeders[1]])
  }
  return { home, away }
}

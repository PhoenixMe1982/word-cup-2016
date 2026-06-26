import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES, KNOCKOUT_MATCHES, knockoutEnabled, TOP_SCORERS, GOALKEEPERS, GROUPS, NEWS, TICKER_ITEMS } from './data.js'

// Источник матчей: группа всегда; плей-офф подмешивается только при включённой
// фиче (гейт KNOCKOUT_LIVE / тест-флаг). Вычисляется один раз при загрузке модуля.
const SOURCE_MATCHES = knockoutEnabled() ? [...MATCHES, ...KNOCKOUT_MATCHES] : MATCHES

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

// Пока приложение открыто, перечитываем /api/live раз в минуту —
// бэкенд сам опрашивает football-data.org каждые 5 минут.
const REFRESH_MS = 60 * 1000

const FALLBACK = {
  matches: SOURCE_MATCHES,
  scorers: TOP_SCORERS,
  goalkeepers: GOALKEEPERS,
  groups: GROUPS,
  news: NEWS,
  ticker: TICKER_ITEMS,
}

// Турнирные таблицы групп считаются из завершённых матчей:
// победа 3 очка, ничья 1, сортировка на странице групп — очки → разница → забитые.
// includeLive=true — провизорный режим: идущие матчи засчитываются по текущему
// счёту «как будто матч закончился сейчас» (для живой карточки группы на главной).
export function computeGroups(matches, { includeLive = false } = {}) {
  const groups = JSON.parse(JSON.stringify(GROUPS))
  const rowByCode = {}
  for (const g of Object.values(groups)) for (const t of g.teams) rowByCode[t.code] = t

  for (const m of matches) {
    if (m.stage) continue // плей-офф не влияет на групповые таблицы
    const counts = m.status === 'finished' || (includeLive && m.status === 'live')
    if (!counts || m.scoreHome == null || m.scoreAway == null) continue
    const h = rowByCode[m.home]
    const a = rowByCode[m.away]
    if (!h || !a) continue
    h.p++; a.p++
    h.gf += m.scoreHome; h.ga += m.scoreAway
    a.gf += m.scoreAway; a.ga += m.scoreHome
    if (m.scoreHome > m.scoreAway)      { h.w++; a.l++; h.pts += 3 }
    else if (m.scoreHome < m.scoreAway) { a.w++; h.l++; a.pts += 3 }
    else                                { h.d++; a.d++; h.pts++; a.pts++ }
    h.gd = h.gf - h.ga
    a.gd = a.gf - a.ga
  }
  return groups
}

const LiveDataCtx = createContext(FALLBACK)

export function LiveDataProvider({ children }) {
  const [data, setData] = useState(FALLBACK)
  // ready — первая загрузка завершена (свежие результаты/таблицы готовы).
  // Сплэш на уровне App держит вход, пока это false, чтобы не показывать
  // нули из FALLBACK до резолва /api/live.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const liveUrl = import.meta.env.BASE_URL + 'live-data.json?t=' + Date.now()
      const [json, apiLive, apiScorers, apiKeepers] = await Promise.all([
        fetch(liveUrl).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/api/live`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/api/scorers`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/api/goalkeepers`).then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      if (cancelled) return

      // Приоритет: /api/live (свежее, раз в 5 мин) → live-data.json (GitHub Actions) → статика
      const staticResults = json?.matchResults || {}
      const liveResults = apiLive?.matchResults && Object.keys(apiLive.matchResults).length > 0
        ? apiLive.matchResults
        : null

      const matches = SOURCE_MATCHES.map(m => ({
        ...m,
        ...(staticResults[m.id] || {}),
        ...((liveResults && liveResults[m.id]) || {}),
      }))

      setData({
        matches,
        scorers:     apiScorers  || json?.scorers     || [],
        goalkeepers: apiKeepers  || json?.goalkeepers || GOALKEEPERS,
        groups:      computeGroups(matches),
        news:        json?.news    || NEWS,
        ticker:      json?.ticker  || TICKER_ITEMS,
      })
      setReady(true)
    }

    load()
    const t = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  return <LiveDataCtx.Provider value={{ ...data, ready }}>{children}</LiveDataCtx.Provider>
}

export const useLiveData = () => useContext(LiveDataCtx)

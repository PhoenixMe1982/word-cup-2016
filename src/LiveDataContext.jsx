import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES, TOP_SCORERS, GOALKEEPERS, GROUPS, NEWS, TICKER_ITEMS } from './data.js'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

// Пока приложение открыто, перечитываем /api/live раз в минуту —
// бэкенд сам опрашивает football-data.org каждые 5 минут.
const REFRESH_MS = 60 * 1000

const FALLBACK = {
  matches: MATCHES,
  scorers: TOP_SCORERS,
  goalkeepers: GOALKEEPERS,
  groups: GROUPS,
  news: NEWS,
  ticker: TICKER_ITEMS,
}

const LiveDataCtx = createContext(FALLBACK)

export function LiveDataProvider({ children }) {
  const [data, setData] = useState(FALLBACK)

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

      setData({
        matches: MATCHES.map(m => ({
          ...m,
          ...(staticResults[m.id] || {}),
          ...((liveResults && liveResults[m.id]) || {}),
        })),
        scorers:     apiScorers  || json?.scorers     || [],
        goalkeepers: apiKeepers  || json?.goalkeepers || GOALKEEPERS,
        groups:      json?.groups  || GROUPS,
        news:        json?.news    || NEWS,
        ticker:      json?.ticker  || TICKER_ITEMS,
      })
    }

    load()
    const t = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  return <LiveDataCtx.Provider value={data}>{children}</LiveDataCtx.Provider>
}

export const useLiveData = () => useContext(LiveDataCtx)

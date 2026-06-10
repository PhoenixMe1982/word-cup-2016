import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES, TOP_SCORERS, GOALKEEPERS, GROUPS, NEWS, TICKER_ITEMS } from './data.js'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

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
    const liveUrl = import.meta.env.BASE_URL + 'live-data.json?t=' + Date.now()
    Promise.all([
      fetch(liveUrl).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/scorers`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/goalkeepers`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([json, apiScorers, apiKeepers]) => {
      setData({
        matches: json?.matchResults
          ? MATCHES.map(m => ({ ...m, ...(json.matchResults[m.id] || {}) }))
          : MATCHES,
        scorers:     apiScorers  || json?.scorers     || TOP_SCORERS,
        goalkeepers: apiKeepers  || json?.goalkeepers || GOALKEEPERS,
        groups:      json?.groups  || GROUPS,
        news:        json?.news    || NEWS,
        ticker:      json?.ticker  || TICKER_ITEMS,
      })
    })
  }, [])

  return <LiveDataCtx.Provider value={data}>{children}</LiveDataCtx.Provider>
}

export const useLiveData = () => useContext(LiveDataCtx)

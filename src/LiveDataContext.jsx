import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES, TOP_SCORERS, GOALKEEPERS, GROUPS, NEWS, TICKER_ITEMS } from './data.js'

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
    const url = import.meta.env.BASE_URL + 'live-data.json?t=' + Date.now()
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return
        setData({
          matches: json.matchResults
            ? MATCHES.map((m) => ({ ...m, ...(json.matchResults[m.id] || {}) }))
            : MATCHES,
          scorers: json.scorers || TOP_SCORERS,
          goalkeepers: json.goalkeepers || GOALKEEPERS,
          groups: json.groups || GROUPS,
          news: json.news || NEWS,
          ticker: json.ticker || TICKER_ITEMS,
        })
      })
      .catch(() => {})
  }, [])

  return <LiveDataCtx.Provider value={data}>{children}</LiveDataCtx.Provider>
}

export const useLiveData = () => useContext(LiveDataCtx)

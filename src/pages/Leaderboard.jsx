import { useState, useEffect } from 'react'
import { HEADER_BANNER_STYLE, MATCHES, TEAMS } from '../data.js'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

const MATCH_MAP = Object.fromEntries(MATCHES.map(m => [m.id, m]))

function getInitData() {
  return window.Telegram?.WebApp?.initData || ''
}

function isTelegram() {
  return !!window.Telegram?.WebApp?.initData
}

async function apiFetch(path, opts = {}) {
  const initData = getInitData()
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (initData) headers['x-telegram-init-data'] = initData
  const res = await fetch(API + path, { ...opts, headers })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
  return res.json()
}

function RankBadge({ rank }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FFD700,#FFA500)' }}>🥇</div>
  if (rank === 2) return <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)' }}>🥈</div>
  if (rank === 3) return <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{ background: 'linear-gradient(135deg,#CD7F32,#A0522D)' }}>🥉</div>
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.05)', color: '#6B7280' }}
    >
      {rank}
    </div>
  )
}

function PredRow({ item }) {
  const match = MATCH_MAP[item.matchId]
  if (!match) return null
  const homeTeam = TEAMS[match.home] || { name: match.home, flag: '🏳️' }
  const awayTeam = TEAMS[match.away] || { name: match.away, flag: '🏳️' }

  const ptsBg   = item.pts === 3 ? 'rgba(34,197,94,0.12)'  : item.pts === 1 ? 'rgba(234,179,8,0.12)'  : 'rgba(239,68,68,0.08)'
  const ptsBdr  = item.pts === 3 ? 'rgba(34,197,94,0.3)'   : item.pts === 1 ? 'rgba(234,179,8,0.3)'   : 'rgba(239,68,68,0.2)'
  const ptsCol  = item.pts === 3 ? '#16a34a'               : item.pts === 1 ? '#ca8a04'               : '#ef4444'
  const icon    = item.pts === 3 ? '✅' : item.pts === 1 ? '☑️' : '❌'

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5"
      style={{ background: ptsBg, border: `1px solid ${ptsBdr}` }}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate" style={{ color: '#111827' }}>
          {homeTeam.flag} {homeTeam.name} — {awayTeam.flag} {awayTeam.name}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
          Прогноз: <b>{item.pred.home}:{item.pred.away}</b>
          {item.result && (
            <> · Итог: <b>{item.result.home}:{item.result.away}</b></>
          )}
        </div>
      </div>
      <div
        className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: ptsCol, background: ptsBg, border: `1px solid ${ptsBdr}` }}
      >
        +{item.pts}
      </div>
    </div>
  )
}

function PredictionsList({ preds, loading }) {
  if (loading) {
    return (
      <div className="px-3 py-3 text-center text-xs" style={{ color: '#9CA3AF' }}>
        Загрузка...
      </div>
    )
  }
  if (!preds || preds.length === 0) {
    return (
      <div className="px-3 py-3 text-center text-xs" style={{ color: '#9CA3AF' }}>
        Нет засчитанных прогнозов
      </div>
    )
  }

  const exact   = preds.filter(p => p.pts === 3)
  const outcome = preds.filter(p => p.pts === 1)
  const miss    = preds.filter(p => p.pts === 0)

  return (
    <div className="px-3 pt-2 pb-3">
      {exact.length > 0 && (
        <>
          <div className="text-[9px] font-black uppercase tracking-widest mb-1.5 px-1" style={{ color: '#16a34a' }}>
            Точный счёт · {exact.length}
          </div>
          {exact.map(p => <PredRow key={p.matchId} item={p} />)}
        </>
      )}
      {outcome.length > 0 && (
        <>
          <div className="text-[9px] font-black uppercase tracking-widest mb-1.5 px-1 mt-2" style={{ color: '#ca8a04' }}>
            Угадан исход · {outcome.length}
          </div>
          {outcome.map(p => <PredRow key={p.matchId} item={p} />)}
        </>
      )}
      {miss.length > 0 && (
        <>
          <div className="text-[9px] font-black uppercase tracking-widest mb-1.5 px-1 mt-2" style={{ color: '#9CA3AF' }}>
            Мимо · {miss.length}
          </div>
          {miss.map(p => <PredRow key={p.matchId} item={p} />)}
        </>
      )}
    </div>
  )
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [predCache, setPredCache] = useState({})
  const [predLoading, setPredLoading] = useState(null)
  const inTg = isTelegram()

  async function togglePredictions(userId) {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    if (predCache[userId] !== undefined) return
    setPredLoading(userId)
    try {
      const preds = await apiFetch(`/api/predictions/${userId}`)
      setPredCache(c => ({ ...c, [userId]: preds || [] }))
    } catch {
      setPredCache(c => ({ ...c, [userId]: [] }))
    } finally {
      setPredLoading(null)
    }
  }

  function shareLeaderboard() {
    const top3 = entries.slice(0, 3).map((e, i) => {
      const medal = ['🥇', '🥈', '🥉'][i]
      return `${medal} ${e.firstName || 'Игрок'} — ${e.pts} оч.`
    }).join('\n')
    const myLine = me ? `\n📊 Ты: #${me.rank || '?'} · ${me.pts} оч.` : ''
    const text = `🏆 Лидерборд ЧМ 2026\n${top3}${myLine}\n📲 Играй: @Mundial_26_bot`
    const url = 'https://t.me/Mundial_26_bot'
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
    }
  }

  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    ? String(window.Telegram.WebApp.initDataUnsafe.user.id)
    : null

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const lb = await apiFetch('/api/leaderboard?limit=50')
        setEntries(lb || [])
        if (inTg) {
          const myStats = await apiFetch('/api/me')
          setMe(myStats)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [inTg])

  const myEntry = entries.find((e) => e.userId === tgUserId)
  const showMyRank = me && !myEntry && me.rank

  return (
    <div className="page-content pb-4">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5 mb-4"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Лидерборд</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Рейтинг игроков</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-5xl">🏅</div>
            {entries.length > 0 && (
              <button
                onClick={shareLeaderboard}
                className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5"
                style={{ background: 'rgba(201,168,0,0.1)', color: '#C9A800', border: '1px solid rgba(201,168,0,0.25)' }}
              >
                📤 Поделиться
              </button>
            )}
          </div>
        </div>

        {me && (
          <div
            className="mt-4 p-3 rounded-lg grid grid-cols-3 gap-3 text-center"
            style={{ background: '#F5F6FA', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div>
              <div className="text-xl font-black" style={{ color: '#C9A800' }}>{me.pts}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Очков</div>
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: '#111827' }}>
                {me.rank ? `#${me.rank}` : '—'}
              </div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Место</div>
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: '#111827' }}>{me.predictions}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Прогнозов</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg text-xs text-center" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-3xl animate-spin">⚽</div>
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 px-4 gap-4">
          <div className="text-6xl">🏅</div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-wide mb-1" style={{ color: '#111827' }}>Пока пусто</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Рейтинг появится после первых прогнозов</p>
          </div>
          <div
            className="w-full p-3 text-center text-xs uppercase tracking-wider rounded-lg"
            style={{ background: 'rgba(201,168,0,0.08)', border: '1px solid rgba(201,168,0,0.2)', color: '#C9A800' }}
          >
            🥇 Делай прогнозы — попади в топ
          </div>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="px-4">
          {entries.map((entry) => {
            const isMe = entry.userId === tgUserId
            const isOpen = expanded === entry.userId
            const isLoadingThis = predLoading === entry.userId
            return (
              <div key={entry.userId} className="mb-2">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none"
                  style={{
                    background: isMe ? 'rgba(201,168,0,0.08)' : '#FFFFFF',
                    border: isMe
                      ? `1.5px solid ${isOpen ? 'rgba(201,168,0,0.5)' : 'rgba(201,168,0,0.3)'}`
                      : `1px solid ${isOpen ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.06)'}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    borderBottomLeftRadius: isOpen ? 0 : undefined,
                    borderBottomRightRadius: isOpen ? 0 : undefined,
                  }}
                  onClick={() => togglePredictions(entry.userId)}
                >
                  <RankBadge rank={entry.rank} />
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#C9A800,#f0c400)', color: '#fff' }}
                  >
                    {(entry.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: '#111827' }}>
                      {entry.firstName || 'Игрок'}{isMe ? ' (ты)' : ''}
                    </div>
                    {entry.username && (
                      <div className="text-[10px]" style={{ color: '#9CA3AF' }}>@{entry.username}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <div className="text-lg font-black" style={{ color: '#C9A800' }}>{entry.pts}</div>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>очков</div>
                  </div>
                  <div
                    className="text-xs flex-shrink-0 transition-transform duration-200"
                    style={{ color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▾
                  </div>
                </div>

                {isOpen && (
                  <div
                    style={{
                      background: '#FAFAFA',
                      border: isMe ? '1.5px solid rgba(201,168,0,0.3)' : '1px solid rgba(0,0,0,0.06)',
                      borderTop: 'none',
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                    }}
                  >
                    <PredictionsList
                      preds={predCache[entry.userId]}
                      loading={isLoadingThis}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {showMyRank && (
            <div
              className="mt-3 p-3 rounded-lg text-center text-xs"
              style={{ background: 'rgba(201,168,0,0.06)', border: '1px solid rgba(201,168,0,0.2)', color: '#C9A800' }}
            >
              Ты на {me.rank}-м месте с {me.pts} очками
            </div>
          )}
        </div>
      )}
    </div>
  )
}

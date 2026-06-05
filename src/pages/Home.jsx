import { useState, useEffect } from 'react'
import { TEAMS, TOURNAMENT } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

function UserAvatar({ onTab }) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const name = tgUser?.first_name || 'Игрок'
  const photoUrl = tgUser?.photo_url
  const initial = name[0]?.toUpperCase() || '?'
  const [pts, setPts] = useState(null)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return
    fetch(API + '/api/me', { headers: { 'x-telegram-init-data': initData } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setPts(d.pts); setRank(d.rank) } })
      .catch(() => {})
  }, [])

  return (
    <button onClick={() => onTab('leaderboard')} className="flex flex-col items-center gap-0.5">
      <div
        className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#C9A800,#f0c400)', border: '2px solid rgba(201,168,0,0.25)' }}
      >
        {photoUrl
          ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
          : <span className="text-base font-black" style={{ color: '#fff' }}>{initial}</span>
        }
      </div>
      <div className="text-[10px] font-bold truncate max-w-[60px]" style={{ color: '#111827' }}>{name}</div>
      <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
        {pts !== null ? `${pts} очк` : rank !== null ? `#${rank}` : 'Лидерборд'}
      </div>
    </button>
  )
}

function LiveMinute({ base }) {
  const [min, setMin] = useState(parseInt(base) || 0)
  useEffect(() => {
    const t = setInterval(() => setMin((m) => Math.min(m + 1, 90)), 60000)
    return () => clearInterval(t)
  }, [])
  return <span className="font-bold text-live">{min}'</span>
}

function LiveMatchCard({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  return (
    <div className="match-live-card p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#16A34A,transparent)' }} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#16A34A' }}>Прямой эфир</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Группа {match.group} · {match.venue.split(',')[0]}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{home.flag}</span>
          <span className="text-xs font-bold uppercase" style={{ color: '#111827' }}>{home.name}</span>
        </div>
        <div className="flex flex-col items-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
            <span className="text-2xl font-light" style={{ color: '#9CA3AF' }}>:</span>
            <span className="text-4xl font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
          </div>
          <LiveMinute base={match.time} />
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{away.flag}</span>
          <span className="text-xs font-bold uppercase" style={{ color: '#111827' }}>{away.name}</span>
        </div>
      </div>
      {match.goals.length > 0 && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {match.goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: '#6B7280' }}>
              <span>⚽</span>
              <span>{TEAMS[g.team].flag} {g.player}</span>
              <span className="ml-auto">{g.minute}'</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FinishedMatchCard({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  return (
    <div className="match-finished-card p-3 flex items-center gap-3">
      <div className="text-[10px] w-12 text-center flex-shrink-0" style={{ color: '#9CA3AF' }}>{match.date}</div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{home.flag}</span>
        <span className="text-xs truncate font-semibold uppercase" style={{ color: '#111827' }}>{home.name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>:</span>
        <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-xs truncate text-right font-semibold uppercase" style={{ color: '#111827' }}>{away.name}</span>
        <span className="text-lg">{away.flag}</span>
      </div>
      <div className="text-[10px] w-8 text-right flex-shrink-0" style={{ color: '#9CA3AF' }}>Гр.{match.group}</div>
    </div>
  )
}

function UpcomingPredictionPanel({ match, predictions, onSave, saving }) {
  const pred = predictions?.[match.id]
  const [homeVal, setHomeVal] = useState(pred?.home ?? '')
  const [awayVal, setAwayVal] = useState(pred?.away ?? '')
  const [saved, setSaved] = useState(!!pred)

  useEffect(() => {
    if (pred) { setHomeVal(pred.home); setAwayVal(pred.away); setSaved(true) }
  }, [pred])

  const canSubmit = homeVal !== '' && awayVal !== '' && saving !== match.id
  const hasChanged = saved && (homeVal !== pred?.home || awayVal !== pred?.away)
  const inTg = !!window.Telegram?.WebApp?.initData

  async function handleSave() {
    if (!canSubmit) return
    const ok = await onSave(match.id, Number(homeVal), Number(awayVal))
    if (ok) setSaved(true)
  }

  if (!inTg) {
    return (
      <div className="mt-2 px-3 py-2 rounded-xl text-xs text-center" style={{ background: 'rgba(201,168,0,0.07)', color: '#C9A800' }}>
        📱 Открой в Telegram, чтобы сделать прогноз
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', boxShadow: '0 2px 8px rgba(201,168,0,0.08)' }}>
      <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Твой прогноз</div>
      {saved && !hasChanged ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#6B7280' }}>Прогноз:</span>
            <span className="text-base font-black" style={{ color: '#C9A800' }}>{pred?.home} : {pred?.away}</span>
            <span className="text-[10px]" style={{ color: '#16A34A' }}>✓</span>
          </div>
          <button
            onClick={() => setSaved(false)}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded"
            style={{ background: 'rgba(0,0,0,0.05)', color: '#6B7280' }}
          >
            Изменить
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 justify-center">
          <input
            type="number" min="0" max="20"
            value={homeVal}
            onChange={e => { const v = e.target.value; setHomeVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
            className="w-12 h-12 text-center text-xl font-black rounded-xl outline-none"
            style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <span className="text-lg font-bold" style={{ color: '#9CA3AF' }}>:</span>
          <input
            type="number" min="0" max="20"
            value={awayVal}
            onChange={e => { const v = e.target.value; setAwayVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
            className="w-12 h-12 text-center text-xl font-black rounded-xl outline-none"
            style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-xl text-sm font-black ml-1"
            style={{
              background: canSubmit ? '#C9A800' : 'rgba(0,0,0,0.06)',
              color: canSubmit ? '#fff' : '#9CA3AF',
            }}
          >
            {saving === match.id ? '…' : saved && hasChanged ? 'Обновить' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home({ onTab }) {
  const { matches, ticker, scorers } = useLiveData()
  const liveMatches = matches.filter((m) => m.status === 'live')
  const finishedMatches = matches.filter((m) => m.status === 'finished').slice(0, 5)
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 8)
  const totalGoals = matches.filter(m => m.status !== 'upcoming').reduce((s, m) => s + (m.scoreHome || 0) + (m.scoreAway || 0), 0)

  const [expandedUpcoming, setExpandedUpcoming] = useState(null)
  const [upcomingPreds, setUpcomingPreds] = useState({})
  const [savingPred, setSavingPred] = useState(null)

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return
    fetch(API + '/api/my-predictions', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.ok ? r.json() : {})
      .then(d => setUpcomingPreds(d || {}))
      .catch(() => {})
  }, [])

  async function handleSavePred(matchId, home, away) {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return false
    setSavingPred(matchId)
    try {
      const res = await fetch(API + '/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ matchId, home, away }),
      })
      if (!res.ok) return false
      setUpcomingPreds(prev => ({ ...prev, [matchId]: { home, away } }))
      return true
    } catch { return false }
    finally { setSavingPred(null) }
  }

  return (
    <div className="page-content px-4 pb-4">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden mb-4 -mx-4 px-4 pt-12 pb-6"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {TOURNAMENT.hostFlags.map((f, i) => (
                <span key={i} className="text-lg">{f}</span>
              ))}
            </div>
            <h1 className="text-2xl font-black leading-tight tracking-wide uppercase" style={{ color: '#111827' }}>
              FIFA World Cup
            </h1>
            <p className="text-lg font-black" style={{ color: '#C9A800', letterSpacing: '0.08em' }}>
              2026™
            </p>
          </div>
          <UserAvatar onTab={onTab} />
        </div>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: liveMatches.length > 0 ? liveMatches.length : '—', l: 'Live матчей' },
            { v: totalGoals > 0 ? totalGoals : '—', l: 'Голов' },
            { v: matches.filter(m => m.status === 'finished').length || '—', l: 'Сыграно' },
          ].map((s) => (
            <div key={s.l} className="text-center" style={{ background: '#FFFFFF', borderRadius: 3, padding: '8px 4px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <div className="text-xl font-black" style={{ color: '#111827' }}>{s.v}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Ticker */}
      <div
        className="mb-4 overflow-hidden flex items-center"
        style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', height: 36, borderRadius: 3 }}
      >
        <div className="flex-shrink-0 px-3 py-1 text-[10px] font-black tracking-widest" style={{ background: '#C9A800', color: '#FFFFFF' }}>
          LIVE
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-ticker text-[11px]" style={{ color: '#6B7280' }}>
            {[...ticker, ...ticker].map((item, i) => (
              <span key={i} className="px-6">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Идут сейчас</h2>
            </div>
            <button onClick={() => onTab('worldcup.schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Все →
            </button>
          </div>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches — horizontal scroll-snap slider */}
      {upcomingMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Ближайшие матчи</h2>
            <button onClick={() => onTab('worldcup.schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Расписание →
            </button>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              marginLeft: '-1rem',
              marginRight: '-1rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }}
          >
            {upcomingMatches.map((m) => {
              const home = TEAMS[m.home]
              const away = TEAMS[m.away]
              const isExpanded = expandedUpcoming === m.id
              const hasPred = !!(upcomingPreds[m.id])
              return (
                <div
                  key={m.id}
                  className="flex-shrink-0 cursor-pointer"
                  style={{ scrollSnapAlign: 'start', width: '72vw', maxWidth: 260 }}
                  onClick={() => setExpandedUpcoming(isExpanded ? null : m.id)}
                >
                  <div
                    className="p-3"
                    style={{
                      background: '#FFFFFF',
                      border: isExpanded ? '1.5px solid rgba(201,168,0,0.45)' : '1px solid rgba(0,0,0,0.07)',
                      borderRadius: 10,
                      boxShadow: isExpanded ? '0 2px 12px rgba(201,168,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="text-[9px] text-center font-bold uppercase mb-2" style={{ color: '#6B7280' }}>
                      {m.date} · <span style={{ color: '#C9A800' }}>{m.time}</span>
                      {hasPred && <span className="ml-1" style={{ color: '#16A34A' }}>✓</span>}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <span className="text-3xl">{home.flag}</span>
                        <span className="text-[9px] font-bold uppercase text-center leading-tight truncate w-full" style={{ color: '#111827' }}>{home.name}</span>
                      </div>
                      <div className="text-xs font-black flex-shrink-0 px-1" style={{ color: '#9CA3AF' }}>vs</div>
                      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <span className="text-3xl">{away.flag}</span>
                        <span className="text-[9px] font-bold uppercase text-center leading-tight truncate w-full" style={{ color: '#111827' }}>{away.name}</span>
                      </div>
                    </div>
                    <div className="text-[8px] text-center mt-1.5 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                      Гр.{m.group} · {isExpanded ? 'Скрыть ▲' : 'Прогноз ▼'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Inline prediction panel for selected match */}
          {expandedUpcoming && (() => {
            const m = upcomingMatches.find(x => x.id === expandedUpcoming)
            return m ? (
              <UpcomingPredictionPanel
                match={m}
                predictions={upcomingPreds}
                onSave={handleSavePred}
                saving={savingPred}
              />
            ) : null
          })()}
        </section>
      )}

      {/* Recent Results */}
      {finishedMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Последние результаты</h2>
            <button onClick={() => onTab('worldcup.schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Ещё →
            </button>
          </div>
          <div className="space-y-2">
            {finishedMatches.map((m) => (
              <FinishedMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Top Scorer Promo */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Претенденты на Золотую бутсу</h2>
          <button onClick={() => onTab('worldcup.scorers')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
            Топ-15 →
          </button>
        </div>
        <div
          className="p-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          {scorers.slice(0, 3).map((s) => (
            <div key={s.rank} className="flex items-center gap-3 py-2">
              <div
                className={`w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0 rank-${s.rank}`}
                style={{ borderRadius: 3 }}
              >
                {s.rank}
              </div>
              <span className="text-xl flex-shrink-0">{TEAMS[s.team]?.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate uppercase" style={{ color: '#111827' }}>{s.name}</div>
                <div className="text-[10px]" style={{ color: '#6B7280' }}>{s.club}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black" style={{ color: '#C9A800' }}>{s.goals > 0 ? s.goals : '—'}</span>
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>голов</span>
              </div>
            </div>
          ))}
          <div className="mt-2 pt-2 text-center text-[10px] uppercase tracking-wider" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', color: '#9CA3AF' }}>
            Турнир ещё не начался · Данные обновятся 11 июня
          </div>
        </div>
      </section>
    </div>
  )
}

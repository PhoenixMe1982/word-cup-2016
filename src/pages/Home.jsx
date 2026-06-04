import { useState, useEffect } from 'react'
import { TEAMS, TOURNAMENT } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://wc2026-bot.onrender.com').replace(/\/$/, '')

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

export default function Home({ onTab }) {
  const { matches, ticker, scorers } = useLiveData()
  const liveMatches = matches.filter((m) => m.status === 'live')
  const finishedMatches = matches.filter((m) => m.status === 'finished').slice(0, 5)
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming').slice(0, 3)
  const totalGoals = matches.filter(m => m.status !== 'upcoming').reduce((s, m) => s + (m.scoreHome || 0) + (m.scoreAway || 0), 0)

  return (
    <div className="page-content px-4 pb-4">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden mb-4 -mx-4 px-4 pt-12 pb-6"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
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
            <button onClick={() => onTab('schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
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

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Ближайшие матчи</h2>
            <button onClick={() => onTab('schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Расписание →
            </button>
          </div>
          <div className="space-y-2">
            {upcomingMatches.map((m) => {
              const home = TEAMS[m.home]
              const away = TEAMS[m.away]
              return (
                <div key={m.id} className="match-upcoming-card p-3 flex items-center gap-3">
                  <div className="text-[10px] w-20 flex-shrink-0 leading-tight">
                    <div className="uppercase font-bold" style={{ color: '#6B7280' }}>{m.date}</div>
                    <div style={{ color: '#C9A800' }}>{m.time}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                    <span className="text-lg">{home.flag}</span>
                    <span className="text-xs font-bold uppercase truncate" style={{ color: '#111827' }}>{home.name}</span>
                    <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>vs</span>
                    <span className="text-xs font-bold uppercase truncate" style={{ color: '#111827' }}>{away.name}</span>
                    <span className="text-lg">{away.flag}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wide flex-shrink-0" style={{ color: '#9CA3AF' }}>Гр.{m.group}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent Results */}
      {finishedMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Последние результаты</h2>
            <button onClick={() => onTab('schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
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
          <button onClick={() => onTab('worldcup')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
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

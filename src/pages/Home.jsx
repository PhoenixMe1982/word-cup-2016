import { useState, useEffect } from 'react'
import { MATCHES, TEAMS, NEWS, TICKER_ITEMS, TOURNAMENT, TOP_SCORERS } from '../data.js'

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
    <div className="match-live-card rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#22c55e,transparent)' }} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-live animate-pulse2" />
          <span className="text-[10px] font-bold text-live tracking-widest">ПРЯМОЙ ЭФИР</span>
        </div>
        <span className="text-[10px] text-gray-400">Группа {match.group} · {match.venue.split(',')[0]}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{home.flag}</span>
          <span className="text-xs font-semibold text-white">{home.name}</span>
        </div>

        <div className="flex flex-col items-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black score-number text-white">{match.scoreHome}</span>
            <span className="text-2xl text-gray-500 font-light">:</span>
            <span className="text-4xl font-black score-number text-white">{match.scoreAway}</span>
          </div>
          <LiveMinute base={match.time} />
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{away.flag}</span>
          <span className="text-xs font-semibold text-white">{away.name}</span>
        </div>
      </div>

      {match.goals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
          {match.goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
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
    <div className="match-finished-card rounded-xl p-3 flex items-center gap-3">
      <div className="text-[10px] text-gray-500 w-12 text-center flex-shrink-0">{match.date}</div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{home.flag}</span>
        <span className="text-xs text-white truncate">{home.name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-sm font-black score-number text-white">{match.scoreHome}</span>
        <span className="text-xs text-gray-600">:</span>
        <span className="text-sm font-black score-number text-white">{match.scoreAway}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-xs text-white truncate text-right">{away.name}</span>
        <span className="text-lg">{away.flag}</span>
      </div>
      <div className="text-[10px] text-gray-600 w-8 text-right flex-shrink-0">Гр.{match.group}</div>
    </div>
  )
}

export default function Home({ onTab }) {
  const [tickerPos, setTickerPos] = useState(0)
  const liveMatches = MATCHES.filter((m) => m.status === 'live')
  const finishedMatches = MATCHES.filter((m) => m.status === 'finished').slice(0, 5)
  const totalGoals = MATCHES.filter(m => m.status !== 'upcoming').reduce((s, m) => s + (m.scoreHome || 0) + (m.scoreAway || 0), 0)

  return (
    <div className="page-content px-4 pb-4">
      {/* Hero Header */}
      <div
        className="relative rounded-b-3xl overflow-hidden mb-4 -mx-4 px-4 pt-12 pb-6"
        style={{
          background: 'linear-gradient(160deg, #0d1a3a 0%, #1a0d2e 40%, #06080f 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #FFD700 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00D4FF 0%, transparent 40%)' }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {TOURNAMENT.hostFlags.map((f, i) => (
                <span key={i} className="text-lg">{f}</span>
              ))}
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              FIFA WORLD CUP
            </h1>
            <p className="text-lg font-black" style={{ color: '#FFD700', letterSpacing: '0.05em' }}>
              2026™
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl trophy-glow">🏆</div>
            <div className="text-[10px] text-gray-400 mt-1">14 июня 2026</div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: liveMatches.length, l: 'Live матчей' },
            { v: totalGoals, l: 'Голов' },
            { v: 9, l: 'Сыграно' },
          ].map((s) => (
            <div key={s.l} className="text-center" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 4px' }}>
              <div className="text-xl font-black text-white">{s.v}</div>
              <div className="text-[9px] text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Ticker */}
      <div
        className="rounded-xl mb-4 overflow-hidden flex items-center"
        style={{ background: '#0f1628', border: '1px solid rgba(255,215,0,0.2)', height: 36 }}
      >
        <div className="flex-shrink-0 px-3 py-1 text-[10px] font-black tracking-widest" style={{ background: '#FFD700', color: '#000' }}>
          LIVE
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-ticker text-[11px] text-gray-300">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
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
              <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse2" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Идут сейчас</h2>
            </div>
            <button onClick={() => onTab('schedule')} className="text-[11px]" style={{ color: '#FFD700' }}>
              Все матчи →
            </button>
          </div>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Results */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Последние результаты</h2>
          <button onClick={() => onTab('schedule')} className="text-[11px]" style={{ color: '#FFD700' }}>
            Ещё →
          </button>
        </div>
        <div className="space-y-2">
          {finishedMatches.map((m) => (
            <FinishedMatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* Top Scorer Promo */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Лучшие бомбардиры</h2>
          <button onClick={() => onTab('scorers')} className="text-[11px]" style={{ color: '#FFD700' }}>
            Топ-15 →
          </button>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #1a1000 0%, #261a00 100%)', border: '1px solid rgba(255,215,0,0.25)' }}
        >
          {TOP_SCORERS.slice(0, 3).map((s) => (
            <div key={s.rank} className="flex items-center gap-3 py-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 rank-${s.rank}`}
              >
                {s.rank}
              </div>
              <span className="text-xl flex-shrink-0">{TEAMS[s.team]?.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{s.name}</div>
                <div className="text-[10px] text-gray-500">{s.club}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black" style={{ color: '#FFD700' }}>{s.goals}</span>
                <span className="text-[10px] text-gray-500">голов</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hot News */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Горячие инсайды</h2>
          <button onClick={() => onTab('insider')} className="text-[11px]" style={{ color: '#FFD700' }}>
            Все →
          </button>
        </div>
        <div className="space-y-3">
          {NEWS.filter((n) => n.hot).slice(0, 3).map((n) => (
            <div
              key={n.id}
              className="rounded-xl p-3 flex gap-3 items-start"
              style={{ background: '#141929', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {n.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: n.categoryColor + '22', color: n.categoryColor }}
                  >
                    {n.category}
                  </span>
                  <span className="text-[9px] text-gray-500">{n.time}</span>
                </div>
                <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{n.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

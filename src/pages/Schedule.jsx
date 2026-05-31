import { useState } from 'react'
import { MATCHES, TEAMS } from '../data.js'

function StatusBadge({ status, time }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse2" />
        <span className="text-[10px] font-bold text-live">{time}</span>
      </div>
    )
  }
  if (status === 'finished') {
    return <span className="text-[10px] text-gray-500">Завершён</span>
  }
  return <span className="text-[10px] text-gray-400">{time}</span>
}

function MatchRow({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'

  return (
    <div
      className={`rounded-xl p-3 ${isLive ? 'match-live-card' : isUpcoming ? 'match-upcoming-card' : 'match-finished-card'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold tracking-widest text-gray-500">
          ГРУППА {match.group}
        </span>
        <StatusBadge status={match.status} time={match.time} />
      </div>

      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{home.flag}</span>
          <span className="text-sm font-bold text-white truncate">{home.name}</span>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-center px-2">
          {isUpcoming ? (
            <span className="text-sm font-bold text-gray-500">vs</span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black score-number text-white">{match.scoreHome}</span>
              <span className="text-gray-600">:</span>
              <span className="text-xl font-black score-number text-white">{match.scoreAway}</span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold text-white truncate text-right">{away.name}</span>
          <span className="text-2xl flex-shrink-0">{away.flag}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-600">📍 {match.venue}</span>
        {!isUpcoming && match.goals.length > 0 && (
          <div className="flex gap-2 text-[10px] text-gray-500">
            {match.goals.slice(0, 2).map((g, i) => (
              <span key={i}>⚽ {g.player} {g.minute}'</span>
            ))}
            {match.goals.length > 2 && <span>+{match.goals.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'live', label: '🔴 Live' },
  { id: 'finished', label: 'Завершённые' },
  { id: 'upcoming', label: 'Предстоящие' },
]

const GROUPS = ['Все', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function Schedule() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('Все')

  const filtered = MATCHES.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    if (groupFilter !== 'Все' && m.group !== groupFilter) return false
    return true
  })

  const byDate = filtered.reduce((acc, m) => {
    const key = m.status === 'live' ? '🔴 Идёт сейчас' : m.date
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(180deg, #0d1a3a 0%, #06080f 100%)' }}
      >
        <h1 className="text-2xl font-black text-white mb-1">Расписание</h1>
        <p className="text-xs text-gray-400">ЧМ 2026 · Групповой этап</p>
      </div>

      {/* Status Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: statusFilter === f.id ? '#FFD700' : 'rgba(255,255,255,0.06)',
                color: statusFilter === f.id ? '#000' : '#9ca3af',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mt-2 no-scrollbar">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className="flex-shrink-0 w-8 h-8 rounded-lg text-xs font-black transition-all duration-200"
              style={{
                background: groupFilter === g ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)',
                color: groupFilter === g ? '#FFD700' : '#6b7280',
                border: groupFilter === g ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Matches */}
      <div className="px-4 mt-2 space-y-4">
        {Object.entries(byDate).map(([date, matches]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-gray-400">{date}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">Матчи не найдены</div>
        )}
      </div>
    </div>
  )
}

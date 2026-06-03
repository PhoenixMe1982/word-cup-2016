import { useState } from 'react'
import { TEAMS } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

function StatusBadge({ status, time }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
        <span className="text-[10px] font-bold" style={{ color: '#16A34A' }}>{time}</span>
      </div>
    )
  }
  if (status === 'finished') {
    return <span className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Завершён</span>
  }
  return <span className="text-[10px] font-bold" style={{ color: '#C9A800' }}>{time}</span>
}

function MatchRow({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'

  return (
    <div
      className={`p-3 ${isLive ? 'match-live-card' : isUpcoming ? 'match-upcoming-card' : 'match-finished-card'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#9CA3AF' }}>
          Группа {match.group}
        </span>
        <StatusBadge status={match.status} time={match.time} />
      </div>

      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{home.flag}</span>
          <span className="text-sm font-bold truncate uppercase" style={{ color: '#111827' }}>{home.name}</span>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-center px-2">
          {isUpcoming ? (
            <span className="text-sm font-black" style={{ color: '#9CA3AF' }}>vs</span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
              <span style={{ color: '#9CA3AF' }}>:</span>
              <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold truncate text-right uppercase" style={{ color: '#111827' }}>{away.name}</span>
          <span className="text-2xl flex-shrink-0">{away.flag}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>📍 {match.venue}</span>
        {!isUpcoming && match.goals && match.goals.length > 0 && (
          <div className="flex gap-2 text-[10px]" style={{ color: '#6B7280' }}>
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

const GROUP_KEYS = ['Все', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function Schedule() {
  const { matches } = useLiveData()
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('Все')

  const filtered = matches.filter((m) => {
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
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <h1 className="text-2xl font-black mb-1 uppercase tracking-wide" style={{ color: '#111827' }}>Расписание</h1>
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>ЧМ 2026 · Групповой этап</p>
      </div>

      {/* Status Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-black transition-all duration-200 uppercase tracking-wide"
              style={{
                background: statusFilter === f.id ? '#C9A800' : 'rgba(0,0,0,0.05)',
                color: statusFilter === f.id ? '#FFFFFF' : '#6B7280',
                borderRadius: 3,
                border: statusFilter === f.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mt-2 no-scrollbar">
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className="flex-shrink-0 w-8 h-8 text-xs font-black transition-all duration-200 uppercase"
              style={{
                background: groupFilter === g ? 'rgba(201,168,0,0.15)' : 'rgba(0,0,0,0.04)',
                color: groupFilter === g ? '#C9A800' : '#6B7280',
                border: groupFilter === g ? '1px solid rgba(201,168,0,0.35)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 3,
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
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#6B7280' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Матчи не найдены</div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { TEAMS } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const MEDAL_COLORS = {
  1: { bg: 'linear-gradient(135deg,#FFD700,#FF8C00)', text: '#000' },
  2: { bg: 'linear-gradient(135deg,#C0C0C0,#909090)', text: '#000' },
  3: { bg: 'linear-gradient(135deg,#CD7F32,#8B4513)', text: '#fff' },
}

function ScorerRow({ scorer, maxGoals }) {
  const team = TEAMS[scorer.team]
  const medal = MEDAL_COLORS[scorer.rank]

  return (
    <div
      className="p-4 mb-2 relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        borderLeft: scorer.rank <= 3 ? '2px solid #C9A800' : '2px solid transparent',
        border: scorer.rank <= 3
          ? undefined
          : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 3,
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      }}
    >
      {scorer.rank <= 3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '1px solid rgba(0,0,0,0.07)',
            borderLeft: '2px solid #C9A800',
            borderRadius: 3,
          }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Rank */}
        <div
          className="w-8 h-8 flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{
            borderRadius: 3,
            ...(medal
              ? { background: medal.bg, color: medal.text }
              : { background: 'rgba(0,0,0,0.07)', color: '#6B7280' }),
          }}
        >
          {scorer.rank <= 3 ? ['🥇', '🥈', '🥉'][scorer.rank - 1] : scorer.rank}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black truncate uppercase" style={{ color: '#111827' }}>{scorer.name}</span>
            {scorer.rank === 1 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5"
                style={{ background: '#C9A800', color: '#FFFFFF', borderRadius: 2 }}
              >
                ТОП
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: '#6B7280' }}>
            <span>{team?.flag} {team?.name}</span>
            <span>·</span>
            <span>{scorer.club}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: scorer.goals > 0 ? `${(scorer.goals / maxGoals) * 100}%` : '4px',
                background: scorer.rank === 1 ? '#C9A800' : scorer.rank <= 3 ? '#9A8000' : '#0EA5E9',
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black score-number" style={{ color: scorer.rank === 1 ? '#C9A800' : '#111827' }}>
              {scorer.goals}
            </span>
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>гол</span>
          </div>
          <div className="text-[10px]" style={{ color: '#6B7280' }}>
            {scorer.assists} пас · {scorer.matches} матч
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Scorers() {
  const { scorers } = useLiveData()
  const [view, setView] = useState('goals')

  const sorted = [...scorers].sort((a, b) =>
    view === 'goals' ? b.goals - a.goals : b.assists - a.assists
  ).map((s, i) => ({ ...s, rank: i + 1 }))
  const maxGoals = Math.max(sorted[0]?.goals || 0, 1)

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Бомбардиры</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Претенденты на Золотую бутсу</p>
          </div>
          <div className="text-5xl">⚽</div>
        </div>

        {/* Leader Card */}
        <div
          className="mt-4 p-4 flex items-center gap-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#C9A800' }}>Фаворит — Золотая бутса</div>
            <div className="text-lg font-black truncate uppercase" style={{ color: '#111827' }}>{sorted[0]?.name}</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{TEAMS[sorted[0]?.team]?.flag} {sorted[0]?.club}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black" style={{ color: '#C9A800' }}>
              {sorted[0]?.goals > 0 ? sorted[0].goals : '—'}
            </div>
            <div className="text-[10px]" style={{ color: '#9CA3AF' }}>голов</div>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
          Турнир стартует 11 июня · Голы ещё не забиты
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 mt-3 mb-3">
        <div
          className="flex p-1"
          style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}
        >
          {[
            { id: 'goals', label: '⚽ Голы' },
            { id: 'assists', label: '🎯 Ассисты' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex-1 py-2 text-xs font-black transition-all duration-200 uppercase tracking-wide"
              style={{
                background: view === v.id ? '#C9A800' : 'transparent',
                color: view === v.id ? '#FFFFFF' : '#6B7280',
                borderRadius: 2,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {sorted.map((scorer) => (
          <ScorerRow key={scorer.name} scorer={scorer} maxGoals={maxGoals} />
        ))}
      </div>
    </div>
  )
}

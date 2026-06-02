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
        background: scorer.rank <= 3
          ? 'linear-gradient(135deg, #1a1500 0%, #201c00 100%)'
          : '#141929',
        border: scorer.rank === 1
          ? '1px solid rgba(255,215,0,0.5)'
          : scorer.rank <= 3
          ? '1px solid rgba(255,215,0,0.2)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 3,
      }}
    >
      {scorer.rank === 1 && (
        <div className="absolute top-0 right-0 text-4xl opacity-10 pointer-events-none pr-2 pt-1">⚽</div>
      )}

      <div className="flex items-center gap-3">
        {/* Rank */}
        <div
          className="w-8 h-8 flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{
            borderRadius: 3,
            ...(medal
              ? { background: medal.bg, color: medal.text }
              : { background: 'rgba(255,255,255,0.07)', color: '#9ca3af' }),
          }}
        >
          {scorer.rank <= 3 ? ['🥇', '🥈', '🥉'][scorer.rank - 1] : scorer.rank}
        </div>

        {/* Avatar */}
        <div
          className="w-10 h-10 flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}
        >
          {scorer.avatar}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black text-white truncate uppercase">{scorer.name}</span>
            {scorer.rank === 1 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5"
                style={{ background: '#FFD700', color: '#000', borderRadius: 2 }}
              >
                ТОП
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
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
                background: scorer.rank === 1 ? '#FFD700' : scorer.rank <= 3 ? '#FF8C00' : '#00D4FF',
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black score-number" style={{ color: scorer.rank === 1 ? '#FFD700' : '#fff' }}>
              {scorer.goals}
            </span>
            <span className="text-[10px] text-gray-500">гол</span>
          </div>
          <div className="text-[10px] text-gray-500">
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
        style={{ background: 'linear-gradient(160deg, #1a1000 0%, #080c15 100%)', borderBottom: '1px solid rgba(255,215,0,0.15)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest text-gray-500 mb-1 uppercase">ЧМ 2026</p>
            <h1 className="text-2xl font-black text-white uppercase tracking-wide">Бомбардиры</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">Претенденты на Золотую бутсу</p>
          </div>
          <div className="text-5xl">⚽</div>
        </div>

        {/* Leader Card */}
        <div
          className="mt-4 p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #261a00, #1a1200)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 3 }}
        >
          <div className="text-4xl">{sorted[0]?.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#FFD700' }}>Фаворит — Золотая бутса</div>
            <div className="text-lg font-black text-white truncate uppercase">{sorted[0]?.name}</div>
            <div className="text-xs text-gray-400">{TEAMS[sorted[0]?.team]?.flag} {sorted[0]?.club}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black" style={{ color: '#FFD700' }}>
              {sorted[0]?.goals > 0 ? sorted[0].goals : '—'}
            </div>
            <div className="text-[10px] text-gray-500">голов</div>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-600 uppercase tracking-wider">
          Турнир стартует 11 июня · Голы ещё не забиты
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 mt-3 mb-3">
        <div
          className="flex p-1"
          style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.07)' }}
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
                background: view === v.id ? '#FFD700' : 'transparent',
                color: view === v.id ? '#000' : '#6b7280',
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

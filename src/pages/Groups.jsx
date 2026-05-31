import { useState } from 'react'
import { GROUPS, TEAMS } from '../data.js'

function GroupTable({ groupKey }) {
  const group = GROUPS[groupKey]
  if (!group) return null

  const sorted = [...group.teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })

  return (
    <div
      className="overflow-hidden mb-4"
      style={{ background: '#141929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,215,0,0.07)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-black text-sm uppercase tracking-wide" style={{ color: '#FFD700' }}>
          {group.name}
        </span>
        <div className="grid grid-cols-7 gap-0 text-[9px] text-gray-500 font-black uppercase tracking-wider">
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">В</span>
          <span className="w-5 text-center">Н</span>
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">ГЗ</span>
          <span className="w-5 text-center">ГП</span>
          <span className="w-6 text-center text-gray-300">О</span>
        </div>
      </div>

      {/* Rows */}
      {sorted.map((row, idx) => {
        const team = TEAMS[row.code]
        const qualifies = idx < 2
        const borderClass = idx === 0 ? 'qualify-1' : idx === 1 ? 'qualify-2' : ''
        return (
          <div
            key={row.code}
            className={`px-4 py-2.5 flex items-center border-b border-white/[0.03] last:border-0 ${borderClass}`}
            style={{ background: qualifies ? 'rgba(255,255,255,0.02)' : 'transparent' }}
          >
            {/* Rank */}
            <div
              className="w-5 h-5 flex items-center justify-center text-[10px] font-black mr-2 flex-shrink-0"
              style={{
                borderRadius: 2,
                background: idx === 0 ? 'rgba(255,215,0,0.2)' : idx === 1 ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: idx === 0 ? '#FFD700' : idx === 1 ? '#00e5ff' : '#6b7280',
              }}
            >
              {idx + 1}
            </div>

            {/* Team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base">{team?.flag}</span>
              <span className="text-xs font-bold text-white truncate uppercase">{team?.name}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-7 gap-0 text-[11px]">
              {[row.p, row.w, row.d, row.l, row.gf, row.ga].map((v, i) => (
                <span key={i} className="w-5 text-center text-gray-400">{v}</span>
              ))}
              <span
                className="w-6 text-center font-black"
                style={{ color: row.pts > 0 ? '#fff' : '#4b5563' }}
              >
                {row.pts}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const GROUP_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function Groups() {
  const [selected, setSelected] = useState(null)

  const toShow = selected ? [selected] : GROUP_KEYS

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(180deg, #0d1a3a 0%, #080c15 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h1 className="text-2xl font-black text-white mb-1 uppercase tracking-wide">Группы</h1>
        <p className="text-xs text-gray-400 uppercase tracking-wider">12 групп · 48 команд</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4" style={{ background: '#FFD700' }} />
            <span className="uppercase tracking-wide">1-е место</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4" style={{ background: '#00e5ff' }} />
            <span className="uppercase tracking-wide">2-е место (выход)</span>
          </div>
        </div>
      </div>

      {/* Group Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar flex-wrap">
          <button
            onClick={() => setSelected(null)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-black transition-all duration-200 uppercase tracking-wide"
            style={{
              background: selected === null ? '#FFD700' : 'rgba(255,255,255,0.06)',
              color: selected === null ? '#000' : '#9ca3af',
              borderRadius: 3,
              border: selected === null ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Все
          </button>
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              onClick={() => setSelected(selected === g ? null : g)}
              className="flex-shrink-0 w-9 h-8 text-xs font-black transition-all duration-200 uppercase"
              style={{
                background: selected === g ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)',
                color: selected === g ? '#FFD700' : '#6b7280',
                border: selected === g ? '1px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 3,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tables */}
      <div className="px-4 mt-3">
        {toShow.map((key) => (
          <GroupTable key={key} groupKey={key} />
        ))}
      </div>
    </div>
  )
}

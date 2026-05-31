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
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: '#141929', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,215,0,0.07)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-black text-sm" style={{ color: '#FFD700' }}>
          {group.name}
        </span>
        <div className="grid grid-cols-7 gap-0 text-[9px] text-gray-500 font-bold">
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">В</span>
          <span className="w-5 text-center">Н</span>
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">ГЗ</span>
          <span className="w-5 text-center">ГП</span>
          <span className="w-6 text-center font-black text-gray-300">О</span>
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
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black mr-2 flex-shrink-0"
              style={{
                background: idx === 0 ? 'rgba(255,215,0,0.2)' : idx === 1 ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                color: idx === 0 ? '#FFD700' : idx === 1 ? '#60a5fa' : '#6b7280',
              }}
            >
              {idx + 1}
            </div>

            {/* Team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base">{team?.flag}</span>
              <span className="text-xs font-bold text-white truncate">{team?.name}</span>
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
        style={{ background: 'linear-gradient(180deg, #0d1a3a 0%, #06080f 100%)' }}
      >
        <h1 className="text-2xl font-black text-white mb-1">Группы</h1>
        <p className="text-xs text-gray-400">12 групп · 48 команд</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4 rounded-full" style={{ background: '#FFD700' }} />
            <span>1-е место</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4 rounded-full" style={{ background: '#60a5fa' }} />
            <span>2-е место (выход)</span>
          </div>
        </div>
      </div>

      {/* Group Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar flex-wrap">
          <button
            onClick={() => setSelected(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={{
              background: selected === null ? '#FFD700' : 'rgba(255,255,255,0.06)',
              color: selected === null ? '#000' : '#9ca3af',
            }}
          >
            Все
          </button>
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              onClick={() => setSelected(selected === g ? null : g)}
              className="flex-shrink-0 w-9 h-8 rounded-lg text-xs font-black transition-all duration-200"
              style={{
                background: selected === g ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)',
                color: selected === g ? '#FFD700' : '#6b7280',
                border: selected === g ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
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

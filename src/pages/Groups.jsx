import { useState } from 'react'
import { TEAMS, HEADER_BANNER_STYLE } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

function GroupTable({ groupKey, groups }) {
  const group = groups[groupKey]
  if (!group) return null

  const sorted = [...group.teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })

  return (
    <div
      className="overflow-hidden mb-4"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(201,168,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
      >
        <span className="font-black text-sm uppercase tracking-wide" style={{ color: '#C9A800' }}>
          {group.name}
        </span>
        <div className="grid grid-cols-7 gap-0 text-[9px] font-black uppercase tracking-wider" style={{ color: '#6B7280' }}>
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">В</span>
          <span className="w-5 text-center">Н</span>
          <span className="w-5 text-center">П</span>
          <span className="w-5 text-center">ГЗ</span>
          <span className="w-5 text-center">ГП</span>
          <span className="w-6 text-center" style={{ color: '#111827' }}>О</span>
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
            className={`px-4 py-2.5 flex items-center last:border-0 ${borderClass}`}
            style={{ background: qualifies ? 'rgba(201,168,0,0.03)' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
          >
            {/* Rank */}
            <div
              className="w-5 h-5 flex items-center justify-center text-[10px] font-black mr-2 flex-shrink-0"
              style={{
                borderRadius: 2,
                background: idx === 0 ? 'rgba(201,168,0,0.15)' : idx === 1 ? 'rgba(14,165,233,0.12)' : 'rgba(0,0,0,0.05)',
                color: idx === 0 ? '#C9A800' : idx === 1 ? '#0EA5E9' : '#6B7280',
              }}
            >
              {idx + 1}
            </div>

            {/* Team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base">{team?.flag}</span>
              <span className="text-xs font-bold truncate uppercase" style={{ color: '#111827' }}>{team?.name}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-7 gap-0 text-[11px]">
              {[row.p, row.w, row.d, row.l, row.gf, row.ga].map((v, i) => (
                <span key={i} className="w-5 text-center" style={{ color: '#6B7280' }}>{v}</span>
              ))}
              <span
                className="w-6 text-center font-black"
                style={{ color: row.pts > 0 ? '#111827' : '#9CA3AF' }}
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
  const { groups } = useLiveData()
  const [selected, setSelected] = useState(null)

  const toShow = selected ? [selected] : GROUP_KEYS

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <h1 className="text-2xl font-black mb-1 uppercase tracking-wide" style={{ color: '#111827' }}>Группы</h1>
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>12 групп · 48 команд</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: '#9CA3AF' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4" style={{ background: '#C9A800' }} />
            <span className="uppercase tracking-wide">1-е место</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-4" style={{ background: '#0EA5E9' }} />
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
              background: selected === null ? '#C9A800' : 'rgba(0,0,0,0.05)',
              color: selected === null ? '#FFFFFF' : '#6B7280',
              borderRadius: 3,
              border: selected === null ? 'none' : '1px solid rgba(0,0,0,0.08)',
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
                background: selected === g ? 'rgba(201,168,0,0.15)' : 'rgba(0,0,0,0.04)',
                color: selected === g ? '#C9A800' : '#6B7280',
                border: selected === g ? '1px solid rgba(201,168,0,0.35)' : '1px solid rgba(0,0,0,0.08)',
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
          <GroupTable key={key} groupKey={key} groups={groups} />
        ))}
      </div>
    </div>
  )
}

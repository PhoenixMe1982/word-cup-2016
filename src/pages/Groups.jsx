import { useState } from 'react'
import { TEAMS, MATCHES } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { toLocalDateTime, compareKickoff } from '../utils.js'

// Все матчи группы (хронологически). Завершённые — со счётом, остальные — со временем.
function GroupMatches({ groupKey, matches }) {
  const byId = {}
  for (const m of matches) byId[m.id] = m
  const list = MATCHES
    .filter((m) => m.group === groupKey)
    .map((m) => byId[m.id] || m)
    .sort(compareKickoff)

  return (
    <div className="mb-4">
      <h3 className="text-xs font-black uppercase tracking-wider mb-2 px-1" style={{ color: '#111827' }}>
        Матчи группы {groupKey}
      </h3>
      <div className="space-y-2">
        {list.map((m) => {
          const home = TEAMS[m.home]
          const away = TEAMS[m.away]
          const finished = m.status === 'finished' && m.scoreHome != null
          const live = m.status === 'live'
          const { time: localTime, date: localDate } = toLocalDateTime(m.date, m.time)
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <div className="text-[9px] w-12 text-center flex-shrink-0 leading-tight" style={{ color: '#9CA3AF' }}>
                {localDate}<br />{localTime}
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                <span className="text-[11px] font-bold uppercase truncate text-right" style={{ color: '#111827' }}>{home?.name}</span>
                <span className="text-lg flex-shrink-0">{home?.flag}</span>
              </div>
              <div className="flex-shrink-0 text-center" style={{ minWidth: 46 }}>
                {finished || (live && m.scoreHome != null) ? (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{m.scoreHome}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>:</span>
                    <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{m.scoreAway}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: '#C9A800' }}>vs</span>
                )}
                {live && <div className="text-[8px] font-black uppercase" style={{ color: '#16A34A' }}>live</div>}
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">{away?.flag}</span>
                <span className="text-[11px] font-bold uppercase truncate" style={{ color: '#111827' }}>{away?.name}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
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
                borderRadius: 10,
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
  const { groups, matches } = useLiveData()
  const [selected, setSelected] = useState(null)

  const toShow = selected ? [selected] : GROUP_KEYS

  return (
    <div className="page-content">
      {/* Info strip (заголовок раздела уже в шапке ЧМ) */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>12 групп · 48 команд</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: '#6B7280' }}>
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
              color: selected === null ? '#FFFFFF' : '#374151',
              borderRadius: 16,
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
                color: selected === g ? '#C9A800' : '#374151',
                border: selected === g ? '1px solid rgba(201,168,0,0.35)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tables (+ матчи группы при выборе конкретной группы) */}
      <div className="px-4 mt-3">
        {toShow.map((key) => (
          <div key={key}>
            <GroupTable groupKey={key} groups={groups} />
            {selected === key && <GroupMatches groupKey={key} matches={matches} />}
          </div>
        ))}
      </div>
    </div>
  )
}

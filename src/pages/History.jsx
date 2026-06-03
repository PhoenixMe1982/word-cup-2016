import { useState } from 'react'
import { HISTORY } from '../data.js'

function HistoryCard({ wc, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 mb-3"
      style={{
        background: '#FFFFFF',
        border: isSelected
          ? '1px solid rgba(201,168,0,0.35)'
          : '1px solid rgba(0,0,0,0.07)',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isSelected ? '0 4px 16px rgba(201,168,0,0.12)' : '0 1px 6px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ borderBottom: isSelected ? '1px solid rgba(0,0,0,0.07)' : 'none' }}
      >
        {/* Year badge */}
        <div
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, #C9A800, #9A8000)'
              : 'rgba(201,168,0,0.10)',
          }}
        >
          <span className="text-xs font-bold" style={{ color: isSelected ? '#FFFFFF' : '#C9A800' }}>
            {wc.year}
          </span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{wc.winnerFlag}</span>
            <span className="text-base font-black" style={{ color: '#111827' }}>{wc.winner}</span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>чемпион</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#6B7280' }}>
            <span>{wc.flag} {wc.host}</span>
            <span>·</span>
            <span>Финал: {wc.score}</span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
            vs {wc.runnerUpFlag} {wc.runnerUp}
          </div>
        </div>

        {/* Trophy */}
        <div className="text-2xl flex-shrink-0">{isSelected ? '🏆' : '🥇'}</div>
      </div>

      {/* Expanded details */}
      {isSelected && (
        <div className="px-4 pb-4 space-y-3">
          {/* Scorer */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(201,168,0,0.07)' }}
          >
            <span className="text-xl">👟</span>
            <div>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: '#9CA3AF' }}>ЛУЧШИЙ БОМБАРДИР</div>
              <div className="text-xs font-bold" style={{ color: '#111827' }}>{wc.topScorer}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Команды', value: wc.teams },
              { label: 'Голов', value: wc.goals },
              { label: 'Зрителей', value: wc.attendance },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-2 text-center"
                style={{ background: 'rgba(0,0,0,0.04)' }}
              >
                <div className="text-sm font-black" style={{ color: '#111827' }}>{s.value}</div>
                <div className="text-[9px]" style={{ color: '#9CA3AF' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Fact */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
          >
            <div className="text-[10px] font-bold mb-1" style={{ color: '#0EA5E9' }}>⚡ ИСТОРИЧЕСКИЙ ФАКТ</div>
            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{wc.fact}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function History() {
  const [selected, setSelected] = useState(null)
  const [era, setEra] = useState('all')

  const eras = [
    { id: 'all', label: 'Все' },
    { id: '1930s', label: '1930–50е' },
    { id: '1960s', label: '1960–70е' },
    { id: '1980s', label: '1980–90е' },
    { id: '2000s', label: '2000–10е' },
    { id: '2020s', label: '2020+' },
  ]

  const filtered = HISTORY.filter((wc) => {
    if (era === 'all') return true
    if (era === '1930s') return wc.year >= 1930 && wc.year <= 1958
    if (era === '1960s') return wc.year >= 1962 && wc.year <= 1978
    if (era === '1980s') return wc.year >= 1982 && wc.year <= 1998
    if (era === '2000s') return wc.year >= 2002 && wc.year <= 2018
    if (era === '2020s') return wc.year >= 2022
    return true
  })

  // Champions count
  const champCount = HISTORY.reduce((acc, wc) => {
    acc[wc.winner] = (acc[wc.winner] || 0) + 1
    return acc
  }, {})

  const topChamps = Object.entries(champCount)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: '#9CA3AF' }}>1930 – 2022</p>
            <h1 className="text-2xl font-black" style={{ color: '#111827' }}>История ЧМ</h1>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>22 турнира · 88 лет футбола</p>
          </div>
          <div className="text-5xl trophy-glow">🏆</div>
        </div>

        {/* Top Champions */}
        <div className="mt-4">
          <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#9CA3AF' }}>РЕКОРДНЫЕ ЧЕМПИОНЫ</div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topChamps.map(([name, count], i) => {
              const wc = HISTORY.find((w) => w.winner === name)
              return (
                <div
                  key={name}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: i === 0 ? 'rgba(201,168,0,0.10)' : 'rgba(0,0,0,0.04)',
                    border: i === 0 ? '1px solid rgba(201,168,0,0.25)' : '1px solid rgba(0,0,0,0.07)',
                  }}
                >
                  <span className="text-lg">{wc?.winnerFlag}</span>
                  <div>
                    <div className="text-[10px] font-black" style={{ color: '#111827' }}>{name}</div>
                    <div className="text-[9px]" style={{ color: i === 0 ? '#C9A800' : '#6B7280' }}>
                      {count}× чемпион
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Era Filter */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {eras.map((e) => (
            <button
              key={e.id}
              onClick={() => setEra(e.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                background: era === e.id ? '#C9A800' : 'rgba(0,0,0,0.05)',
                color: era === e.id ? '#FFFFFF' : '#6B7280',
                border: era === e.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 mt-3">
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-7 top-0 bottom-0 w-px"
            style={{ background: 'rgba(201,168,0,0.2)' }}
          />

          {[...filtered].reverse().map((wc, idx) => (
            <div key={wc.year} className="relative flex gap-3 mb-1">
              {/* Dot */}
              <div className="flex flex-col items-center w-14 flex-shrink-0 pt-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 relative z-10"
                  style={{
                    background: selected === wc.year ? '#C9A800' : 'rgba(201,168,0,0.35)',
                    boxShadow: selected === wc.year ? '0 0 0 3px rgba(201,168,0,0.2)' : 'none',
                  }}
                />
              </div>
              {/* Card */}
              <div className="flex-1 min-w-0">
                <HistoryCard
                  wc={wc}
                  onClick={() => setSelected(selected === wc.year ? null : wc.year)}
                  isSelected={selected === wc.year}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

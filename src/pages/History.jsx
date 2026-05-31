import { useState } from 'react'
import { HISTORY } from '../data.js'

function HistoryCard({ wc, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 mb-3"
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, #1a1000 0%, #261a00 100%)'
          : '#141929',
        border: isSelected
          ? '1px solid rgba(255,215,0,0.4)'
          : '1px solid rgba(255,255,255,0.05)',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ borderBottom: isSelected ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        {/* Year badge */}
        <div
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, #FFD700, #FF8C00)'
              : 'rgba(255,215,0,0.08)',
          }}
        >
          <span className="text-xs font-bold" style={{ color: isSelected ? '#000' : '#FFD700' }}>
            {wc.year}
          </span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{wc.winnerFlag}</span>
            <span className="text-base font-black text-white">{wc.winner}</span>
            <span className="text-xs text-gray-600">чемпион</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>{wc.flag} {wc.host}</span>
            <span>·</span>
            <span>Финал: {wc.score}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
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
            style={{ background: 'rgba(255,215,0,0.06)' }}
          >
            <span className="text-xl">👟</span>
            <div>
              <div className="text-[10px] text-gray-500 font-bold mb-0.5">ЛУЧШИЙ БОМБАРДИР</div>
              <div className="text-xs font-bold text-white">{wc.topScorer}</div>
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
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="text-sm font-black text-white">{s.value}</div>
                <div className="text-[9px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Fact */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}
          >
            <div className="text-[10px] font-bold mb-1" style={{ color: '#00D4FF' }}>⚡ ИСТОРИЧЕСКИЙ ФАКТ</div>
            <p className="text-xs text-gray-300 leading-relaxed">{wc.fact}</p>
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
    .slice(0, 5)

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: 'linear-gradient(160deg, #0d0a1a 0%, #06080f 100%)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-1">1930 – 2022</p>
            <h1 className="text-2xl font-black text-white">История ЧМ</h1>
            <p className="text-xs text-gray-400 mt-0.5">22 турнира · 88 лет футбола</p>
          </div>
          <div className="text-5xl trophy-glow">🏆</div>
        </div>

        {/* Top Champions */}
        <div className="mt-4">
          <div className="text-[10px] font-bold tracking-widest text-gray-500 mb-2">РЕКОРДНЫЕ ЧЕМПИОНЫ</div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topChamps.map(([name, count], i) => {
              const wc = HISTORY.find((w) => w.winner === name)
              return (
                <div
                  key={name}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: i === 0 ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)',
                    border: i === 0 ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-lg">{wc?.winnerFlag}</span>
                  <div>
                    <div className="text-[10px] font-black text-white">{name}</div>
                    <div className="text-[9px]" style={{ color: i === 0 ? '#FFD700' : '#6b7280' }}>
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
                background: era === e.id ? '#FFD700' : 'rgba(255,255,255,0.06)',
                color: era === e.id ? '#000' : '#9ca3af',
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
            style={{ background: 'rgba(255,215,0,0.1)' }}
          />

          {[...filtered].reverse().map((wc, idx) => (
            <div key={wc.year} className="relative flex gap-3 mb-1">
              {/* Dot */}
              <div className="flex flex-col items-center w-14 flex-shrink-0 pt-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 relative z-10"
                  style={{
                    background: selected === wc.year ? '#FFD700' : 'rgba(255,215,0,0.3)',
                    boxShadow: selected === wc.year ? '0 0 0 3px rgba(255,215,0,0.2)' : 'none',
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

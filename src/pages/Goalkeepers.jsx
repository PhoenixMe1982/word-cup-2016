import { GOALKEEPERS, TEAMS } from '../data.js'

const MAX_MINUTES = 180

function RatingBar({ value, max = 10 }) {
  const pct = (value / max) * 100
  return (
    <div className="stat-bar mt-1.5">
      <div
        className="stat-bar-fill"
        style={{
          width: `${pct}%`,
          background: value >= 9 ? '#FFD700' : value >= 8.5 ? '#22c55e' : value >= 8 ? '#00D4FF' : '#60a5fa',
        }}
      />
    </div>
  )
}

function CleanSheetRing({ cleanSheets, matches }) {
  const pct = matches > 0 ? (cleanSheets / matches) * 100 : 0
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={cleanSheets > 0 ? '#22c55e' : '#374151'}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg relative z-10">🧤</span>
    </div>
  )
}

function GKRow({ gk }) {
  const team = TEAMS[gk.team]
  const minutePct = Math.min((gk.minutesWithoutGoal / MAX_MINUTES) * 100, 100)

  return (
    <div
      className="rounded-2xl p-4 mb-2"
      style={{
        background: gk.rank <= 3
          ? 'linear-gradient(135deg, #001a0a 0%, #001f0d 100%)'
          : '#141929',
        border: gk.rank === 1
          ? '1px solid rgba(34,197,94,0.4)'
          : gk.rank <= 3
          ? '1px solid rgba(34,197,94,0.15)'
          : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-1"
          style={{
            background: gk.rank === 1 ? 'linear-gradient(135deg,#FFD700,#FF8C00)' :
              gk.rank === 2 ? 'linear-gradient(135deg,#C0C0C0,#909090)' :
              gk.rank === 3 ? 'linear-gradient(135deg,#CD7F32,#8B4513)' :
              'rgba(255,255,255,0.07)',
            color: gk.rank <= 2 ? '#000' : gk.rank === 3 ? '#fff' : '#9ca3af',
          }}
        >
          {gk.rank}
        </div>

        {/* GK Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-black text-white">{gk.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {team?.flag} {team?.name} · {gk.club}
              </div>
            </div>
            <CleanSheetRing cleanSheets={gk.cleanSheets} matches={gk.matches} />
          </div>

          {/* Minutes without goal bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500">Мин. без гола</span>
              <span className="text-sm font-black" style={{ color: '#22c55e' }}>
                {gk.minutesWithoutGoal}'
              </span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${minutePct}%`,
                  background: gk.cleanSheets > 0
                    ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                    : 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Матчи', value: gk.matches },
              { label: 'Сухих', value: gk.cleanSheets },
              { label: 'Сэйвы', value: gk.saves },
              { label: 'Рейтинг', value: gk.rating },
            ].map((s) => (
              <div key={s.label} className="text-center" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '4px 2px' }}>
                <div className="text-sm font-black text-white">{s.value}</div>
                <div className="text-[9px] text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rating bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-gray-600">Рейтинг матча</span>
              <span className="text-[10px] font-bold" style={{
                color: gk.rating >= 9 ? '#FFD700' : gk.rating >= 8.5 ? '#22c55e' : '#60a5fa'
              }}>{gk.rating}</span>
            </div>
            <RatingBar value={gk.rating} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Goalkeepers() {
  const sorted = [...GOALKEEPERS].sort((a, b) => b.minutesWithoutGoal - a.minutesWithoutGoal)
    .map((g, i) => ({ ...g, rank: i + 1 }))

  const topGK = sorted[0]
  const topTeam = TEAMS[topGK.team]

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: 'linear-gradient(160deg, #001a0a 0%, #06080f 100%)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-1">ЧМ 2026</p>
            <h1 className="text-2xl font-black text-white">Вратари</h1>
            <p className="text-xs text-gray-400 mt-0.5">Статистика голкиперов</p>
          </div>
          <div className="text-5xl">🧤</div>
        </div>

        {/* Top GK Card */}
        <div
          className="mt-4 rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #001f0d, #001a08)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <div className="text-4xl">🧤</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold tracking-widest" style={{ color: '#22c55e' }}>ЛУЧШИЙ ВРАТАРЬ</div>
            <div className="text-lg font-black text-white truncate">{topGK.name}</div>
            <div className="text-xs text-gray-400">{topTeam?.flag} {topGK.club}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: '#22c55e' }}>{topGK.minutesWithoutGoal}'</div>
            <div className="text-[10px] text-gray-500">мин. сухих</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: '#22c55e' }}>
              {topGK.cleanSheets} CS
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#22c55e' }} />
            Сухой матч
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#3b82f6' }} />
            Пропустил
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#FFD700' }} />
            Рейтинг ≥9
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-3">
        {sorted.map((gk) => (
          <GKRow key={gk.name} gk={gk} />
        ))}
      </div>
    </div>
  )
}

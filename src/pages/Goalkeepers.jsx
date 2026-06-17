import { TEAMS } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const MAX_MINUTES = 270

function RatingBar({ value, max = 10 }) {
  const pct = (value / max) * 100
  return (
    <div className="stat-bar mt-1.5">
      <div
        className="stat-bar-fill"
        style={{
          width: `${pct}%`,
          background: value >= 9 ? '#C9A800' : value >= 8.5 ? '#16A34A' : value >= 8 ? '#0EA5E9' : '#60a5fa',
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
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={cleanSheets > 0 ? '#16A34A' : '#D1D5DB'}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="square"
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
      className="p-4 mb-2"
      style={{
        background: '#FFFFFF',
        border: gk.rank === 1
          ? '1px solid rgba(22,163,74,0.25)'
          : gk.rank <= 3
          ? '1px solid rgba(22,163,74,0.15)'
          : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className="w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0 mt-1"
          style={{
            borderRadius: 16,
            background: gk.rank === 1 ? 'linear-gradient(135deg,#FFD700,#FF8C00)' :
              gk.rank === 2 ? 'linear-gradient(135deg,#C0C0C0,#909090)' :
              gk.rank === 3 ? 'linear-gradient(135deg,#CD7F32,#8B4513)' :
              'rgba(0,0,0,0.07)',
            color: gk.rank <= 2 ? '#000' : gk.rank === 3 ? '#fff' : '#6B7280',
          }}
        >
          {gk.rank}
        </div>

        {/* GK Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-black uppercase" style={{ color: '#111827' }}>{gk.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>
                {team?.flag} {team?.name} · {gk.club}
              </div>
            </div>
            <CleanSheetRing cleanSheets={gk.cleanSheets} matches={gk.matches} />
          </div>

          {/* Minutes without goal bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Мин. без гола</span>
              <span className="text-sm font-black" style={{ color: '#16A34A' }}>
                {gk.minutesWithoutGoal > 0 ? `${gk.minutesWithoutGoal}'` : '—'}
              </span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: gk.minutesWithoutGoal > 0 ? `${minutePct}%` : '2%',
                  background: gk.cleanSheets > 0
                    ? 'linear-gradient(90deg, #16A34A, #22c55e)'
                    : 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Матчи', value: gk.matches || '—' },
              { label: 'Сухих', value: gk.cleanSheets || '—' },
              { label: 'Сэйвы', value: gk.saves || '—' },
              { label: 'Рейтинг', value: gk.rating },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center"
                style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '4px 2px', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="text-sm font-black" style={{ color: '#111827' }}>{s.value}</div>
                <div className="text-[9px] uppercase" style={{ color: '#9CA3AF' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rating bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Рейтинг (прогноз)</span>
              <span className="text-[10px] font-bold" style={{
                color: gk.rating >= 9 ? '#C9A800' : gk.rating >= 8.5 ? '#16A34A' : '#0EA5E9'
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
  const { goalkeepers } = useLiveData()
  const sorted = [...goalkeepers].sort((a, b) => b.rating - a.rating)
    .map((g, i) => ({ ...g, rank: i + 1 }))

  const topGK = sorted[0]
  const topTeam = topGK ? TEAMS[topGK.team] : null

  if (!topGK) {
    return (
      <div className="page-content">
        <div className="px-4 pt-4 pb-3">
          <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>🧤 Статистика появится после первых матчей</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Info strip (заголовок раздела уже в шапке ЧМ) */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Претенденты на Золотую перчатку</p>

        {/* Top GK Card */}
        <div
          className="mt-4 p-4 flex items-center gap-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="text-4xl">🧤</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#16A34A' }}>Фаворит — Золотая перчатка</div>
            <div className="text-lg font-black truncate uppercase" style={{ color: '#111827' }}>{topGK.name}</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{topTeam?.flag} {topGK.club}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: '#16A34A' }}>{topGK.rating}</div>
            <div className="text-[10px]" style={{ color: '#9CA3AF' }}>рейтинг</div>
            <div className="text-[10px] font-black mt-0.5 uppercase" style={{ color: '#16A34A' }}>
              Прогноз
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ color: '#9CA3AF' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ background: '#16A34A', borderRadius: 8 }} />
            <span className="uppercase tracking-wide">Сухой матч</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ background: '#3b82f6', borderRadius: 8 }} />
            <span className="uppercase tracking-wide">Пропустил</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ background: '#C9A800', borderRadius: 8 }} />
            <span className="uppercase tracking-wide">Рейтинг ≥9</span>
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

import { TEAMS } from '../data.js'

const ALL_TIME_SCORERS = [
  { rank: 1,  name: 'Мирослав Клозе',      nat: 'GER', goals: 16, years: '2002–2014', active: false, note: 'Рекордсмен ЧМ' },
  { rank: 2,  name: 'Роналдо Р9',           nat: 'BRA', goals: 15, years: '1994–2006', active: false, note: '2× чемпион' },
  { rank: 3,  name: 'Герд Мюллер',          nat: 'GER', goals: 14, years: '1970–1974', active: false, note: 'Легенда' },
  { rank: 4,  name: 'Жюст Фонтен',          nat: 'FRA', goals: 13, years: '1958',      active: false, note: '13 голов в 1 ЧМ' },
  { rank: 5,  name: 'Лионель Месси',        nat: 'ARG', goals: 13, years: '2006–2022', active: true,  note: '2022 чемпион' },
  { rank: 6,  name: 'Пеле',                 nat: 'BRA', goals: 12, years: '1958–1970', active: false, note: '3× чемпион' },
  { rank: 7,  name: 'Килиан Мбаппе',        nat: 'FRA', goals: 12, years: '2018–2022', active: true,  note: 'Действующий' },
  { rank: 8,  name: 'Шандор Кочиш',         nat: 'HUN', goals: 11, years: '1954',      active: false, note: 'Золотая команда' },
  { rank: 9,  name: 'Юрген Клинсманн',      nat: 'GER', goals: 11, years: '1990–1998', active: false, note: '1990 чемпион' },
  { rank: 10, name: 'Теофило Кубильяс',     nat: 'PER', goals: 10, years: '1970–1978', active: false, note: 'Легенда Перу' },
  { rank: 11, name: 'Гэри Линекер',         nat: 'ENG', goals: 10, years: '1986–1990', active: false, note: 'Золотая бутса 1986' },
  { rank: 12, name: 'Габриэль Батистута',   nat: 'ARG', goals: 10, years: '1994–2002', active: false, note: 'Король голов' },
  { rank: 13, name: 'Гжегож Лято',          nat: 'POL', goals: 10, years: '1974–1982', active: false, note: 'Золотая бутса 1974' },
  { rank: 14, name: 'Томас Мюллер',         nat: 'GER', goals: 10, years: '2010–2018', active: false, note: '2014 чемпион' },
  { rank: 15, name: 'К.-Х. Румменигге',     nat: 'GER', goals: 10, years: '1978–1986', active: false, note: 'Финалист 1982' },
  { rank: 16, name: 'Эйсебио',              nat: 'POR', goals: 9,  years: '1966',      active: false, note: 'Золотая бутса 1966' },
  { rank: 17, name: 'Адемир',               nat: 'BRA', goals: 9,  years: '1950',      active: false, note: 'Легенда 1950' },
  { rank: 18, name: 'Вава',                 nat: 'BRA', goals: 9,  years: '1958–1962', active: false, note: '2× чемпион' },
  { rank: 19, name: 'Роберто Баджо',        nat: 'ITA', goals: 9,  years: '1990–1998', active: false, note: 'Финалист 1994' },
  { rank: 20, name: 'Харри Кейн',           nat: 'ENG', goals: 9,  years: '2018–2022', active: true,  note: 'Золотая бутса 2018' },
]

const NAT_FLAGS = {
  GER: '🇩🇪', BRA: '🇧🇷', FRA: '🇫🇷', ARG: '🇦🇷',
  HUN: '🇭🇺', PER: '🇵🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POL: '🇵🇱',
  POR: '🇵🇹', ITA: '🇮🇹',
}

function ScorerRow({ scorer }) {
  const flag = NAT_FLAGS[scorer.nat] || '🏳️'
  const isTop3 = scorer.rank <= 3

  return (
    <div
      className="flex items-center gap-3 p-3 mb-2"
      style={{
        background: '#FFFFFF',
        border: scorer.active
          ? '1px solid rgba(22,163,74,0.25)'
          : isTop3
          ? '1px solid rgba(201,168,0,0.2)'
          : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 3,
        boxShadow: scorer.active
          ? '0 1px 8px rgba(22,163,74,0.08)'
          : '0 1px 6px rgba(0,0,0,0.06)',
      }}
    >
      {/* Rank */}
      <div
        className="w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{
          borderRadius: 3,
          background:
            scorer.rank === 1 ? 'linear-gradient(135deg,#FFD700,#FF8C00)' :
            scorer.rank === 2 ? 'linear-gradient(135deg,#C0C0C0,#909090)' :
            scorer.rank === 3 ? 'linear-gradient(135deg,#CD7F32,#8B4513)' :
            'rgba(0,0,0,0.07)',
          color: scorer.rank === 1 ? '#000' : scorer.rank === 2 ? '#000' : scorer.rank === 3 ? '#fff' : '#6B7280',
        }}
      >
        {scorer.rank}
      </div>

      {/* Flag + Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span>{flag}</span>
          <span className="text-sm font-black truncate uppercase" style={{ color: '#111827' }}>
            {scorer.name}
          </span>
          {scorer.active && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 flex-shrink-0"
              style={{ background: '#16A34A', color: '#fff', borderRadius: 2 }}
            >
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9CA3AF' }}>
          <span>{scorer.years}</span>
          <span>·</span>
          <span>{scorer.note}</span>
        </div>
      </div>

      {/* Goals */}
      <div className="text-right flex-shrink-0">
        <div
          className="text-2xl font-black"
          style={{ color: isTop3 ? '#C9A800' : scorer.active ? '#16A34A' : '#111827' }}
        >
          {scorer.goals}
        </div>
        <div className="text-[9px] uppercase" style={{ color: '#9CA3AF' }}>голов</div>
      </div>
    </div>
  )
}

export default function AllTimeScorers() {
  const activePlayers = ALL_TIME_SCORERS.filter((s) => s.active)
  const maxGoals = ALL_TIME_SCORERS[0].goals

  return (
    <div className="page-content">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 1930–2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Рекорды</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Топ-20 бомбардиров всех времён</p>
          </div>
          <div className="text-5xl">🏅</div>
        </div>

        {/* Record holder card */}
        <div
          className="mt-4 p-4 flex items-center gap-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div className="text-4xl">🇩🇪</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#C9A800' }}>Абсолютный рекордсмен</div>
            <div className="text-lg font-black uppercase" style={{ color: '#111827' }}>Мирослав Клозе</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>Германия · 2002–2014</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black" style={{ color: '#C9A800' }}>16</div>
            <div className="text-[10px]" style={{ color: '#9CA3AF' }}>голов</div>
          </div>
        </div>

        {/* Active players promo */}
        <div
          className="mt-3 p-3"
          style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 3 }}
        >
          <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: '#16A34A' }}>
            ⚡ Могут улучшить результат на ЧМ 2026
          </div>
          <div className="flex gap-3 flex-wrap">
            {activePlayers.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span>{NAT_FLAGS[p.nat]}</span>
                <span className="text-xs font-black" style={{ color: '#111827' }}>{p.name}</span>
                <span
                  className="text-[9px] font-black px-1 py-0.5"
                  style={{ background: '#16A34A', color: '#fff', borderRadius: 2 }}
                >
                  {p.goals} гол.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ color: '#9CA3AF' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ background: '#16A34A', borderRadius: 1 }} />
            <span className="uppercase tracking-wide">Играющие (2026)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ background: '#C9A800', borderRadius: 1 }} />
            <span className="uppercase tracking-wide">Топ-3</span>
          </div>
        </div>
      </div>

      {/* Bar chart + list */}
      <div className="px-4 mt-3 mb-2">
        <div className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>
          Голы на чемпионатах мира
        </div>
        {ALL_TIME_SCORERS.map((scorer) => {
          const pct = (scorer.goals / maxGoals) * 100
          return (
            <div key={scorer.rank} className="mb-1.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] w-4 text-right flex-shrink-0" style={{ color: '#9CA3AF' }}>
                  {scorer.rank}
                </span>
                <span
                  className="text-[10px] font-black truncate flex-1"
                  style={{ color: scorer.active ? '#16A34A' : '#374151' }}
                >
                  {scorer.name}
                </span>
                <span className="text-[10px] font-black flex-shrink-0" style={{ color: scorer.active ? '#16A34A' : '#111827' }}>
                  {scorer.goals}
                </span>
              </div>
              <div
                className="ml-6 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: scorer.rank === 1
                      ? 'linear-gradient(90deg, #FFD700, #FF8C00)'
                      : scorer.active
                      ? 'linear-gradient(90deg, #16A34A, #22c55e)'
                      : scorer.rank <= 3
                      ? '#C9A800'
                      : '#60a5fa',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Full cards */}
      <div className="px-4 mt-4">
        <div className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>
          Подробная статистика
        </div>
        {ALL_TIME_SCORERS.map((scorer) => (
          <ScorerRow key={scorer.rank} scorer={scorer} />
        ))}
      </div>
    </div>
  )
}

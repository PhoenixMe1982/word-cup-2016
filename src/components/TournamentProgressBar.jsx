import { TOURNAMENT_STAGES, tournamentProgress } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const RED = '#DC2626'

// "Старт" — чисто декоративная метка начала турнира, не входит в расчёт
// прогресса (см. TOURNAMENT_STAGES/tournamentProgress в data.js): пока
// турнир не начался, прогресс равен 0 и горит только эта точка.
const LABELS = ['Старт', ...TOURNAMENT_STAGES.map((s) => s.label)]

export default function TournamentProgressBar() {
  const { matches } = useLiveData()
  const progress = tournamentProgress(TOURNAMENT_STAGES, new Date(), matches)
  const n = LABELS.length

  return (
    <div className="mb-4 px-1">
      {/* Stage labels */}
      <div className="flex justify-between mb-1.5">
        {LABELS.map((label, i) => {
          const dotPos = i / (n - 1)
          const reached = progress >= dotPos - 0.001
          return (
            <span
              key={label}
              className="text-[6px] font-black uppercase tracking-wide"
              style={{
                color: reached ? RED : '#9CA3AF',
                flex: i === 0 || i === n - 1 ? '0 0 auto' : '1 1 0',
                textAlign: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>

      {/* Track with dots */}
      <div className="relative flex items-center justify-between" style={{ height: 8 }}>
        <div
          className="absolute left-0 right-0"
          style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.08)', top: '50%', transform: 'translateY(-50%)' }}
        />
        <div
          className="absolute left-0"
          style={{
            height: 4, borderRadius: 2, background: RED, top: '50%',
            transform: 'translateY(-50%)', width: `${progress * 100}%`,
            transition: 'width 0.6s ease',
          }}
        />
        {LABELS.map((label, i) => {
          const dotPos = i / (n - 1)
          const reached = progress >= dotPos - 0.001
          return (
            <div
              key={label}
              className="relative rounded-full"
              style={{
                width: 8, height: 8, zIndex: 1,
                background: reached ? RED : '#FFFFFF',
                border: `2px solid ${reached ? RED : 'rgba(0,0,0,0.18)'}`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

import { TOURNAMENT_STAGES, tournamentProgress } from '../data.js'

const RED = '#DC2626'

export default function TournamentProgressBar() {
  const progress = tournamentProgress()
  const n = TOURNAMENT_STAGES.length

  return (
    <div className="mb-4 px-1">
      {/* Stage labels */}
      <div className="flex justify-between mb-2">
        {TOURNAMENT_STAGES.map((s, i) => {
          const dotPos = i / (n - 1)
          const reached = progress >= dotPos - 0.001
          return (
            <span
              key={s.id}
              className="text-[7px] font-black uppercase tracking-wide"
              style={{
                color: reached ? RED : '#9CA3AF',
                flex: i === 0 || i === n - 1 ? '0 0 auto' : '1 1 0',
                textAlign: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center',
              }}
            >
              {s.label}
            </span>
          )
        })}
      </div>

      {/* Track with dots */}
      <div className="relative flex items-center justify-between" style={{ height: 10 }}>
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
        {TOURNAMENT_STAGES.map((s, i) => {
          const dotPos = i / (n - 1)
          const reached = progress >= dotPos - 0.001
          return (
            <div
              key={s.id}
              className="relative rounded-full"
              style={{
                width: 9, height: 9, zIndex: 1,
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

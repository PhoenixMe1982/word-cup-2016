import { TEAMS, KNOCKOUT_STAGE_ORDER, KNOCKOUT_STAGE_LABELS, isKnockoutMatch } from '../data.js'
import { resolveTeams } from '../knockout.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { toLocalDateTime, matchUTCDate } from '../utils.js'

// Эффективный статус: матч, начавшийся по расписанию, считаем идущим, даже если
// статус из API ещё не переключился (лаг поллера до 5 минут).
function effStatus(m) {
  if (m.status === 'finished') return 'finished'
  if (m.status === 'live') return 'live'
  const kick = matchUTCDate(m.date, m.time)
  return kick && Date.now() >= kick.getTime() ? 'live' : 'upcoming'
}

function TeamSide({ code, align }) {
  const t = code ? TEAMS[code] : null
  const name = t?.name || (code ? code : 'TBD')
  const flag = t?.flag || '🏳️'
  if (align === 'right') {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-[11px] font-bold uppercase truncate text-right" style={{ color: code ? '#111827' : '#9CA3AF' }}>{name}</span>
        <span className="text-lg flex-shrink-0">{flag}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-lg flex-shrink-0">{flag}</span>
      <span className="text-[11px] font-bold uppercase truncate" style={{ color: code ? '#111827' : '#9CA3AF' }}>{name}</span>
    </div>
  )
}

function KnockoutMatchRow({ match, byId }) {
  const { home, away } = resolveTeams(match, byId)
  const status = effStatus(match)
  const finished = status === 'finished'
  const live = status === 'live'
  const hasScore = match.scoreHome != null && match.scoreAway != null
  const { time: localTime, date: localDate } = toLocalDateTime(match.date, match.time)

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="text-[9px] w-12 text-center flex-shrink-0 leading-tight" style={{ color: '#9CA3AF' }}>
        {finished ? <span style={{ color: '#9CA3AF' }}>завершён</span> : <>{localDate}<br />{localTime}</>}
      </div>

      <TeamSide code={home} align="right" />

      <div className="flex-shrink-0 text-center" style={{ minWidth: 50 }}>
        {finished || (live && hasScore) ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>:</span>
              <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
            </div>
            {match.penHome != null && (
              <span className="text-[8px] font-semibold whitespace-nowrap" style={{ color: '#6B7280' }}>пен. {match.penHome}:{match.penAway}</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-bold" style={{ color: '#C9A800' }}>vs</span>
        )}
        {live && <div className="text-[8px] font-black uppercase" style={{ color: '#16A34A' }}>live</div>}
      </div>

      <TeamSide code={away} align="left" />
    </div>
  )
}

export default function KnockoutStages() {
  const { matches } = useLiveData()
  const byId = {}
  for (const m of matches) byId[m.id] = m

  const koMatches = matches.filter(isKnockoutMatch)
  const byStage = {}
  for (const m of koMatches) (byStage[m.stage] ||= []).push(m)

  return (
    <div className="page-content">
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Стадии на вылет · 32 команды</p>
      </div>

      <div className="px-4 mt-3 space-y-5">
        {KNOCKOUT_STAGE_ORDER.map((stage) => {
          const list = byStage[stage]
          if (!list || list.length === 0) return null
          return (
            <div key={stage}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#C9A800' }}>
                  {KNOCKOUT_STAGE_LABELS[stage] || stage}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,0,0.25)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{list.length} матч.</span>
              </div>
              <div className="space-y-2">
                {list.map((m) => <KnockoutMatchRow key={m.id} match={m} byId={byId} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

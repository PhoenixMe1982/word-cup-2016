import { useState } from 'react'
import { TEAMS, KNOCKOUT_STAGE_ORDER, KNOCKOUT_STAGE_LABELS, isKnockoutMatch } from '../data.js'
import { resolveTeams } from '../knockout.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { toLocalDateTime, matchUTCDate, compareKickoff } from '../utils.js'

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

// Суффикс способа определения победителя нокаут-матча: пенальти / доп. время.
function koWinBy(match) {
  const pens = match.duration === 'PENALTY_SHOOTOUT' || match.penHome != null
  if (pens) return 'по пенальти'
  if (match.duration === 'EXTRA_TIME') return 'в доп. время'
  return null
}

// Раскрытая панель деталей матча: стадион, дата/время, разбивка счёта, авторы голов.
// Голы берём из match.goals ({ team, player, minute }) — бэкенд подмешивает их
// из API-Football для завершённых матчей; если их ещё нет — показываем заглушку.
function KnockoutMatchDetail({ match, home, away, finished }) {
  const { time: localTime, date: localDate } = toLocalDateTime(match.date, match.time)
  const winByLabel = finished ? koWinBy(match) : null
  const winnerCodeSide = match.winner === 'HOME_TEAM' ? home : match.winner === 'AWAY_TEAM' ? away : null
  const winnerTeam = winnerCodeSide ? TEAMS[winnerCodeSide] : null
  const goals = Array.isArray(match.goals) ? match.goals : []

  return (
    <div className="px-3 pb-3 pt-2.5 space-y-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Стадион + дата/время (в часовом поясе устройства) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]" style={{ color: '#6B7280' }}>
        <span>📍 {match.venue}</span>
        <span>📅 {localDate} · {localTime}</span>
      </div>

      {/* Разбивка счёта для завершённого матча */}
      {finished && match.scoreHome != null && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]" style={{ color: '#374151' }}>
          <span style={{ color: '#9CA3AF' }}>Счёт:</span>
          <span className="font-black">{match.scoreHome}:{match.scoreAway}</span>
          {match.penHome != null && <span className="font-black">· пен. {match.penHome}:{match.penAway}</span>}
          {winnerTeam && (
            <span className="ml-auto font-bold" style={{ color: '#16A34A' }}>
              ↑ {winnerTeam.flag} {winnerTeam.name}{winByLabel ? ` · ${winByLabel}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Авторы голов (игрок + минута) */}
      {finished && (
        goals.length > 0 ? (
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Голы</div>
            {goals.map((g, i) => {
              const gt = TEAMS[g.team]
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: '#374151' }}>
                  <span>⚽</span>
                  <span className="flex-shrink-0">{gt?.flag}</span>
                  <span className="truncate">{g.player}</span>
                  <span className="ml-auto font-bold" style={{ color: '#6B7280' }}>{g.minute}&#39;</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Авторы голов уточняются</div>
        )
      )}

      {!finished && (
        <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Матч ещё не сыгран — детали появятся после финального свистка</div>
      )}
    </div>
  )
}

function KnockoutMatchRow({ match, byId, expanded, onToggle }) {
  const { home, away } = resolveTeams(match, byId)
  const status = effStatus(match)
  const finished = status === 'finished'
  const live = status === 'live'
  const hasScore = match.scoreHome != null && match.scoreAway != null
  const { time: localTime, date: localDate } = toLocalDateTime(match.date, match.time)
  // Раскрывать можно только матч с известными командами (у TBD-слотов нечего показывать).
  const canExpand = !!(home && away)

  return (
    <div
      className={canExpand ? 'cursor-pointer' : ''}
      onClick={canExpand ? onToggle : undefined}
      style={{ background: '#FFFFFF', border: expanded ? '1.5px solid rgba(201,168,0,0.4)' : '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: expanded ? '0 2px 12px rgba(201,168,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
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
          {live && (
            <div className="text-[8px] font-black uppercase" style={{ color: '#16A34A' }}>
              {match.phase === 'pens' ? 'пенальти' : match.phase === 'et' ? 'доп. время' : 'live'}
            </div>
          )}
        </div>

        <TeamSide code={away} align="left" />

        {canExpand && (
          <span className="text-[9px] flex-shrink-0 ml-0.5" style={{ color: '#C9A800' }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {expanded && canExpand && (
        <div onClick={(e) => e.stopPropagation()}>
          <KnockoutMatchDetail match={match} home={home} away={away} finished={finished} />
        </div>
      )}
    </div>
  )
}

export default function KnockoutStages() {
  const { matches } = useLiveData()
  const [openStages, setOpenStages] = useState({}) // stage → bool; отсутствие ключа = развёрнут
  const [expandedId, setExpandedId] = useState(null) // раскрытая карточка деталей матча
  const byId = {}
  for (const m of matches) byId[m.id] = m

  const koMatches = matches.filter(isKnockoutMatch)
  const byStage = {}
  for (const m of koMatches) (byStage[m.stage] ||= []).push(m)
  // Внутри каждой стадии — строго по времени начала
  for (const stage of Object.keys(byStage)) byStage[stage].sort(compareKickoff)

  return (
    <div className="page-content">
      <div className="px-4 pt-4 pb-1">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Стадии на вылет · 32 команды</p>
      </div>

      <div className="px-4 mt-3 space-y-5">
        {KNOCKOUT_STAGE_ORDER.map((stage) => {
          const list = byStage[stage]
          if (!list || list.length === 0) return null
          const open = openStages[stage] !== false // по умолчанию раскрыто
          return (
            <div key={stage}>
              {/* Заголовок стадии — тап сворачивает/раскрывает секцию (1/16, 1/8, …) */}
              <button
                onClick={() => setOpenStages((o) => ({ ...o, [stage]: !(o[stage] !== false) }))}
                className="w-full flex items-center gap-3 mb-2"
              >
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#C9A800' }}>
                  {KNOCKOUT_STAGE_LABELS[stage] || stage}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,0,0.25)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{list.length} матч.</span>
                <span className="text-[10px] font-black" style={{ color: '#C9A800' }}>{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="space-y-2">
                  {list.map((m) => (
                    <KnockoutMatchRow
                      key={m.id}
                      match={m}
                      byId={byId}
                      expanded={expandedId === m.id}
                      onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

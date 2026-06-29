import { useState, useEffect, useRef } from 'react'
import { TEAMS, TOURNAMENT, MATCHES, HEADER_BANNER_STYLE, KNOCKOUT_STAGE_LABELS } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { toLocalDateTime, matchUTCDate, compareKickoff } from '../utils.js'
import CountdownTimer from '../components/CountdownTimer.jsx'
import TournamentProgressBar from '../components/TournamentProgressBar.jsx'
import PlayoffBracket from '../components/PlayoffBracket.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

const KICKOFF = matchUTCDate(MATCHES[0].date, MATCHES[0].time)
const KICKOFF_LOCAL = toLocalDateTime(MATCHES[0].date, MATCHES[0].time)

const PAGE_SIZE = 3

// Подпись матча: групповой — «Гр. X»; плей-офф — стадия (1/16, 1/8, …).
const matchTag = (m) => (m.stage ? (KNOCKOUT_STAGE_LABELS[m.stage] || 'Плей-офф') : `Гр. ${m.group}`)

function UserAvatar({ onTab }) {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const name = tgUser?.first_name || 'Игрок'
  const photoUrl = tgUser?.photo_url
  const initial = name[0]?.toUpperCase() || '?'
  const [pts, setPts] = useState(null)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return
    fetch(API + '/api/me', { headers: { 'x-telegram-init-data': initData } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setPts(d.pts); setRank(d.rank) } })
      .catch(() => {})
  }, [])

  // Наряд аватарки по месту в лидерборде
  const medal = rank === 1
    ? { ring: '#FFD700', crown: '#FFD700', crownSize: 22 }
    : rank === 2
    ? { ring: '#B8B8B8', crown: '#B8B8B8', crownSize: 17 }
    : rank === 3
    ? { ring: '#CD7F32', crown: null, crownSize: 0 }
    : { ring: '#111827', crown: null, crownSize: 0 }

  return (
    <button onClick={() => onTab('leaderboard')} className="flex flex-col items-center gap-1">
      {/* Номер места над аватаркой */}
      <div className="text-sm font-black leading-none h-4" style={{ color: '#111827' }}>
        {rank !== null ? `#${rank}` : ''}
      </div>
      <div className="relative flex-shrink-0">
        {medal.crown && (
          <span
            className="absolute z-10 leading-none"
            style={{
              top: -medal.crownSize * 0.55,
              left: '50%',
              fontSize: medal.crownSize,
              transform: 'translateX(-60%) rotate(-22deg)',
              color: medal.crown,
              filter: rank === 2 ? 'grayscale(1) brightness(1.7)' : 'none',
              textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            }}
          >
            👑
          </span>
        )}
        <div
          className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#C9A800,#f0c400)',
            border: `${rank !== null && rank <= 3 ? 4 : 3}px solid ${medal.ring}`,
            boxShadow: rank !== null && rank <= 3 ? `0 0 0 1px ${medal.ring}55, 0 2px 8px rgba(0,0,0,0.18)` : '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          {photoUrl
            ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
            : <span className="text-2xl font-black" style={{ color: '#fff' }}>{initial}</span>
          }
        </div>
      </div>
      <div className="text-sm font-bold truncate max-w-[80px]" style={{ color: '#111827' }}>{name}</div>
      {pts !== null && (
        <div className="text-[10px] uppercase tracking-wide" style={{ color: '#111827' }}>{pts} очк</div>
      )}
    </button>
  )
}

// Минуту матча free-тариф football-data.org не отдаёт — показываем её,
// только если она реально пришла (числовая строка), иначе просто LIVE
function LiveMinute({ base }) {
  const hasRealMinute = /^\d+$/.test(String(base))
  const [min, setMin] = useState(hasRealMinute ? parseInt(base) : 0)
  useEffect(() => {
    if (!hasRealMinute) return
    const t = setInterval(() => setMin((m) => Math.min(m + 1, 90)), 60000)
    return () => clearInterval(t)
  }, [hasRealMinute])
  if (!hasRealMinute) return <span className="font-bold text-live animate-pulse2">●</span>
  return <span className="font-bold text-live">{min}'</span>
}

function LiveMatchCard({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  return (
    <div className="match-live-card p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#16A34A,transparent)' }} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#16A34A' }}>Прямой эфир</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Группа {match.group} · {match.venue.split(',')[0]}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{home.flag}</span>
          <span className="text-xs font-bold uppercase" style={{ color: '#111827' }}>{home.name}</span>
        </div>
        <div className="flex flex-col items-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black score-number" style={{ color: '#111827' }}>{match.scoreHome ?? '–'}</span>
            <span className="text-2xl font-light" style={{ color: '#9CA3AF' }}>:</span>
            <span className="text-4xl font-black score-number" style={{ color: '#111827' }}>{match.scoreAway ?? '–'}</span>
          </div>
          <LiveMinute base={match.time} />
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{away.flag}</span>
          <span className="text-xs font-bold uppercase" style={{ color: '#111827' }}>{away.name}</span>
        </div>
      </div>
      {match.goals.length > 0 && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {match.goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: '#6B7280' }}>
              <span>⚽</span>
              <span>{TEAMS[g.team].flag} {g.player}</span>
              <span className="ml-auto">{g.minute}'</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FinishedMatchCard({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const { date: localDate } = toLocalDateTime(match.date, match.time)
  return (
    <div className="match-finished-card p-3 flex items-center gap-3">
      <div className="text-[10px] w-12 text-center flex-shrink-0" style={{ color: '#9CA3AF' }}>{localDate}</div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{home.flag}</span>
        <span className="text-xs truncate font-semibold uppercase" style={{ color: '#111827' }}>{home.name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>:</span>
        <span className="text-sm font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-xs truncate text-right font-semibold uppercase" style={{ color: '#111827' }}>{away.name}</span>
        <span className="text-lg">{away.flag}</span>
      </div>
      <div className="text-[10px] w-10 text-right flex-shrink-0" style={{ color: '#9CA3AF' }}>{matchTag(match)}</div>
    </div>
  )
}

function InlinePredPanel({ match, pred, onSave, onFull, saving }) {
  const [homeVal, setHomeVal] = useState(pred?.home ?? '')
  const [awayVal, setAwayVal] = useState(pred?.away ?? '')
  const [saved, setSaved] = useState(!!pred)

  useEffect(() => {
    if (pred) { setHomeVal(pred.home); setAwayVal(pred.away); setSaved(true) }
  }, [pred])

  const kickoffUTC = matchUTCDate(match.date, match.time)
  const isLocked = kickoffUTC ? new Date() >= kickoffUTC : false
  // Нокаут + ничья в 90′ → нужен каскад (доп. время/пенальти), которого в инлайне
  // нет. Ведём игрока в «Играть» на полный прогноз, частичный счёт НЕ сохраняем
  // (иначе перетёрли бы уже сделанный полный прогноз неполным).
  const isKnockout = !!match.stage
  const isDraw = homeVal !== '' && awayVal !== '' && Number(homeVal) === Number(awayVal)
  const needsFull = isKnockout && isDraw
  const canSubmit = !isLocked && homeVal !== '' && awayVal !== '' && saving !== match.id && !needsFull
  const hasChanged = saved && (homeVal !== pred?.home || awayVal !== pred?.away)
  const inTg = !!window.Telegram?.WebApp?.initData

  async function handleSave() {
    if (needsFull) { onFull?.(); return }
    if (!canSubmit) return
    const ok = await onSave(match.id, Number(homeVal), Number(awayVal))
    if (ok) setSaved(true)
  }

  if (!inTg) {
    return (
      <div className="px-3 py-2 text-xs text-center" style={{ color: '#C9A800' }}>
        📱 Открой в Telegram, чтобы сделать прогноз
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="px-3 pb-3">
        <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
          Твой прогноз
        </div>
        {saved ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#6B7280' }}>Прогноз:</span>
            <span className="text-base font-black" style={{ color: '#C9A800' }}>{pred?.home} : {pred?.away}</span>
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>🔒</span>
          </div>
        ) : (
          <div className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            🔒 Прогноз не был сделан
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-3 pb-3">
      <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
        Твой прогноз
      </div>
      {saved && !hasChanged ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#6B7280' }}>Прогноз:</span>
            <span className="text-base font-black" style={{ color: '#C9A800' }}>{pred?.home} : {pred?.away}</span>
            <span style={{ color: '#16A34A' }}>✓</span>
          </div>
          <button
            onClick={() => setSaved(false)}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.05)', color: '#6B7280' }}
          >
            Изменить
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 justify-center">
            <input
              type="number" min="0" max="20"
              value={homeVal}
              onChange={e => { const v = e.target.value; setHomeVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
              className="w-12 h-12 text-center text-xl font-black rounded-2xl outline-none"
              style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            <span className="text-lg font-bold" style={{ color: '#9CA3AF' }}>:</span>
            <input
              type="number" min="0" max="20"
              value={awayVal}
              onChange={e => { const v = e.target.value; setAwayVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
              className="w-12 h-12 text-center text-xl font-black rounded-2xl outline-none"
              style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            <button
              onClick={handleSave}
              disabled={!canSubmit && !needsFull}
              className="flex-1 py-3 rounded-2xl text-sm font-black ml-1"
              style={{
                background: (canSubmit || needsFull) ? '#C9A800' : 'rgba(0,0,0,0.06)',
                color: (canSubmit || needsFull) ? '#fff' : '#9CA3AF',
              }}
            >
              {saving === match.id ? '…' : needsFull ? 'Доп. время →' : saved && hasChanged ? 'Обновить' : 'Сохранить'}
            </button>
          </div>
          {needsFull && (
            <div className="text-[10px] text-center mt-2 leading-snug" style={{ color: '#C9A800' }}>
              Ничья в плей-офф — продолжи в разделе «Играть»:<br />там доп. время и пенальти
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UpcomingMatchRow({ match, isExpanded, onToggle, pred, onSave, onTab, saving }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const hasPred = !!pred
  const { time: localTime, date: localDate } = toLocalDateTime(match.date, match.time)

  return (
    <div>
      <div
        className="cursor-pointer overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: isExpanded ? '1.5px solid rgba(201,168,0,0.4)' : '1px solid rgba(0,0,0,0.07)',
          borderRadius: 16,
          boxShadow: isExpanded ? '0 2px 12px rgba(201,168,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        }}
        onClick={onToggle}
      >
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{home.flag}</span>
            <span className="text-xs font-bold uppercase truncate" style={{ color: '#111827' }}>{home.name}</span>
          </div>
          {/* Center */}
          <div className="flex-shrink-0 text-center" style={{ minWidth: 40 }}>
            <div className="text-[9px] font-black uppercase" style={{ color: '#9CA3AF' }}>vs</div>
            <div className="text-[9px] font-bold" style={{ color: '#C9A800' }}>{localTime}</div>
          </div>
          {/* Away */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-xs font-bold uppercase truncate text-right" style={{ color: '#111827' }}>{away.name}</span>
            <span className="text-2xl flex-shrink-0">{away.flag}</span>
          </div>
          {/* Arrow + pred check */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {hasPred && <span className="text-[9px]" style={{ color: '#16A34A' }}>✓</span>}
            <span className="text-[10px]" style={{ color: '#C9A800' }}>{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>
        <div className="px-3 pb-2 text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
          {localDate} · {matchTag(match)}
        </div>

        {/* Prediction panel — inline inside card */}
        {isExpanded && (
          <div
            className="mx-3 mb-3 pt-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
            onClick={e => e.stopPropagation()}
          >
            <InlinePredPanel
              match={match}
              pred={pred}
              onSave={onSave}
              onFull={() => onTab?.('play')}
              saving={saving}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home({ onTab }) {
  const { matches, scorers } = useLiveData()

  // Если статус из API запаздывает, матч считается live по расписанию —
  // он сразу попадает в «Идут сейчас», а не висит в «Ближайших»
  const MATCH_DURATION_MS = 115 * 60 * 1000
  const now = Date.now()
  const isTimeLive = (m) => {
    if (m.status !== 'upcoming') return false
    const kick = matchUTCDate(m.date, m.time)
    return kick && now >= kick.getTime() && now < kick.getTime() + MATCH_DURATION_MS
  }

  // Матч с определёнными командами (нокаут-слоты TBD ещё без пар — в списках не показываем)
  const hasTeams = (m) => !!(m.home && m.away)

  const liveMatches = matches
    .filter((m) => hasTeams(m) && (m.status === 'live' || isTimeLive(m)))
    .sort(compareKickoff)

  const allFinished = matches.filter(m => m.status === 'finished' && hasTeams(m))
  // Самые свежие результаты сверху: сортируем по дате матча по убыванию
  const finishedMatches = [...allFinished]
    .sort((a, b) => {
      const da = matchUTCDate(a.date, a.time)?.getTime() ?? 0
      const db = matchUTCDate(b.date, b.time)?.getTime() ?? 0
      return db - da
    })
    .slice(0, 4)
  const upcomingMatches = matches
    .filter((m) => m.status === 'upcoming' && hasTeams(m) && !isTimeLive(m))
    // Хронологический порядок по времени начала: ближайший — первым
    .sort(compareKickoff)

  const timeBasedFinished = matches.filter(m => {
    if (m.status !== 'upcoming' || !hasTeams(m)) return false
    const kick = matchUTCDate(m.date, m.time)
    return kick && now >= kick.getTime() + MATCH_DURATION_MS
  })
  const playedCount = allFinished.length + timeBasedFinished.length
  const liveCount = liveMatches.length
  const totalGoals = allFinished.reduce((s, m) => s + (m.scoreHome || 0) + (m.scoreAway || 0), 0)

  const [upcomingPage, setUpcomingPage] = useState(0)
  const [expandedUpcoming, setExpandedUpcoming] = useState(null)
  const [upcomingPreds, setUpcomingPreds] = useState({})
  const [savingPred, setSavingPred] = useState(null)
  const [dragX, setDragX] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const swipeActive = useRef(false)
  const swipeContainerRef = useRef(null)
  const swipeWidth = useRef(320)

  const totalPages = Math.max(1, Math.ceil(upcomingMatches.length / PAGE_SIZE))
  const pageMatches = upcomingMatches.slice(upcomingPage * PAGE_SIZE, (upcomingPage + 1) * PAGE_SIZE)
  const prevPageMatches = upcomingPage > 0
    ? upcomingMatches.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE)
    : []
  const nextPageMatches = upcomingPage < totalPages - 1
    ? upcomingMatches.slice((upcomingPage + 1) * PAGE_SIZE, (upcomingPage + 2) * PAGE_SIZE)
    : []

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return
    fetch(API + '/api/my-predictions', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.ok ? r.json() : {})
      .then(d => setUpcomingPreds(d || {}))
      .catch(() => {})
  }, [])

  function goPage(dir) {
    setUpcomingPage(p => Math.max(0, Math.min(totalPages - 1, p + dir)))
    setExpandedUpcoming(null)
  }

  function handleSwipeStart(e) {
    swipeWidth.current = swipeContainerRef.current?.offsetWidth || 320
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    swipeActive.current = false
  }

  function handleSwipeMove(e) {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (!swipeActive.current) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      if (Math.abs(dy) > Math.abs(dx)) { touchStartX.current = null; return }
      swipeActive.current = true
    }
    const atEdge = (dx > 0 && upcomingPage === 0) || (dx < 0 && upcomingPage >= totalPages - 1)
    setDragX(atEdge ? dx * 0.15 : dx)
  }

  function handleSwipeEnd() {
    if (touchStartX.current === null) return
    const w = swipeWidth.current
    const threshold = w * 0.25
    setIsTransitioning(true)
    if (dragX < -threshold && upcomingPage < totalPages - 1) {
      setDragX(-w)
      setTimeout(() => { goPage(1); setDragX(0); setIsTransitioning(false) }, 240)
    } else if (dragX > threshold && upcomingPage > 0) {
      setDragX(w)
      setTimeout(() => { goPage(-1); setDragX(0); setIsTransitioning(false) }, 240)
    } else {
      setDragX(0)
      setTimeout(() => setIsTransitioning(false), 200)
    }
    touchStartX.current = null
    swipeActive.current = false
  }

  async function handleSavePred(matchId, home, away) {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return false
    setSavingPred(matchId)
    try {
      const res = await fetch(API + '/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ matchId, home, away }),
      })
      if (!res.ok) return false
      setUpcomingPreds(prev => ({ ...prev, [matchId]: { home, away } }))
      return true
    } catch { return false }
    finally { setSavingPred(null) }
  }

  return (
    <div className="page-content px-4 pb-4">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden mb-4 -mx-4 px-4 pt-12 pb-6"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="relative flex items-start justify-between">
          <div className="max-w-[50%]">
            <h1 className="text-2xl font-black leading-tight tracking-wide uppercase" style={{ color: '#FFFFFF' }}>
              FIFA World Cup
            </h1>
            <p className="text-lg font-black" style={{ color: '#FFFFFF', letterSpacing: '0.08em' }}>
              2026™
            </p>
          </div>
          {/* Правый блок поднят к верху, чтобы лечь на белую карточку арта */}
          <div className="-mt-6">
            <UserAvatar onTab={onTab} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: playedCount, l: 'Сыграно' },
            { v: totalGoals, l: 'Голов' },
            { v: liveCount > 0 ? liveCount : '—', l: 'Live' },
          ].map((s) => (
            <div key={s.l} className="text-center" style={{ background: '#FFFFFF', borderRadius: 16, padding: '8px 4px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <div className="text-xl font-black" style={{ color: '#111827' }}>{s.v}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {KICKOFF && new Date() < KICKOFF && (
        <CountdownTimer target={KICKOFF} title="До старта ЧМ-2026" subtitle={`${KICKOFF_LOCAL.date} · ${KICKOFF_LOCAL.time}`} />
      )}

      {/* Сетка плей-офф — главный визуал, в самом верху */}
      <PlayoffBracket onOpen={() => onTab('play')} />

      {/* Tournament progress — group stage rounds → playoff rounds → final */}
      <TournamentProgressBar />

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Идут сейчас</h2>
            </div>
            <button onClick={() => onTab('worldcup.schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Все →
            </button>
          </div>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <LiveMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches — paginated vertical list */}
      {upcomingMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Ближайшие матчи</h2>
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === upcomingPage ? 14 : 6,
                      height: 6,
                      borderRadius: 16,
                      background: i === upcomingPage ? '#C9A800' : 'rgba(0,0,0,0.15)',
                      transition: 'width 0.2s, background 0.2s',
                    }}
                  />
                ))}
                {totalPages > 10 && (
                  <span className="text-[9px] font-bold ml-1" style={{ color: '#9CA3AF' }}>
                    {upcomingPage + 1}/{totalPages}
                  </span>
                )}
              </div>
            ) : (
              <button onClick={() => onTab('worldcup.schedule.knockout')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
                Расписание →
              </button>
            )}
          </div>
          {/* 3-panel swipe carousel */}
          <div
            ref={swipeContainerRef}
            style={{ overflow: 'hidden' }}
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
          >
            <div
              style={{
                display: 'flex',
                width: '300%',
                transform: `translateX(calc(-33.333% + ${dragX}px))`,
                transition: isTransitioning
                  ? 'transform 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  : 'none',
                willChange: 'transform',
              }}
            >
              {/* Prev page */}
              <div style={{ width: '33.333%', paddingRight: 0 }}>
                <div className="space-y-2">
                  {prevPageMatches.map((m) => (
                    <UpcomingMatchRow key={m.id} match={m} isExpanded={false} onToggle={() => {}} pred={upcomingPreds[m.id]} onSave={handleSavePred} saving={savingPred} />
                  ))}
                </div>
              </div>
              {/* Current page */}
              <div style={{ width: '33.333%' }}>
                <div className="space-y-2">
                  {pageMatches.map((m) => (
                    <UpcomingMatchRow
                      key={m.id}
                      match={m}
                      isExpanded={expandedUpcoming === m.id}
                      onToggle={() => setExpandedUpcoming(expandedUpcoming === m.id ? null : m.id)}
                      pred={upcomingPreds[m.id]}
                      onSave={handleSavePred}
                      onTab={onTab}
                      saving={savingPred}
                    />
                  ))}
                </div>
              </div>
              {/* Next page */}
              <div style={{ width: '33.333%' }}>
                <div className="space-y-2">
                  {nextPageMatches.map((m) => (
                    <UpcomingMatchRow key={m.id} match={m} isExpanded={false} onToggle={() => {}} pred={upcomingPreds[m.id]} onSave={handleSavePred} saving={savingPred} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {totalPages > 1 && (
            <button
              onClick={() => onTab('worldcup.schedule.knockout')}
              className="mt-2 w-full text-[10px] font-bold uppercase tracking-wide py-1.5 text-center rounded-2xl"
              style={{ color: '#9CA3AF', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              Всё расписание →
            </button>
          )}
        </section>
      )}

      {/* Групповой этап — компактная карточка-вход (сами таблицы живут в разделе ЧМ) */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Групповой этап</h2>
          <button onClick={() => onTab('worldcup.groups')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
            Подробнее →
          </button>
        </div>
        <button
          onClick={() => onTab('worldcup.groups')}
          className="w-full flex items-center gap-3 p-4 text-left"
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div
            className="w-11 h-11 flex items-center justify-center text-xl flex-shrink-0"
            style={{ borderRadius: 14, background: 'rgba(201,168,0,0.1)' }}
          >
            📊
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black uppercase tracking-wide" style={{ color: '#111827' }}>12 групп · 48 команд</div>
            <div className="text-[11px]" style={{ color: '#6B7280' }}>Итоговые таблицы и все матчи групп</div>
          </div>
          <span className="text-lg flex-shrink-0" style={{ color: '#C9A800' }}>→</span>
        </button>
      </section>

      {/* Recent Results */}
      {finishedMatches.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Последние результаты</h2>
            <button onClick={() => onTab('worldcup.schedule')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
              Ещё →
            </button>
          </div>
          <div className="space-y-2">
            {finishedMatches.map((m) => (
              <FinishedMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Top Scorer Promo */}
      {(() => {
        const topScorers = scorers.filter(s => s.goals > 0).slice(0, 3)
        return (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>Бомбардиры турнира</h2>
              <button onClick={() => onTab('worldcup.scorers')} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
                Все →
              </button>
            </div>
            <div
              className="p-4"
              style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              {topScorers.length === 0 ? (
                <div className="py-3 text-center text-[11px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                  ⚽ Голы появятся после первых матчей
                </div>
              ) : (
                topScorers.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 py-2">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{
                        borderRadius: 16,
                        background: i === 0 ? 'linear-gradient(135deg,#FFD700,#FF8C00)' : i === 1 ? 'linear-gradient(135deg,#C0C0C0,#909090)' : 'linear-gradient(135deg,#CD7F32,#8B4513)',
                        color: '#fff',
                      }}
                    >
                      {['🥇','🥈','🥉'][i]}
                    </div>
                    <span className="text-xl flex-shrink-0">{TEAMS[s.team]?.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate uppercase" style={{ color: '#111827' }}>{s.name}</div>
                      <div className="text-[10px]" style={{ color: '#6B7280' }}>{TEAMS[s.team]?.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-black" style={{ color: '#C9A800' }}>{s.goals}</span>
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>гол</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )
      })()}
    </div>
  )
}

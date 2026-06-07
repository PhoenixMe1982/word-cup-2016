import { useState, useEffect, useCallback } from 'react'
import { TEAMS } from '../data.js'
import { H2H_DATA } from '../data/h2hData.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { toLocalDateTime } from '../utils.js'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

function getInitData() {
  return window.Telegram?.WebApp?.initData || ''
}

function StatusBadge({ status, time, date }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse2" style={{ background: '#16A34A' }} />
        <span className="text-[10px] font-bold" style={{ color: '#16A34A' }}>{time}</span>
      </div>
    )
  }
  if (status === 'finished') {
    return <span className="text-[10px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Завершён</span>
  }
  const localTime = date ? toLocalDateTime(date, time).time : time
  return <span className="text-[10px] font-bold" style={{ color: '#C9A800' }}>{localTime}</span>
}

function H2HPanel({ match }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const key = [match.home, match.away].sort().join('|')
  const h = H2H_DATA[key]

  if (!h || h.wcPlayed === 0) {
    return (
      <div
        className="mt-3 pt-3 text-center"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="text-xl mb-1">🤝</div>
        <div className="text-xs font-bold uppercase" style={{ color: '#9CA3AF' }}>
          Команды не встречались на ЧМ
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: '#C0C7D0' }}>
          Их первый матч на чемпионате мира
        </div>
      </div>
    )
  }

  const codeA = key.split('|')[0]
  const isHomeA = match.home === codeA
  const homeWins = isHomeA ? h.winsA : h.winsB
  const awayWins = isHomeA ? h.winsB : h.winsA
  const homeGoals = isHomeA ? h.goalsA : h.goalsB
  const awayGoals = isHomeA ? h.goalsB : h.goalsA
  const lastWCHomeGoals = isHomeA ? h.lastWC.goalsA : h.lastWC.goalsB
  const lastWCAwayGoals = isHomeA ? h.lastWC.goalsB : h.lastWC.goalsA

  return (
    <div
      className="mt-3 pt-3"
      style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
        История очных встреч на ЧМ
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Матчей', value: h.wcPlayed },
          { label: `Победы ${home?.name}`, value: homeWins },
          { label: 'Ничьи', value: h.draws },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center p-2"
            style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 3 }}
          >
            <div className="text-sm font-black" style={{ color: '#111827' }}>{s.value}</div>
            <div className="text-[9px] uppercase leading-tight" style={{ color: '#9CA3AF' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="font-black" style={{ color: '#111827' }}>{home?.flag} {homeWins}П</span>
          <span style={{ color: '#9CA3AF' }}>{h.draws}Н</span>
          <span className="font-black" style={{ color: '#111827' }}>{awayWins}П {away?.flag}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
          {homeWins > 0 && <div style={{ width: `${(homeWins / h.wcPlayed) * 100}%`, background: '#16A34A' }} />}
          {h.draws > 0 && <div style={{ width: `${(h.draws / h.wcPlayed) * 100}%`, background: '#C9A800' }} />}
          {awayWins > 0 && <div style={{ width: `${(awayWins / h.wcPlayed) * 100}%`, background: '#0EA5E9' }} />}
        </div>
      </div>

      <div
        className="p-2.5 mb-2"
        style={{ background: 'rgba(201,168,0,0.07)', border: '1px solid rgba(201,168,0,0.15)', borderRadius: 3 }}
      >
        <div className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: '#C9A800' }}>
          Последняя встреча на ЧМ — {h.lastWC.year}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{home?.flag}</span>
          <span className="text-base font-black" style={{ color: '#111827' }}>{lastWCHomeGoals} : {lastWCAwayGoals}</span>
          <span className="text-sm">{away?.flag}</span>
          <span className="text-[10px] ml-auto" style={{ color: '#6B7280' }}>{h.lastWC.round}</span>
        </div>
        <div className="text-[9px] mt-0.5" style={{ color: '#9CA3AF' }}>Голов в серии: {homeGoals + awayGoals}</div>
      </div>

      {h.lastAny && (
        <div
          className="p-2.5"
          style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 3 }}
        >
          <div className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: '#0EA5E9' }}>
            Последний официальный матч — {h.lastAny.year}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{home?.flag}</span>
            <span className="text-base font-black" style={{ color: '#111827' }}>
              {isHomeA ? h.lastAny.goalsA : h.lastAny.goalsB} : {isHomeA ? h.lastAny.goalsB : h.lastAny.goalsA}
            </span>
            <span className="text-sm">{away?.flag}</span>
            <span className="text-[10px] ml-auto" style={{ color: '#6B7280' }}>{h.lastAny.comp}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PredictionMini({ matchId, pred, onSave, saving, inTg }) {
  const [homeVal, setHomeVal] = useState(pred?.home ?? '')
  const [awayVal, setAwayVal] = useState(pred?.away ?? '')
  const [saved, setSaved] = useState(!!pred)

  useEffect(() => {
    if (pred) { setHomeVal(pred.home); setAwayVal(pred.away); setSaved(true) }
  }, [pred])

  const canSubmit = homeVal !== '' && awayVal !== '' && !saving
  const hasChanged = saved && (homeVal !== pred?.home || awayVal !== pred?.away)

  async function handleSave() {
    if (!canSubmit) return
    const ok = await onSave(matchId, Number(homeVal), Number(awayVal))
    if (ok) setSaved(true)
  }

  if (!inTg) {
    return (
      <div
        className="mt-3 pt-3 text-center text-[10px]"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', color: '#C9A800' }}
      >
        📱 Открой в Telegram, чтобы сделать прогноз
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>
        Твой прогноз
      </div>
      {saved && !hasChanged ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#6B7280' }}>Прогноз:</span>
            <span className="text-sm font-black" style={{ color: '#C9A800' }}>{pred?.home} : {pred?.away}</span>
            <span className="text-[10px]" style={{ color: '#16A34A' }}>✓</span>
          </div>
          <button
            onClick={() => setSaved(false)}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded"
            style={{ background: 'rgba(0,0,0,0.04)', color: '#6B7280' }}
          >
            Изменить
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" max="20"
            value={homeVal}
            onChange={e => { const v = e.target.value; setHomeVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
            className="w-10 h-10 text-center text-lg font-black rounded-lg outline-none"
            style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>:</span>
          <input
            type="number" min="0" max="20"
            value={awayVal}
            onChange={e => { const v = e.target.value; setAwayVal(v === '' ? '' : Math.min(20, parseInt(v) || 0)) }}
            className="w-10 h-10 text-center text-lg font-black rounded-lg outline-none"
            style={{ background: '#F5F6FA', border: '1.5px solid rgba(201,168,0,0.4)', color: '#111827', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <button
            onClick={handleSave}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-lg text-xs font-black ml-1"
            style={{
              background: canSubmit ? '#C9A800' : 'rgba(0,0,0,0.06)',
              color: canSubmit ? '#fff' : '#9CA3AF',
            }}
          >
            {saving === matchId ? '…' : saved ? 'Обновить' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  )
}

function MatchRow({ match, isExpanded, onToggle, myPred, onSavePred, savingPred, inTg }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'

  return (
    <div
      className={`p-3 ${isLive ? 'match-live-card' : isUpcoming ? 'match-upcoming-card' : 'match-finished-card'} ${isUpcoming ? 'cursor-pointer' : ''}`}
      onClick={isUpcoming ? onToggle : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#9CA3AF' }}>
          Группа {match.group}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} time={match.time} date={match.date} />
          {isUpcoming && (
            <span className="text-[10px]" style={{ color: '#C9A800' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{home.flag}</span>
          <span className="text-sm font-bold truncate uppercase" style={{ color: '#111827' }}>{home.name}</span>
        </div>
        <div className="flex-shrink-0 text-center px-2">
          {isUpcoming ? (
            <span className="text-sm font-black" style={{ color: '#9CA3AF' }}>vs</span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
              <span style={{ color: '#9CA3AF' }}>:</span>
              <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold truncate text-right uppercase" style={{ color: '#111827' }}>{away.name}</span>
          <span className="text-2xl flex-shrink-0">{away.flag}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>📍 {match.venue}</span>
        {!isUpcoming && match.goals && match.goals.length > 0 && (
          <div className="flex gap-2 text-[10px]" style={{ color: '#6B7280' }}>
            {match.goals.slice(0, 2).map((g, i) => (
              <span key={i}>⚽ {g.player} {g.minute}'</span>
            ))}
            {match.goals.length > 2 && <span>+{match.goals.length - 2}</span>}
          </div>
        )}
      </div>

      {isUpcoming && isExpanded && (
        <>
          <H2HPanel match={match} />
          <PredictionMini
            matchId={match.id}
            pred={myPred}
            onSave={onSavePred}
            saving={savingPred}
            inTg={inTg}
          />
        </>
      )}
    </div>
  )
}

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'live', label: '🔴 Live' },
  { id: 'finished', label: 'Завершённые' },
  { id: 'upcoming', label: 'Предстоящие' },
]

const GROUP_KEYS = ['Все', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function Schedule({ embedded = false }) {
  const { matches } = useLiveData()
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('Все')
  const [expandedId, setExpandedId] = useState(null)
  const [myPreds, setMyPreds] = useState({})
  const [savingPred, setSavingPred] = useState(null)

  const initData = getInitData()
  const inTg = !!initData

  useEffect(() => {
    if (!initData) return
    fetch(API + '/api/my-predictions', { headers: { 'x-telegram-init-data': initData } })
      .then(r => r.ok ? r.json() : {})
      .then(d => setMyPreds(d || {}))
      .catch(() => {})
  }, [initData])

  const savePred = useCallback(async (matchId, home, away) => {
    setSavingPred(matchId)
    try {
      await fetch(API + '/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify({ matchId, home, away }),
      })
      setMyPreds(prev => ({ ...prev, [matchId]: { home, away } }))
      return true
    } catch { return false }
    finally { setSavingPred(null) }
  }, [initData])

  const filtered = matches.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    if (groupFilter !== 'Все' && m.group !== groupFilter) return false
    return true
  })

  const byDate = filtered.reduce((acc, m) => {
    const key = m.status === 'live' ? '🔴 Идёт сейчас' : toLocalDateTime(m.date, m.time).date
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className={embedded ? '' : 'page-content'}>
      {!embedded && (
        <div
          className="px-4 pt-12 pb-4"
          style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        >
          <h1 className="text-2xl font-black mb-1 uppercase tracking-wide" style={{ color: '#111827' }}>Расписание</h1>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>ЧМ 2026 · Групповой этап</p>
        </div>
      )}

      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-black transition-all duration-200 uppercase tracking-wide"
              style={{
                background: statusFilter === f.id ? '#C9A800' : 'rgba(0,0,0,0.05)',
                color: statusFilter === f.id ? '#FFFFFF' : '#6B7280',
                borderRadius: 3,
                border: statusFilter === f.id ? 'none' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mt-2 no-scrollbar">
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className="flex-shrink-0 w-8 h-8 text-xs font-black transition-all duration-200 uppercase"
              style={{
                background: groupFilter === g ? 'rgba(201,168,0,0.15)' : 'rgba(0,0,0,0.04)',
                color: groupFilter === g ? '#C9A800' : '#6B7280',
                border: groupFilter === g ? '1px solid rgba(201,168,0,0.35)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 3,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2 space-y-4">
        {Object.entries(byDate).map(([date, dateMatches]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#6B7280' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>
            <div className="space-y-2">
              {dateMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  isExpanded={expandedId === m.id}
                  onToggle={() => toggleExpand(m.id)}
                  myPred={myPreds[m.id]}
                  onSavePred={savePred}
                  savingPred={savingPred}
                  inTg={inTg}
                />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Матчи не найдены</div>
        )}
      </div>
    </div>
  )
}

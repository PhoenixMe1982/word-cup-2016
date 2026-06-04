import { useState, useEffect, useCallback } from 'react'
import { TEAMS, MATCHES } from '../data.js'

const API = (import.meta.env.VITE_API_URL || 'https://wc2026-bot.onrender.com').replace(/\/$/, '')

function getInitData() {
  return window.Telegram?.WebApp?.initData || ''
}

function isTelegram() {
  return !!window.Telegram?.WebApp?.initData
}

async function apiFetch(path, opts = {}) {
  const initData = getInitData()
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (initData) headers['x-telegram-init-data'] = initData
  const res = await fetch(API + path, { ...opts, headers })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
  return res.json()
}

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      value={value === '' ? '' : value}
      onChange={(e) => {
        const v = e.target.value
        if (v === '') { onChange(''); return }
        const n = parseInt(v)
        if (!isNaN(n) && n >= 0 && n <= 20) onChange(n)
      }}
      disabled={disabled}
      className="w-10 h-10 text-center text-lg font-black rounded-lg outline-none"
      style={{
        background: disabled ? 'rgba(0,0,0,0.04)' : '#F5F6FA',
        border: disabled ? '1.5px solid rgba(0,0,0,0.08)' : '1.5px solid rgba(201,168,0,0.4)',
        color: disabled ? '#9CA3AF' : '#111827',
        WebkitAppearance: 'none',
        MozAppearance: 'textfield',
      }}
    />
  )
}

function PointsBadge({ pts }) {
  if (pts === 3) return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg" style={{ background: 'rgba(22,163,74,0.12)', border: '1.5px solid rgba(22,163,74,0.3)' }}>
      <span className="text-sm font-black" style={{ color: '#16A34A' }}>+3</span>
    </div>
  )
  if (pts === 1) return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg" style={{ background: 'rgba(201,168,0,0.1)', border: '1.5px solid rgba(201,168,0,0.3)' }}>
      <span className="text-sm font-black" style={{ color: '#C9A800' }}>+1</span>
    </div>
  )
  return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)', border: '1.5px solid rgba(0,0,0,0.1)' }}>
      <span className="text-sm font-black" style={{ color: '#9CA3AF' }}>0</span>
    </div>
  )
}

function MatchCard({ match, result, myPred, onSave, saving }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const isSettled = !!result
  const hasPred = myPred != null

  const [homeVal, setHomeVal] = useState(hasPred ? myPred.home : '')
  const [awayVal, setAwayVal] = useState(hasPred ? myPred.away : '')
  const [saved, setSaved] = useState(hasPred)

  useEffect(() => {
    if (myPred != null) {
      setHomeVal(myPred.home)
      setAwayVal(myPred.away)
      setSaved(true)
    }
  }, [myPred])

  const canSubmit = homeVal !== '' && awayVal !== '' && !isSettled && !saving
  const hasChanged = saved && (homeVal !== myPred?.home || awayVal !== myPred?.away)

  async function handleSave() {
    if (!canSubmit) return
    const ok = await onSave(match.id, Number(homeVal), Number(awayVal))
    if (ok) setSaved(true)
  }

  return (
    <div
      className="p-3 mb-2"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Match meta */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#9CA3AF' }}>
          Группа {match.group} · {match.date} · {match.time}
        </span>
        {isSettled && myPred != null && (
          <span
            className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{
              background: myPred.pts === 3 ? 'rgba(22,163,74,0.1)' : myPred.pts === 1 ? 'rgba(201,168,0,0.1)' : 'rgba(0,0,0,0.05)',
              color: myPred.pts === 3 ? '#16A34A' : myPred.pts === 1 ? '#C9A800' : '#9CA3AF',
            }}
          >
            {myPred.pts === 3 ? '⚽ Точный счёт' : myPred.pts === 1 ? '✓ Исход угадан' : '✗ Мимо'}
          </span>
        )}
        {!isSettled && saved && !hasChanged && (
          <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: '#16A34A' }}>✓ Сохранено</span>
        )}
      </div>

      {/* Teams row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{home.flag}</span>
          <span className="text-xs font-bold uppercase truncate" style={{ color: '#111827' }}>{home.name}</span>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isSettled ? (
            <>
              {/* Actual result */}
              <div className="flex items-center gap-1">
                <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{result.home}</span>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>:</span>
                <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{result.away}</span>
              </div>
              {/* User's prediction pts */}
              {myPred != null && <PointsBadge pts={myPred.pts} />}
            </>
          ) : (
            <>
              <ScoreInput value={homeVal} onChange={setHomeVal} disabled={false} />
              <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>:</span>
              <ScoreInput value={awayVal} onChange={setAwayVal} disabled={false} />
              <button
                onClick={handleSave}
                disabled={!canSubmit || (saved && !hasChanged)}
                className="w-10 h-10 rounded-lg text-sm font-black flex items-center justify-center flex-shrink-0 transition-opacity"
                style={{
                  background: canSubmit && (!saved || hasChanged) ? '#C9A800' : 'rgba(0,0,0,0.06)',
                  color: canSubmit && (!saved || hasChanged) ? '#fff' : '#9CA3AF',
                  cursor: canSubmit && (!saved || hasChanged) ? 'pointer' : 'default',
                }}
              >
                {saving === match.id ? '…' : saved && !hasChanged ? '✓' : '→'}
              </button>
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold uppercase truncate text-right" style={{ color: '#111827' }}>{away.name}</span>
          <span className="text-2xl flex-shrink-0">{away.flag}</span>
        </div>
      </div>

      {/* Prediction shown under settled match */}
      {isSettled && myPred != null && (
        <div className="mt-2 pt-2 flex items-center gap-1.5 text-[10px]" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#9CA3AF' }}>Твой прогноз:</span>
          <span className="font-black" style={{ color: '#6B7280' }}>{myPred.home} : {myPred.away}</span>
        </div>
      )}
    </div>
  )
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function PlayPage() {
  const [results, setResults] = useState({})
  const [myPreds, setMyPreds] = useState(null)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)
  const inTg = isTelegram()

  const loadData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/results')
      setResults(res || {})
    } catch {}

    if (inTg) {
      try {
        const [preds, me] = await Promise.all([
          apiFetch('/api/my-predictions'),
          apiFetch('/api/me'),
        ])
        setMyPreds(preds || {})
        setStats(me)
      } catch (e) {
        setError(e.message)
      }
    }
  }, [inTg])

  useEffect(() => { loadData() }, [loadData])

  async function handleSave(matchId, home, away) {
    setSaving(matchId)
    setError(null)
    try {
      await apiFetch('/api/predict', {
        method: 'POST',
        body: JSON.stringify({ matchId, home, away }),
      })
      setMyPreds((prev) => ({
        ...prev,
        [matchId]: { home, away, savedAt: new Date().toISOString() },
      }))
      if (stats) setStats((s) => ({ ...s, predictions: (s.predictions || 0) + (myPreds?.[matchId] ? 0 : 1) }))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setSaving(null)
    }
  }

  const filteredMatches = filter === 'all'
    ? MATCHES
    : MATCHES.filter((m) => m.group === filter)

  const predCount = myPreds ? Object.keys(myPreds).length : 0
  const settledWithPred = myPreds
    ? Object.entries(myPreds).filter(([id]) => results[id]).length
    : 0

  return (
    <div className="page-content pb-4">
      {/* Header */}
      <div
        className="-mx-0 px-4 pt-12 pb-4 mb-4"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Прогнозы</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Угадывай счёт — зарабатывай очки</p>
          </div>
          {inTg && stats && (
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: '#C9A800' }}>{stats.pts || 0}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>очков</div>
              {stats.rank && <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>#{stats.rank} место</div>}
            </div>
          )}
        </div>

        {/* Mini stats */}
        {inTg && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: predCount, l: 'Прогнозов' },
              { v: stats?.exact ?? '—', l: 'Точных' },
              { v: stats?.pts ?? 0, l: 'Очков' },
            ].map((s) => (
              <div
                key={s.l}
                className="text-center py-2 rounded"
                style={{ background: '#F5F6FA', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="text-lg font-black" style={{ color: '#111827' }}>{s.v}</div>
                <div className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Not in Telegram warning */}
        {!inTg && (
          <div
            className="p-3 text-xs text-center rounded-lg"
            style={{ background: 'rgba(201,168,0,0.08)', border: '1px solid rgba(201,168,0,0.2)', color: '#C9A800' }}
          >
            📱 Открой приложение в Telegram, чтобы делать прогнозы и участвовать в рейтинге
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-3 p-3 rounded-lg text-xs text-center" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Group filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide"
            style={{
              background: filter === 'all' ? '#C9A800' : 'rgba(0,0,0,0.05)',
              color: filter === 'all' ? '#fff' : '#6B7280',
            }}
          >
            Все
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide"
              style={{
                background: filter === g ? '#C9A800' : 'rgba(0,0,0,0.05)',
                color: filter === g ? '#fff' : '#6B7280',
              }}
            >
              Гр.{g}
            </button>
          ))}
        </div>
      </div>

      {/* Match list */}
      <div className="px-4">
        {filteredMatches.map((match) => {
          const result = results[match.id] || null
          const pred = myPreds?.[match.id]
          const predWithPts = result && pred
            ? { ...pred, pts: pred.pts ?? calcPointsLocal(pred, result) }
            : pred
          return (
            <MatchCard
              key={match.id}
              match={match}
              result={result}
              myPred={inTg ? (predWithPts ?? null) : null}
              onSave={handleSave}
              saving={saving}
            />
          )
        })}
      </div>

      {/* Scoring legend */}
      <div className="px-4 mt-4 mb-2">
        <div
          className="p-3 rounded-lg grid grid-cols-3 gap-2 text-center text-[10px]"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div>
            <div className="font-black text-sm" style={{ color: '#16A34A' }}>3 очка</div>
            <div style={{ color: '#6B7280' }}>Точный счёт</div>
          </div>
          <div>
            <div className="font-black text-sm" style={{ color: '#C9A800' }}>1 очко</div>
            <div style={{ color: '#6B7280' }}>Исход угадан</div>
          </div>
          <div>
            <div className="font-black text-sm" style={{ color: '#9CA3AF' }}>0 очков</div>
            <div style={{ color: '#6B7280' }}>Промах</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function calcPointsLocal(pred, result) {
  if (pred.home === result.home && pred.away === result.away) return 3
  const predO = Math.sign(pred.home - pred.away)
  const realO = Math.sign(result.home - result.away)
  return predO === realO ? 1 : 0
}

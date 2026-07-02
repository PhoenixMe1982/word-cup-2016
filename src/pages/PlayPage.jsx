import { useState, useEffect, useCallback } from 'react'
import { TEAMS, HEADER_BANNER_STYLE, KNOCKOUT_STAGE_LABELS, KNOCKOUT_STAGE_ORDER, isKnockoutMatch, knockoutEnabled } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'
import { resolveTeams } from '../knockout.js'
import { toLocalDateTime, matchUTCDate, calcKnockoutBreakdown, calcKnockoutPoints, compareKickoff } from '../utils.js'
import { KnockoutLegend } from '../components/KnockoutScoring.jsx'

const KO_ENABLED = knockoutEnabled()

const LIVE_YELLOW = '#FACC15'
const GREEN = '#16A34A'
const BLUE = '#2563EB'
const RED = '#DC2626'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

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
      className="w-10 h-10 text-center text-lg font-black rounded-2xl outline-none"
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

// Очки могут быть 0/1/3 (группа) либо до 7 (плей-офф, стек). Цвет по порогам:
// зелёный ≥3, золотой 1–2, серый 0.
function PointsBadge({ pts }) {
  const green = pts >= 3, gold = pts >= 1 && pts < 3
  const bg = green ? 'rgba(22,163,74,0.12)' : gold ? 'rgba(201,168,0,0.1)' : 'rgba(0,0,0,0.04)'
  const border = green ? 'rgba(22,163,74,0.3)' : gold ? 'rgba(201,168,0,0.3)' : 'rgba(0,0,0,0.1)'
  const color = green ? '#16A34A' : gold ? '#C9A800' : '#9CA3AF'
  return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-2xl" style={{ background: bg, border: `1.5px solid ${border}` }}>
      <span className="text-sm font-black" style={{ color }}>{pts > 0 ? `+${pts}` : '0'}</span>
    </div>
  )
}

// Сравнение прогнозов (учитывает каскад плей-офф) — нужно для «✓ Сохранено».
function samePred(a, b) {
  if (!a || !b) return false
  if (Number(a.home) !== Number(b.home) || Number(a.away) !== Number(b.away)) return false
  if (!!a.et !== !!b.et) return false
  if (a.et && b.et && (Number(a.et.home) !== Number(b.et.home) || Number(a.et.away) !== Number(b.et.away))) return false
  if ((a.penWinner || null) !== (b.penWinner || null)) return false
  return true
}

function MatchCard({ match, result, myPred, onSave, saving, isSelected, onSelect }) {
  const home = TEAMS[match.home]
  const away = TEAMS[match.away]
  const knockout = isKnockoutMatch(match)
  const isSettled = !!result
  const kickoffUTC = matchUTCDate(match.date, match.time)
  const isTimeStarted = kickoffUTC ? new Date() >= kickoffUTC : false
  // Завершённый матч (зачтён или статус finished) больше не LIVE
  const isFinished = isSettled || match.status === 'finished'
  const isLive = !isFinished && (match.status === 'live' || isTimeStarted)
  const isLocked = isFinished || isLive
  const hasPred = myPred != null

  const [homeVal, setHomeVal] = useState(hasPred ? myPred.home : '')
  const [awayVal, setAwayVal] = useState(hasPred ? myPred.away : '')
  const [etHome, setEtHome] = useState(hasPred && myPred.et ? myPred.et.home : '')
  const [etAway, setEtAway] = useState(hasPred && myPred.et ? myPred.et.away : '')
  const [penWinner, setPenWinner] = useState(hasPred && myPred.penWinner ? myPred.penWinner : null)
  const [saved, setSaved] = useState(hasPred)

  useEffect(() => {
    if (myPred != null) {
      setHomeVal(myPred.home)
      setAwayVal(myPred.away)
      setEtHome(myPred.et ? myPred.et.home : '')
      setEtAway(myPred.et ? myPred.et.away : '')
      setPenWinner(myPred.penWinner || null)
      setSaved(true)
    }
  }, [myPred])

  // Каскад плей-офф: счёт 90′ → если ничья, счёт 120′ (et) → если снова ничья,
  // победитель серии (penWinner). Поля вне каскада в payload не попадают.
  const draw90 = homeVal !== '' && awayVal !== '' && Number(homeVal) === Number(awayVal)
  const etFilled = etHome !== '' && etAway !== ''
  const draw120 = etFilled && Number(etHome) === Number(etAway)
  const showEt = knockout && draw90
  const showPen = knockout && draw90 && draw120

  // Счёт за 120′ — это ИТОГ всего матча (90′ + овертайм), а не голы только в ОТ.
  // При раскрытии этапа предзаполняем счётом 90′: если в овертайме не забьют, итог
  // не меняется (напр. 1:1 на 90′ → остаётся 1:1). Дальше игрок правит при желании.
  useEffect(() => {
    if (knockout && draw90 && !saved && etHome === '' && etAway === '') {
      setEtHome(homeVal)
      setEtAway(awayVal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw90])

  function buildPayload() {
    const p = { home: Number(homeVal), away: Number(awayVal) }
    if (knockout && draw90 && etFilled) {
      p.et = { home: Number(etHome), away: Number(etAway) }
      if (draw120 && penWinner) p.penWinner = penWinner
    }
    return p
  }

  const cascadeComplete = homeVal !== '' && awayVal !== '' && (
    !knockout || !draw90 ? true : !etFilled ? false : !draw120 ? true : penWinner != null
  )
  const canSubmit = cascadeComplete && !isLocked && !saving
  const hasChanged = saved && !samePred(buildPayload(), myPred)
  const { time: localTime, date: localDate } = toLocalDateTime(match.date, match.time)
  const metaLabel = knockout ? (KNOCKOUT_STAGE_LABELS[match.stage] || 'Плей-офф') : `Группа ${match.group}`
  const koBreak = (knockout && isSettled && hasPred) ? calcKnockoutBreakdown(myPred, result) : null

  // Цвет рамки сразу показывает игроку, насколько точным был его прогноз:
  // жёлтая — матч идёт и прогноз заблокирован, зелёная/синяя/красная — итог матча.
  // Пороги работают и для группы (0/1/3), и для плей-офф (0..7): ≥3 зелёный,
  // 1–2 синий, 0 красный.
  let outcomeColor = null
  if (isLive) outcomeColor = LIVE_YELLOW
  else if (isSettled && hasPred) outcomeColor = myPred.pts >= 3 ? GREEN : myPred.pts >= 1 ? BLUE : RED

  const cardBorder = outcomeColor
    ? `2.5px solid ${outcomeColor}`
    : isSelected ? '1.5px solid rgba(201,168,0,0.4)' : '1px solid rgba(0,0,0,0.07)'
  const cardShadow = outcomeColor
    ? `0 0 0 1px ${outcomeColor}33, 0 4px 16px ${outcomeColor}40`
    : isSelected ? '0 2px 12px rgba(201,168,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)'

  async function handleSave() {
    if (!canSubmit) return
    const ok = await onSave(match.id, buildPayload())
    if (ok) setSaved(true)
  }

  function handleShare(e) {
    e.stopPropagation()
    const finalHome = result?.home ?? match.scoreHome
    const finalAway = result?.away ?? match.scoreAway
    let text
    if (isFinished && finalHome != null && myPred) {
      const pts = myPred.pts ?? calcPointsLocal(myPred, { home: finalHome, away: finalAway })
      text = `⚽ ЧМ 2026 | ${metaLabel}\n${home.flag} ${home.name} ${finalHome}:${finalAway} ${away.name} ${away.flag}\n🔮 Мой прогноз: ${myPred.home}:${myPred.away} (+${pts} оч.)\n📲 @Mundial_26_bot`
    } else if (isFinished && finalHome != null) {
      text = `⚽ ЧМ 2026 | ${metaLabel}\n${home.flag} ${home.name} ${finalHome}:${finalAway} ${away.name} ${away.flag}\n📲 Прогнозируй матчи: @Mundial_26_bot`
    } else if (myPred && saved) {
      text = `🔮 Прогноз ЧМ 2026 | ${metaLabel}\n${home.flag} ${home.name} ${myPred.home}:${myPred.away} ${away.name} ${away.flag}\n📲 Угадывай счёт: @Mundial_26_bot`
    } else {
      text = `⚽ ЧМ 2026 | ${metaLabel}\n${home.flag} ${home.name} vs ${away.name} ${away.flag}\n📅 ${localDate} · ${localTime}\n📲 @Mundial_26_bot`
    }
    const url = 'https://t.me/Mundial_26_bot'
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
    }
  }

  return (
    <div
      onClick={onSelect}
      className="relative overflow-hidden p-3 mb-2 cursor-pointer"
      style={{
        background: '#FFFFFF',
        border: cardBorder,
        borderRadius: 16,
        boxShadow: cardShadow,
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* LIVE indicator — матч идёт, прогноз создать/изменить уже нельзя */}
      {isLive && (
        <div
          className="absolute top-0 right-0 flex items-center gap-1 pl-2.5 pr-2 py-1"
          style={{ background: LIVE_YELLOW, borderBottomLeftRadius: 8 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse2" style={{ background: '#DC2626' }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#111827' }}>Live</span>
        </div>
      )}

      {/* Match meta */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: knockout ? '#C9A800' : '#9CA3AF' }}>
          {knockout && '🏆 '}{metaLabel} · {localDate} · {localTime}
        </span>
        {isSettled && myPred != null && (
          <span
            className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-2xl"
            style={{
              background: myPred.pts >= 3 ? 'rgba(22,163,74,0.1)' : myPred.pts >= 1 ? 'rgba(201,168,0,0.1)' : 'rgba(0,0,0,0.05)',
              color: myPred.pts >= 3 ? '#16A34A' : myPred.pts >= 1 ? '#C9A800' : '#9CA3AF',
            }}
          >
            {knockout
              ? (myPred.pts > 0 ? `+${myPred.pts} очк.` : '✗ Мимо')
              : (myPred.pts === 3 ? '⚽ Точный счёт' : myPred.pts === 1 ? '✓ Исход угадан' : '✗ Мимо')}
          </span>
        )}
        {!isLocked && saved && !hasChanged && (
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

        {/* Score area — stop propagation so clicks here don't toggle card selection */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isFinished ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{result?.home ?? match.scoreHome ?? '–'}</span>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>:</span>
                <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{result?.away ?? match.scoreAway ?? '–'}</span>
              </div>
              {isSettled && myPred != null && <PointsBadge pts={myPred.pts} />}
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-2xl text-base flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2a00ff,#00299d)', border: '1px solid #0b0077', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(42,0,255,0.3)' }}
              >
                📤
              </button>
            </>
          ) : isLive ? (
            <div className="flex flex-col items-center gap-1">
              {match.scoreHome != null ? (
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreHome}</span>
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>:</span>
                  <span className="text-xl font-black score-number" style={{ color: '#111827' }}>{match.scoreAway}</span>
                  <span className="text-[8px] font-black px-1 py-0.5 rounded-2xl ml-1" style={{ background: LIVE_YELLOW, color: '#111827' }}>LIVE</span>
                </div>
              ) : null}
              <div
                className="flex items-center gap-1 px-2 py-0.5"
                style={{ background: 'rgba(0,0,0,0.04)', border: `1px solid ${LIVE_YELLOW}60`, borderRadius: 6 }}
              >
                <span className="text-[9px]">🔒</span>
                {hasPred
                  ? <span className="text-xs font-black" style={{ color: '#6B7280' }}>{myPred.home}:{myPred.away}</span>
                  : <span className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>нет</span>
                }
              </div>
            </div>
          ) : (
            <>
              {knockout && <span className="text-[8px] font-black uppercase tracking-wide mr-0.5" style={{ color: '#9CA3AF' }}>90′</span>}
              <ScoreInput value={homeVal} onChange={setHomeVal} disabled={false} />
              <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>:</span>
              <ScoreInput value={awayVal} onChange={setAwayVal} disabled={false} />
              {/* Для группы — кнопка сейва/шаринга прямо тут; для плей-офф она
                  переезжает под каскадную панель (см. ниже). */}
              {!knockout && (saved && !hasChanged ? (
                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-2xl text-base flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#2a00ff,#00299d)', border: '1px solid #0b0077', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(42,0,255,0.3)' }}
                >
                  📤
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={!canSubmit}
                  className={`w-10 h-10 rounded-2xl text-lg font-black flex items-center justify-center flex-shrink-0 ${canSubmit ? 'animate-bounce' : ''}`}
                  style={{
                    background: canSubmit ? '#C9A800' : 'rgba(0,0,0,0.06)',
                    color: canSubmit ? '#fff' : '#9CA3AF',
                    cursor: canSubmit ? 'pointer' : 'default',
                  }}
                >
                  {saving === match.id ? '…' : canSubmit ? '⚽' : '→'}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold uppercase truncate text-right" style={{ color: '#111827' }}>{away.name}</span>
          <span className="text-2xl flex-shrink-0">{away.flag}</span>
        </div>
      </div>

      {/* Каскадная панель плей-офф (только редактируемый нокаут-матч) */}
      {knockout && !isLocked && (
        <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} onClick={(e) => e.stopPropagation()}>
          {/* Пояснение: счёт всегда ИТОГОВЫЙ за период, а не голы отдельного отрезка */}
          <div className="text-[9px] leading-snug mb-2" style={{ color: '#9CA3AF' }}>
            Счёт указывай <b style={{ color: '#6B7280' }}>итоговый</b> за период: вверху — к концу 90′; ниже (при ничьей) — общий к концу 120′.
          </div>
          {/* Шаг 2 — итоговый счёт за 120′, раскрывается при ничьей 90′ */}
          {showEt && (
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>Ничья! Итог за 120′ (90′ + ОТ)</span>
                <div className="flex items-center gap-1.5">
                  <ScoreInput value={etHome} onChange={setEtHome} disabled={false} />
                  <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>:</span>
                  <ScoreInput value={etAway} onChange={setEtAway} disabled={false} />
                </div>
              </div>
              <div className="text-[9px] mt-1" style={{ color: '#9CA3AF' }}>
                Общий счёт за весь матч к концу овертайма (если в ОТ не забьют — оставь как на 90′).
              </div>
            </div>
          )}
          {/* Шаг 3 — кто пройдёт по пенальти, при ничьей 120′ */}
          {showPen && (
            <div className="mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#C9A800' }}>Снова ничья? Кто пройдёт по пенальти</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[['HOME', home], ['AWAY', away]].map(([side, t]) => (
                  <button
                    key={side}
                    onClick={() => setPenWinner(side)}
                    className="flex items-center justify-center gap-1 py-2 rounded-2xl text-xs font-black"
                    style={{
                      background: penWinner === side ? '#C9A800' : 'rgba(0,0,0,0.04)',
                      color: penWinner === side ? '#fff' : '#6B7280',
                      border: penWinner === side ? '1.5px solid #C9A800' : '1.5px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <span className="text-base">{t.flag}</span>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Кнопка сохранения / поделиться */}
          <div className="flex items-center gap-2">
            {saved && !hasChanged ? (
              <>
                <span className="flex-1 text-[10px] font-black uppercase tracking-wide" style={{ color: '#16A34A' }}>✓ Прогноз сохранён</span>
                <button onClick={handleShare} className="px-3 h-9 rounded-2xl text-sm flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2a00ff,#00299d)', border: '1px solid #0b0077', color: '#FFFFFF' }}>📤</button>
              </>
            ) : (
              <button
                onClick={handleSave}
                disabled={!canSubmit}
                className="flex-1 h-9 rounded-2xl text-xs font-black uppercase tracking-wide flex items-center justify-center"
                style={{ background: canSubmit ? '#C9A800' : 'rgba(0,0,0,0.06)', color: canSubmit ? '#fff' : '#9CA3AF' }}
              >
                {saving === match.id ? 'Сохраняю…' : canSubmit ? '⚽ Сохранить прогноз' : draw90 && !etFilled ? 'Введи итог за 120′' : showPen && !penWinner ? 'Выбери победителя серии' : 'Заполни счёт 90′'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Прогноз под завершённым ГРУППОВЫМ матчем — без изменений к этапу 1 */}
      {isSettled && myPred != null && !knockout && (
        <div className="mt-2 pt-2 flex items-center gap-1.5 text-[10px]" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#9CA3AF' }}>Твой прогноз:</span>
          <span className="font-black" style={{ color: '#6B7280' }}>{myPred.home} : {myPred.away}</span>
        </div>
      )}

      {/* Разбивка итога и очков под завершённым матчем ПЛЕЙ-ОФФ */}
      {isSettled && myPred != null && knockout && (
        <div className="mt-2 pt-2 text-[10px]" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1" style={{ color: '#6B7280' }}>
            <span style={{ color: '#9CA3AF' }}>Итог:</span>
            <span className="font-black">90′ {result.reg ? `${result.reg.home}:${result.reg.away}` : `${result.home}:${result.away}`}</span>
            {result.et && <span className="font-black">· 120′ {result.et.home}:{result.et.away}</span>}
            {/* «пен» — только при реальной серии (duration), не просто при winner. */}
            {result.duration === 'PENALTY_SHOOTOUT' && (result.winner === 'HOME_TEAM' || result.winner === 'AWAY_TEAM') && (
              <span className="font-black">· пен. {(result.winner === 'HOME_TEAM' ? home : away).flag}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span style={{ color: '#9CA3AF' }}>Твой прогноз:</span>
            <span className="font-black" style={{ color: '#6B7280' }}>{myPred.home}:{myPred.away}</span>
            {myPred.et && <span className="font-black" style={{ color: '#6B7280' }}>· 120′ {myPred.et.home}:{myPred.et.away}</span>}
            {myPred.penWinner && <span className="font-black" style={{ color: '#6B7280' }}>· пен. {(myPred.penWinner === 'HOME' ? home : away).flag}</span>}
          </div>
          {koBreak && (
            <div className="flex flex-wrap items-center gap-x-1.5 mt-1 pt-1 text-[9px]" style={{ borderTop: '1px dashed rgba(0,0,0,0.06)', color: '#9CA3AF' }}>
              {koBreak.p90 > 0 && <span>90′ +{koBreak.p90}</span>}
              {koBreak.p120 > 0 && <span>· 120′ +{koBreak.p120}</span>}
              {koBreak.pPen > 0 && <span>· пен. +{koBreak.pPen}</span>}
              {koBreak.pAdv > 0 && <span>· проход +{koBreak.pAdv}</span>}
              <span className="font-black ml-auto" style={{ color: koBreak.total > 0 ? '#16A34A' : '#9CA3AF' }}>= +{koBreak.total} очк.</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function PlayPage() {
  const { matches } = useLiveData()
  const [results, setResults] = useState({})
  const [myPreds, setMyPreds] = useState(null)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [groupsExpanded, setGroupsExpanded] = useState(false) // показ подпунктов A…L в субпанели
  const [groupSectionOpen, setGroupSectionOpen] = useState(false) // развёрнут ли блок групповых прогнозов в режиме «Все»
  const [stats, setStats] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [loading, setLoading] = useState(true)
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
    setLoading(false)
  }, [inTg])

  useEffect(() => { loadData() }, [loadData])

  // payload: { home, away } для группы; для плей-офф + опц. { et:{home,away}, penWinner }
  async function handleSave(matchId, payload) {
    setSaving(matchId)
    setError(null)
    try {
      await apiFetch('/api/predict', {
        method: 'POST',
        body: JSON.stringify({ matchId, ...payload }),
      })
      setMyPreds((prev) => ({
        ...prev,
        [matchId]: { ...payload, savedAt: new Date().toISOString() },
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

  // Карта id→матч для резолва пар плей-офф по сетке (как в разделе ЧМ).
  const byId = {}
  for (const m of matches) byId[m.id] = m

  // Разделяем матчи: групповые и плей-офф (по стадиям).
  const groupMatches = matches.filter((m) => !isKnockoutMatch(m)).sort(compareKickoff)
  const koMatches = matches.filter((m) => isKnockoutMatch(m)).sort(compareKickoff)
  const hasKnockout = KO_ENABLED && koMatches.length > 0
  // Стадии, в которых есть хотя бы один матч (для чипов субпанели).
  const koStages = KNOCKOUT_STAGE_ORDER.filter((s) => koMatches.some((m) => m.stage === s))
  const hasTeams = (m) => !!(m.home && m.away)

  const predCount = myPreds ? Object.keys(myPreds).length : 0
  const settledWithPred = myPreds
    ? Object.entries(myPreds).filter(([id]) => results[id]).length
    : 0

  // Рендер одной карточки матча (или заглушки TBD для нерезолвленного нокаута).
  function renderMatch(rawMatch) {
    // Плей-офф: подставляем команды по сетке (как в разделе ЧМ). Прогноз доступен
    // ТОЛЬКО когда ОБЕ команды известны; иначе ниже — заглушка TBD (ставить нельзя).
    const match = isKnockoutMatch(rawMatch)
      ? { ...rawMatch, ...resolveTeams(rawMatch, byId) }
      : rawMatch
    if (isKnockoutMatch(match) && !hasTeams(match)) {
      return (
        <div
          key={match.id}
          className="flex items-center gap-2 p-3 mb-2"
          style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(201,168,0,0.35)', borderRadius: 16 }}
        >
          <span className="text-base">🏆</span>
          <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: '#C9A800' }}>
            {KNOCKOUT_STAGE_LABELS[match.stage] || 'Плей-офф'}
          </span>
          <span className="text-[10px] uppercase tracking-wide ml-auto" style={{ color: '#9CA3AF' }}>
            Команды определятся позже
          </span>
        </div>
      )
    }
    const result = results[match.id] || null
    const pred = myPreds?.[match.id]
    const kn = isKnockoutMatch(match)
    const predWithPts = result && pred
      ? { ...pred, pts: pred.pts ?? (kn ? calcKnockoutPoints(pred, result) : calcPointsLocal(pred, result)) }
      : pred
    const isSelected = selectedMatch === match.id
    return (
      <div
        key={match.id}
        style={{ opacity: selectedMatch && !isSelected ? 0.55 : 1, transition: 'opacity 0.2s' }}
      >
        <MatchCard
          match={match}
          result={result}
          myPred={inTg ? (predWithPts ?? null) : null}
          onSave={handleSave}
          saving={saving}
          isSelected={isSelected}
          onSelect={() => setSelectedMatch(isSelected ? null : match.id)}
        />
      </div>
    )
  }

  // Тап по чипу «Групповой этап»: раскрыть/свернуть подпункты A…L. При раскрытии
  // переключаемся на показ всех групп, при сворачивании — обратно на «Все».
  function toggleGroups() {
    if (groupsExpanded) {
      setGroupsExpanded(false)
      if (filter === 'group' || GROUPS.includes(filter)) setFilter('all')
    } else {
      setGroupsExpanded(true)
      setFilter('group')
    }
  }

  const isGroupFilter = filter === 'group' || GROUPS.includes(filter)

  if (loading) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#F5F6FA' }}>
      <div
        className="w-14 h-14 rounded-full border-4 mb-4"
        style={{
          borderColor: 'rgba(201,168,0,0.2)',
          borderTopColor: '#C9A800',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>Загрузка прогнозов…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className="page-content pb-4">
      {/* Header */}
      <div
        className="-mx-0 px-4 pt-12 pb-4 mb-4"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="max-w-[50%]">
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>Прогнозы</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>Угадывай счёт — зарабатывай очки</p>
          </div>
          {inTg && stats && (
            <div className="text-right">
              <div className="text-2xl font-black leading-none" style={{ color: '#111827' }}>{stats.pts || 0}</div>
              <div className="text-[9px] uppercase tracking-wide" style={{ color: '#111827' }}>очков</div>
              {stats.rank && <div className="text-[9px] uppercase tracking-wide" style={{ color: '#111827' }}>#{stats.rank} место</div>}
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
                className="text-center py-2 rounded-2xl"
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
            className="p-3 text-xs text-center rounded-2xl"
            style={{ background: 'rgba(201,168,0,0.08)', border: '1px solid rgba(201,168,0,0.2)', color: '#C9A800' }}
          >
            📱 Открой приложение в Telegram, чтобы делать прогнозы и участвовать в рейтинге
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-3 p-3 rounded-2xl text-xs text-center" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Фильтр-субпанель: Все · Групповой этап (раскрывает A…L) · стадии плей-офф */}
      <div className="px-4 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { setFilter('all'); setGroupsExpanded(false) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide"
            style={{
              background: filter === 'all' ? '#C9A800' : 'rgba(0,0,0,0.05)',
              color: filter === 'all' ? '#fff' : '#6B7280',
            }}
          >
            Все
          </button>
          <button
            onClick={toggleGroups}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1"
            style={{
              background: isGroupFilter ? '#C9A800' : 'rgba(0,0,0,0.05)',
              color: isGroupFilter ? '#fff' : '#6B7280',
            }}
          >
            Групповой этап <span style={{ fontSize: 8 }}>{groupsExpanded ? '▲' : '▼'}</span>
          </button>
          {hasKnockout && koStages.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setGroupsExpanded(false) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide"
              style={{
                background: filter === s ? '#C9A800' : 'rgba(201,168,0,0.12)',
                color: filter === s ? '#fff' : '#C9A800',
              }}
            >
              {KNOCKOUT_STAGE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Подпункты групп — появляются по тапу «Групповой этап» */}
        {groupsExpanded && (
          <div className="flex gap-1.5 overflow-x-auto pt-2 scrollbar-hide">
            <button
              onClick={() => setFilter('group')}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
              style={{
                background: filter === 'group' ? 'rgba(201,168,0,0.2)' : 'rgba(0,0,0,0.04)',
                color: filter === 'group' ? '#C9A800' : '#6B7280',
                border: filter === 'group' ? '1px solid rgba(201,168,0,0.4)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              Все группы
            </button>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className="flex-shrink-0 w-8 h-7 rounded-full text-[10px] font-black uppercase"
                style={{
                  background: filter === g ? '#C9A800' : 'rgba(0,0,0,0.04)',
                  color: filter === g ? '#fff' : '#6B7280',
                  border: filter === g ? 'none' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match list */}
      <div className="px-4">
        {isGroupFilter ? (
          (filter === 'group' ? groupMatches : groupMatches.filter((m) => m.group === filter)).map(renderMatch)
        ) : koStages.includes(filter) ? (
          koMatches.filter((m) => m.stage === filter).map(renderMatch)
        ) : (
          <>
            {/* Режим «Все»: групповые прогнозы свёрнуты, плей-офф — ниже и раскрыт */}
            <button
              onClick={() => setGroupSectionOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-3 mb-2"
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <span className="text-base">📊</span>
              <span className="text-xs font-black uppercase tracking-wide" style={{ color: '#111827' }}>Групповой этап</span>
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>· {groupMatches.length} матчей</span>
              <span className="ml-auto text-[11px] font-bold" style={{ color: '#C9A800' }}>{groupSectionOpen ? 'Свернуть ▲' : 'Развернуть ▼'}</span>
            </button>
            {groupSectionOpen && <div className="mb-3">{groupMatches.map(renderMatch)}</div>}

            {hasKnockout && koStages.map((s) => (
              <div key={s} className="mb-1">
                <div className="flex items-center gap-2 mt-3 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#C9A800' }}>🏆 {KNOCKOUT_STAGE_LABELS[s]}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(201,168,0,0.25)' }} />
                </div>
                {koMatches.filter((m) => m.stage === s).map(renderMatch)}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Scoring legend */}
      <div className="px-4 mt-4 mb-2">
        {koStages.includes(filter) ? (
          <KnockoutLegend />
        ) : (
          <div
            className="p-3 rounded-2xl grid grid-cols-3 gap-2 text-center text-[10px]"
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
        )}
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

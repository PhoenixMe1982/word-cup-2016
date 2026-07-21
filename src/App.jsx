import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import WorldCup from './pages/WorldCup.jsx'
import PlayPage from './pages/PlayPage.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import BottomNav from './components/BottomNav.jsx'
import SaluteWatcher from './components/SaluteWatcher.jsx'
import Splash from './components/Splash.jsx'
import VisitSummary from './components/VisitSummary.jsx'
import AnnouncementModal from './components/AnnouncementModal.jsx'
import ScoringModal from './components/ScoringModal.jsx'
import PointsPopup from './components/PointsPopup.jsx'
import StandingsReveal from './components/StandingsReveal.jsx'
import { knockoutEnabled, TEAMS } from './data.js'
import { winnerCode, loserCode } from './knockout.js'
import { matchUTCDate } from './utils.js'
import { LiveDataProvider, useLiveData } from './LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

const LAST_VISIT_KEY = 'wc2026_lastVisit' // снимок {rank, pts, settledIds} прошлого визита
// Разовый попап-разъяснение про исправление счёта матча m83 (Португалия—Хорватия, 2:2→2:1)
const ANNOUNCE_KEY = 'wc2026_announce_m83_score_fix'
// Разовый попап со схемой начисления очков (показывается с запуском плей-офф)
const SCORING_KEY = 'wc2026_scoring_scheme_v1'

// Сплэш висит минимум столько (чтобы не мигал на быстрой сети) и максимум
// столько (фолбэк: если Render холодный/завис — всё равно пускаем внутрь).
const SPLASH_MIN_MS = 600
const SPLASH_MAX_MS = 12000

// Считаем, что изменилось с прошлого визита, и параллельно обновляем снимок.
// Возвращает summary для попапа либо null (показывать нечего).
function computeVisitSummary(me, settled) {
  let prev = null
  try { prev = JSON.parse(localStorage.getItem(LAST_VISIT_KEY)) } catch { /* приватный режим */ }

  const settledIds = settled.map((p) => String(p.matchId))
  const snapshot = { rank: me?.rank ?? null, pts: me?.pts ?? 0, settledIds }

  // Снимок обновляем всегда — следующий визит будет считать дельту от «сейчас».
  try { localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(snapshot)) } catch { /* noop */ }

  // Первый запуск фичи: только зерним снимок, ничего не показываем
  // (иначе вывалим всю историю как «изменения»).
  if (!prev) return null

  const prevIds = new Set(prev.settledIds || [])
  const fresh = settled.filter((p) => !prevIds.has(String(p.matchId)))
  const newCount = fresh.length
  const ptsGained = fresh.reduce((s, p) => s + (p.pts || 0), 0)
  const exactCount = fresh.filter((p) => p.pts === 3).length

  const rankFrom = prev.rank
  const rankTo = me?.rank ?? null
  const rankDelta = rankFrom != null && rankTo != null ? rankFrom - rankTo : 0 // >0 = поднялся

  const hasChange = newCount > 0 || rankDelta !== 0
  if (!hasChange) return null

  return {
    newCount,
    ptsGained,
    exactCount,
    rankFrom,
    rankTo,
    rankDelta,
    celebrate: ptsGained > 0 || rankDelta > 0,
  }
}

// ── Сценарий показа финальных мест ────────────────────────────────────────
// Матч за 3-е место (m103) и финал (m104). Места считаем из живых данных теми
// же winnerCode/loserCode, что и сетка. Окно показа: сцена живёт 1 день после
// (приблизительного) окончания матча — дальше турнир «остывает».
const REVEAL_TTL_MS = 24 * 3600 * 1000         // сутки после матча — потом не показываем
const MATCH_MAX_MS = 3 * 3600 * 1000           // запас на 120′ + пенальти + задержки

function teamRow(rank, code) {
  const t = code && TEAMS[code]
  return t ? { rank, code, name: t.name, flag: t.flag } : null
}

// Возвращает { variant, stage, matchId, rows } активной сцены или null.
// rows — в порядке отображения сверху вниз (bronze: 4,3 / champion: 1,2,3,4).
function computeReveal(matches) {
  if (!knockoutEnabled()) return null
  const byId = {}
  for (const m of matches) byId[m.id] = m
  const m103 = byId.m103
  const m104 = byId.m104

  // Матч ещё «свежий»? (в пределах суток после ориентировочного финального свистка)
  // __REVEAL_FORCE__ — тест-хук скриншот-скрипта: снимает окно, чтобы съёмка не
  // зависела от даты прогона (в прод-сборку не инъектится).
  const forceFresh = typeof window !== 'undefined' && window.__REVEAL_FORCE__
  const fresh = (m) => {
    if (forceFresh) return true
    const k = matchUTCDate(m?.date, m?.time)
    if (!k) return true // не смогли распарсить время — не режем показ
    return Date.now() < k.getTime() + MATCH_MAX_MS + REVEAL_TTL_MS
  }

  // Финал сыгран → сцена чемпиона со всеми 4 местами (3-е/4-е из m103, если есть).
  if (m104?.status === 'finished') {
    const first = teamRow(1, winnerCode(m104, byId))
    const second = teamRow(2, loserCode(m104, byId))
    const third = m103?.status === 'finished' ? teamRow(3, winnerCode(m103, byId)) : null
    const fourth = m103?.status === 'finished' ? teamRow(4, loserCode(m103, byId)) : null
    const rows = [first, second, third, fourth].filter(Boolean)
    if (first && second && fresh(m104)) return { variant: 'champion', stage: 'm104', matchId: 'm104', rows }
  }

  // Иначе, если сыгран матч за 3-е место → бронзовая сцена (3-е сверху, 4-е снизу).
  if (m103?.status === 'finished') {
    const fourth = teamRow(4, loserCode(m103, byId))
    const third = teamRow(3, winnerCode(m103, byId))
    if (fourth && third && fresh(m103)) {
      return { variant: 'bronze', stage: 'm103', matchId: 'm103', rows: [third, fourth] }
    }
  }
  return null
}

// Мягкая плашка обновления: появляется, когда задеплоена сборка новее открытой
// вкладки. По тапу «Обновить» — перезагрузка (подтянется новый бандл). Крестик
// прячет до конца сессии (флаг живёт в контексте, плашка вернётся при перезаходе).
function UpdateToast() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)', zIndex: 60 }}
    >
      <div
        className="flex items-center gap-2.5 pl-4 pr-2 py-2 update-toast-in"
        style={{ background: '#111827', borderRadius: 16, boxShadow: '0 8px 28px rgba(0,0,0,0.28)' }}
      >
        <span className="text-base">✨</span>
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#FFFFFF' }}>Доступно обновление</span>
        <button
          onClick={() => window.location.reload()}
          className="text-[11px] font-black uppercase tracking-wide px-3 py-1.5"
          style={{ background: '#C9A800', color: '#FFFFFF', borderRadius: 16 }}
        >
          Обновить
        </button>
        <button onClick={() => setHidden(true)} className="text-sm px-1.5" style={{ color: 'rgba(255,255,255,0.55)' }} aria-label="Закрыть">✕</button>
      </div>
    </div>
  )
}

function AppShell() {
  const live = useLiveData()

  const [tab, setTab] = useState('home')
  const [worldcupSub, setWorldcupSub] = useState('groups')
  // Nonce: инкрементится при переходе «Всё расписание → плей-офф», чтобы Schedule
  // каждый раз заново проматывал список к первому матчу плей-офф.
  const [scheduleFocusNonce, setScheduleFocusNonce] = useState(0)

  // ── Splash / readiness ───────────────────────────────────────────────
  const inTg = !!window.Telegram?.WebApp?.initData
  const [hidingSplash, setHidingSplash] = useState(false)
  const [entered, setEntered] = useState(false)
  const [visit, setVisit] = useState(null)
  // Очки за зачёт, случившийся ПОКА приложение открыто (живой попап). Раньше в
  // этот момент был только салют — попап показывался лишь при следующем заходе.
  const [livePoints, setLivePoints] = useState(null)
  const [showAnnounce, setShowAnnounce] = useState(() => {
    try { return !localStorage.getItem(ANNOUNCE_KEY) } catch { return false }
  })
  const [showScoring, setShowScoring] = useState(() => {
    try { return !localStorage.getItem(SCORING_KEY) } catch { return false }
  })
  // Сцену показа мест закрыли в этой сессии (по «Далее») — до следующего входа
  // не показываем повторно. Храним stage, чтобы новая стадия (бронза→чемпион)
  // всё равно показалась.
  const [revealDismissed, setRevealDismissed] = useState(null)
  const enteredRef = useRef(false)
  const mountedAt = useRef(Date.now())

  // Тянем /api/me + засчитанные прогнозы один раз, считаем итоги визита.
  useEffect(() => {
    if (!inTg) return
    let cancelled = false
    ;(async () => {
      try {
        const headers = { 'x-telegram-init-data': window.Telegram.WebApp.initData }
        const me = await fetch(API + '/api/me', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        const settled = me?.userId
          ? await fetch(API + `/api/predictions/${me.userId}`, { headers })
              .then((r) => (r.ok ? r.json() : null)).catch(() => null)
          : null
        if (cancelled) return
        if (me) setVisit(computeVisitSummary(me, Array.isArray(settled) ? settled : []))
      } catch { /* бэкенд спит или недоступен — визит просто не показываем */ }
    })()
    return () => { cancelled = true }
  }, [inTg])

  function reveal() {
    if (enteredRef.current) return
    enteredRef.current = true
    setHidingSplash(true)                       // запускаем fade сплэша
    setTimeout(() => setEntered(true), 450)      // длительность совпадает с CSS transition
  }

  // Готовность: загружена статика с результатами, но не быстрее MIN. На Render
  // (/api/me, /api/live) вход НЕ завязан — на free-плане он спит и будится ~50 с;
  // его ответы догоняют уже открытое приложение. Попап итогов визита реактивен
  // (showVisit ниже), поэтому спокойно появляется позже, когда /api/me ответит.
  const dataReady = live.ready
  useEffect(() => {
    if (!dataReady) return
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - mountedAt.current))
    const t = setTimeout(reveal, wait)
    return () => clearTimeout(t)
  }, [dataReady])

  // Фолбэк по максимуму — на случай холодного/зависшего бэкенда.
  useEffect(() => {
    const t = setTimeout(reveal, SPLASH_MAX_MS)
    return () => clearTimeout(t)
  }, [])

  function handleTab(t) {
    if (typeof t === 'string' && t.includes('.')) {
      // Формат: 'worldcup.schedule' либо 'worldcup.schedule.knockout' (фокус на плей-офф)
      const [main, sub, focus] = t.split('.')
      setTab(main)
      if (main === 'worldcup') {
        setWorldcupSub(sub)
        if (focus === 'knockout') setScheduleFocusNonce((n) => n + 1)
      }
    } else {
      setTab(t)
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg?.BackButton) return
    const handleBack = () => setTab('home')
    if (tab === 'home') {
      tg.BackButton.hide()
    } else {
      tg.BackButton.show()
      tg.BackButton.onClick(handleBack)
    }
    return () => tg.BackButton.offClick(handleBack)
  }, [tab])

  const pages = {
    home:        <Home onTab={handleTab} />,
    play:        <PlayPage />,
    worldcup:    <WorldCup initialSub={worldcupSub} onSubChange={setWorldcupSub} scheduleFocusNonce={scheduleFocusNonce} />,
    history:     <History />,
    leaderboard: <Leaderboard />,
  }

  const handleCloseAnnounce = () => {
    try { localStorage.setItem(ANNOUNCE_KEY, '1') } catch { /* приватный режим */ }
    setShowAnnounce(false)
  }

  // Активная сцена показа мест (или null). Пересчитывается на каждом обновлении
  // live-данных → при live-финише матча появляется сама; при холодном входе,
  // пока сцена «свежая» (сутки), показывается снова (реплей).
  const revealDesc = computeReveal(live.matches)
  const showReveal = entered && !!revealDesc && revealDismissed !== revealDesc.stage

  // «Далее» в сцене: закрываем её на сессию и, один раз, показываем личный попап
  // очков за прогноз на этот матч (если прогноз был и уже засчитан).
  async function handleRevealNext() {
    const desc = revealDesc
    setRevealDismissed(desc?.stage || 'closed')
    if (!inTg || !desc?.matchId || !desc?.stage) return
    const key = `wc2026_placePts_${desc.stage}`
    try { if (localStorage.getItem(key)) return } catch { /* приватный режим */ }
    try {
      const headers = { 'x-telegram-init-data': window.Telegram.WebApp.initData }
      const me = await fetch(API + '/api/me', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      if (!me?.userId) return
      const preds = await fetch(API + `/api/predictions/${me.userId}`, { headers })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null)
      const rows = (Array.isArray(preds) ? preds : []).filter((p) => String(p.matchId) === desc.matchId)
      if (rows.length === 0) return // ещё не засчитано / прогноза не было — не ставим флаг, покажем позже
      setLivePoints({
        count: rows.length,
        ptsGained: rows.reduce((s, p) => s + (p.pts || 0), 0),
        exactCount: rows.filter((p) => p.pts >= 3).length,
      })
      try { localStorage.setItem(key, '1') } catch { /* noop */ }
    } catch { /* noop */ }
  }

  // Приоритет попапов после входа (строго по одному, не внахлёст). Сцена показа
  // мест — верхний приоритет; остальные ждут её закрытия.
  // 1) сцена мест → 2) разъяснение m83 → 3) итоги визита → 4) схема очков.
  const showAnnouncement = entered && !showReveal && showAnnounce
  // Пока сцена мест доступна (турнир на финише), «итоги визита» не показываем —
  // сцена и попап очков заменяют собой обычный recap, чтобы не двоить очки.
  const showVisit = entered && !showReveal && !revealDesc && !showAnnouncement && visit
  // Схема очков — разово, с запуском плей-офф. Ждём закрытия предыдущих окон.
  const showScoringModal = entered && !showReveal && !showAnnouncement && !showVisit && showScoring && knockoutEnabled()

  const handleCloseScoring = () => {
    try { localStorage.setItem(SCORING_KEY, '1') } catch { /* приватный режим */ }
    setShowScoring(false)
  }

  return (
    <>
      <SaluteWatcher onFreshPoints={setLivePoints} />
      <div className="relative min-h-screen" style={{ background: '#F5F6FA' }}>
        <div className="tab-transition">
          {pages[tab] ?? pages.home}
        </div>
        <BottomNav active={tab} onTab={handleTab} />

        {/* Разовое уведомление об исправлении счёта матча m83 (Португалия—Хорватия) */}
        {showAnnouncement && <AnnouncementModal onClose={handleCloseAnnounce} />}

        {/* Итоги визита — что изменилось с прошлого раза */}
        {showVisit && <VisitSummary summary={visit} onClose={() => setVisit(null)} />}

        {/* Схема начисления очков (после закрытия итогов визита) */}
        {showScoringModal && <ScoringModal onClose={handleCloseScoring} />}

        {/* Живой зачёт очков, пока приложение открыто (попап + салют от SaluteWatcher).
            За сценой мест не показываем — там очки идут по «Далее». */}
        {entered && !showReveal && livePoints && <PointsPopup summary={livePoints} onClose={() => setLivePoints(null)} />}

        {/* Сценарий показа финальных мест (осыпающиеся частицы) — верхний слой */}
        {showReveal && (
          <StandingsReveal variant={revealDesc.variant} rows={revealDesc.rows} onNext={handleRevealNext} />
        )}

        {/* Мягкая плашка обновления — когда задеплоена новая сборка */}
        {entered && live.updateAvailable && <UpdateToast />}
      </div>

      {!entered && <Splash hiding={hidingSplash} />}
    </>
  )
}

export default function App() {
  return (
    <LiveDataProvider>
      <AppShell />
    </LiveDataProvider>
  )
}

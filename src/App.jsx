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
import { knockoutEnabled } from './data.js'
import { LiveDataProvider, useLiveData } from './LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

const LAST_VISIT_KEY = 'wc2026_lastVisit' // снимок {rank, pts, settledIds} прошлого визита
// Разовый попап-разъяснение про исправление счёта матча m65 (Египет—Иран, 1:2→1:1)
const ANNOUNCE_KEY = 'wc2026_announce_m65_score_fix'
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

  // ── Splash / readiness ───────────────────────────────────────────────
  const inTg = !!window.Telegram?.WebApp?.initData
  const [meDone, setMeDone] = useState(!inTg) // вне Telegram /api/me не ждём
  const [hidingSplash, setHidingSplash] = useState(false)
  const [entered, setEntered] = useState(false)
  const [visit, setVisit] = useState(null)
  const [showAnnounce, setShowAnnounce] = useState(() => {
    try { return !localStorage.getItem(ANNOUNCE_KEY) } catch { return false }
  })
  const [showScoring, setShowScoring] = useState(() => {
    try { return !localStorage.getItem(SCORING_KEY) } catch { return false }
  })
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
      } finally {
        if (!cancelled) setMeDone(true)
      }
    })()
    return () => { cancelled = true }
  }, [inTg])

  function reveal() {
    if (enteredRef.current) return
    enteredRef.current = true
    setHidingSplash(true)                       // запускаем fade сплэша
    setTimeout(() => setEntered(true), 450)      // длительность совпадает с CSS transition
  }

  // Готовность: первая загрузка live-данных + резолв /api/me, но не быстрее MIN.
  const dataReady = live.ready && meDone
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
      const [main, sub] = t.split('.')
      setTab(main)
      if (main === 'worldcup') setWorldcupSub(sub)
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
    worldcup:    <WorldCup initialSub={worldcupSub} onSubChange={setWorldcupSub} />,
    history:     <History />,
    leaderboard: <Leaderboard />,
  }

  const handleCloseAnnounce = () => {
    try { localStorage.setItem(ANNOUNCE_KEY, '1') } catch { /* приватный режим */ }
    setShowAnnounce(false)
  }

  // Приоритет попапов после входа (строго по одному, не внахлёст):
  // 1) разъяснение про исправление счёта m65 → 2) итоги визита → 3) схема очков.
  const showAnnouncement = entered && showAnnounce
  const showVisit = entered && !showAnnouncement && visit
  // Схема очков — разово, с запуском плей-офф. Ждём закрытия предыдущих окон.
  const showScoringModal = entered && !showAnnouncement && !showVisit && showScoring && knockoutEnabled()

  const handleCloseScoring = () => {
    try { localStorage.setItem(SCORING_KEY, '1') } catch { /* приватный режим */ }
    setShowScoring(false)
  }

  return (
    <>
      <SaluteWatcher />
      <div className="relative min-h-screen" style={{ background: '#F5F6FA' }}>
        <div className="tab-transition">
          {pages[tab] ?? pages.home}
        </div>
        <BottomNav active={tab} onTab={handleTab} />

        {/* Разовое уведомление об исправлении счёта матча m65 (Египет—Иран) */}
        {showAnnouncement && <AnnouncementModal onClose={handleCloseAnnounce} />}

        {/* Итоги визита — что изменилось с прошлого раза */}
        {showVisit && <VisitSummary summary={visit} onClose={() => setVisit(null)} />}

        {/* Схема начисления очков (после закрытия итогов визита) */}
        {showScoringModal && <ScoringModal onClose={handleCloseScoring} />}

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

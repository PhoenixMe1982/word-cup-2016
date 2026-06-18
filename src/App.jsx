import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import WorldCup from './pages/WorldCup.jsx'
import PlayPage from './pages/PlayPage.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import BottomNav from './components/BottomNav.jsx'
import PredictionPanel from './components/PredictionPanel.jsx'
import SaluteWatcher from './components/SaluteWatcher.jsx'
import Splash from './components/Splash.jsx'
import VisitSummary from './components/VisitSummary.jsx'
import { LiveDataProvider, useLiveData } from './LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

const SEEN_KEY = 'wc2026_predictionSeen'
const LAST_VISIT_KEY = 'wc2026_lastVisit' // снимок {rank, pts, settledIds} прошлого визита

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

function AppShell() {
  const live = useLiveData()

  const [tab, setTab] = useState('home')
  const [worldcupSub, setWorldcupSub] = useState('groups')
  const [showPredictionModal, setShowPredictionModal] = useState(
    () => !localStorage.getItem(SEEN_KEY)
  )

  // ── Splash / readiness ───────────────────────────────────────────────
  const inTg = !!window.Telegram?.WebApp?.initData
  const [meDone, setMeDone] = useState(!inTg) // вне Telegram /api/me не ждём
  const [hidingSplash, setHidingSplash] = useState(false)
  const [entered, setEntered] = useState(false)
  const [visit, setVisit] = useState(null)
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

  const handleClosePredictionModal = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setShowPredictionModal(false)
  }

  const pages = {
    home:        <Home onTab={handleTab} />,
    play:        <PlayPage />,
    worldcup:    <WorldCup initialSub={worldcupSub} onSubChange={setWorldcupSub} />,
    history:     <History />,
    leaderboard: <Leaderboard />,
  }

  // Попап итогов визита показываем первым делом после входа (если есть что показать),
  // и только потом — первичный модал прогноза, чтобы не накладывались.
  const showVisit = entered && visit
  const showPrediction = entered && !showVisit && showPredictionModal

  return (
    <>
      <SaluteWatcher />
      <div className="relative min-h-screen" style={{ background: '#F5F6FA' }}>
        <div className="tab-transition">
          {pages[tab] ?? pages.home}
        </div>
        <BottomNav active={tab} onTab={handleTab} />

        {/* Итоги визита — что изменилось с прошлого раза */}
        {showVisit && <VisitSummary summary={visit} onClose={() => setVisit(null)} />}

        {/* First-visit prediction modal */}
        {showPrediction && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClosePredictionModal() }}
          >
            <div
              className="w-full max-w-[480px] overflow-y-auto"
              style={{
                background: '#F5F6FA',
                borderRadius: '16px 16px 0 0',
                maxHeight: '90vh',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
              </div>
              <div className="px-4 pb-6">
                <PredictionPanel onClose={handleClosePredictionModal} />
              </div>
            </div>
          </div>
        )}
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

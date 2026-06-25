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
import { KnockoutTutorial, knockoutTutorialDismissed } from './components/KnockoutScoring.jsx'
import { knockoutEnabled } from './data.js'
import { LiveDataProvider, useLiveData } from './LiveDataContext.jsx'

const API = (import.meta.env.VITE_API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

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

  const pages = {
    home:        <Home onTab={handleTab} />,
    play:        <PlayPage />,
    worldcup:    <WorldCup initialSub={worldcupSub} onSubChange={setWorldcupSub} />,
    history:     <History />,
    leaderboard: <Leaderboard />,
  }

  // После входа показываем итоги визита (что изменилось с прошлого раза).
  const showVisit = entered && visit

  // Туториал плей-офф: при включённой фиче показываем при каждом входе, пока
  // пользователь не нажмёт «Не показывать снова» (флаг в localStorage). Ждём
  // закрытия итогов визита, чтобы окна не накладывались.
  const [koTutorial, setKoTutorial] = useState(false)
  useEffect(() => {
    if (entered && knockoutEnabled() && !knockoutTutorialDismissed()) setKoTutorial(true)
  }, [entered])

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

        {/* Туториал плей-офф (после закрытия итогов визита) */}
        <KnockoutTutorial open={koTutorial && !showVisit} onClose={() => setKoTutorial(false)} />
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

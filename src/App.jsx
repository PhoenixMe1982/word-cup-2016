import { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'
import WorldCup from './pages/WorldCup.jsx'
import PlayPage from './pages/PlayPage.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import BottomNav from './components/BottomNav.jsx'
import PredictionPanel from './components/PredictionPanel.jsx'
import SaluteWatcher from './components/SaluteWatcher.jsx'
import { LiveDataProvider } from './LiveDataContext.jsx'

const SEEN_KEY = 'wc2026_predictionSeen'

export default function App() {
  const [tab, setTab] = useState('home')
  const [worldcupSub, setWorldcupSub] = useState('groups')
  const [showPredictionModal, setShowPredictionModal] = useState(
    () => !localStorage.getItem(SEEN_KEY)
  )

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
    worldcup:   <WorldCup initialSub={worldcupSub} onSubChange={setWorldcupSub} />,
    history:    <History />,
    leaderboard: <Leaderboard />,
  }

  return (
    <LiveDataProvider>
      <SaluteWatcher />
      <div className="relative min-h-screen" style={{ background: '#F5F6FA' }}>
        <div className="tab-transition">
          {pages[tab] ?? pages.home}
        </div>
        <BottomNav active={tab} onTab={handleTab} />

        {/* First-visit prediction modal */}
        {showPredictionModal && (
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
    </LiveDataProvider>
  )
}

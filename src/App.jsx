import { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import Schedule from './pages/Schedule.jsx'
import Scorers from './pages/Scorers.jsx'
import Goalkeepers from './pages/Goalkeepers.jsx'
import Groups from './pages/Groups.jsx'
import History from './pages/History.jsx'
import Insider from './pages/Insider.jsx'
import Teams from './pages/Teams.jsx'
import BottomNav from './components/BottomNav.jsx'
import { LiveDataProvider } from './LiveDataContext.jsx'

export default function App() {
  const [tab, setTab] = useState('home')

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
    home: <Home onTab={setTab} />,
    schedule: <Schedule />,
    teams: <Teams />,
    scorers: <Scorers />,
    goalkeepers: <Goalkeepers />,
    groups: <Groups />,
    history: <History />,
    insider: <Insider />,
  }

  return (
    <LiveDataProvider>
      <div className="relative min-h-screen" style={{ background: '#080c15' }}>
        <div className="tab-transition">
          {pages[tab]}
        </div>
        <BottomNav active={tab} onTab={setTab} />
      </div>
    </LiveDataProvider>
  )
}

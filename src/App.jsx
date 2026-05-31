import { useState } from 'react'
import Home from './pages/Home.jsx'
import Schedule from './pages/Schedule.jsx'
import Scorers from './pages/Scorers.jsx'
import Goalkeepers from './pages/Goalkeepers.jsx'
import Groups from './pages/Groups.jsx'
import History from './pages/History.jsx'
import Insider from './pages/Insider.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  const [tab, setTab] = useState('home')

  const pages = {
    home: <Home onTab={setTab} />,
    schedule: <Schedule />,
    scorers: <Scorers />,
    goalkeepers: <Goalkeepers />,
    groups: <Groups />,
    history: <History />,
    insider: <Insider />,
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#06080f' }}>
      <div className="tab-transition">
        {pages[tab]}
      </div>
      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}

import { useState } from 'react'
import Groups from './Groups.jsx'
import Scorers from './Scorers.jsx'
import Goalkeepers from './Goalkeepers.jsx'
import Teams from './Teams.jsx'
import AllTimeScorers from './AllTimeScorers.jsx'

const SUB_TABS = [
  { id: 'groups',      label: 'Группы'     },
  { id: 'scorers',     label: 'Бомбардиры' },
  { id: 'goalkeepers', label: 'Вратари'    },
  { id: 'teams',       label: 'Сборные'    },
  { id: 'records',     label: 'Рекорды'    },
]

export default function WorldCup() {
  const [sub, setSub] = useState('groups')

  const content = {
    groups:      <Groups />,
    scorers:     <Scorers />,
    goalkeepers: <Goalkeepers />,
    teams:       <Teams />,
    records:     <AllTimeScorers />,
  }

  return (
    <div>
      {/* Sticky sub-nav */}
      <div
        className="sticky top-0 z-10"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="px-4 pt-12 pb-0 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Чемпионат мира</h1>
          </div>
          <div className="text-4xl mb-1">🌐</div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-2 mt-2" style={{ scrollbarWidth: 'none' }}>
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className="flex-shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-wide relative whitespace-nowrap"
              style={{ color: sub === t.id ? '#C9A800' : '#9CA3AF' }}
            >
              {t.label}
              {sub === t.id && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-t-full"
                  style={{ width: '70%', background: '#C9A800' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {content[sub]}
    </div>
  )
}

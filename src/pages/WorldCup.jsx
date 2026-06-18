import { useState, useEffect } from 'react'
import { HEADER_BANNER_STYLE } from '../data.js'
import Groups from './Groups.jsx'
import Scorers from './Scorers.jsx'
import Goalkeepers from './Goalkeepers.jsx'
import Teams from './Teams.jsx'
import AllTimeScorers from './AllTimeScorers.jsx'
import Schedule from './Schedule.jsx'

const SUB_TABS = [
  { id: 'groups',      label: 'Группы'     },
  { id: 'scorers',     label: 'Бомбардиры' },
  { id: 'goalkeepers', label: 'Вратари'    },
  { id: 'teams',       label: 'Сборные'    },
  { id: 'records',     label: 'Рекорды'    },
  { id: 'schedule',    label: 'Матчи'      },
]

export default function WorldCup({ initialSub = 'groups', onSubChange }) {
  const [sub, setSub] = useState(initialSub)

  useEffect(() => {
    setSub(initialSub)
  }, [initialSub])

  function handleSub(id) {
    setSub(id)
    onSubChange?.(id)
  }

  const content = {
    groups:      <Groups />,
    scorers:     <Scorers />,
    goalkeepers: <Goalkeepers />,
    teams:       <Teams />,
    records:     <AllTimeScorers />,
    schedule:    <Schedule embedded />,
  }

  return (
    <div>
      {/* Sticky sub-nav */}
      <div
        className="sticky top-0 z-10"
        style={{ ...HEADER_BANNER_STYLE, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="px-4 pt-12 pb-0 flex items-end justify-between">
          <div className="max-w-[50%]">
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>СТАТИСТИКА</h1>
          </div>
          <div className="text-4xl mb-1">🌐</div>
        </div>
        {/* Каждый подтаб — свой блок, чтобы читался и на белой, и на чёрной части
            хедера. Активный — жёлтый с белым текстом, остальные — белые с чёрным. */}
        <div className="flex overflow-x-auto no-scrollbar px-3 pt-2 pb-3 gap-2" style={{ scrollbarWidth: 'none' }}>
          {SUB_TABS.map((t) => {
            const active = sub === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleSub(t.id)}
                className="flex-shrink-0 px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                style={{
                  background: active ? '#C9A800' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#111827',
                  border: active ? 'none' : '1px solid rgba(0,0,0,0.10)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {content[sub]}
    </div>
  )
}

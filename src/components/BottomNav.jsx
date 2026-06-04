const TABS = [
  { id: 'home',        icon: '🏠', label: 'Главная'   },
  { id: 'play',        icon: '🎯', label: 'Играть'    },
  { id: 'schedule',    icon: '📅', label: 'Матчи'     },
  { id: 'worldcup',   icon: '🌐', label: 'ЧМ'        },
  { id: 'history',    icon: '📚', label: 'История'   },
  { id: 'leaderboard',icon: '🏅', label: 'Лидерборд' },
]

export default function BottomNav({ active, onTab }) {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex">
        {TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 relative"
              style={{ minHeight: 56 }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full"
                  style={{ width: '50%', background: '#C9A800' }}
                />
              )}
              <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100 opacity-50'}`}>
                {t.icon}
              </span>
              <span
                className="text-[9px] font-semibold"
                style={{ color: isActive ? '#C9A800' : '#9CA3AF' }}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

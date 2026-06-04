const TABS = [
  { id: 'home',           icon: '🏠', label: 'Главная' },
  { id: 'schedule',       icon: '📅', label: 'Матчи' },
  { id: 'teams',          icon: '🌍', label: 'Сборные' },
  { id: 'scorers',        icon: '⚽', label: 'Бомб.' },
  { id: 'goalkeepers',    icon: '🧤', label: 'Вратари' },
  { id: 'groups',         icon: '🏟️', label: 'Группы' },
  { id: 'history',        icon: '🏆', label: 'История' },
  { id: 'alltimescorers', icon: '🏅', label: 'Рекорды' },
  { id: 'prediction',     icon: '🔮', label: 'Прогноз' },
]

export default function BottomNav({ active, onTab }) {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex overflow-x-auto no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className="flex-shrink-0 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 relative"
              style={{ minHeight: 56, minWidth: 52 }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full"
                  style={{ width: '60%', background: '#C9A800' }}
                />
              )}
              <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100 opacity-60'}`}>
                {t.icon}
              </span>
              <span
                className="text-[9px] font-medium truncate px-0.5"
                style={{ color: isActive ? '#C9A800' : '#9CA3AF', maxWidth: 52 }}
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

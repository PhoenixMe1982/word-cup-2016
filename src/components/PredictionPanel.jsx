import { useState } from 'react'
import { TEAMS } from '../data.js'

const POSITIONS = [
  { key: 'p1', medal: '🥇', label: '1 место — Чемпион', color: '#C9A800' },
  { key: 'p2', medal: '🥈', label: '2 место — Финалист', color: '#909090' },
  { key: 'p3', medal: '🥉', label: '3 место', color: '#CD7F32' },
  { key: 'p4', medal: '4️⃣', label: '4 место', color: '#6B7280' },
]

const STORAGE_KEY = 'wc2026_prediction'

const APP_URL = 'https://phoenixme1982.github.io/word-cup-2016/'

function sharePrediction(picks) {
  const lines = POSITIONS.map(({ key, medal }) => {
    const team = TEAMS[picks[key]]
    return `${medal} ${team?.flag || ''} ${team?.name || ''}`
  })
  const text = `🏆 Мой прогноз на ЧМ 2026:\n${lines.join('\n')}\n\n#ЧМ2026 #WC2026 #FIFAWorldCup`

  const tg = window.Telegram?.WebApp
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(text)}`
    )
    return
  }
  if (navigator.share) {
    navigator.share({ text, url: APP_URL, title: 'ЧМ 2026 — Мой прогноз' }).catch(() => {})
    return
  }
  navigator.clipboard?.writeText(`${text}\n\n${APP_URL}`)
}

export default function PredictionPanel({ onClose, asPage = false }) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const initial = stored ? JSON.parse(stored) : { p1: null, p2: null, p3: null, p4: null }

  const [picks, setPicks] = useState(initial)
  const [activePicker, setActivePicker] = useState(null)
  const [search, setSearch] = useState('')
  const [shared, setShared] = useState(false)

  const selectedCodes = Object.entries(picks)
    .filter(([k]) => k !== activePicker)
    .map(([, v]) => v)
    .filter(Boolean)

  const allPicked = POSITIONS.every(({ key }) => picks[key])

  const handlePick = (posKey, teamCode) => {
    const newPicks = { ...picks, [posKey]: teamCode }
    setPicks(newPicks)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPicks))
    setActivePicker(null)
    setSearch('')
  }

  const handleShare = () => {
    sharePrediction(picks)
    setShared(true)
    setTimeout(() => setShared(false), 3000)
  }

  const handleReset = () => {
    const empty = { p1: null, p2: null, p3: null, p4: null }
    setPicks(empty)
    localStorage.removeItem(STORAGE_KEY)
    setActivePicker(null)
    setSearch('')
    setShared(false)
  }

  const availableTeams = Object.entries(TEAMS)
    .filter(([code]) => !selectedCodes.includes(code))
    .filter(([, t]) =>
      search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a[1].name.localeCompare(b[1].name, 'ru'))

  return (
    <div className={asPage ? 'page-content px-4 pb-8' : ''}>
      {/* Page header (only in page mode) */}
      {asPage && (
        <div
          className="-mx-4 px-4 pt-12 pb-5 mb-4"
          style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
              <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Прогноз</h1>
              <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Топ-4 по вашей версии</p>
            </div>
            <div className="text-5xl trophy-glow">🔮</div>
          </div>
        </div>
      )}

      {/* Modal header */}
      {!asPage && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: '#111827' }}>Ваш прогноз</h2>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Кто возьмёт трофей?</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-sm"
              style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 3, color: '#6B7280' }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Trophy hero */}
      <div
        className="flex items-center gap-4 p-4 mb-4"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(201,168,0,0.2)',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(201,168,0,0.08)',
        }}
      >
        <div className="text-5xl trophy-glow">🏆</div>
        <div>
          <div className="text-base font-black uppercase" style={{ color: '#111827' }}>FIFA World Cup</div>
          <div className="text-sm font-black" style={{ color: '#C9A800' }}>2026™</div>
          <div className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            {allPicked ? 'Прогноз готов!' : `Выбрано ${Object.values(picks).filter(Boolean).length} из 4`}
          </div>
        </div>
      </div>

      {/* Position slots */}
      <div className="space-y-2 mb-4">
        {POSITIONS.map(({ key, medal, label, color }) => {
          const team = TEAMS[picks[key]]
          const isActive = activePicker === key

          return (
            <div key={key}>
              <button
                onClick={() => {
                  setActivePicker(isActive ? null : key)
                  setSearch('')
                }}
                className="w-full flex items-center gap-3 p-3 transition-all duration-150"
                style={{
                  background: '#FFFFFF',
                  border: isActive ? `2px solid ${color}` : `1px solid ${team ? color + '40' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 3,
                  boxShadow: isActive ? `0 2px 12px ${color}30` : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <span className="text-2xl flex-shrink-0">{medal}</span>
                {team ? (
                  <>
                    <span className="text-xl flex-shrink-0">{team.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-black uppercase" style={{ color: '#111827' }}>{team.name}</div>
                      <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Группа {team.group}</div>
                    </div>
                    <div
                      className="text-[9px] font-black px-1.5 py-0.5 flex-shrink-0"
                      style={{ background: color + '20', color, borderRadius: 2 }}
                    >
                      {isActive ? 'ИЗМЕНИТЬ' : '✓'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-left">
                      <div className="text-sm" style={{ color: '#9CA3AF' }}>{label}</div>
                      <div className="text-[10px]" style={{ color: '#C0C7D0' }}>Нажмите для выбора</div>
                    </div>
                    <div className="text-[10px]" style={{ color: '#C9A800' }}>▼</div>
                  </>
                )}
              </button>

              {/* Inline team picker */}
              {isActive && (
                <div
                  className="mt-1 overflow-hidden"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${color}40`,
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Search */}
                  <div className="p-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Найти команду..."
                      autoFocus
                      className="w-full text-sm outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 2,
                        padding: '7px 10px',
                        color: '#111827',
                      }}
                    />
                  </div>
                  {/* Team list */}
                  <div className="overflow-y-auto" style={{ maxHeight: 210 }}>
                    {availableTeams.map(([code, team]) => (
                      <button
                        key={code}
                        onClick={() => handlePick(key, code)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          background: picks[key] === code ? color + '15' : 'transparent',
                        }}
                      >
                        <span className="text-xl flex-shrink-0">{team.flag}</span>
                        <span className="flex-1 text-sm font-semibold" style={{ color: '#111827' }}>{team.name}</span>
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 flex-shrink-0"
                          style={{ background: 'rgba(0,0,0,0.06)', color: '#9CA3AF', borderRadius: 2 }}
                        >
                          Гр.{team.group}
                        </span>
                      </button>
                    ))}
                    {availableTeams.length === 0 && (
                      <div className="py-4 text-center text-xs" style={{ color: '#9CA3AF' }}>Не найдено</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Share button */}
      {allPicked ? (
        <div className="space-y-2">
          <button
            onClick={handleShare}
            className="w-full py-4 text-base font-black uppercase tracking-widest transition-all duration-300"
            style={{
              background: shared
                ? 'linear-gradient(135deg, #16A34A, #22c55e)'
                : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#FFFFFF',
              borderRadius: 3,
              boxShadow: shared
                ? '0 4px 20px rgba(22,163,74,0.4)'
                : '0 4px 20px rgba(59,130,246,0.4)',
            }}
          >
            {shared ? '✓ Прогноз отправлен!' : '📤 Поделиться прогнозом'}
          </button>
          <button
            onClick={handleReset}
            className="w-full py-2 text-xs font-bold uppercase tracking-wide"
            style={{ color: '#9CA3AF' }}
          >
            Сбросить и начать заново
          </button>
        </div>
      ) : (
        <div
          className="py-3 text-center text-xs uppercase tracking-wider"
          style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 3, color: '#9CA3AF' }}
        >
          Выберите все 4 позиции — появится кнопка шеринга
        </div>
      )}
    </div>
  )
}

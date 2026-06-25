// Схема начисления очков в плей-офф — единый источник для легенды на странице
// прогнозов и для туториал-попапа (этап 2). Веса финальны (2026-06-24).
import { useState } from 'react'

const GREEN = '#16A34A', GOLD = '#C9A800', BLUE = '#2563EB'

const KO_ROWS = [
  { pts: '+3', color: GREEN, label: 'Точный счёт в основное время (90′)' },
  { pts: '+1', color: GOLD,  label: 'Верный исход 90′ (ничья тоже считается)' },
  { pts: '+2', color: GREEN, label: 'Точный счёт в доп. время (120′)' },
  { pts: '+1', color: GOLD,  label: 'Верный исход доп. времени' },
  { pts: '+1', color: GOLD,  label: 'Угадан победитель серии пенальти' },
  { pts: '+1', color: BLUE,  label: 'Угадан, кто прошёл дальше' },
]

const TUTORIAL_DISMISS_KEY = 'wc2026_knockoutTutorialDismissed'

function ScoringRows() {
  return (
    <div className="flex flex-col gap-1.5">
      {KO_ROWS.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
          <span className="text-sm font-black flex-shrink-0 w-7 text-center" style={{ color: r.color }}>{r.pts}</span>
          <span className="text-[11px] leading-tight" style={{ color: '#374151' }}>{r.label}</span>
        </div>
      ))}
    </div>
  )
}

// Компактная легенда под списком матчей плей-офф.
export function KnockoutLegend() {
  return (
    <div className="p-3 rounded-2xl" style={{ background: 'rgba(201,168,0,0.06)', border: '1px solid rgba(201,168,0,0.2)' }}>
      <div className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: '#C9A800' }}>🏆 Очки в плей-офф</div>
      <ScoringRows />
      <div className="text-[9px] mt-2 leading-snug" style={{ color: '#9CA3AF' }}>
        Очки за стадии суммируются. На каждой стадии — большее из «точный счёт / исход». Поля доп. времени и пенальти открываются, только если в твоём прогнозе ничья.
      </div>
    </div>
  )
}

// Туториал-попап со схемой очков. Показывается ПЕРЕД стадией при каждом входе,
// пока пользователь не нажмёт «Не показывать снова» (флаг в localStorage —
// per-device). Видимостью управляет родитель (App) через prop `open`.
export function KnockoutTutorial({ open, onClose }) {
  const [dontShow, setDontShow] = useState(false)
  if (!open) return null

  function close() {
    if (dontShow) {
      try { localStorage.setItem(TUTORIAL_DISMISS_KEY, '1') } catch { /* приватный режим */ }
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-5 pb-7"
        style={{ background: '#FFFFFF', boxShadow: '0 -8px 32px rgba(0,0,0,0.25)', animation: 'koSlideUp 0.28s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(0,0,0,0.15)' }} />
        <h2 className="text-lg font-black uppercase tracking-wide mb-1" style={{ color: '#111827' }}>🏆 Начался плей-офф!</h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
          Прогнозы на стадии на выбывание считаются иначе — со стеком очков по этапам матча:
        </p>
        <ScoringRows />
        <div className="text-[10px] mt-3 mb-4 leading-snug" style={{ color: '#9CA3AF' }}>
          Сначала ставишь счёт на 90 минут. Если у тебя ничья — откроется счёт на доп. время, а при новой ничьей — выбор, кто пройдёт по пенальти. Очки за пройденные стадии суммируются.
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="w-4 h-4" style={{ accentColor: '#C9A800' }} />
          <span className="text-xs" style={{ color: '#6B7280' }}>Не показывать снова</span>
        </label>

        <button
          onClick={close}
          className="w-full h-11 rounded-2xl text-sm font-black uppercase tracking-wide"
          style={{ background: '#C9A800', color: '#fff' }}
        >
          Понятно, играем
        </button>
      </div>
      <style>{`@keyframes koSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}

export function knockoutTutorialDismissed() {
  try { return localStorage.getItem(TUTORIAL_DISMISS_KEY) === '1' } catch { return false }
}

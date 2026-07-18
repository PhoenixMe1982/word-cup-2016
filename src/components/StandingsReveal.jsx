import { useEffect, useRef, useState } from 'react'
import { startFallingParticles } from '../salute.js'

// Полноэкранный сценарий «показ финальных мест». Затемняет экран и по одной
// проявляет команды-призёры (fade + сдвиг вверх) под поток осыпающихся частиц.
// Два варианта:
//   'bronze'   — матч за 3-е место сыгран: строки 4→3 (проявляются сверху вниз);
//   'champion' — финал сыгран: строки 1..4 (проявляются СНИЗУ ВВЕРХ, кульминация
//                — 1-е место с плашкой «ЧЕМПИОН», крупным шрифтом и флагом).
//
// rows приходят в порядке отображения СВЕРХУ ВНИЗ:
//   bronze:   [{rank:3,...}, {rank:4,...}]
//   champion: [{rank:1,...}, {rank:2,...}, {rank:3,...}, {rank:4,...}]
// Проявление всегда идёт СНИЗУ ВВЕРХ (худшее место первым), поэтому в обоих
// вариантах нижняя строка всплывает раньше верхней.
//
// Кнопка «Далее» доступна СРАЗУ — можно скипнуть показ, не дожидаясь конца.
// Частицы после проявления последней строки крутятся ещё HOLD_MS, затем гаснут.
//
// Слои (снизу вверх): затемнение → canvas частиц → строки + кнопка.

const START_DELAY = 450   // пауза после начала затемнения перед первой строкой
const STAGGER = 950       // интервал между появлением строк
const HOLD_MS = 5000      // сколько частицы «висят» после последней строки

// Цвет цифры места + оформление плашки.
const RANK_META = {
  1: { num: '#B8860B', chip: 'linear-gradient(135deg,#FFF7D6,#FFE39A)', border: 'rgba(201,168,0,0.60)' },
  2: { num: '#7C828C', chip: '#FFFFFF', border: 'rgba(124,130,140,0.32)' }, // серебро
  3: { num: '#C1712B', chip: '#FFFFFF', border: 'rgba(193,113,43,0.32)' }, // бронза
  4: { num: '#111827', chip: '#FFFFFF', border: 'rgba(0,0,0,0.08)' },      // тёмная «4»
}

export default function StandingsReveal({ variant, rows, onNext }) {
  const canvasRef = useRef(null)
  const partRef = useRef(null)
  const [shown, setShown] = useState(false)          // затемнение проявлено
  const [revealed, setRevealed] = useState(() => new Set())

  // Порядок появления строк — всегда снизу вверх (нижняя строка = худшее место
  // всплывает первой, кульминация — верхняя строка). Индексы строк в порядке показа.
  const seq = rows.map((_, i) => rows.length - 1 - i)

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setShown(true))

    const colors = variant === 'champion'
      ? ['#FFD700', '#FFC400', '#FFFFFF', '#C9A800']
      : ['#C9A800', '#16a34a', '#2563eb', '#ef4444', '#FFFFFF']
    const startT = setTimeout(() => {
      if (canvasRef.current) partRef.current = startFallingParticles(canvasRef.current, { colors })
    }, 150)

    const timers = seq.map((rowIdx, order) =>
      setTimeout(() => {
        setRevealed((prev) => new Set(prev).add(rowIdx))
      }, START_DELAY + order * STAGGER))

    const stopAt = START_DELAY + seq.length * STAGGER + HOLD_MS
    const stopT = setTimeout(() => partRef.current?.stop(), stopAt)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(startT); clearTimeout(stopT)
      timers.forEach(clearTimeout)
      partRef.current?.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[170]">
      {/* Затемнение */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(6,10,20,0.93)', opacity: shown ? 1 : 0, transition: 'opacity 450ms ease' }}
      />

      {/* Частицы */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Контент */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div
          className="text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          style={{ color: 'rgba(255,255,255,0.5)', opacity: shown ? 1 : 0, transition: 'opacity 600ms 200ms ease' }}
        >
          {variant === 'champion' ? 'Итоги чемпионата мира' : 'Матч за 3-е место'}
        </div>

        <div className="w-full max-w-[360px] flex flex-col gap-2.5">
          {rows.map((row, i) => {
            const meta = RANK_META[row.rank] || RANK_META[4]
            const isChamp = row.rank === 1
            const on = revealed.has(i)
            return (
              <div
                key={row.rank}
                style={{
                  opacity: on ? 1 : 0,
                  transform: on ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 640ms ease, transform 640ms cubic-bezier(.2,.7,.3,1)',
                }}
              >
                {isChamp && (
                  <div className="flex justify-center mb-2">
                    <span
                      className="text-[11px] font-black uppercase tracking-[0.28em] px-3.5 py-1 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#C9A800,#FFD700)', color: '#3A2E00', boxShadow: '0 6px 18px rgba(201,168,0,0.5)' }}
                    >
                      ★ Чемпион ★
                    </span>
                  </div>
                )}
                <div
                  className="flex items-center rounded-2xl"
                  style={{
                    background: meta.chip,
                    border: `1px solid ${meta.border}`,
                    boxShadow: isChamp ? '0 14px 44px rgba(201,168,0,0.42)' : '0 8px 24px rgba(0,0,0,0.38)',
                    padding: isChamp ? '16px 18px' : '12px 16px',
                  }}
                >
                  <span
                    className="font-black leading-none flex-shrink-0"
                    style={{ color: meta.num, fontSize: isChamp ? 46 : 30, width: isChamp ? 54 : 40, textAlign: 'center' }}
                  >
                    {row.rank}
                  </span>
                  <span
                    className="flex-1 font-black uppercase tracking-wide px-2 leading-tight"
                    style={{ color: '#111827', fontSize: isChamp ? 21 : 15 }}
                  >
                    {row.name}
                  </span>
                  <span className="flex-shrink-0" style={{ fontSize: isChamp ? 62 : 44, lineHeight: 1 }}>
                    {row.flag}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Кнопка доступна сразу — можно скипнуть показ */}
        <button
          onClick={onNext}
          className="mt-6 px-9 py-3 text-sm font-black uppercase tracking-wide rounded-full"
          style={{ background: '#C9A800', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(201,168,0,0.4)' }}
        >
          Далее
        </button>
      </div>
    </div>
  )
}

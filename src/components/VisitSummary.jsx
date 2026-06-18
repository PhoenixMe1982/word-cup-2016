import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { fireSalute } from '../salute.js'

// Попап «что изменилось с прошлого визита». App вычисляет summary и
// показывает попап только при реальном изменении (см. computeVisitSummary).
// Тут — только отрисовка + салют на позитиве.
//
// Слои (снизу вверх): затемнение → canvas салюта → карточка попапа.
// Салют рисуем на СВОЁМ canvas (confetti.create), вставленном между затемнением
// и карточкой, иначе глобальный canvas-confetti (z-index 100) уходит под
// затемнение (z-150) и салют не виден поверх фона.
export default function VisitSummary({ summary, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!summary?.celebrate || !canvasRef.current) return
    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true })
    // небольшая задержка, чтобы салют лёг поверх уже появившегося попапа
    const t = setTimeout(() => fireSalute(summary.exactCount > 0 ? 'exact' : 'outcome', myConfetti), 250)
    return () => { clearTimeout(t); myConfetti.reset() }
  }, [summary])

  if (!summary) return null

  const { newCount, ptsGained, exactCount, rankFrom, rankTo, rankDelta } = summary
  const rankMoved = rankDelta !== 0 && rankFrom != null && rankTo != null
  const up = rankDelta > 0 // положительный delta = поднялся (число места меньше)

  return (
    <div className="fixed inset-0 z-[150]">
      {/* Слой затемнения (низ) — клик мимо карточки закрывает */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Слой салюта (середина) — поверх затемнения, под карточкой */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Слой карточки (верх) */}
      <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div
          className="visit-pop w-full max-w-[360px] rounded-3xl overflow-hidden pointer-events-auto"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
        >
          {/* Шапка */}
          <div className="px-5 pt-6 pb-5 text-center" style={{ background: 'linear-gradient(160deg,#111827,#1f2937)' }}>
            <div className="text-3xl mb-1">{summary.celebrate ? '🎉' : '👋'}</div>
            <div className="text-lg font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>
              С возвращением!
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Пока тебя не было
            </div>
          </div>

          <div className="px-5 py-5 space-y-3">
            {newCount > 0 && (
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: '#FFF8E1', border: '1px solid rgba(201,168,0,0.25)' }}>
                <div>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: '#9A7B00' }}>Начислено очков</div>
                  <div className="text-[11px]" style={{ color: '#6B7280' }}>
                    посчитано прогнозов: {newCount}{exactCount > 0 ? ` · точных: ${exactCount}` : ''}
                  </div>
                </div>
                <div className="text-3xl font-black" style={{ color: ptsGained > 0 ? '#C9A800' : '#6B7280' }}>
                  {ptsGained > 0 ? `+${ptsGained}` : '0'}
                </div>
              </div>
            )}

            {/* Лидерборд */}
            {rankMoved && (
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: '#F5F6FA', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: '#6B7280' }}>Место в лидерборде</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>#{rankFrom}</span>
                  <span style={{ color: up ? '#16A34A' : '#DC2626' }}>{up ? '▲' : '▼'}</span>
                  <span className="text-lg font-black" style={{ color: '#111827' }}>#{rankTo}</span>
                  <span className="text-[11px] font-bold" style={{ color: up ? '#16A34A' : '#DC2626' }}>
                    {up ? `+${rankDelta}` : rankDelta}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 text-sm font-black uppercase tracking-wide"
            style={{ background: '#C9A800', color: '#FFFFFF' }}
          >
            Отлично
          </button>
        </div>
      </div>
    </div>
  )
}

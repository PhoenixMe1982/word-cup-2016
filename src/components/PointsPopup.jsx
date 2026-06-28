// Попап «прогноз сыграл» для зачётов, происходящих ПОКА приложение открыто.
// Раньше в этот момент срабатывал только салют (SaluteWatcher), а попапа с
// количеством очков не было — его показывал лишь экран «итоги визита» при
// следующем заходе. Теперь живой зачёт тоже даёт попап. Салют здесь НЕ
// запускаем — его уже отрисовал SaluteWatcher на ту же пачку исходов.
export default function PointsPopup({ summary, onClose }) {
  if (!summary) return null
  const { count, ptsGained, exactCount } = summary

  return (
    <div className="fixed inset-0 z-[155]">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div
          className="visit-pop w-full max-w-[340px] rounded-3xl overflow-hidden pointer-events-auto"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
        >
          <div className="px-5 pt-6 pb-5 text-center" style={{ background: 'linear-gradient(160deg,#111827,#1f2937)' }}>
            <div className="text-3xl mb-1">🎉</div>
            <div className="text-lg font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>
              {ptsGained > 0 ? 'Прогноз сыграл!' : 'Матч засчитан'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Только что подвели итог
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: '#FFF8E1', border: '1px solid rgba(201,168,0,0.25)' }}>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: '#9A7B00' }}>Начислено очков</div>
                <div className="text-[11px]" style={{ color: '#6B7280' }}>
                  посчитано прогнозов: {count}{exactCount > 0 ? ` · точных: ${exactCount}` : ''}
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: ptsGained > 0 ? '#C9A800' : '#6B7280' }}>
                {ptsGained > 0 ? `+${ptsGained}` : '0'}
              </div>
            </div>
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

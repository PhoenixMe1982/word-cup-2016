export default function PlayPage() {
  return (
    <div className="page-content px-4 pb-4">
      <div
        className="-mx-4 px-4 pt-12 pb-5 mb-6"
        style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1 uppercase" style={{ color: '#6B7280' }}>ЧМ 2026</p>
            <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: '#111827' }}>Играть</h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#6B7280' }}>Прогнозы на матчи</p>
          </div>
          <div className="text-5xl">🎯</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-12 gap-5">
        <div className="text-7xl">⚽</div>
        <div className="text-center">
          <p className="text-base font-black uppercase tracking-wide mb-1" style={{ color: '#111827' }}>Скоро</p>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Система прогнозов в разработке</p>
        </div>
        <div
          className="w-full p-4 text-center text-xs uppercase tracking-wider"
          style={{ background: 'rgba(201,168,0,0.08)', border: '1px solid rgba(201,168,0,0.2)', borderRadius: 6, color: '#C9A800' }}
        >
          🏆 Угадывай счёт — зарабатывай очки — борись за топ лидерборда
        </div>
      </div>
    </div>
  )
}

// Разовый информационный попап: разъяснение ситуации с ошибочным счётом
// матча Испания—Саудовская Аравия (m37) и его исправлением 5:0 → 4:0.
// Показывается один раз (флаг в localStorage ставит App при закрытии).
// Слои совпадают с VisitSummary: затемнение → карточка (без салюта — это
// не празднование, а извинение).
export default function AnnouncementModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[160]">
      {/* Затемнение — клик мимо карточки закрывает */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Карточка */}
      <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div
          className="visit-pop w-full max-w-[360px] rounded-3xl overflow-hidden pointer-events-auto"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
        >
          {/* Шапка */}
          <div className="px-5 pt-6 pb-5 text-center" style={{ background: 'linear-gradient(160deg,#111827,#1f2937)' }}>
            <div className="text-3xl mb-1">📣</div>
            <div className="text-lg font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>
              Важное уведомление
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Корректировка результата
            </div>
          </div>

          {/* Плашка со счётом */}
          <div className="px-5 pt-5">
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: '#F5F6FA', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-between">
                {/* Испания */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-3xl leading-none">🇪🇸</span>
                  <span className="text-[11px] font-bold" style={{ color: '#374151' }}>Испания</span>
                </div>

                {/* Счёт: было → стало */}
                <div className="flex flex-col items-center px-2">
                  <span
                    className="text-sm font-bold leading-none mb-1"
                    style={{ color: '#9CA3AF', textDecoration: 'line-through' }}
                  >
                    5 : 0
                  </span>
                  <span className="text-3xl font-black leading-none" style={{ color: '#16A34A' }}>
                    4 : 0
                  </span>
                  <span className="text-[10px] uppercase tracking-wide mt-1" style={{ color: '#16A34A' }}>
                    верный счёт
                  </span>
                </div>

                {/* Саудовская Аравия */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-3xl leading-none">🇸🇦</span>
                  <span className="text-[11px] font-bold" style={{ color: '#374151' }}>Саудовская Ар.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Текст */}
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed" style={{ color: '#374151' }}>
              Уважаемые болельщики! В приложении <b>FanApp</b> был зафиксирован
              ошибочный результат матча <b>Испания — Саудовская Аравия</b>.
              Результат исправлен на корректный — <b>с 5:0 на 4:0</b>.
              Распределение очков в Лидерборде пересчитано с учётом верного
              результата матча.
              <br /><br />
              Приносим свои извинения. Спасибо за понимание! 🤝
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 text-sm font-black uppercase tracking-wide"
            style={{ background: '#C9A800', color: '#FFFFFF' }}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

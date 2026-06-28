// Разовый попап со схемой начисления очков (группа + плей-офф). Показывается один
// раз при запуске после открытия плей-офф (флаг в localStorage ставит App при
// закрытии). Цель — объяснить новую стек-механику нокаута и напомнить групповую.
export default function ScoringModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[160]">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
        <div
          className="visit-pop w-full max-w-[360px] rounded-3xl overflow-hidden pointer-events-auto"
          style={{ background: '#FFFFFF', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Шапка */}
          <div className="px-5 pt-6 pb-5 text-center flex-shrink-0" style={{ background: 'linear-gradient(160deg,#111827,#1f2937)' }}>
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-lg font-black uppercase tracking-wide" style={{ color: '#FFFFFF' }}>
              Как начисляются очки
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Угадывай счёт — поднимайся в рейтинге
            </div>
          </div>

          <div className="px-5 py-5 overflow-y-auto" style={{ minHeight: 0 }}>
            {/* Групповой этап */}
            <div className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
              Групповой этап
            </div>
            <div className="space-y-2 mb-5">
              <Row color="#16A34A" pts="+3" title="Точный счёт" desc="Угадал счёт матча полностью" />
              <Row color="#C9A800" pts="+1" title="Верный исход" desc="Угадал победителя или ничью" />
              <Row color="#9CA3AF" pts="0" title="Промах" desc="Исход не угадан" />
            </div>

            {/* Плей-офф */}
            <div className="text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#C9A800' }}>
              🏆 Плей-офф <span className="font-bold normal-case tracking-normal" style={{ color: '#9CA3AF' }}>· очки складываются по стадиям</span>
            </div>
            <div className="space-y-2 mb-3">
              <Row color="#16A34A" pts="+3 / +1" title="Счёт к 90′" desc="Точный счёт +3, либо верный исход +1" />
              <Row color="#2563EB" pts="+2 / +1" title="Итог к 120′ (общий)" desc="Общий счёт за весь матч к концу ОТ — не голы только в овертайме. Открывается при ничьей в 90′" />
              <Row color="#7C3AED" pts="+1" title="Пенальти" desc="Угадал победителя серии (если дошёл прогнозом)" />
              <Row color="#C9A800" pts="+1" title="Кто прошёл дальше" desc="Бонус всем, кто угадал проходящую команду" />
            </div>
            <div className="rounded-2xl px-3 py-2.5 text-[11px] leading-snug" style={{ background: 'rgba(201,168,0,0.08)', border: '1px solid rgba(201,168,0,0.25)', color: '#6B7280' }}>
              На каждой стадии берётся <b>большее</b> (точный счёт <i>или</i> исход), а стадии <b>суммируются</b> — максимум до <b style={{ color: '#C9A800' }}>+7</b> за матч.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 text-sm font-black uppercase tracking-wide flex-shrink-0"
            style={{ background: '#C9A800', color: '#FFFFFF' }}
          >
            Погнали!
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ color, pts, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center flex-shrink-0 text-xs font-black"
        style={{ minWidth: 52, height: 30, borderRadius: 10, background: `${color}1A`, border: `1.5px solid ${color}55`, color }}
      >
        {pts}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold" style={{ color: '#111827' }}>{title}</div>
        <div className="text-[11px] leading-snug" style={{ color: '#6B7280' }}>{desc}</div>
      </div>
    </div>
  )
}

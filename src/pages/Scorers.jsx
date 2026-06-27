import { TEAMS } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

const MEDAL_COLORS = {
  1: { bg: 'linear-gradient(135deg,#FFD700,#FF8C00)', text: '#000' },
  2: { bg: 'linear-gradient(135deg,#C0C0C0,#909090)', text: '#000' },
  3: { bg: 'linear-gradient(135deg,#CD7F32,#8B4513)', text: '#fff' },
}

function ScorerRow({ scorer, maxVal, view }) {
  const team = TEAMS[scorer.team]
  const medal = MEDAL_COLORS[scorer.rank]
  const mainStat = view === 'goals' ? scorer.goals : scorer.assists

  return (
    <div
      className="p-4 mb-2 relative overflow-hidden"
      style={{
        background: '#FFFFFF',
        borderLeft: scorer.rank <= 3 ? '2px solid #C9A800' : '2px solid transparent',
        border: scorer.rank <= 3
          ? undefined
          : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      }}
    >
      {scorer.rank <= 3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '1px solid rgba(0,0,0,0.07)',
            borderLeft: '2px solid #C9A800',
            borderRadius: 16,
          }}
        />
      )}

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{
            borderRadius: 16,
            ...(medal
              ? { background: medal.bg, color: medal.text }
              : { background: 'rgba(0,0,0,0.07)', color: '#6B7280' }),
          }}
        >
          {scorer.rank <= 3 ? ['🥇', '🥈', '🥉'][scorer.rank - 1] : scorer.rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black truncate uppercase" style={{ color: '#111827' }}>{scorer.name}</span>
            {scorer.rank === 1 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5"
                style={{ background: '#C9A800', color: '#FFFFFF', borderRadius: 10 }}
              >
                ТОП
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: '#6B7280' }}>
            <span>{team?.flag} {team?.name}</span>
            {scorer.club && <><span>·</span><span>{scorer.club}</span></>}
          </div>
          <div className="mt-2 stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: mainStat > 0 ? `${(mainStat / maxVal) * 100}%` : '4px',
                background: scorer.rank === 1 ? '#C9A800' : scorer.rank <= 3 ? '#9A8000' : '#0EA5E9',
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black score-number" style={{ color: scorer.rank === 1 ? '#C9A800' : '#111827' }}>
              {mainStat}
            </span>
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
              {view === 'goals' ? 'гол' : 'пас'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Scorers() {
  const { scorers } = useLiveData()
  // Ассисты пока не считаем (до конца турнира — потом возьмём официальные данные ФИФА),
  // поэтому раздел зафиксирован на голах, переключатель скрыт.
  const view = 'goals'

  const sorted = [...scorers]
    .filter(s => view === 'goals' ? s.goals > 0 : s.assists > 0)
    .sort((a, b) => view === 'goals'
      ? b.goals - a.goals || b.assists - a.assists
      : b.assists - a.assists || b.goals - a.goals
    )
    .map((s, i) => ({ ...s, rank: i + 1 }))

  const maxVal = view === 'goals'
    ? Math.max(sorted[0]?.goals || 0, 1)
    : Math.max(sorted[0]?.assists || 0, 1)

  // Претенденты на Золотую бутсу для верхнего блока: все игроки с максимальным
  // показателем. Один лидер — показываем одного; несколько с равным максимумом — всех.
  const contenders = sorted.filter((s) => (view === 'goals' ? s.goals : s.assists) === maxVal)

  const leaderLabel = view === 'goals' ? 'голов' : 'ассистов'

  return (
    <div className="page-content">
      {/* Info strip (заголовок раздела уже в шапке ЧМ) */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Претенденты на Золотую бутсу</p>

        {/* Блок претендентов на Золотую бутсу (макс. показатель) */}
        {contenders.length > 0 ? (
          <div
            className="mt-4 p-4"
            style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#C9A800' }}>
                {view === 'goals'
                  ? (contenders.length > 1 ? 'Претенденты — Золотая бутса' : 'Фаворит — Золотая бутса')
                  : (contenders.length > 1 ? 'Лидеры по ассистам' : 'Лидер по ассистам')}
              </div>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-3xl font-black leading-none" style={{ color: '#C9A800' }}>{maxVal}</span>
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{leaderLabel}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {contenders.map((c) => (
                <div key={`${c.team}-${c.name}`} className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{TEAMS[c.team]?.flag}</span>
                  <span className="text-base font-black uppercase truncate" style={{ color: '#111827' }}>{c.name}</span>
                  <span className="text-[11px] truncate" style={{ color: '#6B7280' }}>{c.club || TEAMS[c.team]?.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Данные появятся после первых матчей
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 pb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-5xl">{view === 'goals' ? '⚽' : '🎯'}</div>
            <p className="text-xs uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>
              {view === 'goals' ? 'Голы ещё не забиты' : 'Ассистов ещё не было'}
            </p>
          </div>
        ) : (
          sorted.map((scorer) => (
            <ScorerRow key={`${scorer.team}-${scorer.name}`} scorer={scorer} maxVal={maxVal} view={view} />
          ))
        )}
      </div>
    </div>
  )
}

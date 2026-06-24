import { useMemo } from 'react'
import { TEAMS } from '../data.js'

// Статистика вратарей группового этапа ЧМ-2026 (на 24 июня 2026).
// Источник: сводка Opta (Squawka/ESPN), TNT Sports, Goalkeeper Magazine.
// mp — матчи, saves — сейвы, ga — пропущено, savepct — % сейвов, cs — сухие,
// pom — приз «Игрок матча». «Балл» считается ниже по прозрачной формуле.
const GK_DATA = [
  { name: 'Алиреза Бейранванд',    team: 'IRN', mp: 2, saves: 9,  ga: 0, savepct: 100,  cs: 2, pom: true  },
  { name: 'Элой Рум',              team: 'CUW', mp: 2, saves: 18, ga: 1, savepct: 94.7, cs: 1, pom: true  },
  { name: 'Мохаммад Аль-Овайс',    team: 'KSA', mp: 2, saves: 13, ga: 2, savepct: 86.7, cs: 0, pom: true  },
  { name: 'Возинья',               team: 'CPV', mp: 2, saves: 11, ga: 2, savepct: 84.6, cs: 1, pom: true  },
  { name: 'Алиссон',               team: 'BRA', mp: 2, saves: 6,  ga: 1, savepct: 85.7, cs: 1, pom: false },
  { name: 'Ян Зоммер',             team: 'SUI', mp: 2, saves: 7,  ga: 1, savepct: 87.5, cs: 1, pom: false },
  { name: 'Барт Вербрюгген',       team: 'NED', mp: 2, saves: 8,  ga: 2, savepct: 80.0, cs: 1, pom: false },
  { name: 'Максим Крепо',          team: 'CAN', mp: 2, saves: 7,  ga: 1, savepct: 87.5, cs: 1, pom: false },
  { name: 'Джордан Пикфорд',       team: 'ENG', mp: 2, saves: 5,  ga: 1, savepct: 83.3, cs: 1, pom: false },
  { name: 'Мануэль Нойер',         team: 'GER', mp: 2, saves: 6,  ga: 1, savepct: 85.7, cs: 1, pom: false },
]

// Сводный балл (0–10): нормируем четыре метрики и берём взвешенное среднее.
//   % сейвов — 35% · сейвы за матч — 25% · сухие матчи — 25% · пропущено за матч — 15% (инверсия)
// Балл сопоставим только внутри этой выборки и на этом отрезке (1–2 матча).
function withScores(data) {
  const max = {
    saves: Math.max(...data.map((d) => d.saves / d.mp)),
    cs: Math.max(...data.map((d) => d.cs)),
    gaInv: Math.max(...data.map((d) => d.ga / d.mp)),
  }
  return data.map((d) => {
    const savesN = (d.saves / d.mp) / max.saves * 10
    const pctN = d.savepct / 100 * 10
    const csN = (max.cs ? d.cs / max.cs : 0) * 10
    const gaN = (1 - (d.ga / d.mp) / (max.gaInv || 1)) * 10
    const score = +(pctN * 0.35 + savesN * 0.25 + csN * 0.25 + gaN * 0.15).toFixed(2)
    return { ...d, score }
  })
}

function scoreColor(score, maxScore) {
  if (score >= maxScore - 0.01) return '#C9A800'
  if (score >= 8.5) return '#16A34A'
  return '#0EA5E9'
}

export default function Goalkeepers() {
  const ranked = useMemo(() => {
    return withScores(GK_DATA)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((g, i) => ({ ...g, rank: i + 1 }))
  }, [])

  const maxScore = ranked[0]?.score ?? 10

  return (
    <div className="page-content">
      {/* Info strip (заголовок раздела уже в шапке ЧМ) */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>
          Топ-10 вратарей · групповой этап
        </p>
        <p className="text-[11px] mt-1.5 leading-snug" style={{ color: '#9CA3AF' }}>
          «Балл» — сводная оценка по формуле: % сейвов (35%), сейвы за матч (25%),
          сухие матчи (25%), пропущено за матч (15%). Сопоставим внутри этой выборки
          на отрезке 1–2 матчей. <span style={{ color: '#C9A800' }}>★</span> — приз «Игрок матча».
        </p>
      </div>

      {/* Таблица */}
      <div className="px-4">
        <div
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}
        >
          <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', fontVariantNumeric: 'tabular-nums' }}>
            <colgroup>
              <col />
              <col style={{ width: 30 }} />
              <col style={{ width: 42 }} />
              <col style={{ width: 34 }} />
              <col style={{ width: 42 }} />
              <col style={{ width: 52 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(201,168,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <th className="text-left text-[10px] font-black uppercase tracking-wide pl-3 pr-1 py-2.5" style={{ color: '#6B7280' }}>Вратарь</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Игры">И</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Сейвы">Сейв</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Сухие матчи">Сух</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Пропущено">Проп</th>
                <th className="text-center text-[10px] font-black uppercase pr-2 py-2.5" style={{ color: '#111827' }} title="Средний балл">Балл</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((gk) => {
                const team = TEAMS[gk.team]
                const medal = gk.rank === 1 ? '🥇' : gk.rank === 2 ? '🥈' : gk.rank === 3 ? '🥉' : null
                return (
                  <tr key={gk.name} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {/* Вратарь + сборная */}
                    <td className="pl-3 pr-1 py-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-black w-4 flex-shrink-0 text-center" style={{ color: '#9CA3AF' }}>
                          {medal || gk.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[12px] font-black truncate uppercase" style={{ color: '#111827' }}>{gk.name}</span>
                            {gk.pom && <span className="text-[10px] flex-shrink-0" style={{ color: '#C9A800' }}>★</span>}
                          </div>
                          <div className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                            {team?.flag} {team?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-[13px] py-2" style={{ color: '#6B7280' }}>{gk.mp}</td>
                    <td className="text-center text-[13px] font-bold py-2" style={{ color: '#111827' }}>{gk.saves}</td>
                    <td className="text-center text-[13px] py-2" style={{ color: gk.cs > 0 ? '#16A34A' : '#9CA3AF' }}>{gk.cs}</td>
                    <td className="text-center text-[13px] py-2" style={{ color: '#6B7280' }}>{gk.ga}</td>
                    <td className="text-center pr-2 py-2">
                      <span className="text-[15px] font-black" style={{ color: scoreColor(gk.score, maxScore) }}>
                        {gk.score.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] mt-3 text-center" style={{ color: '#9CA3AF' }}>
          ФИФА не публикует сводный балл вратарей — оценка рассчитана по live-метрикам, а не официальный показатель.
        </p>
      </div>
    </div>
  )
}

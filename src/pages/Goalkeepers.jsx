import { useMemo } from 'react'
import { TEAMS } from '../data.js'

// Статистика вратарей ЧМ-2026 после 1/8 финала (на 8 июля 2026).
// Источник: сводка Opta/StatsPerform (ESPN, Squawka), Khel Now, TNT Sports.
// mp — матчи, saves — сейвы, ga — пропущено, savepct — % сейвов, cs — сухие,
// pom — приз «Игрок матча». «Балл» считается ниже по прозрачной формуле.
const GK_DATA = [
  { name: 'Унай Симон',            team: 'ESP', mp: 5, saves: 14, ga: 0, savepct: 100,  cs: 5, pom: true  },
  { name: 'Мике Меньян',           team: 'FRA', mp: 5, saves: 15, ga: 2, savepct: 88,   cs: 3, pom: false },
  { name: 'Камило Варгас',         team: 'COL', mp: 5, saves: 18, ga: 1, savepct: 94.7, cs: 4, pom: true  },
  { name: 'Ясин Буну',             team: 'MAR', mp: 4, saves: 13, ga: 3, savepct: 81.3, cs: 2, pom: false },
  { name: 'Эмилиано Мартинес',     team: 'ARG', mp: 5, saves: 12, ga: 6, savepct: 66.7, cs: 1, pom: false },
  { name: 'Гренель / Зоммер',      team: 'SUI', mp: 5, saves: 16, ga: 3, savepct: 84.2, cs: 2, pom: false },
  { name: 'Тибо Куртуа',           team: 'BEL', mp: 5, saves: 14, ga: 5, savepct: 73.7, cs: 1, pom: false },
  { name: 'Джордан Пикфорд',       team: 'ENG', mp: 5, saves: 11, ga: 4, savepct: 73.3, cs: 2, pom: false },
  { name: 'Элой Рум',              team: 'CUW', mp: 4, saves: 20, ga: 9, savepct: 69.0, cs: 1, pom: true  },
  { name: 'Орландо Хилл',          team: 'PAR', mp: 5, saves: 19, ga: 3, savepct: 86.4, cs: 2, pom: false },
  { name: 'Возинья',               team: 'CPV', mp: 4, saves: 18, ga: 5, savepct: 78.3, cs: 1, pom: true  },
  { name: 'Алиреза Бейранванд',    team: 'IRN', mp: 3, saves: 12, ga: 3, savepct: 80.0, cs: 1, pom: true  },
  { name: 'Мохаммад Аль-Овайс',    team: 'KSA', mp: 3, saves: 16, ga: 4, savepct: 80.0, cs: 0, pom: true  },
  { name: 'Рауль Рангель',         team: 'MEX', mp: 5, saves: 13, ga: 3, savepct: 81.3, cs: 4, pom: false },
  { name: 'Мэтт Фрис',             team: 'USA', mp: 4, saves: 12, ga: 6, savepct: 66.7, cs: 2, pom: false },
  { name: 'Алиссон',               team: 'BRA', mp: 4, saves: 9,  ga: 3, savepct: 75.0, cs: 1, pom: false },
  { name: 'Мануэль Нойер',         team: 'GER', mp: 4, saves: 10, ga: 5, savepct: 66.7, cs: 1, pom: false },
  { name: 'Диогу Кошта',           team: 'POR', mp: 4, saves: 11, ga: 4, savepct: 73.3, cs: 1, pom: false },
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

// Карточки-выделения над таблицей.
const HIGHLIGHTS = [
  { label: 'Лидер Golden Glove', title: 'Унай Симон', caption: 'Испания · 5 сухих из 5 · рекорд 609 мин без пропущенных' },
  { label: 'Больше всех сейвов', title: 'Элой Рум · 20', caption: 'Кюрасао · рекорд 15 за матч (сухой), выбыл в 1/8' },
  { label: 'Символ турнира', title: 'Возинья · 40 лет', caption: 'Кабо-Верде · 18 сейвов, довёл Аргентину до доп. времени' },
]

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
      {/* Заголовок + карточки-выделения */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs uppercase tracking-wider font-black" style={{ color: '#6B7280' }}>
          Топ 10 вратарей
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {HIGHLIGHTS.map((c) => (
            <div
              key={c.label}
              style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
              className="px-3.5 py-2.5"
            >
              <p className="text-[10px] uppercase tracking-wider font-black" style={{ color: '#9CA3AF' }}>
                {c.label}
              </p>
              <p className="text-[15px] font-black mt-0.5" style={{ color: '#111827' }}>
                {c.title}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#6B7280' }}>
                {c.caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="px-4">
        <div
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}
        >
          <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', fontVariantNumeric: 'tabular-nums' }}>
            <colgroup>
              <col />
              <col style={{ width: 28 }} />
              <col style={{ width: 40 }} />
              <col style={{ width: 46 }} />
              <col style={{ width: 32 }} />
              <col style={{ width: 40 }} />
              <col style={{ width: 50 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(201,168,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <th className="text-left text-[10px] font-black uppercase tracking-wide pl-3 pr-1 py-2.5" style={{ color: '#6B7280' }}>Вратарь</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Игры">И</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="Сейвы">Сейв</th>
                <th className="text-center text-[10px] font-black uppercase py-2.5" style={{ color: '#6B7280' }} title="% сейвов">%&nbsp;Сейв</th>
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
                    <td className="text-center text-[12px] py-2" style={{ color: '#6B7280' }}>{gk.savepct % 1 ? gk.savepct.toFixed(1) : gk.savepct}%</td>
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

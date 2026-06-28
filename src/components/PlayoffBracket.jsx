import { TEAMS, KNOCKOUT_LAYOUT } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

// Классическая сетка плей-офф «периферия → центр» (как на афише). Команды — ТОЛЬКО
// флаги. ВСЕ ячейки одного размера: будущие раунды — такие же пустые ячейки, в
// которые по мере резолва просто подставляется флаг прошедшей команды (без сдвига
// вёрстки). Сплошные дорожки-коннекторы; колонки раундов фиксированы, колонки-
// коннекторы тянутся flex'ом → схема заполняет ширину экрана. Финальная пара — под
// кубком, матч за 3-е место — сразу под ней.
//
// Интерактивность: ячейка следующего раунда = winnerCode(матч предыдущего). Как
// только бэкенд фиксирует результат (finished + реальный счёт), победитель пары
// появляется в следующей ячейке — каскадом до финала.

const CUP = `${import.meta.env.BASE_URL}cup-pic.png`
const L = KNOCKOUT_LAYOUT

function winnerCode(m) {
  if (!m || m.home == null || m.away == null) return null
  if (m.status !== 'finished') return null
  if (m.winner === 'HOME_TEAM') return m.home
  if (m.winner === 'AWAY_TEAM') return m.away
  if (m.winner === 'DRAW') return null
  if (m.scoreHome == null || m.scoreAway == null) return null
  if (m.scoreHome > m.scoreAway) return m.home
  if (m.scoreHome < m.scoreAway) return m.away
  if (m.penHome != null && m.penAway != null) return m.penHome > m.penAway ? m.home : m.away
  return null
}

const flagOf = (code) => (code ? (TEAMS[code]?.flag || '') : '')

// Единая ячейка: флаг или пусто. Размер задаётся CSS (.kb-box) — одинаков везде.
function Cell({ code, dim }) {
  return (
    <div className="kb-box" style={dim ? { opacity: 0.3 } : undefined}>
      {code ? <span className="kb-flag">{flagOf(code)}</span> : null}
    </div>
  )
}

// Колонка раунда: фикс. ширина (CSS), ячейки flex:1 — центры выстраиваются для пар.
function RoundCol({ cells, kind }) {
  const team = kind === 'team'
  return (
    <div className="kb-rcol">
      {cells.map((c, i) => (
        <div className="kb-rcell" key={i}>
          {team ? <Cell code={c.code} dim={c.dim} /> : <Cell code={c} />}
        </div>
      ))}
    </div>
  )
}

// Колонка-коннектор: тянется по ширине (flex:1). count углов = половине ячеек слева.
function ConnCol({ count }) {
  return (
    <div className="kb-ccol">
      {Array.from({ length: count }).map((_, i) => (
        <div className="kb-elbow" key={i}>
          <i className="e-t" /><i className="e-b" /><i className="e-v" /><i className="e-o" />
        </div>
      ))}
    </div>
  )
}

function Half({ side, byId }) {
  const lay = L[side]
  const teams = lay.r32.flatMap((id) => {
    const m = byId[id]
    const w = winnerCode(m)
    return [
      { code: m?.home, dim: w && w !== m?.home },
      { code: m?.away, dim: w && w !== m?.away },
    ]
  })
  const c1 = lay.r32.map((id) => winnerCode(byId[id])) // 8 — участники 1/8
  const c2 = lay.r16.map((id) => winnerCode(byId[id])) // 4 — участники 1/4
  const c3 = lay.qf.map((id) => winnerCode(byId[id]))  // 2 — участники 1/2

  return (
    <div className={`kb-side ${side === 'right' ? 'kb-mirror' : ''}`}>
      <RoundCol cells={teams} kind="team" />
      <ConnCol count={8} />
      <RoundCol cells={c1} kind="slot" />
      <ConnCol count={4} />
      <RoundCol cells={c2} kind="slot" />
      <ConnCol count={2} />
      <RoundCol cells={c3} kind="slot" />
      <ConnCol count={1} />
    </div>
  )
}

export default function PlayoffBracket({ onOpen }) {
  const { matches } = useLiveData()
  const byId = {}
  for (const m of matches) byId[m.id] = m

  const leftFinalist = winnerCode(byId[L.left.sf[0]])
  const rightFinalist = winnerCode(byId[L.right.sf[0]])
  const champion = winnerCode(byId[L.final])
  const bronze = byId[L.bronze] || {}

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#111827' }}>
          🏆 Сетка плей-офф
        </h2>
        {onOpen && (
          <button onClick={onOpen} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#C9A800' }}>
            Прогнозы →
          </button>
        )}
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg,#FFFFFF 0%,#FFFDF5 100%)',
          borderTop: '1px solid rgba(201,168,0,0.25)',
          borderBottom: '1px solid rgba(201,168,0,0.25)',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          padding: '14px 4px 12px',
          overflow: 'hidden',
          marginLeft: -16,   // full-bleed: выходим за padding страницы (px-4)
          marginRight: -16,
        }}
      >
        <div className="kb-root">
          <Half side="left" byId={byId} />

          <div className="kb-center">
            <div className="kb-cup-col">
              {champion && <span className="kb-crown">👑</span>}
              <img src={CUP} alt="Кубок мира" className="kb-cup" />
            </div>
            {/* Финальная пара — прямо под кубком */}
            <span className="kb-mini-label">Финал</span>
            <div className="kb-pair">
              <Cell code={leftFinalist} />
              <Cell code={rightFinalist} />
            </div>
            {/* Матч за 3-е место — сразу под финалом, близко к кубку */}
            <span className="kb-mini-label kb-bronze-label">За 3-е место</span>
            <div className="kb-pair">
              <Cell code={bronze.home} />
              <Cell code={bronze.away} />
            </div>
          </div>

          <Half side="right" byId={byId} />
        </div>

        <div className="kb-stage-row">
          <span>1/16</span><span>1/8</span><span>1/4</span><span>1/2</span>
          <span className="kb-stage-cup">Финал</span>
          <span>1/2</span><span>1/4</span><span>1/8</span><span>1/16</span>
        </div>
      </div>

      <style>{`
        .kb-root {
          display: flex; align-items: stretch; width: 100%;
          height: 540px; --kb-line: rgba(201,168,0,0.6); --kb-cell-w: 32px;
        }
        .kb-side { flex: 1 1 0; display: flex; min-width: 0; }
        .kb-mirror { transform: scaleX(-1); }
        .kb-mirror .kb-flag { display: inline-block; transform: scaleX(-1); }

        .kb-rcol { flex: 0 0 auto; width: var(--kb-cell-w); display: flex; flex-direction: column; }
        .kb-rcell { flex: 1 1 0; display: flex; align-items: center; justify-content: center; min-height: 0; }
        /* Единая ячейка — одинакова для команд и пустых слотов будущих раундов */
        .kb-box {
          width: 100%; height: 26px;
          background: #FFFFFF; border: 1px solid rgba(0,0,0,0.12);
          border-radius: 7px; box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          display: flex; align-items: center; justify-content: center;
        }
        .kb-flag { font-size: 22px; line-height: 1; }

        /* Колонки-коннекторы тянутся по ширине → схема заполняет экран */
        .kb-ccol { flex: 1 1 0; min-width: 6px; display: flex; flex-direction: column; }
        .kb-elbow { flex: 1 1 0; position: relative; }
        .kb-elbow i { position: absolute; background: var(--kb-line); }
        .e-t { left: 0; top: 25%; width: 50%; height: 2px; transform: translateY(-1px); }
        .e-b { left: 0; top: 75%; width: 50%; height: 2px; transform: translateY(-1px); }
        .e-v { left: calc(50% - 1px); top: 25%; height: 50%; width: 2px; }
        .e-o { left: 50%; top: 50%; width: 50%; height: 2px; transform: translateY(-1px); }

        .kb-center {
          flex: 0 0 auto; width: calc(var(--kb-cell-w) * 2 + 14px);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
        }
        .kb-cup-col { position: relative; display: flex; flex-direction: column; align-items: center; }
        .kb-crown { position: absolute; top: -14px; font-size: 16px; line-height: 1; z-index: 2; }
        .kb-cup { width: 46px; height: auto; filter: drop-shadow(0 3px 6px rgba(201,168,0,0.45)); }
        .kb-mini-label {
          font-size: 8px; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.06em; color: #C9A800; margin-top: 2px;
        }
        .kb-bronze-label { color: #9CA3AF; margin-top: 4px; }
        .kb-pair { display: flex; gap: 5px; }
        .kb-pair .kb-box { width: var(--kb-cell-w); }

        .kb-stage-row {
          display: flex; align-items: center; margin-top: 12px;
          font-size: 8px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9CA3AF;
        }
        .kb-stage-row > span { flex: 1 1 0; text-align: center; }
        .kb-stage-cup { color: #C9A800 !important; flex: 0 0 auto !important; width: calc(var(--kb-cell-w) * 2 + 14px); }
      `}</style>
    </section>
  )
}

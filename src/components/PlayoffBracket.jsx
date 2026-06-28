import { TEAMS, KNOCKOUT_LAYOUT } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

// Классическая сетка плей-офф «периферия → центр» (как на афише): левая и правая
// половины сходятся к кубку. Команды — ТОЛЬКО флаги. Колоночная раскладка с
// CSS-коннекторами: первая колонка — пары R32 (по 2 флага), дальше — чипы
// победителей, заполняются из live-результатов по мере резолва.

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

function flagOf(code) {
  return code ? (TEAMS[code]?.flag || '') : ''
}

// Колонка ячеек одинаковой высоты (flex:1) — центры выстраиваются для бракетных
// соединений. kind: 'team' (флаг-пилюля) | 'win' (чип победителя).
function Col({ cells, kind, last }) {
  return (
    <div className={`kb-col ${last ? 'kb-col-last' : ''}`}>
      {cells.map((c, i) => (
        <div className="kb-cell" key={i}>
          {kind === 'team' ? (
            <div className="kb-pill" style={{ opacity: c.dim ? 0.32 : 1 }}>
              {c.code ? <span className="kb-flag">{flagOf(c.code)}</span> : <span className="kb-tbd" />}
            </div>
          ) : c ? (
            <div className="kb-win"><span className="kb-flag">{flagOf(c)}</span></div>
          ) : (
            <div className="kb-dot" />
          )}
        </div>
      ))}
    </div>
  )
}

// Колонки одной половины. side: 'left' | 'right'. Для правой — зеркалим контейнер,
// флаги разворачиваем обратно (CSS .kb-mirror .kb-flag).
function Half({ side, byId }) {
  const lay = L[side]
  // Колонка команд: для каждого матча R32 — два флага (с затемнением вылетевших).
  const teamCells = lay.r32.flatMap((id) => {
    const m = byId[id]
    const w = winnerCode(m)
    return [
      { code: m?.home, dim: w && w !== m?.home },
      { code: m?.away, dim: w && w !== m?.away },
    ]
  })
  const r32w = lay.r32.map((id) => winnerCode(byId[id]))
  const r16w = lay.r16.map((id) => winnerCode(byId[id]))
  const qfw = lay.qf.map((id) => winnerCode(byId[id]))
  // Колонку 1/2 не рисуем — полуфиналисты сходятся прямо к центру (финалисты в кубке).

  return (
    <div className={`kb-side ${side === 'right' ? 'kb-mirror' : ''}`}>
      <Col cells={teamCells} kind="team" />
      <Col cells={r32w} kind="win" />
      <Col cells={r16w} kind="win" />
      <Col cells={qfw} kind="win" />
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
          padding: '16px 4px 10px',
          overflow: 'hidden',
          marginLeft: -16,   // full-bleed: выходим за padding страницы (px-4)
          marginRight: -16,
        }}
      >
        <div className="kb-root">
          <Half side="left" byId={byId} />

          <div className="kb-center">
            {champion ? (
              <div className="kb-champ">
                <span className="kb-crown">👑</span>
                <span className="kb-flag" style={{ fontSize: 34 }}>{flagOf(champion)}</span>
              </div>
            ) : (
              <div className="kb-fin-row">
                <span className="kb-fin">{leftFinalist ? <span className="kb-flag">{flagOf(leftFinalist)}</span> : <span className="kb-dot" />}</span>
                <span className="kb-fin">{rightFinalist ? <span className="kb-flag">{flagOf(rightFinalist)}</span> : <span className="kb-dot" />}</span>
              </div>
            )}
            <img src={CUP} alt="Кубок мира" className="kb-cup" />
            <span className="kb-final-label">Финал</span>
          </div>

          <Half side="right" byId={byId} />
        </div>

        <div className="kb-stage-row">
          <span>1/16</span><span>1/8</span><span>1/4</span><span>1/2</span>
          <span className="kb-stage-cup">Кубок</span>
          <span>1/2</span><span>1/4</span><span>1/8</span><span>1/16</span>
        </div>
      </div>

      <style>{`
        .kb-root {
          display: flex; align-items: stretch; justify-content: center;
          height: 520px; --kb-line: rgba(201,168,0,0.5); --kb-gap: 6px;
        }
        .kb-side { display: flex; flex: 0 0 auto; }
        .kb-mirror { transform: scaleX(-1); }
        .kb-mirror .kb-flag { display: inline-block; transform: scaleX(-1); }

        .kb-col {
          display: flex; flex-direction: column;
          margin-right: var(--kb-gap);
        }
        .kb-col-last { margin-right: 0; }
        .kb-cell {
          flex: 1 1 0; display: flex; align-items: center; justify-content: flex-start;
          position: relative; padding: 1px 0;
        }
        /* Горизонтальный отвод вправо у каждой ячейки, кроме последней колонки */
        .kb-col:not(.kb-col-last) .kb-cell::after {
          content: ''; position: absolute; left: 100%; top: 50%;
          width: var(--kb-gap); height: 2px; transform: translateY(-1px);
          background: var(--kb-line);
        }
        /* Вертикаль, соединяющая пару (верхняя ячейка пары → нижняя) */
        .kb-col:not(.kb-col-last) .kb-cell:nth-child(odd)::before {
          content: ''; position: absolute; left: calc(100% + var(--kb-gap) - 1px);
          top: 50%; height: 100%; width: 2px; background: var(--kb-line);
        }

        .kb-pill {
          display: flex; align-items: center; justify-content: center;
          width: 42px; height: 32px; flex-shrink: 0;
          background: #FFFFFF; border: 1px solid rgba(0,0,0,0.12);
          border-radius: 9px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .kb-win {
          display: flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          background: #FFFFFF; border: 1.5px solid #C9A800; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .kb-win .kb-flag { font-size: 13px; }
        .kb-flag { font-size: 28px; line-height: 1; }
        .kb-tbd { width: 16px; height: 4px; border-radius: 2px; background: rgba(0,0,0,0.12); }
        .kb-dot { width: 9px; height: 9px; border-radius: 50%; border: 2px dashed rgba(0,0,0,0.16); flex-shrink: 0; }

        .kb-center {
          flex: 0 0 auto; width: 92px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px; padding: 0 2px;
        }
        .kb-cup { width: 60px; height: auto; filter: drop-shadow(0 3px 6px rgba(201,168,0,0.45)); }
        .kb-final-label {
          font-size: 9px; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.1em; color: #C9A800;
        }
        .kb-fin-row { display: flex; gap: 8px; }
        .kb-fin {
          width: 34px; height: 26px; display: flex; align-items: center; justify-content: center;
          background: #FFFFFF; border: 1px solid rgba(201,168,0,0.4); border-radius: 8px;
        }
        .kb-fin .kb-flag { font-size: 22px; }
        .kb-champ { display: flex; flex-direction: column; align-items: center; }
        .kb-crown { font-size: 18px; line-height: 1; }

        .kb-stage-row {
          display: flex; align-items: center; margin-top: 8px;
          font-size: 8px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9CA3AF;
        }
        .kb-stage-row > span { flex: 1 1 0; text-align: center; }
        .kb-stage-cup { color: #C9A800 !important; flex: 0 0 auto !important; width: 92px; }
      `}</style>
    </section>
  )
}

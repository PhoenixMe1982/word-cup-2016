import { useState } from 'react'
import { TEAMS, KNOCKOUT_LAYOUT } from '../data.js'
import { useLiveData } from '../LiveDataContext.jsx'

// Классическая сетка плей-офф «периферия → центр» (как на афише). Команды — ТОЛЬКО
// флаги; будущие раунды показаны пустыми ячейками-плейсхолдерами, заполняются
// победителями по мере резолва. Сплошные дорожки-коннекторы; растягивается по
// ширине экрана (колонки раундов фиксированы, колонки-коннекторы тянутся flex'ом).
// Тап по сетке открывает её на весь экран (увеличенный режим .kb-fs).

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

// Колонка раунда: фикс. ширина (из CSS), ячейки flex:1 — центры выстраиваются для пар.
function RoundCol({ cells, kind }) {
  const team = kind === 'team'
  return (
    <div className={team ? 'kb-rcol kb-rcol-team' : 'kb-rcol kb-rcol-slot'}>
      {cells.map((c, i) => {
        const code = team ? c.code : c
        return (
          <div className="kb-rcell" key={i}>
            <div
              className={`kb-box ${team ? 'kb-box-team' : 'kb-box-slot'}`}
              style={team && c.dim ? { opacity: 0.32 } : undefined}
            >
              {code ? <span className={team ? 'kb-flag' : 'kb-flag kb-flag-sm'}>{flagOf(code)}</span> : null}
            </div>
          </div>
        )
      })}
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

function FinBox({ code, sm }) {
  return (
    <div className={`kb-finbox ${sm ? 'kb-finbox-sm' : ''}`}>
      {code ? <span className="kb-flag kb-flag-sm">{flagOf(code)}</span> : null}
    </div>
  )
}

// Тело сетки (обе половины + центр + подписи стадий) — переиспользуется в карточке
// и в полноэкранном режиме.
function BracketGrid({ byId }) {
  const leftFinalist = winnerCode(byId[L.left.sf[0]])
  const rightFinalist = winnerCode(byId[L.right.sf[0]])
  const champion = winnerCode(byId[L.final])
  const bronze = byId[L.bronze] || {}

  return (
    <>
      <div className="kb-root">
        <Half side="left" byId={byId} />

        <div className="kb-center">
          <div className="kb-fin-wrap">
            <FinBox code={leftFinalist} />
            <div className="kb-cup-col">
              {champion && <span className="kb-crown">👑</span>}
              <img src={CUP} alt="Кубок мира" className="kb-cup" />
              <span className="kb-final-label">Финал</span>
            </div>
            <FinBox code={rightFinalist} />
          </div>

          <div className="kb-bronze">
            <span className="kb-bronze-label">За 3-е место</span>
            <div className="kb-bronze-row">
              <FinBox code={bronze.home} sm />
              <FinBox code={bronze.away} sm />
            </div>
          </div>
        </div>

        <Half side="right" byId={byId} />
      </div>

      <div className="kb-stage-row">
        <span>1/16</span><span>1/8</span><span>1/4</span><span>1/2</span>
        <span className="kb-stage-cup">Кубок</span>
        <span>1/2</span><span>1/4</span><span>1/8</span><span>1/16</span>
      </div>
    </>
  )
}

export default function PlayoffBracket({ onOpen }) {
  const { matches } = useLiveData()
  const [fs, setFs] = useState(false)
  const byId = {}
  for (const m of matches) byId[m.id] = m

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
        onClick={() => setFs(true)}
        className="cursor-pointer relative"
        style={{
          background: 'linear-gradient(180deg,#FFFFFF 0%,#FFFDF5 100%)',
          borderTop: '1px solid rgba(201,168,0,0.25)',
          borderBottom: '1px solid rgba(201,168,0,0.25)',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          padding: '16px 4px 12px',
          overflow: 'hidden',
          marginLeft: -16,   // full-bleed: выходим за padding страницы (px-4)
          marginRight: -16,
        }}
      >
        <BracketGrid byId={byId} />
        {/* Подсказка про полноэкранный просмотр */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full pointer-events-none"
          style={{ background: 'rgba(201,168,0,0.14)', color: '#C9A800' }}
        >
          <span className="text-[9px] font-black uppercase tracking-wide whitespace-nowrap">⤢ Нажми — на весь экран</span>
        </div>
      </div>

      {/* Полноэкранный просмотр сетки */}
      {fs && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(17,24,39,0.96)', backdropFilter: 'blur(2px)' }}
          onClick={() => setFs(false)}
        >
          <div className="flex items-center justify-between px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 8 }}>
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: '#FFFFFF' }}>🏆 Сетка плей-офф</span>
            <button
              onClick={() => setFs(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-4" onClick={(e) => e.stopPropagation()}>
            <div
              className="kb-fs"
              style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 4px 10px', minHeight: '100%' }}
            >
              <BracketGrid byId={byId} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kb-root {
          display: flex; align-items: stretch; width: 100%;
          height: 540px; --kb-line: rgba(201,168,0,0.6);
        }
        .kb-side { flex: 1 1 0; display: flex; min-width: 0; }
        .kb-mirror { transform: scaleX(-1); }
        .kb-mirror .kb-flag { display: inline-block; transform: scaleX(-1); }

        .kb-rcol { flex: 0 0 auto; display: flex; flex-direction: column; }
        .kb-rcol-team { width: 40px; }
        .kb-rcol-slot { width: 24px; }
        .kb-rcell { flex: 1 1 0; display: flex; align-items: center; justify-content: center; min-height: 0; }
        .kb-box {
          width: 100%; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.12);
          border-radius: 7px; box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          display: flex; align-items: center; justify-content: center;
        }
        .kb-box-team { height: 30px; }
        .kb-box-slot { height: 22px; border-style: dashed; border-color: rgba(201,168,0,0.4); background: rgba(255,253,245,0.7); }
        .kb-flag { font-size: 27px; line-height: 1; }
        .kb-flag-sm { font-size: 14px; }

        /* Колонки-коннекторы тянутся по ширине → схема заполняет экран */
        .kb-ccol { flex: 1 1 0; min-width: 6px; display: flex; flex-direction: column; }
        .kb-elbow { flex: 1 1 0; position: relative; }
        .kb-elbow i { position: absolute; background: var(--kb-line); }
        .e-t { left: 0; top: 25%; width: 50%; height: 2px; transform: translateY(-1px); }
        .e-b { left: 0; top: 75%; width: 50%; height: 2px; transform: translateY(-1px); }
        .e-v { left: calc(50% - 1px); top: 25%; height: 50%; width: 2px; }
        .e-o { left: 50%; top: 50%; width: 50%; height: 2px; transform: translateY(-1px); }

        .kb-center {
          flex: 0 0 auto; width: 96px; position: relative; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
        }
        .kb-fin-wrap { display: flex; align-items: center; justify-content: center; gap: 3px; }
        .kb-cup-col { display: flex; flex-direction: column; align-items: center; position: relative; }
        .kb-crown { position: absolute; top: -14px; font-size: 16px; line-height: 1; z-index: 2; }
        .kb-cup { width: 40px; height: auto; filter: drop-shadow(0 3px 6px rgba(201,168,0,0.45)); }
        .kb-final-label {
          font-size: 9px; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.08em; color: #C9A800; margin-top: 2px;
        }
        .kb-finbox {
          width: 24px; height: 22px; flex-shrink: 0;
          background: #FFFFFF; border: 1px solid rgba(201,168,0,0.45); border-radius: 7px;
          display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .kb-finbox-sm { width: 22px; height: 18px; border-style: dashed; }

        .kb-bronze {
          position: absolute; bottom: 4px; left: 0; right: 0;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .kb-bronze-label { font-size: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #9CA3AF; }
        .kb-bronze-row { display: flex; gap: 4px; }

        .kb-stage-row {
          display: flex; align-items: center; margin-top: 12px;
          font-size: 8px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9CA3AF;
        }
        .kb-stage-row > span { flex: 1 1 0; text-align: center; }
        .kb-stage-cup { color: #C9A800 !important; flex: 0 0 auto !important; width: 96px; }

        /* ── Полноэкранный режим: всё крупнее ─────────────────────────────── */
        .kb-fs .kb-root { height: calc(100vh - 150px); min-height: 540px; --kb-line: rgba(201,168,0,0.7); }
        .kb-fs .kb-rcol-team { width: 56px; }
        .kb-fs .kb-rcol-slot { width: 34px; }
        .kb-fs .kb-box-team { height: 40px; }
        .kb-fs .kb-box-slot { height: 30px; }
        .kb-fs .kb-flag { font-size: 38px; }
        .kb-fs .kb-flag-sm { font-size: 20px; }
        .kb-fs .kb-elbow i { background: var(--kb-line); }
        .kb-fs .e-t, .kb-fs .e-b, .kb-fs .e-o { height: 3px; }
        .kb-fs .e-v { width: 3px; }
        .kb-fs .kb-center { width: 130px; }
        .kb-fs .kb-cup { width: 60px; }
        .kb-fs .kb-finbox { width: 34px; height: 30px; }
        .kb-fs .kb-finbox-sm { width: 30px; height: 24px; }
        .kb-fs .kb-final-label { font-size: 12px; }
        .kb-fs .kb-bronze-label { font-size: 10px; }
        .kb-fs .kb-stage-row { font-size: 11px; margin-top: 14px; }
        .kb-fs .kb-stage-cup { width: 130px; }
      `}</style>
    </section>
  )
}

import { useState, useMemo } from 'react'
import { ALL_TIME_TEAMS, SQUADS } from '../data/teamsData.js'

function pts(t) { return t.wc.w * 3 + t.wc.d }

const POS_ORDER = { GK: 0, DF: 1, MF: 2, FW: 3 }
const POS_LABEL = { GK: 'Вратари', DF: 'Защитники', MF: 'Полузащитники', FW: 'Нападающие' }
const POS_COLOR = { GK: '#facc15', DF: '#60a5fa', MF: '#4ade80', FW: '#f87171' }

function TeamDetail({ team, onBack }) {
  const squad = SQUADS[team.id]
  const p = team.wc.w + team.wc.d + team.wc.l
  const wcPts = pts(team)

  const grouped = useMemo(() => {
    if (!squad) return {}
    const g = {}
    squad.players.forEach((pl) => {
      const pos = pl.pos || 'FW'
      if (!g[pos]) g[pos] = []
      g[pos].push(pl)
    })
    return g
  }, [squad])

  return (
    <div className="page-content tab-transition">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded"
          style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)' }}
        >
          <span style={{ color: '#FFD700', fontSize: 16 }}>‹</span>
        </button>
        <span className="text-sm font-semibold" style={{ color: '#9ca3af' }}>Сборные</span>
      </div>

      <div className="mx-4 mb-4 p-4 rounded" style={{ background: '#161c2e', border: '1px solid rgba(255,215,0,0.3)' }}>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            {team.emblem ? (
              <img
                src={team.emblem}
                alt={team.name}
                className="w-16 h-16 object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <div
              className="w-16 h-16 items-center justify-center text-5xl"
              style={{ display: team.emblem ? 'none' : 'flex' }}
            >
              {team.flag}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{team.flag} {team.name}</div>
            {team.debut2026 && (
              <span className="mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.35)' }}>
                ДЕБЮТ ЧМ 2026
              </span>
            )}
            {team.defunct && (
              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.2)' }}>
                Историческая сборная
              </span>
            )}
            {squad && (
              <div className="mt-1 text-xs" style={{ color: '#9ca3af' }}>
                Тренер: <span className="text-white font-medium">{squad.coach}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!team.debut2026 && (
        <div className="mx-4 mb-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            История на ЧМ
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Участий', val: team.wc.p },
              { label: 'Матчей',  val: p },
              { label: 'Очки',    val: wcPts, gold: true },
              { label: 'Победы',  val: team.wc.w, color: '#4ade80' },
              { label: 'Ничьи',   val: team.wc.d, color: '#facc15' },
              { label: 'Поражения',val:team.wc.l, color: '#f87171' },
              { label: 'Голы',    val: team.wc.gf, color: '#00e5ff' },
              { label: 'Пропущено',val:team.wc.ga, color: '#9ca3af' },
              { label: 'Разница', val: team.wc.gf - team.wc.ga, color: team.wc.gf >= team.wc.ga ? '#4ade80' : '#f87171' },
            ].map(({ label, val, gold, color }) => (
              <div key={label} className="p-2 rounded text-center" style={{ background: '#0f1728', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-base font-bold score-number"
                  style={{ color: gold ? '#FFD700' : (color || 'white') }}>
                  {val}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: '#6b7280' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {squad ? (
        <div className="mx-4 mb-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9ca3af' }}>
            Состав на ЧМ 2026 (прогноз)
          </div>
          {Object.keys(POS_ORDER)
            .filter((pos) => grouped[pos]?.length > 0)
            .map((pos) => (
              <div key={pos} className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: `${POS_COLOR[pos]}22`, color: POS_COLOR[pos], border: `1px solid ${POS_COLOR[pos]}44` }}>
                    {POS_LABEL[pos]}
                  </span>
                </div>
                <div className="space-y-1">
                  {grouped[pos].map((pl, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded"
                      style={{ background: '#0f1728', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-5 text-center"
                          style={{ color: POS_COLOR[pos] }}>
                          {pos}
                        </span>
                        <span className="text-sm text-white">{pl.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#6b7280' }}>{pl.club}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="mx-4 mb-4 p-4 rounded text-center" style={{ background: '#0f1728', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm" style={{ color: '#6b7280' }}>Состав не объявлен</div>
        </div>
      )}
    </div>
  )
}

export default function Teams() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('pts')
  const [selectedTeam, setSelectedTeam] = useState(null)

  const sorted = useMemo(() => {
    return [...ALL_TIME_TEAMS].sort((a, b) => {
      if (sortKey === 'pts') return pts(b) - pts(a)
      if (sortKey === 'p')   return b.wc.p - a.wc.p
      const ma = a.wc.w + a.wc.d + a.wc.l
      const mb = b.wc.w + b.wc.d + b.wc.l
      return mb - ma
    })
  }, [sortKey])

  const filtered = useMemo(() => {
    let list = sorted
    if (filter === '2026') list = list.filter((t) => t.in2026)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.name.toLowerCase().includes(q))
    }
    return list
  }, [sorted, filter, search])

  if (selectedTeam) {
    return <TeamDetail team={selectedTeam} onBack={() => setSelectedTeam(null)} />
  }

  return (
    <div className="page-content tab-transition">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-white">Сборные мира</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
          Все участники финальных стадий ЧМ — {ALL_TIME_TEAMS.length} сборных
        </p>
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6b7280' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск сборной..."
            className="w-full pl-8 pr-3 py-2 text-sm text-white rounded outline-none"
            style={{ background: '#161c2e', border: '1px solid rgba(255,215,0,0.2)' }}
          />
        </div>
      </div>

      <div className="px-4 mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {[['all', 'Все'], ['2026', 'ЧМ 2026']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className="px-3 py-1 text-xs font-semibold rounded transition-all"
              style={filter === v
                ? { background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.4)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[10px]" style={{ color: '#6b7280' }}>Сорт.:</span>
          {[['pts','Очки'], ['p','Участий'], ['m','Матчей']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSortKey(v)}
              className="px-2 py-1 text-[10px] font-semibold rounded transition-all"
              style={sortKey === v
                ? { background: 'rgba(0,229,255,0.12)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-1">
        <div className="grid text-[9px] font-semibold uppercase tracking-wider px-2 py-1"
          style={{ color: '#6b7280', gridTemplateColumns: '24px 1fr 36px 24px 36px 36px 36px 40px' }}>
          <span>#</span>
          <span>Сборная</span>
          <span className="text-center">ЧМ</span>
          <span className="text-center">М</span>
          <span className="text-center">В</span>
          <span className="text-center">Н</span>
          <span className="text-center">Г</span>
          <span className="text-right" style={{ color: '#FFD700' }}>Очки</span>
        </div>
      </div>

      <div className="mx-4 space-y-0.5 mb-4">
        {filtered.map((team) => {
          const rank = sorted.indexOf(team) + 1
          const isActive = team.in2026 && !team.defunct
          const matches = team.wc.w + team.wc.d + team.wc.l
          const teamPts = pts(team)

          return (
            <div
              key={team.id}
              onClick={() => isActive && setSelectedTeam(team)}
              className="grid items-center px-2 py-2 rounded"
              style={{
                gridTemplateColumns: '24px 1fr 36px 24px 36px 36px 36px 40px',
                background: isActive ? '#0f1728' : 'rgba(15,23,40,0.4)',
                border: isActive ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.03)',
                opacity: isActive ? 1 : 0.45,
                cursor: isActive ? 'pointer' : 'default',
              }}
            >
              <span className="text-[10px] font-bold text-center"
                style={{ color: rank <= 3 ? '#FFD700' : '#6b7280' }}>
                {rank}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none flex-shrink-0">{team.flag}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: isActive ? 'white' : '#9ca3af' }}>
                    {team.name}{team.defunct && <span className="ml-1 text-[9px]" style={{ color: '#6b7280' }}>†</span>}
                  </div>
                  {team.debut2026 && <span className="text-[8px] font-bold" style={{ color: '#00ff88' }}>ДЕБЮТ</span>}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#9ca3af' }}>{team.wc.p}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#9ca3af' }}>{matches}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#4ade80' }}>{team.wc.w}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#facc15' }}>{team.wc.d}</span>
              <span className="text-[10px] text-center score-number" style={{ color: '#9ca3af' }}>{team.wc.gf}:{team.wc.ga}</span>
              <span className="text-sm font-bold text-right score-number"
                style={{ color: teamPts > 0 ? '#FFD700' : '#4b5563' }}>{teamPts}</span>
            </div>
          )
        })}
      </div>

      <div className="mx-4 mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px]" style={{ color: '#6b7280' }}>
        <span>ЧМ — участий &nbsp; М — матчей &nbsp; <span style={{color:'#4ade80'}}>В</span> победы &nbsp; <span style={{color:'#facc15'}}>Н</span> ничьи &nbsp; Г — голы &nbsp; † историческая</span>
      </div>
    </div>
  )
}

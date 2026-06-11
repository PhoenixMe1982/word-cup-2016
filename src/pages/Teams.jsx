import { useState, useMemo } from 'react'
import { ALL_TIME_TEAMS, SQUADS } from '../data/teamsData.js'
import { useLiveData } from '../LiveDataContext.jsx'

function pts(t) { return t.wc.w * 3 + t.wc.d }

// Историческая статистика + завершённые матчи текущего ЧМ-2026
function applyCurrentResults(matches) {
  const teams = ALL_TIME_TEAMS.map(t => ({ ...t, wc: { ...t.wc } }))
  const byId = Object.fromEntries(teams.map(t => [t.id, t]))

  for (const m of matches || []) {
    if (m.status !== 'finished' || m.scoreHome == null || m.scoreAway == null) continue
    const h = byId[m.home]
    const a = byId[m.away]
    if (h) {
      h.wc.gf += m.scoreHome; h.wc.ga += m.scoreAway
      if (m.scoreHome > m.scoreAway) h.wc.w++
      else if (m.scoreHome < m.scoreAway) h.wc.l++
      else h.wc.d++
    }
    if (a) {
      a.wc.gf += m.scoreAway; a.wc.ga += m.scoreHome
      if (m.scoreAway > m.scoreHome) a.wc.w++
      else if (m.scoreAway < m.scoreHome) a.wc.l++
      else a.wc.d++
    }
  }
  return teams
}

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
          style={{ background: 'rgba(201,168,0,0.10)', border: '1px solid rgba(201,168,0,0.25)' }}
        >
          <span style={{ color: '#C9A800', fontSize: 16 }}>‹</span>
        </button>
        <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>Сборные</span>
      </div>

      <div className="mx-4 mb-4 p-4 rounded" style={{ background: '#FFFFFF', border: '1px solid rgba(201,168,0,0.25)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
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
            <div className="text-xl font-bold" style={{ color: '#111827' }}>{team.flag} {team.name}</div>
            {team.debut2026 && (
              <span className="mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)' }}>
                ДЕБЮТ ЧМ 2026
              </span>
            )}
            {team.defunct && (
              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(156,163,175,0.10)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.2)' }}>
                Историческая сборная
              </span>
            )}
            {squad && (
              <div className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                Тренер: <span className="font-medium" style={{ color: '#111827' }}>{squad.coach}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!team.debut2026 && (
        <div className="mx-4 mb-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            История на ЧМ
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Участий', val: team.wc.p },
              { label: 'Матчей',  val: p },
              { label: 'Очки',    val: wcPts, gold: true },
              { label: 'Победы',  val: team.wc.w, color: '#16A34A' },
              { label: 'Ничьи',   val: team.wc.d, color: '#C9A800' },
              { label: 'Поражения',val:team.wc.l, color: '#DC2626' },
              { label: 'Голы',    val: team.wc.gf, color: '#0EA5E9' },
              { label: 'Пропущено',val:team.wc.ga, color: '#9CA3AF' },
              { label: 'Разница', val: team.wc.gf - team.wc.ga, color: team.wc.gf >= team.wc.ga ? '#16A34A' : '#DC2626' },
            ].map(({ label, val, gold, color }) => (
              <div key={label} className="p-2 rounded text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="text-base font-bold score-number"
                  style={{ color: gold ? '#C9A800' : (color || '#111827') }}>
                  {val}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: '#9CA3AF' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {squad ? (
        <div className="mx-4 mb-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
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
                      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-5 text-center"
                          style={{ color: POS_COLOR[pos] }}>
                          {pos}
                        </span>
                        <span className="text-sm" style={{ color: '#111827' }}>{pl.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{pl.club}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="mx-4 mb-4 p-4 rounded text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="text-sm" style={{ color: '#9CA3AF' }}>Состав не объявлен</div>
        </div>
      )}
    </div>
  )
}

export default function Teams() {
  const { matches } = useLiveData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('pts')
  const [selectedTeam, setSelectedTeam] = useState(null)

  const allTeams = useMemo(() => applyCurrentResults(matches), [matches])

  const sorted = useMemo(() => {
    return [...allTeams].sort((a, b) => {
      if (sortKey === 'pts') return pts(b) - pts(a)
      if (sortKey === 'p')   return b.wc.p - a.wc.p
      const ma = a.wc.w + a.wc.d + a.wc.l
      const mb = b.wc.w + b.wc.d + b.wc.l
      return mb - ma
    })
  }, [allTeams, sortKey])

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
        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Сборные мира</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
          Все участники финальных стадий ЧМ — {allTeams.length} сборных
        </p>
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9CA3AF' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск сборной..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded outline-none"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.12)', color: '#111827' }}
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
                ? { background: 'rgba(201,168,0,0.15)', color: '#C9A800', border: '1px solid rgba(201,168,0,0.35)' }
                : { background: 'rgba(0,0,0,0.05)', color: '#6B7280', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Сорт.:</span>
          {[['pts','Очки'], ['p','Участий'], ['m','Матчей']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSortKey(v)}
              className="px-2 py-1 text-[10px] font-semibold rounded transition-all"
              style={sortKey === v
                ? { background: 'rgba(14,165,233,0.12)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.3)' }
                : { background: 'rgba(0,0,0,0.04)', color: '#6B7280', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-1">
        <div className="grid text-[9px] font-semibold uppercase tracking-wider px-2 py-1"
          style={{ color: '#9CA3AF', gridTemplateColumns: '24px 1fr 36px 24px 36px 36px 36px 40px' }}>
          <span>#</span>
          <span>Сборная</span>
          <span className="text-center">ЧМ</span>
          <span className="text-center">М</span>
          <span className="text-center">В</span>
          <span className="text-center">Н</span>
          <span className="text-center">Г</span>
          <span className="text-right" style={{ color: '#C9A800' }}>Очки</span>
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
                background: isActive ? '#FFFFFF' : 'rgba(0,0,0,0.03)',
                border: isActive ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(0,0,0,0.04)',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                opacity: isActive ? 1 : 0.5,
                cursor: isActive ? 'pointer' : 'default',
              }}
            >
              <span className="text-[10px] font-bold text-center"
                style={{ color: rank <= 3 ? '#C9A800' : '#9CA3AF' }}>
                {rank}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none flex-shrink-0">{team.flag}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: isActive ? '#111827' : '#9CA3AF' }}>
                    {team.name}{team.defunct && <span className="ml-1 text-[9px]" style={{ color: '#9CA3AF' }}>†</span>}
                  </div>
                  {team.debut2026 && <span className="text-[8px] font-bold" style={{ color: '#16A34A' }}>ДЕБЮТ</span>}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#9CA3AF' }}>{team.wc.p}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#9CA3AF' }}>{matches}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#16A34A' }}>{team.wc.w}</span>
              <span className="text-[11px] font-semibold text-center score-number" style={{ color: '#C9A800' }}>{team.wc.d}</span>
              <span className="text-[10px] text-center score-number" style={{ color: '#9CA3AF' }}>{team.wc.gf}:{team.wc.ga}</span>
              <span className="text-sm font-bold text-right score-number"
                style={{ color: teamPts > 0 ? '#C9A800' : '#9CA3AF' }}>{teamPts}</span>
            </div>
          )
        })}
      </div>

      <div className="mx-4 mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px]" style={{ color: '#9CA3AF' }}>
        <span>ЧМ — участий &nbsp; М — матчей &nbsp; <span style={{color:'#16A34A'}}>В</span> победы &nbsp; <span style={{color:'#C9A800'}}>Н</span> ничьи &nbsp; Г — голы &nbsp; † историческая</span>
      </div>
    </div>
  )
}

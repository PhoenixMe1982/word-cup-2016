// Второй источник результатов: API-Football (v3.football.api-sports.io).
// Двухисточниковый гейт: итог от football-data.org фиксируется только после
// подтверждения здесь; если FD отдаёт мусор (кейсы m83/m88), а API-Football
// имеет полный валидный итог — зачитываем по нему. Ключ: env APIFOOTBALL_KEY
// (нет ключа ⇒ модуль выключен, поведение прежнее).
//
// КВИРК Free-тарифа: запрос league+season по сезону 2026 заблокирован
// («try from 2022 to 2024»), НО запрос по дате (fixtures?date=YYYY-MM-DD)
// работает и содержит матчи ЧМ (league.id=1). Ходим по дате начала матча
// (UTC, из utcDate FD) и фильтруем лигу. 1 ответ = все матчи дня = 1 запрос.
//
// Схема счёта API-Football (проверено на живых данных 2026-07-03, m88):
//   goals            — финальный игровой счёт (120′ при ОТ/серии, без голов серии)
//   score.fulltime   — счёт за 90 минут
//   score.extratime  — голы, забитые ИМЕННО в доп. время (не кумулятив)
//   score.penalty    — счёт серии пенальти
//   fixture.status.short: FT (90′) | AET (после ОТ) | PEN (после серии)
//   teams.home/away.winner: true у прошедшего (null:null при ничьей в группе)

const { lookupMatchId, isKnockoutMatchId, extractFinalResult } = require('./match-lookup.js')

const AF_LEAGUE_WC = 1
const AF_KEY = () => (process.env.APIFOOTBALL_KEY || '').trim()

function afEnabled() { return !!AF_KEY() }

// Имена сборных у API-Football → наши TLA. Неизвестное имя ⇒ матч не маппится
// ⇒ сверка «нет данных» ⇒ матч удерживается (безопасный отказ). Варианты
// написания добавлены защитно.
const AF_NAME_TO_TLA = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Korea Republic': 'KOR',
  'Czech Republic': 'CZE', 'Czechia': 'CZE', 'Canada': 'CAN',
  'Bosnia & Herzegovina': 'BIH', 'Bosnia and Herzegovina': 'BIH',
  'USA': 'USA', 'United States': 'USA', 'Paraguay': 'PAR', 'Qatar': 'QAT',
  'Switzerland': 'SUI', 'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI',
  'Scotland': 'SCO', 'Australia': 'AUS', 'Turkey': 'TUR', 'Türkiye': 'TUR',
  'Germany': 'GER', 'Curacao': 'CUW', 'Curaçao': 'CUW', 'Netherlands': 'NED',
  'Japan': 'JPN', 'Ivory Coast': 'CIV', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU',
  'Sweden': 'SWE', 'Tunisia': 'TUN', 'Spain': 'ESP',
  'Cape Verde Islands': 'CPV', 'Cape Verde': 'CPV', 'Belgium': 'BEL', 'Egypt': 'EGY',
  'Saudi Arabia': 'KSA', 'Uruguay': 'URU', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'Congo DR': 'COD', 'DR Congo': 'COD', 'England': 'ENG',
  'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN', 'Uzbekistan': 'UZB',
  'Colombia': 'COL',
}

// Разворот сторон результата (AF может отдать пару зеркально нашему MATCH_LOOKUP).
function flipResult(r) {
  const out = { ...r, home: r.away, away: r.home }
  if (r.reg) out.reg = { home: r.reg.away, away: r.reg.home }
  if (r.et) out.et = { home: r.et.away, away: r.et.home }
  if (r.penHome != null) { out.penHome = r.penAway; out.penAway = r.penHome }
  if (r.winner === 'HOME_TEAM') out.winner = 'AWAY_TEAM'
  else if (r.winner === 'AWAY_TEAM') out.winner = 'HOME_TEAM'
  return out
}

// Fixture API-Football → { matchId, result } либо null (не наш матч / не завершён /
// итог не проходит единый гейт). Результат — в НАШЕЙ ориентации home/away.
// Валидация — тем же extractFinalResult, что и для FD: одни правила для всех.
function afParseFixture(f) {
  const st = f?.fixture?.status?.short
  if (st !== 'FT' && st !== 'AET' && st !== 'PEN') return null
  const hTLA = AF_NAME_TO_TLA[f?.teams?.home?.name]
  const aTLA = AF_NAME_TO_TLA[f?.teams?.away?.name]
  if (!hTLA || !aTLA) return null
  let matchId = lookupMatchId(hTLA, aTLA)
  let swapped = false
  if (!matchId) {
    matchId = lookupMatchId(aTLA, hTLA)
    if (!matchId) return null
    swapped = true
  }

  const score = {
    fullTime: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
    duration: st === 'PEN' ? 'PENALTY_SHOOTOUT' : st === 'AET' ? 'EXTRA_TIME' : 'REGULAR',
  }
  if (f.score?.fulltime?.home != null) score.regularTime = { home: f.score.fulltime.home, away: f.score.fulltime.away }
  if (f.score?.extratime?.home != null) score.extraTime = { home: f.score.extratime.home, away: f.score.extratime.away }
  if (f.score?.penalty?.home != null) score.penalties = { home: f.score.penalty.home, away: f.score.penalty.away }
  if (f.teams?.home?.winner) score.winner = 'HOME_TEAM'
  else if (f.teams?.away?.winner) score.winner = 'AWAY_TEAM'

  const stage = isKnockoutMatchId(matchId) ? 'LAST_16' : 'GROUP_STAGE'
  let result = extractFinalResult({ status: 'FINISHED', stage, score })
  if (!result) return null
  if (swapped) result = flipResult(result)
  return { matchId, result }
}

// Согласие двух источников. Цифры серии пенальти НЕ сравниваем (FD на сериях
// врёт по счёту серии) — при зачёте берём их из AF (см. поллер).
function afAgrees(fd, af) {
  if (!fd || !af) return false
  if (fd.home !== af.home || fd.away !== af.away) return false
  if (fd.knockout) {
    if ((fd.winner || null) !== (af.winner || null)) return false
    if (fd.reg && af.reg && (fd.reg.home !== af.reg.home || fd.reg.away !== af.reg.away)) return false
    if (fd.et && af.et && (fd.et.home !== af.et.home || fd.et.away !== af.et.away)) return false
    // ОТ у одного источника есть, у другого нет — расхождение по ходу матча.
    if (!!fd.et !== !!af.et) return false
  }
  return true
}

// ── Сеть: кэш по дню + дневной бюджет ────────────────────────────────────────
// Аккаунт api-sports сейчас Pro (7500 req/день). Держим потолок 5000 с запасом
// (поллер каждые 5 мин × окно 3 дня ≈ 864/день, + сверки/скореры). Кэш 4 мин.
const dayCache = new Map() // dateStr → { at, fixtures|null }
const CACHE_MS = 4 * 60 * 1000
let budget = { date: '', used: 0 }

function takeBudget() {
  const d = new Date().toISOString().slice(0, 10)
  if (budget.date !== d) budget = { date: d, used: 0 }
  if (budget.used >= 5000) return false
  budget.used++
  return true
}

async function afFetchDay(dateStr) {
  const cached = dayCache.get(dateStr)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.fixtures
  if (!takeBudget()) return cached ? cached.fixtures : null
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateStr}&timezone=UTC`,
      { headers: { 'x-apisports-key': AF_KEY() } },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const errs = data.errors
    if (errs && !Array.isArray(errs) && Object.keys(errs).length > 0) {
      throw new Error(JSON.stringify(errs))
    }
    const fixtures = (data.response || []).filter((f) => f?.league?.id === AF_LEAGUE_WC)
    dayCache.set(dateStr, { at: Date.now(), fixtures })
    return fixtures
  } catch (e) {
    console.error(`[af] fixtures?date=${dateStr} failed:`, e.message)
    // Негативный кэш: не долбим API при ошибке, повтор через CACHE_MS.
    dayCache.set(dateStr, { at: Date.now(), fixtures: cached ? cached.fixtures : null })
    return cached ? cached.fixtures : null
  }
}

// Валидный итог матча по API-Football (в нашей ориентации) либо null.
// dateStr — дата НАЧАЛА матча по UTC (utcDate от FD, .slice(0,10)).
async function afGetResult(matchId, dateStr) {
  if (!afEnabled() || !dateStr) return null
  const fixtures = await afFetchDay(dateStr)
  if (!fixtures) return null
  for (const f of fixtures) {
    const parsed = afParseFixture(f)
    if (parsed && parsed.matchId === matchId) return parsed.result
  }
  return null
}

// ── AF как ПЕРВИЧНЫЙ источник состояния матча ────────────────────────────────
// Статусы API-Football (fixture.status.short):
//   идёт:     1H HT 2H ET BT P LIVE SUSP INT
//   завершён: FT AET PEN
//   иначе (NS TBD PST CANC ABD AWD WO) → трактуем как «ещё не идёт» (upcoming).
const AF_LIVE_ST = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT'])
const AF_FIN_ST = new Set(['FT', 'AET', 'PEN'])

// Полное состояние матча по одной фикстуре AF (в НАШЕЙ ориентации home/away):
//   { matchId, category:'live'|'finished'|'upcoming', statusShort, elapsed,
//     result?  — валидный итог (для finished, через тот же гейт extractFinalResult),
//     display? — живой счёт {home,away,phase,penHome?,penAway?} (для live) }
// null — если матч не наш (имена не маппятся). Категория 'finished' без валидного
// result оставляет result=null → поллер удержит матч (safe, как и для FD).
function afMatchState(f) {
  const st = f?.fixture?.status?.short
  const hTLA = AF_NAME_TO_TLA[f?.teams?.home?.name]
  const aTLA = AF_NAME_TO_TLA[f?.teams?.away?.name]
  if (!hTLA || !aTLA) return null
  let matchId = lookupMatchId(hTLA, aTLA)
  let swapped = false
  if (!matchId) { matchId = lookupMatchId(aTLA, hTLA); if (!matchId) return null; swapped = true }

  const category = AF_FIN_ST.has(st) ? 'finished' : AF_LIVE_ST.has(st) ? 'live' : 'upcoming'
  const out = { matchId, category, statusShort: st, elapsed: f?.fixture?.status?.elapsed ?? null }

  if (category === 'finished') {
    const parsed = afParseFixture(f) // валидирует тем же гейтом; учитывает swap
    out.result = parsed ? parsed.result : null
  } else if (category === 'live') {
    let home = f.goals?.home, away = f.goals?.away
    let penHome = f.score?.penalty?.home ?? null, penAway = f.score?.penalty?.away ?? null
    // Фаза по статусу: серия → pens; доп.время/перерыв ОТ → et; иначе основное.
    const phase = (st === 'P') ? 'pens' : (st === 'ET' || st === 'BT') ? 'et' : 'reg'
    if (home != null && away != null) {
      if (swapped) { const t = home; home = away; away = t; const p = penHome; penHome = penAway; penAway = p }
      out.display = { home, away, phase }
      if (penHome != null && penAway != null) { out.display.penHome = penHome; out.display.penAway = penAway }
    }
  }
  return out
}

// Карта matchId → afMatchState по окну дат (UTC, напр. [вчера, сегодня, завтра]).
// Кэш внутри afFetchDay (4 мин). null при выключенном AF.
async function afStateMap(dateStrs) {
  if (!afEnabled()) return null
  const map = {}
  let any = false
  for (const d of dateStrs) {
    const fixtures = await afFetchDay(d)
    if (!fixtures) continue
    any = true
    for (const f of fixtures) {
      const s = afMatchState(f)
      if (s) map[s.matchId] = s
    }
  }
  return any ? map : null
}

module.exports = {
  afEnabled, afGetResult, afAgrees, afParseFixture, AF_NAME_TO_TLA,
  afMatchState, afStateMap,
}

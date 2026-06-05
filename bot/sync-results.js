#!/usr/bin/env node
// Sync WC 2026 match results from football-data.org
// Runs every 5 min via GitHub Actions cron during the tournament

const FDORG_TOKEN = (process.env.FDORG_TOKEN || '').trim()
const BOT_TOKEN   = (process.env.BOT_TOKEN   || '').trim()
const ADMIN_ID    = (process.env.ADMIN_ID    || '').trim()
const API_URL     = (process.env.API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

if (!FDORG_TOKEN || !BOT_TOKEN) {
  console.error('[sync] FDORG_TOKEN and BOT_TOKEN are required')
  process.exit(1)
}

// ── Match lookup: (homeTLA_awayTLA) → our match ID ────────────────────────
// Matches exactly as defined in src/data.js MATCHES array
const MATCH_LOOKUP = {
  // Matchday 1
  'MEX_RSA': 'm01', 'KOR_CZE': 'm02', 'CAN_BIH': 'm03', 'USA_PAR': 'm04',
  'QAT_SUI': 'm05', 'BRA_MAR': 'm06', 'HAI_SCO': 'm07', 'AUS_TUR': 'm08',
  'GER_CUW': 'm09', 'NED_JPN': 'm10', 'CIV_ECU': 'm11', 'SWE_TUN': 'm12',
  'ESP_CPV': 'm13', 'BEL_EGY': 'm14', 'KSA_URU': 'm15', 'IRN_NZL': 'm16',
  'FRA_SEN': 'm17', 'IRQ_NOR': 'm18', 'ARG_ALG': 'm19', 'AUT_JOR': 'm20',
  'POR_COD': 'm21', 'ENG_CRO': 'm22', 'GHA_PAN': 'm23', 'UZB_COL': 'm24',
  // Matchday 2
  'CZE_RSA': 'm25', 'SUI_BIH': 'm26', 'CAN_QAT': 'm27', 'MEX_KOR': 'm28',
  'USA_AUS': 'm29', 'SCO_MAR': 'm30', 'BRA_HAI': 'm31', 'TUR_PAR': 'm32',
  'NED_SWE': 'm33', 'GER_CIV': 'm34', 'ECU_CUW': 'm35', 'TUN_JPN': 'm36',
  'ESP_KSA': 'm37', 'BEL_IRN': 'm38', 'URU_CPV': 'm39', 'NZL_EGY': 'm40',
  'ARG_AUT': 'm41', 'FRA_IRQ': 'm42', 'NOR_SEN': 'm43', 'JOR_ALG': 'm44',
  'POR_UZB': 'm45', 'ENG_GHA': 'm46', 'PAN_CRO': 'm47', 'COL_COD': 'm48',
  // Matchday 3
  'SUI_CAN': 'm49', 'BIH_QAT': 'm50', 'SCO_BRA': 'm51', 'MAR_HAI': 'm52',
  'CZE_MEX': 'm53', 'RSA_KOR': 'm54', 'ECU_GER': 'm55', 'CUW_CIV': 'm56',
  'JPN_SWE': 'm57', 'TUN_NED': 'm58', 'TUR_USA': 'm59', 'PAR_AUS': 'm60',
  'NOR_FRA': 'm61', 'SEN_IRQ': 'm62', 'CPV_KSA': 'm63', 'URU_ESP': 'm64',
  'EGY_IRN': 'm65', 'NZL_BEL': 'm66', 'PAN_ENG': 'm67', 'CRO_GHA': 'm68',
  'COL_POR': 'm69', 'COD_UZB': 'm70', 'ALG_AUT': 'm71', 'JOR_ARG': 'm72',
}

// football-data.org TLA → our code (handles any code mismatches)
const TLA_ALIASES = {
  'SAU': 'KSA',  // Saudi Arabia
  'DRC': 'COD',  // DR Congo
  'HTI': 'HAI',  // Haiti
  'CUR': 'CUW',  // Curaçao
  'CPV': 'CPV',  // Cape Verde (same)
}

function normTLA(tla) {
  return TLA_ALIASES[tla] || tla
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

async function fetchFDOrg(path) {
  const res = await fetch(`https://api.football-data.org/v4${path}`, {
    headers: { 'X-Auth-Token': FDORG_TOKEN },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data.org ${res.status}: ${body}`)
  }
  return res.json()
}

async function fetchCurrentResults() {
  const res = await fetch(`${API_URL}/api/results`)
  if (!res.ok) throw new Error(`GET /api/results → ${res.status}`)
  return res.json()
}

async function postScore(matchId, home, away) {
  const res = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': BOT_TOKEN },
    body: JSON.stringify({ matchId, home, away }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`POST /api/score ${matchId} → ${res.status}: ${body}`)
  }
  return res.json()
}

async function tgNotify(text) {
  if (!ADMIN_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_ID, text, parse_mode: 'Markdown' }),
    })
  } catch {}
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const ts = new Date().toISOString()
  console.log(`[sync] ${ts}`)

  // Fetch in parallel
  const [fdData, settled] = await Promise.all([
    fetchFDOrg('/competitions/WC/matches?status=FINISHED'),
    fetchCurrentResults(),
  ])

  const finished = fdData.matches || []
  const alreadySettled = Object.keys(settled).length
  console.log(`[sync] API: ${finished.length} finished | Redis: ${alreadySettled} settled`)

  const notifications = []

  for (const m of finished) {
    const homeTLA = normTLA(m.homeTeam?.tla || '')
    const awayTLA = normTLA(m.awayTeam?.tla || '')
    const key     = `${homeTLA}_${awayTLA}`
    const matchId = MATCH_LOOKUP[key]

    if (!matchId) {
      // Log only if teams are recognisable (might be a non-group stage match we don't track yet)
      if (homeTLA && awayTLA) {
        console.log(`[sync] No mapping: ${key} (${m.homeTeam?.name} vs ${m.awayTeam?.name})`)
      }
      continue
    }

    // Already in Redis → skip
    if (settled[matchId]) continue

    const homeScore = m.score?.fullTime?.home
    const awayScore = m.score?.fullTime?.away
    if (homeScore == null || awayScore == null) {
      console.warn(`[sync] ${matchId} has no fullTime score yet, skipping`)
      continue
    }

    console.log(`[sync] New result: ${matchId} ${key} → ${homeScore}:${awayScore}`)
    try {
      const res = await postScore(matchId, homeScore, awayScore)
      console.log(`[sync] ✅ ${matchId} settled, scored ${res.scored} predictions`)
      notifications.push(`⚽ *${m.homeTeam.name} ${homeScore}:${awayScore} ${m.awayTeam.name}*\nПрогнозов зачтено: ${res.scored}`)
    } catch (e) {
      console.error(`[sync] ❌ ${matchId}:`, e.message)
    }
  }

  // Notify admin in Telegram if any new results were settled
  if (notifications.length > 0) {
    const msg = `🏆 *Авто-синхронизация ЧМ 2026*\n\n${notifications.join('\n\n')}\n\n📊 Лидерборд обновлён`
    await tgNotify(msg)
    console.log(`[sync] Notified admin about ${notifications.length} new result(s)`)
  }

  console.log(`[sync] Done — ${notifications.length} new result(s) synced`)
}

main().catch(e => {
  console.error('[sync] Fatal:', e.message)
  process.exit(1)
})

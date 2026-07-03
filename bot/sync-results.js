#!/usr/bin/env node
// Sync WC 2026 match results from football-data.org
// Runs every 5 min via GitHub Actions cron during the tournament

const { lookupMatchId, normTLA, extractFinalResult } = require('./match-lookup.js')

const FDORG_TOKEN = (process.env.FDORG_TOKEN || '').trim()
const BOT_TOKEN   = (process.env.BOT_TOKEN   || '').trim()
const ADMIN_ID    = (process.env.ADMIN_ID    || '').trim()
const API_URL     = (process.env.API_URL || 'https://word-cup-2016.onrender.com').replace(/\/$/, '')

if (!FDORG_TOKEN || !BOT_TOKEN) {
  console.error('[sync] FDORG_TOKEN and BOT_TOKEN are required')
  process.exit(1)
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

async function postScore(matchId, home, away, meta) {
  const res = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': BOT_TOKEN },
    body: JSON.stringify({ matchId, home, away, meta }),
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
    const matchId = lookupMatchId(homeTLA, awayTLA)

    if (!matchId) {
      // Log only if teams are recognisable (might be a non-group stage match we don't track yet)
      if (homeTLA && awayTLA) {
        console.log(`[sync] No mapping: ${key} (${m.homeTeam?.name} vs ${m.awayTeam?.name})`)
      }
      continue
    }

    // Already in Redis → skip
    if (settled[matchId]) continue

    // Единый гейт фиксации (match-lookup.js): группа — достоверный fullTime;
    // нокаут — итог обязан однозначно определять прошедшего (ничьей не бывает).
    // null ⇒ данные FD недостоверны — НЕ фиксируем, ждём/чиним вручную (/score).
    const finalResult = extractFinalResult(m)
    if (!finalResult) {
      console.warn(`[sync] ${matchId} не проходит гейт фиксации (счёт/победитель недостоверны), skipping`)
      continue
    }
    const { home: homeScore, away: awayScore, ...meta } = finalResult

    const penStr = meta.penHome != null ? ` (пен. ${meta.penHome}:${meta.penAway})` : ''
    console.log(`[sync] New result: ${matchId} ${key} → ${homeScore}:${awayScore}${penStr}`)
    try {
      const res = await postScore(matchId, homeScore, awayScore, meta)
      console.log(`[sync] ✅ ${matchId} settled, scored ${res.scored} predictions`)
      notifications.push(`⚽ *${m.homeTeam.name} ${homeScore}:${awayScore} ${m.awayTeam.name}*${penStr}\nПрогнозов зачтено: ${res.scored}`)
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

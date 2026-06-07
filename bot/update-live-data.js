#!/usr/bin/env node
// Auto-generate public/live-data.json from football-data.org live match data
// Runs every few minutes via GitHub Actions cron during the tournament.
// The workflow commits the file only when match data actually changes,
// which triggers the existing GitHub Pages / Vercel deploy on push to main.

const fs = require('fs')
const path = require('path')
const { lookupMatchId, normTLA } = require('./match-lookup.js')

const FDORG_TOKEN = (process.env.FDORG_TOKEN || '').trim()
const OUT_PATH    = path.join(__dirname, '..', 'public', 'live-data.json')

if (!FDORG_TOKEN) {
  console.error('[live-data] FDORG_TOKEN is required')
  process.exit(1)
}

// football-data.org match status → our status (src/data.js MATCHES use 'upcoming' | 'live' | 'finished')
const STATUS_MAP = {
  SCHEDULED: 'upcoming',
  TIMED:     'upcoming',
  POSTPONED: 'upcoming',
  CANCELLED: 'upcoming',
  IN_PLAY:   'live',
  PAUSED:    'live',
  SUSPENDED: 'live',
  FINISHED:  'finished',
  AWARDED:   'finished',
}

async function fetchFDOrg(endpoint) {
  const res = await fetch(`https://api.football-data.org/v4${endpoint}`, {
    headers: { 'X-Auth-Token': FDORG_TOKEN },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data.org ${res.status}: ${body}`)
  }
  return res.json()
}

function readExistingResults() {
  try {
    const raw = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
    return raw.matchResults || {}
  } catch {
    return {}
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const ts = new Date().toISOString()
  console.log(`[live-data] ${ts}`)

  const fdData = await fetchFDOrg('/competitions/WC/matches')
  const matches = fdData.matches || []
  const matchResults = readExistingResults()

  let changed = false
  let mapped = 0

  for (const m of matches) {
    const homeTLA = normTLA(m.homeTeam?.tla || '')
    const awayTLA = normTLA(m.awayTeam?.tla || '')
    const matchId = lookupMatchId(homeTLA, awayTLA)
    if (!matchId) continue
    mapped++

    const status = STATUS_MAP[m.status] || 'upcoming'
    const fullTime = m.score?.fullTime || {}

    const prev = matchResults[matchId] || {}
    const next = { ...prev, status }
    if (fullTime.home != null && fullTime.away != null) {
      next.scoreHome = fullTime.home
      next.scoreAway = fullTime.away
    }
    if (status === 'live' && m.minute != null) {
      next.time = String(m.minute)
    }

    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      matchResults[matchId] = next
      changed = true
      console.log(`[live-data] ${matchId} → ${status}${next.scoreHome != null ? ` ${next.scoreHome}:${next.scoreAway}` : ''}${next.time ? ` (${next.time}')` : ''}`)
    }
  }

  console.log(`[live-data] ${mapped} matches mapped, ${changed ? 'changes detected' : 'no changes'}`)

  if (!changed) return

  const out = {
    _updated: ts,
    _note: 'Автогенерируется bot/update-live-data.js из football-data.org. Не редактировать вручную во время турнира — изменения будут перезаписаны.',
    matchResults,
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`[live-data] Wrote ${OUT_PATH}`)
}

main().catch(e => {
  console.error('[live-data] Fatal:', e.message)
  process.exit(1)
})

#!/usr/bin/env node
// Auto-generate public/live-data.json from football-data.org live match data
// Runs every few minutes via GitHub Actions cron during the tournament.
// The workflow commits the file only when match data actually changes,
// which triggers the existing GitHub Pages / Vercel deploy on push to main.

const fs = require('fs')
const path = require('path')
const { lookupMatchId, normTLA, extractFinalResult, liveDisplayScore, isKnockoutStage } = require('./match-lookup.js')

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
  console.log(`[live-data] football-data.org returned ${matches.length} matches for WC`)
  if (matches.length > 0) {
    const sample = matches[0]
    console.log(`[live-data] Sample: ${sample.homeTeam?.tla} vs ${sample.awayTeam?.tla} status=${sample.status}`)
  }
  const matchResults = readExistingResults()

  let changed = false
  let mapped = 0

  for (const m of matches) {
    const homeTLA = normTLA(m.homeTeam?.tla || '')
    const awayTLA = normTLA(m.awayTeam?.tla || '')
    const matchId = lookupMatchId(homeTLA, awayTLA)
    if (!matchId) continue
    mapped++

    // Единый гейт фиксации (match-lookup.js): «завершён» показываем ТОЛЬКО если
    // итог достоверен (группа — fullTime; нокаут — однозначный прошедший).
    // FD-статус FINISHED без валидного итога держим как 'live'.
    const finalResult = extractFinalResult(m)
    let status = STATUS_MAP[m.status] || 'upcoming'
    if (status === 'finished' && !finalResult) status = 'live'
    const fullTime = m.score?.fullTime || {}
    const halfTime = m.score?.halfTime || {}

    // ПРАВИЛО: матч «идёт», пока реально не закончился. football-data (free)
    // часто держит идущий матч в статусе SCHEDULED/TIMED ('upcoming') и лишь
    // пушит счёт — тогда матч со счётом, который не закрыт гейтом, ИДЁТ.
    // Определяем live по наличию счёта, не по клиентскому таймеру (окно 115 мин
    // гасло раньше конца матча → «слетал» из эфира).
    const hasLiveScore = fullTime.home != null || halfTime.home != null
    if (status === 'upcoming' && hasLiveScore) status = 'live'

    const prev = matchResults[matchId] || {}
    const next = { ...prev, status }

    if (status === 'finished') {
      // Зачётный счёт из гейта (на серии пенальти fullTime у FD — кумулятив).
      next.scoreHome = finalResult.home
      next.scoreAway = finalResult.away
      if (finalResult.winner) next.winner = finalResult.winner
      if (finalResult.duration) next.duration = finalResult.duration
      if (finalResult.penHome != null) { next.penHome = finalResult.penHome; next.penAway = finalResult.penAway }
    } else if (isKnockoutStage(m.stage)) {
      // Live-нокаут: раздельные фазы — игровой счёт без голов серии (кумулятив
      // «3:5» не показываем), серия и маркер фазы отдельными полями.
      const d = liveDisplayScore(m.score, m.minute)
      if (d) {
        next.scoreHome = d.home
        next.scoreAway = d.away
        if (d.penHome != null) { next.penHome = d.penHome; next.penAway = d.penAway }
        if (d.phase !== 'reg') next.phase = d.phase
      }
    } else {
      // Live-группа: fullTime, затем halfTime — что уже есть.
      const scoreSource = (fullTime.home != null ? fullTime : null) || (halfTime.home != null ? halfTime : null)
      if (scoreSource) {
        next.scoreHome = scoreSource.home
        next.scoreAway = scoreSource.away
      }
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

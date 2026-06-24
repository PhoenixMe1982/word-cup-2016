// Проверка settleScore/resultMeta (этап 1: фикс нокаут-зачёта).
// Запуск: node bot/match-lookup.test.js  (без зависимостей, exit 1 при падении)
const assert = require('assert')
const { settleScore, resultMeta, isKnockoutStage } = require('./match-lookup.js')

let n = 0
const eq = (got, exp, msg) => { n++; assert.deepStrictEqual(got, exp, msg) }

// ── isKnockoutStage ────────────────────────────────────────────────────────
eq(isKnockoutStage('GROUP_STAGE'), false, 'group is not knockout')
eq(isKnockoutStage('LAST_16'), true, 'LAST_16 knockout')
eq(isKnockoutStage('FINAL'), true, 'FINAL knockout')
eq(isKnockoutStage(undefined), false, 'missing stage → treat as group (safe default)')

// ── Группа: всегда fullTime как есть (поведение не меняется) ────────────────
eq(settleScore({ fullTime: { home: 2, away: 1 } }, 'GROUP_STAGE'), { home: 2, away: 1 }, 'group fullTime')
eq(settleScore({ fullTime: { home: 0, away: 0 } }, 'GROUP_STAGE'), { home: 0, away: 0 }, 'group draw')

// fullTime отсутствует → null (не фиксируем)
eq(settleScore({ fullTime: { home: null, away: null } }, 'GROUP_STAGE'), null, 'no fullTime → null')
eq(settleScore({}, 'LAST_16'), null, 'empty score → null')

// ── Нокаут без серии: победа в основное/доп. время → fullTime как есть ──────
eq(settleScore({ fullTime: { home: 2, away: 1 }, duration: 'REGULAR' }, 'QUARTER_FINALS'),
  { home: 2, away: 1 }, 'knockout decided in 90 → fullTime')
eq(settleScore({ fullTime: { home: 3, away: 2 }, regularTime: { home: 2, away: 2 }, extraTime: { home: 1, away: 0 }, duration: 'EXTRA_TIME' }, 'SEMI_FINALS'),
  { home: 3, away: 2 }, 'knockout decided in ET (no pens) → fullTime')

// ── Нокаут по пенальти: КЛЮЧЕВОЙ кейс ──────────────────────────────────────
// Кодировка A (fullTime кумулятив reg+et+pen): fin 1:1, пенальти 4:3 →
// fullTime приходит 5:4. Должны вернуть 120′-счёт 1:1, НЕ 5:4.
eq(settleScore({
  fullTime: { home: 5, away: 4 },
  regularTime: { home: 1, away: 1 },
  extraTime: { home: 0, away: 0 },
  penalties: { home: 4, away: 3 },
  duration: 'PENALTY_SHOOTOUT',
}, 'FINAL'), { home: 1, away: 1 }, 'pens (cumulative fullTime) → 120 score, not inflated')

// С голами в ОТ: 1:1 в осн., по голу в ОТ (2:2), пенальти. reg+et = 2:2.
eq(settleScore({
  fullTime: { home: 6, away: 5 },
  regularTime: { home: 1, away: 1 },
  extraTime: { home: 1, away: 1 },
  penalties: { home: 4, away: 3 },
  duration: 'PENALTY_SHOOTOUT',
}, 'LAST_16'), { home: 2, away: 2 }, 'pens after ET goals → reg+et = 2:2')

// Кодировка B (fullTime уже без пенальти = ничья), regularTime отсутствует →
// фолбэк на ничейный fullTime.
eq(settleScore({
  fullTime: { home: 1, away: 1 },
  penalties: { home: 4, away: 3 },
  duration: 'PENALTY_SHOOTOUT',
}, 'FINAL'), { home: 1, away: 1 }, 'pens, no regularTime, draw fullTime → fullTime')

// Невозможно достоверно вычислить (пенальти, нет regularTime, fullTime НЕ ничья)
// → null, ждём следующего цикла, не фиксируем неверный счёт.
eq(settleScore({
  fullTime: { home: 5, away: 4 },
  penalties: { home: 4, away: 3 },
  duration: 'PENALTY_SHOOTOUT',
}, 'FINAL'), null, 'pens, no regularTime, non-draw fullTime → null (ambiguous)')

// ── resultMeta ─────────────────────────────────────────────────────────────
eq(resultMeta({ fullTime: { home: 2, away: 1 }, duration: 'REGULAR' }), {}, 'group meta empty')
eq(resultMeta({
  regularTime: { home: 1, away: 1 }, penalties: { home: 4, away: 3 },
  winner: 'HOME_TEAM', duration: 'PENALTY_SHOOTOUT',
}), { penHome: 4, penAway: 3, winner: 'HOME_TEAM', duration: 'PENALTY_SHOOTOUT' }, 'pens meta')
eq(resultMeta({ duration: 'EXTRA_TIME', winner: 'AWAY_TEAM' }),
  { winner: 'AWAY_TEAM', duration: 'EXTRA_TIME' }, 'ET meta, no pens')

console.log(`✅ all ${n} assertions passed`)

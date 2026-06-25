// Проверка calcPointsKnockout (этап 2: стек-очки плей-офф).
// Запуск: node bot/scoring.test.js  (без зависимостей, exit 1 при падении)
const assert = require('assert')
const { calcPointsKnockout, predAdvancer, normWinner } = require('./scoring.js')

let n = 0
const eq = (got, exp, msg) => { n++; assert.strictEqual(got, exp, `${msg}: ожидалось ${exp}, получено ${got}`) }

// ── normWinner / predAdvancer ──────────────────────────────────────────────
eq(normWinner('HOME_TEAM'), 'HOME', 'normWinner HOME_TEAM')
eq(normWinner('AWAY'), 'AWAY', 'normWinner AWAY')
eq(normWinner('DRAW'), null, 'normWinner DRAW → null')
eq(predAdvancer({ home: 2, away: 1 }), 'HOME', 'advancer: решено в 90′')
eq(predAdvancer({ home: 1, away: 1, et: { home: 2, away: 1 } }), 'HOME', 'advancer: решено в ОТ')
eq(predAdvancer({ home: 1, away: 1, et: { home: 1, away: 1 }, penWinner: 'AWAY' }), 'AWAY', 'advancer: по пенальти')
eq(predAdvancer({ home: 1, away: 1, et: { home: 1, away: 1 } }), null, 'advancer: ничья без penWinner → null')

// ── A. Решено в 90′, точный счёт ───────────────────────────────────────────
// 90′ +3 + страховка +1 = 4
eq(calcPointsKnockout(
  { home: 2, away: 1 },
  { reg: { home: 2, away: 1 }, winner: 'HOME_TEAM' },
), 4, 'A: точный 90′ + страховка')

// ── B. Решено в 90′, только исход ──────────────────────────────────────────
// 90′ +1 + страховка +1 = 2
eq(calcPointsKnockout(
  { home: 3, away: 0 },
  { reg: { home: 2, away: 1 }, winner: 'HOME_TEAM' },
), 2, 'B: исход 90′ + страховка')

// ── C. Решено в 90′, мимо (и команда не та) ────────────────────────────────
eq(calcPointsKnockout(
  { home: 0, away: 2 },
  { reg: { home: 2, away: 1 }, winner: 'HOME_TEAM' },
), 0, 'C: всё мимо')

// ── D. Полная серия пенальти, всё в точку ──────────────────────────────────
// 90′ +3, 120′ +2, пен +1, страховка +1 = 7
eq(calcPointsKnockout(
  { home: 1, away: 1, et: { home: 2, away: 2 }, penWinner: 'HOME' },
  { reg: { home: 1, away: 1 }, et: { home: 2, away: 2 }, penHome: 4, penAway: 3, winner: 'HOME_TEAM' },
), 7, 'D: идеальный прогноз пенальти-матча')

// ── E. Прогноз — чистая победа 90′, но матч ушёл на пенальти; команда угадана ─
// 90′ 0 (HOME vs DRAW), без 120′/пен (прогноз не дошёл), страховка +1 = 1
eq(calcPointsKnockout(
  { home: 2, away: 0 },
  { reg: { home: 0, away: 0 }, et: { home: 0, away: 0 }, penHome: 4, penAway: 3, winner: 'HOME_TEAM' },
), 1, 'E: только страховка за проходящего')

// ── F. Прогноз ничья 90′ + решающий ОТ, всё в точку (без пенальти) ─────────
// 90′ +3, 120′ +2, страховка +1 = 6
eq(calcPointsKnockout(
  { home: 1, away: 1, et: { home: 2, away: 1 } },
  { reg: { home: 1, away: 1 }, et: { home: 2, away: 1 }, winner: 'HOME_TEAM', duration: 'EXTRA_TIME' },
), 6, 'F: ничья 90′ + точный ОТ')

// ── G. Ничья 90′ угадана, исход ОТ мимо ────────────────────────────────────
// 90′ +1 (DRAW==DRAW), 120′ 0 (HOME vs AWAY), страховка 0 = 1
eq(calcPointsKnockout(
  { home: 0, away: 0, et: { home: 1, away: 0 } },
  { reg: { home: 1, away: 1 }, et: { home: 1, away: 2 }, winner: 'AWAY_TEAM', duration: 'EXTRA_TIME' },
), 1, 'G: исход 90′, ОТ и страховка мимо')

// ── H. Дошёл до пенальти, но победитель серии не тот ───────────────────────
// 90′ +3, 120′ +2, пен 0 (AWAY vs HOME), страховка 0 (predAdv=AWAY) = 5
eq(calcPointsKnockout(
  { home: 1, away: 1, et: { home: 1, away: 1 }, penWinner: 'AWAY' },
  { reg: { home: 1, away: 1 }, et: { home: 1, away: 1 }, penHome: 5, penAway: 4, winner: 'HOME_TEAM' },
), 5, 'H: пен-победитель мимо')

// ── I. Пенальти: счёт 120′ не точный, но исходы-ничьи верны + пен угадан ────
// 90′ +1 (DRAW), 120′ +1 (DRAW==DRAW, не точный), пен +1, страховка +1 = 4
eq(calcPointsKnockout(
  { home: 1, away: 1, et: { home: 0, away: 0 }, penWinner: 'HOME' },
  { reg: { home: 2, away: 2 }, et: { home: 2, away: 2 }, penHome: 5, penAway: 4, winner: 'HOME_TEAM' },
), 4, 'I: исходы-ничьи + пен, счёт неточный')

// ── K. Прогноз дошёл до ОТ, но матч решён в 90′ (ОТ не было) ────────────────
// 90′ 0 (DRAW vs HOME), 120′ skip (нет result.et), страховка +1 = 1
eq(calcPointsKnockout(
  { home: 1, away: 1, et: { home: 2, away: 1 } },
  { reg: { home: 2, away: 0 }, winner: 'HOME_TEAM' },
), 1, 'K: ОТ не было — только страховка')

// ── L. Решено в 90′ ничьей невозможно (нокаут), но прогноз без et на ничью ──
// прогноз ничья 90′, матч решён 90′ — невозможно в нокауте, но проверим что
// без et не падаем: 90′ pred 0:0 vs reg 1:0 → 0, нет et → нет 120′, страховка:
// predAdv=null (ничья без et/pen) → 0
eq(calcPointsKnockout(
  { home: 0, away: 0 },
  { reg: { home: 1, away: 0 }, winner: 'HOME_TEAM' },
), 0, 'L: прогноз-ничья без et, страховка null')

console.log(`✅ all ${n} assertions passed`)

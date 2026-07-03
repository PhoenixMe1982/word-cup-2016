// Проверка afParseFixture/afAgrees (двухисточниковая сверка, API-Football).
// Образцы — реальные ответы v3.football.api-sports.io от 2026-07-03.
// Запуск: node bot/af-crosscheck.test.js
const assert = require('assert')
const { afParseFixture, afAgrees } = require('./af-crosscheck.js')

let n = 0
const eq = (got, exp, msg) => { n++; assert.deepStrictEqual(got, exp, msg) }

const fx = (home, away, statusShort, goals, score, winners = [null, null]) => ({
  fixture: { status: { short: statusShort } },
  league: { id: 1 },
  teams: {
    home: { name: home, winner: winners[0] },
    away: { name: away, winner: winners[1] },
  },
  goals,
  score,
})

// m88 (AUS-EGY), реальный ответ: [PEN] ht 0:1 ft 1:1 et 0:0 pen 2:4, W:away.
eq(afParseFixture(fx('Australia', 'Egypt', 'PEN',
  { home: 1, away: 1 },
  { halftime: { home: 0, away: 1 }, fulltime: { home: 1, away: 1 }, extratime: { home: 0, away: 0 }, penalty: { home: 2, away: 4 } },
  [false, true])),
  { matchId: 'm88', result: { home: 1, away: 1, penHome: 2, penAway: 4, winner: 'AWAY_TEAM', duration: 'PENALTY_SHOOTOUT', knockout: true, reg: { home: 1, away: 1 }, et: { home: 1, away: 1 } } },
  'm88: серия с полной разбивкой')

// m83 (POR-CRO): [FT] 2:1, W:home — верный счёт (FD тогда дал мусор 2:2 DRAW).
eq(afParseFixture(fx('Portugal', 'Croatia', 'FT',
  { home: 2, away: 1 },
  { halftime: { home: 1, away: 1 }, fulltime: { home: 2, away: 1 }, extratime: { home: null, away: null }, penalty: { home: null, away: null } },
  [true, false])),
  { matchId: 'm83', result: { home: 2, away: 1, winner: 'HOME_TEAM', knockout: true, reg: { home: 2, away: 1 } } },
  'm83: 90′-победа')

// Зеркальная пара: AF отдал Croatia—Portugal → результат разворачивается к m83.
eq(afParseFixture(fx('Croatia', 'Portugal', 'FT',
  { home: 1, away: 2 },
  { halftime: { home: 1, away: 1 }, fulltime: { home: 1, away: 2 }, extratime: { home: null, away: null }, penalty: { home: null, away: null } },
  [false, true])),
  { matchId: 'm83', result: { home: 2, away: 1, winner: 'HOME_TEAM', knockout: true, reg: { home: 2, away: 1 } } },
  'зеркальная пара → разворот сторон')

// Не начался → null; неизвестное имя → null.
eq(afParseFixture(fx('Argentina', 'Cape Verde Islands', 'NS', { home: null, away: null }, {})), null, 'NS → null')
eq(afParseFixture(fx('Narnia', 'Egypt', 'FT', { home: 1, away: 0 }, { fulltime: { home: 1, away: 0 } }, [true, false])), null, 'неизвестное имя → null')

// Группа: ничья валидна, winner нет.
eq(afParseFixture(fx('Japan', 'Sweden', 'FT',
  { home: 1, away: 1 },
  { halftime: { home: 0, away: 0 }, fulltime: { home: 1, away: 1 }, extratime: { home: null, away: null }, penalty: { home: null, away: null } })),
  { matchId: 'm57', result: { home: 1, away: 1 } },
  'группа: ничья проходит')

// afAgrees: совпадение / расхождение.
const fdOk = { home: 1, away: 1, knockout: true, reg: { home: 1, away: 1 }, et: { home: 1, away: 1 }, winner: 'AWAY_TEAM', duration: 'PENALTY_SHOOTOUT', penHome: 1, penAway: 1 }
const afOk = { home: 1, away: 1, knockout: true, reg: { home: 1, away: 1 }, et: { home: 1, away: 1 }, winner: 'AWAY_TEAM', duration: 'PENALTY_SHOOTOUT', penHome: 2, penAway: 4 }
eq(afAgrees(fdOk, afOk), true, 'agree: цифры серии не сравниваются (FD врёт)')
eq(afAgrees({ ...fdOk, winner: 'HOME_TEAM' }, afOk), false, 'disagree: winner')
eq(afAgrees({ ...fdOk, home: 2 }, afOk), false, 'disagree: счёт')
eq(afAgrees({ ...fdOk, reg: { home: 0, away: 0 } }, afOk), false, 'disagree: 90′')
eq(afAgrees({ home: 2, away: 1 }, { home: 2, away: 1 }), true, 'agree: группа по счёту')
eq(afAgrees({ home: 2, away: 1 }, { home: 2, away: 2 }), false, 'disagree: группа')

console.log(`✅ all ${n} assertions passed`)

// Скоринг прогнозов плей-офф (этап 2). Чистые функции без зависимостей —
// тестируются bot/scoring.test.js. Групповой calcPoints живёт в index.js и не
// тронут; сюда вынесена ТОЛЬКО нокаут-ветка (стек-очки по стадиям).
//
// Согласованная механика (веса финальны 2026-06-24):
//   90′:  точный счёт +3 / верный исход +1            — всем
//   120′: точный счёт +2 / верный исход +1            — кто в прогнозе поставил
//                                                        ничью 90′ И был ОТ
//   пенальти: угадан победитель серии +1              — кто дошёл прогнозом до
//                                                        пенальти И была серия
//   страховка: угадан проходящий дальше +1            — всем, ПОВЕРХ стека
// На каждой стадии берётся БОЛЬШЕЕ (точный счёт ИЛИ исход), стадии складываются.
//
// pred:   { home, away, et?:{home,away}, penWinner?:'HOME'|'AWAY' }
// result: { reg:{home,away}, et?:{home,away}, penHome?, penAway?, winner } —
//         winner: FD-формат 'HOME_TEAM'|'AWAY_TEAM' (нормализуется внутри).

function normWinner(w) {
  if (w === 'HOME_TEAM' || w === 'HOME') return 'HOME'
  if (w === 'AWAY_TEAM' || w === 'AWAY') return 'AWAY'
  return null
}

function outcome(h, a) {
  return h > a ? 'HOME' : h < a ? 'AWAY' : 'DRAW'
}

// Очки за одну стадию: точный счёт → exactPts; иначе верный исход → outcomePts;
// иначе 0. Точный счёт и исход НЕ складываются (берётся большее, как в группе).
function stagePoints(ph, pa, rh, ra, exactPts, outcomePts) {
  if (ph === rh && pa === ra) return exactPts
  if (outcome(ph, pa) === outcome(rh, ra)) return outcomePts
  return 0
}

// Кого прогноз проводит дальше — глубочайший РЕШАЮЩИЙ уровень прогноза.
function predAdvancer(pred) {
  if (pred.home !== pred.away) return outcome(pred.home, pred.away)        // решено в 90′
  if (pred.et && pred.et.home !== pred.et.away) return outcome(pred.et.home, pred.et.away) // в ОТ
  if (pred.penWinner) return normWinner(pred.penWinner)                    // по пенальти
  return null
}

function calcPointsKnockout(pred, result) {
  let pts = 0
  const reg = result.reg || { home: result.home, away: result.away }

  // 1) 90′ — всем
  pts += stagePoints(pred.home, pred.away, reg.home, reg.away, 3, 1)

  // 2) 120′ — только если прогноз дошёл (ничья 90′ + есть et) И реально был ОТ
  const predReached120 = pred.home === pred.away && !!pred.et
  if (predReached120 && result.et) {
    pts += stagePoints(pred.et.home, pred.et.away, result.et.home, result.et.away, 2, 1)
  }

  // 3) Пенальти — только если прогноз дошёл (ничья 120′ + penWinner) И была серия.
  // «Была серия» определяем по duration/winner, НЕ по цифрам пенальти: FD на
  // сериях отдаёт недостоверный счёт (ничья 5:5/1:1). Правило «прошёл ⇒ выиграл
  // серию» — победитель серии = result.winner (кто прошёл дальше).
  const predReachedPens = predReached120 && pred.et.home === pred.et.away && !!pred.penWinner
  const realWentToPens = result.duration === 'PENALTY_SHOOTOUT' || result.penHome != null
  if (predReachedPens && realWentToPens) {
    if (normWinner(pred.penWinner) === normWinner(result.winner)) pts += 1
  }

  // 4) Страховка — всем, кто угадал проходящего дальше (поверх стека)
  const realAdv = normWinner(result.winner)
  const predAdv = predAdvancer(pred)
  if (realAdv && predAdv && predAdv === realAdv) pts += 1

  return pts
}

module.exports = { calcPointsKnockout, predAdvancer, normWinner, outcome, stagePoints }

// Shared football-data.org ↔ our match ID mapping
// Used by sync-results.js (settle predictions) and update-live-data.js (live-data.json)
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
  // ── 1/16 финала (R32) — реальные пары по официальной сетке ЧМ-2026.
  // Порядок home_away совпадает с FD (домашняя команда по позиции в сетке) и с
  // src/data.js KNOCKOUT_MATCHES — иначе счёт записался бы зеркально. Команды
  // глубже R32 (m89+) станут известны по мере резолва и добавляются тогда же.
  'RSA_CAN': 'm73', 'GER_PAR': 'm74', 'NED_MAR': 'm75', 'BRA_JPN': 'm76',
  'FRA_SWE': 'm77', 'CIV_NOR': 'm78', 'MEX_ECU': 'm79', 'ENG_COD': 'm80',
  'USA_BIH': 'm81', 'BEL_SEN': 'm82', 'POR_CRO': 'm83', 'ESP_AUT': 'm84',
  'SUI_ALG': 'm85', 'ARG_CPV': 'm86', 'COL_GHA': 'm87', 'AUS_EGY': 'm88',
  // ── 1/8 финала (R16) — добавляются ПО МЕРЕ РЕЗОЛВА пар (KNOCKOUT_TREE).
  // Порядок home_away = порядок в сетке (winner feeders[0] _ winner feeders[1]),
  // тот же, что показывает resolveTeams в «Играть»/ЧМ — прогноз и зачёт совпадают.
  // ВНИМАНИЕ: если football-data отдаст матч в ЗЕРКАЛЬНОМ порядке, ключ не совпадёт
  // и матч не зачтётся автоматически → добавить обратный ключ и/или зачесть /score.
  'PAR_FRA': 'm89',  // W(m74 GER-PAR)=PAR vs W(m77 FRA-SWE)=FRA
  'CAN_MAR': 'm90',  // W(m73 RSA-CAN)=CAN vs W(m75 NED-MAR)=MAR
  'BRA_NOR': 'm91',  // W(m76 BRA-JPN)=BRA vs W(m78 CIV-NOR)=NOR
  'MEX_ENG': 'm92',  // W(m79 MEX-ECU)=MEX vs W(m80 ENG-COD)=ENG
  'USA_BEL': 'm94',  // W(m81 USA-BIH)=USA vs W(m82 BEL-SEN)=BEL
  'POR_ESP': 'm93',  // W(m83 POR-CRO)=POR vs W(m84 ESP-AUT)=ESP
  'ARG_EGY': 'm95',  // W(m86 ARG-CPV)=ARG vs W(m88 AUS-EGY)=EGY
  'SUI_COL': 'm96',  // W(m85 SUI-ALG)=SUI vs W(m87 COL-GHA)=COL
  // ── 1/4 финала (QF) — пары резолвнуты по итогам 1/8 ──────────────────────
  'FRA_MAR': 'm97',  // W(m89)=FRA vs W(m90)=MAR
  'ESP_BEL': 'm98',  // W(m93)=ESP vs W(m94)=BEL
  'NOR_ENG': 'm99',  // W(m91)=NOR vs W(m92)=ENG
  'ARG_SUI': 'm100', // W(m95)=ARG vs W(m96)=SUI
  // Все пары 1/4 сформированы. Пары 1/2 (m101+) — по мере резолва.
}

// football-data.org TLA → our code (handles any code mismatches)
const TLA_ALIASES = {
  'SAU': 'KSA',  // Saudi Arabia
  'DRC': 'COD',  // DR Congo
  'HTI': 'HAI',  // Haiti
  'CUR': 'CUW',  // Curaçao
  'CPV': 'CPV',  // Cape Verde (same)
  'URY': 'URU',  // Uruguay — football-data.org использует ISO-код URY
}

function normTLA(tla) {
  return TLA_ALIASES[tla] || tla
}

function lookupMatchId(homeTLA, awayTLA) {
  return MATCH_LOOKUP[`${normTLA(homeTLA)}_${normTLA(awayTLA)}`]
}

// ── Зачётный счёт матча (этап 1: фикс нокаут-бага) ──────────────────────────
// football-data.org отдаёт stage: GROUP_STAGE | LAST_16 | QUARTER_FINALS |
// SEMI_FINALS | THIRD_PLACE | FINAL. Нокаут — всё, кроме группового этапа.
function isKnockoutStage(stage) {
  return !!stage && stage !== 'GROUP_STAGE'
}

// Возвращает зачётный счёт {home, away} по объекту score из football-data.org,
// либо null, если посчитать достоверно нельзя (тогда матч НЕ фиксируется — ждём
// следующего цикла поллинга).
//
// Группа и нокаут без серии (победа в основное/доп. время): fullTime как есть.
// Нокаут, ушедший на пенальти: берём счёт на 120′ БЕЗ голов серии. На серии
// football-data может отдавать fullTime кумулятивом (reg+et+pen) — тогда финал
// по пенальти зачёлся бы неверным счётом (напр. 5:4 вместо 1:1). Поэтому 120′
// реконструируем из regularTime+extraTime (на серии это всегда ничья), а
// fullTime для такого матча не доверяем.
//
// Очки в этапе 1 по-прежнему считаются по home/away (calcPoints не тронут) —
// меняется лишь то, КАКОЙ счёт записывается как итог нокаут-матча по пенальти.
function settleScore(score, stage) {
  const sc = score || {}
  const ft = sc.fullTime
  if (!ft || ft.home == null || ft.away == null) return null

  const hasPens = sc.penalties && sc.penalties.home != null && sc.penalties.away != null
  if (!isKnockoutStage(stage) || !hasPens) {
    return { home: ft.home, away: ft.away }
  }

  const reg = sc.regularTime, et = sc.extraTime
  if (reg && reg.home != null && reg.away != null) {
    return {
      home: reg.home + (et && et.home != null ? et.home : 0),
      away: reg.away + (et && et.away != null ? et.away : 0),
    }
  }
  // regularTime недоступен: если fullTime уже ничейный, это и есть 120′-счёт
  // (серия игралась с ничьей) — берём его.
  if (ft.home === ft.away) return { home: ft.home, away: ft.away }
  // fullTime не ничейный при серии ⇒ FD вклеил голы серии в fullTime (кейс m88:
  // 3:5 = 1+2 : 1+4). Вычитаем серию — 120′ обязан получиться ничьей, это
  // арифметическая самопроверка. Не сошлось ⇒ фид кривой, достоверного счёта нет.
  const rh = ft.home - sc.penalties.home, ra = ft.away - sc.penalties.away
  if (rh >= 0 && ra >= 0 && rh === ra) return { home: rh, away: ra }
  return null
}

// Доп. поля результата для отображения нокаута/пенальти в карточке. На очки в
// этапе 1 не влияют — собираются защитно из реально пришедших полей FD.
function resultMeta(score) {
  const sc = score || {}
  const meta = {}
  const duration = sc.duration || 'REGULAR'
  if (duration !== 'REGULAR') meta.duration = duration
  if (sc.penalties && sc.penalties.home != null && sc.penalties.away != null) {
    meta.penHome = sc.penalties.home
    meta.penAway = sc.penalties.away
  }
  if (sc.winner) meta.winner = sc.winner // HOME_TEAM | AWAY_TEAM | DRAW
  return meta
}

// Контракт идентификаторов: группа — m01..m72, плей-офф — m73.. (этап 2).
// Используется для каскадной валидации прогноза и гейта приёма на бэкенде.
function isKnockoutMatchId(id) {
  const m = /^m(\d+)$/.exec(id || '')
  return m ? Number(m[1]) >= 73 : false
}

// Разбивка нокаут-результата на стадии для стек-очков (этап 2).
// Возвращает { reg:{home,away}|null, et:{home,away}|null }:
//   reg — счёт на 90′ (regularTime; фолбэк на fullTime, если матч решён в осн.);
//   et  — счёт на 120′ (reg + голы ОТ), присутствует ТОЛЬКО если игрался ОТ
//         (duration EXTRA_TIME/PENALTY_SHOOTOUT либо есть голы extraTime).
// Согласовано с settleScore: на серии пенальти et == 120′-ничья == зачётный счёт.
function knockoutBreakdown(score) {
  const sc = score || {}
  const hasPens = sc.penalties && sc.penalties.home != null && sc.penalties.away != null
  const playedET = sc.duration === 'EXTRA_TIME' || sc.duration === 'PENALTY_SHOOTOUT'
    || (sc.extraTime && sc.extraTime.home != null) || hasPens
  let reg = sc.regularTime && sc.regularTime.home != null
    ? { home: sc.regularTime.home, away: sc.regularTime.away }
    : null
  // Фолбэк reg = fullTime допустим ТОЛЬКО для матча, решённого в основное время.
  // Если игрались ОТ/серия, fullTime — это 120′ (или вовсе кумулятив с голами
  // серии, кейсы m82/m88): подставив его как 90′, мы бы исказили стек-скоринг.
  // Без достоверного regularTime разбивки нет — reg остаётся null, и гейт
  // (extractFinalResult) такой матч НЕ зафиксирует.
  if (!reg && !playedET && sc.fullTime && sc.fullTime.home != null) {
    reg = { home: sc.fullTime.home, away: sc.fullTime.away }
  }
  let et = null
  if (playedET && reg) {
    et = {
      home: reg.home + (sc.extraTime && sc.extraTime.home != null ? sc.extraTime.home : 0),
      away: reg.away + (sc.extraTime && sc.extraTime.away != null ? sc.extraTime.away : 0),
    }
  }
  return { reg, et }
}

// Поля результата, нужные нокаут-скорингу (этап 2). Для группы — пустой объект
// (флаг knockout не выставляется → calcPoints идёт прежней групповой веткой).
// Для нокаута: { knockout:true, reg:{...}, et?:{...} }. На очки группы не влияет.
function knockoutResultFields(score, stage) {
  if (!isKnockoutStage(stage)) return {}
  const { reg, et } = knockoutBreakdown(score)
  const out = { knockout: true }
  if (reg) out.reg = reg
  if (et) out.et = et
  return out
}

// ── Гейт фиксации итога — ЕДИНАЯ точка для поллера, cron-синка и live-data ──
// Правило (ужесточено 2026-07-03 после m83, когда FD отдал нокауту 2:2 c
// winner=DRAW из-за отменённого гола):
//   • ГРУППА: валиден ЛЮБОЙ исход — фиксируем достоверный счёт за 90′ (fullTime).
//   • ПЛЕЙ-ОФФ: итог ОБЯЗАН однозначно определять прошедшего, ничьей не бывает:
//       – winner === 'DRAW' ⇒ фид кривой ⇒ null;
//       – решающий счёт (h≠a): winner от FD должен совпадать со стороной счёта
//         (противоречие ⇒ null); отсутствующий winner выводим из счёта;
//       – ничейный 120′-счёт легален ТОЛЬКО как серия пенальти
//         (duration PENALTY_SHOOTOUT) с достоверным winner HOME/AWAY.
// null ⇒ матч НЕ фиксируется в results, НЕ зачитывается в лидерборд и НЕ
// показывается завершённым — удерживается как «идёт» до валидных данных от FD
// либо ручного /score. Возвращает {home, away, ...meta} готовым для settleMatch.
function extractFinalResult(m) {
  if (m.status !== 'FINISHED' && m.status !== 'AWARDED') return null
  const score = settleScore(m.score, m.stage)
  if (!score) return null
  const meta = { ...resultMeta(m.score), ...knockoutResultFields(m.score, m.stage) }
  if (!meta.knockout) {
    // ГРУППА: только основное время. Доп. времени и серий в группе не существует —
    // всё, что FD прислал сверх (duration/penalties), — мусор фида, отрезаем,
    // чтобы оно не попало ни в отображение, ни в результат.
    delete meta.duration
    delete meta.penHome
    delete meta.penAway
    return { ...score, ...meta }
  }

  if (meta.winner === 'DRAW') return null
  // Стек-скоринг требует достоверной разбивки по фазам: без известного счёта 90′
  // (regularTime либо матч, решённый в основное время) итог не фиксируем — иначе
  // очки за 90′ считались бы по неверной цифре (кейсы m82/m88).
  if (!meta.reg) return null
  if (score.home !== score.away) {
    const bySide = score.home > score.away ? 'HOME_TEAM' : 'AWAY_TEAM'
    if (meta.winner && meta.winner !== bySide) return null
    meta.winner = bySide
  } else {
    // 120′-ничья: без серии пенальти и известного прошедшего итога нет.
    if ((m.score && m.score.duration) !== 'PENALTY_SHOOTOUT') return null
    if (meta.winner !== 'HOME_TEAM' && meta.winner !== 'AWAY_TEAM') return null
  }
  return { ...score, ...meta }
}

// ── Live-отображение: раздельные фазы вместо кумулятива FD ──────────────────
// Пока матч идёт (или завершён, но удержан гейтом), карточка должна показывать
// игровой счёт БЕЗ голов серии + серию отдельно, а не «3:5» одной кучей (кейс
// m88). Дисплей-only: на зачёт не влияет. Возвращает
// { home, away, penHome?, penAway?, phase: 'reg'|'et'|'pens' } либо null (счёта нет).
function liveDisplayScore(score, minute) {
  const sc = score || {}
  const pens = sc.penalties && sc.penalties.home != null && sc.penalties.away != null
    ? { home: sc.penalties.home, away: sc.penalties.away } : null
  const reg = sc.regularTime && sc.regularTime.home != null ? sc.regularTime : null
  const et = sc.extraTime && sc.extraTime.home != null ? sc.extraTime : null
  const ft = sc.fullTime && sc.fullTime.home != null ? sc.fullTime : null
  const ht = sc.halfTime && sc.halfTime.home != null ? sc.halfTime : null

  let base = null
  if (reg) base = { home: reg.home + (et ? et.home : 0), away: reg.away + (et ? et.away : 0) }
  else if (ft && pens) {
    // fullTime может быть кумулятивом с голами серии — вычитаем; самопроверка:
    // 120′ при серии обязан быть ничьей, иначе показываем fullTime как есть.
    const h = ft.home - pens.home, a = ft.away - pens.away
    base = (h >= 0 && a >= 0 && h === a) ? { home: h, away: a } : { home: ft.home, away: ft.away }
  } else if (ft) base = { home: ft.home, away: ft.away }
  else if (ht) base = { home: ht.home, away: ht.away }
  if (!base) return null

  const phase = (pens || sc.duration === 'PENALTY_SHOOTOUT') ? 'pens'
    : (sc.duration === 'EXTRA_TIME' || et || (minute != null && Number(minute) > 90)) ? 'et'
    : 'reg'
  const out = { home: base.home, away: base.away, phase }
  if (pens) { out.penHome = pens.home; out.penAway = pens.away }
  return out
}

module.exports = {
  MATCH_LOOKUP, TLA_ALIASES, normTLA, lookupMatchId,
  isKnockoutStage, isKnockoutMatchId, settleScore, resultMeta, knockoutBreakdown, knockoutResultFields,
  extractFinalResult, liveDisplayScore,
}

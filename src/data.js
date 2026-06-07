// FIFA World Cup 2026 App Data
// Tournament dates: June 11 – July 19, 2026
// Pre-tournament data: all matches upcoming

export const TOURNAMENT = {
  year: 2026,
  hosts: ['США', 'Канада', 'Мексика'],
  hostFlags: ['🇺🇸', '🇨🇦', '🇲🇽'],
  teams: 48,
  groups: 12,
  startDate: '11 июня 2026',
  finalDate: '19 июля 2026',
  motto: 'We Are 16',
};

// Фоновый баннер для шапок страниц — белый градиент поверх картинки
// держит текст читаемым, а cover/center/no-repeat корректно адаптируют
// изображение под любую ширину экрана и плотность пикселей.
export const HEADER_BANNER_STYLE = {
  backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.94) 55%, rgba(255,255,255,0.99) 100%), url('${import.meta.env.BASE_URL}header-banner.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

// Календарь стадий турнира — для прогресс-бара на главной.
// Даты группового этапа — по факту первого/последнего матча тура (см. MATCHES);
// даты плей-офф — по официальному календарю ЧМ-2026.
export const TOURNAMENT_STAGES = [
  { id: 'r1',    label: '1 круг', start: '2026-06-11', end: '2026-06-17' },
  { id: 'r2',    label: '2 круг', start: '2026-06-18', end: '2026-06-23' },
  { id: 'r3',    label: '3 круг', start: '2026-06-24', end: '2026-06-27' },
  { id: 'r32',   label: '1/16',   start: '2026-06-28', end: '2026-07-03' },
  { id: 'r16',   label: '1/8',    start: '2026-07-04', end: '2026-07-07' },
  { id: 'qf',    label: '1/4',    start: '2026-07-09', end: '2026-07-11' },
  { id: 'sf',    label: '1/2',    start: '2026-07-14', end: '2026-07-15' },
  { id: 'final', label: 'Финал',  start: '2026-07-19', end: '2026-07-19' },
];

// Доля пройденного пути по стадиям турнира (0..1), на текущий момент.
// Между стадиями (выходные дни) — предыдущая стадия считается завершённой.
export function tournamentProgress(stages = TOURNAMENT_STAGES, now = new Date()) {
  const t = now.getTime();
  const first = new Date(`${stages[0].start}T00:00:00Z`).getTime();
  if (t <= first) return 0;
  const lastEnd = new Date(`${stages[stages.length - 1].end}T23:59:59Z`).getTime();
  if (t >= lastEnd) return 1;

  for (let i = 0; i < stages.length; i++) {
    const start = new Date(`${stages[i].start}T00:00:00Z`).getTime();
    const end = new Date(`${stages[i].end}T23:59:59Z`).getTime();
    if (t < start) return i / stages.length;
    if (t <= end) return (i + (t - start) / Math.max(1, end - start)) / stages.length;
  }
  return 1;
}

export const TEAMS = {
  // Group A
  MEX: { name: 'Мексика',         flag: '🇲🇽', group: 'A' },
  RSA: { name: 'ЮАР',             flag: '🇿🇦', group: 'A' },
  KOR: { name: 'Южная Корея',     flag: '🇰🇷', group: 'A' },
  CZE: { name: 'Чехия',           flag: '🇨🇿', group: 'A' },
  // Group B
  CAN: { name: 'Канада',          flag: '🇨🇦', group: 'B' },
  BIH: { name: 'Босния и Герц.',  flag: '🇧🇦', group: 'B' },
  QAT: { name: 'Катар',           flag: '🇶🇦', group: 'B' },
  SUI: { name: 'Швейцария',       flag: '🇨🇭', group: 'B' },
  // Group C
  BRA: { name: 'Бразилия',        flag: '🇧🇷', group: 'C' },
  MAR: { name: 'Марокко',         flag: '🇲🇦', group: 'C' },
  SCO: { name: 'Шотландия',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  HAI: { name: 'Гаити',           flag: '🇭🇹', group: 'C' },
  // Group D
  USA: { name: 'США',             flag: '🇺🇸', group: 'D' },
  PAR: { name: 'Парагвай',        flag: '🇵🇾', group: 'D' },
  AUS: { name: 'Австралия',       flag: '🇦🇺', group: 'D' },
  TUR: { name: 'Турция',          flag: '🇹🇷', group: 'D' },
  // Group E
  GER: { name: 'Германия',        flag: '🇩🇪', group: 'E' },
  CUW: { name: 'Кюрасао',         flag: '🇨🇼', group: 'E' },
  CIV: { name: 'Кот-д\'Ивуар',   flag: '🇨🇮', group: 'E' },
  ECU: { name: 'Эквадор',         flag: '🇪🇨', group: 'E' },
  // Group F
  NED: { name: 'Нидерланды',      flag: '🇳🇱', group: 'F' },
  JPN: { name: 'Япония',          flag: '🇯🇵', group: 'F' },
  TUN: { name: 'Тунис',           flag: '🇹🇳', group: 'F' },
  SWE: { name: 'Швеция',          flag: '🇸🇪', group: 'F' },
  // Group G
  BEL: { name: 'Бельгия',         flag: '🇧🇪', group: 'G' },
  EGY: { name: 'Египет',          flag: '🇪🇬', group: 'G' },
  IRN: { name: 'Иран',            flag: '🇮🇷', group: 'G' },
  NZL: { name: 'Н. Зеландия',    flag: '🇳🇿', group: 'G' },
  // Group H
  ESP: { name: 'Испания',         flag: '🇪🇸', group: 'H' },
  CPV: { name: 'Кабо-Верде',      flag: '🇨🇻', group: 'H' },
  KSA: { name: 'Саудовская Ар.',  flag: '🇸🇦', group: 'H' },
  URU: { name: 'Уругвай',         flag: '🇺🇾', group: 'H' },
  // Group I
  FRA: { name: 'Франция',         flag: '🇫🇷', group: 'I' },
  SEN: { name: 'Сенегал',         flag: '🇸🇳', group: 'I' },
  NOR: { name: 'Норвегия',        flag: '🇳🇴', group: 'I' },
  IRQ: { name: 'Ирак',            flag: '🇮🇶', group: 'I' },
  // Group J
  ARG: { name: 'Аргентина',       flag: '🇦🇷', group: 'J' },
  ALG: { name: 'Алжир',           flag: '🇩🇿', group: 'J' },
  AUT: { name: 'Австрия',         flag: '🇦🇹', group: 'J' },
  JOR: { name: 'Иордания',        flag: '🇯🇴', group: 'J' },
  // Group K
  POR: { name: 'Португалия',      flag: '🇵🇹', group: 'K' },
  COD: { name: 'ДР Конго',        flag: '🇨🇩', group: 'K' },
  UZB: { name: 'Узбекистан',      flag: '🇺🇿', group: 'K' },
  COL: { name: 'Колумбия',        flag: '🇨🇴', group: 'K' },
  // Group L
  ENG: { name: 'Англия',          flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  CRO: { name: 'Хорватия',        flag: '🇭🇷', group: 'L' },
  GHA: { name: 'Гана',            flag: '🇬🇭', group: 'L' },
  PAN: { name: 'Панама',          flag: '🇵🇦', group: 'L' },
};

// status: 'live' | 'finished' | 'upcoming'
// All matches upcoming — tournament starts June 11, 2026
// Times in Moscow time (MSK = UTC+3). Source: official FIFA schedule.
export const MATCHES = [
  // ── MATCHDAY 1 ─────────────────────────────────────────────────────────────
  { id: 'm01', group: 'A', date: '11 июня', time: '22:00 МСК', status: 'upcoming', home: 'MEX', away: 'RSA',  venue: 'Estadio Azteca, Мехико',               goals: [] },
  { id: 'm02', group: 'A', date: '12 июня', time: '05:00 МСК', status: 'upcoming', home: 'KOR', away: 'CZE',  venue: 'Estadio Akron, Гвадалахара',           goals: [] },
  { id: 'm03', group: 'B', date: '12 июня', time: '22:00 МСК', status: 'upcoming', home: 'CAN', away: 'BIH',  venue: 'BMO Field, Торонто',                    goals: [] },
  { id: 'm04', group: 'D', date: '13 июня', time: '04:00 МСК', status: 'upcoming', home: 'USA', away: 'PAR',  venue: 'SoFi Stadium, Инглвуд',                 goals: [] },
  { id: 'm05', group: 'B', date: '13 июня', time: '22:00 МСК', status: 'upcoming', home: 'QAT', away: 'SUI',  venue: 'Levi\'s Stadium, Санта-Клара',          goals: [] },
  { id: 'm06', group: 'C', date: '14 июня', time: '01:00 МСК', status: 'upcoming', home: 'BRA', away: 'MAR',  venue: 'MetLife Stadium, Нью-Джерси',           goals: [] },
  { id: 'm07', group: 'C', date: '14 июня', time: '04:00 МСК', status: 'upcoming', home: 'HAI', away: 'SCO',  venue: 'Gillette Stadium, Бостон',              goals: [] },
  { id: 'm08', group: 'D', date: '14 июня', time: '07:00 МСК', status: 'upcoming', home: 'AUS', away: 'TUR',  venue: 'BC Place, Ванкувер',                    goals: [] },
  { id: 'm09', group: 'E', date: '14 июня', time: '20:00 МСК', status: 'upcoming', home: 'GER', away: 'CUW',  venue: 'NRG Stadium, Хьюстон',                  goals: [] },
  { id: 'm10', group: 'F', date: '14 июня', time: '23:00 МСК', status: 'upcoming', home: 'NED', away: 'JPN',  venue: 'AT&T Stadium, Арлингтон',               goals: [] },
  { id: 'm11', group: 'E', date: '15 июня', time: '02:00 МСК', status: 'upcoming', home: 'CIV', away: 'ECU',  venue: 'Lincoln Financial Field, Филадельфия',  goals: [] },
  { id: 'm12', group: 'F', date: '15 июня', time: '05:00 МСК', status: 'upcoming', home: 'SWE', away: 'TUN',  venue: 'Estadio BBVA, Монтеррей',               goals: [] },
  { id: 'm13', group: 'H', date: '15 июня', time: '19:00 МСК', status: 'upcoming', home: 'ESP', away: 'CPV',  venue: 'Mercedes-Benz Stadium, Атланта',        goals: [] },
  { id: 'm14', group: 'G', date: '16 июня', time: '01:00 МСК', status: 'upcoming', home: 'BEL', away: 'EGY',  venue: 'Lumen Field, Сиэтл',                    goals: [] },
  { id: 'm15', group: 'H', date: '16 июня', time: '01:00 МСК', status: 'upcoming', home: 'KSA', away: 'URU',  venue: 'Hard Rock Stadium, Майами',             goals: [] },
  { id: 'm16', group: 'G', date: '16 июня', time: '07:00 МСК', status: 'upcoming', home: 'IRN', away: 'NZL',  venue: 'SoFi Stadium, Инглвуд',                 goals: [] },
  { id: 'm17', group: 'I', date: '16 июня', time: '22:00 МСК', status: 'upcoming', home: 'FRA', away: 'SEN',  venue: 'MetLife Stadium, Нью-Джерси',           goals: [] },
  { id: 'm18', group: 'I', date: '17 июня', time: '01:00 МСК', status: 'upcoming', home: 'IRQ', away: 'NOR',  venue: 'Gillette Stadium, Бостон',              goals: [] },
  { id: 'm19', group: 'J', date: '17 июня', time: '04:00 МСК', status: 'upcoming', home: 'ARG', away: 'ALG',  venue: 'Arrowhead Stadium, Канзас-Сити',        goals: [] },
  { id: 'm20', group: 'J', date: '17 июня', time: '07:00 МСК', status: 'upcoming', home: 'AUT', away: 'JOR',  venue: 'Levi\'s Stadium, Санта-Клара',          goals: [] },
  { id: 'm21', group: 'K', date: '17 июня', time: '20:00 МСК', status: 'upcoming', home: 'POR', away: 'COD',  venue: 'NRG Stadium, Хьюстон',                  goals: [] },
  { id: 'm22', group: 'L', date: '17 июня', time: '23:00 МСК', status: 'upcoming', home: 'ENG', away: 'CRO',  venue: 'AT&T Stadium, Арлингтон',               goals: [] },
  { id: 'm23', group: 'L', date: '18 июня', time: '02:00 МСК', status: 'upcoming', home: 'GHA', away: 'PAN',  venue: 'BMO Field, Торонто',                    goals: [] },
  { id: 'm24', group: 'K', date: '18 июня', time: '05:00 МСК', status: 'upcoming', home: 'UZB', away: 'COL',  venue: 'Estadio Azteca, Мехико',                goals: [] },

  // ── MATCHDAY 2 ─────────────────────────────────────────────────────────────
  { id: 'm25', group: 'A', date: '18 июня', time: '19:00 МСК', status: 'upcoming', home: 'CZE', away: 'RSA',  venue: 'Mercedes-Benz Stadium, Атланта',        goals: [] },
  { id: 'm26', group: 'B', date: '18 июня', time: '22:00 МСК', status: 'upcoming', home: 'SUI', away: 'BIH',  venue: 'SoFi Stadium, Инглвуд',                 goals: [] },
  { id: 'm27', group: 'B', date: '19 июня', time: '01:00 МСК', status: 'upcoming', home: 'CAN', away: 'QAT',  venue: 'BC Place, Ванкувер',                    goals: [] },
  { id: 'm28', group: 'A', date: '19 июня', time: '06:00 МСК', status: 'upcoming', home: 'MEX', away: 'KOR',  venue: 'Estadio Akron, Гвадалахара',            goals: [] },
  { id: 'm29', group: 'D', date: '19 июня', time: '22:00 МСК', status: 'upcoming', home: 'USA', away: 'AUS',  venue: 'Lumen Field, Сиэтл',                    goals: [] },
  { id: 'm30', group: 'C', date: '20 июня', time: '01:00 МСК', status: 'upcoming', home: 'SCO', away: 'MAR',  venue: 'Gillette Stadium, Бостон',              goals: [] },
  { id: 'm31', group: 'C', date: '20 июня', time: '04:00 МСК', status: 'upcoming', home: 'BRA', away: 'HAI',  venue: 'Lincoln Financial Field, Филадельфия',  goals: [] },
  { id: 'm32', group: 'D', date: '20 июня', time: '07:00 МСК', status: 'upcoming', home: 'TUR', away: 'PAR',  venue: 'Levi\'s Stadium, Санта-Клара',          goals: [] },
  { id: 'm33', group: 'F', date: '20 июня', time: '20:00 МСК', status: 'upcoming', home: 'NED', away: 'SWE',  venue: 'NRG Stadium, Хьюстон',                  goals: [] },
  { id: 'm34', group: 'E', date: '20 июня', time: '23:00 МСК', status: 'upcoming', home: 'GER', away: 'CIV',  venue: 'BMO Field, Торонто',                    goals: [] },
  { id: 'm35', group: 'E', date: '21 июня', time: '03:00 МСК', status: 'upcoming', home: 'ECU', away: 'CUW',  venue: 'Arrowhead Stadium, Канзас-Сити',        goals: [] },
  { id: 'm36', group: 'F', date: '21 июня', time: '07:00 МСК', status: 'upcoming', home: 'TUN', away: 'JPN',  venue: 'Estadio BBVA, Монтеррей',               goals: [] },
  { id: 'm37', group: 'H', date: '21 июня', time: '19:00 МСК', status: 'upcoming', home: 'ESP', away: 'KSA',  venue: 'Mercedes-Benz Stadium, Атланта',        goals: [] },
  { id: 'm38', group: 'G', date: '21 июня', time: '22:00 МСК', status: 'upcoming', home: 'BEL', away: 'IRN',  venue: 'SoFi Stadium, Инглвуд',                 goals: [] },
  { id: 'm39', group: 'H', date: '22 июня', time: '01:00 МСК', status: 'upcoming', home: 'URU', away: 'CPV',  venue: 'Hard Rock Stadium, Майами',             goals: [] },
  { id: 'm40', group: 'G', date: '22 июня', time: '04:00 МСК', status: 'upcoming', home: 'NZL', away: 'EGY',  venue: 'BC Place, Ванкувер',                    goals: [] },
  { id: 'm41', group: 'J', date: '22 июня', time: '20:00 МСК', status: 'upcoming', home: 'ARG', away: 'AUT',  venue: 'AT&T Stadium, Арлингтон',               goals: [] },
  { id: 'm42', group: 'I', date: '23 июня', time: '00:00 МСК', status: 'upcoming', home: 'FRA', away: 'IRQ',  venue: 'Lincoln Financial Field, Филадельфия',  goals: [] },
  { id: 'm43', group: 'I', date: '23 июня', time: '03:00 МСК', status: 'upcoming', home: 'NOR', away: 'SEN',  venue: 'MetLife Stadium, Нью-Джерси',           goals: [] },
  { id: 'm44', group: 'J', date: '23 июня', time: '06:00 МСК', status: 'upcoming', home: 'JOR', away: 'ALG',  venue: 'Levi\'s Stadium, Санта-Клара',          goals: [] },
  { id: 'm45', group: 'K', date: '23 июня', time: '20:00 МСК', status: 'upcoming', home: 'POR', away: 'UZB',  venue: 'NRG Stadium, Хьюстон',                  goals: [] },
  { id: 'm46', group: 'L', date: '23 июня', time: '23:00 МСК', status: 'upcoming', home: 'ENG', away: 'GHA',  venue: 'Gillette Stadium, Бостон',              goals: [] },
  { id: 'm47', group: 'L', date: '24 июня', time: '02:00 МСК', status: 'upcoming', home: 'PAN', away: 'CRO',  venue: 'BMO Field, Торонто',                    goals: [] },
  { id: 'm48', group: 'K', date: '24 июня', time: '05:00 МСК', status: 'upcoming', home: 'COL', away: 'COD',  venue: 'Estadio Akron, Гвадалахара',            goals: [] },

  // ── MATCHDAY 3 (одновременные матчи внутри группы) ──────────────────────────
  { id: 'm49', group: 'B', date: '24 июня', time: '22:00 МСК', status: 'upcoming', home: 'SUI', away: 'CAN',  venue: 'BC Place, Ванкувер',                    goals: [] },
  { id: 'm50', group: 'B', date: '24 июня', time: '22:00 МСК', status: 'upcoming', home: 'BIH', away: 'QAT',  venue: 'Lumen Field, Сиэтл',                    goals: [] },
  { id: 'm51', group: 'C', date: '25 июня', time: '01:00 МСК', status: 'upcoming', home: 'SCO', away: 'BRA',  venue: 'Hard Rock Stadium, Майами',             goals: [] },
  { id: 'm52', group: 'C', date: '25 июня', time: '01:00 МСК', status: 'upcoming', home: 'MAR', away: 'HAI',  venue: 'Mercedes-Benz Stadium, Атланта',        goals: [] },
  { id: 'm53', group: 'A', date: '25 июня', time: '04:00 МСК', status: 'upcoming', home: 'CZE', away: 'MEX',  venue: 'Estadio Azteca, Мехико',                goals: [] },
  { id: 'm54', group: 'A', date: '25 июня', time: '04:00 МСК', status: 'upcoming', home: 'RSA', away: 'KOR',  venue: 'Estadio Akron, Гвадалахара',            goals: [] },
  { id: 'm55', group: 'E', date: '25 июня', time: '23:00 МСК', status: 'upcoming', home: 'ECU', away: 'GER',  venue: 'MetLife Stadium, Нью-Джерси',           goals: [] },
  { id: 'm56', group: 'E', date: '25 июня', time: '23:00 МСК', status: 'upcoming', home: 'CUW', away: 'CIV',  venue: 'Lincoln Financial Field, Филадельфия',  goals: [] },
  { id: 'm57', group: 'F', date: '26 июня', time: '02:00 МСК', status: 'upcoming', home: 'JPN', away: 'SWE',  venue: 'AT&T Stadium, Арлингтон',               goals: [] },
  { id: 'm58', group: 'F', date: '26 июня', time: '02:00 МСК', status: 'upcoming', home: 'TUN', away: 'NED',  venue: 'Arrowhead Stadium, Канзас-Сити',        goals: [] },
  { id: 'm59', group: 'D', date: '26 июня', time: '05:00 МСК', status: 'upcoming', home: 'TUR', away: 'USA',  venue: 'SoFi Stadium, Инглвуд',                 goals: [] },
  { id: 'm60', group: 'D', date: '26 июня', time: '05:00 МСК', status: 'upcoming', home: 'PAR', away: 'AUS',  venue: 'Levi\'s Stadium, Санта-Клара',          goals: [] },
  { id: 'm61', group: 'I', date: '26 июня', time: '22:00 МСК', status: 'upcoming', home: 'NOR', away: 'FRA',  venue: 'Gillette Stadium, Бостон',              goals: [] },
  { id: 'm62', group: 'I', date: '26 июня', time: '22:00 МСК', status: 'upcoming', home: 'SEN', away: 'IRQ',  venue: 'BMO Field, Торонто',                    goals: [] },
  { id: 'm63', group: 'H', date: '27 июня', time: '03:00 МСК', status: 'upcoming', home: 'CPV', away: 'KSA',  venue: 'NRG Stadium, Хьюстон',                  goals: [] },
  { id: 'm64', group: 'H', date: '27 июня', time: '03:00 МСК', status: 'upcoming', home: 'URU', away: 'ESP',  venue: 'Estadio Akron, Гвадалахара',            goals: [] },
  { id: 'm65', group: 'G', date: '27 июня', time: '06:00 МСК', status: 'upcoming', home: 'EGY', away: 'IRN',  venue: 'Lumen Field, Сиэтл',                    goals: [] },
  { id: 'm66', group: 'G', date: '27 июня', time: '06:00 МСК', status: 'upcoming', home: 'NZL', away: 'BEL',  venue: 'BC Place, Ванкувер',                    goals: [] },
  { id: 'm67', group: 'L', date: '28 июня', time: '00:00 МСК', status: 'upcoming', home: 'PAN', away: 'ENG',  venue: 'MetLife Stadium, Нью-Джерси',           goals: [] },
  { id: 'm68', group: 'L', date: '28 июня', time: '00:00 МСК', status: 'upcoming', home: 'CRO', away: 'GHA',  venue: 'Lincoln Financial Field, Филадельфия',  goals: [] },
  { id: 'm69', group: 'K', date: '28 июня', time: '02:30 МСК', status: 'upcoming', home: 'COL', away: 'POR',  venue: 'Hard Rock Stadium, Майами',             goals: [] },
  { id: 'm70', group: 'K', date: '28 июня', time: '02:30 МСК', status: 'upcoming', home: 'COD', away: 'UZB',  venue: 'Mercedes-Benz Stadium, Атланта',        goals: [] },
  { id: 'm71', group: 'J', date: '28 июня', time: '05:00 МСК', status: 'upcoming', home: 'ALG', away: 'AUT',  venue: 'Arrowhead Stadium, Канзас-Сити',        goals: [] },
  { id: 'm72', group: 'J', date: '28 июня', time: '05:00 МСК', status: 'upcoming', home: 'JOR', away: 'ARG',  venue: 'AT&T Stadium, Арлингтон',               goals: [] },
];

// Претенденты на Золотую бутсу — турнир не начался, голов нет
export const TOP_SCORERS = [
  { rank: 1,  name: 'Килиан Мбаппе',        team: 'FRA', club: 'Real Madrid',    goals: 0, assists: 0, matches: 0, avatar: '⚡' },
  { rank: 2,  name: 'Лионель Месси',         team: 'ARG', club: 'Inter Miami',    goals: 0, assists: 0, matches: 0, avatar: '🐐' },
  { rank: 3,  name: 'Эрлинг Холанд',         team: 'NOR', club: 'Man City',       goals: 0, assists: 0, matches: 0, avatar: '💥' },
  { rank: 4,  name: 'Криштиану Роналду',     team: 'POR', club: 'Al-Nassr',       goals: 0, assists: 0, matches: 0, avatar: '🦁' },
  { rank: 5,  name: 'Виниций Жуниор',        team: 'BRA', club: 'Real Madrid',    goals: 0, assists: 0, matches: 0, avatar: '🔥' },
  { rank: 6,  name: 'Харри Кейн',            team: 'ENG', club: 'Bayern Munich',  goals: 0, assists: 0, matches: 0, avatar: '👑' },
  { rank: 7,  name: 'Лаутаро Мартинес',      team: 'ARG', club: 'Inter Milan',    goals: 0, assists: 0, matches: 0, avatar: '🐂' },
  { rank: 8,  name: 'Букайо Сака',           team: 'ENG', club: 'Arsenal',        goals: 0, assists: 0, matches: 0, avatar: '⭐' },
  { rank: 9,  name: 'Бернарду Силва',        team: 'POR', club: 'Man City',       goals: 0, assists: 0, matches: 0, avatar: '🎯' },
  { rank: 10, name: 'Мемфис Депай',          team: 'NED', club: 'Atlético',       goals: 0, assists: 0, matches: 0, avatar: '🦁' },
  { rank: 11, name: 'Дарвин Нуньес',         team: 'URU', club: 'Liverpool',      goals: 0, assists: 0, matches: 0, avatar: '🔫' },
  { rank: 12, name: 'Луис Диас',             team: 'COL', club: 'Liverpool',      goals: 0, assists: 0, matches: 0, avatar: '🐆' },
  { rank: 13, name: 'Ришарлисон',            team: 'BRA', club: 'Tottenham',      goals: 0, assists: 0, matches: 0, avatar: '🕊️' },
  { rank: 14, name: 'Ламин Ямаль',           team: 'ESP', club: 'Barcelona',      goals: 0, assists: 0, matches: 0, avatar: '🌟' },
  { rank: 15, name: 'Ромелу Лукаку',         team: 'BEL', club: 'Napoli',         goals: 0, assists: 0, matches: 0, avatar: '🏋️' },
];

// Топ-вратари — претенденты на Золотую перчатку
export const GOALKEEPERS = [
  {
    rank: 1,
    name: 'Эмильяно Мартинес',
    team: 'ARG',
    club: 'Aston Villa',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 9.2,
  },
  {
    rank: 2,
    name: 'Тибо Куртуа',
    team: 'BEL',
    club: 'Real Madrid',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 9.0,
  },
  {
    rank: 3,
    name: 'Мануэль Нойер',
    team: 'GER',
    club: 'Bayern Munich',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 8.8,
  },
  {
    rank: 4,
    name: 'Эдерсон',
    team: 'BRA',
    club: 'Man City',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 8.7,
  },
  {
    rank: 5,
    name: 'Диого Кошта',
    team: 'POR',
    club: 'Porto',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 8.6,
  },
  {
    rank: 6,
    name: 'Джордан Пикфорд',
    team: 'ENG',
    club: 'Everton',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 8.4,
  },
  {
    rank: 7,
    name: 'Мик Маньян',
    team: 'FRA',
    club: 'AC Milan',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 8.3,
  },
  {
    rank: 8,
    name: 'Фернандо Муслера',
    team: 'URU',
    club: 'Galatasaray',
    matches: 0,
    cleanSheets: 0,
    minutesWithoutGoal: 0,
    saves: 0,
    rating: 7.9,
  },
];

export const GROUPS = {
  A: {
    name: 'Группа A',
    teams: [
      { code: 'MEX', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'RSA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'KOR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'CZE', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  B: {
    name: 'Группа B',
    teams: [
      { code: 'CAN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'BIH', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'QAT', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'SUI', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  C: {
    name: 'Группа C',
    teams: [
      { code: 'BRA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'MAR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'SCO', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'HAI', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  D: {
    name: 'Группа D',
    teams: [
      { code: 'USA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'PAR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'AUS', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'TUR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  E: {
    name: 'Группа E',
    teams: [
      { code: 'GER', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'CUW', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'CIV', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'ECU', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  F: {
    name: 'Группа F',
    teams: [
      { code: 'NED', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'JPN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'TUN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'SWE', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  G: {
    name: 'Группа G',
    teams: [
      { code: 'BEL', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'EGY', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'IRN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'NZL', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  H: {
    name: 'Группа H',
    teams: [
      { code: 'ESP', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'CPV', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'KSA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'URU', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  I: {
    name: 'Группа I',
    teams: [
      { code: 'FRA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'SEN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'NOR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'IRQ', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  J: {
    name: 'Группа J',
    teams: [
      { code: 'ARG', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'ALG', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'AUT', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'JOR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  K: {
    name: 'Группа K',
    teams: [
      { code: 'POR', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'COD', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'UZB', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'COL', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
  L: {
    name: 'Группа L',
    teams: [
      { code: 'ENG', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'CRO', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'GHA', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
      { code: 'PAN', p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ],
  },
};

export const HISTORY = [
  {
    year: 1930, host: 'Уругвай', flag: '🇺🇾', winner: 'Уругвай', winnerFlag: '🇺🇾',
    runnerUp: 'Аргентина', runnerUpFlag: '🇦🇷', score: '4:2',
    third: 'США', thirdFlag: '🇺🇸', fourth: 'Югославия', fourthFlag: '🇷🇸',
    topScorer: 'Г. Стабиле (Аргентина) — 8 голов',
    teams: 13, goals: 70, attendance: '434 000',
    fact: 'Первый в истории чемпионат мира. Уругвай победил у себя дома, Аргентина стала финалистом дебютного турнира.',
  },
  {
    year: 1934, host: 'Италия', flag: '🇮🇹', winner: 'Италия', winnerFlag: '🇮🇹',
    runnerUp: 'Чехословакия', runnerUpFlag: '🇨🇿', score: '2:1 д.в.',
    third: 'Германия', thirdFlag: '🇩🇪', fourth: 'Австрия', fourthFlag: '🇦🇹',
    topScorer: 'О. Неедлы (Чехословакия) — 5 голов',
    teams: 16, goals: 70, attendance: '363 000',
    fact: 'Первый турнир с квалификационными матчами. Уругвай отказался участвовать в знак протеста.',
  },
  {
    year: 1938, host: 'Франция', flag: '🇫🇷', winner: 'Италия', winnerFlag: '🇮🇹',
    runnerUp: 'Венгрия', runnerUpFlag: '🇭🇺', score: '4:2',
    third: 'Бразилия', thirdFlag: '🇧🇷', fourth: 'Швеция', fourthFlag: '🇸🇪',
    topScorer: 'Леонидас (Бразилия) — 7 голов',
    teams: 15, goals: 84, attendance: '374 835',
    fact: 'Италия стала первой командой, защитившей титул чемпиона мира.',
  },
  {
    year: 1950, host: 'Бразилия', flag: '🇧🇷', winner: 'Уругвай', winnerFlag: '🇺🇾',
    runnerUp: 'Бразилия', runnerUpFlag: '🇧🇷', score: '2:1',
    third: 'Швеция', thirdFlag: '🇸🇪', fourth: 'Испания', fourthFlag: '🇪🇸',
    topScorer: 'А. Адемир (Бразилия) — 9 голов',
    teams: 13, goals: 88, attendance: '1 337 000',
    fact: '«Мараканасо» — шокирующая победа Уругвая над Бразилией перед 200 000 болельщиков.',
  },
  {
    year: 1954, host: 'Швейцария', flag: '🇨🇭', winner: 'ФРГ', winnerFlag: '🇩🇪',
    runnerUp: 'Венгрия', runnerUpFlag: '🇭🇺', score: '3:2',
    third: 'Австрия', thirdFlag: '🇦🇹', fourth: 'Уругвай', fourthFlag: '🇺🇾',
    topScorer: 'С. Кочиш (Венгрия) — 11 голов',
    teams: 16, goals: 140, attendance: '943 000',
    fact: '«Чудо в Берне». Германия победила непобедимых венгров в финале — 3:2.',
  },
  {
    year: 1958, host: 'Швеция', flag: '🇸🇪', winner: 'Бразилия', winnerFlag: '🇧🇷',
    runnerUp: 'Швеция', runnerUpFlag: '🇸🇪', score: '5:2',
    third: 'Франция', thirdFlag: '🇫🇷', fourth: 'ФРГ', fourthFlag: '🇩🇪',
    topScorer: 'Ж. Фонтен (Франция) — 13 голов',
    teams: 16, goals: 126, attendance: '819 810',
    fact: '17-летний Пеле забил 6 голов. Рекорд Фонтена (13 голов) не побит по сей день.',
  },
  {
    year: 1962, host: 'Чили', flag: '🇨🇱', winner: 'Бразилия', winnerFlag: '🇧🇷',
    runnerUp: 'Чехословакия', runnerUpFlag: '🇨🇿', score: '3:1',
    third: 'Чили', thirdFlag: '🇨🇱', fourth: 'Югославия', fourthFlag: '🇷🇸',
    topScorer: 'Несколько игроков — 4 гола',
    teams: 16, goals: 89, attendance: '893 172',
    fact: 'Бразилия выиграла без травмированного Пеле. Гарринча стал главной звездой турнира.',
  },
  {
    year: 1966, host: 'Англия', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', winner: 'Англия', winnerFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    runnerUp: 'ФРГ', runnerUpFlag: '🇩🇪', score: '4:2 д.в.',
    third: 'Португалия', thirdFlag: '🇵🇹', fourth: 'СССР', fourthFlag: '🇷🇺',
    topScorer: 'Эусебио (Португалия) — 9 голов',
    teams: 16, goals: 89, attendance: '1 614 677',
    fact: 'Знаменитый «гол Хёрста» в финале — до сих пор споры, пересек ли мяч линию.',
  },
  {
    year: 1970, host: 'Мексика', flag: '🇲🇽', winner: 'Бразилия', winnerFlag: '🇧🇷',
    runnerUp: 'Италия', runnerUpFlag: '🇮🇹', score: '4:1',
    third: 'ФРГ', thirdFlag: '🇩🇪', fourth: 'Уругвай', fourthFlag: '🇺🇾',
    topScorer: 'Г. Мюллер (ФРГ) — 10 голов',
    teams: 16, goals: 95, attendance: '1 673 975',
    fact: 'Бразилия — первая 3-кратная чемпионка. Пеле, Жаирзиньо, Ривелино — лучший состав в истории.',
  },
  {
    year: 1974, host: 'ФРГ', flag: '🇩🇪', winner: 'ФРГ', winnerFlag: '🇩🇪',
    runnerUp: 'Нидерланды', runnerUpFlag: '🇳🇱', score: '2:1',
    third: 'Польша', thirdFlag: '🇵🇱', fourth: 'Бразилия', fourthFlag: '🇧🇷',
    topScorer: 'Г. Лато (Польша) — 7 голов',
    teams: 16, goals: 97, attendance: '1 865 753',
    fact: 'Кройфф и «Тотальный футбол» — Нидерланды стали фаворитами. Германия Бекенбауэра выиграла финал.',
  },
  {
    year: 1978, host: 'Аргентина', flag: '🇦🇷', winner: 'Аргентина', winnerFlag: '🇦🇷',
    runnerUp: 'Нидерланды', runnerUpFlag: '🇳🇱', score: '3:1 д.в.',
    third: 'Бразилия', thirdFlag: '🇧🇷', fourth: 'Италия', fourthFlag: '🇮🇹',
    topScorer: 'М. Кемпес (Аргентина) — 6 голов',
    teams: 16, goals: 102, attendance: '1 610 215',
    fact: 'Марио Кемпес провёл блестящий финал.',
  },
  {
    year: 1982, host: 'Испания', flag: '🇪🇸', winner: 'Италия', winnerFlag: '🇮🇹',
    runnerUp: 'ФРГ', runnerUpFlag: '🇩🇪', score: '3:1',
    third: 'Польша', thirdFlag: '🇵🇱', fourth: 'Франция', fourthFlag: '🇫🇷',
    topScorer: 'П. Росси (Италия) — 6 голов',
    teams: 24, goals: 146, attendance: '2 109 723',
    fact: 'Паоло Росси — лучший бомбардир и игрок турнира.',
  },
  {
    year: 1986, host: 'Мексика', flag: '🇲🇽', winner: 'Аргентина', winnerFlag: '🇦🇷',
    runnerUp: 'ФРГ', runnerUpFlag: '🇩🇪', score: '3:2',
    third: 'Франция', thirdFlag: '🇫🇷', fourth: 'Бельгия', fourthFlag: '🇧🇪',
    topScorer: 'Г. Линекер (Англия) — 6 голов',
    teams: 24, goals: 132, attendance: '2 394 031',
    fact: '«Рука Бога» и «Гол века» — два гола Марадоны против Англии в четвертьфинале.',
  },
  {
    year: 1990, host: 'Италия', flag: '🇮🇹', winner: 'ФРГ', winnerFlag: '🇩🇪',
    runnerUp: 'Аргентина', runnerUpFlag: '🇦🇷', score: '1:0',
    third: 'Италия', thirdFlag: '🇮🇹', fourth: 'Англия', fourthFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    topScorer: 'С. Скиллачи (Италия) — 6 голов',
    teams: 24, goals: 115, attendance: '2 516 215',
    fact: 'Слёзы Скиллачи и Гасконя. Финал выиграл пенальти Брема.',
  },
  {
    year: 1994, host: 'США', flag: '🇺🇸', winner: 'Бразилия', winnerFlag: '🇧🇷',
    runnerUp: 'Италия', runnerUpFlag: '🇮🇹', score: '0:0 (3:2 пен.)',
    third: 'Швеция', thirdFlag: '🇸🇪', fourth: 'Болгария', fourthFlag: '🇧🇬',
    topScorer: 'О. Саленко (Россия), Х. Стоичков (Болгария) — 6 голов',
    teams: 24, goals: 141, attendance: '3 587 538',
    fact: 'Рекорд посещаемости. Роберто Баджо промахнулся с пенальти в финале.',
  },
  {
    year: 1998, host: 'Франция', flag: '🇫🇷', winner: 'Франция', winnerFlag: '🇫🇷',
    runnerUp: 'Бразилия', runnerUpFlag: '🇧🇷', score: '3:0',
    third: 'Хорватия', thirdFlag: '🇭🇷', fourth: 'Нидерланды', fourthFlag: '🇳🇱',
    topScorer: 'Д. Суккер (Хорватия) — 6 голов',
    teams: 32, goals: 171, attendance: '2 785 100',
    fact: 'Зинедин Зидан дублем в финале. Дебют хорватов в 1/2 финала.',
  },
  {
    year: 2002, host: 'Ю.Корея / Япония', flag: '🇰🇷🇯🇵', winner: 'Бразилия', winnerFlag: '🇧🇷',
    runnerUp: 'Германия', runnerUpFlag: '🇩🇪', score: '2:0',
    third: 'Турция', thirdFlag: '🇹🇷', fourth: 'Ю.Корея', fourthFlag: '🇰🇷',
    topScorer: 'Роналдо (Бразилия) — 8 голов',
    teams: 32, goals: 161, attendance: '2 705 197',
    fact: 'R9 Роналдо — 8 голов и золото. Сенсации: Корея в топ-4.',
  },
  {
    year: 2006, host: 'Германия', flag: '🇩🇪', winner: 'Италия', winnerFlag: '🇮🇹',
    runnerUp: 'Франция', runnerUpFlag: '🇫🇷', score: '1:1 (5:3 пен.)',
    third: 'Германия', thirdFlag: '🇩🇪', fourth: 'Португалия', fourthFlag: '🇵🇹',
    topScorer: 'М. Клозе (Германия) — 5 голов',
    teams: 32, goals: 147, attendance: '3 359 439',
    fact: 'Знаменитый удар головой Зидана Матерацци и удаление в финале.',
  },
  {
    year: 2010, host: 'ЮАР', flag: '🇿🇦', winner: 'Испания', winnerFlag: '🇪🇸',
    runnerUp: 'Нидерланды', runnerUpFlag: '🇳🇱', score: '1:0 д.в.',
    third: 'Германия', thirdFlag: '🇩🇪', fourth: 'Уругвай', fourthFlag: '🇺🇾',
    topScorer: 'Т. Мюллер, Д. Форлан и др. — 5 голов',
    teams: 32, goals: 145, attendance: '3 178 856',
    fact: 'Первый ЧМ в Африке. Гол Иньесты в дополнительное время.',
  },
  {
    year: 2014, host: 'Бразилия', flag: '🇧🇷', winner: 'Германия', winnerFlag: '🇩🇪',
    runnerUp: 'Аргентина', runnerUpFlag: '🇦🇷', score: '1:0 д.в.',
    third: 'Нидерланды', thirdFlag: '🇳🇱', fourth: 'Бразилия', fourthFlag: '🇧🇷',
    topScorer: 'Х. Родригес (Колумбия) — 6 голов',
    teams: 32, goals: 171, attendance: '3 429 873',
    fact: '«Минейразо» 7:1 против Бразилии — самое большое унижение в истории.',
  },
  {
    year: 2018, host: 'Россия', flag: '🇷🇺', winner: 'Франция', winnerFlag: '🇫🇷',
    runnerUp: 'Хорватия', runnerUpFlag: '🇭🇷', score: '4:2',
    third: 'Бельгия', thirdFlag: '🇧🇪', fourth: 'Англия', fourthFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    topScorer: 'Х. Кейн (Англия) — 6 голов',
    teams: 32, goals: 169, attendance: '3 031 768',
    fact: 'Хорватия впервые в финале! Мбаппе — MVP. 2 автогола в одном финале — рекорд.',
  },
  {
    year: 2022, host: 'Катар', flag: '🇶🇦', winner: 'Аргентина', winnerFlag: '🇦🇷',
    runnerUp: 'Франция', runnerUpFlag: '🇫🇷', score: '3:3 (4:2 пен.)',
    third: 'Хорватия', thirdFlag: '🇭🇷', fourth: 'Марокко', fourthFlag: '🇲🇦',
    topScorer: 'К. Мбаппе (Франция) — 8 голов',
    teams: 32, goals: 172, attendance: '3 404 252',
    fact: 'ЛУЧШИЙ ФИНАЛ ВСЕХ ВРЕМЁН! Месси получил Кубок — мечта осуществилась. Мбаппе — хет-трик в финале.',
  },
];

export const NEWS = [
  {
    id: 1,
    category: 'ИНСАЙД',
    categoryColor: '#E63946',
    title: 'Месси: «Это мой последний Чемпионат мира»',
    summary: 'Капитан сборной Аргентины признался, что ЧМ-2026 станет финальным турниром в карьере. Аргентина выступит в группе J против Алжира, Австрии и Иордании. «Хочу выиграть ещё раз для своего народа», — сказал 38-летний Месси.',
    time: '3 дня назад',
    emoji: '🐐',
    views: '4.2М',
    hot: true,
  },
  {
    id: 2,
    category: 'АНАЛИЗ',
    categoryColor: '#00D4FF',
    title: 'Франция — главный фаворит по версии букмекеров',
    summary: 'Все ведущие букмекеры ставят сборную Франции на первое место в списке претендентов на титул. Мбаппе, Гризманн, Камавинга — состав «трёхцветных» впечатляет. Группа I: Сенегал, Норвегия и Ирак — реальный шанс выйти без потерь.',
    time: '5 дней назад',
    emoji: '📊',
    views: '1.8М',
    hot: false,
  },
  {
    id: 3,
    category: 'РЕКОРД',
    categoryColor: '#FFD700',
    title: '48 команд впервые в истории ЧМ',
    summary: 'Чемпионат мира 2026 станет первым в истории с участием 48 национальных сборных. 12 групп по 4 команды, 104 матча за 39 дней. Расширенный формат принят FIFA в 2017 году и получил смешанные оценки экспертов.',
    time: '1 нед. назад',
    emoji: '🏆',
    views: '3.1М',
    hot: true,
  },
  {
    id: 4,
    category: 'ИНСАЙД',
    categoryColor: '#E63946',
    title: 'Роналду в 41 год идёт на последний ЧМ в карьере',
    summary: 'Криштиану Роналду войдёт в историю как один из старейших игроков на ЧМ. Португалия попала в группу K с ДР Конго, Узбекистаном и Колумбией. CR7 заявил: «Я готов биться за каждый матч».',
    time: '1 нед. назад',
    emoji: '🦁',
    views: '5.6М',
    hot: true,
  },
  {
    id: 5,
    category: 'АНАЛИЗ',
    categoryColor: '#00D4FF',
    title: 'США — хозяева и тёмная лошадка турнира',
    summary: 'США принимают основную часть матчей и обладают сильным составом: Пулишич, Реина, Уэа. Группа D со сборными Парагвая, Австралии и Турции — проходимая. Американцы могут впервые в истории выйти в полуфинал.',
    time: '10 дней назад',
    emoji: '🇺🇸',
    views: '980К',
    hot: false,
  },
  {
    id: 6,
    category: 'ИСТОРИЯ',
    categoryColor: '#7B5EA7',
    title: 'Впервые три страны принимают Чемпионат мира',
    summary: 'США, Канада и Мексика совместно проведут ЧМ-2026. 16 стадионов: 11 в США, 3 в Мексике, 2 в Канаде. Финал пройдёт 19 июля на MetLife Stadium в Нью-Джерси перед 82 000 зрителей.',
    time: '2 нед. назад',
    emoji: '🌎',
    views: '2.3М',
    hot: false,
  },
  {
    id: 7,
    category: 'ТЕХНИКА',
    categoryColor: '#22c55e',
    title: 'ИИ и VAR нового поколения на ЧМ 2026',
    summary: 'FIFA внедрила систему автоматического определения офсайда с погрешностью 2 мм. Каждый мяч оснащён датчиком, 12 камер на каждом стадионе. Новая технология ускорит принятие решений до 25 секунд.',
    time: '2 нед. назад',
    emoji: '🤖',
    views: '1.4М',
    hot: false,
  },
  {
    id: 8,
    category: 'ИНСАЙД',
    categoryColor: '#E63946',
    title: 'Холанд дебютирует на ЧМ — 5 голов в квалификации',
    summary: 'Эрлинг Холанд наконец сыграет на Чемпионате мира. Норвегия пробилась через плей-офф квалификации. В группе I их ждут Франция, Сенегал и Ирак. Нападающий Man City забил 5 мячей в отборе и рвётся в бой.',
    time: '3 нед. назад',
    emoji: '💥',
    views: '2.0М',
    hot: true,
  },
];

export const TICKER_ITEMS = [
  '⚽ До старта ЧМ 2026: 11 июня в Мехико!',
  '🏆 48 команд. 104 матча. 39 дней!',
  '⭐ Фаворит: Франция по версии букмекеров',
  '🇦🇷 Аргентина защищает титул чемпиона мира!',
  '📍 16 стадионов в США, Канаде и Мексике',
  '🎯 Жеребьёвка: 5 декабря 2025, Вашингтон',
];

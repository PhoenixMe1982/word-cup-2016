// H2H World Cup history for all group-stage match pairs
// Key: [teamA, teamB].sort().join('|') — A is alphabetically first
// All wins/goals are relative to A (alphabetically first team)
// Use [match.home, match.away].sort().join('|') to look up

export const H2H_DATA = {
  // Group A
  'MEX|RSA': {
    wcPlayed: 1,
    winsA: 0, winsB: 0, draws: 1, goalsA: 1, goalsB: 1,
    lastWC: { year: 2010, round: 'Группа A', goalsA: 1, goalsB: 1 },
    lastAny: null,
  },
  // Group C
  'BRA|MAR': {
    wcPlayed: 1,
    winsA: 1, winsB: 0, draws: 0, goalsA: 3, goalsB: 0,
    lastWC: { year: 1998, round: 'Группа H', goalsA: 3, goalsB: 0 },
    lastAny: null,
  },
  'MAR|SCO': {
    wcPlayed: 1,
    winsA: 1, winsB: 0, draws: 0, goalsA: 3, goalsB: 0,
    lastWC: { year: 1998, round: 'Группа A', goalsA: 3, goalsB: 0 },
    lastAny: null,
  },
  // Group D
  'PAR|USA': {
    wcPlayed: 1,
    winsA: 0, winsB: 1, draws: 0, goalsA: 0, goalsB: 3,
    lastWC: { year: 1930, round: 'Группа 3', goalsA: 0, goalsB: 3 },
    lastAny: { year: 2016, comp: 'Копа Америка', goalsA: 0, goalsB: 1 },
  },
  // Group F
  'JPN|NED': {
    wcPlayed: 1,
    winsA: 0, winsB: 1, draws: 0, goalsA: 0, goalsB: 1,
    lastWC: { year: 2010, round: 'Группа E', goalsA: 0, goalsB: 1 },
    lastAny: null,
  },
  // Group G
  'BEL|EGY': {
    wcPlayed: 1,
    winsA: 1, winsB: 0, draws: 0, goalsA: 3, goalsB: 1,
    lastWC: { year: 1990, round: 'Группа F', goalsA: 3, goalsB: 1 },
    lastAny: null,
  },
  // Group H
  'KSA|URU': {
    wcPlayed: 1,
    winsA: 0, winsB: 1, draws: 0, goalsA: 0, goalsB: 1,
    lastWC: { year: 2018, round: 'Группа A', goalsA: 0, goalsB: 1 },
    lastAny: null,
  },
  // Group I
  'FRA|SEN': {
    wcPlayed: 1,
    winsA: 0, winsB: 1, draws: 0, goalsA: 0, goalsB: 1,
    lastWC: { year: 2002, round: 'Группа A', goalsA: 0, goalsB: 1 },
    lastAny: { year: 2023, comp: 'Товарищеский матч', goalsA: 1, goalsB: 3 },
  },
  // Group J (matchday 2)
  'ARG|AUT': {
    wcPlayed: 1,
    winsA: 1, winsB: 0, draws: 0, goalsA: 6, goalsB: 1,
    lastWC: { year: 1958, round: 'Группа 1', goalsA: 6, goalsB: 1 },
    lastAny: null,
  },
  // Group L
  'CRO|ENG': {
    wcPlayed: 1,
    winsA: 1, winsB: 0, draws: 0, goalsA: 2, goalsB: 1,
    lastWC: { year: 2018, round: '1/2 финала', goalsA: 2, goalsB: 1 },
    lastAny: { year: 2021, comp: 'Евро 2020', goalsA: 0, goalsB: 1 },
  },
  // Group H (matchday 3)
  'ESP|URU': {
    wcPlayed: 1,
    winsA: 0, winsB: 1, draws: 0, goalsA: 2, goalsB: 3,
    lastWC: { year: 1950, round: 'Финальный раунд', goalsA: 2, goalsB: 3 },
    lastAny: { year: 2023, comp: 'Товарищеский матч', goalsA: 3, goalsB: 1 },
  },
}

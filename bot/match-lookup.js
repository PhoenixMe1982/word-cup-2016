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
}

// football-data.org TLA → our code (handles any code mismatches)
const TLA_ALIASES = {
  'SAU': 'KSA',  // Saudi Arabia
  'DRC': 'COD',  // DR Congo
  'HTI': 'HAI',  // Haiti
  'CUR': 'CUW',  // Curaçao
  'CPV': 'CPV',  // Cape Verde (same)
}

function normTLA(tla) {
  return TLA_ALIASES[tla] || tla
}

function lookupMatchId(homeTLA, awayTLA) {
  return MATCH_LOOKUP[`${normTLA(homeTLA)}_${normTLA(awayTLA)}`]
}

module.exports = { MATCH_LOOKUP, TLA_ALIASES, normTLA, lookupMatchId }

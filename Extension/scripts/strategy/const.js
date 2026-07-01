import { idFromCode } from '../../common/circuits.js';

const track_info = {
  'au': { 'length': 5.3017135,  'wear': 40, avg: 226.1090047 }, // Australia
  'my': { 'length': 5.5358276,  'wear': 80, avg: 208.879     }, // Malaysia
  'cn': { 'length': 5.4417996,  'wear': 80, avg: 207.975     }, // China
  'bh': { 'length': 4.7273,     'wear': 60, avg: 184.933     }, // Bahrain
  'es': { 'length': 4.4580207,  'wear': 85, avg: 189.212     }, // Spain
  'mc': { 'length': 4.0156865,  'wear': 20, avg: 187         }, // Monaco
  'tr': { 'length': 5.1630893,  'wear': 90, avg: 196         }, // Turkey
  'de': { 'length': 4.1797523,  'wear': 50, avg: 215.227     }, // Germany
  'hu': { 'length': 3.4990127,  'wear': 30, avg: 165.043     }, // Hungary
  'eu': { 'length': 5.5907145,  'wear': 45, avg: 199.05      }, // Europe
  'be': { 'length': 7.0406127,  'wear': 60, avg: 217.7       }, // Belgium
  'it': { 'length': 5.4024186,  'wear': 35, avg: 263.107     }, // Italy
  'sg': { 'length': 5.049042,   'wear': 45, avg: 187.0866142 }, // Singapore
  'jp': { 'length': 5.0587635,  'wear': 70, avg: 197.065     }, // Japan
  'br': { 'length': 3.9715014,  'wear': 60, avg: 203.932     }, // Brazil
  'ae': { 'length': 5.412688,   'wear': 50, avg: 213.218309  }, // Abu Dhabi
  'gb': { 'length': 5.75213,    'wear': 65, avg: 230.552     }, // Great Britain
  'fr': { 'length': 5.882508,   'wear': 80, avg: 215.1585366 }, // France
  'at': { 'length': 4.044372,   'wear': 60, avg: 228.546     }, // Austria
  'ca': { 'length': 4.3413563,  'wear': 45, avg: 221.357243  }, // Canada
  'az': { 'length': 6.053212,   'wear': 45, avg: 220.409     }, // Azerbaijan
  'mx': { 'length': 4.3076024,  'wear': 60, avg: 172.32      }, // Mexico
  'ru': { 'length': 6.078335,   'wear': 50, avg: 197.092     }, // Russia
  'us': { 'length': 4.60296,    'wear': 65, avg: 186.568     }, // USA
  'nl': { 'length': 4.259,      'wear': 65, avg: 186.568     }, // Netherlands
};

const trackLink = {
  'au': 'd=circuit&id=1&tab=history',
  'my': 'd=circuit&id=2&tab=history',
  'cn': 'd=circuit&id=3&tab=history',
  'bh': 'd=circuit&id=4&tab=history',
  'es': 'd=circuit&id=5&tab=history',
  'mc': 'd=circuit&id=6&tab=history',
  'tr': 'd=circuit&id=7&tab=history',
  'de': 'd=circuit&id=9&tab=history',
  'hu': 'd=circuit&id=10&tab=history',
  'eu': 'd=circuit&id=11&tab=history',
  'be': 'd=circuit&id=12&tab=history',
  'it': 'd=circuit&id=13&tab=history',
  'sg': 'd=circuit&id=14&tab=history',
  'jp': 'd=circuit&id=15&tab=history',
  'br': 'd=circuit&id=16&tab=history',
  'ae': 'd=circuit&id=17&tab=history',
  'gb': 'd=circuit&id=18&tab=history',
  'fr': 'd=circuit&id=19&tab=history',
  'at': 'd=circuit&id=20&tab=history',
  'ca': 'd=circuit&id=21&tab=history',
  'az': 'd=circuit&id=22&tab=history',
  'mx': 'd=circuit&id=23&tab=history',
  'ru': 'd=circuit&id=24&tab=history',
  'us': 'd=circuit&id=25&tab=history',
  'nl': 'd=circuit&id=26&tab=history',
};

/**
 * trackDictionary: code -> [searchable name aliases..., numericId]
 *
 * The id in each entry is derived from common/circuits.js so it can
 * never drift out of sync with the canonical mapping.
 *
 * The name aliases are used by readGSheets() in strategy.js to match
 * rows in a user's Google Sheet to the current circuit.
 */
const trackDictionary = {
  'au': ['australia',    'au',                          idFromCode('au')],
  'my': ['malaysia',     'my',                          idFromCode('my')],
  'cn': ['china',        'cn',                          idFromCode('cn')],
  'bh': ['bahrain',      'bh',                          idFromCode('bh')],
  'es': ['spain',        'es',                          idFromCode('es')],
  'mc': ['monaco',       'mc',                          idFromCode('mc')],
  'tr': ['turkey',       'tr',                          idFromCode('tr')],
  'de': ['germany',      'de',                          idFromCode('de')],
  'hu': ['hungary',      'hu',                          idFromCode('hu')],
  'eu': ['europe',       'eu',                          idFromCode('eu')],
  'be': ['belgium',      'be',                          idFromCode('be')],
  'it': ['italy',        'it',                          idFromCode('it')],
  'sg': ['sg',           'singapore',                   idFromCode('sg')],
  'jp': ['japan',        'jp',                          idFromCode('jp')],
  'br': ['brazil',       'br',                          idFromCode('br')],
  'ae': ['abu dhabi',    'abudhabi',        'ae',       idFromCode('ae')],
  'gb': ['gb',           'gb 19',           'great britan', idFromCode('gb')],
  'fr': ['france',       'fr',                          idFromCode('fr')],
  'at': ['austria',      'at',                          idFromCode('at')],
  'ca': ['canada',       'ca',                          idFromCode('ca')],
  'az': ['azerbaijan',   'az',                          idFromCode('az')],
  'mx': ['mexico',       'mx',                          idFromCode('mx')],
  'ru': ['russia',       'ru',                          idFromCode('ru')],
  'us': ['usa',          'us',                          idFromCode('us')],
  'nl': ['netherlands',  'nl',                          idFromCode('nl')],
};

export {
  track_info,
  trackLink,
  trackDictionary,
};
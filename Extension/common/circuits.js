/**
 *
 * Single source of truth for the circuit numeric ID <-> 2-letter code
 * mapping, and lookup helpers built on top of it.
 *
 * PREVIOUSLY this mapping was duplicated (and inconsistent) in two places:
 *
 *   1. scripts/track_history.js — `trackCharacteristics` object keyed by
 *      numeric id, with a `code` field on each entry.
 *   2. scripts/strategy/const.js — `trackDictionary` keyed by 2-letter
 *      code, with the numeric id as the 3rd element of each value array.
 *
 * The two copies had two bugs:
 *   - `trackDictionary` had `nl` mapping to id 25 (same as `us`). Correct
 *     id for Netherlands is 26.
 *   - `trackCharacteristics` had id 8 mapping to code `'gb9'` — a stale
 *     copy-paste artifact. ID 8 is unused in the live game; Great Britain
 *     is id 18.
 *
 * HOW TO USE
 * ──────────
 * Import the helpers you need:
 *
 *   const { codeFromId, idFromCode, trackCodes } = await import(
 *     chrome.runtime.getURL('common/circuits.js')
 *   );
 *
 *   codeFromId(18)   // 'gb'
 *   idFromCode('gb') // 18
 *   trackCodes       // ['au', 'my', 'cn', ...]
 */

/**
 * Canonical numeric id → 2-letter code mapping.
 * Ids match the values used in igpmanager URLs (d=circuit&id=N).
 * Id 8 is intentionally omitted — it was a retired/test circuit and
 * does not appear in current game data.
 *
 * @type {Readonly<Record<number, string>>}
 */
const ID_TO_CODE = Object.freeze({
  1:  'au',  // Australia
  2:  'my',  // Malaysia
  3:  'cn',  // China
  4:  'bh',  // Bahrain
  5:  'es',  // Spain
  6:  'mc',  // Monaco
  7:  'tr',  // Turkey
  9:  'de',  // Germany
  10: 'hu',  // Hungary
  11: 'eu',  // Europe
  12: 'be',  // Belgium
  13: 'it',  // Italy
  14: 'sg',  // Singapore
  15: 'jp',  // Japan
  16: 'br',  // Brazil
  17: 'ae',  // Abu Dhabi
  18: 'gb',  // Great Britain
  19: 'fr',  // France
  20: 'at',  // Austria
  21: 'ca',  // Canada
  22: 'az',  // Azerbaijan
  23: 'mx',  // Mexico
  24: 'ru',  // Russia
  25: 'us',  // USA
  26: 'nl',  // Netherlands
});

/**
 * Inverse map: 2-letter code → numeric id.
 * Derived from ID_TO_CODE so it's always consistent.
 *
 * @type {Readonly<Record<string, number>>}
 */
const CODE_TO_ID = Object.freeze(
  Object.fromEntries(Object.entries(ID_TO_CODE).map(([id, code]) => [code, Number(id)]))
);

/**
 * All valid 2-letter track codes in id order.
 * @type {readonly string[]}
 */
const trackCodes = Object.freeze(Object.values(ID_TO_CODE));

/**
 * All valid numeric track ids.
 * @type {readonly number[]}
 */
const trackIds = Object.freeze(Object.keys(ID_TO_CODE).map(Number));

/**
 * Look up the 2-letter code for a given numeric track id.
 * Returns null for unknown ids (e.g. the retired id 8).
 *
 * @param {number|string} id
 * @returns {string|null}
 */
function codeFromId(id) {
  return ID_TO_CODE[Number(id)] ?? null;
}

/**
 * Look up the numeric id for a given 2-letter track code.
 * Returns null for unknown codes.
 *
 * @param {string} code
 * @returns {number|null}
 */
function idFromCode(code) {
  return CODE_TO_ID[code] ?? null;
}

export { ID_TO_CODE, CODE_TO_ID, trackCodes, trackIds, codeFromId, idFromCode };
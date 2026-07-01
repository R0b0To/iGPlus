/**
 * common/gameActions.js
 *
 * Thin client for iGPmanager "action" endpoints — the authenticated,
 * CSRF-guarded requests that mutate game state (build, repair, collect…).
 *
 * WHY THIS EXISTS
 * ───────────────
 * headquarters.js had three functions (doUpgrade, doMaintain, doCollect)
 * each copy-pasting the same ~15-line fetch block:
 *
 *   const { name: csrfName, token: csrfToken } = getCsrfTokens();
 *   const res = await fetch(url, {
 *     method: 'GET',
 *     credentials: 'include',
 *     headers: {
 *       'accept': 'application/json, text/javascript, *\/*; q=0.01',
 *       'x-requested-with': 'XMLHttpRequest',
 *       ...(csrfName  && { 'x-csrf-name':  csrfName  }),
 *       ...(csrfToken && { 'x-csrf-token': csrfToken }),
 *     },
 *   });
 *   const data = await res.json();
 *   if (data.csrf) { cachedCsrfName = ...; cachedCsrfToken = ...; }
 *
 * This module owns that pattern once. Callers get back the parsed JSON
 * and handle their own UI logic.
 *
 * CSRF TOKEN CACHE
 * ────────────────
 * The game rotates CSRF tokens on every mutating response. The cache is
 * module-level so it survives across multiple action calls within a single
 * page session, matching the previous behaviour of the IIFE-scoped
 * variables in headquarters.js.
 *
 * USAGE
 * ─────
 *   const { gameApiFetch } = await import(chrome.runtime.getURL('common/gameActions.js'));
 *
 *   const data = await gameApiFetch(
 *     'https://igpmanager.com/index.php?action=send&type=hqRepair&fId=3'
 *   );
 *   if (data?.success) { ... }
 */

const BASE = 'https://igpmanager.com/index.php';

// Module-level CSRF token cache. Seeded from the page's global variables
// on first use; updated from every response that carries a new token pair.
let _csrfName  = null;
let _csrfToken = null;

/**
 * Read the current CSRF tokens, preferring the cached values (which are
 * the most recently rotated pair) and falling back to whatever the page
 * injects as globals.
 *
 * @returns {{ name: string|null, token: string|null }}
 */
function getCsrfTokens() {
  return {
    name:  _csrfName  ?? window.csrfName  ?? document.getElementById('cmsCsrfName')?.value  ?? null,
    token: _csrfToken ?? window.csrfToken ?? document.getElementById('cmsCsrfToken')?.value ?? null,
  };
}

/**
 * Update the local CSRF cache from a response payload.
 * The game returns { csrf: { name, token } } on every mutating response.
 *
 * @param {Object} data - parsed JSON response body
 */
function refreshCsrfCache(data) {
  if (data?.csrf?.name && data?.csrf?.token) {
    _csrfName  = data.csrf.name;
    _csrfToken = data.csrf.token;
  }
}

/**
 * Send an authenticated GET request to an igpmanager action endpoint.
 *
 * Builds the correct headers (credentials + CSRF), parses the JSON
 * response, and rotates the CSRF cache before returning.
 *
 * Returns null if the response is not OK (rather than throwing), so
 * callers can check for null and handle silently for non-critical actions.
 *
 * @param {string} url - full URL, e.g. `${BASE}?action=send&type=hqRepair&fId=3`
 * @returns {Promise<Object|null>} parsed response JSON, or null on failure
 */
async function gameApiFetch(url) {
  const { name: csrfName, token: csrfToken } = getCsrfTokens();

  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        ...(csrfName  && { 'x-csrf-name':  csrfName  }),
        ...(csrfToken && { 'x-csrf-token': csrfToken }),
      },
    });
  } catch (err) {
    console.error('iGPlus [gameActions]: network error', err);
    return null;
  }

  if (!res.ok) {
    console.error(`iGPlus [gameActions]: HTTP ${res.status} for ${url}`);
    return null;
  }

  let data;
  try {
    // Some endpoints return 200 with an empty body on success
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error('iGPlus [gameActions]: failed to parse response JSON', err);
    return null;
  }

  refreshCsrfCache(data);
  return data;
}

/**
 * Convenience wrapper that builds the full igpmanager URL from a query string.
 *
 * @param {string} queryString - e.g. 'action=send&type=hqRepair&fId=3'
 * @returns {Promise<Object|null>}
 */
function gameAction(queryString) {
  return gameApiFetch(`${BASE}?${queryString}`);
}

export { gameApiFetch, gameAction, getCsrfTokens };
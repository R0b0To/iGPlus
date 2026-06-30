/**
 * common/storage.js
 *
 * Centralized async-friendly wrapper around extension storage.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Several files used the pattern:
 *
 *   const data = await chrome.storage.local.get({...}) ?? await browser.storage.local.get({...});
 *
 * This looks like a chrome/firefox fallback, but `chrome.storage.local.get(...)`
 * (with no callback) always returns a Promise object, which is truthy. `??`
 * only falls through on null/undefined, so the right-hand `browser.storage`
 * call NEVER executes — it's dead code, and on Firefox (where `chrome` is
 * usually aliased to `browser` anyway by the polyfill, but isn't guaranteed
 * in every build target) this pattern silently masked itself rather than
 * actually providing a fallback.
 *
 * This module picks the correct API once (`browser` if present, else
 * `chrome`) and exposes plain async methods, removing the need for the
 * fragile `??` pattern anywhere else in the codebase.
 */

const ext = (typeof globalThis.browser !== 'undefined') ? globalThis.browser : globalThis.chrome;

/**
 * @param {string|string[]|Object} keys - same shape as chrome.storage.local.get
 * @returns {Promise<Object>}
 */
function get(keys) {
  return ext.storage.local.get(keys);
}

/**
 * @param {Object} items
 * @returns {Promise<void>}
 */
function set(items) {
  return ext.storage.local.set(items);
}

/**
 * @param {string|string[]} keys
 * @returns {Promise<void>}
 */
function remove(keys) {
  return ext.storage.local.remove(keys);
}

/**
 * Convenience: get a single key with a default, returning just the value
 * (not the {key: value} wrapper object).
 *
 * @param {string} key
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
async function getOrInit(key, defaultValue) {
  const data = await get({ [key]: defaultValue });
  return data[key];
}

export { ext, get, set, remove, getOrInit };
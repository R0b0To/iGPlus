/**
 * common/safeQuery.js
 *
 * Safe DOM querying helpers that log missing elements with context instead
 * of throwing, and return null so callers can guard with `?.` or early-return.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Content scripts query DOM elements injected by a third-party game page.
 * When the game updates its HTML the selectors silently break, and the
 * resulting TypeError ("Cannot read properties of null") surfaces as an
 * unhelpful stack trace with no indication of which script failed or which
 * element was expected.
 *
 * These helpers:
 *  - Never throw on a missing element.
 *  - Log a descriptive warning (script name + selector + optional context)
 *    so that post-update breakage is immediately actionable.
 *  - Return null on miss so the existing `?.` / early-return patterns
 *    already in the codebase continue to work without any change.
 *
 * USAGE
 * ─────
 *   import { safeQuery, safeQueryAll, safeQueryIn } from 'common/safeQuery.js';
 *
 *   // Single element — warns and returns null if missing
 *   const flag = safeQuery('.flag', 'race setup: circuit code');
 *
 *   // All matching elements — warns and returns [] if none found
 *   const forms = safeQueryAll('[id*="setup"] .igpForm', 'race setup: setup forms');
 *
 *   // Query within a known parent — warns if parent or child missing
 *   const input = safeQueryIn(form, '.setupSlider-input', 'race setup: slider');
 */

/**
 * Query a single element from document.
 * Returns the element or null; never throws.
 *
 * @param {string} selector
 * @param {string} [context] - Human-readable label shown in the warning.
 * @returns {Element|null}
 */
function safeQuery(selector, context = '') {
  const el = document.querySelector(selector);
  if (!el) {
    const label = context ? ` [${context}]` : '';
    console.warn(`iGPlus${label}: element not found — "${selector}"`);
  }
  return el;
}

/**
 * Query all matching elements from document.
 * Returns a (possibly empty) Array; never throws.
 * Warns when the result is empty.
 *
 * @param {string} selector
 * @param {string} [context]
 * @returns {Element[]}
 */
function safeQueryAll(selector, context = '') {
  const els = Array.from(document.querySelectorAll(selector));
  if (els.length === 0) {
    const label = context ? ` [${context}]` : '';
    console.warn(`iGPlus${label}: no elements found — "${selector}"`);
  }
  return els;
}

/**
 * Query a single element within a given parent element.
 * Returns the element or null; never throws.
 * Warns if the parent itself is null/undefined, or if the child is missing.
 *
 * @param {Element|null|undefined} parent
 * @param {string} selector
 * @param {string} [context]
 * @returns {Element|null}
 */
function safeQueryIn(parent, selector, context = '') {
  const label = context ? ` [${context}]` : '';
  if (!parent) {
    console.warn(`iGPlus${label}: parent is null, cannot query "${selector}"`);
    return null;
  }
  const el = parent.querySelector(selector);
  if (!el) {
    console.warn(`iGPlus${label}: child not found — "${selector}"`);
  }
  return el;
}

/**
 * Require an element — like safeQuery but also returns a boolean so callers
 * can use it as a guard in a single expression:
 *
 *   if (!requireElement('.flag', 'circuit detection')) return;
 *
 * @param {string} selector
 * @param {string} [context]
 * @returns {Element|null}
 */
function requireElement(selector, context = '') {
  return safeQuery(selector, context);
}

export { safeQuery, safeQueryAll, safeQueryIn, requireElement };
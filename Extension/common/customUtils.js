/**
 * Generates a hash code from a string.
 * Simple hash function, not cryptographically secure.
 * @param {string} str - The input string.
 * @returns {number} The calculated hash code.
 */
function hashCode(str) {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Simulates a click event on a given HTML element.
 * Useful for triggering actions on elements that expect user clicks.
 * @param {HTMLElement} element - The HTML element to click.
 * @param {number} [eventDelay=50] - Optional delay in ms after dispatching the event.
 */
async function simulateClick(element, eventDelay = 50) {
  if (!element) return;
  // Create a new mouse event.
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  // Dispatch the event.
  element.dispatchEvent(event);
  // Add a small delay to allow event processing.
  if (eventDelay > 0) {
    // Assuming 'delay' function is available globally or imported if this file becomes a module.
    // For now, using a direct Promise for setTimeout if 'delay' isn't guaranteed here.
    await new Promise(resolve => setTimeout(resolve, eventDelay));
  }
}

/**
 * Checks if a given node is a child of a specified parent node.
 * @param {Node} childNode - The node to check if it's a child.
 * @param {Node} parentNode - The potential parent node.
 * @returns {boolean} True if childNode is a descendant of parentNode, false otherwise.
 */
function isElementChildOf(childNode, parentNode) {
  if (!childNode || !parentNode) {
    return false;
  }
  let currentNode = childNode;
  while (currentNode && currentNode !== document.body) { // Stop if we reach the body or null
    if (currentNode === parentNode) {
      return true;
    }
    currentNode = currentNode.parentNode;
  }
  return false;
}

/**
 * Basic HTML "cleaning" function that extracts text content from an HTML string.
 * This implementation uses DOMParser to avoid direct innerHTML manipulation with potentially unsafe strings
 * and focuses on getting text, effectively stripping tags.
 * For more robust HTML sanitization against XSS, a dedicated sanitization library should be used.
 * @param {string} htmlString - The HTML string to clean.
 * @returns {string} The extracted text content, or an empty string if input is invalid.
 */
function cleanHtml(htmlString) {
  if (typeof htmlString !== 'string') {
    return '';
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    // console.error("Error parsing HTML string in cleanHtml:", e);
    return ''; // Or return the original string, depending on desired error handling
  }
}

export {
    hashCode,
    simulateClick,
    isElementChildOf,
    cleanHtml
};

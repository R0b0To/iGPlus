/**
 * common/dom.js
 *
 * Single shared DOM-element builder. Previously this exact helper (or a
 * near-identical variant) was copy-pasted into:
 *   - scripts/settings/settingsHTML.js
 *   - scripts/settings/addSettings.js
 *   - scripts/headquarters.js (a superset, with extra dataset/style support)
 *
 * Having three copies meant a bugfix or feature (e.g. better style-object
 * handling) in one file silently didn't apply to the others. This is the
 * canonical version — it's the headquarters.js variant, since it was the
 * most capable (supports className, dataset, style objects/strings, and
 * arrays of children).
 *
 * Usage:
 *   el('div', { id: 'myId', className: 'text' }, el('span', { textContent: 'Hello' }))
 */
function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;

    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dKey, dVal] of Object.entries(value)) {
        element.dataset[dKey] = dVal;
      }
    } else if (key === 'style') {
      if (typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.style.cssText = value;
      }
    } else if (key === 'htmlFor') {
      element.htmlFor = value;
    } else if (['textContent', 'id', 'type', 'title', 'checked', 'disabled', 'value'].includes(key)) {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (child === null || child === undefined) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c) element.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
      });
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

export { el };
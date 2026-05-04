// ============================================================
// SLIDER
// ============================================================

function createSlider(node, min, max) {
  const valueDiv = node.previousElementSibling.childNodes[1];
  valueDiv.classList.remove('green');

  const track = document.createElement('div');
  track.classList.add('track');

  const slider = Object.assign(document.createElement('input'), {
    className: 'sliderX',
    type: 'range',
    min, max,
    value: valueDiv.textContent,
  });

  const container = document.createElement('div');
  container.classList.add('sliderContainer');
  container.append(track, slider);

  const getPercent = ({ value, min, max }) =>
    ((value - min) / (max - min)) * 100;

  const attachLabel = () => {
    track.append(valueDiv);
    valueDiv.classList.add('slider-label');
    valueDiv.style.left = `${getPercent(slider)}%`;
  };

  const detachLabel = () => {
    valueDiv.classList.remove('slider-label');
    container.classList.remove('visible');
    slider.closest('.igpNum')?.insertBefore(valueDiv, slider.closest('.igpNum').lastChild);
  };

  slider.addEventListener('input', () => {
    container.classList.add('visible');
    valueDiv.textContent = slider.value;
    attachLabel();
  });

  slider.addEventListener('change', () => {
    detachLabel();
    slider.parentElement.parentElement.nextElementSibling.value = slider.value;
    if (slider.value == 0) {
      const formId = slider.closest('form').id;
      document.getElementsByName('fuel1')[formId[1] - 1].value = 0;
    }
  });

  valueDiv.addEventListener('click', () => {
    const isVisible = container.classList.contains('visible');
    isVisible ? detachLabel() : (container.classList.add('visible'), attachLabel());
  });

  valueDiv.classList.add('withSlider');
  node.previousElementSibling.prepend(container);
}

// ============================================================
// HASH
// ============================================================

function hashCode(string) {
  return [...string].reduce((hash, char) => {
    const h = ((hash << 5) - hash) + char.charCodeAt(0);
    return h & h;
  }, 0);
}

// ============================================================
// STRATEGY PREVIEW
// ============================================================

async function strategyPreview(strategies, car_info, totalLaps) {
  const tbody = document.createElement('tbody');
  tbody.id = 'saveList';
  tbody.classList.add('saveListContainerPreview');

  const filtered = Object.entries(strategies).filter(
    ([, s]) => totalLaps == null || s.laps.total === parseInt(totalLaps)
  );

  const rows = await Promise.all(
    filtered.map(([id, s]) => createPreview(s, id, car_info))
  );

  rows.forEach(row => row && tbody.append(row));
  return tbody;
}

async function createPreview(strategy, id, car_info) {
  try {
    const [{ track_info, multipliers }, { get_wear }] = await Promise.all([
      import(chrome.runtime.getURL('scripts/strategy/const.js')),
      import(chrome.runtime.getURL('scripts/strategy/strategyMath.js')),
    ]);

    const { laps = {}, stints = {}, track, length } = strategy;
    const TRACK_INFO = track_info[track];
    const doingPct = ((laps.doing ?? 1) / (laps.total ?? 1)) * 100;

    const stintsContainer = document.createElement('td');
    stintsContainer.classList.add('stintsContainer');
    stintsContainer.style.width = `${doingPct}%`;

    const stintEntries = Object.entries(stints).filter(([k]) => !isNaN(k));

    stintEntries.forEach(([, stint], i) => {
      const zIndex = (stintEntries.length - i) * 2;
      const { tyre, laps: stintLaps } = stint;

      const tyreEl = Object.assign(document.createElement('div'), {
        textContent: stintLaps,
      });
      tyreEl.classList.add('loadStint', 'preview-tyre', `plus-${tyre}`);
      tyreEl.style.zIndex = zIndex + 1;

      const lapsEl = document.createElement('div');
      lapsEl.classList.add('loadStint', 'preview-laps', `plus-${tyre}`);
      lapsEl.style.cssText = `width:${(stintLaps / laps.total) * 100}%; z-index:${zIndex}`;

      stintsContainer.append(tyreEl, lapsEl);
    });

    const row = document.createElement('tr');
    row.id = id;
    row.classList.add('saveRow');
    row.append(stintsContainer, createDeleteButton());
    return row;
  } catch (error) {
    console.warn('Strategy format mismatch — clear saves to restore functionality.', error);
  }
}

// ============================================================
// BUTTONS
// ============================================================

const ICONS = {
  download: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g><g><g>
      <path d="M3,12.3v7a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2v-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
      <polyline fill="none" points="7.9 12.3 12 16.3 16.1 12.3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
      <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="2.7" y2="14.2"/>
    </g></g></g>
  </svg>`,
  delete: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z" fill="currentColor"/>
    <path d="M9 9H11V17H9V9Z" fill="currentColor"/>
    <path d="M13 9H15V17H13V9Z" fill="currentColor"/>
  </svg>`,
};

function createIconButton(iconKey, ...classes) {
  const td = document.createElement('td');
  td.innerHTML = ICONS[iconKey];
  td.classList.add(...classes, 'pushBtn');
  return td;
}

const createDownloadButton = () => createIconButton('download', 'download-button');
const createDeleteButton   = () => createIconButton('delete', 'trash');

// ============================================================
// SIMULATE CLICK
// ============================================================

function simulateClick(node) {
  const makeEvent = type => new MouseEvent(type, {
    view: window, bubbles: true, cancelable: true, button: 50,
  });

  return new Promise(resolve => {
    if (node.classList.contains('minus')) {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve(true);
      });
      observer.observe(
        node.parentElement.querySelector('.num'),
        { subtree: true, childList: true }
      );
    }

    node.dispatchEvent(makeEvent('touchstart'));
    node.dispatchEvent(makeEvent('touchend'));

    if (node.classList.contains('plus')) resolve(true);
  });
}

// ============================================================
// UTILITIES
// ============================================================

function cleanHtml(string) {
  const div = document.createElement('div');
  div.innerHTML = DOMPurify.sanitize(string);
  return div.children[0];
}

/**
 * Finds the league tier of the manager.
 * @returns {Promise<1|2|3>} 1 = Rookie, 3 = Elite
 */
async function findCurrentTier() {
  const { fetchManagerData } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const { team } = await fetchManagerData(2);
  return team._tier || 3;
}

// ============================================================
// EXPORTS
// ============================================================

export {
  createSlider,
  hashCode,
  strategyPreview,
  createDownloadButton,
  createDeleteButton,
  simulateClick,
  findCurrentTier,
  cleanHtml,
};
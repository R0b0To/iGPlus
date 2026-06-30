/**
 * INITIALIZATION
 */
(async () => {
  try {

/**
 * SHARED HELPERS
 */

const { DRIVER_FIELD, WING_MODIFIER_FIELDS } =
    await import(chrome.runtime.getURL('common/driverFields.js'));
// Centralized parsing of the circuit code from the UI
async function getCircuitCode() {
  const { safeQuery } = await import(chrome.runtime.getURL('common/safeQuery.js'));
  const flag = safeQuery('.flag', 'setup: circuit flag');
  return flag ? flag.className.split("-")[1].split(" ")[0] : null;
}

// Logic to calculate adjustment based on scale and height
function calculateHeightAdjustment(driverHeight, scale) {
  const heightKey = Object.keys(scale)
    .sort((a, b) => b - a)
    .find((k) => +k <= driverHeight);
  return heightKey ? scale[heightKey] : 0;
}

function calculateWingModifier(driverRaw) {
  if (!driverRaw) return 0;
  const parts = driverRaw.split(',');
  if (parts.length < 12) return 0;

  const skills = WING_MODIFIER_FIELDS
    .map(idx => parseFloat(parts[idx]))
    .filter(val => !isNaN(val))
    .map(val => (val / 40) * 100);

  if (skills.length === 0) return 0;

  const L = skills.reduce((sum, val) => sum + val, 0) / skills.length;
  return Math.floor((75 - L) / 5);
}

function calculateSuggestedAero(driverRaw, circuits, circuitCode) {
  const modifier = calculateWingModifier(driverRaw);
  const wingBase = circuits[circuitCode]?.wing ?? 1;
  return Math.max(1, wingBase + modifier);
}

/**
 * CORE LOGIC
 */

async function addSetupSuggestionsForDrivers() {
  // 1. Centralized Imports
  const [
    { getActiveCircuits, getActiveScale },
    { fetchManagerDataGet },
    { cleanHtml },
    { safeQuery, safeQueryAll }
  ] = await Promise.all([
    import(chrome.runtime.getURL('scripts/raceSetup/settings.js')),
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('scripts/strategy/utility.js')),
    import(chrome.runtime.getURL('common/safeQuery.js'))
  ]);

  // 2. Create placeholders immediately for all existing setup forms
  const setupForms = safeQueryAll('[id*="setup"] .igpForm', 'setup: setup forms');
  setupForms.forEach((setupForm) => {
    if (!setupForm.classList.contains('withSuggestion')) {
      createSetupPlaceholder(setupForm);
    }
  });

  // 3. Fetch data in parallel
  const [allInfo, circuits, scale, circuitCode] = await Promise.all([
    fetchManagerDataGet(),
    getActiveCircuits(),
    getActiveScale(),
    getCircuitCode()
  ]);

  if (!circuitCode) return;

  const leagueTier = allInfo.team._tier;
  const driversData = cleanHtml(allInfo.vars.drivers ?? allInfo.preCache["p=staff"].vars.drivers)
    .querySelectorAll('.hoverData');

  const baseTrackSetup = circuits[circuitCode];
  if (!baseTrackSetup) return;

  // 4. Update placeholders with actual data
  driversData.forEach((node, index) => {
    const driverIndex = index + 1;
    const driverRaw = node.dataset.driver;
    if (!driverRaw) return;

    const driverHeight = driverRaw.split(',')[DRIVER_FIELD.height];
    const heightAdjustment = calculateHeightAdjustment(driverHeight, scale);
    const finalWing = calculateSuggestedAero(driverRaw, circuits, circuitCode);

    updateSetupUI({
      baseTrackSetup,
      heightAdjustment,
      finalWing,
      driverHeight,
      driverRaw,
      driverIndex,
      circuitCode,
      leagueTier,
      circuits
    });
  });
}

function createSetupPlaceholder(setupForm) {
  if (setupForm.classList.contains('withSuggestion')) return;

  const editBtn = document.createElement('div');
  editBtn.className = 'setup-edit-icon setup-edit-icon--loading';
  editBtn.innerHTML = '⚙️';
  if (!setupForm.querySelector('.setup-edit-icon'))
    setupForm.prepend(editBtn);

  const driverId = setupForm.id.match(/d(\d+)setup/)?.[1];
  if (!driverId) return;

  ['Suspension', 'Ride', 'Aerodynamics'].forEach((field) => {
    const container = setupForm.querySelector(`#d${driverId}${field}`)?.firstChild;
    if (container && !container.querySelector('.suggestedSetup')) {
      const span = document.createElement('span');
      span.className = 'suggestedSetup suggestedSetup--loading';
      span.textContent = '...';
      container.append(span);
    }
  });

  setupForm.classList.add('withSuggestion');
}

function updateSetupUI({ baseTrackSetup, heightAdjustment, finalWing, driverIndex, circuitCode, leagueTier, circuits, driverHeight, driverRaw }) {
  const setupForm = document.querySelector(`#d${driverIndex}setup`);
  if (!setupForm) return;

  const finalRide = Math.max(1, baseTrackSetup.ride + heightAdjustment);

  const updateOrCreateSuggestion = (parentId, value, isSuspension = false) => {
    const container = setupForm.querySelector(`#d${driverIndex}${parentId}`)?.firstChild;
    if (!container) return;

    if (isSuspension) container.id = 'suggestedSetup';

    let span = container.querySelector('.suggestedSetup');
    if (span) {
      span.textContent = value;
      span.classList.remove('suggestedSetup--loading');
    } else {
      span = document.createElement('span');
      span.className = 'suggestedSetup';
      span.textContent = value;
      container.append(span);
    }

    span.style.cursor = 'pointer';
    span.onclick = () => {
      const input = container.querySelector('.setupSlider-input');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
  };

  updateOrCreateSuggestion('Suspension', baseTrackSetup.suspension, true);
  updateOrCreateSuggestion('Ride', finalRide);
  updateOrCreateSuggestion('Aerodynamics', finalWing);

  const editBtn = setupForm.querySelector('.setup-edit-icon');
  if (editBtn) {
    editBtn.classList.remove('setup-edit-icon--loading');
    editBtn.onclick = () => openPersonalizeModal({
      baseTrackSetup,
      heightAdjustment,
      finalWing,
      driverHeight,
      driverRaw,
      circuitCode,
      leagueTier,
      circuits,
    });
  }
}

function openPersonalizeModal({ baseTrackSetup, heightAdjustment, finalWing, driverHeight, driverRaw, circuitCode, leagueTier, circuits }) {
  const currentRide = baseTrackSetup.ride + heightAdjustment;
  const currentSuspension = baseTrackSetup.suspension;
  const currentWing = finalWing;

  const modal = document.createElement('div');
  modal.id = 'setup-modal-overlay';
  modal.innerHTML = `
   <div class="setup-modal-content">
      <header>
        <h3 id="modal-title">${circuitCode.toUpperCase()}</h3>
      </header>
      <div class="setup-row">
        <label>Ride Height</label>
        <input type="number" id="edit-ride" value="${currentRide}" min="1">
      </div>
      <div class="setup-row">
        <label>Suspension</label>
        <input type="number" id="edit-susp" value="${currentSuspension}">
      </div>
      <div class="setup-row">
        <label>Wing</label>
        <input type="number" id="edit-wing" value="${currentWing}">
      </div>
      <div class="modal-actions">
        <button id="save-setup" class="btn btn-save">Save Setup</button>
        <button id="close-modal" class="btn3 btn-cancel">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const existingFlag = document.getElementsByClassName(`f-${circuitCode.toLowerCase()}`)[0];
  if (existingFlag) {
    const flagClone = existingFlag.cloneNode(true);
    flagClone.style.marginRight = "10px";
    flagClone.style.verticalAlign = "middle";
    modal.querySelector('#modal-title').prepend(flagClone);
  }

  const wingModifier = calculateWingModifier(driverRaw);

  const rideInput = document.getElementById('edit-ride');
  rideInput.oninput = () => {
    const previewEl = document.getElementById('base-ride');
    if (previewEl) previewEl.innerText = (parseInt(rideInput.value) || 0) - heightAdjustment;
  };

  const wingInput = document.getElementById('edit-wing');
  wingInput.oninput = () => {
    const previewEl = document.getElementById('base-wing');
    if (previewEl) previewEl.innerText = (parseInt(wingInput.value) || 0) - wingModifier;
  };

  document.getElementById('save-setup').onclick = async () => {
    const baseRide = (parseInt(rideInput.value) || 0) - heightAdjustment;
    const baseWing = (parseInt(wingInput.value) || 0) - wingModifier;

    circuits[circuitCode] = {
      ...baseTrackSetup,
      ride: baseRide,
      wing: baseWing,
      suspension: parseInt(document.getElementById('edit-susp').value)
    };

    await chrome.storage.local.set({ customCircuits: circuits });
    location.reload();
  };

  document.getElementById('close-modal').onclick = () => modal.remove();
}


/**
 * PRACTICE DATA HELPERS
 */

async function copyPracticeRow(row, toClipboard = true) {
  const tyre = row.childNodes[0].className.split('-')[1];
  const fuelLap = row.childNodes[4].textContent;
  const wear = row.childNodes[5].textContent;

  const { separator = ',' } = await chrome.storage.local.get('separator');
  const data = [tyre, fuelLap, wear].join(separator);

  if (toClipboard) {
    navigator.clipboard.writeText(data).then(() => showTableHint(row.closest('table'), 'Row data copied!'));
  }
  return data;
}

async function copyAllPracticeData() {
  const table = this.closest('table');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const dataList = await Promise.all(rows.map(row => copyPracticeRow(row, false)));
  navigator.clipboard.writeText(dataList.join('\n')).then(() => {
    showTableHint(table, 'All rows data copied!');
  });
}

function showTableHint(table, text) {
  const hint = document.createElement('div');
  hint.innerText = text;
  hint.className = 'tableCopyHint';
  table.insertAdjacentElement('afterend', hint);
  setTimeout(() => hint.remove(), 1500);
}

function makePracticeTableCopiable() {
  document.querySelectorAll('.acp[id*="Laps"]').forEach((table) => {
    table.tHead.addEventListener('click', copyAllPracticeData);
    table.tBodies[0].addEventListener('click', (e) => copyPracticeRow(e.target.closest('tr')));
    table.tHead.style.cursor = 'pointer';
    table.tHead.addEventListener('mouseenter', () => table.classList.add('highlighted'));
    table.tHead.addEventListener('mouseleave', () => table.classList.remove('highlighted'));
  });
}

    if (!document.getElementById('suggestedSetup')) {
      await addSetupSuggestionsForDrivers();
      makePracticeTableCopiable();
    }
  } catch (err) {
    console.error('Setup Error:', err);
  }
})();
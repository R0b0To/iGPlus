/**
 * SHARED HELPERS
 */

// Centralized parsing of the circuit code from the UI
function getCircuitCode() {
  const flag = document.querySelector('.flag');
  return flag ? flag.className.split("-")[1].split(" ")[0] : null;
}

// Logic to calculate adjustment based on scale and height
function calculateHeightAdjustment(driverHeight, scale, tier) {
  const heightKey = Object.keys(scale)
    .sort((a, b) => b - a)
    .find((k) => +k <= driverHeight);
  return heightKey ? scale[heightKey][tier] : 0;
}

/**
 * CORE LOGIC
 */

async function addSetupSuggestionsForDrivers() {
  // 1. Centralized Imports
  const [
    { getActiveCircuits, getActiveScale },
    { fetchManagerData },
    { cleanHtml }
  ] = await Promise.all([
    import(chrome.runtime.getURL('scripts/raceSetup/settings.js')),
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('scripts/strategy/utility.js'))
  ]);

  // 2. Fetch Data Once
  const [allInfo, circuits, scale, circuitCode] = await Promise.all([
    fetchManagerData(1),
    getActiveCircuits(),
    getActiveScale(),
    getCircuitCode()
  ]);

  const leagueTier = allInfo.team._tier;
  const driversHtml = cleanHtml(allInfo.vars.drivers ?? allInfo.preCache["p=staff"].vars.drivers);
  const driversData = driversHtml.querySelectorAll('.hoverData');
  
  // Get the base setup for this track
  const baseTrackSetup = circuits[leagueTier][circuitCode];
  if (!baseTrackSetup) return;

  // 3. Process Drivers
  driversData.forEach((node, index) => {
    const driverIndex = index + 1;
    const driverHeight = node.dataset.driver.split(',')[13];
    const heightAdjustment = calculateHeightAdjustment(driverHeight, scale, leagueTier);

    injectSetupUI({
      baseTrackSetup,
      heightAdjustment,
      driverIndex,
      circuitCode,
      leagueTier,
      circuits // Pass reference for the modal to use
    });
  });
}

function injectSetupUI({ baseTrackSetup, heightAdjustment, driverIndex, circuitCode, leagueTier, circuits }) {
  const setupForm = document.querySelector(`#d${driverIndex}setup`);
  if (!setupForm || setupForm.classList.contains('withSuggestion')) return;

  const createSuggestion = (parentId, value, isSuspension = false) => {
    const container = setupForm.querySelector(`#d${driverIndex}${parentId}`).firstChild;
    if (isSuspension) container.id = 'suggestedSetup';

    const span = document.createElement('span');
    span.className = 'suggestedSetup';
    span.textContent = value;
    span.style.cursor = 'pointer';

    span.onclick = () => {
      const input = container.querySelector('.setupSlider-input');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    container.append(span);
  };

  // Ensure values don't go below 1
  const finalRide = Math.max(1, baseTrackSetup.ride + heightAdjustment);
  const finalWing = Math.max(1, baseTrackSetup.wing);

  createSuggestion('Suspension', baseTrackSetup.suspension, true);
  createSuggestion('Ride', finalRide);
  createSuggestion('Aerodynamics', finalWing);

  // Settings Icon
  const editBtn = document.createElement('div');
  editBtn.className = 'setup-edit-icon';
  editBtn.innerHTML = '⚙️';
  editBtn.title = "Personalize Base Setup";
  editBtn.onclick = () => openPersonalizeModal({
    baseTrackSetup,
    heightAdjustment,
    circuitCode,
    leagueTier,
    circuits
  });
  
  setupForm.prepend(editBtn);
  setupForm.classList.add('withSuggestion');
}

/**
 * MODAL UI
 */

function openPersonalizeModal({ baseTrackSetup, heightAdjustment, circuitCode, leagueTier, circuits }) {
  const modal = document.createElement('div');
  modal.id = 'setup-modal-overlay';
  modal.innerHTML = `
    <div class="setup-modal-content">
      <header>
        <h3>Edit Base Setup: ${circuitCode.toUpperCase()}</h3>
        <p style="font-size: 0.85em; color: #bbb;">Editing values for height 170-174cm.</p>
      </header>
      <div class="setup-row">
        <label>Base Ride</label>
        <input type="number" id="edit-ride" value="${baseTrackSetup.ride}">
        <span class="preview-text">Adjusting for this driver, it becomes: <span id="res-ride">${baseTrackSetup.ride + heightAdjustment}</span></span>
      </div>
      <div class="setup-row">
        <label>Base Suspension</label>
        <input type="number" id="edit-susp" value="${baseTrackSetup.suspension}">
      </div>
            <div class="setup-row">
        <label>Base Wing</label>
        <input type="number" id="edit-wing" value="${baseTrackSetup.wing}">
      </div>
      <div class="modal-actions">
        <button id="save-setup" class="btn-save">Save Base Setup</button>
        <button id="close-modal" class="btn-cancel">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const rideInput = document.getElementById('edit-ride');
  rideInput.oninput = () => {
    document.getElementById('res-ride').innerText = (parseInt(rideInput.value) || 0) + heightAdjustment;
  };

  document.getElementById('save-setup').onclick = async () => {
    circuits[leagueTier][circuitCode] = {
      ...baseTrackSetup,
      ride: parseInt(rideInput.value),
      wing: parseInt(document.getElementById('edit-wing').value),
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

// NOT WORKING, PRACTICE TABLE IS NOW A BUTTON, NEEDS REWORK IF WE WANT TO KEEP THIS FEATURE
function makePracticeTableCopiable() {
  document.querySelectorAll('.acp[id*="Laps"]').forEach((table) => {
    table.tHead.addEventListener('click', copyAllPracticeData);
    table.tBodies[0].addEventListener('click', (e) => copyPracticeRow(e.target.closest('tr')));
    
    // UI Feedback
    table.tHead.style.cursor = 'pointer';
    table.tHead.addEventListener('mouseenter', () => table.classList.add('highlighted'));
    table.tHead.addEventListener('mouseleave', () => table.classList.remove('highlighted'));
  });
}

/**
 * INITIALIZATION
 */
(async () => {
  try {
    // Small delay for dynamic content loading
    await new Promise(res => setTimeout(res, 200));
    
    if (!document.getElementById('suggestedSetup')) {
      await addSetupSuggestionsForDrivers();
      makePracticeTableCopiable();
    }
  } catch (err) {
    console.error('Setup Error:', err);
  }
})();
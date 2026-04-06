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
    driverHeight, 
    driverIndex,
    circuitCode,
    leagueTier,
    circuits
  });
});

}

function injectSetupUI({ baseTrackSetup, heightAdjustment, driverIndex, circuitCode, leagueTier, circuits, driverHeight }) {
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

  const finalRide = Math.max(1, baseTrackSetup.ride + heightAdjustment);
  const finalWing = Math.max(1, baseTrackSetup.wing);

  createSuggestion('Suspension', baseTrackSetup.suspension, true);
  createSuggestion('Ride', finalRide);
  createSuggestion('Aerodynamics', finalWing);

  const editBtn = document.createElement('div');
  editBtn.className = 'setup-edit-icon';
  editBtn.innerHTML = '⚙️';
  editBtn.title = "Personalize Base Setup";
  editBtn.onclick = () => openPersonalizeModal({
    baseTrackSetup,
    heightAdjustment,
    driverHeight,
    circuitCode,
    leagueTier,
    circuits
  });
  
  setupForm.prepend(editBtn);
  setupForm.classList.add('withSuggestion');
}

function openPersonalizeModal({ baseTrackSetup, heightAdjustment, driverHeight, circuitCode, leagueTier, circuits }) {
  // Calculate the current adjusted values
  const currentRide = baseTrackSetup.ride + heightAdjustment;
  const currentSuspension = baseTrackSetup.suspension;
  const currentWing = baseTrackSetup.wing;

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
        <button id="save-setup" class="btn-save">Save Setup</button>
        <button id="close-modal" class="btn-cancel">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);


  const existingFlag = document.getElementsByClassName(`f-${circuitCode.toLowerCase()}`)[0];
  if (existingFlag) {
    const flagClone = existingFlag.cloneNode(true);
    // Add some styling to make it look good next to the text
    flagClone.style.marginRight = "10px";
    flagClone.style.verticalAlign = "middle";
    
    const titleElement = modal.querySelector('#modal-title');
    titleElement.prepend(flagClone); // Places it before the circuit code text
  }


  // Update the base value preview as user types
  const rideInput = document.getElementById('edit-ride');
  rideInput.oninput = () => {
    const enteredValue = parseInt(rideInput.value) || 0;
    const baseValue = enteredValue - heightAdjustment;
    document.getElementById('base-ride').innerText = baseValue;
  };

  document.getElementById('save-setup').onclick = async () => {
    const enteredRide = parseInt(rideInput.value) || 0;
    const baseRide = enteredRide - heightAdjustment;

    circuits[leagueTier][circuitCode] = {
      ...baseTrackSetup,
      ride: baseRide,
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
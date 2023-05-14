// How much ride hight needs to be increased
async function getHeightAdjustment(driverHeight, tier) {
  const { scale } = await import(chrome.runtime.getURL('raceSetup/const.js'));
 
  const heightKey = Object.keys(scale)
    .sort((a, b) => b - a)
    .find((k) => +k <= driverHeight);

  return heightKey ? scale[heightKey][tier] : 0;
}

async function addSetupSuggestionsForDrivers() {

  const [{ fetchDriverInfo }, { parseAttributes }, { circuits },{ findCurrentTier }] = await Promise.all([
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('driver/driverHelpers.js')),
    import(chrome.runtime.getURL('raceSetup/const.js')),
    import(chrome.runtime.getURL('strategy/utility.js'))
  ]);

  const { script } = await chrome.storage.local.get('script');

  const driverIds = {};
  [...document.getElementsByClassName('staffImage')].forEach((d, index) => {
    const id = d.dataset.staffid;
    if (!driverIds[id]) driverIds[id] = index += 1;
  });
  const leagueTier = await findCurrentTier();
  const trackSetup = getTrackSetup(circuits, leagueTier);

  for await (const [driverId, index] of Object.entries(driverIds)) {
    const driverData = await fetchDriverInfo(driverId);
    const driverHeight = parseAttributes(driverData).sHeight;
    const heightAdjustment = await getHeightAdjustment(driverHeight, leagueTier);

    if (script.slider) addSettingSliders(index);
    if (script.edit) allowDirectEdit(index);

    addSetupSuggestions(trackSetup, heightAdjustment, index);
  }
}

/**
 * Inject html elements into setup page
 * @param {Object} trackSetup The suspension setup value.
 * @param {string} trackSetup.suspension The suspension setup value.
 * @param {number} trackSetup.ride The ride heigth setup value.
 * @param {number} trackSetup.wing The wing setup value.
 * @param {number} driverIndex The driver number.
 */
function addSetupSuggestions(trackSetup, heightAdjustment, driverIndex) {
  const { ride, wing, suspension } = trackSetup;

  const setupForm = document.querySelector(`#d${driverIndex}setup`);

  if (setupForm.classList.contains('withSuggestion')) {
    return;
  }

  /** @type {HTMLTableElement} */
  const settingTable = setupForm.querySelector('table.acp.linkFill.pad');
  const header = settingTable.createTHead();
  header.id = 'setupSuggestionHeader';
  header.append(document.createElement('tr'));

  const headers = ['Parameter', 'Value', 'Suggested'].map((txt) => {
    const elem = document.createElement('td');
    elem.textContent = txt;
    return elem;
  });

  header.rows[0].append(...headers);

  // suspension element
  const suspensionSetting = setupForm.querySelector('table.acp.linkFill.pad > tbody > tr:nth-child(1)');
  suspensionSetting.id = 'suggestedSetup';
  const suspensionSuggestion = document.createElement('td');
  suspensionSuggestion.classList.add('suggestedSetup');
  suspensionSuggestion.append(document.createTextNode(suspension));
  suspensionSetting.append(suspensionSuggestion);

  // ride element
  const rideHeightSetting = setupForm.querySelector('table.acp.linkFill.pad > tbody > tr:nth-child(2)');
  const heightSuggestion = document.createElement('td');
  heightSuggestion.classList.add('suggestedSetup');
  heightSuggestion.append(document.createTextNode(ride + heightAdjustment));
  rideHeightSetting.append(heightSuggestion);

  // wing element
  const wingSetting = setupForm.querySelector('table.acp.linkFill.pad > tbody > tr:nth-child(3)');
  const wingSuggestion = document.createElement('td');
  wingSuggestion.classList.add('suggestedSetup');
  wingSuggestion.append(document.createTextNode(wing));
  wingSetting.append(wingSuggestion);

  setupForm.classList.add('withSuggestion');
}

// Fixed circuit setup
function getTrackSetup(circuits, tierIndex) {
  const circuit = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML;
  const circuitCode = /[^-]+(?=">)/g.exec(circuit)[0];

  const suspensionSettingBtn = document.querySelector('.rotateThis');
  const setup = circuits[tierIndex][circuitCode];

  // in setup, there is the index of recommended setting - so we just get
  // current language based text directly from origin button
  return {
    ...setup,
    suspension: suspensionSettingBtn?.childNodes[setup.suspension].textContent
  };
}



async function addSettingSliders(driverIndex) {
  try {
    const setupTable = document.getElementById(`d${driverIndex}setup`);
    if (setupTable.classList.contains('withSliders')) {
      return;
    }
    const { createSlider } = await import(chrome.runtime.getURL('strategy/utility.js'));

    const ride = setupTable.querySelector('[name=ride]');
    createSlider(ride,1,50);

    const aero = setupTable.querySelector('[name=aerodynamics]');
    createSlider(aero,1,50);

    setupTable.classList.add('withSliders');
  } catch (error) {
    console.log(error);
  }
}

function allowDirectEdit(driverIndex) {
  const setupTable = document.getElementById(`d${driverIndex}setup`);
  if (setupTable.classList.contains('directEdit')) {
    return;
  }

  const [ride, wing] = setupTable.querySelectorAll('.num');
  makeEditable(wing);
  makeEditable(ride);
}

/**
 * Changes div to be directly editable by clicking and typing
 * @param {HTMLDivElement} node
 */
function makeEditable(node) {
  node.contentEditable = true;
  node.classList.add('withSlider');
  node.classList.remove('green');

  /** @type {HTMLInputElement} */
  const inputConrol = node.closest('td').querySelector('input.number');

  node.addEventListener('click', () => {
    if (node.textContent) {
      inputConrol.value = node.textContent;
    }
    node.textContent = '';
  });

  node.addEventListener('focusout', () => {
    const value = inputConrol.value;
    if (!isNaN(value)) node.textContent = inputConrol.value;
  });

  node.addEventListener('input', (e) => {
    if (!e.data.match(/^[0-9]{0,2}$/)) {
      node.textContent = '';
    }

    let settingValue = parseInt(node.textContent);
    if (isNaN(settingValue)) {
      settingValue = inputConrol.value;
    }

    if (settingValue > parseInt(inputConrol.max)) {
      node.textContent = inputConrol.max;
      settingValue = inputConrol.max;
    }

    if (settingValue == 0) {
      settingValue++;
    }

    inputConrol.value = settingValue;
  });
}

async function copyPracticeRow(row, toClipboard = true) {
  const tyre = row.childNodes[0].className.split('-')[1];
  const fuelLap = row.childNodes[4].textContent;
  const wear = row.childNodes[5].textContent;
  const separatorData = await chrome.storage.local.get({separator:','});
  const separator = separatorData.separator;
  const data = `${tyre}${separator}${fuelLap}${separator}${wear}`;
  if (!toClipboard) {
    return data;
  }

  navigator.clipboard.writeText(data).then(
    () => {
      showTableHint(row.closest('table'), 'Row data copied!');
    },
    () => {}
  );
}

function copyAllPracticeData() {
  const list = [];

  const promises = Array.from(this.closest('table').querySelectorAll('tbody tr')).map(async row =>{
    const rowData = await copyPracticeRow(row, false);
    list.push(rowData);
  });

  Promise.all(promises).then(()=>{
    navigator.clipboard.writeText(list.join('\n')).then(
      () => {
        showTableHint(this.closest('table'), 'All rows data copied!');
      },
      () => {}
    );

  });
}

function showTableHint(table, text) {
  const hint = document.createElement('div');
  hint.innerText = text;
  hint.classList.add('tableCopyHint');

  table.insertAdjacentElement('afterend', hint);
  setTimeout(() => {
    hint.remove();
  }, 1500);
}

function makePracticeTableCopiable() {
  // could be 2 of them - one per a driver

  /** @type {HTMLTableElement[]} */
  const practiceTables = document.querySelectorAll('.acp[id*="Laps"]');

  practiceTables.forEach((table) => {
    // click on a header copies all table
    table.tHead.addEventListener('click', copyAllPracticeData);
    table.tHead.addEventListener('mouseenter', () => table.classList.add('highlighted'));
    table.tHead.addEventListener('mouseleave', () => table.classList.remove('highlighted'));

    // click on a row copies only this row.
    table.tBodies[0].addEventListener('click', (event) => {
      copyPracticeRow(event.target.closest('tr'));
    });
  });
}

// TODO move to separate retry module?
(async () => {
  try {
    await new Promise((res) => setTimeout(res, 100)); // sleep a bit, while page loads
    if (document.getElementById('suggestedSetup') == null) {
      addSetupSuggestionsForDrivers();
      makePracticeTableCopiable();
    }
  } catch (err) {
    console.log('page not loaded');
  }
})();

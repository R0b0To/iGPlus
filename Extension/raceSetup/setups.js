// How much ride hight needs to be increased
async function getHeightAdjustment(driverHeight, tier) {
  const { scale } = await import(chrome.runtime.getURL('raceSetup/const.js'));

  const heightKey = Object.keys(scale)
    .sort((a, b) => b - a)
    .find((k) => +k <= driverHeight);

  return heightKey ? scale[heightKey][tier] : 0;
}

async function addSetupSuggestionsForDrivers() {
  const [{ fetchDriverInfo }, { parseAttributes }, { circuits }] = await Promise.all([
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('driver/driverHelpers.js')),
    import(chrome.runtime.getURL('raceSetup/const.js')),
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
    if (script.edit) edit(index);

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

/**
 * Finds the league tier of the manager.
 * @returns {1|2|3} 1 is for Rookie, 3 is for Elite
 */
async function findCurrentTier() {
  const { fetchLeagueData } = await import(chrome.runtime.getURL('common/fetcher.js'));

  const leagueUrl = document.getElementById('mLeague').href;
  const leagueId = /id=(.*)/.exec(leagueUrl)[1];

  const { vars = {} } = (await fetchLeagueData(leagueId)) || {};

  let tier = 1;
  for (/* no-op */; tier <= 2; tier += 1) {
    if (vars[`standings${tier}`]?.includes('myTeam')) break;
  }

  return tier;
}

function createSlider(node) {
  const settingValueDiv = node.previousElementSibling.childNodes[1];
  settingValueDiv.classList.remove('green');

  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('sliderContainer');

  const slider = document.createElement('input');
  slider.className = 'sliderX';
  slider.type = 'range';
  slider.max = 50;
  slider.min = 1;
  slider.value = settingValueDiv.textContent;

  slider.addEventListener('input', function () {
    settingValueDiv.textContent = this.value;

    settingValueDiv.classList.add('slider-label');
    const newValue = Number(((this.value - this.min) * 100) / (this.max - this.min));
    const newPosition = 10 - newValue * 0.2;
    settingValueDiv.style.left = `calc(${newValue}% + (${newPosition}px))`;
  });

  slider.addEventListener('change', function () {
    settingValueDiv.classList.remove('slider-label');
    sliderContainer.classList.remove('visible');
    slider.parentElement.parentElement.nextElementSibling.value = slider.value;
  });

  settingValueDiv.addEventListener('click', function () {
    if (!sliderContainer.classList.contains('visible')) {
      sliderContainer.classList.add('visible');
      settingValueDiv.classList.add('slider-label');
      const newValue = Number(((slider.value - slider.min) * 100) / (slider.max - slider.min)),
        newPosition = 10 - newValue * 0.2;
      settingValueDiv.style.left = `calc(${newValue}% + (${newPosition}px))`;
    } else {
      sliderContainer.classList.remove('visible');
      settingValueDiv.classList.remove('slider-label');
    }
  });

  sliderContainer.append(slider);
  settingValueDiv.classList.add('withSlider');

  node.previousElementSibling.prepend(sliderContainer);
}

function addSettingSliders(driverIndex) {
  try {
    const setup = document.getElementById(`d${driverIndex}setup`);
    if (setup.classList.contains('withSliders')) {
      return;
    }

    const ride = setup.querySelector('[name=ride]');
    createSlider(ride);

    const aero = setup.querySelector('[name=aerodynamics]');
    createSlider(aero);

    setup.classList.add('withSliders');
  } catch (error) {
    console.log(error);
  }
}

function edit(d) {
  if (document.getElementsByClassName('edit').length < 2) {
    setup = document.getElementById(`d${d}setup`);

    carSetup = setup.querySelectorAll('.num');
    ride = carSetup[0];
    aero = carSetup[1];

    //add flag to avoid creating duplicate events
    if (!aero.getAttribute('event')) {
      editEvent(aero);
      aero.setAttribute('event', true);
    }
    if (!ride.getAttribute('event')) {
      editEvent(ride);
      ride.setAttribute('event', true);
    }

    function editEvent(node) {
      node.contentEditable = true;
      node.setAttribute(
        'style',
        'border-radius: 50%;background-color: #96bf86;color: #ffffff!important;width: 2rem;height: 2rem;cursor: pointer;'
      );
      node.addEventListener('click', function () {
        if (this.textContent != '') {
          this.closest('td').querySelector('.number').value = this.textContent;
        }
        this.textContent = '';
      });
      node.addEventListener('focusout', function (e) {
        inputValue = this.closest('td').querySelector('.number');
        value = this.closest('td').querySelector('.number').value;
        if (!isNaN(value)) this.textContent = inputValue.value;
      });
      node.addEventListener('input', function (e) {
        stored = this.parentElement.nextElementSibling;
        if (!e.data.match(/^[0-9]{0,2}$/)) {
          this.textContent = '';
        }
        currentValue = parseInt(this.textContent);
        if (isNaN(currentValue)) {
          currentValue = stored.value;
        }
        if (currentValue > parseInt(stored.max)) {
          this.textContent = stored.max;
          currentValue = stored.max;
        }
        if (currentValue == 0) {
          currentValue++;
        }
        //this.textContent=(currentValue);
        stored.value = currentValue;
      });
    }
  }
}

function copyPracticeRow(row, toClipboard = true) {
  const tyre = row.childNodes[0].className.split('-')[1];
  const fuelLap = row.childNodes[4].textContent;
  const wear = row.childNodes[5].textContent;

  const data = `${tyre},${fuelLap},${wear}`;
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

  this.closest('table').querySelectorAll('tbody tr').forEach((row) => {
    list.push(copyPracticeRow(row, false));
  });

  navigator.clipboard.writeText(list.join('\n')).then(
    () => {
      showTableHint(this.closest('table'), 'All rows data copied!');
    },
    () => {}
  );
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

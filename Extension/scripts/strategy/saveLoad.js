// Global configuration object, initialized by initializeSaveLoadUI.
let SCRIPT_CONFIG = {};

/**
 * Initializes the Save/Load UI elements for the strategy page.
 * It places Save/Load buttons for each driver and sets their initial state.
 * @param {object} config - The configuration object containing track info, league length, etc.
 */
async function initializeSaveLoadUI(config) {
  SCRIPT_CONFIG = config; // Store the passed configuration globally.

  // Check if the save/load UI has already been added to avoid duplication.
  // Uses a more specific ID for the main container.
  if (!document.getElementById('saveLoadUIContainer_d1')) { // Check for driver 1's container specifically
    const numberOfDrivers = document.getElementsByClassName('fuel').length; // Determine number of drivers on page.

    // Create and append save/load controls for Driver 2 if present.
    if (numberOfDrivers === 2) {
      const driver2StrategyContainer = document.getElementById('d2strategy');
      if (driver2StrategyContainer) {
        const targetHeaderCellD2 = driver2StrategyContainer.querySelectorAll('th')[0]; // Assumes first th is target.
        if (targetHeaderCellD2) {
          targetHeaderCellD2.appendChild(createSaveLoadControlsElement('d2')); // Pass driver ID
        }
      }
    }

    // Create and append save/load controls for Driver 1.
    const driver1StrategyContainer = document.getElementById('d1strategy');
    if (driver1StrategyContainer) {
      const targetHeaderCellD1 = driver1StrategyContainer.querySelectorAll('th')[0]; // Assumes first th is target.
      if (targetHeaderCellD1) {
        targetHeaderCellD1.appendChild(createSaveLoadControlsElement('d1')); // Pass driver ID
      }
    }
  }

  // Update the initial state of all "Load" buttons on the page.
  await updateLoadButtonsState();
}

/**
 * Creates the Save and Load button elements, including the dialog for load options.
 * @param {string} driverIdSuffix - The suffix for the driver (e.g., 'd1', 'd2') to make IDs unique.
 * @returns {HTMLElement} The container div with Save/Load buttons and dialog.
 */
function createSaveLoadControlsElement(driverIdSuffix) {
  const mainContainer = document.createElement('div');
  // Use a unique ID for each driver's save/load UI container.
  mainContainer.id = `saveLoadUIContainer_${driverIdSuffix}`;
  mainContainer.classList.add('saveLoadControlsContainer'); // New class for overall container styling

  const saveButton = document.createElement('div');
  saveButton.className = 'strategyActionButton saveButton'; // More descriptive classes
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', handleSaveStrategy); 

  const loadButton = document.createElement('div');
  loadButton.className = 'strategyActionButton loadButton'; // More descriptive classes
  loadButton.textContent = 'Load';

  const loadDialog = document.createElement('dialog');
  loadDialog.className = 'loadStrategyDialog not-selectable'; // New class for dialog
  loadDialog.id = `loadStrategyDialog_${driverIdSuffix}`; // Unique ID for dialog
  loadDialog.addEventListener('click', handleDialogBackgroundClick); 

  loadButton.addEventListener('click', async function() {
    // `this` refers to the loadButton.
    // Populate the dialog with saved strategies for the current track.
    const successfullyPopulated = await populateLoadDialogWithSaves(loadDialog); // Renamed from generateSaveList
    if (successfullyPopulated) {
      loadDialog.showModal(); // Show the dialog if there are saves.
    } else {
      // Optionally, provide feedback if there are no saves to load (e.g., alert or temporary message).
      // console.log("No saves available to load for this track.");
    }
  });
  
  mainContainer.append(loadDialog); // Dialog should be appended to main container or body.
  mainContainer.appendChild(saveButton);
  mainContainer.appendChild(loadButton);

  return mainContainer;
}

/**
 * Updates the enabled/disabled state of all load buttons based on available saves.
 */
async function updateLoadButtonsState() {
  const trackCode = SCRIPT_CONFIG.track.code;
  const savedDataResponse = await chrome.storage.local.get('saveStrategies'); 
  const savedStrategies = savedDataResponse.saveStrategies;

  const loadButtons = document.querySelectorAll('.loadButton');
  let disableLoadButtons = true;

  if (savedStrategies && savedStrategies[trackCode] && Object.keys(savedStrategies[trackCode]).length > 0) {
    disableLoadButtons = false;
  }

  loadButtons.forEach(button => {
    if (disableLoadButtons) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }
  });
}

/**
 * Handles the deletion of a saved strategy.
 * Removes the strategy from local storage, updates the UI, and syncs with Google Drive if enabled.
 */
async function handleDeleteSavedStrategy() {
  // `this` is the delete button/icon that was clicked.
  const savedStrategyElement = this.parentElement; // Assumes parent contains the ID of the save.
  const strategyIdToDelete = savedStrategyElement.id;
  const trackCode = SCRIPT_CONFIG.track.code;

  const storageData = await chrome.storage.local.get('saveStrategies');
  const allSavedStrategies = storageData.saveStrategies || {};

  if (allSavedStrategies[trackCode] && allSavedStrategies[trackCode][strategyIdToDelete]) {
    delete allSavedStrategies[trackCode][strategyIdToDelete];
    // If no strategies left for this track, remove the track entry.
    if (Object.keys(allSavedStrategies[trackCode]).length === 0) {
      delete allSavedStrategies[trackCode];
    }
    await chrome.storage.local.set({ 'saveStrategies': allSavedStrategies });
  }

  // Remove the strategy from all open dialogs visually.
  document.querySelectorAll(`.loadStrategyDialog [id="${strategyIdToDelete}"]`).forEach(element => {
    element.remove();
  });

  // Check if any dialogs are now empty and update UI accordingly.
  const allDialogs = document.querySelectorAll('.loadStrategyDialog');
  allDialogs.forEach(dialog => {
    const saveListElement = dialog.querySelector('#saveList'); // Assuming save list has this ID
    if (saveListElement && saveListElement.childElementCount === 0) {
      dialog.close();
    }
  });
  // After deletion, update the state of load buttons (they might become disabled).
  await updateLoadButtonsState(); 

  // Sync deletion with Google Drive if enabled.
  const syncSettings = await chrome.storage.local.get({ script: false });
  if (syncSettings.script?.gdrive) {
    try {
      const { getAccessToken } = await import(chrome.runtime.getURL('auth/googleAuth.js'));
      const tokenResponse = await getAccessToken();
      if (tokenResponse && tokenResponse.access_token) {
        chrome.runtime.sendMessage({
          type: 'deleteFile',
          data: { type: 'strategies', track: trackCode, name: strategyIdToDelete },
          token: tokenResponse.access_token
        });
      }
    } catch (error) {
      // console.error("Error during Google Drive delete sync:", error);
    }
  }
}

/**
 * Handles saving the current strategy for a driver.
 * Saves to local storage and syncs with Google Drive if enabled.
 */
async function handleSaveStrategy() {
  const { hashCode } = await import(chrome.runtime.getURL('../../common/customUtils.js')); // Updated path
  const trackCode = SCRIPT_CONFIG.track.code;
  // `this` is the save button. Find the relevant driver's strategy form.
  const driverStrategyForm = this.closest('form');
  if (!driverStrategyForm) return;

  const totalLapsElement = driverStrategyForm.querySelector('[id*=TotalLaps]');
  const tyreInfoRow = driverStrategyForm.getElementsByClassName('tyre')[0];
  const fuelInfoRow = driverStrategyForm.getElementsByClassName('fuel')[0];
  const pushInfoRow = driverStrategyForm.querySelector('tr[pushEvent]'); // Corrected attribute selector

  if (!totalLapsElement || !tyreInfoRow || !fuelInfoRow || !pushInfoRow) {
    // console.error("Required elements for saving strategy not found.");
    return;
  }

  // Get all visible cells for tyres, fuel, and push.
  const visibleTyreCells = tyreInfoRow.querySelectorAll('td[style*="visibility: visible"]');
  const visibleFuelCells = fuelInfoRow.querySelectorAll('td[style*="visibility: visible"]');
  const visiblePushCells = pushInfoRow.querySelectorAll('td[style*="visibility: visible"]');

  const strategyToSave = {
    stints: {},
    leagueLength: SCRIPT_CONFIG.league, // Using renamed global config property
    track: trackCode,
    raceLapsInfo: { // Structured lap information
      totalRaceLaps: totalLapsElement.nextSibling?.textContent ? Number(totalLapsElement.nextSibling.textContent.split('/')[1]) : 0,
      plannedLaps: Number(totalLapsElement.textContent)
    }
  };

  // Populate stints data from visible cells.
  for (let i = 0; i < visibleTyreCells.length; i++) {
    if (visibleFuelCells[i] && visiblePushCells[i] && visiblePushCells[i].childNodes[0]) {
      strategyToSave.stints[i] = {
        tyre: visibleTyreCells[i].className,
        laps: visibleFuelCells[i].textContent,
        push: visiblePushCells[i].childNodes[0].selectedIndex
      };
    }
  }
  
  const strategyHash = hashCode(JSON.stringify(strategyToSave)); // Generate a hash for the strategy.
  const storageData = await chrome.storage.local.get('saveStrategies');
  const allSavedStrategies = storageData.saveStrategies || {};
  
  if (!allSavedStrategies[trackCode]) {
    allSavedStrategies[trackCode] = {};
  }
  allSavedStrategies[trackCode][strategyHash] = strategyToSave;

  await chrome.storage.local.set({ 'saveStrategies': allSavedStrategies });
  
  // After saving, ensure "Load" buttons are enabled.
  await updateLoadButtonsState();

  // Sync with Google Drive if enabled.
  const syncSettings = await chrome.storage.local.get({ script: false });
  if (syncSettings.script?.gdrive) {
    try {
      const { getAccessToken } = await import(chrome.runtime.getURL('auth/googleAuth.js'));
      const tokenResponse = await getAccessToken();
      if (tokenResponse && tokenResponse.access_token) {
        await chrome.runtime.sendMessage({
          type: 'saveStrategy',
          data: { name: strategyHash, track: trackCode, strategy: strategyToSave },
          token: tokenResponse.access_token
        });
      }
    } catch (error) {
      // console.error("Error during Google Drive save sync:", error);
    }
  }
}

/**
 * Handles loading a saved strategy and applying it to the current driver's UI.
 */
async function handleLoadStrategyAndApply() {
  const { simulateClick } = await import(chrome.runtime.getURL('../../common/customUtils.js')); // Updated path
  const { fuel_calc } = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
  
  const trackCode = SCRIPT_CONFIG.track.code;
  // `this` is the strategy preview element that was clicked in the dialog.
  const savedStrategyId = this.parentElement.id; // ID of the strategy to load.
  
  const storageData = await chrome.storage.local.get('saveStrategies');
  const savedStrategyData = storageData.saveStrategies?.[trackCode]?.[savedStrategyId];

  if (!savedStrategyData) {
    // console.error("Selected strategy data not found in storage.");
    return;
  }

  const driverStrategyForm = this.closest('form'); // Get the form relevant to the clicked strategy.
  if (!driverStrategyForm) return;

  const pitNumberControl = driverStrategyForm.querySelector('.num'); // Element displaying current pit stops.
  const currentDisplayedPits = parseInt(pitNumberControl.childNodes[0].textContent, 10);
  const numberOfStintsInSavedStrategy = Object.keys(savedStrategyData.stints).length;
  
  // Adjust the number of pit stops in the UI to match the loaded strategy.
  // The number of pits is one less than the number of stints.
  const requiredPits = numberOfStintsInSavedStrategy - 1;
  const pitDifference = requiredPits - currentDisplayedPits;

  if (pitDifference < 0) { // Need to decrease pits
    for (let i = 0; i < Math.abs(pitDifference); i++) {
      await simulateClick(driverStrategyForm.querySelector('.minus'));
    }
  } else if (pitDifference > 0) { // Need to increase pits
    for (let i = 0; i < pitDifference; i++) {
      await simulateClick(driverStrategyForm.querySelector('.plus'));
    }
  }
  // After pit adjustments, a brief pause might be needed for UI to update,
  // especially if pit changes trigger observers that modify the DOM.
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

  // Get references to the strategy table rows.
  const tyreInfoRow = driverStrategyForm.getElementsByClassName('tyre')[0];
  const fuelInfoRow = driverStrategyForm.getElementsByClassName('fuel')[0]; // This row contains lap numbers per stint.
  const pushInfoRow = driverStrategyForm.querySelector('tr[pushEvent]');

  if (!tyreInfoRow || !fuelInfoRow || !pushInfoRow) {
    // console.error("Strategy table rows not found for applying loaded data.");
    return;
  }
  
  // Apply data to each stint cell.
  for (let i = 0; i < numberOfStintsInSavedStrategy; i++) {
    const stintData = savedStrategyData.stints[i];
    if (!stintData) continue;

    const tyreCell = tyreInfoRow.cells[i + 1]; // +1 to skip header cell
    const fuelCell = fuelInfoRow.cells[i + 1]; // Lap number cell
    const pushCell = pushInfoRow.cells[i + 1];

    if (!tyreCell || !fuelCell || !pushCell) continue;

    try {
      // Apply tyre info.
      tyreCell.lastChild.textContent = stintData.tyre.substring(3); // Display text (e.g., "S" from "ts-S")
      tyreCell.className = stintData.tyre; // Full class name (e.g., "ts-S tyreS")
      tyreCell.querySelector('input').value = stintData.tyre.substring(3); // Hidden input
      tyreCell.setAttribute('data-tyre', stintData.tyre.substring(3));

      // Apply laps info (fuelCell actually holds laps).
      const lapsDisplaySpan = fuelCell.querySelector('span');
      if (lapsDisplaySpan && lapsDisplaySpan.firstChild) {
        lapsDisplaySpan.replaceChild(document.createTextNode(stintData.laps), lapsDisplaySpan.firstChild);
      } else if (lapsDisplaySpan) {
        lapsDisplaySpan.appendChild(document.createTextNode(stintData.laps));
      }
      
      // Apply fuel amount (calculated based on laps, push, and track info).
      const fuelEconomySetting = document.getElementsByClassName('PLFE')[0]?.value;
      const baseFuelPerLap = fuel_calc(parseInt(fuelEconomySetting || '0', 10));
      const pushValueForStint = parseFloat(pushCell.querySelector('select').options[stintData.push].value);
      const fuelPerLapThisStint = (baseFuelPerLap + pushValueForStint) * SCRIPT_CONFIG.track.info.length;
      
      fuelCell.querySelectorAll('input')[0].value = Math.ceil(fuelPerLapThisStint * parseInt(stintData.laps, 10)).toString(); // Fuel amount input
      fuelCell.querySelectorAll('input')[1].value = stintData.laps; // Laps input (hidden)

      // Apply push level.
      pushCell.querySelector('select').selectedIndex = stintData.push;

    } catch (error) {
      // console.error(`Error applying data to stint ${i}:`, error);
    }
  }

  // Close all load dialogs after applying the strategy.
  driverStrategyForm.querySelectorAll('.loadStrategyDialog').forEach(dialog => {
    dialog.close();
  });
  // Manually trigger an update of the fuel calculation for the entire strategy.
  // This is important because simply setting cell values might not trigger all necessary recalculations.
  if (fuelInfoRow.cells[1]) { // Use the first actual stint cell of the fuel/laps row
    await handleFuelUpdateTrigger(fuelInfoRow.cells[1].closest('tbody'));
  }
}

/**
 * Handles clicks on the dialog background to close it.
 * Prevents closing if the click is inside the dialog content.
 * @param {MouseEvent} event - The click event.
 */
function handleDialogBackgroundClick(event) {
  if (event.target.tagName !== 'DIALOG') {
    return; // Click was not directly on the dialog element.
  }
  const dialogElement = event.target;
  const rect = dialogElement.getBoundingClientRect();

  // Check if the click was outside the dialog's content area.
  const clickedOutsideDialogContent = (
    event.clientY < rect.top || event.clientY > rect.bottom ||
    event.clientX < rect.left || event.clientX > rect.right
  );

  if (clickedOutsideDialogContent) {
    dialogElement.close();
  }
}

/**
 * Populates the "Load Strategy" dialog with saved strategies for the current track.
 * @param {HTMLDialogElement} loadDialogElement - The dialog element to populate.
 * @returns {Promise<boolean>} True if saves were found and list populated, false otherwise.
 */
async function populateLoadDialogWithSaves(loadDialogElement) {
  const { strategyPreview } = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
  
  const trackCode = SCRIPT_CONFIG.track.code;
  const storageData = await chrome.storage.local.get('saveStrategies');
  const savedStrategiesForTrack = storageData.saveStrategies?.[trackCode];

  // Clear any existing list items in the dialog.
  const existingSaveList = loadDialogElement.querySelector('#saveList');
  if (existingSaveList) {
    existingSaveList.remove();
  }

  if (!savedStrategiesForTrack || Object.keys(savedStrategiesForTrack).length === 0) {
    // console.log('No saves for this track.');
    // Optionally, display a "No saves" message in the dialog.
    // Update load button states globally if this was the only source of saves.
    await updateLoadButtonsState(); 
    return false; // No saves to populate.
  }

  // Determine total laps for the current race to filter/display relevant strategies.
  // This assumes a specific DOM structure for finding total race laps.
  const totalLapsElement = document.querySelector('[id*=TotalLaps]')?.nextSibling;
  const totalRaceLaps = totalLapsElement?.textContent ? parseInt(totalLapsElement.textContent.split('/')[1], 10) : 0;
  
  // Generate the HTML list of saved strategies.
  // SCRIPT_CONFIG.economy should be SCRIPT_CONFIG.economy (from main strategy.js)
  const newSaveListElement = await strategyPreview(savedStrategiesForTrack, SCRIPT_CONFIG.economy, totalRaceLaps);
  
  if (newSaveListElement.childElementCount === 0) {
    // console.log('No matching saves after filtering for current race length.');
    await updateLoadButtonsState();
    return false; // No relevant saves.
  }

  // Add event listeners to the newly created strategy previews and delete buttons.
  newSaveListElement.querySelectorAll('.stintsContainer').forEach(strategyElement => {
    strategyElement.classList.add('loadStrategyItem'); // New class for styling clickable items
    strategyElement.addEventListener('click', handleLoadStrategyAndApply);
  });
  newSaveListElement.querySelectorAll('.trash').forEach(deleteButton => {
    deleteButton.addEventListener('click', handleDeleteSavedStrategy);
  });
  
  loadDialogElement.appendChild(newSaveListElement);
  await updateLoadButtonsState(); // Ensure load buttons are correctly enabled.
  return true; // Successfully populated.
}
export{
  addSaveButton
};
let raceParams = {};
const maxpits = 7;
// Initializes event handlers and observer for managing extra pit stints for a driver.
async function initializeExtraStintControls(driverPitControlsContainer, params) {
  raceParams = params; // Store race parameters globally for this module.

  const pitNumberDisplay = driverPitControlsContainer.querySelector('.num');
  const decreasePitButton = driverPitControlsContainer.querySelector('.minus');
  const increasePitButton = driverPitControlsContainer.querySelector('.plus');

  // State to track current and previous number of pits.
  const pitStopManager = {
    current: Number(pitNumberDisplay.childNodes[0].textContent),
    previous: Number(pitNumberDisplay.childNodes[0].textContent),
    isManagingExtraStints: false // Flag to indicate if currently managing beyond standard 4 pits.
  };

  // Initial setup: If starting with 4 pits, enable adding extra stints.
  // The 'extra' attribute on the plus button likely signals that it can add beyond the game's default max.
  // 'extraStint' class might be for styling or further JS targeting.
  if (pitStopManager.current === 4) {
    increasePitButton.setAttribute('data-extra-stint-mode', 'ready'); // Use a more descriptive data attribute.
    increasePitButton.classList.add('extraStintControl'); // Use a more descriptive class.
  }

  // Handles mutations to the pit number display.
  async function handlePitNumberChange(mutationsList) {
    const firstMutation = mutationsList[0];
    if (firstMutation.target.classList.contains('num') && firstMutation.addedNodes.length > 0) {
      pitStopManager.previous = pitStopManager.current;
      pitStopManager.current = Number(firstMutation.addedNodes[0].textContent);
      const driverForm = increasePitButton.closest('form');

      updateButtonStatesAndAlerts(driverForm);
    }
  }
  
  // Updates button states and manages alerts based on the current number of pit stops.
  async function updateButtonStatesAndAlerts(driverForm) {
    // Logic for when pit stops are > 4 (extra stints active) or == 1 (minimum pits, disable minus)
    if (pitStopManager.current > 4 || pitStopManager.current === 1) {
      decreasePitButton.classList.add('disabled'); // Disable minus button.
      // Apply 'extraStintControl' class to both buttons when in extra stint mode or at min pits.
      decreasePitButton.classList.add('extraStintControl');
      increasePitButton.classList.add('extraStintControl');
      pitStopManager.isManagingExtraStints = true;

      // Add alert if not already present.
      if (pitStopManager.current > 4 && !driverForm.querySelector('.alertExtra')) {
        const alertElement = await createPitStopAlert();
        driverForm.prepend(alertElement);
      }
    } else {
      decreasePitButton.classList.remove('disabled');
      // Only remove 'extraStintControl' from minus if not in special state (e.g. current === 4)
      if (pitStopManager.current !== 4) {
        decreasePitButton.classList.remove('extraStintControl');
      }
    }

    // Logic for exactly 4 pits (ready to add extra).
    if (pitStopManager.current === 4) {
      increasePitButton.setAttribute('data-extra-stint-mode', 'ready');
      increasePitButton.classList.add('extraStintControl');
      driverForm.querySelector('.alertExtra')?.remove(); // Remove alert.
      pitStopManager.isManagingExtraStints = false; // Not actively managing *extra* ones yet.
    }
    
    // Logic for less than 4 pits (standard operation).
    if (pitStopManager.current < 4) {
      driverForm.querySelector('.alertExtra')?.remove(); // Remove alert.
      increasePitButton.setAttribute('data-extra-stint-mode', 'disabled');
      // Remove 'extraStintControl' if not in a special state.
      increasePitButton.classList.remove('extraStintControl');
      decreasePitButton.classList.remove('extraStintControl'); // Also for minus button.
      pitStopManager.isManagingExtraStints = false;
    }
    // The original code had a commented out line: (pits.current > 4) ?  plus_btn.classList.add('disabled') : plus_btn.classList.remove('disabled');
    // This seems to imply disabling the plus button when > 4 pits. Current logic enables it.
    // If maxpits is a hard limit, this should be re-evaluated. For now, following existing enabled state.
    if (pitStopManager.current >= maxpits) { // Assuming maxpits is the hard limit
        increasePitButton.classList.add('disabled');
    } else if (pitStopManager.current > 1) { // Re-enable if not at min pits and below max
        increasePitButton.classList.remove('disabled');
    }
  }


  const pitNumberObserver = new MutationObserver(handlePitNumberChange);
  const observerConfig = { subtree: true, childList: true };
  pitNumberObserver.observe(pitNumberDisplay, observerConfig);

  // Handles the logic for adding an extra stint via the plus button.
  function attemptToAddExtraStint(event) {
    // Check for right-click (button == 2) or specific custom event property if applicable.
    // Original used `e.button == 50`. Assuming this was a custom value.
    // For standard pointer events, right click is typically 2. 'pointerdown' can be any button.
    // We'll check if the button is in 'ready' mode for adding extra stints.
    if (event.type === 'pointerdown' || event.type === 'touchstart') { // Ensuring it's a direct activation
      if (pitStopManager.current >= 4 && pitStopManager.current < maxpits &&
          increasePitButton.getAttribute('data-extra-stint-mode') === 'ready') {
        addExtraStintColumn(driverPitControlsContainer);
        // After adding, plus button might not be 'ready' immediately if current pits increments.
        // The observer will handle the state update.
      }
    }
  }

  // Handles the logic for removing an extra stint via the minus button.
  function attemptToRemoveExtraStint(event) {
    if (event.type === 'pointerdown' || event.type === 'touchstart') {
      // Only remove if we are in an "extra stint" scenario (current > 4)
      if (pitStopManager.current > 4 && pitStopManager.current <= maxpits +1 ) { // maxpits+1 was in original for previous
        // Delay is to ensure IGP's own event listeners complete first.
        setTimeout(() => removeLastStintColumn(driverPitControlsContainer), 1);
      }
    }
  }

  // Using 'pointerdown' for broader compatibility including mouse, pen, touch.
  // 'touchstart' is kept for specific mobile interactions if any were intended by original logic.
  decreasePitButton.addEventListener('touchstart', attemptToRemoveExtraStint);
  increasePitButton.addEventListener('touchstart', attemptToAddExtraStint);
  decreasePitButton.addEventListener('pointerdown', attemptToRemoveExtraStint);
  increasePitButton.addEventListener('pointerdown', attemptToAddExtraStint);

  // Initial check to set button states correctly based on loaded pit numbers.
  updateButtonStatesAndAlerts(increasePitButton.closest('form'));
}

// Removes the last stint column from the strategy table for a given driver.
function removeLastStintColumn(driverPitControlsContainer) {
  // Condition: Only remove if current pits are greater than 4 (i.e., an extra stint exists).
  const currentPitValue = Number(driverPitControlsContainer.querySelector('.num').childNodes[0].textContent);
  if (currentPitValue > 4) {
    const driverForm = driverPitControlsContainer.closest('form');
    // Select all cells in the last column of the strategy table, excluding specific utility cells.
    const lastColumnCells = driverForm.querySelectorAll('th:last-child, td:last-child:not(.trash):not([colspan])');
    
    if (lastColumnCells.length === 0) {
      // console.warn("No last column cells found to remove for driver:", driverForm.id);
      return;
    }
    
    // Remove each cell in the last column.
    for (const cell of lastColumnCells) {
      cell.remove();
    }

    // Determine the new pit number (which is the number of the new last stint).
    // This assumes the header of the (now removed) last stint indicated its number.
    // A more robust way might be to count remaining visible stints or rely on pitStopManager.
    const newLastStintNumber = currentPitValue - 1; // This is the new total number of pits.

    // Update the displayed pit number. This will trigger the observer in initializeExtraStintControls.
    updateDisplayedPitNumber(driverPitControlsContainer, newLastStintNumber);
    // The original code had a commented out line: driver_pit_div.closest('form').querySelector('[colspan]').colSpan--;
    // This implies a colspan needs adjustment. If this is still necessary, it should be handled here.
  }
}

// Adds an extra stint column to the strategy table for a given driver.
function addExtraStintColumn(driverPitControlsContainer) {
  return new Promise((resolve) => {
    const driverForm = driverPitControlsContainer.closest('form');
    // Select all cells in the current last column to serve as a template for the new column.
    const templateColumnCells = driverForm.querySelectorAll('th:last-child, td:last-child:not(.trash):not([colspan])');

    if (templateColumnCells.length === 0) {
      // console.warn("No template column cells found to clone for driver:", driverForm.id);
      resolve(false); // Indicate failure.
      return;
    }

    // Clone each cell from the template column and store them with their original parent.
    const clonedColumnElements = Array.from(templateColumnCells).map(cell => {
      return { node: cell.cloneNode(true), parent: cell.parentElement };
    });

    // Determine the new pit number (which is the number of the new stint being added).
    const newStintNumberForDisplay = (parseInt(templateColumnCells[0].textContent.match(/\d+/)?.[0] || '0') + 1);
    
    // Update the displayed pit/stint number. This will trigger the observer.
    updateDisplayedPitNumber(driverPitControlsContainer, newStintNumberForDisplay);

    // Modify the cloned cells for the new stint.
    // clonedColumnElements[0] is the header cell (e.g., "Stint 5").
    clonedColumnElements[0].node.textContent = clonedColumnElements[0].node.textContent.replace(/\d+/, newStintNumberForDisplay.toString());
    
    // clonedColumnElements[1] is the tyre selection cell.
    const tyreInput = clonedColumnElements[1].node.querySelector('input');
    if (tyreInput) tyreInput.name = `tyre${newStintNumberForDisplay + 1}`; // Input name for tyre type.
    clonedColumnElements[1].node.addEventListener('click', openTyreSelectionDialog); // Attach event listener.

    // clonedColumnElements[4] is the fuel/laps cell. (Indices need careful checking based on actual table structure)
    // Assuming original indices: 0:Header, 1:Tyre, 2:Wear(auto), 3:Push, 4:Fuel/Laps
    const fuelInput = clonedColumnElements[4].node.querySelector('[name^=fuel]');
    if (fuelInput) fuelInput.name = `fuel${newStintNumberForDisplay + 1}`; // Fuel input name.
    const lapsInput = clonedColumnElements[4].node.querySelector('[name^=laps]');
    if (lapsInput) lapsInput.name = `laps${newStintNumberForDisplay + 1}`; // Laps input name.

    // clonedColumnElements[3] is the push level select cell.
    const pushSelect = clonedColumnElements[3].node.querySelector('select');
    const originalPushSelect = templateColumnCells[3].querySelector('select');
    if (pushSelect && originalPushSelect) {
      pushSelect.selectedIndex = originalPushSelect.selectedIndex; // Copy selected push level.
      pushSelect.addEventListener('change', handleFuelUpdateTrigger); // Attach event listener.
    }
    
    // Append the new (cloned and modified) cells to their respective rows.
    for (const element of clonedColumnElements) {
      element.parent.append(element.node);
    }

    // The original code had a commented out line: driver_pit_div.closest('form').querySelector('[colspan]').colSpan++;
    // If a colspan needs adjustment, it should be handled here.
    resolve(true); // Indicate success.
  });
}

// Updates the visuals (tyre wear) for a specific stint and then recalculates total fuel.
async function updateStintVisualsAndRecalculate(stintCellElement) {
  // Dynamically import math utilities as needed.
  const { get_wear } = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
  
  const stintIndex = stintCellElement.cellIndex;
  const tableBody = stintCellElement.closest('tbody');
  if (!tableBody) return;

  const wearRow = tableBody.querySelector('tr[wearevent]'); // Row displaying tyre wear.
  const tyreRow = tableBody.querySelector('tr.tyre'); // Row indicating tyre type.
  const pushRow = tableBody.querySelector('tr[pushevent]'); // Row with push level selectors.

  if (!wearRow || !tyreRow || !pushRow || !wearRow.cells[stintIndex] || !tyreRow.cells[stintIndex] || !pushRow.cells[stintIndex]) {
    // console.warn("Required rows or cells for stint update not found.");
    return;
  }

  const tyreType = tyreRow.cells[stintIndex].className.slice(3); // Extract tyre type from class name.
  const lapsInStint = stintCellElement.textContent;
  // Get selected push level index for the current stint.
  const pushLevelIndex = pushRow.cells[stintIndex].children[0].selectedIndex;
  
  // Update global raceParams with the push level for the current stint.
  // This is somewhat problematic as raceParams.CAR_ECONOMY.push becomes specific to the last updated stint.
  // Consider if CAR_ECONOMY should store an array of push levels or if get_wear should take push directly.
  raceParams.CAR_ECONOMY.push = pushLevelIndex;

  // Calculate and update tyre wear display.
  wearRow.cells[stintIndex].textContent = get_wear(tyreType, lapsInStint, raceParams.TRACK_INFO, raceParams.CAR_ECONOMY, raceParams.raceLengthMultiplier);
  
  // After updating wear, recalculate and display total fuel for the strategy.
  recalculateAndDisplayTotalFuel(tableBody);
}

// Handles the fuel update process, often triggered by an event (e.g., push level change).
async function handleFuelUpdateTrigger(eventOrTableBody) {
  let tableBody;
  // If called directly by an event (e.g., 'change' on a push select).
  if (eventOrTableBody instanceof Event) {
    const targetElement = eventOrTableBody.target;
    const cellElement = targetElement.parentElement; // Assumes target is select, parent is td.
    tableBody = targetElement.closest('tbody');
    if (!tableBody || !cellElement) return;

    // Update global push parameter for the specific stint that triggered the event.
    // This has the same potential issue as noted in updateStintVisualsAndRecalculate.
    raceParams.CAR_ECONOMY.push = tableBody.querySelector('tr[pushevent]').cells[cellElement.cellIndex].children[0].selectedIndex;
    
    // Trigger a visual update for the stint, which will also call recalculateAndDisplayTotalFuel.
    const fuelLapsCell = tableBody.querySelector('tr.fuel').cells[cellElement.cellIndex];
    if (fuelLapsCell) {
      await updateStintVisualsAndRecalculate(fuelLapsCell);
    }
  } else {
    // If a tbody element is passed directly.
    tableBody = eventOrTableBody;
    if (!tableBody) return;
    recalculateAndDisplayTotalFuel(tableBody);
  }
}

// Recalculates total fuel based on all stints and updates the display.
async function recalculateAndDisplayTotalFuel(tableBody) {
  // Dynamically import utilities.
  const { fuel_calc } = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
  // TRACK_CODE and track_info are assumed to be globally available or correctly scoped from strategy.js
  // This might be fragile. Consider passing them or having a robust way to access them.
  const currentTrackCode = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
  const { track_info } = await import(chrome.runtime.getURL('scripts/strategy/const.js'));
  const currentTrackInfo = track_info[currentTrackCode];
  if (!currentTrackInfo) {
    // console.error("Track information not found for fuel calculation.");
    return;
  }

  const pushRow = tableBody.querySelector('tr[pushevent]');
  const tyreRow = tableBody.querySelector('tr.tyre'); // Used to determine number of visible stints.
  const lapsRow = tableBody.querySelector('tr.fuel'); // Contains lap numbers for each stint.
  const driverForm = tableBody.closest('form');

  if (!pushRow || !tyreRow || !lapsRow || !driverForm) {
    // console.warn("Required elements for fuel recalculation not found.");
    return;
  }
  
  // Determine the number of active (visible) stints.
  const numberOfActiveStints = Array.from(tyreRow.querySelectorAll('td[style*="visibility: visible"]')).length;
  // Get the base fuel economy value from the page (assumes PLFE class element exists).
  const fuelEconomyValueElement = document.getElementsByClassName('PLFE')[0];
  if (!fuelEconomyValueElement) {
    // console.warn("Fuel economy setting element (PLFE) not found.");
    return;
  }
  const baseFuelPerLap = fuel_calc(parseInt(fuelEconomyValueElement.value));
  
  let totalFuelConsumed = 0;
  let totalLapsDriven = 0;

  // Iterate through active stints to calculate fuel and laps.
  // Starts from cell index 1, as index 0 is typically a header.
  for (let i = 1; i <= numberOfActiveStints; i++) { // Iterate up to the number of active stints
    if (!pushRow.cells[i] || !lapsRow.cells[i] || !lapsRow.cells[i].textContent) continue;

    const pushValue = parseFloat(pushRow.cells[i].childNodes[0].value);
    const lapsInStint = parseInt(lapsRow.cells[i].textContent);
    
    if (isNaN(lapsInStint) || isNaN(pushValue)) continue;

    totalLapsDriven += lapsInStint;
    const fuelPerLapInStint = (baseFuelPerLap + pushValue) * currentTrackInfo.length;
    totalFuelConsumed += lapsInStint * fuelPerLapInStint;
  }

  const fuelDisplayElement = driverForm.getElementsByClassName('fuelEst')[0];
  const totalLapsDisplayNode = driverForm.querySelector('.robotoBold'); // Displays total calculated laps.
  
  if (totalLapsDisplayNode) {
    totalLapsDisplayNode.textContent = totalLapsDriven;
    // Compare with race length displayed like "123/150 Laps"
    const raceLapsTextNode = totalLapsDisplayNode.nextSibling;
    if (raceLapsTextNode && raceLapsTextNode.textContent) {
        const raceTotalLaps = Number(raceLapsTextNode.textContent.split('/')[1]);
        totalLapsDisplayNode.classList.remove('block-orange', 'block-grey', 'block-red'); // Reset classes
        if (totalLapsDriven > raceTotalLaps) {
            totalLapsDisplayNode.classList.add('block-orange');
        } else if (totalLapsDriven < raceTotalLaps && totalLapsDriven > 0) { // Assuming some laps mean it should be grey not red
             totalLapsDisplayNode.classList.add('block-grey');
        } else if (totalLapsDriven === raceTotalLaps) {
            // Potentially a "good" class or no specific class if default is fine
        }
        // Original logic for 'block-red' was if totalLaps == raceLapsText, it's removed. 
        // This seems counterintuitive if red means an error. Assuming red is for < required laps.
        // If totalLapsDriven < raceTotalLaps, it will currently be 'block-grey'.
        // Add explicit 'block-red' if that's the desired state for incomplete race laps.
    }
  }

  if (fuelDisplayElement) {
    fuelDisplayElement.textContent = `Fuel:${totalFuelConsumed.toFixed(2)}`;
  }
}

// Updates the displayed pit stop number in the pit controls container.
function updateDisplayedPitNumber(driverPitControlsContainer, newPitNumber) {
  const pitNumberDisplayElement = driverPitControlsContainer.querySelector('.num');
  if (pitNumberDisplayElement) {
    // Replace the existing text node with a new one containing the new pit number.
    // This ensures the MutationObserver in initializeExtraStintControls is triggered.
    pitNumberDisplayElement.replaceChild(document.createTextNode(newPitNumber.toString()), pitNumberDisplayElement.childNodes[0]);
  }
}

// Creates and returns an alert element for pit stop warnings.
async function createPitStopAlert() {
  const { language } = await chrome.storage.local.get({ language: 'en' });
  const { language: i18n } = await import(chrome.runtime.getURL('common/localization.js'));
  
  const alertContainer = document.createElement('div');
  alertContainer.classList.add('alertExtra'); // Class for styling the alert.
  
  const alertIcon = document.createElement('span'); // Using span for SVG for easier manipulation if needed
  alertIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M19.64 16.36L11.53 2.3A1.85 1.85 0 0 0 10 1.21 1.85 1.85 0 0 0 8.48 2.3L.36 16.36C-.48 17.81.21 19 1.88 19h16.24c1.67 0 2.36-1.19 1.52-2.64zM11 16H9v-2h2zm0-4H9V6h2z"/></svg>';
  
  const alertText = document.createElement('span');
  alertText.textContent = i18n[language].pitAlert; // Localized alert message.
  
  alertContainer.append(alertIcon);
  alertContainer.append(alertText);
  return alertContainer;
}

// Handles opening the tyre selection dialog with context from the clicked stint.
function openTyreSelectionDialog() {
  const tyreCell = this; // 'this' refers to the td element the event listener is on.
  const tyreFullClassName = tyreCell.className; // e.g., "tyreS tyreMS tyreMU" etc.
  const selectedTyreType = tyreFullClassName.split(' ')[0].slice(3); // Assumes first class is like "tyreS" -> "S"

  const nameAttribute = tyreCell.querySelector('[name^=tyre]')?.name;
  if (!nameAttribute) return;
  const stintNumberFromTyreName = nameAttribute.match(/\d+/)?.[0];
  if (!stintNumberFromTyreName) return;

  const tableBody = tyreCell.closest('tbody');
  const fuelInputValue = tableBody.querySelector(`[name=fuel${stintNumberFromTyreName}]`)?.value;
  const lapsInputValue = tableBody.querySelector(`[name=laps${stintNumberFromTyreName}]`)?.value;

  // Simulate click on the last valid stint to open the game's dialog.
  // This relies on a specific DOM structure (5th cell from end, or a known clickable element).
  // The original `this.parentElement.cells[5].click()` is fragile.
  // A more robust way would be to identify the game's own dialog trigger if possible.
  // For now, let's assume the 5th cell of the *row* is the target for opening the dialog.
  // Or, if the game has a consistent way to open the dialog for a specific stint, that should be used.
  // This part is highly dependent on the game's specific DOM structure and might need adjustment.
  const dialogTriggerCell = tyreCell.parentElement.querySelector('td:nth-last-child(5)'); // Example: 5th cell from the end of the row.
  if (dialogTriggerCell) {
     //dialogTriggerCell.click(); // This might not always work if game expects specific interaction.
     // For now, we proceed assuming the dialog appears via game mechanics after a tyre cell click or similar.
  } else {
    // console.warn("Could not find a reliable trigger to open the game's tyre dialog.");
    // Fallback or alternative method to open dialog might be needed.
  }
  
  // Elements within the game's tyre dialog.
  const tyreDialogContainer = document.getElementById('stintDialog');
  if (!tyreDialogContainer) return;
  
  const gameStintIdInput = document.getElementsByName('stintId')[0];
  if (gameStintIdInput) gameStintIdInput.value = stintNumberFromTyreName; // Set stint ID in the dialog.

  const dialogTitleElement = tyreDialogContainer.querySelector('h1'); // Assuming title is h1
  if (dialogTitleElement) dialogTitleElement.textContent = `Pit ${parseInt(stintNumberFromTyreName, 10) - 1}`; // Update dialog title.

  const dialogFuelLapsDisplay = tyreDialogContainer.querySelector('.num'); // Fuel/laps display in dialog.
  if (dialogFuelLapsDisplay) {
    // Determine if dialog is showing fuel or laps based on '.hide' class presence.
    if (tyreDialogContainer.querySelector('.hide')) { // If '.hide' is present, it usually means fuel input is hidden, showing laps.
      dialogFuelLapsDisplay.textContent = lapsInputValue || '0';
    } else { // Otherwise, it's showing fuel.
      dialogFuelLapsDisplay.textContent = fuelInputValue || '0';
    }
  }

  // Simulate mouse events to trigger updates within the dialog if necessary.
  // This forces the game's internal logic to refresh based on new values.
  const eventMouseDown = new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true });
  const eventMouseUp = new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true });
  const minusButtonInDialog = tyreDialogContainer.querySelector('.minus');
  const plusButtonInDialog = tyreDialogContainer.querySelector('.plus');

  if (minusButtonInDialog && plusButtonInDialog) {
    minusButtonInDialog.dispatchEvent(eventMouseDown);
    minusButtonInDialog.dispatchEvent(eventMouseUp);
    plusButtonInDialog.dispatchEvent(eventMouseDown);
    plusButtonInDialog.dispatchEvent(eventMouseUp);
  }

  // Highlight the selected tyre type in the dialog.
  const tyreSelectionUI = document.getElementById('tyreSelect')?.childNodes[0]?.childNodes[0];
  if (tyreSelectionUI) {
    for (let i = 0; i < tyreSelectionUI.childNodes.length; i++) {
      const tyreOptionElement = tyreSelectionUI.childNodes[i];
      // Compare tyreOptionElement.id (e.g., "S", "M") with selectedTyreType.
      if (tyreOptionElement.id !== selectedTyreType) {
        tyreOptionElement.className = 'inactive';
      } else {
        tyreOptionElement.className = ''; // Active (no 'inactive' class).
      }
    }
  }
}

export {
  initializeExtraStintControls, // Renamed from addStintEventHandler
  removeLastStintColumn,      // Renamed from removeExtraStint
  addExtraStintColumn,        // Renamed from addExtraStint
  updateDisplayedPitNumber,   // Renamed from replacePitNumber
  handleFuelUpdateTrigger,    // Renamed from updateFuel (when used as event handler)
  recalculateAndDisplayTotalFuel, // Extracted core logic of updateFuel
  updateStintVisualsAndRecalculate, // Renamed from update_stint
  createPitStopAlert,         // Renamed from addAlert
  openTyreSelectionDialog     // Renamed from openTyreDialog
};
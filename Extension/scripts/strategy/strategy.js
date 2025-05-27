strategy_page = document.getElementById('strategy') ?? false;
if(strategy_page !=false)
if(!strategy_page?.getAttribute('injected') ?? false)
  (async function main(){
    document.getElementById('strategy').setAttribute('injected',true);
    // Handles mutations to the strategy page, specifically for stint changes and lap number updates.
    const observer = new MutationObserver(function (mutations) {
      // Check if the push level for fuel economy (PLFE) is set.
      // This is a prerequisite for handling mutations as it indicates that the strategy interface is ready.
      if (!document.getElementsByClassName('PLFE')[0]?.value) {
        return;
      }

      mutations.forEach(mutation => {
        // Handles mutations related to adding or removing stints.
        if (mutation.type === 'childList' && mutation.target.classList.contains('darkgrey')) {
          handleStintChange(mutation.target);
        }

        // Handles mutations related to changes in lap numbers within a stint.
        if (mutation.target.tagName === 'SPAN' && mutation.addedNodes.length > 0 && mutation.target.classList.length === 0) {
          handleLapNumberChange(mutation.target);
        }
      });
    });

    // Handles changes when a stint is added or removed.
    function handleStintChange(targetElement) {
      const driverForm = targetElement.closest('form');
      if (driverForm) {
        setTotalLapsText(driverForm);
        updateFuel(driverForm.querySelector('tbody'));
      }
    }

    // Handles changes when the lap number in a stint is modified.
    function handleLapNumberChange(targetElement) {
      const stintCell = targetElement.closest('td');
      const driverForm = targetElement.closest('form');
      if (stintCell && driverForm) {
        update_stint(stintCell);
        setTotalLapsText(driverForm);
      }
    }

    // Calculates and updates the total number of laps for a driver.
    function setTotalLapsText(driverForm) {
      // Select all visible lap number elements within the driver's form.
      const stintLapElements = driverForm.querySelectorAll('td[style="visibility: visible;"]>span');
      let totalLaps = 0;
      // Sum the lap numbers from all stints.
      for (const lapElement of stintLapElements) {
        totalLaps += Number(lapElement.textContent);
      }
      // Update the total laps display.
      driverForm.querySelector('[id*=TotalLaps]').textContent = totalLaps;
    }
    //language
    // --- Language and Internationalization Setup ---
    const { language } = await chrome.storage.local.get({ language: 'en' });
    const { language: i18n } = await import(chrome.runtime.getURL('common/localization.js'));

    // --- Track Information Setup ---
    // Extracts the track code from the race page URL.
    const TRACK_CODE = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
    const { track_info, multipliers, trackLink, trackDictionary } = await import(chrome.runtime.getURL('scripts/strategy/const.js'));
    let TRACK_INFO = track_info[TRACK_CODE];

    // --- League Information Setup ---
    const { fetchManagerData, fetchLeagueData, fetchCarData } = await import(chrome.runtime.getURL('common/fetcher.js'));
    const managerInfo = await fetchManagerData(2);
    const gameRules = JSON.parse(managerInfo.vars.rulesJson);
    const leagueId = managerInfo.team._league;
    const leagueInfo = await fetchLeagueData(leagueId) ?? false;
    // Extracts league length from rules, e.g., "100 laps".
    const leagueRaceLength = /(?<=chronometer<\/icon> ).\d+/gm.exec(leagueInfo.vars.rules)[0];
    const raceLengthMultiplier = multipliers[leagueRaceLength] ?? 1;

    // --- Car Information Setup ---
    const { fuel_calc, get_wear } = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
    const carData = await fetchCarData() ?? false;
    const { cleanHtml } = await import(chrome.runtime.getURL('../../common/customUtils.js')); // Updated path
    const carAttributesHTML = cleanHtml(carData.vars.carAttributes);
    // Extracts car economy details (fuel and tyre) from the car attributes HTML.
    const CAR_ECONOMY = {
      fe: carAttributesHTML.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent,
      te: carAttributesHTML.querySelector('[id=wrap-tyre_economy] .ratingVal').textContent,
      fuel: fuel_calc(carAttributesHTML.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent)
    };

    // --- Active Scripts and Utility Imports ---
    const { script: activeScripts } = await chrome.storage.local.get('script');
    const { createSlider } = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
    const { addStintEventHandler, updateFuel, update_stint: updateStintDetails } = await import(chrome.runtime.getURL('scripts/strategy/extraStints.js'));
    const { dragStintHandler } = await import(chrome.runtime.getURL('scripts/strategy/dragStint.js'));
    const { addSaveButton } = await import(chrome.runtime.getURL('scripts/strategy/saveLoad.js'));

    // --- Main Script Execution ---
    let googleSheetReadAttempts = 3; // Number of attempts to read Google Sheets data.
    try {
      if (leagueInfo) {
        injectAdvancedStint();
        injectCircuitMap();
        readGSheets();
        addMoreStints();
        addSaveButton({ economy: CAR_ECONOMY, track: { code: TRACK_CODE, info: TRACK_INFO }, league: leagueRaceLength });
        addWeatherInStrategy();
        addSelectCheckbox();

        // Initialize drag and drop for stints if not already initialized.
        if (!document.getElementById('eventAdded')) {
          dragStintHandler();
        }
        // Add fuel slider if the corresponding script is active.
        if (activeScripts.sliderS) {
          addFuelSlider();
        }
        // Add editable stint values if the corresponding script is active.
        if (activeScripts.editS) {
          addEdit();
        }

        // Observe dialogs container for stint dialog appearance to enhance fuel/tyre selection.
        waitForAddedNode({
          id: 'stintDialog',
          parent: document.getElementById('dialogs-container'),
          recursive: false,
          done: function(el) { addBetterStintFuel(el); }
        });
      }
    } catch (error) {
      console.error("Error during strategy script execution:", error);
    }
    // Saves the push levels and updates the UI accordingly.
    function savePush(tbodyElement) {
      // Select all push level input elements within the given tbody.
      const pushLevelInputs = tbodyElement.querySelectorAll('input[class^="PL"]');
      const pushLevels = [];

      // Extract push level values from input fields.
      // PL1 to PL5 are for individual push levels, PLFE is for fuel economy.
      pushLevels.push(tbodyElement.getElementsByClassName('PL1')[0].value);
      pushLevels.push(tbodyElement.getElementsByClassName('PL2')[0].value);
      pushLevels.push(tbodyElement.getElementsByClassName('PL3')[0].value);
      pushLevels.push(tbodyElement.getElementsByClassName('PL4')[0].value);
      pushLevels.push(tbodyElement.getElementsByClassName('PL5')[0].value);
      const fuelEconomyPushValue = tbodyElement.getElementsByClassName('PLFE')[0].value;

      // Update the global car economy's fuel calculation based on the new fuel economy push value.
      CAR_ECONOMY.fuel = fuel_calc(parseInt(fuelEconomyPushValue));

      // Update all push level input fields across the document to reflect the changes.
      for (let i = 1; i <= 5; i++) {
        const allPushInputsOfLevel = document.querySelectorAll(`input[class^="PL${i}"]`);
        allPushInputsOfLevel.forEach(input => {
          input.value = pushLevels[i - 1];
        });
      }

      // Update all fuel economy push level input fields and their tooltips.
      const allFuelEconomyInputs = document.getElementsByClassName('PLFE');
      const fuelEconomyTooltips = document.getElementsByClassName('tooltiptext');
      for (let i = 0; i < allFuelEconomyInputs.length; i++) {
        allFuelEconomyInputs[i].value = fuelEconomyPushValue;
        // Update tooltip text to show the calculated fuel consumption.
        fuelEconomyTooltips[i].textContent = `${i18n[language].pushDescriptionPart1} ${CAR_ECONOMY.fuel.toFixed(3)} ${i18n[language].pushDescriptionPart2}`;
      }

      // Save the push levels to local storage.
      chrome.storage.local.set({ 'pushLevels': pushLevels });

      // Update the option elements in select dropdowns to match the new push levels.
      for (let j = 0; j < 5; j++) {
        const optionsToUpdate = document.getElementsByClassName(`OPL${j + 1}`);
        for (let item of optionsToUpdate) {
          item.value = pushLevels[j];
        }
      }

      // Update fuel estimations for all cars.
      const fuelEstimationElements = document.getElementsByClassName('fuelEst');
      Object.values(fuelEstimationElements).forEach(element => {
        updateFuel(element.closest('tbody'));
      });
    }
    // Injects advanced stint editing features into the strategy page.
    async function injectAdvancedStint() {
      // Get all elements related to driver strategy fuel display.
      const driverStrategyElements = document.getElementsByClassName('fuel');

      // Iterate over each driver's strategy section.
      Object.values(driverStrategyElements).forEach(async driverFuelElement => {
        const driverForm = driverFuelElement.closest('form');
        // Observe changes in the driver's strategy table (tbody) for dynamic updates.
        observer.observe(driverFuelElement.closest('tbody'), { characterData: true, attributes: true, childList: true, subtree: true });

        // If refuelling is not allowed, add a div to display estimated fuel.
        if (gameRules.refuelling === '0') {
          const fuelEstimationDiv = document.createElement('div');
          fuelEstimationDiv.setAttribute('style', 'color:white; font-family:RobotoCondensedBold; font-size:.9em;');
          fuelEstimationDiv.className = 'fuelEst'; // Class used to identify fuel estimation elements.
          const placementTarget = driverForm.querySelector('[id^=\'d\']').parentElement;
          // Add the estimation div only if it's not already there (checked by childElementCount).
          if (placementTarget.childElementCount < 3) {
            placementTarget.append(fuelEstimationDiv);
          }
        } else {
          // If refuelling is allowed, enhance the existing laps row.
          const lapsRow = driverForm.getElementsByClassName('fuel')[0];
          lapsRow.classList.add('reallaps'); // Mark as 'real laps' row.
          // Add click event to the first cell of the laps row to recalculate laps based on fuel.
          lapsRow.cells[0].addEventListener('click', function() {
            lapsRow.querySelectorAll('td').forEach(cell => {
              const [fuelInput, lapsInput] = cell.querySelectorAll('input');
              const pushSelect = lapsRow.closest('tbody').querySelector('[pushevent]').cells[cell.cellIndex];
              const pushValue = pushSelect.querySelector('select').value;
              // Recalculate laps based on fuel, car economy, push level, and track length.
              lapsInput.value = Math.floor((parseFloat(fuelInput.value) / ((CAR_ECONOMY.fuel + parseFloat(pushValue)) * TRACK_INFO.length)));
              cell.querySelector('span').textContent = lapsInput.value; // Update displayed lap count.
            });
          });
        }

        // Create push and wear rows for the current driver's strategy.
        // Promise.all ensures createPushRow completes before createWearRow and updateStintDetails are called.
        Promise.all([createPushRow(driverFuelElement)]).then(() => {
          createWearRow(driverFuelElement);
          // Update details for the first stint initially.
          updateStintDetails(driverFuelElement.cells[1]);
        });
      });

      // Add a global click listener to handle closing push level dropdowns when clicking outside.
      // This ensures that dropdowns don't stay open unintentionally.
      if (document.body.getAttribute('boxEvent') == null) { // Check if the event listener is already added.
        document.body.setAttribute('boxEvent', true); // Mark that the event listener is being added.
        document.body.addEventListener('click', handleClickOutsidePushBox, false);
      }

      // Handles clicks outside the push level selection box to close it and save changes.
      function handleClickOutsidePushBox(event) {
        const pushBoxes = document.getElementsByClassName('not-selectable'); // The dropdown content.
        // Iterate over all push boxes.
        Object.values(pushBoxes).forEach(box => {
          const dropdownContainer = box.closest('th');
          // If the click is outside the current push box and the box is shown:
          if (dropdownContainer && !dropdownContainer.contains(event.target) && box.classList.contains('show')) {
            box.classList.remove('show'); // Hide the push level options.
            box.nextElementSibling.classList.remove('show'); // Hide the tooltip.
            savePush(box.closest('tbody')); // Save the selected push levels.
          }
        });
      }

      // Creates the row for selecting push levels for each stint.
      function createPushRow(strategyFuelElement) {
        const pushLevelOptionsSource = document.getElementsByName('pushLevel')[0]; // Source for push level text content.
        // Mapping for push level values to their display text.
        const pushLevelTextMap = {
          FE: 'FE', // Fuel Economy
          1: pushLevelOptionsSource[4].textContent,
          2: pushLevelOptionsSource[3].textContent,
          3: pushLevelOptionsSource[2].textContent,
          4: pushLevelOptionsSource[1].textContent,
          5: pushLevelOptionsSource[0].textContent
        };

        return new Promise((resolve) => {
          const defaultPushSettings = [-0.007, -0.004, 0, 0.01, 0.02]; // Default push values.
          let currentPushSettings = [];
          // Load saved push levels from local storage or use defaults.
          chrome.storage.local.get({ 'pushLevels': defaultPushSettings }, function(data) {
            currentPushSettings = data.pushLevels;

            const pushRow = document.createElement('tr');
            pushRow.setAttribute('pushevent', true); // Mark as push event row.

            const pushButtonHeader = document.createElement('th');
            pushButtonHeader.className = 'dropdown1';

            const pushButton = document.createElement('div');
            pushButton.classList.add('dropbtn1', 'pushBtn');
            pushButton.textContent = i18n[language].pushText; // "Push" text from localization.
            // Toggle display of push level options and tooltip on click.
            pushButton.addEventListener('click', function() {
              this.nextSibling.classList.toggle('show');
              this.nextSibling.nextSibling.classList.toggle('show');
            });
            pushButtonHeader.append(pushButton);

            const pushOptionsContainer = document.createElement('div');
            pushOptionsContainer.className = 'dropdown1-content not-selectable';
            pushOptionsContainer.id = 'myDropdown'; // TODO: Ensure ID is unique if multiple drivers.
            // Create input for Fuel Economy (FE).
            const fuelEconomyInput = createPushElement('FE', CAR_ECONOMY.fe, 1, pushLevelTextMap, currentPushSettings);
            pushOptionsContainer.append(fuelEconomyInput);
            // Create inputs for push levels 1-5.
            for (let i = 5; i > 0; i--) {
              const pushInputElement = createPushElement(i, '', 0.001, pushLevelTextMap, currentPushSettings);
              pushOptionsContainer.append(pushInputElement);
            }
            pushButtonHeader.append(pushOptionsContainer);

            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'dropdown1-content tooltip1';
            tooltipElement.textContent = '?'; // Tooltip icon.
            const tooltipTextSpan = document.createElement('span');
            tooltipTextSpan.className = 'tooltiptext';
            // Tooltip shows current fuel consumption per lap.
            tooltipTextSpan.textContent = `${i18n[language].pushDescriptionPart1} ${CAR_ECONOMY.fuel.toFixed(3)} ${i18n[language].pushDescriptionPart2}`;
            tooltipElement.append(tooltipTextSpan);
            pushButtonHeader.append(tooltipElement);

            pushButtonHeader.setAttribute('style', 'color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%;');
            pushRow.append(pushButtonHeader);

            // Create a select dropdown for each stint.
            for (let i = 1; i < strategyFuelElement.childElementCount; i++) {
              const stintCell = document.createElement('td');
              const pushSelectDropdown = document.createElement('select');
              pushSelectDropdown.classList.add('pushSelect');
              pushSelectDropdown.addEventListener('change', updateFuel); // Update fuel on change.
              // Populate dropdown with push level options.
              for (let j = 5; j > 0; j--) {
                const pushOption = document.createElement('option');
                pushOption.textContent = pushLevelTextMap[j];
                if (j === 3) pushOption.selected = true; // Pre-select middle push level.
                pushOption.value = currentPushSettings[j - 1];
                pushOption.className = `OPL${j}`;
                pushSelectDropdown.append(pushOption);
              }
              stintCell.append(pushSelectDropdown);
              stintCell.style.visibility = strategyFuelElement.childNodes[i].style.visibility; // Maintain visibility from original table.
              pushRow.append(stintCell);
            }

            // Add the push row to the table if it doesn't already exist.
            if (!strategyFuelElement.parentElement.querySelector('[pushevent=true]')) {
              strategyFuelElement.parentElement.insertBefore(pushRow, strategyFuelElement.parentElement.lastChild);
              resolve(`Driver ${strategyFuelElement.closest('form').id[1]} push row created`);
            }
          });

          // Helper function to create individual push level input elements.
          function createPushElement(level, value, step, textMap, currentSettings) {
            const pushInputContainer = document.createElement('div');
            pushInputContainer.className = 'pushDiv';

            const pushInputLabel = document.createElement('div');
            pushInputLabel.textContent = textMap[level];
            pushInputLabel.classList.add('pushBox');

            const buttonDecrement = document.createElement('div');
            const textSpanDecrement = document.createElement('span');
            textSpanDecrement.textContent = '−'; // Minus sign.
            buttonDecrement.append(textSpanDecrement);
            buttonDecrement.className = 'pushPlusMin';
            buttonDecrement.addEventListener('click', function() {
              this.parentNode.querySelector('input[type=number]').stepDown();
            });

            const pushInputField = document.createElement('input');
            pushInputField.className = `PL${level} pushInput`;
            pushInputField.type = 'number';
            pushInputField.step = step;

            if (level === 'FE') { // Special handling for Fuel Economy input.
              pushInputField.value = value;
              pushInputLabel.textContent = ''; // No label text for FE.
              pushInputLabel.classList.add('feLabel');
            } else {
              pushInputField.value = currentSettings[level - 1];
            }

            const buttonIncrement = document.createElement('div');
            buttonIncrement.className = 'pushPlusMin';
            const textSpanIncrement = document.createElement('span');
            textSpanIncrement.textContent = '+'; // Plus sign.
            buttonIncrement.append(textSpanIncrement);
            buttonIncrement.addEventListener('click', function() {
              this.parentNode.querySelector('input[type=number]').stepUp();
            });

            pushInputContainer.append(pushInputLabel);
            pushInputContainer.append(buttonDecrement);
            pushInputContainer.append(pushInputField);
            pushInputContainer.append(buttonIncrement);

            return pushInputContainer;
          }
        });
      }

      // Creates the row displaying calculated tyre wear for each stint.
      function createWearRow(strategyFuelElement) {
        return new Promise((resolve) => {
          const wearRow = document.createElement('tr');
          wearRow.setAttribute('wearevent', true); // Mark as wear event row.

          const rowHeader = document.createElement('th');
          rowHeader.textContent = 'Wear'; // Row title.
          rowHeader.style.fontSize = '.8em';
          wearRow.append(rowHeader);

          // Iterate over each stint (column) in the strategy table.
          // Starts at 1 because the first element (index 0) is the row title.
          for (let i = 1; i < strategyFuelElement.childElementCount; i++) {
            const stintCell = document.createElement('td');
            const tyreType = strategyFuelElement.closest('tbody').querySelector('.tyre').cells[i].className.slice(3); // Extract tyre type.
            const lapsText = strategyFuelElement.cells[i].textContent ?? "0"; // Get laps, default to "0".
            
            // Determine push level for wear calculation.
            // This assumes the push select element is available and provides selectedIndex.
            const pushSelectElement = strategyFuelElement.closest('tbody').querySelector('[pushevent]').cells[1].childNodes[0];
            CAR_ECONOMY.push = pushSelectElement.selectedIndex;

            // Calculate tyre wear.
            const wearValue = get_wear(tyreType, lapsText, TRACK_INFO, CAR_ECONOMY, raceLengthMultiplier);
            stintCell.style.visibility = strategyFuelElement.cells[i].style.visibility; // Maintain original visibility.
            stintCell.textContent = wearValue;
            wearRow.append(stintCell);
          }

          // Add the wear row to the table if it doesn't already exist.
          if (!strategyFuelElement.parentElement.querySelector('[wearevent=true]')) {
            // Insert wear row before the push row.
            strategyFuelElement.parentElement.insertBefore(wearRow, strategyFuelElement.parentElement.querySelector('[pushevent]'));
            resolve(`Driver ${strategyFuelElement.closest('form').id[1]} wear row created`);
          }
        });
      }
    }
    // Enhances the stint fuel dialog with real-time lap estimation based on fuel input.
    async function addBetterStintFuel(dialogElement) {
      // Re-fetch track info as it might not be up-to-date if the user navigates quickly.
      const currentTrackCode = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
      TRACK_INFO = track_info[currentTrackCode]; // Update TRACK_INFO globally.

      const fuelInputElement = dialogElement.querySelector('.num'); // The input field for fuel amount.
      const fuelEconomySetting = Number(document.getElementsByClassName('PLFE')[0].value); // Current Fuel Economy setting.
      const baseFuelPerLap = fuel_calc(fuelEconomySetting); // Base fuel consumption per lap.

      // Find the currently active driver's strategy form.
      const activeDriverForm = document.querySelector('form[id$="strategy"]:not([style*="display:none"]):not([style*="display: none"])');
      const currentStintId = parseInt(document.getElementsByName('stintId')[0].value); // ID of the stint being edited.
      // Push value for the current stint, affecting fuel consumption.
      const stintPushValue = parseFloat(activeDriverForm.querySelector('[pushevent]').cells[currentStintId].childNodes[0].value);

      // Observes changes to the fuel input field in the dialog.
      const fuelDialogObserver = new MutationObserver(function(mutations) {
        mutations.forEach(mutation => {
          // Recalculate necessary values as they might change if the user interacts with other parts of the page.
          const updatedFuelInputElement = dialogElement.querySelector('.num');
          const updatedFuelEconomySetting = Number(document.getElementsByClassName('PLFE')[0].value);
          const updatedBaseFuelPerLap = fuel_calc(updatedFuelEconomySetting);
          const updatedActiveDriverForm = document.querySelector('form[id$="strategy"]:not([style*="display:none"]):not([style*="display: none"])');
          const updatedCurrentStintId = parseInt(document.getElementsByName('stintId')[0].value);
          const updatedStintPushValue = parseFloat(updatedActiveDriverForm.querySelector('[pushevent]').cells[updatedCurrentStintId].childNodes[0].value);

          // Calculate and display the estimated number of laps ('realfuel').
          const realFuelDisplayElement = document.getElementById('realfuel');
          if (realFuelDisplayElement) {
            const fuelAmount = parseFloat(updatedFuelInputElement.textContent);
            const totalFuelPerLap = updatedBaseFuelPerLap + updatedStintPushValue;
            const estimatedLaps = (fuelAmount / (totalFuelPerLap * TRACK_INFO.length)).toFixed(2);
            realFuelDisplayElement.textContent = estimatedLaps;
          }
        });
      });

      // Start observing the fuel input element for changes in its child list (text content).
      fuelDialogObserver.observe(fuelInputElement, { characterData: false, attributes: false, childList: true, subtree: false });

      const gameEstimatedLapsElement = document.getElementById('fuelLapsPrediction'); // Element showing game's own lap estimate.
      // If our custom 'realfuel' display isn't already there, create and add it.
      if (!document.getElementById('realfuel')) {
        const realFuelDisplay = document.createElement('span');
        realFuelDisplay.id = 'realfuel';
        realFuelDisplay.setAttribute('style', 'position: relative;top: 2px;vertical-align: text-bottom;width: 2rem;display: inline-table;color: #ffffff;margin-left: 5px;cursor: pointer;background-color: #96bf86;border-radius: 40%;');

        // Calculate initial estimated laps for display.
        const initialFuelAmount = Number(fuelInputElement.textContent);
        const initialTotalFuelPerLap = baseFuelPerLap + stintPushValue;
        realFuelDisplay.textContent = (initialFuelAmount / (initialTotalFuelPerLap * TRACK_INFO.length)).toFixed(2);

        // Add click event to allow user to overwrite game's estimate with our calculation.
        realFuelDisplay.addEventListener('click', function overwriteGameEstimate() {
          if (gameEstimatedLapsElement) {
            gameEstimatedLapsElement.textContent = this.textContent;
          }
        });
        // Add the 'realfuel' display next to the game's estimate.
        if (gameEstimatedLapsElement) {
          gameEstimatedLapsElement.parentElement.append(realFuelDisplay);
        }
      }
    }
    // Observes a parent element for the addition of a specific child element (dialog) and executes a callback when found.
    function waitForAddedNode(options) {
      // If the parent element is already being observed, do nothing.
      if (options.parent.getAttribute('observing') === 'true') {
        return;
      }
      options.parent.setAttribute('observing', 'true'); // Mark the parent as being observed.

      // Create a MutationObserver to watch for changes in the parent element.
      const dialogObserver = new MutationObserver(function(mutations, observerInstance) {
        // Check if the target dialog (identified by a form element within it) has been added.
        const dialogFormElement = options.parent.querySelector('form');

        if (dialogFormElement) {
          // Specifically check if this is the tyre/fuel selection dialog by looking for 'fuelLapsPrediction'.
          if (dialogFormElement.querySelector('[id=fuelLapsPrediction]')) {
            try {
              // Execute the callback function with the dialog form element.
              options.done(dialogFormElement);
              // Note: The original code had a commented out `this.disconnect()`.
              // Depending on requirements, the observer might need to be disconnected here
              // if it's only needed once per dialog appearance, or if `options.done` handles it.
              // For now, it stays active as per original logic.
            } catch (error) {
              console.error("Error executing waitForAddedNode callback:", error);
            }
          }
        }
      });

      // Configure and start the observer.
      // It observes the specified parent or the entire document if no parent is given.
      // `subtree` is true if `options.recursive` is true OR if no parent is specified (implies document-wide observation).
      // `childList` is true to detect additions/removals of child nodes.
      dialogObserver.observe(options.parent || document, {
        subtree: !!options.recursive || !options.parent,
        childList: true,
      });

      return dialogObserver; // Return the observer instance.
    }
    // Enables direct editing of fuel/lap values in the strategy table.
    function addEdit() {
      // Find all elements designated for advanced fuel editing.
      const advancedFuelElements = document.getElementsByName('advancedFuel');
      if (advancedFuelElements) {
        advancedFuelElements.forEach(fuelElementContainer => {
          // Check if edit functionality has already been applied to this element.
          if (!fuelElementContainer.getAttribute('event')) {
            enableEditingForElement(fuelElementContainer);
            fuelElementContainer.setAttribute('event', 'true'); // Mark as processed.
          }
        });
      }

      // Makes a specific fuel/lap display element editable and sets up event listeners.
      function enableEditingForElement(fuelElementContainer) {
        // The actual display element for the number (fuel or laps).
        const numericDisplayElement = fuelElementContainer.parentElement.querySelectorAll('.num')[0];
        numericDisplayElement.contentEditable = true; // Make the element editable.
        numericDisplayElement.classList.add("withSlider"); // Class for styling or interaction with sliders.
        numericDisplayElement.classList.remove("green"); // Remove default green styling.

        // Event listener for click: Clear the field for new input, store current value if not empty.
        numericDisplayElement.addEventListener('click', function() {
          const hiddenInputElement = this.parentElement.nextElementSibling; // Associated hidden input.
          if (this.textContent !== '') {
            hiddenInputElement.value = this.textContent; // Store current value before clearing.
          }
          this.textContent = ''; // Clear for editing.
        });

        // Event listener for focusout: Restore the stored value if the element loses focus.
        numericDisplayElement.addEventListener('focusout', function() {
          const hiddenInputElement = this.parentElement.nextElementSibling;
          this.textContent = hiddenInputElement.value; // Restore from hidden input.
        });

        // Event listener for input: Validate and handle the entered data.
        numericDisplayElement.addEventListener('input', function(event) {
          const hiddenInputElement = this.parentElement.nextElementSibling; // Associated hidden input.

          // Basic validation: Allow only up to two digits.
          // TODO: This validation seems too restrictive (e.g., for fuel > 99). Consider revising.
          if (event.data && !event.data.match(/^[0-9]{0,2}$/)) {
            this.textContent = ''; // Clear invalid input.
            return; // Stop further processing for this input event.
          }

          let currentValue = parseInt(this.textContent);
          // If parsing fails (e.g., empty string), revert to the stored value.
          if (isNaN(currentValue)) {
            currentValue = parseInt(hiddenInputElement.value); // Fallback to stored value.
            // If still NaN (e.g. stored value was also non-numeric), perhaps default to 0 or handle error.
            if (isNaN(currentValue)) currentValue = 0; 
          }

          // Clamp value to the maximum allowed by the hidden input.
          const maxValue = parseInt(hiddenInputElement.max);
          if (currentValue > maxValue) {
            this.textContent = maxValue.toString();
            currentValue = maxValue;
          }
          
          // Special handling if the value is 0.
          // This updates a related 'fuel1' input, possibly for the first stint's fuel.
          if (currentValue === 0) {
            const driverStrategyForm = this.closest('form');
            if (driverStrategyForm && driverStrategyForm.id) {
              const driverIdSuffix = driverStrategyForm.id[1]; // Assumes ID like 'd1strategy'.
              const firstStintFuelInput = document.getElementsByName('fuel1')[driverIdSuffix - 1];
              if (firstStintFuelInput) {
                firstStintFuelInput.value = '0';
              }
            }
          }
          // Update the hidden input with the (potentially modified) current value.
          hiddenInputElement.value = currentValue.toString();
        });
      }
    }
    // Adds fuel adjustment sliders to the strategy interface.
    function addFuelSlider() {
      // Find all elements designated for advanced fuel controls.
      // These elements act as containers or anchors for placing the sliders.
      const advancedFuelControlElements = document.getElementsByName('advancedFuel');

      if (advancedFuelControlElements) {
        advancedFuelControlElements.forEach(controlElement => {
          // Check if a slider has already been added for this control element.
          // This is determined by checking the number of children in the previous sibling element,
          // assuming the slider is added there and increases the child count.
          // TODO: This condition (controlElement.previousElementSibling.childElementCount < 4)
          // is a bit indirect. Consider adding a specific marker/class when a slider is added
          // for a more robust check.
          if (controlElement.previousElementSibling && controlElement.previousElementSibling.childElementCount < 4) {
            // Call createSlider utility function to generate and insert the slider.
            // The slider is associated with 'controlElement', and configured with a min value of 0 and max of 200.
            createSlider(controlElement, 0, 200);
          }
        });
      }
    }
    // Synchronizes all stint push level selects for a driver based on the main push level select and checkbox state.
    function syncSelects() {
      const driverForm = this.closest("form");
      if (!driverForm || !driverForm.id) return;

      const driverIdSuffix = driverForm.id[1]; // Assumes ID like 'd1strategy'.
      const syncCheckbox = this.parentElement.querySelector('.syncCheckbox');
      const mainPushSelect = this.parentElement.querySelector('[name=pushLevel]');
      
      // Find all individual stint push select dropdowns for the current driver.
      const driverStrategyContainer = document.getElementById(`d${driverIdSuffix}strategy`);
      if (!driverStrategyContainer) return;
      const stintPushSelects = driverStrategyContainer.querySelectorAll(".pushSelect");

      if (syncCheckbox.checked) {
        // If checkbox is checked, synchronize all stint selects to the main select.
        stintPushSelects.forEach(select => {
          select.classList.add("select_overwrite"); // Mark as overwritten.
          select.selectedIndex = mainPushSelect.selectedIndex;
          select.disabled = true; // Disable individual stint selects.
          // Update stint details (fuel, wear) based on the new synchronized push level.
          const stintCell = select.closest("td");
          if (stintCell) {
            const fuelRow = select.closest("tbody").querySelector('.fuel');
            if (fuelRow && fuelRow.cells[stintCell.cellIndex]) {
              updateStintDetails(fuelRow.cells[stintCell.cellIndex]);
            }
          }
        });
      } else {
        // If checkbox is unchecked, re-enable individual stint selects.
        stintPushSelects.forEach(select => {
          select.classList.remove("select_overwrite");
          select.disabled = false;
        });
      }
    }

    // Adds a "Synchronize Selects" checkbox to each driver's main push level control area.
    function addSelectCheckbox() {
      // Get all main push level select elements.
      const mainPushSelectElements = document.getElementsByName('pushLevel');
      if (mainPushSelectElements) {
        mainPushSelectElements.forEach(mainPushSelect => {
          if (mainPushSelect && mainPushSelect.parentElement && !mainPushSelect.parentElement.querySelector('.syncCheckbox')) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("syncCheckbox");
            // Consider adding a label for accessibility or relying on title attribute.
            // checkbox.title = "Synchronize all stint push levels to this setting";
            
            // Add event listener to the checkbox itself for changes.
            checkbox.addEventListener("change", syncSelects);
            
            // Insert the checkbox before the main push select element.
            mainPushSelect.parentNode.insertBefore(checkbox, mainPushSelect);
            
            // Also trigger sync when the main push select changes (if checkbox is checked).
            mainPushSelect.addEventListener("change", syncSelects);
          }
        });
      }
    }
    // Injects a circuit map image into the strategy page.
    function injectCircuitMap() {
      // Check if the custom map has already been injected.
      if (!document.getElementById('customMap')) {
        try {
          // Define the target container where the map will be placed.
          const targetContainer = document.querySelector('[id=strategy] .eight'); // Targets a div with class 'eight' within id 'strategy'.
          if (!targetContainer) {
            console.warn("Target container for circuit map not found.");
            return;
          }

          const circuitImage = document.createElement('img');
          circuitImage.id = 'customMap'; // ID for the image element.
          // Set the image source. Currently hardcoded to dark mode version.
          // Consider logic for theme detection if light mode map is also available:
          // const isDarkMode = document.getElementById('igplus_darkmode'); // Example check
          // circuitImage.src = chrome.runtime.getURL(`images/circuits/${TRACK_CODE}${isDarkMode ? '_dark' : ''}.png`);
          circuitImage.src = chrome.runtime.getURL(`images/circuits/${TRACK_CODE}_dark.png`);
          circuitImage.setAttribute('style', 'width:100%;'); // Style for the image.

          const mapLink = document.createElement('a');
          // Link the image to a relevant track information page, if available.
          mapLink.href = trackLink[TRACK_CODE] || '#'; // Fallback to '#' if no link.
          mapLink.append(circuitImage);

          targetContainer.append(mapLink);
        } catch (error) {
          // Catch potential errors, e.g., if page structure changes or elements are not found.
          console.error("Error injecting circuit map:", error);
        }
      }
    }
    // Reads strategy data from a linked Google Sheet and displays it in a table.
    async function readGSheets() {
      // Proceed only if the table hasn't been imported already.
      if (document.getElementById('importedTable')) {
        return;
      }

      // --- Helper function: getCurrentTrack ---
      // Filters rows from the Google Sheet data to include only those relevant to the current track.
      async function filterSheetDataForCurrentTrack(sheetData, trackStorageInfo) {
        const relevantRows = [];
        try {
          sheetData.forEach((row) => {
            let rowTrackValue;
            // Ensure trackStorageInfo.gTrack (column name for track in GSheet) is valid.
            if (row[trackStorageInfo.gTrack] === undefined) {
                // console.warn(`Track column '${trackStorageInfo.gTrack}' not found in a row. Skipping row.`);
                return; // Or handle as an error / different logic
            }

            if (isNaN(row[trackStorageInfo.gTrack])) {
              rowTrackValue = row[trackStorageInfo.gTrack].toLowerCase();
            } else {
              rowTrackValue = row[trackStorageInfo.gTrack].toString(); // Ensure it's a string if it's a number
            }
            // Check if the track name/code from the sheet matches any known aliases for the current track.
            if (trackDictionary[TRACK_CODE] && trackDictionary[TRACK_CODE].includes(rowTrackValue)) {
              relevantRows.push(row);
            }
          });
        } catch (error) {
          console.error("Error filtering Google Sheet data by track:", error);
          return -1; // Indicate error
        }
        return relevantRows;
      }

      // --- Helper function: sortTable ---
      // Sorts the imported table when a column header is clicked.
      function sortTable() {
        const columnIndex = this.cellIndex;
        const tableElement = document.getElementById('importedTable');
        if (!tableElement) return;

        let rows, switching, i, x, y, shouldSwitch, direction, switchCount = 0;
        switching = true;
        direction = 'asc'; // Default sort direction.

        while (switching) {
          switching = false;
          rows = tableElement.rows;
          // Loop through all table rows (except the first, which contains headers).
          for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            const xCell = rows[i].getElementsByTagName('TD')[columnIndex];
            const yCell = rows[i + 1].getElementsByTagName('TD')[columnIndex];
            if (!xCell || !yCell) continue; // Skip if cells are not found

            // Compare cell content, handling numbers and text appropriately.
            let xValue = xCell.innerHTML;
            let yValue = yCell.innerHTML;
            const xNum = parseInt(xValue);
            const yNum = parseInt(yValue);

            let comparisonX = isNaN(xNum) ? xValue.toLowerCase() : xNum;
            let comparisonY = isNaN(yNum) ? yValue.toLowerCase() : yNum;
            comparisonX = (comparisonX === '-') ? 0 : comparisonX; // Treat '-' as 0 for comparison.
            comparisonY = (comparisonY === '-') ? 0 : comparisonY;

            if (direction === 'asc') {
              if (comparisonX > comparisonY) {
                shouldSwitch = true;
                break;
              }
            } else if (direction === 'desc') {
              if (comparisonX < comparisonY) {
                shouldSwitch = true;
                break;
              }
            }
          }
          if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchCount++;
          } else {
            // If no switching has been done and direction is 'asc', switch to 'desc' and run again.
            if (switchCount === 0 && direction === 'asc') {
              direction = 'desc';
              switching = true;
            }
          }
        }
      }
      
      // --- Helper function: removeColumnFromTable ---
      // Removes a specified column from the given HTML table.
      function removeColumnFromTable(tableElement, columnName) {
        let columnIndex = -1;
        // Find the index of the column to remove from the header row.
        if (tableElement.rows.length > 0) {
            for (let i = 0; i < tableElement.rows[0].cells.length; i++) {
                if (tableElement.rows[0].cells[i].textContent === columnName) {
                    columnIndex = i;
                    break;
                }
            }
        }
        // If the column was found, remove the cells from all rows.
        if (columnIndex !== -1) {
            for (let i = 0; i < tableElement.rows.length; i++) {
                tableElement.rows[i].deleteCell(columnIndex);
            }
        }
      }

      // --- Main logic for readGSheets ---
      const { gLink: googleSheetLink } = await chrome.storage.local.get({ 'gLink': '' });
      if (!googleSheetLink) {
        // console.log("Google Sheets link not configured.");
        return;
      }

      const { gTrack: trackColumnName } = await chrome.storage.local.get({ 'gTrack': 'track' });
      const { gLinkName: sheetTabName } = await chrome.storage.local.get({ 'gLinkName': 'Sheet1' });
      
      const sheetIdRegex = /spreadsheets\/d\/(.*)\/edit/;
      const regexMatch = sheetIdRegex.exec(googleSheetLink);
      if (!regexMatch || !regexMatch[1]) {
        console.error("Invalid Google Sheets link format.");
        return;
      }
      const sheetId = regexMatch[1];

      const queryBaseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
      const sheetQuery = encodeURIComponent('Select *');
      const fullQueryUrl = `${queryBaseUrl}&sheet=${sheetTabName}&tq=${sheetQuery}`;

      const outputTableElement = document.createElement('table');
      outputTableElement.setAttribute('style', 'width: 100%;table-layout: auto;text-align: center;');
      outputTableElement.id = 'importedTable';

      // --- Nested function: processAndDisplaySheetData ---
      // Fetches, processes, and displays data from the Google Sheet.
      async function processAndDisplaySheetData() {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay to allow page elements to settle.
        try {
          const response = await fetch(fullQueryUrl);
          const responseText = await response.text();
          
          // Extract JSON data from the response.
          const jsonData = JSON.parse(responseText.substring(47).slice(0, -2));
          if (!jsonData.table || !jsonData.table.cols || !jsonData.table.rows) {
            console.error('Malformed JSON data received from Google Sheets.');
            return;
          }

          const columnLabels = [];
          const headerRow = document.createElement('tr');

          // If data is without labels, use the first row as labels.
          if (jsonData.table.cols.length > 0 && !jsonData.table.cols[0].label && jsonData.table.rows.length > 0) {
            jsonData.table.cols.forEach((col, i) => {
              if (jsonData.table.rows[0].c[i] && jsonData.table.rows[0].c[i].v !== null) {
                col.label = jsonData.table.rows[0].c[i].v.toString();
              } else {
                col.label = `Column ${i+1}`; // Fallback label
              }
            });
            // Remove the first row as it's now used for labels
            jsonData.table.rows.shift();
          }
          
          // Extract column labels for the table header.
          jsonData.table.cols.forEach((heading) => {
            let columnLabel = heading.label || ''; // Use empty string if label is missing.
            if (columnLabel.toLowerCase() === trackColumnName.toLowerCase()) { // Ensure case-insensitive comparison
              columnLabel = columnLabel.toLowerCase();
            }
            columnLabels.push(columnLabel);
            const th = document.createElement('th');
            th.setAttribute('style', 'font-family: "RobotoCondensed","Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;cursor: pointer;background-color: #8f8f8f;color: #ffffff;border-radius: 5px;');
            th.addEventListener('click', sortTable);
            th.textContent = columnLabel;
            headerRow.appendChild(th);
          });
          outputTableElement.appendChild(headerRow);

          // Extract row data.
          const extractedRowData = [];
          jsonData.table.rows.forEach((sheetRow) => {
            const rowObject = {};
            columnLabels.forEach((label, index) => {
              rowObject[label] = (sheetRow.c[index] != null) ? sheetRow.c[index].v : '';
            });
            extractedRowData.push(rowObject);
          });
          
          // Process rows (filter by track, then append to table).
          await appendFilteredRowsToTable(extractedRowData, { gTrack: trackColumnName });

        } catch (error) {
          console.error("Error fetching or processing Google Sheet data:", error);
          // If fetching/processing fails, and retries are configured, it could be handled here.
          // For now, we just log the error. The retry logic is in `appendFilteredRowsToTable`.
        }
      }
      
      // --- Nested function: appendFilteredRowsToTable ---
      // Filters rows by track and appends them to the output table. Handles retries.
      async function appendFilteredRowsToTable(allRows, trackStorageInfo) {
        let filteredRows = await filterSheetDataForCurrentTrack(allRows, trackStorageInfo);
        
        if (filteredRows === -1 && googleSheetReadAttempts > 0) { // Error occurred during filtering
          googleSheetReadAttempts--;
          await new Promise(res => setTimeout(res, 2000)); // Wait before retrying.
          // console.log(`Retrying Google Sheet read. Attempts left: ${googleSheetReadAttempts}`);
          // Retry fetching and processing the entire sheet, or just filtering if appropriate.
          // Current implementation implies retrying the whole process by calling readGSheets again,
          // which is problematic due to potential infinite loops if the error persists.
          // A better approach would be to retry just `processAndDisplaySheetData` or `filterSheetDataForCurrentTrack`.
          // For this refactor, we'll assume the original retry logic was for the entire `readGSheets`
          // and keep it similar, but this is a point for future improvement.
          await readGSheets(); // This recursive call is risky.
          return; // Stop current execution path.
        } else if (filteredRows === -1) { // Error and no attempts left
            // console.error("Failed to filter Google Sheet data after multiple attempts.");
            return;
        }


        filteredRows.forEach((rowObject) => {
          const tr = document.createElement('tr');
          Object.values(rowObject).forEach((cellValue) => { // Iterate over values in the order they were pushed
            const td = document.createElement('td');
            td.textContent = cellValue;
            tr.appendChild(td);
          });
          outputTableElement.appendChild(tr);
        });

        // Append the populated table to the document if it's not already there.
        if (!document.getElementById('importedTable')) {
          const targetContainer = document.querySelectorAll('.eight.columns.mOpt.aStrat')[0];
          if (targetContainer) {
            targetContainer.append(outputTableElement);
            // Remove the track column as it's used for filtering, not display.
            removeColumnFromTable(outputTableElement, trackColumnName.toLowerCase());
          } else {
            console.warn("Target container for GSheets table not found.");
          }
        }
      }

      // Start the process.
      await processAndDisplaySheetData();
    }
    // Adds event handlers for adding more stints to each driver's strategy.
    async function addMoreStints() {
      // Get all fuel elements, which serve as anchors to find strategy forms.
      const fuelElements = document.getElementsByClassName('fuel');
      Object.values(fuelElements).forEach(fuelElement => {
        const driverForm = fuelElement.closest('form');
        if (driverForm) {
          // Find the '.igpNum' container, which is related to stint numbering/controls.
          const igpNumContainer = driverForm.querySelector('.igpNum');
          if (igpNumContainer && igpNumContainer.parentElement) {
            // Add event handler for stint modifications (add/remove).
            // Passes car economy, track info, and race length multiplier for calculations.
            addStintEventHandler(igpNumContainer.parentElement, { CAR_ECONOMY, TRACK_INFO, raceLengthMultiplier });
          } else {
            console.warn("Could not find '.igpNum' container for a driver form:", driverForm.id);
          }
        }
      });
    }

    // Injects weather information into each driver's strategy section.
    function addWeatherInStrategy() {
      // Get all fuel elements, which serve as anchors to find strategy forms.
      const fuelElements = document.getElementsByClassName('fuel');
      const mainPageWeatherElement = document.getElementsByClassName('pWeather')[0];

      if (!mainPageWeatherElement) {
        console.warn("Main page weather element '.pWeather' not found. Cannot inject weather.");
        return;
      }

      Object.values(fuelElements).forEach(fuelElement => {
        const driverForm = fuelElement.closest('form');
        if (driverForm) {
          const noticeArea = driverForm.querySelector('.notice'); // Area where weather info will be prepended.
          if (noticeArea) {
            // Check if weather info has already been added to this notice area.
            if (!noticeArea.querySelector('.clonedWeatherElement')) { // Use a specific class for cloned element
              const clonedWeather = mainPageWeatherElement.cloneNode(true);
              clonedWeather.className = 'clonedWeatherElement'; // Add a specific class
              // Adjust styles for cloned weather element for better visibility/integration.
              clonedWeather.childNodes[0].style.filter = 'brightness(0) invert(1)'; // Icon style
              clonedWeather.childNodes[1].style.color = 'white'; // Text style
              clonedWeather.childNodes[2].setAttribute('style', 'width: 28px;height: 28px;'); // Image style
              clonedWeather.setAttribute('style', 'display: inline;padding-right: 10px;'); // Container style
              
              noticeArea.prepend(clonedWeather);
            }
          } else {
            console.warn("Notice area not found for driver form:", driverForm.id);
          }
        }
      });
    }
  })();

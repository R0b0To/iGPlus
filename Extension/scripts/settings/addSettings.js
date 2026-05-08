function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataVal]) => element.dataset[dataKey] = dataVal);
    } else if (key in element) {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  }
  element.append(...children.filter(Boolean));
  return element;
}

(async () => {
  if (!document.getElementById('iGPlus')) {
    const { injectIGPlusOptions } = await import(chrome.runtime.getURL('scripts/settings/settingsHTML.js'));
    const success = await injectIGPlusOptions();
    if (success) initializeSettingsLogic();
  }
})();

async function initializeSettingsLogic() {
  const { fetchManagerData } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const { language } = await import(chrome.runtime.getURL('common/localization.js'));
  const { scriptDefaults } = await import(chrome.runtime.getURL('common/config.js'));
  const { strategyPreview, createDownloadButton, createDeleteButton } = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
  
  // Storage Wrapper for cleaner async calls
  const storage = {
    get: async (key) => (await chrome.storage.local.get(key))[key],
    set: async (data) => await chrome.storage.local.set(data),
    mergeScript: async (id, val) => {
      const data = await chrome.storage.local.get({ script: scriptDefaults });
      data.script[id] = val;
      await chrome.storage.local.set({ script: data.script });
    }
  };

  const UI = {
    langSelect: document.getElementsByName('language')[0],
    exportSaves: document.querySelectorAll('.exportSave'),
    forceSyncBtn: document.getElementById('forceSync'),
    gdrive: document.getElementById('gdrive'),
    separator: document.getElementById('separator'),
    links: { link: document.getElementById('link'), sname: document.getElementById('sname'), track: document.getElementById('track') },
    fileUploads: document.querySelectorAll('.myFile')
  };

  // --- 1. LOCALIZATION & RESTORATION --- //
  async function restoreOptions() {
    let langCode = await storage.get('language');
    if (!langCode) {
      const managerData = await fetchManagerData();
      langCode = ['en', 'it', 'es'].includes(managerData.language) ? managerData.language : 'en';
    }

    // Auto-translate using the dataset attributes attached in HTML
    document.querySelectorAll('[data-loc-text]').forEach(el => {
      if (language[langCode].optionsText[el.dataset.locText]) {
        el.textContent = language[langCode].optionsText[el.dataset.locText];
      }
    });

    document.querySelectorAll('[data-loc-tip]').forEach(el => {
      if (language[langCode].scriptDescription[el.dataset.locTip]) {
        el.dataset.fieldtip = language[langCode].scriptDescription[el.dataset.locTip];
      }
    });

    // Special formatted texts
    const raceSign = await storage.get('raceSign');
    const overSign = await storage.get('overSign');
    if (document.getElementById('raceSign')) document.querySelector('#raceSign .text').textContent = `${language[langCode].optionsText.RaceReport} ( ${raceSign ? '-' : '+'} )`;
    if (document.getElementById('overSign')) document.querySelector('#overSign .text').textContent = `${language[langCode].optionsText.StartOvertakes} ( ${overSign ? '-' : '+'} )`;

    // Restore text inputs
    UI.separator.value = await storage.get('separator') || ',';
    UI.links.link.value = await storage.get('gLink') || '';
    UI.links.sname.value = await storage.get('gLinkName') || '';
    UI.links.track.value = await storage.get('gTrack') || '';

    // Restore Checkboxes
    const scripts = await storage.get('script') || scriptDefaults;
  
  const checkboxes = document.querySelectorAll(
  '.checkbox-wrapper input[type="checkbox"]'
);

//const logoffBtn = document.getElementById('gdrive-logoff');

for (const checkbox of checkboxes) {
  const id = checkbox.parentElement.id;

  checkbox.checked =
    id === 'raceSign'
      ? raceSign
      : id === 'overSign'
        ? overSign
        : !!scripts[id];

  // only touch DOM once if needed
  /*if (id === 'gdrive' && logoffBtn) {
    logoffBtn.hidden = !checkbox.checked;
  }*/
}
    handleDependentCheckboxes('strategy', ['sliderS', 'editS']);
    updateLastSyncTime(scripts.gdrive);
    setupExportDropdowns();
  }

  // --- 2. EVENT LISTENERS SETUP --- //
  UI.langSelect.addEventListener('change', (e) => {
    storage.set({ language: ['it', 'es'].includes(e.target.value) ? e.target.value : 'en' });
    restoreOptions();
  });

  UI.separator.addEventListener('input', (e) => storage.set({ separator: e.target.value }));
  
  Object.entries(UI.links).forEach(([key, element]) => {
    element.addEventListener('change', (e) => {
      const val = e.target.value;
      if (key === 'track') storage.set({ gTrack: val.toLowerCase() });
      if (key === 'sname') storage.set({ gLinkName: val });
      if (key === 'link') validateAndSaveLink(val);
    });
  });


  // Setup Fieldtip Tooltips via Delegation
  setupTooltips();

  // File Upload Logic
  UI.fileUploads.forEach(input => input.addEventListener('change', handleFileUpload));


  restoreOptions();


  // Checkbox Event Delegation (Global handling)
  document.getElementById('iGPlus').addEventListener('change', async (e) => {
    if (e.target.type === 'checkbox') {
      const id = e.target.parentElement.id;
      const isChecked = e.target.checked;

      if (['raceSign', 'overSign'].includes(id)) {
        await storage.set({ [id]: isChecked });
        restoreOptions();
      } else if (['editS', 'sliderS'].includes(id)) {
        await handleExclusiveCheckboxes(e.target);
      } else {
        await storage.mergeScript(id, isChecked);
        if (id === 'gdrive') isChecked ? checkAuth() : UI.forceSyncBtn.classList.remove('visibleSync');
        if (id === 'strategy') handleDependentCheckboxes('strategy', ['sliderS', 'editS']);
      }
    }
  });


  // --- 3. HELPER FUNCTIONS (Update these 2 functions) --- //

  function handleDependentCheckboxes(parentId, childIds) {
    const parentInput = document.getElementById(parentId)?.querySelector('input[type="checkbox"]');
    if (!parentInput) return;
    
    // If parent is unchecked, disable the children
    childIds.forEach(id => {
      const childInput = document.getElementById(id)?.querySelector('input[type="checkbox"]');
      if (childInput) childInput.disabled = !parentInput.checked;
    });
  }

  async function handleExclusiveCheckboxes(targetCheckbox) {
    const clickedId = targetCheckbox.parentElement.id;
    // Determine who the "other" checkbox is
    const otherId = clickedId === 'sliderS' ? 'editS' : 'sliderS';
    const otherCheckbox = document.getElementById(otherId)?.querySelector('input[type="checkbox"]');
    
    // If the user checks one, uncheck the other automatically
    if (targetCheckbox.checked && otherCheckbox) {
      otherCheckbox.checked = false;
    }
    
    // Save both updated states to Chrome storage
    const scripts = await storage.get('script') || {};
    scripts[clickedId] = targetCheckbox.checked;
    if (otherCheckbox) {
      scripts[otherId] = otherCheckbox.checked;
    }
    await storage.set({ script: scripts });
  }

  function validateAndSaveLink(url) {
    if (!url) { UI.links.link.className = ''; return storage.set({ gLink: '' }); }
    fetch(url).then(res => {
      UI.links.link.className = res.ok ? 'valid' : 'invalid';
      if (res.ok) storage.set({ gLink: url });
    }).catch(() => UI.links.link.className = 'invalid');
  }

  async function updateLastSyncTime(isGDriveEnabled) {
    if (isGDriveEnabled) {
      //UI.forceSyncBtn.classList.add('visibleSync');
      const syncDate = (await storage.get('syncDate')) || 'Never';
      let syncText = document.getElementById('syncDateObj');
      if (!syncText) {
        syncText = document.createElement('div');
        syncText.id = 'syncDateObj';
        UI.gdrive.append(syncText);
      }
      syncText.textContent = `Last Synced: ${syncDate}`;
    } else {
      UI.forceSyncBtn.classList.remove('visibleSync');
    }
  }

async function checkAuth() {
  const checkbox = document.querySelector('#gdrive input');
  //const logoffBtn = document.getElementById('gdrive-logoff'); // Get our new button
  
  // If the user is unchecking the box to simply PAUSE sync, 
  // we just return early. (They aren't logging out, just pausing).
  if (!checkbox.checked) {
    return; 
  }

  // 1. Disable the checkbox so they can't click it again quickly
  checkbox.disabled = true; 

  // 2. Create or find the loader element
  let loader = document.getElementById('gdrive-loader');
  if (!loader) {
    loader = document.createElement('span');
    loader.id = 'gdrive-loader';
    loader.className = 'gdrive-loader';
    checkbox.parentNode.append(loader);
  }
  
  // 3. Show the loader
  loader.style.display = 'inline-block';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getFirstToken', forceReapprove:true });
    
    if (!response || response.error || !response.token) {
      // Revert if failed or canceled
      checkbox.checked = false;
    } else {
      // SUCCESS! 
      // Show the Log off button now that they are authenticated
      //if (logoffBtn) logoffBtn.style.display = 'inline-block'; 
      
      const token = response.token;
      
      // 4. Wrap the sync message in a Promise
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'syncData', direction: false, token: token.access_token }, syncResponse => {
          if (syncResponse && syncResponse.done) {
            // Assuming restoreOptions is defined elsewhere
            if (typeof restoreOptions === 'function') restoreOptions();
          }
          resolve(); 
        });
      });
    }
  } catch (err) {
    console.error("Auth or Sync failed:", err);
    checkbox.checked = false;
  } finally {
    // 5. Clean up
    if (loader) loader.style.display = 'none';
    checkbox.disabled = false; 
  }
}

function buildPseudoSelect(elementId, keys, changeCallback) {
    const oldElement = document.getElementById(elementId);
    if (!oldElement) return;

    // 1. Build Custom Wrapper
    const customSelectWrapper = el('div', { id: elementId, className: 'pseudo-select' });
    
    // Trigger Button
    const trigger = el('div', { className: 'pseudo-select-trigger' }, 
      el('span', { textContent: 'All' })
    );
    
    // Options Container
    const optionsContainer = el('div', { className: 'pseudo-options' });

    // 2. Build the Options List
    keys.forEach(track => {
      const isAll = track === '0';
      const label = isAll ? 'All' : track.toUpperCase();
      
      const option = el('div', { className: 'pseudo-option', dataset: { value: track } });
      
      // Inject flag if it's not "All" and not "save" (fallback edge case)
      if (!isAll && track !== 'save') {
        option.append(el('img', { 
          src: 'https://static.igpmanager.com/igp/design/image/empty.gif', 
          className: `flag f-${track.toLowerCase()} !mr-[5px]`, 
          style: 'margin-right: 8px; vertical-align: middle;' 
        }));
      }
      option.append(el('span', { textContent: label }));

      // 3. Handle Option Click
      option.addEventListener('click', (ev) => {
        ev.stopPropagation();
        
        // Update trigger text/icon
        trigger.innerHTML = '';
        if (!isAll && track !== 'save') {
          trigger.append(el('img', { 
            src: 'https://static.igpmanager.com/igp/design/image/empty.gif', 
            className: `flag f-${track.toLowerCase()} !mr-[5px]`, 
            style: 'margin-right: 8px; vertical-align: middle;' 
          }));
        }
        trigger.append(el('span', { textContent: label }));
        
        // Close dropdown
        optionsContainer.style.display = 'none';

        // Fire the specific callback (Strategy or Setup)
        changeCallback({ 
          target: { value: track, parentElement: customSelectWrapper.parentElement } 
        });
      });

      optionsContainer.append(option);
    });

    // 4. Setup Toggle and Click-Outside Behavior
    trigger.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isVisible = optionsContainer.style.display === 'block';
      // Close any other open pseudo-selects
      document.querySelectorAll('.pseudo-options').forEach(opt => opt.style.display = 'none'); 
      optionsContainer.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (ev) => {
      if (!customSelectWrapper.contains(ev.target)) {
        optionsContainer.style.display = 'none';
      }
    });

    // 5. Replace Old Element and Trigger Initial Load
    customSelectWrapper.append(trigger, optionsContainer);
    oldElement.replaceWith(customSelectWrapper);

    changeCallback({ target: { value: '0', parentElement: customSelectWrapper.parentElement } });
  }


async function setupExportDropdowns() {
    // --- STRATEGIES DROPDOWN ---
    const strategiesData = await storage.get('save');
    if (strategiesData && Object.keys(strategiesData).length > 0) {
      const strategyKeys = ['0'];
      
      // Only include tracks that actually have saved data
      Object.entries(strategiesData).forEach(([key, value]) => {
        if (Object.keys(value).length > 0) strategyKeys.push(key);
      });

      // Build the Pseudo-Select for Strategies
      if (strategyKeys.length > 1) {
        buildPseudoSelect('exportSave_Strategies', strategyKeys, displayPreview);
      }
    }else{
      const container = document.getElementById('exportSave_Strategies');

if (container) {
  container.innerHTML = '';

  let next = container.nextElementSibling;
  while (next) {
    const current = next;
    next = next.nextElementSibling;

    if (
      current.classList.contains('igplus-download') ||
      current.classList.contains('igplus-delete')
    ) {
      current.remove();
    }
  }
}
    }

    // --- SETUPS DROPDOWN ---
    const [{getActiveCircuits, getActiveScale }] = await Promise.all([import(chrome.runtime.getURL('scripts/raceSetup/settings.js'))]);
    const setupsData = await getActiveCircuits();
    if (setupsData && setupsData["1"]) {
      const setupKeys =['0', ...Object.keys(setupsData["1"])];
      
      // Build the Pseudo-Select for Setups
      if (setupKeys.length > 1) {
        buildPseudoSelect('exportSave_Setups', setupKeys, displaySetupPreview);
      }
    }
  }

  // --- STRATEGY PREVIEW HANDLER ---
  async function displayPreview(e) {
    const selectBox = e.target;
    const saveKey = selectBox.value;
    const savesData = await storage.get('save');
    const container = selectBox.parentElement;

    // Fix: Properly clear ALL old tables and buttons
    const existingList = document.getElementById('saveList');
    if (existingList) existingList.remove();
    container.querySelectorAll('.download-button, .trash, .main-action-btn').forEach(btn => btn.remove());

    if (saveKey !== '0' && savesData && savesData[saveKey]) {
      const sList = await strategyPreview(savesData[saveKey], { te: 30 });
      sList.querySelectorAll('tr').forEach(tr => {
        const btn = createDownloadButton();
        btn.addEventListener('click', downloadSave); // Your existing strategy download function
        tr.append(btn);
      });
      sList.querySelectorAll('.trash').forEach(trsh => trsh.addEventListener('click', deleteSave)); // Your existing strategy delete
      container.append(sList);
    } else if (saveKey === '0' && savesData) {
      // Append global buttons for "All"
      const downBtn = createDownloadButton();
      downBtn.classList.add('main-action-btn','igplus-download');
      downBtn.addEventListener('click', downloadSave);
      
      const delBtn = createDeleteButton();
      delBtn.classList.add('main-action-btn','igplus-delete');
      delBtn.addEventListener('click', deleteSave);
      
      container.append(downBtn, delBtn);
    }
  }

 // --- SETUP PREVIEW HANDLER (CARD LAYOUT) ---
  async function displaySetupPreview(e) {
    const selectBox = e.target;
    const track = selectBox.value;
    const setupsData = await storage.get('customCircuits');
    const container = selectBox.parentElement;

    // Clear old tables and buttons
    container.querySelectorAll('.setup-modal-content, .download-button, .trash, .main-action-btn').forEach(el => el.remove());

    if (!setupsData) return;

    if (track === '0') {
      // Global buttons for "All" Setups
      const downBtn = createDownloadButton();
      downBtn.classList.add('main-action-btn','igplus-download');
      downBtn.addEventListener('click', () => downloadSetup('0'));
      container.append(downBtn);


    } else {
      const tier = "1"; // Only interested in showing Tier 1
      
      if (setupsData[tier] && setupsData[tier][track]) {
        const setup = setupsData[tier][track];

        // 1. Create the Main Wrapper matching your structure
        const modalContent = document.createElement('div');
        modalContent.className = 'setup-modal-content';
        modalContent.dataset.protonpassForm = "";


        // 3. Create the Input Rows
        const rideRow = document.createElement('div');
        rideRow.className = 'setup-row';
        rideRow.innerHTML = `<label>Ride Height</label><input type="number" id="edit-ride" value="${setup.ride}" min="1">`;

        const suspRow = document.createElement('div');
        suspRow.className = 'setup-row';
        suspRow.innerHTML = `<label>Suspension</label><input type="number" id="edit-susp" value="${setup.suspension}">`;

        const wingRow = document.createElement('div');
        wingRow.className = 'setup-row';
        wingRow.innerHTML = `<label>Wing</label><input type="number" id="edit-wing" value="${setup.wing}">`;


        // 5. Append everything to the main card
        modalContent.append(rideRow, suspRow, wingRow);

        // 6. Setup auto-saving on value changes
        const rideInput = rideRow.querySelector('input');
        const suspInput = suspRow.querySelector('input');
        const wingInput = wingRow.querySelector('input');

        const updateStorage = async () => {
          const freshData = await storage.get('customCircuits');
          freshData[tier][track].ride = Number(rideInput.value);
          freshData[tier][track].suspension = Number(suspInput.value);
          freshData[tier][track].wing = Number(wingInput.value);
          await storage.set({ customCircuits: freshData });
        };

        rideInput.addEventListener('change', updateStorage);
        suspInput.addEventListener('change', updateStorage);
        wingInput.addEventListener('change', updateStorage);

        container.append(modalContent);
      }
    }
  }

  // --- DEDICATED SETUP DOWNLOAD / DELETE LOGIC ---
  async function downloadSetup(track, tier = null) {
    const setupsData = await storage.get('customCircuits');
    if (!setupsData) return;

    let dataToDownload = {};
    let filename;

    if (track === '0') {
      dataToDownload = setupsData; 
      filename = 'setups_all';
    } else if (tier) {
      dataToDownload = { [tier]: { [track]: setupsData[tier][track] } };
      filename = `setup_${track}_${tier}`;
    }

    const blob = new Blob([JSON.stringify({ customCircuits: dataToDownload })], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  function setupTooltips() {
    let fieldtip = document.getElementById('fieldtip');
    if (!fieldtip) {
      fieldtip = el('span', { id: 'fieldtip', style: 'opacity:0; display:none;' });
      document.getElementById('iGPlus').append(fieldtip);
    }

    document.getElementById('iGPlus').addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('help')) {
        fieldtip.textContent = e.target.dataset.fieldtip;
        fieldtip.style.display = 'inline-block';
        const position = { top: e.target.offsetTop - fieldtip.offsetHeight - 16, left: e.target.offsetLeft - fieldtip.offsetWidth / 2 + 16 };
        fieldtip.style.top = `${position.top}px`;
        fieldtip.style.left = `${position.left}px`;
        fieldtip.style.opacity = '1';
      }
    });

    document.getElementById('iGPlus').addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('help')) {
        fieldtip.style.opacity = '0';
        fieldtip.style.display = 'none';
      }
    });
  }

async function handleFileUpload(event) {
    const input = event.target;
    const file = input.files[0]; 
    const uploadType = input.dataset.uploadType; // Will be 'Strategies' or 'Setups'
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const obj = JSON.parse(e.target.result);

        if (uploadType === 'Setups') {
          // --- SETUPS UPLOAD LOGIC ---
          if (obj.customCircuits) {
            let existingData = await storage.get('customCircuits') || { "1": {}, "2": {}, "rookie": {} };
            
            // Deep merge so uploading a single track doesn't erase the others
            Object.keys(obj.customCircuits).forEach(tier => {
              if (!existingData[tier]) existingData[tier] = {};
              Object.keys(obj.customCircuits[tier]).forEach(track => {
                existingData[tier][track] = obj.customCircuits[tier][track];
              });
            });

            await storage.set({ customCircuits: existingData });
            input.className = 'valid upl';
          } else {
            throw new Error('Invalid setup file structure');
          }
        } else {
          // --- STRATEGIES UPLOAD LOGIC ---
          const track = Object.keys(obj)[0].toLowerCase();
          const hashID = Object.keys(obj[track])[0];
          const validTracks =['be', 'it', 'sg', 'my', 'jp', 'us', 'mx', 'br', 'ae', 'bh', 'eu', 'de', 'es', 'ru', 'tr', 'au', 'at', 'hu', 'gb', 'ca', 'az', 'mc', 'cn', 'fr', 'nl', 'save'];
          
          if (validTracks.includes(track)) {
            let data = await storage.get('save') || {};
            if (track === 'save') {
               // Deep merge for full saves
              Object.keys(obj.save).forEach(t => {
                if (!data[t]) data[t] = obj.save[t];
                else Object.assign(data[t], obj.save[t]);
              });
            } else {
              if (!data[track]) data[track] = {};
              data[track][hashID] = obj[track][hashID];
            }
            await storage.set({ save: data });
            input.className = 'valid upl';
          } else {
            input.className = 'invalid upl';
          }
        }
        
        // Refresh the dropdown UI automatically after a short delay
        setTimeout(setupExportDropdowns, 200); 

      } catch (err) {
        alert(`${file.name} is not valid JSON`);
        input.className = 'invalid upl';
      }
    };
    
    reader.readAsText(input.files[0]);
    event.target.value = '';
  }


  // --- DEDICATED STRATEGY DOWNLOAD / DELETE LOGIC ---
  async function downloadSave(e) {
    const savesData = await storage.get('save');
    if (!savesData) return;

    // Read the value from our custom pseudo-select
    const track = document.getElementById('exportSave_Strategies').querySelector('span').textContent.toLocaleLowerCase();
    let filename = 'save';
    let dataToDownload;

    if (track === 'all') {
      // Download all strategies. Wrap in { save: ... } to maintain your import structure
      dataToDownload = { save: savesData };
      filename = 'save';
    } else {
      const saveID = e.target.closest('tr').id;
      dataToDownload = { [track]: {[saveID]: savesData[track][saveID] } };
      filename = `${track}_${saveID}`;
    }

    // Trigger the file download
    const blob = new Blob([JSON.stringify(dataToDownload)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

async function deleteSave(e) {
  const track = document.getElementById('exportSave_Strategies').querySelector('span').textContent.toLocaleLowerCase();
  const scripts = await storage.get('script') || {};
  let token = false;

  // Check if Google Drive Sync is enabled to sync deletions
  if (scripts.gdrive) {
    try {
      // Send message to background script to get the token silently
      const response = await chrome.runtime.sendMessage({ action: 'getTokenSilent' });
      
      if (response && response.token) {
        token = response.token; // This is the { access_token: "..." } object
      } else {
        console.warn('Could not get token for deletion sync:', response?.error);
      }
    } catch (err) {
      console.error('Messaging error while getting token:', err);
    }
  }

  if (track === 'all') {
    // Delete ALL strategies
    await chrome.storage.local.remove('save');
    console.log('iGPlus | Removing all saves');
    
    if (token) {
      chrome.runtime.sendMessage({
        type: 'deleteFile',
        data: { type: 'strategies', track: 0, name: 'delete_strategies' },
        token: token.access_token
      });
    }
  } else {
    // Delete a specific strategy
    const saveID = e.target.closest('tr').id;
    const savesData = await storage.get('save');

    if (savesData && savesData[track] && savesData[track][saveID]) {
      delete savesData[track][saveID];
      await storage.set({ save: savesData });
    }

    if (token) {
      chrome.runtime.sendMessage({
        type: 'deleteFile',
        data: { type: 'strategies', track: track, name: saveID },
        token: token.access_token
      });
    }
  }

  // Refresh the dropdown and table UI
  setupExportDropdowns();
}

}
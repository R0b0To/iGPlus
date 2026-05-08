/**
 * Utility to easily build DOM elements
 * Usage: el('div', { id: 'myId', className: 'text' }, el('span', { textContent: 'Hello' }))
 */
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

// Reusable Components
const createDescription = (desc, locTipKey) => el('span', { 
  className: 'help gg-info', 
  dataset: { fieldtip: desc, locTip: locTipKey } 
});

const createInputField = (id, name, locTextKey) => el('div', { className: 'inputField' },
  el('div', { className: 'text', textContent: name, htmlFor: id, dataset: { locText: locTextKey } }),
  el('input', { id, type: 'text', placeholder: name })
);

const createScriptCheckbox = ({ id, name, desc, locTextKey, locTipKey, children =[] }) => {
  const labelText = el('span', { className: 'text', textContent: name, htmlFor: `${id}check`, dataset: { locText: locTextKey } });
  const tickMark = el('div', { className: 'tick_mark' });
  const labelCheck = el('label', { htmlFor: `${id}check` }, tickMark);
  const inputCheck = el('input', { type: 'checkbox', id: `${id}check` });

  const container = el('div', { className: 'checkbox-wrapper', id }, inputCheck, labelCheck, labelText);
  if (desc) container.append(createDescription(desc, locTipKey));
  if (children.length) container.append(...children.map(createScriptCheckbox));
  
  return container;
};

// Data-Driven Settings Structure
const PREFERENCES =[
  { id: 'darkmode', name: 'Darkmode', locTextKey: 'darkmode' },
  { id: 'raceSign', name: 'Race Report Sign', locTextKey: 'RaceReport' },
  { id: 'overSign', name: 'Overtakes Sign', locTextKey: 'StartOvertakes' }
];

const SCRIPTS =[
  { id: 'review', name: 'Race Review', desc: 'Home page review button...', locTextKey: 'home', locTipKey: 'raceReview' },
  { id: 'league', name: 'League Home', desc: 'In the league page add a full race history...', locTextKey: 'leagueHome', locTipKey: 'leagueHome' },
  { id: 'research', name: 'Research', desc: 'Add a table with the values...', locTextKey: 'research', locTipKey: 'research' },
  { id: 'train', name: 'Training', desc: 'Add an extra column in the training page...', locTextKey: 'training', locTipKey: 'training' },
  { id: 'staff', name: 'My Staff', desc: 'Shows strenght of CD in the staff menus', locTextKey: 'staff', locTipKey: 'myStaff' },
  { id: 'market', name: 'Market (strength and weakness icons)', desc: 'Shows strenght and weakness...', locTextKey: 'staffMarket', locTipKey: 'market' },
  { id: 'marketDriver', name: 'Market (Drivers)', desc: 'Add talent column for drivers...', locTextKey: 'driverMarket', locTipKey: 'marketDriver' },
  { id: 'strategy', name: 'Race Strategy', locTextKey: 'raceStrategy', children:[
      { id: 'sliderS', name: 'Slider' },
      { id: 'editS', name: 'Editable', locTextKey: 'edit' }
  ]},
  { id: 'setup', name: 'Race Setup', locTextKey: 'raceSetup' },
  { id: 'hq', name: 'HQ Level Labels' },
  { id: 'refresh', name: 'Academy Auto-Refresh', desc: 'Add youth academy countdown...', locTextKey: 'academyTimer', locTipKey: 'academyTimer' },
  { id: 'reports', name: 'Reports', desc: 'Add option to extract all the reports...', locTextKey: 'reports', locTipKey: 'reports' },
  { id: 'history', name: 'Advanced History', desc: 'Add track charateristics...', locTextKey: 'advancedHis', locTipKey: 'history' },
  { id: 'sponsor', name: 'Vertical Sponsor', desc: 'Display the sponsor options vertically', locTextKey: 'verticalSponsor', locTipKey: 'sponsor' },
  { id: 'disablebg', name: 'Disable Background image', locTextKey: 'disablebg' }
];

export function injectIGPlusOptions() {
  return new Promise((resolve) => {
    try {
      const generalContainer = document.getElementById('general');
      if (!generalContainer || document.getElementById('iGPlus')) return resolve(false);

      // 1. Preferences Section
      const separatorContainer = el('div', {}, 
        el('span', { textContent: 'Custom Separator', dataset: { locText: 'separator' } }),
        el('input', { id: 'separator', placeholder: ',' })
      );

      const forceSyncBtn = el('span', { id: 'forceSync', className: 'btn', textContent: 'Sync Now', style: 'display:none;' });
      const cloudStorage = createScriptCheckbox({ id: 'gdrive', name: 'Cloud Sync (Dropbox)', desc: 'test', locTipKey: 'gdriveHelp' });
      cloudStorage.append(forceSyncBtn);
      const logoffBtn = document.createElement('button');
      logoffBtn.classList.add('btn2','logoff-igplus');
      logoffBtn.id = 'gdrive-logoff';
      logoffBtn.textContent = 'Logout';


// 3. Append the button inside the gdrive container
//cloudStorage.appendChild(logoffBtn);

// 4. Handle the Logoff Click
/*logoffBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  // UX: Show that it's processing
  logoffBtn.disabled = true;
  logoffBtn.textContent = 'Logging off...';

  try {
    // Send message to background.js to revoke the token
    const response = await chrome.runtime.sendMessage({ action: 'revokeToken' });
    
    if (response && response.success) {
      // Uncheck the checkbox and hide the logoff button
      const checkbox = document.querySelector('#gdrive input');
      if (checkbox) checkbox.checked = false;
      logoffBtn.style.display = 'none';
      
      // OPTIONAL: Update your chrome.storage so the extension remembers it's turned off
      chrome.storage.local.get(['script'], function(data) {
         const scriptSettings = data.script || {};
         scriptSettings.gdrive = false;
         chrome.storage.local.set({ script: scriptSettings });
      });
    }
  } catch (err) {
    console.error("Failed to revoke token:", err);
  } finally {
    // Reset button state
    logoffBtn.disabled = false;
    logoffBtn.textContent = 'Log out account';
  }
});*/

      const prefsLegend = el('legend', { id: 'preferences', textContent: 'iGPlus preferences', dataset: { locText: 'preferences' } });
      const prefsContainer = el('fieldset', {}, prefsLegend, cloudStorage, ...PREFERENCES.map(createScriptCheckbox), separatorContainer);

      // 2. Scripts Section
      const scriptsLegend = el('legend', { textContent: 'Scripts' });
      const scriptsContainer = el('fieldset', { id: 'scripts' }, scriptsLegend, ...SCRIPTS.map(createScriptCheckbox));

      // 3. Google Sheet Section
      const sheetLegend = el('legend', { id: 'Gsheet', textContent: 'Google Sheet' }, 
        createDescription('Import google data to strategy page', 'gsheet')
      );
      const sheetContainer = el('fieldset', { id: 'googleSheetContainer' }, sheetLegend,
        createInputField('link', 'Link:', 'link'),
        createInputField('track', 'Track ID column header', 'track'),
        createInputField('sname', 'Sheet Name:', 'sheetName')
      );
      
      const exampleLink = el('a', { href: 'https://docs.google.com/spreadsheets/d/1_SrsrcfI9YXKKBatLef7SjmGDV8JEc7mp8AKrQxVcDc/', target: '_blank', textContent: '(Example)', className: 'avoid linkcustom' });
      sheetContainer.querySelector('#sname').parentElement.append(el('span', { textContent: 'optional' }), exampleLink);

      // 4. File Upload Utility Section (Used for Strategies and Setups)
      const createExportBlock = (title) => {
        return el('fieldset', {},
          el('legend', { textContent: title }),
          el('div', { className: 'exportContainer' },
            el('label', { textContent: 'Upload', htmlFor: `myFile_${title}`, className: 'upload btn4 pushBtn' }),
            el('input', { type: 'file', id: `myFile_${title}`, className: 'myFile', dataset: { uploadType: title } }),
            el('div', { id: `exportSave_${title}`, className: 'exportSave' }) // <-- Added Unique ID here
          )
        );
      };

      // Main Wrapper
      const mainContainer = el('div', { id: 'iGPlus' }, 
        prefsContainer, scriptsContainer, createExportBlock('Strategies'), createExportBlock('Setups'), sheetContainer
      );

      generalContainer.append(mainContainer);
      resolve(true);
    } catch (error) {
      console.error('Error injecting settings UI:', error);
      resolve(false);
    }
  });
}
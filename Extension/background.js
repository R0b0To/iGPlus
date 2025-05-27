import { scriptDefaults, tabScripts } from './common/config.js';
import { deleteElement, localStrategiesToCloud, localReportsToCloud, localToCloud , cloudToLocal } from './auth/gDriveHandler.js';
import { addData, getAllData, getElementById } from './common/database.js';

// Tracks the pathname of the script currently being injected to prevent duplicate injections.
let currentlyInjectingForPath = 'none';

/**
 * Main handler for chrome.tabs.onUpdated events.
 * Determines if and which scripts/styles should be injected based on tab URL and user settings.
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} changeInfo - Object describing the change to the tab's status.
 * @param {object} tab - The updated tab object.
 */
async function handleTabUpdate(tabId, changeInfo, tab) {
  let tabStatus = changeInfo.status;
  const { pathname, origin } = new URL(tab.url);

  // For certain mobile user agents, tab status might not fire 'complete' reliably.
  // Force to 'complete' to ensure scripts run.
  // TODO: Evaluate if this is still necessary or if a more robust solution for mobile exists.
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    tabStatus = 'complete';
  }

  // Proceed only if the tab is fully loaded and we are not already injecting for this path.
  if (tabStatus === 'complete' && pathname !== currentlyInjectingForPath) {
    // Fetch user's script enablement settings from local storage.
    // Note: The original comment mentioned `await` not working in Firefox here.
    // `chrome.storage.local.get` is asynchronous and uses a callback.
    // For Manifest V3, it returns a Promise, so `await` can be used if preferred,
    // but the callback pattern is also valid.
    chrome.storage.local.get({ script: scriptDefaults }, async (storageData) => {
      const userScriptSettings = storageData.script;
      // It's good practice to ensure settings are stored back if they were just initialized with defaults.
      // However, if scriptDefaults is truly just defaults and not meant to overwrite, this might be redundant.
      // For now, keeping original behavior.
      // await chrome.storage.local.set({ script: userScriptSettings }); // MV3 can await this

      // Check and inject scripts based on various conditions.
      await injectConditionalScripts(tabId, pathname, origin, userScriptSettings);

      // Logic for path-specific scripts defined in tabScripts configuration.
      const matchedPathKey = Object.keys(tabScripts).find((pageKey) => pathname.startsWith(pageKey));
      const pathConfig = tabScripts[pathname] || tabScripts[matchedPathKey] || {};
      const { key: scriptKey, scripts = [], styles = [] } = pathConfig;

      // Inject if there's no specific enablement key OR if the key is present and true in user settings.
      if (!scriptKey || userScriptSettings[scriptKey]) {
        currentlyInjectingForPath = pathname; // Mark that we are injecting for this path.
        if (styles.length > 0) await executeStyleInjection(tabId, styles);
        if (scripts.length > 0) await executeScriptInjection(tabId, scripts);
        // Resetting `currentlyInjectingForPath` is handled in the callback of `executeScriptInjection`.
        // If only styles are injected, it should also be reset.
        if (scripts.length === 0) {
            currentlyInjectingForPath = 'none';
        }
      }
    });
  }
}

/**
 * Handles injection of conditional scripts like GDrive sync and Dark Mode.
 * @param {number} tabId - The ID of the tab.
 * @param {string} pathname - The pathname of the tab's URL.
 * @param {string} origin - The origin of the tab's URL.
 * @param {object} userSettings - The user's script enablement settings.
 */
async function injectConditionalScripts(tabId, pathname, origin, userSettings) {
  const isIGPManagerSite = origin === 'https://igpmanager.com';
  const isExcludedPathForGDrive = ['/forum', '/press', '/news', '/changelog'].some(path => pathname.startsWith(path));

  // Google Drive sync scripts.
  if (isIGPManagerSite && userSettings.gdrive && !isExcludedPathForGDrive && tabScripts.gdrive?.scripts) {
    await executeScriptInjection(tabId, tabScripts.gdrive.scripts);
  }

  // Disable background styles (if enabled).
  if (isIGPManagerSite && userSettings.disablebg && tabScripts.disablebg?.styles) {
    await executeStyleInjection(tabId, tabScripts.disablebg.styles);
  }

  // Dark mode scripts and styles.
  if (isIGPManagerSite && userSettings.darkmode) {
    const isForum = ['/forum-index', '/forum-thread'].some(path => pathname.startsWith(path));
    if (isForum && tabScripts.darkmode_forum?.scripts) { // Assuming darkmode_forum config exists
        await executeScriptInjection(tabId, tabScripts.darkmode_forum.scripts);
    } else if (tabScripts.darkmode?.scripts) { // Assuming darkmode config exists
        await executeScriptInjection(tabId, tabScripts.darkmode.scripts);
    }
  } else if (isIGPManagerSite && !userSettings.darkmode && tabScripts.darkmode_off?.scripts) { // Script to turn off dark mode
    await executeScriptInjection(tabId, tabScripts.darkmode_off.scripts);
  }
}


chrome.tabs.onUpdated.addListener(handleTabUpdate);

/**
 * Injects specified script files into a tab.
 * @param {number} tabId - The ID of the target tab.
 * @param {string[]} scriptFiles - An array of script file paths to inject.
 * @returns {Promise<void>} A promise that resolves when script injection is attempted.
 */
async function executeScriptInjection(tabId, scriptFiles) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: scriptFiles,
    });
  } catch (error) {
    // console.error(`Error injecting scripts (${scriptFiles.join(', ')}):`, error);
  } finally {
    // Reset after attempting injection, regardless of success or failure for this specific call,
    // to allow other potential injections or re-injections if needed.
    // If multiple executeScriptInjection calls happen for the same page load due to conditional logic,
    // this needs careful handling. `currentlyInjectingForPath` should ideally be reset only once
    // after ALL relevant scripts for a given page load event have been processed.
    // For now, matching original logic: reset after each main script bundle.
    currentlyInjectingForPath = 'none';
  }
}

/**
 * Injects specified CSS files into a tab, removing them first if they already exist.
 * @param {number} tabId - The ID of the target tab.
 * @param {string[]} styleFiles - An array of CSS file paths to inject.
 * @returns {Promise<void>} A promise that resolves when style injection is attempted.
 */
async function executeStyleInjection(tabId, styleFiles) {
  try {
    // It's generally not necessary to remove CSS before inserting unless specifically managing dynamic updates
    // where the same file names might have different content. For simple injection, removal can be skipped.
    // However, to match original behavior of remove then insert:
    await chrome.scripting.removeCSS({
      target: { tabId },
      files: styleFiles,
    }); // Catch potential errors if files don't exist to be removed.
  } catch (e) {
    // Ignore errors from removeCSS (e.g., if stylesheet wasn't previously inserted).
    // console.warn(`Warning removing CSS (${styleFiles.join(', ')}):`, e.message);
  }
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: styleFiles,
    });
  } catch (error) {
    // console.error(`Error injecting CSS (${styleFiles.join(', ')}):`, error);
  }
}

// --- Google Drive File Deletion Queue & Processing ---
let isDeletingFileFromGDrive = false; // Lock to prevent concurrent delete operations.
const gDriveDeleteQueue = []; // Queue for pending delete requests.

/**
 * Processes a request to delete a file from Google Drive.
 * Uses a lock and queue to handle requests sequentially.
 * @param {object} request - The message request containing file details and token.
 */
async function processDeleteFileRequest(request) {
  gDriveDeleteQueue.push(request); // Add request to the queue.
  if (isDeletingFileFromGDrive) {
    // console.log('Deletion in progress, request queued:', request.data.name);
    return; // Another deletion is already running.
  }

  isDeletingFileFromGDrive = true;
  while (gDriveDeleteQueue.length > 0) {
    const currentRequest = gDriveDeleteQueue.shift(); // Get the next request from the queue.
    try {
      // console.log('Processing GDrive deletion for:', currentRequest.data.name);
      // Construct filename as it's stored in GDrive (e.g., 'strategies.json').
      const fileNameInDrive = `${currentRequest.data.type}.json`; 
      await deleteElement(fileNameInDrive, { name: currentRequest.data.name, track: currentRequest.data.track }, currentRequest.token);
      // console.log(`File ${currentRequest.data.name} (type: ${currentRequest.data.type}) deleted from Google Drive.`);
    } catch (error) {
      // console.error('Error deleting file from Google Drive:', error, currentRequest);
      // Optionally, re-queue the request or handle specific errors.
    }
  }
  isDeletingFileFromGDrive = false;
}

// --- Message Handler Helper Functions ---

async function handleSaveStrategyMessage(requestData, requestToken) {
  await localStrategiesToCloud({ 
    name: requestData.name, 
    track: requestData.track, 
    data: requestData.strategy, 
    token: requestToken 
  });
  return { success: true, message: "Strategy saved to cloud." };
}

async function handleSyncDataMessage(requestData, requestToken) {
  // console.log('Full sync requested. Direction:', requestData.direction ? 'local -> cloud then cloud -> local' : 'cloud -> local then local -> cloud');
  const localReports = await getAllData('reports');

  if (requestData.direction) { // True: Local first, then pull Cloud (effectively local overrides cloud for reports during merge)
    await localToCloud(requestToken, { reports: localReports });
    const cloudData = await cloudToLocal(requestToken);
    // console.log("Cloud data after local push:", cloudData);
    if (cloudData && cloudData.cloudReports) {
      await storeReportsFromCloud(cloudData.cloudReports);
    }
  } else { // False: Cloud first, then push Local (effectively cloud overrides local for reports during merge)
    const cloudData = await cloudToLocal(requestToken);
    // console.log("Cloud data before local push:", cloudData);
    if (cloudData && cloudData.cloudReports) {
      await storeReportsFromCloud(cloudData.cloudReports);
    }
    // Re-fetch local reports in case they were modified by storeReportsFromCloud before pushing.
    const updatedLocalReports = await getAllData('reports');
    await localToCloud(requestToken, { reports: updatedLocalReports });
  }

  const dateOfSync = new Date().toString().split('(')[0].trim();
  await chrome.storage.local.set({ syncDate: dateOfSync });
  return { success: true, message: "Full sync completed.", syncDate: dateOfSync };
}

async function handleSaveReportMessage(requestData, requestToken) {
  const localReports = await getAllData('reports'); // Fetch current local reports to assist merge logic in cloud handler.
  await localReportsToCloud({ token: requestToken, data: requestData }, localReports);
  return { success: true, message: "Report saved to cloud." };
}

async function handleAddDataToDBMessage(storeName, dataToAdd) {
  try {
    const id = await addData(storeName, dataToAdd);
    // console.log(`Data added to ${storeName}:`, id, dataToAdd);
    return { success: true, id: id, store: storeName };
  } catch (error) {
    // console.error(`Error adding data to ${storeName}:`, error);
    return { success: false, error: error.message };
  }
}

async function handleGetDataFromDBMessage(dataId, storeName) {
  const data = await getElementById(dataId, storeName);
  return data ?? { success: false, error: "Data not found." };
}

/**
 * Main listener for runtime messages from other parts of the extension.
 * Delegates actions based on message type.
 * @param {object} request - The message payload.
 * @param {object} sender - Information about the sender of the message.
 * @param {function} sendResponse - Function to call to send a response.
 * @returns {boolean} True to indicate that sendResponse will be called asynchronously.
 */
function handleIncomingRuntimeMessage(request, sender, sendResponse) {
  (async () => {
    let response;
    try {
      switch (request.type) {
        case 'deleteFile':
          // Deletion is queued and handled; send preliminary response.
          processDeleteFileRequest(request); 
          response = { success: true, message: "Deletion request queued." };
          break;
        case 'saveStrategy':
          response = await handleSaveStrategyMessage(request.data, request.token);
          break;
        case 'syncData':
          response = await handleSyncDataMessage(request.data, request.token);
          break;
        case 'saveReport':
          response = await handleSaveReportMessage(request.data, request.token);
          break;
        case 'addRaceResultsToDB':
          response = await handleAddDataToDBMessage('race_result', request.data);
          break;
        case 'addShortlistDriverToDB':
          response = await handleAddDataToDBMessage('shortlist_driver', request.data);
          break;
        case 'addRaceReportToDB':
          response = await handleAddDataToDBMessage('reports', request.data);
          break;
        case 'getDataFromDB':
          response = await handleGetDataFromDBMessage(request.data.id, request.data.store);
          break;
        default:
          response = { success: false, error: `Unknown request type: ${request.type}` };
          // console.warn(`Unknown request type received: ${request.type}`);
      }
    } catch (error) {
      // console.error(`Error processing message type ${request.type}:`, error);
      response = { success: false, error: error.message || "An unknown error occurred." };
    }
    sendResponse(response);
  })();

  return true; // Required for asynchronous sendResponse.
}

chrome.runtime.onMessage.addListener(handleIncomingRuntimeMessage);

/**
 * Stores reports fetched from the cloud into the local IndexedDB.
 * @param {object} cloudReportsData - An object where keys are report IDs and values are report data.
 */
async function storeReportsFromCloud(cloudReportsData) {
  if (!cloudReportsData || typeof cloudReportsData !== 'object') {
    // console.log("No cloud reports data to store or invalid format.");
    return;
  }

  for (const reportData of Object.values(cloudReportsData)) { // Iterate over values directly
    try {
      // console.log('Restoring report from cloud:', reportData);
      await addData('reports', reportData); // Use await for cleaner sequential processing
      // console.log('Report data added to local DB:', reportData.id || reportData);
    } catch (error) {
      // console.error('Error adding report data from cloud to DB:', error, reportData);
    }
  }
}
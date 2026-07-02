import { scriptDefaults, tabScripts } from './common/config.js';
import { deleteElement, localStrategiesToCloud, localReportsToCloud, localToCloud, cloudToLocal } from './auth/dropbox_handler.js';
import { addData, getAllData, getElementById } from './common/database.js';
import { getFirstAccessToken, getAccessToken, revokeConsent, invalidateToken } from './auth/dropboxAuth.js';

const api = typeof browser !== 'undefined' ? browser : chrome;

// Track the last path executed per tabId to prevent double-execution
const tabState = {};

api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const url = new URL(tab.url);
  const { pathname, origin } = url;

  if (origin !== 'https://igpmanager.com') return;
  if (tabState[tabId] === pathname) return;

  tabState[tabId] = pathname;

  try {
    const data = await new Promise(resolve => {
      api.storage.local.get({ script: scriptDefaults }, resolve);
    });

    const enabledScripts = data.script;
    const matchedPath = Object.keys(tabScripts).find(pageKey => pathname.startsWith(pageKey));
    const { key, scripts = [], styles = [] } = tabScripts[pathname] || tabScripts[matchedPath] || {};

    // Inject scripts based on enabled features
    const excludedPaths = ['/forum', '/press', '/news', '/changelog'];
    const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));

    if (enabledScripts.gdrive && !isExcludedPath) {
      await injectScripts(tabId, tabScripts.gdrive.scripts);
    }

    if (enabledScripts.disablebg) {
      await injectStyles(tabId, tabScripts.disablebg.styles);
    }

    // Dark mode handling
    const forumPaths = ['/forum-index', '/forum-thread'];
    const isForum = forumPaths.some(path => pathname.startsWith(path));
    const dmScript = enabledScripts.darkmode
      ? isForum ? 'scripts/darkmode_forum.js' : 'scripts/darkmode.js'
      : 'scripts/darkmode_off.js';
    await injectScripts(tabId, [dmScript]);

    // Page-specific scripts
    if (!key || enabledScripts[key]) {
      if (styles.length) await injectStyles(tabId, styles);
      if (scripts.length) await injectScripts(tabId, scripts);
    }
  } catch (error) {
    console.error(`Error injecting scripts for tab ${tabId}:`, error);
  }
});

// Cleanup memory when tab is closed
api.tabs.onRemoved.addListener(tabId => {
  delete tabState[tabId];
});

// Injection helpers - async wrappers for both Manifest V3 and V2
function injectScripts(tabId, files) {
  return new Promise((resolve, reject) => {
    try {
      if (api.scripting) {
        api.scripting.executeScript({ target: { tabId }, files }).then(resolve).catch(reject);
      } else {
        files.forEach(file => api.tabs.executeScript(tabId, { file }));
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

function injectStyles(tabId, files) {
  return new Promise((resolve, reject) => {
    try {
      if (api.scripting) {
        api.scripting.insertCSS({ target: { tabId }, files }).then(resolve).catch(reject);
      } else {
        files.forEach(file => api.tabs.insertCSS(tabId, { file }));
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


// Database helper to reduce duplication
async function addDataToStore(storeName, data) {
  try {
    const id = await addData(storeName, data);
    return { success: true, id };
  } catch (error) {
    console.error(`Error adding data to ${storeName}:`, error);
    return { success: false, error: error.message };
  }
}

// Delete file with retry logic
let isDeleting = false;
async function sendDeleteRequest(request) {
  if (isDeleting) {
    return new Promise(resolve => {
      setTimeout(() => sendDeleteRequest(request).then(resolve), 3000);
    });
  }

  isDeleting = true;
  try {
    await deleteElement(
      `${request.data.type}.json`,
      { name: request.data.name, track: request.data.track },
      request.token
    );
  } finally {
    isDeleting = false;
  }
}

// Store cloud reports to local database
async function storeReports(cloudReports) {
  if (!cloudReports) return;

  for (const [_, value] of Object.entries(cloudReports)) {
    try {
      await addData('reports', value);
    } catch (error) {
      console.error('Error storing report:', error);
    }
  }
}

// Message handlers
const messageHandlers = {
  refreshToken: async (request, sendResponse) => {
    try {
      await invalidateToken(request.oldToken);
      const newTokenObj = await getFirstAccessToken(false);
      sendResponse({ token: newTokenObj });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  getFirstToken: async (request, sendResponse) => {
    try {
      const token = await getFirstAccessToken(request.forceReapprove);
      sendResponse(token ? { token } : { error: 'No token returned' });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  getTokenSilent: async (request, sendResponse) => {
    try {
      const token = await getAccessToken();
      sendResponse({ token });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  revokeToken: async (request, sendResponse) => {
    try {
      await revokeConsent();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  deleteFile: async (request, sendResponse) => {
    try {
      await sendDeleteRequest(request);
      sendResponse({ done: true });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  saveStrategy: async (request, sendResponse) => {
    try {
      await localStrategiesToCloud({
        name: request.data.name,
        track: request.data.track,
        data: request.data.strategy,
        token: request.token
      });
      sendResponse({ done: true });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  syncData: async (request, sendResponse) => {
    try {
      const localReports = await getAllData('reports');

      if (request.direction) {
        await localToCloud(request.token, { reports: localReports });
        const res = await cloudToLocal(request.token);
        await storeReports(res.cloudReports);
      } else {
        const res = await cloudToLocal(request.token);
        await storeReports(res.cloudReports);
        await localToCloud(request.token, { reports: localReports });
      }

      const dateOfSync = /(.*)\(/.exec(new Date().toString())[1];
      await new Promise(resolve => {
        api.storage.local.set({ syncDate: dateOfSync.toString() }, resolve);
      });

      sendResponse({ done: true });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  saveReport: async (request, sendResponse) => {
    try {
      const localReports = await getAllData('reports');
      await localReportsToCloud({ token: request.token, data: request.data }, localReports);
      sendResponse({ done: true });
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  },

  addRaceResultsToDB: async (request, sendResponse) => {
    const result = await addDataToStore('race_result', request.data);
    sendResponse({ done: result.success, ...result });
  },

  addShortlistDriverToDB: async (request, sendResponse) => {
    const result = await addDataToStore('shortlist_driver', request.data);
    sendResponse({ done: result.success, ...result });
  },

  addRaceReportToDB: async (request, sendResponse) => {
    const result = await addDataToStore('reports', request.data);
    sendResponse({ done: result.success, ...result });
  },

  getDataFromDB: async (request, sendResponse) => {
    try {
      const data = await getElementById(request.data.id, request.data.store);
      sendResponse(data ?? false);
    } catch (error) {
      sendResponse({ error: error.message || String(error) });
    }
  }
};

// Single unified message listener
api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = messageHandlers[request.action] || messageHandlers[request.type];

  if (!handler) {
    sendResponse({ error: `Unknown request type: ${request.action || request.type}` });
    return true;
  }

  handler(request, sendResponse);
  return true;
});


const MIGRATION_FLAG = 'customCircuitsReset_v1_done';

api.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    api.storage.local.set({ script: scriptDefaults });
  } else if (details.reason === 'update') {
    api.storage.local.get({ [MIGRATION_FLAG]: false }, (data) => {
      if (data[MIGRATION_FLAG]) return; // already migrated once — do nothing

      api.storage.local.remove('customCircuits', () => {
        if (api.runtime.lastError) {
          console.error('Failed to remove customCircuits:', api.runtime.lastError);
          return; // don't mark as done if it failed; retry on next update
        }
        console.log('iGPlus | One-time migration: cleared legacy customCircuits.');
        api.storage.local.set({ [MIGRATION_FLAG]: true });
      });
    });
  }
});
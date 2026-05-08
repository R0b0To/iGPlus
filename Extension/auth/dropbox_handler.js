const ext = globalThis.browser || globalThis.chrome;

/**
 * Universal Fetch Helper for Dropbox
 */
async function fetchDropboxAPI(url, options) {
  let response = await fetch(url, options);

  // If unauthorized, token is likely expired
  if (response.status === 401) {
    console.warn("iGPlus | Token expired, attempting background refresh...");
    const oldToken = options.headers['Authorization'].replace('Bearer ', '');

    try {
      const refreshResponse = await ext.runtime.sendMessage({ 
        action: 'refreshToken', 
        oldToken: oldToken 
      });

      if (refreshResponse && refreshResponse.token) {
        const newToken = refreshResponse.token.access_token;
        options.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, options);
        console.log("iGPlus | Refresh successful, request retried.");
      } else {
        throw new Error("Silent refresh failed");
      }
    } catch (err) {
      console.error("iGPlus | Could not refresh token:", err);
      throw new Error("Unauthorized: Please re-connect Dropbox.");
    }
  }

  if (!response.ok) {
    if (response.status === 409) return null; // 409 Conflict often means file not found
    const errorText = await response.text();
    throw new Error(`Dropbox API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Internal helper to upload or create a file (Upsert via path)
 */
async function upsertFile(fileName, jsonData, accessToken) {
  const content = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  
  const arg = {
    path: `/${fileName}`,
    mode: 'overwrite',
    autorename: false,
    mute: true
  };

  return fetchDropboxAPI('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify(arg)
    },
    body: content
  });
}

/**
 * Downloads file content directly via path
 */
async function getFile(fileName, accessToken) {
  const arg = { path: `/${fileName}` };

  try {
    const data = await fetchDropboxAPI('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify(arg)
      }
    });
    return data || {};
  } catch (e) {
    return {};
  }
}

// --- EXPORTED FUNCTIONS ---

async function localToCloud(accessToken, local_data) {
  const payload = { token: accessToken };
  
  await Promise.all([
    localConfigToCloud(payload),
    localSetupsToCloud(payload),
    localStrategiesToCloud(payload),
    local_data?.reports ? localReportsToCloud(payload, local_data.reports) : Promise.resolve()
  ]);
}

async function cloudToLocal(accessToken) {
  // Download contents in parallel via predictable pathnames
  const [cloudStrategies, cloudReports, cloudConfig, cloudSetups] = await Promise.all([ // <-- Added cloudSetups
    getFile('strategies.json', accessToken),
    getFile('reports.json', accessToken),
    getFile('config.json', accessToken),
    getFile('setups.json', accessToken) // <-- Added setups.json
  ]);

  const res = {};

  if (cloudConfig && Object.keys(cloudConfig).length > 0) {
    res.cloudConfig = cloudConfig;
    if (cloudConfig.script) cloudConfig.script.dropbox = true;
    await ext.storage.local.set(cloudConfig);
  }
  
  if (cloudReports && Object.keys(cloudReports).length > 0) {
    res.cloudReports = cloudReports;
  }
  
  if (cloudStrategies && Object.keys(cloudStrategies).length > 0) {
    res.cloudStrategies = cloudStrategies;
    const local = await ext.storage.local.get('save');
    await ext.storage.local.set({ save: { ...(local.save || {}), ...cloudStrategies } });
  }

  // Handle setups.json saving back to the local 'customCircuits'
  if (cloudSetups && Object.keys(cloudSetups).length > 0) {
    res.cloudSetups = cloudSetups;
    const local = await ext.storage.local.get('customCircuits');
    // If it's an array, you may just want: await ext.storage.local.set({ customCircuits: cloudSetups });
    await ext.storage.local.set({ customCircuits: { ...(local.customCircuits || {}), ...cloudSetups } });
  }

  return res;
}

async function localConfigToCloud(data) {
  const allData = await ext.storage.local.get(null);
  const targetKeys =['script', 'overSign', 'raceSign', 'gLink', 'gLinkName', 'gTrack', 'separator', 'pushLevels'];
  
  const configInfo = {};
  targetKeys.forEach(key => { if (allData[key] !== undefined) configInfo[key] = allData[key]; });

  if (Object.keys(configInfo).length === 0) return;
  return upsertFile('config.json', configInfo, data.token);
}
async function localSetupsToCloud(data) {
  const localData = await ext.storage.local.get('customCircuits');
  if (!localData.customCircuits) return;

  // Assuming you want to merge cloud setups with local ones (like reports/strategies do):
  const cloudData = await getFile('setups.json', data.token);
  return upsertFile('setups.json', { ...cloudData, ...localData.customCircuits }, data.token);
  
}
async function localReportsToCloud(data, local_data) {
  const reports = local_data || {};
  if (Object.keys(reports).length === 0) return;
  
  const cloudData = await getFile('reports.json', data.token);
  return upsertFile('reports.json', { ...cloudData, ...reports }, data.token);
}

async function localStrategiesToCloud(data) {
  const localSave = (await ext.storage.local.get('save')).save;
  if (!localSave) return;

  const cloudData = await getFile('strategies.json', data.token);
  return upsertFile('strategies.json', { ...cloudData, ...localSave }, data.token);
}

async function deleteElement(type, data, accessToken) {
  const fileName = type.includes('.json') ? type : `${type}.json`;
  const path = `/${fileName}`;

  if (fileName === 'strategies.json' && Number(data.track) === 0) {
    // Delete whole file using Delete Endpoint
    await fetchDropboxAPI('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ path: path })
    });
    return true;
  }

  // Key-specific deletion
  const fileData = await getFile(fileName, accessToken);
  if (!fileData || Object.keys(fileData).length === 0) return false;

  let changed = false;

  if (fileName === 'strategies.json') {
    if (fileData[data.track] && fileData[data.track][data.name]) {
      delete fileData[data.track][data.name];
      changed = true;
    }
  } else if (fileName === 'reports.json') {
    const key = Object.keys(fileData).find(k => fileData[k]?.id === data.name);
    if (key) {
      delete fileData[key];
      changed = true;
    }
  }

  if (changed) {
    await upsertFile(fileName, fileData, accessToken);
  }
  return true;
}

/**
 * Searches for CSV files instead of Google Sheets
 */
async function get_sheets(accessToken) {
  const url = `https://api.dropboxapi.com/2/files/search_v2`;
  const body = { query: ".csv" }; // Adjust extensions if needed
  
  try {
    const data = await fetchDropboxAPI(url, { 
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body)
    });
    
    // Map to {name, id} format like the Drive endpoint
    return data?.matches?.map(m => ({
      name: m.metadata.metadata.name,
      id: m.metadata.metadata.id
    })) ||[];
  } catch (error) {
    console.error('Error getting files:', error);
    return}}
    
export {
  get_sheets,
  deleteElement,
  localStrategiesToCloud,
  localReportsToCloud,
  localToCloud,
  cloudToLocal
};
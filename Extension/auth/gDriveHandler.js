const ext = globalThis.browser || globalThis.chrome;

/**
 * Universal Fetch Helper
 */
async function fetchDriveAPI(url, options) {
  
  let response = await fetch(url, options);

  // If unauthorized, the token is likely expired
  if (response.status === 401) {
    console.warn("iGPlus | Token expired, attempting background refresh...");
    
    const oldToken = options.headers['Authorization'].replace('Bearer ', '');

    try {
      // Ask background to clear the old token and get a fresh one
      const refreshResponse = await chrome.runtime.sendMessage({ 
        action: 'refreshToken', 
        oldToken: oldToken 
      });

      if (refreshResponse && refreshResponse.token) {
        const newToken = refreshResponse.token.access_token;
        
        // Retry the original request with the NEW token
        options.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, options);
        
        console.log("iGPlus | Refresh successful, request retried.");
      } else {
        throw new Error("Silent refresh failed");
      }
    } catch (err) {
      console.error("iGPlus | Could not refresh token:", err);
      // Optional: You could trigger a UI message here telling the user to re-login
      throw new Error("Unauthorized: Please re-connect Google Drive.");
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API Error (${response.status}): ${errorText}`);
  }

  return (response.status === 204) ? null : response.json();
}

/**
 * Shared Item Search (File or Folder)
 */
async function searchItem(name, accessToken, isFolder = false, parentId = null) {
  let query = `name='${name}' and trashed = false`;
  if (isFolder) query += ` and mimeType='application/vnd.google-apps.folder'`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const data = await fetchDriveAPI(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
  return data.files?.length > 0 ? data.files[0] : null;
}

/**
 * Internal helper to find or create the iGPlus folder
 */
async function getOrCreateMainFolder(accessToken) {
  const existing = await searchItem('iGPlus', accessToken, true);
  if (existing) return existing;

  return fetchDriveAPI('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'iGPlus', mimeType: 'application/vnd.google-apps.folder' })
  });
}

/**
 * Internal helper to update or create a file (Upsert)
 */
async function upsertFile(fileName, jsonData, accessToken, folderId) {
  const existing = await searchItem(fileName, accessToken, false, folderId);
  const content = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);

  if (existing) {
    // UPDATE
    return fetchDriveAPI(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: content
    });
  } else {
    // CREATE (Multipart)
    const metadata = { name: fileName, parents: [folderId], mimeType: 'application/json' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    return fetchDriveAPI('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: form
    });
  }
}

/**
 * Downloads file content via media link
 */
async function getGFile(fileId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  try {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    return response.ok ? await response.json() : {};
  } catch (e) {
    return {};
  }
}

// --- EXPORTED FUNCTIONS ---

async function localToCloud(accessToken, local_data) {
  const mainFolder = await getOrCreateMainFolder(accessToken);
  if (!mainFolder) return;

  const payload = { mainFolderId: mainFolder, token: accessToken };
  
  // Run all 3 sync tasks in parallel
  await Promise.all([
    localConfigToCloud(payload),
    localStrategiesToCloud(payload),
    local_data?.reports ? localReportsToCloud(payload, local_data.reports) : Promise.resolve()
  ]);
}

async function cloudToLocal(accessToken) {
  // 1. Search for all files in parallel
  const [stratFile, repFile, confFile] = await Promise.all([
    searchItem('strategies.json', accessToken),
    searchItem('reports.json', accessToken),
    searchItem('config.json', accessToken)
  ]);

  const res = {};
  const downloadTasks = [];

  // 2. Download contents in parallel
  if (confFile) {
    downloadTasks.push(getGFile(confFile.id, accessToken).then(async (data) => {
      res.cloudConfig = data;
      if (data.script) data.script.gdrive = true;
      await ext.storage.local.set(data);
    }));
  }
  if (repFile) {
    downloadTasks.push(getGFile(repFile.id, accessToken).then(data => res.cloudReports = data));
  }
  if (stratFile) {
    downloadTasks.push(getGFile(stratFile.id, accessToken).then(async (data) => {
      res.cloudStrategies = data;
      const local = await ext.storage.local.get('save');
      await ext.storage.local.set({ save: { ...(local.save || {}), ...data } });
    }));
  }

  await Promise.all(downloadTasks);
  return res;
}

async function localConfigToCloud(data) {
  const allData = await ext.storage.local.get(null);
  const targetKeys = ['script', 'overSign', 'raceSign', 'gLink', 'gLinkName', 'gTrack', 'separator', 'pushLevels', 'customCircuits'];
  
  const configInfo = {};
  targetKeys.forEach(key => { if (allData[key] !== undefined) configInfo[key] = allData[key]; });

  if (Object.keys(configInfo).length === 0) return;
  return upsertFile('config.json', configInfo, data.token, data.mainFolderId.id);
}

async function localReportsToCloud(data, local_data) {
  const reports = local_data || {};
  if (Object.keys(reports).length === 0) return;

  const folderId = data.mainFolderId?.id || (await getOrCreateMainFolder(data.token)).id;
  
  const existingFile = await searchItem('reports.json', data.token, false, folderId);
  if (existingFile) {
    const cloudData = await getGFile(existingFile.id, data.token);
    return upsertFile('reports.json', { ...cloudData, ...reports }, data.token, folderId);
  }
  return upsertFile('reports.json', reports, data.token, folderId);
}

async function localStrategiesToCloud(data) {
  const localSave = (await ext.storage.local.get('save')).save;
  if (!localSave) return;

  const folderId = data.mainFolderId?.id || (await getOrCreateMainFolder(data.token)).id;

  const existingFile = await searchItem('strategies.json', data.token, false, folderId);
  if (existingFile) {
    const cloudData = await getGFile(existingFile.id, data.token);
    return upsertFile('strategies.json', { ...cloudData, ...localSave }, data.token, folderId);
  }
  return upsertFile('strategies.json', localSave, data.token, folderId);
}

async function deleteElement(type, data, accessToken) {
  const fileName = type.includes('.json') ? type : `${type}.json`;
  const fileObj = await searchItem(fileName, accessToken);
  if (!fileObj) return false;

  if (fileName === 'strategies.json' && Number(data.track) === 0) {
    // Delete whole file
    await fetchDriveAPI(`https://www.googleapis.com/drive/v3/files/${fileObj.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return true;
  }

  // Key-specific deletion
  const fileData = await getGFile(fileObj.id, accessToken);
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

async function get_sheets(accessToken) {
  const query = encodeURIComponent('mimeType="application/vnd.google-apps.spreadsheet" and trashed = false');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(name,id)`;
  
  try {
    const data = await fetchDriveAPI(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    return data?.files || [];
  } catch (error) {
    console.error('Error getting sheets:', error);
    return [];
  }
}

export {
  get_sheets,
  deleteElement,
  localStrategiesToCloud,
  localReportsToCloud,
  localToCloud,
  cloudToLocal
};
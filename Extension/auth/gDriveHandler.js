/**
 * Safely resolve the correct extension API environment
 */
const getExtAPI = () => {
  if (typeof browser !== 'undefined' && browser.storage) return browser;
  if (typeof chrome !== 'undefined' && chrome.storage) return chrome;
  return null;
};

/**
 * Safely interact with extension local storage (get)
 */
async function getStorage(key, defaultValue) {
  const api = getExtAPI();
  if (!api) return defaultValue;
  
  try {
    const req = key === null ? null : { [key]: defaultValue };
    const res = await api.storage.local.get(req);
    return key === null ? res : (res[key] !== undefined ? res[key] : defaultValue);
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
}

/**
 * Safely interact with extension local storage (set)
 */
async function setStorage(key, value) {
  const api = getExtAPI();
  if (!api) return;
  
  try {
    await api.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Storage set error:', error);
  }
}

/**
 * Drive API Fetch Helper wrapper for consistent request handling
 */
async function fetchDriveAPI(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API Error (${response.status}): ${errorText}`);
  }
  // Accommodate DELETE requests that don't return bodies
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  return response.json();
}

async function createMainFolderGDrive(accessToken) {
  const metadata = {
    name: 'iGPlus',
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  try {
    return await fetchDriveAPI('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    });
  } catch (error) {
    console.error('Error creating main folder:', error);
    return false;
  }
}

async function searchFolder(folderName, accessToken) {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  try {
    const data = await fetchDriveAPI(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return data.files?.length > 0 ? data.files[0] : false;
  } catch (error) {
    console.error('Error searching folder:', error);
    return false;
  }
}

async function getGFile(fileId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  try {
    return await fetchDriveAPI(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    return {};
  }
}

async function updateFile(fileId, newJson, accessToken) {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  try {
    return await fetchDriveAPI(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: typeof newJson === 'string' ? newJson : JSON.stringify(newJson),
    });
  } catch (error) {
    console.error('Error updating file:', error);
    return false;
  }
}

async function searchFile(fileName, accessToken) {
  const query = `name='${fileName}'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(name,id)`;
  
  try {
    const data = await fetchDriveAPI(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return data.files?.length > 0 ? data.files[0] : false;
  } catch (error) {
    console.error('Error searching file:', error);
    return false;
  }
}

async function storeFileIn(folderId, fileName, jsonData, accessToken) {
  const metadata = {
    name: `${fileName}.json`,
    parents: [folderId],
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  
  const content = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  form.append('file', new Blob([content], { type: 'application/json' }));

  try {
    return await fetchDriveAPI('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: form,
    });
  } catch (error) {
    console.error('Error storing file:', error);
    return false;
  }
}

async function deleteFile(fileId, accessToken) {
  if (!fileId) return;
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (response.ok) {
      console.log('File deleted successfully.');
    } else {
      console.error('Error deleting file:', response.statusText);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

async function deleteElement(type, data, accessToken) {
  const fileObj = await searchFile(type, accessToken);
  if (!fileObj) return false;

  const fileData = await getGFile(fileObj.id, accessToken);

  try {
    if (type === 'strategies.json') {
      if (Number(data.track) === 0) {
        await deleteFile(fileObj.id, accessToken);
      } else {
        if (fileData[data.track] && fileData[data.track][data.name]) {
          delete fileData[data.track][data.name];
          await updateFile(fileObj.id, fileData, accessToken);
        }
      }
    } else if (type === 'reports.json') {
      const keyToDelete = Object.keys(fileData).find(key => fileData[key]?.id === data.name);
      if (keyToDelete) {
        delete fileData[keyToDelete];
        await updateFile(fileObj.id, fileData, accessToken);
      }
      return true;
    }
  } catch (error) {
    console.error('Error deleting element:', error);
    return false;
  }
}

async function cloudToLocal(accessToken) {
  const strategy = await searchFile('strategies.json', accessToken);
  const reports = await searchFile('reports.json', accessToken);
  const config = await searchFile('config.json', accessToken);
  const res = {};

  if (config) {
    const cloudConfig = await getGFile(config.id, accessToken);
    res.cloudConfig = cloudConfig;
    
    // Safety check missing properties
    if (cloudConfig.script) {
      cloudConfig.script.gdrive = true;
    }
    
    // Concurrent iteration storage update utilizing Promise.all
    const updatePromises = Object.keys(cloudConfig).map(option => 
      setStorage(option, cloudConfig[option])
    );
    await Promise.all(updatePromises);
  }

  if (reports) {
    res.cloudReports = await getGFile(reports.id, accessToken);
  }

  if (strategy) {
    const cloudStrategies = await getGFile(strategy.id, accessToken);
    res.cloudStrategies = cloudStrategies;
    
    const localSave = await getStorage('save', false);
    const merged = { ...(localSave || {}), ...cloudStrategies };
    await setStorage('save', merged);
  }

  return res;
}

/**
 * @param data object
 * @param data.mainFolderId mainfolderid.
 * @param data.token access token.
 */
async function localConfigToCloud(data) {
  const configInfo = {};
  const allData = await getStorage(null) || {};
  
  const targetKeys =[
    'script', 'overSign', 'raceSign', 'gLink', 
    'gLinkName', 'gTrack', 'separator', 'pushLevels', 'customCircuits'
  ];

  let hasData = false;
  for (const key of targetKeys) {
    if (allData[key] !== undefined) {
      configInfo[key] = allData[key];
      hasData = true;
    }
  }

  if (!hasData) return;

  const cloudConfig = await searchFile('config.json', data.token);
  if (!cloudConfig) {
    await storeFileIn(data.mainFolderId.id, 'config', configInfo, data.token);
  } else {
    await updateFile(cloudConfig.id, configInfo, data.token);
  }
}

async function localReportsToCloud(data, local_data) {
  const raceReports = local_data || {};
  let mainFolder = data?.mainFolderId;
  
  if (!mainFolder) {
    mainFolder = await searchFolder('iGPlus', data.token);
    if (!mainFolder) return;
  }

  if (Object.keys(raceReports).length > 0) {
    const cloudReports = await searchFile('reports.json', data.token);
    if (!cloudReports) {
      await storeFileIn(mainFolder.id, 'reports', raceReports, data.token);
    } else {
      const cloudFile = await getGFile(cloudReports.id, data.token);
      const merged = { ...cloudFile, ...raceReports };
      await updateFile(cloudReports.id, merged, data.token);
    }
  }
}

async function localStrategiesToCloud(data) {
  let mainFolder = data?.mainFolderId;
  
  if (!mainFolder) {
    mainFolder = await searchFolder('iGPlus', data.token);
    if (!mainFolder) return;
  }

  const localSave = await getStorage('save', false);
  if (localSave) {
    const cloudStrategies = await searchFile('strategies.json', data.token);
    if (!cloudStrategies) {
      await storeFileIn(mainFolder.id, 'strategies', localSave, data.token);
    } else {
      const cloudFile = await getGFile(cloudStrategies.id, data.token);
      const merged = { ...cloudFile, ...localSave };
      await updateFile(cloudStrategies.id, merged, data.token);
    }
  }
}

async function localToCloud(accessToken, local_data) {
  let mainFolder = await searchFolder('iGPlus', accessToken);
  if (!mainFolder) {
    mainFolder = await createMainFolderGDrive(accessToken);
  }
  if (!mainFolder) return; // Terminate if folder creation failed

  const payload = { mainFolderId: mainFolder, token: accessToken };
  await localConfigToCloud(payload);
  
  if (local_data && local_data.reports) {
    await localReportsToCloud(payload, local_data.reports);
  }
  
  await localStrategiesToCloud(payload);
}

async function get_sheets(accessToken) {
  const encodedQuery = encodeURIComponent('mimeType="application/vnd.google-apps.spreadsheet"');
  const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=files(name,id)`;
  
  try {
    const data = await fetchDriveAPI(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return data?.files ||[];
  } catch (error) {
    console.error('Error getting sheets:', error);
    return[];
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
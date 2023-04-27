async function createMainFolderGDrive(accessToken){
  const metadata = {'name': 'iGPlus','mimeType': 'application/vnd.google-apps.folder',};
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), body: form,})
    .then((res) => { return res.json(); })
    .then(function(val) { return val; });
}
async function searchFolder(folderName,accessToken) {
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}'and+mimeType='application/vnd.google-apps.folder'&access_token=${accessToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.files.length > 0) return data.files[0];
      else return false;
    })
    .catch((error) => {console.log(error);});
}
async function getGFile(fileId,accessToken){
  return fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', { method: 'GET', headers: {'Authorization': 'Bearer ' + accessToken}})
    .then(response => response.json())
    .then(data => {return data;})
    .catch(error => console.error(error));
}
async function updateFile(fileId,newJson,accessToken){
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}`;
  const headers = {'Authorization': `Bearer ${accessToken}`,'Content-Type': 'application/json'};
  fetch(url, { method: 'PATCH', headers: headers, body: newJson })
    .then(response => response.json())
    .then(data => {})
    .catch(error => console.error(error));
}
async function fullSync(direction,access_token){
  if (direction)
  {
    await localToCloud(access_token);
    await cloudToLocal(access_token);
  }
  else
  {
    await cloudToLocal(access_token);
    await localToCloud(access_token);
  }
  const  dateOfSync = /(.*)\(/.exec(new Date().toString())[1];
  chrome.storage.local.set({syncDate:dateOfSync.toString()});
  return true;
}
async function cloudToLocal(accessToken){
  const setStorage = async function (name,data){chrome.storage.local.set({[name]:data});};
  const strategy = await searchFile('strategies.json',accessToken);
  const reports = await searchFile('reports.json',accessToken);
  const config = await searchFile('config.json',accessToken);

  if(config != false){
    const cloudConfig = await getGFile(config.id,accessToken);
    // -----Config file ------
    Object.keys(cloudConfig).forEach(option=>{
      setStorage(option,cloudConfig[option]);
    });
  }
  if(reports != false){
    const cloudReports = await getGFile(reports.id,accessToken);
    for(const [key,value] of Object.entries(cloudReports)){
      chrome.storage.local.set({[key]:value});
    }
  }
  if(strategy != false){
    const cloudStrategies = await getGFile(strategy.id,accessToken);
    const localFile = await chrome.storage.local.get({save:false}) ?? await browser.storage.local.get({save:false}) ?? false;
    const merged = {...localFile?.save ?? false,...cloudStrategies}; //merge even if local is empty/false
    chrome.storage.local.set({save:merged});
  }

}
async function localToCloud(accessToken){
  let mainFolder = await searchFolder('iGPlus',accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);

  await localConfigToCloud({mainFolderId:mainFolder,token:accessToken});
  await localReportsToCloud({mainFolderId:mainFolder,token:accessToken});
  await localStrategiesToCloud({mainFolderId:mainFolder,token:accessToken});
}
async function storeFileIn(folderId,fileName,jsonData,accessToken){
  fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${fileName}.json`,
      parents: [folderId],
      mimeType: 'application/json',
    }),
  })
    .then(response => response.json())
    .then(file => {
      fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });
    });

}
async function searchFile(fileName,accessToken){
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name+=+'${fileName}'&fields=files(name,id)&access_token=${accessToken}`)
    .then(response => response.json()).then(data => {return data.files[0] || false;}).catch(error => console.error(error));
}
/**
  * @param data object
  * @param data.mainFolderId mainfolderid.
  * @param data.data object data.
  * @param data.token access token.
 */
async function localConfigToCloud(data){

  const configInfo = {};
  const allData = await chrome.storage.local.get(null) ?? await browser.storage.local.get(null) ?? false
  if(allData != false){
    for(const [key,value] of Object.entries((allData)))
    {
      if(key == 'script') configInfo.script = value;
      if(key == 'overSign') configInfo.overSign = value;
      if(key == 'raceSign') configInfo.raceSign = value;
      if(key == 'gLink') configInfo.gLink = value;
      if(key == 'gLinkName') configInfo.gLinkName = value;
      if(key == 'gTrack') configInfo.gTrack = value;
      if(key == 'separator') configInfo.separator = value;
      if(key == 'pushLevels') configInfo.pushLevels = value;
    }
    const cloudConfig = await searchFile('config.json',data.token);
    if(cloudConfig == false)  storeFileIn(data.mainFolderId.id,'config',JSON.stringify(configInfo),data.token);
    else updateFile(cloudConfig.id,JSON.stringify(configInfo),data.token);
  }

}
async function localReportsToCloud(data){
  const raceReports = {};
  const allData = await chrome.storage.local.get(null) ?? await browser.storage.local.get(null) ?? false;
  if(allData != false){
    for(const [key,value] of Object.entries((allData)))
      if(key.endsWith('LRID'))
        raceReports[key] = value;

    let mainFolder = data?.mainFolderId ?? false;
    if(mainFolder == false)
      mainFolder = await searchFolder('iGPlus',data.token);

    if(Object.keys(raceReports).length > 0)
    {
      const cloudReports = await searchFile('reports.json',data.token);
      if(cloudReports == false)  storeFileIn(mainFolder.id,'reports',JSON.stringify(raceReports),data.token);
      else {
        const cloudFile = await getGFile(cloudReports.id,data.token);
        const merged = {...cloudFile,...raceReports};
        updateFile(cloudReports.id,JSON.stringify(merged),data.token);
      }
    }
  }


}
async function localStrategiesToCloud(data){
  let mainFolder = data?.mainFolderId ?? false;
  if(mainFolder == false)
    mainFolder = await searchFolder('iGPlus',data.token);

  const localFile = await chrome.storage.local.get({save:false}) ?? await browser.storage.local.get({save:false}) ?? false;
  if(localFile != false){
    const cloudStrategies = await searchFile('strategies.json',data.token);
    if(cloudStrategies == false)  storeFileIn(mainFolder.id,'strategies',JSON.stringify(localFile.save),data.token);
    else {
      const cloudFile = await getGFile(cloudStrategies.id,data.token);
      const merged = {...cloudFile,...localFile.save};
      updateFile(cloudStrategies.id,JSON.stringify(merged),data.token);
    }
  }
}

async function deleteFile(fileId,accessToken){
  if(fileId != false)
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId.id}`,{method:'DELETE',headers:{'Authorization': `Bearer ${accessToken}`,},})
      .then(response => {
        if (response.ok) console.log('File deleted successfully.');
        else console.error('Error deleting file:', response.statusText);
      })
      .catch(error => { console.error('Error deleting file:', error);
      });
}

async function deleteElement(type,data,accessToken){
  const fileId = await searchFile(type,accessToken);
  const file = await getGFile(fileId.id,accessToken);
  if(type == 'strategies.json'){
    if(data.track == 0){
      deleteFile(fileId,accessToken);
    }else{
      delete file[data.track][data.name];
      updateFile(fileId.id,JSON.stringify(file),accessToken);
    }
  }
  if(type == 'reports.json'){
    delete file[data.name];
    updateFile(fileId.id,JSON.stringify(file),accessToken);
  }

}

export{
  fullSync,
  deleteElement,
  localStrategiesToCloud,
  localReportsToCloud
};
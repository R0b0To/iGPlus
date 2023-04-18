const { getAccessToken } = await import(chrome.runtime.getURL('/auth/authorize.js'));
let ACCESS_TOKEN = await getAccessToken();

/**
 * Returns the folder id of the folder searched by name.
 * Returns false if folder is not found
 * @param {String} folderName The folder name
 */
async function searchFolder(folderName) {
  const accessToken = ACCESS_TOKEN;
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'&access_token=${accessToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.files.length > 0) {
        //console.log(`Folder ID: ${data.files[0].id}`);
        return data.files[0].id;
      } else {
        //console.log(`Folder '${folderName}' not found`);
        return false;
      }
    })
    .catch(error => console.error(error));
}
/**
 * Create new "iGPlus" folder in goodle drive
 */
async function createMainFolderGDrive(){
  const metadata = {
    'name': 'iGPlus', // Filename at Google Drive
    'mimeType': 'application/vnd.google-apps.folder', // mimeType at Google Drive
  };
  const accessToken = ACCESS_TOKEN;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  }).then((res) => { return res.json(); }).then(function(val) { return val; });
}
/**
 * Creates a new folder inside the parent folder
 * Returns the folder id of the folder created
 * @param {String} folderName The name of the folder to be created
 * @param {String} parentFolderId The id of the parent folder
 */
async function createFolderGDrive(folderName,parentFolderId){
  const metadata = {
    'name': folderName, // Filename at Google Drive
    'mimeType': 'application/vnd.google-apps.folder', // mimeType at Google Drive
    'parents': [parentFolderId]
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

  return fetch('https://www.googleapis.com/upload/drive/v3/files', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + ACCESS_TOKEN }),
    body: form,
  }).then((res) => {
    return res.json();
  }).then(function(val) {
    return val;
  });
}

async function getGDriveFileInfo(fileName){
  const mainFolderID = await searchFolder('iGPlus');
  return fetch(`https://www.googleapis.com/drive/v3/files?q='${mainFolderID}'+in+parents+and+name+=+'${fileName}'&fields=files(name,id)&access_token=${ACCESS_TOKEN}`)
    .then(response => response.json())
    .then(data => {
      console.log((data));
      return data.files[0];})
    .catch(error => console.error(error));
}
async function prepareDataForUpload(){
  let savedStrategies = {};
  const configInfo = {};
  const raceReports = {};
  const allData = await chrome.storage.local.get();

  Object.keys(allData).forEach(key=>{

    if(key == 'save') savedStrategies = allData.save;
    if(key == 'script') configInfo.script = allData.script;
    if(key == 'overSign') configInfo.overSign = allData.overSign;
    if(key == 'raceSign') configInfo.raceSign = allData.raceSign;
    if(key == 'gLink') configInfo.gLink = allData.gLink;
    if(key == 'gLinkName') configInfo.gLinkName = allData.gLinkName;
    if(key == 'gTrack') configInfo.gTrack = allData.gTrack;
    if(key.endsWith('LRID')) raceReports[key] = allData[key];
  });

  //store race reports in race reports folder, strategies in the strategies, and config in main folder
  return {configInfo,savedStrategies,raceReports};
}
async function getAllFilesInfoInFolder(folderID){
  const accessToken = ACCESS_TOKEN;
  return fetch(`https://www.googleapis.com/drive/v3/files?q='${folderID}'+in+parents&fields=files(name,id)&access_token=${accessToken}`)
    .then(response => response.json())
    .then(data => {
      console.log((data));
      return data.files;})
    .catch(error => {
      console.log(error);
      return false;
    });
}

async function getGFile(fileId){
  return fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + ACCESS_TOKEN
    }
  })
    .then(response => response.json())
    .then(data => {return data;})
    .catch(error => console.error(error));
}
async function setStorage(name,data){
  chrome.storage.local.set({[name]:data});
}
async function updateFile(fileId,newJson){
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}`;
  const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
  fetch(url, {
    method: 'PATCH',
    headers: headers,
    body: newJson
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

async function searchFile(fileName){
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name+=+'${fileName}'&fields=files(name,id)&access_token=${ACCESS_TOKEN}`)
    .then(response => response.json())
    .then(data => {
      return data.files[0] || false;})
    .catch(error => console.error(error));
}
async function storeFileIn(folderId,fileName,jsonData){
  console.log('stored:',ACCESS_TOKEN);
  const accessToken = ACCESS_TOKEN;

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



async function localToCloud(){
  const localData = await prepareDataForUpload();

  //creating folders if necessary
  let mainFolder = await searchFolder('iGPlus');
  if(mainFolder == false) mainFolder = await createMainFolderGDrive();

  let reportsFolder = await searchFolder('reports');
  if(reportsFolder == false) reportsFolder = await createFolderGDrive('reports',mainFolder.id);

  let strategyFolder = await searchFolder('strategies');
  if(strategyFolder == false) strategyFolder = await createFolderGDrive('strategies',mainFolder.id);

  const cloudConfig = await searchFile('config.json');
  if(cloudConfig == false)
    storeFileIn(mainFolder.id,'config',JSON.stringify(localData.configInfo));
  else
    updateFile(cloudConfig.id,JSON.stringify(localData.configInfo));


  Object.keys(localData.raceReports).forEach(async function(report){
    const cloudReport = await searchFile(report + '.json');
    const jsonData = JSON.stringify(localData.raceReports[report]);

    if(cloudReport == false)  storeFileIn(reportsFolder.id,report,jsonData);
    else updateFile(cloudReport.id,jsonData);

  });

  Object.keys(localData.savedStrategies).forEach(async function(saveFolder){
    let trackFolder = await searchFolder(saveFolder);
    const trackSaves = localData.savedStrategies[saveFolder];

    console.log('this folder',trackFolder);
    if(trackFolder == false){
      trackFolder = await createFolderGDrive(saveFolder,strategyFolder.id);
      console.log('savinig',saveFolder,'in',strategyFolder.id,'not',mainFolder.id)
      Object.keys(trackSaves).forEach(nameid => {
        storeFileIn(trackFolder.id,nameid,JSON.stringify(trackSaves[nameid]));
      });
    }else{
      Object.keys(trackSaves).forEach(async function(nameid){ 
        let cloudSave = await searchFile(nameid+'.json');
        if(cloudSave == false) storeFileIn(trackFolder.id,JSON.stringify(trackSaves[nameid]));
        else updateFile(cloudSave.id,JSON.stringify(trackSaves[nameid]));
      });
    
    }

  });

}
async function cloudToLocal(){
  const strategyFolder = await getGDriveFileInfo('Strategies');
  const reportsFolder = await getGDriveFileInfo('Reports');
  const config = await getGDriveFileInfo('config.json');

  const cloudReports = await getAllFilesInfoInFolder(reportsFolder.id);
  const cloudStrategies = await getAllFilesInfoInFolder(strategyFolder.id);
  const cloudConfig = await getGFile(config.id);


  console.log(config,cloudConfig);
  Object.keys(cloudConfig).forEach(option=>{
    setStorage(option,cloudConfig[option]);
  });

  console.log('these are the reports in the cloud',cloudReports);
  cloudReports.forEach(async function(report){
    const reportName = report.name.slice(0,-5); //removing .json from name
    const reportId = report.id;
    const cloudReport = await getGFile(reportId);
    setStorage(reportName,cloudReport);
  });

  //using for intead because of the async functions
  const trackSave = {};
  for(const folder of cloudStrategies){
    trackSave[folder.name] = {};
    const strategyFile = await getAllFilesInfoInFolder(folder.id);
    for(const file of strategyFile){
      const json = await getGFile(file.id);
      const saveId = file.name.slice(0,-5);
      trackSave[folder.name][saveId] = json;
    }
  }

    chrome.storage.local.set({'save':trackSave});


}



export{
  cloudToLocal,
  localToCloud
};
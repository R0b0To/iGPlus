
//TODO change chrome to browser when using firefox
const DEBUG = true;
//-----------------------------Auth region
//#region Google drive auth
const REDIRECT_URL = chrome.identity.getRedirectURL();
const CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const AUTH_URL =
`https://accounts.google.com/o/oauth2/auth\
?client_id=${CLIENT_ID}\
&response_type=token\
&redirect_uri=${encodeURIComponent(REDIRECT_URL)}\
&scope=${encodeURIComponent(SCOPES.join(' '))}`;
const VALIDATION_BASE_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

function extractAccessToken(redirectUri) {
  let m = redirectUri.match(/[#?](.*)/);
  if (!m || m.length < 1)
    return null;
  let params = new URLSearchParams(m[1].split('#')[0]);
  return params.get('access_token');
}


function validate(redirectURL) {
  const accessToken = extractAccessToken(redirectURL);
  if (!accessToken) {
    //throw 'Authorization failure';
    return -2;
  }
  const validationURL = `${VALIDATION_BASE_URL}?access_token=${accessToken}`;
  const validationRequest = new Request(validationURL, {
    method: 'GET'
  });

  function checkResponse(response) {
    return new Promise((resolve, reject) => {
      if (response.status != 200) {
        reject('Token validation error');
      }
      response.json().then((json) => {
        if (json.aud && (json.aud === CLIENT_ID)) {
          resolve(accessToken);
        } else {
          reject('Token validation error');
        }
      });
    });
  }

  return fetch(validationRequest).then(checkResponse);
}


function authorize() {
  return chrome.identity.launchWebAuthFlow({
    interactive: true,
    url: AUTH_URL
  });
}

function getAccessToken() {
  return authorize().then(validate)
    .catch(()=>{
    //user denied access
      return -1;}
    );
}
//#endregion


async function checkAccessToken(token)
{
  let accessToken = token;
    if(token == false || typeof token == 'undefined')
    {
      if(DEBUG)console.log('requesting new token..............');
      accessToken = await getAccessToken();
      if(DEBUG)console.log('Access token:',accessToken);
    }
    return accessToken;
};
/**
 * Returns the folder of the folder searched by name.
 * Returns false if folder is not found
 * @param {String} folderName The folder name
 */
async function searchFolder(folderName,accessToken) {
  if(DEBUG)console.log('searching',folderName);
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'&access_token=${accessToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.files.length > 0) {
        //console.log(`Folder ID: ${data.files[0].id}`);
        return data.files[0];
      } else {
        if(DEBUG)console.log('folder not found',folderName);
        return false;
      }
    })
    .catch(error => console.error(error));
}
/**
 * Create new "iGPlus" folder in goodle drive
 */
async function createMainFolderGDrive(accessToken){
  const metadata = {
    'name': 'iGPlus', // Filename at Google Drive
    'mimeType': 'application/vnd.google-apps.folder', // mimeType at Google Drive
  };
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
async function createFolderGDrive(folderName,parentFolderId,accessToken){
  const metadata = {
    'name': folderName, // Filename at Google Drive
    'mimeType': 'application/vnd.google-apps.folder', // mimeType at Google Drive
    'parents': [parentFolderId]
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

  return fetch('https://www.googleapis.com/upload/drive/v3/files', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  }).then((res) => {
    return res.json();
  }).then(function(val) {
    return val;
  });
}

async function getGDriveFileInfo(fileName,accessToken){
  const mainFolderID = await searchFolder('iGPlus',accessToken);
  return fetch(`https://www.googleapis.com/drive/v3/files?q='${mainFolderID.id}'+in+parents+and+name+=+'${fileName}'&fields=files(name,id)&access_token=${accessToken}`)
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
async function getAllFilesInfoInFolder(folderID,accessToken){
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

async function getGFile(fileId,accessToken){
  return fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
    .then(response => response.json())
    .then(data => {return data;})
    .catch(error => console.error(error));
}
async function setStorage(name,data){
  chrome.storage.local.set({[name]:data});
}
async function updateFile(fileId,newJson,accessToken){
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  fetch(url, {
    method: 'PATCH',
    headers: headers,
    body: newJson
  })
    .then(response => response.json())
    .then(data => {if(DEBUG)console.log(data);})
    .catch(error => console.error(error));
}

async function searchFile(fileName,accessToken){
  return fetch(`https://www.googleapis.com/drive/v3/files?q=name+=+'${fileName}'&fields=files(name,id)&access_token=${accessToken}`)
    .then(response => response.json())
    .then(data => {
      return data.files[0] || false;})
    .catch(error => console.error(error));
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


async function localReportsToCloud(accessToken){
  const localData = await prepareDataForUpload();
  let mainFolder = await searchFolder('iGPlus',accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);
  let reportsFolder = await searchFolder('reports',accessToken);
  if(reportsFolder == false) reportsFolder = await createFolderGDrive('reports',mainFolder.id,accessToken);

  // search for the reports inside the folder. Then update or create the reports
  Object.keys(localData.raceReports).forEach(async function(report){
    const cloudReport = await searchFile(report + '.json',accessToken);
    const jsonData = JSON.stringify(localData.raceReports[report]);
    if(DEBUG)console.log('storing/updating',localData.raceReports[report],'in Reports');
    if(cloudReport == false)  storeFileIn(reportsFolder.id,report,jsonData,accessToken);
    else updateFile(cloudReport.id,jsonData,accessToken);
  });

}

async function localStrategiesToCloud(accessToken) {
  const localData = await prepareDataForUpload();
  let mainFolder = await searchFolder('iGPlus',accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);
  let strategyFolder = await searchFolder('strategies',accessToken);
  if (strategyFolder == false) strategyFolder = await createFolderGDrive('strategies', mainFolder.id,accessToken);

  //search for the track folder
  for (const saveFolder of Object.keys(localData.savedStrategies)) {
    let trackFolder = await searchFolder(saveFolder,accessToken);
    const trackSaves = localData.savedStrategies[saveFolder];
    // if track folder not present create the folder and store all the local strategies in it
    if (trackFolder == false) {
      trackFolder = await createFolderGDrive(saveFolder, strategyFolder.id,accessToken);
      Object.keys(trackSaves).forEach(nameid => {
        storeFileIn(trackFolder.id, nameid, JSON.stringify(trackSaves[nameid]),accessToken);
      });
    } else {
      // if track folder present then update or create the local strategies
      Object.keys(trackSaves).forEach(async function (nameid) {
        let cloudSave = await searchFile(nameid + '.json',accessToken);
        if (cloudSave == false) storeFileIn(trackFolder.id, JSON.stringify(trackSaves[nameid]),accessToken);
        else updateFile(cloudSave.id, JSON.stringify(trackSaves[nameid]),accessToken);
      });
    }
  }

}
async function localStrategyToCloud(strategy,accessToken){
  console.log(strategy);
  let mainFolder = await searchFolder('iGPlus',accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);
  let strategyFolder = await searchFolder('strategies',accessToken);
  if (strategyFolder == false) strategyFolder = await createFolderGDrive('strategies', mainFolder.id,accessToken);
  
  let trackFolder = await searchFolder(strategy.track,accessToken);
  if (trackFolder == false) {
    trackFolder = await createFolderGDrive(strategy.track, strategyFolder.id,accessToken);
  }
    storeFileIn(trackFolder.id, strategy.name, JSON.stringify(strategy.data),accessToken);
}

async function localConfigToCloud(accessToken){
  const localData = await prepareDataForUpload();
  let mainFolder = await searchFolder('iGPlus',accessToken);
  if(mainFolder == false) mainFolder = await createMainFolderGDrive(accessToken);
  const cloudConfig = await searchFile('config.json',accessToken);
  if(cloudConfig == false)
    storeFileIn(mainFolder.id,'config',JSON.stringify(localData.configInfo),accessToken);
  else
    updateFile(cloudConfig.id,JSON.stringify(localData.configInfo),accessToken);

}



function localToCloud(accessToken){
  localConfigToCloud(accessToken);
  localReportsToCloud(accessToken);
  localStrategiesToCloud(accessToken);
}




async function cloudToLocal(accessToken){
  const strategyFolder = await getGDriveFileInfo('Strategies',accessToken);
  const reportsFolder = await getGDriveFileInfo('Reports',accessToken);
  const config = await getGDriveFileInfo('config.json',accessToken);

  const cloudReports = await getAllFilesInfoInFolder(reportsFolder.id,accessToken);
  const cloudStrategies = await getAllFilesInfoInFolder(strategyFolder.id,accessToken);
  const cloudConfig = await getGFile(config.id,accessToken);


  console.log(config,cloudConfig);
  Object.keys(cloudConfig).forEach(option=>{
    if(DEBUG)console.log('restoring',option,cloudConfig[option]);
    setStorage(option,cloudConfig[option]);
  });

  console.log('these are the reports in the cloud',cloudReports);
  cloudReports.forEach(async function(report){
    const reportName = report.name.slice(0,-5); //removing .json from name
    const reportId = report.id;
    const cloudReport = await getGFile(reportId,accessToken);
    if(DEBUG)console.log('restoring',reportName,cloudReport);
    setStorage(reportName,cloudReport);
  });

  //using for intead because of the async functions
  const trackSave = {};
  for(const folder of cloudStrategies){
    trackSave[folder.name] = {};
    const strategyFile = await getAllFilesInfoInFolder(folder.id,accessToken);
    for(const file of strategyFile){
      const json = await getGFile(file.id,accessToken);
      const saveId = file.name.slice(0,-5);
      trackSave[folder.name][saveId] = json;
    }
  }
  const localStrategiesData = await chrome.storage.local.get('save');
  const merged = {...localStrategiesData.save, ...trackSave};
  if(DEBUG)console.log('restoring',merged);
  chrome.storage.local.set({'save':merged});


}
async function deleteFile(fileName,accessToken){
  const fileId = await searchFile(fileName,accessToken);
  if(fileId != false)
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          console.log('File deleted successfully.');
        } else {
          console.error('Error deleting file:', response.statusText);
        }
      })
      .catch(error => {
        console.error('Error deleting file:', error);
      });
}



export{
  cloudToLocal,
  localToCloud,
  deleteFile,
  localReportsToCloud,
  checkAccessToken,
  getAccessToken,
  localStrategiesToCloud,
  localStrategyToCloud
};
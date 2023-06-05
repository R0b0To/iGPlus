import { scriptDefaults, tabScripts } from './common/config.js';
import { deleteElement, localStrategiesToCloud, localReportsToCloud, localToCloud , cloudToLocal } from './auth/gDriveHandler.js';
import { addData, getAllData, getElementById } from './common/database.js';

let scriptRunning = 'none';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  let tab_status = changeInfo.status;
  const { pathname, origin } = new URL(tab.url);

  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    tab_status = 'complete';
  }

  //changed to allow execution of only one instance of the same script
  if (tab_status === 'complete' && pathname != scriptRunning) {
    // await doesn't work in firefox, only here,bug? fix by avoiding it or using browser.storage
    chrome.storage.local.get({ script: scriptDefaults }, function (data) {
      const enabledScripts = data.script;
      chrome.storage.local.set({ script: enabledScripts });

      const matchedPath = Object.keys(tabScripts).find((pageKey) => pathname.startsWith(pageKey));
      const { key, scripts = [], styles = [] } = tabScripts[pathname] || tabScripts[matchedPath] || {};

      //at any igp page check for sync
      if(origin == 'https://igpmanager.com' && enabledScripts.gdrive && !['/forum','/press','/news','/changelog'].some(path=>{return pathname.startsWith(path);}))
        injectScripts(tabId, tabScripts.gdrive.scripts);

      if (!key || enabledScripts[key]) {
        scriptRunning = pathname;
        styles.length && injectStyles(tabId, styles);
        scripts.length && injectScripts(tabId, scripts);
      }
    });
  }
});

/**
 * @param {number} tabId
 * @param {string[]} scriptFiles
 */
function injectScripts(tabId, scriptFiles) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: scriptFiles
    },
    function () {
      scriptRunning = 'none';
    }
  );
}

/**
 * @param {number} tabId
 * @param {string[]} styleFiles
 */
async function injectStyles(tabId, styleFiles) {
  await chrome.scripting.removeCSS({
    target: { tabId },
    files: styleFiles
  });
  chrome.scripting.insertCSS({
    target: { tabId },
    files: styleFiles
  });
}
let isDeleting = false;
async function sendDeleteRequest(request){
  if(!isDeleting){
    console.log('deleting',request.data.name);
    isDeleting = true;
    await deleteElement(request.data.type + '.json',{name:request.data.name,track:request.data.track},request.token);
    console.log((request.data.name,'deleted from google drive'));
    isDeleting = false;
  }
  else{
    setTimeout(()=>{sendDeleteRequest(request);},3000);
  }
}
//cloud requests will be made in the background
chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  //console.log('sent request',request);
  (async function () {
    if (request.type === 'deleteFile')
    {
      sendDeleteRequest(request);
      sendResponse({done:true});
    }
    if (request.type === 'saveStrategy')
    {
      await localStrategiesToCloud({name:request.data.name,track:request.data.track,data:request.data.strategy,token:request.token});
      sendResponse({done:true});
    }
    if (request.type === 'syncData')
    {
      console.log('requesting full sync',request.direction ? 'local -> cloud' : 'cloud -> local');
      const local_reports = await getAllData('reports');
      if (request.direction)
      {
        await localToCloud(request.token,{reports:local_reports});
        const res = await cloudToLocal(request.token);
        console.log(res);
        storeReports(res.cloudReports);
      }
      else
      {
        const res = await cloudToLocal(request.token);
        console.log(res);
        storeReports(res.cloudReports);
        await localToCloud(request.token,{reports:local_reports});
      }

      const  dateOfSync = /(.*)\(/.exec(new Date().toString())[1];
      chrome.storage.local.set({syncDate:dateOfSync.toString()});

      //await fullSync(request.direction,request.token,{reports:local_reports});
      sendResponse({done:true});
    }
    if (request.type === 'saveReport'){
      const local_reports = await getAllData('reports');
      await localReportsToCloud({token:request.token,data:request.data},local_reports);
      sendResponse({done:true});
    }

    if(request.type === 'addRaceResultsToDB')
    {
      addData('race_result',request.data)
        .then((id) => {
          console.log('Data added with ID:', id);
          sendResponse({done:true});
        })
        .catch((error) => {
          console.error(error);
        });
    }
    if(request.type === 'addRaceReportToDB')
    {
      addData('reports',request.data)
        .then((id) => {
          console.log('Data added with ID:', id);
          sendResponse({done:true});
        })
        .catch((error) => {
          console.error(error);
        });
    }
    if(request.type === 'getDataFromDB')
    {
      sendResponse(await getElementById(request.data.id,'race_result') ?? false);
    }

  })();
  return true;

});


function storeReports(cloudReports){

  if((cloudReports))
  {
    for(const [key,value] of Object.entries(cloudReports)){

      console.log('send',key,value);
      addData('reports',value)
        .then((id) => {
          console.log('Data added with ID:', id);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }


}
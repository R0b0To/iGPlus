import { scriptDefaults, tabScripts } from './common/config.js';
import { deleteElement, localStrategiesToCloud, localReportsToCloud, localToCloud, cloudToLocal } from './auth/gDriveHandler.js';
import { addData, getAllData, getElementById } from './common/database.js';

// Use an object to track the last path executed per tabId
// This prevents cross-tab interference and double-triggering
const tabState = {};

// Helper to determine if we are in Firefox or Chrome
const api = typeof browser !== 'undefined' ? browser : chrome;

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only trigger on 'complete' status
  if (changeInfo.status !== 'complete') return;

  const url = new URL(tab.url);
  const { pathname, origin } = url;

  // Prevent double execution on the same page in the same tab
  if (tabState[tabId] === pathname) return;
  tabState[tabId] = pathname;

  // Use standard callback to ensure Firefox compatibility
  api.storage.local.get({ script: scriptDefaults }, function (data) {
    const enabledScripts = data.script;
    
    // Safety check for origin
    if (origin !== 'https://igpmanager.com') return;

    // Logic to find matches
    const matchedPath = Object.keys(tabScripts).find((pageKey) => pathname.startsWith(pageKey));
    const { key, scripts = [], styles = [] } = tabScripts[pathname] || tabScripts[matchedPath] || {};

    // 1. GDrive Sync
    const isExcluded = ['/forum', '/press', '/news', '/changelog'].some(path => pathname.startsWith(path));
    if (enabledScripts.gdrive && !isExcluded) {
      injectScripts(tabId, tabScripts.gdrive.scripts);
    }

    // 2. Disable Background
    if (enabledScripts.disablebg) {
      injectStyles(tabId, tabScripts.disablebg.styles);
    }

    // 3. Dark Mode
    if (enabledScripts.darkmode) {
      const isForum = ['/forum-index', '/forum-thread'].some(path => pathname.startsWith(path));
      const dmScript = isForum ? "scripts/darkmode_forum.js" : "scripts/darkmode.js";
      injectScripts(tabId, [dmScript]);
    } else {
      injectScripts(tabId, ["scripts/darkmode_off.js"]);
    }

    // 4. Page Specific Scripts
    if (!key || enabledScripts[key]) {
      if (styles.length) injectStyles(tabId, styles);
      if (scripts.length) injectScripts(tabId, scripts);
    }
  });
});

// Cleanup memory when tab is closed
api.tabs.onRemoved.addListener((tabId) => {
  delete tabState[tabId];
});

/**
 * Injection helpers using the appropriate API
 */
function injectScripts(tabId, files) {
  // Manifest V3 uses scripting.executeScript, V2 uses tabs.executeScript
  if (api.scripting) {
    api.scripting.executeScript({ target: { tabId }, files: files });
  } else {
    files.forEach(file => api.tabs.executeScript(tabId, { file }));
  }
}

function injectStyles(tabId, files) {
  if (api.scripting) {
    api.scripting.insertCSS({ target: { tabId }, files: files });
    
  } else {
    files.forEach(file => api.tabs.insertCSS(tabId, { file }));
  }
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
          console.log('Data added:', id,request.data);
          sendResponse({done:true});
        })
        .catch((error) => {
          console.error(error);
        });
    }
    if(request.type === 'addShortlistDriverToDB')
      {
        addData('shortlist_driver',request.data)
          .then((id) => {
            console.log('Data added:', id,request.data);
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
          console.log('Data added:', id,request.data);
          sendResponse({done:true});
        })
        .catch((error) => {
          console.error(error);
        });
    }
    if(request.type === 'getDataFromDB')
    {
      sendResponse(await getElementById(request.data.id,request.data.store) ?? false);
    }

  })();
  return true;

});


function storeReports(cloudReports){

  if((cloudReports))
  {
    for(const [key,value] of Object.entries(cloudReports)){

      console.log('restoring',value);
      addData('reports',value)
        .then((id) => {
          console.log('Data added',value);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }


}
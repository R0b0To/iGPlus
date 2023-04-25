import { scriptDefaults, tabScripts } from './common/config.js';
import { deleteElement, fullSync, localStrategiesToCloud, localReportsToCloud } from './auth/gDriveHandler.js';

let scriptRunning = 'none';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  let tab_status = changeInfo.status;
  const { pathname } = new URL(tab.url);

  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    tab_status = 'complete';
  }
  //changed to allow execution of only one instance of the same script
  if (tab_status === 'complete' && pathname != scriptRunning) {
    console.log('path',pathname)
    // await doesn't work in firefox, only here,bug? fix by avoiding it or using browser.storage
    chrome.storage.local.get({ script: scriptDefaults }, function (data) {
      const enabledScripts = data.script;
      chrome.storage.local.set({ script: enabledScripts });

      const matchedPath = Object.keys(tabScripts).find((pageKey) => pathname.startsWith(pageKey));
      const { key, scripts = [], styles = [] } = tabScripts[pathname] || tabScripts[matchedPath] || {};

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
  console.log('exec',scriptFiles)
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

//cloud requests will be made in the baackground
chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
  console.log(request);
  (async function () {
    console.log(request);
    if (request.type === 'deleteFile')
    {
      console.log('deleting',request.data,'from google drive')
      await deleteElement(request.data.type+'.json',{name:request.data.name,track:request.data.track},request.token);
    }
    if (request.type === 'saveStrategy')
    {
      console.log('adding',request.data,'to google drive')
      await localStrategiesToCloud({name:request.data.name,track:request.data.track,data:request.data.strategy,token:request.token});
     
    }
    if (request.type === 'syncData')
    {
      console.log('doing syncs')
      //console.log('adding',request.data,'to google drive')
      await fullSync(request.direction,request.token);
      
    }
    if (request.type === 'saveReport')
    {
      console.log('doing saveReport')
      //console.log('adding',request.data,'to google drive')
      await localReportsToCloud({token:request.token,data:request.data});
      
    }
    sendResponse({done:true})

 
  })();
     return true
      
  });
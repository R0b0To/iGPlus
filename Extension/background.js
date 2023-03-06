import { scriptDefaults, tabScripts } from './common/config.js';

let scriptRunning = 'none';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  let tab_status = changeInfo.status;
  const { pathname } = new URL(tab.url);

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
function injectStyles(tabId, styleFiles) {
  chrome.scripting.insertCSS({
    target: { tabId },
    files: styleFiles
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {


    tab_status = changeInfo.status;
    title = tab.url;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        tab_status = "complete";
    }


    if (tab_status === "complete") {

        if (title == "https://igpmanager.com/app/d=research") {

            inject2Script(tabId, "./research.js", "./localization.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/p=league&id=)/.test(title)) {

            injectScript(tabId, "./league.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=setup") {
            // console.log("Loading car setup");
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["style.css"],
            });
            injectScript(tabId, "./setups.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=race") {

            inject2Script(tabId, "highcharts.js","./race.js");
        }
        if (title == "https://igpmanager.com/app/p=transfers&tab=staff") { 
            injectScript(tabId, "./staffMarket.js");
        }
        if (title == "https://igpmanager.com/app/p=headquarters") {
            injectScript(tabId, "./headquarters.js");
        }
        if (title == "https://igpmanager.com/app/p=staff&tab=staff") {

            injectScript(tabId, "./staff.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=strategy") {

            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["style.css"],
            });

            inject2Script(tabId, "./strategy.js", "./localization.js");
        }

        if (/^(https:\/\/igpmanager\.com\/app\/d=result&id=)/.test(title)) {
            inject3Script(tabId, "./reports.js", "./purify.js","./localization.js");
        }

        if (title == "https://igpmanager.com/app/d=teamSettings") {

            injectScript(tabId, "./team_settings.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/d=resultDetail&id=)/.test(title)) {

            injectScript(tabId, "./raceResult.js");
        }


    }

});


chrome.runtime.onMessage.addListener(
    async function(f, sender, onSuccess) {


       /* chrome.tabs.executeScript({
            code: s // call the function from page source
          }, function(results) {
            console.log(results[0]);
          });

          return true;*/
        /*
        fetch(url)
            .then(response => response.text())
            .then(responseText => onSuccess(responseText))
        
        return true;  // Will respond asynchronously.*/
    }
);

function injectScript(tabId, scriptFile) {
    chrome.scripting.executeScript({
        target: { tabId: tabId},
        files: [scriptFile]
    });
}
function inject2Script(tabId, scriptFile, scriptFile2) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile, scriptFile2]
    });
}
function inject3Script(tabId, scriptFile, scriptFile2,scriptFile3) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile, scriptFile2,scriptFile3]
    });
}
function inject4Script(tabId, scriptFile, scriptFile2,scriptFile3,scriptFile4) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile, scriptFile2,scriptFile3,scriptFile4]
    });
}
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    tab_status = changeInfo.status;
    title = tab.url;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        tab_status = "complete";
    }


    if (tab_status === "complete") {

        script ={
            "hq": true,
            "league": true,
            "market": true,
            "overview": true,
            "reports": true,
            "research": true,
            "setup": true,
            "staff": true,
            "strategy": true,
            "review": true,
            "refresh": true,
            "marketDriver": true
          }
         chrome.storage.local.get({"script":script},function(list){
            enabled = list;
            
        if (/^(https:\/\/igpmanager\.com\/app\/p=home)/.test(title) && enabled.script.review) {

            injectScript(tabId, "./home.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/)/.test(title) && enabled.script.refresh) {
        injectScript(tabId, "./timerAlert.js");
    }
        if (title ==`https://igpmanager.com/app/&tab=news` && enabled.script.review) {

            injectScript(tabId, "./home.js");
        }
        if (title ==`https://igpmanager.com/app/p=login&tab=news`&& enabled.script.review) {

            injectScript(tabId, "./home.js");
        }
        if (title == "https://igpmanager.com/app/d=research" && enabled.script.research) {
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["researchStyle.css"],
            });

            inject2Script(tabId, "./research.js", "./localization.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/p=cars)/.test(title) && enabled.script.research) {

            injectScript(tabId, "./overview.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/p=league&id=)/.test(title) && enabled.script.league) {
            injectScript(tabId, "./league.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=setup" && enabled.script.setup) {
            // console.log("Loading car setup");
            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["style.css"],
            });
            injectScript(tabId, "./setups.js");
        }
        if (title == "https://igpmanager.com/app/p=transfers&tab=drivers" && enabled.script.marketDriver) {

            injectScript(tabId, "./driverMarket.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=race" && enabled.script.overview) {

            inject2Script(tabId, "highcharts.js","./race.js");
        }
        if (title == "https://igpmanager.com/app/p=transfers&tab=staff" && enabled.script.market) { 
            injectScript(tabId, "./staffMarket.js");
        }
        if (title == "https://igpmanager.com/app/p=headquarters" && enabled.script.hq) {
            injectScript(tabId, "./headquarters.js");
        }
        if (title == "https://igpmanager.com/app/p=staff&tab=staff" && enabled.script.staff) {

            injectScript(tabId, "./staff.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=strategy" && enabled.script.strategy) {

            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["style.css"],
            });

            inject2Script(tabId, "./strategy.js", "./localization.js");
        }

        if (/^(https:\/\/igpmanager\.com\/app\/d=result&id=)/.test(title) && enabled.script.reports) {
            inject3Script(tabId, "./reports.js", "./purify.js","./localization.js");
        }

        if (title == "https://igpmanager.com/app/d=teamSettings") {

            injectScript(tabId, "./team_settings.js");
        }
        if (/^(https:\/\/igpmanager\.com\/app\/d=resultDetail&id=)/.test(title)) {

            injectScript(tabId, "./raceResult.js");
        }
        }); 



    }

});


chrome.runtime.onMessage.addListener(
    async function(f, sender, onSuccess) {
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
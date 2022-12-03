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
            injectScript(tabId, "./setups.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=race") {

            injectScript(tabId, "./race.js");
        }
        if (title == "https://igpmanager.com/app/p=headquarters") {
            injectScript(tabId, "./headquarters.js");
        }
        if (title == "https://igpmanager.com/app/p=staff&tab=staff") {

            inject2Script(tabId, "./staff.js", "./purify.js");
        }
        if (title == "https://igpmanager.com/app/p=race&tab=strategy") {

            chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ["style.css"],
            });

            inject2Script(tabId, "./strategy.js", "./localization.js");
        }

        if (/^(https:\/\/igpmanager\.com\/app\/d=result&id=)/.test(title)) {
            inject2Script(tabId, "./reports.js", "./purify.js");
        }

        if (title == "https://igpmanager.com/app/d=teamSettings") {

            injectScript(tabId, "./team_settings.js");
        }

    }

});



function injectScript(tabId, scriptFile) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile]
    });
}
function inject2Script(tabId, scriptFile, scriptFile2) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [scriptFile, scriptFile2]
    });
}


      

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {


    tab_status = changeInfo.status;
    title = tab.url;
  

    

    
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    {
        tab_status = "complete";
    }
    
    

if(tab_status === "complete"){


    if(title == "https://igpmanager.com/app/d=research"){
       
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./research.js","./localization.js"]
        })
         .then(()=> {
                //console.log("research inject");
         })
         .catch(err => console.log(err));
    }
    if(/^(https:\/\/igpmanager\.com\/app\/p=league&id=)/.test(title)){
       
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./league.js"]
        })
         .then(()=> {
                //console.log("league inject");
         })
         .catch(err => console.log(err));
    }
    if(title == "https://igpmanager.com/app/p=race&tab=setup"){
       // console.log("Loading car setup");
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./setups.js"]
        })
         .then(()=> {
                //console.log("car setup");
         })
         .catch(err => console.log(err));
    }
    if(title == "https://igpmanager.com/app/p=race&tab=strategy"){
       // console.log("Loading car setup");
       chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["style.css"],});



        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./strategy.js","./localization.js"]
        })
         .then(()=> {
                //console.log("strategy");
         })
         .catch(err => console.log(err));
    }
    
  
 if(/^(https:\/\/igpmanager\.com\/app\/d=result&id=)/.test(title))
    {
       // console.log("starting extraction");
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./reports.js","./purify.js"]
        })
         .then(()=> {
                //console.log("hello");
         })
         .catch(err => console.log(err));
    }

    if(title == "https://igpmanager.com/app/d=teamSettings")
    {
       // console.log("starting race report extraction");
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./team_settings.js"]
        })
         .then(()=> {
                //console.log("hello");
         })
         .catch(err => console.log(err));
    }

}
   
});


  
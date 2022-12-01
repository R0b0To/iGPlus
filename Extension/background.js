
      

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
              
         })
         .catch(err => console.log(err));
    }
    if(/^(https:\/\/igpmanager\.com\/app\/p=league&id=)/.test(title)){
       
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./league.js"]
        })
         .then(()=> {
               
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
    if(title == "https://igpmanager.com/app/p=race&tab=race"){
      
         chrome.scripting.executeScript({
             target: { tabId: tabId },
             files: ["./race.js"]
         })
          .then(()=> {
               
          })
          .catch(err => console.log(err));
     }
     if(title == "https://igpmanager.com/app/p=headquarters"){
        
         chrome.scripting.executeScript({
             target: { tabId: tabId },
             files: ["./headquarters.js"]
         })
          .then(()=> {
                 
          })
          .catch(err => console.log(err));
     }
     if(title == "https://igpmanager.com/app/p=staff&tab=staff"){
        
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./staff.js","./purify.js"]
        })
         .then(()=> {
                
         })
         .catch(err => console.log(err));
    }
    if(title == "https://igpmanager.com/app/p=race&tab=strategy"){
      
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
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./reports.js","./purify.js"]
        })
         .then(()=> {
               
         })
         .catch(err => console.log(err));
    }

    if(title == "https://igpmanager.com/app/d=teamSettings")
    {
       
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./team_settings.js"]
        })
         .then(()=> {
                
         })
         .catch(err => console.log(err));
    }

}
   
});


  
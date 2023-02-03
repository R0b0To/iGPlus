raceSign = document.getElementById("race");
overSign = document.getElementById("over");
link = document.getElementById("link");
sname = document.getElementById("sname");
trackName = document.getElementById("track");


league = document.getElementById("league");
league.addEventListener("click",function(){
  scriptCheck("league",this.checked);
});



function scriptCheck(scriptName,status)
{
  chrome.storage.local.get({"script":""},function(data){
    data.script[scriptName] = status;
    chrome.storage.local.set({"script":data.script});
   });  
}


research = document.getElementById("research");
research.addEventListener("click",function(){
  scriptCheck("research",this.checked);
});

staff = document.getElementById("staff");
staff.addEventListener("click",function(){
  scriptCheck("staff",this.checked);
});

market = document.getElementById("market");
market.addEventListener("click",function(){
  scriptCheck("market",this.checked);
});

strategy = document.getElementById("strategy");
strategy.addEventListener("click",function(){
  scriptCheck("strategy",this.checked);
});

setup = document.getElementById("setup");
setup.addEventListener("click",function(){
  scriptCheck("setup",this.checked);
});

overview = document.getElementById("overview");
overview.addEventListener("click",function(){
  scriptCheck("overview",this.checked);
});

hq = document.getElementById("hq");
hq.addEventListener("click",function(){
  scriptCheck("hq",this.checked);
});

reports = document.getElementById("reports");
reports.addEventListener("click",function(){
  scriptCheck("reports",this.checked);
});

refresh = document.getElementById("refresh");
refresh.addEventListener("click",function(){
  scriptCheck("refresh",this.checked);
});
review = document.getElementById("review");
review.addEventListener("click",function(){
  scriptCheck("review",this.checked);
});

exportSave = document.getElementById("exportSave");



link.addEventListener("change",testLink);
sname.addEventListener("change",sName);
trackName.addEventListener("change",sTrack);
function sName()
{
  sheetName = sname.value;
  chrome.storage.local.set({"gLinkName": sheetName});
}
function sTrack()
{
  lowName =trackName.value.toLowerCase();
  //console.log("saving "+trackNameT);
  chrome.storage.local.set({"gTrack": lowName});
}

function testLink()
{
  url = link.value;

  if(url=="")
  {
    link.className ="";
    chrome.storage.local.set({"gLink": url});
  }
  else{
     fetch(url)
  .then(res => {
    if (res.ok) {
      link.className = "valid";
      console.log(res);


      chrome.storage.local.set({"gLink": url});


    }
  })
  .then(rep => {console.log(rep)})
  .catch((error) => {
    console.log('invalid link');
    link.className = "invalid";
  });
  }
}

function save_options() {
    var lang = document.getElementById('language').value;
    chrome.storage.local.set({language: lang});
    //chrome.storage.local.set({sign: ,});
    restore_options();
  }

function restore_options() {
    // Use default value language = 'eng'
    chrome.storage.local.get({
      language: 'eng',
    }, function(items) {
      document.getElementById('language').value = items.language;
      document.getElementById("langTitle").childNodes[0].textContent = lang[items.language].languageText+": ";
      document.getElementById('signOpt').textContent = lang[items.language].signOption;
      raceSign.nextElementSibling.textContent = lang[items.language].RaceReport;
      overSign.nextElementSibling.textContent = lang[items.language].StartOvertakes;
    });
    chrome.storage.local.get("raceSign",function(data){
      raceSign.checked = data.raceSign;
    });
    chrome.storage.local.get("overSign",function(data){
      overSign.checked = data.overSign;
    });

    chrome.storage.local.get("gLink",function(data){
      if(typeof data.gLink!="undefined")
      link.value = data.gLink;
    });
    chrome.storage.local.get("gLinkName",function(data){
      if(typeof data.gLinkName!="undefined")
      sname.value = data.gLinkName;
    });
    chrome.storage.local.get("gTrack",function(data){
      if(typeof data.gTrack!="undefined")
      trackName.value = data.gTrack;
    });
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
      "refresh": true
    }
    chrome.storage.local.get({"script":script},function(data){
      Object.keys(script).forEach(item => {
         document.getElementById(item).checked = data.script[item];
      });
      chrome.storage.local.set({"script":data.script});
     }); 

     chrome.storage.local.get("save",function(d){
  
      if(typeof d.save==="undefined")
      {
       
        
      }else{
        defaultOption = document.createElement("option");
        defaultOption.textContent = "select save";
        defaultOption.value = 0;
        exportSave.append(defaultOption);
        Object.keys(d.save).forEach(item =>{
          if(Object.keys(d.save[item]).length>0)
          {
          option = document.createElement("option");
          option.textContent = item;
          option.value = item;
          exportSave.append(option);
          }
          
        });

        exportSave.addEventListener("change",function(){
          //console.log("changing");
          try {
          select = document.createElement('select');
          select.id = "trackSave";
          
          if(this.value!=0){
             Object.keys(d.save[this.value]).forEach(item =>{
            option = document.createElement('option');
           // console.log(d.save[this.value][item]);
            
          
            option.textContent = getStrategyString(d.save[this.value][item]);
            option.value = item;
            select.append(option);
          });
          if(document.getElementById("trackSave")!=null)
          {
            document.getElementById("trackSave").remove();
            document.getElementById("download").remove();
          }
          if(Object.keys(d.save[this.value]).length>0)
          {
 exportSave.parentElement.append(select);

          dButton = document.createElement('div');
          dButton.id = "download";
          dButton.className = "btn fa fa-download";
          exportSave.parentElement.append(dButton);

          }
         
          }
          else{
            document.getElementById("trackSave").remove();
            document.getElementById("download").remove();
           
          }
         } catch (error) {
          document.getElementById("trackSave").remove();
          document.getElementById("download").remove();
          } 
          
          

          
         
          
          dButton.addEventListener('click',function(){
    
            function downloadFile(data,download_name){
              var blob = new Blob([data], { type: 'application/json;charset=utf-8;' });
              if (navigator.msSaveBlob) { // IE 10+
                  navigator.msSaveBlob(blob, "test");
              } else {
                  var link = document.createElement("a");
                  if (link.download !== undefined) { // feature detection
                      // chromes that support HTML5 download attribute
                      var url = URL.createObjectURL(blob);
                      link.setAttribute("href", url);
                      link.setAttribute("download", download_name);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                  }
              }
            }
            track = document.getElementById("exportSave").value;
            saveID = document.getElementById("trackSave").value;
            saved = {[track]:{[saveID]:d.save[track][saveID]}};
            saveJSON = JSON.stringify(saved);
            downloadFile(saveJSON,"save");
        
          });
      
        });
      }
      
     });

  }
function getStrategyString(saveObject){
  string="";
  Object.keys(saveObject).forEach(stint =>{
    string+=`${saveObject[stint].laps}${saveObject[stint].tyre.slice(3)} `;
  });
  return string;
}
  
importSave = document.getElementById("myFile");
importSave.addEventListener("change",async function(){
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(this.files[0]);
  async function onReaderLoad(event){
  try {  

  var obj = JSON.parse(event.target.result);
  
  track = Object.keys(obj)[0];
  hashID = Object.keys(obj[track])[0];
  validTrack = ['be','it','sg','my','jp','us','mx','br','ae','bh','eu','de','es','ru','tr','au','at','hu','gb','ca','az','mc','cn','fr'];
  if(validTrack.includes(track)){
  chrome.storage.local.get("save",function(data){

  if(typeof data.save==="undefined")
  {

  chrome.storage.local.set({"save":obj});
  }
  else
  {
    if(typeof data.save[track]==="undefined")
    {
       data.save[track] = {[hashID]:obj[track][hashID]};
    }
    else
        data.save[track][hashID] = obj[track][hashID];

    chrome.storage.local.set({"save":data.save});
    importSave.className = "valid upl";
  }
    
  });
  
  }
  else{
    console.log("invalid track");
    importSave.className = "invalid upl";
  }
  
   
  } catch (error) {
    console.log("invalid");
    importSave.className = "invalid upl";
  }
   
}
 
});
languageSelection = document.getElementById("language");
languageSelection.addEventListener("change",save_options);

raceSign.addEventListener("click",function(){
  var checkStatus = this.checked;
  chrome.storage.local.set({"raceSign": checkStatus});
});

overSign.addEventListener("click",function(){
  var checkStatus = this.checked;
  chrome.storage.local.set({"overSign": checkStatus});
});
languageSelection = document.getElementById("language");
document.addEventListener('DOMContentLoaded', restore_options);


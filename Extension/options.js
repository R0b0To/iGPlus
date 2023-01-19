raceSign = document.getElementById("race");
overSign = document.getElementById("over");
link = document.getElementById("link");
sname = document.getElementById("sname");
trackName = document.getElementById("track");

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

  }

  

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

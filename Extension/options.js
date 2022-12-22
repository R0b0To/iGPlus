raceSign = document.getElementById("race");
overSign = document.getElementById("over");

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

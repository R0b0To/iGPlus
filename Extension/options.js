
function save_options() {
    var lang = document.getElementById('language').value;
    chrome.storage.local.set({
      language: lang,
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }

function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get({
      language: 'English',
    }, function(items) {
      document.getElementById('language').value = items.language;
      document.getElementById("langTitle").textContent = lang[items.language].languageText;
      document.getElementById("save").textContent = lang[items.language].saveText;
    });
  }

  


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
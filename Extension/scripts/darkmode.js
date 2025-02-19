function injectStyles(rule) {
var darkmode = document.createElement("div");
darkmode.id = "igplus_darkmode";
darkmode.innerHTML = '<style>' + rule + '</style>';
   document.body.append(darkmode);   
}
if(!document.getElementById('igplus_darkmode'))
{
  const file = chrome.runtime.getURL('css/darkmode.css');
  fetch(file)
    .then(response => response.text())
    .then(cssContent => {
      injectStyles(cssContent)
    })
    .catch(error => {
      console.error('Error fetching file:', error);
    });
}


    
  
function injectStyles(rule) {
var darkmode = document.createElement("div");
darkmode.id = "igplus_darkmode";

darkmode.innerHTML = '<style>' + rule + '</style>';

if(!document.getElementById('igplus_darkmode'))
{
   document.body.append(darkmode);   
}

}
const file = chrome.runtime.getURL('common/darkmode.css');
fetch(file)
  .then(response => response.text())
  .then(cssContent => {
    // Do something with the CSS content
    injectStyles(cssContent)
  })
  .catch(error => {
    console.error('Error fetching file:', error);
  });

    
  
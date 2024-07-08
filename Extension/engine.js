
    try {
      const engine = document.getElementById('brandUpgrade');
      document.getElementById('brandUpgrade').addEventListener('click',engineHandler)
    } catch (err) {
      //console.log(err);
    }
  
//handle the dialog container of the engine. Every time user changes circuit the container form is created anew. 
//mutation observer call the swapMap function when that happens
function engineHandler(){
  if (document.getElementById('customMap') == null) {
    const targetNode = document.getElementById('editTrack');
    const config = { childList: true };
    const callback = function(mutationsList, observer) {
      if(mutationsList[0].target.id == "editTrack"){
        swapMap();
        showBarValues()
      }
        
    };
    const observer = new MutationObserver(callback);
    showBarValues()
    swapMap();
    observer.observe(targetNode, config);
    
  }

}

function swapMap()
{
circuit_code = document.querySelector('[id=editTrack] .flag').classList[1].split('-')[1];
const image = document.querySelector('[id=editTrack] img:last-child:not(.flag)');
image.id = "customMap";
document.getElementById('igplus_darkmode') ? image.src = chrome.runtime.getURL(`images/circuits/${circuit_code}_dark.png`) : image.src = chrome.runtime.getURL(`images/circuits/${circuit_code}.png`);
image.style.width = '90%';
image.style.margin = 'auto';
}
function showBarValues() {
  function createValueSpan(value) {
    const barValue = document.createElement('span');
    barValue.classList.add('showStat');
    barValue.textContent = value;
    return barValue;
  }

  if (document.getElementsByClassName('showStat').length == 0) {
    const parameterBars = document.querySelectorAll('[id=editTrack] .ratingBar');
    parameterBars.forEach((bar) => {
      bar.classList.add('statBarWithValue');
      bar.appendChild(createValueSpan(bar.childNodes[0].style.width));
    });
  }
}
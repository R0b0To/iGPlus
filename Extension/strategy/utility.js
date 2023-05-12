function createSlider(node,min,max) {
  const settingValueDiv = node.previousElementSibling.childNodes[1];
  settingValueDiv.classList.remove('green');

  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('sliderContainer');
  const sliderLabelTrack = document.createElement('div');
  sliderLabelTrack.classList.add('track');
  sliderContainer.append(sliderLabelTrack);
  const slider = document.createElement('input');
  slider.className = 'sliderX';
  slider.type = 'range';
  slider.max = max;
  slider.min = min;
  slider.value = settingValueDiv.textContent;

  function getRangePercent(sliderE){
    return (sliderE.value - sliderE.min) / (sliderE.max - sliderE.min) * 100;
  }
  slider.addEventListener('input', function () {
    sliderLabelTrack.append(settingValueDiv);
    settingValueDiv.textContent = this.value;
    settingValueDiv.classList.add('slider-label');
    settingValueDiv.style.left = getRangePercent(slider) + '%';
  });

  slider.addEventListener('change', function () {
    settingValueDiv.classList.remove('slider-label');
    sliderContainer.classList.remove('visible');
    slider.parentElement.parentElement.append(settingValueDiv);
    slider.parentElement.parentElement.nextElementSibling.value = slider.value;
    if(slider.value == 0)
    {
      const driverStrategyId = this.closest('form').id;
      document.getElementsByName('fuel1')[driverStrategyId[1] - 1].value = 0;
    }
  });

  settingValueDiv.addEventListener('click', function () {
    if (!sliderContainer.classList.contains('visible')) {
      sliderLabelTrack.append(settingValueDiv);
      sliderContainer.classList.add('visible');
      settingValueDiv.classList.add('slider-label');
      settingValueDiv.style.left = getRangePercent(slider) + '%';
    } else {
      sliderContainer.classList.remove('visible');
      settingValueDiv.classList.remove('slider-label');
      slider.parentElement.parentElement.append(settingValueDiv);
    }
  });

  sliderContainer.append(slider);
  settingValueDiv.classList.add('withSlider');

  node.previousElementSibling.prepend(sliderContainer);


}
function hashCode(string){
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

async function strategyPreview(strategies,car_info){
  const container = document.createElement('tbody');
  container.id = 'saveList';
  container.classList.add('saveListContainerPreview');

  for (const id in strategies) {
    container.appendChild(await createPreview(strategies[id],id,car_info));
  }
  return container;
}
async function createPreview(strategy,id,car_info){
  try {
    const {track_info, multipliers} = await import(chrome.runtime.getURL('/strategy/const.js'));
    const {get_wear } = await import(chrome.runtime.getURL('strategy/strategyMath.js'));
    let TRACK_INFO = track_info[strategy.track];

    const rowContainer = document.createElement('tr');
    rowContainer.id = id;
    rowContainer.classList.add('saveRow');
    const stintsContainer = document.createElement('td');
    stintsContainer.classList.add('stintsContainer');
    const percentageTotalLaps = (((strategy.laps.doing / strategy.laps.total) * 100));
    stintsContainer.style.width = `${percentageTotalLaps}%`;

    let zindex = 99;
    for (const key in strategy.stints) {
      if(!isNaN(key))
      {
        const tyre = document.createElement('div');
        const laps = document.createElement('div');
        tyre.textContent = strategy.stints[key].laps;
        tyre.classList.add('loadStint','preview-tyre','plus-' + strategy.stints[key].tyre);
        laps.classList.add('loadStint','preview-laps','plus-' + strategy.stints[key].tyre);
        laps.style.width = `${strategy.stints[key].laps / strategy.laps.total * 100}%`;
        const wearText = document.createElement('span');
        wearText.classList.add('wearText');
        wearText.textContent = `${Math.round(get_wear(strategy.stints[key].tyre.split('-')[1],strategy.stints[key].laps,TRACK_INFO,car_info,multipliers[strategy.length]))}%`;
        laps.append(wearText);

        laps.style.zIndex = zindex;
        zindex--;
        tyre.style.zIndex = zindex;
        zindex--;
        stintsContainer.append(tyre,laps);

      }
    }
    rowContainer.append(stintsContainer,createDeleteButton());
    //console.log(strategyContainer);
    return rowContainer;
  } catch (error) {
    alert('The format of saves has been changed in this version, delete all saves to continue using this feature');
  }

}
function createDownloadButton()
{
  const down_btn = document.createElement('td');
  down_btn.innerHTML = `<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <title/><g id="Complete"><g id="download"><g> <path d="M3,12.3v7a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2v-7" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                  <g> <polyline data-name="Right" fill="none" id="Right-2" points="7.9 12.3 12 16.3 16.1 12.3" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                  <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="2.7" y2="14.2"/></g></g></g></g></svg>`;
  down_btn.classList.add('donwload-button');
  return down_btn;
}
function createDeleteButton(){
  const deleteB = document.createElement('td');
  deleteB.innerHTML = `<svg style="color:white!important";
width="24"
height="24"
viewBox="0 0 24 24"
fill="none"
xmlns="http://www.w3.org/2000/svg"
>
<path
  fill-rule="evenodd"
  clip-rule="evenodd"
  d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z"
  fill="currentColor"
/>
<path d="M9 9H11V17H9V9Z" fill="currentColor" />
<path d="M13 9H15V17H13V9Z" fill="currentColor" />
</svg>`;
  deleteB.classList.add('trash');
  return deleteB;
}
function simulateClick(node){
  class CustomEvent extends MouseEvent {
    constructor(eventName, options) {
      super(eventName, options);
      // Add custom properties to the event instance
      this.autopress = options.autopress || null;
    }
  }
  const touchstart = new CustomEvent('touchstart', {
    'view': window,
    'bubbles': true,
    'cancelable': true,
    'autopress':true
  });
  const touchend = new CustomEvent('touchend', {
    'view': window,
    'bubbles': true,
    'cancelable': true,
    'autopress':true
  });
  const observerConfig = {
    subtree: true,
    childList: true
  };


  return new Promise ((res)=>{

    if(node.classList.contains('minus')){
      const observer = new MutationObserver(mutationsList => {
        observer.disconnect();
        res(true);
      });
      observer.observe(node.parentElement.querySelector('.num'), observerConfig);
    }

    node.dispatchEvent(touchstart);
    node.dispatchEvent(touchend);


    if(node.classList.contains('plus'))
      res(true);

  });


}

export{
  createSlider,
  hashCode,
  strategyPreview,
  createDownloadButton,
  createDeleteButton,
  simulateClick
};
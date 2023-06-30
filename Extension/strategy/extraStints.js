let raceParams = {}
async function addStintEventHandler(driver_pit_div,params) {
 
  raceParams = params;
  const pits = {
    current: Number(driver_pit_div.querySelector('.num').childNodes[0].textContent),
    previous: Number(driver_pit_div.querySelector('.num').childNodes[0].textContent)
  };
  const minus_btn = driver_pit_div.querySelector('.minus');
  const plus_btn = driver_pit_div.querySelector('.plus');

  //when page is first loaded
  if(pits.current == 4){
    plus_btn.setAttribute('extra',0);
    plus_btn.classList.add('extraStint');
  }

  const observer = new MutationObserver(async mutationsList => {
    if(mutationsList[0].target.classList.contains('num')){
      pits.previous = pits.current;
      pits.current = Number(mutationsList[0].addedNodes[0].textContent);
      if(pits.current > 4 || pits.current == 1){
        minus_btn.classList.add('disabled');
        minus_btn.classList.add('extraStint');
        plus_btn.classList.add('extraStint');
        const warning = await addAlert()
        if(!plus_btn.closest('form').getElementsByClassName('alertExtra')[0])
          plus_btn.closest('form').prepend(warning);
          
      }else{
        minus_btn.classList.remove('disabled');
        minus_btn.classList.remove('extraStint');
      }

      if(pits.current == 4){
        plus_btn.setAttribute('extra',0);
        plus_btn.classList.add('extraStint');
        plus_btn.closest('form').getElementsByClassName('alertExtra')[0]?.remove();
      }
      if(pits.current < 4){
        plus_btn.closest('form').getElementsByClassName('alertExtra')[0]?.remove();
        plus_btn.setAttribute('extra',-1);
        plus_btn.classList.remove('extraStint');
        minus_btn.classList.remove('extraStint');
      }


    }


    // (pits.current > 4) ?  plus_btn.classList.add('disabled') : plus_btn.classList.remove('disabled');
  });

  // Configure and start the observer
  const observerConfig = {
    subtree: true,
    childList: true
  };

  function increasePitNumber(e) {

    if (e.button == 50 || e.type == 'pointerdown') {
      if(pits.current >= 4 && pits.previous >= 3 && pits.current < 6 && plus_btn.getAttribute('extra') == 0)
      {
        addExtraStint(driver_pit_div);
      }

    }


  }
  function decreasePitNumber(e){

    if (e.button == 50 || e.type == 'pointerdown') {
      if(pits.current > 4 && pits.previous < 7)
      {
        //waiting the igp event listener to be done otherwise the extra stint get removed then pit number decreased by the game minus button event
        setTimeout(()=>{removeExtraStint(driver_pit_div);},1);
      }
    }
  }
  //this touch event is accepted only by the custom mouse event. User interacion is ignored
  minus_btn.addEventListener('touchstart', decreasePitNumber);
  plus_btn.addEventListener('touchstart', increasePitNumber);

  minus_btn.addEventListener('pointerdown', decreasePitNumber);
  plus_btn.addEventListener('pointerdown', increasePitNumber);

  observer.observe(driver_pit_div, observerConfig);
}


function removeExtraStint(driver_pit_div) {
  if((driver_pit_div.querySelector('.num').childNodes[0].textContent) > 4)
  {
    const lastPit = driver_pit_div.closest('form').querySelectorAll('th:last-child,td:last-child:not(.trash):not([colspan])');
    for(const e of lastPit)
      e.remove();

    const pit_number = (parseInt(lastPit[0].textContent.match(/\d+/)[0]) - 1);
    driver_pit_div.closest('form').querySelector('[colspan]').colSpan--;
    replacePitNumber(driver_pit_div,pit_number);
  }

}

function addExtraStint(driver_pit_div){
  return new Promise((resolve, reject) => {
    //nodelist
    const lastPit = driver_pit_div.closest('form').querySelectorAll('th:last-child,td:last-child:not(.trash):not([colspan])');
    const clonedColumn = Array.from(lastPit).map(e => {  return {node:e.cloneNode(true),parent:e.parentElement};});
   // console.log(clonedColumn)
    const pit_number = (parseInt(lastPit[0].textContent.match(/\d+/)[0]) + 1);
    replacePitNumber(driver_pit_div,pit_number);
    clonedColumn[0].node.textContent = clonedColumn[0].node.textContent.replace(/\d+/, pit_number);
    clonedColumn[1].node.querySelector('input').name = 'tyre' + (pit_number + 1);
    clonedColumn[1].node.addEventListener('click',openTyreDialog);
    clonedColumn[2].node.querySelector('[name^=fuel]').name = 'fuel' + (pit_number + 1);
    clonedColumn[2].node.querySelector('[name^=laps]').name = 'laps' + (pit_number + 1);
    clonedColumn[4].node.querySelector('select').selectedIndex = lastPit[4].querySelector('select').selectedIndex;
    clonedColumn[4].node.querySelector('select').addEventListener('change',updateFuel);
    for(const node of clonedColumn)
      node.parent.append(node.node);
    driver_pit_div.closest('form').querySelector('[colspan]').colSpan++;

    resolve(true);
  });

}

    //update stint tyre wear the update fuel
    async function update_stint(s)
    {
      const {get_wear } = await import(chrome.runtime.getURL('strategy/strategyMath.js'));
      const stint = s.cellIndex;
      const tbody = s.closest('tbody');
      const wearRow = tbody.querySelector('[wearevent]');
      const tyreRow = tbody.querySelector('.tyre');
      const tyre = tyreRow.cells[stint].className.slice(3);
      const laps = s.textContent;
      const push = tbody.querySelector('[pushevent]').cells[stint].children[0].selectedIndex;
      


      raceParams.CAR_ECONOMY.push = push;

      


      wearRow.cells[stint].textContent = get_wear(tyre,laps ,raceParams.TRACK_INFO, raceParams.CAR_ECONOMY, raceParams.multiplier);
      updateFuel(tbody);
    }
async function updateFuel(tbod)
{
  const TRACK_CODE = document.querySelector('.flag').className.slice(-2) ?? 'au';
  const { fuel_calc } = await import(chrome.runtime.getURL('strategy/strategyMath.js'));
  const {track_info } = await import(chrome.runtime.getURL('/strategy/const.js'));
  let TRACK_INFO = track_info[TRACK_CODE];
  //this function is called either directly or by change event of the push select.
  if(tbod instanceof Event)
  {
    const index = tbod.target.parentElement.cellIndex;
    tbod = tbod.target.closest('tbody');
    raceParams.CAR_ECONOMY.push = tbod.querySelector('[pushevent]').cells[index].children[0].selectedIndex;
    update_stint(tbod.querySelector('.fuel').cells[index]);
  }
    

  const pushRow = tbod.querySelector('[pushevent]');
  const tyreRow = tbod.querySelector('.tyre');
  const lapsRow = tbod.querySelector('.fuel');
  const stintNumber = tyreRow.querySelectorAll('[style*=\'visibility: visible\']').length;
  const ecoFuel = fuel_calc(parseInt(document.getElementsByClassName('PLFE')[0].value));
  let totalfuel = 0;
  let totalLaps = 0;
  for(var i = 1 ;i < stintNumber ;i++)
  {
    let push = parseFloat(pushRow.cells[i].childNodes[0].value);
    let laps = lapsRow.cells[i].textContent;
    totalLaps += parseInt(laps);
    const fuellap = ((ecoFuel + push) * TRACK_INFO.length);
    totalfuel += parseInt(laps) * fuellap;
  }
  const fuelEle = tbod.closest('form').getElementsByClassName('fuelEst')[0];
  const lapsTextNode = tbod.querySelector('.robotoBold');
  lapsTextNode.textContent = totalLaps;
  const raceLapsText = Number(lapsTextNode.nextSibling.textContent.split('/')[1]);
  lapsTextNode.classList.remove('block-orange');
  if(totalLaps > raceLapsText){
    lapsTextNode.classList.add('block-orange');
    lapsTextNode.classList.remove('block-grey');
  }
  if(totalLaps == raceLapsText)
    lapsTextNode.classList.remove('block-red');



  if(fuelEle != null)
    fuelEle.textContent = `Fuel:${totalfuel.toFixed(2)}`;
}
//replace pit stop text. Observer will know about the change.
function replacePitNumber(div,number)
{
  const driver_form = div.closest('form');
  driver_form.querySelector('.num').replaceChild(document.createTextNode(number),driver_form.querySelector('.num').childNodes[0]);
}
async function addAlert(){
  const {language}  = await chrome.storage.local.get({ language: 'en' });
  const {language: i18n}  = await import(chrome.runtime.getURL('common/localization.js'));
  const alertContainer = document.createElement('div');
  alertContainer.classList.add('alertExtra');
  const alertText = document.createElement('span');
  alertContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M19.64 16.36L11.53 2.3A1.85 1.85 0 0 0 10 1.21 1.85 1.85 0 0 0 8.48 2.3L.36 16.36C-.48 17.81.21 19 1.88 19h16.24c1.67 0 2.36-1.19 1.52-2.64zM11 16H9v-2h2zm0-4H9V6h2z"/></svg>';
  alertText.textContent = i18n[language].pitAlert;
   alertContainer.append(alertText);
  return alertContainer;
}

function openTyreDialog(){
  const tyre = this.className;
  const stintId = this.lastChild.name.match(/\d+/)[0];
  const fuelL = this.parentElement.parentElement.childNodes[3].childNodes[stintId].childNodes[1].value;
  const laps = this.parentElement.parentElement.childNodes[3].childNodes[stintId].textContent;
  this.parentElement.cells[5].click(); //last valid stint
  const tyreD = document.getElementById('tyreSelect').childNodes[0].childNodes[0];
  document.getElementsByName('stintId')[0].value = stintId;
  const dialog = document.getElementById('stintDialog');
  dialog.childNodes[0].childNodes[0].textContent = 'Pit ' + (stintId - 1); // name of dialog stint

  if(dialog.querySelector('.hide'))
    dialog.querySelector('.num').textContent = laps;
  else
    dialog.querySelector('.num').textContent = fuelL;


  var event = new MouseEvent('mousedown', {
    'view': window,
    'bubbles': true,
    'cancelable': true,

  });
  var event2 = new MouseEvent('mouseup', {
    'view': window,
    'bubbles': true,
    'cancelable': true,

  });
    //simulate changing fuel to update values
  const minus = dialog.querySelector('.minus');
  const plus = dialog.querySelector('.plus');
  minus.dispatchEvent(event);
  minus.dispatchEvent(event2);
  plus.dispatchEvent(event);
  plus.dispatchEvent(event2);

  for(var i = 0 ; i < 6 ; i++)
  {
    if(tyreD.childNodes[i].id != tyre)
    {
      tyreD.childNodes[i].className = 'inactive';
    }else
      tyreD.childNodes[i].className = '';
  }



}
export {
  addStintEventHandler,
  removeExtraStint,
  addExtraStint,
  replacePitNumber,
  updateFuel,
  update_stint
};
function addStintEventHandler(driver_pit_div) {
  const pits = {
    current: Number(driver_pit_div.querySelector('.num').childNodes[0].textContent),
    previous: Number(driver_pit_div.querySelector('.num').childNodes[0].textContent)
  };
const minus_btn = driver_pit_div.querySelector('.minus');
  const plus_btn = driver_pit_div.querySelector('.plus');
  if(pits.current == 4){
    plus_btn.setAttribute('extra',0);
    plus_btn.classList.add('extraStint');
  }


  // Create a new MutationObserver instance with a callback function
  const observer = new MutationObserver(mutationsList => {
    //console.log('mutation',mutationsList[0])

    pits.previous = pits.current;
    pits.current = Number(mutationsList[0].addedNodes[0].textContent);
    if(pits.current > 4 || pits.current == 1){
      minus_btn.classList.add('disabled');
      minus_btn.classList.add('extraStint');
      plus_btn.classList.add('extraStint');
    }else{
      minus_btn.classList.remove('disabled');
      minus_btn.classList.remove('extraStint');
    }

    if(pits.current == 4){
      plus_btn.setAttribute('extra',0);
      plus_btn.classList.add('extraStint');
    }
    if(pits.current < 4){
      plus_btn.setAttribute('extra',-1);
      plus_btn.classList.remove('extraStint');
      minus_btn.classList.remove('extraStint');
    }

    // (pits.current > 4) ?  plus_btn.classList.add('disabled') : plus_btn.classList.remove('disabled');
  });

  // Configure and start the observer
  const observerConfig = {
    subtree: true,
    childList: true
  };

  function increasePitNumber(e) {

    if (e.autopress || e.type == 'pointerdown') {
      if(pits.current >= 4 && pits.previous >= 3 && pits.current < 6 && plus_btn.getAttribute('extra') == 0)
      {
        addExtraStint(driver_pit_div);
      }

    }


  }
  function decreasePitNumber(e){

    if (e.autopress || e.type == 'pointerdown') {
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

    const pit_number = (parseInt(lastPit[0].textContent.match(/\d+/)[0]) + 1);
    replacePitNumber(driver_pit_div,pit_number);
    clonedColumn[0].node.textContent = clonedColumn[0].node.textContent.replace(/\d+/, pit_number);
    clonedColumn[1].node.querySelector('input').name = 'tyre' + (pit_number + 1);
    clonedColumn[1].node.addEventListener('click',openTyreDialog);
    clonedColumn[2].node.querySelector('[name^=fuel]').name = 'fuel' + (pit_number + 1);
    clonedColumn[2].node.querySelector('[name^=laps]').name = 'laps' + (pit_number + 1);
    clonedColumn[3].node.querySelector('select').selectedIndex = lastPit[3].querySelector('select').selectedIndex;

    for(const node of clonedColumn)
      node.parent.append(node.node);
    driver_pit_div.closest('form').querySelector('[colspan]').colSpan++;

    resolve(true)
  });

}
//replace pit stop text. Observer will know about the change.
function replacePitNumber(div,number)
{
  const driver_form = div.closest('form');
  driver_form.querySelector('.num').replaceChild(document.createTextNode(number),driver_form.querySelector('.num').childNodes[0]);
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
  replacePitNumber
};
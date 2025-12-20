
getWearFn = null;
getFuelFn = null;
readAttempts = 3;
if (!window.__strategyInit) {
 window.__strategyInit = true;
 initEvents();
}

if (!window.__igplus_strategy_state__) {
  window.__igplus_strategy_state__ = {
    TRACK_INFO: null,
    CAR_ECONOMY: null,
    CAR_STRATEGY:[],
    RULES: null
  };
}


async function strategy(){

    prepareStrategyContainer(1)
    // 1. Start all imports at the same time (no await here yet)
const fetcherPromise = import(chrome.runtime.getURL('common/fetcher.js'));
const mathPromise = import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
const constPromise = import(chrome.runtime.getURL('scripts/strategy/const.js'));
const utilityPromise = import(chrome.runtime.getURL('scripts/strategy/utility.js'));

// 2. Wait for all of them to finish together
const [fetcher, constants, utility] = await Promise.all([
    fetcherPromise, 
    constPromise, 
    utilityPromise
]);
const active_scripts = await chrome.storage.local.get('script');
// 3. Destructure the functions/objects you need
const { fetchCarData, fetchNextRace } = fetcher;
const { track_info } = constants;
const { cleanHtml } = utility;
    
    try {
    const carData = await fetchCarData();
    const carAttributes = cleanHtml(carData.vars.carAttributes);
    window.__igplus_strategy_state__.CAR_ECONOMY = {fe:carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent,
                   te:carAttributes.querySelector('[id=wrap-tyre_economy] .ratingVal').textContent,
                   fuel:getFuelFn(carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent),
                   push:await getPushValues(),
                   originalFe:carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent}; 
//get from savedStrategy.vars.raceName instead??
    const TRACK_CODE = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
    const savedStrategy = await fetchNextRace();
    window.__igplus_strategy_state__.TRACK_INFO = track_info[TRACK_CODE];
    window.__igplus_strategy_state__.TRACK_INFO.code = TRACK_CODE;
    window.__igplus_strategy_state__.TRACK_INFO.laps = savedStrategy.vars.raceLaps;
    window.__igplus_strategy_state__.TRACK_INFO.raceLength = String(getLeagueLength(TRACK_CODE,savedStrategy.vars.raceLaps));

    const rules = JSON.parse(savedStrategy.vars.rulesJson);

    const is2tyres = rules.two_tyres == 1;
    const isRefuelling = rules.refuelling == 1;

    window.__igplus_strategy_state__.RULES = {is2tyres:is2tyres,isRefuelling:isRefuelling};
    const is2carLeague = !!(savedStrategy && savedStrategy.vars.d2Id);
    currentCar1Strategy = getParsedStrategy(savedStrategy.vars.d1StintCards);
    window.__igplus_strategy_state__.CAR_STRATEGY.push({carIndex:1,strategyData:currentCar1Strategy});
    makeCustomStrategy(1,currentCar1Strategy,true);
    
    
    
    if(is2carLeague){
        currentCar2Strategy = getParsedStrategy(savedStrategy.vars.d2StintCards);
        prepareStrategyContainer(2);
        window.__igplus_strategy_state__.CAR_STRATEGY.push({carIndex:2,strategyData:currentCar2Strategy});
        makeCustomStrategy(2,currentCar2Strategy,true);
        

    }
        if(active_scripts.script.sliderS)
          addFuelSlider();
        if(active_scripts.script.editS)
          addEdit();


    } catch (error) {
        return;
    }
    

    

    
        
   
     

}
 function addEdit()
    {
      const advancedFuel = document.getElementsByName('advancedFuel');
      if(advancedFuel != null)
      {
        advancedFuel.forEach(car => {

          if(!car.getAttribute('event')) {
            createEdit(car);
            car.setAttribute('event',true);
          }


        });
      }

    function createEdit(node){

        const  text = node.parentElement.querySelectorAll('.num')[0];
        text.contentEditable = true;
        text.classList.add("withSlider");
        text.classList.remove("green");
        text.addEventListener('click',function(){
          if(this.textContent != ''){
            this.parentElement.nextElementSibling.value = this.textContent;
          }
          this.textContent = '';
        });
        text.addEventListener('focusout',function(e){
          this.textContent = this.parentElement.nextElementSibling.value ;
        });
        text.addEventListener('input',function(e){

          const stored = this.parentElement.nextElementSibling;

          if (!e.data.match(/^[0-9]{0,2}$/)) {
            this.textContent = '';
          }
          let currentValue = parseInt(this.textContent);
          if(isNaN(currentValue))
          {
            currentValue = stored.value;
          }
          if(currentValue > parseInt(stored.max))
          {
            this.textContent = stored.max;
            currentValue = stored.max;
          } if(currentValue == 0)
          {
            const driverStrategyId = this.closest('form').id;
            document.getElementsByName('fuel1')[driverStrategyId[1] - 1].value = 0;
          }
          //this.textContent=(currentValue);
          stored.value = currentValue;
        });
      }
    }
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
    const parent = slider.closest(".igpNum");
    parent.insertBefore(settingValueDiv,parent.lastChild)
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
      const parent = slider.closest(".igpNum");
      parent.insertBefore(settingValueDiv,parent.lastChild)
    }
  });

  sliderContainer.append(slider);
  settingValueDiv.classList.add('withSlider');

  node.previousElementSibling.prepend(sliderContainer);


}   
    function addFuelSlider()
    {
      advancedFuel = document.getElementsByName('advancedFuel');
      if(advancedFuel != null)
      {
        advancedFuel.forEach(car => {
          if(car.previousElementSibling.childElementCount < 4)
            createSlider(car,0,200);

        });
      }

    }
function getTotalStrategyLaps(stints) {
  return stints.reduce((sum, stint) => {
    const laps = Number(stint.laps);
    return sum + (Number.isFinite(laps) ? laps : 0);
  }, 0);
}
function createStrategyFooter(strategyData) {
  const footer = document.createElement('div');
  footer.className = 'strategy-footer';

  const totalLaps = getTotalStrategyLaps(strategyData.stints);
  const raceLaps = window.__igplus_strategy_state__.TRACK_INFO.laps;

  footer.innerHTML = `
    <span class="laps-current">${totalLaps}</span>
    <span class="laps-sep">/</span>
    <span class="laps-total">${raceLaps}</span>
  `;

  if (totalLaps === raceLaps) {
    footer.classList.add('laps-ok');
  } else if (totalLaps > raceLaps) {
    footer.classList.add('laps-over');
  } else {
    footer.classList.add('laps-under');
  }
  if (!window.__igplus_strategy_state__.RULES.isRefuelling) {
  const lapLength = window.__igplus_strategy_state__.TRACK_INFO.length;
  const fuelFor1Lap =  (parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.fuel) + parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.push["60"])) * lapLength;

  const fuel = getTotalFuelEstimate(strategyData);
  footer.innerHTML += `
    <div class="footer-fuel">
    <span class="oneLap">${fuelFor1Lap.toFixed(2)}</span>
    <strong>${fuel}L</strong>
    </div>
  `;
}

  return footer;
}


function getParsedStrategy(htmlString){
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Find the script tag where ID ends with "StrategyJson"
    const jsonElement = doc.querySelector('script[id$="StrategyJson"]');
    if (!jsonElement) return { stints: [] };

    const strategyJSON = JSON.parse(jsonElement.textContent);
    // Convert numeric-key object to array
    const stintsArray = Object.keys(strategyJSON.stint)
        .sort((a,b) => +a - +b)
        .map(key => {
            const s = strategyJSON.stint[key];
            return {
                tyre: s.tyre ?? '--',
                fuel: Number(s.fuel) ?? 0,
                laps: Number(s.laps) ?? 0,
                wear: null,         
                push: strategyJSON[2] ?? 60    // default ------------------------- possible variation if using TD with special skill??
            };
        });

    // Use only the number of stints specified in `strategyJSON.stints`
    const numberOfStints = Number(strategyJSON.stints ?? stintsArray.length);
    return { stints: stintsArray.slice(0, numberOfStints) };
}
function saveStintToForm(carIndex, strategyData) {
  const gameStints = document.getElementById(`d${carIndex}StintCards`);
  const driverForm = gameStints.closest('form');

  if (!driverForm) return;

  const tyreInputs = driverForm.querySelectorAll('[name^="tyre"]');
  const fuelInputs = driverForm.querySelectorAll('[name^="fuel"]');
  const lapsInputs = driverForm.querySelectorAll('[name^="laps"]');
  const numPits = driverForm.querySelector(`[name=numPits]`);

  const stints = strategyData.stints;

  const max = Math.max(
    tyreInputs.length,
    fuelInputs.length,
    lapsInputs.length
  );

  numPits.value = stints.length-1;
  for (let i = 0; i < max; i++) {
    const stint = stints[i];

    /* TYRE */
    if (tyreInputs[i]) {
      tyreInputs[i].value = stint?.tyre ?? '';
    }

 
    if (lapsInputs[i]) {
        lapsInputs[i].value = stint?.laps ?? 1;
      }
    if (fuelInputs[i]) {
        if(!window.__igplus_strategy_state__.RULES.isRefuelling)
        {
            if(i==0)
            {
                //fuelInputs[i].value = Math.ceil(parseFloat(driverForm.querySelector('strong').textContent));
                
                fuelInputs[i].value = document.getElementById(`d${carIndex}AdvancedFuel`).value;
                
            }
            else{
                fuelInputs[i].value = 0;
            }
        }else{
            fuelInputs[i].value = stint?.fuel ?? 1;
        }
        
      }
    
  }

}

function prepareStrategyContainer(carIndex) {
  try {
    const originalStintsContainer = document.getElementById(`d${carIndex}StintCards`);
    const originalTotalLaps = document
      .getElementById(`d${carIndex}TotalLaps`)
      ?.parentElement;

    if (!originalStintsContainer) return;

    // Measure BEFORE hiding
    const reservedHeight =
      originalStintsContainer.offsetHeight +
      (originalTotalLaps?.offsetHeight || 0);

    // Hide originals
    originalStintsContainer.style.display = 'none';
    if (originalTotalLaps) originalTotalLaps.style.display = 'none';

    let root = document.getElementById(`strategyRoot${carIndex}`);
    if (!root) {
      root = document.createElement('div');
      root.id = `strategyRoot${carIndex}`;
      root.className = 'strategy-container';

      // 🔒 Freeze layout
      root.style.minHeight = `${reservedHeight}px`;

      originalStintsContainer.parentElement.appendChild(root);
    }
  } catch (e) {
    // Page already prepared or DOM not ready — safe to ignore
  }
}



function makeCustomStrategy(carIndex,strategyData) {

window.__igplus_strategy_state__.CAR_STRATEGY[carIndex-1] = {carIndex:carIndex,strategyData:strategyData};
const root = document.getElementById(`strategyRoot${carIndex}`);
    root.innerHTML = '';

ensureWearCalculated(strategyData);
ensureFuelDerived(strategyData);

const header = document.createElement('div');
header.className = 'strategy-header';
header.innerHTML = `
<div class="header-left">
<div class="header-btn customSave popup-save-btn"></div>
</div>
<div class="header-right">
<div class="header-btn settings-btn">⚙</div>
</div>`;
root.appendChild(header);
header.querySelector('.settings-btn')
  .addEventListener('click', openStrategySettings);
header.querySelector('.customSave').onclick = () => {
  openStrategyPopup(carIndex, strategyData);
};



const wrapper = document.createElement('div');
wrapper.className = 'stints-wrapper';

    if (window.__igplus_strategy_state__.RULES.is2tyres && allStintsSameTyre(strategyData.stints)) {
        wrapper.classList.add('two-tyre-warning');
    }
root.appendChild(wrapper);


strategyData.stints.forEach((stint, index) => {
wrapper.appendChild(createStint(stint, index,carIndex,strategyData));
});


const controlCol = document.createElement('div');
controlCol.classList.add('controlCol');


controlCol.appendChild(createAddStintButton(carIndex,strategyData));
controlCol.appendChild(createTrashButton(carIndex,strategyData));


wrapper.appendChild(controlCol);
const footer = createStrategyFooter(strategyData);
root.appendChild(footer);
saveStintToForm(carIndex,strategyData);

if(!arguments[2])invokeGameSave();



}
function allStintsSameTyre(stints) {
    if (!stints.length) return false;
    const firstTyre = stints[0].tyre;
    return stints.every(s => s.tyre === firstTyre);
}

function createDragPreview(stintEl) {
  const clone = stintEl.cloneNode(true);
  clone.classList.add('drag-preview');
  document.body.appendChild(clone);
  return clone;
}

function moveDragPreview(preview, x, y) {
  preview.style.left = `${x + 10}px`;
  preview.style.top = `${y + 10}px`;
}

function removeDragPreview() {
  if (dragPreview) {
    dragPreview.remove();
    dragPreview = null;
  }
}
function createStint(stint, index, carIndex,strategyData) {
const el = document.createElement('div');
el.className = 'stint';
el.dataset.index = index;
// Map tyre type to CSS class
    const tyreClassMap = {
        'SS': 'customSS',
        'S': 'customS',
        'M': 'customM',
        'H': 'customH',
        'I': 'customI',
        'W': 'customW'
    };
const tyreClass = tyreClassMap[stint.tyre] || '';
// ${window.__igplus_strategy_state__.RULES.isRefuelling ? `<div class="field fuel">Fuel: ${stint.fuel ?? '--'}</div>` : ''}
el.innerHTML = `
    <div class="stint-header">${index === 0 ? 'Start' : 'Pit ' + index}</div>
    <div class="stint-body">
        <div class="field customTyre ${tyreClass}">${stint.laps ?? '--'}</div>
       
        <div class="wear-label">${stint.wear ?? '--'}%</div>
        <div class="push-wrapper-igplus">
            <div class="field push customPush" data-push="${stint.push ?? 60}"></div>
            <div class="push-options">
                ${[100,80,60,40,20].map(v => `<div class="push-option" data-value="${v}"></div>`).join('')}
            </div>
        </div>
    </div>`;

el.querySelector('.customTyre').onclick = () => {
  openStintEditor(carIndex, strategyData, index);
};

dragPreview = null;



attachDragLogic(el,carIndex,strategyData);
const pushDiv = el.querySelector('.customPush');
    const optionsDiv = el.querySelector('.push-options');

    // Show/hide options on click
    pushDiv.addEventListener('click', () => {
        optionsDiv.style.display = optionsDiv.style.display === 'flex' ? 'none' : 'flex';
        optionsDiv.style.flexDirection = 'column';
    });

    // Select option
    optionsDiv.querySelectorAll('.push-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const value = Number(opt.dataset.value);
            stint.push = value;
            pushDiv.dataset.push = value;
            optionsDiv.style.display = 'none';
            //refresh stints
            makeCustomStrategy(carIndex,strategyData);
        });
    });

    // Hide dropdown if clicked outside
    document.addEventListener('click', e => {
        if (!el.contains(e.target)) optionsDiv.style.display = 'none';
    });
return el;
}

function invokeGameSave()
{
    document.getElementById('d1strategyAdvanced').querySelector('.tyreSelectInput td:not(.inactive)').click();
}
function createAddStintButton(carIndex,strategyData) {
const btn = document.createElement('div');
btn.className = 'add-stint';
btn.textContent = '+';


btn.onclick = () => {
  const last = strategyData.stints[strategyData.stints.length - 1];
  strategyData.stints.push(structuredClone(last));
  makeCustomStrategy(carIndex, strategyData);
};


btn.addEventListener('dragover', e => e.preventDefault());
btn.addEventListener('drop', () => {
if (!draggedStint) return;
const from = +draggedStint.dataset.index;
strategyData.stints.push(structuredClone(strategyData.stints[from]));
makeCustomStrategy(carIndex,strategyData);
});


return btn;
}

function createTrashButton(carIndex,strategyData) {
const trash = document.createElement('div');
trash.className = 'trash-zone';
trash.textContent = '−';


trash.onclick = () => {
if (strategyData.stints.length <= 2) return;
strategyData.stints.pop();
makeCustomStrategy(carIndex,strategyData);
};


trash.addEventListener('dragover', e => e.preventDefault());
trash.addEventListener('drop', () => {
if (!draggedStint) return;
if (strategyData.stints.length <= 2) return;
const index = +draggedStint.dataset.index;
strategyData.stints.splice(index, 1);
makeCustomStrategy(carIndex,strategyData);
});


return trash;
}

 draggedStint = null;


function clearDropHints() {
document.querySelectorAll('.edge-left, .edge-right, .edge-center').forEach(el => {
el.classList.remove('edge-left', 'edge-right', 'edge-center');
});
}


function showHint(el, type) {
clearDropHints();
if (type === 'left') el.classList.add('edge-left');
else if (type === 'right') el.classList.add('edge-right');
else el.classList.add('edge-center');
}
draggedStint = null;
 dragPreview = null;


function attachDragLogic(stintEl, carIndex, strategyData) {
  const header = stintEl.querySelector('.stint-header');

  let pointerId = null;

  header.style.touchAction = 'none';

  header.addEventListener('pointerdown', e => {
    e.preventDefault();

    draggedStint = stintEl;
    pointerId = e.pointerId;

    stintEl.classList.add('dragging');

    dragPreview = createDragPreview(stintEl);
    moveDragPreview(dragPreview, e.clientX, e.clientY);

    header.setPointerCapture(pointerId);
  });

  header.addEventListener('pointermove', e => {
    if (!draggedStint || pointerId !== e.pointerId) return;

    if (dragPreview) {
      moveDragPreview(dragPreview, e.clientX, e.clientY);
    }

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest('.stint');

    if (!target || target === draggedStint) {
      clearDropHints();
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < rect.width * 0.25) showHint(target, 'left');
    else if (x > rect.width * 0.75) showHint(target, 'right');
    else showHint(target, 'center');
  });

  header.addEventListener('pointerup', e => {
    if (!draggedStint || pointerId !== e.pointerId) return;

    header.releasePointerCapture(pointerId);
    pointerId = null;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest('.stint');

    clearDropHints();
    removeDragPreview();
    stintEl.classList.remove('dragging');

    if (!target || target === draggedStint) {
      draggedStint = null;
      return;
    }

    const from = +draggedStint.dataset.index;
    const to = +target.dataset.index;

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const isLeft = x < rect.width * 0.25;
    const isRight = x > rect.width * 0.75;

    // Center drop → copy
    if (!isLeft && !isRight) {
      strategyData.stints[to] = structuredClone(strategyData.stints[from]);
      makeCustomStrategy(carIndex, strategyData);
      draggedStint = null;
      return;
    }

    // Reorder
    const targetIndex = isLeft ? to : to + 1;
    const [moved] = strategyData.stints.splice(from, 1);

    strategyData.stints.splice(
      targetIndex > from ? targetIndex - 1 : targetIndex,
      0,
      moved
    );

    makeCustomStrategy(carIndex, strategyData);
    draggedStint = null;
  });

  header.addEventListener('pointercancel', () => {
    clearDropHints();
    removeDragPreview();
    stintEl.classList.remove('dragging');
    draggedStint = null;
    pointerId = null;
  });
}



function ensureStintEditor() {
  if (document.getElementById('stintEditor')) return;

  const editor = document.createElement('div');
  editor.id = 'stintEditor';
  editor.innerHTML = `
    <div class="editor-backdrop"></div>
    <div class="editor-panel">
      <div class="editor-section">
        <div class="editor-tyres">
          <div data-tyre="SS" class="customTyre customSS"></div>
          <div data-tyre="S"  class="customTyre customS"></div>
          <div data-tyre="M"  class="customTyre customM"></div>
          <div data-tyre="H"  class="customTyre customH"></div>
          <div data-tyre="I"  class="customTyre customI"></div>
          <div data-tyre="W"  class="customTyre customW"></div>
        </div>
      </div>


      <div class="editor-section" id="editor-laps">
  <label>Laps</label>

  <div class="stepper">
    <div class="step-btn minus">−</div>
    <input type="number" min="1" max="80" step="1" />
    <div class="step-btn plus">+</div>
  </div>
</div>


      <div class="editor-section" id="editor-fuel">
  <label>Fuel</label>

  <div class="stepper">
    <div class="step-btn minus">−</div>
    <input type="number" min="1" max="300" step="1" />
    <div class="step-btn plus">+</div>
  </div>

  <div class="fuel-derived">
    ≈ <span class="fuel-laps">--</span> laps
  </div>
</div>


        <div class="editor-section">
        <div class="editor-push">
          <div class="customPush" data-push="20"></div>
          <div class="customPush" data-push="40"></div>
          <div class="customPush" data-push="60"></div>
          <div class="customPush" data-push="80"></div>
          <div class="customPush" data-push="100"></div>
        </div>
      </div>
      <div class="editor-section editor-wear">
  <label>Estimated Wear</label>
  <div class="wear-preview">
    <span class="wear-value">--%</span>
  </div>
</div>

      <div class="editor-actions">
  <div class="editor-btn cancel" title="Cancel">✕</div>
  <div class="editor-btn confirm" title="Confirm">✔</div>
</div>

    </div>
  `;
  document.body.appendChild(editor);
}


 editorContext = null;

function openStintEditor(carIndex, strategyData, index) {
  ensureStintEditor();
  

  const editor = document.getElementById('stintEditor');
  const stint = strategyData.stints[index];
  editorContext = { carIndex, strategyData, index };

  editor.style.display = 'block';
    
  // Toggle fuel/laps
  document.getElementById('editor-laps').style.display = window.__igplus_strategy_state__.RULES.isRefuelling ? 'none' : 'flex';
  document.getElementById('editor-fuel').style.display = window.__igplus_strategy_state__.RULES.isRefuelling ? 'flex' : 'none';

  // Preselect tyre
  editor.querySelectorAll('.editor-tyres .customTyre').forEach(t => {
    t.classList.toggle('selected', t.dataset.tyre === stint.tyre);
  });

  // Preselect push
  editor.querySelectorAll('.editor-push div').forEach(p => {
    p.classList.toggle('selected', +p.dataset.push == stint.push);
  });

  // Values
  editor.querySelector('#editor-laps input').value = stint.laps ?? '';
  editor.querySelector('#editor-fuel input').value = stint.fuel ?? '';

  if (window.__igplus_strategy_state__.RULES.isRefuelling) {
    updateFuelDerived(editor, strategyData.stints[index]);
    }
}


 function calculateWearPreview({ tyre, push, laps, fuel }) {
  return getWearFn(tyre, laps ,window.__igplus_strategy_state__.TRACK_INFO , window.__igplus_strategy_state__.CAR_ECONOMY, window.__igplus_strategy_state__.TRACK_INFO.raceLength );
}
function updateWearPreview() {
  const editor = document.getElementById('stintEditor');

  const tyre = editor.querySelector('.editor-tyres .selected')?.dataset.tyre;
  const push = +editor.querySelector('.editor-push .selected')?.dataset.push;

  const laps = window.__igplus_strategy_state__.RULES.isRefuelling 
  ? Math.floor(editor.querySelector('.fuel-laps').textContent) 
  : +editor.querySelector('#editor-laps input')?.value || 1;
  const fuel = +editor.querySelector('#editor-fuel input')?.value;

  if (!tyre || !push) return;

  const wear = calculateWearPreview({ tyre, push, laps, fuel });
  editor.querySelector('.wear-value').textContent = `${wear}%`;
}

function ensureWearCalculated(strategyData) {
  strategyData.stints.forEach(stint => {
    if (stint.wear == null) {
      stint.wear = calculateWearPreview({
        tyre: stint.tyre,
        push: stint.push ?? 60,
        laps: stint.laps,
        fuel: stint.fuel
      });
    }
  });
}
function getTotalFuelEstimate(strategyData) {

  const fuelEstimate = strategyData.stints.reduce((total, stint) => {

    if (stint.laps == null) return total;

    const perLapFuel =
      (parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.fuel) + parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.push[stint.push])) *
      window.__igplus_strategy_state__.TRACK_INFO.length;

    const stintFuel = perLapFuel * (+stint.laps || 0);

    return total + stintFuel;
  }, 0);

  return fuelEstimate.toFixed(2);
}

function fuelToLaps(stint) {
  const estimatedLap = parseFloat(stint.fuel) / ((window.__igplus_strategy_state__.CAR_ECONOMY.fuel+parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.push[stint.push])) * window.__igplus_strategy_state__.TRACK_INFO.length); 
  return estimatedLap;
}
function updateFuelDerived(editor, stint) {
  const fuelInput = editor.querySelector('#editor-fuel input');
  const label = editor.querySelector('.fuel-laps');

  if (!fuelInput || !label) return;

  const fuel = +fuelInput.value;
  if (isNaN(fuel)) return;

  const tempPush = editor.querySelector('.customPush.selected').getAttribute('data-push');
  const tempStint = {fuel:fuel,push:tempPush};
  const calculatedLaps = fuelToLaps(tempStint);

  label.textContent = calculatedLaps.toFixed(1);

  // 🔹 IMPORTANT: update stint laps as FLOOR
  stint.laps = Math.floor(calculatedLaps);

  // Keep wear preview aligned
  updateWearPreview();
}

function ensureFuelDerived(strategyData) {
  strategyData.stints.forEach(stint => {
    if (!window.__igplus_strategy_state__.RULES.isRefuelling) return;
    if (stint.fuel == null) return;

    const calculatedLaps = fuelToLaps(stint);

    // 🔹 Always normalize laps from fuel
    stint.laps = Math.floor(calculatedLaps);
  });
}


function initEvents (){
    document.addEventListener('click', e => {
  const btn = e.target.closest('.step-btn');
  if (!btn) return;
  
  const stepper = btn.closest('.stepper');
  const input = stepper.querySelector('input');


  let value = input.value === '' ? (+input.min || 0) : parseFloat(input.value);

  const step = +input.step || 1;
  

  if (btn.classList.contains('plus')) value += step;
  if (btn.classList.contains('minus')) value -= step;

  const min = input.min !== '' ? +input.min : -Infinity;
  const max = +input.max || Infinity;

  value = Math.max(min, value);
  // Clamp value
  if (value < min) value = min;
  if (value > max) value = max;

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('click', async e => {
    const PUSH_KEYS = [20, 40, 60, 80, 100];

  const modal = document.getElementById('strategySettings');
  if (!modal) return;

  if (e.target.classList.contains('modal-close') ||
      e.target.classList.contains('modal-cancel')) {
    modal.remove();
    return;
  }

  if (e.target.classList.contains('modal-confirm')) {
    const pushLevels = [];
    const newPushMap = {};

    PUSH_KEYS.forEach(k => {
      const input = modal.querySelector(`[data-id="push-${k}"] input`);
      const val = parseFloat(input.value);
      newPushMap[k] = val;
      pushLevels.push(val);
    });

    const fe = parseFloat(
      modal.querySelector(`[data-id="fe"] input`).value
    );

    // Persist
    await chrome.storage.local.set({ pushLevels });

    // Update runtime economy
    const STATE = window.__igplus_strategy_state__;
    STATE.CAR_ECONOMY.push = newPushMap;
    STATE.CAR_ECONOMY.fe = fe;
    STATE.CAR_ECONOMY.fuel = getFuelFn(fe);

    modal.remove();
    console.log(STATE.CAR_STRATEGY);
    // Re-render strategies
    STATE.CAR_STRATEGY.forEach(({ carIndex, strategyData }) => {
    makeCustomStrategy(carIndex, strategyData);
    
  });
  }
});

    document.addEventListener('click', e => {
  if (!editorContext) return;

  if (e.target.closest('.editor-tyres .customTyre')) {
    document.querySelectorAll('.editor-tyres .customTyre')
      .forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }

  if (e.target.closest('.editor-push div')) {
    document.querySelectorAll('.editor-push div')
      .forEach(p => p.classList.remove('selected'));
    e.target.classList.add('selected');
    const { strategyData, index } = editorContext;
    const editor = document.getElementById('stintEditor');
    updateFuelDerived(editor, strategyData.stints[index]);
  }
  updateWearPreview();

});
document.addEventListener('input', e => {
  if (e.target.closest('#stintEditor')) updateWearPreview();
});
document.addEventListener('input', e => {

  if (!editorContext) return;

  const editor = document.getElementById('stintEditor');
  if (!editor.contains(e.target)) return;

  const input = e.target.closest('input[type=number]');
  if (!input) return;

  const min = +input.min || 0;
  const max = +input.max || Infinity;
  let value = +input.value;

  // Clamp value
  if (value < min) value = min;
  if (value > max) value = max;

  input.value = value;

  // Trigger fuel/laps recalculation if needed
  if (input.closest('#editor-fuel')) {
    const { strategyData, index } = editorContext;
    updateFuelDerived(editor, strategyData.stints[index]);
  } else if (input.closest('#editor-laps')) {
    const { strategyData, index } = editorContext;
    strategyData.stints[index].laps = Math.floor(value);
    updateWearPreview();
  }
});
document.addEventListener('click', e => {
  if (!editorContext) return;

  const editor = document.getElementById('stintEditor');

  if (e.target.classList.contains('cancel')) {
    editor.style.display = 'none';
    editorContext = null;
  }

   if (e.target.closest('#editor-fuel')) {
    const { strategyData, index } = editorContext;
    updateFuelDerived(editor, strategyData.stints[index]);
  }
  if (e.target.classList.contains('confirm')) {
    const { carIndex, strategyData, index } = editorContext;
    const stint = strategyData.stints[index];

    const tyre = editor.querySelector('.editor-tyres .selected')?.dataset.tyre;
    const push = +editor.querySelector('.editor-push .selected')?.dataset.push;

    if (tyre) stint.tyre = tyre;
    if (push) stint.push = push;

    if (window.__igplus_strategy_state__.RULES.isRefuelling) {
      stint.fuel = +editor.querySelector('#editor-fuel input').value;
    } else {
      stint.laps = +editor.querySelector('#editor-laps input').value;
    }

    stint.wear = calculateWearPreview({
    tyre: stint.tyre,
    push: stint.push,
    laps: stint.laps,
    fuel: stint.fuel
  });

    editor.style.display = 'none';
    editorContext = null;
    makeCustomStrategy(carIndex, strategyData);
  }
});
}


async function getPushValues() {
    function toPushMap(arr) {
  return {
    20: arr[0],
     40: arr[1],
     60: arr[2],
     80: arr[3],
     100: arr[4],
  };
}
    const defaultPush = [-0.007, -0.004, 0, 0.01, 0.02];
    const data = await chrome.storage.local.get({ 'pushLevels': defaultPush });
    
    return toPushMap(data.pushLevels);
}
async function loadSettingsValues() {
  const pushMap = await getPushValues();

  return {
    push: pushMap,
    fe: window.__igplus_strategy_state__.CAR_ECONOMY.fe
  };
}

function openStrategySettings() {
  if (document.getElementById('strategySettings')) return;

  loadSettingsValues().then(({ push, fe }) => {
    const PUSH_KEYS = [100,80,60,40,20];
    const modal = document.createElement('div');
    modal.id = 'strategySettings';
    modal.className = 'strategy-modal';

    modal.innerHTML = `
      <div class="modal-content">

        <div class="modal-section">
          ${PUSH_KEYS.map(k => `
            <div class="stepper-row">
              <span class="push-symbol" data-push="${k}"></span>
              ${createStepperHTML(`push-${k}`, push[k], 0.001, -0.1, 0.1)}
            </div>
          `).join('')}
        </div>
<hr class ="modal-separator">
        <div class="modal-section-fuel">
           <span class="fuel-symbol feLabel"></span>
          ${createStepperHTML('fe', fe, 1, 1, 300)}
        </div>

        <div class="modal-actions">
          <span class="modal-cancel">✕</span>
          <span class="modal-confirm">✔</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
const feLabel = modal.querySelector('.feLabel');
const feInput = modal.querySelector('[data-id=fe] input');

if (feLabel && feInput) {
  feLabel.addEventListener('click', () => {
    const originalFe = window.__igplus_strategy_state__.CAR_ECONOMY.originalFe;

    feInput.value = parseInt(originalFe);

    // Trigger the same update path as manual input
    feInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
  });
}

function createStepperHTML(id, value, step, min, max) {
  return `
    <div class="stepper" data-id="${id}">
      <span class="step-btn minus">−</span>
      <input type="number"
             value="${value}"
             step="${step}"
             min="${min}"
             max="${max}">
      <span class="step-btn plus">+</span>
    </div>
  `;
}
    function injectCircuitMap(){
        const trackLink = {
  'au': 'd=circuit&id=1&tab=history' ,//Australia
  'my': 'd=circuit&id=2&tab=history' ,//Malaysia
  'cn': 'd=circuit&id=3&tab=history' ,//China
  'bh': 'd=circuit&id=4&tab=history' ,//Bahrain
  'es': 'd=circuit&id=5&tab=history' ,//Spain
  'mc': 'd=circuit&id=6&tab=history' ,//Monaco
  'tr': 'd=circuit&id=7&tab=history' ,//Turkey
  'de': 'd=circuit&id=9&tab=history' ,//Germany
  'hu': 'd=circuit&id=10&tab=history' ,//Hungary
  'eu': 'd=circuit&id=11&tab=history' ,//Europe
  'be': 'd=circuit&id=12&tab=history' ,//Belgium
  'it': 'd=circuit&id=13&tab=history' ,//Italy
  'sg': 'd=circuit&id=14&tab=history' ,//Singapore
  'jp': 'd=circuit&id=15&tab=history' ,//Japan
  'br': 'd=circuit&id=16&tab=history' ,//Brazil
  'ae': 'd=circuit&id=17&tab=history' ,//AbuDhabi
  'gb': 'd=circuit&id=18&tab=history' ,//Great Britain
  'fr': 'd=circuit&id=19&tab=history' ,//France
  'at': 'd=circuit&id=20&tab=history' ,//Austria
  'ca': 'd=circuit&id=21&tab=history' ,//Canada
  'az': 'd=circuit&id=22&tab=history' ,//Azerbaijan
  'mx': 'd=circuit&id=23&tab=history' ,//Mexico
  'ru': 'd=circuit&id=24&tab=history' ,//Russia
  'us': 'd=circuit&id=25&tab=history', //USA
  'nl': 'd=circuit&id=26&tab=history' //Netherlands
};
      if(!document.getElementById('customMap'))
      {
        try {
          const trackCode = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
          const target = document.querySelector('[id=strategy] .eight');
          const circuit = document.createElement('img');
          circuit.id = 'customMap';
          //document.getElementById('igplus_darkmode') ? circuit.src = chrome.runtime.getURL(`images/circuits/${TRACK_CODE}_dark.png`) : circuit.src = chrome.runtime.getURL(`images/circuits/${TRACK_CODE}.png`)
          circuit.src = chrome.runtime.getURL(`images/circuits/${trackCode}_dark.png`);
          circuit.setAttribute('style','width:100%;');
          const imageLink = document.createElement('a');
          imageLink.href = trackLink[trackCode];
          imageLink.append(circuit);
          target.append(imageLink);
        } catch (error) {
        //page changed
        }

      }
    }
async function readGSheets()
    {
      if(document.getElementById('importedTable') == null)
      {
        async function getCurrentTrack(trackj){
          const {trackDictionary} = await import(chrome.runtime.getURL('scripts/strategy/const.js'));
          const jTrack = [];
         try {
          trackj.forEach((ele) =>
          {
           
              if(isNaN(ele[t.gTrack]))
                requestedTrack = ele[t.gTrack].toLowerCase();
              else
                requestedTrack = ele[t.gTrack];
              if(trackDictionary[window.__igplus_strategy_state__.TRACK_INFO.code].includes(requestedTrack))
                jTrack.push(ele);

            
          });} catch (error) {
            return -1;
          }
          
          return jTrack;
        }
        function sortTable() {

          n = this.cellIndex;

          var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
          table = document.getElementById('importedTable');
          switching = true;
          dir = 'asc';
          while (switching) {
            switching = false;
            rows = table.rows;
            for (i = 1; i < (rows.length - 1); i++) {
              shouldSwitch = false;
              x = rows[i].getElementsByTagName('TD')[n];
              y = rows[i + 1].getElementsByTagName('TD')[n];
              var cmpX = isNaN(parseInt(x.innerHTML)) ? x.innerHTML.toLowerCase() : parseInt(x.innerHTML);
              var cmpY = isNaN(parseInt(y.innerHTML)) ? y.innerHTML.toLowerCase() : parseInt(y.innerHTML);
              cmpX = (cmpX == '-') ? 0 : cmpX;
              cmpY = (cmpY == '-') ? 0 : cmpY;
              if (dir == 'asc') {
                if (cmpX > cmpY) {
                  shouldSwitch = true;
                  break;
                }
              } else if (dir == 'desc') {
                if (cmpX < cmpY) {
                  shouldSwitch = true;
                  break;
                }
              }
            }
            if (shouldSwitch) {
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              switchcount ++;
            } else {
              if (switchcount == 0 && dir == 'asc') {
                dir = 'desc';
                switching = true;
              }
            }
          }
        }
        savedLink = await chrome.storage.local.get({'gLink':''});
        if(savedLink.gLink != '')
        {
          t = await chrome.storage.local.get({'gTrack':'track'});
          sName = await chrome.storage.local.get({'gLinkName':'Sheet1'});
          idRegex = /spreadsheets\/d\/(.*)\/edit/;
          link = idRegex.exec(savedLink.gLink)[1];
          const sheetId = link;
          const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
          const sheetName = sName.gLinkName;
          const query = encodeURIComponent('Select *');
          const url = `${base}&sheet=${sheetName}&tq=${query}`;
          const data = [];
          var output = document.createElement('table');//document.querySelector('.output')
          output.setAttribute('style','width: 100%;table-layout: auto;text-align: center;');
          output.id = 'importedTable';
          init();
          async function init() {
            //e.preventDefault()
            await new Promise((res) => setTimeout(res, 500)); // sleep a bit, while page loads
            await fetch(url)
              .then(res => res.text())
              .then(async rep => {
              //Remove additional text and extract only JSON:
                const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
                const colz = [];
                const tr = document.createElement('tr');

                //if data is without labels make the first row the labels
                if(!jsonData.table.cols[0].label)
                {
                  for(var i = 0 ; i < jsonData.table.cols.length; i++)
                  {
                    jsonData.table.cols[i].label = jsonData.table.rows[0].c[i].v;
                  }
                }

                //Extract column labels
                jsonData.table.cols.forEach((heading) => {
                  if (heading.label) {
                    let column = heading.label;
                    if(column.toLowerCase() == t.gTrack)
                    {
                      column = column.toLowerCase();
                    }
                    colz.push(column);
                    const th = document.createElement('th');
                    th.setAttribute('style','font-family: "RobotoCondensed","Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;cursor: pointer;background-color: #8f8f8f;color: #ffffff;border-radius: 5px;');
                    th.addEventListener('click',sortTable);
                    th.textContent = column;
                    tr.appendChild(th);

                  }
                  else
                  {

                  }
                });
                output.appendChild(tr);
                //extract row data:
                jsonData.table.rows.forEach((rowData) => {
                  const row = {};
                  colz.forEach((ele, ind) => {
                    row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                  });
                  data.push(row);
                });
                const result = await processRows(data)
                if (result == -1)
                  return
                else
                {
                  if(document.getElementById('importedTable') == null)
                  {
                    function removeColumn(table, columnName) {
                    // Find the index of the column to remove
                      let colIndex = -1;
                      for (let i = 0; i < table.rows[0].cells.length; i++) {
                        if (table.rows[0].cells[i].textContent === columnName) {
                          colIndex = i;
                          break;
                        }
                      }
      
                      // If the column was found
                      if (colIndex !== -1) {
                      // Remove the cells from all rows
                        for (let i = 0; i < table.rows.length; i++) {
                          table.rows[i].deleteCell(colIndex);
                        }
                      }
                    }
      
                    
                    document.querySelectorAll('.eight.columns.aStrat')[0]?.append(output);
                    removeColumn(output,t.gTrack);
                  }
                }
              });

          }

        }

        async function processRows(json) {
              json = await getCurrentTrack(json);
              if(json == -1 && readAttempts > 0)
              {
                readAttempts--;
                await new Promise((res) => setTimeout(res, 2000)); // sleep a bit, while page loads
                readGSheets();
                return -1;
              }
          json.forEach((row) => {
            const tr = document.createElement('tr');
            const keys = Object.keys(row);

            keys.forEach((key) => {
              const td = document.createElement('td');
              td.textContent = row[key];
              tr.appendChild(td);
            });
            output.appendChild(tr);
          });

        }}
    }
function decodeTyre(tsTyre) {
  // "ts-M" → "M"
  return tsTyre?.replace('ts-', '') ?? 'M';
}
function encodeTyre(tyre) {
  return `ts-${tyre}`;
}

function legacySaveToStrategyData(save) {
const PUSH_INDEX_TO_VALUE = {
  1: 100,
  2: 80,
  3: 60,
  4: 40,
  5: 20
};

  const stints = [];

  Object.keys(save.stints)
    .sort((a, b) => a - b)
    .forEach(i => {
      const s = save.stints[i];

      const pushIndex = PUSH_INDEX_TO_VALUE[s.push] ?? 60;
      const tempLaps = Number(s.laps);
      const lapFuel = (parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.fuel) + parseFloat(window.__igplus_strategy_state__.CAR_ECONOMY.push[pushIndex]) )* window.__igplus_strategy_state__.TRACK_INFO.length;
      const totalStintFuel = Math.ceil(lapFuel * tempLaps)

      stints.push({
        tyre: decodeTyre(s.tyre),
        laps: tempLaps,
        fuel: totalStintFuel,          
        wear: null,          // derived later
        push: pushIndex
      });
    });

  return { stints };
}

function strategyDataToLegacySave(strategyData) {
    const PUSH_VALUE_TO_INDEX = {
  100: 1,
  80: 2,
  60: 3,
  40: 4,
  20: 5
};

  const save = {
    track: window.__igplus_strategy_state__.TRACK_INFO.code,
    length: String(getLeagueLength(window.__igplus_strategy_state__.TRACK_INFO.code,window.__igplus_strategy_state__.TRACK_INFO.laps)),
    laps: {
      total: window.__igplus_strategy_state__.TRACK_INFO.laps,
      doing: getTotalStrategyLaps(strategyData.stints)
    },
    stints: {}
  };

  strategyData.stints.forEach((stint, i) => {
    save.stints[i] = {
      tyre: encodeTyre(stint.tyre),
      laps: String(stint.laps),
      push: PUSH_VALUE_TO_INDEX[stint.push] ?? 2
    };
  });

  return save;
}

function ensureStrategyPopup() {
  if (document.getElementById('strategyPopup')) return;

  const popup = document.createElement('div');
  popup.id = 'strategyPopup';
  popup.innerHTML = `
    <div class="popup-backdrop"></div>
    <div class="popup-panel">
      <div class="popup-header">
        <span class="popup-close">✕</span>
      </div>

      <div class="popup-section-preview">
        <button class="popup-save-btn popup-save"></button>
        <div id="currentStrategyPreview" class="strategy-preview"></div>
      </div>

      <div class="popup-section">
        <div id="savedStrategiesList"></div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelector('.popup-close').onclick =
  popup.querySelector('.popup-backdrop').onclick = () => {
    popup.style.display = 'none';
  };
}
function renderStrategyPreview(stints, container) {
  container.innerHTML = '';

  stints.forEach(stint => {
    const tyre = document.createElement('div');
    tyre.className = `customTyre custom${stint.tyre}`;
    tyre.textContent = stint.laps;
    container.appendChild(tyre);
  });
}
async function openStrategyPopup(carIndex, strategyData) {
  ensureStrategyPopup();

  const popup = document.getElementById('strategyPopup');
  popup.style.display = 'block';

  // Current strategy preview
  renderStrategyPreview(
    strategyData.stints,
    document.getElementById('currentStrategyPreview')
  );

  // Save button
  popup.querySelector('.popup-save-btn').onclick = async () => {
    await saveCurrentStrategy(strategyData);
    await populateSavedStrategies(carIndex);
  };

  // Saved strategies list
  await populateSavedStrategies(carIndex);
}
async function populateSavedStrategies(carIndex) {
  const list = document.getElementById('savedStrategiesList');
  list.innerHTML = '';

  const trackCode = window.__igplus_strategy_state__.TRACK_INFO.code;
  const { save } = await chrome.storage.local.get({ save: {} });

  if (!save[trackCode]) {
    list.innerHTML = '<div class="empty">No saved strategies</div>';
    return;
  }

  Object.entries(save[trackCode]).forEach(([hash, legacySave]) => {
    const item = document.createElement('div');
    item.className = 'saved-strategy';

    const preview = document.createElement('div');
    preview.className = 'strategy-preview';

    const strategyData = legacySaveToStrategyData(legacySave);
    renderStrategyPreview(strategyData.stints, preview);



    const loadBtn = document.createElement('button');
    loadBtn.textContent = '▶';
    loadBtn.onclick = () => {
      makeCustomStrategy(carIndex, strategyData);
      document.getElementById('strategyPopup').style.display = 'none';
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.onclick = async () => {
      delete save[trackCode][hash];
      await chrome.storage.local.set({ save });
      populateSavedStrategies(carIndex);
    };

    const left = document.createElement('div');
    left.className = 'saved-left';
    left.appendChild(loadBtn);

    const right = document.createElement('div');
    right.className = 'saved-right';
    right.appendChild(delBtn);

    item.append(left, preview, right);

    list.appendChild(item);
  });
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
function getLeagueLength(countryCode, laps) {
  const raceLengthMap = new Map([
  ['ae', [50, 37, 25, 12]],
  ['au', [57, 42, 28, 14]],
  ['at', [68, 51, 34, 17]],
  ['az', [46, 34, 23, 11]],
  ['ba', [59, 44, 29, 14]],
  ['be', [43, 32, 21, 10]],
  ['br', [69, 51, 34, 17]],
  ['ca', [63, 47, 31, 15]],
  ['cn', [55, 41, 27, 13]],
  ['eu', [50, 37, 25, 12]],
  ['fr', [48, 36, 24, 12]],
  ['de', [67, 50, 33, 16]],
  ['jp', [55, 41, 27, 13]],
  ['gb', [48, 36, 24, 12]],
  ['it', [51, 38, 25, 12]],
  ['my', [55, 41, 27, 13]],
  ['mx', [70, 52, 35, 17]],
  ['mo', [59, 44, 29, 14]],
  ['ru', [46, 34, 23, 11]],
  ['sg', [60, 45, 30, 15]],
  ['es', [62, 46, 31, 15]],
  ['us', [60, 45, 30, 15]],
  ['tr', [54, 40, 27, 13]],
  ['hu', [79, 59, 39, 19]],
  ['nl', [72, 59, 36, 19]]
]);
  const lengths = [100, 75, 50, 25];
  const trackLaps = raceLengthMap.get(countryCode.toLowerCase());

  if (!trackLaps) return null; // Track not found

  // Find the index of the lap count that matches our input
  const index = trackLaps.indexOf(Number(laps));

  // Return the percentage at that same index
  return index !== -1 ? lengths[index] : null;
}
async function saveCurrentStrategy(strategyData) {
  const trackCode = window.__igplus_strategy_state__.TRACK_INFO.code;
  const legacySave = strategyDataToLegacySave(strategyData, trackCode);
  const hash = hashCode(JSON.stringify(legacySave));

  const storage = await chrome.storage.local.get({ save: {} });

  if (!storage.save[trackCode]) {
    storage.save[trackCode] = {};
  }

  storage.save[trackCode][hash] = legacySave;

  await chrome.storage.local.set({ save: storage.save });

}


// TODO move to separate retry module?
(async () => {
  try {
    await new Promise((res) => setTimeout(res, 0)); // sleep a bit, while page loads
        if (getWearFn && getFuelFn) return;
    const mod = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
    getFuelFn = mod.fuel_calc;
    getWearFn = mod.get_wear;
    //make a condition if already loaded?
    if (!document.getElementById(`strategyRoot1`)) {
    readGSheets();
    strategy();
    injectCircuitMap(); 
    }

  } catch (err) {
    console.log('page not loaded');
  }
})();

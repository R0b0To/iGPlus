TRACK_INFO = null;
CAR_ECONOMY = null;
HTML_ELEMENTS = [];
if (!window.__strategyInit) {
  window.__strategyInit = true;
 initEvents();
}


async function strategy(){

    prepareStrategyContainer(1);
    console.log('running strategy page scripts');
    const { fetchLeagueData, fetchCarData, fetchNextRace } = await import(chrome.runtime.getURL('common/fetcher.js'));
    const { fuel_calc, get_wear } = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
    const { track_info, multipliers, trackLink ,trackDictionary } = await import(chrome.runtime.getURL('scripts/strategy/const.js'));
    const { cleanHtml } = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
    
    const carData = await fetchCarData();
    const carAttributes = cleanHtml(carData.vars.carAttributes);
    CAR_ECONOMY = {fe:carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent,te:carAttributes.querySelector('[id=wrap-tyre_economy] .ratingVal').textContent,fuel:fuel_calc(carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent)};
    
    //get from savedStrategy.vars.raceName instead??
    const TRACK_CODE = document.querySelector('#race > div:nth-child(1) > h1 > img').outerHTML.split("-")[1].split(" ")[0] ?? 'au';
    const savedStrategy = await fetchNextRace();
    TRACK_INFO = track_info[TRACK_CODE];
    TRACK_INFO.laps = savedStrategy.vars.raceLaps;
    console.log(TRACK_INFO);
    console.log(CAR_ECONOMY);
    console.log(savedStrategy);
    console.log('fuel per lap: ',CAR_ECONOMY.fuel*TRACK_INFO.length);
    const rules = JSON.parse(savedStrategy.vars.rulesJson);

    is2tyres = rules.two_tyres == 1;
    isRefuelling = rules.refuelling == 1;
    const is2carLeague = !!(savedStrategy && savedStrategy.vars.d2Id);
        
    currentCar1Strategy = getParsedStrategy(savedStrategy.vars.d1StintCards);
    
    makeCustomStrategy(1,currentCar1Strategy);
    console.log(currentCar1Strategy);

    if(is2carLeague){
        currentCar2Strategy = getParsedStrategy(savedStrategy.vars.d2StintCards);
        prepareStrategyContainer(2);
        makeCustomStrategy(2,currentCar2Strategy);
    }
    //initEvents();
    console.log(HTML_ELEMENTS);

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
  const raceLaps = TRACK_INFO.laps;

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
  if (!isRefuelling) {
  const fuel = getTotalFuelEstimate(strategyData);
  footer.innerHTML += `
    <div class="footer-fuel">
      Est. Fuel: <strong>${fuel}</strong>
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
    console.log(strategyJSON);
    // Convert numeric-key object to array
    const stintsArray = Object.keys(strategyJSON.stint)
        .sort((a,b) => +a - +b)
        .map(key => {
            const s = strategyJSON.stint[key];
            return {
                tyre: s.tyre ?? '--',
                fuel: Number(s.fuel) ?? 0,
                laps: Number(s.laps) ?? 0,
                wear: null,          // placeholder
                push: strategyJSON[2]    // default
            };
        });

    // Use only the number of stints specified in `strategyJSON.stints`
    const numberOfStints = Number(strategyJSON.stints ?? stintsArray.length);
    return { stints: stintsArray.slice(0, numberOfStints) };
}
function saveStintToForm(carIndex, strategyData) {
  const driverForm = HTML_ELEMENTS[carIndex - 1].closest('form');
  console.log(driverForm);
  
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
  console.log(numPits,stints.length-1);
  numPits.value = stints.length-1;
  for (let i = 0; i < max; i++) {
    const stint = stints[i];

    /* TYRE */
    if (tyreInputs[i]) {
      tyreInputs[i].value = stint?.tyre ?? '';
    }

 
      if (lapsInputs[i]) {
        lapsInputs[i].value = stint?.laps ?? '';
      }
      if (fuelInputs[i]) {
        fuelInputs[i].value = stint?.fuel ?? '';
      }
    
  }
}

function prepareStrategyContainer(carIndex){
    const originalStintsContainer = document.getElementById(`d${carIndex}StintCards`);
    const originalTotalLaps = document.getElementById(`d${carIndex}TotalLaps`).parentElement;
    originalStintsContainer.style.display = 'none';
    originalTotalLaps.style.display = 'none';
    HTML_ELEMENTS.push(originalStintsContainer);

    let root = document.getElementById(`strategyRoot${carIndex}`);
  if (!root) {
  root = document.createElement('div');
  root.id = `strategyRoot${carIndex}`;
  root.classList.add('strategy-container'); 
  originalStintsContainer.parentElement.appendChild(root);
  
}
}
function makeCustomStrategy(carIndex,strategyData) {
const root = document.getElementById(`strategyRoot${carIndex}`);
root.innerHTML = '';
ensureWearCalculated(strategyData);
ensureFuelDerived(strategyData);

const header = document.createElement('div');
header.className = 'strategy-header';
header.innerHTML = `
<div class="header-left">
<div class="header-btn">Save</div>
<div class="header-btn">Load</div>
</div>
<div class="header-right">
<div class="header-btn">Settings</div>
<div class="header-btn">History</div>
</div>`;
root.appendChild(header);


const wrapper = document.createElement('div');
wrapper.className = 'stints-wrapper';

    if (is2tyres && allStintsSameTyre(strategyData.stints)) {
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
}
function allStintsSameTyre(stints) {
    if (!stints.length) return false;
    const firstTyre = stints[0].tyre;
    return stints.every(s => s.tyre === firstTyre);
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
// ${isRefuelling ? `<div class="field fuel">Fuel: ${stint.fuel ?? '--'}</div>` : ''}
el.innerHTML = `
    <div class="stint-header">${index === 0 ? 'Start' : 'Pit ' + index}</div>
    <div class="stint-body">
        <div class="field customTyre ${tyreClass}">${stint.laps ?? '--'}</div>
       
        <div class="wear-label">${stint.wear ?? '--'}%</div>
        <div class="push-wrapper">
            <div class="field push customPush" data-push="${stint.push ?? 60}"></div>
            <div class="push-options">
                ${[100,80,60,40,20].map(v => `<div class="push-option" data-value="${v}"></div>`).join('')}
            </div>
        </div>
    </div>`;

el.querySelector('.customTyre').onclick = () => {
  openStintEditor(carIndex, strategyData, index);
};

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
        });
    });

    // Hide dropdown if clicked outside
    document.addEventListener('click', e => {
        if (!el.contains(e.target)) optionsDiv.style.display = 'none';
    });
return el;
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


function attachDragLogic(stintEl,carIndex,strategyData) {
const header = stintEl.querySelector('.stint-header');
header.setAttribute('draggable', 'true');


header.addEventListener('dragstart', e => {
draggedStint = stintEl;
e.dataTransfer.effectAllowed = 'move';
});


header.addEventListener('dragend', () => {
draggedStint = null;
clearDropHints();
});


stintEl.addEventListener('dragover', e => {
e.preventDefault();
if (!draggedStint || draggedStint === stintEl) return;


const rect = stintEl.getBoundingClientRect();
const x = e.clientX - rect.left;


if (x < rect.width * 0.25) showHint(stintEl, 'left');
else if (x > rect.width * 0.75) showHint(stintEl, 'right');
else showHint(stintEl, 'center');
});


stintEl.addEventListener('dragleave', clearDropHints);


stintEl.addEventListener('drop', e => {
e.preventDefault();
clearDropHints();


if (!draggedStint || draggedStint === stintEl) return;


const from = +draggedStint.dataset.index;
const to = +stintEl.dataset.index;


const rect = stintEl.getBoundingClientRect();
const x = e.clientX - rect.left;


const isLeft = x < rect.width * 0.25;
const isRight = x > rect.width * 0.75;


// Center drop = copy
if (!isLeft && !isRight) {
strategyData.stints[to] = structuredClone(strategyData.stints[from]);
makeCustomStrategy(carIndex,strategyData);
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


makeCustomStrategy(carIndex,strategyData);
});
}


function ensureStintEditor() {
  if (document.getElementById('stintEditor')) return;

  const editor = document.createElement('div');
  editor.id = 'stintEditor';
  editor.innerHTML = `
    <div class="editor-backdrop"></div>
    <div class="editor-panel">
      <div class="editor-title">Edit Stint</div>

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
  <div class="editor-btn confirm" title="Confirm">✓</div>
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
  document.getElementById('editor-laps').style.display = isRefuelling ? 'none' : 'block';
  document.getElementById('editor-fuel').style.display = isRefuelling ? 'block' : 'none';

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

  if (isRefuelling) {
    updateFuelDerived(editor, strategyData.stints[index]);
    }
}


function calculateWearPreview({ tyre, push, laps, fuel }) {
  // Placeholder logic – replace with your real model // YOUR logic here -------------------------------------------------------------wear calc here
  let base = tyre === 'S' ? 6 : tyre === 'M' ? 4 : 3;
  let pushFactor = (push ?? 60) / 60;
  let lapFactor = laps ?? Math.floor(fuel / 8);

  return Math.min(100, Math.round(base * pushFactor * lapFactor));
}
function updateWearPreview() {
  const editor = document.getElementById('stintEditor');

  const tyre = editor.querySelector('.editor-tyres .selected')?.dataset.tyre;
  const push = +editor.querySelector('.editor-push .selected')?.dataset.push;

  const laps = +editor.querySelector('#editor-laps input')?.value;
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
  const totalLaps = getTotalStrategyLaps(strategyData.stints);
  return CAR_ECONOMY.fuel * TRACK_INFO.length * totalLaps;
}

function fuelToLaps(stint) {
  const estimatedLap = stint.fuel / (CAR_ECONOMY.fuel * TRACK_INFO.length); // -------------------------- to add push
  return estimatedLap;
}
function updateFuelDerived(editor, stint) {
  const fuelInput = editor.querySelector('#editor-fuel input');
  const label = editor.querySelector('.fuel-laps');

  if (!fuelInput || !label) return;

  const fuel = +fuelInput.value;
  if (isNaN(fuel)) return;

  const tempFuel = {fuel:fuel};
  const calculatedLaps = fuelToLaps(tempFuel);

  label.textContent = calculatedLaps.toFixed(1);

  // 🔹 IMPORTANT: update stint laps as FLOOR
  stint.laps = Math.floor(calculatedLaps);

  // Keep wear preview aligned
  updateWearPreview();
}

function ensureFuelDerived(strategyData) {
  strategyData.stints.forEach(stint => {
    if (!isRefuelling) return;
    if (stint.fuel == null) return;

    const calculatedLaps = fuelToLaps(stint);

    // 🔹 Always normalize laps from fuel
    stint.laps = Math.floor(calculatedLaps);
  });
}


function initEvents (){
    console.log('registering stepper listener');
    document.addEventListener('click', e => {
  const btn = e.target.closest('.step-btn');
  if (!btn) return;
  
  console.log('pressing button');
  const stepper = btn.closest('.stepper');
  const input = stepper.querySelector('input');

  let value = +input.value || 1;
  const step = +input.step || 1;

  if (btn.classList.contains('plus')) value += step;
  if (btn.classList.contains('minus')) value -= step;

  const min = input.min !== '' ? +input.min : -Infinity;
  value = Math.max(min, value);

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
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

    if (isRefuelling) {
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


// TODO move to separate retry module?
(async () => {
  try {
    await new Promise((res) => setTimeout(res, 0)); // sleep a bit, while page loads
    //make a condition if already loaded?
    if (!document.getElementById(`strategyRoot1`)) {
    is2tyres = false;
    isRefuelling = false;
    strategy();
    }

  } catch (err) {
    console.log('page not loaded');
  }
})();

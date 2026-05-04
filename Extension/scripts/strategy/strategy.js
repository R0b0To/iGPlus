(() => {
  'use strict';

  // 1. STATE & STATIC DATA CACHING
  let getWearFn = null;
  let getFuelFn = null;
  let dragPreview = null;
  let draggedStint = null;
  let editorContext = null;

  const TYRES =['SS', 'S', 'M', 'H', 'I', 'W'];
  const PUSH_KEYS =[20, 40, 60, 80, 100];
  
  const RACE_LENGTH_MAP = new Map([
    ['ae', [50, 37, 25, 12]], ['au',[57, 42, 28, 14]], ['at',[68, 51, 34, 17]],
    ['az',[46, 34, 23, 11]], ['bh',[59, 44, 29, 14]], ['be', [43, 32, 21, 10]],['br', [69, 51, 34, 17]], ['ca',[63, 47, 31, 15]], ['cn',[55, 41, 27, 13]],
    ['eu',[50, 37, 25, 12]], ['fr', [48, 36, 24, 12]],['de', [67, 50, 33, 16]],
    ['jp',[55, 41, 27, 13]], ['gb',[48, 36, 24, 12]], ['it',[51, 38, 25, 12]],
    ['my',[55, 41, 27, 13]], ['mx', [70, 52, 35, 17]],['mc', [59, 44, 29, 14]],
    ['ru',[46, 34, 23, 11]], ['sg',[60, 45, 30, 15]], ['es',[62, 46, 31, 15]],
    ['us', [60, 45, 30, 15]], ['tr', [54, 40, 27, 13]], ['hu',[79, 59, 39, 19]],
    ['nl',[72, 59, 36, 19]]
  ]);

  // Prevent double-initialization of event listeners on SPA navigations
  if (!window.__strategyInit) {
    window.__strategyInit = true;
    initEvents();
  }

  if (!window.__igplus_strategy_state__) {
    const defaultCoeffs = Object.fromEntries(TYRES.map(t => [t,[0.6983736841, -0.08510976572]]));
    window.__igplus_strategy_state__ = {
      TRACK_INFO: null,
      CAR_ECONOMY: null,
      CAR_STRATEGY:[],
      RULES: null,
      DEFAULT_TYRE_COEFFICIENTS: defaultCoeffs,
      TYRE_COEFFICIENTS: structuredClone(defaultCoeffs)
    };
  }

  const STATE = window.__igplus_strategy_state__;

  // 2. MAIN ENTRY POINT
  async function strategy() {
    prepareStrategyContainer(1);

    try {
      const[
        { fetchCarData, fetchNextRace },
        { track_info, trackDictionary }, 
        { cleanHtml },
        active_scripts
      ] = await Promise.all([
        import(chrome.runtime.getURL('common/fetcher.js')),
        import(chrome.runtime.getURL('scripts/strategy/const.js')),
        import(chrome.runtime.getURL('scripts/strategy/utility.js')),
        chrome.storage.local.get('script')
      ]);

      const [carData, nextRaceSave, storageData] = await Promise.all([
        fetchCarData(),
        fetchNextRace(),
        chrome.storage.local.get({ tyreFuelModel: STATE.TYRE_COEFFICIENTS })
      ]);

      const carAttributes = cleanHtml(carData.vars.carAttributes);
      const flagElem = document.querySelector('.flag');
      const TRACK_CODE = flagElem ? flagElem.outerHTML.split("-")[1].split(" ")[0] : 'au';

      // Setup State
      STATE.CAR_ECONOMY = {
        fe: carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent,
        te: carAttributes.querySelector('[id=wrap-tyre_economy] .ratingVal').textContent,
        fuel: getFuelFn(carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent, storageData.tyreFuelModel),
        push: await getPushValues(),
        originalFe: carAttributes.querySelector('[id=wrap-fuel_economy] .ratingVal').textContent
      };

      STATE.TRACK_INFO = {
        ...track_info[TRACK_CODE],
        code: TRACK_CODE,
        laps: nextRaceSave.vars.raceLaps,
        raceLength: String(getLeagueLength(TRACK_CODE, nextRaceSave.vars.raceLaps))
      };

      const rules = JSON.parse(nextRaceSave.vars.rulesJson);
      STATE.RULES = { is2tyres: rules.two_tyres == 1, isRefuelling: rules.refuelling == 1 };

      // Initialize Cars
      const car1Strategy = getParsedStrategy(nextRaceSave.vars.d1StintCards);
      STATE.CAR_STRATEGY[0] = { carIndex: 1, strategyData: car1Strategy };
      makeCustomStrategy(1, car1Strategy, true);

      if (nextRaceSave.vars.d2Id) {
        const car2Strategy = getParsedStrategy(nextRaceSave.vars.d2StintCards);
        prepareStrategyContainer(2);
        STATE.CAR_STRATEGY[1] = { carIndex: 2, strategyData: car2Strategy };
        makeCustomStrategy(2, car2Strategy, true);
      }

      if (active_scripts.script?.sliderS) addFuelSlider();
      if (active_scripts.script?.editS) addEdit();

    } catch (error) {
      console.warn('IGPlus Strategy init error:', error);
    }
  }

  // 3. UI GENERATION & DOM MANIPULATION
  function prepareStrategyContainer(carIndex) {
    const originalStints = document.getElementById(`d${carIndex}StintCards`);
    const originalTotal = document.getElementById(`d${carIndex}TotalLaps`)?.parentElement;
    if (!originalStints) return;

    const reservedHeight = originalStints.offsetHeight + (originalTotal?.offsetHeight || 0);
    originalStints.style.display = 'none';
    if (originalTotal) originalTotal.style.display = 'none';

    if (!document.getElementById(`strategyRoot${carIndex}`)) {
      const root = document.createElement('div');
      root.id = `strategyRoot${carIndex}`;
      root.className = 'strategy-container';
      root.style.minHeight = `${reservedHeight}px`;
      
      root.innerHTML = `
        <div class="strategy-header">
          <div class="header-left"><div class="header-btn customSave popup-save-btn"></div></div>
          <div class="strategy-middle-container"><div class="controlCol"><div class="trash-zone">−</div><div class="add-stint">+</div></div></div>
          <div class="header-right"><div class="header-btn settings-btn">⚙</div></div>
        </div>
        <div class="stints-wrapper"></div>
        <div class="strategy-footer-container"></div>
      `;
      originalStints.parentElement.appendChild(root);

      const weatherSource = document.getElementById('d1SetupWrap')?.querySelector('a');
      if (weatherSource) {
        const clonedWeather = weatherSource.cloneNode(true);
        clonedWeather.classList.add('strategy-middle');
        //root.querySelector('.strategy-middle-container').appendChild(clonedWeather);
      }
    }
  }

  function makeCustomStrategy(carIndex, strategyData, skipGameSave = false) {
    STATE.CAR_STRATEGY[carIndex - 1] = { carIndex, strategyData };
    const root = document.getElementById(`strategyRoot${carIndex}`);
    if (!root) return;

    ensureWearCalculated(strategyData);
    ensureFuelDerived(strategyData);

    const wrapper = root.querySelector('.stints-wrapper');
    wrapper.innerHTML = ''; 
    wrapper.classList.toggle('two-tyre-warning', STATE.RULES.is2tyres && allStintsSameTyre(strategyData.stints));

    const frag = document.createDocumentFragment();
    strategyData.stints.forEach((stint, index) => frag.appendChild(createStint(stint, index, carIndex, strategyData)));

    const controlCol = root.getElementsByClassName('controlCol')[0];
    controlCol.className = 'controlCol';
    controlCol.replaceChildren(
      createTrashButton(carIndex, strategyData),
  createAddStintButton(carIndex, strategyData)
  
);
    //root.querySelector('.strategy-header').appendChild(controlCol);
    
    wrapper.appendChild(frag);

    const footerContainer = root.querySelector('.strategy-footer-container');
    footerContainer.innerHTML = '';
    footerContainer.appendChild(createStrategyFooter(strategyData));
    
    saveStintToForm(carIndex, strategyData);
    if (!skipGameSave) invokeGameSave();
  }

  function createStint(stint, index, carIndex, strategyData) {
    const el = document.createElement('div');
    el.className = 'stint';
    el.dataset.index = index;

    el.innerHTML = `
      <div class="stint-header">${index === 0 ? 'Start' : 'Pit ' + index}</div>
      <div class="stint-body">
          <div class="field customTyre custom${stint.tyre}">${stint.laps ?? '--'}</div>
          <div class="wear-label">${stint.wear ?? '--'}%</div>
          <div class="push-wrapper-igplus">
              <div class="field push customPush" data-push="${stint.push ?? 60}"></div>
              <div class="push-options">
                  ${PUSH_KEYS.slice().reverse().map(v => `<div class="push-option" data-value="${v}"></div>`).join('')}
              </div>
          </div>
      </div>`;

    attachDragLogic(el, carIndex, strategyData);
    return el;
  }

  function createStrategyFooter(strategyData) {
    const footer = document.createElement('div');
    footer.className = 'strategy-footer';

    const totalLaps = getTotalStrategyLaps(strategyData.stints);
    const raceLaps = STATE.TRACK_INFO.laps;
    const lapLength = STATE.TRACK_INFO.length;
    const fuelFor1Lap = (parseFloat(STATE.CAR_ECONOMY.fuel.M) + parseFloat(STATE.CAR_ECONOMY.push["60"])) * lapLength;

    footer.innerHTML = `
      <span class="laps-current">${totalLaps}</span><span class="laps-sep">/</span><span class="laps-total">${raceLaps}</span>
      <div class="footer-fuel"><span class="oneLap">${fuelFor1Lap.toFixed(2)}</span></div>
    `;

    footer.classList.add(totalLaps === raceLaps ? 'laps-ok' : (totalLaps > raceLaps ? 'laps-over' : 'laps-under'));

    if (!STATE.RULES.isRefuelling) {
      footer.querySelector('.footer-fuel').insertAdjacentHTML('beforeend', `<strong>${getTotalFuelEstimate(strategyData)}L</strong>`);
    }

    return footer;
  }

  // 4. CENTRALIZED EVENT ROUTER
  function initEvents() {
    document.addEventListener('click', async e => {
      const target = e.target;

      // Stepper Buttons
      if (target.closest('.step-btn')) {
        const btn = target.closest('.step-btn');
        const input = btn.closest('.stepper').querySelector('input');
        let val = parseFloat(input.value) || (+input.min || 0);
        val += (+input.step || 1) * (btn.classList.contains('plus') ? 1 : -1);
        input.value = Math.max(+input.min || -Infinity, Math.min(+input.max || Infinity, val));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      // Open Settings
      if (target.closest('.settings-btn')) {
        openStrategySettings();
        return;
      }

      // Open Popup
      if (target.closest('.popup-save-btn')) {
        const carIndex = target.closest('.strategy-container').id.replace('strategyRoot', '');
        openStrategyPopup(+carIndex, STATE.CAR_STRATEGY[carIndex - 1].strategyData);
        return;
      }

      // Stint Tyre Editing
      if (target.closest('.customTyre') && target.closest('.stint')) {
        const el = target.closest('.stint');
        const root = el.closest('.strategy-container');
        const carIndex = root.id.replace('strategyRoot', '');
        openStintEditor(+carIndex, STATE.CAR_STRATEGY[carIndex - 1].strategyData, +el.dataset.index);
        return;
      }

      // Stint Push Dropdowns
      if (target.closest('.push.customPush')) {
        const options = target.nextElementSibling;
        options.style.display = options.style.display === 'flex' ? 'none' : 'flex';
        options.style.flexDirection = 'column';
        return;
      }
      
      if (target.closest('.push-option')) {
        const opt = target.closest('.push-option');
        const stintEl = opt.closest('.stint');
        const carIndex = stintEl.closest('.strategy-container').id.replace('strategyRoot', '');
        const data = STATE.CAR_STRATEGY[carIndex - 1].strategyData;
        data.stints[+stintEl.dataset.index].push = Number(opt.dataset.value);
        makeCustomStrategy(carIndex, data);
        return;
      }

      document.querySelectorAll('.push-options[style*="flex"]').forEach(el => {
        if (!el.parentElement.contains(target)) el.style.display = 'none';
      });

      // Settings Modal Actions
      const modal = document.getElementById('strategySettings');
      if (modal && modal.contains(target)) {
        if (target.classList.contains('modal-close') || target.classList.contains('modal-cancel')) {
          modal.remove();
        } else if (target.classList.contains('modal-confirm')) {
          saveSettingsData(modal);
        } else if (target.closest('.toggle-header')) {
          modal.querySelector('#tyreFuelSection').classList.toggle('collapsed');
        } else if (target.closest('.feLabel')) {
          const feInput = modal.querySelector('[data-id=fe] input');
          feInput.value = parseInt(STATE.CAR_ECONOMY.originalFe);
          feInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      // Stint Editor Actions
      const editor = document.getElementById('stintEditor');
      if (editorContext && editor && (editor.contains(target) || target.classList.contains('editor-backdrop'))) {
        if (target.closest('.editor-tyres .customTyre')) {
          editor.querySelectorAll('.editor-tyres .customTyre').forEach(t => t.classList.remove('selected'));
          target.classList.add('selected');
          updateFuelDerived(editor, STATE.CAR_STRATEGY[editorContext.carIndex - 1].strategyData.stints[editorContext.index]);
          updateWearPreview();
        } else if (target.closest('.editor-push div')) {
          editor.querySelectorAll('.editor-push div').forEach(p => p.classList.remove('selected'));
          target.classList.add('selected');
          updateFuelDerived(editor, STATE.CAR_STRATEGY[editorContext.carIndex - 1].strategyData.stints[editorContext.index]);
          updateWearPreview();
        } else if (target.classList.contains('cancel') || target.classList.contains('editor-backdrop')) {
          editor.style.display = 'none';
          editorContext = null;
        } else if (target.classList.contains('confirm')) {
          saveStintEditorData(editor);
        }
      }
    });

    document.addEventListener('input', e => {
      const target = e.target;
      
      if (editorContext && target.closest('#stintEditor input[type=number]')) {
        const min = +target.min || 0;
        const max = +target.max || Infinity;
        target.value = Math.max(min, Math.min(max, +target.value));

        if (target.closest('#editor-fuel')) {
          updateFuelDerived(document.getElementById('stintEditor'), STATE.CAR_STRATEGY[editorContext.carIndex - 1].strategyData.stints[editorContext.index]);
        } else if (target.closest('#editor-laps')) {
          STATE.CAR_STRATEGY[editorContext.carIndex - 1].strategyData.stints[editorContext.index].laps = Math.floor(target.value);
          updateWearPreview();
        }
      }
      
      if (target.closest('#strategySettings')) {
        if (target.matches('.tyre-coef, .tyre-exp')) {
          let v = target.value.replace(/[^\d.-]/g, '');
          const parts = v.split('.');
          if (parts.length > 2) v = parts.shift() + '.' + parts.join('');
          if (v.indexOf('-') > 0) v = v.replace(/-/g, '');
          target.value = v;
        }
        updateAllFuelPreviews();
      }
    });

    document.addEventListener('blur', e => {
      if (e.target.matches('.tyre-coef, .tyre-exp')) {
        e.target.value = isNaN(parseFloat(e.target.value)) ? '' : parseFloat(e.target.value);
        updateAllFuelPreviews();
      }
    }, true);
  }

  // 5. GOOGLE SHEETS FETCHING
  async function readGSheets() {
    console.log('reading');
    if (document.getElementById('importedTable')) return;

    const storage = await chrome.storage.local.get({ gLink: '', gTrack: 'track', gLinkName: 'Sheet1' });
    if (!storage.gLink) return;

    const match = /spreadsheets\/d\/(.*)\/edit/.exec(storage.gLink);
    if (!match) return;
    
    const url = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?sheet=${storage.gLinkName}&tq=${encodeURIComponent('Select *')}&headers=1`;

    let data =[];
    let attempts = 3;

    while (attempts > 0) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        const cols = json.table.cols.map((c, i) => c.label || json.table.rows[0]?.c[i]?.v || `Col${i}`);
        
        data = json.table.rows.map(row => {
          const obj = {};
          cols.forEach((col, i) => obj[col] = row.c[i]?.v ?? '');
          return obj;
        });

        const { trackDictionary } = await import(chrome.runtime.getURL('scripts/strategy/const.js'));
        const trackCode = STATE.TRACK_INFO.code;
        const validNames = trackDictionary[trackCode] ||[];

        data = data.filter(r => {
          const tVal = r[storage.gTrack];
          return tVal && validNames.includes(isNaN(tVal) ? tVal.toLowerCase() : tVal);
        });

        if (data.length > 0) break;
      } catch (err) {
        console.warn("GSheets read error:", err);
      }
      attempts--;
      await new Promise(res => setTimeout(res, 2000));
    }

    if (data.length === 0) return;

    const table = document.createElement('table');
    table.id = 'importedTable';
    table.style.cssText = 'width: 100%; table-layout: auto; text-align: center;';

    let sortCol = null;
    let sortAsc = true;
    const colKeys = Object.keys(data[0]).filter(k => k.toLowerCase() !== storage.gTrack.toLowerCase());

    function renderTableBody() {
      const tbody = table.querySelector('tbody') || document.createElement('tbody');
      tbody.innerHTML = '';
      const frag = document.createDocumentFragment();
      data.forEach(row => {
        const tr = document.createElement('tr');
        colKeys.forEach(k => {
          const td = document.createElement('td');
          td.textContent = row[k];
          tr.appendChild(td);
        });
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
      if (!table.contains(tbody)) table.appendChild(tbody);
    }

    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    colKeys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k;
      th.style.cssText = 'font-family: "RobotoCondensed",sans-serif; cursor: pointer; background-color: #8f8f8f; color: #ffffff; border-radius: 5px;';
      th.onclick = () => {
        sortAsc = sortCol === k ? !sortAsc : true;
        sortCol = k;
        data.sort((a, b) => {
          let vA = a[k], vB = b[k];
          if (!isNaN(vA) && !isNaN(vB)) { vA = +vA; vB = +vB; }
          return (vA > vB ? 1 : vA < vB ? -1 : 0) * (sortAsc ? 1 : -1);
        });
        renderTableBody();
      };
      headTr.appendChild(th);
    });
    thead.appendChild(headTr);
    table.appendChild(thead);
    
    renderTableBody();
    if (document.getElementById('importedTable')) return;
    document.querySelector('[id=strategy] div.aStrat')?.append(table);
  }

  // 6. UTILITY FUNCTIONS
  function getLeagueLength(code, laps) {
    const trackLaps = RACE_LENGTH_MAP.get(code.toLowerCase());
    if (!trackLaps) return null;
    const idx = trackLaps.findIndex(v => Math.abs(v - Number(laps)) <= 2);
    return idx !== -1 ?[100, 75, 50, 25][idx] : null;
  }

  function allStintsSameTyre(stints) {
    return stints.length > 0 && stints.every(s => s.tyre === stints[0].tyre);
  }

  function getTotalStrategyLaps(stints) {
    return stints.reduce((sum, s) => sum + (Number.isFinite(+s.laps) ? +s.laps : 0), 0);
  }

  function getTotalFuelEstimate(strategyData) {
    return strategyData.stints.reduce((total, s) => {
      if (!s.laps) return total;
      const lapFuel = parseFloat(STATE.CAR_ECONOMY.fuel[s.tyre]) + parseFloat(STATE.CAR_ECONOMY.push[s.push]);
      return total + (lapFuel * STATE.TRACK_INFO.length * (+s.laps || 0));
    }, 0).toFixed(2);
  }

  function fuelToLaps(stint) {
    return parseFloat(stint.fuel) / ((STATE.CAR_ECONOMY.fuel[stint.tyre] + parseFloat(STATE.CAR_ECONOMY.push[stint.push])) * STATE.TRACK_INFO.length); 
  }

  function saveStintToForm(carIndex, data) {
    const form = document.getElementById(`d${carIndex}StintCards`)?.closest('form');
    if (!form) return;
    
    const inputs = {
      tyre: form.querySelectorAll('[name^="tyre"]'),
      fuel: form.querySelectorAll('[name^="fuel"]'),
      laps: form.querySelectorAll('[name^="laps"]')
    };

    const numPits = form.querySelector(`[name=numPits]`);
    if (numPits) numPits.value = data.stints.length - 1;

    const max = Math.max(inputs.tyre.length, inputs.fuel.length, inputs.laps.length);
    for (let i = 0; i < max; i++) {
      const s = data.stints[i];
      if (inputs.tyre[i]) inputs.tyre[i].value = s?.tyre ?? '';
      if (inputs.laps[i]) inputs.laps[i].value = s?.laps ?? 1;
      if (inputs.fuel[i]) {
        if (!STATE.RULES.isRefuelling) {
          inputs.fuel[i].value = i === 0 ? (document.getElementById(`d${carIndex}AdvancedFuel`)?.value || 0) : 0;
        } else {
          inputs.fuel[i].value = s?.fuel ?? 1;
        }
      }
    }
  }

  function invokeGameSave() {
    document.getElementById('d1strategyAdvanced')?.querySelector('.tyreSelectInput td:not(.inactive)')?.click();
  }

  function getParsedStrategy(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const jsonEl = doc.querySelector('script[id$="StrategyJson"]');
    if (!jsonEl) return { stints:[] };

    const json = JSON.parse(jsonEl.textContent);
    const stints = Object.keys(json.stint).sort((a,b)=>a-b).map(k => ({
      tyre: json.stint[k].tyre ?? '--',
      fuel: Number(json.stint[k].fuel) ?? 0,
      laps: Number(json.stint[k].laps) ?? 0,
      wear: null,
      push: json[2] ?? 60
    }));
    return { stints: stints.slice(0, Number(json.stints ?? stints.length)) };
  }

  function createAddStintButton(carIndex, strategyData) {
    const btn = document.createElement('div');
    btn.className = 'add-stint';
    btn.textContent = '+';
    btn.onclick = () => {
      strategyData.stints.push(structuredClone(strategyData.stints.at(-1)));
      makeCustomStrategy(carIndex, strategyData);
    };
    return btn;
  }

  function createTrashButton(carIndex, strategyData) {
    const btn = document.createElement('div');
    btn.className = 'trash-zone';
    btn.textContent = '−';
    btn.onclick = () => {
      if (strategyData.stints.length > 2) {
        strategyData.stints.pop();
        makeCustomStrategy(carIndex, strategyData);
      }
    };
    return btn;
  }

  async function getPushValues() {
    const { pushLevels } = await chrome.storage.local.get({ pushLevels:[-0.007, -0.004, 0, 0.01, 0.02] });
    return { 20: pushLevels[0], 40: pushLevels[1], 60: pushLevels[2], 80: pushLevels[3], 100: pushLevels[4] };
  }

  function injectCircuitMap() {
    if (document.getElementById('customMap')) return;
    try {
      const code = document.querySelector('.flag')?.outerHTML.split("-")[1].split(" ")[0] ?? 'au';
      const target = document.querySelector('[id="strategy"] div:not(.checkbox-wrapper)');
      if(target) {
        target.insertAdjacentHTML('beforeend', `<a href="d=circuit&id=1&tab=history"><img id="customMap" src="${chrome.runtime.getURL(`images/circuits/${code}_dark.png`)}" style="width:100%;"></a>`);
      }
    } catch(e) {}
  }

  // 7. DRAG & DROP LOGIC
  function attachDragLogic(stintEl, carIndex, strategyData) {
    const header = stintEl.querySelector('.stint-header');
    let pointerId = null;
    header.style.touchAction = 'none';

    header.addEventListener('pointerdown', e => {
      e.preventDefault();
      draggedStint = stintEl;
      pointerId = e.pointerId;
      stintEl.classList.add('dragging');
      
      dragPreview = stintEl.cloneNode(true);
      dragPreview.classList.add('drag-preview');
      document.body.appendChild(dragPreview);
      
      dragPreview.style.left = `${e.clientX + 10}px`;
      dragPreview.style.top = `${e.clientY + 10}px`;
      header.setPointerCapture(pointerId);
    });

    header.addEventListener('pointermove', e => {
      if (!draggedStint || pointerId !== e.pointerId) return;
      if (dragPreview) {
        dragPreview.style.left = `${e.clientX + 10}px`;
        dragPreview.style.top = `${e.clientY + 10}px`;
      }
      
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.stint');
      document.querySelectorAll('.edge-left, .edge-right, .edge-center').forEach(el => el.className = el.className.replace(/edge-\w+/g, ''));
      
      if (target && target !== draggedStint) {
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        target.classList.add(x < rect.width * 0.25 ? 'edge-left' : (x > rect.width * 0.75 ? 'edge-right' : 'edge-center'));
      }
    });

    header.addEventListener('pointerup', e => {
      if (!draggedStint || pointerId !== e.pointerId) return;
      header.releasePointerCapture(pointerId);
      pointerId = null;

      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.stint');
      document.querySelectorAll('.edge-left, .edge-right, .edge-center').forEach(el => el.className = el.className.replace(/edge-\w+/g, ''));
      if (dragPreview) { dragPreview.remove(); dragPreview = null; }
      stintEl.classList.remove('dragging');

      if (target && target !== draggedStint) {
        const from = +draggedStint.dataset.index;
        const to = +target.dataset.index;
        const rect = target.getBoundingClientRect();
        const isLeft = (e.clientX - rect.left) < rect.width * 0.25;
        const isRight = (e.clientX - rect.left) > rect.width * 0.75;

        if (!isLeft && !isRight) {
          strategyData.stints[to] = structuredClone(strategyData.stints[from]);
        } else {
          const targetIdx = isLeft ? to : to + 1;
          const [moved] = strategyData.stints.splice(from, 1);
          strategyData.stints.splice(targetIdx > from ? targetIdx - 1 : targetIdx, 0, moved);
        }
        makeCustomStrategy(carIndex, strategyData);
      }
      draggedStint = null;
    });
  }

  // 8. STINT EDITOR LOGIC
  function calculateWearPreview({ tyre, push, laps, fuel }) {
    return getWearFn(tyre, laps, STATE.TRACK_INFO, STATE.CAR_ECONOMY, STATE.TRACK_INFO.raceLength);
  }

  function updateWearPreview() {
    const editor = document.getElementById('stintEditor');
    const tyre = editor.querySelector('.editor-tyres .selected')?.dataset.tyre;
    const push = +editor.querySelector('.editor-push .selected')?.dataset.push;
    const laps = STATE.RULES.isRefuelling 
      ? Math.floor(editor.querySelector('.fuel-laps').textContent) 
      : +editor.querySelector('#editor-laps input')?.value || 1;
    const fuel = +editor.querySelector('#editor-fuel input')?.value;

    if (tyre && push) {
      editor.querySelector('.wear-value').textContent = `${calculateWearPreview({ tyre, push, laps, fuel })}%`;
    }
  }

  function ensureWearCalculated(data) {
    data.stints.forEach(s => {
      if (s.wear == null) s.wear = calculateWearPreview({ tyre: s.tyre, push: s.push ?? 60, laps: s.laps, fuel: s.fuel });
    });
  }

  function updateFuelDerived(editor, stint) {
    const fuelInput = editor.querySelector('#editor-fuel input');
    const label = editor.querySelector('.fuel-laps');
    if (!fuelInput || !label || isNaN(+fuelInput.value)) return;

    const push = editor.querySelector('.customPush.selected').dataset.push;
    const tyre = editor.querySelector('.customTyre.selected').dataset.tyre;
    const laps = fuelToLaps({ fuel: +fuelInput.value, push, tyre });

    label.textContent = laps.toFixed(1);
    stint.laps = Math.floor(laps);
    updateWearPreview();
  }

  function ensureFuelDerived(data) {
    data.stints.forEach(s => {
      if (STATE.RULES.isRefuelling && s.fuel != null) s.laps = Math.floor(fuelToLaps(s));
    });
  }

  function ensureStintEditor() {
    if (document.getElementById('stintEditor')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="stintEditor">
        <div class="editor-backdrop"></div>
        <div class="editor-panel">
          <div class="editor-section"><div class="editor-tyres">${TYRES.map(t => `<div data-tyre="${t}" class="customTyre custom${t}"></div>`).join('')}</div></div>
          <div class="editor-section" id="editor-laps"><label>Laps</label><div class="stepper"><div class="step-btn minus">−</div><input type="number" min="1" max="80" step="1" /><div class="step-btn plus">+</div></div></div>
          <div class="editor-section" id="editor-fuel"><label>Fuel</label><div class="stepper"><div class="step-btn minus">−</div><input type="number" min="1" max="300" step="1" /><div class="step-btn plus">+</div></div><div class="fuel-derived">≈ <span class="fuel-laps">--</span> laps</div></div>
          <div class="editor-section"><div class="editor-push">${PUSH_KEYS.map(p => `<div class="customPush" data-push="${p}"></div>`).join('')}</div></div>
          <div class="editor-section editor-wear"><label>Estimated Wear</label><div class="wear-preview"><span class="wear-value">--%</span></div></div>
          <div class="editor-actions"><div class="editor-btn cancel" title="Cancel">✕</div><div class="editor-btn confirm" title="Confirm">✔</div></div>
        </div>
      </div>
    `);
  }

  function openStintEditor(carIndex, strategyData, index) {
    ensureStintEditor();
    const editor = document.getElementById('stintEditor');
    const stint = strategyData.stints[index];
    editorContext = { carIndex, strategyData, index };

    editor.style.display = 'block';
    editor.querySelector('#editor-laps').style.display = STATE.RULES.isRefuelling ? 'none' : 'flex';
    editor.querySelector('#editor-fuel').style.display = STATE.RULES.isRefuelling ? 'flex' : 'none';

    editor.querySelectorAll('.editor-tyres .customTyre').forEach(t => t.classList.toggle('selected', t.dataset.tyre === stint.tyre));
    editor.querySelectorAll('.editor-push div').forEach(p => p.classList.toggle('selected', +p.dataset.push == stint.push));
    
    editor.querySelector('#editor-laps input').value = stint.laps ?? '';
    editor.querySelector('#editor-fuel input').value = stint.fuel ?? '';

    if (STATE.RULES.isRefuelling) updateFuelDerived(editor, stint);
    else updateWearPreview();
  }

  function saveStintEditorData(editor) {
    const { carIndex, strategyData, index } = editorContext;
    const stint = strategyData.stints[index];

    stint.tyre = editor.querySelector('.editor-tyres .selected')?.dataset.tyre || stint.tyre;
    stint.push = +editor.querySelector('.editor-push .selected')?.dataset.push || stint.push;
    
    if (STATE.RULES.isRefuelling) stint.fuel = +editor.querySelector('#editor-fuel input').value;
    else stint.laps = +editor.querySelector('#editor-laps input').value;

    stint.wear = calculateWearPreview(stint);
    
    editor.style.display = 'none';
    editorContext = null;
    makeCustomStrategy(carIndex, strategyData);
  }

  // 9. SETTINGS MODAL LOGIC
  function createStepperHTML(id, value, step, min, max) {
    return `
      <div class="stepper" data-id="${id}">
        <span class="step-btn minus">−</span>
        <input type="number" value="${value}" step="${step}" min="${min}" max="${max}">
        <span class="step-btn plus">+</span>
      </div>
    `;
  }

  function getTyreCoefficient(row) {
    const tyre = row.dataset.tyre;
    const [defC, defE] = STATE.TYRE_COEFFICIENTS[tyre];
    const c = parseFloat(row.querySelector('.tyre-coef').value);
    const e = parseFloat(row.querySelector('.tyre-exp').value);
    return[isNaN(c) ? defC : c, isNaN(e) ? defE : e];
  }

  function updateAllFuelPreviews() {
    const modal = document.getElementById('strategySettings');
    if (!modal) return;
    
    const fe = parseFloat(modal.querySelector('[data-id=fe] input').value) || STATE.CAR_ECONOMY.fe;
    const push60 = parseFloat(modal.querySelector('[data-id="push-60"] input').value) || STATE.CAR_ECONOMY.push["60"];

    modal.querySelectorAll('.tyre-row').forEach(row => {
      const tyre = row.dataset.tyre;
      const[coef, exp] = getTyreCoefficient(row);
      const fuelPerKm = getFuelFn(fe, { [tyre]: [coef, exp] })[tyre];
      row.querySelector('.customTyre').textContent = ((parseFloat(fuelPerKm) + push60) * STATE.TRACK_INFO.length).toFixed(2);
    });
  }

  async function openStrategySettings() {
    if (document.getElementById('strategySettings')) return;

    const pushMap = await getPushValues();
    const { tyreFuelModel } = await chrome.storage.local.get({ tyreFuelModel: STATE.DEFAULT_TYRE_COEFFICIENTS });
    const lapLength = STATE.TRACK_INFO.length;
    const tempFuel = getFuelFn(STATE.CAR_ECONOMY.fe, tyreFuelModel);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="strategySettings" class="strategy-modal">
        <div class="modal-content">
          <div class="modal-section">
            ${PUSH_KEYS.map(k => `<div class="stepper-row"><span class="push-symbol" data-push="${k}"></span>${createStepperHTML(`push-${k}`, pushMap[k], 0.001, -0.1, 0.1)}</div>`).join('')}
          </div>
          <hr class="modal-separator">
          <div class="modal-section-fuel">
             <span class="fuel-symbol feLabel"></span><span>FE</span>
            ${createStepperHTML('fe', STATE.CAR_ECONOMY.fe, 1, 1, 300)}
          </div>
          <hr class="modal-separator">
          <div class="modal-section fuel-model-section collapsed" id="tyreFuelSection">
            <div class="section-title toggle-header">
              <span class="chevron">▶</span> Fuel Model <span class="formula-preview">C × FE<sup>E</sup> = L / km</span>
            </div>
            <div class="toggle-body">
              <div class="tyre-header-row"><span class="col-title">Coefficient (C)</span><span class="col-title">Exponent (E)</span><span>One Lap</span></div>
              ${TYRES.map(t => {
                const[defC, defE] = STATE.DEFAULT_TYRE_COEFFICIENTS[t];
                const[curC, curE] = tyreFuelModel[t];
                return `
                  <div class="tyre-row" data-tyre="${t}">
                    <input type="text" placeholder="default" class="tyre-coef" inputmode="decimal" value="${curC === defC ? '' : curC}">
                    <input type="text" placeholder="default" class="tyre-exp" inputmode="decimal" value="${curE === defE ? '' : curE}">
                    <div class="customTyre custom${t}">${((parseFloat(tempFuel[t]) + parseFloat(STATE.CAR_ECONOMY.push["60"])) * lapLength).toFixed(2)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="modal-actions"><span class="modal-cancel">✕</span><span class="modal-confirm">✔</span></div>
        </div>
      </div>
    `);
  }

  async function saveSettingsData(modal) {
    const pushLevels =[];
    const newPushMap = {};

    PUSH_KEYS.forEach(k => {
      const val = parseFloat(modal.querySelector(`[data-id="push-${k}"] input`).value);
      newPushMap[k] = val;
      pushLevels.push(val);
    });

    const fe = parseFloat(modal.querySelector(`[data-id="fe"] input`).value);
    await chrome.storage.local.set({ pushLevels });

    const updated = {};
    modal.querySelectorAll('.tyre-row').forEach(row => {
      updated[row.dataset.tyre] = getTyreCoefficient(row);
    });

    STATE.TYRE_COEFFICIENTS = updated;
    STATE.CAR_ECONOMY.push = newPushMap;
    STATE.CAR_ECONOMY.fe = fe;
    STATE.CAR_ECONOMY.fuel = getFuelFn(fe, STATE.TYRE_COEFFICIENTS);

    await chrome.storage.local.set({ tyreFuelModel: updated });
    modal.remove();

    STATE.CAR_STRATEGY.forEach(({ carIndex, strategyData }) => makeCustomStrategy(carIndex, strategyData));
  }

  // 10. SAVING & POPUP LOGIC
  function hashCode(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = ((hash << 5) - hash) + string.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }

  function decodeTyre(tsTyre) { return tsTyre?.replace('ts-', '') ?? 'M'; }
  function encodeTyre(tyre) { return `ts-${tyre}`; }

  function strategyDataToLegacySave(strategyData) {
    const PUSH_MAP = { 100: 1, 80: 2, 60: 3, 40: 4, 20: 5 };
    const save = {
      track: STATE.TRACK_INFO.code,
      length: String(getLeagueLength(STATE.TRACK_INFO.code, STATE.TRACK_INFO.laps)),
      laps: { total: STATE.TRACK_INFO.laps, doing: getTotalStrategyLaps(strategyData.stints) },
      stints: {}
    };
    strategyData.stints.forEach((s, i) => { save.stints[i] = { tyre: encodeTyre(s.tyre), laps: String(s.laps), push: PUSH_MAP[s.push] ?? 2 }; });
    return save;
  }

  function legacySaveToStrategyData(save) {
    const PUSH_MAP = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
    const stints =[];
    Object.keys(save.stints).sort((a, b) => a - b).forEach(i => {
      const s = save.stints[i];
      const pushIdx = PUSH_MAP[s.push] ?? 60;
      const laps = Number(s.laps);
      const fuel = Math.ceil((parseFloat(STATE.CAR_ECONOMY.fuel[decodeTyre(s.tyre)]) + parseFloat(STATE.CAR_ECONOMY.push[pushIdx])) * STATE.TRACK_INFO.length * laps);
      stints.push({ tyre: decodeTyre(s.tyre), laps, fuel, wear: null, push: pushIdx });
    });
    return { stints };
  }

  async function saveCurrentStrategy(strategyData) {
    const trackCode = STATE.TRACK_INFO.code;
    const legacySave = strategyDataToLegacySave(strategyData);
    const hash = hashCode(JSON.stringify(legacySave));
    const storage = await chrome.storage.local.get({ save: {} });
    if (!storage.save[trackCode]) storage.save[trackCode] = {};
    storage.save[trackCode][hash] = legacySave;
    await chrome.storage.local.set({ save: storage.save });
  }

  function renderStrategyPreview(stints, container) {
    container.innerHTML = stints.map(s => `<div class="customTyre custom${s.tyre}">${s.laps}</div>`).join('');
  }

  function ensureStrategyPopup() {
    if (document.getElementById('strategyPopup')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="strategyPopup">
        <div class="popup-backdrop popup-close"></div>
        <div class="popup-panel">
          <div class="popup-header"><span class="popup-close">✕</span></div>
          <div class="popup-section-preview"><button class="popup-save-btn popup-save"></button><div id="currentStrategyPreview" class="strategy-preview"></div></div>
          <div class="popup-section"><div id="savedStrategiesList"></div></div>
        </div>
      </div>
    `);
    document.querySelectorAll('#strategyPopup .popup-close').forEach(el => el.onclick = () => document.getElementById('strategyPopup').style.display = 'none');
  }

  async function openStrategyPopup(carIndex, strategyData) {
    ensureStrategyPopup();
    const popup = document.getElementById('strategyPopup');
    popup.style.display = 'flex';
    renderStrategyPreview(strategyData.stints, document.getElementById('currentStrategyPreview'));

    popup.querySelector('.popup-save-btn').onclick = async () => {
      await saveCurrentStrategy(strategyData);
      await populateSavedStrategies(carIndex);
    };
    await populateSavedStrategies(carIndex);
  }

  async function populateSavedStrategies(carIndex) {
    const { createDeleteButton } = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
    const list = document.getElementById('savedStrategiesList');
    list.innerHTML = '';

    const { save } = await chrome.storage.local.get({ save: {} });
    if (!save[STATE.TRACK_INFO.code]) {
      list.innerHTML = '<div class="empty">No saved strategies</div>';
      return;
    }

    Object.entries(save[STATE.TRACK_INFO.code]).forEach(([hash, legacySave]) => {
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

      const delBtn = createDeleteButton();
      delBtn.onclick = async () => {
        delete save[STATE.TRACK_INFO.code][hash];
        await chrome.storage.local.set({ save });
        populateSavedStrategies(carIndex);
      };

      const left = document.createElement('div'); left.className = 'saved-left'; left.appendChild(loadBtn);
      const right = document.createElement('div'); right.className = 'saved-right'; right.appendChild(delBtn);
      
      item.append(left, preview, right);
      list.appendChild(item);
    });
  }

  // 11. FUEL SLIDERS & EDITS
  function addEdit() {
    const advancedFuel = document.getElementsByName('advancedFuel');
    if (!advancedFuel) return;

    advancedFuel.forEach(car => {
      if (!car.getAttribute('event')) {
        const text = car.parentElement.querySelectorAll('.num')[0];
        text.contentEditable = true;
        text.classList.add("withSlider");
        text.classList.remove("green");
        
        text.addEventListener('click', function() {
          if (this.textContent != '') this.parentElement.nextElementSibling.value = this.textContent;
          this.textContent = '';
        });
        
        text.addEventListener('focusout', function() {
          this.textContent = this.parentElement.nextElementSibling.value;
        });
        
        text.addEventListener('input', function(e) {
          const stored = this.parentElement.nextElementSibling;
          if (!e.data?.match(/^[0-9]{0,2}$/)) this.textContent = '';
          
          let currentValue = parseInt(this.textContent);
          if (isNaN(currentValue)) currentValue = stored.value;
          if (currentValue > parseInt(stored.max)) {
            this.textContent = stored.max;
            currentValue = stored.max;
          } 
          if (currentValue == 0) {
            const driverId = this.closest('form').id;
            document.getElementsByName('fuel1')[driverId[1] - 1].value = 0;
          }
          stored.value = currentValue;
        });
        car.setAttribute('event', true);
      }
    });
  }

  function createSlider(node, min, max) {
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

    const getRangePercent = (s) => ((s.value - s.min) / (s.max - s.min)) * 100;

    slider.addEventListener('input', function() {
      sliderLabelTrack.append(settingValueDiv);
      settingValueDiv.textContent = this.value;
      settingValueDiv.classList.add('slider-label');
      settingValueDiv.style.left = getRangePercent(slider) + '%';
    });

    slider.addEventListener('change', function() {
      settingValueDiv.classList.remove('slider-label');
      sliderContainer.classList.remove('visible');
      const parent = slider.closest(".igpNum");
      parent.insertBefore(settingValueDiv, parent.lastChild);
      slider.parentElement.parentElement.nextElementSibling.value = slider.value;
      if (slider.value == 0) {
        const driverId = this.closest('form').id;
        document.getElementsByName('fuel1')[driverId[1] - 1].value = 0;
      }
    });

    settingValueDiv.addEventListener('click', function() {
      if (!sliderContainer.classList.contains('visible')) {
        sliderLabelTrack.append(settingValueDiv);
        sliderContainer.classList.add('visible');
        settingValueDiv.classList.add('slider-label');
        settingValueDiv.style.left = getRangePercent(slider) + '%';
      } else {
        sliderContainer.classList.remove('visible');
        settingValueDiv.classList.remove('slider-label');
        const parent = slider.closest(".igpNum");
        parent.insertBefore(settingValueDiv, parent.lastChild);
      }
    });

    sliderContainer.append(slider);
    settingValueDiv.classList.add('withSlider');
    node.previousElementSibling.prepend(sliderContainer);
  }

  function addFuelSlider() {
    const advancedFuel = document.getElementsByName('advancedFuel');
    if (advancedFuel) {
      advancedFuel.forEach(car => {
        if (car.previousElementSibling.childElementCount < 4) createSlider(car, 0, 200);
      });
    }
  }

  // 12. BOOTSTRAP INITIALIZATION
  (async () => {
    try {
      await new Promise(res => setTimeout(res, 0));
      
      if (!getWearFn || !getFuelFn) {
        const mod = await import(chrome.runtime.getURL('scripts/strategy/strategyMath.js'));
        getFuelFn = mod.fuel_calc;
        getWearFn = mod.get_wear;
      }

      if (!document.getElementById('igplus_strategy')) {
        const cssContent = await fetch(chrome.runtime.getURL('css/strategy.css')).then(r => r.text());
        const style = document.createElement("div");
        style.id = "igplus_strategy";
        style.innerHTML = `<style>${cssContent}</style>`;
        document.body.append(style);
      }

      if (!document.getElementById(`strategyRoot1`)) {
        readGSheets();
        strategy();
        injectCircuitMap();
      }
    } catch (err) {
      console.warn('Strategy module load issue:', err);
    }
  })();

})();
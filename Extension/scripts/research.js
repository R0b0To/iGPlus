async function initResearch(){
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  if(!document.getElementById('carsReviewBtn')){
    await delay(500);
  }else{
    console.log('-------------------------------------only once');
    const gameResearchBtn = document.getElementById('carsReviewBtn');
    gameResearchBtn.addEventListener('click',toggleCustomResearchTable);
    document.getElementById('researchInline').classList.add('hidden-away');
    const toggleOriginalResearchBtn = document.createElement('div');
    const designBtn = document.getElementById('nDesignPoints');
    toggleOriginalResearchBtn.id = 'toggleOriginalResearch';
    toggleOriginalResearchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" height="38px" width="38px"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/></svg>`;
    toggleOriginalResearchBtn.classList.add('hide','left','customResearchBtn');
    toggleOriginalResearchBtn.addEventListener('click',toggleOriginalResearchTable);
    designBtn.addEventListener('click',removeOther);
    gameResearchBtn.parentElement.insertBefore(toggleOriginalResearchBtn,gameResearchBtn);
    window.__initResearch = true;
  }
  
}
function removeOther(){
  const toggleOriginalResearchBtn = document.getElementById('toggleOriginalResearch');
  const statsTable = document.getElementById('statsTable');
  const originalResearchTable = document.getElementById('researchInline');
  statsTable.classList.add('hide');
  originalResearchTable.classList.add('hidden-away');
  toggleOriginalResearchBtn.classList.add('hide');

}


function toggleOriginalResearchTable() {
  const statsTable = document.getElementById('statsTable');
  const originalResearchTable = document.getElementById('researchInline');

  originalResearchTable.classList.toggle('hidden-away');
  statsTable.classList.toggle('hide', !originalResearchTable.classList.contains('hidden-away'));
}



(async () => {
  
  if(!document.getElementById('statsTable')){
    await initResearch();
    enhanceResearchTable();
  }
  
})();

async function toggleCustomResearchTable(){ 
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
    
  const statsTable = document.getElementById('statsTable');
  statsTable.classList.toggle('hide');
  const gameResearchBtn = document.getElementById('carsReviewBtn');
  const toggleOriginalResearchBtn = gameResearchBtn.previousElementSibling;

  await delay(50);
  if(gameResearchBtn.classList.contains('btn2')){
    toggleOriginalResearchBtn.classList.remove('hide');
  }
  else{
    toggleOriginalResearchBtn.classList.add('hide');

    //document.getElementById('carAttributesDisplay').classList.remove('hide');

  }

}
function syncCheckboxes(target) {
  target.click();

  //target.checked = source.checked;
}
function countChecked(checkboxes) {
  let count = 0;
  checkboxes.forEach(cb => {
    if (cb.checked) count++;
  });
  return count;
}

async function enhanceResearchTable() {

  
  const { language } = await chrome.storage.local.get({ language: 'en' });
  const { language: i18n } = await import(chrome.runtime.getURL('common/localization.js'));
  //const { findCurrentTier} = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
  
  //const tier = await findCurrentTier();

  const researchPowerSpan = document.createElement('div');
  
  if (document.getElementById('statsTable') == null) {
    const statsTable = document.createElement('table');
    statsTable.id = 'statsTable';
    statsTable.classList.add('acp', 'hoverCopy','hide');
    //statsTable.style.width = 'auto'; // important to have it here, otherwise game's .acp overwrites it always
    
    const header = document.createElement('thead');
    header.append(
      document.createElement('th'),
      createHeaderWithImage('images/user.svg'),
      createHeaderWithImage('images/users.svg'),
      createHeaderWithImage('images/gap.svg'),
      createHeaderWithImage('images/research.svg'),
      document.createElement('th')
    );
    statsTable.append(header);

    const gameTable = document.getElementById('researchInline');

    /** @type { NodeListOf<HTMLDivElement> } */
    const ratingBars = gameTable.querySelectorAll('.ratingBar');
    const checkboxInput = gameTable.querySelectorAll('[name="c[]"]');
    const currentResearchPower = 10/countChecked(checkboxInput)/100 || 0;
    const researchStatsRows = [...ratingBars].map( (bar, index) => {
      // this will hide Comparsion column for narrow screens
      //gameTable.tHead.rows[0].cells[2].className = 'ratings';
      bar.parentElement.classList.add('ratings');

      const row = document.createElement('tr');
      row.className = 'hoverCopyTr';
      const scaleFactor = 3;
      const bestTeamValue = /(\d+)/.exec(bar.querySelector('svg').style.left)[0] * scaleFactor;
      const myValue = bar.previousSibling.lastChild.textContent;
      const clonedCheckbox = checkboxInput[index].parentElement.cloneNode(true);
      const clonedInput = clonedCheckbox.querySelector('input');
      const clonedId = `${clonedCheckbox.querySelector('input').id}-clone`;
      clonedInput.id = clonedId;
      clonedCheckbox.querySelector('label').setAttribute('for',clonedId);

      checkboxInput[index].addEventListener('change', () =>  {
        
        clonedInput.checked = checkboxInput[index].checked;

      });

      clonedInput.addEventListener('change', () =>  {
          //simulate click to invoke save button from game
          syncCheckboxes(checkboxInput[index])
          weightedResearch();
          calculateTotalResearchGain()

      });

      const ratingGap = bestTeamValue - myValue;
      const isChecked = checkboxInput[index].checked;
      row.dataset.id = bar.parentElement.parentElement.querySelector('input').value;
    

      let gain = 0;
      if (isChecked) {
        gain = Math.ceil(ratingGap * currentResearchPower);
      }

      row.append(createTd(myValue), createTd(bestTeamValue), createTd(ratingGap), createTd(gain),clonedCheckbox);

      return row;
    });
    
    const body = document.createElement('tbody');
    body.append(...researchStatsRows);
    statsTable.append(body);

    // TODO improve this. Looks like sponsor values are inaccurate if get the diff from rating bars
    try {
      const currentCarAttributes = [...document.querySelectorAll('#carAttributesDisplay .ratingVal')].map((node,index) => ({
        id: researchStatsRows[index].dataset.id,
        value: node.textContent
      }));
      researchStatsRows.forEach((row) => {
        const rowId = row.dataset.id;
        const currentValue = currentCarAttributes.find(({ id }) => id.includes(rowId)).value;
        const sponsorEffect = currentValue - row.childNodes[0].textContent;

        if (sponsorEffect) {
          row.childNodes[0].append(realCarDiff(sponsorEffect));
        }
      });
    } catch (error) {
      console.log(error);
      //happens when page is refreshed or loaded directly instead of being opened from the button. The sponsor values are being retrieved from https://igpmanager.com/app/p=cars so if the page is not loaded before it won't find the elements.
    }

    const helpmark = createHelpButton(i18n[language].researchHelp);

    const tfoot = document.createElement('tfoot');
    tfoot.classList.add('researchFooter');

    const thf = document.createElement('th');
    thf.colSpan = 3;

    const total = document.createElement('td');
    total.id = 'totalGain';

    tfoot.append(helpmark, thf, total,document.createElement('td'));
    statsTable.append(tfoot);
    const attributes_icons = Array.from(document.getElementById('researchInline').querySelectorAll('.attribute-icon.tooltip'));
    Array.from(statsTable.rows).forEach((row, index) => {
      const newCell = row.insertCell(0); // Insert new cell
      newCell.append(attributes_icons[index].cloneNode(true)); // Append node
  });
    const location = document.getElementById('carAttributesDisplay');
    gameTable.parentElement.insertBefore(statsTable,location);
  }
  
  weightedResearch();
  calculateTotalResearchGain();
}



function createTd(value) {
  const ele = document.createElement('td');
  ele.className = 'hoverCopyTd';
  ele.textContent = value;
  
  ele.addEventListener("mouseover", function() {
    let colIndex = [...this.parentNode.children].indexOf(this); // Get column index

    document.querySelectorAll(`.hoverCopyTr .hoverCopyTd:nth-child(${colIndex + 1})`)
        .forEach(cell => cell.classList.add("highlight"));
});
  ele.addEventListener("mouseleave", function() {
  document.querySelectorAll(".hoverCopyTd").forEach(cell => cell.classList.remove("highlight"));
});


  ele.addEventListener('click', copyColumnData);
  ele.setAttribute('style', 'height:32px;text-align: center;');

  return ele;
}

function createHeaderWithImage(imgUrl) {
  const iconUrl = chrome.runtime.getURL(imgUrl);
  const image = document.createElement('img');
  image.src = iconUrl;
  image.classList.add('researchImg');

  const header = document.createElement('th');
  header.classList.add('statColTh');
  header.append(image);

  return header;
}

/**
 * @param {number} val
 * @returns {HTMLSpanElement}
 */
function realCarDiff(val) {
  const sponsorSpan = document.createElement('span');
  sponsorSpan.classList.add('sponsorEffect', val > 0 ? 'positiveEffect' : 'negativeEffect');

  sponsorSpan.textContent = val;

  return sponsorSpan;
}

async function copyColumnData() {
  const columnIndex = this.cellIndex;
  const table = this.closest('tbody');

  let csv = '';
  for (let item of table.rows) {
    csv += `${item.childNodes[columnIndex].childNodes[0]?.textContent ?? ''}\n`;
  }

  await navigator.clipboard.writeText(csv);
  console.log('text copied');
}

function getStatsForResearchField(statsTableRows, fieldId) {
  const fieldRow = statsTableRows.find((r) => r.dataset.id === fieldId);
  const value = parseInt(fieldRow.cells[1].textContent);
  const gap = parseInt(fieldRow.cells[3].textContent);
  return { value, gap };
}

function getWeightedResearchGain({ value, gap }, rPower, code) {
  // research field names are data-id for a row in statsTable
  const weight = {
    acceleration: 1,
    handling: 0.8,
    braking: 0.5,
    downforce: 0.3,
    fuel_economy: 0.1,
    tyre_economy: 0.1,
    cooling: 0.01,
    reliability: 0.01
  };

  return (2.23 + 4.23 * Math.log(value + gap * rPower) - (2.23 + 4.23 * Math.log(value))) * weight[code];
}

function weightedResearch() {
  const gameTable = document.getElementById('researchInline')
  const checkboxInput = gameTable.querySelectorAll('[name="c[]"]');
  const currentResearchPower = 10/countChecked(checkboxInput)/100 || 0;
  const statsTable = document.getElementById('statsTable');

  const mainResearchFields = ['acceleration', 'braking', 'handling', 'downforce'];
  if (statsTable != null) {
    const statsTableRows = [...statsTable.rows];
    const carDesign = {};

    mainResearchFields.forEach((field) => {
      const design = getStatsForResearchField(statsTableRows, field);
      carDesign[field] = getWeightedResearchGain(design, currentResearchPower, field);
    });

    const bestWResearch = Math.max(...Object.values(carDesign));

    statsTableRows.forEach((row) => {
      row.classList.remove('researchSuggestion');
    });

    if (bestWResearch > 0) {
      const bestKeys = Object.keys(carDesign).filter((key) => carDesign[key] === bestWResearch);
      bestKeys.forEach((key) => {
        statsTableRows.find((r) => r.dataset.id === key).classList.add('researchSuggestion');
      });
    }
  }
}

function createHelpButton(text) {
  const fieldTip = document.createElement('span');
  fieldTip.id = 'fieldtip';

  const helpLabel = document.createElement('span');
  helpLabel.textContent = '?';
  helpLabel.classList.add('helpLabel');

  helpLabel.setAttribute('data-helptext', text);

  // show help text
  helpLabel.addEventListener('mouseenter', function () {
    fieldTip.textContent = this.dataset.helptext;
    fieldTip.classList.add('tipVisible');
  });

  // hide help text
  helpLabel.addEventListener('mouseleave', function () {
    fieldTip.classList.remove('tipVisible');
  });

  if (document.getElementById('fieldtip') == null) {
    const place = document.getElementsByClassName('text-center pad')[1];
    place.append(fieldTip);
  }

  const container = document.createElement('td');
  container.append(helpLabel);

  return container;
}

function calculateTotalResearchGain() {
  const checkboxInput = document.getElementById('researchInline').querySelectorAll('[name="c[]"]');
  const currentResearchPower = 10/countChecked(checkboxInput)/100 || 0;

  const rPower = currentResearchPower;
  const checkedItems = document.querySelectorAll('#researchInline input[type="checkbox"]:not(.checkAll)');
  const gameTable = document.getElementById('statsTable').tBodies[0];

  let totalGain = 0;
  let index = 0;

  Object.keys(checkedItems).forEach((area) => {
    const areaIndex = index;

    if (!checkedItems[area].checked) {
      gameTable.rows[areaIndex].cells[4].textContent = '';
    }

    let gain = '';
    let scaleFactor = 1;
    const researchAreaRow = checkedItems[area].parentElement.parentElement.childNodes[0];
    if (checkedItems[area].checked) {
      if (researchAreaRow.classList.contains('green')) {
        scaleFactor = 1.1;
      }
      if (researchAreaRow.classList.contains('red')) {
        scaleFactor = 0.5;
      }

      gain = Math.ceil(rPower * gameTable.rows[areaIndex].cells[3].textContent * scaleFactor);
      totalGain += gain;
    }

    gameTable.rows[areaIndex].cells[4].textContent = gain;
    index ++;
  });

  document.getElementById('totalGain').textContent = totalGain;
}

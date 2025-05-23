(async () => {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200) // sleep a bit, while page loads
  await enhanceResearchTable();
})();
async function enhanceResearchTable() {
  const { language } = await chrome.storage.local.get({ language: 'en' });
  const { language: i18n } = await import(chrome.runtime.getURL('common/localization.js'));
  const { findCurrentTier} = await import(chrome.runtime.getURL('scripts/strategy/utility.js'));
  
  const tier = await findCurrentTier();
  const observer = new MutationObserver(function (mutations) {
    weightedResearch();
    calculateTotalResearchGain();
  });
  const researchPowerSpan = document.getElementById('checkboxTotal');
  const currentResearchPower = researchPowerSpan.textContent.slice(0, -1) / 100;
  if (document.getElementById('statsTable') == null) {
    const statsTable = document.createElement('table');
    statsTable.id = 'statsTable';
    statsTable.classList.add('acp', 'hoverCopy');
    //statsTable.style.width = 'auto'; // important to have it here, otherwise game's .acp overwrites it always

    const header = document.createElement('thead');
    header.append(
      document.createElement('th'),
      createHeaderWithImage('images/user.svg'),
      createHeaderWithImage('images/users.svg'),
      createHeaderWithImage('images/gap.svg'),
      createHeaderWithImage('images/research.svg')
    );
    statsTable.append(header);

    const gameTable = document.getElementById('carResearch');

    /** @type { NodeListOf<HTMLDivElement> } */
    const ratingBars = gameTable.querySelectorAll('.ratingBar');
    const researchStatsRows = [...ratingBars].map( (bar) => {
      // this will hide Comparsion column for narrow screens
      //gameTable.tHead.rows[0].cells[2].className = 'ratings';
      bar.parentElement.classList.add('ratings');

      const row = document.createElement('tr');
      row.className = 'hoverCopyTr';
      const scaleFactor = tier ;//( tier == 3) ? 3 : 2;
      const bestTeamValue = /(\d+)/.exec(bar.querySelector('svg').style.left)[0] * scaleFactor;
      const myValue = bar.previousSibling.lastChild.textContent;

      const ratingGap = bestTeamValue - myValue;
      const isChecked = bar.parentElement.parentElement.querySelector('input').checked;
      row.dataset.id = bar.parentElement.parentElement.querySelector('input').value;

      let gain = 0;
      if (isChecked) {
        gain = Math.ceil(ratingGap * currentResearchPower);
      }

      row.append(createTd(myValue), createTd(bestTeamValue), createTd(ratingGap), createTd(gain));

      return row;
    });
    

    const body = document.createElement('tbody');
    body.append(...researchStatsRows);
    statsTable.append(body);

    // TODO improve this. Looks like sponsor values are inaccurate if get the diff from rating bars
    try {
      const currentCarAttributes = [...document.querySelectorAll('#overview #carAttribTable [class*=block]')].map((node) => ({
        id: node.parentElement.id,
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
      //happens when page is refreshed or loaded directly instead of being opened from the button. The sponsor values are being retrieved from https://igpmanager.com/app/p=cars so if the page is not loaded before it won't find the elements.
    }

    const helpmark = createHelpButton(i18n[language].researchHelp);

    const tfoot = document.createElement('tfoot');
    tfoot.classList.add('researchFooter');

    const thf = document.createElement('th');
    thf.colSpan = 3;

    const total = document.createElement('td');
    total.id = 'totalGain';

    tfoot.append(helpmark, thf, total);
    statsTable.append(tfoot);
    const attributes_icons = Array.from(document.getElementById('carResearch').querySelectorAll('.attribute-icon.tooltip')).slice(0, -1)
    Array.from(statsTable.rows).forEach((row, index) => {
      const newCell = row.insertCell(0); // Insert new cell
      newCell.append(attributes_icons[index]); // Append node
  });

    gameTable.parentElement.insertBefore(statsTable, gameTable);
  }

  observer.observe(researchPowerSpan, { characterData: false, attributes: false, childList: true, subtree: false });
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
  const currentResearchPower = document.getElementById('checkboxTotal').textContent.slice(0, -1) / 100;
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
  const rPower = document.getElementById('checkboxTotal').textContent.slice(0, -1) / 100;
  const checkedItems = document.querySelectorAll('input[type="checkbox"]:not(.checkAll)');
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
    const researchAreaRow = checkedItems[area].parentElement.nextElementSibling;
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

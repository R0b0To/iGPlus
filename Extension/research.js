async function enhanceResearchTable() {
  const { language } = await chrome.storage.local.get({ language: 'eng' });
  const { language: i18n } = await import(chrome.runtime.getURL('/common/localization.js'));

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
    statsTable.style.width = 'auto'; // important to have it here, otherwise game's .acp overwrites it always

    const header = document.createElement('thead');
    header.append(
      createHeaderWithImage('images/user.svg'),
      createHeaderWithImage('images/users.svg'),
      createHeaderWithImage('images/gap.svg'),
      createHeaderWithImage('images/research.svg')
    );
    statsTable.append(header);

    const gameTable = document.getElementById('carResearch');

    /** @type { NodeListOf<HTMLDivElement> } */
    const ratingBars = gameTable.querySelectorAll('.ratingBar');
    const researchStatsRows = [...ratingBars].map((bar) => {
      const row = document.createElement('tr');
      row.className = 'hoverCopyTr';

      const scaleFactor = 2; //? is it always 2? I guess it depends on current tier
      const bestTeamValue = /(\d+)/.exec(bar.querySelector('img').style.left)[0] * scaleFactor;
      const myValue = parseInt(bar.querySelector('div').style.width) * scaleFactor;

      const ratingGap = bestTeamValue - myValue;
      const isChecked = bar.closest('tr').querySelector('input').checked;
      row.dataset.id = bar.closest('tr').querySelector('input').value;

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

    gameTable.parentElement.insertBefore(statsTable, gameTable);

    const helpmark = createHelpButton(i18n[language].researchHelp);

    const tfoot = document.createElement('tfoot');
    tfoot.classList.add('researchFooter');

    const thf = document.createElement('th');
    thf.colSpan = 2;

    const total = document.createElement('td');
    total.id = 'totalGain';

    tfoot.append(helpmark, thf, total);
    statsTable.append(tfoot);
  }

  observer.observe(researchPowerSpan, { characterData: false, attributes: false, childList: true, subtree: false });
  weightedResearch();
  calculateTotalResearchGain();
}

// TODO move to separate retry module?
(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 100)); // sleep a bit, while page loads
      await enhanceResearchTable();
      break;
    } catch (err) {
      console.warn(`Retry to enhance research table #${i + 1}/3`);
    }
  }
})();

function createTd(value) {
  const ele = document.createElement('td');
  ele.className = 'hoverCopyTd';
  ele.textContent = value;

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

  let cvs = '';
  for (let item of table.rows) {
    cvs += `${item.childNodes[columnIndex].childNodes[0].textContent}\n`;
  }

  await navigator.clipboard.writeText(cvs);
  console.log('text copied');
}

// TODO revisit and finish here
function weightedResearch() {
  try {
    rPower = parseFloat(document.getElementById('checkboxTotal').textContent.slice(0, -1) / 100);
    table = document.getElementById('statsTable');
    tableMap = { acc: 0, bra: 1, han: 5, dow: 3 };
    //'fe':4,'col':2,'te':7,'rel':6};
    if (table != null) {
      function getStats(t, index) {
        value = parseInt(t.rows[index].childNodes[0].childNodes[0].textContent);
        gap = parseInt(t.rows[index].childNodes[2].childNodes[0].textContent);
        return { value: value, gap: gap };
      }
      carDesign = {};
      Object.keys(tableMap).forEach((key) => {
        design = getStats(table, tableMap[key]);
        carDesign[key] = weightResult(design.value, design.gap, rPower, key);
      });
      //console.log(carDesign);
      function weightResult(currentS, gap, rPower, code) {
        weight = {
          acc: 1,
          bra: 0.5,
          han: 0.8,
          dow: 0.3,
          fe: 0.1,
          te: 0.1,
          col: 0.01,
          rel: 0.01
        };
        return (2.23 + 4.23 * Math.log(currentS + gap * rPower) - (2.23 + 4.23 * Math.log(currentS))) * weight[code];
      }

      bestWResearch = Math.max(...Object.values(carDesign));
      table.querySelectorAll('.hoverCopyTr').forEach((row) => {
        row.style.background = 'transparent';
      });
      if (bestWResearch > 0) {
        bestKey = Object.keys(carDesign).filter((key) => carDesign[key] === bestWResearch);
        bestKey.forEach((key) => {
          table.rows[tableMap[key]].style.background = '#ADD8E6';
        });
      }
    } else {
      setTimeout(weightedResearch, 200);
    }
  } catch (error) {}
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
    const place = document.getElementsByClassName('bgGrey')[0];
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

  Object.keys(checkedItems).forEach((area) => {
    const areaIndex = checkedItems[area].parentElement.parentElement.rowIndex - 1;

    if (!checkedItems[area].checked) {
      gameTable.rows[areaIndex].cells[3].textContent = '';
    }

    let gain = '';
    let scaleFactor = 1;
    const researchAreaRow = checkedItems[area].parentElement.previousElementSibling.parentElement;
    if (checkedItems[area].checked) {
      if (researchAreaRow.classList.contains('bgLightGreen')) {
        scaleFactor = 1.1;
      }
      if (researchAreaRow.classList.contains('bgLightRed')) {
        scaleFactor = 0.5;
      }

      gain = Math.ceil(rPower * gameTable.rows[areaIndex].cells[2].textContent * scaleFactor);
      totalGain += gain;
    }

    gameTable.rows[areaIndex].cells[3].textContent = gain;
  });

  document.getElementById('totalGain').textContent = totalGain;
}

async function addTable() {
  const { language } = await chrome.storage.local.get({ language: 'eng' });
  const { language: i18n } = await import('./common/localization.js');

  const researchPowerSpan = document.getElementById('checkboxTotal');
  const currentResearchPower = researchPowerSpan.textContent.slice(0, -1) / 100;

  if (document.getElementById('statsTable') == null) {
    const table = document.createElement('table');
    table.id = 'statsTable';
    table.classList.add('acp', 'hoverCopy');
    table.style.width = 'auto'; // important to have it here, otherwise game's .acp overwrites it always

    const header = document.createElement('thead');
    header.append(
      createHeaderWithImage('images/user.svg'),
      createHeaderWithImage('images/users.svg'),
      createHeaderWithImage('images/gap.svg'),
      createHeaderWithImage('images/research.svg')
    );
    table.append(header);

    const gameTable = document.getElementById('carResearch');

    const body = document.createElement('tbody');

    /** @type { NodeListOf<HTMLDivElement> } */
    const ratings = gameTable.querySelectorAll('.ratingBar');
    ratings.forEach((bar) => {
      const row = document.createElement('tr');
      row.className = 'hoverCopyTr';

      const scaleFactor = 2; //? is it always 2? I guess it depends on current tier
      const bestTeamValue = /(\d+)/.exec(bar.querySelector('img').style.left)[0] * scaleFactor;
      const myValue =parseInt(bar.querySelector('div').style.width) * scaleFactor;

      const ratingGap = bestTeamValue - myValue;
      const isChecked = bar.closest('tr').querySelector('input').checked;

      let gain = 0;
      if (isChecked) {
        gain = Math.ceil(ratingGap * currentResearchPower);
      }

      row.append(
        createTd(myValue),
        createTd(bestTeamValue),
        createTd(ratingGap),
        createTd(gain)
      );

      body.append(row);
    });

    table.append(body);

    try {
      const realAttr = sortArray(document.getElementById('overview').querySelectorAll('[class*=block]'));
      //body.rows[0].childNodes[0].textContent;
      for (let i = 0; i < 8; i += 1) {
        const sponsorValue = realAttr[i].textContent - body.rows[i].childNodes[0].textContent;
        body.rows[i].childNodes[0].append(realCarDiff(sponsorValue));
      }
    } catch (error) {
      console.log(error);
    }
    gameTable.parentElement.insertBefore(table, gameTable);

    const helpmark = askHelpButton(i18n[language].researchHelp);

    const tfoot = document.createElement('tfoot');
    tfoot.setAttribute('style', 'background:#e3e4e5;z-index: 2;position: relative;');

    const thf = document.createElement('th');
    thf.colSpan = 2;
    thf.setAttribute('style', 'background: #e3e4e5;border-right:0');

    tfoot.append(helpmark);
    tfoot.append(thf);

    const total = document.createElement('td');
    total.setAttribute('style', 'font-weight: bold;text-align: center;');
    total.id = 'totalGain';

    tfoot.append(total);
    table.append(tfoot);
  }

  observer.observe(researchPowerSpan, { characterData: false, attributes: false, childList: true, subtree: false });
  weightedResearch();

  pointGain();
}

// TODO move to separate retry module?
(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
      addTable();
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

  ele.addEventListener('click', copyColumn);
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

function sortArray(a) {
  return [a[0], a[2], a[4], a[6], a[1], a[3], a[5], a[7]];
}

function realCarDiff(val) {
  if (val != 0) {
    sponsorSpan = document.createElement('span');
    sponsorSpan.setAttribute('style', 'font-size: x-small; position:absolute;');
    if (val > 0) {
      sponsorSpan.style.color = 'green';
      sponsorSpan.textContent = ' +' + val;
    } else {
      sponsorSpan.style.color = 'red';
      sponsorSpan.textContent = val;
    }
    return sponsorSpan;
  } else return '';
}

async function copyColumn() {
  const columnIndex = this.cellIndex;
  const table = this.closest('tbody');

  let cvs = '';
  for (let item of table.rows) {
    cvs += `${item.childNodes[columnIndex].childNodes[0].textContent}\n`;
  }

  await navigator.clipboard.writeText(cvs);
  console.log('text copied');
}

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
          rel: 0.01,
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

var observer = new MutationObserver(function (mutations) {
  weightedResearch();
  pointGain();
});

function addFieldTip() {
  var span = document.createElement('span');
  span.id = 'fieldtip';
  span.setAttribute('style', `opacity:0`);
  return span;
}

function askHelpButton(text) {
  span = document.createElement('span');
  container = document.createElement('td');
  span.textContent = '?';
  span.className = 'fieldtip';
  span.setAttribute(
    'style',
    'cursor: help;display:block; text-align: center; ; border-radius: 50%;background-color: #96bf86;color: #ffffff;width: 23px;height: 23px;'
  );
  span.setAttribute('data-fieldtip', text);
  span.addEventListener('mouseenter', function () {
    fieldtip = document.getElementById('fieldtip');
    fieldtip.textContent = this.dataset.fieldtip;
    fieldtip.style.display = 'inline-block';
    var position = {
      top: 355,
      left: this.offsetLeft - 10,
    };
    fieldtip.style.opacity = 1;

    fieldtip.setAttribute('style', `top:${position.top}px;left:${position.left}px`);
  });
  span.addEventListener('mouseleave', function () {
    fieldtip = document.getElementById('fieldtip');
    fieldtip.style.opacity = 0;
    fieldtip.style.display = 'none';
  });
  //span =
  if (document.getElementById('fieldtip') == null) {
    place = document.getElementsByClassName('bgGrey')[0];
    place.append(addFieldTip());
  }
  container.append(span);
  return container;
}

function pointGain() {
  rPower = parseFloat(document.getElementById('checkboxTotal').textContent.slice(0, -1) / 100);
  checkboxdAttr = document.querySelectorAll('input[type="checkbox"]:not(.checkAll)');
  gametable = document.getElementById('statsTable').tBodies[0];
  var totalGain = 0;
  Object.keys(checkboxdAttr).forEach((area) => {
    var gain = 0;
    var areaIndex = checkboxdAttr[area].parentElement.parentElement.rowIndex - 1;
    if (checkboxdAttr[area].checked) {
      if (checkboxdAttr[area].parentElement.previousElementSibling.parentElement.classList.contains('bgLightGreen')) {
        gain = Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent * 1.1);
      } else if (
        checkboxdAttr[area].parentElement.previousElementSibling.parentElement.classList.contains('bgLightRed')
      ) {
        gain = Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent * 0.5);
      } else {
        gain = Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent);

        // console.log('neutraal');
      }
      totalGain += gain;
      gametable.rows[areaIndex].cells[3].textContent = gain;
    } else gametable.rows[areaIndex].cells[3].textContent = '';
  });
  document.getElementById('totalGain').textContent = totalGain;
  //console.log(totalGain);
}

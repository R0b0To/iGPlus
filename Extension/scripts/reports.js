(async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 200;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      state.reset(); 
      injectUI();
      return;
    } catch (err) {
      console.warn(`injectUI attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err.message);
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.error('Failed to inject UI after all retries.');
})();


// ─── Race State ───────────────────────────────────────────────────────────────
//
// Previously `manager` and `progressStatus` were bare globals mutated by every
// function in the file. They are now owned by this object. All functions read
// and write through `state` so a fresh extraction always starts clean.

var state = state || {
  manager: [],
  progressStatus: 0,

  reset() {
    this.manager = [];
    this.progressStatus = 0;
  }
};


// ─── Utilities ────────────────────────────────────────────────────────────────
function getTrackCode() {
  return document.querySelector('.flag').classList[1].substring(2);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRaceId() {
  return window.location.href.replace(/\D/g, '');
}

function timeStringToMs(timeString) {
  try {
    const [minutes, rest] = timeString.split(':');
    const [seconds, ms] = rest.split('.');
    return parseInt(minutes) * 60_000 + parseInt(seconds) * 1_000 + parseInt(ms);
  } catch {
    return null;
  }
}

function downloadCSV(data, filename) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filename,
    style: 'visibility:hidden',
  });
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTyreCode(tyreLabel) {
  const TYRE_CODES = {
    // English
    'Full wet tyres':         'ts-W',
    'Intermediate wet tyres': 'ts-I',
    'Hard tyres':             'ts-H',
    'Medium tyres':           'ts-M',
    'Soft tyres':             'ts-S',
    'Super soft tyres':       'ts-SS',
    // Italian
    'Pneumatici da bagnato':  'ts-W',
    'Pneumatici intermedi':   'ts-I',
    'Pneumatici duri':        'ts-H',
    'Pneumatici medi':        'ts-M',
    'Pneumatici morbidi':     'ts-S',
    'Pneumatici super morbidi': 'ts-SS',
    // Spanish
    'Neumáticos de Lluvia':   'ts-W',
    'Neumáticos Intermedios': 'ts-I',
    'Neumáticos Duros':       'ts-H',
    'Neumáticos Medios':      'ts-M',
    'Neumáticos Blandos':     'ts-S',
    'Neumáticos Súper Blandos': 'ts-SS',
    // German
    'Vollregen-Reifen':       'ts-W',
    'Intermediate Reifen':    'ts-I',
    'Hart Reifen':            'ts-H',
    'Medium Reifen':          'ts-M',
    'Soft Reifen':            'ts-S',
    'Super Soft Reifen':      'ts-SS',
    // Portuguese
    'Pneus de chuva':         'ts-W',
    'Pneus intermediários':   'ts-I',
    'Pneus duros':            'ts-H',
    'Pneus médios':           'ts-M',
    'Pneus macios':           'ts-S',
    'Pneus super macios':     'ts-SS',
    // Russian
    'Дождевые шины':          'ts-W',
    'Промежуточные шины':     'ts-I',
    'Твердые шины':           'ts-H',
    'Средние шины':           'ts-M',
    'Мягкие шины':            'ts-S',
    'Супермягкие шины':       'ts-SS',
    // French
    'Pneus pluie':            'ts-W',
    'Pneus intermédiaires humides': 'ts-I',
    'Pneus durs':             'ts-H',
    'Pneus moyens':           'ts-M',
    'Pneus tendres':          'ts-S',
    'Pneus super tendres':    'ts-SS',
  };
  return TYRE_CODES[tyreLabel] ?? 'ts-M';
}

function getRuleActive(noticeEl, iconId) {
  const useEl = [...noticeEl.querySelectorAll('use')]
    .find(el => el.getAttribute('xlink:href')?.endsWith(iconId));
  return useEl ? !useEl.closest('span')?.classList.contains('grey') : false;
}

// ─── UI Injection ─────────────────────────────────────────────────────────────

function injectUI() {
  const header = document.getElementsByClassName('dialog-head')[0];
  if (!header) throw new Error('.dialog-head not found');

  header.classList.add('inj_header');

  if (header.childElementCount !== 1) return;

  const extractBtn = createExtractButton();
  const sheetIconBtn = createSheetIconButton();
  const exportContainer = Object.assign(document.createElement('div'), {
    className: 'export_container',
  });
  exportContainer.append(extractBtn, sheetIconBtn);
  header.append(exportContainer);

  injectCSVButtons(header);
}

function createExtractButton() {
  const spinner = Object.assign(document.createElement('span'), { className: 'spinner' });
  spinner.style.display = 'none';

  const btn = Object.assign(document.createElement('button'), {
    id: 'extract_button',
    className: 'btn3 pushBtn',
    innerText: 'Extract',
  });
  btn.setAttribute('style', 'position:relative; left:10px; cursor:pointer;border: none;');
  btn.append(spinner);
  btn.onclick = onExtractClick;
  return btn;
}

function createSheetIconButton() {
  const img = Object.assign(document.createElement('img'), {
    src: chrome.runtime.getURL('images/Sheet.svg'),
  });
  img.style.width = '1.6em';

  const btn = Object.assign(document.createElement('button'), {
    id: 'sheet_icon',
    className: 'pushBtn',
  });
  btn.setAttribute('style', 'position:relative;margin-left:10px; background-color:transparent; vertical-align:middle; cursor:pointer; border:none;');
  btn.append(img);
  btn.onclick = openSheetImportDialog;
  return btn;
}

function injectCSVButtons(header) {
  const csvExportBtn = document.querySelector('.csvExport');
  if (!csvExportBtn || header.childElementCount !== 2) return;

  const raceBtn = csvExportBtn.cloneNode(true);
  const qualiBtn = csvExportBtn.cloneNode(true);
  const podiumBtn = csvExportBtn.cloneNode(true);

  raceBtn.classList.add('race-csv-igplus');
  const podiumSpinner = Object.assign(document.createElement('span'), { className: 'spinner' });
  podiumSpinner.style.display = 'none';

  podiumBtn.id = 'top3';
  podiumBtn.textContent = 'Top 3';
  podiumBtn.append(podiumSpinner);
  qualiBtn.textContent = 'Q';

  [podiumBtn, qualiBtn].forEach(btn => btn.classList.add('mRight'));

  podiumBtn.onclick = onPodiumCopy;
  qualiBtn.addEventListener('click', () => exportQuali(true));
  raceBtn.addEventListener('click', () => exportRace(true));

  const buttonsContainer = Object.assign(document.createElement('div'), {
    className: 'inj_container f_right',
  });
  buttonsContainer.append(podiumBtn, qualiBtn, raceBtn);
  header.append(buttonsContainer);
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function createProgressBar() {
  const bar = Object.assign(document.createElement('div'), {
    id: 'bar',
    style: 'background-color:#4CAF50; width:1%; height:5px; border-radius:4px;',
  });
  const wrapper = Object.assign(document.createElement('div'), {
    id: 'progress',
    className: 'progress',
  });
  wrapper.appendChild(bar);
  return wrapper;
}

function updateProgressBar() {
  state.progressStatus += 100 / state.manager.length;
  const bar = document.getElementById('bar');
  if (bar) bar.style.width = `${state.progressStatus}%`;
}

// ─── Podium Copy ──────────────────────────────────────────────────────────────

async function onPodiumCopy() {
  const btn = document.getElementById('top3');
  btn.childNodes[0].textContent = '';
  btn.childNodes[1].style.display = 'inline-block';

  const [{ fetchDriverInfo, fetchTeamInfo }, { parseAttributes }] = await Promise.all([
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('scripts/driver/driverHelpers.js')),
  ]);

  async function getManagerName(driverId) {
    const driverInfo = await fetchDriverInfo(driverId);
    const managerId = new URLSearchParams(parseAttributes(driverInfo).tLink).get('team');
    const managerData = await fetchTeamInfo(managerId);
    return managerData.vars.manager.match(/\/>(.*)$/)[1].substring(1);
  }

  function buildStrategyString(strategyDiv) {
    const TYRE_EMOJI = {
      'ts-M':  '⚪',
      'ts-H':  '🟠',
      'ts-S':  '🟡',
      'ts-SS': '🔴',
      'ts-W':  '🔵',
      'ts-I':  '🟢',
    };
    if (!strategyDiv) return '';
    return [...strategyDiv.querySelectorAll('td')]
      .map(td => {
        const tyreClass = Object.keys(TYRE_EMOJI).find(cls => td.classList.contains(cls));
        return tyreClass ? TYRE_EMOJI[tyreClass] : td.textContent.trim();
      })
      .join('');
  }

  const raceBody = document.querySelector('#race table tbody');
  const trackName = document.querySelector('.dialog-head h1').textContent.trim();
  const strategyPreviews = document.getElementsByClassName('strategy-preview');
  const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];
  const podiumLines = await Promise.all(
    Array.from(raceBody.rows).slice(0, 3).map(async (row, i) => {
      const teamName = row.querySelector('.teamName').childNodes[0].textContent;
      const driverId = new URLSearchParams(row.querySelector('a').href).get('id');
      const managerName = await getManagerName(driverId);
      const finish = row.cells[2].textContent;

      let line = `${PODIUM_MEDALS[i]} ${teamName} - ${managerName}`;
      if (strategyPreviews.length > 0) {
        line += `\n${' '.repeat(PODIUM_MEDALS[0].length + 1)}${buildStrategyString(strategyPreviews[i])} (${finish})`;
      }
      return line;
    })
  );

  const fastLapRow = raceBody.querySelector('.font-heading').parentElement;
  const fastLapTeam = fastLapRow.querySelector('.teamName').textContent;
  const fastLapDriverId = fastLapRow.querySelector('a').getAttribute('href').split('id=')[1];
  const fastLapManager = await getManagerName(fastLapDriverId);

  const bestLapLabel = raceBody.parentElement.childNodes[1].childNodes[0].childNodes[3].textContent;
  const resultText = `🚦 🏁 ${trackName} 🚦\n${podiumLines.join('\n')}\n🏎️💨 ${bestLapLabel}: ${fastLapTeam} - ${fastLapManager}\n👇 🎤..... 👇`;

  try {
    await navigator.clipboard.writeText(resultText);
    btn.childNodes[0].textContent = 'Copied!';
    btn.childNodes[1].style.display = 'none';
    btn.classList.add('podium-off');
  } catch {
    alert('Failed to copy top 3');
  }
}

// ─── Google Sheets Import ─────────────────────────────────────────────────────

async function openSheetImportDialog() {
  if (!document.getElementById('sheetDialog')) createSheetDialog();

  const token =
    (await chrome.runtime.sendMessage({ action: 'getTokenSilent' }))?.token ||
    (await chrome.runtime.sendMessage({ action: 'getFirstToken', forceReapprove: false }))?.token;

  const { get_sheets } = await import(chrome.runtime.getURL('auth/dropbox_handler.js'));
  const { access_gSheet, create_new_csv, delete_csv } = await import(chrome.runtime.getURL('auth/csv_handler.js'));

  const sheets = await get_sheets(token.access_token);

  const listContainer = document.getElementById('sheetList');
  const selectBtn = document.getElementById('selectSheetBtn');
  const createBtn = document.getElementById('createNewSheetBtn');
  const newSheetInput = document.getElementById('newSheetName');

  listContainer.innerHTML = '';
  selectBtn.disabled = true;

  function appendSheetItem(sheet, autoSelect = false) {
    const item = document.createElement('label');
    item.className = 'sheetStyle';
    item.innerHTML = `
      <input type="radio" name="sheetRadio" id="${sheet.id}" value="${sheet.id}">
      <span class="sheet-name">${sheet.name}</span>
      <button class="deleteSheetBtn trash btn3" title="Delete file" data-path="${sheet.id}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z" fill="currentColor"/>
      <path d="M9 9H11V17H9V9Z" fill="currentColor"/>
      <path d="M13 9H15V17H13V9Z" fill="currentColor"/>
    </svg></button>
    `;

    const radio = item.querySelector('input');
    radio.addEventListener('change', () => {
      document.querySelectorAll('.sheetStyle').forEach(el => el.classList.remove('selected_radio'));
      item.classList.add('selected_radio');
      selectBtn.disabled = false;
    });

    const deleteBtn = item.querySelector('.deleteSheetBtn');
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!confirm(`Delete "${sheet.name}"? This cannot be undone.`)) return;

      deleteBtn.disabled = true;
      deleteBtn.textContent = '⏳';

      try {
        await delete_csv(sheet.id, token.access_token);
        item.remove();

        if (!document.querySelector('input[name="sheetRadio"]:checked')) {
          selectBtn.disabled = true;
        }
      } catch (err) {
        console.error("Failed to delete file", err);
        alert("Failed to delete file. Check console.");
        deleteBtn.disabled = false;
        deleteBtn.textContent = '🗑️';
      }
    });

    if (autoSelect) {
      listContainer.prepend(item);
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    } else {
      listContainer.appendChild(item);
    }
  }

  sheets.forEach(sheet => appendSheetItem(sheet));

  createBtn.onclick = async () => {
    const fileName = newSheetInput.value.trim();
    if (!fileName) return;

    const originalText = createBtn.textContent;
    createBtn.disabled = true;
    createBtn.textContent = "Creating...";

    try {
      const newSheet = await create_new_csv(fileName, token.access_token);
      appendSheetItem(newSheet, true);
      newSheetInput.value = '';
    } catch (err) {
      console.error("Failed to create file", err);
      alert("Failed to create new file. Check console.");
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = originalText;
    }
  };

  document.getElementById('sheetDialog').showModal();

  selectBtn.onclick = async () => {
    const selectedId = document.querySelector('input[name="sheetRadio"]:checked').id;

    const originalText = selectBtn.textContent;
    selectBtn.disabled = true;
    selectBtn.innerHTML = `<div class="spinner"></div> <span>Exporting...</span>`;

    try {
      const raceId = getRaceId();

      const qualiRows = exportQuali(false).split('\n').map(row => [raceId, 'Q', ...row.split(',')]);
      let raceRows = exportRace(false).split('\n').map(row => [raceId, 'R', ...row.split(',')]);

      const noticeEls = document.getElementsByClassName('notice');
      const raceDate = noticeEls[1]?.textContent ?? 'error';
      const trackCode = getTrackCode();
      const rules = [
        `⛽${getRuleActive(noticeEls[0], '#igp-fuel')}`,
        `🛞${getRuleActive(noticeEls[0], '#igp-tyre')}`,
        `⏱️${getRuleActive(noticeEls[0], '#md-stopwatch')}`,
      ].join(',');

      if (document.getElementById('alldrivers')) {
        state.manager.sort((a, b) => a.race_finish - b.race_finish);
        raceRows[0].push('Strategy', 'Pit Stops Time', 'Time Lost', 'Rank');
        raceRows = [
          raceRows[0],
          ...raceRows.slice(1).map((row, i) => [
            ...row,
            state.manager[i].pit_stop,
            state.manager[i].pitStopTimes.join(','),
            state.manager[i].pitTimeLoss.join(','),
            state.manager[i].rank.join(','),
          ]),
        ];
      }

      await access_gSheet(selectedId, token.access_token, [...qualiRows, ...raceRows], {
        race_date: raceDate,
        track_code: trackCode,
        rules,
      });

      closeSheetDialog();

    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export. Check console.");
      selectBtn.disabled = false;
      selectBtn.textContent = originalText;
    }
  };
}

function createSheetDialog() {
  const old = document.getElementById('sheetDialog');
  if (old) old.remove();

  const dialog = document.createElement('dialog');
  dialog.id = 'sheetDialog';

  dialog.innerHTML = `
    <div class="sheetHeader">
      <h2>
        <a href="https://www.dropbox.com/home/Apps/iGPlus" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#0061FF">
            <path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4L6 2zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4-6-4z"/>
          </svg>
        </a>
        Select sheet
        <a href="https://docs.google.com/spreadsheets/d/1_4CfNu8IQmnUIwvMe0SiLt-onlTOhuD64oXOTzXBR04/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="importHelpLink">
  Use in Google Sheets ↗
</a>
      </h2>
      <span id="close_dialog">&times;</span>
    </div>
    <div class="newFileContainer">
      <input type="text" id="newSheetName" placeholder="New file name (e.g. Season 5)" />
      <button id="createNewSheetBtn" class="btn4 createNewSheetBtn">Create</button>
    </div>
    <div id="sheetList"></div>
    <div class="sheetFooter">
      <button id="selectSheetBtn" disabled>Export results</button>
    </div>
  `;

  document.body.appendChild(dialog);
  document.getElementById('close_dialog').onclick = closeSheetDialog;

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeSheetDialog();
  });
}

function closeSheetDialog() {
  const dialog = document.getElementById('sheetDialog');
  if (dialog) {
    dialog.close();
    dialog.remove();
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportRace(download) {
  const table = document.getElementById('csvRace');
  const head = table.tHead.rows[0];

  const headers = [
    head.cells[0].textContent,  // pos
    head.cells[1].textContent,  // driver
    'Team',
    head.cells[2].textContent,  // finish
    head.cells[3].textContent,  // best lap
    head.cells[4].textContent,  // top speed
    head.cells[5].textContent,  // pit
    head.cells[6].textContent,  // points
  ];

  const rows = [...table.tBodies[0].rows].map((row, i) => {
    const finish = row.cells[2].textContent;
    return [
      i + 1,
      row.cells[1].childNodes[2].textContent.trim(),
      row.cells[1].querySelector('.teamName').childNodes[0].textContent.trim(),
      !download && finish.startsWith('+') ? `'${finish}` : finish,
      row.cells[3].textContent,
      row.cells[4].textContent,
      row.cells[5].textContent,
      row.cells[6].textContent,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  if (download) downloadCSV(csv, `${getRaceId()}_Race`);
  else return csv;
}

function exportQuali(download) {
  const table = document.querySelector('#qualifying table');
  const head = table.tHead.rows[0];

  const headers = [
    head.cells[0].textContent,
    head.cells[1].textContent,
    'Team',
    head.cells[2].textContent,
    head.cells[3].textContent,
    head.cells[4].textContent,
  ];

  const rows = [...table.tBodies[0].rows].map((row, i) => {
    const gap = row.cells[3].textContent;
    return [
      i + 1,
      row.cells[1].childNodes[2].textContent.trim(),
      row.cells[1].querySelector('.teamName').childNodes[0].textContent.trim(),
      row.cells[2].textContent,
      !download && gap.startsWith('+') ? `'${gap}` : gap,
      row.cells[4].textContent,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  if (download) downloadCSV(csv, `${getRaceId()}_Qualifying`);
  else return csv;
}

function buildFullDriverCSV(raceData) {
  return raceData.flatMap(driver =>
    driver.driver_result.lap.map((lap, i) =>
      [
        driver.name,
        driver.team,
        lap,
        driver.driver_result.time[i],
        driver.driver_result.gap_to_lead[i],
        driver.driver_result.average[i],
        driver.driver_result.rank[i],
      ].join(',')
    )
  ).join('\n');
}

function injectFullCSVButton() {
  const csvExportBtn = document.querySelector('.inj_container .csvExport');
  const parent = csvExportBtn?.parentElement;
  if (!parent || parent.childElementCount !== 3) return;

  const fullBtn = csvExportBtn.cloneNode(true);
  fullBtn.id = 'alldrivers';
  fullBtn.textContent = 'Full CSV';
  parent.prepend(fullBtn);
  parent.prepend(csvExportBtn);

  fullBtn.addEventListener('click', () => {
    chrome.storage.local.get('active', ({ active }) => {
      downloadCSV(buildFullDriverCSV(active), `${getRaceId()}_Drivers_CSV`);
    });
  });
}

// ─── Extraction ───────────────────────────────────────────────────────────────

function buildManagerTemplate(row, index, raceId, noticeEls) {
  const driverLink = row.getElementsByClassName('linkParent')[0];
  return {
    race_info: {
      rules: {
        fuel: noticeEls[0].children[0].className !== 'grey',
        tyre: noticeEls[0].children[1].className !== 'grey',
      },
      date: noticeEls[1].textContent,
      track: getTrackCode(),
    },
    id: driverLink.href.replace(/\D/g, ''),
    name: row.childNodes[1].childNodes[2].textContent.substring(1),
    team: row.childNodes[1].childNodes[4].innerText,
    quali: index + 1,
    race: 'NotFound',
    race_finish: '',
    race_id: raceId,
    report_id: '',
    rank: [],
    race_time: [],
    lap_time: [],
    pit_stop: '',
    pitTimeLoss: [],
    pitStopTimes: [],
    driver_result: { lap: [], time: [], gap_to_lead: [], average: [], rank: [] },
  };
}

function collectQualiData() {
  state.reset();
  const qualiBody = document.querySelector('#qualifying table').tBodies[0];
  const noticeEls = document.getElementsByClassName('notice');
  const raceId = getRaceId();
  for (let i = 0; i < qualiBody.childElementCount; i++) {
    state.manager.push(buildManagerTemplate(qualiBody.rows[i], i, raceId, noticeEls));
  }
}

function linkRaceResults() {
  const raceBody = document.querySelector('#race table').tBodies[0];
  for (let i = 0; i < raceBody.childElementCount; i++) {
    const row = raceBody.rows[i];
    const driverId = row.childNodes[1].getElementsByClassName('linkParent')[0].href.replace(/\D/g, '');
    let reportUrl = 'no_race';
    try {
      reportUrl = row.childNodes[2].getElementsByClassName('linkParent')[0].href;
    } catch {
      console.log('No report URL (likely a DNF)');
    }

    const entry = state.manager.find(m => m.id === driverId);
    if (entry) {
      entry.race = reportUrl;
      entry.report_id = reportUrl.replace(/\D/g, '');
      entry.race_finish = i;
    }
  }
}

function onExtractClick() {
  const extractBtn = this;
  if (extractBtn.disabled) return;

  const podiumBtn = document.getElementById('top3');
  podiumBtn.classList.remove('podium-off');
  podiumBtn.childNodes[0].textContent = 'Top 3';

  extractBtn.disabled = true;
  extractBtn.classList.add('disabled');
  extractBtn.childNodes[0].textContent = '';
  extractBtn.childNodes[1].style.display = 'inline-block';

  document.getElementsByClassName('dialog')[0].prepend(createProgressBar());

  collectQualiData();   // resets state.manager and state.progressStatus
  linkRaceResults();
  fetchAllReports();
}

// ─── Report Fetching ──────────────────────────────────────────────────────────

async function fetchAllReports() {
  const { fetchRaceReportInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));

  // Create an array of promises to run in parallel
  const reportPromises = state.manager.map(async (driver, i) => {
    if (!driver.report_id) return;
    const result = await fetchRaceReportInfo(driver.report_id);
    const table = parseReportHTML(result);
    parseReportData(table, i); // Ensure parseReportData is thread-safe (it is, since it uses index)
  });

  await Promise.all(reportPromises);
  await persistAndSyncReports();
  renderStrategyPreviews();

  document.getElementById('progress')?.remove();
  const extractBtn = document.getElementById('extract_button');
  extractBtn.childNodes[0].textContent = 'Extract';
  extractBtn.childNodes[1].style.display = 'none';
  injectFullCSVButton();
}

function parseReportHTML(data) {
  const rawTable = /<table.*<\/table>/gms.exec(data.vars.results)[0];
  const table = document.createElement('table');
  table.innerHTML = DOMPurify.sanitize(rawTable);
  return table;
}

async function persistAndSyncReports() {
  const trackCode = getTrackCode();
  const race_id = document.getElementsByClassName('race-csv-igplus')[0].attributes['data-csvname'].value;

  const active_option = `${race_id}_${trackCode}`;

  chrome.storage.local.get('active', async ({ active }) => {
    chrome.runtime.sendMessage({ type: 'addRaceReportToDB', data: { id: active_option, data: active } });

    const { script: syncSettings = false } = await chrome.storage.local.get('script');
    if (!syncSettings?.gdrive) return;

    const { getAccessToken } = await import(chrome.runtime.getURL('auth/dropboxAuth.js'));
    const token = await getAccessToken();
    if (!token) return;

    chrome.runtime.sendMessage({
      type: 'saveReport',
      data: JSON.stringify(active),
      token: token.access_token,
    });
  });

  chrome.storage.local.set({ 'active_option': active_option });
}

// ─── Report Parsing ───────────────────────────────────────────────────────────

function parseReportData(table, index) {
  const rows = table.tBodies[0].rows;
  const totalRows = rows.length;

  state.manager[index].pit_stop = table.rows[1].cells[1].childNodes[0].textContent;
  state.manager[index].driver_result.lap.push(table.rows[1].cells[0].textContent);
  state.manager[index].driver_result.rank.push(state.manager[index].quali);
  state.manager[index].driver_result.time.push(table.rows[1].cells[1].textContent);
  ['gap_to_lead', 'average'].forEach(key => state.manager[index].driver_result[key].push(''));

  let lastPitLap = 0;
  const pitTimes = [];

  for (let i = 2; i <= totalRows; i++) {
    const row = table.rows[i];
    const lapCell = row.childNodes[0].textContent;
    const isNonLap = isNaN(lapCell);

    const rank = row.cells[4]?.textContent ?? '';
    state.manager[index].driver_result.lap.push(row.cells[0].textContent);
    state.manager[index].driver_result.time.push(row.cells[1].textContent);
    state.manager[index].driver_result.gap_to_lead.push(row.cells[2].textContent);
    state.manager[index].driver_result.average.push(row.cells[3].textContent);
    state.manager[index].driver_result.rank.push(rank);

    if (isNonLap) {
      const pitTime = parseFloat(row.childNodes[1].textContent.split('/')[0]);
      state.manager[index].pitStopTimes.push(pitTime);

      const pitLap = parseInt(table.rows[i - 1].childNodes[0].textContent);
      const tyreName = row.childNodes[1].childNodes[2].textContent;
      state.manager[index].pit_stop += `,${pitLap - lastPitLap},${tyreName}`;
      lastPitLap = pitLap;

      if (i + 2 < totalRows) {
        const a = timeStringToMs(table.rows[i - 1].childNodes[1].textContent);
        const b = timeStringToMs(table.rows[i + 1].childNodes[1].textContent);
        const c = timeStringToMs(table.rows[i - 2].childNodes[1].textContent);
        const d = timeStringToMs(table.rows[i + 2].childNodes[1].textContent);

        if (a && b && c && d) {
          const loss = (a + b - c - d) / 1000;
          pitTimes.push(loss);
          state.manager[index].pitTimeLoss.push(loss);
        } else {
          state.manager[index].pitTimeLoss.push('');
        }
      }
    } else {
      state.manager[index].rank.push(row.childNodes[4].innerHTML);
      state.manager[index].lap_time.push(row.childNodes[1].innerHTML);
      state.manager[index].race_time.push(
        row.childNodes[2].innerHTML === '-' ? '0' : row.childNodes[2].innerHTML
      );
    }
  }

  const lastLap = parseInt(table.rows[table.tBodies[0].rows.length].childNodes[0].innerHTML);
  state.manager[index].pit_stop += `,${lastLap - lastPitLap}`;

  const avgPitLoss = pitTimes.length
    ? pitTimes.reduce((a, b) => a + b, 0) / pitTimes.length
    : 0;
  state.manager[index].pitTimeLoss.push(avgPitLoss);

  updateProgressBar();
  chrome.storage.local.set({ active: state.manager });
}

// ─── Strategy Preview Rendering ───────────────────────────────────────────────

function renderStrategyPreviews() {
  if (document.getElementsByClassName('strategy-preview').length > 0) return;

  chrome.storage.local.get('active', ({ active }) => {
    const sorted = [...active].sort((a, b) => a.race_finish - b.race_finish);

    const raceBody = document.querySelector('#race table').tBodies[0];
    document.querySelector('#race table').tHead.classList.add('tyre_preview');

    sorted.forEach((driver, i) => {
      const preview = document.createElement('div');
      preview.classList.add('strategy-preview');

      driver.pit_stop.split(',').forEach(token => {
        preview.appendChild(
          isNaN(token) ? createTyreCell(token) : createLapCountCell(token)
        );
      });

      raceBody.rows[i].childNodes[1].lastChild.appendChild(preview);
    });

    renderAveragePitInfo(sorted);
  });
}

function renderAveragePitInfo(sorted) {
  const leaderLaps = sorted[0].rank.length;
  let total = 0, count = 0;

  sorted.forEach(driver => {
    const avgLoss = driver.pitTimeLoss[driver.pitTimeLoss.length - 1];
    if (driver.rank.length === leaderLaps && avgLoss > 0) {
      total += avgLoss;
      count++;
    }
  });
}

function createLapCountCell(laps) {
  const td = document.createElement('td');
  td.setAttribute('style', 'height:10px; width:10px;');
  td.textContent = laps;
  return td;
}

function createTyreCell(tyreLabel) {
  const td = document.createElement('td');
  td.setAttribute('style', 'height:10px; width:20px; background-color:transparent;');
  td.className = getTyreCode(tyreLabel);
  return td;
}
(function addTrackInfo(){
  try {
    const searchBtn = document.getElementsByClassName('btn pointer')[0];
    searchBtn.addEventListener('click', loadTrack);
  } catch (error) {
    setTimeout(addTrackInfo, 500);
  }
})();

function createRow(rowName, value) {
  const row = document.createElement('tr');
  const rowDescription = document.createElement('td');
  rowDescription.textContent = rowName;
  const barTd = document.createElement('td');
  const bar = document.createElement('div');
  bar.classList.add('ratingBar', 'statBarWithValue');
  const barValue = document.createElement('div');
  barValue.style.width = `${value}%`;
  const displayedValue = document.createElement('span');
  displayedValue.textContent = `${value}%`;
  displayedValue.classList.add('showStat');
  bar.append(barValue, displayedValue);
  barTd.append(bar);
  row.append(rowDescription, barTd);
  return row;
}

function createTrackStasDiv(track) {
  const container = document.createElement('div');
  container.id = 'trackStats';
  const table = document.createElement('table');
  table.classList.add('acp', 'pad');
  table.append(createRow('Overtaking chances', track.overtake));
  table.append(createRow('Road bumpiness',     track.bumpiness));
  table.append(createRow('Fuel consumption',   track.fuel));
  table.append(createRow('Tyre wear',          track.tyre));
  container.append(table);
  return container;
}

function updateStats(track) {
  function updateValue(ratingBar, value) {
    ratingBar.childNodes[0].style.width = `${value}%`;
    ratingBar.childNodes[1].textContent = `${value}%`;
  }
  const container = document.getElementById('trackStats');
  const stats = container.querySelectorAll('.ratingBar');
  updateValue(stats[0], track.overtake);
  updateValue(stats[1], track.bumpiness);
  updateValue(stats[2], track.fuel);
  updateValue(stats[3], track.tyre);
}

/**
 * Per-circuit characteristics (overtaking, bumpiness, fuel, tyre wear).
 * Keyed by 2-letter code — previously this was keyed by numeric id with
 * a redundant `code` field on each entry, and the id→code mapping was
 * duplicated here and in strategy/const.js trackDictionary (with a bug
 * where id 8 mapped to 'gb9'). Now the code lookup is done via
 * common/circuits.js codeFromId() and this table is keyed by code
 * directly, which is what all consumers needed anyway.
 */
const trackCharacteristics = {
  'au': { overtake: 40, bumpiness: 80, fuel: 50, tyre: 40 },
  'my': { overtake: 56, bumpiness: 50, fuel: 60, tyre: 80 },
  'cn': { overtake: 50, bumpiness: 25, fuel: 90, tyre: 80 },
  'bh': { overtake: 45, bumpiness: 35, fuel: 90, tyre: 60 },
  'es': { overtake: 40, bumpiness: 25, fuel: 70, tyre: 85 },
  'mc': { overtake: 10, bumpiness: 90, fuel: 40, tyre: 20 },
  'tr': { overtake: 50, bumpiness: 56, fuel: 50, tyre: 90 },
  'de': { overtake: 50, bumpiness: 35, fuel: 25, tyre: 50 },
  'hu': { overtake: 15, bumpiness: 45, fuel: 25, tyre: 30 },
  'eu': { overtake: 40, bumpiness: 50, fuel: 50, tyre: 45 },
  'be': { overtake: 50, bumpiness: 50, fuel: 70, tyre: 60 },
  'it': { overtake: 90, bumpiness: 50, fuel: 90, tyre: 35 },
  'sg': { overtake: 40, bumpiness: 70, fuel: 50, tyre: 45 },
  'jp': { overtake: 60, bumpiness: 50, fuel: 45, tyre: 70 },
  'br': { overtake: 50, bumpiness: 35, fuel: 55, tyre: 60 },
  'ae': { overtake: 80, bumpiness: 56, fuel: 40, tyre: 50 },
  'gb': { overtake: 60, bumpiness: 40, fuel: 80, tyre: 65 },
  'fr': { overtake: 50, bumpiness: 70, fuel: 70, tyre: 80 },
  'at': { overtake: 50, bumpiness: 40, fuel: 70, tyre: 60 },
  'ca': { overtake: 70, bumpiness: 40, fuel: 80, tyre: 45 },
  'az': { overtake: 90, bumpiness: 70, fuel: 60, tyre: 45 },
  'mx': { overtake: 70, bumpiness: 30, fuel: 60, tyre: 60 },
  'ru': { overtake: 70, bumpiness: 20, fuel: 70, tyre: 50 },
  'us': { overtake: 70, bumpiness: 20, fuel: 70, tyre: 65 },
  'nl': { overtake:  0, bumpiness:  0, fuel:  0, tyre:  0 },
};

async function loadTrack() {
  const { codeFromId } = await import(chrome.runtime.getURL('common/circuits.js'));

  const selectedTrack = document.getElementsByClassName('historyFilterTrack')[0];
  const trackId = Number(selectedTrack.value);
  const code = codeFromId(trackId); // null for id=0 (All) or the retired id=8

  const tableDiv = document.getElementById('history');
  const image = document.createElement('img');
  const imageContainer = document.createElement('div');
  imageContainer.append(image);
  imageContainer.classList.add('statsContainer');

  if (!code || !trackCharacteristics[code]) {
    // "All tracks" selected, or a retired/unknown circuit — remove stats if shown
    const existing = document.getElementsByClassName('statsContainer')[0];
    if (existing) existing.remove();
    return;
  }

  const track = trackCharacteristics[code];

  image.src = chrome.runtime.getURL(`images/circuits/${code}_dark.png`);
  image.classList.add('trackImage');
  image.id = 'trackMap';

  if (!document.getElementById('trackMap')) {
    tableDiv.prepend(imageContainer);
  } else {
    document.getElementById('trackMap').src = image.src;
  }

  if (!document.getElementById('trackStats')) {
    imageContainer.prepend(createTrackStasDiv(track));
  } else {
    updateStats(track);
  }
}
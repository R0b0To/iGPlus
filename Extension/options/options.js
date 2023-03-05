import { language } from '../common/localization.js';

const raceSign = document.getElementById('raceSign');
const overSign = document.getElementById('overSign');
const link = document.getElementById('link');
const sname = document.getElementById('sname');
const trackName = document.getElementById('track');

const leagueCheckbox = document.getElementById('league').querySelector('.help');
const researchCheckbox = document.getElementById('research').querySelector('.help');
const trainingCheckbox = document.getElementById('train').querySelector('.help');
const staffCheckbox = document.getElementById('staff').querySelector('.help');
const marketCheckbox = document.getElementById('market').querySelector('.help');
const marketDriverCheckbox = document.getElementById('marketDriver').querySelector('.help');
const refreshCheckbox = document.getElementById('refresh').querySelector('.help');
const reportsCheckbox = document.getElementById('reports').querySelector('.help');
const reviewCheckbox = document.getElementById('review').querySelector('.help');
const gsheetCheckbox = document.getElementById('Gsheet').querySelector('.help');
const overviewCheckbox = document.getElementById('overview').querySelector('.help');


// init
document.addEventListener('DOMContentLoaded', restoreOptions);

const languageSelection = document.getElementById('language');
languageSelection.addEventListener('change', saveOptions);


function addCheckEvent(checkbox) {
  checkbox.addEventListener('click', () => scriptCheck(checkbox.closest('[id]').id, checkbox.checked));
}

async function scriptCheck(scriptName, status) {
  console.log('saving status of:',scriptName,status);
  if(scriptName == 'overSign' || scriptName == 'raceSign')
  {
    chrome.storage.local.set({ [scriptName]: status });
  }
  else
  {
    const data = await chrome.storage.local.get({ script: '' }); //! FIXME
    data.script[scriptName] = status;
    chrome.storage.local.set({ script: data.script });
  }

}

// todo - use config to init and control flags?
document.querySelectorAll('input[type="checkbox"]').forEach(addCheckEvent);

function subCheckboxStatus(checkboxList){
  if (checkboxList[0].checked) {
    checkboxList[1].disabled = false;
    checkboxList[2].disabled = false;
  } else {
    checkboxList[1].disabled = true;
    checkboxList[2].disabled = true;
  }
}
function mainCheckboxEvent(divId) {
  const divNode = document.getElementById(divId);
  const checkboxes = divNode.getElementsByTagName('input');
  checkboxes[0].addEventListener('click',subCheckboxStatus.bind(null,checkboxes));
}

['strategy','setup'].forEach(mainCheckboxEvent);


const exportSave = document.getElementById('exportSave');
link.addEventListener('change', testLink);
sname.addEventListener('change', sName);

trackName.addEventListener('change', sTrack);

function sName() {
  sheetName = sname.value;
  chrome.storage.local.set({ gLinkName: sheetName });
}

function sTrack() {
  lowName = trackName.value.toLowerCase();
  //console.log("saving "+trackNameT);
  chrome.storage.local.set({ gTrack: lowName });
}

function testLink() {
  url = link.value;

  if (url == '') {
    link.className = '';
    chrome.storage.local.set({ gLink: url });
  } else {
    fetch(url)
      .then((res) => {
        if (res.ok) {
          link.className = 'valid';
          //console.log(res);

          chrome.storage.local.set({ gLink: url });
        }
      })
      .then((rep) => {
        console.log(rep);
      })
      .catch((error) => {
        console.log('invalid link');
        link.className = 'invalid';
      });
  }
}

function saveOptions() {
  const lang = document.getElementById('language').value;
  chrome.storage.local.set({ language: lang });
  //chrome.storage.local.set({sign: ,});
  restoreOptions();
}

function restoreOptions() {
  // Use default value language = 'eng'
  chrome.storage.local.get(
    {
      language: 'eng'
    },
    function (selected) {
      const code = selected.language;
      document.getElementById('language').value = code;
      document.getElementById('langTitle').childNodes[0].textContent = language[code].optionsText.languageText + ': ';
      document.getElementById('signOpt').textContent = language[code].optionsText.signOption;
      raceSign.nextElementSibling.textContent = language[code].optionsText.RaceReport;
      overSign.nextElementSibling.textContent = language[code].optionsText.StartOvertakes;

      gsheetCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.gsheet;
      leagueCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.leagueHome;
      researchCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.research;
      trainingCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.training;
      reviewCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.raceReview;
      marketCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.market;
      staffCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.myStaff;
      marketDriverCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.marketDriver;
      refreshCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.academyTimer;
      reportsCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.reports;
      overviewCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.carOverview;

      addFieldtipEvent(gsheetCheckbox);
      addFieldtipEvent(leagueCheckbox);
      addFieldtipEvent(researchCheckbox);
      addFieldtipEvent(trainingCheckbox);
      addFieldtipEvent(reviewCheckbox);
      addFieldtipEvent(staffCheckbox);
      addFieldtipEvent(marketCheckbox);
      addFieldtipEvent(marketDriverCheckbox);
      addFieldtipEvent(refreshCheckbox);
      addFieldtipEvent(reportsCheckbox);
      addFieldtipEvent(overviewCheckbox);
    }
  );

  chrome.storage.local.get('raceSign', function (data) {
    raceSign.checked = data.raceSign;
  });

  chrome.storage.local.get('overSign', function (data) {
    overSign.checked = data.overSign;
  });

  chrome.storage.local.get('gLink', function (data) {
    if (typeof data.gLink != 'undefined') link.value = data.gLink;
  });

  chrome.storage.local.get('gLinkName', function (data) {
    if (typeof data.gLinkName != 'undefined') sname.value = data.gLinkName;
  });

  chrome.storage.local.get('gTrack', function (data) {
    if (typeof data.gTrack != 'undefined') trackName.value = data.gTrack;
  });

  const script = {
    hq: true,
    league: true,
    market: true,
    overview: true,
    reports: true,
    research: true,
    setup: true,
    staff: true,
    strategy: true,
    review: true,
    refresh: true,
    marketDriver: true,
    train: true,
    edit: false,
    slider: true,
    editS: false,
    sliderS: true
  };

  chrome.storage.local.get({ script: script }, function (data) {
    Object.keys(script).forEach((item) => {
      document.getElementById(item).querySelector('input[type="checkbox"]').checked = data.script[item];
    });

    chrome.storage.local.set({ script: data.script });
    const strategy = document.getElementById('strategy').querySelectorAll('input');
    const setup = document.getElementById('setup').querySelectorAll('input');
    subCheckboxStatus(strategy);
    subCheckboxStatus(setup);

  });

  chrome.storage.local.get('save', function (d) {
    function download() {
      function downloadFile(data, download_name) {
        var blob = new Blob([data], { type: 'application/json;charset=utf-8;' });
        if (navigator.msSaveBlob) {
          // IE 10+
          navigator.msSaveBlob(blob, 'test');
        } else {
          const link = document.createElement('a');
          if (link.download !== undefined) {
            // feature detection
            // chromes that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', download_name);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }

      all = document.getElementById('exportSave').value;
      if (all == 0) {
        saved = d;
        filename = 'save';
      } else {
        saveID = document.getElementById('trackSave').value;
        track = document.getElementById('exportSave').value;
        saved = { [track]: { [saveID]: d.save[track][saveID] } };
        filename = `${track}_${saveID}`;
      }
      saveJSON = JSON.stringify(saved);
      downloadFile(saveJSON, filename);
    }

    function addButton() {
      dButton = document.createElement('div');
      dButton.className = 'btn fa fa-download';
      return dButton;
    }

    if (typeof d.save === 'undefined') {
    } else {
      defaultOption = document.createElement('option');
      defaultOption.textContent = 'All';
      defaultOption.value = 0;
      exportSave.parentElement.append(addButton());
      exportSave.append(defaultOption);
      Object.keys(d.save).forEach((item) => {
        if (Object.keys(d.save[item]).length > 0) {
          option = document.createElement('option');
          option.textContent = item;
          option.value = item;
          exportSave.append(option);
        }
      });

      document.querySelector('.fa-download').addEventListener('click', download);
      exportSave.addEventListener('change', function () {
        //console.log("changing");
        try {
          select = document.createElement('select');
          select.id = 'trackSave';

          if (this.value != 0) {
            Object.keys(d.save[this.value]).forEach((item) => {
              option = document.createElement('option');
              // console.log(d.save[this.value][item]);

              downloadButtons = document.querySelectorAll('.fa-download');
              downloadButtons.forEach((button) => {
                button.remove();
              });

              option.textContent = getStrategyString(d.save[this.value][item]);
              option.value = item;
              select.append(option);
            });
            if (document.getElementById('trackSave') != null) {
              document.getElementById('trackSave').remove();
            }
            if (Object.keys(d.save[this.value]).length > 0) {
              exportSave.parentElement.append(select);

              exportSave.parentElement.append(addButton());
            }
          } else {
            downloadButtons = document.querySelectorAll('.fa-download');
            downloadButtons.forEach((button) => {
              button.remove();
            });

            if (document.getElementById('trackSave') != null) {
              document.getElementById('trackSave').remove();
            }
            exportSave.parentElement.append(addButton());
          }
        } catch (error) {}

        document.querySelector('.fa-download').addEventListener('click', download);
      });
    }
  });
}

function getStrategyString(saveObject) {
  string = '';
  Object.keys(saveObject).forEach((stint) => {
    string += `${saveObject[stint].laps}${saveObject[stint].tyre.slice(3)} `;
  });
  return string;
}

const importSave = document.getElementById('myFile');
importSave.addEventListener('change', async function () {
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(this.files[0]);
  async function onReaderLoad(event) {
    try {
      var obj = JSON.parse(event.target.result);
      track = Object.keys(obj)[0];
      hashID = Object.keys(obj[track])[0];
      validTrack = [
        'be',
        'it',
        'sg',
        'my',
        'jp',
        'us',
        'mx',
        'br',
        'ae',
        'bh',
        'eu',
        'de',
        'es',
        'ru',
        'tr',
        'au',
        'at',
        'hu',
        'gb',
        'ca',
        'az',
        'mc',
        'cn',
        'fr',
        'save'
      ];

      if (validTrack.includes(track)) {
        chrome.storage.local.get('save', function (data) {
          if (typeof data.save === 'undefined') {
            if (track == 'save') chrome.storage.local.set({ save: obj.save });
            else chrome.storage.local.set({ save: obj });
          } else {
            if (track == 'save') {
              Object.keys(obj.save).forEach((track) => {
                if (data.save[track] != undefined) {
                  Object.keys(data.save[track]).forEach((save) => {
                    data.save[track][save] = obj.save[track][save];
                  });
                } else {
                  data.save[track] = obj.save[track];
                }
              });
            } else {
              if (typeof data.save[track] === 'undefined') {
                data.save[track] = { [hashID]: obj[track][hashID] };
              } else data.save[track][hashID] = obj[track][hashID];
            }

            chrome.storage.local.set({ save: data.save });
            importSave.className = 'valid upl';
          }
        });
      } else {
        console.log('invalid track');
        importSave.className = 'invalid upl';
      }
    } catch (error) {
      console.log('invalid');
      importSave.className = 'invalid upl';
    }
  }
});



/*raceSign.addEventListener('click', function () {
  var checkStatus = this.checked;
  console.log('saving',this)
  chrome.storage.local.set({ raceSign: checkStatus });
});

overSign.addEventListener('click', function () {
  var checkStatus = this.checked;
  chrome.storage.local.set({ overSign: checkStatus });
});
*/


function addFieldTip() {
  const span = document.createElement('span');
  span.id = 'fieldtip';
  span.setAttribute('style', 'opacity:0');
  return span;
}
function addFieldtipEvent(node) {
  let fieldtip = document.getElementById('fieldtip');
  if (fieldtip == null) {
    fieldtip = addFieldTip();
    document.body.append(fieldtip);
  }
  node.addEventListener('mouseenter', function () {
    fieldtip.textContent = node.dataset.fieldtip;
    fieldtip.style.display = 'inline-block';
    var position = {
      top: node.offsetTop - fieldtip.offsetHeight - 16,
      left: node.offsetLeft - fieldtip.offsetWidth / 2 + 16
    };
    fieldtip.style.opacity = 1;

    fieldtip.setAttribute('style', `top:${position.top}px;left:${position.left}px`);
  });

  node.addEventListener('mouseleave', function () {
    fieldtip.style.opacity = 0;
    fieldtip.style.display = 'none';
  });
}

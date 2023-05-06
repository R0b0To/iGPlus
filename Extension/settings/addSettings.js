
(async () => {
  if (!document.getElementById('iGPlus')) {
    const { injectIGPlusOptions } = await import(chrome.runtime.getURL('/settings/settingsHTML.js'));
    injectIGPlusOptions().then( res => {if(res) handleSettings();});
  }
})();


function handleSettings() {

  const DEBUG = false;
  const raceSign = document.getElementById('raceSign');
  const overSign = document.getElementById('overSign');
  const link = document.getElementById('link');
  const sname = document.getElementById('sname');
  const trackName = document.getElementById('track');
  const languageSelection = document.getElementsByName('language')[0];
  const separator = document.getElementById('separator');
  const leagueCheckbox = document.getElementById('league');
  const researchCheckbox = document.getElementById('research');
  const trainingCheckbox = document.getElementById('train');
  const staffCheckbox = document.getElementById('staff');
  const marketCheckbox = document.getElementById('market');
  const marketDriverCheckbox = document.getElementById('marketDriver');
  const refreshCheckbox = document.getElementById('refresh');
  const reportsCheckbox = document.getElementById('reports');
  const reviewCheckbox = document.getElementById('review');
  const gsheetCheckbox = document.getElementById('Gsheet');
  const overviewCheckbox = document.getElementById('overview');
  const advancedHisCheckbox = document.getElementById('history');
  const sponsorCheckbox = document.getElementById('sponsor');
  const gdrive = document.getElementById('gdrive');
  const forceSyncBtn = document.getElementById('forceSync');
  //const forceSyncBtnDown = document.getElementById('forceSyncDown');

  restoreOptions();


  languageSelection.addEventListener('change', saveOptions);

  // todo - use config to init and control flags?
  // adding the eventlister to all the checkboxes as the function is the same
  document.querySelectorAll('input[type="checkbox"]').forEach(addCheckEvent);

  function addCheckEvent(checkbox) {
    //add event listener to checkbox that stores the checkbox status, passing the script name (id)
    checkbox.addEventListener('click', () => scriptCheck(checkbox.closest('div').id, checkbox.checked));
  }

  async function scriptCheck(scriptName, status) {
    if (scriptName == 'overSign' || scriptName == 'raceSign') {
      chrome.storage.local.set({ [scriptName]: status });
      restoreOptions();
    }
    else {
      if (scriptName == 'gdrive') {
        if (status) {
          checkAuth();
        } else
        {
          forceSyncBtn.classList.remove('visibleSync');//forceSyncBtnDown.classList.remove('visibleSync');
        }
          

        chrome.storage.local.set({ [scriptName]: status });
      }
      mergeStorage(scriptName, status);
    }

  }

  separator.addEventListener('beforeinput', function () { this.value = ''; });
  separator.addEventListener('input', function () {
    chrome.storage.local.set({ separator: this.value });
  });
  /**
 * Enable or disable the checkboxes affiliated with the main div
 *
 * @param {HTMLCollection} checkboxList - The 3 checkbox elements .
 */
  function subCheckboxStatus(checkboxList) {
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
    checkboxes[0].addEventListener('click', subCheckboxStatus.bind(null, checkboxes));
  }

  async function mergeStorage(scriptName, scriptValue) {
    chrome.storage.local.get({ script: '' }, (data) => {
      data.script[scriptName] = scriptValue;
      chrome.storage.local.set({ script: data.script });
    });

  }

  async function onlyOne() {

    const checkboxes = this.parentElement.parentElement.querySelectorAll('input[type="checkbox"]');
    const options = Array.prototype.slice.call(checkboxes, -2); //getting only the 2 options
    options.forEach(async checkbox => {
      const id = checkbox.parentElement.id;
      if (id != this.parentElement.id)
        checkbox.checked = false;
    });
    chrome.storage.local.get({ script: '' }, (data) => {
      data.script[options[0].parentElement.id] = options[0].checked;
      data.script[options[1].parentElement.id] = options[1].checked;
      chrome.storage.local.set({ script: data.script });
    });


  }
  function onlyOneEvent(check) {
    const checkbox = document.getElementById(check).querySelector('input');
    checkbox.addEventListener('change', onlyOne);
  }

  ['strategy', 'setup'].forEach(mainCheckboxEvent);
  ['edit', 'slider', 'editS', 'sliderS'].forEach(onlyOneEvent);

  const exportSave = document.getElementById('exportSave');
  link.addEventListener('change', testLink);
  sname.addEventListener('change', sName);

  trackName.addEventListener('change', sTrack);

  function sName() { chrome.storage.local.set({ gLinkName: sname.value }); }
  function sTrack() { chrome.storage.local.set({ gTrack: trackName.value.toLowerCase() }); }

  function testLink() {
    const url = link.value;

    if (url == '') {
      link.className = '';
      chrome.storage.local.set({ gLink: url });
    } else {
      fetch(url)
        .then((res) => {
          if (res.ok) {
            link.className = 'valid';
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
    let lang = languageSelection.value;
    //if(lang == 'en ') lang = 'eng'; if(lang == 'it') lang = 'ita'; if(lang != 'en' && lang != 'it') lang = 'eng';
    switch (lang) {
    case 'it': lang = 'it';
      break;
    default: lang = 'en';
      break;
    }
    //console.log('setting language to',lang);
    chrome.storage.local.set({ language: lang });
    restoreOptions();
  }


  async function restoreOptions() {
    const { fetchManagerData } = await import( chrome.runtime.getURL('common/fetcher.js') );

    const { language } = await import(chrome.runtime.getURL('/common/localization.js'));
    chrome.storage.local.get({ language: false }, async function (selected) {
      let code = selected.language;
      if(selected.language == false){const managerData = await fetchManagerData();
        (managerData.language == 'en' || managerData.language == 'it') ? code = managerData.language : code = 'en'; }


      function setTextToFieldtip(node, option) { node.querySelector('.help').attributes['data-fieldtip'].value = language[code].scriptDescription[option]; }
      function setTextToCheckbox(node, option) { node.querySelector('.text').textContent = language[code].optionsText[option]; }
      //languageSelection.value = code;

      //document.getElementById('langTitle').childNodes[0].textContent = language[code].optionsText.languageText + ': ';
      document.getElementById('preferences').textContent = language[code].optionsText.preferences;
      separator.previousElementSibling.textContent = language[code].optionsText.separator;

      await chrome.storage.local.get('raceSign', function (data) {
        raceSign.querySelector('input').checked = data.raceSign;
        raceSign.querySelector('span').textContent = language[code].optionsText.RaceReport + ((raceSign.querySelector('input').checked) ? (' ( - )') : (' ( + )'));
      });
  
      await chrome.storage.local.get('overSign', function (data) {
        overSign.querySelector('input').checked = data.overSign;
        overSign.querySelector('span').textContent = language[code].optionsText.StartOvertakes + ((overSign.querySelector('input').checked) ? (' ( - )') : (' ( + )'));
      });
     // raceSign.querySelector('span').textContent = language[code].optionsText.RaceReport + ((raceSign.querySelector('input').checked) ? (' ( - )') : (' ( + )'));
     // overSign.querySelector('span').textContent = language[code].optionsText.StartOvertakes + ((overSign.querySelector('input').checked) ? (' ( - )') : (' ( + )'));

      setTextToFieldtip(gsheetCheckbox, 'gsheet');
      setTextToFieldtip(leagueCheckbox, 'leagueHome');
      setTextToFieldtip(researchCheckbox, 'research');
      setTextToFieldtip(trainingCheckbox, 'training');
      setTextToFieldtip(reviewCheckbox, 'raceReview');
      setTextToFieldtip(marketCheckbox, 'market');
      setTextToFieldtip(staffCheckbox, 'myStaff');
      setTextToFieldtip(marketDriverCheckbox, 'marketDriver');
      setTextToFieldtip(refreshCheckbox, 'academyTimer');
      setTextToFieldtip(reportsCheckbox, 'reports');
      setTextToFieldtip(overviewCheckbox, 'carOverview');
      setTextToFieldtip(advancedHisCheckbox, 'history');
      setTextToFieldtip(sponsorCheckbox, 'sponsor');

      setTextToCheckbox(reviewCheckbox, 'home');
      setTextToCheckbox(leagueCheckbox, 'leagueHome');
      setTextToCheckbox(researchCheckbox, 'research');
      setTextToCheckbox(trainingCheckbox, 'training');
      setTextToCheckbox(marketCheckbox, 'staffMarket');
      setTextToCheckbox(staffCheckbox, 'staff');
      setTextToCheckbox(marketDriverCheckbox, 'driverMarket');
      setTextToCheckbox(refreshCheckbox, 'academyTimer');
      setTextToCheckbox(reportsCheckbox, 'reports');
      setTextToCheckbox(overviewCheckbox, 'carOverview');
      setTextToCheckbox(advancedHisCheckbox, 'advancedHis');
      setTextToCheckbox(sponsorCheckbox, 'verticalSponsor');
      setTextToCheckbox(document.getElementById('strategy'), 'raceStrategy');
      setTextToCheckbox(document.getElementById('setup'), 'raceSetup');
      setTextToCheckbox(document.getElementById('editS'), 'edit');
      setTextToCheckbox(document.getElementById('edit'), 'edit');
      document.getElementById('exportLabel').textContent = language[code].optionsText.export;
      const field = document.getElementById('googleSheetContainer').querySelectorAll('.text');
      field[0].textContent = language[code].optionsText.link;
      field[1].textContent = language[code].optionsText.track;
      field[2].textContent = language[code].optionsText.sheetName;

      [gsheetCheckbox, leagueCheckbox, researchCheckbox, trainingCheckbox, reviewCheckbox, staffCheckbox, marketCheckbox, marketDriverCheckbox, refreshCheckbox, reportsCheckbox, overviewCheckbox, advancedHisCheckbox, sponsorCheckbox]
        .forEach(addFieldtipEvent);

    }
    );



    chrome.storage.local.get({ 'separator': ',' }, function (data) {
      separator.value = data.separator;
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
    chrome.storage.local.get('gdrive', async function (data) {
      if (typeof data.gdrive != 'undefined') {
        gdrive.querySelector('input').checked = data.gdrive;
        (data.gdrive) ? forceSyncBtn.classList.add('visibleSync') : forceSyncBtn.classList.remove('visibleSync');
        //(data.gdrive) ? forceSyncBtnDown.classList.add('visibleSync') : forceSyncBtnDown.classList.remove('visibleSync');
      }
      if(forceSyncBtn.classList.contains('visibleSync'))
      {
        const dateOfLastSync = await chrome.storage.local.get('syncDate') ?? await browser.storage.local.get('syncDate');
        const syncText = document.getElementById('syncDate')
        if(!syncText){
          const dateContainer = document.createElement('div');
          dateContainer.id = 'syncDate';
          dateContainer.textContent =`Last Sync: ${dateOfLastSync.syncDate}`;
          gdrive.append(dateContainer);
        }else{
          syncText.textContent =`Last Sync: ${dateOfLastSync.syncDate}`;
        }
       
      }
    });

    const { scriptDefaults } = await import(chrome.runtime.getURL('/common/config.js'));


    chrome.storage.local.get({ script: scriptDefaults }, function (data) {
      Object.keys(scriptDefaults).forEach((item) => {
        let checkedStatus = data.script[item];

        if (item == 'gdrive' && checkedStatus) checkAuth();

        document.getElementById(item).querySelector('input[type="checkbox"]').checked = checkedStatus;
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

        const all = document.getElementById('exportSave').value;
        let filename = 'save';
        let saved = d;

        if (all == 0) {
          saved = d;
          filename = 'save';
        } else {
          const saveID = document.getElementById('trackSave').value;
          const track = document.getElementById('exportSave').value;
          saved = { [track]: { [saveID]: d.save[track][saveID] } };
          filename = `${track}_${saveID}`;
        }
        const saveJSON = JSON.stringify(saved);
        downloadFile(saveJSON, filename);
      }

      //remove old values in case restore is called
      if (document.getElementById('exportBtn')) {

        if(document.getElementById('trackSave'))
          document.getElementById('trackSave').remove();

        document.getElementById('deleteBtn').remove();
        document.getElementById('exportBtn').remove();
        document.getElementById('exportSave').replaceChildren();
      }

      function addButton(name,id,className) {
        const dButton = document.createElement('div');
        dButton.textContent = name;
        dButton.classList.add(className, 'fa-download');
        dButton.id = id;
        return dButton;
      }
      const download_button = addButton('Download','exportBtn','btn');
      const delete_button = addButton('Delete','deleteBtn','btn3');

      if (typeof d.save === 'undefined') {

      }
      else {


        let save_to_display = false;
        for(const [key,value] of Object.entries(d.save))
        {
          if(Object.keys(value).length > 0)
          {
            save_to_display = true;
            const option = document.createElement('option');
            option.textContent = key;
            option.value = key;
            exportSave.append(option);
          }
        }

        if(save_to_display){
          const defaultOption = document.createElement('option');
          defaultOption.textContent = 'All';
          defaultOption.value = 0;
          exportSave.parentElement.append(download_button,delete_button);
          exportSave.prepend(defaultOption);
          exportSave.selectedIndex = 0;
        }

        delete_button.addEventListener('click', async function(){
          const track = document.getElementById('exportSave').value;
          let token = false;
          const isSyncEnabled = await chrome.storage.local.get({'gdrive':false});
          if(isSyncEnabled.gdrive){
            const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
            token = await getAccessToken();
          }

          const strategies = await chrome.storage.local.get('save');
          if(track == 0)
          {
            chrome.storage.local.remove('save');
            if(isSyncEnabled.gdrive)
            {
              chrome.runtime.sendMessage({
                type:'deleteFile',
                data:{type:'strategies',track:track,name:'delete_strategies'},
                token:token.access_token});
            }

          }else{
            const strategy = document.getElementById('trackSave').value;
            delete strategies.save[track][strategy];

            if(Object.keys(strategies.save[track]).length == 0)
              delete strategies.save[track];

            chrome.storage.local.set({'save':strategies.save});

            if(Object.keys(strategies.save).length == 0)
              chrome.storage.local.remove('save');
            if(isSyncEnabled.gdrive)
            {
              if(token != false){
                chrome.runtime.sendMessage({
                  type:'deleteFile',
                  data:{type:'strategies',track:track,name:strategy},
                  token:token.access_token});
              }
            }


          }
          restoreOptions();
        });
        download_button.addEventListener('click', download);
        exportSave.addEventListener('change', function () {
          //console.log("changing");
          try {
            const select = document.createElement('select');
            select.id = 'trackSave';

            if (this.value != 0) {
              Object.keys(d.save[this.value]).forEach((item) => {
                const option = document.createElement('option');
                // console.log(d.save[this.value][item]);

                const downloadButtons = document.querySelectorAll('.fa-download');
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

                exportSave.parentElement.append(download_button,delete_button);
              }
            } else {
              const downloadButtons = document.querySelectorAll('.fa-download');
              downloadButtons.forEach((button) => {
                button.remove();
              });

              if (document.getElementById('trackSave') != null) {
                document.getElementById('trackSave').remove();
              }
              exportSave.parentElement.append(download_button,delete_button);
            }
          } catch (error) { }

          document.querySelector('.fa-download').addEventListener('click', download);
        });
      }
    });
  }


  async function checkAuth() {
    const { getFirstAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const token = await getFirstAccessToken();
    if (token == false) {
      chrome.storage.local.set({'gdrive':false})
      document.getElementById('gdrive').querySelector('input[type="checkbox"]').checked = false;
      forceSyncBtn.classList.remove('visibleSync');
      //forceSyncBtnDown.classList.remove('visibleSync');
      return false;
    }
    const loader = addLoader(document.getElementById('forceSync'));
    if(token != false)
    {
      chrome.runtime.sendMessage({type:'syncData',direction:false,token:token.access_token}, (responce) =>{
        if(responce.done)
        {
          try {
            loader.remove(); forceSyncBtn.classList.add('visibleSync');
            restoreOptions();
          } catch (error) {
            //user left the page
          }

        }
      });

    }

    return token.access_token;
  }

  function getStrategyString(saveObject) {
    let string = '';
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
        const track = Object.keys(obj)[0];
        const hashID = Object.keys(obj[track])[0];
        const validTrack = ['be', 'it', 'sg', 'my', 'jp', 'us', 'mx', 'br', 'ae', 'bh', 'eu', 'de', 'es', 'ru', 'tr', 'au', 'at', 'hu', 'gb', 'ca', 'az', 'mc', 'cn', 'fr', 'save'];

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
          importSave.className = 'invalid upl';
        }
        setTimeout(restoreOptions,200);
      } catch (error) {
        importSave.className = 'invalid upl';
      }
    }

  });


  function addFieldTip() {
    const span = document.createElement('span');
    span.id = 'fieldtip';
    span.setAttribute('style', 'opacity:0');
    return span;
  }
  function addFieldtipEvent(node) {
    const helpnode = node.querySelector('.help');
    let fieldtip = document.getElementById('fieldtip');
    if (fieldtip == null) {
      fieldtip = addFieldTip();
      document.getElementById('iGPlus').append(fieldtip);
    }
    helpnode.addEventListener('mouseenter', function () {
      fieldtip.textContent = helpnode.dataset.fieldtip;
      fieldtip.style.display = 'inline-block';

      const nodeRect = helpnode.getClientRects()[0];

      var position = {
        top: helpnode.offsetTop - fieldtip.offsetHeight - 16,
        left: helpnode.offsetLeft - fieldtip.offsetWidth / 2 + 16
      };

      fieldtip.style.top = `${position.top}px`;
      fieldtip.style.left = `${position.left}px`;
      fieldtip.style.opacity = 1;

    });

    helpnode.addEventListener('mouseleave', function () {
      fieldtip.style.opacity = 0;
      fieldtip.style.display = 'none';
    });
  }
  function addLoader(parent) {
    parent.style.display = 'none';
    const loader = document.createElement('span');
    loader.classList.add('loader');
    parent.parentElement.append(loader);
    return loader;
  }

  forceSyncBtn.addEventListener('click', async function () {
    const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const token = await getAccessToken();
    forceSyncBtn.classList.remove('visibleSync');
    const loader = addLoader(this);

    if(token != false)
    {
      chrome.runtime.sendMessage({type:'syncData',direction:true,token:token.access_token}, (responce) =>{
        if(responce.done)
        {
          try {
            loader.remove();
            forceSyncBtn.classList.add('visibleSync');
            restoreOptions();
          } catch (error) {
            //user left the page
          }

        }
      });

    }
    else{
      //alert('user closed popup')
      loader.remove();
      forceSyncBtn.classList.add('visibleSync');
    }


  });

}
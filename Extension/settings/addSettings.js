(function init(a){
  if(!document.getElementById('iGPlus'))
  {
    injectIGPlusOptions();
  }

})();

function injectIGPlusOptions(){
  const generalContainer = document.getElementById('general');
  if(!generalContainer)
  return

  const create = (tag)=>{return document.createElement(tag);};
  const mainContainer = create('div');
  function addDescription(description){
    const descriptionSpan = create('span');
    descriptionSpan.classList.add('help','gg-info');
    descriptionSpan.setAttribute('data-fieldtip',description);
    return descriptionSpan;
  }
  function appendWithDescription(a,b){a.append(b);return a;}

  function createScriptCheckbox(id,name){
    const optionContainer = create('div');
    optionContainer.classList.add('checkbox-wrapper');
    optionContainer.id = id;
    const inputCheck = create('input');
    inputCheck.type = 'checkbox';
    inputCheck.id = id + 'check';
    const labelCheck = create('label');
    labelCheck.setAttribute('for', inputCheck.id);
    const tick = create('div');
    tick.classList.add('tick_mark');
    const scriptName = create('span');
    scriptName.textContent = name;
    scriptName.setAttribute('for',inputCheck.id);
    labelCheck.append(tick);
    optionContainer.append(inputCheck,labelCheck,scriptName);
    return optionContainer;

  }

  const separatorContainer = create('div');
  const separatorInput = create('input');
  separatorInput.placeholder = ',';
  separatorInput.id = 'separator';
  const separatorTitleText = create('span');
  separatorTitleText.textContent = 'Custom Separator';
  separatorContainer.append(separatorTitleText,separatorInput);

  //preferences
  const preferencesContainer = create('fieldset');
  const preferenceslegend = create('legend');
  preferenceslegend.textContent = 'iGPlus preferences';
  preferenceslegend.id = 'preferences';
  preferencesContainer.append(preferenceslegend,
    createScriptCheckbox('raceSign','Race Report Sign'),
    createScriptCheckbox('overSign','Overtakes Sign'),
    separatorContainer
  );

    function appendSubCheks(a,b,c){  a.append(b,c);  return a;  }



  //scripts
  const scriptsContainer = create('fieldset');
  scriptsContainer.id = 'scripts';
  const scriptsLegend = create('legend');
  scriptsLegend.textContent = 'Scripts';

  scriptsContainer.append(scriptsLegend,
    appendWithDescription(createScriptCheckbox('review','Race Review'),
      addDescription('Home page review button. It opens https://igpmanager.com/app/d=raceReview')),

    appendWithDescription(createScriptCheckbox('league','League Home'),
      addDescription('In the league page add a full race history button and position finished to each track')),

    appendWithDescription(createScriptCheckbox('research','Research'),
      addDescription('Add a table with the values from the bars in the research menu')),

    appendWithDescription(createScriptCheckbox('train','Training'),
      addDescription('Add an extra column in the training page if driver is recovering.')),

    appendWithDescription(createScriptCheckbox('staff','My Staff'),
      addDescription('Shows strenght of CD in the staff menus')),

    appendWithDescription(createScriptCheckbox('market','Market (strength and weakness icons)'),
      addDescription('Shows strenght and weakness of CD in the transfer market')),

    appendWithDescription(createScriptCheckbox('marketDriver','Market (Drivers)'),
      addDescription('Add talent column for drivers in the transfer market')),

      appendSubCheks(createScriptCheckbox('strategy','Race Strategy'), createScriptCheckbox('sliderS','Slider'), createScriptCheckbox('editS','Editable')),
   appendSubCheks( createScriptCheckbox('setup','Race Setup'), createScriptCheckbox('slider','Slider'), createScriptCheckbox('edit','Editable')),

    appendWithDescription(createScriptCheckbox('overview','Car Overview'),
      addDescription('Enable review button (design research) during a live race')),

    createScriptCheckbox('hq','HQ Level Labels'),

    appendWithDescription(createScriptCheckbox('refresh','Academy Auto-Refresh'),
      addDescription('Add youth academy countdown. It will be placed as a notification beside the HQ menu option')),

    appendWithDescription(createScriptCheckbox('reports','Reports'),
      addDescription('Add option to extract all the reports lap by lap of the drivers. Qualifying and race reports with team names csv')),

    appendWithDescription(createScriptCheckbox('history','Advanced History'),
      addDescription('Add track charateristics to the history page')),

    appendWithDescription(createScriptCheckbox('sponsor','Vertical Sponsor'),
      addDescription('Display the sponsor options vertically')),

  );

  const googleSheetContainer = create('fieldset');
  const legendGoogleSheetContainer = create('legend');
  legendGoogleSheetContainer.textContent = 'Google Sheet';
  legendGoogleSheetContainer.append(addDescription('Import google data to be displayed in the strategy page below the advanced options'));
  legendGoogleSheetContainer.id = 'Gsheet';
  //legendGoogleSheetContainer.classList.add('help','fa-solid','fa-circle-info');
  //legendGoogleSheetContainer.setAttribute('data-fieldtip','Import google data to be displayed in the strategy page below the advanced options');


  function createInputField(id,name){
    const container = create('div');
    const label = create('label');
    label.textContent = name;
    const input = create('input');
    input.id = id;
    input.type = 'text';
    label.setAttribute('for',id);
    input.placeholder = name;
    container.append(label,input);
    return container;
  }
  const linkContainer = createInputField('link','Link:');
  const trackIdContainer = createInputField('track','Track ID column header');
  const sheetNameContainer = createInputField('sname','Sheet Name:');

  const example = create('span');
  example.textContent = 'optional';
  const exampleLink = create('a');
  exampleLink.textContent = '(Example)';
  exampleLink.target = '_blank';
  exampleLink.classList.add('avoid');
  exampleLink.href = 'https://docs.google.com/spreadsheets/d/1_SrsrcfI9YXKKBatLef7SjmGDV8JEc7mp8AKrQxVcDc/';
  sheetNameContainer.append(example,exampleLink);

  googleSheetContainer.append(legendGoogleSheetContainer,linkContainer,trackIdContainer,sheetNameContainer);

  const strategiesContainer = create('fieldset');
  const strategiesLegend = create('legend');
  strategiesLegend.textContent = 'Strategies';

  const strategies = create('div');
  strategies.classList.add('exportContainer');
  const strategiesLabel = create('label');
  strategiesLabel.textContent = 'Upload';
  strategiesLabel.setAttribute('for','myFile');
  const strategiesInput = create('input');
  strategiesInput.type = 'file';
  strategiesInput.id = 'myFile';
  strategiesLabel.classList.add('upload','btn');
  const exportContainer = create('span');
  exportContainer.textContent = 'Export:';
  const options = create('select');
  options.id = 'exportSave';
  exportContainer.id = 'exportLabel';
  strategies.append(strategiesLabel,strategiesInput,exportContainer,options);
  strategiesContainer.append(strategiesLegend,strategies);

  const gdrive = create('fieldset');
  const forceSync = create('span');
  forceSync.classList.add('btn');
  forceSync.textContent = 'Force Sync';
  forceSync.style.display = 'none';
  forceSync.id = 'forceSync';
  gdrive.append(appendWithDescription(createScriptCheckbox('gdrive','Cloud Sync'),forceSync));

  mainContainer.append(preferencesContainer,scriptsContainer,strategiesContainer,googleSheetContainer,gdrive);
  mainContainer.id = 'iGPlus';
  
  generalContainer.append(mainContainer);


  handleSettings();

}

function handleSettings(){

  const DEBUG = false;
  const raceSign = document.getElementById('raceSign');
  const overSign = document.getElementById('overSign');
  const link = document.getElementById('link');
  const sname = document.getElementById('sname');
  const trackName = document.getElementById('track');
  const languageSelection = document.getElementsByName('language')[0];
  const separator  = document.getElementById('separator');

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
  const advancedHisCheckbox = document.getElementById('history').querySelector('.help');
  const sponsorCheckbox = document.getElementById('sponsor').querySelector('.help');
  const gdrive = document.getElementById('gdrive');
  const forceSyncBtn = document.getElementById('forceSync');

  // init



 restoreOptions();


  languageSelection.addEventListener('change', saveOptions);

  // todo - use config to init and control flags?
  // adding the eventlister to all the checkboxes as the function is the same
  document.querySelectorAll('input[type="checkbox"]').forEach(addCheckEvent);

  function addCheckEvent(checkbox) {
  //add event listener to checkbox that stores the checkbox status, passing the script name (id)
    if(DEBUG)console.log('adding click event to',checkbox.closest('div'));
    checkbox.addEventListener('click', () => scriptCheck(checkbox.closest('div').id, checkbox.checked));
  }

  async function scriptCheck(scriptName, status) {
    if(DEBUG)console.log('saving status of:',scriptName,status);
    if(scriptName == 'overSign' || scriptName == 'raceSign')
    {
      chrome.storage.local.set({ [scriptName]: status });
      restoreOptions();
    }
    else
    {
      if(scriptName == 'gdrive') {
        if(status) {
          checkAuth();
        }else forceSyncBtn.classList.remove('visible');

        chrome.storage.local.set({ [scriptName]: status });
      }
      mergeStorage(scriptName,status);
    }

  }



  separator.addEventListener('beforeinput',function(){this.value = '';});
  separator.addEventListener('input',function(){
    chrome.storage.local.set({ separator: this.value });
  });
  /**
 * Enable or disable the checkboxes affiliated with the main div
 *
 * @param {HTMLCollection} checkboxList - The 3 checkbox elements .
 */
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

  async function mergeStorage(scriptName,scriptValue)
  {
    chrome.storage.local.get({ script: '' },(data)=>{
      data.script[scriptName] = scriptValue;
      chrome.storage.local.set({ script: data.script });
    });

  }

  async function onlyOne(){

    const checkboxes = this.parentElement.parentElement.querySelectorAll('input[type="checkbox"]');
    const options = Array.prototype.slice.call(checkboxes, -2); //getting only the 2 options
    options.forEach(async checkbox =>  {
      const id = checkbox.parentElement.id;
      if(id != this.parentElement.id)
        checkbox.checked = false;
    });
    chrome.storage.local.get({ script: '' },(data)=>{
      data.script[options[0].parentElement.id] = options[0].checked;
      data.script[options[1].parentElement.id] = options[1].checked;
      chrome.storage.local.set({ script: data.script });
    });


  }
  function onlyOneEvent(check){
    const checkbox = document.getElementById(check).querySelector('input');
    checkbox.addEventListener('change',onlyOne);
  }

  ['strategy','setup'].forEach(mainCheckboxEvent);
  ['edit','slider','editS','sliderS'].forEach(onlyOneEvent);

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
    if(lang == 'en ') lang ='eng'; if(lang == 'it') lang = 'ita'; if(lang!= 'en' || lang!= 'it') lang = 'eng';
    chrome.storage.local.set({ language: lang });
    restoreOptions();
  }

  async function restoreOptions() {
    const {language}  = await import(chrome.runtime.getURL('/common/localization.js'));
    chrome.storage.local.get({language: 'eng'},function (selected){
      const code = selected.language;

      //languageSelection.value = code;

      //document.getElementById('langTitle').childNodes[0].textContent = language[code].optionsText.languageText + ': ';
      document.getElementById('preferences').textContent = language[code].optionsText.preferences;
      separator.previousElementSibling.textContent = language[code].optionsText.separator;

      raceSign.querySelector('span').textContent = language[code].optionsText.RaceReport;
      overSign.querySelector('span').textContent = language[code].optionsText.StartOvertakes;

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
      advancedHisCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.history;
      sponsorCheckbox.attributes['data-fieldtip'].value = language[code].scriptDescription.sponsor;

      [gsheetCheckbox,leagueCheckbox,researchCheckbox,trainingCheckbox,reviewCheckbox,staffCheckbox,marketCheckbox,marketDriverCheckbox,refreshCheckbox,reportsCheckbox,overviewCheckbox,advancedHisCheckbox,sponsorCheckbox]
        .forEach(addFieldtipEvent);

    }
    );

    chrome.storage.local.get({'separator':','}, function (data) {
      separator.value = data.separator;
    });
    chrome.storage.local.get('raceSign', function (data) {
      raceSign.querySelector('input').checked = data.raceSign;
      (data.raceSign) ? raceSign.querySelector('span').textContent += ' ( - )' : raceSign.querySelector('span').textContent += ' ( + )';
    });

    chrome.storage.local.get('overSign', function (data) {
      overSign.querySelector('input').checked = data.overSign;
      (data.overSign) ? overSign.querySelector('span').textContent += ' ( - )' : overSign.querySelector('span').textContent += ' ( + )';
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
    chrome.storage.local.get('gdrive', function (data) {
      if (typeof data.gdrive != 'undefined') {
        if(DEBUG)console.log('restoring',data.gdrive);
        gdrive.querySelector('input').checked = data.gdrive;
        (data.gdrive) ? forceSyncBtn.classList.add('visible') : forceSyncBtn.classList.remove('visible');
      }
    });

    const { scriptDefaults } = await import(chrome.runtime.getURL('/common/config.js'));


    chrome.storage.local.get({ script: scriptDefaults }, function (data) {
      Object.keys(scriptDefaults).forEach((item) => {
        if(DEBUG)console.log('restoring checked status of',item,'with',data.script[item]);
        let checkedStatus = data.script[item];

        if(item == 'gdrive' && checkedStatus) checkAuth();

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
      if(document.getElementById('exportBtn')){
        document.getElementById('exportBtn').remove();
        document.getElementById('exportSave').replaceChildren();
      }

      function addButton() {
        const dButton = document.createElement('div');
        dButton.textContent = 'Download'
        dButton.classList.add('btn','fa-download');
        dButton.id = 'exportBtn';
        return dButton;
      }

      if (typeof d.save === 'undefined') {
      } else {
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'All';
        defaultOption.value = 0;
        exportSave.parentElement.append(addButton());
        exportSave.append(defaultOption);
        Object.keys(d.save).forEach((item) => {
          if (Object.keys(d.save[item]).length > 0) {
            const option = document.createElement('option');
            option.textContent = item;
            option.value = item;
            exportSave.append(option);
          }
        });

        document.querySelector('.fa-download').addEventListener('click', download);
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

                exportSave.parentElement.append(addButton());
              }
            } else {
              const downloadButtons = document.querySelectorAll('.fa-download');
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


  async function checkAuth(){
    const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const ACCESS_TOKEN = await getAccessToken();
    if(ACCESS_TOKEN == -1 || ACCESS_TOKEN == -2)
    {
      mergeStorage('gdrive',false);
      document.getElementById('gdrive').querySelector('input[type="checkbox"]').checked = false;
      forceSyncBtn.classList.remove('visible');
      return false;
    }

    const loader = addLoader(document.getElementById('forceSync'));
    await syncData(false,ACCESS_TOKEN).then(()=>{loader.remove();forceSyncBtn.classList.add('visible');}); //priority to get first the settings on the cloud
    return ACCESS_TOKEN;
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
        const validTrack = ['be','it','sg','my','jp','us','mx','br','ae','bh','eu','de','es','ru','tr','au','at','hu','gb','ca','az','mc','cn','fr','save'];

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
      document.getElementById('iGPlus').append(fieldtip);
    }
    node.addEventListener('mouseenter', function () {
      fieldtip.textContent = node.dataset.fieldtip;
      fieldtip.style.display = 'inline-block';
      
      const nodeRect = node.getClientRects()[0];
     
      var position = {
        top: node.offsetTop - fieldtip.offsetHeight - 16,
        left: node.offsetLeft - fieldtip.offsetWidth / 2 + 16
      };    
      
      fieldtip.style.top= `${position.top}px`;
      fieldtip.style.left= `${position.left}px`;
      fieldtip.style.opacity = 1;

    });

    node.addEventListener('mouseleave', function () {
      fieldtip.style.opacity = 0;
      fieldtip.style.display = 'none';
    });
  }
  function addLoader(parent){
    parent.style.display = 'none';
    const loader = document.createElement('span');
    loader.classList.add('loader');
    parent.parentElement.append(loader);
    return loader;
  }
  forceSyncBtn.addEventListener('click',async function(){
    const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const token = await getAccessToken();
    forceSyncBtn.classList.remove('visible');
    const loader = addLoader(this);
    syncData(true,token).then(()=>{loader.remove();forceSyncBtn.classList.add('visible');});

  });
  /**
 * sync all data to and from the cloud
 * @param {Boolean} direction true is local to cloud , false is cloud to local
 */
  async function syncData(direction,token){
    const { localToCloud,cloudToLocal } = await import(chrome.runtime.getURL('/auth/gDriveHelper.js'));
    console.log('token is',token.access_token);
    if(token != false){
    if(direction)  {await localToCloud(token.access_token); await cloudToLocal(token.access_token);}
    else  {await cloudToLocal(token.access_token); await localToCloud(token.access_token);}
    restoreOptions();
    }
    
  }

}
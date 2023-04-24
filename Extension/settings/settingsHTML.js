
function injectIGPlusOptions(){
  const generalContainer = document.getElementById('general');
  if(!generalContainer)
    return;

  function create(tag){
    return document.createElement(tag);};
  function addDescription(description){
    const descriptionSpan = create('span');
    descriptionSpan.classList.add('help','gg-info');
    descriptionSpan.setAttribute('data-fieldtip',description);
    return descriptionSpan; }
  function appendWithDescription(a,b){a.append(b);
    return a;}
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
    scriptName.classList.add('text');
    scriptName.setAttribute('for',inputCheck.id);
    labelCheck.append(tick);
    optionContainer.append(inputCheck,labelCheck,scriptName);
    return optionContainer;}
  function appendSubCheks(a,b,c){  a.append(b,c);  
    return a;}

//#region --------------------------Preferences--------------------------
  const separatorContainer = create('div');
  const separatorInput = create('input');
  separatorInput.placeholder = ',';
  separatorInput.id = 'separator';
  const separatorTitleText = create('span');
  separatorTitleText.textContent = 'Custom Separator';
  separatorContainer.append(separatorTitleText,separatorInput);

  const preferencesContainer = create('fieldset');
  const preferenceslegend = create('legend');
  preferenceslegend.textContent = 'iGPlus preferences';
  preferenceslegend.id = 'preferences';
  preferencesContainer.append(preferenceslegend,
    createScriptCheckbox('raceSign','Race Report Sign'),
    createScriptCheckbox('overSign','Overtakes Sign'),
    separatorContainer
  );
//#endregion
//#region --------------------------Scripts--------------------------
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
//#endregion
//#region -------------------------- Sheet --------------------------
  const googleSheetContainer = create('fieldset');
  googleSheetContainer.id = 'googleSheetContainer';
  const legendGoogleSheetContainer = create('legend');
  legendGoogleSheetContainer.textContent = 'Google Sheet';
  legendGoogleSheetContainer.append(addDescription('Import google data to be displayed in the strategy page below the advanced options'));
  legendGoogleSheetContainer.id = 'Gsheet';
  //legendGoogleSheetContainer.classList.add('help','fa-solid','fa-circle-info');
  //legendGoogleSheetContainer.setAttribute('data-fieldtip','Import google data to be displayed in the strategy page below the advanced options');


  function createInputField(id,name){
    const container = create('div');
    container.classList.add('inputField');
    const label = create('div');
    label.classList.add('text');
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
  exampleLink.classList.add('avoid','linkcustom');
  exampleLink.href = 'https://docs.google.com/spreadsheets/d/1_SrsrcfI9YXKKBatLef7SjmGDV8JEc7mp8AKrQxVcDc/';
  sheetNameContainer.append(example,exampleLink);

  googleSheetContainer.append(legendGoogleSheetContainer,linkContainer,trackIdContainer,sheetNameContainer);
//#endregion
//#region --------------------------Strategy----------------------------
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
//#endregion
//#region --------------------------Cloud Sync--------------------------
  const gdrive = create('fieldset');
  const forceSync = create('span');
  forceSync.classList.add('btn');
  forceSync.textContent = 'Upload';
  forceSync.style.display = 'none';
  forceSync.id = 'forceSync';

  /* const forceSyncDown = create('span');
    forceSyncDown.classList.add('btn');
    forceSyncDown.textContent = 'Download';
    forceSyncDown.style.display = 'none';
    forceSyncDown.id = 'forceSyncDown';*/
  gdrive.append(appendWithDescription(createScriptCheckbox('gdrive','Cloud Sync'),forceSync));
//#endregion

  const mainContainer = create('div');
  mainContainer.append(preferencesContainer,scriptsContainer,strategiesContainer,googleSheetContainer,gdrive);
  mainContainer.id = 'iGPlus';
  generalContainer.append(mainContainer);

}
export {injectIGPlusOptions};
document.addEventListener('DOMContentLoaded', async function() {
  const { addData, getAllData, clearData, getElementById,deleteElementById  } = await import(chrome.runtime.getURL('common/database.js'));
  const { language } = await import(chrome.runtime.getURL('common/localization.js'));
  const { get: storageGet } = await import(chrome.runtime.getURL('common/storage.js'));

  const isSyncEnabled = await storageGet({ script: false });
  const data = await storageGet({ separator: ',' });
  const separator = data.separator;

  const startOvertakes = document.getElementById('start');
  const deleteButton = document.getElementById('delete');
  const select = document.getElementById('select');
  const recapButton = document.getElementById('recap');
  const averageButton = document.getElementById('average');
  const pitButton = document.getElementById('pit');
  const text = document.getElementById('text');
  const downloadButton = document.getElementById('down');
  const copyButton = document.getElementById('copy');
  const pitLossButton = document.getElementById('averagePit');
  const csv = document.getElementById('CSV');
  const pitstops = document.getElementById('PitStops');
  let saveName = "report";


  let driver = 0;


  restore_options();


  function restore_options() {

    chrome.storage.local.get({
      language: 'en',
    }, function(items) {
      const code = items.language;
      recapButton.textContent = language[code].popupText.raceRecap;
      startOvertakes.textContent = language[code].popupText.startOvertakes;
      deleteButton.textContent = language[code].popupText.delete;
      pitLossButton.textContent = language[code].popupText.pitStopTimeLoss;
      averageButton.textContent = language[code].popupText.heatMap;
      pitButton.textContent = language[code].popupText.PitReport;
      downloadButton.textContent = language[code].popupText.downloadText;
      copyButton.textContent = language[code].popupText.copyText;
      csv.textContent = language[code].popupText.fullRaceReport;

    });
  }



  async function disableButton(yes)
  {
    if(yes){
      recapButton.disabled = true;
      averageButton.disabled = true;
      pitButton.disabled = true;
      startOvertakes.disabled = true;
      pitLossButton.disabled = true;
      csv.disabled = true;
      pitstops.disabled = true;
    }
    else{
      recapButton.disabled = false;
      averageButton.disabled = false;
      pitButton.disabled = false;
      startOvertakes.disabled = false;
      pitLossButton.disabled = false;
      csv.disabled = false;
      pitstops.disabled = false;
    }
  }

  function setText(string){
    toggleText(true);
    text.textContent = string;
  }
  function toggleText(b) {
    // Setting display to an empty string '' lets it fall back to the CSS definition (like CSS Grid)
    // Setting it to 'none' hides it.
    const displayMode = b ? 'flex' : 'none';
    
    text.style.display = displayMode;
    copyButton.style.display = displayMode;
    downloadButton.style.display = displayMode;
  }


  //-------------------------------------------------------------------------------Popup initialization-------------------------------------------
// --- TAB NAVIGATION LOGIC ---
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Remove active class from all tabs
      tabLinks.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and its content
      link.classList.add('active');
      const targetTab = document.getElementById(link.getAttribute('data-tab'));
      targetTab.classList.add('active');
    });
  });
  // ----------------------------
  try {
     const valid_saves = await (getAllData('reports'));
  
  if(valid_saves.length > 0) 
  {

    const option_data = await storageGet({ active_option: valid_saves[0].id });
    let active;
    //generate selection menu with stored data
    for(let i = 0; i < valid_saves.length; i++)
    {
      const option = document.createElement('option');
      option.textContent = valid_saves[i].id;
      if(option_data.active_option == valid_saves[i].id)
      {
        option.selected = true;
        active = valid_saves[i].data;
        await chrome.storage.local.set({'active':active});
        if(active.length == 0)
        {
          disableButton(true);
        }
        chrome.storage.local.set({'active_option':option_data.active_option});
      }
      driver = active;
      select.appendChild(option);
    }
    (active.length == 0) ? disableButton(true) : disableButton(false);
  }
  else 
  {
    disableButton(true);
  }
  } catch (error) {
    console.warn(error);
  }
 

  //-------------------------------------------------------------------------------copy button-------------------------------------------
  copyButton.addEventListener('click',function(){
    navigator.clipboard.writeText(text.textContent).then(() => {
      //clipboard successfully set
    }, () => {
      //clipboard write failed, use fallback
    });

  });

  //-------------------------------------------------------------------------------pit time loss button-------------------------------------------
  pitLossButton.addEventListener('click',function(){

    var manager = driver;
    manager.sort((a, b) => { return a.race_finish - b.race_finish; });

    let cvsS = '';
    for (let i = 0; i < manager.length; i++) {

      cvsS += (manager[i].name + separator + arrayToCSV(manager[i].pitTimeLoss)) + '\n';


    }
    saveName = "pit_times";
    setText(cvsS);


    function arrayToCSV(arr) {
      // check if the array is empty
      if (arr.length === 0) {
        return '';
      }

      // initialize a variable to store the CSV string
      let csv = '';

      // loop through the array and add each element to the CSV string, separated by a comma
      for (let i = 0; i < arr.length - 1; i++) {
        csv += arr[i] + separator;
      }

      // return the CSV string
      return csv;
    }



  });

    //-------------------------------------------------------------------------------pit stops button-------------------------------------------
    pitstops.addEventListener('click',function(){

      var manager = driver;
      manager.sort((a, b) => { return a.race_finish - b.race_finish; });
  
      let cvsS = '';
      for (let i = 0; i < manager.length; i++) {
  
        cvsS += (manager[i].name + separator + arrayToCSV(manager[i].pitStopTimes)) + '\n';
  
  
      }
      saveName = "stationary_pit_times";
      setText(cvsS);
  
  
      function arrayToCSV(arr) {
        // check if the array is empty
        if (arr.length === 0) {
          return '';
        }
  
        // initialize a variable to store the CSV string
        let csv = '';
  
        // loop through the array and add each element to the CSV string, separated by a comma
        for (let i = 0; i < arr.length - 1; i++) {
          csv += arr[i] + separator;
        }
  
        // return the CSV string
        return csv;
      }
  
  
  
    });

  //-------------------------------------------------------------------------------download button-------------------------------------------
  downloadButton.addEventListener('click',function(){

    function downloadFile(data,download_name){
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, 'test');
      } else {
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', download_name);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
    downloadFile(text.textContent,saveName);

  });


  //-------------------------------------------------------------------------------start overtakes-------------------------------------------
  startOvertakes.addEventListener('click',function(){
    //returns rank position at the end of lap 2 - quali position
    chrome.storage.local.get({'overSign':false},function(data){
      const isChecked = data.overSign;
      function getOvertakes(d){return d.rank[1] - d.quali;}
      //sort by overtakes
      driver.sort((a, b) => {return getOvertakes(a) - getOvertakes(b);});
      let string_result = '';
      driver.forEach(ele => {string_result += ele.name + separator + getOvertakes(ele) * ((isChecked) ? -1 : 1) + '\n';});
      //display result
      saveName = "race_start_overtakes";
      setText(string_result);
    });

  });




  //------------------------------------------------------------------------------select change----------------------------------------------
  select.addEventListener('change',async function(){
    toggleText(false);

    //new option of the select
    const opt = select[select.selectedIndex].text;
    const report = await getElementById(opt,'reports');
    chrome.storage.local.set({'active_option':report.id,'active':report.data});
    if(report.data == 0)
      disableButton(true);
    else
      disableButton(false);

    driver = report.data;


  });


  //------------------------------------------------------------------------------Race report----------------------------------------------
  recapButton.addEventListener('click', function(){

    chrome.storage.local.get({'raceSign':false},function(data){
      const isChecked = data.raceSign;

      //sorting managers by quali
      const sortQuali = driver.sort((a,b) =>{
        if(a.quali > b.quali)
          return 1;
        else
          return -1;

      });


      let race_timings = separator;  // time position

      //getting the max number of laps completed
      let temp_max = sortQuali[0].rank.length;
      for(let i = 0; i < sortQuali.length; i++)
      {
        if(temp_max < sortQuali[i].rank.length)
        {
          temp_max = sortQuali[i].rank.length;
        }

      }
      //formating with circuit lap numbers
      for(let i = 1; i <= temp_max ; i++)
        race_timings += separator + i;

      race_timings += '\n';

      for(let i = 0; i < sortQuali.length; i++)
      {
        if(sortQuali[i].rank[sortQuali[i].rank.length - 1] <= 10)
        {
          race_timings += 'Top 10';
        }

        race_timings += separator + sortQuali[i].name + separator + ((isChecked) ? sortQuali[i].race_time.map(str => str.replace(/\+/g, '-')) : sortQuali[i].race_time).join(separator) + '\n';

      }

      saveName = "race_result";
      setText(race_timings);

    });



  });



  //------------------------------------------------------------------------------pit report----------------------------------------------
  pitButton.addEventListener('click',function(){

    //sort bt race finish
    driver.sort((a, b) => { return a.race_finish - b.race_finish; });
    let string_format = '';
    for(let i = 0 ; i < driver.length; i++)
    {
      string_format += (i + 1);
      string_format += separator;
      string_format += driver[i].name;
      string_format += separator;
      string_format += driver[i].pit_stop.replaceAll(',',separator);
      string_format += '\n';

    }
    saveName = "pit_history";
    setText(string_format);

  });

  //------------------------------------------------------------------------------driver average position----------------------------------------------
  averageButton.addEventListener('click',function(){

    chrome.storage.local.get('active', function(data) {
      const manager = data.active;
      let string = `Driver/Rank${separator}1${separator}2${separator}3${separator}4${separator}5${separator}6${separator}7${separator}8${separator}9${separator}10${separator}11${separator}12${separator}13${separator}14${separator}15${separator}16${separator}17${separator}18${separator}19${separator}20${separator}21${separator}22${separator}23${separator}24${separator}25${separator}26${separator}27${separator}28${separator}29${separator}30${separator}31${separator}32\n`;

      manager.forEach(driver_ele => {
        const laps_position = Array(32).fill(0);
        for(let i = 0 ; i <= driver_ele.rank.length ; i++)
        {
          laps_position[driver_ele.rank[i] - 1] += 1;
        }
        string += driver_ele.name + separator + laps_position.join(separator) + '\n';

      });

      saveName = "laps_in_position";
      setText(string);
    });

  });

  //------------------------------------------------------------------------------driver CSV----------------------------------------------
  csv.addEventListener('click',function(){

    chrome.storage.local.get('active', function(data) {
      const race = data.active;

      let csvtext = (driver[0]?.race_info) ? `Track${separator}${driver[0].race_info.track}\nFuel${separator}${driver[0].race_info.rules.fuel}${separator}Tyre${separator}${driver[0].race_info.rules.tyre}\n${driver[0].race_info.date}\n` : "";
      race.forEach(driver=>{
        for(var i = 0 ; i < driver.driver_result.lap.length; i++)
        {

          csvtext += `${driver.name}${separator}${driver.team}${separator}${driver.driver_result.lap[i]}${separator}${driver.driver_result.time[i]}${separator}${driver.driver_result.gap_to_lead[i]}${separator}${driver.driver_result.average[i]}${separator}${driver.driver_result.rank[i]}\n`;
        }
      });

      saveName = "full_report";
      setText(csvtext);


    });


  });

  //------------------------------------------------------------------------------delete----------------------------------------------
  deleteButton.addEventListener('click', function(){
    const is_report_to_be_deleted_empty = document.querySelector('.button:disabled') ? true : false;
    toggleText(false);
    chrome.storage.local.remove('active');
    chrome.storage.local.remove('active_option');
    const opt = select.selectedOptions[0].textContent;
    select.remove(select.selectedIndex);
    deleteElementById(opt,'reports');
    chrome.storage.local.remove(opt, async function() {
      if(!is_report_to_be_deleted_empty)
        if(isSyncEnabled.script?.gdrive ?? false)
          {
           //can't get request on extension domain. This works only if the token is already stored locally
           const { getAccessToken } = await import(chrome.runtime.getURL('auth/dropboxAuth.js'));
           const token = await getAccessToken() ?? false;
           if(token != false)
              chrome.runtime.sendMessage({
              type:'deleteFile',
              data:{type:'reports',name:opt},
              token:token.access_token});
           }
    });
    if(select.options.length > 0) {
      select.selectedIndex = select.options.length - 1;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } 
    else {
      disableButton(true);
      return;
    }

    


  });

});
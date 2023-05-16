document.addEventListener('DOMContentLoaded', async function() {
  const { addData, getAllData, clearData, getElementById,deleteElementById  } = await import(chrome.runtime.getURL('/common/database.js'));
  const { language } = await import(chrome.runtime.getURL('/common/localization.js'));
  const isSyncEnabled = await chrome.storage.local.get({script:false}) ?? await browser.storage.local.get({script:false});
  const data = await chrome.storage.local.get({separator:','}) ?? await browser.storage.local.get({separator:','}) ?? false;
  const  separator =  data.separator;

  const startOvertakes = document.getElementById('start');
  const deleteButton = document.getElementById('delete');
  const select = document.getElementById('select');
  const newButton = document.getElementById('new');
  const recapButton = document.getElementById('recap');
  const averageButton = document.getElementById('average');
  const pitButton = document.getElementById('pit');
  const text = document.getElementById('text');
  const downloadButton = document.getElementById('down');
  const copyButton = document.getElementById('copy');
  const pitLossButton = document.getElementById('averagePit');
  const csv = document.getElementById('CSV');


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
      newButton.textContent = language[code].popupText.newRace;

      averageButton.textContent = language[code].popupText.heatMap;
      pitButton.textContent = language[code].popupText.PitReport;
      downloadButton.textContent = language[code].popupText.downloadText;
      copyButton.textContent = language[code].popupText.copyText;

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
    }
    else{
      recapButton.disabled = false;
      averageButton.disabled = false;
      pitButton.disabled = false;
      startOvertakes.disabled = false;
      pitLossButton.disabled = false;
      csv.disabled = false;
    }
  }

  function setText(string){
    toggleText(true);
    text.textContent = string;
  }
  function toggleText(b)
  {
    if(b)
    {
      text.style.display = 'block';
      copyButton.style.display = 'block';
      downloadButton.style.display = 'block';
    }
    else
    {
      text.style.display = 'none';
      copyButton.style.display = 'none';
      downloadButton.style.display = 'none';
    }

  }


  //-------------------------------------------------------------------------------Popup initialization-------------------------------------------

  const valid_saves = await (getAllData('reports'));
  if(valid_saves.length > 0) {

    const option_data = await chrome.storage.local.get({'active_option':valid_saves[0].id}) ?? await browser.storage.local.get({'active_option':valid_saves[0].id});

    let active;
    //generate selection menu with stored data
    for(let i = 0; i < valid_saves.length; i++)
    {
      const option = document.createElement('option');
      option.textContent = valid_saves[i].id.replace('LRID','');
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
    // await chrome.storage.local.set({'active_option':option_data.active_option});
  }else disableButton(true);


  /* chrome.storage.local.get(null, function(data) {

    if(data.active == null)
    {
      disableButton(true);
    }else{

      //generate a "default" save for the data that was found but not named
      if(valid_saves.length == 0)
      {

        chrome.storage.local.set({'RaceLRID':data.active});
        const option = document.createElement('option');
        option.textContent = 'Race';
        //set
        chrome.storage.local.set({'active_option':'RaceLRID'});
        select.appendChild(option);
      }
      if(data.active == 0)
        disableButton(true);
      else
        disableButton(false);

      driver = data.active;
    }

  });*/

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
    downloadFile(text.textContent,'report');

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
      setText(string_result);
    });

  });




  //------------------------------------------------------------------------------select change----------------------------------------------
  select.addEventListener('change',async function(){
    toggleText(false);

    //new option of the select
    const opt = select[select.selectedIndex].text + 'LRID';
    const report = await getElementById(opt,'reports');
    chrome.storage.local.set({'active_option':report.id,'active':report.data});
    if(report.data == 0)
      disableButton(true);
    else
      disableButton(false);

    driver = report.data;
    //get state before the select was changed
    /* chrome.storage.local.get(['active','active_option',opt],function(data){
      //save the active data in the previous option
      chrome.storage.local.set({[data['active_option']]:report.id});
      //update the active data with the new selected option and save option state
      chrome.storage.local.set({'active_option':opt,'active':report.data},function(d)
      {
        if(data[opt] == 0)
          disableButton(true);
        else
          disableButton(false);

        driver = data[opt];
      });


    });*/


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
      //race_recap = ","; // track position

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
      //lap_timings = race_timings;

      for(let i = 0; i < sortQuali.length; i++)
      {
        if(sortQuali[i].rank[sortQuali[i].rank.length - 1] <= 10)
        {
          race_timings += 'Top 10';
          //lap_timings+="Top 10";
        }
        //race_recap +=","+sortQuali[i].name +","+ sortQuali[i].race_replay+ "<br>";

        race_timings += separator + sortQuali[i].name + separator + ((isChecked) ? sortQuali[i].race_time.map(str => str.replace(/\+/g, '-')) : sortQuali[i].race_time).join(separator) + '\n';
        //lap_timings +=","+sortQuali[i].name +","+ sortQuali[i].lap_time+ "\n";

      }

      //reporttext.textContent=race_timings;
      setText(race_timings);
      // downloadFile(race_timings,"race_recap");

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

      setText(string);
      // downloadFile(string,"lap_trend");
    });

  });

  //------------------------------------------------------------------------------driver CSV----------------------------------------------
  csv.addEventListener('click',function(){

    chrome.storage.local.get('active', function(data) {
      const race = data.active;

      let csvtext = '';
      race.forEach(driver=>{
        for(var i = 0 ; i < driver.driver_result.lap.length; i++)
        {

          csvtext += `${driver.name}${separator}${driver.team}${separator}${driver.driver_result.lap[i]}${separator}${driver.driver_result.time[i]}${separator}${driver.driver_result.gap_to_lead[i]}${separator}${driver.driver_result.average[i]}${separator}${driver.driver_result.rank[i]}\n`;
        }
      });

      setText(csvtext);


    });


    // downloadFile(string,"lap_trend");


  });

  //------------------------------------------------------------------------------new race----------------------------------------------
  newButton.addEventListener('click', function(){

    const reportName = prompt('enter league name');

    if(reportName == null || reportName == '')
    {
      return;
    }

    const leagueNameId = reportName + 'LRID'; //LRID is to avoid naming conflicts

    toggleText(false);
    //save before creating new data

    addData('reports',{id:leagueNameId,data:[]})
      .then((id) => {
        console.log('Data added with ID:', id);
      })
      .catch((error) => {
        console.error(error);
      });


    const option = document.createElement('option');
    option.textContent = reportName;
    option.selected = true;
    select.appendChild(option);
    disableButton(true);
    chrome.storage.local.set({'active_option':leagueNameId,'active':[]});


  });

  //------------------------------------------------------------------------------delete----------------------------------------------
  deleteButton.addEventListener('click', function(){
    const is_report_to_be_deleted_empty = document.querySelector('.button:disabled') ? true : false;
    toggleText(false);
    chrome.storage.local.remove('active');
    chrome.storage.local.remove('active_option');

    let opt = 'RaceLRID';
    if(select.length > 0)  opt = select.selectedOptions[0].textContent + 'LRID';
    else {
      disableButton(true);
      return;
    }  //alert('nothing to delete');

    console.log(opt);
    deleteElementById(opt,'reports');

    chrome.storage.local.remove(opt, async function() {
      select.remove(select.selectedIndex);
      if(!is_report_to_be_deleted_empty)
        if(isSyncEnabled.script?.gdrive ?? false){
        //can't get request on extension domain. This works only if the token is already stored locally
          const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
          const token = await getAccessToken() ?? false;
          if(token != false)
            chrome.runtime.sendMessage({
              type:'deleteFile',
              data:{type:'reports',name:opt},
              token:token.access_token});
        }
      let newOption = 'RaceLRID';
      if(select.length > 0)
        newOption = select.selectedOptions[0].textContent + 'LRID';
      else{
        disableButton(true);
        return;
      }


      chrome.storage.local.get(newOption, function(reportData) {
        let is_save_empty = true;
        (reportData[newOption] == 0 || reportData[newOption] == 'undefined') ? is_save_empty = true : is_save_empty = false;

        chrome.storage.local.set({'active_option':newOption,'active':reportData[newOption]},function(){
          disableButton(is_save_empty);
        });

      });



    });


  });

});






manager = [];
progress_status = 0;
data_extracted = false;

inject_button();

function downloadFile(data,download_name){
  var blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, 'test');
  } else {
    var link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
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
function inject_button() {

  const iconUrl = chrome.runtime.getURL('images/Sheet.svg');
  const image = document.createElement('img');
  const export_container = document.createElement('div');
  export_container.classList.add('export_container');
  image.src = iconUrl;
  image.style.width = "1.6em";
  button = document.createElement('button');
  button2 = document.createElement('button');
  button2.append(image)
  button.setAttribute('class', 'btn3');
  button2.id = "sheet_icon";
  button.setAttribute('style', 'position:relative; left:10px; cursor:pointer;');
  button2.setAttribute('style', 'position:relative; left:10px;');
  button.innerText = 'Extract';
  const closebutton = document.querySelector('.close');
  closebutton.classList.add('close-fix');
  button.id = 'extract_button';
  const spinner = document.createElement('span');
  spinner.classList.add('spinner');
  button.append(spinner);
  spinner.style.display = 'none';
  button.classList.add('pushBtn');
  button2.id = 'sheet_icon';
  button2.classList.add('pushBtn');
  button.addEventListener('click', extract_function);
  button.addEventListener('touchstart', extract_function);
  button2.addEventListener('click', import_to_sheets);
  const title_location = document.getElementsByClassName('dialog-head'); //location of the button
  
  export_container.append(button,button2);

  try {
    title_location[0].classList.add('inj_header');
     if (title_location[0].childElementCount == 1) {
    title_location[0].append(export_container);
 
  //p = document.querySelector('#dialogs-container > div > div > div');
  export_button = document.querySelector('.csvExport');
  const tiers_buttons = export_button.parentElement.querySelectorAll('a');
  p = export_button.parentElement;
  quali_button = export_button.cloneNode(true);
  race_button = export_button.cloneNode(true);
  podium = export_button.cloneNode(true);
  const spinner = document.createElement('span');
  spinner.classList.add('spinner');
  
  podium.id = 'top3';
  podium.textContent = 'Top 3';
  podium.append(spinner);
  quali_button.textContent = 'Q';
  [podium,quali_button].forEach((ele) =>{ ele.classList.add('mRight')});
  podium.addEventListener('click', podium_copy);
  quali_button.addEventListener('click', quali_export);
  race_button.addEventListener('click', race_export);
  
  if (p.childElementCount == 3) {
    const buttons_container = document.createElement('div');
    const tier_container = document.createElement('div');
    buttons_container.classList.add('inj_container','f_right');
    tier_container.classList.add('inj_container','f_left');
    tier_container.append(tiers_buttons[0],tiers_buttons[1],tiers_buttons[2]);
    buttons_container.append(export_button,quali_button,podium);

    p.prepend(buttons_container);
    p.prepend(tier_container);
    //p.prepend(quali_button);
    //p.prepend(export_button)

  }

  export_button.parentNode.replaceChild(race_button, export_button);
}
} catch (error) {
  
}
}

async function podium_copy()
{
  this.childNodes[0].textContent = '';
  this.childNodes[1].style.display = 'inline-block';
  const [{ fetchDriverInfo, fetchTeamInfo }, { parseAttributes }] = await Promise.all([
    import(chrome.runtime.getURL('common/fetcher.js')),
    import(chrome.runtime.getURL('driver/driverHelpers.js'))
  ]);

  async function getManagerName(driver){
    const driverInfo = await fetchDriverInfo(driver);
    const managerId =  new URLSearchParams(parseAttributes(driverInfo).tLink).get('team');
    const managerdata = await fetchTeamInfo(managerId);
    const managerName = managerdata.vars.manager.match(/\/>(.*)$/)[1].substring(1);
    return managerName;
  }

  function extractStrategyPreview(strategyDiv) {
    if (!strategyDiv) return "";

    const tireMap = {
        "ts-M": "⚪", // Medium
        "ts-H": "🟠", // Hard
        "ts-S": "🟡", // Soft
        "ts-SS": "🔴", // Super Soft
        "ts-W": "🔵", // Wet
        "ts-I": "🟢"  // Intermediate
    };

    let result = "";

    strategyDiv.querySelectorAll('td').forEach(td => {
        const tireClass = Object.keys(tireMap).find(cls => td.classList.contains(cls));
        if (tireClass) {
            result += tireMap[tireClass]; 
        } else {
            result += td.textContent.trim();
        }
    });

    return result;
}

  const raceTable = document.querySelector('#race table tbody');
  const trackName = document.querySelector('.dialog-head h1').textContent.trim();
  const medals = ["🥇", "🥈", "🥉"];
  const advanced_podium = document.getElementsByClassName('strategy-preview');

  const podium = await Promise.all(
    Array.from(raceTable.rows).slice(0, 3).map(async (row, index) => {
      const teamName = row.querySelector('.teamName').textContent;
      const driverId = new URLSearchParams(row.querySelector('a').href).get('id');
      const managerName = await getManagerName(driverId);
      const finish = row.cells[2].textContent;

      let podium_string = `${medals[index]} ${teamName} - ${managerName}`

      if(advanced_podium.length>0)
        podium_string += `\n${" ".repeat("🥇".length + 1)}${extractStrategyPreview(advanced_podium[index])} (${finish})` ;

      return podium_string;
    })
  );
  const fastLap = document.getElementsByClassName('mOpt bgFastest robotoBold')[0];
  const teamFastLap = fastLap.parentElement.childNodes[1].childNodes[4].childNodes[0].textContent;
  const driverFastLap = fastLap.parentElement.childNodes[1].childNodes[0].href.match(/\d+/)[0];
  const managerFastLap = await getManagerName(driverFastLap);

  const bestLapString = raceTable.parentElement.childNodes[0].childNodes[0].childNodes[3].textContent;
  const resultString = `🚦 🏁 ${trackName} 🚦\n${podium.join('\n')}\n🏎️💨 ${bestLapString}: ${teamFastLap} - ${managerFastLap}\n👇 🎤..... 👇`;

  navigator.clipboard.writeText(resultString).then(() => {
    var button = document.getElementById('top3');
    button.childNodes[0].textContent = "Copied!";
    button.childNodes[1].style.display = 'none';
    button.classList.add('podium-off');
  }, () => {
    alert('failed to copy top 3');
  });

}
async function import_to_sheets(){

  pickFiles();

async function pickFiles(){
  if(!document.getElementById('sheetDialog'))
  createSheetDialog();
  const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
  const token = await getAccessToken();
  if(token != false){
    const { get_sheets } = await import(chrome.runtime.getURL('/auth/gDriveHandler.js'));
    get_sheets(token.access_token).then(sheets => {
      const sheetListContainer = document.getElementById('sheetList');
      const selectSheetBtn = document.getElementById('selectSheetBtn');
      // Clear existing content
      sheetListContainer.innerHTML = '';
    
      sheets.forEach(sheet => {
          const sheetItem = document.createElement('div');
          sheetItem.className = 'sheetStyle';
          sheetItem.innerHTML = `
              <input type="radio" name="sheetRadio" id="${sheet.id}">
              <label for="${sheet.id}">${sheet.name}</label>
          `;
          sheetItem.addEventListener('click', () => {
            sheetItem.append(selectSheetBtn);
            selectSheetBtn.style.display= "flex";
            const div_sheets = document.getElementsByClassName('sheetStyle');
            for (const element of div_sheets) element.classList.remove('selected_radio');
            sheetItem.classList.add('selected_radio');
              selectSheetBtn.removeAttribute('disabled');
          });
          sheetListContainer.appendChild(sheetItem);
      });
    
      // Show the modal
      document.getElementById('sheetDialog').showModal();
    });
  }
  function createSheetDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = 'sheetDialog';


    const mainDiv = document.createElement("div");
    const close_dialog = document.createElement("span");
    close_dialog.textContent = "×";
    close_dialog.id = "close_dialog";
    const heading = document.createElement("h2");
    heading.textContent = "Select a Sheet";
    const sheetListDiv = document.createElement("div");
    sheetListDiv.id = "sheetList";
    const selectSheetBtn = document.createElement("button");
    selectSheetBtn.id = "selectSheetBtn";
    selectSheetBtn.style.display = "none";
    selectSheetBtn.textContent = "Export the results to this sheet";
    dialog.append(close_dialog,heading,sheetListDiv,selectSheetBtn);
    document.body.appendChild(dialog);
    selectSheetBtn.addEventListener('click',handleSheetSelection);
    close_dialog.addEventListener('click',closeSheetDialog);
}
function closeSheetDialog() {
  const dialog = document.getElementById('sheetDialog');
  const selectSheetBtn = document.getElementById('selectSheetBtn');
  selectSheetBtn.style.display= "none";
  dialog.append(selectSheetBtn);
  dialog.close();
}
  async function handleSheetSelection() {
  const selectedSheetId = document.querySelector('input[name="sheetRadio"]:checked').id;
  //alert(`Selected Sheet ID: ${selectedSheetId}`);
  const {access_gSheet } = await import(chrome.runtime.getURL('/auth/gSheetsHandler.js'));
  const race_id = window.location.href.replace(/\D/g, '');
  //const data_to_export = [[race_id,"Qualifying"]];
  const quali_to_export = quali_export(false).split('\n').map(row =>[race_id,"Q",... row.split(',')]);
  const race_to_export_pre = race_export(false).split('\n').map(row =>[race_id,"R",... row.split(',')]);
  var race_to_export = race_to_export_pre;
  const race_date = document.getElementsByClassName('notice')[1].textContent ?? "error";
  const track_code = document.querySelector('.flag').classList[1].substring(2);

  if(document.getElementById('alldrivers')){
    manager.sort((a, b) => { return a.race_finish - b.race_finish; });
    race_to_export_pre[0].push("Strategy","Pit Stops Time","Time Lost","Rank")
     race_to_export = race_to_export_pre.slice(1).map((innerArray, index) => {
      innerArray.push(manager[index].pit_stop, manager[index].pitStopTimes.join(','),manager[index].pitTimeLoss.join(','),  manager[index].rank.join(','));
      return innerArray;
    });
    race_to_export.unshift(race_to_export_pre[0]);
    
  }
  const combinedValues = quali_to_export.concat(race_to_export);
  
  access_gSheet(selectedSheetId,token.access_token,combinedValues,{race_date:race_date,track_code:track_code})
  closeSheetDialog();
}

}

}

function race_export(download)
{
  let csv = '';
  const r = document.getElementById('csvRace');//document.querySelector('#race').childNodes[0];
  
  csv += r.tHead.rows[0].cells[0].textContent;//pos
  csv += ',' + r.tHead.rows[0].cells[1].textContent;//driver
  csv += ',Team';
  csv += ',' + r.tHead.rows[0].cells[2].textContent;//finish
  csv += ',' + r.tHead.rows[0].cells[3].textContent;//bestlap
  csv += ',' + r.tHead.rows[0].cells[4].textContent;//top
  csv += ',' + r.tHead.rows[0].cells[5].textContent;//pit
  csv += ',' + r.tHead.rows[0].cells[6].textContent;//pnt

   race_table = r.tBodies[0];
  for (let i = 0; i < race_table.childElementCount; i++) {
    const  rank = i+1;
    const driver_name = race_table.rows[i].cells[1].childNodes[4].textContent.trim();
    const team_name = race_table.rows[i].cells[1].querySelector('.teamName').textContent.trim();
    const original_finish = race_table.rows[i].cells[2].textContent;
    const finish = (!download && original_finish.charAt(0) === '+') ? "'" + original_finish : original_finish;
    const best_lap = race_table.rows[i].cells[3].textContent;
    const top_speed = race_table.rows[i].cells[4].textContent;
    const pits = race_table.rows[i].cells[5].textContent;
    const points = race_table.rows[i].cells[6].textContent;

    csv += '\n' + rank + ',' + driver_name + ',' + team_name + ',' + finish + ',' + best_lap + ',' + top_speed + ',' + pits + ',' + points;
  }
  const race_id = window.location.href.replace(/\D/g, '');
  if(download)
  downloadFile(csv,race_id + '_Race');
  else
  return csv

}
function quali_export(download)
{
  let csv = '';
  const q = document.querySelector('#qualifying table');

  csv += q.tHead.rows[0].cells[0].textContent;
  csv += ',' + q.tHead.rows[0].cells[1].textContent;
  csv += ',Team';
  csv += ',' + q.tHead.rows[0].cells[2].textContent;
  csv += ',' + q.tHead.rows[0].cells[3].textContent;
  csv += ',' + q.tHead.rows[0].cells[4].textContent;

  const quali_table = q.tBodies[0];
  for (let i = 0; i < quali_table.childElementCount; i++) {
    const rank = i+1;
    const driver_name = quali_table.rows[i].cells[1].childNodes[4].textContent.trim();
    const team_name = quali_table.rows[i].cells[1].querySelector('.teamName').textContent.trim();
    const lap = quali_table.rows[i].cells[2].textContent;
    const original_gap = quali_table.rows[i].cells[3].textContent;
    const gap = (!download && original_gap.charAt(0) === '+') ? "'" + original_gap : original_gap;
    const tyre = quali_table.rows[i].cells[4].textContent;//quali_table.rows[0].cells[4].className.replace('ts-','');
    csv += '\n' + rank + ',' + driver_name + ',' + team_name + ',' + lap + ',' + gap + ',' + tyre;
  }
  const race_id = window.location.href.replace(/\D/g, '');
  if(download)
  downloadFile(csv,race_id + '_Qualifying');
  else
  return csv

}
function all_export()
{
  const export_button = document.querySelector('.csvExport');
  const p = export_button.parentElement;
  const all_button = export_button.cloneNode(true);
  all_button.id = 'alldrivers';
  all_button.textContent = 'Full CSV';
  
  if (p.childElementCount == 3) {
    p.prepend(all_button);
    p.prepend(export_button);
  }
  all_button.addEventListener('click', function(){

    chrome.storage.local.get('active',async function(data){
      const race_id = window.location.href.replace(/\D/g, '');
      downloadFile(csvRaceResults(data.active),race_id + '_Drivers_CSV');
    });

  });

  data_extracted = true;

}
function progress() {

  const progress_div = document.createElement('div');
  
  progress_div.id = 'progress';
  progress_div.classList.add('progress')
  const bar_div = document.createElement('div');
  bar_div.setAttribute('style', 'background-color:#4CAF50; width:1%; height:5px; border-radius:4px;');
  bar_div.id = 'bar';
  progress_div.appendChild(bar_div);
  return progress_div;
}
function get_quali()
{
  manager = [];
  const  race_info = document.getElementsByClassName('notice') ?? "error";
  // get quali results
  for (let i = 0; i < quali_results.childElementCount; i++) {
    const driver_quali = quali_results.childNodes[i].childNodes[1].getElementsByClassName('linkParent');
    const driver_id = driver_quali[0].href.replace(/\D/g, '');
    const driver_name = quali_results.childNodes[i].childNodes[1].childNodes[2].textContent.substring(1);
    const team_name = quali_results.childNodes[i].childNodes[1].childNodes[4].innerText;
    const race_id = window.location.href.replace(/\D/g, '');
    const manager_template = {
      race_info:
      {
        rules:{fuel:(race_info[0].children[0].className == 'grey') ? false : true,
        tyre:(race_info[0].children[1].className == 'grey') ? false : true},
        date:race_info[1].textContent,
        track:document.querySelector('.flag').classList[1].substring(2)
      },
      'id': driver_id,
      'name': driver_name,
      'team': team_name,
      'quali': i+1,
      'race': 'NotFound',
      'race_finish': '',
      'race_id': race_id,
      'report_id': '',
      'rank': [],
      'race_time': [],
      'lap_time': [],
      'pit_stop': '',
      'pitTimeLoss':[],
      'pitStopTimes':[],
      'driver_result':{
        'lap':[],
        'time':[],
        'gap_to_lead':[],
        'average':[],
        'rank':[]
      }

    };
    manager.push(manager_template);
  }
}
function extract_function() {

  b_parent = document.getElementsByClassName('dialog')[0];
  const extract_button = document.getElementById('extract_button');
  if(extract_button.disabled)
    return
  //this.remove();
  var button = document.getElementById('top3');
  button.classList.remove('podium-off');
  button.childNodes[0].textContent = 'Top 3';
  extract_button.disabled = true;
  extract_button.classList.add('disabled','podium-off');
  extract_button.childNodes[0].textContent = '';
  extract_button.childNodes[1].style.display = 'inline-block';
  b_parent.prepend(progress());
  race_results = document.querySelector('#race table').tBodies[0];
  quali_results = document.querySelector('#qualifying table').tBodies[0];

  get_quali();

  //get race results
  for (let i = 0; i < race_results.childElementCount; i++) {

    //driver id and name
    driver_race_result = race_results.childNodes[i].childNodes[1].getElementsByClassName('linkParent');

    try {
      driver_race_report = race_results.childNodes[i].childNodes[2].getElementsByClassName('linkParent')[0].href;

    }
    catch (err) {
      console.log('failed to get one or more reports. most likely DNFs');
      driver_race_report = 'no_race';

    }


    // extract driver id from reports url
    driver_id = driver_race_result[0].href.replace(/\D/g, '');



    finish_position = i;
    //assingn race report to correct driver from quali
    j = 0;
    looking_for_id = true;
    while (looking_for_id) {
      if (manager[j].id == driver_id) {
        looking_for_id = false;
        manager[j].race = driver_race_report;
        //console.log(driver_race_report,driver_race_report.replace(/\D/g, ''))
        manager[j].report_id = driver_race_report.replace(/\D/g, '');
        manager[j].race_finish = finish_position;
      }
      j++;
    }

  }

  //start extraction
  race_report();

}
//send requests for each driver report
async function race_report() {
  const { fetchRaceReportInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));
  for (let number = 0; number < manager.length; number++) {
    if (manager[number].report_id != '') {
      const result = await fetchRaceReportInfo(manager[number].report_id);
      const table = decode_result(result);
      update_managers(table, number);
    }
  }
  
  await storeCopyOfActive();
  formatTable();
  document.getElementById('progress').remove();
  const extract_button = document.getElementById('extract_button');
  extract_button.childNodes[0].textContent = "Extract";
  extract_button.childNodes[1].style.display = 'none';
  all_export();
}

async function storeCopyOfActive(){

  const report = await chrome.storage.local.get({'active_option':'Default ReportLRID'});
  chrome.storage.local.get('active', async function(data) {

    //console.log('storing',report.active_option,data.active)
    chrome.runtime.sendMessage({
      type:'addRaceReportToDB',
      data:{id:report.active_option,data:data.active}
    });

    const isSyncEnabled = await chrome.storage.local.get({script:false});
    if(isSyncEnabled.script?.gdrive ?? false){
      const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
      const token = await getAccessToken();

      if(token != false){
        chrome.runtime.sendMessage({
          type:'saveReport',
          data:JSON.stringify(data.active),
          token:token.access_token}); //TO DO, make single saves, instead of saving all reports
      }
    }


  });
}

//get only the table from the response
function decode_result(data) {
  const results = data.vars.results;
  const table = /<table.*<\/table>/gms.exec(results)[0];
  const t = document.createElement('table');
  //sanitizing the data
  let cleanHTML = DOMPurify.sanitize(table);
  t.innerHTML = cleanHTML;

  return t;

}
//complete the manager_template info
async function update_managers(table, index) {
  function toMs(timeString)
  {
    try {
      time = timeString.split(':');
      m = parseInt(time[0]) * 60000;
      secondAndMs = time[1].split('.');
      return m + (parseInt(secondAndMs[0]) * 1000) + (parseInt(secondAndMs[1]));
    } catch (error) {
      console.log('----');
      return false;
    }

  }
  function pushLapData(average,gap,lap,rank,time){

    manager[index].driver_result.average.push(average);
    manager[index].driver_result.gap_to_lead.push(gap);
    manager[index].driver_result.lap.push(lap);
    manager[index].driver_result.rank.push(rank);
    manager[index].driver_result.time.push(time);
  }
  try {

    const race_table = table;
    const laps_done = race_table.tBodies[0].rows.length; // getting last lap
    const startTyre = race_table.rows[1].cells[1].childNodes[0].textContent;
    manager[index].pit_stop = startTyre;
    let last_pit_lap = 0;

    /*pushLapData(
      table.rows[0].cells[3].textContent,//average
      table.rows[0].cells[2].textContent,//gap
      table.rows[0].cells[0].textContent,//lap
      table.rows[0].cells[4].textContent,//lap/
      table.rows[0].cells[1].textContent);//time*/
    pushLapData('','',table.rows[1].cells[0].textContent,manager[index].quali,table.rows[1].cells[1].textContent);


    pitTimes = [];
    for (i = 2; i <= laps_done; i++) {

      try {
        var rank = table.rows[i].cells[4].textContent;
      } catch (error) {
        rank = '';
      }


      pushLapData(
        table.rows[i].cells[3].textContent,//average
        table.rows[i].cells[2].textContent,//gap
        table.rows[i].cells[0].textContent,//lap
        rank,//rank
        table.rows[i].cells[1].textContent);//time



      if (isNaN(race_table.rows[i].childNodes[0].textContent)) {

        const pitstop = parseFloat(race_table.rows[i].childNodes[1].textContent.split('/')[0]);
        manager[index].pitStopTimes.push(pitstop);
        pit_lap = race_table.rows[i - 1].childNodes[0].textContent;

        pit_tyre = race_table.rows[i].childNodes[1].childNodes[2].textContent;
        var stintLaps = (pit_lap - last_pit_lap);
        manager[index].pit_stop += ',' + stintLaps + ',' + pit_tyre;

        last_pit_lap = pit_lap;

        if((i + 2) < laps_done){
          a = toMs(race_table.rows[i - 1].childNodes[1].textContent);
          b = toMs(race_table.rows[i + 1].childNodes[1].textContent);
          c = toMs(race_table.rows[i - 2].childNodes[1].textContent);
          d = toMs(race_table.rows[i + 2].childNodes[1].textContent);
        }

        if(a * b * c * d != false)
        {
          pitTime = a + b - c - d;
          pitTimes.push(pitTime / 1000);
          manager[index].pitTimeLoss.push(pitTime / 1000);
        }
        else
          manager[index].pitTimeLoss.push('');
      }
      else {
        manager[index].rank.push(race_table.rows[i].childNodes[4].innerHTML); //track position
        manager[index].lap_time.push(race_table.rows[i].childNodes[1].innerHTML);

        if (race_table.rows[i].childNodes[2].innerHTML == '-')
          manager[index].race_time.push('0'); // leading car lead by 0
        else {
          string = race_table.rows[i].childNodes[2].innerHTML;
          manager[index].race_time.push(string); //time from leading car
        }
      }

    }
    //console.log(pitTimes);
    sum = pitTimes.reduce((a, b) => a + b, 0);
    avg = (sum / pitTimes.length) || 0;
    manager[index].pitTimeLoss.push(avg);
    //console.log("average is: "+avg);
    last_lap_completed = race_table.rows[race_table.tBodies[0].rows.length].childNodes[0].innerHTML;

    var lastStintLaps = (last_lap_completed - last_pit_lap);

    manager[index].pit_stop += ',' + lastStintLaps;

    bar = document.getElementById('bar');
    progress_status += (100 / manager.length);
    bar.style.width = progress_status + '%';


    //save managers
    chrome.storage.local.set({ 'active': manager }, function () {
      //console.log('saved ' + manager[index].name);
    });


  }
  catch (err) {
    console.log(err);

  }

}
function formatTable(){

  if(document.getElementsByClassName('strategy-preview').length > 0)
    return;

  chrome.storage.local.get('active', function(data) {
    var manager = data.active;
    manager.sort((a, b) => { return a.race_finish - b.race_finish; });


    var valid = 0;
    let total = 0;
    for (let i = 0; i < data.active.length; i++) {

      time = data.active[i].pitTimeLoss[data.active[i].pitTimeLoss.length - 1];
      //check if driver did same number of laps as the winner and has a valid pit time
      if (manager[0].rank.length == manager[i].rank.length && time > 0) {
        //console.log("doing pit of: "+manager[i].name);
        if (time != null) {
          total += time;

          valid++;
        }
      }
    }

    //document.querySelector('#race table').tBodies[0].rows[0].append(document.createTextNode('Average pit time loss: ' + (total / valid).toFixed(2)));

    const table = document.querySelector('#race table');
    const t_head = table.tHead;
    t_head.classList.add('tyre_preview');
    //t_head.rows[0].cells[0].style.width ="29px";
    //t_head.rows[0].cells[1].style.width ="60%";
    const t_body = table.tBodies[0];

    


    for(var i = 0 ; i < t_body.rows.length ; i++){

      var history = document.createElement('div');
      history.classList.add('strategy-preview');
      stops = manager[i].pit_stop.split(',');
      stops.forEach(item =>{
        var ele;
        if(isNaN(item))
          ele = createTyreElement(item);
        else
          ele = createTextElement(item);

        history.appendChild(ele);
      });
      t_body.rows[i].childNodes[1].lastChild.appendChild(history);

    }




  });
  function createTextElement(laps)
  {
    var laptext = document.createElement('td');
    laptext.setAttribute('style','height:10px; width:10px;');
    laptext.textContent = laps;
    return laptext;
  }
  function createTyreElement(code){
    //console.log(code);
    var tyre = 'ts-M';

    switch (code) {
    case 'Full wet tyres':
      tyre = 'ts-W';
      break;
    case 'Intermediate wet tyres':
      tyre = 'ts-I';
      break;
    case 'Hard tyres':
      tyre = 'ts-H';
      break;
    case 'Medium tyres':
      tyre = 'ts-M';
      break;
    case 'Soft tyres':
      tyre = 'ts-S';
      break;
    case 'Super soft tyres':
      tyre = 'ts-SS';
      break;

    case 'Pneumatici da bagnato':
      tyre = 'ts-W';
      break;
    case 'Pneumatici intermedi':
      tyre = 'ts-I';
      break;
    case 'Pneumatici duri':
      tyre = 'ts-H';
      break;
    case 'Pneumatici medi':
      tyre = 'ts-M';
      break;
    case 'Pneumatici morbidi':
      tyre = 'ts-S';
      break;
    case 'Pneumatici super morbidi':
      tyre = 'ts-SS';
      break;

    case 'Neumáticos de Lluvia':
      tyre = 'ts-W';
      break;
    case 'Neumáticos Intermedios':
      tyre = 'ts-I';
      break;
    case 'Neumáticos Duros':
      tyre = 'ts-H';
      break;
    case 'Neumáticos Medios':
      tyre = 'ts-M';
      break;
    case 'Neumáticos Blandos':
      tyre = 'ts-S';
      break;
    case 'Neumáticos Súper Blandos':
      tyre = 'ts-SS';
      break;

    case 'Vollregen-Reifen':
      tyre = 'ts-W';
      break;
    case 'Intermediate Reifen':
      tyre = 'ts-I';
      break;
    case 'Hart Reifen':
      tyre = 'ts-H';
      break;
    case 'Medium Reifen':
      tyre = 'ts-M';
      break;
    case 'Soft Reifen':
      tyre = 'ts-S';
      break;
    case 'Super Soft Reifen':
      tyre = 'ts-SS';
      break;

    case 'Pneus de chuva':
      tyre = 'ts-W';
      break;
    case 'Pneus intermediários':
      tyre = 'ts-I';
      break;
    case 'Pneus duros':
      tyre = 'ts-H';
      break;
    case 'Pneus médios':
      tyre = 'ts-M';
      break;
    case 'Pneus macios':
      tyre = 'ts-S';
      break;
    case 'Pneus super macios':
      tyre = 'ts-SS';
      break;

    case 'Дождевые шины':
      tyre = 'ts-W';
      break;
    case 'Промежуточные шины':
      tyre = 'ts-I';
      break;
    case 'Твердые шины':
      tyre = 'ts-H';
      break;
    case 'Средние шины':
      tyre = 'ts-M';
      break;
    case 'Мягкие шины':
      tyre = 'ts-S';
      break;
    case 'Супермягкие шины':
      tyre = 'ts-SS';
      break;

    default:tyre = 'ts-M';
      break;
      case 'Pneus pluie':
        tyre = 'ts-W';
        break;
      case 'Pneus intermédiaires humides':
        tyre = 'ts-I';
        break;
      case 'Pneus durs':
        tyre = 'ts-H';
        break;
      case 'Pneus moyens':
        tyre = 'ts-M';
        break;
      case 'Pneus tendres':
        tyre = 'ts-S';
        break;
      case 'Pneus super tendres':
        tyre = 'ts-SS';
        break;
    }

    var  tyreEle = document.createElement('td');
    tyreEle.setAttribute('style','height:10px; width:20px;background-color: transparent;');
    tyreEle.className = tyre;

    return tyreEle;
  }

}

function csvRaceResults(race)
{
  let csv = '';
  race.forEach(driver=>{
    for(var i = 0 ; i < driver.driver_result.lap.length; i++)
    {

      csv += `${driver.name},${driver.team},${driver.driver_result.lap[i]},${driver.driver_result.time[i]},${driver.driver_result.gap_to_lead[i]},${driver.driver_result.average[i]},${driver.driver_result.rank[i]}\n`;
    }
  });

  return csv;
}









manager = [];
progress_status = 0;
inject_button();

function downloadFile(data,download_name){
  var blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, "test");
  } else {
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", download_name);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
}


function inject_button() {

  button = document.createElement("button");
  button.setAttribute("class", "btn3");
  button.setAttribute("style", "position:relative; left:10px;");
  button.innerText = "Extract";
  button.id = 'extract_button';
  button.addEventListener('click', button_function);
  button.addEventListener('touchstart', button_function);
  title_location = document.getElementsByClassName("dialog-head"); //location of the button

  if (title_location[0].childElementCount == 1) {
    title_location[0].appendChild(button);
  }

  p = document.querySelector("#dialogs-container > div > div > div.mOpt");
  export_button = p.childNodes[5];
  quali_button = export_button.cloneNode(true);
  race_button = export_button.cloneNode(true);

  quali_button.textContent = "Export Q";
  quali_button.addEventListener('click', quali_export);
  race_button.addEventListener('click', race_export)
  if (p.childElementCount == 5) {

    p.insertBefore(quali_button,p.childNodes[6]);
  }

  export_button.parentNode.replaceChild(race_button, export_button);
 
}

function race_export()
{
  cvs = "";
  r= document.querySelector("#race").childNodes[1];
  cvs+=r.childNodes[0].childNodes[0].childNodes[0].textContent;
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[1].textContent;
  cvs+=",Team";
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[2].textContent;
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[3].textContent;
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[4].textContent;
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[5].textContent;
  cvs+=","+r.childNodes[0].childNodes[0].childNodes[6].textContent;

  race_table = r.childNodes[1];

  for (i = 1; i <= race_table.childElementCount; i++) {
    rank = i;
    driver_name = race_table.childNodes[i].childNodes[1].childNodes[4].textContent.substring(1);
    team_name = race_table.childNodes[i].childNodes[1].childNodes[6].innerText;
    finish = race_table.childNodes[i].childNodes[2].textContent;
    best_lap = race_table.childNodes[i].childNodes[3].textContent;
    top_speed = race_table.childNodes[2].childNodes[4].textContent;
    pits = race_table.childNodes[2].childNodes[5].textContent;
    points = race_table.childNodes[2].childNodes[6].textContent;

    cvs+="\n"+rank+","+driver_name+","+team_name+","+finish+","+best_lap+","+top_speed+","+pits+","+points;
  }
  race_id = window.location.href.replace(/\D/g, "");
  downloadFile(cvs,race_id+"_Race");

}
  



function quali_export()
{
  
  cvs = '';
  q = document.querySelector("#qualifying").childNodes[0];

  cvs+=q.childNodes[0].childNodes[0].childNodes[0].textContent;
  cvs+=","+q.childNodes[0].childNodes[0].childNodes[1].textContent;
  cvs+=",Team";
  cvs+=","+q.childNodes[0].childNodes[0].childNodes[2].textContent;
  cvs+=","+q.childNodes[0].childNodes[0].childNodes[3].textContent;
  cvs+=","+q.childNodes[0].childNodes[0].childNodes[4].textContent;

  quali_table = q.childNodes[1];
  for (i = 1; i <= quali_table.childElementCount; i++) {
    rank = i;
    driver_name = quali_table.childNodes[i].childNodes[1].childNodes[4].textContent.substring(1);
    team_name = quali_table.childNodes[i].childNodes[1].childNodes[6].innerText;
    lap = quali_table.childNodes[i].childNodes[2].textContent;
    gap = quali_table.childNodes[i].childNodes[3].textContent;
    tyre = quali_table.childNodes[2].childNodes[4].className.replace("ts-","");
    race_id = window.location.href.replace(/\D/g, "");
    cvs+="\n"+rank+","+driver_name+","+team_name+","+lap+","+gap+","+tyre;
  }

  downloadFile(cvs,race_id+"_Qualifying");
  
}
function progress() {

  progress_div = document.createElement("div");
  progress_div.setAttribute("style", "background-color:#ddd; height:10px; border-radius:4px;");
  progress_div.id = 'progress';

  bar_div = document.createElement("div");
  bar_div.setAttribute("style", "background-color:#4CAF50; width:1%; height:10px; border-radius:4px;");
  bar_div.id = 'bar';
  progress_div.appendChild(bar_div);
  return progress_div;
}



function get_quali()
{
  manager = [];
// get quali results
for (i = 1; i <= quali_results.childElementCount; i++) {
  driver_quali = quali_results.childNodes[i].childNodes[1].getElementsByClassName("linkParent");
  driver_id = driver_quali[0].href.replace(/\D/g, "");
  driver_name = quali_results.childNodes[i].childNodes[1].childNodes[4].textContent.substring(1);
  team_name = quali_results.childNodes[i].childNodes[1].childNodes[6].innerText;
  race_id = window.location.href.replace(/\D/g, "");
  manager_template = {
    "id": driver_id,
    "name": driver_name,
    "team": team_name,
    "quali": i,
    "race": "NotFound",
    "race_finish": "",
    "race_id": race_id,
    "report_id": "",
    "rank": [],
    "race_time": [],
    "lap_time": [],
    "pit_stop": ""
  }
  manager.push(manager_template);
}
}

function button_function() {

  b_parent = this.parentElement;
  this.remove();
  b_parent.appendChild(progress());
  race_results = document.querySelector("#race").childNodes[1].childNodes[1];
  quali_results = document.querySelector("#qualifying").childNodes[0].childNodes[1];

  get_quali();

  //get race results
  for (i = 1; i <= race_results.childElementCount; i++) {

    //driver id and name
    driver_race_result = race_results.childNodes[i].childNodes[1].getElementsByClassName("linkParent");

    try {
      driver_race_report = race_results.childNodes[i].childNodes[2].getElementsByClassName("linkParent")[0].href;

    }
    catch (err) {
      console.log("failed to get one or more reports. most likely DNFs");
      driver_race_report = "no_race";

    }


    // extract driver id from reports url
    driver_id = driver_race_result[0].href.replace(/\D/g, "");



    finish_position = i;
    //assingn race report to correct driver from quali
    j = 0;
    looking_for_id = true;
    while (looking_for_id) {
      if (manager[j].id == driver_id) {
        looking_for_id = false;
        manager[j].race = driver_race_report;
        manager[j].report_id = driver_race_report.replace(/\D/g, "");
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
  console.log("requesting " + manager.length + " reports");
  for (number = 0; number < manager.length; number++) {
    if (manager[number].report_id != "") {

      url = "https://igpmanager.com/index.php?action=fetch&d=resultDetail&id=" + manager[number].report_id + "&csrfName=&csrfToken=";
      result = await request(url);

      table = decode_result(result);

      update_managers(table, number);

      
     

    }
  }
  formatTable();
  document.getElementById("progress").remove();
}

//handle server response
function request(url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
    xhr.open('get', url, true)
    xhr.send()
  })
}

//get only the table from the response
function decode_result(data) {

  results = JSON.parse(data).vars.results;
  table = /<table.*<\/table>/gms.exec(results)[0];
  t = document.createElement("table");
  //sanitizing the data
  let cleanHTML = DOMPurify.sanitize(table);
  t.innerHTML = cleanHTML;

  return t;

}



//complete the manager_template info
async function update_managers(table, index) {


  try {

    race_table = table;
    laps_done = race_table.tBodies[0].rows.length; // getting last lap

    startTyre = race_table.rows[1].childNodes[1].childNodes[0].textContent;
    manager[index].pit_stop = startTyre;
    last_pit_lap = 0;
    

    for (i = 2; i <= laps_done; i++) {

      if (isNaN(race_table.rows[i].childNodes[0].textContent)) {
        pit_lap = race_table.rows[i - 1].childNodes[0].textContent;
        pit_tyre = race_table.rows[i].childNodes[1].childNodes[2].textContent;  
        var stintLaps = (pit_lap - last_pit_lap);
        manager[index].pit_stop += "," + stintLaps + "," + pit_tyre;

        last_pit_lap = pit_lap;

      }
      else {
        manager[index].rank.push(race_table.rows[i].childNodes[4].innerHTML); //track position
        manager[index].lap_time.push(race_table.rows[i].childNodes[1].innerHTML);

        if (race_table.rows[i].childNodes[2].innerHTML == "-")
          manager[index].race_time.push("0"); // leading car lead by 0
        else {
          string = race_table.rows[i].childNodes[2].innerHTML;
          manager[index].race_time.push(string); //time from leading car
        }
      }
    }

    last_lap_completed = race_table.rows[race_table.tBodies[0].rows.length].childNodes[0].innerHTML;
    
    var lastStintLaps = (last_lap_completed - last_pit_lap)
    
    manager[index].pit_stop += "," + lastStintLaps;

    bar = document.getElementById("bar");
    progress_status += (100 / manager.length);
    bar.style.width = progress_status + "%";


    //save manager
    chrome.storage.local.set({ 'active': manager }, function () {
      console.log("saved " + manager[index].name);
    });


  }
  catch (err) {
    console.log(err);

  }

}


function formatTable(){

  if(document.getElementById("histTyre")!=null)
  return

  chrome.storage.local.get("active", function(data) {

    var manager = data.active;
    manager.sort((a, b) => { return a.race_finish - b.race_finish; });
  
    var table = document.getElementById("race").childNodes[1];

    var history = document.createElement("div");
        history.id="histTyre";


    for(var i=1 ; i<table.rows.length ; i++){
    
          history =document.createElement("div");
          history.id="histTyre";
          stops = manager[i-1].pit_stop.split(",");
          stops.forEach(item =>{
            var ele;
            if(isNaN(item))      
            ele = createTyreElement(item);
            else
            ele = createTextElement(item);
            
            history.appendChild(ele);
          })
          table.rows[i].childNodes[1].lastChild.appendChild(history);

    }
    
      
 

  });
  function createTextElement(laps)
  {
  var laptext = document.createElement("td");
  laptext.setAttribute("style","height:10px; width:10px;");
  laptext.textContent = laps;
  return laptext;
  }
function createTyreElement(code){

  var tyre ="ts-M";

switch (code) {
    case "Full wet tyres":
    tyre = "ts-W";
    break;
    case "Intermediate wet tyres":
    tyre = "ts-I";
    break;
    case "Hard tyres":
    tyre = "ts-H";
    break;
    case "Medium tyres":
    tyre = "ts-M";
    break;
    case "Soft tyres":
    tyre = "ts-S";
    break;
    case "Super soft tyres":
    tyre = "ts-SS";
    break;

    case "Pneumatici da bagnato":
      tyre = "ts-W";
      break;
      case "Pneumatici intermedi":
      tyre = "ts-I";
      break;
      case "Pneumatici duri":
      tyre = "ts-H";
      break;
      case "Pneumatici medi":
      tyre = "ts-M";
      break;
      case "Pneumatici morbidi":
      tyre = "ts-S";
      break;
      case "Pneumatici super morbidi":
      tyre = "ts-SS";
      break;

      case "Neumáticos de Lluvia":
      tyre = "ts-W";
      break;
      case "Neumáticos Intermedios":
      tyre = "ts-I";
      break;
      case "Neumáticos Duros":
      tyre = "ts-H";
      break;
      case "Neumáticos Medios":
      tyre = "ts-M";
      break;
      case "Neumáticos Blandos":
      tyre = "ts-S";
      break;
      case "Neumáticos Súper Blandos":
      tyre = "ts-SS";
      break;

      case "Vollregen-Reifen":
        tyre = "ts-W";
        break;
        case "Intermediate Reifen":
        tyre = "ts-I";
        break;
        case "Hart Reifen":
        tyre = "ts-H";
        break;
        case "Medium Reifen":
        tyre = "ts-M";
        break;
        case "Soft Reifen":
        tyre = "ts-S";
        break;
        case "Super Soft Reifen":
        tyre = "ts-SS";
        break;
        
        case "Pneus de chuva":
        tyre = "ts-W";
        break;
        case "Pneus intermediários":
        tyre = "ts-I";
        break;
        case "Pneus duros":
        tyre = "ts-H";
        break;
        case "Pneus médios":
        tyre = "ts-M";
        break;
        case "Pneus macios":
        tyre = "ts-S";
        break;
        case "Pneus super macios":
        tyre = "ts-SS";
        break;

        case "Дождевые шины":
          tyre = "ts-W";
          break;
          case "Промежуточные шины":
          tyre = "ts-I";
          break;
          case "Твердые шины":
          tyre = "ts-H";
          break;
          case "Средние шины":
          tyre = "ts-M";
          break;
          case "Мягкие шины":
          tyre = "ts-S";
          break;
          case "Супермягкие шины":
          tyre = "ts-SS";
          break;

  default:tyre = "ts-M";
    break;
}

 var  tyreEle = document.createElement("td");
  tyreEle.setAttribute("style","height:10px; width:20px;background-color: transparent;");
  tyreEle.className = tyre;

  return tyreEle;
}

}











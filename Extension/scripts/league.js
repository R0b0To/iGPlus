async function inject_history()
{
  try {
    if(document.getElementById('fullHistoryShortcut') == null)
    {
      const scheduleTable = document.getElementById('leagueScheduleColumn').getElementsByTagName('table')[0];
      const fullHistoryShortcut = document.createElement('a');
      fullHistoryShortcut.href = 'd=history';
      fullHistoryShortcut.id = "fullHistoryShortcut";
      fullHistoryShortcut.classList.add('btn','w-full');
      fullHistoryShortcut.textContent = 'Full race history';
      scheduleTable.parentElement.append(fullHistoryShortcut);
      

      if(document.getElementsByClassName('myTeam').length>1)
      {
        advancedExtract();
      }
      //show on all leagues?
      if(document.getElementsByClassName("changes_th")[0]==null){
         standingsChanges();
      }
         

    }
  } catch (error) {
    console.log(error);
  }
}


try {
  setTimeout(inject_history,100);
} catch (error) {

}

async function advancedExtract(){
  const {fetchRaceResultInfo} = await import(chrome.runtime.getURL('common/fetcher.js'));
  const scheduleTable = document.getElementById('leagueScheduleColumn').getElementsByTagName('table')[0];
  const racesCompleted = scheduleTable.querySelectorAll('a[href*="d=result"]');
  
  racesCompleted.forEach(async link => {
    const id = new URLSearchParams(link.href).get('id');
    let result_info = await chrome.runtime.sendMessage({
      type:'getDataFromDB',
      data:{id:id,store:'race_result'}
    });
   // let result_info = await getElementById(id,'race_result') ?? false;
    if(result_info == false){
      console.log('need to request?');
      const result = await fetchRaceResultInfo(id);
      result_info = parseData(result);
      saveRaceResultsHistory(id,result_info);
    }//else{console.log('data already stored')}
    if(result_info.quali_pos!='none')// only if the player has raced
      link.parentElement.append(`  [${result_info.quali_pos}]-->[${result_info.race_finish}]`);


  });

  async function saveRaceResultsHistory(raceId,data)
  {
    chrome.runtime.sendMessage({
      type:'addRaceResultsToDB',
      data:{id:raceId,...data}
    });
      
   
  }

}

function parseData(data){
  function getHtmlFragment(stringNode){
    const html_fragment = document.createElement('table');
    html_fragment.innerHTML = stringNode;
    return html_fragment;
  }

  const quali_result = getHtmlFragment(data.vars.qResult).querySelector('.myTeam')?? "not present";
  const race_result = getHtmlFragment(data.vars.rResult).querySelector('.myTeam')?? "not present";
  const track = getHtmlFragment(data.vars.raceName).querySelector('.flag').classList[1].slice(2);
  const last_race_points = {};
  const rows = getHtmlFragment(data.vars.rResult).querySelectorAll('tr');
  console.log(data.vars.rResult);
  rows.forEach(row => {
    
    last_race_points[row.querySelector('.teamName').textContent] = parseInt(row.lastChild.textContent);
  });
 
  if(quali_result=="not present"){

    return {track,quali_pos:"none",quali_tyre:'none',race_finish:'none',last_race_points};
  }
  const quali_pos = quali_result.cells[0].textContent;
  const quali_tyre = quali_result.cells[4].className;
  const race_finish = (race_result.rowIndex + 1);
  return {track,quali_pos,quali_tyre,race_finish,last_race_points};
}
function parseRaceResults(data){
  function getHtmlFragment(stringNode){
    const html_fragment = document.createElement('table');
    html_fragment.innerHTML = stringNode;
    return html_fragment.tBodies[0];
  }
  const last_race_points = {};
  const rows = getHtmlFragment(data.vars.rResult).querySelectorAll('tr');
  rows.forEach(row => {
  const team = row.querySelector('.teamName').textContent.trim();
  const raw = row.querySelector('.resultRacePointsCell').textContent.trim();

  const parsed = parseInt(raw, 10);
  const points = isNaN(parsed) ? 0 : parsed;

  last_race_points[team] = (last_race_points[team] || 0) + points;
});
  return last_race_points;
}


async function standingsChanges(){

  const scheduleTable = document.getElementById('leagueScheduleColumn').getElementsByTagName('table')[0];
  const racesCompleted = scheduleTable.querySelectorAll('a[href*="d=result"]');

 
  if(racesCompleted.length>2){

  const last_race_link = racesCompleted[racesCompleted.length-1];

  const standings_changes = await getRankChangesOfTier(scheduleTable,last_race_link);

  //adding table
  const changes = document.createElement('th'); //add text or leave it empty
  changes.classList.add('changes_th');

  const standings_table = document.querySelector('.teamStandingsInclude table');

  const rows = standings_table.querySelectorAll('tr');

  for(i=0; i <Object.entries(standings_changes).length; i++ ){
    const tEle = document.createElement('td');
    tEle.id = 'changeRow';
    
    //add css arrows based on gain
    const change_col = rows[i].insertCell(2);
    change_col.classList.add('arrow_container');
    const value = standings_changes[rows[i].querySelector('span.font-normal').textContent];
    const change_div_container =document.createElement('div');
    change_div_container.classList.add('change_div');
    const arrow_span = document.createElement('span');
    const value_span = document.createElement('span');
    change_div_container.append(arrow_span,value_span);
    value_span.textContent = Math.abs(value);
    value_span.classList.add('value_change');
    change_col.append(change_div_container);
    if(value<0)
      arrow_span.classList.add('arrow_ups')
    else if(value>0)
      arrow_span.classList.add('arrow_down')
    else
      arrow_span.classList.add('arrow')
   
  }

}
  
}

async function getRankChangesOfTier(tier_table,last_race_link){
const {fetchRaceResultInfo} = await import(chrome.runtime.getURL('common/fetcher.js'));
const tier_standings = getTeamStandings();

 const id_race = new URLSearchParams(last_race_link.href).get('id');

 //should save the race result in the db for future requests?
 let result= await chrome.runtime.sendMessage({
  type:'getDataFromDB',
  data:{id:id_race,store:'race_result'}
});
 let points_last_race = 0;
//this check should in theory always be skipped after the first load because races are saved in the database before this function is called
  if(result==false){
   result = await fetchRaceResultInfo(id_race); 
   points_last_race = parseRaceResults(result);
  }else{
   points_last_race = (result.last_race_points); 
  }
 const standings_before_last_race = subtractObjects(tier_standings,points_last_race)
 return order(standings_before_last_race,tier_standings)

}

function order(before,after)
{
  const array_current_stand = Object.entries(after);
  const ranking_after = {};
  const ranking_before = {};
  for(i=0; i<array_current_stand.length; i++)
  { 
    ranking_after[array_current_stand[i][0]] = i;
  }

  const sortedTeams = Object.entries(before)
  .sort((a, b) => b[1] - a[1]) // Sort by descending value
  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
  const array_last_stand = Object.entries(sortedTeams);
  for(i=0; i<array_last_stand.length; i++)
    { 
      ranking_before[array_last_stand[i][0]] = i;
    }
    const changes = subtractObjects(ranking_after,ranking_before)
    return changes;

}


function subtractObjects(obj1, obj2) {
  const result = {};

  for (const key in obj1) {
    if (obj2.hasOwnProperty(key)) {
      result[key] = obj1[key] - obj2[key];
    } else {
      result[key] = obj1[key]; // Or handle missing keys as needed
    }
  }

  return result;
}

function getTeamStandings(){
  const tier_table = document.querySelector('.teamStandingsInclude table');
  const scores = tier_table.querySelectorAll('tr > td:last-child');
  const teams = tier_table.querySelectorAll('tr > td > span.font-normal');
  const current_standings = {}
  for(i=0; i<teams.length; i++)
    {
      current_standings[String(teams[i].textContent)] = parseInt(scores[i].textContent)
    }
  return current_standings
}
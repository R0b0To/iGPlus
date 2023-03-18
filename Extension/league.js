t = {
  'au': 'd=circuit&id=1&tab=history' ,//Australia
  'my': 'd=circuit&id=2&tab=history' ,//Malaysia
  'cn': 'd=circuit&id=3&tab=history' ,//China
  'bh': 'd=circuit&id=4&tab=history' ,//Bahrain
  'es': 'd=circuit&id=5&tab=history' ,//Spain
  'mc': 'd=circuit&id=6&tab=history' ,//Monaco
  'tr': 'd=circuit&id=7&tab=history' ,//Turkey
  'de': 'd=circuit&id=9&tab=history' ,//Germany
  'hu': 'd=circuit&id=10&tab=history' ,//Hungary
  'eu': 'd=circuit&id=11&tab=history' ,//Europe
  'be': 'd=circuit&id=12&tab=history' ,//Belgium
  'it': 'd=circuit&id=13&tab=history' ,//Italy
  'sg': 'd=circuit&id=14&tab=history' ,//Singapore
  'jp': 'd=circuit&id=15&tab=history' ,//Japan
  'br': 'd=circuit&id=16&tab=history' ,//Brazil
  'ae': 'd=circuit&id=17&tab=history' ,//AbuDhabi
  'gb': 'd=circuit&id=18&tab=history' ,//Great Britain
  'fr': 'd=circuit&id=19&tab=history' ,//France
  'at': 'd=circuit&id=20&tab=history' ,//Austria
  'ca': 'd=circuit&id=21&tab=history' ,//Canada
  'az': 'd=circuit&id=22&tab=history' ,//Azerbaijan
  'mx': 'd=circuit&id=23&tab=history' ,//Mexico
  'ru': 'd=circuit&id=24&tab=history' ,//Russia
  'us': 'd=circuit&id=25&tab=history' //USA
};

function addExtraTable (size)
{
  var t = document.createElement('table');
  t.id = 'extraTable';
  t.setAttribute('style','float: left;border-collapse:initial;width: auto;');
  t.className = 'hover acp';
  for(var i = 0 ; i < size ;i++)
  {
    var row = document.createElement('tr');
    const icon = document.createElement('td');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg>';
    icon.setAttribute('style','display: block;width:18px;cursor:pointer');
    icon.className = 'hover pointer';
    icon.addEventListener('click',openHistory);
    a = document.createElement('a');
    a.href = '#';
    icon.append(a);
    row.append(icon);
    t.append(row);
  }
  return t;
}
function openHistory()
{
  const scheduleTable = document.getElementById('scheduleTable');
  const raceRow = this.parentElement.rowIndex;
  const track = scheduleTable.rows[raceRow].childNodes[1].childNodes[0];
  const code = track.className.slice(-2);
  try {
    link = track.parentElement.previousSibling.childNodes[0];
    a = this.querySelector('a');
    a.href = t[code];
    a.click();
  } catch (error) {
    console.log(error);
  }
}

async function inject_history()
{
  try {
    if(document.getElementById('extraTable') == null)
    {
      const scheduleTable = document.getElementById('scheduleTable');
      scheduleTable.setAttribute('style','width: 90%;width:-webkit-fill-available ;');
      const track_numbers = scheduleTable.rows.length;
      const tableToAdd = addExtraTable(track_numbers);
      const fullHistoryShortcut = document.createElement('a');
      fullHistoryShortcut.href = 'd=history';
      fullHistoryShortcut.setAttribute('style','display: inline-block;width:100%; height:24px ;background:#c1c1c1;text-align: center;font-family: RobotoCondensed;border-radius: 8px 8px 8px 8px;');
      fullHistoryShortcut.textContent = 'Full race history';
      scheduleTable.parentElement.insertBefore(tableToAdd, scheduleTable);
      scheduleTable.parentElement.append(fullHistoryShortcut);
      const racesCompleted = scheduleTable.querySelectorAll('.pointer:not(.myTeam)');
      const racesToCheck = racesCompleted.length;
      const url = `https://igpmanager.com/index.php?action=send&type=history&start=0&numResults=${racesToCheck}&jsReply=scrollLoader&el=history&csrfName=&csrfToken=`;
      fetch(url)
        .then(response => response.json())
        .then(data =>
        {
          arrayPositions = [...data.src.matchAll(/medium">(\d+)/g)];
          arrayID = [...data.src.matchAll(/id=(\d+)/g)];
          historyObj = {};

          arrayID.forEach((element, index) => {
            historyObj[element[1]] = arrayPositions[index][1];
          });
          // return historyObj;
          //console.log(historyObj);
          racesCompleted.forEach(race => {
            raceID = race.querySelector('[href]').href.match(/\d+/)[0];
            if(historyObj[raceID] != null)
              race.childNodes[0].childNodes[1].textContent += ` [${historyObj[raceID]}]`;
          });


        });


    }
  } catch (error) {

  }


}


try {
  setTimeout(inject_history,100);
} catch (error) {

}


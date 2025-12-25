
(function addTrackInfo(){
  try {
    const searchBtn = document.getElementsByClassName('btn pointer')[0];
    searchBtn.addEventListener('click',loadTrack);
  } catch (error) {
    setTimeout(addTrackInfo,500);
  }

})();
function createRow(rowName,value){
  const row = document.createElement('tr');
  const rowDescription = document.createElement('td');
  rowDescription.textContent = rowName;
  const barTd = document.createElement('td');
  const bar = document.createElement('div');
  bar.classList.add('ratingBar','statBarWithValue');
  const barValue = document.createElement('div');
  barValue.style.width = `${value}%`;
  const displayedValue = document.createElement('span');
  displayedValue.textContent = `${value}%`;
  displayedValue.classList.add('showStat');
  bar.append(barValue,displayedValue);
  barTd.append(bar);
  row.append(rowDescription,barTd);
  return row;
}
function createTrackStasDiv(track){
  const container = document.createElement('div');
  container.id = 'trackStats';
  const table = document.createElement('table');
  table.classList.add('acp','pad');
  table.append(createRow('Overtaking chances',track.overtake));
  table.append(createRow('Road bumpiness',track.bumpiness));
  table.append(createRow('Fuel consumption',track.fuel));
  table.append(createRow('Tyre wear',track.tyre));
  container.append(table);
  return container;
}
function updateStats(track){
  function updateValue(ratingBar,value){
    ratingBar.childNodes[0].style.width = `${value}%`;
    ratingBar.childNodes[1].textContent = `${value}%`;
  }
  const container = document.getElementById('trackStats');
  const stats = container.querySelectorAll('.ratingBar');

  updateValue(stats[0],track.overtake);
  updateValue(stats[1],track.bumpiness);
  updateValue(stats[2],track.fuel);
  updateValue(stats[3],track.tyre);

}
function loadTrack()
{
  const trackCharacteristics = {
    1:{code:'au', overtake:40,bumpiness:80,fuel:50,tyre:40},
    2:{code:'my', overtake:56,bumpiness:50,fuel:60,tyre:80},
    3:{code:'cn', overtake:50,bumpiness:25,fuel:90,tyre:80},
    4:{code:'bh', overtake:45,bumpiness:35,fuel:90,tyre:60},
    5:{code:'es', overtake:40,bumpiness:25,fuel:70,tyre:85},
    6:{code:'mc', overtake:10,bumpiness:90,fuel:40,tyre:20},
    7:{code:'tr', overtake:50,bumpiness:56,fuel:50,tyre:90},
    8:{code:'gb9', overtake:0,bumpiness:0,fuel:0,tyre:0},
    9:{code:'de', overtake:50,bumpiness:35,fuel:25,tyre:50},
    10:{code:'hu', overtake:15,bumpiness:45,fuel:25,tyre:30},
    11:{code:'eu', overtake:40,bumpiness:50,fuel:50,tyre:45},
    12:{code:'be', overtake:50,bumpiness:50,fuel:70,tyre:60},
    13:{code:'it', overtake:90,bumpiness:50,fuel:90,tyre:35},
    14:{code:'sg', overtake:40,bumpiness:70,fuel:50,tyre:45},
    15:{code:'jp', overtake:60,bumpiness:50,fuel:45,tyre:70},
    16:{code:'br', overtake:50,bumpiness:35,fuel:55,tyre:60},
    17:{code:'ae', overtake:80,bumpiness:56,fuel:40,tyre:50},
    18:{code:'gb', overtake:60,bumpiness:40,fuel:80,tyre:65},
    19:{code:'fr', overtake:50,bumpiness:70,fuel:70,tyre:80},
    20:{code:'at', overtake:50,bumpiness:40,fuel:70,tyre:60},
    21:{code:'ca', overtake:70,bumpiness:40,fuel:80,tyre:45},
    22:{code:'az', overtake:90,bumpiness:70,fuel:60,tyre:45},
    23:{code:'mx', overtake:70,bumpiness:30,fuel:60,tyre:60},
    24:{code:'ru', overtake:70,bumpiness:20,fuel:70,tyre:50},
    25:{code:'us', overtake:70,bumpiness:20,fuel:70,tyre:65},
    26:{code:'nl', overtake:0,bumpiness:0,fuel:0,tyre:0}
  };
  const selectedTrack = document.getElementsByClassName('historyFilterTrack')[0];
  const image = document.createElement('img');
  const trackId = selectedTrack.value;
  const tableDiv = document.getElementById('history');
  const imageContainer = document.createElement('div');
  imageContainer.append(image);
  imageContainer.classList.add('statsContainer');

  if(trackId != 0 && trackId != 8){
    //document.getElementById('igplus_darkmode') ? image.src = chrome.runtime.getURL(`images/circuits/${trackCharacteristics[trackId].code}_dark.png`) : image.src = chrome.runtime.getURL(`images/circuits/${trackCharacteristics[trackId].code}.png`)
    image.src = chrome.runtime.getURL(`images/circuits/${trackCharacteristics[trackId].code}_dark.png`);
    image.classList.add('trackImage');
    image.id = 'trackMap';

    (!document.getElementById('trackMap')) ?  tableDiv.prepend(imageContainer) : document.getElementById('trackMap').src = image.src;

    (!document.getElementById('trackStats')) ? imageContainer.prepend(createTrackStasDiv(trackCharacteristics[trackId])) : updateStats(trackCharacteristics[trackId]);


  }else{
    document.getElementsByClassName('statsContainer')[0].remove();
  }


}


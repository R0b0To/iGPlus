let CONFIG = {};

async function addSaveButton(config)
{
  CONFIG = config;
  if(document.getElementById('save&load') == null)
  {

    const driverNumber = document.getElementsByClassName('fuel').length;
    if(driverNumber == 2)
    {
      const strategy = document.getElementById('d2strategy');
      const placeHere = strategy.querySelectorAll('th')[0];
      placeHere.appendChild(createSaveLoad());
    }
    const strategy = document.getElementById('d1strategy');
    const placeHere = strategy.querySelectorAll('th')[0];
    placeHere.appendChild(createSaveLoad());
  }

  const code = CONFIG.track.code;
  const data = await chrome.storage.local.get('save');

  const lb = document.querySelectorAll('.lbutton');

  if(typeof data.save === 'undefined')
  {
    lb.forEach((ele) => {
      ele.classList.add('disabled');
    });

  }
  else
  {
    if(typeof data.save[code] === 'undefined')
    {
      lb.forEach((ele) => {
        ele.classList.add('disabled');
      });
    }

  }

}
function createSaveLoad()
{
  const containerDiv = document.createElement('div');
  containerDiv.id = 'save&load';
  containerDiv.classList.add('saveContainer');
  const saveDiv = document.createElement('div');
  const loadDiv = document.createElement('div');
  const loadContainer = document.createElement('dialog');
  loadContainer.className = 'dropdown2-content not-selectable';
  loadContainer.id = 'myDropdown2';
  loadContainer.addEventListener('click',dialogClickHandler);
  saveDiv.className = 'sbutton';
  loadDiv.className = 'sbutton lbutton';
  saveDiv.textContent = 'Save';
  loadDiv.textContent = 'Load';
  containerDiv.append(loadContainer);
  saveDiv.addEventListener('click',saveStint);
  loadDiv.addEventListener('click',async function(){
    const saves =  await generateSaveList();
    if(saves != 'empty'){
      const dialog = this.parentElement.querySelector('[id=myDropdown2]');
      dialog.showModal();
    }

  });
  containerDiv.appendChild(saveDiv);
  containerDiv.appendChild(loadDiv);
  generateSaveList();



  return containerDiv;
}
async function deleteSave()
{

  const saveToDelete = this.parentElement.id;
  const code = CONFIG.track.code;
  const data = await chrome.storage.local.get('save');
  delete data.save[code][saveToDelete];
  chrome.storage.local.set({'save':data.save});
  document.querySelectorAll(`[id="${saveToDelete}"]`).forEach((save) => {
    save.remove();
  });


  const dialog =  document.getElementById('myDropdown2');
  if(document.getElementById('saveList').childElementCount == 0)
  {
    dialog.close();
    document.querySelectorAll('.lbutton').forEach((element) => {
      element.className += ' disabled';
    });
  }
  const isSyncEnabled = await chrome.storage.local.get({script:false});
  if(isSyncEnabled.script?.gdrive ?? false){

    const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const token = await getAccessToken();
    if(token != false){
      chrome.runtime.sendMessage({
        type:'deleteFile',
        data:{type:'strategies',track:code,name:saveToDelete},
        token:token.access_token});
    }

  //deleteFile(saveToDelete+'.json',token.access_token);
  }

}
async function saveStint()
{
  const {hashCode} = await import(chrome.runtime.getURL('/strategy/utility.js'));
  const code = CONFIG.track.code;
  const driverStrategy = this.closest('form');
  const raceLaps = driverStrategy.querySelector('[id*=TotalLaps]');
  const tyre = driverStrategy.getElementsByClassName('tyre')[0];
  const fuel = driverStrategy.getElementsByClassName('fuel')[0];
  const push = driverStrategy.querySelector('tr[pushEvent]');
  const tyreStrategy = tyre.querySelectorAll('td[style*="visibility: visible"]');
  const fuelStrategy = fuel.querySelectorAll('td[style*="visibility: visible"]');
  const pushStrategy = push.querySelectorAll('td[style*="visibility: visible"]');

  const saveData = {};
  saveData.stints = {};
  saveData.length = CONFIG.league;
  saveData.track = code;
  saveData.laps = {
    total:Number(raceLaps.nextSibling.textContent.split('/')[1]),
    doing:Number(raceLaps.textContent)
  };
  for(var i = 0; i < tyreStrategy.length; i++)
  {
    saveData.stints[i] = {
      tyre:tyreStrategy[i].className,
      laps:fuelStrategy[i].textContent,
      push:pushStrategy[i].childNodes[0].selectedIndex};
  }
  const s = hashCode(JSON.stringify(saveData));
  const data = await chrome.storage.local.get('save');

  if(typeof data.save === 'undefined')
  {
    chrome.storage.local.set({'save':{[code]:{[s]:saveData}}});
  }
  else
  {
    if(typeof data.save[code] === 'undefined')
    {
      data.save[code] = {[s]:saveData};
    }
    else
      data.save[code][s] = saveData;

    chrome.storage.local.set({'save':data.save});
  }
  document.querySelectorAll('.lbutton').forEach((element) => {
    element.classList.remove('disabled');
  });
  //const list = document.getElementById('myDropdown2');
  //list.classList.remove('show1');

  const isSyncEnabled = await chrome.storage.local.get({script:false});
  if(isSyncEnabled.script?.gdrive ?? false){
    const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
    const token = await getAccessToken();
    if(token != false)
      await chrome.runtime.sendMessage({type: 'saveStrategy',data:{name:s,track:code,strategy:saveData},token:token.access_token});

  }

}
async function loadStint()
{
  const {simulateClick} = await import(chrome.runtime.getURL('/strategy/utility.js'));
  const { fuel_calc} = await import(chrome.runtime.getURL('strategy/strategyMath.js'));
  const code  = CONFIG.track.code;
  const data = await chrome.storage.local.get('save');
  const s = data.save[code][this.parentElement.id];
  const driverStrategy = this.closest('form');
  const pitNum = driverStrategy.querySelector('.num');
  const current_pit_number = pitNum.childNodes[0].textContent;
  //number of stints
  const stints = Object.keys(s.stints).length;

  const difference = (stints - 1) - current_pit_number;
  //replacePitNumber(pitNum,(stints-1))

  //setting the right number of pits
  if(difference < 0)
    for(let i = 0; i < Math.abs(difference); i++) {
      await simulateClick(driverStrategy.querySelector('.minus'));
    }

  if(difference > 0)
    for(let i = 0; i < (difference); i++) {
      await simulateClick(driverStrategy.querySelector('.plus'));
    }

  //getting the rows
  const tyre = driverStrategy.getElementsByClassName('tyre')[0];
  const fuel = driverStrategy.getElementsByClassName('fuel')[0];
  const push = driverStrategy.querySelector('tr[pushEvent]');

  const tyreStrategy = tyre.querySelectorAll('td');
  const fuelStrategy = fuel.querySelectorAll('td');
  const pushStrategy = push.querySelectorAll('td');

  for(let i = 0; i < stints; i++)
  {
    try {
      tyreStrategy[i].lastChild.textContent = s.stints[i].tyre.substring(3);
      tyreStrategy[i].className = s.stints[i].tyre;
      tyreStrategy[i].childNodes[0].value = s.stints[i].tyre.substring(3);
      tyreStrategy[i].setAttribute('data-tyre',s.stints[i].tyre.substring(3));
      fuelStrategy[i].childNodes[0].replaceChild(document.createTextNode(s.stints[i].laps),fuelStrategy[i].childNodes[0].childNodes[0]);
      const fuelkm = fuel_calc(parseInt(document.getElementsByClassName('PLFE')[0].value));
      const fuelWithPush = (((fuelkm + parseFloat(pushStrategy[i].childNodes[0].options[s.stints[i].push].value)) * CONFIG.track.info.length)).toFixed(2);
      fuelStrategy[i].childNodes[1].value = Math.ceil((fuelWithPush * s.stints[i].laps));
      fuelStrategy[i].childNodes[2].value = s.stints[i].laps;
      pushStrategy[i].childNodes[0].selectedIndex = s.stints[i].push;

    } catch (error) {
    }
  }
  const saveBox = driverStrategy.getElementsByClassName('dropdown2-content');
  Object.keys(saveBox).forEach(key=>{
    saveBox[key].close();
  });
}
function dialogClickHandler(e) {
  if (e.target.tagName !== 'DIALOG')
    return;

  const rect = e.target.getBoundingClientRect();

  const clickedInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );

  if (clickedInDialog === false)
    e.target.close();
}
async function generateSaveList () {
  const {strategyPreview} = await import(chrome.runtime.getURL('/strategy/utility.js'));
  return new Promise(function(res){
    const code = CONFIG.track.code;
    chrome.storage.local.get('save',function(data){
      if (typeof data.save === 'undefined') {
        res('empty');
      }else{
        if (typeof data.save[code] === 'undefined') {
          res('empty');
        } else {
          if (Object.keys(data.save[code]).length == 0) {
            console.log('no save');
            document.querySelectorAll('.lbutton').forEach((element) => {
              element.classList.add('disabled');
            });
            res('empty');
          } else {

            //getting total laps. this make possible to get only the strategies that match
            const totalLaps =document.querySelector('[id*=TotalLaps]').nextSibling.textContent.split('/')[1];

            const sLists = document.querySelectorAll('#saveList');
            if (sLists != null)
            sLists.forEach((e) => {e.remove();});
            document.querySelectorAll('.lbutton').forEach((element) => {
              element.classList.remove('disabled');
            });

            const list = document.querySelectorAll('#myDropdown2');
            list.forEach(async (e) => {
              const sList = await strategyPreview(data.save[code],CONFIG.economy,totalLaps);
              if(sList.childElementCount == 0)
              {
                document.querySelectorAll('.lbutton').forEach((element) => {
                  element.classList.add('disabled');
                });
                res('empty');
              }
              else{
                sList.querySelectorAll('.stintsContainer').forEach(strat => {
                strat.classList.add('loadStrat');
                strat.addEventListener('click',loadStint);
              });
              sList.querySelectorAll('.trash').forEach(d => {d.addEventListener('click',deleteSave);});
              e.appendChild(sList);
              res (true);
              }
                
              });
          }
        
        }
      }
    });


  });



}
export{
  addSaveButton
};
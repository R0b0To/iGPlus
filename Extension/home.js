function addExtraButtons() {
  if (document.getElementById('raceReview')) return;
  
  try {
    const previousRaceBtn = document.querySelector('a.btn2.fill-w');
    if(previousRaceBtn){
      previousRaceBtn.classList.remove('fill-w');
      previousRaceBtn.classList.add('home-prev-race'); // need this to not interfere with other .btn2
      previousRaceBtn.removeAttribute('style', ''); // let's drive with css
      previousRaceBtn.after(createdButton('raceReview','d=raceReview','Race Review'));
    }


  } catch (err) {
    console.warn(err);
  }
}
//addExtraButtons();
whenLockedSetup();

function whenLockedSetup(){
  //const raceID = document.getElementById('mRace').href.replace(/^\D+/g, '');
  const is_live = document.getElementById('mRace').classList.contains('live');
  if(is_live)injectLockedShortcuts();
}

async function injectLockedShortcuts(){
  const { fetchNextRace } = await import(chrome.runtime.getURL('./common/fetcher.js'));
  const nextRaceData = await fetchNextRace();
  const setupURL = 'p=race&tab=setup';
  const strategyURL = 'p=race&tab=strategy';
  const raceID =  nextRaceData.nextLeagueRaceId; //document.querySelector('a[href^="p=league&id="]').href.replace(/^\D+/g, '');
  const qualiURL = `d=result&id=${raceID}&tab=qualifying`;
  const carDesignURL = 'd=design';
  const carResearchURL = 'd=research';
  const shortcutsLocation = document.getElementById('race-tile').parentElement;
  shortcutsLocation.classList.add('adapt-row');
  const setupbtn = createdButton('lockedsetup',setupURL,'Setup');
  const strategybtn = createdButton('lockedstrat',strategyURL,'Strategy');
  const qualibtn = createdButton('lockedquali',qualiURL,'Qualifying');
  const researchbtn = createdButton('lockedresearch',carResearchURL,'Research');
  const designbtn = createdButton('lockeddesign',carDesignURL,'Design');
  const container = document.createElement('div');
  [setupbtn,strategybtn,qualibtn,researchbtn,designbtn].forEach(btn => {
    btn.style.flexGrow = 1;
    btn.style.margin = '2px';}
  );
  //container.setAttribute('style','display: flex;justify-content: center;margin-top: 5px;');
  container.classList.add('shortcuts-igp');
  container.append(researchbtn,designbtn,qualibtn,strategybtn);

  if(document.getElementById('lockedstrat') == null)
  {
    shortcutsLocation.insertBefore(container, shortcutsLocation.lastChild)
  }
    

}

function createdButton(id,link,name){
  const btn = document.createElement('a');
  btn.id = id;
  btn.classList.add('btn','pushBtn');
  btn.href = link;
  btn.textContent = name;
  return btn;
}
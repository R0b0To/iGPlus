function addExtraButtons() {
  if (document.getElementById('raceReview')) {
    return;
  }

  try {
    const previousRaceBtn = document.querySelector('a.btn2.fill-w');
    previousRaceBtn.classList.remove('fill-w');
    previousRaceBtn.classList.add('home-prev-race'); // need this to not interfere with other .btn2
    previousRaceBtn.removeAttribute('style', ''); // let's drive with css
    previousRaceBtn.after(createdButton('raceReview','d=raceReview','Race Review'));
    
  } catch (err) {
    console.warn(err);
  }
}

addExtraButtons();whenLockedSetup();


function whenLockedSetup(){
  const raceID = document.getElementById('mRace').href.replace(/^\D+/g, '');
  if(raceID != '')injectLockedShortcuts(raceID);
  
  
  

}
function injectLockedShortcuts(raceID){
  const setupURL = 'p=race&tab=setup';
  const strategyURL = 'p=race&tab=strategy';
  const qualiURL = `d=result&id=${raceID}&tab=qualifying`;
  const shortcutsLocation = document.getElementById('splashPrep');
  
  const setupbtn = createdButton('lockedsetup',setupURL,'Setup');
  const strategybtn = createdButton('lockedstrat',strategyURL,'Strategy');
  const qualibtn = createdButton('lockedquali',qualiURL,'Qualifying');
  const container = document.createElement('div');
  [setupbtn,strategybtn,qualibtn].forEach(btn => {
    btn.style.flexGrow = 1;
    btn.style.margin = '2px';}
    );
  container.setAttribute('style','display: flex;justify-content: center;margin-top: 5px;');

  container.append(setupbtn,strategybtn,qualibtn);

  if(document.getElementById('lockedsetup')==null)
  shortcutsLocation.append(container);

}

function createdButton(id,link,name){
  const btn = document.createElement('a');
  btn.id = id;
  btn.classList.add('btn');
  btn.href = link;
  btn.textContent = name;
  return btn;
}
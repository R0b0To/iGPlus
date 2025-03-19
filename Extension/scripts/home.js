//addExtraButtons();
whenLockedSetup();


async function whenLockedSetup(){
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  //const raceID = document.getElementById('mRace').href.replace(/^\D+/g, '');
  await delay(200);
  //const is_live = document.getElementsByClassName('pulse').length > 0;
  const countdown = document.getElementsByClassName('countdown')[1].textContent;
  const timeLeft = convertToSeconds(countdown);

  if (timeLeft < 600)
    injectLockedShortcuts();
  else {
    setTimeout(injectLockedShortcuts, (timeLeft - 600) * 1000);
  return;
}
}

async function injectLockedShortcuts(){
  const { fetchNextRace } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const {language}  = await chrome.storage.local.get({ language: 'en' });
  const {language: i18n}  = await import(chrome.runtime.getURL('common/localization.js'));
  const nextRaceData = await fetchNextRace();
  const setupURL = 'p=race&tab=setup';
  const strategyURL = 'p=race&tab=strategy';
  const raceID =  nextRaceData.nextLeagueRaceId; //document.querySelector('a[href^="p=league&id="]').href.replace(/^\D+/g, '');
  const qualiURL = `d=result&id=${raceID}&tab=qualifying`;
  const carDesignURL = 'd=design';
  const carResearchURL = 'd=research';
  const shortcutsLocation = document.getElementById('race-tile').parentElement;
  shortcutsLocation.classList.add('adapt-row');
  //const setupbtn = createdButton('lockedsetup',setupURL,i18n[language].shortcuts.strategy);
  const strategybtn = createdButton('lockedstrat',strategyURL,i18n[language].shortcuts.strategy);
  const qualibtn = createdButton('lockedquali',qualiURL,i18n[language].shortcuts.qualifying);
  const researchbtn = createdButton('lockedresearch',carResearchURL,i18n[language].shortcuts.research);
  const designbtn = createdButton('lockeddesign',carDesignURL,i18n[language].shortcuts.design);
  const container = document.createElement('div');
  [strategybtn,qualibtn,researchbtn,designbtn].forEach(btn => {
    btn.style.flexGrow = 1;
    btn.style.margin = '2px';}
  );
  //container.setAttribute('style','display: flex;justify-content: center;margin-top: 5px;');
  container.classList.add('shortcuts-igp');
  container.append(researchbtn,designbtn,qualibtn,strategybtn);

  if(document.getElementById('lockedstrat') == null)
  {
    shortcutsLocation.insertBefore(container, shortcutsLocation.querySelectorAll('.tile')[1])
  }
    

}

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

function createdButton(id,link,name){
  const btn = document.createElement('a');
  btn.id = id;
  btn.classList.add('btn','pushBtn');
  btn.href = link;
  btn.textContent = name;
  return btn;
}
function convertToSeconds(timeString) {
  const timeParts = timeString.match(/(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);

  if (!timeParts) return 999999999999;

  const days = parseInt(timeParts[1] || 0, 10);
  const hours = parseInt(timeParts[2] || 0, 10);
  const minutes = parseInt(timeParts[3] || 0, 10);
  const seconds = parseInt(timeParts[4] || 0, 10);

  return (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
}

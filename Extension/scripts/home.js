//addExtraButtons();
whenLockedSetup();


async function whenLockedSetup(){
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  //const raceID = document.getElementById('mRace').href.replace(/^\D+/g, '');
  await delay(500);
  //const is_live = document.getElementsByClassName('pulse').length > 0;
  const countdown = document.getElementsByClassName('countdown')[1].textContent;
  const timeLeft = convertToSeconds(countdown);

  if (timeLeft < 600)
    enableStrategy();
  else {
    setTimeout(enableStrategy, (timeLeft - 600) * 1000);
  return;
}
}

async function enableStrategy(){

 const strategyButton = document.getElementById('shortHandStandings').parentElement.parentElement.querySelector('a[href="p=race"]');
 strategyButton.classList.remove('disabled');
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

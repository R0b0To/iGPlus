(async () => {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200) // sleep a bit, while page loads
  await startHealthMonitor();
})();

async function startHealthMonitor() {
  // green bar -> 100% healthy to the race
  // yellow (.healthWarn) -> 85% to 100% health at the race time
  // red (.healthAlert) -> less than 85% health at the race time
  const healthClasses = ['green', 'healthWarn', 'healthAlert'];
  const padValue = (val) => `${val}`.padStart(2, '0');

  function getRatingBarElements(tableElement) {
    return Array.from(tableElement.querySelectorAll('tbody > tr')).map(tr => tr.querySelector('.ratingBar > div'));
  }

  // If drivers are not found error is invoked stopping executing the task any further
  const trainTable = document.getElementById('dTrainTable');
  const pitCrewTable = document.getElementById('pcTrainTable');
  //const staff = document.querySelectorAll(...healthClasses.map((name) => `.ratingBar.${name} > div`));
  const staff = getRatingBarElements(trainTable);
  const pitCrew = getRatingBarElements(pitCrewTable);
  const { fetchNextRace } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const nextRaceData = await fetchNextRace();
  const noticeDiv = document.querySelectorAll('div.shrinkText');
  
  if (nextRaceData && !noticeDiv[2].querySelectorAll('span').length) {
    const raceDate = new Date(nextRaceData.nextLeagueRaceTime * 1000);
    const raceTme = `${padValue(raceDate.getHours())}:${padValue(raceDate.getMinutes())}`;
    const raceDay = raceDate.getDate() === (new Date).getDate() ? 'today' : `in ${((raceDate.getTime()-(new Date).getTime())/ (1000 * 60 * 60 * 24)).toFixed(1)} days`;

    const healthNotice = document.createElement('span');
    healthNotice.innerText = `${noticeDiv[2].textContent}.`;

    const nextRaceNotice = document.createElement('div');
    const nextRace_text = document.createElement('span');
    const nextRace_date = document.createElement('span');
    nextRace_date.classList.add('date-highlight');
    nextRaceNotice.append(nextRace_text,nextRace_date);
    nextRace_text.textContent = `\n Next race: ${raceDay} at `;
    nextRace_date.textContent = raceTme;

    noticeDiv[2].replaceChildren(healthNotice, nextRaceNotice);
    //noticeDiv[1].replaceChildren(healthNotice.cloneNode(true), nextRaceNotice.cloneNode(true));
  }

  // reset custom health colors before updating current health states
  function resetHealthColors(elements) {
    elements.forEach((d) => {
      d.parentElement.classList.remove('healthWarn', 'healthAlert');
      d.parentElement.classList.add('green');
    });
  }

  resetHealthColors(staff);
  resetHealthColors(pitCrew);

  const healthObserver = new MutationObserver(function (_mutations) {
    checkTimeToFullHealthForElements(staff);
    checkTimeToFullHealthForElements(pitCrew);
  });

  /**
   * This observer will observe mutations on the width of the health indicator
   */
  function monitorHealth(elements) {
    elements.forEach((element) => {
      healthObserver.observe(element, { attributes: true, attributeFilter: ['style'] });
    });
  }

  /**
   * Health regenerates 5% each time new hour starts (first minute of the next hour)
   */
  function checkTimeToFullHealthForElements(elements) {
    elements.forEach((element) => {
      const health = parseInt(element.style.width);

      const hoursToFull = Math.ceil((100 - health) / 5);
      const fullDate = new Date(Date.now() + 3600_000 * hoursToFull);

      // highlight healthbar depending on the next race time & estimated health to that moment
      
      const dateString = `~${padValue(fullDate.getHours())}:01`;
      const health_at_race_time = Math.max(0, Math.min(100, Math.floor(100 - (fullDate - nextRaceData.nextLeagueRaceTime * 1000) / 3600_000 * 5)));
      const healthText = health < 100  ? `${dateString} ${health_at_race_time > 0 ? `(${health_at_race_time}%)` : ''}`
    : '100%';
      const healthBarCell = element.closest('td');
     
      
      let estimatedHealTimeCell;
      if (element.closest('tr').querySelectorAll('[id=dateTd]').length == 0) {
        date_span = document.createElement('span');
        date_span.classList.add('training-date');
        // works when you refresh the page
        estimatedHealTimeCell = document.createElement('td');
        estimatedHealTimeCell.id = 'dateTd';
        estimatedHealTimeCell.append(date_span);
        healthBarCell.parentElement.insertBefore(estimatedHealTimeCell, healthBarCell);
      } else {
        // works when you train a driver and the health has to be updated
        estimatedHealTimeCell = element.closest('tr').querySelector('#dateTd');
      }
        date_span = element.closest('tr').querySelector('.training-date');
        date_span.textContent = healthText;
        if (nextRaceData) {
          const hoursDiff = (fullDate - nextRaceData.nextLeagueRaceTime * 1000) / 3600_000;
          date_span.classList.remove(...healthClasses);
          if (hoursDiff > 0) {
            const alertClass = hoursDiff < 3 ? healthClasses[1] : healthClasses[2];
            date_span.classList.add(alertClass);
            element.classList.remove(...healthClasses);
            element.classList.remove(...healthClasses);
            element.classList.add(alertClass);
          }

        }
    });
  }

  function addHeader() {
    if (document.querySelectorAll("[id=dateHeader]").length == 0) {
      const iconUrl = chrome.runtime.getURL('images/calendar-check-regular.svg');
      const image = document.createElement('img');
      image.src = iconUrl;
      image.style.width = "1.6em";
      const header = document.createElement('th');
      header.id = 'dateHeader';

      header.append(image);
      trainTable.tHead.rows[0].insertBefore(header, trainTable.tHead.rows[0].cells[4]);
      pitCrewTable.tHead.rows[0].insertBefore(header.cloneNode(true), pitCrewTable.tHead.rows[0].cells[3]);
    }
  }

  addHeader(); // makes sense to add it anyway?
  monitorHealth(staff);
  monitorHealth(pitCrew);
  checkTimeToFullHealthForElements(staff);
  checkTimeToFullHealthForElements(pitCrew);
}



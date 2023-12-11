async function startHealthMonitor() {
  // green bar -> 100% healthy to the race
  // yellow (.healthWarn) -> 85% to 100% health at the race time
  // red (.healthAlert) -> less than 85% health at the race time
  const healthClasses = ['green', 'healthWarn', 'healthAlert'];
  const padValue = (val) => `${val}`.padStart(2, '0');

  // If drivers are not found error is invoked stopping executing the task any further
  const trainTable = document.getElementById('dTrainTable');
  const pitCrewTable = document.getElementById('pcTrainTable');
  const staff = document.querySelectorAll(...healthClasses.map((name) => `.ratingBar.${name} > div`));
  const { fetchNextRace } = await import(chrome.runtime.getURL('./common/fetcher.js'));
  const nextRaceData = await fetchNextRace();
  const noticeDiv = document.querySelectorAll('div.darkgrey.shrinkText');
  
  if (nextRaceData && !noticeDiv[0].querySelectorAll('span').length) {
    const raceDate = new Date(nextRaceData.nextLeagueRaceTime * 1000);
    const raceTme = `${padValue(raceDate.getHours())}:${padValue(raceDate.getMinutes())}`;
    const raceDay = raceDate.getDate() === (new Date).getDate() ? 'today' : `in ${((raceDate.getTime()-(new Date).getTime())/ (1000 * 60 * 60 * 24)).toFixed(1)} days`;

    const healthNotice = document.createElement('span');
    healthNotice.innerText = `${noticeDiv[0].textContent}.`;

    const nextRaceNotice = document.createElement('span');
    nextRaceNotice.innerText = `\n Next race: ${raceDay} at ${raceTme}`;

    noticeDiv[0].replaceChildren(healthNotice, nextRaceNotice);
    noticeDiv[1].replaceChildren(healthNotice.cloneNode(true), nextRaceNotice.cloneNode(true));
  }

  // reset custom health colors before updating current health states
  staff.forEach((d) => {
    d.parentElement.classList.remove('healthWarn', 'healthAlert');
    d.parentElement.classList.add('green');
  });


  const healthObserver = new MutationObserver(function (_mutations) {
    checkTimeToFullHealth();
  });

  /**
   * This observer will observe mutations on the width of the health indicator
   */
  function monitorDriversHealth() {
    staff.forEach((driver) => {
      healthObserver.observe(driver, { attributes: true, attributeFilter: ['style'] });
    });
  }

  /**
   * Health regenerates 5% each time new hour starts (first minute of the next hour)
   */
  function checkTimeToFullHealth() {
    staff.forEach((driver) => {
      const health = parseInt(driver.style.width);

      const hoursToFull = Math.ceil((100 - health) / 5);
      const fullDate = new Date(Date.now() + 3600_000 * hoursToFull);

      // highlight healthbar depending on the next race time & estimated health to that moment
      if (nextRaceData) {
        const hoursDiff = (fullDate - nextRaceData.nextLeagueRaceTime * 1000) / 3600_000;
        if (hoursDiff > 0) {
          const alertClass = hoursDiff < 3 ? healthClasses[1] : healthClasses[2];
          driver.parentElement.classList.remove(...healthClasses);
          driver.parentElement.classList.add(alertClass);
        }
      }
      const dateString = `~${padValue(fullDate.getHours())}:01`;
      const healthText = health < 100 ? dateString : '';

      const healthBarCell = driver.closest('td');
      let estimatedHealTimeCell;
      if (driver.closest('tr').querySelectorAll('[id=dateTd]').length == 0) {
        // works when you refresh the page
        estimatedHealTimeCell = document.createElement('td');
        estimatedHealTimeCell.id = 'dateTd';

        healthBarCell.parentElement.insertBefore(estimatedHealTimeCell, healthBarCell);
      } else {
        // works when you train a driver and the health has to be updated
        estimatedHealTimeCell = driver.closest('tr').querySelector('#dateTd');
      }

      estimatedHealTimeCell.textContent = healthText;
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
  monitorDriversHealth();
  checkTimeToFullHealth();
}

// TODO move to separate retry module?
(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
      await startHealthMonitor();
      break;
    } catch (err) {
      //console.log(`Retry to start health monitoring #${i + 1}/3`);
    }
  }
})();

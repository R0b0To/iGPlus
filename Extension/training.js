async function startHealthMonitor() {
  
  //If drivers are not found error is invoked stopping executing the task any further
  const trainTable = document.getElementById('trainTable');
  const drivers = trainTable.querySelectorAll('.ratingBar.green > div, .ratingBar.healthWarn > div, .ratingBar.healthAlert > div');
  const padValue = (val) => `${val}`.padStart(2, '0');

  const { fetchNextRace } = await import(chrome.runtime.getURL('./common/fetcher.js'));
  const nextRaceData = await fetchNextRace();
  
  if (nextRaceData) {
    const raceDate = new Date(nextRaceData.nextLeagueRaceTime * 1000);
    const raceTme = `${padValue(raceDate.getHours())}:${padValue(raceDate.getMinutes())}`;
    const raceDay = raceDate.getDate() === (new Date).getDate() ? 'today' : 'tomorrow';

    const noticeDiv = document.querySelector('div.notice');

    const healthNotice = document.createElement('span');
    healthNotice.innerText = `${noticeDiv.textContent}.`;

    const nextRaceNotice = document.createElement('span');
    nextRaceNotice.innerText = `Next race: ${raceDay} at ${raceTme}`;

    noticeDiv.replaceChildren(healthNotice, nextRaceNotice);
  }

  drivers.forEach((d) => {
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
    drivers.forEach((driver) => {
      healthObserver.observe(driver, { attributes: true, attributeFilter: ['style'] });
    });
  }

  /**
   * Health regenerates 5% each time new hour starts (first minute of the next hour)
   */
  function checkTimeToFullHealth() {
    drivers.forEach((driver) => {
      const health = parseInt(driver.style.width);

      const hoursToFull = Math.ceil((100 - health) / 5);
      const fullDate = new Date(Date.now() + 3600_000 * hoursToFull);

      // highlight healthbar depending on the next race time & estimated health to that moment
      if (nextRaceData) {
        const hoursDiff = (fullDate - nextRaceData.nextLeagueRaceTime * 1000) / 3600_000;
        if (hoursDiff > 0) {
          const alertClass = hoursDiff < 3 ? 'healthWarn' : 'healthAlert';
          driver.parentElement.classList.remove('green', 'healthWarn', 'healthAlert');
          driver.classList.add(alertClass);
        }
      }

      const dateString = `~${padValue(fullDate.getHours())}:01`;
      const healthText = health < 100 ? dateString : '';

      const healthBarCell = driver.closest('td');
      let estimatedHealTimeCell;

      if (driver.closest('tr').cells.length < 7) {
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
    if (document.getElementById('dateHeader') == null) {
      const iconUrl = chrome.runtime.getURL('images/calendar-check-regular.svg');
      const image = document.createElement('img');
      image.src = iconUrl;

      const header = document.createElement('th');
      header.id = 'dateHeader';

      header.append(image);
      trainTable.tHead.rows[0].insertBefore(header, trainTable.tHead.rows[0].cells[4]);
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
      console.warn(`Retry to start health monitoring #${i + 1}/3`);
    }
  }
})();

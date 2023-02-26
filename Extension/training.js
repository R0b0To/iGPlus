function startHealthMonitor() {
  const padValue = (val) => `${val}`.padStart(2, '0');

  const trainTable = document.getElementById('trainTable');
  const drivers = trainTable.querySelectorAll('.green > div');

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

      // TODO the game considers a driver is healthy approx at 80%, not 100%. Move to config?
      const hoursToFull = Math.ceil((100 - health) / 5);

      const fullDate = new Date(Date.now() + 3600_000 * hoursToFull);
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
      startHealthMonitor();
      break;
    } catch (err) {
      console.warn(`Retry to start health monitoring #${i + 1}/3`);
    }
  }
})();

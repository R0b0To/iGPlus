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

      // TODO the game considers a driver is healthy approx at 80%
      const hoursToFull = Math.ceil((100 - health) / 5);

      const fullDate = new Date(Date.now() + 3600_000 * hoursToFull);
      const dateString = `~${padValue(fullDate.getHours())}:01`;

      const healthbarCell = driver.closest('td');
      if (driver.closest('tr').cells.length < 7) {
        const dateTd = document.createElement('td');
        dateTd.id = 'dateTd';
        dateTd.textContent = health < 100 ? dateString : '';

        healthbarCell.parentElement.insertBefore(dateTd, healthbarCell);
      }
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

try {
  startHealthMonitor.initAttempts = 0;
  startHealthMonitor();
} catch (err) {
  if (startHealthMonitor.initAttempts < 3) {
    startHealthMonitor.initAttempts += 1;
    console.warn(`Retry to start health monitoring #${startHealthMonitor.initAttempts}/3`);
    setTimeout(startHealthMonitor, 500);
  } else {
    console.error('Cannot init health monitoring', err);
  }
}

(async () => {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200);
  await startHealthMonitor();
})();

async function startHealthMonitor() {
  const { fetchNextRace } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const nextRaceData = await fetchNextRace();

  if (!nextRaceData) return;

  const healthClasses = ['green', 'healthWarn', 'healthAlert'];
  const padValue = (val) => `${val}`.padStart(2, '0');
  const raceTimeMs = nextRaceData.nextLeagueRaceTime * 1000;
  const hoursUntilRace = (raceTimeMs - Date.now()) / 3600_000;

  function getHealthAtRaceTime(currentHealth, regenerationRate) {
    return Math.max(0, Math.min(100, currentHealth + hoursUntilRace * regenerationRate));
  }

  function updateHealthBars(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const bars = container.querySelectorAll('.trainingPreviewBar-health');
    bars.forEach(bar => {
      const current = Number(bar.dataset.current);
      const regen = Number(bar.dataset.previewGain);
      const estimated = getHealthAtRaceTime(current, regen);

      let projectionBar = bar.querySelector('.trainingProjectionBar');
      if (!projectionBar) {
        projectionBar = document.createElement('div');
        projectionBar.className = 'trainingProjectionBar';
        bar.appendChild(projectionBar);

        const label = document.createElement('span');
        label.className = 'trainingProjectionLabel';
        projectionBar.appendChild(label);
      }

      const projectionPercent = Math.max(0, Math.min(100, estimated));
      projectionBar.style.width = `calc(${projectionPercent}% - ${projectionPercent > 0 ? (projectionPercent / 20) + 'px' : '0'})`;

      const label = projectionBar.querySelector('.trainingProjectionLabel');
      label.textContent = `${Math.round(estimated)}%`;
    });
  }

  function setupMutationObserver() {
    const observer = new MutationObserver(() => {
      updateHealthBars('drivers');
      updateHealthBars('pitcrew');
    });

    const drivers = document.getElementById('drivers');
    const pitcrew = document.getElementById('pitcrew');
    if (drivers) observer.observe(drivers, { subtree: true, attributes: true, attributeFilter: ['data-current', 'data-preview-gain'] });
    if (pitcrew) observer.observe(pitcrew, { subtree: true, attributes: true, attributeFilter: ['data-current', 'data-preview-gain'] });
  }

  updateHealthBars('drivers');
  updateHealthBars('pitcrew');
  setupMutationObserver();
}



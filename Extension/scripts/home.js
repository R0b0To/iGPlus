//addExtraButtons();
whenLockedSetup();


async function whenLockedSetup() {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  const { safeQuery } = await import(chrome.runtime.getURL('common/safeQuery.js'));

  await delay(500);

  const countdownEl = safeQuery('.countdown', 'home: race countdown');
  if (!countdownEl) return;

  const timeLeft = convertToSeconds(countdownEl.textContent);

  if (timeLeft < 600) {
    enableStrategy();
  } else {
    setTimeout(enableStrategy, (timeLeft - 600) * 1000);
  }
}

async function enableStrategy() {
  const { safeQuery } = await import(chrome.runtime.getURL('common/safeQuery.js'));
  const strategyButton = safeQuery('a[href="p=race"]', 'home: strategy button');
  if (!strategyButton) return;
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
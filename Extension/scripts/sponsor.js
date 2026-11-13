(async () => {
  const { safeQuery } = await import(chrome.runtime.getURL('common/safeQuery.js'));

  for (let i = 0; i < 3; i += 1) {
    const table = safeQuery('#sponsorSignTable', `sponsor: sign table (attempt ${i + 1}/3)`);
    if (table) {
      table.classList.add('tflip');
      return;
    }
    await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
  }

  console.warn('iGPlus [sponsor]: gave up waiting for #sponsorSignTable after 3 attempts.');
})();
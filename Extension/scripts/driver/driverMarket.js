(async () => {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200);
  await displayDriver();
})();

async function displayDriver() {
  const table = document.getElementById('driver-table') ?? false;
  if (table == false) return;

  const [
    { createSpecialSkillLabel },
    { makeSortHandler },
    { DRIVER_FIELD }
  ] = await Promise.all([
    import(chrome.runtime.getURL('scripts/driver/driverHelpers.js')),
    import(chrome.runtime.getURL('common/tableSort.js')),
    import(chrome.runtime.getURL('common/driverFields.js'))
  ]);

  addTalent();

  function addTalent() {
    console.log(DRIVER_FIELD);
    if (document.getElementById('talent') == null) {
      const thead = table.tHead.rows[0];
      const talent = document.createElement('th');
      talent.addEventListener('click', makeSortHandler(() => table.tBodies[0]));
      talent.innerHTML = '<svg style=\'width:24px\' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M16 0H144c5.3 0 10.3 2.7 13.3 7.1l81.1 121.6c-49.5 4.1-94 25.6-127.6 58.3L2.7 24.9C-.6 20-.9 13.7 1.9 8.5S10.1 0 16 0zM509.3 24.9L401.2 187.1c-33.5-32.7-78.1-54.2-127.6-58.3L354.7 7.1c3-4.5 8-7.1 13.3-7.1H496c5.9 0 11.3 3.2 14.1 8.5s2.5 11.5-.8 16.4zM432 336c0 97.2-78.8 176-176 176s-176-78.8-176-176s78.8-176 176-176s176 78.8 176 176zM264.4 241.1c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z"/></svg>';
      talent.className = 'sortBy hover pointer';
      talent.setAttribute('style', 'width:7%');
      thead.insertBefore(talent, thead.childNodes[4]);
      talent.id = 'talent';
    }

    if (document.getElementById('talentRow') == null) {
      const body = table.tBodies[0];
      for (let i = 0; i < body.rows.length; i++) {
        const tEle = document.createElement('td');
        tEle.id = 'talentRow';
        const stats = body.rows[i].querySelector('.hoverData').dataset;

        // DRIVER_FIELD.talent (index 1) — named instead of magic number
        const talentValue = stats.driver.split(',')[DRIVER_FIELD.talent];
        const skill = {
          grade: /'(.*)'/.exec(stats.append)[1].slice(0, -1),
          name: />(.*)<\//.exec(stats.append)?.[1] ?? ''
        };

        tEle.textContent = talentValue;
        tEle.append(createSpecialSkillLabel(skill));
        body.rows[i].insertBefore(tEle, body.rows[i].childNodes[2]);
      }
    }
  }
}
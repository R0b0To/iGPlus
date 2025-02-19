// TODO move to separate retry module?
(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      console.log('running?')
      await new Promise((res) => setTimeout(res, 300)); // sleep a bit
      addStaffSkillLabels();
      break;
    } catch (err) {
      console.warn(`Retry to fetch skill labels #${i + 1}/3`);
    }
  }
})();

async function addStaffSkillLabels() {
  /** @type HTMLTBodyElement[] */
  const staffTable = document.querySelector('#dialogs-container form table tbody');
  const { fetchStaffInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const { createSkillLabel, parseSkills } = await import(chrome.runtime.getURL('scripts/staff/helpers.js'));
  
  function filterTableRows(rowCollection) {
    const CDNames = ['CD','JD','LE','DC','CC','HO','gł. inż.','KD','VT','ГК','PS','BT','رئيس مصممين','수석 디자이너','光盘'];
    return Array.from(rowCollection).filter(row => {
        const cell = row.cells[3];
        return cell && CDNames.some(cdName => cell.textContent.includes(cdName));
    });
}

  const cd_rows = filterTableRows(staffTable.rows)

  await Promise.all(
    [...cd_rows].map(async (row) => {
      const personId = row.querySelector('input').value;
      const data = await fetchStaffInfo(personId);
      const { strength, weakness } = parseSkills(data);
      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper','opt');
      wrapper.append(createSkillLabel(strength, 'strength'), createSkillLabel(weakness, 'weakness'));

      row.cells[2].append(wrapper);
    })
  );
}



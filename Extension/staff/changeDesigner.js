async function addStaffSkillLabels() {
  /** @type HTMLTBodyElement[] */
  const staffTable = document.querySelector('#dialogs-container form table tbody');

  const { fetchStaffInfo } = await import('../common/fetcher.js');
  const { createSkillLabel, parseSkills } = await import('./helpers.js');

  await Promise.all(
    [...staffTable.rows].map(async (row) => {
      const personId = row.querySelector('input').value;
      const data = await fetchStaffInfo(personId);
      const { strength, weakness } = parseSkills(data);

      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper');
      wrapper.append(createSkillLabel(strength, 'strength'), createSkillLabel(weakness, 'weakness'));

      row.childNodes[0].appendChild(wrapper);
    })
  );
}

// TODO move to separate retry module?
(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 300)); // sleep a bit
      addStaffSkillLabels();
      break;
    } catch (err) {
      console.warn(`Retry to fetch skill labels #${i + 1}/3`);
    }
  }
})();

async function displaySkill() {
  const { createSkillLabel, parseSkills} = await import(chrome.runtime.getURL('scripts/staff/helpers.js'));
  const { fetchStaffInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));

  const staffDiv = document.getElementById('staff');
  await Promise.all([addActiveDesignerSkills(), addReserveStaffSkills()]);

  async function addActiveDesignerSkills() {
    /** @type HTMLAnchorElement */
    
    //const activeChiefDesigner = staffDiv.querySelector('.hoverData')//staffDiv.querySelector('div.staff-profile a.linkParent');
    
    const active_CD = staffDiv.querySelector('.hover a');
    const id_activeCD = new URLSearchParams(active_CD.href).get('id');
    const data = await fetchStaffInfo(id_activeCD);
    const { strengthText, weaknessText } = parseSkills(data);
    //const {strength, weakness} = parseAppend(activeChiefDesigner.dataset.append);

    //const cdHeader = activeChiefDesigner.closest('div');
    const cdHeader = active_CD.closest('div');

    // adding strength for active designer
    if (cdHeader.childElementCount === 4) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper');
      wrapper.style.position = 'relative';
      wrapper.append(createSkillLabel(strengthText, 'strength'), createSkillLabel(weaknessText, 'weakness'));
      cdHeader.append(wrapper);
    }
  }

function parseAppend(append){
  const fragmentToParse = document.createElement('table');
  fragmentToParse.innerHTML = append;
  const skills = fragmentToParse.querySelectorAll('icon');
  const strength = skills[0].textContent;
  const weakness = skills[1].textContent;
  return {strength,weakness}
}

  async function addReserveStaffSkills() {
    /** @type HTMLTBodyElement */
    const reserveStaffTable = document.getElementById('reserveStaff');
    const reserveStaff = reserveStaffTable.tBodies[0];
    for (let i = 0; i < reserveStaff.rows.length; i += 1) {
      try {
        const {strength, weakness} = parseAppend(reserveStaff.rows[i].cells[2].dataset.append);
      
      if (reserveStaff.rows[i].cells[1].childElementCount == 2 && strength) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('skillWrapper','opt');
        wrapper.append(createSkillLabel(strength, 'strength'),createSkillLabel(weakness, 'weakness'))
        reserveStaff.rows[i].cells[1].append(wrapper);

      }
      } catch (error) {
        //console.error('Error parsing reserve staff skills:', error);
      }
      
    }
  }
};


(async () => {
  for (let i = 0; i < 2; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
      await displaySkill();
      break;
    } catch (err) {
      //console.warn(`Retry ${i + 1}/3`);
    }
  }
})();
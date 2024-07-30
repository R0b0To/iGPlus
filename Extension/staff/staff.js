(async () => {
  const { createSkillLabel} = await import(chrome.runtime.getURL('/staff/helpers.js'));

  const staffDiv = document.getElementById('staff');

  await Promise.all([addActiveDesignerSkills(), addReserveStaffSkills()]);

  async function addActiveDesignerSkills() {
    /** @type HTMLAnchorElement */
    const activeChiefDesigner = staffDiv.querySelector('.hoverData')//staffDiv.querySelector('div.staff-profile a.linkParent');
    
    const {strength, weakness} = parseAppend(activeChiefDesigner.dataset.append);
    console.log(strength, weakness)
    
    const cdHeader = activeChiefDesigner.closest('div');
    console.log(cdHeader)

    // adding strength for active designer
    if (cdHeader.childElementCount === 2) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper');
      wrapper.append(createSkillLabel(strength, 'strength'), createSkillLabel(weakness, 'weakness'));
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
    const reserveStaff = staffDiv.lastChild.querySelector('tbody');

    for (let i = 0; i < reserveStaff.rows.length; i += 1) {
    
      const {strength, weakness} = parseAppend(reserveStaff.rows[i].cells[2].dataset.append);
      
      if (reserveStaff.rows[i].childNodes[0].childElementCount == 3 && strength) {
        reserveStaff.rows[i].childNodes[0].append(createSkillLabel(strength, 'strength'),createSkillLabel(weakness, 'weakness'));

      }
    }
  }
})();

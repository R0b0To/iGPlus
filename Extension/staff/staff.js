(async () => {
  const { fetchStaffInfo } = await import(chrome.runtime.getURL('/common/fetcher.js'));
  const { createSkillLabel, parseSkills } = await import(chrome.runtime.getURL('/staff/helpers.js'));

  const staffDiv = document.getElementById('staff');

  await Promise.all([addActiveDesignerSkills(), addReserveStaffSkills()]);

  async function addActiveDesignerSkills() {
    /** @type HTMLAnchorElement */
    const activeChiefDesigner = staffDiv.querySelector('div.staff-profile a.linkParent');
    const designerParams = new URLSearchParams(activeChiefDesigner.pathname.replace('/app/', '?'));
    const personId = designerParams.get('id');

    const personData = await fetchStaffInfo(personId);
    const { strength, weakness } = parseSkills(personData);

    // adding strength for active designer
    if (activeChiefDesigner.parentElement.childElementCount === 3) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper');
      wrapper.append(createSkillLabel(strength, 'strength'), createSkillLabel(weakness, 'weakness'));
      activeChiefDesigner.parentElement.append(wrapper);
    }
  }

  async function addReserveStaffSkills() {
    /** @type HTMLTBodyElement */
    const reserveStaff = staffDiv.childNodes[3].querySelector('tbody');

    for (let i = 0; i < reserveStaff.rows.length; i += 1) {
      // TODO test with someone in reserve
      // const staffId = reserveStaff.rows[i].childNodes[0].childNodes[0].href.match(/\d+/)[0];
      // staffUrl = 'https://igpmanager.com/index.php?action=fetch&d=staff&id=' + staffId + '&csrfName=&csrfToken=';

      const personParams = new URLSearchParams(reserveStaff.rows[i].childNodes[0].childNodes[0].pathname.replace('/app/', '?'));
      const personId = personParams.get('id');

      const data = await fetchStaffInfo(personId);
      const { strength, weakness } = parseSkills(data);

      if (reserveStaff.rows[i].childNodes[0].childElementCount == 3 && strength) {
        reserveStaff.rows[i].childNodes[0].appendChild(createSkillLabel(strength, 'strength'));

        // TODO see if required with wrapper? Need to add weakness?
        // const wrapper = document.createElement('div');
        // wrapper.classList.add('skillWrapper');
        // wrapper.append(
        //   createSkillLabel(strength, 'strength'),
        //   createSkillLabel(weakness, 'weakness')
        // )
      }
    }
  }
})();

(async () => {
  const { createSkillLabel} = await import(chrome.runtime.getURL('/staff/helpers.js'));
  Promise.all([getCDStaffDiv()]);
  const tableStaffObserver = new MutationObserver(function (_mutations) {getCDStaffDiv();});

  //observing change in the table istead of the timer because of the irregular server response time
  tableStaffObserver.observe(document.getElementById('staff-table'), { childList: true, subtree: true });

  async function addDesignerSkills(staffDiv) {
    /** @type HTMLAnchorElement */
    const fragmentToParse = document.createElement('table');
    fragmentToParse.innerHTML = staffDiv.nextElementSibling.dataset.append;
    const skills = fragmentToParse.querySelectorAll('icon');
    const strength = skills[0].textContent;
    const weakness = skills[1].textContent;

    // adding strength for designer
    if (staffDiv.childElementCount === 0) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('skillWrapper');
      wrapper.append(createSkillLabel(strength, 'strength'), createSkillLabel(weakness, 'weakness'));
      staffDiv.append(wrapper);
    }
  }
  function getCDStaffDiv(){

    const  CDNames = ['CD','JD','LE','DC','CC','HO','gł. inż.','KD','VT','ГК','PS','BT','رئيس مصممين','수석 디자이너','光盘'];

    //continue only on first page load or countdown refresh. Meaning the staff rows doesn't have the labels
    if(document.getElementsByClassName('skillWrapper').length == 0 )
    {
      for (let i = 0; i < CDNames.length; i++) {
        const name = CDNames[i];
        const elements = document.querySelectorAll(`[data-sort="${name}"]`);

        if (elements.length > 0) {
          elements.forEach((cdStaff)=>addDesignerSkills(cdStaff));
          break; //stop looking for correct CD language
        }
      }
    }
  }
})();

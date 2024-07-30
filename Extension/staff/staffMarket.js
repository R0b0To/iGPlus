async function displayStaff(){
  const { createSkillLabel} = await import(chrome.runtime.getURL('/staff/helpers.js'));
  Promise.all([getCDStaffDiv(),getTDStaffDiv()]);
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
      wrapper.style.display = "inline-flex";
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

  async function getTDStaffDiv(){
    const { fetchStaffInfo } = await import(chrome.runtime.getURL('/common/fetcher.js'));
    const { createSpecialSkillLabel } = await import(chrome.runtime.getURL('/driver/driverHelpers.js'));

    async function addTDSkills(staffDiv,skill) {
      const skillspan = createSpecialSkillLabel(skill)
      // adding strength for designer
      if (staffDiv.childElementCount === 0) {
        staffDiv.append(skillspan);
      }
    }
    const  TDNames = ['TD','TC','DT','TI','ТД','PI','مديرٌ فني','기술 책임자 ','道明'];

      for (let i = 0; i < TDNames.length; i++) {
        const name = TDNames[i];
        const elements = document.querySelectorAll(`[data-sort="${name}"]`);

        if (elements.length > 0) {
          elements.forEach(async (tdStaff)=>{

            if(!tdStaff.classList.contains('checked_skill')){
              const td_id =  new URLSearchParams(tdStaff.closest('tr').querySelector('a').pathname.replace('/app/', '?')).get('id');
              const personData = await fetchStaffInfo(td_id);
              const skill = parseTD_skills(personData);
              //dont add if td doesnt have skill
              if(skill!= false)
              addTDSkills(tdStaff,skill)
              
              //add a placeholder as class to tell if the TD was already requested/checked
              tdStaff.classList.add("checked_skill");
              
            }

            
          });
          break; //stop looking for correct CD language
        }
      }
    
  }
};


function parseTD_skills(td_data){
  const pattern = /class='([^'\s]*)[^']*'[^>]*data-tip='([^']*)'>([^<]*)<\/span>/;
  const special = td_data.vars.sSpecial;
  const matches = special.match(pattern);
  if (matches) {
    const grade = matches[1];
    const dataTipValue = matches[2];
    const name = matches[3];
    return {name,grade}
    
  } else {
    return false
  }
}




(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
      await displayStaff();
      break;
    } catch (err) {
      console.warn(`Retry ${i + 1}/3`);
    }
  }
})();
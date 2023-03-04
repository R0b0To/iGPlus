function convertToSeconds(time) {
  const parts = time.split('m ') ;
  if (parts.length === 1) {
    return parseInt(parts[0].slice(0, -1), 10) ;
  } else {
    const [minutes, seconds] = parts ;
    return (parseInt(minutes, 10) * 60 + parseInt(seconds.slice(0, -1), 10))*1000 ;
  }
}

(async () => {
  const { fetchStaffInfo } = await import(chrome.runtime.getURL('/common/fetcher.js'));
  const { createSkillLabel, parseSkills } = await import(chrome.runtime.getURL('/staff/helpers.js'));

  (async function addLabels(){
    try {
      let contDowntime = document.getElementById('cdTransfersRefresh').textContent;
      //after timer runs out page doesn't load immediately, adding half second extra before running the script again
      let timeToAddLabelsAgain = convertToSeconds(contDowntime) + 500;
      //in case the page didn't load new CDs in time the function will keep trying every 0.5 sec
      setTimeout(addLabels, timeToAddLabelsAgain);
      await Promise.all([getCDStaffDiv()]);

    }catch (error) {}
  })();


  async function addDesignerSkills(staffDiv) {
    /** @type HTMLAnchorElement */
    const chiefDesigner = staffDiv.previousSibling.querySelector('a');
    const designerParams = new URLSearchParams(chiefDesigner.pathname.replace('/app/', '?'));
    const personId = designerParams.get('id');

    const personData = await fetchStaffInfo(personId);
    const { strength, weakness } = parseSkills(personData);

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

    for (let i = 0; i < CDNames.length; i++) {

      const name = CDNames[i];
      const elements = document.querySelectorAll(`[data-sort="${name}"]`);

      if (elements.length > 0) {
        elements.forEach((cdStaff)=>addDesignerSkills(cdStaff));
        break; //stop looking for correct CD language
      }
    }
  }
})();

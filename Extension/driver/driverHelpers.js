/**
   *
   * @param {Object} personData
   * @param {Object} personData.vars
   * @param {Object} personData.vars.sSpecial
   * @returns {{ skill: string|null, grade: string|null }}
   */
function parseSpecialSkill(personData) {
  const fragmentToParse = document.createElement('table');
  fragmentToParse.innerHTML = personData.vars.sSpecial;

  const skill = fragmentToParse.querySelector('span')?.textContent || null;
  //const gradeText = fragmentToParse.querySelector('span')?.getAttribute('data-tip') || null;
  const gradeId = fragmentToParse.querySelector('span').classList[0] || null;

  return {skill, gradeId};
}

/**
 * @param {string} skill
 * @param {'strength'|'weakness'} type
 * @returns {HTMLSpanElement}
 */
function createSpecialSkillLabel({skill, gradeId}) {
  const skillSpan = document.createElement('span');
  skillSpan.style.position = 'absolute';
  skillSpan.classList.add(gradeId);
  if(skill != 'None')
    skillSpan.textContent = skill;
  return skillSpan;
}

export {
  createSpecialSkillLabel,
  parseSpecialSkill
};

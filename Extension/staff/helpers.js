const { icons } = await import('../common/config.js');

/**
   * Adds Strength and Weakness labels to those who has them
   * @param {Object} personData
   * @param {Object} personData.vars
   * @param {Object} personData.vars.skillTable
   * @returns {{ strength: string|null, weakness: string|null }}
   */
function parseSkills(personData) {
  const fragmentToParse = document.createElement('table');
  fragmentToParse.innerHTML = personData.vars.skillTable;

  const strength = fragmentToParse.querySelector('td.bgLightGreen icon')?.textContent || null;
  const weakness = fragmentToParse.querySelector('td.bgLightRed icon')?.textContent || null;

  return { strength, weakness };
}

/**
 * @param {string} skill
 * @param {'strength'|'weakness'} type
 * @returns {HTMLSpanElement}
 */
function createSkillLabel(skill, type) {
  const skillSpan = document.createElement('span');
  skillSpan.classList.add(type === 'strength' ? 'bgLightGreen' : 'bgLightRed', 'skillIcon');

  const image = document.createElement('img');
  image.src = icons[skill];

  skillSpan.appendChild(image);
  return skillSpan;
}

export {
  createSkillLabel,
  parseSkills
};

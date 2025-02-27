
const { iconsSVG } = await import(chrome.runtime.getURL('common/config.js'));

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

  const strength = fragmentToParse.querySelector('.padSmall.block-green icon')?.textContent || null;
  const weakness = fragmentToParse.querySelector('.padSmall.block-red icon')?.textContent || null;

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

  const image = document.createElement('svg');
  image.innerHTML = iconsSVG[skill];
  //image.childNodes[0].style.width = "18px";
  image.childNodes[0].style.display=" inline-flex";

 // image.src = icons[skill];

  skillSpan.appendChild(image.childNodes[0]);
  return skillSpan;
}

export {
  createSkillLabel,
  parseSkills
};

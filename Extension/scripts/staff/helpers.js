
const { iconsSVG } = await import(chrome.runtime.getURL('common/config.js'));

/**
   * Adds Strength and Weakness labels to those who has them
   * @param {Object} personData
   * @param {Object} personData.vars
   * @param {Object} personData.vars.skillTable
   * @returns {{ strength: string|null, weakness: string|null }}
   */
function parseSkills(personData) {

  const strength = personData.vars.svgStrength || 'err';
  const weakness = personData.vars.svgWeakness || 'err';
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(strength, 'text/html');  // Parse the string as HTML
  const strengthText = doc.querySelector('icon').textContent;

  const doc2 = parser.parseFromString(weakness, 'text/html');  // Parse the string as HTML
  const weaknessText = doc2.querySelector('icon').textContent;

  return { strengthText, weaknessText };

}

/**
 * @param {string} skill
 * @param {'strength'|'weakness'} type
 * @returns {HTMLSpanElement}
 */
function createSkillLabel(skill, type) {
  const skillSpan = document.createElement('span');
  skillSpan.classList.add(type === 'strength' ? 'bgLightGreen' : 'bgLightRed', 'skillIcon');
  Object.assign(skillSpan.style, {
    display: 'inline-flex',
    height: '24px',
    width: '16px',
    marginLeft: '0.25em',
    borderRadius: '4px',
    padding: '0px 0.25em'
  });
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



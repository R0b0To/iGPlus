/**
 * @param {Object} personData
 * @param {Object} personData.vars
 * @returns {{ dName: string, favTrack: string, sTalent: string, sHeight: string, starRating: number, sBMI: float, tName: string, tLink: string|null, sSpecial: {skill:string, gradeId:string} }}
 */
function parseAttributes(personData) {
  function createHTMLElement(varName) {
    const fragmentToParse = document.createElement('table');
    fragmentToParse.innerHTML = personData.vars[varName];
    return fragmentToParse;
  }

  const dName = createHTMLElement('dName').textContent.slice(1); //removing extra space
  const favTrack = createHTMLElement('favTrack').textContent.slice(1);
  const sTalent = createHTMLElement('sTalent').textContent;
  const sHeight = toCentimeters(personData.vars.sHeight);
  const starRating = /\d+/.exec(personData.vars.starRating);
  const sBMI = createHTMLElement('sBMI').textContent;
  const tName = createHTMLElement('tName').textContent;
  const tLink = createHTMLElement('tName').querySelector('a')?.href || null;
  const skill = createHTMLElement('sSpecial').querySelector('span')?.textContent || null;
  const gradeId = createHTMLElement('sSpecial').querySelector('span')?.classList[0] || null;
  const sSpecial = { name: skill, grade: gradeId };

  return { dName, favTrack, sTalent, sHeight, starRating, sBMI, tName, tLink, sSpecial };
}

function toCentimeters(height) {
  // Set up an object containing the conversion factors for feet and inches to centimeters
  const units = {ft: 30.48, in: 2.54, cm: 100 };
  // Check if the height value is in feet and inches or in centimeters
  let valueInCentimeters;
  if (height[1] == '\'') // If the height is in feet and inches, split the value into feet and inches
  {
    const [feet, inches] = height.split(' ');
    // Convert the feet and inches to centimeters and add them together
    valueInCentimeters = ((parseInt(feet) * units.ft)) + (parseInt(inches) * units.in);
  }
  else if (height[1] == '.')
    valueInCentimeters = parseFloat(height) * units.cm; // If the height is in meters
  else
    valueInCentimeters = parseInt(height) ; // If the height is in cm
  return valueInCentimeters;
}

/**
 * @param {string} skill
 * @param {'grade'} type
 * @returns {HTMLSpanElement}
 */
function createSpecialSkillLabel({ name, grade }) {
  const skillSpan = document.createElement('span');
  skillSpan.style.position = 'absolute';
  skillSpan.style.marginLeft = '5px';
  skillSpan.classList.add(grade);
  if (grade != 'specialA0') skillSpan.textContent = name;
  return skillSpan;
}

export { createSpecialSkillLabel, parseAttributes };

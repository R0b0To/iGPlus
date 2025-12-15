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
  const sHeight = toCentimeters(extractHeight(personData.vars.sWeightHeight));
  const starRating = /\d+/.exec(personData.vars.starRating);
  const sBMI = createHTMLElement('sBMI').textContent;
  const tName = createHTMLElement('tName').textContent;
  const tLink = createHTMLElement('tName').querySelector('a')?.href || null;
  const skill = createHTMLElement('sSpecial').querySelector('span')?.textContent || null;
  const gradeId = createHTMLElement('sSpecial').querySelector('span')?.classList[0] || null;
  const sSpecial = { name: skill, grade: gradeId };

  return { dName, favTrack, sTalent, sHeight, starRating, sBMI, tName, tLink, sSpecial };
}
function extractHeight(str) {
  // Regex to extract the number(s) and unit(s)
  const match = str.match(/(\d+(\.\d+)?)(ft|in|cm|m)?/g);  // Match all number-unit pairs

  if (match) {
    let heightString = match.join(" "); // Join all the matched parts
    
    // Now we handle the case for feet and inches
    if (heightString.includes("ft") && heightString.includes("in")) {
      // Example: "5ft 8in"
      const parts = heightString.split(" ");
      const feet = parts[0].replace("ft", "").trim(); // Get feet part
      const inches = parts[1].replace("in", "").trim(); // Get inches part
      return `${feet}ft ${inches}in`;  // Return the formatted string (to be passed to toCentimeters)
    } else {
      // Otherwise, simply return the raw number and unit
      return heightString;
    }
  }
  return null;  // Return null if no match is found
}
function toCentimeters(height) {
  // Set up an object containing the conversion factors for feet and inches to centimeters
  const units = { ft: 30.48, in: 2.54, cm: 1, m: 100 };
  
  let valueInCentimeters;
  
  // Check if height contains "ft" (feet) and "in" (inches)
  if (height.includes("ft") && height.includes("in")) {
    const [feet, inches] = height.split(' ');
    // Convert the feet and inches to centimeters and add them together
    valueInCentimeters = (parseInt(feet) * units.ft) + (parseInt(inches) * units.in);
  }
  // Check if height is in meters (like 1.92m)
  else if (height.includes("m")) {
    valueInCentimeters = parseFloat(height) * units.m;  // Convert meters to centimeters
  }
  // If the height is already in centimeters (like 191cm)
  else if (height.includes("cm")) {
    valueInCentimeters = parseInt(height);  // Directly parse the cm value
  }
  
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

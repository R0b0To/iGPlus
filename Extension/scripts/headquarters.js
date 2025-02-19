(async () => {
  const { delay } = await import(chrome.runtime.getURL('common/utility.js'));
  await delay(200) // sleep a bit, while page loads
  await addLevelLabels();
})();

async function addLevelLabels() {
  // need to get runtime url for Firefox to be working OK. Chrome is fine with this too.
  const { fetchBuildingInfo } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const facility_map = {
    manufacturing:1,
    offices:2,
    simulator:3,
    technology:7,
    design:8,
    yda:11,

  };

  if (document.getElementsByClassName('levelSpan').length>0) return;

  /** @type {HTMLAnchorElement[]} */

  const buildings = document.getElementById('hq-container')?.querySelectorAll('img:not([class])') ?? false;
  
  if(buildings == false)return;

  buildings.forEach(async (building) => {
    const levelDiv = document.createElement('span');
    levelDiv.classList.add('levelSpan');
    const name = extractPart(building.src);
    
    const data = await fetchBuildingInfo(facility_map[name]);

    if (!data) {
      console.warn(`No info about building with id ${name}`);
      return;
    }

    const { vars = {} } = data;
    levelDiv.innerHTML = `Level: ${vars?.level || ''}`;

    const label = building.nextSibling.querySelector('.building-name-overlay');
    if(label.querySelectorAll('.levelSpan').length == 0)
      label.prepend(levelDiv);

  });
}


function extractPart(url) {
  const match = url.match(/hq1-([^_]+)/);
  return match ? match[1] : null;
}



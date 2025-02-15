async function addLevelLabels() {
  // need to get runtime url for Firefox to be working OK. Chrome is fine with this too.
  const { fetchBuildingInfo } = await import(chrome.runtime.getURL('./common/fetcher.js'));
  const facility_map = {
    manufacturing:1,
    offices:2,
    simulator:3,
    technology:7,
    design:8,
    yda:11,

  };

  if (document.getElementsByClassName('levelSpan')?.length) return;

  /** @type {HTMLAnchorElement[]} */
  //const buildingAnchors = document.querySelectorAll('div.c-wrap.text-center > a');
  //const buildings = document.querySelectorAll('.st0');
  const buildings = document.querySelectorAll('img:not([class])');

  buildings.forEach(async (building) => {
    const levelDiv = document.createElement('span');
    levelDiv.classList.add('levelSpan');
    const name = extractPart(building.src);
    
    //const buildingParams = new URLSearchParams(building.pathname.replace('/app/', '?'));
    //const id = buildingParams.get('id');
    const data = await fetchBuildingInfo(facility_map[name]);

    if (!data) {
      console.warn(`No info about building with id ${name}`);
      return;
    }

    const { vars = {} } = data;
    levelDiv.innerHTML = `Level: ${vars?.level || 'upgrading...'}`;
    //building.previousSibling.append(levelDiv);
    //building.closest('.staff-profile').firstElementChild.append(levelDiv);
    const label = building.nextSibling.querySelector('.building-name-overlay');
    if(label.querySelectorAll('.levelSpan').length == 0)
      label.prepend(levelDiv);

  });
}


function extractPart(url) {
  const match = url.match(/hq1-([^_]+)/);
  return match ? match[1] : null;
}

(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      await new Promise((res) => setTimeout(res, 300)); // sleep a bit, while page loads
      await addLevelLabels();;
      break;
    } catch (err) {
      console.log(err)
      console.warn(`Retry to get hq level #${i + 1}/3`);
    }
  }
})();


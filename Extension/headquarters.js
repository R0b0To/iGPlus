async function addLevelLabels() {
  // need to get runtime url for Firefox to be working OK. Chrome is fine with this too.
  const { fetchBuildingInfo } = await import(chrome.runtime.getURL('./common/fetcher.js'));

  if (document.getElementsByClassName('levelSpan')?.length) return;

  /** @type {HTMLAnchorElement[]} */
  const buildingAnchors = document.querySelectorAll('div.c-wrap.text-center > a');

  buildingAnchors.forEach(async (building) => {
    const levelDiv = document.createElement('span');
    levelDiv.classList.add('levelSpan');

    const buildingParams = new URLSearchParams(building.pathname.replace('/app/', '?'));
    const id = buildingParams.get('id');
    const data = await fetchBuildingInfo(id);

    if (!data) {
      console.warn(`No info about building with id ${id}`);
      return;
    }

    const { vars = {} } = data;
    levelDiv.textContent = ` level: ${vars?.level || 'upgrading...'}`;

    building.previousSibling.append(levelDiv);
    building.closest('.staff-profile').firstElementChild.append(levelDiv);
  });
}

addLevelLabels();

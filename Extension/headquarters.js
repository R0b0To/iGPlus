async function addLevelLabels() {
  const { fetchBuildingInfo } = await import('./common/fetcher.js');

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

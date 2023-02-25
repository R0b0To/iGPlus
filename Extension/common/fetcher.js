const baseUrl = 'https://igpmanager.com/index.php';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}&csrfName=&csrfToken=`;

async function fetchBuildingInfo(buildingId) {
  try {
    const data = await fetch(`${baseUrl}?${getBuildingInfoUrl(buildingId)}`)
      .then((response) => response.json())
      .catch((error) => console.error(`Cannot get info about building with id ${buildingId}`, error));

    return data || null;
  } catch (err) {
    console.error(err);
  }
}

export {
  fetchBuildingInfo
};

const baseUrl = 'https://igpmanager.com/index.php';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}`;
const getStaffUrl = (id) => `action=fetch&d=staff&id=${id}`;

async function getData(itemLocator) {
  try {
    return await fetch(`${baseUrl}?${itemLocator}&csrfName=&csrfToken=`)
      .then((response) => response.json());
  } catch (err) {
    console.error(err);
    return null;
  }
}

/**
 * @param {string} buildingId
 * @returns {Promise<Object|null>}
 */
function fetchBuildingInfo(buildingId) {
  return getData(getBuildingInfoUrl(buildingId));
}

/**
 * @param {string} personId
 * @returns {Promise<Object|null>}
 */
function fetchStaffInfo(personId) {
  return getData(getStaffUrl(personId));
}

/**
 * @returns {Promise<{nextLeagueRaceTime: number}|null>}
 */
function fetchNextRace() {
  return getData('action=fetch&p=race');
}

export {
  fetchBuildingInfo,
  fetchNextRace,
  fetchStaffInfo
};

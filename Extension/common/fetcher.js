const baseUrl = 'https://igpmanager.com/index.php';
const weatherBaseUrl = 'https://api.open-meteo.com/v1/forecast';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}`;
const getStaffUrl = (id) => `action=fetch&d=staff&id=${id}`;

async function getData(itemLocator, isThirdParty = false) {
  let url = `${baseUrl}?${itemLocator}&csrfName=&csrfToken=`;
  if (isThirdParty) {
    url = itemLocator;
  }

  try {
    return await fetch(url)
      .then((response) => response.json());
  } catch (err) {
    console.error(err);
    return null;
  }
}

function fetchRaceWeather({ lat, lon, temp }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    models: 'gfs_seamless',
    ...(temp === '2' ? { temperature_unit: 'fahrenheit' } : {})
  });

  ['temperature_2m', 'relativehumidity_2m', 'precipitation'].forEach((p) => params.append('hourly', p));

  return getData(`${weatherBaseUrl}?${params.toString()}`, true);
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

/**
 * @returns {Promise<{Object}|null>}
 */
function fetchManagerData() {
  const managerUrl = 'action=fireUp&addon=igp&ajax=1&jsReply=fireUp&uwv=false';
  return getData(managerUrl);
}

export {
  fetchBuildingInfo,
  fetchManagerData,
  fetchNextRace,
  fetchRaceWeather,
  fetchStaffInfo
};

const baseUrl = 'https://igpmanager.com/index.php';
const weatherBaseUrl = 'https://api.open-meteo.com/v1/forecast';
const iGPWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5/forecast';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}`;
const getStaffUrl = (id) => `action=fetch&d=staff&id=${id}`;
const getDriverUrl = (id) => `action=fetch&d=driver&id=${id}`;

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
    ...(temp === '2' ? { temperature_unit: 'fahrenheit' } : {}),
    timezone: 'GMT'
  });

  ['temperature_2m', 'relativehumidity_2m', 'precipitation'].forEach((p) => params.append('hourly', p));
  ['sunrise', 'sunset', 'weathercode'].forEach((p) => params.append('daily', p));

  return getData(`${weatherBaseUrl}?${params.toString()}`, true);
}
function fetchIGPRaceWeather({ lat, lon, temp }) {
  const params = new URLSearchParams({
    lat: lat,
    lon: lon,
    ...(temp === '2' ? { units: 'imperial' } : {units: 'metric'}),
    appid:'245735e6c3dc24c1b42acfbdc53238e0',
    cnt:16 //timestamp number, 3 hours intervals, 16 is 2 days
  });
  return getData(`${iGPWeatherBaseUrl}?${params.toString()}`, true);
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
 * @param {string} personId
 * @returns {Promise<Object|null>}
 */
function fetchDriverInfo(personId) {
  return getData(getDriverUrl(personId));
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
  fetchIGPRaceWeather,
  fetchStaffInfo,
  fetchDriverInfo
};

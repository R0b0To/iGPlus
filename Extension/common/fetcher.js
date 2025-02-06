const baseUrl = 'https://igpmanager.com/index.php';
const iGPWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const iGPWeatherBaseUrlNow = 'https://api.openweathermap.org/data/2.5/weather';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}`;
const getStaffUrl = (id) => `action=fetch&d=staff&id=${id}`;
const getDriverUrl = (id) => `action=fetch&d=driver&id=${id}`;
const getTeamUrl = (id) => `action=fetch&d=profile&team=${id}`;
const getRaceUrl = (id) => `action=fetch&d=resultDetail&id=${id}`;
const getRaceResultsUrl = (id) => `action=fetch&d=result&id=${id}`;


async function getPostData(itemLocator, isThirdParty = false){
  let url = `${baseUrl}?${itemLocator}&csrfName=&csrfToken=`;
  if (isThirdParty) {
    url = itemLocator;
  }

  try {
    return await fetch(url,{
      "credentials": "include",
      "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      "body": "initString=p%3Drace%26tab%3Dstrategy",
      "method": "POST",
      "mode": "cors"
  }).then((response) => response.json());
  } catch (err) {
    console.error(err);
    return null;
  }

}


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

function fetchIGPRaceWeather({ lat, lon, temp }) {
  const params = new URLSearchParams({
    lat: lat,
    lon: lon,
    ...(temp === '2' ? { units: 'imperial' } : {units: 'metric'}),
    appid:'c3ea81e926bd10b625bedd1268e5bc44',
    cnt:16 //timestamp number, 3 hours intervals, 16 is 2 days
  });
  return getData(`${iGPWeatherBaseUrl}?${params.toString()}`, true);
}
function fetchIGPRaceWeatherNow({ lat, lon, temp }) {
  const params = new URLSearchParams({
    lat: lat,
    lon: lon,
    ...(temp === '2' ? { units: 'imperial' } : {units: 'metric'}),
    appid:'c3ea81e926bd10b625bedd1268e5bc44',
    cnt:16 //timestamp number, 3 hours intervals, 16 is 2 days
  });
  return getData(`${iGPWeatherBaseUrlNow}?${params.toString()}`, true);
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
 * @param {string} personId
 * @returns {Promise<Object|null>}
 */
function fetchTeamInfo(personId) {
  return getData(getTeamUrl(personId));
}
/**
 * @param {string} personId
 * @returns {Promise<Object|null>}
 */
function fetchRaceReportInfo(personId) {
  return getData(getRaceUrl(personId));
}
/**
 * @param {string} raceId
 * @returns {Promise<Object|null>}
 */
function fetchRaceResultInfo(raceId) {
  return getData(getRaceResultsUrl(raceId));
}

/**
 * @returns {Promise<{nextLeagueRaceTime: number}|null>}
 */
function fetchNextRace() {
  return getData('action=fetch&p=race');
}
function fetchProgressInfo() {
  return getData('action=fetch&d=progress')
}


/**
 * @returns {Promise<{Object}|null>}
 */
function fetchManagerData(option) {
  const managerUrl = 'action=fireUp&addon=igp&ajax=1&jsReply=fireUp&uwv=false';
  if(option == 1)
  return getData(managerUrl);
  else
  return getPostData(managerUrl);
}
function fetchCarData(){
  return getData('action=fetch&p=cars');
}

function fetchLeagueData(leagueId) {
  const leagueUrl = `action=fetch&p=league&id=${leagueId}`;
  return getData(leagueUrl);
}
function fetchSettings() {
  const settingsURL = `action=fetch&p=settings`;
  return getData(settingsURL);
}


export {
  fetchBuildingInfo,
  fetchLeagueData,
  fetchManagerData,
  fetchNextRace,
  fetchIGPRaceWeather,
  fetchStaffInfo,
  fetchDriverInfo,
  fetchTeamInfo,
  fetchRaceReportInfo,
  fetchCarData,
  fetchIGPRaceWeatherNow,
  fetchRaceResultInfo,
  fetchSettings,
  fetchProgressInfo
};

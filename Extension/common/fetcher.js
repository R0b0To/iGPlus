const baseUrl = 'https://igpmanager.com/index.php';

/*
The intention is to have a simple centralized point of fetching game data,
And some abstraction on the top of fetch mechanism and error handling
*/

const getBuildingInfoUrl = (id) => `action=fetch&d=facility&id=${id}`;
const getStaffUrl = (id) => `action=fetch&d=staff&id=${id}`;

function getData(itemLocator) {
  return fetch(`${baseUrl}?${itemLocator}&csrfName=&csrfToken=`)
    .then((response) => response.json());
}

async function fetchBuildingInfo(buildingId) {
  try {
    const data = await getData(getBuildingInfoUrl(buildingId));

    return data || null;
  } catch (err) {
    console.error(err);
  }
}

async function fetchStaffInfo(personId) {
  try {
    const data = await getData(getStaffUrl(personId));

    return data || null;
  } catch (err) {
    console.error(err);
  }
}

async function fetchNextRace() {
  try {
    const data = await getData('action=fetch&p=race');
    return data || null;
  } catch (err) {
    console.error(err);
  }
}

export {
  fetchBuildingInfo,
  fetchNextRace,
  fetchStaffInfo
};

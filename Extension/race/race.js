function addCustomWeatherLink() {
  const weatherBtn = document.getElementById('race').childNodes[0].lastChild.childNodes[1];
  weatherBtn.parentElement.className = 'three-btn';

  const weatherAlt = weatherBtn.cloneNode(true);
  weatherAlt.addEventListener('click', getWeather);
  weatherAlt.textContent = 'Weather';
  weatherAlt.href = '#'; // url+weatherLocation[trackID];
  weatherAlt.id = 'chartWeather';
  weatherAlt.className = 'btn4';

  const weatherContainer = document.createElement('div');
  weatherContainer.id = 'container';

  weatherBtn.parentElement.append(weatherAlt);
  weatherBtn.parentElement.parentElement.append(weatherContainer);
}

/**
 * Replaces plain default map to the more detailed one
 */
function swapMap() {
  const countryFlagImg = document.querySelector('#race .flag');
  const mapCode = countryFlagImg.classList[1].split('-')[1];

  const circuitImg = document.querySelector('#race img:not(.flag)');
  document.getElementById('igplus_darkmode') ? circuitImg.src = chrome.runtime.getURL(`images/circuits/${mapCode}_dark.png`) : circuitImg.src = chrome.runtime.getURL(`images/circuits/${mapCode}.png`)
  //circuitImg.src = chrome.runtime.getURL(`images/circuits/${mapCode}.png`);
  circuitImg.style.width = '90%';
  circuitImg.style.margin = 'auto';
}

/**
 * Adds numeric percentage values to the circuit param bars
 */
function showBarValues() {
  function createValueSpan(value) {
    const barValue = document.createElement('span');
    barValue.classList.add('showStat');
    barValue.textContent = value;
    return barValue;
  }

  if (document.getElementsByClassName('showStat').length == 0) {
    const parameterBars = document.querySelectorAll('#race .ratingBar');
    parameterBars.forEach((bar) => {
      bar.classList.add('statBarWithValue');
      bar.appendChild(createValueSpan(bar.childNodes[0].style.width));
    });
  }
}

/**
 * Fetches detailed weather data from __api.open-meteo.com__.
 * Shows weather data as charts
 */
async function getWeather() {
  const weatherContainer = document.getElementById('container');
  if (weatherContainer.style.visibility == 'visible'){
    weatherContainer.style.visibility = 'hidden';
    return
  }
  else weatherContainer.style.visibility = 'visible';

  const { fetchNextRace, fetchManagerData, fetchIGPRaceWeather,fetchIGPRaceWeatherNow } = await import(
    chrome.runtime.getURL('common/fetcher.js')
  );
  const { raceTrackCoords } = await import(chrome.runtime.getURL('race/const.js'));

  const { manager } = await fetchManagerData();
  const { nextLeagueRaceTime } = await fetchNextRace();
  const trackID = new URLSearchParams(document.querySelector('a[href*="circuit&id="]').href).get('id');
  const params = {
    lat: raceTrackCoords[trackID][0],
    lon: raceTrackCoords[trackID][1],
    temp: manager.format.temperature,
  };
  const weatherNow = await fetchIGPRaceWeatherNow(params);
  const forecast = await fetchIGPRaceWeather(params);
  forecast.list.unshift(weatherNow);
  buildWeatherCharts(forecast, nextLeagueRaceTime);
}

/**
 * Compiles weather data into charts
 * @param {Object} data
 * @param {number} nextLeagueRaceTime in epoch seconds
 */
async function buildWeatherCharts(data, nextLeagueRaceTime) {
  const { weatherStats } = await import(chrome.runtime.getURL('race/const.js'));
  const { makeChartConfig } = await import(chrome.runtime.getURL('race/chartConfig.js'));

  const pointStart = new Date(data.list[0].dt*1000).getTime();
  const secondPointTime = new Date(data.list[1].dt*1000).getTime();
  const pointInterval = secondPointTime - pointStart;
  function getForecastData(data) {
    const forecastData = data.list.map(entry => (
      {
      date: entry.dt,
      temperature: entry.main.temp,
      precipitation: entry.rain ? entry.rain['3h'] || 0 : 0, // Extract precipitation data, default to 0 if not available
      // humidity: entry.main.humidity
      // You can extract more information as needed
    }));

    return forecastData;
  }
  const forecastData =getForecastData(data);
  const darkmode = document.getElementById('igplus_darkmode') ? true : false;
  const series = Object.entries(forecastData[0]).filter(([key, value]) => key !== 'date')
  .map(([key, value]) => {
    return{
    name: key,
    yAxis: key === 'precipitation' ? 1 : 0,
    data: forecastData.map(entry => entry[key]),
    color: darkmode? weatherStats[key].darkcolor :weatherStats[key].color,
    type: weatherStats[key].type,
    pointStart,
    pointInterval,
    tooltip: {
      valueSuffix: ` ${weatherStats[key].unit}`,
    },}
  });
  let plotBands = [];

  const { city } = data;
  let title = `${data.list[0].main.temp}° ${data.list[0].weather[0].main} - ${city.name} ${city.coord.lat.toFixed(2)}°N ${city.coord.lon.toFixed(2)}°E`;
  const chartConfig = makeChartConfig({ title, nextLeagueRaceTime, plotBands, series, darkmode});
  if (document.getElementById('container')) {
    Highcharts.chart('container', chartConfig);
  }
}

// TODO move to separate retry module?
(async () => {
  try {
    await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
    if (document.getElementById('chartWeather') == null) {
      addCustomWeatherLink();
      swapMap();
      showBarValues();
    }
  } catch (err) {
    //console.log('page not loaded');
  }
})();

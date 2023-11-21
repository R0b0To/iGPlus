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

  weatherBtn.parentElement.appendChild(weatherAlt);
  weatherBtn.parentElement.appendChild(weatherContainer);
}

/**
 * Replaces plain default map to the more detailed one
 */
function swapMap() {
  const countryFlagImg = document.querySelector('#race > div:nth-child(1) > h1 > img');
  const mapCode = [...countryFlagImg.classList.values()].find((val) => val !== 'flag').split('-')[1];

  const circuitImg = document.querySelector('#race > div.eight.columns.text-center > img');
  circuitImg.src = chrome.runtime.getURL(`images/circuits/${mapCode}.png`);
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
    const parameterBars = document.querySelectorAll('#race > div:nth-child(1) > table > tbody .ratingBar');
    parameterBars.forEach((bar) => {
      bar.classList.add('statBarWithValue');
      bar.appendChild(createValueSpan(bar.childNodes[0].style.width));
    });
  }
}
function weatherMerger(data, interval3h) {
  try {
    for (const timestamp of interval3h.list){
      const dateObj = new Date(timestamp.dt * 1000);
      const isoFormat = dateObj.toISOString().slice(0, 16);
      const index = data.hourly.time.indexOf(isoFormat);
      data.hourly.temperature_2m[index] = timestamp.main.temp;
      data.hourly.relativehumidity_2m[index] = timestamp.main.humidity;
      if (timestamp.hasOwnProperty('rain')) {
        data.hourly.precipitation[index] = timestamp.rain['3h'] ?? timestamp.rain['1h'] ;
      }
  }

  } catch (error) {
    console.log(error)
    return data;
  }

  return data;
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

  const { fetchNextRace, fetchManagerData, fetchRaceWeather, fetchIGPRaceWeather,fetchIGPRaceWeatherNow } = await import(
    chrome.runtime.getURL('common/fetcher.js')
  );
  const { raceTrackCoords } = await import(chrome.runtime.getURL('race/const.js'));

  const { manager } = await fetchManagerData();
  const { nextLeagueRaceTime } = await fetchNextRace();
  const trackID = document.getElementById('race').childNodes[0].lastChild.childNodes[1].href.match(/\d+/)[0];
  
  const params = {
    lat: raceTrackCoords[trackID][0],
    lon: raceTrackCoords[trackID][1],
    temp: manager.format.temperature,
  };
  const weatherNow = await fetchIGPRaceWeatherNow(params);
  const data = await fetchRaceWeather(params);
  const data2 = await fetchIGPRaceWeather(params);

  console.log(weatherNow)
  data2.list.push(weatherNow);

  console.log('iGPlus|',weatherNow.name,weatherNow.main.temp,weatherNow.rain ?? '');

  buildWeatherCharts(data2, nextLeagueRaceTime);
}

/**
 * Compiles weather data into charts
 * @param {Object} data
 * @param {number} nextLeagueRaceTime in epoch seconds
 */
async function buildWeatherCharts(data, nextLeagueRaceTime) {
  console.log(data)
  const { weatherCodes, weatherStats } = await import(chrome.runtime.getURL('race/const.js'));
  const { makeChartConfig } = await import(chrome.runtime.getURL('race/chartConfig.js'));
  // we care only about closest 2 days
  
  /*Object.keys(data.hourly).forEach((ele) => {
    data.hourly[ele] = data.hourly[ele].slice(0, 48);
  });*/

  const pointStart = new Date(data.list[0].dt*1000).getTime();
  const secondPointTime = new Date(data.list[1].dt*1000).getTime();
  const pointInterval = secondPointTime - pointStart;
  function getForecastData(data) {
    const forecastData = data.list.map(entry => ({
      date: entry.dt,
      temperature: entry.main.temp,
      precipitation: entry.rain ? entry.rain['3h'] || 0 : 0 // Extract precipitation data, default to 0 if not available
      // You can extract more information as needed
    }));

    return forecastData;
  }
  const forecastData =getForecastData(data);
  console.log(forecastData)

  const series = Object.entries(forecastData[0]).filter(([key, value]) => key !== 'date').map(([key, value]) => ({
    name: key,
    yAxis: key === 'precipitation' ? 1 : 0,
    data: forecastData.map(entry => entry[key]),
    color: weatherStats[key].color,
    type: weatherStats[key].type,
    pointStart,
    pointInterval,
  }));

  const { sunrise = [], sunset = [], weathercode = [] } = data.daily || {};
  let plotBands = [];

  /*if (sunrise.length && sunset.length) {
    plotBands = sunrise.map((riseTime, index) => ({
      color: 'rgba(255, 255, 194, .4)',
      from: new Date(`${riseTime}Z`),
      to: new Date(`${sunset[index]}Z`),
    }));
  }*/

  const { city } = data;
  let title = `${data.list[16].main.temp} ${data.list[16].weather[0].main} ${city.name} ${city.coord.lat.toFixed(2)}°N ${city.coord.lon.toFixed(2)}°E`;

  // considering the most severe condition code for this day
 /* if (weathercode.length) {
    title += ` | ${weatherCodes[Math.max(...weathercode)]} `;
  }*/

  const chartConfig = makeChartConfig({ title, nextLeagueRaceTime, plotBands, series });

  if (document.getElementById('container')) {
    Highcharts.chart('container', chartConfig);
  }

  if (document.getElementById('containerStockcharts')) {
    Highcharts.stockChart('containerStockcharts', chartConfig);
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

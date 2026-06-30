(async () => {
  try {
    async function addCustomWeatherLink() {
      const { safeQuery } = await import(chrome.runtime.getURL('common/safeQuery.js'));

      const weatherBtn = safeQuery('.raceWeatherBadge', 'race: weather badge');
      const weatherLocation = safeQuery('.raceLeagueBar', 'race: league bar');
      if (!weatherBtn || !weatherLocation) return;

      weatherBtn.parentElement.className = 'three-btn';

      const weatherAlt = weatherBtn.cloneNode(true);
      weatherAlt.addEventListener('click', getWeather);
      weatherAlt.textContent = 'Weather';
      weatherAlt.href = '#';
      weatherAlt.id = 'chartWeather';
      weatherAlt.className = 'btn4 pushBtn';

      const weatherContainer = document.createElement('div');
      weatherContainer.id = 'container';

      weatherLocation.append(weatherAlt);
      weatherLocation.parentElement.append(weatherContainer);
    }

    /**
     * Replaces the plain default map with a more detailed one.
     */
    function swapMap() {
      const countryFlagImg = document.querySelector('.flag');
      if (!countryFlagImg) {
        console.warn('iGPlus [race: swap map]: .flag element not found');
        return;
      }
      const mapCode = countryFlagImg.classList[1].split('-')[1];

      const circuitImg = document.querySelector('img:not(.flag)');
      if (!circuitImg) {
        console.warn('iGPlus [race: swap map]: circuit image not found');
        return;
      }
      circuitImg.src = chrome.runtime.getURL(`images/circuits/${mapCode}_dark.png`);
      circuitImg.style.width = '90%';
      circuitImg.style.margin = 'auto';
    }

    /**
     * Adds numeric percentage values to the circuit param bars.
     */
    function showBarValues() {
      function createValueSpan(value) {
        const barValue = document.createElement('span');
        barValue.classList.add('showStat');
        barValue.textContent = value;
        return barValue;
      }

      if (document.getElementsByClassName('showStat').length === 0) {
        const parameterBars = document.querySelectorAll('#race .ratingBar');
        parameterBars.forEach((bar) => {
          bar.classList.add('statBarWithValue');
          bar.appendChild(createValueSpan(bar.childNodes[0].style.width));
        });
      }
    }

    /**
     * Fetches detailed weather data and shows it as charts.
     */
    async function getWeather() {
      const weatherContainer = document.getElementById('container');
      if (!weatherContainer) return;

      if (weatherContainer.style.visibility === 'visible') {
        weatherContainer.style.visibility = 'hidden';
        return;
      }
      weatherContainer.style.visibility = 'visible';

      if (!document.getElementById('weather-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'weather-spinner-style';
        style.textContent = '@keyframes weather-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }

      weatherContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;"><div style="text-align:center;"><div style="display:inline-block;width:40px;height:40px;border:4px solid rgba(255,255,255,.3);border-top:4px solid #fff;border-radius:50%;animation:weather-spin 1s linear infinite;margin-bottom:10px;"></div><p style="margin:10px 0 0 0;opacity:.7;">Loading weather data...</p></div></div>';

      const { fetchNextRace, fetchManagerDataPost, fetchIGPRaceWeather, fetchIGPRaceWeatherNow } = await import(
        chrome.runtime.getURL('common/fetcher.js')
      );
      const { raceTrackCoords } = await import(chrome.runtime.getURL('scripts/race/const.js'));

      const weatherBadge = document.querySelector('.raceWeatherBadge');
      if (!weatherBadge) {
        console.warn('iGPlus [race: get weather]: .raceWeatherBadge not found');
        return;
      }

      const { manager } = await fetchManagerDataPost();
      const { nextLeagueRaceTime } = await fetchNextRace();
      const trackID = new URLSearchParams(weatherBadge.href).get('id');
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
     * Compiles weather data into Plotly charts.
     * @param {Object} data
     * @param {number} nextLeagueRaceTime in epoch seconds
     */
    async function buildWeatherCharts(data, nextLeagueRaceTime) {
      const { weatherStats } = await import(chrome.runtime.getURL('scripts/race/const.js'));
      const { makePlotlyConfig } = await import(chrome.runtime.getURL('scripts/race/chartConfig.js'));

      function getForecastData(data) {
        return data.list.map(entry => ({
          date: new Date(entry.dt * 1000),
          temperature: entry.main.temp,
          precipitation: entry.rain?.['3h'] ?? entry.snow?.['3h'] ?? entry.rain?.['1h'] ?? entry.snow?.['1h'] ?? 0,
        }));
      }

      const forecastData = getForecastData(data);
      const darkmode = document.getElementById('igplus_darkmode') ? true : false;

      const traces = Object.entries(forecastData[0])
        .filter(([key]) => key !== 'date')
        .map(([key]) => {
          const stat = weatherStats[key];
          const color = darkmode ? stat.darkcolor : stat.color;
          const isBar = stat.type === 'bar';

          const trace = {
            name: key,
            x: forecastData.map(entry => entry.date),
            y: forecastData.map(entry => entry[key]),
            type: isBar ? 'bar' : 'scatter',
            yaxis: key === 'precipitation' ? 'y2' : 'y',
            hovertemplate: `<b>${key}</b><br>%{x}<br>%{y} ${stat.unit}<extra></extra>`,
          };

          if (isBar) {
            trace.marker = { color };
          } else {
            trace.mode = 'lines';
            trace.line = { color, shape: 'spline' };
          }

          return trace;
        });

      const { city } = data;
      const title = `${data.list[0].main.temp}° ${data.list[0].weather[0].main} - ${city.name} ${city.coord.lat.toFixed(2)}°N ${city.coord.lon.toFixed(2)}°E`;
      const { plotlyData, plotlyLayout } = makePlotlyConfig({ title, nextLeagueRaceTime, traces, darkmode });

      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = '';
        Plotly.newPlot('container', plotlyData, plotlyLayout, {
          responsive: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'plotly-notifier']
        });
      }
    }

    if (document.getElementById('chartWeather') == null) {
      await addCustomWeatherLink();
      showBarValues();
    }
  } catch (err) {
    console.warn('iGPlus [race]: init error', err);
  }
})();
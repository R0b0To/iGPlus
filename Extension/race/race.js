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
      bar.classList.add('statBarWithVaue');
      bar.appendChild(createValueSpan(bar.childNodes[0].style.width));
    });
  }
}

/**
 * Fetches detailed weather data from __api.open-meteo.com__.
 * Shows weather data as charts
 */
async function getWeather() {
  const { fetchManagerData, fetchRaceWeather } = await import(chrome.runtime.getURL('common/fetcher.js'));
  const { raceTrackCoords } = await import(chrome.runtime.getURL('race/const.js'));

  const { manager } = await fetchManagerData();
  const trackID = document.getElementById('race').childNodes[0].lastChild.childNodes[1].href.match(/\d+/)[0];

  const params = {
    lat: raceTrackCoords[trackID][0],
    lon: raceTrackCoords[trackID][1],
    temp: manager.format.temperature,
  };
  const data = await fetchRaceWeather(params);

  // TODO: still need this commented code?
  // url3 = "http://api.weatherunlocked.com/api/forecast/51.50,-0.12?app_id=ba14cfca&app_key=637253385cd6ff853a6cf83c85132a4b";
  /*  chrome.runtime.sendMessage( // goes to bg_page.js
  url3,
  data => previewData2(data) // your callback
  );
  */

  buildWeatherCharts(data);
}

async function buildWeatherCharts(data) {
  const { weatherCodes, weatherStats } = await import(chrome.runtime.getURL('race/const.js'));

  Object.keys(data.hourly).forEach((ele) => {
    data.hourly[ele] = data.hourly[ele].slice(0, 48);
  });

  const series = [];
  let axisId = 0;

  let startTime = new Date(`${data.hourly.time[0]}Z`);
  let secondPointTime = new Date(`${data.hourly.time[1]}Z`);
  const chartStartTime = startTime.getTime();
  const pointInterval = secondPointTime.getTime() - startTime.getTime();

  Object.entries(data.hourly).forEach(([category, values]) => {
    if (!Object.keys(weatherStats).includes(category)) {
      return;
    }

    const unit = data.hourly_units[category];
    const chartConfig = weatherStats[category];

    const chart = {
      name: chartConfig.title || category,
      data: values,
      color: chartConfig.color,
      type: chartConfig.type || '',
      yAxis: axisId,
      pointStart: chartStartTime,
      pointInterval: pointInterval,
      tooltip: {
        valueSuffix: ` ${unit}`,
      },
    };

    series.push(chart);

    axisId += 1;
  });

  const { sunrise = [], sunset = [], weathercode = [] } = data.daily || {};
  let plotBands = [];

  if (sunrise.length && sunset.length) {
    plotBands = sunrise.map((riseTime, index) => ({
      color: 'rgba(255, 255, 194, .4)',
      from: new Date(`${riseTime}Z`),
      to: new Date(`${sunset[index]}Z`)
    }));
  }

  const latitude = data.latitude.toFixed(2);
  const longitude = data.longitude.toFixed(2);
  let title = `${latitude}°N ${longitude}°E`;

  if ('elevation' in data) {
    const elevation = data.elevation.toFixed(0);
    title += `, ${elevation}m above sea level`;
  }

  if (weathercode.length) {
    title += ` | ${weatherCodes[Math.max(...weathercode)]} `;
  }

  const offset = -new Date().getTimezoneOffset();
  const chartSetup = {
    accessibility: {
      enabled: false,
    },
    title: {
      text: ''
    },
    subtitle: {
      text: title,
    },
    chart: {
      type: 'spline',
      zoomType: 'x',
      panning: true,
      panKey: 'shift',
      backgroundColor: '#e3e4e5',
    },
    yAxis: new Array(3).fill({ visible: false }, 0, 3),
    xAxis: {
      type: 'datetime',
      plotLines: [
        {
          value: Date.now() + offset * 60000,
          color: 'rgba(255, 0, 0, .6)',
          width: 2,
        },
      ],
      plotBands: plotBands,
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false,
        },
        label: {
          connectorAllowed: false,
        },
      },
    },
    series,
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 800,
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom',
            },
          },
        },
      ],
    },
    tooltip: {
      shared: true,
      crosshairs: true,
    },
    caption: {
      text: '<b> Click and drag in the chart to zoom in and inspect the data.</b>',
    },
  };

  if (document.getElementById('container')) {
    Highcharts.chart('container', chartSetup);
  }

  if (document.getElementById('containerStockcharts')) {
    Highcharts.stockChart('containerStockcharts', chartSetup);
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
    console.log('page not loaded');
  }
})();

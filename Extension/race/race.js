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
  const mapCode = [...countryFlagImg.classList.values()]
    .find((val) => val !== 'flag')
    .split('-')[1];

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
      bar.appendChild(
        createValueSpan(bar.childNodes[0].style.width)
      );
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
    temp: manager.format.temperature
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

// TODO evhenious: to continue here
async function buildWeatherCharts(data) {
  const { weatherCodes } = await import(chrome.runtime.getURL('race/const.js'));

  Object.keys(data.hourly).forEach((ele) => {
    data.hourly[ele] = data.hourly[ele].slice(0, 48);
  });

  const yAxis = [];
  const series = [];

  ['hourly', 'six_hourly', 'three_hourly', 'daily'].forEach(function (section, index) {
    if (!(section in data)) {
      return;
    }

    Object.entries(data[section] || []).forEach(function (k) {
      if (k[0] == 'time' || k[0] == 'sunrise' || k[0] == 'sunset') {
        return;
      }
      let date = new Date(data[section].time[0]);
      let date2 = new Date(data[section].time[1]);
      offset = -new Date().getTimezoneOffset();
      let hourly_starttime = date.getTime() + offset;
      let pointInterval = date2.getTime() - date.getTime();
      let unit = data[`${section}_units`][k[0]];
      var axisId = null;
      for (let i = 0; i < yAxis.length; i++) {
        if (yAxis[i].title.text == unit) {
          axisId = i;
        }
      }
      if (axisId == null) {
        yAxis.push({ title: { text: unit } });
        axisId = yAxis.length - 1;
      }

      typeP = '';

      if (k[0] == 'precipitation') {
        var colorP = Highcharts.getOptions().colors[0];
        typeP = 'area';
      }
      if (k[0] == 'relativehumidity_2m') {
        colorP = Highcharts.getOptions().colors[1];
        k[0] = 'humidity';
      }

      if (k[0] == 'temperature_2m') {
        colorP = Highcharts.getOptions().colors[3];
        k[0] = 'temperature';
      }

      var ser = {
        name: k[0],
        data: k[1],
        color: colorP,
        type: typeP,
        yAxis: axisId,
        pointStart: hourly_starttime,
        pointInterval: pointInterval,
        tooltip: {
          valueSuffix: ' ' + unit,
        },
      };

      if (k[0] == 'weathercode') {
        ser.tooltip.pointFormatter = function () {
          let condition = weatherCodes[this.y];
          return (
            '<span style="color:' +
            this.series.color +
            '">\u25CF</span> ' +
            this.series.name +
            ': <b>' +
            condition +
            '</b> (' +
            this.y +
            ' wmo)<br/>'
          );
        };
      }
      //console.log(ser);
      series.push(ser);
    });
  });

  var plotBands = [];
  if ('daily' in data && 'sunrise' in data.daily && 'sunset' in data.daily) {
    let rise = data.daily.sunrise;
    let set = data.daily.sunset;
    var plotBands = rise.map(function (r, i) {
      return {
        color: 'rgb(255, 255, 194)',
        from: (r + data.utc_offset_seconds) * 1000,
        to: (set[i] + data.utc_offset_seconds) * 1000,
      };
    });
  }

  let latitude = data.latitude.toFixed(2);
  let longitude = data.longitude.toFixed(2);
  let title = `${latitude}°N ${longitude}°E`;

  if ('elevation' in data) {
    let elevation = data.elevation.toFixed(0);
    title = `${title} ${elevation}m above sea level`;
  }

  offset = -new Date().getTimezoneOffset();
  let json = {
    accessibility: {
      enabled: false,
    },
    title: {
      text: '',
    },

    chart: {
      type: 'spline',
      zoomType: 'x',
      panning: true,
      panKey: 'shift',
      backgroundColor: '#e3e4e5',
    },

    yAxis: [
      {
        visible: false,
      },
      {
        visible: false,
      },
      {
        visible: false,
      },
    ],

    xAxis: {
      type: 'datetime',
      plotLines: [
        {
          value: Date.now() + offset * 60000,
          color: 'red',
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

    series: series,

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
    Highcharts.chart('container', json);
  }
  if (document.getElementById('containerStockcharts')) {
    Highcharts.stockChart('containerStockcharts', json);
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
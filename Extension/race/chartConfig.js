/**
 * Generates Highcharts config based on given data.
 * All incoming date strings are expected in GMT.
 * Chart is configured to show everything in local user timezone
 *
 * @param {Object} params
 * @param {string} params.title chart title
 * @param {number} params.nextLeagueRaceTime timestamp of next race, epoch seconds
 * @param {Object[]} params.plotBands daylight data
 * @param {Object[]} params.series chart lines data
 * @returns {Object}
 */
function makeChartConfig({ title, nextLeagueRaceTime, plotBands, series }) {
  const setup = {
    accessibility: {
      enabled: false
    },
    title: {
      text: ''
    },
    subtitle: {
      text: title
    },
    chart: {
      type: 'spline',
      zoomType: 'x',
      panning: true,
      panKey: 'shift',
      backgroundColor: '#e3e4e5'
    },
    yAxis: new Array(4).fill({ visible: false }, 0, 4),
    xAxis: {
      type: 'datetime',
      plotLines: [
        {
          value: new Date(),
          color: 'rgba(200, 10, 0, .7)',
          width: 2,
          label: {
            text: 'Now',
            rotation: 0,
            y: 20
          },
          zIndex: 500
        },
        {
          value: new Date(nextLeagueRaceTime * 1000),
          color: 'rgba(71, 115, 55, .6)',
          width: 2,
          label: {
            text: 'Race Time',
            rotation: 0
          },
          zIndex: 500
        }
      ],
      plotBands
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false
        },
        label: {
          connectorAllowed: false
        }
      }
    },
    series,
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 800
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }
      ]
    },
    time: {
      timezoneOffset: new Date().getTimezoneOffset()
    },
    tooltip: {
      shared: true,
      crosshairs: true
    },
    caption: {
      text: '<b> Click and drag in the chart to zoom in and inspect the data.</b>'
    }
  };

  return setup;
}

export {
  makeChartConfig
};

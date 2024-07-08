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
 * @param {Boolean} params.darkmode true dark mode is on
 * @returns {Object}
 */
function makeChartConfig({ title, nextLeagueRaceTime, plotBands, series, darkmode }) {

  const colorMap = {
    false: {backgroundColor:"#e3e4e5",textColor:"black"},
    true : {backgroundColor:"#202020",textColor:"#ffffffe0"},
  }
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
      backgroundColor: colorMap[darkmode].backgroundColor
    },
    yAxis: new Array(4).fill({ visible: false }, 0, 4),
    xAxis: {
      type: 'datetime',
      labels:{
        style: {
          color: colorMap[darkmode].textColor
      }
      },
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
      itemStyle: {
        color: colorMap[darkmode].textColor
    },
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

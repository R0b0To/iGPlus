/**
 * Generates Plotly config based on given data.
 *
 * @param {Object} params
 * @param {string} params.title chart title
 * @param {number} params.nextLeagueRaceTime timestamp of next race, epoch seconds
 * @param {Object[]} params.traces chart line data for Plotly
 * @param {Boolean} params.darkmode true if dark mode is on
 * @returns {Object} { plotlyData, plotlyLayout }
 */
function makePlotlyConfig({ title, nextLeagueRaceTime, traces, darkmode }) {
  const colorMap = {
    false: { backgroundColor: "#1c3456", textColor: "#ffffffe0" },
    true: { backgroundColor: "#202020", textColor: "#ffffffe0" },
  };

  const now = new Date();
  const raceTime = new Date(nextLeagueRaceTime * 1000);

  const layout = {
    title: {
      text: title,
      font: { color: colorMap[darkmode].textColor },
    },
    xaxis: {
      type: 'date',
      tickformat: '%d (%H:%M)',
      gridcolor: darkmode ? '#404040' : '#2b4062',
      zeroline: false,
    },
    yaxis: {
      title: 'Temperature',
      gridcolor: darkmode ? '#404040' : '#2b4062',
      tickfont: { color: colorMap[darkmode].textColor },
      titlefont: { color: colorMap[darkmode].textColor },
      showticklabels: false,
    },
    yaxis2: {
      title: 'Precipitation',
      overlaying: 'y',
      side: 'right',
      tickfont: { color: colorMap[darkmode].textColor },
      titlefont: { color: colorMap[darkmode].textColor },
      showticklabels: false,
    },
    plot_bgcolor: colorMap[darkmode].backgroundColor,
    paper_bgcolor: colorMap[darkmode].backgroundColor,
    font: { color: colorMap[darkmode].textColor },
    hovermode: 'x unified',
    legend: {
      x: 0.98,
      y: 0.98,
      xanchor: 'right',
      yanchor: 'top',
      bgcolor: colorMap[darkmode].backgroundColor,
      bordercolor: colorMap[darkmode].textColor,
      borderwidth: 1,
    },
    shapes: [
      {
        type: 'line',
        x0: now,
        x1: now,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: 'rgba(200, 10, 0, .7)', width: 2 },
        name: 'Now',
      },
      {
        type: 'line',
        x0: raceTime,
        x1: raceTime,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: 'rgba(71, 115, 55, .6)', width: 2 },
        name: 'Race Time',
      },
    ],
    margin: { l: 10, r: 10, t: 85, b: 100 },
    dragmode: 'zoom',
  };

  return {
    plotlyData: traces,
    plotlyLayout: layout,
  };
}

export {
  makePlotlyConfig
};

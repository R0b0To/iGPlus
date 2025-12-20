//latitude, longitude
const raceTrackCoords = {
  1: [-37.84, 144.96], //australia
  2: [2.74, 101.72], //malaysia
  3: [31.32, 121.21], //china
  4: [26.02, 50.51], //bahrain
  5: [41.55, 2.25], //spain
  6: [43.7347, 7.4206], //monaco
  7: [40.93, 29.42], //turkey
  9: [49.32, 8.55], //germany
  10: [47.6, 19.24], //hungary
  11: [39.47, -0.38], //europe
  12: [50.39, 5.93], //belgium
  13: [45.58, 9.27], //italy
  14: [1.29, 103.86], //singapore
  15: [34.84, 136.55], //japan
  16: [-23.7, -46.7], //brazil
  17: [24.45, 54.38], //abu
  18: [52.08, -1.02], //gb
  19: [43.2, 5.8], //france
  20: [47.21, 14.79], //austria
  21: [45.5, -73.56], //canada
  22: [40.3777, 49.892], //azerbaijan
  23: [19.4, -99.09], //mexico
  24: [43.59, 39.72], //russia
  25: [30.17, -97.62], //usa
  26: [52.23, 4.32] //netherlands
};

const weatherStats = {
  'temperature': {
    color: Highcharts.getOptions().colors[3],
    darkcolor:Highcharts.getOptions().colors[3],
    title: 'temperature',
    unit: '°'
  },
  'humidity': {
    color: '#48352D',
    darkcolor:"#ffffffe0",
    title: 'humidity'
  },
  'precipitation': {
    type: 'area',
    color: Highcharts.getOptions().colors[0],
    darkcolor:Highcharts.getOptions().colors[0],
    unit: 'mm'
  },
  'cloudcover': {
    color: '#F7FEFF',
    darkcolor:"#F7FEFF",
    type: 'area',
    title: 'cloudcover'
  }
};


export {
  raceTrackCoords,
  weatherStats
};

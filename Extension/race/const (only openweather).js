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
};

const weatherStats = {
  'temperature': {
    color: Highcharts.getOptions().colors[3],
    title: 'temperature'
  },
  'relativehumidity_2m': {
    color: '#48352D',
    title: 'humidity'
  },
  'precipitation': {
    type: 'area',
    color: Highcharts.getOptions().colors[0]
  },
  'cloudcover': {
    color: '#00ff4733',
    type: 'area',
    title: 'cloudcover'
  }
};

const weatherCodes = {
  0: 'fair',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  56: 'light freezing drizzle',
  57: 'dense freezing drizzle',
  61: 'slight rain',
  63: 'moderate rain',
  65: 'heavy rain',
  66: 'light freezing rain',
  67: 'heavy freezing rain',
  71: 'slight snow fall',
  73: 'moderate snow fall',
  75: 'heavy snow fall',
  77: 'snow grains',
  80: 'slight rain showers',
  81: 'moderate rain showers',
  82: 'heavy rain showers',
  85: 'slight snow showers',
  86: 'heavy snow showers',
  95: 'slight to moderate thunderstorm',
  96: 'thunderstorm with slight hail',
  99: 'thunderstorm with heavy hail',
};

export {
  raceTrackCoords,
  weatherCodes,
  weatherStats
};

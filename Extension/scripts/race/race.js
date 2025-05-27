/**
 * Enhances the existing weather button and adds a new button for detailed weather charts.
 * Also prepares a container for these charts.
 */
function enhanceWeatherButtonAndContainer() {
  const raceInterfaceElement = document.getElementById('race');
  if (!raceInterfaceElement) return;

  const originalWeatherButton = raceInterfaceElement.querySelector('a'); // Assuming the first 'a' is the weather button.
  if (!originalWeatherButton || !originalWeatherButton.parentElement) return;

  // Modify the parent of the original weather button to accommodate more buttons.
  originalWeatherButton.parentElement.className = 'three-btn'; // Assuming this class helps in styling a 3-button layout.

  // Create a new button for showing detailed weather charts.
  const detailedWeatherChartButton = originalWeatherButton.cloneNode(true);
  detailedWeatherChartButton.textContent = 'Weather Charts'; // More descriptive text.
  detailedWeatherChartButton.href = '#'; // Prevent navigation.
  detailedWeatherChartButton.id = 'detailedWeatherChartButton'; // New ID.
  detailedWeatherChartButton.className = 'btn4 pushBtn'; // Classes for styling.
  detailedWeatherChartButton.addEventListener('click', displayWeatherCharts); // Renamed event handler.
  
  // Create a container for the weather charts. This container will be populated later.
  const weatherChartDisplayContainer = document.createElement('div');
  weatherChartDisplayContainer.id = 'weatherChartDisplayContainer'; // New ID.
  // Initially, the container might be hidden or styled via CSS.
  // weatherChartDisplayContainer.style.display = 'none'; // Example if it should start hidden.

  // Append the new button next to the original one.
  originalWeatherButton.parentElement.append(detailedWeatherChartButton);
  // Append the chart container. The original code appended it to parentElement.parentElement,
  // which might be high up. Consider a more specific target if needed.
  if (originalWeatherButton.parentElement.parentElement) {
    originalWeatherButton.parentElement.parentElement.append(weatherChartDisplayContainer);
  }
}

/**
 * Replaces the default plain circuit map with a more detailed version.
 * It derives the map code from the country flag image class.
 */
function replaceWithDetailedCircuitMap() {
  const countryFlagElement = document.querySelector('#race .flag');
  if (!countryFlagElement) return;

  // Extract map code (e.g., 'au' from 'flag-au').
  const mapCodeMatch = countryFlagElement.className.match(/flag-(\w+)/);
  if (!mapCodeMatch || !mapCodeMatch[1]) {
    // console.warn("Could not determine map code from flag element.");
    return;
  }
  const mapCode = mapCodeMatch[1];

  const circuitImageElement = document.querySelector('#race img:not(.flag)');
  if (!circuitImageElement) return;

  // Determine if dark mode is active to select the appropriate map image.
  // const isDarkModeActive = document.getElementById('igplus_darkmode'); // Example check for a dark mode indicator element.
  // circuitImageElement.src = chrome.runtime.getURL(`images/circuits/${mapCode}${isDarkModeActive ? '_dark' : ''}.png`);
  // For now, defaulting to dark map as per original uncommented line.
  circuitImageElement.src = chrome.runtime.getURL(`images/circuits/${mapCode}_dark.png`);
  
  // Apply styling to the new map image.
  circuitImageElement.style.width = '90%';
  circuitImageElement.style.margin = 'auto'; // Center the image.
}

/**
 * Adds numeric percentage values as text overlays on the circuit parameter rating bars.
 */
function addPercentageValuesToRatingBars() {
  // Helper function to create the span element for the value.
  function createValueDisplaySpan(percentageValue) {
    const valueSpan = document.createElement('span');
    valueSpan.classList.add('ratingBarPercentageValue'); // More descriptive class.
    valueSpan.textContent = percentageValue;
    return valueSpan;
  }

  // Check if values have already been added to prevent duplication.
  if (document.getElementsByClassName('ratingBarPercentageValue').length > 0) {
    return;
  }

  const ratingBarElements = document.querySelectorAll('#race .ratingBar');
  ratingBarElements.forEach((barElement) => {
    // The percentage value is assumed to be the width of the first child (the filled part of the bar).
    const filledBarPart = barElement.childNodes[0];
    if (filledBarPart && filledBarPart.style && filledBarPart.style.width) {
      barElement.classList.add('statBarWithValue'); // Original class for potential existing styles.
      barElement.appendChild(createValueDisplaySpan(filledBarPart.style.width));
    }
  });
}

/**
 * Toggles the visibility of the weather chart container and fetches/renders charts if becoming visible.
 */
async function displayWeatherCharts() {
  const chartContainer = document.getElementById('weatherChartDisplayContainer'); // Use new ID
  if (!chartContainer) return;

  // Toggle visibility
  const isCurrentlyVisible = chartContainer.style.visibility === 'visible';
  chartContainer.style.visibility = isCurrentlyVisible ? 'hidden' : 'visible';

  // If the container is now visible and not already populated (or needs refresh), fetch data and render.
  // A simple check could be if it has child elements (the chart).
  if (chartContainer.style.visibility === 'visible' && chartContainer.children.length === 0) {
    try {
      const weatherData = await fetchAllWeatherData();
      if (weatherData) {
        await renderWeatherCharts(weatherData.processedForecast, weatherData.nextLeagueRaceTime);
      }
    } catch (error) {
      // console.error("Error fetching or rendering weather charts:", error);
      chartContainer.textContent = 'Error loading weather data.'; // Display error in container
    }
  }
}

/**
 * Fetches all necessary data for weather chart generation.
 * @returns {Promise<object|null>} An object containing processed forecast and race time, or null on error.
 */
async function fetchAllWeatherData() {
  // Dynamically import fetcher functions and constants.
  const { fetchNextRace, fetchManagerData, fetchIGPRaceWeather, fetchIGPRaceWeatherNow } = await import(
    chrome.runtime.getURL('common/fetcher.js')
  );
  const { raceTrackCoords } = await import(chrome.runtime.getURL('scripts/race/const.js'));

  // Fetch manager data to get temperature format preference.
  const managerInfo = await fetchManagerData();
  if (!managerInfo || !managerInfo.manager) {
    // console.error("Failed to fetch manager data.");
    return null;
  }
  
  // Fetch next race time.
  const nextRaceInfo = await fetchNextRace();
  if (!nextRaceInfo || typeof nextRaceInfo.nextLeagueRaceTime === 'undefined') {
    // console.error("Failed to fetch next league race time.");
    return null;
  }
  const { nextLeagueRaceTime } = nextRaceInfo;

  // Determine Track ID from URL.
  const circuitLinkElement = document.querySelector('a[href*="circuit&id="]');
  if (!circuitLinkElement) {
    // console.error("Track ID link not found on page.");
    return null;
  }
  const trackID = new URLSearchParams(circuitLinkElement.href).get('id');
  if (!raceTrackCoords[trackID]) {
    // console.error(`Coordinates for track ID ${trackID} not found.`);
    return null;
  }

  // Prepare parameters for weather API.
  const weatherApiParams = {
    lat: raceTrackCoords[trackID][0],
    lon: raceTrackCoords[trackID][1],
    temp: managerInfo.manager.format.temperature, // User's preferred temperature unit.
  };

  // Fetch current weather and forecast.
  const currentWeather = await fetchIGPRaceWeatherNow(weatherApiParams);
  const forecastWeather = await fetchIGPRaceWeather(weatherApiParams);

  if (!currentWeather || !forecastWeather || !forecastWeather.list) {
    // console.error("Failed to fetch current or forecast weather data.");
    return null;
  }

  // Combine current weather with forecast list.
  forecastWeather.list.unshift(currentWeather);
  
  return { processedForecast: forecastWeather, nextLeagueRaceTime };
}


/**
 * Prepares series data for Highcharts from the processed forecast data.
 * @param {object} processedForecast - The combined weather data (current + forecast).
 * @param {boolean} isDarkMode - Flag indicating if dark mode is active for color selection.
 * @param {object} weatherStatsConstants - Constants for weather types (color, unit, type).
 * @returns {Array<object>} An array of series objects for Highcharts.
 */
function prepareChartSeriesData(processedForecast, isDarkMode, weatherStatsConstants) {
  // Helper to extract relevant data points from each forecast entry.
  function extractDataPoints(forecastList) {
    return forecastList.map(entry => ({
      date: entry.dt, // Timestamp
      temperature: entry.main.temp,
      // Safely access precipitation data, defaulting to 0 if not available.
      precipitation: entry.rain?.['3h'] ?? entry.snow?.['3h'] ?? entry.rain?.['1h'] ?? entry.snow?.['1h'] ?? 0,
      // humidity: entry.main.humidity // Example: if humidity was needed.
    }));
  }
  
  const chartRelevantData = extractDataPoints(processedForecast.list);
  if (chartRelevantData.length === 0) return [];

  const pointStart = new Date(chartRelevantData[0].date * 1000).getTime();
  const pointInterval = chartRelevantData.length > 1 
    ? new Date(chartRelevantData[1].date * 1000).getTime() - pointStart 
    : 3 * 60 * 60 * 1000; // Default to 3 hours if only one point.

  // Dynamically create series based on available keys in the first data point (excluding 'date').
  return Object.keys(chartRelevantData[0])
    .filter(key => key !== 'date' && weatherStatsConstants[key]) // Ensure key is plottable and has constants
    .map(key => {
      const stats = weatherStatsConstants[key];
      return {
        name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize name for display
        yAxis: key === 'precipitation' ? 1 : 0, // Use secondary yAxis for precipitation
        data: chartRelevantData.map(entry => entry[key]),
        color: isDarkMode ? stats.darkcolor : stats.color,
        type: stats.type,
        pointStart,
        pointInterval,
        tooltip: {
          valueSuffix: ` ${stats.unit}`,
        },
      };
    });
}

/**
 * Renders weather charts using Highcharts with the provided data.
 * @param {object} processedForecast - The combined weather data (current + forecast).
 * @param {number} nextLeagueRaceTimeEpoch - Timestamp for the next league race (for plot bands).
 */
async function renderWeatherCharts(processedForecast, nextLeagueRaceTimeEpoch) {
  // Dynamically import constants and chart configuration utilities.
  const { weatherStats: weatherStatsConstants } = await import(chrome.runtime.getURL('scripts/race/const.js'));
  const { makeChartConfig } = await import(chrome.runtime.getURL('scripts/race/chartConfig.js'));

  const isDarkModeActive = !!document.getElementById('igplus_darkmode'); // Simpler boolean check.
  
  const chartSeries = prepareChartSeriesData(processedForecast, isDarkModeActive, weatherStatsConstants);
  if (chartSeries.length === 0) {
    // console.warn("No series data could be prepared for weather charts.");
    return;
  }

  // Placeholder for plotBands if specific event times need to be highlighted.
  const plotBands = []; 
  // Example: if (nextLeagueRaceTimeEpoch) { plotBands.push({ from: nextLeagueRaceTimeEpoch, to: nextLeagueRaceTimeEpoch + (hourInMs), color: 'rgba(100,0,0,0.1)', label: { text: 'Race Start' } }); }

  const { city } = processedForecast;
  const currentWeatherData = processedForecast.list[0];
  // Construct chart title with current weather summary.
  const chartTitle = `${currentWeatherData.main.temp}°${manager.format.temperature === 'F' ? 'F' : 'C'} ${currentWeatherData.weather[0].main} - ${city.name} (${city.coord.lat.toFixed(2)}°, ${city.coord.lon.toFixed(2)}°)`;
  
  const chartConfigOptions = makeChartConfig({
    title: chartTitle,
    nextLeagueRaceTime: nextLeagueRaceTimeEpoch, // Pass epoch time directly
    plotBands,
    series: chartSeries,
    darkmode: isDarkModeActive,
  });

  const chartContainerElement = document.getElementById('weatherChartDisplayContainer');
  if (chartContainerElement) {
    Highcharts.chart(chartContainerElement, chartConfigOptions); // Use the new container ID
  }
}

/**
 * Initializes all custom features for the race page.
 * It attempts to apply enhancements once the necessary DOM elements are available,
 * with a short delay to allow for initial page rendering.
 */
async function initializeRacePageFeatures() {
  // Wait for a short period to allow initial DOM rendering.
  await new Promise(resolve => setTimeout(resolve, 200));

  // Check if the main weather chart button (which acts as a marker for initialization) is already present.
  // Using the new ID for the detailed weather chart button.
  if (!document.getElementById('detailedWeatherChartButton')) {
    enhanceWeatherButtonAndContainer(); 
    replaceWithDetailedCircuitMap();    
    addPercentageValuesToRatingBars();  
  } else {
    // console.log("Race page features already initialized or marker element 'detailedWeatherChartButton' found.");
  }
  // Note on retry logic:
  // The original IIFE had a simple delay. This refactored version maintains that simple delay.
  // For pages where elements might appear much later due to heavy dynamic content loading,
  // a more robust solution like a MutationObserver targeting a parent element,
  // or a polling mechanism (e.g., using requestAnimationFrame with a timeout/retry limit),
  // would be more appropriate than just a single delayed check.
}

// Execute the initialization function for the race page features.
// Basic error catching for the initialization process.
initializeRacePageFeatures().catch(error => {
  // console.error("Error initializing race page features:", error);
});

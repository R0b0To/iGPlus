/**
 * Calculates the base fuel consumption rate based on the car's fuel economy rating.
 * The formula appears to be an empirically derived power function, with coefficients adjusted for different ranges of fuel economy.
 * @param {number} fuelEconomyRating - The fuel economy rating of the car (e.g., from 1 to 300+).
 * @returns {number} The calculated base fuel consumption rate (likely in units like Liters/Kilometer or similar).
 */
function calculateBaseFuelConsumptionRate(fuelEconomyRating) {
  // This constant (0.6666, roughly 2/3) might be a scaling factor for the fuel economy rating
  // before applying the power function, or part of the curve fitting.
  const RATING_SCALE_FACTOR = 0.6666; 
  // This constant (0.669 or 0.697) appears to be a final multiplier or base rate for the consumption.
  let finalMultiplier = 0.669;
  let exponent;

  switch (true) {
    // Commented out cases from original code - kept for reference if behavior needs to be matched or understood.
    /* case fuelEconomyRating >= 180:
        case fuelEconomyRating >= 160:
        case fuelEconomyRating >= 140:
        case fuelEconomyRating >= 120:
          return ((fuelEconomyRating ** -0.089) * 0.679); */

    // For very high fuel economy ratings (200 and above)
    case fuelEconomyRating >= 200: // Covers 250+ and 200-249 ranges with same formula
      exponent = -0.08434;
      break;
    // For high fuel economy ratings (150-199)
    case fuelEconomyRating >= 150:
      exponent = -0.08473;
      break;
    // For medium-high fuel economy ratings (60-149)
    case fuelEconomyRating >= 60: // Covers 100-149, 80-99, 60-79 ranges with same formula
      exponent = -0.08505;
      break;
    // For medium fuel economy ratings (40-59) - noted as "very good" in original comments
    case fuelEconomyRating >= 40:
      exponent = -0.0842;
      break;
    // For low-medium fuel economy ratings (20-39)
    case fuelEconomyRating >= 20:
      exponent = -0.083;
      break;
    // For very low fuel economy ratings (1-19)
    default:
      exponent = -0.11;
      finalMultiplier = 0.697; // A different multiplier for the lowest range
      break;
  }
  // The core formula: (scaleFactor * rating) ^ exponent * finalMultiplier
  return ((RATING_SCALE_FACTOR * fuelEconomyRating) ** exponent) * finalMultiplier;
}

/**
 * Calculates the estimated tyre wear percentage after a certain number of laps.
 * This complex function considers tyre compound, track characteristics, car economy,
 * weather, push levels, and race length.
 * @param {string} tyreCompound - The tyre compound code (e.g., 'SS', 'S', 'M', 'H').
 * @param {number|string} numberOfLaps - The number of laps for the stint.
 * @param {object} trackData - Object containing track-specific data (avg temperature, wear factor, length).
 * @param {object} carEconomyData - Object containing car's tyre economy (te) and current push level index (push).
 * @param {number} raceLengthMultiplier - A multiplier based on the total race length.
 * @returns {string} The estimated tyre wear percentage, formatted to two decimal places.
 */
function calculateTyreWearPercentage(tyreCompound, numberOfLaps, trackData, carEconomyData, raceLengthMultiplier) {
  // Ensure numberOfLaps is a number.
  const laps = Number(numberOfLaps);

  // --- Step 1: Determine Weather and Optimal Push Offset ---
  // TODO: If wear is needed for strategy preview where live weather isn't available,
  // this needs a way to use a default or requested weather value.
  const currentTemperatureCelsius = convertToCelsius(
    document.getElementsByClassName('pWeather text-right green')[0]?.lastChild.textContent ?? '25'
  );

  // Optimal push offset calculation based on average track temp and current weather.
  // This determines a baseline push level for optimal tyre performance.
  const optimalPushOffset = -0.0323 * trackData.avg + 10.9 - (currentTemperatureCelsius / 10);
  
  // Tyre specific scaling factor relative to the optimal push offset.
  // Softer tyres (SS, S) prefer a slightly lower push offset than optimal, harder ones (M, H) slightly higher.
  const tyrePerformanceScale = {
    SS: optimalPushOffset - 1, // SuperSoft
    S: optimalPushOffset,      // Soft
    M: optimalPushOffset + 1,  // Medium
    H: optimalPushOffset + 2,  // Hard
    I: optimalPushOffset + 1,  // Intermediate (assumed similar to Medium for this scale)
    W: optimalPushOffset + 1   // Wet (assumed similar to Medium for this scale)
  };

  // --- Step 2: Calculate Push Decay Factor ---
  // Difference between the tyre's preferred scale and the car's current push level.
  // carEconomyData.push is an index (0-4, where 0 is highest push, 4 is lowest). We map it to 5 (highest) to 1 (lowest).
  const actualPushLevelEffect = 5 - carEconomyData.push; 
  const pushDifferenceFromOptimal = tyrePerformanceScale[tyreCompound] - actualPushLevelEffect;

  let pushRelatedDecayFactor = 0;
  // This switch determines an additional decay factor based on how far the actual push level
  // deviates from the tyre's optimal preference.
  switch (true) {
    case pushDifferenceFromOptimal >= 1 && pushDifferenceFromOptimal <= 2: pushRelatedDecayFactor = 0.3; break;
    case pushDifferenceFromOptimal > 2 && pushDifferenceFromOptimal <= 3:  pushRelatedDecayFactor = 0.5; break; // Corrected: was >=2
    case pushDifferenceFromOptimal > 3:                                   pushRelatedDecayFactor = 1.5; break; // Corrected: was >=3
    case pushDifferenceFromOptimal >= 0 && pushDifferenceFromOptimal < 1:  pushRelatedDecayFactor = 0; break;   // Corrected: was <=1
    case pushDifferenceFromOptimal >= -1 && pushDifferenceFromOptimal < 0: pushRelatedDecayFactor = -0.3; break; // Corrected: was <=0
    case pushDifferenceFromOptimal >= -2 && pushDifferenceFromOptimal < -1:pushRelatedDecayFactor = -0.8; break; // Corrected: was <=-1
    case pushDifferenceFromOptimal < -2:                                  pushRelatedDecayFactor = -1.5; break; // Corrected: was <=-2
    default: pushRelatedDecayFactor = 0; break;
  }

  // --- Step 3: Calculate Base Wear Rate per Lap ('t' in original) ---
  // Tyre compound specific wear factors. Softer tyres wear faster.
  const tyreCompoundWearFactors = { SS: 2.14, S: 1.4, M: 1, H: 0.78 };
  const baseTyreCompoundWear = tyreCompoundWearFactors[tyreCompound] ?? 1; // Default to 1 if compound unknown.

  const trackWearFactor = trackData.wear;
  const trackLengthKm = trackData.length;
  const carTyreEconomyRating = carEconomyData.te;

  // Core formula for base wear rate per lap, considering car tyre economy, track wear, length, and compound.
  // Formula: (A * carTyreEconomy ^ B) * (C * trackWearFactor + D) * trackLengthKm * raceLengthMultiplier * baseTyreCompoundWear
  // Constants from original formula:
  const A = 1.29;
  const B = -0.0696;
  const C = 0.00527;
  const D = 0.556;
  const baseWearRatePerLap = 
    (A * (carTyreEconomyRating ** B)) * 
    (C * trackWearFactor + D) * 
    trackLengthKm * 
    raceLengthMultiplier * 
    baseTyreCompoundWear;

  // --- Step 4: Calculate Final Wear Percentage ---
  // The original code had multiple stint wear calculations (stint, stint2, stint3).
  // `stint3` (calling `calculateWear`, now `applyLapsToWearRate`) was the one used for the final "average".
  // The "average" was `((stint + stint) / 2).toFixed(2)`, which is just `stint.toFixed(2)`.
  // This suggests either `stint` or `stint3` was the intended primary calculation.
  // The `calculateWear` function (now `applyLapsToWearRate`) seems more aligned with applying per-lap effects.
  // Let's assume the logic encapsulated in `applyLapsToWearRate` is the primary one.
  
  // The `stint` calculation from original: Math.exp(1) ** ((-baseWearRatePerLap / 100 * 1.18) * laps) * 100;
  // This is an exponential decay formula. Let's call it `exponentialDecayWear`.
  const EXP_DECAY_FACTOR = 1.18; // Another magic number from the original 'stint' formula.
  const exponentialDecayWear = (Math.E ** ((-baseWearRatePerLap / 100 * EXP_DECAY_FACTOR) * laps)) * 100;

  // The `stint3` calculation (now `applyLapsToWearRate`):
  const calculatedWearPercentage = applyLapsToWearRate(laps, baseWearRatePerLap, pushRelatedDecayFactor, pushDifferenceFromOptimal);
  
  // The original code returned `average` which was just `stint.toFixed(2)`.
  // This implies the exponentialDecayWear was the one intended for the final result, despite `stint3` being calculated.
  // This is confusing. If `stint3` (from `calculateWear`) is the more "correct" formula considering push decay,
  // then that should be returned. If the simpler exponential decay is preferred, then `calculateWear` might be redundant or for comparison.
  // Given the complexity introduced by `pushRelatedDecayFactor` and `pushDifferenceFromOptimal` in `calculateWear`,
  // it's likely that `calculatedWearPercentage` is the more refined value.
  // However, to match the original output which returned `average = ((stint + stint) / 2).toFixed(2)`,
  // we must return `exponentialDecayWear.toFixed(2)`.
  // This suggests `calculateWear` (now `applyLapsToWearRate`) might have been an alternative calculation or debug code.
  // For this refactoring, I will return the result that matches the original code's effective output.
  // A TODO should be added to clarify which wear calculation is canonical.
  // TODO: Clarify the canonical tyre wear calculation. The original code effectively returned `exponentialDecayWear`,
  // but also calculated `calculatedWearPercentage` (from old `calculateWear`) which includes more factors.
  return exponentialDecayWear.toFixed(2); 
}

/**
 * Applies the effect of multiple laps on a base wear rate, considering push level effects.
 * Original name: calculateWear
 * @param {number} numberOfLaps - Number of laps in the stint.
 * @param {number} baseWearRatePerLap - The base wear rate per lap (like 't' from original).
 * @param {number} pushRelatedDecayFactor - An additional decay factor related to push level.
 * @param {number} pushDifferenceFromOptimal - The difference between tyre's optimal push and actual push.
 * @returns {number} The remaining tyre percentage after N laps.
 */
function applyLapsToWearRate(numberOfLaps, baseWearRatePerLap, pushRelatedDecayFactor, pushDifferenceFromOptimal) {
  let effectiveWearRate = baseWearRatePerLap / 100; // Convert percentage to decimal for calculation
  let additionalFactor = pushRelatedDecayFactor / 100; // Convert percentage to decimal

  // Special condition from original: if pushing hard on tyres not suited for it (large negative diff) for many laps.
  // This applies an additional penalty.
  const WEAR_PENALTY_THRESHOLD_LAPS = 3;
  const WEAR_PENALTY_DIFF_THRESHOLD = -2;
  const ADDITIONAL_WEAR_PENALTY = 0.013; // 1.3% additional wear per lap in this condition

  if (numberOfLaps > WEAR_PENALTY_THRESHOLD_LAPS && pushDifferenceFromOptimal <= WEAR_PENALTY_DIFF_THRESHOLD) {
    // The original formula was: ((1 - wear/100 + push/100 -0.013)** n)*100
    // This implies the penalty is *subtracted* from the (1 - wear_rate) factor, thus increasing wear.
    // So, effectiveWearRate should increase, or (1 - effectiveWearRate) should decrease.
    // Let's adjust the term that gets subtracted from 1.
    // (1 - (effectiveWearRate - additionalFactor + ADDITIONAL_WEAR_PENALTY))
    // This seems complex. Let's simplify: the (1 - rate) term is the retention per lap.
    // (retention_rate - PENALTY) ^ n
    let retentionPerLap = 1 - (effectiveWearRate - additionalFactor); // Note: pushRelatedDecayFactor can be negative, increasing retention.
    retentionPerLap -= ADDITIONAL_WEAR_PENALTY;
    return (retentionPerLap ** numberOfLaps) * 100;
  } else {
    // Standard calculation: ( (1 - (baseWear/100) + (pushDecay/100) ) ^ numLaps ) * 100
    // (1 - effectiveWearRate + additionalFactor) is the percentage of tyre remaining each lap.
    return ((1 - (effectiveWearRate - additionalFactor)) ** numberOfLaps) * 100;
  }
  // Original commented-out code for further adjustment - kept for reference.
  /* if(lapWear<60)
        lapWear = ((1 - wear/100 + push/100 -0.002)** n)*100;
  console.log(lapWear)*/
}


export{
  calculateBaseFuelConsumptionRate, // Renamed from fuel_calc
  calculateTyreWearPercentage     // Renamed from get_wear
};

/**
 * Converts a temperature string (e.g., "25°C" or "77°F") to Celsius.
 * @param {string} temperatureString - The temperature string to convert.
 * @returns {number|null} The temperature in Celsius, or null if the format is invalid or input is not a string.
 */
function convertToCelsius(temperatureString) {
  if (typeof temperatureString !== 'string') {
    // console.warn("Invalid input: temperatureString must be a string.");
    return null; 
  }
  const trimmedTemperatureString = temperatureString.trim();

  // Check for Fahrenheit format (e.g., "77°F") - case-insensitive 'F'.
  if (/^\d+°F$/i.test(trimmedTemperatureString)) { 
    const fahrenheitValue = parseInt(trimmedTemperatureString, 10); // Specify radix 10
    // Formula: (F - 32) * 5/9 = C
    const celsiusValue = Math.round(((fahrenheitValue - 32) * 5) / 9);
    return celsiusValue;
  // Check for Celsius format (e.g., "25°C") - case-insensitive 'C'.
  } else if (/^\d+°C$/i.test(trimmedTemperatureString)) { 
    return parseInt(trimmedTemperatureString, 10); // Specify radix 10
  } else {
    // Invalid format or units not recognized
    // console.warn(`Invalid temperature format: ${trimmedTemperatureString}`);
    return null;
  }
}
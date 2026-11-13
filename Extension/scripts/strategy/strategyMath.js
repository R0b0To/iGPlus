// ============================================================
// CONSTANTS
// ============================================================

const MULTIPLIERS = { 100: 1, 75: 1.25, 50: 1.5, 25: 3 };

const DEFAULT_TYRE_WEAR_MODEL = {
  compoundFactors: { SS: 2.14, S: 1.4, M: 1, H: 0.78, I: 1, W: 1 },
  tyreEconomyCoefficient: 1.29,
  tyreEconomyExponent: -0.0696,
  trackWearCoefficient: 0.00527,
  trackWearBase: 0.556,
  degradationScale: 1.18,
  temperatureSensitivity: 0,
  pushSensitivity: 0,
  raceLengthMultipliers: { 100: 1, 75: 1.25, 50: 1.5, 25: 3 },
};

const PUSH_DECAY_THRESHOLDS = [
  { min:  3,        max:  Infinity, value:  1.5 },
  { min:  2,        max:  3,        value:  0.5 },
  { min:  1,        max:  2,        value:  0.3 },
  { min:  0,        max:  1,        value:  0   },
  { min: -1,        max:  0,        value: -0.3 },
  { min: -2,        max: -1,        value: -0.8 },
  { min: -Infinity, max: -2,        value: -1.5 },
];

const DEFAULT_WEATHER_CELSIUS = 25;

// ============================================================
// UTILITIES
// ============================================================

function convertToCelsius(temperature) {
  const str = temperature?.trim() ?? '';
  const fahrenheitMatch = str.match(/^(\d+)°F$/);
  if (fahrenheitMatch) return Math.round(((+fahrenheitMatch[1] - 32) * 5) / 9);
  const celsiusMatch = str.match(/^(\d+)°C$/);
  if (celsiusMatch) return parseInt(celsiusMatch[1]);
  return null;
}

function getCurrentTemperatureCelsius() {
  const raw = document.querySelector('.pWeather.text-right.green')?.lastChild?.textContent;
  return convertToCelsius(raw) ?? DEFAULT_WEATHER_CELSIUS;
}

function getPushDecay(diff) {
  return PUSH_DECAY_THRESHOLDS.find(({ min, max }) => diff >= min && diff < max)?.value ?? 0;
}

// ============================================================
// FUEL CALCULATION
// ============================================================

function fuel_calc(f, tyreCoefficient) {
  return Object.fromEntries(
    Object.entries(tyreCoefficient).map(([tyre, [coef, exp]]) => [tyre, coef * f ** exp])
  );
}

// ============================================================
// WEAR CALCULATION
// ============================================================

function get_wear(tyre, laps, track_info, car_economy, multiplierKey, wearModel = DEFAULT_TYRE_WEAR_MODEL, pushLevel = 60) {
  const weatherNow = getCurrentTemperatureCelsius();
  const optimal    = -0.0323 * track_info.avg + 10.9 - (weatherNow / 10);

  const tyreScale = {
    SS: optimal - 1, S: optimal,     M: optimal + 1,
    H:  optimal + 2, I: optimal + 1, W: optimal + 1,
  };

  const diff      = tyreScale[tyre] - (5 - car_economy.push);
  const pushDecay = getPushDecay(diff);  // computed but reserved for calculateWear / future use

  const model = wearModel ?? DEFAULT_TYRE_WEAR_MODEL;
  const tyreWear = model.compoundFactors?.[tyre] ?? DEFAULT_TYRE_WEAR_MODEL.compoundFactors[tyre] ?? 1;
  const { wear: track_wear, length: track_length } = track_info;
  const raceLengthMultiplier =
    model.raceLengthMultipliers?.[multiplierKey] ??
    MULTIPLIERS[multiplierKey] ??
    1;
  // Optional context corrections default to 0, preserving the original formula.
  const temperatureCorrection = Math.max(
    0,
    1 + (model.temperatureSensitivity ?? 0) * (weatherNow - DEFAULT_WEATHER_CELSIUS)
  );
  const pushCorrection = Math.max(
    0,
    1 + (model.pushSensitivity ?? 0) * ((Number(pushLevel) - 60) / 40)
  );

  const t =
    ((model.tyreEconomyCoefficient ?? DEFAULT_TYRE_WEAR_MODEL.tyreEconomyCoefficient) *
      car_economy.te ** (model.tyreEconomyExponent ?? DEFAULT_TYRE_WEAR_MODEL.tyreEconomyExponent)) *
    ((model.trackWearCoefficient ?? DEFAULT_TYRE_WEAR_MODEL.trackWearCoefficient) * track_wear +
      (model.trackWearBase ?? DEFAULT_TYRE_WEAR_MODEL.trackWearBase)) *
    track_length                       *
    raceLengthMultiplier               *
    tyreWear                           *
    temperatureCorrection              *
    pushCorrection;

  // Primary wear formula (exponential decay)
  const stint = Math.E ** ((-t / 100 * (model.degradationScale ?? DEFAULT_TYRE_WEAR_MODEL.degradationScale)) * laps) * 100;

  return ((stint + stint) / 2).toFixed(2);  // == stint.toFixed(2); preserved as-is
}

function calculateWear(laps, wear, push, diff) {
  const base       = 1 - wear / 100 + push / 100;
  const adjustment = laps > 3 && diff <= -2 ? -0.013 : 0;
  return ((base + adjustment) ** laps) * 100;
}

// ============================================================
// EXPORTS
// ============================================================

export { DEFAULT_TYRE_WEAR_MODEL, fuel_calc, get_wear, convertToCelsius, getPushDecay, calculateWear };
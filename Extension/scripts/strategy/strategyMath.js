// ============================================================
// CONSTANTS
// ============================================================

const MULTIPLIERS = { 100: 1, 75: 1.25, 50: 1.5, 25: 3 };

const TYRE_WEAR_FACTORS = { SS: 2.14, S: 1.4, M: 1, H: 0.78 };

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

function get_wear(tyre, laps, track_info, car_economy, multiplierKey) {
  const weatherNow = getCurrentTemperatureCelsius();
  const optimal    = -0.0323 * track_info.avg + 10.9 - (weatherNow / 10);

  const tyreScale = {
    SS: optimal - 1, S: optimal,     M: optimal + 1,
    H:  optimal + 2, I: optimal + 1, W: optimal + 1,
  };

  const diff      = tyreScale[tyre] - (5 - car_economy.push);
  const pushDecay = getPushDecay(diff);  // computed but reserved for calculateWear / future use

  const tyreWear = TYRE_WEAR_FACTORS[tyre] ?? 1;
  const { wear: track_wear, length: track_length } = track_info;

  const t =
    (1.29 * car_economy.te ** -0.0696) *
    (0.00527 * track_wear + 0.556)     *
    track_length                       *
    MULTIPLIERS[multiplierKey]         *
    tyreWear;

  // Primary wear formula (exponential decay)
  const stint = Math.E ** ((-t / 100 * 1.18) * laps) * 100;

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

export { fuel_calc, get_wear, convertToCelsius, getPushDecay, calculateWear };
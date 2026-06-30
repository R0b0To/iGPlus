import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  fuel_calc,
  get_wear,
  convertToCelsius,
  getPushDecay,
  calculateWear,
} from '../Extension/scripts/strategy/strategyMath.js';

/**
 * get_wear reads the current track temperature via
 * `document.querySelector('.pWeather.text-right.green')`. There is no DOM
 * in a plain Node/Vitest run, so we install a minimal fake `document` for
 * the duration of each test and remove it afterward. This keeps the test
 * file dependency-free (no jsdom) while still exercising the real
 * `get_wear` code path, including its DOM read.
 *
 * To stub a temperature reading, call `setFakeWeatherText('25°C')` (or
 * `null` to simulate "no weather widget present", which falls back to the
 * module's DEFAULT_WEATHER_CELSIUS of 25°C).
 */
function installFakeDocument() {
  globalThis.document = {
    _weatherText: null,
    querySelector(selector) {
      if (selector === '.pWeather.text-right.green') {
        if (this._weatherText === null) return null;
        return { lastChild: { textContent: this._weatherText } };
      }
      return null;
    },
  };
}

function setFakeWeatherText(text) {
  globalThis.document._weatherText = text;
}

function removeFakeDocument() {
  delete globalThis.document;
}

beforeEach(() => {
  installFakeDocument();
});

afterEach(() => {
  removeFakeDocument();
});

// ============================================================
// fuel_calc — pure function, no DOM dependency
// ============================================================

describe('fuel_calc', () => {
  it('computes fuel-per-lap per tyre using coef * f^exp', () => {
    const coefficients = {
      M: [0.6983736841, -0.08510976572],
      S: [0.7, -0.09],
    };

    const result = fuel_calc(50, coefficients);

    // Golden values: coef * f^exp computed independently.
    // M: 0.6983736841 * 50^-0.08510976572
    expect(result.M).toBeCloseTo(0.6983736841 * Math.pow(50, -0.08510976572), 10);
    // S: 0.7 * 50^-0.09
    expect(result.S).toBeCloseTo(0.7 * Math.pow(50, -0.09), 10);
  });

  it('returns one entry per tyre in the input coefficient map', () => {
    const coefficients = {
      SS: [1, -0.1], S: [1, -0.1], M: [1, -0.1],
      H: [1, -0.1], I: [1, -0.1], W: [1, -0.1],
    };
    const result = fuel_calc(40, coefficients);
    expect(Object.keys(result).sort()).toEqual(['H', 'I', 'M', 'S', 'SS', 'W']);
  });

  it('is monotonically decreasing in f for a negative exponent (higher FE -> less fuel/lap)', () => {
    const coefficients = { M: [0.6983736841, -0.08510976572] };
    const low = fuel_calc(30, coefficients).M;
    const high = fuel_calc(80, coefficients).M;
    expect(high).toBeLessThan(low);
  });

  it('handles f = 1 (coef * 1^exp === coef)', () => {
    const coefficients = { M: [1.2345, -0.5] };
    const result = fuel_calc(1, coefficients);
    expect(result.M).toBeCloseTo(1.2345, 10);
  });
});

// ============================================================
// convertToCelsius — pure function, no DOM dependency
// ============================================================

describe('convertToCelsius', () => {
  it('parses a Celsius string directly', () => {
    expect(convertToCelsius('25°C')).toBe(25);
  });

  it('converts a Fahrenheit string to Celsius and rounds', () => {
    // 77°F -> 25°C exactly
    expect(convertToCelsius('77°F')).toBe(25);
  });

  it('rounds non-exact Fahrenheit conversions', () => {
    // 70°F -> 21.11°C -> rounds to 21
    expect(convertToCelsius('70°F')).toBe(21);
  });

  it('returns null for unparseable input', () => {
    expect(convertToCelsius('warm')).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(convertToCelsius(undefined)).toBeNull();
  });
});

// ============================================================
// getPushDecay — pure function, no DOM dependency
// ============================================================

describe('getPushDecay', () => {
  it('returns 1.5 for diff >= 3', () => {
    expect(getPushDecay(3)).toBe(1.5);
    expect(getPushDecay(10)).toBe(1.5);
  });

  it('returns 0 for diff in [0, 1)', () => {
    expect(getPushDecay(0)).toBe(0);
    expect(getPushDecay(0.5)).toBe(0);
  });

  it('returns -1.5 for diff < -2', () => {
    expect(getPushDecay(-2.1)).toBe(-1.5);
    expect(getPushDecay(-100)).toBe(-1.5);
  });

  it('is well-defined at every threshold boundary (no gaps)', () => {
    // Sweep across boundaries and confirm a value is always returned.
    for (let diff = -5; diff <= 5; diff += 0.5) {
      expect(getPushDecay(diff)).not.toBeUndefined();
    }
  });
});

// ============================================================
// calculateWear — pure function, no DOM dependency
// ============================================================

describe('calculateWear', () => {
  it('matches the documented formula for a simple case', () => {
    // base = 1 - 20/100 + 60/100 = 1.4; laps=2 (no adjustment, laps must be > 3)
    const result = calculateWear(2, 20, 60, 0);
    expect(result).toBeCloseTo(Math.pow(1.4, 2) * 100, 10);
  });

  it('applies the -0.013 adjustment when laps > 3 and diff <= -2', () => {
    const base = 1 - 20 / 100 + 60 / 100; // 1.4
    const result = calculateWear(5, 20, 60, -2);
    expect(result).toBeCloseTo(Math.pow(base - 0.013, 5) * 100, 10);
  });

  it('does not apply the adjustment when laps <= 3, even if diff <= -2', () => {
    const base = 1 - 20 / 100 + 60 / 100;
    const result = calculateWear(3, 20, 60, -2);
    expect(result).toBeCloseTo(Math.pow(base, 3) * 100, 10);
  });

  it('does not apply the adjustment when diff > -2, even if laps > 3', () => {
    const base = 1 - 20 / 100 + 60 / 100;
    const result = calculateWear(5, 20, 60, -1);
    expect(result).toBeCloseTo(Math.pow(base, 5) * 100, 10);
  });
});

// ============================================================
// get_wear — depends on document.querySelector for ambient temperature
// ============================================================

describe('get_wear', () => {
  const trackInfo = { avg: 200, wear: 50, length: 5 };
  const carEconomy = { te: 30, push: 3 };

  it('falls back to the default temperature (25°C) when no weather widget is present', () => {
    setFakeWeatherText(null);
    const withDefault = get_wear('M', 10, trackInfo, carEconomy, 100);

    setFakeWeatherText('25°C');
    const withExplicit25 = get_wear('M', 10, trackInfo, carEconomy, 100);

    expect(withDefault).toBe(withExplicit25);
  });

  it('returns a numeric string formatted to two decimal places', () => {
    setFakeWeatherText('22°C');
    const result = get_wear('M', 10, trackInfo, carEconomy, 100);
    expect(result).toMatch(/^-?\d+\.\d{2}$/);
  });

  it('produces less wear (higher remaining %) for more laps... actually decreases with more laps', () => {
    // The formula is an exponential decay: more laps -> lower remaining stint value.
    setFakeWeatherText('25°C');
    const fewLaps = parseFloat(get_wear('M', 5, trackInfo, carEconomy, 100));
    const manyLaps = parseFloat(get_wear('M', 20, trackInfo, carEconomy, 100));
    expect(manyLaps).toBeLessThan(fewLaps);
  });

  it('produces different results for different tyre compounds under the same conditions', () => {
    setFakeWeatherText('25°C');
    const soft = get_wear('SS', 10, trackInfo, carEconomy, 100);
    const hard = get_wear('H', 10, trackInfo, carEconomy, 100);
    expect(soft).not.toBe(hard);
  });

  it('respects the MULTIPLIERS race-length scaling (25% race wears tyres faster than 100%)', () => {
    setFakeWeatherText('25°C');
    const fullRace = parseFloat(get_wear('M', 10, trackInfo, carEconomy, 100));
    const quarterRace = parseFloat(get_wear('M', 10, trackInfo, carEconomy, 25));
    // 25% race length uses a 3x multiplier on the wear-rate term `t`,
    // which increases decay, so quarterRace's stint value should be lower.
    expect(quarterRace).toBeLessThan(fullRace);
  });

  it('golden value: known inputs produce a stable, previously-verified output', () => {
    // This pins down the current (possibly buggy — see code comment on the
    // "(stint + stint) / 2" line) behavior so any future fix to the formula
    // is a deliberate, visible change to this test rather than a silent
    // behavior shift.
    setFakeWeatherText('25°C');
    const result = get_wear('M', 10, trackInfo, carEconomy, 100);

    const weatherNow = 25;
    const optimal = -0.0323 * trackInfo.avg + 10.9 - (weatherNow / 10);
    const tyreScale = optimal + 1; // M
    void tyreScale; // diff/pushDecay are computed in source but unused in the formula

    const t =
      (1.29 * Math.pow(carEconomy.te, -0.0696)) *
      (0.00527 * trackInfo.wear + 0.556) *
      trackInfo.length *
      1 * // MULTIPLIERS[100]
      1;  // TYRE_WEAR_FACTORS.M

    const expectedStint = Math.pow(Math.E, ((-t / 100 * 1.18) * 10)) * 100;
    const expected = expectedStint.toFixed(2);

    expect(result).toBe(expected);
  });
});
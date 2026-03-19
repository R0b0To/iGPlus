import { scale as defaultScale, circuits as defaultCircuits } from './const.js';

export async function getActiveScale() {
  const data = await chrome.storage.local.get('customScale');
  return data.customScale || defaultScale;
}

export async function getActiveCircuits() {
  const data = await chrome.storage.local.get('customCircuits');
  return data.customCircuits || defaultCircuits;
}

export async function saveCircuitSetup(tier, circuitCode, setup) {
  const current = await getActiveCircuits();
  if (!current[tier]) current[tier] = {};
  current[tier][circuitCode] = setup;
  await chrome.storage.local.set({ customCircuits: current });
}

export async function getSettings() {
  const data = await chrome.storage.local.get(['customScale', 'customCircuits']);
  return {
    scale: data.customScale || defaultScale,
    circuits: data.customCircuits || defaultCircuits
  };
}

export function getScaleAdjustment(scale, driverHeight, tier) {
  const heightKey = Object.keys(scale)
    .sort((a, b) => b - a)
    .find((k) => +k <= driverHeight);
  return heightKey ? scale[heightKey][tier] : 0;
}
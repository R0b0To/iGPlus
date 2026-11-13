import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  safeQuery,
  safeQueryAll,
  safeQueryIn,
  requireElement,
} from '../Extension/common/safeQuery.js';

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset the DOM to a clean body before each test
  document.body.innerHTML = '';
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── safeQuery ────────────────────────────────────────────────────────────────

describe('safeQuery', () => {
  it('returns the element when it exists', () => {
    document.body.innerHTML = '<div id="target"></div>';
    const el = safeQuery('#target');
    expect(el).not.toBeNull();
    expect(el.id).toBe('target');
  });

  it('returns null when the element does not exist', () => {
    const el = safeQuery('#does-not-exist');
    expect(el).toBeNull();
  });

  it('logs a warning when the element is missing', () => {
    safeQuery('#missing', 'test context');
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('#missing')
    );
  });

  it('includes the context label in the warning', () => {
    safeQuery('#missing', 'my context label');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('my context label')
    );
  });

  it('does not warn when the element is found', () => {
    document.body.innerHTML = '<span class="found"></span>';
    safeQuery('.found', 'should not warn');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not throw for any input', () => {
    expect(() => safeQuery(null)).not.toThrow();
    expect(() => safeQuery('')).not.toThrow();
    expect(() => safeQuery('#x')).not.toThrow();
  });
});

// ─── safeQueryAll ─────────────────────────────────────────────────────────────

describe('safeQueryAll', () => {
  it('returns an Array (not a NodeList)', () => {
    document.body.innerHTML = '<li>a</li><li>b</li>';
    const result = safeQueryAll('li');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns all matching elements', () => {
    document.body.innerHTML = '<li>a</li><li>b</li><li>c</li>';
    expect(safeQueryAll('li')).toHaveLength(3);
  });

  it('returns an empty array when nothing matches', () => {
    const result = safeQueryAll('.no-match');
    expect(result).toEqual([]);
  });

  it('warns when nothing matches', () => {
    safeQueryAll('.no-match', 'ctx');
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('does not warn when elements are found', () => {
    document.body.innerHTML = '<p></p>';
    safeQueryAll('p');
    expect(console.warn).not.toHaveBeenCalled();
  });
});

// ─── safeQueryIn ──────────────────────────────────────────────────────────────

describe('safeQueryIn', () => {
  it('returns the child when parent and child both exist', () => {
    document.body.innerHTML = '<div id="parent"><span id="child"></span></div>';
    const parent = document.getElementById('parent');
    const child = safeQueryIn(parent, '#child');
    expect(child).not.toBeNull();
    expect(child.id).toBe('child');
  });

  it('returns null when the child does not exist in the parent', () => {
    document.body.innerHTML = '<div id="parent"></div>';
    const parent = document.getElementById('parent');
    const result = safeQueryIn(parent, '.missing');
    expect(result).toBeNull();
  });

  it('warns when the child is missing', () => {
    document.body.innerHTML = '<div id="p"></div>';
    const parent = document.getElementById('p');
    safeQueryIn(parent, '.missing', 'ctx');
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('.missing'));
  });

  it('returns null and warns when parent is null', () => {
    const result = safeQueryIn(null, '.child', 'ctx');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('parent is null'));
  });

  it('returns null and warns when parent is undefined', () => {
    const result = safeQueryIn(undefined, '.child', 'ctx');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('does not query a global element that is outside the parent scope', () => {
    document.body.innerHTML = `
      <div id="parent"></div>
      <span id="outside"></span>
    `;
    const parent = document.getElementById('parent');
    const result = safeQueryIn(parent, '#outside');
    expect(result).toBeNull();
  });
});

// ─── requireElement ───────────────────────────────────────────────────────────

describe('requireElement', () => {
  it('behaves identically to safeQuery', () => {
    document.body.innerHTML = '<button id="btn"></button>';
    expect(requireElement('#btn')).not.toBeNull();
    expect(requireElement('#btn').id).toBe('btn');
  });

  it('returns null and warns when missing', () => {
    const result = requireElement('#nope', 'guard check');
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledOnce();
  });
});

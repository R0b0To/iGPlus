import { describe, it, expect, vi } from 'vitest';
import { delay } from '../Extension/common/utility.js';

describe('delay', () => {
  it('returns a Promise', () => {
    const result = delay(0);
    expect(result).toBeInstanceOf(Promise);
    return result; // let vitest await it so the timer fires cleanly
  });

  it('resolves after approximately the specified milliseconds', async () => {
    const ms = 50;
    const start = Date.now();
    await delay(ms);
    const elapsed = Date.now() - start;
    // Allow generous tolerance for slow CI environments
    expect(elapsed).toBeGreaterThanOrEqual(ms - 5);
    expect(elapsed).toBeLessThan(ms + 100);
  });

  it('resolves with undefined (no return value)', async () => {
    const result = await delay(0);
    expect(result).toBeUndefined();
  });

  it('delay(0) resolves on the next tick without hanging', async () => {
    // If delay(0) never resolves this test will time out
    await Promise.race([
      delay(0),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
    ]);
  });

  it('multiple concurrent delays resolve independently', async () => {
    const results = await Promise.all([delay(10), delay(20), delay(30)]);
    expect(results).toEqual([undefined, undefined, undefined]);
  });
});

import { describe, it, expect } from 'vitest';
import {
  ID_TO_CODE,
  CODE_TO_ID,
  trackCodes,
  trackIds,
  codeFromId,
  idFromCode,
} from '../Extension/common/circuits.js';

describe('ID_TO_CODE', () => {
  it('maps known ids to the correct codes', () => {
    expect(ID_TO_CODE[1]).toBe('au');
    expect(ID_TO_CODE[18]).toBe('gb');
    expect(ID_TO_CODE[25]).toBe('us');
    expect(ID_TO_CODE[26]).toBe('nl'); // was wrong (25) in the old trackDictionary
  });

  it('does not contain the retired id 8', () => {
    expect(ID_TO_CODE[8]).toBeUndefined();
  });

  it('has no duplicate code values', () => {
    const codes = Object.values(ID_TO_CODE);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('CODE_TO_ID', () => {
  it('is the exact inverse of ID_TO_CODE', () => {
    for (const [id, code] of Object.entries(ID_TO_CODE)) {
      expect(CODE_TO_ID[code]).toBe(Number(id));
    }
  });

  it('nl maps to 26, not 25', () => {
    expect(CODE_TO_ID['nl']).toBe(26);
  });

  it('us maps to 25', () => {
    expect(CODE_TO_ID['us']).toBe(25);
  });
});

describe('trackCodes', () => {
  it('contains all expected codes', () => {
    const expected = ['au','my','cn','bh','es','mc','tr','de','hu','eu',
                      'be','it','sg','jp','br','ae','gb','fr','at','ca',
                      'az','mx','ru','us','nl'];
    expected.forEach(code => expect(trackCodes).toContain(code));
  });

  it('has no duplicates', () => {
    expect(new Set(trackCodes).size).toBe(trackCodes.length);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(trackCodes)).toBe(true);
  });
});

describe('trackIds', () => {
  it('does not include the retired id 8', () => {
    expect(trackIds).not.toContain(8);
  });

  it('includes 26 (Netherlands)', () => {
    expect(trackIds).toContain(26);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(trackIds)).toBe(true);
  });
});

describe('codeFromId', () => {
  it('returns the correct code for known ids', () => {
    expect(codeFromId(1)).toBe('au');
    expect(codeFromId(18)).toBe('gb');
    expect(codeFromId(26)).toBe('nl');
  });

  it('accepts string ids as well as numbers', () => {
    expect(codeFromId('1')).toBe('au');
    expect(codeFromId('26')).toBe('nl');
  });

  it('returns null for the retired id 8', () => {
    expect(codeFromId(8)).toBeNull();
  });

  it('returns null for id 0 (the "All tracks" select value)', () => {
    expect(codeFromId(0)).toBeNull();
  });

  it('returns null for unknown ids', () => {
    expect(codeFromId(999)).toBeNull();
  });
});

describe('idFromCode', () => {
  it('returns the correct id for known codes', () => {
    expect(idFromCode('au')).toBe(1);
    expect(idFromCode('gb')).toBe(18);
    expect(idFromCode('us')).toBe(25);
    expect(idFromCode('nl')).toBe(26);
  });

  it('returns null for unknown codes', () => {
    expect(idFromCode('xx')).toBeNull();
    expect(idFromCode('')).toBeNull();
  });

  it('us and nl return different ids', () => {
    expect(idFromCode('us')).not.toBe(idFromCode('nl'));
  });
});

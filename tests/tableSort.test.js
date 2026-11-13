import { describe, it, expect, beforeEach } from 'vitest';
import { sortTableBody, makeSortHandler } from '../Extension/common/tableSort.js';

// ─── DOM helpers ──────────────────────────────────────────────────────────────

/**
 * Build a minimal <tbody> whose rows each have one <td> with the given text.
 * jsdom is available in Vitest's default environment, so real DOM APIs work.
 */
function makeTbody(values) {
  const tbody = document.createElement('tbody');
  values.forEach((v) => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerHTML = String(v);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  return tbody;
}

/** Extract the text content of column 0 for every row in a tbody. */
function getColumn(tbody, col = 0) {
  return Array.from(tbody.rows).map((r) => r.cells[col].textContent);
}

// ─── sortTableBody ────────────────────────────────────────────────────────────

describe('sortTableBody', () => {
  it('sorts numeric values descending on first call', () => {
    const tbody = makeTbody([3, 1, 4, 1, 5, 9, 2]);
    sortTableBody(tbody, 0);
    expect(getColumn(tbody).map(Number)).toEqual([9, 5, 4, 3, 2, 1, 1]);
  });

  it('sorts numeric values ascending on second call (direction toggle)', () => {
    const tbody = makeTbody([3, 1, 4, 1, 5, 9, 2]);
    sortTableBody(tbody, 0); // desc
    sortTableBody(tbody, 0); // asc
    expect(getColumn(tbody).map(Number)).toEqual([1, 1, 2, 3, 4, 5, 9]);
  });

  it('sorts string values case-insensitively descending', () => {
    const tbody = makeTbody(['Banana', 'apple', 'Cherry']);
    sortTableBody(tbody, 0);
    expect(getColumn(tbody)).toEqual(['Cherry', 'Banana', 'apple']);
  });

  it('sorts string values ascending on second call', () => {
    const tbody = makeTbody(['Banana', 'apple', 'Cherry']);
    sortTableBody(tbody, 0); // desc
    sortTableBody(tbody, 0); // asc
    expect(getColumn(tbody)).toEqual(['apple', 'Banana', 'Cherry']);
  });

  it('treats dash (-) as zero for numeric comparisons', () => {
    const tbody = makeTbody([5, '-', 3]);
    sortTableBody(tbody, 0);
    // desc: 5, 3, 0(-)
    expect(getColumn(tbody)).toEqual(['5', '3', '-']);
  });

  it('handles a single row without error', () => {
    const tbody = makeTbody([42]);
    expect(() => sortTableBody(tbody, 0)).not.toThrow();
    expect(getColumn(tbody)).toEqual(['42']);
  });

  it('handles an empty tbody without error', () => {
    const tbody = document.createElement('tbody');
    expect(() => sortTableBody(tbody, 0)).not.toThrow();
  });

  it('sorts by the specified column index', () => {
    // Two-column table — sort by column 1
    const tbody = document.createElement('tbody');
    [['Alice', '30'], ['Bob', '25'], ['Carol', '35']].forEach(([a, b]) => {
      const tr = document.createElement('tr');
      [a, b].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    sortTableBody(tbody, 1); // sort by age column, desc
    const ages = Array.from(tbody.rows).map((r) => r.cells[1].textContent);
    expect(ages.map(Number)).toEqual([35, 30, 25]);
  });

  it('is stable-ish for equal values (does not crash)', () => {
    const tbody = makeTbody([2, 2, 2]);
    expect(() => sortTableBody(tbody, 0)).not.toThrow();
    expect(getColumn(tbody)).toEqual(['2', '2', '2']);
  });
});

// ─── makeSortHandler ──────────────────────────────────────────────────────────

describe('makeSortHandler', () => {
  it('returns a function', () => {
    const handler = makeSortHandler(() => document.createElement('tbody'));
    expect(typeof handler).toBe('function');
  });

  it('calls sortTableBody on the tbody returned by the getter', () => {
    const tbody = makeTbody([3, 1, 2]);

    // Simulate a <th> with cellIndex = 0
    const th = document.createElement('th');
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    tr.appendChild(th);
    thead.appendChild(tr);
    table.appendChild(thead);
    table.appendChild(tbody);

    const handler = makeSortHandler(() => tbody);
    // `this` inside the handler is the th element
    handler.call(th);

    // After one sort (desc), 3 should be first
    expect(getColumn(tbody)[0]).toBe('3');
  });

  it('does not throw when getTbody returns null', () => {
    const th = document.createElement('th');
    const handler = makeSortHandler(() => null);
    expect(() => handler.call(th)).not.toThrow();
  });
});

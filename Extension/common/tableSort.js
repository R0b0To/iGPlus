/**
 * Sorts an HTML table body by the column of the clicked header cell.
 * Clicking the same column again reverses the sort direction.
 *
 * @param {HTMLTableSectionElement} tbody - The <tbody> to sort.
 * @param {number} columnIndex - Zero-based index of the column to sort by.
 */
function sortTableBody(tbody, columnIndex) {
  let dir = 'desc';
  let switchCount = 0;
  let switching = true;

  while (switching) {
    switching = false;
    const rows = tbody.rows;

    for (let i = 0; i < rows.length - 1; i++) {
      const xCell = rows[i].getElementsByTagName('TD')[columnIndex];
      const yCell = rows[i + 1].getElementsByTagName('TD')[columnIndex];

      let x = isNaN(parseInt(xCell.innerHTML))
        ? xCell.innerHTML.toLowerCase()
        : parseInt(xCell.innerHTML);
      let y = isNaN(parseInt(yCell.innerHTML))
        ? yCell.innerHTML.toLowerCase()
        : parseInt(yCell.innerHTML);

      // Treat dashes as zero
      if (x === '-') x = 0;
      if (y === '-') y = 0;

      const shouldSwitch =
        dir === 'asc' ? x > y : x < y;

      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        switchCount++;
        break;
      }
    }

    if (!switching && switchCount === 0 && dir === 'desc') {
      dir = 'asc';
      switching = true;
    }
  }
}

/**
 * Returns a click handler that sorts a table by the clicked <th>'s column index.
 * Pass the function that returns the <tbody> lazily so it works with tables
 * that are re-rendered after the listener is attached.
 *
 * @param {() => HTMLTableSectionElement} getTbody
 * @returns {(event: MouseEvent) => void}
 */
function makeSortHandler(getTbody) {
  return function () {
    const columnIndex = this.cellIndex;
    const tbody = getTbody();
    if (tbody) sortTableBody(tbody, columnIndex);
  };
}

export { sortTableBody, makeSortHandler };
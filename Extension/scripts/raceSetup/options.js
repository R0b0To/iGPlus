async function loadFullTable() {
  const { getActiveCircuits } = await import(chrome.runtime.getURL('scripts/raceSetup/settings.js'));

  const circuits = await getActiveCircuits();
  const container = document.getElementById('table-container');
  if (!container) {
    console.warn('iGPlus [raceSetup/options]: #table-container not found on page.');
    return;
  }

  container.innerHTML = '';

  const table = document.createElement('table');
  table.classList.add('acp');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Circuit', 'Ride', 'Wing', 'Suspension', 'Pit'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  Object.entries(circuits).forEach(([code, setup]) => {
    const row = document.createElement('tr');

    const codeCell = document.createElement('td');
    codeCell.textContent = code.toUpperCase();
    row.appendChild(codeCell);

    ['ride', 'wing', 'suspension', 'pit'].forEach((key) => {
      const cell = document.createElement('td');
      cell.textContent = setup[key] ?? '';
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

export { loadFullTable };
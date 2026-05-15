
function toMs(timeString) {
  const [minStr, secStr, msStr] = timeString.split(/[:.]/);
  const time = {
    msInMin: parseInt(minStr) * 60000,
    msInSec: parseInt(secStr) * 1000,
    ms: parseInt(msStr)
  };
  return time.msInMin + time.msInSec + time.ms;
}

function pit() {
  if (document.getElementsByClassName('pitTime').length == 0) {
    const table = document.getElementById('csvRaceResult');
    table.classList.add('pitTime');
    const pits = Array.from(document.querySelectorAll('.pit')).slice(1);
    const pitTimes = [];
    pits.forEach(pitLap => {
      try {
        const a = pitLap.previousElementSibling.childNodes[1].textContent;
        const b = pitLap.nextElementSibling.childNodes[1].textContent;
        const c = pitLap.previousElementSibling.previousElementSibling.childNodes[1].textContent;
        const d = pitLap.nextElementSibling.nextElementSibling.childNodes[1].textContent;
        const pitTime = toMs(a) + toMs(b) - toMs(c) - toMs(d);
        pitLap.childNodes[0].textContent += ' ' + (pitTime / 1000);
        pitTimes.push(pitTime / 1000);
      } catch (error) {
        pitTimes.push(-1);
      }
    });

    const sum = pitTimes.reduce((a, b) => a + b, 0);
    const avg = (sum / pitTimes.length) || 0;
  }
}

function extractTableData() {
  const table = document.getElementById('csvRaceResult');
  if (!table) return { laps: [], stats: {} };

  const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => !row.classList.contains('pit'));
  const laps = rows.map(row => {
    const cells = row.querySelectorAll('td');
    const lapNum = cells[0]?.textContent.trim() || '';
    const time = cells[1]?.textContent.trim() || '';
    const gap = cells[2]?.textContent.trim() || '';
    const mph = cells[3]?.textContent.trim() || '';
    const pos = cells[4]?.textContent.trim() || '';
    const tyre = cells[5]?.querySelector('.ratingVal')?.textContent.trim() || '';
    const fuel = cells[6]?.querySelector('.ratingVal')?.textContent.trim() || '';

    return { lapNum, time, gap, mph, pos, tyre: parseInt(tyre) || 0, fuel: parseFloat(fuel) || 0 };
  });

  return { laps };
}

function initTabSwitcher() {
  const dialog = document.querySelector('.dialog');
  const dialogHead = dialog?.querySelector('.dialog-head');
  if (!dialogHead || document.getElementById('race-tabs-initialized')) return;

  const h1 = dialogHead.querySelector('h1');
  const tabContainer = document.createElement('div');
  tabContainer.className = 'race-tabs-container';
  tabContainer.id = 'race-tabs-initialized';
  tabContainer.innerHTML = `
    <button class="race-tab-btn active" data-tab="table">Table</button>
    <button class="race-tab-btn" data-tab="chart">Visualizer</button>
  `;
  dialogHead.appendChild(tabContainer);

  const tableView = document.querySelector('.w-full.min-w-0');
  const chartView = document.createElement('div');
  chartView.className = 'race-chart-view';
  chartView.id = 'plotly-chart';
  chartView.style.display = 'none';
  tableView.parentElement.insertBefore(chartView, tableView.nextSibling);

  const btns = tabContainer.querySelectorAll('.race-tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.tab === 'table') {
        tableView.style.display = '';
        chartView.style.display = 'none';
      } else {
        tableView.style.display = 'none';
        chartView.style.display = 'block';
        renderChart(chartView);
      }
    });
  });
}

function renderChart(container) {
  const data = extractTableData();
  if (!data.laps.length) return;

  container.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'chart-controls';
  controls.innerHTML = `
    <div class="metric-toggles">
      <label><input type="checkbox" class="metric-toggle" value="time" checked> Lap Time</label>
      <label><input type="checkbox" class="metric-toggle" value="tyre" checked> Tyre (%)</label>
      <label><input type="checkbox" class="metric-toggle" value="fuel" checked> Fuel (L)</label>
    </div>
  `;
  container.appendChild(controls);

  const plotContainer = document.createElement('div');
  plotContainer.className = 'plotly-container';
  plotContainer.style.width = '100%';
  plotContainer.style.height = '500px';
  container.appendChild(plotContainer);

  const toggles = controls.querySelectorAll('.metric-toggle');

  const updateChart = () => {
    const activeMetrics = Array.from(toggles)
      .filter(t => t.checked)
      .map(t => t.value);

    createPlotlyChart(plotContainer, data.laps, activeMetrics);
  };

  toggles.forEach(toggle => {
    toggle.addEventListener('change', updateChart);
  });

  updateChart();
}

function createPlotlyChart(container, laps, activeMetrics) {
  const lapNums = laps.map((l, i) => i + 1);
  const times = laps.map(l => {
    const match = l.time.match(/(\d+):(\d+\.\d+)/);
    return match ? parseInt(match[1]) * 60 + parseFloat(match[2]) : 0;
  });
  const tyres = laps.map(l => l.tyre);
  const fuels = laps.map(l => l.fuel);

  const traces = [];

  if (activeMetrics.includes('time')) {
    traces.push({
      x: lapNums,
      y: times,
      name: 'Lap Time (s)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#4a85c5', width: 2 },
      marker: { size: 4 },
      yaxis: 'y1'
    });
  }

  if (activeMetrics.includes('tyre')) {
    traces.push({
      x: lapNums,
      y: tyres,
      name: 'Tyre (%)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#2ecc9a', width: 2 },
      marker: { size: 4 },
      yaxis: 'y2'
    });
  }

  if (activeMetrics.includes('fuel')) {
    traces.push({
      x: lapNums,
      y: fuels,
      name: 'Fuel (L)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#f0a830', width: 2 },
      marker: { size: 4 },
      yaxis: 'y3'
    });
  }

  const layout = {
    title: 'Race Data Visualizer',
    xaxis: { title: 'Lap' },
    yaxis: { title: 'Lap Time (s)', color: '#4a85c5' },
    yaxis2: {
      title: 'Tyre (%)',
      overlaying: 'y',
      side: 'left',
      color: '#2ecc9a',
      anchor: 'x'
    },
    yaxis3: {
      title: 'Fuel (L)',
      overlaying: 'y',
      side: 'right',
      color: '#f0a830',
      anchor: 'x'
    },
    plot_bgcolor: '#0a0e27',
    paper_bgcolor: '#0a0e27',
    font: { color: '#ccc', size: 12 },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    hovermode: 'x unified',
    legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(10, 14, 39, 0.8)' }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: { format: 'png', filename: 'race_data' }
  };

  Plotly.newPlot(container, traces, layout, config);
}

(async () => {
  try {
    await new Promise((res) => setTimeout(res, 200));
    pit();
    initTabSwitcher();
  } catch (err) {
    console.log('page not loaded');
  }
})();


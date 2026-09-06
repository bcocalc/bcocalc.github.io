/* Read-only lookup. Routing belongs to the existing Reference router. */
(function(){
  // TEAM HTS Cutter Chart, 2016-01-15; Section 6 Cutters and BCO.pdf, page 2.
  // Keep printed precision, including the identical 3-inch and 4-inch Hot Tap entries.
  const CHARTS = {
    hotTap: {
      label: 'Standard Hot Tap',
      rows: [
        ['3', '2.438'], ['4', '2.438'], ['6', '5.469'], ['8', '7.313'],
        ['10', '9.500'], ['12', '11.500'], ['14', '12.750'], ['16', '14.688'],
        ['18', '15.063'], ['20', '17.000'], ['24', '21.000'], ['30', '27.000'],
        ['36', '33.000'], ['42', '39.000']
      ]
    },
    lineStop: {
      label: 'Line Stop',
      rows: [
        ['3', '2.938'], ['4', '3.938'], ['6', '5.938'], ['8', '7.875'],
        ['10', '9.875'], ['12', '11.813'], ['14', '13.063'], ['16', '15.063'],
        ['18', '17.000'], ['20', '19.000'], ['24', '23.000'], ['30', '29.000'],
        ['36', '35.000']
      ]
    }
  };

  const view = document.getElementById('cuttersReferenceView');
  if (!view || view.dataset.cutterReady) return;
  view.dataset.cutterReady = 'true';
  const type = document.getElementById('cutterReferenceType');
  const pipe = document.getElementById('cutterReferencePipe');
  const output = document.getElementById('cutterReferenceSize');
  const status = document.getElementById('cutterReferenceStatus');
  const label = document.getElementById('cutterReferenceResultLabel');
  const body = document.getElementById('cutterReferenceRows');
  const sizes = [...new Set(Object.values(CHARTS).flatMap(chart => chart.rows.map(row => row[0])))];
  sizes.sort((a, b) => Number(a) - Number(b));
  sizes.forEach(size => pipe.add(new Option(size + ' in', size)));
  pipe.add(new Option('Other size / unlisted', 'unlisted'));

  function render(){
    const chart = CHARTS[type.value];
    const row = chart?.rows.find(item => item[0] === pipe.value);
    label.textContent = (chart?.label || 'Unknown operation') + ' cutter';
    output.textContent = row ? row[1] + ' in' : (pipe.value ? 'Not listed' : '-');
    if (!pipe.value) {
      status.textContent = 'Choose a pipe size to look up its cutter.';
    } else if (!row) {
      status.textContent = 'No entry in this chart for the selected operation and size. Confirm the applicable equipment chart; do not use the nearest listed size.';
    } else if (type.value === 'hotTap' && ['3', '4'].includes(pipe.value)) {
      status.textContent = pipe.value + ' in nominal pipe. The supplied chart lists 2.438 in for both 3 in and 4 in Hot Taps; confirm the job-specific requirement.';
    } else {
      status.textContent = pipe.value + ' in nominal pipe. Cutter size shown exactly as printed in the chart.';
    }
    document.getElementById('cutterReferenceCaption').textContent = (chart?.label || '') + ' cutters - inches';
    document.getElementById('cutterReferenceChartToggle').textContent = 'View full ' + (chart?.label || '') + ' chart';
    body.replaceChildren(...(chart?.rows || []).map(([size, cutter]) => {
      const tr = document.createElement('tr');
      tr.dataset.pipeSize = size;
      if (size === pipe.value) tr.setAttribute('aria-current', 'true');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = size + ' in';
      const td = document.createElement('td');
      td.textContent = cutter + ' in';
      tr.append(th, td);
      return tr;
    }));
  }
  type.addEventListener('change', render);
  pipe.addEventListener('change', render);
  render();
})();

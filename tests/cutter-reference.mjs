import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dev/reference/cutter-sizes.js', import.meta.url), 'utf8');
const from = source.indexOf('  const CHARTS =');
const to = source.indexOf('  const view =', from);
assert.ok(from >= 0 && to > from);
const charts = vm.runInNewContext(source.slice(from, to) + '\nJSON.stringify(CHARTS)');
const actual = JSON.parse(charts);
// Independently transcribed from the supplied HTS Cutter Chart, PDF page 2.
const expected = {
  hotTap: { 3: '2.438', 4: '2.438', 6: '5.469', 8: '7.313', 10: '9.500',
    12: '11.500', 14: '12.750', 16: '14.688', 18: '15.063', 20: '17.000',
    24: '21.000', 30: '27.000', 36: '33.000', 42: '39.000' },
  lineStop: { 3: '2.938', 4: '3.938', 6: '5.938', 8: '7.875', 10: '9.875',
    12: '11.813', 14: '13.063', 16: '15.063', 18: '17.000', 20: '19.000',
    24: '23.000', 30: '29.000', 36: '35.000' }
};
assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
for (const [type, chart] of Object.entries(actual)) {
  assert.equal(chart.rows.length, Object.keys(expected[type]).length);
  assert.equal(new Set(chart.rows.map(row => row[0])).size, chart.rows.length);
  assert.deepEqual(Object.fromEntries(chart.rows), expected[type]);
  for (const [, cutter] of chart.rows) assert.match(cutter, /^\d+\.\d{3}$/);
}
assert.equal(Object.fromEntries(actual.lineStop.rows)['42'], undefined);
assert.doesNotMatch(source, /localStorage|sessionStorage|tapCalcSetWorkflow|bcoCutterOD/,
  'Read-only cutter reference must not write job state or calculator inputs');
console.log('PASS cutter reference: all 27 source rows, chart precision, separate operation sizes and read-only boundary');

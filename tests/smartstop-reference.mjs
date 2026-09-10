import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../dev/overlays/tapcalc-smartstop-reference.js', import.meta.url), 'utf8');
const data = vm.runInNewContext(source.slice(source.indexOf('  function rangeLabel'), source.indexOf('  function byId')) +
  ';JSON.stringify({suffixCharts,torqueRows})');
// Freeze the previously transcribed source, including overlaps and blank torque cells.
assert.equal(createHash('sha256').update(data).digest('hex'),
  '4f2bc766126da66f8fa5a8cf7149c7b5214aad701013a99ae31412d010b45d58');
const { suffixCharts, torqueRows } = JSON.parse(data);
assert.deepEqual(suffixCharts.map(chart => chart.rows.length), [7, 8, 10, 11, 10, 9]);
assert.equal(torqueRows.filter(row => row.inLb === '').length, 5);
const helpers = vm.runInNewContext(source.slice(source.indexOf('  function parseDecimal'), source.indexOf('  function visibleNosePad')) +
  ';({parseDecimal,matchesRange})');
for (const value of ['', ' ', null, undefined]) assert.equal(helpers.parseDecimal(value), null);
for (const value of ['0', '-1', '1/4', '1e2', '0x10', 'NaN', 'Infinity', '2.3.4']) {
  assert.ok(Number.isNaN(helpers.parseDecimal(value)), 'Reject invalid decimal: ' + value);
}
for (const value of ['.250', '0.250', ' .250 ']) assert.equal(helpers.parseDecimal(value), .25);
for (const chart of suffixCharts) for (const row of chart.rows) {
  assert.ok(helpers.matchesRange(row.wallMin, row.wallMin, row.wallMax));
  assert.ok(helpers.matchesRange(row.wallMax, row.wallMin, row.wallMax));
  assert.ok(!helpers.matchesRange(row.wallMin - .001, row.wallMin, row.wallMax));
}
const six = suffixCharts.find(chart => chart.size === '6');
assert.deepEqual(six.rows.filter(row => helpers.matchesRange(.235, row.wallMin, row.wallMax)).map(row => row.suffix), ['-02', '-03']);
console.log('PASS SmartStop: all 55 source rows and 10 torque rows unchanged; decimal validation, inclusive boundaries and overlaps');

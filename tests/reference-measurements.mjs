import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dev/overlays/tapcalc-folding-head-reference.js', import.meta.url), 'utf8');
const from = source.indexOf('  function parseMeasurement(');
const to = source.indexOf('  function formatMeasurement(', from);
assert.ok(from >= 0 && to > from, 'Folding-head measurement parser must exist');
const context = vm.createContext({});
vm.runInContext(source.slice(from, to), context);
const cases = [
  ['10', 10], ['0', 0], ['.25', 0.25], ['-0.25', -0.25],
  ['1/2', 0.5], ['-1/2', -0.5], ['1 1/2', 1.5], ['-1 1/2', -1.5],
  ['-0 1/2', -0.5], ['0 1/2', 0.5], ['-2 3/4', -2.75], ['2 3/4', 2.75],
  ['  1 1/2"  ', 1.5], ['-0 1/2"', -0.5], ['', NaN], [' ', NaN],
  ['1/0', NaN], ['-1 1/0', NaN], ['not a number', NaN], ['Infinity', NaN]
];
for (const [raw, expected] of cases) {
  const actual = vm.runInContext('parseMeasurement(' + JSON.stringify(raw) + ')', context);
  assert.equal(actual, expected, 'Parse ' + JSON.stringify(raw));
}
console.log('PASS folding-head parser: ' + cases.length + ' decimal, signed fraction and invalid-input cases');

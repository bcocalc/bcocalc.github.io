import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../dev/measurement.js', import.meta.url), 'utf8');
const start = source.indexOf('function calculateCouponFreeCutout(');
const end = source.indexOf('function renderCouponFreeResult(', start);
const calculate = vm.runInNewContext(source.slice(start, end) + '; calculateCouponFreeCutout');
// Original workbook Tapping Measurements!B3:B12 cached values and formula.
assert.ok(Math.abs(calculate(20, 19.25, 19, 18.5).value - 7.339525418275905) < 1e-12);
assert.equal(calculate(20, 19, 20, 19).value, 10);
for (const values of [[NaN,19,19,18], [20,20,19,18], [20,-1,19,18],
  [20,19,19,0], [20,19,19,19], [20,19,22,20], [20,19,19,Infinity]]) {
  assert.ok(calculate(...values).error, values.join(','));
}
assert.match(source, /'bcoCutterID'/);
console.log('PASS coupon-free: workbook example, centerline boundary and invalid geometry');

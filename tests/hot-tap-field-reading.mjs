import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dev/measurement.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('function evaluateHotTapFieldReading('), source.indexOf('function getHotTapFieldPreview('));
const evaluate = vm.runInNewContext('(' + code.trim() + ')');
const base = { md: 10, ld: 2, ptc: 1, pod: 16, start: 5, bco: 3, mt: 30, actualPop: 18.5 };
const original = JSON.stringify(base);
const result = evaluate(base);
assert.equal(JSON.stringify(base), original);
for (const [key, value] of Object.entries({ li: 13.5, mco: 9, ttd: 17.5, pop: 18.5, cop: 19.5, rbco: 22.5, rmco: 27.5 })) assert.equal(result.adjusted[key], value, key);
assert.equal(result.original.pop, 17);
assert.equal(result.delta, 1.5);
assert.equal(result.original.mco, result.adjusted.mco);
assert.equal(evaluate({ ...base, actualPop: 15 }).delta, -2);
assert.equal(evaluate({ ...base, actualPop: 17 }).delta, 0);
assert.equal(evaluate({ ...base, ld: -2, actualPop: 14 }).delta, 1);
assert.equal(evaluate({ ...base, mt: 17 }).exceedsTravel, true);
assert.equal(evaluate({ ...base, mt: null }).missingTravel, true);
for (const key of ['md', 'ld', 'ptc', 'pod', 'start', 'bco', 'actualPop']) {
  for (const value of [null, '', NaN, Infinity]) assert.ok(evaluate({ ...base, [key]: value }).error, key);
}
for (const input of [{ actualPop: 4 }, { md: -1 }, { ld: -11 }, { pod: 0 }, { bco: -1 }, { mt: 0 }, { mt: -1 }, { mt: Infinity }, { md: Number.MAX_VALUE, ld: Number.MAX_VALUE }]) assert.ok(evaluate({ ...base, ...input }).error);
assert.ok(!evaluate({ ...base, md: 0, ld: 0, start: 0, actualPop: 0 }).error);
console.log('PASS actual POP: signed offsets, all derived values, unchanged geometry, explicit zeros, missing/invalid inputs and machine-travel warnings');

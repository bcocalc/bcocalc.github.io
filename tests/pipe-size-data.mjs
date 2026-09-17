import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for (const file of ['measurement.js', 'script.js', 'dev/measurement.js', 'dev/script.js']) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const extract = name => source.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});'))?.[1];
  const pipeData = vm.runInNewContext('(' + extract('pipeData') + ')');
  const trueOD = vm.runInNewContext('(' + extract('trueOD') + ')');
  for (const size of [22, 26, 28]) {
    const key = size.toFixed(1);
    assert.equal(trueOD.CarbonSteel[key], size);
    assert.equal(pipeData.CarbonSteel[key].STD, size - 0.75);
    assert.equal(pipeData.CarbonSteel[key].XS, size - 1);
    // Do not pretend STD/XS equals schedule 40/80 at these sizes.
    for (const schedule of ['40', '80']) assert.equal(pipeData.CarbonSteel[key][schedule], '');
    assert.equal(pipeData.DuctileIron[key], undefined, 'No invented ductile dimensions');
  }
  const keys = Object.keys(pipeData.CarbonSteel).map(Number);
  assert.deepEqual(keys, [...keys].sort((a, b) => a - b));
  console.log('PASS ' + file + ': 22/26/28 steel OD and STD/XS, no fabricated schedule or ductile defaults');
}

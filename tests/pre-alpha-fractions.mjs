import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fractionalInches,inchText,inchMarkup,FRACTION_NOTE} from '../pre-alpha/measurement-format.mjs';
import {resultsFor,normalizeJob,applyActualPop} from '../pre-alpha/model.mjs';
import {worksheetMarkup,createOriginTracker} from '../pre-alpha/presentation.mjs';
import {etaPresentation,etaResultPanel} from '../pre-alpha/eta-view.mjs';
import {buildExportText} from '../pre-alpha/exports.mjs';
import {helperReference,calculateFoldingDimensions} from '../pre-alpha/reference-helpers.mjs';

for(const [value,text,approximate] of [
  [0,'0',false],[-0,'0',false],[.5,'1/2',false],[.375,'3/8',false],
  [12.375,'12 3/8',false],[12.34375,'12 3/8',true],[12.343749,'12 5/16',true],
  [12.96875,'13',true],[12.9999,'13',true],[-12.34375,'-12 3/8',true],
  [-.5,'-1/2',false],[-.03125,'-1/16',true],[-.03,'0',true],
  [.03125,'1/16',true],[.00001,'0',true],[-12.96875,'-13',true]
]) {
  assert.deepEqual(fractionalInches(value),{text,approximate});
  assert.equal(inchText(value),value.toFixed(4)+' in ('+(approximate?'≈ ':'')+text+' in)');
  assert.equal(inchMarkup(value).replace(/<[^>]*>/g,''),inchText(value));
}
for(const value of [NaN,Infinity,-Infinity,undefined,null,'12.5','<img>']) {
  assert.equal(fractionalInches(value),null);
  assert.equal(inchText(value),'Not calculated');
  assert.equal(inchMarkup(value),'-- <small>in</small>');
}
assert.equal(fractionalInches(Number.MAX_VALUE),null);
assert.equal(inchText(Number.MAX_VALUE),Number.MAX_VALUE.toFixed(4)+' in');
// Grid includes every sixteenth, halfway point, and both signs. Parsing is independent.
let cases=0;
for(let i=-32000;i<=32000;i++) {
  const value=i/128,f=fractionalInches(value),parts=f.text.replace(/^-/,'').split(' ');
  const last=parts.at(-1),fraction=last.includes('/')?last.split('/').map(Number):null;
  const magnitude=fraction?(parts.length===2?Number(parts[0]):0)+fraction[0]/fraction[1]:Number(last);
  const rounded=(f.text.startsWith('-')?-1:1)*magnitude;
  assert.ok(Math.abs(value-rounded)<=1/32);
  assert.equal(f.approximate,value!==rounded);
  if(fraction)assert.ok([2,4,8,16].includes(fraction[1]));
  assert.ok(!f.text.startsWith('-0'));
  cases++;
}
const op={id:'one',label:'Synthetic tap',operationType:'Hot Tap',state:{md:'10.34375',ld:'2',start:'5',ptc:'1',preAlphaPipeOD:'16',bcoPipeID:'15.5',bcoCutterOD:'8',bcoCutterID:'7',mt:'52',unknown:{keep:['1/32',3]}}};
const job=normalizeJob({id:'fraction-fixture',record:{jobBundle:{selectedOperationId:'one',sharedState:{machineType:'HTM660'},operations:[op]}}});
const current=job.operations[0],before=JSON.stringify(job),results=structuredClone(resultsFor(current,'tap'));
const worksheet=worksheetMarkup(current,'tap',createOriginTracker());
assert.match(worksheet,/17\.3438 <small>in<\/small>/);
assert.match(worksheet,/\(≈ 17 3\/8 in\)/);
assert.match(worksheet,/Fractions rounded to the nearest 1\/16/);
const text=buildExportText(job);
assert.ok(text.includes('Pilot on pipe: 17.3438 in (≈ 17 3/8 in)'));
assert.ok(text.includes(FRACTION_NOTE));
const eta=etaPresentation(current,'HTM660');
assert.match(eta.distance,/\(≈ 1 3\/8 in\)/);
assert.doesNotMatch(eta.feed,/≈|\(/);
assert.match(etaResultPanel(current,'HTM660'),/result-fraction/);
assert.deepEqual(helperReference('foldinghelper',{pod:'6 5/8',wall:'1/4'}).tables[1].rows.map(row=>row[1]),
  ['6.1250 in (6 1/8 in)','5.6250 in (5 5/8 in)','3.0625 in (3 1/16 in)','2.9375 in (2 15/16 in)']);
assert.equal(helperReference('foldinghelper',{pod:'1.00001',wall:'.25'}).tables[1].rows[1][1],'<0.0001 in','Existing positive sub-resolution dimension guard is preserved');
// Decimal arithmetic may land beside an exact sixteenth. Keep the raw result
// and mark the fraction rounded even when the four-decimal display looks exact.
const boundaryInput=Object.freeze({pod:'1.1',wall:'.3'});
const boundaryBefore=calculateFoldingDimensions(boundaryInput);
assert.equal(boundaryBefore.pipeId,1.1-2*.3);
assert.notEqual(boundaryBefore.pipeId,.5);
assert.deepEqual(helperReference('foldinghelper',boundaryInput).tables[1].rows.map(row=>row[1]),
  ['0.5000 in (≈ 1/2 in)','Not available','0.2500 in (≈ 1/4 in)','0.1250 in (≈ 1/8 in)']);
assert.deepEqual(calculateFoldingDimensions(boundaryInput),boundaryBefore,'Formatting preserves decimal arithmetic and the invalid backing-ring guard');

assert.equal(JSON.stringify(job),before);
assert.deepEqual(resultsFor(current,'tap'),results,'Formatting never rounds calculation values');
current.state.v3ActualPopInput='18.53125';assert.equal(applyActualPop(current),true);
assert.equal(resultsFor(current,'tap')[0][1],18.53125);
assert.ok(buildExportText(job).includes('Applied actual POP: 18.5313 in (≈ 18 9/16 in)'));
for(const path of ['workspace.mjs','presentation.mjs','eta-view.mjs','reference-helpers.mjs','exports.mjs'])assert.match(readFileSync(new URL('../pre-alpha/'+path,import.meta.url),'utf8'),/measurement-format\.mjs\?v=pre-alpha26/);
assert.match(readFileSync(new URL('../pre-alpha/service-worker.js',import.meta.url),'utf8'),/'\.\/measurement-format\.mjs\?v='\+BUILD/);
console.log('PASS '+cases+' fractional rounding cases plus signed ties, carry, invalid/large values, unchanged calculations and stored data, worksheets, exports, ETA, reference helpers and offline inclusion.');

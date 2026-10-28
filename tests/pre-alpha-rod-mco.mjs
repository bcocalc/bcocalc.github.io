import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {geometry,number,normalizeJob,resultsFor,stepsFor} from '../pre-alpha/model.mjs';
import {reviewSections,operationWarnings} from '../pre-alpha/review.mjs';
import {worksheetFor,historicalMcoFor,historicalRodMcoFor,historicalRodMcoMarkup} from '../pre-alpha/presentation.mjs';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',pod:'99',rmco:'999',rodMco:'888',future:{keep:[1,2]}};
const op=patch=>({id:'one',operationType:'Hot Tap',state:{...state,...patch}});
const value=operation=>resultsFor(operation,'tap').find(([label])=>label==='Rod MCO')?.[1];
const source=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
const calc=source.slice(source.indexOf('function calcHotTap() {'),source.indexOf('\n[mdEl, ldEl, ptcEl, podEl, startEl, mtEl, signEl]'));
assert.match(calc,/const li = md \+ ld/);assert.match(calc,/const pop = start \+ li/);assert.match(calc,/const rmco = pop \+ mco/);
function legacyReading(s){
  const node=value=>({value,textContent:''}),g=geometry(s);
  const elements=Object.fromEntries(['liEl','ttdEl','mcoEl','popEl','copEl','rbcoEl','rmcoEl','rbcoGeomEl'].map(key=>[key,node('')]));
  const context=vm.createContext({...elements,mdEl:node(s.md),ldEl:node(s.ld),signEl:node(s.ldSign),ptcEl:node(s.ptc),podEl:node(String(g.od)),startEl:node(s.start),mtEl:node(s.mt),data:{bco:g.bco},geometry:{pipeOD:g.od,wall:g.wall},getMeasurementValue:el=>number(el.value),hotTapWarnEl:{innerHTML:'',classList:{toggle(){}}},updateSummary(){},lastHotTap:{}});
  vm.runInContext(calc+'\ncalcHotTap();',context);return elements.rmcoEl.textContent;
}
for(const patch of [{},{ld:'2 1/2',ldSign:'-'},{ld:'-2 1/2',ldSign:'-'},{ld:'-1/2',ldSign:'+'},{md:'-10',start:'-2',ptc:'-1/4'},{start:'0',md:'0',ld:'0',ptc:'0'},{preAlphaPipeOD:'26',start:'-1 1/2',md:'20 1/4'},{preAlphaPipeOD:'28',ptc:'1/2'},{ld:undefined},{ld:'  '},{bcoPipeID:'',bcoCutterOD:''}]){
  const operation=op(patch),before=structuredClone(operation),reading=value(operation);
  assert.equal(reading.toFixed(4),legacyReading(operation.state),'Execute exact legacy formula with current actual O.D. and sign semantics');
  const results=Object.fromEntries(resultsFor(operation,'tap'));
  assert.equal(reading,results['Pilot on pipe']+results['Maximum cut out (MCO)']);
  assert.equal(reviewSections(operation).find(s=>s.stage==='tap').results.find(([label])=>label==='Rod MCO')[1],reading);
  const worksheet=worksheetFor(operation,'tap').find(row=>row.label==='Rod MCO');
  assert.equal(worksheet.result,reading);assert.equal(worksheet.formula,'Pilot on pipe + MCO');
  assert.deepEqual(worksheet.terms.map(t=>t.value),[results['Pilot on pipe'],results['Maximum cut out (MCO)']]);
  assert.deepEqual(operation,before,'Do not persist calculated readings over original raw inputs');
}
assert.equal(value(op({})),16.5625);
assert.equal(value(op({start:'5'}))-value(op({})),3,'Rod start shifts Rod MCO, not MCO distance');
for(const key of ['md','start','ptc','preAlphaPipeOD','ld'])for(const invalid of ['oops','1/0','0oops','Infinity']){
  const operation=op({[key]:invalid}),before=structuredClone(operation);assert.ok(Number.isNaN(value(operation)));assert.deepEqual(operation,before);
}
for(const key of ['md','start','ptc'])assert.ok(Number.isNaN(value(op({[key]:''}))),'Only blank Hot Tap LD defaults to zero');
assert.equal(value(op({bcoPipeID:'',bcoCutterOD:''})),16.5625,'Rod MCO does not depend on cutter-shell BCO or missing I.D.');
assert.ok(operationWarnings(op({ptc:'-1'})).some(w=>w.code==='negative-ptc'),'Existing warnings remain active');
for(const operation of [{operationType:'HTP',state},{operationType:'Hi-Stop',state},{operationType:'Completion Plug',state},{operationType:'Unknown',state},{operationType:'Line Stop',state:{...state,lineStopVariant:'htp'}},{operationType:'Line Stop',state:{...state,lineStopVariant:'hiStop'}}]){
  assert.equal(stepsFor(operation).includes('tap'),false);assert.equal(value(operation),undefined);
  assert.ok(!worksheetFor(operation,'tap').some(row=>row.label==='Rod MCO'));
  assert.ok(!reviewSections(operation).some(row=>row.stage==='tap'));
}
for(const type of ['Hot Tap','Line Stop','Tap & Complete'])assert.equal(value({...op({}),operationType:type}),16.5625);
const entry={id:'rod-history',record:{measurements:{hotTap:{mco:'99',rodMco:'111'}},jobBundle:{selectedOperationId:'two',future:{keep:true},operations:[
  {...op({}),measurements:{hotTap:{mco:'88',rodMco:'89'}}},
  {id:'two',operationType:'Tap & Complete',state:{...state,preAlphaPipeOD:'26',ptc:'2 1/2'}},
  {id:'three',operationType:'Hot Tap',state:{...state,preAlphaPipeOD:'28',ptc:'1/2'}}]}}};
const untouched=structuredClone(entry),job=normalizeJob(entry),before=structuredClone(job);
assert.deepEqual(job.operations.map(value),[16.5625,27.5,26.5]);
assert.deepEqual(job.operations.map(o=>historicalRodMcoFor(job,o)),['89','111',undefined]);
assert.deepEqual(job.operations.map(o=>historicalMcoFor(job,o)),['88','99',undefined]);
job.selectedOperationId='three';assert.equal(historicalRodMcoFor(job,job.operations[2]),undefined);
job.selectedOperationId=before.selectedOperationId;assert.deepEqual(job,before);assert.deepEqual(entry,untouched);
const nested=normalizeJob({id:'nested',record:{pipe:{material:'CarbonSteel',nominalSize:'6',trueOd:'6.625',pipeId:'6'},measurements:{hotTap:{md:'10',ld:'',ptc:'1',rodStart:'2',rodMco:'67'}}}});
assert.equal(value(nested.operations[0]),16.3125);assert.equal(historicalRodMcoFor(nested,nested.operations[0]),'67');
assert.equal(historicalRodMcoFor(nested,{id:'new-operation'}),undefined);
assert.match(historicalRodMcoMarkup(nested,nested.operations[0]),/Historical Rod MCO \(not used\).*67\.0000 in/s);
nested.original.record.measurements.hotTap.rodMco='<img src=x>';
assert.doesNotMatch(historicalRodMcoMarkup(nested,nested.operations[0]),/<img/);
console.log('PASS active Rod MCO: exact legacy rmco=pop+mco, current stricter operands/eligibility, results/Review/worksheet, signed/fraction/blank-LD/invalid input, raw bundles and separate immutable historical snapshots');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {geometry,newJob,normalizeJob,number,resultsFor} from '../pre-alpha/model.mjs';
import {reviewSections,operationWarnings} from '../pre-alpha/review.mjs';
import {createOriginTracker,historicalMcoFor,historicalMcoMarkup,worksheetFor,worksheetMarkup} from '../pre-alpha/presentation.mjs';

const label='Maximum cut out (MCO)';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6.625',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'0',ptc:'1',start:'2',mt:'52',pod:'99',mco:'888',future:{keep:[1,2]}};
const operation=patch=>({id:'one',operationType:'Hot Tap',state:{...state,...patch}});
const mco=op=>resultsFor(op,'tap').find(([key])=>key===label)[1];

// Execute the established calculator, including its actual MCO expression.
const source=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
const calc=source.slice(source.indexOf('function calcHotTap() {'),source.indexOf('\n[mdEl, ldEl, ptcEl, podEl, startEl, mtEl, signEl]'));
assert.match(calc,/const mco = \(pod \/ 2\) \+ ptc/);
function legacyMco(s){
  const node=value=>({value,textContent:''}),g=geometry(s);
  const elements=Object.fromEntries(['liEl','ttdEl','mcoEl','popEl','copEl','rbcoEl','rmcoEl','rbcoGeomEl'].map(key=>[key,node('')]));
  const context=vm.createContext({...elements,mdEl:node(s.md),ldEl:node(s.ld),signEl:node('+'),ptcEl:node(s.ptc),podEl:node(String(g.od)),startEl:node(s.start),mtEl:node(s.mt),data:{bco:g.bco},geometry:{pipeOD:g.od,wall:g.wall},getMeasurementValue:el=>number(el.value),hotTapWarnEl:{innerHTML:'',classList:{toggle(){}}},updateSummary(){},lastHotTap:{}});
  vm.runInContext(calc+'\ncalcHotTap();',context);
  return number(elements.mcoEl.textContent);
}
for(const patch of [{},{preAlphaPipeOD:'6 5/8',ptc:'1 1/4'},{preAlphaPipeOD:'22',ptc:'0'},{preAlphaPipeOD:'26',ptc:'2 1/2'},{preAlphaPipeOD:'28',ptc:'1/2'},{preAlphaPipeOD:'',ptc:'1'}, {ptc:'-1/2'}]){
  const op=operation(patch),before=structuredClone(op),result=mco(op);
  assert.equal(result,legacyMco(op.state),'Same established MCO basis using current actual O.D.');
  assert.equal(reviewSections(op).find(row=>row.stage==='tap').results.find(([key])=>key===label)[1],result);
  const row=worksheetFor(op,'tap').find(row=>row.label===label);
  assert.equal(row.result,result);
  assert.equal(row.formula,'Actual pipe O.D. / 2 + PTC');
  assert.deepEqual(row.terms.map(term=>term.value),[geometry(op.state).od,op.state.ptc]);
  assert.doesNotMatch(resultsFor(op,'tap').map(([key])=>key).join('|'),/Rod MCO/);
  assert.deepEqual(op,before,'Calculation and presentation cannot mutate raw or unknown fields');
}
assert.equal(mco(operation({preAlphaPipeOD:'6 5/8',ptc:'1 1/4'})),4.5625);
assert.equal(mco(operation({md:'',ld:'oops',start:'',bcoPipeID:'',bcoCutterOD:''})),4.3125,'Unrelated operands do not control MCO');
assert.ok(operationWarnings(operation({ptc:'-1/2'})).some(row=>row.code==='negative-ptc'),'Keep existing signed-input warning policy');
for(const invalid of ['', 'oops','0oops','1/0','Infinity','--1']){
  for(const key of ['ptc','preAlphaPipeOD']){
    const patch=key==='preAlphaPipeOD'&&invalid===''?{bcoPipeMaterial:'Other',bcoPipeOD:'custom',pod:'99',preAlphaPipeOD:''}:{[key]:invalid};
    const op=operation(patch),before=structuredClone(op);
    assert.ok(Number.isNaN(mco(op)),key+' must not silently default invalid/missing input');
    const row=worksheetFor(op,'tap').find(row=>row.label===label);assert.ok(Number.isNaN(row.result));
    assert.deepEqual(op,before);
  }
}
const fresh=newJob();Object.assign(fresh.operations[0].state,state);
assert.equal(mco(fresh.operations[0]),4.3125);
const entry={id:'legacy-mco',record:{pipe:{material:'Carbon Steel',nominalSize:'6',trueOd:'6.625',pipeId:'6'},machine:{cutterOd:'4'},measurements:{hotTap:{md:'10',ptc:'1',rodStart:'2',mco:'99',rodMco:'100'}},futureRecord:{retain:true}}};
const original=structuredClone(entry),job=normalizeJob(entry),op=job.operations[0];
assert.equal(mco(op),4.3125);assert.equal(historicalMcoFor(job,op),'99');
op.state.ptc='1 1/4';assert.equal(mco(op),4.5625);assert.equal(historicalMcoFor(job,op),'99');
assert.match(historicalMcoMarkup(job,op),/Historical MCO \(not used\).*Original imported snapshot/s);
assert.match(historicalMcoMarkup(job,op),/99\.0000 in/);
assert.doesNotMatch(worksheetMarkup(op,'tap',createOriginTracker()),/99\.0000 in/);
assert.deepEqual(job.original,original);assert.deepEqual(entry,original);
assert.equal(historicalMcoFor(job,{id:'newly-added',state}),undefined,'An operation added later cannot inherit a single-operation legacy snapshot');
const multi=normalizeJob({id:'bundle',record:{measurements:{hotTap:{mco:'77'}},jobBundle:{selectedOperationId:'two',futureBundle:{keep:true},operations:[
  {id:'one',operationType:'Line Stop',state,measurements:{hotTap:{mco:'88'}}},
  {id:'two',operationType:'Tap & Complete',state:{...state,preAlphaPipeOD:'26',ptc:'2'}},
  {id:'three',operationType:'Hot Tap',state:{...state,preAlphaPipeOD:'28',ptc:'3'}}
]}}});
const before=structuredClone(multi);
assert.deepEqual(multi.operations.map(mco),[4.3125,15,17]);
assert.deepEqual(multi.operations.map(op=>historicalMcoFor(multi,op)),['88','77',undefined]);
multi.selectedOperationId='three';assert.equal(historicalMcoFor(multi,multi.operations[2]),undefined,'Switching cannot reassign the original selected-operation snapshot');
multi.selectedOperationId=before.selectedOperationId;assert.deepEqual(multi,before);
const ambiguous=structuredClone(multi);delete ambiguous.original.record.jobBundle.selectedOperationId;
assert.equal(historicalMcoFor(ambiguous,ambiguous.operations[1]),undefined,'No invented historical attribution when original selection is unknown');
const hostile=structuredClone(job);hostile.original.record.measurements.hotTap.mco='<img src=x>';
assert.doesNotMatch(historicalMcoMarkup(hostile,op),/<img/);
assert.equal(historicalMcoMarkup(fresh,fresh.operations[0]),'');
console.log('PASS MCO: established legacy calculator parity, actual/table OD, fractions, invalid/missing/signed values, independent operands, canonical Review/worksheet, new/legacy/multi-operation inputs and distinct immutable historical snapshots; no Rod MCO');

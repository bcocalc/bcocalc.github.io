import assert from 'node:assert/strict';
import {normalizeJob,resultsFor,geometry,number} from '../pre-alpha/model.mjs';
import {operationWarnings,reviewSections} from '../pre-alpha/review.mjs';
import {createOriginTracker,worksheetFor,worksheetMarkup} from '../pre-alpha/presentation.mjs';

const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ptc:'1',start:'2',mt:'52',unknown:{keep:true}};
const operation=patch=>({id:'tap',operationType:'Hot Tap',state:{...state,...patch}});
const results=op=>Object.fromEntries(resultsFor(op,'tap'));
function checkOutputs(op,lowerIn){
  const r=results(op),bco=geometry(op.state).bco;
  assert.equal(r['Lower in'],lowerIn);
  assert.equal(r['Pilot on pipe'],2+lowerIn,'Blank Hot Tap LD must not suppress Pilot on Pipe');
  assert.equal(r['Cutter on pipe'],3+lowerIn);
  assert.equal(r['Rod BCO'],3+lowerIn+bco);
  assert.equal(r['Total travel'],lowerIn+1+bco);
}

for(const patch of [{},{ld:undefined},{ld:null},{ld:''},{ld:' \t '},{ld:'',ldSign:'-'}]){
  const op=operation(patch),before=structuredClone(op);
  checkOutputs(op,10);
  assert.ok(!operationWarnings(op).some(w=>w.stage==='tap'&&['missing-inputs','invalid-ld'].includes(w.code)));
  assert.equal(reviewSections(op).find(s=>s.stage==='tap').inputs.find(i=>i.key==='ld').value,0);
  assert.equal(createOriginTracker().label(op,'ld'),'Default 0 - not entered');
  const sheet=worksheetFor(op,'tap');
  assert.equal(sheet[0].terms[1].value,0);
  assert.equal(sheet[0].terms[1].operator,patch.ldSign==='-'?'-':'+');
  assert.match(worksheetMarkup(op,'tap',createOriginTracker()),/Default 0 - not entered/);
  assert.deepEqual(op,before,'Defaults must not write an invented historical LD into the operation');
}

for(const [ld,sign,lowerIn] of [['2','+',12],['2','-',8],['-2','+',8],['-2','-',12],['+2','+',12],['1 1/2','-',8.5],['-1/2','+',9.5],['0','-',10],[0,'+',10],['-0','-',10]]){
  const op=operation({ld,ldSign:sign});
  checkOutputs(op,lowerIn);
  assert.equal(op.state.ld,ld);
  assert.equal(worksheetFor(op,'tap')[0].terms[1].value,ld,'Explicit input representation is retained');
  assert.equal(createOriginTracker().label(op,'ld'),'Origin unrecorded');
}
for(const ld of ['invalid','0oops','NaN','Infinity','1/0','--1',Infinity,{bad:true}]){
  const op=operation({ld});
  assert.ok(Object.values(results(op)).every(Number.isNaN),'Nonblank invalid LD must not be coerced to zero');
  assert.ok(operationWarnings(op).some(w=>w.code==='invalid-ld'));
  assert.equal(reviewSections(op).find(s=>s.stage==='tap').inputs.find(i=>i.key==='ld').value,ld);
  assert.doesNotMatch(createOriginTracker().label(op,'ld'),/Default/);
}
const edited=operation({ld:'2'}),origins=createOriginTracker();
origins.record(edited,'ld');assert.equal(origins.label(edited,'ld'),'Entered this session');
edited.state.ld='';origins.record(edited,'ld');
assert.equal(origins.label(edited,'ld'),'Default 0 - not entered','Clearing an entry must not label default zero as entered');
edited.state.ld='0';origins.record(edited,'ld');assert.equal(origins.label(edited,'ld'),'Entered this session');

for(const hotTap of [{md:'10',ptc:'1',rodStart:'2'},{md:'10',ld:'',ptc:'1',rodStart:'2'}]){
  const entry={id:'legacy',record:{meta:{operationType:'Hot Tap'},pipe:{material:'Carbon Steel',nominalSize:'6',pipeId:'6'},machine:{cutterOd:'4'},measurements:{hotTap},unknownOriginal:{keep:true}}};
  const before=structuredClone(entry),job=normalizeJob(entry),op=job.operations[0];
  checkOutputs(op,10);
  assert.equal(Object.hasOwn(op.state,'ld'),Object.hasOwn(hotTap,'ld'));
  assert.deepEqual(job.original,before);
  const reopened=normalizeJob({record:JSON.parse(JSON.stringify({jobBundle:job}))});
  checkOutputs(reopened.operations[0],10);
  assert.deepEqual(reopened.operations[0].state,op.state);
  assert.deepEqual(entry,before);
}
for(const key of ['md','ptc','start']){
  const op=operation({[key]:''});
  assert.ok(operationWarnings(op).some(w=>w.stage==='tap'&&w.kind==='missing'));
  assert.ok(Number.isNaN(results(op)[key==='md'?'Lower in':key==='start'?'Pilot on pipe':'Cutter on pipe']));
}
assert.ok(Number.isNaN(number('')),'The general numeric parser must still reject missing required values');
for(const [stage,patch] of [['stop',{lsMd:'10',lsLd:''}],['plug',{cpStart:'2',cpJbf:'1',cpLd:'',cpPt:'1'}]]){
  const op={operationType:'Line Stop',state:{...state,...patch}};
  assert.ok(Number.isNaN(resultsFor(op,stage)[0][1]),'Other stages must not inherit the Hot Tap LD default');
  assert.ok(operationWarnings(op).some(w=>w.stage===stage&&w.kind==='missing'));
}
assert.ok(operationWarnings(operation({mt:'1'})).some(w=>w.code==='machine-travel'),'Default LD must feed downstream travel checks');
console.log('PASS Pre-Alpha Hot Tap LD: blank/missing/whitespace calculate as zero without mutation; legacy hydration/reopen, signed/fraction/explicit zero, invalid entries, origins/Review, downstream outputs and unrelated required fields');

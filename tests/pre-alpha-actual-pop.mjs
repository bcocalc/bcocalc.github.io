import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {actualPopFor,applyActualPop,resetActualPop,calculatedPop,resultsFor,geometry,normalizeJob} from '../pre-alpha/model.mjs';
import {worksheetFor} from '../pre-alpha/presentation.mjs';
import {reviewSections,operationWarnings} from '../pre-alpha/review.mjs';
import {buildExportText} from '../pre-alpha/exports.mjs';
const state={md:'10',ld:'2',start:'5',ptc:'1',preAlphaPipeOD:'16',bcoPipeID:'15.5',bcoCutterOD:'8',mt:'52',htActualPop:'999',htFieldBasis:'legacy retained',unknown:{keep:[1,2]}};
const op={id:'test',label:'Test tap',operationType:'Hot Tap',state:structuredClone(state)};
const values=()=>Object.fromEntries(resultsFor(op,'tap'));
assert.equal(calculatedPop(op),17);assert.equal(actualPopFor(op),null);
op.state.v3ActualPopInput='18 1/2';assert.equal(values()['Pilot on pipe'],17,'Typing is not applying');
assert.equal(applyActualPop(op),true);assert.equal(actualPopFor(op),18.5);
const bco=geometry(state).bco;
for(const [label,expected]of Object.entries({'Pilot on pipe':18.5,'Cutter on pipe':19.5,'Rod BCO':19.5+bco,'Total travel':13.5+1+bco,'Lower in':13.5,'Maximum cut out (MCO)':9,'Rod MCO':27.5}))assert.equal(values()[label],expected,label);
assert.deepEqual(Object.fromEntries(Object.keys(state).map(k=>[k,op.state[k]])),state,'Raw setup, legacy measurements and unknown data stay intact');
assert.equal(calculatedPop(op),17);
assert.equal(worksheetFor(op,'tap').find(r=>r.label==='Lower in').formula,'Actual POP - Rod start');
assert.equal(reviewSections(op).find(s=>s.stage==='tap').mode,'Applied actual POP');
assert.ok(operationWarnings(op).some(w=>w.code==='actual-pop-active'));
const job={title:'Synthetic',sharedState:{},operations:[op]};assert.match(buildExportText(job),/Applied actual POP: 18\.5000 in \(18 1\/2 in\) \| Calculated POP: 17\.0000 in \(17 in\)/);
assert.equal(actualPopFor(JSON.parse(JSON.stringify(op))),18.5,'Saved object reopens applied');
for(const invalid of ['', 'bad','1/0','Infinity','12oops']){op.state.v3ActualPopInput=invalid;assert.equal(applyActualPop(op),false);assert.equal(actualPopFor(op),18.5,'Invalid draft cannot replace applied reading');}
op.state.ptc='2';assert.equal(values()['Cutter on pipe'],20.5,'Downstream inputs continue recalculating');
op.state.start='6';assert.equal(values()['Lower in'],12.5);
for(const type of ['Line Stop','Tap & Complete','Completion Plug','HTP','Hi-Stop','Unknown']){
 const other={...op,operationType:type,state:structuredClone(op.state)};const before=structuredClone(other);
 assert.equal(actualPopFor(other),null);assert.equal(applyActualPop(other),false);assert.equal(resetActualPop(other),false);assert.deepEqual(other,before);
 const noActual={...other,state:{...other.state}};delete noActual.state.v3ActualPop;
 for(const stage of ['pipe','tap','stop','plug','htp','hiStop'])assert.deepEqual(resultsFor(other,stage),resultsFor(noActual,stage),'Other modes unchanged: '+type+'/'+stage);
}
assert.equal(resetActualPop(op),true);assert.equal(values()['Pilot on pipe'],18);assert.equal(op.state.v3ActualPopInput,'12oops');
for(const reading of ['0','-1 1/2','+3/4']){op.state.v3ActualPopInput=reading;assert.equal(applyActualPop(op),true);assert.ok(Number.isFinite(actualPopFor(op)));}
for(const malformed of [{version:1,reading:'bad'},{version:2,reading:'10'},{version:1,reading:10},null]){op.state.v3ActualPop=malformed;assert.equal(actualPopFor(op),null);}
const input={id:'bundle',record:{future:{keep:true},jobBundle:{operations:[{...op,state},{id:'second',operationType:'Line Stop',state:{lsMd:'47',unknown:'untouched'}}]}}};const before=structuredClone(input);const normalized=normalizeJob(input);assert.deepEqual(input,before);assert.deepEqual(normalized.original,before);
// Confirm exact established standard setup formulas, independent of new code.
const legacy=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
for(const expression of ['const li = md + ld','const pop = start + li','const cop = pop + ptc','const ttd = li + ptc + (Number(data.bco) || 0)','const rmco = pop + mco'])assert.ok(legacy.includes(expression),expression);
console.log('PASS V3 actual POP: explicit apply/reset, exact downstream formulas, invalid/fraction/signed/zero input, persistence, Review/worksheet/export attribution, immutable originals and unchanged other modes');

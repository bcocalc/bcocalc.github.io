import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginTracker,worksheetFor,worksheetMarkup,matchingJobs,jobRowsMarkup} from '../pre-alpha/presentation.mjs';
import {resultsFor} from '../pre-alpha/model.mjs';
import {referenceProvenance,REFERENCE_CATEGORIES} from '../pre-alpha/references.mjs';
import {SUPPLEMENT} from '../pre-alpha/reference-supplement-data.mjs';

const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',bcoCutterID:'3.5',md:'10',ld:'2',ldSign:'-',start:'1',ptc:'1',lsMd:'10',lsLd:'0',lineStopMdUserEdited:false,lsTravel:'0',lsMachineTravel:'52',cpStart:'20',cpJbf:'1.25',cpLd:'0.5',cpPt:'2.75',cpLiManual:'99',cpLiManualToggle:false,unknown:{retain:['all',3]}};
const operation={id:'one',label:'Stop one',operationType:'Line Stop',state};
const original=JSON.stringify(operation),origins=createOriginTracker();
assert.equal(origins.label(operation,'md'),'Origin unrecorded');
assert.equal(origins.label(operation,'bcoPipeID'),'Origin unrecorded','A value equal to a table row does not prove table provenance');
assert.equal(origins.label(operation,'preAlphaPipeOD'),'From pipe size table');
assert.equal(origins.label({...operation,state:{...state,preAlphaPipeOD:'invalid'}},'preAlphaPipeOD'),'Origin unrecorded','Invalid entered dimensions still have unknown provenance, not a fabricated missing value');
assert.equal(origins.label(operation,'lsMd'),'Follows Hot Tap MD');
assert.equal(origins.label({...operation,retiredLineStopOD:{value:'8'}},'previous-pipe-od'),'Archived - not used');
assert.equal(origins.label(operation,'cpLiManual'),'Inactive override - not used');
assert.equal(origins.label(operation,'pipe-source-od'),'From Pipe & cutter');
origins.record(operation,'md');
assert.equal(origins.label(operation,'md'),'Entered this session');
assert.equal(createOriginTracker().label(operation,'md'),'Origin unrecorded','Unrecorded history is not manufactured across reload');
origins.record(operation,'bcoPipeID','table');
assert.equal(origins.label(operation,'bcoPipeID'),'Table selected this session');
assert.equal(JSON.stringify(operation),original);
console.log('PASS presentation origins: explicit linkage and session observations only; imported provenance stays unknown');

for(const changes of [{},{ld:'-2',ldSign:'-'},{ld:'0',start:'0'},{md:''},{cpLiManualToggle:true},{lsLiManualToggle:true,lsLiManual:'-1'},{bcoPipeID:'invalid'}]){
  const op={...operation,state:{...state,...changes}},before=JSON.stringify(op);
  for(const stage of ['pipe','tap','stop','plug']){
    for(const row of worksheetFor(op,stage))assert.ok(Object.is(row.result,resultsFor(op,stage).find(([label])=>label===row.label)[1]),'Worksheet must reuse canonical result');
    const markup=worksheetMarkup(op,stage,origins);
    assert.match(markup,/Calculation worksheet/);
    if(stage==='plug'&&changes.cpLiManualToggle)assert.doesNotMatch(markup,/Plug Start/,'Inactive setup must not enter active manual worksheet');
  }
  assert.equal(JSON.stringify(op),before);
}
const tap=worksheetFor(operation,'tap');
assert.deepEqual(tap[0].terms.map(term=>[term.label,term.operator,term.value]),[['Hot Tap MD','+','10'],['Hot Tap LD','-','2']]);
assert.equal(tap[0].result,8);
assert.equal(worksheetFor(operation,'plug')[0].result,24.5);
assert.doesNotMatch(worksheetMarkup(operation,'plug',origins),/99/);
assert.deepEqual(worksheetFor(operation,'saved'),[]);
const hostile={...operation,state:{...state,md:'<img src=x onerror=alert(1)>'}};
assert.doesNotMatch(worksheetMarkup(hostile,'tap',origins),/<img/);
console.log('PASS worksheet operands: signs, zeros, missing/invalid values, manual modes, inactive separation and unchanged canonical results');

const jobs=Array.from({length:75},(_,index)=>({id:String(index),title:index===74?'Last job':'Shared title',savedAt:String(index).padStart(3,'0'),sharedState:{jobNumber:'number-'+index,jobTechnician:'Technician '+index},operations:[{id:'op',label:index===74?'Far-page needle':'Stop',operationType:'Line Stop',state:{bcoPipeOD:'6'}}],original:{keep:true}}));
const jobsBefore=JSON.stringify(jobs);
assert.equal(matchingJobs(jobs,'Far-page needle')[0].id,'74');
assert.equal(matchingJobs(jobs,'number-74')[0].id,'74');
assert.equal(matchingJobs(jobs,'Technician 74')[0].id,'74');
assert.equal(matchingJobs(jobs,'missing').length,0);
const markup=jobRowsMarkup([{...jobs[0],title:'<unsafe>',operations:[{label:'A & B',state:{}}]}],'device');
assert.match(markup,/class="job-card" data-job="0"/);
assert.match(markup,/<details class="job-row-details">/);
assert.doesNotMatch(markup,/<unsafe>/);
assert.match(markup,/A &amp; B/);
assert.equal(JSON.stringify(jobs),jobsBefore);
console.log('PASS compact library: full-list search before pagination, stable IDs, expandable escaped details and no mutation');

const sourcesBefore=JSON.stringify(SUPPLEMENT);
for(const category of Object.keys(REFERENCE_CATEGORIES)){
  const info=referenceProvenance(category);
  assert.ok(info.source&&info.revision&&info.applicability);
  if(!['pivothead','uwire'].includes(category))assert.match(info.revision,/Not recorded/);
}
assert.match(referenceProvenance('pivothead').revision,/Rev.1/);
assert.match(referenceProvenance('uwire').revision,/Rev.3/);
assert.match(referenceProvenance('cutters',{kind:'floStopHotTap'}).applicability,/FloStop/);
assert.match(referenceProvenance('papergaskets').applicability,/not verified/);
assert.match(referenceProvenance('manuals').applicability,/five.*placeholders/);
assert.equal(SUPPLEMENT.manuals.length,5);
assert.equal(JSON.stringify(SUPPLEMENT),sourcesBefore);
assert.match(readFileSync(new URL('../pre-alpha/service-worker.js',import.meta.url),'utf8'),/'\.\/presentation\.mjs\?v='\+BUILD/);
console.log('PASS source presentation: all categories, only recorded revisions, five unchanged placeholders and offline asset inclusion');

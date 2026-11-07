import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {TRUE_OD} from '../pre-alpha/pipe-data.mjs';
import {calculatePivotSetup,pivotSetupFields,pivotSetupReference,PIVOT_5014_NOTES,PIVOT_SHOP_BACKING_RULE,PIVOT_CENTER_GUIDE,PIVOT_CENTER_SOURCE} from '../pre-alpha/pivot-head-5014.mjs';
import {pivotSetupSummary,renderPivotSetup} from '../pre-alpha/pivot-setup-view.mjs';
import {referenceProvenance,referenceTables} from '../pre-alpha/references.mjs';
let checks=0;
const eq=(a,b,note)=>{assert.deepEqual(a,b,note);checks++;};
const ok=(x,note)=>{assert.ok(x,note);checks++;};
const input={headType:'conventional',pipeSize:'16.0',wall:'3/8',measuredNose:'14'};
const before=JSON.stringify(input),summary=pivotSetupSummary(input),html=renderPivotSetup(input);
eq(summary.result,calculatePivotSetup(input));eq(JSON.stringify(input),before,'No input mutation');eq(summary.held,false);
for(const text of ['15.2500 in','14.5000 in','14.7500 in','7.6250 in','7.5625 in','15.3750 in','+1/16 in','+1/8 in','Backing plate required (shop rule)','Size comparisons only','not an approved seal tolerance','Required under the configured shop rule','Not calculated; confirm the shop-approved plate','Rev. 2','July 29, 2025','may be required'])ok(html.includes(text),text);
eq((html.match(/class="pivot-result"/g)||[]).length,4);assert.match(html,/data-pivot-center-guide/);assert.match(PIVOT_CENTER_GUIDE,/two consecutive bolt holes.*two opposite-side lines/);assert.match(PIVOT_CENTER_GUIDE,/hole-pattern center/);assert.match(PIVOT_CENTER_GUIDE,/Confirm the intended line alignment.*do not guess the construction/);assert.match(PIVOT_CENTER_GUIDE,/Confirm this corresponds to the nose-piece center/);assert.match(PIVOT_CENTER_SOURCE,/page 26.*Revision and date are not visible/);assert.doesNotMatch(html,/<img|<svg|tangent|hole centers/);eq((html.match(/class="pivot-seal-options"/g)||[]).length,1);
assert.doesNotMatch(html,/<dt>-1\/16 in|<dt>-1\/32 in|matches the source target|Diameter short|Shortfall per side|500 psi|3\/16–1\/4|Rev\.1/);
const result=calculatePivotSetup(input);
eq(result.seals.map(s=>s.offset),[0,1/16,1/8]);eq(result.seals.map(s=>s.diameter),[15.25,15.3125,15.375]);
assert.doesNotMatch(html,/\+1\/32 in|\+3\/32 in/,'Only the three requested seal comparisons');
eq(result.backingRequired,null,'No procedure requirement is fabricated');eq(result.shopBackingRequired,true);ok(Number.isNaN(result.backingOd));
assert.doesNotMatch(html,/Contact HTS Technical Support|directs Technical Support/,'Primary shop workflow uses the stocked approved specification');
ok(PIVOT_5014_NOTES.some(n=>n.includes('HTS Technical Support')&&n.includes('0.063 in (14-gauge)')),'Source qualification remains intact in details');
assert.match(PIVOT_SHOP_BACKING_RULE,/supplied shop instruction, not a requirement established by HTS-5014/);
// Every catalog size, all inclusive boundaries and values just outside. These
// are dimensional tests only, not pressure/material/equipment approval.
for(const [material,sizes]of Object.entries(TRUE_OD))for(const [pipeSize,od]of Object.entries(sizes)){
  const n=Number(pipeSize),v={headType:'conventional',material,pipeSize,wall:'.25'},id=od-.5;
  const range=n>=3&&n<=4?[1/8,1/4]:n>=6&&n<=12?[1/2,5/8]:n>=14&&n<=48?[1/2,3/4]:null;
  const r=calculatePivotSetup(v);eq(r.pipeId,id);
  if(!range){ok(Number.isNaN(r.noseLow));ok(Number.isNaN(r.loadPadTarget));eq(r.loadPadRequired,null);eq(r.status,'unavailable');continue;}
  eq([r.noseLow,r.noseHigh],[id-range[1],id-range[0]]);eq(r.loadPadRequired,n>4);eq(r.loadPadTarget,n>4?id/2:NaN);eq(r.loadPadLow,n>4?id/2-1/16:NaN);
  for(const [nose,status]of [[r.noseLow,'within'],[r.noseHigh,'within'],[(r.noseLow+r.noseHigh)/2,'within'],[r.noseLow-1e-6,'below'],[r.noseHigh+1e-6,'above']]){
    const check=calculatePivotSetup({...v,measuredNose:nose});eq(check.status,status);eq(check.backingRequired,null);eq(check.shopBackingRequired,status==='below'?true:status==='within'?false:null,'Strict unrounded shop trigger');ok(Number.isNaN(check.backingOd));
  }
  for(const pressureBand of ['','under500','over500','at500','invalid'])eq(calculatePivotSetup({...v,pressureBand}),r,'Legacy pressure selector cannot alter the new dimensional range');
}
// Three formerly misclassified noses must now be within the source ranges.
for(const v of [{pipeSize:'3.0',measuredId:'3',measuredNose:'2.8125'},{pipeSize:'6.0',measuredId:'6',measuredNose:'5.4375'},{pipeSize:'14.0',measuredId:'13',measuredNose:'12.5'}])eq(calculatePivotSetup({...v,headType:'conventional'}).status,'within');
for(const headType of ['','hotstop','other','unsupported']){
  const r=calculatePivotSetup({...input,headType});ok(Number.isNaN(r.noseLow));ok(Number.isNaN(r.loadPadTarget));eq(r.loadPadRequired,null);eq(r.seals.length,3,'Neutral arithmetic is separate from approval');eq(r.status,'family-unconfirmed');eq(r.shopBackingRequired,null);
  const text=renderPivotSetup({...input,headType});assert.doesNotMatch(text,/14\.5000 in|7\.6250 in|0\.063 in|data-pivot-center-guide/);
}
for(const key of ['wall','measuredId','measuredNose'])for(const bad of ['no','1/0','-1','0','<script>','1"2']){
  const r=calculatePivotSetup({...input,[key]:bad});ok(Number.isNaN(r.pipeId));ok(Number.isNaN(r.noseLow));eq(r.seals,[]);eq(r.shopBackingRequired,null);
  const out=renderPivotSetup({...input,[key]:bad});assert.doesNotMatch(out,/data-pivot-center-guide/);assert.match(out,/Enter valid pipe dimensions/);assert.doesNotMatch(out,/<script>|15\.2500 in/);
}
for(const v of [{wall:'8'},{measuredId:'16'},{measuredId:'17'},{material:'Other'},{pipeSize:'15.0'}])ok(Number.isNaN(calculatePivotSetup({...input,...v}).pipeId));
eq(calculatePivotSetup({...input,measuredNose:''}).status,'awaiting-measurement');eq(calculatePivotSetup({...input,measuredNose:''}).shopBackingRequired,null);
for(const measuredNose of ['14.5','14.75']){const h=renderPivotSetup({...input,measuredNose});assert.match(h,/No backing plate required for this nose-size check/);assert.match(h,/does not rule out other backing-plate requirements/);assert.doesNotMatch(h,/Backing plate required \(shop rule\)/);}
const above=renderPivotSetup({...input,measuredNose:'14.750001'});assert.match(above,/STOP: nose O.D. is above range/);assert.match(above,/not a remedy for an oversized nose/);assert.doesNotMatch(above,/Backing plate required \(shop rule\)/);
for(const measuredNose of ['14.499999','14 7/16'])assert.match(renderPivotSetup({...input,measuredNose}),/Backing plate required \(shop rule\)/);
eq(calculatePivotSetup({...input,measuredId:'15 1/2'}).pipeId,15.5);
assert.match(renderPivotSetup({...input,measuredId:'15 1/2'}),/Using your measured I.D. override/);
for(const v of [{pipeSize:'15.0'},{pipeSize:'2.0'},{measuredId:'.01'}]){const r=calculatePivotSetup({...input,...v});eq(r.shopBackingRequired,null);assert.doesNotMatch(renderPivotSetup({...input,...v}),/data-pivot-center-guide/);}
const tiny={headType:'conventional',pipeSize:'3.0',measuredId:'.01'};eq(pivotSetupSummary(tiny).held,true);eq(calculatePivotSetup(tiny).seals,[]);eq(pivotSetupReference(tiny).tables,[]);assert.doesNotMatch(renderPivotSetup(tiny),/-0\.2400|-0\.1150/);
assert.match(pivotSetupReference(tiny).issue,/Setup dimensions held/);
assert.match(renderPivotSetup({headType:'conventional',pipeSize:'3.0',wall:'.25'}),/Not applicable for 3–4 in conventional heads/);assert.doesNotMatch(renderPivotSetup({headType:'conventional',pipeSize:'3.0',wall:'.25'}),/data-pivot-center-guide/);
for(const pipeSize of ['42.0','48.0']){ok(Number.isFinite(calculatePivotSetup({...input,pipeSize}).noseLow));assert.match(renderPivotSetup({...input,pipeSize}),/supplied conventional seal tables stop at 36 in/);}
ok(PIVOT_5014_NOTES.some(n=>n.includes('3–36')&&n.includes('42–48')),'Separate seal applicability warning');
assert.match(referenceProvenance('pivothead').revision,/Rev\. 2, July 29, 2025/);
eq(referenceTables('pivothead',input),pivotSetupReference(input),'Current reference route uses new source, not legacy tables');
const details=JSON.stringify(referenceTables('pivothead',input));assert.doesNotMatch(details,/Section 7|Rev\.1|Clearance B|Diameter add comparison|Per-side add comparison|Nose plate O.D. target/);
ok(pivotSetupFields().some(f=>f.key==='headType'&&f.options[0][0]===''));ok(!pivotSetupFields().some(f=>f.key==='pressureBand'));
// Retained legacy calculations remain byte-identical for historical parity;
// active Pivot UI instead imports the explicitly separate5014 module.
eq(createHash('sha256').update(readFileSync(new URL('../pre-alpha/reference-helpers.mjs',import.meta.url))).digest('hex'),'3bdcefe680b912b97f52d4e14090742048301aed634d1d33664fa42c4261fbe4');
const worker=readFileSync(new URL('../pre-alpha/service-worker.js',import.meta.url),'utf8');assert.match(worker,/pivot-setup-view\.mjs/);assert.match(worker,/pivot-head-5014\.mjs/);
console.log('PASS '+checks+' Pivot5014 checks: exact source ranges, inclusive unrounded boundaries, unsupported families/sizes, neutral seal comparisons, separately identified strict shop backing trigger, unresolved backing O.D., invalid geometry, current UI routing, no input mutation, unchanged legacy helpers');

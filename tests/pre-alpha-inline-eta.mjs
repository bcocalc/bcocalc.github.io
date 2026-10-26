import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {etaFor,formatEta} from '../pre-alpha/eta.mjs';
import {etaPresentation,etaResultPanel,etaSummary} from '../pre-alpha/eta-view.mjs';
import {BUILD,resultsFor} from '../pre-alpha/model.mjs';

const operation=(patch={})=>({operationType:'Hot Tap',state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',bcoCutterID:'3.5',...patch}});
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS inline ETA: '+name);}
const hasValue=(html,key,value)=>{assert.ok(html.includes('data-eta-value="'+key+'"'),key+' visible');assert.ok(html.includes(value),value+' visible');};

check('BCO, chart RPM and cutting time are visible without a disclosure',()=>{
  const op=operation(),original=JSON.stringify(op),eta=etaFor(op,'360 / 152');
  const html=etaResultPanel(op,'360 / 152',{primary:true,secondary:resultsFor(op,'pipe').slice(1)});
  hasValue(html,'bco',eta.distance.toFixed(4));hasValue(html,'chart-rpm','35 / 45');hasValue(html,'time',formatEta(eta.lowMinutes));
  assert.match(html,/Recommended RPM/);assert.match(html,/Cutting ETA/);assert.match(html,/Coupon free/);assert.match(html,/Wall thickness/);
  assert.doesNotMatch(html,/<details|\shidden|aria-hidden/);assert.equal((html.match(/class="big-value"/g)||[]).length,1);
  assert.match(html,/Edit ETA assumptions/);assert.equal(JSON.stringify(op),original,'Display must not save or rewrite inputs');
});
check('machine, source, lookup size, feed and cutting-only qualifications are always visible',()=>{
  const html=etaResultPanel(operation(),'360 / 152');
  for(const text of ['Machine:</strong> 360 / 152','RPM chart profile:</strong> 360 / 152','Exact chart size','follows job machine','follows cutter O.D.','ETA RPM used:','0.0040 in/revolution','Feed speed:','cutter-shell BCO only','not Rod BCO or total travel','Not complete Hot Tap, Line Stop, Completion Plug, or job duration','not a verified speed or duration guarantee'])assert.ok(html.includes(text),text);
  assert.equal(etaPresentation(operation(),'360 / 152').feed,'0.140 - 0.180 in/min');
  assert.doesNotMatch(etaSummary(operation(),'360 / 152'),/class="big-value"/,'Secondary summary cannot replace the primary stage result');
});
check('display follows changing geometry without inventing missing dimensions',()=>{
  const op=operation(),before=etaPresentation(op,'360 / 152');op.state.bcoCutterOD='3';
  const after=etaPresentation(op,'360 / 152');assert.notEqual(after.distance,before.distance);assert.notEqual(after.time,before.time);
  for(const patch of [{bcoPipeID:''},{bcoPipeID:'invalid'},{preAlphaPipeOD:'invalid'},{bcoCutterOD:''},{bcoCutterOD:'9'}]){
    const changed=operation(patch),view=etaPresentation(changed,'360 / 152'),html=etaResultPanel(changed,'360 / 152');
    assert.equal(view.time,'Not calculated');assert.ok(view.eta.issue);assert.ok(html.includes(view.eta.issue));assert.doesNotMatch(html,/NaN|Infinity/);
  }
});
check('exact, interpolated and nearest sources retain their distinctions',()=>{
  const interpolated=operation({preAlphaPipeOD:'20',bcoPipeID:'19',bcoCutterOD:'15',etaMachine:'1200'});
  assert.equal(etaPresentation(interpolated).chartRpm,'22 / 23 / 24');
  assert.match(etaResultPanel(interpolated),/Interpolated between chart sizes 14 and 16/);
  const nearest=operation({preAlphaPipeOD:'48',bcoPipeID:'47',bcoCutterOD:'42',etaMachine:'360'});
  assert.match(etaResultPanel(nearest),/Outside chart range: nearest chart size/);
  assert.match(etaResultPanel(nearest),/class="warning">The chart recommendation uses the nearest charted cutter size/);
  nearest.state.etaRpmOverride='40';const manual=etaResultPanel(nearest);
  assert.match(manual,/The chart recommendation uses the nearest charted cutter size/);assert.match(manual,/manual override; chart above is reference only/);assert.doesNotMatch(manual,/ETA uses the nearest/);
});
check('recommended chart RPM never masquerades as an active manual override',()=>{
  const op=operation({etaRpmOverride:'40'}),view=etaPresentation(op,'360 / 152'),html=etaResultPanel(op,'360 / 152');
  assert.equal(view.rpm,'40');assert.equal(view.chartRpm,'35 / 45');assert.equal(view.time,formatEta(view.eta.distance/(40*.004)));
  hasValue(html,'used-rpm','40');hasValue(html,'chart-rpm','35 / 45');assert.match(html,/manual override; chart above is reference only/);assert.match(html,/Manual RPM override is active/);
  for(const value of ['bad','0','-1']){
    op.state.etaRpmOverride=value;const invalid=etaPresentation(op,'360 / 152');
    assert.equal(invalid.time,'Not calculated');assert.equal(invalid.chartRpm,'35 / 45');assert.match(etaResultPanel(op,'360 / 152'),/Manual RPM must be a valid number greater than zero/);
  }
  op.state.etaRpmOverride='';assert.equal(etaPresentation(op,'360 / 152').time,etaPresentation(operation(),'360 / 152').time);
});
check('machine inheritance, explicit empty/unknown profiles and lookup overrides remain explicit',()=>{
  assert.equal(etaPresentation(operation(),'360 / 152').eta.profile,'360');assert.equal(etaPresentation(operation(),'1200-M120').eta.profile,'1200');
  for(const etaMachine of ['','Unknown saved chart']){
    const op=operation({etaMachine}),view=etaPresentation(op,'360 / 152');
    assert.equal(view.time,'Not calculated');assert.equal(view.chartRpm,'Not available');assert.match(etaResultPanel(op,'360 / 152'),/No supported chart/);
    op.state.etaRpmOverride='40';assert.notEqual(etaPresentation(op,'360 / 152').time,'Not calculated','Valid manual RPM remains available without a chart');
  }
  const override=operation({etaMachine:'1200',etaCutterSize:'15'}),view=etaPresentation(override,'360 / 152');
  assert.equal(view.chartRpm,'22 / 23 / 24');assert.equal(view.eta.distance,etaFor(operation()).distance);
  assert.match(etaResultPanel(override,'360 / 152'),/saved lookup override/);assert.match(etaResultPanel(override,'360 / 152'),/saved profile selection/);assert.match(etaResultPanel(override,'360 / 152'),/RPM chart profile:<\/strong> 1200-M120/);
});
check('saved ETA distance is retained but not substituted for current BCO',()=>{
  const op=operation({etaBco:'99'}),before=JSON.stringify(op),view=etaPresentation(op,'360 / 152');
  assert.notEqual(view.eta.distance,99);assert.match(etaResultPanel(op,'360 / 152'),/Saved ETA distance 99 is retained but not used/);assert.equal(JSON.stringify(op),before);
});
check('untrusted saved values are escaped and unsupported operations have no estimate',()=>{
  const html=etaResultPanel(operation({etaBco:'<img src=x>',etaCutterSize:'<svg onload=x>'}),'<script>');
  assert.doesNotMatch(html,/<img|<svg|<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;svg/);
  const op=operation();op.operationType='Re Stop';assert.equal(etaPresentation(op,'360 / 152').time,'Not calculated');
});
check('new presentation module is cached by the isolated synchronized build',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const assets=JSON.parse(vm.runInNewContext(read('pre-alpha/service-worker.js')+';JSON.stringify(ASSETS)',{URL,self:{location:{href:'https://example.test/pre-alpha/service-worker.js'},addEventListener(){}}}));
  assert.ok(assets.includes('./eta-view.mjs?v='+BUILD));
  for(const file of ['pre-alpha/workspace.mjs','pre-alpha/auxiliary.mjs'])assert.ok(read(file).includes("./eta-view.mjs?v="+BUILD));
});
console.log('PASS '+checks+' inline ETA presentation groups; calculation/source data remain in existing model.');

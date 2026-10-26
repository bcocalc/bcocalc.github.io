import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DATA} from '../pre-alpha/reference-data.mjs';
import {etaFor,rpmMatch,machineProfile,formatEta} from '../pre-alpha/eta.mjs';
import {referenceTables,REFERENCE_CATEGORIES,positiveDecimal} from '../pre-alpha/references.mjs';
import {termHelp,TERMS,FIELD_HELP} from '../pre-alpha/help.mjs';
import {normalizeJob,migratePipeSource,pipeSourceWarning,resultsFor,BUILD} from '../pre-alpha/model.mjs';
import {operationWarnings} from '../pre-alpha/review.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function constant(source,name){const match=source.match(new RegExp('const '+name+' = ([\\s\\S]*?);(?:\\r?\\n|$)'));assert.ok(match,name);return JSON.parse(vm.runInNewContext('JSON.stringify(('+match[1]+'))'));}
const core=read('dev/measurement.js');
for(const [key,name]of Object.entries({glossary:'glossaryRowsData',rpm:'etaRpmChart',bolting:'boltingChartData',htp:'htpChartData',plant150:'plant150Data',plant600:'plant600Data',sealtite:'sealtite1JackboltData',garlock:'garlock600Data'}))assert.deepEqual(DATA[key],constant(core,name),name+' source parity');
assert.deepEqual(DATA.cutters,constant(read('dev/reference/cutter-sizes.js'),'CHARTS'));
for(const name of Object.keys(DATA.manual))assert.deepEqual(DATA.manual[name],constant(read('dev/overlays/tapcalc-field-manual.js'),name));
for(const name of Object.keys(DATA.folding))assert.deepEqual(DATA.folding[name],constant(read('dev/overlays/tapcalc-folding-head-reference.js'),name));
const smart=read('dev/overlays/tapcalc-smartstop-reference.js');
assert.deepEqual(DATA.smartstop,JSON.parse(vm.runInNewContext(smart.slice(smart.indexOf('  function rangeLabel'),smart.indexOf('  function byId'))+';JSON.stringify({suffixCharts,torqueRows})')));
const dataBefore=JSON.stringify(DATA);
for(const category of Object.keys(REFERENCE_CATEGORIES)){
  const data=referenceTables(category);assert.ok(data.tables.length||data.lists.length,category);assert.doesNotMatch(data.note,/undefined/);
  for(const table of data.tables)for(const row of table.rows)assert.equal(row.length,table.columns.length,table.title);
}
for(const topic of ['thread','rpm','histop','machines','checks'])assert.ok(referenceTables('fieldmanual',{topic}).tables.length);
assert.equal(referenceTables('smartstop',{size:'6',wall:'.235'}).tables[0].rows.length,2);
assert.ok(referenceTables('smartstop',{size:'6',wall:'bad'}).issue);
assert.equal(referenceTables('cutters',{kind:'lineStop',pipe:'42'}).tables[0].rows.length,0);
assert.equal(referenceTables('cutters',{kind:'floStopLineStop',pipe:'22'}).tables[0].rows.length,0);
assert.equal(positiveDecimal(''),null);assert.ok(Number.isNaN(positiveDecimal('1/4')));
assert.equal(referenceTables('fractions',{decimal:'-1.5'}).note.startsWith('Nearest 1/64 in: -1 1/2.'),true);
assert.deepEqual(rpmMatch('360','4').values,[35,45]);assert.equal(rpmMatch('1200','15').basis,'interpolated');
assert.deepEqual(rpmMatch('1200','15').values,[22,23,24]);assert.equal(rpmMatch('360','42').basis,'nearest');
assert.equal(rpmMatch('360','4bad').basis,'unavailable');assert.equal(machineProfile('Legacy unknown'),'');
for(const [name,profile]of [['360 / 152','360'],['HTM 760','660'],['1200-M120','1200']])assert.equal(machineProfile(name),profile);
const op={operationType:'Hot Tap',state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'4.0',bcoPipeID:'4.026',bcoCutterOD:'3',etaMachine:'360'}};
const eta=etaFor(op),distance=resultsFor(op,'pipe')[0][1];
assert.equal(eta.lowMinutes,distance/(45*.004));assert.equal(eta.highMinutes,distance/(35*.004));
op.state.etaRpmOverride='40';assert.equal(etaFor(op).lowMinutes,distance/(40*.004));
for(const value of ['bad','0','-1']){op.state.etaRpmOverride=value;assert.ok(etaFor(op).issue);assert.ok(Number.isNaN(etaFor(op).lowMinutes));}
op.state.etaRpmOverride='';op.state.etaMachine='';assert.ok(etaFor(op,'Unknown').issue);
op.state.etaBco='99';assert.ok(operationWarnings(op).some(check=>check.code==='eta-distance-source'&&check.kind==='info'),'Retained ETA distance changes are disclosed in Review');
op.state.etaRpmOverride='40';assert.equal(etaFor(op,'Unknown').lowMinutes,distance/(40*.004),'Manual RPM is explicit even without a profile');
op.operationType='Re Stop';assert.ok(etaFor(op).issue,'No Hot Tap ETA fallback for unsupported equipment');
assert.equal(formatEta(1.5),'1 min 30 sec');assert.equal(formatEta(NaN),'Not calculated');
for(const key of ['MD','LD','LI','PTC','BCO','CCO','MCO','POP','COP','TTD','TCO','MT','POD','OD','ID','WT','JBF','PT','RPM','ETA','RF','RTJ'])assert.ok(TERMS[key]?.full,key);
assert.match(termHelp('MD','stop').meaning,/Line Stop/);assert.match(termHelp('BCO','htp').meaning,/not verified/);
assert.doesNotMatch(termHelp('HTP').meaning,/High Temperature|High Pressure/);assert.match(FIELD_HELP.lsLd,/independent/);
const source={id:'legacy',record:{jobBundle:{operations:[{id:'a',operationType:'Line Stop',state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',bcoPipeID:'6',lsMd:'10',lsLd:'0',lsPod:'8'}}]}}};
const original=JSON.stringify(source),job=normalizeJob(source),working=job.operations[0];
assert.equal(migratePipeSource(working),true);assert.match(pipeSourceWarning(working).message,/17.6875.*16.3125/);
assert.equal(resultsFor(working,'stop')[0][1],16.3125);working.state.preAlphaPipeOD='7';assert.equal(resultsFor(working,'stop')[0][1],16.5);
assert.equal(migratePipeSource(working),false);assert.equal(JSON.stringify(source),original);assert.deepEqual(job.original,source);
const same={state:{...working.state,preAlphaPipeOD:'',lsPod:'6.625'}};migratePipeSource(same);assert.equal(pipeSourceWarning(same),null,'Equal legacy value is archived without a false result-change warning');
assert.equal(JSON.stringify(DATA),dataBefore,'Read-only reference lookups preserve every source table');
assert.doesNotMatch(resultsFor.toString(),/lsPod/,'Retired O.D. cannot re-enter calculations');
const fields=constant(read('pre-alpha/workspace.mjs'),'fields');
assert.ok(!Object.values(fields).flat().some(([key])=>key==='lsPod'),'No duplicate editable Line Stop O.D.');
for(const [key]of Object.values(fields).flat())assert.ok(FIELD_HELP[key],key+' has contextual help');
const assets=JSON.parse(vm.runInNewContext(read('pre-alpha/service-worker.js')+';JSON.stringify(ASSETS)',{URL,self:{location:{href:'https://example.test/pre-alpha/service-worker.js'},addEventListener(){}}}));
for(const name of ['help.mjs','eta.mjs','references.mjs','reference-data.mjs','auxiliary.mjs']){
  assert.ok(assets.includes('./'+name+'?v='+BUILD),name+' is cached for the new build');read('pre-alpha/'+name);
}
console.log('PASS Pre-Alpha next: complete source parity, single O.D. migration, contextual terms, RPM interpolation, ETA and read-only lookup boundaries');

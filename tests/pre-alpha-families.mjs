import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {number,geometry,resultsFor,stepsFor,normalizeJob,operationType,chooseOperationType} from '../pre-alpha/model.mjs';
import {HTP_CHART,htpChartRow} from '../pre-alpha/families.mjs';
import {etaFor,formatEta} from '../pre-alpha/eta.mjs';
import {etaPresentation,etaResultPanel} from '../pre-alpha/eta-view.mjs';
import {reviewSections,operationWarnings} from '../pre-alpha/review.mjs';
import {worksheetFor,historicalFamilyFor,historicalFamilyMarkup,createOriginTracker} from '../pre-alpha/presentation.mjs';
import {buildExportText} from '../pre-alpha/exports.mjs';
import {buildSharedSnapshot} from '../pre-alpha/shared-save.mjs';
const source=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../measurement-card.html',import.meta.url),'utf8');
const constant=name=>{const match=source.match(new RegExp('const '+name+' = ([\\s\\S]*?);(?:\\r?\\n|$)'));assert.ok(match,name);return JSON.parse(vm.runInNewContext('JSON.stringify(('+match[1]+'))'));};
const extract=(from,to)=>{const start=source.indexOf(from),end=source.indexOf(to,start);assert.ok(start>=0&&end>start);return source.slice(start,end);};
const rootHtp=extract('function calcHtp() {','\n[htpPipeSizeEl,');
const rootHiStop=extract('function calcHiStop() {','\n[hsMdEl,');
const rootRpm=extract('function getEtaRpmMatch(','function getLiveBcoValue(');
const rootFormat=extract('function formatEtaMinutes(','function populateEtaCutterSizes(');
assert.deepEqual(HTP_CHART,constant('htpChartData'));assert.deepEqual(Object.keys(HTP_CHART),['3','4','6','8','10','12','14','16']);
assert.match(html,/<input id="hsPod"[^>]*disabled/);assert.match(source,/if \(hsPodEl && isFinite\(geometry\.pipeOD\) && geometry\.pipeOD\) hsPodEl\.value = geometry\.pipeOD\.toFixed\(4\)/,'The real UI synchronizes the disabled Hi-Stop POD from geometry');
const node=value=>({value,textContent:'',innerHTML:'',classList:{toggle(){}}});
function legacyHtp(s){
 const values={htpPipeSizeEl:s.htpPipeSize,htpMdEl:s.htpMd,htpLdEl:s.htpLd,htpLdSignEl:s.htpLdSign,htpPtcEl:s.htpPtc,htpMachineEl:s.htpMachine};
 const context=vm.createContext({htpChartData:constant('htpChartData'),etaRpmChart:constant('etaRpmChart'),ETA_FEED_RATE:constant('ETA_FEED_RATE'),getMeasurementValue:el=>number(el.value),updateSummary(){},lastHtp:{},...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,node(value)])),...Object.fromEntries(['htpBranchSizeEl','htpHeadEl','htpCutterSizeEl','htpBcoEl','htpFeedRateDisplayEl','htpTcoEl','htpEtaRpmEl','htpEtaFeedSpeedEl','htpEtaRangeEl','htpStatusEl'].map(key=>[key,node('')]))});
 vm.runInContext(rootFormat+rootRpm+rootHtp+'\ncalcHtp();globalThis.match=getEtaRpmMatch(htpMachineEl.value,htpChartData[htpPipeSizeEl.value].cutter);',context);
 return {tco:context.lastHtp.tco,eta:context.lastHtp.eta,match:JSON.parse(JSON.stringify(context.match))};
}
function legacyHiStop(s){
 const g=geometry(s),values={hsMdEl:s.hsMd,hsLdEl:s.hsLd,hsLdSignEl:s.hsLdSign,hsRlEl:s.hsRl,hsPodEl:String(g.od),hsClEl:s.hsCl,hsPtcEl:s.hsPtc,hsRcdEl:s.hsRcd,hsPbEl:s.hsPb,hsPtpEl:s.hsPtp};
 const context=vm.createContext({geometry:{pipeOD:g.od,wall:g.wall},data:{},getMeasurementValue:el=>number(el.value),formatValue:value=>Number.isFinite(value)?value.toFixed(4):'-',updateSummary(){},lastHiStop:{},...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,node(value)])),...Object.fromEntries(['hsLiEl','hsTcoEl','hsPsdEl','hsPlugSetEl','hsWarningsEl'].map(key=>[key,node('')]))});
 vm.runInContext(rootHiStop+'\ncalcHiStop();',context);return context.lastHiStop;
}
const geometryState={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',future:{raw:['1/4','invalid']},md:'999',ld:'1/0',ptc:'999',start:'999',etaBco:'999',etaRpmOverride:'999'};
const htpState={...geometryState,htpPipeSize:'6',htpMd:'10',htpLd:'2',htpLdSign:'+',htpPtc:'1 1/4',htpMachine:'360'};
let htpCases=0;
for(const size of Object.keys(HTP_CHART))for(const profile of ['360','660','1200'])for(const patch of [{},{htpLd:'1/2',htpLdSign:'-'},{htpMd:'-1 1/2',htpLd:'-1/2',htpLdSign:'-',htpPtc:'2 1/4'}]){
 const state={...htpState,htpPipeSize:size,htpMachine:profile,...patch},operation={id:'htp',operationType:'HTP',state},before=structuredClone(operation),legacy=legacyHtp(state),values=Object.fromEntries(resultsFor(operation,'htp')),eta=etaFor(operation,'Legacy unknown');
 assert.equal(values['Total cut out (TCO)'],legacy.tco);assert.equal(values['Chart BCO'],HTP_CHART[size].bco);assert.deepEqual(eta.rpm,legacy.match.rpmValues);assert.equal(eta.match.basis,legacy.match.exact?'exact':legacy.match.interpolated?'interpolated':'nearest');
 const text=formatEta(eta.lowMinutes)+(eta.lowMinutes===eta.highMinutes?'':' to '+formatEta(eta.highMinutes));assert.equal(text,legacy.eta);assert.equal(eta.distance,HTP_CHART[size].bco);assert.equal(eta.size,HTP_CHART[size].cutter);assert.equal(eta.manual,false);assert.equal(eta.feedRate,0.004);
 assert.deepEqual(resultsFor(operation,'tap'),[]);assert.deepEqual(resultsFor(operation,'stop'),[]);assert.deepEqual(resultsFor(operation,'plug'),[]);assert.deepEqual(worksheetFor(operation,'tap'),[]);
 assert.equal(reviewSections(operation).find(row=>row.stage==='htp').results[0][1],legacy.tco);assert.equal(worksheetFor(operation,'htp')[0].result,legacy.tco);assert.deepEqual(operation,before);htpCases++;
}
assert.equal(htpCases,72);
for(const size of ['','22','26','28','6.0',' 6 ','future','__proto__']){
 const operation={operationType:'HTP',state:{...htpState,htpPipeSize:size}},before=structuredClone(operation);assert.equal(htpChartRow(operation.state),null);assert.ok(resultsFor(operation,'htp').every(([,value])=>Number.isNaN(value)));assert.ok(etaFor(operation).issue);assert.ok(operationWarnings(operation).some(w=>w.code==='htp-chart'));assert.deepEqual(operation,before);
}
for(const key of ['htpMd','htpLd','htpPtc'])for(const value of ['','oops','0oops','1/0','Infinity']){const operation={operationType:'HTP',state:{...htpState,[key]:value}};assert.ok(Number.isNaN(resultsFor(operation,'htp')[0][1]));assert.ok(operationWarnings(operation).some(w=>w.code==='missing-inputs'||w.code==='invalid-'+key));}
const strictBlank={...htpState,htpLd:''};assert.ok(Number.isFinite(legacyHtp(strictBlank).tco));assert.ok(Number.isNaN(resultsFor({operationType:'HTP',state:strictBlank},'htp')[0][1]),'Intentional existing Pre-Alpha strict blank/fraction policy; only standard Hot Tap blank LD defaults0');
for(const profile of ['','future','<img src=x>'])assert.ok(etaFor({operationType:'HTP',state:{...htpState,htpMachine:profile}}).issue);
assert.equal(etaFor({operationType:'HTP',state:{...htpState,htpMachine:undefined}}).profile,'360','Preserve the explicit legacy HTP initial profile without writing a raw value');
for(const [label,profile]of [['360 / 152','360'],['660 / 760','660'],['1200-M120','1200'],['future profile','future profile']]){
 const entry={record:{meta:{operationType:'HTP'},machine:{htpMachine:label},measurements:{htp:{pipeSize:'6',md:'10',ld:'2',ptc:'1'}}}},before=structuredClone(entry),job=normalizeJob(entry);assert.equal(job.operations[0].state.htpMachine,profile);assert.deepEqual(entry,before);
}
assert.equal(normalizeJob({record:{state:{htpMachine:''},machine:{htpMachine:'660 / 760'}}}).operations[0].state.htpMachine,'','Explicit saved blank is never silently replaced by metadata/default');
const htpDisplay=etaResultPanel({operationType:'HTP',state:htpState});assert.match(htpDisplay,/HTP chart cutting estimate/);assert.match(htpDisplay,/exact HTP row cutter and chart BCO/);assert.doesNotMatch(htpDisplay,/Manual RPM override is active/);assert.match(etaPresentation({operationType:'HTP',state:htpState}).savedNote,/retained but not used/);
console.log('PASS HTP:72 exact extracted-legacy formula/ETA cases,8 immutable chart rows,3 profiles/exact-interpolated-nearest, independent chart/cutter/BCO, strict blank/invalid guards and no standard fallback');

const hiState={...geometryState,hsMd:'10',hsLd:'2',hsLdSign:'+',hsRl:'8',hsCl:'3',hsPtc:'1',hsRcd:'8',hsPb:'7',hsPtp:'1/4',hsPod:'99'};
let hiCases=0;
for(const od of ['6 5/8','22','26','28'])for(const patch of [{},{hsMd:'-1 1/2',hsLd:'1/2',hsLdSign:'-'},{hsLd:'-1/2',hsLdSign:'-',hsRcd:'6',hsPtp:'1/8'},{hsMd:'-100',hsLd:'0',hsPtp:'-1/4'}]){
 const state={...hiState,preAlphaPipeOD:od,...patch},operation={id:'hi',operationType:'Hi-Stop',state},before=structuredClone(operation),legacy=legacyHiStop(state),values=Object.fromEntries(resultsFor(operation,'hiStop'));
 for(const [label,key]of [['Lower in','li'],['Total cut out (TCO)','tco'],['PSD','psd'],['Plug Set','plugSet']]){assert.equal(values[label],legacy[key]);assert.equal(worksheetFor(operation,'hiStop').find(row=>row.label===label).result,legacy[key]);}
 assert.deepEqual(resultsFor(operation,'tap'),[]);assert.deepEqual(resultsFor(operation,'htp'),[]);assert.deepEqual(resultsFor(operation,'pipe').map(([key])=>key),['Wall thickness']);assert.ok(etaFor(operation).issue);assert.deepEqual(etaFor(operation).rpm,[]);assert.ok(Number.isNaN(etaFor(operation).distance));assert.ok(Number.isNaN(etaFor(operation).feedRate));assert.equal(stepsFor(operation).includes('tap'),false);
 assert.equal(operationWarnings(operation).some(w=>w.code==='histop-negative-plug-set'),legacy.plugSet<0);assert.ok(operationWarnings(operation).some(w=>w.code==='histop-pod-source'));assert.deepEqual(operation,before);hiCases++;
}
for(const key of ['hsMd','hsLd','hsRl','hsCl','hsPtc','hsRcd','hsPb','hsPtp'])for(const value of ['','oops','0oops','1/0','Infinity']){
 const operation={operationType:'Hi-Stop',state:{...hiState,[key]:value}},values=Object.fromEntries(resultsFor(operation,'hiStop'));
 for(const label of key==='hsMd'||key==='hsLd'?['Lower in','Plug Set']:['hsRl','hsCl','hsPtc'].includes(key)?['Total cut out (TCO)']:['PSD','Plug Set'])assert.ok(Number.isNaN(values[label]),key+' invalidates only dependent outputs');
 assert.ok(operationWarnings(operation).some(w=>w.code==='missing-inputs'||w.code==='invalid-'+key));
}
const zeroTaper={operationType:'Hi-Stop',state:{...hiState,hsPtp:'0'}};assert.ok(Number.isNaN(Object.fromEntries(resultsFor(zeroTaper,'hiStop')).PSD));assert.ok(operationWarnings(zeroTaper).some(w=>w.code==='histop-taper'));
const hugeDecimal='1'+'0'.repeat(308),overflowState={...hiState,hsRcd:hugeDecimal,hsPb:'-'+hugeDecimal,hsPtp:'1/4'},overflowLegacy=legacyHiStop(overflowState),overflowValues=Object.fromEntries(resultsFor({operationType:'Hi-Stop',state:overflowState},'hiStop'));assert.equal(overflowLegacy.psd,Infinity);assert.equal(overflowValues.PSD,Infinity);assert.ok(Number.isNaN(overflowLegacy.plugSet));assert.ok(Number.isNaN(overflowValues['Plug Set']),'Retain the exact finite-PSD guard before Plug Set, including arithmetic overflow');
for(const key of ['hsRl','hsCl','hsRcd','hsPb']){const state={...hiState,[key]:'1'+'0'.repeat(400)},legacy=legacyHiStop(state),values=Object.fromEntries(resultsFor({operationType:'Hi-Stop',state},'hiStop'));assert.ok(Number.isNaN(key==='hsRl'||key==='hsCl'?legacy.tco:legacy.psd));assert.ok(Number.isNaN(key==='hsRl'||key==='hsCl'?values['Total cut out (TCO)']:values.PSD));}
const missingOD={operationType:'Hi-Stop',state:{...hiState,preAlphaPipeOD:'invalid'}};assert.ok(Number.isNaN(Object.fromEntries(resultsFor(missingOD,'hiStop'))['Plug Set']));assert.equal(Object.fromEntries(resultsFor(missingOD,'hiStop')).PSD,2.25);
assert.ok(operationWarnings({operationType:'Hi-Stop',state:{...hiState,bcoPipeID:''}}).some(w=>w.code==='histop-wall-unchecked'&&w.kind==='info'));assert.match(etaPresentation({operationType:'Hi-Stop',state:hiState}).savedNote,/not used for Hi-Stop/);
assert.ok(operationWarnings({operationType:'Hi-Stop',state:{...hiState,preAlphaPipeOD:'0'}}).some(w=>w.code==='pipe-od'));assert.ok(operationWarnings({operationType:'Hi-Stop',state:{...hiState,bcoPipeID:'oops'}}).some(w=>w.code==='pipe-id'));
for(const [id,thin]of [['6.125',false],['6.1252',true],['6.1248',false],['6.5',true],['6.000',false]]){
 const operation={operationType:'Hi-Stop',state:{...hiState,preAlphaPipeOD:'6.625',bcoPipeID:id}};assert.equal(operationWarnings(operation).some(w=>w.code==='histop-thin-wall'),thin);
}
assert.equal(operationWarnings({operationType:'Hi-Stop',state:{...hiState,preAlphaPipeOD:'6.5',bcoPipeID:'6'}}).some(w=>w.code==='histop-thin-wall'),false,'Exactly0.25in is not below the legacy threshold');
const hiReview=reviewSections({operationType:'Hi-Stop',state:hiState}).find(row=>row.stage==='hiStop');assert.equal(hiReview.retained.find(row=>row.key==='hsPod').value,'99');assert.equal(hiReview.inputs.find(row=>row.key==='pipe-source-od').value,6.625);assert.equal(createOriginTracker().label({state:hiState},'hsPod'),'Archived - not used');
console.log('PASS Hi-Stop:'+hiCases+' exact extracted-legacy valid/signed/fraction/negative cases, actual shared POD/retained stale source, strict dependency guards, zero taper, thin-wall boundary, negative Plug Set and no ETA/Hot Tap fallback');

for(const [variant,type,stage]of [['htp','HTP','htp'],['hiStop','Hi-Stop','hiStop']]){
 const entry={id:'legacy-'+variant,record:{meta:{operationType:'Line Stop'},state:{...htpState,...hiState,lineStopVariant:variant},measurements:{[stage]:{tco:'88',future:{keep:true}}}}},before=structuredClone(entry),job=normalizeJob(entry);
 assert.equal(operationType(job.operations[0]),type);assert.ok(stepsFor(job.operations[0]).includes(stage));assert.deepEqual(entry,before);assert.deepEqual(job.original,entry);
 const saved=structuredClone(job);chooseOperationType(job,job.operations[0],'Line Stop');assert.ok(stepsFor(job.operations[0]).includes('tap'));assert.equal(job.operations[0].state.lineStopVariant,variant,'Explicit new type does not erase retained legacy variant');assert.deepEqual(job.original,saved.original);
}
const history={original:{record:{measurements:{htp:{tco:'111'}},jobBundle:{selectedOperationId:'two',operations:[{id:'one',measurements:{htp:{tco:'88',future:{keep:true}}}},{id:'two'},{id:'three'}]}}}};
assert.equal(historicalFamilyFor(history,{id:'one'},'htp').tco,'88');assert.equal(historicalFamilyFor(history,{id:'two'},'htp').tco,'111');assert.equal(historicalFamilyFor(history,{id:'three'},'htp'),undefined);
history.original.record.measurements.htp.tco='<img src=x>';assert.doesNotMatch(historicalFamilyMarkup(history,{id:'two'},'htp'),/<img/);
assert.deepEqual(stepsFor({operationType:'Line Stop',state:{lineStopVariant:'future'}}),['setup','saved','review']);assert.deepEqual(stepsFor({operationType:'Re Stop',state:{}}),['setup','saved','review']);assert.deepEqual(resultsFor({operationType:'Re Stop',state:geometryState},'tap'),[]);assert.deepEqual(resultsFor({operationType:'Re Stop',state:geometryState},'pipe'),[]);
console.log('PASS family routing/history: explicit and legacy variants, raw unknown/source preservation, separate selected/own historical snapshots and unsupported-family guards');
const bundleEntry={id:'family-bundle',record:{job:{pressure:'250 psi',temperature:'80 F',product:'Water'},future:{keep:true},jobBundle:{selectedOperationId:'hi',futureBundle:{keep:true},sharedState:{jobDescription:'Synthetic families'},operations:[{id:'htp',operationType:'HTP',label:'First HTP',state:htpState,measurements:{htp:{tco:'88'}}},{id:'hi',operationType:'Hi-Stop',label:'Second Hi-Stop',state:hiState,measurements:{hiStop:{tco:'99',psd:'77',plugSet:'66'}}}]}}};
const bundled=normalizeJob(bundleEntry),untouched=structuredClone(bundled),exported=buildExportText(bundled);
assert.match(exported,/HTP TCO: 19\.2500 in/);assert.match(exported,/HTP cutting ETA to chart BCO: 42 min 51 sec/);assert.match(exported,/Hi-Stop Plug Set: 17\.5625 in/);assert.match(exported,/Historical HTP tco \(original snapshot; not used\): 88/);assert.match(exported,/Historical Hi-Stop plugSet \(original snapshot; not used\): 66/);assert.doesNotMatch(exported,/(?:^|\n)\s*Rod MCO:/);
assert.doesNotMatch(exported,/BCO: 1\.0764 in/,'No standard cutter-shell BCO masquerades as HTP/Hi-Stop');
const hiShared=buildSharedSnapshot(bundled);assert.equal(hiShared.record.measurements.hotTap,undefined);assert.equal(hiShared.record.measurements.hiStop.pod,'6.6250');assert.equal(hiShared.record.measurements.hiStop.psd,'2.2500');assert.equal(hiShared.record.measurements.hiStop.plugSet,'17.5625');assert.equal(hiShared.record.state.hsPod,'99');assert.deepEqual(hiShared.record.preAlphaCapture.job,bundled);assert.deepEqual(hiShared.record.jobBundle.operations,bundled.operations);
const htpShared=buildSharedSnapshot({...bundled,selectedOperationId:'htp'});assert.equal(htpShared.record.measurements.hotTap,undefined);assert.equal(htpShared.record.measurements.htp.tco,'19.2500');assert.equal(htpShared.record.measurements.htp.bco,'6.0000');assert.equal(htpShared.record.measurements.htp.cutterSize,'9.968');assert.equal(htpShared.record.measurements.htp.eta,'42 min 51 sec');assert.deepEqual(Object.keys(htpShared.record.preAlphaCapture.operations[0].results),['htp']);
assert.deepEqual(bundled,untouched);assert.deepEqual(bundled.original,bundleEntry);
console.log('PASS family export/shared capture: all operations, distinct current formulas/ETA, separate historical snapshots and untouched raw/original bundles');

// Deterministic Node/VM reproduction using current application functions. No browser or real storage.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(root+'/measurement.js','utf8').replaceAll('\r\n','\n'),overlay=readFileSync(root+'/overlays/tapcalc-livefix11-workflow.js','utf8').replaceAll('\r\n','\n');
function part(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,start);return text.slice(a,b);}
const fixtureRaw=readFileSync(new URL('./fixtures/legacy-workflow-refresh-521c654.json',import.meta.url),'utf8').replaceAll('\r\n','\n');
assert.equal(createHash('sha256').update(fixtureRaw).digest('hex'),"07ba3b70b7e82c82ecf3f7796b342b5f346200e1f754f63ec2953e913a3fee99");
const frozen=JSON.parse(fixtureRaw);
const before="    if (explicit === 'completionPlug' || explicit === 'lineStop') return explicit;\n";
const after="    if (explicit) return explicit;\n";
const inferOriginal=frozen.operationInference;assert.equal(inferOriginal.split(before).length-1,1);
const inferProposed=inferOriginal.replace(before,after);
const liveSections={
 modes:part(source,'function normalizeMode(mode)','function getStoredCalcMode()')+part(source,'function getStoredWorkflowMode()','function getActiveWorkflowLabel()')+part(source,'function setMode(mode)','window.setMode = setMode;'),
 types:part(source,'function formatOperationType(type','function pluralizeOperationType('),
 shared:part(source,'function collectSharedJobState()','function buildBlankOperationState('),
 selected:part(source,'function getSelectedOperationItem(bundle','window.getSelectedOperationItem ='),
 sync:part(source,'function syncCurrentOperationItemFromUi(options','function getStoredJobStatePayload()'),
 persist:part(source,'function persistCurrentJob(options','function applyJobState(state)'),
 typeInference:part(source,'function inferOperationType(state','function buildJobRecord('),
 combined:part(source,'function buildCombinedState(sharedState','function getOperationStateFields()'),
 bundleType:part(source,'function getBundleJobType(operations','function normalizeBundleItem('),
 mdSync:part(source,'if (mdEl && lsMdEl) {','const summaryEls ='),
 dispatch:part(overlay,'  function dispatchRefreshEvents()','  function operationType(operation'),
 refresh:part(overlay,'  function operationType(operation','  function scheduleWorkflowRefresh('),
 loaded:part(source,'  function getRecordOperations(record = {})','  function restoreOperationBundleFromRecord(')
};
const repairAt=source.indexOf("    if (event.target?.id !== 'jobOperationSelect') return;");assert.ok(repairAt>0);const repairStart=source.lastIndexOf("  document.addEventListener('change'",repairAt),repairEnd=source.indexOf('\n  });',repairAt)+6;assert.ok(repairStart>0&&repairEnd>repairStart);liveSections.repair=source.slice(repairStart,repairEnd);
const rawSections=frozen.functions;
const hashes=Object.fromEntries(Object.entries(rawSections).map(([key,value])=>[key,createHash('sha256').update(value).digest('hex')]));
const marker='__tapcalcWorkflowRefreshActive';
const mdSyncProposed=rawSections.mdSync.replace("  mdEl.addEventListener('input', () => {\n", "  mdEl.addEventListener('input', () => {\n    if (window.__tapcalcWorkflowRefreshActive) return;\n").replace("  lsMdEl.addEventListener('input', () => {\n", "  lsMdEl.addEventListener('input', () => {\n    if (window.__tapcalcWorkflowRefreshActive) return;\n");
const dispatchBody=rawSections.dispatch.slice(rawSections.dispatch.indexOf('\n')+1,rawSections.dispatch.lastIndexOf('  }'));
const dispatchProposed="  function dispatchRefreshEvents() {\n    const previousRefresh = window.__tapcalcWorkflowRefreshActive;\n    window.__tapcalcWorkflowRefreshActive = true;\n    try {\n"+dispatchBody.split('\n').map(line=>line?'  '+line:line).join('\n')+"    } finally {\n      window.__tapcalcWorkflowRefreshActive = previousRefresh;\n    }\n  }\n\n";
const loadedProposed=rawSections.loaded.replace("if (liveStage === 'completionPlug' || liveStage === 'lineStop') return liveStage;","if (liveStage) return liveStage;").replace("if (selectedStage === 'completionPlug' || selectedStage === 'lineStop') return selectedStage;","if (selectedStage) return selectedStage;");
assert.equal(part(source,'  function hasEnteredValue(value)','  function getRecordOperations(record = {})'),inferProposed);
assert.equal(liveSections.mdSync,mdSyncProposed);assert.equal(liveSections.dispatch,dispatchProposed);assert.equal(liveSections.loaded,loadedProposed);
for(const [name,text]of Object.entries(liveSections))if(!['mdSync','dispatch','loaded'].includes(name))assert.equal(text,rawSections[name],'Unchanged actual source: '+name);
function runChain(inference,corrected=false){
 const documentListeners=new Map(),timers=[],writes=[],modeCalls=[];
 class FixtureEvent{constructor(type){this.type=type;this.isTrusted=false;}}
 class Field{constructor(id,value=''){this.id=id;this.value=value;this.type='text';this.tagName='INPUT';this.dataset={};this.listeners=new Map();}addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}dispatchEvent(event){event.target=this;for(const fn of this.listeners.get(event.type)||[])fn.call(this,event);for(const fn of documentListeners.get(event.type)||[])fn(event);return true;}}
 const fields=Object.fromEntries([['md','12'],['lsMd',''],['lsLd',''],['cpStart',''],['lineStopVariant','standard'],['operationType','Hot Tap'],['jobDescription','Synthetic'],['jobOperationSelect','one']].map(([id,value])=>[id,new Field(id,value)]));
 const classes=()=>({active:false,contains(){return this.active;},toggle(_name,value){this.active=value;}}),workflowModeButtons=['hotTap','lineStop','completionPlug'].map(mode=>({dataset:{mode},classList:classes()})),calcModeButtons=['bco','eta'].map(mode=>({dataset:{mode},classList:classes()}));workflowModeButtons[0].classList.active=true;calcModeButtons[0].classList.active=true;
 const bundle={version:3,selectedOperationId:'one',sharedState:{operationType:'Hot Tap',jobDescription:'Synthetic'},operations:[{id:'one',label:'Synthetic Hot Tap',notes:'retain notes',operationType:'Hot Tap',mode:'hotTap',createdAtIso:'fixed',updatedAtIso:'fixed',state:{md:'12',lsMd:'',lsLd:'',cpStart:'',lineStopVariant:'standard',activeMode:'hotTap',calcMode:'bco',lineStopMdUserEdited:false}}]},storage=new Map([['history','immutable synthetic saved history']]);
 const context={Date,console,Event:FixtureEvent,document:{getElementById:id=>fields[id]||null,querySelectorAll:()=>[fields.operationType,fields.md,fields.lsMd,fields.jobOperationSelect],querySelector:()=>null,addEventListener:(type,fn)=>{const list=documentListeners.get(type)||[];list.push(fn);documentListeners.set(type,list);}},
 currentJobBundle:bundle,suppressJobBundleUiSync:false,SHARED_JOB_FIELD_IDS:['operationType','jobDescription'],WORKFLOW_SCREEN_MODES:new Set(['hotTap','lineStop','completionPlug']),CALC_SCREEN_MODES:new Set(['bco','eta']),MODE_STAGES:new Set(['hotTap','lineStop','completionPlug']),WORKFLOW_MODE_KEY:'workflow',CALC_MODE_KEY:'calc',JOB_STATE_KEY:'state',JOB_BUNDLE_VERSION:3,
 workflowModeButtons,calcModeButtons,panels:Object.fromEntries(['hotTap','lineStop','completionPlug','bco','eta'].map(key=>[key,{classList:classes()}])),mdEl:fields.md,lsMdEl:fields.lsMd,jobOperationLabelEl:{value:'Synthetic Hot Tap'},getLineStopVariant:()=>fields.lineStopVariant.value,
 getOperationStateFields:()=>['md','lsMd','lsLd','cpStart','lineStopVariant'],cloneJson:value=>JSON.parse(JSON.stringify(value)),ensureJobBundleInitialized:()=>bundle,normalizeJobBundle:value=>value,getOperationNotesValue:()=> 'retain notes',createOperationLabel:()=> 'unused auto label',isAutoOperationLabel:()=>false,renderOperationManager:()=>{},shouldHoldStartupJobPersist:()=>false,calcLineStop:()=>{},syncBcoToEta:()=>{},updateEtaEstimate:()=>{},withScrollGuard:fn=>fn(),scheduleEnhance:()=>{},text:value=>String(value??'').trim(),byId:id=>fields[id]||null,setTimeout:(fn,delay)=>{timers.push({fn,delay});},window:{},
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{storage.set(key,value);if(key==='state')writes.push(JSON.parse(value));}}};
 const body=rawSections.modes+rawSections.types+rawSections.combined+rawSections.bundleType+rawSections.shared+rawSections.selected+rawSections.sync+rawSections.persist+rawSections.typeInference+(corrected?mdSyncProposed:rawSections.mdSync)+inference+(corrected?loadedProposed:rawSections.loaded)+(corrected?dispatchProposed:rawSections.dispatch)+rawSections.refresh+rawSections.repair;
 vm.createContext(context);vm.runInContext(body+`;window.setMode=(mode)=>{setMode(mode);};window.tapCalcGetSelectedOperation=()=>getSelectedOperationItem();window.tapCalcSetWorkflowStage=stage=>setMode(stage);globalThis.runRefresh=refreshWorkflowAfterLoad;globalThis.runDispatch=dispatchRefreshEvents;globalThis.inferStage=operationWorkflowStage;globalThis.inferSelected=inferWorkflowStageFromLoadedJob;`,context);
 // Hydration restores the saved blank LS field after registering the existing MD-copy listener.
 fields.lsMd.value='';delete fields.lsMd.dataset.userEdited;
 for(const field of [fields.md,fields.lsMd,fields.operationType])for(const kind of ['input','change'])field.addEventListener(kind,event=>context.persistCurrentJob(event));
 const initial=JSON.stringify(bundle);context.runRefresh();assert.equal(fields.lsMd.value,corrected?'':'12',corrected?'Synthetic refresh preserves saved blank LS MD':'Actual old refresh/input path copies Hot Tap MD to LS MD');if(!corrected)assert.ok(writes.some(value=>value.operations[0].state.lsMd==='12'),'Actual old persist function writes that derived field');
 const selectionTimer=timers.findIndex(timer=>timer.delay===30);assert.ok(selectionTimer>=0,'Actual document jobOperationSelect handler schedules loaded-job repair');timers.splice(selectionTimer,1)[0].fn();const applyTimer=timers.findIndex(timer=>timer.delay===0);assert.ok(applyTimer>=0);timers.splice(applyTimer,1)[0].fn();context.runRefresh();
 assert.equal(storage.get('history'),'immutable synthetic saved history');assert.equal(bundle.operations[0].id,'one');assert.equal(bundle.operations[0].notes,'retain notes');
 return {initial:JSON.parse(initial),final:JSON.parse(storage.get('state')),writes:JSON.parse(JSON.stringify(writes)),infer:context.inferStage,context,bundle,fields,FixtureEvent,sourceBoundaries:['Unrelated DOM rendering and calculators are no-op boundaries.','normalizeJobBundle is identity for this already canonical synthetic one-operation bundle.','Exactly two actual refresh invocations and one scheduled loaded-job repair are executed; this is not browser timing proof.']};
}
const prior=runChain(inferOriginal),proposed=runChain(inferProposed,true);assert.equal(prior.final.operations[0].mode,'lineStop','Existing actual-function chain reproduces the undesired conversion');assert.equal(proposed.final.operations[0].mode,'hotTap','Proposed guards preserve explicit Hot Tap');assert.equal(proposed.final.operations[0].state.lsMd,'','Synthetic refresh does not overwrite saved LS MD');
const normalized=value=>{value=JSON.parse(JSON.stringify(value));for(const operation of value.operations)delete operation.updatedAtIso;return value;};assert.deepEqual(normalized(proposed.final),normalized(proposed.initial),'Actual refresh/persistence keeps selected IDs, labels, notes and all hydrated operation fields');assert.ok(proposed.writes.every(value=>value.operations[0].state.lsMd===''&&value.operations[0].state.lineStopMdUserEdited===false));
assert.equal(proposed.context.window[marker],undefined);const previous={nested:true};proposed.context.window[marker]=previous;proposed.context.runDispatch();assert.equal(proposed.context.window[marker],previous);delete proposed.context.window[marker];const query=proposed.context.document.querySelectorAll;proposed.context.document.querySelectorAll=()=>{throw Error('Synthetic enumeration failure');};assert.throws(()=>proposed.context.runDispatch(),/Synthetic enumeration failure/);assert.equal(proposed.context.window[marker],undefined,'Refresh marker restored on exception');proposed.context.document.querySelectorAll=query;
// Programmatic mirror edits remain genuine input outside this narrowly scoped batch: do not filter isTrusted.
proposed.fields.md.value='14';proposed.fields.md.dispatchEvent(new proposed.FixtureEvent('input'));assert.equal(proposed.fields.lsMd.value,'14');proposed.fields.lsMd.value='13';proposed.fields.lsMd.dispatchEvent(new proposed.FixtureEvent('input'));assert.equal(proposed.fields.lsMd.dataset.userEdited,'true');proposed.fields.md.value='15';proposed.fields.md.dispatchEvent(new proposed.FixtureEvent('input'));assert.equal(proposed.fields.lsMd.value,'13','Manual LS override survives later MD edit');
const selected=runChain(inferProposed,true);selected.bundle.operations.push({id:'other',operationType:'Line Stop',mode:'lineStop',state:{activeMode:'lineStop',lsMd:'20'}});assert.equal(selected.context.getBundleJobType(selected.bundle.operations),'Line Stop');assert.equal(selected.context.inferSelected({jobBundle:{selectedOperationId:'one',operations:selected.bundle.operations}}),'hotTap','Selected Hot Tap is independent of whole-job Line Stop classification');assert.equal(selected.bundle.operations[1].state.lsMd,'20');
const otherSnapshot=JSON.stringify(selected.bundle.operations[1]);selected.bundle.selectedOperationId='other';assert.equal(selected.context.inferSelected({}),'lineStop');selected.bundle.selectedOperationId='one';assert.equal(selected.context.inferSelected({}),'hotTap');assert.equal(selected.context.inferSelected({}),'hotTap');assert.equal(JSON.stringify(selected.bundle.operations[1]),otherSnapshot,'Selection inference does not rewrite another operation');
const transitions=runChain(inferProposed,true);for(const [mode,type]of [['lineStop','Line Stop'],['completionPlug','Completion Plug'],['hotTap','Hot Tap']]){transitions.context.window.setMode(mode);transitions.context.runRefresh();assert.equal(transitions.bundle.operations[0].mode,mode);assert.equal(transitions.bundle.operations[0].operationType,type);assert.equal(transitions.bundle.selectedOperationId,'one');}
const hydration=runChain(inferProposed,true);hydration.fields.lsMd.value='9';delete hydration.fields.lsMd.dataset.userEdited;hydration.context.runRefresh();assert.equal(hydration.fields.lsMd.value,'9');assert.equal(hydration.bundle.operations[0].state.lsMd,'9');assert.equal(hydration.bundle.operations[0].state.lineStopMdUserEdited,false,'Synthetic field hydration does not manufacture a manual edit');
const cases=[
 ['canonical Hot Tap with derived LS MD',{operationType:'Hot Tap',mode:'hotTap',state:{activeMode:'hotTap',lsMd:'12'}},'hotTap'],
 ['canonical Hot Tap with other calculator values',{operationType:'Hot Tap',mode:'hotTap',state:{activeMode:'hotTap',cpStart:'30',lsMd:'12'}},'hotTap'],
 ['explicit Line Stop transition',{operationType:'Line Stop',mode:'hotTap',state:{activeMode:'hotTap',lsMd:'12'}},'lineStop'],
 ['explicit Completion Plug transition',{operationType:'Completion Plug',mode:'hotTap',state:{activeMode:'hotTap',cpStart:'30'}},'completionPlug'],
 ['selected Line Stop mode',{operationType:'Hot Tap',mode:'lineStop',state:{activeMode:'lineStop',lsMd:'12'}},'lineStop'],
 ['selected Completion Plug mode',{operationType:'Hot Tap',mode:'completionPlug',state:{activeMode:'completionPlug',cpStart:'30'}},'completionPlug'],
 ['recognized Hot Tap type without mode',{operationType:'Hot Tap',state:{lsMd:'12'}},'hotTap'],
 ['legacy without recognized stage',{state:{lsMd:'12'}},'lineStop'],
 ['legacy invalid BCO mode',{mode:'bco',state:{activeMode:'bco',lsMd:'12'}},'lineStop'],
 ['legacy completion fields without valid mode',{state:{cpStart:'30'}},'completionPlug'],
 ['legacy completion priority without explicit stage',{state:{cpStart:'30',lsMd:'12',md:'14'}},'completionPlug'],
 ['legacy HTP variant without valid mode',{state:{lineStopVariant:'htp'}},'lineStop'],
 ['explicit HTP type',{operationType:'HTP Hot Tap',mode:'hotTap',state:{activeMode:'hotTap'}},'lineStop'],
 ['legacy Hot Tap fields',{state:{md:'12'}},'hotTap']
];
for(const [label,input,expected]of cases){assert.equal(proposed.infer(input),expected,label);if(!label.startsWith('canonical Hot Tap')&&!label.startsWith('recognized Hot Tap'))assert.equal(proposed.infer(input),prior.infer(input),'Unchanged compatibility: '+label);}
const report={classification:'Deterministic actual-function defect and unapplied one-condition proposal; not proof of the overflowing browser trace suffix',sourceHashes:hashes,priorMode:prior.final.operations[0].mode,proposedMode:proposed.final.operations[0].mode,derivedLsMdPreserved:proposed.final.operations[0].state.lsMd,compatibilityCases:cases.map(([label,input,expected])=>({label,input,expected})),boundaries:proposed.sourceBoundaries};
console.log('PASS actual refresh → MD hydration → persistence → scheduled loaded-job inference reproduction; prior converts Hot Tap to Line Stop; proposal preserves hydrated data/IDs and selected type; nested/failing refresh, mirror/manual edits and '+cases.length+' compatibility controls pass. No browser, product edit or guard change.');

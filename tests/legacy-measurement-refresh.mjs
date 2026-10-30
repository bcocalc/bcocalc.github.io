// Deterministic Node/VM reproduction using current application functions. No browser or real storage.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(root+'/measurement.js','utf8').replaceAll('\r\n','\n'),overlay=readFileSync(root+'/overlays/tapcalc-livefix11-workflow.js','utf8').replaceAll('\r\n','\n');
function part(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,start);return text.slice(a,b);}
const fixtureRaw=readFileSync(root+'/tests/fixtures/legacy-workflow-refresh-521c654.json','utf8').replaceAll('\r\n','\n');
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
const normalization=part(source,'function formatDecimal(value, digits = 4)','function openDecimalModal()')+part(source,'function parseMixedMeasurement(rawValue)','if (decimalReferenceBtnEl)');
function runChain(inference,corrected=false,normalizer=normalization){
 const mutations=[];

 const documentListeners=new Map(),timers=[],writes=[],modeCalls=[];
 class FixtureEvent{constructor(type){this.type=type;this.isTrusted=false;}}
 class Field{constructor(id,value=''){this.id=id;this._value=value;this.type='text';this.tagName='INPUT';this.dataset={};this.listeners=new Map();}get value(){return this._value;}set value(next){if(this._value!==next)mutations.push({id:this.id,before:this._value,after:next,refresh:context.window.__tapcalcWorkflowRefreshActive===true,stack:new Error().stack.split('\n').slice(1,6)});this._value=next;}setAttribute(){}addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}dispatchEvent(event){event.target=this;for(const fn of this.listeners.get(event.type)||[])fn.call(this,event);for(const fn of documentListeners.get(event.type)||[])fn(event);return true;}}
 const fields=Object.fromEntries([['md','12'],['lsMd',''],['lsLd',''],['cpStart',''],['lineStopVariant','standard'],['operationType','Hot Tap'],['jobDescription','Synthetic'],['jobOperationSelect','one']].map(([id,value])=>[id,new Field(id,value)]));
 const classes=()=>({active:false,contains(){return this.active;},toggle(_name,value){this.active=value;}}),workflowModeButtons=['hotTap','lineStop','completionPlug'].map(mode=>({dataset:{mode},classList:classes()})),calcModeButtons=['bco','eta'].map(mode=>({dataset:{mode},classList:classes()}));workflowModeButtons[0].classList.active=true;calcModeButtons[0].classList.active=true;
 const bundle={version:3,selectedOperationId:'one',sharedState:{operationType:'Hot Tap',jobDescription:'Synthetic'},operations:[{id:'one',label:'Synthetic Hot Tap',notes:'retain notes',operationType:'Hot Tap',mode:'hotTap',createdAtIso:'fixed',updatedAtIso:'fixed',state:{md:'12',lsMd:'',lsLd:'',cpStart:'',lineStopVariant:'standard',activeMode:'hotTap',calcMode:'bco',lineStopMdUserEdited:false}}]},storage=new Map([['history','immutable synthetic saved history']]);
 for(const [id,value]of Object.entries({bcoCutterOD:'4',mt:'52',ptc:'1/4',pod:'0.0000'})){fields[id]=new Field(id,value);bundle.operations[0].state[id]=value;}
 const context={Date,console,Event:FixtureEvent,document:{getElementById:id=>fields[id]||null,querySelectorAll:()=>Object.values(fields),querySelector:()=>null,addEventListener:(type,fn)=>{const list=documentListeners.get(type)||[];list.push(fn);documentListeners.set(type,list);}},
 currentJobBundle:bundle,suppressJobBundleUiSync:false,SHARED_JOB_FIELD_IDS:['operationType','jobDescription'],WORKFLOW_SCREEN_MODES:new Set(['hotTap','lineStop','completionPlug']),CALC_SCREEN_MODES:new Set(['bco','eta']),MODE_STAGES:new Set(['hotTap','lineStop','completionPlug']),WORKFLOW_MODE_KEY:'workflow',CALC_MODE_KEY:'calc',JOB_STATE_KEY:'state',JOB_BUNDLE_VERSION:3,
 workflowModeButtons,calcModeButtons,panels:Object.fromEntries(['hotTap','lineStop','completionPlug','bco','eta'].map(key=>[key,{classList:classes()}])),mdEl:fields.md,lsMdEl:fields.lsMd,jobOperationLabelEl:{value:'Synthetic Hot Tap'},getLineStopVariant:()=>fields.lineStopVariant.value,
 getOperationStateFields:()=>Object.keys(fields).filter(id=>!['operationType','jobDescription','jobOperationSelect'].includes(id)),cloneJson:value=>JSON.parse(JSON.stringify(value)),ensureJobBundleInitialized:()=>bundle,normalizeJobBundle:value=>value,getOperationNotesValue:()=> 'retain notes',createOperationLabel:()=> 'unused auto label',isAutoOperationLabel:()=>false,renderOperationManager:()=>{},shouldHoldStartupJobPersist:()=>false,calcLineStop:()=>{},syncBcoToEta:()=>{},updateEtaEstimate:()=>{},withScrollGuard:fn=>fn(),scheduleEnhance:()=>{},text:value=>String(value??'').trim(),byId:id=>fields[id]||null,setTimeout:(fn,delay)=>{timers.push({fn,delay});},window:{},
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{storage.set(key,value);if(key==='state')writes.push(JSON.parse(value));}}};
 const body=normalizer+rawSections.modes+rawSections.types+rawSections.combined+rawSections.bundleType+rawSections.shared+rawSections.selected+rawSections.sync+rawSections.persist+rawSections.typeInference+(corrected?mdSyncProposed:rawSections.mdSync)+inference+(corrected?loadedProposed:rawSections.loaded)+(corrected?dispatchProposed:rawSections.dispatch)+rawSections.refresh+rawSections.repair;
 vm.createContext(context);vm.runInContext(body+`;window.setMode=(mode)=>{setMode(mode);};window.tapCalcGetSelectedOperation=()=>getSelectedOperationItem();window.tapCalcSetWorkflowStage=stage=>setMode(stage);globalThis.runRefresh=refreshWorkflowAfterLoad;globalThis.runDispatch=dispatchRefreshEvents;globalThis.inferStage=operationWorkflowStage;globalThis.inferSelected=inferWorkflowStageFromLoadedJob;`,context);
 // Hydration restores the saved blank LS field after registering the existing MD-copy listener.
 fields.lsMd.value='';delete fields.lsMd.dataset.userEdited;
 for(const field of Object.values(fields))for(const kind of ['input','change'])field.addEventListener(kind,event=>context.persistCurrentJob(event));
 const beforeEnable=JSON.stringify(bundle);context.enableMixedMeasurementInputs();assert.equal(JSON.stringify(bundle),beforeEnable,'Installing input listeners does not format values');const initial=JSON.stringify(bundle);context.runRefresh();assert.equal(fields.lsMd.value,corrected?'':'12',corrected?'Synthetic refresh preserves saved blank LS MD':'Actual old refresh/input path copies Hot Tap MD to LS MD');if(!corrected)assert.ok(writes.some(value=>value.operations[0].state.lsMd==='12'),'Actual old persist function writes that derived field');
 const selectionTimer=timers.findIndex(timer=>timer.delay===30);assert.ok(selectionTimer>=0,'Actual document jobOperationSelect handler schedules loaded-job repair');timers.splice(selectionTimer,1)[0].fn();const applyTimer=timers.findIndex(timer=>timer.delay===0);assert.ok(applyTimer>=0);timers.splice(applyTimer,1)[0].fn();context.runRefresh();
 assert.equal(storage.get('history'),'immutable synthetic saved history');assert.equal(bundle.operations[0].id,'one');assert.equal(bundle.operations[0].notes,'retain notes');
 return {liveWriteCount:()=>writes.length,mutations,initial:JSON.parse(initial),final:JSON.parse(storage.get('state')),writes:JSON.parse(JSON.stringify(writes)),infer:context.inferStage,context,bundle,fields,FixtureEvent,sourceBoundaries:['Unrelated DOM rendering and calculators are no-op boundaries.','normalizeJobBundle is identity for this already canonical synthetic one-operation bundle.','Exactly two actual refresh invocations and one scheduled loaded-job repair are executed; this is not browser timing proof.']};
}

const priorNormalization=normalization.replace('  if (window.__tapcalcWorkflowRefreshActive) return;\n','');
assert.notEqual(priorNormalization,normalization);
assert.equal(createHash('sha256').update(priorNormalization).digest('hex'),'76500afe1c8ad54b468cad177c25e70b9a1ac45b54ca1588f2b40846db7aba35','Exact immutable pre-fix normalizer and listeners');
const proof=runChain(inferProposed,true,priorNormalization),beforeState=proof.initial.operations[0].state,afterState=proof.final.operations[0].state;
const expected={md:['12','12.0000'],mt:['52','52.0000'],ptc:['1/4','0.2500'],bcoCutterOD:['4','4.0000']};
for(const [key,[a,b]]of Object.entries(expected)){assert.equal(beforeState[key],a);assert.equal(afterState[key],b);const write=proof.mutations.find(event=>event.id===key&&event.after===b);assert.ok(write?.refresh,key+' changes inside the real scoped synthetic refresh');assert.ok(write.stack.some(line=>line.includes('normalizeMeasurementField')),key+' actual normalizer');}
assert.equal(afterState.lsMd,'');assert.equal(proof.final.operations[0].mode,'hotTap');
// A genuine user change/blur still has legitimate force-format semantics, independently of refresh.
const initialWrites=proof.liveWriteCount();proof.fields.md.value='13';proof.fields.md.dispatchEvent(new proof.FixtureEvent('change'));assert.equal(proof.fields.md.value,'13.0000');assert.ok(proof.liveWriteCount()>initialWrites);
const proposedNormalizer=normalization;
const fixed=runChain(inferProposed,true,proposedNormalizer);
for(const [key,[raw]]of Object.entries(expected))assert.equal(fixed.final.operations[0].state[key],raw,'Proposed scoped guard preserves '+key);
assert.ok(!fixed.mutations.some(event=>event.refresh&&Object.keys(expected).includes(event.id)));
fixed.fields.ptc.value='3/8';fixed.fields.ptc.dispatchEvent(new fixed.FixtureEvent('change'));assert.equal(fixed.fields.ptc.value,'0.3750');
fixed.fields.mt.value='53';fixed.fields.mt.dispatchEvent(new fixed.FixtureEvent('blur'));assert.equal(fixed.fields.mt.value,'53.0000');
assert.equal(fixed.context.window.__tapcalcWorkflowRefreshActive,undefined);
const report={classification:'Proven actual-function synthetic refresh formats and persists raw fields without user editing; not full browser timing attribution',sourceHashes:{normalization:createHash('sha256').update(normalization).digest('hex'),dispatch:createHash('sha256').update(liveSections.dispatch).digest('hex'),persistence:createHash('sha256').update(liveSections.persist).digest('hex')},rawDifferences:expected,mutations:proof.mutations.filter(event=>Object.keys(expected).includes(event.id)),firstMutation:proof.mutations[0],initial:beforeState,final:afterState,writeCount:proof.writes.length,controls:{listenerInstallationDoesNotNormalize:true,explicitHotTapPreserved:true,blankLsMdPreserved:true,genuineChangeStillFormats:true,proposedScopedGuardPreservesAllFourRawFields:true,proposedGenuineFractionChangeStillNormalizes:true,proposedGenuineBlurStillNormalizes:true},limits:['Actual event listeners, refresh dispatcher, normalizer, parser, operation synchronization and persistence execute.','No browser, focus, blur, timers beyond the existing bounded harness sequence or external storage.','Unrelated DOM rendering/calculators remain stub boundaries in this raw-string proof. Derived-field source is assessed separately.']};
console.log('PASS actual normalizer/dispatcher/persistence: frozen prior reproduces four raw-string mutations; scoped refresh guard preserves all four; genuine change/fraction/blur retain normalization. No browser or storage writes outside VM.');

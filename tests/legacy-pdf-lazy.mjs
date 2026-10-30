import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../measurement.js',import.meta.url),'utf8').replaceAll('\r\n','\n');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
const predicate=section('function machineReferencePreviewIsActive()','let machineReferencePageHidden=');
const loader=section('function stopMachineReferenceVisualLoads()','function hideMachineReferenceNativePreview()');
function harness(screen='calc'){
 const state={body:{dataset:{activeScreen:screen}}},tasks=[];let imports=0,ready;const module=new Promise(resolve=>ready=resolve);
 const ctx={cancelMachineReferenceVisualRender:()=>Promise.resolve(),document:state,machineReferencePageHidden:false,machineReferencePreviewPaused:false,machineReferenceVisualRenderToken:1,stackupPdfDocumentCache:new Map(),getStackupPdfJs:()=>{imports++;return module;}};
 for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(ctx,name,{get(){throw Error('Lazy preview must not access jobs');}});
 const api=vm.runInNewContext(predicate+loader+';({load:getStackupPdfDocument,stop:stopMachineReferenceVisualLoads,active:machineReferencePreviewIsActive});',ctx);
 return {ctx,tasks,api,screen:value=>state.body.dataset.activeScreen=value,imports:()=>imports,ready:()=>ready({getDocument:()=>{const pdf={synthetic:'cached document'},task={promise:Promise.resolve(pdf),destroyed:0,destroy(){this.destroyed++;return Promise.resolve();}};tasks.push(task);return task;}})};
}
for(const screen of ['home','calc','card','jobs']){const h=harness(screen);assert.equal(h.api.active(),false);assert.equal(await h.api.load('/synthetic.pdf',1),null);assert.equal(h.imports(),0);assert.equal(h.tasks.length,0);}
const pending=harness('ref'),work=pending.api.load('/synthetic.pdf',1);pending.screen('calc');pending.ready();assert.equal(await work,null);assert.equal(pending.tasks.length,0,'Leaving References prevents deferred module continuation from creating a task');
const cached=harness('ref');cached.ready();const pdf=await cached.api.load('/synthetic.pdf',1);assert.equal(cached.tasks.length,1);cached.screen('calc');assert.equal(await cached.api.load('/synthetic.pdf',1),null);cached.screen('ref');assert.equal(await cached.api.load('/synthetic.pdf',1),pdf,'References reopen reuses the same document, including offline');assert.equal(cached.tasks.length,1);await cached.api.stop();assert.equal(cached.tasks[0].destroyed,1);
const owner=section('  function openScreenCore(name, options = {})','  function enforceActiveScreenOnly()');
let summaries=0;const data={activeScreen:'calc'},store=new Map();const ctx={cancelMachineReferenceVisualRender:()=>Promise.resolve(),document:{body:{dataset:data}},normalizeScreen:name=>name,syncVisibleScreens:name=>data.activeScreen=name,syncTabs:()=>{},applyCalcMode:()=>{},updateMachineReferenceSummary:()=>summaries++,localStorage:{setItem:(key,value)=>store.set(key,value)},machineReferenceVisualRenderToken:7,setTimeout:()=>{},window:{}};
const previewScreen=section('function syncMachineReferencePreviewScreen(', 'window.tapCalcReferencePreviewScreenChanged = syncMachineReferencePreviewScreen;');
const control=vm.runInNewContext(previewScreen+';window.tapCalcReferencePreviewScreenChanged=syncMachineReferencePreviewScreen;'+owner+';({open:openScreenCore,token:()=>machineReferenceVisualRenderToken});',ctx);control.open('ref');assert.equal(summaries,1);control.open('calc');assert.equal(control.token(),8);assert.equal(summaries,1);control.open('ref');assert.equal(summaries,2);assert.equal(store.get('tapcalcV3Screen'),'ref');
console.log('PASS legacy lazy PDF: actual screen owner, no background import/task outside References, deferred entry cancellation, explicit entry/reopen and cached document reuse; no job access or cleanup ownership changes.');

await import('./legacy-operation-mode.mjs');

await import('./legacy-pdf-render-ownership.mjs');

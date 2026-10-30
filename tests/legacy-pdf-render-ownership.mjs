// Node/VM only. Actual app render functions + actual bundled render task/canvas ownership guard.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const app=readFileSync(new URL('measurement.js',root),'utf8').replaceAll('\r\n','\n'),pdf=readFileSync(new URL('pdf.mjs',root),'utf8').replaceAll('\r\n','\n');
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const helperSource=section(app,'let machineReferenceVisualRenderTask = null;','async function getStackupPdfDocument(');
const screenSource=section(app,'function syncMachineReferencePreviewScreen(','window.tapCalcReferencePreviewScreenChanged =');
const appSource=section(app,'function setMachineReferenceVisualMessage(message','async function getStackupPdfJs()')+section(app,'function hideMachineReferenceNativePreview()','function updateMachineReferenceDetail(row)');
const taskSource=section(pdf,'class RenderTask {','const version = "4.10.38";');assert.match(taskSource,/Cannot use the same canvas during multiple render/);
const exceptionSource=section(pdf,'class RenderingCancelledException extends BaseException','function isDataScheme(');
const sha=value=>createHash('sha256').update(value).digest('hex');
async function tick(){await new Promise(resolve=>setImmediate(resolve));}
function harness(){
 let active=true, delayCancel=false, cancelThrow=null;const diagnostics=[],cache=new Map();
 const timeline=[],tasks=[],canvas={hidden:true,width:0,height:0,style:{},getContext:()=>drawing},drawing={canvas,setTransform(){},fillRect(){}};
 Object.defineProperty(canvas,'width',{get(){return this._width||0;},set(value){this._width=value;timeline.push({kind:'canvas-resized',width:value});}});
 const frame={hidden:true,_src:null,set src(value){this._src=value;timeline.push({kind:'native-fallback-assignment',src:value});},get src(){return this._src;},removeAttribute(name){if(name==='src')this._src=null;}},message={hidden:true,textContent:''};
 class CanvasGraphics {constructor(){}beginDrawing(){}endDrawing(){}executeOperatorList(list){return list.argsArray.length;}}
 const context={Promise,Error,WeakSet,CanvasGraphics,BaseException:class extends Error{constructor(message,name){super(message);this.name=name;}},
 machineReferenceVisualCanvasEl:canvas,machineReferenceVisualWrapEl:{clientWidth:800},machineReferenceVisualFrameEl:frame,machineReferenceVisualFallbackEl:message,machineReferenceVisualOpenEl:{href:'',classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}},machineReferencePageHidden:false,machineReferencePreviewPaused:false,machineReferencePreviewIsActive:()=>active,stackupPdfDocumentCache:cache,console:{error:(...args)=>diagnostics.push(args)},updateMachineReferenceSummary:()=>{},getMachineReferenceVisualSource:row=>row.visual,window:{devicePixelRatio:1},
 getStackupPdfDocument:async()=>({numPages:10,getPage:async number=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:params=>startTask(number,params)})})};
 vm.createContext(context);vm.runInContext(taskSource+exceptionSource+';globalThis.ActualInternalRenderTask=InternalRenderTask;',context);
 function startTask(pageNumber,params){
  const id=tasks.length+1;let internal;const complete=error=>{timeline.push({kind:error?'task-rejected':'task-completed',id,error:error?{name:error.name,message:error.message}:null});if(error)internal.capability.reject(error);else internal.capability.resolve();};
  internal=new context.ActualInternalRenderTask({callback:complete,params,operatorList:{fnArray:[],argsArray:[],lastChunk:false},pageIndex:pageNumber-1});
  const record={id,internal,task:internal.task,initialized:false,finished:false,cancelCalls:0};tasks.push(record);
  const nativeCancel=record.task.cancel.bind(record.task);record.cancelNow=(reason)=>internal.cancel(reason);record.task.cancel=(...args)=>{record.cancelCalls++;timeline.push({kind:'task-cancel-call',id});if(cancelThrow)throw cancelThrow;if(!delayCancel)return nativeCancel(...args);};
  // Cached-page readiness is immediate in this model. The real PDFPageProxy uses the same initializeGraphics guard,
  // and its complete(error) rejects capability; parser/operator-stream abort side effects are NOT modeled.
  try{internal.initializeGraphics({});record.initialized=true;timeline.push({kind:'canvas-acquired',id,page:pageNumber});}catch(error){record.finished=true;complete(error);}
  return record.task;
 }
 vm.runInContext('let machineReferenceVisualRenderToken=0;'+helperSource+appSource+screenSource+';globalThis.update=updateMachineReferenceVisual;globalThis.currentToken=()=>machineReferenceVisualRenderToken;globalThis.forcedOwner=entry=>machineReferenceVisualRenderTask=entry;',context);
 const row=page=>({source:'synthetic cached PDF',visual:{pdfUrl:'/synthetic.pdf',pageNumber:page,openUrl:'/synthetic.pdf#page='+page}});
 return {context,timeline,tasks,canvas,frame,message,diagnostics,cache,setDelay:value=>delayCancel=value,setCancelThrow:value=>cancelThrow=value,release:index=>tasks[index].cancelNow(),fail:(index,error)=>tasks[index].cancelNow(error),leave(){active=false;context.syncMachineReferencePreviewScreen('ref','calc');},restore(){active=true;},stop:()=>context.stopMachineReferenceVisualLoads(),forceOwner:entry=>context.forcedOwner(entry),cancelCurrent:()=>context.cancelMachineReferenceVisualRender(),owner:()=>vm.runInContext('machineReferenceVisualRenderTask',context),update:page=>context.update(row(page)),async waitTasks(count){for(let n=0;n<10&&tasks.length<count;n++)await tick();assert.equal(tasks.length,count);await tick();},async finish(index){const record=tasks[index];assert.equal(record.initialized,true);record.internal.operatorList.lastChunk=true;await record.internal._next();record.finished=true;await tick();},async cancel(index){tasks[index].task.cancel();await tick();},route:()=>({canvasHidden:canvas.hidden,iframeHidden:frame.hidden,iframeSource:frame.src,messageHidden:message.hidden,token:context.currentToken()})};
}

// Actual app owner + actual bundled RenderTask/WeakSet guard. No browser or network.
const overlap=harness();overlap.update(1);await overlap.waitTasks(1);overlap.update(2);await overlap.waitTasks(2);
assert.equal(overlap.tasks[0].cancelCalls,1);assert.equal(overlap.tasks[1].initialized,true);await overlap.finish(1);
assert.equal(overlap.canvas.hidden,false);assert.ok(!overlap.timeline.some(e=>e.kind==='native-fallback-assignment'));

// Three-way supersession while cancellation is deferred: middle generation never starts.
const rapid=harness();rapid.update(1);await rapid.waitTasks(1);rapid.setDelay(true);const width=rapid.canvas.width,resizeCount=rapid.timeline.filter(e=>e.kind==='canvas-resized').length;
rapid.update(2);await tick();rapid.update(3);await tick();assert.equal(rapid.tasks.length,1);assert.equal(rapid.canvas.width,width);assert.equal(rapid.timeline.filter(e=>e.kind==='canvas-resized').length,resizeCount);assert.equal(rapid.tasks[0].cancelCalls,1);
rapid.release(0);await rapid.waitTasks(2);assert.equal(rapid.timeline.find(e=>e.kind==='canvas-acquired'&&e.id===2).page,3);await rapid.finish(1);
assert.ok(!rapid.timeline.some(e=>e.kind==='native-fallback-assignment'));assert.equal(rapid.owner(),null);

// Genuine current failure remains visible through native fallback.
const genuine=harness();genuine.update(1);await genuine.waitTasks(1);const loadError=new Error('synthetic real rendering failure');genuine.fail(0,loadError);await tick();assert.equal(genuine.frame.hidden,false);assert.equal(genuine.frame.src,'/synthetic.pdf#page=1');
// Cancellation-shaped errors are not globally suppressed: a task not canceled by this owner still falls back.
const uncanceled=harness();uncanceled.update(1);await uncanceled.waitTasks(1);const named=new Error('unrequested cancellation');named.name='RenderingCancelledException';uncanceled.fail(0,named);await tick();assert.equal(uncanceled.frame.hidden,false);

// A synchronous cancel failure and distinct settlement failure are both retained; no canvas reuse.
const rejected=harness();rejected.update(1);await rejected.waitTasks(1);const cancelError=new Error('cancel threw'),settleError=new Error('settlement failed');rejected.setCancelThrow(cancelError);rejected.update(2);await tick();assert.equal(rejected.tasks.length,1);rejected.fail(0,settleError);await tick();assert.equal(rejected.tasks.length,1);assert.equal(rejected.frame.src,'/synthetic.pdf#page=2');

// Leave cancels once, suppresses only stale publication; restore uses a new owner.
const departure=harness();departure.update(1);await departure.waitTasks(1);departure.leave();await tick();assert.equal(departure.tasks[0].cancelCalls,1);assert.equal(departure.owner(),null);assert.equal(departure.diagnostics.length,0);departure.restore();departure.update(2);await departure.waitTasks(2);await departure.finish(1);assert.equal(departure.canvas.hidden,false);assert.equal(departure.frame.hidden,true);

// Destruction attempts render cancellation and every document even if each fails.
const cleanup=harness();cleanup.update(1);await cleanup.waitTasks(1);cleanup.setCancelThrow(cancelError);let destroyed=0;const docError=new Error('document destroy failed');cleanup.cache.set('first',{task:{destroy(){destroyed++;throw docError;}}});cleanup.cache.set('second',{task:{destroy(){destroyed++;return Promise.resolve();}}});const stopped=cleanup.stop();const observed=stopped.then(()=>null,error=>error);await tick();assert.equal(destroyed,2);cleanup.fail(0,settleError);const aggregate=await observed;assert.equal(aggregate.name,'AggregateError');assert.equal(aggregate.errors.length,2);assert.equal(aggregate.errors[0].name,'AggregateError');assert.deepEqual([...aggregate.errors[0].errors],[cancelError,settleError]);assert.equal(aggregate.errors[1],docError);assert.equal(cleanup.cache.size,0);

// Synchronous cancellation failure is retained even when the render subsequently succeeds.
const thrown=harness();thrown.update(1);await thrown.waitTasks(1);thrown.setCancelThrow(cancelError);const thrownResult=thrown.cancelCurrent().then(()=>null,error=>error);await thrown.finish(0);assert.equal(await thrownResult,cancelError);
// Identity guard: a late old task finally must not clear a different owner.
// This is a deliberate adversarial state injection, not a claim that the serialized app path creates it.
const late=harness();late.update(1);await late.waitTasks(1);const replacement={synthetic:'different owner'};late.forceOwner(replacement);await late.finish(0);assert.equal(late.owner(),replacement);

console.log('PASS actual render owner: overlap, rapid supersession/delayed cancellation, cancel-once, stale settlement, genuine and unrequested-cancellation fallback, departure/restore and all-failure destruction ownership. No browser/network.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),read=path=>readFileSync(root+'/'+path,'utf8').replace(/\r\n/g,'\n'),source=read('pdf.mjs'),provenance=JSON.parse(read('pdf-api-provenance.json'));
let original=source;
for(const edit of [...provenance.edits].reverse()){
  if(edit.section){const a=original.indexOf('class PDFFetchStream {'),b=original.indexOf('\n;// ./src/display/network.js',a),section=original.slice(a,b);assert.equal(section.split(edit.newText).length,edit.count+1,edit.label);original=original.slice(0,a)+section.split(edit.newText).join(edit.oldText)+original.slice(b);}
  else{assert.equal(original.split(edit.newText).length,edit.count+1,edit.label);original=original.split(edit.newText).join(edit.oldText);}
}
const sha=text=>createHash('sha256').update(text).digest('hex');assert.equal(sha(original),provenance.originalNormalizedSha256);assert.equal(sha(original),'a209a2124baa35cbb9015b809926f1bcec9dd1c247296290e205dd9d76cb9128');assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0'+original).digest('hex'),provenance.originalGitBlob);assert.equal(sha(source),provenance.modifiedNormalizedSha256);assert.equal(source.slice(0,source.indexOf('// TapCalc local modification:')).trimEnd(),original.slice(0,original.indexOf('/******/ // The require scope')).trimEnd(),'Original entire license notice retained');
const tick=()=>new Promise(resolve=>setImmediate(resolve)),deferred=()=>Promise.withResolvers();
function section(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a);return text.slice(a,b);}
function readers({failure,range=false,disableStream=false,cancelFailure,cancelGate,fetchGate,fetchError,readerError,abortFailure}={}){
  const nativeFailure=failure;let aborts=0,cancels=0;
  const nativeReader={read:async()=>{if(nativeFailure)throw nativeFailure;return {done:true};},cancel:()=>{cancels++;if(cancelFailure)return Promise.reject(cancelFailure);return cancelGate?.promise||Promise.resolve();}};
  const response={url:'https://fixture.invalid/synthetic.pdf',status:200,headers:new Headers(),body:{getReader:()=>{if(readerError)throw readerError;return nativeReader;}}};
  const context={Promise,Headers,Uint8Array,ArrayBuffer,AggregateError,AbortException:Error,AbortController:class{abort(){aborts++;if(abortFailure)fetchGate.reject(abortFailure);}},fetch:()=>fetchGate?fetchGate.promise:fetchError?Promise.reject(fetchError):Promise.resolve(response),assert:(condition,message)=>assert.ok(condition,message),createHeaders:()=>new Headers(),createFetchOptions:()=>({}),getResponseOrigin:url=>new URL(url).origin,validateResponseStatus:status=>status===200,createResponseStatusError:()=>Error('Unexpected status'),validateRangeRequestCapabilities:()=>({allowRangeRequests:range}),extractFilenameFromHeader:()=>null,getArrayBuffer:value=>value};
  const api=vm.runInNewContext(section(source,'class PDFFetchStream {','\n;// ./src/display/network.js')+';({PDFFetchStream,PDFFetchStreamReader,PDFFetchStreamRangeReader});',context),stream=new api.PDFFetchStream({url:'https://fixture.invalid/synthetic.pdf',disableStream,rangeChunkSize:16});stream._responseOrigin="https://fixture.invalid";return {api,stream,nativeReader,response,stats:()=>({aborts,cancels})};
}
for(const kind of ['full','range']){
  const error=Error('Original failed-stream cancellation'),f=readers({failure:error,cancelFailure:error}),reader=kind==='full'?f.stream.getFullReader():f.stream.getRangeReader(16,32);if(kind==='full')await reader.headersReady;else await tick();await assert.rejects(reader.read(),e=>e===error);await assert.rejects(reader.cancel(Error('Departure')),e=>e===error);assert.deepEqual(f.stats(),{aborts:1,cancels:1});
  const healthy=readers(),r=kind==='full'?healthy.stream.getFullReader():healthy.stream.getRangeReader(16,32);if(kind==='full')await r.headersReady;else await tick();await r.cancel(Error('Departure'));assert.deepEqual(healthy.stats(),{aborts:1,cancels:1});
}
{
  const f=readers(),gate=deferred(),first=Error('Original first cancellation'),second=Error('Original second cancellation'),calls=[];
  f.stream._fullRequestReader={cancel(){calls.push('full');return Promise.reject(first);}};f.stream._rangeRequestReaders=[{cancel(){calls.push('range-1');return gate.promise;}},{cancel(){calls.push('range-2');throw second;}}];
  let settled=false;const work=f.stream.cancelAllRequests(Error('Departure'));const checked=assert.rejects(work,e=>{assert.ok(e instanceof AggregateError);assert.deepEqual([...e.errors],[first,second]);return true;});work.then(()=>settled=true,()=>settled=true);await tick();assert.deepEqual(calls,['full','range-1','range-2'],'Attempt every owned reader despite rejection');assert.equal(settled,false,'Wait for every cancellation');gate.resolve();await checked;
  f.stream._fullRequestReader={cancel:()=>Promise.reject(first)};f.stream._rangeRequestReaders=[];await assert.rejects(f.stream.cancelAllRequests(Error('Departure')),e=>e===first,'Single original error identity survives');
}
{
  const error=Error('Streaming-disable cancellation failed'),f=readers({disableStream:true,range:true,cancelFailure:error}),reader=f.stream.getFullReader();await assert.rejects(reader.headersReady,e=>e===error);await assert.rejects(reader.read(),e=>e===error);assert.deepEqual(f.stats(),{aborts:1,cancels:1});
}


// Strict subprocess control proves a failure before any first read was an
// unhandled rejection in the exact upstream source, and is retained now.
for(const [label,body,expected] of [['original',original,1],['corrected',source,0]]){
  const range=section(body,'class PDFFetchStreamRangeReader {','\n;// ./src/display/network.js');
  const script="import vm from 'node:vm';import assert from 'node:assert/strict';const failure=new TypeError('Synthetic early range fetch failure');const C=vm.runInNewContext("+JSON.stringify(range+';PDFFetchStreamRangeReader;')+",{Promise,Headers,AbortController,fetch:()=>Promise.reject(failure),createFetchOptions:()=>({})});const reader=new C({source:{url:'https://fixture.invalid/synthetic.pdf'},headers:new Headers()},0,1);await new Promise(resolve=>setImmediate(resolve));await assert.rejects(reader.read(),e=>e===failure);";
  const result=spawnSync(process.execPath,['--unhandled-rejections=strict','--input-type=module'],{input:script,encoding:'utf8',timeout:5000});assert.equal(result.error,undefined);assert.equal(result.status,expected,label+' strict no-first-read control');if(expected)assert.match(result.stderr,/TypeError: Synthetic early range fetch failure/);
}

// No-first-read controls: readiness is owned immediately, not only after read().
for(const kind of ['full','range']){
  const make=f=>kind==='full'?f.stream.getFullReader():f.stream.getRangeReader(16,32);
  for(const failureKind of ['fetch','reader-creation']){
    const error=Error('Original '+kind+' '+failureKind+' failure'),f=readers(failureKind==='fetch'?{fetchError:error}:{readerError:error}),r=make(f);
    await tick(); // Deliberately no read/cancel observer until after rejection.
    await assert.rejects(r.cancel(Error('Departure')),e=>e===error);
    await assert.rejects(r.read(),e=>e===error);
    await assert.rejects(f.stream.cancelAllRequests(Error('Destruction')),e=>e===error);
    assert.equal(f.stats().cancels,0,'No native reader exists after failed readiness');
  }

  {
    const gate=deferred(),error=new DOMException('Synthetic fetch aborted before headers','AbortError'),f=readers({fetchGate:gate,abortFailure:error}),r=make(f);
    await assert.rejects(r.cancel(Error('Departure')),e=>e===error);
    await assert.rejects(r.read(),e=>e===error);await assert.rejects(f.stream.cancelAllRequests(Error('Destruction')),e=>e===error);assert.equal(f.stats().cancels,0);
  }
  for(const failedFetch of [false,true]){
    const gate=deferred(),error=Error('Original '+kind+' late fetch failure'),f=readers({fetchGate:gate}),r=make(f);let settled=false;
    const cancel=r.cancel(Error('Departure before headers'));const observation=failedFetch?assert.rejects(cancel,e=>e===error):cancel;cancel.then(()=>settled=true,()=>settled=true);
    await tick();assert.equal(settled,false,'Early cancellation owns pending readiness');assert.deepEqual(f.stats(),{aborts:1,cancels:0},'Abort is immediate even without a native reader');
    if(failedFetch)gate.reject(error);else gate.resolve(f.response);await observation;
    if(failedFetch){await assert.rejects(r.read(),e=>e===error);await assert.rejects(f.stream.cancelAllRequests(Error('Destruction')),e=>e===error);}
    else{assert.deepEqual(f.stats(),{aborts:1,cancels:1},'Late healthy response reader is cancelled instead of orphaned');assert.equal((await r.read()).done,true);await f.stream.cancelAllRequests(Error('Destruction'));}
  }
}
// App callers do not disable ranges; the bundled capability check requires the
// response headers that CI91's GET-only fixture does not advertise.
{
  const validate=vm.runInNewContext('('+section(source,'function validateRangeRequestCapabilities(', '\nfunction extractFilenameFromHeader')+')');
  assert.equal(validate({responseHeaders:new Headers({'Content-Length':'1024','Accept-Ranges':'bytes'}),isHttp:true,rangeChunkSize:16,disableRange:false}).allowRangeRequests,true);
  assert.equal(validate({responseHeaders:new Headers({'Content-Length':'1024'}),isHttp:true,rangeChunkSize:16,disableRange:false}).allowRangeRequests,false);
  assert.match(read('measurement.js'),/getDocument\(\{ url: pdfUrl \}\)/);
  assert.match(read('pre-alpha/references.mjs'),/getDocument\(\{url:new URL\(source.path,import.meta.url\).href,isEvalSupported:false\}\)/);
  assert.doesNotMatch(read('tests/launch-worker-upgrade-ui.mjs'),/Accept-Ranges/,'The exact CI91 fixture does not enable ranges through this header');
}

function taskHarness({transportError,workerError}={}){
  const C=vm.runInNewContext(section(source,'class PDFDocumentLoadingTask {','\nclass PDFDataRangeTransport {')+';PDFDocumentLoadingTask;', {Promise,AggregateError});const task=new C(),calls=[];task._transport={async destroy(){calls.push('transport');if(transportError)throw transportError;}};task._worker={port:{},destroy(){calls.push('worker');if(workerError)throw workerError;}};return {task,calls};
}
for(const mode of ['healthy','transport-error','both-errors']){
  const first=Error('Original transport failure'),second=Error('Original worker failure'),f=taskHarness({transportError:mode==='healthy'?null:first,workerError:mode==='both-errors'?second:null});if(mode==='healthy')await f.task.destroy();else await assert.rejects(f.task.destroy(),e=>mode==='both-errors'?e instanceof AggregateError&&e.errors[0]===first&&e.errors[1]===second:e===first);assert.deepEqual(f.calls,['transport','worker']);assert.equal(f.task._transport,null);assert.equal(f.task._worker,null);assert.equal(f.task.destroyed,true);
}
function transportHarness({cancelError,messageError,gate,networkStream}={}){
  const method=section(source,'  destroy() {\n    if (this.destroyCapability)','\n  setupMessageHandler() {'),calls=[];
  const C=vm.runInNewContext('class Fixture {#passwordCapability;#pageCache=new Map();#pagePromises=new Map();#pageRefCache=new Map();#methodPromises=new Map();'+method+'};Fixture;', {Promise,AggregateError,AbortException:Error,TextLayer:{cleanup:()=>calls.push('text')}}),transport=new C();transport.commonObjs={clear:()=>calls.push('objects')};transport.fontLoader={clear:()=>calls.push('fonts')};transport.filterFactory={destroy:()=>calls.push('filters')};transport.messageHandler={sendWithPromise:async()=>{calls.push('terminate');},destroy:()=>{calls.push('message');if(messageError)throw messageError;}};transport._networkStream=networkStream||{cancelAllRequests:async()=>{calls.push('cancel');if(gate)await gate.promise;if(cancelError)throw cancelError;}};return {transport,calls};
}
{
  const gate=deferred(),f=transportHarness({gate});let settled=false;const work=f.transport.destroy();assert.equal(f.transport.destroy(),work,'Duplicate destruction shares one owner');work.then(()=>settled=true);await tick();assert.equal(settled,false);assert.ok(f.calls.includes('cancel'));assert.ok(!f.calls.includes('message'));gate.resolve();await work;assert.equal(f.calls.filter(x=>x==='cancel').length,1);assert.equal(f.calls.filter(x=>x==='message').length,1);assert.equal(f.transport.messageHandler,null);
}
for(const multiple of [false,true]){const error=Error('Original cancellation failure'),other=Error('Original message cleanup failure'),f=transportHarness({cancelError:error,messageError:multiple?other:null});await assert.rejects(f.transport.destroy(),e=>multiple?e instanceof AggregateError&&e.errors[0]===error&&e.errors[1]===other:e===error);assert.equal(f.calls.at(-1),'message');assert.equal(f.transport.messageHandler,null);}

// The real fetch stream is connected through the actual transport/task destroy
// methods: cancellation before headers must settle at the final public owner.
for(const kind of ['full','range'])for(const failedFetch of [false,true]){
  const gate=deferred(),error=Error('Original '+kind+' early destruction failure'),f=readers({fetchGate:gate}),reader=kind==='full'?f.stream.getFullReader():f.stream.getRangeReader(16,32),transport=transportHarness({networkStream:f.stream}),loading=taskHarness();loading.task._transport=transport.transport;
  let settled=false;const work=loading.task.destroy(),observation=failedFetch?assert.rejects(work,e=>e===error):work;work.then(()=>settled=true,()=>settled=true);await tick();assert.equal(settled,false);assert.equal(f.stats().aborts,1);assert.equal(f.stats().cancels,0);
  if(failedFetch)gate.reject(error);else gate.resolve(f.response);await observation;assert.equal(loading.task._worker,null);assert.equal(loading.task._transport,null);assert.equal(transport.transport.messageHandler,null);assert.ok(transport.calls.includes('message'));assert.ok(loading.calls.includes('worker'));
  if(failedFetch)await assert.rejects(reader.read(),e=>e===error);else assert.equal(f.stats().cancels,1);
}

for(const reader of ['this._fullReader','rangeReader']){
  const callback=messageCancelCallback(source,reader);
  const error=Error('Original message cancellation failure'),sink={ready:Promise.resolve()},owner={destroyed:false,_fullReader:{cancel:()=>Promise.reject(error)}};
  // Bind the full-reader callback's lexical this using a wrapper.
  const setup=vm.runInNewContext('(function(){'+callback+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError});setup.call(owner);await assert.rejects(sink.onCancel(Error('Departure')),e=>e===error);
}
console.log('PASS PDF cleanup ownership: exact upstream reconstruction and license; full/range cancellation returns original errors; all readers attempted/settled; headers own streaming-disable failure; transport/task destruction awaits cleanup, releases owners on failure, aggregates simultaneous errors; strict load and message cancellation errors retained; no-first-read failed/healthy readiness, immediate early abort, late reader cleanup, public task destruction and app capability reachability. Not CI91 attribution.');


// Full/range message cancellation must own readiness independently of native reader cancellation.
function messageCancelCallback(text,reader){const start=text.indexOf('      sink.onCancel = reason => {',text.indexOf('messageHandler.on("'+(reader==='this._fullReader'?'GetReader':'GetRangeReader')+'"'));const end=text.indexOf('\n      };',start);assert.ok(start>=0&&end>start);return text.slice(start,end+9);}
const previousMessageCallbacks={
  "this._fullReader": {
    "source": "      sink.onCancel = reason => {\n        const cancellation = this._fullReader.cancel(reason);\n        sink.ready.catch(readyReason => {\n          if (this.destroyed) {\n            return;\n          }\n          throw readyReason;\n        });\n        return cancellation;\n      };",
    "sha256": "a2c5e1d2d75f91960ecac166cbf273cb4d50ec9979deacc088a2db3d9d0b3fb2"
  },
  "rangeReader": {
    "source": "      sink.onCancel = reason => {\n        const cancellation = rangeReader.cancel(reason);\n        sink.ready.catch(readyReason => {\n          if (this.destroyed) {\n            return;\n          }\n          throw readyReason;\n        });\n        return cancellation;\n      };",
    "sha256": "d86450b012716ef02eb05737c6896e30f9290dd08a1e84dc87994c4adac200de"
  }
};
for(const reader of ['this._fullReader','rangeReader']){
 const current=messageCancelCallback(source,reader),previous=previousMessageCallbacks[reader];assert.equal(sha(previous.source),previous.sha256);
 for(const [label,callback,expected]of [['previous',previous.source,1],['corrected',current,0]]){
  const script="import assert from 'node:assert/strict';import vm from 'node:vm';const ready=Promise.withResolvers(),cancel=Promise.withResolvers(),failure=new TypeError('Synthetic pending sink.ready failure'),sink={ready:ready.promise},owner={destroyed:false,_fullReader:{cancel:()=>cancel.promise}};vm.runInNewContext("+JSON.stringify('(function(){'+callback+'})')+",{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);const returned=sink.onCancel(Error('worker cancel'));returned.catch(()=>{});ready.reject(failure);await new Promise(resolve=>setImmediate(resolve));cancel.resolve();await assert.rejects(returned,e=>e===failure);";
  const result=spawnSync(process.execPath,['--unhandled-rejections=strict','--input-type=module'],{input:script,encoding:'utf8',timeout:5000});assert.equal(result.error,undefined);assert.equal(result.status,expected,label+' '+reader+' pending readiness ownership');if(expected)assert.match(result.stderr,/TypeError: Synthetic pending sink.ready failure/);
 }
 for(const order of ['readiness-first','cancellation-first'])for(const readinessFails of [false,true])for(const cancellationFails of [false,true]){
  const ready=deferred(),cancel=deferred(),readyError=Error('Original readiness failure'),cancelError=Error('Original reader failure'),sink={ready:ready.promise},owner={destroyed:false,_fullReader:{cancel:()=>cancel.promise}};
  vm.runInNewContext('(function(){'+current+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);
  let settled=false;const work=sink.onCancel(Error('Worker cancel')),observed=work.then(value=>{settled=true;return {value};},error=>{settled=true;return {error};});
  const settleReady=()=>readinessFails?ready.reject(readyError):ready.resolve(),settleCancel=()=>cancellationFails?cancel.reject(cancelError):cancel.resolve();
  (order==='readiness-first'?settleReady:settleCancel)();await tick();assert.equal(settled,false,'Wait for both independent owned settlements');(order==='readiness-first'?settleCancel:settleReady)();
  const result=await observed,errors=[...(cancellationFails?[cancelError]:[]),...(readinessFails?[readyError]:[])];
  if(errors.length===0)assert.equal(result.value,undefined);else if(errors.length===1)assert.equal(result.error,errors[0]);else{assert.ok(result.error instanceof AggregateError);assert.deepEqual(result.error.errors,errors);}
 }
 for(const cancellationFails of [false,true]){
  const ready=deferred(),cancel=deferred(),cancelError=Error('Destroyed transport reader failure'),sink={ready:ready.promise},owner={destroyed:true,_fullReader:{cancel:()=>cancel.promise}};
  vm.runInNewContext('(function(){'+current+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);const work=sink.onCancel(Error('Worker cancel')),observed=work.then(value=>({value}),error=>({error}));ready.reject(Error('Existing destroyed-readiness rule'));await tick();if(cancellationFails)cancel.reject(cancelError);else cancel.resolve();const result=await observed;if(cancellationFails)assert.equal(result.error,cancelError);else assert.equal(result.value,undefined);
 }
 {
  const ready=deferred(),cancel=deferred(),error=Error('Active readiness failure remains retained'),sink={ready:ready.promise},owner={destroyed:false,_fullReader:{cancel:()=>cancel.promise}};
  vm.runInNewContext('(function(){'+current+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);const observed=sink.onCancel(Error('Worker cancel')).catch(e=>e);ready.reject(error);await tick();owner.destroyed=true;cancel.resolve();assert.equal(await observed,error,'Later destruction must not erase an earlier active readiness failure');
 }
 {
  const ready=deferred(),cancelError=Error('Synchronous reader cancellation failure'),readyError=Error('Independent readiness failure'),sink={ready:ready.promise},owner={destroyed:false,_fullReader:{cancel(){throw cancelError;}}};
  vm.runInNewContext('(function(){'+current+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);const observed=sink.onCancel(Error('Worker cancel')).catch(e=>e);ready.reject(readyError);const error=await observed;assert.ok(error instanceof AggregateError);assert.deepEqual(error.errors,[cancelError,readyError]);
 }
 // Execute the unchanged message handler CANCEL case: it rejects sink.ready after invoking onCancel.
 // Completion cannot await its own acknowledgment; the independently settled reader is the only gate here.
 for(const destroyed of [false,true]){
  const ready=deferred(),cancel=deferred(),reason=Error('Original protocol cancellation'),sink={ready:ready.promise,sinkCapability:ready},owner={destroyed,_fullReader:{cancel:()=>cancel.promise}},messages=[];
  vm.runInNewContext('(function(){'+current+'})',{sink,rangeReader:owner._fullReader,Promise,AggregateError}).call(owner);
  const body=section(source,'      case StreamKind.CANCEL:\n','      default:'),connection={streamSinks:{1:sink}},context={Promise,StreamKind:{CANCEL:1,CANCEL_COMPLETE:2},data:{stream:1,reason},streamId:1,streamSink:sink,sourceName:'main',targetName:'worker',comObj:{postMessage:message=>messages.push(message)},wrapReason:e=>e};
  vm.runInNewContext('(function(){switch(data.stream){'+body+'}})',context).call(connection);assert.equal(sink.isCancelled,true);assert.equal(connection.streamSinks[1],undefined);await tick();assert.equal(messages.length,0);cancel.resolve();await tick();assert.equal(messages.length,1);if(destroyed)assert.equal(messages[0].success,true);else assert.equal(messages[0].reason,reason);
 }
}
console.log('PASS PDF sink ownership: exact prior strict-unhandled negatives, full/range independent pending/healthy/rejected orders, original/simultaneous errors, synchronous failure, destruction timing and unchanged CANCEL dispatch with no completion cycle. Not Linux cause proof.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),read=path=>readFileSync(root+'/'+path,'utf8').replace(/\r\n/g,'\n'),source=read('pdf.mjs'),provenance=JSON.parse(read('pdf-api-provenance.json'));
let original=source;
for(const edit of [...provenance.edits].reverse()){
  if(edit.section){const a=original.indexOf('class PDFFetchStream {'),b=original.indexOf('\n;// ./src/display/network.js',a),section=original.slice(a,b);assert.equal(section.split(edit.newText).length,edit.count+1,edit.label);original=original.slice(0,a)+section.split(edit.newText).join(edit.oldText)+original.slice(b);}
  else{assert.equal(original.split(edit.newText).length,edit.count+1,edit.label);original=original.split(edit.newText).join(edit.oldText);}
}
const sha=text=>createHash('sha256').update(text).digest('hex');assert.equal(sha(original),provenance.originalNormalizedSha256);assert.equal(sha(original),'a209a2124baa35cbb9015b809926f1bcec9dd1c247296290e205dd9d76cb9128');assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0'+original).digest('hex'),provenance.originalGitBlob);assert.equal(sha(source),provenance.modifiedNormalizedSha256);assert.equal(source.slice(0,source.indexOf('// TapCalc local modification:')).trimEnd(),original.slice(0,original.indexOf('/******/ // The require scope')).trimEnd(),'Original entire license notice retained');
const tick=()=>new Promise(resolve=>setImmediate(resolve)),deferred=()=>Promise.withResolvers();
function section(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a);return text.slice(a,b);}
function readers({failure,range=false,disableStream=false,cancelFailure,cancelGate}={}){
  const nativeFailure=failure;let aborts=0,cancels=0;
  const nativeReader={read:async()=>{if(nativeFailure)throw nativeFailure;return {done:true};},cancel:()=>{cancels++;if(cancelFailure)return Promise.reject(cancelFailure);return cancelGate?.promise||Promise.resolve();}};
  const context={Promise,Headers,Uint8Array,ArrayBuffer,AggregateError,AbortException:Error,AbortController:class{abort(){aborts++;}},fetch:async()=>({url:'https://fixture.invalid/synthetic.pdf',status:200,headers:new Headers(),body:{getReader:()=>nativeReader}}),assert:(condition,message)=>assert.ok(condition,message),createHeaders:()=>new Headers(),createFetchOptions:()=>({}),getResponseOrigin:url=>new URL(url).origin,validateResponseStatus:status=>status===200,createResponseStatusError:()=>Error('Unexpected status'),validateRangeRequestCapabilities:()=>({allowRangeRequests:range}),extractFilenameFromHeader:()=>null,getArrayBuffer:value=>value};
  const api=vm.runInNewContext(section(source,'class PDFFetchStream {','\n;// ./src/display/network.js')+';({PDFFetchStream,PDFFetchStreamReader,PDFFetchStreamRangeReader});',context),stream=new api.PDFFetchStream({url:'https://fixture.invalid/synthetic.pdf',disableStream,rangeChunkSize:16});stream._responseOrigin="https://fixture.invalid";return {api,stream,nativeReader,stats:()=>({aborts,cancels})};
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
function taskHarness({transportError,workerError}={}){
  const C=vm.runInNewContext(section(source,'class PDFDocumentLoadingTask {','\nclass PDFDataRangeTransport {')+';PDFDocumentLoadingTask;', {Promise,AggregateError});const task=new C(),calls=[];task._transport={async destroy(){calls.push('transport');if(transportError)throw transportError;}};task._worker={port:{},destroy(){calls.push('worker');if(workerError)throw workerError;}};return {task,calls};
}
for(const mode of ['healthy','transport-error','both-errors']){
  const first=Error('Original transport failure'),second=Error('Original worker failure'),f=taskHarness({transportError:mode==='healthy'?null:first,workerError:mode==='both-errors'?second:null});if(mode==='healthy')await f.task.destroy();else await assert.rejects(f.task.destroy(),e=>mode==='both-errors'?e instanceof AggregateError&&e.errors[0]===first&&e.errors[1]===second:e===first);assert.deepEqual(f.calls,['transport','worker']);assert.equal(f.task._transport,null);assert.equal(f.task._worker,null);assert.equal(f.task.destroyed,true);
}
function transportHarness({cancelError,messageError,gate}={}){
  const method=section(source,'  destroy() {\n    if (this.destroyCapability)','\n  setupMessageHandler() {'),calls=[];
  const C=vm.runInNewContext('class Fixture {#passwordCapability;#pageCache=new Map();#pagePromises=new Map();#pageRefCache=new Map();#methodPromises=new Map();'+method+'};Fixture;', {Promise,AggregateError,AbortException:Error,TextLayer:{cleanup:()=>calls.push('text')}}),transport=new C();transport.commonObjs={clear:()=>calls.push('objects')};transport.fontLoader={clear:()=>calls.push('fonts')};transport.filterFactory={destroy:()=>calls.push('filters')};transport.messageHandler={sendWithPromise:async()=>{calls.push('terminate');},destroy:()=>{calls.push('message');if(messageError)throw messageError;}};transport._networkStream={cancelAllRequests:async()=>{calls.push('cancel');if(gate)await gate.promise;if(cancelError)throw cancelError;}};return {transport,calls};
}
{
  const gate=deferred(),f=transportHarness({gate});let settled=false;const work=f.transport.destroy();assert.equal(f.transport.destroy(),work,'Duplicate destruction shares one owner');work.then(()=>settled=true);await tick();assert.equal(settled,false);assert.ok(f.calls.includes('cancel'));assert.ok(!f.calls.includes('message'));gate.resolve();await work;assert.equal(f.calls.filter(x=>x==='cancel').length,1);assert.equal(f.calls.filter(x=>x==='message').length,1);assert.equal(f.transport.messageHandler,null);
}
for(const multiple of [false,true]){const error=Error('Original cancellation failure'),other=Error('Original message cleanup failure'),f=transportHarness({cancelError:error,messageError:multiple?other:null});await assert.rejects(f.transport.destroy(),e=>multiple?e instanceof AggregateError&&e.errors[0]===error&&e.errors[1]===other:e===error);assert.equal(f.calls.at(-1),'message');assert.equal(f.transport.messageHandler,null);}
for(const reader of ['this._fullReader','rangeReader']){
  const start='      sink.onCancel = reason => {\n        const cancellation = '+reader+'.cancel(reason);',callback=section(source,start,'\n    });').trim();
  const error=Error('Original message cancellation failure'),sink={ready:Promise.resolve()},owner={destroyed:false,_fullReader:{cancel:()=>Promise.reject(error)}};
  // Bind the full-reader callback's lexical this using a wrapper.
  const setup=vm.runInNewContext('(function(){'+callback+'})',{sink,rangeReader:owner._fullReader});setup.call(owner);await assert.rejects(sink.onCancel(Error('Departure')),e=>e===error);
}
console.log('PASS PDF cleanup ownership: exact upstream reconstruction and license; full/range cancellation returns original errors; all readers attempted/settled; headers own streaming-disable failure; transport/task destruction awaits cleanup, releases owners on failure, aggregates simultaneous errors; strict load and message cancellation errors retained. Not CI91 attribution.');

// Deterministic worker event-ownership regression; no network, PDF, browser or job data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const original=source.replace('function cacheFresh(request, event)','function cacheFresh(request)').replaceAll('cacheFresh(event.request, event)','cacheFresh(event.request)').replace('event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));','caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));').replace('event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));','caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));');
assert.equal(createHash('sha256').update(original).digest('hex'),'1970e7c4f8be9fa2d0fe069ad4be5ef6b2c4c4d26fd3dbe74057ee6e0cb1bc96','Only runtime cache lifetime ownership differs from the exact CI89 root worker');
const tick=()=>new Promise(r=>setImmediate(r)),deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
// Model the UA observing waitUntil rejections; each failure is still asserted as the exact original rejected promise.
function fixture(text,{cached,networkError,ok=true,openError}={}){
 const listeners={},gate=deferred(),response={ok,clone:()=>({synthetic:true})},lifetimes=[],rejected=[];let puts=0,fetches=0,responded,opens=0;
 const cache={match:async()=>cached,put:()=>{puts++;return gate.promise;}};
 const sandbox={URL,Promise,console,Request,self:{location:{origin:'https://fixture.invalid',href:'https://fixture.invalid/service-worker.js'},addEventListener:(k,f)=>listeners[k]=f},caches:{open:async()=>{opens++;if(openError&&opens>(openError.after||0))throw openError.error;return cache;}},fetch:async()=>{fetches++;if(networkError)throw networkError;return response;},Response:{error:()=>({syntheticError:true})}};
 vm.runInNewContext(text,sandbox);
 return {gate,response,lifetimes,rejected,get puts(){return puts;},get fetches(){return fetches;},send(path,mode='cors',headers={has:()=>false}){listeners.fetch({request:{url:'https://fixture.invalid'+path,method:'GET',mode,headers},respondWith:p=>responded=p,waitUntil:p=>{lifetimes.push(p);p.then(()=>{},e=>rejected.push(e));}});return responded;}};
}
for(const [kind,path,mode]of [['navigation','/measurement-card.html','navigate'],['shell','/measurement.js','cors'],['body','/reference/stackups/SYNTHETIC.pdf','cors']]){
 // Regression control proves the original source returns while a put is unowned.
 const prior=fixture(original);assert.equal(await prior.send(path,mode),prior.response);await tick();assert.equal(prior.puts,1);assert.equal(prior.lifetimes.length,0);prior.gate.resolve();
 for(const reject of [false,true]){
  const f=fixture(source),response=await f.send(path,mode);assert.equal(response,f.response,'Response must not wait for optional cache write: '+kind);await tick();assert.equal(f.puts,1);assert.equal(f.lifetimes.length,1);let settled=false;const lifetime=Promise.all(f.lifetimes).then(()=>{settled=true;},e=>{settled=true;throw e;});const observation=lifetime.catch(e=>e);await tick();assert.equal(settled,false,'Pending write remains event-owned');
  if(reject){const error=Error('Original synthetic cache put failure');f.gate.reject(error);assert.equal(await observation,error,'Preserve original cache rejection; no filter or swallow');}else{f.gate.resolve();await lifetime;assert.equal(settled,true);}
 }
 const error=Error('Synthetic cache open failed'),f=fixture(source,{openError:{error,after:kind==='body'?1:0}});assert.equal(await f.send(path,mode),f.response);await tick();assert.equal(f.lifetimes.length,1);await assert.rejects(f.lifetimes[0],e=>e===error);assert.deepEqual(f.rejected,[error]);
 const nonOk=fixture(source,{ok:false});assert.equal(await nonOk.send(path,mode),nonOk.response);await tick();assert.equal(nonOk.puts,0);assert.equal(nonOk.lifetimes.length,0);
}
{
 const cached={syntheticCached:true},f=fixture(source,{cached});assert.equal(await f.send('/reference/stackups/SYNTHETIC.pdf'),cached);assert.equal(f.fetches,0);assert.equal(f.lifetimes.length,0);
}
for(const [path,mode]of [['/measurement-card.html','navigate'],['/measurement.js','cors']]){const cached={syntheticOffline:true},f=fixture(source,{cached,networkError:Error('Synthetic offline')});assert.equal(await f.send(path,mode),cached);assert.equal(f.puts,0);assert.equal(f.lifetimes.length,0);}
{const error=Error('Original non-shell fetch failure'),f=fixture(source,{networkError:error});await assert.rejects(f.send('/reference/stackups/SYNTHETIC.pdf'),e=>e===error);assert.equal(f.lifetimes.length,0);}
for(const path of ['/pre-alpha/','/dev/measurement-card.html']){const f=fixture(source);assert.equal(f.send(path),undefined);assert.equal(f.fetches,0);assert.equal(f.lifetimes.length,0);}
{const f=fixture(source);assert.equal(f.send('/measurement.js','cors',{has:()=>true}),undefined);assert.equal(f.fetches,0);}
console.log('PASS root runtime cache ownership: original unowned-write controls; navigation/shell/body pending, fulfilled and exact rejected cache work attached to fetch lifetime without delaying responses; non-OK/cache-hit/network fallback and child/auth ownership preserved. Not native activation or Linux release proof.');

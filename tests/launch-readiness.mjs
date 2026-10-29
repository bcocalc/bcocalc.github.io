import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {MessageChannel} from 'node:worker_threads';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll('\r\n','\n'),source=read('launch.js'),APP='pre-alpha26',VERSION='launch-'+APP+'-1';
async function launch({path='/',standalone=false,flag=false,ready=true,fail=false,noServiceWorker=false,fresh=false,noRoot=false}={}){
 let replaced='',stopped=0,registers=0,rootRegistered=false,childRegistered=false,rootUpdates=0;const status={textContent:''},retry={disabled:false,addEventListener(){}};
 const rootWorker={state:'activated',postMessage:(message,ports)=>{if((ready||rootRegistered)&&message.type==='tapcalc-launch-version'){ports[0].postMessage({version:VERSION});ports[0].close();}}};
 const modern={state:'activated',postMessage:(message,ports)=>{if((ready||childRegistered)&&message.type==='tapcalc-pre-alpha-version'){ports[0].postMessage({build:APP});ports[0].close();}}};
 const rootRegistration={scope:'https://fixture.invalid/',active:rootWorker,update:async()=>{rootUpdates++;if(fail)throw Error('Synthetic root update failure');if(fresh)rootRegistered=true;}};
 const sw={controller:rootWorker,getRegistration:async url=>new URL(url).pathname.startsWith('/pre-alpha/')?{scope:'https://fixture.invalid/pre-alpha/',active:modern}:noRoot?undefined:rootRegistration,register:async url=>{registers++;if(fail)throw Error('Synthetic network failure');const child=url.includes('/pre-alpha/');if(fresh){if(child)childRegistered=true;else rootRegistered=true;}return {active:child?modern:rootWorker,update:async()=>{throw Error('Duplicate update after registration');}};}};
 const location={href:'https://fixture.invalid'+path+(flag?'?legacy=1':''),replace:url=>replaced=url},navigator={standalone,...noServiceWorker?{}:{serviceWorker:sw}};
 const context={URL,MessageChannel,setTimeout,clearTimeout,Date,Promise,location,navigator,matchMedia:()=>({matches:standalone}),window:{stop:()=>stopped++},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:retry}};
 Object.defineProperty(context,'localStorage',{get(){throw Error('Launcher must not access storage');}});vm.runInNewContext(source,context);
 for(let i=0;i<100&&!replaced&&!status.textContent.includes('could not');i++)await new Promise(resolve=>setTimeout(resolve,10));
 return {replaced,stopped,registers,rootUpdates,status:status.textContent};
}
assert.deepEqual(await launch({path:'/measurement-card.html'}),{replaced:'',stopped:0,registers:0,rootUpdates:0,status:''});
assert.deepEqual(await launch({path:'/measurement-card.html',standalone:true,flag:true}),{replaced:'',stopped:0,registers:0,rootUpdates:0,status:''});
const installed=await launch({path:'/measurement-card.html',standalone:true});assert.equal(installed.stopped,1);assert.equal(installed.replaced,'https://fixture.invalid/?from=installed');
const cached=await launch();assert.equal(cached.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);assert.equal(cached.registers,0,'Trusted activated workers work without network update');assert.equal(cached.rootUpdates,0);
const prepared=await launch({ready:false,fresh:true});assert.equal(prepared.registers,1);assert.equal(prepared.rootUpdates,1);assert.equal(prepared.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);
const coldRoot=await launch({ready:false,fresh:true,noRoot:true});assert.equal(coldRoot.registers,2);assert.equal(coldRoot.rootUpdates,0);assert.equal(coldRoot.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);
const unsupported=await launch({noServiceWorker:true});assert.equal(unsupported.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);
const held=await launch({ready:false,fail:true});assert.equal(held.replaced,'');assert.match(held.status,/saved jobs have not been changed/);
assert.doesNotMatch(source,/localStorage|indexedDB|sessionStorage|\.delete\(/);
const manifest=JSON.parse(read('manifest.json')),oldManifest=JSON.parse(execFileSync('git',['show','cdf8471:manifest.json'],{encoding:'utf8'}));
assert.equal(manifest.start_url,'./pre-alpha/?v='+APP);assert.equal(manifest.id,oldManifest.start_url);assert.equal(manifest.scope,oldManifest.scope);assert.deepEqual(manifest.icons,oldManifest.icons);
assert.match(read('index.html'),/legacy=1/);assert.doesNotMatch(read('index.html'),/http-equiv="refresh"|<iframe/);assert.match(read('measurement-card.html'),/launch\.js\?v=launch-pre-alpha26-1/);
const listeners={},worker={URL,Request,self:{location:{href:'https://fixture.invalid/service-worker.js',origin:'https://fixture.invalid'},addEventListener:(type,fn)=>listeners[type]=fn}};
vm.runInNewContext(read('service-worker.js'),worker);
for(const path of ['/pre-alpha/','/pre-alpha/reference-helpers.mjs','/dev/measurement-card.html']){
 let answered=false;listeners.fetch({request:{method:'GET',url:'https://fixture.invalid'+path,headers:{has:()=>false},mode:'navigate'},respondWith:()=>answered=true});assert.equal(answered,false,'Child scope not captured: '+path);
}
let version;listeners.message({data:{type:'tapcalc-launch-version'},ports:[{postMessage:value=>version=value.version}]});assert.equal(version,VERSION);
assert.match(read('service-worker.js'),/cache\.addAll\(CRITICAL/);assert.match(read('service-worker.js'),/cache:'no-store'/);
console.log('PASS launch unit: normal legacy and explicit bypass preserved; installed bridge; cached worker handoff; held failures; stable manifest identity/icons/scope; root/child ownership; no job/storage access.');

// The existing shell owner must update the exact root registration once per page.
const ownerSource=read('firebase-config.js').split('  let rootWorkerPreparation;')[1]?.split('  function bootTapCalcShell(){')[0];assert.ok(ownerSource);
async function shellOwner({existing=true,child=false,fail=false,unsupported=false}={}){
 const calls={lookup:[],register:[],updates:0};const active={scope:'https://fixture.invalid/'};
 const registration={...active,update:async()=>{calls.updates++;if(fail)throw Error('Synthetic update failure');}};
 const serviceWorker={getRegistration:async url=>{calls.lookup.push(url);return existing?child?{scope:'https://fixture.invalid/pre-alpha/',update:()=>{throw Error('Wrong child registration');}}:registration:undefined;},register:async(url,options)=>{calls.register.push({url,options});return registration;}};
 const context={URL,location:{href:'https://fixture.invalid/measurement-card.html?legacy=1'},BUILD:{serviceWorkerVersion:'3.0.0-livefix21'},VERSION:'3.0.0-livefix21',navigator:unsupported?{}:{serviceWorker}};
 for(const name of ['localStorage','indexedDB','sessionStorage'])Object.defineProperty(context,name,{get(){throw Error('Worker owner must not access jobs');}});
 const run=vm.runInNewContext('let rootWorkerPreparation;'+ownerSource+';registerFreshServiceWorker;',context),first=run(),second=run();assert.equal(first,second,'Concurrent shell boot calls share one preparation');await first;return calls;
}
const existingRoot=await shellOwner();assert.deepEqual(existingRoot.lookup,['https://fixture.invalid/']);assert.equal(existingRoot.register.length,0);assert.equal(existingRoot.updates,1);
for(const options of [{existing:false},{child:true}]){const cold=await shellOwner(options);assert.equal(cold.register.length,1);assert.equal(cold.register[0].url,'https://fixture.invalid/service-worker.js?v=3.0.0-livefix21');assert.equal(cold.register[0].options.scope,'/');assert.equal(cold.register[0].options.updateViaCache,'none');assert.equal(cold.updates,1);}
const rejected=await shellOwner({fail:true});assert.equal(rejected.updates,1);assert.equal(rejected.register.length,0);
assert.deepEqual(await shellOwner({unsupported:true}),{lookup:[],register:[],updates:0});
assert.doesNotMatch(read('measurement.js'),/navigator\.serviceWorker\.register/,'Calculator does not create a competing worker registration owner');
console.log('PASS root worker owner: exact scope, existing registration update, cold registration, child exclusion, concurrent boot coalescing, handled update failure and no job access.');

// An obsolete preview rejection must not start a native PDF frame during unload.
const visualSource=read('measurement.js'),visualStart=visualSource.indexOf('function updateMachineReferenceVisual(row) {'),visualEnd=visualSource.indexOf('function updateMachineReferenceDetail(row) {',visualStart);assert.ok(visualStart>=0&&visualEnd>visualStart);
const visualFunction=visualSource.slice(visualStart,visualEnd),previewLifecycle="window.addEventListener('beforeunload',()=>{machineReferenceVisualRenderToken+=1;});\nwindow.addEventListener('pagehide',()=>{machineReferenceVisualRenderToken+=1;});\nwindow.addEventListener('pageshow',(event)=>{if(event.persisted)updateMachineReferenceSummary();});\n";
assert.ok(visualSource.includes(previewLifecycle));
for(const eventType of [null,'beforeunload','pagehide']){
 let rejectPreview,fallbacks=0,resumes=0;const events={},pending=new Promise((_,reject)=>rejectPreview=reject);
 const context={window:{addEventListener:(name,callback)=>events[name]=callback},getMachineReferenceVisualSource:()=>({openUrl:'/synthetic.pdf',pageNumber:1}),machineReferenceVisualOpenEl:null,machineReferenceVisualCanvasEl:{hidden:true},setMachineReferenceVisualMessage:()=>{},showMachineReferenceNativePreview:()=>{fallbacks++;return true;},renderMachineReferenceVisualPage:()=>pending,updateMachineReferenceSummary:()=>{resumes++;}};
 for(const name of ['localStorage','indexedDB','sessionStorage'])Object.defineProperty(context,name,{get(){throw Error('Preview cleanup must not access jobs');}});
 const run=vm.runInNewContext('let machineReferenceVisualRenderToken=0;'+previewLifecycle+visualFunction+';updateMachineReferenceVisual;',context);run({source:'Synthetic'});if(eventType)events[eventType]();rejectPreview(Error('Synthetic preview cancellation'));await new Promise(resolve=>setImmediate(resolve));assert.equal(fallbacks,eventType?0:1,'Only an unloading preview suppresses its obsolete fallback');events.pageshow({persisted:false});assert.equal(resumes,0);events.pageshow({persisted:true});assert.equal(resumes,1,'Back/forward restore resumes the existing selected-reference owner');
}
console.log('PASS preview lifecycle: normal errors retain fallback; unload/pagehide invalidates stale callbacks; persisted page restore resumes reference; no job access.');

const childBoot="if ('serviceWorker' in navigator) {\n  const workerScope=new URL('./',location.href);\n  navigator.serviceWorker.getRegistration(workerScope.href)\n    .then(registration=>registration&&registration.scope===workerScope.href\n      ? registration.update()\n      : navigator.serviceWorker.register(new URL('service-worker.js?v='+BUILD,workerScope).href,{scope:workerScope.pathname,updateViaCache:'none'}).then(registration=>registration.update()))\n    .catch(()=>{});\n}\n";assert.ok(read('pre-alpha/workspace.mjs').endsWith(childBoot));
for(const kind of ['child','root','absent']){
 const calls={lookup:[],register:[],updates:0},child={scope:'https://fixture.invalid/pre-alpha/',update:async()=>{calls.updates++;}},parent={scope:'https://fixture.invalid/',update:()=>{throw Error('Child boot must never update root');}};
 const context={URL,navigator:{serviceWorker:{getRegistration:async url=>{calls.lookup.push(url);return kind==='child'?child:kind==='root'?parent:undefined;},register:async(url,options)=>{calls.register.push({url,options});return child;}}}};
 for(const name of ['localStorage','indexedDB','sessionStorage'])Object.defineProperty(context,name,{get(){throw Error('Child worker owner must not access jobs');}});
 await vm.runInNewContext("const BUILD='pre-alpha26';"+childBoot.replace('location.href',"'https://fixture.invalid/pre-alpha/?v=pre-alpha26#home'"),context);assert.deepEqual(calls.lookup,['https://fixture.invalid/pre-alpha/']);assert.equal(calls.updates,1);assert.equal(calls.register.length,kind==='child'?0:1);if(calls.register.length){assert.equal(calls.register[0].url,'https://fixture.invalid/pre-alpha/service-worker.js?v=pre-alpha26');assert.equal(calls.register[0].options.scope,'/pre-alpha/');}
}
console.log('PASS child worker owner: exact child scope reuse; parent exclusion; cold registration; no workspace/job access.');

let installSkipCalls=0,criticalStarted=false,resolveCritical;const criticalPending=new Promise(resolve=>resolveCritical=resolve);
worker.self.skipWaiting=async()=>{installSkipCalls++;};worker.Request=class{constructor(url,options){this.url=new URL(url,'https://fixture.invalid/').href;this.cache=options?.cache;}};
worker.caches={open:async()=>({add:async()=>{},addAll:async()=>{criticalStarted=true;await criticalPending;}})};
let installation,installationSettled=false;listeners.install({waitUntil:promise=>installation=promise});assert.equal(installSkipCalls,1,'Install requests the existing activation policy synchronously');installation.then(()=>installationSettled=true);await new Promise(resolve=>setImmediate(resolve));assert.equal(criticalStarted,true);assert.equal(installationSettled,false,'Activation request does not bypass critical-cache installation work');resolveCritical();await installation;
worker.caches={open:async()=>({add:async()=>{},addAll:async()=>{throw Error('Synthetic missing critical shell');}})};listeners.install({waitUntil:promise=>installation=promise});await assert.rejects(installation,/Synthetic missing critical shell/);assert.equal(installSkipCalls,2);
console.log('PASS install policy: synchronous skip-waiting request; installation remains pending until critical cache completes and rejects missing critical assets.');

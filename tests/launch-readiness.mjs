import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {MessageChannel} from 'node:worker_threads';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll('\r\n','\n'),source=read('launch.js'),APP='pre-alpha26',VERSION='launch-'+APP+'-1';
async function launch({path='/',standalone=false,flag=false,ready=true,fail=false,noServiceWorker=false,fresh=false}={}){
 let replaced='',stopped=0,registers=0,rootRegistered=false,childRegistered=false;const status={textContent:''},retry={disabled:false,addEventListener(){}};
 const rootWorker={state:'activated',postMessage:(message,ports)=>{if((ready||rootRegistered)&&message.type==='tapcalc-launch-version'){ports[0].postMessage({version:VERSION});ports[0].close();}}};
 const modern={state:'activated',postMessage:(message,ports)=>{if((ready||childRegistered)&&message.type==='tapcalc-pre-alpha-version'){ports[0].postMessage({build:APP});ports[0].close();}}};
 const sw={controller:rootWorker,getRegistration:async url=>new URL(url).pathname.startsWith('/pre-alpha/')?{active:modern}:{active:rootWorker},register:async url=>{registers++;if(fail)throw Error('Synthetic network failure');const child=url.includes('/pre-alpha/');if(fresh){if(child)childRegistered=true;else rootRegistered=true;}return {active:child?modern:rootWorker,update:async()=>{throw Error('Duplicate update after registration');}};}};
 const location={href:'https://fixture.invalid'+path+(flag?'?legacy=1':''),replace:url=>replaced=url},navigator={standalone,...noServiceWorker?{}:{serviceWorker:sw}};
 const context={URL,MessageChannel,setTimeout,clearTimeout,Date,Promise,location,navigator,matchMedia:()=>({matches:standalone}),window:{stop:()=>stopped++},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:retry}};
 Object.defineProperty(context,'localStorage',{get(){throw Error('Launcher must not access storage');}});vm.runInNewContext(source,context);
 for(let i=0;i<100&&!replaced&&!status.textContent.includes('could not');i++)await new Promise(resolve=>setTimeout(resolve,10));
 return {replaced,stopped,registers,status:status.textContent};
}
assert.deepEqual(await launch({path:'/measurement-card.html'}),{replaced:'',stopped:0,registers:0,status:''});
assert.deepEqual(await launch({path:'/measurement-card.html',standalone:true,flag:true}),{replaced:'',stopped:0,registers:0,status:''});
const installed=await launch({path:'/measurement-card.html',standalone:true});assert.equal(installed.stopped,1);assert.equal(installed.replaced,'https://fixture.invalid/?from=installed');
const cached=await launch();assert.equal(cached.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);assert.equal(cached.registers,0,'Trusted activated workers work without network update');
const prepared=await launch({ready:false,fresh:true});assert.equal(prepared.registers,2);assert.equal(prepared.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);
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

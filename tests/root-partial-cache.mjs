import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),base='https://fixture.invalid/',version='launch-pre-alpha26-2';
const critical=['./','./index.html','./manifest.json','./launch.js?v='+version,'./measurement-card.html','./styles.css?v=3.0.0-livefix21','./measurement.js?v=3.0.0-livefix21','./firebase-config.js?v=3.0.0-livefix21','./cloud-sync.js?v=3.0.0-livefix21'];
async function fallback(path,{missing=[],mode='navigate'}={}){
 const listeners={},entries=new Map(critical.filter(p=>!missing.includes(p)).map(p=>[new URL(p,base).href,new Response(p,{status:200})]));
 let storageWrites=0;const cache={match:async key=>entries.get(typeof key==='string'?key:key.url),put:()=>{storageWrites++;throw Error('Offline fallback must not write');}};
 const sandbox={URL,Request,Response,Promise,self:{location:{origin:new URL(base).origin,href:base+'service-worker.js'},addEventListener:(t,f)=>listeners[t]=f},caches:{open:async()=>cache,delete:()=>{throw Error('Never clear a partial cache');}},fetch:async()=>{throw Error('Synthetic unavailable origin');}};
 vm.runInNewContext(source,sandbox);let response;
 listeners.fetch({request:{method:'GET',url:new URL(path,base).href,mode,headers:{has:()=>false}},respondWith:p=>response=p,waitUntil(){throw Error('No offline writes');}});
 const result=await response;assert.equal(storageWrites,0);return result;
}
for(const path of ['/?from=installed','/index.html?v=old']){
 assert.equal(await (await fallback(path)).text(),'./index.html');
 for(const missing of critical){const result=await fallback(path,{missing:[missing]});assert.equal(result.status,503,'Hold root when missing '+missing);const html=await result.text();assert.doesNotMatch(html,/<script|http-equiv|<iframe/i);assert.match(result.headers.get('Content-Security-Policy'),/script-src 'none'/);assert.match(html,/legacy=1/);assert.match(html,/Reload launch page/);}
}
for(const missing of critical.slice(4)){assert.equal((await fallback('/measurement-card.html?legacy=1',{missing:[missing]})).status,503);}
assert.equal(await (await fallback('/measurement-card.html?legacy=1',{missing:critical.slice(0,4)})).text(),'./measurement-card.html','Explicit legacy escape needs legacy core only, never pretends controlled handoff');
const unknown=await fallback('/nested/unknown-route');assert.equal(unknown.status,503,'Never serve a cached calculator under another route');assert.match(await unknown.text(),/href="https:\/\/fixture\.invalid\/"/,'Recovery reload anchors remain root-bound on nested paths');
assert.equal((await fallback('/launch.js?v='+version,{missing:['./launch.js?v='+version],mode:'cors'})).status,503);
assert.equal(await fallback('/pre-alpha/'),undefined);assert.equal(await fallback('/dev/measurement-card.html'),undefined);
console.log('PASS root partial-cache: each missing critical entry holds with script-free 503 and explicit recovery, complete route-specific pages preserved, non-navigation miss stays an asset failure, child ownership and storage untouched.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {MessageChannel} from 'node:worker_threads';
const source=readFileSync(new URL('../launch.js',import.meta.url),'utf8'),VERSION='launch-pre-alpha26-2',APP='pre-alpha26';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({unsupported=false,throwNavigation=false}={}){
 const events={},controls=new Map(),requests=[],failures=[],deadlines=new Set();let stopped=0;
 for(const id of ['launch-status','launch-retry','launch-stay','launch-reload','legacy-fallback'])controls.set(id,{disabled:false,textContent:'',events:{},addEventListener(type,fn){this.events[type]=fn;}});
 const worker=(scriptURL,value)=>({state:'activated',scriptURL,postMessage(message,ports){ports[0].postMessage(value);ports[0].close();}}),root=worker('https://fixture.invalid/service-worker.js',{version:VERSION}),child=worker('https://fixture.invalid/pre-alpha/service-worker.js?v='+APP,{build:APP});
 const sw={controller:root,getRegistration:async url=>url.includes('/pre-alpha/')?{scope:'https://fixture.invalid/pre-alpha/',active:child}:{scope:'https://fixture.invalid/',active:root}};
 const sandbox={URL,MessageChannel,console:{error:(...args)=>failures.push(args)},navigator:unsupported?{}:{serviceWorker:sw},matchMedia:()=>({matches:false}),location:{href:'https://fixture.invalid/',replace:href=>{requests.push(href);if(throwNavigation)throw Error('Synthetic navigation rejected');}},document:{currentScript:{src:'https://fixture.invalid/launch.js'},getElementById:id=>controls.get(id)},window:{stop:()=>stopped++,addEventListener:(name,fn)=>events[name]=fn},setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms);if(ms===20000)deadlines.add(id);return id;},clearTimeout:id=>{deadlines.delete(id);clearTimeout(id);}};
 for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(sandbox,name,{get(){throw Error('No job access');}});
 vm.runInNewContext(source,sandbox);
 const click=id=>controls.get(id).events.click({preventDefault(){}}),ready=async()=>{for(let n=0;n<100&&!requests.length&&!failures.length;n++)await tick();};
 await ready();return {events,controls,requests,failures,click,get stopped(){return stopped;},cleanup:()=>{events.pagehide();for(const id of deadlines)clearTimeout(id);}};
}
{
 const h=await fixture();assert.equal(h.requests.length,1);assert.equal(h.controls.get('launch-retry').disabled,true);await h.click('launch-retry');assert.equal(h.requests.length,1,'Duplicate pending navigation ignored');
 h.click('launch-stay');assert.equal(h.stopped,1);assert.equal(h.controls.get('launch-retry').disabled,false);await h.click('launch-retry');assert.equal(h.requests.length,2);
 h.events.pagehide();await h.click('launch-retry');assert.equal(h.requests.length,2,'No new work after actual departure');h.events.pageshow({persisted:true});assert.equal(h.controls.get('launch-retry').disabled,false);assert.equal(h.requests.length,2,'Restore does not auto-navigate');await h.click('launch-retry');assert.equal(h.requests.length,3);assert.deepEqual(h.failures,[]);h.cleanup();
}
{
 const h=await fixture({throwNavigation:true});assert.equal(h.controls.get('launch-retry').disabled,false);assert.match(h.controls.get('launch-status').textContent,/saved jobs have not been changed/);assert.match(h.failures[0][1].message,/Synthetic navigation rejected/);await h.click('launch-retry');assert.equal(h.requests.length,2,'Rejected navigation does not lock retry');h.cleanup();
}
{
 const h=await fixture({unsupported:true});assert.equal(h.requests.length,0);assert.equal(h.controls.get('launch-retry').disabled,false);h.click('legacy-fallback');assert.equal(h.requests[0],'https://fixture.invalid/measurement-card.html?legacy=1&v=3.0.0-livefix21#bco');h.click('launch-reload');assert.equal(h.stopped,1);assert.equal(h.requests[1],'https://fixture.invalid/');h.cleanup();
}
console.log('PASS actual DOM owner: pending navigation deduplication, retained-page stop/retry, pagehide/persisted restore, rejected navigation recovery and unsupported-browser explicit legacy/reload; no storage access.');

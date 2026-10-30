import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {boundedCleanup,cleanupLaunch,cleanupExports,observeChildClose,CLEANUP_TIMEOUT_MS} from './runner-cleanup.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve)),deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function options(){const failures=[],timers=new Map();return {failures,timers,report:value=>failures.push(value),setTimer:(callback,ms)=>{assert.equal(ms,5000);const id={};timers.set(id,callback);return id;},clearTimer:id=>timers.delete(id),fire(){assert.ok(timers.size);const [id,callback]=timers.entries().next().value;timers.delete(id);callback();}};}
assert.equal(CLEANUP_TIMEOUT_MS,5000);
{
 const o=options(),gate=deferred();let done=false;const p=boundedCleanup('context',()=>gate.promise,o).then(()=>done=true);await tick();assert.equal(done,false);gate.resolve();await p;assert.equal(done,true);assert.equal(o.timers.size,0);assert.deepEqual(o.failures,[]);
}
{
 const o=options(),gate=deferred();const p=boundedCleanup('context',()=>gate.promise,o);o.fire();await p;assert.equal(o.failures[0].phase,'timeout');const error=Error('Late original close rejection');gate.reject(error);await tick();assert.equal(o.failures[1].phase,'late-rejection');assert.equal(o.failures[1].error,error);
}
{
 const o=options(),error=Error('Original context rejection'),calls=[];let checked=0;
 await cleanupLaunch({close:()=>Promise.reject(error)},{close:callback=>{calls.push('close');callback();},closeAllConnections:()=>calls.push('connections')},{...o,checkLateErrors:()=>checked++});assert.deepEqual(calls,['close','connections']);assert.equal(checked,1);assert.equal(o.failures[0].error,error);
}
{
 const o=options(),gate=deferred(),calls=[];let checked=0;const p=cleanupLaunch({close:()=>gate.promise},{close:callback=>{calls.push('close');callback();},closeAllConnections:()=>calls.push('connections')},{...o,checkLateErrors:()=>checked++});o.fire();await p;assert.deepEqual(calls,['close','connections']);assert.equal(checked,1);assert.equal(o.failures[0].phase,'timeout');gate.reject(Error('Late close'));await tick();assert.equal(o.failures[1].phase,'late-rejection');
}
{
 const o=options(),closeError=Error('Server close failure'),connectionError=Error('Connection close failure');let lateChecked=false;const primary=Error('Primary launch failure');let caught;
 try{try{throw primary;}finally{await cleanupLaunch({close:async()=>{throw Error('Context close failure');}},{close:callback=>callback(closeError),closeAllConnections:()=>{throw connectionError;}},{...o,checkLateErrors:()=>{lateChecked=true;}});}}catch(e){caught=e;}
 assert.equal(caught,primary);assert.equal(lateChecked,true);assert.equal(o.failures.length,3);assert.ok(o.failures.some(f=>f.error===closeError));assert.ok(o.failures.some(f=>f.error===connectionError));
}
{
 const o=options();let callback,checked=false;const p=cleanupLaunch(null,{close:fn=>{callback=fn;},closeAllConnections(){}},{...o,checkLateErrors:()=>checked=true});await tick();o.fire();await p;assert.equal(checked,true);assert.ok(o.failures.some(f=>f.owner==='http-server'&&f.phase==='timeout'));callback(Error('Late server error'));await tick();assert.equal(o.failures.at(-1).phase,'late-rejection');
}
{
 const o=options(),error=Error('Synchronous server close failure');let connections=0,checked=0;
 await cleanupLaunch(null,{close(){throw error;},closeAllConnections(){connections++;}},{...o,checkLateErrors:()=>checked++});assert.equal(connections,1);assert.equal(checked,1);assert.equal(o.failures[0].error,error);
}
class Child extends EventEmitter{
 constructor(){super();this.exitCode=null;this.signalCode=null;this.killed=false;this.kills=0;}
 kill(signal){this.kills++;assert.equal(signal,'SIGTERM');assert.equal(this.listenerCount('close'),1,'Close subscription precedes signal');this.killed=true;return true;}
 close(code,signal=null){this.exitCode=code;this.signalCode=signal;this.emit('close',code,signal);}
}
{
 const c=new Child(),tracker=observeChildClose(c),o=options();let done=false;const p=cleanupExports(null,tracker,o).then(()=>done=true);await tick();assert.equal(c.kills,1);assert.equal(done,false);c.close(null,'SIGTERM');await p;assert.equal(done,true);assert.deepEqual(o.failures,[]);
}
{
 const c=new Child(),tracker=observeChildClose(c),o=options();c.close(0);await cleanupExports(null,tracker,o);assert.equal(c.kills,0);assert.deepEqual(o.failures,[]);
}
{
 const c=new Child(),tracker=observeChildClose(c),o=options();c.exitCode=0;let done=false;const p=cleanupExports(null,tracker,o).then(()=>done=true);await tick();assert.equal(done,false,'Exited with pending stdio close is not already closed');assert.equal(c.kills,0);c.close(0);await p;assert.deepEqual(o.failures,[]);
}
{
 const c=new Child();c.kill=function(signal){Child.prototype.kill.call(this,signal);this.close(null,'SIGTERM');return true;};const o=options();await cleanupExports(null,observeChildClose(c),o);assert.equal(c.kills,1);assert.deepEqual(o.failures,[]);
}
for(const mode of ['throw','false','unexpected-close','error-event']){
 const c=new Child(),tracker=observeChildClose(c),o=options(),error=Error('Termination failed');
 if(mode==='throw')c.kill=()=>{throw error;};if(mode==='false')c.kill=()=>false;if(mode==='unexpected-close')c.close(3);if(mode==='error-event'){c.emit('error',error);c.close(-2);}
 await cleanupExports({close:async()=>{}},tracker,o);assert.equal(o.failures.length,1,mode);assert.equal(o.failures[0].owner,'preview-child');if(mode==='throw'||mode==='error-event')assert.equal(o.failures[0].error,error);if(!c.exitCode)c.close(0);
}
{
 const c=new Child(),tracker=observeChildClose(c),o=options();const p=cleanupExports(null,tracker,o);await tick();o.fire();await p;assert.equal(o.failures[0].phase,'timeout');c.close(9);await tick();assert.equal(o.failures[1].phase,'late-rejection');
}
{
 const c=new Child(),tracker=observeChildClose(c),o=options(),primary=Error('Primary export failure'),closeError=Error('Context cleanup failed');c.kill=()=>{throw Error('Termination cleanup failed');};let caught;try{try{throw primary;}finally{await cleanupExports({close:async()=>{throw closeError;}},tracker,o);}}catch(e){caught=e;}assert.equal(caught,primary);assert.equal(o.failures.length,2);assert.equal(o.failures[0].error,closeError);c.close(0);
}
// Immutable normalized c05 source hashes avoid a new shallow-checkout Git dependency.
const frozenHashes={
  "tests/launch-worker-upgrade-ui.mjs": "59507843b46aa25f222cfa37d94f6431acfb4efb40bbf13a0b945ed609d562f4",
  "tests/pre-alpha-exports-ui.mjs": "d23389fb72b85ff2fb398974c8a56fc2c5306bb98a1f395ce4b43e6842f23803",
  "tests/pre-alpha-worker-upgrade-ui.mjs": "6cd691573089c3ab6d766bb646ad311ce787cf28dba0be6f7c231f2af8078a24",
  "tests/release-check.mjs": "fda3e84e64ceddc0d6d4265a7662821168252d2bb327c797172713713fd59cbf",
  "tests/launch-readiness.mjs": "cec306d6eaf97b40cb320c7eb055f4f68d38ae67d6c1708549852fd8d86cbc9a"
};
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n'),sourceHash=text=>createHash('sha256').update(text).digest('hex');
const oldLaunch="finally{await Promise.race([context?.close(),new Promise(resolve=>setTimeout(resolve,5000))]);const closing=new Promise(resolve=>server.close(resolve));server.closeAllConnections();await closing;if(pageErrorCount&&!process.exitCode){process.exitCode=1;console.error('LAUNCH_LATE_PAGE_ERROR','Page errors remain failures, including teardown.');}}";
const launch=read('tests/launch-worker-upgrade-ui.mjs'),launchFinally=launch.slice(launch.lastIndexOf('finally{')).trim();assert.ok(launchFinally.includes('if(pageErrorCount){process.exitCode=1;'),'Late page errors checked even with existing primary failure');assert.equal(sourceHash(launch.replaceAll("document.title==='TapCalc'","document.title==='TapCalc Pre-Alpha 26'").replace("import {cleanupLaunch} from './runner-cleanup.mjs';\n",'').replace(launchFinally,oldLaunch)),frozenHashes['tests/launch-worker-upgrade-ui.mjs']);
const exports=read('tests/pre-alpha-exports-ui.mjs'),exportFinally=exports.slice(exports.lastIndexOf('finally{')).trim();assert.equal(sourceHash(exports.replace("import {cleanupExports,observeChildClose} from './runner-cleanup.mjs';\n",'').replace('const preview=observeChildClose(server);\n','').replace(exportFinally,'finally{await context?.close();server.kill();}')),frozenHashes['tests/pre-alpha-exports-ui.mjs']);
assert.equal(sourceHash(read('tests/pre-alpha-worker-upgrade-ui.mjs').replace("assert.equal(await page.locator('.edition').textContent(),(build===BUILD?'BUILD ':'PRE-ALPHA ')+build.replace('pre-alpha',''));","assert.equal(await page.locator('.edition').textContent(),'PRE-ALPHA '+build.replace('pre-alpha',''));")),frozenHashes['tests/pre-alpha-worker-upgrade-ui.mjs']);assert.equal(sourceHash(read('tests/release-check.mjs').replaceAll('pre-alpha-worksheet-deferred','pre-alpha-worksheet')),frozenHashes['tests/release-check.mjs']);
assert.equal(sourceHash(read('tests/launch-readiness.mjs').replace("\nawait import('./runner-cleanup-test.mjs');\n",'').replace("\nawait import('./root-runtime-cache-lifetime.mjs');\n",'').replace("\nawait import('./pdf-cleanup-ownership.mjs');\n",'').replace("\nawait import('./launch-branding.mjs');\n",'')),frozenHashes['tests/launch-readiness.mjs']);
console.log('PASS owned runner cleanup: all owners attempted, primary errors preserved, timeout fails and late rejections observed, server and late-error checks retained; preview signal/close/error/exit races bounded; exact test bodies and 180s release runner preserved.');

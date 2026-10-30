import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../launch.js',import.meta.url),'utf8');
const core=source.split('// HANDOFF_CORE_BEGIN: exercised directly by deterministic lifecycle regressions.')[1].split('// HANDOFF_CORE_END')[0];
const {createHandoff,PREPARATION_MS}=await import('data:text/javascript,'+encodeURIComponent(core+'\nexport {createHandoff,PREPARATION_MS};'));
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const rootProof=()=>({scope:'https://fixture.invalid/',activeURL:'https://fixture.invalid/service-worker.js?v=legacy-query',controllerURL:'https://fixture.invalid/service-worker.js?v=legacy-query',activeState:'activated',controllerState:'activated',activeVersion:'root-release-2',controllerVersion:'root-release-2',installing:false,waiting:false});
const childProof=()=>({scope:'https://fixture.invalid/pre-alpha/',activeURL:'https://fixture.invalid/pre-alpha/service-worker.js?v=pre-alpha26',activeState:'activated',build:'pre-alpha26',installing:false,waiting:false});
function harness(overrides={}){
 const calls={root:0,child:0,rootObserve:0,childObserve:0,navigation:[],reload:[],stops:0,failures:[],diagnostics:[],states:[]},timers=new Map();let timerId=0;
 const defaults={rootURL:'https://fixture.invalid/',rootVersion:'root-release-2',appBuild:'pre-alpha26',prepareRoot:async()=>{calls.root++;return rootProof();},prepareChild:async()=>{calls.child++;return childProof();},observeRoot:async()=>{calls.rootObserve++;return rootProof();},observeChild:async()=>{calls.childObserve++;return childProof();},navigate:url=>calls.navigation.push(url),reloadEntry:url=>calls.reload.push(url),stopNavigation:()=>calls.stops++,onFailure:error=>calls.failures.push(error),onDiagnostic:row=>calls.diagnostics.push(row),onState:value=>calls.states.push(value),clock:{setTimeout(fn,ms){assert.equal(ms,20000);timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}}};
 return {owner:createHandoff({...defaults,...overrides}),calls,expire(){for(const fn of [...timers.values()])fn();}};
}
const outcomes=[];
{
 const h=harness();assert.deepEqual(await h.owner.start(),{ok:true,destination:'modern',navigationRequested:true,departed:false});assert.equal(h.owner.state,'navigation-requested');assert.equal(h.owner.departed,false);assert.equal(h.calls.navigation[0],'https://fixture.invalid/pre-alpha/?v=pre-alpha26');assert.equal(h.calls.root,1);assert.equal(h.calls.child,1);assert.equal(h.calls.rootObserve,1);assert.equal(h.calls.childObserve,1);await h.owner.start();assert.equal(h.calls.navigation.length,1);outcomes.push('Modern handoff proves root and child; accepted navigation is not actual departure');
}
{
 const h=harness({defaultDestination:'legacy',prepareChild:()=>{throw Error('Legacy must not update/remove child worker');}});assert.equal((await h.owner.start()).ok,true);assert.equal(h.calls.childObserve,0);assert.equal(h.calls.navigation[0],'https://fixture.invalid/measurement-card.html?legacy=1&v=3.0.0-livefix21#bco');outcomes.push('Rollback-mode handoff requires root proof, bypasses installed bridge and preserves child owner');
}
for(const bad of [{activeState:'activating'},{controllerState:'activating'},{activeVersion:'old'},{controllerVersion:'old'},{installing:true},{waiting:true},{scope:'https://fixture.invalid/pre-alpha/'},{controllerURL:'https://other.invalid/service-worker.js'}]){
 const h=harness({prepareRoot:async()=>({...rootProof(),...bad})});assert.equal((await h.owner.start()).ok,false);assert.deepEqual(h.calls.navigation,[]);assert.equal(h.calls.child,0);
}outcomes.push('Pending, stale, wrong-scope, wrong-controller and wrong-version root states held');
for(const bad of [{activeState:'activating'},{build:'old'},{waiting:true},{scope:'https://fixture.invalid/'}]){
 const h=harness({prepareChild:async()=>({...childProof(),...bad})});assert.equal((await h.owner.start()).ok,false);assert.deepEqual(h.calls.navigation,[]);
}outcomes.push('Pending, stale and parent-scope child proofs held');
{
 const h=harness({observeRoot:async()=>({...rootProof(),waiting:true})});assert.equal((await h.owner.start()).ok,false);assert.deepEqual(h.calls.navigation,[]);outcomes.push('Root change during child preparation is caught by final reobservation');
}
{
 const pending=defer(),h=harness({prepareRoot:()=>pending.promise}),first=h.owner.start();assert.equal(h.owner.start(),first);assert.equal((await h.owner.start('legacy')).ok,false);pending.resolve(rootProof());await first;assert.equal(h.calls.navigation.length,1);outcomes.push('Repeated clicks coalesce; conflicting destination cannot retarget an active attempt');
}
{
 const pending=defer(),h=harness({prepareRoot:()=>pending.promise}),first=h.owner.start();h.expire();assert.equal((await first).reason,'deadline');assert.equal(h.owner.busy,false);pending.resolve(rootProof());await tick();assert.equal(h.calls.child,0);assert.deepEqual(h.calls.navigation,[]);assert.equal(h.calls.failures.length,1);outcomes.push('Whole preparation deadline restores idle control; late native settlement cannot navigate');
}
{
 const pending=defer(),h=harness({prepareRoot:()=>pending.promise}),first=h.owner.start(),original=Error('Original late native rejection');h.expire();await first;pending.reject(original);await tick();assert.equal(h.calls.diagnostics.length,1);assert.equal(h.calls.diagnostics[0].error,original);outcomes.push('Late rejection remains observed and reported, without a second navigation');
}
{
 const pending=defer(),h=harness({prepareRoot:()=>pending.promise}),first=h.owner.start();h.owner.pagehide();assert.equal((await first).reason,'interrupted');assert.equal(h.owner.departed,true);assert.equal(h.owner.state,'departed');assert.equal(h.owner.restore(),true);pending.resolve(rootProof());await tick();assert.equal(h.owner.state,'suspended');assert.equal(h.owner.departed,false);assert.equal(h.calls.navigation.length,0);assert.equal(h.calls.rootObserve,0);outcomes.push('Actual pagehide invalidates attempt; persisted restoration does not auto-start a loop');
}
{
 const pending=defer(),h=harness({prepareRoot:()=>pending.promise}),first=h.owner.start();assert.equal(h.owner.directLegacy(),true);assert.equal(h.owner.directLegacy(),false);await first;pending.resolve(rootProof());await tick();assert.equal(h.calls.navigation.length,1);assert.ok(h.calls.navigation[0].includes('legacy=1'));outcomes.push('Explicit emergency bypass cancels late forward handoff; once only');
}
{
 const h=harness({prepareRoot:async()=>{throw Error('Actual native failure');}});assert.equal((await h.owner.start()).ok,false);assert.equal(h.owner.reload(),true);assert.equal(h.owner.reload(),false);assert.deepEqual(h.calls.reload,['https://fixture.invalid/']);assert.deepEqual(h.calls.navigation,[]);outcomes.push('Explicit entry-only reload permits a fresh context without automatic reload/retry');
}
{
 const h=harness();assert.equal((await h.owner.start('https://other.invalid')).ok,false);assert.deepEqual(h.calls.navigation,[]);outcomes.push('Fixed same-origin destination allowlist; no arbitrary return URL');
}
{
 let throws=true;const original=Error('Synchronous location replacement failure');let h;
 h=harness({navigate:url=>{if(throws)throw original;h.calls.navigation.push(url);}});
 assert.equal((await h.owner.start()).reason,'navigation failed');assert.equal(h.owner.departed,false);assert.equal(h.owner.pendingNavigation,null);assert.equal(h.owner.busy,false);assert.equal(h.calls.failures[0],original);
 throws=false;assert.equal((await h.owner.start('legacy')).navigationRequested,true);assert.equal(h.calls.navigation.length,1);assert.equal(h.owner.departed,false);outcomes.push('Thrown navigation restores retry and alternate destination without a permanent finished flag');
}
{
 const h=harness();await h.owner.start();h.expire();await tick();assert.equal(h.owner.state,'navigation-requested');assert.equal(h.owner.departed,false);assert.equal(h.calls.root,1);assert.equal(h.owner.restore(),false);
 assert.equal(h.owner.recoverRetained(),true);assert.equal(h.calls.stops,1);assert.equal(h.owner.pendingNavigation,null);assert.equal(h.owner.state,'held');assert.equal(h.calls.navigation.length,1);
 assert.equal((await h.owner.start('legacy')).ok,true);assert.equal(h.calls.root,2);assert.equal(h.calls.navigation.length,2);outcomes.push('Cancelled or retained navigation recovers only by explicit stop/recovery, never timer-as-proof');
}
{
 const original=Error('Entry reload rejected'),h=harness({reloadEntry:()=>{throw original;}});assert.equal(h.owner.reload(),false);assert.equal(h.owner.departed,false);assert.equal(h.owner.busy,false);assert.equal(h.calls.failures[0],original);assert.equal(h.owner.directLegacy(),true);outcomes.push('Thrown entry reload leaves direct legacy escape available');
}
{
 const original=Error('Legacy navigation rejected'),h=harness({navigate:()=>{throw original;}});assert.equal(h.owner.directLegacy(),false);assert.equal(h.owner.departed,false);assert.equal(h.owner.pendingNavigation,null);assert.equal(h.calls.failures[0],original);assert.equal(h.owner.reload(),true);outcomes.push('Thrown legacy escape leaves entry reload available');
}
{
 const h=harness();await h.owner.start();assert.equal(h.owner.reload(),true);assert.equal(h.calls.stops,1);assert.equal(h.calls.reload.length,1);assert.equal(h.owner.departed,false);assert.equal(h.owner.pendingNavigation.kind,'reload');assert.equal(h.owner.recoverRetained(),true);assert.equal(h.owner.directLegacy(),true);outcomes.push('Explicit reload and escape can supersede a retained request without claiming departure');
}
{
 const later=defer();let prepares=0;const h=harness({prepareRoot:async()=>++prepares===1?rootProof():later.promise});await h.owner.start();h.owner.recoverRetained();const next=h.owner.start();h.owner.pagehide();assert.equal((await next).reason,'interrupted');later.resolve(rootProof());await tick();assert.equal(h.owner.departed,true);assert.equal(h.calls.navigation.length,1);assert.equal(h.owner.recoverRetained(),false);assert.equal(h.owner.reload(),false);outcomes.push('Late pagehide after retained-page recovery cancels the newer preparation safely');
}
{
 let h;h=harness({navigate:url=>{h.calls.navigation.push(url);h.owner.pagehide();}});const result=await h.owner.start();assert.equal(result.navigationRequested,true);assert.equal(result.departed,true);assert.equal(h.owner.departed,true);assert.equal(h.owner.state,'departed');assert.equal(h.calls.navigation.length,1);outcomes.push('Synchronous actual pagehide is the departure signal, not navigate return');
}
{
 let rejectStop=true;const original=Error('Stop request failed'),h=harness({stopNavigation:()=>{if(rejectStop)throw original;}});await h.owner.start();assert.equal(h.owner.recoverRetained(),false);assert.equal(h.calls.failures[0],original);assert.equal(h.owner.departed,false);assert.ok(h.owner.pendingNavigation);rejectStop=false;assert.equal(h.owner.recoverRetained(),true);assert.equal(h.owner.busy,false);outcomes.push('Recovery stop failure remains visible and does not fabricate cancellation or lock later recovery');
}
{
 let h;h=harness({stopNavigation:()=>h.owner.pagehide()});await h.owner.start();assert.equal(h.owner.reload(),false);assert.equal(h.calls.reload.length,0);assert.equal(h.owner.state,'departed');
 let second;second=harness({stopNavigation:()=>second.owner.pagehide()});await second.owner.start();assert.equal(second.owner.recoverRetained(),false);assert.equal(second.owner.state,'departed');outcomes.push('Actual pagehide during explicit stop cannot be overwritten by recovery or a new request');
}
{
 let h;const original=Error('Navigation threw after pagehide');h=harness({navigate:()=>{h.owner.pagehide();throw original;}});assert.equal((await h.owner.start()).ok,false);assert.equal(h.owner.departed,true);assert.equal(h.calls.failures[0],original);outcomes.push('Navigation rejection remains reported even if pagehide was observed');
}
{
 const original=Error('Stop threw after pagehide');let h;h=harness({stopNavigation:()=>{h.owner.pagehide();throw original;}});await h.owner.start();assert.equal(h.owner.reload(),false);assert.equal(h.owner.state,'departed');assert.equal(h.calls.failures[0],original);
 let second;second=harness({stopNavigation:()=>{second.owner.pagehide();throw original;}});await second.owner.start();assert.equal(second.owner.recoverRetained(),false);assert.equal(second.owner.state,'departed');assert.equal(second.calls.failures[0],original);outcomes.push('Stop rejection after pagehide is reported without overwriting actual departure');
}
// Real browser timers reject an unrelated receiver; injected clocks previously masked this integration error.
{
 let timers=0,cleared=0;
 const environment={URL,setTimeout:function(){assert.equal(this,undefined,'Native timer called without unrelated receiver');timers++;return 1;},clearTimeout:function(){assert.equal(this,undefined);cleared++;}};
 const make=text=>vm.runInNewContext(text+';createHandoff;',{...environment});
 const options={rootURL:'https://fixture.invalid/',rootVersion:'root-release-2',appBuild:'pre-alpha26',prepareRoot:async()=>rootProof(),prepareChild:async()=>childProof(),observeRoot:async()=>rootProof(),observeChild:async()=>childProof(),navigate:()=>{}};
 const actual=make(core)(options);assert.equal((await actual.start()).ok,true);assert.equal(timers,1);assert.ok(cleared>=1);
 const prior=make(core.replace('clock={setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)}','clock={setTimeout,clearTimeout}'))(options);assert.throws(()=>prior.start(),/Native timer called without unrelated receiver/);
 outcomes.push('Native timer receiver integration: bad unbound-clock ownership fails, production wrappers pass');
}
assert.doesNotMatch(core,/localStorage|indexedDB|sessionStorage|fetch\(|unregister\(|caches\./);assert.equal(PREPARATION_MS,20000);
console.log('PASS production handoff core: '+outcomes.length+' lifecycle scenario groups; exact root/child proofs, bounded ownership, pagehide and explicit retained-page recovery.');

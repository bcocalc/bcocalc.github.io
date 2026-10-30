// Controlled launch owner only. Never reads or writes jobs or browser storage.
(function(){
 'use strict';
 const APP='pre-alpha26',VERSION='launch-'+APP+'-2',DESTINATION='modern',script=document.currentScript,root=new URL('./',script?.src||location.href),url=new URL(location.href),legacy=new URL('./measurement-card.html',root);
 const standalone=navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
 if(url.pathname===legacy.pathname){
  if(url.searchParams.get('legacy')==='1'||!standalone)return;
  window.stop();location.replace(new URL('./?from=installed',root).href);return;
 }
 // HANDOFF_CORE_BEGIN: exercised directly by deterministic lifecycle regressions.
 const PREPARATION_MS=20000;
 function createHandoff({rootURL,rootVersion,appBuild,defaultDestination='modern',prepareRoot,prepareChild,observeRoot,observeChild,navigate,reloadEntry,stopNavigation=()=>{},onState=()=>{},onFailure=()=>{},onDiagnostic=()=>{},clock={setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)}}){
 const root=new URL(rootURL),rootScript=new URL('service-worker.js',root),childScope=new URL('pre-alpha/',root),childScript=new URL('service-worker.js',childScope),destinations={modern:new URL('pre-alpha/?v='+appBuild,root).href,legacy:new URL('measurement-card.html?legacy=1&v=3.0.0-livefix21#bco',root).href};
 if(!['modern','legacy'].includes(defaultDestination))throw Error('Unknown release destination');
 let active=null,departed=false,pendingNavigation=null,generation=0,state='idle';const say=value=>{state=value;onState(value);};
 const fail=message=>{throw Error(message);};
 const samePath=(value,expected)=>{try{const url=new URL(value);return url.origin===expected.origin&&url.pathname===expected.pathname;}catch{return false;}};
 function rootReady(p){
  if(!p||p.scope!==root.href||p.installing||p.waiting||p.activeState!=='activated'||p.controllerState!=='activated'||p.activeVersion!==rootVersion||p.controllerVersion!==rootVersion||p.activeURL!==p.controllerURL||!samePath(p.activeURL,rootScript))fail('Exact activated root registration and controller proof required');
 }
 function childReady(p){
  if(!p||p.scope!==childScope.href||p.installing||p.waiting||p.activeState!=='activated'||p.build!==appBuild||!samePath(p.activeURL,childScript))fail('Exact activated child proof required');
 }
 function abandon(reason){const token=active;if(token){token.cancel(reason);clock.clearTimeout(token.timer);active=null;}generation++;}
 function requestNavigation(kind,url,callback){
  if(departed)return {accepted:false,reason:'page departed'};
  if(pendingNavigation?.kind===kind)return {accepted:false,reason:'navigation already requested'};
  // Superseding a retained-page request is an explicit user action, never a timer.
  if(pendingNavigation)try{stopNavigation();}catch(error){if(!departed)say('failed');onFailure(error);return {accepted:false,reason:'stop failed'};}
  if(departed)return {accepted:false,reason:'page departed during stop'};
  abandon('navigation requested');
  const request={id:generation,kind,url};pendingNavigation=request;say('navigation-requested');
  try{callback(url);return {accepted:true,departed};}
  catch(error){if(!departed&&pendingNavigation===request){pendingNavigation=null;say('failed');}onFailure(error);return {accepted:false,reason:'navigation failed'};}
 }
 function start(destination=defaultDestination){
  if(!Object.hasOwn(destinations,destination))return Promise.resolve({ok:false,reason:'invalid destination'});
  if(departed)return Promise.resolve({ok:false,reason:'page departed'});
  if(pendingNavigation)return Promise.resolve({ok:false,reason:'recover retained page explicitly before another attempt'});
  if(active)return active.destination===destination?active.promise:Promise.resolve({ok:false,reason:'busy with another explicit destination'});
  const token={id:++generation,destination,cancelled:false};active=token;say('preparing');
  let abort;const cancelled=new Promise((_,reject)=>{abort=reject;});
  token.cancel=kind=>{if(token.cancelled)return;token.cancelled=true;abort(Object.assign(Error(kind),{handoffCancellation:kind}));};
  const check=()=>{if(active!==token||token.cancelled||departed)throw Object.assign(Error('Attempt no longer active'),{handoffCancellation:'stale'});};
  token.timer=clock.setTimeout(()=>token.cancel('deadline'),PREPARATION_MS);
  const work=(async()=>{
   const rootProof=await prepareRoot({check});check();rootReady(rootProof);
   if(destination==='modern'){const childProof=await prepareChild({check});check();childReady(childProof);}
   const rootNow=await observeRoot();check();rootReady(rootNow);
   if(destination==='modern'){const childNow=await observeChild();check();childReady(childNow);}
   check();return true;
  })().catch(error=>{if(token.cancelled&&!error.handoffCancellation)onDiagnostic({phase:'late preparation rejection',error});throw error;});
  token.promise=(async()=>{
   try{
    await Promise.race([work,cancelled]);check();
    const result=requestNavigation(destination,destinations[destination],navigate);
    return result.accepted?{ok:true,destination,navigationRequested:true,departed:result.departed}:{ok:false,reason:result.reason};
   }catch(error){
    if(active===token&&!departed){say('failed');if(!error.handoffCancellation||error.handoffCancellation==='deadline')onFailure(error);}
    return {ok:false,reason:error.handoffCancellation??'preparation failure'};
   }finally{clock.clearTimeout(token.timer);if(active===token)active=null;}
  })();return token.promise;
 }
 // Only actual pagehide finalizes departure. beforeunload or elapsed time does not.
 function pagehide(){if(departed)return;departed=true;pendingNavigation=null;abandon('interrupted');say('departed');}
 function restore(){if(!departed)return false;abandon('persisted restore');departed=false;pendingNavigation=null;say('suspended');return true;}
 function recoverRetained(){
  if(departed)return false;
  if(pendingNavigation)try{stopNavigation();}catch(error){if(!departed)say('failed');onFailure(error);return false;}
  if(departed)return false;
  abandon('explicit retained-page recovery');pendingNavigation=null;say('held');return true;
 }
 const directLegacy=()=>requestNavigation('legacy',destinations.legacy,navigate).accepted;
 const reload=()=>requestNavigation('reload',root.href,reloadEntry).accepted;
 return {start,pagehide,suspend:pagehide,restore,recoverRetained,directLegacy,reload,get state(){return state;},get busy(){return !!active||!!pendingNavigation;},get departed(){return departed;},get pendingNavigation(){return pendingNavigation?{...pendingNavigation}:null;},get generation(){return generation;}};
}

 // HANDOFF_CORE_END
 const target=new URL('./pre-alpha/?v='+APP,root),childScope=new URL('./pre-alpha/',root),status=document.getElementById('launch-status'),retry=document.getElementById('launch-retry');
 const say=text=>{if(status)status.textContent=text;};
 const ask=(worker,type,key)=>new Promise(resolve=>{
  if(!worker||worker.state!=='activated'){resolve(null);return;}
  const channel=new MessageChannel();let settled=false;
  const done=value=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();channel.port2.close();resolve(value);};
  const timer=setTimeout(()=>done(null),350);channel.port1.onmessage=event=>done(event.data?.[key]??null);
  try{worker.postMessage({type},[channel.port2]);}catch{done(null);}
 });
 const rootReady=async reg=>reg?.scope===root.href&&!reg?.installing&&!reg?.waiting&&reg.active?.state==='activated'&&navigator.serviceWorker.controller?.state==='activated'&&reg.active.scriptURL===navigator.serviceWorker.controller.scriptURL&&(await ask(reg.active,'tapcalc-launch-version','version'))===VERSION&&(await ask(navigator.serviceWorker.controller,'tapcalc-launch-version','version'))===VERSION;
 const modernReady=async reg=>reg?.scope===childScope.href&&!reg?.installing&&!reg?.waiting&&reg.active?.state==='activated'&&(await ask(reg.active,'tapcalc-pre-alpha-version','build'))===APP;
 async function rootProof(reg){
  if(!await rootReady(reg))return null;
  return {scope:reg.scope,installing:!!reg.installing,waiting:!!reg.waiting,activeState:reg.active?.state,controllerState:navigator.serviceWorker.controller?.state,activeURL:reg.active?.scriptURL,controllerURL:navigator.serviceWorker.controller?.scriptURL,activeVersion:VERSION,controllerVersion:VERSION};
 }
 async function childProof(reg){
  if(!await modernReady(reg))return null;
  return {scope:reg.scope,installing:!!reg.installing,waiting:!!reg.waiting,activeState:reg.active?.state,activeURL:reg.active?.scriptURL,build:APP};
 }
 async function waitReady(reg,observe,check){
  while(true){check();const proof=await observe(reg);check();if(proof)return proof;await new Promise(resolve=>setTimeout(resolve,100));}
 }
 async function prepareRoot({check}){
  if(!('serviceWorker' in navigator))throw Error('This browser cannot verify an installed worker.');
  let reg=await navigator.serviceWorker.getRegistration(root.href);check();
  const proof=await rootProof(reg);check();if(proof)return proof;
  if(reg?.scope===root.href)await reg.update();
  else reg=await navigator.serviceWorker.register(new URL('./service-worker.js?v='+VERSION,root).href,{scope:root.pathname,updateViaCache:'none'});
  check();return waitReady(reg,rootProof,check);
 }
 async function prepareChild({check}){
  let reg=await navigator.serviceWorker.getRegistration(target.href);check();
  const proof=await childProof(reg);check();if(proof)return proof;
  // Preserve a matching existing child owner; replace only a stale script identity.
  const expected=new URL('./service-worker.js?v='+APP,childScope).href;
  if(reg?.scope===childScope.href&&reg.active?.scriptURL===expected)await reg.update();
  else reg=await navigator.serviceWorker.register(expected,{scope:childScope.pathname,updateViaCache:'none'});
  check();return waitReady(reg,childProof,check);
 }
 const messages={preparing:'Preparing your workspace...', 'navigation-requested':'Opening the calculator. If this page remains open, choose Stay on this page before retrying.',failed:'The workspace could not finish loading. Your saved jobs have not been changed. Retry online, reload this page, or open the legacy calculator directly.',held:'Staying on this page. Retry preparation when ready.',suspended:'The launch page was restored. Choose Retry preparation to continue.'};
 const owner=createHandoff({rootURL:root.href,rootVersion:VERSION,appBuild:APP,defaultDestination:DESTINATION,prepareRoot,prepareChild,observeRoot:async()=>rootProof(await navigator.serviceWorker.getRegistration(root.href)),observeChild:async()=>childProof(await navigator.serviceWorker.getRegistration(target.href)),navigate:href=>location.replace(href),reloadEntry:href=>location.replace(href),stopNavigation:()=>window.stop(),onState:state=>{if(retry)retry.disabled=state==='preparing'||state==='navigation-requested';if(messages[state])say(messages[state]);},onFailure:error=>console.error('TapCalc launch preparation failed',error),onDiagnostic:row=>console.error('TapCalc late launch preparation failure',row.error)});
 retry?.addEventListener('click',()=>owner.start());
 document.getElementById('launch-stay')?.addEventListener('click',()=>owner.recoverRetained());
 document.getElementById('launch-reload')?.addEventListener('click',event=>{event.preventDefault();owner.reload();});
 document.getElementById('legacy-fallback')?.addEventListener('click',event=>{event.preventDefault();owner.directLegacy();});
 window.addEventListener('pagehide',()=>owner.pagehide());
 window.addEventListener('pageshow',event=>{if(event.persisted)owner.restore();});
 owner.start();
})();

// Launch routing only. Never reads or writes jobs or browser storage.
(function(){
 'use strict';
 const APP='pre-alpha26',VERSION='launch-'+APP+'-1',script=document.currentScript,root=new URL('./',script?.src||location.href),url=new URL(location.href),legacy=new URL('./measurement-card.html',root);
 const standalone=navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
 if(url.pathname===legacy.pathname){
  if(url.searchParams.get('legacy')==='1'||!standalone)return;
  window.stop();location.replace(new URL('./?from=installed',root).href);return;
 }
 const target=new URL('./pre-alpha/?v='+APP,root),status=document.getElementById('launch-status'),retry=document.getElementById('launch-retry');
 let busy=false;
 const say=text=>{if(status)status.textContent=text;};
 const ask=(worker,type,key)=>new Promise(resolve=>{
  if(!worker||worker.state!=='activated'){resolve(null);return;}
  const channel=new MessageChannel();let settled=false;
  const done=value=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();resolve(value);};
  const timer=setTimeout(()=>done(null),350);channel.port1.onmessage=event=>done(event.data?.[key]??null);
  try{worker.postMessage({type},[channel.port2]);}catch{done(null);}
 });
 const rootReady=async reg=>(await ask(reg?.active,'tapcalc-launch-version','version'))===VERSION&&(await ask(navigator.serviceWorker.controller,'tapcalc-launch-version','version'))===VERSION;
 const modernReady=async reg=>(await ask(reg?.active,'tapcalc-pre-alpha-version','build'))===APP;
 async function waitReady(reg,ready,check){
  const end=Date.now()+20000;
  while(Date.now()<end){check();const prepared=await ready(reg);check();if(prepared)return;await new Promise(resolve=>setTimeout(resolve,100));}
  throw Error('The workspace did not finish preparing.');
 }
 async function prepare(check){
  if(!('serviceWorker' in navigator))return;
  let registration=await navigator.serviceWorker.getRegistration(root.href);check();
  const rootPrepared=await rootReady(registration);check();
  if(!rootPrepared){
   if(registration?.scope===root.href)await registration.update();
   else registration=await navigator.serviceWorker.register(new URL('./service-worker.js?v='+VERSION,root).href,{scope:root.pathname,updateViaCache:'none'});
   check();await waitReady(registration,rootReady,check);
  }
  let modern=await navigator.serviceWorker.getRegistration(target.href);check();
  const modernPrepared=await modernReady(modern);check();
  if(!modernPrepared){
   modern=await navigator.serviceWorker.register(new URL('./pre-alpha/service-worker.js?v='+APP,root).href,{scope:new URL('./pre-alpha/',root).pathname,updateViaCache:'none'});
   check();await waitReady(modern,modernReady,check);
  }
 }
 async function start(){
  if(busy)return;busy=true;if(retry)retry.disabled=true;say('Preparing your workspace...');
  let active=true,timer;
  const check=()=>{if(!active)throw Error('Preparation is no longer active.');};
  try{
   const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{active=false;reject(Error('The workspace did not finish preparing.'));},20000);});
   await Promise.race([prepare(check),deadline]);check();
   say('Opening your workspace...');location.replace(target.href);
  }catch{say('The workspace could not finish loading. Your saved jobs have not been changed. Retry online or use the legacy calculator.');}
  finally{active=false;clearTimeout(timer);busy=false;if(retry)retry.disabled=false;}
 }
 retry?.addEventListener('click',start);start();
})();
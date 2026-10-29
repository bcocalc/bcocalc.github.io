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
 async function waitReady(reg,ready){
  const end=Date.now()+20000;
  while(Date.now()<end){if(await ready(reg))return;await new Promise(resolve=>setTimeout(resolve,100));}
  throw Error('The workspace did not finish preparing.');
 }
 async function start(){
  if(busy)return;busy=true;if(retry)retry.disabled=true;say('Preparing your workspace...');
  try{
   if('serviceWorker' in navigator){
    let registration=await navigator.serviceWorker.getRegistration(root.href);
    if(!await rootReady(registration)){
     if(registration?.scope===root.href)await registration.update();
     else registration=await navigator.serviceWorker.register(new URL('./service-worker.js?v='+VERSION,root).href,{scope:root.pathname,updateViaCache:'none'});
     await waitReady(registration,rootReady);
    }
    let modern=await navigator.serviceWorker.getRegistration(target.href);
    if(!await modernReady(modern)){modern=await navigator.serviceWorker.register(new URL('./pre-alpha/service-worker.js?v='+APP,root).href,{scope:new URL('./pre-alpha/',root).pathname,updateViaCache:'none'});await waitReady(modern,modernReady);}
   }
   say('Opening your workspace...');location.replace(target.href);
  }catch{say('The workspace could not finish loading. Your saved jobs have not been changed. Retry online or use the legacy calculator.');}
  finally{busy=false;if(retry)retry.disabled=false;}
 }
 retry?.addEventListener('click',start);start();
})();
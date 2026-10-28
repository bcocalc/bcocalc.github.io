import {createModernTransport,createProductionTransport} from './modern-transport.mjs?v=pre-alpha25';
import {createModernSaver} from './modern-saver.mjs?v=pre-alpha25';
import {MODERN_DESTINATION,PRODUCTION_MODERN_BINDING} from './modern-sharing-config.mjs?v=pre-alpha25';
import {destinationKey,canonicalJson,workingCopyOf,verifyEnvelope} from './modern-envelope.mjs?v=pre-alpha25';
import {modernSnapshotMarkup,legacySnapshotMarkup} from './modern-view.mjs?v=pre-alpha25';
import {escape} from './presentation.mjs?v=pre-alpha25';

export function installModernSharing(document,{binding=null,publicApiKey=null,store,getDraft,makeWorkingCopy,notify,canShare=()=>true,onSharedChange=async()=>{},location=globalThis.location,navigator=globalThis.navigator,crypto=globalThis.crypto}){
  const el=id=>document.getElementById(id),errors=new Map();
  let transport=null,saver=null,busy=false,localPending=false,received=null,requestId=0,renderId=0,originId=0,pendingIds=[];
  const setStatus=message=>{el('modern-status').textContent=message;el('modern-sync-status').textContent=message;};
  try{
    if(binding?.kind==='synthetic-only'&&['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
      transport=createModernTransport({...binding,destination:binding.destination||MODERN_DESTINATION,fetch:binding.fetch||globalThis.fetch,online:binding.online||(()=>navigator.onLine),crypto});
      saver=createModernSaver({store,transport,crypto});
    }else if(binding===PRODUCTION_MODERN_BINDING&&binding?.kind==='firestore-public'&&binding.enabled===true){
      transport=createProductionTransport({proposal:binding,apiKey:publicApiKey,fetch:globalThis.fetch,online:()=>navigator.onLine,crypto});
      saver=createModernSaver({store,transport,crypto});
    }
  }catch(error){setStatus(error.message);}
  function controls(){
    el('modern-save').disabled=busy||!transport||!canShare();
    el('modern-sync').disabled=busy||!transport||!pendingIds.length;
    el('modern-make-copy').disabled=busy||!received;
    document.querySelectorAll('[data-modern-retry]').forEach(button=>button.disabled=busy||!transport);
  }
  async function renderPending(){
    const token=++renderId;pendingIds=[];controls();
    el('modern-connection').textContent=transport?(transport.kind==='synthetic-only'?'Shared saving connected to local synthetic fixtures. No production connection.':'Shared saving is connected. Local snapshots stay retained until confirmed.'):'Shared saving is not connected. Working copies save on this device.';
    try{
      await store.ready;await store.refresh();if(token!==renderId)return;
      const all=store.sharedSnapshots(),same=all.filter(capture=>{
        try{const envelope=capture.item?.record?.modernSnapshot;
          return transport&&envelope?.schema===2&&typeof capture.item.record.preAlphaCapture?.job?.title==='string'&&destinationKey(envelope.destination)===destinationKey(transport.destination)&&canonicalJson(capture.item.record.modernRelay??null)===canonicalJson(transport.binding);
        }catch{return false;}
      });
      pendingIds=same.filter(capture=>!capture.receipt).map(capture=>capture.id);
      el('modern-pending').innerHTML=same.map(capture=>'<div class="modern-pending-row"><strong>'+escape(capture.item.record.preAlphaCapture.job.title)+'</strong><span>'+escape(errors.get(capture.id)||(capture.receipt?'Shared — snapshot confirmed':'Saved locally — waiting to sync'))+'</span>'+(capture.receipt?'':'<button type="button" data-modern-retry="'+escape(capture.id)+'">Retry saved snapshot</button>')+'</div>').join('')+
        (all.length>same.length?'<p>Earlier or differently configured captures are retained. They will not be redirected or synced automatically.</p>':'');
    }catch{if(token===renderId)el('modern-pending').textContent='Saved sharing status could not be read. Existing captures remain on this device.';}
    finally{if(token===renderId)controls();}
  }
  function handleRoute(){++requestId;received=null;el('modern-make-copy').hidden=true;el('modern-view-content').innerHTML='';el('modern-view-status').textContent='Choose a job from the Shared Jobs list.';controls();}
  async function showSnapshot(snapshot){
    const token=++requestId;received=null;el('modern-make-copy').hidden=true;el('modern-view-content').innerHTML='';el('modern-view-status').textContent='Opening complete shared job…';
    try{
      const incoming=structuredClone(snapshot);
      if(incoming.kind==='modern'){
        if(!transport)throw Error('This shared source is not connected.');
        incoming.item=await verifyEnvelope(incoming.envelope,{destination:transport.destination,binding:transport.binding,cloudId:incoming.id,crypto});
      }else if(incoming.kind!=='legacy'||!incoming.entry||!incoming.job)throw Error('The shared job could not be read completely.');
      if(token!==requestId)return;
      received=incoming;el('modern-view-content').innerHTML=incoming.kind==='modern'?modernSnapshotMarkup(incoming):legacySnapshotMarkup(incoming);
      el('modern-view-status').textContent='View only. Load Job makes a separate working copy.';el('modern-make-copy').hidden=false;
    }catch(error){if(token===requestId)el('modern-view-status').textContent=error.message;}
    finally{controls();}
  }
  async function showWorkingOrigin(job){
    const token=++originId,origin=job?.modernOrigin;el('modern-working-origin').hidden=true;el('modern-working-origin-content').innerHTML='';
    if(!origin)return;
    try{
      let markup;
      if(origin.kind==='legacy')markup=legacySnapshotMarkup(origin);
      else{const item=await verifyEnvelope(origin.envelope,{destination:origin.destination,cloudId:origin.cloudId,crypto});markup=modernSnapshotMarkup({item,envelope:origin.envelope});}
      if(token!==originId)return;el('modern-working-origin-content').innerHTML=markup;el('modern-working-origin').hidden=false;
    }catch{if(token===originId){el('modern-working-origin-content').textContent='The earlier original remains retained in the working copy, but this format could not be verified here.';el('modern-working-origin').hidden=false;}}
  }
  async function click(event){
    const button=event.target.closest('#modern-save,#modern-sync,[data-modern-retry],#modern-make-copy');if(!button||busy)return;
    if(button.id!=='modern-make-copy'&&!transport){setStatus('Shared saving is not connected. Your working copy stays on this device.');return;}
    busy=true;controls();let captureId=button.dataset.modernRetry;
    try{
      if(button.id==='modern-make-copy'){
        const snapshot=received,token=requestId;if(!snapshot)throw Error('Select a shared job first.');
        if(snapshot.kind==='modern')await verifyEnvelope(snapshot.envelope,{destination:snapshot.destination,cloudId:snapshot.id,crypto});
        if(token!==requestId||snapshot!==received)throw Error('The selected job changed before loading.');
        const item=snapshot.kind==='modern'?snapshot.item:{record:{preAlphaCapture:{job:snapshot.job}}};
        const job=workingCopyOf(item,{uuid:()=>crypto.randomUUID()});
        job.modernOrigin=snapshot.kind==='modern'?{kind:'modern',cloudId:snapshot.id,destination:structuredClone(snapshot.destination),schema:snapshot.envelope.schema,contentHash:snapshot.envelope.contentHash,envelope:structuredClone(snapshot.envelope)}:{kind:'legacy',cloudId:snapshot.id,destination:structuredClone(snapshot.destination),entry:structuredClone(snapshot.entry),job:structuredClone(snapshot.job)};
        localPending=true;await makeWorkingCopy(job,{isCurrent:()=>requestId===token&&received===snapshot});localPending=false;
        if(requestId===token){received=null;el('modern-make-copy').hidden=true;location.hash='workspace';notify('Loaded a separate working copy. The shared job is unchanged.');}return;
      }
      if(button.id==='modern-sync'){
        const ids=[...pendingIds];let confirmed=0,waiting=0;
        for(const id of ids){try{await saver.retry(id);errors.delete(id);confirmed++;}catch(error){errors.set(id,error.message);waiting++;}}
        setStatus(confirmed+' shared; '+waiting+' waiting to sync.');if(confirmed)await onSharedChange();return;
      }
      setStatus(captureId?'Syncing the exact saved snapshot…':'Saving the complete snapshot on this device…');
      let result;
      if(captureId)result=await saver.retry(captureId);
      else{
        localPending=true;const draft=await getDraft();
        result=await saver.save(draft.job,draft.version,{isCurrent:draft.isCurrent,onPrepared:prepared=>{localPending=false;draft.onPrepared?.(prepared);setStatus('Saved locally — waiting for shared confirmation…');}});
      }
      errors.delete(result.captureId);setStatus('Shared — complete snapshot confirmed.');await onSharedChange();
    }catch(error){captureId=error.captureId||captureId;if(captureId)errors.set(captureId,error.message);setStatus(error.message);}
    finally{localPending=false;busy=false;await renderPending();controls();}
  }
  document.addEventListener('click',click);void renderPending();
  return {transport,showSnapshot,handleRoute,showWorkingOrigin,renderPending,hasSelection:()=>!!received,refreshControls:controls,hasLocalPending:()=>localPending,close(){document.removeEventListener('click',click);}};
}

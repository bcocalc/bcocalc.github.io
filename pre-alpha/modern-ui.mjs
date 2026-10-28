import {createModernTransport} from './modern-transport.mjs?v=pre-alpha23';
import {createModernSaver} from './modern-saver.mjs?v=pre-alpha23';
import {MODERN_DESTINATION} from './modern-sharing-config.mjs?v=pre-alpha23';
import {destinationKey,workingCopyOf,verifyEnvelope} from './modern-envelope.mjs?v=pre-alpha23';
import {modernSnapshotMarkup} from './modern-view.mjs?v=pre-alpha23';
import {escape} from './presentation.mjs?v=pre-alpha23';

export function installModernSharing(document,{binding=null,store,getDraft,makeWorkingCopy,notify,canShare=()=>true,location=globalThis.location,navigator=globalThis.navigator,crypto=globalThis.crypto}){
  const el=id=>document.getElementById(id),errors=new Map();let transport=null,saver=null,busy=false,authBusy=false,localPending=false,received=null,requestId=0,renderId=0,originId=0,shownUid=null;
  const setStatus=message=>{el('modern-status').textContent=message;};
  try{
    if(binding?.kind==='synthetic-only'&&['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
      transport=createModernTransport({...binding,destination:binding.destination||MODERN_DESTINATION,fetch:binding.fetch||globalThis.fetch,online:binding.online||(()=>navigator.onLine),crypto});
      saver=createModernSaver({store,transport,crypto});
    }
  }catch(error){setStatus(error.message);}
  el('modern-auth-controls').hidden=!transport;
  el('modern-signin').hidden=!transport||typeof binding?.auth?.signIn!=='function';
  el('modern-signout').hidden=!transport||typeof binding?.auth?.signOut!=='function';
  function controls(){el('modern-save').disabled=busy||!transport||!shownUid||!canShare();document.querySelectorAll('[data-modern-retry],[data-modern-copy]').forEach(button=>button.disabled=busy);}
  async function renderPending(){
    const token=++renderId;shownUid=null;controls();
    if(!transport){el('modern-connection').textContent='Private team sharing is not connected. Your working copies stay on this device.';el('modern-pending').innerHTML='';return;}
    try{
      const session=await transport.session();await store.refresh();if(token!==renderId)return;shownUid=session.uid;
      el('modern-connection').textContent='Synthetic team sharing — localhost fixtures only. No production connection.';
      el('modern-auth-state').textContent='Approved account connected to synthetic team sharing. No production connection.';
      const all=store.sharedSnapshots(),modern=all.filter(capture=>capture.item?.record?.modernSnapshot);
      const own=modern.filter(capture=>capture.item.record.modernSnapshot.ownerUid===session.uid&&destinationKey(capture.item.record.modernSnapshot.destination)===destinationKey(transport.destination));
      el('modern-pending').innerHTML=own.map(capture=>'<div class="modern-pending-row"><strong>'+escape(capture.item.record.preAlphaCapture.job.title)+'</strong><span>'+escape(errors.get(capture.id)|| (capture.receipt?'Shared snapshot confirmed':'Not confirmed — complete snapshot retained on this device'))+'</span> '+(capture.receipt?'<button type="button" data-modern-copy="'+escape(capture.id)+'">Copy link</button>':'<button type="button" data-modern-retry="'+escape(capture.id)+'">Retry this snapshot</button>')+'</div>').join('')+
        (modern.length>own.length?'<p>Other-account snapshots remain on this device. Sign in as their owner to retry them.</p>':'')+(all.length>modern.length?'<p>Older captures remain retained without a modern destination. They will not be redirected.</p>':'');
    }catch(error){if(token!==renderId)return;el('modern-connection').textContent=error.message;el('modern-auth-state').textContent=error.message;el('modern-pending').innerHTML='';}
    finally{if(token===renderId)controls();}
  }
  async function handleRoute(){
    const token=++requestId,hash=location.hash;received=null;el('modern-make-copy').hidden=true;el('modern-view-content').innerHTML='';
    if(!hash.startsWith('#shared/'))return;
    el('modern-view-status').textContent=transport?'Opening private team snapshot…':'Private team sharing is not connected. No snapshot was requested.';
    if(!transport)return;
    try{
      const result=await transport.get(hash.slice('#shared/'.length));if(token!==requestId||location.hash!==hash)return;
      received=result;el('modern-view-content').innerHTML=modernSnapshotMarkup(result);el('modern-view-status').textContent='Complete shared snapshot. View only.';el('modern-make-copy').hidden=false;
    }catch(error){if(token===requestId)el('modern-view-status').textContent=error.message;}
  }
  async function showWorkingOrigin(job){
    const token=++originId,origin=job?.modernOrigin;el('modern-working-origin').hidden=true;el('modern-working-origin-content').innerHTML='';
    if(!origin?.envelope)return;
    try{const item=await verifyEnvelope(origin.envelope,{destination:origin.destination,cloudId:origin.cloudId,crypto});if(token!==originId)return;el('modern-working-origin-content').innerHTML=modernSnapshotMarkup({item,envelope:origin.envelope});el('modern-working-origin').hidden=false;}
    catch{if(token===originId){el('modern-working-origin-content').textContent='The saved original snapshot could not be verified. Its saved bytes remain unchanged.';el('modern-working-origin').hidden=false;}}
  }
  async function copyLink(id){
    const result=await saver.confirmed(id),url=new URL(location.href);url.search='';url.hash='shared/'+result.cloudId;
    const input=el('modern-link');el('modern-link-wrap').hidden=false;input.value=url.href;
    let timer;try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await Promise.race([navigator.clipboard.writeText(url.href),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Clipboard not confirmed')),binding.timeoutMs||12000);})]);setStatus('Link copied. Only approved team accounts can open it.');}
    catch{input.focus();input.select();setStatus('Verified link ready. Copy the selected text; approved team sign-in is required.');}
    finally{clearTimeout(timer);}
  }
  async function click(event){
    const button=event.target.closest('#modern-save,[data-modern-retry],[data-modern-copy],#modern-make-copy,#modern-signin,#modern-signout');if(!button)return;
    if(!transport){setStatus('Private team sharing is not connected.');return;}
    if(button.id==='modern-signin'||button.id==='modern-signout'){
      if(authBusy)return;authBusy=true;const token=requestId;el('modern-signin').disabled=true;el('modern-signout').disabled=true;
      let timer;try{const method=button.id==='modern-signin'?'signIn':'signOut';if(typeof binding.auth[method]!=='function')throw Error('An approved authentication provider is not connected.');await Promise.race([Promise.resolve().then(()=>binding.auth[method]()),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Account action timed out. Your local jobs are retained.')),binding.timeoutMs||12000);})]);if(token===requestId)authChanged();}
      catch(error){setStatus(error.message);el('modern-auth-state').textContent=error.message;}
      finally{clearTimeout(timer);authBusy=false;el('modern-signin').disabled=false;el('modern-signout').disabled=false;}return;
    }
    if(busy)return;
    busy=true;controls();let captureId=button.dataset.modernRetry;
    try{
      if(button.dataset.modernCopy){await copyLink(button.dataset.modernCopy);return;}
      if(button.id==='modern-make-copy'){
        const snapshot=received,token=requestId;if(!snapshot)throw Error('Open an authorized shared snapshot first.');
        await transport.session();if(token!==requestId||snapshot!==received)throw Error('The shared view changed before a working copy could be made.');
        const job=workingCopyOf(snapshot.item,{uuid:()=>crypto.randomUUID()});
        job.modernOrigin={cloudId:snapshot.id,ownerUid:snapshot.envelope.ownerUid,destination:structuredClone(snapshot.envelope.destination),schema:snapshot.envelope.schema,contentHash:snapshot.envelope.contentHash,envelope:structuredClone(snapshot.envelope)};
        localPending=true;await makeWorkingCopy(job,{isCurrent:()=>requestId===token&&received===snapshot});localPending=false;
        if(requestId===token){location.hash='workspace';notify('A separate working copy was saved on this device. The shared snapshot is unchanged.');}return;
      }
      el('modern-link-wrap').hidden=true;setStatus(captureId?'Retrying the exact retained snapshot…':'Saving the complete snapshot on this device before sharing…');
      let result;
      if(captureId)result=await saver.retry(captureId);
      else{
        const token=requestId,uid=shownUid;localPending=true;
        const [session,draft]=await Promise.all([transport.session(),getDraft()]);
        if(!uid||session.uid!==uid)throw Error('Sign-in changed. Start sharing again with the intended account.');
        if(requestId!==token)throw Error('Sign-in or the shared view changed before capture. Start sharing again.');
        result=await saver.save(draft.job,draft.version,{isCurrent:draft.isCurrent,onPrepared:prepared=>{localPending=false;draft.onPrepared?.(prepared);setStatus('Complete snapshot saved on this device. Waiting for shared confirmation…');},expectedOwnerUid:uid});
      }
      errors.delete(result.captureId);setStatus('Shared snapshot verified. Copy link is now available.');
    }catch(error){captureId=error.captureId||captureId;if(captureId)errors.set(captureId,error.message);setStatus(error.message);}
    finally{localPending=false;busy=false;await renderPending();controls();}
  }
  document.addEventListener('click',click);
  function authChanged(){++requestId;received=null;el('modern-make-copy').hidden=true;el('modern-view-content').innerHTML='';el('modern-link-wrap').hidden=true;setStatus('Sign-in changed. Pending snapshots keep their original owner and destination.');void renderPending();void handleRoute();}
  const unsubscribe=transport?binding?.auth?.subscribe?.(authChanged):undefined;
  void renderPending();
  return {handleRoute,showWorkingOrigin,renderPending,refreshControls:controls,hasLocalPending:()=>localPending,close(){document.removeEventListener('click',click);unsubscribe?.();}};
}

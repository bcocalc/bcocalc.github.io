import {buildSharedSnapshot} from './shared-save.mjs';
import {makeEnvelope,verifyEnvelope,canonicalJson,assertJson} from './modern-envelope.mjs';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function createModernSaver({store,transport,crypto=globalThis.crypto,onPrepared=()=>{}}){
  const preparing=new Map(),sending=new Map();
  async function validate(capture){
    const envelope=capture?.item?.record?.modernSnapshot;
    if(!envelope)throw fail('unbound-capture','This older capture has no approved modern destination. It is retained without being redirected.');
    const item=await verifyEnvelope(envelope,{destination:transport.destination,crypto});
    const raw=structuredClone(capture.item);delete raw.record.modernSnapshot;
    if(capture.id!=='modern-'+envelope.contentHash||capture.jobId!==item.id||canonicalJson(item)!==canonicalJson(raw))throw fail('snapshot-mismatch','The pending capture does not match its immutable envelope.');
    const session=await transport.session();if(session.uid!==envelope.ownerUid)throw fail('account-changed','Sign in as this snapshot’s owner to retry. Nothing was redirected.');
    return envelope;
  }
  async function send(capture){
    const envelope=await validate(capture),expected='tm-'+envelope.contentHash;
    if(capture.receipt){if(capture.receipt.cloudId!==expected)throw fail('receipt-conflict','The receipt belongs to another snapshot.');return {captureId:capture.id,cloudId:expected,jobId:capture.jobId};}
    if(sending.has(capture.id))return sending.get(capture.id);
    const task=(async()=>{const cloudId=await transport.upload(envelope);if(cloudId!==expected)throw fail('unconfirmed-upload','The shared acknowledgement did not match this capture.');await store.confirmSharedSnapshot(capture.id,cloudId);return {captureId:capture.id,cloudId,jobId:capture.jobId};})();
    sending.set(capture.id,task);task.then(()=>sending.delete(capture.id),()=>sending.delete(capture.id));return task;
  }
  function save(job,version,{isCurrent=()=>true}={}){
    let snapshot;try{assertJson(job);snapshot=structuredClone(job);}catch(error){return Promise.reject(error);}
    return (async()=>{
      const session=await transport.session(),item=buildSharedSnapshot(snapshot),envelope=await makeEnvelope(item,session.uid,transport.destination,crypto);
      item.record.modernSnapshot=envelope;
      const capture={id:'modern-'+envelope.contentHash,jobId:snapshot.id,item};
      if(preparing.has(capture.id))return preparing.get(capture.id);
      const task=(async()=>{let prepared;try{prepared=await store.save(snapshot,version,{isCurrent,sharedCapture:capture});onPrepared(prepared);return await send(capture);}catch(error){if(prepared)error.captureId=capture.id;throw error;}})();
      preparing.set(capture.id,task);task.then(()=>preparing.delete(capture.id),()=>preparing.delete(capture.id));return task;
    })();
  }
  async function retry(id){await store.ready;await store.refresh();const capture=store.sharedSnapshots().find(entry=>entry.id===id);if(!capture)throw fail('missing-snapshot','The saved capture could not be found.');try{return await send(capture);}catch(error){error.captureId=id;throw error;}}
  return {save,retry};
}

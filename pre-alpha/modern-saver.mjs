import {buildSharedSnapshot} from './shared-save.mjs?v=pre-alpha24';
import {makeEnvelope,verifyEnvelope,canonicalJson,assertJson} from './modern-envelope.mjs?v=pre-alpha24';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function createModernSaver({store,transport,crypto=globalThis.crypto,onPrepared=()=>{}}){
  const preparing=new Map(),sending=new Map();
  async function validate(capture){
    const envelope=capture?.item?.record?.modernSnapshot;
    if(envelope?.schema!==2)throw fail('unbound-capture','This earlier capture is retained in its original format. Save a new job to use Shared Jobs; it will not be redirected.');
    const item=await verifyEnvelope(envelope,{destination:transport.destination,binding:transport.binding,crypto});
    const raw=structuredClone(capture.item);delete raw.record.modernSnapshot;
    if(capture.id!=='modern2-'+envelope.contentHash||capture.jobId!==item.id||canonicalJson(item)!==canonicalJson(raw))throw fail('snapshot-mismatch','The pending capture does not match its immutable envelope.');
    return envelope;
  }
  async function send(capture){
    const envelope=await validate(capture),expected='tm2-'+envelope.contentHash;
    if(capture.receipt){if(capture.receipt.cloudId!==expected)throw fail('receipt-conflict','The receipt belongs to another snapshot.');return {captureId:capture.id,cloudId:expected,jobId:capture.jobId};}
    if(sending.has(capture.id))return sending.get(capture.id);
    const task=(async()=>{const cloudId=await transport.upload(envelope);if(cloudId!==expected)throw fail('unconfirmed-upload','The shared acknowledgement did not match this capture.');await store.confirmSharedSnapshot(capture.id,cloudId);return {captureId:capture.id,cloudId,jobId:capture.jobId};})();
    sending.set(capture.id,task);task.then(()=>sending.delete(capture.id),()=>sending.delete(capture.id));return task;
  }
  function save(job,version,{isCurrent=()=>true,onPrepared:preparedCallback=onPrepared}={}){
    let snapshot;try{assertJson(job);snapshot=structuredClone(job);}catch(error){return Promise.reject(error);}
    return (async()=>{
      const item=buildSharedSnapshot(snapshot);item.record.modernRelay=structuredClone(transport.binding);
      const envelope=await makeEnvelope(item,transport.destination,crypto);
      item.record.modernSnapshot=envelope;
      const capture={id:'modern2-'+envelope.contentHash,jobId:snapshot.id,item};
      if(preparing.has(capture.id))return preparing.get(capture.id);
      const task=(async()=>{let prepared;try{prepared=await store.save(snapshot,version,{isCurrent,sharedCapture:capture});preparedCallback(prepared);return await send(capture);}catch(error){if(prepared)error.captureId=capture.id;throw error;}})();
      preparing.set(capture.id,task);task.then(()=>preparing.delete(capture.id),()=>preparing.delete(capture.id));return task;
    })();
  }
  async function retry(id){await store.ready;await store.refresh();const capture=store.sharedSnapshots().find(entry=>entry.id===id);if(!capture)throw fail('missing-snapshot','The saved capture could not be found.');try{return await send(capture);}catch(error){error.captureId=id;throw error;}}
  async function confirmed(id){await store.ready;await store.refresh();const capture=store.sharedSnapshots().find(entry=>entry.id===id);if(!capture?.receipt)throw fail('unconfirmed-upload','This snapshot has no verified shared acknowledgement.');await validate(capture);return send(capture);}
  return {save,retry,confirmed};
}

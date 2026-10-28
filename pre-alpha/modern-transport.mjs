// Explicit injected fetch only. Production constructor is prepared behind a disabled source binding.
import {destinationKey,verifyEnvelope,canonicalJson} from './modern-envelope.mjs?v=pre-alpha25';
import {MODERN_DESTINATION,PRODUCTION_MODERN_PROPOSAL} from './modern-sharing-config.mjs?v=pre-alpha25';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function envelopeFields(envelope){
  return {schema:{integerValue:String(envelope.schema)},
    destination:{mapValue:{fields:Object.fromEntries(Object.entries(envelope.destination).map(([key,value])=>[key,{stringValue:value}]))}},
    contentHash:{stringValue:envelope.contentHash},payloadJson:{stringValue:envelope.payloadJson}};
}
export function documentEnvelope(document){
  const f=document?.fields;
  if(!f||Object.keys(f).some(key=>!['schema','destination','contentHash','payloadJson','syncedAt'].includes(key)))throw fail('invalid-snapshot','The shared document has an unsupported envelope.');
  return {schema:Number(f.schema?.integerValue),
    destination:Object.fromEntries(Object.entries(f.destination?.mapValue?.fields||{}).map(([key,value])=>[key,value.stringValue])),
    contentHash:f.contentHash?.stringValue,payloadJson:f.payloadJson?.stringValue};
}
export function createModernTransport({kind,endpoint,destination,fetch:fetcher,online=()=>true,timeoutMs=12000,crypto=globalThis.crypto}){
  const relay=new URL(endpoint);
  if(kind!=='synthetic-only'||!['http:','https:'].includes(relay.protocol)||!['127.0.0.1','localhost','[::1]'].includes(relay.hostname)||relay.username||relay.password||relay.search||relay.hash||typeof fetcher!=='function')throw fail('production-unbound','Modern production sharing is not connected. Only an explicit localhost synthetic relay is allowed.');
  return createSnapshotTransport({endpoint:relay.href,destination,fetch:fetcher,online,timeoutMs,crypto,binding:{kind:'synthetic-only',endpoint:relay.href.replace(/\/$/,'')}});
}
export function createProductionTransport({proposal=PRODUCTION_MODERN_PROPOSAL,apiKey,fetch:fetcher,online=()=>true,timeoutMs=12000,crypto=globalThis.crypto}={}){
  if(proposal?.enabled!==true)throw fail('production-disabled','Production Shared Jobs remains disabled.');
  if(Object.keys(proposal).sort().join(',')!=='destination,enabled,endpoint,id,kind,schema'||proposal.id!==PRODUCTION_MODERN_PROPOSAL.id||proposal.kind!=='firestore-public'||proposal.schema!==2||proposal.endpoint!=='https://firestore.googleapis.com'||destinationKey(proposal.destination)!==destinationKey(MODERN_DESTINATION))throw fail('production-target','The production proposal does not match the reviewed Standard database and snapshot namespace.');
  if(typeof fetcher!=='function'||typeof apiKey!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(apiKey))throw fail('production-unbound','An explicit fetch and existing public Firebase app identifier are required.');
  return createSnapshotTransport({endpoint:proposal.endpoint,destination:proposal.destination,fetch:fetcher,online,timeoutMs,crypto,apiKey,binding:{kind:'firestore-public',endpoint:proposal.endpoint,bindingId:proposal.id}});
}
function createSnapshotTransport({endpoint,destination,fetch:fetcher,online,timeoutMs,crypto,apiKey=null,binding}){
  const relay=new URL(endpoint);
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>12000)throw fail('invalid-timeout','Shared request deadlines must remain bounded at twelve seconds or less.');
  const fixed=Object.freeze(structuredClone(destination)),scope=destinationKey(fixed);
  if(fixed.collection==='tapcalcJobs')throw fail('legacy-read-only','Existing shared records are read-only through this adapter. Choose a separate snapshot namespace.');
  const fixedBinding=Object.freeze(structuredClone(binding));
  const name=`projects/${fixed.projectId}/databases/${fixed.database}/documents`,base=relay.href.replace(/\/$/,'')+'/v1/'+name;
  const collection=base+'/'+encodeURIComponent(fixed.collection),sending=new Map();
  async function request(url,{method='GET',body}={}){
    if(!online())throw fail('offline','Offline. The complete local snapshot is retained for retry.');
    const controller=new AbortController();let timer;
    try{
      return await Promise.race([(async()=>{
        const target=new URL(url);if(apiKey!==null)target.searchParams.set('key',apiKey);
        let response;try{response=await fetcher(target.href,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{'Content-Type':'application/json'},cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});}
        catch{throw fail(controller.signal.aborted?'timeout':'network-failure','The shared network request was not confirmed. The complete local snapshot is retained.');}
        let payload;try{payload=await response.json();}catch{throw fail('invalid-response','The shared response could not be verified. The local snapshot is retained.');}
        if(!response.ok){const error=fail(response.status===401?'access-denied':response.status===403?'permission-denied':response.status===404?'not-found':response.status===409?'already-exists':'network-failure',response.status===403?'Team sharing was denied. Your local snapshot is retained.':response.status===401?'Shared access was denied. Your local snapshot is retained.':'The shared request was not confirmed. Your local snapshot is retained.');error.status=response.status;throw error;}
        return payload;
      })(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('timeout','Shared request timed out. The exact local snapshot is retained for retry.'));},timeoutMs);})]);
    }finally{clearTimeout(timer);}
  }
  function validId(id){if(!/^tm2-[a-f0-9]{64}$/.test(id||''))throw fail('invalid-id','This shared snapshot link is invalid.');return id;}
  async function read(id){
    validId(id);const document=await request(collection+'/'+id);
    if(document.name!==name+'/'+fixed.collection+'/'+id)throw fail('snapshot-mismatch','The shared response belongs to a different destination.');
    const envelope=documentEnvelope(document),item=await verifyEnvelope(envelope,{destination:fixed,binding:fixedBinding,cloudId:id,crypto});
    return {id,envelope,item};
  }
  async function list(){
    const entries=[],tokens=new Set();let pageToken='';
    do{
      const url=new URL(collection);url.searchParams.set('pageSize','100');if(pageToken)url.searchParams.set('pageToken',pageToken);
      const result=await request(url.href);
      for(const document of result.documents||[]){const id=document.name?.split('/').at(-1);validId(id);if(document.name!==name+'/'+fixed.collection+'/'+id)throw fail('snapshot-mismatch','A listing returned a different destination.');const envelope=documentEnvelope(document);entries.push({id,envelope,item:await verifyEnvelope(envelope,{destination:fixed,binding:fixedBinding,cloudId:id,crypto})});}
      pageToken=result.nextPageToken||'';if(pageToken&&tokens.has(pageToken))throw fail('pagination','Shared listing did not finish. Retry without changing any records.');tokens.add(pageToken);
    }while(pageToken);return entries;
  }
  async function upload(envelope){
    await verifyEnvelope(envelope,{destination:fixed,binding:fixedBinding,crypto});
    if(destinationKey(envelope.destination)!==scope)throw fail('destination-changed','The snapshot has a different destination.');
    const id='tm2-'+envelope.contentHash;if(sending.has(id))return sending.get(id);
    const task=(async()=>{
      const verify=async()=>{try{const existing=await read(id);if(canonicalJson(existing.envelope)!==canonicalJson(envelope))throw fail('snapshot-mismatch','Shared content differs. Nothing was overwritten.');return true;}catch(error){if(error.status===404)return false;throw error;}};
      if(await verify())return id;
      try{
        const result=await request(base+':commit',{method:'POST',body:{writes:[{update:{name:name+'/'+fixed.collection+'/'+id,fields:envelopeFields(envelope)},currentDocument:{exists:false},updateTransforms:[{fieldPath:'syncedAt',setToServerValue:'REQUEST_TIME'}]}]}});
        if(!result.writeResults?.[0]?.updateTime)throw fail('unconfirmed-upload','The shared upload acknowledgement was missing.');
      }catch(original){try{if(await verify())return id;}catch(recovery){if(recovery.code==='snapshot-mismatch'||recovery.code==='destination-changed')throw recovery;}throw original;}
      if(!await verify())throw fail('unconfirmed-upload','The uploaded snapshot could not be read back and verified.');return id;
    })();sending.set(id,task);task.then(()=>sending.delete(id),()=>sending.delete(id));return task;
  }
  return Object.freeze({kind:fixedBinding.kind,binding:fixedBinding,destination:fixed,get:id=>read(id),list,upload,
    update:()=>{throw fail('immutable','Shared snapshots cannot be updated. Save a new snapshot.');},delete:()=>{throw fail('immutable','Shared snapshots cannot be deleted by this client.');}});
}

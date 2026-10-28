// Synthetic/emulator relay ONLY. No default fetch, real account or production endpoint.
import {destinationKey,verifyEnvelope,canonicalJson} from './modern-envelope.mjs?v=pre-alpha23';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function envelopeFields(envelope){
  return {schema:{integerValue:String(envelope.schema)},ownerUid:{stringValue:envelope.ownerUid},
    destination:{mapValue:{fields:Object.fromEntries(Object.entries(envelope.destination).map(([key,value])=>[key,{stringValue:value}]))}},
    contentHash:{stringValue:envelope.contentHash},payloadJson:{stringValue:envelope.payloadJson}};
}
export function documentEnvelope(document){
  const f=document?.fields;
  if(!f||Object.keys(f).some(key=>!['schema','ownerUid','destination','contentHash','payloadJson','syncedAt'].includes(key)))throw fail('invalid-snapshot','The shared document has an unsupported envelope.');
  return {schema:Number(f.schema?.integerValue),ownerUid:f.ownerUid?.stringValue,
    destination:Object.fromEntries(Object.entries(f.destination?.mapValue?.fields||{}).map(([key,value])=>[key,value.stringValue])),
    contentHash:f.contentHash?.stringValue,payloadJson:f.payloadJson?.stringValue};
}
export function createModernTransport({kind,endpoint,destination,auth,approvedUids=[],fetch:fetcher,online=()=>true,now=()=>Date.now(),timeoutMs=12000,crypto=globalThis.crypto}){
  const relay=new URL(endpoint);
  if(kind!=='synthetic-only'||!['http:','https:'].includes(relay.protocol)||!['127.0.0.1','localhost','[::1]'].includes(relay.hostname)||relay.username||relay.password||relay.search||relay.hash||typeof fetcher!=='function'||typeof auth?.getSession!=='function')throw fail('production-unbound','Modern production sharing is not connected. Only an explicit localhost synthetic relay is allowed.');
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>12000)throw fail('invalid-timeout','Synthetic request deadlines must remain bounded at twelve seconds or less.');
  const fixed=Object.freeze(structuredClone(destination)),scope=destinationKey(fixed),allowed=new Set(approvedUids);
  const fixedBinding=Object.freeze({kind:'synthetic-only',endpoint:relay.href.replace(/\/$/,'')});
  const name=`projects/${fixed.projectId}/databases/${fixed.database}/documents`,base=relay.href.replace(/\/$/,'')+'/v1/'+name;
  const collection=base+'/'+encodeURIComponent(fixed.collection),sending=new Map();
  async function identity(ownerUid){
    let session,timer;try{session=await Promise.race([Promise.resolve().then(()=>auth.getSession()),new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail('auth-timeout','Sign-in verification timed out. Your local jobs are retained.')),timeoutMs);})]);}
    catch(error){if(error.code==='auth-timeout')throw error;throw fail('sign-in-required','Sign-in could not be verified. Your local jobs are retained.');}finally{clearTimeout(timer);}
    if(!session||typeof session.uid!=='string'||!session.uid||typeof session.token!=='string'||!session.token||!Number.isFinite(session.expiresAt)||session.expiresAt<=now())throw fail('sign-in-required','Sign in with an approved team account. The local snapshot is retained.');
    if(!allowed.has(session.uid))throw fail('not-approved','This account is not approved for team sharing.');
    if(ownerUid&&session.uid!==ownerUid)throw fail('account-changed','This snapshot belongs to another account. Sign in as its owner to retry; nothing was redirected.');
    return session;
  }
  async function request(url,{method='GET',body,ownerUid}={}){
    const session=await identity(ownerUid);if(!online())throw fail('offline','Offline. The complete local snapshot is retained for retry.');
    const controller=new AbortController();let timer;
    try{
      return await Promise.race([(async()=>{
        let response;try{response=await fetcher(url,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{Authorization:'Bearer '+session.token,'Content-Type':'application/json'},cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});}
        catch{throw fail(controller.signal.aborted?'timeout':'network-failure','The shared network request was not confirmed. The complete local snapshot is retained.');}
        let payload;try{payload=await response.json();}catch{throw fail('invalid-response','The shared response could not be verified. The local snapshot is retained.');}
        if(!response.ok){const error=fail(response.status===401?'sign-in-required':response.status===403?'permission-denied':response.status===404?'not-found':response.status===409?'already-exists':'network-failure',response.status===403?'Team sharing was denied. Your local snapshot is retained.':response.status===401?'Sign-in expired. Your local snapshot is retained.':'The shared request was not confirmed. Your local snapshot is retained.');error.status=response.status;throw error;}
        return payload;
      })(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('timeout','Shared request timed out. The exact local snapshot is retained for retry.'));},timeoutMs);})]);
    }finally{clearTimeout(timer);}
  }
  function validId(id){if(!/^tm-[a-f0-9]{64}$/.test(id||''))throw fail('invalid-id','This shared snapshot link is invalid.');return id;}
  async function read(id,ownerUid){
    validId(id);const document=await request(collection+'/'+id,{ownerUid});
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
    await verifyEnvelope(envelope,{destination:fixed,binding:fixedBinding,crypto});await identity(envelope.ownerUid);
    if(destinationKey(envelope.destination)!==scope)throw fail('destination-changed','The snapshot has a different destination.');
    const id='tm-'+envelope.contentHash;if(sending.has(id))return sending.get(id);
    const task=(async()=>{
      const verify=async()=>{try{const existing=await read(id,envelope.ownerUid);if(canonicalJson(existing.envelope)!==canonicalJson(envelope))throw fail('snapshot-mismatch','Shared content differs. Nothing was overwritten.');return true;}catch(error){if(error.status===404)return false;throw error;}};
      if(await verify())return id;
      try{
        const result=await request(base+':commit',{method:'POST',ownerUid:envelope.ownerUid,body:{writes:[{update:{name:name+'/'+fixed.collection+'/'+id,fields:envelopeFields(envelope)},currentDocument:{exists:false},updateTransforms:[{fieldPath:'syncedAt',setToServerValue:'REQUEST_TIME'}]}]}});
        if(!result.writeResults?.[0]?.updateTime)throw fail('unconfirmed-upload','The shared upload acknowledgement was missing.');
      }catch(original){try{if(await verify())return id;}catch(recovery){if(recovery.code==='snapshot-mismatch'||recovery.code==='account-changed'||recovery.code==='destination-changed')throw recovery;}throw original;}
      if(!await verify())throw fail('unconfirmed-upload','The uploaded snapshot could not be read back and verified.');return id;
    })();sending.set(id,task);task.then(()=>sending.delete(id),()=>sending.delete(id));return task;
  }
  return Object.freeze({kind:'synthetic-only',binding:fixedBinding,destination:fixed,session:async()=>({uid:(await identity()).uid}),get:id=>read(id),list,upload,
    update:()=>{throw fail('immutable','Shared snapshots cannot be updated. Save a new snapshot.');},delete:()=>{throw fail('immutable','Shared snapshots cannot be deleted by this client.');}});
}

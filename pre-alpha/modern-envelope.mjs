import {MODERN_SCHEMA,MAX_MODERN_BYTES} from './modern-sharing-config.mjs?v=pre-alpha25';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function assertJson(value,seen=new Set()){
  if(value===null||typeof value==='string'||typeof value==='boolean')return;
  if(typeof value==='number'&&Number.isFinite(value)&&!Object.is(value,-0))return;
  if(!value||typeof value!=='object'||seen.has(value))throw fail('unsupported-value','This job contains a value that cannot be shared losslessly. Its local copy is unchanged.');
  if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype)throw fail('unsupported-value','This job contains an unsupported object. Its local copy is unchanged.');
  if(Object.getOwnPropertySymbols(value).length)throw fail('unsupported-value','Symbol fields cannot be shared losslessly.');
  if(Object.getOwnPropertyNames(value).length!==Object.keys(value).length+(Array.isArray(value)?1:0))throw fail('unsupported-value','Non-enumerable fields cannot be shared losslessly.');
  seen.add(value);
  if(Array.isArray(value)){
    if(Object.keys(value).length!==value.length)throw fail('unsupported-value','Sparse or extended arrays cannot be shared losslessly.');
    for(let index=0;index<value.length;index++){const descriptor=Object.getOwnPropertyDescriptor(value,String(index));if(!descriptor||!Object.hasOwn(descriptor,'value'))throw fail('unsupported-value','Sparse or accessor arrays cannot be shared losslessly.');assertJson(descriptor.value,seen);}
  }else for(const key of Object.keys(value)){
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!Object.hasOwn(descriptor,'value'))throw fail('unsupported-value','Accessor fields cannot be shared losslessly.');
    assertJson(descriptor.value,seen);
  }
  seen.delete(value);
}
export function canonicalJson(value){assertJson(value);return JSON.stringify(value,(_,child)=>child&&typeof child==='object'&&!Array.isArray(child)?Object.fromEntries(Object.keys(child).sort().map(key=>[key,child[key]])):child);}
export function destinationKey(value){
  if(!value||Object.keys(value).sort().join(',')!=='collection,database,projectId'||![value.projectId,value.database,value.collection].every(v=>typeof v==='string'&&/^[A-Za-z0-9_().-]+$/.test(v)))throw fail('invalid-destination','The shared destination is invalid. Nothing was sent.');
  return canonicalJson(value);
}
export async function digest(value,crypto=globalThis.crypto){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');}
function assertSize(envelope){if(new TextEncoder().encode(JSON.stringify(envelope)).byteLength>MAX_MODERN_BYTES)throw fail('snapshot-too-large','This complete job is too large for one shared snapshot. Nothing was truncated; keep the local copy and use the complete print export.');}
export async function makeEnvelope(item,destination,crypto=globalThis.crypto){
  destinationKey(destination);assertJson(item);
  const payloadJson=JSON.stringify(item),scope={schema:MODERN_SCHEMA,destination:structuredClone(destination),payloadJson};
  assertSize(scope);const contentHash=await digest(canonicalJson(scope),crypto),envelope={...scope,contentHash};assertSize(envelope);
  return envelope;
}
export async function verifyEnvelope(envelope,{destination,binding,cloudId,crypto=globalThis.crypto}={}){
  if(!envelope||Object.keys(envelope).sort().join(',')!=='contentHash,destination,payloadJson,schema'||envelope.schema!==MODERN_SCHEMA||typeof envelope.payloadJson!=='string'||!/^[a-f0-9]{64}$/.test(envelope.contentHash||''))throw fail('invalid-snapshot','This shared snapshot has an unsupported or invalid envelope.');
  const key=destinationKey(envelope.destination);if(destination&&key!==destinationKey(destination))throw fail('destination-changed','The snapshot belongs to a different destination. Nothing was redirected.');
  assertSize(envelope);
  const {contentHash,...scope}=envelope;
  if(await digest(canonicalJson(scope),crypto)!==contentHash||cloudId&&cloudId!=='tm2-'+contentHash)throw fail('snapshot-mismatch','Shared content does not match its immutable snapshot ID. Nothing was overwritten.');
  let item;try{item=JSON.parse(envelope.payloadJson);assertJson(item);}catch{throw fail('invalid-snapshot','This shared job cannot be read losslessly.');}
  if(binding&&canonicalJson(item?.record?.modernRelay??null)!==canonicalJson(binding))throw fail('environment-changed','This snapshot belongs to a different relay or environment. It is retained without being redirected or promoted.');
  const job=item?.record?.preAlphaCapture?.job,operations=job?.operations,captured=item?.record?.preAlphaCapture?.operations;
  if(!job||typeof item.id!=='string'||!item.id||job.id!==item.id||typeof job.title!=='string'||typeof job.savedAt!=='string'||!job.sharedState||typeof job.sharedState!=='object'||Array.isArray(job.sharedState)||!Array.isArray(operations)||!operations.length||operations.some(op=>!op||typeof op.id!=='string'||!op.id||!op.state||typeof op.state!=='object'||Array.isArray(op.state))||new Set(operations.map(op=>op.id)).size!==operations.length||!operations.some(op=>op.id===job.selectedOperationId)||!Array.isArray(captured)||captured.length!==operations.length||captured.some((op,index)=>!op||op.id!==operations[index].id))throw fail('invalid-snapshot','The complete captured job or attributed operation results are missing or inconsistent.');
  if(captured.some(op=>typeof op.supported!=='boolean'||!op.results||typeof op.results!=='object'||Array.isArray(op.results)||!Array.isArray(op.warnings)||Object.values(op.results).some(rows=>!Array.isArray(rows)||rows.some(row=>!row||typeof row.label!=='string'||typeof row.value!=='string'))))throw fail('invalid-snapshot','Captured results have an unsupported format. No replacement calculation was made.');
  return structuredClone(item);
}
export function workingCopyOf(item,{uuid=()=>crypto.randomUUID()}={}){
  const original=item?.record?.preAlphaCapture?.job;
  if(!original)throw fail('invalid-snapshot','The complete captured job is missing.');
  const copy=structuredClone(original),id=uuid();if(!id||id===copy.id)throw fail('invalid-copy','A separate working identity could not be assigned.');
  copy.id=id;copy.sourceId=id;copy.source='experimental';return copy;
}

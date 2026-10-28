// One visible library; each source retains its own immutable namespace and refresh state.
import {normalizeJob} from './model.mjs?v=pre-alpha24';
import {assertJson,destinationKey} from './modern-envelope.mjs?v=pre-alpha24';
const clone=value=>structuredClone(value);
export function sharedLibraryKey(destination,id){
  destinationKey(destination);
  if(typeof id!=='string'||!id)throw Error('A shared record has no document identity.');
  return 'shared:'+ [destination.projectId,destination.database,destination.collection,id].map(encodeURIComponent).join('/');
}
export function legacyLibraryEntry(entry,destination){
  assertJson(entry);if(!entry?.record||typeof entry.record!=='object'||Array.isArray(entry.record))throw Error('A legacy shared record is incomplete.');
  const key=sharedLibraryKey(destination,entry.id),job=normalizeJob(entry);job.source='shared';
  return {...clone(job),id:key,sourceId:key,sharedSnapshot:{kind:'legacy',id:entry.id,destination:clone(destination),entry:clone(entry),job:clone(job)}};
}
export function modernLibraryEntry(snapshot,destination){
  const key=sharedLibraryKey(destination,snapshot.id),job=clone(snapshot.item.record.preAlphaCapture.job);
  return {...job,id:key,source:'shared',sourceId:key,sharedSnapshot:{kind:'modern',...clone(snapshot),destination:clone(destination),job}};
}
export function createSharedLibrary({legacyList,legacyDestination,modernTransport=null}){
  const legacyScope=Object.freeze(clone(legacyDestination));destinationKey(legacyScope);
  const modernScope=modernTransport?Object.freeze(clone(modernTransport.destination)):null;
  const sources={legacy:[],modern:[]},status={legacy:{state:'idle',count:0},modern:{state:modernTransport?'idle':'unbound',count:0}};
  let pending=null;
  function read(){return clone({jobs:[...sources.legacy,...sources.modern],status});}
  function refresh(){
    if(pending)return pending;
    pending=(async()=>{
      const results=await Promise.allSettled([Promise.resolve().then(()=>legacyList()),modernTransport?modernTransport.list():Promise.resolve(null)]);
      for(const [index,kind]of ['legacy','modern'].entries()){
        if(kind==='modern'&&!modernTransport)continue;
        const result=results[index];
        try{
          if(result.status!=='fulfilled')throw result.reason;
          if(!Array.isArray(result.value))throw Error('The shared response is not a job list.');
          const entries=result.value.map(entry=>kind==='legacy'?legacyLibraryEntry(entry,legacyScope):modernLibraryEntry(entry,modernScope));
          if(new Set(entries.map(entry=>entry.id)).size!==entries.length)throw Error('A shared response repeated a document identity.');
          sources[kind]=entries;status[kind]={state:'ready',count:entries.length};
        }catch(error){status[kind]={state:'failed',count:sources[kind].length,retained:true,message:'This source could not refresh. Its last successful results are retained.'};}
      }
      return read();
    })();
    pending.then(()=>pending=null,()=>pending=null);return pending;
  }
  return {read,refresh};
}

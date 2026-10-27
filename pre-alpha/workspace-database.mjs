export const WORKSPACE_DATABASE='tapcalc-pre-alpha-workspace-v1';
export const WORKSPACE_OBJECT_STORE='workspace',WORKSPACE_RECORD='current';
const STORE=WORKSPACE_OBJECT_STORE,KEY=WORKSPACE_RECORD;
const unavailable=message=>Object.assign(new Error(message),{code:'database-unavailable'});

export function createWorkspaceDatabase({indexedDB=globalThis.indexedDB}={}){
  let opening,closed=false;
  function open(){
    if(closed)return Promise.reject(unavailable('Device storage needs to be reopened. Preserve this draft and reload the page.'));
    if(!opening)opening=new Promise((resolve,reject)=>{
      if(!indexedDB){reject(unavailable('Safe device storage is unavailable. Keep this page open; saved bytes have not been changed.'));return;}
      let request,settled=false;
      try{request=indexedDB.open(WORKSPACE_DATABASE,1);}catch(error){reject(error);return;}
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
      request.onblocked=()=>{settled=true;reject(unavailable('Device storage is blocked by another version. Preserve unsaved work and reload older tabs.'));};
      request.onerror=()=>{settled=true;reject(request.error);};
      request.onsuccess=()=>{
        const db=request.result;
        if(settled){db.close();return;}
        db.onversionchange=()=>{closed=true;db.close();};resolve(db);
      };
    });
    return opening;
  }
  async function run(mode,change){
    const db=await open();
    return new Promise((resolve,reject)=>{
      let transaction,result,cause;
      try{transaction=db.transaction(STORE,mode,mode==='readwrite'?{durability:'strict'}:{});}catch(error){reject(error);return;}
      transaction.oncomplete=()=>resolve(result);
      transaction.onabort=()=>reject(cause||transaction.error||unavailable('Device save was aborted. Keep this page open to retain your draft.'));
      transaction.onerror=()=>{}; // The abort event owns failure; never acknowledge a put request alone.
      const store=transaction.objectStore(STORE),request=store.get(KEY);
      request.onsuccess=()=>{
        try{
          const raw=request.result??null;
          if(!change){result=raw;return;}
          // Keep validation, revision comparison and put in this active transaction.
          result=change(raw);
          if(result.raw!==raw)store.put(result.raw,KEY);
        }catch(error){cause=error;transaction.abort();}
      };
    });
  }
  return {read:()=>run('readonly'),update:change=>run('readwrite',change),async close(){closed=true;if(opening)await opening.then(db=>db.close(),()=>{});}};
}

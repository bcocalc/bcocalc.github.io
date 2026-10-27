import {WORKSPACE_DATABASE,WORKSPACE_OBJECT_STORE,WORKSPACE_RECORD} from '../pre-alpha/workspace-database.mjs';

// Saves now await a real cross-tab transaction. Tests must observe completion rather
// than treating the input event or the old, read-only key as an acknowledgement.
export async function waitForWorkspaceSave(page){
  await page.waitForFunction(()=>document.getElementById('save-state')?.textContent==='Saved on this device');
}
export async function readWorkspaceSnapshot(page){
  await waitForWorkspaceSave(page);
  return page.evaluate(async()=>{
    const {createWorkspaceStore}=await import('./workspace-store.mjs');
    const store=createWorkspaceStore({storage:localStorage,locks:navigator.locks});
    try{await store.ready;const {jobs,activeId}=store.read();return {jobs,activeId};}
    finally{await store.close();}
  });
}
// Independent read-only probe also works while the older rollback app is active.
// Missing databases abort instead of creating a replacement empty authority.
export function readDurableWorkspace(page){
  return page.evaluate(({name,store,key})=>new Promise((resolve,reject)=>{
    const opening=indexedDB.open(name);
    opening.onupgradeneeded=()=>opening.transaction.abort();
    opening.onerror=()=>reject(opening.error);
    opening.onsuccess=()=>{
      const db=opening.result;let transaction,raw;
      try{transaction=db.transaction(store,'readonly');const request=transaction.objectStore(store).get(key);request.onsuccess=()=>raw=request.result??null;}
      catch(error){db.close();reject(error);return;}
      transaction.oncomplete=()=>{db.close();resolve(raw);};
      transaction.onabort=()=>{db.close();reject(transaction.error);};
    };
  }),{name:WORKSPACE_DATABASE,store:WORKSPACE_OBJECT_STORE,key:WORKSPACE_RECORD});
}

import assert from 'node:assert/strict';

export async function checkDatabaseAbort({browser,base,engine,fixture}){
  const context=await browser.newContext({serviceWorkers:'block'});
  try{
    await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    await context.route(base+'/__database_abort',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic database abort control</title>'}));
    const page=await context.newPage();await page.goto(base+'/__database_abort');
    const result=await page.evaluate(async({base,fixture})=>{
      const {createWorkspaceDatabase}=await import(base+'/pre-alpha/workspace-database.mjs');
      const {createWorkspaceStore}=await import(base+'/pre-alpha/workspace-store.mjs');
      const observer=createWorkspaceDatabase(),before=await observer.read();let putSucceeded=false,acknowledged=false,failure;
      // Only this disposable connection is instrumented. Abort after the real put
      // succeeds to prove that request success is not treated as a committed save.
      const factory={open(...args){
        const opening=indexedDB.open(...args);
        opening.addEventListener('success',()=>{
          const db=opening.result,originalTransaction=db.transaction.bind(db);
          db.transaction=(...args)=>{
            const transaction=originalTransaction(...args);
            if(args[1]==='readwrite'){
              const originalStore=transaction.objectStore.bind(transaction);
              transaction.objectStore=name=>{
                const store=originalStore(name),originalPut=store.put.bind(store);
                store.put=(...args)=>{const request=originalPut(...args);request.addEventListener('success',()=>{putSucceeded=true;transaction.abort();});return request;};
                return store;
              };
            }
            return transaction;
          };
        });return opening;
      }};
      const database=createWorkspaceDatabase({indexedDB:factory});
      const store=createWorkspaceStore({storage:localStorage,locks:navigator.locks,database});
      try{
        await store.ready;
        try{await store.save(fixture,null);acknowledged=true;}catch(error){failure={name:error.name,code:error.code,message:error.message};}
        return {putSucceeded,acknowledged,failure,before,after:await observer.read(),cachedJobCount:store.read().jobs.length,legacyKeyCount:localStorage.length};
      }finally{await store.close();await observer.close();}
    },{base,fixture});
    assert.equal(result.putSucceeded,true);assert.equal(result.acknowledged,false);
    // An explicit transaction.abort() has no request error; the adapter supplies
    // its documented fail-closed error rather than inventing a DOM AbortError.
    assert.equal(result.failure.code,'database-unavailable');assert.match(result.failure.message,/aborted/);
    assert.equal(result.after,result.before);assert.equal(result.cachedJobCount,0);assert.equal(result.legacyKeyCount,0);
    console.log('PASS real IndexedDB '+engine+': put succeeded then aborted; no save acknowledgement, cache advance or legacy write');
  }finally{await context.close();}
}

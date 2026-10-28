// Actual workspace UI + isolated IndexedDB + localhost auth/REST fixture only.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {modernRelayFixture} from './modern-sharing-fixture.mjs';
import {modernJobFixture} from './modern-job-fixture.mjs';
import {WORKSPACE_LOCK} from '../pre-alpha/workspace-store.mjs';
import {readWorkspaceSnapshot,readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const source=modernJobFixture().original;source.record.job.notes='Synthetic notes <script>window.fixtureLeak=1</script> Ω';
const history=JSON.stringify([source]),sentinel='{"synthetic":"legacy state unchanged"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});let context,page,relay,device,step='startup',release,diagnosticErrors=[];
try{
 const base=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});
 for(const mobile of [true,false]){
  device=mobile?'phone':'desktop';relay=await modernRelayFixture();const unexpected=[],errors=diagnosticErrors=[],profile=mkdtempSync(join(tmpdir(),'tapcalc-modern-'+engine+'-'+device+'-'));
  const options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'block'};
  async function launch({path=profile,uid='alice',nextUser='alice',bound=true}={}){
   context=await pw[engine].launchPersistentContext(path,options);
   context.on('page',target=>target.on('pageerror',error=>errors.push({message:error.message,url:target.url(),stack:error.stack})));
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===base){
     if(url.pathname.startsWith('/__modern/')){
      try{const response=await fetch(new URL(request.url()).href.replace(base,relay.endpoint.replace('/__modern','')),{method:request.method(),headers:{Authorization:request.headers().authorization||'','Content-Type':'application/json'},body:request.method()==='POST'?request.postData():undefined,signal:AbortSignal.timeout(15000),redirect:'error'});return route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});}
      catch{return route.abort();}
     }
     if(request.method()!=='GET'){unexpected.push(request.method()+' '+url.pathname);return route.abort();}return route.continue();
    }
    if(url.origin==='https://firestore.googleapis.com'&&request.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:'{"documents":[]}'});
    unexpected.push(request.method()+' '+url.origin+url.pathname);return route.abort();
   });
   await context.addInitScript(({history,sentinel,base,uid,nextUser,bound})=>{
    if(location.origin!==base)return;
    if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);}
    const listeners=new Set(),sessionFor=who=>who?{uid:who,token:'fixture-'+who,expiresAt:Date.now()+3600000}:null;let session=sessionFor(uid),next=nextUser;
    const publish=()=>listeners.forEach(fn=>fn());
    const auth={getSession:async()=>session,signIn:async()=>{session=sessionFor(next);publish();},signOut:async()=>{session=null;publish();},subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
    window.__modernFixtureAuth={nextUser:value=>next=value,setUser:value=>{session=sessionFor(value);publish();},expire:()=>{session={uid:'alice',token:'fixture-alice',expiresAt:Date.now()-1};publish();}};
    if(bound)window.TAPCALC_MODERN_TEST_BINDING={kind:'synthetic-only',endpoint:base+'/__modern',auth,approvedUids:['alice','bob']};
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Synthetic clipboard denial');}}});
   },{history,sentinel,base,uid,nextUser,bound});
   page=await context.newPage();page.setDefaultTimeout(15000);
  }
  const activate=locator=>mobile?locator.tap():locator.click();
  const ready=target=>(target||page).waitForFunction(()=>document.getElementById('connection')?.textContent.includes('Connected'));
  const raw=async target=>{const text=await readDurableWorkspace(target||page);return text?JSON.parse(text):null;};
  const active=async target=>{const snapshot=await readWorkspaceSnapshot(target||page);return snapshot.jobs.find(job=>job.id===snapshot.activeId);};
  const waitText=(id,pattern)=>page.waitForFunction(({id,pattern})=>new RegExp(pattern).test(document.getElementById(id)?.textContent||''),{id,pattern});
  const openDevice=async()=>{await ready();await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="device"]'));await activate(page.locator('[data-job="synthetic-modern"]'));await waitForWorkspaceSave(page);await activate(page.locator('[data-operation="tap"]'));await activate(page.locator('[data-step="tap"]'));await waitForWorkspaceSave(page);};
  step='unbound default';await launch({path:mkdtempSync(join(tmpdir(),'tapcalc-modern-unbound-')),bound:false});await page.goto(base+'/pre-alpha/');await openDevice();assert.equal(await page.locator('#modern-save').isDisabled(),true);assert.equal(await page.locator('#modern-auth-controls').isVisible(),false);assert.equal(relay.requests.length,0);await context.close();context=null;

  step='local-first pending and late acknowledgement';await launch();await page.goto(base+'/pre-alpha/');await openDevice();await page.locator('[data-field="md"]').fill('10');await waitForWorkspaceSave(page);
  const original=await active();assert.deepEqual(original.original.record,source.record);
  const started=deferred(),gate=deferred();release=gate.resolve;relay.setOnPost(async()=>{started.resolve();await gate.promise;});
  await activate(page.locator('#modern-save'));let deadline;try{await Promise.race([started.promise,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('First share never reached the local relay')),15000);})]);}finally{clearTimeout(deadline);}
  let record=await raw();assert.equal(record.sharedSnapshots.length,1);const first=record.sharedSnapshots[0],cloudId='tm-'+first.item.record.modernSnapshot.contentHash;
  assert.deepEqual(first.item.record.preAlphaCapture.job,original);assert.equal(first.receipt,null);assert.equal(await page.locator('[data-modern-copy]').count(),0);
  await page.locator('[data-field="md"]').fill('11');await waitForWorkspaceSave(page);const edited=await active();release();release=null;relay.setOnPost(null);
  await waitText('modern-status','Shared snapshot verified');assert.deepEqual(await active(),edited);record=await raw();assert.ok(record.sharedSnapshots[0].receipt);assert.equal(record.sharedSnapshots[0].item.record.preAlphaCapture.job.operations.find(op=>op.id==='tap').state.md,'10');
  await activate(page.locator('[data-modern-copy="'+first.id+'"]'));await page.locator('#modern-link').waitFor({state:'visible'});const link=await page.locator('#modern-link').inputValue();assert.equal(new URL(link).hash,'#shared/'+cloudId);await waitText('modern-status','Verified link ready');

  step='denied/offline capture and immutable retry';relay.setMode('post-denied');await activate(page.locator('#modern-save'));await waitText('modern-status','denied');record=await raw();assert.equal(record.sharedSnapshots.length,2);const pending=record.sharedSnapshots.find(capture=>!capture.receipt);assert.equal(pending.item.record.preAlphaCapture.job.operations.find(op=>op.id==='tap').state.md,'11');
  const calls=relay.posts.length;await context.setOffline(true);await activate(page.locator('#modern-save'));await waitText('modern-status','Offline');assert.equal(relay.posts.length,calls);assert.equal((await raw()).sharedSnapshots.length,2);await context.setOffline(false);
  await activate(page.locator('#modern-signout'));await page.evaluate(()=>__modernFixtureAuth.nextUser('bob'));await activate(page.locator('#modern-signin'));await waitText('modern-auth-state','Approved account');assert.equal(await page.locator('[data-modern-retry="'+pending.id+'"]').count(),0);assert.equal(relay.posts.length,calls);
  await page.evaluate(()=>__modernFixtureAuth.setUser('mallory'));await waitText('modern-auth-state','not approved');assert.equal(await page.locator('#modern-save').isDisabled(),true);
  await page.evaluate(()=>__modernFixtureAuth.expire());await waitText('modern-auth-state','Sign in');assert.equal(relay.posts.length,calls);
  await activate(page.locator('#modern-signout'));await page.evaluate(()=>__modernFixtureAuth.nextUser('alice'));await activate(page.locator('#modern-signin'));await waitText('modern-auth-state','Approved account');relay.setMode('success');await activate(page.locator('[data-modern-retry="'+pending.id+'"]'));await waitText('modern-status','Shared snapshot verified');assert.equal(relay.docs.size,2);

  step='restart exact pending capture';await page.locator('[data-field="md"]').fill('12');await waitForWorkspaceSave(page);relay.setMode('post-denied');await activate(page.locator('#modern-save'));await waitText('modern-status','denied');const retry=(await raw()).sharedSnapshots.find(capture=>!capture.receipt),retained=structuredClone(retry.item);assert.ok(retry);
  await context.close();context=null;relay.setMode('success');await launch();await page.goto(base+'/pre-alpha/#workspace');await ready();await waitForWorkspaceSave(page);await activate(page.locator('[data-modern-retry="'+retry.id+'"]'));await waitText('modern-status','Shared snapshot verified');record=await raw();assert.deepEqual(record.sharedSnapshots.find(capture=>capture.id===retry.id).item,retained);assert.equal(relay.docs.size,3);

  step='two-tab local conflict prevents sharing';const peer=await context.newPage();peer.setDefaultTimeout(15000);await peer.goto(base+'/pre-alpha/#workspace');await ready(peer);await waitForWorkspaceSave(peer);
  await peer.evaluate(lock=>{window.__held=false;window.__hold=navigator.locks.request(lock,{mode:'exclusive'},async()=>{window.__held=true;await new Promise(resolve=>window.__release=resolve);});},WORKSPACE_LOCK);await peer.waitForFunction(()=>window.__held);
  await peer.locator('[data-field="md"]').fill('20');await peer.waitForFunction(()=>document.getElementById('save-state').textContent.includes('Saving'));
  await page.locator('[data-field="md"]').fill('21');assert.equal(await page.locator('#modern-save').isDisabled(),true);await peer.evaluate(()=>window.__release());await waitForWorkspaceSave(peer);await page.locator('#save-recovery').waitFor({state:'visible'});assert.equal(await page.locator('[data-field="md"]').inputValue(),'21');assert.equal(await page.locator('#modern-save').isDisabled(),true);assert.equal(relay.docs.size,3);
  await activate(page.locator('#save-copy'));await waitForWorkspaceSave(page);record=await raw();assert.ok(record.entries.some(entry=>entry.job.operations.find(op=>op.id==='tap')?.state.md==='20'));assert.ok(record.entries.some(entry=>entry.job.operations.find(op=>op.id==='tap')?.state.md==='21'));await peer.close();

  step='same-device immutable view never shadows edited copies';const beforeView=await readDurableWorkspace(page),cloudBefore=JSON.stringify([...relay.docs]);await page.goto(link);await waitText('modern-view-status','View only');assert.equal(await readDurableWorkspace(page),beforeView);assert.equal(await page.locator('#modern-view-content [data-modern-operation]').count(),4);assert.equal(await page.locator('#shared-view input,#shared-view select,#shared-view textarea').count(),0);assert.ok((await page.locator('#modern-view-content').textContent()).includes('777'));assert.equal(await page.evaluate(()=>window.fixtureLeak||0),0);assert.equal(await page.locator('#modern-view-content script,#modern-view-content img').count(),0);assert.equal(JSON.stringify([...relay.docs]),cloudBefore);
  for(const theme of ['light','dark']){
   const dark=await page.locator('body').evaluate(body=>body.classList.contains('dark'));if(dark!==(theme==='dark'))await activate(page.locator('#theme'));
   if(mobile)await page.setViewportSize({width:320,height:780});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  assert.equal(await page.locator('#notice').isVisible(),false,'Earlier local recovery notice does not imply a read-only view created a copy');
  if(mobile){await page.screenshot({path:join(profile,'modern-shared-readonly-320.png'),fullPage:true});await page.screenshot({path:join(profile,'modern-shared-readonly-320-viewport.png'),fullPage:false});}
  await context.close();context=null;

  step='fresh anonymous recipient and authorized working copy';await launch({path:mkdtempSync(join(tmpdir(),'tapcalc-modern-recipient-'+engine+'-')),uid:null,nextUser:'bob'});await page.goto(link);await waitText('modern-view-status','Sign in');assert.equal(await page.locator('#modern-view-content [data-modern-operation]').count(),0);const empty=await readDurableWorkspace(page);
  await activate(page.locator('#modern-signin'));await waitText('modern-view-status','View only');assert.equal(await readDurableWorkspace(page),empty,'Authorized link opening alone never saves a working copy');const docsBefore=JSON.stringify([...relay.docs]);
  await activate(page.locator('#modern-make-copy'));await page.waitForFunction(()=>location.hash==='#workspace');await waitForWorkspaceSave(page);const working=await active();assert.notEqual(working.id,original.id);assert.equal(working.sourceId,working.id);assert.deepEqual(working.operations.map(op=>op.state),original.operations.map(op=>op.state));assert.deepEqual(working.original,original.original);assert.equal(working.modernOrigin.cloudId,cloudId);assert.deepEqual(JSON.parse(working.modernOrigin.envelope.payloadJson),JSON.parse(first.item.record.modernSnapshot.payloadJson));assert.equal(JSON.stringify([...relay.docs]),docsBefore);
  await page.locator('#modern-working-origin').waitFor({state:'visible'});await page.locator('[data-field="md"]').fill('999');await waitForWorkspaceSave(page);assert.equal(JSON.stringify([...relay.docs]),docsBefore);assert.equal((await active()).modernOrigin.envelope.payloadJson,working.modernOrigin.envelope.payloadJson);
  assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),sentinel);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
  await context.close();context=null;await relay.close();relay=null;
  console.log('PASS modern sharing '+engine+'/'+device+': unbound default, authenticated local-first immutable snapshots, denied/offline owner-bound retry, late acknowledgement/newer edits, real IDB restart, two-tab conflict recovery, private direct recipient view with no autosave/shadowing, captured history/raw/unknowns, separate working identity/original attribution, native sign-in/out, clipboard-denial fallback, 320px themes; profile '+profile);
 }
}catch(error){console.error('MODERN_SHARING_UI_FAILURE',JSON.stringify({engine,device,step,message:error.message,stack:error.stack,errors:diagnosticErrors}));try{console.error('MODERN_SHARING_PAGE_STATE',JSON.stringify(await page.evaluate(()=>({hash:location.hash,readyState:document.readyState,connection:document.getElementById('connection')?.textContent,modern:document.getElementById('modern-status')?.textContent,save:document.getElementById('save-state')?.textContent,visible:['home','workspace','library','shared-view'].filter(id=>!document.getElementById(id)?.hidden)}))));const path=join(tmpdir(),'modern-sharing-failure-'+engine+'-'+Date.now()+'.png');await page?.screenshot({path,fullPage:true});console.error('MODERN_SHARING_SCREENSHOT',path);}catch{}throw error;}
finally{release?.();await context?.close();await relay?.close();server.kill();}

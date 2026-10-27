import {readDurableWorkspace} from './pre-alpha-workspace-test-helpers.mjs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,extname,join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {BUILD,STORAGE_KEY,normalizeJob} from '../pre-alpha/model.mjs';
import {WORKSPACE_KEY} from '../pre-alpha/workspace-store.mjs';

// Disposable localhost origin only. The baseline comes from Git, not production.
const BASELINE='21bf9b289196c25912f38424573b295209e49e03';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const args=process.argv.slice(2);
if(args.length>1||args.some(arg=>arg!=='--origin-unavailable'))throw new Error('Usage: node tests/pre-alpha-worker-upgrade-ui.mjs [--origin-unavailable]');
const originFailure=args.includes('--origin-unavailable');
const baseline=new Map(),writes=[];
let phase='old',originUnavailable=false;
function source(path){
  if(phase==='old'&&path.startsWith('pre-alpha/')){
    if(!baseline.has(path)){
      const result=spawnSync('git',['show',BASELINE+':'+path],{cwd:root,maxBuffer:20*1024*1024});
      if(result.status!==0)throw new Error('Missing baseline asset: '+path);
      baseline.set(path,result.stdout);
    }
    return baseline.get(path);
  }
  const file=resolve(root,path);
  if(!file.startsWith(resolve(root)+sep))throw new Error('Outside test root');
  return readFileSync(file);
}
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
const server=createServer((request,response)=>{
  if(originUnavailable){request.socket.destroy();return;}
  const url=new URL(request.url,'http://localhost');
  response.setHeader('Cache-Control','no-store');
  response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'");
  if(url.pathname==='/__seed'){
    response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><title>Synthetic worker seed</title>');return;
  }
  if(url.pathname.startsWith('/v1/')){
    if(request.method!=='GET'){writes.push(request.method);response.writeHead(405);response.end();return;}
    response.writeHead(200,{'Content-Type':'application/json'});response.end('{"documents":[]}');return;
  }
  try{
    let path=decodeURIComponent(url.pathname).replace(/^\//,'');
    if(url.pathname.endsWith('/'))path+='index.html';
    let content=source(path);
    if(/\.(?:mjs|js|html|css)$/.test(path)){
      const base='http://127.0.0.1:'+server.address().port;
      content=content.toString().replaceAll('https://firestore.googleapis.com',base);
      if(path==='pre-alpha/firebase-config.js')content=content.replace(/window.TAPCALC_FIREBASE_CONFIG = \{[\s\S]*?\};/,'window.TAPCALC_FIREBASE_CONFIG={apiKey:"fixture",projectId:"demo-tapcalc-test",appId:"fixture"};');
    }
    response.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});response.end(content);
  }catch{response.writeHead(404);response.end();}
});
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  for(const mobile of [true,false]){
    phase='old';
    // PWA durability uses a fresh disk-backed profile, never a user's profile.
    // Ephemeral WebKit CacheStorage can vanish on reload even without an app.
    const profile=mkdtempSync(join(tmpdir(),'tapcalc-worker-'+engine+'-'));
    const options={headless:true,...engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{},...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'allow'};
    let context=await pw[engine].launchPersistentContext(profile,options);
    let page=await context.newPage();const errors=[];
    const observe=()=>page.on('pageerror',error=>errors.push(error.message));observe();
    try{
    const activate=locator=>mobile?locator.tap():locator.click();
    const fixture=normalizeJob({id:'worker-fixture',source:'experimental',record:{jobBundle:{selectedOperationId:'one',sharedState:{jobDescription:'Worker preservation fixture'},operations:[{id:'one',label:'First stop',operationType:'Line Stop',state:{cpStart:'20',cpJbf:'1.25',cpLd:'0.5',cpPt:'2.75',cpLiManualToggle:true,cpLiManual:'99',unknownFuture:{keep:true}}},{id:'two',label:'Second stop',operationType:'Line Stop',state:{lsMd:'47'}}]}}});
    fixture.operations[0].workspaceStage='plug';fixture.operations[1].workspaceStage='stop';
    await page.goto(base+'/__seed');
    await page.evaluate(async({fixture,key})=>{
      localStorage.setItem(key,JSON.stringify({build:'pre-alpha10',activeId:fixture.id,jobs:[fixture]}));
      localStorage.setItem('measurementCardStateV1','live-sentinel');localStorage.setItem('measurementCardHistoryV1','[]');
      await (await caches.open('tapcalc-live-sentinel')).put('/__live-sentinel',new Response('live cache'));
      await (await caches.open('tapcalc-dev-sentinel')).put('/__dev-sentinel',new Response('dev cache'));
    },{fixture,key:STORAGE_KEY});
    const preservedCaches=()=>page.evaluate(async()=>Promise.all(['tapcalc-live-sentinel','tapcalc-dev-sentinel'].map(async(key,index)=>{
      const cache=await caches.open(key),response=await cache.match(index?'/__dev-sentinel':'/__live-sentinel');
      if(!response)throw new Error('Missing sentinel response: '+key+' keys '+JSON.stringify((await cache.keys()).map(request=>request.url)));
      return response.text();
    })));
    assert.deepEqual(await preservedCaches(),['live cache','dev cache']);
    async function controlled(build){
      await page.waitForFunction(build=>navigator.serviceWorker.controller?.scriptURL.endsWith('?v='+build),build,{timeout:30000});
      await page.evaluate(async build=>{
        const registration=await navigator.serviceWorker.getRegistration('./'),worker=registration.active;
        if(!worker.scriptURL.endsWith('?v='+build))throw new Error('Wrong worker version');
        if(worker.state==='activated')return;
        await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(new Error('Worker activation timeout')),30000);
          worker.addEventListener('statechange',()=>{if(worker.state==='activated'){clearTimeout(timeout);resolve();}});
        });
      },build);
    }
    async function waitSaved(){await page.waitForFunction(()=>document.getElementById('save-state').textContent==='Saved on this device');}
    async function value(){return page.locator('[data-field="cpLiManual"]').inputValue();}
    async function load(build){
      const response=await page.goto(base+'/pre-alpha/#workspace');
      if(!response)await page.reload();
      await page.waitForSelector('[data-field="cpLiManual"]');await controlled(build);
      assert.equal(await page.locator('.edition').textContent(),'PRE-ALPHA '+build.slice(-2));
    }
      await load('pre-alpha10');assert.equal(await value(),'99');
      await page.locator('[data-field="cpLiManual"]').fill('100.125');await waitSaved();
      const oldBytes=await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY);
      assert.equal(JSON.parse(oldBytes).jobs[0].operations[0].state.cpLiManual,'100.125');
      phase='new';await load(BUILD);assert.equal(await value(),'100.125');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),oldBytes,'Upgrade must not rewrite legacy saves');
      await page.locator('[data-field="cpLiManual"]').fill('101.125');await waitSaved();
      const cacheKeys=await page.evaluate(()=>caches.keys());
      assert.ok(cacheKeys.includes('tapcalc-pre-alpha-'+BUILD));
      assert.ok(!cacheKeys.includes('tapcalc-pre-alpha-pre-alpha10'),'Old experiment cache is retired: '+JSON.stringify(cacheKeys));
      assert.ok(cacheKeys.includes('tapcalc-live-sentinel')&&cacheKeys.includes('tapcalc-dev-sentinel'));
      assert.ok(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).some(request=>request.url.includes('/workspace-store.mjs?v='+build)),BUILD));
      assert.ok(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).some(request=>request.url.includes('/workspace-database.mjs?v='+build)),BUILD));
      assert.ok(await page.evaluate(async build=>!!await (await caches.open('tapcalc-pre-alpha-'+build)).match(location.href,{ignoreSearch:true}),BUILD),'Navigation is cached before disconnecting');
      if(originFailure)originUnavailable=true;else await context.setOffline(true);
      await page.reload();
      await page.waitForSelector('[data-field="cpLiManual"]');assert.equal(await value(),'101.125');
      if(!originFailure){
        assert.equal(await page.evaluate(()=>navigator.onLine),false,'The browser is genuinely offline');
        const probe=await context.newPage();
        try{await assert.rejects(()=>probe.goto(base+'/__seed'),'Uncached navigation outside the worker must fail offline');}
        finally{await probe.close();}
      }
      await page.locator('[data-field="cpLiManual"]').fill('102.125');await waitSaved();
      await activate(page.locator('.main-nav [data-page="home"]'));assert.ok(await page.locator('#resume-job').isVisible());
      await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="references"]'));
      await page.locator('#reference-category').selectOption('glossary');assert.ok(await page.locator('#reference-content table').count()>0);
      await activate(page.locator('#references [data-page="workspace"]'));assert.equal(await value(),'102.125');
      const upgradedBytes=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
      const durableSnapshot=()=>readDurableWorkspace(page);
      const durableBytes=await durableSnapshot();
      const upgraded=JSON.parse(durableBytes).entries.find(entry=>entry.job.id===fixture.id).job;
      assert.equal(upgraded.operations.length,2);assert.equal(upgraded.selectedOperationId,'one');
      assert.equal(upgraded.operations[0].workspaceStage,'plug');assert.deepEqual(upgraded.operations[0].state.unknownFuture,{keep:true});
      assert.deepEqual(upgraded.original,fixture.original);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),oldBytes);
      // Closing and reopening the isolated profile tests actual disk durability,
      // not just values retained in one live document or browser process.
      await context.close();
      context=await pw[engine].launchPersistentContext(profile,{...options,offline:!originFailure});
      page=await context.newPage();observe();
      await page.goto(base+'/pre-alpha/#workspace');
      await page.waitForSelector('[data-field="cpLiManual"]');await controlled(BUILD);
      assert.equal(await value(),'102.125','Saved measurements survive an offline browser restart');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes);
      assert.equal(await durableSnapshot(),durableBytes);
      originUnavailable=false;await context.setOffline(false);phase='old';await load('pre-alpha10');
      assert.equal(await value(),'100.125','Rollback shows the older version; it cannot read companion saves');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes,'Rollback does not delete upgraded saves');
      // Read directly without modifying or importing code into the old app.
      assert.equal(await durableSnapshot(),durableBytes,'Rollback leaves transactional saves byte-identical');
      phase='new';await load(BUILD);assert.equal(await value(),'102.125','Upgrading again restores companion-only edits');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes);
      assert.equal(await durableSnapshot(),durableBytes);
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'live-sentinel');
      assert.deepEqual(await preservedCaches(),['live cache','dev cache']);
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
      console.log('PASS installed worker '+engine+'/'+(mobile?'phone':'desktop')+': 10 upgrade, '+(originFailure?'origin-unavailable':'browser-offline')+' edit/reload/restart, Home/References, cache isolation, rollback and re-upgrade preserve complete saves; synthetic profile '+profile);
    }finally{originUnavailable=false;await context.close();}
  }
}finally{await new Promise(resolve=>server.close(resolve));}

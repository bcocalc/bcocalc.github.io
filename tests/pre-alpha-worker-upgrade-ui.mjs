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
import {referenceView} from '../pre-alpha/references.mjs';
import {WORKSPACE_KEY} from '../pre-alpha/workspace-store.mjs';

// Disposable localhost origin only. The baseline comes from Git, not production.
const BASELINES=[
  {commit:'21bf9b289196c25912f38424573b295209e49e03',build:'pre-alpha10',transactional:false},
  {commit:'54aec7b984cec1c37ddeea4c5e17c46376473a24',build:'pre-alpha11',transactional:true},
  {commit:'e4e6389988e3f3767108b5b12a900d33e727a5ad',build:'pre-alpha12',transactional:true},
  {commit:'4e247fbebe0bab8cf7185487aa90fd90b0f25741',build:'pre-alpha14',transactional:true},
  {commit:'514157d290faa81714d48892095ad4758b5716a3',build:'pre-alpha16',transactional:true},
  {commit:'b1c87408a9d77e3937d7872555b22f0f89776e83',build:'pre-alpha17',transactional:true}
];
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const args=process.argv.slice(2);
if(args.length>1||args.some(arg=>arg!=='--origin-unavailable'))throw new Error('Usage: node tests/pre-alpha-worker-upgrade-ui.mjs [--origin-unavailable]');
const originFailure=args.includes('--origin-unavailable');
const baseline=new Map(),writes=[];
let phase='old',originUnavailable=false,currentBaseline=BASELINES[0];
function source(path){
  if(phase==='old'&&path.startsWith('pre-alpha/')){
    const key=currentBaseline.commit+':'+path;
    if(!baseline.has(key)){
      const result=spawnSync('git',['show',key],{cwd:root,maxBuffer:20*1024*1024});
      if(result.status!==0)throw new Error('Missing baseline asset: '+key);
      baseline.set(key,result.stdout);
    }
    return baseline.get(key);
  }
  const file=resolve(root,path);
  if(!file.startsWith(resolve(root)+sep))throw new Error('Outside test root');
  return readFileSync(file);
}
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};
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
  const cases=BASELINES.flatMap(baselineCase=>[true,false].map(mobile=>({baselineCase,mobile})));
  for(const {baselineCase,mobile} of cases){
    currentBaseline=baselineCase;
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
    const tapState={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6.625',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ptc:'1',start:'2',mt:'52',unknownFuture:{keep:['all',3]}};
    const fixture=normalizeJob({id:'worker-fixture',source:'experimental',record:{jobBundle:{selectedOperationId:'one',sharedState:{jobDescription:'Worker preservation fixture'},operations:[{id:'one',label:'First stop',operationType:'Line Stop',state:{cpStart:'20',cpJbf:'1.25',cpLd:'0.5',cpPt:'2.75',cpLiManualToggle:true,cpLiManual:'99',unknownFuture:{keep:true}}},{id:'two',label:'Second stop',operationType:'Line Stop',state:{lsMd:'47'}},{id:'missing',label:'Missing LD',operationType:'Hot Tap',state:tapState},{id:'empty',label:'Empty LD',operationType:'Hot Tap',state:{...tapState,ld:''}}]}}});
    fixture.operations[0].workspaceStage='plug';fixture.operations[1].workspaceStage='stop';
    for(const op of fixture.operations.slice(2))op.workspaceStage='tap';
    const assertBundle=job=>{
      assert.deepEqual(job.operations.map(op=>op.id),fixture.operations.map(op=>op.id),'Every operation survives the installed-worker transition');
      assert.deepEqual(job.original,fixture.original);
      assert.deepEqual(job.operations[0].state.unknownFuture,{keep:true});
      assert.deepEqual(job.operations[1].state,fixture.operations[1].state);
      for(const id of ['missing','empty'])assert.deepEqual(job.operations.find(op=>op.id===id).state,fixture.operations.find(op=>op.id===id).state,'Blank LD defaults never fabricate or normalize saved inputs');
      assert.equal(Object.hasOwn(job.operations.find(op=>op.id==='missing').state,'ld'),false);
      assert.equal(job.operations.find(op=>op.id==='empty').state.ld,'');
    };
    assertBundle(fixture);
    await page.goto(base+'/__seed');
    await page.evaluate(async({fixture,key,build})=>{
      localStorage.setItem(key,JSON.stringify({build,activeId:fixture.id,jobs:[fixture]}));
      localStorage.setItem('measurementCardStateV1','live-sentinel');localStorage.setItem('measurementCardHistoryV1','[]');
      await (await caches.open('tapcalc-live-sentinel')).put('/__live-sentinel',new Response('live cache'));
      await (await caches.open('tapcalc-dev-sentinel')).put('/__dev-sentinel',new Response('dev cache'));
    },{fixture,key:STORAGE_KEY,build:baselineCase.build});
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
      assert.equal(await page.locator('.edition').textContent(),'PRE-ALPHA '+build.replace('pre-alpha',''));
    }
    const durableSnapshot=()=>readDurableWorkspace(page);
    const durableJob=raw=>JSON.parse(raw).entries.find(entry=>entry.job.id===fixture.id).job;
    async function checkOfflineHelp(){
      const before=await durableSnapshot();
      const guide=page.locator('[data-measurement-guidance="plug"]');
      assert.equal(await guide.evaluate(node=>node.open),false);
      await activate(guide.locator(':scope > summary'));
      for(const img of await guide.locator('img').all()){
        await img.waitFor({state:'visible'});await img.scrollIntoViewIfNeeded();
        await page.waitForFunction(key=>{const node=document.querySelector('img[data-measurement-figure="'+key+'"]');return node?.complete&&node.naturalWidth>0;},await img.getAttribute('data-measurement-figure'));
      }
      assert.equal(await guide.locator('img').count(),2,'Both exact plug crops remain available offline');
      assert.match(await guide.innerText(),/TEAM, Inc\. All rights reserved/);
      assert.match(await guide.innerText(),/Revision A, 15MAY18/);
      assert.match(await guide.innerText(),/no formal erratum/);
      await activate(guide.locator(':scope > summary'));
      assert.equal(await durableSnapshot(),before,'Offline help cannot change saved measurements');
    }
    async function checkBlankLd(){
      for(const id of ['missing','empty']){
        await activate(page.locator('[data-operation="'+id+'"]'));
        await activate(page.locator('[data-step="tap"]'));await waitSaved();
        assert.equal(await page.locator('[data-field="ld"]').inputValue(),'');
        assert.equal(await page.locator('[data-value-origin="ld"]').textContent(),'Default 0 - not entered');
        assert.equal(await page.locator('#results .result-panel:not(.bco-eta-panel) .big-value').textContent(),'12.0000 in');
        assertBundle(durableJob(await durableSnapshot()));
      }
      await activate(page.locator('[data-operation="one"]'));await waitSaved();
      await page.locator('[data-field="cpLiManual"]').waitFor({state:'visible'});
    }
    async function warmOriginals(){
      const before=await durableSnapshot();
      assert.equal(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).filter(r=>r.url.includes('/measurement-figures/')).length,BUILD),0,'Installing17 does not prefetch original figures');
      for(const stage of ['tap','plug']){
        await activate(page.locator('[data-step="'+stage+'"]'));await waitSaved();
        const guide=page.locator('[data-measurement-guidance="'+stage+'"]');await activate(guide.locator(':scope > summary'));
        for(const img of await guide.locator('img').all()){
          await img.waitFor({state:'visible'});await img.scrollIntoViewIfNeeded();
          await page.waitForFunction(key=>{const node=document.querySelector('img[data-measurement-figure="'+key+'"]');return node?.complete&&node.naturalWidth>0;},await img.getAttribute('data-measurement-figure'));
        }
        await activate(guide.locator(':scope > summary'));
      }
      await page.waitForFunction(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).filter(r=>r.url.includes('/measurement-figures/')).length===5,BUILD);
      const prior=durableJob(before),after=durableJob(await durableSnapshot());
      assert.deepEqual(after.operations.map(op=>op.state),prior.operations.map(op=>op.state));assert.deepEqual(after.original,prior.original);
    }
      await load(baselineCase.build);assert.equal(await value(),'99');
      await page.locator('[data-field="cpLiManual"]').fill('100.125');await waitSaved();
      const oldBytes=await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY);
      const oldCompanionBytes=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
      const oldDurableBytes=baselineCase.transactional?await durableSnapshot():null;
      const oldJob=baselineCase.transactional?durableJob(oldDurableBytes):JSON.parse(oldBytes).jobs[0];
      assert.equal(oldJob.operations[0].state.cpLiManual,'100.125');assertBundle(oldJob);
      // A stale cache name is not a substitute for the unavailable private13 source.
      // Seed after the old worker activates so only the new worker retires it.
      await page.evaluate(async()=>{
        const cache=await caches.open('tapcalc-pre-alpha-pre-alpha13');
        await cache.put('/pre-alpha/__synthetic-stale13',new Response('synthetic stale cache, not private source'));
      });
      phase='new';await load(BUILD);assert.equal(await value(),'100.125');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),oldBytes,'Upgrade must not rewrite legacy saves');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),oldCompanionBytes);
      if(baselineCase.transactional)assert.equal(await durableSnapshot(),oldDurableBytes,'Opening the new build must not rewrite the transactional baseline record');
      await checkBlankLd();
      await warmOriginals();
      await page.locator('[data-field="cpLiManual"]').fill('101.125');await waitSaved();
      const cacheKeys=await page.evaluate(()=>caches.keys());
      assert.ok(cacheKeys.includes('tapcalc-pre-alpha-'+BUILD));
      assert.ok(!cacheKeys.includes('tapcalc-pre-alpha-pre-alpha13'),'Stale13 cache is retired without reusing its identity');
      for(const asset of ['references.mjs','workspace.css'])assert.ok(await page.evaluate(async({build,asset})=>
        !!await (await caches.open('tapcalc-pre-alpha-'+build)).match(new URL('./'+asset+'?v='+build,location.href).href),
        {build:BUILD,asset}),'Current reference asset is cached: '+asset);
      assert.ok(!cacheKeys.includes('tapcalc-pre-alpha-'+baselineCase.build),'Old experiment cache is retired: '+JSON.stringify(cacheKeys));
      assert.ok(cacheKeys.includes('tapcalc-live-sentinel')&&cacheKeys.includes('tapcalc-dev-sentinel'));
      assert.ok(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).some(request=>request.url.includes('/workspace-store.mjs?v='+build)),BUILD));
      assert.ok(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).some(request=>request.url.includes('/workspace-database.mjs?v='+build)),BUILD));
      assert.ok(await page.evaluate(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).some(request=>request.url.includes('/measurement-help.mjs?v='+build)),BUILD));
      assert.ok(await page.evaluate(async build=>!!await (await caches.open('tapcalc-pre-alpha-'+build)).match(location.href,{ignoreSearch:true}),BUILD),'Navigation is cached before disconnecting');
      if(originFailure)originUnavailable=true;else await context.setOffline(true);
      await page.reload();
      await page.waitForSelector('[data-field="cpLiManual"]');assert.equal(await value(),'101.125');
      await checkOfflineHelp();
      if(!originFailure){
        assert.equal(await page.evaluate(()=>navigator.onLine),false,'The browser is genuinely offline');
        const probe=await context.newPage();
        try{await assert.rejects(()=>probe.goto(base+'/__seed'),'Uncached navigation outside the worker must fail offline');}
        finally{await probe.close();}
      }
      await page.locator('[data-field="cpLiManual"]').fill('102.125');await waitSaved();
      await checkBlankLd();assert.equal(await value(),'102.125');
      await activate(page.locator('.main-nav [data-page="home"]'));assert.ok(await page.locator('#resume-job').isVisible());
      await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="references"]'));
      await page.locator('#reference-category').selectOption('glossary');assert.ok(await page.locator('#reference-content table').count()>0);
      await page.locator('#reference-category').selectOption('papergaskets');
      await page.locator('[data-ref-filter="size"]').selectOption('12');
      await page.locator('[data-ref-filter="rating"]').selectOption('150');
      const expected=referenceView('papergaskets',{size:'12',rating:'150'}).tables[0];
      const card=page.locator('.reference-row-card').first();
      assert.deepEqual(await card.locator('dt').allTextContents(),expected.columns);
      assert.deepEqual(await card.locator('dd').allTextContents(),expected.rows[0].map(v=>String(v===''?'Not listed':v)));
      assert.equal(await card.isVisible(),mobile,'Offline reference layout matches device width');
      assert.equal(await page.locator('.reference-table-wrap').first().isVisible(),!mobile);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Offline reference page does not widen');
      assert.match(await page.locator('[data-reference-qualification]').innerText(),/not verified for your Durlon grade/);
      if(mobile){
        await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
        const source=await card.locator('div').last().boundingBox(),nav=await page.locator('.main-nav').boundingBox();
        assert.ok(source&&nav&&source.y>=0&&source.y+source.height<=nav.y,'Offline source row clears fixed navigation');
      }
      await activate(page.locator('#references [data-page="workspace"]'));assert.equal(await value(),'102.125');
      const upgradedBytes=await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY);
      const durableBytes=await durableSnapshot();
      const upgraded=durableJob(durableBytes);assertBundle(upgraded);
      assert.equal(upgraded.operations.length,4);assert.equal(upgraded.selectedOperationId,'one');
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
      await checkOfflineHelp();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes);
      assert.equal(await durableSnapshot(),durableBytes);
      originUnavailable=false;await context.setOffline(false);phase='old';await load(baselineCase.build);
      assert.equal(await value(),baselineCase.transactional?'102.125':'100.125',baselineCase.transactional?'Transactional baseline rollback reads the same saves':'Published10 rollback shows older legacy data; upgraded edits remain preserved separately');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes,'Rollback does not delete upgraded saves');
      // Read directly without modifying or importing code into the old app.
      assert.equal(await durableSnapshot(),durableBytes,'Rollback leaves transactional saves byte-identical');
      phase='new';await load(BUILD);assert.equal(await value(),'102.125','Upgrading again restores companion-only edits');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),upgradedBytes);
      assert.equal(await durableSnapshot(),durableBytes);
      assertBundle(durableJob(await durableSnapshot()));
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),oldBytes);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),oldCompanionBytes);
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'live-sentinel');
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),'[]');
      assert.deepEqual(await preservedCaches(),['live cache','dev cache']);
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
      console.log('PASS installed worker '+engine+'/'+(mobile?'phone':'desktop')+': '+baselineCase.build+' to '+BUILD+', '+(originFailure?'origin-unavailable':'browser-offline')+' edit/reload/restart, approved help offline, missing/empty LD without fabrication, complete4-operation bundles, offline reference cards, synthetic stale13 cache retirement, old bytes/cache isolation, rollback and re-upgrade; synthetic profile '+profile);
    }finally{originUnavailable=false;await context.close();}
  }
}finally{await new Promise(resolve=>server.close(resolve));}

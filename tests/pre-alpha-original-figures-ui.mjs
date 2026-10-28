import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,resolve,sep,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {MEASUREMENT_FIGURES} from '../pre-alpha/measurement-figures.mjs';
import {BUILD} from '../pre-alpha/model.mjs';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium',hits=[],writes=[],offlineProbes=[];
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp'};
const server=createServer((request,response)=>{
  if(request.method!=='GET'){writes.push(request.method);response.writeHead(405);response.end();return;}
  const url=new URL(request.url,'http://127.0.0.1');
  if(url.pathname==='/offline-probe'){offlineProbes.push(url.pathname);response.end('Uncached network probe');return;}
  if(url.pathname.startsWith('/v1/')){response.writeHead(200,{'Content-Type':'application/json'});response.end('{"documents":[]}');return;}
  try{
    const path=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname,file=resolve(root,'.'+decodeURIComponent(path));
    if(!file.startsWith(resolve(root)+sep))throw Error('Outside fixture');
    let body=readFileSync(file);
    if(/\.(?:js|mjs)$/.test(file))body=Buffer.from(body.toString().replaceAll('https://firestore.googleapis.com','http://127.0.0.1:'+server.address().port));
    if(path.endsWith('.webp'))hits.push({file:path.split('/').pop(),bytes:body.length});
    response.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});response.end(body);
  }catch{response.writeHead(404);response.end();}
});
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1',start:'2',mt:'52',lsMd:'10',lsLd:'0',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3',future:{retain:[1,2]}};
const entry={id:'original-figures',record:{measurements:{hotTap:{mco:'99'}},jobBundle:{sharedState:{jobDescription:'Synthetic original figures'},selectedOperationId:'one',operations:[{id:'one',label:'Stop one',operationType:'Line Stop',state},{id:'two',label:'Tap two',operationType:'Hot Tap',state:{...state,ptc:'1 1/4'}}]}}};
const history=JSON.stringify([entry]),sentinel='{"keep":"original-figure live draft"}';
let context,page,device;
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  for(const mobile of [true,false]){
    device=mobile?'phone':'desktop';const start=hits.length,errors=[],profile=mkdtempSync(join(tmpdir(),'tapcalc-originals-'+engine+'-'));
    const options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'allow'};
    const activate=locator=>mobile?locator.tap():locator.click();
    async function launch(offline=false){
      context=await pw[engine].launchPersistentContext(profile,{...options,offline});
      await context.addInitScript(({history,sentinel})=>{if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);}},{history,sentinel});
      if(process.env.TAPCALC_FIGURE_DIAGNOSTICS==='1')await context.addInitScript(()=>{
        const trace=[];window.__figureTrace=trace;
        const record=event=>{
          const dialog=document.getElementById('measurement-figure-dialog'),image=document.getElementById('original-figure-image');
          trace.push({event,time:performance.now(),open:dialog?.open,focus:document.activeElement?.id||document.activeElement?.dataset.figureOpen,src:image?.getAttribute('src'),complete:image?.complete,width:image?.naturalWidth,hidden:image?.hidden});
          if(trace.length>120)trace.shift();
        };
        for(const type of ['click','keydown','close','cancel','load','error','focusin'])document.addEventListener(type,event=>{
          if(event.target.closest?.('#measurement-figure-dialog,[data-figure-open]'))record(type+':'+(event.key||event.target.id||event.target.dataset.figureOpen));
        },true);
        addEventListener('DOMContentLoaded',()=>{
          const dialog=document.getElementById('measurement-figure-dialog');
          new MutationObserver(records=>record('mutation:'+records.map(r=>r.target.id+'.'+r.attributeName).join(','))).observe(dialog,{attributes:true,subtree:true,attributeFilter:['open','src','hidden','aria-pressed']});
        });
      });
      page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
    }
    const guide=()=>page.locator('[data-measurement-guidance]');
    async function verifyOffline(){
      // Service-worker navigation can reset Chromium's renderer online flag.
      // Repeated context.setOffline(true) is a Playwright same-state no-op.
      // Apply real network emulation to the new page session; never spoof DOM state.
      if(engine==='chromium'){
        const session=await context.newCDPSession(page);
        await session.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
      }
      assert.equal(await page.evaluate(()=>navigator.onLine),false);
      const probe=await context.newPage();
      try{await assert.rejects(()=>probe.goto(base+'/offline-probe'),/offline|ERR_INTERNET_DISCONNECTED/i);}
      finally{await probe.close();}
      assert.deepEqual(offlineProbes,[],'Uncached request outside the worker scope never reaches the server');
    }
    async function open(stage){await activate(page.locator('[data-step="'+stage+'"]'));await waitForWorkspaceSave(page);await activate(guide().locator(':scope > summary'));}
    async function loaded(img,key){
      await img.waitFor({state:'visible'});await img.scrollIntoViewIfNeeded();
      await page.waitForFunction(({key,w,h})=>{const node=document.querySelector('[data-measurement-guidance] img[data-measurement-figure="'+key+'"]');return node?.complete&&node.naturalWidth===w&&node.naturalHeight===h;},{key,w:MEASUREMENT_FIGURES[key].width,h:MEASUREMENT_FIGURES[key].height});
    }
    async function viewer(key){
      const button=page.locator('[data-figure-open="'+key+'"]');
      if(mobile)await button.tap();else{await button.focus();await button.press('Enter');}
      const dialog=page.locator('#measurement-figure-dialog'),img=dialog.locator('img'),pan=dialog.locator('.figure-pan'),f=MEASUREMENT_FIGURES[key];
      await dialog.waitFor({state:'visible'});await page.waitForFunction(({w,h})=>{const n=document.getElementById('original-figure-image');return n.complete&&n.naturalWidth===w&&n.naturalHeight===h;},{w:f.width,h:f.height});
      assert.equal(await img.getAttribute('src'),'./measurement-figures/'+f.file+'?v='+BUILD,'Each opening selects its own original, not the last image');
      assert.equal(await img.getAttribute('alt'),f.alt);assert.equal(await dialog.locator('#original-figure-title').textContent(),f.title);
      assert.match(await dialog.innerText(),/TEAM, Inc\. All rights reserved\. Governing revision not recorded/);
      assert.ok(Math.abs((await img.boundingBox()).width-f.width)<1,'Actual-size figure keeps source labels at native pixel size');
      const geometry=await pan.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight}));
      if(geometry.scroll>geometry.width+1){await pan.focus();await pan.press('ArrowRight');await page.waitForFunction(()=>document.getElementById('original-figure-pan').scrollLeft>0);}
      if(geometry.scrollHeight>geometry.height+1){await pan.focus();await pan.press('ArrowDown');await page.waitForFunction(()=>document.getElementById('original-figure-pan').scrollTop>0);}
      const theme=await page.locator('body').evaluate(n=>n.classList.contains('dark')?'dark':'light');
      await dialog.screenshot({path:join(tmpdir(),'pre-alpha22-viewer-native-'+engine+'-'+device+'-'+key+'-'+theme+'.png')});
      await activate(dialog.locator('#original-figure-fit'));assert.equal(await dialog.locator('#original-figure-fit').getAttribute('aria-pressed'),'true');
      assert.ok((await img.boundingBox()).width<=await pan.evaluate(n=>n.clientWidth)+1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await dialog.screenshot({path:join(tmpdir(),'pre-alpha22-viewer-'+engine+'-'+device+'-'+key+'-'+theme+'.png')});
      await activate(dialog.locator('#original-figure-fit'));assert.equal(await dialog.locator('#original-figure-fit').getAttribute('aria-pressed'),'false');
      assert.ok(Math.abs((await img.boundingBox()).width-f.width)<1,'Actual-size toggle restores native label size');
      if(key==='plant-pt'){
        const audit=async label=>{
          const layout=await dialog.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,viewport:innerWidth,client:n.clientWidth,scroll:n.scrollWidth};});
          console.log('FIGURE_READABILITY',JSON.stringify({engine,device,theme,label,...layout}));
          assert.ok(layout.x>=0&&layout.right<=layout.viewport+1,'The complete dialog fits the viewport at '+label);
          assert.ok(layout.scroll<=layout.client+1,'Only the original image pan region may scroll horizontally at '+label);
        };
        await page.evaluate(()=>document.body.style.zoom='2');await audit('200% layout zoom');
        await page.evaluate(()=>{
          document.body.style.zoom='';
          document.querySelectorAll('#measurement-figure-dialog :is(h2,p,small,button)').forEach(n=>{n.style.fontSize=parseFloat(getComputedStyle(n).fontSize)*2+'px';});
        });await audit('200% text');
        await page.evaluate(()=>document.querySelectorAll('#measurement-figure-dialog :is(h2,p,small,button)').forEach(n=>n.style.fontSize=''));
      }
      if(mobile?key==='tap-positive-ld':key!=='tap-positive-ld')await page.keyboard.press('Escape');else await activate(dialog.locator('#original-figure-close'));
      await dialog.waitFor({state:'hidden'});assert.equal(await button.evaluate(node=>node===document.activeElement),true);assert.equal(await img.getAttribute('src'),null);
    }
    await launch();
    try{
      await page.goto(base+'/pre-alpha/');await page.locator('#home-new-job').waitFor({state:'visible'});
      await page.waitForFunction(()=>document.getElementById('connection')?.textContent.includes('Connected'));
      await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="device"]'));await activate(page.locator('.job-card'));
      await activate(page.locator('[data-step="tap"]'));await waitForWorkspaceSave(page);
      await page.waitForFunction(build=>navigator.serviceWorker.controller?.scriptURL.endsWith('?v='+build),BUILD);
      assert.equal(hits.length,start,'Installation and collapsed guide download zero original images');
      for(const img of await guide().locator('img').all())assert.equal(await img.getAttribute('src'),null);
      const originalBytes=await readDurableWorkspace(page),outputs=await page.locator('#results').textContent();
      await context.setOffline(true);await activate(guide().locator(':scope > summary'));
      for(const key of ['tap-md','tap-positive-ld','tap-negative-ld']){
        const card=page.locator('[data-datum="'+key+'"]');await card.scrollIntoViewIfNeeded();
        await card.locator('.figure-error').waitFor({state:'visible'});assert.match(await card.innerText(),/Figure unavailable.*Text equivalent/s);
      }
      assert.equal(await readDurableWorkspace(page),originalBytes);assert.equal(await page.locator('#results').textContent(),outputs);assert.equal(hits.length,start);
      const missingButton=page.locator('[data-figure-open="tap-md"]'),dialog=page.locator('#measurement-figure-dialog');
      await activate(missingButton);await dialog.locator('.figure-error').waitFor({state:'visible'});
      assert.match(await dialog.locator('.figure-error').innerText(),/Figure unavailable.*Text equivalent: MD arrow/s);
      assert.equal(await dialog.locator('img').isVisible(),false);assert.equal(await readDurableWorkspace(page),originalBytes);
      await activate(dialog.locator('#original-figure-close'));assert.equal(await missingButton.evaluate(n=>n===document.activeElement),true);
      await activate(guide().locator(':scope > summary'));await context.setOffline(false);await activate(guide().locator(':scope > summary'));
      for(const key of ['tap-md','tap-positive-ld','tap-negative-ld'])await loaded(guide().locator('img[data-measurement-figure="'+key+'"]'),key);
      assert.equal(hits.length-start,3,'Only the3 relevant Hot Tap originals load on intent');
      if(mobile)await page.setViewportSize({width:320,height:780});
      for(const key of ['tap-md','tap-positive-ld','tap-negative-ld'])await viewer(key);
      await open('stop');assert.equal(await guide().locator('img').count(),0);assert.match(await guide().innerText(),/LD\/WD, not MD/);assert.equal(hits.length-start,3);
      await open('plug');
      for(const key of ['plant-pt','pipeline-pt'])await loaded(guide().locator('img[data-measurement-figure="'+key+'"]'),key);
      for(const dark of [false,true]){
        if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
        for(const width of mobile?[320,375,390,430]:[1280]){
          await page.setViewportSize({width,height:780});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          for(const img of await guide().locator('img').all()){
            const d=await img.evaluate(node=>({w:node.clientWidth,h:node.clientHeight,nw:node.naturalWidth,nh:node.naturalHeight,filter:getComputedStyle(node).filter}));
            assert.ok(Math.abs(d.w/d.h-d.nw/d.nh)<0.03);assert.equal(d.filter,'none');
          }
        }
        if(mobile)await page.setViewportSize({width:320,height:780});
        await viewer('plant-pt');await viewer('pipeline-pt');
        await page.screenshot({path:join(tmpdir(),'pre-alpha22-originals-'+engine+'-'+device+'-'+(dark?'dark':'light')+'.png'),fullPage:true});
      }
      assert.equal(hits.length-start,5,'Repeated large views use runtime cache instead of downloading again');
      assert.equal(hits.slice(start).reduce((n,item)=>n+item.bytes,0),87242);
      await page.waitForFunction(async build=>(await (await caches.open('tapcalc-pre-alpha-'+build)).keys()).filter(r=>r.url.includes('/measurement-figures/')).length===5,BUILD);
      await waitForWorkspaceSave(page);const saved=await readDurableWorkspace(page),job=JSON.parse(saved).entries[0].job;
      assert.equal(job.operations.length,2);assert.deepEqual(job.operations.map(o=>o.state),entry.record.jobBundle.operations.map(o=>o.state));assert.deepEqual(job.original.record,entry.record);
      await context.setOffline(true);await page.reload();await guide().waitFor({state:'visible'});
      await verifyOffline();
      assert.equal(await guide().evaluate(n=>n.open),false);await activate(guide().locator(':scope > summary'));
      for(const key of ['plant-pt','pipeline-pt'])await loaded(guide().locator('img[data-measurement-figure="'+key+'"]'),key);
      await viewer('pipeline-pt');assert.equal(await readDurableWorkspace(page),saved);
      await context.close();await launch(true);await page.goto(base+'/pre-alpha/#workspace');await guide().waitFor({state:'visible'});
      await verifyOffline();
      assert.equal(await page.evaluate(()=>navigator.onLine),false);assert.equal(await readDurableWorkspace(page),saved);
      await activate(guide().locator(':scope > summary'));for(const key of ['plant-pt','pipeline-pt'])await loaded(guide().locator('img[data-measurement-figure="'+key+'"]'),key);
      await viewer('plant-pt');assert.equal(await readDurableWorkspace(page),saved);
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),sentinel);
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.equal(hits.length-start,5);
      console.log('PASS original figures '+engine+'/'+device+': initial0 bitmaps; intent3 Hot Tap then2 plug/87242 bytes; qualified Line Stop MD; complete aspect ratios, signed captions/source/copyright/alt, native actual-size pan/fit/keyboard/Escape/focus,320-430px light/dark, cold-offline text fallback, cache-only repeat views, offline save/reload/browser restart and complete original/bundle/live-key preservation');
    }catch(error){try{
      console.error('ORIGINAL_FIGURES_DIAGNOSTICS',JSON.stringify(await page.evaluate(()=>({trace:window.__figureTrace,focus:document.activeElement?.outerHTML,dialog:document.getElementById('measurement-figure-dialog')?.outerHTML,viewport:{width:innerWidth,height:innerHeight,zoom:document.body.style.zoom}}))));
      const path=join(tmpdir(),'pre-alpha22-originals-failure-'+engine+'-'+device+'-'+Date.now()+'.png');await page.screenshot({path,fullPage:true});console.error('Screenshot: '+path);
    }catch{}throw error;}
    finally{await context?.close();}
  }
}catch(error){console.error('ORIGINAL_FIGURES_FAILURE',JSON.stringify({engine,device,message:error.message,stack:error.stack}));throw error;}
finally{await context?.close();server.close();}

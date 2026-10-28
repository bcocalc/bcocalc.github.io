import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForWorkspaceSave,readWorkspaceSnapshot} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ptc:'1',start:'-1',mt:'52',lsMd:'10',lsLd:'2',lsLdSign:'-',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3',unknown:{keep:[1,2]}};
const history=JSON.stringify([{id:'help',record:{jobBundle:{sharedState:{jobDescription:'Measurement help fixture'},selectedOperationId:'one',operations:[{id:'one',label:'Stop one',operationType:'Line Stop',state}]}}}]);
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let browser;
try{
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview timeout')),10000);server.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.once('error',reject);});
  browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{})});
  for(const mobile of [true,false]){
    const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}},serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],writes=[],pdfs=[];
    page.setDefaultTimeout(15000);
    const activate=locator=>mobile?locator.tap():locator.click();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/\.pdf(?:\?|$)/i.test(request.url()))pdfs.push(request.url());});
    await page.route('**/v1/**',async route=>{if(route.request().method()!=='GET')writes.push(route.request().method());await route.fulfill({json:{documents:[]}});});
    await page.addInitScript(history=>{if(!localStorage.getItem('measurementCardHistoryV1'))localStorage.setItem('measurementCardHistoryV1',history);},history);
    await page.goto(base+'/pre-alpha/');
    assert.equal(await page.locator('.edition').textContent(),'PRE-ALPHA 19');
    assert.equal(await page.locator('#local-private-preview').count(),0,'Public candidate must not ship local-only prototype scaffolding');
    await page.waitForFunction(()=>document.getElementById('connection').textContent.includes('Connected'));
    await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="device"]'));await activate(page.locator('.job-card'));
    await waitForWorkspaceSave(page);
    const initial=await readWorkspaceSnapshot(page),initialJob=initial.jobs.find(j=>j.id===initial.activeId);
    for(const [stage,figures] of [['tap',3],['stop',0],['plug',2]]){
      await activate(page.locator('[data-step="'+stage+'"]'));
      const guide=page.locator('[data-measurement-guidance="'+stage+'"]'),summary=guide.locator(':scope > summary');
      assert.equal(await guide.count(),1);assert.equal(await guide.evaluate(node=>node.open),false);
      assert.ok(await guide.evaluate(node=>node.getBoundingClientRect().height<100),'Collapsed guidance must stay compact');
      assert.equal(await guide.locator('svg').count(),0);
      assert.equal(await guide.locator('img').count(),figures);
      for(const img of await guide.locator('img').all())assert.equal(await img.getAttribute('src'),null);
      const before=await page.locator('#results').textContent();
      await summary.focus();await summary.press('Enter');assert.equal(await guide.evaluate(node=>node.open),true);
      for(const img of await guide.locator('img').all()){
        await img.waitFor({state:'visible'});await img.scrollIntoViewIfNeeded();
        await img.evaluate(node=>new Promise((resolve,reject)=>{if(node.complete&&node.naturalWidth)return resolve();node.addEventListener('load',resolve,{once:true});node.addEventListener('error',()=>reject(Error('Approved image failed to load')),{once:true});}));
        assert.ok((await img.getAttribute('alt')).length>30);
        assert.match(await img.getAttribute('src'),/measurement-figures\/[^/]+\.webp\?v=pre-alpha19$/);
      }
      if(figures)assert.match(await guide.innerText(),/TEAM, Inc\. All rights reserved/);
      if(stage==='stop')assert.match(await guide.innerText(),/LD\/WD, not MD/);
      assert.match(await guide.innerText(),/Revision not recorded/);
      if(stage==='tap')assert.match(await guide.locator('[data-datum="tap-start"]').innerText(),/no common Start datum/);
      if(stage==='plug'){
        assert.match(await guide.innerText(),/not certified for any family/);
        const segmented=await guide.locator('[data-datum="pipeline-jbf"]').innerText();
        assert.match(segmented,/extended retention segment/);
        assert.match(segmented,/not a Plant jack-bolt centerline/);
        assert.match(segmented,/p\.22.*inconsistent.*no formal erratum/);
        assert.match(segmented,/Revision A, 15MAY18/);
        assert.match(segmented,/printed p\.27; PDF p\.28/);
        assert.match(await guide.innerText(),/Segment indexing and the later plug-thickness advance are separate/);
        assert.match(await guide.locator('[data-datum="pipeline-pt"]').innerText(),/segment groove/);
      }
      for(const theme of ['light','dark']){
        if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==(theme==='dark'))await activate(page.locator('#theme'));
        if(mobile)await page.setViewportSize({width:320,height:780});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await guide.scrollIntoViewIfNeeded();
        await page.screenshot({path:join(tmpdir(),'pre-alpha-measurement-help-'+engine+'-'+(mobile?'phone':'desktop')+'-'+stage+'-'+theme+'.png')});
      }
      assert.equal(await page.locator('#results').textContent(),before,'Opening help must not change outputs or warnings');
      await activate(summary);assert.equal(await guide.evaluate(node=>node.open),false);
      assert.ok(await summary.evaluate(node=>node.getBoundingClientRect().height>=44));
    }
    await waitForWorkspaceSave(page);
    const saved=await readWorkspaceSnapshot(page),savedJob=saved.jobs.find(j=>j.id===saved.activeId);
    assert.deepEqual(savedJob.operations[0].state,initialJob.operations[0].state);
    assert.deepEqual(savedJob.original,initialJob.original);
    await page.reload();await page.locator('[data-measurement-guidance="plug"]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-measurement-guidance]').evaluate(node=>node.open),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(pdfs,[]);
    console.log('PASS measurement help '+engine+'/'+(mobile?'phone':'desktop')+': collapsed native keyboard/touch guidance, exact original figures and qualified Line Stop MD text, copyright/source/family distinctions, 320px themes, no private PDF requests and unchanged saved inputs/results');
    await context.close();
  }
}finally{await browser?.close();server.kill();}

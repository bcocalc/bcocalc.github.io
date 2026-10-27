import {readDurableWorkspace,readWorkspaceSnapshot,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
import {WORKSPACE_KEY} from '../pre-alpha/workspace-store.mjs';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {normalizeJob,STORAGE_KEY} from '../pre-alpha/model.mjs';

export async function runHomeChecks({browser,pw,base,mobile,engine}){
  const job=normalizeJob({id:'home-ui',source:'experimental',record:{jobBundle:{selectedOperationId:'stop',sharedState:{jobDescription:'Home preservation fixture'},operations:[{id:'tap',label:'First tap',operationType:'Hot Tap',state:{md:'11'}},{id:'stop',label:'Second stop',operationType:'Line Stop',state:{md:'22',lsMd:'24',lineStopMdUserEdited:true,lsLiManualToggle:true,lsLiManual:'88',cpLiManualToggle:true,cpLiManual:'99',etaRpmOverride:'42',unknownFuture:{keep:true}}}]}}});
  job.operations[0].workspaceStage='tap';job.operations[1].workspaceStage='plug';
  for(const returning of [false,true]){
    const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],writes=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/v1/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().method());return route.fulfill({json:{documents:[]}});});
    await page.addInitScript(({job,key,returning})=>{
      if(returning&&!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({build:'pre-alpha10',activeId:job.id,jobs:[job]}));
      if(!localStorage.getItem('measurementCardStateV1'))localStorage.setItem('measurementCardStateV1','{"keep":"home-fixture"}');
    },{job,key:STORAGE_KEY,returning});
    const activate=locator=>mobile?locator.tap():locator.click();
    const snapshot=async()=>{await waitForWorkspaceSave(page);return JSON.stringify([...await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),[STORAGE_KEY,WORKSPACE_KEY]),await readDurableWorkspace(page)]);};
    const home=()=>activate(page.locator('.main-nav [data-page="home"]'));
    try{
      await page.goto(base+'/pre-alpha/');await page.waitForFunction(()=>location.hash==='#home');
      assert.ok(await page.locator('#home').isVisible());assert.equal(await page.locator('#workspace').isVisible(),false);
      assert.equal(await page.locator('#resume-job').isVisible(),returning);
      const initial=await snapshot();
      if(!returning){
        assert.deepEqual(JSON.parse(initial),[null,null,null]);await activate(page.locator('.main-nav [data-page="workspace"]'));assert.ok(await page.locator('#home').isVisible());assert.deepEqual(JSON.parse(await snapshot()),[null,null,null]);
      }else{
        assert.deepEqual((await readWorkspaceSnapshot(page)).jobs[0],job,'Returning Home must not rewrite or migrate the saved draft');
        assert.match(await page.locator('#resume-position').textContent(),/Second stop.*Completion plug/);
        await activate(page.locator('#resume-job'));
        assert.equal(await page.locator('#step-title').textContent(),'Completion plug');
        assert.equal(await page.locator('[data-field="cpLiManual"]').inputValue(),'99');
        await page.locator('[data-field="cpLiManual"]').fill('101.125');
        const edited=await snapshot();
        // Menu must have a reachable Home item, with focus on the new heading.
        await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="home"]'));
        assert.equal(await page.evaluate(()=>document.activeElement.id),'home-title');assert.equal(await snapshot(),edited);
        await waitForWorkspaceSave(page);await page.reload();await page.waitForSelector('#home');assert.equal(await snapshot(),edited);
        await activate(page.locator('#resume-job'));assert.equal(await page.locator('[data-field="cpLiManual"]').inputValue(),'101.125');
        assert.equal(await page.locator('#operations [aria-current]').getAttribute('data-operation'),'stop');
        assert.equal(await page.evaluate(()=>document.activeElement.id),'job-title');
        await home();await page.goBack();assert.ok(await page.locator('#workspace').isVisible());await page.goForward();assert.ok(await page.locator('#home').isVisible());assert.equal(await snapshot(),edited);
        await page.goto(base+'/pre-alpha/#workspace');await page.waitForSelector('[data-field="cpLiManual"]');assert.equal(await page.locator('[data-field="cpLiManual"]').inputValue(),'101.125');await home();
      }
      for(const route of ['library','references']){
        await activate(page.locator('#home [data-page="'+route+'"]'));assert.ok(await page.locator('#'+route).isVisible());
        if(route==='library'){
          await activate(page.locator('[data-source="experimental"]'));
          assert.equal(await page.locator('.job-card').count(),returning?1:0);
          if(returning){await activate(page.locator('.job-card'));assert.equal(await page.locator('[data-field="cpLiManual"]').inputValue(),'101.125');await home();continue;}
        }
        await page.goBack();assert.ok(await page.locator('#home').isVisible());
      }
      // Reopening a saved job can update its saved timestamp; navigation alone cannot.
      const beforeTheme=await snapshot();
      for(const dark of [false,true]){
        if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
        if(mobile)await page.setViewportSize({width:320,height:740});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        const controls=await page.locator('#home button:visible').evaluateAll(nodes=>nodes.map(node=>({height:node.getBoundingClientRect().height,label:node.textContent.trim()})));
        assert.ok(controls.every(node=>node.height>=44&&node.label));
        await page.screenshot({path:join(tmpdir(),'pre-alpha-home-'+engine+(mobile?'-phone':'-desktop')+(returning?'-resume':'-first')+(dark?'-dark':'-light')+'.png'),fullPage:true});
      }
      assert.equal(await snapshot(),beforeTheme);
      if(mobile)await page.setViewportSize({width:390,height:664});
      // Keyboard follows the visible Home actions, never hidden calculator fields.
      const first=page.locator(returning?'#resume-job':'#home-new-job');await first.focus();await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),returning?'New job':'Saved jobs');
      const beforeNew=await readWorkspaceSnapshot(page);await activate(page.locator('#home-new-job'));assert.ok(await page.locator('#details-dialog').isVisible());
      await activate(page.locator('[data-close="details-dialog"]'));const afterNew=await readWorkspaceSnapshot(page);
      assert.equal(afterNew.jobs.length,returning?2:1);
      if(returning){const previous=beforeNew.jobs[0];assert.deepEqual(afterNew.jobs.find(item=>item.id===previous.id),previous);}
      const beforeBrand=await snapshot();
      await activate(page.locator('.wordmark'));assert.ok(await page.locator('#home').isVisible());
      assert.equal(await page.evaluate(()=>document.activeElement.id),'home-title');assert.equal(await snapshot(),beforeBrand);
      assert.ok(await page.locator('#resume-job').isVisible());
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),'{"keep":"home-fixture"}');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),JSON.parse(initial)[0]);
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    }finally{await context.close();}
  }
  console.log('PASS Home '+engine+'/'+(mobile?'phone':'desktop')+': initial/returning Home, menu, Resume, saved jobs, references, back/forward, refresh/deep links, draft-safe New, keyboard and 320px themes');
}

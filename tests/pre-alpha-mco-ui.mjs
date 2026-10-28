// Fresh persistent localhost profiles only. No production records or cloud writes.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {resultsFor} from '../pre-alpha/model.mjs';
import {readWorkspaceSnapshot,readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';

const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium',label='Maximum cut out (MCO)';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',pod:'99',mco:'888',future:{retain:['raw',3]}};
const bundle={id:'mco-bundle',record:{job:{client:'Synthetic customer',notes:'Retain all operations'},measurements:{hotTap:{mco:'99',rodMco:'111'}},futureRecord:{keep:true},jobBundle:{selectedOperationId:'two',sharedState:{jobDescription:'MCO bundle',futureShared:{keep:2}},futureBundle:{keep:[1,2]},operations:[
  {id:'one',label:'First stop',operationType:'Line Stop',state,measurements:{hotTap:{mco:'88',rodMco:'89'}},futureOperation:{keep:'one'}},
  {id:'two',label:'Second tap and plug',operationType:'Tap & Complete',state:{...state,preAlphaPipeOD:'26',ptc:'2 1/2',cpStart:'20',cpJbf:'1',cpLd:'0',cpPt:'2'}},
  {id:'three',label:'Third tap',operationType:'Hot Tap',state:{...state,preAlphaPipeOD:'28',ptc:'1/2'}}
]}}};
const nested={id:'mco-nested',record:{meta:{title:'MCO nested legacy',operationType:'Hot Tap'},pipe:{material:'Carbon Steel',nominalSize:'6',trueOd:'6.625',pipeId:'6'},machine:{cutterOd:'4'},measurements:{hotTap:{md:'10',ld:'0',ptc:'1',rodStart:'2',mt:'52',mco:'55',rodMco:'67'}},future:{retain:true}}};
const history=JSON.stringify([bundle,nested]),sentinel='{"synthetic":"MCO live draft unchanged"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let context,page,device;
try{
  const base=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(new Error('Preview timeout')),10000);
    server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
    server.once('error',error=>{clearTimeout(timer);reject(error);});
  });
  for(const mobile of [true,false]){
    device=mobile?'phone':'desktop';
    const profile=mkdtempSync(join(tmpdir(),'tapcalc-mco-'+engine+'-'+device+'-'));
    const options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'block'};
    const errors=[],external=[],writes=[];
    async function launch(){
      context=await pw[engine].launchPersistentContext(profile,options);
      await context.addInitScript(({history,sentinel})=>{
        if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);}
      },{history,sentinel});
      await context.route('**/*',route=>{
        const request=route.request(),url=new URL(request.url());
        if(url.origin!==base){external.push(request.method()+' '+url.origin);return route.abort();}
        if(request.method()!=='GET'){writes.push(request.method()+' '+url.pathname);return route.abort();}
        return route.continue();
      });
      page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
      page.on('crash',()=>console.error('MCO_PAGE_CRASH',JSON.stringify({engine,device,url:page.url()})));
    }
    const activate=locator=>mobile?locator.tap():locator.click();
    const tapOutput=()=>page.locator('#results .result-subgrid > div').filter({has:page.locator('span',{hasText:label})}).locator('strong');
    async function checkTap(expected,historical){
      await tapOutput().waitFor({state:'visible'});
      assert.equal((await tapOutput().textContent()).trim(),Number.isFinite(expected)?expected.toFixed(4)+' in':'-- in');
      const old=page.locator('#results [data-historical-mco]');
      assert.equal(await old.count(),historical==null?0:1);
      if(historical!=null){
        assert.match(await old.textContent(),/Historical MCO \(not used\)/);
        assert.match(await old.locator('dd').textContent(),new RegExp(Number(historical).toFixed(4)+' in'));
      }
      assert.match(await page.locator('#results [data-result-origin]').first().textContent(),/Calculated from setup - not field verified/);
      assert.doesNotMatch(await page.locator('#results .result-panel').first().innerText(),/Rod MCO|888/);
    }
    async function openJob(source,id){
      await activate(page.locator('.main-nav [data-page="library"]'));
      await activate(page.locator('[data-source="'+source+'"]'));
      await activate(page.locator('.job-card[data-job="'+id+'"]'));
      await activate(page.locator('[data-step="tap"]'));await waitForWorkspaceSave(page);
    }
    async function checkReview(expected){
      await activate(page.locator('[data-step="review"]'));
      const section=page.locator('[data-review-stage="tap"]');
      const row=section.locator('.review-results > div').filter({has:page.locator('dt',{hasText:label})});
      await row.waitFor({state:'visible'});
      assert.equal((await row.locator('dd').textContent()).trim(),expected.toFixed(4)+' in');
      await activate(section.locator('.review-worksheet > summary'));
      const worksheet=section.locator('.worksheet-result').filter({has:page.locator('h4',{hasText:label})});
      assert.equal(await worksheet.locator('.worksheet-formula').textContent(),'Actual pipe O.D. / 2 + PTC');
      assert.equal(await worksheet.locator('.worksheet-total strong').textContent(),expected.toFixed(4)+' in');
      assert.match(await worksheet.locator('li').first().innerText(),/Actual pipe O.D./);
      assert.match(await worksheet.locator('li').nth(1).innerText(),/PTC/);
      assert.doesNotMatch(await worksheet.innerText(),/Historical|888|99\.0000/);
    }
    async function activeJob(){const view=await readWorkspaceSnapshot(page);return view.jobs.find(job=>job.id===view.activeId);}
    await launch();
    try{
      await page.goto(base+'/pre-alpha/');
      await activate(page.locator('#home-new-job'));
      await page.locator('[data-detail="jobDescription"]').fill('New MCO job');
      await activate(page.locator('#details-form [type="submit"]'));
      await activate(page.locator('[data-step="pipe"]'));
      await page.locator('[data-field="bcoPipeOD"]').selectOption('6.0');
      await page.locator('[data-field="bcoPipeID"]').fill('6');
      await page.locator('[data-field="bcoCutterOD"]').fill('4');
      await activate(page.locator('[data-step="tap"]'));
      await checkTap(NaN);
      for(const [key,value]of Object.entries({md:'10',ptc:'1 1/4',start:'2',mt:'52'}))await page.locator('[data-field="'+key+'"]').fill(value);
      await checkTap(4.5625);await checkReview(4.5625);
      const fresh=await activeJob(),freshId=fresh.id;
      assert.equal(fresh.operations[0].state.ptc,'1 1/4');
      await openJob('device','mco-nested');await checkTap(4.3125,'55');await checkReview(4.3125);
      const legacy=await activeJob();assert.deepEqual(legacy.original,{...nested,source:'device'});
      await openJob('device','mco-bundle');await checkTap(15.5,'99');await checkReview(15.5);
      for(const [id,expected,historical]of [['one',4.5625,'88'],['three',14.5,undefined],['two',15.5,'99']]){
        await activate(page.locator('[data-operation="'+id+'"]'));await activate(page.locator('[data-step="tap"]'));await checkTap(expected,historical);
      }
      for(const invalid of ['oops','0oops','1/0','']){
        await page.locator('[data-field="ptc"]').fill(invalid);await checkTap(NaN,'99');
        if(invalid)assert.equal(await page.locator('[data-warning-code="invalid-ptc"]').count(),1);
        await waitForWorkspaceSave(page);await page.reload();await checkTap(NaN,'99');
        assert.equal(await page.locator('[data-field="ptc"]').inputValue(),invalid);
      }
      await page.locator('[data-field="ptc"]').fill('2 1/2');await checkTap(15.5,'99');
      await activate(page.locator('[data-step="pipe"]'));
      await page.locator('[data-field="preAlphaPipeOD"]').fill('1/0');
      await activate(page.locator('[data-step="tap"]'));await checkTap(NaN,'99');
      await waitForWorkspaceSave(page);await page.reload();await checkTap(NaN,'99');
      assert.equal((await activeJob()).operations[1].state.preAlphaPipeOD,'1/0');
      await activate(page.locator('[data-step="pipe"]'));
      await page.locator('[data-field="preAlphaPipeOD"]').fill('26');
      await activate(page.locator('[data-step="tap"]'));await checkTap(15.5,'99');
      const before=await activeJob();
      assert.equal(before.operations.length,3);assert.deepEqual(before.original,{...bundle,source:'device'});
      before.operations.forEach((op,index)=>assert.deepEqual(op.state,bundle.record.jobBundle.operations[index].state));
      assert.deepEqual(before.operations[0].measurements,bundle.record.jobBundle.operations[0].measurements);
      assert.deepEqual(before.operations[0].futureOperation,{keep:'one'});
      assert.deepEqual(before.sharedState.futureShared,{keep:2});
      const raw=await readDurableWorkspace(page);
      await page.reload();await checkTap(15.5,'99');assert.equal(await readDurableWorkspace(page),raw,'Reload cannot rewrite saved raw inputs or original snapshots');
      await context.close();await launch();
      await page.goto(base+'/pre-alpha/#workspace');await checkTap(15.5,'99');
      assert.equal(await readDurableWorkspace(page),raw,'Browser-process restart retains the complete durable record');
      await checkReview(15.5);
      await openJob('experimental',freshId);await checkTap(4.5625);
      assert.deepEqual((await activeJob()).operations[0].state,fresh.operations[0].state);
      await openJob('experimental',legacy.id);await checkTap(4.3125,'55');assert.deepEqual((await activeJob()).original,{...nested,source:'device'});
      await openJob('experimental',before.id);
      for(const [id,expected,historical]of [['one',4.5625,'88'],['two',15.5,'99'],['three',14.5,undefined]]){
        await activate(page.locator('[data-operation="'+id+'"]'));await activate(page.locator('[data-step="tap"]'));await checkTap(expected,historical);await checkReview(expected);
      }
      const reopened=await activeJob();assert.deepEqual(reopened.original,{...bundle,source:'device'});
      reopened.operations.forEach((op,index)=>assert.deepEqual(op.state,before.operations[index].state));
      assert.deepEqual(reopened.operations.map(op=>resultsFor(op,'tap').find(([key])=>key===label)[1]),[4.5625,15.5,14.5]);
      for(const dark of [true,false]){
        if(await page.locator('body').evaluate(node=>node.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'MCO Review and worksheet fit viewport in both themes');
      }
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);
      assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),sentinel);
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
      const screenshot=join(tmpdir(),'pre-alpha16-mco-'+engine+'-'+device+'.png');
      await page.screenshot({path:screenshot,fullPage:true});console.log('MCO_REVIEW_SCREENSHOT '+screenshot);
      console.log('PASS MCO '+engine+'/'+device+': new, nested legacy and complete three-operation imports; current/historical separation, Review/worksheet, fractional/invalid inputs, actual local save, explicit reopen, reload, browser-process restart, both themes and source isolation');
    }catch(error){
      try{const path=join(tmpdir(),'pre-alpha-mco-failure-'+engine+'-'+device+'-'+Date.now()+'.png');await page.screenshot({path});console.error('Screenshot: '+path);}catch(diagnosticError){console.error('MCO_DIAGNOSTIC_FAILURE',diagnosticError.message);}
      throw error;
    }finally{await context?.close();}
  }
}catch(error){
  console.error('MCO_ORIGINAL_FAILURE',JSON.stringify({engine,device,name:error.name,message:error.message,stack:error.stack}));
  throw error;
}finally{await context?.close();server.kill();}

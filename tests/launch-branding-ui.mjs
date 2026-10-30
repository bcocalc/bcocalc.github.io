import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readDurableWorkspace,readWorkspaceSnapshot,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
export async function runBrandingChecks({browser,pw,base,mobile,engine}){
 const context=await browser.newContext({...mobile?pw.devices['iPhone 13']:{viewport:{width:1360,height:1000}},serviceWorkers:'block'}),page=await context.newPage(),errors=[],writes=[],external=[],pdfs=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.method()!=='GET')writes.push(request.method());if(new URL(request.url()).origin!==base)external.push(request.url());if(/\.pdf(?:\?|$)/i.test(request.url()))pdfs.push(request.url());});
 await page.route('**/v1/**',route=>route.fulfill({json:{documents:[]}}));
 await page.addInitScript(()=>localStorage.setItem('measurementCardStateV1','{"keep":"branding-synthetic"}'));
 const activate=locator=>mobile?locator.tap():locator.click(),clean=async()=>assert.doesNotMatch(await page.locator('body').innerText(),/pre[ -]alpha|experimental|DESIGN STUDY|taking shape/i),navigate=async name=>{await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="'+name+'"]'));};
 try{
  await page.goto(base+'/pre-alpha/');await page.locator('#home').waitFor({state:'visible'});assert.equal(await page.title(),'TapCalc');assert.equal(await page.locator('.edition').textContent(),'BUILD 26');assert.equal(await page.locator('.release').textContent(),'FIELD WORKSPACE');await clean();
  await activate(page.locator('#home-new-job'));await page.locator('#details-dialog').waitFor({state:'visible'});await activate(page.locator('#details-dialog [data-close="details-dialog"]'));await waitForWorkspaceSave(page);assert.equal(await page.locator('#job-origin').textContent(),'LOCAL WORKING COPY');
  const initial=await readDurableWorkspace(page),legacy=await page.evaluate(()=>localStorage.getItem('measurementCardStateV1'));assert.equal((await readWorkspaceSnapshot(page)).jobs[0].source,'experimental','Internal saved-job source identity is retained');
  await activate(page.locator('#delete-operation'));assert.match(await page.locator('#delete-operation-description').textContent(),/from this working copy\?/);await clean();await activate(page.locator('#delete-operation-dialog [data-close="delete-operation-dialog"]'));
  await navigate('library');await activate(page.locator('[data-source="experimental"]'));assert.match(await page.locator('[data-source="experimental"]').textContent(),/Working copies/);assert.equal(await page.locator('.job-row-heading small').textContent(),'Working copy');await clean();
  await navigate('references');for(const category of ['fieldcheck','formulas']){await page.locator('#reference-category').selectOption(category);await clean();assert.match(await page.locator('#reference-browser').innerText(),/not (?:implemented|automatically applied)/);}
  await navigate('settings');assert.match(await page.locator('#settings').innerText(),/Working copies save separately/);assert.match(await page.locator('[data-legacy-fallback]').getAttribute('href'),/measurement-card\.html\?legacy=1/);await clean();
  await navigate('home');for(const dark of [false,true]){if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));if(mobile)await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await clean();await page.screenshot({path:join(tmpdir(),'tapcalc-branding-'+engine+'-'+(mobile?'phone':'desktop')+'-'+(dark?'dark':'light')+'.png'),fullPage:true});}
  assert.equal(await readDurableWorkspace(page),initial,'Branding navigation/theme changes preserve complete saved data bytes');assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),legacy);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);assert.deepEqual(pdfs,[]);
  console.log('PASS TapCalc branding '+engine+'/'+(mobile?'phone':'desktop')+': title/build/Home, copy labels/delete wording, reference limitations, Settings/fallback,320px light/dark, exact durable/legacy preservation and zero writes/external/PDF/page errors.');
 }finally{await context.close();}
}

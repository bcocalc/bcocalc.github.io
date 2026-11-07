// Isolated fixture only. Production requests are blocked and no jobs are saved.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const pw=createRequire(import.meta.url)('playwright'),engine=process.env.TAPCALC_BROWSER||'chromium';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let browser;
try {
  const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});server.on('error',reject);});
  browser=await pw[engine].launch({headless:true,...(process.env.TAPCALC_EXECUTABLE?{executablePath:process.env.TAPCALC_EXECUTABLE}:engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const req=route.request();if(req.method()!=='GET')writes.push(req.method()+' '+req.url());return new URL(req.url()).origin===base?route.continue():route.abort();});
  await page.goto(base+'/pre-alpha/#references');
  const field=key=>page.locator('[data-ref-filter="'+key+'"]'),card=key=>page.locator('[data-pivot-card="'+key+'"]');
  await page.locator('#reference-category').selectOption('pivothead');
  await field('headType').selectOption('conventional');await field('pipeSize').selectOption('16.0');await field('wall').fill('3/8');await field('measuredNose').fill('14');
  assert.equal(await page.locator('.pivot-result').count(),4);assert.match(await card('load-pad').innerText(),/two consecutive bolt holes.*two opposite-side lines/);assert.match(await card('load-pad').innerText(),/hole-pattern center/);assert.match(await card('load-pad').innerText(),/page 26/);assert.equal(await page.locator('[data-pivot-center-guide] img,[data-pivot-center-guide] svg').count(),0);assert.deepEqual(await page.locator('.pivot-seal-options dt').allTextContents(),['Exact Pipe I.D.','+1/16 in','+1/8 in']);assert.match(await card('seals').innerText(),/15\.3750 in/);assert.match(await card('seals').innerText(),/not an approved seal tolerance/);
  assert.match(await card('load-pad').innerText(),/7\.6250 in/);assert.match(await card('backing').innerText(),/Required under the configured shop rule/);assert.match(await card('backing').innerText(),/Not calculated; confirm the shop-approved plate/);assert.doesNotMatch(await card('backing').innerText(),/Contact HTS Technical Support|directs Technical Support/);assert.match(await card('backing').innerText(),/Backing plate required \(shop rule\)/);
  assert.equal(await page.locator('[data-pivot-details]').evaluate(n=>n.open),false);
  await page.evaluate(()=>{window.__pivotSummary=document.querySelector('[data-pivot-details]>summary');document.querySelector('[data-ref-filter=measuredNose]').dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>window.__pivotSummary===document.querySelector('[data-pivot-details]>summary')),true,'An unchanged blur/change preserves the pending tap target');
  // No manual blur, second tap, timing retry or click substitution here.
  await page.locator('[data-pivot-details]>summary').tap();assert.equal(await page.locator('[data-pivot-details]').evaluate(n=>n.open),true);
  await field('wall').fill('.375');assert.equal(await page.locator('[data-pivot-details]').evaluate(n=>n.open),true,'Expanded source stays open through edits');
  await page.locator('[data-pivot-details]>summary').tap();
  await field('measuredNose').fill('14.75001');assert.match(await card('backing').innerText(),/above range/);assert.match(await card('backing').innerText(),/not a remedy for an oversized nose/);assert.doesNotMatch(await card('backing').innerText(),/Backing plate required \(shop rule\)/);
  await field('measuredNose').fill('14.5');assert.match(await card('backing').innerText(),/within range/);assert.match(await card('backing').innerText(),/No backing plate required for this nose-size check/);assert.doesNotMatch(await card('backing').innerText(),/Backing plate required \(shop rule\)/);await field('measuredNose').fill('14.49999');assert.match(await card('backing').innerText(),/Backing plate required \(shop rule\)/);
  await page.evaluate(()=>{const input=document.querySelector('[data-ref-filter=measuredNose]');input.value='14.74999';input.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.match(await card('backing').innerText(),/within range/,'A changed-value change without an input event still updates results');
  await page.evaluate(()=>{const input=document.querySelector('[data-ref-filter=measuredNose]');input.value='14.75001';input.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.match(await card('backing').innerText(),/above range/);
  assert.equal(await field('pressureBand').count(),0);
  await field('headType').selectOption('hotstop');assert.match(await card('backing').innerText(),/not supported/);assert.doesNotMatch(await card('backing').innerText(),/Backing plate required \(shop rule\)/);assert.doesNotMatch(await card('load-pad').innerText(),/7\.6250 in|two consecutive bolt holes/);
  await field('headType').selectOption('conventional');await field('wall').fill('1/');assert.match(await card('seals').innerText(),/Enter valid pipe dimensions/);
  await field('wall').fill('3/8');await page.locator('#reference-category').selectOption('uwire');await page.locator('#reference-category').selectOption('pivothead');assert.equal(await field('wall').inputValue(),'3/8');
  await page.locator('#reference-query').fill('load pad');assert.equal(await page.locator('[data-pivot-details]').evaluate(n=>n.open),true);await page.locator('#reference-query').fill('');
  for(const width of [320,390,430,1200])for(const dark of [false,true]) {
    await page.setViewportSize({width,height:844});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
    assert.deepEqual(await page.locator('.pivot-result,.pivot-result dl,.pivot-result dl>div').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.outerHTML.slice(0,80))),[],'No setup card overflow');
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.body.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% zoom fits');await page.evaluate(()=>document.body.style.zoom='');
  await page.locator('[data-ref-clear]').tap();assert.equal(await field('wall').inputValue(),'');assert.match(await card('seals').innerText(),/Enter valid pipe dimensions/);
  await field('headType').selectOption('conventional');await field('measuredId').fill('.01');assert.match(await page.locator('#reference-content').innerText(),/Setup dimensions held/);assert.equal(await page.locator('.reference-table-wrap').count(),0,'Nonpositive comparison dimensions not presented');
  // Use a disposable reference-only fixture to exercise rejected and successful
  // current-pipe transfers, without changing a working job or production data.
  await page.route(base+'/pivot-transfer-fixture.html',route=>route.fulfill({status:200,contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; connect-src 'none'"},body:`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pivot transfer fixture</title><link rel="stylesheet" href="/pre-alpha/workspace.css"></head><body><main><label><input id="custom" type="checkbox" checked>Custom current O.D.</label><div id="reference-browser"></div></main><script type="module">import {createReferences} from '/pre-alpha/references.mjs';createReferences(document.querySelector('#reference-browser'),{getOperation:()=>({state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'14.0',bcoPipeID:'13.25',bcoCutterOD:'12',...(document.querySelector('#custom').checked?{preAlphaPipeOD:'14.1'}:{})}})});</script></body></html>`}));
  await page.goto(base+'/pivot-transfer-fixture.html');await page.locator('#reference-category').selectOption('pivothead');await field('headType').selectOption('conventional');await field('pipeSize').selectOption('16.0');await field('wall').fill('3/8');await field('measuredNose').fill('14');
  await page.locator('[data-ref-current-pipe]').scrollIntoViewIfNeeded();
  const transferLayout=await page.evaluate(()=>{const button=document.querySelector('[data-ref-current-pipe]'),box=button.getBoundingClientRect(),hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);return {width:innerWidth,visualWidth:visualViewport.width,scale:visualViewport.scale,button:{x:box.x,y:box.y,width:box.width,height:box.height},hit:hit?.outerHTML.slice(0,200),reachable:hit===button||button.contains(hit)};});
  console.log('PIVOT_TRANSFER_LAYOUT '+JSON.stringify({engine,...transferLayout}));
  assert.equal(transferLayout.width,390,'Transfer fixture uses the actual app mobile viewport');assert.equal(transferLayout.reachable,true,'Transfer button has an unobstructed tap target');
  await page.locator('[data-ref-current-pipe]').tap();assert.equal(await page.getByText(/Nothing was copied/).isVisible(),true);assert.match(await card('pipe').innerText(),/15\.2500 in/);assert.equal(await page.locator('[data-pivot-details]').evaluate(n=>n.open),false);
  await page.locator('#custom').uncheck();await page.locator('[data-ref-current-pipe]').tap();assert.equal(await page.getByText(/Other helper inputs are unchanged/).isVisible(),true);assert.equal(await field('measuredNose').inputValue(),'14');assert.equal(await field('headType').inputValue(),'conventional');assert.match(await card('pipe').innerText(),/13\.2500 in/);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  await context.close();console.log('PASS Pivot setup UI '+engine+': cards, neutral seal comparisons, source details open/edit/close/search, family and input holds, repeated edits/navigation, clear, 320/390/430/1200 widths, light/dark, 200% zoom, no external writes');
}finally {await browser?.close();server.kill();}

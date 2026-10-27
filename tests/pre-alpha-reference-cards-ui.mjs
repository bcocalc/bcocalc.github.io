import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {referenceView} from '../pre-alpha/references.mjs';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
let browser;
try{
  const base=await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{const m=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});server.on('error',reject);});
  browser=await pw[engine].launch({headless:true,...(process.env.TAPCALC_EXECUTABLE?{executablePath:process.env.TAPCALC_EXECUTABLE}:engine==='chromium'&&!process.env.CI?{channel:'chrome'}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // The standard preview also applies a self-only CSP and fake Firebase project.
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.goto(base+'/pre-alpha/#references');
  await page.locator('#reference-category').selectOption('papergaskets');
  await page.locator('[data-ref-filter="size"]').selectOption('12');
  await page.locator('[data-ref-filter="rating"]').selectOption('150');
  const expected=referenceView('papergaskets',{size:'12',rating:'150'}).tables[0];
  const audit=async()=>{
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No page overflow');
    const overflows=await page.locator('.reference-cards,.reference-row-card,.reference-row-card>div').evaluateAll(nodes=>nodes.filter(el=>el.getBoundingClientRect().width&&el.scrollWidth>el.clientWidth+1).map(el=>el.className));
    assert.deepEqual(overflows,[],'No card/field overflow');
    assert.equal(await page.locator('.reference-table-wrap').first().isVisible(),false);
    assert.equal(await page.locator('.reference-row-card').first().isVisible(),true);
    // Every printed source label/unit and value is present, including far-right torque fields.
    assert.deepEqual(await page.locator('.reference-row-card').first().locator('dt').allTextContents(),expected.columns);
    assert.deepEqual(await page.locator('.reference-row-card').first().locator('dd').allTextContents(),expected.rows[0].map(v=>String(v===''?'Not listed':v)));
    assert.match(await page.locator('[data-reference-qualification]').innerText(),/not verified for your Durlon grade/);
  };
  for(const width of [320,375,390,430]){
    await page.setViewportSize({width,height:844});
    for(const theme of ['light','dark']){
      await page.evaluate(theme=>document.body.classList.toggle('dark',theme==='dark'),theme);
      await audit();
      // 200% layout zoom and text enlargement exercise wrapping independently.
      await page.evaluate(()=>document.body.style.zoom='2');await audit();
      await page.evaluate(()=>{document.body.style.zoom='';document.querySelectorAll('.reference-row-card *').forEach(el=>el.style.fontSize='26px');});await audit();
      await page.evaluate(()=>document.querySelectorAll('.reference-row-card *').forEach(el=>el.style.fontSize=''));
    }
  }
  await page.setViewportSize({width:390,height:844});
  mkdirSync('evidence',{recursive:true});
  await page.locator('.reference-row-card').first().screenshot({path:'evidence/reference-cards-390.png'});
  // Hidden desktop table has no keyboard stop; visible mobile term help works by touch.
  const card=page.locator('.reference-row-card').first();
  const term=card.locator('[data-help-term]').first();
  await term.tap();await page.locator('.term-tooltip').waitFor({state:'visible'});
  await page.keyboard.press('Escape');assert.equal(await page.locator('.term-tooltip:visible').count(),0);
  await page.locator('[data-ref-clear]').tap();
  assert.equal(await page.locator('.reference-row-card').count(),0);
  await page.locator('#reference-query').fill('Paper Gaskets');
  assert.equal(await page.locator('.reference-row-card').count(),99);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('[data-ref-table-page="1"]').first().tap();
  assert.match(await page.locator('.reference-count').first().innerText(),/showing 21/);
  await page.locator('#reference-query').fill('does-not-match-source');
  assert.equal(await page.locator('.reference-row-card').count(),0);
  await page.locator('[data-ref-clear]').tap();
  await page.locator('[data-ref-filter="size"]').selectOption('12');
  await page.locator('[data-ref-filter="rating"]').selectOption('150');
  await page.setViewportSize({width:1360,height:1000});
  assert.equal(await page.locator('.reference-cards').isVisible(),false);
  assert.equal(await page.locator('.reference-table-wrap').isVisible(),true);
  assert.deepEqual(await page.locator('tbody tr').first().locator('td').allTextContents(),expected.rows[0].map(v=>String(v===''?'Not listed':v)));
  assert.deepEqual(errors,[]);
  console.log('PASS reference cards: 320/375/390/430px, light/dark, 200% layout zoom + text, all 15 exact source fields, touch help, clear/search/no-match/pagination, desktop table, no page/card overflow.');
}finally{await browser?.close();server.kill();}

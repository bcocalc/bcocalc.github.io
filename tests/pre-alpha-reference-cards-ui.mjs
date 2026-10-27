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
  const sourceReachable=async()=>{
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    const source=page.locator('.reference-row-card').last().locator('div').last();
    const rect=await source.boundingBox(),nav=await page.locator('.main-nav').boundingBox();
    assert.ok(rect&&nav&&rect.y>=0&&rect.y+rect.height<=nav.y,'Final source row is reachable above fixed navigation');
    assert.match(await source.innerText(),/Source/);
  };
  const audit=async()=>{
    const layout=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,zoom:document.body.style.zoom,theme:document.body.className,nodes:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||el.scrollWidth>el.clientWidth+1);}).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,id:el.id,classes:el.className,left:r.left,right:r.right,width:r.width,client:el.clientWidth,scroll:el.scrollWidth,font:s.fontSize,position:s.position,overflow:s.overflowX};}).slice(0,80)}));
    if(layout.width>layout.viewport)console.log('REFERENCE_CARD_OVERFLOW '+JSON.stringify({engine,...layout}));
    assert.equal(layout.width<=layout.viewport,true,'No page overflow');
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
      await sourceReachable();
      await page.evaluate(()=>document.querySelectorAll('.reference-row-card *').forEach(el=>el.style.fontSize=''));
      await sourceReachable();
    }
  }
  await page.setViewportSize({width:390,height:844});
  mkdirSync('evidence',{recursive:true});
  await page.locator('.reference-row-card').first().screenshot({path:'evidence/reference-cards-390.png'});
  // Hidden desktop table has no keyboard stop; visible mobile term help works by touch.
  const card=page.locator('.reference-row-card').first();
  const term=card.locator('[data-help-term]').first();
  await term.tap();await page.locator('.term-tooltip').waitFor({state:'visible'});
  const helpBounds=await page.locator('.term-tooltip').boundingBox();
  assert.ok(helpBounds&&helpBounds.x>=0&&helpBounds.y>=0&&helpBounds.x+helpBounds.width<=390&&helpBounds.y+helpBounds.height<=844,'Touch popover stays within the viewport');
  assert.ok(await page.locator('.term-tooltip').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height-1));}),'Popover content is not covered by fixed navigation');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.term-tooltip:visible').count(),0);
  await page.locator('[data-ref-clear]').tap();
  assert.equal(await page.locator('.reference-row-card').count(),0);
  await page.locator('#reference-query').fill('Paper Gaskets');
  assert.equal(await page.locator('.reference-row-card').count(),99);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Each gasket class has at most 20 rows; use the 37-row glossary to
  // exercise the same table/card pagination renderer with a genuine second page.
  await page.locator('#reference-category').selectOption('glossary');
  await page.locator('#reference-query').fill('');
  const glossary=referenceView('glossary').tables[0];
  assert.ok(glossary.rows.length>20);
  await page.locator('[data-ref-table-page="1"]').first().tap();
  assert.match(await page.locator('.reference-count').first().innerText(),/showing 21/);
  assert.deepEqual(await page.locator('.reference-row-card').first().locator('dd').allTextContents(),glossary.rows[20].map(String));
  await page.locator('#reference-category').selectOption('papergaskets');
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

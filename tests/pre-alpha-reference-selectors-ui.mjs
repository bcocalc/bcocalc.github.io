import assert from 'node:assert/strict';
import {SUPPLEMENT} from '../pre-alpha/reference-supplement-data.mjs';
import {STORAGE_KEY} from '../pre-alpha/model.mjs';

// Runs within the existing disposable, CSP-isolated phone/desktop fixture.
// Production storage and the user's browser are never used as test fixtures.
export async function runReferenceSelectorChecks(page,activate){
  const category=value=>page.locator('#reference-category').selectOption(value);
  const select=(key,value)=>page.locator('[data-ref-filter="'+key+'"]').selectOption(value);
  const value=key=>page.locator('[data-ref-filter="'+key+'"]').inputValue();
  const search=value=>page.locator('#reference-query').fill(value);
  const text=()=>page.locator('#reference-content').innerText();
  const count=()=>page.locator('#reference-content tbody tr').count();
  const clear=()=>activate(page.locator('[data-ref-clear]'));
  const before=await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY);
  await category('papergaskets');await clear();assert.match(await page.locator('#reference-category option:checked').innerText(),/Durlon Gaskets/);assert.ok(await page.locator('[data-reference-qualification]').isVisible());assert.match(await page.locator('[data-reference-qualification]').innerText(),/section name only.*Garlock\/GYLON.*not verified for your Durlon grade/);assert.equal(await count(),0);assert.match(await text(),/Garlock.*GYLON/s);assert.match(await text(),/Multi-Swell 3760.*10,000 psi/s);assert.match(await text(),/non-metallic/);
  await page.locator('[data-ref-filter="size"]').focus();await select('size','4');assert.equal(await count(),5);assert.equal(await page.evaluate(()=>document.activeElement.dataset.refFilter),'size','Selection rebuild preserves keyboard focus');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.refFilter),'rating');await select('rating','900');assert.equal(await count(),1);
  await select('size','3-1/2');assert.equal(await value('rating'),'');assert.equal(await count(),4);assert.equal(await page.locator('[data-ref-filter="rating"] option[value="900"]').count(),0);
  await select('size','unlisted');assert.equal(await count(),0);assert.match(await text(),/No listed match/);assert.match(await text(),/10,000 psi/);
  await select('size','4');await select('rating','600');await search('4');await category('manuals');await category('papergaskets');assert.equal(await value('size'),'4');assert.equal(await value('rating'),'600');assert.equal(await page.locator('#reference-query').inputValue(),'4');assert.equal(await count(),1);
  await activate(page.locator('#menu-toggle'));await activate(page.locator('#app-menu [data-page="settings"]'));await page.goBack();await page.locator('#references').waitFor({state:'visible'});assert.equal(await value('size'),'4');assert.equal(await value('rating'),'600');assert.equal(await page.locator('#reference-query').inputValue(),'4','Back preserves selections and search');
  await clear();for(const alias of ['compressed','Durlon Gaskets','Paper Gaskets']){await search(alias);assert.equal(await count(),99,'All source rows remain searchable through original/new names');assert.ok(await page.locator('[data-reference-qualification]').isVisible());assert.match(await page.locator('#reference-content h3').first().innerText(),/Garlock \/ GYLON source — Paper Gaskets/);}await search('does-not-match-source');assert.equal(await count(),0);assert.match(await text(),/Garlock/);assert.ok(await page.locator('[data-reference-qualification]').isVisible());assert.match(await text(),/not verified for your Durlon grade/);await clear();
  await category('torque');await clear();await select('size','4');await select('rating','400');assert.match(await text(),/Contact Engineering/);assert.equal(await count(),1);
  await category('bolting');await clear();assert.equal(await count(),0);await select('size','4');assert.equal(await count(),7);await select('rating','600');assert.equal(await count(),1);
  for(const categoryName of ['plant150','plant600','htp']){await category(categoryName);await clear();await select('size',categoryName==='htp'?'4':'4"');assert.equal(await count(),categoryName==='htp'?1:2);}
  await category('cutters');await clear();assert.equal(await value('kind'),'hotTap','The default is standard Hot Tap, not FloStop');await select('pipe','42');await select('kind','lineStop');assert.equal(await count(),0);assert.match(await text(),/No listed match/);
  await category('foldinghead');await select('topic','capacity');await clear();await select('line','54');assert.equal(await count(),1);assert.match(await text(),/Source maximum temperature/);
  await category('fieldmanual');await select('topic','rpm');await select('machine','1200');await select('cutter','40"');assert.equal(await count(),1);await select('machine','T101');assert.equal(await value('cutter'),'');assert.equal(await count(),3);await select('topic','checks');await select('boringOd','4"');assert.equal(await count(),3,'Different lengths stay separate');assert.match(await text(),/supervisor/);
  await select('topic','histop');await select('manualPart','torque');await select('item','2" 600# (360TM)');assert.equal(await count(),1);await select('manualPart','machinePressure');assert.equal(await value('item'),'');assert.equal(await count(),0);
  await category('fractions');await clear();await select('fraction','1/8');assert.equal(await count(),1);assert.match(await text(),/0.125000/);
  await category('stackups');await clear();assert.equal(await page.locator('.stackup-card').count(),0);await select('source','Hot Tap Stackups.pdf');assert.equal(await page.locator('.stackup-card').count(),20);await activate(page.locator('[data-ref-page="1"]'));assert.match(await text(),/Showing 21–40/);assert.equal(await page.evaluate(()=>document.activeElement.className),'reference-count');
  await category('manuals');await category('stackups');assert.match(await text(),/Showing 21–40/);await select('type','HTP Reference');assert.equal(await value('source'),'');assert.match(await text(),/Showing 1–/);
  await clear();const last=SUPPLEMENT.stackups.at(-1);await search(last.name);assert.ok(await page.locator('[data-stackup-preview="'+last.id+'"]').count()>0,'Search reaches records beyond the old 50-card cutoff');await search('no-stackup-match-xyz');assert.match(await text(),/No matching source page/);await clear();
  const originalViewport=page.viewportSize();await page.setViewportSize({width:320,height:700});
  for(const dark of [false,true]){
    if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
    for(const categoryName of ['papergaskets','bolting','stackups']){await category(categoryName);await clear();if(categoryName==='stackups')await select('source','Hot Tap Stackups.pdf');else await select('size','4');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),categoryName+' fits 320px in '+(dark?'dark':'light'));}
  }
  await page.setViewportSize(originalViewport);assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),before,'Reference selections never edit saved jobs');
  await category('htp');
  console.log('PASS reference selectors: choice-first, keyboard focus, touch clear, Back/memory, all-class search, unsupported choices, dependent reset, pagination and 320px themes');
}

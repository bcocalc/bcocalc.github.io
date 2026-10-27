import {readDurableWorkspace} from './pre-alpha-workspace-test-helpers.mjs';
import {waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
import {WORKSPACE_KEY} from '../pre-alpha/workspace-store.mjs';
import assert from 'node:assert/strict';
import {SUPPLEMENT} from '../pre-alpha/reference-supplement-data.mjs';
import {STORAGE_KEY} from '../pre-alpha/model.mjs';
import {browserCheckpoint} from './browser-evidence.mjs';

// Installed before page navigation so the original first-interaction path gets no
// extra setup roundtrip. This exists only in the disposable synthetic CI page.
export function installReferenceFocusTrace(){
  const events=[],ids=new WeakMap();let nextId=1;
  const describe=el=>{if(!el)return null;if(!ids.has(el))ids.set(el,nextId++);return {node:ids.get(el),tag:el.tagName,id:el.id,filter:el.dataset?.refFilter,value:el.value,connected:el.isConnected};};
  const record=(phase,event)=>{
    if(document.querySelector('#reference-category')?.value!=='papergaskets')return;
    if(event.type==='click'&&phase==='capture'&&event.target.closest?.('[data-ref-clear]'))events.length=0;
    if(!event.target.closest?.('#reference-filters')&&!document.activeElement?.closest?.('#reference-filters'))return;
    events.push({phase,type:event.type,key:event.key,trusted:event.isTrusted,prevented:event.defaultPrevented,target:describe(event.target),active:describe(document.activeElement),at:performance.now()});if(events.length>128)events.shift();
  };
  for(const type of ['focusin','focusout','keydown','keyup','input','change','pointerdown','pointerup','click'])for(const capture of [true,false])document.addEventListener(type,event=>record(capture?'capture':'bubble',event),capture);
  window.__referenceFocusDiagnostic={read:()=>({events,active:describe(document.activeElement),hasFocus:document.hasFocus(),visibility:document.visibilityState,at:performance.now()})};
}

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
  const stable=async(key,action)=>{const element=await page.locator('[data-ref-filter="'+key+'"]').elementHandle();await action();assert.ok(await element.evaluate(el=>el.isConnected&&el===document.querySelector('[data-ref-filter="'+el.dataset.refFilter+'"]')),'Stable native control: '+key);await element.dispose();};
  await waitForWorkspaceSave(page);
  browserCheckpoint(page,'selectors: before durable workspace snapshot');
  const rawSnapshot=async()=>JSON.stringify([await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),[STORAGE_KEY,WORKSPACE_KEY]),await readDurableWorkspace(page)]);
  const before=await rawSnapshot();
  browserCheckpoint(page,'selectors: before gasket selection and native first Tab');
  await category('papergaskets');await clear();assert.match(await page.locator('#reference-category option:checked').innerText(),/Durlon Gaskets/);assert.ok(await page.locator('[data-reference-qualification]').isVisible());assert.match(await page.locator('[data-reference-qualification]').innerText(),/section name only.*Garlock\/GYLON.*not verified for your Durlon grade/);assert.equal(await count(),0);assert.match(await text(),/Garlock.*GYLON/s);assert.match(await text(),/Multi-Swell 3760.*10,000 psi/s);assert.match(await text(),/non-metallic/);
  await page.locator('[data-ref-filter="size"]').focus();await select('size','4');assert.equal(await count(),5);assert.equal(await page.evaluate(()=>document.activeElement.dataset.refFilter),'size','Selection keeps the native control focused');
  await page.keyboard.press('Tab');const immediateTabFocus=await page.evaluate(()=>document.activeElement.dataset.refFilter);
  const immediateTrace=await page.evaluate(()=>window.__referenceFocusDiagnostic.read());
  if(immediateTabFocus!=='rating')console.log('REFERENCE_FIRST_TAB_DIAGNOSTIC '+JSON.stringify({viewport:page.viewportSize(),immediateTabFocus,immediateTrace}));
  assert.equal(immediateTabFocus,'rating');
  const changed=immediateTrace.events.find(event=>event.type==='change'&&event.phase==='bubble'&&event.target.filter==='size');
  assert.ok(changed?.target.connected,'Selected native control stays connected through change');
  assert.equal(changed.target.node,changed.active.node,'The same native element stays focused; it is not replaced/refocused');
  console.log('PASS first Tab and native control identity '+page.viewportSize().width+'px');
  browserCheckpoint(page,'selectors: native first Tab assertions passed');
  await select('rating','900');assert.equal(await count(),1);
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
  await category('fieldmanual');await select('topic','rpm');await select('machine','1200');await select('cutter','40"');assert.equal(await count(),1);await stable('machine',()=>select('machine','T101'));assert.equal(await value('cutter'),'');assert.equal(await count(),3);await stable('topic',()=>select('topic','checks'));await select('boringOd','4"');assert.equal(await count(),3,'Different lengths stay separate');assert.match(await text(),/supervisor/);
  await select('topic','histop');await select('manualPart','torque');await select('item','2" 600# (360TM)');assert.equal(await count(),1);await stable('manualPart',()=>select('manualPart','machinePressure'));assert.equal(await value('item'),'');assert.equal(await count(),0);
  await category('fractions');await clear();await select('fraction','1/8');assert.equal(await count(),1);assert.match(await text(),/0.125000/);
  await category('stackups');await clear();assert.equal(await page.locator('.stackup-card').count(),0);await select('source','Hot Tap Stackups.pdf');assert.equal(await page.locator('.stackup-card').count(),20);await activate(page.locator('[data-ref-page="1"]'));assert.match(await text(),/Showing 21–40/);assert.equal(await page.evaluate(()=>document.activeElement.className),'reference-count');
  await category('manuals');await category('stackups');assert.match(await text(),/Showing 21–40/);await stable('type',()=>select('type','HTP Reference'));assert.equal(await value('source'),'');assert.match(await text(),/Showing 1–/);
  await clear();const last=SUPPLEMENT.stackups.at(-1);await search(last.name);assert.ok(await page.locator('[data-stackup-preview="'+last.id+'"]').count()>0,'Search reaches records beyond the old 50-card cutoff');await search('no-stackup-match-xyz');assert.match(await text(),/No matching source page/);await clear();
  const originalViewport=page.viewportSize();await page.setViewportSize({width:320,height:700});
  for(const categoryName of ['papergaskets','torque','bolting','cutters','htp','plant150','plant600','foldinghead','fieldmanual','fractions','stackups']){
    await category(categoryName);if(categoryName==='foldinghead')await select('topic','capacity');if(categoryName==='fieldmanual')await select('topic','thread');await clear();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),categoryName+' cleared selectors fit320px');
    assert.ok(await page.locator('.reference-controls .field').evaluateAll(fields=>fields.every(field=>field.scrollWidth<=field.clientWidth+1)),categoryName+' cleared native prompts fit their fields');
  }
  for(const dark of [false,true]){
    if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
    for(const categoryName of ['papergaskets','bolting','stackups']){await category(categoryName);await clear();if(categoryName==='stackups')await select('source','Hot Tap Stackups.pdf');else await select('size','4');const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
      if(!fits){
        const layout=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('#reference-browser,#reference-filters,#reference-content,.reference-controls,.reference-controls .field,.reference-controls select,.reference-controls input,#reference-content>p,.reference-section h3,.reference-table-wrap')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,id:el.id,filter:el.dataset.refFilter,classes:el.className,left:r.left,right:r.right,width:r.width,client:el.clientWidth,scroll:el.scrollWidth,columns:s.gridTemplateColumns,overflow:s.overflowX,font:s.fontSize,minWidth:s.minWidth,maxWidth:s.maxWidth,appearance:s.appearance,selected:el.selectedOptions?.[0]?.textContent};})}));
        console.log('REFERENCE_LAYOUT_DIAGNOSTIC '+JSON.stringify({categoryName,dark,...layout}));
      }
      assert.ok(fits,categoryName+' fits 320px in '+(dark?'dark':'light'));
      assert.ok(await page.locator('.reference-controls .field').evaluateAll(fields=>fields.every(field=>field.scrollWidth<=field.clientWidth+1)),categoryName+' native controls stay inside their fields without clipping');}
  }
  await page.setViewportSize(originalViewport);assert.equal(await rawSnapshot(),before,'Reference selections never edit saved jobs');
  await category('htp');
  console.log('PASS reference selectors: choice-first, keyboard focus, touch clear, Back/memory, all-class search, unsupported choices, dependent reset, pagination and 320px themes');
}

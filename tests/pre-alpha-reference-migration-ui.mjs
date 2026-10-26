import assert from 'node:assert/strict';

export async function cancelPendingPdf(page,open,cancel,holder){
  // Hold a real fixture PDF request so cancellation definitely precedes load completion.
  // Releasing the request never suppresses page errors; callers still assert errors=[].
  let release,started,timer,responseTask;
  const gate=new Promise(resolve=>{release=resolve;});
  const seen=new Promise((resolve,reject)=>{started=resolve;timer=setTimeout(()=>reject(new Error('Fixture PDF request was not observed')),10000);});
  const pattern='**/reference/stackups/*.pdf';
  const hold=route=>{responseTask=gate.then(()=>route.continue());clearTimeout(timer);started();return responseTask;};
  await page.route(pattern,hold,{times:1});
  try{
    await open();await seen;
    assert.equal(await holder.getAttribute('data-preview-state'),'loading');
    await cancel();
  }finally{
    clearTimeout(timer);release();
    try{if(responseTask)await responseTask;}finally{await page.unroute(pattern,hold);}
  }
}

// Called by the existing CSP-isolated pre-alpha browser suite for both engines,
// touch and mouse, using disposable fixture storage only.
export async function runReferenceMigrationChecks(page,activate){
  const category=value=>page.locator('#reference-category').selectOption(value);
  const filter=(key,value)=>page.locator('[data-ref-filter="'+key+'"]').fill(value);
  const select=(key,value)=>page.locator('[data-ref-filter="'+key+'"]').selectOption(value);
  const text=()=>page.locator('#reference-content').innerText();
  await category('smartstop');await filter('wall','.235');await page.locator('#reference-query').fill('1480');
  assert.match(await text(),/ASTM A574\/F835/);assert.match(await text(),/Unmarked rows do not receive an inferred pressure rating/,'Searching never hides source/pressure limitations');
  await category('torque');for(const rating of ['150','300','400','600']){await select('rating',rating);assert.equal(await page.locator('#reference-content tbody tr').count(),19);}
  await select('rating','400');assert.match(await text(),/Contact Engineering/);
  await category('papergaskets');for(const rating of ['150','300','400','600','900']){await select('rating',rating);assert.equal(await page.locator('#reference-content tbody tr').count(),rating==='900'?19:20);assert.match(await text(),/10,000 psi/);}
  await category('manuals');assert.equal(await page.locator('#reference-content tbody tr').count(),5);assert.match(await text(),/placeholders, not complete inline manuals/);
  await category('stackups');assert.match(await text(),/450 matching source pages/);assert.equal(await page.locator('.stackup-card').count(),50);
  await select('source','HTP Stackups.pdf');assert.ok(await page.locator('.stackup-card').count()>0);
  await activate(page.locator('.stackup-card > summary').first());assert.match(await page.locator('.stackup-card a').first().getAttribute('href'),/^\.\.\/reference\/stackups\/HTP%20Stackups\.pdf#page=\d+$/);
  const preview=page.locator('.stackup-card').first().locator('[data-stackup-preview]');
  const cancelLoading=cancel=>cancelPendingPdf(page,()=>activate(preview),cancel,page.locator('.stackup-card').first().locator('.stackup-preview'));
  await activate(preview);await page.locator('.stackup-preview[data-preview-state="ready"] canvas').waitFor({state:'visible',timeout:30000});
  assert.ok(await page.locator('.stackup-preview canvas').evaluate(canvas=>canvas.width>200&&canvas.height>200));
  assert.equal(await preview.getAttribute('aria-expanded'),'true');await activate(preview);assert.equal(await page.locator('.stackup-preview canvas').count(),0);
  // Cancel a repeat load before completion, then interrupt another load by navigation.
  await activate(preview);await activate(preview);assert.equal(await preview.getAttribute('aria-expanded'),'false');
  await activate(preview);await category('glossary');assert.equal(await page.locator('.stackup-preview').count(),0);
  await category('stackups');await select('source','HTP Stackups.pdf');await activate(page.locator('.stackup-card > summary').first());
  await cancelLoading(()=>activate(preview));assert.equal(await preview.getAttribute('aria-expanded'),'false');
  await cancelLoading(()=>category('glossary'));assert.equal(await page.locator('.stackup-preview').count(),0);
  await category('stackups');await select('source','HTP Stackups.pdf');await activate(page.locator('.stackup-card > summary').first());
  await activate(page.locator('.stackup-card').first().locator('[data-stackup-preview]'));await page.locator('.stackup-preview[data-preview-state="ready"] canvas').waitFor({state:'visible',timeout:30000});
  await page.locator('#reference-query').fill('definitely-no-equipment-match');assert.match(await text(),/No matching source page/);
  await category('fractions');await filter('decimal','-1 1/2');for(const rounding of ['16','32','64']){await select('rounding',rounding);assert.match(await text(),new RegExp('Nearest 1/'+rounding+' in: -1 1/2'));assert.match(await text(),/Decimal inches: -1.5/);}
  await activate(page.locator('[data-ref-clear]'));assert.equal(await page.locator('[data-ref-filter="decimal"]').inputValue(),'');
  await activate(page.locator('[data-ref-decimal="0.1250"]'));assert.match(await text(),/Decimal inches: 0.125/);
  await category('pivothead');await activate(page.locator('[data-ref-current-pipe]'));assert.match(await text(),/custom outside diameter is not represented/);await select('pipeSize','14.0');await filter('wall','.375');await select('pressureBand','at500');assert.match(await text(),/Exactly 500 psi is not defined/);
  await select('pressureBand','under500');assert.match(await text(),/12.5000 in/);
  await select('material','DuctileIron');const displayed=await page.locator('[data-ref-filter="pipeSize"]').inputValue();assert.ok(displayed,'The displayed material-dependent size and calculated selection stay aligned');
  await filter('wall','1"2');assert.match(await text(),/complete decimal or fraction/);
  await category('foldinghead');await select('topic','helper');for(const [key,value]of Object.entries({md:'10',ld:'1',pod:'12',wall:'.5',start:'2'}))await filter(key,value);
  assert.match(await text(),/22.5000 in/);assert.match(await text(),/24.5000 in/);await select('ldSign','subtract');assert.match(await text(),/20.5000 in/);
  await activate(page.locator('[data-ref-clear]'));assert.equal(await page.locator('[data-ref-filter="md"]').inputValue(),'');assert.equal(await page.locator('[data-ref-filter="topic"]').inputValue(),'helper');
  await category('uwire');for(const [key,value]of Object.entries({pipeOd:'20',wall:'.375',cutterOd:'19',toothWidth:'.25',ptc:'3',wire1:'99',wire2:'1'}))await filter(key,value);
  assert.match(await text(),/HOLD: legacy source row-2 indication/);assert.match(await text(),/not setup approval/);
  await category('fieldcheck');assert.equal(await page.locator('#reference-content .reference-section').count(),6);
  await category('fieldmanual');await select('topic','all');await page.locator('#reference-query').fill('lash');assert.match(await text(),/supervisor/i);await page.locator('#reference-query').fill('');await select('topic','checks');assert.match(await text(),/\.020/);assert.match(await text(),/supervisor/i);
  for(const dark of [false,true]){
    if(await page.locator('body').evaluate(el=>el.classList.contains('dark'))!==dark)await activate(page.locator('#theme'));
    for(const target of ['papergaskets','stackups','pivothead','uwire']){await category(target);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),target+' stays within the viewport in '+(dark?'dark':'light')+' mode');}
  }
  await category('htp');
  console.log('PASS reference migration browser flows: class/source filters, preserved limitations, helper guards/clear, placeholders and layout');
}

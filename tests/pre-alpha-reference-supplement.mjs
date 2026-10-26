import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SUPPLEMENT as data} from '../pre-alpha/reference-supplement-data.mjs';

// Network-free source parity checks. These establish migration fidelity, not
// engineering approval of the supplied charts or extracted PDF text.
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('measurement.js'),html=read('measurement-card.html');
const smart=read('dev/overlays/tapcalc-smartstop-reference.js');
const folding=read('dev/overlays/tapcalc-folding-head-reference.js');
const manual=read('overlays/tapcalc-field-manual.js');
const slice=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,'Source markers exist: '+start);return text.slice(a,b);};
const evaluate=(code,name)=>JSON.parse(vm.runInNewContext(code+'\nJSON.stringify('+name+')',{}, {timeout:1000}));
const plain=text=>text.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
let checks=0;
function check(label,fn){fn();checks++;console.log('PASS '+label);}

check('450 stack-up records retain every original value and OCR annotation',()=>{
  const context={window:{}};vm.runInNewContext(read('stackup-data.js'),context,{timeout:1000});
  assert.deepEqual(data.stackups,JSON.parse(JSON.stringify(context.window.TAPCALC_STACKUP_REFERENCES)));
  assert.equal(data.stackups.length,450);
  assert.equal(new Set(data.stackups.map(row=>row.id)).size,450);
});
check('15 PDF source identities and page-specific records are preserved',()=>{
  const names=[...new Set(data.stackups.map(row=>row.source))];
  assert.equal(names.length,15);
  assert.deepEqual(data.stackupSources,names.map(name=>({name,path:'../reference/stackups/'+encodeURIComponent(name)})));
  assert.ok(data.stackups.every(row=>Number.isInteger(row.sourcePage)&&row.sourcePage>0));
  assert.match(data.stackupNote,/OCR artifacts/);
  assert.match(data.stackupNote,/subject to change/);
});
check('five manual entries remain exact, incomplete placeholders',()=>{
  const original=evaluate(slice(source,'const machineManualIndexData = [','const machineReferenceData ='),'machineManualIndexData');
  assert.deepEqual(data.manuals,original);assert.equal(data.manuals.length,5);
  assert.ok(data.manuals.every(row=>row.sourcePage==='-'&&row.type==='Manual Index'&&/not inline yet/.test(row.use)));
});
check('all 76 Graphonic rows match source CMG/engineering values, not another gasket style',()=>{
  const original=evaluate(slice(source,"  const CE = 'Contact Engineering';",'\n\n  function gasketTorqueEl'),'GASKET_TORQUE_DATA');
  const expected=Object.fromEntries(Object.entries(original).map(([key,rows])=>[key,rows.map(row=>({size:row.size,bolts:row.bolts,boltSize:row.boltSize,minTorque:Array.isArray(row.cmg)?row.cmg[0]:row.cmg,preferredTorque:Array.isArray(row.cmg)?row.cmg[1]:row.cmg,source:row.source}))]));
  assert.deepEqual(data.graphonic,expected);
  assert.deepEqual(Object.values(data.graphonic).map(rows=>rows.length),[19,19,19,19]);
  assert.equal(data.graphonic['150'][0].minTorque,7);
  assert.equal(data.graphonic['600'][0].minTorque,'11');
  assert.equal(data.graphonic['300'][0].minTorque,9);
  assert.ok(data.graphonic['400'].every(row=>row.minTorque==='Contact Engineering'&&row.preferredTorque==='Contact Engineering'));
  assert.match(data.graphonicNote,/manufacturer's latest instructions/);
  assert.match(data.graphonicNote,/ASME B16\.5 raised-face/);
});
check('all 99 Paper Gasket rows preserve geometry, stress, pressure and torque',()=>{
  const original=evaluate(slice(source,'  const PAPER_GASKET_GEOMETRY = {','\n\n  function paperGasketEl')+'\n'+slice(source,'  function paperGasketSizeLabel(size)','\n\n  function paperGasketClass'),'PAPER_GASKET_DATA');
  assert.deepEqual(data.paperGaskets,original);
  assert.deepEqual(Object.values(data.paperGaskets).map(rows=>rows.length),[20,20,20,20,19]);
  assert.equal(data.paperGaskets['150'][0].internalPressure,'<300');
  assert.equal(data.paperGaskets['150'][0].source,'Scan p.14');
  assert.equal(data.paperGaskets['900'][0].source,'Scan p.10');
  assert.match(data.paperGasketNote,/lined and\/or non-metallic raised-face flanges/);
  assert.match(data.paperGasketNote,/Multi-Swell 3760 maximum recommended gasket stress is 10,000 psi/);
});
check('six field stages retain all 18 original reminders and the pre-alpha limitation',()=>{
  const block=slice(html,'data-reference-view="fieldcheck"','data-reference-view="plant150"');
  const expected=[...block.matchAll(/<h4>([^<]+)<\/h4>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)].map(m=>({title:plain(m[1]),items:[...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x=>plain(x[1]))}));
  assert.deepEqual(data.fieldChecklists,expected);assert.equal(data.fieldChecklists.length,6);
  assert.equal(data.fieldChecklists.flatMap(x=>x.items).length,18);
  assert.match(data.fieldChecklistNote,/shared-save steps are not implemented/);
});
check('HTP, Hi-Stop and side-outlet training formulas remain distinct and exact',()=>{
  const block=slice(html,'data-reference-view="stopmath"','data-reference-view="uwire"');
  const expected=[...block.matchAll(/<div class="formula-card">([\s\S]*?)<\/div>/g)].map(m=>({title:plain(m[1].match(/<strong>([\s\S]*?)<\/strong>/)[1]),items:[...m[1].matchAll(/<(?:span|small)>([\s\S]*?)<\/(?:span|small)>/g)].map(x=>plain(x[1]))}));
  assert.deepEqual(data.stopMath,expected);assert.equal(data.stopMath.length,6);
  assert.ok(data.stopMath.find(x=>x.title==='Completion Plug').items[1].includes('FTD - TMU +/- LD'));
  assert.match(data.stopMathNote,/not automatically applied/);
});
check('SmartStop torque assumptions and all source/pressure limitations are retained',()=>{
  assert.equal(data.smartstop.torqueNote,plain(smart.match(/<p class="smartstop-source-note">(Only for the source assumptions:[\s\S]*?)<\/p>/)[1]));
  const block=slice(smart,'<section class="smartstop-section" data-smartstop-section="source"','</section>');
  assert.deepEqual(data.smartstop.sourceNotes,[...block.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>plain(m[1])));
  assert.match(data.smartstop.torqueNote,/ASTM A574\/F835/);assert.match(data.smartstop.torqueNote,/\.14 K-factor \/ \.10 friction factor/);
  assert.match(data.smartstop.torqueNote,/nickel-based anti-seize/);
  assert.ok(data.smartstop.sourceNotes.some(s=>/Unmarked rows do not receive an inferred pressure rating/.test(s)));
  assert.ok(data.smartstop.sourceNotes.some(s=>/2316_001\.pdf/.test(s)&&/96-101/.test(s)&&/102/.test(s)));
});
check('Folding Head reminders and page/temperature qualifications are retained',()=>{
  for(const [key,title] of [['goodFit','Good Fit'],['watchOuts','Watch Outs'],['headAssembly','Head Assembly']]){
    const block=slice(folding,`<h4>${title}</h4>`,'</ul>');
    assert.deepEqual(data.folding[key],[...block.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>plain(m[1])));
  }
  assert.deepEqual([data.folding.goodFit.length,data.folding.watchOuts.length,data.folding.headAssembly.length],[5,4,5]);
  assert.ok(folding.includes("'"+data.folding.maxTemperature+"'"));
  assert.match(data.folding.capacityNote,/greater than 100 deg F \/ 37.8 deg C/);
  assert.match(data.folding.sourceNote,/source page 5/);assert.match(data.folding.sourceNote,/source pages 13-14/);
  assert.ok(folding.includes(data.folding.ds803Note));
});
check('bearing-lash footnote retains the supervisor-direction condition',()=>{
  assert.equal(data.bearingLashNote,plain(manual.match(/<p class="reference-footnote">(If bearing lash[\s\S]*?)<\/p>/)[1]));
  assert.match(data.bearingLashNote,/exceeds \.020"/);assert.match(data.bearingLashNote,/supervisor direction as required/);
});
check('migration is pinned to the audited source commit',()=>{
  assert.equal(data.provenance.commit,'3caf01f4c0a158ff04cd6689d216a5d3530a1268');
  assert.equal(data.provenance.repository,'bcocalc/bcocalc.github.io');
  assert.match(data.provenance.note,/not independent certification/);
});
console.log(`${checks} reference-supplement source-parity groups passed.`);

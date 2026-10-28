import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import vm from 'node:vm';
import {MEASUREMENT_FIGURES,measurementFigureMarkup,figureSource,figureUrl,installMeasurementFigures} from '../pre-alpha/measurement-figures.mjs';
import {measurementHelpFor,measurementHelpMarkup} from '../pre-alpha/measurement-help.mjs';
const op={operationType:'Line Stop',state:{}},figures=Object.entries(MEASUREMENT_FIGURES);
assert.equal(figures.length,5);let bytes=0;
for(const [key,figure]of figures){
  const body=readFileSync(new URL('../pre-alpha/measurement-figures/'+figure.file,import.meta.url));
  assert.equal(body.length,figure.bytes);assert.equal(createHash('sha256').update(body).digest('hex'),figure.sha256);bytes+=body.length;
  assert.equal(body.subarray(0,4).toString(),'RIFF');assert.equal(body.subarray(8,12).toString(),'WEBP');
  assert.ok(figure.width>=672&&figure.width<=768&&figure.height>=378&&figure.height<=711);
  assert.match(figureSource(figure),/TEAM, Inc\. All rights reserved\. Governing revision not recorded/);
  assert.doesNotMatch(figureSource(figure),/2023-10-28|Revision A/);
  assert.match(figureUrl(figure),/\.webp\?v=pre-alpha19$/);
  const markup=measurementFigureMarkup({figure:key,text:'A & B <context>'});
  assert.match(markup,/loading="lazy" decoding="async" alt="[^" ]/);
  assert.match(markup,new RegExp('width="'+figure.width+'" height="'+figure.height+'"'));
  assert.doesNotMatch(markup,/\ssrc=|href=|<svg|<iframe/,'No automatic bitmap/PDF request in initial markup');
  assert.match(markup,/A &amp; B &lt;context&gt;/);assert.match(markup,/Enlarge original figure/);
}
assert.equal(bytes,87242);assert.equal(measurementFigureMarkup({figure:'unapproved',text:''}),'');
assert.match(MEASUREMENT_FIGURES['tap-negative-ld'].alt,/-LD.*Negative Lost Distance/);
assert.match(MEASUREMENT_FIGURES['tap-positive-ld'].alt,/\+LD.*Positive Lost Distance/);
assert.match(MEASUREMENT_FIGURES['plant-pt'].alt,/Two.*face to face/);
assert.match(MEASUREMENT_FIGURES['pipeline-pt'].alt,/bottom face.*top of the segment groove/);
assert.equal(MEASUREMENT_FIGURES['tap-md'].page,6);
assert.deepEqual(measurementHelpFor(op,'tap').cards.filter(c=>c.figure).map(c=>c.figure),['tap-md','tap-positive-ld','tap-negative-ld']);
assert.deepEqual(measurementHelpFor(op,'plug').cards.filter(c=>c.figure).map(c=>c.figure),['plant-pt','pipeline-pt']);
assert.match(measurementHelpMarkup(op,'stop'),/p\.28 illustrates LD\/WD, not MD/);
assert.doesNotMatch(measurementHelpMarkup(op,'stop'),/<img|<svg|data-figure-open/);
const workerSource=readFileSync(new URL('../pre-alpha/service-worker.js',import.meta.url),'utf8');
const context={URL,self:{location:{href:'https://fixture.invalid/pre-alpha/service-worker.js'}}};
vm.runInNewContext(workerSource.split("self.addEventListener('install'")[0]+'\nglobalThis.lists={ASSETS,FIGURES};',context);
assert.equal(context.lists.FIGURES.length,5);assert.ok(context.lists.ASSETS.every(x=>!x.endsWith('.webp?v=pre-alpha19')));
assert.deepEqual([...context.lists.FIGURES].map(x=>new URL(x,'https://fixture.invalid/pre-alpha/').pathname.split('/').pop()).sort(),figures.map(([,v])=>v.file).sort());
const workerEvents=new Map();let offlineResponse;
vm.runInNewContext(workerSource,{URL,Response,self:{location:{href:'https://fixture.invalid/pre-alpha/service-worker.js'},addEventListener:(type,callback)=>workerEvents.set(type,callback)},
  caches:{open:async name=>{assert.equal(name,'tapcalc-pre-alpha-pre-alpha19');return {match:async()=>undefined};}},fetch:async()=>{throw new TypeError('Synthetic offline figure');}});
workerEvents.get('fetch')({request:{url:'https://fixture.invalid/pre-alpha/measurement-figures/hot-tap-md-crop.webp?v=pre-alpha19',method:'GET'},respondWith:promise=>{offlineResponse=promise;}});
assert.equal((await offlineResponse).status,503,'A cold offline miss produces a handled image error, not an unhandled worker rejection');
// Model queued native close events explicitly, without changing browser timing.
const nodes=new Map(),events=new Map(),pendingClose=[];
const document={activeElement:null,getElementById:id=>nodes.get(id),addEventListener:(type,callback)=>events.set(type,callback)};
function node(id){
  const attributes=new Map(),listeners=new Map();
  const item={id,dataset:{},listeners,isConnected:true,classList:{remove(){},toggle(){}},
    getAttribute:key=>attributes.get(key)??null,setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key),
    addEventListener:(type,callback)=>listeners.set(type,callback),focus(){document.activeElement=this;}};
  nodes.set(id,item);return item;
}
for(const id of ['measurement-figure-dialog','original-figure-image','original-figure-pan','original-figure-fit','original-figure-close','original-figure-title','original-figure-caption','original-figure-source'])node(id);
const dialog=nodes.get('measurement-figure-dialog'),image=nodes.get('original-figure-image'),error={hidden:true};
image.closest=()=>({querySelector:()=>error});Object.defineProperty(image,'src',{set(value){image.setAttribute('src',value);}});
dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;pendingClose.push(()=>dialog.listeners.get('close')());};
installMeasurementFigures(document);
const open=key=>{
  const button=node(key);button.dataset.figureOpen=key;button.closest=()=>button;
  events.get('click')({target:button});assert.equal(image.getAttribute('src'),figureUrl(MEASUREMENT_FIGURES[key]));return button;
};
const first=open('plant-pt');nodes.get('original-figure-close').listeners.get('click')();
assert.equal(dialog.open,false);assert.equal(image.getAttribute('src'),null);assert.equal(document.activeElement,first,'Close restores focus synchronously, including touch browsers');
const second=open('pipeline-pt');document.activeElement=nodes.get('original-figure-close');pendingClose.shift()();
assert.equal(dialog.open,true);assert.equal(image.getAttribute('src'),figureUrl(MEASUREMENT_FIGURES['pipeline-pt']),'An older close event must not erase the newly opened figure');
assert.equal(document.activeElement,nodes.get('original-figure-close'),'A stale close event must not steal focus');
let prevented=false;dialog.listeners.get('cancel')({preventDefault(){prevented=true;}});
assert.equal(prevented,true);assert.equal(dialog.open,false);assert.equal(image.getAttribute('src'),null);assert.equal(document.activeElement,second,'Escape uses the same synchronous cleanup/focus owner');
pendingClose.shift()();assert.equal(document.activeElement,second);
console.log('PASS figure lifecycle: synchronous Close/Escape cleanup and focus; queued stale close cannot clear a reopened image or steal focus');
const module=readFileSync(new URL('../pre-alpha/measurement-figures.mjs',import.meta.url));
assert.ok(module.length<=8192);assert.ok(gzipSync(module).length<=3072,'Keep optional figure plumbing small; images stay external/on-demand');
console.log('PASS approved originals:5 exact WebP hashes/87242 bytes, dimensions/source/copyright/unknown revision, signed LD and complete PT notes, escaped alternatives, no eager src, Line Stop LD/WD != MD, runtime-only cache list and bounded JS');
console.log('FIGURE_BUDGET',JSON.stringify({images:bytes,module:module.length,gzip:gzipSync(module).length}));

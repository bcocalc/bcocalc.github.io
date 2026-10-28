import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {measurementHelpFor,measurementHelpMarkup} from '../pre-alpha/measurement-help.mjs';
import {resultsFor} from '../pre-alpha/model.mjs';
const op={operationType:'Line Stop',state:{md:'10',ld:'-2',ldSign:'-',ptc:'1',start:'-1',bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',bcoPipeID:'6',bcoCutterOD:'4',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3',unknown:{keep:[1,2]}}};
const before=structuredClone(op),results=resultsFor(op,'tap');
const moduleBytes=readFileSync(new URL('../pre-alpha/measurement-help.mjs',import.meta.url));
assert.ok(moduleBytes.length<=12288,'Optional guidance must remain a small dependency-free module');
assert.ok(gzipSync(moduleBytes).length<=4096,'Keep the compressed source budget below4KiB; no embedded binary payload');
assert.match(moduleBytes.toString(),/model\.mjs\?v=pre-alpha25/);
for(const stage of ['tap','stop','plug']){
  const guide=measurementHelpFor(op,stage),markup=measurementHelpMarkup(op,stage);
  assert.ok(guide.cards.length);
  assert.ok(guide.cards.every(card=>card.source.includes('Revision not recorded')));
  assert.match(markup,/data-no-terms="true"/);
  assert.match(markup,/Not to scale/);
  assert.doesNotMatch(markup,/<details[^>]*\sopen(?:\s|>)/,'Guidance must start collapsed');
  assert.doesNotMatch(markup,/<(?:svg|iframe|canvas)|\ssrc=|href=/,'No guessed SVGs, eager images, private pages or PDF links');
  assert.equal((markup.match(/<img /g)||[]).length,guide.cards.filter(card=>card.figure).length);
}
assert.equal(measurementHelpFor(op,'tap').cards.find(card=>card.key==='tap-start').diagram,undefined,'No universal Start index is invented');
assert.equal(measurementHelpFor(op,'stop').cards.find(card=>card.key==='stop-ld').diagram,undefined,'Do not infer one fixed head orientation');
assert.equal(measurementHelpFor(op,'stop').cards.find(card=>card.key==='stop-md').figure,undefined);
assert.match(measurementHelpFor(op,'stop').cards.find(card=>card.key==='stop-md').text,/LD\/WD, not MD/);
const plug=measurementHelpFor(op,'plug');
assert.match(plug.scope,/not certified for any family/);
const segmented=plug.cards.find(card=>card.key==='pipeline-jbf');
assert.match(segmented.text,/extended retention segment/);
assert.match(segmented.text,/not a Plant jack-bolt centerline/);
assert.match(segmented.text,/p\.22.*inconsistent.*no formal erratum/);
assert.match(segmented.text,/does not select a governing procedure or switch calculations/);
assert.match(segmented.source,/Revision A, 15MAY18/);
assert.match(segmented.source,/printed p\.27; PDF p\.28/);
assert.ok(plug.notes.some(note=>/Segment indexing and the later plug-thickness advance are separate/.test(note)));
assert.match(plug.cards.find(card=>card.key==='pipeline-pt').upper,/segment groove/);
assert.equal(plug.cards.find(card=>card.key==='plant-pt').upper,'Top plug face');
assert.ok(plug.notes.some(note=>/not implemented/.test(note)));
for(const type of ['HTP','Hi-Stop','Re Stop']){
  const unsupported={operationType:type,state:{}};
  for(const stage of ['tap','stop','plug'])assert.equal(measurementHelpMarkup(unsupported,stage),'');
}
assert.equal(measurementHelpFor({...op,state:{lineStopVariant:'hiStop'}},'stop'),null);
for(const stage of ['setup','pipe','review','saved'])assert.equal(measurementHelpMarkup(op,stage),'');
assert.deepEqual(op,before);
assert.deepEqual(resultsFor(op,'tap'),results,'Guidance cannot alter canonical results');
assert.match(readFileSync(new URL('../pre-alpha/service-worker.js',import.meta.url),'utf8'),/'\.\/measurement-help\.mjs\?v='\+BUILD/);
console.log('PASS measurement help: approved5 original-figure hooks without eager src, qualified Line Stop MD text, preserved family/task distinctions and unresolved training inconsistency, no private-document links or measurement/formula mutation');
console.log('MEASUREMENT_GUIDANCE_BUDGET',JSON.stringify({raw:moduleBytes.length,gzip:gzipSync(moduleBytes).length}));

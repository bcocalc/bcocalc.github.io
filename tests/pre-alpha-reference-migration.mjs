import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DATA} from '../pre-alpha/reference-data.mjs';
import {SUPPLEMENT} from '../pre-alpha/reference-supplement-data.mjs';
import {referenceTables,REFERENCE_CATEGORIES,currentPipeReferenceValues} from '../pre-alpha/references.mjs';
import {BUILD} from '../pre-alpha/model.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const before=JSON.stringify({DATA,SUPPLEMENT});
for(const key of ['stackups','manuals','papergaskets','pivothead','uwire','fieldcheck'])assert.ok(REFERENCE_CATEGORIES[key]);
for(const [category,filters]of [
  ...Object.keys(REFERENCE_CATEGORIES).map(key=>[key,{}]),
  ...['150','300','400','600'].map(rating=>['torque',{rating}]),
  ...['150','300','400','600','900'].map(rating=>['papergaskets',{rating}]),
  ...['capacity','helper','assembly','overview','procedures','checks'].map(topic=>['foldinghead',{topic}])
]){
  const data=referenceTables(category,filters);assert.ok(data.tables.length||data.lists.length,category);
  assert.doesNotMatch(JSON.stringify(data),/undefined|\[object Object\]/);
  for(const table of data.tables)for(const row of table.rows)assert.equal(row.length,table.columns.length,table.title);
}
assert.equal(referenceTables('stackups').records.length,450);
for(const source of SUPPLEMENT.stackupSources){const rows=referenceTables('stackups',{source:source.name}).records;assert.ok(rows.length);assert.ok(rows.every(row=>row.source===source.name));assert.match(source.path,/^\.\.\/reference\/stackups\/[^/]+\.pdf$/);}
assert.equal(referenceTables('manuals').tables[0].rows.length,5);assert.match(referenceTables('manuals').note,/placeholders, not complete inline manuals/);
for(const rating of ['150','300','400','600'])assert.equal(referenceTables('torque',{rating}).tables[0].rows.length,19);
assert.ok(referenceTables('torque',{rating:'400'}).tables[0].rows.every(row=>row[3]==='Contact Engineering'&&row[4]==='Contact Engineering'));
for(const rating of ['150','300','400','600','900'])assert.equal(referenceTables('papergaskets',{rating}).tables[0].rows.length,rating==='900'?19:20);
assert.match(referenceTables('papergaskets').note,/10,000 psi/);assert.match(referenceTables('papergaskets').note,/non-metallic/);
const smart=referenceTables('smartstop');assert.match(smart.note,/ASTM A574\/F835/);assert.match(smart.note,/nickel/);assert.match(smart.lists[0].items.join(' '),/Unmarked rows do not receive an inferred pressure rating/);
assert.match(referenceTables('fieldmanual',{topic:'checks'}).note,/> \.020|exceeds \.020|greater than \.020|over \.020|\.020/i);
assert.equal(referenceTables('fieldcheck').lists.length,6);assert.match(referenceTables('formulas').lists.map(x=>x.title).join(' '),/HTP Stop.*Hi-Stop/s);
for(const rounding of ['16','32','64']){const result=referenceTables('fractions',{decimal:'-1 1/2',rounding});assert.ok(result.note.startsWith('Nearest 1/'+rounding+' in: -1 1/2.'));assert.match(result.note,/Decimal inches: -1.5/);}
assert.ok(referenceTables('fractions',{decimal:'garbage'}).issue);
const assets=JSON.parse(vm.runInNewContext(read('pre-alpha/service-worker.js')+';JSON.stringify(ASSETS)',{URL,self:{location:{href:'https://example.test/pre-alpha/service-worker.js'},addEventListener(){}}}));
for(const path of ['reference-helpers.mjs','reference-supplement-data.mjs'])assert.ok(assets.includes('./'+path+'?v='+BUILD));
assert.match(read('pre-alpha/index.html'),/<title>TapCalc<\/title>/);
assert.equal(JSON.stringify({DATA,SUPPLEMENT}),before,'Lookups cannot mutate source data');
for(const path of ['pre-alpha/reference-helpers.mjs','pre-alpha/references.mjs'])assert.doesNotMatch(read(path),/localStorage\.(setItem|removeItem|clear)|sessionStorage\.|uploadJob|commitJob|deleteJob|addDoc\(/);
console.log('PASS reference migration integration: all classes, placeholders, qualifications, helpers, source filters, rounding, cache and read-only boundaries');

const operation={state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'14.0',bcoPipeID:'13.25',bcoCutterOD:'12'}};
const original=JSON.stringify(operation);assert.deepEqual(currentPipeReferenceValues('pivothead',operation).values,{material:'CarbonSteel',pipeSize:'14.0',wall:'0.375',measuredId:'13.25'});
assert.deepEqual(currentPipeReferenceValues('foldinghelper',operation).values,{pod:'14',wall:'0.375'});
assert.deepEqual(currentPipeReferenceValues('uwire',operation).values,{pipeOd:'14',wall:'0.375',cutterOd:'12'});
assert.equal(JSON.stringify(operation),original);assert.ok(currentPipeReferenceValues('pivothead',{state:{...operation.state,preAlphaPipeOD:'14.1'}}).issue);assert.ok(currentPipeReferenceValues('uwire',null).issue);
assert.equal(referenceTables('fieldmanual',{topic:'all'}).tables.length,['thread','rpm','histop','machines','checks'].reduce((n,topic)=>n+referenceTables('fieldmanual',{topic}).tables.length,0));
console.log('PASS read-only current-pipe transfers, unsupported custom diameter hold and all-topic manual browsing');

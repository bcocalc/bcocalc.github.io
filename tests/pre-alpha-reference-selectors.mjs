import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DATA} from '../pre-alpha/reference-data.mjs';
import {BUILD} from '../pre-alpha/model.mjs';
import {SUPPLEMENT} from '../pre-alpha/reference-supplement-data.mjs';
import {referenceTables,referenceView,referenceSelectionFields,createReferences,REFERENCE_CATEGORIES} from '../pre-alpha/references.mjs';
assert.match(readFileSync(new URL('../pre-alpha/index.html',import.meta.url),'utf8'),new RegExp('PRE-ALPHA '+BUILD.slice(-2)),'Visible masthead must match the versioned app and worker');
const before=JSON.stringify({DATA,SUPPLEMENT});
const rows=data=>data.tables.flatMap(table=>table.rows);
let checks=0;
for(const category of ['papergaskets','torque','bolting','cutters','htp','plant150','plant600','foldinghead','fieldmanual','stackups','fractions']){
  const data=referenceView(category);assert.ok(data.prompt,category+' starts with a deliberate choice');assert.equal(rows(data).length,0);assert.equal(data.records?.length||0,0);checks++;
}
for(const [category,charts,key,total]of [
  ['papergaskets',SUPPLEMENT.paperGaskets,'displaySize',99],
  ['torque',SUPPLEMENT.graphonic,'size',76],
  ['bolting',Object.fromEntries(Object.entries(DATA.bolting).map(([k,v])=>[k,v.rows])),'size',224]
]){
  let found=0;
  for(const [rating,source]of Object.entries(charts)){
    const all=referenceTables(category,{rating}).tables[0];
    for(const size of new Set(source.map(row=>row[key]))){
      const view=referenceView(category,{rating,size});
      assert.deepEqual(view.tables[0],{...all,rows:all.rows.filter(row=>row[0]===size)});found+=rows(view).length;checks++;
      assert.ok(referenceSelectionFields(category).find(field=>field.key==='size').options.some(([value])=>value===size));
    }
  }
  assert.equal(found,total,'Every source row is reachable by exact size/class');
  assert.equal(rows(referenceView(category,{},category==='papergaskets'?'compressed':'supplied')).length,total,'Search reaches all hidden rows/classes');
  assert.equal(rows(referenceView(category,{size:'unlisted'})).length,0,'No nearest-size substitution');
  assert.ok(referenceView(category,{size:'unlisted'}).tables.length,'Explicit no-match is distinct from choose-a-size');
}
for(const category of ['papergaskets','torque','bolting','cutters','htp','plant150','plant600','foldinghead','fieldmanual','fractions'])assert.ok(referenceSelectionFields(category).some(field=>field.options[0][1]==='Choose an option'),'Compact prompts use the adjacent descriptive field label');
assert.equal(referenceSelectionFields('papergaskets',{size:'4'})[1].options[0][1],'All listed classes','Compact native option text retains class meaning');
assert.equal(referenceSelectionFields('stackups')[0].options[0][1],'Choose family or search');
assert.equal(referenceSelectionFields('stackups')[1].options[0][1],'All source documents');
assert.equal(REFERENCE_CATEGORIES.papergaskets,'Durlon Gaskets','Requested section name is distinct from source material identity');
for(const filters of [{},{size:'4',rating:'600'},{size:'unlisted'}]){
  const result=referenceView('papergaskets',filters,'does-not-match');
  assert.match(result.qualification,/section name only.*Garlock\/GYLON.*not verified for your Durlon grade/);
  assert.match(result.qualification,/Do not treat their torque, stress or pressure values as validated Durlon recommendations/);
  for(const table of result.tables){assert.match(table.title,/Garlock \/ GYLON source — Paper Gaskets/);assert.doesNotMatch(table.title,/Durlon/);}
}
for(const alias of ['Durlon','Durlon Gaskets','Paper Gaskets'])assert.equal(rows(referenceView('papergaskets',{},alias)).length,99,'Old/new section aliases reach every original source row');
assert.match(referenceView('papergaskets').note,/Garlock.*GYLON/);assert.match(referenceView('papergaskets').note,/Multi-Swell 3760.*10,000 psi/);assert.match(referenceView('papergaskets').note,/non-metallic/);
assert.equal(rows(referenceView('papergaskets',{size:'3-1/2'})).length,4);
assert.ok(!referenceSelectionFields('papergaskets',{size:'3-1/2'}).find(field=>field.key==='rating').options.some(([value])=>value==='900'));
assert.equal(rows(referenceView('papergaskets',{size:'3-1/2',rating:'900'})).length,0);
assert.equal(rows(referenceView('torque',{size:'4',rating:'400'}))[0][3],'Contact Engineering');
for(const [kind,chart]of Object.entries(DATA.cutters))for(const row of chart.rows){assert.deepEqual(rows(referenceView('cutters',{kind,pipe:row[0]})),chart.rows.filter(item=>item[0]===row[0]));checks++;}
assert.equal(rows(referenceView('cutters',{kind:'lineStop',pipe:'42'})).length,0);
for(const category of ['htp','plant150','plant600'])for(const [size]of referenceSelectionFields(category)[0].options.filter(([value])=>value&&value!=='unlisted')){const expected=referenceTables(category).tables.map(table=>({...table,rows:table.rows.filter(row=>row[0]===size)}));assert.deepEqual(referenceView(category,{size}).tables,expected);checks++;}
for(const row of DATA.folding.capacityRows){assert.deepEqual(rows(referenceView('foldinghead',{line:row.line})),[[row.line,row.tap,row.psi,row.bar]]);checks++;}
for(const topic of ['thread','rpm','machines','checks','histop','all'])assert.ok(referenceView('fieldmanual',{topic}).prompt,topic);
for(const row of DATA.manual.cutterRpmRows){assert.deepEqual(rows(referenceView('fieldmanual',{topic:'rpm',machine:row.machine,cutter:row.cutter})),[[row.machine,row.cutter,row.rpm]]);checks++;}
const tolerance=referenceView('fieldmanual',{topic:'checks',boringOd:'4"'});assert.equal(rows(tolerance).length,3,'Repeated O.D. rows with different lengths all remain');assert.deepEqual(tolerance.lists,DATA.manual.checklistGroups);assert.match(tolerance.note,/supervisor/);
for(const [manualPart,indexes]of Object.entries({dimensions:[0,1],torque:[2],machinePressure:[3],flangePressure:[4]}))for(const item of referenceTables('fieldmanual',{topic:'histop'}).tables[indexes[0]].rows.map(row=>row[0])){const view=referenceView('fieldmanual',{topic:'histop',manualPart,item});assert.equal(view.tables.length,indexes.length);assert.ok(rows(view).every(row=>row[0]===item));checks++;}
assert.equal(referenceView('fieldmanual',{topic:'all'},'lash').tables.length,referenceTables('fieldmanual',{topic:'all'}).tables.length);
assert.equal(referenceView('stackups',{},'').records.length,0);
let records=[];for(const {name}of SUPPLEMENT.stackupSources){records.push(...referenceView('stackups',{source:name}).records);checks++;}assert.deepEqual(records,SUPPLEMENT.stackups);
for(const row of SUPPLEMENT.stackups){assert.ok(referenceView('stackups',{},row.name).records.some(record=>record.id===row.id),'Search includes later pages and repeated names');checks++;}
for(const type of new Set(SUPPLEMENT.stackups.map(row=>row.type))){assert.deepEqual(referenceView('stackups',{type}).records,SUPPLEMENT.stackups.filter(row=>row.type===type));checks++;}
assert.equal(referenceView('stackups',{},'no-source-match-xyz').records.length,0);
for(const row of referenceTables('fractions').tables[0].rows){assert.deepEqual(rows(referenceView('fractions',{fraction:row[0]})),[row]);checks++;}
assert.equal(referenceView('smartstop',{size:'6',wall:'.235'}).tables[0].rows.length,2,'Inclusive overlapping source rows stay ambiguous');
assert.ok(referenceView('smartstop',{size:'6',wall:'bad'}).issue);
assert.deepEqual(referenceView('smartstop',{size:'6'},'nothing-matches').lists,referenceTables('smartstop',{size:'6'}).lists,'Search cannot hide source limitations');
assert.equal(JSON.stringify({DATA,SUPPLEMENT}),before,'Selectors never mutate source data');

// Network-free event harness: exercise the real controller without pretending
// this is native browser/layout coverage. Browser tests cover those separately.
const listeners={},query={value:''},focus=[];
const content={innerHTML:'',dataset:{},querySelector:()=>({focus(){focus.push('count');}}),querySelectorAll:()=>Array.from({length:20},()=>({focus(){focus.push('count');}}))};
// Minimal keyed-element model for controller/reconciliation checks. It models
// identity, ordering and option/value updates, not native browser focus behavior.
const decode=value=>value.replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const encode=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let relocations=0,optionUpdates=0;
function parseControls(markup){
  return [...markup.matchAll(/<(label|button|div)\b[^>]*data-ref-control="([^"]*)"[^>]*>[\s\S]*?<\/\1>/g)].map(match=>{
    const raw=match[0],field=raw.match(/<(select|input) data-ref-filter="([^"]*)"[^>]*>/),label=raw.match(/data-ref-label="([^"]*)"/);
    let control=null;
    if(field){
      const options=[...raw.matchAll(/<option value="([^"]*)"([^>]*)>([\s\S]*?)<\/option>/g)].map(option=>({value:decode(option[1]),textContent:decode(option[3]),disabled:false,selected:option[2].includes('selected')}));
      control={tagName:field[1].toUpperCase(),dataset:{refFilter:field[2]},options,value:field[1]==='select'?(options.find(x=>x.selected)||options[0])?.value||'':decode(field[0].match(/ value="([^"]*)"/)?.[1]||''),replaceChildren(...items){optionUpdates++;this.options=items;this.value=(items.find(x=>x.selected)||items[0])?.value||'';}};
      Object.defineProperty(control,'outerHTML',{get(){return this.tagName==='SELECT'?'<select data-ref-filter="'+this.dataset.refFilter+'">'+this.options.map(x=>'<option value="'+encode(x.value)+'"'+(this.value===x.value?' selected':'')+'>'+encode(x.textContent)+'</option>').join('')+'</select>':'<input data-ref-filter="'+this.dataset.refFilter+'" value="'+encode(this.value)+'">';}});
    }
    const node={tagName:match[1].toUpperCase(),dataset:{refControl:decode(match[2]),...label?{refLabel:decode(label[1])}:{}},parent:null,querySelector:()=>control,remove(){if(this.parent){const siblings=this.parent.children;siblings.splice(siblings.indexOf(this),1);this.parent=null;}}};
    Object.defineProperty(node,'nextElementSibling',{get(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}});
    Object.defineProperty(node,'outerHTML',{get(){return control?raw.slice(0,raw.indexOf(field[0]))+control.outerHTML+'</label>':raw;}});
    return node;
  });
}
const filters={children:[],ownerDocument:{createElement(){return {content:{children:[]},set innerHTML(markup){this.content.children=parseControls(markup);}};}},get firstElementChild(){return this.children[0]||null;},get innerHTML(){return this.children.map(x=>x.outerHTML).join('');},insertBefore(node,position){if(node.parent){relocations++;node.remove();}const index=position?this.children.indexOf(position):this.children.length;this.children.splice(index,0,node);node.parent=this;},querySelector(selector){const key=selector.match(/data-ref-filter="([^"]*)"/)?.[1];return this.children.map(x=>x.querySelector()).find(x=>x?.dataset.refFilter===key);}};
const root={innerHTML:'',querySelector:selector=>({'#reference-filters':filters,'#reference-content':content,'#reference-query':query}[selector]),addEventListener:(type,fn)=>listeners[type]=fn};
createReferences(root);
const category=value=>listeners.change({target:{id:'reference-category',value,dataset:{}}});
const choose=(key,value)=>{const target=filters.querySelector('[data-ref-filter="'+key+'"]');assert.ok(target,'Control exists: '+key);target.value=value;listeners.change({target});};
const search=value=>{query.value=value;listeners.input({target:{id:'reference-query',value}});};
const click=(selector,dataset={})=>listeners.click({target:{closest:s=>s===selector?{dataset}:null}});
const selected=key=>filters.querySelector('[data-ref-filter="'+key+'"]')?.value;
category('papergaskets');assert.match(root.innerHTML,/Durlon Gaskets/);assert.match(content.innerHTML,/<p class="warning" data-reference-qualification role="note">Durlon Gaskets is the section name only/);assert.match(content.innerHTML,/Choose a pipe size/);assert.doesNotMatch(content.innerHTML,/<table>/);
const sizeControl=filters.querySelector('[data-ref-filter="size"]'),ratingControl=filters.querySelector('[data-ref-filter="rating"]');
const beforeRelocations=relocations,beforeOptionUpdates=optionUpdates;
choose('size','4');choose('rating','900');assert.equal(filters.querySelector('[data-ref-filter="size"]'),sizeControl);assert.equal(filters.querySelector('[data-ref-filter="rating"]'),ratingControl);assert.equal(relocations,beforeRelocations,'Unchanged controls are never detached/reinserted');assert.equal(optionUpdates,beforeOptionUpdates,'Unchanged option lists are not rebuilt');search('4');category('glossary');category('papergaskets');assert.equal(selected('size'),'4');assert.equal(selected('rating'),'900');assert.equal(query.value,'4');assert.match(content.innerHTML,/Paper Gaskets 900#/);
const resetRating=filters.querySelector('[data-ref-filter="rating"]');choose('size','3-1/2');assert.equal(filters.querySelector('[data-ref-filter="rating"]'),resetRating,'Dependent options update within the same control');assert.equal(selected('rating'),'','Dependent unavailable class resets, not silently retained');search('');assert.doesNotMatch(filters.innerHTML,/<option value="900"/);assert.doesNotMatch(content.innerHTML,/Paper Gaskets 900#/);
search('no-gasket-match');assert.match(content.innerHTML,/not verified for your Durlon grade/);assert.match(content.innerHTML,/Multi-Swell 3760/);assert.match(content.innerHTML,/No listed match/);
click('[data-ref-clear]');assert.equal(selected('size'),'');assert.equal(query.value,'');assert.doesNotMatch(content.innerHTML,/<table>/);
category('fieldmanual');choose('topic','rpm');choose('machine','1200');choose('cutter','40"');choose('machine','T101');assert.equal(selected('cutter'),'','Machine change resets unsupported cutter');assert.match(content.innerHTML,/T101/);assert.doesNotMatch(content.innerHTML,/<td>1200<\/td>/);
choose('topic','histop');choose('manualPart','torque');choose('item','2" 600# (360TM)');choose('manualPart','machinePressure');assert.equal(selected('item'),'','Different Hi-Stop subtopics never reuse unlike selections');
category('stackups');assert.doesNotMatch(content.innerHTML,/class="stackup-card"/);choose('source','Hot Tap Stackups.pdf');assert.equal((content.innerHTML.match(/class="stackup-card"/g)||[]).length,20);const first=content.innerHTML;click('[data-ref-page]',{refPage:'1'});assert.match(content.innerHTML,/Showing 21–40/);assert.notEqual(content.innerHTML,first);category('glossary');category('stackups');assert.match(content.innerHTML,/Showing 21–40/);choose('type','HTP Reference');assert.equal(selected('source'),'');assert.match(content.innerHTML,/HTP/);search('no-source-match-xyz');assert.match(content.innerHTML,/No matching source page/);search('');assert.match(content.innerHTML,/Showing 1–/);
category('glossary');search('');assert.match(content.innerHTML,/Page 1 of 2/);click('[data-ref-table-page]',{tableIndex:'0',refTablePage:'1'});assert.match(content.innerHTML,/showing 21–37/);search('MD');assert.doesNotMatch(content.innerHTML,/Page 2/);assert.ok(focus.length,'Pagination result focus is set by controller');
for(const file of ['pre-alpha/references.mjs'])assert.doesNotMatch(readFileSync(new URL('../'+file,import.meta.url),'utf8'),/localStorage\.(?:setItem|removeItem|clear)|sessionStorage\.|uploadJob|commitJob|deleteJob|addDoc\(/);
console.log(`PASS ${checks} reference selector/source cases plus controller memory, dependent reset, pagination, source safety and read-only boundaries`);

// Responsive cards must retain every source label/value, not just the columns
// that happened to fit in the old phone table. This checks markup, not layout.
category('papergaskets');click('[data-ref-clear]');choose('size','12');choose('rating','150');
function checkCardParity(){
  const cards=[...content.innerHTML.matchAll(/<dl class="reference-row-card">([\s\S]*?)<\/dl>/g)].map(match=>[...match[1].matchAll(/<div><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g)].map(pair=>[decode(pair[1]),decode(pair[2])]));
  const desktop=[...content.innerHTML.matchAll(/<table><thead><tr>([\s\S]*?)<\/tr><\/thead><tbody>([\s\S]*?)<\/tbody><\/table>/g)].flatMap(match=>{
    const columns=[...match[1].matchAll(/<th scope="col">([\s\S]*?)<\/th>/g)].map(x=>decode(x[1]));
    return [...match[2].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((cell,index)=>[columns[index],decode(cell[1])]));
  });
  assert.deepEqual(cards,desktop,'Every mobile field matches the existing desktop source table');
  return cards;
}
assert.equal(checkCardParity()[0].length,15,'All fifteen gasket fields, including torque and source');
click('[data-ref-clear]');search('Paper Gaskets');assert.equal(checkCardParity().length,99);
category('glossary');search('');assert.equal(checkCardParity().length,20);
click('[data-ref-table-page]',{tableIndex:'0',refTablePage:'1'});assert.equal(checkCardParity().length,17);
console.log('PASS responsive card markup parity: 15-field gasket, all 99 source rows, pagination; layout still requires browser checks.');

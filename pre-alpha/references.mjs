import {DATA} from './reference-data.mjs?v=pre-alpha09';
import {number,geometry} from './model.mjs?v=pre-alpha09';
import {TRUE_OD} from './pipe-data.mjs?v=pre-alpha09';
import {SUPPLEMENT} from './reference-supplement-data.mjs?v=pre-alpha09';
import {helperFields,helperReference} from './reference-helpers.mjs?v=pre-alpha09';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const REFERENCE_CATEGORIES={glossary:'Glossary',cutters:'Hot Tap / Line Stop cutters',smartstop:'SmartStop',foldinghead:'Folding Head',fieldmanual:'Field manual',bolting:'Bolting',htp:'HTP chart',plant150:'150# Plant',plant600:'600# Plant',torque:'Graphonic torque',papergaskets:'Durlon Gaskets',stackups:'Machine Stack-Ups',manuals:'Manual index',pivothead:'Pivot Head Setup',uwire:'U-Wire calculator',fieldcheck:'Field checklists',fractions:'Decimal / fraction',formulas:'Calculation guide'};
const table=(title,columns,rows)=>({title,columns,rows});
const objects=(title,rows,columns)=>table(title,columns.map(([,label])=>label),rows.map(row=>columns.map(([key])=>row[key]??'')));
export function positiveDecimal(value) {
  if(!String(value??'').trim())return null;
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(value).trim()))return NaN;
  const result=Number(value);return result>0?result:NaN;
}
export function referenceTables(category,filters={}) {
  const note='Reference only. Confirm the applicable equipment, source chart, and approved procedure. These lookups do not change job measurements.';
  const result={note,tables:[],lists:[]};
  if(category==='pivothead'||category==='uwire')return helperReference(category,filters);
  if(category==='glossary')result.tables=[table('Terms from the existing TapCalc glossary',['Term','Meaning'],DATA.glossary)];
  if(category==='cutters'){
    const key=filters.kind||'hotTap',chart=DATA.cutters[key];
    result.note=note+' '+(key.startsWith('floStop')?'FloStop II / IP-412 ONLY: not the standard cutter chart. Furmanite/IPSCO catalog pages 33-34.':'Standard TEAM chart; 22/26/28 entries are separate Furmanite/IPSCO IP-914 catalog supplements, page 25. Confirm cutter/fitting compatibility.');
    result.tables=[table(chart.label,['Nominal pipe size (in)','Cutter O.D. (in)'],chart.rows.filter(row=>!filters.pipe||row[0]===filters.pipe))];
  }
  if(category==='smartstop'){
    const chart=DATA.smartstop.suffixCharts.find(item=>item.size===(filters.size||'4'));
    const wall=positiveDecimal(filters.wall),id=positiveDecimal(filters.id);
    result.note=note+' '+SUPPLEMENT.smartstop.torqueNote+' '+chart.note+' Inclusive source ranges and overlaps are preserved; multiple matches are not resolved automatically. Printed page '+chart.printedPage+'.';
    if(Number.isNaN(wall)||Number.isNaN(id))result.issue='Enter positive decimal wall / I.D. values, or leave filters blank. Fractions and partial numbers are not accepted for this equipment lookup.';
    const rows=result.issue?[]:chart.rows.filter(row=>(wall===null||wall>=row.wallMin&&wall<=row.wallMax)&&(id===null||id>=row.pipeIdMin&&id<=row.pipeIdMax));
    result.tables=[table(chart.label+' - '+rows.length+' matching rows',['Suffix','Pressure','Wall (in)','Pipe I.D. (in)','Foot pad shims','Nose pad shims','Nose ring','Seal','Retaining ring','Foot pad','Nose pad','Source note'],rows.map(row=>[row.sourceLabel,row.pressure,row.wallLabel,row.pipeIdLabel,row.footPadShims,row.nosePadShims,row.noseRing,row.seal,row.retainingRing,row.footPad,row.primaryNosePad||row.secondaryNosePad?'Primary '+row.primaryNosePad+' / Secondary '+row.secondaryNosePad:row.nosePad,row.sourceNote])),objects('Source torque table (blank cells remain unlisted)',DATA.smartstop.torqueRows,[['screwSize','Screw size'],['ftLb','ft-lb'],['inLb','in-lb']])];
  }
  if(category==='smartstop')result.lists=[{title:'Source and limitations',items:SUPPLEMENT.smartstop.sourceNotes}];
  if(category==='foldinghead'){
    if(filters.topic==='helper')return helperReference('foldinghelper',filters);
    result.note=note+' '+SUPPLEMENT.folding.sourceNote+' '+SUPPLEMENT.folding.capacityNote+' Source maximum temperature: '+SUPPLEMENT.folding.maxTemperature+'.';
    if((filters.topic||'capacity')==='capacity')result.tables=[objects('Capacity',DATA.folding.capacityRows,[['line','Line size (in)'],['tap','Tap size (in)'],['psi','Pressure (psi)'],['bar','Pressure (bar)']])];
    else if(filters.topic==='procedures')result.tables=[table('Source procedure identifiers',['Identifier','Application'],DATA.folding.procedureRows)];
    else if(filters.topic==='overview')result.lists=[{title:'Source overview',items:SUPPLEMENT.folding.overviewNotes},{title:'Good fit',items:SUPPLEMENT.folding.goodFit},{title:'Watch outs',items:SUPPLEMENT.folding.watchOuts},{title:'DS-803 source details',items:[SUPPLEMENT.folding.ds803Note]}];
    else if(filters.topic==='assembly')result.lists=[{title:'Head assembly — source reminders',items:SUPPLEMENT.folding.headAssembly}];
    else result.lists=[{title:'Setup checks',items:DATA.folding.setupChecks},{title:'Execution checks',items:DATA.folding.executionChecks},{title:'Concrete cylinder pipe reminders',items:DATA.folding.pccpChecks}];
  }
  if(category==='fieldmanual'){
    const d=DATA.manual,topic=filters.topic||'thread';
    if(topic==='all'){const topics=['thread','rpm','histop','machines','checks'].map(topic=>referenceTables('fieldmanual',{topic}));result.tables=topics.flatMap(data=>data.tables);result.lists=topics.flatMap(data=>data.lists);result.note=note+' '+SUPPLEMENT.bearingLashNote;}
    if(topic==='thread')result.tables=[objects('Thread make-up - measure actual make-up in the field',d.threadMakeupRows,[['size','Nominal pipe size'],['makeup','Make-up']])];
    if(topic==='rpm')result.tables=[objects('Source cutter RPM table (separate from the estimator range chart)',d.cutterRpmRows,[['machine','Machine'],['cutter','Cutter size'],['rpm','RPM']])];
    if(topic==='histop')result.tables=[objects('Adapter minimum bore',d.hiStopAdapterRows,[['size','Size'],['bore','Minimum I.D. bore']]),objects('600# bolt circles',d.hiStopBoltCircleRows,[['size','Size'],['circle','Bolt circle']]),objects('Torque passes',d.hiStopTorqueRows,[['flange','Flange'],['pattern','Pattern'],['passes','Passes']]),objects('Machine pressure / temperature',d.hiStopPressureRows,[['machine','Machine'],['cold','Low temperature'],['hot','High temperature']]),objects('Flange pressure / temperature',d.flangePressureRows,[['flange','Flange'],['cold','Low temperature'],['hot','High temperature']])];
    if(topic==='machines')result.tables=[objects('Machine operating specifications',d.machineSpecRows,Object.entries({name:'Machine',pressure:'Pressure',temperature:'Temperature',travel:'Travel',feed:'Feed',range:'Range',flange:'Flange',bolts:'Bolts',weight:'Weight',drive:'Drive',bar:'Boring bar'}))];
    if(topic==='checks'){result.note=note+' '+SUPPLEMENT.bearingLashNote;result.lists=d.checklistGroups;result.tables=[objects('Boring bar tolerance',d.toleranceRows,[['od','Boring bar O.D.'],['length','Length'],['runout','Run-out'],['lash','Feed nut lash'],['travel','Feed screw travel']])];}
  }
  if(category==='bolting'){
    const key=filters.rating||'150',chart=DATA.bolting[key];
    const columns=[['size','Pipe size (in)'],['bolts','Bolts / studs'],['diameter','Stud diameter (in)'],['stud_rf','Stud length RF (in)'],['stud_rtj','Stud length RTJ (in)'],['stud','Stud length (in)'],['wrench','Wrench (in)']].filter(([name])=>chart.rows.some(row=>name in row));
    result.tables=[objects('Class '+key+' - supplied bolt / stud chart',chart.rows,columns)];
  }
  if(category==='htp'){result.note=note+' HTP source-chart labels are equipment-specific; do not substitute them for standard Hot Tap outputs.';result.tables=[table('HTP source chart',['Pipe size (in)','Branch','Head','Cutter (in)','BCO (source label)'],Object.entries(DATA.htp).map(([size,row])=>[size,row.branch,row.head,row.cutter,row.bco]))];}
  if(category==='plant150'||category==='plant600'){
    const rating=category==='plant150'?'150':'600';result.tables=[table(rating+'# Plant',['Size','Jack-bolt wrench','Packing nut wrench','Jack-bolt count'],DATA['plant'+rating]),table('Sealtite 1 jack-bolt measurements',['Size','Class','Measurement fully set','Measurement fully retracted','Turns fully set','Turns fully retracted'],DATA.sealtite.filter(row=>row[1]===rating+'#'))];
  }
  if(category==='torque'){
    const rating=filters.rating||'600';result.note=note+' '+SUPPLEMENT.graphonicNote;
    result.tables=[objects('Graphonic '+rating+'# - supplied Garlock chart',SUPPLEMENT.graphonic[rating]||[],[['size','Size (in)'],['bolts','Bolts'],['boltSize','Bolt size (in)'],['minTorque','Minimum per bolt (ft-lb, unless source says Contact Engineering)'],['preferredTorque','Preferred per bolt (ft-lb, unless source says Contact Engineering)'],['source','Source']])];
  }
  if(category==='papergaskets'){
    const rating=filters.rating||'150';result.note=note+' '+SUPPLEMENT.paperGasketNote;
    result.qualification='Durlon Gaskets is the section name only. These Garlock/GYLON source tables are not verified for your Durlon grade. Do not treat their torque, stress or pressure values as validated Durlon recommendations.';
    result.tables=[objects('Garlock / GYLON source — Paper Gaskets '+rating+'# - compressed sheet / GYLON',SUPPLEMENT.paperGaskets[rating]||[],[['displaySize','Pipe size (in)'],['rfId','RF I.D. (in)'],['rfOd','RF O.D. (in)'],['area','Gasket area (sq in)'],['bolts','Bolts'],['boltSize','Bolt size (in)'],['torque60','Torque at 60,000 psi bolt stress (ft-lb)'],['compForce','Compression force (lb)'],['maxStressAvail','Maximum available gasket stress (psi)'],['internalPressure','Internal pressure (psi; source limit)'],['minGasketStress','Minimum gasket stress (psi)'],['minTorque','Minimum per bolt (ft-lb)'],['maxRecAvailStress','Maximum recommended available stress (psi)'],['preferredTorque','Preferred per bolt (ft-lb)'],['source','Source']])];
  }
  if(category==='stackups'){
    result.note=note+' '+SUPPLEMENT.stackupNote+' Page previews and original PDFs require a connection; extracted reference text is available with the pre-alpha offline assets.';
    result.lists=[{title:'Source-page reference',items:['Search across equipment, dimensions, weights, notes, source filename and extracted page text. Verify the original drawing: extracted dimensions are not labeled engineering inputs.']}];
    result.records=SUPPLEMENT.stackups.filter(row=>!filters.source||row.source===filters.source);
  }
  if(category==='manuals'){
    result.note=note+' These five entries are source index placeholders, not complete inline manuals. No missing manual content or file availability is implied.';
    result.tables=[objects('Manual index — not yet converted',SUPPLEMENT.manuals,[['name','Manual'],['range','Equipment'],['source','Source filename'],['use','Status'],['text','Cross-check note']])];
  }
  if(category==='fieldcheck'){result.note=note+' '+SUPPLEMENT.fieldChecklistNote;result.lists=SUPPLEMENT.fieldChecklists;}

  if(category==='fractions'){
    const gcd=(a,b)=>b?gcd(b,a%b):a;
    result.tables=[table('Sixteenths and sixty-fourths',['Fraction (in)','Decimal (in)'],Array.from({length:65},(_,n)=>{const d=gcd(n,64);return [n===0?'0':n===64?'1':n/d+'/'+64/d,(n/64).toFixed(6)];}))];
    if(String(filters.decimal??'').trim()){
      const value=number(filters.decimal);
      if(!Number.isFinite(value))result.issue='Enter a valid signed decimal or fraction.';
      else {const denominator=[16,32,64].includes(Number(filters.rounding))?Number(filters.rounding):64,rounded=Math.round(Math.abs(value)*denominator),whole=Math.floor(rounded/denominator),part=rounded%denominator,d=gcd(part,denominator);result.note='Nearest 1/'+denominator+' in: '+(value<0?'-':'')+(whole?whole+' ':'')+(part?part/d+'/'+denominator/d:whole?'':'0')+'. Decimal inches: '+value+'. Rounding is not an exact conversion for every decimal. '+note;}
    }
  }
  if(category==='formulas')result.lists=[
    {title:'Hot Tap',items:['LI = MD +/- LD. POP = Rod start + LI. COP = POP + PTC. Rod BCO = COP + BCO. Total travel = LI + PTC + BCO.']},
    {title:'Line Stop',items:['LI = Line Stop MD +/- Line Stop LD + Pipe & cutter O.D. - wall thickness. Only MD can carry from Hot Tap; other measurements remain independent.']},
    {title:'Completion Plug',items:['LI = Start + JBF + LD + PT. An active manual override replaces this calculated lower-in output, not the saved inputs.']},
    {title:'Cutting time',items:['ETA to BCO = current BCO / (RPM x 0.004 in/revolution). Setup, approach, and Line Stop / Completion Plug work are excluded.']}
  ];
  if(category==='formulas'){result.note=note+' '+SUPPLEMENT.stopMathNote;result.lists.push(...SUPPLEMENT.stopMath);}
  return result;
}

// Selector choices are derived only from source labels. They do not infer
// equipment compatibility, pressure ratings, or unlabeled stack-up dimensions.
const unique=items=>[...new Set(items.map(String))];
const sizeOrder=(a,b)=>number(String(a).replaceAll('"','').replace(/(?<=\d)-(?=\d+\/)/g,' '))-number(String(b).replaceAll('"','').replace(/(?<=\d)-(?=\d+\/)/g,' '));
const choices=(key,label,items,{required=false,all='All listed matches',sort=false}={})=>({key,label,options:[[ '',required?'Choose '+label.toLowerCase():all],...(sort?unique(items).sort(sizeOrder):unique(items)).map(value=>[value,value]),...(required?[['unlisted','Other / unlisted']]:[])]});
const classRows=category=>category==='papergaskets'?SUPPLEMENT.paperGaskets:category==='torque'?SUPPLEMENT.graphonic:Object.fromEntries(Object.entries(DATA.bolting).map(([key,chart])=>[key,chart.rows]));
const gasketSize=(category,row)=>category==='papergaskets'?row.displaySize:row.size;
export function referenceSelectionFields(category,values={}) {
  if(['papergaskets','torque','bolting'].includes(category)){
    const charts=classRows(category),ratings=Object.keys(charts).filter(key=>!values.size||charts[key].some(row=>gasketSize(category,row)===values.size));
    return [choices('size','Pipe size (in)',Object.values(charts).flatMap(rows=>rows.map(row=>gasketSize(category,row))),{required:true,sort:true}),choices('rating','Flange class',ratings,{all:'All listed classes for this size'})];
  }
  if(category==='cutters')return [{key:'kind',label:'Equipment / operation',options:['hotTap','lineStop','floStopHotTap','floStopLineStop'].map(key=>[key,DATA.cutters[key].label])},choices('pipe','Nominal pipe size (in)',Object.values(DATA.cutters).flatMap(chart=>chart.rows.map(row=>row[0])),{required:true,sort:true})];
  if(category==='htp')return [choices('size','Pipe size (in)',Object.keys(DATA.htp),{required:true,sort:true})];
  if(category==='plant150'||category==='plant600')return [choices('size','Pipe size',DATA[category].map(row=>row[0]),{required:true,sort:true})];
  if(category==='foldinghead'&&(values.topic||'capacity')==='capacity')return [choices('line','Line size (in)',DATA.folding.capacityRows.map(row=>row.line),{required:true,sort:true})];
  if(category==='fieldmanual'){
    const topic=values.topic||'thread',d=DATA.manual;
    if(topic==='thread')return [choices('size','Nominal pipe size',d.threadMakeupRows.map(row=>row.size),{required:true,sort:true})];
    if(topic==='rpm')return [choices('machine','Machine',d.cutterRpmRows.map(row=>row.machine),{required:true}),choices('cutter','Cutter size',d.cutterRpmRows.filter(row=>!values.machine||row.machine===values.machine).map(row=>row.cutter),{sort:true})];
    if(topic==='machines')return [choices('machine','Machine',d.machineSpecRows.map(row=>row.name),{required:true})];
    if(topic==='checks')return [choices('boringOd','Boring bar O.D.',d.toleranceRows.map(row=>row.od),{required:true,sort:true})];
    if(topic==='histop'){
      const part=values.manualPart||'dimensions';
      const fields=[{key:'manualPart',label:'Hi-Stop reference',options:[['dimensions','Adapter bore / bolt circle'],['torque','Torque passes'],['machinePressure','Machine pressure / temperature'],['flangePressure','Flange pressure / temperature']]}];
      const rows={dimensions:d.hiStopAdapterRows,torque:d.hiStopTorqueRows,machinePressure:d.hiStopPressureRows,flangePressure:d.flangePressureRows}[part]||[],key={dimensions:'size',torque:'flange',machinePressure:'machine',flangePressure:'flange'}[part];
      return [...fields,choices('item',part==='dimensions'?'Hi-Stop size':part==='machinePressure'?'Machine':'Flange',rows.map(row=>row[key]),{required:true})];
    }
  }
  if(category==='stackups'){
    const rows=SUPPLEMENT.stackups.filter(row=>!values.type||row.type===values.type);
    return [choices('type','Equipment family',SUPPLEMENT.stackups.map(row=>row.type),{all:'Choose a family, source, or search'}),choices('source','Source document',rows.map(row=>row.source),{all:'All source documents in this family'})];
  }
  if(category==='fractions')return [choices('fraction','Fraction to look up (in)',referenceTables('fractions').tables[0].rows.map(row=>row[0]),{required:true})];
  return [];
}
// Keep source-table access complete for parity/search; the UI view alone requires
// a choice before displaying a long table. An explicit search can inspect all rows.
export function referenceView(category,values={},query='') {
  let data=referenceTables(category,values),required='',needle=query.trim().toLowerCase();
  const exact=(table,index,value)=>({...table,rows:table.rows.filter(row=>!value||String(row[index])===value)});
  if(['papergaskets','torque','bolting'].includes(category)){
    const ratings=values.rating?[values.rating]:Object.keys(classRows(category));
    data.tables=ratings.flatMap(rating=>referenceTables(category,{rating}).tables.map(table=>exact(table,0,values.size)));
    if(!values.rating&&data.tables.some(table=>table.rows.length))data.tables=data.tables.filter(table=>table.rows.length);
    required=values.size?'':'Choose a pipe size to see matching source rows and class options, or search all source rows.';
  }
  if(category==='cutters')required=values.pipe?'':'Choose the nominal pipe size to see matching cutters, or search the selected equipment chart.';
  if(category==='htp'||category==='plant150'||category==='plant600'){
    data.tables=data.tables.map(table=>exact(table,0,values.size));required=values.size?'':'Choose a pipe size to see matching source rows, or search this reference.';
  }
  if(category==='foldinghead'&&(values.topic||'capacity')==='capacity'){
    data.tables=data.tables.map(table=>exact(table,0,values.line));required=values.line?'':'Choose a line size to see the source capacity. The source limitations above apply to every size.';
  }
  if(category==='fieldmanual'){
    const topic=values.topic||'thread';
    if(topic==='thread'){data.tables=data.tables.map(table=>exact(table,0,values.size));required=values.size?'':'Choose a nominal pipe size to see thread make-up, or search the source rows.';}
    if(topic==='rpm'){data.tables=data.tables.map(table=>exact(exact(table,0,values.machine),1,values.cutter));required=values.machine?'':'Choose a machine to see its source cutter RPM rows, or search all machine rows.';}
    if(topic==='machines'){data.tables=data.tables.map(table=>exact(table,0,values.machine));required=values.machine?'':'Choose a machine to see the source specifications, or search all machine rows.';}
    if(topic==='checks'){data.tables=data.tables.map(table=>exact(table,0,values.boringOd));required=values.boringOd?'':'Choose a boring bar O.D. for its tolerance rows. All post-job checks remain below.';}
    if(topic==='histop'){
      const part=values.manualPart||'dimensions',indexes={dimensions:[0,1],torque:[2],machinePressure:[3],flangePressure:[4]}[part]||[];
      data.tables=indexes.map(index=>exact(data.tables[index],0,values.item));required=values.item?'':'Choose the exact size, machine or flange listed in this source. Do not substitute another setup.';
    }
    if(topic==='all')required='Enter a search to inspect all manual topics, or choose a focused topic above.';
  }
  if(category==='stackups'){
    data.records=data.records.filter(row=>!values.type||row.type===values.type);
    required=values.type||values.source?'':'Choose an equipment family or source document, or search all 450 source pages. Extracted dimensions are not used as size selectors because their labels are unverified.';
  }
  if(category==='fractions'){
    data.tables=data.tables.map(table=>exact(table,0,values.fraction));required=values.fraction?'':'Enter a value to convert above, or choose a fraction for its exact decimal. No full chart to scan.';
  }
  if(required&&!needle){data.tables=[];if(data.records)data.records=[];data.prompt=required;}
  // Search before pagination so every source row/page remains reachable.
  data.tables=data.tables.map(table=>({...table,rows:table.rows.filter(row=>(table.title+' '+(category==='papergaskets'?'Durlon Gaskets Paper Gaskets ':'')+row.join(' ')).toLowerCase().includes(needle))}));
  if(data.records)data.records=data.records.filter(row=>[row.name,row.type,row.range,row.source,row.sourcePage,...row.dimensions,...row.weights,...row.notes,row.text].join(' ').toLowerCase().includes(needle));
  return data;
}

export function createReferences(root,{getOperation=()=>null}={}) {
  let category='glossary',query='',transferNote='',page=0;const values={},states=new Map(),tablePages=new Map();const previews=new Set();
  const select=(key,label,options)=>'<label class="field">'+escape(label)+'<select data-ref-filter="'+key+'">'+options.map(([value,text])=>'<option value="'+escape(value)+'"'+(String(values[key]??options[0][0])===value?' selected':'')+'>'+escape(text)+'</option>').join('')+'</select></label>';
  const input=(key,label)=>'<label class="field">'+escape(label)+'<input data-ref-filter="'+key+'" inputmode="decimal" value="'+escape(values[key]||'')+'"></label>';
  root.innerHTML='<div class="reference-controls"><label class="field">Reference category<select id="reference-category">'+Object.entries(REFERENCE_CATEGORIES).map(([value,title])=>'<option value="'+value+'">'+escape(title)+'</option>').join('')+'</select></label><label class="field">Search this reference<input id="reference-query" type="search" placeholder="Search selected filters; clear to search all"></label></div><div id="reference-filters" class="reference-controls"></div><div id="reference-content"></div>';
  const filters=root.querySelector('#reference-filters'),content=root.querySelector('#reference-content');
  function controls(){
    if(category==='cutters')filters.innerHTML='';
    else if(category==='smartstop')filters.innerHTML=select('size','SmartStop size',DATA.smartstop.suffixCharts.map(chart=>[chart.size,chart.label]))+input('wall','Wall filter (positive decimal inches)')+input('id','Pipe I.D. filter (positive decimal inches)');
    else if(category==='foldinghead')filters.innerHTML=select('topic','Folding Head topic',[['capacity','Capacity'],['helper','Set-point / bar-target helper'],['assembly','Head assembly'],['overview','Source, fit and limitations'],['procedures','Procedure identifiers'],['checks','Source checklists']]);
    else if(category==='fieldmanual')filters.innerHTML=select('topic','Field manual topic',[['thread','Thread make-up'],['all','All manual topics / search'],['rpm','Cutter RPM'],['histop','Hi-Stop setup'],['machines','Machine specifications'],['checks','Post-job checks / tolerances']]);
    else if(category==='fractions')filters.innerHTML=input('decimal','Decimal or fraction to convert (in)')+select('rounding','Round to nearest',[['64','1/64 in'],['32','1/32 in'],['16','1/16 in']]);
    else filters.innerHTML='';
    for(const field of referenceSelectionFields(category,values)){
      if(!field.options.some(([value])=>value===values[field.key]))values[field.key]=field.options[0][0];
      filters.innerHTML+=select(field.key,field.label,field.options);
    }
    const helper=category==='foldinghead'&&values.topic==='helper'?'foldinghelper':['pivothead','uwire'].includes(category)?category:'';
    if(helper){
      const fields=helperFields(helper,values);
      for(const field of fields){
        if(field.options&&!field.options.some(([value])=>value===values[field.key]))values[field.key]=field.options[0][0];
        else if(values[field.key]===undefined&&field.defaultValue!==undefined)values[field.key]=field.defaultValue;
      }
      filters.innerHTML+=(fields.map(field=>field.options?select(field.key,field.label,field.options):input(field.key,field.label)).join(''));
    }
    if(helper)filters.innerHTML+='<button type="button" data-ref-current-pipe>Use current pipe (reference only)</button>';
    if(category==='fractions')filters.innerHTML+='<div class="fraction-quick" role="group" aria-label="Quick decimal inserts">'+[['0.0625','1/16'],['0.1250','1/8'],['0.2500','1/4'],['0.3750','3/8'],['0.5000','1/2']].map(([value,label])=>'<button type="button" data-ref-decimal="'+value+'">'+label+'</button>').join('')+'</div>';
    if(referenceSelectionFields(category,values).length||['pivothead','uwire','foldinghead','fractions','smartstop'].includes(category))filters.innerHTML+='<button type="button" data-ref-clear>Clear reference inputs</button>';
  }
  function render(){
    for(const stop of previews)stop();previews.clear();
    const data=referenceView(category,values,query);content.dataset.helpContext=category;
    content.innerHTML=(data.qualification?'<p class="warning" data-reference-qualification role="note">'+escape(data.qualification)+'</p>':'')+'<p class="result-hint">'+escape(data.note)+'</p>'+(transferNote?'<p class="result-hint" role="status">'+escape(transferNote)+'</p>':'')+(data.issue?'<p class="warning" role="status">'+escape(data.issue)+'</p>':'')+
      (data.prompt?'<p class="reference-prompt" role="status">'+escape(data.prompt)+'</p>':'')+
      (data.records&&!data.prompt?stackupCards(data.records,page):'')+
      data.tables.map((item,index)=>{const rows=item.rows,current=Math.min(tablePages.get(index)||0,Math.max(0,Math.ceil(rows.length/20)-1)),visible=rows.slice(current*20,current*20+20);return '<section class="reference-section"><h3>'+escape(item.title)+'</h3><p class="reference-count" role="status" tabindex="-1">'+rows.length+' matching rows'+(rows.length>20?'; showing '+(current*20+1)+'–'+(current*20+visible.length):'')+'</p>'+pagination(current,rows.length,'data-ref-table-page',index)+'<div class="reference-table-wrap" tabindex="0" role="region" aria-label="'+escape(item.title)+' table; scroll horizontally if needed"><table><thead><tr>'+item.columns.map(label=>'<th scope="col">'+escape(label)+'</th>').join('')+'</tr></thead><tbody>'+visible.map(row=>'<tr>'+row.map(value=>'<td>'+escape(value===''?'Not listed':value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+(rows.length?'':'<p class="result-hint">No listed match. Do not substitute a different size, class or equipment.</p>')+'</section>';}).join('')+
      data.lists.map(list=>'<section class="reference-section"><h3>'+escape(list.title)+'</h3><ul>'+list.items.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul></section>').join('');
  }
  root.addEventListener('change',event=>{
    if(event.target.id==='reference-category'){
      states.set(category,{values:{...values},query,page,tablePages:[...tablePages]});category=event.target.value;transferNote='';
      const saved=states.get(category);for(const key of Object.keys(values))delete values[key];Object.assign(values,saved?.values||{});query=saved?.query||'';page=saved?.page||0;tablePages.clear();for(const [key,value]of saved?.tablePages||[])tablePages.set(key,value);root.querySelector('#reference-query').value=query;controls();render();
    }
    else if(event.target.dataset.refFilter){
      const key=event.target.dataset.refFilter;values[key]=event.target.value;page=0;tablePages.clear();
      if(key==='topic'){for(const name of ['size','machine','cutter','manualPart','item','boringOd'])delete values[name];}
      if(key==='manualPart')delete values.item;
      if(event.target.tagName==='SELECT'){controls();filters.querySelector('[data-ref-filter="'+key+'"]')?.focus();}render();
    }
  });
  root.addEventListener('input',event=>{if(event.target.id==='reference-query'){query=event.target.value;page=0;tablePages.clear();render();}else if(event.target.dataset.refFilter&&event.target.tagName==='INPUT'){values[event.target.dataset.refFilter]=event.target.value;render();}});
  root.addEventListener('click',event=>{
    if(event.target.closest('[data-ref-clear]')){transferNote='';query='';page=0;tablePages.clear();root.querySelector('#reference-query').value='';const topic=values.topic;for(const key of Object.keys(values))delete values[key];if(topic)values.topic=topic;controls();render();}
    if(event.target.closest('[data-ref-current-pipe]')){
      const helper=category==='foldinghead'?'foldinghelper':category,transfer=currentPipeReferenceValues(helper,getOperation());
      if(transfer.issue)transferNote=transfer.issue;else{Object.assign(values,transfer.values);transferNote='Copied the current pipe into this reference only. Other helper inputs are unchanged; verify them independently. Job measurements were not changed.';}
      controls();render();
    }
    const quick=event.target.closest('[data-ref-decimal]');if(quick){values.decimal=quick.dataset.refDecimal;controls();render();}
    const pageButton=event.target.closest('[data-ref-page]');if(pageButton){page=Number(pageButton.dataset.refPage);render();content.querySelector('.reference-count')?.focus();}
    const tableButton=event.target.closest('[data-ref-table-page]');if(tableButton){tablePages.set(Number(tableButton.dataset.tableIndex),Number(tableButton.dataset.refTablePage));render();content.querySelectorAll('.reference-count')[Number(tableButton.dataset.tableIndex)]?.focus();}
    const trigger=event.target.closest('[data-stackup-preview]');if(trigger)previewStackup(trigger,previews);
  });
  controls();render();return {render};
}


function pagination(page,count,attribute,index='') {
  if(count<=20)return '';
  return '<nav class="reference-pagination" aria-label="Source result pages"><button type="button" '+attribute+'="'+(page-1)+'" data-table-index="'+index+'"'+(page===0?' disabled':'')+'>Previous results</button><span>Page '+(page+1)+' of '+Math.ceil(count/20)+'</span><button type="button" '+attribute+'="'+(page+1)+'" data-table-index="'+index+'"'+((page+1)*20>=count?' disabled':'')+'>Next results</button></nav>';
}
function stackupCards(matches,page) {
  page=Math.min(page,Math.max(0,Math.ceil(matches.length/20)-1));
  return '<section class="reference-section"><h3>Machine Stack-Ups</h3><p class="reference-count" role="status" tabindex="-1">'+matches.length+' matching source pages. Showing '+(matches.length?page*20+1:0)+'–'+Math.min((page+1)*20,matches.length)+'.</p>'+pagination(page,matches.length,'data-ref-page')+matches.slice(page*20,page*20+20).map(row=>{
    const source=SUPPLEMENT.stackupSources.find(item=>item.name===row.source),url=source.path+'#page='+row.sourcePage;
    return '<details class="stackup-card"><summary>'+escape(row.name)+'<small>'+escape(row.source)+' — page '+escape(row.sourcePage)+'</small></summary><p>'+escape(row.type)+' · '+escape(row.range)+'</p><p>'+escape(row.use)+'</p><dl><dt>Extracted dimensions (unlabeled)</dt><dd>'+escape(row.dimensions.join(', ')||'Not listed')+'</dd><dt>Weight text</dt><dd>'+escape(row.weights.join('; ')||'Not listed')+'</dd></dl><p>'+escape(row.notes.join(' '))+'</p><details><summary>Extracted source text</summary><p>'+escape(row.text)+'</p></details><p class="stackup-actions"><a href="'+escape(url)+'" target="_blank" rel="noopener">Open source PDF, page '+row.sourcePage+'</a><button type="button" data-stackup-preview="'+escape(row.id)+'" aria-expanded="false">Preview source page</button></p><div class="stackup-preview" hidden></div></details>';
  }).join('')+(matches.length?'':'<p class="result-hint">No matching source page. Do not substitute another equipment model.</p>')+'</section>';
}

async function previewStackup(trigger,previews) {
  const holder=trigger.closest('.stackup-card').querySelector('.stackup-preview');
  if(trigger.cancelPreview){trigger.cancelPreview();return;}
  const row=SUPPLEMENT.stackups.find(item=>item.id===trigger.dataset.stackupPreview),source=SUPPLEMENT.stackupSources.find(item=>item.name===row?.source);
  if(!row||!source)return;
  let cancelled=false,loadingTask=null,pdf=null,renderTask=null;
  const stop=()=>{cancelled=true;renderTask?.cancel();loadingTask?.destroy()?.catch(()=>{});holder.hidden=true;holder.replaceChildren();delete holder.dataset.previewState;trigger.setAttribute('aria-expanded','false');trigger.textContent='Preview source page';trigger.cancelPreview=null;previews.delete(stop);};
  trigger.cancelPreview=stop;previews.add(stop);trigger.setAttribute('aria-expanded','true');trigger.textContent='Hide source page';holder.hidden=false;holder.dataset.previewState='loading';holder.textContent='Loading original source page…';
  try{
    const pdfjs=await import('../pdf.mjs');if(cancelled)return;
    // Isolate the PDF.js cancellation backport from the shared live/dev worker.
    pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs?v=pre-alpha09',import.meta.url).href;
    loadingTask=pdfjs.getDocument({url:new URL(source.path,import.meta.url).href,isEvalSupported:false});pdf=await loadingTask.promise;if(cancelled)return;
    const page=await pdf.getPage(row.sourcePage);if(cancelled)return;
    const unit=page.getViewport({scale:1}),width=Math.max(240,holder.clientWidth||600),scale=Math.min(2,width/unit.width),viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.setAttribute('role','img');canvas.setAttribute('aria-label',row.source+', page '+row.sourcePage+'. Use Open source PDF for full document access.');holder.replaceChildren(canvas);
    renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport});await renderTask.promise;if(!cancelled)holder.dataset.previewState='ready';
  }catch(error){if(!cancelled){holder.dataset.previewState='error';holder.textContent='Preview unavailable. Use Open source PDF to inspect the original page. Source PDFs require a connection.';}}
}

export function currentPipeReferenceValues(category,operation) {
  if(!operation?.state)return {issue:'Open a job first, or enter reference measurements manually.'};
  const state=operation.state,g=geometry(state);
  if(!Number.isFinite(g.wall))return {issue:'Current pipe dimensions are incomplete or invalid. Nothing was copied.'};
  if(category==='pivothead'){
    const material=state.bcoPipeMaterial,size=number(state.bcoPipeOD).toFixed(1),od=TRUE_OD[material]?.[size];
    if(!Number.isFinite(od)||od!==g.od)return {issue:'Current material/size or custom outside diameter is not represented by the Pivot source catalog. Nothing was copied; verify equipment and enter reference values explicitly.'};
    return {values:{material,pipeSize:size,wall:String(g.wall),measuredId:String(g.id)}};
  }
  if(category==='foldinghelper')return {values:{pod:String(g.od),wall:String(g.wall)}};
  if(category==='uwire')return {values:{pipeOd:String(g.od),wall:String(g.wall),...(g.cutter>0?{cutterOd:String(g.cutter)}:{})}};
  return {issue:'No current-pipe transfer is defined for this reference.'};
}

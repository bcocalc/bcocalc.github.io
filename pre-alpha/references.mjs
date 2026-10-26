import {DATA} from './reference-data.mjs?v=pre-alpha06';
import {number} from './model.mjs?v=pre-alpha06';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const REFERENCE_CATEGORIES={glossary:'Glossary',cutters:'Hot Tap / Line Stop cutters',smartstop:'SmartStop',foldinghead:'Folding Head',fieldmanual:'Field manual',bolting:'Bolting',htp:'HTP chart',plant150:'150# Plant',plant600:'600# Plant',torque:'Graphonic 600# torque',fractions:'Decimal / fraction',formulas:'Calculation guide'};
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
  if(category==='glossary')result.tables=[table('Terms from the existing TapCalc glossary',['Term','Meaning'],DATA.glossary)];
  if(category==='cutters'){
    const key=filters.kind||'hotTap',chart=DATA.cutters[key];
    result.note=note+' '+(key.startsWith('floStop')?'FloStop II / IP-412 ONLY: not the standard cutter chart. Furmanite/IPSCO catalog pages 33-34.':'Standard TEAM chart; 22/26/28 entries are separate Furmanite/IPSCO IP-914 catalog supplements, page 25. Confirm cutter/fitting compatibility.');
    result.tables=[table(chart.label,['Nominal pipe size (in)','Cutter O.D. (in)'],chart.rows.filter(row=>!filters.pipe||row[0]===filters.pipe))];
  }
  if(category==='smartstop'){
    const chart=DATA.smartstop.suffixCharts.find(item=>item.size===(filters.size||'4'));
    const wall=positiveDecimal(filters.wall),id=positiveDecimal(filters.id);
    result.note=note+' '+chart.note+' Inclusive source ranges and overlaps are preserved; multiple matches are not resolved automatically. Printed page '+chart.printedPage+'.';
    if(Number.isNaN(wall)||Number.isNaN(id))result.issue='Enter positive decimal wall / I.D. values, or leave filters blank. Fractions and partial numbers are not accepted for this equipment lookup.';
    const rows=result.issue?[]:chart.rows.filter(row=>(wall===null||wall>=row.wallMin&&wall<=row.wallMax)&&(id===null||id>=row.pipeIdMin&&id<=row.pipeIdMax));
    result.tables=[table(chart.label+' - '+rows.length+' matching rows',['Suffix','Pressure','Wall (in)','Pipe I.D. (in)','Foot pad shims','Nose pad shims','Nose ring','Seal','Retaining ring','Foot pad','Nose pad','Source note'],rows.map(row=>[row.sourceLabel,row.pressure,row.wallLabel,row.pipeIdLabel,row.footPadShims,row.nosePadShims,row.noseRing,row.seal,row.retainingRing,row.footPad,row.primaryNosePad||row.secondaryNosePad?'Primary '+row.primaryNosePad+' / Secondary '+row.secondaryNosePad:row.nosePad,row.sourceNote])),objects('Source torque table (blank cells remain unlisted)',DATA.smartstop.torqueRows,[['screwSize','Screw size'],['ftLb','ft-lb'],['inLb','in-lb']])];
  }
  if(category==='foldinghead'){
    result.note=note+' Existing Folding Head packet; capacity entries are not a job-specific approval.';
    if((filters.topic||'capacity')==='capacity')result.tables=[objects('Capacity',DATA.folding.capacityRows,[['line','Line size (in)'],['tap','Tap size (in)'],['psi','Pressure (psi)'],['bar','Pressure (bar)']])];
    else if(filters.topic==='procedures')result.tables=[table('Source procedure identifiers',['Identifier','Application'],DATA.folding.procedureRows)];
    else result.lists=[{title:'Setup checks',items:DATA.folding.setupChecks},{title:'Execution checks',items:DATA.folding.executionChecks},{title:'Concrete cylinder pipe reminders',items:DATA.folding.pccpChecks}];
  }
  if(category==='fieldmanual'){
    const d=DATA.manual,topic=filters.topic||'thread';
    if(topic==='thread')result.tables=[objects('Thread make-up - measure actual make-up in the field',d.threadMakeupRows,[['size','Nominal pipe size'],['makeup','Make-up']])];
    if(topic==='rpm')result.tables=[objects('Source cutter RPM table (separate from the estimator range chart)',d.cutterRpmRows,[['machine','Machine'],['cutter','Cutter size'],['rpm','RPM']])];
    if(topic==='histop')result.tables=[objects('Adapter minimum bore',d.hiStopAdapterRows,[['size','Size'],['bore','Minimum I.D. bore']]),objects('600# bolt circles',d.hiStopBoltCircleRows,[['size','Size'],['circle','Bolt circle']]),objects('Torque passes',d.hiStopTorqueRows,[['flange','Flange'],['pattern','Pattern'],['passes','Passes']]),objects('Machine pressure / temperature',d.hiStopPressureRows,[['machine','Machine'],['cold','Low temperature'],['hot','High temperature']]),objects('Flange pressure / temperature',d.flangePressureRows,[['flange','Flange'],['cold','Low temperature'],['hot','High temperature']])];
    if(topic==='machines')result.tables=[objects('Machine operating specifications',d.machineSpecRows,Object.entries({name:'Machine',pressure:'Pressure',temperature:'Temperature',travel:'Travel',feed:'Feed',range:'Range',flange:'Flange',bolts:'Bolts',weight:'Weight',drive:'Drive',bar:'Boring bar'}))];
    if(topic==='checks'){result.lists=d.checklistGroups;result.tables=[objects('Boring bar tolerance',d.toleranceRows,[['od','Boring bar O.D.'],['length','Length'],['runout','Run-out'],['lash','Feed nut lash'],['travel','Feed screw travel']])];}
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
  if(category==='torque')result.tables=[objects('Graphonic 600# - supplied Garlock chart',DATA.garlock,[['size','Size (in)'],['bolts','Bolts'],['boltSize','Bolt size (in)'],['minTorque','Minimum per bolt (ft-lb)'],['preferredTorque','Preferred per bolt (ft-lb)']])];
  if(category==='fractions'){
    const gcd=(a,b)=>b?gcd(b,a%b):a;
    result.tables=[table('Sixteenths and sixty-fourths',['Fraction (in)','Decimal (in)'],Array.from({length:65},(_,n)=>{const d=gcd(n,64);return [n===0?'0':n===64?'1':n/d+'/'+64/d,(n/64).toFixed(6)];}))];
    if(String(filters.decimal??'').trim()){
      const value=number(filters.decimal);
      if(!Number.isFinite(value))result.issue='Enter a valid signed decimal or fraction.';
      else {const rounded=Math.round(Math.abs(value)*64),whole=Math.floor(rounded/64),part=rounded%64,d=gcd(part,64);result.note='Nearest 1/64 in: '+(value<0?'-':'')+(whole?whole+' ':'')+(part?part/d+'/'+64/d:whole?'':'0')+'. Rounding is not an exact conversion for every decimal. '+note;}
    }
  }
  if(category==='formulas')result.lists=[
    {title:'Hot Tap',items:['LI = MD +/- LD. POP = Rod start + LI. COP = POP + PTC. Rod BCO = COP + BCO. Total travel = LI + PTC + BCO.']},
    {title:'Line Stop',items:['LI = Line Stop MD +/- Line Stop LD + Pipe & cutter O.D. - wall thickness. Only MD can carry from Hot Tap; other measurements remain independent.']},
    {title:'Completion Plug',items:['LI = Start + JBF + LD + PT. An active manual override replaces this calculated lower-in output, not the saved inputs.']},
    {title:'Cutting time',items:['ETA to BCO = current BCO / (RPM x 0.004 in/revolution). Setup, approach, and Line Stop / Completion Plug work are excluded.']}
  ];
  return result;
}

export function createReferences(root) {
  let category='glossary',query='';const values={};
  const select=(key,label,options)=>'<label class="field">'+escape(label)+'<select data-ref-filter="'+key+'">'+options.map(([value,text])=>'<option value="'+escape(value)+'"'+(String(values[key]??options[0][0])===value?' selected':'')+'>'+escape(text)+'</option>').join('')+'</select></label>';
  const input=(key,label)=>'<label class="field">'+escape(label)+'<input data-ref-filter="'+key+'" inputmode="decimal" value="'+escape(values[key]||'')+'"></label>';
  root.innerHTML='<div class="reference-controls"><label class="field">Reference category<select id="reference-category">'+Object.entries(REFERENCE_CATEGORIES).map(([value,title])=>'<option value="'+value+'">'+escape(title)+'</option>').join('')+'</select></label><label class="field">Search this reference<input id="reference-query" type="search" placeholder="Filter visible rows"></label></div><div id="reference-filters" class="reference-controls"></div><div id="reference-content"></div>';
  const filters=root.querySelector('#reference-filters'),content=root.querySelector('#reference-content');
  function controls(){
    if(category==='cutters')filters.innerHTML=select('kind','Equipment / operation',Object.entries(DATA.cutters).map(([key,chart])=>[key,chart.label]))+select('pipe','Nominal pipe size',[['','All listed sizes'],...[...new Set(Object.values(DATA.cutters).flatMap(chart=>chart.rows.map(row=>row[0])))].sort((a,b)=>Number(a)-Number(b)).map(size=>[size,size+' in']),['unlisted','Other / unlisted']]);
    else if(category==='smartstop')filters.innerHTML=select('size','SmartStop size',DATA.smartstop.suffixCharts.map(chart=>[chart.size,chart.label]))+input('wall','Wall filter (positive decimal inches)')+input('id','Pipe I.D. filter (positive decimal inches)');
    else if(category==='foldinghead')filters.innerHTML=select('topic','Folding Head topic',[['capacity','Capacity'],['procedures','Procedure identifiers'],['checks','Source checklists']]);
    else if(category==='fieldmanual')filters.innerHTML=select('topic','Field manual topic',[['thread','Thread make-up'],['rpm','Cutter RPM'],['histop','Hi-Stop setup'],['machines','Machine specifications'],['checks','Post-job checks / tolerances']]);
    else if(category==='bolting')filters.innerHTML=select('rating','Flange class',Object.keys(DATA.bolting).map(key=>[key,key]));
    else if(category==='fractions')filters.innerHTML=input('decimal','Quick decimal / fraction conversion');
    else filters.innerHTML='';
  }
  function render(){
    const data=referenceTables(category,values),needle=query.trim().toLowerCase();content.dataset.helpContext=category;
    content.innerHTML='<p class="result-hint">'+escape(data.note)+'</p>'+(data.issue?'<p class="warning" role="status">'+escape(data.issue)+'</p>':'')+
      data.tables.map(item=>{const rows=item.rows.filter(row=>row.join(' ').toLowerCase().includes(needle));return '<section class="reference-section"><h3>'+escape(item.title)+'</h3><p class="reference-count">'+rows.length+' rows</p><div class="reference-table-wrap" tabindex="0" role="region" aria-label="'+escape(item.title)+' table; scroll horizontally if needed"><table><thead><tr>'+item.columns.map(label=>'<th scope="col">'+escape(label)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+escape(value===''?'Not listed':value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+(rows.length?'':'<p class="result-hint">No listed match. Do not substitute the nearest equipment or cutter size.</p>')+'</section>';}).join('')+
      data.lists.map(list=>({title:list.title,items:list.items.filter(item=>(list.title+' '+item).toLowerCase().includes(needle))})).filter(list=>list.items.length).map(list=>'<section class="reference-section"><h3>'+escape(list.title)+'</h3><ul>'+list.items.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul></section>').join('');
  }
  root.addEventListener('change',event=>{
    if(event.target.id==='reference-category'){category=event.target.value;query='';root.querySelector('#reference-query').value='';for(const key of Object.keys(values))delete values[key];controls();render();}
    else if(event.target.dataset.refFilter){values[event.target.dataset.refFilter]=event.target.value;render();}
  });
  root.addEventListener('input',event=>{if(event.target.id==='reference-query'){query=event.target.value;render();}else if(event.target.dataset.refFilter&&event.target.tagName==='INPUT'){values[event.target.dataset.refFilter]=event.target.value;render();}});
  controls();render();return {render};
}

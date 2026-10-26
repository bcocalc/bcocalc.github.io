import {operationWarnings,reviewSections,STAGE_TITLES} from './review.mjs?v=pre-alpha05';
import {BUILD,STORAGE_KEY,THEME_KEY,OPERATION_CHOICES,MACHINE_OPTIONS,lineStopMdIsManual,setOperationMeasurement,initializeLineStopMd,hotTapWarnings,stageFor,rememberStage,chooseOperationType,deleteOperation,pipeSizes,pipeSchedules,choosePipeSelection,normalizeJob,getDeviceJobs,newJob,operationType,stepsFor,resultsFor,geometry,pipeOD,number} from './model.mjs?v=pre-alpha05';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const format = value => Number.isFinite(value) ? value.toFixed(4) : '--';
const stages = {
  setup:['Job & operation','Make sure you are working on the right operation.'],
  pipe:['Pipe & cutter','Check the actual dimensions. BCO and coupon free update below.'],
  tap:['Hot tap','Enter the setup measurements for this hot tap.'],
  stop:['Line stop','Use the line stop measurements for this operation.'],
  plug:['Completion plug','Enter the plug measurements when you are ready.'],
  saved:['Saved measurements','This equipment-specific setup is available for review.'],
  review:['Review','Active results and checks for this operation. Open a stage to review its setup.']
};
const fields = {
  setup:[['operationType','Operation','operation'],['machineType','Machine','machine']],
  pipe:[['bcoPipeMaterial','Pipe material','material'],['bcoPipeOD','Nominal pipe size','pipe-size'],['bcoSchedule','Schedule','schedule'],['preAlphaPipeOD','Actual pipe O.D.','text','Filled from size; editable'],['bcoPipeID','Pipe I.D.','text','Editable for measured dimensions'],['bcoCutterOD','Cutter O.D.','text'],['bcoCutterID','Cutter I.D.','text','Optional, for coupon free']],
  tap:[['md','Measured distance (MD)','text'],['ld','Lost distance (LD)','text'],['ldSign','LD direction','sign'],['ptc','Pilot to cutter (PTC)','text'],['start','Rod start','text'],['mt','Machine travel','text']],
  stop:[['lsMd','Measured distance (MD)','text'],['lsLd','Lost distance (LD)','text'],['lsLdSign','LD direction','sign'],['lsPod','Pipe O.D. at line stop','text','Blank uses pipe setup'],['lsTravel','Line stop travel','text','Optional check'],['lsMachineTravel','Machine travel','text','Optional check'],['lsLiManualToggle','Lower-in mode','toggle'],['lsLiManual','Manual lower in','text']],
  plug:[['cpStart','Start','text'],['cpJbf','Jack bolt flange (JBF)','text'],['cpLd','Lost distance (LD)','text'],['cpPt','Plug thickness (PT)','text'],['cpLiManualToggle','Lower-in mode','toggle'],['cpLiManual','Manual lower in','text']],
  review:[],saved:[]
};
const details = [['jobDescription','Job name'],['jobClient','Customer'],['jobLocation','Location'],['jobNumber','Job number'],['jobDate','Date','date'],['jobTechnician','Technician'],['machineType','Machine','machine'],['jobNotes','Notes','textarea']];
let jobs=[],active=null,stage='setup',source='shared',shared=[],visibleLimit=30;
let connectionBusy=false, noticeTimer;
let pendingDeleteId=null;
function notify(message) {
  $('notice').textContent=message; $('notice').hidden=false;
  clearTimeout(noticeTimer); noticeTimer=setTimeout(() => $('notice').hidden=true,4500);
}
try {
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  jobs=Array.isArray(saved.jobs)?saved.jobs:[];
  active=jobs.find(job=>job.id===saved.activeId)||null;
} catch {}
function operation() {return active?.operations.find(op=>op.id===active.selectedOperationId)||active?.operations[0];}
function persist() {
  if(!active)return;
  active.updatedAt=new Date().toISOString();
  const index=jobs.findIndex(job=>job.id===active.id);
  if(index<0)jobs.unshift(active);else jobs[index]=active;
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify({build:BUILD,activeId:active.id,jobs}));$('save-state').textContent='Saved on this device';}
  catch {$('save-state').textContent='Could not save on this device';notify('Device storage is full or unavailable. Keep this page open to retain your changes.');}
}
function page(name) {
  const changed=$(name).hidden;
  $('workspace').hidden=name!=='workspace';$('library').hidden=name!=='library';
  document.querySelectorAll('[data-page]').forEach(button=>{
    if(button.dataset.page===name)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  if(name==='library')renderLibrary();
  if(changed)window.scrollTo({top:0,behavior:'instant'});
}
function fieldMarkup([key,label,type='text',hint=''],value,attribute='data-field') {
  const attrs=attribute+'="'+escape(key)+'" id="'+escape(attribute+key)+'"';
  let control;
  if(type==='pipe-size'||type==='schedule'){
    const state=operation().state;
    const options=type==='pipe-size'
      ? [['','Choose a size'],...pipeSizes(state).map(([size,od])=>[size,Number(size)+' in ('+od+' O.D.)']),['custom','Other size']]
      : [['','Choose'],...pipeSchedules(state).map(schedule=>[schedule,schedule]),['custom','Measured']];
    const raw=String(value??'');
    const canonical=type==='pipe-size'&&Number.isFinite(number(raw))?number(raw).toFixed(1):raw;
    if(canonical&&!options.some(([v])=>v===canonical))options.push([canonical,raw+' (saved)']);
    control='<select '+attrs+'>'+options.map(([v,t])=>'<option value="'+escape(v)+'"'+(v===canonical?' selected':'')+'>'+escape(t)+'</option>').join('')+'</select>';
  }else if(['material','sign','toggle','operation','machine'].includes(type)){
    const options=type==='machine'?[['','Choose a machine'],...MACHINE_OPTIONS.map(name=>[name,name])]:type==='operation'?OPERATION_CHOICES.map((name,index)=>[name,(index+1)+'. '+name]):type==='material'?[['','Choose material'],['CarbonSteel','Carbon steel'],['DuctileIron','Ductile iron'],['Other','Other / measured O.D.']]:type==='toggle'?[['false','Calculated'],['true','Manual override']]:[['+','Add (+)'],['-','Subtract (-)']];
    const current=String(value??'')||(type==='sign'?'+':type==='toggle'?'false':type==='operation'?'Hot Tap':'');
    if(!options.some(([v])=>v===current))options.push([current,current+(type==='operation'||type==='machine'?' (saved)':'')]);
    control='<select '+attrs+'>'+options.map(([v,t])=>'<option value="'+escape(v)+'"'+(v===current?' selected':'')+'>'+escape(t)+'</option>').join('')+'</select>';
  }else if(type==='textarea')control='<textarea '+attrs+'>'+escape(value)+'</textarea>';
  else control='<input '+attrs+' type="'+(type==='date'?'date':'text')+'"'+(type==='text'&&!['operationLabel','machineType'].includes(key)?' inputmode="decimal"':'')+' value="'+escape(value)+'" autocomplete="off">';
  if(key==='lsMd') hint=lineStopMdIsManual(operation().state)?'Manual MD; Hot Tap MD changes are kept separate.':'Follows Hot Tap MD until you edit it.';
  return '<label class="field'+(type==='textarea'?' wide':'')+(['operation','machine'].includes(type)?' setup-choice':'')+'">'+escape(label)+control+(hint?'<small'+(key==='lsMd'?' id="ls-md-hint"':'')+'>'+escape(hint)+'</small>':'')+(key==='ptc'?'<small id="ptc-warning" class="field-warning" hidden></small>':'')+'</label>';
}
function renderOperations() {
  $('operation-count').textContent=active.operations.length;
  $('operations').innerHTML=active.operations.map((op,index)=>'<button data-operation="'+escape(op.id)+'"'+(op.id===operation().id?' aria-current="true"':'')+'><strong>'+escape(op.label)+'</strong><small>'+String(index+1).padStart(2,'0')+' / '+escape(operationType(op))+(op.state.bcoPipeOD?' / '+escape(op.state.bcoPipeOD)+' in':'')+'</small></button>').join('');
  const strip=$('operations'),selected=strip.querySelector('[aria-current]');
  if(selected){
    const bounds=strip.getBoundingClientRect(),item=selected.getBoundingClientRect();
    if(item.left<bounds.left)strip.scrollLeft+=item.left-bounds.left;
    else if(item.right>bounds.right)strip.scrollLeft+=item.right-bounds.right;
  }
}
function renderWorkspace() {
  $('welcome').hidden=!!active;$('job-workspace').hidden=!active;
  if(!active)return;
  $('job-title').textContent=active.title;
  $('job-origin').textContent=active.source==='shared'?'SHARED JOB / PRE-ALPHA WORKING COPY':active.source==='device'?'DEVICE JOB / PRE-ALPHA WORKING COPY':'PRE-ALPHA JOB';
  $('job-meta').textContent=[active.sharedState.jobClient,active.sharedState.jobLocation,active.sharedState.jobNumber,active.sharedState.jobDate].filter(Boolean).join(' / ')||'Add the customer and location in Job details.';
  renderOperations();
  const op=operation();
  $('delete-operation').disabled=!op;
  $('empty-operations').hidden=!!op;
  $('measurement-workspace').hidden=!op;
  if(!op)return;
  const steps=stepsFor(op);
  stage=stageFor(op);
  if(op.workspaceStage!==stage){rememberStage(op,stage);persist();}
  if(stage==='stop'&&initializeLineStopMd(op))persist();
  $('steps').innerHTML=steps.map((key,i)=>'<button data-step="'+key+'"'+(key===stage?' aria-current="step"':'')+'><span class="step-number">'+(i+1)+'</span>'+escape(stages[key][0])+'</button>').join('');
  $('step-title').textContent=stages[stage][0];
  $('step-description').textContent=stages[stage][1];
  $('step-count').textContent='STEP '+(steps.indexOf(stage)+1)+' OF '+steps.length+' / '+op.label;
  $('fields').innerHTML=fields[stage].map(field=>{
    const key=field[0];
    if((key==='lsLiManual'||key==='cpLiManual') && ![true,'true'].includes(op.state[key+'Toggle']))return '';
    const value=key==='operationType'?operationType(op):key==='machineType'?active.sharedState.machineType:key==='preAlphaPipeOD'?format(pipeOD(op.state)).replace('--',''):key==='bcoSchedule'?(op.state.bcoSchedule || (String(op.state.bcoPipeID??'').trim()?'custom':'')):op.state[key];
    return fieldMarkup(field,value);
  }).join('');
  $('back').disabled=steps.indexOf(stage)===0;
  $('next').textContent=stage==='review'?'Open job library':'Next: '+stages[steps[steps.indexOf(stage)+1]][0]+' \u2192';
  renderResults();
}
function reviewMarkup(state,onlyOther=false) {
  const labels=Object.fromEntries(Object.values(fields).flat().map(([key,label])=>[key,label]));
  const internal=new Set(['lineStopMdUserEdited','htFieldBasis','activeMode','operationType','workflowType']);
  const rows=Object.entries(state).filter(([key,value])=>!internal.has(key)&&value!==''&&value!=null&&typeof value!=='object'&&(!onlyOther||!(key in labels)));
  return '<dl class="review-list">'+rows.map(([key,value])=>'<div><dt>'+escape(labels[key]||key)+'</dt><dd>'+escape(value)+'</dd></div>').join('')+'</dl>';
}
function goToStage(next) {
  if(!rememberStage(operation(),next))return;
  stage=next;persist();renderWorkspace();
}
function warningMarkup(warnings) {
  return warnings.map(warning=>'<p class="warning" data-warning-code="'+escape(warning.code)+'">'+escape(warning.message)+'</p>').join('');
}
function reviewInputMarkup(rows) {
  return '<dl class="review-list">'+rows.map(({label,value,note})=>{
    const numeric=number(value);
    const display=Number.isFinite(numeric)?format(numeric)+' in':Number.isNaN(value)||value==null||value===''?'Not entered':String(value)+' (invalid)';
    return '<div><dt>'+escape(label)+(note?'<small>'+escape(note)+'</small>':'')+'</dt><dd>'+escape(display)+'</dd></div>';
  }).join('')+'</dl>';
}
function operationReviewMarkup(op) {
  const checks=operationWarnings(op),attention=checks.filter(check=>check.kind!=='info'),notes=checks.filter(check=>check.kind==='info');
  const checklist='<section id="review-checks" aria-labelledby="review-checks-title"><h3 id="review-checks-title">'+(attention.length?attention.length+' check'+(attention.length===1?'':'s')+' to review':'Automatic checks')+'</h3>'+
    (attention.length?'<ul class="review-warnings">'+attention.map(check=>'<li class="warning" data-warning-code="'+escape(check.code)+'"><strong>'+escape(STAGE_TITLES[check.stage]||check.stage)+'</strong><span>'+escape(check.message)+'</span><button class="quiet" data-review-edit="'+escape(check.stage)+'">Review stage</button></li>').join('')+'</ul>':'<p class="result-hint">No automatic warnings found. This is not a field verification.</p>')+
    (notes.length?'<ul class="review-notes">'+notes.map(note=>'<li><strong>'+escape(STAGE_TITLES[note.stage])+':</strong> '+escape(note.message)+'</li>').join('')+'</ul>':'')+'</section>';
  const sections=reviewSections(op).map(section=>{
    const results='<dl class="review-results">'+section.results.map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd>'+format(value)+(Number.isFinite(value)?' <small>in</small>':' <small>'+(label==='Travel margin'?'Not checked':'Not calculated')+'</small>')+'</dd></div>').join('')+'</dl>';
    return '<section class="review-stage" data-review-stage="'+section.stage+'"><header><div><h3>'+escape(section.title)+'</h3><p class="review-mode">'+escape(section.mode)+'</p></div><button data-review-edit="'+section.stage+'" aria-label="Edit '+escape(section.title)+' measurements">Edit</button></header>'+results+
      '<details class="review-inputs"><summary>'+(section.override?'Retained setup measurements (not used for lower in)':'Setup measurements')+'</summary>'+reviewInputMarkup(section.inputs)+'</details>'+
      (section.retained.length?'<details class="review-inactive"><summary>Inactive saved override (not used)</summary>'+reviewInputMarkup(section.retained)+'</details>':'')+'</section>';
  }).join('');
  return '<p class="review-scope">Current operation: <strong>'+escape(op.label)+'</strong>. Other operations keep their own measurements.</p>'+checklist+sections;
}
function renderResults() {
  const op=operation(); if(!op)return;
  const results=resultsFor(op,stage);
  if(results.length) {
    const [main,...rest]=results;
    $('results').innerHTML='<div class="result-panel"><p class="eyebrow">'+escape(main[0])+'</p><strong class="big-value">'+format(main[1])+' <small>in</small></strong><div class="result-subgrid">'+rest.map(([label,value])=>'<div><span>'+escape(label)+'</span><strong>'+format(value)+' <small>in</small></strong></div>').join('')+'</div></div>';
    const optional=stage==='pipe'?['Coupon free']:stage==='stop'?['Travel margin']:[];
    const missing=results.some(([label,value])=>!optional.includes(label)&&!Number.isFinite(value));
    if(missing)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">Enter the measurements for a result. Empty fields are left blank rather than assumed to be zero.</p>');
    if(stage==='pipe')$('results').insertAdjacentHTML('beforeend','<p class="result-hint">BCO uses cutter O.D.; coupon free uses cutter I.D. Both show cutter-shell distance, excluding pilot projection.</p>');
    if(stage==='pipe'&&op.state.bcoPipeOD&&!String(op.state.bcoPipeID??'').trim())$('results').insertAdjacentHTML('beforeend','<p class="result-hint">Choose chart dimensions or enter a measured Pipe I.D. Unlisted dimensions are left blank.</p>');

    if(stage==='tap'&&op.state.htActualPop)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">These are setup-based results. The saved actual POP reading and its adjustment settings are retained under Other saved inputs.</p>');

    if(stage==='stop'&&!op.workflowType&&op.state.lineStopVariant&&op.state.lineStopVariant!=='standard')$('results').innerHTML='<p class="result-hint">This operation uses '+escape(op.state.lineStopVariant)+'. Review its saved inputs below; equipment-specific calculations are still being connected in Pre-Alpha.</p>'+reviewMarkup(op.state);
  } else if(stage==='setup') {
    const path=operationType(op)==='Line Stop'?'Hot tap, line stop, then completion plug.':operationType(op)==='Tap & Complete'?'Hot tap, then completion plug.':operationType(op)==='Hot Tap'?'Hot tap only.':'Saved '+operationType(op)+' operation.';
    $('results').innerHTML='<p class="result-hint">'+escape(path)+' '+active.operations.length+' operation'+(active.operations.length===1?'':'s')+' in this job.</p>';
  } else {
    $('results').innerHTML=stage==='review'?operationReviewMarkup(op):reviewMarkup(op.state);
    if(stage==='saved')$('results').insertAdjacentHTML('afterbegin','<p class="result-hint">All saved values are preserved. '+escape(operationType(op))+' calculations are still being connected in this design study.</p>');
  }
  const warnings=hotTapWarnings(op);
  if(stage!=='review')$('results').insertAdjacentHTML('beforeend',warningMarkup(operationWarnings(op).filter(warning=>warning.stage===stage&&!['info','missing'].includes(warning.kind))));
  const ptcWarning=$('ptc-warning'),ptcInput=$('data-fieldptc');
  if(ptcWarning&&ptcInput){
    const warning=warnings.find(item=>item.field==='ptc');
    ptcWarning.hidden=!warning;ptcWarning.textContent=warning?'PTC exceeds '+warning.limit.toFixed(4)+' in limit.':'';
    if(warning){ptcInput.setAttribute('aria-invalid','true');ptcInput.setAttribute('aria-describedby','ptc-warning');}
    else{ptcInput.removeAttribute('aria-invalid');ptcInput.removeAttribute('aria-describedby');}
  }
  if($('ls-md-hint'))$('ls-md-hint').textContent=lineStopMdIsManual(op.state)?'Manual MD; Hot Tap MD changes are kept separate.':'Follows Hot Tap MD until you edit it.';
  $('preserved').innerHTML=stage==='review'||stage==='saved'?'':'<details><summary>Other saved inputs</summary>'+reviewMarkup(op.state,true)+'</details>';
}
function openJob(job) {
  const existing=jobs.find(item=>item.sourceId===job.sourceId&&item.source===job.source);
  active=existing||structuredClone(job);stage=stageFor(operation());
  if(!existing&&jobs.some(item=>item.id===active.id))active.id=crypto.randomUUID();
  persist();renderWorkspace();page('workspace');
}
function renderLibrary() {
  const device=getDeviceJobs(localStorage);
  $('shared-count').textContent=shared.length;$('device-count').textContent=device.length;$('experimental-count').textContent=jobs.length;
  document.querySelectorAll('[data-source]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.source===source)));
  const query=$('search').value.trim().toLowerCase();
  const entries=(source==='shared'?shared:source==='device'?device:jobs).filter(job=>
    [job.title,job.sharedState.jobClient,job.sharedState.jobLocation,job.sharedState.jobNumber,...job.operations.map(op=>op.label)].join(' ').toLowerCase().includes(query)
  ).sort((a,b)=>String(b.updatedAt||b.savedAt).localeCompare(String(a.updatedAt||a.savedAt)));
  $('library-summary').textContent=entries.length+' job'+(entries.length===1?'':'s')+' found';
  $('job-list').innerHTML=entries.slice(0,visibleLimit).map(job=>'<button class="job-card" data-job="'+escape(job.id)+'"><p class="eyebrow">'+escape(source==='shared'?'SHARED LIBRARY':source==='device'?'SAVED ON THIS DEVICE':'PRE-ALPHA WORKING COPY')+'</p><h2>'+escape(job.title)+'</h2><p>'+escape([job.sharedState.jobClient,job.sharedState.jobLocation].filter(Boolean).join(' / ')||'Customer and location not recorded')+'</p><p>'+escape(job.operations.map(op=>op.label).join(' / '))+'</p><footer><span>'+job.operations.length+' operation'+(job.operations.length===1?'':'s')+' / '+escape(job.sharedState.jobDate||job.savedAt.slice(0,10)||'No date')+'</span><strong aria-hidden="true">\u2192</strong></footer></button>').join('')||'<p class="empty-state">'+(query?'No matching jobs. Try another search.':source==='shared'?'No shared jobs loaded. Use Refresh shared jobs to connect.':source==='device'?'There are no live/dev local saves in this browser. Shared jobs are available in the Shared jobs tab.':'Your experimental working copies will appear here.')+'</p>';
  $('more').hidden=entries.length<=visibleLimit;
  $('job-list').querySelectorAll('[data-job]').forEach(button=>button.addEventListener('click',()=>openJob(entries.find(job=>job.id===button.dataset.job))));
}
async function refreshShared() {
  if(connectionBusy)return;
  connectionBusy=true;$('refresh').disabled=true;$('connection').textContent='Connecting to shared jobs...';
  try {
    const entries=await window.tapCalcCloud.list();
    shared=entries.map(entry=>normalizeJob({...entry,source:'shared'}));
    $('connection').textContent='Connected / '+shared.length+' shared jobs';
    renderLibrary();
  } catch(error) {
    $('connection').textContent='Connection failed. Tap Refresh to retry.';
    notify(error.message||'Shared jobs could not be loaded.');
  } finally {connectionBusy=false;$('refresh').disabled=false;}
}
function editDetails() {
  if(!active){active=newJob();persist();renderWorkspace();}
  $('details-fields').innerHTML=details.map(([key,label,type])=>fieldMarkup([key,label,type||'text'],active.sharedState[key],'data-detail')).join('');
  // Job metadata are text, not measurement keyboards.
  $('details-fields').querySelectorAll('[inputmode]').forEach(input=>input.removeAttribute('inputmode'));
  $('details-dialog').showModal();
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.page)page(button.dataset.page);
  if(button.dataset.source){source=button.dataset.source;visibleLimit=30;renderLibrary();}
  if(button.dataset.action==='library')page('library');
  if(button.dataset.action==='new'){active=newJob();stage='setup';persist();renderWorkspace();page('workspace');editDetails();}
  if(button.dataset.action==='details')editDetails();
  if(button.dataset.action==='add')$('add-dialog').showModal();
  if(button.dataset.action==='delete'&&operation()){
    pendingDeleteId=operation().id;
    $('delete-operation-description').textContent='Delete "'+operation().label+'" and its measurements from this Pre-Alpha working copy?';
    $('delete-operation-dialog').showModal();
  }
  if(button.dataset.close)$(button.dataset.close).close();
  if(button.dataset.operation){active.selectedOperationId=button.dataset.operation;persist();renderWorkspace();}
  if(button.dataset.step||button.dataset.reviewEdit)goToStage(button.dataset.step||button.dataset.reviewEdit);
  if(button.dataset.addType) {
    const type=button.dataset.addType,id=crypto.randomUUID();
    active.operations.push({id,label:type+' '+(active.operations.filter(op=>operationType(op)===type).length+1),operationType:type,state:{bcoPipeMaterial:'CarbonSteel'}});
    chooseOperationType(active,active.operations.at(-1),type);
    active.selectedOperationId=id;stage='setup';$('add-dialog').close();persist();renderWorkspace();
  }
});
$('fields').addEventListener('input',event=>{
  const key=event.target.dataset.field;if(!key)return;
  if(['operationType','bcoPipeMaterial','bcoPipeOD','bcoSchedule'].includes(key))return;
  else if(key==='machineType')active.sharedState.machineType=event.target.value;
  else setOperationMeasurement(operation(),key,key.endsWith('Toggle') ? event.target.value==='true' : event.target.value);
  persist();renderResults();
});
$('fields').addEventListener('change',event=>{
  const key=event.target.dataset.field;
  if(key==='operationType'){chooseOperationType(active,operation(),event.target.value);persist();renderWorkspace();return;}
  if(['bcoPipeMaterial','bcoPipeOD','bcoSchedule'].includes(key)){choosePipeSelection(operation().state,key,event.target.value);persist();renderWorkspace();}
  if(key==='lsLiManualToggle'||key==='cpLiManualToggle'){persist();renderWorkspace();}
});
$('details-form').addEventListener('submit',event=>{
  event.preventDefault();
  $('details-fields').querySelectorAll('[data-detail]').forEach(input=>active.sharedState[input.dataset.detail]=input.value);
  active.title=active.sharedState.jobDescription||active.sharedState.jobNumber||'Untitled job';
  persist();$('details-dialog').close();renderWorkspace();
});
$('delete-operation-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!active||!pendingDeleteId)return;
  const removed=deleteOperation(active,pendingDeleteId);
  $('delete-operation-dialog').close();
  if(!removed)return;
  stage='setup';persist();renderWorkspace();
  const target=operation()?$('operations').querySelector('[aria-current]'):document.querySelector('.operations-actions [data-action="add"]');
  target?.focus({preventScroll:true});
  notify('Operation deleted from this working copy.');
});
$('delete-operation-dialog').addEventListener('close',()=>pendingDeleteId=null);
$('back').addEventListener('click',()=>{const steps=stepsFor(operation());goToStage(steps[Math.max(0,steps.indexOf(stage)-1)]);});
$('next').addEventListener('click',()=>{const steps=stepsFor(operation());const index=steps.indexOf(stage);if(index===steps.length-1)page('library');else goToStage(steps[index+1]);});
$('search').addEventListener('input',()=>{visibleLimit=30;renderLibrary();});
$('more').addEventListener('click',()=>{visibleLimit+=30;renderLibrary();});
$('refresh').addEventListener('click',refreshShared);
function theme(dark){document.body.classList.toggle('dark',dark);$('theme').textContent=dark?'Light mode':'Dark mode';}
try {theme(localStorage.getItem(THEME_KEY)==='dark');}catch{}
$('theme').addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');theme(dark);try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}});
if(!active&&jobs.length)$('resume').innerHTML='<button data-resume>Resume '+escape(jobs[0].title)+' \u2192</button>';
$('resume').addEventListener('click',()=>{if(jobs[0])openJob(jobs[0]);});
renderWorkspace();
refreshShared();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js?v='+BUILD,{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
}

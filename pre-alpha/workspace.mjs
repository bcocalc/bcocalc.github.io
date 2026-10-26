import {BUILD,STORAGE_KEY,THEME_KEY,normalizeJob,getDeviceJobs,newJob,operationType,stepsFor,resultsFor,geometry,pipeOD,number} from './model.mjs?v=pre-alpha01';
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
  review:['Review','All the measurements for this operation, together.']
};
const fields = {
  setup:[['operationLabel','Operation name','text'],['machineType','Machine','text']],
  pipe:[['bcoPipeMaterial','Pipe material','material'],['bcoPipeOD','Nominal pipe size','text'],['preAlphaPipeOD','Actual pipe O.D.','text'],['bcoPipeID','Pipe I.D.','text'],['bcoCutterOD','Cutter O.D.','text'],['bcoCutterID','Cutter I.D.','text','Optional, for coupon free']],
  tap:[['md','Measured distance (MD)','text'],['ld','Lost distance (LD)','text'],['ldSign','LD direction','sign'],['ptc','Pilot to cutter (PTC)','text'],['start','Rod start','text'],['mt','Machine travel','text']],
  stop:[['lsMd','Measured distance (MD)','text'],['lsLd','Lost distance (LD)','text'],['lsLdSign','LD direction','sign'],['lsPod','Pipe O.D. at line stop','text','Blank uses pipe setup'],['lsTravel','Line stop travel','text','Optional check'],['lsMachineTravel','Machine travel','text','Optional check'],['lsLiManualToggle','Lower-in mode','toggle'],['lsLiManual','Manual lower in','text']],
  plug:[['cpStart','Start','text'],['cpJbf','Jack bolt flange (JBF)','text'],['cpLd','Lost distance (LD)','text'],['cpPt','Plug thickness (PT)','text'],['cpLiManualToggle','Lower-in mode','toggle'],['cpLiManual','Manual lower in','text']],
  review:[],saved:[]
};
const details = [['jobDescription','Job name'],['jobClient','Customer'],['jobLocation','Location'],['jobNumber','Job number'],['jobDate','Date','date'],['jobTechnician','Technician'],['machineType','Machine'],['jobNotes','Notes','textarea']];
let jobs=[],active=null,stage='setup',source='shared',shared=[],visibleLimit=30;
let connectionBusy=false, noticeTimer;
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
  if(type==='material'||type==='sign'||type==='toggle'){
    const options=type==='material'?[['CarbonSteel','Carbon steel'],['DuctileIron','Ductile iron'],['Other','Other / measured O.D.']]:type==='toggle'?[['false','Calculated'],['true','Manual override']]:[['+','Add (+)'],['-','Subtract (-)']];
    const current=String(value??'')||(type==='sign'?'+':type==='toggle'?'false':'CarbonSteel');
    if(!options.some(([v])=>v===current))options.push([current,current]);
    control='<select '+attrs+'>'+options.map(([v,t])=>'<option value="'+escape(v)+'"'+(v===current?' selected':'')+'>'+escape(t)+'</option>').join('')+'</select>';
  }else if(type==='textarea')control='<textarea '+attrs+'>'+escape(value)+'</textarea>';
  else control='<input '+attrs+' type="'+(type==='date'?'date':'text')+'"'+(type==='text'&&!['operationLabel','machineType'].includes(key)?' inputmode="decimal"':'')+' value="'+escape(value)+'" autocomplete="off">';
  return '<label class="field'+(type==='textarea'?' wide':'')+'">'+escape(label)+control+(hint?'<small>'+escape(hint)+'</small>':'')+'</label>';
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
  const op=operation(),steps=stepsFor(op);
  if(!steps.includes(stage))stage=steps[0];
  $('steps').innerHTML=steps.map((key,i)=>'<button data-step="'+key+'"'+(key===stage?' aria-current="step"':'')+'><span class="step-number">'+(i+1)+'</span>'+escape(stages[key][0])+'</button>').join('');
  $('step-title').textContent=stages[stage][0];
  $('step-description').textContent=stages[stage][1];
  $('step-count').textContent='STEP '+(steps.indexOf(stage)+1)+' OF '+steps.length+' / '+op.label;
  $('fields').innerHTML=fields[stage].map(field=>{
    const key=field[0];
    if((key==='lsLiManual'||key==='cpLiManual') && ![true,'true'].includes(op.state[key+'Toggle']))return '';
    const value=key==='operationLabel'?op.label:key==='machineType'?active.sharedState.machineType:key==='preAlphaPipeOD'?format(pipeOD(op.state)).replace('--',''):op.state[key];
    return fieldMarkup(field,value);
  }).join('');
  $('back').disabled=steps.indexOf(stage)===0;
  $('next').textContent=stage==='review'?'Open job library':'Next: '+stages[steps[steps.indexOf(stage)+1]][0]+' \u2192';
  renderResults();
}
function reviewMarkup(state,onlyOther=false) {
  const labels=Object.fromEntries(Object.values(fields).flat().map(([key,label])=>[key,label]));
  const rows=Object.entries(state).filter(([key,value])=>value!==''&&value!=null&&typeof value!=='object'&&(!onlyOther||!(key in labels)));
  return '<dl class="review-list">'+rows.map(([key,value])=>'<div><dt>'+escape(labels[key]||key)+'</dt><dd>'+escape(value)+'</dd></div>').join('')+'</dl>';
}
function renderResults() {
  const op=operation(); if(!op)return;
  const results=resultsFor(op,stage),g=geometry(op.state);
  if(results.length) {
    const [main,...rest]=results;
    $('results').innerHTML='<div class="result-panel"><p class="eyebrow">'+escape(main[0])+'</p><strong class="big-value">'+format(main[1])+' <small>in</small></strong><div class="result-subgrid">'+rest.map(([label,value])=>'<div><span>'+escape(label)+'</span><strong>'+format(value)+' <small>in</small></strong></div>').join('')+'</div></div>';
    const missing=results.some(([,value])=>!Number.isFinite(value));
    if(missing)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">Enter the measurements for a result. Empty fields are left blank rather than assumed to be zero.</p>');
    if(stage==='pipe')$('results').insertAdjacentHTML('beforeend','<p class="result-hint">BCO uses cutter O.D.; coupon free uses cutter I.D. Both show cutter-shell distance, excluding pilot projection.</p>');
    if(stage==='tap'&&number(op.state.mt)>0&&results.find(([key])=>key==='Total travel')?.[1]>number(op.state.mt))$('results').insertAdjacentHTML('beforeend','<p class="warning">Calculated travel exceeds machine travel. Recheck the setup.</p>');
    if(stage==='tap'&&op.state.htActualPop)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">These are setup-based results. The saved actual POP reading and its adjustment settings are retained under Other saved inputs.</p>');
    if((stage==='stop'&&[true,'true'].includes(op.state.lsLiManualToggle))||(stage==='plug'&&[true,'true'].includes(op.state.cpLiManualToggle)))$('results').insertAdjacentHTML('beforeend','<p class="result-hint">Manual lower-in override is active. Select Calculated in Lower-in mode to use the setup measurements.</p>');
    if(stage==='stop'&&op.state.lineStopVariant&&op.state.lineStopVariant!=='standard')$('results').innerHTML='<p class="result-hint">This operation uses '+escape(op.state.lineStopVariant)+'. Review its saved inputs below; equipment-specific calculations are still being connected in Pre-Alpha.</p>'+reviewMarkup(op.state);
  } else if(stage==='setup') {
    $('results').innerHTML='<p class="result-hint">'+escape(operationType(op))+' operation / '+active.operations.length+' operation'+(active.operations.length===1?'':'s')+' in this job. Use the operation buttons above to move between them.</p>';
  } else {
    $('results').innerHTML=reviewMarkup(op.state);
    if(stage==='saved')$('results').insertAdjacentHTML('afterbegin','<p class="result-hint">All saved values are preserved. '+escape(operationType(op))+' calculations are still being connected in this design study.</p>');
  }
  $('preserved').innerHTML=stage==='review'||stage==='saved'?'':'<details><summary>Other saved inputs</summary>'+reviewMarkup(op.state,true)+'</details>';
}
function openJob(job) {
  const existing=jobs.find(item=>item.sourceId===job.sourceId&&item.source===job.source);
  active=existing||structuredClone(job);stage='setup';
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
  if(button.dataset.close)$(button.dataset.close).close();
  if(button.dataset.operation){active.selectedOperationId=button.dataset.operation;stage='setup';persist();renderWorkspace();}
  if(button.dataset.step){stage=button.dataset.step;renderWorkspace();}
  if(button.dataset.addType) {
    const type=button.dataset.addType,id=crypto.randomUUID();
    active.operations.push({id,label:type+' '+(active.operations.filter(op=>operationType(op)===type).length+1),operationType:type,state:{bcoPipeMaterial:'CarbonSteel'}});
    active.selectedOperationId=id;stage='setup';$('add-dialog').close();persist();renderWorkspace();
  }
});
$('fields').addEventListener('input',event=>{
  const key=event.target.dataset.field;if(!key)return;
  if(key==='operationLabel'){operation().label=event.target.value;renderOperations();}
  else if(key==='machineType')active.sharedState.machineType=event.target.value;
  else operation().state[key]=key.endsWith('Toggle') ? event.target.value==='true' : event.target.value;
  persist();renderResults();
});
$('fields').addEventListener('change',event=>{
  const key=event.target.dataset.field;
  if(key==='bcoPipeMaterial'||key==='bcoPipeOD'){delete operation().state.preAlphaPipeOD;persist();renderWorkspace();}
  if(key==='lsLiManualToggle'||key==='cpLiManualToggle'){persist();renderWorkspace();}
});
$('details-form').addEventListener('submit',event=>{
  event.preventDefault();
  $('details-fields').querySelectorAll('[data-detail]').forEach(input=>active.sharedState[input.dataset.detail]=input.value);
  active.title=active.sharedState.jobDescription||active.sharedState.jobNumber||'Untitled job';
  persist();$('details-dialog').close();renderWorkspace();
});
$('back').addEventListener('click',()=>{const steps=stepsFor(operation());stage=steps[Math.max(0,steps.indexOf(stage)-1)];renderWorkspace();});
$('next').addEventListener('click',()=>{const steps=stepsFor(operation());const index=steps.indexOf(stage);if(index===steps.length-1)page('library');else{stage=steps[index+1];renderWorkspace();}});
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

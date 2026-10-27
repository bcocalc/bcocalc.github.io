import {createWorkspaceStore,WORKSPACE_KEY} from './workspace-store.mjs?v=pre-alpha14';
import {FIELD_HELP,installHelp} from './help.mjs?v=pre-alpha14';
import {initAuxiliary} from './auxiliary.mjs?v=pre-alpha14';
import {etaResultPanel,etaSummary} from './eta-view.mjs?v=pre-alpha14';
import {createOriginTracker,worksheetMarkup,matchingJobs,jobRowsMarkup} from './presentation.mjs?v=pre-alpha14';
import {operationWarnings,reviewSections,STAGE_TITLES} from './review.mjs?v=pre-alpha14';
import {BUILD,STORAGE_KEY,THEME_KEY,OPERATION_CHOICES,MACHINE_OPTIONS,lineStopMdIsManual,setOperationMeasurement,initializeLineStopMd,hotTapWarnings,migratePipeSource,stageFor,rememberStage,chooseOperationType,deleteOperation,pipeSizes,pipeSchedules,choosePipeSelection,normalizeJob,getDeviceJobs,newJob,operationType,stepsFor,resultsFor,geometry,pipeOD,number} from './model.mjs?v=pre-alpha14';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const format = value => Number.isFinite(value) ? value.toFixed(4) : '--';
const origins=createOriginTracker();
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
  tap:[['md','Measured distance (MD)','text'],['ld','Lost distance (LD)','text','Optional; blank uses 0'],['ldSign','LD direction','sign'],['ptc','Pilot to cutter (PTC)','text'],['start','Rod start','text'],['mt','Machine travel','text']],
  stop:[['lsMd','Measured distance (MD)','text'],['lsLd','Lost distance (LD)','text'],['lsLdSign','LD direction','sign'],['lsTravel','Line stop travel','text','Optional check'],['lsMachineTravel','Machine travel','text','Optional check'],['lsLiManualToggle','Lower-in mode','toggle'],['lsLiManual','Manual lower in','text']],
  plug:[['cpStart','Start','text'],['cpJbf','Jack bolt to flange (JBF)','text'],['cpLd','Lost distance (LD)','text'],['cpPt','Plug thickness (PT)','text'],['cpLiManualToggle','Lower-in mode','toggle'],['cpLiManual','Manual lower in','text']],
  review:[],saved:[]
};
const details = [['jobDescription','Job name'],['jobClient','Customer'],['jobLocation','Location'],['jobNumber','Job number'],['jobDate','Date','date'],['jobTechnician','Technician'],['machineType','Machine','machine'],['jobNotes','Notes','textarea']];
let jobs=[],active=null,stage='setup',source='shared',shared=[],visibleLimit=30;
let connectionBusy=false, noticeTimer;
let pendingDeleteId=null;
let auxiliary,currentPage='home';
const scrollPositions={};
function notify(message) {
  $('notice').textContent=message; $('notice').hidden=false;
  clearTimeout(noticeTimer); noticeTimer=setTimeout(() => {if(!workspaceStartupError)$('notice').hidden=true;},4500);
}
const workspaceStore=createWorkspaceStore({storage:{getItem:key=>localStorage.getItem(key)},locks:navigator.locks,onCommit:()=>workspaceChannel?.postMessage('committed')});
let workspaceChannel=null;
try{if(typeof BroadcastChannel!=='undefined')workspaceChannel=new BroadcastChannel('tapcalc-pre-alpha-workspace');}catch{}
let workspaceStartupError=null;
try{await workspaceStore.ready;}catch(error){workspaceStartupError=error;}
const drafts=new Map();
let savedView={jobs:[],activeId:null,versions:new Map(),conflicts:new Map()},saveQueue=Promise.resolve(),recoveryBusy=false,pendingSelections=0;
function refreshSaved(){
  try{savedView=workspaceStore.read();}
  catch(error){$('save-state').textContent=error.message;notify(error.message);return false;}
  jobs=savedView.jobs.map(job=>drafts.get(job.id)?.job||job);
  for(const draft of drafts.values())if(!jobs.some(job=>job.id===draft.job.id))jobs.unshift(draft.job);
  return true;
}
function draftFor(job){
  if(!drafts.has(job.id))drafts.set(job.id,{job:structuredClone(job),base:savedView.versions.get(job.id)??null,sequence:0,saved:0,error:null});
  return drafts.get(job.id);
}
function saveStatus(){
  const draft=active&&drafts.get(active.id);
  if(draft&&!draft.error&&draft.sequence===draft.saved&&(savedView.versions.get(active.id)??null)!==draft.base)draft.error=Object.assign(new Error('This job changed in another tab. Your draft has not been replaced.'),{code:'conflict'});
  if(draft&&!draft.error&&savedView.conflicts.has(active.id))draft.error=Object.assign(new Error('An older tab saved a different version. Both saved versions are retained.'),{code:'legacy-conflict'});
  const error=draft?.error||workspaceStartupError;
  $('save-state').textContent=error?error.message:pendingSelections||draft&&draft.sequence!==draft.saved?'Saving on this device…':'Saved on this device';
  $('save-recovery').hidden=!error;
  $('save-recovery-message').textContent=error?error.message+' Your changes remain in this tab. Saving a separate copy preserves the other saved version.':'';
  $('save-copy').disabled=recoveryBusy||!draft||draft.sequence!==draft.saved&&!error;
  $('load-saved').disabled=recoveryBusy;
  $('load-saved').textContent=savedView.conflicts.has(active?.id)?'Open older-tab version as a copy':'Load saved version';
}
if(refreshSaved()){
  const resumed=jobs.find(job=>job.id===savedView.activeId);
  if(resumed)active=draftFor(resumed).job;
}
function operation() {return active?.operations.find(op=>op.id===active.selectedOperationId)||active?.operations[0];}
function persist() {
  if(!active)return Promise.resolve(false);
  const draft=draftFor(active);draft.job=active;
  const snapshot=structuredClone(active),sequence=++draft.sequence;
  refreshSaved();saveStatus();
  const task=saveQueue.then(async()=>{
    if(drafts.get(snapshot.id)!==draft)return false;
    if(draft.error?.code==='conflict'||draft.error?.code==='legacy-conflict')return false;
    try{
      const result=await workspaceStore.save(snapshot,draft.base,{isCurrent:()=>drafts.get(snapshot.id)===draft});
      draft.base=result.version;draft.saved=sequence;draft.error=null;
      if(sequence===draft.sequence)draft.job.updatedAt=result.job.updatedAt;
      refreshSaved();return true;
    }catch(error){
      if(error.code==='cancelled')return false;
      draft.error=error.code?error:Object.assign(new Error('Could not save on this device. Keep this page open to retain your changes.'),{code:'storage-failure'});
      notify(draft.error.message);return false;
    }finally{saveStatus();}
  });
  saveQueue=task.then(()=>{});return task;
}
async function saveSeparateCopy(job=active){
  if(!job||recoveryBusy)return;
  recoveryBusy=true;saveStatus();
  const original=active,draft=drafts.get(original.id),sequence=draft?.sequence,snapshot=structuredClone(job);
  $('save-copy').disabled=true;
  try{
    await saveQueue;
    const result=await workspaceStore.save(snapshot,null,{copy:true});
    // Do not discard edits typed while the lock/copy was pending.
    if(active===original&&draft?.sequence===sequence){
      if(job===original)drafts.delete(original.id);
      refreshSaved();active=draftFor(result.job).job;renderWorkspace();
    }else refreshSaved();
    notify('A separate complete working copy was saved. Other saved versions were not changed.');
  }catch(error){notify(error.message||'The separate copy could not be saved. Keep this page open.');}
  finally{recoveryBusy=false;saveStatus();if(currentPage==='home')renderHome();}
}
$('save-copy').addEventListener('click',()=>saveSeparateCopy());
$('load-saved').addEventListener('click',()=>{
  if(recoveryBusy)return;
  if(!active||!refreshSaved())return;
  const older=savedView.conflicts.get(active.id);
  if(older){saveSeparateCopy(older);return;}
  const saved=savedView.jobs.find(job=>job.id===active.id);
  if(!saved||!window.confirm('Discard this tab’s unsaved changes and load the saved version?'))return;
  drafts.delete(active.id);active=draftFor(saved).job;saveStatus();renderWorkspace();
});
function savedElsewhere(){
  if(!refreshSaved())return;
  const draft=active&&drafts.get(active.id);
  if(draft&&(savedView.versions.get(active.id)??null)!==draft.base){
    draft.error=Object.assign(new Error('This job changed in another tab. Your draft has not been replaced.'),{code:'conflict'});
    saveStatus();
  }
  if(currentPage==='library')renderLibrary();
  if(currentPage==='home')renderHome();
}
function pullSavedChanges(){
  return workspaceStore.refresh().then(savedElsewhere).catch(error=>{ $('save-state').textContent=error.message;notify(error.message); });
}
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY&&event.key!==WORKSPACE_KEY&&event.key!==null)return;
  savedElsewhere();return pullSavedChanges();
});
workspaceChannel?.addEventListener('message',event=>{if(event.data==='committed')pullSavedChanges();});
window.addEventListener('focus',pullSavedChanges);
window.addEventListener('beforeunload',event=>{
  if(pendingSelections||recoveryBusy||[...drafts.values()].some(draft=>draft.sequence!==draft.saved||draft.error)){
    event.preventDefault();event.returnValue='';
  }
});
const pageNames=['home','workspace','library','references','settings'];
function routeFromLocation() {return pageNames.includes(location.hash.slice(1))?location.hash.slice(1):'home';}
function renderHome() {
  const job=active||jobs[0];
  $('resume').hidden=!job;$('resume-job').hidden=!job;
  $('home-new-job').classList.toggle('primary',!job);
  if(!job)return;
  const op=job.operations.find(item=>item.id===job.selectedOperationId)||job.operations[0];
  $('resume-title').textContent=job.title;
  $('resume-position').textContent=op?[op.label,stages[stageFor(op)]?.[0]].filter(Boolean).join(' / '):'No operations yet';
}
function page(name,{recordHistory=true,moveFocus=true}={}) {
  if(!pageNames.includes(name))return;
  // A workspace link never creates a job. Empty workspaces return to Home.
  if(name==='workspace'&&!active)name='home';
  const changed=currentPage!==name;
  if(changed)scrollPositions[currentPage]=window.scrollY;
  if(name==='home')renderHome();
  if(name==='workspace'&&$('job-workspace').hidden)renderWorkspace();
  for(const key of pageNames)$(key).hidden=key!==name;
  document.querySelectorAll('[data-page]').forEach(button=>{
    if(button.dataset.page===name)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  if(name==='library')renderLibrary();
  auxiliary?.closeMenu(false);currentPage=name;
  if(changed)window.scrollTo({top:scrollPositions[name]||0,behavior:'instant'});
  if(recordHistory&&history.state?.preAlphaPage!==name)history.pushState({preAlphaPage:name},'','#'+name);
  // Do not leave keyboard/screen-reader focus inside the now-hidden page or menu.
  if(moveFocus&&(changed||document.activeElement?.closest('[hidden]')))$(name).querySelector('h1')?.focus({preventScroll:true});
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
  const origin=attribute==='data-field'&&type==='text'?'<small class="value-origin" data-value-origin="'+escape(key)+'">'+escape(origins.label(operation(),key))+'</small>':'';
  return '<div class="field'+(type==='textarea'?' wide':'')+(['operation','machine'].includes(type)?' setup-choice':'')+'"><div class="field-label"><label for="'+escape(attribute+key)+'">'+escape(label)+'</label>'+(FIELD_HELP[key]?'<button type="button" class="help-icon" data-help-field="'+key+'" aria-label="Help for '+escape(label)+'">?</button>':'')+'</div>'+control+origin+(hint?'<small'+(key==='lsMd'?' id="ls-md-hint"':'')+'>'+escape(hint)+'</small>':'')+(key==='ptc'?'<small id="ptc-warning" class="field-warning" hidden></small>':'')+'</div>';
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
  $('job-workspace').hidden=!active;
  if(!active)return;
  saveStatus();
  let migrated=false;for(const item of active.operations)if(migratePipeSource(item))migrated=true;
  if(migrated)persist();
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
  $('measurement-workspace').dataset.helpContext=stage;
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
function reviewInputMarkup(rows,op=operation()) {
  return '<dl class="review-list">'+rows.map(({key,label,value,note})=>{
    const numeric=number(value);
    const display=Number.isFinite(numeric)?format(numeric)+' in':Number.isNaN(value)||value==null||value===''?'Not entered':String(value)+' (invalid)';
    return '<div><dt>'+escape(label)+(note?'<small>'+escape(note)+'</small>':'')+'<small class="value-origin">'+escape(origins.label(op,key))+'</small></dt><dd>'+escape(display)+'</dd></div>';
  }).join('')+'</dl>';
}
function operationReviewMarkup(op) {
  const checks=operationWarnings(op,active.sharedState.machineType),attention=checks.filter(check=>check.kind!=='info'),notes=checks.filter(check=>check.kind==='info');
  const checklist='<section id="review-checks" aria-labelledby="review-checks-title"><h3 id="review-checks-title">'+(attention.length?attention.length+' check'+(attention.length===1?'':'s')+' to review':'Automatic checks')+'</h3>'+
    (attention.length?'<ul class="review-warnings">'+attention.map(check=>'<li class="warning" data-warning-code="'+escape(check.code)+'"><strong>'+escape(STAGE_TITLES[check.stage]||check.stage)+'</strong><span>'+escape(check.message)+'</span><button class="quiet" '+(check.stage==='eta'?'data-open-eta':'data-review-edit="'+escape(check.stage)+'"')+'>Review stage</button></li>').join('')+'</ul>':'<p class="result-hint">No automatic warnings found. This is not a field verification.</p>')+
    (notes.length?'<ul class="review-notes">'+notes.map(note=>'<li><strong>'+escape(STAGE_TITLES[note.stage])+':</strong> '+escape(note.message)+'</li>').join('')+'</ul>':'')+'</section>';
  const sections=reviewSections(op).map(section=>{
    const results=section.stage==='pipe'&&stepsFor(op).includes('tap')?etaResultPanel(op,active.sharedState.machineType,{secondary:section.results.slice(1)}):'<dl class="review-results">'+section.results.map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd>'+format(value)+(Number.isFinite(value)?' <small>in</small>':' <small>'+(label==='Travel margin'?'Not checked':'Not calculated')+'</small>')+'</dd></div>').join('')+'</dl>';
    return '<section class="review-stage" data-help-context="'+section.stage+'" data-review-stage="'+section.stage+'"><header><div><h3>'+escape(section.title)+'</h3><p class="review-mode value-origin" data-result-origin>'+escape(section.mode+(section.override?'':' - not field verified'))+'</p></div><button data-review-edit="'+section.stage+'" aria-label="Edit '+escape(section.title)+' measurements">Edit</button></header>'+results+worksheetMarkup(op,section.stage,origins)+
      '<details class="review-inputs"><summary>'+(section.override?'Retained setup measurements (not used for lower in)':'Setup measurements')+'</summary>'+reviewInputMarkup(section.inputs)+'</details>'+
      (section.retained.length?'<details class="review-inactive"><summary>Inactive saved inputs (not used)</summary>'+reviewInputMarkup(section.retained)+'</details>':'')+'</section>';
  }).join('');
  return '<p class="review-scope">Current operation: <strong>'+escape(op.label)+'</strong>. Other operations keep their own measurements.</p>'+checklist+sections;
}
function renderResults() {
  const op=operation(); if(!op)return;
  const results=resultsFor(op,stage);
  if(results.length) {
    const [main,...rest]=results;
    $('results').innerHTML=stage==='pipe'&&stepsFor(op).includes('tap')?etaResultPanel(op,active.sharedState.machineType,{primary:true,secondary:rest}):'<div class="result-panel"><p class="eyebrow">'+escape(main[0])+'</p><strong class="big-value">'+format(main[1])+' <small>in</small></strong><div class="result-subgrid">'+rest.map(([label,value])=>'<div><span>'+escape(label)+'</span><strong>'+format(value)+' <small>in</small></strong></div>').join('')+'</div></div>';
    const optional=stage==='pipe'?['Coupon free']:stage==='stop'?['Travel margin']:[];
    $('results').insertAdjacentHTML('beforeend','<p class="value-origin" data-result-origin>'+((stage==='stop'&&[true,'true'].includes(op.state.lsLiManualToggle))||(stage==='plug'&&[true,'true'].includes(op.state.cpLiManualToggle))?'Active manual override':'Calculated from setup - not field verified')+'</p>');
    const missing=results.some(([label,value])=>!optional.includes(label)&&!Number.isFinite(value));
    if(missing)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">'+(stage==='tap'?'Enter the required measurements for a result. Blank Hot Tap LD uses 0; other empty inputs are not assumed to be zero.':'Enter the measurements for a result. Empty fields are left blank rather than assumed to be zero.')+'</p>');
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
  if(!['setup','pipe','review'].includes(stage)&&stepsFor(op).includes('tap'))$('results').insertAdjacentHTML('beforeend',etaSummary(op,active.sharedState.machineType));
  if(stage==='stop')$('results').insertAdjacentHTML('afterbegin','<p class="result-hint">Pipe O.D.: <strong>'+format(pipeOD(op.state))+' in</strong> from Pipe &amp; cutter. <button class="quiet" data-review-edit="pipe">Edit pipe setup</button></p>');
  if(stage==='saved'&&op.retiredLineStopOD)$('results').insertAdjacentHTML('beforeend','<p class="result-hint">Archived Line Stop O.D. '+escape(op.retiredLineStopOD.value)+' is retained, but does not control this working copy.</p>');
  const warnings=hotTapWarnings(op);
  if(stage!=='review')$('results').insertAdjacentHTML('beforeend',warningMarkup(operationWarnings(op,active.sharedState.machineType).filter(warning=>warning.stage===stage&&!['info','missing'].includes(warning.kind))));
  const ptcWarning=$('ptc-warning'),ptcInput=$('data-fieldptc');
  if(ptcWarning&&ptcInput){
    const warning=warnings.find(item=>item.field==='ptc');
    ptcWarning.hidden=!warning;ptcWarning.textContent=warning?'PTC exceeds '+warning.limit.toFixed(4)+' in limit.':'';
    if(warning){ptcInput.setAttribute('aria-invalid','true');ptcInput.setAttribute('aria-describedby','ptc-warning');}
    else{ptcInput.removeAttribute('aria-invalid');ptcInput.removeAttribute('aria-describedby');}
  }
  if($('ls-md-hint'))$('ls-md-hint').textContent=lineStopMdIsManual(op.state)?'Manual MD; Hot Tap MD changes are kept separate.':'Follows Hot Tap MD until you edit it.';
  $('fields').querySelectorAll('[data-value-origin]').forEach(node=>node.textContent=origins.label(op,node.dataset.valueOrigin));
  $('preserved').innerHTML=stage==='review'||stage==='saved'?'':'<details><summary>Other saved inputs</summary>'+reviewMarkup(op.state,true)+'</details>';
}
function openJob(job) {
  if(!job)return;
  refreshSaved();
  const existing=jobs.find(item=>item.sourceId===job.sourceId&&item.source===job.source);
  const selected=existing||structuredClone(job);
  if(!existing&&jobs.some(item=>item.id===selected.id))selected.id=crypto.randomUUID();
  active=draftFor(selected).job;stage=stageFor(operation());
  if(!existing)persist();
  else {const id=active.id;pendingSelections++;saveQueue=saveQueue.then(()=>workspaceStore.select(id)).catch(error=>notify('Could not remember the selected job. '+error.message)).finally(()=>{pendingSelections--;saveStatus();});}
  saveStatus();renderWorkspace();page('workspace');
}
function renderLibrary() {
  refreshSaved();
  const device=getDeviceJobs(localStorage);
  $('shared-count').textContent=shared.length;$('device-count').textContent=device.length;$('experimental-count').textContent=jobs.length;
  document.querySelectorAll('[data-source]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.source===source)));
  const query=$('search').value.trim().toLowerCase();
  const entries=matchingJobs(source==='shared'?shared:source==='device'?device:jobs,query);
  $('library-summary').textContent=entries.length+' job'+(entries.length===1?'':'s')+' found';
  $('job-list').innerHTML=jobRowsMarkup(entries.slice(0,visibleLimit),source)||'<p class="empty-state">'+(query?'No matching jobs. Try another search.':source==='shared'?'No shared jobs loaded. Use Refresh shared jobs to connect.':source==='device'?'There are no live/dev local saves in this browser. Shared jobs are available in the Shared jobs tab.':'Your experimental working copies will appear here.')+'</p>';
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
  const link=event.target.closest('a[data-page]');
  if(link){
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();page(link.dataset.page);return;
  }
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.page)page(button.dataset.page);
  if(button.dataset.action==='resume'){
    if(active)page('workspace');else if(jobs[0])openJob(jobs[0]);
  }
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
  else {setOperationMeasurement(operation(),key,key.endsWith('Toggle') ? event.target.value==='true' : event.target.value);origins.record(operation(),key);}
  persist();renderResults();
});
$('fields').addEventListener('change',event=>{
  const key=event.target.dataset.field;
  if(key==='operationType'){chooseOperationType(active,operation(),event.target.value);persist();renderWorkspace();return;}
  if(['bcoPipeMaterial','bcoPipeOD','bcoSchedule'].includes(key)){choosePipeSelection(operation().state,key,event.target.value);if(operation().state.bcoSchedule!=='custom')origins.record(operation(),'bcoPipeID','table');persist();renderWorkspace();}
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
  notify('Operation removed from this tab’s working copy. Check the save status.');
});
$('delete-operation-dialog').addEventListener('close',()=>pendingDeleteId=null);
$('back').addEventListener('click',()=>{const steps=stepsFor(operation());goToStage(steps[Math.max(0,steps.indexOf(stage)-1)]);});
$('next').addEventListener('click',()=>{const steps=stepsFor(operation());const index=steps.indexOf(stage);if(index===steps.length-1)page('library');else goToStage(steps[index+1]);});
$('search').addEventListener('input',()=>{visibleLimit=30;renderLibrary();});
$('more').addEventListener('click',()=>{visibleLimit+=30;renderLibrary();});
$('refresh').addEventListener('click',refreshShared);
function theme(dark){document.body.classList.toggle('dark',dark);$('theme').textContent=dark?'Light':'Dark';$('theme').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');$('settings-theme').value=dark?'dark':'light';}
try {theme(localStorage.getItem(THEME_KEY)==='dark');}catch{}
$('theme').addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');theme(dark);try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}});
renderHome();saveStatus();
auxiliary=initAuxiliary({getOperation:operation,getMachine:()=>active?.sharedState.machineType||'',persist,onEtaChanged:renderResults,notify,setTheme:dark=>{theme(dark);try{localStorage.setItem(THEME_KEY,dark?'dark':'light');}catch{}},getTheme:()=>document.body.classList.contains('dark')?'dark':'light'});
installHelp();
const initialPage=routeFromLocation()==='workspace'&&!active?'home':routeFromLocation();
history.replaceState({preAlphaPage:initialPage},'','#'+initialPage);page(initialPage,{recordHistory:false,moveFocus:false});
function restorePage(){
  document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
  page(routeFromLocation(),{recordHistory:false});
}
window.addEventListener('popstate',restorePage);
window.addEventListener('hashchange',restorePage);
refreshShared();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js?v='+BUILD,{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
}

import {createReferences} from './references.mjs?v=pre-alpha07';
import {ETA_MACHINES,etaFor,formatEta} from './eta.mjs?v=pre-alpha07';
import {number,stepsFor} from './model.mjs?v=pre-alpha07';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const $=id=>document.getElementById(id);
export function etaSummary(operation,machineName) {
  const eta=etaFor(operation,machineName);
  const time=eta.issue?'Not calculated':formatEta(eta.lowMinutes)+(eta.lowMinutes===eta.highMinutes?'':' to '+formatEta(eta.highMinutes));
  return '<section class="review-stage eta-summary" data-help-context="eta"><header><div><h3>Cutting time (ETA)</h3><p class="review-mode">Current BCO distance only; not full job duration</p></div><button data-open-eta>Open ETA</button></header><p class="eta-time">'+escape(time)+'</p>'+(eta.issue?'<p class="result-hint">'+escape(eta.issue)+'</p>':'<p class="review-mode">'+(eta.manual?'Manual RPM':escape(eta.match.basis)+' chart RPM')+'; 0.0040 in/revolution assumption.</p>')+'</section>';
}
export function initAuxiliary({getOperation,getMachine,persist,onEtaChanged,notify,setTheme,getTheme}) {
  createReferences($('reference-browser'),{getOperation});
  const menu=$('app-menu'),toggle=$('menu-toggle');let etaTrigger=null;
  function closeMenu(restoreFocus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');if(restoreFocus)toggle.focus({preventScroll:true});}
  function openMenu(){const r=toggle.getBoundingClientRect();menu.style.top=r.bottom+scrollY+8+'px';menu.style.left=r.left+scrollX+'px';menu.hidden=false;toggle.setAttribute('aria-expanded','true');menu.querySelector('button').focus({preventScroll:true});}
  toggle.addEventListener('click',()=>menu.hidden?openMenu():closeMenu(true));
  $('menu-close').addEventListener('click',()=>closeMenu(true));
  document.addEventListener('click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!toggle.contains(event.target))closeMenu();if(event.target.closest('#app-menu [data-page]'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();closeMenu(true);}});
  $('settings-theme').value=getTheme();$('settings-theme').addEventListener('change',()=>setTheme($('settings-theme').value==='dark'));
  function renderEta(){
    const op=getOperation();if(!op)return;
    const eta=etaFor(op,getMachine()),profile=ETA_MACHINES[eta.profile]||'No supported chart',rpm=eta.rpm.map(value=>Number.isFinite(value)?String(value):'invalid').join(' / ');
    const distance=Number.isFinite(eta.distance)?eta.distance.toFixed(4)+' in':'Not calculated';
    const time=eta.issue?'Not calculated':formatEta(eta.lowMinutes)+(eta.lowMinutes===eta.highMinutes?'':' to '+formatEta(eta.highMinutes));
    const basis=eta.manual?'Manual RPM override':eta.match.basis==='interpolated'?'Interpolated between chart sizes '+eta.match.sizes.join(' and '):eta.match.basis==='nearest'?'Outside chart range: nearest chart size '+eta.match.sizes[0]:eta.match.basis==='exact'?'Exact chart size':'No matching RPM chart';
    const saved=String(op.state.etaBco??'').trim()&&number(op.state.etaBco)!==eta.distance?'<p class="result-hint">Saved ETA distance '+escape(op.state.etaBco)+' is retained but not used. This estimate follows current Pipe & cutter BCO.</p>':'';
    const speeds=eta.rpm.filter(value=>Number.isFinite(value)&&value>0).map(value=>value*eta.feedRate);
    const feed=speeds.length?Math.min(...speeds).toFixed(3)+(Math.min(...speeds)===Math.max(...speeds)?'':' - '+Math.max(...speeds).toFixed(3))+' in/min':'Not calculated';
    $('eta-results').innerHTML='<div class="result-panel"><p class="eyebrow">Estimated cutting time to BCO</p><strong class="eta-time">'+escape(time)+'</strong><dl class="review-results"><div><dt>Cutting distance</dt><dd>'+escape(distance)+'</dd></div><div><dt>RPM used</dt><dd>'+escape(rpm||'Not available')+'</dd></div><div><dt>Chart RPM</dt><dd>'+escape(eta.match.values.join(' / ')||'Not listed')+'</dd></div><div><dt>Feed speed</dt><dd>'+escape(feed)+'</dd></div></dl></div>'+
      (eta.issue?'<p class="warning">'+escape(eta.issue)+'</p>':'<p class="'+(eta.manual||eta.match.basis==='nearest'?'warning':'result-hint')+'">'+escape(basis)+'. '+escape(profile)+'.</p>')+
      '<p class="result-hint">Feed assumption: 0.0040 in/revolution, copied from the existing estimator. Confirm actual cutting conditions and applicable equipment instructions. This is not a verified speed or job-duration guarantee.</p>'+saved;
  }
  function openEta(trigger){
    const op=getOperation();if(!op||!stepsFor(op).includes('tap')){notify('ETA is connected only for standard Hot Tap stages in this workspace.');return;}
    const eta=etaFor(op,getMachine()),options=[['','No chart selected'],...Object.entries(ETA_MACHINES)];
    if(eta.profile&&!Object.hasOwn(ETA_MACHINES,eta.profile))options.push([eta.profile,eta.profile+' (saved; no matching chart)']);
    const help=(key,label)=>'<button type="button" class="help-icon" data-help-field="'+key+'" aria-label="Help for '+escape(label)+'">?</button>';
    $('eta-fields').innerHTML='<div class="field wide"><div class="field-label"><label for="eta-machine">RPM chart profile</label>'+help('etaMachine','RPM chart profile')+'</div><select id="eta-machine" data-eta-field="etaMachine">'+options.map(([value,label])=>'<option value="'+escape(value)+'"'+(value===eta.profile?' selected':'')+'>'+escape(label)+'</option>').join('')+'</select></div>'+
      [['etaCutterSize','RPM lookup cutter size (in)',eta.size],['etaRpmOverride','Manual RPM (optional)',op.state.etaRpmOverride]].map(([key,label,value])=>'<div class="field"><div class="field-label"><label for="eta-'+key+'">'+escape(label)+'</label>'+help(key,label)+'</div><input id="eta-'+key+'" data-eta-field="'+key+'" inputmode="decimal" value="'+escape(value)+'"></div>').join('');
    etaTrigger=trigger;renderEta();$('eta-dialog').showModal();
  }
  document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open-eta]');if(trigger)openEta(trigger);});
  $('eta-fields').addEventListener('input',event=>{const key=event.target.dataset.etaField;if(!key)return;getOperation().state[key]=event.target.value;persist();renderEta();});
  $('eta-dialog').addEventListener('close',()=>{onEtaChanged();if(etaTrigger?.isConnected)etaTrigger.focus({preventScroll:true});});
  return {closeMenu,renderEta};
}

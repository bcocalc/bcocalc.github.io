import {createReferences} from './references.mjs?v=pre-alpha14';
import {ETA_MACHINES,etaFor} from './eta.mjs?v=pre-alpha14';
import {etaPresentation} from './eta-view.mjs?v=pre-alpha14';
import {stepsFor} from './model.mjs?v=pre-alpha14';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const $=id=>document.getElementById(id);
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
    const view=etaPresentation(op,getMachine()),{eta,profile,rpm,distance,time,feed}=view;
    const basis=eta.manual?'Manual RPM override':view.chartBasis;
    const saved=view.savedNote?'<p class="result-hint">'+escape(view.savedNote)+'</p>':'';
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
  $('eta-fields').addEventListener('input',event=>{const key=event.target.dataset.etaField;if(!key)return;getOperation().state[key]=event.target.value;persist();renderEta();onEtaChanged();});
  $('eta-dialog').addEventListener('close',()=>{onEtaChanged();const target=etaTrigger?.isConnected?etaTrigger:document.querySelector('#results [data-eta-settings]');target?.focus({preventScroll:true});});
  return {closeMenu,renderEta};
}

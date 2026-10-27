// Install after the real help owner. Passive synthetic-test observers only;
// never record input values or job text, or schedule work during event dispatch.
export function installEtaTooltipDiagnostics() {
  const selector='[data-help-term],[data-help-field],[data-term-tip]';
  const describe=element=>element?{tag:element.tagName,id:element.id,helpTerm:element.dataset?.helpTerm,helpField:element.dataset?.helpField,termTip:element.dataset?.termTip,etaField:element.dataset?.etaField,describedBy:element.getAttribute?.('aria-describedby')}:null;
  const state=window.__etaTooltipTrace={limit:60,events:[],observerErrors:[],pin:{applicationValue:'not exposed: installHelp closure-private',inferred:false,source:'help owner and click event history, not a direct application-state read'}};
  let previousOwner=null;
  const append=entry=>{state.events.push(entry);if(state.events.length>state.limit)state.events.shift();};
  const record=(type,event)=>{
    const helpTarget=event.target.closest?.(selector),target=describe(event.target),related=describe(event.relatedTarget);
    const entry={type,time:performance.now(),target,related,pointerType:event.pointerType,key:event.key===undefined?undefined:['Escape','Enter',' '].includes(event.key)?event.key:'other'};
    try{
      const tooltip=document.getElementById('term-tooltip'),owner=document.querySelector('[aria-describedby~="term-tooltip"]');
      if(!tooltip||tooltip.hidden||owner!==previousOwner)state.pin.inferred=false;
      if(type==='click'&&helpTarget?.matches('[data-help-term],[data-help-field]'))state.pin.inferred=Boolean(tooltip&&!tooltip.hidden&&owner===helpTarget);
      previousOwner=owner;
      append({...entry,phase:'after help owner',defaultPrevented:event.defaultPrevented,tooltipHidden:tooltip?.hidden??null,owner:describe(owner),inferredPinned:state.pin.inferred});
    }catch(error){if(state.observerErrors.length<5)state.observerErrors.push(error.name);}
  };
  for(const type of ['focusin','focusout','pointerover','pointerout','click','keydown'])document.addEventListener(type,event=>record(type,event));
  document.addEventListener('close',event=>record('close',event),true);
  // Escape can stop propagation in the owner's document-capture handler.
  // Record its arrival separately, without calling this pre-handler state final.
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape')append({type:'keydown',key:'Escape',phase:'capture before help owner',time:performance.now(),target:describe(event.target)});
  },true);
}

export function collectEtaTooltipDiagnostic() {
  const describe=element=>element?{tag:element.tagName,id:element.id,helpTerm:element.dataset?.helpTerm,helpField:element.dataset?.helpField,termTip:element.dataset?.termTip,etaField:element.dataset?.etaField,describedBy:element.getAttribute?.('aria-describedby'),connected:element.isConnected,focused:element===document.activeElement,hovered:element.matches?.(':hover')}:null;
  const tooltip=document.getElementById('term-tooltip'),style=tooltip?getComputedStyle(tooltip):null,rect=tooltip?.getBoundingClientRect(),trace=window.__etaTooltipTrace;
  return {
    time:performance.now(),dialogOpen:document.getElementById('eta-dialog')?.open??null,activeElement:describe(document.activeElement),
    tooltip:tooltip?{...describe(tooltip),hidden:tooltip.hidden,display:style.display,visibility:style.visibility,parent:describe(tooltip.parentElement),containsFocus:tooltip.contains(document.activeElement),rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}:null,
    activeHelpTargets:[...document.querySelectorAll('[aria-describedby~="term-tooltip"]')].map(describe),
    hoveredElements:[...document.querySelectorAll(':hover')].slice(-12).map(describe),
    pin:trace?{...trace.pin,inferred:tooltip?.hidden?false:trace.pin.inferred,asOf:'last observed event, with current hidden state checked'}:{applicationValue:'not exposed: installHelp closure-private',inferred:null,source:'observer unavailable'},
    recentEvents:trace?.events??[],observerErrors:trace?.observerErrors??[]
  };
}

export async function waitForEtaTooltipHidden(page,context) {
  try{await page.waitForFunction(()=>document.getElementById('term-tooltip')?.hidden!==false);}
  catch(error){
    try{console.error('ETA_TOOLTIP_HIDE_DIAGNOSTIC',JSON.stringify({...context,errorName:error.name,state:await page.evaluate(collectEtaTooltipDiagnostic)}));}
    catch(diagnosticError){
      try{console.error('ETA_TOOLTIP_HIDE_DIAGNOSTIC_ERROR',diagnosticError.name);}catch{}
    }
    // Diagnostics must not dismiss help, press Escape, retry, or replace failure.
    throw error;
  }
}

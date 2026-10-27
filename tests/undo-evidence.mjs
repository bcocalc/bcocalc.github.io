// Runs only in the disposable localhost fixture, before navigation; no app mutation.
export function installUndoEvidence(){
  if(!['127.0.0.1','localhost'].includes(location.hostname))return;
  const events=[],fields=['md','ld','ldSign','ptc','start','htActualPop','htFieldBasis'];
  const pick=state=>Object.fromEntries(fields.map(key=>[key,String(state?.[key]??'').slice(0,1800)]));
  const snapshot=()=>{
    let stored={};try{const raw=JSON.parse(localStorage.getItem('measurementCardStateV1')||'{}');stored=pick(raw.state||raw);}catch{}
    return {fields:pick(Object.fromEntries(fields.map(id=>[id,document.getElementById(id)?.value]))),stored,
      pop:document.getElementById('pop')?.textContent,undoDisabled:document.getElementById('htFieldUndo')?.disabled,
      screen:document.body?.dataset.activeScreen,stage:window.__tapCalcWorkflowStage,active:document.activeElement?.id};
  };
  const mark=(label,event)=>{events.push({label,at:performance.now(),event:event?{type:event.type,trusted:event.isTrusted,target:event.target?.id,prevented:event.defaultPrevented}:null,...snapshot()});if(events.length>60)events.shift();};
  for(const type of ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click','input','change']){
    for(const capture of [true,false])document.addEventListener(type,event=>{
      if(!event.target.closest?.('#htFieldUndo')&&!fields.includes(event.target.id))return;
      mark(capture?'capture':'bubble',event);
      if(type==='click'&&capture)queueMicrotask(()=>mark('after click microtask',event));
    },capture);
  }
  for(const type of ['load','pageshow'])window.addEventListener(type,event=>mark(type,event));
  window.__tapcalcUndoEvidence={mark:label=>mark(label),read:()=>({events:[...events],current:snapshot()})};
}

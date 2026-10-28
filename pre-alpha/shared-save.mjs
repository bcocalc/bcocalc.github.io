import {geometry,resultsFor,stepsFor,operationType,familyStage} from './model.mjs?v=pre-alpha23';
import {operationWarnings} from './review.mjs?v=pre-alpha23';
import {htpChartRow} from './families.mjs?v=pre-alpha23';
import {etaPresentation} from './eta-view.mjs?v=pre-alpha23';
const clone=value=>structuredClone(value);
const format=value=>Number.isFinite(value)?value.toFixed(4):'';
const canonical=value=>JSON.stringify(value,(_,child)=>child&&typeof child==='object'&&!Array.isArray(child)?Object.fromEntries(Object.entries(child).sort(([a],[b])=>a.localeCompare(b))):child);
const metadata=[['client','jobClient'],['description','jobDescription'],['jobNumber','jobNumber'],['pressure','jobPressure'],['temperature','jobTemperature'],['date','jobDate'],['product','jobProduct'],['location','jobLocation'],['technician','jobTechnician'],['notes','jobNotes']];

// Read-only capture. The unmodified cloud transport owns IDs, dedup and recovery.
export function buildSharedSnapshot(job){
  const snapshot=clone(job);
  if(!snapshot?.id||!Array.isArray(snapshot.operations)||!snapshot.operations.length)throw new Error('Add an operation before saving a shared snapshot.');
  const selected=snapshot.operations.find(op=>op.id===snapshot.selectedOperationId);
  if(!selected)throw new Error('Choose an operation before saving a shared snapshot.');
  const original=snapshot.original?.record||snapshot.original||{},shared=snapshot.sharedState||{};
  const oldBundle=[original.jobBundle,original.state?.jobBundle,snapshot.original?.jobBundle].find(value=>Array.isArray(value?.operations));
  const bundle={...clone(oldBundle||{}),version:oldBundle?.version??3,selectedOperationId:selected.id,sharedState:clone(shared),operations:clone(snapshot.operations)};
  const state={...clone(shared),...clone(selected.state),jobBundle:clone(bundle)};
  const g=geometry(selected.state),steps=stepsFor(selected),tap=Object.fromEntries(resultsFor(selected,'tap'));
  const matches=(oldBundle?.operations||[]).filter((op,index)=>String(op.id||'operation-'+index)===selected.id);
  const originalSelected=oldBundle?.operations?.length>1?oldBundle.selectedOperationId===selected.id&&matches.length===1:oldBundle?.operations?.length===1?matches.length===1:selected.id==='operation-0';
  const measurements=clone(selected.measurements||(originalSelected?original.measurements:{})||{}),calculations=clone(originalSelected?original.calculations||{}:{});
  const family=familyStage(selected);
  if(family){
    for(const group of ['hotTap','lineStop','completionPlug','htp','hiStop'])if(group!==family)delete measurements[group];
    for(const key of ['bco','hotTapLi','hotTapTtd','lineStopLi','completionPlugLi','htpTco','hiStopTco','hiStopPlugSet'])delete calculations[key];
  }
  if(steps.includes('tap')){
    measurements.hotTap={...measurements.hotTap,md:selected.state.md??'',ld:selected.state.ld??'',ldSign:selected.state.ldSign??'+',ptc:selected.state.ptc??'',pod:format(g.od),rodStart:selected.state.start??'',mt:selected.state.mt??'',
      li:format(tap['Lower in']),pop:format(tap['Pilot on pipe']),cop:format(tap['Cutter on pipe']),rodBco:format(tap['Rod BCO']),ttd:format(tap['Total travel']),mco:format(tap['Maximum cut out (MCO)']),rodMco:format(tap['Rod MCO'])};
    calculations.hotTapLi=measurements.hotTap.li;calculations.hotTapTtd=measurements.hotTap.ttd;calculations.bco=format(g.bco);
  }
  if(steps.includes('stop')){measurements.lineStop={...measurements.lineStop,variant:'standard',md:selected.state.lsMd??'',ld:selected.state.lsLd??'',ldSign:selected.state.lsLdSign??'+',pod:format(g.od),li:format(resultsFor(selected,'stop')[0][1]),travel:selected.state.lsTravel??'',machineTravel:selected.state.lsMachineTravel??'',liManual:selected.state.lsLiManual??'',liManualToggle:selected.state.lsLiManualToggle??false};calculations.lineStopLi=measurements.lineStop.li;}
  if(steps.includes('plug')){measurements.completionPlug={...measurements.completionPlug,start:selected.state.cpStart??'',jbf:selected.state.cpJbf??'',ld:selected.state.cpLd??'',pt:selected.state.cpPt??'',li:format(resultsFor(selected,'plug')[0][1]),liManual:selected.state.cpLiManual??'',liManualToggle:selected.state.cpLiManualToggle??false};calculations.completionPlugLi=measurements.completionPlug.li;}
  if(family==='htp'){
    const chart=htpChartRow(selected.state),values=Object.fromEntries(resultsFor(selected,'htp')),eta=etaPresentation(selected,shared.machineType);
    measurements.htp={...measurements.htp,pipeSize:selected.state.htpPipeSize??'',branchSize:chart?.branch??'',head:chart?.head??'',cutterSize:Number.isFinite(chart?.cutter)?chart.cutter.toFixed(3):'',bco:format(chart?.bco),md:selected.state.htpMd??'',ld:selected.state.htpLd??'',ldSign:selected.state.htpLdSign??'+',ptc:selected.state.htpPtc??'',tco:format(values['Total cut out (TCO)']),eta:eta.time};
    calculations.htpTco=measurements.htp.tco;
  }
  if(family==='hiStop'){
    const values=Object.fromEntries(resultsFor(selected,'hiStop'));
    measurements.hiStop={...measurements.hiStop,md:selected.state.hsMd??'',ld:selected.state.hsLd??'',ldSign:selected.state.hsLdSign??'+',rl:selected.state.hsRl??'',pod:format(g.od),cl:selected.state.hsCl??'',ptc:selected.state.hsPtc??'',rcd:selected.state.hsRcd??'',pb:selected.state.hsPb??'',ptp:selected.state.hsPtp??'',li:format(values['Lower in']),tco:format(values['Total cut out (TCO)']),psd:format(values.PSD),plugSet:format(values['Plug Set'])};
    calculations.hiStopTco=measurements.hiStop.tco;calculations.hiStopPlugSet=measurements.hiStop.plugSet;
  }
  const record={...clone(original),meta:{...clone(original.meta||{}),title:snapshot.title,operationType:snapshot.operations.length===1?operationType(selected):snapshot.operations.length+' operations',operationCount:snapshot.operations.length,app:'TapCalc',version:'pre-alpha23',savedAtIso:snapshot.updatedAt||snapshot.savedAt||''},
    job:{...clone(original.job||{}),...Object.fromEntries(metadata.map(([key,field])=>[key,Object.hasOwn(shared,field)?shared[field]:original.job?.[key]??'']))},
    jobBundle:bundle,state,measurements,calculations,
    pipe:{...clone(original.pipe||{}),material:selected.state.bcoPipeMaterial??'',nominalSize:selected.state.bcoPipeOD??'',trueOd:format(g.od),pipeId:format(g.id),wallThickness:format(g.wall),schedule:selected.state.bcoSchedule??''},
    machine:{...clone(original.machine||{}),machine:shared.machineType??'',cutterOd:selected.state.bcoCutterOD??''},
    preAlphaCapture:{job:snapshot,operations:snapshot.operations.map(operation=>({id:operation.id,supported:!stepsFor(operation).includes('saved'),results:Object.fromEntries(stepsFor(operation).filter(stage=>['tap','stop','plug','htp','hiStop'].includes(stage)||stage==='pipe'&&(stepsFor(operation).includes('tap')||stepsFor(operation).includes('hiStop'))).map(stage=>[stage,resultsFor(operation,stage).map(([label,value])=>({label,value:format(value)}))])),warnings:operationWarnings(operation,shared.machineType)}))}};
  return {id:snapshot.id,state:clone(state),record};
}

export function createSharedSaver({store,upload,crypto=globalThis.crypto,onPrepared=()=>{}}){
  if(typeof upload!=='function')throw new Error('Shared saving needs an explicitly injected transport.');
  const pending=new Map(),sending=new Map();
  function send(capture){
    if(sending.has(capture.id))return sending.get(capture.id);
    const task=(async()=>{
      const cloudId=await upload(clone(capture.item));
      if(typeof cloudId!=='string'||!cloudId)throw new Error('Shared upload was not confirmed. The local snapshot is retained for retry.');
      await store.confirmSharedSnapshot(capture.id,cloudId);
      return {captureId:capture.id,cloudId,jobId:capture.jobId};
    })();
    sending.set(capture.id,task);task.then(()=>sending.delete(capture.id),()=>sending.delete(capture.id));return task;
  }
  function save(job,version,{isCurrent=()=>true}={}){
    const snapshot=clone(job),item=buildSharedSnapshot(snapshot),key=canonical(item);
    if(pending.has(key))return pending.get(key);
    const task=(async()=>{
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
      const id='snapshot-'+Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
      const capture={id,jobId:snapshot.id,item};
      const prepared=await store.save(snapshot,version,{isCurrent,sharedCapture:capture});
      onPrepared(prepared);
      try{return await send(capture);}
      catch(error){error.captureId=id;throw error;}
    })();
    pending.set(key,task);task.then(()=>pending.delete(key),()=>pending.delete(key));return task;
  }
  async function retry(id){
    await store.ready;await store.refresh();
    const capture=store.sharedSnapshots().find(entry=>entry.id===id);
    if(!capture)throw new Error('The saved shared snapshot could not be found. Nothing was uploaded.');
    return send(capture);
  }
  return {save,retry};
}

// Bound only by an injected local harness until collection/enablement review.
export function bindSharedSaving(document,{saver,getDraft,onResult=()=>{},onError=()=>{}}){
  let busy=false;
  async function click(event){
    const button=event.target.closest('[data-shared-save]');if(!button||busy)return;
    busy=true;button.disabled=true;button.setAttribute('aria-busy','true');
    const status=document.querySelector('[data-shared-status]');if(status)status.textContent='Saving shared snapshot...';
    try{const {job,version,isCurrent}=getDraft();const result=button.dataset.sharedRetry?await saver.retry(button.dataset.sharedRetry):await saver.save(job,version,{isCurrent});if(status)status.textContent='Shared snapshot saved';onResult(result);}
    catch(error){if(status)status.textContent=error.message;onError(error);}
    finally{busy=false;button.disabled=false;button.removeAttribute('aria-busy');}
  }
  document.addEventListener('click',click);return ()=>document.removeEventListener('click',click);
}

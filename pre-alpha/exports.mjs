import {geometry,number,operationType,stepsFor,resultsFor} from './model.mjs?v=pre-alpha20';
import {operationWarnings,STAGE_TITLES} from './review.mjs?v=pre-alpha20';
import {historicalMcoFor,historicalRodMcoFor} from './presentation.mjs?v=pre-alpha20';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const display=value=>Number.isFinite(value)?value.toFixed(4)+' in':'Not calculated';
const savedText=value=>typeof value==='object'?JSON.stringify(value):String(value);
const INFO=[['Client','jobClient','client'],['Job Description','jobDescription','description'],['Job Number','jobNumber','jobNumber'],['Pressure','jobPressure','pressure'],['Temperature','jobTemperature','temperature'],['Date','jobDate','date'],['Product','jobProduct','product'],['Location','jobLocation','location'],['Technician','jobTechnician','technician'],['Notes','jobNotes','notes']];

function originalMeasurements(job,operation){
  const original=job.original;if(!original)return {};
  const record=original.record||original,saved=original.state||record.state||{};
  const bundle=[record.jobBundle,saved.jobBundle,original.jobBundle,record.state,saved,record].find(v=>Array.isArray(v?.operations)&&v.operations.length);
  const ops=bundle?.operations||[],matches=ops.filter((o,i)=>String(o.id||'operation-'+i)===operation.id);
  if(matches.length===1&&matches[0].measurements)return matches[0].measurements;
  if(ops.length>1&&(bundle.selectedOperationId!==operation.id||matches.length!==1)||ops.length===1&&matches.length!==1||!ops.length&&operation.id!=='operation-0')return {};
  return record.measurements||{};
}

export function buildExportText(job){
  if(!job||!Array.isArray(job.operations))throw new Error('Open a job before exporting.');
  const lines=['TapCalc','Job: '+String(job.title||'Untitled job'),''],info=job.sharedState||{},original=job.original?.record||job.original||{};
  for(const [label,key,oldKey]of INFO){
    const value=Object.hasOwn(info,key)?info[key]:original.job?.[oldKey];
    if(String(value??'').trim())lines.push(label+': '+String(value));
  }
  if(String(info.machineType??'').trim())lines.push('Machine: '+info.machineType);
  for(const [index,operation]of job.operations.entries()){
    const g=geometry(operation.state),steps=stepsFor(operation),tap=Object.fromEntries(resultsFor(operation,'tap'));
    lines.push('','Operation '+(index+1)+' of '+job.operations.length+': '+String(operation.label||operation.id)+' ('+operationType(operation)+')');
    lines.push('Pipe: OD '+display(g.od)+' | Wall '+display(g.wall),'Cutter: '+display(g.cutter),'BCO: '+(steps.includes('tap')?display(g.bco):'Not recalculated for this operation'));
    lines.push('Hot Tap: '+(steps.includes('tap')?'MD '+display(number(operation.state.md))+' | LI '+display(tap['Lower in'])+' | TTD '+display(tap['Total travel']):'Not applicable to this operation'));
    lines.push('Line Stop LI: '+(steps.includes('stop')?display(resultsFor(operation,'stop')[0][1]):'Not applicable to this operation'));
    lines.push('Completion Plug LI: '+(steps.includes('plug')?display(resultsFor(operation,'plug')[0][1]):'Not applicable to this operation'));
    if(steps.includes('saved')){
      lines.push('Saved values only - equipment-specific calculations are not connected; not recalculated.');
      for(const [group,values]of Object.entries(originalMeasurements(job,operation)))for(const [key,value]of Object.entries(values||{}))
        if(value!=null&&String(value).trim())lines.push('Saved '+group+' '+key+': '+savedText(value));
    }
    for(const stage of steps.filter(s=>['tap','stop','plug','htp','hiStop'].includes(s)||s==='pipe'&&steps.includes('tap'))){
      lines.push(STAGE_TITLES[stage]||stage);
      for(const [label,value]of resultsFor(operation,stage))lines.push('  '+label+': '+display(value));
    }
    if(steps.includes('tap'))for(const [label,value]of [['MCO',historicalMcoFor(job,operation)],['Rod MCO',historicalRodMcoFor(job,operation)]])
      if(value!=null)lines.push('Historical '+label+' (original snapshot; not used): '+savedText(value));
    const warnings=operationWarnings(operation,info.machineType);
    lines.push('Warnings: '+(warnings.length?warnings.map(w=>(STAGE_TITLES[w.stage]||w.stage)+': '+w.message).join(' | '):'None'));
  }
  if(!job.operations.length)lines.push('','No operations in this job.');
  lines.push('','Calculated from setup, not field verification. Retained saved values are not current calculations.','Generated from the field calculator.');
  return lines.join('\n');
}

export function printDocument(text){
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>TapCalc</title><style>@page{margin:18mm}body{font:12pt/1.45 Arial,sans-serif;color:#111}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:20pt}</style></head><body><h1>TapCalc</h1><pre>'+escape(text)+'</pre></body></html>';
}

export async function printJob(job,open=()=>window.open('','_blank','width=900,height=700')){
  const text=buildExportText(structuredClone(job)),popup=open();
  if(!popup)throw new Error('Print window blocked. Allow this app to open its print view and try again. Your job is unchanged.');
  try{popup.document.write(printDocument(text));popup.document.close();}
  catch(error){popup.close?.();throw error;}
  await popup.document.fonts?.ready;
  if(popup.closed)return false;
  popup.focus();popup.print();return true;
}

export function wrapLines(text,measure,width){
  const result=[];
  for(const paragraph of text.split('\n')){
    let line='';
    for(const char of paragraph){
      if(line&&measure(line+char)>width){result.push(line);line='';}
      line+=char;
    }
    result.push(line);
  }
  return result;
}

export function downloadJobImage(job,document,now=new Date()){
  const text=buildExportText(structuredClone(job)),canvas=document.createElement('canvas'),width=1400,lineHeight=42;
  canvas.width=width;const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('PNG export is unavailable in this browser. Use Print / Save PDF. Your job is unchanged.');
  ctx.font='28px Arial';const lines=wrapLines(text,t=>ctx.measureText(t).width,width-100),height=Math.max(900,200+lines.length*lineHeight);
  if(height>6000)throw new Error('This job is too long for one safe PNG. Use Print / Save PDF to include every operation and note. Nothing was omitted or changed.');
  canvas.height=height;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#0b2e52';ctx.fillRect(0,0,width,110);
  ctx.fillStyle='#fff';ctx.font='bold 40px Arial';ctx.fillText('TapCalc',50,68);ctx.fillStyle='#111';ctx.font='28px Arial';
  lines.forEach((line,index)=>ctx.fillText(line||' ',50,160+index*lineHeight));
  const href=canvas.toDataURL('image/png');if(!href.startsWith('data:image/png;'))throw new Error('PNG export failed. Use Print / Save PDF; your job is unchanged.');
  const link=document.createElement('a');link.href=href;link.download='tapcalc-'+now.toISOString().replace(/[:.]/g,'-')+'.png';link.click();
  return {width,height,lineCount:lines.length,filename:link.download};
}

export function installExports(document,getJob,onError){
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-job-export]')?.dataset.jobExport;if(!action)return;
    try{
      const snapshot=structuredClone(getJob());
      if(action==='pdf')printJob(snapshot).catch(error=>onError(error.message));
      if(action==='png')downloadJobImage(snapshot,document);
    }catch(error){onError(error.message);}
  });
}

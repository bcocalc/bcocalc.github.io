import {geometry,pipeOD,number,resultsFor,lineStopMdIsManual,hotTapLostDistance} from './model.mjs?v=pre-alpha16';
import {TRUE_OD} from './pipe-data.mjs?v=pre-alpha16';

export const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const has=value=>String(value??'').trim()!=='';
const manual=(state,key)=>[true,'true'].includes(state[key]);
export const displayMeasurement=value=>Number.isFinite(number(value))?number(value).toFixed(4)+' in':!has(value)||typeof value==='number'&&Number.isNaN(value)?'Not entered':String(value)+' (invalid)';

// Session observations are deliberately not written into saved or imported bundles.
export function createOriginTracker() {
  const observations=new WeakMap();
  return {
    record(operation,key,kind='entry') {
      if(!operation)return;
      if(!observations.has(operation))observations.set(operation,new Map());
      observations.get(operation).set(key,{value:operation.state[key],kind});
    },
    label(operation,key) {
      const state=operation.state, value=key==='preAlphaPipeOD'&&!has(state.preAlphaPipeOD)?pipeOD(state):state[key];
      if(key==='pipe-source-od')return 'From Pipe & cutter';
      if(key==='previous-pipe-od'&&operation.retiredLineStopOD)return 'Archived - not used';
      if(key==='ld'&&!has(state.ld))return 'Default 0 - not entered';
      if(!has(value)||typeof value==='number'&&!Number.isFinite(value))return 'Not entered';
      if(key==='lsMd'&&!lineStopMdIsManual(state))return 'Follows Hot Tap MD';
      if(key==='lsLiManual'||key==='cpLiManual')return manual(state,key+'Toggle')?'Active manual override':'Inactive override - not used';
      if(key==='preAlphaPipeOD'&&!has(state.preAlphaPipeOD)) {
        const material=/ductile/i.test(state.bcoPipeMaterial)?'DuctileIron':/carbon|steel/i.test(state.bcoPipeMaterial)?'CarbonSteel':'Other';
        if(TRUE_OD[material]?.[number(state.bcoPipeOD).toFixed(1)]===value)return 'From pipe size table';
      }
      const seen=observations.get(operation)?.get(key);
      if(seen&&Object.is(seen.value,state[key]))return seen.kind==='table'?'Table selected this session':'Entered this session';
      return 'Origin unrecorded';
    }
  };
}

export function worksheetFor(operation,stage) {
  const state=operation.state,g=geometry(state),results=resultsFor(operation,stage);
  const out=label=>results.find(row=>row[0]===label)?.[1];
  const term=(label,key,value=state[key],operator='+')=>({label,key,value,operator});
  const row=(label,terms,formula='')=>({label,terms,result:out(label),formula});
  if(stage==='pipe')return [
    row('BCO',[term('Pipe O.D.','preAlphaPipeOD',g.od),term('Pipe I.D.','bcoPipeID'),term('Cutter O.D.','bcoCutterOD')],'O.D./2 - sqrt((I.D./2)^2 - (cutter O.D./2)^2)'),
    row('Coupon free',[term('Pipe O.D.','preAlphaPipeOD',g.od),term('Pipe I.D.','bcoPipeID'),term('Cutter I.D.','bcoCutterID')],'O.D./2 - sqrt((I.D./2)^2 - (cutter I.D./2)^2)'),
    row('Wall thickness',[term('Pipe O.D.','preAlphaPipeOD',g.od),term('Pipe I.D.','bcoPipeID')],'(Pipe O.D. - Pipe I.D.) / 2')
  ];
  if(stage==='tap')return [
    row('Lower in',[term('Hot Tap MD','md'),term('Hot Tap LD','ld',has(state.ld)?state.ld:hotTapLostDistance(state),state.ldSign==='-'?'-':'+')]),
    row('Pilot on pipe',[term('Rod start','start'),term('Hot Tap lower in','',out('Lower in'))]),
    row('Cutter on pipe',[term('Pilot on pipe','',out('Pilot on pipe')),term('PTC','ptc')]),
    row('Rod BCO',[term('Cutter on pipe','',out('Cutter on pipe')),term('BCO','',g.bco)]),
    row('Total travel',[term('Hot Tap lower in','',out('Lower in')),term('PTC','ptc'),term('BCO','',g.bco)]),
    row('Maximum cut out (MCO)',[term('Actual pipe O.D.','preAlphaPipeOD',g.od),term('PTC','ptc')],'Actual pipe O.D. / 2 + PTC')
  ];
  if(stage==='stop')return [
    manual(state,'lsLiManualToggle')?row('Lower in',[term('Manual lower in','lsLiManual')]):
      row('Lower in',[term('Line Stop MD','lsMd'),term('Line Stop LD','lsLd',state.lsLd,state.lsLdSign==='-'?'-':'+'),term('Pipe O.D.','pipe-source-od',g.od),term('Wall thickness','',g.wall,'-')]),
    row('Travel margin',[term('Machine travel','lsMachineTravel'),term('Measured travel','lsTravel',state.lsTravel,'-')])
  ];
  if(stage==='plug')return [manual(state,'cpLiManualToggle')?row('Lower in',[term('Manual lower in','cpLiManual')]):
    row('Lower in',[term('Plug Start','cpStart'),term('JBF','cpJbf'),term('Plug LD','cpLd'),term('Plug thickness','cpPt')])];
  return [];
}

export function worksheetMarkup(operation,stage,origins) {
  const rows=worksheetFor(operation,stage);
  if(!rows.length)return '';
  return '<details class="review-worksheet"><summary>Calculation worksheet</summary>'+
    '<p class="result-hint">Current operation and active calculation mode only. Input signs are retained; row operators are shown separately. No field verification is implied.</p>'+
    (stage==='plug'?'<p class="result-hint">General plug calculation only. Pipeline and side-outlet reference methods are separate; plug-family applicability is not verified here.</p>':'')+
    rows.map(row=>'<section class="worksheet-result"><h4>'+escape(row.label)+'</h4>'+
      (row.formula?'<p class="worksheet-formula">'+escape(row.formula)+'</p>':'')+
      '<ol>'+row.terms.map((term,index)=>'<li><span class="worksheet-operator" aria-label="'+(row.formula?'Input':index===0?'Starting value':term.operator==='-'?'Subtract':'Add')+'">'+(row.formula?'':index?escape(term.operator):'=')+'</span><span>'+escape(term.label)+'<small class="value-origin">'+escape(term.key?origins.label(operation,term.key):'Calculated from setup')+'</small></span><strong>'+escape(displayMeasurement(term.value))+'</strong></li>').join('')+'</ol>'+
      '<p class="worksheet-total"><span>'+escape(row.label)+'</span><strong>'+escape(Number.isFinite(row.result)?row.result.toFixed(4)+' in':'Not calculated')+'</strong></p></section>').join('')+'</details>';
}

export function historicalMcoFor(job,operation) {
  const original=job.original;
  if(!original)return undefined;
  const record=original.record||original,saved=original.state||record.state||{};
  const bundle=[record.jobBundle,saved.jobBundle,original.jobBundle,record.state,saved,record]
    .find(value=>Array.isArray(value?.operations)&&value.operations.length);
  const operations=bundle?.operations||[],matches=operations.filter((item,index)=>String(item.id||'operation-'+index)===operation.id);
  const own=matches.length===1?matches[0].measurements?.hotTap?.mco:undefined;
  if(own!=null)return own;
  // A job-level snapshot belongs only to its original selected operation, never every operation.
  if(operations.length>1&&(bundle.selectedOperationId!==operation.id||matches.length!==1))return undefined;
  if(operations.length===1&&matches.length!==1)return undefined;
  if(!operations.length&&operation.id!=='operation-0')return undefined;
  return record.measurements?.hotTap?.mco;
}

export function historicalMcoMarkup(job,operation) {
  const value=historicalMcoFor(job,operation);
  if(value==null)return '';
  return '<details class="review-inactive" data-historical-mco><summary>Historical MCO (not used)</summary>'+
    '<p class="result-hint">Original imported snapshot, retained unchanged. Current MCO is calculated from this operation\'s actual pipe O.D. and PTC, not from this saved value. MCO is not a rod position.</p>'+
    '<dl class="review-list"><div><dt>Historical MCO</dt><dd>'+escape(displayMeasurement(value))+'</dd></div></dl></details>';
}

export function matchingJobs(jobs,query='') {
  const needle=String(query).trim().toLowerCase();
  return jobs.filter(job=>[job.title,job.sharedState.jobClient,job.sharedState.jobLocation,job.sharedState.jobNumber,job.sharedState.jobTechnician,job.sharedState.machineType,...job.operations.flatMap(op=>[op.label,op.operationType,op.state.bcoPipeOD])].join(' ').toLowerCase().includes(needle))
    .sort((a,b)=>String(b.updatedAt||b.savedAt).localeCompare(String(a.updatedAt||a.savedAt)));
}
export function jobRowsMarkup(jobs,source) {
  const label=source==='shared'?'Shared':source==='device'?'Device save':'Pre-Alpha copy';
  return jobs.map(job=>'<article class="job-row"><button class="job-card" data-job="'+escape(job.id)+'"><span class="job-row-heading"><strong>'+escape(job.title)+'</strong><small>'+label+'</small></span><span class="job-row-meta">'+escape([job.sharedState.jobClient,job.sharedState.jobLocation].filter(Boolean).join(' / ')||'Customer and location not recorded')+'</span><span class="job-row-footer">'+job.operations.length+' operation'+(job.operations.length===1?'':'s')+' / '+escape(job.sharedState.jobDate||String(job.savedAt||'').slice(0,10)||'No date')+' <span aria-hidden="true">&rarr;</span></span></button>'+
    '<details class="job-row-details"><summary aria-label="Details for '+escape(job.title)+'">Job details &amp; operations</summary><dl><div><dt>Job number</dt><dd>'+escape(job.sharedState.jobNumber||'Not recorded')+'</dd></div><div><dt>Machine</dt><dd>'+escape(job.sharedState.machineType||'Not recorded')+'</dd></div><div><dt>Technician</dt><dd>'+escape(job.sharedState.jobTechnician||'Not recorded')+'</dd></div></dl><ul>'+job.operations.map(op=>'<li>'+escape(op.label)+' <small>'+escape(op.operationType||'Saved operation')+'</small></li>').join('')+'</ul><p class="result-hint">Opening these details does not load or change the job. Select the job row to open it.</p></details></article>').join('');
}

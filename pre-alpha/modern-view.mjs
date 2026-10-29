import {escape} from './presentation.mjs?v=pre-alpha26';
const json=value=>escape(JSON.stringify(value,null,2));
const metadata=[['Client','client'],['Job description','description'],['Job number','jobNumber'],['Pressure','pressure'],['Temperature','temperature'],['Date','date'],['Product','product'],['Location','location'],['Technician','technician'],['Notes','notes']];
export function modernSnapshotMarkup({item,envelope}){
  const job=item.record.preAlphaCapture.job,captured=item.record.preAlphaCapture.operations;
  return '<p class="eyebrow">SHARED JOB / VIEW ONLY</p><h2>'+escape(job.title)+'</h2><p>Load Job creates a separate working copy on this device. This shared snapshot stays unchanged.</p><p class="result-hint">Captured with '+escape(item.record.meta?.version||'an unrecorded build')+'. Results below are the captured values, not a new calculation.</p>'+
    '<dl class="modern-metadata">'+metadata.map(([label,key])=>'<div><dt>'+label+'</dt><dd>'+escape(item.record.job?.[key]??'Not entered')+'</dd></div>').join('')+'</dl>'+
    job.operations.map((operation,index)=>{
      const result=captured[index],groups=result.results&&typeof result.results==='object'?Object.entries(result.results):[];
      return '<section class="modern-operation" data-modern-operation="'+escape(operation.id)+'"><h3>'+escape(operation.label||'Operation '+(index+1))+'</h3><p>'+escape(operation.workflowType||operation.operationType||'Saved operation')+'</p>'+(result.supported===false?'<p>Saved-only operation. No replacement calculation was made.</p>':'')+
        groups.map(([stage,rows])=>'<h4>'+escape(({tap:'Hot Tap',stop:'Line Stop',plug:'Completion Plug',pipe:'Pipe & cutter',htp:'HTP',hiStop:'Hi-Stop'})[stage]||stage)+'</h4><dl>'+(Array.isArray(rows)?rows:[]).map(row=>'<div><dt>'+escape(row.label)+'</dt><dd>'+escape(row.value===''?'Not calculated':row.value)+(row.value!==''&&['tap','stop','plug','pipe','htp','hiStop'].includes(stage)?' <small>in</small>':'')+'</dd></div>').join('')+'</dl>').join('')+
        '<details><summary>Entered and retained inputs</summary><pre>'+json(operation.state)+'</pre></details>'+
        (operation.measurements?'<details><summary>Historical values — separate from captured results</summary><pre>'+json(operation.measurements)+'</pre></details>':'')+
        '<details><summary>Captured warnings and qualifications</summary><pre>'+json(result.warnings||[])+'</pre></details></section>';
    }).join('')+'<details><summary>Complete preserved snapshot, originals and job data</summary><pre>'+json(item)+'</pre></details>';
}

export function legacySnapshotMarkup({entry,job}){
  const record=entry.record;
  return '<p class="eyebrow">EXISTING SHARED JOB / VIEW ONLY</p><h2>'+escape(job.title)+'</h2><p>These are original saved inputs and values. This view does not recalculate them. Load Job creates a separate working copy using the current calculator.</p>'+
    '<dl class="modern-metadata">'+metadata.map(([label,key])=>'<div><dt>'+label+'</dt><dd>'+escape(record.job?.[key]??'Not entered')+'</dd></div>').join('')+'</dl>'+
    job.operations.map((operation,index)=>'<section class="modern-operation" data-modern-operation="'+escape(operation.id)+'"><h3>'+escape(operation.label||'Operation '+(index+1))+'</h3><p>'+escape(operation.workflowType||operation.operationType||'Saved operation')+'</p><p class="result-hint">Original saved operation. Current calculations appear only in a loaded working copy.</p><details><summary>Entered and retained inputs</summary><pre>'+json(operation.state)+'</pre></details>'+(operation.measurements?'<details><summary>Original operation measurements</summary><pre>'+json(operation.measurements)+'</pre></details>':'')+'</section>').join('')+
    '<details><summary>Original record summary and measurements — attribution as saved</summary><p>Record-level values are retained separately; they are not assigned to every operation.</p><pre>'+json({calculations:record.calculations??{},measurements:record.measurements??{}})+'</pre></details>'+
    '<details><summary>Complete original shared record</summary><pre>'+json(entry)+'</pre></details>';
}

import {escape} from './presentation.mjs?v=pre-alpha23';
const json=value=>escape(JSON.stringify(value,null,2));
const metadata=[['Client','client'],['Job description','description'],['Job number','jobNumber'],['Pressure','pressure'],['Temperature','temperature'],['Date','date'],['Product','product'],['Location','location'],['Technician','technician'],['Notes','notes']];
export function modernSnapshotMarkup({item,envelope}){
  const job=item.record.preAlphaCapture.job,captured=item.record.preAlphaCapture.operations;
  return '<p class="eyebrow">PRIVATE TEAM SNAPSHOT / VIEW ONLY</p><h2>'+escape(job.title)+'</h2><p>This complete snapshot stays unchanged. Make a working copy to edit on this device.</p><p class="result-hint">Captured with '+escape(item.record.meta?.version||'an unrecorded build')+'. Results below are the captured values, not a new calculation.</p>'+
    '<dl class="modern-metadata">'+metadata.map(([label,key])=>'<div><dt>'+label+'</dt><dd>'+escape(item.record.job?.[key]??'Not entered')+'</dd></div>').join('')+'</dl>'+
    job.operations.map((operation,index)=>{
      const result=captured[index],groups=result.results&&typeof result.results==='object'?Object.entries(result.results):[];
      return '<section class="modern-operation" data-modern-operation="'+escape(operation.id)+'"><h3>'+escape(operation.label||'Operation '+(index+1))+'</h3><p>'+escape(operation.workflowType||operation.operationType||'Saved operation')+'</p>'+(result.supported===false?'<p>Saved-only operation. No replacement calculation was made.</p>':'')+
        groups.map(([stage,rows])=>'<h4>'+escape(({tap:'Hot Tap',stop:'Line Stop',plug:'Completion Plug',pipe:'Pipe & cutter',htp:'HTP',hiStop:'Hi-Stop'})[stage]||stage)+'</h4><dl>'+(Array.isArray(rows)?rows:[]).map(row=>'<div><dt>'+escape(row.label)+'</dt><dd>'+escape(row.value===''?'Not calculated':row.value)+(row.value!==''&&['tap','stop','plug','pipe','htp','hiStop'].includes(stage)?' <small>in</small>':'')+'</dd></div>').join('')+'</dl>').join('')+
        '<details><summary>Entered and retained inputs</summary><pre>'+json(operation.state)+'</pre></details>'+
        (operation.measurements?'<details><summary>Historical values — separate from captured results</summary><pre>'+json(operation.measurements)+'</pre></details>':'')+
        '<details><summary>Captured warnings and qualifications</summary><pre>'+json(result.warnings||[])+'</pre></details></section>';
    }).join('')+'<details><summary>Complete preserved snapshot, originals and job data</summary><pre>'+json(item)+'</pre></details><p class="result-hint">Only approved team accounts can open this link. Copies already saved or exported remain on their devices.</p>';
}

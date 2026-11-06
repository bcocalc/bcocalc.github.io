// Read-only cards for the selected HTS-5014 revision; no job/storage mutation.
import {calculatePivotSetup,PIVOT_5014_SOURCE} from './pivot-head-5014.mjs?v=pre-alpha26';
import {inchText} from './measurement-format.mjs?v=pre-alpha26';
const finite=Number.isFinite;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const inches=value=>inchText(value,'Not available');
const row=(label,value)=>'<div><dt>'+escape(label)+'</dt><dd>'+escape(value)+'</dd></div>';
const card=(key,title,value,body)=>'<section class="pivot-result" data-pivot-card="'+key+'"><h3>'+escape(title)+'</h3><p class="pivot-result-value">'+escape(value)+'</p>'+body+'</section>';
export function pivotSetupSummary(values={}) {const result=calculatePivotSetup(values);return {result,held:result.held};}
export function renderPivotSetup(values={}) {
  const r=calculatePivotSetup(values),ready=finite(r.pipeId)&&!r.held;
  const pipe=card('pipe','Pipe I.D.',inches(r.pipeId),'<p>'+(r.measuredIdUsed?'Using your measured I.D. override.':'Selected pipe O.D. − 2 × wall thickness.')+'</p><dl>'+row('Selected pipe O.D.',inches(r.pipeOd))+'</dl>');
  const seals=card('seals','Seal sizes: Pipe I.D. to +1/8 in',ready?inches(r.pipeId)+' to '+inches(r.pipeId+1/8):'Enter valid pipe dimensions',
    '<p><strong>Size comparisons only, not an approved seal tolerance.</strong> Confirm the accepted size and seal material for the actual head and service.</p>'+
    (ready?'<dl class="pivot-seal-options">'+r.seals.map(s=>row(s.label,inches(s.diameter))).join('')+'</dl>':'')+
    (Number(r.pipeSize)>36?'<p class="warning">The supplied conventional seal tables stop at 36 in. Nose/load-pad dimensions for 42–48 in do not establish seal suitability.</p>':'')+
    '<p class="pivot-dimension-note">Exact offset labels distinguish each size. Fractions marked ≈ are rounded to 1/16 in, not tolerances.</p>');
  const loadValue=!r.conventional?'Confirm a conventional pivot head':!ready?'Enter valid pipe dimensions':r.loadPadRequired===false?'Not applicable for 3–4 in conventional heads':r.loadPadRequired===true?inches(r.loadPadTarget):'No listed range for this size';
  const load=card('load-pad','Load-pad radius',loadValue,
    (ready&&r.conventional&&r.loadPadRequired===true?'<dl>'+row('Allowed dimensional range',inches(r.loadPadLow)+' to '+inches(r.loadPadTarget))+'</dl><p>Half Pipe I.D., +0 / −1/16 in. Measure from the nose-piece center to both load-pad edges and the center of the pad.</p>':'')+'<p>Conventional pivot only. Hot Stop / HSSII dimensions are not calculated.</p>');
  const titles={'family-unconfirmed':'Confirm the head / seal family',unavailable:'Nose / backing check unavailable','awaiting-measurement':'Enter the measured nose plate O.D.',below:'STOP: nose O.D. is below range',above:'STOP: nose O.D. is above range',within:'Nose O.D. is within range'};
  const backing=card('backing','Nose plate & backing review',titles[r.status],
    '<dl>'+row('Nose plate O.D. range',finite(r.noseLow)?inches(r.noseLow)+' to '+inches(r.noseHigh):'Not available')+
    row('Backing plate required / O.D.','Not determined; obtain the plate specification')+'</dl><p>'+escape(r.backingStatus)+'</p>'+
    (r.conventional?'<p>HTS-5014 says a 0.063 in (14-gauge) aluminum backing plate may be required, except for Fluorogreen. For an out-of-tolerance nose plate, it directs Technical Support review for plate dimensions. Use the applicable approved plate specification.</p>':'')+
    '<p>Dimensional comparison only. Pressure, temperature and service suitability are not checked.</p>');
  return '<section class="pivot-setup" aria-labelledby="pivot-setup-title"><h2 id="pivot-setup-title">Your Pivot Head setup</h2><p class="result-hint">Conventional pivot only, excluding HSSII, Hot Stops and Fluorogreen. Confirm the physical equipment and approved procedure before use.</p>'+
    (r.familyIssue?'<p class="warning" role="status">'+escape(r.familyIssue)+'</p>':'')+
    '<div class="pivot-results">'+pipe+seals+load+backing+'</div><p class="pivot-source-note">Basis: '+escape(PIVOT_5014_SOURCE.document+', '+PIVOT_5014_SOURCE.revision+'. '+PIVOT_5014_SOURCE.dimensions)+'; seal notes: pages 2 and 4. Supplied revision, not verification of the latest controlled procedure. Seal acceptance wording needs confirmation; the displayed sizes are comparisons.</p></section>';
}

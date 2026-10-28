import {ETA_MACHINES,etaFor,formatEta} from './eta.mjs?v=pre-alpha23';
import {number} from './model.mjs?v=pre-alpha23';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Presentation only: every estimate still comes from the existing etaFor calculation.
export function etaPresentation(operation,machineName='') {
  const eta=etaFor(operation,machineName);
  const speeds=eta.rpm.filter(value=>Number.isFinite(value)&&value>0).map(value=>value*eta.feedRate);
  const chartBasis=eta.match.basis==='interpolated'?'Interpolated between chart sizes '+eta.match.sizes.join(' and '):eta.match.basis==='nearest'?'Outside chart range: nearest chart size '+eta.match.sizes[0]:eta.match.basis==='exact'?'Exact chart size':'No matching RPM chart';
  const retainedStandard=['etaBco','etaMachine','etaCutterSize','etaRpmOverride'].some(key=>String(operation.state[key]??'').trim());
  const savedNote=eta.family==='htp'?retainedStandard?'Standard Hot Tap ETA overrides are retained but not used for HTP. HTP uses its exact chart cutter, chart BCO and separate RPM profile.':'':eta.family==='hiStop'?retainedStandard?'Standard Hot Tap ETA settings are retained but not used for Hi-Stop.':'':String(operation.state.etaBco??'').trim()&&number(operation.state.etaBco)!==eta.distance?'Saved ETA distance '+operation.state.etaBco+' is retained but not used. This estimate follows current Pipe & cutter BCO.':'';
  return {eta,
    time:eta.issue?'Not calculated':formatEta(eta.lowMinutes)+(eta.lowMinutes===eta.highMinutes?'':' to '+formatEta(eta.highMinutes)),
    distance:Number.isFinite(eta.distance)?eta.distance.toFixed(4)+' in':'Not calculated',
    rpm:eta.rpm.map(value=>Number.isFinite(value)?String(value):'invalid').join(' / ')||'Not available',
    chartRpm:eta.match.values.join(' / ')||'Not available',
    profile:ETA_MACHINES[eta.profile]||'No supported chart',
    chartBasis,
    feed:speeds.length?Math.min(...speeds).toFixed(3)+(Math.min(...speeds)===Math.max(...speeds)?'':' - '+Math.max(...speeds).toFixed(3))+' in/min':'Not calculated',
    savedNote
  };
}

export function etaResultPanel(operation,machineName='',{primary=false,secondary=[]}={}) {
  const view=etaPresentation(operation,machineName),{eta}=view;
  if(eta.family==='hiStop')return '<section class="eta-scope"><p class="result-hint">'+escape(eta.issue)+'</p></section>';
  if(eta.family==='htp')return '<section class="bco-eta-summary" aria-label="HTP chart cutting estimate" data-help-context="htp"><div class="result-panel bco-eta-panel"><h3>HTP cutting estimate</h3><dl class="review-results">'+
    [['Chart BCO',view.distance],['Chart cutter',Number.isFinite(number(eta.size))?number(eta.size).toFixed(3)+' in':'Not calculated'],['Chart RPM',view.chartRpm],['Feed speed',view.feed],['Cutting ETA to chart BCO',view.time]].map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd>'+escape(value)+'</dd></div>').join('')+'</dl></div>'+
    '<p class="result-hint"><strong>HTP RPM profile:</strong> '+escape(view.profile)+' ('+(operation.state.htpMachine==null?'legacy HTP default 360; not entered':'separate HTP profile selection')+'). <strong>RPM lookup:</strong> '+escape(view.chartBasis)+'.</p>'+
    '<p class="result-hint">Uses only the exact HTP row cutter and chart BCO, with the existing 0.0040 in/revolution feed assumption. This is cutting-only ETA, not TCO travel or complete job duration. Equipment applicability is not verified.</p>'+
    (eta.issue?'<p class="warning">'+escape(eta.issue)+'</p>':'')+(eta.match.basis==='nearest'?'<p class="warning">Nearest charted RPM size is used outside the profile range. Confirm the equipment speed chart.</p>':'')+
    (view.savedNote?'<p class="result-hint">'+escape(view.savedNote)+'</p>':'')+'<button class="eta-settings" data-open-eta>Edit HTP RPM profile</button></section>';
  const lookupOverride=String(operation.state.etaCutterSize??'').trim()!=='';
  const profileSource=operation.state.etaMachine==null?'follows job machine':'saved profile selection';
  const metric=(label,value,key,className='')=>'<div><dt class="eyebrow">'+label+'</dt><dd data-eta-value="'+key+'" class="'+className+'">'+value+'</dd></div>';
  const bco=Number.isFinite(eta.distance)?eta.distance.toFixed(4)+' <small>in</small>':'-- <small>Not calculated</small>';
  const warnings=[eta.issue,eta.manual?'Manual RPM override is active for ETA. Verify the speed and cutting conditions.':'',eta.match.basis==='nearest'?'The chart recommendation uses the nearest charted cutter size because this size is outside the selected RPM chart. Confirm the equipment speed chart.':''].filter(Boolean);
  return '<section class="bco-eta-summary" aria-label="BCO and Hot Tap cutting estimate" data-help-context="eta"><div class="result-panel bco-eta-panel"><dl class="bco-eta-metrics">'+
    metric('BCO',bco,'bco',primary?'big-value':'eta-bco-value')+
    metric('Recommended RPM <span>(chart)</span>',escape(view.chartRpm),'chart-rpm')+
    metric('Cutting ETA <span>to BCO</span>',escape(view.time),'time','eta-time')+'</dl>'+
    (secondary.length?'<div class="result-subgrid">'+secondary.map(([label,value])=>'<div><span>'+escape(label)+'</span><strong>'+(Number.isFinite(value)?value.toFixed(4):'--')+' <small>in</small></strong></div>').join('')+'</div>':'')+
    '<div class="eta-assumptions"><p><strong>Machine:</strong> '+escape(machineName||'Not selected')+' · <strong>RPM chart profile:</strong> '+escape(view.profile)+' ('+profileSource+').</p>'+
    '<p data-eta-basis><strong>Chart source:</strong> '+escape(view.chartBasis)+'. <strong>RPM lookup cutter size:</strong> '+escape(eta.size||'Not entered')+' in ('+(lookupOverride?'saved lookup override':'follows cutter O.D.')+').</p>'+
    '<p><strong>ETA RPM used:</strong> <span data-eta-value="used-rpm">'+escape(view.rpm)+'</span> ('+(eta.manual?'manual override; chart above is reference only':'chart')+'). <strong>Feed speed:</strong> '+escape(view.feed)+'.</p>'+
    '<p><strong>Feed assumption:</strong> '+eta.feedRate.toFixed(4)+' in/revolution, copied from the existing estimator.</p></div></div>'+
    warnings.map(warning=>'<p class="warning">'+escape(warning)+'</p>').join('')+
    '<p class="result-hint eta-scope">Estimated cutting motion from cutter on pipe to cutter-shell BCO only (not Rod BCO or total travel). Not complete Hot Tap, Line Stop, Completion Plug, or job duration. Confirm actual cutting conditions and applicable equipment instructions; this is not a verified speed or duration guarantee.</p>'+
    (view.savedNote?'<p class="result-hint">'+escape(view.savedNote)+'</p>':'')+
    '<button class="eta-settings" data-open-eta data-eta-settings>Edit ETA assumptions</button></section>';
}

export function etaSummary(operation,machineName) {
  return '<section class="review-stage eta-summary"><h3>'+ (etaFor(operation,machineName).family==='htp'?'HTP':'Hot Tap')+' cutting estimate</h3>'+etaResultPanel(operation,machineName)+'</section>';
}

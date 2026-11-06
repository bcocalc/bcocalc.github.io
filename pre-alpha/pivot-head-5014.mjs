// Scoped conventional-pivot reference, separate from retained legacy helpers.
// No job/storage writes. Dimensions are comparisons, never setup approval.
import {TRUE_OD} from './pipe-data.mjs?v=pre-alpha26';
import {parseHelperMeasurement} from './reference-helpers.mjs?v=pre-alpha26';
import {inchText,FRACTION_NOTE} from './measurement-format.mjs?v=pre-alpha26';

export const PIVOT_5014_SOURCE={document:'HTS-5014 — Sealing Element and Nose Plate Guidelines',revision:'Rev. 2, July 29, 2025',dimensions:'Section 10, pages 9–10',seals:'Seal notes, pages 2 and 4'};
export const PIVOT_5014_NOTES=[
  'Basis: HTS-5014, Sealing Element and Nose Plate Guidelines, Rev. 2, July 29, 2025; nose and load pad: Section 10, pages 9–10. Supplied revision, not verification of the latest controlled procedure.',
  'Conventional pivot heads only, excluding HSSII, Hot Stops and Fluorogreen. Confirm the actual head, seal material, pipeline service, temperature and pressure rating before use. Dimensional fit is not equipment or setup approval.',
  'Seal sizes from Pipe I.D. through +1/8 in are arithmetic comparisons requested for selection, not an approved tolerance range. The seal notes on pages 2 and 4 combine minimum wording with +1/16 / −0 tolerance notation; confirm acceptance with the applicable controlled procedure and HTS Technical Support. No negative seal offset or +1/8 acceptance is inferred.',
  'Nose O.D. ranges: nominal 3–4 in, I.D. minus 1/4 through minus 1/8; 6–12 in, minus 5/8 through minus 1/2; 14–48 in, minus 3/4 through minus 1/2. These deductions are diametral, not per-side clearances. The table has no 500 psi split and does not establish pressure suitability.',
  'Load-pad radius: half Pipe I.D., +0 / −1/16 in. Measure from the nose-piece center to both load-pad edges and the center of the pad. Page 10 shows no load-pad radius for 3–4 in conventional heads, and a radius for 6–48 in conventional heads, excluding Hot Stops.',
  'For a nose plate outside the indicated tolerance, HTS-5014 directs contact with HTS Technical Support for plate dimensions. It mentions a 0.063 in (14-gauge) aluminum backing plate may be required, except for Fluorogreen. It supplies no automatic conventional backing-plate O.D. formula or universal required/not-required decision.',
  'The conventional pivot seal pressure tables cover nominal 3–36 in. Nose-dimensional coverage through 48 in is not evidence of seal pressure/temperature suitability for 42–48 in equipment. HSSII/Hot Stop rules are separate and are not calculated here.'
];
const finite=Number.isFinite;
const inches=n=>inchText(n,'Not available');
const positiveFields={wall:'Wall thickness',measuredId:'Measured I.D.',measuredNose:'Measured nose plate O.D.'};
const table=(title,columns,rows)=>({title,columns,rows});

export function calculatePivotSetup(values={}) {
  const issues=[],parsed={};
  for(const [key,label] of Object.entries(positiveFields)) {
    const raw=String(values[key]??'').trim(),n=parseHelperMeasurement(raw);parsed[key]=n;
    if(raw&&(!finite(n)||n<=0))issues.push(label+': enter a complete positive decimal or fraction.');
  }
  const material=values.material||'CarbonSteel',pipeSize=values.pipeSize||'3.0',nominal=Number(pipeSize),pipeOd=TRUE_OD[material]?.[pipeSize];
  if(!finite(pipeOd))issues.push('Select a listed material and nominal pipe size; no nearest-size substitution.');
  const {wall,measuredId,measuredNose}=parsed;
  const calculatedId=finite(pipeOd)&&finite(wall)?pipeOd-2*wall:NaN;
  if(finite(calculatedId)&&calculatedId<=0)issues.push('Wall thickness leaves no positive calculated Pipe I.D.');
  if(finite(measuredId)&&finite(pipeOd)&&measuredId>=pipeOd)issues.push('Measured Pipe I.D. must be smaller than Pipe O.D.');
  if(!finite(wall)&&!finite(measuredId)&&!issues.length)issues.push('Enter wall thickness or a measured I.D. override.');
  const pipeId=issues.length?NaN:finite(measuredId)?measuredId:calculatedId;
  const headType=values.headType||'',conventional=headType==='conventional';
  const familyIssue=!headType?'Confirm the head / seal family to show procedure dimensions.':!conventional?'HSSII, Hot Stop, Fluorogreen and other head/seal families are not supported by this helper.':'';
  let underMin=NaN,underMax=NaN,loadPadRequired=null;
  if(conventional) {
    if(nominal>=3&&nominal<=4){underMin=1/8;underMax=1/4;loadPadRequired=false;}
    else if(nominal>=6&&nominal<=12){underMin=1/2;underMax=5/8;loadPadRequired=true;}
    else if(nominal>=14&&nominal<=48){underMin=1/2;underMax=3/4;loadPadRequired=true;}
    else issues.push('No conventional nose/load-pad range is listed for this nominal size. Do not extrapolate.');
  }
  let noseLow=finite(pipeId)&&finite(underMax)?pipeId-underMax:NaN,noseHigh=finite(pipeId)&&finite(underMin)?pipeId-underMin:NaN;
  let loadPadTarget=finite(pipeId)&&loadPadRequired===true?pipeId/2:NaN,loadPadLow=finite(loadPadTarget)?loadPadTarget-1/16:NaN;
  const held=finite(pipeId)&&((finite(noseLow)&&noseLow<=0)||(finite(loadPadLow)&&loadPadLow<=0));
  if(held){issues.push('Setup dimensions held: Pipe I.D. produces a nonpositive procedure dimension. Verify measurements and applicability.');noseLow=noseHigh=loadPadTarget=loadPadLow=NaN;}
  const status=!conventional?'family-unconfirmed':!finite(noseLow)||!finite(noseHigh)?'unavailable':!finite(measuredNose)?'awaiting-measurement':measuredNose<noseLow?'below':measuredNose>noseHigh?'above':'within';
  const backingStatus={
    'family-unconfirmed':familyIssue,
    unavailable:'Nose comparison unavailable. Confirm dimensions and the applicable procedure.',
    'awaiting-measurement':'Enter the actual nose plate O.D. to compare with the procedure range.',
    below:'STOP: measured nose plate O.D. is below the procedure range. Contact HTS Technical Support for plate dimensions.',
    above:'STOP: measured nose plate O.D. is above the procedure range. Contact HTS Technical Support for plate dimensions.',
    within:'Measured nose plate O.D. is within the dimensional range. This alone does not determine whether a backing plate is required or approve the setup.'
  }[status];
  const offsets=[[0,'Exact Pipe I.D.'],[1/16,'+1/16 in'],[1/8,'+1/8 in']];
  return {issues,familyIssue,material,pipeSize,pipeOd,calculatedId,pipeId,measuredIdUsed:finite(measuredId),measuredNose,headType,conventional,held,
    loadPadRequired,loadPadTarget,loadPadLow,underMin,underMax,noseLow,noseHigh,status,backingStatus,backingRequired:null,backingOd:NaN,
    seals:finite(pipeId)&&!held?offsets.map(([offset,label])=>({offset,label,diameter:pipeId+offset})):[]};
}

export function pivotSetupFields(values={}) {
  return [
    {key:'headType',label:'Head / seal family',options:[['','Confirm head / seal family'],['conventional','Conventional pivot, not Hot Stop / Fluorogreen'],['hotstop','HSSII / Hot Stop / Fluorogreen (not supported)'],['other','Other / not confirmed']]},
    {key:'material',label:'Pipe material',options:[['CarbonSteel','Carbon steel'],['DuctileIron','Ductile iron']]},
    {key:'pipeSize',label:'Nominal pipe size',options:Object.entries(TRUE_OD[values.material||'CarbonSteel']||{}).map(([key,od])=>[key,key+' in ('+od+' in O.D.)'])},
    {key:'wall',label:'Wall thickness (in)'},{key:'measuredId',label:'Measured I.D. override (in, optional)'},{key:'measuredNose',label:'Measured nose plate O.D. (in, optional)'}
  ];
}

export function pivotSetupReference(values={}) {
  const r=calculatePivotSetup(values),available=finite(r.pipeId)&&!r.held;
  return {note:'Read-only reference helper. These comparisons do not change job measurements and are not setup approval. '+FRACTION_NOTE,
    issue:r.issues.join(' '),tables:available?[
      table('Conventional pivot dimensions',['Reference output','Value'],[
        ['Pipe O.D.',inches(r.pipeOd)],['Pipe I.D.',inches(r.pipeId)],
        ['Nose plate O.D. range',finite(r.noseLow)?inches(r.noseLow)+' to '+inches(r.noseHigh):'Not available'],
        ['Measured nose plate O.D.',inches(r.measuredNose)],
        ['Load-pad radius',r.loadPadRequired===false?'Not applicable for this conventional 3–4 in head':inches(r.loadPadTarget)],
        ['Load-pad radius range',finite(r.loadPadLow)?inches(r.loadPadLow)+' to '+inches(r.loadPadTarget):'Not available'],
        ['Backing plate required / O.D.','Not determined; obtain the applicable plate specification']
      ]),table('Seal size comparisons only',['Offset from I.D.','Diameter'],r.seals.map(s=>[s.label,inches(s.diameter)]))
    ]:[],lists:[{title:'Nose / backing review',items:[r.backingStatus]},{title:'Source and limitations',items:PIVOT_5014_NOTES}]};
}

// Read-only helpers migrated from established TapCalc sources at 3caf01f.
// No storage, job mutation, cloud transport, or generic Hot Tap fallback.
import {TRUE_OD} from './pipe-data.mjs?v=pre-alpha16';

const REFERENCE_NOTE = 'Read-only reference helper. Confirm the source, physical equipment, and approved procedure before use. Results do not change job measurements and are not setup approval.';
const finite = Number.isFinite;
const all = (...values) => values.every(finite);
const root = value => finite(value) && value >= 0 ? Math.sqrt(value) : NaN;
const blank = value => !String(value ?? '').trim();
const inches = value => finite(value) ? value.toFixed(4) + ' in' : 'Not available';
const table = (title, columns, rows) => ({title, columns, rows});
const pairs = (title, rows) => table(title, ['Reference output', 'Value'], rows);

// Established U-Wire syntax includes quoted inches and hyphenated mixed numbers.
export function parseHelperMeasurement(value) {
  let raw = String(value ?? '').trim();
  // Accept one optional terminal inch mark, never remove embedded characters.
  if (raw.endsWith('"')) raw = raw.slice(0, -1).trimEnd();
  if (raw.includes('"')) return NaN;
  if (!raw) return NaN;
  if (/^-?\d*\.?\d+$/.test(raw)) return finite(Number(raw)) ? Number(raw) : NaN;
  const mixed = raw.match(/^(-?\d+)(?:\s+|-)(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    return denominator ? (mixed[1].startsWith('-') ? -1 : 1) * (Math.abs(Number(mixed[1])) + Number(mixed[2]) / denominator) : NaN;
  }
  const fraction = raw.match(/^(-?\d+)\/(\d+)$/);
  return fraction && Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : NaN;
}

function parseFields(values, labels, {signed = [], zero = []} = {}) {
  const parsed = {}, issues = [];
  for (const [key, label] of Object.entries(labels)) {
    const n = parseHelperMeasurement(values[key]);
    parsed[key] = n;
    if (blank(values[key])) continue;
    if (!finite(n)) issues.push(label + ': enter a complete decimal or fraction.');
    else if (!signed.includes(key) && (zero.includes(key) ? n < 0 : n <= 0)) issues.push(label + (zero.includes(key) ? ' cannot be negative.' : ' must be greater than zero.'));
  }
  return {parsed, issues};
}

export const WIRE_ROWS = 12;
export const WIRE_SIZES = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 30, 36, 42, 48, 54, 60, 72];
export const VALVE_NEST_TABLE = {
    Gate: {
      '150#': [[3, 3.5], [4, 3.875], [5, null], [6, 4.125], [8, 4.5], [10, 5], [12, 5.625], [14, 5.375], [16, 6], [18, 6.5], [20, 6.75], [22, null], [24, 7.5], [26, null], [30, 9.5], [36, 10.5], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '300#': [[3, 4], [4, 4.5], [5, null], [6, 5], [8, 6], [10, 7], [12, 9], [14, 11], [16, 13], [18, 15], [20, 16], [22, null], [24, 17], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '600#': [[3, 6.125], [4, 7.125], [5, null], [6, 9.25], [8, 11.875], [10, 13.25], [12, 14.625], [14, 15.25], [16, 16.5], [18, 19.25], [20, 20.375], [22, null], [24, 21.625], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '900#': WIRE_SIZES.map((size) => [size, null])
    },
    Ball: {
      '150#': [[3, 3.5], [4, 3.875], [5, null], [6, 4.125], [8, 4.5], [10, 5], [12, 5.625], [14, 5.375], [16, 6], [18, 6.5], [20, 6.75], [22, null], [24, 7.5], [26, null], [30, 9.5], [36, 10.5], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '300#': [[3, 4], [4, 4.5], [5, null], [6, 5], [8, 6], [10, 7], [12, 9], [14, 11], [16, 13], [18, 15], [20, 16], [22, null], [24, 17], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '600#': [[3, 6.125], [4, 7.125], [5, null], [6, 9.25], [8, 11.875], [10, 13.25], [12, 14.625], [14, 15.25], [16, 16.5], [18, 19.25], [20, 20.375], [22, null], [24, 21.625], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '900#': WIRE_SIZES.map((size) => [size, null])
    },
    Williamson: {
      '150#': [[3, 1.688], [4, 1.625], [5, null], [6, 1.625], [8, 1.875], [10, 1.875], [12, 1.875], [14, 2.167], [16, 2], [18, 2.583], [20, 2.542], [22, null], [24, 3.458], [26, null], [30, 3.542], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '300#': [[3, null], [4, 1.417], [5, null], [6, 1.833], [8, 1.958], [10, 2.333], [12, 2.542], [14, 2.583], [16, null], [18, 3.375], [20, 3.542], [22, 3.542], [24, 4.25], [26, null], [30, 5.479], [36, 6.521], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '600#': [[3, null], [4, 1.75], [5, null], [6, 2.25], [8, 2.25], [10, 2.667], [12, 3.375], [14, 3.542], [16, 3.917], [18, 4.438], [20, 4.583], [22, 4.583], [24, 4.625], [26, 5.417], [30, 5.917], [36, 8.5], [42, 7.5], [48, 7.521], [54, null], [60, null], [72, null]],
      '900#': WIRE_SIZES.map((size) => [size, null])
    },
    'M&J/Burtech': {
      '150#': [[3, 1.375], [4, 1.375], [5, null], [6, 1.625], [8, 1.625], [10, 2.188], [12, 2.188], [14, null], [16, null], [18, null], [20, null], [22, null], [24, null], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '300#': WIRE_SIZES.map((size) => [size, null]),
      '600#': [[3, null], [4, 2.75], [5, null], [6, 2.75], [8, 3.25], [10, 3.25], [12, 3.25], [14, null], [16, 4], [18, null], [20, 4.5], [22, null], [24, 4.5], [26, null], [30, 6], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '900#': WIRE_SIZES.map((size) => [size, null])
    },
    ENR: {
      '150#': [[3, null], [4, null], [5, null], [6, null], [8, 1.5], [10, null], [12, null], [14, null], [16, null], [18, null], [20, null], [22, null], [24, null], [26, null], [30, null], [36, null], [42, null], [48, null], [54, null], [60, null], [72, null]],
      '300#': WIRE_SIZES.map((size) => [size, null]),
      '600#': WIRE_SIZES.map((size) => [size, null]),
      '900#': WIRE_SIZES.map((size) => [size, null])
    }
  };

export const PIVOT_NOTES = [
  'Sources: Line Stop Equipment Set Up guide and Section 7 Line Stop Dims, Rev.1; migrated from measurement.js / measurement-card.html.',
  'Conventional pivot head only. Verify material compatibility, temperature, pressure class, and sealing-element condition.',
  'Seal leading-edge guide: Pipe I.D. minus 1/16 in through Pipe I.D. plus 1/16 in. The additional +3/32 and +1/8 in rows are field-check-only, not guide tolerance.',
  'Load pad target: half Pipe I.D., +0.00 / -1/16 in. No load pad required for 3- and 4-inch heads.',
  '14–36-inch nose targets distinguish below 500 psi from above 500 psi. The source does not define exactly 500 psi; do not choose a band by assumption.',
  'Nose plate targets are listed only for 3–4, 6–12, and 14–36-inch nominal sizes. Other displayed seal/load-pad/Clearance B comparisons do not establish that a larger head is supported; no nose or backing-plate target is inferred outside the listed nose ranges.',
  'If the measured nose plate does not meet the listed target, stop and obtain Technical Support review. Section 7 notes a 3/16–1/4 in thick aluminum backing plate may be needed. A backing plate does not correct an oversized nose plate.'
];

export function calculatePivotHead(values = {}) {
  const material = values.material || 'CarbonSteel';
  const pipeSize = values.pipeSize || '3.0';
  const pipeOd = TRUE_OD[material]?.[pipeSize];
  const nominal = Number(pipeSize);
  const {parsed, issues} = parseFields(values, {wall:'Wall thickness', measuredId:'Measured I.D.', measuredNose:'Measured nose plate O.D.'});
  const {wall, measuredId, measuredNose} = parsed;
  if (!finite(pipeOd)) issues.push('Select a listed material and nominal pipe size; no nearest-size substitution.');
  const calculatedId = all(pipeOd, wall) ? pipeOd - 2 * wall : NaN;
  if (finite(calculatedId) && calculatedId <= 0) issues.push('Wall thickness leaves no positive calculated Pipe I.D.');
  if (all(measuredId, pipeOd) && measuredId >= pipeOd) issues.push('Measured Pipe I.D. must be smaller than Pipe O.D.');
  if (!finite(wall) && !finite(measuredId) && !issues.length) issues.push('Enter wall thickness or a measured I.D. override.');
  const pipeId = issues.length ? NaN : finite(measuredId) ? measuredId : calculatedId;
  const loadPadRequired = finite(nominal) && nominal > 4;
  const loadPadTarget = finite(pipeId) && loadPadRequired ? pipeId / 2 : NaN;
  const loadPadLow = finite(loadPadTarget) ? loadPadTarget - 1 / 16 : NaN;
  const pressureBand = values.pressureBand || '';
  let underId = NaN;
  if (nominal >= 3 && nominal <= 4) underId = 7 / 16;
  else if (nominal >= 6 && nominal <= 12) underId = 1 / 2;
  else if (nominal >= 14 && nominal <= 36) {
    if (pressureBand === 'over500') underId = 5 / 8;
    else if (pressureBand === 'under500') underId = 3 / 4;
    else issues.push('Nose plate target held: confirm a source-listed pressure band. Exactly 500 psi is not defined by this source.');
  }
  else issues.push('Nose plate target not listed for this nominal size. Nose and backing-plate outputs are unavailable; other source comparison dimensions are not confirmation of equipment applicability.');
  const noseTarget = all(pipeId, underId) ? pipeId - underId : NaN;
  const clearanceB = nominal >= 3 && nominal <= 12 ? '1/4 to 1/2 in' : nominal >= 14 ? '3/8 to 9/16 in' : 'Not listed';
  let backingStatus = 'Select a listed nose target and enter the actual nose plate O.D. for this check.';
  let diameterAdd = NaN, perSideAdd = NaN, measuredUnder = NaN;
  if (all(pipeId, measuredNose, noseTarget)) {
    measuredUnder = pipeId - measuredNose;
    if (measuredNose < noseTarget) {
      diameterAdd = noseTarget - measuredNose; perSideAdd = diameterAdd / 2;
      backingStatus = 'STOP / Technical Support review: undersized nose plate. The additions below are source comparison dimensions, not fabrication authorization.';
    } else if (measuredNose > noseTarget) {
      backingStatus = 'STOP: oversized nose plate by ' + inches(measuredNose - noseTarget) + '. A backing plate will not correct oversize; verify Pipe I.D. and plate selection.';
    } else {
      diameterAdd = 0; perSideAdd = 0;
      backingStatus = 'Measured nose plate matches the source target. This comparison alone is not setup approval.';
    }
  }
  const offsets = [
    [-1/16, '-1/16 in', 'Section 7 Rev.1 minimum'],[-1/32, '-1/32 in', 'Within guide tolerance'],[0, 'Exact Pipe I.D.', 'Center of guide range'],
    [1/32, '+1/32 in', 'Within guide tolerance'],[1/16, '+1/16 in', 'Section 7 Rev.1 maximum'],[3/32, '+3/32 in', 'Field-check only'],[1/8, '+1/8 in', 'Field-check upper only']
  ];
  return {issues, material, pipeSize, pipeOd, calculatedId, pipeId, measuredIdUsed:finite(measuredId), loadPadRequired, loadPadTarget, loadPadLow,
    sealGuideLow:finite(pipeId)?pipeId-1/16:NaN, sealGuideHigh:finite(pipeId)?pipeId+1/16:NaN, sealFieldHigh:finite(pipeId)?pipeId+1/8:NaN,
    underId, noseTarget, clearanceB, diameterAdd, perSideAdd, measuredUnder, backingStatus,
    seals:finite(pipeId)?offsets.map(([offset,label,status])=>({offset,label,diameter:pipeId+offset,status})):[]};
}

export const FOLDING_NOTES = [
  'Source: Level III / 1- Folding Head Line Stops.pdf, measurement slides pages 13–14; migrated from dev/overlays/tapcalc-folding-head-reference.js.',
  'Set Point = MD +/- LD + POD - one wall thickness. When used, the start number on the bar is added to the set point.',
  'Confirm the LD sign and valve gate clearance before use. This helper is specific to Folding Head; it is not a generic Line Stop or Hot Tap fallback.'
];

export function calculateFoldingHead(values = {}) {
  const {parsed, issues} = parseFields(values, {md:'MD',ld:'LD',pod:'Pipe O.D.',wall:'Wall thickness',start:'Start number'}, {signed:['md','ld','start']});
  const {md,ld,pod,wall,start} = parsed;
  const missing = Object.entries({md,ld,pod,wall}).filter(([,n])=>!finite(n)).map(([key])=>({md:'MD',ld:'LD',pod:'POD',wall:'wall'}[key]));
  if (all(pod,wall) && 2*wall >= pod) issues.push('Wall thickness must leave a positive Pipe I.D.');
  if (values.ldSign && !['add','subtract'].includes(values.ldSign)) issues.push('Select Add LD or Subtract LD.');
  const setPoint = !issues.length && !missing.length ? md + (values.ldSign === 'subtract' ? -ld : ld) + pod - wall : NaN;
  return {issues, missing, setPoint, barTarget:all(setPoint,start)?setPoint+start:NaN};
}

export const UWIRE_NOTES = [
  'Source: U-Wire Placement Calculator, Form HTS-5400.1.20 Rev.3, as implemented in measurement.js / measurement-card.html. Verify against the approved form and equipment before the cut.',
  'Final U-wire threshold = Coupon Free - one wall thickness + PTC - 0.094 in. Each measured row must be strictly less than the threshold; equality is No Go.',
  'The source calls for two measured rows on cutters at least 3 inches. Its legacy engagement indication uses row 2 for those cutters; that indication does not establish row 1 or the entire setup is acceptable.',
  'If Contact Reliability For Approval appears, stop and get approval before relying on the setup. Confirm valve bore, flange class, and valve nest against the physical valve.',
  'Unlisted valve-nest cells remain unlisted. No interpolation or nearest-size substitution is made. Estimated tap time is this source worksheet’s tap-distance calculation, not the job ETA.'
];

const UWIRE_LABELS = {pipeOd:'Pipe O.D.',wall:'Pipe wall',cutterOd:'Cutter O.D.',toothWidth:'Tooth width',ptc:'PTC',cutterDepth:'Cutter depth',machineTravel:'Machine travel',lostDistance:'Lost distance',fittingLength:'Fitting length',valveLength:'Valve length',pilotRelief:'Pilot relief',labattsBridge:"Labatt’s Bridge",rpm:'RPM',feedRate:'Feed rate (in/revolution)'};

export function lookupValveNest(valveType, flangeClass, size) {
  const match = VALVE_NEST_TABLE[valveType]?.[flangeClass]?.find(row=>row[0]===size);
  return finite(match?.[1]) ? match[1] : NaN;
}

export function calculateUwire(values = {}) {
  const {parsed, issues} = parseFields(values, UWIRE_LABELS, {signed:['lostDistance'],zero:['labattsBridge']});
  const {pipeOd,wall,cutterOd,toothWidth,ptc,cutterDepth,machineTravel,lostDistance,fittingLength,valveLength,pilotRelief,labattsBridge,rpm,feedRate} = parsed;
  const missing = ['pipeOd','wall','cutterOd','toothWidth','ptc'].filter(key=>!finite(parsed[key])).map(key=>UWIRE_LABELS[key]);
  const valveType=values.valveType||'Gate', flangeClass=values.flangeClass||'150#', valveSize=parseHelperMeasurement(values.valveSize);
  if (!Object.hasOwn(VALVE_NEST_TABLE,valveType)) issues.push('Select a listed valve type.');
  if (!Object.hasOwn(VALVE_NEST_TABLE[valveType]||{},flangeClass)) issues.push('Select a listed flange class.');
  if (!blank(values.valveSize)&&!WIRE_SIZES.includes(valveSize)) issues.push('Select a listed valve / flange size.');
  if (all(pipeOd,wall)&&pipeOd-2*wall<=0) issues.push('Wall thickness must leave a positive Pipe I.D.');
  if (all(cutterOd,toothWidth)&&cutterOd-2*toothWidth<=0) issues.push('Tooth width must leave a positive Cutter I.D.');
  // Invalid entered values hold calculated outputs; missing independent inputs remain unavailable.
  const can=(...numbers)=>!issues.length&&all(...numbers);
  const pipeId=can(pipeOd,wall)?pipeOd-2*wall:NaN;
  const cutterId=can(cutterOd,toothWidth)?cutterOd-2*toothWidth:NaN;
  const couponFree=can(pipeOd,pipeId,cutterId)?pipeOd/2-root((pipeId/2)**2-(cutterId/2)**2):NaN;
  const tapDistanceBase=can(pipeOd,pipeId,cutterOd)?pipeOd/2-root((pipeId/2)**2-(cutterOd/2)**2):NaN;
  const tapDistance=can(pipeOd,pipeId,cutterOd)&&cutterOd>pipeId?pipeOd/2:tapDistanceBase;
  const maxCutout=can(pipeOd,wall,ptc)?pipeOd/2-wall+ptc:NaN;
  const couponMinusWall=can(couponFree,wall)?couponFree-wall:NaN;
  const totalTravel=can(lostDistance,fittingLength,valveLength,tapDistance)?lostDistance+fittingLength+valveLength+tapDistance:NaN;
  const maxCutoutTravel=can(lostDistance,fittingLength,valveLength,tapDistance,maxCutout)?lostDistance+fittingLength+valveLength+tapDistance+maxCutout:NaN;
  const valveNest=!issues.length?lookupValveNest(valveType,flangeClass,valveSize):NaN;
  const estimatedTapTime=can(tapDistance,feedRate,rpm)&&feedRate>0&&rpm>0?tapDistance/(feedRate*rpm)/60:NaN;
  const threshold=can(ptc,couponMinusWall)?ptc+couponMinusWall-0.094:NaN;
  const wires=Array.from({length:WIRE_ROWS},(_,i)=>{
    const raw=values['wire'+(i+1)]??values.wires?.[i]??'', measured=parseHelperMeasurement(raw);
    return {row:i+1,measured,entered:!blank(raw),status:blank(raw)?'Waiting':!finite(measured)||measured<=0?'Invalid measurement':!finite(threshold)?'Need setup':measured<threshold?'Good':'No Go'};
  });
  const enteredCount=wires.filter(w=>finite(w.measured)&&w.measured>0).length,goodCount=wires.filter(w=>w.status==='Good').length;
  let sourceEngagement='Waiting';
  if(enteredCount>0&&!finite(threshold))sourceEngagement='Need Setup';
  else if(finite(cutterOd)&&cutterOd<3&&wires[0].status==='Good')sourceEngagement='Acceptable';
  else if(finite(cutterOd)&&cutterOd>=3&&!wires[1].entered)sourceEngagement='Need 2 Rows';
  else if(finite(cutterOd)&&cutterOd>=3&&wires[1].status==='Good')sourceEngagement='Acceptable';
  else if(enteredCount>0)sourceEngagement='Not Acceptable';
  const check=(condition,yes,no,...numbers)=>can(...numbers)?condition?yes:no:'Not available';
  const checks={
    pilot:check(ptc<pipeId/2-0.25,'Pilot OK','Pilot too long',ptc,pipeId),
    cutterDepth:check(cutterDepth>couponFree+0.25+labattsBridge,'Cutter depth good','Cutter too shallow',cutterDepth,couponFree,labattsBridge),
    cutterSize:check(cutterId>pipeId,'Cutter I.D. too large','Cutter I.D. adequate',cutterId,pipeId),
    valveSize:check(valveSize<cutterOd,'Valve bore too small','Valve adequate',valveSize,cutterOd),
    valveNest:check(lostDistance>-valveNest+0.25,'Valve nest acceptable','Valve nest unacceptable',lostDistance,valveNest),
    pilotRelief:check(pilotRelief>wall+0.375,'Relief adequate','Relief not adequate',pilotRelief,wall),
    travel:check(machineTravel>totalTravel,'Machine has enough travel','Machine will not work',machineTravel,totalTravel),
    maxTravel:check(machineTravel>maxCutoutTravel,'Machine has enough travel','Machine will not work',machineTravel,maxCutoutTravel)
  };
  const reliability=can(machineTravel,totalTravel)?machineTravel-totalTravel<6?'Contact Reliability For Approval':'Source reliability margin check clear; not setup approval.':'Enter travel values for the reliability check.';
  if (wires.some(w=>w.status==='Invalid measurement')) issues.push('Correct invalid wire measurements; lengths must be positive complete decimals or fractions.');
  if (sourceEngagement==='Acceptable'&&cutterOd>=3&&wires[0].status!=='Good') issues.push('HOLD: legacy source row-2 indication does not confirm row 1. Resolve both measured rows and the approved procedure; do not treat the engagement indication as setup approval.');
  if (all(cutterId,pipeId)&&cutterId>pipeId) issues.push('Cutter I.D. exceeds Pipe I.D.; coupon-free and threshold geometry are unavailable.');
  return {issues,missing,pipeId,cutterId,couponFree,tapDistance,maxCutout,couponMinusWall,totalTravel,maxCutoutTravel,valveNest,estimatedTapTime,threshold,optimalFinal:threshold,wires,enteredCount,goodCount,sourceEngagement,checks,reliability};
}

export function helperFields(category, values = {}) {
  if(category==='pivothead')return [
    {key:'material',label:'Pipe material',options:[['CarbonSteel','Carbon steel'],['DuctileIron','Ductile iron']]},
    {key:'pipeSize',label:'Nominal pipe size',options:Object.entries(TRUE_OD[values.material||'CarbonSteel']||{}).map(([key,od])=>[key,key+' in ('+od+' in O.D.)'])},
    {key:'wall',label:'Wall thickness (in)'},{key:'measuredId',label:'Measured I.D. override (in, optional)'},
    {key:'pressureBand',label:'Nose check pressure',options:[['','Confirm source pressure band'],['under500','Below 500 psi'],['over500','Above 500 psi'],['at500','Exactly 500 psi / source not defined']]},
    {key:'measuredNose',label:'Measured nose plate O.D. (in, optional)'}
  ];
  if(category==='foldinghelper')return [
    {key:'md',label:'MD (in)'},{key:'ld',label:'LD (in)'},
    {key:'ldSign',label:'LD sign',options:[['add','Add LD'],['subtract','Subtract LD']]},
    {key:'pod',label:'POD / pipe O.D. (in)'},{key:'wall',label:'Wall thickness (in)'},{key:'start',label:'Start number on bar (in, optional)'}
  ];
  if(category==='uwire')return [
    ...Object.entries(UWIRE_LABELS).map(([key,label])=>({key,label:label+(['rpm','feedRate'].includes(key)?'':' (in)')})),
    {key:'valveType',label:'Valve type',options:['Gate','Ball','M&J/Burtech','Williamson','ENR'].map(value=>[value,value])},
    {key:'flangeClass',label:'Flange class',options:['150#','300#','600#','900#'].map(value=>[value,value])},
    {key:'valveSize',label:'Valve / flange size',options:[['','Select listed size'],...WIRE_SIZES.map(size=>[String(size),size+' in'])]},
    ...Array.from({length:WIRE_ROWS},(_,i)=>({key:'wire'+(i+1),label:'Measured U-wire row '+(i+1)+' (in)'}))
  ];
  return [];
}

export function helperReference(category, values = {}) {
  const result={note:REFERENCE_NOTE,tables:[],lists:[]};
  if(category==='pivothead'){
    const r=calculatePivotHead(values);
    result.issue=r.issues.join(' ');
    result.note+=' '+(r.measuredIdUsed?'Measured I.D. override is being used.':'Pipe I.D. is calculated from the selected material O.D. and wall.');
    result.tables=[pairs('Pivot Head source comparisons',[
      ['Pipe O.D.',inches(r.pipeOd)],['Pipe I.D.',inches(r.pipeId)],
      ['Seal leading-edge guide',finite(r.pipeId)?inches(r.sealGuideLow)+' to '+inches(r.sealGuideHigh):'Not available'],
      ['Seal field-check-only upper',inches(r.sealFieldHigh)],
      ['Load pad target',finite(r.pipeId)?r.loadPadRequired?inches(r.loadPadTarget):'Not required for 3- and 4-inch heads':'Not available'],
      ['Load pad guide range',finite(r.pipeId)&&r.loadPadRequired?inches(r.loadPadLow)+' to '+inches(r.loadPadTarget):'Not applicable / not available'],
      ['Clearance B',r.clearanceB],['Nose plate under I.D.',inches(r.underId)],['Nose plate O.D. target',inches(r.noseTarget)],
      ['Measured nose plate under I.D.',inches(r.measuredUnder)],['Diameter add comparison',inches(r.diameterAdd)],['Per-side add comparison',inches(r.perSideAdd)]
    ]),table('Sealing element comparisons',['Offset from I.D.','Seal diameter','Source qualification'],r.seals.map(row=>[row.label,inches(row.diameter),row.status]))];
    result.lists=[{title:'Backing plate / nose plate check',items:[r.backingStatus]},{title:'Source and limitations',items:PIVOT_NOTES}];
  }
  if(category==='foldinghelper'){
    const r=calculateFoldingHead(values);
    result.issue=[...r.issues,...r.missing.length?['Enter '+r.missing.join(', ')+' to calculate the set point.']:[]].join(' ');
    result.tables=[pairs('Folding Head set-point helper',[
      ['Set point',inches(r.setPoint)],['Bar target',finite(r.barTarget)?inches(r.barTarget):finite(r.setPoint)?'Add start number if used':'Not available']
    ])];
    result.lists=[{title:'Source and limitations',items:FOLDING_NOTES}];
  }
  if(category==='uwire'){
    const r=calculateUwire(values);
    result.issue=[...r.issues,...r.missing.length?['Required setup inputs missing: '+r.missing.join(', ')+'.']:[]].join(' ');
    result.tables=[pairs('U-Wire worksheet outputs',[
      ['Pipe I.D.',inches(r.pipeId)],['Cutter I.D.',inches(r.cutterId)],['Coupon Free',inches(r.couponFree)],['Tap distance',inches(r.tapDistance)],
      ['Max cutout + pilot',inches(r.maxCutout)],['Coupon Free - 1 W.T.',inches(r.couponMinusWall)],['Total travel required',inches(r.totalTravel)],
      ['Max cutout travel',inches(r.maxCutoutTravel)],['Valve nest',finite(r.valveNest)?inches(r.valveNest):'Not listed / not selected'],
      ['Optimal final U-wire / threshold',inches(r.threshold)],['Estimated source tap time',finite(r.estimatedTapTime)?r.estimatedTapTime.toFixed(3)+' hr':'Not available'],
      ['Source engagement indication (not setup approval)',r.sourceEngagement]
    ]),table('Measured U-wire checks',['Row','Measured length','Source threshold comparison'],r.wires.map(row=>[String(row.row),inches(row.measured),row.status])),
    pairs('Source equipment checks',Object.entries(r.checks).map(([key,value])=>[({pilot:'Pilot',cutterDepth:'Cutter depth',cutterSize:'Cutter size',valveSize:'Valve size',valveNest:'Valve nest',pilotRelief:'Pilot relief',travel:'Total travel',maxTravel:'Max cutout travel'})[key],value]))];
    result.lists=[{title:'Reliability check',items:[r.reliability]},{title:'Source and limitations',items:UWIRE_NOTES}];
  }
  return result;
}

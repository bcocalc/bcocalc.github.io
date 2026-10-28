import {PIPE_DATA,TRUE_OD} from './pipe-data.mjs?v=pre-alpha24';
import {familyFor,familyResults} from './families.mjs?v=pre-alpha24';
export const BUILD = 'pre-alpha24';
export const STORAGE_KEY = 'tapcalcPreAlpha01Workspace';
export const THEME_KEY = 'tapcalcPreAlpha01Theme';
export const OPERATION_CHOICES = ['Hot Tap','Line Stop','Tap & Complete','HTP','Hi-Stop'];
// Same machine catalog used in the established dev job setup.
export const MACHINE_OPTIONS = [
  '412','360 / 152','660 / 760','1200-M120','IP-100','IP-152','T-101',
  'HTM 360','HTM 660','HTM 760','HTM 1200','HTM M120','HTM 18 T101',
  'HTM 24 T101','HTM 28 T101','HTM C1-25','HTM C1-36',
  'IP 304 / 406 / 508','IP 914XL','IPSCO IP100'
];
const copy = value => JSON.parse(JSON.stringify(value));
export const number = value => {
  const text = String(value ?? '').trim();
  if (!text) return NaN;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return Number(text);
  const match = text.match(/^([+-]?)(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (!match || Number(match[4]) === 0) return NaN;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2] || 0) + Number(match[3]) / Number(match[4]));
};
// A blank Hot Tap LD is an effective zero, not an entered or migrated measurement.
export const hotTapLostDistance = state => String(state.ld ?? '').trim() === '' ? 0 : number(state.ld);
export function pipeMaterialKey(value) {
  return /ductile/i.test(value) ? 'DuctileIron' : /carbon|steel/i.test(value) ? 'CarbonSteel' : 'Other';
}
export function pipeSizes(state) {
  const material=pipeMaterialKey(state.bcoPipeMaterial);
  return Object.keys(PIPE_DATA[material]||{}).map(size=>[size,TRUE_OD[material][size]]);
}
export function pipeSchedules(state) {
  const row=PIPE_DATA[pipeMaterialKey(state.bcoPipeMaterial)]?.[number(state.bcoPipeOD).toFixed(1)];
  return ['STD','40','XS','80'].filter(key=>row&&key in row);
}
export function choosePipeSelection(state,key,value) {
  if(!['bcoPipeMaterial','bcoPipeOD','bcoSchedule'].includes(key))return;
  state[key]=value;
  if(key!=='bcoSchedule')state.preAlphaPipeOD='';
  const sizes=pipeSizes(state).map(([size])=>size);
  if(key==='bcoPipeMaterial' && !sizes.includes(number(state.bcoPipeOD).toFixed(1)))state.bcoPipeOD='';
  const schedules=pipeSchedules(state);
  if(key!=='bcoSchedule'&&!schedules.includes(state.bcoSchedule))state.bcoSchedule=schedules.includes('STD')?'STD':'custom';
  if(key==='bcoSchedule'&&value==='custom')return;
  const row=PIPE_DATA[pipeMaterialKey(state.bcoPipeMaterial)]?.[number(state.bcoPipeOD).toFixed(1)];
  const id=row?.[state.bcoSchedule];
  state.bcoPipeID=typeof id==='number'&&id>0 ? String(id) : '';
}
export function operationType(operation) {
  const state = operation.state || {};
  const type = String(operation.workflowType || operation.operationType || state.operationType || operation.mode || state.activeMode || 'Hot Tap');
  if (/^tap\s*(?:&|and)?\s*complete$/i.test(type)) return 'Tap & Complete';
  if (/completion/i.test(type)) return 'Completion Plug';
  if (/hi.?stop/i.test(type)) return 'Hi-Stop';
  if (/htp/i.test(type)) return 'HTP';
  if (/line.?stop/i.test(type)) {
    if(!operation.workflowType&&state.lineStopVariant==='htp')return 'HTP';
    if(!operation.workflowType&&state.lineStopVariant==='hiStop')return 'Hi-Stop';
    return 'Line Stop';
  }
  if (/hot.?tap/i.test(type)) return 'Hot Tap';
  return type;
}
export function chooseOperationType(job, operation, type) {
  if (!OPERATION_CHOICES.includes(type)) return;
  const autoName=/^(Hot Tap|Line Stop|Tap & Complete|Completion Plug|HTP|Hi-Stop) \d+$/.test(operation.label || '');
  operation.workflowType=type;
  operation.operationType=type;
  operation.state.operationType=type;
  if (autoName || !operation.label) {
    const labels=new Set(job.operations.filter(item=>item!==operation).map(item=>item.label));
    let index=1;
    while(labels.has(type+' '+index))index++;
    operation.label=type+' '+index;
  }
}
export function deleteOperation(job, operationId) {
  const index=job.operations.findIndex(operation=>operation.id===operationId);
  if(index<0)return false;
  job.operations.splice(index,1);
  if(job.selectedOperationId===operationId) {
    job.selectedOperationId=job.operations[Math.min(index,job.operations.length-1)]?.id ?? null;
  }
  return true;
}
export function normalizeJob(entry) {
  const record = entry.record || entry;
  const saved = entry.state || record.state || {};
  // Prefer the complete operation bundle over a selected-operation snapshot.
  const candidates = [record.jobBundle, saved.jobBundle, entry.jobBundle, record.state, saved, record];
  const bundle = candidates.find(value => Array.isArray(value?.operations) && value.operations.length);
  const metadata = record.job || {};
  const shared = {
    jobDescription: metadata.description || record.meta?.title || '',
    jobClient: metadata.client || '', jobLocation: metadata.location || '',
    jobDate: metadata.date || '', jobNumber: metadata.jobNumber || '',
    jobTechnician: metadata.technician || '', machineType: record.machine?.machine || '',
    jobNotes: metadata.notes || '', ...saved, ...(bundle?.sharedState || {})
  };
  delete shared.operations; delete shared.jobBundle;
  const legacy = {...saved};
  // Root records may retain the HTP select's display label without state.
  // Map only its three exact existing options; keep unknown labels unchanged.
  if(!Object.hasOwn(legacy,'htpMachine')&&record.machine?.htpMachine!=null){
    const raw=String(record.machine.htpMachine),key=raw.replace(/\s/g,'').toUpperCase();
    legacy.htpMachine=({'360':'360','360/152':'360','660':'660','660/760':'660','1200':'1200','1200-M120':'1200'})[key]??raw;
  }
  const defaults = {
    bcoPipeMaterial:record.pipe?.material, bcoPipeOD:record.pipe?.nominalSize,
    bcoPipeID:record.pipe?.pipeId, bcoCutterOD:record.machine?.cutterOd,
    bcoSchedule:record.pipe?.schedule,
    preAlphaPipeOD:record.pipe?.trueOd,
    operationType: record.meta?.operationType
  };
  for (const [key,value] of Object.entries(defaults)) if (legacy[key] == null || legacy[key] === '') legacy[key] = value ?? '';
  const measurementMaps = {
    hotTap:{md:'md',ld:'ld',ldSign:'ldSign',ptc:'ptc',pod:'pod',mt:'mt',start:'rodStart'},
    lineStop:{lsMd:'md',lsLd:'ld',lsLdSign:'ldSign',lsPod:'pod',lsTravel:'travel',lsMachineTravel:'machineTravel',lineStopVariant:'variant',lsLiManual:'liManual',lsLiManualToggle:'liManualToggle'},
    completionPlug:{cpStart:'start',cpJbf:'jbf',cpLd:'ld',cpPt:'pt',cpLiManual:'liManual',cpLiManualToggle:'liManualToggle'},
    htp:{htpMd:'md',htpLd:'ld',htpLdSign:'ldSign',htpPtc:'ptc',htpPipeSize:'pipeSize'},
    hiStop:{hsMd:'md',hsLd:'ld',hsLdSign:'ldSign',hsRl:'rl',hsCl:'cl',hsPtc:'ptc',hsRcd:'rcd',hsPb:'pb',hsPtp:'ptp'}
  };
  for (const [group,mapping] of Object.entries(measurementMaps)) for (const [key,sourceKey] of Object.entries(mapping)) {
    const value=record.measurements?.[group]?.[sourceKey];
    if ((legacy[key]==null || legacy[key]==='') && value!=null) legacy[key]=value;
  }
  const operations = (bundle?.operations || [{state:legacy}]).map((raw,index) => {
    const operation = copy(raw);
    operation.id = String(operation.id || 'operation-' + index);
    operation.state = copy(operation.state || {});
    operation.operationType = operationType(operation);
    operation.label = operation.label || operation.operationType + ' ' + (index + 1);
    return operation;
  });
  // Avoid ambiguous switching if a legacy export reused operation IDs.
  const seen = new Set();
  const reserved = new Set(operations.map(operation=>operation.id));
  for (const operation of operations) {
    if (seen.has(operation.id)) {
      const base=operation.id; let suffix=1;
      while(reserved.has(base+'-'+suffix)) suffix++;
      operation.id=base+'-'+suffix; reserved.add(operation.id);
    }
    seen.add(operation.id);
  }
  const selected = bundle?.selectedOperationId;
  return {
    id:String(entry.id || record.localId || crypto.randomUUID()),
    title:String(shared.jobDescription || shared.jobNumber || shared.jobClient || 'Untitled job'),
    source:entry.source || 'device', sourceId:String(entry.id || ''),
    savedAt:record.meta?.savedAtIso || entry.savedAt || '',
    sharedState:copy(shared), operations,
    selectedOperationId:operations.some(op => op.id === selected) ? selected : operations[0].id,
    original:copy(entry)
  };
}
export function pipeOD(state) {
  if (String(state.preAlphaPipeOD ?? '').trim()) return number(state.preAlphaPipeOD);
  const nominal = number(state.bcoPipeOD);
  const material = pipeMaterialKey(state.bcoPipeMaterial || '');
  return TRUE_OD[material]?.[nominal.toFixed(1)] ?? number(state.preAlphaPipeOD ?? state.pod);
}
export function geometry(state) {
  const od = pipeOD(state), id = number(state.bcoPipeID), cutter = number(state.bcoCutterOD);
  const validPipe = od > id && id > 0;
  const bco = validPipe && cutter > 0 && cutter <= id ? od / 2 - Math.sqrt((id / 2) ** 2 - (cutter / 2) ** 2) : NaN;
  const cid = number(state.bcoCutterID);
  const coupon = validPipe && cid > 0 && cid < cutter && cid <= id ? od / 2 - Math.sqrt((id / 2) ** 2 - (cid / 2) ** 2) : NaN;
  return {od,id,cutter,wall:validPipe ? (od-id)/2 : NaN,bco,coupon};
}
export const familyStage=operation=>familyFor(operation,operationType(operation));
export function stepsFor(operation) {
  const type = operationType(operation);
  const family=familyStage(operation);
  if(family==='htp')return ['setup','htp','review'];
  if(family==='hiStop')return ['setup','pipe','hiStop','review'];
  if (!operation.workflowType && operation.state.lineStopVariant && !['standard','lineStop'].includes(operation.state.lineStopVariant))
    return ['setup','saved','review'];
  if (type === 'Completion Plug') return ['setup','pipe','plug','review'];
  if (type === 'Line Stop') return ['setup','pipe','tap','stop','plug','review'];
  if (type === 'Tap & Complete') return ['setup','pipe','tap','plug','review'];
  if (type === 'Hi-Stop' || type === 'HTP') return ['setup','pipe','saved','review'];
  return type === 'Hot Tap' ? ['setup','pipe','tap','review'] : ['setup','saved','review'];
}
export function resultsFor(operation, stage) {
  if(stepsFor(operation).includes('saved'))return [];
  const s = operation.state;
  const g = geometry(s);
  const family=familyStage(operation);
  if(family){
    if(stage===family)return familyResults(s,family,number,g.od);
    if(stage==='pipe'&&family==='hiStop')return [['Wall thickness',g.wall]];
    return [];
  }
  const n = key => number(s[key]);
  const signed = (key,sign) => n(key) * (s[sign] === '-' ? -1 : 1);
  if (stage === 'pipe') return [['BCO',g.bco],['Coupon free',g.coupon],['Wall thickness',g.wall]];
  if (stage === 'tap') {
    const li = n('md') + hotTapLostDistance(s) * (s.ldSign === '-' ? -1 : 1);
    const pop = n('start') + li;
    const cop = pop + n('ptc');
    // Established calcHotTap basis in measurement.js: const mco = (pod / 2) + ptc.
    const mco = g.od / 2 + n('ptc');
    const results=[['Pilot on pipe',pop],['Cutter on pipe',cop],['Rod BCO',cop+g.bco],['Total travel',li+n('ptc')+g.bco],['Lower in',li],['Maximum cut out (MCO)',mco]];
    // Legacy calcHotTap: rmco = pop + mco. This is a rod reading, not MCO travel.
    if(stepsFor(operation).includes('tap'))results.push(['Rod MCO',pop+mco]);
    return results;
  }
  if (stage === 'stop') {
    const pod=g.od;
    const li = s.lsLiManualToggle === true || s.lsLiManualToggle === 'true'
      ? n('lsLiManual') : n('lsMd') + signed('lsLd','lsLdSign') + pod - g.wall;
    const travel = n('lsTravel'), machine = n('lsMachineTravel');
    return [['Lower in',li],['Travel margin',machine-travel]];
  }
  if (stage === 'plug') return [['Lower in',s.cpLiManualToggle === true || s.cpLiManualToggle === 'true' ? n('cpLiManual') : n('cpStart')+n('cpJbf')+n('cpLd')+n('cpPt')]];
  return [];
}
export function migratePipeSource(operation) {
  const state=operation.state;
  if(!Object.hasOwn(state,'lsPod'))return false;
  const value=state.lsPod;
  if(String(value ?? '').trim()) {
    const g=geometry(state),old=number(value);
    const prior=number(state.lsMd)+number(state.lsLd)*(state.lsLdSign==='-'?-1:1)+old-g.wall;
    const current=number(state.lsMd)+number(state.lsLd)*(state.lsLdSign==='-'?-1:1)+g.od-g.wall;
    operation.retiredLineStopOD={value,pipeODAtMigration:Number.isFinite(g.od)?g.od:null,
      previousAutomaticLI:Number.isFinite(prior)?prior:null,newAutomaticLI:Number.isFinite(current)?current:null,
      requiresReview:!Number.isFinite(old)||!Number.isFinite(g.od)||old!==g.od};
  }
  // Only the experimental working copy changes; job.original stays untouched.
  delete state.lsPod;
  return true;
}
export function pipeSourceWarning(operation) {
  const old=operation.retiredLineStopOD;
  if(!old?.requiresReview)return null;
  const od=pipeOD(operation.state),display=value=>Number.isFinite(value)?value.toFixed(4)+' in':'not available';
  const comparison=old.previousAutomaticLI!=null&&old.newAutomaticLI!=null&&old.previousAutomaticLI!==old.newAutomaticLI
    ? ' At migration, automatic lower in changed from '+display(old.previousAutomaticLI)+' to '+display(old.newAutomaticLI)+'.' : '';
  return {stage:'stop',code:'pipe-source-change',kind:'warning',message:'Saved Line Stop O.D. '+String(old.value)+' is archived and no longer used. Pipe & cutter O.D. is '+display(od)+'.'+comparison+' The original saved record is unchanged.'};
}
export function stageFor(operation) {
  if(!operation)return 'setup';
  const steps=stepsFor(operation);
  return steps.includes(operation.workspaceStage) ? operation.workspaceStage : steps[0];
}
export function rememberStage(operation,stage) {
  if(!operation || !stepsFor(operation).includes(stage)) return false;
  operation.workspaceStage=stage;
  return true;
}
export function lineStopMdIsManual(state) {
  if ([true,'true'].includes(state.lineStopMdUserEdited)) return true;
  if ([false,'false'].includes(state.lineStopMdUserEdited)) return false;
  // Older saves may predate the marker. Preserve a distinct saved line-stop MD.
  const stop=String(state.lsMd ?? '').trim(), tap=String(state.md ?? '').trim();
  return !!stop && (Number.isFinite(number(stop)) && Number.isFinite(number(tap))
    ? number(stop)!==number(tap) : stop!==tap);
}
export function setOperationMeasurement(operation,key,value) {
  const state=operation.state, manual=lineStopMdIsManual(state);
  state[key]=value;
  if(key==='lsMd') state.lineStopMdUserEdited=true;
  if(key==='md') {
    state.lineStopMdUserEdited=manual;
    if(!manual) state.lsMd=value;
  }
}
export function initializeLineStopMd(operation) {
  const state=operation.state;
  if(lineStopMdIsManual(state) || String(state.lsMd ?? '').trim() || !String(state.md ?? '').trim()) return false;
  state.lsMd=state.md;
  state.lineStopMdUserEdited=false;
  return true;
}
export function hotTapWarnings(operation) {
  if(!stepsFor(operation).includes('tap')) return [];
  const state=operation.state, g=geometry(state), warnings=[];
  const limit=g.od/2-g.wall;
  if(limit>0 && number(state.ptc)>limit) warnings.push({
    code:'ptc-length', field:'ptc', limit,
    message:'PTC exceeds '+limit.toFixed(4)+' in (pipe radius minus wall). Recheck the pilot and cutter setup.'
  });
  const travel=resultsFor(operation,'tap').find(([label])=>label==='Total travel')[1];
  if(number(state.mt)>0 && travel>number(state.mt)) warnings.push({
    code:'machine-travel', message:'Calculated travel exceeds machine travel. Recheck the setup.'
  });
  return warnings;
}
export function getDeviceJobs(storage) {
  try {
    const history = JSON.parse(storage.getItem('measurementCardHistoryV1') || '[]');
    return Array.isArray(history) ? history.map(item => normalizeJob({...item,source:'device'})) : [];
  } catch { return []; }
}
export function newJob() {
  return normalizeJob({id:crypto.randomUUID(),source:'experimental',state:{jobDescription:'Untitled job',jobDate:new Date().toLocaleDateString('en-CA')},jobBundle:{operations:[{id:crypto.randomUUID(),label:'Hot Tap 1',operationType:'Hot Tap',state:{bcoPipeMaterial:'CarbonSteel'}}]}});
}

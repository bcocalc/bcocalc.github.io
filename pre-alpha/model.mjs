export const BUILD = 'pre-alpha02';
export const STORAGE_KEY = 'tapcalcPreAlpha01Workspace';
export const THEME_KEY = 'tapcalcPreAlpha01Theme';
export const OPERATION_CHOICES = ['Hot Tap','Line Stop','Tap & Complete'];
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
const TRUE_OD = {
  CarbonSteel: {'3.0':3.5,'4.0':4.5,'6.0':6.625,'8.0':8.625,'10.0':10.75,'12.0':12.75,'14.0':14,'16.0':16,'18.0':18,'20.0':20,'22.0':22,'24.0':24,'26.0':26,'28.0':28,'30.0':30,'36.0':36,'42.0':42,'48.0':48},
  DuctileIron: {'3.0':3.96,'4.0':4.8,'6.0':6.9,'8.0':9.05,'10.0':11.1,'12.0':13.2,'14.0':15.3,'16.0':17.4,'18.0':19.5,'20.0':21.6,'24.0':25.8,'30.0':32,'36.0':38.3,'42.0':44.5,'48.0':50.8}
};
export function operationType(operation) {
  const state = operation.state || {};
  const type = String(operation.workflowType || operation.operationType || state.operationType || operation.mode || state.activeMode || 'Hot Tap');
  if (/^tap\s*(?:&|and)?\s*complete$/i.test(type)) return 'Tap & Complete';
  if (/completion/i.test(type)) return 'Completion Plug';
  if (/hi.?stop/i.test(type)) return 'Hi-Stop';
  if (/htp/i.test(type)) return 'HTP';
  if (/line.?stop/i.test(type)) return 'Line Stop';
  if (/hot.?tap/i.test(type)) return 'Hot Tap';
  return type;
}
export function chooseOperationType(job, operation, type) {
  if (!OPERATION_CHOICES.includes(type)) return;
  const autoName=/^(Hot Tap|Line Stop|Tap & Complete|Completion Plug) \d+$/.test(operation.label || '');
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
  const defaults = {
    bcoPipeMaterial:record.pipe?.material, bcoPipeOD:record.pipe?.nominalSize,
    bcoPipeID:record.pipe?.pipeId, bcoCutterOD:record.machine?.cutterOd,
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
  const rawMaterial = String(state.bcoPipeMaterial || '');
  const material = /ductile/i.test(rawMaterial) ? 'DuctileIron' : /carbon|steel/i.test(rawMaterial) ? 'CarbonSteel' : '';
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
export function stepsFor(operation) {
  const type = operationType(operation);
  if (!operation.workflowType && operation.state.lineStopVariant && !['standard','lineStop'].includes(operation.state.lineStopVariant))
    return ['setup','saved','review'];
  if (type === 'Completion Plug') return ['setup','pipe','plug','review'];
  if (type === 'Line Stop') return ['setup','pipe','tap','stop','plug','review'];
  if (type === 'Tap & Complete') return ['setup','pipe','tap','plug','review'];
  if (type === 'Hi-Stop' || type === 'HTP') return ['setup','pipe','saved','review'];
  return type === 'Hot Tap' ? ['setup','pipe','tap','review'] : ['setup','saved','review'];
}
export function resultsFor(operation, stage) {
  const s = operation.state;
  const g = geometry(s);
  const n = key => number(s[key]);
  const signed = (key,sign) => n(key) * (s[sign] === '-' ? -1 : 1);
  if (stage === 'pipe') return [['BCO',g.bco],['Coupon free',g.coupon],['Wall thickness',g.wall]];
  if (stage === 'tap') {
    const li = n('md') + signed('ld','ldSign');
    const pop = n('start') + li;
    const cop = pop + n('ptc');
    return [['Pilot on pipe',pop],['Cutter on pipe',cop],['Rod BCO',cop+g.bco],['Total travel',li+n('ptc')+g.bco],['Lower in',li]];
  }
  if (stage === 'stop') {
    const pod=Number.isFinite(n('lsPod')) ? n('lsPod') : g.od;
    const li = s.lsLiManualToggle === true || s.lsLiManualToggle === 'true'
      ? n('lsLiManual') : n('lsMd') + signed('lsLd','lsLdSign') + pod - g.wall;
    const travel = n('lsTravel'), machine = n('lsMachineTravel');
    return [['Lower in',li],['Travel margin',machine-travel]];
  }
  if (stage === 'plug') return [['Lower in',s.cpLiManualToggle === true || s.cpLiManualToggle === 'true' ? n('cpLiManual') : n('cpStart')+n('cpJbf')+n('cpLd')+n('cpPt')]];
  return [];
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

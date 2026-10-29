// Local DRAFT mapping only. The private original PDF is selected by the user, never shipped.
import {geometry,resultsFor,stepsFor} from './model.mjs?v=pre-alpha25';
export const WORKSHEET_SOURCE=Object.freeze({sha256:'b800c3777fe6f8475582a7d2a447d2e5d1c3576cd3b22943eff525c6d9fab30a',page:5,width:612,height:792,title:'HTS-5201-SWI Rev1 Pivot Head Line Stop/Plant Series Fitting',printedDate:'08/12/2026',units:'inches'});
const sides=[['lead','Lead technician'],['second','Second technician']];
const fields=[];
const add=(id,label,rect,section,side='',binding='')=>fields.push(Object.freeze({id,label,rect:Object.freeze(rect),section,side,binding}));
add('client','Client',[139.68,105.85,305.63,121.62],'Job details');
add('ax','AX project',[419,105.85,575.95,121.62],'Job details');
add('leadName','Lead technician',[139.68,122.37,305.63,138.12],'Job details');
add('secondName','Second technician',[419,122.37,575.95,138.12],'Job details');
const hotRows=[
 [155.40,171.17,['md','MD'],['start','Start']],
 [171.92,186.92,['ld','LD'],['pop','POP']],
 [187.67,203.45,['li','LI','li'],['cop','COP']],
 [204.20,219.95,['ptc','PTC'],['rodBco','Rod BCO','rodBco']],
 [220.70,236.47,['bco','BCO distance','bco'],['rodMco','Rod MCO','rodMco']],
 [237.22,253,null,null],
 [253.75,268.75,['mco','MCO distance','mco'],['valveT','Valve T']],
 [269.50,285.27,['mt','MT'],['valveBore','Valve Bore']],
 [286.02,301.77,null,['gtf','GTF']]
];
// TTD is a labeled manual field; the four unlabeled slots are deliberately omitted.
hotRows[5][2]=['ttd','TTD'];
for(const [side] of sides){
 const calc=side==='lead'?[81.10,152.43]:[351.43,422.78],reading=side==='lead'?[220.78,305.63]:[491.10,575.95];
 for(const [top,bottom,c,r] of hotRows){if(c)add(side+'.hotCalc.'+c[0],c[1],[calc[0],top,calc[1],bottom],'Hot Tap calculations',side,c[2]||'');if(r)add(side+'.hotReading.'+r[0],r[1],[reading[0],top,reading[1],bottom],'Hot Tap rod readings',side,r[2]||'');}
 const x=side==='lead'?[153.18,305.63]:[423.52,575.95];
 for(const [id,label,top,bottom] of [['start','Start',319.05,334.83],['md','MD',335.58,350.58],['ld','LD',351.33,367.10],['pod','POD',367.85,383.62],['total','Total',384.37,400.12],['minusWall','Minus 1 Wall',400.87,416.65],['li','LI',417.40,432.40],['mt','MT',433.15,448.93]])add(side+'.lineStop.'+id,label,[x[0],top,x[1],bottom],'Line Stop',side);
 for(const [id,label,top,bottom] of [['jackTurns','Jack Bolt turns',466.20,481.95],['retracted','Retracted',482.70,498.48],['set','Set',499.23,514.25],['jbf','JBF',515,530.75],['ld','LD',531.50,547.28],['pt','PT',548.03,563.78],['li','LI',564.53,580.30]])add(side+'.completion.'+id,label,[x[0],top,x[1],bottom],'Completion Plug',side);
}
add('notes','Notes',[36.05,581.05,575.95,686.90],'Notes');
export const WORKSHEET_FIELDS=Object.freeze(fields);
const clone=value=>structuredClone(value);
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const numeric=value=>Number.isFinite(value)?value.toFixed(4):'';
export function createWorksheetDraft(job){
 if(!job||!Array.isArray(job.operations)||!job.operations.length)throw Error('Open a job with a selected operation before opening the worksheet.');
 const snapshot=clone(job),operation=snapshot.operations.find(op=>op.id===snapshot.selectedOperationId);
 if(!operation?.state)throw Error('Choose the operation to print. No other operation will be substituted.');
 const eligible=stepsFor(operation).includes('tap'),tap=eligible?Object.fromEntries(resultsFor(operation,'tap')):{},g=geometry(operation.state);
 const candidates=eligible?{bco:numeric(g.bco),mco:numeric(tap['Maximum cut out (MCO)']),rodBco:numeric(tap['Rod BCO']),rodMco:numeric(tap['Rod MCO']),li:numeric(tap['Lower in'])}:{bco:'',mco:'',rodBco:'',rodMco:'',li:''};
 const values=Object.fromEntries(fields.map(f=>[f.id,''])),info=snapshot.sharedState||{};
 values.client=String(info.jobClient??'');values.notes=String(info.jobNotes??'');
 return {snapshot:freeze(snapshot),operationId:operation.id,operationLabel:String(operation.label||operation.id),eligible,candidates:freeze(candidates),values,applied:false};
}
export function applyHotTapCandidates(draft,{applicabilityConfirmed=false}={}){
 if(!applicabilityConfirmed)throw Error('Confirm this worksheet and the five Hot Tap bindings apply to this selected operation. Units are inches.');
 if(!draft.eligible)throw Error('The selected operation does not use the standard Hot Tap stage. No fallback is supplied.');
 for(const field of fields)if(field.binding)draft.values[field.id]=draft.candidates[field.binding];
 draft.applied=true;return draft.values;
}
export function setWorksheetValue(draft,id,value){
 if(!fields.some(field=>field.id===id))throw Error('Unknown or unlabelled worksheet field.');
 if(typeof value!=='string')throw Error('Worksheet entries must be text.');
 draft.values[id]=value;return value;
}
export function wrapWorksheetText(value,measure,width){
 const lines=[];
 for(const paragraph of String(value).split('\n')){let line='';for(const char of paragraph){if(line&&measure(line+char)>width){lines.push(line);line='';}line+=char;}lines.push(line);}
 return lines;
}
export function worksheetLayout(values,measure){
 const errors=[],entries=[];
 for(const field of fields){
  const value=String(values[field.id]??'');if(!value)continue;
  const [x,y,right,bottom]=field.rect,width=right-x,height=bottom-y,font=9,lineHeight=10.35;
  const lines=field.id==='notes'?wrapWorksheetText(value,t=>measure(t,font),width-4):[value];
  if(lines.some(line=>measure(line,font)>width-4)||lines.length*lineHeight>height-2||field.id!=='notes'&&/[\r\n]/.test(value))errors.push(field.label+(field.side?' - '+field.side:'')+' does not fit. Edit this value; nothing will be truncated.');
  entries.push({field,value,lines,x,y,width,height,font,lineHeight});
 }
 return {errors,entries};
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function worksheetPrintDocument(background,values,measure){
 if(!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(background||''))throw Error('Load the verified original worksheet background before printing.');
 const layout=worksheetLayout(values,measure);if(layout.errors.length)throw Error(layout.errors.join('\n'));
 const pos=value=>Number(value.toFixed(3));
 const overlays=layout.entries.map(({field,lines,x,y,width,height,font,lineHeight})=>{
  const left=field.section==='Job details'||field.id==='notes',tx=left?x+2:x+width/2,baseline=y+(field.id==='notes'?font:(height-lineHeight)/2+font*.85);
  return '<text data-worksheet-print-field="'+field.id+'" x="'+pos(tx)+'" y="'+pos(baseline)+'" font-family="Arial, sans-serif" font-size="'+font+'" text-anchor="'+(left?'start':'middle')+'" fill="#000">'+lines.map((line,index)=>'<tspan x="'+pos(tx)+'" y="'+pos(baseline+index*lineHeight)+'">'+escape(line)+'</tspan>').join('')+'</text>';
 }).join('');
 const stylesheet=new URL('./worksheet-print.css?v=pre-alpha25',import.meta.url).href;
 return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'self\'"><title>DRAFT HTS-5201 worksheet</title><link rel="stylesheet" href="'+escape(stylesheet)+'"></head><body><main class="sheet"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792" role="img" aria-label="DRAFT original worksheet page 5 with reviewed entries"><image class="background" href="'+background+'" x="0" y="0" width="612" height="792" preserveAspectRatio="none"/>'+overlays+'<text x="20" y="390" transform="rotate(-90 20 390)" font-family="Arial, sans-serif" font-size="9" font-weight="bold" letter-spacing="1" fill="#555">DRAFT - REVIEW REQUIRED - NOT FIELD VERIFICATION</text></svg></main></body></html>';
}
export function openWorksheetDraft(job,{open=url=>window.open(url,'_blank','width=1100,height=850'),host=globalThis.window,sourceUrl=import.meta.url}={}){
 const draft=createWorksheetDraft(job),url=new URL('./worksheet-draft.html?v=pre-alpha25',sourceUrl),popup=open(url.href);
 if(!popup)throw Error('Worksheet window blocked. Allow the draft window and try again. Your job is unchanged.');
 let timer;
 const cleanup=()=>{host.removeEventListener('message',receive);clearTimeout(timer);};
 const receive=event=>{if(event.source!==popup||event.origin!==url.origin||event.data?.type!=='tapcalc-worksheet-ready')return;cleanup();if(!popup.closed)popup.postMessage({type:'tapcalc-worksheet-snapshot',snapshot:draft.snapshot},url.origin);};
 host.addEventListener('message',receive);timer=setTimeout(cleanup,12000);timer.unref?.();return popup;
}

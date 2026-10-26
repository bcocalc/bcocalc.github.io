import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {TRUE_OD} from '../pre-alpha/pipe-data.mjs';
import {calculatePivotHead,calculateFoldingHead,calculateUwire,helperFields,helperReference,parseHelperMeasurement,lookupValveNest,VALVE_NEST_TABLE,WIRE_SIZES} from '../pre-alpha/reference-helpers.mjs';

let checks=0;
const eq=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const source=readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
const foldingSource=readFileSync(new URL('../dev/overlays/tapcalc-folding-head-reference.js',import.meta.url),'utf8');

// Evaluate only the original source helper blocks with disposable in-memory DOM
// stubs. No browser, storage, Firebase, or source-file writes are used.
const uwireStart=source.indexOf('  const WIRE_ROWS = 12;',source.indexOf('U-wire placement reference'));
const uwireEnd=source.indexOf('  function useCurrentPipe()',uwireStart);
const uwireOriginal=source.slice(uwireStart,uwireEnd).replace(
  "    setText('uwirePipeIdOut',",
  "    globalThis.outputs={pipeId,cutterId,couponFree,tapDistance,maxCutout,couponMinusWall,totalTravel,maxCutoutTravel,valveNest,estimatedTapTime,threshold,optimalFinal};\n    setText('uwirePipeIdOut',"
);
function oldUwire(values){
  const ids={pipeOd:'PipeOd',wall:'PipeWall',cutterOd:'CutterOd',toothWidth:'ToothWidth',ptc:'Ptc',cutterDepth:'CutterDepth',machineTravel:'MachineTravel',lostDistance:'LostDistance',fittingLength:'FittingLength',valveLength:'ValveLength',pilotRelief:'PilotRelief',labattsBridge:'LabattsBridge',rpm:'Rpm',feedRate:'FeedRate',valveType:'ValveType',flangeClass:'FlangeClass',valveSize:'Size'};
  const elements={};
  const element=id=>elements[id]??=( {value:'',textContent:'',dataset:{rendered:'1'}} );
  for(const [key,id] of Object.entries(ids))element('uwire'+id).value=String(values[key]??'');
  for(let i=0;i<12;i++)element('uwireWireRow'+(i+1)).value=String(values['wire'+(i+1)]??values.wires?.[i]??'');
  const context=vm.createContext({document:{getElementById:id=>id==='uwireWireGrid'?null:element(id)}});
  vm.runInContext(uwireOriginal+'\nupdateUwireCalculator(); globalThis.nests=VALVE_NEST_TABLE;',context);
  return {outputs:context.outputs,nests:context.nests,elements};
}
const fixture={pipeOd:20,wall:.375,cutterOd:19,toothWidth:.25,ptc:3,cutterDepth:12,machineTravel:60,lostDistance:-1,fittingLength:12,valveLength:10,pilotRelief:1,labattsBridge:.25,rpm:15,feedRate:.004,valveType:'Gate',flangeClass:'150#',valveSize:20,wire1:8,wire2:8.5};
const legacy=oldUwire(fixture);
eq(JSON.parse(JSON.stringify(legacy.nests)),VALVE_NEST_TABLE,'Valve-nest cells match the original source, including nulls');
for(const [type,classes]of Object.entries(VALVE_NEST_TABLE))for(const [rating,rows]of Object.entries(classes))for(const [size,value]of rows){
  eq(lookupValveNest(type,rating,size),value===null?NaN:value,`${type} ${rating} ${size}`);
}
ok(Number.isNaN(lookupValveNest('Gate','150#',21)),'No nearest-size substitution');
ok(Number.isNaN(lookupValveNest('Other','150#',20)),'No valve-family fallback');
eq(WIRE_SIZES.length,21);
for(const values of [fixture,{...fixture,cutterOd:19.5,toothWidth:.25},{...fixture,pipeOd:3.5,wall:.25,cutterOd:2.5,toothWidth:.2,ptc:1,wire1:1,wire2:''},{...fixture,valveType:'Williamson',flangeClass:'600#',valveSize:42},{...fixture,wall:'3/8',lostDistance:'-1 1/2'}]){
  const old=oldUwire(values),actual=calculateUwire(values);
  for(const [key,value]of Object.entries(old.outputs))eq(actual[key],value,'U-Wire original-source parity: '+key);
  eq(actual.sourceEngagement,old.elements.uwireEngagementPill.textContent,'Source engagement indication parity');
}

// Strict comparison boundaries and source-specific warning behavior.
const base=calculateUwire(fixture);
eq(calculateUwire({...fixture,wire1:base.threshold}).wires[0].status,'No Go','Equality is not below threshold');
eq(calculateUwire({...fixture,wire1:base.threshold-1e-6}).wires[0].status,'Good');
eq(calculateUwire({...fixture,wire2:''}).sourceEngagement,'Need 2 Rows');
const inconsistent=calculateUwire({...fixture,wire1:base.threshold+1,wire2:8});
eq(inconsistent.sourceEngagement,'Acceptable','Legacy row-2-only indication is preserved, not silently redefined');
ok(inconsistent.issues.some(s=>s.startsWith('HOLD:')),'Contradictory row 1 has explicit hold');
eq(calculateUwire({...fixture,machineTravel:base.totalTravel}).checks.travel,'Machine will not work','Travel equality is not enough');
eq(calculateUwire({...fixture,machineTravel:base.totalTravel+6}).reliability,'Source reliability margin check clear; not setup approval.');
eq(calculateUwire({...fixture,machineTravel:base.totalTravel+5.999}).reliability,'Contact Reliability For Approval');
eq(calculateUwire({...fixture,pilotRelief:.75}).checks.pilotRelief,'Relief not adequate','Relief equality remains not adequate');
eq(calculateUwire({...fixture,ptc:base.pipeId/2-.25}).checks.pilot,'Pilot too long');
eq(calculateUwire({...fixture,flangeClass:'900#'}).valveNest,NaN,'Unlisted table value stays unavailable');
for(const invalid of [{wall:'abc'},{pipeOd:-1},{wall:10},{toothWidth:10},{rpm:0},{cutterOd:'19xyz'},{valveSize:21},{valveType:'Other'}]){
  const r=calculateUwire({...fixture,...invalid});ok(r.issues.length>0);ok(Number.isNaN(r.threshold),'Invalid source inputs hold outputs');
}
eq(calculateUwire({...fixture,wire1:'oops'}).wires[0].status,'Invalid measurement');
const tooLarge=calculateUwire({...fixture,cutterOd:21});
ok(Number.isNaN(tooLarge.couponFree));ok(tooLarge.issues.some(s=>s.includes('Cutter I.D. exceeds')));
ok(Number.isNaN(calculateUwire({}).threshold));

// Pivot targets are checked against the original equipment-specific function.
const pivotStart=source.indexOf('function getPivotNosePlateCheck('),pivotEnd=source.indexOf('function renderPivotSealRows(',pivotStart);
const pivotContext=vm.createContext({formatPivotFraction:String,formatPivotInches:String});
vm.runInContext(source.slice(pivotStart,pivotEnd),pivotContext);
for(const [material,sizes]of Object.entries(TRUE_OD))for(const [pipeSize,od]of Object.entries(sizes))for(const pressureBand of ['under500','over500']){
  const values={material,pipeSize,wall:.25,pressureBand};
  const actual=calculatePivotHead(values),pipeId=od-.5;
  const original=pivotContext.getPivotNosePlateCheck(pipeSize,pipeId,pressureBand);
  eq(actual.pipeId,pipeId);eq(actual.noseTarget,original.targetOd??NaN,'Pivot original-source nose target');
  eq(actual.sealGuideLow,pipeId-1/16);eq(actual.sealGuideHigh,pipeId+1/16);eq(actual.sealFieldHigh,pipeId+1/8);
  eq(actual.loadPadRequired,Number(pipeSize)>4);eq(actual.loadPadTarget,Number(pipeSize)>4?pipeId/2:NaN);
}
const pivot=calculatePivotHead({pipeSize:'16.0',wall:.375,pressureBand:'under500',measuredNose:14});
eq(pivot.noseTarget,14.5);eq(pivot.diameterAdd,.5);eq(pivot.perSideAdd,.25);ok(pivot.backingStatus.includes('Technical Support'));
eq(pivot.seals.length,7);eq(pivot.seals[5].status,'Field-check only');eq(pivot.seals[6].status,'Field-check upper only');
const over=calculatePivotHead({pipeSize:'16.0',wall:.375,pressureBand:'over500',measuredNose:15});
eq(over.noseTarget,14.625);ok(over.backingStatus.includes('oversized'));ok(Number.isNaN(over.diameterAdd));
const at500=calculatePivotHead({pipeSize:'16.0',wall:.375,pressureBand:'at500'});
ok(Number.isNaN(at500.noseTarget));ok(at500.issues.some(s=>s.includes('Exactly 500')));
const override=calculatePivotHead({pipeSize:'16.0',wall:.375,measuredId:'15 1/2',pressureBand:'under500'});
eq(override.pipeId,15.5);eq(override.measuredIdUsed,true);
eq(calculatePivotHead({material:'DuctileIron',pipeSize:'16.0',wall:.375,pressureBand:'under500'}).pipeOd,17.4);
for(const invalid of [{wall:0},{wall:8},{wall:'x'},{measuredId:16},{material:'Other'},{pipeSize:'15.0'}]){
  const r=calculatePivotHead({pipeSize:'16.0',wall:.375,pressureBand:'under500',...invalid});ok(r.issues.length>0);ok(Number.isNaN(r.pipeId));
}
ok(Number.isNaN(calculatePivotHead({pipeSize:'42.0',wall:.375,pressureBand:'under500'}).noseTarget),'No extrapolation beyond nose chart');
for(const material of ['CarbonSteel','DuctileIron'])for(const pipeSize of ['42.0','48.0']){
  const r=calculatePivotHead({material,pipeSize,wall:.375,pressureBand:'under500',measuredNose:40});
  ok(r.issues.some(s=>s.includes('Nose plate target not listed')),'Large pipe selection cannot imply a supported nose size');
  ok(Number.isNaN(r.noseTarget));ok(Number.isNaN(r.diameterAdd));ok(Number.isNaN(r.perSideAdd));
  eq(r.clearanceB,'3/8 to 9/16 in','Preserve source nominal >=14 comparison without inventing a global upper bound');
  eq(r.pipeId,TRUE_OD[material][pipeSize]-.75);eq(r.loadPadTarget,r.pipeId/2);
}

// Folding Head valid-input math is extracted from the original update function.
const foldStart=foldingSource.indexOf('  function updateSetPoint('),foldEnd=foldingSource.indexOf('  function renderFoldingHeadReference(',foldStart);
const foldCode=foldingSource.slice(foldStart,foldEnd).replace('    if (setPointOut) setPointOut.textContent = formatMeasurement(setPoint);','    globalThis.outputs = {setPoint,barTarget};\n    if (setPointOut) setPointOut.textContent = formatMeasurement(setPoint);');
for(const values of [{md:12,ld:1,pod:16,wall:.375,start:2,ldSign:'add'},{md:'12 1/2',ld:'1/4',pod:16,wall:'3/8',start:'-0 1/2',ldSign:'subtract'},{md:0,ld:0,pod:6,wall:.25,start:'',ldSign:'add'}]){
  const fields={foldingHeadMd:values.md,foldingHeadLd:values.ld,foldingHeadPod:values.pod,foldingHeadWall:values.wall,foldingHeadStart:values.start,foldingHeadLdSign:values.ldSign};
  const context=vm.createContext({parseMeasurement:parseHelperMeasurement,formatMeasurement:String,view:{querySelector:selector=>({value:fields[selector.slice(1)]??'',dataset:{},textContent:''})}});
  vm.runInContext(foldCode+'\nupdateSetPoint(view);',context);
  const actual=calculateFoldingHead(values);eq(actual.setPoint,context.outputs.setPoint);eq(actual.barTarget,context.outputs.barTarget);
}
ok(Number.isNaN(calculateFoldingHead({md:12,ld:1,pod:16,wall:8}).setPoint));
ok(Number.isNaN(calculateFoldingHead({md:'12x',ld:1,pod:16,wall:.375}).setPoint));
eq(calculateFoldingHead({}).missing,['MD','LD','POD','wall']);

for(const [text,want]of [['-0 1/2',-.5],['1-1/2',1.5],['3/8"',.375],['',NaN],['1/0',NaN],['12x',NaN],['.375',.375]])eq(parseHelperMeasurement(text),want);
for(const [text,want]of [['1-1/2"',1.5],['-1-1/2"',-1.5],['1  1/2',1.5],['1\t1/2',1.5],[' 3/8 " ',.375],['12"',12]])eq(parseHelperMeasurement(text),want,'Preserve valid inch mark and mixed-number syntax');
for(const text of ['1"2','1" 1/2','1"2"','1""','"1','"1"','3/8""','1--1/2','1---1/2','1 -1/2','1- 1/2','1 - 1/2','1\t-1/2','1-\t1/2','--1/2','1 1//2']){
  ok(Number.isNaN(parseHelperMeasurement(text)),'Reject malformed measurement '+text);
  ok(calculateUwire({...fixture,wall:text}).issues.length>0,'Malformed U-Wire input is visible');
  ok(Number.isNaN(calculateUwire({...fixture,wall:text}).threshold),'Malformed U-Wire input holds outputs');
  ok(Number.isNaN(calculatePivotHead({pipeSize:'16.0',wall:text,pressureBand:'under500'}).pipeId),'Malformed Pivot input holds outputs');
  ok(Number.isNaN(calculateFoldingHead({md:text,ld:1,pod:16,wall:.375}).setPoint),'Malformed Folding input holds outputs');
}
for(const category of ['pivothead','uwire','foldinghelper']){
  ok(helperFields(category).length>0);const result=helperReference(category);ok(result.tables.length>0);ok(result.lists.length>0);ok(result.note.includes('do not change job measurements'));
}
eq(helperFields('pivothead',{material:'DuctileIron'}).find(f=>f.key==='pipeSize').options.some(([size])=>size==='22.0'),false,'No nonexistent ductile size');
console.log(`PASS ${checks} reference-helper checks (source parity, input/boundary guards, equipment distinctions, read-only descriptors).`);

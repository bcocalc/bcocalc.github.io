import assert from 'node:assert/strict';
import {calculateFoldingDimensions,calculateFoldingHead,helperReference,parseHelperMeasurement} from '../pre-alpha/reference-helpers.mjs';
import {currentPipeReferenceValues} from '../pre-alpha/references.mjs';
import {TRUE_OD} from '../pre-alpha/pipe-data.mjs';
let checks=0;
const equal=(value,expected,message)=>{assert.deepEqual(value,expected,message);checks++;};
const near=(value,expected,message)=>{assert.ok(Number.isFinite(value)&&Math.abs(value-expected)<1e-10,message||value+' should equal '+expected);checks++;};
const held=(value,message)=>{assert.ok(Number.isNaN(value),message);checks++;};
for(const [pod,wall,id,ring,bottom,top]of [
 ['6 5/8','1/4',6.125,5.625,3.0625,2.9375],['6-5/8"','1/4"',6.125,5.625,3.0625,2.9375],
 ['12 3/4','3/8',12,11.5,6,5.875],['16','.375',15.25,14.75,7.625,7.5],['17.4','3/8',16.65,16.15,8.325,8.2],['24','1/2',23,22.5,11.5,11.375],['1','1/8',.75,.25,.375,.25]
]){
 const values=Object.freeze({pod,wall}),before=JSON.stringify(values),r=calculateFoldingDimensions(values);
 equal(r.issues,[]);equal(r.missing,[]);near(r.pipeId,id);near(r.backingRingOd,ring);near(r.bottomRollerPosition,bottom);near(r.topRollerPosition,top);equal(JSON.stringify(values),before);
}
// Every existing actual-O.D. catalog row supplies actual O.D.; nominal is never passed as O.D.
for(const catalog of Object.values(TRUE_OD))for(const actualOd of Object.values(catalog)){
 const r=calculateFoldingDimensions({pod:actualOd,wall:'1/4'});near(r.pipeId,actualOd-.5);near(r.backingRingOd,actualOd-1);near(r.bottomRollerPosition,(actualOd-.5)/2);near(r.topRollerPosition,(actualOd-.5)/2-.125);
}
for(const key of ['pod','wall'])for(const invalid of ['', ' ',null,undefined,'0','-0','-1/4','+1/4','1/0','1//4','12x','1e2','NaN','Infinity','1"2','1 -1/2','--1','1'.repeat(310)]){
 const r=calculateFoldingDimensions({pod:'6 5/8',wall:'1/4',[key]:invalid});
 for(const output of ['pipeId','backingRingOd','bottomRollerPosition','topRollerPosition'])held(r[output],key+'='+invalid+' holds '+output);
 assert.ok(r.issues.length||r.missing.length);checks++;
}
for(const values of [{pod:'1',wall:'1/2'},{pod:'1',wall:'3/4'},{pod:'10000000000000000',wall:'1/4'}]){
 const r=calculateFoldingDimensions(values);equal(r.issues.length>0,true);for(const key of ['pipeId','backingRingOd','bottomRollerPosition','topRollerPosition'])held(r[key]);
}
for(const values of [{pod:'1.1',wall:'.3'},{pod:'.9',wall:'.2'}]){const r=calculateFoldingDimensions(values);held(r.backingRingOd,'Decimal boundary cannot leak a positive roundoff ring');near(r.pipeId,.5);near(r.bottomRollerPosition,.25);near(r.topRollerPosition,.125);}
const small=calculateFoldingDimensions({pod:'.75',wall:'.25'});near(small.pipeId,.25);near(small.bottomRollerPosition,.125);held(small.backingRingOd);held(small.topRollerPosition,'Zero top position is not displayed as usable');
const negativeTop=calculateFoldingDimensions({pod:'.6',wall:'.25'});near(negativeTop.bottomRollerPosition,.05);held(negativeTop.topRollerPosition);held(negativeTop.backingRingOd);
const tiny=calculateFoldingDimensions({pod:'1.00001',wall:'.25'});near(tiny.backingRingOd,.00001);equal(helperReference('foldinghelper',{pod:'1.00001',wall:'.25'}).tables[1].rows[1][1],'<0.0001 in','Positive sub-resolution dimension does not round to a plausible zero');
const precision=calculateFoldingDimensions({pod:'9007199254740992',wall:'1'});held(precision.backingRingOd);held(precision.topRollerPosition);equal(precision.issues.some(x=>x.includes('precision')),true);
const underflow=calculateFoldingDimensions({pod:'0.'+'0'.repeat(322)+'15',wall:'0.'+'0'.repeat(323)+'5'});equal(underflow.pipeId,Number.MIN_VALUE);held(underflow.bottomRollerPosition,'Numerical underflow must not display a plausible zero roller position');
const independent=calculateFoldingHead({pod:'6 5/8',wall:'1/4',md:'bad',ld:'',start:'-1/2'});held(independent.setPoint);near(independent.dimensions.backingRingOd,5.625);near(independent.dimensions.topRollerPosition,2.9375);
const operation={state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6.125',bcoCutterOD:'4',future:{raw:['1/4','invalid']}}},raw=JSON.stringify(operation);
const transfer=currentPipeReferenceValues('foldinghelper',operation);equal(transfer.values,{pod:'6.625',wall:'0.25'});near(calculateFoldingDimensions(transfer.values).backingRingOd,5.625);equal(JSON.stringify(operation),raw);
equal(parseHelperMeasurement('-0 1/2'),-.5,'Existing signed fraction convention preserved for set-point inputs');
const view=helperReference('foldinghelper',{pod:'6 5/8',wall:'1/4'});equal(view.tables[0].rows[0][1],'Not available');equal(view.tables[1].rows.map(row=>row[1]),['6.1250 in','5.6250 in','3.0625 in','2.9375 in']);
equal(view.lists[0].items.some(x=>x.includes('not wheel diameters')&&x.includes('endpoint')),true);
console.log('PASS '+checks+' Folding Head dimension checks: actual O.D., fractions, independent inputs, missing/invalid/geometry/precision boundaries, positive result guards, source/datum labels and no job mutation.');

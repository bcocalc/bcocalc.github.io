import {DATA} from './reference-data.mjs?v=pre-alpha26';
import {geometry,number,stepsFor} from './model.mjs?v=pre-alpha26';
import {htpChartRow} from './families.mjs?v=pre-alpha26';

export const FEED_RATE=0.004;
export const ETA_MACHINES={'360':'360 / 152','660':'660 / 760','1200':'1200-M120'};
export function machineProfile(name) {
  const text=String(name||'').trim();
  if(/^(?:HTM\s*)?360(?:\s*\/\s*152)?$/i.test(text))return '360';
  if(/^(?:HTM\s*)?(?:660|760)(?:\s*\/\s*760)?$/i.test(text))return '660';
  if(/^(?:HTM\s*)?(?:1200(?:-M120)?|M120)$/i.test(text))return '1200';
  return '';
}
export function rpmMatch(machine,sizeValue) {
  const size=number(sizeValue),chart=DATA.rpm[machine];
  if(!chart||!(size>0))return {values:[],basis:'unavailable',sizes:[]};
  if(chart[String(size)])return {values:[...chart[String(size)]],basis:'exact',sizes:[size]};
  const sizes=Object.keys(chart).map(Number).sort((a,b)=>a-b);
  if(size<sizes[0]||size>sizes.at(-1)) {
    const closest=size<sizes[0]?sizes[0]:sizes.at(-1);
    return {values:[...chart[closest]],basis:'nearest',sizes:[closest]};
  }
  const lower=sizes.filter(item=>item<size).at(-1),upper=sizes.find(item=>item>size);
  const low=chart[lower],high=chart[upper],ratio=(size-lower)/(upper-lower);
  const values=Array.from({length:Math.max(low.length,high.length)},(_,index)=>{
    const a=low[index]??low.at(-1),b=high[index]??high.at(-1);
    return Number((a+(b-a)*ratio).toFixed(2));
  });
  return {values,basis:'interpolated',sizes:[lower,upper]};
}
export function etaFor(operation,machineName='') {
  if(stepsFor(operation).includes('htp')){
    const state=operation.state,chart=htpChartRow(state),profile=state.htpMachine??'360',size=chart?.cutter??'',match=rpmMatch(profile,size),rpm=match.values,distance=chart?.bco??NaN;
    const issue=!chart?'Choose an exact HTP chart row for its cutter and BCO.':!rpm.length?'Choose a supported HTP RPM profile; saved unknown or empty profiles have no ETA.':'';
    return {family:'htp',profile,size,match,manual:false,distance,feedRate:FEED_RATE,rpm,issue,lowMinutes:issue?NaN:distance/(Math.max(...rpm)*FEED_RATE),highMinutes:issue?NaN:distance/(Math.min(...rpm)*FEED_RATE)};
  }
  if(stepsFor(operation).includes('hiStop'))return {family:'hiStop',profile:'',size:'',match:{values:[],basis:'unavailable',sizes:[]},manual:false,distance:NaN,feedRate:NaN,rpm:[],issue:'Cutting-time ETA is not connected for Hi-Stop. No standard Hot Tap or HTP estimate is substituted.',lowMinutes:NaN,highMinutes:NaN};
  const state=operation.state,profile=state.etaMachine??machineProfile(machineName);
  const size=String(state.etaCutterSize??'').trim()?state.etaCutterSize:state.bcoCutterOD;
  const match=rpmMatch(profile,size),manual=String(state.etaRpmOverride??'').trim()!=='';
  const rpm=manual?[number(state.etaRpmOverride)]:match.values;
  const distance=geometry(state).bco;
  let issue='';
  if(!stepsFor(operation).includes('tap'))issue='Cutting-time ETA is only connected for standard Hot Tap stages.';
  else if(!(number(size)>0))issue='Enter a valid cutter size for the RPM lookup.';
  else if(!rpm.length)issue='No RPM chart is selected for this machine. Select a supported profile or enter a verified manual RPM.';
  else if(!rpm.every(value=>Number.isFinite(value)&&value>0))issue='Manual RPM must be a valid number greater than zero; it is not silently replaced by chart RPM.';
  else if(!(distance>0)&&distance!==0)issue='Valid pipe and cutter dimensions are needed for a cutting-time estimate.';
  const fast=Math.max(...rpm),slow=Math.min(...rpm);
  return {profile,size,match,manual,distance,feedRate:FEED_RATE,rpm,issue,
    lowMinutes:issue?NaN:distance/(fast*FEED_RATE),highMinutes:issue?NaN:distance/(slow*FEED_RATE)};
}
export function formatEta(minutes) {
  if(!Number.isFinite(minutes)||minutes<0)return 'Not calculated';
  const total=Math.round(minutes*60),hours=Math.floor(total/3600),mins=Math.floor(total%3600/60),secs=total%60;
  return (hours?hours+' hr ':'')+mins+' min '+secs+' sec';
}

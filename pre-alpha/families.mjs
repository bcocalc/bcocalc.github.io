// Existing legacy chart/formulas only. No equipment ratings or applicability inferred.
import {DATA} from './reference-data.mjs?v=pre-alpha21';
export const HTP_CHART=DATA.htp;
export const HTP_INPUTS=[['htpMd','HTP measured distance (MD)'],['htpLd','HTP lost distance (LD)'],['htpPtc','HTP pilot to cutter (PTC)']];
export const HISTOP_INPUTS=[['hsMd','Hi-Stop measured distance (MD)'],['hsLd','Hi-Stop lost distance (LD)'],['hsRl','Reamer length (RL)'],['hsCl','Cutter length (CL)'],['hsPtc','Hi-Stop pilot to cutter (PTC)'],['hsRcd','RCD'],['hsPb','Plug bottom (PB)'],['hsPtp','Plug taper (source value)']];
export function familyFor(operation,type){
  if(type==='HTP')return 'htp';
  if(type==='Hi-Stop')return 'hiStop';
  if(type==='Line Stop'&&!operation.workflowType&&['htp','hiStop'].includes(operation.state?.lineStopVariant))return operation.state.lineStopVariant;
  return '';
}
export function htpChartRow(state){const key=String(state.htpPipeSize??'');return Object.hasOwn(HTP_CHART,key)?HTP_CHART[key]:null;}
// The legacy UI disables hsPod and synchronizes it from BCO geometry.
// Saved per-stage hsPod is retained as inactive input, never a second authority.
export function hiStopPipeOD(_state,_parse,pipeOD){return pipeOD;}
export function familyResults(state,family,parse,pipeOD){
  const n=key=>parse(state[key]),signed=(key,sign)=>n(key)*(state[sign]==='-'?-1:1);
  if(family==='htp'){
    const chart=htpChartRow(state),bco=chart?.bco??NaN;
    return [['Total cut out (TCO)',n('htpMd')+signed('htpLd','htpLdSign')+n('htpPtc')+bco],['Chart BCO',bco]];
  }
  if(family==='hiStop'){
    const md=n('hsMd'),ld=signed('hsLd','hsLdSign'),pod=hiStopPipeOD(state,parse,pipeOD),taper=n('hsPtp'),rcd=n('hsRcd'),pb=n('hsPb'),rl=n('hsRl'),cl=n('hsCl');
    const tco=[rl,pod,cl].every(Number.isFinite)?rl/2+pod/2+cl+n('hsPtc'):NaN;
    const psd=[rcd,pb,taper].every(Number.isFinite)&&taper!==0?(rcd-pb)/(2*taper)+0.25:NaN;
    const plugSet=Number.isFinite(psd)&&Number.isFinite(pod)?psd+md+ld+pod/2:NaN;
    return [['Lower in',md+ld],['Total cut out (TCO)',tco],['PSD',psd],['Plug Set',plugSet]];
  }
  return [];
}
export function familyWarnings(operation,family,parse,pipe){
  const state=operation.state,warnings=[],has=value=>String(value??'').trim()!=='';
  const add=(code,message,kind='warning')=>warnings.push({stage:family,code,message,kind});
  const definitions=family==='htp'?HTP_INPUTS:HISTOP_INPUTS;
  const missing=definitions.filter(([key])=>key!=='hsPod'&&!has(state[key]));
  if(missing.length)add('missing-inputs','Enter '+missing.map(([,label])=>label).join(', ')+'.','missing');
  for(const [key,label]of definitions)if(has(state[key])&&!Number.isFinite(parse(state[key])))add('invalid-'+key,label+' must be a valid number or fraction.');
  if(family==='htp'){
    if(!htpChartRow(state))add('htp-chart','Choose one of the eight exact HTP chart rows. Unlisted sizes have no HTP calculation.');
  }else{
    const pod=hiStopPipeOD(state,parse,pipe.od),values=Object.fromEntries(familyResults(state,family,parse,pipe.od));
    const pipeCheck=(code,message)=>warnings.push({stage:'pipe',code,message,kind:'warning'});
    if(has(state.preAlphaPipeOD)&&!Number.isFinite(parse(state.preAlphaPipeOD)))pipeCheck('invalid-pipe-od','Actual pipe O.D. must be a valid number or fraction.');
    if(Number.isFinite(pipe.od)&&pipe.od<=0)pipeCheck('pipe-od','Pipe O.D. must be greater than zero.');
    const id=parse(state.bcoPipeID);
    if(has(state.bcoPipeID)&&(!Number.isFinite(id)||!(id>0)||id>=pipe.od))pipeCheck('pipe-id','Pipe I.D. must be a valid number greater than zero and smaller than pipe O.D.');
    if(!Number.isFinite(pod))add('histop-pod','Enter a valid actual pipe O.D. in Pipe & cutter for Hi-Stop POD.');
    if(has(state.hsPod)&&(!Number.isFinite(parse(state.hsPod))||parse(state.hsPod)!==pod))add('histop-pod-source','Saved Hi-Stop POD '+String(state.hsPod)+' is retained as inactive input. Current Hi-Stop POD comes from actual O.D. in Pipe & cutter. Review this source difference.');
    if(parse(state.hsPtp)===0)add('histop-taper','Plug taper must be nonzero to calculate PSD and Plug Set.');
    if(!Number.isFinite(values['PSD']))add('histop-psd','Enter valid RCD, plug bottom and nonzero plug taper to calculate PSD and Plug Set.');
    if(Number.isFinite(pipe.wall)&&pipe.wall>0&&pipe.wall<0.25)add('histop-thin-wall','Training notes call for a schedule 40 minimum wall thickness. Double-check the planned Hi-Stop application.');
    if(!Number.isFinite(pipe.wall))add('histop-wall-unchecked','Pipe wall thickness is unavailable; the existing minimum-wall comparison has not been checked.','info');
    if(Number.isFinite(values['Plug Set'])&&values['Plug Set']<0)add('histop-negative-plug-set','Plug Set is negative. Recheck MD / LD sign and PSD inputs.');
  }
  return warnings;
}

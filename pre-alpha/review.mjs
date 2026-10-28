import {etaFor} from './eta.mjs?v=pre-alpha19';
import {geometry,pipeOD,number,stepsFor,resultsFor,hotTapWarnings,pipeSourceWarning,hotTapLostDistance} from './model.mjs?v=pre-alpha19';

export const STAGE_TITLES={pipe:'Pipe & cutter',tap:'Hot Tap',stop:'Line Stop',plug:'Completion Plug',saved:'Saved measurements',eta:'Cutting time (ETA)'};
const INPUTS={
  pipe:[['preAlphaPipeOD','Actual pipe O.D.'],['bcoPipeID','Pipe I.D.'],['bcoCutterOD','Cutter O.D.'],['bcoCutterID','Cutter I.D.']],
  tap:[['md','Measured distance (MD)'],['ld','Lost distance (LD)'],['ptc','Pilot to cutter (PTC)'],['start','Rod start'],['mt','Machine travel']],
  stop:[['lsMd','Measured distance (MD)'],['lsLd','Lost distance (LD)'],['lsTravel','Line stop travel'],['lsMachineTravel','Machine travel']],
  plug:[['cpStart','Start'],['cpJbf','Jack bolt flange (JBF)'],['cpLd','Lost distance (LD)'],['cpPt','Plug thickness (PT)']]
};
const has=value=>String(value ?? '').trim()!=='';
const manual=(state,stage)=>[true,'true'].includes(state[stage==='stop'?'lsLiManualToggle':'cpLiManualToggle']);
const valueFor=(state,key)=>key==='preAlphaPipeOD'?pipeOD(state):key==='ld'&&!has(state.ld)?hotTapLostDistance(state):state[key];
const finite=value=>Number.isFinite(number(value));

export function operationWarnings(operation,machineName='') {
  const state=operation.state, steps=stepsFor(operation), warnings=[];
  const add=(stage,code,message,kind='warning')=>warnings.push({stage,code,message,kind});
  if(steps.includes('saved')) {
    add('saved','unsupported','Equipment-specific calculations are not connected in Pre-Alpha. Saved values are for review only.');
    return warnings;
  }
  const g=geometry(state);
  for(const stage of steps.filter(key=>INPUTS[key])) {
    const override=(stage==='stop'||stage==='plug')&&manual(state,stage);
    const manualKey=stage==='stop'?'lsLiManual':'cpLiManual';
    let required=stage==='pipe'?(steps.includes('tap')?['preAlphaPipeOD','bcoPipeID','bcoCutterOD']:[]):stage==='tap'?['md','ptc','start']:stage==='stop'?['lsMd','lsLd']:['cpStart','cpJbf','cpLd','cpPt'];
    if(override) required=[manualKey];
    const definitions=override?[[manualKey,'Manual lower in'],...INPUTS[stage].filter(([key])=>['lsTravel','lsMachineTravel'].includes(key))]:INPUTS[stage];
    const missing=definitions.filter(([key])=>required.includes(key)&&(key==='preAlphaPipeOD'?!Number.isFinite(g.od)&&!has(state.preAlphaPipeOD):!has(state[key])));
    if(missing.length) add(stage,'missing-inputs','Enter '+missing.map(([,label])=>label).join(', ')+'.','missing');
    for(const [key,label] of definitions) {
      const value=valueFor(state,key);
      if(has(value)&&!finite(value)&&!(key==='preAlphaPipeOD'&&Number.isNaN(value))) add(stage,'invalid-'+key,label+' must be a valid number or fraction.');
    }
    if(stage==='stop'||stage==='plug') {
      if(override) {
        const calculated=resultsFor({...operation,state:{...state,[stage==='stop'?'lsLiManualToggle':'cpLiManualToggle']:false}},stage)[0][1];
        add(stage,'manual-override','Manual lower-in override is active.'+(Number.isFinite(calculated)?' Setup-based lower in would be '+calculated.toFixed(4)+' in.':' Setup-based lower in is not available.'));
      }
      const li=resultsFor(operation,stage)[0][1];
      if(Number.isFinite(li)&&li<0) add(stage,'negative-lower-in',override?'Manual lower in is negative. Recheck the entered override.':'Lower in is negative. Recheck '+(stage==='stop'?'MD, LD, its sign, and pipe dimensions.':'Start, JBF, LD, and plug thickness.'));
    }
  }
  const pipeNeeded=steps.includes('tap')||steps.includes('stop');
  const enteredPipe=has(state.bcoPipeID)||has(state.preAlphaPipeOD)||has(state.bcoPipeOD);
  if(pipeNeeded||enteredPipe) {
    if(Number.isFinite(g.od)&&g.od<=0) add('pipe','pipe-od','Pipe O.D. must be greater than zero.');
    if(Number.isFinite(g.id)&&(!(g.id>0)||g.id>=g.od)) add('pipe','pipe-id','Pipe I.D. must be greater than zero and smaller than pipe O.D.');
    if(steps.includes('stop')&&!Number.isFinite(g.wall)&&!manual(state,'stop')) add('stop','pipe-geometry','Pipe O.D. and I.D. are needed to calculate line-stop wall thickness.');
  }
  if(has(state.preAlphaPipeOD)&&!finite(state.preAlphaPipeOD)) add('pipe','invalid-pipe-od','Actual pipe O.D. must be a valid number or fraction.');
  if(steps.includes('tap')) {
    if(Number.isFinite(g.cutter)&&(g.cutter<=0||g.cutter>g.id)) add('pipe','cutter-od','Cutter O.D. must be greater than zero and no larger than pipe I.D.');
    const cid=number(state.bcoCutterID);
    if(has(state.bcoCutterID)&&Number.isFinite(cid)&&(cid<=0||cid>=g.cutter||cid>g.id)) add('pipe','cutter-id','Cutter I.D. must be greater than zero, smaller than cutter O.D., and no larger than pipe I.D.');
    for(const warning of hotTapWarnings(operation)) warnings.push({...warning,stage:'tap',kind:'warning'});
    if(number(state.ptc)<0) add('tap','negative-ptc','PTC cannot be negative. Recheck the pilot-to-cutter measurement.');
    if(!has(state.mt)) add('tap','travel-unchecked','Machine travel is not entered; Hot Tap travel has not been checked.','info');
    else if(finite(state.mt)&&number(state.mt)<=0) add('tap','invalid-mt','Machine travel must be greater than zero to check the travel limit.');
    if(resultsFor(operation,'tap').find(([label])=>label==='Lower in')[1]<0) add('tap','negative-lower-in','Lower in is negative. Recheck MD, LD, and its sign.');
    if(has(state.htActualPop)) add('tap','actual-pop-retained','Saved actual POP is retained but is not applied in Pre-Alpha. Results use the setup measurements.','info');
  }
  if(steps.includes('stop')) {
    const travel=number(state.lsTravel),machine=number(state.lsMachineTravel);
    if(Number.isFinite(travel)&&Number.isFinite(machine)&&travel>machine) add('stop','machine-travel','Line Stop travel exceeds machine travel by '+(travel-machine).toFixed(4)+' in.');
    if(!has(state.lsTravel)||!has(state.lsMachineTravel)) add('stop','travel-unchecked','Optional Line Stop travel check is incomplete; travel margin has not been checked.','info');
    if(travel<0) add('stop','negative-travel','Line Stop travel cannot be negative.');
    if(has(state.lsMachineTravel)&&Number.isFinite(machine)&&machine<=0) add('stop','invalid-machine-travel','Machine travel must be greater than zero to check the travel limit.');
    const change=pipeSourceWarning(operation);if(change)warnings.push(change);
  }
  if(steps.includes('tap')){
    const eta=etaFor(operation,machineName),configured=['etaMachine','etaCutterSize','etaRpmOverride'].some(key=>has(state[key]));
    if(configured&&eta.issue)add('eta','eta-input',eta.issue);
    else if(!eta.issue&&eta.manual)add('eta','eta-manual','Manual RPM override is active for ETA. Verify the speed and cutting conditions.');
    else if(!eta.issue&&eta.match.basis==='nearest')add('eta','eta-nearest','ETA uses the nearest charted cutter size because this size is outside the selected RPM chart. Confirm the equipment speed chart.');
    if(has(state.etaBco)&&number(state.etaBco)!==eta.distance)add('eta','eta-distance-source','Saved ETA distance '+String(state.etaBco)+' is retained but not used. The estimate follows current Pipe & cutter BCO.','info');
  }
  return warnings;
}

export function reviewSections(operation) {
  const state=operation.state;
  return stepsFor(operation).filter(stage=>INPUTS[stage]).map(stage=>{
    const override=(stage==='stop'||stage==='plug')&&manual(state,stage);
    const manualKey=stage==='stop'?'lsLiManual':'cpLiManual';
    const inputs=INPUTS[stage].map(([key,label])=>{
      let value=valueFor(state,key), note='';
      if(key==='ld'||key==='lsLd')note=state[key==='ld'?'ldSign':'lsLdSign']==='-'?'Subtract (-)':'Add (+)';
      return {key,label,value,note};
    });
    if(stage==='stop')inputs.push({key:'pipe-source-od',label:'Pipe O.D.',value:pipeOD(state),note:'From Pipe & cutter; not a separate input'});
    const retained=!override&&['stop','plug'].includes(stage)&&has(state[manualKey])
      ? [{key:manualKey,label:'Inactive saved manual lower in',value:state[manualKey]}] : [];
    if(stage==='stop'&&operation.retiredLineStopOD)retained.push({key:'previous-pipe-od',label:'Archived Line Stop O.D. (not used)',value:operation.retiredLineStopOD.value});
    return {stage,title:STAGE_TITLES[stage],mode:override?'Manual override':'Calculated from setup',
      results:resultsFor(operation,stage),inputs,retained,override};
  });
}

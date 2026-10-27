import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dev/measurement.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const normalize=source.slice(source.indexOf('function normalizeMode(mode) {'),source.indexOf('function getStoredCalcMode()'));
const setter=source.slice(source.indexOf('function setMode(mode) {'),source.indexOf('\nwindow.setMode = setMode;'));
assert.match(normalize,/function normalizeMode/);
assert.match(setter,/function setMode/);
const classes=()=>({active:false,toggle(name,on){assert.equal(name,'active');this.active=on;}});
const panels=Object.fromEntries(['bco','eta','hotTap','htp','lineStop','completionPlug'].map(key=>[key,{classList:classes()}]));
const calls=[],stored=new Map(),buttons={calc:'',workflow:''};
const context=vm.createContext({
  panels,CALC_SCREEN_MODES:new Set(['bco','eta']),WORKFLOW_SCREEN_MODES:new Set(['hotTap','lineStop','completionPlug']),
  CALC_MODE_KEY:'calc-mode',WORKFLOW_MODE_KEY:'workflow-mode',
  syncCalcModeButtons(mode){buttons.calc=mode;},syncWorkflowModeButtons(mode){buttons.workflow=mode;},
  localStorage:{setItem(key,value){stored.set(key,value);}},
  syncBcoToEta(options){calls.push(['sync',options.force]);},updateEtaEstimate(){calls.push(['estimate']);}
});
vm.runInContext(normalize+setter,context);
const set=mode=>context.setMode(mode);
const active=keys=>keys.filter(key=>panels[key]?.classList.active);
const calculators=['bco','eta'],workflows=['hotTap','lineStop','completionPlug'];
set('bco');set('hotTap');
assert.deepEqual(active(calculators),['bco'],'Background workflow selection must not deactivate BCO');
assert.deepEqual(active(workflows),['hotTap']);
for(const calculator of calculators){
  set(calculator);
  for(const workflow of workflows){
    set(workflow);
    assert.deepEqual(active(calculators),[calculator]);
    assert.deepEqual(active(workflows),[workflow]);
    assert.equal(buttons.calc,calculator);
    assert.equal(buttons.workflow,workflow);
    assert.equal(stored.get('calc-mode'),calculator);
    assert.equal(stored.get('workflow-mode'),workflow);
    set(calculator);
    assert.deepEqual(active(workflows),[workflow],'Calculator selection must retain workflow selection');
  }
}
set('htp');
assert.deepEqual(active(workflows),['hotTap'],'Legacy HTP alias stays normalized to Hot Tap');
assert.deepEqual(active(calculators),['eta']);
assert.equal(panels.htp.classList.active,false);
const before=JSON.stringify({buttons,storage:[...stored],calls,active:active(Object.keys(panels))});
set('unknown');
assert.equal(JSON.stringify({buttons,storage:[...stored],calls,active:active(Object.keys(panels))}),before);
const missing=panels.lineStop;panels.lineStop=null;set('lineStop');panels.lineStop=missing;
assert.equal(JSON.stringify({buttons,storage:[...stored],calls,active:active(Object.keys(panels))}),before);
assert.ok(calls.length>0);
for(let index=0;index<calls.length;index+=2){
  assert.deepEqual(calls[index],['sync',true]);
  assert.deepEqual(calls[index+1],['estimate']);
}
console.log('PASS dev mode owner: actual setter preserves independent calculator/workflow panels, selections and storage keys; aliases, missing/unknown modes and ETA refresh remain unchanged');

import assert from 'node:assert/strict';
import {installHelp} from '../pre-alpha/help.mjs';

// Run the real help owner with a minimal DOM and a controllable clock. No browser,
// network, production storage, or wall-clock sleeps are involved in these checks.
function harness() {
  let now=0,nextTimer=0,tooltip;
  const timers=new Map(),saved=new Map();
  const events=()=>({listeners:new Map(),addEventListener(type,handler){const handlers=this.listeners.get(type)||[];handlers.push(handler);this.listeners.set(type,handlers);}});
  const document={...events(),activeElement:null,createTreeWalker:()=>({nextNode:()=>false})};
  const dispatch=(owner,type,target,extra={})=>{
    const event={target,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
    for(const handler of owner.listeners.get(type)||[]){handler(event);if(event.stopped)break;}
    return event;
  };
  function element(term='') {
    const attributes=new Map();
    return {...events(),dataset:term?{helpTerm:term}:{},style:{},hidden:false,isConnected:true,hovered:false,
      append(child){child.parentElement=this;child.isConnected=true;},
      getAttribute:name=>attributes.get(name)??null,
      setAttribute(name,value){attributes.set(name,String(value));},removeAttribute:name=>attributes.delete(name),
      getBoundingClientRect:()=>({left:20,top:100,bottom:125,height:25}),
      closest(selector){
        if(selector==='[data-help-term],[data-help-field],[data-term-tip]')return this.dataset.helpTerm||this.dataset.helpField||this.dataset.termTip?this:null;
        if(selector==='.term-tooltip')return this===tooltip?this:null;
        return null;
      },
      matches(selector){
        if(selector===':focus')return document.activeElement===this;
        if(selector===':hover')return this.hovered;
        if(selector==='[data-help-term],[data-help-field]')return Boolean(this.dataset.helpTerm||this.dataset.helpField);
        if(selector==='abbr[data-help-term]')return Boolean(this.dataset.helpTerm);
        return false;
      },
      click(){return dispatch(document,'click',this);}
    };
  }
  const body=element();document.body=body;document.activeElement=body;
  document.createElement=()=>tooltip=element();
  const globals={document,window:events(),NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}},innerWidth:390,innerHeight:740,
    setTimeout(callback,delay){const id=++nextTimer;timers.set(id,{at:now+delay,callback});return id;},
    clearTimeout(id){timers.delete(id);}
  };
  for(const [key,value]of Object.entries(globals)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
  const api=installHelp(body);
  return {
    api,document,tooltip,element,
    pending:()=>timers.size,
    tick(milliseconds){
      const end=now+milliseconds;
      while(true){const next=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;const [id,timer]=next;timers.delete(id);now=timer.at;timer.callback();}
      now=end;
    },
    focus(next){const previous=document.activeElement;if(next===previous)return;document.activeElement=next||body;if(previous)dispatch(document,'focusout',previous);if(next)dispatch(document,'focusin',next);},
    pointer(type,target){dispatch(target,type,target);return dispatch(document,type,target);},
    click:target=>dispatch(document,'click',target),
    key:key=>dispatch(document,'keydown',document.activeElement,{key}),
    close:()=>dispatch(document,'close',body),
    restore(){for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
  };
}

let checks=0;
function check(name,run){const h=harness();try{run(h);checks++;console.log('PASS help timers: '+name);}finally{h.restore();}}
const shown=(h,element)=>{assert.equal(h.tooltip.hidden,false);assert.equal(element.getAttribute('aria-describedby'),'term-tooltip');};
const hidden=(h,element)=>{assert.equal(h.tooltip.hidden,true);assert.equal(element.getAttribute('aria-describedby'),null);};

check('MD to plain input to MD keeps focused help after every old deadline',h=>{
  const md=h.element('MD'),input=h.element();
  h.focus(md);h.key('Escape');hidden(h,md);
  h.focus(input);h.tick(30);h.focus(md);shown(h,md);
  h.tick(1000);shown(h,md);assert.equal(h.pending(),0);
});
check('multiple focus exits replace the pending dismissal instead of leaking timers',h=>{
  const md=h.element('MD'),first=h.element(),second=h.element();
  h.focus(md);h.focus(first);h.tick(30);h.focus(second);
  assert.equal(h.pending(),1);h.tick(90);shown(h,md);
  h.tick(30);hidden(h,md);assert.equal(h.pending(),0);
});
check('mixed pointer and focus exits have one owner and refocus cancels it',h=>{
  const md=h.element('MD'),input=h.element();
  h.pointer('pointerover',md);h.pointer('pointerout',md);h.tick(20);
  h.focus(input);h.pointer('pointerout',md);assert.equal(h.pending(),1);
  h.focus(md);h.tick(1000);shown(h,md);assert.equal(h.pending(),0);
});
check('pointer re-entry and hovering the tooltip preserve help; leaving dismisses it',h=>{
  const md=h.element('MD');h.pointer('pointerover',md);
  h.pointer('pointerout',md);h.tick(100);h.pointer('pointerover',md);h.tick(1000);shown(h,md);
  h.pointer('pointerout',md);h.tooltip.hovered=true;h.pointer('pointerover',h.tooltip);h.tick(1000);shown(h,md);
  h.tooltip.hovered=false;h.pointer('pointerout',h.tooltip);hidden(h,md);assert.equal(h.pending(),0);
});
check('unfocused hover dismissal still runs at its existing deadline',h=>{
  const md=h.element('MD');h.pointer('pointerover',md);h.pointer('pointerout',md);
  h.tick(179);shown(h,md);h.tick(1);hidden(h,md);assert.equal(h.pending(),0);
});
check('Escape, explicit hide and dialog close cancel pending work before later help',h=>{
  for(const dismiss of [()=>h.key('Escape'),()=>h.api.hide(),()=>h.close()]){
    const md=h.element('MD'),ld=h.element('LD');h.pointer('pointerover',md);h.pointer('pointerout',md);
    dismiss();hidden(h,md);assert.equal(h.pending(),0);
    h.focus(ld);h.tick(1000);shown(h,ld);assert.equal(md.getAttribute('aria-describedby'),null);
    h.api.hide();
  }
});
check('click pinning, outside clicks, and repeated keyboard activation still work',h=>{
  const md=h.element('MD'),input=h.element();
  h.focus(md);assert.equal(h.key('Enter').defaultPrevented,true);
  h.focus(input);h.pointer('pointerout',md);h.tick(1000);shown(h,md);assert.equal(h.pending(),0);
  h.click(input);hidden(h,md);
  h.focus(md);h.key(' ');shown(h,md);h.key(' ');hidden(h,md);
  h.key('Enter');shown(h,md);const escape=h.key('Escape');assert.ok(escape.defaultPrevented&&escape.stopped);hidden(h,md);
});
check('changing targets clears the old description and disconnected targets close safely',h=>{
  const md=h.element('MD'),ld=h.element('LD');h.focus(md);h.focus(ld);shown(h,ld);assert.equal(md.getAttribute('aria-describedby'),null);
  h.pointer('pointerout',ld);ld.isConnected=false;h.api.decorate();hidden(h,ld);assert.equal(h.pending(),0);
});
check('field-help buttons share the same timer owner without losing their label',h=>{
  const button=h.element(),input=h.element();button.dataset.helpField='ptc';button.setAttribute('aria-label','Help for Pilot-to-cutter');
  h.focus(button);h.focus(input);h.focus(button);h.tick(1000);shown(h,button);
  assert.match(h.tooltip.textContent,/Help for Pilot-to-cutter/);h.click(button);h.focus(input);h.tick(1000);shown(h,button);
  h.key('Escape');hidden(h,button);assert.equal(h.pending(),0);
});

console.log('PASS '+checks+' deterministic help timer groups; browser event integration remains in the pre-alpha UI suite.');

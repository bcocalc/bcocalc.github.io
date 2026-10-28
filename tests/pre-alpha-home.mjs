import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import * as model from '../pre-alpha/model.mjs';
import {memoryDatabase} from './pre-alpha-memory-database.mjs';

// Execute the real workspace owner with synthetic DOM/storage/history. This is
// network-free behavioral coverage, not a claim of browser/layout validation.
const source=readFileSync(new URL('../pre-alpha/workspace.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const html=readFileSync(new URL('../pre-alpha/index.html',import.meta.url),'utf8');
const imports={};
for(const match of source.matchAll(/import \{([^}]+)\} from '([^']+)';/g)){
  const values=await import(new URL(match[2],new URL('../pre-alpha/workspace.mjs',import.meta.url)));
  for(const name of match[1].split(',').map(s=>s.trim()))imports[name]=values[name];
}
async function harness({jobs=[],activeId=jobs[0]?.id,hash=''}={}) {
  const nodes=new Map(),writes=[],listeners=new Map(),windowListeners=new Map(),historyEntries=[];
  const memory=new Map([['measurementCardHistoryV1','[]'],['measurementCardStateV1','{"keep":"live"}']]);
  if(jobs.length)memory.set(model.STORAGE_KEY,JSON.stringify({build:model.BUILD,activeId,jobs}));
  const document={activeElement:null,addEventListener:(type,fn)=>listeners.set(type,[...(listeners.get(type)||[]),fn])};
  function node(id,dataset={}){
    if(nodes.has(id))return nodes.get(id);
    const attrs=new Map(),events=new Map(),classes=new Set();
    const el={id,dataset,hidden:['workspace','library','references','settings','job-workspace','resume','resume-job','app-menu'].includes(id),value:'',textContent:'',innerHTML:'',disabled:false,
      classList:{toggle:(name,on)=>on===undefined?(classes.has(name)?classes.delete(name):classes.add(name)):on?classes.add(name):classes.delete(name),contains:name=>classes.has(name)},
      addEventListener:(type,fn)=>events.set(type,fn),dispatch:(type,event={})=>events.get(type)?.({target:el,preventDefault(){},...event}),
      setAttribute:(name,value)=>attrs.set(name,String(value)),removeAttribute:name=>attrs.delete(name),getAttribute:name=>attrs.get(name)??null,
      querySelector:selector=>selector==='h1'?node(id==='workspace'?'job-title':id+'-title'):null,
      querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,right:500}),insertAdjacentHTML(position,markup){this.innerHTML+=markup;},
      focus(){document.activeElement=el;},closest(selector){if(selector==='button')return el;if(selector==='[hidden]')return el.hidden?el:null;return null;},
      showModal(){el.open=true;},close(){el.open=false;}
    };nodes.set(id,el);return el;
  }
  document.body=node('body');document.activeElement=document.body;
  const navs=[...html.matchAll(/<(?:button|a)[^>]+data-page="([^"]+)"[^>]*>/g)].map((m,i)=>node('nav'+i,{page:m[1]}));
  document.getElementById=id=>node(id);
  document.querySelectorAll=selector=>selector==='[data-page]'?navs:selector==='dialog[open]'?[...nodes.values()].filter(n=>n.open):[];
  document.querySelector=selector=>selector==='.unit-label'?node('unit-label'):null;
  const location={hash};let position=0;
  const history={state:null,pushState(state,unused,url){this.state=state;location.hash=url;historyEntries.splice(++position);historyEntries.push({state,hash:url});},replaceState(state,unused,url){this.state=state;location.hash=url;historyEntries[position]={state,hash:url};}};
  const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{writes.push(key);memory.set(key,String(value));}};
  const window={scrollY:0,scrollTo({top}){this.scrollY=top;},addEventListener:(type,fn)=>windowListeners.set(type,fn),tapCalcCloud:{list:async()=>[]}};
  let lockQueue=Promise.resolve();
  const locks={request(name,options,callback){const next=lockQueue.then(callback);lockQueue=next.catch(()=>{});return next;}};
  const database=memoryDatabase({beforeWrite:()=>writes.push('indexedDB')});
  const store=imports.createWorkspaceStore({storage,locks,database});await store.ready;
  const context=vm.createContext({...imports,createWorkspaceStore:()=>store,initAuxiliary:()=>({closeMenu(){node('app-menu').hidden=true;}}),installHelp:()=>{},document,window,location,history,localStorage:storage,navigator:{locks},crypto:{randomUUID},structuredClone,setTimeout:()=>0,clearTimeout(){},console});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace('await workspaceStore.ready','workspaceStore.ready'),context);
  const run=code=>vm.runInContext(code,context);
  const flush=()=>run('typeof saveQueue === \"undefined\" ? Promise.resolve() : saveQueue');
  await flush();
  return {node,storage,writes,run,history,location,historyEntries,navs,flush,
    saved:()=>JSON.parse(run('JSON.stringify(typeof workspaceStore === "undefined" ? JSON.parse(localStorage.getItem(STORAGE_KEY)) : workspaceStore.read())')),
    raw:()=>JSON.stringify([...memory]),
    externalLegacy(value){memory.set(model.STORAGE_KEY,JSON.stringify(value));windowListeners.get('storage')({key:model.STORAGE_KEY});},
    async externalSave(value){const other=imports.createWorkspaceStore({storage,locks,database,uuid:randomUUID});await other.ready;await other.save(value,other.read().versions.get(value.id)??null);await windowListeners.get('storage')({key:imports.WORKSPACE_KEY});},
    hold(){let release;const gate=new Promise(resolve=>release=resolve);lockQueue=lockQueue.then(()=>gate);return release;},
    click(dataset){const target=node('action-'+randomUUID(),dataset);target.focus();for(const fn of listeners.get('click')||[])fn({target,button:0,preventDefault(){}});},
    link(dataset,modifiers={}){const target=node('link-'+randomUUID(),dataset);target.closest=selector=>selector==='a[data-page]'?target:null;target.focus();const event={target,button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...modifiers};for(const fn of listeners.get('click')||[])fn(event);return event;},
    travel(offset){position+=offset;const entry=historyEntries[position];assert.ok(entry);location.hash=entry.hash;history.state=entry.state;windowListeners.get('popstate')({state:entry.state});windowListeners.get('hashchange')({});},
    hashchange(hash){location.hash=hash;windowListeners.get('hashchange')({});},
    active:()=>JSON.parse(run('JSON.stringify(active)')),page:()=>run('currentPage'),focused:()=>document.activeElement.id
  };
}
const job=model.normalizeJob({id:'home-fixture',source:'experimental',record:{jobBundle:{selectedOperationId:'second',sharedState:{jobDescription:'Preserved draft'},operations:[{id:'first',operationType:'Hot Tap',label:'First tap',state:{md:'11'}},{id:'second',operationType:'Line Stop',label:'Second stop',state:{md:'22',lsMd:'24',lineStopMdUserEdited:true,lsLiManualToggle:true,lsLiManual:'88',cpLiManualToggle:true,cpLiManual:'99',unknownFuture:{keep:true},etaRpmOverride:'42'}}]}}});
job.operations[0].workspaceStage='tap';job.operations[1].workspaceStage='plug';
let count=0;
async function test(name,fn){await fn();console.log('PASS Home: '+name);count++;}
await test('first visit and empty workspace links show Home without creating a job',async()=>{const h=await harness();assert.equal(h.page(),'home');assert.equal(h.location.hash,'#home');assert.equal(h.node('resume-job').hidden,true);h.click({page:'workspace'});assert.equal(h.page(),'home');assert.equal(h.active(),null);assert.deepEqual(h.writes,[]);});
await test('returning bare URL shows Home and does not migrate or rewrite the stored draft',async()=>{const h=await harness({jobs:[job]});assert.equal(h.page(),'home');assert.equal(h.node('resume-title').textContent,'Preserved draft');assert.equal(h.node('resume-position').textContent,'Second stop / Completion plug');assert.equal(h.node('resume-job').hidden,false);assert.deepEqual(h.active(),job);assert.deepEqual(h.writes,[]);});
await test('explicit workspace deep link resumes selected operation and stage',async()=>{const h=await harness({jobs:[job],hash:'#workspace'});assert.equal(h.page(),'workspace');assert.equal(h.node('step-title').textContent,'Completion plug');assert.equal(h.active().selectedOperationId,'second');});
await test('Home / Resume retains every value, original bundle, operation, stage and override',async()=>{const h=await harness({jobs:[job],hash:'#workspace'}),before=JSON.stringify(h.active()),stored=h.raw(),writes=h.writes.length;h.click({page:'home'});assert.equal(h.page(),'home');assert.equal(h.focused(),'home-title');h.click({action:'resume'});assert.equal(h.page(),'workspace');assert.equal(h.focused(),'job-title');assert.equal(JSON.stringify(h.active()),before);assert.equal(h.raw(),stored);assert.equal(h.writes.length,writes);});
await test('Saved jobs, References, Settings and native Back/Forward keep the draft',async()=>{const h=await harness({jobs:[job]}),before=JSON.stringify(h.active());for(const page of ['library','references','settings']){h.click({page});assert.equal(h.page(),page);h.travel(-1);assert.equal(h.page(),'home');h.travel(1);assert.equal(h.page(),page);h.click({page:'home'});}assert.equal(JSON.stringify(h.active()),before);assert.deepEqual(h.writes,[]);});
await test('refresh of Home remains Home with the same complete draft',async()=>{const h=await harness({jobs:[job],hash:'#home'});assert.equal(h.page(),'home');assert.deepEqual(h.active(),job);assert.deepEqual(h.writes,[]);});
await test('explicit New job preserves the prior job and only then creates a new draft',async()=>{const h=await harness({jobs:[job]});h.click({action:'new'});assert.equal(h.page(),'workspace');assert.notEqual(h.active().id,job.id);assert.equal(h.node('details-dialog').open,true);await h.flush();const saved=h.saved();assert.equal(saved.jobs.length,2);assert.deepEqual(saved.jobs.find(x=>x.id===job.id),job);h.travel(-1);assert.equal(h.page(),'home');assert.equal(h.node('details-dialog').open,false);});
await test('same-page clicks do not stack history; direct hash links route without resetting',async()=>{const h=await harness({jobs:[job]});h.click({page:'home'});assert.equal(h.historyEntries.length,1);h.hashchange('#references');assert.equal(h.page(),'references');h.hashchange('#home');assert.equal(h.page(),'home');assert.deepEqual(h.active(),job);assert.deepEqual(h.writes,[]);});
await test('invalid links and workspace links without a current job fall back to Home',async()=>{for(const hash of ['#unknown','#workspace']){const h=await harness({hash});assert.equal(h.page(),'home');assert.equal(h.location.hash,'#home');assert.equal(h.active(),null);}});
await test('orphaned active id offers the existing last draft instead of an automatic new job',async()=>{const h=await harness({jobs:[job],activeId:'missing'});assert.equal(h.page(),'home');assert.equal(h.node('resume-job').hidden,false);h.click({action:'resume'});assert.equal(h.active().id,job.id);assert.equal(h.page(),'workspace');assert.equal(h.node('step-title').textContent,'Completion plug');});
await test('wordmark returns Workspace to Home without reload or save',async()=>{const h=await harness({jobs:[job],hash:'#workspace'}),before=h.raw(),count=h.writes.length;assert.equal(h.link({page:'home'}).defaultPrevented,true);assert.equal(h.page(),'home');assert.equal(h.focused(),'home-title');assert.equal(h.raw(),before);assert.equal(h.writes.length,count);});
await test('modified Home links keep native new-tab behavior',async()=>{const h=await harness({jobs:[job],hash:'#workspace'});for(const modifiers of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]){assert.equal(h.link({page:'home'},modifiers).defaultPrevented,false);assert.equal(h.page(),'workspace');}});
await test('storage refresh on empty Home offers a newly saved job without creating one',async()=>{const h=await harness();h.externalLegacy({jobs:[job],activeId:job.id});assert.equal(h.page(),'home');assert.equal(h.active(),null);assert.equal(h.node('resume-title').textContent,job.title);assert.equal(h.node('resume-job').hidden,false);assert.deepEqual(h.writes,[]);h.click({action:'resume'});await h.flush();assert.equal(h.active().id,job.id);});
await test('another-tab update on Home never replaces this tab’s current draft',async()=>{const h=await harness({jobs:[job]}),other=structuredClone(job);other.title='Other tab edit';other.operations[1].state.cpLiManual='7';await h.externalSave(other);assert.equal(h.page(),'home');assert.deepEqual(h.active(),job);assert.equal(h.node('resume-title').textContent,job.title);h.click({action:'resume'});assert.equal(h.active().operations[1].state.cpLiManual,'99');assert.equal(h.node('save-recovery').hidden,false);assert.equal(h.saved().jobs[0].operations[1].state.cpLiManual,'7');});
await test('Home during a pending save retains the typed override and completes safely',async()=>{const h=await harness({jobs:[job],hash:'#workspace'}),release=h.hold();h.node('fields').dispatch('input',{target:{dataset:{field:'cpLiManual'},value:'123.875'}});assert.equal(h.node('save-state').textContent,'Saving on this device…');h.click({page:'home'});assert.equal(h.active().operations[1].state.cpLiManual,'123.875');release();await h.flush();assert.equal(h.page(),'home');assert.equal(h.saved().jobs[0].operations[1].state.cpLiManual,'123.875');h.click({action:'resume'});assert.equal(h.node('step-title').textContent,'Completion plug');assert.equal(h.active().operations[1].state.cpLiManual,'123.875');});
await test('HTP rendering keeps stage profile synchronized after dialog state changes without rewriting measurements',async()=>{
  const familyJob=model.normalizeJob({id:'home-htp-render',record:{jobBundle:{selectedOperationId:'htp',sharedState:{jobDescription:'Synthetic HTP'},operations:[{id:'htp',operationType:'HTP',state:{htpPipeSize:'6',htpMd:'10',htpLd:'2',htpPtc:'1 1/4',htpMachine:'360',etaRpmOverride:'999',future:{keep:true}}}]}}});
  const h=await harness({jobs:[familyJob],hash:'#workspace'});h.run("rememberStage(operation(),'htp');renderWorkspace();");assert.equal(h.node('data-fieldhtpMachine').value,'360');const before=h.writes.length;
  h.run("active.operations[0].state.htpMachine='1200';renderResults();");assert.equal(h.node('data-fieldhtpMachine').value,'1200');assert.match(h.node('results').innerHTML,/1200-M120/);assert.equal(h.active().operations[0].state.htpMd,'10');assert.equal(h.active().operations[0].state.etaRpmOverride,'999');assert.deepEqual(h.active().original,familyJob.original);assert.equal(h.writes.length,before,'Pure result rendering never saves a job');
});
await test('Hi-Stop rendering exposes current POD and retains stale raw POD without an editable second authority',async()=>{
  const familyJob=model.normalizeJob({id:'home-hi-render',record:{jobBundle:{selectedOperationId:'hi',sharedState:{jobDescription:'Synthetic Hi-Stop'},operations:[{id:'hi',operationType:'Hi-Stop',state:{bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',hsMd:'10',hsLd:'2',hsRl:'8',hsCl:'3',hsPtc:'1',hsRcd:'8',hsPb:'7',hsPtp:'1/4',hsPod:'99',future:{keep:true}}}]}}});
  const h=await harness({jobs:[familyJob],hash:'#workspace'});h.run("rememberStage(operation(),'hiStop');renderWorkspace();");assert.doesNotMatch(h.node('fields').innerHTML,/data-field="hsPod"/);assert.match(h.node('results').innerHTML,/11\.3125/);assert.match(h.node('results').innerHTML,/6\.6250 in/);assert.match(h.node('results').innerHTML,/Saved Hi-Stop POD 99/);assert.doesNotMatch(h.node('results').innerHTML,/data-open-eta/);assert.equal(h.active().operations[0].state.hsPod,'99');assert.deepEqual(h.active().original,familyJob.original);assert.equal(h.node('unit-label').textContent,'INCHES, EXCEPT TAPER');
});

await test('unbound shared deep link preserves active draft and URL without autosaving or projecting it',async()=>{
  const hash='#shared/tm-'+'a'.repeat(64),h=await harness({jobs:[job],hash});
  assert.equal(h.page(),'shared-view');assert.equal(h.location.hash,hash);assert.deepEqual(h.active(),job);assert.deepEqual(h.writes,[]);assert.match(h.node('modern-view-status').textContent,/not connected/);assert.equal(h.node('modern-make-copy').hidden,true);
});

console.log(`${count} network-free Home/navigation/rendering cases passed.`);

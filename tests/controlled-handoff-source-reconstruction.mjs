// Proposed exact in-memory inverse of reviewed controlled-handoff test changes.
// Never edits source files, removes running tests, accepts arbitrary bytes or updates frozen c05 hashes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const digest=text=>createHash('sha256').update(text).digest('hex');
const changes={
  "tests/launch-worker-upgrade-ui.mjs": {
    "reviewedSha256": "658f6cde1c62d77b4034332116ae215ce5fb9fddd25d1313240c41f32e1661f6",
    "reconstructedSha256": "a94e3a50b636877ec25f11866ab6b6a4093ae560f8c1be5c6507d539f6f52848",
    "hunks": [
      {
        "afterOffset": 226,
        "after": "import {controlledRollback} from './controlled-rollback.mjs';\n",
        "before": ""
      },
      {
        "afterOffset": 1123,
        "after": "const VERSION='launch-pre-alpha26-2',APP='pre-alpha26',mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};\n",
        "before": "const VERSION='launch-pre-alpha26-1',APP='pre-alpha26',mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};\n"
      },
      {
        "afterOffset": 1461,
        "after": "const rollback=controlledRollback(path=>readFileSync(join(root,path),'utf8'));\nfunction bytes(path){if(phase==='old'){if(!old.has(path))old.set(path,execFileSync('git',['show',baseline+':'+path],{cwd:root,maxBuffer:30*1024*1024}));return old.get(path);}const full=resolve(root,path);if(!full.startsWith(resolve(root)+sep))throw Error('Invalid path');return phase==='rollback'&&rollback.has(path)?Buffer.from(rollback.get(path)):readFileSync(full);}\n",
        "before": "function bytes(path){if(phase==='old'||phase==='rollback'&&['index.html','manifest.json','measurement-card.html'].includes(path)){if(!old.has(path))old.set(path,execFileSync('git',['show',baseline+':'+path],{cwd:root,maxBuffer:30*1024*1024}));return old.get(path);}const full=resolve(root,path);if(!full.startsWith(resolve(root)+sep))throw Error('Invalid path');let data=readFileSync(full);if(phase==='rollback'&&path==='service-worker.js')data=Buffer.from(data.toString().replaceAll(VERSION,'rollback-'+VERSION));return data;}\n"
      },
      {
        "afterOffset": 4510,
        "after": "  async function launch(){context=await pw[engine].launchPersistentContext(profile,options);context.on('page',p=>p.on('pageerror',e=>{pageErrorCount++;errors.push({message:e.message,stack:e.stack,step,url:p.url()});console.error('LAUNCH_PAGE_ERROR',JSON.stringify({message:e.message,stack:e.stack,step,url:p.url()}));}));await context.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(url.origin!==base){external.push(url.origin);return route.abort();}return route.continue();});page=await context.newPage();page.setDefaultTimeout(30000);}\n",
        "before": "  async function launch(){context=await pw[engine].launchPersistentContext(profile,options);context.on('page',p=>p.on('pageerror',e=>{pageErrorCount++;errors.push({message:e.message,stack:e.stack,step,url:p.url()});}));await context.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(url.origin!==base){external.push(url.origin);return route.abort();}return route.continue();});page=await context.newPage();page.setDefaultTimeout(30000);}\n"
      },
      {
        "afterOffset": 8797,
        "after": "  phase='new';step='root handoff to current build and child worker';console.log(engine,device,step);await page.goto(base+'/');await page.waitForURL('**/pre-alpha/**');await page.waitForFunction(()=>document.title==='TapCalc V.3');console.log(engine,device,'modern title reached');assert.equal(await ask(page,'tapcalc-pre-alpha-version','build'),APP);console.log(engine,device,'child identity reached');await unchanged();console.log(engine,device,'durable data preserved');step='new installed manifest start';await page.goto(base+'/?v='+VERSION);await page.waitForURL('**/pre-alpha/**');await page.waitForFunction(()=>document.title==='TapCalc V.3');assert.equal(await ask(page,'tapcalc-pre-alpha-version','build'),APP);await unchanged();\n",
        "before": "  phase='new';step='root handoff to current build and child worker';console.log(engine,device,step);await page.goto(base+'/');await page.waitForURL('**/pre-alpha/**');await page.waitForFunction(()=>document.title==='TapCalc V.3');console.log(engine,device,'modern title reached');assert.equal(await ask(page,'tapcalc-pre-alpha-version','build'),APP);console.log(engine,device,'child identity reached');await unchanged();console.log(engine,device,'durable data preserved');step='new installed manifest start';await page.goto(base+'/pre-alpha/?v='+APP);await page.waitForFunction(()=>document.title==='TapCalc V.3');assert.equal(await ask(page,'tapcalc-pre-alpha-version','build'),APP);await unchanged();\n"
      },
      {
        "afterOffset": 10974,
        "after": "  step='route-only rollback preserves modern data and re-upgrade';console.log(engine,device,step);phase='rollback';await page.close();page=await context.newPage();page.setDefaultTimeout(30000);await page.goto(base+'/',{waitUntil:'commit'});console.log(engine,device,'rollback root loaded');await page.waitForURL('**/measurement-card.html*',{waitUntil:'domcontentloaded'});await page.locator('#bcoPipeOD').waitFor({state:'attached'});console.log(engine,device,'rollback legacy loaded');// The maintained root owner proves activation before destination navigation; do not race it with a second script URL.\n",
        "before": "  step='route-only rollback preserves modern data and re-upgrade';console.log(engine,device,step);phase='rollback';await page.close();page=await context.newPage();page.setDefaultTimeout(30000);await page.goto(base+'/',{waitUntil:'commit'});console.log(engine,device,'rollback root loaded');await page.waitForURL('**/measurement-card.html*',{waitUntil:'domcontentloaded'});await page.locator('#bcoPipeOD').waitFor({state:'attached'});console.log(engine,device,'rollback legacy loaded');// The frozen legacy page owns registration on load; do not race it with a second script URL.\n"
      }
    ]
  },
  "tests/launch-readiness.mjs": {
    "reviewedSha256": "c5b79efc1e2b5b6b1212f6bbc341e125e1b67877ce707f3ac2d9130e746d2b89",
    "reconstructedSha256": "22ab63972950c4d20135ba494bb1001d3fbef9a3edec10bb3379e58e6f8e9400",
    "hunks": [
      {
        "afterOffset": 206,
        "after": "const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll('\\r\\n','\\n'),source=read('launch.js'),APP='pre-alpha26',VERSION='launch-'+APP+'-2';\n",
        "before": "const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replaceAll('\\r\\n','\\n'),source=read('launch.js'),APP='pre-alpha26',VERSION='launch-'+APP+'-1';\n"
      },
      {
        "afterOffset": 681,
        "after": " const rootWorker={scriptURL:'https://fixture.invalid/service-worker.js?v='+VERSION,state:'activated',postMessage:(message,ports)=>{if((ready||rootRegistered)&&message.type==='tapcalc-launch-version'){ports[0].postMessage({version:VERSION});ports[0].close();}}};\n const modern={scriptURL:'https://fixture.invalid/pre-alpha/service-worker.js?v='+APP,state:'activated',postMessage:(message,ports)=>{if((ready||childRegistered)&&message.type==='tapcalc-pre-alpha-version'){ports[0].postMessage({build:APP});ports[0].close();}}};\n",
        "before": " const rootWorker={state:'activated',postMessage:(message,ports)=>{if((ready||rootRegistered)&&message.type==='tapcalc-launch-version'){ports[0].postMessage({version:VERSION});ports[0].close();}}};\n const modern={state:'activated',postMessage:(message,ports)=>{if((ready||childRegistered)&&message.type==='tapcalc-pre-alpha-version'){ports[0].postMessage({build:APP});ports[0].close();}}};\n"
      },
      {
        "afterOffset": 1400,
        "after": " const sw={controller:rootWorker,getRegistration:async url=>new URL(url).pathname.startsWith('/pre-alpha/')?{scope:'https://fixture.invalid/pre-alpha/',active:modern,update:async()=>{if(fail)throw Error('Synthetic child failure');childRegistered=true;}}:noRoot&&!rootRegistered?undefined:rootRegistration,register:async url=>{registers++;if(fail)throw Error('Synthetic network failure');const child=url.includes('/pre-alpha/');if(fresh){if(child)childRegistered=true;else rootRegistered=true;}return {scope:child?'https://fixture.invalid/pre-alpha/':'https://fixture.invalid/',active:child?modern:rootWorker,update:async()=>{throw Error('Duplicate update after registration');}};}};\n",
        "before": " const sw={controller:rootWorker,getRegistration:async url=>new URL(url).pathname.startsWith('/pre-alpha/')?{scope:'https://fixture.invalid/pre-alpha/',active:modern}:noRoot?undefined:rootRegistration,register:async url=>{registers++;if(fail)throw Error('Synthetic network failure');const child=url.includes('/pre-alpha/');if(fresh){if(child)childRegistered=true;else rootRegistered=true;}return {active:child?modern:rootWorker,update:async()=>{throw Error('Duplicate update after registration');}};}};\n"
      },
      {
        "afterOffset": 2250,
        "after": " const context={URL,MessageChannel,setTimeout,clearTimeout,Date,Promise,location,navigator,matchMedia:()=>({matches:standalone}),console:{error(){}},window:{stop:()=>stopped++,addEventListener(){}},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:id==='launch-retry'?retry:null}};\n",
        "before": " const context={URL,MessageChannel,setTimeout,clearTimeout,Date,Promise,location,navigator,matchMedia:()=>({matches:standalone}),window:{stop:()=>stopped++},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:retry}};\n"
      },
      {
        "afterOffset": 3645,
        "after": "const prepared=await launch({ready:false,fresh:true});assert.equal(prepared.registers,0);assert.equal(prepared.rootUpdates,1);assert.equal(prepared.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);\nconst coldRoot=await launch({ready:false,fresh:true,noRoot:true});assert.equal(coldRoot.registers,1);assert.equal(coldRoot.rootUpdates,0);assert.equal(coldRoot.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);\nconst unsupported=await launch({noServiceWorker:true});assert.equal(unsupported.replaced,'');assert.match(unsupported.status,/saved jobs have not been changed/);\n",
        "before": "const prepared=await launch({ready:false,fresh:true});assert.equal(prepared.registers,1);assert.equal(prepared.rootUpdates,1);assert.equal(prepared.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);\nconst coldRoot=await launch({ready:false,fresh:true,noRoot:true});assert.equal(coldRoot.registers,2);assert.equal(coldRoot.rootUpdates,0);assert.equal(coldRoot.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);\nconst unsupported=await launch({noServiceWorker:true});assert.equal(unsupported.replaced,'https://fixture.invalid/pre-alpha/?v='+APP);\n"
      },
      {
        "afterOffset": 4592,
        "after": "assert.equal(manifest.start_url,'./?v='+VERSION);assert.equal(manifest.id,oldManifest.start_url);assert.equal(manifest.scope,oldManifest.scope);assert.deepEqual(manifest.icons,oldManifest.icons);\nassert.match(read('index.html'),/legacy=1/);assert.doesNotMatch(read('index.html'),/http-equiv=\"refresh\"|<iframe/);assert.match(read('measurement-card.html'),/launch\\.js\\?v=launch-pre-alpha26-2/);\n",
        "before": "assert.equal(manifest.start_url,'./pre-alpha/?v='+APP);assert.equal(manifest.id,oldManifest.start_url);assert.equal(manifest.scope,oldManifest.scope);assert.deepEqual(manifest.icons,oldManifest.icons);\nassert.match(read('index.html'),/legacy=1/);assert.doesNotMatch(read('index.html'),/http-equiv=\"refresh\"|<iframe/);assert.match(read('measurement-card.html'),/launch\\.js\\?v=launch-pre-alpha26-1/);\n"
      },
      {
        "afterOffset": 6160,
        "after": " let priorProbes=0;const outgoing={state:'activated',scriptURL:'https://fixture.invalid/service-worker.js'},priorContext={VERSION,root:{href:'https://fixture.invalid/'},navigator:{serviceWorker:{controller:outgoing}},ask:async()=>{priorProbes++;return 'outgoing-build';}};\n",
        "before": " let priorProbes=0;const priorContext={VERSION,navigator:{serviceWorker:{controller:{}}},ask:async()=>{priorProbes++;return 'outgoing-build';}};\n"
      },
      {
        "afterOffset": 6589,
        "after": " for(let turn=0;turn<3;turn++)assert.equal(await priorReady({scope:'https://fixture.invalid/',[pending]:{},active:outgoing}),false);\n",
        "before": " for(let turn=0;turn<3;turn++)assert.equal(await priorReady({[pending]:{},active:{}}),false);\n"
      },
      {
        "afterOffset": 6904,
        "after": " let probes=0;const nextWorker={state:'activated',scriptURL:'https://fixture.invalid/service-worker.js'},pendingRegistration={scope:'https://fixture.invalid/',[pending]:{state:pending==='installing'?'installing':'installed'}};\n",
        "before": " let probes=0;const nextWorker={},pendingRegistration={[pending]:{state:pending==='installing'?'installing':'installed'}};\n"
      },
      {
        "afterOffset": 7279,
        "after": " const readyContext={VERSION,root:{href:'https://fixture.invalid/'},navigator:{serviceWorker:{controller:nextWorker}},ask:async()=>{probes++;return VERSION;}};\n",
        "before": " const readyContext={VERSION,navigator:{serviceWorker:{controller:nextWorker}},ask:async()=>{probes++;return VERSION;}};\n"
      },
      {
        "afterOffset": 29098,
        "after": " const worker={scriptURL:'https://fixture.invalid/service-worker.js?v='+VERSION,state:'activated',postMessage:(message,ports)=>{ports[0].postMessage({version:rootReadyNow?VERSION:'previous-build'});ports[0].close();}},child={scriptURL:'https://fixture.invalid/pre-alpha/service-worker.js?v='+APP,state:'activated',postMessage:(message,ports)=>{ports[0].postMessage({build:APP});ports[0].close();}};\n",
        "before": " const worker={state:'activated',postMessage:(message,ports)=>{ports[0].postMessage({version:rootReadyNow?VERSION:'previous-build'});ports[0].close();}},child={state:'activated',postMessage:(message,ports)=>{ports[0].postMessage({build:APP});ports[0].close();}};\n"
      },
      {
        "afterOffset": 29705,
        "after": " const sw={controller:worker,getRegistration:url=>{lookups++;if(stage==='lookup'&&lookups===1){entered=true;return pending;}return Promise.resolve(new URL(url).pathname.startsWith('/pre-alpha/')?{scope:'https://fixture.invalid/pre-alpha/',active:child}:stage==='register'&&!rootReadyNow?undefined:registration);},register:()=>{registers++;if(stage==='register'&&registers===1){entered=true;return pending;}rootReadyNow=true;return Promise.resolve(registration);}};\n const context={URL,MessageChannel,Date,Promise,navigator:{serviceWorker:sw},matchMedia:()=>({matches:false}),location:{href:'https://fixture.invalid/',replace:url=>navigations.push(url)},console:{error(){}},window:{addEventListener(){},stop(){}},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:id==='launch-retry'?retry:null},setTimeout:(callback,delay)=>{if(delay===20000){deadline=callback;return {deadline:true};}const id=setTimeout(()=>{timers.delete(id);callback();},delay);timers.add(id);return id;},clearTimeout:id=>{if(!id?.deadline){clearTimeout(id);timers.delete(id);}}};\n",
        "before": " const sw={controller:worker,getRegistration:url=>{lookups++;if(stage==='lookup'&&lookups===1){entered=true;return pending;}return Promise.resolve(new URL(url).pathname.startsWith('/pre-alpha/')?{active:child}:stage==='register'&&!rootReadyNow?undefined:registration);},register:()=>{registers++;if(stage==='register'&&registers===1){entered=true;return pending;}rootReadyNow=true;return Promise.resolve(registration);}};\n const context={URL,MessageChannel,Date,Promise,navigator:{serviceWorker:sw},matchMedia:()=>({matches:false}),location:{href:'https://fixture.invalid/',replace:url=>navigations.push(url)},window:{},document:{currentScript:{src:'https://fixture.invalid/launch.js?v='+VERSION},getElementById:id=>id==='launch-status'?status:retry},setTimeout:(callback,delay)=>{if(delay===20000){deadline=callback;return {deadline:true};}const id=setTimeout(()=>{timers.delete(id);callback();},delay);timers.add(id);return id;},clearTimeout:id=>{if(!id?.deadline){clearTimeout(id);timers.delete(id);}}};\n"
      },
      {
        "afterOffset": 30999,
        "after": " vm.runInNewContext(source,context);for(let n=0;n<100&&!entered;n++)await new Promise(resolve=>setImmediate(resolve));assert.equal(entered,true,'Reached never-settling '+stage);assert.equal(typeof deadline,'function');assert.equal(retry.disabled,true);const before={rootUpdates,registers,lookups};const coalescedRetry=retryHandler();assert.deepEqual({rootUpdates,registers,lookups},before,'Busy attempt cannot stack preparation');deadline();await coalescedRetry;await new Promise(resolve=>setImmediate(resolve));assert.match(status.textContent,/saved jobs have not been changed/);assert.equal(retry.disabled,false,'Deadline restores Retry');assert.deepEqual(navigations,[]);\n if(retryAfterTimeout){await retryHandler();assert.equal(retry.disabled,true,'Accepted navigation remains pending until pagehide or explicit recovery');assert.deepEqual(navigations,['https://fixture.invalid/pre-alpha/?v='+APP]);}\n",
        "before": " vm.runInNewContext(source,context);for(let n=0;n<100&&!entered;n++)await new Promise(resolve=>setImmediate(resolve));assert.equal(entered,true,'Reached never-settling '+stage);assert.equal(typeof deadline,'function');assert.equal(retry.disabled,true);const before={rootUpdates,registers,lookups};await retryHandler();assert.deepEqual({rootUpdates,registers,lookups},before,'Busy attempt cannot stack preparation');deadline();await new Promise(resolve=>setImmediate(resolve));assert.match(status.textContent,/saved jobs have not been changed/);assert.equal(retry.disabled,false,'Deadline restores Retry');assert.deepEqual(navigations,[]);\n if(retryAfterTimeout){await retryHandler();assert.equal(retry.disabled,false);assert.deepEqual(navigations,['https://fixture.invalid/pre-alpha/?v='+APP]);}\n"
      },
      {
        "afterOffset": 32793,
        "after": "\nawait import('./controlled-handoff.mjs');\nawait import('./controlled-rollback-test.mjs');\nawait import('./root-partial-cache.mjs');\n\nawait import('./controlled-handoff-dom.mjs');\n",
        "before": ""
      }
    ]
  }
};

const lazyPreviewUnitInverse={
  "reviewedSha256": "660abb5541c738bc7b8f29b823a955c5bd4f63cbb971382b6b87f42726216350",
  "restoredSha256": "c5b79efc1e2b5b6b1212f6bbc341e125e1b67877ce707f3ac2d9130e746d2b89",
  "hunks": [
    {
      "offset": 41,
      "after": "import './legacy-pdf-lazy.mjs';\n",
      "before": ""
    },
    {
      "offset": 15998,
      "after": " const context={machineReferencePreviewIsActive:()=>true,stackupPdfDocumentCache:cleanupCache,console:{error:(...args)=>diagnostics.push(args)},window:{addEventListener:(name,callback)=>events[name]=callback},document:{createElement:tag=>({tagName:tag,type:'',textContent:'',disabled:false,events:{},addEventListener(name,callback){this.events[name]=callback;},click(){this.events.click?.();}})},setTimeout:callback=>{timers.set(++timerId,callback);return timerId;},clearTimeout:id=>timers.delete(id),getMachineReferenceVisualSource:()=>({openUrl:'/synthetic.pdf',pageNumber:1}),machineReferenceVisualOpenEl:null,machineReferenceVisualFallbackEl:fallback,machineReferenceVisualCanvasEl:{hidden:true},setMachineReferenceVisualMessage:(message,show)=>{fallback.textContent=message;fallback.hidden=!show;fallback.children=[];},showMachineReferenceNativePreview:()=>{fallbacks++;return true;},renderMachineReferenceVisualPage:()=>new Promise((_,reject)=>requests.push(reject)),updateMachineReferenceSummary:()=>{resumes++;run({source:'Synthetic'});}};\n",
      "before": " const context={stackupPdfDocumentCache:cleanupCache,console:{error:(...args)=>diagnostics.push(args)},window:{addEventListener:(name,callback)=>events[name]=callback},document:{createElement:tag=>({tagName:tag,type:'',textContent:'',disabled:false,events:{},addEventListener(name,callback){this.events[name]=callback;},click(){this.events.click?.();}})},setTimeout:callback=>{timers.set(++timerId,callback);return timerId;},clearTimeout:id=>timers.delete(id),getMachineReferenceVisualSource:()=>({openUrl:'/synthetic.pdf',pageNumber:1}),machineReferenceVisualOpenEl:null,machineReferenceVisualFallbackEl:fallback,machineReferenceVisualCanvasEl:{hidden:true},setMachineReferenceVisualMessage:(message,show)=>{fallback.textContent=message;fallback.hidden=!show;fallback.children=[];},showMachineReferenceNativePreview:()=>{fallbacks++;return true;},renderMachineReferenceVisualPage:()=>new Promise((_,reject)=>requests.push(reject)),updateMachineReferenceSummary:()=>{resumes++;run({source:'Synthetic'});}};\n"
    },
    {
      "offset": 22281,
      "after": " const ctx={machineReferencePreviewIsActive:()=>true,getStackupPdfJs:()=>modulePromise,stackupPdfDocumentCache:new Map(),machineReferencePageHidden:false,machineReferencePreviewPaused:false,machineReferenceVisualRenderToken:1};\n",
      "before": " const ctx={getStackupPdfJs:()=>modulePromise,stackupPdfDocumentCache:new Map(),machineReferencePageHidden:false,machineReferencePreviewPaused:false,machineReferenceVisualRenderToken:1};\n"
    }
  ]
};

const lazyPreviewReleaseInverse={
  "reviewedSha256": "43ad97b66e622d05bbe782f88095f76e5ffe2ac2ca49cdd32ca8202ad8b74c27",
  "restoredSha256": "ef108043651a153388462d488689ea240d192ec95438a95ccc2d25038298717b",
  "enrollment": "    checks.push(['legacy-pdf-preview-ui.mjs', { TAPCALC_BROWSER: browser }]);\n"
};
export function restoreControlledHandoff(path,source){
 if(path==='tests/launch-readiness.mjs'){
  assert.equal(digest(source),lazyPreviewUnitInverse.reviewedSha256,'Exact reviewed lazy-preview unit source');
  for(const h of [...lazyPreviewUnitInverse.hunks].reverse()){
   assert.equal(source.slice(h.offset,h.offset+h.after.length),h.after,'Exact reversible lazy-preview unit span');
   source=source.slice(0,h.offset)+h.before+source.slice(h.offset+h.after.length);
  }
  assert.equal(digest(source),lazyPreviewUnitInverse.restoredSha256,'Unchanged 521c654 unit source before immutable handoff reconstruction');
 }
 if(path==='tests/release-check.mjs'){
  assert.equal(digest(source),lazyPreviewReleaseInverse.reviewedSha256,'Exact reviewed lazy-preview release enrollment');
  assert.equal(source.split(lazyPreviewReleaseInverse.enrollment).length-1,1,'One exact additional legacy preview check');
  source=source.replace(lazyPreviewReleaseInverse.enrollment,'');
  assert.equal(digest(source),lazyPreviewReleaseInverse.restoredSha256,'Unchanged frozen release runner before existing worksheet inverse');
 }
 const change=changes[path];if(!change)return source;
 assert.equal(digest(source),change.reviewedSha256,'Exact independently reviewed handoff source required: '+path);
 for(const h of [...change.hunks].reverse()){
  assert.equal(source.slice(h.afterOffset,h.afterOffset+h.after.length),h.after,'Exact reversible handoff span: '+path);
  source=source.slice(0,h.afterOffset)+h.before+source.slice(h.afterOffset+h.after.length);
 }
 assert.equal(digest(source),change.reconstructedSha256,'Exact immutable 916610b reconstruction: '+path);
 return source;
}

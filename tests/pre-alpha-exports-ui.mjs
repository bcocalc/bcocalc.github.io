// Synthetic persistent localhost profiles. No production records or writes.
import assert from 'node:assert/strict';
import {cleanupExports,observeChildClose} from './runner-cleanup.mjs';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {readDurableWorkspace,waitForWorkspaceSave} from './pre-alpha-workspace-test-helpers.mjs';
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'chromium';
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'',ptc:'1 1/4',start:'2',mt:'52',future:{raw:['1/4','invalid']}};
const fixture={id:'export-fixture',record:{job:{client:'Synthetic client',pressure:'250 psi',temperature:'80 F',product:'Water'},future:{keep:true},measurements:{hotTap:{mco:'99',rodMco:'111'}},jobBundle:{selectedOperationId:'two',sharedState:{jobDescription:'Export fixture',jobNotes:'First line\nSecond <script>bad()</script> & "quotes" · α ¾ '+('long note '.repeat(30))},operations:[
  {id:'one',label:'First tap',operationType:'Hot Tap',state,measurements:{hotTap:{mco:'88',rodMco:'89'}}},
  {id:'two',label:'Second stop',operationType:'Line Stop',state:{...state,lsMd:'12',lsLd:'0',cpStart:'20',cpJbf:'1',cpLd:'2',cpPt:'3'}},
  {id:'three',label:'Saved HTP',operationType:'HTP',state:{...state,lineStopVariant:'htp'},measurements:{htp:{tco:'47.25',future:{keep:true}}}}
]}}};
const history=JSON.stringify([fixture]),sentinel='{"synthetic":"export live key unchanged"}';
const server=spawn(process.execPath,['tests/sync-preview.mjs'],{stdio:['ignore','pipe','inherit']});
const preview=observeChildClose(server);
let context,page;
try{
  const base=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(new Error('Preview timeout')),10000);
    server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
    server.once('error',reject);
  });
  for(const mobile of [true,false]){
    const device=mobile?'phone':'desktop',profile=mkdtempSync(join(tmpdir(),'tapcalc-exports-'+engine+'-'+device+'-'));
    const errors=[],writes=[],options={headless:true,...(mobile?pw.devices['iPhone 13']:{viewport:{width:1280,height:900}}),serviceWorkers:'block',acceptDownloads:true};
    async function launch(){
      context=await pw[engine].launchPersistentContext(profile,options);
      await context.route('**/*',route=>{
        const request=route.request(),url=new URL(request.url());
        if(url.origin!==base)return route.abort();
        if(request.method()!=='GET'){writes.push(request.method()+' '+url.pathname);return route.abort();}
        return route.continue();
      });
      await context.addInitScript(({history,sentinel})=>{
        if(localStorage.getItem('measurementCardHistoryV1')===null){localStorage.setItem('measurementCardHistoryV1',history);localStorage.setItem('measurementCardStateV1',sentinel);}
        window.__printed=0;window.print=()=>{window.__printed++;};
        window.__exportDraw=[];
        const fill=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){window.__exportDraw.push({text,x,y,width:this.measureText(text).width});return fill.call(this,text,x,y,...rest);};
      },{history,sentinel});
      page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    }
    const activate=locator=>mobile?locator.tap():locator.click();
    const storageBytes=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)]))));
    await launch();await page.goto(base+'/pre-alpha/');
    await page.waitForFunction(()=>document.getElementById('connection').textContent.includes('Connected'));
    await activate(page.locator('.main-nav [data-page="library"]'));await activate(page.locator('[data-source="device"]'));
    await activate(page.locator('[data-job="export-fixture"]'));await waitForWorkspaceSave(page);
    const durable=JSON.stringify(await readDurableWorkspace(page)),local=await storageBytes();
    for(const dark of [false,true]){
      if(dark)await activate(page.locator('#theme'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Export controls fit phone/desktop');
      const popupPromise=page.waitForEvent('popup');
      if(!mobile&&dark){await page.locator('[data-job-export="pdf"]').focus();await page.keyboard.press('Enter');}
      else await activate(page.locator('[data-job-export="pdf"]'));
      const popup=await popupPromise;await popup.waitForFunction(()=>window.__printed===1);
      const text=await popup.locator('pre').textContent();
      for(const expected of ['Pressure: 250 psi','Temperature: 80 F','Product: Water','Operation 1 of 3: First tap','Operation 2 of 3: Second stop','Operation 3 of 3: Saved HTP','Rod MCO: 16.5625 in','Historical HTP tco (original snapshot; not used): 47.25','Historical Rod MCO (original snapshot; not used): 89','Historical Rod MCO (original snapshot; not used): 111','<script>bad()</script>','α ¾'])assert.ok(text.includes(expected),expected);
      assert.equal(await popup.locator('script,img,iframe').count(),0);assert.equal(await popup.evaluate(()=>typeof window.bad),'undefined');
      const savedSection=text.split('Operation 3 of 3:')[1];assert.match(savedSection,/BCO: Not calculated \(HTP chart; not cutter-shell geometry\)/);assert.doesNotMatch(savedSection,/Rod MCO:|BCO: [\d.-]+ in/);
      if(dark)await popup.screenshot({path:join(profile,'print-view.png'),fullPage:true});
      await popup.close();
    }
    // Theme is a user preference; the export itself must not touch any stored bytes.
    const localAfterTheme=await storageBytes();
    const downloadPromise=page.waitForEvent('download');await activate(page.locator('[data-job-export="png"]'));const download=await downloadPromise;
    assert.equal(await download.failure(),null);assert.match(download.suggestedFilename(),/^tapcalc-.*\.png$/);
    const png=readFileSync(await download.path());assert.equal(png.subarray(1,4).toString(),'PNG');
    await download.saveAs(join(profile,'complete-job.png'));
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(width,1400);assert.ok(height>=900&&height<=6000);
    const decoded=await page.evaluate(async url=>{const img=new Image();img.src=url;await img.decode();return [img.naturalWidth,img.naturalHeight];},'data:image/png;base64,'+png.toString('base64'));
    assert.deepEqual(decoded,[width,height]);
    const drawn=await page.evaluate(()=>window.__exportDraw);assert.ok(drawn.some(row=>row.text.includes('Operation 3 of 3')));assert.ok(drawn.some(row=>row.text.includes('Historical HTP tco (original snapshot; not used): 47.25')));
    assert.ok(drawn.every(row=>row.x+row.width<=width-49&&row.y<height),'Every wrapped PNG line fits');
    const open=await page.evaluate(()=>{window.__realOpen=window.open;window.open=()=>null;return true;});assert.equal(open,true);
    await activate(page.locator('[data-job-export="pdf"]'));await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('Print window blocked'));
    await page.evaluate(()=>{window.open=window.__realOpen;});
    assert.equal(JSON.stringify(await readDurableWorkspace(page)),durable);assert.equal(await storageBytes(),localAfterTheme);
    assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardHistoryV1')),history);assert.equal(await page.evaluate(()=>localStorage.getItem('measurementCardStateV1')),sentinel);
    await page.screenshot({path:join(profile,'export-controls.png'),fullPage:true});
    if(mobile){await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(profile,'export-controls-320.png'),fullPage:true});}
    await page.reload();await activate(page.locator('.main-nav [data-page="workspace"]'));await page.locator('[data-job-export="png"]').waitFor();
    assert.equal(JSON.stringify(await readDurableWorkspace(page)),durable);
    await context.close();await launch();await page.goto(base+'/pre-alpha/#workspace');await page.locator('[data-job-export="png"]').waitFor();
    assert.equal(JSON.stringify(await readDurableWorkspace(page)),durable);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    assert.equal(JSON.parse(local).measurementCardHistoryV1,history);
    await context.close();context=null;
    console.log('PASS exports '+engine+'/'+device+': actual synchronous popup/print, escaped complete three-operation metadata/current/historical/saved output, decoded wrapped1400px PNG, blocked-popup handling, raw/original/live-key invariants, reload and browser-process restart; profile '+profile);
  }
}catch(error){console.error('EXPORT_UI_FAILURE',JSON.stringify({engine,message:error.message,stack:error.stack}));throw error;}
finally{await cleanupExports(context,preview,{report:({owner,phase,error})=>{process.exitCode=1;console.error('EXPORT_CLEANUP_FAILURE',JSON.stringify({owner,phase,message:error.message,stack:error.stack}));}});}

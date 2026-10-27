import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';

// Environment diagnostic without TapCalc or service workers. A failed context
// is a failed control, never permission to bypass the app's cache assertions.
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'webkit';
const args=process.argv.slice(2);
if(args.length>1||args.some(arg=>arg!=='--ephemeral'))throw new Error('Usage: node tests/pre-alpha-cache-context-control.mjs [--ephemeral]');
const ephemeral=args.includes('--ephemeral');
const profile=ephemeral?null:mkdtempSync(join(tmpdir(),'tapcalc-cache-control-'+engine+'-'));
const server=createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');
  response.end(request.url==='/sentinel'?'fetched value':'<!doctype html><title>Synthetic cache control</title>');
});
let context,browser;
const options={headless:true};
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  if(ephemeral){browser=await pw[engine].launch(options);context=await browser.newContext();}
  else context=await pw[engine].launchPersistentContext(profile,options);
  let page=await context.newPage();await page.goto(base);
  await page.evaluate(async()=>{
    const cache=await caches.open('independent-control');
    await cache.put('/synthetic',new Response('synthetic value'));
    await cache.put('/fetched',await fetch('/sentinel'));
  });
  const read=()=>page.evaluate(async()=>{
    const cache=await caches.open('independent-control');
    return Promise.all(['/synthetic','/fetched'].map(async key=>{const response=await cache.match(key);return response?response.text():null;}));
  });
  const expected=['synthetic value','fetched value'];
  assert.deepEqual(await read(),expected);
  await page.reload();
  assert.deepEqual(await read(),expected,'Cache entries survive a plain reload without any app code');
  if(!ephemeral){
    await context.close();context=await pw[engine].launchPersistentContext(profile,options);
    page=await context.newPage();await page.goto(base);
    assert.deepEqual(await read(),expected,'Persistent cache entries survive browser restart without any app code');
  }
  console.log('PASS independent cache control '+engine+'/'+(ephemeral?'ephemeral':'persistent')+': synthetic/fetched responses survive reload'+(ephemeral?'':' and process restart')+'; profile '+profile);
}finally{await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve));}

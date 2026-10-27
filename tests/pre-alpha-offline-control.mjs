import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';

// Diagnostic only: no TapCalc sources, storage, caches or network endpoints.
// A failure never waives the application's installed-worker release check.
const require=createRequire(import.meta.url);
let pw;try{pw=require('playwright');}catch{pw=require(join(dirname(dirname(process.execPath)),'node_modules/playwright'));}
const engine=process.env.TAPCALC_BROWSER||'webkit';
const html='<!doctype html><title>Offline control</title><h1>Control</h1><script>navigator.serviceWorker.register("/control-sw.js")</script>';
const worker=`self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(Promise.resolve(new Response(${JSON.stringify(html)},{headers:{'Content-Type':'text/html'}}))));`;
const server=createServer((request,response)=>{
  response.setHeader('Content-Type',request.url==='/control-sw.js'?'text/javascript':'text/html');
  response.end(request.url==='/control-sw.js'?worker:html);
});
let browser;
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await pw[engine].launch({headless:true});
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  if(await page.title()!=='Offline control')throw new Error('Unexpected control response');
  console.log('PASS minimal installed-worker offline control '+engine);
}catch(error){
  console.error('FAIL minimal offline control '+engine+': '+error.message);process.exitCode=1;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}

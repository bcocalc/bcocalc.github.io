import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {BUILD,STORAGE_KEY} from '../pre-alpha/model.mjs';
import {WORKSPACE_KEY} from '../pre-alpha/workspace-store.mjs';
import {WORKSPACE_DATABASE} from '../pre-alpha/workspace-database.mjs';

const root=new URL('../pre-alpha/',import.meta.url);
const text=name=>readFileSync(new URL(name,root),'utf8');
assert.equal(BUILD,'pre-alpha24');
const html=text('index.html');
assert.match(html,/<title>TapCalc Pre-Alpha 24<\/title>/);
assert.match(html,/<span class="edition">PRE-ALPHA 24<\/span>/);
for(const asset of ['workspace.css','firebase-config.js','workspace.mjs'])assert.ok(html.includes('./'+asset+'?v='+BUILD));
const config={window:{}};vm.runInNewContext(text('firebase-config.js'),config);
assert.equal(config.window.TAPCALC_PRE_ALPHA_BUILD,BUILD);
const worker={URL,self:{location:{href:'https://fixture.invalid/pre-alpha/service-worker.js?v='+BUILD}}};
vm.runInNewContext(text('service-worker.js').split("self.addEventListener('install'")[0]+'\nglobalThis.identity={BUILD,PREFIX,CACHE,scope,ASSETS,FIGURES};',worker);
assert.equal(worker.identity.BUILD,BUILD);
assert.equal(worker.identity.PREFIX,'tapcalc-pre-alpha-');
assert.equal(worker.identity.CACHE,'tapcalc-pre-alpha-'+BUILD);
assert.equal(worker.identity.FIGURES.length,5);
assert.ok(worker.identity.FIGURES.every(asset=>!worker.identity.ASSETS.includes(asset)),'Original figures are not installation downloads');
for(const asset of worker.identity.FIGURES){
  const url=new URL(asset,worker.identity.scope);
  assert.equal(url.searchParams.get('v'),BUILD);assert.equal(url.origin,'https://fixture.invalid');
  assert.ok(url.pathname.startsWith('/pre-alpha/measurement-figures/'));
}
for(const asset of worker.identity.ASSETS){
  const url=new URL(asset,worker.identity.scope);
  assert.equal(url.origin,'https://fixture.invalid');
  assert.ok(url.pathname.startsWith('/pre-alpha/'));
  if(!['./','./index.html'].includes(asset))assert.equal(url.searchParams.get('v'),BUILD,'Every cached module/config/style uses the release token');
}
let tokens=0;
const cachedPaths=new Set(worker.identity.ASSETS.map(asset=>new URL(asset,worker.identity.scope).pathname));
for(const name of readdirSync(root).filter(name=>/\.(?:mjs|js|html|css)$/.test(name))){
  const source=text(name);
  for(const [token] of source.matchAll(/\bpre-alpha\d+\b/g)){
    assert.equal(token,BUILD,'Stale release identity in '+name);tokens++;
  }
  for(const [,specifier] of source.matchAll(/\bfrom\s+['"](\.\/[^'"]+)['"]/g)){
    const url=new URL(specifier,new URL(name,worker.identity.scope));
    assert.equal(url.searchParams.get('v'),BUILD,'Unversioned local module in '+name);
    assert.ok(cachedPaths.has(url.pathname),'Imported module must be available to the installed offline app: '+specifier);
  }
}
assert.ok(tokens>30,'Check actual module, CSS, configuration and worker identities, not just a label');
assert.match(text('workspace.mjs'),/register\('\.\/service-worker\.js\?v='\+BUILD/);
assert.match(text('AGENTS.md'),/- Build: pre-alpha24\./);
assert.equal(STORAGE_KEY,'tapcalcPreAlpha01Workspace');
assert.equal(WORKSPACE_KEY,'tapcalcPreAlpha01WorkspaceConcurrentV1');
assert.equal(WORKSPACE_DATABASE,'tapcalc-pre-alpha-workspace-v1');
assert.equal(existsSync(new URL('measurement-help.mjs',root)),true,'This release includes only the approved derived guidance pinned by the separate source-boundary guard');
assert.equal(existsSync(new URL('../local-only/',root)),false,'Do not ship private prototype or technical-ledger scaffolding');
console.log('PASS Pre-Alpha24 identity: visible label, all versioned app tokens, config, worker/cache and stable storage identities; approved guidance and unbound modern modules cached without local-only scaffolding');

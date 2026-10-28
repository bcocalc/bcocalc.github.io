import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='b1c87408a9d77e3937d7872555b22f0f89776e83';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const hash=body=>createHash('sha256').update(body).digest('hex');
const app=['AGENTS.md','auxiliary.mjs','eta-view.mjs','eta.mjs','firebase-config.js','help.mjs','index.html','measurement-figures.mjs','measurement-help.mjs','model.mjs','presentation.mjs','reference-helpers.mjs','references.mjs','review.mjs','service-worker.js','workspace-store.mjs','workspace.mjs'];
const tests=['pre-alpha-mco-ui.mjs','pre-alpha-mco.mjs','pre-alpha-rod-mco.mjs','pre-alpha-measurement-help.mjs','pre-alpha-measurement-help-ui.mjs','pre-alpha-measurement-figures.mjs','pre-alpha-original-figures-ui.mjs','pre-alpha-pdf-cancellation.mjs','pre-alpha-pdf-worker-ui.mjs','pre-alpha-release-identity.mjs','pre-alpha-source-boundary.mjs','release-check.mjs'];
const workflow='.github/workflows/library-safeguard.yml';
const allowed=new Set([...app.map(name=>'pre-alpha/'+name),...tests.map(name=>'tests/'+name),workflow]);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside authorized local18 Rod MCO parity slice: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','pre-alpha/new-original.webp','pre-alpha/measurement-figures/extra.webp','private-source-review.txt'])assert.equal(allowed.has(path),false);
const pinned={
  'model.mjs':'bd272aba6067fc119408104439fe112addb1a93a781513321440ad482e3dd4e4',
  'presentation.mjs':'362ed286e8c15f1868c48ca32799a5cf38ebe8261fba10b41848e74dd9979c03',
  'workspace.mjs':'01088c4edf8cfd10d79f7cb5ca833a77a848496a67a471051d0ee31eafaee64d',
  'help.mjs':'3f605b31d49cc019afb421893e901aea209677a4eda641a1d331c2a2334eb2bc'
};
for(const [name,digest]of Object.entries(pinned))assert.equal(hash(text('pre-alpha/'+name)),digest,'Exact bounded Rod MCO implementation: '+name);
for(const name of app.filter(name=>!['AGENTS.md','index.html',...Object.keys(pinned)].includes(name)))
  assert.equal(text('pre-alpha/'+name),git('show',base+':pre-alpha/'+name).replaceAll('pre-alpha17','pre-alpha18'),'Identity-only outside Rod MCO model/presentation/controller/help: '+name);
assert.equal(text('pre-alpha/index.html'),git('show',base+':pre-alpha/index.html').replaceAll('pre-alpha17','pre-alpha18').replaceAll('Pre-Alpha 17','Pre-Alpha 18').replaceAll('PRE-ALPHA 17','PRE-ALPHA 18'));
const expectedWorkflow=git('show',base+':'+workflow).replaceAll('Fetch immutable published16 base for approved-content scope guard','Fetch immutable published17 base for approved-content scope guard').replaceAll('run: git fetch --no-tags --depth=1 origin 514157d290faa81714d48892095ad4758b5716a3','run: git fetch --no-tags --depth=1 origin '+base);
assert.equal(text(workflow),expectedWorkflow,'Only immutable scope-base CI wiring may change; publishing/security policy stays unchanged');
const names=['hot-tap-md-crop.webp','negative-ld-crop.webp','positive-ld-crop.webp','plant-pt-crop.webp','pipeline-pt-crop.webp'];
const dir=new URL('../pre-alpha/measurement-figures/',import.meta.url);assert.deepEqual(readdirSync(dir).sort(),names.toSorted());
for(const name of names){const path='pre-alpha/measurement-figures/'+name;assert.equal(hash(readFileSync(new URL('../'+path,import.meta.url))),hash(execFileSync('git',['show',base+':'+path],{cwd:root})));}
assert.equal(text('pre-alpha/workspace.css'),git('show',base+':pre-alpha/workspace.css'),'No unrelated style changes');
console.log('PASS local18 boundary: exact Rod MCO-only functional delta,17 identity-only remainder, same five images, unchanged math sources/cloud transport/storage/published root-live-dev, strict workflow-base wiring and no private/source assets');

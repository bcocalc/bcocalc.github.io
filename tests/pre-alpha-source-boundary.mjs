import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const base='514157d290faa81714d48892095ad4758b5716a3';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:24*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const hash=value=>createHash('sha256').update(value).digest('hex');
const originals={
  'hot-tap-md-crop.webp':[8598,'03efd1bf3f83e81aaa5a9eaaf5ac5dad474b866554341d8a8f2cebcb4db31e12'],
  'negative-ld-crop.webp':[9688,'6f875da3fa2ffa63ccc3e172c18737613584ca300580c72ad4dfc9c956de274e'],
  'positive-ld-crop.webp':[10346,'95d0239a03f4f65de6c65ed524224afa7666b0e7bef8c761f4f662f25c717605'],
  'plant-pt-crop.webp':[38582,'29d61e1bcc371b91601d6473430d10294587c44054166854b2a6e7131e66f7b5'],
  'pipeline-pt-crop.webp':[20028,'f2e019c6810c346236b2520fdda42b4c7a237ead8ee8a684d7f73554cbe04cc3']
};
const figureDir=new URL('../pre-alpha/measurement-figures/',import.meta.url);
assert.deepEqual(readdirSync(figureDir).sort(),Object.keys(originals).sort(),'Only the five explicitly approved crops may be copied');
let imageBytes=0;
for(const [file,[bytes,digest]]of Object.entries(originals)){
  const path=new URL(file,figureDir);assert.equal(lstatSync(path).isFile(),true);
  const body=readFileSync(path);assert.equal(body.length,bytes);assert.equal(hash(body),digest,'Do not alter approved crop arrows/captions or substitute another original: '+file);imageBytes+=bytes;
}
assert.equal(imageBytes,87242);

// Pin the complete workflow to only the new immutable scope/worker baseline wiring.
const workflowPath='.github/workflows/library-safeguard.yml',fetch='git fetch --no-tags --depth=1 origin ';
const approvedWorkflow=git('show',base+':'+workflowPath)
  .replaceAll('Fetch immutable reviewed15 base for approved-content scope guard','Fetch immutable published16 base for approved-content scope guard')
  .replaceAll(fetch+'0f891d12c618a1b87af5e895b3629b76f124aa6c',fetch+base)
  .replaceAll('Fetch immutable published 10, 11, 12 and 14 baselines for installed-worker tests','Fetch immutable published 10, 11, 12, 14 and 16 baselines for installed-worker tests')
  .replaceAll(fetch+'4e247fbebe0bab8cf7185487aa90fd90b0f25741\n',fetch+'4e247fbebe0bab8cf7185487aa90fd90b0f25741\n          '+fetch+base+'\n');
assert.equal(approvedWorkflow.split(fetch+base).length-1,4);
assert.equal(text(workflowPath),approvedWorkflow,'No workflow changes beyond exact scope/worker baseline wiring');

const allowedChanges=new Set([
  ...['AGENTS.md','auxiliary.mjs','eta-view.mjs','eta.mjs','firebase-config.js','help.mjs','index.html','measurement-help.mjs','measurement-figures.mjs','model.mjs','presentation.mjs','reference-helpers.mjs','references.mjs','review.mjs','service-worker.js','workspace-store.mjs','workspace.css','workspace.mjs'].map(name=>'pre-alpha/'+name),
  ...Object.keys(originals).map(name=>'pre-alpha/measurement-figures/'+name),
  ...['pre-alpha-measurement-help-ui.mjs','pre-alpha-measurement-help.mjs','pre-alpha-measurement-figures.mjs','pre-alpha-original-figures-ui.mjs','pre-alpha-pdf-cancellation.mjs','pre-alpha-pdf-worker-ui.mjs','pre-alpha-release-identity.mjs','pre-alpha-source-boundary.mjs','pre-alpha-worker-upgrade-ui.mjs','pre-alpha-mco-ui.mjs','sync-preview.mjs','release-check.mjs'].map(name=>'tests/'+name)
]);
const allowedPath=path=>allowedChanges.has(path);
assert.equal(allowedChanges.size,35);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))
  assert.ok(path===workflowPath||allowedPath(path),'Unapproved original/private asset or change outside17 figure scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'','Do not delete published assets as a privacy workaround');
for(const path of ['pre-alpha/original.pdf','pre-alpha/slides.pptx','pre-alpha/page.png','pre-alpha/extract.mjs','pre-alpha/formulas.xls','pre-alpha/formulas.xlsx','pre-alpha/reconciliation.json','pre-alpha/eqc-qc-1.csv','pre-alpha/restricted-table.mjs','local-only/scope.json','private-source-review.txt','pre-alpha/measurement-figures/manifest.json','pre-alpha/measurement-figures/full-page.webp','pre-alpha/measurement-figures/line-stop-ld-wd-crop.webp'])
  assert.equal(allowedPath(path),false,'Reject broader originals, full pages, private manifests, extracts and unapproved crops');

const approved={
  'measurement-help.mjs':'f52a928b79d5910709a99381599d6d9e1bb876613a0776e31883801043fc64c5',
  'measurement-figures.mjs':'b5b923dc196ce7acd036282f7c73bfe73760e9e9b11c524c1fe8109792b3a22f',
  'workspace.mjs':'f92aabaea19c42a10da2b48b2ccde91bc19060abad0503c32e98b3a4fa681e17',
  'workspace.css':'810feab1ff0e0869cc9e65a48cd678e79f2206ad1e64e20ffa248a291912aa3a',
  'index.html':'c2acecf59e98ba081ad033a039e78363ee11b9b269524bee09b36d5cdc1be0ec',
  'service-worker.js':'2ad8b7fca488141566d3a63377c070ae0e576ce2f735223cd7e2f7c279864369'
};
for(const [name,digest]of Object.entries(approved)){
  const source=text('pre-alpha/'+name);assert.equal(hash(source),digest,'Only the exact reviewed figure integration is approved: '+name);
  assert.doesNotMatch(source,/_home_saves_validation|OneDrive[\\/]|private-measurement-crops|original-technician-source-index/);
}
assert.notEqual(hash(text('pre-alpha/measurement-help.mjs')+'\nUnapproved source payload'),approved['measurement-help.mjs']);
for(const name of ['model.mjs','presentation.mjs','help.mjs','review.mjs','workspace-store.mjs','eta.mjs','eta-view.mjs','auxiliary.mjs','reference-helpers.mjs','references.mjs','firebase-config.js'])
  assert.equal(text('pre-alpha/'+name),git('show',base+':pre-alpha/'+name).replaceAll('pre-alpha16','pre-alpha17'),'MCO/LD, warnings, numerical/source/storage logic must be identity-only: '+name);
assert.ok(text('pre-alpha/workspace.css').startsWith(git('show',base+':pre-alpha/workspace.css')),'Retain every16 style as a byte-identical prefix');
assert.equal(text('pre-alpha/workspace.mjs').replace("import {installMeasurementFigures} from './measurement-figures.mjs?v=pre-alpha17';\n",'').replace('installMeasurementFigures(document);\n',''),git('show',base+':pre-alpha/workspace.mjs').replaceAll('pre-alpha16','pre-alpha17'),'Only the figure listener import/install may change the workspace owner');
assert.equal(git('ls-files','local-only','*Technician*','*reconciliation*').trim(),'','No private source records or prototypes in the candidate');
console.log('PASS local17 source boundary: only5 exact approved originals/87242 bytes plus pinned prior-help integration and strict workflow wiring; all other originals/private records rejected,16 numerical/storage/MCO/LD behavior unchanged');

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const base='0f891d12c618a1b87af5e895b3629b76f124aa6c';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:24*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const hash=value=>createHash('sha256').update(value).digest('hex');

// Pin only the two scope-base fetch edits; no general workflow exception.
const workflowPath='.github/workflows/library-safeguard.yml';
const scopeFetch='      - name: Fetch immutable reviewed15 base for approved-content scope guard\n'+
  '        run: git fetch --no-tags --depth=1 origin '+base+'\n';
const approvedWorkflow=git('show',base+':'+workflowPath)
  .replace('      - name: Fetch immutable published14 base for approved-content scope guard\n'+
    '        run: git fetch --no-tags --depth=1 origin 4e247fbebe0bab8cf7185487aa90fd90b0f25741\n',scopeFetch)
  .replace('      - name: Run the complete release command without retries\n',
    scopeFetch+'      - name: Run the complete release command without retries\n');
assert.equal(approvedWorkflow.split(scopeFetch).length-1,2,'Both guard-running jobs must fetch the exact reviewed15 object');
assert.equal(text(workflowPath),approvedWorkflow,'Only the two exact reviewed15 scope-fetch edits are permitted in CI');

// Local16 adds only established MCO, its presentation, identity and regression wiring.
// Existing public assets are not permission to add private originals or extracts.
const allowedChanges=new Set([
  ...['AGENTS.md','auxiliary.mjs','eta-view.mjs','eta.mjs','firebase-config.js',
    'help.mjs','index.html','measurement-help.mjs','model.mjs','presentation.mjs',
    'reference-helpers.mjs','references.mjs','review.mjs','service-worker.js',
    'workspace-store.mjs','workspace.mjs'].map(name=>'pre-alpha/'+name),
  ...['pre-alpha-measurement-help-ui.mjs','pre-alpha-measurement-help.mjs',
    'pre-alpha-pdf-cancellation.mjs','pre-alpha-pdf-worker-ui.mjs',
    'pre-alpha-hot-tap-ld.mjs','pre-alpha-hot-tap-ld-ui.mjs',
    'pre-alpha-mco.mjs','pre-alpha-mco-ui.mjs',
    'pre-alpha-release-identity.mjs','pre-alpha-source-boundary.mjs',
    'release-check.mjs'].map(name=>'tests/'+name)
]);
const allowedPath=path=>allowedChanges.has(path);
assert.equal(allowedChanges.size,27);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),
  ...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean)){
  assert.ok(path===workflowPath||allowedPath(path),'Unreviewed/private asset or change outside local MCO scope: '+path);
}
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'','Do not delete published assets as a privacy workaround');
for(const path of ['pre-alpha/original.pdf','pre-alpha/slides.pptx','pre-alpha/page.png',
  'pre-alpha/extract.mjs','pre-alpha/formulas.xls','pre-alpha/formulas.xlsx',
  'pre-alpha/reconciliation.json','pre-alpha/eqc-qc-1.csv',
  'pre-alpha/restricted-table.mjs','local-only/scope.json','private-source-review.txt']){
  assert.equal(allowedPath(path),false,'The scope guard must reject originals, renders, extracts, workbooks and private records');
}

const approved={
  'measurement-help.mjs':'f135ce0208d9b390a1fa4100ddc0acc5f89a5e5926c726ad397af6e6800a854d',
  'model.mjs':'e471096907711d0f9f95a5922c269b1af8b1f60f1fd74daa774be2d705e26202',
  'presentation.mjs':'21af13ef3d8397a562e2385c85cd5609bdc44a1c5c6f87e867c3e0da2c3e0226',
  'workspace.mjs':'c619e43bb65ec74b102783adf09f7ccab5040dc1d17fa85467b63c97ed5f576d',
  'workspace.css':'486a67a58f402427c4f38e4a50ad4df0443ff46ef6e183f08c01af4e2afe7dae',
  'index.html':'bc964b84ae5a547d8622ced57d1b364db878dbcc60613640ef34d1e7a40d4e68',
  'service-worker.js':'594ff5ad1b6446f94b6e450b3508de8451b8dc94c7e53e4298b10e981bfc78b9'
};
for(const [name,digest] of Object.entries(approved)){
  const source=text('pre-alpha/'+name);
  assert.equal(hash(source),digest,'Only the exact local MCO integration and retained approved UI are in scope: '+name);
  assert.doesNotMatch(source,/_home_saves_validation|OneDrive[\\/]|LOCAL PRIVATE HELP PREVIEW|validate-private-integration|original-technician-source-index/);
}
assert.notEqual(hash(text('pre-alpha/measurement-help.mjs')+'\nUnreviewed source payload'),approved['measurement-help.mjs'],'Appended extracts cannot retain the approved digest');

for(const name of ['measurement-help.mjs','help.mjs','review.mjs',
  'workspace-store.mjs','eta.mjs','eta-view.mjs','auxiliary.mjs',
  'reference-helpers.mjs','references.mjs','firebase-config.js']){
  const expected=git('show',base+':pre-alpha/'+name).replaceAll('pre-alpha15','pre-alpha16');
  assert.equal(text('pre-alpha/'+name),expected,'All unrelated numerical, help, provenance and storage logic must be identity-only: '+name);
}
assert.equal(text('pre-alpha/workspace.css'),git('show',base+':pre-alpha/workspace.css'),'All reviewed15 mobile/reflow styles stay byte-identical');
assert.equal(git('ls-files','local-only','*Technician*','*reconciliation*').trim(),'','No private prototype/source records in the candidate tree');
console.log('PASS local Pre-Alpha16 source boundary: exact27-path allowlist plus exactly pinned CI scope-fetch wiring against reviewed15, pinned established-MCO/UI integration, identity-only unrelated numerical/storage/help logic and unchanged mobile CSS; private originals/extracts/tables rejected');

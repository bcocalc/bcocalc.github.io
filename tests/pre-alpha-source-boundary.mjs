import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='c183cb28c5f5ff51db182e62afb185d1c424c378';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=body=>body.replaceAll('pre-alpha18','pre-alpha19').replaceAll('Pre-Alpha 18','Pre-Alpha 19').replaceAll('PRE-ALPHA 18','PRE-ALPHA 19').replaceAll('Pre-Alpha18','Pre-Alpha19');
const hash=body=>createHash('sha256').update(body).digest('hex');
const functional={
 'pre-alpha/AGENTS.md':'7140482acb35c63f5551877a41dcc2cc2b6440405a78b4abdfe4ce00be7f8cb1',
 'pre-alpha/index.html':'40b954d9f2fbfc84495e58ab2d443bc14760d65df51a7673dfec84a0c03adb19',
 'pre-alpha/workspace.mjs':'25f9fa9663da90c28d176a5c1ce6bd3959cdf3c51e231a1db790554bffe9b563',
 'pre-alpha/service-worker.js':'eca7d072fb308e982e2b9b6eb247cc12260dbcb528704431dba4673e0cf6caa8',
 'pre-alpha/exports.mjs':'2277209b3658d8d50a9c4e95bfaac3f73861da8f08bf15409f57f498b6c35583',
 'tests/release-check.mjs':'9227440af66afcd329a2011cb1aa75aeabe8e60788aca76e59c9c34ab0e07dbb',
 'tests/pre-alpha-exports.mjs':'9562f0e219c78c2f87697045e7e6466475a4cc1b9acff6e0fae979b7db11d91f',
 'tests/pre-alpha-exports-ui.mjs':'bbf85aee22d6a76f9719097633deaa3d5cd308eda35755c3711bff31c53559a9'
};
const identityPaths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...identityPaths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside authorized local19 export parity: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(hash(text(path)),pin,'Exact reviewed export-only implementation: '+path);
for(const path of identityPaths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside export integration: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace.css','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected source: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','Same five approved figure bytes');
console.log('PASS local19 boundary: validated18 base, exact export-only integration, identity-only remainder, unchanged formulas/storage/cloud/workflow/published source and approved figures');

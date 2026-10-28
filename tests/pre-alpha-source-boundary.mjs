import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='8d665d3101a45c010f5a179e1ad6c4fc814ffb6b';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=body=>body.replaceAll('pre-alpha19','pre-alpha20').replaceAll('Pre-Alpha 19','Pre-Alpha 20').replaceAll('PRE-ALPHA 19','PRE-ALPHA 20').replaceAll('Pre-Alpha19','Pre-Alpha20');
const hash=body=>createHash('sha256').update(body).digest('hex');
const functional={
 'pre-alpha/AGENTS.md':'ba548d7eb9095ac5a11e6e50948f0412a135a0c518666248be9de9b69dbd0bd5',
 'pre-alpha/workspace-store.mjs':'cf3ec81461bdf78861f817059c04e1da4a6b99398715809fd60133479e7ba177',
 'pre-alpha/service-worker.js':'2d4438e5975e59084778a06fb65012809a39315108f8e6d3e6d7262aeae34fa5',
 'pre-alpha/shared-save.mjs':'cdfd0a9ad5c9c07b0a6a1ce220ebc8f1872e451bc44f02f8f8e5d0103b6c7187',
 'tests/release-check.mjs':'64f98d70b75520a45d827f7efa354f1317b95b441a90ee1914a28d62a41308e9',
 'tests/pre-alpha-shared-save.mjs':'b315e08a82bca2b4285c1f2d363378eb11ef8340d97439faeaa402217f3ad649',
 'tests/pre-alpha-shared-save-ui.mjs':'acf7222e979842f625e72e6d01384a8290e439464a459cc9e8e43da43c26a51d'
};
const identityPaths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...identityPaths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside local20 injected shared-snapshot scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(hash(text(path)),pin,'Exact local20 implementation: '+path);
for(const path of identityPaths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside injected adapter/storage receipts: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace.css','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected source: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','Same five approved figures');
assert.equal(text('pre-alpha/workspace.mjs'),identity(git('show',base+':pre-alpha/workspace.mjs')),'No production shared-save UI or transport binding');
assert.equal(text('pre-alpha/firebase-config.js'),identity(git('show',base+':pre-alpha/firebase-config.js')),'Production collection and write enablement unchanged');
console.log('PASS local20 boundary: exact injected adapter/atomic capture/receipts only, identity-only remainder, production transport/config unbound and root/live/dev/source data unchanged');

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='ce6892c859f82decd24a742a4f1117e74cfacbc5';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=body=>body.replaceAll('pre-alpha21','pre-alpha22').replaceAll('Pre-Alpha 21','Pre-Alpha 22').replaceAll('PRE-ALPHA 21','PRE-ALPHA 22').replaceAll('Pre-Alpha21','Pre-Alpha22');
const hash=body=>createHash('sha256').update(body).digest('hex');
const functional={
  "pre-alpha/AGENTS.md": "8857f62481f998cc12ec46cc6188be5dc69ee6f3016bc2c7192ab29994fc92f7",
  "pre-alpha/index.html": "f3c060df9fda9cac79e01c6091d846431ae73e6bb9bd7399c70394295157215f",
  "pre-alpha/workspace.mjs": "0a4a755ff87aa727edcbcf4d27ac935ba1e6aa90e5dc8b17a7248b7a84dd21c0",
  "pre-alpha/workspace.css": "cce8984b098a934f2f221f4a3156b9824455ceff58db8a431b2a193c5b964304",
  "pre-alpha/service-worker.js": "dd41e9637072b750ed60ee6439ddbabcc5bd15184f21d3e0bde07cd06dead39c",
  "pre-alpha/modern-sharing-config.mjs": "3c4852f89e9ff8f4f2bc6474e0b7440ec87e3e659e579f10b66a527577f44168",
  "pre-alpha/modern-envelope.mjs": "a9e43fb86ebfcaaf09e4e48559b1b4b7a43f25aed8548294990050d6b7658981",
  "pre-alpha/modern-transport.mjs": "13c4ee0d994728993df45c36b5b414a36b51c45da966c6e956536be8d780483d",
  "pre-alpha/modern-saver.mjs": "fcce81adc8f0d19f93b993314c2a07e2449f56671c2bc4f910c6933659c2596c",
  "pre-alpha/modern-view.mjs": "5b488fc35e063a57f38181fc0b17495ac3a41e857582642370dc994cc7e27b83",
  "pre-alpha/modern-ui.mjs": "69ce25b88b4bf2c996bb8e6e927a05928b37a58858c90970a91009e18f18df02",
  "tests/modern-job-fixture.mjs": "810790c9d5abc0db2d0767ad9b091a953ee1d6c30df98e6a5a8139c2ac9ba7d5",
  "tests/modern-sharing-fixture.mjs": "42af5e79432d3fae893a4ed7f0e06426a873007105da44f360295d4064d86822",
  "tests/pre-alpha-modern-sharing.mjs": "e6894560a30a79096b461039404a020a89e7302a7181a5bf92fcb4cf52565c4f",
  "tests/pre-alpha-modern-sharing-ui.mjs": "8afb2ae8b5acbeeae3d121ef0b687ecbb2ee873b0cd7a3602a31b05081a95013",
  "tests/pre-alpha-home.mjs": "d4dd812cbecea0c801604046393c8c28f8b878e22d74290b0f51830156630f40",
  "tests/pre-alpha-workspace-controller.mjs": "9b24b1f18e33330f7898d422a927090a61ec3a197b070144b2106cdc7961f813",
  "tests/pre-alpha-release-identity.mjs": "5b4b743c38f46bee7684183c8c4a40495b99706543554e1078e4cf6682c1837c",
  "tests/pre-alpha-worker-upgrade-ui.mjs": "6cd691573089c3ab6d766bb646ad311ce787cf28dba0be6f7c231f2af8078a24",
  "tests/release-check.mjs": "9a9ed76a9fb2eed66fe7a58c01dd689877b28b3bb9a2151a54f5cc1d7312b342",
  "docs/pre-alpha-modern-sharing-rules-draft.txt": "50e719cffd848f2ddf4de241ba6950c97825abe0bfc2db742c42a3147e34961f"
};
const identityPaths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...identityPaths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside local21 exact HTP/Hi-Stop parity scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(hash(text(path)),pin,'Exact source-reviewed local21 delta: '+path);
for(const path of identityPaths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside distinct-family implementation: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace-database.mjs','pre-alpha/pipe-data.mjs','pre-alpha/reference-data.mjs','pre-alpha/reference-supplement-data.mjs'])assert.equal(git('diff',base,'--',path),'','Protected legacy/math/data/storage authority: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','Same five approved figures');
assert.equal(text('pre-alpha/workspace-store.mjs'),identity(git('show',base+':pre-alpha/workspace-store.mjs')),'Family work does not alter transaction/capture/receipt semantics');
assert.equal(text('pre-alpha/firebase-config.js'),identity(git('show',base+':pre-alpha/firebase-config.js')),'No production collection or write enablement');
assert.doesNotMatch(text('pre-alpha/workspace.mjs'),/createSharedSaver|bindSharedSaving/,'Production shared-save binding remains unapproved and unbound');
assert.equal(text('tests/pre-alpha-original-figures-ui.mjs'),identity(git('show',base+':tests/pre-alpha-original-figures-ui.mjs')),'Inherited offline/network/assertion instrumentation preserved');
assert.ok(text('pre-alpha/workspace.css').startsWith(identity(git('show',base+':pre-alpha/workspace.css'))),'Original styles unchanged; only scoped sharing additions');
assert.match(text('pre-alpha/modern-sharing-config.mjs'),/PRODUCTION_MODERN_BINDING=null/,'Production remains unbound');
assert.doesNotMatch(text('pre-alpha/modern-transport.mjs'),/https:\/\/firestore|apiKey/,'No production endpoint or credentials wired');
assert.match(text('docs/pre-alpha-modern-sharing-rules-draft.txt'),/request.auth.uid in \[\]/,'Rule draft authorizes no real accounts');
console.log('PASS local22 boundary: exact scoped synthetic/private sharing modules/UI/tests and build identity; unchanged calculations/tables/feed/root/live/dev/legacy transport/storage authority/approved crops/offline assertions; production unbound and empty rule-draft allowlist');

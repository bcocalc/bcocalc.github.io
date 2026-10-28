import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='3c29fe6f9328721662f588844270305717cdb539';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=body=>body.replaceAll('pre-alpha20','pre-alpha21').replaceAll('Pre-Alpha 20','Pre-Alpha 21').replaceAll('PRE-ALPHA 20','PRE-ALPHA 21').replaceAll('Pre-Alpha20','Pre-Alpha21');
const hash=body=>createHash('sha256').update(body).digest('hex');
const functional={
 'pre-alpha/AGENTS.md':'3931fe9f431fe5f6ff715ae1ad1c53cfbc09fa4bad4854d6a933dca28fd1551d',
 'pre-alpha/families.mjs':'c1adcedfed16a7e7913dfa6c630cc1a243d8e25167bd141e84183a0ceef8ef85',
 'pre-alpha/model.mjs':'bc714b7afca5db26dd11426e138d9bdbef40daf25401dd37fbc1f2f9b80ab85f',
 'pre-alpha/review.mjs':'1c8c3315a832686ae40b86257741e3fd6fb2f3139ffdcace9ad4d942eee213df',
 'pre-alpha/presentation.mjs':'c0966cc4bd063265272ea8e05002ffd461360e272d88ae9f9ef67b30201a4de9',
 'pre-alpha/workspace.mjs':'708149bf2ded648f47b41698f8ccb46303090733449d9dd0a5df62aa1f6e2c0f',
 'pre-alpha/eta.mjs':'1d7ec65bda94bd332f83516a10cfcd784fad3f6454df1e05494eac83df7bb712',
 'pre-alpha/eta-view.mjs':'9babc6a49dba06ae291e7e3295e6f7168badca14666996ccbf063eb0fddac924',
 'pre-alpha/auxiliary.mjs':'62d418e68ad1f750372fe68daec24842a6b1e07e1294ac758ad1ef96efef93e8',
 'pre-alpha/help.mjs':'6eb7d2d1bfdc8a3524e16cac7aaeab79ca45d040a7457df39327250b57053614',
 'pre-alpha/exports.mjs':'bf0913b028e91fad8282e510d440e7cf9b700eec1bb0772e3171ba9715bffea8',
 'pre-alpha/shared-save.mjs':'2856cdaf21e207fc8008fd673bedf238b201bc96fea8b4948cef1d8af5bfe7b0',
 'pre-alpha/index.html':'2e6e659988a0d446b8a148984d43b23380f850066e26b7b7d4b3ebba2467739b',
 'pre-alpha/service-worker.js':'f36be86bb688e8d31a29ed87b17801a4f6791c68d4fe6037e8021b32fe58bcbf',
 'tests/pre-alpha-families.mjs':'14dcf8947e8794c32487886d6a0925353ca35cc8cd6fd63ac1a5575a0680031d',
 'tests/pre-alpha-families-ui.mjs':'2e1308c1f597f1e8e3153c9927ebc3dd297563d5f7384d542a066cfa1692da26',
 'tests/pre-alpha-model.mjs':'171379aa3347fdc089c97fc633d398826fdb8fb787784e8a5147e54834bb9c45',
 'tests/pre-alpha-next-model.mjs':'abcff53152565a4a6132aefa3fddced5ef7606cae7f38ee3fbbf6be2f3e3719b',
 'tests/pre-alpha-home.mjs':'aff2863fda01bcca24ced10ba7de2d78df2751c0da78ea51f14bd60b2f5f7ff9',
 'tests/pre-alpha-exports.mjs':'dbb506db8a0a3f59552c679138100ed32d158cafe8d44b963ae7b696c8bd5f94',
 'tests/pre-alpha-exports-ui.mjs':'d23389fb72b85ff2fb398974c8a56fc2c5306bb98a1f395ce4b43e6842f23803',
 'tests/pre-alpha-shared-save.mjs':'4237b154297d28cdb0e68157a48f2a4fc2a0ceab71c53ba329a661930eab4939',
 'tests/pre-alpha-ui.mjs':'be17fd4b905b84cd6c3c91054d367ec22cc374c0b8e3889da475cc08b089c31d',
 'tests/release-check.mjs':'7876adcb0a242de05cb7c82e467f497c58747dc21b2c53556f2a3b2673c688c0'
};
const identityPaths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...identityPaths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside local21 exact HTP/Hi-Stop parity scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(hash(text(path)),pin,'Exact source-reviewed local21 delta: '+path);
for(const path of identityPaths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside distinct-family implementation: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace.css','pre-alpha/workspace-database.mjs','pre-alpha/pipe-data.mjs','pre-alpha/reference-data.mjs','pre-alpha/reference-supplement-data.mjs'])assert.equal(git('diff',base,'--',path),'','Protected legacy/math/data/storage authority: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','Same five approved figures');
assert.equal(text('pre-alpha/workspace-store.mjs'),identity(git('show',base+':pre-alpha/workspace-store.mjs')),'Family work does not alter transaction/capture/receipt semantics');
assert.equal(text('pre-alpha/firebase-config.js'),identity(git('show',base+':pre-alpha/firebase-config.js')),'No production collection or write enablement');
assert.doesNotMatch(text('pre-alpha/workspace.mjs'),/createSharedSaver|bindSharedSaving/,'Production shared-save binding remains unapproved and unbound');
assert.equal(text('tests/pre-alpha-original-figures-ui.mjs'),identity(git('show',base+':tests/pre-alpha-original-figures-ui.mjs')),'Inherited offline/network/assertion instrumentation preserved');
console.log('PASS local21 boundary: exact distinct-family formulas/chart eligibility/UI/ETA/history/export/capture only; unchanged legacy sources/tables/feed/storage authority/crops; inherited offline checks and unbound production sharing preserved');

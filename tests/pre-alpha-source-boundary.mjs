import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='6b7af271361628aea2ab940abc95533f4e6fa7b6';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=value=>value.replaceAll('pre-alpha23','pre-alpha24').replaceAll('Pre-Alpha 23','Pre-Alpha 24').replaceAll('PRE-ALPHA 23','PRE-ALPHA 24').replaceAll('Pre-Alpha23','Pre-Alpha24');
const functional={
  "pre-alpha/AGENTS.md": "0f9d9d96d2b204181dc6bf9846ec6625e1bb4934600bb607cdaf39471cde2892",
  "pre-alpha/index.html": "bd85355c58ffdef1af218fd6ef552deab11b03130d42f1eeed124526d2a13566",
  "pre-alpha/modern-envelope.mjs": "aad828918516b6f1ea5e63af0f9bebc9bc4dc180eb2b7b8e54cae872b44177a6",
  "pre-alpha/modern-saver.mjs": "b621f5ba735e61549901dd867b96046236002b716e51140e1a46bd8bf1be70b9",
  "pre-alpha/modern-sharing-config.mjs": "7311ae154f9611029dbd8020d42b1eab5f7cc5d9c20467a55926e78e5a99842d",
  "pre-alpha/modern-transport.mjs": "4ca2b12b20eef86b33c83df9f67a0af5bf2803f1b49ab99da7eac25524d26d75",
  "pre-alpha/modern-ui.mjs": "081776deb7c07207a40fe349acb5cc4206a4ab5193178c92109cb7cc589bcc90",
  "pre-alpha/modern-view.mjs": "06d56d51b85cf4faa6887dcc6107277f3de34c6b1465ce416a74f22846185bcc",
  "pre-alpha/workspace.mjs": "d2a07ab2ec6b0b1412912c0b2cfb8579109c193f9a596efe8d9aa38c06880db4",
  "pre-alpha/workspace.css": "ee87026f47263337aeb56637078a9860c6e192f26a7fc7d38d6be97e98619a5f",
  "pre-alpha/service-worker.js": "74fd1034d15717b1929cce7b700b5155535e978b042414d8e52a2bf010587eed",
  "pre-alpha/shared-library.mjs": "a36e9e0225aa9f7d9ac30f9dcccefba070825961adb4cf035dbd8a0f43e9ca65",
  "tests/modern-sharing-fixture.mjs": "8d4d39ee758a9d58e5d936af3509c750627a1c693d1ebac0a4e39c03f6e2d4c1",
  "tests/pre-alpha-modern-sharing.mjs": "0dd18a43e26994c0c914ffc0f804bd60eee9f423c01d94028929eee2a71ffdef",
  "tests/pre-alpha-modern-sharing-ui.mjs": "291e295ac950bd401829adbea8133f5aabe47afca8ae43d34e404079c0113cdf",
  "tests/pre-alpha-home.mjs": "0460a2eceb54cb199268f857b49a5ad588c332737260727aa91cc7cc6df38e6a",
  "tests/pre-alpha-ui.mjs": "9ec64b6a7918758bab8894b99ce5e69c0e77a268f371ad0d06a9a7cdb976a698",
  "docs/pre-alpha-shared-library-rules-draft.txt": "5dcfa795bf74b408cd954e76ed9f314b6018f681ff5922413e7d29d2791ecacc"
};
const paths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...paths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside local one-site Shared Jobs scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(createHash('sha256').update(text(path)).digest('hex'),pin,'Exact reviewed one-site delta: '+path);
for(const path of paths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside Shared Jobs implementation: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','firebase-config.js','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected root/dev/legacy/backend/storage authority: '+path);
for(const path of ['pre-alpha/workspace-store.mjs','pre-alpha/shared-save.mjs','pre-alpha/firebase-config.js','pre-alpha/reference-helpers.mjs','pre-alpha/references.mjs','pre-alpha/model.mjs','pre-alpha/families.mjs'])assert.equal(text(path),identity(git('show',base+':'+path)),'Unchanged store/capture/read destination/folding/calculation semantics: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','No private/source image additions or changes');
const envelope=text('pre-alpha/modern-envelope.mjs'),oldEnvelope=identity(git('show',base+':pre-alpha/modern-envelope.mjs'));
assert.equal(envelope.slice(0,envelope.indexOf('export async function makeEnvelope')),oldEnvelope.slice(0,oldEnvelope.indexOf('export async function makeEnvelope')),'Existing strict lossless JSON/byte cap/hash primitives retained');
assert.match(text('pre-alpha/modern-sharing-config.mjs'),/PRODUCTION_MODERN_BINDING=null/);
assert.doesNotMatch(text('pre-alpha/index.html'),/id="modern-auth-controls"|id="modern-signin"|id="modern-signout"|id="modern-link"|data-modern-copy/,'No mandatory recipient accounts or per-job link distribution UI');
assert.doesNotMatch(text('pre-alpha/modern-ui.mjs'),/getSession|signIn|signOut|clipboard|copyLink/,'No auth/provider/capability plumbing in release controller');
assert.match(text('pre-alpha/modern-transport.mjs'),/fixed.collection==='tapcalcJobs'/,'New adapter refuses legacy write namespace');
assert.doesNotMatch(text('pre-alpha/modern-transport.mjs'),/Authorization|https:\/\/firestore|apiKey/,'Anonymous loopback only; no production credentials or endpoint');
assert.match(text('pre-alpha/workspace.mjs'),/legacyList:\(\)=>window.tapCalcCloud.list\(\)/,'Original legacy read transport remains the list source');
assert.match(text('docs/pre-alpha-shared-library-rules-draft.txt'),/LOCAL REVIEW FRAGMENT ONLY/);
assert.match(text('docs/pre-alpha-shared-library-rules-draft.txt'),/allow update, delete: if false/);
console.log('PASS local24 boundary: exact one-site anonymous list/view/Load-Save-Sync and local fixtures; preserved full bundles/store/folding/math/tables/crops/legacy transport; production binding null and no live rule changes.');

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='755ff1d83a131972ddb042223a30b3b4c21d64d2';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=body=>body.replaceAll('pre-alpha22','pre-alpha23').replaceAll('Pre-Alpha 22','Pre-Alpha 23').replaceAll('PRE-ALPHA 22','PRE-ALPHA 23').replaceAll('Pre-Alpha22','Pre-Alpha23');
const hash=body=>createHash('sha256').update(body).digest('hex');
const functional={
  "pre-alpha/AGENTS.md": "b9cfe9c6d53faef823023e5e5351089032b4682cc44cfce493caba41d6f97549",
  "pre-alpha/reference-helpers.mjs": "33f4f9205ea41bd9990890f20f881f54e48bb43c537c95a742cff6e6b415794b",
  "pre-alpha/references.mjs": "5bcb4e97f34593069473a824a30a4f49cc1403f0c1bb19613ec50383c0b6a4de",
  "tests/pre-alpha-folding-dimensions.mjs": "a8279552a143f1b02413f876614069f601b18eb818cf03b49785df9fde1a49f7",
  "tests/pre-alpha-folding-dimensions-ui.mjs": "4b2019bf8b33b5d9184056489211b032221af766845663b18dbcb1794fc58c86",
  "tests/release-check.mjs": "639a5f4969e9276e53cc49458f3b220b9e0f3877609aef0659a2ac20bb2cce68"
};
const identityPaths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...identityPaths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside local Folding Head scope: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(hash(text(path)),pin,'Exact reviewed Folding Head delta: '+path);
for(const path of identityPaths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only inherited application/test: '+path);
const oldHelper=identity(git('show',base+':pre-alpha/reference-helpers.mjs')),helper=text('pre-alpha/reference-helpers.mjs');
const between=(value,start,end)=>value.slice(value.indexOf(start),end?value.indexOf(end,value.indexOf(start)):undefined);
assert.equal(helper.slice(0,helper.indexOf('export const FOLDING_NOTES')),oldHelper.slice(0,oldHelper.indexOf('export const FOLDING_NOTES')),'All parser, catalog and Pivot Head logic unchanged');
assert.equal(between(helper,'export function calculateFoldingHead','\nexport const UWIRE_NOTES').replace(',dimensions:calculateFoldingDimensions(values)',''),between(oldHelper,'export function calculateFoldingHead','\nexport const UWIRE_NOTES'),'Existing Folding Head set-point/bar-target math unchanged');
assert.equal(between(helper,'export const UWIRE_NOTES','export function helperFields'),between(oldHelper,'export const UWIRE_NOTES','export function helperFields'),'U-Wire/source tables unchanged');
assert.equal(between(helper,'export function helperFields','export function helperReference').replace('Actual pipe O.D. / POD (in)','POD / pipe O.D. (in)'),between(oldHelper,'export function helperFields','export function helperReference'),'Only actual-O.D. label changes in existing helper fields');
assert.equal(between(helper,'export function helperReference',"  if(category==='foldinghelper')"),between(oldHelper,'export function helperReference',"  if(category==='foldinghelper')"),'Pivot reference rendering unchanged');
assert.equal(between(helper,"  if(category==='uwire'){"),between(oldHelper,"  if(category==='uwire'){"),'Other helper rendering unchanged');
assert.equal(text('pre-alpha/references.mjs').replace('Set point, backing ring & rollers','Set-point / bar-target helper'),identity(git('show',base+':pre-alpha/references.mjs')),'Reference owner/input retention/current-pipe transfer unchanged');
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','dev/measurement.js','.github/workflows/library-safeguard.yml','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected existing root/dev/backend/storage authority: '+path);
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','No new/changed private or approved image assets');
assert.match(text('pre-alpha/modern-sharing-config.mjs'),/PRODUCTION_MODERN_BINDING=null/);
console.log('PASS local23 boundary: only explicit Folding Head ring/roller formulas, labels/qualifications, tests and build identity; unchanged Pivot/set-point/U-Wire/math/tables/storage/sharing/root/dev/backend/crops.');

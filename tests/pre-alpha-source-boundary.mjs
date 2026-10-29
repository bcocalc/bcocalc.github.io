import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='fcdb3d7d5b9bca5ecce0d6050d1577ff315b52d5';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=value=>value.replaceAll('pre-alpha24','pre-alpha25').replaceAll('Pre-Alpha 24','Pre-Alpha 25').replaceAll('PRE-ALPHA 24','PRE-ALPHA 25').replaceAll('Pre-Alpha24','Pre-Alpha25');
const functional={
  "tests/pre-alpha-reference-selectors.mjs": "4ca60772877b50020e6347f2843837ecd7de08d21168d642e4851125c43d8ad4",
  "tests/pre-alpha-folding-dimensions-ui.mjs": "fc25e379a1e576b221ba1201a72df60dd0d6cd15ea4c222d1123cfcaf6ad4591",
  "tests/pre-alpha-folding-dimensions.mjs": "bc66befff6e8f596aaa9322160cd903f59817ad228aeacb030895b87c324c3b5",
  "pre-alpha/references.mjs": "e2d4d2f8a8747d4cc477e3a582f0b98a6c7388a436e0e66588dc40985f54e046",
  "pre-alpha/reference-helpers.mjs": "99ba15b95acf88d5167ddd2ec861f72a756fd7c48788ac41ee8718dbf805edd1",
  ".github/workflows/library-safeguard.yml": "1750e2f452b4960143d652add2a7a832de7be812bc70070e0c8fc8040f091e65",
  "tests/pre-alpha-modern-sharing.mjs": "cc80f566738a1d004d333a593f54f70b510de2d04940e115c7aa6bf41e24f004",
  "pre-alpha/AGENTS.md": "1231acc377a48f032bca6399d0a7db12d4ccd97b3c85fca51f26a7e3627a41ee",
  "pre-alpha/modern-sharing-config.mjs": "2dfaeaff716e69a3c8630451d2ec52b8ade14f31bf57908e2d3290f3685d26d7",
  "pre-alpha/modern-transport.mjs": "397d524fd9ae0df63d6b0840dbca6544398814ba51f3d8171c08113566a8d336",
  "pre-alpha/modern-ui.mjs": "39338a8e5c12f62996b45ba3e44765fbf917b679f7818c27083aed77039a9489",
  "pre-alpha/workspace.mjs": "636ee703dc65947f5bb926944ffc99a0bb07ac16232352e7db4e0ed87a4f9425",
  "tests/pre-alpha-production-binding.mjs": "bb79b42a7dd60fba2cc8e0ad1e871b497f996fbd046ff6a5f12bff23cf43f44c",
  "tests/pre-alpha-modern-sharing-ui.mjs": "8616f8be0a7004de14c5419edec493bfbd4486c1e951b80e783df7bbcba3c743",
  "tests/release-check.mjs": "94dd8f0b760391ef5784ab6f068448b35f767df9424a46f49fe97105990c4db2",
  "docs/pre-alpha-production-policy-proposal.rules": "5b2d23015f192cb41016d95936eea6febd9d48fcd64c6096b5968a8f5415ee50"
};
const paths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...paths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside reviewed production activation: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(createHash('sha256').update(text(path)).digest('hex'),pin,'Exact reviewed production activation and Head Assembly UI: '+path);
for(const path of paths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside preparation: '+path);
for(const path of ['measurement.js','cloud-sync.js','firestore.rules','firebase-config.js','dev','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected root/dev/backend/CI/database authority: '+path);
for(const path of ['pre-alpha/workspace-store.mjs','pre-alpha/shared-save.mjs','pre-alpha/firebase-config.js','pre-alpha/model.mjs','pre-alpha/families.mjs','pre-alpha/modern-envelope.mjs','pre-alpha/modern-saver.mjs','pre-alpha/shared-library.mjs','pre-alpha/modern-view.mjs'])assert.equal(text(path),identity(git('show',base+':'+path)),'Preserved math/folding/parser/store/capture/one-site library/view semantics: '+path);
// The approved Head Assembly move changes only helper presentation and wheel wording.
const helpers=text('pre-alpha/reference-helpers.mjs'),oldHelpers=identity(git('show',base+':pre-alpha/reference-helpers.mjs'));
const section=(source,start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);};
assert.equal(helpers.slice(0,helpers.indexOf('export const FOLDING_NOTES')),oldHelpers.slice(0,oldHelpers.indexOf('export const FOLDING_NOTES')),'Pivot, parsing and existing source data unchanged');
assert.equal(section(helpers,'export function calculateFoldingDimensions','export const UWIRE_NOTES').replaceAll('wheel','roller'),section(oldHelpers,'export function calculateFoldingDimensions','export const UWIRE_NOTES'),'Folding formulas and validation unchanged except approved visible wheel wording');
assert.equal(section(helpers,'export const UWIRE_NOTES','export function helperFields'),section(oldHelpers,'export const UWIRE_NOTES','export function helperFields'),'U-Wire formulas, validation and source data unchanged');
assert.equal(git('diff','--name-only',base,'--','pre-alpha/measurement-figures').trim(),'','No original/approved image changes');
const config=text('pre-alpha/modern-sharing-config.mjs'),transport=text('pre-alpha/modern-transport.mjs'),ui=text('pre-alpha/modern-ui.mjs');
assert.match(config,/PRODUCTION_MODERN_BINDING=PRODUCTION_MODERN_PROPOSAL/);assert.match(config,/kind:'firestore-public',enabled:true/);assert.match(config,/database:'\(default\)'/);assert.match(config,/collection:'tapcalcModernSnapshots'/);
assert.match(transport,/proposal\?\.enabled!==true/);assert.match(transport,/proposal.endpoint!=='https:\/\/firestore.googleapis.com'/);assert.match(transport,/fixed.collection==='tapcalcJobs'/);assert.match(transport,/currentDocument:\{exists:false\}/);assert.match(transport,/credentials:'omit',redirect:'error'/);
assert.match(ui,/binding===PRODUCTION_MODERN_BINDING/);assert.doesNotMatch(ui,/getSession|signIn|signOut|clipboard|copyLink/);assert.match(text('pre-alpha/workspace.mjs'),/legacyList:\(\)=>window.tapCalcCloud.list\(\)/);
const original=text('firestore.rules'),draft=text('docs/pre-alpha-shared-library-rules-draft.txt'),fragment=draft.slice(draft.indexOf('match /tapcalcModernSnapshots'),draft.indexOf('\nThis proposed policy'));
assert.equal(text('docs/pre-alpha-production-policy-proposal.rules').split('\n').slice(2).join('\n').replace(fragment+'\n',''),original,'Policy proposal only adds the reviewed new match to unchanged checked-in legacy source; not deployed evidence');
assert.match(text('pre-alpha/AGENTS.md'),/Runtime\/window\/localStorage values cannot activate/);
console.log('PASS local25 boundary: fixed source production activation plus local Head Assembly UI; one-site workflow/full raw captures/store/folding/current math preserved from frozen24; root/dev/deployed authority/crops untouched; exact test CI pinned; local additive policy is not deployed evidence.');

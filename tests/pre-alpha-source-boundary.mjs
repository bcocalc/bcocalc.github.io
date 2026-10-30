import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),base='fcdb3d7d5b9bca5ecce0d6050d1577ff315b52d5';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024}).replace(/\r\n/g,'\n');
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const identity=value=>value.replaceAll('pre-alpha24','pre-alpha26').replaceAll('Pre-Alpha 24','Pre-Alpha 26').replaceAll('PRE-ALPHA 24','PRE-ALPHA 26').replaceAll('Pre-Alpha24','Pre-Alpha26');
const functional={
  "pre-alpha/vendor/pdf-worker-provenance.json": "1731bbbf7adf7e4bbd580f98360d45252bf05433a3dc12c18bc369c0416c4604",
  "tests/pdf-cleanup-ownership.mjs": "835595d11afe241e3031dd4fcbd908be2ef5f4246ef9cc402890d0a42a86e743",
  "pdf-api-provenance.json": "e44e0c2b339bbe532853e9d5be7027e8fb1558b965bc317df6160fca134ea9be",
  "pdf.mjs": "ff83b28e86afb9a598e52c9c0f989feec24830126687bebac8ae0261e1479165",
  "tests/root-runtime-cache-lifetime.mjs": "13e3d3ae9611a2978eac3d6f5956271dda08a32be92682db336edac67f276ed7",
  "tests/pre-alpha-worksheet-deferred.mjs": "3c3154cba90c4c70028052bc132da4380b08560491946d2bb215923297172817",
  "tests/pre-alpha-worksheet-deferred-ui.mjs": "9eafca526c691d661aad86075e934fd42e53882e843c041c46cbe81a3f66fda8",
  "docs/pre-alpha-worksheet-local-draft.md": "919d74bb78523087159ba211015af3e2af01dc8b6fd0fdec3aac69ab12b6fbb0",
  "tests/pre-alpha-exports-ui.mjs": "ec522552727976091d2f80229ab34bc5b3d564200602d138c9cb2959e738b7e5",
  "tests/runner-cleanup-test.mjs": "05586171e385b7c0852492615182b9c6681764cb12337b007d24046f206eb9fa",
  "tests/runner-cleanup.mjs": "c25cb1b3eae4b354d19c15cf5caaa9c362780ece52479d21265dddbeb3fae565",
  "tests/pre-alpha-release-identity.mjs": "8e16364f5c684342e656cc6c52aa2128fe3c6bb9d4f9c8f111bfe3b030a6dd0a",
  "firebase-config.js": "403777e4aad8ed946fbfa0418286b32c13517f15f659051a859b73f97499725d",
  "measurement.js": "788d7b370acf21fca7ef47f57ff2ec0ab7c76f415a63fa5fe33a2930fb36a87d",
  "docs/pre-alpha26-local-launch-readiness.md": "044bd8c76cc3d671818e148de754761bf1da1def7121e4c1827311585daef4b1",
  "tests/launch-worker-upgrade-ui.mjs": "80e0448a6549142a585e8f75dc37fc19637db1b3bb6ea449ec15df3100c482c7",
  "tests/launch-readiness.mjs": "ee72f2034f0b19e5a17e248914b82230c86b82ff09878500604af3e477b129c1",
  "tests/library-release-guard.mjs": "4ec9c07c40176a82f741f4a846623a58abe5f72e73f169948a3e7387ed2324cb",
  "measurement-card.html": "2b275fbc59d07a6258163248504167f16cc55b3f3d16973e7f6edda7228a69a1",
  "service-worker.js": "c8226496043a7f42657d96011334361d82bd1a9fc81e1511397d9f7f2170cf4f",
  "manifest.json": "479a51a3de2ccee5c46c661591395031a6126b6241ec3a612d4640b05c38f763",
  "index.html": "0bd867f99dab99483894b03289b02c8f0230f8818df3eaf2736c8bd352d1f008",
  "launch.js": "0a69df1dcb9c0a6a3d9c4078223e773a83013403e54714027089fbaae4748b08",
  "pre-alpha/worksheet-print.css": "04de166fd4e01709797e08fb0ba2a1b0ecd1afbd33a7c8c2a3abcb5af080763c",
  "tests/pre-alpha-worksheet-ui.mjs": "3303c501a9df1945fa905e85327df6ab2da9684361ef3bca39f9abbb92e352a4",
  "tests/pre-alpha-worksheet.mjs": "11bd35a79abe20dd53b735d1d438c5c77da2589c60f37d11847e04cce4b63be6",
  "pre-alpha/service-worker.js": "f12a1c3ca926da59889ae2e4c6a6c0c2146e14959bae3bb88bdfd27276d3f1f4",
  "pre-alpha/index.html": "65c4bdaf0112c3c84a884a833bd78c78f2839c4180560fa6fc752388d8234e9f",
  "pre-alpha/exports.mjs": "746b0e28292dd874a714899b0971eb0638ad7e503efff9ce6dd833ff535c54a0",
  "pre-alpha/worksheet-draft.css": "9eb896be0b20e2c8d1fb7f7621606f7c89c346002b8147e0c5d99a6a70f6dd07",
  "pre-alpha/worksheet-draft.html": "2177cf8d2b3fffc67878137244d84e529f20c4678f2ea26090862d694a1ecdd6",
  "pre-alpha/worksheet-draft-ui.mjs": "53c5426b7273716c84a679348ccc8262e152f4e4e8a8707de1e555e898a74bdd",
  "pre-alpha/worksheet-draft.mjs": "bd04ed1661b0d1f2daaa748f216ef7f50d36d6acbf4ea5190f508c5f2b5ba982",
  "tests/pre-alpha-reference-selectors.mjs": "4ca60772877b50020e6347f2843837ecd7de08d21168d642e4851125c43d8ad4",
  "tests/pre-alpha-folding-dimensions-ui.mjs": "fc25e379a1e576b221ba1201a72df60dd0d6cd15ea4c222d1123cfcaf6ad4591",
  "tests/pre-alpha-folding-dimensions.mjs": "bc66befff6e8f596aaa9322160cd903f59817ad228aeacb030895b87c324c3b5",
  "pre-alpha/references.mjs": "63c47ac3a690033ab6fa28ec7be3f45c3ebc1c2c31904e468732a059dda2d885",
  "pre-alpha/reference-helpers.mjs": "280e70af15cfd6410b01a04c589928512cde08d034a857153f9703c206856908",
  ".github/workflows/library-safeguard.yml": "30c7a346a8d47ff087ee1a0442b127871884e77aa4f7dee84e5212adbcb7454c",
  "tests/pre-alpha-modern-sharing.mjs": "cc80f566738a1d004d333a593f54f70b510de2d04940e115c7aa6bf41e24f004",
  "pre-alpha/AGENTS.md": "b808e34b3770a5751ed5e9c4beceeef70ed6ae5da92dcd77672c61c0009346eb",
  "pre-alpha/modern-sharing-config.mjs": "2dfaeaff716e69a3c8630451d2ec52b8ade14f31bf57908e2d3290f3685d26d7",
  "pre-alpha/modern-transport.mjs": "d00d5ab6445d74ed4e26760ae607e36fc7793132403ce14a5e61bbdce85618c4",
  "pre-alpha/modern-ui.mjs": "54c8e2818da8bca404975f8b7abf4762f009f8df6bd305cbfab2cca894b39747",
  "pre-alpha/workspace.mjs": "7c022f517bf6c0267cd4cd87d142bf705eb412e40282b15916236c1caab2f3f7",
  "tests/pre-alpha-production-binding.mjs": "bb79b42a7dd60fba2cc8e0ad1e871b497f996fbd046ff6a5f12bff23cf43f44c",
  "tests/pre-alpha-modern-sharing-ui.mjs": "8616f8be0a7004de14c5419edec493bfbd4486c1e951b80e783df7bbcba3c743",
  "tests/release-check.mjs": "ef108043651a153388462d488689ea240d192ec95438a95ccc2d25038298717b",
  "docs/pre-alpha-production-policy-proposal.rules": "5b2d23015f192cb41016d95936eea6febd9d48fcd64c6096b5968a8f5415ee50"
};
const paths=git('ls-tree','-r','--name-only',base,'pre-alpha','tests').trim().split('\n').filter(path=>/^pre-alpha\/[^/]+\.(?:mjs|js|html|css)$/.test(path)||/^tests\/pre-alpha[^/]+\.mjs$/.test(path));
const allowed=new Set([...Object.keys(functional),...paths,'tests/pre-alpha-source-boundary.mjs']);
for(const path of [...git('diff','--name-only',base,'--').split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))assert.ok(allowed.has(path),'Outside reviewed production activation: '+path);
assert.equal(git('diff','--name-only','--diff-filter=D',base,'--').trim(),'');
for(const [path,pin]of Object.entries(functional))assert.equal(createHash('sha256').update(text(path)).digest('hex'),pin,'Exact reviewed production activation, Head Assembly UI and local worksheet: '+path);
for(const path of paths.filter(path=>!functional[path]&&path!=='tests/pre-alpha-source-boundary.mjs'))assert.equal(text(path),identity(git('show',base+':'+path)),'Identity-only outside preparation: '+path);
for(const path of ['cloud-sync.js','firestore.rules','dev','pre-alpha/workspace-database.mjs'])assert.equal(git('diff',base,'--',path),'','Protected root/dev/backend/CI/database authority: '+path);
// Only the existing root registration owner changes; credentials and calculator bytes stay frozen.
const duplicateWorkerOwner="if ('serviceWorker' in navigator) {\n  window.addEventListener('load', async () => {\nnavigator.serviceWorker.register('service-worker.js?v=3.0.0-livefix21', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});\n  });\n}\n";
const previewLifecycle="let machineReferencePageHidden=false;\nlet machineReferencePreviewPaused=false;\nwindow.addEventListener('beforeunload',()=>{\n  const pausedToken=++machineReferenceVisualRenderToken;\n  machineReferencePreviewPaused=true;\n  stopMachineReferenceVisualLoads().catch(error=>console.error('Stack-up preview cleanup failed.',error));\n  if(!machineReferenceVisualFallbackEl)return;\n  setMachineReferenceVisualMessage('Preview paused. ',true);\n  const resume=document.createElement('button');\n  resume.type='button';resume.className='secondary-btn';resume.textContent='Resume preview';\n  resume.addEventListener('click',()=>{\n    if(machineReferencePageHidden||resume.disabled||pausedToken!==machineReferenceVisualRenderToken)return;\n    resume.disabled=true;machineReferencePreviewPaused=false;updateMachineReferenceSummary();\n  });\n  machineReferenceVisualFallbackEl.appendChild(resume);\n});\nwindow.addEventListener('pagehide',()=>{machineReferencePageHidden=true;machineReferencePreviewPaused=true;machineReferenceVisualRenderToken+=1;stopMachineReferenceVisualLoads().catch(error=>console.error('Stack-up preview cleanup failed.',error));});\nwindow.addEventListener('pageshow',(event)=>{machineReferencePageHidden=false;if(event.persisted){machineReferencePreviewPaused=false;updateMachineReferenceSummary();}});\n";
const previewLoader="function stopMachineReferenceVisualLoads() {\n  const entries = [...stackupPdfDocumentCache.values()];\n  stackupPdfDocumentCache.clear();\n  return Promise.all(entries.map((entry) => entry.task.destroy()));\n}\n\nasync function getStackupPdfDocument(pdfUrl, token) {\n  const current = () => !machineReferencePageHidden && !machineReferencePreviewPaused && token === machineReferenceVisualRenderToken;\n  if (!current()) return null;\n  const pdfjsLib = await getStackupPdfJs();\n  if (!current()) return null;\n  if (!stackupPdfDocumentCache.has(pdfUrl)) {\n    const task = pdfjsLib.getDocument({ url: pdfUrl });\n    const entry = { task, promise: null };\n    entry.promise = task.promise.catch((error) => {\n      if (stackupPdfDocumentCache.get(pdfUrl) === entry) stackupPdfDocumentCache.delete(pdfUrl);\n      throw error;\n    });\n    stackupPdfDocumentCache.set(pdfUrl, entry);\n  }\n  return stackupPdfDocumentCache.get(pdfUrl).promise;\n}\n\n", frozenPreviewLoader="async function getStackupPdfDocument(pdfUrl) {\n  if (!stackupPdfDocumentCache.has(pdfUrl)) {\n    const pdfjsLib = await getStackupPdfJs();\n    const docPromise = pdfjsLib.getDocument({ url: pdfUrl }).promise.catch((error) => {\n      stackupPdfDocumentCache.delete(pdfUrl);\n      throw error;\n    });\n    stackupPdfDocumentCache.set(pdfUrl, docPromise);\n  }\n  return stackupPdfDocumentCache.get(pdfUrl);\n}\n\n";
assert.equal(text('measurement.js').replace(previewLifecycle,'').replace(previewLoader,frozenPreviewLoader).replace('getStackupPdfDocument(source.pdfUrl, token)','getStackupPdfDocument(source.pdfUrl)').replace('  if (machineReferencePageHidden || machineReferencePreviewPaused) return;\n',''),git('show',base+':measurement.js').replace(duplicateWorkerOwner,''),'Calculator source unchanged except worker duplicate removal and owned preview load lifetime');
const rootConfig=text('firebase-config.js'),frozenRootConfig=git('show',base+':firebase-config.js'),oldOwnerStart=frozenRootConfig.indexOf('  function registerFreshServiceWorker(){'),oldOwnerEnd=frozenRootConfig.indexOf('  function bootTapCalcShell(){',oldOwnerStart),newOwnerStart=rootConfig.indexOf('  let rootWorkerPreparation;'),newOwnerEnd=rootConfig.indexOf('  function bootTapCalcShell(){',newOwnerStart);
assert.ok(oldOwnerStart>=0&&oldOwnerEnd>oldOwnerStart&&newOwnerStart>=0&&newOwnerEnd>newOwnerStart);
assert.equal(rootConfig.slice(0,newOwnerStart)+frozenRootConfig.slice(oldOwnerStart,oldOwnerEnd)+rootConfig.slice(newOwnerEnd),frozenRootConfig,'Root config credentials/build/backend/overlay setup unchanged outside worker owner');
for(const path of ['pre-alpha/workspace-store.mjs','pre-alpha/shared-save.mjs','pre-alpha/firebase-config.js','pre-alpha/model.mjs','pre-alpha/families.mjs','pre-alpha/modern-envelope.mjs','pre-alpha/modern-saver.mjs','pre-alpha/shared-library.mjs','pre-alpha/modern-view.mjs'])assert.equal(text(path),identity(git('show',base+':'+path)),'Preserved math/folding/parser/store/capture/one-site library/view semantics: '+path);
const oldChildBoot="if ('serviceWorker' in navigator) {\n  navigator.serviceWorker.register('./service-worker.js?v='+BUILD,{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});\n}\n",newChildBoot="if ('serviceWorker' in navigator) {\n  const workerScope=new URL('./',location.href);\n  navigator.serviceWorker.getRegistration(workerScope.href)\n    .then(registration=>registration&&registration.scope===workerScope.href&&registration.active?.scriptURL===new URL('service-worker.js?v='+BUILD,workerScope).href\n      ? registration.update()\n      : navigator.serviceWorker.register(new URL('service-worker.js?v='+BUILD,workerScope).href,{scope:workerScope.pathname,updateViaCache:'none'}).then(registration=>registration.update()))\n    .catch(()=>{});\n}\n";
assert.equal(text('pre-alpha/workspace.mjs').replace(newChildBoot,oldChildBoot),git('show','3d34dcebd96dc00fa46765173351a31cc25a6a03:pre-alpha/workspace.mjs'),'Workspace module unchanged outside exact-scope worker boot; job/routing/store code preserved');
// The worksheet is deferred; generic exports, root routing and worker ownership stay intact.
assert.equal(text('measurement-card.html').replace('<link rel="manifest" href="./manifest.json">\n<script src="./launch.js?v=launch-pre-alpha26-1"></script>\n',''),git('show',base+':measurement-card.html'),'Frozen legacy calculator HTML is unchanged except manifest and installed-start bridge');
assert.doesNotMatch(text('pre-alpha/index.html'),/data-job-export="worksheet"/);
assert.doesNotMatch(text('pre-alpha/service-worker.js'),/\.\/worksheet-/);
const oldExport=identity(git('show',base+':pre-alpha/exports.mjs'));
assert.equal(text('pre-alpha/exports.mjs'),oldExport,'Generic print/PNG export code unchanged; worksheet dispatch removed');
assert.equal(text('pre-alpha/index.html').replace('  <link rel="manifest" href="../manifest.json">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n  <meta name="apple-mobile-web-app-title" content="TapCalc">\n','').replace('<p><a data-legacy-fallback href="../measurement-card.html?legacy=1&amp;v=3.0.0-livefix21">Open legacy calculator</a></p>','').replace('aria-label="Export job or selected-operation worksheet"','aria-label="Export complete job"').replace('<button type="button" data-job-export="worksheet">Draft HTS-5201 worksheet</button>',''),identity(git('show',base+':pre-alpha/index.html')),'Only the explicit draft export button changes the existing shell');
assert.equal(text('pre-alpha/service-worker.js').replace("cache.addAll(ASSETS.map(asset=>new Request(asset,{cache:'no-store'})))",'cache.addAll(ASSETS)').replace("\n// Launch readiness reports only build identity; never touches jobs or cache contents.\nself.addEventListener('message',event=>{if(event.data?.type==='tapcalc-pre-alpha-version')event.ports?.[0]?.postMessage({build:BUILD});});\n",''),identity(git('show',base+':pre-alpha/service-worker.js')),'Worksheet precache excluded; worker scope, build and cache ownership unchanged');
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
console.log('PASS local26 boundary: reviewed local launch/worksheet/Head Assembly changes; one-site workflow/full raw captures/store/folding/current math and legacy calculation/sync/dev sources preserved from frozen24; reviewed root routing and test CI pinned; no deployment evidence implied.');

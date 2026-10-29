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
  "tests/pre-alpha-release-identity.mjs": "aa81487361379f4d23057896f10a9fb42a72c8dbe7ca18b8f33de2fad6e71b92",
  "firebase-config.js": "403777e4aad8ed946fbfa0418286b32c13517f15f659051a859b73f97499725d",
  "measurement.js": "788d7b370acf21fca7ef47f57ff2ec0ab7c76f415a63fa5fe33a2930fb36a87d",
  "docs/pre-alpha26-local-launch-readiness.md": "b40e7b85c62a91b63635c5cc387b01ce1855734108f0d07eb9e64c1b3bd5d360",
  "tests/launch-worker-upgrade-ui.mjs": "ec799f97a0f73f77b0a2687e138149c1cda47528b9307c80efd821e8f73eb85f",
  "tests/launch-readiness.mjs": "237e164859af6e5b625d8d83abf0a708b9aa30a5e6459be19fbae50d74624259",
  "tests/library-release-guard.mjs": "4ec9c07c40176a82f741f4a846623a58abe5f72e73f169948a3e7387ed2324cb",
  "measurement-card.html": "2b275fbc59d07a6258163248504167f16cc55b3f3d16973e7f6edda7228a69a1",
  "service-worker.js": "1970e7c4f8be9fa2d0fe069ad4be5ef6b2c4c4d26fd3dbe74057ee6e0cb1bc96",
  "manifest.json": "479a51a3de2ccee5c46c661591395031a6126b6241ec3a612d4640b05c38f763",
  "index.html": "0bd867f99dab99483894b03289b02c8f0230f8818df3eaf2736c8bd352d1f008",
  "launch.js": "1d53a737087a34c9192d3a894dee0998dfe65e8ae83b3bfbcef1d97e950ed2ee",
  "docs/pre-alpha-worksheet-local-draft.md": "1308008bf3d9e3f4fdfd143facb2de78bc06db7ad09afe6e6ca8381af08ce702",
  "pre-alpha/worksheet-print.css": "04de166fd4e01709797e08fb0ba2a1b0ecd1afbd33a7c8c2a3abcb5af080763c",
  "tests/pre-alpha-worksheet-ui.mjs": "3303c501a9df1945fa905e85327df6ab2da9684361ef3bca39f9abbb92e352a4",
  "tests/pre-alpha-worksheet.mjs": "11bd35a79abe20dd53b735d1d438c5c77da2589c60f37d11847e04cce4b63be6",
  "pre-alpha/service-worker.js": "0de5991ac41f201ba7b53c338c3e0b17470ae810943f7347f1712e374d6d33af",
  "pre-alpha/index.html": "cf777f2a7cd7708c4e3f71eadb20edc99cef9e03a33016f4191c360008d5e554",
  "pre-alpha/exports.mjs": "e3457ca96b324bd61baba2429730b4e4d029e3b4066fc7cbe3f79c1433ca9eae",
  "pre-alpha/worksheet-draft.css": "9eb896be0b20e2c8d1fb7f7621606f7c89c346002b8147e0c5d99a6a70f6dd07",
  "pre-alpha/worksheet-draft.html": "2177cf8d2b3fffc67878137244d84e529f20c4678f2ea26090862d694a1ecdd6",
  "pre-alpha/worksheet-draft-ui.mjs": "14514557958aa1c764d3a6e48c4749d5858f144694569b5ec21f4b4befd2843c",
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
  "tests/release-check.mjs": "fda3e84e64ceddc0d6d4265a7662821168252d2bb327c797172713713fd59cbf",
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
// The local worksheet adds an explicit export path; generic exports, routing and worker ownership stay intact.
assert.equal(text('measurement-card.html').replace('<link rel="manifest" href="./manifest.json">\n<script src="./launch.js?v=launch-pre-alpha26-1"></script>\n',''),git('show',base+':measurement-card.html'),'Frozen legacy calculator HTML is unchanged except manifest and installed-start bridge');
const oldExport=identity(git('show',base+':pre-alpha/exports.mjs'));
assert.equal(text('pre-alpha/exports.mjs').replace("import {openWorksheetDraft} from './worksheet-draft.mjs?v=pre-alpha26';\n",'').replace("      if(action==='worksheet')openWorksheetDraft(snapshot);\n",''),oldExport,'Generic print/PNG export code unchanged');
assert.equal(text('pre-alpha/index.html').replace('  <link rel="manifest" href="../manifest.json">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n  <meta name="apple-mobile-web-app-title" content="TapCalc">\n','').replace('<p><a data-legacy-fallback href="../measurement-card.html?legacy=1&amp;v=3.0.0-livefix21">Open legacy calculator</a></p>','').replace('aria-label="Export job or selected-operation worksheet"','aria-label="Export complete job"').replace('<button type="button" data-job-export="worksheet">Draft HTS-5201 worksheet</button>',''),identity(git('show',base+':pre-alpha/index.html')),'Only the explicit draft export button changes the existing shell');
const worksheetAssets="'./worksheet-draft.mjs?v='+BUILD,'./worksheet-draft-ui.mjs?v='+BUILD,'./worksheet-draft.html?v='+BUILD,'./worksheet-draft.css?v='+BUILD,'./worksheet-print.css?v='+BUILD,";
assert.equal(text('pre-alpha/service-worker.js').replace(worksheetAssets,'').replace("cache.addAll(ASSETS.map(asset=>new Request(asset,{cache:'no-store'})))",'cache.addAll(ASSETS)').replace("\n// Launch readiness reports only build identity; never touches jobs or cache contents.\nself.addEventListener('message',event=>{if(event.data?.type==='tapcalc-pre-alpha-version')event.ports?.[0]?.postMessage({build:BUILD});});\n",''),identity(git('show',base+':pre-alpha/service-worker.js')),'Only code assets added; worker scope, build and cache ownership unchanged');
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

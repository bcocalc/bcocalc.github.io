import {restoreBranding} from './launch-branding.mjs';
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
  "tests/controlled-handoff-source-reconstruction.mjs": "9260440e2a4b0292a513e1d05432b555fdbd3c51bf7a001f08b4a06e3e283aef",
  "tests/fixtures/root-worker-916610b.txt": "c8226496043a7f42657d96011334361d82bd1a9fc81e1511397d9f7f2170cf4f",
  "tests/root-partial-cache.mjs": "e594b9bba119b2948b548874401e7077b60198116b8671edac0d0330226a8546",
  "tests/controlled-rollback.mjs": "1e364b9b15982b802e79d312ec68d7320af09b1261140573a122b7ec8319a3ef",
  "tests/controlled-rollback-test.mjs": "bf75e094588ca33a4a3eaf7c18784a9f24aca488e9335b4b154819d648e3d1e9",
  "tests/controlled-handoff-dom.mjs": "5947e679ed7a8078af70b0f81116556ee40bdd215a270dcaf13f609022d22d5a",
  "tests/controlled-handoff.mjs": "a43d26a33d97b74dec85ce13c3e1802a25c98221ace5b28a69eeea2fb7450901",
  "pre-alpha/modern-view.mjs": "2c78f4d8d885dc283a12543c4db47dd9d5fd221bff044fe808dc4d882dc63fa0",
  "tests/pre-alpha-ui.mjs": "bd9dddbb3a5ddf546d94519a7758f4562aaf9672db0263e338b409f22277e0fa",
  "tests/launch-branding-ui.mjs": "f5cb1eacd8e6f0446a27bc3576bdbf9df267edf74af3cd6b3065173e84ae9b58",
  "tests/pre-alpha-worker-upgrade-ui.mjs": "30e88d9295e13b19a0de11b148910a4bfd831cd00e12fcc1d32da8e2dc0cce2c",
  "tests/pre-alpha-reference-migration.mjs": "2d3f69c01ee0cbed97712ea83d02a602fcb501bf2ab1cd53f98331575ba882ca",
  "tests/pre-alpha-measurement-help-ui.mjs": "5a0783d9758bd2d175afb49657f9b44680d716429b6fe2874d2a102e883cb9ad",
  "tests/launch-branding.mjs": "01a26466b16f1934e0f2cd5eb19e310b25f530b7e742df9feba62efabb25325d",
  "pre-alpha/review.mjs": "8d6f7024396b60f3a8cc4369a7c90d02150fdea13e98fa6e535deb684db6c048",
  "pre-alpha/eta.mjs": "9e3b69e4b4cedaf0f5bb575217736813ef886ed4d6adaf6caf76ce682befcfd9",
  "pre-alpha/presentation.mjs": "9840bf6b4cba752af1cef5b5f7ed5c792c644f4b149b33bdf0a204ee0daf75d9",
  "pre-alpha/vendor/pdf-worker-provenance.json": "1731bbbf7adf7e4bbd580f98360d45252bf05433a3dc12c18bc369c0416c4604",
  "tests/pdf-cleanup-ownership.mjs": "8bfcf6a29e3e1ebff0b08bfd8fb1ef87c4cf95f16ff5b80b264faf6bdb209af7",
  "pdf-api-provenance.json": "556c32d02df138c5002d7f9a54bfb5c57558367ab2c155c9b48dc22b9b54b7b6",
  "pdf.mjs": "9cda957c60e5f8200363913b7eda935978128af415c6e4ca03da8c9f871c73ed",
  "tests/root-runtime-cache-lifetime.mjs": "fa4e9c9cac5ab637e2718d96c77de437d8ca9baecccc04b02f7d0a0ac6e7d5e7",
  "tests/pre-alpha-worksheet-deferred.mjs": "c44487e852619d3a8316ce70ad33689dae4a151650226d4dd02edd1614f6c647",
  "tests/pre-alpha-worksheet-deferred-ui.mjs": "9eafca526c691d661aad86075e934fd42e53882e843c041c46cbe81a3f66fda8",
  "docs/pre-alpha-worksheet-local-draft.md": "919d74bb78523087159ba211015af3e2af01dc8b6fd0fdec3aac69ab12b6fbb0",
  "tests/pre-alpha-exports-ui.mjs": "ec522552727976091d2f80229ab34bc5b3d564200602d138c9cb2959e738b7e5",
  "tests/runner-cleanup-test.mjs": "6eea55ec4f695857cb72ca95e3fddc70ff60728477251ef2c9393e1a8338e30d",
  "tests/runner-cleanup.mjs": "c25cb1b3eae4b354d19c15cf5caaa9c362780ece52479d21265dddbeb3fae565",
  "tests/pre-alpha-release-identity.mjs": "87d18da37b75118adacae81ec7b53110f7dddc6b83416f40d07ceb05b39210ed",
  "firebase-config.js": "403777e4aad8ed946fbfa0418286b32c13517f15f659051a859b73f97499725d",
  "measurement.js": "788d7b370acf21fca7ef47f57ff2ec0ab7c76f415a63fa5fe33a2930fb36a87d",
  "docs/pre-alpha26-local-launch-readiness.md": "f67e88349668930e1131b4cff980b9c0e2fdf6dd45bb73122b12a112d631267a",
  "tests/launch-worker-upgrade-ui.mjs": "658f6cde1c62d77b4034332116ae215ce5fb9fddd25d1313240c41f32e1661f6",
  "tests/launch-readiness.mjs": "c5b79efc1e2b5b6b1212f6bbc341e125e1b67877ce707f3ac2d9130e746d2b89",
  "tests/library-release-guard.mjs": "d66ade69720db56d34e1774e654cd76522d47b615d02c25d8530744e69031374",
  "measurement-card.html": "733750937a218aa5ce1466712d5b54160ee3220b0fcaa8cd2478e6a7ab923402",
  "service-worker.js": "19035a045cec2ba074380b0cee81cc4df4bea01075e5fd4fb6592d17b2cad410",
  "manifest.json": "adc9cb1cf422e2e06d0c44eae00cc4f88062bcacda8df4e2caf7a951a0459a93",
  "index.html": "3e7375ac9aefadd751a8a99f7dd221ba8afa5a85c9645eb2e9b2617b1f8ddb02",
  "launch.js": "a3dbbfcee6d6a2280a5e4b9431919ed17b278d055c21c0eb01cebec7974708b2",
  "pre-alpha/worksheet-print.css": "04de166fd4e01709797e08fb0ba2a1b0ecd1afbd33a7c8c2a3abcb5af080763c",
  "tests/pre-alpha-worksheet-ui.mjs": "3303c501a9df1945fa905e85327df6ab2da9684361ef3bca39f9abbb92e352a4",
  "tests/pre-alpha-worksheet.mjs": "11bd35a79abe20dd53b735d1d438c5c77da2589c60f37d11847e04cce4b63be6",
  "pre-alpha/service-worker.js": "f12a1c3ca926da59889ae2e4c6a6c0c2146e14959bae3bb88bdfd27276d3f1f4",
  "pre-alpha/index.html": "114989aa513eb34034bf5254230373eecdf46d13f97a9812324609c8777cd85b",
  "pre-alpha/exports.mjs": "838514bba4df5fff44213b9323143ab61ac1e7b2b459f9645062fb765196be15",
  "pre-alpha/worksheet-draft.css": "9eb896be0b20e2c8d1fb7f7621606f7c89c346002b8147e0c5d99a6a70f6dd07",
  "pre-alpha/worksheet-draft.html": "2177cf8d2b3fffc67878137244d84e529f20c4678f2ea26090862d694a1ecdd6",
  "pre-alpha/worksheet-draft-ui.mjs": "53c5426b7273716c84a679348ccc8262e152f4e4e8a8707de1e555e898a74bdd",
  "pre-alpha/worksheet-draft.mjs": "bd04ed1661b0d1f2daaa748f216ef7f50d36d6acbf4ea5190f508c5f2b5ba982",
  "tests/pre-alpha-reference-selectors.mjs": "348392754e0660586f1be351608a2d967aa3e15dbbd3850d75fcf95a000bace9",
  "tests/pre-alpha-folding-dimensions-ui.mjs": "fc25e379a1e576b221ba1201a72df60dd0d6cd15ea4c222d1123cfcaf6ad4591",
  "tests/pre-alpha-folding-dimensions.mjs": "bc66befff6e8f596aaa9322160cd903f59817ad228aeacb030895b87c324c3b5",
  "pre-alpha/references.mjs": "081e9fc65746ad8796c28a53a7490d549e20a414ec5b21048c4fbc790d5ccd45",
  "pre-alpha/reference-helpers.mjs": "280e70af15cfd6410b01a04c589928512cde08d034a857153f9703c206856908",
  ".github/workflows/library-safeguard.yml": "30c7a346a8d47ff087ee1a0442b127871884e77aa4f7dee84e5212adbcb7454c",
  "tests/pre-alpha-modern-sharing.mjs": "cc80f566738a1d004d333a593f54f70b510de2d04940e115c7aa6bf41e24f004",
  "pre-alpha/AGENTS.md": "b808e34b3770a5751ed5e9c4beceeef70ed6ae5da92dcd77672c61c0009346eb",
  "pre-alpha/modern-sharing-config.mjs": "2dfaeaff716e69a3c8630451d2ec52b8ade14f31bf57908e2d3290f3685d26d7",
  "pre-alpha/modern-transport.mjs": "d00d5ab6445d74ed4e26760ae607e36fc7793132403ce14a5e61bbdce85618c4",
  "pre-alpha/modern-ui.mjs": "54c8e2818da8bca404975f8b7abf4762f009f8df6bd305cbfab2cca894b39747",
  "pre-alpha/workspace.mjs": "a57f91ade0c45b9b0f76d94eb7f542a97f963958695e03bd88a04dd3a2500327",
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
for(const path of ['pre-alpha/workspace-store.mjs','pre-alpha/shared-save.mjs','pre-alpha/firebase-config.js','pre-alpha/model.mjs','pre-alpha/families.mjs','pre-alpha/modern-envelope.mjs','pre-alpha/modern-saver.mjs','pre-alpha/shared-library.mjs','pre-alpha/modern-view.mjs'])assert.equal(restoreBranding(path,text(path)),identity(git('show',base+':'+path)),'Preserved math/folding/parser/store/capture/one-site library/view semantics: '+path);
const oldChildBoot="if ('serviceWorker' in navigator) {\n  navigator.serviceWorker.register('./service-worker.js?v='+BUILD,{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});\n}\n",newChildBoot="if ('serviceWorker' in navigator) {\n  const workerScope=new URL('./',location.href);\n  navigator.serviceWorker.getRegistration(workerScope.href)\n    .then(registration=>registration&&registration.scope===workerScope.href&&registration.active?.scriptURL===new URL('service-worker.js?v='+BUILD,workerScope).href\n      ? registration.update()\n      : navigator.serviceWorker.register(new URL('service-worker.js?v='+BUILD,workerScope).href,{scope:workerScope.pathname,updateViaCache:'none'}).then(registration=>registration.update()))\n    .catch(()=>{});\n}\n";
assert.equal(restoreBranding('pre-alpha/workspace.mjs',text('pre-alpha/workspace.mjs')).replace(newChildBoot,oldChildBoot),git('show','3d34dcebd96dc00fa46765173351a31cc25a6a03:pre-alpha/workspace.mjs'),'Workspace module unchanged outside exact-scope worker boot; job/routing/store code preserved');
// The worksheet is deferred; generic exports, root routing and worker ownership stay intact.
assert.equal(text('measurement-card.html').replace('<link rel="manifest" href="./manifest.json">\n<script src="./launch.js?v=launch-pre-alpha26-2"></script>\n',''),git('show',base+':measurement-card.html'),'Frozen legacy calculator HTML is unchanged except manifest and installed-start bridge');
assert.doesNotMatch(text('pre-alpha/index.html'),/data-job-export="worksheet"/);
assert.doesNotMatch(text('pre-alpha/service-worker.js'),/\.\/worksheet-/);
const oldExport=identity(git('show',base+':pre-alpha/exports.mjs'));
assert.equal(restoreBranding('pre-alpha/exports.mjs',text('pre-alpha/exports.mjs')),oldExport,'Generic print/PNG export code unchanged; worksheet dispatch removed');
assert.equal(restoreBranding('pre-alpha/index.html',text('pre-alpha/index.html')).replace('  <link rel="manifest" href="../manifest.json">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n  <meta name="apple-mobile-web-app-title" content="TapCalc">\n','').replace('<p><a data-legacy-fallback href="../measurement-card.html?legacy=1&amp;v=3.0.0-livefix21">Open legacy calculator</a></p>','').replace('aria-label="Export job or selected-operation worksheet"','aria-label="Export complete job"').replace('<button type="button" data-job-export="worksheet">Draft HTS-5201 worksheet</button>',''),identity(git('show',base+':pre-alpha/index.html')),'Only the explicit draft export button changes the existing shell');
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

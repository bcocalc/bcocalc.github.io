import assert from 'node:assert/strict';
import { checkLibraryContract, readSource } from './library-release-guard.mjs';

checkLibraryContract();
const regressions = [
  ['old Sync binding', 'dev/measurement.js', source => source.replace(
    'bindLibraryTap(syncJobsBtnEl, syncLocalJobsToCloud);',
    "syncJobsBtnEl.addEventListener('click', syncLocalJobsToCloud);")],
  ['recent-card overwrite', 'dev/overlays/tapcalc-workflow-library.js', source => source.replace(
    'function renderRecent(history) {', 'function renderRecent(history) {\n document.getElementById("jobsRecentList").innerHTML = "";')],
  ['sync transport overwrite', 'dev/cloud-sync.js', source => source + '\n// different transport'],
  ['wrong database', 'dev/firebase-config.js', source => source.replace("|| '(default)'", "|| 'default'")],
  ['old SDK mode', 'firebase-config.js', source => source.replace('TAPCALC_PUBLIC_SYNC = true', 'TAPCALC_PUBLIC_SYNC = false')],
  ['stale build label', 'measurement.js', source => source.replace(/const BUILD_VERSION = '[^']+';/, "const BUILD_VERSION = 'stale';")]
];
for (const [name, file, mutate] of regressions) {
  const original = readSource(file);
  const changed = mutate(original);
  assert.notEqual(changed, original, name + ' mutation must apply');
  assert.throws(() => checkLibraryContract(path => path === file ? changed : readSource(path)), undefined, name);
}
console.log('PASS release guard rejects all 6 simulated regressions without modifying any app files');

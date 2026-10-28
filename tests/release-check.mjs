import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--unit-only')) throw new Error('Usage: node tests/release-check.mjs [--unit-only]');
const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [
  ['library-release-guard.mjs', {}],
  ['library-release-guard-test.mjs', {}],
  ['reference-measurements.mjs', {}],
  ['pipe-size-data.mjs', {}],
  ['cutter-reference.mjs', {}],
  ['coupon-free.mjs', {}],
  ['tools-mode-unit.mjs', {}],
  ['browser-evidence-unit.mjs', {}],
  ['pre-alpha-model.mjs', {}],
  ['pre-alpha-mco.mjs', {}],
  ['pre-alpha-rod-mco.mjs', {}],
  ['pre-alpha-exports.mjs', {}],
  ['pre-alpha-shared-save.mjs', {}],
  ['pre-alpha-modern-sharing.mjs', {}],
  ['pre-alpha-families.mjs', {}],
  ['pre-alpha-release-identity.mjs', {}],
  ['pre-alpha-source-boundary.mjs', {}],
  ['pre-alpha-measurement-help.mjs', {}],
  ['pre-alpha-measurement-figures.mjs', {}],
  ['pre-alpha-home.mjs', {}],
  ['pre-alpha-presentation.mjs', {}],
  ['pre-alpha-hot-tap-ld.mjs', {}],
  ['pre-alpha-workspace-store.mjs', {}],
  ['pre-alpha-workspace-controller.mjs', {}],
  ['smartstop-reference.mjs', {}],
  ['hot-tap-field-reading.mjs', {}],
  ['library-tap-unit.mjs', {}],
  ['cloud-sync.mjs', {}],
  ['sync-local-jobs.mjs', {}]
];
if (!args.includes('--unit-only')) {
  for (const browser of ['chromium', 'webkit']) {
    checks.push(['library-touch.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pipe-sizes-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['tools-mode-reload-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['coupon-free-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-reference-cards-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-presentation-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-hot-tap-ld-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-mco-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-exports-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-shared-save-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-modern-sharing-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-families-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-measurement-help-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-original-figures-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-workspace-store-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-offline-control.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-cache-context-control.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['pre-alpha-worker-upgrade-ui.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['hot-tap-field-reading-ui.mjs', { TAPCALC_BROWSER: browser }]);
    // Bound each device separately as the application-switching coverage grows.
    for (const device of ['phone', 'desktop']) {
      checks.push(['dev-features.mjs', { TAPCALC_BROWSER: browser, TAPCALC_DEVICE: device }]);
    }
  }
}
for (const [file, environment] of checks) {
  console.log('\nChecking ' + file + (environment.TAPCALC_BROWSER ? ' (' + environment.TAPCALC_BROWSER + (environment.TAPCALC_DEVICE ? ' / ' + environment.TAPCALC_DEVICE : '') + ')' : ''));
  // This suite now includes five fresh reference contexts per viewport, Home,
  // ETA and real PDF workers. Keep every assertion and allow the full collection.
  const timeout = file === 'pre-alpha-ui.mjs' ? 360000 : 180000;
  const result = spawnSync(process.execPath, ['tests/' + file], {
    cwd: root, env: { ...process.env, ...environment }, stdio: 'inherit', timeout
  });
  if (result.error || result.status !== 0) {
    console.error('RELEASE_CHILD_FAILURE', JSON.stringify({
      file, browser: environment.TAPCALC_BROWSER || null, device: environment.TAPCALC_DEVICE || null,
      timeoutMs: timeout, status: result.status, signal: result.signal,
      error: result.error ? { name: result.error.name, code: result.error.code, message: result.error.message } : null
    }));
    console.error('RELEASE CHECK FAILED. Do not promote or publish this build.', result.error?.message || '');
    process.exit(1);
  }
}
console.log(args.includes('--unit-only')
  ? '\nUnit checks passed. Mobile browser checks are still required before release.'
  : '\nRELEASE CHECK PASSED for live and dev, including both mobile browser engines.');

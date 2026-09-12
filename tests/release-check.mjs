import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--unit-only')) throw new Error('Usage: node tests/release-check.mjs [--unit-only]');
const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [
  ['library-release-guard.mjs', {}],
  ['library-release-guard-test.mjs', {}],
  ['reference-measurements.mjs', {}],
  ['cutter-reference.mjs', {}],
  ['smartstop-reference.mjs', {}],
  ['hot-tap-field-reading.mjs', {}],
  ['library-tap-unit.mjs', {}],
  ['cloud-sync.mjs', {}],
  ['sync-local-jobs.mjs', {}]
];
if (!args.includes('--unit-only')) {
  for (const browser of ['chromium', 'webkit']) {
    checks.push(['library-touch.mjs', { TAPCALC_BROWSER: browser }]);
    checks.push(['hot-tap-field-reading-ui.mjs', { TAPCALC_BROWSER: browser }]);
    // Bound each device separately as the application-switching coverage grows.
    for (const device of ['phone', 'desktop']) {
      checks.push(['dev-features.mjs', { TAPCALC_BROWSER: browser, TAPCALC_DEVICE: device }]);
    }
  }
}
for (const [file, environment] of checks) {
  console.log('\nChecking ' + file + (environment.TAPCALC_BROWSER ? ' (' + environment.TAPCALC_BROWSER + (environment.TAPCALC_DEVICE ? ' / ' + environment.TAPCALC_DEVICE : '') + ')' : ''));
  const result = spawnSync(process.execPath, ['tests/' + file], {
    cwd: root, env: { ...process.env, ...environment }, stdio: 'inherit', timeout: 180000
  });
  if (result.error || result.status !== 0) {
    console.error('RELEASE CHECK FAILED. Do not promote or publish this build.', result.error?.message || '');
    process.exit(1);
  }
}
console.log(args.includes('--unit-only')
  ? '\nUnit checks passed. Mobile browser checks are still required before release.'
  : '\nRELEASE CHECK PASSED for live and dev, including both mobile browser engines.');

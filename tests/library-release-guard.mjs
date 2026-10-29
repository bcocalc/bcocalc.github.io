import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

export const readSource = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8').replaceAll('\r\n', '\n');

function section(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, 'Missing protected function: ' + start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, 'Missing protected function boundary: ' + end);
  return source.slice(from, to).trim();
}

export function checkLibraryContract(read = readSource) {
  const live = read('measurement.js');
  const dev = read('dev/measurement.js');
  assert.equal(
    section(dev, 'function bindLibraryTap(', 'window.tapCalcBindLibraryTap ='),
    section(live, 'function bindLibraryTap(', 'window.tapCalcBindLibraryTap ='),
    'Dev and live touch handling have drifted; preserve the phone-confirmed fix'
  );
  const liveLibrary = read('overlays/tapcalc-workflow-library.js');
  const devLibrary = read('dev/overlays/tapcalc-workflow-library.js');
  for (const [start, end] of [
    ['function renderRecent(', 'function updateLibraryPolish('],
    ['function loadRecent(', 'function bindLibrary(']
  ]) {
    assert.equal(section(devLibrary, start, end), section(liveLibrary, start, end),
      'Dev and live have different protected Library behavior: ' + start);
  }
  assert.equal(read('dev/cloud-sync.js').trim(), read('cloud-sync.js').trim(),
    'Shared sync transport has drifted between dev and live');

  for (const directory of ['', 'dev/']) {
    const app = read(directory + 'measurement.js');
    const library = read(directory + 'overlays/tapcalc-workflow-library.js');
    assert.match(app, /bindLibraryTap\(syncJobsBtnEl,\s*syncLocalJobsToCloud\)/,
      directory + 'Sync must use the tested touch binding');
    assert.match(library, /window\.tapCalcBindLibraryTap/,
      directory + 'Recent cards must use the tested touch binding');

    const config = read(directory + 'firebase-config.js');
    const boundary = config.indexOf('(function(){');
    assert.ok(boundary > 0, 'Firebase configuration boundary missing');
    const context = { window: {} };
    vm.runInNewContext(config.slice(0, boundary), context, { timeout: 1000 });
    const settings = context.window;
    assert.equal(settings.TAPCALC_PUBLIC_SYNC, true, 'Do not silently restore the old phone SDK sync path');
    assert.equal(settings.TAPCALC_FIRESTORE_DATABASE, '(default)', 'Preserve the working database name, including parentheses');
    assert.equal(settings.TAPCALC_FIREBASE_COLLECTION, 'tapcalcJobs');
    const build = settings.TAPCALC_BUILD;
    assert.equal(build.channel, directory ? 'dev' : 'live', 'Do not copy the dev channel onto live');
    assert.equal(app.match(/^const BUILD_VERSION = '([^']+)';/m)?.[1], build.version);
    assert.equal(build.overlayVersion, build.version);
    assert.equal(build.serviceWorkerVersion, build.version);
    assert.ok(read(directory + 'measurement-card.html').includes(build.label), 'Visible build label is out of sync');
    assert.ok(read(directory + 'service-worker.js').includes('cache-' + build.version), 'Service worker cache build is out of sync');
    const manifest=JSON.parse(read(directory + 'manifest.json'));
    if(directory)assert.ok(manifest.start_url.includes('v='+build.version),'Installed dev start URL is out of sync');
    else {
      const modern=read('pre-alpha/firebase-config.js').match(/TAPCALC_PRE_ALPHA_BUILD = '([^']+)'/)?.[1];
      assert.ok(modern,'Modern launch build is explicit');assert.equal(manifest.start_url,'./pre-alpha/?v='+modern,'Installed live start must open the reviewed modern workspace');
      assert.equal(manifest.id,'./measurement-card.html?v='+build.version,'Preserve the declared legacy install identity');assert.equal(manifest.scope,'./');
      assert.ok(read('index.html').includes('launch.js?v=launch-'+modern+'-1'),'Root launch identity is synchronized');
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkLibraryContract();
  console.log('PASS Library release guard: shared fix parity, touch bindings, sync configuration and release versions');
}

// The only fetch available inside this VM is a fake in-memory Firestore.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const clone = (value) => JSON.parse(JSON.stringify(value));
const samples = ['A', 'B'].map((id) => ({ id, cloudId: null, synced: false,
  state: { jobDescription: id, jobBundle: { operations: [{ id: 'LS', state: { lsMd: '21.75' } }, { id: 'CP', state: { cpStart: '8.5' } }] } },
  record: { meta: { title: 'Fixture ' + id }, values: [null, true, 2, 2.25, '16 inch'] }
}));
const section = (s, from, to) => s.slice(s.indexOf(from), s.indexOf(to, s.indexOf(from) + from.length));
const scenarios = ['success', 'denied', 'partial', 'offline', 'connect-hang', 'upload-hang',
  'late-commit', 'response-body-hang', 'existing', 'legacy', 'collision', 'storage-full', 'concurrent-save', 'pagination'];

for (const directory of ['', 'dev/']) {
  const source = readFileSync(new URL('../' + directory + 'cloud-sync.js', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../' + directory + 'measurement.js', import.meta.url), 'utf8');
  for (const scenario of scenarios) {
    let mode = scenario;
    let history = clone(samples);
    const docs = new Map();
    const writes = [];
    let reads = 0;
    const response = (status, payload) => ({ ok: status < 400, status, json: async () => payload });
    const failure = (status, code) => response(status, { error: { status: code, message: code } });
    const fakeFetch = async (url, options = {}) => {
      const target = new URL(url);
      assert.equal(target.origin, 'https://firestore.googleapis.com');
      assert.ok(target.pathname.startsWith('/v1/projects/demo-tapcalc-test/databases/(default)/documents'));
      assert.equal(target.searchParams.get('key'), 'fixture');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.cache, 'no-store');
      if (options.method === 'POST') {
        assert.ok(target.pathname.endsWith('/documents:commit'));
        const payload = JSON.parse(options.body);
        assert.equal(payload.writes.length, 1);
        const write = payload.writes[0];
        assert.deepEqual(write.currentDocument, { exists: false });
        assert.deepEqual(write.updateTransforms, [{ fieldPath: 'syncedAt', setToServerValue: 'REQUEST_TIME' }]);
        assert.equal(write.delete, undefined);
        assert.equal(write.updateMask, undefined);
        const id = write.update.name.split('/').pop();
        assert.match(id, /^tc-[a-f0-9]{64}$/);
        writes.push(clone(write));
        if (mode === 'denied' || (mode === 'partial' && writes.length === 2)) return failure(403, 'PERMISSION_DENIED');
        if (mode === 'upload-hang') return new Promise(() => {});
        if (docs.has(id)) return failure(409, 'ALREADY_EXISTS');
        docs.set(id, clone(write.update));
        if (mode === 'concurrent-save' && writes.length === 1) history.unshift({ id: 'C', state: { md: '99' } });
        if (mode === 'late-commit') return new Promise(() => {});
        return response(200, { writeResults: [{ updateTime: '2026-09-05T00:00:00Z' }] });
      }
      assert.ok(!options.method || options.method === 'GET');
      reads++;
      if (mode === 'connect-hang') return new Promise(() => {});
      if (mode === 'response-body-hang') return { ok: true, status: 200, json: () => new Promise(() => {}) };
      if (target.pathname.endsWith('/fixtureJobs')) {
        const all = Array.from(docs.values());
        if (mode === 'pagination' && !target.searchParams.has('pageToken')) return response(200, { documents: all.slice(0, 1), nextPageToken: 'page2' });
        return response(200, { documents: mode === 'pagination' ? all.slice(1) : all });
      }
      const id = target.pathname.split('/').pop();
      if (mode === 'collision') return response(200, { fields: { wrong: { booleanValue: true } } });
      return docs.has(id) ? response(200, docs.get(id)) : failure(404, 'NOT_FOUND');
    };
    const elements = Object.fromEntries(['jobsSyncStatus', 'jobsCloudStatus', 'firebaseStatus', 'syncJobsBtn',
      'refreshCloudJobsBtn', 'testFirestoreBtn'].map((id) => [id, { textContent: '', dataset: {}, hidden: true, disabled: false }]));
    const context = vm.createContext({
      window: { TAPCALC_PUBLIC_SYNC: true, TAPCALC_FIREBASE_CONFIG: { projectId: 'demo-tapcalc-test', apiKey: 'fixture' },
        TAPCALC_FIREBASE_COLLECTION: 'fixtureJobs' },
      navigator: { onLine: mode !== 'offline' }, fetch: fakeFetch,
      crypto: webcrypto, TextEncoder, URL, URLSearchParams, AbortController,
      setTimeout: (fn) => setTimeout(fn, 25), clearTimeout,
      console: { warn() {}, error() {} },
      document: { getElementById: (id) => elements[id] },
      getHistory: () => clone(history), saveHistory: (items) => { if (mode !== 'storage-full') history = clone(items); },
      renderHistory() {}, updateUnsyncedCount() {}, syncJobsWorkspace() {}, loadCloudJobs: async () => {},
      firebaseStatusEl: elements.firebaseStatus, jobsCloudStatusEl: elements.jobsCloudStatus,
      syncJobsBtnEl: elements.syncJobsBtn, refreshCloudJobsBtnEl: elements.refreshCloudJobsBtn, testFirestoreBtnEl: elements.testFirestoreBtn
    });
    vm.runInContext(source +
      section(app, 'async function ensureFirebaseReady(', directory ? 'async function fetchFirestoreJson(' : 'function getJobsCollectionName(') +
      section(app, 'function getJobsCollectionName(', 'function renderJobRecordDetails('), context);
    context.samples = clone(samples);
    if (['existing', 'legacy', 'pagination'].includes(mode)) {
      await vm.runInContext('Promise.all(samples.map(item => window.tapCalcCloud.upload(item)))', context);
      if (mode === 'legacy') {
        const previous = Array.from(docs.values()); docs.clear();
        previous.forEach((doc, i) => {
          doc.name = doc.name.replace(/tc-[a-f0-9]+$/, 'old-addDoc-' + i);
          docs.set('old-addDoc-' + i, doc);
        });
      }
      writes.length = 0;
    }
    await vm.runInContext('Promise.all([syncLocalJobsToCloud(), syncLocalJobsToCloud()])', context);
    const successes = ['success', 'late-commit', 'existing', 'legacy', 'concurrent-save', 'pagination'].includes(mode) ? 2 : mode === 'partial' ? 1 : 0;
    assert.equal(history.filter((item) => item.cloudId).length, successes, scenario);
    assert.deepEqual(history.filter((item) => item.id !== 'C').map((item) => item.state), samples.map((item) => item.state));
    assert.equal(elements.syncJobsBtn.disabled, false);
    assert.equal(elements.jobsSyncStatus.hidden, false);
    assert.equal(elements.jobsSyncStatus.dataset.state, successes === 2 ? 'success' : 'error');
    if (['existing', 'legacy', 'collision', 'offline', 'connect-hang', 'response-body-hang'].includes(mode)) assert.equal(writes.length, 0);
    if (mode === 'concurrent-save') assert.equal(history[0].id, 'C');
    if (successes < 2 && mode !== 'collision') {
      mode = 'success'; context.navigator.onLine = true;
      await vm.runInContext('syncLocalJobsToCloud()', context);
      assert.equal(history.filter((item) => item.cloudId).length, 2);
      assert.equal(docs.size, 2, 'Retries cannot create duplicates');
    }
    if (scenario === 'offline') assert.ok(reads > 0, 'Recovered after offline');
    console.log('PASS ' + (directory || 'live/') + scenario);
  }
}

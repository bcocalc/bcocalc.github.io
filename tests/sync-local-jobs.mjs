// No browser, SDK, network API, or production configuration is loaded by this test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const clone = (value) => JSON.parse(JSON.stringify(value));
const samples = ['first', 'second'].map((id) => ({ id: 'fixture-' + id,
  cloudId: null, synced: false, state: { jobDescription: id, md: id === 'first' ? '12' : '24' },
  record: { meta: { title: 'Sync fixture ' + id }, state: { jobDescription: id } }
}));
function section(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, 'Missing source section: ' + start);
  return source.slice(from, to);
}

for (const file of ['measurement.js', 'dev/measurement.js']) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const timer = section(source, 'async function withTimeout(', 'async function ensureFirebaseReady(');
  const init = section(source, 'async function ensureFirebaseReady(',
    file.startsWith('dev/') ? 'async function fetchFirestoreJson(' : 'function getJobsCollectionName(');
  const sync = section(source, 'function getJobsCollectionName(', 'function renderJobRecordDetails(');
  for (const initialMode of ['success', 'denied', 'sign-in-hang', 'restore-hang', 'offline', 'partial', 'concurrent-save']) {
    let mode = initialMode;
    let history = clone(samples);
    const writes = [];
    let loads = 0;
    let signIns = 0;
    const elements = Object.fromEntries(['jobsSyncStatus', 'jobsCloudStatus', 'firebaseStatus',
      'syncJobsBtn', 'refreshCloudJobsBtn', 'testFirestoreBtn'].map((id) => [id, { textContent: '', dataset: {}, hidden: true, disabled: false }]));
    const auth = { currentUser: null, authStateReady: () => mode === 'restore-hang' ? new Promise(() => {}) : Promise.resolve() };
    const modules = {
      'firebase-app.js': { getApps: () => [], initializeApp: () => ({}) },
      'firebase-auth.js': { getAuth: () => auth, signInAnonymously: async () => {
        signIns++;
        if (mode === 'sign-in-hang') return new Promise(() => {});
        auth.currentUser = { uid: 'fixture-user' };
        return { user: auth.currentUser };
      } },
      'firebase-firestore.js': {
        getFirestore: (_app, database) => { assert.equal(database, '(default)'); return {}; },
        collection: (_db, name) => { assert.equal(name, 'fixtureJobs'); return {}; },
        serverTimestamp: () => 'fixture-timestamp',
        addDoc: async (_collection, payload) => {
          writes.push(clone(payload));
          if (mode === 'denied' || (mode === 'partial' && writes.length === 2)) {
            throw Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
          }
          if (mode === 'concurrent-save' && writes.length === 1) history.unshift({ id: 'new-save', state: { md: '99' } });
          return { id: 'cloud-' + payload.localId };
        }
      }
    };
    const context = vm.createContext({
      console: { warn() {}, error() {} },
      // Accelerate application timeouts while retaining the same control flow.
      setTimeout: (fn) => setTimeout(fn, 25), clearTimeout,
      window: { TAPCALC_FIREBASE_CONFIG: { apiKey: 'fixture', projectId: 'demo-tapcalc-test', appId: 'fixture' },
        TAPCALC_FIREBASE_COLLECTION: 'fixtureJobs', TAPCALC_FIRESTORE_DATABASE: '(default)' },
      navigator: { onLine: mode !== 'offline' },
      document: { getElementById: (id) => elements[id] },
      loadModule: async (url) => {
        const module = modules[url.split('/').at(-1)];
        assert.ok(module, 'Unexpected module');
        return module;
      },
      getHistory: () => clone(history), saveHistory: (items) => { history = clone(items); },
      renderHistory() {}, updateUnsyncedCount() {}, syncJobsWorkspace() {},
      loadCloudJobs: async () => { loads++; },
      collectJobState: () => { throw new Error('Must upload saved state, not the current form'); },
      firebaseStatusEl: elements.firebaseStatus, jobsCloudStatusEl: elements.jobsCloudStatus,
      syncJobsBtnEl: elements.syncJobsBtn, refreshCloudJobsBtnEl: elements.refreshCloudJobsBtn,
      testFirestoreBtnEl: elements.testFirestoreBtn
    });
    vm.runInContext('let firebaseDb=null, firebaseAuth=null, firebaseModuleCache=null, firebaseInitPromise=null;\n' +
      timer + init.replaceAll('import(', 'loadModule(') + sync, context);
    assert.equal(vm.runInContext('typeof fetch', context), 'undefined');
    await vm.runInContext('Promise.all([syncLocalJobsToCloud(), syncLocalJobsToCloud()])', context);
    const status = elements.jobsSyncStatus;
    assert.equal(elements.syncJobsBtn.disabled, false);
    assert.equal(status.hidden, false);
    assert.deepEqual(history.filter((item) => item.id !== 'new-save').map((item) => item.state), samples.map((item) => item.state));
    if (['sign-in-hang', 'restore-hang', 'offline'].includes(mode)) {
      assert.equal(writes.length, 0);
      assert.deepEqual(history, samples);
      assert.equal(status.dataset.state, 'error');
      assert.match(status.textContent, /timed out|connection/i);
      assert.notEqual(elements.firebaseStatus.textContent, 'Connecting...');
      // Retry after recovery must not reuse the failed in-flight initialization.
      mode = 'success';
      context.navigator.onLine = true;
      await vm.runInContext('syncLocalJobsToCloud()', context);
      assert.equal(history.filter((item) => item.cloudId).length, 2);
    } else {
      assert.equal(writes.length, 2, 'Repeated Sync calls must share the current batch');
      assert.deepEqual(writes.map((item) => item.state), samples.map((item) => item.state));
      const expected = mode === 'denied' ? 0 : mode === 'partial' ? 1 : 2;
      assert.equal(history.filter((item) => item.cloudId).length, expected);
      assert.equal(loads, expected > 0 ? 1 : 0);
      if (expected < 2) {
        assert.equal(status.dataset.state, 'error');
        assert.match(status.textContent, /denied access/);
        mode = 'success';
        const before = writes.length;
        await vm.runInContext('syncLocalJobsToCloud()', context);
        assert.equal(writes.length - before, 2 - expected, 'Retry only unconfirmed jobs');
      }
      if (initialMode === 'concurrent-save') assert.equal(history[0].id, 'new-save');
    }
    assert.ok(signIns <= 2);
    console.log('PASS ' + file + ': ' + initialMode + ', local data preservation and visible feedback');
  }
}

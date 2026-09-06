/* Public-access transport. Requests still obey the project's Firestore rules. */
(function () {
  'use strict';
  const pendingUploads = new Map();
  let pendingConnection = null;

  function paths() {
    const config = window.TAPCALC_FIREBASE_CONFIG || {};
    const database = window.TAPCALC_FIRESTORE_DATABASE || '(default)';
    const collection = window.TAPCALC_FIREBASE_COLLECTION || 'tapcalcJobs';
    if (!config.projectId || !config.apiKey || collection.includes('/')) throw new Error('Invalid shared jobs configuration.');
    const name = `projects/${config.projectId}/databases/${database}/documents`;
    const base = `https://firestore.googleapis.com/v1/${name}`;
    return { name, base, collection, key: config.apiKey };
  }

  async function request(url, options = {}) {
    const { base, key } = paths();
    const target = new URL(url);
    if (target.origin !== 'https://firestore.googleapis.com' ||
        !(target.href.startsWith(base + '/') || target.href === base + ':commit')) {
      throw new Error('Invalid shared jobs request.');
    }
    if (navigator.onLine === false) throw new Error('Offline. Local jobs are kept on this device.');
    target.searchParams.set('key', key);
    const controller = new AbortController();
    let timer;
    try {
      const operation = (async () => {
        const response = await fetch(target.href, { ...options, cache: 'no-store', credentials: 'omit', signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) {
          const error = new Error(payload.error?.message || `Shared request failed (${response.status}).`);
          error.code = payload.error?.status || String(response.status);
          error.status = response.status;
          throw error;
        }
        return payload;
      })();
      return await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Shared request timeout. Tap Sync to safely retry.'));
          controller.abort();
        }, 12000);
      })]);
    } finally {
      clearTimeout(timer);
    }
  }

  function encode(value) {
    if (value === null) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (Array.isArray(value)) {
      if (value.some(Array.isArray)) throw new Error('Saved job contains an unsupported nested array. Local copy is unchanged.');
      return { arrayValue: { values: value.map(encode) } };
    }
    if (value && typeof value === 'object') {
      return { mapValue: { fields: Object.fromEntries(Object.keys(value).sort().map((key) => [key, encode(value[key])])) } };
    }
    throw new Error('Saved job contains an unsupported value. Local copy is unchanged.');
  }

  function decode(value) {
    if ('nullValue' in value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
    if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, child]) => [key, decode(child)]));
    throw new Error('Shared job contains an unsupported value. Local copy is unchanged.');
  }

  function record(document) {
    return decode({ mapValue: { fields: document.fields || {} } });
  }

  async function list() {
    const { base, collection } = paths();
    const jobs = [];
    let pageToken = '';
    const seen = new Set();
    do {
      const query = new URLSearchParams({ pageSize: '100' });
      if (pageToken) query.set('pageToken', pageToken);
      const payload = await request(`${base}/${encodeURIComponent(collection)}?${query}`);
      (payload.documents || []).forEach((doc) => jobs.push({ source: 'cloud', id: doc.name.split('/').pop(), record: record(doc) }));
      pageToken = payload.nextPageToken || '';
      if (pageToken && seen.has(pageToken)) throw new Error('Shared jobs pagination did not finish. Please retry.');
      seen.add(pageToken);
    } while (pageToken);
    return jobs;
  }

  async function connect() {
    if (pendingConnection) return pendingConnection;
    pendingConnection = (async () => {
      const { base, collection } = paths();
      await request(`${base}/${encodeURIComponent(collection)}?pageSize=1`);
      return { enabled: true, transport: 'rest' };
    })();
    try { return await pendingConnection; }
    finally { pendingConnection = null; }
  }

  function comparable(value) {
    const copy = { ...value };
    delete copy.syncedAt;
    return JSON.stringify(encode(copy));
  }

  async function upload(item, existingJobs = null) {
    if (!item?.id || !(item.state || item.record?.state)) throw new Error('This saved job has no saved calculator state. Local copy is unchanged.');
    const payload = JSON.parse(JSON.stringify({ ...item.record, state: item.state || item.record.state, localId: item.id, source: 'tapcalc-web' }));
    delete payload.syncedAt;
    const signature = comparable(payload);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature));
    const id = 'tc-' + Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (pendingUploads.has(id)) return pendingUploads.get(id);
    const work = (async () => {
      // Recover an older addDoc upload that reached the server without a local acknowledgement.
      const jobs = existingJobs || await list();
      const match = jobs.find((entry) => entry.record?.localId === item.id && comparable(entry.record) === signature);
      if (match) return match.id;
      const { base, name, collection } = paths();
      const documentName = `${name}/${collection}/${id}`;
      const documentUrl = `${base}/${encodeURIComponent(collection)}/${id}`;
      const verify = async () => {
        try {
          const doc = await request(documentUrl);
          if (comparable(record(doc)) !== signature) throw new Error('Shared job differs from this local copy. Nothing was overwritten.');
          return true;
        } catch (error) {
          if (error.status === 404) return false;
          throw error;
        }
      };
      if (await verify()) return id;
      try {
        const result = await request(base + ':commit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ writes: [{
            update: { name: documentName, fields: encode(payload).mapValue.fields },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: 'syncedAt', setToServerValue: 'REQUEST_TIME' }]
          }] })
        });
        if (!result.writeResults?.[0]?.updateTime) throw new Error('Upload response was not confirmed. Tap Sync to safely retry.');
      } catch (error) {
        // A timed-out request can still commit. Same ID + create-only prevents duplicates.
        if (!(await verify())) throw error;
      }
      return id;
    })();
    pendingUploads.set(id, work);
    try { return await work; }
    finally { pendingUploads.delete(id); }
  }

  window.tapCalcCloud = { connect, list, upload, request };
})();

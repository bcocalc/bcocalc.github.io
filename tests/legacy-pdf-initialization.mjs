// Shared browser predicate and post-failure evidence; never changes page state.
export function referenceInitialization(evidence = false) {
  let bundle, parseError = null;
  try { bundle = JSON.parse(localStorage.getItem('measurementCardStateV1')); }
  catch (error) { parseError = error.name; }
  const operation = bundle?.operations?.find(op => op.id === bundle.selectedOperationId);
  const state = operation?.state;
  const ids = ['pod', 'lsLiManual', 'etaBco'];
  const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)?.value ?? null]));
  const persisted = Object.fromEntries(ids.map(id => [id, state?.[id] ?? null]));
  const manualToggle = document.getElementById('lsLiManualToggle');
  const autoSync = document.getElementById('etaBco')?.dataset.autoSync ?? null;
  const conditions = {
    documentComplete: document.readyState === 'complete',
    selectedOperationPresent: !!operation && !!state,
    requiredElementsPresent: ids.every(id => !!document.getElementById(id)) && !!manualToggle,
    podUiMatchesPersisted: !!state && state.pod === ui.pod,
    liUiMatchesPersisted: !!state && state.lsLiManual === ui.lsLiManual,
    etaUiMatchesPersisted: !!state && state.etaBco === ui.etaBco,
    podExpected: Number(persisted.pod) === 6.625,
    liExpected: Number(persisted.lsLiManual) === 6.345,
    etaExpected: Number(persisted.etaBco) === 1.033,
    automaticLi: !!manualToggle && !manualToggle.checked,
    automaticEta: autoSync === 'true'
  };
  const rawExpected = { bcoCutterOD: '4', md: '12', ptc: '1/4', mt: '52' };
  const raw = Object.fromEntries(Object.entries(rawExpected).map(([id, expected]) => [id, {
    expected, ui: document.getElementById(id)?.value ?? null,
    persisted: state?.[id] ?? null, matches: state?.[id] === expected
  }]));
  const ready = Object.values(conditions).every(Boolean);
  if (!evidence) return ready;
  return { ready, conditions, unmet: Object.entries(conditions).filter(([, value]) => !value).map(([name]) => name),
    readyState: document.readyState, selectedOperationId: bundle?.selectedOperationId ?? null,
    ui, persisted, autoSync, manualToggle: manualToggle?.checked ?? null, raw, parseError,
    observation: 'Read-only checkpoint; raw strings also have separate before/after assertions.' };
}

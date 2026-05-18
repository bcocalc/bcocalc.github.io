/* TapCalc Dev 3.0.0-alpha220 keep Field Manual in the Reference dropdown only */
(function(){
  const READY_FLAG = '__tapcalcAlpha220ReferenceDedupeReady';
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  function addRetiredMarker(id){
    if (document.getElementById(id)) return;
    const marker = document.createElement('span');
    marker.id = id;
    marker.hidden = true;
    marker.setAttribute('aria-hidden', 'true');
    marker.dataset.tapcalcRetiredShortcut = 'true';
    document.body.appendChild(marker);
  }

  function removeShortcut(id){
    const el = document.getElementById(id);
    if (!el) {
      addRetiredMarker(id);
      return;
    }
    if (el.dataset.tapcalcRetiredShortcut === 'true') return;
    const wrapper = el.closest('.field-manual-entry-row, .field-manual-quick-row');
    (wrapper || el).remove();
    addRetiredMarker(id);
  }

  function ensureDropdownOption(){
    const select = document.getElementById('referenceViewSelect');
    if (select && !select.querySelector('option[value="fieldmanual"]')) {
      const option = document.createElement('option');
      option.value = 'fieldmanual';
      option.textContent = 'Field Manual';
      (select.querySelector('optgroup[label="Field Reference"]') || select).appendChild(option);
    }
    document.querySelectorAll('#refScreen .reference-library-count').forEach((count) => {
      count.textContent = '14 refs';
    });
    if (window.tapcalcSetReferenceView && !document.querySelector('#referenceLibraryOptions [data-reference-target="fieldmanual"]')) {
      document.getElementById('referenceLibrarySearch')?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function cleanReferenceDuplicates(){
    removeShortcut('fieldManualQuickButton');
    removeShortcut('fieldManualInlineAction');
    ensureDropdownOption();
  }

  function install(){
    cleanReferenceDuplicates();
    setTimeout(cleanReferenceDuplicates, 80);
    setTimeout(cleanReferenceDuplicates, 300);
    const refScreen = document.getElementById('refScreen');
    if (refScreen) {
      new MutationObserver(cleanReferenceDuplicates).observe(refScreen, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();

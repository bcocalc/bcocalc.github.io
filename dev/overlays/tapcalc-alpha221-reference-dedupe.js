/* TapCalc Dev 3.0.0-alpha221 keep Field Manual in the Reference dropdown only */
(function(){
  const READY_FLAG = '__tapcalcAlpha221ReferenceDedupeReady';
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  let observer = null;
  let scheduled = false;
  let cleaning = false;

  function makeRetiredMarker(id){
    const marker = document.createElement('span');
    marker.id = id;
    marker.hidden = true;
    marker.setAttribute('aria-hidden', 'true');
    marker.dataset.tapcalcRetiredShortcut = 'true';
    return marker;
  }

  function ensureRetiredMarker(id){
    const existing = document.getElementById(id);
    if (existing?.dataset.tapcalcRetiredShortcut === 'true') return false;
    if (existing) {
      const wrapper = existing.closest('.field-manual-entry-row, .field-manual-quick-row');
      (wrapper || existing).replaceWith(makeRetiredMarker(id));
      return true;
    }
    document.body.appendChild(makeRetiredMarker(id));
    return true;
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
      if (count.textContent.trim() !== '14 refs') {
        count.textContent = '14 refs';
      }
    });
  }

  function cleanReferenceDuplicates(){
    if (cleaning) return;
    cleaning = true;
    observer?.disconnect();
    try {
      ensureRetiredMarker('fieldManualQuickButton');
      ensureRetiredMarker('fieldManualInlineAction');
      ensureDropdownOption();
    } finally {
      cleaning = false;
      observeReferenceScreen();
    }
  }

  function scheduleClean(){
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      cleanReferenceDuplicates();
    }, 60);
  }

  function observeReferenceScreen(){
    const refScreen = document.getElementById('refScreen');
    if (!refScreen) return;
    if (!observer) {
      observer = new MutationObserver(scheduleClean);
    }
    observer.observe(refScreen, { childList: true, subtree: true });
  }

  function install(){
    cleanReferenceDuplicates();
    setTimeout(cleanReferenceDuplicates, 150);
    setTimeout(cleanReferenceDuplicates, 700);
    setTimeout(cleanReferenceDuplicates, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();

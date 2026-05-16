/* TapCalc 3.0.0 livefix8 reference tool polish + mobile nav */
(function(){
  const BUILD = window.TAPCALC_BUILD || {};
  const LABEL = BUILD.label || 'TapCalc v3.0.0 - 2026-05-16';
  const MOBILE_NAV_STYLE_ID = 'tapcalc-mobile-top-nav-style';

  function updateVersionText(){
    document.querySelectorAll('.version-badge, .top-app-title').forEach((el) => {
      if (/TapCalc/i.test(el.textContent || '')) el.textContent = LABEL;
    });
    document.querySelectorAll('.sync-pill').forEach((el) => {
      el.textContent = BUILD.syncPill || 'LIVE';
    });
  }

  function removeLegacyBoltingPdfAction(){
    document.querySelectorAll('#refScreen .reference-inline-actions a[href*="Bolting Chart.pdf"]').forEach((el) => el.remove());
  }

  function tagReferenceTools(){
    document.body.classList.add('tapcalc-alpha202', 'tapcalc-livefix8');
    if (BUILD.channel) document.body.dataset.tapcalcChannel = BUILD.channel;
    if (BUILD.version) document.body.dataset.tapcalcBuild = BUILD.version;
    const converterCard = document.querySelector('#refScreen .reference-view[data-reference-view="converter"] .reference-card');
    if (converterCard) converterCard.classList.add('reference-converter-card');
  }

  function installMobileTopNav(){
    let style = document.getElementById(MOBILE_NAV_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = MOBILE_NAV_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      @media (max-width: 820px) {
        html { scroll-padding-top: 12px; }
        body.measurement-page {
          padding-top: 0 !important;
          padding-bottom: 12px !important;
        }
        body.measurement-page .screen-nav {
          position: relative !important;
          top: auto !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          z-index: 55 !important;
          display: grid !important;
          grid-template-columns: minmax(0, .82fr) minmax(0, .82fr) minmax(0, 1.1fr) minmax(0, .94fr) minmax(0, 1.18fr) !important;
          gap: 6px !important;
          box-sizing: border-box !important;
          width: 100% !important;
          margin: 0 0 14px !important;
          padding: 8px !important;
          border: 1px solid rgba(140, 176, 214, 0.28) !important;
          border-radius: 0 0 16px 16px !important;
          background: rgba(8, 26, 48, 0.97) !important;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.24) !important;
          backdrop-filter: blur(10px);
        }
        body.measurement-page .screen-nav .screen-tab {
          min-width: 0 !important;
          box-sizing: border-box !important;
          padding: 10px 4px !important;
          font-size: clamp(11px, 2.9vw, 14px) !important;
          line-height: 1.08 !important;
          letter-spacing: -0.01em !important;
          white-space: nowrap !important;
        }
        body.measurement-page .top-app-bar {
          top: 0 !important;
        }
        body.measurement-page .screen-view.active {
          padding-bottom: 16px !important;
        }
      }
      @media (max-width: 380px) {
        body.measurement-page .screen-nav {
          gap: 4px !important;
          padding-left: 6px !important;
          padding-right: 6px !important;
        }
        body.measurement-page .screen-nav .screen-tab {
          padding-left: 2px !important;
          padding-right: 2px !important;
        }
      }
    `;
  }

  function installScreenOwnershipBridge(){
    if (window.__tapcalcLivefix8ScreenBridgeReady) return;
    window.__tapcalcLivefix8ScreenBridgeReady = true;
    const screens = {
      home: 'homeScreen',
      job: 'jobScreen',
      calc: 'calcScreen',
      card: 'cardScreen',
      jobs: 'jobsScreen',
      ref: 'refScreen'
    };
    const aliases = {
      tools: 'calc',
      workflow: 'card',
      library: 'jobs',
      reference: 'ref'
    };
    const resolve = (name) => aliases[String(name || '').trim()] || String(name || '').trim();
    const normalize = (name, options = {}) => {
      const target = resolve(name);
      if (!screens[target]) return false;
      Object.entries(screens).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const active = key === target;
        el.classList.toggle('active', active);
        el.hidden = !active;
        el.setAttribute('aria-hidden', active ? 'false' : 'true');
        el.style.display = active ? 'block' : 'none';
        el.style.pointerEvents = active ? 'auto' : 'none';
        el.style.visibility = active ? 'visible' : 'hidden';
        if (!active) el.style.zIndex = '0';
      });
      document.querySelectorAll('.screen-tab[data-screen]').forEach((tab) => {
        const active = resolve(tab.dataset.screen) === target;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      document.body.classList.toggle('show-library-screen', target === 'jobs');
      try { localStorage.setItem('tapcalcV3Screen', target); } catch {}
      if (!options.silent) {
        if (target === 'jobs') setTimeout(() => { try { window.renderJobsList?.(); } catch {} }, 0);
        if (target === 'ref') setTimeout(() => { try { window.initReferenceWorkspaceHard?.(); } catch {} }, 0);
      }
      window.__tapcalcLivefix8ActiveScreen = target;
      return true;
    };
    const schedule = (name) => {
      const target = resolve(name);
      if (!screens[target]) return;
      [0, 40, 160].forEach((delay) => setTimeout(() => normalize(target), delay));
    };
    const fromActiveTab = () => {
      const active = document.querySelector('.screen-tab.active[data-screen]') || document.querySelector('.screen-tab[aria-pressed="true"][data-screen]');
      if (active?.dataset?.screen) schedule(active.dataset.screen);
    };
    window.tapCalcNormalizeScreen = normalize;
    window.addEventListener('click', (event) => {
      const tab = event.target?.closest?.('.screen-tab[data-screen]');
      if (tab?.dataset?.screen) schedule(tab.dataset.screen);
    }, true);
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const tab = event.target?.closest?.('.screen-tab[data-screen]');
      if (tab?.dataset?.screen) schedule(tab.dataset.screen);
    }, true);
    window.addEventListener('pageshow', () => setTimeout(fromActiveTab, 80));
    setTimeout(fromActiveTab, 250);
  }

  function installLibrarySearchBridge(){
    if (window.__tapcalcLivefix8LibraryBridgeReady) return;
    window.__tapcalcLivefix8LibraryBridgeReady = true;
    const $ = (id) => document.getElementById(id);
    const laneKey = 'tapcalcLibraryLaneV1';
    const lanes = ['local', 'shared'];
    const getLane = () => {
      const activeButton = document.querySelector('.library-lane-btn.active[data-library-lane]');
      const activePanel = document.querySelector('.library-lane.active[data-library-lane-panel]');
      return activeButton?.dataset?.libraryLane || activePanel?.dataset?.libraryLanePanel || localStorage.getItem(laneKey) || 'local';
    };
    const selectedId = () => String(
      window.__tapcalcLibrarySelectedId ||
      window.__tapcalcExactLibrarySelectedId ||
      window.__tapcalcDetailSelectedId ||
      (typeof selectedJobId !== 'undefined' ? selectedJobId : '') ||
      document.querySelector('#jobsSelect .jobs-list-item.active[data-job-id]')?.dataset?.jobId ||
      ''
    ).trim();
    const rememberSelection = (id) => {
      const value = String(id || '').trim();
      if (!value) return;
      try { window.__tapcalcLibrarySelectedId = value; } catch {}
      try { window.__tapcalcExactLibrarySelectedId = value; } catch {}
      try { window.__tapcalcDetailSelectedId = value; } catch {}
      try { if (typeof selectedJobId !== 'undefined') selectedJobId = value; } catch {}
    };
    const applyLane = (lane = getLane(), options = {}) => {
      const target = lanes.includes(lane) ? lane : 'local';
      lanes.forEach((name) => {
        document.querySelectorAll(`.library-lane-btn[data-library-lane="${name}"]`).forEach((button) => {
          const active = name === target;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        document.querySelectorAll(`.library-lane[data-library-lane-panel="${name}"]`).forEach((panel) => {
          const active = name === target;
          panel.classList.toggle('active', active);
          panel.hidden = !active;
          panel.setAttribute('aria-hidden', active ? 'false' : 'true');
          panel.style.display = active ? 'block' : 'none';
          panel.style.pointerEvents = active ? 'auto' : 'none';
        });
      });
      if (target === 'shared') {
        const sharedContent = $('sharedJobsContent');
        const sharedToggle = $('sharedJobsToggleBtn');
        if (sharedContent && sharedToggle?.getAttribute('aria-expanded') !== 'false') sharedContent.hidden = false;
      }
      try { localStorage.setItem(laneKey, target); } catch {}
      window.__tapcalcLivefix8LibraryLane = target;
      if (options.render && target === 'shared') scheduleRender(80);
      return target;
    };
    const restoreSelection = (id = selectedId()) => {
      const value = String(id || '').trim();
      if (!value) return false;
      const item = document.querySelector(`#jobsSelect .jobs-list-item[data-job-id="${CSS.escape(value)}"]`);
      if (!item) return false;
      document.querySelectorAll('#jobsSelect .jobs-list-item.active').forEach((el) => {
        el.classList.remove('active');
        el.setAttribute('aria-pressed', 'false');
      });
      item.classList.add('active');
      item.setAttribute('aria-pressed', 'true');
      rememberSelection(value);
      return true;
    };
    const renderDetails = (delay = 0) => {
      setTimeout(() => {
        try { if (typeof window.renderSelectedJobDetails === 'function') window.renderSelectedJobDetails(); } catch {}
      }, delay);
    };
    const scheduleRender = (delay = 140) => {
      clearTimeout(window.__tapcalcLivefix8RenderTimer);
      const id = selectedId();
      const list = $('jobsSelect');
      const scrollTop = list ? list.scrollTop : 0;
      window.__tapcalcLivefix8RenderTimer = setTimeout(() => {
        try { if (typeof window.renderJobsList === 'function') window.renderJobsList(); } catch {}
        setTimeout(() => {
          restoreSelection(id);
          if (list) list.scrollTop = scrollTop;
          renderDetails(0);
          applyLane(getLane());
        }, 40);
      }, delay);
    };
    const handleLaneClick = (event) => {
      const button = event.target?.closest?.('.library-lane-btn[data-library-lane]');
      if (!button) return;
      setTimeout(() => applyLane(button.dataset.libraryLane, { render: true }), 0);
      setTimeout(() => applyLane(button.dataset.libraryLane, { render: true }), 120);
    };
    const handleSearchInput = (event) => {
      if (event.target?.id !== 'jobsSearchInput') return;
      applyLane('shared');
      scheduleRender(180);
    };
    const handleResultSelect = (event) => {
      const item = event.target?.closest?.('#jobsSelect .jobs-list-item[data-job-id]');
      if (!item) return;
      rememberSelection(item.dataset.jobId);
      setTimeout(() => {
        restoreSelection(item.dataset.jobId);
        renderDetails(0);
      }, 0);
      setTimeout(() => {
        restoreSelection(item.dataset.jobId);
        renderDetails(0);
      }, 100);
    };
    const handleResultKey = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      handleResultSelect(event);
    };
    document.addEventListener('click', handleLaneClick, true);
    document.addEventListener('input', handleSearchInput, true);
    document.addEventListener('change', handleSearchInput, true);
    document.addEventListener('click', handleResultSelect, true);
    document.addEventListener('touchstart', handleResultSelect, { capture: true, passive: true });
    document.addEventListener('keydown', handleResultKey, true);
    window.addEventListener('pageshow', () => setTimeout(() => applyLane(getLane()), 120));
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('.screen-tab[data-screen="jobs"]')) setTimeout(() => applyLane(getLane(), { render: getLane() === 'shared' }), 180);
    }, true);
    window.tapCalcNormalizeLibrary = () => applyLane(getLane(), { render: false });
    window.tapCalcRenderLibraryStable = () => scheduleRender(0);
    setTimeout(() => applyLane(getLane()), 350);
  }

  function installMobileLoadBridge(){
    if (window.__tapcalcLivefix8LoadBridgeReady) return;
    window.__tapcalcLivefix8LoadBridgeReady = true;
    const selector = '#jobsLoadSelectedBtn, #jobsLoadSelectedBtnFinal, #jobsLoadSelectedBtnMobileCanonical, #jobsLoadSelectedBtnMobile114, [data-load-job]';
    const isCompact = () => {
      try { return window.matchMedia ? window.matchMedia('(max-width: 860px)').matches : window.innerWidth <= 860; } catch { return false; }
    };
    const stop = (event) => {
      try { event.preventDefault(); } catch {}
      try { event.stopPropagation(); } catch {}
      try { event.stopImmediatePropagation(); } catch {}
    };
    const handle = (event) => {
      if (!isCompact()) return;
      const button = event.target?.closest?.(selector);
      if (!button) return;
      const jobsScreen = document.getElementById('jobsScreen');
      if (jobsScreen && !jobsScreen.classList.contains('active')) return;
      stop(event);
      const now = Date.now();
      if (now < Number(window.__tapcalcLivefix8LoadBridgeUntil || 0)) return false;
      window.__tapcalcLivefix8LoadBridgeUntil = now + 900;
      try {
        const loader = window.tapCalcForceLoadSelectedJob || window.tapCalcLibraryLoadSelected || window.loadSelectedLibraryJob;
        if (typeof loader === 'function') loader(event);
      } catch (error) {
        console.error('livefix8 mobile load bridge failed', error);
      }
      return false;
    };
    ['pointerdown', 'touchstart', 'click'].forEach((type) => {
      window.addEventListener(type, handle, { capture: true, passive: false });
    });
  }

  function hideLegacyDebugPanels(){
    ['mobileLoadDebugTop', 'mobileLoadDebugPanel'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  function run(){
    updateVersionText();
    removeLegacyBoltingPdfAction();
    tagReferenceTools();
    installMobileTopNav();
    installScreenOwnershipBridge();
    installLibrarySearchBridge();
    installMobileLoadBridge();
    hideLegacyDebugPanels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  [150, 500, 1200, 2200].forEach((delay) => setTimeout(run, delay));
})();
# TapCalc Live Baseline Audit - 2026-07-06

Audited live build: `TapCalc v3.0.0-livefix14 - 2026-07-06`

Local branch: `main`

Local head: `cc4ca1a Fix mobile shared library lane`

Public site checked: `https://bcocalc.github.io/measurement-card.html`

## Executive Summary

The current live app is serving the expected `livefix14` files and the loaded JavaScript passes syntax checks with the bundled Node runtime. The recent top-tab and Library Shared-lane fixes are working in a mobile smoke test.

The bigger problem is structural: live behavior depends on a long chain of old alpha/livefix patches fighting for ownership of the same screens, tabs, library lanes, load-job actions, scroll behavior, and mobile hit areas. `overlays/tapcalc-mobile-reliability.js` currently wins because it is loaded last, but the underlying conflicts are still present. That is why small hotfixes keep causing new mobile regressions.

## Current Live Asset Graph

Initial HTML:

- `measurement-card.html` loads `styles.css?v=3.0.0-livefix14`.
- `measurement-card.html` loads `firebase-config.js?v=3.0.0-livefix14`, `stackup-data.js?v=3.0.0-livefix14`, and `measurement.js?v=3.0.0-livefix14`.
- `firebase-config.js` dynamically loads `tapcalc-overlays.css?v=3.0.0-livefix14` and `tapcalc-overlays.js?v=3.0.0-livefix14`.
- `firebase-config.js` registers `service-worker.js?v=3.0.0-livefix14`.

Live overlay JavaScript order:

1. `overlays/tapcalc-workflow-library.js`
2. `overlays/tapcalc-livefix11-workflow.js`
3. `overlays/tapcalc-shell-reference.js`
4. `overlays/tapcalc-field-manual.js`
5. `overlays/tapcalc-reference-router.js`
6. `overlays/tapcalc-mobile-reliability.js`

Live overlay CSS order:

1. `overlays/tapcalc-workflow-library.css`
2. `overlays/tapcalc-livefix11-workflow.css`
3. `overlays/tapcalc-shell-reference.css`
4. `overlays/tapcalc-reference-router.css`
5. `overlays/tapcalc-field-manual-mobile.css`
6. `overlays/tapcalc-light-mode.css`
7. `overlays/tapcalc-mobile-reliability.css`

Service worker:

- Cache name is `tapcalc-cache-3.0.0-livefix14`.
- All service-worker listed local assets exist.
- The service worker precaches core shell files, overlays, PDF.js files, `stackup-data.js`, `manifest.json`, `firebase-config.js`, `team-logo.png`, and `script.js`.
- It uses network-first for navigations and shell assets, then cache fallback.

## Verification Performed

Local checks:

- `git status -sb`: clean at audit time.
- Syntax checks passed for `measurement.js`, `tapcalc-overlays.js`, active overlay JS files, `service-worker.js`, and `firebase-config.js` using bundled Node at `C:\Users\antho\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`.
- Plain `node` and `gh` are not available on PATH in this shell.

Public checks:

- Public `measurement-card.html`, `firebase-config.js`, `service-worker.js`, `tapcalc-overlays.js`, and `tapcalc-overlays.css` return HTTP 200.
- Public HTML contains `3.0.0-livefix14`.
- Public service worker contains `tapcalc-cache-3.0.0-livefix14`.
- GitHub Actions API shows latest Pages run `28771781271` for `cc4ca1a` completed successfully.
- Recent failed deploys were present before the successful run: `f01f21d` failed, and one earlier `78b1c8b` run failed before a successful rerun.

Mobile smoke test at `390 x 844`:

- Version badge showed `TapCalc v3.0.0-livefix14 - 2026-07-06`.
- Top tabs `home`, `calc`, `card`, `jobs`, and `ref` all activated their target screen.
- Library Shared lane became active after tap: `jobsScreen[data-active-lane="shared"]`, shared panel visible, local panel hidden.
- Workflow operation select had `Hot Tap` and `Line Stop`.
- Workflow machine select was populated.
- Reference option data exists, but the hidden native select has no clickable box.
- After navigating to Reference from a scrolled Library state, `window.scrollY` remained `639`; the visible `Choose Reference` button was above the viewport (`y=-134`).
- Console showed repeated Firestore `INTERNAL ASSERTION FAILED: Unexpected state` errors during the smoke run.

## High Priority Findings

### P1 - Screen And Tab Ownership Is Duplicated

Multiple modules independently control `.screen-tab`, `.screen-view`, `body[data-active-screen]`, hidden/display state, pointer events, z-index, scroll behavior, and localStorage screen restore.

Evidence:

- `measurement.js:5165` starts an old `alpha4 app shell navigation` block.
- `measurement.js:7120` wraps `window.tapCalcSetScreen`.
- `measurement.js:7288` wraps `window.tapCalcSetScreen` again.
- `measurement.js:10882` adds a mobile screen ownership reset.
- `measurement.js:12765` adds a newer shell screen/router reset.
- `measurement.js:12964` binds capture-phase `pointerdown`, `touchstart`, and `click` handlers for navigation.
- `overlays/tapcalc-shell-reference.js:92` adds another screen ownership bridge.
- `overlays/tapcalc-mobile-reliability.js:39` adds another `setScreen` implementation and capture-phase nav handler.

Impact:

- One tab fix can change scroll behavior, hit testing, or hidden state somewhere else.
- Mobile scroll position can persist across screen changes when it should reset.
- Tabs can become clickable only because the last overlay forcibly restores pointer events.

Recommended cleanup:

- Keep one canonical screen router.
- Move all tab click handling into that router.
- Remove old wrappers that manually toggle screen DOM state after the canonical router is stable.

### P1 - Library Local/Shared Lane Ownership Is Duplicated And Contradictory

The Library lane has a correct base implementation and a newer router implementation, but several old compact-mobile fixes force the lane back to Local. Livefix14 currently overrides those by capturing lane taps last.

Evidence:

- `measurement.js:3360` defines the original `setLibraryLane`.
- `measurement.js:3384` and `measurement.js:3402` bind lane click handlers.
- `measurement.js:7053` wraps `setLibraryLane`.
- `measurement.js:7101` forces compact Library to `local`.
- `measurement.js:7272` blocks `openSharedLibraryLane` on compact screens by forcing Local.
- `measurement.js:7385` and `measurement.js:7433` clear Shared/open Shared back to Local.
- `measurement.js:7608` defines another `forceLocalLibrary`.
- `measurement.js:12793` and `measurement.js:12856` add a newer lane DOM/core implementation.
- `overlays/tapcalc-shell-reference.js:162` adds another library bridge.
- `overlays/tapcalc-mobile-reliability.js:192` adds another lane implementation and wins with delayed reapplication.

Impact:

- The Shared tab can appear dead if an older handler fires after the user tap.
- The current fix relies on load order and delayed reapplication, not a single source of truth.

Recommended cleanup:

- Delete or disable the old compact-only force-local blocks after test coverage exists.
- Keep one canonical `setLibraryLane(lane, options)` that owns DOM, storage, and optional Shared load.
- Make "open Library Local" and "open Library Shared" explicit router actions.

### P1 - Mobile Load Job Handling Is Over-Bound

Saved-job loading has many generations of mobile-specific handlers, button clones, debug bridges, and capture-phase listeners.

Evidence:

- `measurement.js` contains 422 `addEventListener(` calls.
- `measurement.js:7463` starts an old "load job restore" block.
- `measurement.js:10023` contains an `alpha115 mobile Load Job debug tracer`.
- `measurement-card.html:369` still includes `mobileLoadDebugPanel`.
- `measurement.js:10637` creates a mobile canonical load button.
- `measurement.js:10751` creates another mobile canonical desktop-loader bind.
- `measurement.js:13319` binds load handling at both `window` and `document` for `click`, `pointerdown`, `pointerup`, `mousedown`, `touchstart`, and `touchend`.
- `overlays/tapcalc-shell-reference.js:294` adds another mobile load bridge.

Impact:

- High risk of double loads, blocked taps, stale selected IDs, and scroll/focus jumps.
- Debug UI and old load paths remain in the live code.

Recommended cleanup:

- Define one job selection state object.
- Define one load action.
- Stop replacing/cloning load buttons for mobile.
- Remove debug panels after a verified load-flow smoke test exists.

### P1 - Reference Picker Has A Mobile Scroll-State Bug

The Reference tools exist, but after navigating from a scrolled Library state, the page can remain scrolled down, leaving the `Choose Reference` button above the viewport. The hidden native select cannot be clicked.

Evidence:

- Mobile smoke after Library to Reference showed `window.scrollY=639`.
- `.screen-nav` had `y=-515`.
- `#referenceLibraryToggle` had `y=-134`.
- `#referenceViewSelect` is hidden with `display:none`, `hidden=true`, `width=0`, `height=0`.
- `overlays/tapcalc-reference-router.js` and `overlays/tapcalc-field-manual.js` both attach Reference click/change handlers.

Impact:

- User may land on Reference without seeing the picker.
- Automation cannot click the hidden native select; real users must use the custom picker, but it may be off-screen.

Recommended cleanup:

- Canonical router should reset scroll to top on tab changes unless a specific action asks to preserve scroll.
- Reference should expose one mobile picker contract: either custom dropdown only or native select only, not both as active interaction targets.

### P1 - Firestore Emits Repeated Internal Errors During Live Smoke

The app dynamically imports Firebase 10.12.5 modules, signs in anonymously, and uses `getFirestore(app)`. During the mobile smoke run, the browser console emitted repeated Firestore internal assertion errors.

Evidence:

- `measurement.js:4352` defines `ensureFirebaseReady`.
- `measurement.js:4377` imports Firebase modules from `gstatic`.
- `measurement.js:4387` signs in anonymously.
- `measurement.js:4389` uses `getFirestore(app)`.
- `measurement.js:5155` calls `ensureFirebaseReady().then(()=>loadCloudJobs())` on load.
- Smoke logs repeatedly showed `Firestore (10.12.5) INTERNAL ASSERTION FAILED: Unexpected state`.

Impact:

- Shared jobs may still load, but console-level Firestore errors can indicate multi-tab, persistence, stream, or SDK lifecycle problems.
- Startup currently attempts remote Firebase work automatically, which is risky for PWA/offline plant use.

Recommended cleanup:

- Add an explicit Firebase connection state machine.
- Consider lazy-loading Shared jobs only when entering Shared lane or tapping Connect.
- Investigate Firebase SDK init with multi-tab/offline persistence behavior.
- Add a smoke check that records Firebase status text and console errors.

## Medium Priority Findings

### P2 - Overlay Stack Is A Patch Queue, Not A Module Boundary

The overlay entrypoint says stabilized patches live in `overlays` while they are folded into the main app. That folding has not happened yet. Live depends on overlay order.

Evidence:

- `tapcalc-overlays.js:9` lists ordered JS overlays.
- `tapcalc-overlays.css:2` lists ordered CSS imports.
- `overlays/tapcalc-workflow-library.js:1` still says `TapCalc Dev 3.0.0-alpha201 overlay`.
- `overlays/tapcalc-shell-reference.js:1` still says `TapCalc Dev 3.0.0-alpha210`.
- `overlays/tapcalc-field-manual.js:1` still says `TapCalc Dev 3.0.0-alpha214`.
- `overlays/tapcalc-livefix11-workflow.js` remains named after livefix11 even though live is livefix14.

Impact:

- It is hard to tell what is canonical versus temporary.
- A future cleanup might delete the wrong thing because names are stale.

Recommended cleanup:

- Rename overlays by responsibility, not version.
- Fold proven overlays into canonical modules.
- Leave only experimental/dev overlays in `dev/`.

### P2 - CSS Specificity Debt Is High

`styles.css` and overlays use many late mobile overrides and `!important` rules.

Evidence:

- `styles.css`: 286.7 KB, 8,414 lines, 784 `!important`, 88 media blocks.
- `styles.css:3542` defines sticky `.screen-nav`.
- `styles.css:3543` changes mobile `.screen-nav` to fixed bottom.
- `styles.css:4130` changes mobile `.screen-nav` to sticky top.
- `overlays/tapcalc-shell-reference.js:28` injects mobile top-nav CSS.
- `overlays/tapcalc-mobile-reliability.js:85` injects another mobile nav CSS block and sets `.screen-nav` to `position: relative !important`.

Impact:

- The live nav behavior changes depending on which injected style wins.
- Fixing hit areas can also change sticky/relative/fixed behavior.

Recommended cleanup:

- Make one mobile nav layout decision and encode it once.
- Remove injected style blocks that duplicate stylesheet rules.
- Add a visual smoke checklist for scroll positions.

### P2 - Repo Contains Likely Dead Root Files

Root `tapcalc-alpha201.*` and `tapcalc-alpha202.*` are tracked but not loaded by live. `script.js` is cached by the service worker but not loaded by the live app shell.

Evidence:

- Search found no live references to `tapcalc-alpha201`.
- `tapcalc-alpha202.js` and `.css` only reference themselves and the Bolting PDF cleanup that now exists in `overlays/tapcalc-shell-reference.*`.
- `script.js` appears in `service-worker.js:27` and its own comments, but not in `measurement-card.html`.

Impact:

- Repo is harder to understand.
- Service worker may cache stale legacy code.

Recommended cleanup:

- Move dead alpha files into an archive folder or delete after one final reference check.
- Decide whether `script.js` is a real fallback route. If not, remove it from the service-worker precache.

### P2 - Dev Tree Duplicates Live Assets And Large PDFs

The repo has a full `dev/` tree duplicating many live files and PDFs.

Evidence:

- Root tracked size: about 4.5 MB.
- `reference/`: about 24.6 MB.
- `dev/`: about 29.2 MB.
- Many `reference/stackups/*.pdf` files are duplicated under `dev/reference/stackups/`.
- `dev/measurement.js` differs from root by 354 diff lines.
- `dev/styles.css` differs from root by 114 diff lines.

Impact:

- Repo size grows quickly.
- It is easy to promote only part of dev to live or accidentally miss a duplicated asset.

Recommended cleanup:

- Keep `dev/` if it is the intentional dev deployment path, but document promotion rules.
- Avoid duplicating large static reference PDFs unless GitHub Pages path constraints require it.
- Consider shared root assets with dev HTML pointing upward where feasible.

### P2 - Offline Coverage Is Better, But Not Fully Defined

The service worker caches the app shell and dynamic reference assets after first fetch, but there is no written offline contract.

Evidence:

- `service-worker.js:3` lists precache assets.
- `service-worker.js:33` uses `Promise.allSettled`, so one failed precache asset does not fail install.
- `service-worker.js:49` treats broad `/overlays/tapcalc-` paths as shell assets.
- Reference PDFs are not all precached.
- Firebase SDK imports are remote URLs and are not precached by this service worker.

Impact:

- The app shell can work offline after install, but Shared jobs and first-time Firebase SDK access need network.
- It is unclear which reference PDFs should be guaranteed offline.

Recommended cleanup:

- Define an offline contract: app shell, calculators, local saved jobs, reference stackups, shared job sync.
- Precache only the must-have reference files.
- Add an offline smoke test/runbook.

## Lower Priority Findings

### P3 - Versioning Is Scattered

Live version appears in HTML, Firebase config, service worker, manifest, index redirect, PDF.js URLs, and overlay imports.

Impact:

- Manual bumps are error-prone.

Recommended cleanup:

- Create one release metadata file or simple bump script.
- Verify public HTML and service worker markers before calling a release live.

### P3 - No Project Test Harness Or Build System Is Visible

No package manifest, lint command, test command, or GitHub workflow file was visible in the repo root during audit.

Impact:

- Current verification depends on ad hoc syntax checks and manual browser smoke tests.

Recommended cleanup:

- Add a small smoke-test script that can run against public live and local files.
- Add checks for loaded version, top tabs, Library lanes, Workflow selects, Reference picker, and service worker markers.

## Recommended Cleanup Order

1. Freeze non-critical live hotfixes while cleanup branch starts.
2. Add a smoke-test harness before deleting old code.
3. Create one canonical screen router and move all tab/screen state into it.
4. Create one canonical Library lane controller and remove compact force-local patches.
5. Create one canonical saved-job selection/load controller.
6. Resolve mobile nav design: sticky top, relative in flow, or bottom nav; encode it once.
7. Fix Reference scroll reset and picker contract.
8. Investigate Firestore initialization and startup behavior.
9. Fold or rename active overlays by responsibility.
10. Archive/delete dead root alpha files and decide the fate of `script.js`.
11. Document dev-to-live promotion and offline guarantees.

## Suggested Smoke Matrix

Run on live and dev at phone width:

- Load app fresh and confirm visible version/build.
- Tap each top tab from top of page.
- Scroll Library down, tap Reference, verify Reference starts near top and picker is visible.
- Tap Library, Local, Shared, Local again.
- Tap Workflow and verify Hot Tap/Line Stop and machine selects open/populate.
- Tap Reference `Choose Reference`, select Field Manual, return to another reference.
- Turn on light mode and check Home, Workflow, Library, Reference.
- Load one local saved job and one shared job.
- Reload in standalone/PWA context after service worker update.
- Simulate offline after first load and verify shell, calculators, local jobs, and expected references.

## Candidate File Actions

Safe after smoke coverage:

- Archive or delete `tapcalc-alpha201.css`.
- Archive or delete `tapcalc-alpha201.js`.
- Archive or delete `tapcalc-alpha202.css`.
- Archive or delete `tapcalc-alpha202.js`.
- Remove `script.js` from service-worker precache if it is not a supported fallback route.

Requires refactor first:

- Remove old compact Library force-local blocks in `measurement.js`.
- Remove duplicate mobile load-job bridges and debug panels.
- Fold `tapcalc-mobile-reliability` behavior into the canonical router/controller.
- Fold `tapcalc-shell-reference` screen/library behavior into the canonical router/controller.

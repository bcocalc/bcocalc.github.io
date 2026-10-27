# Alpha254 / Livefix19 Release Checks

Before promoting dev to live, run the complete release check:

```powershell
node tests/release-check.mjs
```

This includes shared-fix parity, six simulated regression checks, the 66 existing
unit/sync cases, 20 measurement-parser cases, all 27 cutter-chart rows, and both mobile browser engines.
`--unit-only` is available for
quick checks but is not enough to release. See `docs/dev-to-live.md` and `AGENTS.md`.
The GitHub Library safeguard runs these checks on pushes and pull requests; it
does not replace or gate the separate branch-based Pages deployment.

The new `tests/dev-features.mjs` checks the pending dev features in Chromium and
WebKit, with phone touch and desktop mouse input. Reference checks run in both
light and dark themes: one active panel, SmartStop size/filter/clear controls,
and folding-head lookups and number entry. Workflow checks cover unrestricted
next/back navigation, inactive-panel isolation, and separate Line Stop /
Completion measurements when creating and switching operations. Application
checks include three distinct Line Stops, card-based opening, per-application
next/back, and 320-pixel tabs in both themes. The release runner executes phone
and desktop separately for each engine with the existing 180-second per-run
limit; no device coverage is skipped.
It uses the same CSP-isolated localhost fixture as the Library test. Native
dropdowns are scrolled into view before selection, as a user would do.

`tests/reference-measurements.mjs` exercises the existing folding-head parser,
including signed mixed fractions and invalid input. These are software behavior
checks, not a new engineering validation of source ratings or operating limits.

`tests/cutter-reference.mjs` checks the supplied standard Hot Tap / Line Stop
chart without changing printed precision. Browser checks cover the read-only
lookup, unsupported sizes, type switching, and collapsed mobile-friendly chart.

Use Node 24. For a standard checkout, install the pinned test-only dependency:

```powershell
npm install --no-save --package-lock=false --ignore-scripts playwright@1.64.0
npx --no-install playwright install webkit
```

Local runs use installed Google Chrome plus Playwright WebKit. CI installs both
Playwright browser binaries with `--with-deps` and uses bundled Chromium.

Run the touch-handler unit checks (24 network-free cases):

```powershell
node tests/library-tap-unit.mjs
```

Run the real browser regression with locally installed Playwright or the Codex
bundled Node runtime (whose sibling `node_modules` includes Playwright):

```powershell
node tests/library-touch.mjs
$env:TAPCALC_BROWSER = 'webkit'
node tests/library-touch.mjs
Remove-Item Env:TAPCALC_BROWSER
```

The default browser is installed Chrome; the second run requires Playwright's
WebKit browser. Both use iPhone touch emulation in disposable contexts, a
localhost fake database, rewritten Firebase configuration, and a restrictive CSP.
The tests open both unsynced cards, preserve card nodes across refreshes, verify
the original saved snapshots, and sync from 4 local / 2 waiting to 4 local / 0
waiting. The loader is allowed to finish its existing hydration timers before
navigating back. These tests do not access the phone's data or production writes.

Run the current public transport and app integration regressions:

```powershell
node tests/cloud-sync.mjs
```

These 28 network-free cases cover both live and dev, two-operation saved states,
offline/timeout/denied responses, partial success, lost write acknowledgements,
create-only collision protection, old addDoc receipt recovery, concurrent saves,
storage failures, and pagination. All fetch calls go to an in-memory fake.

The sync regression uses Node's VM with injected modules, no browser and no network:

```powershell
node tests/sync-local-jobs.mjs
```

It covers two saved jobs, a hanging sign-in or session restore, offline mode,
permission errors, partial success, retry, duplicate Sync taps, and concurrent
local saves. Application timeouts are accelerated inside this test only.

For a visual preview with local-only SDK stubs and CSP blocking external traffic:

```powershell
node tests/sync-preview.mjs
```

The printed local URL simulates denied uploads while Shared reads work. Add
`?fixture=success` to simulate recovery. Its four local fixture jobs (two unsynced) never use real Firebase. The preview is a
diagnostic harness, not evidence of production network success.

## Archived Feature Regression

The alpha248 suite below predates the new public REST transport. It was not rerun
for alpha249 and still targets the older build. Do not use its older browser
interception as isolation for production write tests. Use the VM tests and
CSP-isolated local preview above for this release.

Requirements: Node.js, Playwright, and Google Chrome. The script uses an installed
`playwright` package or the Codex bundled Node runtime package as a fallback.

Run from the repository root in PowerShell. Without `TAPCALC_TEST_BASE`, the script
starts a temporary localhost server and closes it when the tests finish.

```powershell
node tests/release-alpha248.mjs
```

The default suite uses separate, disposable browser contexts at 390px and 1280px.
It checks screen navigation, light/dark Reference panels, blank-job workflow
navigation, Shared-job loading, three distinct operation measurements, text
escaping, token refresh, pagination, empty results, errors, request deduplication,
timeouts, and offline status. Firestore reads use fixtures; writes are rejected.
Service-worker cache ownership and private-request bypass are also checked.

For real browser offline reloads and dev/live cache coexistence, use localhost:

```powershell
$env:TAPCALC_OFFLINE_ONLY = '1'
node tests/release-alpha248.mjs
Remove-Item Env:TAPCALC_OFFLINE_ONLY
```

To verify real Shared-job reads, optionally against the deployed dev site:

```powershell
$env:TAPCALC_LIVE_READ_ONLY = '1'
$env:TAPCALC_TEST_BASE = 'https://bcocalc.github.io/'
node tests/release-alpha248.mjs
Remove-Item Env:TAPCALC_LIVE_READ_ONLY
Remove-Item Env:TAPCALC_TEST_BASE
```

This mode blocks every non-GET Firestore request, including the SDK's read-only
POST Listen transport; results must arrive through REST GET requests. A blocked
Listen request is allowed in the audit, but any other non-GET request fails it.
It checks the alpha248 label and
visible Load buttons for the retrieved jobs, but does not click Load or test real
cloud saves, updates, or deletion. It uses the app's anonymous sign-in in a fresh
browser context, not the user's browser profile.

## Pre-Alpha Home navigation

`node tests/pre-alpha-home.mjs` executes the real workspace owner in a synthetic,
network-free DOM/history/storage harness. It covers Home as the bare-URL default,
explicit `#workspace` resume, Home/Resume preservation, saved/reference navigation,
Back/Forward, Home refresh, missing active IDs and explicit New without replacing
the prior draft. It runs in the unit release aggregate.

`tests/pre-alpha-home-ui.mjs` runs through `tests/pre-alpha-ui.mjs` in both browser
engines and both viewports. It adds real keyboard/touch navigation, light/dark
320px layout, menu/wordmark Home, saved-job reopening, manual override preservation,
refresh/deep-link and native history checks in disposable localhost fixtures.
The existing calculator-focused seeded tests now request `#workspace` explicitly;
Home is independently tested with both fresh and returning storage.

`node tests/pre-alpha-worker-upgrade-ui.mjs` uses installed service workers on a
disposable localhost origin and new persistent synthetic profiles. It tests the published 10 Git baseline, upgrade to
the candidate, browser-offline edits/reloads/process restarts, cache ownership, rollback and
re-upgrade. Run with `TAPCALC_BROWSER=webkit` as well as Chromium. The full release
runner and CI retain this gate; a failing engine must not be skipped.

The optional `--origin-unavailable` mode separately tests a server outage, not
browser offline mode. `tests/pre-alpha-offline-control.mjs` is a minimal runner
diagnostic containing no TapCalc code. Neither alternative waives a failure of
the default installed-worker release check. Playwright 1.64.0 fixes the upstream
offline-emulation defect reproduced by 1.62.1 (microsoft/playwright#42775/#42894).
Ephemeral WebKit CacheStorage can separately lose data on navigation; persistent
PWA tests therefore use fresh retained profiles, not the user's browser. All
cache and save-preservation assertions remain, plus offline restart and an
uncached-navigation negative control. Physical Safari is a separate device check.

`node tests/pre-alpha-cache-context-control.mjs` separately verifies fetched and
synthetic Cache API entries across reload and process restart without TapCalc or
service workers. Default persistent controls run in the full release aggregate.
Its optional `--ephemeral` mode is diagnostic, fails if cache entries disappear,
and does not waive the durable PWA checks. Keep the old failing evidence.

The expanded Pre-Alpha UI collection has a 360-second process cap because it
includes five fresh reference contexts per viewport plus ETA/PDF/Home checks.
Other scripts keep 180 seconds; locator timeouts and assertions are unchanged.

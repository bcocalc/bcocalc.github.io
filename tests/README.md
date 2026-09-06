# Alpha251 / Livefix19 Release Checks

Before promoting dev to live, run the complete release check:

```powershell
node tests/release-check.mjs
```

This includes shared-fix parity, six simulated regression checks, the 66 existing
unit/sync cases, 20 measurement-parser cases, and both mobile browser engines.
`--unit-only` is available for
quick checks but is not enough to release. See `docs/dev-to-live.md` and `AGENTS.md`.
The GitHub Library safeguard runs these checks on pushes and pull requests; it
does not replace or gate the separate branch-based Pages deployment.

The new `tests/dev-features.mjs` checks the pending dev features in Chromium and
WebKit, with phone touch and desktop mouse input. Reference checks run in both
light and dark themes: one active panel, SmartStop size/filter/clear controls,
and folding-head lookups and number entry. Workflow checks cover unrestricted
next/back navigation, inactive-panel isolation, and separate Line Stop /
Completion measurements when creating and switching operations.
It uses the same CSP-isolated localhost fixture as the Library test. Native
dropdowns are scrolled into view before selection, as a user would do.

`tests/reference-measurements.mjs` exercises the existing folding-head parser,
including signed mixed fractions and invalid input. These are software behavior
checks, not a new engineering validation of source ratings or operating limits.

Use Node 24. For a standard checkout, install the pinned test-only dependency:

```powershell
npm install --no-save --package-lock=false --ignore-scripts playwright@1.62.1
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
$env:TAPCALC_WEBKIT = '1'
node tests/library-touch.mjs
Remove-Item Env:TAPCALC_WEBKIT
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

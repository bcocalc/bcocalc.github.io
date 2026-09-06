# Alpha248 / Livefix17 Checks

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

The printed local URL simulates stalled sign-in. Add `?fixture=success` to simulate
recovery. Its two local fixture jobs never use real Firebase. The preview is a
diagnostic harness, not evidence of production network success.

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

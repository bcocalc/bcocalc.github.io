# Dev-to-Live Release Checklist

## Protected Baseline

On 2026-09-05 the user confirmed that livefix19 fixed the actual iPhone problem:
recent local saves opened and the two waiting jobs synced. The matching dev build
is alpha250. Baseline commit: `db46e63ec867478c56c19b381bbc33d66a3e8f1e`.

Both builds already contain the stable recent-card rendering, scoped touch
handler, idempotent refreshes, and bounded create-only REST sync. Do not replace
these with code from earlier alphas, `dev-live/`, or an older ZIP.

## Before Every Promotion

1. Start with a clean, current checkout and obtain approval to promote features.
2. Merge the intended dev features deliberately. Preserve root/live build
   configuration, Firebase database `(default)`, and existing local storage keys.
   Do not blindly overwrite root with the entire dev folder.
3. Keep the protected touch/render/load functions and shared transport in sync.
   The contract check names any drift. If intentionally redesigning that code,
   update both copies and retain equivalent regression coverage, not a bypass.
4. Bump release versions consistently in HTML, JS, config, overlay asset queries,
   manifest, and service worker. Keep live and dev channel labels distinct.
5. Run `node tests/release-check.mjs` on the final release candidate. Do not publish
   if it fails. This runs the contract/overwrite checks, unit/sync tests, and both
   Chromium and WebKit touch checks against live and dev with fake data only.
6. Review the diff for unintended files or lost fixes. Push only the reviewed
   candidate, check the GitHub Library safeguard result, and verify Pages serves
   the intended label and script versions. Confirm on a real phone after a
   substantial promotion. Never ask users to clear unsynced job storage.

## Automated Coverage

The Library safeguard workflow runs on pushes and pull requests. It checks that
the shared fix has not drifted, that Sync and recent cards retain touch bindings,
and that the database and release versions are consistent. Simulated overwrites
must fail. Browser tests catch wholesale recent-card rebuilding even if the same
bad change is made to both copies, and verify saved measurements survive loading
and syncing. All browser writes go to an isolated localhost fake database.

Dependencies are test-only: Node 24 and Playwright 1.62.1. See `tests/README.md`.

## Deployment Boundary

The existing site publishes from the main branch. This test workflow reports
regressions but does not itself block that separate Pages deployment. Direct
pushes still publish, so the full local pre-release check is mandatory in our
release process. Server-enforced blocking requires a separately approved switch
to a gated Pages workflow or appropriate branch protection; neither is implied
by adding tests. See the official [Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

# Home + safer saves: local handoff

## Scope and baseline

This is an integrated **local, unpublished** PRE-ALPHA candidate for
`bcocalc/bcocalc.github.io`, not a replacement of root/live or dev. Published
baseline: `21bf9b289196c25912f38424573b295209e49e03` (PRE-ALPHA 10).
The source-equivalent local baseline is
`bad70ea67281d6877de41ca4f4349731ab9fce12`. The separate reviewed preparations were
Home `4a4e7a579d557b76591388225d583b148fa69aac` and safer saves
`39d93dfdd1519256f6d2e90b8235fd0d3ded1ec3`.

The existing first-visit welcome is now Home. The bare `/pre-alpha/` URL and
`#home` open it; explicit `#workspace` still resumes the calculator. Home, its
menu/wordmark entries and Resume retain the same current job, operation, step,
manual overrides and measurements. Only explicit New creates another job.
Saved jobs and References reuse their existing owners. There is one page router.

The persistence change keeps the old experimental key read-only and serializes
new sidecar saves using Web Locks with per-job baseline checks. Conflicting
edits remain in their tab, with explicit separate-copy / load-saved recovery.
Read [the storage contract](pre-alpha-concurrent-workspace.md) before changing
that design or planning a rollback.

## Verified locally

- 15 network-free Home/navigation cases execute the complete workspace owner,
  including Home while a save is pending and cross-tab updates while on Home.
- 11 persistence-store groups and 8 real-controller groups cover synthetic lock
  contention, stale writes, recovery, operation deletion, queued edits,
  selection, quota/malformed storage, and old/new-build interleavings.
- `node tests/release-check.mjs --unit-only` passes, as do supplemental
  PRE-ALPHA source/reference/ETA/help/PDF-cancellation suites and syntax checks.
- Existing browser assertions remain; snapshot reads now inspect the merged
  workspace and await acknowledged saves. Read-only Home/Reference checks compare
  **both** raw keys, not just the now-read-only old key.
- The full release runner and existing CI browser matrix include the new
  concurrent-save browser suite. Editing the workflow locally did not run CI.

## Not verified / exact browser blocker

No real browser test or visual screenshot was completed for this candidate.
The sandboxed Chromium launch failed before opening a page with
`socket() failed: Operation not permitted`; the save-fix worker's explicit
escalation failed before execution with a sandbox mount denial. No sandbox
workaround or repeated launch was used. Unit/VM tests are not browser evidence.

An authorized environment must execute the **final exact candidate**:

```sh
node tests/release-check.mjs
# The runner includes both Chromium and WebKit. For focused diagnosis:
node tests/pre-alpha-ui.mjs
node tests/pre-alpha-workspace-store-ui.mjs
TAPCALC_BROWSER=webkit node tests/pre-alpha-ui.mjs
TAPCALC_BROWSER=webkit node tests/pre-alpha-workspace-store-ui.mjs
```

Use the existing disposable localhost fixtures, never production jobs. Inspect
Home fresh/returning at 320px, phone touch and desktop keyboard, light/dark,
menu/wordmark/Resume, saved jobs, References, native Back/Forward, refresh, and
explicit New. Exercise real cross-tab contention/recovery, and recheck all
native reference-control focus assertions. Installed-worker upgrade/offline/
rollback and physical iPhone checks remain separate open gates.

## Compatibility and release decisions

- Web Locks are required for new writes; no unlocked fallback is used.
- Old builds cannot see companion-only edits. Two old tabs can still overwrite
  each other; legacy-only jobs are not proactively copied merely by viewing
  Home. Preserve unsaved work before updating old tabs.
- Both keys and the upgraded entry path must survive rollback. Reverting code
  does not migrate the new data back into the old format.
- Saves remain device-only. No cloud write/export/login or unsupported-equipment
  calculation feature was added. Storage quota and forced process termination
  still limit durability; browser unload prompts are not guaranteed.
- The received package retained build 10. Desktop integration now uses the
  synchronized local-only build 11, including the workspace-store import/cache
  entry and versioned test expectations. Exact-candidate checks must pass before
  any separately approved publication. Do not publish under the old cache identity.
- Publication, external CI execution, root routing changes, backend/rules,
  account/privacy choices and broader launch features need their own authorized
  scope. No external branch, PR, CI rerun, main update or Pages deployment was
  performed for this handoff.

# Pre-Alpha 11 integration and launch gates

This is the historical integration/old-runner record. The local offline-gate
follow-up is documented in [pre-alpha11-offline-gate.md](pre-alpha11-offline-gate.md),
including the runner/context diagnosis, exact-test receipt and phone procedure.

## Scope and identity

Prepared on 2026-10-26 (user's America/Chicago date), from published Pre-Alpha 10
`21bf9b289196c25912f38424573b295209e49e03`, on the separate branch
`codex/home-safer-saves-local`. The original main checkout was not updated.

The uploaded handoff is 115677 bytes, SHA-256
`019e42cf0116f811b22f8d7432ae89bcef5eaf46b915d35ff607ccd75c703c47`.
All 21 candidate blobs and published baseline blobs matched the manifest. The
patch's documented test-README newline mismatch was reconciled without forcing
application or overwriting unrelated work. Build, queries, visible labels,
Firebase marker and worker are synchronized to local candidate 11.

Root/live and dev files, cloud transport, original source tables, calculations,
backend rules and production jobs are unchanged. New saves use the companion
key under Web Locks; the old workspace key is read-only. See the storage contract
for mixed-tab and rollback limitations. This is not a cloud backup feature.

## Desktop evidence

- Full unit aggregate passes, including 15 Home cases, 11 store groups and
  8 controller groups. Windows CRLF normalization was added only to source-reading
  test harnesses; source-parity and original-worker Git-blob assertions remain.
- Chromium and WebKit Pre-Alpha UI suites pass on phone and desktop, including
  Home, native reference selector focus, ETA, help, real PDF workers and preservation.
- Both engines pass actual cross-tab Web Locks contention, unrelated-job saves,
  stale rename/delete rejection, retained drafts, separate-copy recovery/reload.
- Chromium passes installed-worker 10-to-11 upgrade, browser-offline save/reload,
  inline references, cache isolation, rollback and re-upgrade with both formats intact.
- Windows WebKit browser-offline reload fails with an internal runner error.
  The same error is reproduced by `tests/pre-alpha-offline-control.mjs`, which
  contains no TapCalc sources. The separate origin-outage run completes the
  save/rollback sequence but fails unrelated-cache sentinel preservation. A
  separate minimal page, with no TapCalc code or workers, also loses both fetched
  and synthetic Cache API entries after reload on this Windows runner. These
  diagnostics do not waive either application assertion.
- The full Windows release aggregate stopped at its 180-second per-script cap
  during the final fresh desktop WebKit reference context. The standalone
  Pre-Alpha UI suite passed on both viewports. The aggregate is not a full pass;
  the independently reproduced Windows offline failure is also an open gate.
- Separately authorized Linux branch CI completed for application/test commit
  `b8a01c4c1e6c9c69882a294bf4d543c0c5202c0f`. Unit and the entire Chromium job
  pass. WebKit passes live/dev regression, Pre-Alpha phone/desktop UI and actual
  multi-tab save recovery, but its installed-worker browser-offline reload fails
  with the same internal error. Its no-TapCalc minimal offline control fails too.
  Thus this driver issue is not Windows-only, and CI is NOT a release pass. Results:
  https://github.com/bcocalc/bcocalc.github.io/actions/runs/40439139180
  Neither published-10 CI nor unit tests certify this new candidate.

All fixtures are synthetic, use disposable localhost browser contexts and make
no production Firebase writes. Screenshots and logs are evidence of those
fixtures, not physical iPhone testing or field-math certification.

## Release plan

1. Clear the remaining WebKit/Safari offline gate using a verified driver or
   controlled physical Safari test. Retain the actual offline/cache-isolation
   assertions; no skips or unlocked save fallback. Run the full release aggregate
   on a supported runner before publication. No Pages/main deployment was made
   by the test-branch push. The Linux WebKit job's failure remains visible.
2. On an actual iPhone, check returning/fresh Home, step and operation memory,
   conflicts, offline reload/save and update with old tabs. Explain that old
   builds cannot see companion-only edits, and preserve both keys on rollback.
3. Obtain separate approval for a Pre-Alpha-only trial. Never copy the candidate
   to live/dev or clear real storage as an upgrade step.
4. Before considering a live replacement, resolve required parity: device-only
   editing vs shared save/export, unsupported HTP/Hi-Stop math and MCO/Rod MCO.
5. Separately review input validation: reject/warn negative measured distances
   and plug thickness without rejecting legitimate signed LD. Decide PTC equality
   against approved guidance. Do not silently change engineering boundaries.
6. Resolve Pivot Head and 660/760 pressure/feed source conflicts and ETA's .004
   feed applicability against .003 equipment entries using approved sources.
   Verify deployed backend rules separately; repository history is not proof.
7. Require explicit approval for authentication/security changes, numerical
   source-conflict resolution and any eventual root/live publication.

Recommendation: hold live replacement. A passing Home/save candidate alone does
not close the engineering, data-backup, physical Safari or access-control gates.

Local evidence is saved beside the checkout in `_home_saves_validation/`, including
unit/UI/lock/worker/control logs, selected Linux CI output and 16 Home screenshots.
The local aggregate's failure, as well as passing targeted suites, is retained.
This report update does not modify the tested application code and is local only.

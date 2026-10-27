# PRE-ALPHA concurrent workspace preparation

This is a local fix candidate, not permission to publish or migrate user data.
Calculations, source reference values, cloud transport, and live/dev storage are
unchanged. Synthetic tests never use real jobs, accounts, or browser profiles.

## Authority and compatibility

Both `tapcalcPreAlpha01Workspace` and `tapcalcPreAlpha01WorkspaceConcurrentV1`
are **read-only legacy inputs**. Their bytes and formats are never rewritten,
removed, cleared or destructively migrated. Live/dev keys are unchanged.
Upgraded saves use the IndexedDB database `tapcalc-pre-alpha-workspace-v1`,
object store `workspace`, record `current`. Each edited/copied job retains its
revision, original bundle and fingerprints of its older inputs. Merely opening
Home or a Reference does not copy jobs. Selection writes only the active ID.

Every save retains the exclusive Web Lock, but safety does not depend on a
fresh localStorage read after that lock: Linux WebKit exposed stale reads in
diagnostic CI 40449337280. The authoritative record read, exact per-job revision
comparison and write now share one IndexedDB readwrite transaction. Success is
reported only on transaction completion, never on request success. An abort
retains the previous record and the in-memory draft. No localStorage mirror or
unsafe fallback is used. Unsupported locks/database, denied/quota storage,
malformed JSON/schema and same-job conflicts fail closed.

The controller waits for the database before resuming jobs. Synchronous UI
reads use its last loaded snapshot, not a concurrency authority. Saves always
compare against the transaction's record. BroadcastChannel notifications and
window focus refresh peer snapshots without replacing drafts. Missing peer
notifications may delay the warning but cannot authorize a stale overwrite.

Two upgraded tabs can save unrelated jobs without replacing each other. A
rename, operation deletion, stage change, migration, or measurement edit is a
full-job revision: stale changes cannot silently restore deleted operations or
revert another tab's metadata. Explicit separate-copy recovery assigns a new
job/source identity while retaining complete operations, unknown fields and the
original imported bundle. Loading the saved version explicitly discards only
the current tab's draft after confirmation. Pending discarded writes are
canceled again inside the lock.

## Mixed-build limitations (must be explained before release)

PRE-ALPHA10 pages and earlier V1 companion writers do not use the new database.
New code never mirrors to either older key. Old tabs cannot erase transactional
saves; new code cannot erase their unseen localStorage writes. Unrelated older
jobs are merged on read. A visible same-ID older change is a conflict, not a
silent replacement; its original bytes remain in its older key. Separate-copy
recovery retains the older version without acknowledging that divergence.

Two **old** tabs can still overwrite each other, and old builds cannot see
transaction-only jobs or edits. This fix cannot change JavaScript already running
in an old tab. Update/reload old tabs after preserving any unsaved work.
Rollback hides newer database-only saves, not removes them;
do not clear any storage to roll back. Reinstalling the upgraded build makes
those saves available again. Do not advertise transparent downgrade support.

The database holds one bounded-format current snapshot, not an append-only
history. Existing legacy data plus upgraded copies use additional device
storage; explicit conflict copies add complete jobs. There is no automatic
cleanup/compaction and no cloud backup. Quota failure leaves previous durable
bytes intact and asks the user to keep the page open. In-memory unsaved drafts
cannot survive a forced process kill; pending/failed work triggers the browser's
beforeunload warning where the browser permits it. A successful save is only
reported after the database transaction commits. Browser eviction, user-cleared
site data and hardware/OS failures are not a cloud backup guarantee.

## Verification and release gates

- `node tests/pre-alpha-workspace-store.mjs`: deterministic network-free store
  tests, including adversarial old-writer interleaving, same-job conflict/copy,
  selection, canceled queued saves, malformed storage, quota, no-lock/database
  cases and deliberately permanently stale tab views. The fake transaction
  scheduler is not evidence of real IndexedDB integration.
- `node tests/pre-alpha-workspace-store-ui.mjs`: actual same-context browser
  pages contending behind a held Web Lock; phone and desktop; UI conflict,
  draft navigation, explicit copy and reload. Transaction traces and independent
  fresh-tab database reads retain the original conflict assertions. Linux WebKit
  runs at most ten sequential fixtures and stops on first failure. Run Chromium
  **and** WebKit; a local Windows pass does not close the Linux/iPhone gates.
- Existing UI tests must wait for `Saved on this device` before reload and read
  the merged workspace via the new test helper. Keep direct old-key byte-
  invariance assertions and independently snapshot the DB across read-only
  navigation, offline reload/restart, rollback and re-upgrade.
- Run all PRE-ALPHA model/browser suites and `node tests/release-check.mjs` on
  the final integrated candidate. A unit-only pass is not a release pass.
- The received candidate retained build 10. Desktop integration now uses the
  synchronized local-only build 11. Before any separately authorized publication,
  verify visible/build/module/stylesheet/Firebase marker/worker identities and
  new module caching on the final candidate.
- No user storage, production cloud records, repository remote, or deployment
  was modified while preparing this patch.

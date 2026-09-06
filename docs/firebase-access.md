# Firebase Access

Verified in the Firebase console on 2026-09-05:

- Project: `tapcalc-afc92`.
- TapCalc's existing Shared jobs are in the Standard database `(default)`.
- The Enterprise database `default` is a different database containing test data.
  Do not redirect TapCalc to it or migrate records without explicit approval.
- `firestore.rules` was published to `(default)` with user approval. Anyone can
  read, create, and update direct documents in `tapcalcJobs`. Client deletion,
  other collections, and subcollections are denied. Admin access is separate.
- This temporary public policy has no automatic expiration. It is not crew-only
  access; public edits can overwrite job contents, and abuse can incur usage costs.
- The separate Enterprise database retains its original expired rules.
- GitHub Pages deployment does not publish Firestore rules. The rules file is the
  source copy of the console change, not an automatic deployment configuration.

Billing shows Blaze. The initial billing-enablement error cleared after
publication, and read-only checks retrieved 29 Shared jobs from `(default)`.
The alpha246 app displays all 29 jobs with Load buttons at both 390px
and 1280px widths, both locally and on the deployed GitHub Pages dev site.
These checks blocked every non-GET Firestore request; no job
records were changed. Creating/updating real cloud jobs was not exercised.

The alpha246 configuration explicitly retains `(default)`, matching the
live application's original database. The earlier conclusion that this database
was missing was incorrect; do not retain that assumption in a future handoff.

## Alpha247 Save And Sync Verification

With explicit user approval, one synthetic Shared job was created through the
dev app's normal Sync Shared button on 2026-09-05 (America/Chicago):

- Title: `TEST ONLY - alpha247 save-sync verification - 2026-09-05`.
- Document ID: `157hKYGhTT81THDW3mZd`, in `(default)/tapcalcJobs`.
- It contains one Hot Tap, one Line Stop, and one Completion Plug, with distinct
  measurements and operation notes. It is not field-work data.
- Offline Save Job, local loading in a fresh browser session, and real Shared
  sync were exercised. The writer only allowed creation of this one new document;
  writes to all pre-existing documents and deletion were blocked by the harness.
- Fresh desktop (1280px) and phone-emulation (390px, touch enabled) sessions loaded
  the Shared record and retained all operations, notes, machine, pipe/cutter data,
  and entered measurements across page reloads.
- Content fingerprints confirmed that the original 29 Shared jobs were unchanged.
  There are now 30 jobs including this test record, which was not deleted.
- The first offline save's automatic SDK write connections were intentionally
  blocked. The harness initially counted those blocks as failures; its handling
  was corrected, and subsequent read checks reused the same record, not a new one.

The test found a stale job-type visibility flag when adding stop/plug operations.
Alpha247 refreshes the existing workflow shell after applying operation state;
no calculation formulas or saved-job schema were changed. The regression suite
now checks that newly added stop and plug inputs can actually be edited, including
opening their normal collapsed sections on mobile.

Reference selection was checked in both themes at phone width. These are browser
emulation checks, not a physical iPhone/Safari test or engineering certification.
The live root app was not promoted as part of this verification.

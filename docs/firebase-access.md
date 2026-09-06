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
and 1280px widths. These checks blocked every non-GET Firestore request; no job
records were changed. Creating/updating real cloud jobs was not exercised.

The alpha246 configuration explicitly retains `(default)`, matching the
live application's original database. The earlier conclusion that this database
was missing was incorrect; do not retain that assumption in a future handoff.

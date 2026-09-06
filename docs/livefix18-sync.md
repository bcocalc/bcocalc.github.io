# Livefix18 / Alpha249: Public Sync Transport

The phone can display Shared jobs but cannot upload its two local saves.
The exact device-side SDK failure is unconfirmed. Livefix17's connection
timeouts and status box were not enough on the reported phone.

## Changes

- The explicitly configured public-access mode now uses finite REST requests for
  Connect, Shared reads, Save uploads, and Sync, without waiting for SDK auth or
  the Firestore streaming transport. The authenticated SDK path remains when
  public-access mode is disabled.
- Rules, billing, the database, and existing cloud records are unchanged.
  Unauthenticated REST requests are still evaluated by Firestore Security Rules:
  https://firebase.google.com/docs/firestore/use-rest-api
- Saved snapshot payloads and operation bundles are preserved. The uploader never
  substitutes the currently open form for a missing saved snapshot.
- SHA-256 snapshot IDs, exists:false writes, and readback verification prevent
  duplicate retries or overwriting a different Shared document. Legacy addDoc
  records with the same local ID and exact saved payload are acknowledged without
  another write.
- Upload confirmations are merged into fresh local history and checked for
  persistence failure. No local history is cleared or migrated.
- The Library displays a sync-ready line with the main script's build version,
  independently of the shell label. Missing status markup is recreated safely.
- Selecting Local no longer changes an established connection to Not connected.
- Root is livefix18; dev is alpha249. The larger dev feature promotion is paused.

## Validation

- 28 public-transport VM cases and 14 legacy SDK VM cases passed; no real network
  API is exposed to the test code.
- CSP-isolated localhost preview at 390px: denied uploads retain both fixtures;
  Connect then Sync recovery changes unsynced 2 to 0; Shared displays both jobs.
  Error feedback was visually checked in dark and light modes.
- No production write test was performed. Real iPhone upload success remains
  unverified until the user retries in the updated app.
- The old alpha248 broad feature suite was not rerun or promoted as evidence for
  this transport change.

## Phone Check

Refresh in the same browser or installed app that holds the local jobs. In
Library, confirm 'Sync ready (3.0.0-livefix18)' and tap Sync. Do not clear website
data or reinstall the app. A successful upload should reduce unsynced jobs to 0.
If it fails, the message beside Sync is the next diagnostic.

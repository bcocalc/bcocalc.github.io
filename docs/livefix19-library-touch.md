# Livefix19 / Alpha250: Stable Library Touch Targets

The user's livefix18 screenshot confirms Firebase is connected, with four local
jobs and two unsynced. Both recent-job cards and Sync ignore taps on the phone.

## Confirmed Bug and Fix

- WebKit touch emulation reproduced recent buttons being detached during a tap.
  The Library used to clear and rebuild every recent button on each refresh.
  Rendering now reuses buttons by local history ID and changes only changed text.
- Rewriting the observed Locked label triggered the overlay's own refresh loop.
  Identical labels no longer cause mutations.
- Dev browse mode and the older workflow guard were competing over labels and
  setter wrappers. The legacy guard now yields when browse mode is installed;
  browse copy updates are idempotent. Browse-any-step behavior is retained.
- Sync and recent cards use a scoped touch-end handler for deliberate taps, with
  movement, scrolling, cancellation, disabled-state, and duplicate-click checks.
  Mouse, keyboard, and programmatic clicks remain supported.
- Missing local records and synchronous load errors now report visible feedback
  instead of silently doing nothing.
- The Library overlay reads the current build label instead of rewriting an
  obsolete alpha201 label at startup.

## Validation and Limits

- 24 touch-handler unit cases, 28 public-sync VM cases, and 14 SDK-sync VM cases.
- Chromium and WebKit iPhone-emulation tests on root and dev: persistent card
  identity, both local fixtures opened by touch, and 4 local / 2 unsynced changing
  to 4 local / 0 unsynced. Saved measurement snapshots remain unchanged.
- Tests use a disposable localhost origin with fake Firebase and CSP isolation.
  No production database writes, rules changes, storage clearing, or migrations.
- The exact physical iPhone Sync failure is still unconfirmed. Desktop-sized
  mouse checks from older releases did not establish mobile touch reliability.
  A real-device retry is required after this release.
- Only this Library fix and the dev refresh-loop repair are released. The larger
  dev feature bundle is not promoted to live.

## Phone Check

Refresh the same browser or installed app that holds the local jobs. Confirm
livefix19, open a recent local job, return to Library, and tap Sync. The two waiting
jobs should reach zero if upload succeeds; otherwise use the visible status text
to diagnose the remaining issue. Do not clear website data or reinstall the app.

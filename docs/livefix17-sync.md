# Livefix17 / Alpha248 Sync Hotfix

This is a narrow live connection/sync hotfix. The wider alpha247 feature
promotion remains paused pending the user's real iPhone sync check.

## Changes

- Backport bounded sign-in restore and anonymous sign-in from dev into live.
- Keep a connection attempt deduplicated until it resolves or times out.
- Select Standard `(default)` explicitly; Firebase rules are unchanged.
- Show dedicated, persistent sync feedback outside either Library lane.
- Connect reports its failure and does not immediately obscure it with a read.
- Persist each successful upload into fresh local history, preserving other saves.
- Show failure reasons and retain unconfirmed local copies for retry.
- Root is `3.0.0-livefix17`; dev is `3.0.0-alpha248`.

No job formats, calculations, reference content, or routers were promoted.
No user browser storage was cleared or migrated.

## Checks

- Fourteen Node VM cases passed across root and dev, with no network API present.
- A local-only preview replaced SDK imports with local stubs and enforced a
  same-origin CSP. At 390px, the timeout message remained readable in light and
  dark modes and visible in both Library lanes.
- Local preview Connect recovered with the success stub; Sync updated two fixture
  jobs from two unsynced to zero. This is not a real Firebase write test.
- The actual iPhone connection cause is not yet confirmed. The hotfix prevents an
  indefinite sign-in wait and exposes a useful error for the next phone check.

## Test Incident And Cleanup

An earlier browser test used a broad routing pattern that did not isolate its SDK
requests. It unintentionally created four dummy production documents. The user
was notified, testing was stopped, and the user explicitly approved deleting
only those records. They were then deleted through the Firebase console:

- `B8ONiDi8OgM8GUCu52xG`: Sync fixture second
- `KTZ3YxYrpHxtVnkUHLQY`: Sync fixture first
- `QqLXVdqtLPNQiwY1oqSq`: Sync fixture second
- `T4qUAD0oxu99KzLtQage`: Sync fixture first

A read-only check confirmed all four absent, 30 Shared records remaining, and
the previously approved alpha247 test document `157hKYGhTT81THDW3mZd` still present.
No existing record was edited by that test or cleanup.
The unsafe test was replaced by the network-free VM test above. Browser previews
now use local SDK files, a demo project identifier, and browser-enforced CSP,
rather than relying on an interception wildcard.

# Local build 26 launch preparation

This candidate is local and unpublished. Final root/live launch is held for the
user's go-ahead after the remaining gates. It includes Head Assembly commit
2a637ff and draft worksheet commit dfa6f47. No private PDF or job data is shipped.

## Route and installed-start strategy

Root index.html uses one launch.js owner. It prepares and verifies the root
worker, then the /pre-alpha/ worker, before entering build 26. Registration itself
checks for updates; immediately issuing another update caused a reproduced
waiting-worker timeout, so the launcher does not issue a duplicate update.
Already prepared worker identities permit cached launch without a network check.
Failures hold at an explicit retry/legacy fallback without accessing job storage.

The old measurement-card installed start redirects only in standalone mode.
Normal direct browser access remains the frozen legacy calculator. The explicit
legacy=1 fallback bypasses that bridge even in standalone mode. Root measurement
JavaScript, legacy touch handlers, sync transport and Firebase config are unchanged.
The root worker passes /pre-alpha/ and /dev/ through to their existing owners.
It requires critical launch/legacy assets before activation and refreshes only
its own cache prefix. No IndexedDB or localStorage is cleared or migrated.

The manifest keeps the old inferred start identity as its explicit id, retains
scope/icons, and starts new installations at /pre-alpha/?v=pre-alpha26. Both old
and new installed entry routes are tested. The child worker retains its own
scope/cache ownership and reports build identity through a read-only handshake.
Build 26 changes outside these routes and the two agreed features are identity
strings only; the source guard compares frozen calculation/store semantics.

## Rollback plan (publication still requires approval)

Use a reviewed normal revert commit, never a force push or repository reset.
Restore root index.html, measurement-card.html and manifest.json from cdf8471.
Keep modern build-26 files reachable for installed icons whose manifest has not
refreshed. Retain the root worker child-route pass-through and use a fresh root
cache/version token while caching the restored legacy documents. Do not restore
the old root worker wholesale over child routes. Never clear storage or pending
captures. Recheck legacy access, modern direct access, complete jobs, pending
capture/confirmed receipt and re-upgrade before any rollback publication.
The isolated browser test exercises this route-only rollback and re-upgrade.

## Proof and remaining gates

The routing tests seed frozen cdf8471 legacy/root-worker bytes, old cached modern
modules, complete synthetic operation bundles, unknown raw fields, one pending
capture and one confirmed receipt. They compare the durable record byte-for-byte,
check legacy keys, restart the browser process and assert zero external/write
requests and zero page errors. All 33 unit scripts and 12 feature/export phone/desktop cases pass. Chromium
phone/desktop also pass prepared root launch with the origin unavailable. WebKit
phone/desktop pass online root/installed entry, restart, fallback and rollback.
WebKit origin-unavailable coverage is retained for the pinned Linux gate.
No result is inferred from a lost log.

The final full release suite includes 33 unit scripts and 52 browser scripts.
A complete pinned Linux run is still required; earlier build-25 CI success does
not validate this candidate. The existing workflow now fetches the exact cdf8471
baseline required by the new launch tests. No test-branch upload is included in
this local preparation. Do not repeat known Windows WebKit offline limitations
as a substitute for the established Linux route.

Original worksheet verification remains blocked: Library transfer failed while
applying required provenance because Windows Python lacks os.setxattr, and the
final PDF is absent. Do not bypass provenance or retry the failed transfer.
When available, select the existing local original index.pdf in the draft editor
(no upload); its full SHA256 must be
b800c3777fe6f8475582a7d2a447d2e5d1c3576cd3b22943eff525c6d9fab30a.
Inspect original page 5, Letter alignment, header/footer/Stop Work preservation,
overflow, and actual original-background print/save/cancel. Synthetic layout
proof cannot close this gate. Unconfirmed mappings and sign-offs remain blank;
dimensional units are already confirmed inches.

After source proof and full Linux checks: review the final diff, obtain final
launch approval, publish only the reviewed files, verify Pages assets/workers,
then check the existing iPhone installed icon online and offline after restart.
Check multi-operation jobs and pending saves without clearing/reinstalling,
legacy fallback, Head Assembly standalone/custom/BCO-copy behavior, and the draft
worksheet with the selected private template. No extra production fixture writes.

## Diagnostic 79 and unresolved launch lifecycle

Run 40897482834 used exact diagnostic 28b9ac8, directly based on 3d34dce.
Chromium candidate and frozen-baseline jobs passed all three fixed phone/desktop
trials. Both WebKit jobs stopped at trial 1: frozen-source worker request page
errors occurred between beforeunload and pagehide; candidate retained the launch
identity for 277 probes with no replacement root-worker source request. Its
legacy load/pageshow fired and both PDF responses finished successfully. These
are distinct failures; this does not prove the earlier release PDF page error
has the same cause. All four artifact ZIP digests were verified locally.

A pass-through local observer reproduced the candidate identity failure: both
existing legacy register callers ran, but neither reached its update callback
during rollback. It returned the original promises and arguments and preserved
assertions, but observers can affect timing. A server-only stable-root-URL control
passed pinned Windows Chromium/WebKit phone and desktop without those proxies.
An observer-enabled control still failed a PDF Service Worker context closed
page error. The actual local implementation then failed WebKit phone on that
page error and Chromium desktop on re-upgrade with an active and waiting root
worker. The implementation was therefore withdrawn; its failed patch/logs are
retained outside the repository. No root-worker URL repair is claimed.

The diagnostic-only 28b9ac8 changed no application bytes. The full 85-script
release workflow remains exactly as 3d34dce. The regression fixes the defective
async rollback wait: it now
polls and asserts the exact activated rollback identity. Page errors, including
teardown errors, remain failures. No timing delay, forced worker update, PDF
response replacement, error filtering or weaker data assertion was added.

The application lifecycle cause remains unresolved. A passing local control is
not a release pass. The diagnostic workflow override stays isolated on its own
branch and must never be merged into readiness/main. The complete pinned Linux
gate, original private-template alignment, physical-iPhone installed-route
acceptance and final launch approval remain outstanding. No further public
upload, publication, production write or private-source transfer is implied.

## Narrow worker and preview lifecycle repair (local only)

The full-sequence trace proved the fallback/rollback page uses the exact root
registration, not the child. Both legacy register callers ran, but their
promises stopped resolving after the preceding fallback page closed; no update
callback or replacement source fetch followed. A diagnostic explicit update of
the discovered root also stayed pending for six seconds. Waiting for both
already-existing predecessor promises while that page remained open restored
the next automatic rollback fetch. This ordering control still failed page
errors, and no settlement wait was added to the regression.

The existing firebase-config shell owner now coalesces preparation per page and
updates the exact existing root registration; it registers only when absent.
The duplicate measurement.js worker listener is removed. The existing launcher
also updates an existing root before verifying its actual active/controller
identity. Cold registration retains its existing versioned URL. The child
module follows the same exact-own-scope rule and rejects a parent registration.
Its worker, store, model, save and routing code are unchanged.

A separate failure-only readback found the intended next root build installed
and waiting behind the previous active build. The root worker now requests
its existing unconditional skip-waiting policy synchronously in the install
listener. Its install waitUntil still awaits critical caching; a missing
critical asset still rejects installation. The broader activation-message
experiment was removed. No unregister, storage clear, new update owner or
version/identity shortcut is included.

The legacy preview now invalidates outstanding render tokens on unload/pagehide
so an obsolete rejection cannot open a native PDF fallback while leaving. A
persisted pageshow resumes the existing selected-reference owner. Normal
preview failures still show their fallback. Actual PDF responses/content and
all page-error assertions stay unchanged. Behavior tests cover normal failure,
unload cancellation, restore and no job-storage access.

Strict reconstruction guards prove calculator code, root configuration and
workspace code are unchanged outside these exact lifecycle blocks. The release
identity check now recognizes the equivalent URL constructor and still requires
the build token and exact child scope. Full 85-script Linux release, original
private-template alignment, physical-iPhone acceptance and final publication
approval remain required. Actual final local outcomes must be recorded; no
public upload or release pass is implied.

Child scope is resolved from the document URL, preserving the previous relative
registration semantics and keeping the real workspace source executable in the
network-free VM harness. The URL constructor/build/scope identity assertions
remain exact; no application or harness assertion is removed.

### Actual local review outcome

The current edited candidate passed all 33 unit/source scripts. Its pinned
Playwright 1.64 Chromium launch regression passed phone and desktop, including
automatic rollback/re-upgrade, restart, complete durable jobs/captures/receipts,
legacy keys and page-error assertions. The final WebKit run crashed its target
during the phone rollback identity probe; it exited failure and desktop did not
run. Earlier controls and intermediate candidates are retained as evidence,
not substituted for this failed result. No retry-until-pass is authorized here.

Live/dev Library touch and mocked pending sync passed on both pinned engines
with the same calculator/config lifecycle edits. The complete pinned Linux
85-script gate has not run on this repair. Public upload is held for review of
this new diff; main, the public readiness branch and diagnostic branch remain
unchanged. No publication, private template upload or production record write
was performed. This local repair is reviewable but is not release-ready.

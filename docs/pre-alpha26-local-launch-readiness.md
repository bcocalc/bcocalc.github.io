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

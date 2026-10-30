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

### Actual a3cd50e local review outcome (before these corrections)

The a3cd50e candidate passed all 33 unit/source scripts. Its pinned
Playwright 1.64 Chromium launch regression passed phone and desktop, including
automatic rollback/re-upgrade, restart, complete durable jobs/captures/receipts,
legacy keys and page-error assertions. Its last WebKit run crashed its target
during the phone rollback identity probe; it exited failure and desktop did not
run. Earlier controls and intermediate candidates are retained as evidence,
not substituted for this failed result. No retry-until-pass is authorized here.

Live/dev Library touch and mocked pending sync passed on both pinned engines
with the same calculator/config lifecycle edits. The complete pinned Linux
85-script gate has not run on this repair. Public upload is held for review of
this new diff; main, the public readiness branch and diagnostic branch remain
unchanged. No publication, private template upload or production record write
was performed. This local repair is reviewable but is not release-ready.

## Two bounded review corrections

The launcher applies one 20-second deadline to the complete preparation phase,
including lookup, registration, update and both identity checks. A timed-out
attempt restores Retry and failure feedback. Native promises cannot be canceled,
so an attempt-liveness check after every await prevents late settlement from
continuing preparation or navigating. Exact active/controller identities remain
required. Deterministic tests cover never-settling lookup/register/update, busy
coalescing, a successful explicit retry and stale completion after timeout.

Preview invalidation now schedules recovery if beforeunload is followed by no
pagehide. Actual pagehide cancels that recovery; persisted pageshow still resumes
the selected reference. Tests exercise canceled/failed navigation with usable
preview/fallback afterward, actual departure and browser restoration. No worker
policy, calculator formula, data/store behavior or unrelated source is changed
by these two corrections. Public upload remains held for review.

### f760313 bounded-correction outcome (before race correction)

All 33 unit/source scripts passed on the corrected application source, including
never-settling lookup/register/update, timeout/Retry/stale-result behavior and
beforeunload without pagehide with a usable retained-page preview/fallback.
The actual pinned Playwright 1.64 Chromium and WebKit online launch regression
both passed phone and desktop once on this edit, with all exact-identity,
complete data, restart, rollback/re-upgrade and page-error assertions intact.
The prior WebKit crash remains historical evidence, not this candidate's result.

This review delta changes root launch.js and measurement.js only, plus focused
tests, exact pins and this record. The cumulative unuploaded application files
are root firebase-config.js, launch.js, measurement.js, service-worker.js and
pre-alpha/workspace.mjs. No Firebase settings/keys/credentials, formulas, store
semantics, original PDFs or public workflow changes are included. The complete
85-script pinned Linux run has not run on this candidate and public upload
remains held for review. Original-template, installed-iPhone and final launch
approval gates remain open. No publication or production writes occurred.

## Explicit recovery after preview-race review

No timer can establish that navigation was canceled. Automatic zero-delay
recovery is removed. Beforeunload invalidates stale preview work and offers
a native Resume preview button in the existing preview status. Only explicit
user intent resumes that owner on a retained page; hidden pages and stale or
duplicate recovery actions are rejected. Pagehide still cancels obsolete work,
and persisted pageshow remains a positive restoration signal. No arbitrary
delay, error suppression, PDF substitution or job mutation is used.

The exact beforeunload -> timer opportunity -> later pagehide ordering is tested
with zero restart/fallback, alongside explicit canceled-navigation recovery,
stale action rejection, normal fallback and persisted restoration. The reviewed
whole-preparation deadline and its tests are unchanged. Actual final candidate
unit/browser outcomes and the specific review boundary must be recorded.


### Explicit-recovery candidate outcome

All 33 unit/source scripts passed. The exact unload -> timer opportunity ->
later pagehide case passed with zero automatic restart/fallback. Explicit
retained-page recovery, stale/duplicate action rejection, normal fallback and
persisted restore also passed. The reviewed whole-preparation deadline is
byte-for-byte unchanged from f760313.

The actual pinned Playwright 1.64 Chromium online launch regression passed
phone and desktop. The single WebKit run failed on phone at the retained
page-error assertion with Service Worker context closed during rollback;
desktop did not run. No error was suppressed and no retry-until-pass was made.
The failure is preserved for Linux investigation, not attributed to this
correction or called a Windows limitation without further evidence.

This correction changes measurement.js only in application source, plus the
focused regression, exact source pins and this record. It removes automatic
cancellation inference entirely. The specific correction must be reviewed
before the already-authorized test-branch upload and full pinned Linux gate.
Main/Pages/live publication, private template upload and production records
remain outside scope. No new generic approval is requested by this source.

## Installed-worker current-build correction after Linux run 81

Run 40912197122 on fda9454 fetched every required baseline and passed all
33 units. Both browser component jobs then failed the first frozen10 -> 26
installed-worker upgrade at the unchanged current-controller-URL assertion;
the full release aggregate was skipped. Independent offline/cache controls
passed. A version-matched one-case online control reproduced the timeout and
read back page edition 26 with controller/active script URL still ending in
pre-alpha10. This is a current-build identity regression, not a timeout budget
or missing-baseline issue.

The child boot may reuse a registration only when both its exact scope and
active script URL match the current BUILD. An older script URL instead takes
the existing current-build registration path. The meaningful version-query
upgrade assertion and all data/rollback/offline assertions remain unchanged.
A stale-child unit case proves it must register the current URL instead of
calling update on the old URL. No root worker, calculator, data/store/routing
or backend behavior is changed by this one-condition correction. The full
installed-worker matrix still requires Linux validation; focused online
controls do not replace its offline/rollback coverage.

### Local current-build correction validation

The before-fix pinned Chromium one-case control failed the same unchanged
controller-URL predicate and read back page edition 26 with active/controller
URL pre-alpha10. After the one-condition correction, pinned Chromium and WebKit
both passed that same focused frozen10 -> 26 online identity/raw-store control,
with active/controller URL pre-alpha26. All 33 unit/source scripts passed.

The control intentionally stops before offline/rollback scenarios and is not a
release-gate substitute. The repository's installed-worker test, its timeout,
current-version predicate and all data/offline/rollback assertions are unchanged.
The full pinned Linux matrix must run on the new exact candidate after review.
No new application-source upload has occurred for this correction; root files,
backend, production records, private PDF transfer and publication are unchanged.

## PDF loading-task lifetime after Linux run 82

Run 40915884426 tested exact aad5a729 and failed at 17:24:54 UTC. All three
prerequisite jobs passed. The aggregate passed 80 scripts, failed script 81
(launch-worker-upgrade-ui.mjs, WebKit desktop online rollback/re-upgrade),
and did not run four later scripts. Its page-error assertion caught the
legacy stack-up PDF fetch access-control error; phone online passed. The
child worker correction passed all twelve frozen-version cases per engine
in both prerequisite and aggregate runs. This is not a full release pass.

The fixture uses frozen HTML in rollback but current measurement.js. The
local source observer confirms the rollback script's exact aad5a729 hash
and presence of the unload lifecycle code; it does not establish that Linux
executed frozen script bytes. A deterministic deferred-module probe shows
both frozen cdf8471 and current aad5a729 loaders start getDocument after
preview invalidation. The earlier fix only guarded rendering/fallback after
that task. Existing loading tasks also had no lifecycle owner/destroy call.
These are inherited loader-lifetime gaps, not an identity timeout regression.
The exact Linux PDF event ordering is not established by its stack alone.

The narrow local correction guards the module continuation before creating
a loading task, rechecks the cache after that await to coalesce concurrent
requests, retains each loading task and destroys it on pause/departure.
Paused/hidden previews cannot restart. Explicit Resume or persisted restore
can recreate a task. A rejected old entry cannot evict a newer cache entry.
Active loading errors still propagate to the existing preview fallback.
No PDF library, browser page-error assertion, timeout, navigation fixture,
formula, storage, worker, backend or publication workflow changes.

Focused deterministic regressions cover delayed-module pause/hidden/stale
continuations, one concurrent task, destroy, explicit resume, active failure
propagation and no job/storage access. The metadata-only Windows WebKit
observer crashed in phone rollback; it is not proof of the Linux desktop
error or a successful regression. Browser and full Linux outcomes must be
reported separately after testing; no unproven release-success claim.

No upload, deployment, production writes or private PDF materialization is
authorized by this local correction. The changed source requires concrete
review before another already-authorized candidate upload/Linux run.

### Local lifetime-correction outcomes

All 33 unit/source scripts passed. The unchanged pinned Chromium online
phone/desktop root handoff, installed start, legacy fallback, complete
data/pending-capture/receipt preservation, restart and route rollback/re-upgrade
test passed. The unchanged pinned Windows WebKit test failed during phone
rollback with page.evaluate: Target crashed / Target page, context or browser
has been closed, before the Linux desktop point. The observer also crashed
at phone rollback before this repair. Neither result proves the cause is
Windows-only or that the Linux PDF access-control failure is fixed. No
page-error filtering, larger timeout, forced unregister/storage clear or
browser-test alteration was used. Full pinned Linux verification is pending
concrete review of this correction; the original private PDF and physical
iPhone gates are still separate and pending.

### Cleanup rejection review correction

Both beforeunload and pagehide explicitly catch the cleanup owner's promise
and report the original rejection through console.error with the stable
message Stack-up preview cleanup failed. The owner still returns rejection
to explicit callers; no global error handler or browser assertion is changed.
A focused regression executes the real cleanup owner with rejecting task
destroy methods through both lifecycle handlers, verifies the original error
is reported exactly once, and verifies no restart/fallback or retained task.
This corrects an unhandled cleanup-rejection gap; it does not claim the
remaining Linux PDF failure is resolved before Linux verification.

## Pending-root readiness observation after Linux run 83

Run 40926416633 on exact7fd5d58 passed all3 prerequisite jobs, then failed
aggregate script55/85 (Chromium desktop root rollback).54 scripts passed,
one failed,30 unrun. The outgoing root answered launch-pre-alpha26-1 while
a replacement remained waiting; no full85 result or WebKit root/PDF proof.

A bounded pinned Chromium156.0.8078.4 / Playwright1.64 observer reproduced
this class of waiting state: replacement install settled, skipWaiting
called/resolved once, correct replacement identity; outgoing worker had
restarted and answered186 root identity messages. A35-second quiet
observation after the original failure did not release it. This preserved
the original failure and did not increase an assertion deadline. Chromium's
version-matched registration/version implementation gates activation on
old-worker idle/work state even after skipWaiting; an inspected worker
restart also resets its immediate-idle-termination state. This supports a
probe/lifecycle interaction, not a missing update call or wrong root scope.
The Linux job itself did not record those internal counters; exact Linux
internal ordering is not retroactively proven.

The local external-only route-matcher control passed, but Playwright's
implementation still enables protocol interception. It is not evidence of
a native-network repair. A per-worker successful-reply memoization control
also passed without network changes; it is diagnostic only, not the source
correction. The final pending-state guard control passed original strict
phone/desktop identity/data/error assertions and rollback/re-upgrade with
original all-request routing and unchanged deadlines. Observers can affect
timing; a Linux release pass is still required.

The narrow source correction makes existing rootReady return false without
messaging an outgoing worker while registration.installing or.waiting is
present. The browser fixture's existing root-version helper does the same.
Once both pending slots clear, the original active/controller version
queries and expected identity assertions remain mandatory. No cached
identity, activation command, network handler, force unregister, data
mutation, worker source, timeout, error filter or expected identity changes.
Focused unit guards throw if either path touches/probes the old controller
while pending and prove the two exact identity checks resume afterward.

Sources reviewed: Chromium156.0.8078.4 content/browser/service_worker/
service_worker_registration.cc (IsReadyToActivate, ActivateWaitingVersion)
and service_worker_version.cc (TriggerIdleTerminationAsap, HasNoWork,
OnRequestTermination, StartWorkerInternal), and installed Playwright1.64
coreBundle.js interception/continuation implementation. This is a local
repair candidate; no further revision upload is authorized without review
and exact approval. Original-PDF alignment and iPhone gates remain pending.

The deterministic regression also executes the same readiness function with
only the new guard removed: three retries generate three outgoing-worker
probes while a replacement is pending. The guarded function generates none
and still performs both exact identity checks when pending state clears.
The prior browser-helper control touches the outgoing controller; the
guarded helper returns pending without touching it. These tests establish
the invalid probing pattern, not a model that proves Chromium internals.

The browser root probe additionally requires registration.active.state and
controller.state to be activated before querying version. Diagnostic traces
showed a matching reply while state was still activating; that reply alone
is now insufficient. Direct tests cover each activating state and retain
the exact reply check once both are activated. Deadlines are unchanged.

### Final local pending-root validation

All33 unit/source scripts passed on the final state-aware source. Without
worker/source diagnostic instrumentation, pinned Chromium passed all4
original root-upgrade cases: phone/desktop online and phone/desktop origin
unavailable, including installed start, legacy fallback, complete jobs,
pending captures/receipts, old-key preservation, restart, rollback and
re-upgrade. Network routing, expected identities, data/error assertions and
deadlines remained unchanged. The earlier observer controls are retained
as supporting diagnostic evidence, not substituted for these browser cases.

No Windows WebKit rerun was used to chase the previously recorded crash.
The new candidate has not run on Linux; prior run83 remains54pass/1fail/
30unrun. The earlier Linux WebKit/PDF issue and original-template alignment
are not claimed resolved. Local waiting reproductions included the forward
re-upgrade direction; they establish a matching lifecycle problem class,
not the exact unrecorded internal ordering of Linux's rollback failure.
No further push, dispatch, deployment, production save or private source
transfer occurred. Next revision requires review and exact upload approval.

## Worksheet deferred by user on 2026-10-30

The user shelved the autofilled HTS-5201 worksheet until after launch. Its entry and initialization are excluded from the current launch candidate; implementation, mapping and original tests are retained for later clarification. No private PDF selection, alignment or print work is pending for this launch scope. Historical worksheet gate/status notes above remain historical evidence, not current launch requirements. Generic job Print / Save PDF and Download PNG, all operation/data/math behavior and Head Assembly remain in scope unchanged. Strict root/child upgrade, rollback, offline, page-error, full Linux release and physical-iPhone gates remain required; shelving does not resolve CI88 or waive any unrelated failure. No publication is authorized.

## Local runtime cache lifetime correction after CI89

Exact fa65aca CI89 failed WebKit phone in the origin-unavailable scenario’s later rollback with root activating and child activated; online phone/desktop passed. No private worksheet is in launch scope. A deterministic exact-source control confirms navigation, shell and non-shell runtime cache.put promises can remain pending after the fetch response returns without event.waitUntil ownership. The local correction attaches only these optional writes to the originating event, leaves response delivery fast, and preserves exact cache failures as rejected lifetime promises. Install/activate logic, scopes, cache names, critical assets, routing, data/math and all browser assertions stay unchanged.

This corrects a proved ownership defect, NOT an established cause or fix for native activating. Prior CI86 instrumentation observed enumeration/deletion/claim/activation promises settling while public state remained activating; that counter-evidence is preserved. CI90’s minimal controls/sequence passed once and remain inconclusive; diagnostic loops stay stopped. Full pinned Linux validation and exact upload approval are still required for this new root-source revision. No publication or private PDF work is authorized.

## Local PDF cancellation ownership correction

The bundled shared PDF.js 4.10.38 API now returns native reader cancellation promises through transport and document destruction. Cleanup attempts every owned reader and preserves original failures; multiple cleanup failures remain available in AggregateError.errors. The existing application lifecycle diagnostic receives rejected task.destroy() promises. No error filter, worker protocol change, PDF parser change or release assertion relaxation is included. Apache-2.0 notices remain intact, and pdf-api-provenance.json reconstructs the exact original source. Both root and pre-alpha consume this shared API; both bundled workers are unchanged.

Network-free controls cover pending, successful and rejected cancellation, all-reader settlement, streaming-disable failure, message-owner propagation, owned worker release and simultaneous failures. A pinned Windows WebKit real-worker fixture reproduces the former unhandled failed-stream cancellation, then confirms the corrected destroy() rejects with the original error while healthy cleanup succeeds. This controlled result does not identify CI91's Linux failed resource or prove the rollback failure resolved. Full release remains failed/held; worksheet stays deferred. The separate range-readiness-before-first-read defect is not changed by this correction.

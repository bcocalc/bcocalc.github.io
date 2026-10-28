# TapCalc Pre-Alpha Design Study

This directory is a separate, user-authorized redesign experiment. Root/live
and dev remain independent releases. Do not promote this directory onto either.

- Build: pre-alpha19. Keep visible label, module/stylesheet queries, module
  constant, Firebase configuration build marker and worker build synchronized.
- This19 export parity slice is LOCAL ONLY; parent review is required before
  any upload or publication. Published17, root/live/dev and storage stay intact.
- Preserve legacy synchronous popup Print / Save PDF and 1400px PNG download.
  Export immutable click-time complete jobs with metadata and every operation;
  escape print text, wrap PNG text and report size/failure without truncation.
  Export must never save, migrate or upload a job.
- Authorized numerical addition: eligible Hot Tap-stage Rod MCO = Pilot on pipe
  + MCO, matching legacy calcHotTap. Keep current strict invalid/fraction/signed
  and blank-LD rules. Rod MCO is a rod reading, not the MCO cutout distance.
  Keep original imported snapshots separate and never persist over raw inputs.
- Measurement help permits only the prior reviewed derived text and exactly
  five explicitly authorized, hash-pinned WebP crops in measurement-figures/.
  Preserve their complete arrows/captions, TEAM copyright and unknown-revision
  attribution. No other originals, full pages, PDFs, slides, private manifests,
  renders, extracts, workbook data, restricted tables or audit records may ship.
- General Line Stop p.28 shows LD/WD, not MD. No Line Stop MD figure is verified;
  keep the qualified text and do not substitute the separate LD/WD crop.
- Original images load only on guide/viewer intent and cache on first use,
  not service-worker installation. Keep offline misses explicit. Never clear
  jobs or change storage identities to refresh figures.
- Firebase uses the existing public shared-job transport for reads only.
  Experimental edits use the IndexedDB database tapcalc-pre-alpha-workspace-v1
  on this device. Revision comparison and mutation share a readwrite transaction.
  Both tapcalcPreAlpha01Workspace and tapcalcPreAlpha01WorkspaceConcurrentV1
  are read-only legacy inputs. Never mirror saves to either older key.
  Web Locks alone do not guarantee fresh localStorage reads in the observed
  WebKit race. See docs/pre-alpha-concurrent-workspace.md for limits.
- Do not call upload, commit or delete against the shared collection. Any future
  experimental cloud writes require a distinct collection and explicit scope.
- Existing live/dev history may be read for import. Never write, clear, rename
  or migrate its storage keys. Imported records and complete operation bundles
  must be preserved independently from the editable experimental copies.
- Prefer complete bundles over selected-operation snapshots when loading jobs.
- Keep new features in this directory. No legacy overlay stack or hidden iframe.
- Equipment-specific calculations that are not implemented must be shown as
  saved values, with an explicit explanation. Do not fall back to Hot Tap math.
- The worker scope is /pre-alpha/; it may only delete tapcalc-pre-alpha- caches.
- Run pre-alpha model and browser tests, then the root full release check before
  publishing. Production Firebase tests must be read-only.

# TapCalc Pre-Alpha Design Study

This directory is a separate, user-authorized redesign experiment. Root/live
and dev remain independent releases. Do not promote this directory onto either.

- Build: pre-alpha16. Keep visible label, module/stylesheet queries, module
  constant, Firebase configuration build marker and worker build synchronized.
- This MCO candidate is local only. Do not upload or publish it. Reviewed15 stays
  separate. MCO follows the established measurement.js calcHotTap formula:
  actual pipe O.D. / 2 + PTC. It is not Rod MCO. Current results are recomputed
  from the saved raw inputs; imported historical result snapshots stay unchanged.
- Measurement help may contain only the reviewed derived descriptions, small
  recreated diagrams and citations approved for this test release. Original
  Technician documents, extracts, renders, workbook data and private audit
  records stay private. Keep the release source-boundary guard in force.
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

# TapCalc Pre-Alpha Design Study

This directory is a separate, user-authorized redesign experiment. Root/live
and dev remain independent releases. Do not promote this directory onto either.

- Build: pre-alpha01. Keep visible label, module/stylesheet queries, module
  constant, Firebase configuration build marker and worker build synchronized.
- Firebase uses the existing public shared-job transport for reads only.
  Experimental edits save to tapcalcPreAlpha01Workspace on this device.
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

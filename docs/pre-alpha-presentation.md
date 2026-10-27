# Pre-Alpha Presentation Scope

This is an unpublished presentation pass on the existing Pre-Alpha 11 candidate.
It is not a release approval or a fix for the separate legacy dev mode-owner bug.

## Value Origins

- Explicit MD linkage and active/inactive overrides use existing state markers.
- Pipe O.D. is labeled as table-derived only when the current calculation uses
  the existing nominal/material dimension table, without an explicit O.D. value.
- Entered/table-selected session labels describe observed UI actions only.
  They are kept in a WeakMap, never added to saved or imported bundles.
- Reloaded values without recorded provenance say Origin unrecorded. Equal
  numbers do not establish table provenance or physical field verification.

## Review And Library

- Optional calculation worksheets show operands in calculation order and reuse
  resultsFor outputs. No formula or engineering table changes are included.
- Active manual worksheets exclude inactive setup operands. The existing
  inactive-input disclosures remain separate and collapsed.
- General completion-plug math remains distinct from equipment-specific
  pipeline and side-outlet training methods. No family is inferred.
- Compact job rows retain the existing job-load button and stable job ID.
  Native sibling details reveal complete operation names and metadata without
  loading the job. Search covers all records before the 30-row display limit.

## Sources

- Every Reference category has a collapsed Source / Revision / Applicability
  disclosure. Unknown document revisions are explicitly unrecorded.
- Only the existing Section 7 Rev.1 and U-Wire form Rev.3 metadata are stated
  as revisions. Existing qualifications and warnings remain visible outside
  the disclosure; source tables and qualifications are not replaced.
- All five manual-index entries remain placeholders, not complete manuals.
- No new private documents, physical-datum diagrams or engineering rules.

## Validation And Release Boundary

New tests: pre-alpha-presentation.mjs and pre-alpha-presentation-ui.mjs.
They cover canonical result parity, immutable bundles, unknown provenance,
search after the first page, escaped markup, keyboard/touch disclosures,
theme contrast, narrow layout, recorded revisions, and reload preservation.
They extend the release reporter without replacing existing assertions.
The new presentation module is included in the isolated worker asset list.

The pending tests/tools-mode-reload-ui.mjs is not part of this commit. The
protected dev fix remains pending. A complete release gate and the separate
publication decision are still required before publishing this candidate.

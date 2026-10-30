# Local HTS-5201 draft worksheet

This is a local, unpublished draft print path beside the generic summary export.
The original private PDF is not included in the repository. Head Assembly commit
2a637ff remains intact.

## Template and field scope

The user-selected original must match the SHA256 pinned in worksheet-draft.mjs.
Only page 5 is rendered; its viewport must be Letter 612 x 792 points.
The source identifier is HTS-5201-SWI Rev1 Pivot Head Line Stop/Plant Series
Fitting. Printed date 08/12/2026 is retained literally, without interpreting its
date convention. The renderer uses the original page as the background and
overlays entries at the supplied top-left point coordinates.

There are 67 labeled editable rectangles. The four unlabeled slots and all
checks/sign-offs are excluded. Left is lead technician; right is second
technician. Matching initial Hot Tap candidates are independently editable.

Dimensional units are confirmed as inches. Only BCO distance, MCO distance,
Rod BCO, Rod MCO and Hot Tap LI have candidate bindings. They use the selected
operation's existing geometry/results and its existing four-decimal display
precision. A reviewer must explicitly confirm applicability before filling.
Unsupported families do not fall back to another operation or formula.

Only explicitly matching client and notes metadata prefill. Generic job number
does not become AX project; job technician does not populate both people.
All other numeric/observation fields start blank and accept independent manual
review entries. Counts and observations are not converted into dimensions.

## Privacy and preservation

The editor receives a click-time clone through an origin/source-checked popup
handoff. It never saves, migrates or uploads the job or template. Template bytes
and their rendered image stay in the editor/print windows; only code assets
are added to the existing pre-alpha cache.

Generic summary Print / Save PDF and PNG export code remains unchanged apart
from the explicit new export dispatch. Calculations, stores, sharing, root/dev
and root launch routing remain unchanged.

Entries that do not fit are reported and printing is blocked. Nothing is
silently truncated. The printable SVG uses fixed page coordinates with an
external same-origin print stylesheet, preserving the strict content policy.
A DRAFT review watermark is always present.

## Current proof and blocker

Passed locally: 32 unit scripts, worksheet editor phone/desktop in Chromium and
WebKit, and generic-export phone/desktop regressions in both engines. Tests cover
distance/rod pairing, selected-operation isolation, unknowns blank, independent
people, missing/invalid inputs, overflow, wrong-template rejection, cancel,
immutable snapshots and unchanged storage.

Synthetic Letter-sized HTML/SVG layout screenshots were rendered and inspected.
They explicitly say they are not the original PDF. They do not certify source
background alignment, header/footer preservation or original-template printing.

The current Library preparation returned a signed transfer. The first helper
transfer failed to download; its one supported scoped retry failed applying
required metadata because Windows Python has no os.setxattr. The final source
PDF path is absent. No untagged temporary bytes or alternate download route
were used. Original page-5 inspection and a native original-background PDF
print/cancel proof remain blocked until supported materialization works.
No PDF output using the original source has been created or certified.

## Remaining operational binding decisions

- Confirm signed-LD representation and the MD/PTC/MT/Start/POP/COP field meanings
  before those receive automatic bindings.
- Confirm applicable Line Stop and Completion Plug mappings, including Total,
  Minus 1 Wall, JBF/LD/PT/LI. Do not infer them from a similar operation.
- Valve measurements, GTF, jack-bolt turns/retracted/set readings and sign-offs
  remain field observations/manual review; they are never invented.

No additional units question is required. Source/background proof, remaining
field semantics and publication approval are separate gates.

## Worksheet deferred by user on 2026-10-30

The user shelved the autofilled HTS-5201 worksheet until after launch. Its entry and initialization are excluded from the current launch candidate; implementation, mapping and original tests are retained for later clarification. No private PDF selection, alignment or print work is pending for this launch scope. Historical worksheet gate/status notes above remain historical evidence, not current launch requirements. Generic job Print / Save PDF and Download PNG, all operation/data/math behavior and Head Assembly remain in scope unchanged. Strict root/child upgrade, rollback, offline, page-error, full Linux release and physical-iPhone gates remain required; shelving does not resolve CI88 or waive any unrelated failure. No publication is authorized.

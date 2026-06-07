# SmartStop Source Map

Dev-only source map for `2316_001.pdf`, a 104-page scan-only TEAM SmartStop Training packet.

The packet is mapped here so TapCalc can stage SmartStop reference content without exposing unverified scanned chart values as field-ready lookup data.

## Page Map

| Pages | Section | App fit | Status |
| --- | --- | --- | --- |
| 1-2 | Cover / table of contents | Source identification | Mapped |
| 4-18 | Introduction / nomenclature | Training context and component labels | Mapped |
| 20-44 | Set-Up | Procedure reference candidate | Mapped |
| 46-66 | Break-Down | Procedure reference candidate | Mapped |
| 68-78 | Field Execution | Field guide candidate | Mapped |
| 80-92 | Case studies | Background only | Mapped |
| 93 | SmartStop Experience Matrix | Optional compact matrix | Candidate |
| 95-103 | Stopping information | Highest-value lookup candidate | Extract next |

## Candidate Lookups

| Candidate | Pages | Needed fields | Status |
| --- | --- | --- | --- |
| SmartStop suffix charts | 96-101 | Size, wall range, pipe I.D. range, shims, nose ring, seal, retaining ring, foot pad, nose pad | Verified in dev |
| Seal-ring torque | 102 | Torque table values after crop/OCR and manual verification | Verified in dev |
| Stack-up drawings | 95-103 | Drawing/page index before dimensional lookup | Index first |
| Experience matrix | 93 | Kit/deployment summary if useful for field planning | Optional |

## Extraction Pass - 2026-06-06

- Pages 96-101 were visually transcribed into the dev SmartStop reference overlay as staged suffix-chart lookup data.
- Page 102 was visually transcribed into the dev SmartStop reference overlay as a staged seal-ring torque table.
- Source page 97 row `-03` and source page 100 row `-03` have wall ranges that appear to overlap adjacent rows. The dev data preserves the scanned values and flags the source notes.
- The staged lookup should remain dev-only until a second verification pass compares every row against the scan crops.

## Verification Pass - 2026-06-07

- Pages 96-101 were second-pass checked against enlarged rotated scan crops in `reference_audit/smartstop_extract_96_102/crops`.
- Page 102 seal-ring torque values were second-pass checked against `p102_torque_crop_x3.png`.
- The staged dev suffix rows matched the scan crops for SmartStop sizes 4, 6, 8, 10, 12, and 16.
- The staged dev torque table matched the scan crop. In-lb values remain blank where the source table did not print them.
- Source page 97 row `-03` and source page 100 row `-03` still appear to overlap neighboring wall ranges in the source. The app preserves the scanned values and keeps visible source notes.
- After this pass, the dev Reference lookup can be treated as verified dev reference data. It is still not promoted as a workflow calculator or live operational helper.

## Extraction Rules

- Confirm PDF page number against printed page label before entering values.
- Crop and OCR chart pages, then manually compare against the scan.
- Keep source page and row notes beside every transcribed value.
- Double-check wall range, pipe I.D. range, and kit component codes before exposing a lookup.
- Do not wire SmartStop job helpers until the lookup table is traceable back to source pages.

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
| SmartStop suffix charts | 96-101 | Size, wall range, pipe I.D. range, shims, nose ring, seal, retaining ring, foot pad, nose pad | Pending extraction |
| Seal-ring torque | 102 | Torque table values after crop/OCR and manual verification | Pending verification |
| Stack-up drawings | 95-103 | Drawing/page index before dimensional lookup | Index first |
| Experience matrix | 93 | Kit/deployment summary if useful for field planning | Optional |

## Extraction Rules

- Confirm PDF page number against printed page label before entering values.
- Crop and OCR chart pages, then manually compare against the scan.
- Keep source page and row notes beside every transcribed value.
- Double-check wall range, pipe I.D. range, and kit component codes before exposing a lookup.
- Do not wire SmartStop job helpers until the lookup table is traceable back to source pages.

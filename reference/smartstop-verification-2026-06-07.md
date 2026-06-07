# SmartStop Verification - 2026-06-07

Second-pass verification for the dev SmartStop suffix and seal-ring torque lookup from `2316_001.pdf`.

## Source Crops

Verified against enlarged rotated crops outside the repo:

- `reference_audit/smartstop_extract_96_102/crops/p096_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p097_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p098_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p099_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p100_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p101_chart_crop_x3.png`
- `reference_audit/smartstop_extract_96_102/crops/p102_torque_crop_x3.png`

## Result

| Source page | Printed page | Content | Verification result |
| --- | --- | --- | --- |
| 96 | 29 | 4 inch suffix chart | Matched dev lookup |
| 97 | 30 | 6 inch suffix chart | Matched dev lookup; row `-03` source wall range overlaps adjacent row |
| 98 | 31 | 8 inch suffix chart | Matched dev lookup |
| 99 | 32 | 10 inch suffix chart | Matched dev lookup |
| 100 | 33 | 12 inch suffix chart | Matched dev lookup; row `-03` source wall range overlaps adjacent row |
| 101 | 34 | 16 inch suffix chart | Matched dev lookup |
| 102 | 35 | Seal-ring torque table | Matched dev lookup |

## Notes

- The dev lookup preserves the scanned source values rather than normalizing overlapping source ranges.
- In-lb torque values are shown only where printed in the source table.
- This verification supports dev Reference use. A workflow helper or live promotion should still get a final field review.

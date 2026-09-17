# Cutter reference promotion

Livefix21 and dev alpha265 add an inline Reference > Cutter Sizes lookup.
Only this reference feature is promoted; workflow and actual-POP dev changes
remain dev-only. Existing local job storage and cloud sync are unchanged.

Standard chart: original TEAM HTS rows plus verified 22/26/28 entries from
Furmanite/IPSCO printed page 25. See cutter-supplement-22-26-28.md.

Separate FloStop II / IP-412 carbide cutter choices use printed pages 33
(Hot Tap) and 34 (Line Stop) of the manufacturer catalog:
https://www.scribd.com/document/520123832/Ipsco-oem-Catalog-Sm

| Nominal inches | FloStop Hot Tap OD | FloStop Line Stop OD |
| --- | --- | --- |
| 4 | 3.438 | 3.8 |
| 6 | 5.468 | 5.8 |
| 8 | 7.312 | 7.9 |
| 10 | 9.5 | 9.8 |
| 12 | 11.5 | 11.8 |

Printed precision is retained. These equipment-specific entries must not be
substituted for the standard chart. Missing sizes show Not listed, with no
interpolation. The result displays the family, source page and part number.
The lookup never changes job measurements or calculator inputs.

Release coverage includes exact chart parity, all 10 FloStop entries,
unsupported FloStop sizes, light/dark phone lookups in live and dev, and the
existing Library load/sync safeguards. Full release checks are required.

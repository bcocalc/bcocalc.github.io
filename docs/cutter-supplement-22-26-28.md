# Supplemental cutter reference

The original TEAM chart omits these sizes. Six additions are transcribed from
the Furmanite/IPSCO OEM catalog, printed page 25, IP-914 carbide cutter table:
https://www.scribd.com/document/520123832/Ipsco-oem-Catalog-Sm

| Nominal size (in) | Hot Tap OD (in) | Line Stop OD (in) |
| --- | --- | --- |
| 22 | 19.000 | 21.000 |
| 26 | 23.000 | 25.000 |
| 28 | 25.000 | 27.000 |

Catalog part families: HTC-22/26/28-CR-91 and LSC-22/26/28-CR-91.
These are catalog values, not interpolations or pipe OD values.
Hot Tap values also agree with the Enerpac MHT1236-H table, PDF page 10:
https://assets.partbase.com/supplier-docs/enerpac/MHT-H%20Issue%207.pdf

Existing TEAM rows remain unchanged. The UI identifies the supplemental source
and requires equipment/fitting compatibility confirmation. This remains a
read-only lookup: it does not modify BCO, ETA, RPM or job measurements.
Promoted with the cutter reference in livefix21 and dev alpha265. See
cutters-livefix21.md for the separate FloStop charts and release scope.

# Alpha252 Cutter Size Reference

Dev-only addition. Root/live remains livefix19, including the phone-confirmed
Library and sync fix. No Firebase rules, storage keys, or publishing changes.

## Source

- User-supplied `Technician.zip`.
- Entry: `Technician/Technician Information Book/Section 6 Cutters and BCO.pdf`.
- PDF page 2, printed page 8-B-1: TEAM HTS Cutter Chart, dated 2016-01-15.
- PDF SHA256: `D91060EDC91FB5657C0EC829E19620657FAD644140082B70141A8568FB68E99F`.
- The scanned page was rendered and visually checked. No raw PDF or images are
  added to the deployed site.

## Scope

The new Cutter Sizes menu item uses the existing Reference router and search.
It shows one operation and nominal pipe size at a time, with a collapsed full
chart. There are 14 Standard Hot Tap rows and 13 Line Stop rows. The source's
three-decimal values are preserved, not converted into invented exact fractions.
Notably, 3-inch and 4-inch Hot Tap both print 2.438; the UI calls that out rather
than silently substituting a different size.

Unlisted sizes show no result, never an interpolated or nearest match. HSS II,
Short Stop, HTP, folding-head and other special configurations are not treated as
standard cutters. The lookup is read-only and does not set BCO or job inputs.
The dated chart is a reference, not a current equipment approval; users must
confirm actual equipment and job requirements.

## Verification

The full release command passed locally on 2026-09-05, including root/dev
Library opening and syncing, and dev phone/desktop checks in Chromium and
WebKit. Dark/light phone screenshots were inspected. JavaScript syntax and all
36 dev cache asset paths passed checks. A real-device review remains appropriate
before promoting these dev features to live.

`tests/cutter-reference.mjs` compares all 27 rows against the supplied chart.
`tests/dev-features.mjs` checks type switching, retained pipe selection, unsupported
sizes, chart expansion/collapse, mobile width, and unchanged job cutter inputs in
light/dark themes using Chromium and WebKit. The full existing Library/sync and
workflow checks remain required through `node tests/release-check.mjs`.

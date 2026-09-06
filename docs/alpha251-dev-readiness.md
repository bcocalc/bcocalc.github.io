# Alpha251 Dev Readiness Pass

Live remains livefix19. This pass resumes the pending dev workflow, SmartStop,
and folding-head work; it does not promote those features to root/live.

## Changes

- Fixed signed mixed-fraction parsing in the folding-head helper. `-1 1/2` now
  parses as -1.5 rather than -0.5, and `-0 1/2` parses as -0.5 rather than +0.5.
  The set-point formula, source tables, and equipment ratings are unchanged.
- Simplified hidden-panel state in the existing dev Reference router and workflow
  browse helper. Inactive panels remain `display:none`, hidden, and
  non-interactive; they no longer set
  inherited `visibility:hidden`. WebKit had retained hidden child controls while
  reporting their containing panel as active and visible. No new router added.
- Added current feature checks using the isolated fake database, rather than
  reviving the archived alpha248 test's obsolete transport assumptions.
- Added these tests to the local release command and GitHub safeguard. Publishing
  settings are unchanged, as requested.

## Checks

The full release command passed locally on 2026-09-05: protected Library checks
for root/live and dev, plus current dev features in Chromium and WebKit on both
phone-touch and desktop-mouse layouts. Changed JavaScript syntax and all 34 dev
service-worker asset paths also passed checks. Root/live application files are
unchanged.

Run `node tests/release-check.mjs` for the protected Library/Sync baseline plus:

- Phone-touch and desktop-mouse screen navigation in Chromium and WebKit.
- Light/dark Reference panel isolation and no page-wide horizontal overflow.
- SmartStop size, no-match filter, and Clear controls.
- Folding-head line-size selection, displayed formula results, signed fraction
  entry, and clearing stale outputs.
- Blank workflow Next/Back without completing calculation fields, with inactive
  helper panels kept hidden and non-interactive.
- Adding Line Stop and Completion operations, switching between them, and
  retaining distinct measurement values.
- Twenty parser cases, including signed decimals/fractions and invalid input.

These checks use synthetic jobs only and do not write to production Firebase.
They are not equipment certification or a new verification of the scanned source
tables. A real-phone check of alpha251 remains necessary before promotion.

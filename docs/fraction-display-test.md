# Fractional result display

Based on public main `ffacd8f8cf48cfc9c442f5e652394af79f123809`.

Calculated inch results retain their existing four-decimal value and add a
reduced fraction rounded to the nearest 1/16 inch. For example,
`17.3438 in (≈ 17 3/8 in)`. Exact sixteenths omit the approximation marker.
Halfway values round away from zero. Carries become whole inches; rounded zero
does not acquire a negative sign. Non-finite values remain unavailable.

The display is shared by primary/secondary results, Review, calculation
worksheet totals and calculated operands, BCO/ETA distance, complete-job
exports, and calculated reference-helper dimensions. Input fields, original
saved snapshots, static reference tables, RPM, time and feed rate are unchanged.
The existing positive sub-resolution Folding Head warning is preserved.

No calculator formula, parsing rule, job identity, stored numeric/raw value,
production data, root/live application, or dev application is modified. The
Pre-Alpha worker uses a new `-fractions1` cache suffix and includes the formatter.
Previous frozen-source guards remain in force through an exact reversible
fraction-scope guard layered before the existing actual-POP scope guard.

## Validation

Passed in the isolated public-source snapshot: 64,001 fractional rounding
cases; model aggregate; actual POP; presentation; exports; inline ETA;
reference helpers; Folding Head dimensions; release identity; family, LD, MCO
and Rod MCO regressions; JavaScript syntax and patch whitespace checks.

The candidate passed targeted checks in the supported cloud Chromium preview,
using only a synthetic local job and a fixture CSP blocking production backend
connections. Verified live result updates, exact and rounded sixteenths, halfway
rounding, whole-inch carry, negatives, invalid/empty inputs, actual POP apply and
reset, Review/worksheet results, both themes, and preservation of exact raw
entries on reload. Responsive frames at 320, 390 and 430 pixels showed no
horizontal overflow in the results or expanded Review worksheets; these are
narrow Chromium frames, not physical-phone or touch-emulation certification.

Offline reload and editing passed after stopping the preview server. The
existing worker reopened the job, changed raw MD to `11.375`, displayed
`18.3750 in (18 3/8 in)`, and retained both after reload. An uncached page failed
with connection refused as the independent server-offline control.

The separate automated Chromium/WebKit test has not run here: bundled
Playwright engines are absent, and installed local Chromium fails with
`socket() Operation not permitted`, including the approved execution retry.
The provided test covers upgrade from current live, phone touch and desktop
click, repeated/invalid inputs, carry, actual POP, Review/worksheets, light/dark,
320/390/430 widths, offline reload/edit/restart, and unchanged original/raw
values with synthetic data only. GitHub CI fetches its immutable current-live
baseline in all jobs and retains fraction screenshots on failure.

The full release check was attempted and stopped at an absent legacy overlay
in this partial snapshot. Complete repository history is also required for
the source-boundary tests. Run the full `node tests/release-check.mjs` in the
complete checkout before release. Do not remove or bypass failed checks.

CI run 108 passed the complete unit/contract/sync job and both Chromium and
WebKit component jobs, including the fraction upgrade/offline test. The final
aggregate exposed a Folding Head boundary assertion that omitted the rounded
marker for decimal arithmetic slightly above an exact sixteenth. Its exact
expected labels are corrected and a pure regression test verifies unchanged
raw results and the unavailable backing-ring guard. The full aggregate must
pass on the corrected commit before release.

The candidate is published only on the separate test branch and draft PR #1.
It is not merged or deployed; the live app remains unchanged. Deployment still
requires the user's approval after the remaining release gates pass.

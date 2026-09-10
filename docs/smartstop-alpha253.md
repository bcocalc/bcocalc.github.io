# SmartStop Alpha253

Dev-only release, 2026-09-10. Live remains livefix19 until promotion approval.

- Compact topic dropdown: Suffix & Parts, Seal Ring Torque, Source & Limits.
- Six nominal sizes, 55 source suffix rows; individually expandable parts.
- Optional known-suffix, wall and pipe-ID filters. Both measurements must match.
- Invalid decimal inputs show an error instead of an unfiltered result.
- Overlapping source ranges remain visible as multiple matches, never an automatic kit selection.
- Screw-size torque lookup preserves blank in-lb cells as "not printed".
- Read-only reference: does not populate job measurements or select equipment.

Source: supplied TEAM SmartStop Training packet, 2316_001.pdf, PDF pages
96-102 (printed 29-35). The data is unchanged from the previously transcribed
charts; the unit test freezes that dataset, including source overlaps.
Pressure annotations are not approval of an entire assembly or job.
Setup/breakdown procedures and dimensional stack-ups are outside this release.

Release verification: run tests/release-check.mjs, including isolated Chromium
and WebKit phone/desktop tests in both themes. Tests must not write real shared jobs.

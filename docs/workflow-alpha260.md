# Guided Workflow Restored

At the user's request, dev alpha260 restores the pre-application-first workflow
presentation from alpha253: colored step cards, original Job Setup, and guided
Back / Next navigation. The application-first header, overview, and extra
dropdowns introduced in alpha254-alpha259 are removed, not hidden by a new router.

The rollback is limited to the existing workflow browse JS/CSS owner. Reference,
SmartStop, Load Job, multi-operation storage, and protected Library/sync fixes
remain current. The application-type preservation fix stays in measurement.js,
so navigating to Hot Tap does not rename a Line Stop application. Step browsing
remains unlocked and automatic workflow scrolling remains suppressed.

Tests cover the original Job Setup fields, blank Back / Next, three separate
Line Stops with individual Hot Tap and Line Stop values, a Completion Plug,
operation switching, and visible step cards in both phone themes. Re-Stop and
actual field POP/COP adjustments remain deferred. No live files are promoted.

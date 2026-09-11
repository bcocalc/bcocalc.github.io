# Application Sequences

Dev alpha258 restores named, freely accessible stages within each application.
Line Stop follows Pipe / Cutter, Hot Tap, Line Stop, Completion Plug, Review.
Completion Plug can be skipped when not needed. Hot Tap applications keep their
shorter path. Standalone Completion Plug applications retain their existing path.
Viewing a different sheet no longer changes the application type or automatic
application name. Existing measurement fields and saved operation bundles remain
the data owners. No calculation formulas or live files changed.

Alpha259 gives the Next button more width on narrow phones and adds an overflow
assertion for its longer stage labels.

## Deferred Re-Stop Work

User-confirmed requirements: no cutter and no Hot Tap. Connect the machine to the
existing plug, record the measurement while connected, retrieve the plug, set the
Line Stop, and reinstall the same plug when finished. This is not implemented in
alpha258 or alpha259. Do not reuse the normal plug-installation start field or
equations for the connected measurement without confirming the reference and math.

Actual field POP/COP adjustment also remains separate future work; preserve
original setup measurements rather than silently overwriting them.

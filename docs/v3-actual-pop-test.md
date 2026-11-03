# V3 Hot Tap actual POP — isolated test branch

This change applies only to operations whose type is Hot Tap. Calculated POP remains visible. Entering an actual reading does not change results until Apply actual POP is pressed. Use calculated POP deactivates the adjustment without deleting the typed reading. An applied reading persists until reset, including across downstream input edits and offline restarts. Imported legacy htActualPop and htFieldBasis remain unchanged and inactive.

Applied formulas, verified against the established standard Hot Tap relationships:

- Effective LI = actual POP - Rod start
- COP = actual POP + PTC
- Rod BCO = COP + geometry BCO
- Total travel = effective LI + PTC + geometry BCO
- Rod MCO = actual POP + actual pipe O.D. / 2 + PTC
- MCO travel, geometry BCO, ETA and other operation modes retain their existing formulas.

Review, calculation worksheet and complete-job exports identify the applied actual reading and retain the setup calculation. Raw setup, original imported snapshots, other operations, legacy storage keys and live/dev source files remain intact. Invalid drafts cannot replace a previously applied reading. Numeric parsing retains existing signed and fractional conventions; negative lower-in remains explicitly warned.

The build-26 patch uses a separate child-worker cache suffix `-actual-pop1`, preventing existing build-26 offline modules from being reused. Root launch identity and live manifest are unchanged. The dedicated regression installs the exact public 2972089 baseline in a disposable localhost browser profile, upgrades its worker, and checks persistence before and after offline edits, reload and disk-backed restart. Phone tests use touch; Chromium and WebKit run separately. This tests browser installed-worker behavior, not a physical iPhone installation.

No deployment is authorized. The `test/v3-actual-pop` branch is only for test CI. The source-scope guard reversibly validates this exact addition before running the existing frozen-source checks; it preserves the prior boundary and exact hashes outside this change.

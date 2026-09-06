# TapCalc Release Rules

- Keep new feature work in `dev/`. Do not promote it to root/live without the
  user's approval. `dev-live/` and old alpha overlays are not release sources.
- The user confirmed the iPhone Library fix in livefix19 / alpha250 on
  2026-09-05 (commit db46e63). Preserve stable recent-card nodes, guarded touch
  handling, idempotent refreshes, and the bounded create-only sync transport.
- Read `docs/dev-to-live.md` before promoting dev or replacing Library, sync,
  shell, or service-worker files. Never blindly copy the entire dev directory
  onto root; preserve the live channel/configuration and update build versions.
- Run `node tests/release-check.mjs` before any release. A failing check means
  stop and fix the regression, not skip, weaken, or delete the check.
- Local jobs and operation bundles must remain intact. Never clear browser
  storage or use real shared-job writes as test fixtures. Use the isolated
  localhost preview and network-free VM tests.
- Do not stack more screen routers or touch-capture overlays onto a regression.
  Find the existing owner and fix it. Test touch, not only a narrow mouse viewport.
- GitHub's Library safeguard is a test workflow, not a deployment lock. Until
  branch protection or a gated Pages workflow is explicitly configured, direct
  pushes to main still publish; run the full local release check first.

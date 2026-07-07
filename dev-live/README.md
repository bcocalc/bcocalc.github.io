# TapCalc Dev-Live

This folder is a live-like staging lane for GitHub Pages.

- Public path after deployment: `https://bcocalc.github.io/dev-live/`
- Purpose: test live-baseline fixes without changing the root live app or the existing `/dev/` app.
- Baseline: copied from root `3.0.0-livefix14` and relabeled as `3.0.0-devlive3`.
- Static reference PDFs are intentionally shared from the root `../reference/stackups/` folder to avoid another large duplicate tree.
- This lane has its own `service-worker.js` and cache name scoped to `/dev-live/`.

## Static Smoke Check

Run against a local static server:

```powershell
& "C:\Users\antho\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\dev-live\smoke-check.mjs --base http://127.0.0.1:8765/dev-live/
```

Run against GitHub Pages after pushing:

```powershell
& "C:\Users\antho\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\dev-live\smoke-check.mjs --base https://bcocalc.github.io/dev-live/
```

## Mobile Browser Smoke Check

Run against a local static server:

```powershell
& "C:\Users\antho\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\dev-live\mobile-smoke.mjs --base http://127.0.0.1:8765/dev-live/
```

Run against GitHub Pages after pushing:

```powershell
& "C:\Users\antho\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\dev-live\mobile-smoke.mjs --base https://bcocalc.github.io/dev-live/
```

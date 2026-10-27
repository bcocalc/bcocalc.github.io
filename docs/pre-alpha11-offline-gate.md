# Pre-Alpha 11 offline gate follow-up

Prepared locally on 2026-10-26, America/Chicago. No push, CI dispatch, merge,
publication, production-data access, security change or app-source edit is part
of this follow-up. The application remains byte-identical to local commit
`7b01c6f3ef1d0d1a6e128dc86eb34c7325b67498` (application/test baseline from the
previous CI preparation, with its later report-only commit).

## Diagnosis

1. Pinned Playwright 1.62.1 fails the no-TapCalc literal-response offline control.
   Official [issue 42775](https://github.com/microsoft/playwright/issues/42775)
   and [fix 42894](https://github.com/microsoft/playwright/pull/42894) describe
   this offline-emulation defect. The fix is in the 1.64 release line.
2. The isolated published Playwright 1.64.0 package, with its matching browsers,
   passes the unchanged offline control on this Windows host. The bundled 1.62.1
   runtime remains installed and unmodified; its failure logs remain retained.
3. Cache loss was independently reproduced without TapCalc or any worker:
   ephemeral WebKit loses fetched and synthetic Cache API responses on reload.
   A fresh persistent profile retains both across reload and process restart.
   The ephemeral diagnostic still fails and is not reported as a pass.
4. PWA durability now uses new, synthetic disk-backed profiles, never a user's
   profile. Every prior cache/save assertion remains. Added checks require a
   failed uncached navigation outside the worker while offline, navigator.onLine
   false, and saved measurements surviving an offline browser-process restart.
   This does not certify ephemeral/private browsing or physical iPhone Safari.

Only test infrastructure and documentation changed: runtime pin to 1.64.0,
positive independent cache/offline controls, persistent PWA fixture, and a
360-second collection cap for the expanded Pre-Alpha UI suite. Its five fresh
reference contexts per viewport, locator timeouts and all assertions remain;
other scripts retain their 180-second cap. No sleeps or retry-to-pass were added.

The first 1.64 aggregate exposed a dialog-test completion race: native closed
state and restored focus can both precede the queued `close` event. A minimal
no-app probe reproduced this in both engines. The ETA helper now awaits the
actual close event before its unchanged focus assertion or the next interaction.
Failure-only focus diagnostics are retained. The original failed aggregate is
saved as `release-164-focus-failed.log`; it is not relabeled as a pass.

## Exact verification

Targeted installed-worker tests pass on Chromium and WebKit, phone and desktop:
10-to-11 upgrade; offline reload/edit; offline process restart; Home and inline
References; original/legacy/companion preservation; live/dev cache sentinels;
rollback to 10 and re-upgrade to 11. Rollback intentionally shows legacy values,
not companion-only edits. Re-upgrade restores the complete newer bundle.

The final full aggregate is run **after the local follow-up commit**. Its exact
commit, runtime, command, exit status and log are retained outside the Git tree
in `_home_saves_validation/offline-gate-final-receipt.json` and
`_home_saves_validation/release-164-final.log`. That receipt, not this planned
command, determines whether the full aggregate passed.

Reproduction in this workspace:

```powershell
$env:CI = 'true'
$env:NODE_PATH = 'C:\Users\antho\Documents\Codex\2026-04-18-if-i-send-you-my-files\_qa_playwright_164\node_modules'
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\Users\antho\Documents\Codex\2026-04-18-if-i-send-you-my-files\_qa_playwright_164\browsers'
node tests/release-check.mjs
```

The isolated package is Playwright 1.64.0, WebKit 27.2/revision 2370 and Chromium
156.0.8078.4/revision 1248. Local profiles, browser caches, screenshots and jobs
are synthetic. No Firebase writes are used.

## Remaining checks and publication boundary

- CI run 40439139180 remains a historical failure on the old runner; it has not
  been rerun or relabeled. Updated Linux CI has not run for this follow-up.
- The exact next external action, requiring separate approval, would be pushing
  `codex/home-safer-saves-local` to the same test branch so Library safeguard runs
  with the new pin and controls. This is not authorized by this follow-up prompt.
- A full local pass can support a separately approved Pre-Alpha-only phone trial.
  It does not approve publication or replace actual-device signoff. Root/live
  replacement remains on hold for the unrelated parity/engineering/security gates
  listed in `pre-alpha11-local-validation.md`.

## Smallest iPhone check

After an explicitly approved Pre-Alpha 11 trial is available, use normal Safari
and a new synthetic job named `OFFLINE CHECK`; do not edit real jobs or clear any
website data. Keep tabs with unsaved real work open.

1. Verify the URL is `/pre-alpha/` and the header says 11. Add two operations;
   set distinct Completion Plug manual lower-in values, such as 77 and 88.
   Leave the second operation on Completion Plug. Wait for `Saved on this device`
   and reload once online to confirm both values and the selected step.
2. Turn off cellular and Wi-Fi (Airplane Mode can leave Wi-Fi on). Reload the
   same Pre-Alpha URL. Home/Resume should recover operation 2, its step and 88.
3. Change 88 to 89, wait for the saved label, then close only this synthetic tab
   and reopen the same Pre-Alpha URL while still offline. Verify 77 and 89, the
   selected operation and step, and the inline glossary.
4. Restore connectivity and reload. Verify the values remain. Record iPhone/iOS
   version, build and result; if a step fails, keep the data and capture the error.

Physical Safari upgrade/rollback and installed Home Screen behavior are separate
unrun checks, not implied by the four-step tab test or desktop WebKit results.

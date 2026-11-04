# Android Device Testing & Release Checklist

Use this checklist with the Phase 2 debug APK from GitHub Actions. This is a manual checklist; CI success does not replace real-device testing.

## Install the debug APK
1. Open the successful workflow run and download its APK artifact: https://github.com/iftikharjutt/ChatterNoor/actions/runs/41674319267
2. Extract the APK from the downloaded artifact ZIP.
3. Transfer it to the Android phone, open it, and allow installation from that source if Android asks.
4. If Android reports a signature conflict with an older build, uninstall the older app first (this removes app data).

## Smoke test
- [ ] App opens without a blank screen or crash.
- [ ] Canvas/NOOR character renders and animates.
- [ ] Settings open, close, and persist after restart.
- [ ] Chat request succeeds with a valid Gemini API key; invalid key shows a useful error.
- [ ] API key is not retained after the app/session is closed.
- [ ] Clear Chat removes visible messages and any opted-in saved history.
- [ ] Remember chats is OFF by default.
- [ ] Turn Remember chats ON, send a few messages, restart, and confirm history restores.
- [ ] Turn Remember chats OFF and verify saved history is removed/disabled as designed.

## Voice test
- [ ] Grant microphone permission only when prompted/needed.
- [ ] Urdu (Pakistan) speech recognition works or reports provider/device limitation clearly.
- [ ] English (Australia) and English (US) recognition settings work.
- [ ] TTS speaks in the selected/preferred language when a matching voice is installed.
- [ ] Manual voice selection still works.
- [ ] Denying microphone permission does not crash the app.

## Game test
- [ ] Generate/open a game.
- [ ] Test taps and touch controls (not keyboard-only).
- [ ] Test portrait and landscape where applicable.
- [ ] Check small-screen layout, buttons, and scrolling.
- [ ] Confirm game iframe cannot navigate the app to an arbitrary external page.

## Privacy/security checks
- [ ] Verify no API key appears in persistent app/browser storage.
- [ ] Verify the app does not request unrelated Android permissions.
- [ ] Verify links outside the app open only according to intended policy.
- [ ] Review privacy notice before public release.

## Play Store release blockers
- [ ] Publisher supplies public privacy-policy URL and contact email.
- [ ] Publisher supplies AdMob App ID and ad-unit IDs (only if ads are being integrated).
- [ ] Add Google Mobile Ads SDK and UMP consent flow; use test ad IDs during development.
- [ ] Configure a private production keystore and GitHub Actions secrets; never commit keystore/passwords.
- [ ] Build and test a signed Android App Bundle (AAB), not only a debug APK.
- [ ] Complete Play Console Data safety, ads declaration, target audience, content rating, and app access forms.
- [ ] Test release build on a physical device before rollout.

**Status:** CI APK build/signature checks passed. Physical-device tests, AdMob integration, production signing, and Play Store submission are not yet completed.

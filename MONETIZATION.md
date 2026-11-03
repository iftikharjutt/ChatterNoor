# ChatterNoor Monetization Setup

## Current status
No AdMob SDK, app ID, banner unit, interstitial unit, rewarded unit, or advertising request is active in this development build.

## Before enabling ads
1. Create the Android app in the publisher's Google AdMob account and obtain real app/ad unit IDs.
2. Integrate the official Google Mobile Ads Android SDK through a maintained Gradle-based Android build. The current project uses a manual Android packaging script, so adding the SDK requires a deliberate build-system upgrade.
3. Use Google's test ad unit IDs during development. Never click live ads while testing.
4. Add a consent flow where required, including applicable Google UMP consent requirements.
5. Update the privacy policy and Google Play Data safety disclosures.
6. Prefer a non-intrusive banner on the main screen; show interstitials only at natural breaks, never at app launch or during gameplay. Rewarded ads must be opt-in.
7. Test that ads never cover game controls, microphone, chat input, or privacy controls.

Keep real IDs out of source control until implementation. Future build-time values: ADMOB_ANDROID_APP_ID, ADMOB_BANNER_UNIT_ID, ADMOB_INTERSTITIAL_UNIT_ID, ADMOB_REWARDED_UNIT_ID.

## Release checklist
- [ ] Implement SDK and test IDs.
- [ ] Complete consent and Play Console disclosures.
- [ ] Verify ad placement and frequency on a physical Android device.

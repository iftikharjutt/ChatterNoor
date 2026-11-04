# ChatterNoor Privacy Notice

Last updated: 4 November 2026

## What ChatterNoor does
ChatterNoor is an AI companion and HTML5 mini-game interface. The default Noor AI mode sends messages to the publisher-managed backend. An optional bring-your-own-key (BYOK) mode lets a user provide their own Gemini API key.

## Information sent to Google
In default Noor AI mode, the app sends the message, configured system prompt, a short recent-chat context, and a random app device identifier to the publisher's backend. The backend forwards the prompt to Google Gemini using the publisher's server-side key and enforces daily request limits. In BYOK mode, the app sends the prompt directly to Google using the user's own key. Google processes requests under its own terms and privacy policy. Do not submit passwords, payment details, or other sensitive information.

## Local chat memory
Chat memory is off by default. If you enable “Remember chats on this device”, the latest 40 user and assistant text messages are stored in browser local storage on that device and used as context for later requests. Use Clear Chat to erase the saved conversation, or turn the setting off to stop future saving and remove the saved history. Clearing app/browser storage also removes it.

## API key
The publisher's Gemini key is stored only in the backend hosting provider's environment secrets and is never sent to the app. A user's optional BYOK key is kept in session storage or the current settings field, not included in saved chat history or persistent settings. A key entered on a device is visible to that device's owner and is not a production secret.

## Voice
Microphone speech recognition is optional and starts only after you tap the microphone. Depending on the Android device, browser and speech service, audio or recognized text may be processed by the device or a third-party speech provider. Spoken replies use device/browser speech synthesis voices.

## Games
Generated games run in a sandboxed iframe. Do not enter sensitive information into generated games.

## Advertising and analytics
This development build does not currently include an AdMob SDK, advertising identifiers, or an analytics SDK. Advertising will only be added after a separate implementation and disclosure update.

## Contact
Before public release, add the publisher's support email and a public privacy-policy URL. This template needs a final legal review.
\n## Daily usage limits\nDefault Noor AI mode starts with five requests per device ID per UTC day and a global server limit configured by the publisher. The anonymous device ID can be reset by clearing app data or reinstalling. Strong account-based limits require authentication and platform attestation before public launch.\n
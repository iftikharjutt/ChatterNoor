# ChatterNoor Privacy Notice

Last updated: 4 November 2026

## What ChatterNoor does
ChatterNoor is an AI companion and HTML5 mini-game interface. You provide your own Google Gemini API key and choose when to send a message.

## Information sent to Google
When you send a chat message, the app sends that message, the configured system prompt, and up to the six most recent in-memory conversation entries to Google Gemini using your API key. Google processes the request under its own terms and privacy policy. Do not submit passwords, payment details, or other sensitive information.

## Local chat memory
Chat memory is off by default. If you enable “Remember chats on this device”, the latest 40 user and assistant text messages are stored in browser local storage on that device and used as context for later requests. Use Clear Chat to erase the saved conversation, or turn the setting off to stop future saving and remove the saved history. Clearing app/browser storage also removes it.

## API key
The API key is used to call Google Gemini. It is kept in session storage or the current settings field, not included in saved chat history or persistent settings. A key used in a client-side app is not a production secret and may be accessible to a determined user of the device. Restrict the key and monitor usage.

## Voice
Microphone speech recognition is optional and starts only after you tap the microphone. Depending on the Android device, browser and speech service, audio or recognized text may be processed by the device or a third-party speech provider. Spoken replies use device/browser speech synthesis voices.

## Games
Generated games run in a sandboxed iframe. Do not enter sensitive information into generated games.

## Advertising and analytics
This development build does not currently include an AdMob SDK, advertising identifiers, or an analytics SDK. Advertising will only be added after a separate implementation and disclosure update.

## Contact
Before public release, add the publisher's support email and a public privacy-policy URL. This template needs a final legal review.

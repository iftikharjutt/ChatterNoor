# ChatterNoor AI backend

This is the owner-managed Gemini proxy. The app sends messages to this server; the Gemini key remains in the hosting provider's environment secrets.

## Deploy
1. Create a PostgreSQL database and a Node.js 20+ service.
2. Deploy this folder as the service root (or configure the host to use `server/`).
3. Set `DATABASE_URL`, `GEMINI_API_KEY`, `DAILY_USER_LIMIT=5`, `DAILY_GLOBAL_LIMIT=400`, and `ALLOWED_ORIGINS` in the host's secret/environment settings.
4. Set the app's Noor AI Server Address in Grown-up Settings to the deployed HTTPS origin.
5. Check `/health` and `/api/status`.

Never commit a real API key or paste it into ChatGPT/GitHub source. The sample env file is only a template.

## Limits and caveats
- Five requests per device ID per UTC day and 400 total requests per UTC day are enforced server-side.
- A device ID stored by the app is a lightweight anonymous identifier, not strong identity. Users can clear app data or reinstall to reset it. Before a public child-directed launch, add Firebase Authentication plus Firebase App Check or Play Integrity and enforce quotas against authenticated accounts.
- The daily reservation is charged before calling Gemini, so failed upstream calls can consume a credit.
- BYOK remains a separate direct-to-Google option. A key entered on a device is visible to that device's owner and is not protected like the server key.
- No advertising SDK is included.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false } });
const PORT = Number(process.env.PORT || 8080);
const DAILY_USER_LIMIT = Math.max(1, Number(process.env.DAILY_USER_LIMIT || 5));
const DAILY_GLOBAL_LIMIT = Math.max(1, Number(process.env.DAILY_GLOBAL_LIMIT || 400));
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

app.disable('x-powered-by');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => { if (!origin || origin === 'null' || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin not allowed')); }, allowedHeaders: ['Content-Type', 'X-Device-Id'] }));
app.use(express.json({ limit: '16kb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));

function deviceId(req) {
  const value = String(req.get('X-Device-Id') || '');
  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(value)) return null;
  return value;
}
function todayUtc() { return new Date().toISOString().slice(0, 10); }

async function refundReservation(id, date = todayUtc()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date]);
    await client.query('UPDATE noor_daily_usage SET request_count=GREATEST(0, request_count-1) WHERE usage_date=$1 AND device_id=$2', [date, id]);
    await client.query('UPDATE noor_global_usage SET request_count=GREATEST(0, request_count-1) WHERE usage_date=$1', [date]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS noor_daily_usage (
      usage_date date NOT NULL,
      device_id text NOT NULL,
      request_count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (usage_date, device_id)
    );
    CREATE TABLE IF NOT EXISTS noor_global_usage (
      usage_date date PRIMARY KEY,
      request_count integer NOT NULL DEFAULT 0
    );
  `);
}

async function usageFor(id) {
  const date = todayUtc();
  const result = await pool.query('SELECT request_count FROM noor_daily_usage WHERE usage_date=$1 AND device_id=$2', [date, id]);
  return result.rows[0] ? Number(result.rows[0].request_count) : 0;
}

app.get('/', (_req, res) => res.status(200).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ChatterNoor AI</title><style>body{font:16px system-ui;background:#080d14;color:#e5f4ff;display:grid;place-items:center;min-height:90vh;margin:0}.card{padding:28px;border:1px solid #284052;border-radius:18px;background:#101a26;max-width:520px}h1{color:#59e0ff}code{color:#8fffc1}</style></head><body><main class="card"><h1>NOOR AI SERVER</h1><p>ChatterNoor backend is running.</p><p>Health: <code>/health</code></p><p>API status: <code>/api/status</code> (requires app device ID)</p></main></body></html>`));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'ChatterNoor AI' }));

app.get('/api/status', async (req, res) => {
  const id = deviceId(req);
  if (!id) return res.status(400).json({ error: 'A valid app device ID is required.' });
  try {
    const [userCount, globalResult] = await Promise.all([
      usageFor(id),
      pool.query('SELECT request_count FROM noor_global_usage WHERE usage_date=$1', [todayUtc()])
    ]);
    const globalCount = globalResult.rows[0] ? Number(globalResult.rows[0].request_count) : 0;
    res.json({ dailyLimit: DAILY_USER_LIMIT, used: userCount, remaining: Math.max(0, DAILY_USER_LIMIT - userCount), globalLimit: DAILY_GLOBAL_LIMIT, globalUsed: globalCount });
  } catch (err) {
    console.error('status query failed:', err.message);
    res.status(503).json({ error: 'Usage service temporarily unavailable.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const id = deviceId(req);
  if (!id) return res.status(400).json({ error: 'A valid app device ID is required.' });
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const history = typeof req.body.history === 'string' ? req.body.history.slice(-6000) : '';
  if (!message || message.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Noor AI is not configured by the app publisher yet.' });

  let client;
  let reserved = false;
  let reservationDate = todayUtc();
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const date = reservationDate;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date]);
    const user = await client.query('SELECT request_count FROM noor_daily_usage WHERE usage_date=$1 AND device_id=$2 FOR UPDATE', [date, id]);
    const global = await client.query('SELECT request_count FROM noor_global_usage WHERE usage_date=$1 FOR UPDATE', [date]);
    const userCount = user.rows[0] ? Number(user.rows[0].request_count) : 0;
    const globalCount = global.rows[0] ? Number(global.rows[0].request_count) : 0;
    if (userCount >= DAILY_USER_LIMIT) {
      await client.query('ROLLBACK');
      return res.status(429).json({ error: 'Aaj ke 5 free messages complete ho gaye. Kal Noor se dobara baat karna!', remaining: 0 });
    }
    if (globalCount >= DAILY_GLOBAL_LIMIT) {
      await client.query('ROLLBACK');
      return res.status(429).json({ error: 'Noor ka daily free quota aaj ke liye complete ho gaya. Kal dobara try karein.', remaining: Math.max(0, DAILY_USER_LIMIT - userCount) });
    }
    await client.query(`INSERT INTO noor_daily_usage(usage_date,device_id,request_count) VALUES($1,$2,1)
      ON CONFLICT(usage_date,device_id) DO UPDATE SET request_count=noor_daily_usage.request_count+1`, [date, id]);
    await client.query(`INSERT INTO noor_global_usage(usage_date,request_count) VALUES($1,1)
      ON CONFLICT(usage_date) DO UPDATE SET request_count=noor_global_usage.request_count+1`, [date]);
    await client.query('COMMIT');
    reserved = true;

    const gameRequest = /\b(game|games|play|puzzle|racing|quiz|drawing|memory match|snake game|tic tac toe)\b|\b(make|create|build|design)\s+(me\s+)?(a\s+)?(simple\s+)?game\b|\b(game|khel)\s*(bana|banao|banado|bana do|banao na)|\b(khelo|khailna|game bana do)\b/i.test(message);
    const prompt = 'Recent Chat:\\n' + history + '\\n\\nUser Question:\\n' + message;
    const gameInstructions = gameRequest ? ' The user is asking for a game. You MUST create a complete, self-contained, playable HTML5 game, not merely describe one. Return the entire document inside one HTML code fence. Include <!DOCTYPE html>, <html>, <head>, and <body>. Use inline CSS and JavaScript only, touch-friendly controls, responsive mobile layout, a clear start/restart button, visible instructions and scoring where suitable. Do not use external libraries, remote assets, network calls, or external URLs. Keep it child-safe, age-appropriate, colorful, and genuinely playable. Do not add an introduction or explanation outside the code fence.' : '';
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: 'You are Noor, a friendly, child-safe educational companion. Use age-appropriate language. Never ask children for passwords, precise location, contact details, photos, or private information. Do not provide sexual, violent, dangerous, hateful, or self-harm instructions. Encourage a trusted adult for serious, unsafe, or upsetting situations. Keep replies kind and suitable for children. When the user requests a game, follow the game-specific instructions and output a complete playable HTML game.' + gameInstructions + '' }] }, contents: [{ parts: [{ text: prompt }] }], safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }], generationConfig: { maxOutputTokens: gameRequest ? 8192 : 700, temperature: gameRequest ? 0.7 : 0.8 } })
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Gemini upstream error:', upstream.status, payload.error && payload.error.status, payload.error && payload.error.message);
      await refundReservation(id, reservationDate);
      reserved = false;
      return res.status(upstream.status === 429 ? 503 : 502).json({ error: 'Noor AI is busy right now. Please try again shortly. Your free message has not been used.', remaining: Math.max(0, DAILY_USER_LIMIT - userCount) });
    }
    const reply = payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts && payload.candidates[0].content.parts.map(p => p.text || '').join('');
    if (!reply) {
      await refundReservation(id, reservationDate);
      reserved = false;
      return res.status(502).json({ error: 'Noor AI returned an empty reply. Your free message has not been used.', remaining: Math.max(0, DAILY_USER_LIMIT - userCount) });
    }
    res.json({ reply, used: userCount + 1, remaining: Math.max(0, DAILY_USER_LIMIT - userCount - 1) });
  } catch (err) {
    if (client && !reserved) await client.query('ROLLBACK').catch(() => {});
    if (reserved) {
      try { await refundReservation(id, reservationDate); reserved = false; }
      catch (refundErr) { console.error('usage refund failed:', refundErr.message); }
    }
    console.error('chat request failed:', err.message);
    if (!res.headersSent) res.status(503).json({ error: 'Noor AI service temporarily unavailable. Please try again; failed requests are not meant to use a free message.' });
  } finally {
    if (client) client.release();
  }
});

initDb().then(() => app.listen(PORT, () => console.log('ChatterNoor AI server listening on', PORT))).catch(err => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});

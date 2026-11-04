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

  const client = await pool.connect();
  let reserved = false;
  try {
    await client.query('BEGIN');
    const date = todayUtc();
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

    const prompt = 'Recent Chat:\\n' + history + '\\n\\nUser Question:\\n' + message;
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: 'You are Noor, a friendly, child-safe educational companion. Use age-appropriate language. Never ask children for passwords, precise location, contact details, photos, or private information. Do not provide sexual, violent, dangerous, hateful, or self-harm instructions. Encourage a trusted adult for serious, unsafe, or upsetting situations. Keep replies kind, brief, and suitable for children.' }] }, contents: [{ parts: [{ text: prompt }] }], safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }], generationConfig: { maxOutputTokens: 700, temperature: 0.8 } })
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Gemini upstream error:', upstream.status, payload.error && payload.error.status);
      return res.status(upstream.status === 429 ? 503 : 502).json({ error: 'Noor AI is busy right now. Please try again shortly.', remaining: Math.max(0, DAILY_USER_LIMIT - userCount - 1) });
    }
    const reply = payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts && payload.candidates[0].content.parts.map(p => p.text || '').join('');
    if (!reply) return res.status(502).json({ error: 'Noor AI returned an empty reply.' });
    res.json({ reply, used: userCount + 1, remaining: Math.max(0, DAILY_USER_LIMIT - userCount - 1) });
  } catch (err) {
    if (!reserved) await client.query('ROLLBACK').catch(() => {});
    console.error('chat request failed:', err.message);
    res.status(503).json({ error: 'Noor AI service temporarily unavailable.' });
  } finally {
    client.release();
  }
});

initDb().then(() => app.listen(PORT, () => console.log('ChatterNoor AI server listening on', PORT))).catch(err => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});

// Node 22 LTS — ES Modules (no require, uses import/export natively)
import express from 'express';
import { DatabaseSync } from 'node:sqlite'; // Built-in SQLite — no install needed! (Node 22+)
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Node 22: Built-in SQLite (no better-sqlite3 or pg needed for demos) ──────
const db = new DatabaseSync(':memory:'); // In-memory for demo; swap ':memory:' for a file path in prod

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    code     TEXT UNIQUE NOT NULL,
    url      TEXT NOT NULL,
    hits     INTEGER DEFAULT 0,
    created  TEXT DEFAULT (datetime('now'))
  )
`);

// Seed some example links
const seed = db.prepare('INSERT OR IGNORE INTO links (code, url) VALUES (?, ?)');
seed.run('azure', 'https://azure.microsoft.com');
seed.run('docs',  'https://docs.microsoft.com');
seed.run('node22','https://nodejs.org/en/blog/release/v22.0.0');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Node 22: Native fetch — call an external API without node-fetch or axios ──
app.get('/api/preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    // Native fetch — built into Node 18+ but now stable & full-featured in Node 22
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    const title = response.headers.get('content-type') || 'unknown';
    res.json({ ok: response.ok, status: response.status, contentType: title });
  } catch {
    res.json({ ok: false, status: null, contentType: null });
  }
});

// ── CRUD API ──────────────────────────────────────────────────────────────────
app.get('/api/links', (_req, res) => {
  const rows = db.prepare('SELECT * FROM links ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/links', (req, res) => {
  let { url, code } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  if (!url.startsWith('http')) url = 'https://' + url;
  if (!code) code = randomBytes(3).toString('hex'); // e.g. "a3f9c1"
  try {
    db.prepare('INSERT INTO links (code, url) VALUES (?, ?)').run(code, url);
    const row = db.prepare('SELECT * FROM links WHERE code = ?').get(code);
    res.status(201).json(row);
  } catch {
    res.status(409).json({ error: 'Code already taken, try another.' });
  }
});

app.delete('/api/links/:code', (req, res) => {
  db.prepare('DELETE FROM links WHERE code = ?').run(req.params.code);
  res.status(204).send();
});

// ── Redirect ──────────────────────────────────────────────────────────────────
app.get('/:code', (req, res) => {
  const row = db.prepare('SELECT * FROM links WHERE code = ?').get(req.params.code);
  if (!row) return res.status(404).send('Link not found');
  db.prepare('UPDATE links SET hits = hits + 1 WHERE code = ?').run(req.params.code);
  res.redirect(row.url);
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    features: ['ES Modules', 'Native fetch', 'Built-in SQLite (node:sqlite)'],
    port: PORT,
  });
});

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT} — Node ${process.version}`));

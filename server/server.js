#!/usr/bin/env node
/*
  CFA Ethics Practice: server mode.
  Zero dependencies (Node.js 18+). Serves the web app from ../docs and stores
  each user's results on disk, so a user sees the same results on any device.

  Environment variables (all optional):
    PORT            port to listen on                  (default 8080)
    HOST            interface to bind                  (default 127.0.0.1; use 0.0.0.0 in Docker)
    DATA_DIR        where users and results are stored (default ./data next to this file)
    REGISTRATION    open | invite | closed             (default: invite if INVITE_CODE is set, else open)
    INVITE_CODE     code required to create an account when REGISTRATION=invite
    COOKIE_SECURE   1 to force Secure cookies (set this when the site is served over https)
    SESSION_DAYS    how long a sign-in lasts           (default 60)

  Admin commands:
    node server.js adduser <username> <password>
    node server.js passwd  <username> <newpassword>
    node server.js deluser <username>
    node server.js listusers
*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', 'docs');
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const INVITE = process.env.INVITE_CODE || '';
const REG = process.env.REGISTRATION || (INVITE ? 'invite' : 'open');
const SESSION_MS = (+process.env.SESSION_DAYS || 60) * 864e5;
const MAX_BODY = 4 * 1024 * 1024;

fs.mkdirSync(path.join(DATA, 'state'), { recursive: true });
const USERS_F = path.join(DATA, 'users.json');
const SESS_F = path.join(DATA, 'sessions.json');

function readJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }
function writeJSON(f, o) { const tmp = f + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, f); }

let users = readJSON(USERS_F, {});
let sessions = readJSON(SESS_F, {});
const saveUsers = () => writeJSON(USERS_F, users);
const saveSessions = () => writeJSON(SESS_F, sessions);

const validName = (u) => typeof u === 'string' && /^[A-Za-z0-9_.\-]{3,40}$/.test(u);
const key = (u) => u.toLowerCase();
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function setPassword(u, pw) { const salt = crypto.randomBytes(16).toString('hex'); users[key(u)] = Object.assign(users[key(u)] || { name: u, created: new Date().toISOString() }, { salt, hash: hashPw(pw, salt) }); saveUsers(); }
function checkPw(u, pw) {
  const r = users[key(u)]; if (!r) { hashPw(pw, 'x'.repeat(32)); return false; }
  const h = Buffer.from(hashPw(pw, r.salt), 'hex'); const g = Buffer.from(r.hash, 'hex');
  return h.length === g.length && crypto.timingSafeEqual(h, g);
}

/* ---------- admin CLI ---------- */
const [cmd, a1, a2] = process.argv.slice(2);
if (cmd) {
  if (cmd === 'adduser' || cmd === 'passwd') {
    if (!validName(a1) || !a2 || a2.length < 6) { console.error('usage: node server.js ' + cmd + ' <username 3-40 chars: letters digits _ . -> <password min 6>'); process.exit(1); }
    if (cmd === 'adduser' && users[key(a1)]) { console.error('user exists'); process.exit(1); }
    if (cmd === 'passwd' && !users[key(a1)]) { console.error('no such user'); process.exit(1); }
    setPassword(a1, a2); console.log('ok'); process.exit(0);
  }
  if (cmd === 'deluser') { delete users[key(a1 || '')]; saveUsers(); try { fs.unlinkSync(stateFile(a1)); } catch (e) {} console.log('ok'); process.exit(0); }
  if (cmd === 'listusers') { Object.values(users).forEach(u => console.log(u.name, u.created)); process.exit(0); }
  console.error('unknown command'); process.exit(1);
}

function stateFile(u) { return path.join(DATA, 'state', key(u).replace(/[^a-z0-9_.\-]/g, '_') + '.json'); }

/* ---------- sessions ---------- */
function newSession(u) {
  const tok = crypto.randomBytes(32).toString('hex');
  sessions[tok] = { u: key(u), exp: Date.now() + SESSION_MS }; saveSessions(); return tok;
}
function parseCookies(req) { const o = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function currentUser(req) {
  const tok = parseCookies(req).sid; const s = tok && sessions[tok];
  if (!s) return null; if (s.exp < Date.now()) { delete sessions[tok]; saveSessions(); return null; }
  return users[s.u] ? s.u : null;
}
function isSecure(req) { return process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https'; }
function cookie(req, tok, maxAgeSec) {
  return `sid=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}` + (isSecure(req) ? '; Secure' : '');
}
setInterval(() => { const n = Date.now(); let ch = false; for (const k in sessions) if (sessions[k].exp < n) { delete sessions[k]; ch = true; } if (ch) saveSessions(); }, 36e5).unref();

/* ---------- login rate limit ---------- */
const fails = new Map();
function limited(ip) { const f = fails.get(ip); return f && f.n >= 10 && Date.now() - f.t < 15 * 60e3; }
function fail(ip) { const f = fails.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - f.t > 15 * 60e3) { f.n = 0; f.t = Date.now(); } f.n++; fails.set(ip, f); }

/* ---------- helpers ---------- */
const ERR = {
  bad: { en: 'Invalid request.', fa: 'درخواست نامعتبر است.' },
  name: { en: 'Username must be 3 to 40 characters: letters, digits, _ . -', fa: 'نام کاربری باید بین ۳ تا ۴۰ نویسه و فقط شامل حروف انگلیسی، عدد و نشانه‌های مجاز باشد.' },
  pass: { en: 'Password must be at least 6 characters.', fa: 'رمز باید دست کم ۶ نویسه باشد.' },
  exists: { en: 'This username is taken.', fa: 'این نام کاربری قبلا گرفته شده است.' },
  closed: { en: 'Registration is closed. Ask the administrator for an account.', fa: 'ساخت حساب بسته است. از مدیر سایت حساب بخواه.' },
  invite: { en: 'Invitation code is not correct.', fa: 'کد دعوت درست نیست.' },
  login: { en: 'Wrong username or password.', fa: 'نام کاربری یا رمز اشتباه است.' },
  many: { en: 'Too many attempts. Try again in 15 minutes.', fa: 'تلاش‌ها زیاد بود. پانزده دقیقه دیگر دوباره امتحان کن.' },
  auth: { en: 'Please sign in.', fa: 'لطفا وارد شو.' },
  big: { en: 'Data too large.', fa: 'حجم اطلاعات زیاد است.' }
};
function send(res, code, obj, headers) {
  const b = JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {}));
  res.end(b);
}
function body(req) {
  return new Promise((ok, no) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > MAX_BODY) { no(new Error('big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { no(new Error('bad')); } });
    req.on('error', no);
  });
}
const ipOf = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };
function serveStatic(req, res, p) {
  let rel = decodeURIComponent(p.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.normalize(path.join(ROOT, rel));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': /index\.html$/.test(f) ? 'no-cache' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' });
    fs.createReadStream(f).pipe(res);
  });
}

/* ---------- API ---------- */
async function api(req, res, route) {
  const m = req.method;
  if (route === 'health' && m === 'GET') return send(res, 200, { ok: true, app: 'cfa-ethics', registration: REG, invite: REG === 'invite' });
  if ((route === 'login' || route === 'register') && m === 'POST') {
    const ip = ipOf(req);
    if (limited(ip)) return send(res, 429, { error: ERR.many });
    let b; try { b = await body(req); } catch (e) { return send(res, 400, { error: ERR.bad }); }
    const u = String(b.username || ''), p = String(b.password || '');
    if (route === 'register') {
      if (REG === 'closed') return send(res, 403, { error: ERR.closed });
      if (REG === 'invite' && String(b.invite || '') !== INVITE) { fail(ip); return send(res, 403, { error: ERR.invite }); }
      if (!validName(u)) return send(res, 400, { error: ERR.name });
      if (p.length < 6 || p.length > 200) return send(res, 400, { error: ERR.pass });
      if (users[key(u)]) return send(res, 409, { error: ERR.exists });
      setPassword(u, p);
    } else if (!checkPw(u, p)) { fail(ip); return send(res, 401, { error: ERR.login }); }
    const tok = newSession(u);
    return send(res, 200, { ok: true, user: users[key(u)].name }, { 'Set-Cookie': cookie(req, tok, Math.floor(SESSION_MS / 1000)) });
  }
  if (route === 'logout' && m === 'POST') {
    const tok = parseCookies(req).sid; if (tok && sessions[tok]) { delete sessions[tok]; saveSessions(); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, 'x', 0) });
  }
  const u = currentUser(req);
  if (!u) return send(res, 401, { error: ERR.auth });
  if (route === 'me' && m === 'GET') return send(res, 200, { user: users[u].name });
  if (route === 'state' && m === 'GET') return send(res, 200, readJSON(stateFile(u), { v: 1, fav: [], hard: [], runs: [], cur: null }));
  if (route === 'state' && m === 'PUT') {
    let b; try { b = await body(req); } catch (e) { return send(res, e.message === 'big' ? 413 : 400, { error: e.message === 'big' ? ERR.big : ERR.bad }); }
    if (!b || typeof b !== 'object' || !Array.isArray(b.runs) || !Array.isArray(b.fav) || !Array.isArray(b.hard)) return send(res, 400, { error: ERR.bad });
    const clean = { v: 1, fav: b.fav.slice(0, 5000), hard: b.hard.slice(0, 5000), runs: b.runs.slice(-5000), cur: b.cur || null, saved: new Date().toISOString() };
    writeJSON(stateFile(u), clean);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: ERR.bad });
}

http.createServer((req, res) => {
  const url = req.url || '/';
  const i = url.indexOf('/api/');
  if (i >= 0) {
    const route = url.slice(i + 5).split('?')[0].replace(/\/+$/, '');
    return api(req, res, route).catch(e => { console.error(e); send(res, 500, { error: ERR.bad }); });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, url);
}).listen(PORT, HOST, () => console.log(`CFA Ethics Practice on http://${HOST}:${PORT}  (data: ${DATA}, registration: ${REG})`));

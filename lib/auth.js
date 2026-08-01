/* Einfache, abhaengigkeitsfreie Session fuer die geschuetzte interne
   Auswertung. HMAC-signierter, zeitlich begrenzter Cookie-Wert – kein
   externer Auth-Dienst noetig, passend zu "vorhandene Projektzugaenge". */
const crypto = require('crypto');

const COOKIE_NAME = 'hq_admin_session';
const MAX_AGE_S = 60 * 60 * 8; // 8 Stunden

function secret() {
  const s = process.env.HQ_SESSION_SECRET;
  if (!s) throw new Error('HQ_SESSION_SECRET ist nicht gesetzt.');
  return s;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function createSessionCookie() {
  const exp = Date.now() + MAX_AGE_S * 1000;
  const payload = `admin.${exp}`;
  const sig = sign(payload);
  const token = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_S}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [kind, expStr, sig] = parts;
  const payload = `${kind}.${expStr}`;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  if (kind !== 'admin') return false;
  if (Date.now() > Number(expStr)) return false;
  return true;
}

function checkPassword(candidate) {
  const real = process.env.HQ_ADMIN_PASSWORD || '';
  if (!real || !candidate) return false;
  const a = Buffer.from(String(candidate));
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Nicht angemeldet.' });
    return false;
  }
  return true;
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthenticated, checkPassword, requireAdmin, COOKIE_NAME };

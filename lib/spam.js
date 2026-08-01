/* Datenschutzfreundlicher Spam-Schutz ohne Drittanbieter (kein reCAPTCHA):
   Honeypot-Feld + Mindestausfuellzeit + IP-basiertes Rate-Limit. Die IP wird
   dafuer nur gehasht (mit Salt) kurzzeitig gespeichert, nie im Klartext. */
const crypto = require('crypto');
const { query } = require('./db');

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : '0.0.0.0';
}

function hashIp(ip) {
  const salt = process.env.HQ_IP_SALT || 'hq-default-salt';
  return crypto.createHash('sha256').update(salt + '|' + ip).digest('hex').slice(0, 32);
}

function honeypotTriggered(body) {
  return !!(body && body.website && String(body.website).trim());
}

function submittedTooFast(body, minMs) {
  const started = Number(body && body.form_started_at);
  if (!started) return false; // fehlender Zeitstempel blockt nicht, nur zusaetzliches Signal
  return Date.now() - started < (minMs || 2500);
}

async function checkAndRecordRateLimit(scope, ipHash, { windowMinutes = 10, maxCount = 4 } = {}) {
  const { rows } = await query(
    `select count(*)::int as n from rate_limit_events where scope=$1 and ip_hash=$2 and created_at > now() - ($3 || ' minutes')::interval`,
    [scope, ipHash, String(windowMinutes)]
  );
  const count = rows[0] ? rows[0].n : 0;
  await query('insert into rate_limit_events (scope, ip_hash) values ($1,$2)', [scope, ipHash]);
  return count < maxCount;
}

module.exports = { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit };

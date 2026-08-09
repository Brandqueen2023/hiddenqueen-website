/* Google reCAPTCHA v2 (Kaestchen) Serververifizierung. Ergaenzt lib/spam.js,
   ersetzt es nicht: Honeypot/Timing/Rate-Limit bleiben als erste, unsichtbare
   Stufe aktiv. */
async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY ist nicht gesetzt.');
  if (!token) return false;

  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.set('remoteip', remoteIp);

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  return !!data.success;
}

module.exports = { verifyRecaptcha };

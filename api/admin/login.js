const { createSessionCookie, checkPassword } = require('../../lib/auth');
const { getClientIp, hashIp, checkAndRecordRateLimit } = require('../../lib/spam');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const ipHash = hashIp(getClientIp(req));
    const withinLimit = await checkAndRecordRateLimit('admin_login', ipHash, { windowMinutes: 15, maxCount: 8 });
    if (!withinLimit) return res.status(429).json({ ok: false, error: 'Zu viele Versuche. Bitte später erneut versuchen.' });

    const { password } = req.body || {};
    if (!checkPassword(password)) {
      return res.status(401).json({ ok: false, error: 'Falsches Passwort.' });
    }
    res.setHeader('Set-Cookie', createSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin login Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

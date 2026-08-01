const { sendMail, esc } = require('../lib/mail');
const { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit } = require('../lib/spam');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const b = req.body || {};
    if (honeypotTriggered(b) || submittedTooFast(b, 2000)) {
      return res.status(200).json({ ok: true });
    }

    const ipHash = hashIp(getClientIp(req));
    const withinLimit = await checkAndRecordRateLimit('contact', ipHash, { windowMinutes: 15, maxCount: 5 });
    if (!withinLimit) return res.status(200).json({ ok: true });

    const firstname = String(b.firstname || '').trim();
    const email = String(b.email || '').trim();
    const message = String(b.message || '').trim();
    if (!firstname || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !message || !b.consent) {
      return res.status(400).json({ ok: false, error: 'Bitte fülle die Pflichtfelder aus und bestätige die Einwilligung.' });
    }

    const to = process.env.HQ_MAIL_TO || 'info@brandqueen.de';
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#22252b;line-height:1.6">
  <h2>Neue Kontaktanfrage über thehiddenqueen.de</h2>
  <p><strong>Name:</strong> ${esc(firstname)}</p>
  <p><strong>E-Mail:</strong> ${esc(email)}</p>
  <p><strong>Anliegen:</strong> ${esc(b.topic || '—')}</p>
  <p style="white-space:pre-wrap;border-top:1px solid #eee;padding-top:12px;"><strong>Nachricht:</strong><br>${esc(message)}</p>
</div>`;

    await sendMail({ to, subject: `HiddenQueen Kontakt – ${firstname} (${b.topic || 'Anliegen'})`, html, replyTo: email });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

const { sendMail, esc } = require('../lib/mail');
const { upsertContact } = require('../lib/brevo');
const { verifyRecaptcha } = require('../lib/recaptcha');
const { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit } = require('../lib/spam');

const LIST_ANFRAGEN = 11; // "HQ | Anfragen"

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

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);
    const withinLimit = await checkAndRecordRateLimit('raumkonzepte', ipHash, { windowMinutes: 15, maxCount: 5 });
    if (!withinLimit) return res.status(200).json({ ok: true });

    const recaptchaOk = await verifyRecaptcha(b.recaptcha_token, clientIp);
    if (!recaptchaOk) {
      return res.status(400).json({ ok: false, error: 'Bitte bestätige das Sicherheits-Häkchen.' });
    }

    const vorname = String(b.vorname || '').trim();
    const email = String(b.email || '').trim();
    const raumtyp = String(b.raumtyp || '').trim();
    const ort = String(b.ort || '').trim();
    const stand = String(b.stand || '').trim();
    const zeitraum = String(b.zeitraum || '').trim();
    if (!vorname || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !raumtyp || !ort || !stand || !zeitraum || !b.consent) {
      return res.status(400).json({ ok: false, error: 'Bitte fülle die Pflichtfelder aus und bestätige die Einwilligung.' });
    }
    const umfang = Array.isArray(b.umfang) ? b.umfang.map(String).slice(0, 20) : [];

    try {
      await upsertContact({
        email,
        listIds: [LIST_ANFRAGEN],
        attributes: {
          VORNAME: vorname,
          HQ_SOURCE: 'raumkonzepte_form',
          HQ_TOPIC: raumtyp || undefined,
          HQ_REQUESTED_AT: new Date().toISOString().slice(0, 10),
        },
      });
    } catch (e) {
      console.error('Brevo-Kontaktsync fehlgeschlagen:', e.message);
    }

    const to = process.env.HQ_MAIL_TO || 'info@brandqueen.de';
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#22252b;line-height:1.6">
  <h2>Neue Raumkonzept-Anfrage über thehiddenqueen.de</h2>
  <p><strong>Vorname:</strong> ${esc(vorname)}</p>
  <p><strong>E-Mail:</strong> ${esc(email)}</p>
  <p><strong>Telefon:</strong> ${esc(b.telefon || '—')}</p>
  <p><strong>Raum:</strong> ${esc(raumtyp)}</p>
  <p><strong>Ort/PLZ:</strong> ${esc(ort)}</p>
  <p><strong>Raumgröße:</strong> ${esc(b.groesse || '—')}</p>
  <p><strong>Aktueller Stand:</strong> ${esc(stand)}</p>
  <p><strong>Gewünschter Umfang:</strong> ${umfang.length ? esc(umfang.join(', ')) : '—'}</p>
  <p><strong>Gewünschter Zeitraum:</strong> ${esc(zeitraum)}</p>
  <p><strong>Investitionsrahmen:</strong> ${esc(b.budget || '—')}</p>
  <p style="white-space:pre-wrap;border-top:1px solid #eee;padding-top:12px;"><strong>Nachricht:</strong><br>${esc(b.nachricht || '—')}</p>
</div>`;

    await sendMail({ to, subject: `HiddenQueen Raumkonzept-Anfrage – ${vorname}`, html, replyTo: email });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('raumkonzepte Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

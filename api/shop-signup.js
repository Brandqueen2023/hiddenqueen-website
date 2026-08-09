/* Einfache Einwilligungs-Anmeldung (kein Double-Opt-in) für die Shopstart-
   Benachrichtigung, siehe HiddenQueen_Arbeitsprozess_Shop_und_Coming_Soon_Landingpage,
   Abschnitt 5: die Erfolgsmeldung bestätigt die Anmeldung sofort. */
const { upsertContact } = require('../lib/brevo');
const { verifyRecaptcha } = require('../lib/recaptcha');
const { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit } = require('../lib/spam');

const LIST_SHOP_START = 10; // "HQ | Shop | Start"

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
    const withinLimit = await checkAndRecordRateLimit('shop-signup', ipHash, { windowMinutes: 15, maxCount: 5 });
    if (!withinLimit) return res.status(200).json({ ok: true });

    const recaptchaOk = await verifyRecaptcha(b.recaptcha_token, clientIp);
    if (!recaptchaOk) {
      return res.status(400).json({ ok: false, error: 'Bitte bestätige das Sicherheits-Häkchen.' });
    }

    const vorname = String(b.vorname || '').trim().slice(0, 100);
    const email = String(b.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !b.consent) {
      return res.status(400).json({ ok: false, error: 'Bitte prüft die E-Mail-Adresse und die Einwilligung.' });
    }

    await upsertContact({
      email,
      attributes: vorname ? { FIRSTNAME: vorname } : {},
      listIds: [LIST_SHOP_START],
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('shop-signup Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

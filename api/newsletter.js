/* Eigener Double-Opt-in-Flow (Brevo validiert seine native DOI-API nur gegen
   eine Liste, die zusaetzlich per Brevo-UI-Assistent verknuepft sein muss –
   das ist ueber die API/MCP-Tools nicht erreichbar). Der Kontakt landet erst
   nach bestaetigtem Klick in Brevo, siehe api/newsletter-confirm.js. */
const crypto = require('crypto');
const { query } = require('../lib/db');
const { sendTemplateMail } = require('../lib/mail');
const { verifyRecaptcha } = require('../lib/recaptcha');
const { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit } = require('../lib/spam');

const TEMPLATE_DOI_CONFIRM = 1; // "HQ DOI 01 | Newsletter bestätigen"

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
    const withinLimit = await checkAndRecordRateLimit('newsletter', ipHash, { windowMinutes: 15, maxCount: 5 });
    if (!withinLimit) return res.status(200).json({ ok: true });

    const recaptchaOk = await verifyRecaptcha(b.recaptcha_token, clientIp);
    if (!recaptchaOk) {
      return res.status(400).json({ ok: false, error: 'Bitte bestätige das Sicherheits-Häkchen.' });
    }

    const vorname = String(b.vorname || '').trim().slice(0, 100);
    const email = String(b.email || '').trim();
    if (!vorname || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Bitte fülle Vorname und E-Mail-Adresse aus.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    await query(
      'insert into newsletter_signups (vorname, email, token) values ($1,$2,$3)',
      [vorname, email, token]
    );

    const baseUrl = process.env.HQ_SITE_BASE_URL || 'https://www.thehiddenqueen.de';
    await sendTemplateMail({
      to: email,
      templateId: TEMPLATE_DOI_CONFIRM,
      params: {
        FIRSTNAME: vorname,
        CONFIRM_URL: baseUrl + '/api/newsletter-confirm?token=' + token,
        IMPRESSUM_URL: baseUrl + '/impressum',
        DATENSCHUTZ_URL: baseUrl + '/datenschutz',
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('newsletter Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

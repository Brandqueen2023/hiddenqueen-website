const { query } = require('../lib/db');
const { scoreAnswers } = require('../lib/scoring');
const { sendMail, sendTemplateMail, esc } = require('../lib/mail');
const { upsertContact } = require('../lib/brevo');
const { verifyRecaptcha } = require('../lib/recaptcha');
const { getClientIp, hashIp, honeypotTriggered, submittedTooFast, checkAndRecordRateLimit } = require('../lib/spam');

const REQUIRED_SINGLE = [
  'q1_fuer_wen', 'q2_fehlt', 'q3_erster_schritt', 'q4_erreicht', 'q5_orientierung',
  'q6_aussage', 'q7_vertraut', 'q11_feedback', 'q12_zeit',
];

const LIST_PP_APPLICANTS = 6;
const TEMPLATE_PP_RECEIVED = 3; // "HQ PP 01 | Bewerbung eingegangen"
const HQ_CONSENT_VERSION = '2026-08-01';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};

    if (honeypotTriggered(b) || submittedTooFast(b, 2500)) {
      return res.status(200).json({ ok: true });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);
    const withinLimit = await checkAndRecordRateLimit('private_preview', ipHash, { windowMinutes: 30, maxCount: 3 });
    if (!withinLimit) {
      return res.status(200).json({ ok: true });
    }

    const recaptchaOk = await verifyRecaptcha(b.recaptcha_token, clientIp);
    if (!recaptchaOk) {
      return res.status(400).json({ ok: false, error: 'Bitte bestätige das Sicherheits-Häkchen.' });
    }

    for (const key of REQUIRED_SINGLE) {
      if (!b[key] || typeof b[key] !== 'string') {
        return res.status(400).json({ ok: false, error: 'Bitte beantworte alle Pflichtfragen.' });
      }
    }
    const q8 = Array.isArray(b.q8_wichtig) ? b.q8_wichtig : (b.q8_wichtig ? [b.q8_wichtig] : []);
    if (!q8.length || q8.length > 3) {
      return res.status(400).json({ ok: false, error: 'Bitte wähle bis zu drei Antworten bei Frage 8.' });
    }

    const vorname = String(b.c_vorname || '').trim();
    const email = String(b.c_email || '').trim();
    const plzOrt = String(b.c_plz_ort || '').trim();
    if (!vorname || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !plzOrt) {
      return res.status(400).json({ ok: false, error: 'Bitte fülle die Pflichtfelder bei den Kontaktdaten aus.' });
    }
    if (!b.consent_age || !b.consent_processing) {
      return res.status(400).json({ ok: false, error: 'Bitte bestätige die erforderlichen Einwilligungen.' });
    }

    const answers = {
      q1_fuer_wen: b.q1_fuer_wen, q2_fehlt: b.q2_fehlt, q3_erster_schritt: b.q3_erster_schritt,
      q4_erreicht: b.q4_erreicht, q5_orientierung: b.q5_orientierung, q6_aussage: b.q6_aussage,
      q7_vertraut: b.q7_vertraut, q8_wichtig: q8, q11_feedback: b.q11_feedback, q12_zeit: b.q12_zeit,
    };
    const result = scoreAnswers(answers);
    const status = result.status_hint || 'Neu';

    const insertRes = await query(
      `insert into preview_applications
        (answers, scores, top_collection, second_collection, eignung_score,
         boundary_text, expectation_text,
         vorname, nachname, email, partner_vorname, plz_ort, telefon, kontaktweg, nachricht,
         consent_age, consent_processing, consent_marketing,
         utm_source, referrer, ip_hash, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       returning id`,
      [
        JSON.stringify(answers), JSON.stringify(result.scores), result.top_collection, result.second_collection, result.eignung_score,
        String(b.q9_grenze || '').slice(0, 800) || null, String(b.q10_erwartung || '').slice(0, 1200) || null,
        vorname, String(b.c_nachname || '').trim() || null, email, String(b.c_partner_vorname || '').trim() || null,
        plzOrt, String(b.c_telefon || '').trim() || null, String(b.c_kontaktweg || '').trim() || null, String(b.c_nachricht || '').slice(0, 1000) || null,
        true, true, !!b.consent_marketing,
        String(b.utm_source || '').slice(0, 100) || null, String(b.referrer || '').slice(0, 300) || null, ipHash, status,
      ]
    );
    const id = insertRes.rows[0].id;

    const baseUrl = process.env.HQ_SITE_BASE_URL || 'https://www.thehiddenqueen.de';
    try {
      await sendTemplateMail({
        to: email,
        templateId: TEMPLATE_PP_RECEIVED,
        params: {
          FIRSTNAME: vorname,
          IMPRESSUM_URL: baseUrl + '/impressum',
          DATENSCHUTZ_URL: baseUrl + '/datenschutz',
        },
      });
    } catch (e) {
      console.error('Bestaetigungsmail fehlgeschlagen:', e.message);
    }

    try {
      await upsertContact({
        email,
        listIds: [LIST_PP_APPLICANTS],
        attributes: {
          VORNAME: vorname,
          NACHNAME: String(b.c_nachname || '').trim() || undefined,
          HQ_PP_APPLIED_AT: new Date().toISOString().slice(0, 10),
          HQ_PP_COLLECTION: result.top_collection || undefined,
          HQ_PP_STATUS: status,
          HQ_CONSENT_DATE: new Date().toISOString().slice(0, 10),
          HQ_CONSENT_VERSION,
          HQ_NEWSLETTER_CONSENT: !!b.consent_marketing,
          HQ_UTM_SOURCE: String(b.utm_source || '').slice(0, 100) || undefined,
          HQ_SOURCE: 'private_preview_form',
        },
      });
    } catch (e) {
      console.error('Brevo-Kontaktsync fehlgeschlagen:', e.message);
    }

    try {
      const adminTo = process.env.HQ_MAIL_TO || 'info@brandqueen.de';
      const adminUrl = (process.env.HQ_ADMIN_BASE_URL || 'https://www.thehiddenqueen.de') + '/admin/?id=' + id;
      await sendMail({
        to: adminTo,
        subject: 'Neue HiddenQueen Private Preview Bewerbung',
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#22252b">
<h2>Neue Private Preview Bewerbung</h2>
<p><strong>Vorname:</strong> ${esc(vorname)}</p>
<p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
<p><strong>Höchste interne Zuordnung:</strong> ${esc(result.top_collection || '—')}</p>
<p><strong>Eignungswertung:</strong> ${result.eignung_score}</p>
<p><a href="${adminUrl}">Zur geschützten Detailansicht</a></p>
</div>`,
      });
    } catch (e) {
      console.error('Interne Benachrichtigung fehlgeschlagen:', e.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('private-preview Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

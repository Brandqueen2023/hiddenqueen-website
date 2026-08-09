const { query } = require('../lib/db');
const { upsertContact } = require('../lib/brevo');

const LIST_NEWSLETTER_CONFIRMED = 5;
const TOKEN_MAX_AGE_DAYS = 7;

module.exports = async (req, res) => {
  const baseUrl = process.env.HQ_SITE_BASE_URL || 'https://www.thehiddenqueen.de';
  const token = String((req.query || {}).token || '').trim();
  if (!token) return res.redirect(302, baseUrl + '/?newsletter=fehler');

  try {
    const { rows } = await query(
      `select id, vorname, email, created_at, confirmed_at from newsletter_signups where token=$1`,
      [token]
    );
    if (!rows.length) return res.redirect(302, baseUrl + '/?newsletter=fehler');

    const signup = rows[0];
    const ageMs = Date.now() - new Date(signup.created_at).getTime();
    if (ageMs > TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return res.redirect(302, baseUrl + '/?newsletter=abgelaufen');
    }

    if (!signup.confirmed_at) {
      await query('update newsletter_signups set confirmed_at = now() where id=$1', [signup.id]);
      try {
        await upsertContact({
          email: signup.email,
          listIds: [LIST_NEWSLETTER_CONFIRMED],
          attributes: {
            VORNAME: signup.vorname || undefined,
            HQ_NEWSLETTER_CONSENT: true,
            HQ_CONSENT_DATE: new Date().toISOString().slice(0, 10),
            HQ_SOURCE: 'homepage_newsletter',
          },
        });
      } catch (e) {
        console.error('Brevo-Kontaktsync (Newsletter-Bestätigung) fehlgeschlagen:', e.message);
      }
    }

    return res.redirect(302, baseUrl + '/?newsletter=bestaetigt');
  } catch (err) {
    console.error('newsletter-confirm Fehler:', err);
    return res.redirect(302, baseUrl + '/?newsletter=fehler');
  }
};

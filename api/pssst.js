/* QR-Kampagne REWE Hilden: eine QR-Zieladresse (/pssst), drei zeitabhaengige
   Landingpages je nach Europe/Berlin-Uhrzeit. Fallback ausserhalb der
   Ladenoeffnungszeit (22:00-05:59) auf die Abendvariante, 06:00-06:59 auf
   die Morgenvariante, siehe Kampagnenauftrag Abschnitt 4. */
const { query } = require('../lib/db');

const VARIANT_FUER_DICH = 'fuer-dich';
const VARIANT_FUER_UNS = 'fuer-uns';
const VARIANT_HEUTE_ABEND = 'heute-abend';

function resolveVariant(date) {
  const parts = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 7 * 60 && totalMinutes < 11 * 60) return VARIANT_FUER_DICH;
  if (totalMinutes >= 11 * 60 && totalMinutes < 16 * 60 + 30) return VARIANT_FUER_UNS;
  if (totalMinutes >= 16 * 60 + 30 && totalMinutes < 22 * 60) return VARIANT_HEUTE_ABEND;
  if (totalMinutes >= 6 * 60 && totalMinutes < 7 * 60) return VARIANT_FUER_DICH;
  return VARIANT_HEUTE_ABEND; // 22:00-05:59
}

module.exports = async (req, res) => {
  let variant;
  try {
    variant = resolveVariant(new Date());
  } catch (err) {
    console.error('pssst Zeitzonen-Fehler:', err.message);
    variant = VARIANT_HEUTE_ABEND;
  }

  const queryString = (req.url && req.url.includes('?')) ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `/pssst/${variant}${queryString}`;

  try {
    await query(
      'insert into analytics_events (name, path, detail) values ($1,$2,$3)',
      ['hq_qr_scan', '/pssst', JSON.stringify({ variant: variant.replace('-', '_'), source: 'qr' })]
    );
  } catch (err) {
    console.error('pssst analytics Fehler:', err.message);
  }

  return res.redirect(302, target);
};

const { query } = require('../lib/db');

const ALLOWED = new Set([
  'private_preview_view', 'private_preview_start', 'private_preview_step',
  'private_preview_submit', 'private_preview_error', 'collection_view',
  'contact_submit', 'future_shop_click',
  'hq_qr_variant_view', 'hq_qr_hero_cta', 'hq_qr_preview_click',
  'hq_qr_library_click', 'hq_qr_collections_click', 'hq_qr_email_submit',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const b = req.body || {};
    const name = String(b.name || '');
    if (!ALLOWED.has(name)) return res.status(204).end();
    const path = String(b.path || '').slice(0, 200);
    const detail = b.detail && typeof b.detail === 'object' ? b.detail : {};
    const safeDetail = {};
    if (typeof detail.step !== 'undefined') safeDetail.step = String(detail.step).slice(0, 20);
    if (typeof detail.collection !== 'undefined') safeDetail.collection = String(detail.collection).slice(0, 40);
    if (typeof detail.campaign !== 'undefined') safeDetail.campaign = String(detail.campaign).slice(0, 60);
    if (typeof detail.variant !== 'undefined') safeDetail.variant = String(detail.variant).slice(0, 40);
    if (typeof detail.weekday !== 'undefined') safeDetail.weekday = String(detail.weekday).slice(0, 12);
    if (typeof detail.hour !== 'undefined') safeDetail.hour = String(detail.hour).slice(0, 2);
    if (typeof detail.source !== 'undefined') safeDetail.source = String(detail.source).slice(0, 20);

    await query('insert into analytics_events (name, path, detail) values ($1,$2,$3)', [name, path, JSON.stringify(safeDetail)]);
    return res.status(204).end();
  } catch (err) {
    console.error('event Fehler:', err.message);
    return res.status(204).end(); // Analytics darf nie einen sichtbaren Fehler erzeugen
  }
};

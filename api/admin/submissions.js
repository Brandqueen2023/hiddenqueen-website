const { query } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const { status, collection, from, to } = req.query || {};
    const clauses = [];
    const params = [];
    if (status) { params.push(status); clauses.push(`status = $${params.length}`); }
    if (collection) { params.push(collection); clauses.push(`top_collection = $${params.length}`); }
    if (from) { params.push(from); clauses.push(`created_at >= $${params.length}`); }
    if (to) { params.push(to); clauses.push(`created_at <= $${params.length}`); }
    const where = clauses.length ? 'where ' + clauses.join(' and ') : '';

    const { rows } = await query(
      `select id, created_at, vorname, nachname, email, plz_ort, top_collection, second_collection,
              eignung_score, status, consent_marketing, boundary_text
       from preview_applications ${where}
       order by created_at desc
       limit 500`,
      params
    );
    return res.status(200).json({ ok: true, items: rows });
  } catch (err) {
    console.error('admin submissions Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

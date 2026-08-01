const { query } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const { status, collection } = req.query || {};
    const clauses = [];
    const params = [];
    if (status) { params.push(status); clauses.push(`status = $${params.length}`); }
    if (collection) { params.push(collection); clauses.push(`top_collection = $${params.length}`); }
    const where = clauses.length ? 'where ' + clauses.join(' and ') : '';

    const { rows } = await query(
      `select id, created_at, status, vorname, nachname, email, partner_vorname, plz_ort, telefon, kontaktweg,
              top_collection, second_collection, eignung_score, consent_marketing, boundary_text, expectation_text, internal_note
       from preview_applications ${where} order by created_at desc`,
      params
    );

    const headers = ['id','created_at','status','vorname','nachname','email','partner_vorname','plz_ort','telefon','kontaktweg','top_collection','second_collection','eignung_score','consent_marketing','boundary_text','expectation_text','internal_note'];
    const lines = [headers.join(',')];
    for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hiddenqueen-private-preview.csv"');
    return res.status(200).send('﻿' + lines.join('\r\n'));
  } catch (err) {
    console.error('admin export Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

const { query } = require('../../../lib/db');
const { requireAdmin } = require('../../../lib/auth');
const { moveContactToList } = require('../../../lib/brevo');

const ALLOWED_STATUS = ['Neu', 'In Prüfung', 'Rückfrage', 'Ausgewählt', 'Aktuell nicht passend', 'Abgeschlossen', 'Gelöscht'];

const LIST_PP_APPLICANTS = 6;
const LIST_PP_SELECTED = 7;
const LIST_PP_COMPLETED = 8;

const LIST_MOVE_ON_STATUS = {
  'Ausgewählt': { addListId: LIST_PP_SELECTED, removeListId: LIST_PP_APPLICANTS },
  'Abgeschlossen': { addListId: LIST_PP_COMPLETED, removeListId: LIST_PP_SELECTED },
};

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number((req.query || {}).id);
  if (!id) return res.status(400).json({ ok: false, error: 'Ungültige ID' });

  try {
    if (req.method === 'GET') {
      const { rows } = await query('select * from preview_applications where id=$1', [id]);
      if (!rows.length) return res.status(404).json({ ok: false, error: 'Nicht gefunden' });
      return res.status(200).json({ ok: true, item: rows[0] });
    }

    if (req.method === 'PATCH') {
      const { status, internal_note } = req.body || {};
      if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ ok: false, error: 'Ungültiger Status' });
      }
      const { rows } = await query(
        `update preview_applications set
           status = coalesce($2, status),
           internal_note = coalesce($3, internal_note),
           updated_at = now()
         where id=$1 returning *`,
        [id, status || null, typeof internal_note === 'string' ? internal_note : null]
      );
      if (!rows.length) return res.status(404).json({ ok: false, error: 'Nicht gefunden' });

      const move = status && LIST_MOVE_ON_STATUS[status];
      if (move && rows[0].email) {
        try {
          await moveContactToList({ email: rows[0].email, ...move });
        } catch (e) {
          console.error('Brevo-Listenverschiebung fehlgeschlagen:', e.message);
        }
      }

      return res.status(200).json({ ok: true, item: rows[0] });
    }

    if (req.method === 'DELETE') {
      await query('delete from preview_applications where id=$1', [id]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('admin submission detail Fehler:', err);
    return res.status(500).json({ ok: false, error: 'Interner Fehler' });
  }
};

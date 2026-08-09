/* Brevo Kontakt-/Listen-Verwaltung (Marketing-Kontakte, getrennt von den
   transaktionalen Mails in lib/mail.js). */
const BREVO_API = 'https://api.brevo.com/v3';

async function brevoFetch(path, options) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY ist nicht gesetzt.');
  const res = await fetch(BREVO_API + path, {
    ...options,
    headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => '');
    throw new Error('Brevo-Anfrage fehlgeschlagen (' + path + '): ' + res.status + ' ' + body);
  }
  if (res.status === 204 || res.status === 404) return null;
  return res.json().catch(() => null);
}

/* Kontakt anlegen/aktualisieren (upsert per E-Mail), optional Listen zuordnen. */
async function upsertContact({ email, attributes, listIds }) {
  return brevoFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      attributes: attributes || {},
      ...(listIds && listIds.length ? { listIds } : {}),
      updateEnabled: true,
    }),
  });
}

/* Kontakt von einer Liste in eine andere verschieben. */
async function moveContactToList({ email, addListId, removeListId }) {
  const body = {};
  if (addListId) body.listIds = [addListId];
  if (removeListId) body.unlinkListIds = [removeListId];
  return brevoFetch('/contacts/' + encodeURIComponent(email), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

module.exports = { upsertContact, moveContactToList };

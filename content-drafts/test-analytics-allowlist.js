/* Eigenstaendiger, lokaler Test der Allowlist-Logik aus api/event.js.
   Geht NICHT gegen die echte Datenbank/API - bildet nur die Pruef-Bedingung
   "if (!ALLOWED.has(name)) return res.status(204).end();" nach, indem die
   ALLOWED-Liste direkt aus api/event.js per Regex ausgelesen wird (kein
   echter Require, da api/event.js beim Laden lib/db.js braucht, das eine
   DATABASE_URL erwartet - genau das wollen wir hier vermeiden). */
const fs = require('fs');
const path = require('path');

const apiSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'event.js'), 'utf8');
const clientSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'hq-analytics.js'), 'utf8');

function extractAllowed(src) {
  const m = src.match(/ALLOWED\s*=\s*(?:new Set\()?\[([\s\S]*?)\]/);
  if (!m) throw new Error('ALLOWED-Liste nicht gefunden');
  return m[1]
    .split(',')
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

const apiAllowed = extractAllowed(apiSrc);
const clientAllowed = extractAllowed(clientSrc);

const mustBeAllowed = [
  'private_preview_start_click', 'newsletter_signup', 'shop_signup',
  'manufaktur_submit', 'raumkonzept_submit',
  // bereits vorher korrekt erlaubt, duerfen nicht verloren gehen:
  'collection_view', 'contact_submit', 'future_shop_click',
];
const mustBeRejected = ['erfundenes_event', 'drop_table_events', ''];

let ok = true;

console.log('--- api/event.js ALLOWED ---');
console.log(apiAllowed.join(', '));
console.log('--- js/hq-analytics.js ALLOWED ---');
console.log(clientAllowed.join(', '));

// Client und Server muessen exakt uebereinstimmen (gleiche Menge)
const apiSet = new Set(apiAllowed);
const clientSet = new Set(clientAllowed);
const sameSize = apiSet.size === clientSet.size;
const sameEntries = [...apiSet].every(n => clientSet.has(n)) && [...clientSet].every(n => apiSet.has(n));
if (!sameSize || !sameEntries) {
  ok = false;
  console.error('FEHLER: Client- und Server-Allowlist stimmen nicht ueberein.');
}

for (const name of mustBeAllowed) {
  const pass = apiSet.has(name) && clientSet.has(name);
  console.log((pass ? 'OK  ' : 'FEHLT') + '  erlaubt: ' + name);
  if (!pass) ok = false;
}

for (const name of mustBeRejected) {
  const pass = !apiSet.has(name) && !clientSet.has(name);
  console.log((pass ? 'OK  ' : 'FEHLER') + '  weiterhin abgelehnt: "' + name + '"');
  if (!pass) ok = false;
}

console.log(ok ? '\nALLE PRUEFUNGEN BESTANDEN' : '\nPRUEFUNG FEHLGESCHLAGEN');
process.exit(ok ? 0 : 1);

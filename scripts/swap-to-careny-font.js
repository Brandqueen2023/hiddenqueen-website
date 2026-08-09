/* Ersetzt sitewide den Fraunces-Platzhalter (Google WebFont-Loader) durch
 * die offizielle, selbstgehostete Careny/Shippori-Mincho-Schrift
 * (css/hq-fonts.css), gemaess Markenhandbuch (CI/Fonts). Einmaliges
 * Migrations-Skript, arbeitet auf den *.html-Quelldateien.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = [
  '404.html', 'datenschutz.html', 'faq.html', 'haltung.html', 'impressum.html',
  'index.html', 'kollektionen.html', 'kontakt.html', 'manufaktur.html',
  'private-preview.html', 'raumkonzepte.html', 'shop.html',
  'library/der-erste-schritt.html', 'library/diskretion-ist-keine-verpackung.html',
  'library/index.html', 'library/vertrauen-als-geschenk.html',
  'library/warum-fantasie-uebung-braucht.html', 'library/wenn-der-alltag-lauter-wird.html',
];

const OLD_BLOCK = `  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous">
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
  <script type="text/javascript">WebFont.load({ google: { families: ["Fraunces:400,500,600,700","Shippori Mincho:400,700"] } });</script>`;

let changed = 0;
for (const f of FILES) {
  const full = path.join(ROOT, f);
  const html = fs.readFileSync(full, 'utf8');
  const isAbsolute = html.includes('href="/css/hq-brand.css"');
  const newLine = `  <link href="${isAbsolute ? '/css/hq-fonts.css' : 'css/hq-fonts.css'}" rel="stylesheet" type="text/css">`;
  if (!html.includes(OLD_BLOCK)) {
    console.log('SKIP (block not found):', f);
    continue;
  }
  const next = html.replace(OLD_BLOCK, newLine);
  fs.writeFileSync(full, next);
  changed++;
  console.log('✓', f);
}
console.log('Fertig:', changed, '/', FILES.length, 'Dateien umgestellt.');

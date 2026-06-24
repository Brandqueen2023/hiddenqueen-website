/* Gründlicher Marken-Cleanup: exovia-Reste entfernen, Shop ins Kontakt-Menü,
 * Meta/OG/Twitter auf The Hiddenqueen. (Keine Bild-Dateinamen betroffen.) */
const fs = require('fs');
const path = require('path');
const SHOP_URL = 'https://shop.thehiddenqueen.de';
const pages = ['index.html', 'about.html', 'gallery.html', 'contact.html'];

for (const f of pages) {
  const fp = path.join(__dirname, f);
  let h = fs.readFileSync(fp, 'utf8');

  // Meta/OG/Twitter Titel + Beschreibung (vor dem generischen Ersetzen)
  h = h.replace(/Experience Luxury Webdesignexovia(&#x27;|’)s Dark Theme[^"]*/g,
    'The Hiddenqueen: maßgefertigte Möbel und Raumkonzepte für den sinnlichen Bereich. Ästhetik, Handwerk und Diskretion.');
  h = h.replace(/Luxury Webdesignexovia(&#x27;|’)s Dark Theme/g,
    'The Hiddenqueen — Sinnlichkeit nach Maß');

  // exovia-Reste neutralisieren (kommt in keinem Bild-Dateinamen vor)
  h = h.replace(/exovia\.de/gi, 'thehiddenqueen.de');
  h = h.replace(/the exovia blog/gi, 'unserem Blog');
  h = h.replace(/exovia/gi, 'The Hiddenqueen');
  h = h.replace(/\bExova\b/g, 'The Hiddenqueen');

  // Shop ins Menü (auch Kontakt-Variante mit w--current)
  if (!/class="nav-link">SHOP</.test(h)) {
    const li = /(<li class="nav-list">\s*<a href="contact\.html"[^>]*class="[^"]*nav-link[^"]*"[^>]*>[^<]*<\/a>\s*<div class="nav-item-line"><\/div>\s*<\/li>)/s;
    if (li.test(h)) {
      h = h.replace(li, `$1\n                <li class="nav-list"><a href="${SHOP_URL}" class="nav-link">SHOP</a><div class="nav-item-line"></div></li>`);
    }
  }

  fs.writeFileSync(fp, h);
}
console.log('Cleanup fertig.');

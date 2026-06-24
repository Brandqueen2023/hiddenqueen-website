/* Shop-Menüpunkt ergänzen + exovia-Kontaktdaten neutralisieren */
const fs = require('fs');
const path = require('path');
const SHOP_URL = 'https://shop.thehiddenqueen.de'; // Platzhalter, wird auf echten Shop gesetzt

const pages = ['index.html', 'about.html', 'gallery.html', 'contact.html'];

for (const f of pages) {
  const fp = path.join(__dirname, f);
  let html = fs.readFileSync(fp, 'utf8');

  // 1) Shop-Menüpunkt nach dem Contact-Eintrag einfügen (falls noch nicht da)
  if (!/class="nav-link">SHOP</.test(html)) {
    const contactLi = /(<li class="nav-list">\s*<a href="contact\.html"[^>]*class="nav-link"[^>]*>[^<]*<\/a>\s*<div class="nav-item-line"><\/div>\s*<\/li>)/s;
    if (contactLi.test(html)) {
      html = html.replace(contactLi, `$1\n                <li class="nav-list"><a href="${SHOP_URL}" class="nav-link">SHOP</a><div class="nav-item-line"></div></li>`);
    }
  }

  fs.writeFileSync(fp, html);
}

// 2) exovia-Daten in contact.html neutralisieren
const cp = path.join(__dirname, 'contact.html');
let c = fs.readFileSync(cp, 'utf8');
c = c
  .replace(/kontakt@exovia\.de/g, 'hallo@thehiddenqueen.de')
  .replace(/https:\/\/www\.exovia\.de\//g, 'https://www.thehiddenqueen.de/')
  .replace(/>exovia\.de</g, '>thehiddenqueen.de<')
  .replace(/Schwenckestraße 46<br>20255 Hamburg<br>Germany/g, 'Adresse auf Anfrage')
  .replace(/tel:\+494065861423/g, '#')
  .replace(/\+49 40 65 86 14 23/g, 'Auf Anfrage')
  .replace(/https:\/\/www\.brandqueen\.de\//g, SHOP_URL);
fs.writeFileSync(cp, c);

console.log('Fixups angewendet. Shop-URL (Platzhalter):', SHOP_URL);

/**
 * Eigenstaendiges Vorschau-Skript fuer die ENTWURF-Detailseiten unter
 * content-drafts/. Importiert NICHTS aus build.js und veraendert build.js
 * nicht. build.js selbst scannt nur *.html im Projekt-Root + library/ -
 * dieser Ordner (content-drafts/) wird von build.js nicht gelesen, die
 * Entwuerfe landen also nie in dist/ und koennen nicht versehentlich live
 * gehen.
 *
 * Header/Footer-HTML ist 1:1 aus build.js (Stand Runde 2, Funktionen
 * buildNav/buildFooter) uebernommen, SHOP_ENABLED=false wie im aktuellen
 * Live-Stand.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'preview');

const SHOP_ENABLED = false; // aktueller Live-Stand, siehe build.js
const SHOP_URL = '';

function buildNav($) {
  const shopNav = SHOP_ENABLED && SHOP_URL ? `<a href="${SHOP_URL}">Shop</a>` : '';
  const shopOverlay = SHOP_ENABLED && SHOP_URL ? `<a href="${SHOP_URL}">Shop</a>` : '';
  const header = `
<div class="hq-preloader" aria-hidden="true"><img src="/images/hiddenqueen-logo-light.svg" alt=""></div>
<header class="hq-header">
  <a class="hq-logo" href="/"><img src="/images/hiddenqueen-logo-light.svg" alt="HiddenQueen"></a>
  <nav class="hq-nav">
    <a href="/kollektionen">Kollektionen</a>
    <a href="/shop">Shop</a>
    <a href="/manufaktur">Manufaktur</a>
    <a href="/raumkonzepte">Raumkonzepte</a>
    <a href="/haltung">Unsere Haltung</a>
    <a href="/library">The Queen's Library</a>
    <a href="/faq">Häufige Fragen</a>
    ${shopNav}
    <a class="hq-nav-cta" href="/private-preview">Private Preview beginnen</a>
  </nav>
  <button class="hq-burger" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="hqOverlay"><span></span><span></span><span></span></button>
</header>
<div class="hq-overlay" id="hqOverlay" role="dialog" aria-modal="true" aria-label="Hauptmenü">
  <button class="hq-close" type="button" aria-label="Menü schließen">&times;</button>
  <nav class="hq-overlay-nav">
    <a href="/">Start</a>
    <a href="/kollektionen">Kollektionen</a>
    <a href="/shop">Shop</a>
    <a href="/manufaktur">Manufaktur</a>
    <a href="/raumkonzepte">Raumkonzepte</a>
    <a href="/haltung">Unsere Haltung</a>
    <a href="/library">The Queen's Library</a>
    <a href="/faq">Häufige Fragen</a>
    ${shopOverlay}
    <a href="/private-preview" class="hq-nav-cta">Private Preview beginnen</a>
    <a href="/kontakt">Kontakt</a>
  </nav>
</div>`;
  $('body').prepend(header);
}

function buildFooter($) {
  const shopLi = SHOP_ENABLED && SHOP_URL ? `<li><a href="${SHOP_URL}">Shop</a></li>` : '';
  const footer = `
<footer class="hq-footer">
  <div class="hq-footer-inner">
    <p class="hq-footer-claim">HiddenQueen. Außergewöhnliche Kollektionen für Frauen und Paare.</p>
    <nav class="hq-footer-links" aria-label="Fußzeile">
      <ul>
        <li><a href="/kollektionen">Kollektionen</a></li>
        <li><a href="/shop">Shop</a></li>
        <li><a href="/manufaktur">Manufaktur</a></li>
        <li><a href="/raumkonzepte">Raumkonzepte</a></li>
        <li><a href="/haltung">Unsere Haltung</a></li>
        <li><a href="/library">The Queen's Library</a></li>
        <li><a href="/private-preview">Private Preview</a></li>
        <li><a href="/faq">Häufige Fragen</a></li>
        <li><a href="/kontakt">Kontakt</a></li>
        ${shopLi}
        <li><a href="/impressum">Impressum</a></li>
        <li><a href="/datenschutz">Datenschutz</a></li>
      </ul>
    </nav>
    <p class="hq-footer-social">
      <a href="https://www.instagram.com/hiddenqueen.official" target="_blank" rel="noopener">Instagram</a>
      <a href="https://www.facebook.com/profile.php?id=61593099650410" target="_blank" rel="noopener">Facebook</a>
      <a href="https://de.pinterest.com/thehiddenqueen/" target="_blank" rel="noopener">Pinterest</a>
    </p>
    <p class="hq-footer-copy">© <span id="hq-year">2026</span> HiddenQueen — ENTWURF, nicht live</p>
  </div>
</footer>
<script>document.getElementById('hq-year').textContent = new Date().getFullYear();</script>`;
  $('body').append(footer);
}

const pages = [
  'detailseite-the-invitation.src.html',
  'detailseite-blind-trust.src.html',
  'detailseite-after-midnight.src.html',
];

fs.mkdirSync(OUT, { recursive: true });

for (const page of pages) {
  const srcFile = path.join(__dirname, page);
  const $ = cheerio.load(fs.readFileSync(srcFile, 'utf8'), { decodeEntities: false });
  buildNav($);
  buildFooter($);
  const outName = page.replace('.src.html', '.html');
  fs.writeFileSync(path.join(OUT, outName), $.html());
  console.log('✓ preview:', outName);
}
console.log('Vorschau fertig → content-drafts/preview/ (nicht in dist/, nicht live)');

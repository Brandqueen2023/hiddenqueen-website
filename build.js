/**
 * Build: erzeugt die statische HiddenQueen-Website nach dist/.
 * Seiteninhalte stehen direkt in den *.html-Quelldateien (kein CMS-Layer
 * mehr fuer die Markenseiten – siehe HIDDENQUEEN_MASTER_TASK, Abschnitt 9:
 * die vorgegebenen Texte muessen wortgetreu stehen bleiben).
 *
 * Was build.js pro Seite erledigt:
 *  - Kopf-/Fussbereich (Header/Nav/Overlay, Footer) einheitlich einsetzen
 *  - Shop-Feature-Flag anwenden (SHOP_ENABLED / SHOP_URL)
 *  - interne Links extensionslos machen, Assets cache-bustet einbinden
 *  - Cookie-Consent + eigenes Nav-/Preloader-Skript einbinden
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SRC = __dirname;
const DIST = path.join(SRC, 'dist');
const BUILDID = Date.now(); // Cache-Buster: bei jedem Build neu

const SHOP_ENABLED = String(process.env.SHOP_ENABLED || 'false').toLowerCase() === 'true';
const SHOP_URL = process.env.SHOP_URL || '';

/* ----------------------------------------------------------------------------
 * HTML-AUFBAU
 * ------------------------------------------------------------------------- */

/* Versioniert lokale CSS/JS-Verweise, damit Browser nie alte Dateien cachen */
function bustAssets($) {
  $('link[rel="stylesheet"]').each(function () { const h = $(this).attr('href'); if (h && /^css\//.test(h) && h.indexOf('?') === -1) $(this).attr('href', h + '?v=' + BUILDID); });
  $('script[src]').each(function () { const s = $(this).attr('src'); if (s && /^js\//.test(s) && s.indexOf('?') === -1) $(this).attr('src', s + '?v=' + BUILDID); });
}

/* Header/Nav/Menü-Overlay einheitlich auf jeder Seite einsetzen (Abschnitt 15) */
function buildNav($) {
  $('.navbar').remove();
  $('.menu').remove();
  $('header.hq-header').remove();
  $('.hq-overlay').remove();

  const shopNav = SHOP_ENABLED && SHOP_URL ? `<a href="${SHOP_URL}">Shop</a>` : '';
  const shopOverlay = SHOP_ENABLED && SHOP_URL ? `<a href="${SHOP_URL}">Shop</a>` : '';

  const header = `
<div class="hq-preloader" aria-hidden="true"><img src="/images/hiddenqueen-emblem-light.svg" alt=""></div>
<header class="hq-header">
  <a class="hq-logo" href="/"><img src="/images/hiddenqueen-emblem-light.svg" alt="HiddenQueen"></a>
  <nav class="hq-nav">
    <a href="/kollektionen">Kollektionen</a>
    <a href="/haltung">Unsere Haltung</a>
    <a href="/private-preview">Private Preview</a>
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
    <a href="/haltung">Unsere Haltung</a>
    <a href="/private-preview">Private Preview</a>
    <a href="/faq">Häufige Fragen</a>
    ${shopOverlay}
    <a href="/kontakt">Kontakt</a>
  </nav>
</div>`;
  $('body').prepend(header);
}

/* Footer einheitlich auf jeder Seite einsetzen (Abschnitt 24) */
function buildFooter($) {
  $('section.footer, .footer').remove();
  const shopLi = SHOP_ENABLED && SHOP_URL ? `<li><a href="${SHOP_URL}">Shop</a></li>` : '';
  const footer = `
<footer class="hq-footer">
  <div class="hq-footer-inner">
    <p class="hq-footer-claim">HiddenQueen. Außergewöhnliche Kollektionen für Frauen und Paare.</p>
    <nav class="hq-footer-links" aria-label="Fußzeile">
      <ul>
        <li><a href="/kollektionen">Kollektionen</a></li>
        <li><a href="/haltung">Unsere Haltung</a></li>
        <li><a href="/private-preview">Private Preview</a></li>
        <li><a href="/faq">Häufige Fragen</a></li>
        <li><a href="/kontakt">Kontakt</a></li>
        ${shopLi}
        <li><a href="/impressum">Impressum</a></li>
        <li><a href="/datenschutz">Datenschutz</a></li>
      </ul>
    </nav>
    <p class="hq-footer-copy">© <span id="hq-year">2026</span> HiddenQueen</p>
  </div>
</footer>
<script>document.getElementById('hq-year').textContent = new Date().getFullYear();</script>`;
  $('body').append(footer);
}

/* Interne Links extensionslos machen: index.html → "/", kollektionen.html → "/kollektionen" usw. */
function cleanHomeLinks($) {
  $('a[href]').each(function () {
    let h = $(this).attr('href');
    if (!h) return;
    if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(h)) return;
    h = h.replace(/^\.?\//, '');
    const m = h.match(/^([^?#]+)\.html(\?[^#]*)?(#.*)?$/i);
    if (!m) return;
    const name = m[1].replace(/^\/+/, '');
    const rest = (m[2] || '') + (m[3] || '');
    $(this).attr('href', (name === 'index' ? '/' : '/' + name) + rest);
  });
}

/* Shop-Feature-Flag als globale JS-Variable bereitstellen (fuer Buttons, die
   Vercel-seitig noch nicht ins HTML gerendert werden koennen, z.B. dynamische
   "Kollektion im Shop entdecken"-CTAs). */
function injectShopFlag($) {
  $('head').append(`<script>window.HQ_SHOP_ENABLED=${SHOP_ENABLED};window.HQ_SHOP_URL=${JSON.stringify(SHOP_URL)};</script>`);
}

/* Robustes Nav-/Preloader-Skript + datensparsame Analytics einbinden */
function injectScript($) {
  if (!$('script[src^="/js/hq-analytics.js"]').length) $('body').append('<script src="/js/hq-analytics.js"></script>');
  if (!$('script[src^="/js/hq.js"]').length) $('body').append('<script src="/js/hq.js"></script>');
}

/* Cookie-Consent (CookieConsent v3, Orest Bida) – Anthrazit/Rosegold, Du-Form */
function injectCookieConsent($) {
  if ($('link[href*="cookieconsent@3"]').length) return;
  $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.css">');
  $('head').append("<style>#cc-main{--cc-font-family:'Inter',sans-serif;--cc-btn-primary-bg:#cf9c8c;--cc-btn-primary-color:#1a1714;--cc-btn-primary-hover-bg:#d9ac9d;--cc-btn-secondary-hover-bg:#2a2521;--cc-toggle-on-bg:#cf9c8c;--cc-link-color:#cf9c8c;--cc-btn-border-radius:2px}</style>");
  $('body').append('<script src="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js"></script>');
  $('body').append('<script src="/js/cc-init.js"></script>');
}

/* ----------------------------------------------------------------------------
 * MAIN
 * ------------------------------------------------------------------------- */
async function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const dir of ['css', 'js', 'images', 'admin']) {
    const from = path.join(SRC, dir);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, dir), { recursive: true });
  }
  for (const f of fs.readdirSync(SRC)) {
    if (/\.(ico|png|svg|webmanifest|xml|txt)$/i.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
  }

  for (const page of fs.readdirSync(SRC)) {
    if (!page.endsWith('.html')) continue;
    const $ = cheerio.load(fs.readFileSync(path.join(SRC, page), 'utf8'), { decodeEntities: false });
    buildNav($);
    buildFooter($);
    injectShopFlag($);
    cleanHomeLinks($);
    injectScript($);
    injectCookieConsent($);
    bustAssets($);
    fs.writeFileSync(path.join(DIST, page), $.html());
    console.log('✓', page);
  }

  console.log('Build fertig → dist/ (SHOP_ENABLED=' + SHOP_ENABLED + ')');
}

main().catch(err => { console.error('Build fehlgeschlagen:', err); process.exit(1); });

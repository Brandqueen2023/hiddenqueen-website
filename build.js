/**
 * Build: spielt Inhalte (content/*.json) ins Webflow-HTML (Design 1:1),
 * generiert "The Queen's Library" (Übersicht + Artikelseiten aus content/library/*.md).
 * Ausgabe nach dist/. CSS/JS/Bilder werden kopiert.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const matter = require('gray-matter');
const { marked } = require('marked');

const SRC = __dirname;
const DIST = path.join(SRC, 'dist');
const MAP = require('./content/_map.js');
const BUILDID = Date.now(); // Cache-Buster: bei jedem Build neu

/* Versioniert lokale CSS/JS-Verweise, damit Browser nie alte Dateien cachen */
function bustAssets($) {
  $('link[rel="stylesheet"]').each(function () { const h = $(this).attr('href'); if (h && /^css\//.test(h) && h.indexOf('?') === -1) $(this).attr('href', h + '?v=' + BUILDID); });
  $('script[src]').each(function () { const s = $(this).attr('src'); if (s && /^js\//.test(s) && s.indexOf('?') === -1) $(this).attr('src', s + '?v=' + BUILDID); });
}

/* Einstellungen (Menü-Namen + Shop-URL) aus content/settings.json */
function readSettings() {
  try { return JSON.parse(fs.readFileSync(path.join(SRC, 'content', 'settings.json'), 'utf8')); } catch (e) { return {}; }
}
const SET = readSettings();
const SHOP_URL = SET.shop_url || 'https://hiddenqueen-2.myshopify.com';
const NAV = {
  gal: SET.nav_galerie || 'Galerie',
  ueber: SET.nav_ueber || 'Über',
  kontakt: SET.nav_kontakt || 'Kontakt',
  lib: SET.nav_library || 'Library',
  shop: SET.nav_shop || 'Shop'
};

/* Altes Webflow-Menü entfernen und eigenes, einfaches Menü einsetzen */
function buildNav($) {
  $('.navbar').remove();
  $('.menu').remove();
  const header = `
<header class="hq-header">
  <a class="hq-logo" href="index.html"><img src="images/HiddenQueen-Logo.svg" alt="The Hiddenqueen"></a>
  <nav class="hq-nav">
    <a href="gallery.html">${NAV.gal}</a>
    <a href="about.html">${NAV.ueber}</a>
    <a href="contact.html">${NAV.kontakt}</a>
    <a href="library.html">${NAV.lib}</a>
    <a class="hq-shop" href="${SHOP_URL}">${NAV.shop}</a>
  </nav>
  <button class="hq-burger" type="button" aria-label="Menü öffnen"><span></span><span></span><span></span></button>
</header>
<div class="hq-overlay" id="hqOverlay">
  <button class="hq-close" type="button" aria-label="Menü schließen">&times;</button>
  <nav class="hq-overlay-nav">
    <a href="index.html">Home</a>
    <a href="gallery.html">${NAV.gal}</a>
    <a href="about.html">${NAV.ueber}</a>
    <a href="contact.html">${NAV.kontakt}</a>
    <a href="library.html">${NAV.lib}</a>
    <a href="${SHOP_URL}">${NAV.shop}</a>
  </nav>
</div>`;
  $('body').prepend(header);
}

/* Footer-Rechtslinks setzen (Impressum/Datenschutz/AGB → Brand Queen) */
function buildFooterLinks($) {
  const imp = SET.impressum_url || 'https://brandqueen.de/impressum';
  const dat = SET.datenschutz_url || 'https://brandqueen.de/datenschutzerklarung';
  const agb = SET.agb_url || 'https://brandqueen.de/agb';
  $('.footer-item-text').each(function () {
    const t = $(this).text().trim().toLowerCase();
    if (t.indexOf('impressum') === 0) $(this).attr('href', imp).attr('target', '_blank').attr('rel', 'noopener');
    if (t.indexOf('datenschutz') === 0) $(this).attr('href', dat).attr('target', '_blank').attr('rel', 'noopener');
  });
  const wrap = $('.footer-item-wrap').first();
  if (wrap.length && wrap.find('a').filter(function () { return $(this).text().trim().toUpperCase() === 'AGB'; }).length === 0) {
    wrap.find('.footer-item-text').removeClass('border-none');
    wrap.append('<a href="' + agb + '" target="_blank" rel="noopener" class="footer-item-text border-none">AGB</a>');
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const dir of ['css', 'js', 'images', 'admin']) {
  const from = path.join(SRC, dir);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, dir), { recursive: true });
}
for (const f of fs.readdirSync(SRC)) {
  if (/\.(ico|png|svg|webmanifest|xml|txt)$/i.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
}

/* Library-Link in die Navigation einfügen (nach Contact) */
function injectLibraryNav($) {
  if ($('.nav-menu a.nav-link[href="library.html"]').length) return;
  const contactLi = $('.nav-menu .nav-list').filter((i, el) => $(el).find('a.nav-link[href*="contact.html"]').length).first();
  if (contactLi.length) {
    contactLi.after('<li class="nav-list"><a href="library.html" class="nav-link">Library</a><div class="nav-item-line"></div></li>');
  }
}

/* Burger-Vollbildmenü um Library + Shop ergänzen */
function injectMobileNav($) {
  const ul = $('.nav-menu.hamburger').first();
  if (!ul.length || ul.find('a[href="library.html"]').length) return;
  const kontakt = ul.find('.hamburger-list').filter((i, el) => $(el).find('a[href*="contact.html"]').length).first();
  const lib = '<li class="hamburger-list"><a href="library.html" class="hamburger-item-wrap w-inline-block"><h2 class="hamburger-list-item">Library</h2></a></li>';
  const shop = '<li class="hamburger-list"><a href="https://hiddenqueen-2.myshopify.com" class="hamburger-item-wrap w-inline-block"><h2 class="hamburger-list-item">Shop</h2></a></li>';
  kontakt.length ? kontakt.after(lib + shop) : ul.append(lib + shop);
}

/* Robustes Nav-/Preloader-Skript einbinden */
function injectScript($) {
  if (!$('script[src="js/hq.js"]').length) $('body').append('<script src="js/hq.js"></script>');
}

/* HTML-Seiten verarbeiten (Inhalte einspielen) */
for (const page of fs.readdirSync(SRC)) {
  if (!page.endsWith('.html')) continue;
  const $ = cheerio.load(fs.readFileSync(path.join(SRC, page), 'utf8'), { decodeEntities: false });
  const jsonPath = path.join(SRC, 'content', page.replace('.html', '.json'));
  const fields = MAP[page];
  if (fields && fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    for (const f of fields) {
      const val = data[f.key];
      if (val == null || val === '') continue;
      const el = $(f.sel).eq(f.idx || 0);
      if (!el.length) { console.warn('  ! Selektor fehlt:', page, f.key, f.sel); continue; }
      if (f.attr) { el.attr(f.attr, val); if (f.dropSrcset) { el.removeAttr('srcset'); el.removeAttr('sizes'); } }
      else if (f.html) el.html(val);
      else el.text(val);
    }
  }
  buildNav($);
  buildFooterLinks($);
  injectScript($);
  bustAssets($);
  fs.writeFileSync(path.join(DIST, page), $.html());
  console.log('✓', page);
}

/* ---- The Queen's Library ---- */
const libDir = path.join(SRC, 'content', 'library');
if (fs.existsSync(libDir)) {
  const fmtDate = d => { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); };
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const articles = fs.readdirSync(libDir).filter(f => f.endsWith('.md')).map(f => {
    const g = matter(fs.readFileSync(path.join(libDir, f), 'utf8'));
    return { slug: f.replace(/\.md$/, ''), ...g.data, bodyHtml: marked.parse(g.content || '') };
  }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  function shell(title, contentHtml) {
    const $ = cheerio.load(fs.readFileSync(path.join(SRC, 'contact.html'), 'utf8'), { decodeEntities: false });
    $('title').text(title);
    buildNav($);
    buildFooterLinks($);
    injectScript($);
    bustAssets($);
    $('section').not('.footer').remove();
    $('section.footer').before(contentHtml);
    return $.html();
  }

  const cards = articles.map(a => `
        <a class="ql-card" href="article-${a.slug}.html">
          <span class="ql-card__img" style="background-image:url('${a.cover || '/images/c-hero.jpg'}')"></span>
          <span class="ql-card__date">${fmtDate(a.date)}</span>
          <span class="ql-card__title">${esc(a.title)}</span>
          <span class="ql-card__excerpt">${esc(a.excerpt)}</span>
        </a>`).join('');

  const indexContent = `
    <section class="section ql-page">
      <div class="big-container w-container">
        <h1 class="ql-hero">The Queen's Library</h1>
        <p class="home-content-para ql-intro">Gedanken, Geschichten und Hintergründe aus der Welt der Hidden Queen.</p>
        <div class="ql-grid">${cards}</div>
      </div>
    </section>`;
  fs.writeFileSync(path.join(DIST, 'library.html'), shell("The Queen's Library | The Hiddenqueen", indexContent));

  for (const a of articles) {
    const cover = a.cover ? `<span class="ql-article__cover" style="background-image:url('${a.cover}')"></span>` : '';
    const content = `
    <section class="section ql-page">
      <div class="ql-article-wrap">
        <a class="ql-back" href="library.html">&larr; The Queen's Library</a>
        <div class="ql-article__date">${fmtDate(a.date)}</div>
        <h1 class="ql-article__title">${esc(a.title)}</h1>
        ${cover}
        <article class="ql-article">${a.bodyHtml}</article>
      </div>
    </section>`;
    fs.writeFileSync(path.join(DIST, `article-${a.slug}.html`), shell(`${a.title} | The Hiddenqueen`, content));
  }
  console.log('✓ The Queen\'s Library:', articles.length, 'Artikel');
}

console.log('Build fertig → dist/');

/**
 * Build: spielt Inhalte ins Webflow-HTML (Design 1:1),
 * generiert "The Queen's Library" (Übersicht + Artikelseiten).
 * Ausgabe nach dist/. CSS/JS/Bilder werden kopiert.
 *
 * INHALTSQUELLE:
 *   1. WordPress (wenn Umgebungsvariable WP_CONTENT_URL gesetzt ist) —
 *      Sabrina pflegt alles im WordPress, der REST-Endpoint /wp-json/hq/v1/content
 *      liefert sämtliche Texte/Bilder/Artikel als JSON.
 *   2. Fallback: lokale content/*.json + content/library/*.md
 *      (greift automatisch, falls WordPress nicht erreichbar ist —
 *      so bricht NIE ein Deploy, die Seite bleibt mit dem letzten Stand online).
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

// Wird in main() befüllt (aus WordPress oder lokal)
let SET = {};
let SHOP_URL = 'https://hiddenqueen-2.myshopify.com';
let NAV = {};

/* ----------------------------------------------------------------------------
 * INHALTE LADEN — WordPress mit Fallback auf lokale Dateien
 * ------------------------------------------------------------------------- */

/* Lokale Inhalte (Fallback / Standard) im einheitlichen Format einlesen */
function loadLocal() {
  const pages = {};
  for (const page of Object.keys(MAP)) {
    const jsonPath = path.join(SRC, 'content', page.replace('.html', '.json'));
    if (fs.existsSync(jsonPath)) {
      try { pages[page] = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
      catch (e) { pages[page] = {}; }
    } else {
      pages[page] = {};
    }
  }

  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(path.join(SRC, 'content', 'settings.json'), 'utf8')); }
  catch (e) { settings = {}; }

  const library = [];
  const libDir = path.join(SRC, 'content', 'library');
  if (fs.existsSync(libDir)) {
    for (const f of fs.readdirSync(libDir).filter(f => f.endsWith('.md'))) {
      const g = matter(fs.readFileSync(path.join(libDir, f), 'utf8'));
      library.push({
        slug: f.replace(/\.md$/, ''),
        title: g.data.title,
        date: g.data.date,
        excerpt: g.data.excerpt,
        cover: g.data.cover,
        bodyHtml: marked.parse(g.content || ''),
      });
    }
  }

  return { settings, pages, library };
}

/* WordPress-Inhalte über die lokalen legen (WP gewinnt, leere Werte ignorieren) */
function mergeWp(local, wp) {
  const out = { settings: { ...local.settings }, pages: {}, library: local.library };

  // Einstellungen
  if (wp.settings && typeof wp.settings === 'object') {
    for (const [k, v] of Object.entries(wp.settings)) {
      if (v != null && v !== '') out.settings[k] = v;
    }
  }

  // Seiten-Felder
  for (const page of Object.keys(MAP)) {
    out.pages[page] = { ...(local.pages[page] || {}) };
    const wpPage = wp.pages && wp.pages[page];
    if (wpPage && typeof wpPage === 'object') {
      for (const [k, v] of Object.entries(wpPage)) {
        if (v != null && v !== '') out.pages[page][k] = v;
      }
    }
  }

  // Library: nur ersetzen, wenn WordPress tatsächlich Artikel liefert
  if (Array.isArray(wp.library) && wp.library.length) {
    out.library = wp.library.map(a => ({
      slug: a.slug,
      title: a.title,
      date: a.date,
      excerpt: a.excerpt,
      cover: a.cover,
      // WP liefert fertiges HTML (bodyHtml); Fallback: Markdown (body)
      bodyHtml: a.bodyHtml != null ? a.bodyHtml : marked.parse(a.body || ''),
    }));
  }

  return out;
}

async function loadContent() {
  const local = loadLocal();
  const url = process.env.WP_CONTENT_URL;
  if (!url) {
    console.log('• Inhaltsquelle: lokale Dateien (WP_CONTENT_URL nicht gesetzt)');
    return local;
  }
  try {
    const headers = { 'Accept': 'application/json' };
    if (process.env.WP_CONTENT_TOKEN) headers['X-HQ-Token'] = process.env.WP_CONTENT_TOKEN;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const wp = await res.json();
    console.log('• Inhaltsquelle: WordPress (' + url + ')');
    return mergeWp(local, wp);
  } catch (e) {
    console.warn('! WordPress nicht erreichbar (' + e.message + ') → nutze lokale Inhalte als Sicherheitsnetz');
    return local;
  }
}

/* ----------------------------------------------------------------------------
 * HTML-AUFBAU (unverändert — Design bleibt 1:1)
 * ------------------------------------------------------------------------- */

/* Versioniert lokale CSS/JS-Verweise, damit Browser nie alte Dateien cachen */
function bustAssets($) {
  $('link[rel="stylesheet"]').each(function () { const h = $(this).attr('href'); if (h && /^css\//.test(h) && h.indexOf('?') === -1) $(this).attr('href', h + '?v=' + BUILDID); });
  $('script[src]').each(function () { const s = $(this).attr('src'); if (s && /^js\//.test(s) && s.indexOf('?') === -1) $(this).attr('src', s + '?v=' + BUILDID); });
}

/* Altes Webflow-Menü entfernen und eigenes, einfaches Menü einsetzen */
function buildNav($) {
  $('.navbar').remove();
  $('.menu').remove();
  const header = `
<header class="hq-header">
  <a class="hq-logo" href="/"><img src="images/HiddenQueen-Logo.svg" alt="The Hiddenqueen"></a>
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
    <a href="/">Home</a>
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
  // Externe Links (http…) im neuen Tab; interne Rechtsseiten (/impressum) im selben Tab.
  const setLink = (el, url) => {
    el.attr('href', url);
    if (/^https?:/i.test(url)) el.attr('target', '_blank').attr('rel', 'noopener');
    else el.removeAttr('target').removeAttr('rel');
  };
  $('.footer-item-text').each(function () {
    const t = $(this).text().trim().toLowerCase();
    if (t.indexOf('impressum') === 0) setLink($(this), imp);
    if (t.indexOf('datenschutz') === 0) setLink($(this), dat);
  });
  const wrap = $('.footer-item-wrap').first();
  if (wrap.length && wrap.find('a').filter(function () { return $(this).text().trim().toUpperCase() === 'AGB'; }).length === 0) {
    wrap.find('.footer-item-text').removeClass('border-none');
    wrap.append('<a href="' + agb + '" target="_blank" rel="noopener" class="footer-item-text border-none">AGB</a>');
  }
}

/* Off-brand-Reste der Webflow-Vorlage (exovia/edeldark) aus dem Output entfernen */
function stripOffBrand($) {
  $('.section.font, .section.labeled, .section.about-slider, .color-card-wrap, .round-circle-wrap').remove();
}

/* Neutralisiert NUR übrig gebliebene Vorlagen-Alt-Texte. Läuft VOR dem Einspielen
   der Inhalte, damit selbst gepflegte Alt-Texte anschließend gewinnen. */
function cleanTemplateAlts($) {
  const bad = /edel ?dark|evil dark|gold (dress|gown|ball)|dark theme|web ?design|factor3|business card|hamburg|chandelier|vintage sofa/i;
  $('img[alt]').each(function () {
    const a = $(this).attr('alt');
    if (a && bad.test(a)) $(this).attr('alt', 'The Hiddenqueen');
  });
}

/* Interne Links extensionslos machen: index.html → "/", gallery.html → "/gallery" usw. */
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

/* Robustes Nav-/Preloader-Skript einbinden */
function injectScript($) {
  if (!$('script[src="js/hq.js"]').length) $('body').append('<script src="js/hq.js"></script>');
}

/* Cookie-Consent (CookieConsent v3, Orest Bida) – Anthrazit/Rosegold, Du-Form */
function injectCookieConsent($) {
  if ($('link[href*="cookieconsent@3"]').length) return;
  $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.css">');
  $('head').append("<style>#cc-main{--cc-font-family:'Inter',sans-serif;--cc-btn-primary-bg:#cf9c8c;--cc-btn-primary-color:#1a1714;--cc-btn-primary-hover-bg:#d9ac9d;--cc-btn-secondary-hover-bg:#2a2521;--cc-toggle-on-bg:#cf9c8c;--cc-link-color:#cf9c8c;--cc-btn-border-radius:2px}</style>");
  $('body').append('<script src="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js"></script>');
  $('body').append('<script src="js/cc-init.js"></script>');
}

/* ----------------------------------------------------------------------------
 * MAIN
 * ------------------------------------------------------------------------- */
/* SEO/Meta in den <head> schreiben (nur wenn ein Wert gepflegt ist; leer = bleibt). */
function setMeta($, attr, key, val) {
  let el = $('meta[' + attr + '="' + key + '"]').first();
  if (!el.length) { $('head').append('<meta ' + attr + '="' + key + '" content="">'); el = $('meta[' + attr + '="' + key + '"]').first(); }
  el.attr('content', val);
}
function applySeo($, data) {
  if (!data) return;
  if (data.seo_title) {
    $('title').first().text(data.seo_title);
    setMeta($, 'property', 'og:title', data.seo_title);
    setMeta($, 'name', 'twitter:title', data.seo_title);
  }
  if (data.seo_description) {
    setMeta($, 'name', 'description', data.seo_description);
    setMeta($, 'property', 'og:description', data.seo_description);
    setMeta($, 'name', 'twitter:description', data.seo_description);
  }
  if (data.seo_keywords) setMeta($, 'name', 'keywords', data.seo_keywords);
}

async function main() {
  const CONTENT = await loadContent();

  // Einstellungen / Navigation aus den geladenen Inhalten
  SET = CONTENT.settings || {};
  SHOP_URL = SET.shop_url || 'https://hiddenqueen-2.myshopify.com';
  NAV = {
    gal: SET.nav_galerie || 'Galerie',
    ueber: SET.nav_ueber || 'Über',
    kontakt: SET.nav_kontakt || 'Kontakt',
    lib: SET.nav_library || 'Library',
    shop: SET.nav_shop || 'Shop',
  };

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const dir of ['css', 'js', 'images', 'admin']) {
    const from = path.join(SRC, dir);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, dir), { recursive: true });
  }
  for (const f of fs.readdirSync(SRC)) {
    if (/\.(ico|png|svg|webmanifest|xml|txt)$/i.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
  }

  /* HTML-Seiten verarbeiten (Inhalte einspielen) */
  for (const page of fs.readdirSync(SRC)) {
    if (!page.endsWith('.html')) continue;
    const $ = cheerio.load(fs.readFileSync(path.join(SRC, page), 'utf8'), { decodeEntities: false });
    const fields = MAP[page];
    const data = CONTENT.pages[page];
    cleanTemplateAlts($);
    if (fields && data) {
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
    applySeo($, data);
    stripOffBrand($);
    buildNav($);
    buildFooterLinks($);
    cleanHomeLinks($);
    injectScript($);
    injectCookieConsent($);
    bustAssets($);
    fs.writeFileSync(path.join(DIST, page), $.html());
    console.log('✓', page);
  }

  /* ---- The Queen's Library ---- */
  const articles = (CONTENT.library || [])
    .filter(a => a && a.title)
    .map(a => ({ ...a, slug: a.slug || String(a.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  if (articles.length) {
    const fmtDate = d => { if (!d) return ''; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); };
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    function shell(title, contentHtml) {
      const $ = cheerio.load(fs.readFileSync(path.join(SRC, 'contact.html'), 'utf8'), { decodeEntities: false });
      $('title').text(title);
      stripOffBrand($);
      buildNav($);
      buildFooterLinks($);
      injectScript($);
      injectCookieConsent($);
      bustAssets($);
      $('section').not('.footer').remove();
      $('section.footer').before(contentHtml);
      cleanHomeLinks($);
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
        <article class="ql-article">${a.bodyHtml || ''}</article>
      </div>
    </section>`;
      fs.writeFileSync(path.join(DIST, `article-${a.slug}.html`), shell(`${a.title} | The Hiddenqueen`, content));
    }
    console.log('✓ The Queen\'s Library:', articles.length, 'Artikel');
  }

  console.log('Build fertig → dist/');
}

main().catch(err => { console.error('Build fehlgeschlagen:', err); process.exit(1); });

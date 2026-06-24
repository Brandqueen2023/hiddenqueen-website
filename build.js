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
  injectLibraryNav($);
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
    injectLibraryNav($);
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

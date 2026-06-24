/**
 * Build: nimmt die Webflow-Seiten (Design bleibt 1:1) und spielt die
 * bearbeitbaren Inhalte aus content/<seite>.json hinein. Ausgabe nach dist/.
 * Bilder/CSS/JS werden 1:1 kopiert. Der Editor (/admin) bearbeitet die JSON-
 * Dateien und den images-Ordner; Vercel baut bei jedem Commit neu.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SRC = __dirname;
const DIST = path.join(SRC, 'dist');
const MAP = require('./content/_map.js');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Statische Ordner 1:1 kopieren
for (const dir of ['css', 'js', 'images', 'admin']) {
  const from = path.join(SRC, dir);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(DIST, dir), { recursive: true });
}
// Einzelne Root-Assets kopieren
for (const f of fs.readdirSync(SRC)) {
  if (/\.(ico|png|svg|webmanifest|xml|txt)$/i.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
}

// HTML-Seiten verarbeiten
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
      if (!el.length) { console.warn('  ! Selektor nicht gefunden:', page, f.key, f.sel); continue; }
      if (f.attr) {
        el.attr(f.attr, val);
        if (f.dropSrcset) { el.removeAttr('srcset'); el.removeAttr('sizes'); }
      } else if (f.html) {
        el.html(val);
      } else {
        el.text(val);
      }
    }
  }
  fs.writeFileSync(path.join(DIST, page), $.html());
  console.log('✓', page);
}
console.log('Build fertig → dist/');

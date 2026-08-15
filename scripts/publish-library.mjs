// The HiddenQueen - Publisher fuer The Queen's Library
// Erzeugt aus einem freigegebenen Beitrag (JSON) eine fertige Library-Seite im
// bestehenden Seitenaufbau, traegt die Karte in library/index.html ein und
// ergaenzt die sitemap.xml.
//
// Aufruf:
//   node scripts/publish-library.mjs pfad/zum/beitrag.json
//
// Der Beitrag wird NICHT deployed. Deploy ist ein eigener, bewusster Schritt:
//   node build.js  und danach  git commit + git push  (Vercel baut aus GitHub)
//
// JSON-Form:
// {
//   "slug": "wenn-nichts-passieren-muss",
//   "meta": "Über Nähe",                  // kleine Zeile ueber der H1 und auf der Karte
//   "title": "Wenn nichts passieren muss",// Karten- und Seitentitel, ohne Punkt
//   "teaser": "…",                         // Text auf der Karte in der Uebersicht
//   "metaDescription": "…",                // <meta description> und og:description
//   "bild": "/images/haltung-grenzen.webp",
//   "bildAlt": "…",                        // echter Alternativtext, nicht erfunden
//   "paras": ["…", "…"],                  // Fliesstext, ein Eintrag je Absatz
//   "impulse": ["…", "…"],                // optional, Kasten "Für heute Abend"
//   "impulseLabel": "Für heute Abend",     // optional
//   "backHref": "/kollektionen",           // optional, Verweis am Ende
//   "backText": "Die Kollektionen ansehen" // optional
// }

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
const LIBRARY_DIR = resolve(SITE, 'library');
const UEBERSICHT = resolve(LIBRARY_DIR, 'index.html');
const SITEMAP = resolve(SITE, 'sitemap.xml');
const BASE = 'https://www.thehiddenqueen.de';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function heute() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Artikelseite ------------------------------------------------- */

function renderArticle(p) {
  const url = `${BASE}/library/${p.slug}`;
  const h1 = p.title.endsWith('.') ? p.title : p.title + '.';
  const paras = (p.paras || []).map((t) => `        <p>${esc(t)}</p>`).join('\n\n');

  const impulse = (p.impulse || []).length
    ? `
      <div class="hq-impulses">
        <p class="hq-impulses-label">${esc(p.impulseLabel || 'Für heute Abend')}</p>
        <ul class="hq-impulses-list">
${p.impulse.map((i) => `          <li>${esc(i)}</li>`).join('\n')}
        </ul>
      </div>
`
    : '';

  const back = p.backHref
    ? `
      <div class="hq-article-back">
        <a href="${esc(p.backHref)}" class="hq-link-arrow">${esc(p.backText || 'Zurück zur Library')}</a>
      </div>
`
    : `
      <div class="hq-article-back">
        <a href="/library" class="hq-link-arrow">Zurück zu The Queen's Library</a>
      </div>
`;

  return `<!DOCTYPE html><html lang="de"><head>
  <meta charset="utf-8">
  <title>${esc(p.title)} | The Queen's Library | The HiddenQueen</title>
  <meta name="description" content="${esc(p.metaDescription)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(p.title)} | The Queen's Library">
  <meta property="og:description" content="${esc(p.metaDescription)}">
  <meta property="og:image" content="${BASE}/images/og-share.jpg">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <link href="/css/normalize.css" rel="stylesheet" type="text/css">
  <link href="/css/webflow.css" rel="stylesheet" type="text/css">
  <link href="/css/rebecca-49efb2-f56c2ef41e7f7513b87432e5.webflow.css" rel="stylesheet" type="text/css">
  <link href="/css/hq-brand.css" rel="stylesheet" type="text/css">
  <link href="/css/hq-fonts.css" rel="stylesheet" type="text/css">
  <link href="/images/favicon.png" rel="shortcut icon" type="image/x-icon">
  <link href="/images/webclip.png" rel="apple-touch-icon">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": ${JSON.stringify(p.title)},
  "description": ${JSON.stringify(p.metaDescription)},
  "author": { "@type": "Organization", "name": "The HiddenQueen" },
  "publisher": { "@type": "Organization", "name": "The HiddenQueen", "logo": { "@type": "ImageObject", "url": "${BASE}/images/hiddenqueen-logo-dark.svg" } },
  "mainEntityOfPage": "${url}",
  "datePublished": "${p.datum || heute()}"
}
  </script>
</head>
<body>
<a class="hq-skip-link" href="#hq-main">Zum Inhalt springen</a>
<main id="hq-main">

  <section class="hq-hero" style="min-height:44vh;">
    <div class="hq-hero-media"><img src="${esc(p.bild)}" alt="${esc(p.bildAlt)}" style="--fp:50% 30%" sizes="100vw" fetchpriority="high"></div>
    <div class="hq-hero-content">
      <span class="hq-eyebrow">The Queen's Library</span>
      <h1 class="hq-h1">${esc(h1)}</h1>
    </div>
  </section>

  <section class="hq-section hq-section--ivory">
    <div class="hq-inner hq-article">
      <p class="hq-article-meta">${esc(p.meta)}</p>
      <div class="hq-article-body">
${paras}
      </div>
${impulse}${back}    </div>
  </section>

</main>


</body></html>
`;
}

/* ---------- Karte in der Uebersicht -------------------------------------- */

function insertCard(p) {
  let html = readFileSync(UEBERSICHT, 'utf8');
  const href = `/library/${p.slug}`;
  if (html.includes(`href="${href}"`)) {
    console.log(`Karte fuer ${p.slug} existiert bereits in library/index.html, uebersprungen.`);
    return;
  }
  const card = `        <a class="hq-library-item" href="${href}">
          <span class="hq-media-45"><img src="${esc(p.bild)}" alt="${esc(p.bildAlt)}" style="--fp:50% 40%" loading="lazy" decoding="async"></span>
          <span>
            <span class="hq-library-item-meta">${esc(p.meta)}</span>
            <h2 class="hq-library-item-title">${esc(p.title)}</h2>
            <p class="hq-library-item-dek">${esc(p.teaser)}</p>
          </span>
        </a>

`;
  // Zeilenende offen lassen, die Datei kann CRLF haben.
  const marker = /<div class="hq-library-list">\r?\n/;
  if (!marker.test(html)) {
    throw new Error('Liste hq-library-list in library/index.html nicht gefunden, nichts geaendert.');
  }
  // Neuester Beitrag steht oben.
  html = html.replace(marker, (m) => m + '\n' + card);
  writeFileSync(UEBERSICHT, html);
  console.log(`Karte fuer ${p.slug} in library/index.html eingetragen.`);
}

/* ---------- Sitemap ------------------------------------------------------ */

function insertSitemap(p) {
  let xml = readFileSync(SITEMAP, 'utf8');
  const loc = `${BASE}/library/${p.slug}`;
  if (xml.includes(`<loc>${loc}</loc>`)) {
    console.log(`Sitemap-Eintrag fuer ${p.slug} existiert bereits, uebersprungen.`);
    return;
  }
  const zeile = `  <url><loc>${loc}</loc><priority>0.6</priority></url>`;
  // Hinter den letzten vorhandenen Library-Eintrag haengen, damit die Library in
  // der Datei beisammen bleibt. Zeilenweise, damit CRLF nicht stoert.
  const zeilen = xml.split('\n');
  let letzte = -1;
  for (let i = 0; i < zeilen.length; i++) {
    if (zeilen[i].includes(`${BASE}/library`)) letzte = i;
  }
  if (letzte >= 0) {
    zeilen.splice(letzte + 1, 0, zeile);
    xml = zeilen.join('\n');
  } else {
    xml = xml.replace('</urlset>', zeile + '\n</urlset>');
  }
  writeFileSync(SITEMAP, xml);
  console.log(`Sitemap-Eintrag fuer ${p.slug} ergaenzt.`);
}

/* ---------- Lauf --------------------------------------------------------- */

function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Kein JSON-Pfad angegeben.');
    process.exit(1);
  }
  const p = JSON.parse(readFileSync(jsonPath, 'utf8'));
  for (const k of ['slug', 'title', 'teaser', 'metaDescription', 'meta', 'bild', 'bildAlt']) {
    if (!p[k]) {
      console.error(`Feld fehlt im JSON: ${k}`);
      process.exit(1);
    }
  }
  if (!(p.paras || []).length) {
    console.error('Feld fehlt im JSON: paras');
    process.exit(1);
  }
  if (!existsSync(resolve(SITE, p.bild.replace(/^\//, '')))) {
    console.error(`Bild existiert nicht im Repo: ${p.bild}`);
    process.exit(1);
  }

  const out = resolve(LIBRARY_DIR, `${p.slug}.html`);
  const isNew = !existsSync(out);
  writeFileSync(out, renderArticle(p));
  console.log(`${isNew ? 'Neu' : 'Aktualisiert'}: library/${p.slug}.html`);
  insertCard(p);
  insertSitemap(p);
  console.log('FERTIG. Nichts deployed. Deploy bewusst mit:  node build.js  und  git push');
}

main();

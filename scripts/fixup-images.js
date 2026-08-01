/* Einmaliger Fixup: alle <img src="/images/NAME.jpg"> auf die neu erzeugten
 * WebP-Dateien + responsives srcset/sizes umstellen, LCP-Bilder priorisieren,
 * uebrige Bilder lazy laden (Masterauftrag Abschnitt 31). */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const WIDTHS = [640, 960, 1280, 1600];

function srcsetFor(name) {
  return WIDTHS.map((w) => `/images/${name}-${w}.webp ${w}w`).join(', ');
}

for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith('.html')) continue;
  const p = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(p, 'utf8'), { decodeEntities: false });
  let changed = false;

  $('img[src^="/images/"]').each(function () {
    const src = $(this).attr('src');
    const m = src.match(/^\/images\/([a-z0-9-]+)\.jpg$/);
    if (!m) return;
    const name = m[1];
    const isHero = $(this).closest('.hq-hero-media').length > 0;
    const inTwoCol = $(this).closest('.hq-grid-2').length > 0;

    $(this).attr('src', `/images/${name}.webp`);
    $(this).attr('srcset', srcsetFor(name));

    if (isHero) {
      $(this).attr('sizes', '100vw');
      $(this).attr('fetchpriority', 'high');
    } else {
      $(this).attr('loading', 'lazy');
      $(this).attr('decoding', 'async');
      $(this).attr('sizes', inTwoCol
        ? '(max-width:900px) 100vw, 50vw'
        : '(max-width:560px) 100vw, (max-width:900px) 50vw, 33vw');
    }
    changed = true;
  });

  if (changed) {
    fs.writeFileSync(p, $.html());
    console.log('✓', file);
  }
}

/* Einmaliger Fixup: Alt-Texte aus assets-source/BILDMANIFEST.md in die
 * <img>-Tags aller Seiten uebernehmen (Barrierefreiheit, Abschnitt 30.7). */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');

const ALT = {
  'hero-home': 'Schwarze HiddenQueen Box mit geprägtem Muster neben einem kupferfarbenen Umschlag und einer Kerze auf rosé Seide',
  'collection-the-invitation': 'Maskierte Karte und schwarze Box vor einer weich unscharfen Person im Hintergrund',
  'hero-haltung': 'Cremefarbene Maske vor einer schwarzen, geprägten Mappe und einem kupferfarbenen Umschlag',
  'hero-private-preview': 'Geöffnete schwarze Box mit rosé Seidenfutter, Karte und Kerze im Hintergrund',
  'collection-blind-trust': 'Schwarze geprägte Mappe vor einer weich unscharfen sitzenden Person',
  'detail-material-1': 'Nahaufnahme einer cremefarbenen Maske mit goldener Verzierung',
  'detail-material-2': 'Maske auf einer dunklen, glänzenden Oberfläche mit geprägtem Muster',
  'collection-after-midnight': 'Cremefarbene Maske neben einer brennenden schwarzen Kerze',
  'collection-secret-drawer': 'Schwarze Box, im Vordergrund unscharf Haare und eine Hand',
  'haltung-gestaltung': 'Zwei brennende Kerzen und ein Zweig vor einer kupferfarbenen, geprägten Mappe',
  'hero-kollektionen': 'Zwei brennende Kerzen vor einem verpackten Geschenk mit unscharfem Trockengras',
  'hero-kontakt': 'Cremefarbene Maske neben einer kupferfarbenen, geprägten Karte',
  'collection-queens-ritual': 'Hand hält eine schwarze Kerze neben einer Maske und einer geprägten Box',
  'collection-the-collection': 'Maske und geprägte Karte auf einem dunklen Tisch',
  'hero-faq': 'Zwei Kerzen und eine Maske vor unscharfem, hellem Stoff',
  'collection-the-surrender': 'Brennende Kerze und cremefarbene Maske vor weich unscharfem Hintergrund',
  'detail-material-3': 'Ausschnitt der geprägten Musterfläche der schwarzen HiddenQueen Box',
  'selbstbestimmung': 'Ausschnitt des offenen Boxinneren mit Karte auf rosé Seide',
  'haltung-rolle': 'Ausschnitt einer cremefarbenen Maske ohne Hintergrundperson',
  'haltung-grenzen': 'Ausschnitt von Maske und geprägter Karte',
};

for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith('.html')) continue;
  const p = path.join(ROOT, file);
  const $ = cheerio.load(fs.readFileSync(p, 'utf8'), { decodeEntities: false });
  let changed = false;

  $('img[src^="/images/"]').each(function () {
    const src = $(this).attr('src');
    const m = src.match(/^\/images\/([a-z0-9-]+)\.webp$/);
    if (!m || !ALT[m[1]]) return;
    $(this).attr('alt', ALT[m[1]]);
    changed = true;
  });

  if (changed) {
    fs.writeFileSync(p, $.html());
    console.log('✓', file);
  }
}

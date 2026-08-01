/* Verarbeitet die aus der Canva-Kopie exportierten, bereits bereinigten
 * Fotoseiten (assets-source/canva-export/page-NN.png) zu optimierten
 * WebP-Dateien inkl. responsiver Groessen fuer images/.
 *
 * Keine Farbkorrektur, keine Retusche - nur verlustarme Formatkonvertierung,
 * Skalierung und (fuer vier Positionen) ein reiner Ausschnitt desselben
 * bereits genehmigten Fotos (siehe Bildmanifest.md).
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'assets-source', 'canva-export');
const OUT = path.join(__dirname, '..', 'images');
const WIDTHS = [640, 960, 1280, 1600];

const JOBS = [
  { out: 'hero-home', page: 1 },
  { out: 'collection-the-invitation', page: 2 },
  { out: 'hero-haltung', page: 3 },
  { out: 'hero-private-preview', page: 4 },
  { out: 'collection-blind-trust', page: 5 },
  { out: 'detail-material-1', page: 6 },
  { out: 'detail-material-2', page: 7 },
  { out: 'collection-after-midnight', page: 8 },
  { out: 'collection-secret-drawer', page: 9 },
  { out: 'haltung-gestaltung', page: 12 },
  { out: 'hero-kollektionen', page: 13 },
  { out: 'hero-kontakt', page: 14 },
  { out: 'collection-queens-ritual', page: 15, crop: { left: 0.38, top: 0.30, w: 0.55, h: 0.6875 } },
  { out: 'collection-the-collection', page: 16 },
  { out: 'hero-faq', page: 17 },
  { out: 'collection-the-surrender', page: 18 },
  // Zweitverwendung desselben freigegebenen Fotos, jeweils anderer Ausschnitt:
  { out: 'detail-material-3', page: 1, crop: { left: 0.55, top: 0.55, w: 0.45, h: 0.4 } },
  { out: 'selbstbestimmung', page: 4, crop: { left: 0.1, top: 0.5, w: 0.8, h: 0.42 } },
  { out: 'haltung-rolle', page: 2, crop: { left: 0.45, top: 0.62, w: 0.5, h: 0.35 } },
  { out: 'haltung-grenzen', page: 14, crop: { left: 0.3, top: 0.5, w: 0.6, h: 0.45 } },
];

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const job of JOBS) {
    const srcFile = path.join(SRC, `page-${String(job.page).padStart(2, '0')}.png`);
    let pipeline = sharp(srcFile);
    const meta = await pipeline.metadata();

    if (job.crop) {
      const left = Math.round(job.crop.left * meta.width);
      const top = Math.round(job.crop.top * meta.height);
      const w = Math.round(job.crop.w * meta.width);
      const h = Math.round(job.crop.h * meta.height);
      pipeline = sharp(srcFile).extract({ left, top, width: w, height: h });
    }

    const base = pipeline.clone();
    // Haupt-Datei (Fallback ohne srcset)
    await base.clone().resize({ width: 1600 }).webp({ quality: 84 }).toFile(path.join(OUT, `${job.out}.webp`));

    for (const w of WIDTHS) {
      await base.clone().resize({ width: w }).webp({ quality: 82 })
        .toFile(path.join(OUT, `${job.out}-${w}.webp`));
    }
    console.log('✓', job.out);
  }
  console.log('Fertig:', JOBS.length, 'Bilder verarbeitet.');
}

run().catch((e) => { console.error(e); process.exit(1); });

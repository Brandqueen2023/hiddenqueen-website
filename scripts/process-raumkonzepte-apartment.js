/* Verarbeitet die vier freigegebenen Apartment-Konzeptbilder aus
 * Projekte_W4All/Test/04_Marketing/The Hidden Queen/Bilder/Raumkonzept/Apartment/
 * zu optimierten WebP-Dateien inkl. responsiver Groessen fuer images/,
 * nach demselben Muster wie scripts/process-raumkonzepte-schlafzimmer.js.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC_DIR = 'C:/OneDrive - Brandqueen GmbH/Projekte_W4All/Test/04_Marketing/The Hidden Queen/Bilder/Raumkonzept/Apartment';
const OUT = path.join(__dirname, '..', 'images');
const WIDTHS = [640, 960, 1280, 1600];

const JOBS = [
  { out: 'raumkonzept-apartment-schlafzimmer', src: 'file_00000000c94481f49901d77f681b7d46.png' },
  { out: 'raumkonzept-apartment-wohnzimmer', src: 'file_00000000675482438d87cc9a9004faef.png' },
  { out: 'raumkonzept-apartment-badezimmer', src: 'file_000000003c0c81f4b163e5ed5f5aea66.png' },
  { out: 'raumkonzept-apartment-kueche', src: 'file_00000000cd6481f4820a4ea614f585e7.png' },
];

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const job of JOBS) {
    const srcFile = path.join(SRC_DIR, job.src);
    const meta = await sharp(srcFile).metadata();
    console.log(job.src, meta.width, meta.height, meta.format);

    const base = sharp(srcFile);
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

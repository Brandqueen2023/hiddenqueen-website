/* Verarbeitet die zwei freigegebenen Schlafzimmer-Konzeptbilder aus
 * Projekte_W4All/Test/04_Marketing/The Hidden Queen/Bilder/Raumkonzept/
 * zu optimierten WebP-Dateien inkl. responsiver Groessen fuer images/,
 * nach demselben Muster wie scripts/process-images.js.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC_DIR = 'C:/OneDrive - Brandqueen GmbH/Projekte_W4All/Test/04_Marketing/The Hidden Queen/Bilder/Raumkonzept';
const OUT = path.join(__dirname, '..', 'images');
const WIDTHS = [640, 960, 1280, 1600];

const JOBS = [
  { out: 'raumkonzept-schlafzimmer-1', src: 'file_000000004398824389f94e5e4fe77d9f.png' },
  { out: 'raumkonzept-schlafzimmer-2', src: 'file_00000000fc84820eb69c5120ae1f2b73.png' },
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

/* Schneidet die Marken-Bilder exakt auf die Seitenverhältnisse der alten
 * Webflow-Bilder zu (cover + Fokus auf Motiv), damit das Layout 1:1 bleibt. */
const sharp = require('sharp');
const path = require('path');
const IMG = path.join(__dirname, 'images');
const p = f => path.join(IMG, f);

const OLD = {
  L_hero: 'imageye___-_imgi_2_women-gold-black-landscape-1-1920_1imageye___-_imgi_2_women-gold-black-landscape-1-1920.avif',
  P2: 'imageye___-_imgi_3_women-gold-black-portrait-2-1280_1imageye___-_imgi_3_women-gold-black-portrait-2-1280.avif',
  moodDark: 'imageye___-_imgi_4_style-moodbord-edeldark-dark_1imageye___-_imgi_4_style-moodbord-edeldark-dark.avif',
  ferrero: 'imageye___-_imgi_5_ferrero2-1920_1imageye___-_imgi_5_ferrero2-1920.avif',
  moodBright: 'imgi_1_style-moodbord-edeldark-bright.png',
  P1: 'imgi_3_women-gold-black-portrait-1-1280.png',
  photo06: 'photo_2025-12-06_11-47-17.jpg',
  clockLeft: 'imgi_5_clockLeft-edeldark-920.png',
  spiegel: 'imgi_6_spiegel-edeldark-920.png',
  chair: 'imgi_7_chair-edeldark-920.jpg',
  leuchter: 'imgi_8_leuchter-edeldark-920.png',
  stuck: 'imgi_9_stuck-edeldark-920.png',
  clockRight: 'imgi_10_clockRight-edeldark-920.png',
  landscape2: 'imgi_5_women-gold-black-landscape-2-1920.png',
  photo05: 'photo_2025-12-05_15-06-42.jpg',
  visiten8: 'imgi_8_visitenKartenNeu2.png',
  visiten9: 'imgi_9_visitenkarte_frontal-1920.png',
  pattern: 'imgi_10_pattern.png',
};

const HERO = 'hq-1-hero.jpg', CHAIR = 'hq-2-chair.jpg', TALL = 'hq-3-chair-tall.jpg', BED = 'hq-4-bed.jpg', KNEEL = 'hq-5-kneel.jpg';

const JOBS = [
  ['c-hero.jpg',        HERO,  'L_hero'],
  ['c-emotional.jpg',   CHAIR, 'P2'],
  ['c-about.jpg',       BED,   'moodDark'],
  ['c-contact.jpg',     KNEEL, 'ferrero'],
  ['c-about-one.jpg',   TALL,  'moodBright'],
  ['c-about-two.jpg',   BED,   'P1'],
  ['c-about-label.jpg', KNEEL, 'photo06'],
  ['c-slider-1.jpg',    HERO,  'clockLeft'],
  ['c-slider-2.jpg',    CHAIR, 'spiegel'],
  ['c-slider-3.jpg',    TALL,  'chair'],
  ['c-slider-4.jpg',    BED,   'leuchter'],
  ['c-slider-5.jpg',    KNEEL, 'stuck'],
  ['c-slider-6.jpg',    HERO,  'clockRight'],
  ['c-gal-portrait.jpg',CHAIR, 'P1'],
  ['c-gal-moodboard.jpg',BED,  'moodDark'],
  ['c-gal-landscape.jpg',HERO, 'landscape2'],
  ['c-gal-row1.jpg',    TALL,  'ferrero'],
  ['c-gal-row2.jpg',    KNEEL, 'photo05'],
  ['c-gal-row3.jpg',    HERO,  'visiten8'],
  ['c-gal-row4.jpg',    CHAIR, 'visiten9'],
  ['c-gal-row5.jpg',    BED,   'pattern'],
];

(async () => {
  for (const [out, src, oldKey] of JOBS) {
    const meta = await sharp(p(OLD[oldKey])).metadata();
    const ar = meta.width / meta.height;
    const w = Math.min(meta.width, 1400);
    const h = Math.round(w / ar);
    await sharp(p(src))
      .resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 82 })
      .toFile(p(out));
    console.log('✓', out, `${w}x${h}`, `(AR ${ar.toFixed(2)} von ${oldKey})`);
  }
  console.log('Zuschnitt fertig.');
})();

/**
 * Zuordnung: Inhaltsfeld (key) → Stelle im Webflow-HTML (CSS-Selektor).
 * html:true erlaubt Zeilenumbrüche (<br>), sonst reiner Text.
 * attr:'src' + dropSrcset:true → Bild austauschen (Vorschau-Feld im Editor).
 */
const img = (key, sel, idx = 0) => ({ key, sel, idx, attr: 'src', dropSrcset: true });

module.exports = {
  'index.html': [
    { key: 'hero_heading',    sel: '.hero-heading',         html: true },
    { key: 'section_heading', sel: '.section-heading',       html: true },
    { key: 'home_para',       sel: '.home-content-para' },
    { key: 'get_in_touch',    sel: '.getstart-text' },
    { key: 'branding_heading',sel: '.branding-heading' },
    { key: 'branding_sub',    sel: '.branding-sub-heading' },
    img('hero_image',     '.home-hero-image'),
    img('img_emotional',  '.home-geallary-image', 0),
    img('img_about',      '.home-geallary-image', 1),
    img('img_contact',    '.home-geallary-image', 2),
  ],
  'about.html': [
    { key: 'hero_heading',   sel: '.hero-heading',   html: true },
    { key: 'modern_heading', sel: '.section-heading', idx: 0 },
    { key: 'effect_para_1',  sel: '.effect-para',     idx: 0 },
    { key: 'effect_para_2',  sel: '.effect-para',     idx: 1 },
    { key: 'colors_heading', sel: '.section-heading', idx: 1 },
    { key: 'color_para',     sel: '.color-para' },
    { key: 'fonts_heading',  sel: '.section-heading', idx: 2 },
    { key: 'begleitung_heading', sel: '.section-heading', idx: 3 },
    { key: 'begleitung_para',    sel: '.home-content-para', idx: 0 },
    { key: 'get_in_touch',   sel: '.getstart-text' },
    { key: 'features_heading',sel: '.section-heading', idx: 4 },
    { key: 'features_para',  sel: '.home-content-para', idx: 1 },
    img('image_one', '.about-image-one'),
    img('image_two', '.about-image-two'),
    img('label_image', '.label-image'),
    img('slider_1', '.slider-image', 0),
    img('slider_2', '.slider-image', 1),
    img('slider_3', '.slider-image', 2),
    img('slider_4', '.slider-image', 3),
    img('slider_5', '.slider-image', 4),
    img('slider_6', '.slider-image', 5),
  ],
  'gallery.html': [
    { key: 'hero_heading', sel: '.hero-heading' },
    { key: 'branding_sub', sel: '.branding-sub-heading' },
    img('gal_portrait', '.home-geallary-image.gellary-one'),
    img('gal_moodboard','.home-geallary-image.about'),
    img('gal_three',    '.g3 .home-geallary-image'),
    img('gal_landscape','.home-geallary-image.g4'),
    img('gal_row1', '.home-geallary-image.row1'),
    img('gal_row2', '.home-geallary-image.row2'),
    img('gal_row3', '.home-geallary-image.row3'),
    img('gal_row4', '.home-geallary-image.row4'),
    img('gal_row5', '.home-geallary-image.row5'),
  ],
  'contact.html': [
    { key: 'hero_heading',   sel: '.hero-heading',   html: true },
    { key: 'intro_heading', sel: '.section-heading', idx: 0 },
    { key: 'direct_label',   sel: '.contact-small-heading', idx: 0 },
    { key: 'general_label',  sel: '.contact-small-heading', idx: 1 },
    { key: 'address',        sel: '.contact-normal-para', idx: 2, html: true },
    { key: 'begleitung_heading', sel: '.section-heading', idx: 1 },
    { key: 'begleitung_para',    sel: '.home-content-para' },
    { key: 'get_in_touch',   sel: '.getstart-text' },
  ],
};

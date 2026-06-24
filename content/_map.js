/**
 * Zuordnung: Inhaltsfeld (key) → Stelle im Webflow-HTML (CSS-Selektor).
 * html:true erlaubt Zeilenumbrüche (<br>), sonst reiner Text.
 * Wird sowohl vom Build (build.js) als auch vom Editor-Schema genutzt.
 */
module.exports = {
  'index.html': [
    { key: 'hero_heading',   sel: '.hero-heading',         html: true },
    { key: 'section_heading',sel: '.section-heading',       html: true },
    { key: 'home_para',      sel: '.home-content-para' },
    { key: 'get_in_touch',   sel: '.getstart-text' },
    { key: 'branding_heading',sel: '.branding-heading' },
    { key: 'branding_sub',   sel: '.branding-sub-heading' },
  ],
  'about.html': [
    { key: 'hero_heading',   sel: '.hero-heading',   html: true },
    { key: 'modern_heading', sel: '.section-heading', idx: 0 },
    { key: 'effect_para_1',  sel: '.effect-para',     idx: 0 },
    { key: 'effect_para_2',  sel: '.effect-para',     idx: 1 },
    { key: 'colors_heading', sel: '.section-heading', idx: 1 },
    { key: 'color_para',     sel: '.color-para' },
    { key: 'fonts_heading',  sel: '.section-heading', idx: 2 },
    { key: 'agency_heading', sel: '.section-heading', idx: 3 },
    { key: 'agency_para',    sel: '.home-content-para', idx: 0 },
    { key: 'get_in_touch',   sel: '.getstart-text' },
    { key: 'features_heading',sel: '.section-heading', idx: 4 },
    { key: 'features_para',  sel: '.home-content-para', idx: 1 },
  ],
  'gallery.html': [
    { key: 'hero_heading', sel: '.hero-heading' },
    { key: 'branding_sub', sel: '.branding-sub-heading' },
  ],
  'contact.html': [
    { key: 'hero_heading',   sel: '.hero-heading',   html: true },
    { key: 'exovia_heading', sel: '.section-heading', idx: 0 },
    { key: 'direct_label',   sel: '.contact-small-heading', idx: 0 },
    { key: 'general_label',  sel: '.contact-small-heading', idx: 1 },
    { key: 'address',        sel: '.contact-normal-para' },
    { key: 'agency_heading', sel: '.section-heading', idx: 1 },
    { key: 'agency_para',    sel: '.home-content-para' },
    { key: 'get_in_touch',   sel: '.getstart-text' },
  ],
};

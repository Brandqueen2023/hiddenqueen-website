/* Hidden Queen – eigenes, robustes Skript (unabhängig von Webflow) */
(function () {
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {

    /* 1) Preloader zügig ausblenden, nie Klicks blockieren */
    var pl = document.querySelector('.preloader');
    if (pl) {
      pl.style.pointerEvents = 'none';
      setTimeout(function () {
        pl.style.transition = 'opacity .6s ease';
        pl.style.opacity = '0';
        setTimeout(function () { if (pl) pl.style.display = 'none'; }, 650);
      }, 2200);
    }

    /* 2) Eigenes Menü: Burger öffnet Overlay, X/Link/Hintergrund/ESC schließt */
    var burger = document.querySelector('.hq-burger');
    var overlay = document.querySelector('.hq-overlay');
    if (burger && overlay) {
      var openMenu = function () { overlay.classList.add('open'); document.body.classList.add('hq-menu-open'); };
      var closeMenu = function () { overlay.classList.remove('open'); document.body.classList.remove('hq-menu-open'); };
      burger.addEventListener('click', function (e) { e.preventDefault(); openMenu(); });
      var x = overlay.querySelector('.hq-close');
      if (x) x.addEventListener('click', function (e) { e.preventDefault(); closeMenu(); });
      overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeMenu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }

    /* 3) Sicherheitsnetz: Inhalte, die wegen nicht ausgelöster Scroll-Animationen
          unsichtbar (opacity:0) bleiben, garantiert einblenden. */
    function revealStuck() {
      document.querySelectorAll('section, [class*="section"], h1,h2,h3,h4,p, img, .effect-para, .home-content-para, .branding-card, .slider-image, .about-image-one, .about-image-two, .home-geallary-image, .branding-card-text').forEach(function (el) {
        if (el.closest('.preloader, .hq-overlay')) return;
        var cs = getComputedStyle(el);
        if (parseFloat(cs.opacity) === 0) {
          el.style.transition = 'opacity .6s ease';
          el.style.opacity = '1';
          if (cs.transform !== 'none') el.style.transform = 'none';
        }
      });
    }
    setTimeout(revealStuck, 1800);
    window.addEventListener('load', function () { setTimeout(revealStuck, 600); });
  });
})();

/* Hidden Queen – robustes Navigations-/Preloader-Fix (unabhängig von Webflow IX2) */
(function () {
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    // 1) Preloader: zügig ausblenden und nie Klicks blockieren
    var pl = document.querySelector('.preloader');
    if (pl) {
      pl.style.pointerEvents = 'none';
      setTimeout(function () {
        pl.style.transition = 'opacity .6s ease';
        pl.style.opacity = '0';
        setTimeout(function () { if (pl) pl.style.display = 'none'; }, 650);
      }, 2200);
    }

    // 2) Navigation immer obenauf & klickbar
    var nw = document.querySelector('.nav-menu-wrapper');
    if (nw) { nw.style.position = 'relative'; nw.style.zIndex = '1000'; nw.style.pointerEvents = 'auto'; }
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.style.pointerEvents = 'auto'; a.style.position = 'relative'; a.style.zIndex = '3';
    });

    // 3) Geschlossene Overlays dürfen keine Klicks abfangen
    ['.menu', '.hamburger-main-wrap', '.w-nav-overlay'].forEach(function (s) {
      var e = document.querySelector(s); if (!e) return;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.opacity === '0' || cs.visibility === 'hidden') e.style.pointerEvents = 'none';
    });

    // 3b) Sicherheitsnetz: Inhalte, die wegen nicht ausgelöster Scroll-Animationen
    //     unsichtbar (opacity:0) hängenbleiben, garantiert einblenden.
    function revealStuck() {
      document.querySelectorAll('section, [class*="section"], h1,h2,h3,h4,p, img, .effect-para, .home-content-para, .branding-card, .slider-image, .about-image-one, .about-image-two').forEach(function (el) {
        if (el.closest('.preloader, .menu')) return;
        var cs = getComputedStyle(el);
        if (parseFloat(cs.opacity) === 0) {
          el.style.transition = 'opacity .6s ease';
          el.style.opacity = '1';
          if (cs.transform !== 'none') el.style.transform = 'none';
        }
      });
    }
    setTimeout(revealStuck, 2000);
    window.addEventListener('load', function () { setTimeout(revealStuck, 800); });

    // 4) Burger öffnet/schließt das Vollbild-Menü zuverlässig (alte Handler entfernen)
    var menu = document.querySelector('.menu');
    if (menu) {
      var open = false;
      var inner = menu.querySelector('.hamburger-main-wrap') || menu.firstElementChild;
      var set = function (o) {
        open = o;
        if (o) {
          menu.style.cssText += ';display:flex;position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100vh;align-items:center;justify-content:center;opacity:1;visibility:visible;pointer-events:auto;overflow:auto;';
          // Innenbereich zentrieren (IX2-Initialzustände zurücksetzen)
          if (inner) { inner.style.cssText += ';position:relative;top:auto;left:auto;transform:none;opacity:1;width:100%;'; }
          menu.querySelectorAll('.hamburger-list, .hamburger-list-item, .nav-menu.hamburger, a').forEach(function (el) {
            if (getComputedStyle(el).opacity === '0') el.style.opacity = '1';
            if (getComputedStyle(el).transform !== 'none') el.style.transform = 'none';
          });
          document.body.style.overflow = 'hidden';
        } else {
          menu.style.display = 'none';
          menu.style.opacity = '0';
          menu.style.pointerEvents = 'none';
          document.body.style.overflow = '';
        }
      };
      set(false);
      // Burger: Webflow-Interaktion (data-w-id) entfernen + Klon + eigener Handler
      document.querySelectorAll('.hamburger-icon-wrap').forEach(function (b) {
        b.removeAttribute('data-w-id');
        var c = b.cloneNode(true);
        b.parentNode.replaceChild(c, b);
        c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer'; c.style.position = 'relative'; c.style.zIndex = '1001';
        c.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); set(!open); });
      });
      // Schließen (Capture-Phase, vor Webflow): X-Icon, Hintergrund, Menülinks
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (open && t.closest('.menu-cross-icon, [class*="menu-cross"], [class*="cross-icon"], [class*="menu-close"]')) {
          e.preventDefault(); e.stopImmediatePropagation(); set(false); return;
        }
        if (open && t === menu) { set(false); return; }
        if (open && menu.contains(t) && t.closest('a')) { set(false); }
      }, true);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
    }
  });
})();

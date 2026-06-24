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

    // 4) Burger öffnet/schließt das Vollbild-Menü zuverlässig (alte Handler entfernen)
    var menu = document.querySelector('.menu');
    if (menu) {
      var open = false;
      var set = function (o) {
        open = o;
        menu.style.display = o ? 'flex' : 'none';
        menu.style.opacity = o ? '1' : '0';
        menu.style.pointerEvents = o ? 'auto' : 'none';
        document.body.style.overflow = o ? 'hidden' : '';
      };
      set(false);
      document.querySelectorAll('.hamburger-icon-wrap').forEach(function (b) {
        var c = b.cloneNode(true);           // Klon entfernt evtl. defekte Webflow-Handler
        b.parentNode.replaceChild(c, b);
        c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer'; c.style.position = 'relative'; c.style.zIndex = '1001';
        c.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); set(!open); });
      });
      menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
      menu.addEventListener('click', function (e) { if (e.target === menu) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
    }
  });
})();

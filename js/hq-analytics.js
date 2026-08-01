/* Datensparsame Analytics: sendet ausschliesslich den Ereignisnamen, den
   Seitenpfad und ein grobes Geraetemerkmal – nie Antworten, Namen,
   E-Mail-Adressen, Telefonnummern, Freitexte, Grenzen oder
   Kollektionsergebnisse (Masterauftrag Abschnitt 29). Kein Cookie, keine
   geraeteuebergreifende Wiedererkennung – daher ohne Einwilligungsbanner. */
(function () {
  var ALLOWED = [
    'private_preview_view', 'private_preview_start', 'private_preview_step',
    'private_preview_submit', 'private_preview_error', 'collection_view',
    'contact_submit', 'future_shop_click'
  ];

  window.hqTrack = function (name, detail) {
    if (ALLOWED.indexOf(name) === -1) return;
    var safeDetail = {};
    if (detail && typeof detail.step !== 'undefined') safeDetail.step = String(detail.step).slice(0, 20);
    if (detail && typeof detail.collection !== 'undefined') safeDetail.collection = String(detail.collection).slice(0, 40);
    var body = JSON.stringify({ name: name, path: location.pathname, detail: safeDetail });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) { /* Analytics darf nie die Seite stoeren */ }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-analytics]');
    if (!el) return;
    window.hqTrack(el.dataset.analytics, { collection: el.dataset.collection });
  });
})();

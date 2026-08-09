/* Datensparsame Analytics: sendet ausschliesslich den Ereignisnamen, den
   Seitenpfad und ein grobes Geraetemerkmal – nie Antworten, Namen,
   E-Mail-Adressen, Telefonnummern, Freitexte, Grenzen oder
   Kollektionsergebnisse (Masterauftrag Abschnitt 29). Kein Cookie, keine
   geraeteuebergreifende Wiedererkennung – daher ohne Einwilligungsbanner. */
(function () {
  var ALLOWED = [
    'private_preview_view', 'private_preview_start', 'private_preview_step',
    'private_preview_submit', 'private_preview_error', 'collection_view',
    'contact_submit', 'future_shop_click',
    'hq_qr_variant_view', 'hq_qr_hero_cta', 'hq_qr_preview_click',
    'hq_qr_library_click', 'hq_qr_collections_click', 'hq_qr_email_submit'
  ];

  window.hqTrack = function (name, detail) {
    if (ALLOWED.indexOf(name) === -1) return;
    var safeDetail = {};
    if (detail && typeof detail.step !== 'undefined') safeDetail.step = String(detail.step).slice(0, 20);
    if (detail && typeof detail.collection !== 'undefined') safeDetail.collection = String(detail.collection).slice(0, 40);
    if (detail && typeof detail.campaign !== 'undefined') safeDetail.campaign = String(detail.campaign).slice(0, 60);
    if (detail && typeof detail.variant !== 'undefined') safeDetail.variant = String(detail.variant).slice(0, 40);
    if (detail && typeof detail.weekday !== 'undefined') safeDetail.weekday = String(detail.weekday).slice(0, 12);
    if (detail && typeof detail.hour !== 'undefined') safeDetail.hour = String(detail.hour).slice(0, 2);
    if (detail && typeof detail.source !== 'undefined') safeDetail.source = String(detail.source).slice(0, 20);
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

(function () {
  var STATUSES = ['Neu', 'In Prüfung', 'Rückfrage', 'Ausgewählt', 'Aktuell nicht passend', 'Abgeschlossen', 'Gelöscht'];
  var COLLECTIONS = ['the_invitation', 'blind_trust', 'queens_ritual', 'after_midnight', 'secret_drawer', 'the_collection', 'the_surrender'];

  var loginView = document.getElementById('login-view');
  var listView = document.getElementById('list-view');
  var detailView = document.getElementById('detail-view');
  var logoutBtn = document.getElementById('logout-btn');

  function el(id) { return document.getElementById(id); }

  function fillSelect(select, values, withEmpty) {
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v;
      select.appendChild(o);
    });
  }
  fillSelect(el('f-status'), STATUSES);
  fillSelect(el('f-collection'), COLLECTIONS);
  fillSelect(el('detail-status'), STATUSES);

  function showLogin() {
    loginView.classList.remove('hidden');
    listView.classList.add('hidden');
    detailView.style.display = 'none';
    logoutBtn.classList.add('hidden');
  }
  function showList() {
    loginView.classList.add('hidden');
    listView.classList.remove('hidden');
    detailView.style.display = 'none';
    logoutBtn.classList.remove('hidden');
    loadList();
  }
  function showDetail(id) {
    loginView.classList.add('hidden');
    listView.classList.add('hidden');
    detailView.style.display = 'block';
    loadDetail(id);
  }

  el('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = el('pw').value;
    fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok && r.j.ok) { showList(); } else { el('login-err').textContent = (r.j && r.j.error) || 'Anmeldung fehlgeschlagen.'; }
      })
      .catch(function () { el('login-err').textContent = 'Anmeldung fehlgeschlagen.'; });
  });

  logoutBtn.addEventListener('click', function () {
    fetch('/api/admin/logout', { method: 'POST' }).then(showLogin);
  });

  function buildQuery() {
    var params = new URLSearchParams();
    if (el('f-status').value) params.set('status', el('f-status').value);
    if (el('f-collection').value) params.set('collection', el('f-collection').value);
    if (el('f-from').value) params.set('from', el('f-from').value);
    if (el('f-to').value) params.set('to', el('f-to').value);
    return params.toString();
  }

  function loadList() {
    fetch('/api/admin/submissions?' + buildQuery())
      .then(function (r) { if (r.status === 401) { showLogin(); return null; } return r.json(); })
      .then(function (j) {
        if (!j) return;
        var body = el('list-body');
        body.innerHTML = '';
        j.items.forEach(function (row) {
          var tr = document.createElement('tr');
          tr.className = 'row';
          tr.innerHTML = '<td>' + new Date(row.created_at).toLocaleDateString('de-DE') + '</td>' +
            '<td>' + esc(row.vorname) + ' ' + esc(row.nachname || '') + '</td>' +
            '<td>' + esc(row.plz_ort || '') + '</td>' +
            '<td>' + esc(row.top_collection || '—') + '</td>' +
            '<td>' + row.eignung_score + '</td>' +
            '<td><span class="badge">' + esc(row.status) + '</span></td>' +
            '<td>' + (row.consent_marketing ? 'Ja' : 'Nein') + '</td>';
          tr.addEventListener('click', function () { showDetail(row.id); });
          body.appendChild(tr);
        });
      });
  }

  el('filter-apply').addEventListener('click', loadList);
  el('export-btn').addEventListener('click', function () {
    window.location.href = '/api/admin/export?' + buildQuery();
  });

  var currentId = null;
  function loadDetail(id) {
    currentId = id;
    fetch('/api/admin/submissions/' + id)
      .then(function (r) { if (r.status === 401) { showLogin(); return null; } return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return;
        var it = j.item;
        el('detail-kv').innerHTML =
          '<div>Datum</div><div>' + new Date(it.created_at).toLocaleString('de-DE') + '</div>' +
          '<div>Name</div><div>' + esc(it.vorname) + ' ' + esc(it.nachname || '') + '</div>' +
          '<div>E-Mail</div><div>' + esc(it.email) + '</div>' +
          '<div>Zweite Person</div><div>' + esc(it.partner_vorname || '—') + '</div>' +
          '<div>PLZ / Ort</div><div>' + esc(it.plz_ort) + '</div>' +
          '<div>Telefon</div><div>' + esc(it.telefon || '—') + '</div>' +
          '<div>Kontaktweg</div><div>' + esc(it.kontaktweg || '—') + '</div>' +
          '<div>Top-Kollektion</div><div>' + esc(it.top_collection || '—') + '</div>' +
          '<div>Zweite Kollektion</div><div>' + esc(it.second_collection || '—') + '</div>' +
          '<div>Eignungswertung</div><div>' + it.eignung_score + '</div>' +
          '<div>Marketing-Einwilligung</div><div>' + (it.consent_marketing ? 'Ja' : 'Nein') + '</div>' +
          '<div>UTM-Quelle</div><div>' + esc(it.utm_source || '—') + '</div>';

        var boundaryHtml = '';
        if (it.boundary_text) boundaryHtml += '<div class="boundary"><strong>Grenze (Frage 9):</strong><br>' + esc(it.boundary_text) + '</div>';
        if (it.expectation_text) boundaryHtml += '<div class="boundary"><strong>Erwartung (Frage 10):</strong><br>' + esc(it.expectation_text) + '</div>';
        if (it.nachricht) boundaryHtml += '<div class="boundary"><strong>Zusätzliche Nachricht:</strong><br>' + esc(it.nachricht) + '</div>';
        el('detail-boundary').innerHTML = boundaryHtml;

        el('detail-answers').textContent = JSON.stringify(it.answers, null, 2) + '\n\nPunkte:\n' + JSON.stringify(it.scores, null, 2);
        el('detail-status').value = it.status;
        el('detail-note').value = it.internal_note || '';
        el('detail-err').textContent = '';
      });
  }

  el('back-btn').addEventListener('click', showList);

  el('save-btn').addEventListener('click', function () {
    fetch('/api/admin/submissions/' + currentId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: el('detail-status').value, internal_note: el('detail-note').value }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      el('detail-err').textContent = j.ok ? 'Gespeichert.' : (j.error || 'Fehler beim Speichern.');
    });
  });

  el('delete-btn').addEventListener('click', function () {
    if (!confirm('Diese Bewerbung endgültig löschen?')) return;
    fetch('/api/admin/submissions/' + currentId, { method: 'DELETE' })
      .then(function () { showList(); });
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Direkteinstieg ueber Link aus der internen Benachrichtigungsmail (?id=123)
  var params = new URLSearchParams(location.search);
  var deepLinkId = params.get('id');

  fetch('/api/admin/submissions').then(function (r) {
    if (r.status === 401) { showLogin(); return; }
    if (deepLinkId) { showDetail(Number(deepLinkId)); } else { showList(); }
  }).catch(showLogin);
})();

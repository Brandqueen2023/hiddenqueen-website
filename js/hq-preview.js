/* HiddenQueen Private Preview – Fragetool-Steuerung.
   Reine Client-Logik: Navigation, Zwischenspeicherung, Absenden.
   Keine Auswertung/Scoring im Browser – das geschieht ausschliesslich
   serverseitig, damit die Teilnehmerin keine automatische
   Kollektionsempfehlung sieht (Masterauftrag Abschnitt 21). */
(function () {
  var STORAGE_KEY = 'hq_preview_v1';
  var intro = document.getElementById('hq-preview-intro');
  var quiz = document.getElementById('hq-preview-quiz');
  var success = document.getElementById('hq-preview-success');
  if (!quiz) return;

  var steps = Array.prototype.slice.call(quiz.querySelectorAll('.hq-quiz-step'));
  var totalQuestionSteps = steps.filter(function (s) { return s.dataset.question; }).length;
  var current = 0;
  var form = document.getElementById('hq-preview-form');
  var progressFill = document.getElementById('hq-progress-fill');
  var progressLabel = document.getElementById('hq-progress-label');
  var backBtn = document.getElementById('hq-quiz-back');
  var nextBtn = document.getElementById('hq-quiz-next');
  var startedAt = Date.now();

  function track(name, detail) {
    if (window.hqTrack) window.hqTrack(name, detail || {});
  }

  function save() {
    try {
      var data = serialize();
      data.__step = current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* Speicher nicht verfuegbar - kein Abbruch */ }
  }

  function restore() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    Object.keys(data).forEach(function (name) {
      if (name === '__step') return;
      var val = data[name];
      var fields = form.querySelectorAll('[name="' + name + '"]');
      fields.forEach(function (f) {
        if (f.type === 'checkbox' || f.type === 'radio') {
          f.checked = Array.isArray(val) ? val.indexOf(f.value) !== -1 : val === f.value;
        } else {
          f.value = val;
        }
      });
    });
    if (typeof data.__step === 'number' && data.__step > 0 && data.__step < steps.length) {
      current = data.__step;
    }
  }

  function serialize() {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (!out[el.name]) out[el.name] = [];
        if (el.checked) out[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) out[el.name] = el.value;
      } else {
        out[el.name] = el.value;
      }
    });
    return out;
  }

  function showStep(i) {
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    var qNum = steps[i].dataset.question;
    if (qNum) {
      progressLabel.textContent = 'Frage ' + qNum + ' von ' + totalQuestionSteps;
      progressFill.style.width = (Number(qNum) / totalQuestionSteps * 100) + '%';
    } else {
      progressLabel.textContent = 'Kontaktdaten';
      progressFill.style.width = '100%';
    }
    backBtn.disabled = i === 0;
    nextBtn.textContent = i === steps.length - 1 ? 'Bewerbung vertraulich absenden' : 'Weiter';
    var firstInput = steps[i].querySelector('input, textarea, select');
    if (firstInput) { try { firstInput.focus({ preventScroll: true }); } catch (e) {} }
    track('private_preview_step', { step: qNum || 'kontakt' });
    save();
  }

  function validateStep(i) {
    var step = steps[i];
    var errorEl = step.querySelector('.hq-error-text');
    if (errorEl) errorEl.remove();
    var required = step.dataset.required;
    if (required === 'single') {
      var checked = step.querySelector('input[type="radio"]:checked');
      if (!checked) { showError(step, 'Bitte wähle eine Antwort aus.'); return false; }
    } else if (required === 'multi') {
      var any = step.querySelector('input[type="checkbox"]:checked');
      if (!any) { showError(step, 'Bitte wähle mindestens eine Antwort aus.'); return false; }
    } else if (required === 'fields') {
      var invalid = false;
      step.querySelectorAll('[required]').forEach(function (f) {
        if (f.type === 'checkbox' && !f.checked) invalid = true;
        if (f.type !== 'checkbox' && !f.value.trim()) invalid = true;
        if (f.type === 'email' && f.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) invalid = true;
      });
      if (invalid) { showError(step, 'Bitte fülle die Pflichtfelder aus.'); return false; }
      var age = step.querySelector('[name="consent_age"]');
      if (age && !age.checked) { showError(step, 'Bitte bestätige, dass du volljährig bist.'); return false; }
      if (step.querySelector('#hq-p-recaptcha') && window.grecaptcha && !grecaptcha.getResponse()) {
        showError(step, 'Bitte bestätige das Sicherheits-Häkchen.');
        return false;
      }
    }
    var maxCheck = step.dataset.maxChecked;
    if (maxCheck) {
      var n = step.querySelectorAll('input[type="checkbox"]:checked').length;
      if (n > Number(maxCheck)) { showError(step, 'Bitte wähle bis zu ' + maxCheck + ' Antworten.'); return false; }
    }
    return true;
  }

  function showError(step, msg) {
    var p = document.createElement('p');
    p.className = 'hq-error-text';
    p.setAttribute('role', 'alert');
    p.textContent = msg;
    step.appendChild(p);
  }

  document.querySelectorAll('[data-start-preview]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      intro.style.display = 'none';
      quiz.style.display = 'block';
      track('private_preview_start', {});
      showStep(current);
      quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  backBtn.addEventListener('click', function () {
    if (current > 0) { current--; showStep(current); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;
    if (current < steps.length - 1) {
      current++;
      showStep(current);
      return;
    }
    submitForm();
  });

  function submitForm() {
    nextBtn.disabled = true;
    var payload = serialize();
    payload.form_started_at = startedAt;
    payload.utm_source = new URLSearchParams(location.search).get('utm_source') || '';
    payload.referrer = document.referrer || '';
    payload.recaptcha_token = window.grecaptcha ? grecaptcha.getResponse() : '';

    fetch('/api/private-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        nextBtn.disabled = false;
        if (r.ok && r.j.ok) {
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          quiz.style.display = 'none';
          success.style.display = 'block';
          success.scrollIntoView({ behavior: 'smooth', block: 'start' });
          track('private_preview_submit', {});
        } else {
          if (window.grecaptcha) grecaptcha.reset();
          showError(steps[current], 'Deine Antworten sind noch da. Die Übertragung hat gerade nicht funktioniert. Bitte versuche es erneut.');
          track('private_preview_error', {});
        }
      })
      .catch(function () {
        nextBtn.disabled = false;
        if (window.grecaptcha) grecaptcha.reset();
        showError(steps[current], 'Deine Antworten sind noch da. Die Übertragung hat gerade nicht funktioniert. Bitte versuche es erneut.');
        track('private_preview_error', {});
      });
  }

  form.addEventListener('change', save);
  form.addEventListener('input', save);
  restore();
  track('private_preview_view', {});
})();

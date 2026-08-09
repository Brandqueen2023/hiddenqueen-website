/* Cookie-Consent (CookieConsent v3, Orest Bida) – HiddenQueen
   Du-Form, dunkles CI (Anthrazit/Rosegold). Verlinkt auf /datenschutz.
   reCAPTCHA (Formularschutz) laedt erst nach Einwilligung in die
   Kategorie "recaptcha", nie automatisch beim Seitenaufruf. */
(function () {
  if (typeof CookieConsent === 'undefined') return;
  document.documentElement.classList.add('cc--darkmode');

  function loadRecaptchaIfConsented() {
    if (!CookieConsent.acceptedCategory('recaptcha')) return;
    if (document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) return;
    if (!document.querySelector('.g-recaptcha')) return;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?hl=de';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  CookieConsent.run({
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom right', equalWeightButtons: true },
      preferencesModal: { layout: 'box' }
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      recaptcha: {},
      analytics: {}
    },
    onFirstConsent: loadRecaptchaIfConsented,
    onConsent: loadRecaptchaIfConsented,
    onChange: loadRecaptchaIfConsented,
    language: {
      default: 'de',
      translations: {
        de: {
          consentModal: {
            title: 'Deine Privatsphäre',
            description: 'Diese Seite funktioniert mit den notwendigen Funktionen allein. Für den Spamschutz unserer Formulare (reCAPTCHA von Google) brauchen wir deine Einwilligung. Mehr dazu in der <a href="/datenschutz">Datenschutzerklärung</a>.',
            acceptAllBtn: 'Alle akzeptieren',
            acceptNecessaryBtn: 'Ablehnen',
            showPreferencesBtn: 'Einstellungen'
          },
          preferencesModal: {
            title: 'Cookie-Einstellungen',
            acceptAllBtn: 'Alle akzeptieren',
            acceptNecessaryBtn: 'Alle ablehnen',
            savePreferencesBtn: 'Auswahl speichern',
            closeIconLabel: 'Schließen',
            sections: [
              {
                title: 'Notwendig',
                description: 'Diese Funktionen sind für den Betrieb der Seite erforderlich und immer aktiv.',
                linkedCategory: 'necessary'
              },
              {
                title: 'Formularschutz (reCAPTCHA)',
                description: 'Schützt Newsletter-, Kontakt- und Private-Preview-Formular vor automatisiertem Missbrauch. Ohne Zustimmung lassen sich diese Formulare nicht absenden.',
                linkedCategory: 'recaptcha'
              },
              {
                title: 'Statistik',
                description: 'Hilft zu verstehen, wie die Seite genutzt wird. Aktuell nicht im Einsatz – vorbereitet für die Zukunft.',
                linkedCategory: 'analytics'
              },
              {
                title: 'Mehr Informationen',
                description: 'Fragen zum Datenschutz? Siehe <a href="/datenschutz">Datenschutzerklärung</a>.'
              }
            ]
          }
        }
      }
    }
  });
})();

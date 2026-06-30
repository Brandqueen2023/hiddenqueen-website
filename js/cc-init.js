/* Cookie-Consent (CookieConsent v3, Orest Bida) – The Hiddenqueen
   Du-Form, dunkles CI (Anthrazit/Rosegold). Verlinkt auf /datenschutz. */
(function () {
  if (typeof CookieConsent === 'undefined') return;
  document.documentElement.classList.add('cc--darkmode');
  CookieConsent.run({
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom right', equalWeightButtons: true },
      preferencesModal: { layout: 'box' }
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {}
    },
    language: {
      default: 'de',
      translations: {
        de: {
          consentModal: {
            title: 'Deine Privatsphäre',
            description: 'Diese Seite nutzt notwendige Funktionen sowie eingebundene Drittanbieter-Dienste (u. a. Schriftarten, Animationen). Du entscheidest, was geladen wird. Mehr dazu in der <a href="/datenschutz">Datenschutzerklärung</a>.',
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

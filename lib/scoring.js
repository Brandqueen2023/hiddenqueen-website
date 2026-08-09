/* Interne Punktevergabe je Kollektion (Masterauftrag Abschnitt 20).
   Wird AUSSCHLIESSLICH serverseitig ausgewertet und nie an die
   Teilnehmerin zurueckgegeben (Abschnitt 21: keine automatische
   Kollektionsempfehlung). */

const COLLECTIONS = [
  'the_invitation', 'blind_trust', 'queens_ritual', 'after_midnight',
  'secret_drawer', 'the_collection', 'the_surrender',
];

function emptyScores() {
  return COLLECTIONS.reduce((acc, c) => { acc[c] = 0; return acc; }, {});
}

function add(scores, collection, points) { scores[collection] = (scores[collection] || 0) + points; }

const Q2 = {
  bewusster_anfang: ['the_invitation', 4], mehr_vertrauen: ['blind_trust', 4],
  gemeinsames_ritual: ['queens_ritual', 4], abend_nur_uns: ['after_midnight', 4],
  nur_wir_verstehen: ['secret_drawer', 4], etwas_bleibendes: ['the_collection', 4],
  kontrolle_abgeben: ['the_surrender', 4],
};

const Q3 = {
  leise_offen: [['the_invitation', 2], ['queens_ritual', 1]],
  klar_gefuehrt: [['blind_trust', 2], ['the_surrender', 1]],
  sinnlich_bewusst: [['queens_ritual', 2], ['after_midnight', 1]],
  ueberraschend: [['secret_drawer', 2], ['after_midnight', 1]],
  intensiv: [['the_surrender', 2], ['blind_trust', 1]],
};

const Q4 = {
  worte_geschichte: [['the_invitation', 2]],
  material_gestaltung: [['the_collection', 2]],
  atmosphaere_licht: [['after_midnight', 2]],
  eine_geste: [['queens_ritual', 2], ['blind_trust', 1]],
  unerwartetes_detail: [['secret_drawer', 2]],
};

const Q5 = {
  nur_anfang_rest_frei: [['the_invitation', 2]],
  einzelne_impulse: [['queens_ritual', 2], ['secret_drawer', 1]],
  klarer_rahmen: [['blind_trust', 2], ['after_midnight', 1]],
  bewusste_fuehrung: [['the_surrender', 2], ['blind_trust', 1]],
};

const Q6 = {
  genauer_hinsehen: ['the_invitation', 5], kontrolle_abgeben_sicher: ['blind_trust', 5],
  zeit_gestalten: ['queens_ritual', 5], abend_anders: ['after_midnight', 5],
  bedeutung_geheim: ['secret_drawer', 5], sichtbar_bleiben: ['the_collection', 5],
  vertrauen_tragen: ['the_surrender', 5],
};

const Q8 = {
  diskretion: [['secret_drawer', 1], ['the_collection', 1]],
  hochwertige_gestaltung: [['the_collection', 2]],
  klare_grenzen: [['blind_trust', 1], ['the_surrender', 1]],
  freiheit_ohne_anleitung: [['the_invitation', 1], ['queens_ritual', 1]],
  stimmige_geschichte: [['the_invitation', 2]],
  ehrliches_gespraech: [['queens_ritual', 1], ['blind_trust', 1]],
  objekt_das_bleibt: [['the_collection', 2], ['secret_drawer', 1]],
};

const Q11_EIGNUNG = { ja_schriftlich: 3, ja_gespraech: 3, ja_beides: 4, nein_derzeit_nicht: 0 };
const Q12_EIGNUNG = { zwei_wochen: 3, vier_wochen: 2, spaeter: 1, noch_nicht_einschaetzbar: 0 };

// Vier der sieben Kollektionen sind auf der Kollektionen-Seite explizit als
// Paar-Erlebnis beschrieben ("Für Paare", "gemeinsame Geheimnisse", "euch").
// Wer allein antwortet, soll dort nicht an erster Stelle landen.
const COUPLE_COLLECTIONS = ['blind_trust', 'queens_ritual', 'after_midnight', 'secret_drawer'];
const Q1_SOLO_FACTOR = { fuer_mich: 0.2, zunaechst_fuer_mich: 0.5 };

// The Surrender ist laut Kollektionen-Seite "der Abschluss einer Reise" und
// soll erst nach den anderen Kollektionen ihren Platz finden. Bei wenig
// Erfahrung wird der Wert deshalb abgewertet, damit nicht die
// fortgeschrittenste Kollektion die Erstempfehlung für Neulinge wird.
const Q7_SURRENDER_FACTOR = { noch_gar_nicht: 0.3, ein_wenig: 0.7 };

function moderateForContext(scores, answers) {
  const moderated = Object.assign({}, scores);

  const soloFactor = Q1_SOLO_FACTOR[answers.q1_fuer_wen];
  if (soloFactor !== undefined) {
    COUPLE_COLLECTIONS.forEach((c) => { moderated[c] = Math.round(moderated[c] * soloFactor); });
  }

  const surrenderFactor = Q7_SURRENDER_FACTOR[answers.q7_vertraut];
  if (surrenderFactor !== undefined) {
    moderated.the_surrender = Math.round(moderated.the_surrender * surrenderFactor);
  }

  return moderated;
}

function scoreAnswers(answers) {
  const rawScores = emptyScores();

  if (Q2[answers.q2_fehlt]) { const [c, p] = Q2[answers.q2_fehlt]; add(rawScores, c, p); }
  if (Q3[answers.q3_erster_schritt]) Q3[answers.q3_erster_schritt].forEach(([c, p]) => add(rawScores, c, p));
  if (Q4[answers.q4_erreicht]) Q4[answers.q4_erreicht].forEach(([c, p]) => add(rawScores, c, p));
  if (Q5[answers.q5_orientierung]) Q5[answers.q5_orientierung].forEach(([c, p]) => add(rawScores, c, p));
  if (Q6[answers.q6_aussage]) { const [c, p] = Q6[answers.q6_aussage]; add(rawScores, c, p); }

  const q8 = Array.isArray(answers.q8_wichtig) ? answers.q8_wichtig : (answers.q8_wichtig ? [answers.q8_wichtig] : []);
  q8.forEach((val) => { if (Q8[val]) Q8[val].forEach(([c, p]) => add(rawScores, c, p)); });

  const scores = moderateForContext(rawScores, answers);

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
  const second = sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  let eignung = 0;
  let statusHint = null;
  if (answers.q11_feedback in Q11_EIGNUNG) eignung += Q11_EIGNUNG[answers.q11_feedback];
  if (answers.q11_feedback === 'nein_derzeit_nicht') statusHint = 'Aktuell nicht passend';
  if (answers.q12_zeit in Q12_EIGNUNG) eignung += Q12_EIGNUNG[answers.q12_zeit];

  return { scores, top_collection: top, second_collection: second, eignung_score: eignung, status_hint: statusHint };
}

module.exports = { scoreAnswers, COLLECTIONS };

# thehiddenqueen.de über WordPress pflegen — Einrichtung

Ziel: **Sabrina pflegt alle Texte und Bilder bequem in WordPress.** Das Design der
Website bleibt **exakt wie es ist**. Beim Speichern in WordPress aktualisiert sich die
Live-Seite automatisch.

So funktioniert es im Hintergrund (zur Beruhigung, nicht nötig zu verstehen):
WordPress ist nur der **Schreibtisch**. Ein kleiner automatischer Schritt holt die
Inhalte aus WordPress und gießt sie in das bestehende Webflow-Design auf Vercel.

> **Wichtig & entspannend:** Leere Felder in WordPress = der **bisherige Text bleibt
> stehen**. Sabrina muss also nur das ausfüllen, was sie *ändern* möchte. Es kann
> nichts „kaputtgehen", und es muss nicht alles auf einmal übertragen werden.

---

## Teil A · WordPress vorbereiten (Sabrina, einmalig — ca. 10 Min.)

1. **Im Strato-WordPress einloggen** (`/wp-admin`).

2. **Advanced Custom Fields (ACF) installieren** — das kostenlose Standard-Plugin:
   *Plugins → Installieren → oben „ACF" suchen → „Advanced Custom Fields"
   installieren → aktivieren.*

3. **Unser Plugin hochladen:**
   *Plugins → Installieren → oben „Plugin hochladen" → Datei `hq-headless.zip`
   auswählen → „Jetzt installieren" → aktivieren.*

   Beim Aktivieren legt das Plugin automatisch an:
   - ein neues Menü **„Website-Inhalte"** (linke Seitenleiste)
   - die Seiten **Startseite, Über, Galerie, Kontakt, Einstellungen**

4. **Inhalte pflegen:** Menü **„Website-Inhalte"** öffnen. Dort sind alle Seiten
   verlinkt. Jede Seite hat klar beschriftete Felder (Überschrift, Text, Bild …).
   Bilder kommen wie gewohnt aus der **Mediathek**.

5. **Library-Artikel** („The Queen's Library") sind ganz normale **Beiträge**
   (*Beiträge → Erstellen*). Titel, Text, Beitragsbild, Textauszug — fertig.

---

## Teil B · Live-Seite mit WordPress verbinden (einmalig, technisch)

Diese drei Schritte verbinden WordPress mit der Live-Seite. Macht entweder Sabrina,
oder ich (Claude) per Fernzugriff, wenn du mir kurz Zugang gibst.

**B1 · Vercel „Deploy Hook" erstellen** (das ist der Auslöser fürs Neu-Veröffentlichen)
- Vercel → Projekt **hiddenqueen-website** → *Settings → Git → Deploy Hooks*
- Name z. B. `WordPress`, Branch `main` → **Create Hook** → die **URL kopieren**.

**B2 · Deploy Hook in WordPress eintragen**
- WordPress → *Website-Inhalte → Einstellungen* → Feld
  **„Vercel Deploy Hook"** → URL einfügen → **Speichern**.

**B3 · WordPress als Inhaltsquelle in Vercel hinterlegen**
- Vercel → Projekt → *Settings → Environment Variables* → neu:
  - **Name:** `WP_CONTENT_URL`
  - **Value:** `https://DEINE-WP-ADRESSE/wp-json/hq/v1/content`
    *(DEINE-WP-ADRESSE = die Internet-Adresse, unter der das Strato-WordPress
    erreichbar ist.)*
  - Environment: **Production** (gern auch Preview)
- Danach in Vercel einmal **Redeploy** auslösen.

Fertig. Ab jetzt gilt: **In WordPress speichern → Live-Seite aktualisiert sich
automatisch** (dauert 1–2 Minuten).

---

## So testest du, dass alles läuft
1. In WordPress auf der **Startseite** den Einleitungstext minimal ändern → Speichern.
2. 1–2 Minuten warten.
3. `thehiddenqueen.de` neu laden (ggf. Strg+F5) → die Änderung ist live.

Optional manuell anstoßen: *Website-Inhalte → „Live-Seite jetzt aktualisieren"*.

---

## Was ich (Claude) schon gebaut habe
- `build.js` zieht die Inhalte automatisch aus WordPress (Endpoint
  `/wp-json/hq/v1/content`) und spielt sie ins Design. **Fällt WordPress mal aus,
  baut die Seite automatisch mit dem letzten lokalen Stand weiter** — es kann also
  kein Deploy scheitern.
- `wordpress-plugin/hq-headless.zip` — das fertige Plugin zum Hochladen.

## Was noch von dir/Sabrina kommt
- Die **Internet-Adresse des Strato-WordPress** (für `WP_CONTENT_URL`).
- Einmal **Teil B** durchführen (oder mir kurz Zugang zu WordPress + Vercel geben,
  dann mache ich B1–B3 für euch).

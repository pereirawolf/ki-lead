# Startprobleme der PWA

## Startfehler nach 0.5.1 (behoben in 0.5.2)

**Fehlerbild:** Nach dem Update auf 0.5.1 blieb die Web-App bei manchen Nutzern leer, zuerst gemeldet für Safari auf dem iPad. Im privaten Fenster und in einem frischen Browser lief sie. Tabs schließen und Browser neu starten halfen nicht.

**Ursache (in Chromium nachgestellt):** Bei der Installation einer neuen Fassung lud der Service Worker seine Dateien über den normalen HTTP-Cache des Browsers. GitHub Pages erlaubt, Dateien zehn Minuten zwischenzuspeichern. Wurde die neue Fassung in dieser Zeit installiert, landete die **ältere** `index.html` aus dem HTTP-Cache neben den **neuen** Programmdateien im Cache der neuen Fassung. Solange die alte Startdatei noch im HTTP-Cache lag, startete die App. Lief dieser ab oder räumte der Browser ihn, fehlte die Startdatei (auf dem Server gab es sie nicht mehr): Die Seite blieb leer, bei jedem Start, bis eine neuere Fassung erschien.

Warum es vor allem Safari traf, ist nicht nachgewiesen. Plausibel ist, dass Safari den HTTP-Cache anders hält und räumt als Chrome. Der Fehler selbst hängt nicht vom Browser ab.

**Korrektur in 0.5.2:**

- Der Service Worker lädt bei der Installation alle Dateien am HTTP-Cache vorbei (`cache: "reload"`).
- Er prüft, dass `index.html` nur auf Dateien seiner eigenen Fassung verweist und alle vorhanden sind. Sonst scheitert die Installation, und die bisherige Fassung bleibt (etwa wenn der Server kurz nach einer Veröffentlichung noch die alte `index.html` ausliefert).
- Ist die bisher aktive Fassung beschädigt, übernimmt die neue sofort und lädt betroffene Fenster einmal neu. Bei intakter Fassung bleibt es beim Hinweis „Neu laden“.
- Schon der Build bricht ab, wenn `index.html` auf eine nicht vorgehaltene Datei verweist.
- Eine Startprüfung (`start-pruefung.js`, ohne Abhängigkeit vom App-Bundle) zeigt bei einem Ladefehler oder nach 20 Sekunden ohne Start einen Hinweis mit dem Weg zur Reparaturseite. Sie lädt nie selbst neu.
- Eine Fehlergrenze an der Wurzel der App zeigt Fehler beim ersten Zeichnen an, statt eine leere Seite zu hinterlassen.

## Wieder starten

1. **Die App normal aufrufen** (nach der Veröffentlichung von 0.5.2). Der Browser holt dabei den neuen Service Worker; er erkennt die beschädigte Fassung und lädt die Seite einmal neu. Bleibt sie nach einigen Sekunden leer, **einmal neu laden**.
2. Hilft das nicht: **alle Tabs mit KI-LEAD schließen** und die App neu öffnen.
3. Danach steht bei Bedarf die **Reparaturseite** bereit: `reparatur.html` im Ordner der App (etwa `https://pereirawolf.github.io/ki-lead/reparatur.html`). „Programmdateien zurücksetzen“ entfernt nur die Anmeldung des Service Workers von KI-LEAD und dessen Zwischenspeicher (Präfix `ki-lead-`); danach „KI-LEAD öffnen“.

**Datenerhalt:** Meldungen, Zwischenstände, importierte Profile, Einstellungen und API-Schlüssel liegen in IndexedDB und localStorage. Weder die Selbstreparatur noch die Reparaturseite lesen oder ändern diese Speicher. Andere Service Worker und Caches derselben Adresse bleiben unberührt.

**Grenze:** Solange noch der Service Worker von 0.5.0 oder 0.5.1 aktiv ist, beantwortet er **jeden** Seitenaufruf innerhalb von `/ki-lead/` mit seiner `index.html`, auch `reparatur.html`. Die Reparaturseite ist dann nicht erreichbar. Der tatsächlich erreichbare Weg ist die Veröffentlichung von 0.5.2 selbst: Beim nächsten Aufruf prüft der Browser den Service Worker auf Aktualisierung, installiert 0.5.2, und dieser repariert die Installation (Schritt 1). Eine Seite außerhalb von `/ki-lead/` auf derselben Adresse gibt es nicht.

**Letzter Ausweg mit Datenverlust:** In den Safari-Einstellungen die Websitedaten von `pereirawolf.github.io` zu entfernen, löscht auch alle Meldungen, Profile, Einstellungen und API-Schlüssel. Nur verwenden, wenn die Schritte oben nicht helfen und keine Daten benötigt werden.

## Geprüft und nicht geprüft

- Geprüft in Chromium mit einem Server wie GitHub Pages (`tests/browser/pwa-update.spec.ts`): der Fehler mit dem Service Worker von 0.5.1, die Korrektur, der Installationsschutz, die Selbstheilung mit erhaltenen IndexedDB-Daten, die Reparaturseite und die Startprüfung.
- Nicht geprüft: Safari und WebKit. WebKit war in der Entwicklungsumgebung nicht verfügbar, und ein Test mit WebKit wäre auch kein vollständiger Nachweis für Safari auf dem iPad. Insbesondere ist offen, ob Safari betroffene Fenster nach der Selbstreparatur selbst neu lädt (`WindowClient.navigate`); sonst genügt einmaliges Neuladen.
- Die Cache-Angaben von GitHub Pages (`max-age=600`) entsprechen dessen dokumentiertem Verhalten. Live abgerufen wurden sie aus der Entwicklungsumgebung nicht.

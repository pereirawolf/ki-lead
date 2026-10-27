# Startprobleme der PWA

## Startfehler nach 0.5.1 (behoben in 0.5.2)

**Fehlerbild:** Nach dem Update auf 0.5.1 blieb die Web-App bei manchen Nutzern leer, zuerst gemeldet für Safari auf dem iPad. Im privaten Fenster und in einem frischen Browser lief sie. Tabs schließen und Browser neu starten halfen nicht.

**Ursache (in Chromium nachgestellt):** Bei der Installation einer neuen Fassung lud der Service Worker seine Dateien über den normalen HTTP-Cache des Browsers. GitHub Pages erlaubt, Dateien zehn Minuten zwischenzuspeichern. Wurde die neue Fassung in dieser Zeit installiert, landete die **ältere** `index.html` aus dem HTTP-Cache neben den **neuen** Programmdateien im Cache der neuen Fassung. Solange die alte Startdatei noch im HTTP-Cache lag, startete die App. Lief dieser ab oder räumte der Browser ihn, fehlte die Startdatei (auf dem Server gab es sie nicht mehr): Die Seite blieb leer, bei jedem Start, bis eine neuere Fassung erschien.

Warum es vor allem Safari traf, ist nicht nachgewiesen. Plausibel ist, dass Safari den HTTP-Cache anders hält und räumt als Chrome. Der Fehler selbst hängt nicht vom Browser ab.

**Korrektur in 0.5.2:**

- Der Service Worker lädt bei der Installation alle Dateien am HTTP-Cache vorbei (`cache: "reload"`).
- Er prüft, dass `index.html` nur auf Dateien seiner eigenen Fassung verweist und alle vorhanden sind. Sonst scheitert die Installation, und die bisherige Fassung bleibt (etwa wenn der Server kurz nach einer Veröffentlichung noch die alte `index.html` ausliefert).
- Eine gescheiterte Installation (etwa ein Netzfehler beim Laden) entfernt ihren eigenen Cache wieder; es bleiben keine Reste zurück.
- Der Service Worker übernimmt **nie von sich aus** und lädt **nie** Fenster neu. Auch eine Fassung mit beschädigtem Cache kann in offenen Fenstern noch laufen, etwa mit ungespeicherten Eingaben der KI-Erfassung. Eine neue Fassung wird aktiv, wenn die Person im Hinweis „Neu laden“ wählt (dann lädt nur dieses Fenster neu) oder wenn alle Fenster geschlossen sind.
- In einem Fenster mit nachweislich gescheitertem Start bietet die Startprüfung „Erneut laden“ an; das übernimmt eine bereits wartende neue Fassung, nur auf Klick.
- Schon der Build bricht ab, wenn `index.html` auf eine nicht vorgehaltene Datei verweist.
- Eine Startprüfung (`start-pruefung.js`, ohne Abhängigkeit vom App-Bundle) zeigt bei einem Ladefehler oder bei ausbleibendem Start einen Hinweis mit dem Weg zur Reparaturseite. Sie lädt nie selbst neu. Seit 0.6.5 zählt die Wartezeit von 20 Sekunden erst ab dem Ereignis „load“ (alle Programmdateien geladen und ausgeführt) und nur, solange das Wurzelelement der App leer ist; bleibt „load“ aus, gilt eine Obergrenze von 60 Sekunden ab dem Aufruf. Bis 0.6.4 galten feste 20 Sekunden ab dem Aufruf, was auf langsamen Geräten oder Verbindungen einen Fehlalarm geben konnte (TP-2026-W44-21).
- Eine Fehlergrenze an der Wurzel der App zeigt Fehler beim ersten Zeichnen an, statt eine leere Seite zu hinterlassen.

## Wieder starten

1. **Die App einmal aufrufen** (nach der Veröffentlichung von 0.5.2) und einige Sekunden warten. Die Seite bleibt dabei noch leer, aber der Browser lädt im Hintergrund die neue Fassung.
2. **Alle Fenster und Tabs mit KI-LEAD schließen** (auf dem iPad auch eine als App auf dem Home-Bildschirm abgelegte KI-LEAD aus der App-Übersicht schließen) und die App neu öffnen. Die neue Fassung wird aktiv und startet.
3. Startet sie trotzdem nicht: Die Startprüfung der neuen Fassung zeigt dann „Erneut laden“ und den Weg zur **Reparaturseite** `reparatur.html` im Ordner der App (etwa `https://pereirawolf.github.io/ki-lead/reparatur.html`). „Programmdateien zurücksetzen“ entfernt nur die Anmeldung des Service Workers von KI-LEAD und dessen Zwischenspeicher (Präfix `ki-lead-`); danach „KI-LEAD öffnen“. Seit 0.6.5 führt auch „Einstellungen → Über KI-LEAD → Programmdateien reparieren“ zur Reparaturseite (in einem neuen Fenster), etwa wenn die App zwar startet, aber nach einer Aktualisierung alte Teile zeigt.

Ein Neuladen allein reicht unter der alten Fassung nicht: Solange ein Fenster offen ist, bleibt die neue Fassung wartend.

**Ohne Netz:** Fragt die App ohne Netz nach einer Datei, die der Service Worker nicht vorhält (etwa eine Datei einer anderen Fassung), antwortet er seit 0.6.5 mit einer Fehlerantwort, statt im Service Worker an einem unbehandelten Fehler zu scheitern (TP-2026-W44-21).

**Datenerhalt:** Meldungen, Zwischenstände, importierte Profile, Einstellungen und API-Schlüssel liegen in IndexedDB und localStorage. Weder die Selbstreparatur noch die Reparaturseite lesen oder ändern diese Speicher. Andere Service Worker und Caches derselben Adresse bleiben unberührt.

**Grenze:** Solange noch der Service Worker von 0.5.0 oder 0.5.1 aktiv ist, beantwortet er **jeden** Seitenaufruf innerhalb von `/ki-lead/` mit seiner `index.html`, auch `reparatur.html`. Die Reparaturseite ist dann nicht erreichbar. Eine Seite außerhalb von `/ki-lead/` auf derselben Adresse gibt es nicht. Der tatsächlich erreichbare Weg ist die Veröffentlichung von 0.5.2 selbst: Beim nächsten Aufruf prüft der Browser den Service Worker auf Aktualisierung und installiert 0.5.2; sobald alle Fenster geschlossen sind, wird 0.5.2 aktiv (Schritte 1 und 2). Eine automatische Übernahme gibt es bewusst nicht. In der leeren Seite einer alten Fassung läuft kein Code, der einen gescheiterten Start belegen könnte, und dieselbe beschädigte Fassung kann in anderen Fenstern noch mit ungespeicherten Eingaben laufen. Zudem lädt der Code von 0.5.0/0.5.1 bei jeder Übernahme neu, sobald er eine wartende Fassung kennt.

**Letzter Ausweg mit Datenverlust:** In den Safari-Einstellungen die Websitedaten von `pereirawolf.github.io` zu entfernen, löscht auch alle Meldungen, Profile, Einstellungen und API-Schlüssel. Nur verwenden, wenn die Schritte oben nicht helfen und keine Daten benötigt werden.

## Geprüft und nicht geprüft

- Geprüft in Chromium mit einem Server wie GitHub Pages (`tests/browser/pwa-update.spec.ts`): der Fehler mit dem Service Worker von 0.5.1, die Korrektur, der Installationsschutz, die Wiederherstellung aus dem defekten Zustand mit erhaltenen IndexedDB-Daten, kein Neuladen eines noch laufenden Fensters mit ungespeicherten Eingaben, keine Übernahme durch Reste einer gescheiterten Installation, „Neu laden“ nur im anfordernden Fenster, Übernahme per Startprüfung nur auf Klick, die Reparaturseite und die Startprüfung.
- Nicht geprüft: Safari und WebKit. WebKit war in der Entwicklungsumgebung nicht verfügbar, und ein Test mit WebKit wäre auch kein vollständiger Nachweis für Safari auf dem iPad. Insbesondere ist offen, wann Safari die wartende Fassung nach dem Schließen aller Fenster aktiviert (bei einer auf dem Home-Bildschirm abgelegten App erst nach dem Schließen aus der App-Übersicht).
- Die Cache-Angaben von GitHub Pages (`max-age=600`) entsprechen dessen dokumentiertem Verhalten. Live abgerufen wurden sie aus der Entwicklungsumgebung nicht.

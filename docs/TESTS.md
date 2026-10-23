# Tests

KI-LEAD prüft sich auf drei Ebenen. Die Tests der ersten beiden rufen keinen echten KI-Anbieter auf und verursachen keine Kosten; die Modellbewertung läuft nur auf ausdrücklichen Auftrag.

| Ebene | Befehl | Umgebung | Inhalt |
|---|---|---|---|
| Funktions- und Komponententests | `npm test` | Vitest, Node; Oberfläche in jsdom | `tests/<bereich>/*.test.ts` |
| Browsertests | `npm run test:browser` | Playwright, Chromium, Produktionsbuild | `tests/browser/*.spec.ts` |
| Modellbewertung | nur auf Auftrag | echte Läufe, eigenes Budget | `evaluation/` (siehe dortige README) |

Weitere Befehle:

- `npm run test:zufall`: alle Tests in zufälliger, fester Reihenfolge (Startwert 20261021). Scheitert ein Test nur hier, hängt er von einem anderen ab.
- `npm run test:ui`: nur die Oberflächentests in jsdom.
- `npm run pruefe-profile`: nur die Profiltests (`tests/profil/`), auch für eigene Profile unter `privat/profile/`.
- `npx vitest run tests/kern/zeit.test.ts`: eine Datei; `npx vitest` für den Beobachtungsmodus.

GitHub Actions führt bei jedem Pull Request `npm test`, `npm run test:zufall`, `npm run build` und die Browsertests aus.

## Gliederung

| Ordner | Gegenstand |
|---|---|
| `tests/kern/` | Schemaprüfung (mit Ajv-Referenz), Migration, Zeit und Fristen, Quellen, Kennsätze, LEAD-Eingabehilfen, Ausgaben, Dateinamen, Beispieldatensatz |
| `tests/profil/` | Profile laden und prüfen (auch LEAD-Eingabehilfen), Manifest, Schemaeignung, Fassungen, SOP-Integration, Redaktionsregeln der SOP-Sammelmappe, Arbeitsanweisungen und Dokumentation gegen das Profil (Konsistenzprüfungen), Profilansicht, private Profile |
| `tests/pipeline/` | Einstellungen und Vorgaben, Kontext, Material, JSON aus Antworten, Stufen S1–S3, Fortschreibung einer eigenen Vormeldung, Verdichtung, Nachbearbeitung, Eingangsquellen, Kurzfassung, Laufkosten, Schätzung, Vergleich |
| `tests/anbieter/` | SSE-Leser, Anthropic- und OpenAI-Adapter, gemeinsamer Vertrag beider Adapter (Wiederholungen, Abbruch), Preise, Verteiler |
| `tests/lagebild/` | Lagebild und Redaktionscheck (Logik) |
| `tests/dokumente/` | PDF und Kopiervorlage |
| `tests/darstellung/` | Farbschemata, Kontraste, Barrierefreiheit im Stylesheet |
| `tests/ui/` | Oberfläche in jsdom: App-Zustand, Erfassung, LEAD-Eingabehilfen, Lagebild, Modellwahl, Einstellungen (Höchstzahl Ausgabetoken), Fortschreibung, S1 an der Ausgabegrenze, Farbschema, Redaktionscheck |
| `tests/evaluation/` | Schemata der Modellbewertung (ohne KI-Aufruf) |
| `tests/pwa/` | PWA: Dateiliste und Version des Service Workers, Bedingungen der Anmeldung, Hinweise, Manifest und Symbole |
| `tests/browser/` | Hauptablauf, Abbruch, Wiederherstellung, Speicherfehler, Barrierefreiheit und Offline-Start der PWA im echten Browser |
| `tests/support/` | gemeinsame Hilfen (keine Tests) |

Wo welcher frühere Test steht, zeigt [TESTZUORDNUNG.md](TESTZUORDNUNG.md).

## Gemeinsame Hilfen (`tests/support/`)

| Datei | Zweck |
|---|---|
| `dateien.ts` | `REPO`, `repoPfad()`, `leseOrdner()` (sortiert), `profil()`, `jsonDateien()` (sortiert; mit `pflicht: true` Fehler bei fehlendem oder leerem Ordner) |
| `fixtures.ts` | Datensatz Orkantief „Ilka“: `ilkaMeldung("HE")` liefert genau die Meldung mit diesem Kennzeichen als frische Kopie; nie über die Reihenfolge (`[0]`) wählen |
| `anbieter.ts` | `llmAntwort()`, `meldungsAntwort()`, `skriptAnbieter()` (Antworten der Reihe nach, ein zusätzlicher Aufruf scheitert), `sseText()`, `sseAntwort()` (Teilung an Bytepositionen), `abreissenderStrom()`, `fehlerAntwort()`, `ohneWarten()` (gefälschte Uhr, misst Wartezeiten) |
| `pipeline.ts` | `pipelineKontext()` mit Beispielprofil und fester Uhr, `s1Vorschlag()`, `bestaetigterVorschlag()` |
| `speicher.ts` | Attrappe für `idb-keyval` mit auslösbaren Lese-, Schreib- und Auflistungsfehlern (`speicherVoll()`) |
| `dom.ts` | `einhaengen()`, `aushaengen()`, `klick()`, `eingeben()`, `knopf()`, `bisWahr()` (wartet auf einen Zustand statt einer festen Zeit) |
| `ajv.ts` | `referenzAjv()` mit festen Optionen, `gleichWieAjv(schema, daten, soll)` mit Diagnose |
| `eingebaut.ts` | zwei eingebaute Profile mit verschiedener Kennung für Tests des Profilwechsels |

## Regeln

1. **Unabhängiges Soll.** Erwartete Werte stehen als feste Werte im Test oder folgen aus einer Regel, die der Test selbst nennt; sie werden nie mit der geprüften Funktion berechnet. Beim Vergleich mit Ajv kommt ein eigenes Soll hinzu, damit zwei zugleich nachgiebige Prüfer nicht unbemerkt bleiben.
2. **Kein Zufall.** Kein `Math.random`, keine Abhängigkeit von Reihenfolge oder Uhrzeit; Uhr und Zeitzone werden gesetzt, wo sie zählen.
3. **Keine festen Pausen.** Oberflächentests warten mit `bisWahr()` auf einen sichtbaren oder gespeicherten Zustand. Prüft ein Test, dass etwas _nicht_ geschieht, wartet er erst auf den positiven Zustand und lässt dann ausstehende Arbeit auslaufen.
4. **Keine echten Wartezeiten.** Wiederholungen und Abbrüche der Anbieter laufen mit `ohneWarten()`; geprüft werden Zahl der Abrufe und Länge der Wartezeiten.
5. **Fixtures über ihr Kennzeichen.** Beispielmeldungen mit `ilkaMeldung()`/`ilkaDatei()`; fehlende Pflichtdaten lassen den Test scheitern statt ihn leer bestehen zu lassen.
6. **Keine echten KI-Aufrufe.** Anbieter werden als Attrappe (`skriptAnbieter`, `abruf`-Parameter der Adapter) oder im Browser am Netzwerkrand simuliert; Browsertests brechen jede andere Anfrage nach außen ab und prüfen das.
7. **Keine Geheimnisse und keine fremden Texte.** Testschlüssel tragen eine Erkennungsmarke und dürfen in keinem Export stehen. Keine urheberrechtlich geschützten Volltexte und keine privaten Daten im Repository.
8. **Regressionen behalten.** Tests zu Befunden aus Reviews behalten ihre Kennung (F01–F13, RC…, RV…) im Namen; der Kopfkommentar der Datei nennt Review und Datum, weil dieselbe Kennung in mehreren Reviews vorkommt. Ein Regressionstest wird nicht entfernt, weil ein anderer ähnlich heißt.
9. **Ein Test, eine Aussage.** Der Name sagt, welches Verhalten gilt; Tabellenfälle mit `it.each` und sprechenden Fallnamen.

## Browsertests

`npm run test:browser` baut die App, startet `vite preview` auf Port 4173 und prüft mit Chromium:

- `hauptablauf.spec.ts`: Meldung als JSON herunterladen und genau diese Datei wieder öffnen; Lagebild mit Beispiel, Redaktionscheck und PDF; KI-Erfassung S1 mit simuliertem Anbieter bis zur Bestätigung, Laufprotokoll ohne Schlüssel
- `abbruch.spec.ts`: Abbrechen während S1, Protokoll des abgebrochenen Laufs, keine neue Anfrage
- `wiederherstellung.spec.ts`: Zwischenstand übersteht ein Neuladen (echte IndexedDB)
- `speicherfehler.spec.ts`: voller Speicher beim Zwischenstand wird gemeldet, die Eingabe bleibt
- `barrierefreiheit.spec.ts`: zugängliche Namen aller Bedienelemente je Bereich (von Chromium berechnet), Tastaturbedienung mit sichtbarem Fokus, erzwungene Farben
- `pwa.spec.ts`: Service Worker übernimmt die Seite, App startet nach dem ersten Besuch ohne Netz, Beispiel im Lagebild und PDF offline, Hinweis zum fehlenden Netz, Manifest und Symbole werden ausgeliefert (Service Worker nur hier zugelassen)
- `eingabehilfen.spec.ts`: LEAD-Eingabehilfen mit der Tastatur (Bereich öffnen, Vorlage einfügen, Fokus und Markierung im Textfeld), zugängliche Namen bei geöffneten Bereichen, keine Anfrage nach außen

Einmalig vorher: `npx playwright install chromium`. Ist ein Chromium schon vorhanden, genügt `PLAYWRIGHT_CHROMIUM_PFAD=/pfad/zu/chrome npm run test:browser`. Bei Fehlern liegen Spuren unter `test-results/` (`npx playwright show-trace …`).

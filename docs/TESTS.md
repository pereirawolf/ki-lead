# Tests

KI-LEAD prüft sich auf drei Ebenen. Die Tests der ersten beiden rufen keinen echten KI-Anbieter auf und verursachen keine Kosten; die Modellbewertung läuft nur auf ausdrücklichen Auftrag.

| Ebene | Befehl | Umgebung | Inhalt |
|---|---|---|---|
| Funktions- und Komponententests | `npm test` | Vitest, Node; Oberfläche in jsdom | `tests/<bereich>/*.test.ts` |
| Browsertests | `npm run test:browser` | Playwright, Chromium (Kerntests in der CI auch WebKit), Produktionsbuild | `tests/browser/*.spec.ts` |
| Modellbewertung | nur auf Auftrag | echte Läufe, eigenes Budget | `evaluation/` (siehe dortige README) |
| Mistral-Probe | Label „mistral-probe“ am Pull Request oder Workflow von Hand | Playwright, echter Testschlüssel aus dem Secret `MISTRAL_API_KEY`, wenige Cent | `tests/probe/mistral.spec.ts` mit `playwright.probe.config.ts` |

Weitere Befehle:

- `npm run test:zufall`: alle Tests in zufälliger, fester Reihenfolge (Startwert 20261021). Scheitert ein Test nur hier, hängt er von einem anderen ab.
- `npm run test:ui`: nur die Oberflächentests in jsdom.
- `npm run pruefe-profile`: nur die Profiltests (`tests/profil/`), auch für eigene Profile unter `privat/profile/`.
- `npm run test:inhalt`: Profil-, Kern- und Evaluationstests; schnelle Rückmeldung bei Arbeit an SOP, Arbeitsanweisungen oder Profilen.
- `npm run test:browser:kern` und `npm run test:browser:pwa`: nur eines der beiden Chromium-Projekte (siehe unten).
- `npm run test:browser:webkit` (seit 0.6.5, TP-2026-W44-22): die Kerntests in WebKit (Safari, auch iOS); braucht einmalig `npx playwright install webkit` und ist nicht Teil von `npm run test:browser`.
- `npx vitest run tests/kern/zeit.test.ts`: eine Datei; `npx vitest` für den Beobachtungsmodus.
- `npm run test:coverage` (seit 0.6.2): alle Tests mit Abdeckung (V8) für `src/kern`, `src/pipeline`, `src/anbieter` und seit 0.6.3 `src/forschung` (vorher Teil von `src/pipeline`); scheitert unter den Mindestwerten in `vite.config.ts` (Anweisungen 93 %, Zweige 78 %, Funktionen 96 %, Zeilen 96 %, knapp unter dem Stand vom 26.10.2026). Nicht Teil von `npm test`; Bericht unter `coverage/`.
- `npm run lint` und `npm run format:check` (seit 0.6.2): ESLint mit typescript-eslint (`eslint.config.js`) und Prettier für Code, Tests, Skripte und Konfiguration; die CI führt beide vor den Tests aus. `no-explicit-any` ist eine Warnung und lässt den Lauf bestehen.

## WebKit und wiederholtes Neuladen

Playwright ist auf 1.57.0 festgelegt. Die zuvor verwendete Version 1.56.1 enthält einen WebKit-Fehler bei wiederholtem Neuladen nach `history.pushState()` ([Playwright #37766](https://github.com/microsoft/playwright/issues/37766)). Er lässt sich ohne KI-LEAD und ohne IndexedDB reproduzieren. Nach einer Änderung der Playwright-Version sind die zugehörigen Browser mit `npx playwright install chromium webkit` neu zu installieren. Der Test `navigation-neuladen.spec.ts` hält das wiederholte Neuladen nach Ansichtswechseln fest.

## Gestaffelte Prüfung in GitHub Actions

Nicht jede Änderung braucht jeden Test. Änderungen an der LEAD-Systematik (SOP, Arbeitsanweisungen, Kodierleitfaden), an der Dokumentation oder an den Bewertungsfällen ändern weder Programmcode noch Bedienoberfläche; ihre Konsistenz prüfen die Vitest-Tests unter `tests/profil/`, `tests/kern/` und `tests/evaluation/`.

| Anlass | Vitest | Build | Browser: kern (Chromium und WebKit) | Browser: pwa |
|---|---|---|---|---|
| Push auf `main`, wöchentlicher Volllauf (montags), manueller Start | gewöhnliche und zufällige Reihenfolge | ja | immer | immer |
| Pull Request | zufällige, feste Reihenfolge | ja | wenn nicht nur Inhalte geändert sind | wenn PWA-Mechanismus oder Testumgebung betroffen ist |

Welche Dateien was auslösen, legt `scripts/pruefumfang.mjs` fest; `tests/ci/pruefumfang.test.ts` hält die Regeln mit Tabellenfällen und Wächtern fest. Grundsatz **„im Zweifel prüfen“**: Die Kern-Browsertests entfallen nur, wenn _jede_ geänderte Datei auf der Liste reiner Inhalte steht (`docs/`, `evaluation/`, Markdown im Wurzelordner, `profile/*/sop/`, Markdown-Dateien der Profile, Vorlagen für Issues). `meldung.ui.json`, `meldung.schema.json`, `profil.json` und Beispielmeldungen eines Profils gehen in den Build und die Oberfläche ein und lösen die Kern-Browsertests aus, ebenso jede unbekannte Datei. Ausnahme unter `evaluation/` (seit 0.5.12, `IN_DER_APP`): Fälle, Pläne und Material, die der Vergleichslauf Ilka in die App einbettet (unter anderem die Musterfassung Ilka), seit 0.5.13 auch der Plan des Prüffalls Reparatur; ein Wächter prüft, dass jeder Import aus `evaluation/` unter `src/` dort steht und jede Regel mindestens einen Import trifft. Ist die Liste der geänderten Dateien leer oder nicht ermittelbar, läuft alles.

Vor allen Tests prüft jeder Lauf mit `npm audit --omit=dev --audit-level=high` die ausgelieferten npm-Pakete auf bekannte Schwachstellen und bricht ab hohen Meldungen ab (seit TP-2026-W44-37). Alle Actions sind per Commit-SHA mit Versionskommentar eingebunden (TP-2026-W44-36); beides hält `tests/ci/actions.test.ts` fest.

Was ein Pull Request auslässt, läuft spätestens nach dem Zusammenführen auf `main` vor der Veröffentlichung; scheitert dort ein Test, wird nicht veröffentlicht. Der Wochenlauf veröffentlicht nichts.

Die Browsertests verwenden in der CI den eben erzeugten Ordner `dist/` (`KI_LEAD_BUILD_VORHANDEN=1`), laufen mit zwei Workern und nehmen Chromium aus dem Cache der Actions. WebKit lädt der Lauf eigens (`npx playwright install --with-deps webkit`), nur wenn die Kerntests anstehen. Die WebKit-Tests blockieren und sind auf 20 Minuten begrenzt. Die Installation ist auf 10 Minuten begrenzt und nicht blockierend, weil sie in der CI wiederholt hing; scheitert sie, entfallen die WebKit-Tests mit einer Warnung am Lauf. Fehlschläge der Browsertests meldet der Reporter „github“ als Annotation.

## Gliederung

| Ordner | Gegenstand |
|---|---|
| `tests/kern/` | Schemaprüfung (mit Ajv-Referenz), Migration, Zeit und Fristen, Quellen, Kennsätze, LEAD-Eingabehilfen, Ausgaben, Dateinamen, Beispieldatensatz; Schichten des Quellcodes (`schichten.test.ts`, seit 0.6.3: Importkanten je Verzeichnis gegen eine Positivliste, Pakete je Schicht, keine Zyklen, IndexedDB nur in `speicher`, `schluessel`, `darstellung`, Evaluationsmaterial nur in `forschung`) |
| `tests/profil/` | Profile laden und prüfen (auch LEAD-Eingabehilfen), Manifest, Schemaeignung, Fassungen, SOP-Integration, Redaktionsregeln der SOP-Sammelmappe, Arbeitsanweisungen und Dokumentation gegen das Profil (Konsistenzprüfungen), Profilansicht, Vorlage gegen das Beispielprofil, private Profile |
| `tests/pipeline/` | Einstellungen und Vorgaben, Aufwand je Modell und Standard-Profile, Kontext, Material, JSON aus Antworten, Stufen S1–S3, Fortschreibung einer eigenen Vormeldung, Verdichtung, Nachbearbeitung, Eingangsquellen, Kurzfassung, Laufkosten, Schätzung, Vergleich und Mehrfachvergleich mit Krippendorffs Alpha, unveränderte Übergabe der Auftragsfelder an die KI, Recherchetiefe (Stufen, Prüfung getippter Werte, Umrechnung, Höchstkosten, Wirkung je Anbieter), Recherchewerte in der Wahl je Lauf, Angaben zu den Modellen (Anzeigenamen, Kostenklasse, Vermerke mit Verweis auf vorhandene Ergebnisberichte), verbindliche Recherche (Orientierungssuche je Sachverhalt mit erzwungener Suche und Rückfall, Zählung je abgerechnetem Aufruf, Pflichtsuchen nach der Recherchetiefe, Abgleich, amtliche Einstiege der SOPs, einmalige Nachforderung auch ohne amtliche Fundstelle, Recherchebefunde für jeden Lauf einschließlich `KEINE_PRIMAERQUELLE`; `recherche-pflicht.test.ts`) |
| `tests/forschung/` | seit 0.6.3 (TP-2026-W44-25, vorher unter `tests/pipeline/`): Vergleichslauf mit festem S1-Gegenstand, Umfänge des Vergleichslaufs (S1 bis Management Summary aus der Musterfassung), Auswertung der Vergleichsläufe, Prüffall Reparatur (Defekte, Inhaltsvergleich, Plan, Schätzung, ZIP), Plausibilitätsprüfung |
| `tests/speicher/` | seit 0.6.3 (TP-2026-W44-24, vorher unter `tests/pipeline/`): Laufprotokolle im Gerätespeicher (nur `lauf:…`, Schutz des Speichers) |
| `tests/anbieter/` | SSE-Leser, Adapter für Anthropic, OpenAI, Mistral und seit 0.6.3 Ollama (nur mit gefälschtem `fetch`), gemeinsamer Vertrag aller Adapter (Wiederholungen, Abbruch), Preise, Verteiler mit Registry der Anbieter (unbekannte Kennung als Fehler) |
| `tests/lagebild/` | Lagebild und Redaktionscheck (Logik) |
| `tests/dokumente/` | PDF und Kopiervorlage |
| `tests/darstellung/` | Farbschemata, Kontraste, Barrierefreiheit im Stylesheet; seit 0.6.5 Farbtoken-Fallback aus dem Katalog (`fallback.test.ts`, TP-2026-W44-19) |
| `tests/ui/` | Oberfläche in jsdom: App-Zustand, Erfassung, LEAD-Eingabehilfen, Lagebild, Modelle und Recherche je Lauf (Kopfzeile, Rahmen und Reihenfolge, KI-Profil je Lauf, gesperrte Modelle und Profile ohne Schlüssel, Hinweis auf zusätzliche Anbieter, Aufwand mit Anpassungshinweis und Schätzung, S3 unter „Weitere Stufe“, Recherchetiefe mit Höchstkosten und gesperrten Feldern, Zurücksetzen), Einstellungen (Bereiche, Übersicht, KI-Profil, Testläufe als eigener Bereich, Schlüssel, Grenzen), Fortschreibung, S1 an der Ausgabegrenze, Farbschema, Redaktionscheck, Über KI-LEAD und Fuß (Impressum, Version), KI-Chip der Kopfleiste („KI offline“/„KI online“), Testläufe (sechs Testarten mit S3 Reparatur, Varianten, ZIP-Dateien, Archiv mit Herunterladen und Löschen), Meldung mit dem Schritt „Management Summary“, Eingabefelder der KI-Erfassung (Beschriftung, verknüpfter Hilfetext, Platzhalter), Recherchetiefe unter „Recherche & Grenzen“, Profilansicht (Reihenfolge, kompakte Zeilen, Gruppen und Sprungleiste, Menüs „Profil hinzufügen“ und „Mehr“, Befund-Chip), Orientierung und Suchbegriffe im Bestätigungsschritt mit Pflichtsuchen in S2 und getrennter Ausweisung (`orientierung.test.ts`); seit 0.6.5 Befunde am Feld mit `aria-invalid`, Sprung aus dem Prüfschritt und Bewertungsfarben nach Rang mit der Vorlage `profile/muster/` (`erfassung.test.ts`, TP-2026-W44-15, -16); seit 0.6.6 Laufzeile der Management Summary (Uhr, erwartete Dauer, Zeichen, voraussichtliche Kosten) und ihre Meldung an den KI-Chip bis Ende, Abbruch und Verlassen (`kurzfassung-lauf.test.ts`); seit 0.6.7 Sprungziele und Fokus nach „Weiter“/„Zurück“, Schrittleiste, Listeneinträgen, Bereichen der Einstellungen und Wechsel der Ansicht (`sprungziele.test.ts`) |
| `tests/evaluation/` | Schemata der Modellbewertung (Fälle mit Radarerwartungen und Abwandlungen, Bewertungspläne mit festem S1-Gegenstand und Prüfsumme, Bewertungen mit Korrekturen und Grad der Verblindung, Pläne mit fester Meldung für Management Summary und Prüffall Reparatur), Musterfassung Ilka (Schema, Plausibilität, Herkunft jeder Zahl aus den Eingängen), Vorprüfung der Management Summary, des Befundregisters und der Prüfsteine (ohne KI-Aufruf) |
| `tests/schluessel/` | Ablage der API-Schlüssel: Vorgabe, Sitzung, Passphrase (Round-trip, falsche Passphrase, Sperre, Verwerfen; seit 0.6.2), Schlüsselbund (mit Attrappe), Umzug beim Wechsel, Fehlerfälle, Auswahl in den Einstellungen |
| `tests/nativ/` | Projektdateien der nativen Apps: App-Kennung, Versionen, Plugin eingebunden, Sicherung, Exportangabe, Symbole |
| `tests/pwa/` | PWA: Dateiliste und Version des Service Workers, Bedingungen der Anmeldung, Hinweise, Manifest und Symbole |
| `tests/lizenzen/` | Drittkomponenten: Lizenzen der Laufzeitpakete nach `package-lock.json` gegen die Positivliste, Vollständigkeit von THIRD-PARTY-NOTICES.md, native Versionen, Lizenzdateien im Build, SBOM in der CI; Inhalte: Geltungsbereich in `LICENSE-CONTENT`, CC0-Widmung, Kurzsatz in den Dokumenten, Lizenzangaben der Profile |
| `tests/browser/` | Hauptablauf, Sprungziele (seit 0.6.7), Abbruch, KI-Chip der Kopfleiste („KI offline“/„KI online“), Wiederherstellung, Speicherfehler, Barrierefreiheit, Einstellungen (Bereiche mit Tastatur und auf dem Smartphone) und Offline-Start der PWA im echten Browser |
| `tests/ci/` | Prüfumfang der gestaffelten Prüfung (`scripts/pruefumfang.mjs`) mit Wächtern gegen veraltete Pfadlisten |
| `tests/support/` | gemeinsame Hilfen (keine Tests) |

Wo welcher frühere Test steht, zeigt [TESTZUORDNUNG.md](TESTZUORDNUNG.md).

## Gemeinsame Hilfen (`tests/support/`)

| Datei | Zweck |
|---|---|
| `dateien.ts` | `REPO`, `repoPfad()`, `leseOrdner()` (sortiert), `profil()`, `jsonDateien()` (sortiert; mit `pflicht: true` Fehler bei fehlendem oder leerem Ordner), `stylesheetText()` (seit 0.6.5: `src/styles.css` mit den eingebundenen Teildateien unter `src/styles/` in Reihenfolge der Importe) |
| `fixtures.ts` | Datensatz Orkantief „Ilka“: `ilkaMeldung("HE")` liefert genau die Meldung mit diesem Kennzeichen als frische Kopie; nie über die Reihenfolge (`[0]`) wählen |
| `anbieter.ts` | `llmAntwort()`, `meldungsAntwort()`, `skriptAnbieter()` (Antworten der Reihe nach, ein zusätzlicher Aufruf scheitert), `sseText()`, `sseAntwort()` (Teilung an Bytepositionen), `abreissenderStrom()`, `fehlerAntwort()`, `ohneWarten()` (gefälschte Uhr, misst Wartezeiten) |
| `pipeline.ts` | `pipelineKontext()` mit Beispielprofil und fester Uhr, `s1Vorschlag()`, `bestaetigterVorschlag()` |
| `speicher.ts` | Attrappe für `idb-keyval` mit auslösbaren Lese-, Schreib- und Auflistungsfehlern (`speicherVoll()`) |
| `dom.ts` | `einhaengen()`, `aushaengen()`, `klick()`, `eingeben()`, `knopf()`, `bisWahr()` (wartet auf einen Zustand statt einer festen Zeit; unter `vi.useFakeTimers()` stellt `takt()` die gefälschte Uhr vor, statt real zu warten); seit 0.6.5 `dialogAntwort()` (beantwortet den Rückfragedialog wie zuvor ein Stub von `window.confirm`; Vorgabe „ja“) und `dialogeOffenLassen()`, dazu `showModal`/`close` für jsdom; seit 0.6.7 `window.scrollTo` für jsdom mit `scrollAufrufe()` (Ziele der Aufrufe seit dem letzten Abruf) |
| `ajv.ts` | `referenzAjv()` mit festen Optionen, `gleichWieAjv(schema, daten, soll)` mit Diagnose |
| `eingebaut.ts` | zwei eingebaute Profile mit verschiedener Kennung für Tests des Profilwechsels |

## Regeln

1. **Unabhängiges Soll.** Erwartete Werte stehen als feste Werte im Test oder folgen aus einer Regel, die der Test selbst nennt; sie werden nie mit der geprüften Funktion berechnet. Beim Vergleich mit Ajv kommt ein eigenes Soll hinzu, damit zwei zugleich nachgiebige Prüfer nicht unbemerkt bleiben.
2. **Kein Zufall.** Kein `Math.random`, keine Abhängigkeit von Reihenfolge oder Uhrzeit; Uhr und Zeitzone werden gesetzt, wo sie zählen.
3. **Keine festen Pausen.** Oberflächentests warten mit `bisWahr()` auf einen sichtbaren oder gespeicherten Zustand. Prüft ein Test, dass etwas _nicht_ geschieht, wartet er erst auf den positiven Zustand und lässt dann ausstehende Arbeit auslaufen. Hängt ein Zustand an einem Zeitgeber der App (etwa dem Autospeichern 1,2 s nach der letzten Eingabe), läuft der Test mit `vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })`; `bisWahr()` stellt die Uhr dann vor. In den Browsertests sind die verbliebenen Pausen in `pwa-update.spec.ts` und `abbruch.spec.ts` Beobachtungsfenster für Negativprüfungen (kein Neuladen, keine neue Anfrage), bemessen an den Zeitgebern der Startprüfung; sie werden nicht verkürzt.
4. **Keine echten Wartezeiten.** Wiederholungen und Abbrüche der Anbieter laufen mit `ohneWarten()`; geprüft werden Zahl der Abrufe und Länge der Wartezeiten.
5. **Fixtures über ihr Kennzeichen.** Beispielmeldungen mit `ilkaMeldung()`/`ilkaDatei()`; fehlende Pflichtdaten lassen den Test scheitern statt ihn leer bestehen zu lassen.
6. **Keine echten KI-Aufrufe.** Anbieter werden als Attrappe (`skriptAnbieter`, `abruf`-Parameter der Adapter) oder im Browser am Netzwerkrand simuliert; Browsertests brechen jede andere Anfrage nach außen ab und prüfen das.
7. **Keine Geheimnisse und keine fremden Texte.** Testschlüssel tragen eine Erkennungsmarke und dürfen in keinem Export stehen. Keine urheberrechtlich geschützten Volltexte und keine privaten Daten im Repository.
8. **Regressionen behalten.** Tests zu Befunden aus Reviews behalten ihre Kennung (F01–F13, RC…, RV…) im Namen; der Kopfkommentar der Datei nennt Review und Datum, weil dieselbe Kennung in mehreren Reviews vorkommt. Ein Regressionstest wird nicht entfernt, weil ein anderer ähnlich heißt.
9. **Ein Test, eine Aussage.** Der Name sagt, welches Verhalten gilt; Tabellenfälle mit `it.each` und sprechenden Fallnamen.

## Browsertests

`npm run test:browser` baut die App, startet `vite preview` auf Port 4173 und prüft mit Chromium in zwei Projekten: **kern** (alle Dateien außer `pwa*.spec.ts`) und **pwa** (`pwa.spec.ts`, `pwa-update.spec.ts`). Das dritte Projekt **webkit** (seit 0.6.5) führt die Dateien von kern in WebKit aus (`npm run test:browser:webkit`); der Test zu erzwungenen Farben läuft nur in Chromium, weil sich `forced-colors` nur dort nachbilden lässt. Mit `KI_LEAD_BUILD_VORHANDEN=1` entfällt der Build, und ein vorhandener Ordner `dist/` wird verwendet (nur sinnvoll direkt nach `npm run build`).

- `hauptablauf.spec.ts`: Meldung als JSON herunterladen und genau diese Datei wieder öffnen; fünfter Schritt „Management Summary“ mit Feldauszug (seit 0.5.17); Lagebild mit Beispiel, Redaktionscheck und PDF; KI-Erfassung S1 mit simuliertem Anbieter bis zur Bestätigung, Laufprotokoll ohne Schlüssel; seit 0.6.5 Fokus auf der Überschrift nach S1 und im Übergabedialog mit Escape (TP-2026-W44-13), Rückfragen im eigenen Dialog statt `window.confirm` (TP-2026-W44-20)
- `sprungziele.spec.ts` (seit 0.6.7): „Weiter“ und „Zurück“ der Meldung vom Seitenende aus, breit und 390 px: Anfang des Arbeitsbereichs unter dem Kopf, Fokus auf der neuen Überschrift; Hauptnavigation an den Seitenanfang, KI-Erfassung an die zuletzt gesehene Stelle
- `kisymbol.spec.ts`: KI-Chip „KI offline“/„KI online“ in jeder Ansicht, nach S1 offline bis S2; seit 0.6.12 reine Statusanzeige ohne Knopf und „KI online“ während des Verbindungstests der API-Schlüssel (KP-2026-W44-01)
- `baukasten.spec.ts` (seit 0.6.11): Baukasten „Neue Zeile zusammenstellen“ im Zeitstrahl, breit und 390 px: Felder direkt im Baukasten ohne Raum unter dem Eingabefeld, Vorschau ohne Lücke
- `abbruch.spec.ts`: Abbrechen während S1, Protokoll des abgebrochenen Laufs, keine neue Anfrage
- `wiederherstellung.spec.ts`: Zwischenstand übersteht ein Neuladen (echte IndexedDB)
- `speicherfehler.spec.ts`: voller Speicher beim Zwischenstand wird gemeldet, die Eingabe bleibt
- `daten.spec.ts` (seit 0.6.13): Gerätestand sichern ohne API-Schlüssel, alle Daten löschen, Sicherung einspielen (echte IndexedDB; TP-2026-W44-44, -45)
- `barrierefreiheit.spec.ts`: zugängliche Namen aller Bedienelemente je Bereich (vom Browser berechnet), Hilfetexte der Auftragsfelder der KI-Erfassung als zugängliche Beschreibung (seit 0.5.18), Tastaturbedienung mit sichtbarem Fokus, erzwungene Farben (nur Chromium); seit 0.6.5 kein Sekundenzähler in einer Live-Region (TP-2026-W44-12), eindeutige Namen je Liste (TP-2026-W44-14) und axe-core (`@axe-core/playwright`) je Bereich mit allen Schritten, Reitern und Bereichen gegen WCAG 2.0/2.1/2.2 A und AA, breit und hell sowie 390 px und dunkel, ohne Ausnahmen (TP-2026-W44-22; Ausnahmen kämen mit Begründung nach [BARRIEREFREIHEIT.md](BARRIEREFREIHEIT.md))
- `einstellungen.spec.ts`: jeder Bereich mit einer Überschrift und benannten Bedienelementen, Tastatur, schmale Ansicht ohne seitliches Scrollen, Bereich bleibt beim Wechsel der Ansicht, Schlüssel übersteht ein Neuladen; seit 0.6.5 Bereich und Reiter des Lagebilds in der Adresse mit Zurück, Vor und Neuladen (TP-2026-W44-20)
- `pwa-update.spec.ts`: Versionswechsel mit bestehendem Cache gegen einen Server wie GitHub Pages: Fehler mit dem Service Worker von 0.5.1 (Testvorlage `fixtures/sw-vorlage-0.5.1.js`), Korrektur, Installationsschutz, Wiederherstellung mit erhaltenen IndexedDB-Daten, kein Neuladen laufender Fenster mit ungespeicherten Eingaben, keine Übernahme durch Reste gescheiterter Installationen, Neuladen nur im anfordernden Fenster, Reparaturseite, Startprüfung
- `pwa.spec.ts`: Service Worker übernimmt die Seite, App startet nach dem ersten Besuch ohne Netz, Beispiel im Lagebild und PDF offline, Hinweis zum fehlenden Netz, seit 0.6.5 Start der KI-Erfassung ohne Netz gesperrt (TP-2026-W44-20), Manifest und Symbole werden ausgeliefert (Service Worker nur hier zugelassen)
- `testlaeufe.spec.ts` (bis 0.5.16 `vergleichslauf.spec.ts` und `reparaturprueffall.spec.ts`): Testläufe mit simuliertem Anthropic-Anbieter, S1 + S2 + S3 mit zwei Läufen und ZIP-Datei, S3 Reparatur mit einem Lauf über fünf Defekte (nur S3 ruft die API auf); Archiv in der echten IndexedDB übersteht ein Neuladen, liefert dieselbe Datei und lässt sich leeren
- `eingabehilfen.spec.ts`: LEAD-Eingabehilfen mit der Tastatur (Bereich öffnen, Vorlage einfügen, Fokus und Markierung im Textfeld), zugängliche Namen bei geöffneten Bereichen, keine Anfrage nach außen

Einmalig vorher: `npx playwright install chromium` (für `test:browser:webkit` zusätzlich `npx playwright install webkit`). Ist ein Chromium schon vorhanden, genügt `PLAYWRIGHT_CHROMIUM_PFAD=/pfad/zu/chrome npm run test:browser`. Bei Fehlern liegen Spuren unter `test-results/` (`npx playwright show-trace …`).

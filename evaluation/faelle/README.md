# Bewertungsfälle

Je Datei ein Fall nach `fall.schema.json` (`format: "ki-lead-evaluationsfall/1"`). Material liegt entweder im Repository (`datei`, nur fiktive oder frei lizenzierte Inhalte) oder wird nur beschrieben (`extern` mit `sha256`, Inhalt nicht eingecheckt).

- `orkantief-ilka-verdichtung.json`: Verdichtung der sechs fiktiven Ländermeldungen ohne Websuche; die verdichtete Meldung der Koordinierungsstelle im selben Ordner dient als Referenzfassung für den Vergleich in der App, nicht als Musterlösung. Zur fachlichen Bewertung: [Bewertungshilfe Ilka](../bewertungshilfen/orkantief-ilka.md).

- `sop-*.json` (40 Fälle vom 21.10.2026): kurze, vollständig fiktive Prüffälle zu den Prüfpfaden der SOP-Sammelmappe (alle Dach-SOPs B01–B17 und Bausteine C01–C17); Material unter `../material/`, Plan und Soll-Abdeckung unter `../plaene/`. Bewertungen liegen noch nicht vor.

- `sop-*.json` (8 Fälle vom 24.10.2026, Befunde LS-2026-W43-06 bis -13): weitere vollständig fiktive Prüffälle für bis dahin nur einmal abgedeckte SOPs und Bausteine (B03, B04, B13, B15, B16, C03, C04, C05, C08, C17), gestreut über Referenzraum (Kreis, Land, Bund, Ausland mit Deutschlandbezug), Schwierigkeit und Phase (Vorwarnung, akute Lage, Nachlauf); alle mit erwarteten Radarwerten, zwei davon als Abwandlung (`sop-weltraumwetter-warnung-unbestaetigt`, `sop-vulkanasche-transport-zeitluecke`). Insgesamt 48 `sop-*`-Fälle; Soll-Abdeckung in `../plaene/2026-10-21-sop-abdeckung.json` (Stand 24.10.2026). Nicht Teil von Bewertungsplan 1 vom 21.10.2026; Bewertungen liegen noch nicht vor.

- `zaehlregel-*.json` (5 Fälle vom 25.10.2026, Befund LS-2026-W43-17): kleine, vollständig fiktive Fälle zu je einem Fehlermuster der Zählregeln aus dem Vergleichslauf Ilka: gezählte gegenüber hochgerechneten Werten (`zaehlregel-hochrechnung`), direkte gegenüber mittelbarer Betroffenheit (`zaehlregel-mittelbar`), Gesamtzahl gegenüber Teilmenge (`zaehlregel-teilmenge`), Quellen- und Länderzuordnung (`zaehlregel-laenderzuordnung`), Datenstand und Fortgeltung zu t0 (`zaehlregel-fortgeltung`). Personen gegenüber Anschlüssen decken die vorhandenen Fälle `sop-gas-netzbetreiber`, `sop-hochwasser-abschaltung` und `sop-sturm-winter-uebergang` ab. Alle gehören zum Entwicklungssatz (siehe `../plaene/2026-10-25-kontrollsatz.md`). Insgesamt 53 Fälle in der Soll-Abdeckung (Stand 25.10.2026).

- `ilka-management-summary.json` (25.10.2026): Management Summary aus einer festen Meldung (`auftrag.kurzfassung`, Material mit Rolle `meldung`): der [Musterfassung Ilka](../material/ilka-musterfassung.json). Alle KI-Profile gehen von derselben Eingabe aus; Plan `../plaene/management-summary-ilka.json` mit Prüfsumme der Meldung (`meldung_fest`).
- `ilka-reparatur.json` (25.10.2026): Prüffall Reparatur (S3) (`auftrag.reparatur`, Material mit Rolle `meldung`): Die App beschädigt die Musterfassung Ilka nach den Defekten R1–R5 in `src/forschung/reparaturtest.ts` (bis 0.6.2 `src/pipeline/`) und lässt sie mit dem gewählten Modell reparieren; S1 fest (`ilka-s1-zuschnitt-a.json`), S2 ohne KI-Aufruf. Plan `../plaene/reparatur-ilka.json` mit Prüfsummen von Meldung und S1-Gegenstand.

Ein Fall mit urheberrechtlich geschütztem Material (etwa ein Zeitungsartikel) nennt die URL und die Prüfsumme der verwendeten Fassung, aber nie den Text.

## Erwartete Radarwerte und Abwandlungen

- `erwartungen.radar`: erwartete Werte des Lagenradars je Achse, entweder als fachlich vertretbare Spanne (`min`, `max`, 0–6) oder als `offen`, jeweils mit `grund`. Eine Achse ohne Eintrag heißt: keine Erwartung. Nur für Fälle mit genau einem erwarteten Sachverhalt. Punktwerte sind erst vorgesehen, wenn der Kodierleitfaden sie trägt. Beispiel: `sop-gas-stabil` erwartet D2 offen.
- `variante_von` und `abwandlung`: kennzeichnen einen Fall als gezielte Abwandlung eines vorhandenen Falls. `abwandlung` nennt die geänderte Stellgröße, möglichst genau eine; alles Übrige bleibt gleich. Beide Felder stehen nur gemeinsam.

Mehrere Fälle zu einem Testset fasst ein Bewertungsplan unter `../plaene/` zusammen (`plan.schema.json`). Mehrere Kodierungen derselben Lage vergleicht `npm run vergleich:mehrfach` (siehe [../README.md](../README.md)).

## Neuen fiktiven Fall anlegen

1. **Lücke benennen:** Welche Dach-SOP, welcher Baustein oder welche Stolperstelle ist noch nicht oder nur einmal abgedeckt (`../plaene/2026-10-21-sop-abdeckung.json`)? Keine Dopplung vorhandener Fälle.
2. **Fall** als `<id>.json` nach `fall.schema.json`: Dateiname gleich `id`, `"fiktiv": true`, Titel mit „(FIKTIV)“, `stand` und `stichtag` gesetzt.
3. **Material** als `../material/<id>.md`, beginnend mit „FIKTIVES ÜBUNGSMATERIAL – keine reale Lage“, Hinweis auf erfundene Stellen und Zeitbezug (Europe/Berlin). Nur erfundene Stellen und allgemeine Behördentypen, keine echten Personen, Unternehmen oder Ereignisse, keine Texte Dritter, keine personenbezogenen Daten, kein Abstellen auf landesrechtliche Normen.
4. **Auftrag** auf das Material beschränken (`websuche: false`, Prüffrage ohne Live-Recherche).
5. **Erwartungen** nur aus dem Material: Aussagen unter `muss`, typische Fehlannahmen unter `darf_nicht`, `t0`, `referenzraum`, `ereignisarten` aus dem Profil; Radarerwartungen als Spanne oder `offen` mit Grund.
6. **Abwandlung** eines vorhandenen Falls mit `variante_von` und `abwandlung` kennzeichnen.
7. **Abdeckung** in `../plaene/` nachtragen.
8. **Prüfen:** `npm run test:inhalt`.

Meldungen, Laufprotokolle und Rohantworten zu diesen Fällen werden nicht eingecheckt; ins Repository gehen nur zusammengefasste Bewertungen unter `../ergebnisse/`.

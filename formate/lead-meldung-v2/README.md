# LEAD-Meldung v2 (Entwurf)

Meldungsformat `LEAD-Meldung-v2`, Formatfassung 2.0, **Entwurf zur fachlichen Abnahme** vom 01.11.2026. Beschreibung, Grundsätze, Migration und Abwägung: [docs/LEAD-MELDUNG-V2.md](../../docs/LEAD-MELDUNG-V2.md).

App und mitgelieferte Profile arbeiten bis zur Umstellung weiter mit `LEAD-Meldung-v1`.

| Datei | Inhalt |
|---|---|
| `kern.schema.json` | Kernschema: Identität, Absender, Zeit und Raum, Quellen, Sachverhalte mit Analyse, Bewertung, Handlungsbedarf, Kennzahlen und Zeitstrahl, Fehlanzeige, Freigabe, Entstehung; Fachmodule offen |
| `module/lead-bevoelkerungsschutz.schema.json` | Fachmodul 1.0: Ereignisarten des Katalogs und Lagenradar D1–D8 je Achse mit Stufe, Status, Grund und Belegen |
| `zusammenstellungen/*.json` | Zusammenstellung je Profil: Kern, Module, Einschränkungen (Gebiete, Ebenen, Quellenkategorien) |
| `beispiel/meldung.schema.json` | erzeugtes Schema für das Beispielprofil (Bund und Länder) |
| `beispiel-land/meldung.schema.json` | erzeugtes Schema für das Landesprofil Thüringen (Land und Kreise) |
| `beispiele/` | fiktive Meldungen: Thüringen zum Orkantief „Ilka“ (aus v1 überführt und von Hand vervollständigt) und eine Fehlanzeige |

Die Dateien in `beispiel/` und `beispiel-land/` werden erzeugt, nicht von Hand geändert; ein Test prüft, dass sie aktuell sind.

## Werkzeug

```sh
# Profilschema aus einer Zusammenstellung erzeugen
npm run meldung:v2 -- schema formate/lead-meldung-v2/zusammenstellungen/lead-beispiel.json formate/lead-meldung-v2/beispiel/meldung.schema.json

# v1-Meldungen überführen (LEAD-Meldung-v1 und LEAD-Meldung-Land-v1); Hinweise stehen in entstehung.migration.hinweise
npm run meldung:v2 -- migriere profile/lead-beispiel/beispiele/orkantief-ilka/*.json --ziel privat/v2 --zeitzone Europe/Berlin

# v2-Meldungen prüfen: Schema (Prüfebene 1) und Verweise und Konsistenz (Prüfebene 2)
npm run meldung:v2 -- pruefe privat/v2/*.json --schema formate/lead-meldung-v2/beispiel/meldung.schema.json
```

## Lizenz

CC BY 4.0; Schemata und Zusammenstellungen zusätzlich CC0 1.0 (`LICENSE-CONTENT`, Nr. 1 e und 2 e).

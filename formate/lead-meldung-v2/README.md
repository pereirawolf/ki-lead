# LEAD-Meldung v2 (Entwurf)

Meldungsformat `LEAD-Meldung-v2`, Formatfassung 2.0, **Entwurf zur fachlichen Abnahme** vom 01.11.2026. Beschreibung, Grundsätze, Migration und Abwägung: [docs/LEAD-MELDUNG-V2.md](../../docs/LEAD-MELDUNG-V2.md).

Die mitgelieferten Profile arbeiten bis zur Umstellung weiter mit `LEAD-Meldung-v1`. Die App liest v2 seit 0.7.0 (Migration, Referenzprüfung), erfasst und gibt v2 seit 0.7.3 aus (Maske, PDF, Kopiervorlage), erzeugt v2 in der KI-Pipeline seit 0.8.0 und wertet v2-Felder im Redaktionscheck seit 0.8.3 aus.

| Datei | Inhalt |
|---|---|
| `kern.schema.json` | Kernschema: Identität, Absender, Zeit und Raum, Quellen, Sachverhalte mit Analyse, Bewertung, Handlungsbedarf, Kennzahlen (seit Nachtrag 14 auch Verhältniswerte mit Beobachtungszeitraum und Bezugsgröße) und Zeitstrahl, Fehlanzeige, sachverhaltsübergreifende Lage (seit Nachtrag 11), Freigabe, Entstehung; Fachmodule offen |
| `module/lead-bevoelkerungsschutz.schema.json` | Fachmodul 1.0: Ereignisarten des Katalogs und Lagenradar D1–D8 je Achse mit Stufe, Status, Grund und Belegen |
| `module/lead-baustein.schema.json` | Fachmodul 1.0 (seit App 0.8.0), profilneutral: Verweis Kennzahl → Kennzahlen-Baustein (Format, Fassung, Prüfsumme, Quelle, Kennzahl-IDs) und Kennungen von Einsatzmeldungen |
| `zusammenstellungen/*.json` | Zusammenstellung je Profil: Kern, Module, Einschränkungen (Gebiete, Ebenen, Quellenkategorien) |
| `beispiel/meldung.schema.json` | erzeugtes Schema für das Beispielprofil (Bund und Länder) |
| `beispiel/meldung.ui.json` | Vorlage der Darstellungsdatei für v2 (seit App 0.7.3): Schritte, Bezeichnungen und Hinweise der Felder, Rollen als Pfade, Lagenradar; Grundlage der Umstellung der Profile |
| `beispiel-land/meldung.schema.json` | erzeugtes Schema für das Landesprofil Thüringen (Land und Kreise) |
| `eingang/meldung.schema.json` | erzeugtes Eingangsschema (seit App 0.8.3): wie das Beispielprofil, aber ohne Liste der Ebenen und Gebiete des Absenders; für die Prüfung eingehender Meldungen der eigenen Kennung im Lagebild (`meldung.eingang_schemata`, Profilformat 1.33) |
| `beispiele/` | fiktive Meldungen: Thüringen zum Orkantief „Ilka“ (aus v1 überführt und von Hand vervollständigt) und eine Fehlanzeige |

Die Schemata in `beispiel/`, `beispiel-land/` und `eingang/` werden erzeugt, nicht von Hand geändert; ein Test prüft, dass sie aktuell sind. Die Darstellungsdatei `beispiel/meldung.ui.json` wird von Hand gepflegt; Tests laden sie mit dem Schema und prüfen Maske, PDF und Kopiervorlage.

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

# Zuordnung der Tests (Konsolidierung 21.10.2026)

Nachweis, dass bei der Neugliederung von `tests/` keine Prüfung verloren ging. Erzeugt aus den JSON-Berichten von Vitest vor (Stand `b4db4b5`, 0.4.22) und nach der Konsolidierung.

- Vorher: **415** Tests in 25 Dateien
- Nachher: **443** Tests in 46 Dateien; alle 415 bisherigen Tests unter unverändertem vollständigem Namen (`describe › it`) wiedergefunden, 28 neu
- Kennungen aus Reviews (F01–F13, RC…, RV…, SOP-…) bleiben im Testnamen. Gleiche Kennungen aus zwei Reviews (etwa F04, F05, F09, F11 vom 18.10. und vom 20.10.2026) unterscheidet die Spalte „Herkunft“ und der Kopfkommentar der Zieldatei.
- Fortgeschrieben (Stand 23.10.2026): Spätere Umbenennungen stehen mit Version und Commit in der Spalte „Änderung“; der bisherige Name in der ersten Spalte bleibt als Nachweis erhalten.
- „Änderung“ leer: Prüfung unverändert übernommen (nur Importe, gemeinsame Hilfen, Fixture-Auswahl über das Kennzeichen statt über die Reihenfolge).

## Zuordnung je bisheriger Datei

### `tests/anbieter.test.ts` (9)

Ziel: `tests/anbieter/anthropic.test.ts`, `tests/anbieter/preise.test.ts`, `tests/anbieter/strom.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| SSE › setzt Ereignisse über Chunk-Grenzen zusammen | `tests/anbieter/strom.test.ts` |  |
| Anthropic-Anbieter › baut den Anfragekörper mit Cache, Werkzeugen und Aufwand | `tests/anbieter/anthropic.test.ts` |  |
| Anthropic-Anbieter › liest einen Strom mit Websuche, Zitaten und Nutzung | `tests/anbieter/anthropic.test.ts` |  |
| Anthropic-Anbieter › setzt pause_turn fort und schickt die angehaltene Runde unverändert zurück | `tests/anbieter/anthropic.test.ts` |  |
| Anthropic-Anbieter › wiederholt bei Überlastung und meldet Schlüsselfehler verständlich | `tests/anbieter/anthropic.test.ts` | gefälschte Uhr; Zahl der Abrufe und Wartezeit geprüft |
| Preise › rechnet Haiku oberhalb von 100 000 Token mit dem höheren Satz | `tests/anbieter/preise.test.ts` |  |
| Abruffehler › ordnet verweigerte Abrufe ihrer URL zu und begrenzt die Seitenlänge | `tests/anbieter/anthropic.test.ts` |  |
| Verbindungsabbruch › setzt nach Abbruch mit vollständigem Suchergebnis fort | `tests/anbieter/anthropic.test.ts` | gefälschte Uhr; Wartezeit geprüft |
| Verbindungsabbruch › stellt die Anfrage ohne verwertbare Teilantwort neu und gibt nach drei Abbrüchen auf | `tests/anbieter/anthropic.test.ts` | gefälschte Uhr; Wartezeit geprüft |

### `tests/barrierefreiheit.test.ts` (4)

Ziel: `tests/darstellung/barrierefreiheit.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Lagenradar › nennt alle Achsenwerte im zugänglichen Namen, auch „offen“ | `tests/darstellung/barrierefreiheit.test.ts` |  |
| Stylesheet › ausgewählte Navigation, Reiter und Stufen sind auch ohne Farbe erkennbar | `tests/darstellung/barrierefreiheit.test.ts` |  |
| Stylesheet › Systemfarben: Auswahl über Highlight, kein Farbverlauf im Band, Radar in Systemfarben | `tests/darstellung/barrierefreiheit.test.ts` |  |
| Stylesheet › Kontrastschemata verstärken Konturen | `tests/darstellung/barrierefreiheit.test.ts` |  |

### `tests/dateinamen.test.ts` (17)

Ziel: `tests/kern/dateinamen.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| T-01/T-02: Beispiel aus der Anforderung › Entwurf als PDF und JSON | `tests/kern/dateinamen.test.ts` |  |
| T-01/T-02: Beispiel aus der Anforderung › finale Meldung ohne Zusatz | `tests/kern/dateinamen.test.ts` |  |
| T-01/T-02: Beispiel aus der Anforderung › abgeleitete Ausgaben übernehmen den Basisnamen | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Vorlage „{meldezeitpunkt}_X_{meldende_stelle}“ → genau ein Datum vorn | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Vorlage „X_{meldende_stelle}_{meldezeitpunkt}“ → genau ein Datum vorn | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Vorlage „X_{meldezeitpunkt}_{meldende_stelle}“ → genau ein Datum vorn | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Vorlage „{meldezeitpunkt}_X_{meldezeitpunkt}_{land}“ → genau ein Datum vorn | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Vorlage „Lagemeldung_{meldende_stelle}“ → genau ein Datum vorn | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › ohne Vorlage: Datum und Schema | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › ohne gültigen Meldezeitpunkt: Exportzeitpunkt in der Profilzeitzone | `tests/kern/dateinamen.test.ts` |  |
| T-03/T-04/T-05: Vorlagen, Rückfall und Rollen › Rolle meldezeitpunkt auf einem anderen Feld | `tests/kern/dateinamen.test.ts` |  |
| T-06: Zeitsemantik › lokale Wanduhrzeit bleibt, absolute Zeitpunkte werden in die Profilzeitzone umgerechnet | `tests/kern/dateinamen.test.ts` |  |
| T-06: Zeitsemantik › unbrauchbare Werte und ungültige Zonen | `tests/kern/dateinamen.test.ts` |  |
| T-07/T-11: Bereinigung, keine Verdopplung › Pfad- und Sonderzeichen werden ersetzt, Datumsangaben im Eigennamen bleiben | `tests/kern/dateinamen.test.ts` |  |
| T-07/T-11: Bereinigung, keine Verdopplung › Steuerzeichen, Pfadteile am Rand und überlange Namen | `tests/kern/dateinamen.test.ts` |  |
| T-07/T-11: Bereinigung, keine Verdopplung › Lauf-ID und Originalnamen behalten eigene Datumsanteile | `tests/kern/dateinamen.test.ts` |  |
| T-15: chronologische Sortierung › gleiches Format sortiert zeitlich | `tests/kern/dateinamen.test.ts` |  |

### `tests/einstellungen.test.ts` (5)

Ziel: `tests/pipeline/einstellungen.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Vorgaben und Umstellung der Einstellungen › S1 arbeitet ab Fassung 3 mit hohem Aufwand | `tests/pipeline/einstellungen.test.ts` |  |
| Vorgaben und Umstellung der Einstellungen › hebt die alte Vorgabe „medium“ aus Fassung 2 an | `tests/pipeline/einstellungen.test.ts` |  |
| Vorgaben und Umstellung der Einstellungen › lässt eine bewusst andere Wahl stehen | `tests/pipeline/einstellungen.test.ts` |  |
| Vorgaben und Umstellung der Einstellungen › stellt Fassung 1 in einem Schritt auf Fassung 3 um | `tests/pipeline/einstellungen.test.ts` |  |
| Vorgaben und Umstellung der Einstellungen › nach Fassung 3 bleibt „medium“ eine bewusste Wahl | `tests/pipeline/einstellungen.test.ts` |  |

### `tests/erfassung-zeit-quellen.test.ts` (11)

Ziel: `tests/kern/quellen.test.ts`, `tests/kern/zeit.test.ts`, `tests/profil/fassungen.test.ts`, `tests/ui/erfassung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Zeitwerte › zerlegen und verbinden | `tests/kern/zeit.test.ts` |  |
| Zeitwerte › Schema des Beispielprofils: Meldezeitraum und Eintritt mit oder ohne Uhrzeit, Meldezeitpunkt nur mit Uhrzeit | `tests/kern/zeit.test.ts` |  |
| Quellenzeilen › Kategorie und Art kombinieren | `tests/kern/quellen.test.ts` |  |
| Quellenzeilen › vorgeschlagene Kategorie, nächste Nummer, erster Platzhalter | `tests/kern/quellen.test.ts` |  |
| Quellenzeilen › ohne Kategorien im Profil: Zeile ohne Kategorie | `tests/kern/quellen.test.ts` |  |
| Quellenzeilen › Meldung aus dem Lagebild | `tests/kern/quellen.test.ts` |  |
| Erfassungsmaske › Meldezeitpunkt „Jetzt“ und „Leeren“; Meldezeitraum mit Uhrzeit und „Nur Tag“ | `tests/ui/erfassung.test.ts` | bedingtes Warten statt fester Pausen |
| Erfassungsmaske › unfertige Eingabe im Tagesfeld behält Tag und Uhrzeit | `tests/ui/erfassung.test.ts` | bedingtes Warten statt fester Pausen |
| Erfassungsmaske › Quellen: Kategorie und Art kombinieren, Zeile anfügen, Platzhalter markiert | `tests/ui/erfassung.test.ts` | bedingtes Warten statt fester Pausen |
| Erfassungsmaske › Quellen: Meldung aus dem gespeicherten Lagebild übernehmen | `tests/ui/erfassung.test.ts` | bedingtes Warten statt fester Pausen |
| Gültigkeitsstand in Teil A › nennt die Fassungen, die in den Köpfen der Dokumente stehen | `tests/profil/fassungen.test.ts` |  |

### `tests/farbschemas-oberflaeche.test.ts` (6)

Ziel: `tests/ui/farbschemas.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Auswahl wirkt sofort auf das Dokument, wird gespeichert und nennt das verwendete Schema | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |
| „Farben des aktiven Profils“ ohne Profilfarben: Ersatz mit Erklärung | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |
| eigene Profilfarben: Kontrastfehler verhindern das Speichern, gültige werden lokal gespeichert und verwendet | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |
| ein fehlerhaftes Farbschema eines importierten Profils lässt die Einstellungen nicht abstürzen | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |
| Editor: Vorschau mit Kontrastbasis zeigt die Signalfarben des Kontrastschemas | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |
| Systemeinstellung „mehr Kontrast“: „Automatisch“ verwendet das Kontrastschema und folgt einer Änderung | `tests/ui/farbschemas.test.ts` | bedingtes Warten statt fester Pausen |

### `tests/farbschemas.test.ts` (46)

Ziel: `tests/darstellung/farbschemas.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Katalog › 22 eindeutige Schemata: 2 neutral, 2 Kontrast, Bund, Bevölkerungsschutz, alle 16 Länder | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › neutral-hell: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › neutral-dunkel: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › kontrast-hell: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › kontrast-dunkel: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › bund: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › bevoelkerungsschutz: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-bw: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-by: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-be: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-bb: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-hb: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-hh: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-he: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-mv: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-ni: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-nw: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-rp: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-sl: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-sn: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-st: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-sh: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › de-th: alle Rollen als #RRGGBB, Band (außer Kontrast), Kontraste eingehalten | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › Kontrastschemata: Text und Signalfarben mindestens 7:1, eigene Signalpalette, kein dekoratives Band | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › Signalfarben hängen nur vom Modus ab | `tests/darstellung/farbschemas.test.ts` |  |
| Katalog › Kontrastberechnung nach WCAG | `tests/darstellung/farbschemas.test.ts` |  |
| Auflösen › festes Schema, automatisch und unbekannte Auswahl | `tests/darstellung/farbschemas.test.ts` |  |
| Auflösen › „Automatisch“ folgt der Systemeinstellung „mehr Kontrast“, ein festes Schema bleibt | `tests/darstellung/farbschemas.test.ts` |  |
| Auflösen › Vorrang bei „profil“: lokale Anpassung → Profil → Ersatz mit Hinweis | `tests/darstellung/farbschemas.test.ts` |  |
| Auflösen › ungültige lokale Farben fallen auf das Profil zurück, mit Hinweis | `tests/darstellung/farbschemas.test.ts` |  |
| Auflösen › ein festes Schema bleibt beim Profilwechsel erhalten | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › kein Objekt → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › unbekannte Basis → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › CSS-Text statt Farbe → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › Signalfarbe nicht änderbar → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › unbekannte Angabe → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › zu wenig Kontrast → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › Hintergrund schluckt Signalfarbe → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › zu langer Name → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › Kontrastbasis verlangt 7:1 → abgewiesen | `tests/darstellung/farbschemas.test.ts` |  |
| Prüfung von Profilfarben › gültiges Schema mit eigenen Bandfarben | `tests/darstellung/farbschemas.test.ts` |  |
| Anwenden › setzt Variablen, Attribute und Browserleiste; ein Wechsel hinterlässt keine Werte des vorherigen Schemas | `tests/darstellung/farbschemas.test.ts` |  |
| Anwenden › Startcache: nur gültige Auswahl und geprüfte Profildefinition | `tests/darstellung/farbschemas.test.ts` |  |
| Profilimport › ein gültiges Farbschema wird übernommen | `tests/darstellung/farbschemas.test.ts` |  |
| Profilimport › ein fehlerhaftes Farbschema sperrt das fachliche Profil nicht, sondern ergibt eine Warnung | `tests/darstellung/farbschemas.test.ts` |  |
| Profilimport › Profile ohne Farbschema laden unverändert | `tests/darstellung/farbschemas.test.ts` |  |

### `tests/kern.test.ts` (19)

Ziel: `tests/kern/ausgabe.test.ts`, `tests/kern/beispielmeldungen.test.ts`, `tests/kern/kennsaetze.test.ts`, `tests/kern/migration.test.ts`, `tests/kern/quellen.test.ts`, `tests/kern/validierung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Fiktiver Datensatz Orkantief „Ilka“ › liegt vollständig vor | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_Bund_Koordinierungsstelle_2026-10-14T14-00_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_HE_2026-10-14T10-15_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_NI_2026-10-14T09-45_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_NW_2026-10-14T10-00_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_RP_2026-10-14T09-30_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_ST_2026-10-14T11-00_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Fiktiver Datensatz Orkantief „Ilka“ › LEAD-Meldung_TH_2026-10-14T10-30_FIKTIV_Orkantief-Ilka.json: schemakonform, Quellen stimmig | `tests/kern/beispielmeldungen.test.ts` |  |
| Schemaprüfung › meldet Fehler mit verständlichen Bezeichnungen | `tests/kern/validierung.test.ts` |  |
| Schemaprüfung › bezeichnet Freigabefelder über Platzhalter-Muster | `tests/kern/validierung.test.ts` |  |
| Migration › überführt das Altformat v2 | `tests/kern/migration.test.ts` |  |
| Migration › erkennt fremde Schemata | `tests/kern/migration.test.ts` |  |
| Quellen und Kennsätze › liest Einträge und Verweise | `tests/kern/quellen.test.ts` |  |
| Quellen und Kennsätze › findet fehlende und alte Kategorien | `tests/kern/quellen.test.ts` |  |
| Quellen und Kennsätze › akzeptiert Betreiberquellen (B) und ordnet Kategorien nach der Rangfolge | `tests/kern/quellen.test.ts` |  |
| Quellen und Kennsätze › liest Kennsätze | `tests/kern/kennsaetze.test.ts` |  |
| Quellen und Kennsätze › gibt Ausfüllhinweise ohne Absturz | `tests/kern/kennsaetze.test.ts` |  |
| Ausgabe › bildet Dateinamen nach der Vorlage des Profils | `tests/kern/ausgabe.test.ts` |  |
| Ausgabe › erzeugt eine Management Summary ohne Quellenverweise | `tests/kern/ausgabe.test.ts` |  |

### `tests/korrekturen-2026-10-20.test.ts` (52)

Herkunft: Review 20.10.2026. Ziel: `tests/anbieter/abbruch.test.ts`, `tests/anbieter/openai.test.ts`, `tests/dokumente/pdf.test.ts`, `tests/kern/quellen.test.ts`, `tests/kern/validierung.test.ts`, `tests/lagebild/redaktionscheck.test.ts`, `tests/pipeline/kurzfassung.test.ts`, `tests/pipeline/laufkosten.test.ts`, `tests/profil/manifest.test.ts`, `tests/profil/schemaeignung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| F01: Quellenverweise terminieren für jede Eingabe › liest Einzelverweise und Bereiche in beide Richtungen | `tests/kern/quellen.test.ts` |  |
| F01: Quellenverweise terminieren für jede Eingabe › begrenzt Bereiche vorwärts und rückwärts auf 50 Nummern | `tests/kern/quellen.test.ts` |  |
| F01: Quellenverweise terminieren für jede Eingabe › bleibt bei Nummern ab 2^53 nicht hängen und meldet sie als Verweis | `tests/kern/quellen.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › zusätzliches Feld „constructor“ bei additionalProperties: false | `tests/kern/validierung.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › zusätzliches Feld „toString“ bei additionalProperties: false | `tests/kern/validierung.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › zusätzliches Feld „__proto__“ bei additionalProperties: false | `tests/kern/validierung.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › zusätzliches Feld „hasOwnProperty“ bei additionalProperties: false | `tests/kern/validierung.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › ein fehlendes Pflichtfeld „toString“ wird gemeldet | `tests/kern/validierung.test.ts` |  |
| F04: Schemaprüfung zählt nur eigene JSON-Schlüssel › properties und dependentRequired mit geerbten Namen | `tests/kern/validierung.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › name als Objekt: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › id als Zahl: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › version als Liste: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › leerer Name: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › sop.dateien als Zahl: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › sop.dateien als Text: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › anweisungen als Text: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › meldung.schema als Zahl: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › beispiele mit null: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › migrationen als Text: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › kodierleitfaden als Zahl: abgewiesen mit Befund, ohne Ausnahme | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › null bei optionalen Texten gilt wie eine fehlende Angabe | `tests/profil/manifest.test.ts` |  |
| F05: Profilmanifest mit falschen Datentypen › profil.json als Liste wird abgewiesen | `tests/profil/manifest.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › required als Text: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › properties null: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › unbekannter Typ: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › negative Länge: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › enum als Text: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › items als Zahl: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › leeres anyOf: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › multipleOf 0: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › zyklischer Verweis: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › Zyklus über allOf: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › Zyklus über $ref mit Nachbarschlüssel: lesbarer Fehler statt Ausnahme oder stiller Freigabe | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › zu tiefe Verschachtelung wird gemeldet | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › gültige Schemata mit dependentRequired und booleschen Teilschemata bleiben verwendbar | `tests/profil/schemaeignung.test.ts` |  |
| F06: Eignungsprüfung des Meldungsschemas › die Schemata der mitgelieferten Profile bleiben verwendbar | `tests/profil/schemaeignung.test.ts` |  |
| F07: Redaktionscheck wertet jede Frist eines Sachverhalts aus › findet die zweite, frühere Frist unabhängig von der Reihenfolge | `tests/lagebild/redaktionscheck.test.ts` |  |
| F08: Fingerabdruck der Management Summary › ändert sich mit der Herkunft der Angaben, nicht mit der Freigabe | `tests/pipeline/kurzfassung.test.ts` |  |
| F08: Fingerabdruck der Management Summary › ändert sich mit der Arbeitsanweisung der Kurzfassung | `tests/pipeline/kurzfassung.test.ts` |  |
| F09: Abbruch während der Wartezeit vor einem neuen Versuch › warte endet sofort bei bereits abgebrochenem Signal und räumt den Listener ab | `tests/anbieter/abbruch.test.ts` |  |
| F09: Abbruch während der Wartezeit vor einem neuen Versuch › OpenAI: Abbruch beim Lesen einer Fehlerantwort beendet sofort, ohne weiteren Abruf | `tests/anbieter/abbruch.test.ts` |  |
| F09: Abbruch während der Wartezeit vor einem neuen Versuch › Anthropic: Abbruch beim Lesen einer Fehlerantwort beendet sofort, ohne weiteren Abruf | `tests/anbieter/abbruch.test.ts` |  |
| F10: PDF bei falschem Listentyp › erzeugt das PDF mit sichtbarem Hinweis statt abzubrechen ("defekt") | `tests/dokumente/pdf.test.ts` |  |
| F10: PDF bei falschem Listentyp › erzeugt das PDF mit sichtbarem Hinweis statt abzubrechen ({"a":1}) | `tests/dokumente/pdf.test.ts` |  |
| F10: PDF bei falschem Listentyp › erzeugt das PDF mit sichtbarem Hinweis statt abzubrechen (42) | `tests/dokumente/pdf.test.ts` |  |
| F10: PDF bei falschem Listentyp › null als Sachverhalte bleibt ohne Hinweis | `tests/dokumente/pdf.test.ts` |  |
| F11: Kostenabdeckung eines Laufs › eine Stufe ohne Kostenangabe gilt als nicht erfasst, nicht als kostenlos | `tests/pipeline/laufkosten.test.ts` |  |
| F11: Kostenabdeckung eines Laufs › nur ein fehlender Schlüssel kostet sicher nichts | `tests/pipeline/laufkosten.test.ts` |  |
| F12: OpenAI-Schemakonvertierung macht optionale Felder wirklich nullable › optionales Feld mit enum erlaubt null und weiter die ursprünglichen Werte | `tests/anbieter/openai.test.ts` | feste gültige und ungültige Werte statt Math.random; Pflichtfeld und Zusatzfelder geprüft |
| F12: OpenAI-Schemakonvertierung macht optionale Felder wirklich nullable › optionales Feld mit const erlaubt null und weiter die ursprünglichen Werte | `tests/anbieter/openai.test.ts` | feste gültige und ungültige Werte statt Math.random; Pflichtfeld und Zusatzfelder geprüft |
| F12: OpenAI-Schemakonvertierung macht optionale Felder wirklich nullable › optionales Feld mit $ref erlaubt null und weiter die ursprünglichen Werte | `tests/anbieter/openai.test.ts` | feste gültige und ungültige Werte statt Math.random; Pflichtfeld und Zusatzfelder geprüft |
| F12: OpenAI-Schemakonvertierung macht optionale Felder wirklich nullable › optionales Feld mit anyOf erlaubt null und weiter die ursprünglichen Werte | `tests/anbieter/openai.test.ts` | feste gültige und ungültige Werte statt Math.random; Pflichtfeld und Zusatzfelder geprüft |

### `tests/korrekturen.test.ts` (19)

Herkunft: Review 18.10.2026. Ziel: `tests/anbieter/strom.test.ts`, `tests/kern/ausgabe.test.ts`, `tests/kern/validierung.test.ts`, `tests/kern/zeit.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| F04: Verweise mit Geschwisterbedingungen und boolesche Ziele › $ref plus allOf wie Ajv (1) | `tests/kern/validierung.test.ts` | unabhängiges Soll je Wert ergänzt |
| F04: Verweise mit Geschwisterbedingungen und boolesche Ziele › $ref plus allOf wie Ajv (7) | `tests/kern/validierung.test.ts` | unabhängiges Soll je Wert ergänzt |
| F04: Verweise mit Geschwisterbedingungen und boolesche Ziele › $ref plus allOf wie Ajv (12) | `tests/kern/validierung.test.ts` | unabhängiges Soll je Wert ergänzt |
| F04: Verweise mit Geschwisterbedingungen und boolesche Ziele › $ref plus allOf wie Ajv (5.5) | `tests/kern/validierung.test.ts` | unabhängiges Soll je Wert ergänzt |
| F04: Verweise mit Geschwisterbedingungen und boolesche Ziele › $ref auf false und true | `tests/kern/validierung.test.ts` |  |
| F11: strukturelle Gleichheit › wie Ajv: {"enum":[{"a":1,"b":{"c":[1,2]}}]} / {"b":{"c":[1,2]},"a":1} | `tests/kern/validierung.test.ts` | unabhängiges Soll je Fall ergänzt |
| F11: strukturelle Gleichheit › wie Ajv: {"enum":[{"a":[1,2]}]} / {"a":[2,1]} | `tests/kern/validierung.test.ts` | unabhängiges Soll je Fall ergänzt |
| F11: strukturelle Gleichheit › wie Ajv: {"const":{"x":1,"y":2}} / {"y":2,"x":1} | `tests/kern/validierung.test.ts` | unabhängiges Soll je Fall ergänzt |
| F11: strukturelle Gleichheit › wie Ajv: {"type":"array","uniqueItems":true} / [{"a":1,"b":2},{"b":2,"a":1}] | `tests/kern/validierung.test.ts` | unabhängiges Soll je Fall ergänzt |
| F11: strukturelle Gleichheit › wie Ajv: {"type":"array","uniqueItems":true} / [[1,2],[2,1]] | `tests/kern/validierung.test.ts` | unabhängiges Soll je Fall ergänzt |
| F05: ungültige Fristen › 31.02.2026 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › 29.02.2027 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › 01.13.2026 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › 10.10.2026 25:00 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › 10.10.2026 12:99 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › 00.10.2026 → null | `tests/kern/zeit.test.ts` |  |
| F05: ungültige Fristen › gültige Angaben bleiben | `tests/kern/zeit.test.ts` |  |
| F09: SSE unabhängig von Chunk-Grenzen › an jeder Position geteilt ergibt dasselbe | `tests/anbieter/strom.test.ts` | ausdrückliches Soll statt Ergebnis des Lesers |
| F13: CSV ohne Formelinterpretation › setzt vor Formelzeichen ein Apostroph, Zahlen bleiben | `tests/kern/ausgabe.test.ts` |  |

### `tests/kurzfassung.test.ts` (9)

Ziel: `tests/pipeline/kurzfassung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Management Summary › leitet die Abschnitte aus den Analysefeldern des Profils ab | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › entfernt Quellenverweise und URLs | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › erkennt Änderungen am Inhalt, nicht an der Freigabe | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › baut eine konsolidierte Leitungsfassung mit Beurteilungen und frühester Frist | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › weist Bewertung & Tendenz bei einem Sachverhalt in einer eigenen Zeile aus | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › übernimmt alle Fristen vollständig, früheste zuerst, und kennzeichnet überfällige | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › kennzeichnet Entwürfe im Kopf und verschiebt Kurztitel bei falscher Anzahl nicht | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › gibt der KI eine Herkunftsliste ohne URLs mit und hält die Richtwerte konsistent | `tests/pipeline/kurzfassung.test.ts` |  |
| Management Summary › findet die früheste Frist | `tests/pipeline/kurzfassung.test.ts` |  |

### `tests/lagebild.test.ts` (13)

Ziel: `tests/lagebild/lagebild.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Lagebild: Einlesen › Beispiellage aus dem Profilpaket: sieben Meldungen, schemakonform | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Einlesen › gleiche Inhalte nur einmal, Fehler je Datei, fremdes Schema erkannt | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Einlesen › Schemaabweichung und Entwurf werden je Meldung geführt | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › Stufen und Farben aus dem Schema, Sortierung nach Schwere | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › Kennzahlen | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › Meldestatus nach Kontaktliste, Erinnerung als mailto | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › Redaktionscheck: Zeitfenster, abweichende Bewertungen, Nachlauf, Abschluss | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › Mehrere Meldungen derselben Stelle werden als mögliche Fortschreibung gemeldet | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Auswertung › fehlende Kernaussage bei hoher Beurteilung | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Ausgabe › Rohtabelle generisch aus dem Schema, CSV mit Semikolon und BOM | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Ausgabe › Kopiervorlage: Word-Tabelle, Inhalte maskiert, nur zitierte Quellen | `tests/lagebild/lagebild.test.ts` |  |
| Lagebild: Ausgabe › schlankes Musterprofil ohne Tendenz und Land | `tests/lagebild/lagebild.test.ts` |  |
| Radarwerte als Klartext mit Achsen- und Stufenbezeichnung | `tests/lagebild/lagebild.test.ts` |  |

### `tests/modellwahl.test.ts` (3)

Ziel: `tests/pipeline/einstellungen.test.ts`, `tests/ui/modellwahl.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| mitModellwahl › überschreibt nur gewählte Stufen und lässt die Einstellungen unverändert | `tests/pipeline/einstellungen.test.ts` |  |
| KI-Erfassung › Modell für S1 abweichend wählen, nach S1 Protokoll exportieren, S2-Modell vor dem Start änderbar | `tests/ui/modellwahl.test.ts` | bedingtes Warten; zusätzlich: Schlüssel nicht im Laufprotokoll |
| KI-Erfassung › Aufwand je Stufe und Höchstzahl der Websuchen für einen Lauf wählen | `tests/ui/modellwahl.test.ts` | bedingtes Warten |

### `tests/oberflaeche.test.ts` (6)

Herkunft: Review 20.10.2026. Ziel: `tests/ui/app.test.ts`, `tests/ui/lagebild.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Übergabe aus dem Lagebild (F02) › übernimmt eine Übergabe unter dem eigenen Profil genau einmal, auch im StrictMode | `tests/ui/app.test.ts` | bedingtes Warten statt fester Pausen |
| Übergabe aus dem Lagebild (F02) › trägt Material aus Profil A nicht in Profil B und beim Zurückwechseln nicht erneut ein | `tests/ui/app.test.ts` | bedingtes Warten statt fester Pausen |
| Lagebild: Laden des gespeicherten Stands (F03, F13) › behält Meldungen, die vor Abschluss des Ladens hinzugefügt wurden, und führt sie mit dem Bestand zusammen | `tests/ui/lagebild.test.ts` | bedingtes Warten statt fester Pausen |
| Lagebild: Laden des gespeicherten Stands (F03, F13) › überschreibt bei einem Lesefehler den gespeicherten Stand nicht und bietet erneutes Laden an | `tests/ui/lagebild.test.ts` | bedingtes Warten statt fester Pausen |
| Start bei gestörtem Gerätespeicher (F13) › zeigt die mitgelieferten Profile und einen Hinweis, wenn importierte Profile nicht lesbar sind | `tests/ui/app.test.ts` | bedingtes Warten statt fester Pausen |
| Start bei gestörtem Gerätespeicher (F13) › meldet einen Lesefehler der Einstellungen sichtbar und arbeitet mit den Vorgaben weiter | `tests/ui/app.test.ts` | bedingtes Warten statt fester Pausen |

### `tests/openai.test.ts` (9)

Ziel: `tests/anbieter/openai.test.ts`, `tests/anbieter/preise.test.ts`, `tests/anbieter/verteiler.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| OpenAI: Anfrage › übersetzt System, Nachrichten, PDF, Aufwand, Werkzeuge und Schema | `tests/anbieter/openai.test.ts` |  |
| OpenAI: Anfrage › macht verschachtelte Schemata streng | `tests/anbieter/openai.test.ts` |  |
| OpenAI: Antwort › liest Text, Zitate, Suchen, Nutzung und Kosten aus dem Strom | `tests/anbieter/openai.test.ts` |  |
| OpenAI: Antwort › meldet abgeschnittene Antworten als max_tokens | `tests/anbieter/openai.test.ts` |  |
| OpenAI: Antwort › wiederholt bei 429, bricht bei fehlendem Guthaben und falschem Schlüssel mit deutscher Meldung ab | `tests/anbieter/openai.test.ts` | gefälschte Uhr; Wartezeit geprüft |
| OpenAI: Antwort › stellt die Anfrage nach einem Stromabbruch neu | `tests/anbieter/openai.test.ts` | gefälschte Uhr; Wartezeit geprüft |
| OpenAI: Antwort › erkennt Ablehnungen | `tests/anbieter/openai.test.ts` |  |
| Verteiler › wählt den Anbieter nach dem Modell und verlangt den passenden Schlüssel | `tests/anbieter/verteiler.test.ts` | eigene Testanfrage statt der Anfrage aus den OpenAI-Tests |
| Verteiler › kennt OpenAI-Preise | `tests/anbieter/preise.test.ts` |  |

### `tests/pdf.test.ts` (6)

Ziel: `tests/dokumente/pdf.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| PDF mit Lagenradar › zeichnet das Radar als Grafik neben die Achsenwerte | `tests/dokumente/pdf.test.ts` |  |
| PDF mit Lagenradar › zeichnet offene Achsen ohne Absturz und ohne Werte | `tests/dokumente/pdf.test.ts` |  |
| Freigabe am Ende und gegliederter Bewertungstext › setzt Freigabe & Versand zwischen Quellen und Entstehung, nicht in den Kopf | `tests/dokumente/pdf.test.ts` |  |
| Freigabe am Ende und gegliederter Bewertungstext › gliedert Abschnitte des Bewertungstexts mit Zeilen und Absätzen | `tests/dokumente/pdf.test.ts` |  |
| Gegliederte Analysefelder › setzt Absätze vor Schlüsselsätzen und Zeilen vor Aufzählungen und kurzen Aspektbegriffen | `tests/dokumente/pdf.test.ts` |  |
| Gegliederte Analysefelder › übernimmt die Gliederung in Kopiervorlage und PDF | `tests/dokumente/pdf.test.ts` |  |

### `tests/pipeline.test.ts` (32)

Ziel: `tests/pipeline/eingangsquellen.test.ts`, `tests/pipeline/json.test.ts`, `tests/pipeline/kontext.test.ts`, `tests/pipeline/material.test.ts`, `tests/pipeline/nachbearbeitung.test.ts`, `tests/pipeline/stufen.test.ts`, `tests/pipeline/verdichtung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Kontext aus dem Profil › liest Ereignisarten und ordnet SOPs zu | `tests/pipeline/kontext.test.ts` |  |
| Kontext aus dem Profil › ersetzt alle Platzhalter der Arbeitsanweisung und hängt den Ausgabevertrag an | `tests/pipeline/kontext.test.ts` |  |
| Kontext aus dem Profil › setzt die Fassung des Kodierleitfadens aus dem Profil und gleicht SOP-Kennungen ab | `tests/pipeline/kontext.test.ts` |  |
| Kontext aus dem Profil › löst frühere SOP-IDs gespeicherter Läufe auf | `tests/pipeline/kontext.test.ts` |  |
| Kontext aus dem Profil › Verdichtung: Profilanweisung ohne offene Platzhalter, Ersatzfassung ohne Altregeln | `tests/pipeline/kontext.test.ts` |  |
| Material › liest DOCX-Text und erkennt URLs | `tests/pipeline/material.test.ts` |  |
| Material › legt PDFs als Dokumentblock bei und URLs in den Nutzertext | `tests/pipeline/material.test.ts` |  |
| JSON aus Antworten › trennt Kurzantwort und letzten JSON-Block | `tests/pipeline/json.test.ts` |  |
| Pipeline S1–S3 mit Attrappe › S1 liefert einen bereinigten Vorschlag mit strukturierter Ausgabe | `tests/pipeline/stufen.test.ts` |  |
| Pipeline S1–S3 mit Attrappe › S2 und S3: Entwurf wird nachbearbeitet und ist schemakonform | `tests/pipeline/stufen.test.ts` |  |
| Pipeline S1–S3 mit Attrappe › S3 repariert Schemafehler höchstens zweimal | `tests/pipeline/stufen.test.ts` |  |
| Pipeline S1–S3 mit Attrappe › protokolliert PDFs ohne Base64 und summiert Kosten | `tests/pipeline/stufen.test.ts` |  |
| Verdichtung von Eingangsmeldungen › erkennt Meldungen anderer Stellen als Eingang und die eigene als Vormeldung | `tests/pipeline/material.test.ts` |  |
| Verdichtung von Eingangsmeldungen › verdichtet ohne Websuche, mit t0 aus den Eingängen und verbindlicher Gliederung | `tests/pipeline/verdichtung.test.ts` |  |
| Abgeschnittene Antworten und t0 › vervollständigt eine an der Token-Grenze abgeschnittene Meldung ohne neue Recherche | `tests/pipeline/stufen.test.ts` |  |
| Abgeschnittene Antworten und t0 › übernimmt einen im Auftrag vorgegebenen t0 in S1 | `tests/pipeline/stufen.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › ruft S1 mit hohem Aufwand und 16 000 Ausgabetoken auf | `tests/pipeline/stufen.test.ts` | umbenannt in 0.4.25 (fa19eb8): „ruft S1 mit hohem Aufwand auf (Ausgabegrenze siehe „S1-Ausgabegrenze“, 0.4.25)“ |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › Verdichtung: setzt einen t0 weit nach dem jüngsten Eingang auf den Eingang zurück und sagt es | `tests/pipeline/verdichtung.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › Verdichtung: setzt einen t0 vor dem jüngsten Eingang ebenfalls zurück | `tests/pipeline/verdichtung.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › Verdichtung: lässt einen t0 kurz nach dem jüngsten Eingang stehen | `tests/pipeline/verdichtung.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › Verdichtung: ein im Auftrag vorgegebener t0 geht der Absicherung vor | `tests/pipeline/verdichtung.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › Erfassung ohne Eingänge: t0 aus S1 bleibt unverändert | `tests/pipeline/stufen.test.ts` | umbenannt in 0.4.28 (4166181): „Erfassung ohne Eingänge: ein t0 aus S1 am heutigen Stichtag vor der aktuellen Zeit bleibt unverändert“ |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › übernimmt eine Prüffrage aus S1 ohne Vorgabe im Auftrag nur als Vorschlag | `tests/pipeline/stufen.test.ts` |  |
| S1-Vorgaben, t0-Absicherung und Prüffrage (0.4.19) › behält die geschärfte Prüffrage, wenn der Auftrag eine nennt | `tests/pipeline/stufen.test.ts` |  |
| Quellenprüfung der Eingangsmeldungen › verlangt je Eingang einen eigenen A-Eintrag und unterscheidet ähnliche Stellen | `tests/pipeline/eingangsquellen.test.ts` |  |
| Quellenprüfung der Eingangsmeldungen › trennt zwei Zeitstände derselben Stelle über die Uhrzeit | `tests/pipeline/eingangsquellen.test.ts` |  |
| Gleichnamige Dateien › erhalten im Material eindeutige Namen, gleiche Inhalte entfallen | `tests/pipeline/material.test.ts` |  |
| Gleichnamige Dateien › behält beim ZIP-Import den Pfad im Archiv | `tests/pipeline/material.test.ts` |  |
| Meldungsidentität (F03) und eigene Stelle (F07) › setzt Land und meldende Stelle eines KI-Entwurfs auf die eigene Stelle und meldet die Korrektur | `tests/pipeline/nachbearbeitung.test.ts` |  |
| Meldungsidentität (F03) und eigene Stelle (F07) › erkennt die eigene Stelle nur exakt oder über hinterlegte Aliasnamen | `tests/pipeline/material.test.ts` |  |
| Rollenwahl bei der Übergabe › setzt die gewählte Rolle verbindlich und begründet unmögliche Rollen | `tests/pipeline/material.test.ts` |  |
| Rollenwahl bei der Übergabe › protokolliert gewählte Rollen im Lauf | `tests/pipeline/material.test.ts` |  |

### `tests/profilansicht.test.ts` (21)

Ziel: `tests/profil/profilansicht.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Anzeigetitel und Versions-Tags › alle 34 Fachzeilen: Kennung und Name ohne Version, Version genau einmal im Tag | `tests/profil/profilansicht.test.ts` |  |
| Anzeigetitel und Versions-Tags › Teil A trägt „gilt immer“, fehlende Version „ohne Version“; der Nachweis bleibt unverändert | `tests/profil/profilansicht.test.ts` |  |
| Anzeigetitel und Versions-Tags › Anzahl und Gruppenhinweis nennen die Inhaltsgerüste | `tests/profil/profilansicht.test.ts` |  |
| Steckbrief und Lesetext › Steckbrief aus dem Kopf, Lesetext ohne Überschrift und YAML | `tests/profil/profilansicht.test.ts` |  |
| Lesedokumente › Beispielprofil: SOP-Übersicht und -Verlauf, Profilverlauf; SOP-Übersicht mit Fassung der Sammelmappe | `tests/profil/profilansicht.test.ts` |  |
| Lesedokumente › Musterprofil: nur vorhandene Dateien; ein Paket ohne Zusatzdokumentation bleibt gültig | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › Beispielprofil: vier Dokumente aus dem Paket, Reihenfolge, Zweck und eigene Fassung aus dem Kopf | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › dokumentFassung liest nur den ersten Absatz nach der Überschrift | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › Musterprofil: Erfassung und Kodierleitfaden ohne Fassung, Verdichtung und Kurzfassung als Standardfassung der App | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › Inhaltsverzeichnis: Überschriften der Ebenen 2 und 3, ohne Codeblöcke; Kodierleitfaden mit D1–D8 | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › Inhaltsverzeichnis entspricht der Reihenfolge der Überschriften im gerenderten Text | `tests/profil/profilansicht.test.ts` |  |
| Arbeitsanweisungen und Kodierleitfaden › Platzhalter mit Bereich und Punkt werden hervorgehoben, aber nicht ersetzt | `tests/profil/profilansicht.test.ts` |  |
| Links › Pfade werden relativ aufgelöst und dürfen das Paket nicht verlassen | `tests/profil/profilansicht.test.ts` |  |
| Links › Ziele: SOP, Lesedokument, nicht im Paket, extern, ungültig | `tests/profil/profilansicht.test.ts` |  |
| Katalogsuche › findet über Kennung, Name, frühere Kennung und frühere ID | `tests/profil/profilansicht.test.ts` |  |
| Markdown-Darstellung › Tabellen als Tabelle, kein rohes HTML, keine Bilder, Links nach Ziel | `tests/profil/profilansicht.test.ts` |  |
| Markdown-Darstellung › alle SOPs und Lesedokumente lassen sich aufbereiten, ohne Pipe-Tabellen zu hinterlassen | `tests/profil/profilansicht.test.ts` |  |
| Einbettung › SOP-README und Verläufe sind eingebettet, Lesefassung und Archiv nicht | `tests/profil/profilansicht.test.ts` |  |
| Alle unter „Profile“ lesbaren Markdown-Texte › lead-beispiel: SOPs, Arbeitsgrundlagen und Dokumentation erscheinen formatiert, ohne Markdown-Reste | `tests/profil/profilansicht.test.ts` |  |
| Alle unter „Profile“ lesbaren Markdown-Texte › muster: SOPs, Arbeitsgrundlagen und Dokumentation erscheinen formatiert, ohne Markdown-Reste | `tests/profil/profilansicht.test.ts` |  |
| Alle unter „Profile“ lesbaren Markdown-Texte › der Renderer ist fest eingebunden und wird nicht nachgeladen | `tests/profil/profilansicht.test.ts` |  |

### `tests/profile.test.ts` (23)

Ziel: `tests/profil/profile.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Beispielprofil LEAD › lädt ohne Fehler und ohne Warnungen | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › lädt Teil A, 17 SOPs und 17 Bausteine aus je einer Datei in Katalogreihenfolge | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › gliedert jede SOP und jeden Baustein nach demselben Schema | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › führt Bausteine aus Teil C ohne eigene Ereignisart | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › Lesefassung und README passen zu den Einzeldateien | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › SOP-Dateien enthalten keine nummerierten Quellenverweise (dem Quellenverzeichnis der Meldung vorbehalten, A.10.1) | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › meldet Text vor dem ersten Anker und doppelte SOP-Kennungen | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › kennt die Quellenkategorien A/B/W/M/P in dieser Rangfolge | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › jede Ereignisart des Schemas hat eine SOP | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › ersetzt alle Platzhalter der Arbeitsanweisung | `tests/profil/profile.test.ts` |  |
| Beispielprofil LEAD › eine leere Meldung ist als Entwurf schemakonform | `tests/profil/profile.test.ts` |  |
| Musterprofil › lädt mit eigenem Schema ohne Länderliste | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › leere Schritte verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › fehlende Rolle verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › falsch typisierte Rolle verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Radar ohne max verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Felder kein Objekt verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › ungültiger Ausdruck in der Gliederung verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Gliederung mit falschem kurzlabel verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Quellenkategorie mit mehreren Buchstaben verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Rangfolge mit unbekannter Kategorie verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Rangfolge ohne alle Kategorien verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |
| Strukturprüfung der Darstellungsdatei › Rangfolge mit doppelter Kategorie verhindert die Aktivierung mit verständlichem Fehler | `tests/profil/profile.test.ts` |  |

### `tests/redaktionscheck-oberflaeche.test.ts` (6)

Herkunft: Redaktionscheck-Review 20.10.2026. Ziel: `tests/ui/redaktionscheck.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| RC02: eine Frist wird nach Ablauf ohne Dateiänderung neu eingestuft | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |
| RC02: ein Stichtag hält die Einstufung fest und wird gespeichert | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |
| RV01: Uhrzeit der Ausgabe macht aus „Tag der Ausgabe“ eine eindeutige Einstufung und wird gespeichert | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |
| RV04, RV06: Übersicht nach Einstufung, Abdeckung und Sprungmarken mit Trefferzahl | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |
| RV05: vom Befund zur Meldung in der Liste, ohne die Meldungsmaske zu berühren | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |
| RV07: Redaktionsbericht und präzise Exportbeschriftungen | `tests/ui/redaktionscheck.test.ts` | bedingtes Warten statt fester Pausen |

### `tests/redaktionscheck.test.ts` (38)

Herkunft: Redaktionscheck-Review 20.10.2026. Ziel: `tests/lagebild/redaktionscheck.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| RC03: Uhrzeiten in Fristen › „21.10.2026 08:00“ ergibt 08:00 | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › „21.10.2026, 08:00“ ergibt 08:00 | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › „21.10.2026 um 08:00 Uhr“ ergibt 08:00 | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › „21.10.2026 um 8 Uhr“ ergibt 08:00 | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › „21.10.2026 8.00 Uhr“ ergibt 08:00 | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › reine Datumsangabe gilt bis Tagesende und ist als solche gekennzeichnet | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › eine nicht zuzuordnende Zeitangabe wird nicht geraten, sondern gemeldet | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › ungültige Uhrzeiten bleiben ungültig | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › ein Folgedatum oder ein Betrag wird nicht als Uhrzeit gelesen | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC03: Uhrzeiten in Fristen › „24 Uhr“ ist das Tagesende | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC08: Zeitzone des Profils statt Gerätezeit › dieselbe Berliner Frist ergibt auf Geräten in verschiedenen Zonen denselben Zeitpunkt | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC08: Zeitzone des Profils statt Gerätezeit › Tagesüberlauf am Monatsende auch an einem Umstellungssonntag | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC08: Zeitzone des Profils statt Gerätezeit › Sommerzeitwechsel: doppelte Stunde nimmt die frühere, ausgefallene wird vorgeschoben | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › eine Frist wird mit fortschreitendem Prüfzeitpunkt als abgelaufen eingestuft | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › Frist 12:00 vor Ausgabe 15:00 am selben Tag ist zeitkritisch | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › Frist zeitgleich mit der Ausgabe wird als zeitgleich und prüfbedürftig gemeldet | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › ohne Uhrzeit der Ausgabe gibt eine Frist am Ausgabetag keine grüne Entwarnung | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › Frist ohne Uhrzeit am Ausgabetag bleibt zu klären | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › späte Frist: eng formulierte Entwarnung | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › eine nicht lesbare Ausgabe ergibt keine stille Entwarnung | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC02, RV01: Prüfzeitpunkt und nächste Ausgabe mit Uhrzeit › der Prüfstand nennt Zeitpunkte und Zeitzone | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › leerer Abschluss ist kein Abschluss und verdeckt weder Kern- noch Nachlaufhinweis | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › „Abschluss im Lagebild: nein“ gilt nicht als Abschluss | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › „Abschluss im Lagebild: offen“ gilt nicht als Abschluss | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › „Abschluss im Lagebild: nicht abgeschlossen“ gilt nicht als Abschluss | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › „Abschluss im Lagebild: kein Abschluss, Lage dauert an“ gilt nicht als Abschluss | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › ein inhaltlicher Abschluss bleibt Abschluss | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC04: leere oder offene Kennsätze › leere Neubewertung wird erkannt | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC05: nicht prüfbare Quellenverweise › [Q1] mit unlesbarem Quellenverzeichnis erscheint als nicht prüfbar | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC05: nicht prüfbare Quellenverweise › ohne Verweise bleibt das unlesbare Verzeichnis ein nachrangiger Hinweis | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC06: unterschiedliche und gegenläufige Tendenzen › Stabilisierung und Verschärfung: unterschiedlich, nicht gegenläufig | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC06: unterschiedliche und gegenläufige Tendenzen › Entspannung und Verschärfung: gegenläufig und gezählt | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC07: eine Schwellenregel für Kennzahlen und Redaktionscheck › ohne beurteilung_hoch prüft der Check dieselben Stufen wie die Kennzahlen und sagt das | `tests/lagebild/redaktionscheck.test.ts` |  |
| RC07: eine Schwellenregel für Kennzahlen und Redaktionscheck › das Beispielprofil behält seine ausdrücklichen Stufen | `tests/lagebild/redaktionscheck.test.ts` |  |
| RV04, RV06: Zählung und Abdeckung › jede gezählte Zahl ergibt sich aus der Befundliste | `tests/lagebild/redaktionscheck.test.ts` |  |
| RV04, RV06: Zählung und Abdeckung › nicht konfigurierte Regeln und fremde Schemata werden ausgewiesen | `tests/lagebild/redaktionscheck.test.ts` |  |
| RV03, RV07: Textbaustein und Redaktionsbericht › der Baustein nennt Sachverhalt und Stand je Aussage | `tests/lagebild/redaktionscheck.test.ts` |  |
| RV03, RV07: Textbaustein und Redaktionsbericht › der Bericht enthält Prüfstand, Profil, Meldungen mit Kennung und alle Befunde | `tests/lagebild/redaktionscheck.test.ts` |  |

### `tests/sop-integration.test.ts` (41)

Ziel: `tests/profil/sop-integration.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| SOP-Integration laut SOP-Übersicht › die Übersicht nennt 17 Dach-SOPs und 17 Bausteine | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B01 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B02 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B03 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B04 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B05 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B06 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B07 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B08 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B09 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B10 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B11 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B12 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B13 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B14 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B15 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B16 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › B17 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C01 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C02 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C03 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C04 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C05 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C06 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C07 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C08 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C09 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C10 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C11 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C12 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C13 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C14 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C15 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C16 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › C17 ist geladen, im S1-Schema und -Katalog und geht an S2 | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › gliedert die Auswahl in Dach-SOPs und vier Leseblöcke; Teil A ist gemeinsam | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › Ereigniswechsel ergänzt Dach-SOPs und lässt Bausteine stehen | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › frühere Kennungen bleiben auflösbar (N02 → C11, N13 → C17, 08 → B08) | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › leere Menge beigefügter SOPs lässt nichts durch (SOP-CODE-01) | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › Nachweis = beigefügte SOPs, unabhängig vom Antwortformat; Abweichungen als Hinweis (SOP-CODE-02) | `tests/profil/sop-integration.test.ts` |  |
| SOP-Integration laut SOP-Übersicht › Lagebild-Tabelle und CSV führen die SOP-Angabe der Entstehung | `tests/profil/sop-integration.test.ts` |  |

### `tests/standardwerte-testreihe.test.ts` (13)

Herkunft: Testreihe 20.10.2026 (0.4.21). Ziel: `tests/kern/kennsaetze.test.ts`, `tests/pipeline/nachbearbeitung.test.ts`, `tests/pipeline/schaetzung.test.ts`, `tests/pipeline/stufen.test.ts`, `tests/pipeline/vorgaben.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Vorgaben nach der Testreihe › Erfassung mit Opus in App und Beispielprofil, S1 bleibt Haiku mit hohem Aufwand | `tests/pipeline/vorgaben.test.ts` |  |
| Lagenradar an der vorgesehenen Stelle › verschiebt ein eine Ebene zu hoch abgelegtes Radar und meldet es | `tests/pipeline/nachbearbeitung.test.ts` |  |
| Lagenradar an der vorgesehenen Stelle › überschreibt keinen vorhandenen Radarwert und lässt Nicht-Objekte stehen | `tests/pipeline/nachbearbeitung.test.ts` |  |
| Lagenradar an der vorgesehenen Stelle › die Nachbearbeitung macht den Entwurf ohne Reparaturaufruf schemakonform | `tests/pipeline/nachbearbeitung.test.ts` |  |
| Gescheiterter Abruf der Auftrags-URL › ordnet Abruffehler den Auftrags-URLs zu (Schrägstrich, Anker, je URL einmal) | `tests/pipeline/stufen.test.ts` |  |
| Gescheiterter Abruf der Auftrags-URL › warnt im Ergebnis, wenn die Seite aus dem Auftrag nicht abrufbar war | `tests/pipeline/stufen.test.ts` |  |
| Gescheiterter Abruf der Auftrags-URL › warnt nicht bei Abruffehlern anderer Seiten | `tests/pipeline/stufen.test.ts` |  |
| Kennsätze im Fließtext › erkennt Kennsätze mitten in einer Zeile | `tests/kern/kennsaetze.test.ts` |  |
| Kennsätze im Fließtext › meldet sie als Ausfüllhinweis | `tests/kern/kennsaetze.test.ts` |  |
| Schätzung von Dauer und Kosten › nutzt Messwerte für gemessene Kombinationen | `tests/pipeline/schaetzung.test.ts` |  |
| Schätzung von Dauer und Kosten › rechnet nicht gemessene Modelle über den Preis hoch, ohne Dauer | `tests/pipeline/schaetzung.test.ts` |  |
| Schätzung von Dauer und Kosten › enthält nur Modelle mit Preisangabe und plausible Spannen | `tests/pipeline/schaetzung.test.ts` | prüft jetzt tatsächlich Ausgabepreis, Art, Aufwand und Spannen |
| Schätzung von Dauer und Kosten › zeigt die Schätzung je Stufe nach Modell und Aufwand an | `tests/pipeline/schaetzung.test.ts` |  |

### `tests/validierung.test.ts` (2)

Ziel: `tests/kern/validierung.test.ts`, `tests/profil/schemaeignung.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| eval-freier Schemaprüfer gegen Ajv › fällt bei allen Varianten dasselbe Urteil | `tests/kern/validierung.test.ts` | benannte Varianten mit unabhängigem Soll; Referenzprüfer mit ownProperties |
| eval-freier Schemaprüfer gegen Ajv › erkennt unbrauchbare Schemata | `tests/profil/schemaeignung.test.ts` |  |

### `tests/vergleich.test.ts` (5)

Ziel: `tests/pipeline/vergleich.test.ts`

| Test | Neue Datei | Änderung |
|---|---|---|
| Vergleich mit Referenzfassung › gleiche Fassung: volle Übereinstimmung je Achse | `tests/pipeline/vergleich.test.ts` |  |
| Vergleich mit Referenzfassung › zählt Abweichungen je Achse, offene Achsen und unterschiedliche Bewertungen | `tests/pipeline/vergleich.test.ts` |  |
| Vergleich mit Referenzfassung › ordnet mehrere Sachverhalte nach Bezeichnung zu, auch in anderer Reihenfolge | `tests/pipeline/vergleich.test.ts` |  |
| Vergleich mit Referenzfassung › bildet bei fremden Einzelsachverhalten kein Paar und zählt leere Bewertungen nicht als Übereinstimmung | `tests/pipeline/vergleich.test.ts` |  |
| Vergleich mit Referenzfassung › übernimmt eine manuelle Zuordnung statt der automatischen | `tests/pipeline/vergleich.test.ts` |  |

## Neue Tests

| Test | Datei |
|---|---|
| SSE: Ende und Zeilenenden › gibt ein Ereignis ohne abschließende Leerzeile nicht aus, bis sie folgt | `tests/anbieter/strom.test.ts` |
| SSE: Ende und Zeilenenden › liest LF, CRLF und CR gleich, auch mit mehrzeiligen Daten und ohne Ereignisnamen | `tests/anbieter/strom.test.ts` |
| UTF-8 über Bytegrenzen › Anthropic: Text bleibt bei jeder Teilung innerhalb eines Zeichens unverändert | `tests/anbieter/strom.test.ts` |
| UTF-8 über Bytegrenzen › OpenAI: Text bleibt bei jeder Teilung innerhalb eines Zeichens unverändert | `tests/anbieter/strom.test.ts` |
| Anthropic: Wiederholungen und Abbruch › wiederholt nach Netzwerkfehlern mit 2 s und 4 s Pause und liefert dann die Antwort | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › gibt nach drei Wiederholungen bei dauerhaftem Netzwerkfehler mit verständlicher Meldung auf | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › wartet bei Überlastung ohne retry-after 4 s, 8 s, 16 s und meldet danach den Status | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › folgt retry-after und begrenzt es auf 60 s | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › wiederholt einen abgelehnten Schlüssel nicht | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › ruft bei bereits abgebrochenem Signal gar nicht erst ab | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › beendet die Wartezeit vor dem nächsten Versuch sofort beim Abbruch | `tests/anbieter/vertrag.test.ts` |
| Anthropic: Wiederholungen und Abbruch › bricht einen laufenden Strom ab, ohne neu anzufragen | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › wiederholt nach Netzwerkfehlern mit 2 s und 4 s Pause und liefert dann die Antwort | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › gibt nach drei Wiederholungen bei dauerhaftem Netzwerkfehler mit verständlicher Meldung auf | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › wartet bei Überlastung ohne retry-after 4 s, 8 s, 16 s und meldet danach den Status | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › folgt retry-after und begrenzt es auf 60 s | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › wiederholt einen abgelehnten Schlüssel nicht | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › ruft bei bereits abgebrochenem Signal gar nicht erst ab | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › beendet die Wartezeit vor dem nächsten Versuch sofort beim Abbruch | `tests/anbieter/vertrag.test.ts` |
| OpenAI: Wiederholungen und Abbruch › bricht einen laufenden Strom ab, ohne neu anzufragen | `tests/anbieter/vertrag.test.ts` |
| OpenAI: fehlendes Guthaben › wiederholt 429 mit insufficient_quota nicht | `tests/anbieter/vertrag.test.ts` |
| Modellbewertung: Schemata › alle Fälle entsprechen fall.schema.json und verweisen nur auf vorhandene, fiktive Dateien | `tests/evaluation/schemata.test.ts` |
| Modellbewertung: Schemata › die Bewertung verlangt alle Kriterien, Noten 1–5 und Begründungen | `tests/evaluation/schemata.test.ts` |
| Modellbewertung: Schemata › vorhandene Ergebnisse entsprechen dem Bewertungsschema | `tests/evaluation/schemata.test.ts` |
| Modellbewertung: Schemata › enthält keine API-Schlüssel | `tests/evaluation/schemata.test.ts` |
| API-Schlüssel je Anbieter › werden je Anbieter getrennt gesetzt, gelesen und gelöscht und nie mit den Einstellungen gespeichert | `tests/pipeline/einstellungen.test.ts` |
| Zwischenstand je Profil › schreibt eine noch ausstehende Änderung beim Profilwechsel unter das bisherige Profil und stellt sie dort wieder her | `tests/ui/app.test.ts` |
| Lagebild: Schreibfehler des Gerätespeichers › zeigt einen vollen Speicher als Fehler, behält den gespeicherten Stand und arbeitet im Fenster weiter | `tests/ui/lagebild.test.ts` |

Dazu kommen die Browsertests unter `tests/browser/` (Playwright, nicht Teil von `npm test`), siehe [TESTS.md](TESTS.md).

## Aufteilung der Pipeline-Quellen (0.6.2, TP-2026-W44-06)

`src/pipeline/stufen.ts` und `src/pipeline/vergleichslauf.ts` wurden ohne Verhaltensänderung auf mehrere Dateien verteilt. Kein Test wurde verschoben, umbenannt oder entfernt; geändert sind nur die Importe in den Testdateien.

| Quelle bis 0.6.1 | Quelle seit 0.6.2 | Inhalt | Tests |
|---|---|---|---|
| `stufen.ts` | `stufen.ts` | Kontext eines Laufs, KI-Aufruf mit Protokolleintrag (`aufrufen`), `s2Grenzen`, `rechercheModus` | über alle Stufentests |
| `stufen.ts` | `s1.ts` | `stufe1`, `s1Strukturfehler`, Bereinigung des Vorschlags (Stichtag, t0), `T0_SPIELRAUM_STUNDEN` | `tests/pipeline/stufen.test.ts`, `verdichtung.test.ts`, `auftragsfelder.test.ts`, `aufwand.test.ts`, `fortschreibung.test.ts` |
| `stufen.ts` | `orientierung.ts` | Orientierungssuche je Sachverhalt, `begrenztParallel`, `orientierungsEintraege` | `tests/pipeline/recherche-pflicht.test.ts`, `stufen.test.ts`, `tests/ui/orientierung.test.ts` |
| `stufen.ts` | `s2s3.ts` | `stufe2und3`, Pflichtsuchen, Abgleich, Nachforderung, `reparaturSystem`, `MAX_REPARATUREN` | `tests/pipeline/stufen.test.ts`, `recherche-pflicht.test.ts`, `reparaturtest.test.ts`, `nachbearbeitung.test.ts` |
| `stufen.ts` | `nachbearbeitung.ts` | `nachbearbeiten`, `radarUmhaengen`, SOP-Nachweis, `kodierleitfadenKennung` | `tests/pipeline/nachbearbeitung.test.ts`, `kontext.test.ts`, `tests/profil/sop-integration.test.ts` |
| `stufen.ts` | `recherchebefunde.ts` | `rechercheBefunde`, `rechercheNachweis`, `primaerquelleBelegt`, `amtlichErreicht`, `absenderBefunde`, `auftragsAbrufFehler` | `tests/pipeline/recherche-pflicht.test.ts`, `fortschreibung.test.ts`, `stufen.test.ts` |
| `vergleichslauf.ts` | `vergleichslauf.ts` | Fall, Pläne, Prüfpunkte, Kennzahlen, `einLauf`, `vergleichsreihe` | `tests/pipeline/vergleichslauf.test.ts`, `vergleichslauf-umfang.test.ts` |
| `vergleichslauf.ts` | `vergleichslauf-export.ts` | `csv`, `uebersichtZeilen`, `zipDateiname`, `reiheZip`, LIESMICH | `tests/pipeline/vergleichslauf.test.ts`, `vergleichslauf-umfang.test.ts`, `reparaturtest.test.ts` |

## Schichten und Forschungszone (0.6.3, TP-2026-W44-23 bis -25)

Quellen wurden ohne Verhaltensänderung verschoben, damit die Verzeichnisse unter `src/` zyklenfrei geschichtet sind. Kein Test wurde entfernt oder umbenannt; verschoben sind fünf Testdateien, sonst sind nur Importe angepasst. Neu ist `tests/kern/schichten.test.ts`.

| Quelle bis 0.6.2 | Quelle seit 0.6.3 | Inhalt | Tests |
|---|---|---|---|
| `pipeline/lauf.ts` (`APP_KENNUNG`), `kern/herausgeber.ts` (`APP_VERSION`) | `kern/version.ts` | Versionsangaben aus `package.json` (TP-23) | `tests/ui/ueber.test.ts` |
| `App.tsx` (`ProfilEintrag`) | `kern/typen.ts` | Profil in der Liste der App (TP-23) | `tests/ui/profile.test.ts` |
| `pipeline/material.ts` (`eingangsInfo`) | `kern/eingang.ts` | Grundform einer Eingangsmeldung (TP-23) | `tests/pipeline/material.test.ts`, `tests/lagebild/lagebild.test.ts` |
| `pipeline/kontext.ts` (`fachSops`, `gemeinsameSops`, `istBaustein`, `istInhaltsgeruest`) | `profil/sop.ts`, in `kontext.ts` weiter exportiert | Einteilung der SOPs (TP-23) | `tests/pipeline/kontext.test.ts`, `tests/profil/profilansicht.test.ts`, `sop-integration.test.ts` |
| `pipeline/kontext.ts` (`VERDICHTUNG_S2`), `pipeline/kurzfassung.ts` (`STANDARD_ANWEISUNG`) | `profil/standardtexte.ts`, weiter exportiert | Standardtexte der App (TP-23) | `tests/profil/profilansicht.test.ts`, `tests/pipeline/kurzfassung.test.ts` |
| `pipeline/lauf.ts` (`laufSpeichern` … `laeufeAlsZip`, `laeufeLaden`, `speicherSchuetzen`) | `speicher/laufSpeicher.ts` | Laufprotokolle im Gerätespeicher (TP-24) | `tests/pipeline/laeufe.test.ts` → `tests/speicher/laeufe.test.ts`, `tests/ui/ki-erfassung-laeufe.test.ts` |
| `pipeline/einstellungen.ts` (`einstellungenLesen`, `einstellungenSchreiben`) | `speicher/einstellungsSpeicher.ts`; Umstellung als `einstellungenMigrieren` in `pipeline/einstellungen.ts` | Einstellungen im Gerätespeicher (TP-24) | `tests/pipeline/einstellungen.test.ts` |
| `pipeline/einstellungen.ts` (`schluesselLesen`, `schluesselSchreiben`, `alleSchluesselLesen`) | `schluessel/ablage.ts` | Schlüsselzugriffe (TP-24) | `tests/pipeline/einstellungen.test.ts`, `tests/schluessel/ablage.test.ts` |
| `ui/Kurzfassung.tsx` (IndexedDB direkt) | `speicher/speicher.ts` (`kurzfassungLesen`, `kurzfassungSchreiben`, `kurzfassungLoeschen`) | gespeicherte Management Summary (TP-24) | `tests/ui/meldung-schritte.test.ts` |
| `profil/laden.ts` (Import aus `darstellung/thema.ts`) | Prüfung als Option `farbschemaFehler` von `ladeProfil`, von `App.tsx` übergeben | Farbschema eines Profils (TP-24) | `tests/darstellung/farbschemas.test.ts` |
| `pipeline/vergleichslauf.ts`, `vergleichslauf-eingebaut.ts`, `vergleichslauf-export.ts`, `vergleichsumfang.ts`, `vergleichsauswertung.ts`, `kurzfassungsreihe.ts`, `reparaturtest.ts`, `plausibilitaet.ts` | `forschung/…` (gleiche Dateinamen), dazu `forschung/evaluationsdaten.ts` | Forschungsreihen, an Beispielprofil und `evaluation/` gebunden (TP-25) | `tests/pipeline/{vergleichslauf,vergleichslauf-umfang,vergleichsauswertung,reparaturtest,plausibilitaet}.test.ts` → `tests/forschung/`; `musterfassung()` und `beschaedigt()` sind seit 0.6.3 asynchron |


## Kopplung der Arbeitsanweisungen an den Code (0.6.4, TP-2026-W44-35)

Neue Datei `tests/profil/anweisungen-kopplung.test.ts`: Was die App auswertet oder selbst erzeugt, steht in den Arbeitsanweisungen des Beispielprofils so, wie die App es verwendet. Sie ergänzt die bestehenden Kopplungen in `tests/profil/fassungen.test.ts` (Gültigkeitsstand) und `tests/profil/sop-redaktion.test.ts` (Kennsatzformat, Kennungen, Quellenkategorien).

| Kopplung | Code | Text |
|---|---|---|
| Richtwerte der Management Summary | `GRENZEN` (`pipeline/kurzfassung.ts`) | `anweisung-kurzfassung.md`, „Aufbau“ und „Sprache und Länge“ |
| Arbeitsmodi | `steuerungsBlock` (`pipeline/kontext.ts`) | `anweisung-erfassung.md`, Tabelle „Arbeitsmodus“ |
| Beispielzeile `Handlungsrelevant bis:` | `fristen` (`pipeline/kurzfassung.ts`) | Teil A, A.4 (Tabelle der Kennsätze) |
| Beispieleinträge des Quellenverzeichnisses | `parseQuellen`, `quellenHinweise` (`kern/quellen.ts`) | `kodierleitfaden.md`, Abschnitt 5 |
| Beispiel `_entstehung` | Schema `$defs.entstehung`, `kodierleitfadenKennung` (`pipeline/nachbearbeitung.ts`) | `anweisung-erfassung.md`, Abschnitt „Ausgabe“ |

## Zustandsschnitt der Oberfläche (0.6.5, TP-2026-W44-17)

Die drei größten Komponenten wurden ohne Verhaltensänderung zerlegt. Kein Test wurde verschoben, umbenannt oder inhaltlich geändert; die Oberflächentests binden weiter `KiErfassung`, `LagebildAnsicht`, `MeldungAnsicht` und `App` ein, die Browsertests laufen über dieselben zugänglichen Namen. Ein Vergleich der berechneten Stile aller Elemente in 132 Zuständen (Bereiche, Schritte, Reiter; 390 und 1280 px; hell, dunkel, mehr Kontrast) vor und nach dem Umbau ergab keine Abweichung.

| Quelle bis 0.6.4 | Quelle seit 0.6.5 | Inhalt | Tests |
|---|---|---|---|
| `ui/KiErfassung.tsx` (22 `useState`) | `ui/kiErfassung/zustand.ts` | Reducer mit Zustands-Union `Ablauf` (Phase mit Lauf und Vorschlag) und Eingaben des Auftrags | `tests/ui/ki-erfassung-felder.test.ts`, `orientierung.test.ts`, `s1-grenze.test.ts`, `modellwahl.test.ts`, `fortschreibung.test.ts`, `ki-erfassung-laeufe.test.ts` |
| `ui/KiErfassung.tsx` | `ui/kiErfassung/Auftragsformular.tsx`, `Laufanzeige.tsx` (eigene Uhr, Stand in `anzeigeStand.ts`), `Bestaetigung.tsx`, `Ergebnis.tsx`, `FruehereLaeufe.tsx`, `LaufModellWahl.tsx`, `recherche.tsx`, `texte.ts`, `rahmen.tsx` | Schritte der KI-Erfassung; `KiErfassung.tsx` steuert nur noch den Ablauf | wie oben, `tests/browser/hauptablauf.spec.ts`, `abbruch.spec.ts` |
| `App.tsx` | `ui/app/useFarbschema.ts`, `useZwischenstand.ts`, `useKiUebergabe.ts` | Farbschema, Zwischenstand je Profil, Übergabe aus dem Lagebild | `tests/ui/app.test.ts`, `farbschemas.test.ts`, `erfassung.test.ts`, `tests/browser/wiederherstellung.spec.ts` |
| Props `profil`, `einstellungen`, `schluessel`, `zuEinstellungen` über App → Meldung/KI-Erfassung | `ui/kiZugang.ts` (`KiZugangContext`); Props der Komponenten gehen vor | Zugang zu den KI-Funktionen | `tests/ui/meldung-schritte.test.ts`, KI-Erfassung wie oben |
| `ui/Lagebild.tsx` | `ui/lagebild/Uebergabe.tsx`, `Redaktionscheck.tsx`, `Kopiervorlage.tsx`, `bausteine.tsx` | Übergabedialog, Redaktionscheck, Kopiervorlage, Marken | `tests/ui/lagebild.test.ts`, `redaktionscheck.test.ts` |
| `HilfeFeld` in `ui/KiErfassung.tsx` | `ui/HilfeFeld.tsx`, genutzt von KI-Erfassung, `GrenzFeld.tsx` und `Feld.tsx` | Feld mit verknüpftem Hilfetext | `tests/ui/ki-erfassung-felder.test.ts`, `recherchetiefe.test.ts`, `erfassung.test.ts` |

## Tests zu den Befunden der Oberfläche (0.6.5, TP-2026-W44-12 bis -22)

| Befund | Test | Datei |
|---|---|---|
| TP-2026-W44-12 | keine Live-Region enthält den Sekundenzähler | `tests/browser/barrierefreiheit.spec.ts` |
| TP-2026-W44-13 | Fokus auf „Gegenstand bestätigen“ nach S1; Übergabedialog mit Fokus und Escape | `tests/browser/hauptablauf.spec.ts` |
| TP-2026-W44-14 | zugängliche Namen je Liste eindeutig | `tests/browser/barrierefreiheit.spec.ts` |
| TP-2026-W44-15 | `aria-invalid` mit verknüpftem Fehlertext; Sprung aus dem Prüfschritt | `tests/ui/erfassung.test.ts` |
| TP-2026-W44-16 | Vorlage `profile/muster/`: `data-rang` an Bewertungsfeld und Sachverhalt | `tests/ui/erfassung.test.ts` |
| TP-2026-W44-19 | Fallback-Tokens gleich Katalog (hell, dunkel), Vite-Plugin, keine Farbtoken in den Stylesheets, jede Variable definiert | `tests/darstellung/fallback.test.ts` (neu); `tests/darstellung/farbschemas.test.ts` unverändert |
| TP-2026-W44-20 | Rückfragen im eigenen Dialog; Bereich und Reiter in der Adresse; ohne Netz kein Start der KI-Erfassung | `tests/browser/hauptablauf.spec.ts`, `einstellungen.spec.ts`, `pwa.spec.ts` |
| TP-2026-W44-22 | axe-core je Bereich (Meldung, KI-Erfassung, Lagebild, Profile, Einstellungen) | `tests/browser/barrierefreiheit.spec.ts`; Projekt `webkit` in `playwright.config.ts` |

TP-2026-W44-17, -18 und -21 haben keinen eigenen Test (nicht automatisierbar laut Befund); sie sind durch die bestehenden Tests und den Stilvergleich abgesichert.

Angepasst ohne Änderung des Solls:

- Stub von `window.confirm` durch `dialogAntwort()` aus `tests/support/dom.ts` ersetzt (TP-2026-W44-20): `tests/ui/testlaeufe.test.ts`, `einstellungen.test.ts`, `ki-erfassung-laeufe.test.ts`; in den Browsertests `hauptablauf.spec.ts` und `testlaeufe.spec.ts` Klick im Dialog statt `page.on("dialog")`.
- `aria-current="page"` statt `"true"` (TP-2026-W44-14): `tests/ui/einstellungen.test.ts`, `tests/browser/einstellungen.spec.ts`.
- Stylesheet nach Bereichen geteilt (TP-2026-W44-19): `tests/darstellung/barrierefreiheit.test.ts` liest `stylesheetText()` statt nur `src/styles.css`.
- Nachgeladene Ansichten (TP-2026-W44-18): `tests/ui/farbschemas.test.ts` wartet auf den Bereich „Darstellung“; `tests/browser/pwa-server.ts` zieht bei einer umbenannten Startdatei die Verweise der nachgeladenen Teile mit.
- Link zur Reparaturseite unter „Über“ (TP-2026-W44-21): `tests/ui/ueber.test.ts` erwartet acht statt sieben Links.

## Management Summary während der Erstellung (0.6.6, Fehlermeldung des Herausgebers vom 27.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Laufzeile mit Uhr, „von voraussichtlich …“ aus den Messwerten, geschriebenen Zeichen und voraussichtlichen Kosten; nach der Antwort die Ist-Kosten | zeigt während der Erstellung Uhr, erwartete Dauer, geschriebene Zeichen und voraussichtliche Kosten | `tests/ui/kurzfassung-lauf.test.ts` (neu) |
| Meldung an die Kopfleiste über den KI-Zugang, null bei Ende, Abbruch und Verlassen des Schritts | meldet den Lauf an die Kopfleiste und am Ende null; meldet nach Abbruch und beim Verlassen des Schritts null | `tests/ui/kurzfassung-lauf.test.ts` (neu) |
| KI-Chip mit Stufe „ms“: Titel im zugänglichen Namen, „Zur Meldung“ | zeigt die laufende Management Summary mit ihrem Titel und führt zur Meldung | `tests/ui/kisymbol.test.ts` |
| Dauer der Management Summary je gemessenem Modell und Aufwand (größter Messwert plus 25 %, gerundet) | Management Summary: Dauer aus den Messwerten der Abnahme vom 25.10.2026 | `tests/pipeline/schaetzung.test.ts` |

Angepasst: `tests/forschung/vergleichslauf-umfang.test.ts` erwartet für Sonnet „mittel“ die Dauer `[0, 10]` statt keiner Dauer.

## Sprungziele (0.6.7, Rückmeldung des Herausgebers vom 29.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Anfang des Ziels unter dem Kopf (Kopfhöhe plus 12 px), nicht über den Seitenanfang hinaus; Überschrift programmatisch fokussierbar | richtet den Anfang des Ziels unter dem Kopf aus …; nicht über den Seitenanfang hinaus | `tests/ui/sprungziele.test.ts` (neu) |
| Leisten scrollen nur bei Bedarf; „wenn verloren“ stiehlt keinen Fokus; Sprung in verborgener Ansicht wird nachgeholt | nurWennNoetig …; „wenn-verloren“ …; in einer verborgenen Ansicht … | `tests/ui/sprungziele.test.ts` (neu) |
| Meldung: „Weiter“ und „Zurück“ springen und fokussieren die Überschrift, in allen Schritten bis zur Management Summary; Schrittleiste behält den Fokus | „Weiter: …“ und „Zurück: …“ …; bis „Weiter: Management Summary“ …; Schrittleiste … | `tests/ui/sprungziele.test.ts` (neu) |
| Listeneintrag hinzufügen fokussiert das erste Feld, Entfernen den vorigen Eintrag | „Ereignis/Sachverhalt hinzufügen“ … | `tests/ui/sprungziele.test.ts` (neu) |
| Einstellungen: aus einem Bereich mit Fokus auf die Überschrift, aus der Leiste ohne Fokuswechsel | aus der Übersicht in einen Bereich …; über die Bereichsleiste … | `tests/ui/sprungziele.test.ts` (neu) |
| Hauptnavigation an den Seitenanfang, KI-Erfassung an die zuletzt gesehene Stelle | Hauptnavigation: Seitenanfang … | `tests/ui/sprungziele.test.ts` (neu), `tests/browser/sprungziele.spec.ts` (neu) |
| Im echten Browser, breit und 390 px: vom Seitenende „Weiter“/„Zurück“, Anfang des Arbeitsbereichs unter dem Kopf | Meldung (breit / 390 px): „Weiter“ und „Zurück“ … | `tests/browser/sprungziele.spec.ts` (neu) |

Angepasst ohne Änderung des Solls: `tests/support/dom.ts` ersetzt in `reactUmgebung()` das in jsdom fehlende `window.scrollTo` und zeichnet die Ziele auf (`scrollAufrufe()`).

## Kurzantwort als Prüfauftrag (0.6.8, Rückmeldung des Herausgebers vom 29.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Erfassung 1.7.0: höchstens vier beschriftete Zeilen „Kernaussage“, „Bitte bestätigen“, „Lücken“, „Nicht übernommen“ in Vorgabe und Beispiel; Beispiel höchstens 120 Wörter; keine Leerzeilen, keine Wiederholung von Angaben der App, keine Kürzel S1, S2, t0 | Kurzantwort als Prüfauftrag (Erfassung 1.7.0 …): höchstens vier beschriftete Zeilen | `tests/profil/sop-redaktion.test.ts` (ersetzt „TP-2026-W44-32: die Kurzantwort der Erfassung besteht aus acht beschrifteten Zeilen“) |
| Neue Form ohne Leerzeilen: nur eine Lücke mit „nicht zugänglich“ ergibt ohne Suche den Widerspruchshinweis | Erfassung 1.7.0: die Kurzantwort als Prüfauftrag ohne Leerzeilen … | `tests/pipeline/recherche-pflicht.test.ts` |
| Gliederung der Kurzantwort: Folgezeilen, Leerangaben älterer Läufe, keine Beschriftung über vier Wörter, Punkte am Semikolon | Kurzantwort gliedern › … | `tests/ui/kurzantwort.test.ts` (neu) |
| Anzeige: Beschreibungsliste, Kernaussage ungeteilt, Punkte als Liste, „Ohne Angabe“, „Dringend prüfen“ hervorgehoben, Fließtext als Absatz | Kurzantwort anzeigen › … | `tests/ui/kurzantwort.test.ts` (neu) |

## Zeitstrahl, Sachverhaltskennung und Bezug (0.6.9, ZS-2026-W44-01 bis -05, Entscheidungen des Herausgebers vom 29. und 30.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Zeilenform `[Zn] Zeitpunkt · Kennung · Typ – Text`, Ersatzzeichen, Gedankenstrich im Text, chronologische Ordnung, ungültige Zeilen am Ende, nächste Nummer, Kalenderprüfung | ZS-2026-W44-01: Zeilenform und Ordnung › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Formale Hinweise mit Code und Stufe, „nach t0“ am Meldetag, Berichtigung mit Bezug, Richtwert aus der Darstellungsdatei | ZS-2026-W44-01: formale Hinweise zum Zeitstrahl › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Kenntniszeit „aufgenommen“: eigener Wert, feste Form, Anzeige; Warnung bei ungültig, nach t0, vor dem Ereignis; Hinweis bei fehlend; „Aufnahmezeit ergänzen“ | ZS-2026-W44-05: Kenntniszeit „aufgenommen“ › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Fehlende, doppelte und eigene Kennungen im Bezug; Vorsatz im Prüfschritt | ZS-2026-W44-02, -03: Hinweise zu Kennung und Bezug › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Verweise im Zeitstrahl zählen als Zitate; Quellen je Sachverhalt mit seinen Zeilen | ZS-2026-W44-01: Verweise des Zeitstrahls im Quellenverzeichnis › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Präfix nach dem Feld „Land“, feste Kennung aus fester Zufallsfolge, keine Doppelung, Muster | ZS-2026-W44-02: Vergabe der Sachverhaltskennung › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Beispieldatensatz: acht eindeutige Kennungen, Bezug der verdichteten Meldung, Zeitstrahl ohne Befund | Beispieldatensatz Orkantief „Ilka“ (Profil 1.33.0) › … | `tests/kern/zeitstrahl.test.ts` (neu) |
| Nachbearbeitung: Platzhalter, erfundene und fremde Kennungen; Bezug nur auf vorliegende Kennungen, auch geerbte; Zeilen eines Eingangs umhängen | ZS-2026-W44-02 / -03 › … | `tests/pipeline/zeitstrahl.test.ts` (neu) |
| Fortschreibung: Zeilen der Vormeldung wortgleich, wiederhergestellt, verändert daneben, umnummeriert erkannt; Bewertungszeilen nur von der App | ZS-2026-W44-01, -04: Zeitstrahl der Fortschreibung › … | `tests/pipeline/zeitstrahl.test.ts` (neu) |
| Kenntniszeit in der Nachbearbeitung: neue Zeilen mit dem Meldezeitpunkt (auch gegen eine Angabe der KI), Zeilen älterer Vormeldungen mit deren Meldezeitpunkt | ZS-2026-W44-05: … | `tests/pipeline/zeitstrahl.test.ts` (neu) |
| Regeln im Steuerungsblock je Arbeitsmodus, Vorgaben aus der jüngsten eigenen Vormeldung, Position am Ende des Blocks | ZS-2026-W44-01 bis -04: Regeln im Steuerungsblock von S2 › … | `tests/pipeline/zeitstrahl.test.ts` (neu) |
| Ganzer Lauf: S2 erhält die Regeln, Ergebnis mit Kennung, Zeilen der Vormeldung, neuer Zeile und Bewertungszeile, schemakonform | ZS-2026-W44-01, -04: ganzer Lauf der Fortschreibung › … | `tests/pipeline/zeitstrahl.test.ts` (neu) |
| Profilprüfung: Präfixe, Typen, Bewertungs- und Berichtigungstyp, Richtwert, Rollen gegen das Schema, Warnung `ZEITSTRAHL_OHNE_KENNUNG`, Vorlage unverändert | Profilformat 1.23: Kennung und Zeitstrahl beim Laden › … | `tests/profil/zeitstrahl-profil.test.ts` (neu) |
| Maske: Kennung beim Anlegen, „Kennung vergeben“, Zeitstrahl unter dem Quellenverzeichnis, „Zeile anfügen“ mit Kenntniszeit, „Chronologisch ordnen“, „Aufnahmezeit ergänzen“, ohne Kennung gesperrt | ZS-2026-W44-02 / -01 › … | `tests/ui/zeitstrahl.test.ts` (neu) |

Angepasst ohne Änderung des Solls: `tests/lagebild/redaktionscheck.test.ts` (der Testfall entfernt den Zeitstrahl der Beispielmeldung, weil er alle Texte selbst setzt), `tests/pipeline/kontext.test.ts` (Fassungen Kodierleitfaden 1.6.0, Verdichtung 2.2).

## Bereiche und Ansprache der Oberfläche (0.6.10, OF-2026-W44-01 bis -04, Entscheidung des Herausgebers vom 30.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Navigation „Erfassung“, „KI-Erfassung“, „Auswertung“, „Profile“, „Einstellungen“; Überschrift und Kennsatz je Bereich | OF-2026-W44-01, -02: Bereiche nach den Arbeitsschritten der LEAD-Systematik › … | `tests/ui/bereiche.test.ts` (neu) |
| Beispielprofil mit Titel „Meldung“ ohne Untertitel; PDF-Metadaten mit Produkttitel; Untertitel eines anderen Profils ergänzt den Kennsatz | OF-2026-W44-03: Produkttitel aus dem Profil, Bereichsnamen aus der App › … | `tests/ui/bereiche.test.ts` (neu) |
| Keine Anrede mit „du“ oder „Sie“ in `src/ui/`, `src/App.tsx` und `public/`, mit Gegenprobe; Arbeitsanweisungen bleiben beim „du“ | OF-2026-W44-04: neutrale Ansprache in der Oberfläche › … | `tests/ui/bereiche.test.ts` (neu) |

Angepasst ohne Änderung des Solls (neue Bereichsnamen und Texte): `tests/ui/app.test.ts`, `tests/ui/eingabehilfen.test.ts`, `tests/ui/sprungziele.test.ts`, `tests/ui/ueber.test.ts` und die Browsertests unter `tests/browser/`.

## Offene Befunde KW 44 (0.6.12, Sammelbefunddatei `ki-lead-befund_offen_2026-W44.json`, Entscheidungen des Herausgebers vom 26. und 30.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Zähler laufender Anfragen über den Verteiler, gleichzeitige Anfragen, Fehler; abgelehnte Anfragen zählen nicht; doppelter Abschluss | KP-2026-W44-01: zentraler Zähler laufender KI-Anfragen › … | `tests/anbieter/laufzaehler.test.ts` (neu) |
| Chip online bei jeder laufenden Anfrage, Name ohne Klickziel, mehrere Anfragen, folgt dem Zähler, kein Knopf | KP-2026-W44-01: KI-Chip aus dem zentralen Zähler, reine Statusanzeige › … | `tests/ui/kisymbol.test.ts` |
| Verbindungstest der API-Schlüssel setzt den Chip auf „KI online“ | KP-2026-W44-01: Verbindungstest der API-Schlüssel … | `tests/browser/kisymbol.spec.ts` |
| Fortschreibung, Doppelvergabe, eigenständige Kennungen, Bezug auf nicht geladene Kennung, Rückfall nach Stelle | ZS-2026-W44-06: Fortschreibung, Doppelvergabe und Bezug über die Sachverhaltskennung › … | `tests/lagebild/redaktionscheck.test.ts` |
| Vorlage mit Rollen und Abschnitten für Zeitstrahl, Kennung und Bezug, README nennt sie | Vorlage – eigene Organisation (KP-2026-W43-60) › ZS-2026-W44-07: … | `tests/profil/vorlage.test.ts` |

Angepasst ohne Änderung des Solls: `tests/ui/kisymbol.test.ts` (Namen ohne „Zur KI-Erfassung“/„Zur Meldung“, kein Klick; Soll geändert nach KP-2026-W44-01), `tests/browser/kisymbol.spec.ts` (Rolle `img` statt `button`), `tests/lagebild/lagebild.test.ts` (mehrere Meldungen derselben Stelle: mit Kennung über die Kennung, ohne Kennung nach Stelle), `tests/profil/sop-redaktion.test.ts` (Begriff „Beurteilung“), `tests/pipeline/kontext.test.ts` (Kodierleitfaden 1.7.0).

## CI-Lieferkette (Nachtrag zu 0.6.12, TP-2026-W44-36, -37, Entscheidung des Herausgebers vom 30.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Drei Workflows mit zwölf Einbindungen von Actions; jede per Commit-SHA mit Versionskommentar | GitHub Actions › TP-2026-W44-36: … | `tests/ci/actions.test.ts` (neu) |
| `npm audit --omit=dev --audit-level=high` nach `npm ci` in `pages.yml` | GitHub Actions › TP-2026-W44-37: … | `tests/ci/actions.test.ts` (neu) |

## Herkunftsrolle im Lagebild (0.6.13, Issue #114, A1, Anforderung aus KRITIS-LEAD, freigegeben vom Herausgeber am 31.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Herkunft je Meldung und Sachverhalt, Standard, Kategorie; Filter mit Kennzahlen; „keine Angabe“; ohne Rolle unverändert (Ilka) | I114-A1: Herkunftsrolle im Kern des Lagebilds › … | `tests/lagebild/herkunft.test.ts` (neu) |
| Spalten „Herkunft“ und „Herkunft: Quellenkategorie“ in Rohtabelle und CSV; Kopiervorlage als HTML und Klartext; ohne Rolle keine Spalte | I114-A1: Herkunft in Rohtabelle, CSV und Kopiervorlage › … | `tests/lagebild/herkunft.test.ts` (neu) |
| Typen der Rollen als Fehler; unbekanntes Feld, unbekannte Kategorie, Angaben ohne Rolle als Warnung | I114-A1: Prüfung der Herkunftsrollen beim Laden › … | `tests/lagebild/herkunft.test.ts` (neu) |
| Vermerk unter der Kopfzeile des Lagebild-PDF | I114-A1: Vermerk zur Herkunft im Lagebild-PDF › … | `tests/lagebild/herkunft.test.ts` (neu) |
| Kennzeichen in Übersicht, Meldungen und Sachverhalten; Filter aus und ein; Dateiliste vollständig; ohne Rolle kein Filter (Ilka) | I114-A1: Herkunft im Lagebild › … | `tests/ui/lagebild.test.ts` |

## Verschachtelte Objekte und Listen (0.6.14, Issue #114, A2, nach der Ladeprobe von KRITIS-LEAD M2, freigegeben vom Herausgeber am 31.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Elementtitel aus `titel_feld`, sonst erster Text bzw. Wert, gekürzt; Name aus `element_label` | I114-A2: Elementtitel und Name › … | `tests/kern/listen.test.ts` (neu) |
| Liste von Objekten als Text je Element, verschachtelt, leere Angaben ausgelassen, Zeitfelder deutsch; einfache Werte mit „; “ | I114-A2: Liste als lesbarer Text › … | `tests/kern/listen.test.ts` (neu) |
| Rohtabelle/CSV und PDF einer Meldung mit Liste von Objekten ohne JSON | I114-A2: Ausgaben einer Meldung mit Liste von Objekten › … | `tests/kern/listen.test.ts` (neu) |
| Listen und verschachtelte Objekte ohne `label` mit Überschrift; Elementtitel; leere Liste | I114-A2: verschachtelte Objekte und Listen in der Erfassungsmaske › … | `tests/ui/feld-verschachtelt.test.ts` (neu) |
| Sachverhaltsliste ohne eigene Gruppe, keine Feldnamen als Überschrift im Beispielprofil | I114-A2: Regression Beispielprofil › … | `tests/ui/feld-verschachtelt.test.ts` (neu) |

## Freigabe und Datensicherheit (0.6.15, TP-2026-W44-42 bis -45, Freigabe des Herausgebers vom 30.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Finale PDF mit Schemabefund trägt den Vermerk auf jeder Seite und in den Schlüsselwörtern; ohne Befund und im Entwurf nicht | TP-2026-W44-42: Vermerk „Schemaprüfung mit Befund“ › … | `tests/dokumente/pdf.test.ts` |
| Hinweis bei „Handlungsrelevant bis“ auf oder vor t0, nicht nach t0, nicht bei „überfällig“, nicht ohne Meldezeitpunkt | TP-2026-W44-43: Frist auf oder vor dem Meldezeitpunkt › … | `tests/kern/kennsaetze.test.ts` |
| Sicherung ohne Schlüssel, Rundreise, abgelehnte Dateien | Sicherung des Gerätestands › TP-2026-W44-44: … | `tests/speicher/sicherung.test.ts` (neu) |
| Löschen beider Datenbanken; Rückfrage abbrechen löscht nichts; Bestätigen löscht und startet neu | Alle Daten dieses Geräts löschen › TP-2026-W44-45: …; Bereich „Daten“ › TP-2026-W44-45: … | `tests/speicher/sicherung.test.ts` (neu) |
| Sichern, Löschen und Einspielen im echten Browser | TP-2026-W44-44/-45: sichern ohne Schlüssel, alles löschen, Sicherung einspielen | `tests/browser/daten.spec.ts` (neu) |
| Ansichtswechsel und wiederholtes Neuladen ohne Absturz, auch in WebKit (Playwright 1.57.0) | Ansichtswechsel und wiederholtes Neuladen erhalten die Navigation | `tests/browser/navigation-neuladen.spec.ts` (neu) |
| Offline-Start auch bei „Vary: Origin“ des Servers | PWA: stimmige Fassung beim Update › findet vorgehaltene Dateien unabhängig von Vary …; Offline-Start: nach dem ersten Besuch läuft die App ohne Netz | `tests/pwa/pwa.test.ts`, `tests/browser/pwa.spec.ts` |

Angepasst ohne Änderung des Solls: `tests/ui/einstellungen.test.ts` und `tests/browser/einstellungen.spec.ts` (acht statt sieben Bereiche).

## Erprobungsansicht (0.6.16, TP-2026-W44-46, -47, Freigabe des Herausgebers vom 31.10.2026)

| Soll | Test | Datei |
|---|---|---|
| Vorgabe der Forschungsfunktionen aus; Fassung 6 erhält beim Umstellen „aus“, eine gespeicherte Wahl bleibt | TP-2026-W44-46: Forschungsfunktionen › … | `tests/pipeline/einstellungen.test.ts` |
| Ohne Forschungsfunktionen sieben Bereiche, kein Verweis auf „Testläufe“, Adresse auf „Testläufe“ zeigt die Übersicht; Einschalten speichert die Wahl | TP-2026-W44-46: Schalter „Forschungsfunktionen anzeigen“ › … | `tests/ui/einstellungen.test.ts` |
| Vergleich mit einer Referenzfassung nur mit Forschungsfunktionen; Laufprotokoll in jedem Fall | TP-2026-W44-46: Vergleich mit einer Referenzfassung nur mit Forschungsfunktionen › … | `tests/ui/erprobungsansicht.test.ts` (neu) |
| Im echten Browser: ohne Forschungsfunktionen kein Bereich „Testläufe“, die Wahl übersteht ein Neuladen | Vorgabe: ohne Forschungsfunktionen kein Bereich „Testläufe“; nach dem Einschalten bleibt er nach dem Neuladen | `tests/browser/einstellungen.spec.ts` |

Angepasst ohne Änderung des Solls: `tests/ui/einstellungen.test.ts`, `tests/ui/testlaeufe.test.ts`, `tests/browser/einstellungen.spec.ts` und `tests/browser/testlaeufe.spec.ts` schalten die Forschungsfunktionen vor den Prüfungen der Testläufe ein. TP-2026-W44-47 berichtigt nur Kommentare in `src/speicher/sicherung.ts` und `src/ui/Daten.tsx` (ohne Test).

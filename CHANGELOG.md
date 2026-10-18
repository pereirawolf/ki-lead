# Änderungsverlauf KI-LEAD

Alle wesentlichen Änderungen an der App stehen hier, die jüngsten zuerst. Die Form folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/): Vor Version 1.0 steht die zweite Stelle (0.x) für einen Meilenstein und kann Änderungen am Verhalten bringen; die dritte Stelle steht für Korrekturen und kleinere Ergänzungen innerhalb eines Meilensteins.

Änderungen an Spezifikation, Profilformat und Profilinhalten haben eigene Verläufe:

- Spezifikation: [docs/SPEZIFIKATION.md](docs/SPEZIFIKATION.md), Abschnitt „Änderungsverlauf“
- Profilformat: [docs/PROFILFORMAT.md](docs/PROFILFORMAT.md), Abschnitt „Änderungsverlauf“
- Profile: `CHANGELOG.md` im jeweiligen Profilordner, z. B. [profile/lead-beispiel/CHANGELOG.md](profile/lead-beispiel/CHANGELOG.md)

**Vorgehen:** Jede Änderung wird im selben Commit im zutreffenden Verlauf eingetragen. Stände, die zwischen zwei Versionen ohne eigene Nummer veröffentlicht wurden, stehen bei der Version, unter der sie liefen, als „Nachtrag“ mit Datum und Commit. Jede Version entspricht einem Commit (letzter Stand der Version); Git-Tags `vX.Y.Z` folgen spätestens mit dem ersten Release:

| Version | Commit |
|---|---|
| 0.1.0 | 6bfa6fe |
| 0.2.0 | 8cb1dce |
| 0.3.0 | 3146797 |
| 0.4.0 | a6ed060 |
| 0.4.1 | 1704922 |
| 0.4.2 | 9f8ae9f |
| 0.4.3 | 9f8dca1 |
| 0.4.4 | 68ff2da |
| 0.4.5 | Commit „Gegliederte Analysefelder in PDF, Kopiervorlage und Lagebild; 0.4.5“ |

## [0.4.5] – 18.10.2026

### Geändert

- PDF, Kopiervorlage (HTML und Klartext) und Sachverhaltstabelle im Lagebild gliedern jetzt auch die Analysefelder (Lage & Ereignis, Risiken & Auswirkungen, Maßnahmen & Handlungsempfehlungen, Abhängigkeiten & Interdependenzen). Schlüsselsätze, die einen neuen Aspekt einleiten („Bestätigt ist …“, „Einordnung „…“:“, „Nicht belegt …“, „Mögliche Entwicklungen …“, „Szenario:“, „Belegte Kopplungen:“, „Möglich, aber nicht belegt …“, „Prüf- und Abstimmungsbedarf:“ …), beginnen mit Leerzeile; Aufzählungen („(1) …“, „Empfehlung 1:“, „Erstens, …“) und kurze Aspektbegriffe mit Doppelpunkt („Strom:“, „Verkehr → Versorgung:“, „Puffer:“) auf neuer Zeile. Die Satzanfänge kommen aus der Darstellungsdatei (neuer Abschnitt `analyse_gliederung`); gespeicherte Meldungen bleiben unverändert. Rückmeldung aus einem echten Lauf.
- Die Gliederung kennt die Option `kurzlabel` (höchstens so viele Wörter vor dem Doppelpunkt). Ordnungszahlen „(1)“ und „1.“ bleiben bei ihrem Aspektbegriff, Uhrzeiten und Daten lösen keinen Umbruch aus.
- Profilimport prüft `bewertung_gliederung` und `analyse_gliederung`: Listen von Texten, gültige reguläre Ausdrücke, `kurzlabel` von 0 bis 8.

## [0.4.4] – 18.10.2026

### Geändert

- PDF: Der Freigabeblock steht nicht mehr im Kopf „Meldung“, sondern als eigener Block „Freigabe & Versand“ am Ende zwischen „Quellen & Referenzen“ und „Entstehung“, als Tabelle mit Zeilen Erfassung, Freigabe, Versand und Spalten Name, Datum, Handzeichen; leere Felder bleiben zum Ausfüllen frei. Gesteuert über die neue Rolle `freigabe` der Darstellungsdatei.
- PDF, Kopiervorlage und Sachverhaltstabelle im Lagebild gliedern den Bewertungstext: Kernaussage, Referenzraum, Beurteilung, Tendenz, Achsenbegründungen und Kennsätze („Neubewertung bei:“, „Handlungsrelevant bis:“ …) beginnen auf eigener Zeile oder mit Leerzeile. Die Satzanfänge kommen aus der Darstellungsdatei (`bewertung_gliederung`); gespeicherte Meldungen bleiben unverändert.
- PDF: Abschnittsüberschriften stehen nicht mehr allein am Seitenende.

## [0.4.3] – 18.10.2026

### Behoben

- PDF-Ausgabe (Meldung und Lagebild): Das Lagenradar erscheint wieder als Grafik, als Vektorzeichnung links neben den Achsenwerten. Offene Achsen sind als hohle Punkte erkennbar, nicht als Stufe 0. Rückmeldung aus einem echten Lauf.

### Geändert

- PDF: Die Überschrift eines Sachverhalts läuft über die ganze Tabellenbreite; die Radarzeile wird nicht über einen Seitenumbruch geteilt.

## [0.4.2] – 18.10.2026

### Neu

- Rollenwahl bei der Übergabe an die KI-Verdichtung: Im Übergabedialog des Lagebilds wählt man je ausgewählter Meldung „Als Eingang behandeln“ (wird verdichtet) oder „Als Vormeldung behandeln“ (wird fortgeschrieben). Vorschlag aus der Erkennung der eigenen Stelle; nicht mögliche Rollen sind gesperrt und begründet (z. B. fremdes Schema nur als Eingang). Die Rolle bleibt beim Ab- und Wiederanwählen erhalten, gilt nur für den Auftrag und ändert die Originalmeldung nicht. Zusammenfassung mit Hinweisen bei mehreren Vormeldungen oder ohne Eingang; bedienbar per Tastatur und Screenreader (Optionsfelder je Meldung mit Gruppenbeschriftung).
- Die gewählte Rolle wird verbindlich in die KI-Erfassung übernommen, dort als „Rolle festgelegt“ bzw. „automatisch erkannt“ angezeigt, bleibt korrigierbar und wird im Laufprotokoll je Material festgehalten (`rolleGewaehlt`).

## [0.4.1] – 18.10.2026

Korrekturen nach einem unabhängigen Code-Review (Befunde F01–F15) und Einführung der Änderungsverläufe.

### Behoben

- Zwischenstand der Meldung: Speicherung je Profil; ausstehende Speicherungen werden vor einem Profilwechsel und beim Verlassen der Seite geschrieben; verspätete Ladevorgänge eines vorher aktiven Profils werden verworfen; Speicherfehler werden angezeigt (F01).
- Fehlerhafte Meldungen bringen die Oberfläche nicht mehr zum Absturz: Prüfung der Wurzel und Rückfrage bei falschen Datentypen vor der Übernahme, sichere Textanzeige, Fehlergrenze mit Sicherung als JSON und Neubeginn (F02).
- KI-Entwürfe tragen Land und meldende Stelle des eigenen Profils; die Korrektur eines fremden Absenders wird als Warnung gemeldet (F03).
- Schemaprüfung: `$ref` mit Geschwisterbedingungen (auch `allOf`), Verweise auf boolesche Schemata, strukturelle Gleichheit für `const`, `enum` und `uniqueItems`; Differenztests gegen Ajv (F04, F11).
- Ungültige Datumsangaben in Kennsätzen (z. B. 31.02., 25:99) ergeben keine Frist mehr (F05).
- Quellenprüfung der Verdichtung: jede Eingangsmeldung braucht einen eigenen Eintrag der Kategorie A; bei mehreren Meldungen derselben Stelle zusätzlich die Uhrzeit; schwache Treffer gelten als „unsicher“ (F06).
- Eigene Stelle nur bei exakter Übereinstimmung oder über Aliasnamen (`eigene_stellen`), nicht mehr über den Namensanfang; die Einordnung als Eingang oder Vormeldung ist in der KI-Erfassung korrigierbar (F07).
- Referenzvergleich: Mindestähnlichkeit auch bei nur einem Sachverhalt je Seite, nur beidseitig vorhandene Werte zählen, fehlende Angaben gesondert (F08).
- SSE-Parser unabhängig davon, wo ein Datenpaket Zeilenenden trennt (F09).
- Profile mit unbrauchbarer Struktur (z. B. ohne Bearbeitungsschritt, ohne Pflichtrollen) lassen sich nicht mehr aktivieren (F10).
- Formular: Wahrheitswerte als Kontrollkästchen bzw. Dreifachauswahl, Auswahllisten behalten den Datentyp der Werte (F12).
- CSV-Export schützt vor Formelinterpretation in Tabellenprogrammen (F13).
- Gleichnamige Dateien aus ZIP-Archiven behalten ihren Pfad; Materialnamen in der KI-Erfassung sind eindeutig (F14).
- Profilimport: gleiche ID und Version mit anderem Inhalt gilt als Versionskonflikt; beim Ersetzen wird der alte Stand im Gerät archiviert; Zwischenstände merken sich die Profilversion (F15).

### Geändert

- Finale JSON- und PDF-Ausgabe verlangen bei Schemaabweichungen dieselbe Bestätigung.
- Grenzen beim Einlesen (Anzahl, Größe je Datei, entpackte Gesamtgröße); PDF-Größe wird vor dem Einlesen geprüft.
- Laufende KI-Anfragen werden beim Profilwechsel abgebrochen.
- Referenzvergleich: Zuordnung der Sachverhalte von Hand änderbar; gespeichert werden Prüfsumme und Inhalt der Referenzfassung, Zuordnung und Verfahrenskennung `ki-lead-vergleich/2`.

### Neu

- Änderungsverläufe für App, Spezifikation, Profilformat und Profile; Git-Tags je Version.

## [0.4.0] – 18.10.2026 (Meilenstein 4)

### Neu

- Verdichtung von Meldungen zur Meldung der nächsten Ebene: Übergabe aus dem Lagebild mit Auswahl, eigene Rolle „Verdichtung“ mit Modell und Aufwand, Arbeitsanweisung aus dem Profil (`anweisungen.verdichtung`).
- Redaktionsvermerke: Die App wertet die Eingangsmeldungen vor S1 und S2 mit dem Redaktionscheck aus und gibt das Ergebnis der KI als Arbeitshilfe mit; nach S3 prüft sie die Quellenangaben der Eingänge.
- Vergleich eines KI-Entwurfs mit einer Referenzfassung (Beurteilung, Tendenz, Ereignisarten, Kennzahlen je Radarachse ohne Gesamtwert), gespeichert im Laufprotokoll, Export als CSV und JSON.
- Zweiter Anbieter OpenAI (Responses API, Websuche, strukturierte Ausgabe, `store: false`), Modelle gpt-6-luna, gpt-6.1-sol, gpt-6-astra; Auswahl des Anbieters nach Modellkennung, Schlüssel je Anbieter.

## [0.3.0] – 18.10.2026 (Meilenstein 3)

### Neu

- Modul „Lagebild“: Meldungen als JSON oder ZIP einlesen, prüfen und gemeinsam auswerten; Übersicht mit Kennzahlen, Meldestatus aus `kontakte.json` mit Erinnerungsmail, Verteilungen; Meldungen, Sachverhalte nach Schwere, Lagenradar je Sachverhalt ohne Mittelwert, Rohtabelle.
- Redaktionscheck nach SOP-LEAD A.3–A.8 (Zeitfenster, abweichende Bewertungen mit Textbaustein, Fortschreibung, Nachlauf, Abschluss, Mehrfachmeldungen, Kernaussage, Quellen, Schema, Status).
- Ausgabe als Kopiervorlage für Word, CSV und PDF; Übergabe an die KI-Erfassung.
- Beispieldatensatz „Ilka“ (FIKTIV) im Beispielprofil, in der App ladbar.

### Nachtrag vom 18.10.2026 (3146797, lief als 0.3.0)

- Lagenradar in Kopiervorlage und PDF mit Achsen- und Stufenbezeichnung je Zeile statt nur „D1: 4“.

## [0.2.0] – 17.10.2026 (Meilenstein 2)

### Neu

- Gestufte KI-Erfassung nach LEAD mit Anthropic: S1 Gegenstand und SOP-Auswahl mit Bestätigung, S2 Recherche und Entwurf mit Websuche und Seitenabruf, S3 Prüfung mit höchstens zwei Reparaturen; Laufprotokoll je Lauf mit Export.
- Einstellungen für Schlüssel, Modelle, Aufwand und Recherchegrenzen; Kostenschätzung nach Listenpreisen.

### Nachträge vom 17. und 18.10.2026 (liefen als 0.2.0)

- 17.10. (9263994): verweigerte Seitenabrufe werden angezeigt; Höchstlänge je abgerufener Seite; Profilvariable `kurzname`.
- 17.10. (8648e9a): Management Summary mit KI; Knopf „Neue KI-Erfassung“.
- 18.10. (c995bdc): Bildschirm bleibt während KI-Anfragen wach; abgerissene Verbindungen werden fortgesetzt oder neu gestellt.
- 18.10. (3633f7a): vorläufige Verdichtung von Eingangsmeldungen, Meldezeitpunkt t0, Websuche abschaltbar.
- 18.10. (b2bdd5d): S2 mit bis zu 128 000 Ausgabetoken und Vervollständigung bei Abschneiden; t0 mit Uhrzeit.
- 18.10. (8cb1dce): Management Summary als eine konsolidierte Leitungsfassung.

## [0.1.0] – 17.10.2026 (Meilenstein 1)

### Neu

- Web-Kern ohne KI: Profilpakete, Meldungsmaske aus Schema und Darstellungsdatei, Schemaprüfung ohne Codeerzeugung, Quellen- und Kennsatzprüfung, Migration, Ausgabe als JSON, PDF und Kurzfassung, Profilverwaltung.
- Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“, Musterprofil, fiktiver Datensatz „Ilka“.

### Nachtrag vom 17.10.2026 (6bfa6fe)

- Autorenname im Kodierleitfaden des Beispielprofils korrigiert.

[0.4.5]: https://github.com/pereirawolf/ki-lead/compare/68ff2da...main
[0.4.4]: https://github.com/pereirawolf/ki-lead/compare/9f8dca1...68ff2da
[0.4.3]: https://github.com/pereirawolf/ki-lead/compare/9f8ae9f...9f8dca1
[0.4.2]: https://github.com/pereirawolf/ki-lead/compare/1704922...9f8ae9f
[0.4.1]: https://github.com/pereirawolf/ki-lead/compare/a6ed060...1704922
[0.4.0]: https://github.com/pereirawolf/ki-lead/compare/3146797...a6ed060
[0.3.0]: https://github.com/pereirawolf/ki-lead/compare/8cb1dce...3146797
[0.2.0]: https://github.com/pereirawolf/ki-lead/compare/6bfa6fe...8cb1dce
[0.1.0]: https://github.com/pereirawolf/ki-lead/tree/6bfa6fe

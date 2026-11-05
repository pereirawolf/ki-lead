# Kennzahlen-Bausteine aus Thessa zum Orkantief „Ilka“ – FIKTIV

Begleitmaterial zur Beispiellage [`../orkantief-ilka/`](../orkantief-ilka/LIESMICH.md). Die Dateien sind **unveränderte Kopien** der fiktiven Kennzahlen-Bausteine des Demonstrators [Thessa](https://github.com/pereirawolf/thessa) (Ordner `szenario/orkantief-ilka`, Commit `a614ed4` vom 04.11.2026; Format `Thessa-Kennzahlen`, Fassung 0.3, Schema `schema/kennzahlen-baustein.schema.json` in Thessa). Alle Stellen, Einsatzmittel und Zahlen sind erfunden.

| Datei | Raum | Datenstand |
|---|---|---|
| `kennzahlen_Ilm-Kreis_2026-10-14T10-00_FIKTIV.json` | Ilm-Kreis | 14.10.2026, 10:00 |
| `kennzahlen_Landkreis-Hildburghausen_2026-10-14T10-00_FIKTIV.json` | Landkreis Hildburghausen | 14.10.2026, 10:00 |
| `kennzahlen_Landkreis-Sonneberg_2026-10-14T10-00_FIKTIV.json` | Landkreis Sonneberg | 14.10.2026, 10:00 |
| `kennzahlen_Landkreis-Sonneberg_2026-10-14T10-30_FIKTIV.json` | Landkreis Sonneberg | 14.10.2026, 10:30 |
| `kennzahlen_Thueringen_2026-10-14T10-30_FIKTIV.json` | Thüringen, Ausschnitt aus fünf Kreisen | 14.10.2026, 10:30 |

Ein Baustein enthält eine Quellenangabe und Kennzahlen im Format von LEAD-Meldung-v2. Dazu kommen die lagerelevanten Einsatzmeldungen mit Kennung, Stichwort und Gemeinde, aber ohne Ortslage und Hinweise und ohne Bezug auf einen LEAD-Sachverhalt (seit Fassung 0.3; die Lagemeldung ordnet sie zu, siehe [AUSTAUSCH.md](../../../../docs/AUSTAUSCH.md), Abschnitt 9), sowie die Herleitung jeder Zahl. Der Ordner steht nicht in `profil.json` unter „beispiele“; „Beispiel laden“ im Lagebild holt die Bausteine deshalb nicht mit, denn das Lagebild liest nur Meldungen.

Verwendung, wie im README von Thessa unter „Übergabe an KI-LEAD“ beschrieben:

1. Profil „LEAD-Beispiel – Land Thüringen (fiktive Inhalte)“ verwenden.
2. „KI-Erfassung“ → „Auftrag und Material“: Gegenstand und Stichtag 14.10.2026 eintragen, einen Kreis-Baustein mit „Dateien hinzufügen“ aufnehmen. Er erscheint seit App 0.6.24 als „Kennzahlen-Baustein“ mit Raum, Datenstand und Zahl der Kennzahlen und Einsatzmeldungen; an die KI geht er ohne Herleitung, nach dem Lauf gleicht die App die Zahlen im Text mit dem Baustein ab.
3. „Besondere Prüffrage (optional)“, Vorschlag: „Kennzahlen aus der Thessa-Datei mit Gegenstand, Einheit, Art und Datenstand unverändert übernehmen und die Datei als Quelle angeben. Kennzahlen verschiedener Einheiten nicht addieren. Einsatzmeldungen dem passenden Sachverhalt zuordnen und ihre Kennung nennen; Einsatzmittel zählen am Standort, Einsätze am Einsatzort.“
4. Für die Verdichtung im „Lagebild“ die Beispiellage laden, „An KI-Verdichtung übergeben“ und den Baustein des Landes ergänzen. Die Zahlen des Ausschnitts nicht als landesweite Zahlen ausgeben.

Die strukturierte Übernahme in `sachverhalte[].kennzahlen` setzt die Unterstützung von LEAD-Meldung-v2 in der App voraus ([docs/LEAD-MELDUNG-V2.md](../../../../docs/LEAD-MELDUNG-V2.md), Abschnitt 13).

Lizenz: CC BY 4.0 (Herausgeber Heiko Pereira Wolf), siehe `LICENSE-CONTENT`.

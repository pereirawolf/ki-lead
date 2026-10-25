# Blindbewertung der Ilka-Entwürfe: Plan vom 25.10.2026

Status: festgelegt vor der ersten Bewertung · Befund LS-2026-W43-18 · Entscheidung des Herausgebers vom 25.10.2026: mindestens zwei unabhängig Bewertende, ein Lauf je Variante

## Fragestellung

Wie viel fachliche Nacharbeit brauchen die Entwürfe der Varianten A–F aus dem Plan [`standardprofile-ilka`](standardprofile-ilka.json) bis zu einem verwendbaren Entwurf? Technische Erfüllung, Achsenabstand, Kosten und Dauer aus dem [Ergebnisbericht](../abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md) beantworten das nicht. Keine neuen KI-Läufe.

## Auswahl

Je Variante ein Entwurf nach fester Regel, nicht nach Inhalt: **der zweite Lauf in zeitlicher Reihenfolge**.

| Variante | Lauf |
|---|---|
| A | 20261024-235739-ifu7 |
| B | 20261025-002256-e85u |
| C | 20261024-233231-qjlg |
| D | 20261024-231723-etee |
| E | 20261024-224751-2hu5 |
| F | 20261024-230206-jlcg |

Die Entwürfe liegen nur in den ZIP-Dateien des Herausgebers und werden nicht eingecheckt.

## Vorbereitung (vor der ersten Bewertung)

1. Je Entwurf eine zufällige Kennung vergeben; die Zuordnung Kennung → Lauf bleibt bis zur Auflösung bei einer Person, die nicht bewertet.
2. Aus Entwurf und Kurzantwort Modell, Anbieter, Aufwand, Kosten, Dauer und Laufkennung entfernen; die Reihenfolge der Vorlage nach Kennung.
3. Den Bewertenden vorlegen: die sechs Eingänge, den Fall [`orkantief-ilka-verdichtung`](../faelle/orkantief-ilka-verdichtung.json) mit Erwartungen, die [Bewertungshilfe](../bewertungshilfen/orkantief-ilka.md) und die Entwürfe. Nicht vorlegen: Ergebnisbericht, Kennzahlen, Redaktionsfassung.

## Bewertung

- **Bewertende:** mindestens zwei, unabhängig voneinander, ohne Abstimmung vor Abschluss aller Bewertungen. Wer den Ergebnisbericht oder die Läufe kennt, bewertet mit `"blind": false` und `"verblindung": "teilweise"`.
- **Je Entwurf und bewertender Person** eine Bewertung nach [`../bewertungsschema.json`](../bewertungsschema.json): alle sechs Kriterien mit Begründung, unbelegte Aussagen, Gesamturteil; dazu `korrekturen` nach Art (Tatsachen, Zahlen, Quellen, Zeit, Referenzraum, Zuschnitt, Radar, Tendenz, Empfehlungen), `bearbeitungsdauer_min` für die tatsächliche Nacharbeit bis zu einem verwendbaren Entwurf und `verbleibende_unsicherheiten`.
- **Abdeckung** je Entwurf nach Abschnitt C der Bewertungshilfe (Prüfliste, nicht im Schema).
- Die Nacharbeit wird tatsächlich ausgeführt und die Zeit gemessen, nicht geschätzt.

## Auswertung

Erst nach Abschluss aller Bewertungen auflösen. Je Variante: Noten je Kriterium und gesamt beider Personen nebeneinander, Korrekturen nach Art, Bearbeitungsdauer. Übereinstimmung der Bewertenden je Kriterium ausweisen (bei sechs Entwürfen nur beschreibend; Krippendorffs Alpha nur mit Zahl der Einheiten). Kein Gesamtwert über Kriterien oder Varianten. Ergebnis als Zusammenfassung unter `../ergebnisse/`, Bewertungen als JSON nach Schema; keine Entwürfe.

## Vorbehalte

Ein Entwurf je Variante zeigt keine Streuung innerhalb der Variante; die Ergebnisse tragen eine Einschätzung des Nacharbeitsbedarfs, keine Rangfolge. Ilka ist aus der Entwicklung bekannt (siehe [Kontrollsatz](2026-10-25-kontrollsatz.md)).

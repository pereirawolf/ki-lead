# Musterfassung Orkantief „Ilka“ (FIKTIV): Herkunft und Abgleich

Fassung 1.0 vom 25.10.2026 · Datei [`../material/ilka-musterfassung.json`](../material/ilka-musterfassung.json) · **Entwurf zur fachlichen Abnahme durch den Herausgeber**

## Zweck

Eine feste, konsolidierte Verdichtung der sechs fiktiven Ländermeldungen zum Orkantief „Ilka“ (LEAD-Meldung-v1, Referenzraum Bund, t0 14.10.2026, 14:00 Uhr). Sie dient

1. als **Ausgangsfall für die Management Summary**: Alle KI-Profile erhalten genau diese Meldung (Fall [`ilka-management-summary`](../faelle/ilka-management-summary.json), Plan [`management-summary-ilka`](../plaene/management-summary-ilka.json)), sodass Unterschiede auf die Kurzfassung zurückgehen und nicht auf die Verdichtung;
2. als **Bewertungsbeispiel** für einen Entwurf, der die [Bewertungshilfe Ilka](orkantief-ilka.md) erfüllt.

Sie ersetzt die Redaktionsfassung im Beispielprofil nicht; diese bleibt der Bezug für Entwürfe im Vergleichslauf der App. Seit App 0.5.12 ist die Musterfassung dort Grundlage der Umfänge „S2 + S3 (aus Musterfassung)“ (ihr Zuschnitt als fester S1-Gegenstand) und „MS (aus Musterfassung)“; im Umfang „S1 (aus Rohdaten)“ wird der S1-Vorschlag mit ihrem Zuschnitt verglichen.

## Herkunft

- **Grundlage:** Lauf 20261024-234833-ikph (Variante A, `claude-opus-5-5` „medium“, App 0.5.8, Profil 1.26.0). Er ist der einzige der 21 Läufe, der zugleich alle sechs Eingänge mit eigenem A-Eintrag führt, die Stromlosen als gekennzeichneten Mindestwert mit begründeter Fortgeltung zusammenführt, Hochrechnung und Anschlusszahlen getrennt hält, bei der Gegenprobe der Zahlen gegen die Eingänge keinen Fehler zeigt, eine Tendenz mit Bezugsraum und Zeitfenster setzt und die Gliederung des Bezugs A (zwei Sachverhalte, Stromausfall als Sachverhalt 2) hat.
- **Gegenprobe:** alle 21 Läufe der Varianten A–G vom 24./25.10.2026 (ZIP-Dateien des Herausgebers, nicht eingecheckt) und die sechs Eingänge. Übernommen wurde aus anderen Läufen nur, was dort zusätzlich belegt ist; die bekannten Fehler der übrigen Läufe (unter anderem 75 statt 79 Leichtverletzte, falsche Länderzuordnung, Hochrechnung in einer ungekennzeichneten Summe, Gestrandete als direkt Betroffene, Länder als eigene Sachverhalte) kommen nicht vor.
- **Konsolidierung:** Claude (Opus 5.5) am 25.10.2026.

## Änderungen gegenüber dem Lauf

| Stelle | Änderung | Grund |
|---|---|---|
| Sachverhalt 1, Lage | Vermerk „Zuschnitt offen“ zu Sachsen-Anhalt ersetzt durch Verweis auf Sachverhalt 2 | Der feste S1-Gegenstand ordnet alle Eingänge beiden Sachverhalten zu; der Reststromausfall gehört zu den Stromausfällen |
| Sachverhalt 2, Ort, Lage, Bewertung | Oberharz am Brocken (ST, rund 300 Anschlüsse) ergänzt; sieben Kreise in sechs Ländern; zusammen rund 19.800 statt 19.500 Anschlüsse; Spitzenwert ST 6.000 ergänzt; D1-Begründung, Tendenzzeile, Referenzraum und abweichende Bewertung entsprechend | Vollständigkeit; gleiche Zahl wie die Redaktionsfassung |
| Sachverhalt 2, Bezeichnung | ohne Zahl der Länder | Die Kernaussage betrifft die Menschen ohne Strom, nicht die Zahl der Länder |
| Sachverhalt 2, D2 | Bandbreite mit Hochrechnung (rund 28.500 bis 30.400, ebenfalls Stufe 4) genannt | Bewertungshilfe A.2: Gesamtangabe nur mit getrennt erkennbarem Anteil |
| Sachverhalt 2, Prüfbedarf (2) | „über bestehende Informationswege (z. B. GMLZ)“ | aus Lauf 20261024-235739-ifu7 |
| Sachverhalt 2, Prüfbedarf (5) | neu: Personenzahlen neben Anschlusszahlen melden | aus der Redaktionsfassung (Empfehlung 5); Anlass in den Eingängen belegt |
| Kopf | meldende Stelle mit „Redaktionskonferenz“; `_entstehung` beschreibt die Konsolidierung; Zugriff der Quellen 14.10.2026 | Kenntnisstand zu t0; Herkunft nachvollziehbar |

## Prüfung

`tests/evaluation/musterfassung.test.ts`: schemakonform, keine Quellenwarnung, alle Pflichtangaben, ohne Befund der Plausibilitätsprüfung, Zuschnitt und t0 wie der feste S1-Gegenstand, alle sechs Eingänge zitiert, D2 = 4 als Mindestwert, und jede mehrstellige Zahl steht wörtlich in den Eingängen oder ist mit Rechenweg hergeleitet (20.700, 17.200, 19.800, 28.500, 30.400, 228, 79, 86 und die Stufengrenze 100.000).

## Vorbehalte

- Die Musterfassung stammt aus einem Anthropic-Lauf und wurde von Claude konsolidiert, also aus derselben Modellfamilie wie Bezug A und die Redaktionsfassung. Sie ist kein unabhängig geprüfter Maßstab.
- Bewertungen und Radarwerte sind vertretbar, nicht einzig richtig; für Zählregeln, offene Achsen und Tendenz gilt die Bewertungshilfe.
- Jede Änderung der Datei ändert die Prüfsumme; der Plan `management-summary-ilka` ist dann fortzuschreiben (neue Planfassung).

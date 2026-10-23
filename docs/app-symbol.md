# App-Symbol

Das Symbol von KI-LEAD zeigt ein Lagenradar mit acht Achsen. Dateien: `public/icons/` (SVG, PNG 48, 180, 192, 512 und maskierbar 512).

## Farben

Aus dem Farbschema „Bevölkerungsschutz · BBK“ der App ([farbschemas.md](farbschemas.md)), an die RAL-Farben des Zivilschutzzeichens angenähert:

| Element | Farbe |
|---|---|
| Hintergrund | Orange `#E75B12` (RAL 2004, angenähert) |
| Gerüst des Lagenradars und Kontur | Weiß `#FFFFFF` |
| Innenfläche | Blau `#1D4F91` (RAL 5015/5002, angenähert) |

Die Farbwahl spielt auf das Zivilschutzzeichen an, bildet es aber nicht nach: Das Zivilschutzzeichen ist ein blaues gleichseitiges Dreieck auf orangefarbenem Grund und als Schutzzeichen nach dem Zusatzprotokoll I zu den Genfer Abkommen (Art. 66) geschützt. Die Innenfläche des Symbols ist deshalb immer ein Achteck aus Radarwerten und nie ein Dreieck. Bei künftigen Änderungen bitte darauf achten.

## Ausprägung: Tief „Bernd“ (Juli 2021)

Die Innenfläche zeigt eine Kodierung der Hochwasserlage nach Tief „Bernd“ aus Sicht des Bundes, Höhepunkt 15. bis 17.07.2021, nach den Stufentexten des Kodierleitfadens im Beispielprofil (Stufen 0–6). Es ist eine nachträgliche, illustrative Kodierung für das Symbol, keine amtliche Bewertung. Grundlage ist der Bericht des Bundes zur Hochwasserkatastrophe (BMI, 2022).

| Achse | Stufe | Begründung |
|---|---|---|
| D1 Räumliche Auswirkung | 4 landesweit | Schadensräume in vier Ländern (Rheinland-Pfalz, Nordrhein-Westfalen, Bayern, Sachsen); „bundesweit“ ist damit nicht vollständig getragen, daher die niedrigere Stufe |
| D2 Personelle Direktbetroffenheit | 4 (10.000–99.999) | belegt rund 65.000 betroffene Personen in Rheinland-Pfalz; Angaben für Nordrhein-Westfalen nur als Haushalte, die nicht in Personen umgerechnet werden (Mindestkodierung) |
| D3 Verantwortungszurechnung | 4 Land | Krisenstäbe der Länder; in Rheinland-Pfalz übernahm die ADD ab 17.07.2021 die Einsatzleitung für den Landkreis Ahrweiler |
| D4 Unterstützungsreichweite | 5 bundesweit | THW mit allen 668 Ortsverbänden, Bundeswehr, Bundespolizei, Kräfte anderer Länder; Hilfsangebote aus dem Ausland über das GMLZ, ein Einsatz ist im Bericht nicht belegt |
| D5 Zeit bis Zielzustand | 5 (1–3 Monate) | Strom im Ahrtal vorläufig Mitte August 2021, Trinkwasser überwiegend bis Herbst 2021 |
| D6 KRITIS-Bezug | 5 multiple Sektoren | Strom, Gas, Wasser, Telekommunikation und Verkehr betroffen |
| D7 Informationslage | 4 stark eingeschränkt | Ausfall von Mobilfunk und Festnetz im Ahrtal in den ersten Tagen |
| D8 Dynamik | 5 sehr hohe Dynamik | Flutwelle innerhalb weniger Stunden, Lage in der Nacht vom 14. auf den 15.07.2021 grundlegend verändert |

Quelle: Bundesministerium des Innern und für Heimat (2022): Bericht zur Hochwasserkatastrophe 2021: Katastrophenhilfe, Wiederaufbau und Evaluierungsprozesse. Online abrufbar unter: https://www.bmi.bund.de/SharedDocs/downloads/DE/veroeffentlichungen/2022/abschlussbericht-hochwasserkatastrophe.pdf [Zugriff: 23.10.2026]

Die Kodierung ist abgeschlossen und festgeschrieben (Stand 23.10.2026). Die daraus gezeichneten Symbole und Startbildschirme liegen als feste Dateien im Repository: `public/icons/` (Web), `ios/App/App/Assets.xcassets/` (iOS) und `android/app/src/main/res/` (Android). Maßgebliche Vorlage ist `public/icons/icon.svg`; werden später weitere Größen oder Formate gebraucht, lassen sie sich daraus ableiten, etwa mit `npx @capacitor/assets generate`. Das frühere Zeichenskript `scripts/app-symbol.py` ist entfallen und im Git-Verlauf abrufbar.

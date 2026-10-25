# Bewertungshilfe Orkantief „Ilka“ (FIKTIV)

Fassung 1.0 vom 25.10.2026 · Befunde LS-2026-W43-14 und -16 · **Entwurf zur fachlichen Abnahme durch den Herausgeber**

Gilt für die Fälle [`orkantief-ilka-verdichtung`](../faelle/orkantief-ilka-verdichtung.json) und [`sop-verdichtung-ilka-vergleich`](../faelle/sop-verdichtung-ilka-vergleich.json) (Referenzraum Bund, t0 14.10.2026, 14:00 Uhr, ohne Websuche). Grundlage sind die sechs fiktiven Ländermeldungen unter `profile/lead-beispiel/beispiele/orkantief-ilka/`, die [Arbeitsanweisung Verdichtung](../../profile/lead-beispiel/anweisung-verdichtung.md) (Regeln 3 und 4) und der [Kodierleitfaden](../../profile/lead-beispiel/kodierleitfaden.md) (Grundregeln 5, 6 und 10, Abschnitt 4).

Die Bewertungshilfe ergänzt die Muss- und Darf-nicht-Punkte der Fälle. Sie legt **keine Sollwerte für das Lagenradar** fest und ersetzt die Redaktionsfassung nicht; diese bleibt als historischer Bezug unverändert. Sie behandelt nach der Entscheidung zu LS-2026-W43-14 zunächst nur Zählregeln, offene Achsen und Tendenz; eine Fassung für alle acht Achsen ist nicht vorgesehen, solange diese nicht abgenommen ist. Die Abschnitte A bis C beziehen sich auf den gesamten Entwurf, nicht auf einzelne Sachverhalte.

## A. Stromlose: Zählregeln

### A.1 Beleglage in den Eingängen

| Land | Meldezeitpunkt | Angabe | Einheit und Art | Wiederversorgung laut Betreiber |
|---|---|---|---|---|
| RP | 14.10., 09:30 | rund 3.500 Einwohnerinnen und Einwohner (Kreisverwaltung); rund 1.800 Anschlüsse | Personen, amtlich gemeldet | 14.10., 22:00 Uhr |
| NI | 14.10., 09:45 (Wert Stand 05:00) | rund 4.600 Haushaltsanschlüsse; hochgerechnet rund 8.700 Personen (Bandbreite 7.800–9.700, Faktor 1,9) | Anschlüsse gezählt; Personen nur hochgerechnet | 15.10., 18:00 Uhr |
| NW | 14.10., 10:00 | Hochsauerlandkreis rund 7.400 Einwohnerinnen und Einwohner; Kreis Olpe rund 2.100 Anschlüsse (zusammen rund 6.900 Anschlüsse) | Personen amtlich (HSK); Olpe nur Anschlüsse | 15.10. abends |
| HE | 14.10., 10:15 | rund 900 Anschlüsse (Landkreis Fulda), keine Personenzahl | nur Anschlüsse | 14.10., 14:00 Uhr (= t0) |
| TH | 14.10., 10:30 | rund 9.800 Einwohnerinnen und Einwohner (Krisenstab); rund 5.300 Anschlüsse | Personen, amtlich gemeldet | 16.10. abends |
| ST | 14.10., 11:00 | rund 300 Anschlüsse, Personen nicht gezählt | nur Anschlüsse | keine Angabe |

Die Räume überschneiden sich nicht. Die Spitzenwerte der Länder (zusammen rund 171.000 Anschlüsse) traten nicht gleichzeitig auf.

### A.2 Zulässige Wege (gleichwertig, Entscheidung zu LS-2026-W43-14)

1. **Zusammenführung als Mindestwert:** mindestens rund 20.700 Personen aus RP, NW (Hochsauerlandkreis) und TH. Tragfähig, wenn der Entwurf die Herkunft nennt, den Wert als Mindestwert kennzeichnet und die Fortgeltung zu t0 begründet (die Betreiberprognosen reichen über t0 hinaus; Arbeitsanweisung, Regel 3). Die Hochrechnung aus NI und die Anschlusszahlen aus HE, dem Kreis Olpe und ST stehen getrennt daneben. Eine Gesamtangabe einschließlich NI ist nur zulässig, wenn gezählter und hochgerechneter Anteil getrennt genannt sind.
2. **Begründete Nichtaggregation:** Teilwerte je Land mit Einheit und Datenstand nebeneinander, mit Grund (etwa unterschiedliche Datenstände zwischen 05:00 und 11:00 Uhr, keine zeitgleiche Personengrundlage zu t0). Der Punkt ist erfüllt, wenn Teilwerte und Grund im Entwurf stehen.

### A.3 Unzureichend

- Hochgerechnete Personen aus NI ohne Kennzeichnung in einer Summe mit gezählten Werten.
- Anschlüsse als Personen gezählt oder ohne offengelegten Faktor umgerechnet.
- Morgenwerte als Ist-Wert zu t0 ohne Begründung der Fortgeltung; ebenso Werte aus HE als fortbestehend, obwohl die Prognose t0 erreicht.
- Spitzenwerte der Länder als gleichzeitiger Bestand addiert.
- Eine Summe, die einen Raum stillschweigend auslässt (etwa weil er in einem anderen Sachverhalt steht), ohne die einbezogenen Räume zu nennen.
- Summe im Text, aber D2 im Widerspruch dazu, oder Nichtaggregation im Text, aber D2 aus einer Summe kodiert.

## B. Offene Achsen und Tendenz

### B.1 Einstufung je Achse

Je Achse und Sachverhalt genau eine Einstufung:

| Einstufung | Merkmale |
|---|---|
| begründet offen | Grund genannt (Grundregel 10) und durch die Beleglage gedeckt: kein Bezugsgegenstand im Referenzraum, kein Beleg oder Bandbreite über eine Stufengrenze ohne bestätigte Mindestzahl (Grundregel 6 und „Prüfreihenfolge je Achse“ in Abschnitt 1) |
| begründet gesetzt | Stufe nach Stufentext durch einen genannten Beleg getragen; Schätzung, Bandbreite oder Mindestwert gekennzeichnet; Fortgeltung zu t0 begründet, wo der Beleg älter ist |
| unzureichend begründet | Grund fehlt oder widerspricht der Beleglage, etwa eine offene Achse trotz tragfähigem Beleg in den Eingängen, eine gesetzte Achse ohne Beleg, eine aus Radarwerten der Länder gemittelte oder übernommene Stufe (Arbeitsanweisung, Regel 2) |

Keine Einstufung gilt als besser als die andere. Ein offener Wert mit tragfähigem Grund ist ebenso korrekt wie ein gesetzter.

### B.2 Beleglage für Achsen, die in der Reihe offen blieben

Hinweise zur Prüfung, keine Sollwerte:

- **D2:** siehe A. Je nach Weg sind ein Mindestwert aus der Zusammenführung, ein Mindestwert aus dem größten einzelnen amtlichen Wert (TH, rund 9.800) oder eine begründet offene Achse vertretbar, wenn Text und Kodierung übereinstimmen. Gestrandete Reisende in HE und die nur über Forstwege erreichbaren Einwohnerinnen und Einwohner in NI sind mittelbar betroffen und zählen nicht.
- **D1:** Wirkungsraum in sechs Ländern; Belege liegen in allen Eingängen vor.
- **D4:** Die Eingänge belegen Unterstützung über Kreis- und Landesgrenzen (unter anderem THW-Kräfte aus Bayern in TH, Bereitschaften aus mehreren Kreisen oder Regierungsbezirken in NI und NW).
- **D5:** Betreiberprognosen der Wiederversorgung liegen für RP, NI, NW, HE und TH vor (A.1).

Eine offene D1, D4 oder D5 ist danach nur mit einem Grund vertretbar, der sich mit dieser Beleglage auseinandersetzt.

### B.3 Tendenz

- **Begründet gesetzt**, wenn Bezugsraum und Zeitfenster genannt sind (Kodierleitfaden, Abschnitt 4) und abweichende Tendenzen der Länder benannt werden. Beleglage: Anschlüsse ohne Strom sanken vom 13.10. abends bis zum 14.10. vormittags von rund 171.000 (Summe nicht gleichzeitiger Spitzen) auf rund 19.800; TH meldet für Sonneberg „Verschärfung“, NI „Stabilisierung“, die übrigen Länder „Entspannung“.
- **Begründet offen**, wenn der Entwurf nachvollziehbar darlegt, dass für den gewählten Gegenstand keine vergleichbare Zeitreihe vorliegt.
- **Unzureichend**, wenn die Tendenz ohne Bezugsraum und Zeitfenster steht, eine Ländertendenz ungenannt geglättet wird oder fehlende neue Erkenntnisse als Stabilisierung gelten.

## C. Abdeckung über alle Sachverhalte (LS-2026-W43-16)

Je Entwurf, unabhängig vom Zuschnitt, je Kernbefund genau ein Ergebnis: **enthalten**, **fehlt** oder **doppelt** (derselbe Befund in mehreren Sachverhalten mit zusätzlicher Zählung). Danach gesondert: **Angaben ohne Grundlage** in den Eingängen.

| Nr. | Kernbefund | Herkunft |
|---|---|---|
| K1 | Alle sechs Eingänge mit eigenem A-Eintrag | Muss-Punkt 1 |
| K2 | Stromlose nach Abschnitt A | Muss-Punkt 2 |
| K3 | Notstrompuffer enden vor der Wiederversorgung (TH: Pflegeheime und Trinkwasser Neuhaus am Rennweg; NI: Trinkwasser mit knappem Spielraum) als zeitkritischer Punkt | Muss-Punkt 3 |
| K4 | Abweichende Bewertungen benannt (Landkreis Sonneberg „kritisch“, Land Thüringen „erheblich“; abweichende Tendenzen nach B.3) | Muss-Punkt 4 |
| K5 | Erreichbarkeit eingeschränkt: Notruf in RP, NW und TH, Teilgebiete in NI nur über BOS-Funk und Notfalltreffpunkte | Eingänge |
| K6 | Personenschäden: ein Todesopfer (NW), sechs Schwer- und 79 Leichtverletzte, Zuordnung zu den Ländern wie in den Eingängen | Eingänge |
| K7 | Länger gesperrte Bahnstrecken (Ruhr-Sieg-Strecke, Strecken in Südthüringen) | Eingänge |
| K8 | Keine eigene Websuche, keine Quellen außerhalb der Eingänge | Darf-nicht-Punkte |

Regeln:

- Ein anderer Zuschnitt als in der Redaktionsfassung ist kein Mangel. Bewertet wird, ob die Kernbefunde im gesamten Entwurf richtig und einmal dargestellt sind.
- Radarwerte verschiedener Sachverhalte werden nicht zu einem gemeinsamen Radar verrechnet.
- Die automatische Zuordnung von `npm run vergleichslauf:auswerten` ist Arbeitshilfe; ihre Liste nicht zugeordneter Sachverhalte zeigt, wo die Prüfung von Hand ansetzen sollte.
- Falsche Zahlen oder Länderzuordnungen (etwa bei K6) werden als Angabe ohne Grundlage geführt, auch wenn sie in sich stimmig gerechnet sind.

## Änderungen

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 25.10.2026 | Erste Fassung (LS-2026-W43-14, -16); Entwurf zur fachlichen Abnahme |

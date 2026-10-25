# Management Summary aus der Musterfassung Ilka nach Plan management-summary-ilka: Ergebnis vom 25.10.2026

Plan: [`../plaene/management-summary-ilka.json`](../plaene/management-summary-ilka.json) · Fall: [`../faelle/ilka-management-summary.json`](../faelle/ilka-management-summary.json) · Eingabe: [`../material/ilka-musterfassung.json`](../material/ilka-musterfassung.json) · Befunde: AV-2026-W43-31, -36, -38

**Ergebnis:** Sonnet „medium“ liefert die inhaltlich vollständigsten Fassungen, erfüllt alle Muss-Punkte in drei von drei Läufen und bleibt die Management Summary der Standard-Profile Anthropic und der beiden Mix-Profile; weil die Eingabe die feste Musterfassung ist, gilt das unabhängig vom Modell in S1 und S2. Opus ist inhaltlich gleichwertig, kostet aber rund das Dreifache. gpt-6.1-sol „medium“ bleibt für OpenAI: unter 180 Wörtern, ohne Faktenfehler. Mistral Medium 3.5 „high“ bleibt mangels besserer Option; zwei von drei Läufen enthalten einen Faktenfehler, Mistral Large 4 „high“ ist nicht besser. Die Modelle von Anthropic überschreiten 180 Wörter in 7 von 9 Läufen; dafür wurde die Arbeitsanweisung geschärft (AV-2026-W43-36). Drei Läufe je Variante, Handprüfung durch Claude.

## Rahmen

- Art: Vergleich der Modelle für die Management Summary; keine inhaltliche Abnahme der Arbeitsanweisung
- Stand: App 0.5.14, Beispielprofil 1.26.0 (Arbeitsanweisung Kurzfassung 2.1.2), Musterfassung `953f7682…` wie im Plan
- Durchführung: durch den Herausgeber in der App unter „Einstellungen → Modelle & Verarbeitung → Vergleichslauf Ilka“, Umfang „MS (aus Musterfassung)“, am 25.10.2026 zwischen 09:35 und 10:13 Uhr (Ortszeit), je drei Läufe. Gestartet mit „Aktuelle Einstellungen“; die Reihendateien nennen keine Variante, Modell und Aufwand entsprechen den Varianten A–F. Variante F (Mistral Large 4) wurde nach der Auswertung von E nachträglich in den Plan aufgenommen (Fassung 2, AV-2026-W43-38). Mistral über den EU-Endpunkt.
- Kosten nach Listenpreisen (`src/anbieter/preise.ts`), ohne Gewähr; zusammen rund 1,0 USD
- Prüfung: automatische Vorprüfung der App (Wortzahl, Kurztitel, Mindestwert, Hochrechnung, Nachbetankung, Marker) und Handprüfung jedes Texts gegen die Muss- und Darf-nicht-Punkte des Falls und gegen die Musterfassung durch Claude (Opus 5.5). Nicht von einer Person gegengelesen.
- Kurzfassungen, Protokolle und ZIP-Dateien: nicht eingecheckt

## Läufe

| Variante | Lauf | Wörter | Ausgabetoken | USD | Dauer |
|---|---|---|---|---|---|
| A Sonnet „medium“ | 20261025-093503-lsn4 | 182 | 798 | 0,047 | 8 s |
| A Sonnet „medium“ | 20261025-093511-m98j | 192 | 908 | 0,039 | 6 s |
| A Sonnet „medium“ | 20261025-093517-4n2m | 181 | 856 | 0,038 | 6 s |
| B Opus „medium“ | 20261025-093604-a7xf | 169 | 3 182 | 0,142 | 26 s |
| B Opus „medium“ | 20261025-093630-rctm | 205 | 2 124 | 0,102 | 18 s |
| B Opus „medium“ | 20261025-093648-upu7 | 193 | 3 478 | 0,129 | 28 s |
| C Haiku „medium“ | 20261025-094032-m02a | 181 | 3 542 | 0,004 | 15 s |
| C Haiku „medium“ | 20261025-094047-88u7 | 128 | 2 530 | 0,003 | 10 s |
| C Haiku „medium“ | 20261025-094057-a4c8 | 225 | 2 354 | 0,003 | 10 s |
| D gpt-6.1-sol „medium“ | 20261025-093736-kbyt | 148 | 1 395 | 0,034 | 26 s |
| D gpt-6.1-sol „medium“ | 20261025-093802-eqd2 | 151 | 734 | 0,008 | 16 s |
| D gpt-6.1-sol „medium“ | 20261025-093818-ohsy | 149 | 756 | 0,009 | 15 s |
| E Mistral Medium 3.5 „high“ | 20261025-093857-tsqd | 107 | 3 087 | 0,043 | 21 s |
| E Mistral Medium 3.5 „high“ | 20261025-093918-hm0h | 145 | 2 097 | 0,034 | 14 s |
| E Mistral Medium 3.5 „high“ | 20261025-093932-mhfq | 128 | 3 783 | 0,048 | 24 s |
| F Mistral Large 4 „high“ | 20261025-100811-cn12 | 129 | 10 832 | 0,064 | 152 s |
| F Mistral Large 4 „high“ | 20261025-101042-psdz | 163 | 8 963 | 0,044 | 141 s |
| F Mistral Large 4 „high“ | 20261025-101303-rfpm | 166 | 6 704 | 0,033 | 92 s |

Alle 18 Läufe: Status fertig, Abschluss ohne Abbruch, Bewertung und Tendenz beider Sachverhalte unverändert, Kurztitel in der Reihenfolge der Meldung. Die Vorprüfung fand außer der Wortzahl keine Auffälligkeit; die Faktenfehler von E und F erkennt sie nicht.

## Handprüfung nach den Punkten des Falls

| Punkt | A Sonnet | B Opus | C Haiku | D sol | E Mistral Medium | F Mistral Large |
|---|---|---|---|---|---|---|
| Kernaussage: Stromausfall und Notstrompuffer vorn | 3/3 | 3/3 | 3/3 | 3/3 | 1/3 | 2/3 |
| Zahl als Mindestwert oder ohne Zahl | 3/3 | 3/3 | 3/3 | 3/3 (ohne Zahl in der Kernaussage) | 3/3 („mindestens 20.700“) | 2/3 |
| Nachbetankung offen, mit Frist | 3/3 | 3/3 | 3/3 | 3/3 offen, Frist im Text 0/3 | 3/3 | 3/3 |
| Prognosen als Prognosen | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 1/3 |
| Keine neuen oder falschen Angaben, Empfehlungen oder Wertungen | 3/3 | 3/3 | 2/3 | 3/3 | 0/3 | 1/3 |
| Höchstens 180 Wörter | 0/3 | 1/3 | 1/3 | 3/3 | 3/3 | 3/3 |

Einzelheiten:

- **A Sonnet:** nennt Sonneberg, Goslar und Schmallenberg mit Fristen, den Abgleich der Lagezentren mit dem THW und die mögliche Mehrfachplanung; überschreitet 180 Wörter um 1 bis 12.
- **B Opus:** inhaltlich wie A; ein Lauf nennt die abweichende Bewertung „kritisch“ des Landkreises als Zitat der Meldung.
- **C Haiku:** ein Lauf nennt in den Maßnahmen nur Sonneberg; ein Lauf verschärft „gebunden oder benötigt“ zu „gebunden“; ein Lauf mit 225 Wörtern.
- **D sol:** knapp und ohne Faktenfehler. Die Frist der Nachbetankung steht in keinem Lauf im Text (die App setzt die früheste Frist darunter). Die abweichenden Bewertungen (Sonneberg „kritisch“, Thüringen „Verschärfung“) übernimmt sol als Zitat der Meldung.
- **E Mistral Medium:** In zwei Läufen endet der Wasserpuffer Goslar/Oberharz angeblich vor der Wiederversorgung; nach der Meldung endet er zwei Stunden nach der Prognose. Zwei Kernaussagen stellen die Bahnsperrungen gleichrangig oder voran. Ein Lauf schreibt „häusliche Beatmung eingeschränkt“, was die Meldung so nicht sagt.
- **F Mistral Large:** Zwei Läufe stellen voraussichtliche Freigaben als Tatsache dar („Sperrungen dauern bis 18.10. an“). Ein Lauf empfiehlt, die Leitung solle die Länder „anweisen“; die Meldung sieht eine Anregung vor. Ein Lauf wiederholt den Oberharz-Fehler, einer lässt „mindestens“ in der Kernaussage weg, einer nennt im Kurztitel „kritische Versorgungslücken“. Laufzeit 92–152 s.

## Folgerungen

- Management Summary der Profile: Anthropic, Mix OpenAI S1 + Anthropic Opus und Mix OpenAI S1 + Anthropic Sonnet mit Sonnet „medium“; OpenAI mit gpt-6.1-sol „medium“; Mistral mit Medium 3.5 „high“ (Faktenprüfung in der Redaktion besonders nötig). Keine Änderung an den Standard-Profilen.
- Länge: Arbeitsanweisung Kurzfassung 2.2.0 nennt 180 Wörter als Obergrenze mit Kürzungsregel (AV-2026-W43-36). Eine Nachreihe mit Sonnet „medium“ prüft die Wirkung.
- Die Mix-Profile werden auswählbar (AV-2026-W43-31).

## Vorbehalte

- Drei Läufe je Variante; ein einziger Fall.
- Die Musterfassung stammt aus derselben Modellfamilie wie A–C.
- Handprüfung durch Claude, nicht von einer Person gegengelesen.

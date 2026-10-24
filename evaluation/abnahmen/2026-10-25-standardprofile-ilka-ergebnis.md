# Vergleichslauf Ilka nach Plan standardprofile-ilka: Ergebnis vom 25.10.2026

Plan: [`../plaene/standardprofile-ilka.json`](../plaene/standardprofile-ilka.json) · Auswertung: `npm run vergleichslauf:auswerten -- <ZIP-Dateien> --bezug A-anthropic-standard` · Befunde: AV-2026-W43-01 bis -03, -05, -06, -09, -10, -12 bis -19

**Ergebnis:** Alle 18 Läufe (sechs Varianten, je drei) sind vollständig, mit derselben App-Version und demselben Profil entstanden und erfüllen die Prüfpunkte T1–T8. Am nächsten am Bezug (Variante A, Standard-Profil Anthropic) liegt Variante B (Sonnet in der Verdichtung). Von OpenAI liegt D (gpt-6-astra „high“) näher als C („medium“), beide lassen aber rund die Hälfte der Achsen offen. Von Mistral liegt E (Medium 3.5) in den meisten Kennzahlen näher als F (Large 4); F ist nur im Radarabstand knapp näher und hat mehr Zahlenfehler. Kosten und Dauer sind berichtet, haben aber nicht entschieden.

## Rahmen

- Art: Vergleich von Konfigurationen der Verdichtung (Befunde AV-2026-W43-04 und -10), keine inhaltliche Abnahme der Methodik
- Stand: App 0.5.8, Beispielprofil 1.26.0 (Profilprüfsumme `725c7d9d…` in allen 18 Läufen)
- Durchführung: durch den Herausgeber in der App unter „Einstellungen → Modelle & Verarbeitung → Vergleichslauf Ilka“, Konfiguration „Plan standardprofile-ilka, Variante …“, Anzahl 3; Läufe am 24.10.2026 zwischen 22:44 und 25.10.2026, 00:36 Uhr (Ortszeit, Reihenfolge E, F, D, C, A, B)
- Fall: `orkantief-ilka-verdichtung` (sechs fiktive Ländermeldungen, t0 14.10.2026 14:00, Websuche aus); S1-Vorschlag unverändert übernommen
- Mistral über den EU-Endpunkt (Vorgabe); die Kosten enthalten den Aufschlag von 10 %
- Kosten nach Listenpreisen (`src/anbieter/preise.ts`), ohne Gewähr
- Auswertung: Kennzahlen mit `npm run vergleichslauf:auswerten` (Vergleichsverfahren `ki-lead-vergleich/2`, Stand main c7ba8f5, App 0.5.9); dazu eine Kontrollrechnung der Zuordnung und eine Handprüfung der Plausibilitätsbefunde und Muss-Punkte durch Claude (Opus 5.5). Nicht von einer Person gegengelesen.
- Laufprotokolle (`ki-lead-lauf/1`), Entwürfe, Reihendateien und ZIP-Dateien: nicht eingecheckt

## Konfigurationen

| Variante | S1 | S2 Verdichtung | Reparatur (nicht benötigt) |
|---|---|---|---|
| A Anthropic-Standard (Bezug) | `claude-haiku-5-5` „high“ | `claude-opus-5-5` „medium“ | `claude-sonnet-5-5` „low“ |
| B Anthropic mit Sonnet | `claude-haiku-5-5` „high“ | `claude-sonnet-5-5` „medium“ | `claude-sonnet-5-5` „low“ |
| C OpenAI-Standard | `gpt-6-luna` „high“ | `gpt-6-astra` „medium“ | `gpt-6.1-sol` „low“ |
| D OpenAI mit astra „hoch“ | `gpt-6-luna` „high“ | `gpt-6-astra` „high“ | `gpt-6.1-sol` „low“ |
| E Mistral-Standard | `mistral-small-2603` „high“ | `mistral-medium-3-5` „high“ | `mistral-small-2603` „low“ |
| F Mistral mit Large 4 | `mistral-small-2603` „high“ | `mistral-large-4` „high“ (Public Preview) | `mistral-small-2603` „low“ |

Bei Mistral sendet die App für „high“ `reasoning_effort: high`; alle zwölf Mistral-Aufrufe nahmen das an.

## Technische Prüfpunkte

| Variante | Läufe | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 |
|---|---|---|---|---|---|---|---|---|---|
| A | ikph, ifu7, 07bh | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| B | n4c8, e85u, kg0c | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| C | m97k, qjlg, 4god | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| D | 0gjp, etee, l69n | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| E | b628, 2hu5, vou1 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| F | 7ngp, jlcg, dh4z | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |

Alle Läufe: Status fertig, schemakonform ohne Reparatur, Stopgrund `end_turn`, jeder Eingang mit eigenem A-Eintrag.

## Kosten und Dauer je Lauf

| Variante | Lauf | S1 Dauer | S1 Ausgabetoken | S1 USD | S2 Dauer | S2 Ausgabetoken | S2 USD | Gesamt USD | Gesamt Dauer |
|---|---|---|---|---|---|---|---|---|---|
| A | 20261024-234833-ikph | 106 s | 25 054 | 0,024 | 440 s | 54 484 | 1,881 | 1,90 | 546 s |
| A | 20261024-235739-ifu7 | 113 s | 26 832 | 0,025 | 408 s | 50 060 | 1,735 | 1,76 | 521 s |
| A | 20261025-000620-07bh | 132 s | 31 261 | 0,027 | 405 s | 50 426 | 1,800 | 1,83 | 537 s |
| B | 20261025-001616-n4c8 | 19 s | 3 015 | 0,013 | 381 s | 61 598 | 0,964 | 0,98 | 400 s |
| B | 20261025-002256-e85u | 100 s | 24 109 | 0,023 | 287 s | 45 361 | 0,820 | 0,84 | 387 s |
| B | 20261025-002923-kg0c | 94 s | 22 678 | 0,022 | 319 s | 49 600 | 0,892 | 0,91 | 413 s |
| C | 20261024-232917-m97k | 69 s | 6 856 | 0,006 | 125 s | 6 830 | 1,242 | 1,25 | 194 s |
| C | 20261024-233231-qjlg | 65 s | 6 082 | 0,005 | 102 s | 7 118 | 1,217 | 1,22 | 167 s |
| C | 20261024-233518-4god | 52 s | 5 036 | 0,005 | 90 s | 6 495 | 1,225 | 1,23 | 142 s |
| D | 20261024-231048-0gjp | 65 s | 6 757 | 0,008 | 329 s | 15 867 | 1,654 | 1,66 | 395 s |
| D | 20261024-231723-etee | 42 s | 4 659 | 0,005 | 267 s | 13 574 | 1,519 | 1,52 | 309 s |
| D | 20261024-232232-l69n | 58 s | 6 386 | 0,005 | 309 s | 15 720 | 1,686 | 1,69 | 367 s |
| E | 20261024-224439-b628 | 27 s | 4 271 | 0,012 | 165 s | 25 178 | 0,335 | 0,35 | 191 s |
| E | 20261024-224751-2hu5 | 37 s | 5 923 | 0,013 | 109 s | 15 086 | 0,250 | 0,26 | 146 s |
| E | 20261024-225017-vou1 | 36 s | 5 617 | 0,012 | 189 s | 29 748 | 0,369 | 0,38 | 225 s |
| F | 20261024-225845-7ngp | 35 s | 5 887 | 0,013 | 165 s | 19 743 | 0,196 | 0,21 | 201 s |
| F | 20261024-230206-jlcg | 23 s | 3 780 | 0,011 | 182 s | 18 047 | 0,134 | 0,15 | 205 s |
| F | 20261024-230531-dh4z | 24 s | 3 665 | 0,011 | 213 s | 24 852 | 0,172 | 0,18 | 236 s |

Summen: A 5,49 USD; B 2,73 USD; C 3,70 USD; D 4,88 USD; E 0,99 USD; F 0,54 USD; zusammen 18,33 USD (Budget des Plans 30 USD). Die Schätzung des Plans traf A, B, C und E; D lag mit 4,88 USD deutlich unter der Obergrenze von 8 USD, F mit 0,54 USD bei etwa der Hälfte. Bei Mistral sind die Kosten inklusive EU-Aufschlag. In zwei F-Läufen meldete Mistral gelesene Cache-Token (jlcg 36 844, dh4z 36 332), was die Kosten dort senkt.

Gegenüber der Abnahme M4 (App 0.4.30, Profil 1.25.0): A brauchte in S2 405–440 s und 1,74–1,88 USD (M4: 428–459 s, 1,84–1,91 USD); C 90–125 s und 1,22–1,24 USD (M4: 114–152 s, 1,18–1,23 USD).

## Kennzahlen

Automatische Auswertung, Mittelwert (Spanne) über drei Läufe. „Ähnlichkeit“ und „Achsenabweichung“ beziehen sich auf die Redaktionsfassung, und zwar auf den Sachverhalt, den das Vergleichsverfahren ihr zugeordnet hat.

| Variante | Sachverhalte | Achsen gesetzt | Tendenz gesetzt | Beurteilung gleich | Tendenz gleich | Ähnlichkeit | Achsenabweichung | Achsen ≤ 1 | Plausibilität |
|---|---|---|---|---|---|---|---|---|---|
| A (Bezug) | 2,0 (2–2) | 0,88 (0,81–0,94) | 1,00 | 1,00 | 0,67 | 0,31 (0,26–0,35) | 0,29 (0,13–0,38) | 1,00 | 0,0 |
| B | 2,3 (2–3) | 0,88 (0,83–0,94) | 0,72 (0,50–1,00) | 0,67 (0–1) | 0,50 | 0,33 (0,31–0,35) | 0,46 (0,13–1,00) | 0,89 | 0,0 |
| C | 1,0 (1–1) | 0,46 (0,38–0,50) | 0,00 | 1,00 | – | 0,48 (0,43–0,51) | 0,69 (0,33–1,00) | 0,92 | 0,0 |
| D | 1,0 (1–1) | 0,46 (0,38–0,50) | 0,33 (0–1) | 1,00 | 1,00 | 0,39 (0,37–0,40) | 0,61 (0,33–1,00) | 0,92 | 0,0 |
| E | 3,0 (2–5) | 0,98 (0,93–1,00) | 1,00 | 1,00 | 0,00 | 0,46 (0,43–0,50) | 0,38 (0,13–0,50) | 0,92 | 0,3 (0–1) |
| F | 3,0 (2–4) | 0,97 (0,94–1,00) | 1,00 | 1,00 | 0,67 | 0,38 (0,36–0,39) | 1,10 (0,63–1,38) | 0,69 | 0,7 (0–1) |

Mittlere Kosten je Lauf: A 1,83 USD, B 0,91, C 1,23, D 1,63, E 0,33, F 0,18. Mittlere Dauer: A 535 s, B 400, C 168, D 357, E 187, F 214.

## Abstand zum Bezug

Sortiert nach dem Radarabstand (mittlerer Betrag der Differenz der Mediane je Achse); kein Gesamtwert. Der Radarabstand zählt nur Achsen, die Bezug und Variante beide gesetzt haben; wie viele Achsen eine Variante offen lässt, zeigt „Abstand offen“. Bei C und D gehen deshalb nur fünf von acht Achsen ein.

| Variante | Radarabstand | Abstand „offen“ | Δ Sachverhalte | Δ Achsen gesetzt | Δ Tendenz gesetzt | Δ Beurteilung gleich | Δ Tendenz gleich | Δ Ähnlichkeit | Δ Achsenabweichung | Δ Achsen ≤ 1 | Δ Plausibilität |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 0,25 | 0,08 | 0,3 | 0,01 | 0,28 | 0,33 | 0,17 | 0,02 | 0,17 | 0,11 | 0,0 |
| D | 0,80 | 0,54 | 1,0 | 0,42 | 0,67 | 0,00 | 0,33 | 0,08 | 0,32 | 0,08 | 0,0 |
| F | 0,81 | 0,04 | 1,0 | 0,09 | 0,00 | 0,00 | 0,00 | 0,06 | 0,80 | 0,31 | 0,7 |
| E | 0,88 | 0,00 | 1,0 | 0,10 | 0,00 | 0,00 | 0,67 | 0,15 | 0,08 | 0,08 | 0,3 |
| C | 1,20 | 0,54 | 1,0 | 0,42 | 1,00 | 0,00 | – | 0,16 | 0,40 | 0,08 | 0,0 |

### Kontrollrechnung der Zuordnung

Das Vergleichsverfahren ordnet die Sachverhalte nach der Ähnlichkeit von Bezeichnung, Ereignisarten und Ort zu. Die Redaktionsfassung hat einen Sachverhalt (Sturmfolgen, Stromausfall, KRITIS); seine Kodierung betrifft vor allem den Stromausfall. In drei Läufen, die die Lage in mehrere Sachverhalte zerlegen, wurde ihm nicht der Stromausfall-Sachverhalt zugeordnet: B-kg0c (Verkehrsfolgen statt Stromausfall), F-7ngp und F-jlcg (Sturmfolgen mit Verletzten statt Stromausfall). Die Kontrollrechnung vergleicht in diesen Läufen den Stromausfall-Sachverhalt (jeweils Sachverhalt 2); alle übrigen Läufe bleiben gleich. Nimmt das Verfahren die Kernaussage des Bewertungstextes hinzu, ordnet es alle drei Läufe so zu und ändert keinen anderen; so arbeitet seit 0.5.10 das Verfahren `ki-lead-vergleich/3` (AV-2026-W43-18).

| Variante | Radarabstand zu A | Abstand „offen“ | Beurteilung gleich | Tendenz gesetzt | Tendenz gleich | Achsenabweichung | Achsen ≤ 1 |
|---|---|---|---|---|---|---|---|
| A | – | – | 1,00 | 1,00 | 0,67 | 0,29 (0,13–0,38) | 1,00 |
| B | 0,12 | 0,00 | 1,00 | 0,33 | 0,00 | 0,25 (0,13–0,38) | 1,00 |
| C | 1,20 | 0,54 | 1,00 | 0,00 | 0,00 | 0,69 (0,33–1,00) | 0,92 |
| D | 0,80 | 0,54 | 1,00 | 0,33 | 0,33 | 0,61 (0,33–1,00) | 0,92 |
| E | 0,88 | 0,00 | 1,00 | 1,00 | 0,00 | 0,38 (0,13–0,50) | 0,92 |
| F | 0,75 | 0,00 | 0,67 | 1,00 | 0,00 | 0,50 (0,38–0,63) | 0,96 |

Kennzahlen hier nur für den jeweils verglichenen Sachverhalt (daher „Tendenz gesetzt“ anders als oben). Die Mediane der Radarwerte (D1–D8): A 3 3 2 3 2 4 2 2; B 3 4 2 3 2 4 2 2; C 5 – 4 – – 5 2 3; D – – 4 – 2 5 2 3; E 4 4 4 4 2 5 2 3; F 4 4 2 4 2 5 1 3; Redaktionsfassung 4 4 2 4 2 4 2 2. Zum Vergleich der Streuung: Einzelläufe von A weichen vom Median A um 0–0,25 ab, Einzelläufe von B um 0–0,50.

## Plausibilitätsbefunde

Die Prüfung (`src/pipeline/plausibilitaet.ts`) meldete in 18 Läufen drei Befunde, alle zur Achse D2. Von Hand gegen die sechs Eingänge und den Kodierleitfaden (D2-Stufen, direkt Betroffene) geprüft:

| Lauf | Stelle | Meldung der Prüfung | Prüfung von Hand | Urteil |
|---|---|---|---|---|
| E-2hu5 | Sachverhalt 2, D2 | D2 = 2 bei „rund 1.200 gestrandete Reisende“, das wäre Stufe 3 | Wert und genannte Zahl widersprechen sich. Zudem sind Gestrandete nach Kodierleitfaden mittelbar Betroffene, Hessen zählt sie ausdrücklich nicht; D2 wäre offen | echter Fehler |
| F-7ngp | Sachverhalt 1, D2 | D2 = 2 bei „insgesamt 82 verletzte Personen“, das wäre Stufe 1 | 82 liegt in Stufe 1 (10–99). Außerdem stimmt die Zahl nicht: Die Eingänge nennen 79, nicht 75 Leichtverletzte, zusammen mit 6 Schwerverletzten und einem Todesopfer also 86 | echter Fehler |
| F-dh4z | Sachverhalt 1, D2 | D2 = 4 bei „3.500 Personen“, das wäre Stufe 3 | Der Satz nennt 7.400 + 8.700 + 3.500 und ausdrücklich „Summe 19.600“; das ist Stufe 4, D2 = 4 ist richtig. Die Prüfung nahm die größte Zahl vor einem Personenwort und übersah die Summe | Fehlalarm |

**Fehlalarmquote: 1 von 3 (33 %).** Bei drei Treffern ist die Quote kaum belastbar. Die Ursache des Fehlalarms ist eindeutig; seit 0.5.10 geht eine ausdrücklich genannte Summe im D2-Satz vor (AV-2026-W43-17).

Fehler, die die Prüfung nicht erfasst (Stichprobe, nicht vollständig): F-7ngp und F-jlcg nennen 75 statt 79 Leichtverletzte; F-jlcg schreibt sechs Schwer- und 75 Leichtverletzte Nordrhein-Westfalen zu (dort 3 und 41), Sachsen-Anhalt fünf statt drei Leichtverletzte und nennt „über 12.900“ statt rund 15.000 Einsätze; E-b628 zählt für D2 = 3 die 1.200 Gestrandeten und 640 Einwohner nur über Forstwege erreichbarer Ortsteile als direkt Betroffene. Diese Fehler sind in sich stimmig gerechnet oder stehen ohne Klammer; die beiden Prüfregeln können sie nicht finden.

## Muss- und Darf-nicht-Punkte des Falls

Vorprüfung durch Suche in den 18 Entwürfen, mit Lesen der Fundstellen.

| Punkt | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Alle sechs Eingänge mit eigenem A-Eintrag | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| Zahl der Stromlosen zusammengeführt, mit Stand | 1/3 (ikph: mindestens rund 20 700, mit Datenstand); ifu7 und 07bh nennen die Teilwerte und lehnen die Summe für t0 ab | 2/3 (n4c8, e85u: mindestens 20 700, mit Datenstand); kg0c rechnet 20 700, kodiert aber D2 = 3 | 0/3, Teilwerte getrennt, Summe ausdrücklich abgelehnt | 0/3, wie C | zusammengeführt 3/3 (28 500 bzw. 29 400, mit Hochrechnung Niedersachsen); Datenstand nur in b628, vou1 datiert die Morgenwerte auf t0 | zusammengeführt 2/3 (29 400), ohne Datenstand; dh4z summiert 19 600 ohne Thüringen, das als eigener Sachverhalt geführt wird |
| Ende der Notstrompuffer vor Wiederversorgung als zeitkritisch | 3/3 | 3/3 | 3/3 | 3/3 (meist als Pufferende mit Nachbetankungsfrist) | 3/3 | 3/3 |
| Abweichende Bewertungen benannt (Textbaustein A.7.2) | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| Keine eigene Websuche (T5) | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| Keine ungekennzeichneten Angaben außerhalb der Eingänge | nicht vollständig geprüft; Zahlenabgleich ohne Fund | wie A | wie A | wie A | E-b628 D2-Grundlage (siehe oben) | F-7ngp, F-jlcg falsche Personen- und Einsatzzahlen (siehe oben) |

Abweichende Bewertungen: Alle Läufe nennen den Unterschied Landkreis Sonneberg „kritisch“ / Land Thüringen „erheblich“. A-ikph, B-e85u und B-kg0c nennen zusätzlich die abweichenden Bewertungen der übrigen Länder.

## Beobachtungen (keine Bestehensbedingung)

- **OpenAI** setzt einen einzigen Sachverhalt und lässt D2 und D4 in allen sechs Läufen offen, D1 und D5 in je fünf. Begründet wird das mit fehlenden Beständen zu t0 („keine zeitgleiche, zu t0 fortgeltend belegte Personengrundlage“). „high“ statt „medium“ setzt in einem von drei Läufen die Tendenz und in einem D5, ändert am Muster aber wenig. D braucht dafür gut doppelt so viele Ausgabetoken und fast die dreifache Zeit wie C.
- **Bezug A** ist selbst nicht einheitlich: Nur ein Lauf führt die Stromlosen zusammen (D2 = 4), zwei kodieren D2 = 3 mit derselben Begründung wie OpenAI. In M4 hatten alle drei Anthropic-Läufe zusammengeführt.
- **Mistral** zerlegt die Lage stärker (E-vou1: fünf Sachverhalte) und setzt fast alle Achsen und immer eine Tendenz. E kodiert im Median höher als A (D1, D2, D4, D6 und D8 um eine Stufe, D3 um zwei). F-jlcg beurteilt den Stromausfall „kritisch“ mit Tendenz „Verschärfung“ und folgt damit dem Landkreis Sonneberg statt dem Land.
- **„Handlungsrelevant bis“** nennt in 11 von 12 Läufen von A bis D auch 14.10.2026 14:00 (t0), in zehn davon mit dem Zusatz „zu t0 fällig, Erledigung ungeklärt“ (vgl. offener Punkt 5 der Spezifikation). E und F nennen keinen Termin auf t0.
- **Sonnet (B)** liegt in den Radarwerten am nächsten an A und führt die Stromlosen häufiger zusammen als A, lässt aber im Stromausfall-Sachverhalt in zwei von drei Läufen die Tendenz offen.

## Entscheidungen

Vom Herausgeber am 25.10.2026 wie empfohlen freigegeben, umgesetzt mit App 0.5.10:

- Standard-Profil OpenAI: Verdichtung mit `gpt-6-astra` „high“ (Variante D); zweitbeste Option C (AV-2026-W43-13). Ob eine Folgereihe mit „xhigh“ geprüft wird, ist offen.
- Standard-Profil Mistral: Verdichtung weiter mit `mistral-medium-3-5` „high“ (Variante E); zweitbeste Option F (AV-2026-W43-14, mit AV-2026-W43-03)
- App-Vorgabe der Verdichtung: Opus wie das Standard-Profil Anthropic (AV-2026-W43-10)
- Messwerte der Schätzung aus diesen Läufen (AV-2026-W43-05, -15), EU-Aufschlag in der Schätzung (AV-2026-W43-06)
- Plausibilitätsprüfung vorerst nur im Vergleichslauf; Übernahme in die App, sobald mindestens zehn Treffer von Hand geprüft sind und höchstens einer davon ein Fehlalarm ist (AV-2026-W43-16); D2-Regel mit Vorrang der ausdrücklichen Summe (AV-2026-W43-17)
- Zuordnung im Vergleichsverfahren mit Kernaussage für alle Vergleiche (`ki-lead-vergleich/3`, AV-2026-W43-18); Zahl der verglichenen Achsen und alle Abstände im Bericht der Auswertung (AV-2026-W43-19)

Die Kennzahlen oben stammen aus der Auswertung mit Verfahren `/2` (App 0.5.8). Mit Verfahren `/3` entsprechen sie der Kontrollrechnung.

## Vorbehalte

- **Drei Läufe je Variante.** Die Spannen innerhalb einer Variante sind teils größer als die Abstände zwischen Varianten (z. B. Radarabstand E 0,88 und F 0,75 bis 0,81 bei Einzelabweichungen von A bis 0,25). Die Werte tragen eine Wahl der Standard-Profile, keine Rangfolge der Anbieter.
- **Ilka ist aus der Entwicklung bekannt.** Arbeitsanweisung, Kodierleitfaden und Prüfregeln wurden an diesem Fall geschärft. Das Ergebnis sagt nichts über unbekannte Lagen.
- **Bezug und Redaktionsfassung stammen aus derselben Modellfamilie.** Die Redaktionsfassung wurde mit Claude Opus 5.5 entworfen (Feld `_entstehung`), Bezug ist eine Anthropic-Reihe, und die Handprüfung hat Claude vorgenommen. Nähe zu A heißt Nähe zu dieser Arbeitsweise, nicht fachliche Richtigkeit.
- **Zuordnung:** Die automatischen Kennzahlen hängen von der Zuordnung der Sachverhalte ab; in drei Läufen trifft sie nicht den Stromausfall (Kontrollrechnung oben).
- **Radarabstand** zählt nur gemeinsam gesetzte Achsen und schont Varianten, die viele Achsen offen lassen.
- **Dauer** hängt von der Last beim Anbieter ab; alle Läufe liefen nachts nacheinander, je Variante in einem Block.
- **Kosten** sind Listenpreise; die Abrechnung der Anbieter ist nicht geprüft.

## Nicht abgedeckt

- Erfassung mit Websuche, Management Summary und Reparatur (S3 war in keinem Lauf nötig)
- Globaler Mistral-Endpunkt; `gpt-6-astra` „xhigh“; Mistral ohne Nachdenken
- Blinde inhaltliche Bewertung der Entwürfe nach `evaluation/bewertungsschema.json`

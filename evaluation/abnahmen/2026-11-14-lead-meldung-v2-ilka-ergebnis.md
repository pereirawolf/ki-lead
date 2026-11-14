# Vergleichslauf Ilka vor und nach der Umstellung auf LEAD-Meldung-v2: Ergebnis vom 14.11.2026

Plan: [`../plaene/standardprofile-ilka.json`](../plaene/standardprofile-ilka.json), Variante `A-anthropic-standard` · Fall: [`../faelle/orkantief-ilka-verdichtung.json`](../faelle/orkantief-ilka-verdichtung.json) · Bezug: [docs/LEAD-MELDUNG-V2.md](../../docs/LEAD-MELDUNG-V2.md), offener Punkt 2 (Kosten und Fehlerquote des Ausgabeschemas)

**Ergebnis:** Nach der Umstellung auf v2 kostet ein Lauf im Mittel 2,66 statt 2,30 USD (+0,37 USD, +16 %) und dauert 698 statt 660 s (+6 %). In keinem der drei v2-Läufe war eine Reparatur nötig. Die Entwürfe hatten weder Schemabefunde noch Fehler oder Hinweise der Referenzprüfung (v1: eine Reparatur in drei Läufen). Rund ein Drittel der Mehrkosten entsteht in S1, weil der Prompt dort die Schwelle für den Preis langer Prompts überschreitet; der Rest entfällt auf S2 (größeres Eingangsmaterial, längerer Systemauftrag). Das Ausgabeschema selbst macht davon schätzungsweise 0,05 USD je Lauf aus.

## Rahmen

- Art: Messreihe zu Kosten und Fehlerquote; keine inhaltliche Bewertung der Entwürfe
- Stände: v1 mit App 0.8.3 und Beispielprofil 1.44.0 (`a4a2c88b0ced…`), LEAD-Meldung-v1; v2 mit App 0.9.0 und Beispielprofil 2.0.0 (`4ab658d17a81…`), LEAD-Meldung-v2
- Konfiguration in beiden Reihen gleich: Testart „S1 + S2 + S3 (aus Rohdaten)“, S1 claude-haiku-5-5 „high“, S2 Verdichtung claude-opus-5-5 „medium“, Reparatur claude-haiku-5-5 „low“; t0 14.10.2026 14:00, ohne Websuche, S1-Vorschlag unverändert übernommen; je drei Läufe
- Material: die sechs Eingangsmeldungen und die Redaktionsfassung des Falls, in der v2-Reihe in der v2-Fassung (andere Prüfsummen)
- Durchführung: durch den Herausgeber in der App unter „Einstellungen → Testläufe“ am 14.11.2026, v1 von 20:12 bis 20:45 Uhr, v2 von 21:23 bis 21:58 Uhr (Ortszeit)
- Kosten nach Listenpreisen (`src/anbieter/preise.ts`), ohne Gewähr; zusammen 14,88 USD (Obergrenze 15 USD)
- Auswertung: `npm run vergleichslauf:auswerten` (seit 0.9.1 nach Stand getrennt), Kennzahlen je Stufe aus den Laufprotokollen, Nachprüfung der v2-Entwürfe mit `npm run meldung:v2 -- pruefe` gegen das Schema des Beispielprofils 2.0.0; durch Claude (Opus 5.5), nicht von einer Person gegengelesen
- Laufprotokolle, Entwürfe und ZIP-Dateien: nicht eingecheckt

| Reihe | Läufe |
|---|---|
| v1 | 20261114-201209-jfhj, 20261114-202340-i5q5, 20261114-203507-940l |
| v2 | 20261114-212312-o7hv, 20261114-213436-m8s6, 20261114-214703-7mqq |

## Kosten, Token und Dauer je Stufe

Mittelwert je Lauf; Token als Eingabe / Schreiben in den Cache / Ausgabe. Gelesen wurde der Cache in keinem Lauf.

| Stufe | v1 Token | v1 USD | v1 s | v2 Token | v2 USD | v2 s |
|---|---|---|---|---|---|---|
| S1 | 34 577 / 61 338 / 27 021 | 0,025 | 113 | 47 258 / 62 553 / 33 071 | 0,145 | 138 |
| S2 Verdichtung | 38 666 / 155 956 / 66 683 | 2,268 | 528 | 51 634 / 180 891 / 70 381 | 2,519 | 560 |
| S3 Reparatur | 6 466 / 1 499 / 6 910 | 0,004 | 20 | – | 0 | – |
| **Lauf** | | **2,297** (2,237–2,418) | **660** (603–691) | | **2,664** (2,572–2,806) | **698** (663–747) |

Je Lauf:

| Lauf | Stufen | USD | s |
|---|---|---|---|
| jfhj (v1) | S1, S2 | 2,418 | 691 |
| i5q5 (v1) | S1, S2, S3 (1 Reparatur) | 2,237 | 687 |
| 940l (v1) | S1, S2 | 2,237 | 604 |
| o7hv (v2) | S1, S2 | 2,572 | 684 |
| m8s6 (v2) | S1, S2 | 2,806 | 746 |
| 7mqq (v2) | S1, S2 | 2,614 | 663 |

S2 schreibt in beiden Reihen gleich schnell (rund 126 Ausgabetoken je Sekunde); die Dauer folgt der Ausgabemenge.

## Woher die Mehrkosten kommen

| Anteil | Δ USD je Lauf | Ursache |
|---|---|---|
| S1 | +0,121 | Prompt aus Eingabe und Cache 95 915 → 109 811 Token; über 100 000 Token gilt für Haiku der Preis langer Prompts (Faktor 5). Mit dem Grundpreis läge S1 in v2 bei rund 0,029 USD. |
| S2 Eingabe | +0,052 | +12 968 Token: Eingangsmaterial in der v2-Fassung (89 803 statt 54 699 Zeichen; davon 25 % Leerzeichen der Einrückung, v1: 6 %) |
| S2 Cache | +0,125 | +24 935 Token: Systemauftrag 365 994 statt 319 462 Zeichen; Ausgabeschema 29 709 statt 8 195 Zeichen (JSON-Schema v1), Darstellungsdatei +12 263, Kodierleitfaden +7 800, Arbeitsanweisungen +3 375, Vorgabe zur Ausgabe nach v2 +1 499 |
| S2 Ausgabe | +0,074 | +3 698 Token (+6 %), innerhalb der Streuung der Läufe (v1 63 312–72 213, v2 64 696–77 880) |
| S3 | −0,004 | keine Reparatur in v2 |

Den Anteil des Ausgabeschemas am Cache von S2 schätzt der Bericht nach dem Verhältnis von Zeichen zu Token des Systemauftrags (rund 0,48 Token je Zeichen) auf etwa 10 000 Token, also rund 0,05 USD je Lauf.

## Fehlerquote

| Kennzahl | v1 | v2 |
|---|---|---|
| T1–T8 bestanden | 3/3 | 3/3 |
| schemakonform nach S3 | 3/3 | 3/3 |
| Schemabefunde der Antwort von S2 | 1 Lauf mit 1 Befund (i5q5: im Schema nicht vorgesehenes Feld in einem Analysebereich) | 0 |
| Reparaturen | 1 (i5q5, 0,013 USD, 59 s, danach schemakonform) | 0 |
| Fehler der Referenzprüfung | – (nur v2) | 0, ebenso 0 Hinweise; Nachprüfung mit `meldung:v2 pruefe`: alle drei ohne Fehler |
| Hinweise der App zum Entwurf | 1 (i5q5: Platzhalter-Kennungen im Zeitstrahl zugeordnet) | 0 |
| Plausibilitätsbefunde | 2 (jfhj, 940l; je D2, Personenzahl gegen Stufe) | 1 (m8s6; D2) |

## Abgleich mit der Redaktionsfassung

Mittelwert (Spanne) über die drei Läufe; Radarabstand v2 zu v1: 0,25 bei 8 von 8 verglichenen Achsen.

| Kennzahl | v1 | v2 |
|---|---|---|
| Ähnlichkeit | 0,29 (0,24–0,37) | 0,26 (0,21–0,31) |
| Beurteilung gleich | 1,00 (1,00–1,00) | 0,67 (0,00–1,00) |
| Tendenz gleich | 1,00 (zwei Läufe; einer ohne Tendenz) | 1,00 |
| Tendenz gesetzt | 0,83 (0,50–1,00) | 1,00 (1,00–1,00) |
| Achsen gesetzt | 0,94 (0,94–0,94) | 0,92 (0,88–0,94) |
| Achsenabweichung | 0,29 (0,25–0,38) | 0,60 (0,29–1,00) |
| Achsen ≤ 1 | 1,00 | 0,90 (0,71–1,00) |

Beide Reihen gliedern in zwei Sachverhalte; der Redaktionsfassung zugeordnet ist je Lauf einer. Die Kennzahlen beruhen daher je Lauf auf einem Paar, und die Abweichung von v2 bei Beurteilung und Achsen geht auf einen Lauf zurück (m8s6). Bezugsfassung und Material unterscheiden sich zwischen den Reihen (v1- bzw. v2-Fassung). Für die Frage nach Kosten und Fehlerquote sind diese Werte nicht maßgeblich.

## Folgerungen

- **Ausgabeschema:** Die tiefere Struktur verursacht keine Reparaturen; die geschlossenen Objekte halten. Ein Grund, das Schema zu verflachen, ergibt sich nicht. Eine niedrigere Fehlerquote als v1 ist mit drei Läufen nicht belegt, eine höhere ist nicht erkennbar.
- **Arbeitsanweisungen:** Aus den Messwerten folgt keine Änderung.
- **Eingangsmaterial für S1 und S2:** Es geht eingerückt in den Auftrag; in der v2-Fassung ist ein Viertel davon Einrückung. Ohne Einrückung ließe sich S1 voraussichtlich wieder unter die Schwelle von 100 000 Token bringen (dafür fehlen rund 9 800 Token). Das ist vor einer Änderung in einem Lauf zu messen.
- **Cache:** In der Reihe wurde der Cache nie gelesen, weil die Läufe mehr als fünf Minuten auseinanderliegen. Der Aufschlag für das Schreiben kostet hier rund 0,16 (v1) bzw. 0,19 USD (v2) je Lauf; das betrifft beide Fassungen gleich und nicht v2.
- **Werkzeug (in 0.9.1 behoben):** Die Auswertung vereinigte dieselbe Plan-Variante aus beiden Ständen zu einer Konfiguration; das LIESMICH des Exports nannte auch unter 0.9.0 „LEAD-Meldung-v1“.

## Vorbehalte

- Drei Läufe je Fassung, ein Fall, ein Anbieter.
- Material und Redaktionsfassung liegen in der v2-Reihe in der v2-Fassung vor; die Mehrkosten in der Eingabe gehen auch darauf zurück, nicht allein auf das Ausgabeschema.
- Kosten nach den Listenpreisen der App; der Preis langer Prompts für Haiku folgt `src/anbieter/preise.ts`.
- Auswertung durch Claude, nicht von einer Person gegengelesen.

## Nachtrag vom 15.11.2026: S1 mit Material ohne Einrückung (App 0.9.2)

Bezug: AV-2026-W46-01 (Eingangsmaterial ohne Einrückung an S1 und S2, umgesetzt mit App 0.9.2, PR #178) und Folgerung „Eingangsmaterial für S1 und S2“ oben. Durchführung durch den Herausgeber am 15.11.2026 (00:12 bis 00:19 Uhr Ortszeit) in der App unter „Einstellungen → Testläufe“: Testart „S1 (aus Rohdaten)“, Variante `A-anthropic-standard` (S1 claude-haiku-5-5 „high“), t0 14.10.2026 14:00, ohne Websuche, Beispielprofil 2.0.0, drei Läufe (20261115-001228-w35m, -001433-7lgt, -001621-d2i5). Auswertung aus den Laufprotokollen durch Claude (Opus 5.5); Laufprotokolle und ZIP-Datei nicht eingecheckt.

**Ergebnis:** Ohne Einrückung sinkt der Prompt von S1 von 109 811 auf 104 536 Token (−5 275, −4,8 %) und bleibt damit 4 536 Token über der Schwelle von 100 000 Token für den Preis langer Prompts bei Haiku. Das Eingangsmaterial schrumpft um 22 147 Zeichen, die Eingabe aber nur um rund 0,24 Token je Zeichen, weil Folgen von Leerzeichen wenige Token kosten. Entscheidung des Herausgebers vom 15.11.2026: Die Überschreitung wird hingenommen (Mehrkosten rund 0,10 USD je Lauf); die Änderung bleibt, weil sie bei gleichem Inhalt Eingabe in S1 und S2 spart.

| Kennzahl | v2-Reihe 14.11.2026 (App 0.9.0) | S1-Reihe 15.11.2026 (App 0.9.2) |
|---|---|---|
| Prompt S1 (Eingabe und Cache) | 109 811 Token | 104 536 Token |
| davon Eingabe / Cache | 47 258 / 62 553 (geschrieben) | 41 983 / 62 553 (Lauf 1 geschrieben, Läufe 2 und 3 gelesen) |
| Ausgabe | 27 548–41 479 Token | 26 098–41 262 Token |
| Kosten S1 | 0,132–0,166 USD | 0,089–0,136 USD (Lauf mit geschriebenem Cache 0,136 USD) |
| Dauer S1 | 115–170 s | 108–168 s |
| technisch bestanden | 3/3 | 3/3 (T1, T2, T4–T6) |
| Sachverhalte im Vorschlag | 2, 2, 2 | 2, 3, 2 |
| SOP-Abdeckung gegen den Zuschnitt der Musterfassung | 1,00 in allen Läufen | 0,86 (C12 fehlt), 1,00, 1,00 |

- Bei langem Prompt bestimmt die Ausgabe den größten Teil der Kosten von S1; sie streut stark. Die Läufe 2 und 3 lasen den Cache, weil sie nur wenige Minuten nach Lauf 1 begannen; vergleichbar mit der v2-Reihe ist nur Lauf 1.
- Gliederung und SOP-Auswahl weichen in je einem Lauf ab; mit drei Läufen ist das nicht von der Streuung von S1 zu trennen.
- Die Läufe liegen in den seit 0.9.2 geltenden Spannen der Schätzung für S1 mit Haiku „high“ (bis 240 s, bis 0,25 USD; AV-2026-W46-02).
- **Offen:** S2, Reparatur und Fehlerquote mit dem Material ohne Einrückung sind nicht gemessen; sie werden beim nächsten Vergleichslauf Ilka mit S2 ausgewertet (Entscheidung des Herausgebers vom 15.11.2026).

# Vergleichslauf Ilka nach Plan anbietermix-ilka: Ergebnis vom 25.10.2026

Plan: [`../plaene/anbietermix-ilka.json`](../plaene/anbietermix-ilka.json) · Bezug: Variante A des Plans `standardprofile-ilka` ([Ergebnis](2026-10-25-standardprofile-ilka-ergebnis.md)) · Auswertung: `npm run vergleichslauf:auswerten -- <ZIP-Dateien> --bezug A-anthropic-standard` · Befunde: AV-2026-W43-26 bis -30

**Ergebnis:** Beide Mischungen (S1 `gpt-6-luna` „high“ von OpenAI, S2 von Anthropic) sind vollständig, erfüllen T1–T8 und gliedern die Lage wie die Redaktionsfassung in einen Sachverhalt. M1 (S2 Opus „medium“) setzt alle Achsen und trifft Beurteilung und Tendenz der Redaktionsfassung in allen drei Läufen, bei gleicher Achsenabweichung wie A und rund 18 % geringeren Kosten. M2 (S2 Sonnet „medium“) kommt der Redaktionsfassung in den Radarwerten am nächsten (Achsenabweichung 0,13 gegenüber 0,29 bei A) und kostet rund 40 % von A; die Tendenz trifft es in zwei von drei Läufen. Beide sind schneller als A. Kosten und Dauer sind berichtet, haben aber nicht entschieden. Drei Läufe je Variante, Handprüfung durch Claude; eine Voreinstellung folgt daraus noch nicht (AV-2026-W43-30).

## Rahmen

- Art: Vergleich von Konfigurationen der Verdichtung (Befund AV-2026-W43-23), keine inhaltliche Abnahme der Methodik
- Stand: App 0.5.10, Beispielprofil 1.26.0 (Profilprüfsumme `725c7d9d…` wie bei A); Bezug A lief mit App 0.5.8. Zwischen 0.5.8 und 0.5.10 blieben Anweisungen, Profil und Material von S1 und S2 unverändert; in der Pipeline änderte sich nur die Wahl der Aufwandsstufe je Modell (`aufwandFuer`), die für Anthropic und OpenAI alle Stufen durchreicht.
- Durchführung: durch den Herausgeber in der App unter „Einstellungen → Modelle & Verarbeitung → Vergleichslauf Ilka“ am 25.10.2026 zwischen 02:18 und 02:52 Uhr (Ortszeit), je drei Läufe. Die Läufe wurden mit „Aktuelle Einstellungen“ gestartet, nicht über die Plan-Variante; die Reihendateien nennen deshalb keine Variante. Modelle und Aufwand jeder Stufe sind in den Laufprotokollen gleich dem Plan.
- Fall: `orkantief-ilka-verdichtung` (sechs fiktive Ländermeldungen, t0 14.10.2026 14:00, Websuche aus); S1-Vorschlag unverändert übernommen
- Kosten nach Listenpreisen (`src/anbieter/preise.ts`), ohne Gewähr
- Auswertung: Kennzahlen mit `npm run vergleichslauf:auswerten` (Vergleichsverfahren `ki-lead-vergleich/3`); Handprüfung der Plausibilitätsbefunde und der Kernbefunde nach der [Bewertungshilfe Ilka](../bewertungshilfen/orkantief-ilka.md) durch Claude (Opus 5.5). Nicht von einer Person gegengelesen.
- Laufprotokolle, Entwürfe, Reihendateien und ZIP-Dateien: nicht eingecheckt

## Konfigurationen

| Variante | S1 | S2 Verdichtung | Reparatur (nicht benötigt) |
|---|---|---|---|
| A Anthropic-Standard (Bezug, App 0.5.8) | `claude-haiku-5-5` „high“ | `claude-opus-5-5` „medium“ | `claude-sonnet-5-5` „low“ |
| B Anthropic mit Sonnet (App 0.5.8) | `claude-haiku-5-5` „high“ | `claude-sonnet-5-5` „medium“ | `claude-sonnet-5-5` „low“ |
| M1-luna-opus | `gpt-6-luna` „high“ | `claude-opus-5-5` „medium“ | `claude-sonnet-5-5` „low“ |
| M2-luna-sonnet | `gpt-6-luna` „high“ | `claude-sonnet-5-5` „medium“ | `claude-sonnet-5-5` „low“ |

A und M1 sowie B und M2 unterscheiden sich nur in S1. Damit ist die Wirkung des S1-Modells auf dasselbe Verdichtungsmodell zum ersten Mal getrennt messbar, mit dem Vorbehalt unterschiedlicher App-Versionen.

## Technische Prüfpunkte

| Variante | Läufe | T1–T8 |
|---|---|---|
| M1 | 5rbg, 2kjh, 8o79 | je 3/3 |
| M2 | ayac, d5hs, 67tj | je 3/3 |

Alle sechs Läufe: Status fertig, schemakonform ohne Reparatur, jeder Eingang mit eigenem A-Eintrag.

## Kosten und Dauer je Lauf

| Variante | Lauf | S1 Dauer | S1 Ausgabetoken | S1 USD | S2 Dauer | S2 Ausgabetoken | S2 USD | Gesamt USD | Gesamt Dauer |
|---|---|---|---|---|---|---|---|---|---|
| M1 | 20261025-021825-5rbg | 62 s | 5 994 | 0,005 | 316 s | 38 117 | 1,530 | 1,54 | 377 s |
| M1 | 20261025-022443-2kjh | 52 s | 4 969 | 0,005 | 302 s | 37 699 | 1,484 | 1,49 | 355 s |
| M1 | 20261025-023038-8o79 | 42 s | 3 935 | 0,004 | 312 s | 37 345 | 1,477 | 1,48 | 354 s |
| M2 | 20261025-023714-ayac | 65 s | 6 270 | 0,005 | 240 s | 36 735 | 0,762 | 0,77 | 304 s |
| M2 | 20261025-024218-d5hs | 32 s | 3 097 | 0,004 | 273 s | 45 985 | 0,683 | 0,69 | 306 s |
| M2 | 20261025-024724-67tj | 61 s | 5 293 | 0,005 | 218 s | 32 916 | 0,713 | 0,72 | 279 s |

Zusammen 6,68 USD (Budget des Plans 10 USD). Zum Vergleich A: 1,76–1,90 USD und 521–546 s je Lauf, S2 mit 50 060–54 484 Ausgabetoken; B: 0,84–0,98 USD und 387–413 s. Opus schreibt nach der Gliederung von luna (ein Sachverhalt) rund ein Viertel weniger Ausgabetoken als nach der von Haiku (zwei Sachverhalte). Alle Messwerte liegen in den Spannen der Schätzung (`src/pipeline/schaetzung.ts`); S2 mit Opus liegt nahe an deren Untergrenze von 300 s.

## Kennzahlen

Mittel über drei Läufe, gegenüber der Redaktionsfassung (ein Sachverhalt, Stromausfall); Spannweite in Klammern, wo sie streut.

| Kennzahl | A (Bezug) | B | M1 | M2 |
|---|---|---|---|---|
| Sachverhalte | 2 | 2,33 (2–3) | 1 | 1 |
| Achsen gesetzt | 0,88 (0,81–0,94) | 0,88 | 1,00 | 0,96 (0,88–1) |
| Tendenz gesetzt | 1,00 | 0,72 | 1,00 | 1,00 |
| Beurteilung gleich | 1,00 | 0,67 | 1,00 | 1,00 |
| Tendenz gleich | 0,67 | 0,50 | 1,00 | 0,67 |
| Ähnlichkeit (Mittel) | 0,31 | 0,33 | 0,36 | 0,39 |
| Achsenabweichung (Mittel) | 0,29 (0,13–0,38) | 0,46 | 0,29 | 0,13 |
| Achsen höchstens 1 entfernt | 1,00 | 0,89 | 1,00 | 1,00 |
| Plausibilitätsbefunde je Lauf | 0 | 0 | 0,33 | 0,33 |
| USD je Lauf | 1,83 | 0,91 | 1,50 | 0,72 |
| Dauer je Lauf | 535 s | 400 s | 362 s | 296 s |

Mediane der Radarwerte (D1–D8): A 3, 3, 2, 3, 2, 4, 2, 2; M1 4, 3, 2, 3, 2, 5, 2, 2; M2 4, 3,5, 2, 3, 2, 4, 2, 2. In M2-ayac bleibt D2 offen, mit Begründung (Bewertungshilfe B.1: begründet offen).

## Abstand zum Bezug

| Variante | Radarabstand zu A | verglichene Achsen | Abstand „offen“ |
|---|---|---|---|
| M2 | 0,19 | 8 von 8 | 0,04 |
| B | 0,25 | 8 von 8 | 0,08 |
| M1 | 0,25 | 8 von 8 | 0,00 |
| D (OpenAI, astra „high“) | 0,80 | 5 von 8 | 0,54 |
| E (Mistral-Standard) | 0,88 | 8 von 8 | 0,00 |

M1 weicht von A in den Medianen von D1 und D6 um je eine Stufe ab (4 statt 3, 5 statt 4). Die Zuordnung der Sachverhalte zur Redaktionsfassung ist in allen sechs Läufen eindeutig (ein Sachverhalt, kein Sachverhalt ohne Gegenstück).

## Wirkung von S1 auf dieselbe Verdichtung

| S2 | S1 Haiku „high“ | S1 luna „high“ |
|---|---|---|
| Opus „medium“ | A: 2 Sachverhalte, Tendenz gleich 2/3, Achsen 0,88, 1,83 USD, 535 s | M1: 1 Sachverhalt, Tendenz gleich 3/3, Achsen 1,00, 1,50 USD, 362 s |
| Sonnet „medium“ | B: 2–3 Sachverhalte, Tendenz gesetzt 0,72, Beurteilung gleich 2/3, Abweichung 0,46 | M2: 1 Sachverhalt, Tendenz gesetzt 3/3, Beurteilung gleich 3/3, Abweichung 0,13 |

Mit luna in S1 sind beide Verdichtungsmodelle näher an der Redaktionsfassung, schneller und günstiger. Das stützt die Auswertung je Stufe vom 25.10.2026 (S1 am besten mit luna). Vorbehalt: Der größere Teil der Verbesserung kann aus der Gliederung in einen Sachverhalt kommen, die der Gliederung der Redaktionsfassung entspricht; die Kennzahlen bevorzugen diese Gliederung (LS-2026-W43-15). Für den Vergleich der Verdichtungsmodelle allein ist der Plan [`s2-isoliert-ilka`](../plaene/s2-isoliert-ilka.json) vorgesehen.

## Plausibilitätsbefunde

| Lauf | Art | Auszug | Einordnung |
|---|---|---|---|
| M1-8o79 | Summe | „rund 8.700 Personen (Haushaltsfaktor 1,9 als angenommener Wert)“ → „Summe der Klammerwerte 10“ | Fehlalarm: Die Prüfung liest das Dezimalkomma in „1,9“ als Trenner zweier Summanden (AV-2026-W43-27) |
| M2-67tj | D2 | „… Deshalb gilt Stufe 3; Grenze zu 4 ist 10.000 Personen.“ → „genannte Personenzahl 10.000 entspricht Stufe 4“ | Fehlalarm in der Begründung: 10.000 ist die genannte Stufengrenze, keine Personenzahl. Die im selben Satz genannte „Summe der drei amtlichen Werte (20.700)“ erkennt die Prüfung nicht. In der Sache setzt der Entwurf Stufe 3, obwohl er selbst sagt, die Summe trüge Stufe 4, und begründet das mit fehlender Fortgeltung bis t0; das ist fachlich zu prüfen (Bewertungshilfe, Abschnitt A.2) (AV-2026-W43-28) |

Stand nach den Regeln seit 0.5.10: vier von Hand geprüfte Treffer, davon zwei Fehlalarme. Die Schwelle für einen Hinweis in der App (mindestens zehn geprüfte Treffer, höchstens ein Fehlalarm; AV-2026-W43-16) ist nicht erreicht.

## Kernbefunde nach der Bewertungshilfe

Handprüfung der sechs Entwürfe nach Abschnitt C der [Bewertungshilfe Ilka](../bewertungshilfen/orkantief-ilka.md):

| Kernbefund | M1 | M2 | Anmerkung |
|---|---|---|---|
| K1 A-Eintrag je Eingang | 3/3 | 3/3 | |
| K2 Stromlose nach Abschnitt A | 2/3, 1 strittig | 3/3 | M1-8o79 führt rund 20.700 Personen „in drei Kreisräumen“ mit Herkunft zusammen, schreibt aber ausdrücklich, die Summe sei kein Mindestwert; Weg 1 verlangt die Kennzeichnung als Mindestwert. Fachlich zu entscheiden. |
| K3 Notstrompuffer zeitkritisch | 3/3 | 3/3 | |
| K4 Abweichende Bewertungen | 2/3, 1 teilweise | 3/3 | M1-8o79 nennt Sonneberg „kritisch“, aber nicht die Einstufung des Landes Thüringen „erheblich“ |
| K5 Erreichbarkeit eingeschränkt | 3/3 | 3/3 | |
| K6 Personenschäden | 3/3 | 3/3 | |
| K7 Bahnstrecken | 3/3 | 3/3 | |
| K8 Keine Quellen außerhalb der Eingänge | 3/3 | 3/3 | |

## Vorbehalte

- Drei Läufe je Variante; A und B liefen mit App 0.5.8, M1 und M2 mit 0.5.10.
- Die Redaktionsfassung führt einen Sachverhalt und stammt aus derselben Modellfamilie wie Opus und Sonnet. Ein Sachverhalt ist nach Teil A zulässig, aber nicht die einzige richtige Gliederung; die Kennzahlen bevorzugen ihn.
- Die Kennzahlen messen Nähe zur Redaktionsfassung, nicht fachliche Richtigkeit; die Blindbewertung ([Plan](../plaene/2026-10-25-blindbewertung-ilka.md)) steht aus.
- Handprüfung durch Claude, nicht von einer Person gegengelesen.

## Folgerungen

- Beide Mischungen sind für den Vergleich geeignet und liegen in den Kennzahlen vor A und B. M2 ist die günstigste Konfiguration mit vollständigen Achsen; M1 trifft Beurteilung und Tendenz in jedem Lauf.
- Ob ein Mix als Voreinstellung angeboten wird, ist eine Entscheidung des Herausgebers (AV-2026-W43-30). Für sie spricht die bessere Nähe zur Redaktionsfassung bei geringeren Kosten; dagegen sprechen zwei Anbieter mit zwei Schlüsseln und Datenwegen und die kleine Zahl der Läufe.
- S3 Reparatur war auch in diesen sechs Läufen nicht nötig. Für die Wahl des Reparaturmodells gibt es seit 0.5.13 den [Prüffall Reparatur](../plaene/reparatur-ilka.json) (AV-2026-W43-25).

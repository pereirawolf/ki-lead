# Prüffall Reparatur nach Plan reparatur-ilka: Ergebnis vom 25.10.2026

Plan: [`../plaene/reparatur-ilka.json`](../plaene/reparatur-ilka.json) · Fall: [`../faelle/ilka-reparatur.json`](../faelle/ilka-reparatur.json) · Befunde: AV-2026-W43-32 bis -35, -38

**Ergebnis:** Alle sechs Modelle machen jeden der zehn beschädigten Entwürfe mit einer Reparatur schemakonform. Den Originalwert an den beschädigten Stellen stellen nur Sonnet, Haiku und gpt-6.1-sol in allen Fällen wieder her, ohne übrige Inhalte zu ändern. Haiku „low“ kostet dabei rund ein Zwanzigstel von Sonnet und wird Reparaturmodell der App-Vorgabe, des Standard-Profils Anthropic und der Mix-Profile (AV-2026-W43-32). OpenAI bleibt bei gpt-6.1-sol „low“. gpt-6-luna und Mistral Medium 3.5 setzen einen Radarwert außerhalb der Skala auf den Skalenrand statt auf den in der Begründung genannten Wert; Mistral Small leert eine Beurteilung und streicht Textzeilen. Mistral repariert künftig mit Medium 3.5 „low“ (AV-2026-W43-33), die Anweisung der Reparatur wurde geschärft (AV-2026-W43-34), und der Prüffall zählt seit 0.5.15 „Stellen wie Original“ (AV-2026-W43-35).

## Rahmen

- Art: Vergleich der Reparaturmodelle (S3); keine Abnahme der Pipeline
- Stand: App 0.5.14, Beispielprofil 1.26.0, Musterfassung `953f7682…`, S1-Zuschnitt `f7b14d5b…` wie im Plan; Anweisung der Reparatur vor AV-2026-W43-34
- Durchführung: durch den Herausgeber in der App unter „Einstellungen → Modelle & Verarbeitung → Prüffall Reparatur“ am 25.10.2026 zwischen 09:42 und 10:54 Uhr (Ortszeit), je zwei Durchgänge über die Defekte R1–R5, also zehn Fälle je Modell. R-A bis R-E als Plan-Variante; R-F (Mistral Medium 3.5) mit „Aktuelle Einstellungen“, nach der Auswertung von R-E nachträglich in den Plan aufgenommen (Fassung 2, AV-2026-W43-38). Mistral über den EU-Endpunkt. Der unbeschädigte Durchlauf war in allen Reihen ohne Reparatur schemakonform.
- Kosten nach Listenpreisen (`src/anbieter/preise.ts`), ohne Gewähr; zusammen rund 4,3 USD
- Auswertung: Reihendateien `ki-lead-reparaturtest/1`; Abweichungen in den reparierten Entwürfen von Hand nachgesehen durch Claude (Opus 5.5). Nicht von einer Person gegengelesen.
- Laufprotokolle, reparierte Entwürfe und ZIP-Dateien: nicht eingecheckt

## Ergebnis je Modell

| Variante | Schemakonform | Stellen wie Original | Fälle mit veränderten übrigen Inhalten | USD je Fall | Dauer je Fall | Ausgabetoken je Fall |
|---|---|---|---|---|---|---|
| R-A Sonnet „low“ | 10/10 | 10/10 | 0 | 0,197–0,207 | 70–72 s | 16 350–16 675 |
| R-B Haiku „low“ | 10/10 | 10/10 | 0 | 0,010 | 47–48 s | 16 746–16 991 |
| R-C gpt-6.1-sol „low“ | 10/10 | 10/10 | 0 | 0,093–0,115 | 54–57 s | 9 195–9 237 |
| R-D gpt-6-luna „low“ | 10/10 | 7/10 | 0 | 0,005–0,006 | 57–69 s | 9 195–9 392 |
| R-E Mistral Small „low“ | 10/10 | 8/10 | 3 | 0,008–0,009 | 39–45 s | 9 819–10 040 |
| R-F Mistral Medium 3.5 „low“ | 10/10 | 6/10 | 2 | 0,103 | 46–48 s | 10 040 |

Jeder Fall brauchte genau eine Reparatur. „Stellen wie Original“ ist hier aus den Reihendateien nachgerechnet (Wert an jeder beschädigten Stelle gleich dem Original und nicht leer); die App zählt das seit 0.5.15 selbst.

## Abweichungen

- **R-D gpt-6-luna:** Bei R1 (D2 = 7 statt 4) setzt luna in drei von vier Fällen 6, den Rand der Skala; der Bewertungstext desselben Sachverhalts nennt „D2 = 4 (Mindestwert)“.
- **R-E Mistral Small:** Bei R2 (Beurteilung „hoch“ statt „erheblich“) bleibt die Beurteilung in beiden Fällen leer. In drei Fällen (R1 einmal, R3 zweimal) fehlt danach die Zeile „Abweichende Bewertung“ im Bewertungstext von Sachverhalt 2, in zwei davon auch D5.
- **R-F Mistral Medium 3.5:** Bei R1 setzt das Modell in allen vier Fällen D2 = 6. Bei R4 formuliert es in beiden Fällen eine Zeile in Sachverhalt 1 um („Güterverkehrsfolgen Nord–Süd“ wird zu „Wirkung der Sperrung Nord–Süd“). Es löscht nichts und lässt keine Beurteilung leer.

Die Anweisung der Reparatur sagte bis 0.5.14 nicht, woher ein korrigierter Wert kommen soll, und verbot Kürzungen nicht ausdrücklich. Seit 0.5.15 nennt sie die Begründung desselben Sachverhalts als Quelle, den Leerwert als Ausweg und schließt den Skalenrand und Kürzungen aus (AV-2026-W43-34).

## Folgerungen

- Reparatur der App-Vorgabe, des Standard-Profils Anthropic und der Mix-Profile: Haiku „low“ (AV-2026-W43-32, -31).
- Reparatur OpenAI: gpt-6.1-sol „low“ bleibt; luna ist trotz geringer Kosten nicht geeignet.
- Reparatur Mistral: Medium 3.5 „low“ statt Small (AV-2026-W43-33). Kein Mistral-Modell erreicht die Zuverlässigkeit von Haiku oder sol. Nach der geschärften Anweisung werden beide Mistral-Modelle erneut geprüft; repariert Small dann fehlerfrei, kehrt das Profil zu Small zurück.
- S3 war in keinem der 27 Läufe der Vergleichsreihen nötig; die Wahl betrifft einen seltenen Fall.

## Vorbehalte

- Zwei Durchgänge je Modell; fünf künstliche Defekte an einem einzigen Entwurf.
- Ergebnisse gelten für die Anweisung bis 0.5.14; Läufe mit der Anweisung ab 0.5.15 sind nicht unmittelbar vergleichbar.
- Handprüfung durch Claude, nicht von einer Person gegengelesen.

## Nachtrag vom 25.10.2026: Nachtest mit der Anweisung seit 0.5.15

Der Bericht oben bleibt unverändert. Nachtest durch den Herausgeber am 25.10.2026 zwischen etwa 12:00 und 12:38 Uhr (Ortszeit) mit App 0.5.15, Beispielprofil 1.27.0 und der geschärften Anweisung der Reparatur (AV-2026-W43-34), je zwei Durchgänge als Plan-Variante; Kennzahl „Stellen wie Original“ von der App gezählt (AV-2026-W43-35). Befunde: AV-2026-W43-39, -42.

| Variante | Schemakonform | Stellen wie Original | Fälle mit veränderten übrigen Inhalten | USD je Fall | Dauer je Fall | Ausgabetoken je Fall |
|---|---|---|---|---|---|---|
| R-B Haiku „low“ | 10/10 | 10/10 | 0 | 0,010 | 47–50 s | 16 663–17 389 |
| R-C gpt-6.1-sol „low“ | 10/10 | 10/10 | 0 | 0,093–0,115 | 57–80 s | 9 195–9 242 |
| R-E Mistral Small „low“ | 10/10 | 10/10 | 0 | 0,008–0,009 | 41–45 s | 10 040 |
| R-F Mistral Medium 3.5 „low“ | 10/10 | 10/10 | 0 | 0,100–0,104 | 46–51 s | 10 040 |

Jeder Fall brauchte eine Reparatur; zusammen rund 2,2 USD. Mistral Small streicht keine Zeilen mehr und lässt keine Beurteilung leer, Mistral Medium setzt D2 nicht mehr auf den Skalenrand. Nach der Bedingung aus AV-2026-W43-33 repariert das Standard-Profil Mistral seit 0.5.16 wieder mit Small (AV-2026-W43-39). Haiku (Anthropic, Mix-Profile, App-Vorgabe) und gpt-6.1-sol (OpenAI) bleiben. Weiterhin zwei Durchgänge je Modell an einem einzigen Entwurf.

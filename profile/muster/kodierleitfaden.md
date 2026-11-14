# Kodierleitfaden (Vorlage): Lageprofil und Quellenkategorien

Vorlagefassung · Fassung 1.0 vom 14.11.2026 · gilt für das Schema der Vorlage nach LEAD-Meldung-v2 mit dem Modul `muster-lageprofil` 0.1 und die Darstellungsdatei der Vorlage · Platzhalter in eckigen Klammern vor der Verwendung ersetzen

Ersetze die Abschnitte durch die Regeln deiner Organisation. Die Stufentexte in Abschnitt 2 müssen wortgleich in der Darstellungsdatei stehen.

## 1. Grundregeln

- Höhere Stufe = stärkere Ausprägung.
- Offen, wenn kein Beleg vorliegt: Status `offen`, `stufe: null`, Grund (`offen_grund`) und kurze Begründung.
- Jede gesetzte Stufe wird in `begruendung` der Achse begründet, Belege zusätzlich in `quellen`; eine bestätigte Mindestzahl trägt den Status `mindestwert`.
- Trägt der Beleg die höhere Stufe nicht vollständig, gilt die niedrigere; die niedrigere Stufe ist keine Vorsichtswahl.

## 2. Stufentexte (Referenz)

| Achse | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Raum | punktuell | Abschnitt | mehrere Abschnitte | gesamte Einsatzstelle |
| Betroffene Personen | unter 10 | 10–99 | 100–999 | 1.000 oder mehr |
| Dynamik | stabil | gering | hoch | chaotisch |

## 3. Achsenregeln

### Raum

[Was als Abschnitt gilt; Grenzfälle zwischen zwei Stufen.]

### Betroffene Personen

[Wer als betroffen zählt; Zählweise bei Schätzungen.]

### Dynamik

[Woran die Dynamik gemessen wird; Beobachtungszeitraum.]

## 4. Bewertung

[Kriterien für geringfügig, erheblich und kritisch.] Die Stufe steht in `bewertung.beurteilung.stufe` mit Begründung, keine Angabe ist `null`.

## 5. Quellenkategorien

| Kategorie | Bedeutung |
|---|---|
| A | amtlich |
| B | Betreiber (Angaben zum eigenen Betrieb) |
| W | wissenschaftlich |
| M | Medien |
| P | sonstige private Quellen |

Rangfolge bei widersprüchlichen Angaben: A vor B vor W vor M vor P. Jede Quelle ist ein Eintrag in `quellen` mit ID, Kategorie, Herausgeber, Titel, Zugriff und Zugang (LEAD-MELDUNG-V2.md, Abschnitt 5.1). [Ergänzende Regeln der Organisation.]

## 6. Pflege

[Pflegeverantwortliche Funktion, Prüfanlässe, Änderungsverlauf.]

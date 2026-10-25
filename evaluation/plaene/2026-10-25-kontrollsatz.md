# Entwicklungssatz und Kontrollsatz: Plan vom 25.10.2026

Status: Verfahren festgelegt, Kontrollsatz noch nicht verfasst · Befund LS-2026-W43-19 · Entscheidung des Herausgebers vom 25.10.2026: der Kontrollsatz wird neu verfasst und bis zum Kontrolllauf nicht für die Regelarbeit verwendet

## Anlass

Arbeitsanweisungen, Kodierleitfaden und Prüfregeln wurden wiederholt am Fall Ilka geschärft; auch die übrigen Fälle unter `../faelle/` sind teils zusammen mit SOP-Überarbeitungen entstanden. Ein gutes Ergebnis an diesen Fällen zeigt deshalb noch keine Übertragbarkeit auf unbekannte Lagen. Drei Wiederholungen eines Falls sind keine drei unabhängigen Lagen.

## Begriffe

- **Entwicklungssatz:** alle Fälle, an denen Regeln oder Prüfverfahren entwickelt, geprüft oder angepasst werden. Dazu gehören alle Fälle unter `../faelle/` im Stand vom 25.10.2026, auch die Fälle `zaehlregel-*` aus LS-2026-W43-17.
- **Kontrollsatz:** neu verfasste fiktive Fälle, die erst im Kontrolllauf verwendet werden. Ein Fall gehört genau einem Satz an; die Zugehörigkeit steht im Plan, nicht im Fall.

## Verfahren

1. **Verfassen:** mindestens sechs neue fiktive Fälle nach der Prüfliste in [`../faelle/README.md`](../faelle/README.md), gestreut über Ereignisarten (mindestens vier verschiedene), Referenzräume (Kreis, Land, Bund, Ausland mit Deutschlandbezug), Phase (Vorwarnung, akute Lage, Nachlauf) und Datenprobleme (widersprüchliche Zahlen, unterschiedliche Datenstände, Umrechnung, fehlende Belege). Möglichst durch eine Person oder ein Werkzeug, das an der Regelarbeit der letzten Wochen nicht beteiligt war.
2. **Zurückhalten:** Die Fälle werden erst unmittelbar vor dem Kontrolllauf eingecheckt. Bis dahin werden sie nicht in Prüfläufen, Befunden oder bei Änderungen an SOP, Arbeitsanweisungen oder Kodierleitfaden verwendet.
3. **Fixieren:** Ein Bewertungsplan nach `plan.schema.json` nennt die Fälle, Varianten, Wiederholungen und das Budget; Profilstand und Commit stehen im Plan, die Prüfsummen des Materials in den Laufprotokollen. Der Plan wird vor dem ersten Lauf eingecheckt.
4. **Durchführen und bewerten** wie jede Bewertung (README, Ablauf); kostenpflichtige Läufe nur mit gesondertem Auftrag und Budget.
5. **Danach:** Notwendige Anpassungen an Regeln oder Prüfverfahren mit Verweis auf das Ergebnis dokumentieren. Die verwendeten Kontrollfälle gehen damit in den Entwicklungssatz über; die nächste Kontrolle braucht einen neuen Kontrollsatz.

## Offen

Zeitpunkt und Budget des ersten Kontrolllaufs; wer die Fälle verfasst.

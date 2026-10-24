# Modellbewertung (getrennt von den Regressionstests)

Dieser Ordner beschreibt, wie KI-LEAD die **inhaltliche Qualität** verschiedener Modelle und Aufwandsstufen bewertet. Das ist etwas anderes als die Tests unter `tests/`:

|  | Regressionstests (`npm test`, `npm run test:browser`) | Modellbewertung (dieser Ordner) |
|---|---|---|
| Frage | Tut der Code, was er soll? | Wie gut sind die Ergebnisse eines Modells? |
| KI-Aufrufe | keine (Anbieter simuliert) | echte, kostenpflichtige Läufe |
| Ergebnis | bestanden / nicht bestanden | Punkte je Kriterium, Kosten, Dauer |
| Wann | bei jedem Stand und in jeder Prüfung | nur auf ausdrücklichen Auftrag mit Budget |

Läufe gegen echte KI-Anbieter gehören **nie** in `npm test`, in die Browsertests oder in den Prüfjob von GitHub Actions.

## Inhalt

- `faelle/`: Bewertungsfälle, je Datei ein Auftrag mit Material und Erwartungen (`fall.schema.json`)
- `material/`: fiktives Übungsmaterial der Fälle, soweit es im Repository liegt
- `plaene/`: festgelegte Bewertungspläne nach `plan.schema.json` (Fragestellung, Fälle, Varianten, Wiederholungen, Budgetgrenze) und die Soll-Abdeckung der Fälle; ein Plan kombiniert vorhandene Fälle, ohne sie zu kopieren, und ist kein Ergebnis
- `bewertungsschema.json`: Format einer Bewertung (ein Lauf, eine bewertende Person)
- `ergebnisse/`: zusammengefasste Bewertungen; Laufprotokolle und Rohantworten bleiben außerhalb des öffentlichen Repositorys
- Vergleichslauf Ilka in der App (seit 0.5.8, „Einstellungen → Modelle & Verarbeitung“): dieselbe Reihe wie das Abnahmeskript M4 mit der gewählten Konfiguration, Ergebnis als ZIP mit Reihendatei `ki-lead-abnahme/1` (`quelle: "app"`) und Übersicht als CSV; die Laufprotokolle bleiben außerhalb des Repositorys
- `abnahmen/`: technische Abnahmen der Meilensteine mit echten KI-Läufen (Laufskript, eigene Vitest-Konfiguration, Ergebnis); nie Teil von `npm test`. Dort steht auch das Ergebnis der Erprobung im Testkreis (M6); Plan und Regeln der Erprobung: [docs/ERPROBUNG.md](../docs/ERPROBUNG.md)
- `befunde/`: Befundregister – Entscheidungsstand der Befunde aus den automatisierten Prüfläufen (umgesetzt, abgelehnt, zurückgestellt, überholt), damit spätere Läufe Bekanntes nicht erneut vorlegen; siehe [befunde/README.md](befunde/README.md)
- `pruefsteine/`: KI-Meldungen aus dem wöchentlichen Erfassungstest zu realen Lagen, unverändert und mit Begleitnotiz (Regelwerksstand, Einstufung, bekannte Mängel); Prüfsteine für spätere Fassungen der LEAD-Systematik, keine Musterlösungen; siehe [pruefsteine/README.md](pruefsteine/README.md)

`tests/evaluation/` prüft nur, dass Fälle, Ergebnisse, das Befundregister und die Prüfsteine ihren Schemata entsprechen. Es ruft keine KI auf.

## Ablauf einer Bewertung

1. **Plan vor dem ersten Lauf festlegen:** Fall, Varianten (Modell und Aufwand je Stufe), Wiederholungen, Budgetgrenze. Änderungen nur als neue Planfassung. Vorbild ist die Testreihe vom 20./21.10.2026 (3 × 3 Varianten S1 × S2, Wiederholungen einer Zelle, Kontrolle mit PDF-Material).
2. **Läufe ausführen** mit denselben Pipeline-Funktionen wie die App (`stufe1`, `stufe2und3`); jedes Laufprotokoll im App-Format `ki-lead-lauf/1` sichern.
3. **Blind bewerten:** Die Entwürfe werden ohne Modell, Aufwand und Kosten vorgelegt (zufällige Kennungen). Je Entwurf eine Bewertung nach `bewertungsschema.json`; unbelegte Aussagen werden einzeln aufgeführt.
4. **Mehrere Kodierungen derselben Lage vergleichen** (Wiederholungen, Varianten, mehrere Personen): `npm run vergleich:mehrfach -- <ordner> [--fall <id>]` gibt je Sachverhalt und Achse Werte, Median, Spannweite, Paare mit höchstens einer Stufe Abstand und, mit `--fall`, Treffer der erwarteten Radarwerte aus; dazu Krippendorffs Alpha (ordinal) je Achse über die Sachverhalte als Einheiten. Liegen die Meldungen in Unterordnern je Lage, gehen alle Lagen in Alpha ein; mit nur einer Lage und einem Sachverhalt entfällt Alpha. Der Ordner liegt unter `privat/` oder außerhalb des Repositorys.
5. **Auflösen und zusammenfassen:** erst danach Kennungen den Varianten zuordnen, Mittelwerte und Spannen je Variante bilden, Kosten und Dauer aus den Laufprotokollen übernehmen. Die Gesamtnote ist ein eigenes, ganzheitliches Urteil und kein Mittelwert der Kriterien.
6. **Entscheidung dokumentieren:** Änderungen an Vorgaben (`src/pipeline/einstellungen.ts`) oder an den Messwerten der Schätzung (`src/pipeline/schaetzung.ts`) nur mit Verweis auf die Ergebnisse.

## Kriterien (je 1–5)

| Kriterium | Frage |
|---|---|
| `belege` | Sind Aussagen mit Quellen belegt, und tragen die Quellen die Aussage? |
| `zeit` | Stimmen t0, Datums- und Zeitangaben, Fristen und der Stand der Angaben? |
| `referenzraum` | Ist der Bezug (Land, Bund, Ausland) richtig gewählt und durchgehalten? |
| `unsicherheit` | Wird Unsicherheit benannt, statt zu raten oder zu glätten? |
| `radar` | Sind die Werte des Lagenradars plausibel und begründet, offene Achsen offen? |
| `empfehlungen` | Sind Handlungsempfehlungen konkret, zuständig adressiert und umsetzbar? |

Skala: 1 = unbrauchbar, 2 = erhebliche Nacharbeit, 3 = brauchbar mit Nacharbeit, 4 = geringe Nacharbeit, 5 = ohne Nacharbeit verwendbar. Dazu kommen `unbelegte_aussagen` (Liste) und `gesamt` (ganzheitlich, 1–5).

## Urheberrecht und Datenschutz

- Keine Volltexte urheberrechtlich geschützter Artikel im Repository, auch nicht in Fällen oder Ergebnissen. Fälle verweisen auf die URL und halten eine Prüfsumme (`sha256`) des verwendeten Materials fest; wer den Lauf wiederholt, beschafft das Material selbst. Muss Material zwischen Läufen weitergegeben werden, dann nur verschlüsselt.
- Prüfsteine zu realen Lagen stützen sich nur auf öffentlich zugängliche, vorrangig amtliche Quellen in eigenen Worten und sind als KI-Entwurf ohne amtlichen Charakter gekennzeichnet (Test).
- Öffentliche Fälle verwenden fiktive oder offen zugängliche Inhalte (etwa den fiktiven Datensatz Orkantief „Ilka“ unter `profile/lead-beispiel/beispiele/`).
- Organisationsspezifische Profile, echte Meldungen und Laufprotokolle mit internen Inhalten bleiben im nicht eingecheckten Ordner `privat/`.
- API-Schlüssel stehen nie in Fällen, Ergebnissen, Protokollen oder Skripten; Läufe lesen sie aus der Umgebung oder aus einem Secret.

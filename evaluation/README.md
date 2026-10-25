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
- `material/ilka-musterfassung.json`: feste, konsolidierte Verdichtung Ilka aus den Vergleichsreihen A–G als Ausgangsfall für die Management Summary und als Bewertungsbeispiel (Herkunft: [bewertungshilfen/ilka-musterfassung.md](bewertungshilfen/ilka-musterfassung.md)); Plan `plaene/management-summary-ilka.json` mit einer Variante je KI-Profil, Ausführung mit `evaluation/abnahmen/kurzfassung.lauf.ts` (nur auf Auftrag)
- `bewertungshilfen/`: fallbezogene Hilfen zur fachlichen Bewertung, die Muss-Punkte ergänzen, aber keine Sollwerte des Lagenradars festlegen; bisher [Orkantief „Ilka“](bewertungshilfen/orkantief-ilka.md) mit Zählregeln, offenen Achsen, Tendenz und Prüfliste der Abdeckung (Entwurf zur fachlichen Abnahme)
- `ergebnisse/`: zusammengefasste Bewertungen; Laufprotokolle und Rohantworten bleiben außerhalb des öffentlichen Repositorys
- Vergleichslauf Ilka in der App (seit 0.5.8, „Einstellungen → Modelle & Verarbeitung“): dieselbe Reihe wie das Abnahmeskript M4 mit der gewählten Konfiguration oder einer Variante der Pläne `plaene/standardprofile-ilka.json` und `plaene/anbietermix-ilka.json`, Ergebnis als ZIP mit Reihendatei `ki-lead-abnahme/1` (`quelle: "app"`, Kennzahlen und Plausibilitätsbefunde je Lauf) und Übersicht als CSV; Auswertung mehrerer ZIP-Dateien gegen den Bezug Anthropic mit `npm run vergleichslauf:auswerten -- <ZIP-Dateien>`. Die Laufprotokolle bleiben außerhalb des Repositorys. Ergebnis des Plans `standardprofile-ilka` (Standard-Profile je Anbieter, App-Vorgabe der Verdichtung): [abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md](abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md); dort im Nachtrag auch die Auswertung je Stufe, aus der der Plan `plaene/anbietermix-ilka.json` (Anbieter je Stufe gemischt, seit 0.5.11 in der App wählbar) hervorgeht
- `abnahmen/`: technische Abnahmen der Meilensteine mit echten KI-Läufen (Laufskript, eigene Vitest-Konfiguration, Ergebnis); nie Teil von `npm test`. Dort steht auch das Ergebnis der Erprobung im Testkreis (M6); Plan und Regeln der Erprobung: [docs/ERPROBUNG.md](../docs/ERPROBUNG.md)
- `befunde/`: Befundregister – Entscheidungsstand der Befunde aus den automatisierten Prüfläufen (umgesetzt, abgelehnt, zurückgestellt, überholt), damit spätere Läufe Bekanntes nicht erneut vorlegen; siehe [befunde/README.md](befunde/README.md)
- `pruefsteine/`: KI-Meldungen aus dem wöchentlichen Erfassungstest zu realen Lagen, unverändert und mit Begleitnotiz (Regelwerksstand, Einstufung, bekannte Mängel); Prüfsteine für spätere Fassungen der LEAD-Systematik, keine Musterlösungen; siehe [pruefsteine/README.md](pruefsteine/README.md)

`tests/evaluation/` prüft nur, dass Fälle, Ergebnisse, das Befundregister und die Prüfsteine ihren Schemata entsprechen. Es ruft keine KI auf.

## Ablauf einer Bewertung

1. **Plan vor dem ersten Lauf festlegen:** Fall, Varianten (Modell und Aufwand je Stufe), Wiederholungen, Budgetgrenze. Änderungen nur als neue Planfassung. Vorbild ist die Testreihe vom 20./21.10.2026 (3 × 3 Varianten S1 × S2, Wiederholungen einer Zelle, Kontrolle mit PDF-Material).
2. **Läufe ausführen** mit denselben Pipeline-Funktionen wie die App (`stufe1`, `stufe2und3`); jedes Laufprotokoll im App-Format `ki-lead-lauf/1` sichern.
3. **Blind bewerten:** Die Entwürfe werden ohne Modell, Aufwand und Kosten vorgelegt (zufällige Kennungen). Je Entwurf eine Bewertung nach `bewertungsschema.json`; unbelegte Aussagen werden einzeln aufgeführt, notwendige Korrekturen nach Art (`korrekturen`), die tatsächliche Dauer der Nacharbeit (`bearbeitungsdauer_min`) und was offen bleibt (`verbleibende_unsicherheiten`). Wer Modellidentitäten oder Ergebnisse kennt, bewertet nicht als vollständig blind (`verblindung: "teilweise"`). Vorbild: [Blindbewertung Ilka](plaene/2026-10-25-blindbewertung-ilka.md).
4. **Mehrere Kodierungen derselben Lage vergleichen** (Wiederholungen, Varianten, mehrere Personen): `npm run vergleich:mehrfach -- <ordner> [--fall <id>]` gibt je Sachverhalt und Achse Werte, Median, Spannweite, Paare mit höchstens einer Stufe Abstand und, mit `--fall`, Treffer der erwarteten Radarwerte aus; dazu Krippendorffs Alpha (ordinal) je Achse über die Sachverhalte als Einheiten. Liegen die Meldungen in Unterordnern je Lage, gehen alle Lagen in Alpha ein; mit nur einer Lage und einem Sachverhalt entfällt Alpha. Der Ordner liegt unter `privat/` oder außerhalb des Repositorys.
5. **Auflösen und zusammenfassen:** erst danach Kennungen den Varianten zuordnen, Mittelwerte und Spannen je Variante bilden, Kosten und Dauer aus den Laufprotokollen übernehmen. Die Gesamtnote ist ein eigenes, ganzheitliches Urteil und kein Mittelwert der Kriterien.
6. **Entscheidung dokumentieren:** Änderungen an Vorgaben (`src/pipeline/einstellungen.ts`) oder an den Messwerten der Schätzung (`src/pipeline/schaetzung.ts`) nur mit Verweis auf die Ergebnisse.

## Muss-Punkte, Zuschnitt und Abdeckung

- **Muss-Punkte sind keine Qualitätsnote.** Sie prüfen, ob Kernaussagen vorkommen. Ob eine Aussage fachlich trägt, etwa ob Teilwerte addiert werden dürfen, entscheidet die Bewertung nach den Regeln des Profils; fallbezogene Hilfen dazu stehen unter `bewertungshilfen/`. Ein Muss-Punkt darf nicht mehr verlangen, als die Regeln erlauben (LS-2026-W43-14).
- **Unterschiedlicher Zuschnitt:** Die automatische Zuordnung der Sachverhalte zur Redaktionsfassung ist eine Arbeitshilfe. Teilt ein Entwurf die Lage anders auf, wird die Abdeckung der Kernbefunde über alle Sachverhalte von Hand geprüft (enthalten, fehlt, doppelt, ohne Grundlage); `npm run vergleichslauf:auswerten` nennt dafür die Sachverhalte ohne Gegenstück. Ein anderer Zuschnitt ist kein Mangel, und Radarwerte verschiedener Sachverhalte werden nicht zu einem gemeinsamen Radar verrechnet (LS-2026-W43-16).
- **Gesamtkette und einzelne Stufe:** S2 übernimmt die Gliederung aus S1. Ein Vergleich mit S1 und S2 je Variante (etwa `plaene/standardprofile-ilka.json`) misst die Gesamtkette; die Zahl der Sachverhalte misst dort S1. Für die Verdichtung allein erhalten alle Varianten denselben festen S1-Gegenstand (`s1_fest` im Plan, Datei unter `material/` mit Prüfsumme; Ausführung über das Abnahmeskript mit `KI_LEAD_S1_FEST`), siehe `plaene/s2-isoliert-ilka.json` (LS-2026-W43-15).
- **Entwicklungssatz und Kontrollsatz:** Fälle, an denen Regeln entwickelt wurden, zeigen keine Übertragbarkeit. Für Kontrollen wird ein neu verfasster, bis zum Kontrolllauf zurückgehaltener Kontrollsatz verwendet; Verfahren: [plaene/2026-10-25-kontrollsatz.md](plaene/2026-10-25-kontrollsatz.md) (LS-2026-W43-19).

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

- Lizenz: CC BY 4.0, die JSON-Schemata (`*.schema.json`) zusätzlich CC0 1.0, siehe [LICENSE-CONTENT](../LICENSE-CONTENT) (Nr. 1b, 2b).
- Keine Volltexte urheberrechtlich geschützter Artikel im Repository, auch nicht in Fällen oder Ergebnissen. Fälle verweisen auf die URL und halten eine Prüfsumme (`sha256`) des verwendeten Materials fest; wer den Lauf wiederholt, beschafft das Material selbst. Muss Material zwischen Läufen weitergegeben werden, dann nur verschlüsselt.
- Prüfsteine zu realen Lagen stützen sich nur auf öffentlich zugängliche, vorrangig amtliche Quellen in eigenen Worten und sind als KI-Entwurf ohne amtlichen Charakter gekennzeichnet (Test).
- Öffentliche Fälle verwenden fiktive oder offen zugängliche Inhalte (etwa den fiktiven Datensatz Orkantief „Ilka“ unter `profile/lead-beispiel/beispiele/`).
- Organisationsspezifische Profile, echte Meldungen und Laufprotokolle mit internen Inhalten bleiben im nicht eingecheckten Ordner `privat/`.
- API-Schlüssel stehen nie in Fällen, Ergebnissen, Protokollen oder Skripten; Läufe lesen sie aus der Umgebung oder aus einem Secret.

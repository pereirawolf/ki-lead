# KI-LEAD – Barrierefreiheit

Fassung 1.3 vom 29.10.2026, gilt für App-Version 0.6.7 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Aufgebaut wie eine Erklärung zur Barrierefreiheit. KI-LEAD ist ein Forschungsdemonstrator; eine gesetzliche Pflicht zu dieser Erklärung besteht nicht (Abschnitt 6). Keine Rechtsberatung.

---

## 1. Geltungsbereich

Diese Erklärung gilt für die Web-App KI-LEAD (auch als installierte PWA, `https://pereirawolf.github.io/ki-lead/`) in Version 0.6.5. Die Apps für iOS und Android verwenden dieselbe Oberfläche; sie sind noch nicht auf Geräten geprüft.

## 2. Stand der Vereinbarkeit

KI-LEAD beansprucht **keine Konformität** mit der WCAG 2.2, der EN 301 549 oder der BITV 2.0. Einzelne Anforderungen sind umgesetzt und automatisiert geprüft (Abschnitt 3); bekannte Lücken stehen in Abschnitt 4.

Die Bewertung ist eine Selbstbewertung des Herausgebers. Eine Prüfung durch Dritte und eine Prüfung mit Menschen mit Behinderungen haben nicht stattgefunden.

## 3. Was umgesetzt und geprüft ist

| Bereich | Umsetzung | Beleg |
|---|---|---|
| Kontraste | Text mindestens 4,5:1, Bedienelemente und Konturen mindestens 3:1 in allen Farbschemata, auch für Profilfarben | [farbschemas.md](farbschemas.md); `tests/darstellung/farbschemas.test.ts` |
| Kontrastschemata | „Kontrast · Hell“ und „Kontrast · Dunkel“ mit mindestens 7:1 für Text | [farbschemas.md](farbschemas.md) |
| Systemeinstellungen | erzwungene Systemfarben gehen vor; „mehr Kontrast“ wählt bei „Automatisch“ das Kontrastschema | [farbschemas.md](farbschemas.md); Browsertest `barrierefreiheit.spec.ts` |
| Nicht nur Farbe | Auswahl, Reiter und Radarstufen zusätzlich unterstrichen; Bewertungen immer als Wort | [farbschemas.md](farbschemas.md) |
| Automatische Prüfung | axe-core prüft je Bereich alle Schritte der Meldung, Auftrag und Bestätigung der KI-Erfassung, alle Reiter des Lagebilds mit Beispiel samt Übergabedialog, Profile und alle Bereiche der Einstellungen gegen die Regeln zu WCAG 2.0, 2.1 und 2.2, Stufen A und AA; breit und hell sowie 390 px breit und dunkel; keine Ausnahmen (seit 0.6.5, TP-2026-W44-22) | Browsertest `barrierefreiheit.spec.ts` |
| Zugängliche Namen | alle Bedienelemente je Bereich mit zugänglichem Namen, vom Browser berechnet; seit 0.6.5 je Liste eindeutig (etwa „Lauf 2 vom … löschen“, „Kopieren: “ mit der Kennung des Sachverhalts) und mit dem sichtbaren Text am Anfang (TP-2026-W44-14, -22) | Browsertest `barrierefreiheit.spec.ts` |
| Statusmeldungen | Die Laufanzeige sagt Stufe, Protokollschritte und Ende über eine eigene Statusregion an, höchstens alle 5 s; der Sekundenzähler steht außerhalb jeder Live-Region (seit 0.6.5, TP-2026-W44-12) | Browsertest `barrierefreiheit.spec.ts` |
| Fokusführung | nach einem Phasenwechsel der KI-Erfassung und beim Schrittwechsel der Meldung liegt der Fokus auf der neuen Überschrift; der Übergabedialog im Lagebild übernimmt den Fokus, schließt mit Escape und gibt ihn an den Auslöser zurück; Rückfragen in einem modalen Dialog mit Fokus zuerst auf „Abbrechen“ statt `window.confirm` (seit 0.6.5, TP-2026-W44-13, -20). Seit 0.6.7 gilt das für „Weiter: …“ und „Zurück: …“ der Meldung tatsächlich (bis 0.6.6 blieb der Fokus dort am Knopf), außerdem für Bereichswechsel aus einem Bereich der Einstellungen heraus, Übernahmen in die Maske und Einträge, die hinzukommen oder entfallen; Knöpfe, die stehen bleiben (Schritt-, Bereichs- und Reiterleiste, Hauptnavigation), behalten den Fokus | Browsertests `hauptablauf.spec.ts`, `sprungziele.spec.ts`; `tests/ui/sprungziele.test.ts` |
| Sprungziele | nach einem Wechsel von Schritt, Phase, Bereich, Reiter oder Ansicht steht der Anfang des neuen Inhalts unter dem mitlaufenden Kopf, nicht verdeckt und ohne Animation; die KI-Erfassung kehrt an die zuletzt gesehene Stelle zurück (seit 0.6.7; WCAG 2.4.3 Fokus-Reihenfolge, 2.4.11 Fokus nicht verdeckt) | Browsertest `sprungziele.spec.ts` (breit und 390 px) |
| Aktuelle Stelle | Hauptnavigation, Bereiche der Einstellungen und Reiter des Lagebilds einheitlich mit `aria-current="page"` (bisher `"true"` bzw. `aria-pressed`), Schrittfolgen mit `"step"` (seit 0.6.5, TP-2026-W44-14) | `tests/ui/einstellungen.test.ts`, Browsertest `einstellungen.spec.ts` |
| Fehler am Feld | Schema- und Pflichtbefunde stehen am Feld mit `aria-invalid` und per `aria-describedby` verknüpftem Fehlertext; ein Befund im Prüfschritt springt zum Feld und fokussiert es (seit 0.6.5, TP-2026-W44-15) | `tests/ui/erfassung.test.ts` |
| Scrollbare Bereiche | Tabellen, Kopiervorlagen, Stufen und Ereignisse, die waagerecht oder senkrecht scrollen, sind fokussierbar und benannt (seit 0.6.5, TP-2026-W44-22) | Browsertest `barrierefreiheit.spec.ts` (axe) |
| Tastatur | Bedienung mit der Tastatur und sichtbarem Fokus; LEAD-Eingabehilfen mit der Tastatur | Browsertests `barrierefreiheit.spec.ts`, `eingabehilfen.spec.ts` |
| Lagenradar als Text | die Grafik nennt alle Achsenwerte einschließlich „offen“ im zugänglichen Namen | `src/ui/Radar.tsx` |
| Lagenradar bedienen | je Achse eine Radiogruppe nach dem Muster der WAI-ARIA Authoring Practices: Optionen mit Rolle `radio` und Namen wie „Stufe 2: regional“, ein Tabstopp je Achse, Pfeiltasten wählen um, Pos1 und Ende springen (seit 0.5.4) | `tests/ui/radar-tastatur.test.ts` |
| Schrift | Atkinson Hyperlegible, gebündelt; Größen in `rem`, folgen damit der Schriftgröße des Browsers (seit 0.6.5, TP-2026-W44-14) | `package.json`, `src/styles/basis.css` |
| Zielgrößen | kleine Knöpfe mindestens 24 × 24 CSS-Pixel (WCAG 2.5.8), bei Bedienung mit dem Finger 44 Pixel hoch (seit 0.6.5, TP-2026-W44-14) | Browsertest `barrierefreiheit.spec.ts` (axe `target-size`) |
| Bewegung | bei „Bewegung reduzieren“ keine Übergänge und Animationen, seit 0.6.5 auch kein weiches Scrollen (TP-2026-W44-14) | `src/ui/bewegung.ts` |

Grundlage der Prüfungen: [docs/TESTS.md](TESTS.md).

## 4. Bekannte Lücken

- **Lagenradar in der Meldungsmaske:** seit 0.5.4 als Radiogruppe bedienbar (Abschnitt 3). Ungeprüft ist, wie Screenreader die Gruppe ankündigen. Die Pfeiltasten wählen sofort um; wer nur durchsehen will, ändert dabei den Wert.
- **Screenreader:** nicht mit NVDA, JAWS, VoiceOver oder TalkBack geprüft; geprüft sind die vom Browser berechneten Namen und die Regeln von axe-core. Automatische Prüfungen finden nach gängiger Schätzung nur einen Teil der Barrieren.
- **PDF-Ausgaben:** Die PDFs (Meldung, Lagebild) haben keine Tags und keine Lesereihenfolge; seit 0.5.4 tragen sie Dokumentsprache und Titel. Sie sind nicht barrierefrei. Zeichen außerhalb der PDF-Standardschrift werden ersetzt, etwa „→“ durch „->“.
- **Kopiervorlage für Word:** Das Radarbild hat als Alternativtext nur die Bezeichnung; die Werte stehen als Text daneben.
- **Darstellung:** nicht geprüft sind Windows-Kontrastdesign am echten Gerät, Simulation von Farbsehschwächen, 200 % Vergrößerung und 320 Pixel Breite (Umbruch nach WCAG 1.4.10); axe-core prüft bei 390 Pixel Breite ([farbschemas.md](farbschemas.md), „Offen“).
- **Safari:** Die Kerntests laufen seit 0.6.5 in der CI auch in WebKit; die Barrierebäume von Safari und VoiceOver sind damit nicht geprüft.
- **Native Apps:** nicht auf Geräten geprüft, auch nicht mit den Bedienungshilfen der Systeme.

Barrierefreie Alternative: Alle Inhalte einer Meldung lassen sich als JSON und CSV ausgeben und mit eigenen Hilfsmitteln lesen.

## 5. Rückmeldung

Barrieren bitte über ein [Issue im Repository](https://github.com/pereirawolf/ki-lead/issues/new/choose) melden (Vorlage „Barrierefreiheit“). Hilfreich sind die betroffene Ansicht, das Hilfsmittel (etwa Screenreader und Browser) und was nicht ging. Issues sind öffentlich; bitte keine Angaben zur eigenen Gesundheit oder Behinderung machen, die nicht öffentlich sein sollen.

Eine Schlichtungsstelle gibt es für dieses private Vorhaben nicht.

## 6. Rechtliche Einordnung

- **Barrierefreiheitsstärkungsgesetz (BFSG):** Es gilt für bestimmte Produkte und für bestimmte Dienstleistungen, die für Verbraucher erbracht werden: Telekommunikationsdienste, Elemente der Personenbeförderung, Bankdienstleistungen, E-Books und Dienstleistungen im elektronischen Geschäftsverkehr (§ 1 Abs. 3 BFSG). KI-LEAD ist ein unentgeltliches Forschungsvorhaben, richtet sich nicht an Verbraucher und fällt unter keine dieser Kategorien. Das BFSG ist deshalb nicht einschlägig.
- **BITV 2.0 und EN 301 549:** Die Barrierefreie-Informationstechnik-Verordnung gilt für Websites und mobile Anwendungen öffentlicher Stellen; sie verweist für die Anforderungen auf harmonisierte Normen (§ 3 BITV 2.0), in der Praxis die EN 301 549. Für KI-LEAD als privates Vorhaben gilt sie nicht. Relevant wird sie, wenn eine Behörde KI-LEAD selbst bereitstellt. Dann trifft die Pflicht zur Barrierefreiheit und zur Erklärung nach § 7 BITV 2.0 diese Stelle; das vorliegende Dokument kann dafür nur Vorarbeit sein.

---

## Quellen

- Bundesamt für Justiz (o. J.): Barrierefreiheitsstärkungsgesetz (BFSG), § 1. Online abrufbar unter: https://www.gesetze-im-internet.de/bfsg/__1.html [Zugriff: 24.10.2026]
- Bundesamt für Justiz (o. J.): Barrierefreie-Informationstechnik-Verordnung (BITV 2.0). Online abrufbar unter: https://www.gesetze-im-internet.de/bitv_2_0/BJNR184300011.html [Zugriff: 24.10.2026]

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.3 | 29.10.2026 | Sprungziele und Fokusführung nach Schritt-, Bereichs-, Reiter- und Ansichtswechsel (App 0.6.7) |
| 1.2 | 27.10.2026 | Statusregion der Laufanzeige, Fokusführung, eindeutige Namen, `aria-current`, Schrift in rem, Zielgrößen, Fehler am Feld, Rückfragedialog, fokussierbare Scrollbereiche, axe-core je Bereich (App 0.6.5; TP-2026-W44-12 bis -15, -20, -22) |
| 1.1 | 24.10.2026 | Lagenradar als Radiogruppe; PDF mit Dokumentsprache und Titel (App 0.5.4) |
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |

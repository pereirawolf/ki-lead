# KI-LEAD – Barrierefreiheit

Fassung 1.0 vom 24.10.2026, gilt für App-Version 0.5.3 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Aufgebaut wie eine Erklärung zur Barrierefreiheit. KI-LEAD ist ein Forschungsdemonstrator; eine gesetzliche Pflicht zu dieser Erklärung besteht nicht (Abschnitt 6). Keine Rechtsberatung.

---

## 1. Geltungsbereich

Diese Erklärung gilt für die Web-App KI-LEAD (auch als installierte PWA, `https://pereirawolf.github.io/ki-lead/`) in Version 0.5.3. Die Apps für iOS und Android verwenden dieselbe Oberfläche; sie sind noch nicht auf Geräten geprüft.

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
| Zugängliche Namen | alle Bedienelemente je Bereich mit zugänglichem Namen, von Chromium berechnet | Browsertest `barrierefreiheit.spec.ts` |
| Tastatur | Bedienung mit der Tastatur und sichtbarem Fokus; LEAD-Eingabehilfen mit der Tastatur | Browsertests `barrierefreiheit.spec.ts`, `eingabehilfen.spec.ts` |
| Lagenradar als Text | die Grafik nennt alle Achsenwerte einschließlich „offen“ im zugänglichen Namen | `src/ui/Radar.tsx` |
| Schrift | Atkinson Hyperlegible, gebündelt | `package.json` |

Grundlage der Prüfungen: [docs/TESTS.md](TESTS.md).

## 4. Bekannte Lücken

- **Lagenradar in der Meldungsmaske:** Die Stufen einer Achse stehen in einer Gruppe mit der Rolle `radiogroup`, sind aber Schaltflächen mit `aria-pressed` statt Optionen mit der Rolle `radio`. Screenreader kündigen deshalb Widersprüchliches an. Pfeiltasten wechseln die Stufe nicht; jede Stufe ist ein eigener Tabstopp, bei acht Achsen rund 60 (`src/ui/Radar.tsx`).
- **Screenreader:** nicht mit NVDA, JAWS, VoiceOver oder TalkBack geprüft; geprüft sind nur die von Chromium berechneten Namen.
- **PDF-Ausgaben:** Die PDFs (Meldung, Lagebild) haben keine Tags, keine Dokumentsprache und keinen Titel in den Dokumenteigenschaften. Sie sind nicht barrierefrei. Zeichen außerhalb der PDF-Standardschrift werden ersetzt, etwa „→“ durch „->“.
- **Kopiervorlage für Word:** Das Radarbild hat als Alternativtext nur die Bezeichnung; die Werte stehen als Text daneben.
- **Darstellung:** nicht geprüft sind Windows-Kontrastdesign am echten Gerät, Simulation von Farbsehschwächen, 200 % Vergrößerung und 320 Pixel Breite ([farbschemas.md](farbschemas.md), „Offen“).
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
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |

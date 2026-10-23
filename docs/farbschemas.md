# Farbschemata der Oberfläche

Stand 21.10.2026, App 0.4.22. Die Farbschemata ändern nur die Bildschirmdarstellung. Signalfarben der Bewertungen (geringfügig, erheblich, kritisch, Entspannung) und das Lagenradar hängen nur von der Semantikbasis ab (hell, dunkel, Kontrast hell, Kontrast dunkel), nie vom Land oder vom Profil. Ihre Bedeutung und Bezeichnung bleiben in allen Schemata gleich. PDF, Word-Kopiervorlage, Canvas-Radar und andere Ausgaben behalten ihre eigene, helle Gestaltung.

## Grundsätze

- **Wiedererkennbarkeit vor CI-Genauigkeit.** Die Paletten greifen Landes- bzw. CI-Farben auf. Flächen, Hover-, Link- und Auswahlfarben sind für die Lesbarkeit abgeleitet. Eine amtliche Freigabe oder vollständige CI-Konformität wird nicht beansprucht; Wappenfarben (z. B. nach Wikipedia/Wikimedia Commons) oder plausible Annäherungen sind als Ausgangslage zulässig.
- **Helle Arbeitsfläche, Identitätsband.** Alle Bund- und Länderschemata sind hell; die Landesfarben erscheinen im Band unter dem Kopf (8 px, seit 0.5.1; vorher 4 px) und in den Aktionsfarben, nicht großflächig. Ist eine Bandfarbe dieselbe Farbe wie der Kopf darüber oder der Seitengrund darunter (Abstand je Farbkanal höchstens 16, praktisch: Weiß im Band), tönt die App Kopf und Seitengrund ganz leicht in der Aktionsfarbe (7 bzw. 6 Prozent), damit das Weiß im Band als eigene Farbe sichtbar bleibt. Das betrifft Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen, Nordrhein-Westfalen, Sachsen, Schleswig-Holstein und Thüringen sowie Profilfarben mit weißer Akzentfarbe; helle Gelbtöne (etwa Baden-Württemberg, Bund) gelten nicht als gleiche Farbe. Neutral- und Kontrastschemata bleiben unverändert. Dunkel sind „Neutral · Night Mode“ und „Kontrast · Dunkel“.
- **Kontraste.** Text mindestens 4,5:1, Konturen und Bedienelemente mindestens 3:1. Die Paare stehen in `src/darstellung/thema.ts` (`KONTRASTPAARE`) und werden für jedes Schema getestet (`tests/darstellung/farbschemas.test.ts`). Dieselbe Prüfung gilt für Profilfarben.
- **Kontrastschemata.** „Kontrast · Hell“ und „Kontrast · Dunkel“ verlangen für alle Textpaare (einschließlich der Signalfarben) mindestens 7:1 (WCAG 2.2, Erfolgskriterium 1.4.6), Konturen weiterhin mindestens 3:1. Sie haben kein dekoratives Band, eigene feste Signalpaletten gleicher Bedeutung, ein Radar ohne Füllung und kräftigere Rahmen (`data-kontrast="erhoeht"`). Ein Profil mit Kontrastbasis unterliegt ebenfalls 7:1. In den Kontrastschemata sind die Signalfarben nach Schwere nur leicht in der Helligkeit gestuft (kritisch am kräftigsten) und unterscheiden sich vor allem im Farbton; maßgeblich sind dort Wort, Zahl und Kontur. Eine WCAG- oder BITV-Konformität der App wird damit nicht beansprucht.
- **Nicht nur Farbe.** Ausgewählte Navigation, Reiter, Optionen in Auswahlfeldern und Radarstufen sind zusätzlich unterstrichen (im Kontrastschema gewählte Bewertungen außerdem mit Innenrahmen); Bewertungen stehen immer als Wort da; das Lagenradar nennt alle Achsenwerte einschließlich „offen“ im zugänglichen Namen.
- **Systemeinstellungen gehen vor.** Bei erzwungenen Systemfarben (`forced-colors`, z. B. Kontrastdesign von Windows) übernimmt das System die Farben; die App hebt nur Auswahl, Marken und Radar mit Systemfarben hervor und schaltet die Systemfarben nirgends global ab. Ist „Automatisch“ gewählt und im System „mehr Kontrast“ eingestellt (`prefers-contrast: more`), verwendet die App das passende Kontrastschema (hell oder dunkel nach System); eine ausdrückliche Wahl bleibt davon unberührt, „weniger“ oder „benutzerdefiniert“ lösen nichts aus.

## Katalog

| Kennung | Name | Landes- bzw. Bezugsfarben | Aktionsfarbe | Band | Ausgangslage | Einschätzung |
|---|---|---|---|---|---|---|
| `neutral-hell` | Neutral · Hell | – | `#3D4A59` | `#6B7785` | eigener Entwurf | eigener Entwurf ohne Landesbezug. |
| `neutral-dunkel` | Neutral · Night Mode | – | `#B6C0CB` | `#83909E` | eigener Entwurf | eigener Entwurf ohne Landesbezug, dunkles Schema (Night Mode); für besonders deutlichen Text siehe „Kontrast · Dunkel“. |
| `kontrast-hell` | Kontrast · Hell | – | `#000000` | – (kein Band) | eigener Entwurf, nach WCAG 2.2 berechnet | neu: Schwarz auf Weiß, Nebentext `#404040` (10,4:1), Link und Fokus `#003399` (10,9:1), Signalfarben `#665200`, `#8A3300`, `#8B0000`, `#00592E` (7,6:1 bis 10,0:1), Konturen `#555555` (7,5:1), Auswahlfläche `#E6E6E6`. |
| `kontrast-dunkel` | Kontrast · Dunkel | – | `#FFFFFF` | – (kein Band) | eigener Entwurf, nach WCAG 2.2 berechnet | neu: Weiß auf Schwarz, Nebentext `#CCCCCC` (13,1:1), Link `#99CCFF` (12,4:1), Fokus `#FFDD55` (15,7:1), Signalfarben `#FFD24D`, `#FFA866`, `#FF9999`, `#80E0A0` (10,3:1 bis 14,6:1), Konturen `#B3B3B3` (10,0:1), Auswahlfläche `#333333`. |
| `bund` | Bund · Schwarz–Rot–Gold | Schwarz-Rot-Gold | `#000000` | `#000000` `#FF0000` `#FFCC00` | CI-Farbwerte belegt | stimmig: Nationalfarben im Band, Schwarz als zurückhaltende Aktionsfarbe wie im Bundes-Styleguide. |
| `bevoelkerungsschutz` | Bevölkerungsschutz · BBK | Zivilschutzzeichen: blaues Dreieck auf Orange | `#1D4F91` | `#E75B12` `#1D4F91` `#E75B12` | an RAL-Farben des Zivilschutzzeichens angenähert | neu: Orange und Blau des Zivilschutzzeichens; Orange nur im Band, damit es nicht mit der Signalfarbe „erheblich“ verwechselt wird. |
| `de-bw` | Baden-Württemberg | Schwarz-Gold | `#2A2623` | `#2A2623` `#FFFC00` | Farbwerte des Landesportals | stimmig: Schwarz und Gelb des Landes-CD (seit 2024); Gelb nur im Band, weil es als Text nicht lesbar ist. |
| `de-by` | Bayern | Weiß-Blau | `#006896` | `#008DC9` `#FFFFFF` | CI-Farbwerte belegt | stimmig: Weiß-Blau; das Bayerisch Blau ist für Text abgedunkelt. |
| `de-be` | Berlin | Rot-Weiß | `#E40422` | `#E40422` `#FFFFFF` `#000000` | CI-Farbwerte belegt | stimmig: Berliner Rot; knapp über 4,5:1 für Text auf der Aktionsfarbe. |
| `de-bb` | Brandenburg | Rot-Weiß | `#C13B33` | `#C13B33` `#FFFFFF` | CI-Farbwerte belegt | stimmig: Brandenburger Rot. |
| `de-hb` | Bremen | Rot-Weiß | `#AB2600` | `#AB2600` `#FFFFFF` | CI-Farbwerte belegt | stimmig: Rot-Weiß (Speckflagge). |
| `de-hh` | Hamburg | Rot-Weiß | `#E10019` | `#E10019` `#FFFFFF` `#003063` | Farbwerte des Landesportals | stimmig: Hamburger Rot, Blau des Webauftritts im Band. |
| `de-he` | Hessen | Rot-Weiß | `#14006E` | `#E12D37` `#FFFFFF` `#F5E6D2` | aus Bildmaterial angenähert | Annäherung: Landesfarben Rot-Weiß im Band, dunkles Blau aus dem Wappenschild als Aktionsfarbe; Werte aus Bildmaterial, keine CI-Tabelle. |
| `de-mv` | Mecklenburg-Vorpommern | Blau-Weiß-Gelb-Weiß-Rot | `#005E90` | `#005E90` `#0CA0D9` `#F2B700` `#AA192B` | CI-Farbwerte belegt | stimmig: Wasserblau und die Farben der Landesflagge. |
| `de-ni` | Niedersachsen | Schwarz-Rot-Gold (Landeswappen) | `#E40036` | `#000000` `#E40036` `#FFCC00` | CI-Farbe indirekt belegt | stimmig: Niedersachsen-Rot der CI; Band mit Schwarz-Rot-Gold der Landesflagge. |
| `de-nw` | Nordrhein-Westfalen | Grün-Weiß-Rot | `#007A2E` | `#009036` `#FFFFFF` `#E2001A` | CI-Farbwerte belegt | stimmig: NRW-Grün (für Text abgedunkelt), Band Grün-Weiß-Rot. |
| `de-rp` | Rheinland-Pfalz | Schwarz-Rot-Gold (Landeswappen) | `#871D33` | `#000000` `#871D33` `#FFCC00` | CI-Farbwerte belegt | stimmig: Weinrot der Landes-CI; Band Schwarz-Rot-Gold der Landesflagge. |
| `de-sl` | Saarland | Schwarz-Rot-Gold (Landeswappen) | `#002F5C` | `#000000` `#D00028` `#E5BC32` | CI-Farbwerte belegt | stimmig: Saar-Blau der CI; Band Schwarz-Rot-Gold der Landesflagge. |
| `de-sn` | Sachsen | Weiß-Grün | `#008444` | `#FFFFFF` `#008444` `#FFDC00` | CI-Farbwerte belegt | stimmig: Sachsengrün; Band Weiß-Grün mit Gelb aus dem Wappen. |
| `de-st` | Sachsen-Anhalt | Gelb-Schwarz | `#303431` | `#FBBA00` `#303431` | Farbwerte des Landesportals | stimmig: Gelb und Dunkelgrau des Landesportals; Gelb nur im Band. |
| `de-sh` | Schleswig-Holstein | Blau-Weiß-Rot | `#003064` | `#003064` `#FFFFFF` `#D4004B` | CI-Farbwerte belegt | stimmig: Blau-Weiß-Rot. |
| `de-th` | Thüringen | Weiß-Rot | `#006F9C` | `#0089C1` `#FFFFFF` `#D62B32` | CI-Farbwerte belegt | stimmig: Thüringen-Blau des Landesauftritts (für Text abgedunkelt), Band mit Weiß-Rot der Landesfarben. |

Zusätzlich: **Automatisch** (Vorgabe: „Neutral · Hell“ oder „Neutral · Night Mode“ nach Systemeinstellung, bei „mehr Kontrast“ das passende Kontrastschema; seit 0.4.22 ohne eigene, davon abweichende Farben) und **Farben des aktiven Profils**.

## Barrierefreiheit: geprüfte Vorschläge

Grundlage: Änderungsvorschläge „2026-10-20_KI-LEAD_Barrierefreiheit_Farbschemas_Aenderungsvorschlaege_65c278b“ (A11Y-01 bis A11Y-07) und die allgemeinen Anforderungen der WCAG 2.2: Erfolgskriterien 1.4.1 (nicht nur Farbe), 1.4.3 (Textkontrast 4,5:1), 1.4.11 (Kontrast von Bedienelementen und Grafiken 3:1) und, als zusätzliches Ziel der Kontrastschemata, 1.4.6 (Textkontrast 7:1, Stufe AAA). Die ersten drei gehören zur Stufe AA, auf die die BITV 2.0 über die EN 301 549 verweist. Die Farbwerte der Kontrastschemata sind eigene Festlegungen: Graustufen und je ein dunkler bzw. heller Ton pro Signalfarbe, rechnerisch gegen die Kontrastziele geprüft. Paletten, Bezeichnungen oder Gestaltungsvorgaben von Unternehmen oder Designsystemen werden nicht übernommen.

- **Umgesetzt:** zwei Kontrastschemata (s. o.), Vorrang der Systemfarben, „mehr Kontrast“ bei „Automatisch“, Auswahl nicht nur über Farbe, Radarwerte als Text.
- **Keine fremde Fünffarbenpalette als Oberflächenschema.** Eine vorgeschlagene qualitative Palette für Farbsehschwächen ist für voneinander unabhängige Datenreihen gedacht, nicht für Oberflächenrollen. Ihre hellste Farbe erreicht auf Weiß nur 1,8:1, keine ihrer Farben 7:1; für die geordneten Schwereklassen fehlt ihr die Helligkeitsstufung. Für künftige Diagramme mit mehreren unabhängigen Reihen gilt deshalb die allgemeine Regel: eigene, geprüfte Farben, immer zusammen mit sichtbarer Beschriftung, Marker oder Linienmuster und einer Kontur mit mindestens 3:1.
- **Keine Themen je Farbsehschwäche.** Nach WCAG 2.2, Erfolgskriterium 1.4.1, darf Information nicht allein über Farbe vermittelt werden (das gilt für Protanopie, Deuteranopie und Tritanopie gleichermaßen). Ein „Protanopie-Theme“ würde eine Sicherheit versprechen, die eine Palette allein nicht liefert; die App setzt stattdessen auf Wörter, Unterstreichung, Konturen und Zahlen in jedem Schema.
- **Offen (Abnahme):** Sichtprüfung mit echtem Kontrastdesign unter Windows, Simulation von Farbsehschwächen und Graustufen, 200 % Zoom und 320 px Breite, nach Möglichkeit mit Betroffenen. Automatisiert geprüft sind Kontrastwerte, Auflösung, Stylesheet-Regeln und Radarbeschreibung; bei der Erstellung von 0.4.18 im Browser (Chromium mit Playwright) gesichtet wurden beide Kontrastschemata, „mehr Kontrast“ hell und dunkel sowie emulierte Systemfarben.

## Quellen

- Kontrast · Hell und Dunkel: [WCAG 2.2: Contrast (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html); [WCAG 2.2: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [WCAG 2.2: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html); [WCAG 2.2: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html); [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors); [MDN: prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast)
- Bund · Schwarz–Rot–Gold: [Styleguide Bundesregierung: Farben](https://styleguide.bundesregierung.gov.de/sg-de/basiselemente/farben)
- Bevölkerungsschutz · BBK: [https://www.gesetze-bayern.de/Content/Document/BayVwV96933](https://www.gesetze-bayern.de/Content/Document/BayVwV96933); [https://warnung-der-bevoelkerung.de/wp-content/uploads/2025/12/Katastrophenschutz-Leuchttuerme_Setzhinweise_fuer_Piktogramme.pdf](https://warnung-der-bevoelkerung.de/wp-content/uploads/2025/12/Katastrophenschutz-Leuchttuerme_Setzhinweise_fuer_Piktogramme.pdf)
- Baden-Württemberg: [Neues Landes-CD und aktuelle Webimplementierung Baden-Württemberg](https://www.baden-wuerttemberg.de/de/service/alle-meldungen/meldung/pid/baden-wuerttemberg-stellt-neues-corporate-design-vor); [Stylesheet des Landesportals Baden-Württemberg](https://assets.baden-wuerttemberg.de/versions/5.13.1/stylesheets/main.css?v=5.13.1)
- Bayern: [Designmanual StMWi Bayern, April 2021, Seite 11](https://www.stmwi.bayern.de/fileadmin/user_upload/stmwi/publikationen/pdf/2021-04-27_Designmanual_StMWi.pdf)
- Berlin: [Berlin Markenhandbuch 2025: Farbpalette, Version 1.5](https://www.berlin.de/rbmskzl/service/corporate-design/berlin_markenhandbuch_2025_farbpalette.pdf?ts=1754486468)
- Brandenburg: [Styleguide Brandenburg: Grundfarbe](https://styleguide.brandenburg.de/stylebb/de/kapitel/3-gestaltungsmittel/3-2-farben/3-2-1-grundfarbe/)
- Bremen: [Styleguide Bremen: Farben für Online-Medien](https://www.styleguide.bremen.de/online-medien/gestaltungselemente/farben-3696)
- Hamburg: [Hamburg-Logo: Senatskanzlei](https://www.hamburg.de/politik-und-verwaltung/behoerden/senatskanzlei/hamburg-logo-239048); [Stylesheet des Hamburger Landesportals](https://www.hamburg.de/resource/themes/km-i/css/km-i-5430-47.css)
- Hessen: [Hessenfarben des neuen Corporate Designs 2026](https://hessen.de/erleben/corporate-design/neues-gewand/hessenfarben); [Hessen: offizielle Abbildung der neuen Farben](https://hessen.de/sites/hessen.hessen.de/files/styles/crop_image_style_16_9_xs/public/2026-03/vorschaubilder-launch-seite-4.png?itok=nHXl914f); [Hessen: Hoheitszeichen](https://innen.hessen.de/Buerger-Staat/Hoheitszeichen/Das-Hessische-Landeswappen)
- Mecklenburg-Vorpommern: [Markenhandbuch Mecklenburg-Vorpommern: Farben](https://www.mv-tut-gut.de/markenportal/landesmarke/markenhandbuch/4-corporate-design/4-2-farben); [MV: beschriftete offizielle Farbtafel](https://www.mv-tut-gut.de/fileadmin/user_upload/bilder/marken/MV_Marke04_Farben01_neu2023.svg); [MV: Landesflagge](https://www.regierung-mv.de/service/Landessymbole/Flagge/)
- Niedersachsen: [Corporate Design ZDIN: Niedersachsen-Rot](https://zdin.digital/corporate-design); [Niedersachsen: Wappen und Flagge](https://www.niedersachsen.de/startseite/land_leute/das_land/wappen_flagge/wappen-und-flagge-19957.html)
- Nordrhein-Westfalen: [EFRE/JTF NRW: Leitfaden Kommunikation, Dezember 2024, Seite 6](https://www.efre.nrw.de/sites/default/files/media/document/file/efre_jtf_nrw_leitfaden_kommunikation_dez24_2.pdf)
- Rheinland-Pfalz: [RLP Corporate Design Internet, Farbtafel Seite 15](https://www.statistik.rlp.de/fileadmin/dokumente/berichte/RLP_CD-Manual-Internet__Stand_2016-01-03_.pdf); [Aktuelles RLP-Portalstylesheet](https://www.rlp.de/_assets/90e5b5e0fb243702058dd4a76da35c8b/Css/screen.min.css?1792047427); [Landtag Rheinland-Pfalz: Landeswappen](https://landtag-rlp.de/de/parlament/der-landtag-und-seine-aufgaben/deutschhaus-und-wappen/das-landeswappen.htm)
- Saarland: [Saarland CD-Manual Landesregierung, Version 2.2, Oktober 2016, Seite 42](https://willkommen.saarland/app/uploads/2021/11/Saarland_CD-Manual-LR_V2-2.pdf); [Saarland: Landesflagge, Hoheitszeichengesetz § 4](https://recht.saarland.de/bssl/document/jlr-HzGSLrahmen/part/X)
- Sachsen: [Markenhandbuch Sachsen 3.0, Seiten 26–28](https://www.markenhandbuch.sachsen.de/download/Markenhandbuch_3.0.pdf)
- Sachsen-Anhalt: [Aktuelle Webimplementierung Sachsen-Anhalt](https://www.sachsen-anhalt.de/_nuxt/entry.C1F77l7D.css); [Sachsen-Anhalt: Hoheitszeichen und Landessymbole](https://mi.sachsen-anhalt.de/themen/wappen-flagge-symbol-siegel-und-landeslogo)
- Schleswig-Holstein: [Marken-Manual Schleswig-Holstein: Farbsystem](https://www.schleswig-holstein.de/DE/landesregierung/themen/wirtschaft/landesdachmarke/markenManualSH/arbeiten/_documents/_documents_Farbsystem/Farbsystem)
- Thüringen: [Markenhandbuch Thüringen 2021: Primärfarben, Seite 37](https://markenwelt.thueringen.de/fileadmin/th6/markenhandbuch/downloads/Freistaat-Thueringen-Markenhandbuch-Stand-20-Juli-2021.pdf); [Thüringen: Verfassung Artikel 44](https://landesrecht.thueringen.de/bsth/document/jlr-VerfTHV5Art44)

Bevölkerungsschutz: Das allgemeine Zivilschutzzeichen ist ein blaues gleichseitiges Dreieck auf orangefarbenem Grund (Zusatzprotokoll I zu den Genfer Abkommen; für Anstriche RAL 2004 und RAL 5015 nach [BayVwV Zivilschutzkennzeichen](https://www.gesetze-bayern.de/Content/Document/BayVwV96933)); die Setzhinweise der Leuchtturm-Piktogramme nennen RAL 2005 und RAL 5002 ([warnung-der-bevoelkerung.de](https://warnung-der-bevoelkerung.de/wp-content/uploads/2025/12/Katastrophenschutz-Leuchttuerme_Setzhinweise_fuer_Piktogramme.pdf)). Die sRGB-Werte sind Annäherungen.

## Eigenes Farbschema im Profil

Ein Profil kann in `profil.json` optional ein Farbschema mitbringen. Es gilt, wenn unter „Einstellungen → Darstellung“ „Farben des aktiven Profils“ gewählt ist:

```json
"farbschema": {
  "basis": "de-th",
  "name": "Stab Kreis X",
  "farben": { "amt": "#00557A", "marke-akzent-1": "#0089C1", "marke-akzent-2": "#FFFFFF", "marke-akzent-3": "#D62B32" }
}
```

- `basis`: Kennung aus dem Katalog; alle Rollen werden von dort übernommen.
- `farben` (optional): einzelne Rollen als `#RRGGBB`: `papier`, `flaeche`, `tinte`, `tinte-leise`, `linie`, `linie-zart`, `eingabe-rand`, `fokus`, `fokus-abstand`, `auswahl-text`, `lese-farbe`, `lese-flaeche`, `header-hintergrund`, `header-text`, `amt`, `amt-tief`, `amt-zart`, `auf-amt`, `auf-amt-hover`, `link`, `auswahl-rand`, `browserleiste`, `marke-akzent-1`, `marke-akzent-2`, `marke-akzent-3`. Signalfarben, Radar, Schrift und CSS-Texte sind nicht änderbar.
- Ist mindestens eine der Farben `marke-akzent-1` bis `-3` gesetzt, bilden die drei das Identitätsband (nicht gesetzte kommen aus der Basis); sonst gilt das Band der Basis.
- Ein fehlerhaftes Farbschema (unbekannte Rolle, kein Hexwert, zu wenig Kontrast) sperrt das Profil nicht: Die App meldet eine Warnung und verwirft es. Verwendet werden dann eigene Farben auf dem Gerät, falls vorhanden, sonst „Neutral · Hell“.

Ohne Paketänderung lassen sich unter „Einstellungen → Darstellung → Eigene Farben für dieses Profil“ Farben auf dem eigenen Gerät festlegen. Sie gelten nur für diesen Profilstand (Schlüssel und Prüfsumme) und lassen sich als Ausschnitt für `profil.json` kopieren.

## Pflege

Bei Farbänderungen den Katalog (`src/darstellung/katalog.ts`) und diese Übersicht anpassen und `npm test` ausführen; die Kontrastprüfung zeigt unzureichende Paare mit Verhältnis an.

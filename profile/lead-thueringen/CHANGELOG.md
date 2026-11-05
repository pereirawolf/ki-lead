# Änderungsverlauf Profil „LEAD-Beispiel – Land Thüringen (fiktive Inhalte)“

Profil-ID `lead.beispiel.thueringen`, Inhalte unter CC BY 4.0. Die jüngsten Änderungen stehen zuerst.

**Versionierung:** wie beim Beispielprofil der Koordinierungsstelle (Semantic Versioning). **Abgeleitete Dateien:** Schema, Darstellungsdatei, Kontakte, Arbeitsanweisungen und Kodierleitfaden entstehen mit `npm run profil:land` aus dem Beispielprofil (`scripts/landesprofil.mjs`); ein Test prüft, dass sie aktuell sind. Ändert sich eine dieser Dateien im Beispielprofil, wird das Landesprofil neu abgeleitet und hier mit einer neuen Version vermerkt. **SOP-Sammelmappe:** geteilt mit dem Beispielprofil; Änderungen stehen in dessen `sop/CHANGELOG.md`.

## 1.7.0 – 05.11.2026

Grundlage: Entscheidung des Herausgebers vom 05.11.2026 nach dem Anbietervergleich vom 04.11.2026 (AV-2026-W45-01 bis -03) und seiner Folgereihe vom 05.11.2026 (drei interne Erfassungsläufe mit demselben Material, sechs Sachverhalte, ohne Recherche: Läufe 20261105-141838-pyor, -143746-5iuf, -150440-l8af). Material, Laufprotokolle und Inhalte der Läufe bleiben intern; hier stehen nur Kenndaten. Zweite Stelle, weil sich die Modellvorgabe des Profils ändert; Regeln, Schema, Darstellungsdatei und Inhalte bleiben unverändert.

- **Modellvorgabe:** `modelle.vorverarbeitung` jetzt `claude-sonnet-5-5` (bisher `claude-haiku-5-5`), wie Standard-Profil und Vorgabe der App seit App 0.7.13; Aufwand nach der Vorgabe der App „mittel“. Erfassung und Verdichtung unverändert. Einzelheiten im [App-Verlauf](../../CHANGELOG.md).

## 1.6.0 – 05.11.2026

Grundlage: Befunddatei `ki-lead-befund_kritis_2026-W45-b.json`, KL-2026-W45-05, freigegeben vom Herausgeber am 05.11.2026. Zweite Stelle wie beim Beispielprofil (1.40.0).

- **Kodierleitfaden (1.11.0) und Arbeitsanweisung Erfassung (1.11.2)** neu abgeleitet aus dem Beispielprofil 1.40.0 (`npm run profil:land`): Kennungen der Betreiber mit Präfix `KRITIS-` in Abschnitt 8.1.
- **Geteilte SOP-Sammelmappe 3.23.2:** Gültigkeitsstand in Teil A.
- Schema, Darstellungsdatei, Kontakte und Beispiellagen sind unverändert.

## 1.5.0 – 04.11.2026

Grundlage: Befunddatei `ki-lead-befund_anbietervergleich_2026-W45.json`, AV-2026-W45-04 bis -06, freigegeben vom Herausgeber am 04.11.2026. Zweite Stelle wie beim Beispielprofil (1.39.0).

- **Arbeitsanweisung Erfassung (1.11.1) und Kodierleitfaden (1.10.0)** neu abgeleitet aus dem Beispielprofil 1.39.0 (`npm run profil:land`): Sammel- und Auswertungsdokumente im Eingangsmaterial, Auswahl und Kennzeichnung der Funktion bei D3, Kurzbeispiele für Sachverhalte ohne eigenen Schadensraum.
- **Geteilte SOP-Sammelmappe 3.23.1:** Gültigkeitsstand in Teil A.
- Schema, Darstellungsdatei, Kontakte und Beispiellagen sind unverändert.

## 1.4.0 – 04.11.2026

Grundlage: Befunddatei `ki-lead-befund_lernschleife_2026-W45.json`, LS-2026-W45-01 bis -06, freigegeben vom Herausgeber am 04.11.2026. Zweite Stelle wie beim Beispielprofil (1.38.0).

- **Arbeitsanweisung Erfassung (1.11.0) und Kodierleitfaden (1.9.0)** neu abgeleitet aus dem Beispielprofil 1.38.0 (`npm run profil:land`): Richtwert keine Obergrenze bei vorstrukturiertem Material, Zuordnung sachverhaltsübergreifender Materialteile, erweiterte Kurzantwortzeile „Nicht übernommen“; gerundete amtliche Zählangaben an einer Stufengrenze als Mindestwert.
- **Geteilte SOP-Sammelmappe 3.23.0:** B05 2.3.0 und Gültigkeitsstand in Teil A.
- Schema, Darstellungsdatei, Kontakte und Beispiellagen sind unverändert.

## 1.3.0 – 04.11.2026

Grundlage: Beispielprofil 1.37.0 (BB-2026-W45-01 bis -04). Zweite Stelle: neuer Baustein der geteilten SOP-Sammelmappe.

- **SOP-Sammelmappe 3.22.0 (geteilt):** `profil.json` bindet den Querschnittsbaustein C18 „Besondere Belange und Schutzbedarfe von Menschen“ ein; Einzelheiten im `sop/CHANGELOG.md` des Beispielprofils.
- **Arbeitsanweisung Erfassung:** mit `npm run profil:land` neu abgeleitet (Bausteine „C01 … C18“, Sammelmappe ab 3.22.0).
- Schema, Darstellungsdatei, Kontakte, Kodierleitfaden und Beispielmeldungen unverändert.

## 1.2.3 – 04.11.2026

Grundlage: Befunddatei `ki-lead-befund_schwesterrepos_2026-W45.json`, SR-2026-W45-02, freigegeben vom Herausgeber am 03.11.2026. Dritte Stelle: nur Begleitmaterial.

- **Begleitordner `beispiele/orkantief-ilka-thessa`:** Bausteine in Fassung 0.3 aus Thessa (Commit `a614ed4`), inhaltsgleich bis auf das entfallene Feld `bezug_lead` der Einsatzmeldungen (Thessa G12: Zuordnung durch die Lagemeldung). LIESMICH und Vorschlag für die Prüffrage nachgezogen. Beispielmeldungen, Schema und Darstellungsdatei unverändert.

## 1.2.2 – 03.11.2026

Grundlage: Auftrag des Herausgebers vom 03.11.2026, die Gebietsquelle in KI-LEAD, KRITIS-LEAD und Thessa einheitlich anzugeben. Dritte Stelle: nur Begleittext.

- **Quelle der Kreisnamen:** Namen und Kreisschlüssel der Kreise und kreisfreien Städte nach dem CSV-Export der Verwaltungsstruktur des Thüringer Landesamts für Statistik (Gemeindestruktur Stand 01.01.2026, abgerufen am 02.11.2026), genannt im README und in der Kreisliste von `scripts/landesprofil.mjs` (dort mit Schlüssel je Kreis). Namen, Schema, Darstellungsdatei, Kontakte und Beispiele unverändert.

## 1.2.1 – 03.11.2026

Grundlage: Befunddatei `ki-lead-befund_umstellungsplan_2026-W45.json`, UP-2026-W45-01, freigegeben vom Herausgeber am 03.11.2026. Dritte Stelle: nur Begleittext.

- **LIESMICH des Begleitordners `beispiele/orkantief-ilka-thessa`:** Ein Baustein erscheint ab App 0.6.24 als „Kennzahlen-Baustein“ statt als JSON-Material; an die KI geht er ohne Herleitung, nach dem Lauf gleicht die App die Zahlen im Text ab. Bausteine und Beispielmeldungen unverändert.

## 1.2.0 – 03.11.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz_2026-W45.json`, freigegeben vom Herausgeber am 02.11.2026 (KP-2026-W45-01 und -02, jeweils wie empfohlen). Zweite Stelle, weil eine Beispiellage hinzukommt; Regeln und abgeleitete Dateien bleiben unverändert.

- **Beispiellage „Orkantief ‚Ilka‘ mit Kräftelage der Feuerwehren“ (FIKTIV, KP-2026-W45-01):** drei Kreismeldungen um 10:00 Uhr (Ilm-Kreis, Landkreis Hildburghausen, Landkreis Sonneberg) und die verdichtete Meldung des Lagezentrums des Landes um 10:30 Uhr mit Bezug und Zeitstrahl. Die Landesmeldung führt dieselben Kennungen und Kernzahlen wie die Thüringer Meldung im Beispielprofil der Koordinierungsstelle. Die Kräftelage der Feuerwehren stammt aus Kennzahlen-Bausteinen von Thessa; die Zahl des Landes ist ausdrücklich ein Ausschnitt aus fünf Kreisen. Kodiert nach Kodierleitfaden 1.8.1; Abweichungen zur Meldung im Beispielprofil erläutert das LIESMICH.
- **Begleitordner `beispiele/orkantief-ilka-thessa` (KP-2026-W45-02):** fünf unveränderte Kennzahlen-Bausteine aus Thessa (Fassung 0.2) als Material für die KI-Erfassung, nicht in „beispiele“ eingetragen und deshalb nicht im Lagebild geladen; LIESMICH mit Herkunft und den Schritten der Übergabe.
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Kontakte und die Beispiellage „Hochwasser an der Saale“ sind unverändert.

## 1.1.1 – 02.11.2026

Grundlage: Befunddatei `ki-lead-befund_gesamtkonsistenz_2026-W44-b.json`, GK-2026-W44-09 (Option A), freigegeben vom Herausgeber am 01.11.2026. Dritte Stelle wie beim Beispielprofil (1.36.1).

- **Kodierleitfaden (1.8.1) und Arbeitsanweisung Erfassung (1.10.1)** neu abgeleitet aus dem Beispielprofil 1.36.1 (`npm run profil:land`): Abschnitt 8.3, Regel 8, nennt, was „dieselbe Quelle“ ist; Beispielwert `_entstehung`.
- **Geteilte SOP-Sammelmappe 3.21.1:** Gültigkeitsstand in Teil A.
- Schema, Darstellungsdatei, Kontakte und Beispiellage sind unverändert.

## 1.1.0 – 01.11.2026

Grundlage: Befunddatei `ki-lead-befund_gesamtkonsistenz_2026-W44.json`, freigegeben vom Herausgeber am 01.11.2026 (GK-2026-W44-01 und -02, jeweils Option A). Zweite Stelle wie beim Beispielprofil (1.36.0), weil sich Regeln ändern.

- **Darstellungsdatei, Arbeitsanweisungen Erfassung (1.10.0) und Verdichtung (2.3.0), Kodierleitfaden (1.8.0)** neu abgeleitet aus dem Beispielprofil 1.36.0 (`npm run profil:land`): je Frist eine eigene Zeile „Handlungsrelevant bis:“; stabile Quellennummern der eigenen Vormeldung bei Fortschreibungen.
- **Geteilte SOP-Sammelmappe 3.21.0:** Teil A, A.4, und Gültigkeitsstand (Einzelheiten im Verlauf der Sammelmappe des Beispielprofils).
- Schema, Kontakte und Beispiellage sind unverändert.

## 1.0.1 – 01.11.2026

- **Darstellungsdatei** neu abgeleitet aus dem Beispielprofil 1.35.1 (`npm run profil:land`): Erklärtexte im Analysebereich mit Leitfrage, Gruppenhinweis auf die LEAD-Eingabehilfen, „Bewertung & Tendenz“, Kennung, Bezug und Lagenradar sprachlich angeglichen. Adressaten der Empfehlungen wie bisher mit Kreisen und kreisfreien Städten.
- Schema, Arbeitsanweisungen, Kodierleitfaden, Kontakte und Beispiellage sind unverändert.

## 1.0.0 – 31.10.2026

Grundlage: Befunddatei `ki-lead-befund_technik_2026-W44-A4.json` (Arbeitspaket A4 „Profil Landesebene“), freigegeben vom Herausgeber am 31.10.2026 mit den Entscheidungen: reales Land Thüringen mit fiktiven Inhalten, SOP-Sammelmappe geteilt, Beispiellage Hochwasser; Perspektive nach Entscheidung E1 (wöchentlich, mittel- bis langfristig wie SOP-LEAD A.1 Nr. 1; Meldetakt als Variable änderbar).

- **Profil:** Ebene Land, Referenzraum „Bevölkerungsschutz in Thüringen“, meldende Stelle „Lagezentrum des Landes (Beispiel)“ ohne Weisungsbefugnis gegenüber den Kreisen. Keine Vorgabe des Freistaats Thüringen oder einer seiner Behörden, ohne landesrechtliche Bezüge.
- **Schema `LEAD-Meldung-Land-v1`:** aus `LEAD-Meldung-v1` (LEAD-Meldevorlage 1.2) mit dem Feld `kreis` statt `land` (Land Thüringen, 17 Landkreise, 5 kreisfreie Städte); Eingang und Ausgabe. Kennungspräfixe `DE-TH` für das Land und `DE-TH-<Kfz-Kennzeichen>` für Kreise und kreisfreie Städte; Kontakte je Kreis für den Meldestatus.
- **Arbeitsanweisungen und Kodierleitfaden:** wie im Beispielprofil (Erfassung 1.9.0, Verdichtung, Kurzfassung 2.4.1, Kodierleitfaden 1.7.0) mit Kreisen statt Ländern in Beispielen und Regeln zur Rolle.
- **Beispiellage „Hochwasser an der Saale“ (FIKTIV):** drei Kreismeldungen (Landkreis Saalfeld-Rudolstadt, Saale-Holzland-Kreis, Stadt Jena) und die verdichtete Meldung des Landes mit Bezug und Zeitstrahl.

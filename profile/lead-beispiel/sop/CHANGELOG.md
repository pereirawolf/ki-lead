# Änderungsverlauf SOP-LEAD-Sammelmappe (Beispielfassung)

Änderungen an den Standardvorgehensweisen (SOP) des Beispielprofils `lead.beispiel.koordinierungsstelle`, die jüngsten zuerst. Inhalte unter CC BY 4.0. Die Form folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Dieser Verlauf führt ausschließlich SOP-Änderungen. Änderungen an Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen, Schema und Beispielen stehen im Profilverlauf [`../CHANGELOG.md`](../CHANGELOG.md), Änderungen der App im [App-Verlauf](../../../CHANGELOG.md).

**Versionierung:** Die Sammelmappe trägt eine eigene Fassung (erste Stelle: geänderte Struktur oder Kodier- bzw. Quellenregeln; zweite Stelle: neue oder geänderte fachliche Inhalte; dritte Stelle: redaktionelle Korrekturen). Einzelne SOPs und Bausteine tragen im YAML-Kopf `version` und `stand`. Welche Fassungen von Sammelmappe, Kodierleitfaden, Darstellungsdatei, Arbeitsanweisung und Schema zusammengehören, steht im Gültigkeitsstand am Anfang von Teil A.

**Dateien in diesem Ordner:** Übersicht aller SOPs und Bausteine mit Fassung und Konkordanz in [`README.md`](README.md). Die App liest nur die in `profil.json` unter `sop.dateien` genannten Dateien.

| Datei oder Ordner | Fassung | Status |
|---|---|---|
| `A_Gemeinsame-Regeln.md`, `teil-b/`, `teil-c/` | 3.17.1 vom 25.10.2026 | gültig, Pflegequelle; 35 Dateien im Manifest |
| `quellenregister.json` | Stand 22.10.2026 | Nachweis je URL aus Teil A, B und C (A.6); von der App nicht gelesen |
| `SOP-LEAD_Sammelmappe_Lesefassung.md` | 3.17.1 | aus den Einzeldateien erzeugt (`npm run sop:lesefassung`), nicht von Hand bearbeiten; von der App nicht gelesen |
| `archiv/SOP-LEAD_Sammelmappe_v2.0.1.md` | 2.0.1 vom 19.10.2026 | am 21.10.2026 aus dem Ordner entfernt, unverändert im Git-Verlauf ([Stand `7f88cab`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v2.0.1.md); bis 19.10.2026 `SOP-LEAD_Sammelmappe_v2.0.md`; SHA-256 `f2ebf614ea54cf977173d0026f2ee2e501467b53646fac2c25b5a089289a9b93`) |
| `archiv/SOP-LEAD_Sammelmappe_v1.0.1.md` | 1.0.1 vom 17.10.2026 | am 21.10.2026 aus dem Ordner entfernt, unverändert im Git-Verlauf ([Stand `7f88cab`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v1.0.1.md); bis 19.10.2026 `SOP-LEAD_Sammelmappe.md`; SHA-256 `6c4d27a42845758661ae285837585373f8122e5481e4017b61d929dddb4b0626`) |

**Kennungen in älteren Einträgen:** Einträge bis Fassung 2.0.1 nennen die damaligen Nummern („SOP 08“, „N05“); die Zuordnung zu B01–B17 und C01–C17 steht in der Konkordanz der README. Historische Angaben in Meldungen und Review-Dokumenten werden nicht umgeschrieben.

## [3.17.1] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_profilauswahl_2026-W43.json`, Befund AV-2026-W43-36, vom Herausgeber am 25.10.2026 freigegeben. Dritte Stelle nach der Versionierungsregel: nur der Gültigkeitsstand in Teil A ändert sich; Regeln, SOPs, Bausteine und Quellenregister bleiben unverändert.

### Geändert

- **Teil A:** Gültigkeitsstand fortgeschrieben (Sammelmappe 3.17.1, Arbeitsanweisung Kurzfassung 2.2.0 mit Längengrenze; AV-2026-W43-36).

## [3.17.0] – 24.10.2026

Grundlage: Befunddatei `ki-lead-befund_erfassungstest_2026-W43.json` (Erfassungstest KW 43 zu drei realen Lagen, Commit fbfe50b), Befunde ET-2026-W43-01 bis -07, vom Herausgeber am 24.10.2026 freigegeben; Entscheidungsfragen zu ET-2026-W43-01, -04, -05 und -06 beantwortet (Ist-Kodierung zu t0 mit D5 = 0 bei erreichtem Zielzustand; Mindestprognose als gekennzeichneter Mindestwert; Verwaltungsleistungen allein keine Direktbetroffenheit; D3 bei kreisfreien Städten nach wahrgenommener Funktion). Zweite Stelle nach der Versionierungsregel: neue Prüfpunkte und Stolperstellen sowie eine präzisierte D5-Regel in A.2, mitfortgeschrieben im Kodierleitfaden 1.4.0 (A.10.2); Stufentexte, Quellenkategorien, Kennsätze und Schema bleiben unverändert. Keine neuen Links; das Quellenregister ist unverändert. Die im Test entstandenen Meldungen liegen als Prüfsteine unter `evaluation/pruefsteine/2026-W43_*`.

### Geändert

- **Teil A:** A.2 D5: erreichter Zielzustand = 0, Mindestprognose als gekennzeichneter Mindestwert (ET-2026-W43-01, -04). Gültigkeitsstand fortgeschrieben (Sammelmappe 3.17.0, Kodierleitfaden 1.4.0).
- **B10 2.2.0:** Abschnitt 4 „Übergreifender Erkenntniswert“: wiederholte Einschränkung im selben Versorgungsgebiet, Ursache nach der Freigabe (ET-2026-W43-07).
- **B15 2.5.0:** R3: Stolperstelle zum Datenabfluss (Art der Daten, Veröffentlichung, Information Betroffener, Warnhinweise; A.9.5), „Prüfen für“ R/M (ET-2026-W43-02); Abschnitt 3: Prüfpunkt D2 zu Verwaltungsleistungen (ET-2026-W43-05).
- **C07 1.3.0:** Abschnitt 2 „Fristen und Neubewertung“: räumlicher Zuschnitt bestehender deutscher Vorsorgemaßnahmen nach Ausbreitung in weitere Staaten (ET-2026-W43-03).
- **Lesefassung:** aus den Einzeldateien neu erzeugt.

## [3.16.0] – 23.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz_2026-W43.json` (Konsistenzprüfung KW 43, Commit 051cd90), Befunde KP-2026-W43-12 bis -55, vom Herausgeber am 23.10.2026 nach einer Entscheidungsempfehlung freigegeben; KP-2026-W43-17 und -49 zurückgestellt (siehe „Offen“). Zweite Stelle nach der Versionierungsregel: Die Änderungen an Teil A (D3-Funktionsliste beispielhaft, Regel zu Weitergabebeschränkungen, Klarstellungen in A.1 Nr. 2, A.10.1, A.10.2) präzisieren bestehende Regeln, Stufentexte, Quellenkategorien, Kennsätze und Schema bleiben unverändert. Kodierleitfaden, Darstellungsdatei und Arbeitsanweisungen sind nach A.10.2 mitfortgeschrieben (Profilverlauf 1.25.0). Keine neuen Links; das Quellenregister ist unverändert.

### Geändert

- **Teil A:** A.1 Nr. 2: Tabelle Zeile B16 nach dem Funktionsdach B12 (KP-2026-W43-22); Satz, dass die Tabelle allein maßgeblich ist und Abschnitt 1 der SOPs nur besonders relevante bedingte Anschlüsse erläutert (KP-2026-W43-30). A.1 Nr. 7: Verweis auf A.1 Nr. 6 und A.3 ergänzt (KP-2026-W43-42). A.2 D3: Funktionsliste beispielhaft; bewertet wird die konkret betroffene Funktion (KP-2026-W43-13). A.3: neuer Absatz „Weitergabebeschränkungen“ (TLP 2.0; Weitergabe ≠ Verarbeitung in KI-Diensten; nichtöffentliche Inhalte in nicht besonders freigegebenen Instanzen ausgeschlossen) (KP-2026-W43-21). A.10.1: „Kaskade“ ohne Zusatz nach der Wirkungskette (A.2, D6), keine eigene D6-Wirkung (KP-2026-W43-20); Registerkennungen sind keine nummerierten Quellenverweise (KP-2026-W43-24). A.10.2: gezielter Inhaltsabgleich genügt für `quellen_geprueft_am` mit Datum, Gegenstand und Prüftiefe; Prüfauslöser weist keine Prüfung aus (KP-2026-W43-16, -29); Prüfvermerk je Arbeitsanweisung bei Änderungen an Teil A (KP-2026-W43-43). Gültigkeitsstand fortgeschrieben.
- **B01 2.1.1, B02 2.1.2:** `zweck` „frühe Befassung (A.1 Nr. 1)“ (KP-2026-W43-32).
- **B05 2.2.0, B06 2.2.0:** R1 „Prüfen für“ nur L/R; Prognose begründet keinen Ist-Wert (KP-2026-W43-31).
- **B08 2.2.0:** Tabelle der Systemzustände mit „Feststellende Stelle und Voraussetzung“ (KP-2026-W43-28); R1 Bezug auf Tabelle und Prüfpfad (KP-2026-W43-23); VO (EU) 2017/2196 als Kontext mit Prüfvermerk (KP-2026-W43-26); „Kaskade“ nach A.2, D6 (KP-2026-W43-20); „frühe Befassung“ (KP-2026-W43-32).
- **B10 2.1.1:** Prüfauslöser TrinkwV, WasSiG (KP-2026-W43-29).
- **B11 2.4.0:** Tabelle „Amtliche Einstufungen“: Zeile „Erkrankungshäufung (§ 11 Abs. 1 Nr. 1 Buchst. e IfSG)“; RKI-Risikobewertung als fachliche Bewertung nach R3 verlagert (KP-2026-W43-25); Prüfauslöser §§ 5, 11, 28 IfSG (KP-2026-W43-29).
- **B15 2.4.0:** Spaltenkopf „Fallgruppe“ (KP-2026-W43-27); TLP-Hinweis verweist auf A.3 (KP-2026-W43-21); „frühe Befassung“ statt „Vorsorgelage“ (KP-2026-W43-32); Prüfauslöser BSI-Standard 200-4 (KP-2026-W43-29).
- **B16 2.1.2:** Folgeausfälle nach dem Funktionsdach B12 (KP-2026-W43-22).
- **C02 1.2.1, C09 1.2.1, C11 1.2.2, C15 1.1.3, C16 1.2.1:** `quellen_geprueft_am` aus dem Quellenregister (gezielter Inhaltsabgleich vom 21.10.2026) (KP-2026-W43-16); C09/R2 ohne Verallgemeinerung der Trägerschaft des Rettungsdienstes (KP-2026-W43-19).
- **C04 1.2.0:** D3-Funktionen beispielhaft, „Fachinformation“ nur bei beeinträchtigter Funktion (KP-2026-W43-13).
- **C05 1.1.1, C06 1.2.1, C13 1.2.1:** „Schwereklasse“ durch „Beurteilung (A.4)“ ersetzt (KP-2026-W43-12).
- **C14 1.3.1:** Abgrenzung Produktwarnung/Rückruf nach tatsächlicher Ursache, B11/C07 bei gesundheitlicher Lage; Prüfvermerk für LFGB und VO (EG) Nr. 178/2002 (KP-2026-W43-18).
- **C17 1.4.0:** `quellen_geprueft_am` nach Quellenregister, Prüfauslöser Art. 35, 80a, 115a GG (KP-2026-W43-14); WiSiG in der als nicht abschließend gekennzeichneten Übersicht der Sicherstellungsgesetze (KP-2026-W43-15).
- **Lesefassung:** aus den Einzeldateien neu erzeugt.

### Nicht übernommen

- KP-2026-W43-28 (Teil): B07 behält „Fallgruppe“, weil die Tabelle neben feststellungsgebundenen Einordnungen (Störfall, meldepflichtiges Ereignis) auch Fallgruppen ohne Feststellung enthält.
- KP-2026-W43-48: `_entstehung` der Beispielmeldungen bleibt als historische Angabe unverändert; das LIESMICH des Datensatzes unterscheidet Entstehungsangabe und gültiges Regelwerk (Profilverlauf).

### Offen

- KP-2026-W43-17: Zuordnung von ANoPl-Bund (Tabelle 3.4, Referenzszenarien) und StrlSchG zu den Prüffragen von C01 am amtlichen Dokument verifizieren.
- KP-2026-W43-49: Quellenidentität von Q5 der NI-Beispielmeldung feststellen (Profilverlauf).
- Offene Punkte aus 3.13.0 und 3.14.0 unverändert.

## [3.15.0] – 22.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz_2026-W43.json` (Konsistenzprüfung, Commit 051cd90), Befunde KP-2026-W43-01 bis -11, vom Herausgeber am 22.10.2026 freigegeben; Entscheidungsfragen zu KP-2026-W43-06 und -11 mit Ja beantwortet. Zweite Stelle nach der Versionierungsregel: Kodier- und Zuordnungsbedingungen in Bausteinen an bestehende Regeln in Teil A, Kodierleitfaden und B12 angeglichen; Achsendefinitionen, Stufentexte, Quellenkategorien, Kennsätze, Schema und Quellenregister sind unverändert. Keine neuen Links.

### Geändert

- **B08 2.1.2:** D8 nach A.2 „im zurückliegenden Beobachtungszeitraum“ statt „Betrachtungszeitraum“ (KP-2026-W43-02).
- **C01 1.2.2:** D8 wie B08 (KP-2026-W43-02); Kopfzeile der Fachgrundlagen nach A.6 vereinheitlicht (KP-2026-W43-03); Schreibvorgabe „Referenzszenario S2 (ANoPl-Bund) laut Fachstelle“ nach A.10.1 (KP-2026-W43-04).
- **C03 1.1.1:** Offenlassen nur für die einschlägigen Ist-Achsen (A.1 Nr. 1) (KP-2026-W43-05).
- **C06 1.2.0:** D6 nur offen, wenn die KRITIS-Prüfung nicht tragfähig ist; ohne Kopplung D6 = 0 (Kodierleitfaden D6, A.2) (KP-2026-W43-01).
- **C07 1.2.0:** `anschluss` um die im Text genannten bedingten Bezüge C09 und C10 ergänzt; `art_hinweis` neu (KP-2026-W43-06).
- **C10 1.3.1:** Spaltenkopf der Engpassstufen „Feststellende Stelle und Voraussetzung“ (A.10.1) (KP-2026-W43-08).
- **C11 1.2.1:** Teil-A-Verweis aus `anschluss` entfernt, wie für 3.14.0 vorgesehen (V21) (KP-2026-W43-07).
- **C12 1.2.0:** Kopfzeile der Fachgrundlagen nach A.6 (KP-2026-W43-03); „KRITIS-Ausfall“ in `art_hinweis` und „Zuordnung im Schema“ mit der Schwelle von B12 (KP-2026-W43-11).
- **C13 1.2.0:** „Versorgungskrise“ außerhalb der Fachgrundlage ESVG durch „Versorgungslücke“ ersetzt (A.10.1, C14) (KP-2026-W43-10); „Zuordnung im Schema“ an Kopf und B12 angeglichen (KP-2026-W43-11).
- **C14 1.3.0:** „KRITIS-Ausfall“ in `art_hinweis` und „Zuordnung im Schema“ mit der Schwelle von B12 (KP-2026-W43-11).
- **C15 1.1.2:** Zitierweise „B11/R6“ (A.10.1) (KP-2026-W43-09).
- **Gültigkeitsstand (Teil A), README:** Sammelmappe 3.15.0.
- **Lesefassung:** aus den Einzeldateien neu erzeugt.

### Offen

- Konsistenzprüfung KW 43 für Mitfortschreibung und Fassungen, Teil B, `docs/` und Musterprofil sowie weitere fachliche Kandidaten aus Teil C (Befunddatei, `nicht_geprueft`) folgt.

## [3.14.0] – 22.10.2026

Grundlage: zwei unabhängig erstellte Vorschlagsdateien vom 22.10.2026 zur Fassung 3.13.0 (Commit 77fad68): „KI-LEAD_SOP_PR-Vorschlaege_2026-10-22“ (19 Vorschläge, SOP-PR-01 bis SOP-PR-19) und „sop-lead_pr-vorschlaege_2026-10-22“ (28 Vorschläge, V01 bis V28), gegeneinander geprüft und konsolidiert. Zweite Stelle nach der Versionierungsregel: fachliche Klarstellungen in Teil A und in Bausteinen; Achsendefinitionen, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert. Keine neuen Links; das Quellenregister ändert nur den Zweckvermerk der BSIG-Fundstelle. Rechtsangaben wurden auf innere Konsistenz geprüft; Art. 115a Abs. 4 GG und § 47 Abs. 1 Nr. 2 Buchst. e AMG zusätzlich in nichtamtlicher Wiedergabe nachgelesen, die übrigen Normen nicht erneut am Normtext.

### Geändert

- **Teil A:** A.1 Nr. 2 Tabelle, Zeile B07, um C02 (Bauwerksversagen) ergänzt (V11). A.1 Nr. 7: Vorrangregel für Bausteine im Status „Beispielfassung“ (wie Inhaltsgerüst, bis zur Freigabe) und Klarstellung, dass der Vorrang das Regelwerk bestimmt, nicht die Richtigkeit einer Aussage – erkannte Widersprüche bleiben sichtbar (V16, SOP-PR-18). A.1 Nr. 8: Landesrecht wird nicht als Fachgrundlage zitiert, ist aber als Ereignisbeleg einer Meldung mit Land, Herausgeber, Fundstelle und Stand zulässig (SOP-PR-02); Absatz „Übernahme“ für übernehmende Stellen (Auftrag, Verantwortungsraum, Betrachtungshorizont, Fortschreibungsrhythmus; Relevanz nach dem Bedarf der adressierten Stelle) (SOP-PR-01). A.2: Fassung des Kodierleitfadens nur noch über den Gültigkeitsstand (V05, SOP-PR-17). A.3 Zählregeln: vollzogen Evakuierte, Verlegte und Untergebrachte sind direkt Betroffene (D2), nicht die Bevölkerung des Räumungs- oder Warngebiets (V13, SOP-PR-05). A.4: `art_zuordnung` als nicht abschließende Liste, Bedingungen in `art_hinweis` und A.1 Nr. 2 und 7 (SOP-PR-03). A.6: Vermerk „Ergänzung 22.10.2026“ zu den 20 Fachgrundlagen aus 3.13.0 (V25). A.10.1: zweite Spalte der Typologietabellen bei Rechts- und Feststellungsstufen „Feststellende Stelle und Voraussetzung“ (V17). A.10.2: Prüfauslöser spätestens mit Freigabe, für Fachgrundlagen schon mit deren Aufnahme; `quellen_geprueft_am` bei Inhaltsgerüsten ohne geprüfte Quellen entbehrlich (V18). Gültigkeitsstand: Sammelmappe 3.14.0; Darstellungsdatei als „Profilversion ihrer letzten Änderung“ gekennzeichnet (SOP-PR-17).
- **B02 2.1.1:** R3 „Evakuierte ≠ Betroffene“ ersetzt: Bewohner des Evakuierungsgebiets ≠ Evakuierte; vollzogen Evakuierte sind direkt Betroffene (A.3, C16), aber nicht die Gesamtzahl (V13).
- **B03 2.1.1:** Waldbrandatlas BKG von R6 nach R2 (Lageübersicht; Quellenregister S006 „passt nicht“ für den Mehrjahresvergleich); R6 nennt Waldbrandstatistik des Bundes und EFFIS-Statistik ohne Link, Fundstelle vor Erstverwendung prüfen (V06).
- **B04 2.1.1:** Offenlassen ohne Verengung auf einen Schadensnachweis (belegte Evakuierung oder Funktionsausfall genügt; D5 nur mit Zielzustand und Prognose) (SOP-PR-07); Hinweis auf den nicht abrufbaren BGR-Einstieg (Quellenregister S007) (V08).
- **B06 2.1.1:** R2: Eingeschlossene im Stau oder Zug zählen für D2 nur bei belegter unmittelbarer Beeinträchtigung, nicht bei bloßer Verspätung (Kodierleitfaden D2) (SOP-PR-06).
- **B07 2.2.1:** Einordnungstabelle: Gefahrgutkennzeichnung belegt die deklarierte Zuordnung, nicht Inhalt, Menge oder Freisetzung (SOP-PR-16); TUIS von R2 (Stoffgefahr) nach R3 als Fachunterstützung der Einsatzstellen (V22, Quellenregister S013); Abschnitt 3 um C02 bei Bauwerksversagen nach Explosion (V11).
- **B08 2.1.1:** Ursache-SOPs um C03 (fachlich belegter Weltraumwetterbezug) ergänzt (V12).
- **B10 2.1.0:** Fachgrundlagen-Block nach A.6 in Abschnitt 5 (UBA-Empfehlungen zu R6 als Vollzugsempfehlung, TrinkwV und WasSiG ohne Fundstelle, vor Verwendung prüfen); offener Punkt Fundstellen (V28, V03).
- **B14 2.1.1, B16 2.1.1:** R6 „Prüfen für“ mit Feld: „R; D7“ (V23).
- **B15 2.3.0:** Absatz „Meldestufen nach dem BSI-Gesetz“ als Verfahrensstand statt Bestätigungsgrad; Bestätigungsgrad je Aussage nach A.3, eine Abschlussmeldung belegt keine Wiederherstellung (SOP-PR-08; Quellenregister: Zweckvermerk der BSIG-Fundstelle angepasst). BITS-Stufe 1: Aufnahme bei konkret begründetem Bedarf nach A.1 Nr. 1 und 3 nicht ausgeschlossen (SOP-PR-09). Folge-SOP-Bereich wie A.1 Nr. 2 (B08–B11; B12 nach dem Funktionsdach) (V10).
- **B17 2.1.1:** Arzneimittel unter B11 mit C10; B12 nur nach dem Funktionsdach (SOP-PR-04); Bausteine C12 und C16 in der Aufzählung unter „Sonstiges“ ergänzt (V26).
- **C01 1.2.1:** Schlusssatz der Referenzszenarien-Tabelle unter die Tabelle gesetzt (A.10.1) (V17); Fachgrundlagen: Bekanntmachung BAnz AT 23.11.2023 B1 als Originalstelle, Prüfgrenze des nicht abrufbaren PDF-Links (Quellenregister S031) und offener Punkt (V07).
- **C07 1.1.1:** Verweis auf die Tabelle „Amtliche Einstufungen“ in B11, Abschnitt 2, in Abschnitt 1, R1 und R4 (V02).
- **C09 1.2.0, C10 1.3.0, C15 1.1.1:** „KRITIS-Ausfall“ in `art_hinweis`, `anschluss` (C10) und „Zuordnung im Schema“ nur nach dem Funktionsdach B12 (A.1 Nr. 2); C15 mit bestimmter Bedingung „belegter Ausfall oder wesentliche Einschränkung“ (V14, SOP-PR-04). C10 zusätzlich: Tabelle „Amtliche Engpassstufen“ an den Anfang von Abschnitt 2 verschoben, damit R2 „Tabelle oben“ stimmt (V01, SOP-PR-14); medizinische Gase nicht pauschal außerhalb des AMG, Produktstatus belegen (§ 47 Abs. 1 Nr. 2 Buchst. e AMG, nichtamtliche Wiedergabe) (SOP-PR-13).
- **C11 1.2.0:** D7 nach A.2 (entscheidungsrelevante Lücken zur gestörten Funktion, nicht nur gestörte Meldewege) (V15); funktionale Ansprechstellen in Abschnitt 5 (V20); `anschluss` ohne Teil-A-Verweis (V21).
- **C13 1.1.1:** offener Punkt VerkSiG-Fundstelle (V03).
- **C16 1.2.0:** D2 nach Kodierleitfaden und A.3 (Evakuierte, Verlegte, Untergebrachte, Unterkunftsverlust; Schätzbandbreite und Mindestzahl zulässig) (SOP-PR-05, V13); funktionale Ansprechstellen (V20); `anschluss` ohne Teil-A-Verweise (V21).
- **C17 1.3.0:** Einleitung der Rechtszustände auf die Wehrverfassung bezogen, Art. 35 GG als Maßnahme; Art. 115a Abs. 4 GG mit beiden Voraussetzungen (Angriff und Handlungsunfähigkeit der Bundesorgane); Spannungsfall mit Feststellung oder besonderer Zustimmung; keine pauschale Geltung aller Sicherstellungsgesetze, Anwendung je Instrument belegen (SOP-PR-10); Rechtszustand kein Leerwert aller Achsen, D3 strukturell nach A.2, Betreiberbelege tragen (SOP-PR-11); Aufgabengliederung nur der RRGV zugeschrieben, KZV als vergleichbar mit offener Fundstelle; C09/C10 und B11/C07 als Vertiefung (SOP-PR-12); Fundstellen der Sicherstellungsgesetze berichtigt (EnSiG in C12, ESVG in C14; WasSiG, VerkSiG, ArbSiG offen) (V03, SOP-PR-15); Prüfvermerk zu den RRGV-Kapiteln vereinheitlicht (V04); `anschluss` ohne Teil-A-Verweise (V21).
- **Lesefassung:** aus den Einzeldateien neu erzeugt.

### Nicht übernommen

- SOP-PR-12 (Teil): Zuordnung der gesundheitlichen Versorgung zu RRGV-Unterkapitel 20.4 nicht übernommen, weil der amtliche Volltext in dieser Prüfung nicht abrufbar war.
- SOP-PR-19: Prüfregister für Querverweise ist eine Werkzeugfrage außerhalb der Sammelmappe.
- V09: Tiefenlinks für BBK (B12, B17) und BfArM (C10) brauchen Registereinträge mit Abruf; folgt mit der nächsten Quellenprüfung.
- V19: Quellenkategorie für Hersteller-Sicherheitshinweise (B15/R2) ist eine Zuordnungsregel und wird nach A.10.2 gemeinsam mit Kodierleitfaden Abschnitt 5 fortgeschrieben.
- V24: Teilprofile „5a/5b“ in B05 bleiben als eingeführte Bezeichnung.
- V27: Fachgrundlagen-Block und Normfundstellen für B09 sowie der Prüftermin 31.10.2026 bleiben der saisonalen Prüfung vorbehalten (AP3–AP6).

### Offen

- Fundstellen für TrinkwV, WasSiG (B10) und VerkSiG (C13) mit Registereintrag; KZV-Fundstelle und RRGV-Unterkapitel (C17); AVV ANoPl-Bund als abrufbaren amtlichen Download bestätigen (C01).
- Abrufbare amtliche Fassung von § 32 und § 36 BSIG sowie § 47 AMG mit Prüfsumme nachweisen (B15, C10).
- Offene Punkte aus 3.13.0 unverändert.

## [3.13.0] – 22.10.2026

Grundlage: konsolidierter Vorschlag „KI-LEAD_SOP_Fachgrundlagen_PR-konsolidiert_2026-10-22“, Arbeitspaket AP2 (Rechts- und Feststellungsstufen mit Typologietabellen). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Jede neue Fachgrundlage wurde am 22.10.2026 am Normtext gelesen und im Quellenregister mit Prüftiefe nachgewiesen (20 neue Einträge; RRGV und BITS durch ein zweites Werkzeug); wo die amtliche Fundstelle nicht abrufbar war, ist die gelesene nichtamtliche Wiedergabe vermerkt. Keine Landesnorm, keine Einsatzvorschrift (A.1 Nr. 8). Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert; der Status der Bausteine bleibt.

### Geändert

- **B07 Industrieunfall / Chemieunfall 2.2.0:** Abschnitt 2 „Einordnung nach Störfallrecht“ mit Tabelle nach A.10.1 (Störfall, meldepflichtiges Ereignis nach Anhang VI, Ereignis unterhalb der Meldekriterien, Ereignis außerhalb des Störfallrechts) auf Grundlage von § 2, § 19 und Anhang VI der 12. BImSchV; R1 um Betriebsbereich und behördliche Feststellung; Beurteilungswerte nur, wenn die zuständige Stelle sie angewandt hat; D3 mit Rechtsbezug; Fachgrundlagen und Kontrastfälle in Abschnitt 5; Prüfauslöser Störfall-Verordnung.
- **B08 Stromausfall / Blackout 2.1.0:** Abschnitt 2 „Systemzustand und rechtlicher Prüfpfad“ mit Tabelle der Systemzustände nach Art. 18 VO (EU) 2017/1485 und dreistufigem Prüfpfad nach § 13 EnWG (netz- und marktbezogene Maßnahmen, Anpassungsmaßnahmen, hoheitliche Maßnahmen) analog B09/C12; Begriffskollision „Kaskade“ benannt; R1, R2, R6 und D3 angepasst; Fachgrundlagen und Kontrastfälle in Abschnitt 5.
- **B11 Gesundheitliche Lage / Epidemie 2.3.0:** Abschnitt 2 „Amtliche Einstufungen“ mit Tabelle (lokales Ausbruchsgeschehen nach § 11 IfSG, RKI-Risikobewertung, epidemische Lage von nationaler Tragweite nach § 5 IfSG, gesundheitliche Notlage von internationaler Tragweite und pandemische Notlage nach den IGV, Notlage auf Unionsebene nach Art. 23 VO (EU) 2022/2371); C07 verweist darauf. R1, R3, R5 angepasst; Fachgrundlagen in Abschnitt 5 (IfSG §§ 5, 11, 28; IGV-Änderungen 2024, in Kraft seit 19.09.2025; Pandemieplan nur als Planungsgrundlage).
- **B15 Cyberangriff / IT-Sicherheitsvorfall 2.2.0:** Absatz „Meldestufen nach dem BSI-Gesetz als Bestätigungsgrad“ (§ 32 BSIG: frühe Erstmeldung 24 h, Meldung 72 h, Zwischenmeldung, Abschlussmeldung ein Monat; § 36 Abs. 2 Information der Öffentlichkeit); Tabelle der Kritikalitätsstufen 1–4 der BSI-IT-Sicherheitsmitteilungen (BITS, seit 01.05.2025) nach A.10.1; R1, R5, R9 und Beurteilung angepasst (TLP); Fachgrundlagen in Abschnitt 5.
- **C10 Arzneimittel und kritisches medizinisches Material 1.2.0:** Abschnitt 2 „Amtliche Engpassstufen (Arzneimittel)“ mit Tabelle (gemeldeter Lieferengpass § 52b Abs. 3c AMG, Maßnahme der Bundesoberbehörde § 52b Abs. 3d, Versorgungsmangel § 79 Abs. 5, örtliche Nichtverfügbarkeit ohne Stufe); R2 und R6 angepasst; Kopf um `quellen_geprueft_am` und `pruefausloeser`; Fachgrundlagen in Abschnitt 5.
- **C14 Lebensmittelversorgung 1.2.0:** Absatz „Amtliche Feststellung einer Versorgungskrise“ nach § 1 ESVG mit dreistufigem Prüfpfad analog C12/R10; R2 und R5 angepasst; Kopf um `quellen_geprueft_am` und `pruefausloeser`; Fachgrundlagen in Abschnitt 5.
- **C17 Zivile Verteidigung 1.2.0:** Abschnitt 2 „Rechtszustände“ mit Tabelle (keine Feststellung, Katastrophennotstand Art. 35 GG, Spannungsfall und Bündnisfall Art. 80a GG, Verteidigungsfall Art. 115a GG), Absatz „Zivile Aufgabenfelder der Gesamtverteidigung“ nach den Kapiteln 18–22 der Rahmenrichtlinien Gesamtverteidigung vom 05.06.2024 (amtlicher Volltext gelesen) und der Konzeption Zivile Verteidigung als Prüfraster und Absatz „Sicherstellungs- und Vorsorgerecht“ mit Prüfpfad; R1, R3, R6 und D3 angepasst; Ansprechstellen, Fachgrundlagen und Kontrastfälle in Abschnitt 5; Kopf um `quellen_geprueft_am` und `pruefausloeser`.
- **C01 Radiologische / nukleare Lage 1.2.0:** Korrektur der Zeile zum Referenzszenario S14: Anhang B.14 des ANoPl-Bund bezieht vorsätzliche Ereignisse mit kriminellem oder terroristischem Hintergrund einschließlich einer damit einhergehenden glaubhaften Drohung des Einsatzes einer Nuklearwaffe ein, und Anhang B.13 ordnet einen drohenden Einsatz in der Regel S14 zu; die bisherige Aussage „kein S14“ war unzutreffend. Eine glaubhafte Drohung bleibt ein Anzeichen nach Tabelle 3.3 (Nr. 2) und kein hinreichendes Kriterium für einen Notfall; die Einordnung trifft die zuständige Stelle. Fundstelle in der Bekanntmachung BAnz AT 23.11.2023 B1 (S. 25, 216) ergänzt; erledigt den offenen Punkt O01 des Vorschlags.
- **Quellenregister:** 20 Einträge für die neuen Fachgrundlagen mit Prüfverfahren „Ergänzung 22.10.2026“; Stand 22.10.2026.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.13.0.

### Offen

- C17: Fundstelle der Konzeption Zivile Verteidigung prüfen.
- B11: Meldepflichten der §§ 6, 7 IfSG und konsolidierter Text der IGV-Änderungen; B15: §§ 2, 28 BSIG; C10: Definitionen von BfArM und PEI, VO (EU) 2022/123.
- Arbeitspakete AP3–AP6 des Vorschlags folgen in eigenen Pull Requests.

## [3.12.0] – 22.10.2026

Grundlage: konsolidierter Vorschlag „KI-LEAD_SOP_Fachgrundlagen_PR-konsolidiert_2026-10-22“. Er führt zwei Vorschläge zusammen: „2026-10-22_KI-LEAD_SOP_Amtliche_Fachstandards_PR-Vorschlag“ (34 Einzelvorschläge, 45 Quellen) und „fachstandard-vorschlaege-sop-lead“ (Fachstandards je SOP nach dem Muster von C01 und C12), geprüft auf Steuerungsebene, bundesweite Nutzbarkeit und Belegbarkeit. Dieser Schritt setzt Arbeitspaket AP1 um (gemeinsame Regeln in Teil A). Zweite Stelle nach der Versionierungsregel: neue Regeln zur Auswahl und Darstellung von Fachgrundlagen; Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert. Teil B und Teil C, das Quellenregister und die Bewertungsfälle sind unverändert; es kommen keine neuen Links hinzu.

### Geändert

- **Teil A, A.1 Nr. 8 (neu) „Ebene und Geltungsraum“:** Die SOPs dienen der Steuerungsebene kommunaler und staatlicher Behördenleitungen, nicht der operativen Einsatzebene. Die bundesweit nutzbare Beispielfassung stützt sich nur auf Fachgrundlagen des Bundes, gemeinsame Grundlagen von Bund und Ländern, der EU und internationaler Stellen. Landesrecht und Landesprodukte werden nicht zitiert, sondern über einen einheitlichen Satz an landesrechtliche SOPs verwiesen; Einsatz- und Betriebsvorschriften (Feuerwehr-Dienstvorschriften, Technische Regeln, Normen) werden nicht als Fachgrundlage herangezogen.
- **Teil A, A.6 „Fachgrundlagen“ (neu):** Begriff, Nachweis (Herausgeber, Dokumenttyp, Fassung, Originalstelle, Prüftiefe; Dokumentfassung getrennt vom Bereitstellungsdatum), Zuordnung Prüffrage–Fachgrundlage in Abschnitt 5, keine Übersetzung von Stufen in Radarwerte, kein Ereignisbeleg. Verallgemeinert die Regel aus C01, Abschnitt 5.
- **Teil A, A.10.1:** Format für Typologietabellen nach dem Muster von C01 (Spalten, Abschlusssatz, Zitierweise im Meldungstext) und Regel für gleichlautende Begriffe verschiedener Fachgrundlagen („Alarmstufe“, „Notfall“, „Kaskade“).
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.12.0.

### Offen

- Arbeitspakete AP2–AP6 des Vorschlags (Typologietabellen in B07, B08, B11, B15, C03, C04, C08, C09, C10, C17; KRITIS-Rechtsrahmen 2025/2026 in B12; Gesundheit, Versorgung, Naturgefahren) folgen in eigenen Pull Requests, jeweils erst nach Lesung der Originalstellen und mit Quellenregistereinträgen.
- Offene Prüfungen O01–O09 des Vorschlags, darunter O01: Ob Anhang B.14 des ANoPl-Bund eine glaubhafte Einsatzdrohung in das Referenzszenario S14 einbezieht, ist nicht am Originaltext bestätigt; die S14-Zeile in C01 bleibt bis dahin unverändert.

## [3.11.0] – 21.10.2026

Priorisierte Fachprüfung der Bereiche mit Priorität über „Mittel“ nach dem konsolidierten Vorschlag „SOP-LEAD_Fachpruefung-B-Quellen-Evaluation_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_Fachpruefung-B-Quellen-Evaluation_Vorschlag_2026-10-21“ (E1–E12, eigene Normen- und Quellenprüfung) und „2026-10-21_KI-LEAD_Priorisierte_Fachpruefung_Quellen_Evaluation_PR-Vorschlag“ (G01–G06, W01–W02, H01–H04, C01–C05, S01–S04, Q01–Q04, E01; Quellenregister; 40 Bewertungsfälle). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert. Barrierefreiheit und die offenen Punkte der Spezifikation (Priorität „Mittel“) sind nicht Gegenstand.

### Geändert

- **B09 Gasversorgungsengpass 2.2.0:**
  - Abschnitt 1: Gegenbeispiel präzisiert; ein örtlicher Leitungsschaden ist relevant, wenn eine nicht rechtzeitig ersetzbare Wärmefunktion betroffen ist (z. B. Pflegeeinrichtung).
  - Abschnitt 2: „Rechtlicher Prüfpfad“ mit drei getrennt zu belegenden Ebenen: Netzbetreibermaßnahmen nach §§ 16, 16a EnWG, Krisenstufe des Notfallplans, hoheitliche Lastverteilung nach EnSiG/GasSV (Feststellung und Anwendbarkeit nach § 7 GasSV). R1-Link auf die aktuelle BNetzA-Lageseite.
  - Abschnitt 3: „Geschützte Kunden und lebenswichtiger Bedarf“ nach § 53a EnWG (geschützt heißt nicht garantiert); D3 nach bewerteter Funktion statt nach Stufe.
  - Abschnitt 4: „Versorgungsprofil und Frist“.
  - Abschnitt 5: Prüfvermerk zur saisonalen Rechtsprüfung 2026/27 (Teilprüfung; BNetzA-Lagebewertung vom 20.10.2026 als Prüfstand, nicht fortgeschrieben). Offen bleiben EU-Rahmen (Verordnung (EU) 2017/1938 in aktueller Fassung; angekündigte Überarbeitung), geltende Planfassung des Notfallplans und Länderzuständigkeiten. Prüftermin 31.10.2026 bleibt.
- **B01 Unwetter / Sturm 2.1.0:** Übergang zu B06 und Folgen (ein Sachverhalt, beide Prüfperspektiven); „Warn- und Beobachtungsprofil“ (Produktart, Ausgabe, Gültigkeit, Ersetzung, Unsicherheit; DWD-Warnkriterien sind keine Radargrenzen).
- **B02 Hochwasser / Überschwemmung 2.1.0:** R2 Nord-/Ostsee getrennt (Tide bzw. Windstau); R5 angekündigte und vollzogene Abschaltung getrennt; „Datenzugang und Ausweichweg“ bei Portalausfall; „Überlagerung und Nachlauf“; Darstellungsmuster für Meldestufen mehrerer Länder (erledigt den bisherigen offenen Punkt).
- **B07 Industrieunfall / Chemieunfall 2.1.0:** `zweck` an Abschnitt 1 angeglichen (auch überörtlicher Bedarf ohne Freisetzung); „Mess- und Stoffprofil“; „Gesundheit und Fachunterstützung“; „Beendigung je Wirkung“ mit Abgrenzung industrieller Großbrände zu B17; GESTIS-Link.
- **B14 Sicherheitslage 2.1.0:** „Schnittstelle zur nichtpolizeilichen Gefahrenabwehr“; „Unbestätigte Informationen und Informationslücken“; R1 und neue „Verwendungsgrenze“ wie README und Spezifikation (nur fiktive oder offen zugängliche Inhalte; eine Weitergabefreigabe genügt nicht). Der offene Punkt zu eingestuften Informationen ist dadurch ersetzt.
- **Teil A, A.6:** Quellenabgleich vom 21.10.2026 und Pflegeverfahren; neues Quellenregister `quellenregister.json` mit allen URLs aus Teil A, B und C, Ergebnis einer Erstprüfung (Direktabruf) und einer unabhängigen Zweitprüfung, Eignung, offener Nachprüfung und bestätigten Nachfolgern. Der bisherige Vermerk bleibt als Historie.
- **Rechercheeinstiege mit amtlich bestätigtem Nachfolger ersetzt:** B05 2.1.1 (BfG-Niedrigwasser → NIWIS), B09 (BNetzA-Gasversorgung → aktuelle Lageseite), C14 1.1.1 (bmel.de → bmleh.de), C16 1.1.1 (BBK-Pilotprojekt → Mobile Betreuungsmodule 5000).
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.11.0.

### Nicht übernommen

- Paragraphen-Absätze in § 4 EnSiG (Abs. 3, Abs. 5) und die produktbezogene Zeitzonenaussage zu PEGELONLINE: im Abgleich nicht bestätigt; allgemeiner gefasst.
- Verweis auf das Quellenregister als relativer Link aus Teil B (bricht in der Lesefassung); stattdessen Pfadangabe.
- Pauschale, rein formale Rechercheaufträge je Prüffrage im Quellenregister; sie wiederholen nur die Regel aus A.6.
- Weitere Linkersetzungen ohne bestätigten Nachfolger (u. a. BGR-Erdbebendienst, BBK-Startseite, BfArM-Startseite); als offene Schwerpunkte im Register geführt.
- Echte Modellläufe und Bewertungen: nur mit gesondertem Auftrag und Budget (`evaluation/README.md`).

## [3.10.0] – 21.10.2026

Prüfung der Bezüge zwischen und innerhalb von Teil B und Teil C ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_Querverweise-B-C_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_Querverweise-B-C_Vorschlag_2026-10-21“ (E1–E12, Verweisgraph aller 34 Dateien) und „2026-10-21_KI-LEAD_SOP_B_C_Querverweise_PR-Vorschlag“ (Q01–Q17, 18 Kontrastfälle). Zweite Stelle nach der Versionierungsregel (geänderte fachliche Inhalte). Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert; die Änderungen an B04 (D4) und B16 (D6) gleichen lokale Abweichungen an die bestehenden Regeln in A.2 und im Kodierleitfaden an und sind kein Fall von A.10.2. Alle Bausteine behalten ihren Status.

### Geändert

- **Teil A:**
  - A.1 Nr. 2: neuer Absatz „Bedeutung eines Verweises“ (Ursache, Folge oder Funktion, Vertiefung oder Querschnitt, Abgrenzung; erwartete Folge rechtfertigt Prüfung, nicht Kodierung; keine transitive Mitwahl; Rückverweise zulässig). Neuer Absatz „Funktionsdach B12“: kein zusätzlicher B12-Sachverhalt allein wegen des KRITIS-Bezugs, wenn B08–B11 einschlägig sind.
  - Routentabelle: neue Zeilen B10, B13 und B14; B01, B02 und B06 → C02 (Hangrutschung, Unterspülung, Schnee- oder Eislast); B03 → C09; B05 → C12 und C14; B06 → C16 und B09 bei Gasursache; B07 → C05; B09 → C12 für die Wärmefunktion; B15 → B12 nach dem Funktionsdach; B16 → C17 bei konkretem zivilen Wirkungsbezug. Hinweis, warum B12 und B17 keine eigene Zeile haben.
  - A.1 Nr. 7: Status je Dateikopf statt der unzutreffenden Aussage, alle Bausteine seien Inhaltsgerüste (C01 und C12 sind Beispielfassungen); Beispielfassung ist nicht organisationsspezifisch freigegeben; gemeinsame Kodier-, Quellen- und Referenzraumregeln gehen auch freigegebenen Bausteinen vor. `art_zuordnung` nennt typische Katalogwerte, bei Querschnittsbausteinen nur die zusätzlich in Betracht kommenden, und ist keine Ausschlussliste; `art_zuordnung` und `anschluss` begründen keine automatische Auswahl.
  - A.8.1: Absatz „Bei kombinierten SOPs“ (Gegenstand, D3-Funktion und D5-Ziel stabil halten oder Änderung nennen; Ende der Ursache ≠ Ende der Folgen; Abtrennung einer Folge nur mit eigenem Prüfauftrag; Personen und Ressourcen einer Wirkungskette einmal führen).
  - Gültigkeitsstand: Sammelmappe 3.10.0.
- **B03 Waldbrand 2.1.0**, **B05 Extremhitze / Dürre 2.1.0**, **B06 Wintersturm / Schnee / Eis 2.1.0:** Abschnitt 1 mit „Vertiefung nach Wirkung“ (C02, C09, C12, C13, C14, C16 jeweils bedingt). B03: Munitionsbelastung bleibt Teil der Brandlage, C06 nur bei eigenem Fund- oder Räumungsvorgang. B06: Wärme- und Kraftstoffversorgung über C12, bei Gasursache zusätzlich B09.
- **B04 Erdbeben 2.1.0:** D4 wie A.2 und C07: deutsche Hilfe bei einem Auslandsbeben ergibt keinen D4-Wert, keine eigene D4-Auslegung je Gegenstand; R6 ohne D4-Bezug; offener Punkt als Kontrastbeispiel gefasst.
- **B08 Stromausfall / Blackout 2.0.2**, **B10 Trinkwasserversorgung 2.0.2:** alte Nummernlisten „(06, 15, 16)“ bzw. „(05, 02, 08, 07, 15, 16)“ durch Kennungen ersetzt; Ursache nur bei belegtem Zusammenhang.
- **B09 Gasversorgungsengpass 2.1.0:** C12 vertieft die Wärme- und Kraftstofffunktion auch bei gasbedingtem Wärmeausfall; B09 bleibt für Gasversorgung, Notfallplanstufen und gasbezogene Maßnahmen maßgeblich.
- **B12 KRITIS-Ausfall 2.1.0:** medizinisch-pflegerische Versorgung und Arzneimittel vorrangig über B11 mit C09/C10; B12 nur bei weiterer eigenständig betroffener kritischer Dienstleistung oder sektorübergreifender Koordinationsfrage.
- **B13 Migrationslage 2.0.2:** C16 kann auch hier Unterbringung und Betreuung vertiefen (Angleichung an C16).
- **B16 Sabotage / Anschlag / Terrorismus 2.1.0:** D6 nach belegten Kopplungen (A.2); eingetretene Folgeausfälle sind Beleg, keine zusätzliche Voraussetzung.
- **B17 Sonstiges 2.1.0:** Liste der Bausteine als bedingt gefasst; C17 als Querschnitt herausgenommen; Abgrenzung für nichtindustriellen Gebäudebrand, Einsturz oder Explosion (B17 mit C02 bzw. C05, nicht automatisch B03 oder B07).
- **C02 Massenbewegungen, Bodenversagen und Gebäudeeinsturz 1.2.0:** B07 nur bei Explosion in Anlagen oder bei Gefahrguttransporten, B16 nur bei behördlich benanntem Vorsatzbezug, sonst B17 (wie C05); `art_hinweis` und Zuordnung im Schema: Ereignisart der belegten Ursache, sonst „Sonstiges“.
- **C04 Vulkanasche 1.1.1:** `anschluss` nennt B04 nur bei gesondert belegtem Erdbeben mit eigenem Deutschlandbezug.
- **C12 Kraftstoff und Wärme 1.1.1:** `lageart` an Abschnitt 1 angeglichen (Wärmeversorgung unabhängig von der Ursache; Gasversorgung selbst B09). Weiterhin Beispielfassung.
- **C16 Evakuierung, Schutzunterbringung und Betreuung 1.1.0:** `art_hinweis`, `anschluss` und Zuordnung im Schema auf die Querschnittsrolle gebracht (Ursachenart des Anlasses ohne Beschränkung auf die Kopfwerte); neuer Absatz „Arbeitsteilung“ mit C09, B10, C13, C14, C15; Offenlassen von D2 und D5 nach Kodierleitfaden.
- **C17 Zivile Verteidigung – zivile Schutz- und Versorgungsfolgen 1.1.0:** `art_hinweis`, `anschluss` und Zuordnung im Schema als Querschnitt unter den passenden Ursachen- und Folgenarten; „Sonstiges“ nur ohne passendes Dach; C17 allein begründet weder Sachverhalt noch Sicherheits- oder Sabotageart.

### Nicht übernommen

- Q17 (C08-Anschlüsse und Katalogauslegung): mit 3.9.0 bereits umgesetzt.
- Q16 (bedingter Beziehungsblock für S1 aus den Kopfangaben): keine Codeänderung; S1 erhält Abschnitt 1 aller SOPs bereits, deshalb sind die Bedingungen dort gepflegt. Übernommen ist nur der vorgeschlagene strukturelle Test (vorhandene Kennungen, keine alten Nummernlisten, Katalogwerte, Statusübersicht); fehlende Gegenverweise werden bewusst nicht geprüft.
- Erweiterung der `art_zuordnung` von C16 und C17 um weitere Katalogwerte; stattdessen Semantik in A.1 Nr. 2 und Nr. 7 geklärt.
- Satz aus Q08, B01 und B06 nicht pauschal gemeinsam zu wählen: ohne Abgleich mit B01 nicht eindeutig; der Übergang Sturm/Wintersturm bleibt einer späteren Prüfung vorbehalten.
- Aufnahme der Kontrastfälle P01–P18 unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.9.0] – 21.10.2026

Fachliche Überarbeitung von C08 ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_C08_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_C08_Vorschlag_2026-10-21“ (F1–F5) und „2026-10-21_KI-LEAD_SOP_C08_PR-Vorschlag“ (T01–T10, 14 Prüfszenarien). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). C08 bleibt Inhaltsgerüst. Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **C08 Tierseuchen und zoonotische Expositionslagen 1.1.0** (bisher 1.0.1):
  - Zuordnung festgelegt: Im Beispielprofil gilt „Gesundheitliche Lage / Epidemie“ mit ausdrücklichem Tiergesundheits- bzw. Zoonosebezug, auch ohne Humanerkrankung. „Sonstiges“ ist aus `art_zuordnung` gestrichen. Eine abweichende Auslegung legt eine übernehmende Stelle profilweit fest, nicht die KI im Einzelfall. Der bisherige offene Punkt zur Katalogauslegung ist damit erledigt.
  - Abschnitt 1:
    - drei Prüfpfade (veterinär, human, Kapazität und Versorgung); frühe Befassung;
    - Auslandsbezug nach A.1 Nr. 6; vektorübertragene Zoonosen (veterinärer Teil C08, humaner Teil C07);
    - Abgrenzung zu Tierbeständen in anderen Lagen;
    - `anschluss` um C07, C09/C10, C13, C14 und C15 ergänzt.
  - Abschnitt 2: R2 präzisiert. Neue Absätze „Veterinär- und Datenprofil“, „Humaner Prüfpfad“, „Schutz und Einsetzbarkeit von Personal“, „Unterstützungs- und Beseitigungspfad“ und „Maßnahmenraum und Versorgung“.
  - Abschnitt 3: D2 nach Kodierleitfaden (Exposition oder Hilfeleistung allein ist keine unmittelbare Betroffenheit); D5 mit Ziel und Prognose; Prüfpunkte D1–D8.
  - Abschnitte 4–5: Darstellung, Ansprechstellen, offene Punkte und Übungsfälle.
- **B11 Gesundheitliche Lage / Epidemie 2.2.0** (bisher 2.1.0): Abschnitt 1 stellt klar, dass Tierseuchen im Beispielprofil über C08 unter dieser Ereignisart geführt werden, auch ohne Humanerkrankung.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.9.0.

### Nicht übernommen

- Neue Links (FLI-Unterseiten, RKI, BAuA/ABAS); Institutionen sind ohne Link genannt, vor Erstverwendung zu prüfen (A.6). Systemnamen der Meldewege sind allgemein gefasst.
- Abweichende Absatzbezeichnungen in Abschnitt 5; es bleibt bei „Ansprechstellen“ und „Offene Punkte“ (A.8.3).
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.8.0] – 21.10.2026

Fachliche Überarbeitung von C14 und C15 ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_C14-C15_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_C14-C15_Vorschlag_2026-10-21“ (F1–F6) und „2026-10-21_KI-LEAD_SOP_C14_C15_PR-Vorschlag“ (F01–F08, S01–S08, 20 Prüfszenarien). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Beide bleiben Inhaltsgerüste. Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **C14 Lebensmittelversorgung 1.1.0** (bisher 1.0.1):
  - Kopf und Abschnitt 1:
    - Die Leistungskette reicht von der Produktion bis zur erreichbaren Abgabe; frühe Befassung ist möglich.
    - Lebensmittelsicherheit und Mengenmangel sind getrennt; lebensmittelbedingte Erkrankungen laufen über B11/C07, Tierseuchen über C08.
    - Neuer Befassungsanlass: Stromausfall mit Folgen für Kühlung, Zahlung oder Abgabe.
    - `art_hinweis` (Prüfhilfe unter der Ursache) und `anschluss` (B08, B10, C13, C16, C09/C10, C08, B11/C07, C17) angepasst.
  - Abschnitt 2: neue Absätze „Bedarfs- und Versorgungsprofil“, „Eignung und Zugang“, „Sichere Nutzbarkeit und Verarbeitung“ sowie „Ersatzversorgung und staatliche Instrumente“ (Reserve vorhanden ≠ freigegeben ≠ geliefert ≠ ausgegeben). R3 und R6: Bestandsreichweite und Nachschubprognose sind keine D5-Dauer.
  - Abschnitte 3–5: Prüfpunkte D1–D8, D5 bis zum Versorgungsziel; Darstellung, Ansprechstellen, Übungsfälle.
- **C15 Abwasser, Sanitärhygiene und kritische Entsorgung 1.1.0** (bisher 1.0.1):
  - Abschnitt 1: drei Prüfpfade (Abwasser, Sanitär, Entsorgung), Tierkörperbeseitigung (C08) einbezogen, frühe Befassung. Abwassermonitoring als Surveillance gehört zu B11. `art_hinweis` und `anschluss` (B02, B08, C08, C09, C13, C16) angepasst.
  - Abschnitt 2: neue Absätze „Funktions- und Bedarfsprofil“, „Sanitärersatz und besondere Bedarfe“, „Einleitung, Kontakt und Folgewirkung“ und „Kritischer Entsorgungspfad“. R6 präzisiert: Wiederherstellung ≠ Freigabe ≠ nutzbare Leistung, keine einheitliche Freigabepflicht.
  - Abschnitte 3–5: Prüfpunkte D1–D8; Offenlassen mit Prognose statt „Freigabeperspektive“; Darstellung, Ansprechstellen, Übungsfälle.
- **Teil A, A.1 Nr. 2:** Route B08 Stromausfall um C14 ergänzt (Kühlung, Kassen- und Bestellsysteme). Recherchehinweis, keine Kaskade.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.8.0.

### Nicht übernommen

- Neue Links (BLE, BfR, BBK, UBA, LAGA); Institutionen sind ohne Link genannt, vor Erstverwendung zu prüfen (A.6).
- Benennung einzelner Gesetze und Reservearten; Aussagen zu Sicherstellungsinstrumenten bleiben allgemein.
- Abweichende Absatzbezeichnungen in Abschnitt 5; es bleibt bei „Ansprechstellen“ und „Offene Punkte“ (A.8.3).
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.7.0] – 21.10.2026

Fachliche Überarbeitung von C05, C06 und C13 ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_C05-C06-C13_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_C05-C06-C13_Vorschlag_2026-10-21“ (F1–F7) und „2026-10-21_KI-LEAD_SOP_C05_C06_C13_PR-Vorschlag“ (U01–U07, K01–K07, L01–L07, 24 Prüfszenarien). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Alle drei bleiben Inhaltsgerüste. Teil A ohne Regeländerung; Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **C05 Großunfall und überörtliche Unfallfolgen 1.1.0** (bisher 1.0.1):
  - Abgrenzung zu B07: Bei Brand, Explosion oder Freisetzung in Anlagen oder bei Gefahrguttransporten ist B07 die Dach-SOP, bei behördlich benanntem Tatbezug B16 (Route B16 → C05 in A.1 Nr. 2); C05 vertieft die Unfallfolgen. `art_zuordnung` um „Industrieunfall / Chemieunfall“ und „Sabotage / Anschlag / Terrorismus“ ergänzt, `art_hinweis` und `anschluss` entsprechend.
  - Abschnitt 1: keine feste Aufnahmeschwelle; Ursache darf offenbleiben; keine Sichtung, Rekonstruktion oder Täterzuschreibung.
  - Abschnitt 2: „Ereignis- und Personenprofil“. Neue Prüffragen R5 Schutzentscheidungen und Ausweichwege, R6 Zielzustand. Absatz „Bedarf und wirksame Hilfe“ mit psychosozialer Notfallversorgung, Personenauskunft und Angehörigeninformation als eigenem Bedarf.
  - Abschnitt 3: D2 nach Kodierleitfaden einschließlich Mindestkodierung; die bisherige Zusatzbedingung „amtliche Zählung“ entfällt. Prüfpunkte D1–D8.
  - Abschnitte 4–5: Darstellung, Ansprechstellen, Übungsfälle.
- **C06 Kampfmittelfund 1.1.0** (bisher 1.0.1):
  - Abschnitt 1: auch fachlich begründeter Verdacht und kleine, aber kritische Maßnahmen. Relevanz für das wöchentliche Lagebild (kapazitätskritische Folgen, Häufung, Nachlauf) und Weitergabe akuten Bedarfs nach A.7.3. Keine Aussagen zu Gefährlichkeit oder technischem Vorgehen. Querverweise C09, C13, C02 (Folgeschäden einer Sprengung).
  - Abschnitt 2: „Schutzentscheidungsprofil“ mit Zeitpunkten und örtlichen Begriffen (A.9.4). Neue Prüffragen R5 Warnung und Hilfen (A.9.3) und R6 Freigaben und Rückkehr. Absatz „Personen und Versorgungskette“.
  - Abschnitte 3–5: Prüfpunkte D1–D8, Darstellung, Ansprechstellen.
- **C13 Verkehr, Transport und kritische Logistik 1.1.0** (bisher 1.0.1):
  - Abschnitt 1: Luftverkehr, Umschlag, Lager und letzte Verteilung einbezogen. C13 dient als Prüfhilfe unter der Ursachen-SOP, ohne automatisch „KRITIS-Ausfall“ zu setzen; `art_hinweis` und „Zuordnung im Schema“ angepasst. Querverweise C02 (Brücken), C04 sowie Auslandsbezug nach A.1 Nr. 6.
  - Abschnitt 2: „Transport- und Bedarfsprofil“. R2 um Flughäfen, Häfen und Umschlag ergänzt. Absätze „Nutzbarer Ersatz“ und „Zeitkritikalität und Kaskade“; der Pufferablauf ist keine D5-Dauer.
  - Abschnitt 3: D2 nach Kodierleitfaden statt nur abgeschnittener Personen; Prüfpunkte D1–D8.
  - Abschnitte 4–5: Darstellung, Ansprechstellen; Verfahren zur Sicherstellung von Verkehrsleistungen nur bei belegter Aktivierung.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.7.0.

### Nicht übernommen

- Neue Links (BBK, Autobahn GmbH, kommunale Verfahren, Hamburger Anweisung). Sie ließen sich nicht prüfen oder sind örtliche Beispiele; Institutionen sind ohne Link genannt (A.6).
- Nennung einzelner Gesetze zur Verkehrssicherstellung; der offene Punkt in C13 bleibt allgemein.
- Abweichende Absatzbezeichnungen in Abschnitt 5; es bleibt bei „Ansprechstellen“ und „Offene Punkte“ (A.8.3).
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.6.0] – 21.10.2026

Fachliche Überarbeitung von C02, C03 und C04 ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_C02-C03-C04_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_C02-C03-C04_Vorschlag_2026-10-21“ (F1–F9) und „2026-10-21_KI-LEAD_SOP_C02_C03_C04_PR-Vorschlag“ (G01–G07, W01–W07, V01–V07, 21 Prüfszenarien). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Alle drei bleiben Inhaltsgerüste. Teil A ohne Regeländerung; Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **C02 Massenbewegungen, Bodenversagen und Gebäudeeinsturz 1.1.0** (bisher 1.0.1):
  - Kopf und Abschnitt 1: „nichtseismisch“ gestrichen. Der Baustein gilt unabhängig von der Ursache und passt damit zur Route B04 → C02 in A.1 Nr. 2 und zum Verweis in B04. Die Ursache wird über B04, B01/B02, B06, B07 oder B16 ergänzt.
  - Abschnitt 1: zwei Prüfpfade (Gelände bzw. Bauwerk) einschließlich Brücken und Verkehrsbauwerken; Relevanz ohne Mindestgröße; frühe Befassung. Neuer Befassungsanlass: Sperrung eines kritischen Verkehrsbauwerks oder einer einzigen Zufahrt. `anschluss` um C13 und C16 ergänzt.
  - Abschnitt 2: „Befundprofil“ (Gefahrenhinweiskarte ≠ aktueller Befund). R4 ohne D8, eine Prognose bleibt Szenario. Neue Prüffrage R7 zu Spezialfähigkeiten für Ortung, Rettung und Sicherung (D4). Absätze „Räume und Schutzfolgen“, „Verlauf und Sekundärfolgen“ und „Freigabe und Nachlauf“.
  - Abschnitte 3–5: Prüfpunkte D1–D8, Beurteilung, Darstellung nach der Dach-SOP der Ursache, Ansprechstellen, Übungsfälle.
- **C03 Weltraumwetter und Störungen von Navigation und Zeitreferenz 1.1.0** (bisher 1.0.1):
  - D6 an den Kodierleitfaden angeglichen: belegte Kopplung statt „nur belegte Störungen“.
  - Abschnitt 1: frühe Befassung; Messung, Modell, Exposition und Dienststörung getrennt; keine Ursachenzuschreibung aus zeitlicher Koinzidenz. `anschluss` um C11, C13 und B14/B15 nach Befund ergänzt.
  - Abschnitt 2: „Warn- und Messprofil“ (Produktart, Gültigkeit, Zeitzone, keine Umrechnung von Skalen), „Funktionsprofil“ und „Ersatz und Tragfähigkeit“ (unabhängige Redundanz).
  - Abschnitte 3–5: Prüfpunkte D1–D8 mit Verweis auf das Kurzbeispiel Weltraumwetter im Kodierleitfaden, Darstellung, Ansprechstellen. Offener Punkt: BKG-Einstieg in R1 prüfen.
- **C04 Vulkanasche 1.1.0** (bisher 1.0.1): Status-Text wie bei den übrigen Inhaltsgerüsten statt „nur nach konkretem Bedarf ausarbeiten“.
  - Abschnitt 1: frühe Befassung; Asche in Flughöhe, bodennahe Asche, Gase und Aerosole getrennt; deutscher Bezug auch über ausländische Luftverkehrs- oder Lieferwege. `anschluss` um C09/C10 und B11 ergänzt.
  - Abschnitt 2: „Asche- und Vorhersageprofil“ (zuständiges VAAC, Höhenbereich, Gültigkeit). R1 präzisiert. Neue Prüffragen R4 bodennahe Exposition, R5 Verkehrs- und Betriebsentscheidung, R6 Zielzustände. Absätze „Luftverkehrsstatus“ (Advisory ≠ Beschränkung ≠ Betreiberentscheidung) und „Versorgungspfad“.
  - Abschnitte 3–5: Prüfpunkte D1–D8, Offenlassen achsenbezogen statt pauschal, Darstellung, Ansprechstellen.
- **Alle drei:** Darstellung „nach der passenden Dach-SOP bzw. B17“ statt nur „nach B17“.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.6.0.

### Nicht übernommen

- Neue Links (BKG-Seiten, ESA, NOAA, VAAC, EASA, Landesdienste). Sie ließen sich bei der Bearbeitung nicht aufrufen; Fachdienste sind ohne Link genannt, der BKG-Einstieg ist als offener Punkt vorgemerkt (A.6).
- Feste Warn-, Konzentrations-, Toleranz- oder Größenschwellen sowie Regelungen aus früheren Ascheereignissen.
- Abweichende Absatzbezeichnungen in Abschnitt 5; es bleibt bei „Ansprechstellen“ und „Offene Punkte“ (A.8.3).
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.5.0] – 21.10.2026

Fachliche Überarbeitung von C09 und C10 ohne konkreten Anlassfall nach dem konsolidierten Vorschlag „SOP-LEAD_C09-C10_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_C09-C10_Vorschlag_2026-10-21“ (C09-01 bis C10-05) und „2026-10-21_KI-LEAD_SOP_C09_C10_PR-Vorschlag“ (M01–M08, A01–A08, Prüfszenarien C09-01 bis C10-11). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Beide Bausteine bleiben Inhaltsgerüste. Teil A ohne Regeländerung; Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **C09 1.1.0** (bisher 1.0.1), neuer Titel „Medizinische und pflegerische Versorgungslage und MANV-Folgen“ (bisher „Nichtinfektiöse medizinische Versorgungslage und MANV-Folgen“). Kennung `c09` und `bisherige_ids` sind unverändert.
  - Abschnitt 1: Abgrenzung nach Versorgungsfunktion statt nach Ursache, passend zu C07 1.1.0 und den Routen in A.1 Nr. 2 (B05, B08 → C09). Bei Infektionsgeschehen bleiben B11 und C07 maßgeblich. Einbezogen sind ambulante und häusliche Versorgung sowie frühe Befassung. Die MANV-Einstufung wird von der zuständigen Stelle übernommen. Querverweise C05, C07, C10, C11, C12, C16, B15 und C17. Neue Befassungsanlässe: Abmeldung von Notaufnahmen oder Fachgebieten; Gefährdung häuslich versorgter Menschen.
  - Abschnitt 2: Versorgungsprofil vor der Detailrecherche. R2 und R4 präzisiert, R5 um B15 ergänzt. Neue Prüffrage R7 zur Leistungsfähigkeit des Rettungsdienstes; Hilfsfristen sind keine Radar-Kriterien. Neue Absätze „Bedarfsgruppen und Folgebedarf“, „Verlegung und Evakuierung“ und „Tragfähigkeit und Nachlauf“.
  - Abschnitt 3: Prüfpunkte D1–D8 ausformuliert, ohne neue Achsenregel; Offenlassen präzisiert.
  - Abschnitt 4: Darstellung je Analysefeld, Kernaussage, Neubewertung; der Abschluss ist nicht an das Ende des MANV-Alarms gebunden.
  - Abschnitt 5: Ansprechstellen; offene Punkte mit Pflegeauftrag und Übungsfällen.
- **C10 1.1.0** (bisher 1.0.1):
  - Kopf: `lageart` nennt alle Produktgruppen einschließlich Impfstoffen, Blutprodukten und medizinischen Gasen. `anschluss` lautet jetzt „B11, C09; B12 bei belegtem Dienstleistungsausfall; C13 bei Transport- und Kühlkettenbezug; C17 nach konkretem Bezug; B17 nur begründet“ statt „B11, B17“.
  - Abschnitt 1: Ursachen und frühe Befassung. Ein lokaler Mangel ist auch ohne Datenbankeintrag möglich; fehlende zugelassene Therapie ist kein Lieferengpass. Befassungsanlässe nach Produktgruppe (BfArM, PEI).
  - Abschnitt 2: Produkt- und Bedarfsprofil. R1 nach Produktgruppe und Quellenabdeckung, PEI ergänzt. R5 mit Apotheken und Blutspendediensten. Neue Prüffrage R7 zu staatlichen und institutionellen Reserven (vorhanden ≠ abgerufen ≠ zugeteilt ≠ eingetroffen, A.7.4). Neue Absätze „Nutzbarkeit und Alternativen“, „Reichweite und Wiederherstellung“ und „Rechtliche und behördliche Maßnahmen“.
  - Abschnitt 3: Prüfpunkte D1–D8; D5 bis zum Versorgungsziel statt Lieferprognose. Absatz zu Beurteilung und Tendenz.
  - Abschnitt 4: Darstellung je Analysefeld; die Löschung eines Datenbankeintrags ist keine Entwarnung.
  - Abschnitt 5: Ansprechstellen; offene Punkte zu Rechercheeinstiegen und Übungsfällen.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.5.0.

### Nicht übernommen

- Neue Links zu BBK, PEI und BfArM-Unterseiten. Sie ließen sich bei der Bearbeitung nicht aufrufen; Institutionen sind ohne Link genannt und vor Erstverwendung zu prüfen (A.6).
- Benannte staatliche Reserveprogramme, weil ihr aktueller Stand nicht belegt ist; R7 in C10 bleibt allgemein.
- Feste Kapazitäts-, Autarkie-, MANV- oder Therapieschwellen sowie produktspezifische Rechtsgrundlagen.
- Abweichende Absatzbezeichnungen in Abschnitt 5 („Ansprechstellen und Recherchepfad“, „Offene Punkte und Pflege“). Es bleibt bei „Ansprechstellen“ und „Offene Punkte“ (A.8.3).
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget.

## [3.4.0] – 21.10.2026

Fachliche Überarbeitung von B11 und C07, dazu eine Präzisierung in Teil A, nach dem konsolidierten Vorschlag „SOP-LEAD_B11-C07_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_B11-C07_Vorschlag_2026-10-21“ (B11-01 bis UI-01, A-01) und „2026-10-21_KI-LEAD_SOP_Infektionslagen_Ebola_PR-Vorschlag“ (E01–E11, Prüfszenarien A01–A12). Anlass ist eine Beispielmeldung vom 21.10.2026 zum Ebola-Ausbruch (Bundibugyo-Virus) in Afrika mit erstem Fall in Nigeria (Lauf `20261021-201106-r7ay`). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **B11 Gesundheitliche Lage / Epidemie 2.1.0** (bisher 2.0.1):
  - Abschnitt 3: Die Ausnahme, nach der die Tendenz bei Auslandsgeschehen den internationalen Frühwarntreiber abbilden konnte, ist gestrichen. Sie widersprach Kodierleitfaden Abschnitt 4; die KI hatte den Konflikt im Lauf selbst gemeldet. Die Tendenz bleibt auf den Referenzraum bezogen. Der Frühwarntreiber steht im Text und in `Neubewertung bei:` und trägt eine Tendenz nur bei belegter Änderung der Lage in Deutschland mit. D8 bei Auslandsgeschehen ohne deutsche Beobachtungsbasis offen.
  - Abschnitt 2: neue Absätze „Abgleich epidemiologischer Angaben“ (Fallkategorie, Zählweise, Datenstand, neueste Ausgabe) und „Erregerspezifische Fachangaben“ (keine Übertragung von verwandten Erregern; fehlende zugelassene Therapie ist kein Engpass nach C10). R5 nennt die nationale IGV-Anlaufstelle (GMLZ im BBK, § 3 IGV-DG).
  - Abschnitt 1: Befassungsanlass „Aufnahme oder Verdachtsabklärung bei hochpathogenem Erreger, auch nach medizinischer Evakuierung“; Monitoring mit dem wöchentlichen Bedrohungsbericht des ECDC.
  - Abschnitt 5: IGV-Anlaufstelle als Ansprechstelle; offene Punkte mit Kalibrierfall.
- **C07 Infektionslagen 1.1.0** (bisher 1.0.1, weiterhin Inhaltsgerüst):
  - Abschnitt 1: „Deutschlandbezug und Sachverhaltsschnitt“. Der Bezug wird nach Zeitstatus gekennzeichnet. Ein neuer Staat begründet keinen eigenen Sachverhalt; getrennt geführt wird nur ein deutscher Bezugsgegenstand mit eigenem Prüfauftrag, eigenen Maßnahmen oder eigenen Fortschreibungsbedingungen (A.1 Nr. 6). Neuer Befassungsanlass bei hochpathogenem Erreger.
  - Abschnitt 2:
    - R2 mit Pfadarten nach Deutschland und dem IGV-Meldeweg. Nicht veröffentlichte Kontaktdaten belegen weder Pfad noch Nullbefund.
    - Neue Absätze „Fall- und Transferstatus“ (Transfer ≠ weiterer Fall; Zählbasis vor Widerspruch) und „Reise-, Expositions- und Übertragungskette“ (Einreiseland ≠ Infektionsort; Staatsangehörigkeit kein Ersatzindikator).
    - R6 präzisiert, dazu die Absätze „Versorgungs- und Transferpfad“ und „Fristen und Neubewertung“ (kein Enddatum ohne belegten Fristbeginn; Neubewertungsindikatoren mit der deutschen Entscheidung verknüpft).
  - Abschnitt 3: Prüfpunkte zu D1/D2, D3 (gleiche Funktion, gleicher Wert über Sachverhalte), D4, D6 und D7 (keine feste Stufe; nicht veröffentlichte Daten und eigene Recherchegrenzen zählen nicht). Die Tendenz richtet sich nach B11.
  - Abschnitt 4: Ausland, deutsche Vorsorge und deutsche Wirkung getrennt darstellen; Einzelfallangaben auf das für Pfad oder Maßnahme Nötige beschränken.
  - Abschnitt 5: Ansprechstellen; offene Punkte zu Meldewegen und Kalibrierfall.
- **Teil A, A.4:** Empfehlungen ohne belegten Termin nennen eine Bedingung oder den nächsten Prüfanlass, nicht „offen“. Gültigkeitsstand: Sammelmappe 3.4.0, Darstellungsdatei Profilversion 1.13.0.

### Nicht übernommen

- Eine feste Pflicht, die Tendenz bei Auslandslagen leer zu lassen, und feste D7-Stufen für Auslandsausbrüche.
- Ein zwingender Zusammenschluss aller Teilgeschehen zu einem Sachverhalt. Getrennte Sachverhalte bleiben nach deutschem Bezugsgegenstand zulässig.
- Eine starre Beobachtungsdauer für alle Infektionslagen, konkrete Therapie- oder Produktstände sowie Links zu neuen Rechercheeinstiegen. Der ECDC-Bedrohungsbericht ist vor Erstverwendung zu prüfen (A.6).
- Änderungen an Arbeitsanweisungen oder an der S1-Auswahl; sie stehen als offener Punkt in B11.
- Aufnahme der Prüfszenarien unter `evaluation/faelle/`; nur mit gesondertem Auftrag und Budget (evaluation/README.md).

## [3.3.0] – 21.10.2026

Fachliche Überarbeitung von B15 und C11 sowie zwei Präzisierungen in Teil A nach dem konsolidierten Vorschlag „SOP-LEAD_B15-C11_Vorschlag_konsolidiert_2026-10-21“. Er führt zwei Vorschläge zusammen: „SOP-LEAD_B15_Vorschlag_konsolidiert_2026-10-21“ (B15-01 bis B15-18) und „2026-10-21_KI-LEAD_SOP_Cyber-Vorsorgelage_PR-Vorschlag“ (S01–S11, Prüfszenarien K01–K10). Anlass ist eine Beispielmeldung vom 21.10.2026 (realer Anlass, fiktive Stelle): Nach einer Warnung zu kritischen PHP-Schwachstellen wurden Webangebote einer Landesverwaltung vorsorglich abgeschaltet; eine Kompromittierung oder der Ausfall kritischer Dienstleistungen war nicht belegt. Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte). Achsenregeln, Stufentexte, Quellenkategorien, Kennsätze und Schema sind unverändert.

### Geändert

- **B15 Cyberangriff / IT-Sicherheitsvorfall 2.1.0** (bisher 2.0.1):
  - Abschnitt 1: Neben Vorfällen sind begründete Vorsorgelagen nach A.1 Nr. 1 ausdrücklich erfasst. Schutzabschaltungen werden mit ihren Funktionsfolgen auch ohne Angriffsnachweis erfasst; die Bezeichnung nennt die Vorsorgelage. Eine Warnung allein eröffnet keine Befassung. Verweis auf C11 bei berührten Behörden- oder Polizeiauftritten, Notruf, Leitstellen oder Warnwegen; B12 erst bei belegtem Ausfall einer kritischen Dienstleistung. Neuer Befassungsanlass „vorsorgliche Abschaltung“; das Monitoring nennt das beobachtete Signal (A.10.1).
  - Abschnitt 2: Statusprofil vor der Detailrecherche: Warnung, konkrete Verwundbarkeit, Angriffshinweise, Schutzmaßnahme, Leistungsfolge. R1 mit Hinweisseite der betroffenen Stelle als Eigenbeleg und Schutzabschaltung als Maßnahme; R2 mit Hersteller-Sicherheitshinweis (P, begründete Abweichung nach A.3). Neu am Tabellenende: R7 Evidenz zur Ausnutzung, R8 gemeinsame Abhängigkeit, R9 Abhilfe und Wiederanlauf. R1–R6 sind nicht umnummeriert.
  - Abschnitt 3: Prüfpunkte zu D1 (Wirkungsraum einer konkret bezeichneten Leistung), D3 (Betrieb und Abschaltungsentscheidung getrennt, „D3 Vorsorge“), D5 (Wiederfreischaltung ≠ vertrauenswürdiger Wiederanlauf), D6 (konkrete funktionale Kopplung, keine Vorgabestufe) und D7 (Ausnutzungsangaben erst nach Abgleich von Gegenstand, Zeit und Raum). CVSS und BSI-Warnstufe werden nicht in Beurteilung, Radarwerte oder Tendenz umgerechnet; ungeklärte Betroffenheit trägt allein weder eine höhere noch eine niedrigere Stufe. Neuer Absatz „Zeitfenster“.
  - Abschnitt 4: Darstellung nach Statusprofil, Ersatzwegen (C11) und Parallelfolgen (A.7.1). Neu ist der Absatz „Übergreifender Erkenntniswert“; Patch-Kontrollen werden dem Katastrophenschutzressort nicht ohne Beleg zugeschrieben.
  - Abschnitt 5: Ansprechstellen ergänzt; offene Punkte mit Kalibrierfall, Rückblick nach A.8.3 und der Klärung der Herstellerangaben.
  - Kopf: Fassung, Stand, Quellenprüfung und Prüfauslöser fortgeschrieben.
- **C11 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit 1.1.0** (bisher 1.0.1, weiterhin Inhaltsgerüst):
  - Absatz „Öffentliche Informationsversorgung“: Ein ausgefallener Behörden- oder Polizei-Webauftritt belegt keine Störung von Notruf, Leitstellen, BOS-Funk oder Warnung.
  - Neuer Befassungsanlass; `lageart`, `art_hinweis` und „Zuordnung im Schema“ abgestimmt. Eine Verwendung als Prüfhilfe zu B15 erweitert die Ereignisart nicht um „KRITIS-Ausfall“.
  - Funktions- und Ersatzwegeprofil vor den Prüffragen; Darstellung je Funktion; offene Punkte zu erforderlichen Informationsangeboten, Ersatzkanälen und Meldewegen.
- **Teil A:**
  - A.3: neuer Absatz „Teilzugriff“. Suchindex-Auszüge und Vorschauen belegen nur ihren sichtbaren Inhalt; eigene Zugriffslücken begründen weder D7 noch Verschärfung. Die Regel stimmt mit Arbeitsanweisung Erfassung, Abschnitt Quellen, und Kodierleitfaden Abschnitt 5 überein.
  - A.4: neuer Absatz „Fristgrundlage“. „Unverzüglich“ ergibt kein Datum im Kennsatz `Handlungsrelevant bis:`; eigene Fristen werden als Vorschlag der meldenden Stelle gekennzeichnet. Das Kennsatzformat ist unverändert.
  - Gültigkeitsstand: Sammelmappe 3.3.0.

### Nicht übernommen

- Feste oder regelhafte Radarwerte und Beurteilungen für den Anlassfall („in der Regel peripher“, „in der Regel erheblich“) sowie die Gleichsetzung „landesweites Angebot = landesweiter Wirkungsraum“, weil sie die Kodierregeln vorwegnehmen würden.
- Ein Kalenderdatum für „unverzüglich“ im Kennsatz; ersetzt durch A.4 „Fristgrundlage“.
- Neue Rechercheeinstiege ausländischer Behörden und feste Kritikalitätsschwellen als Monitoring-Signal.
- Eine Klarstellung der Quellenkategorie für Herstellerangaben in Teil A und im Kodierleitfaden; sie bleibt offener Punkt in B15, weil sie weitere SOPs betrifft und nach A.10.2 gemeinsam fortzuschreiben ist.
- Aufnahme der Beispielmeldung und der Prüfszenarien K01–K10 in `beispiele/` bzw. `evaluation/faelle/`; nur nach gesonderter Entscheidung und Budget (evaluation/README.md).

## [3.2.4] – 21.10.2026

Redaktionelle Fortschreibung des Gültigkeitsstands (dritte Stelle nach der Versionierungsregel), technische Metadatenänderung. Regeln, SOPs, Bausteine, Kennsätze und Satzanfänge sind inhaltlich unverändert.

### Geändert

- **Gültigkeitsstand (Teil A):** Sammelmappe 3.2.4; Darstellungsdatei `meldung.ui.json` mit Profilversion 1.11.0. Die Darstellungsdatei enthält neu den Abschnitt `feldhilfen` (LEAD-Eingabehilfen), der nur vorhandene Satzanfänge und Kennsätze als Vorlagen anbietet; die Regel „eine Zeile je Kennsatz, mehrere Fristen in derselben Zeile, die früheste zuerst“ (A.4) gilt unverändert.

## [3.2.3] – 21.10.2026

Redaktionelle Fortschreibung des Gültigkeitsstands (dritte Stelle nach der Versionierungsregel). Regeln, SOPs und Bausteine sind inhaltlich unverändert.

### Geändert

- **Gültigkeitsstand (Teil A):** Sammelmappe 3.2.3, Kodierleitfaden 1.2.2 (neues Kurzbeispiel zu D8 bei Auslandslagen, Regeln unverändert).

## [3.2.2] – 21.10.2026

Aufräumen ohne inhaltliche Änderung (dritte Stelle nach der Versionierungsregel). Regeln, SOPs und Bausteine sind unverändert.

### Entfernt

- Ordner `archiv/` mit den Fassungen 1.0.1 und 2.0.1. Die App las sie nie; beide bleiben unverändert im Git-Verlauf abrufbar (Verweise mit Prüfsumme in der Tabelle oben und in der Übersicht `README.md`, Abschnitt „Archiv“).

### Geändert

- Gültigkeitsstand (Teil A): Sammelmappe 3.2.2.

## [3.2.1] – 20.10.2026

Redaktionelle Fortschreibung des Gültigkeitsstands (dritte Stelle nach der Versionierungsregel). Regeln, SOPs und Bausteine sind inhaltlich unverändert.

### Geändert

- **Gültigkeitsstand (Teil A):**
  - Sammelmappe 3.2.1.
  - Darstellungsdatei auf dem Stand der Profilversion 1.9.0.
  - Kodierleitfaden 1.2.1.
  - Arbeitsanweisung Erfassung 1.3.3.
  - Meldungsschema `LEAD-Meldung-v1` als LEAD-Meldevorlage 1.1: `eintritt` und `meldezeitraum` dürfen optional eine Uhrzeit tragen. Die Erweiterung ist abwärtskompatibel und braucht keine Migration (A.10.4).

## [3.2.0] – 20.10.2026

Fachliche Überarbeitung von C12 nach dem konsolidierten Vorschlag „SOP-LEAD_C12_Vorschlag_konsolidiert_2026-10-20“ (Prüfung „KI-LEAD_C12_Pruefung_und_Vorschlag_2026-10-20“, Empfehlungen C12-01 bis C12-15; Entscheidungen E1–E3 wie empfohlen). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte).

### Geändert

- **C12 Kraftstoff- und Wärmeversorgung 1.1.0** (bisher 1.0.1, Inhaltsgerüst):
  - Anwendungsbereich mit dem Leitsatz:
    - Mangelprodukt und räumliche Ausdehnung feststellen.
    - Mengenmangel, Raffinerie- oder Tanklagerausfall, Transport, Strom- oder IT-Ausfall an Tankstellen und Nachfragespitze unterscheiden.
    - Gefährdung trotz rechnerisch ausreichender Landesbestände ist möglich.
    - Maßstab ist der Zeitpunkt bis zum Ausfall einer kritischen Funktion.
  - Prüffragen: R1–R6 mit bisherigem Gegenstand, präzisiert. Neu sind:
    - R7 Produkt, Versorgungsraum und Engpass
    - R8 Restreichweite gegen wirksame Nachversorgung, mit `Handlungsrelevant bis:` und Weitergabe nach A.7.3
    - R9 Ersatzbeschaffung
    - R10 staatliche Maßnahmen: Freigabe der Erdölreserve nach § 12 ErdölBevG, EnSiG und MinÖlAV, WiSiG und MinÖlBewV sowie Gefahrenabwehr, jeweils getrennt
    - R11 verteidigungsbezogene Folgen mit C17 und A.7.4
  - Prüfpfade je Lage als Tabelle: stromlose Tankstellen, regionale Dieselknappheit, bundesweiter Mengenausfall, unmittelbar bedrohte Rettung oder Notstromversorgung, verteidigungsbezogene Lage.
  - D1–D8 konkretisiert (Tankreichweite ist kein D5-Wert); die Darstellung nutzt die vorhandenen Meldungsfelder.
  - Fachgrundlagen mit Kurzbezeichnung: BBK Praxis im Bevölkerungsschutz 18 als Hauptquelle, Nationale Reserve Blackout nur zu Aggregaten.
  - Status „Beispielfassung“ mit Prüfauslösern; damit trägt C12 keine Marke „Inhaltsgerüst“ mehr.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.2.0.

## [3.1.0] – 20.10.2026

Fachliche Überarbeitung von C01 nach dem konsolidierten Vorschlag „SOP-LEAD_C01_Vorschlag_konsolidiert_2026-10-20“ (Review „KI-LEAD_C01_Review_2026-10-20“, Änderungen C01-01 bis C01-15; Entscheidungen E1–E4 wie empfohlen, E4 in neuer Fassung ohne Änderung der App). Zweite Stelle nach der Versionierungsregel (neue fachliche Inhalte).

### Geändert

- **C01 Radiologische / nukleare Lage 1.1.0** (bisher 1.0.1, Inhaltsgerüst):
  - Einordnung nach den Referenzszenarien S0–S15 des ANoPl-Bund (Tabelle 3.4) in Abschnitt 2. Abgedeckt sind:
    - Kernkraftwerke in Deutschland, im grenznahen Ausland, in Europa und außerhalb Europas sowie andere kerntechnische Anlagen und Einrichtungen im In- und Ausland
    - sonstige Tätigkeiten, Transport an Land, Funde und Kontaminationen
    - Satellit oder Raumfahrzeug, Oberflächen- und Meeresgewässer
    - Straftaten mit und ohne Anlagenbezug, Nuklearwaffenexplosion und sonstiger Notfall beim Umgang mit Nuklearwaffen
  - Abschnitt 1 bleibt knapp, weil er bei jedem KI-Lauf in die Auswahl geht.
  - Prüffragen: R1–R9 gemeinsam (R1–R6 mit bisherigem Gegenstand), R10–R17 je Referenzszenario.
  - Weitere Inhalte:
    - Spannungs- und Verteidigungsfall nach Rn. 7 ANoPl-Bund mit Verweis auf C17
    - Lagebild nach § 108 StrlSchG; bei lokalen Notfällen ohne Lagebild bewerten die örtlichen Behörden selbst
    - Messung, Prognose und Bewertung getrennt; Jodtablettenausgabe ist keine Einnahmeaufforderung
    - D1–D8 konkretisiert; Darstellung in den vorhandenen Meldungsfeldern
  - Fachgrundlagen (ANoPl-Bund, StrlSchG) mit Kurzbezeichnung und Fundstelle, ohne nummerierte Quellenkennungen.
  - Status „Beispielfassung“ mit Prüfauslösern; damit trägt C01 keine Marke „Inhaltsgerüst“ mehr.
- **Teil A, A.3:** Die Formatzeile mit Beispielverweisen ist durch einen Verweis auf Kodierleitfaden Abschnitt 5 ersetzt. Die SOP-Dateien enthalten damit keine nummerierten Quellenverweise mehr.
- **Teil A, A.10.1:** neue Redaktionsregel. Fachgrundlagen und Rechercheeinstiege werden mit Kurzbezeichnung und Fundstelle angegeben; nummerierte Quellenverweise sind dem Quellenverzeichnis der Meldung vorbehalten.
- **Gültigkeitsstand (Teil A):** Sammelmappe 3.1.0.

## [3.0.1] – 20.10.2026

Redaktionell; Abstimmung mit dem geänderten SOP-Nachweis der App (Vorschlag „KI-LEAD_SOP_Integration_Vorschlag_konsolidiert_2026-10-20“, SOP-CODE-02).

### Geändert

- **Gültigkeitsstand (Teil A):** Sammelmappe 3.0.1, Profilversion 1.6.1, Arbeitsanweisung Erfassung 1.3.2.
- **A.4 Entstehung:** `_entstehung` führt die beigefügten SOPs und Bausteine (von der App aus der zusammengestellten Anfrage gesetzt) statt „angewandter“; das belegt den Kontext, nicht schon die fachliche Anwendung.

## [3.0] – 19.10.2026

Strukturfassung nach dem Strukturvorschlag „SOP-LEAD_Strukturvorschlag_Teil-B-C_2026-10-19“ (S01–S12), abgeglichen mit dem Strukturvorschlag v2.1 (Register mit 34 Einheiten), freigegeben am 19.10.2026. **Keine fachlichen Änderungen:** Die Texte aller 34 Abschnitte sind wortgleich übernommen (per Skript geprüft, einschließlich der Zuordnung jedes Querverweises); geändert sind Dateischnitt, Überschriften, Kopfdaten, Prüffragen-IDs und Querverweise. Erste Stelle nach der Versionierungsregel (geänderte Struktur); der Vorschlag v2.1 nannte 2.1.

### Geändert

- **Dateischnitt:** Teil A in `A_Gemeinsame-Regeln.md`, die Dach-SOPs in `teil-b/`, die Bausteine in `teil-c/`, je eine Datei mit genau einem Anker am Anfang. Pflegequelle sind die Einzeldateien; die Lesefassung wird daraus erzeugt. Übersicht und Konkordanz in `README.md` (ersetzt Mappenkopf und Inhaltsverzeichnis, die vor dem ersten Anker standen und die KI nie erreichten).
- **Kennungen:** Teil B B01–B17 (Zahl wie bisher, Reihenfolge des Ereigniskatalogs); Teil C lückenlos C01–C17 nach Register v2.1 statt der Review-Kennungen N01–N18 mit Lücke N14. Leseblöcke (nur Navigation): Besondere Ereignis- und Gefahrenlagen C01–C06, Gesundheit und medizinische Versorgung C07–C10, Versorgung, Kommunikation und Logistik C11–C15, Lageübergreifende Querschnitte C16–C17. Technische IDs `b01`–`b17`, `c01`–`c17` mit den früheren IDs in `bisherige_ids`; Teil A bleibt `teil-a`.
- **Feste Kennungen (A.10.1):** keine Neunummerierung nach Fassung 3.0; neue Einheiten erhalten die nächste freie Nummer (B18, C18), stillgelegte Kennungen werden nicht wieder belegt.
- **Abschnittsschema:** in allen 34 Abschnitten „1. Anwendungsbereich und Befassungsanlässe“, „2. Erfassung: Prüffragen“, „3. Auswertung: Prüfpunkte“, „4. Darstellung“, „5. Ansprechstellen und Pflege“; Satzanfang „Offene Punkte“ statt „Inhaltlich offene Punkte“. Abschnitt 5 heißt nicht „Pflege und Zuständigkeit“ (v2.1), weil er Ansprechstellen und offene Punkte enthält und „Zuständigkeit“ mit D3 und A.1 Nr. 4 verwechselt würde.
- **Prüffragen:** Begriff „Prüffragen“ statt „Recherchebausteine“ bzw. „Recherchezeilen“; IDs nur „R1“ ff.; Teilprofile als Zwischenüberschriften mit eigener Tabelle (B05: Teilprofil 5a R1–R4, 5b R5–R8; C07: Auslandsprofil R1–R2, lokales Profil R3–R4, beide Profile R5–R6). Zitierweise „C17, Abschnitt 3“ und „C17/R2“.
- **Kopfdaten:** einheitliche Schlüsselfolge mit `kennung`, `typ` (Dach-SOP, Themenbaustein, Querschnittsbaustein), `bausteintyp` (Bestand, wortgleich), `lesegruppe`, `bisherige_kennung` und `bisherige_ids`; Teil B mit `status: "Beispielfassung"`. Fassungen redaktionell: SOPs 2.0 → 2.0.1, Bausteine 1.0 → 1.0.1.
- **Querverweise:** alle Verweise „SOP 07“, „N06“ und die Routentabelle in A.1 Nr. 2 auf B- und C-Kennungen umgestellt (Ausnahme: Review-Kennung N14 im Gültigkeitsstand).
- **Teil A:** Gültigkeitsstand (Sammelmappe 3.0, Profil 1.6.0, Arbeitsanweisungen 1.3.1, 2.0.1, 2.1.1); A.10.1 um Gliederung, Leseblöcke, Zitierweise und feste Kennungen ergänzt; A.8.3 nennt „Offene Punkte“.
- **Archiv:** Fassungen 1.0.1 und 2.0.1 unverändert unter `archiv/`; aktive Dateinamen ohne Versionsnummer.

### Konkordanz Teil C

| bisher | neu | Typ | Leseblock |
|---|---|---|---|
| N01 | C01 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N09 | C02 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N15 | C03 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N18 | C04 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N16 | C05 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N17 | C06 | Themenbaustein | Besondere Ereignis- und Gefahrenlagen |
| N11 | C07 | Themenbaustein | Gesundheit und medizinische Versorgung |
| N10 | C08 | Themenbaustein | Gesundheit und medizinische Versorgung |
| N04 | C09 | Themenbaustein | Gesundheit und medizinische Versorgung |
| N12 | C10 | Themenbaustein | Gesundheit und medizinische Versorgung |
| N02 | C11 | Themenbaustein | Versorgung, Kommunikation und Logistik |
| N05 | C12 | Themenbaustein | Versorgung, Kommunikation und Logistik |
| N06 | C13 | Themenbaustein | Versorgung, Kommunikation und Logistik |
| N07 | C14 | Themenbaustein | Versorgung, Kommunikation und Logistik |
| N08 | C15 | Themenbaustein | Versorgung, Kommunikation und Logistik |
| N03 | C16 | Querschnittsbaustein | Lageübergreifende Querschnitte |
| N13 | C17 | Querschnittsbaustein | Lageübergreifende Querschnitte |

Teil B: 01–17 → B01–B17 (gleiche Zahl).

## [2.0.1] – 19.10.2026

Abstimmung mit den neu gefassten Arbeitsanweisungen (Prüfung des Fachreviews der Arbeitsanweisungen vom 19.10.2026).

### Geändert

- **Gültigkeitsstand (Teil A):** Arbeitsanweisungen Erfassung 1.3, Verdichtung 2.0 und Kurzfassung 2.1, Darstellungsdatei mit Profilversion 1.5.0; der Vermerk „Angleichung an Kodierleitfaden 1.2 ausstehend“ zur Verdichtung entfällt.
- **A.4 Maßnahmenstatus:** um „angefordert“ und „wirksam (Wirkung belegt)“ ergänzt; eine angekündigte oder umgesetzte Maßnahme ist nicht schon wirksam [E08].
- **A.4 Kennsatz `Handlungsrelevant bis:`:** festes Format „TT.MM.JJJJ HH:MM – Aufgabe, Adressat – Bedingung; Grundlage: Quelle“, je Sachverhalt eine Zeile, früheste Frist zuerst; Beispiel in der Kennsatztabelle angepasst. Redaktionscheck und Management Summary werten Datum, Uhrzeit und Bedingung aus [O05].

## [2.0] – 19.10.2026

Konsolidierte Fassung auf Grundlage des fachlichen Änderungsprogramms „SOP-LEAD_Konsolidiert_2026-10-19.json“ (Formatversion 2.0.0, Prüfstand Commit `89bfa77`, SOP-Datei SHA-256 wie oben). Das Programm führt 64 Empfehlungen aus zwei vorangegangenen Reviews zusammen; die Kennungen in eckigen Klammern verweisen darauf. Alle 17 Ereignis-SOPs bleiben erhalten, Anker und Abschnittsnummern A.1–A.8 sind unverändert, damit Verweise in Darstellungsdatei, Arbeitsanweisungen und App gültig bleiben. Keine Schemaänderung: neue Inhalte laufen unter den bestehenden Ereignisarten.

### Neu

- **Teil C – Themen- und Querschnittsbausteine** (je Status „Inhaltsgerüst“, Version 1.0), keine eigenen Ereignisarten; Zuordnung über `art_zuordnung` statt `art_vorschlag`, damit die App sie nicht automatisch zu einer Ereignisart hinzufügt: N01 Radiologische / nukleare Lage [N01] · N02 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit [N02] · N03 Evakuierung, Schutzunterbringung und Betreuung [N03] · N04 Nichtinfektiöse medizinische Versorgungslage und MANV-Folgen [N04] · N05 Kraftstoff- und Wärmeversorgung [N05] · N06 Verkehr, Transport und kritische Logistik [N06] · N07 Lebensmittelversorgung [N07] · N08 Abwasser, Sanitärhygiene und kritische Entsorgung [N08] · N09 Massenbewegungen, Bodenversagen und Gebäudeeinsturz [N09] · N10 Tierseuchen und zoonotische Expositionslagen [N10] · N11 Infektionslagen: Auslandsausbruch und lokale Häufung [N11] · N12 Arzneimittel und kritisches medizinisches Material [N12] · N13 Zivile Verteidigung: zivile Schutz- und Versorgungsfolgen [N13] · N15 Weltraumwetter und Störungen von Navigation und Zeitreferenz [N15] · N16 Großunfall und überörtliche Unfallfolgen [N16] · N17 Kampfmittelfund mit Räumung oder Versorgungsauswirkung [N17] · N18 Vulkanasche [N18].
- **Gültigkeitsstand** (Kompatibilitätsmatrix mit Pflegeverantwortung und nächster Prüfung, einschließlich aller drei Arbeitsanweisungen) am Anfang von Teil A, damit er jeder KI-Anfrage beiliegt [A17].
- **A.1 Nr. 4 Rollenprofil** „übergreifende Redaktion“ und „zuständige meldende Stelle“ [A02]; **Nr. 6 Auslandsbezug** [A20]; **Nr. 7 Aufbau und Bausteine**; Tabelle typischer Ursache-Folge-Routen als Prüfhinweis in Nr. 2 [A20].
- **A.3 Zeitbezug und Quellenfrische, Bestätigungsgrad** [A05], **Zählregeln** [A12], **Quellenkategorie B (Betreiber)** mit Priorität A > B > W > M > P und Zuordnungsregeln [A04, Quellenmodell], Rechercheeinstiege „Lagemeldungen“ und „Betreibermeldungen“ statt 48-fach wiederholter Quellenformeln [A22].
- **A.5 Fachliche Prüfung und Freigabe** einschließlich Regeln für KI-gestützte Entwürfe [A09].
- **A.7.3** zeitkritische Weitergabe unmittelbar gefährlicher Hinweise auch ohne Kennsatz und ohne fertiges Lagebild [A08]; **A.7.4 Mehrfachlagen und gemeinsame Engpassressourcen** [A16, N14]; **A.7.5 Notbetrieb der Lagebildredaktion** [P01].
- **A.9 Querschnittsprüfungen** als kurze Relevanzprüfung: Bedarfsdeckung [A06], besondere Bedarfe und Zugänglichkeit [A07], Warnlage und Erreichbarkeit [A18], Lagefeststellungen und tatsächlich wirksame Hilfe [A19], Falsch- und Desinformation [A21].
- **A.10 Aufbau, Gültigkeit und Pflege** mit Pflegemodell [A17, A22, X05], Kalibrierung und Übung der Radarkodierung [P02] und Katalogpflege [S18].
- YAML-Kopf je SOP: `pruefausloeser` [A17].

### Geändert

- **Kodierregeln A.2** (gleichlautend im Kodierleitfaden 1.2): „Konservativ einstufen“ ersetzt durch „Keine unbelegte Präzision“ mit Mindestkodierung [A03]; D3 ausgewählte Funktion [A15]; D4 nur ereignisbezogene Unterstützung, keine regulären Lieferungen [A15]; D5 als definierte Prognoseausnahme [A13]; D7 ohne pauschale Vorhersageregel, mit fachlichen Lücken zu Leistungsgrad, Integrität, Stoffidentität und Wiederanlauf [A14, S16]; D8 belegt stabiler Verlauf = 0 [S09, S10]; D6 steigt nicht allein mit der vergangenen Ausfalldauer [S08].
- **A.1 Nr. 1** frühe Befassung vor Schadenseintritt ausdrücklich zulässig, Ist-Achsen bleiben offen [A01].
- **A.4** Maßnahmenstatus (geplant, angeordnet, begonnen, umgesetzt, beendet) und adressierte Empfehlungen getrennt; „Keine Meldung eigener Einsatzmaßnahmen“ auf das Rollenprofil bezogen [A11]; Teilentspannung zulässig [S10].
- **A.8.1** Fortschreibung gebundener Fähigkeiten und Offenlegung geänderter D3-Funktion [A16, A15]; **A.8.3** Rückblick mit Änderung, Verantwortlichem und Prüftermin [A16].
- **Alle 17 SOPs:** Version 2.0, Stand 19.10.2026, Prüftermine im Format TT.MM.JJJJ; „Monitoring“ mit beobachtetem Signal [A22]; Verweis auf A.4, A.5 und A.9 statt wiederholter Standardsätze [A22].
- **SOP 01** Vorwarnlagen und Abgrenzung zu SOP 02 bei Sturzfluten (Prognose genügt); exponierte Gruppen (R7) [S01].
- **SOP 02** drei Recherchepfade (Fluss, pluvial/Sturzflut, Sturmflut); Vorwarnung vor Ausuferung; Deiche und Stauanlagen nur nach Fachbewertung, Deichverteidigung kein Verschärfungsbeleg; Abwasser, Heizöl, Einrichtungen; Regel zu landesspezifischen Meldestufen [S02].
- **SOP 03** Geltungsbereich Vegetations-, Moor- und Flächenbrände unter der Katalogart „Waldbrand“; WBI und GLFI als Gefahrenpotenzial, nicht D8; Fernerkundung differenziert; keine pauschale D5-Dauer [S03].
- **SOP 04** Wahrnehmbarkeit eröffnet nur die Prüfung; Auslandsbeben mit getrennten Betrachtungsgegenständen; Verknüpfung mit N09 [S04].
- **SOP 05** Teilprofile 5a Hitzeperiode und 5b Trockenheit/Niedrigwasser; Hitzemortalität als modellbasierte Schätzung; Hitzeaktionspläne, Kühlwasser und Niedrigwasserlogistik [S05].
- **SOP 06** extreme Kälte ohne Schnee oder Sturm im Geltungsbereich; Wärmeschutzorte; Schneelast und Lawinen (R7) [S06].
- **SOP 07** industrielle Großbrände und Explosionen ohne nachgewiesene Freisetzung bei überörtlichem Bedarf; TUIS auch bei Lagerunfällen; analytische Fachunterstützung; fehlende Stoffidentifikation kann D7 tragen; radiologische Lagen nach N01 [S07].
- **SOP 08** Betriebsfähigkeit der Ersatzversorgung statt Nennlaufzeit, keine pauschalen 24-/72-Stunden-Annahmen; Netzwiederaufbau und Anlaufstellen (R7); angekündigte Lastabschaltung als Vorwarnung [S08].
- **SOP 09** D8 ohne hypothetische Kipprisiken; Fernwärme (R6) und Anlagenstörungen; amtliche Stufe stets aktuell prüfen [S09].
- **SOP 10** D8 = 0 bei belegter Stabilität; Teilentspannung vor vollständiger Freigabe; versorgungswirksame Ersatzversorgung (Menge, Qualität, Verteilung, Zugang); Einrichtungen und Löschwasser (R7) [S10, S11].
- **SOP 11** fachbehördlich relevante Einzelereignisse; Versorgungslagen ohne Infektion; Surveillance- und Kapazitätsquellen (R6); Patientenverlegung (R7); internationale Warnkategorie ist keine deutsche Lagefeststellung [S12].
- **SOP 12** Funktionsprofil vor der Detailrecherche; funktionale Prüfung unabhängig vom regulatorischen Betreiberstatus; Bausteine N02, N05–N08 [S13].
- **SOP 13** D2 bedarfsbezogen; aktuelle Aufnahmen und betreibbare Kapazitäten vor Monatsstatistik; Zielzustand gesicherte Versorgung [S14].
- **SOP 14** sachlich zuständige Sicherheitsbehörde statt pauschal BKA; D7 nach Entscheidungsrelevanz der Lücke; Verknüpfung mit N13 nur nach zivilem Wirkungsbezug [S15].
- **SOP 15** Vorsorgebefassung bei nachgewiesen betroffenen kritischen Funktionen; D7 einheitlich nach A.2; gemeinsame IT-Dienstleister und Eigenbetroffenheit; Meldepflichten keine Radar-Kriterien [S16].
- **SOP 16** Wirkung, Ursache und Absicht getrennt; Diebstahl und Vandalismus über die Funktions-SOP; Serien nur bei belegtem Zusammenhang (R8); fortdauernde Sperrlagen (R7); PSNV gesondert [S17].
- **SOP 17** passendes Dach vor „Sonstiges“, Arzneimittel unter SOP 11; Bausteine unter „Sonstiges“ benannt; keine Fallzahl-Automatik für neue Katalogarten [S18].

### Entfernt

- Offenlassen von D8 „bei kurzem stabilem Verlauf“ in SOP 10 [X01].
- Satz „glatter Verlauf allein ist nicht ‚stabil‘“ in SOP 09 [X02].
- Layoutvermerk zur Zwei-Seiten-Grenze in A.6 [X03].
- Verweis auf empirische Lagenradar-Profile (Münsterland 2005, Alsdorf 2018, Berlin 2026) als Vergleichsfolie in SOP 08; künftig nur als belegte Kalibrierbeispiele nach A.10.3 [X04].
- 17-fach wiederholter offener Punkt „Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren“; ersetzt durch YAML-Angaben und A.10.2; fachliche offene Punkte je SOP bleiben [X05].
- Verweise auf nicht vorhandene Themen-SOPs (Hitzewelle, hochkontagiöse Infektionskrankheit, lokale Infektionshäufung, zoonotische Tierseuche, Arzneimittel-Versorgungsmangel, Weltraumwetter); ersetzt durch Teilprofile in SOP 05 und die Bausteine N10, N11, N12 und N15.
- YAML-Felder `basiert_auf_meldungsvorlage` und `kodierleitfaden` je SOP; die Angaben stehen einmal im Gültigkeitsstand [A17, A22].

### Prüfentscheidungen dieser Konsolidierung

Wo das Änderungsprogramm eine Entscheidung offenließ oder die Umsetzung Folgen für die App hatte, gilt:

1. **Stabile Nummern:** A.1–A.8 und die Anker `teil-a`, `sop-01` … `sop-17` bleiben unverändert; Neues steht in A.9 und A.10 sowie in Unterabschnitten (A.7.4, A.7.5).
2. **Mehrfachlagen und Prozessregeln in Teil A:** N14 (Mehrfachlagen), P01 (Notbetrieb) und P02 (Kalibrierung) sind Redaktionsregeln ohne eigene Meldung und stehen deshalb in A.7.4, A.7.5 und A.10.3, nicht als auswählbare Bausteine.
3. **Mindestkodierung (A03):** Das Programm ließ offen, ob eine „gemeinsam beschlossene“ Mindestkodierung gilt. Festgelegt: Eine bestätigte, gezählte oder amtlich gemeldete Mindestzahl darf als ausdrücklich gekennzeichneter Mindestwert kodiert werden; statistische Bandbreiten über eine Stufengrenze bleiben offen.
4. **Sonderbeschaffung (A15):** Das Programm verlangte eine einheitliche Vorab-Definition. Festgelegt: Eine ereignisbezogene Sonderbeschaffung aus dem Ausland zählt für D4 nur, wenn sie als Unterstützungsleistung für diese Lage belegt und im Text begründet ist.
5. **Kodierregeln gemeinsam fortgeschrieben:** Weil der Kodierleitfaden Teil A im Rang vorgeht, sind A03, A13, A14 und A15 zugleich im Kodierleitfaden 1.2 und in der Arbeitsanweisung Erfassung 1.2 umgesetzt (siehe Profilverlauf). Die D7-Festlegung aus Kodierleitfaden 1.1 („widersprüchliche Vorhersagen = 1“) ist damit ersetzt.
6. **Keine QB-Kürzel:** Statt „QB-L/QB-B“ heißen die Rechercheeinstiege „Lagemeldungen“ und „Betreibermeldungen“, um Verwechslungen mit der Quellenkategorie B auszuschließen [A22].
7. **Pflegeverantwortung:** In der Beispielfassung ist der Herausgeber eingetragen; eine übernehmende Stelle ersetzt ihn durch die eigene Funktion.
8. **Prüftermine:** SOP 06 (fällig Oktober 2026) wurde mit dieser Fassung inhaltlich überarbeitet; nächste Prüfung 01.10.2027. SOP 09 wurde ebenfalls überarbeitet, die vor jeder Heizperiode verlangte amtliche Prüfung des Rechtsrahmens für 2026/27 ist aber nicht dokumentiert; der Termin wird deshalb nicht verschoben, sondern auf 31.10.2026 gesetzt und die Prüfung als überfällig ausgewiesen (A.10.2). Die Rechercheeinstiege selbst wurden nicht erneut geprüft (A.6).
9. **Katalog unverändert:** Umbenennungen (z. B. „Wald- und Vegetationsbrand“, neutrale Bezeichnung der Migrationslage) sind als offene Punkte in SOP 03 und SOP 13 vorgemerkt und erfordern eine gesonderte Schemaänderung mit Migration (A.10.4).

10. **Zwei passende Stufen:** Die Regel „bei zwei passenden Stufen die niedrigere“ bleibt, ist aber als Belegregel gefasst: Maßgeblich ist die Stufe, deren Stufentext der Beleg vollständig trägt; trägt er die höhere nicht vollständig, gilt die niedrigere. Ausdrücklich keine Vorsichtsregel (Begründung zu A03). Gleichlautend in Kodierleitfaden 1.2 (Grundregel 6, Prüfschritt 3) und Arbeitsanweisung Erfassung 1.2.
11. **Bausteine im Status „Inhaltsgerüst“:** Sie bleiben in Stufe S1 auswählbar, ergänzen die Dach-SOP aber nur als Prüfhinweise; bei Widerspruch gilt die Dach-SOP. Den Detailvorrang erhält ein Baustein erst mit fachlicher Freigabe, Prüfauslöser ebenfalls (A.1 Nr. 7, A.10.2).
12. **Monitoring (A22):** Das beobachtete Signal steht in der SOP. Verantwortliche Funktion, Prüfanlass und erwartete Folgeentscheidung hängen von der Organisation der übernehmenden Stelle ab und werden deshalb dort festgelegt (A.10.1); die Beispielfassung erfindet keine Zuständigkeiten.
13. **Umfang von Teil A:** Teil A ist von rund 17 KB auf rund 42 KB gewachsen und geht jeder Anfrage mit. Das ist bewusst entschieden: Die gemeinsamen Regeln stehen nur noch einmal, und der feste Anteil der Anfrage lässt sich beim Anbieter zwischenspeichern. Erneut zu prüfen, wenn Teil A weiter wächst.

### Nachträge aus der unabhängigen Prüfung (19.10.2026, vor Freigabe)

Eine von der Konsolidierung unabhängige Prüfung der Fassung 2.0 gegen das Änderungsprogramm, die Fassung 1.0.1 und den Code ergab folgende Korrekturen; sie sind Teil der Fassung 2.0:

- **Gültigkeitsstand** vom Kopf der Mappe an den Anfang von Teil A verschoben: Der Parser verwirft Text vor dem ersten Anker, die KI erhielt ihn bisher nicht [A17].
- **A.1 Nr. 1:** akute Gefahr wird auch in der Erfassung sofort gekennzeichnet, der Meldeweg nach A.7.3 geprüft [A08].
- **A.1 Nr. 7:** Inhaltsgerüste nur als Prüfhinweise, Vorrang erst mit Freigabe (Prüfentscheidung 11); `art_zuordnung` nur mit Katalogwerten.
- **A.2:** Belegregel bei zwei passenden Stufen (Prüfentscheidung 10); D3-Funktionen an den Kodierleitfaden angeglichen (Betrieb, Gefahrenabwehr, Fachaufsicht, Ermittlung oder Regulierung).
- **A.3:** Beiträge in sozialen Medien ungeklärter Identität ausdrücklich P (wie Kodierleitfaden und Darstellungsdatei).
- **A.4:** Satz „`art_vorschlag` ist Startpunkt, keine Checkliste“ wieder aufgenommen (stand in Fassung 1.0.1 in allen 17 SOPs).
- **A.9.3:** Warnkette fachlich berichtigt: MoWaS ist das zentrale Auslösesystem für die angeschlossenen Warnmultiplikatoren (Warn-Apps, Warnportal, Rundfunk, Cell Broadcast, angebundene Sirenen); örtliche Wege bestehen daneben [A18].
- **A.10.2:** Prüfauslöser je SOP, für Bausteine mit der Freigabe.
- **Teil C, alle Bausteine:** `art_zuordnung` enthält nur exakte Katalogwerte; Bedingungen stehen im neuen YAML-Feld `art_hinweis`.
- **N01:** D1/D2 nicht nach angeordnetem Maßnahmenraum, sondern nach belegtem Wirkungsraum bzw. gezählten Betroffenen (Widerspruch zu R4 und Kodierleitfaden D1/D2 behoben).
- **N04:** Träger des Rettungsdienstes (in der Regel Kreise und kreisfreie Städte) sind A, Leistungserbringer B.
- **N13:** D3 nach tatsächlich steuernder Ebene; Zivilschutz wird überwiegend von Ländern und Kommunen im Auftrag des Bundes ausgeführt.
- **SOP 02:** Durchnässung als fachbehördlich zu bewertender Indikator der Deichsicherheit wieder aufgenommen (entfiel mit 2.0 ohne Begründung); Deichverbände bei D3 genannt.
- **SOP 05:** „Bausteine R1–R4“ in „Recherchezeilen“ umbenannt (Verwechslung mit Teil C).
- **SOP 09:** D8-Formulierung an A.2 angeglichen („ergibt D8 = 0“); Rechtsrahmenprüfung als überfällig ausgewiesen (Prüfentscheidung 8).
- **SOP 11:** Stufe 0 bei D2 nach beiden Bedingungen der D2-Nullregel.
- **A.1 Nr. 2:** fehlende Leerzeile nach der Routentabelle ergänzt.

Begleitend im Profil (siehe Profilverlauf): Darstellungsdatei (Maßnahmenhinweis nach A.4, fünfter Kennsatz), Kodierleitfaden 1.2 (Rangfolge mit Teil C, Belegregel, Zuordnungsbeispiele), Arbeitsanweisung Erfassung 1.2 (D3 Vorsorge, D4 Sonderbeschaffung, Kurzantwort) und die Kodierbegründungen des Beispieldatensatzes.

### Prüfstand Rechtslage (nur Kontext, keine SOP-Regel)

Nach den amtlichen Quellen des Änderungsprogramms (Abruf 19.10.2026, hier nicht erneut geprüft): KRITIS-Dachgesetz seit 17.03.2026 in Kraft, Pflichten gestaffelt und abhängig von noch ausstehenden Identifizierungsvorgaben (BBK-FAQ); NIS-2-Umsetzungsgesetz seit 06.12.2025 in Kraft (BSI); Alarmstufe des Notfallplans Gas am 01.07.2025 beendet, aktueller Stand zeitabhängig (Bundesnetzagentur); Umsetzung der geänderten Internationalen Gesundheitsvorschriften in Deutschland seit 28.02.2026 (BMG). Die SOPs enthalten dazu nur Prüfaufträge (A.6), keine Statusangaben.

### Offene Fachfragen

- **Informationsschutz:** Regeln zu Verschlusssachen, personenbezogenen Daten und zur Übergabe behördeninterner Lageinformationen an externe KI-Dienste sind nicht aufgenommen; das Änderungsprogramm hat diesen Vorschlag gemäß seiner Umfangsvorgabe ausgeklammert. Entscheidung ausstehend (vgl. SOP 14, SOP 16 und N13, jeweils offener Punkt zu eingestuften Informationen).
- **SOP 09 Rechtsrahmen (überfällig):** Notfallplan Gas, EnSiG und EU-Gasversorgungssicherheitsverordnung für die Heizperiode 2026/27 amtlich prüfen und das Ergebnis hier vermerken.
- **Bausteine Teil C:** Alle 17 Bausteine sind Inhaltsgerüste; Quellen, Zuständigkeiten und organisationsspezifische Verfahren sind vor Verwendung fachlich zu konkretisieren.
- **Rechercheeinstiege:** Die mit Fassung 2.0 neu genannten Einstiege sind vor Erstverwendung zu prüfen (A.6).
- **Beispielsammlung:** Eine separat belegte Sammlung reproduzierbar kodierter historischer Lagen (Ersatz für den entfernten Verweis in SOP 08) ist noch nicht angelegt.
- **Katalogpflege:** Umbenennungen und eine mögliche eigene Ereignisart für radiologische Lagen nur über eine abgestimmte Schemaänderung (A.10.4).
- **Kalibrierung:** Kriterien für Vorwarnlagen (SOP 01, 02, 15) und die neuen Kodierregeln (Mindestkodierung, D7) an Übungs- und Rückblickfällen prüfen (A.10.3).

## [1.0.1] – 17.10.2026

### Geändert

- Grammatische Korrektur in Teil A („im Rahmen ihrer Koordinationsrolle“) (be7fb0d). Bis zu dieser Fassung im Profilverlauf geführt.

## [1.0] – 17.10.2026

- Erstfassung der Beispielfassung mit Teil A und 17 SOPs (07b9f29), abgeleitet aus der Arbeitsfassung SOP-LEAD v0.4 (Stand 10.10.2026), organisationsneutral gefasst.

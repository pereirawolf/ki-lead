# Änderungsverlauf SOP-LEAD-Sammelmappe (Beispielfassung)

Änderungen an den Standardvorgehensweisen (SOP) des Beispielprofils `lead.beispiel.koordinierungsstelle`, die jüngsten zuerst. Inhalte unter CC BY 4.0. Die Form folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Dieser Verlauf führt ausschließlich SOP-Änderungen. Änderungen an Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen, Schema und Beispielen stehen im Profilverlauf [`../CHANGELOG.md`](../CHANGELOG.md), Änderungen der App im [App-Verlauf](../../../CHANGELOG.md).

**Versionierung:** Die Sammelmappe trägt eine eigene Fassung (erste Stelle: geänderte Struktur oder Kodier- bzw. Quellenregeln; zweite Stelle: neue oder geänderte fachliche Inhalte; dritte Stelle: redaktionelle Korrekturen). Einzelne SOPs und Bausteine tragen im YAML-Kopf `version` und `stand`. Welche Fassungen von Sammelmappe, Kodierleitfaden, Darstellungsdatei, Arbeitsanweisung und Schema zusammengehören, steht im Gültigkeitsstand am Anfang von Teil A.

**Dateien in diesem Ordner:** Übersicht aller SOPs und Bausteine mit Fassung und Konkordanz in [`README.md`](README.md). Die App liest nur die in `profil.json` unter `sop.dateien` genannten Dateien.

| Datei oder Ordner | Fassung | Status |
|---|---|---|
| `A_Gemeinsame-Regeln.md`, `teil-b/`, `teil-c/` | 3.2.3 vom 21.10.2026 | gültig, Pflegequelle; 35 Dateien im Manifest |
| `SOP-LEAD_Sammelmappe_Lesefassung.md` | 3.2.3 | aus den Einzeldateien erzeugt (`npm run sop:lesefassung`), nicht von Hand bearbeiten; von der App nicht gelesen |
| `archiv/SOP-LEAD_Sammelmappe_v2.0.1.md` | 2.0.1 vom 19.10.2026 | am 21.10.2026 aus dem Ordner entfernt, unverändert im Git-Verlauf ([Stand `7f88cab`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v2.0.1.md); bis 19.10.2026 `SOP-LEAD_Sammelmappe_v2.0.md`; SHA-256 `f2ebf614ea54cf977173d0026f2ee2e501467b53646fac2c25b5a089289a9b93`) |
| `archiv/SOP-LEAD_Sammelmappe_v1.0.1.md` | 1.0.1 vom 17.10.2026 | am 21.10.2026 aus dem Ordner entfernt, unverändert im Git-Verlauf ([Stand `7f88cab`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v1.0.1.md); bis 19.10.2026 `SOP-LEAD_Sammelmappe.md`; SHA-256 `6c4d27a42845758661ae285837585373f8122e5481e4017b61d929dddb4b0626`) |

**Kennungen in älteren Einträgen:** Einträge bis Fassung 2.0.1 nennen die damaligen Nummern („SOP 08“, „N05“); die Zuordnung zu B01–B17 und C01–C17 steht in der Konkordanz der README. Historische Angaben in Meldungen und Review-Dokumenten werden nicht umgeschrieben.

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

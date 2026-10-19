# Änderungsverlauf SOP-LEAD-Sammelmappe (Beispielfassung)

Änderungen an den Standardvorgehensweisen (SOP) des Beispielprofils `lead.beispiel.koordinierungsstelle`, die jüngsten zuerst. Inhalte unter CC BY 4.0. Die Form folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Dieser Verlauf führt ausschließlich SOP-Änderungen. Änderungen an Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen, Schema und Beispielen stehen im Profilverlauf [`../CHANGELOG.md`](../CHANGELOG.md), Änderungen der App im [App-Verlauf](../../../CHANGELOG.md).

**Versionierung:** Die Sammelmappe trägt eine eigene Fassung (erste Stelle: geänderte Struktur oder Kodier- bzw. Quellenregeln; zweite Stelle: neue oder geänderte fachliche Inhalte; dritte Stelle: redaktionelle Korrekturen). Einzelne SOPs und Bausteine tragen im YAML-Kopf `version` und `stand`. Welche Fassungen von Sammelmappe, Kodierleitfaden, Darstellungsdatei, Arbeitsanweisung und Schema zusammengehören, steht im Gültigkeitsstand am Anfang der Sammelmappe.

**Dateien in diesem Ordner:**

| Datei | Fassung | Status |
|---|---|---|
| `SOP-LEAD_Sammelmappe_v2.0.md` | 2.0 vom 19.10.2026 | gültig; im Manifest `profil.json` unter `sop.dateien` eingebunden |
| `SOP-LEAD_Sammelmappe.md` | 1.0.1 vom 17.10.2026 | archiviert, unverändert (SHA-256 `6c4d27a42845758661ae285837585373f8122e5481e4017b61d929dddb4b0626`); von der App nicht mehr gelesen |

## [2.0] – 19.10.2026

Konsolidierte Fassung auf Grundlage des fachlichen Änderungsprogramms „SOP-LEAD_Konsolidiert_2026-10-19.json“ (Formatversion 2.0.0, Prüfstand Commit `89bfa77`, SOP-Datei SHA-256 wie oben). Das Programm führt 64 Empfehlungen aus zwei vorangegangenen Reviews zusammen; die Kennungen in eckigen Klammern verweisen darauf. Alle 17 Ereignis-SOPs bleiben erhalten, Anker und Abschnittsnummern A.1–A.8 sind unverändert, damit Verweise in Darstellungsdatei, Arbeitsanweisungen und App gültig bleiben. Keine Schemaänderung: neue Inhalte laufen unter den bestehenden Ereignisarten.

### Neu

- **Teil C – Themen- und Querschnittsbausteine** (je Status „Inhaltsgerüst“, Version 1.0), keine eigenen Ereignisarten; Zuordnung über `art_zuordnung` statt `art_vorschlag`, damit die App sie nicht automatisch zu einer Ereignisart hinzufügt: N01 Radiologische / nukleare Lage [N01] · N02 Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit [N02] · N03 Evakuierung, Schutzunterbringung und Betreuung [N03] · N04 Nichtinfektiöse medizinische Versorgungslage und MANV-Folgen [N04] · N05 Kraftstoff- und Wärmeversorgung [N05] · N06 Verkehr, Transport und kritische Logistik [N06] · N07 Lebensmittelversorgung [N07] · N08 Abwasser, Sanitärhygiene und kritische Entsorgung [N08] · N09 Massenbewegungen, Bodenversagen und Gebäudeeinsturz [N09] · N10 Tierseuchen und zoonotische Expositionslagen [N10] · N11 Infektionslagen: Auslandsausbruch und lokale Häufung [N11] · N12 Arzneimittel und kritisches medizinisches Material [N12] · N13 Zivile Verteidigung: zivile Schutz- und Versorgungsfolgen [N13] · N15 Weltraumwetter und Störungen von Navigation und Zeitreferenz [N15] · N16 Großunfall und überörtliche Unfallfolgen [N16] · N17 Kampfmittelfund mit Räumung oder Versorgungsauswirkung [N17] · N18 Vulkanasche [N18].
- **Gültigkeitsstand** (Kompatibilitätsmatrix) im Kopf der Mappe [A17].
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
8. **Prüftermine:** SOP 06 (fällig Oktober 2026) und SOP 09 (überfällig seit September 2026) wurden mit dieser Fassung inhaltlich überarbeitet; nächste Prüfung 01.10.2027 bzw. 01.09.2027. Die Rechercheeinstiege selbst wurden nicht erneut geprüft (A.6).
9. **Katalog unverändert:** Umbenennungen (z. B. „Wald- und Vegetationsbrand“, neutrale Bezeichnung der Migrationslage) sind als offene Punkte in SOP 03 und SOP 13 vorgemerkt und erfordern eine gesonderte Schemaänderung mit Migration (A.10.4).

### Prüfstand Rechtslage (nur Kontext, keine SOP-Regel)

Nach den amtlichen Quellen des Änderungsprogramms (Abruf 19.10.2026, hier nicht erneut geprüft): KRITIS-Dachgesetz seit 17.03.2026 in Kraft, Pflichten gestaffelt und abhängig von noch ausstehenden Identifizierungsvorgaben (BBK-FAQ); NIS-2-Umsetzungsgesetz seit 06.12.2025 in Kraft (BSI); Alarmstufe des Notfallplans Gas am 01.07.2025 beendet, aktueller Stand zeitabhängig (Bundesnetzagentur); Umsetzung der geänderten Internationalen Gesundheitsvorschriften in Deutschland seit 28.02.2026 (BMG). Die SOPs enthalten dazu nur Prüfaufträge (A.6), keine Statusangaben.

### Offene Fachfragen

- **Informationsschutz:** Regeln zu Verschlusssachen, personenbezogenen Daten und zur Übergabe behördeninterner Lageinformationen an externe KI-Dienste sind nicht aufgenommen; das Änderungsprogramm hat diesen Vorschlag gemäß seiner Umfangsvorgabe ausgeklammert. Entscheidung ausstehend (vgl. SOP 14, SOP 16 und N13, jeweils offener Punkt zu eingestuften Informationen).
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

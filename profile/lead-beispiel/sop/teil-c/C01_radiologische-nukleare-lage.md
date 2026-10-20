<a id="c01"></a>

## C01. Baustein LEAD: Radiologische / nukleare Lage

```yaml
kennung: "C01"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein (eigenständige Fach-SOP)"
lesegruppe: "Besondere Ereignis- und Gefahrenlagen"
lageart: "Radiologische / nukleare Ereignisse und konkrete Verdachtslagen im In- und Ausland mit begründetem Deutschlandbezug, auch ohne bestätigte Freisetzung"
art_zuordnung: ["Sonstiges", "KRITIS-Ausfall"]
art_hinweis: "„Sonstiges“ als Katalogdach (B17); „KRITIS-Ausfall“ nur bei belegtem Funktionsbezug; weitere Ursachen- und Folgenarten nur bei belegtem Bezug"
anschluss: "B17; B14/B16 bei Sicherheits- bzw. Vorsatzbezug; B15 bei belegtem Cyberbezug; B07 nur bei zusätzlicher chemischer Gefahr; C09, C13, C14, C15, C16, C17 nach Wirkung"
zweck: "Belegte radiologische Lageinformation in die eigene LEAD-Meldung übernehmen, szenarienspezifische Lücken erkennen und zivile Schutz- und Versorgungsfolgen darstellen – ohne eigene Dosismodellierung oder Schutzempfehlung."
version: "1.1.0"
status: "Beispielfassung – vor Verwendung organisationsspezifisch konkretisieren und fachlich prüfen"
stand: "20.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "20.10.2026 – ANoPl-Bund, StrlSchG (§§ 5, 100, 106, 108, 109, 111, 119), BMUKN-Fachseiten; keine Prüfung organisationsspezifischer Alarm- und Notfallpläne"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Änderung des ANoPl-Bund oder der Notfallvorschriften des StrlSchG; neuer besonderer Notfallplan des Bundes; Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "N01"
bisherige_ids: ["baustein-n01"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Ereignisse und konkrete Verdachtslagen mit ionisierender Strahlung, radioaktiven Stoffen oder Kontaminationen im In- und Ausland mit fachlich begründetem Deutschlandbezug (A.1 Nr. 6), auch ohne Freisetzung (äußere Exposition durch eine Quelle). Erfasst sind insbesondere die Referenzszenarien des Allgemeinen Notfallplans des Bundes (ANoPl-Bund, Tabelle 3.4): Kernkraftwerke im In- und Ausland, andere kerntechnische Anlagen und Einrichtungen, sonstige Tätigkeiten mit radioaktiven Stoffen, Transportunfälle an Land, Funde und Kontaminationen, Absturz eines Satelliten oder Raumfahrzeugs mit radioaktivem Material, Notfälle auf Oberflächen- oder Meeresgewässern, vorsätzliche Straftaten mit und ohne Anlagenbezug sowie Nuklearwaffenexplosion und sonstige Notfälle beim Umgang mit Nuklearwaffen. Nicht als Chemieunfall (B07) umetikettieren. Keine eigene Ausbreitungs- oder Dosismodellierung und keine eigene Empfehlung zu Jodeinnahme, Aufenthalt, Evakuierung oder Verzehr.

**Befassungsanlässe:** Zuständige Fachbehörde meldet ein radiologisches Ereignis oder einen konkreten Verdacht · Messanomalie mit fachlichem Klärungsbedarf · amtliche Schutz-, Kontroll- oder Lebensmittelmaßnahme · Auslandsereignis mit fachlich begründetem Deutschlandbezug. Ein fehlendes radiologisches Lagebild schließt die Meldung bereits veranlasster amtlicher Maßnahmen nicht aus.

### 2. Erfassung: Prüffragen

**Einordnung nach Referenzszenario.** Die Tabelle dient der Recherche und Vollständigkeitsprüfung. Eine behördliche Zuordnung mit Quelle und Stand übernehmen; sonst die Zuordnung ausdrücklich als offen kennzeichnen, nicht selbst festlegen. Im Meldungstext immer „Referenzszenario S2 (ANoPl-Bund)“ schreiben, nicht „S2“ allein. Referenzszenarien sind keine Ereignisarten, Radarstufen oder SOP-Kennungen; die Notfallvorsorgekategorie (EPC) der Tabelle wird nicht in Radarwerte übersetzt.

| Referenzszenario (ANoPl-Bund) | Fallgruppe | Abgrenzung für die Befassung |
|---|---|---|
| S0 | Notfall mit ungeklärtem Ursprung | Nur bei fachlich bestätigtem Notfall ohne geklärte Quelle; eine unbestätigte Nachricht zu einem bekannten Ereignis ist kein S0. |
| S1 | Deutsches Kernkraftwerk vor Brennelementfreiheit | Tatsächlichen Anlagenzustand belegen; nach Brennelementfreiheit gilt S5 (ortsfeste Anlage mit besonderem Gefahrenpotenzial). |
| S2 | Kernkraftwerk im Ausland bis 100 km von der deutschen Grenze | Die 100 km grenzen das Szenario ab; sie sind kein Schutz-, Warn- oder Kontaminationsradius. |
| S3 | Kernkraftwerk auf dem europäischen Kontinent, mehr als 100 km von der deutschen Grenze | Ausbreitungsprognose, Messnachweis und deutsche Maßnahmen getrennt darstellen. |
| S4 | Kernkraftwerk außerhalb des europäischen Kontinents | Direkte Umweltwirkung, deutsche Staatsangehörige vor Ort und indirekte Wege (Rückkehrende, Waren) getrennt prüfen. |
| S5 | Andere ortsfeste Anlage oder Einrichtung mit besonderem Gefahrenpotenzial im In- und Ausland | Zum Beispiel Forschungsreaktor, Zwischenlager, Brennelement- oder Entsorgungsanlage, ehemaliges Kernkraftwerk nach Brennelementfreiheit. Stilllegung allein beseitigt das Gefahrenpotenzial nicht. |
| S6 | Sonstige Tätigkeit nach § 4 StrlSchG (auch vergleichbar nach ausländischem Recht) | Medizin, Forschung, Industrie; Exposition auch ohne Freisetzung möglich; Notfalleigenschaft fachlich klären lassen. |
| S7 | Transportunfall an Land: Straße, Schiene, Luft | Gewässer (S10/S11), Vorsatz (S12/S13), Raumfahrt (S9) und Nuklearwaffen (S15) gesondert zuordnen. |
| S8 | Sonstiger Notfall mit radioaktiven Stoffen oder Kontaminationen | Quellenfund, Verlust, herrenlose Quelle, Remobilisierung; eine Straftat nicht vorwegnehmen. |
| S9 | Absturz eines Satelliten oder Raumfahrzeugs mit radioaktivem Material | Radioaktives Inventar bestätigen lassen; prognostizierter Absturzkorridor ist kein belegter Kontaminationsraum. |
| S10 | Notfall auf einem Oberflächengewässer | Begriff der Wasserrahmenrichtlinie; Ereignisort auf dem Gewässer vom späteren Wasserpfad einer Anlage unterscheiden. |
| S11 | Notfall auf oder in Meeresgewässern | Begriff der Meeresstrategie-Rahmenrichtlinie; Seeraum, Küste, Hafen und grenzüberschreitende Bewertung unterscheiden; reaktorbetriebene Schiffe beachten. |
| S12 | Vorsätzliche Straftat im In- oder Ausland mit radioaktiven Stoffen, ohne Bezug zu einer Anlage oder Einrichtung | Ermittlungsstand und radiologischen Befund getrennt führen. |
| S13 | Vorsätzliche Straftat, Störmaßnahme oder sonstige Einwirkung Dritter gegen oder auf eine Einrichtung oder kerntechnische Anlage | Im In- und Ausland; Einordnung richtet sich nach der betroffenen Anlage. Anlagenbezug und tatsächlichen Anlagenzustand belegen. |
| S14 | Nuklearwaffenexplosion | Nur nach amtlicher Einordnung; eine glaubhafte Drohung ist ein Anhaltspunkt (ANoPl-Bund, Tabelle 3.3), kein Notfall und kein S14. |
| S15 | Sonstiger Notfall beim Umgang mit einer Nuklearwaffe | Unfall bei Transport, Lagerung oder Handhabung; kein Schluss auf eine Detonation. |

**Spannungs- oder Verteidigungsfall:** ANoPl-Bund und besondere Notfallpläne gelten nicht für Notfälle im Zusammenhang mit Spannungs- oder Verteidigungsfällen; deren Planung erfolgt in der Konzeption Zivile Verteidigung. Die Notfallpläne können entsprechend anwendbar sein, insbesondere bei Fällen vergleichbar S12–S15 (ANoPl-Bund, Rn. 7). Für S12–S15 unterstellt der ANoPl-Bund einen kriminellen, terroristischen oder unfallbedingten Hintergrund. Einen förmlichen Rechtszustand nicht aus dem Nuklearwaffenbezug ableiten; die amtliche Einordnung wiedergeben und C17 ergänzen.

**Gemeinsame Prüffragen R1–R9** gelten für jede Befassung; nur entscheidungsrelevante Befunde ausführen. **Zusatzfragen R10–R17** nur für das passende Referenzszenario.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist Ereignis, Verdacht, Freisetzung und fachlich bestätigter Quellen- bzw. Anlagenzustand? Liegen Freisetzung, äußere Exposition, Kontamination oder Inkorporation vor, oder werden sie nur geprüft? | Zuständige Fach- und Aufsichtsbehörde; Betreiberangaben (B) getrennt von amtlicher Bewertung (A) | L; D3 | Betreiberzustand B, Schutzbewertung A (A.3). „Keine Freisetzung“ ist keine Entwarnung. Ob ein Notfall nach § 5 Abs. 26 StrlSchG vorliegt, stellt die zuständige Stelle fest. |
| R2 | Welche Notfalleinstufung (überregional, regional, lokal) und welches maßgebliche radiologische Lagebild bzw. welche behördliche Lagebewertung liegen vor – von wem, mit welchem Ausgabestand? | [BMUKN: Notfallschutz](https://www.bundesumweltministerium.de/themen/strahlenschutz/radiologischer-notfallschutz/notfallschutz); [BfS: Radiologisches Lagezentrum des Bundes](https://www.bfs.de/DE/themen/ion/notfallschutz/bfs/rlz/rlz_node.html); Landesbehörden nach Zuständigkeit | L/R; D3/D7 | Überregional erstellt das radiologische Lagezentrum des Bundes das Lagebild, regional das betroffene Land, mit Übernahme- und Abgabemöglichkeiten (§ 108 StrlSchG). Bei lokalen Notfällen gibt es kein Lagebild nach § 108; die örtlichen Behörden bewerten selbst (ANoPl-Bund, Rn. 82 f.). Fehlendes Lagebild ist ein Informationsstand, keine Widerlegung. |
| R3 | Welche Messgrößen, Einheiten, Medien, Orte, Zeitpunkte und fachlichen Bewertungen sind belegt? | [BfS: ODL-Info](https://odlinfo.bfs.de/) (Ortsdosisleistung); Messstellen von Bund und Ländern; fallbezogen | L/R; D1/D8 | Aktivität, Aktivitätskonzentration, Dosisleistung und Dosis getrennt; Messwert ≠ Dosis ≠ Gesundheitswirkung. Unauffällige Ortsdosisleistung schließt Kontamination von Wasser oder Lebensmitteln nicht aus. Keine eigene Bewertung. |
| R4 | Welche Räume sind prognostiziert, welche messtechnisch belegt, welche als Maßnahmenraum festgelegt, und welche Personen sind tatsächlich betroffen? | Radiologisches Lagebild bzw. Fachbehörde; umsetzende Katastrophenschutzbehörden | L/R; D1/D2 | Prognose-, Planungs- und Maßnahmenraum von nachgewiesener Betroffenheit trennen; D1/D2 nicht aus Warnradius oder Entfernung ableiten. |
| R5 | Welche Warnungen, Verhaltensempfehlungen, Anordnungen, Lebensmittel- und Wasservorgaben, Aufhebungen und Freigaben gelten – für wen, wo, seit wann? | Warnung über das Modulare Warnsystem; herausgebende Behörde mit Wortlaut und Stand | M; D5 | Empfehlung, Anordnung, Umsetzung und Wirkung unterscheiden (A.9.3). Die Ausgabe von Jodtabletten ist keine Einnahmeaufforderung; den Zeitpunkt bestimmt die Behörde ([BMUKN: Jodblockade](https://www.jodblockade.de/jodtabletten/einnahmezeitpunkt/)). |
| R6 | Welche Folgen für Betreuung, Gesundheitsversorgung und andere kritische Dienstleistungen sind belegt oder bedingt zu erwarten? | Lagemeldungen (A.3); Betreibermeldungen (A.3) | R/I; D6 | Belegte Folge und Szenario trennen; Betreuung C16, medizinische Versorgung C09, Lebensmittel C14, Wasser B10/C15, Verkehr C13. |
| R7 | In welcher Phase ist die Lage (vor, während, nach einer Freisetzung), welche Entwicklung ist fachlich prognostiziert, welcher Zielzustand wird verfolgt? | Lagebild bzw. Fachbehörde; Prognose mit Ausgabe- und Gültigkeitszeit | R/M; D5/D8 | Beobachtung und Prognose trennen; Quellenereignisse folgen nicht immer dem Phasenverlauf. |
| R8 | Welche Mess-, Kontroll-, medizinischen und Betreuungskapazitäten sind tatsächlich eingesetzt? | Zuständige Stellen; Einsatznachweis | M/R; D4/D6 | Bereitschaft, Anforderung und Zusage ≠ Einsatz. Exponierte, kontaminierte, verletzte, kontrollierte und evakuierte Personen nicht gleichsetzen oder doppelt zählen. |
| R9 | Welche Beschränkungen, Nachmessungen, Freigaben und Zuständigkeitswechsel bestehen nach dem unmittelbaren Ereignis fort? | Zuständige Fach- und Vollzugsbehörden | R/M; D5 | Ende der Freisetzung oder Bergung beendet die Lage nicht. Übergang in eine nach dem Notfall bestehende Expositionssituation (§ 119 StrlSchG) nach amtlicher Feststellung. |
| R10 | S1–S5: Welcher Anlagentyp und welcher Zustand (Betrieb, Stilllegung, Brennelementfreiheit) sind belegt; welche deutsche Schutzbewertung liegt vor? | Atomaufsicht (A), Betreiber (B); ausländische Aufsichtsbehörde; Lagebild | L/R; D1/D3 | Ausländische Primärinformation und deutsche Bewertung nebeneinander. Nicht allein nach Anlagennamen oder Land einordnen. |
| R11 | S6/S8: Welche Quelle, Tätigkeit oder Kontamination ist bestätigt, unter wessen Kontrolle steht sie, welche Expositionswege prüft die Fachstelle? | Strahlenschutzbehörde; Betreiber (B); Gesundheitsbehörde | L/R; D2/D3 | Medizin-, Industrie- oder Forschungsereignis, Fund und Remobilisierung unterscheiden. Ein Fund belegt keine Absicht. |
| R12 | S7: Welcher Verkehrsträger und Ort, welcher amtlich bewertete Zustand von Versandstück bzw. Quelle, welche Verkehrsfolgen? | Gefahrenabwehrbehörde, Fachaufsicht; Beförderer (B) | L/R/M; D1/D6 | Unfallbild ist kein Nachweis eines Stoffaustritts; Angriff auf einen Transport nicht als gewöhnlichen Unfall führen (S12). Verkehrsfolgen nach C13. |
| R13 | S9: Sind radioaktives Inventar und Ereignis (Start, Wiedereintritt, Absturz) bestätigt; welche amtlichen Zeit- und Gebietsprognosen, Funde und Messungen liegen vor? | Zuständige Weltraumlage- und Strahlenschutzstellen | L/R; D1/D7 | Trümmerfund ≠ Kontamination; kein eigenes Bahn- oder Ausbreitungsmodell. C03 (Weltraumwetter) ist kein Ersatz. |
| R14 | S10/S11: Wo liegt das Ereignis, und welche Wasser-, Küsten-, Hafen-, Entnahme- und Nutzungspfade bewertet die zuständige Stelle? | Wasser-, Küsten- und Seebehörden mit radiologischer Fachstelle; bei komplexer Schadenslage auf See Havariekommando | L/R/M; D1/D6 | Binnengewässer und Meer unterscheiden; Luftmessung ersetzt keine Wasser- oder Lebensmittelbewertung. Schifffahrt und Fischerei nur bei belegter Relevanz. |
| R15 | S12/S13: Was ist behördlich zu Tat, Drohung und Anlagenbezug bekannt, und welche radiologische Gefährdung ist tatsächlich belegt? | Sicherheits- und Ermittlungsbehörde; Strahlenschutz- bzw. Atomaufsicht getrennt | L/R; D3/D7 | Motiv, Urheberschaft und Wirkung getrennt; keine eigenen Täter-, Ziel- oder Schwachstellenbewertungen. B14/B16, bei Cyberbezug B15 ergänzen. |
| R16 | S14/S15: Welche amtliche Einordnung (Detonation oder sonstiges Waffenereignis) und welche belegten zivilen radiologischen und konventionellen Folgen liegen vor? | Zuständige Behörden und zivile radiologische Fachbewertung | L/R/M; D1/D2/D6 | Keine Detonation aus Video, Explosionsmeldung oder Schlagwort ableiten. Rechts- und Planungskontext (Rn. 7) benennen; C17, C09, C16 nach Wirkung. |
| R17 | Ausland (S2–S5, S12, S13): Welcher direkte oder indirekte Deutschlandbezug ist belegt oder fachlich prognostiziert; sind Deutsche im Ausland, Rückkehrende oder Waren- und Transportwege betroffen? | Deutsche und ausländische Fachbehörden; Auswärtiges Amt bei Personenbezug | L/R/M; D1/D2/D6 | Weder Entwarnung wegen Entfernung noch Übernahme ausländischer Zahlen in deutsche Radarwerte (A.1 Nr. 6). |

### 3. Auswertung: Prüfpunkte

Teil A und Kodierleitfaden gelten. Das Lagenradar beschreibt die Wirkung im Referenzraum, nicht Dosis, INES-Stufe, Referenzszenario oder Notfallvorsorgekategorie.

- **D1:** Belegter Wirkungsraum bzw. tatsächlich umgesetzte Maßnahme (z. B. durchgeführte Evakuierung, nachgewiesene Kontamination); Prognosekorridor, Warnradius und Entfernung tragen allein keinen Wert.
- **D2:** Gezählte oder amtlich gemeldete Betroffene nach passender Definition; Evakuierte, Kontrollierte, Kontaminierte und Verletzte nicht gleichsetzen oder doppelt zählen.
- **D3:** Bewertete Funktion nennen (Betrieb, Aufsicht, Gefahrenabwehr, Schutzentscheidung, Ermittlung); die Beteiligung des radiologischen Lagezentrums des Bundes allein setzt keinen Wert.
- **D4:** Herkunft tatsächlich eingesetzter externer Unterstützung; zugesagte Spezialkräfte oder Messbereitschaft sind kein Einsatz.
- **D5:** Fachlich prognostizierte Dauer bis zu einem benannten Ziel (z. B. Aufhebung einer Aufenthaltsempfehlung, Freigabe von Lebensmitteln); Ereignisende, Quellenbergung und Folgenbeseitigung unterscheiden.
- **D6:** Belegte Kopplungen zu Gesundheit, Wasser, Lebensmitteln, Energie, Verkehr, Kommunikation oder Entsorgung; kein hoher Wert allein wegen „nuklear“.
- **D7:** Entscheidungsrelevante Lücken zu Quelle, Messung, Prognose oder geltenden Maßnahmen; nicht die fachliche Komplexität.
- **D8:** Beobachtete Änderung im Betrachtungszeitraum; erwartete Ausbreitung oder Halbwertszeit sind keine Dynamikstufe.

**Offenlassen:** Nach Kodierleitfaden mit Grund, insbesondere D2 ohne belastbare Personenbasis, D5 ohne Ziel oder Prognose, D8 ohne vergleichbare Beobachtung. Eine einzelne unauffällige Messgröße ist kein radiologischer Nullbefund. Schwellen aus Notfallplänen nur wiedergeben, wenn die Fachbehörde sie angewandt hat.

### 4. Darstellung

Unter dem Katalogdach (regelmäßig B17 „Sonstiges“) in den vorhandenen Feldern der Meldung, ohne neue Pflichtfelder:

- **Lage & Ereignis:** bestätigter Ereignis- bzw. Verdachtsstand; Referenzszenario laut Fachstelle oder offene Zuordnung; Quellen- bzw. Anlagenzustand; Messung, Prognose und Bewertung je mit Quelle, Einheit, Raum und Zeit getrennt; Ausgabestand des Lagebilds.
- **Risiken & Auswirkungen / Abhängigkeiten:** belegte Personen- und Versorgungsfolgen; bedingte Folgen mit Prognosegeber; Auslands- und Inlandswirkung getrennt.
- **Maßnahmen & Handlungsempfehlungen:** herausgebende Stelle, Status (Empfehlung, Anordnung, Umsetzung), Zielgruppe, Gebiet und Geltungszeit.
- **Bewertung:** Kernaussage zum Deutschlandbezug; Kennsätze nach Teil A. `Neubewertung bei:` etwa neues Lagebild, bestätigte Änderung von Freisetzung oder Exposition, geänderter Maßnahmenraum, neue Messbewertung; ein bloßes Quellenupdate ist keine Lageänderung.

**Textmuster:** „[Fachstelle, Stand] bestätigt [Ereignis/Verdacht]; Referenzszenario [Sx (ANoPl-Bund) laut Fachstelle | Zuordnung offen]. Für [Referenzraum] sind [belegte Wirkung] maßgeblich. Das Lagebild [Ausgabe] unterscheidet [Messbefund] von [Prognose]. [Behörde] hat [Maßnahme, Gebiet, Zielgruppe, Geltung] [empfohlen/angeordnet]; Umsetzung: [Stand]. Neubewertung bei: [Anlass].“

### 5. Ansprechstellen und Pflege

**Ansprechstellen (funktional):** Strahlenschutz- bzw. Atomaufsichtsbehörde · Stelle, die das Lagebild erstellt (radiologisches Lagezentrum des Bundes oder Land) · Katastrophenschutz- und Gefahrenabwehrbehörden · Gesundheits-, Lebensmittel- und Wasserbehörden nach Wirkung · Sicherheits- und Ermittlungsbehörden bei Vorsatzverdacht · Gewässer-, See- und Weltraumlage-Fachstellen nach Szenario. Kontakte und Alarmwege aus dem geltenden Notfallplan übernehmen, nicht aus einer Websuche; die Notfallpläne der Länder konkretisieren den Bundesrahmen (§ 100 StrlSchG).

**Fachgrundlagen** (Rechercheeinstiege; sie bestätigen kein aktuelles Ereignis und werden im Quellenverzeichnis der Meldung nur geführt, wenn eine Aussage darauf beruht):

- ANoPl-Bund: [Allgemeine Verwaltungsvorschrift zum Allgemeinen Notfallplan des Bundes vom 10.11.2023](https://www.bundesumweltministerium.de/fileadmin/Daten_BMU/Download_PDF/Gesetze/avv_anopi_bund_bf.pdf), insbesondere Rn. 7, Tabellen 3.3 und 3.4, Rn. 47–57, 78–83 und Anhang B
- StrlSchG: [§ 5 Abs. 26 (Notfall)](https://www.gesetze-im-internet.de/strlschg/__5.html), [§ 100 (Notfallpläne der Länder)](https://www.gesetze-im-internet.de/strlschg/__100.html), [§ 106 (Radiologisches Lagezentrum des Bundes)](https://www.gesetze-im-internet.de/strlschg/__106.html), [§ 108 (Radiologisches Lagebild)](https://www.gesetze-im-internet.de/strlschg/__108.html), [§ 109 (Entscheidungen über Schutzmaßnahmen)](https://www.gesetze-im-internet.de/strlschg/__109.html), [§ 111 (Dosisabschätzung)](https://www.gesetze-im-internet.de/strlschg/__111.html), [§ 119 (nach einem Notfall bestehende Expositionssituation)](https://www.gesetze-im-internet.de/strlschg/__119.html)

**Offene Punkte:** Funktionskontakte und Länderpläne mit der übernehmenden Stelle konkretisieren. An Kontrastfällen erproben: Kernkraftwerk im grenznahen Ausland · Kernkraftwerk außerhalb Europas ohne direkte Inlandswirkung · ehemaliges deutsches Kernkraftwerk nach Brennelementfreiheit · Straßen- oder Schienentransport ohne bestätigte Freisetzung · Quellenfund ohne Absicht · angekündigter Wiedereintritt eines Satelliten · Schiff mit radioaktiver Ladung · Straftat mit und ohne Anlagenbezug · Nuklearwaffenereignis mit getrenntem Rechts- und Planungskontext.

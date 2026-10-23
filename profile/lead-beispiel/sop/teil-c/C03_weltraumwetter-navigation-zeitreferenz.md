<a id="c03"></a>

## C03. Baustein LEAD: Weltraumwetter und Störungen von Navigation und Zeitreferenz

```yaml
kennung: "C03"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein"
lesegruppe: "Besondere Ereignis- und Gefahrenlagen"
lageart: "Weltraumwetter mit konkretem deutschem Funktionsbezug; Navigations-, Zeitreferenz-, Funk- oder Netzstörungen"
art_zuordnung: ["Sonstiges", "KRITIS-Ausfall", "Stromausfall / Blackout"]
art_hinweis: "„Sonstiges“ bei Frühwarnung; „KRITIS-Ausfall“ oder „Stromausfall / Blackout“ nur bei entsprechendem Wirkungseintritt"
anschluss: "B17, B08, B12; C11 bei Funk-, TK- oder Warnbezug; C13 bei Navigationsbezug im Verkehr; B14 oder B15 nur nach entsprechendem Befund zur Ursache"
zweck: "Trennung von Vorwarnsignal und tatsächlicher Funktionsstörung bei Weltraumwetter."
version: "1.1.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "22.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N15"
bisherige_ids: ["baustein-n15"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Fachlich relevante Weltraumwettersignale mit konkret begründetem deutschem Schutz-, Versorgungs- oder Vorsorgebezug sowie belegte Störungen von Positionierung, Navigation, Zeitreferenz, Funk- oder Satellitendiensten und davon abhängigen Leistungen. Frühe Befassung nach A.1 Nr. 1 auch ohne Ausfall, wenn ein benennbarer Prüf- oder Vorbereitungsbedarf besteht; Polarlichtsichtung oder hoher Index allein genügen nicht und belegen keinen deutschen Netzausfall. Physikalische Messung, modellierte Wirkung, Betroffenheit einer konkreten Technik und tatsächliche Dienststörung getrennt beschreiben. Die Ursache darf offenbleiben: Gleichzeitiges Weltraumwetter belegt nicht, dass es eine Störung verursacht hat. Terrestrische Interferenz, Jamming, Spoofing, technische Fehlfunktion oder Cybervorfall nicht ohne Fachnachweis zuordnen; je nach Befund B14, B15 oder eine ursachenoffene KRITIS-Lage. Keine eigene Betriebs-, Frequenz-, Navigations- oder Netzführungsanweisung. Vulkanasche: C04.

**Befassungsanlässe:** Fachlich relevantes Weltraumwettersignal mit konkretem deutschem Funktionsbezug oder benennbarem Vorbereitungsbedarf · bestätigte Navigations-, Zeitreferenz-, Funk- oder Netzstörung.

**Zuordnung im Schema:** „Sonstiges“ bei Frühwarnung; „KRITIS-Ausfall“ oder „Stromausfall / Blackout“ nur bei entsprechendem Wirkungseintritt.

### 2. Erfassung: Prüffragen

**Warn- und Messprofil:** Herausgebenden Fachdienst, Produktart, Ausgabezeit, Bezugs- bzw. Gültigkeitszeit mit Zeitzone, räumlichen oder technischen Bezug und Unsicherheit festhalten; Zeitangaben in UTC nicht stillschweigend als Ortszeit ausgeben. Geomagnetische Störung, solares Strahlungsereignis und Funkbeeinträchtigung getrennt führen; Fachskalen und Indizes nur mit ihrer eigenen Bedeutung wiedergeben und nicht ineinander umrechnen. Prognose, Warnung vor erwarteten Bedingungen, Meldung gemessener Umweltbedingungen und Betreiberbefund zur Dienstleistung sind keine austauschbaren Status. Ein großräumiger Umweltindex ist keine räumliche Schadensbilanz für Deutschland; technische Fachschwere wird nicht in LEAD-Beurteilung oder Radarstufen umgerechnet.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Fachwarnung gilt für welchen Zeitraum und welche technische Wirkung? | [BKG: Weltraumwetter](https://www.bkg.bund.de/DE/Themen/Sicherheit-Weltraum/weltraumwetter/weltraumwetter.html); zuständige Fachdienste | L/R; D8 | Warnung ≠ Störung. |
| R2 | Welche deutsche Infrastruktur oder Dienstleistung ist nach Fach- oder Betreiberbewertung konkret exponiert? | Betreibermeldungen (A.3); Fachbehörden | R/I | Exposition nur nach Fach- oder Betreiberbewertung. |
| R3 | Welche Auswirkungen sind gemessen, welche nur prognostiziert? | Fachdienste; Betreibermeldungen (A.3) | L/R | Gemessen und prognostiziert trennen. |
| R4 | Welche Redundanz oder betriebliche Anpassung ist tatsächlich verfügbar bzw. umgesetzt? | Betreibermeldungen (A.3) | M; D5 | Vorhanden ≠ umgesetzt; „Ersatz und Tragfähigkeit“. |
| R5 | Welche Rolle spielen Navigation, Zeitreferenz, Kommunikation und Energie für die konkrete Folgekette? | Betreibermeldungen (A.3) | I; D6 | Wirkungskette nach A.2 belegen. |
| R6 | Welche fachlichen Entwarnungs- oder Neubewertungsindikatoren bestehen? | Fachdienste | M; D5/D8 | Für Kennsatz `Neubewertung bei:` verwenden. |

**Funktionsprofil:** Benötigte Positionierungs-, Navigations-, Zeit- oder Kommunikationsleistung, erforderliche Qualität und konkreten Anwendungsraum nach Betreiber- oder Fachangabe benennen. Ausfall, verringerte Genauigkeit, zeitweilige Nichtverfügbarkeit und unzuverlässige oder inkonsistente Daten unterscheiden: Ein erreichbares System ist nicht automatisch verlässlich, eine einzelne Gerätebeobachtung belegt aber keine flächige Störung. Die Kopplung zur kritischen Dienstleistung mit Beleg verfolgen, etwa Navigation im Verkehr (C13), Synchronisation in Telekommunikation oder Energie, Funkverbindung einer Schutzfunktion (C11). Anlagenabhängigkeit und eingetretener Folgeausfall bleiben getrennt; keine eigenen Toleranzwerte.

**Ersatz und Tragfähigkeit:** Eine Alternative muss nach Betreiberangabe geeignet, betriebsbereit, zugänglich und von der maßgeblichen Störursache hinreichend unabhängig sein. Mehrere Empfänger oder Satellitensysteme sind nicht automatisch unabhängiger Ersatz; eine Zeitverteilung über andere Technik kann denselben vorgelagerten Zeitbezug nutzen. Vorhanden, getestet, aktiviert und wirksam unterscheiden. Für den Weiterbetrieb ohne externen Referenzabgleich nur fachlich bestätigte Dauer und Qualitätsgrenzen nennen; keine selbst berechnete Uhrendrift oder Überbrückungszeit und keine pauschale Autarkie. Vorhaltung allein ist keine D4-Unterstützung.

### 3. Auswertung: Prüfpunkte

- **D1/D2:** Ohne belegte Wirkung bzw. unmittelbar Betroffene im Referenzraum offen (Kodierleitfaden, Kurzbeispiel Weltraumwetter); Warngebiet, Polarlichtbereich und technische Reichweite nicht übernehmen. Reale Folgen einer Schutzmaßnahme gesondert prüfen, auch wenn ein technischer Schaden verhindert wurde.
- **D3:** Strukturell nur mit konkreter Fachaufgabe und belegter Stelle nach Kodierleitfaden, sonst die tatsächlich handelnde Funktion. Ein internationaler Fachdienst als Quelle begründet keine internationale Steuerung.
- **D4:** Tatsächlich eingesetzte ereignisbezogene externe Unterstützung, nicht eine ausländische Fachwarnung oder der reguläre Bezug eines Dienstes.
- **D5:** Benanntes Ziel und belastbare Restdauer; das vorhergesagte Ende eines Umweltphänomens ist nicht die Wiederherstellung einer abhängigen Dienstleistung.
- **D6:** Belegte Kopplung der konkreten Lage zu einer kritischen Dienstleistung nach Kodierleitfaden, nicht allgemeine Technikabhängigkeit oder eine Liste möglicher Sektoren. Eine Störung ist ein möglicher Beleg, aber keine zusätzliche Voraussetzung; erwartete Folgeausfälle bleiben Szenario.
- **D7:** Informationslage der Befassung, nicht die Qualität der Navigation oder die Kommunikation mit der Bevölkerung; gestörte Lage- und Meldewege oder entscheidungsrelevante Unklarheit nach Kodierleitfaden.
- **D8:** Beobachtete Veränderung der maßgeblichen Lage im Referenzraum, nicht eine Prognoseänderung oder Indexschwankung ohne solchen Bezug.

**Beurteilung/Tendenz:** Nach konkreter gegenwärtiger Relevanz einschließlich fachlich begründetem Vorsorgebedarf und nutzbarem Ersatz; Fachwarnstufe, technische Wirkung und Bevölkerungsschutzrelevanz getrennt begründen.

**Offenlassen:** die einschlägigen Ist-Achsen ohne belegte Wirkung im Referenzraum (A.1 Nr. 1); D5 ohne benanntes Ziel und Prognose.

### 4. Darstellung

Nach der passenden Dach-SOP bzw. B17: Fachwarnung mit Gültigkeitsfenster, gemessene Umweltbedingungen, belegte Funktionswirkung im Referenzraum und bedingte Folgeketten getrennt. Die Kernaussage beantwortet: Welche Schutz- oder Versorgungsfunktion braucht welche konkret begründete Prüfung, welcher Ersatz ist wirksam, und was bleibt offen? Betriebsanpassungen als Betreibermaßnahme mit Status, Empfehlungen als zuständig adressierte Klärung nach A.4; keine Steuerungsanweisungen. Neubewertung bei konkreter Änderung von Dienstqualität oder Verfügbarkeit, aktualisierter relevanter Fachwarnung oder veränderter Tragfähigkeit des Ersatzes. Nach Abklingen der Umweltstörung den verlässlichen Wiederanlauf der betroffenen Dienste fachlich bestätigen lassen; eine fachliche Entwarnung ist keine betriebliche Freigabe. Für die Wochenlage belegte strukturelle Abhängigkeiten und fehlende unabhängige Referenz- oder Ersatzwege als Prüfbedarf benennen, ohne aus allgemeiner Exposition einen Ausfall abzuleiten.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Fachdienste für Weltraumwetter produktbezogen (u. a. BKG, Weltraumwetterdienst der ESA, NOAA Space Weather Prediction Center) · betroffene Betreiber zu ihrer Dienstleistung (B) · zuständige Fachstellen für Navigation, Zeitreferenz, Energie, Telekommunikation oder Luftfahrt fallbezogen. Keiner Stelle pauschal die Verantwortung für alle Wirkungen zuschreiben; eine internationale Prognose ist keine deutsche Behördenentscheidung.

**Offene Punkte:** Fachdienste für Weltraumwetterwarnungen mit Zuständigkeit konkretisieren. Rechercheeinstieg BKG prüfen: Der Link in R1 ist nach einem Hinweis vom 21.10.2026 möglicherweise veraltet; die Beobachtungsdaten des BKG zum Weltraumwetter kommen als weiterer Einstieg in Betracht (beides vor Erstverwendung prüfen, A.6). Übungsfälle zu hoher Fachwarnstufe ohne Schaden, realem Verlust von GNSS- oder Zeitqualität, abhängiger und unabhängiger Redundanz und ursachenoffener Störung.

<a id="c09"></a>

## C09. Baustein LEAD: Medizinische und pflegerische Versorgungslage und MANV-Folgen

```yaml
kennung: "C09"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein unter bestehendem Dach"
lesegruppe: "Gesundheit und medizinische Versorgung"
lageart: "Missverhältnis zwischen medizinischem oder pflegerischem Bedarf und tatsächlich nutzbaren präklinischen, klinischen, pflegerischen oder häuslichen Versorgungsleistungen; Ausfall oder Evakuierung von Einrichtungen; MANV-Folgen"
art_zuordnung: ["Gesundheitliche Lage / Epidemie", "KRITIS-Ausfall"]
art_hinweis: "„KRITIS-Ausfall“ nur nach dem Funktionsdach B12 (A.1 Nr. 2): wenn neben der medizinisch-pflegerischen Versorgung eine weitere kritische Dienstleistung eigenständig betroffen ist oder eine sektorübergreifende Koordinationsfrage besteht; der Versorgungsausfall selbst bleibt unter „Gesundheitliche Lage / Epidemie“"
anschluss: "B11, C05; C07 bei Infektionsgeschehen; C10, C11, C12, C16, B15, C17 nach konkretem Bezug"
zweck: "Erfassung nutzbarer medizinischer und pflegerischer Leistung und des Ausfalls der Regelversorgung nach Versorgungsfunktion, unabhängig von der Ursache."
version: "1.3.0"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "27.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "21.10.2026 – BBK „MANV“: gezielter Inhaltsabgleich (sichtbare, für den Zweck einschlägige Passagen; keine Vollprüfung der Unterseiten); übrige Ansprechstellen vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N04"
bisherige_ids: ["baustein-n04"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Eigenständig relevante medizinische und pflegerische Versorgungslagen: Missverhältnis zwischen benötigter und tatsächlich nutzbarer Behandlung, Pflege oder Transportleistung; MANV-Folgen; Ausfall oder Evakuierung von Kliniken, Pflege- und Dialyseeinrichtungen; Engpässe im Rettungsdienst; länger dauernde Engpässe einschließlich ambulanter und häuslicher Versorgung. Abgegrenzt wird nach der Versorgungsfunktion, nicht nach der Ursache: Bei Infektionsgeschehen bleiben Epidemiologie und Erregerfragen bei B11 und C07; C09 wird nur ergänzt, wenn ein eigenständiger Versorgungsbefund oder Abstimmungsbedarf besteht. Frühe Befassung nach A.1 Nr. 1 ist bei begründetem Vorbereitungsbedarf auch vor dem ersten Versorgungsausfall möglich. MANV-Einstufung und Alarmstufe werden mit Gebiet und Stand von der zuständigen Stelle übernommen, nicht aus Patientenzahlen selbst abgeleitet. Keine klinische Sichtungs-, Triage-, Therapie- oder Verteilungsentscheidung durch die Lagebildredaktion. Unfallgeschehen selbst C05; Evakuierung und Betreuung C16; Arzneimittel und Material C10; Leitstellen und Notruf C11; Notstrom und Kraftstoff C12; IT-Ausfall von Einrichtungen B15; zivile Verteidigung C17.

**Befassungsanlässe:** Belegtes Missverhältnis zwischen Patientenbedarf und einsetzbaren präklinischen bzw. klinischen Fähigkeiten · Ausfall oder Evakuierung von Klinik-, Pflege-, Dialyse- oder Rettungsdienstfunktionen · länger andauernde Abmeldung von Notaufnahmen oder Fachgebieten in einer Region · Gefährdung häuslich versorgter Menschen (z. B. Beatmung, Sauerstoff, Pflegedienste) · länderübergreifender Verlegungs- oder Unterstützungsbedarf.

**Zuordnung im Schema:** „Gesundheitliche Lage / Epidemie“; „KRITIS-Ausfall“ nur nach dem Funktionsdach B12 (A.1 Nr. 2), nicht allein wegen des KRITIS-Bezugs von Kliniken, Pflege oder Rettungsdienst.

### 2. Erfassung: Prüffragen

**Versorgungsprofil (vor der Detailrecherche):** Welche konkrete Leistung wird für welche Bedarfsgruppe in welchem Raum und Zeitraum benötigt? Was davon ist personell betrieben, technisch funktionsfähig, fachlich geeignet und tatsächlich erreichbar? Welche Lücke verbleibt, welcher Ersatz trägt wie lange? Patientenzahl, Behandlungsplätze, Betten, Transportmittel und Personal sind unterschiedliche Größen und werden nicht addiert. Ein Registerwert ersetzt keine Betreiberbestätigung, wenn Aktualität, Eignung oder Nutzbarkeit entscheidungsrelevant unklar sind. Die Versorgungskette nur an den maßgeblichen Engpässen verfolgen: präklinische Versorgung und Transport → geeignete Aufnahme → Diagnostik und Behandlung → Pflege und Weiterversorgung.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welcher Bedarf ist nach Fachmeldung nicht mehr regelhaft abdeckbar? | Lagemeldungen (A.3); Gesundheitsbehörden; [BBK: MANV](https://www.bbk.bund.de/DE/Themen/Gesundheitlicher-Bevoelkerungsschutz/Sanitaetsdienst/MANV/manv_node.html) (Hintergrund) | L/R; D2 | Sichtungskategorien nur für tatsächlich gesichtete Patientinnen und Patienten verwenden, nicht für Vermisste. |
| R2 | Welche Behandlung, Transport- oder Pflegeleistung ist tatsächlich verfügbar, personell betrieben und zugänglich? | Krankenhausträger und Leistungserbringer im Rettungsdienst (B); Träger des Rettungsdienstes (A); Kapazitätsnachweise der Länder; Intensivregister (B11/R6) | R/M; D6 | Nominale Betten und freie Meldekapazitäten sind nicht gleichbedeutend mit nutzbarer Leistung; ein freies Bett ohne Personal und fachliche Eignung ist keine Behandlungskapazität. |
| R3 | Welche Auswirkungen hat die Lage auf die übrige Versorgung? | Lagemeldungen (A.3) | R; D6 | Verdrängte Regelversorgung ausdrücklich prüfen. |
| R4 | Welche Zuführung, Verlegung und Notbetriebsleistung sind bestätigt, was ist nur angeboten? | Lagemeldungen (A.3); Kleeblatt-Verfahren bzw. GMLZ nur bei belegt aktiviertem Vorgang | M; D4 | Angefragt ≠ angeboten ≠ zugesagt ≠ aufgenommen. Aufgenommene Patientinnen und Patienten belasten den Behandlungsort (Kapazitätsbezug), zählen als Betroffene aber nur im Ereignisraum (A.3, Zuordnung zum Raum). |
| R5 | Welche länger anhaltenden Engpässe bei Personal, Material, Energie oder Transport bestehen? | Betreibermeldungen (A.3); Lagemeldungen (A.3) | R/I; D6 | Material nach C10, Energie nach B08 bzw. C12, IT-Ausfall nach B15. |
| R6 | Wann ist welche Versorgungsfunktion nach Fachprognose wiederhergestellt? | Krankenhausträger (B); Gesundheitsbehörden | M; D5 | Notbetrieb, Teilbetrieb und Regelbetrieb unterscheiden. |
| R7 | Wie leistungsfähig ist der Rettungsdienst im betroffenen Raum: Einsatzaufkommen, einsatzbereite Rettungsmittel, Wartezeiten bei der Übergabe in Kliniken, überörtliche Unterstützung? | Träger des Rettungsdienstes und Leitstellen (A); Lagemeldungen (A.3) | R/M; D4/D6 | Planungsgrößen wie Hilfsfristen sind landesrechtlich verschieden und keine Radar-Kriterien; Überschreitungen nur mit Träger und Bezugszeitraum. Leitstellen- und Notrufstörungen nach C11. |

**Bedarfsgruppen und Folgebedarf:** Nur lagebezogen prüfen: bereits versorgte und neu hinzukommende Patientinnen und Patienten; zeitkritische Behandlungen; Dialyse, Beatmung, Geburtshilfe oder andere fachlich benannte Spezialbedarfe; stationäre Pflege, ambulante Dienste und häuslich versorgte Menschen. Eine Unterbrechung von Strom, Wasser, Sauerstoff, Arzneimitteln, Pflegebesuchen oder Transport kann Bedarf außerhalb der betroffenen Einrichtung erzeugen. Verdrängte oder aufgeschobene Regelversorgung mit fachlich beschriebenen Folgen erfassen; die Verschiebung eines Termins allein belegt keine unmittelbare Gesundheitsschädigung und keine D2-Betroffenheit. Barrieren und Selbsthilfefähigkeit nach A.9.2, nur mit verfügbaren aggregierten Angaben.

**Verlegung und Evakuierung:** Für entscheidungsrelevante Transporte Bedarfsfeststellung, geeignete und verbindlich zugesagte Aufnahme, fachlich passenden Transport mit Begleitung, zeitliche Durchführbarkeit und gesicherte Anschlussversorgung getrennt nachweisen. Eine Verlegung zählt erst als wirksame Entlastung, wenn diese Kette trägt; eingesetzte Unterstützung kann trotzdem schon nach D4 belegt sein. Abfahrt und Ankunft sind keine zwei verlegten Personen. Eine Evakuierung erzeugt Aufnahme-, Transport- und Weiterbehandlungsbedarf und kann Nachbareinrichtungen belasten; Betreuung und Unterbringung nach C16. Für das Lagebild genügen Patientengruppe, benötigte Fähigkeiten und aggregierte Zahl.

**Tragfähigkeit und Nachlauf:** Den zeitlich maßgeblichen Engpass benennen: Personal einschließlich Ablösung und Qualifikation, Arzneimittel und Verbrauchsmaterial, Labor, Sterilgutaufbereitung, Blutprodukte, medizinische Gase, Energie, Wasser, IT oder Transport. Nur belegte Abhängigkeiten ausführen; die Ursache über die passende SOP ergänzen. Ein Reservebetrieb kann Leistung zunächst sichern und bei fehlendem Nachschub oder Personal kippen: fachlich belegte Reichweite, Unsicherheit und kritischen Prüfzeitpunkt nennen, keine Standardautarkie unterstellen. Rückkehr einer technischen Anlage ist nicht die Wiederaufnahme der Versorgung; Nutzbarkeit, Personal, Nachversorgung und entstandene Rückstände getrennt prüfen. Bei Mehrfachlagen dieselben Spezialfähigkeiten und Reserven nicht mehrfach als frei ausweisen (A.7.4).

### 3. Auswertung: Prüfpunkte

- **D1:** Belegter Wirkungsraum der betroffenen Versorgungsleistung, nicht automatisch Standort oder reguläres Einzugsgebiet einer Klinik.
- **D2:** Personen mit belegter unmittelbarer Beeinträchtigung nach Kodierleitfaden und passendem Zeitstand. Verletzte, Erkrankte, unmittelbar durch Versorgungsausfall Beeinträchtigte, Vermisste und nur vorsorglich Betreute getrennt führen; Überschneidungen nicht addieren. Behandlungsbedarf, Bettensperrungen und Einwohner im Versorgungsgebiet sind keine austauschbaren Zähler.
- **D3:** Bewertete Funktion benennen, z. B. Einrichtungsbetrieb, Rettungsdienststeuerung oder übergreifende Koordinierung; zuständige Aufsicht oder höchste beteiligte Ebene nicht automatisch übernehmen.
- **D4:** Herkunft tatsächlich eingesetzter ereignisbezogener externer Unterstützung; das Ziel einer Patientenverlegung belegt nicht den Herkunftsraum der Hilfe. Ausländische Patientinnen und Patienten sind für sich keine internationale Unterstützung.
- **D5:** Fachlich prognostizierte Restdauer bis zum benannten Versorgungsziel; Notbetrieb, gesicherte Mindestversorgung und Regelbetrieb unterscheiden.
- **D6:** Belegte funktionale Kopplungen und Folgeausfälle; Krankenhausbezeichnung oder formaler KRITIS-Status ersetzen den Nachweis nicht.
- **D7/D8:** Nach Kodierleitfaden; wechselnde Registermeldungen oder geänderte Zählverfahren allein sind keine reale Versorgungsdynamik.
- **Zuordnung zum Raum (Ausnahme nach A.3):** Betroffene zählen im Ereignisraum. In diesem Baustein zählt der Behandlungs- oder Aufnahmeort zusätzlich als Kapazitätsbezug: Belegung und Belastung der aufnehmenden Versorgung werden dort geführt (Versorgungsbefund, D6). Dieselben Personen werden am Behandlungsort nicht erneut als Betroffene gezählt, auch nicht in D2.

**Offenlassen:** D2 ohne bestätigte Zahl unmittelbar Betroffener; D5 ohne Fachprognose für das benannte Versorgungsziel. Ein fachlich belegter Versorgungsausfall kann beurteilt werden, auch wenn D2 nicht bezifferbar ist.

### 4. Darstellung

Nach B11 und A.9.1. „Lage & Ereignis“: konkrete ausgefallene oder eingeschränkte Versorgungsleistung, Raum, Beginn und Stand. „Risiken & Auswirkungen“: unmittelbare Lücke, belegte Folgen für Regel- und Weiterversorgung und bedingte Kipprisiken getrennt. „Maßnahmen & Handlungsempfehlungen“: gesicherte Ersatzleistung, Status von Verlegung und Unterstützung, zuständig adressierter Klärungsbedarf. „Abhängigkeiten & Interdependenzen“: nur die bewertungsrelevanten Engpassketten mit tragfähigem Puffer. Die Kernaussage beantwortet: Welche Leistung reicht für wen aktuell oder absehbar nicht, was trägt noch, und welche Entscheidung oder Abstimmung ist erforderlich? Fristen nach A.4; akute erhebliche Gefahr nach A.7.3 unabhängig vom Wochenprodukt. Neubewertung an belegte Änderungen von Leistungsgrad, Aufnahme- oder Transportfähigkeit, Reichweite von Reserven oder Fachprognose knüpfen. Abschluss erst bei erreichtem Versorgungsziel und geklärtem Nachlauf, nicht allein mit dem Ende des MANV-Alarms (A.8.2). Keine Angaben zu einzelnen Patientinnen und Patienten und keine detaillierten Schwachstellen einzelner Einrichtungen.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Zuständige Gesundheits- und Katastrophenschutzbehörden; Träger des Rettungsdienstes und Leitstellen (A) · Krankenhaus-, Pflege-, Dialyse- und sonstige Leistungserbringer zu ihrer eigenen Leistung (B) · zuständige Länderstellen für Kapazitäts- und Verlegungskoordination; GMLZ bzw. Kleeblatt-Verfahren nur bei entsprechendem Vorgang. Die Krankenhausalarm- und -einsatzplanung (BBK) ist Fachhintergrund, kein aktueller Kapazitätsnachweis.

**Offene Punkte:** Kapazitätsquellen der Länder organisationsspezifisch benennen, mit räumlicher Abdeckung, Leistungsdefinition und Datenstand. Die übernehmende Stelle legt fachlich verantwortliche Funktion, Meldeweg für den Versorgungspfad und Prüfanlässe bei wesentlichen Kapazitäts- oder Verfahrensänderungen fest. Übungsfälle zu akutem MANV, längerem Einrichtungs- oder Infrastrukturausfall und häuslicher Versorgung; Verknüpfung mit C05, C10, C16 und gegebenenfalls C17 prüfen. Keine operativen Kontaktdaten in die öffentliche Beispielfassung.

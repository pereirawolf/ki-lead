<a id="b11"></a>

## B11. SOP LEAD: Gesundheitliche Lage / Epidemie

```yaml
kennung: "B11"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Gesundheitliche Lage / Epidemie (Infektionsgeschehen, gesundheitliche Versorgungslagen)"
art_vorschlag: ["Gesundheitliche Lage / Epidemie"]
zweck: "Reproduzierbare Erfassung gesundheitlicher Lagen mit möglichen übergreifenden Folgen für Bevölkerung und Gesundheitsversorgung; Dach für die Bausteine C09, C08, C07 und C10."
version: "2.2.0"
status: "Beispielfassung"
stand: "21.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 und 21.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema; Änderung internationaler Warnkategorien oder nationaler Surveillance-Produkte"
bisherige_kennung: "11"
bisherige_ids: ["sop-11"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Infektionsgeschehen im In- und Ausland mit Deutschlandbezug sowie gesundheitliche Versorgungslagen, auch ohne Infektionsgeschehen. Infektionsgefahr, Krankheitsschwere und Funktionsfähigkeit der Versorgung werden getrennt bewertet. Hitzebedingte Gesundheitsfolgen: B05. Vertiefung über Bausteine: MANV-Folgen und Ausfall von Klinik-, Pflege-, Dialyse- oder Rettungsdienstfunktionen C09 · Tierseuchen und zoonotische Exposition C08 · Auslandsausbruch und lokale Häufung C07 · Arzneimittel und kritisches medizinisches Material C10. Tierseuchen werden im Beispielprofil über C08 unter dieser Ereignisart geführt, auch ohne Humanerkrankung; das behauptet keine Humanepidemie. Beispiel dafür: ungewöhnliche Fallhäufung oder belegter klinischer Versorgungsengpass; ebenso ein fachbehördlich relevantes Einzelereignis, das Expositionsklärung, Kontaktmanagement, Sonderversorgung oder länderübergreifende Abstimmung erfordert. Beispiel ohne übergreifenden Befassungsbedarf: Einzelbefund ohne zusätzlichen fachlichen Prüf- oder Versorgungsbedarf.

**Befassungsanlässe:** RKI- oder Landesbewertung · ungewöhnliche Häufung · WHO-/ECDC-Signal mit begründetem Deutschlandbezug · Aufnahme oder Verdachtsabklärung einer Person mit hochpathogenem Erreger in Deutschland, auch nach medizinischer Evakuierung · belegte Kapazitätsprobleme · Monitoring: RKI-Berichte, wöchentlicher Bedrohungsbericht des ECDC und syndromische Surveillance. Eine internationale Warnkategorie (etwa eine gesundheitliche Notlage internationaler Tragweite nach den Internationalen Gesundheitsvorschriften) ist keine automatische deutsche Lagefeststellung und begründet für sich keine deutsche Gefährdungsstufe.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Fälle, Definitionen und Zeiträume sind bestätigt? | [RKI](https://www.rki.de/), erregerspezifische Berichte; Landesgesundheitsbehörde; Datenstand prüfen | L; D1/D2 | Verdacht, Bestätigung und Modellschätzung trennen. |
| R2 | Welche Übertragung oder Ursache ist belegt? | Gesundheitsamt, Landesgesundheitsbehörde | L/R | Wahrscheinlicher Übertragungsweg ist keine gesicherte Quelle. |
| R3 | Welche deutsche Risiko- und Versorgungseinschätzung liegt vor? | RKI, BMG, Landesgesundheitsbehörden | R; D2/D6 | Fallzahlen messen keine Versorgungskapazität. |
| R4 | Welcher internationale Verlauf ist relevant? | [WHO Disease Outbreak News](https://www.who.int/emergencies/disease-outbreak-news); [ECDC](https://www.ecdc.europa.eu/) | R/I | Auslandsschwere nicht in die deutsche Beurteilung übertragen; Abweichungen nach Stichtag und Falldefinition auflösen. |
| R5 | Welche Maßnahmen und Ressourcen sind bestätigt? | Lagemeldungen (A.3); STAKOB bei hochpathogenen Erregern; nationale IGV-Anlaufstelle (GMLZ im BBK, § 3 IGV-DG) für internationale Mitteilungen mit Deutschlandbezug | M; D3/D4 | Empfehlung, Anordnung und Umsetzung trennen; Sonderisolierkapazität ist Vorsorge, kein Ereignis. |
| R6 | Welche Frühindikatoren und Kapazitätsdaten liegen vor? | Syndromische Surveillance akuter Atemwegserkrankungen (RKI), Abwassermonitoring, Intensivregister, Kapazitätsnachweise der Länder | R; D6/D8 | Syndromische Signale, Abwassersignale, medizinische Kapazitätsdaten und tatsächliche regionale Belastung unterscheiden; Nenner, Zeitverzug und Aussagegrenzen nennen. |
| R7 | Ist eine länderübergreifende Patientenverlegung angefragt oder wirksam? | Lagemeldungen (A.3); GMLZ | M; D4 | Verlegung (z. B. nach dem Kleeblatt-Konzept) nach tatsächlich wirksamer Unterstützung bewerten; aus der bloßen Nennung des Verfahrens folgt keine D4-Stufe. |

**Abgleich epidemiologischer Angaben:** Für zentrale Zahlen Herausgeber, Gebiet, Datenstand, Veröffentlichungsdatum, Fallkategorie (bestätigt, wahrscheinlich, Verdacht) und Zählweise festhalten; neue Fälle im Zeitraum, kumulierte Fälle, derzeit Erkrankte, behandelte Personen und Todesfälle sind verschiedene Größen. Eine Kategorie, die die Quelle nicht nennt, wird nicht ergänzt. Ein späterer kumulierter Stand widerspricht einem früheren nicht allein wegen des höheren Werts; Sprünge können Nachmeldungen, geänderte Falldefinitionen oder Datenbereinigung abbilden, deshalb ohne vergleichbare Basis keine Wachstumsrate und keine Trendaussage. Die neueste einschlägige Ausgabe laufender Lageberichte prüfen oder begründen, warum ein älterer Stand verwendet wird; ältere Risikobewertungen mit ihrem Stand nennen und nicht als Bewertung eines späteren Ausbreitungsschritts darstellen.

**Erregerspezifische Fachangaben:** Erreger, Spezies bzw. Variante nach zuständiger Fachquelle bezeichnen. Übertragungswege, Expositionskriterien, Beobachtungsfristen sowie Aussagen zu Impfstoffen und Behandlung nur aus einschlägigen aktuellen Fachquellen übernehmen und nicht von verwandten Erregern übertragen. „Keine zugelassene spezifische Therapie“ heißt nicht „keine Behandlung möglich“ und ist für sich kein Engpass nach C10. Keine eigene medizinische Handlungsanweisung und keine selbst abgeleitete Labor- oder Schutzstufe.

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Welche direkt Betroffenen deckt die Datengrundlage ab? Kontakte, Fälle und Versorgungsbetroffene nicht addieren; Stufe 0 (<10) nur nach der D2-Nullregel (A.2): belegte Zahl von 1–9 direkt Betroffenen oder belegter Nullbefund einer laufenden, einschlägigen Surveillance.
- **D5:** Ausbruchskontrolle, Versorgungsentlastung und Regelbetrieb sind verschiedene Zielzustände.
- **D8:** Ändert sich das Geschehen oder nur Test- und Meldepraxis? Bei Auslandsgeschehen ohne deutsche Beobachtungsbasis offen, nicht 0 (Kodierleitfaden Abschnitt 7); ein steigender kumulierter Zähler im Ausland ist keine deutsche Dynamik.

**Beurteilung/Tendenz:** Individuelle Krankheitsschwere, Infektionsdynamik und Bevölkerungsschutzrelevanz eigenständig begründen; maßgeblich ist der nachgewiesene Bedarf im deutschen Bevölkerungsschutz, nicht allein die Fallzahl oder eine internationale Bezeichnung. Die Tendenz bleibt auch bei Auslandsgeschehen auf den benannten Referenzraum und das Zeitfenster bezogen (Kodierleitfaden Abschnitt 4). Ein internationaler Frühwarntreiber wird im Text und im Kennsatz `Neubewertung bei:` beschrieben; er trägt eine Tendenz nur mit, wenn eine dadurch veränderte Expositions-, Versorgungs- oder Vorsorgelage in Deutschland fachlich begründet und belegt ist, etwa durch eine fortgeschriebene amtliche Risikobewertung oder belegte Aufnahmeersuchen. Ohne tragfähige Vergleichsbasis bleibt die Tendenz leer; geringe gegenwärtige Relevanz ist weder Stabilisierung noch Entspannung.

**Offenlassen:** D2 bei unvereinbaren Bezugsgruppen; D1 und D5 ohne deutsches Bezugsobjekt; Tendenz ohne vergleichbare Datenbasis.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Belegte gesundheitliche Lage nach Raum und Zeitraum; Ausland und Deutschland strikt trennen |
| Risiken & Auswirkungen | Folgen für Menschen mit besonderen Bedarfen und für Versorgungskapazitäten, belegt vs. Szenario |
| Maßnahmen & Handlungsempfehlungen | Fachbehördliche Maßnahmen mit Status; Abstimmungs- oder Klärungsbedarf; keine eigene medizinische Empfehlung |
| Abhängigkeiten & Interdependenzen | Kopplung Gesundheitsämter – Kliniken – Labore – Rettungsdienst – Reise-/Amtshilfe |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** RKI (inkl. STAKOB) · Landesgesundheitsbehörden und Gesundheitsämter · BMG · nationale IGV-Anlaufstelle (GMLZ im BBK) · Auswärtiges Amt (Auslandsbezug)

**Offene Punkte:** Bausteine C09, C08, C07 und C10 mit fachlich zuständigen Stellen konkretisieren. Kalibrierfall für Auslandsgeschehen mit hochpathogenem Erreger: Ebola-Ausbruch (Bundibugyo-Virus) 2026, Beispielmeldung vom 21.10.2026 (A.10.3), Prüfszenarien im Vorschlag „SOP-LEAD_B11-C07_Vorschlag_konsolidiert_2026-10-21“; Rückblick nach A.8.3 nach Abschluss. Arbeitsanweisungen bzw. S1-Auswahl auf den Sachverhaltsschnitt nach C07, Abschnitt 1, prüfen.

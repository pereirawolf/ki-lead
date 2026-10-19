<a id="b02"></a>

## B02. SOP LEAD: Hochwasser / Überschwemmung

```yaml
kennung: "B02"
typ: "Ereignis-SOP"
lageart: "Hochwasser / Überschwemmung (Flusshochwasser, pluviale Überflutung/Sturzflut, Sturmflut)"
art_vorschlag: ["Hochwasser / Überschwemmung"]
zweck: "Reproduzierbare Erfassung und Bewertung von Fluss-, Starkregen- und Sturmflutereignissen mit Folgen für Bevölkerung, Einsatzwesen und KRITIS, einschließlich begründeter Vorwarnlagen."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema; Änderung länderspezifischer Meldestufen oder Vorhersageprodukte"
bisherige_kennung: "02"
bisherige_ids: ["sop-02"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Flusshochwasser, pluviale Überflutungen und Sturzfluten nach Starkregen sowie Sturmfluten mit belegter oder fachlich konkret prognostizierter Überflutung. Niedrigwasser gehört zu B05. Beispiel dafür: Pegel über Meldestufe an mehreren Flüssen mit Evakuierungen; ebenso eine belastbare Hochwasservorhersage mit Vorbereitungsbedarf (z. B. Räumung von Einrichtungen, länderübergreifende Unterstützung) vor der Ausuferung. Beispiel dagegen: bloßer Pegelanstieg ohne erkennbare Bevölkerungsschutzfolgen – keine automatische Aufnahme.

**Recherchepfade:** *Flusshochwasser* mit Pegeltrend, Vorhersage und Einzugsgebiet · *pluviale Überflutung/Sturzflut* mit lokalen Wirkungsnachweisen auch ohne Pegel · *Sturmflut* mit Küstenabschnitt und Scheitelzeit. Ein Flusspegel allein deckt weder Sturzflut noch Küstenhochwasser ab.

**Befassungsanlässe:** Warnung der Landeshochwasserzentralen · BSH-Sturmflutwarnung · DWD-Warnung Dauer-/Starkregen · Lagemeldung eines Landes · Monitoring: Hochwasservorhersagen der Landeshochwasserzentralen.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Pegel, Vorhersagen und Einzugsgebiete sind maßgeblich? | [Länderübergreifendes Hochwasserportal](https://hochwasserzentralen.de/), Landeshochwasserzentralen, PEGELONLINE (WSV); pegel- und produktabhängig | L; D1/D8 | Pegel nur mit Station, Zeit und Bezugssystem; Meldestufen immer mit Land, Pegel und Bedeutung angeben. Pegelstände, Abfluss und Wiederkehrintervalle sind ohne Bezugsbedingungen nicht bundesweit vergleichbar. |
| R2 | Besteht eine Sturmflutlage? | BSH, Wasserstandsvorhersage und Sturmflutwarndienst | L/R | Tidebedingte Scheitelzeiten genau angeben. |
| R3 | Welche Überflutungsflächen und Evakuierungen sind bestätigt? | Lagemeldungen (A.3); ggf. Copernicus EMS Rapid Mapping | L/R; D1/D2 | Warn-, Evakuierungs- und überflutete Fläche trennen; Evakuierte ≠ Betroffene. Bei Einrichtungen Selbstrettungsfähigkeit, Transport, Aufnahmeort und Betreuung prüfen (A.9.2, C16). |
| R4 | Wie ist der Zustand von Deichen, Talsperren und Rückhaltebecken? | Länder-Hochwasserberichte, Deichverbände, Talsperrenbetreiber und -aufsicht | R; D8 | Zustand nur nach zuständiger Fachbewertung darstellen. Deichverteidigung und vorsorglicher Kräfteeinsatz belegen allein keine Verschärfung. Durchnässung und Dauer der Einstaubelastung sind fachbehördlich zu bewertende Indikatoren der Deichsicherheit (`Neubewertung bei:`). |
| R5 | Welche Anlagen und Versorgungsfunktionen sind betroffen (Strom, Wassergewinnung, Kläranlagen, Kanalnetz)? | Betreibermeldungen (A.3) | R/I; D6 | Lage im Gefahrengebiet oder vorsorgliche Abschaltung belegt keinen Ausfall; Abwasserfolgen mit C11 vertiefen. |
| R6 | Treten wassergefährdende Stoffe aus (z. B. Heizöl)? | Umwelt- und Wasserbehörden; Lagemeldungen (A.3) | R/I; D6 | Kontamination nur nach Fachbewertung; zusätzlich B07 prüfen. |
| R7 | Welche Hilfe ist eingesetzt, welche Rückkehrbedingungen gelten? | Lagemeldungen (A.3); THW, Bundeswehr (Amtshilfe) | M; D4/D5 | Anforderung, Zusage und Einsatz sind verschiedene Zustände; sinkender Pegel bedeutet nicht Nutzbarkeit. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **Vor Eintritt:** Vorhersage, Vorlaufzeit, kritische Zugänge und Zustand der Schutzanlagen prüfen; Ist-Achsen ohne Wirkungsnachweis offen lassen (A.1 Nr. 1).
- **D1:** Nach tatsächlichem Überflutungs- und Einsatzraum kodieren, nicht nach Flusslänge mit Warnung oder Zahl berührter Länder.
- **D3:** Deich- und Gefahrenabwehrpflichten liegen nach Landesrecht bei Ländern, Kommunen und Deichverbänden; Bundesstellen (BfG, WSV) sind überwiegend fachlich bzw. für Bundeswasserstraßen zuständig.
- **D5:** Pegelrückgang, sichere Rückkehr und Wiederaufbau sind verschiedene Zielzustände – gemeinten benennen.
- **D8:** Vorsorglicher Kräfteeinsatz ist keine beobachtete Verschlechterung; maßgeblich sind Pegelverlauf, Ausuferung und Schadensentwicklung.

**Beurteilung/Tendenz:** Scheitel ist nicht Ende der Lage: unterliegende Abschnitte, Deichschäden, Trinkwasser-, Abwasser- und Schadstofffolgen können nachwirken. Tendenz je Flussabschnitt prüfen, wenn gegenläufig.

**Offenlassen:** D2 bei bloßen Flächenangaben; D5 bei unklaren Rückkehr- oder Wiederherstellungsbedingungen.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Pegelentwicklung, Scheitelzeit und belegte Überflutungsräume je Gewässer mit Zeitstand; Recherchepfad benennen |
| Risiken & Auswirkungen | Unterliegende Gebiete, Zustand der Schutzanlagen, Folgerisiken (Trinkwasser, Abwasser, Schadstoffe, Strom) als Prognose kennzeichnen |
| Maßnahmen & Handlungsempfehlungen | Länderübergreifende Unterstützung (laufend/angefragt), Räumung von Einrichtungen, Rückkehr- und Freigabefragen |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Strom, Trinkwasser, Abwasser, Verkehr und Telekommunikation belegt vs. möglich |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Landeshochwasserzentralen · BSH (Sturmflut) · Wasserstraßen- und Schifffahrtsverwaltung · Katastrophenschutzbehörden der Länder · GMLZ

**Offene Punkte:** Darstellungsbeispiel für Meldestufen mehrerer Länder in einem Sachverhalt ergänzen (Regel in R1).

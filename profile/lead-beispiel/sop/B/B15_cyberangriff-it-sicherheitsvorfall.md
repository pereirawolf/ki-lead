<a id="b15"></a>

## B15. SOP LEAD: Cyberangriff / IT-Sicherheitsvorfall

```yaml
kennung: "B15"
typ: "Ereignis-SOP"
lageart: "Cyberangriff / IT-Sicherheitsvorfall mit Folgen für Versorgung, KRITIS oder Verwaltung"
art_vorschlag: ["Cyberangriff / IT-Sicherheitsvorfall"]
zweck: "Reproduzierbare Erfassung von IT-Sicherheitsvorfällen, deren Folgen die Versorgung der Bevölkerung, KRITIS oder die Handlungsfähigkeit von Behörden berühren, einschließlich begründeter Vorsorgelagen."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "15"
bisherige_ids: ["sop-15"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Bestätigte oder behördlich begründet vermutete Vorfälle (z. B. Ransomware, DDoS, Ausnutzung kritischer Schwachstellen) mit Funktions- oder Versorgungsbezug, einschließlich der Eigenbetroffenheit von Leitstellen, Verwaltung und Hilfsorganisationen und der Kopplung über gemeinsame IT-Dienstleister. Technische Vorfallsbewältigung und Attribution sind nicht Gegenstand; Folgeausfälle zusätzlich über B08–B12; Notruf, Leitstellen und Warnmittel vertiefend Baustein C07. Beispiel dafür: Ransomware mit Ausfall von Bürgerdiensten und Leitstelle. Eine Schwachstellenwarnung allein belegt keinen Angriff; bei nachgewiesen betroffenen kritischen Funktionen und konkretem Vorbereitungsbedarf ist eine ausdrücklich als Vorsorge gekennzeichnete Befassung möglich (A.1 Nr. 1). Beispiel ohne übergreifenden Befassungsbedarf: Schwachstellenwarnung ohne bekannte Betroffenheit kritischer Funktionen.

**Befassungsanlässe:** BSI-Warnung oder -Mitteilung · öffentlich bekannter Vorfall bei Betreiber oder Behörde · Lagemeldung eines Landes · Monitoring: BSI-Warnungen und Sicherheitshinweise.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist zu Vorfall, betroffenen Diensten und Bestätigungsgrad bekannt? | Betreibermeldungen (A.3) | L; D1 | Störung, Angriff und vorsorgliche Abschaltung unterscheiden; IT-/OT-Ausfall, Vertraulichkeit, Integrität und Verfügbarkeit nach ihren Versorgungsfolgen unterscheiden. |
| R2 | Welche Schwachstelle oder Bedrohung ist fachlich beschrieben? | [BSI Sicherheitshinweise und Warnungen](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Cyber-Sicherheitslage/Technische-Sicherheitshinweise-und-Warnungen/technische-sicherheitshinweise-und-warnungen_node.html); anlassbezogen | L/R | Technische Warnung ist kein Angriffsnachweis; BSI-Kommunikation ist oft anonymisiert. |
| R3 | Welche Leistungen sind für welche Personen nicht verfügbar? | Lagemeldungen (A.3); betroffene Organisation | R; D2 | Datensätze, Nutzerkonten und betroffene Personen nicht gleichsetzen. |
| R4 | Welche Ersatzverfahren und Folgewirkungen bestehen? | Betreibermeldungen (A.3) | M/R; D6 | Backup ist kein Nachweis erfolgreicher Wiederherstellung; Kopplungen über gemeinsame IT-Dienstleister mehrerer Kommunen oder Betreiber wirken verzögert. |
| R5 | Welche Unterstützung und Koordination bestehen? | Lagemeldungen (A.3); BSI, Cybersicherheitsstellen der Länder | M; D3/D4 | IT-Betrieb, Gefahrenabwehr und Ermittlungen getrennt zuordnen; gesetzliche Meldepflichten (z. B. nach NIS-2-Umsetzung) sind keine Radar-Kriterien, Pflichtmeldungen sind in der Regel nicht öffentlich. |
| R6 | Welche Wiederanlauf- und Informationslage ist bestätigt? | Betreibermeldungen (A.3) | M/R; D5/D7 | Keine Täter- oder Ursachenzuschreibung aus unbestätigten Behauptungen; Ausfall behördlicher Kommunikation wirkt auf die Informationslage. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Nach dem Raum der betroffenen Leistungen kodieren (z. B. Kreis der ausgefallenen Verwaltung), nicht nach Serverstandort oder Angriffsgröße.
- **D5:** Notbetrieb, Teildienste, vertrauenswürdiger Wiederanlauf und Vollbetrieb sind verschiedene Zielzustände; nach Ransomware oft Wochen bis Monate – nur mit Prognose kodieren.
- **D7:** Einheitlich nach A.2: auch fachlich erhebliche Lücken und Widersprüche zu Leistungsgrad, Integrität oder Wiederanlauf, soweit sie die Befassung tatsächlich betreffen; ein technischer Kommunikationsausfall ist keine Voraussetzung. Manipulierte Daten können eine kritische Funktion beeinträchtigen, obwohl Systeme erreichbar bleiben. Fehlende technische Detailangaben allein erhöhen D7 nicht.

**Beurteilung/Tendenz:** Beurteilung nach Folgen für Bevölkerung und Versorgung, nicht nach technischer Raffinesse; beendete Angriffsaktivität kann mit langem Wiederherstellungsbedarf einhergehen – Tendenz auf Leistungserbringung beziehen. Ursachenoffenheit schließt Folgenbewertung nicht aus.

**Offenlassen:** D2 ohne belastbare Personenzahl; D4 ohne belegte externe Unterstützung.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Betroffene Organisation, ausgefallene Leistungen, Zeitstand; keine technischen Angriffsdetails |
| Risiken & Auswirkungen | Folgen für Versorgung, Notruf, Verwaltung; Ausweitung als Szenario |
| Maßnahmen & Handlungsempfehlungen | Notbetrieb, Ausweichverfahren, Information der Bevölkerung mit Status |
| Abhängigkeiten & Interdependenzen | Folgeausfälle in anderen Sektoren; Kopplung an Kommunikationswege und gemeinsame IT-Dienstleister |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Betroffene Betreiber/IT-Verantwortliche · BSI/zuständiges CERT · Cybersicherheitsstellen der Länder · Polizei bei Ermittlungsbezug

**Offene Punkte:** Vorsorgebefassung bei Schwachstellenwarnungen mit betroffenen kritischen Funktionen an Übungsfällen kalibrieren (A.10.3).

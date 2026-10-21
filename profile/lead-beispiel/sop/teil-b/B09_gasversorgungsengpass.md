<a id="b09"></a>

## B09. SOP LEAD: Gasversorgungsengpass

```yaml
kennung: "B09"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Gasversorgungsengpass (angespannte Versorgung, Stufen des Notfallplans Gas, regionale Einschränkungen, Anlagenstörungen)"
art_vorschlag: ["Gasversorgungsengpass"]
zweck: "Reproduzierbare Beobachtung der Gasversorgungslage von Frühwarnsignalen bis zu Versorgungseinschränkungen und ihrer Folgen für Wärme, Strom und Industrie."
version: "2.1.0"
status: "Beispielfassung"
stand: "21.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.10.2026"
pruefausloeser: "vor jeder Heizperiode (Rechtsrahmen und amtliche Stufe prüfen); Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "09"
bisherige_ids: ["sop-09"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Mengen- oder netzbedingte Einschränkungen der Gasversorgung auf Bundes- oder regionaler Ebene einschließlich Stufen des Notfallplans Gas; physische Leitungs-, Speicher- oder Anlagenstörungen; Fernwärme mit Gasabhängigkeit. Amtliche Gasstufe und konkreter örtlicher Ausfall sind unterschiedliche Sachverhalte. Wärme- und Kraftstofffunktion vertiefend über Baustein C12, auch bei gasbedingtem Wärmeausfall; B09 bleibt für Gasversorgung, Notfallplanstufen und gasbezogene Maßnahmen maßgeblich. Physische Angriffe zusätzlich mit B16. Beispiel dafür: Ausrufung einer Krisenstufe mit angeordneten Einschränkungen. Beispiel dagegen: Preisanstieg ohne physischen Mangel; lokaler Leitungsschaden mit kurzer Unterbrechung.

**Befassungsanlässe:** Ausrufung oder Änderung einer Stufe des Notfallplans Gas · BNetzA-Lagebericht mit Verschlechterung · regionale Abschaltungen · Ausfall eines gasabhängigen Wärmenetzes · Monitoring: BNetzA-Lageberichte und Speicherdaten. Die geltende Stufe wird stets aktuell bei BNetzA bzw. dem zuständigen Bundesministerium geprüft und nicht aus dieser SOP übernommen.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Stufe des Notfallplans Gas gilt, wie ordnet die BNetzA die Lage ein? | [BNetzA Gasversorgung](https://www.bundesnetzagentur.de/DE/Gasversorgung/start.html); Bundesministerium für Wirtschaft und Energie; je Lagebericht | L/R; D3 | Stufen sind Schwellen des Fachrechts und gelten für das Marktgebiet – nicht automatisch in die Lagebild-Beurteilung oder auf jeden Haushalt übertragen; Stufe mit Datum der Feststellung angeben. |
| R2 | Welche Flüsse, Speicher- und Verbrauchsdaten sind auffällig? | BNetzA-Lagebericht; AGSI+ (GIE) | L; D8 | Füllstand saisonal einordnen; Füllstand ist Vorsorgeanzeige, kein Versorgungsnachweis. |
| R3 | Welche regionalen Netze oder Verbraucher sind eingeschränkt? | Betreibermeldungen (A.3) (Fernleitungs-/Verteilnetz) | L/R; D1/D2 | Nationaler Engpass ≠ gleiche regionale Betroffenheit; Industrieabschaltung ist Steuerungsinstrument, keine Haushaltsbetroffenheit. |
| R4 | Welche Wärme-, Strom- und Produktionsfolgen sind belegt? | Betreibermeldungen (A.3); BNetzA | R/I; D6 | Gaskraftwerke/KWK koppeln zeitverzögert ins Stromnetz; wirtschaftliche Belastung ≠ Ausfall lebenswichtiger Versorgung. |
| R5 | Welche Schutzmaßnahmen für geschützte Kunden bestehen? | Lagemeldungen (A.3); Energieaufsicht der Länder | M; D3/D4 | Befugnis, Planung und angeordnete Maßnahme trennen; Ausbleiben von Haushaltsabschaltungen ist keine Entwarnung. |
| R6 | Welche Fernwärme- und Wärmeversorgung hängt von Gas ab, welche Wärmeleistung ist für Einrichtungen und Haushalte tatsächlich verfügbar? | Betreibermeldungen (A.3) (Fernwärme, Stadtwerke) | R/I; D6 | Reale Wärmeverfügbarkeit und Wiederinbetriebnahme von Netzen getrennt von Marktindikatoren prüfen; Wiederinbetriebnahme nur nach Betreiber- bzw. Fachangabe. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Haushalts- und Wärmeebene ist populationsrelevant, nicht die Marktebene; aus einer Stufenausrufung nicht auf D2 schließen.
- **D3:** Zurechnung ist stufenabhängig (Marktakteure, Netzbetreiber, BNetzA als Bundeslastverteiler in der Notfallstufe, Länder) – im Text begründen.
- **D8:** D8 bildet die belegten Änderungen im zurückliegenden Beobachtungszeitraum ab. Ein belegt stabiler Verlauf ergibt D8 = 0, auch wenn die Versorgung angespannt ist. Kälteeinbruch, technische Störung und auslaufende Reserven werden als bedingte Risiken bzw. fachliche Prognose in „Risiken & Auswirkungen“ und im Kennsatz `Neubewertung bei:` beschrieben.

**Beurteilung/Tendenz:** Eine Frühwarnstufe begründet für sich keine erhebliche Lage; maßgeblich sind belegte oder konkret prognostizierte Folgen für die Bevölkerung. Preisentlastung, Speicheranstieg und Verbesserung der Versorgung sind verschiedene Befunde. Stabilität ist keine Entwarnung, aber ein möglicher tatsächlicher Zustand.

**Offenlassen:** D2 ohne direkt betroffenen Personenkreis; D4 ohne Mobilisierung; D5 ohne konkrete Engpass- oder Wiederherstellungsperspektive.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Stufe (mit Feststellungsdatum), Speicher- und Versorgungslage mit Ausgabestand; Mengen- oder Anlagenereignis benennen |
| Risiken & Auswirkungen | Wärmeversorgung von Menschen mit besonderen Bedarfen, Strom, Industrie – belegt vs. Szenario der Fachbehörde |
| Maßnahmen & Handlungsempfehlungen | Maßnahmen des Notfallplans und der Länder mit Status; Vorsorge (z. B. Wärmeinseln) |
| Abhängigkeiten & Interdependenzen | Kopplung Gas – Strom – Fernwärme – Industrie – Lieferketten |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** BNetzA · Bundesministerium für Wirtschaft und Energie · Fernleitungs- und Verteilnetzbetreiber · Fernwärmebetreiber · Energieaufsicht und Katastrophenschutz der Länder

**Offene Punkte:** Rechtsrahmen (Notfallplan Gas, EnSiG, EU-Gasversorgungssicherheitsverordnung) vor jeder Heizperiode amtlich prüfen und Ergebnis im Änderungsverlauf vermerken. **Überfällig:** Die Prüfung für die Heizperiode 2026/27 ist nicht dokumentiert; sie ist vor der nächsten Verwendung dieser SOP nachzuholen. Bis dahin werden Rechtsrahmen und Krisenstufen ausschließlich aus aktuellen amtlichen Quellen übernommen (A.6).

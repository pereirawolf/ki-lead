<a id="b04"></a>

## B04. SOP LEAD: Erdbeben

```yaml
kennung: "B04"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Erdbeben (Inland sowie Auslandsbeben mit Deutschlandbezug)"
art_vorschlag: ["Erdbeben"]
zweck: "Reproduzierbare Einordnung schadensrelevanter Erdbeben in Deutschland und von Auslandsbeben mit deutschem Hilfe-, Betroffenheits- oder Versorgungsbezug."
version: "2.1.1"
status: "Beispielfassung"
stand: "22.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "04"
bisherige_ids: ["sop-04"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Beben mit Schadensmeldungen in Deutschland, deutlich verspürte Beben mit daraus folgendem Prüf- oder Abstimmungsbedarf sowie Auslandsbeben mit Deutschlandbezug nach A.1 Nr. 6 (angefragte oder geleistete deutsche Hilfe, betroffene Deutsche, berührte Liefer- oder Verkehrsbeziehungen). Ein verspürtes Beben eröffnet die Prüfung; Wahrnehmbarkeit allein begründet noch keine Aufnahme. Nichtseismische Massenbewegungen, Erdfälle und Einstürze: Baustein C02; geologische Folgegefahren eines Bebens mit C02 verknüpfen, ohne beide Recherchelogiken zu verschmelzen. Beispiel dafür: Beben mit Gebäudeschäden in einer Region. Beispiel dagegen: verspürtes Beben ohne Schäden und ohne Prüfbedarf; Auslandsbeben ohne Deutschlandbezug.

**Befassungsanlässe:** Erdbebenmeldung BGR/Landeserdbebendienst · Schadensmeldung eines Landes · internationales Hilfeersuchen · Monitoring: Erdbebenmeldungen der BGR und der Landeserdbebendienste.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Lage, Tiefe und Magnitude sind bestätigt? | [BGR Erdbebenüberwachung](https://www.bgr.bund.de/DE/Themen/Erdbeben-Gefaehrdungsanalysen/Seismologie/Seismologie/seismologie_node.html), GFZ GEOFON, Landeserdbebendienste; ereignisbezogen | L | Automatische Erstlösungen werden revidiert – Stand angeben. |
| R2 | Wo bestehen Erschütterungs- und Schadenswirkungen? | Lagemeldungen (A.3); Bauaufsicht | L/R; D1 | Verspürt ≠ Schaden; Magnitude beschreibt keinen örtlichen Schaden; Erstmeldungen unvollständig. |
| R3 | Welche Menschen sind verletzt, vermisst oder ohne sichere Unterkunft? | Lagemeldungen (A.3) | R; D2 | Gruppen und Zeitstände trennen (A.3 Zählregeln); Wahrnehmungsmeldungen sind keine Betroffenheit. |
| R4 | Welche Netze, Gebäude, Verkehrswege und Anlagen sind nutzbar? | Betreibermeldungen (A.3) | R/I; D6 | Kontrollbedingte Sperrung von bestätigter Beschädigung trennen; Standsicherheit nur nach Fachbewertung. |
| R5 | Welche Nachbebeninformationen liegen vor? | BGR/GFZ-Fachauskunft, EMSC | R; D8 | Nachbebenwahrscheinlichkeit als Fachaussage übernehmen, keine eigene Vorhersage. |
| R6 | Ist deutsche Hilfe bei Auslandsbeben angefragt oder eingesetzt? | GMLZ, Auswärtiges Amt, THW, EU-Katastrophenschutzverfahren | M | Deutsche Auswirkungen, Bindung deutscher Fähigkeiten (A.7.4) und internationale Hilfe als getrennte Gegenstände behandeln (A.1 Nr. 6); deutsche Hilfe ins Ausland ergibt keinen D4-Wert (Abschnitt 3). |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1/D2:** Belegte Wirkungsräume und Betroffene in Deutschland unabhängig vom Epizentrum; ausländische Schäden nicht in deutsche D1/D2-Werte übertragen; ohne deutschen Wirkungsnachweis offen.
- **D3:** Schadensfeststellung und Gefahrenabwehr bei Ländern/Kommunen; BGR/GFZ sind fachlich-wissenschaftlich tätig.
- **D4:** Wie A.2: Herkunft der tatsächlich eingesetzten externen Unterstützung für die bewertete Lage im Referenzraum. Deutsche Hilfe bei einem Auslandsbeben und die dadurch gebundenen deutschen Fähigkeiten sind Textbefunde (A.7.4) und ergeben keinen D4-Wert; keine eigene D4-Auslegung je Gegenstand (wie C07). Internationale Hilfe für eine Lage in Deutschland bleibt D4-relevant.
- **D5:** Sichere Gebäudenutzung, Notversorgung und Wiederherstellung sind verschiedene Zielzustände.

**Beurteilung/Tendenz:** Magnitude ist keine Beurteilung. Bei Auslandsbeben die Schwere vor Ort nicht auf die deutsche Beurteilung übertragen, die Bindung deutscher Fähigkeiten aber nicht ausblenden; abnehmende Nachbeben ersetzen keine Bewertung fortdauernder Schäden.

**Offenlassen:** D1 und D2 ohne belegte Wirkung bzw. unmittelbare Betroffenheit – ein Gebäudeschaden ist dafür nicht zwingend, eine belegte Evakuierung oder ein belegter Funktionsausfall genügt; D5 ohne benannten Zielzustand und tragfähige Prognose; bei Auslandsbeben die Achsen, für die kein deutscher Betrachtungsgegenstand festgelegt ist.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Messdaten (mit Revisionsstand) und Schadensbild getrennt; bei Auslandsbeben Deutschlandbezug benennen |
| Risiken & Auswirkungen | Nachbeben, Standsicherheit, Folgeschäden an Anlagen (Talsperren, Industrie, Leitungen) als fachliche Prognose |
| Maßnahmen & Handlungsempfehlungen | Begutachtungen, Sperrungen, Auslandseinsätze mit Status |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Wasser, Energie, Industrieanlagen belegt vs. möglich; geologische Folgegefahren (C02) |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** BGR · Landeserdbebendienste · GFZ · Bauaufsicht der Länder · Auswärtiges Amt/GMLZ (Auslandsbeben)

**Offene Punkte:** Kontrastbeispiel für den Kodierleitfaden erarbeiten (A.10.3): deutsche Hilfe bei einem Auslandsbeben (kein D4-Wert) gegenüber internationaler Hilfe für eine Lage in Deutschland (D4-relevant), abgestimmt mit C07. Rechercheeinstieg BGR prüfen: Der Link in R1 war am 21.10.2026 nicht abrufbar; ein Umzug in die Struktur „Erdbebendienst_Bund“ ist möglich, aber nicht amtlich bestätigt (Quellenregister S007, A.6); GFZ GEOFON und Landeserdbebendienste als Ausweichweg.

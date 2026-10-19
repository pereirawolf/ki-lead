<a id="b01"></a>

## B01. SOP LEAD: Unwetter / Sturm

```yaml
kennung: "B01"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Unwetter / Sturm (Sturm, Orkan, Gewitter, Starkregen, Hagel, Tornado)"
art_vorschlag: ["Unwetter / Sturm"]
zweck: "Reproduzierbare Erfassung und Bewertung meteorologischer Unwetterlagen mit Schadens-, Versorgungs- und Betroffenenbezug für den deutschen Bevölkerungsschutz, einschließlich begründeter Vorwarnlagen."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema; Änderung der DWD-Warnprodukte"
bisherige_kennung: "01"
bisherige_ids: ["sop-01"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Sturm/Orkan, Gewitter, Starkregen, Hagel und Tornados einschließlich ihrer Folgen (Baum-, Leitungs-, Verkehrsschäden). Winterliche Lagen mit B06. **Abgrenzung zu B02:** Starkregen ohne konkrete Überflutungswirkung bleibt B01. Sobald eine Überflutung von Siedlungs- oder Verkehrsflächen belegt oder fachlich konkret prognostiziert ist, wird zusätzlich B02 (Recherchepfad Sturzflut) herangezogen – nicht erst nach eingetretener Überflutung. Wetterphase und Wirkung getrennt darstellen; denselben Schaden nicht doppelt zählen. Beispiel dafür: Orkan mit flächigen Baumwürfen, Bahnsperrungen und regionalen Stromausfällen; ebenso eine belastbare Unwetterwarnung mit absehbaren kritischen Auswirkungen vor Schadenseintritt (A.1 Nr. 1). Beispiel ohne übergreifenden Befassungsbedarf: örtlich begrenzte Warnung ohne erkennbaren zusätzlichen Vorbereitungs-, Abstimmungs- oder Versorgungsbedarf im Betrachtungszeitraum; örtliches Ereignis ohne überörtliche Folgen.

**Befassungsanlässe:** DWD-Unwetterwarnung bzw. Warnlagebericht mit absehbarer Wirkung · bestätigte Schadenshäufung oder landesrechtlich festgestellte herausgehobene Lage (A.9.4) · länderübergreifende Folgen in Verkehr/Energie · Anfrage eines Landes · Monitoring: DWD-Warnlage und Lagemeldungen der Länder.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welches Phänomen trifft welchen Raum und Zeitraum? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen | L/R; D1/D8 | Warngebiet ist kein bestätigtes Schadensgebiet. |
| R2 | Welche Schäden, Sperrungen und Verletzten sind bestätigt? | Lagemeldungen (A.3) | L/R; D1/D2 | Einsatzstellen ≠ Betroffene; Meldungen desselben Schadens nicht addieren; Länder melden in unterschiedlichem Rhythmus. |
| R3 | Welche Strom-, Verkehrs- und Telekommunikationsdienste sind beeinträchtigt? | Betreibermeldungen (A.3); DB-, Autobahn-, Flughafenmeldungen | R/I; D6 | Vorsorgliche Sperrung ≠ Schaden; frühe „keine größeren Störungen“ nicht als final werten. |
| R4 | Welche Warnungen und Schutzmaßnahmen gelten? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | M | Teilentwarnung ist keine Gesamtentwarnung; Warnlage nach A.9.3. |
| R5 | Welche Hilfe ist tatsächlich angefordert oder eingesetzt? | Lagemeldungen (A.3) | M; D4 | Bereitschaft, Anforderung und Einsatz trennen. |
| R6 | Was ist über Folgewetter und Wiederherstellung bekannt? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; Betreibermeldungen (A.3) | R/M; D5/D8 | Aufräum- und Reparaturdauer beim Betreiber belegen, nicht aus Wetterende ableiten. |
| R7 | Sind Freiluftveranstaltungen, Campingplätze oder andere exponierte Gruppen im Warngebiet? | Lagemeldungen (A.3); zuständige Ordnungsbehörde; anlassbezogen | R/M | Warnvorlauf, Erreichbarkeit und tatsächliche Schutzmöglichkeit erfassen (A.9.2); Absage ist Vorsorge, keine Betroffenheit. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **Vor Schadenseintritt:** zeitliche Überlagerung, wiederholte Belastung derselben Räume, Erreichbarkeit kritischer Einrichtungen und verfügbare Vorbereitungszeit prüfen; Ist-Achsen ohne Wirkungsnachweis offen lassen (A.1 Nr. 1).
- **D1:** Warnraum und belegter Wirkungsraum unterscheiden; nach Schadens- bzw. Einsatzraum kodieren.
- **D5:** Wetterende ist kein Zielzustand; Aufräumen und Wiederherstellung dauern oft Tage – Zielzustand benennen.
- **D8:** Nachlassender Wind bei fortbestehenden Ausfällen ist keine Stabilisierung der Gesamtlage; prüfen, was sich stabilisiert.

**Beurteilung/Tendenz:** Die DWD-Warnstufe ist keine Beurteilung. Abklingender Wind bedeutet bei fortdauernden Versorgungsstörungen noch keine Entspannung aller Folgen; nachgewiesene Teilverbesserungen können eine begründete Teilentspannung tragen (A.4).

**Offenlassen:** D1 und D2 bei reiner Vorwarnung; D2 ohne belastbare Personenzahl; D5 ohne benannten Zielzustand und Wiederherstellungsprognose.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Wetterphase, belegte Schäden und Schwerpunkträume mit Zeitstand; bei Vorwarnung Warnung, Prognose und Vorbereitungsfenster getrennt |
| Risiken & Auswirkungen | Folgegefahren für Versorgung, Zugänglichkeit und Menschen mit besonderen Bedarfen (Kliniken, Pflege, exponierte Gruppen) – belegt vs. Prognose |
| Maßnahmen & Handlungsempfehlungen | Geltende Warn-/Sperrmaßnahmen mit Status, länderübergreifende Hilfe, offene Informationsbedarfe |
| Abhängigkeiten & Interdependenzen | Wechselwirkung Verkehr – Strom – Kommunikation; belegte von möglichen Kopplungen trennen |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** DWD (Wetterprognose) · Lagezentren der Länder · Betreiber (Wiederherstellungsstatus) · GMLZ

**Offene Punkte:** Kriterien für „absehbare kritische Auswirkungen“ vor Schadenseintritt an Übungs- und Rückblickfällen kalibrieren (A.10.3).

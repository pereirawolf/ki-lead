<a id="c12"></a>

## C12. Baustein LEAD: Kraftstoff- und Wärmeversorgung

```yaml
kennung: "C12"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein unter bestehendem Dach"
lesegruppe: "Versorgung, Kommunikation und Logistik"
lageart: "Störung der Kraftstoffversorgung (Einsatz, Notstrom, Mobilität) und der Wärmeversorgung unabhängig vom Gas"
art_zuordnung: ["KRITIS-Ausfall", "Gasversorgungsengpass", "Stromausfall / Blackout"]
art_hinweis: "„Gasversorgungsengpass“ nur bei Gasbezug; „Stromausfall / Blackout“ nur bei tatsächlich eingetretenem Stromausfall"
anschluss: "B08, B09, B12"
zweck: "Eigener Recherchepfad für Logistik und reale Abgabe von Kraftstoff und für verfügbare Wärmeleistung."
version: "1.0.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N05"
bisherige_ids: ["baustein-n05"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Versorgungsunterbrechung oder drohender Nachschubabriss bei Kraftstoff für Einsatz, Notstrom und kritische Mobilität; Ausfall von Fernwärme oder anderer Wärmeversorgung; Nachbetankungsbedarf kritischer Ersatzversorgung. Nationale oder kommerzielle Bestände belegen keine örtlich rechtzeitig verfügbare Menge. Keine eigene Zuteilungsentscheidung und keine technische Wiederanfahranweisung.

**Befassungsanlässe:** Belegte Versorgungsunterbrechung oder drohender Nachschubabriss mit Schutzbezug · Ausfall von Fernwärme oder anderer Wärmeversorgung · Nachbetankungsbedarf kritischer Ersatzversorgung.

**Zuordnung im Schema:** „KRITIS-Ausfall“; „Gasversorgungsengpass“ nur bei Gasbezug; „Stromausfall / Blackout“ bei tatsächlich eingetretenem Stromausfall.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche kritischen Funktionen benötigen welche Energieträger in welchem Zeitraum? | Lagemeldungen (A.3); Betreibermeldungen (A.3) | R/I; D6 | Bedarf je Funktion, nicht pauschal je Region. |
| R2 | Welche nutzbaren lokalen Bestände und tatsächlichen Abgabe- und Transportmöglichkeiten sind belegt? | Betreibermeldungen (A.3) (Tankstellen, Lager, Logistik); [BBK: Nationale Reserve Blackout](https://www.bbk.bund.de/DE/Das-BBK/Zivile-Verteidigung/ZS-Notstrom/zs-notstrom.html) (Hintergrund) | R/M; D5 | Bestand ≠ abgabefähige Menge ≠ rechtzeitig geliefert. |
| R3 | Reichen Personal, Stromversorgung, Zufahrt und Entladung zur Nutzung des Bestands aus? | Betreibermeldungen (A.3); Lagemeldungen (A.3) | R/I; D6 | Tankstellen ohne Strom geben nicht ab; Zufahrt nach C13. |
| R4 | Welche Nachfrage ist prioritätsbedingt bereits gebunden, welche Lücke bleibt? | Lagemeldungen (A.3) | M | Bedarfsdeckung nach A.9.1; keine eigene Priorisierung. |
| R5 | Welche Wärmeleistung ist für betroffene Einrichtungen und Haushalte noch verfügbar? | Betreibermeldungen (A.3) (Fernwärme, Stadtwerke) | R; D2/D6 | Wärmeschutzorte nur bei belegtem Betrieb nennen (A.9.2). |
| R6 | Wann sind Nachversorgung und sichere Wiederinbetriebnahme nach zuständiger Fachprognose möglich? | Betreibermeldungen (A.3); zuständige Fachbehörde | M; D5 | Wiederinbetriebnahme nur nach Betreiber- bzw. Fachangabe. |

### 3. Auswertung: Prüfpunkte

- **D5:** Zielzustand (Nachversorgung gesichert, Wärme wiederhergestellt) benennen; Reichweite von Puffern nur nach Beleg.
- **D6:** Kraftstoff ist Puffer vieler KRITIS-Funktionen; Wirkungskette mit Reichweite angeben (A.2).

**Offenlassen:** D2 ohne belegten Personenkreis; D5 ohne Liefer- oder Wiederinbetriebnahmeprognose.

### 4. Darstellung

Nach der Dach-SOP; Bedarf, nutzbarer Bestand, Abgabe und Lücke getrennt.

### 5. Ansprechstellen und Pflege

**Offene Punkte:** Zuständige Stellen für Kraftstoffbevorratung und -verteilung organisationsspezifisch benennen.

<a id="b08"></a>

## B08. SOP LEAD: Stromausfall / Blackout

```yaml
kennung: "B08"
typ: "Ereignis-SOP"
lageart: "Stromausfall / Blackout (großflächiger oder langandauernder Netzausfall)"
art_vorschlag: ["Stromausfall / Blackout"]
zweck: "Reproduzierbare Erfassung großflächiger oder langandauernder Stromausfälle, ihrer Ersatzversorgung und ihrer zeitverzögerten Kaskadeneffekte."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "08"
bisherige_ids: ["sop-08"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Stromausfälle, die nach Dauer, Fläche oder Folgewirkung über kurze örtliche Störungen hinausgehen, bis zur Systemstörung. Die Ursache wird zusätzlich über die jeweilige SOP geprüft (06, 15, 16). Eine angekündigte Lastabschaltung oder eine Warnung vor Gefährdung der Systemsicherheit ist vom bereits wirksamen Ausfall zu trennen; sie kann eine Vorwarnlage nach A.1 Nr. 1 begründen. Beispiel dafür: mehrtägiger Ausfall nach Mastbruch (Münsterland 2005). Beispiel dagegen: Störung, die in wenigen Stunden ohne Folgeausfälle behoben ist; Strompreise allein belegen keinen Ausfall.

**Befassungsanlässe:** Störungsmeldung eines Netzbetreibers · Warnung eines Übertragungsnetzbetreibers vor Gefährdung der Systemsicherheit oder angekündigte Lastabschaltung · Lagemeldung eines Landes bzw. landesrechtlich festgestellte herausgehobene Lage (A.9.4) · BNetzA-Mitteilung · Monitoring: Störungsmeldungen der Netzbetreiber und VOST-Auswertung.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Netzbereiche sind seit wann ohne Versorgung? | Betreibermeldungen (A.3) (Übertragungs-/Verteilnetz) | L; D1 | Nachlaufende Informationen verändern D1/D5; Stand angeben. |
| R2 | Wie viele Personen sind direkt betroffen? | Lagemeldungen (A.3); Netzbetreiber | R; D2 | Anschlüsse/Haushalte ≠ Personen; MW-Angaben ≠ Personen; Umrechnung nur nach A.3 Zählregeln. |
| R3 | Welche kritischen Dienste sind bereits eingeschränkt? | Lagemeldungen (A.3); Wasserversorger, TK-Anbieter, Kliniken | R/I; D6 | Folgen setzen zeitverzögert ein (Notstrom-, Wasser-, Akkureserven). |
| R4 | Trägt die bewertungsentscheidende Ersatzversorgung die benötigte Funktion, und wie lange? | Betreibermeldungen (A.3); Kliniken, Wasserversorger; [BBK Stromausfall](https://www.bbk.bund.de/DE/Themen/Kritische-Infrastrukturen/KRITIS-Gefahrenlagen/Stromausfall/stromausfall_node.html) (Hintergrund) | R/M; D5/D6 | Unter realer Last? Angeschlossen und in Betrieb? Wer betreibt und wartet sie? Wie lange reicht verfügbarer Kraftstoff, und kann rechtzeitig nachversorgt werden (C08)? Vorhanden, betriebsbereit, eingesetzt und wirksam getrennt halten; Nennlaufzeit ist keine gesicherte Reichweite; keine pauschalen 24-/72-Stunden-Annahmen. |
| R5 | Welche Mobilisierung und Warnung bestehen? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen; GMLZ, THW | M; D4 | Herkunft der eingesetzten Aggregate/Kräfte für D4 maßgeblich; Bedarfsdeckung nach A.9.1. |
| R6 | Welche Netz- und Systemeinordnung ist hilfreich? | [SMARD](https://www.smard.de/); ENTSO-E-Transparenzplattform; BNetzA | L/R | Markt- und Frequenzdaten ersetzen keine Störungs- und Wiederaufbaumeldung. |
| R7 | Wie ist der Stand von Netzwiederaufbau und Wiederzuschaltung, welche Anlaufstellen für die Bevölkerung sind betriebsfähig? | Betreibermeldungen (A.3); Lagemeldungen (A.3) | L/M; D5 | Teilwiederversorgung ≠ Folgenbeseitigung; Anlaufstellen nur bei belegtem Betrieb nennen. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Personen nur mit Quelle oder offengelegter Umrechnung; sonst offen.
- **D5:** Technische Wiederversorgung ist nicht Folgenbeseitigung (Wasser, Telekommunikation, Verkehr) – Zielzustand benennen.
- **D6:** Mit zunehmender Dauer kann der Kopplungsgrad steigen (Reserven erschöpft); D6 wird aber nicht allein aus der vergangenen Ausfalldauer erhöht – jedes Glied der Kette belegen.

**Beurteilung/Tendenz:** Dauer und Folgekette tragen die Beurteilung, nicht die Ausfallleistung: ein kurzer flächiger Ausfall ohne Folgen kann geringfügig, ein lokaler mehrtägiger erheblich sein. Teilwiederversorgung bei erschöpften Reserven ist nur begrenzte Entspannung.

**Offenlassen:** D2 ohne Personengrundlage; D5 ohne Betreiberprognose; fehlende Statusmeldungen nicht als Ende des Ausfalls lesen.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Raum, Anschlüsse/Personen, Ursache (belegt/vorläufig), Wiederversorgungsstand mit Zeitachse |
| Risiken & Auswirkungen | Kaskade mit Zeitverzug; Menschen mit besonderen Bedarfen (Heimbeatmung, Pflege) – belegt vs. mit Dauer erwartbar |
| Maßnahmen & Handlungsempfehlungen | Betriebsfähigkeit der Notstromversorgung kritischer Einrichtungen, Kraftstoffnachschub, Anlaufstellen, länderübergreifender Lageabgleich |
| Abhängigkeiten & Interdependenzen | Folgekette Strom → Wasser/Abwasser/TK/Gesundheit/Verkehr; Ursache-SOP benennen |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Übertragungs- und Verteilnetzbetreiber · BNetzA · Lagezentren der Länder · GMLZ · THW · BSI bei IT-Bezug

**Offene Punkte:** Belegte Lagenradar-Profile früherer Stromausfälle mit reproduzierbarer Kodierung als Kalibrierbeispiele außerhalb dieser SOP zusammenstellen (A.10.3).

<a id="b05"></a>

## B05. SOP LEAD: Extremhitze / Dürre

```yaml
kennung: "B05"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Extremhitze / Dürre (Hitzeperioden; meteorologische, Boden- und hydrologische Trockenheit, Niedrigwasser)"
art_vorschlag: ["Extremhitze / Dürre"]
zweck: "Reproduzierbare Erfassung akuter Hitzeperioden und langsam verlaufender Trockenheit in zwei Teilprofilen mit Folgen für Gesundheit, Wasserversorgung, Wasserstraßen, Energie und Vegetationsbrandgefahr."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "30.04.2027"
pruefausloeser: "vor jeder Hitzesaison; Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema; Änderung des RKI-Berichtsverfahrens"
bisherige_kennung: "05"
bisherige_ids: ["sop-05"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Hitzeperioden mit Gesundheitsfolgen sowie mehrmonatige Trockenheit, sinkende Grund- und Oberflächenwasserstände und Niedrigwasser – auch ohne akute Hitzewelle. Einschränkungen der Trinkwasserversorgung zusätzlich mit B10. Beispiel dafür: Hitze mit geschätzter Übersterblichkeit und regionalen Entnahmeverboten; anhaltendes Niedrigwasser mit Transporteinschränkungen. Beispiel dagegen: Rohrbruch ohne Wetterbezug (B10).

**Teilprofile:** Die SOP arbeitet mit zwei Teilprofilen unter derselben Ereignisart, weil Bezugsräume, Zeitverzug und Entspannungsindikatoren verschieden sind:
- **5a Hitzeperiode:** Dauer, nächtliche Entlastung, fachlich bestätigte Gesundheitsbelastung, Hitzeschutz und Funktionsfähigkeit ambulanter, stationärer und häuslicher Versorgung (Prüffragen R1–R4).
- **5b Trockenheit/Niedrigwasser:** meteorologische und Bodenindikatoren getrennt von Grundwasser, Rohwasser, Wasserbereitstellung, Kühlwasser, Abladetiefe und tatsächlicher Transportleistung (Prüffragen R5–R8).

Ein Sachverhalt kann beide Teilprofile berühren; dann werden sie getrennt bewertet.

**Befassungsanlässe:** DWD-Hitzewarnung · RKI-Wochenbericht Hitzemortalität · Dürremonitor zeigt außergewöhnliche Dürre · Niedrigwasserwarnungen · kommunale Entnahmeverbote. Monitoring: DWD-Hitzewarnungen (5a), UFZ-Dürremonitor und BfG-Niedrigwasserinformationen (5b).

### 2. Erfassung: Prüffragen

#### Teilprofil 5a: Hitzeperiode (R1–R4)

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Hitzeintensität und -dauer sind prognostiziert, wie ist die nächtliche Entlastung? | [DWD](https://www.dwd.de/), Hitzewarnungen; laufend; Ausgabe und Gültigkeit prüfen | L/R; D1/D8 | Warnstufe ist Prognose, keine Mortalitätsaussage. |
| R2 | Welche hitzebedingte Mortalität wird geschätzt? | [RKI Hitzemortalität](https://www.rki.de/DE/Themen/Gesundheit-und-Gesellschaft/Gesundheitliche-Einflussfaktoren-A-Z/H/Hitze/Bericht_Hitzemortalitaet.html); saisonal wöchentlich; Destatis/EuroMOMO zum Vergleich | R; D2 | Modellbasierte, zeitverzögerte Schätzung mit Prädiktionsintervall und kumulativem Berichtsbezug; Bezugswoche und Revisionsstand angeben; nicht mit aktuellen Erkrankten addieren und nicht ungeprüft als Direktbetroffenheit zum Stichtag kodieren (A.2). |
| R3 | Welche Rettungs-, Pflege- und Versorgungsbelastungen sind belegt? | Lagemeldungen (A.3); Gesundheitsbehörden | R/M; D2/D4 | Einsatzaufkommen ≠ Personalüberlastung; Personalausfälle nur mit eigener Quelle; häusliche Versorgung mitprüfen (A.9.2). |
| R4 | Welche Hitzeschutzmaßnahmen gelten und wirken? | Hitzeaktionspläne der Länder und Kommunen, Gesundheitsbehörden; anlassbezogen | M | Plan, umgesetzte Maßnahme und belegte Wirkung trennen. |

#### Teilprofil 5b: Trockenheit/Niedrigwasser (R5–R8)

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R5 | Welche Bodentrockenheit ist modelliert? | [UFZ-Dürremonitor](https://www.ufz.de/index.php?de=37937); täglich; [Dürreatlas BKG](https://gdz.bkg.bund.de/index.php/default/duerreatlas.html) zur Einordnung | L | Ober- und Gesamtboden trennen; Bodenfeuchte ist weder Grundwasserstand noch Trinkwassermangel. |
| R6 | Wie entwickeln sich Grundwasser und Pegel? | [BGR-GRUVO](https://gruvo.bgr.de/); [BfG Niedrigwasser/NIWIS](https://www.bafg.de/DE/05_Wissen/01_Infoplattformen/Niedrigwasser/niedrigwasser_node.html) | R/I; D5 | Grundwasser reagiert verzögert. |
| R7 | Welche Einschränkungen der Wasserbereitstellung bestehen? | Betreibermeldungen (Wasserversorger), Wasser- und Gesundheitsbehörden; fallbezogen | R/I; D6 | Entnahmeverbot für Oberflächenwasser ≠ Trinkwassereinschränkung; Rohwasser und Trinkwasser trennen; einzelne Kommunen ≠ Landeslage. |
| R8 | Welche Kühlwasser- und Transportfolgen sind belegt? | Betreibermeldungen (Kraftwerke, Binnenschifffahrt), BNetzA; WSV/BfG zu Abladetiefen | R/I; D6 | Pegel, Abladetiefe und tatsächliche Transportleistung getrennt bewerten; Leistungsreduktion ≠ Versorgungsausfall. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Modellierte Todesfälle sind Schätzungen, keine beobachtete Personenzahl zum Stichtag; Kodierung nur nach A.2 „Keine unbelegte Präzision“, bei unpassender Datengrundlage offen.
- **D5:** Temperaturentlastung (5a), Wiederauffüllung der Wasserressourcen (5b) und Regelversorgung sind verschiedene Zielzustände.
- **D6:** Kopplungen zu Wasser, Gesundheit, Schifffahrt, Energie (Kühlung) und Landwirtschaft einzeln belegen; plausible nicht mit belegten Kopplungen verrechnen.

**Beurteilung/Tendenz:** Tendenzen je Teilprofil mit Raum und Horizont ausweisen: Abkühlung kann die Gesundheitsbelastung senken, während Wasserdefizite fortbestehen. Erneute Verschärfung nur benennen, wenn Prognose oder belegte Saisonalität sie stützt.

**Offenlassen:** D2 bei unzureichender Datenbasis; D5 ohne definierten Zielzustand; D4 meist ohne Beleg für externe Hilfe.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Teilprofil(e) benennen; Hitze- und Trockenheitskomponenten (Temperatur, Boden, Grundwasser, Pegel) mit Zeitstand und Kalenderwochenbezug |
| Risiken & Auswirkungen | Gesundheits- und Versorgungseffekte belegt vs. bedingt; unbelegte Risiken (z. B. Kühllastspitzen) als offen kennzeichnen |
| Maßnahmen & Handlungsempfehlungen | Bestehende Hitzeschutz- und Wassermaßnahmen mit Status und belegter Wirkung; Datenlücken benennen statt schließen |
| Abhängigkeiten & Interdependenzen | Kopplung Gesundheit – Wasser – Energie – Ernährung – Transport im konkreten Fall |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** DWD · RKI · UFZ · BGR · Bundesanstalt für Gewässerkunde · Wasserbehörden und -versorger der Länder

**Offene Punkte:** Entspannungsindikatoren für Teilprofil 5b (Wiederauffüllung) fachlich abstimmen.

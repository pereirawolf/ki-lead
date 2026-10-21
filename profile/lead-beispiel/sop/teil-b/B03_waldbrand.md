<a id="b03"></a>

## B03. SOP LEAD: Waldbrand

```yaml
kennung: "B03"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Waldbrand (Wald-, Vegetations-, Moor- und einschlägige Flächenbrände)"
art_vorschlag: ["Waldbrand"]
zweck: "Reproduzierbare Erfassung und Bewertung von Wald- und Vegetationsbränden mit überörtlichem Kräftebedarf oder Gefährdung von Siedlungen und Infrastruktur."
version: "2.1.0"
status: "Beispielfassung"
stand: "21.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "01.03.2027"
pruefausloeser: "vor jeder Waldbrandsaison; Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "03"
bisherige_ids: ["sop-03"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Wald-, Vegetations-, Moor- und einschlägige Flächenbrände (z. B. Heide-, Feld- oder Böschungsbrände) mit überörtlichem Kräftebedarf, Evakuierungen, Rauchbelastung oder Gefährdung von Infrastruktur; die Ereignisart des Katalogs bleibt „Waldbrand“. Erhöhte Brandgefahr ist Frühwarnkontext. Trockenheit ohne Brand: B05. Beispiel dafür: Großbrand auf munitionsbelasteter Fläche mit Luftunterstützung. Beispiel dagegen: örtlich rasch gelöschter Flächenbrand; Gebäudebrand ist kein Waldbrand.

**Vertiefung nach Wirkung:** Evakuierung, Schutzunterbringung und Betreuung C16; eigenständige medizinisch-pflegerische Versorgungsfolge C09; kritische Verkehrsfunktion C13; kritische Kraftstoff- oder Ersatzversorgung C12. Munitionsbelastung der Fläche bleibt Teil der Brandlage; C06 nur bei eigenständigem, fachbehördlich benanntem Fund- oder Räumungsvorgang. Ein Baustein fügt keine Ereignisart hinzu (A.1 Nr. 2).

**Befassungsanlässe:** hoher Waldbrand- bzw. Graslandfeuerindex des DWD · Lagemeldung eines Landes · Anforderung von Luftunterstützung · Monitoring: Satellitendetektion (EFFIS) und VOST-Auswertung.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Wie hoch ist die meteorologische Brandgefahr? | [DWD Waldbrandgefahrenindex](https://www.dwd.de/DE/leistungen/waldbrandgef/waldbrandgef.html) und [Graslandfeuerindex](https://www.wettergefahren.de/warnungen/indizes.html); täglich | R | Indizes nach Vegetationstyp, Ausgabe und Gültigkeit als Gefahrenpotenzial erfassen – kein Brandnachweis und nicht unmittelbar D8. Betretungs- oder Zutrittsverbote nur aus tatsächlich geltenden Anordnungen ableiten. |
| R2 | Wo brennt es, wie entwickelt sich die Fläche? | Landesforstbehörde und Gefahrenabwehrbehörde; Lagemeldungen (A.3); EFFIS (Copernicus) | L; D1/D8 | Hotspot (Detektion), interpretierte Brandfläche und behördlich bestätigte Fläche mit Produktstand, Auflösung und Unsicherheit trennen; aktive, verbrannte und geschätzte Fläche trennen. |
| R3 | Welche Menschen sind durch Feuer, Rauch oder Evakuierung betroffen? | Lagemeldungen (A.3); Luftqualitätsmessungen der Länder/UBA | R; D2 | Rauch ist eigene Betroffenheitsdimension; Messwerte mit Station und Zeit; eine Rauchfahne liefert keine Personenzahl. |
| R4 | Gibt es Sonderlagen (Munition, Moor)? | Kampfmittelräumdienst, Landesforst | R; D5 | Munitionsbelastung erzwingt Abstand; Nachlösch- und Schwelphasen können die Bekämpfung verlängern – keine pauschale Dauer. |
| R5 | Welche Kräfte sind überörtlich/international eingesetzt, welche Luftunterstützung ist tatsächlich verfügbar? | Lagemeldungen (A.3); GMLZ, Bundeswehr/Bundespolizei (Luft), EU-Katastrophenschutzverfahren (rescEU) | M; D4 | Ausländische Luftfahrzeuge im Einsatz = international; nur tatsächlich eingesetzte Kräfte zählen; angefragt ≠ verfügbar ≠ eingesetzt. |
| R6 | Einordnung im Mehrjahresvergleich? | [Waldbrandatlas BKG](https://gdz.bkg.bund.de/index.php/default/waldbrandatlas.html) | L | Historische Häufung ist Einordnung, keine Prognose. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D4:** Waldbrände ziehen früh überörtliche und teils internationale Kräfte; D4 steigt oft vor D2 – nicht voneinander ableiten.
- **D5:** „Unter Kontrolle“, „gelöscht“, Glutnestbeseitigung und Rückkehr Evakuierter sind verschiedene Zielzustände. Nachlösch- und Schwelphasen sowie Munitionsbelastung können die Prognose beeinflussen, rechtfertigen aber keine pauschale D5-Dauer.
- **D8:** Aus beobachteter Ausbreitung oder anderen tatsächlichen Lageänderungen begründen (z. B. Windwechsel, Brandsprünge); Gefahrenindex und Tagesprognose allein sind keine Dynamik.

**Beurteilung/Tendenz:** Fläche trägt die Beurteilung nicht allein: ein kleiner Brand am Siedlungsrand kann erheblich, ein großer in unbesiedeltem Gebiet geringfügig sein. Abnehmende Flammen bei fortdauernder Rauch- oder Glutproblematik sind nur Teil-Entspannung.

**Offenlassen:** D2 ohne belastbaren Personenkreis; D5 ohne fachliche Nachsorgeprognose.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Brandort, bestätigte Fläche mit Zeitstempel und Produktstand, Ausbreitungsrichtung |
| Risiken & Auswirkungen | Gefährdung von Siedlungsrändern und Infrastruktur, Rauchbelastung, Munitionslage; Boden- und Wasserrückhaltsfolgen als spätere Folgen getrennt |
| Maßnahmen & Handlungsempfehlungen | Eingesetzte und angeforderte Boden- und Luftunterstützung mit Status; geltende Anordnungen (Sperrungen, Betretungsverbote) |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Verkehr (Sperrungen), Strom (Leitungen), Löschwasserentnahme |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Landesforstbehörden · Gefahrenabwehrbehörden der Länder · DWD · GMLZ

**Offene Punkte:** Umbenennung der Katalogart in „Wald- und Vegetationsbrand“ bei der nächsten abgestimmten Schemaänderung prüfen (A.10.4); bis dahin gilt der erweiterte Geltungsbereich unter „Waldbrand“.

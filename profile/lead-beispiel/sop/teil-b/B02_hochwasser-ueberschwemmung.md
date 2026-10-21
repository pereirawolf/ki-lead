<a id="b02"></a>

## B02. SOP LEAD: Hochwasser / Überschwemmung

```yaml
kennung: "B02"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Hochwasser / Überschwemmung (Flusshochwasser, pluviale Überflutung/Sturzflut, Sturmflut)"
art_vorschlag: ["Hochwasser / Überschwemmung"]
zweck: "Reproduzierbare Erfassung und Bewertung von Fluss-, Starkregen- und Sturmflutereignissen mit Folgen für Bevölkerung, Einsatzwesen und KRITIS, einschließlich begründeter Vorwarnlagen."
version: "2.1.0"
status: "Beispielfassung"
stand: "21.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "21.10.2026 – fachliche Teilprüfung und einzelquellenbezogener Abgleich; offene Nachprüfungen siehe A.6/Quellenregister"
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

**Datenzugang und Ausweichweg.** Ist das länderübergreifende Portal nicht nutzbar, unmittelbar die zuständige Landeshochwasserzentrale bzw. den zuständigen Küstenwarndienst heranziehen und den Zugriffsweg dokumentieren; die lokalen Dienste sind vor Verwendung organisationsspezifisch festzulegen. PEGELONLINE (WSV) liefert Rohdaten an Bundeswasserstraßen; sie ergänzen, ersetzen aber weder Landeswarnungen noch deren fachliche Einordnung. Pro Messung/Vorhersage Station, Parameter, Einheit, Höhen-/Pegelbezug, Zeitstempel/Zeitzone, Qualitätsstatus und Vorhersagelauf erhalten. Zeitbezug und Zeitzone je Produkt aus dessen Beschreibung übernehmen, nicht pauschal annehmen. Eine Wartungsseite oder ein leerer Kartenabruf ist kein Hochwasser-Nullbefund.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Pegel, Vorhersagen und Einzugsgebiete sind maßgeblich? | [Länderübergreifendes Hochwasserportal](https://hochwasserzentralen.de/), Landeshochwasserzentralen, PEGELONLINE (WSV); pegel- und produktabhängig | L; D1/D8 | Pegel nur mit Station, Zeit und Bezugssystem; Meldestufen immer mit Land, Pegel und Bedeutung angeben. Pegelstände, Abfluss und Wiederkehrintervalle sind ohne Bezugsbedingungen nicht bundesweit vergleichbar. |
| R2 | Besteht eine Sturmflutlage? | BSH, Wasserstandsvorhersage und Sturmflutwarndienst | L/R | Nordsee: Tide, Scheitelzeit und Abweichung vom angegebenen Bezugswasserstand getrennt angeben. Ostsee: zeitlichen Wasserstands-/Windstauverlauf und fachlich erwartetes Maximum übernehmen, keinen Tidezeitpunkt voraussetzen. NHN, Pegelnull und mittleres Hochwasser nicht vermischen; Warnung und Vorhersage mit Ausgabe und Gültigkeit dokumentieren. |
| R3 | Welche Überflutungsflächen und Evakuierungen sind bestätigt? | Lagemeldungen (A.3); ggf. Copernicus EMS Rapid Mapping | L/R; D1/D2 | Warn-, Evakuierungs- und überflutete Fläche trennen; Evakuierte ≠ Betroffene. Bei Einrichtungen Selbstrettungsfähigkeit, Transport, Aufnahmeort und Betreuung prüfen (A.9.2, C16). |
| R4 | Wie ist der Zustand von Deichen, Talsperren und Rückhaltebecken? | Länder-Hochwasserberichte, Deichverbände, Talsperrenbetreiber und -aufsicht | R; D8 | Zustand nur nach zuständiger Fachbewertung darstellen. Deichverteidigung und vorsorglicher Kräfteeinsatz belegen allein keine Verschärfung. Durchnässung und Dauer der Einstaubelastung sind fachbehördlich zu bewertende Indikatoren der Deichsicherheit (`Neubewertung bei:`). |
| R5 | Welche Anlagen und Versorgungsfunktionen sind betroffen (Strom, Wassergewinnung, Kläranlagen, Kanalnetz)? | Betreibermeldungen (A.3) | R/I; D6 | Lage im Gefahrengebiet oder angekündigte Abschaltung belegt noch keinen Dienstleistungsausfall. Eine tatsächlich vollzogene Abschaltung kann ihn belegen: prüfen, welche Funktion seit wann in welchem Umfang fehlt und ob wirksame Ersatzversorgung sie aufrechterhält. Technischen Anlagenzustand, Dienstleistungsfolge und Vorsorgestatus getrennt darstellen; Abwasserfolgen mit C15 vertiefen. |
| R6 | Treten wassergefährdende Stoffe aus (z. B. Heizöl)? | Umwelt- und Wasserbehörden; Lagemeldungen (A.3) | R/I; D6 | Kontamination nur nach Fachbewertung; zusätzlich B07 prüfen. |
| R7 | Welche Hilfe ist eingesetzt, welche Rückkehrbedingungen gelten? | Lagemeldungen (A.3); THW, Bundeswehr (Amtshilfe) | M; D4/D5 | Anforderung, Zusage und Einsatz sind verschiedene Zustände; sinkender Pegel bedeutet nicht Nutzbarkeit. |

### 3. Auswertung: Prüfpunkte

**Überlagerung und Nachlauf.** Bei Flusshochwasser, Starkregen/Sturzflut und Küstenhochwasser jeweils eigene Vorlaufzeiten und Wirkungsnachweise prüfen. Bemessungs-/Gefahrenkarten sind Szenarien, keine aktuelle Überflutungskarte. Grundwasseranstieg, Rückstau und lokale Entwässerungsprobleme können andere Räume und Zeitverläufe haben als der Flusspegel. Bei gemeinsamem Regen-/Rückstau-/Küstenereignis Personen und Schäden wirkungsbezogen abgleichen. Sinkendes Wasser beendet weder die Belastung von Schutzanlagen noch automatisch Kontamination, Gebäudesperren oder Versorgungsfolgen; Freigabe und Wiederherstellung getrennt nachweisen (C02, B10, C15, C16 nach Wirkung).

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

**Darstellung von Meldestufen mehrerer Länder** (Regel in R1): je Pegel Land, Stufe mit Stufenzahl des Landessystems und Bedeutung, Wert mit Bezug und Zeitstand, Quelle; keine Umrechnung in eine gemeinsame Skala. Muster: „Pegel A (Land X): Meldestufe 3 von 4 nach Landessystem X (Bedeutung laut Landeshochwasserzentrale), Wasserstand … cm über Pegelnull, Stand TT.MM., hh:mm Uhr · Pegel B (Land Y): Alarmstufe 2 von 4 nach Landessystem Y …“. Unterschiedliche Stufen verschiedener Länder sind keine Rangfolge der Lage.

**Offene Punkte:** Landeshochwasserzentralen und Küstenwarndienste als Ausweichwege bei Portalausfall organisationsspezifisch festlegen.

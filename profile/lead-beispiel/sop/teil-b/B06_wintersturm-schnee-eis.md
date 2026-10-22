<a id="b06"></a>

## B06. SOP LEAD: Wintersturm / Schnee / Eis

```yaml
kennung: "B06"
typ: "Dach-SOP"
lesegruppe: "Katalog-Einstiege"
lageart: "Wintersturm / Schnee / Eis (Starkschneefall, Eisregen, Glatteis, Eislast, extreme Kälte)"
art_vorschlag: ["Wintersturm / Schnee / Eis"]
zweck: "Reproduzierbare Erfassung winterlicher Extremwetter- und Kältelagen mit Folgen für Verkehr, Energie- und Wärmeversorgung sowie Erreichbarkeit."
version: "2.1.1"
status: "Beispielfassung"
stand: "22.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "01.10.2027"
pruefausloeser: "vor jeder Wintersaison; Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "06"
bisherige_ids: ["sop-06"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Starkschneefall, Eisregen, Glatteis und winterliche Sturmlagen mit Verkehrszusammenbrüchen, Leitungsausfällen oder Versorgungsengpässen; außerdem länger andauernde extreme Kälte mit Schutz-, Wärme- oder Versorgungsbedarf, auch ohne Sturm oder Schneefall. Stromausfälle zusätzlich mit B08 (Referenzfall Münsterland 2005); Wärme- und Kraftstoffversorgung mit Baustein C12; bei konkreter Gasversorgungsursache zusätzlich B09. Beispiel dafür: Eislast mit Mastbrüchen und gesperrten Autobahnen; mehrtägige Kälte mit ausgefallener Wärmeversorgung. Beispiel dagegen: übliche Winterwitterung ohne konkrete Folgen.

**Vertiefung nach Wirkung:** Bauwerksversagen durch Schnee- oder Eislast C02; kritische Verkehrsfunktion C13; Schutzunterbringung und Betreuung, etwa bei Wärmeausfall oder gestrandeten Reisenden, C16; eigenständige medizinisch-pflegerische Versorgungsfolge C09. Ein Baustein fügt keine Ereignisart hinzu (A.1 Nr. 2).

**Befassungsanlässe:** DWD-Unwetterwarnung Schnee/Glatteis bzw. Warnung vor strengem Frost · großflächige Verkehrs- oder Stromausfälle · Lagemeldung eines Landes · Monitoring: DWD-Warnlage und Lagemeldungen der Länder.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Schneefall-, Eis-, Wind- oder Kältephase ist zu erwarten? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen | L/R | Neuschnee, Schneehöhe und Eislast nicht gleichsetzen; eine erwartete Phase begründet keinen Ist-Wert auf D8. |
| R2 | Welche Orte und Strecken sind abgeschnitten oder gesperrt? | Lagemeldungen (A.3); Autobahn GmbH, DB | L/R; D1/D2 | Sperrung einer Route belegt nicht Isolation. Im Stau oder in Zügen Eingeschlossene zählen für D2, wenn eine unmittelbare Beeinträchtigung belegt ist (z. B. fehlender Kälteschutz oder fehlende Versorgung über Stunden), nicht bei bloßer Verspätung oder erschwerter Weiterreise (Kodierleitfaden D2); Zahl, Bezugszeit und Quelle nennen. |
| R3 | Welche Strom-, Wärme- und Kommunikationsdienste fallen aus? | Betreibermeldungen (A.3) | R/I; D6 | Eislast-Ausfälle ziehen nach; frühe Entwarnung nicht als final werten. |
| R4 | Welche Personen benötigen besondere Versorgung, welche Wärmeschutzorte sind nutzbar? | Lagemeldungen (A.3) | R/M; D2 | Heizungsausfall bei Frost ist gesundheitsrelevant; Einwohnerzahl ≠ Betroffene; Erreichbarkeit häuslich versorgter Menschen, Ersatztransport und tatsächlich nutzbare Wärmeschutzorte prüfen (A.9.2). |
| R5 | Welche Räum-, Transport- und Ersatzversorgungshilfe besteht? | Lagemeldungen (A.3); THW, Bundeswehr | M; D4 | Regulärer Winterdienst ≠ zusätzliche Hilfe; Nachbarschaftshilfe ist keine behördliche Mobilisierung. |
| R6 | Welche Wiederherstellung ist wann absehbar? | Betreibermeldungen (A.3) | M/R; D5 | Tauwetter kann neue Risiken erzeugen (Hochwasser, Dachlast) – bedingt formulieren. |
| R7 | Sind Gebäude, Hallen oder Verkehrswege wegen Schneelast oder Lawinengefahr gesperrt oder geschädigt? | Bauaufsicht und Kommune; in einschlägigen Regionen Lawinenlageberichte und behördliche Sperrungen | R; D1/D2 | Schneehöhe nicht selbst in Gebäudesicherheit umrechnen; Fachbewertung von Last und Standsicherheit verwenden. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D5:** Wiederzugänglichkeit und vollständige Regelversorgung unterscheiden; Tauwetter ist kein Zielzustand.
- **D6:** Kette Wetter → Strom → Wärme/Wasser/Kommunikation/Pflege ist typisch, aber je Glied zu belegen.
- **D8:** Wechsel Schneefall → Tauwetter → Nachtfrost ist ein echter Phasenwechsel; Umschläge einzeln belegen.

**Beurteilung/Tendenz:** Ende des Schneefalls oder der Kälte belegt keine wiederhergestellte Erreichbarkeit oder Wärmeversorgung; ggf. Übergang zu B02 bei Tauwetter.

**Offenlassen:** D2 ohne belegte direkte Versorgungslücke; D5 ohne Wiederherstellungsangabe.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Wetter-, Verkehrs- und Versorgungslage mit Zeitstempel getrennt |
| Risiken & Auswirkungen | Folgerisiken (Tauwetter, Dachlast, Kälte bei Strom- oder Wärmeausfall) als Prognose; Menschen mit besonderen Bedarfen |
| Maßnahmen & Handlungsempfehlungen | Räum-, Versorgungs- und Unterstützungsmaßnahmen mit Status; Wärmeschutzorte |
| Abhängigkeiten & Interdependenzen | Kettenwirkungen Strom – Wärme – Kommunikation – Pflege belegt vs. möglich |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** DWD · Autobahn GmbH/Straßenbauverwaltungen · DB · Energieversorger/Netzbetreiber · Lagezentren der Länder · Bauaufsicht (Schneelast)

**Offene Punkte:** Abgrenzung zwischen saisonüblicher Kälte und Kältelage mit Befassungsbedarf an Rückblickfällen schärfen.

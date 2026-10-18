# SOP-LEAD – Sammelmappe der 17 Ereignisarten (Beispielfassung)

Beispielfassung für KI-LEAD · Fassung 1.0.1 vom 17.10.2026 · abgeleitet aus der Arbeitsfassung SOP-LEAD v0.4 · bezogen auf die LEAD-Meldevorlage 1.0 (Schemakennung `LEAD-Meldung-v1`) und den Kodierleitfaden LEAD in der Beispielfassung

Diese Mappe enthält je Ereignisart des Katalogs eine Standardvorgehensweise (SOP) nach dem LEAD-Schema. Gemeinsame Regeln stehen einmal in Teil A und gelten für jede SOP; die SOPs in Teil B verweisen darauf. Die Rolle „Koordinierungsstelle“ steht beispielhaft für eine Stelle, die Meldungen mehrerer Stellen zu einem übergreifenden Lagebild zusammenführt.

## Inhaltsverzeichnis

- [Teil A – Gemeinsame Regeln](#teil-a)
- Teil B – SOPs je Ereignisart
  1. [Unwetter / Sturm](#sop-01)
  2. [Hochwasser / Überschwemmung](#sop-02)
  3. [Waldbrand](#sop-03)
  4. [Erdbeben](#sop-04)
  5. [Extremhitze / Dürre](#sop-05)
  6. [Wintersturm / Schnee / Eis](#sop-06)
  7. [Industrieunfall / Chemieunfall](#sop-07)
  8. [Stromausfall / Blackout](#sop-08)
  9. [Gasversorgungsengpass](#sop-09)
  10. [Trinkwasserversorgung](#sop-10)
  11. [Gesundheitliche Lage / Epidemie](#sop-11)
  12. [KRITIS-Ausfall](#sop-12)
  13. [Migrationslage](#sop-13)
  14. [Sicherheitslage](#sop-14)
  15. [Cyberangriff / IT-Sicherheitsvorfall](#sop-15)
  16. [Sabotage / Anschlag / Terrorismus](#sop-16)
  17. [Sonstiges](#sop-17)

---

<a id="teil-a"></a>

## Teil A – Gemeinsame Regeln

### A.1 Anwendung

1. **Gegenstand klären:** Konkreten Sachverhalt, Stichtag, deutschen Wirkungs- bzw. Relevanzbezug und Betrachtungshorizont benennen, bevor recherchiert wird. Die Lagebild-Perspektive ist wöchentlich und mittel- bis langfristig; akute Stunden-Lagen bedienen kontinuierliche und tägliche Lageprodukte.
2. **Mehrfachzuordnung:** Ein Ereignis kann mehrere Ereignisarten berühren (Mehrfachauswahl `art`). Dann alle zutreffenden SOPs heranziehen – typisch sind Ursache-SOP plus Folge-SOP (z. B. Wintersturm → Stromausfall). Denselben Sachverhalt nicht doppelt zählen.
3. **Anlass ≠ Relevanz:** Ein Befassungsanlass eröffnet die Prüfung, er entscheidet nicht über Relevanz. Es gibt keine automatischen Aufnahmeschwellen.
4. **Rolle der Koordinierungsstelle:** Die Koordinierungsstelle bewertet und empfiehlt im Rahmen ihrer Koordinationsrolle, ohne Weisungsbefugnis und ohne operative Zuständigkeit. Empfehlungen richten sich an zuständige Stellen; bestehende Maßnahmen und Empfehlungen der Koordinierungsstelle werden getrennt dargestellt.
5. **Sachlichkeit:** Keine Dramatisierung, keine Spekulation über Ursachen, Täter oder Motive, keine Zuschreibungen an Personengruppen. Glaubwürdigkeit entsteht über Verifizierbarkeit.

### A.2 Kodierregeln Lagenradar (verbindlich für alle SOPs)

- **Kodierleitfaden:** Die folgenden Regeln sind verbindlich; Einzelheiten, Stufentexte, Prüfreihenfolge und Abgrenzungsbeispiele enthält der **Kodierleitfaden LEAD v0.4**. Bei Widersprüchen gelten die Stufentexte der Darstellungsdatei vor dem Kodierleitfaden vor Teil A.
- **Alle acht Achsen prüfen.** Die in jeder SOP hervorgehobenen Achsen sind besondere Stolperstellen, keine Beschränkung des Radars.
- **Stufe 0 ist eine inhaltliche Stufe, kein Leerwert.** D2 = 0 bedeutet laut Vorlage **„unter 10 Personen“**, nicht „null Personen“: fünf nachweislich direkt Betroffene gehören zur Stufe 0. Stufe 0 setzt eine belegte Angabe voraus; fehlende Daten ergeben keinen Wert 0. **D2-Nullregel:** 0 nur bei (a) belegter Zahl von 1–9 direkt Betroffenen oder (b) belegtem Nullbefund einer aktiv laufenden, einschlägigen Erhebung mit definierter Grundgesamtheit; sonst offen (Kodierleitfaden Abschnitt 3). Entsprechend bedeuten D1 = 0 „punktuell/kleinflächig“, D3 = 0 „Betreiber“, D4 = 0 „keine externe Hilfe“, D5 = 0 „unter 6 Stunden“, D6 = 0 „keine KRITIS-Bezüge“, D7 = 0 „stabil/hoch verlässlich“, D8 = 0 „stabil“. Maßgeblich sind die Stufentexte der Darstellungsdatei.
- **Offenlassen statt schätzen:** Unbelegte Achsen bleiben leer (`null`). Offen ist Information, keine Lücke.
- **Kein Gesamtscore:** Keine Summe, kein Mittelwert, keine Rangfolge zwischen Sachverhalten. Die Divergenz zwischen Achsen ist der eigentliche Erkenntnisgewinn.
- **Konservativ einstufen:** Bei Unsicherheit die niedrigere, aber belegbar passende Stufe; Modellschätzungen nicht über ihre Untergrenze hinaus kodieren.
- **D3 (Zurechnung):** Die bewertete Funktion benennen (Betreiber, Gefahrenabwehr, Fachaufsicht, Ermittlung). Eine Quelleninstitution ist nicht automatisch das Zurechnungszentrum. **Ohne Akutereignis** ist eine strukturelle Zurechnung zulässig, wenn ein konkreter Gegenstand (Fach-, Regulierungs- oder Vorsorgeaufgabe) und die zuständige Ebene belegt sind; Kennzeichnung im Bewertungstext „D3 strukturell: …“. Sonst offen.
- **D4 (Mobilisierung):** Maßgeblich ist der Herkunftsraum tatsächlich eingesetzter Unterstützung, nicht bereitstehende oder zugesagte Kapazität.
- **D5 (Zielzustand):** Den gemeinten Zielzustand ausdrücklich benennen (z. B. Gefahrenabwehr beendet, Versorgung wiederhergestellt, Freigabe erteilt).
- **D6 (KRITIS):** Nach belegten Kopplungen der konkreten Lage kodieren, nicht nach der Sektorzugehörigkeit oder einer Liste denkbarer Folgen. Die KRITIS-Prüfung ist Pflichtbestandteil jeder Auswertung. Bei einer bewertungsrelevanten Folgekette im Feld „Abhängigkeiten & Interdependenzen“ die entscheidende Verbindung benennen (**Wirkungskette**): Welche beeinträchtigte Funktion wirkt über welche Abhängigkeit, unter welcher Bedingung, auf welchen weiteren Bereich? Überbrückende Puffer (Notstrom, Vorräte, Speicher, Personal, Ausweichweg) und ihre voraussichtliche Reichweite angeben, soweit belegt. Mögliche Folgeschritte als **Szenario** kennzeichnen; sie verändern die Ist-Kodierung nicht.
- **D7 (Informationslage):** Bewertet ausschließlich die Informationslage der Befassung (Verfügbarkeit, Verlässlichkeit und Widerspruchsfreiheit der Lageinformation). Eigene Recherchegrenzen und abweichende Bewertungen derselben Informationen sind kein hoher D7-Wert. Ausfälle der Kommunikation mit der Bevölkerung werden im Text und bei D6 dargestellt (Festlegung im Kodierleitfaden v0.4).
- **D8 (Dynamik):** Beobachtete Änderungen der Lage, nicht Zahl eingehender Meldungen und nicht latente Folgerisiken. D8 nicht mit der Tendenz verwechseln.

### A.3 Befundnachweis

Für jeden übernommenen Befund: Beobachtung und fachliche Einordnung getrennt · konkrete Fundstelle mit Titel · Bezugszeitpunkt und Abrufzeitpunkt · räumlicher Bezug · Unsicherheit. Prognosen mit Gültigkeitsfenster kennzeichnen. Widersprüche nach Zeitstand und Definition prüfen; ungelöste Differenzen sichtbar lassen. Fehlender Zugriff ist kein Nullbefund. Portale sind Rechercheeinstiege und ersetzen keinen Aussagebeleg. Mehrere Übernahmen derselben Meldung sind keine unabhängige Bestätigung.

**Quellen & Referenzen.** Alle Belege einer Meldung stehen zentral im Feld „Quellen & Referenzen“ (`quellen`), nicht in „Lage & Ereignis“. Je Quelle ein Eintrag, nummeriert in der Reihenfolge der ersten Nennung, mit genau einer Kategorie:

| Kategorie | Bedeutung |
|---|---|
| **A** | amtlich/zwischenstaatlich (Behörden, internationale Organisationen; auch behördeninterne Lagemeldungen wie Lageberichte des GMLZ oder Ländermeldungen) |
| **W** | wissenschaftlich (Forschungseinrichtungen, Fachpublikationen, Datensätze; Preprints kennzeichnen) |
| **M** | Medien (Redaktionen mit eigener Recherche, Agenturen; bis v0.3: „J“) |
| **P** | privat/wirtschaftlich (Unternehmen, Betreiber, Verbände, NGOs, Hilfsorganisationen als Eigenangabe, soziale Medien) |

Format: `[Q1] A – Herausgeber (TT.MM.JJJJ): Titel. Online abrufbar unter: URL [Zugriff: TT.MM.JJJJ]`, optional „Datenstand: …“, „(Paywall)“ oder „nicht ausgewertet“. Im Text wird mit `[Q1]`, `[Q2, Q4]` oder `[Q1–Q3]` verwiesen. Rangfolge bei Widersprüchen: A vor W vor M vor P, außer die niedriger eingestufte Quelle ist für die konkrete Aussage fachlich kompetenter (dann beide nennen und begründen). Einzelheiten: Kodierleitfaden Abschnitt 5.

*„Prüfen für“ in den Recherchetabellen ordnet einen Befund einem Feld zu, ohne dessen Einstufung vorzugeben.* Kürzel: L = Lage & Ereignis · R = Risiken & Auswirkungen · M = Maßnahmen & Handlungsempfehlungen · I = Abhängigkeiten & Interdependenzen.

### A.4 Übertrag in die Meldung (JSON)

- Analysefelder: `analyse.lage_ereignis`, `analyse.risiken_auswirkungen`, `analyse.massnahmen_empfehlungen`, `analyse.abhaengigkeiten_interdependenzen`. Belege nur als Verweis `[Qn]`.
- Quellen: `quellen` auf Meldungsebene, gemeinsam für alle Ereignisse/Sachverhalte der Meldung (A.3).
- `sofort.bewertung_text` beginnt mit der **Kernaussage**: Was bedeutet der Sachverhalt für den Bevölkerungsschutz, was verändert sich, und welche Prüf- oder Abstimmungsfrage ergibt sich daraus für zuständige Stellen? Danach erläutert er Beurteilung, Tendenz (mit Bezugsraum und Zeitraum), wesentliche Achsendivergenzen, offene Achsen und Indikatoren für eine Neubewertung. Belegverweise stehen in den Analysetexten.
- `analyse.massnahmen_empfehlungen` benennt, wer (Land, Bundesressort, Fachaufsicht, Nachbarland, Betreiberaufsicht) auf Grundlage der Meldung was prüfen oder entscheiden sollte. Keine Meldung eigener Einsatzmaßnahmen.
- `sofort.beurteilung` (`geringfügig` / `erheblich` / `kritisch`) und `sofort.tendenz` (`Entspannung` / `Stabilisierung` / `Verschärfung`) unabhängig vom höchsten Radarwert begründen. „Keine Angabe“ = leerer String `""`.
- Offene Radarwerte = `null` (nicht `0`, nicht Zeichenkette, kein „U“). Keine neuen JSON-Felder ohne Schemaänderung.
- Schema: Schemakennung `LEAD-Meldung-v1`; Struktur und Werte werden technisch gegen `meldung.schema.json` geprüft (beim Prüfen, beim Import und in der Lagebild-Zusammenfassung).
- Entstehung: KI-gestützte Entwürfe tragen das optionale Feld `_entstehung` (Verfahren „KI-Entwurf“, Arbeitsanweisung, Modell, angewandte SOPs, Kodierleitfaden, Erstellungszeitpunkt). Es bleibt bei der weiteren Bearbeitung erhalten.
- `art` nur aus dem Katalog des Schemas wählen; `eintritt`, `ort`, `bezeichnung` fallbezogen füllen.

**Kennsätze.** Für wiederkehrende Angaben gelten feste Satzanfänge am Ende von `sofort.bewertung_text`, jeweils in eigener Zeile. Sie sind keine Pflichtangaben und keine neuen Felder; sie werden nur gesetzt, wenn der Inhalt vorliegt. Die Lagebild-Zusammenfassung wertet sie im Redaktionscheck aus.

| Kennsatz | Wann | Beispiel |
|---|---|---|
| `Neubewertung bei:` | Indikatoren, die die Bewertung ändern würden | „Neubewertung bei: Pegel Dresden über 6 m; erste Ausfälle der Trinkwasserversorgung“ |
| `Handlungsrelevant bis:` | nur bei zeitgebundenem Prüf-, Abstimmungs- oder Vorbereitungsbedarf (A.5) | „Handlungsrelevant bis: 09.10.2026 12:00 (Beginn Sturmflutscheitel); Grundlage: BSH-Vorhersage“ |
| `Änderung zur Vormeldung:` | bei Fortschreibung desselben Sachverhalts (A.8.1) | „Änderung zur Vormeldung: Notstromreserve Klinikum von 72 h auf 24 h gesunken“ |
| `Abweichende Bewertung:` | eine andere Stelle bewertet denselben Sachverhalt erkennbar anders (A.7.2) | „Abweichende Bewertung: Land X ‚kritisch‘ (landesweiter Bezugsraum) – hier ‚erheblich‘ (bundesweiter Bezugsraum)“ |
| `Abschluss im Lagebild:` | letzte Nennung eines Sachverhalts (A.8.2) | „Abschluss im Lagebild: Ereignis beendet seit 05.10.2026; offen bleiben: Trinkwasserfreigabe in zwei Ortsteilen; Nachsorge bei: Gesundheitsamt Y“ |

Datumsangaben im Kennsatz `Handlungsrelevant bis:` als TT.MM.JJJJ (optional mit Uhrzeit), damit der Redaktionscheck sie erkennt.

### A.5 Abschlusscheck (für jede Meldung)

Fakten und Hypothesen getrennt · Aussage und Beleg passen zusammen · jeder Verweis `[Qn]` im Quellenverzeichnis, jede Quelle mit Kategorie und Zugriffsdatum · Schemaprüfung ohne Befund · Zeitbezüge sichtbar · Beobachtung, Bewertung und Prognose unterscheidbar · jede Radarstufe einzeln tragfähig, offene Achsen begründet · kein Gesamtscore · Beurteilung und Tendenz eigenständig begründet · Empfehlungen an zuständige Stellen adressiert.

Zusätzlich drei Prüffragen:

1. **Kernaussage:** Erkennt ein Empfänger aus dem ersten Satz des Bewertungstexts, warum er sich jetzt damit befassen sollte, ohne die Ereignisbeschreibung lesen zu müssen?
2. **Zeitfenster:** Liegt ein zeitgebundener Prüf-, Abstimmungs- oder Vorbereitungsbedarf vor? Wenn ja: Bis wann wird welche Information benötigt, und worauf stützt sich dieses Zeitfenster? Ergebnis als Kennsatz `Handlungsrelevant bis:` (A.4). Liegt der Zeitpunkt vor der nächsten Lagebild-Ausgabe, gilt A.7.3. D5 bleibt Zeit bis Zielzustand und wird nicht als Dringlichkeitsskala genutzt.
3. **Wirkungskette:** Ist bei einer bewertungsrelevanten Folgekette die entscheidende Verbindung benannt – einschließlich des Puffers, der die Folgewirkung derzeit aufhält, und wann er voraussichtlich erschöpft ist (A.2, D6)?

### A.6 Quellenstatus

Die Rechercheeinstiege wurden am 26.09.2026 in einem Überarbeitungslauf teilweise über Primärquellen geprüft (u. a. DWD, Länderübergreifendes Hochwasserportal, BGR, UFZ, RKI, WHO, ECDC, BNetzA, SMARD, UBA, BAMF, BSI, BKA). Das ist keine Vollprüfung und keine Aussage über den aktuellen Zustand eines Ereignisses. Einige Portale zeigen Live-Daten nur dynamisch; einzelne Seiten waren beim Direktabruf gesperrt. Institutionen ohne Link sind vor Erstverwendung zu prüfen. Örtliche Behörden- und Betreiberquellen lassen sich erst mit bekanntem Ort bestimmen („fallbezogen ergänzen“). Die Zwei-Seiten-Grenze je SOP ist nicht durch einen Drucksatz nachgewiesen.

### A.7 Redaktion des Lagebilds (Zusammenführung der Meldungen)

Gilt für die Redaktion der Koordinierungsstelle beim Erstellen des Lagebilds aus Länder-, Bundes- und Eigenmeldungen. Die Lagebild-Zusammenfassung (Ansicht „Redaktionscheck“) unterstützt die Schritte 1–3 und zeigt in Abschnitt 5 Schemaabweichungen, Altformate und Quellenhinweise je Meldung; sie ersetzt nicht die fachliche Prüfung.

**A.7.1 Zusammenhang prüfen.** Vor der Übernahme prüfen: Beschreiben mehrere Meldungen denselben Sachverhalt, eine gemeinsame Abhängigkeit oder eine vergleichbare Entwicklung? Falls ja, den Zusammenhang einmal knapp darstellen und die jeweiligen Quellen, meldenden Stellen und Bezugsräume erhalten. Einen Trend nur aus vergleichbaren Beobachtungen ableiten; die Zahl eingegangener Meldungen allein belegt keine Verschärfung (vgl. D8 in A.2). Denselben Sachverhalt nicht doppelt zählen (A.1 Nr. 2).

**A.7.2 Abweichende Bewertungen.** Bewerten Länder, Bund oder Koordinierungsstelle denselben Sachverhalt unterschiedlich, zuerst Bezugsraum, Zeitpunkt, Zielzustand und Datengrundlage vergleichen. Bleibt die Differenz bestehen, stehen die Bewertungen im Lagebild nebeneinander, jeweils mit Urheber und tragendem Grund; sie werden nicht gemittelt oder angeglichen. Eine eigene Einschätzung der Koordinierungsstelle ist gesondert gekennzeichnet. Benennen, welche fehlende Information die Differenz klären könnte. Unterschiedliche Bewertungen allein begründen keine höhere D7-Stufe – eine andere Schlussfolgerung aus denselben Informationen ist keine Informationslücke. Textbaustein:

> Abweichende Bewertung: [Stelle A] „[Stufe]“ – [tragender Grund]; [Stelle B] „[Stufe]“ – [tragender Grund]. Ursache: [Bezugsraum / Datenstand / Zielzustand / Maßstab]. Klärend wäre: [Information].

**A.7.3 Zeitkritische Weitergabe.** Trägt ein Sachverhalt den Kennsatz `Handlungsrelevant bis:` mit einem Zeitpunkt vor der nächsten Lagebild-Ausgabe, prüft die Redaktion, ob die Information über einen bestehenden zuständigen Informationsweg früher weiterzugeben ist (z. B. an das Gemeinsame Melde- und Lagezentrum von Bund und Ländern (GMLZ) oder an die betroffenen Lagezentren). Das Lagebild dokumentiert den Sachverhalt nachlaufend und vermerkt die Weitergabe. Die Koordinierungsstelle wird dadurch nicht zur Meldestelle mit eigener Einsatzzuständigkeit (A.1 Nr. 4).

### A.8 Fortschreibung, Nachlauf und Rückblick

**A.8.1 Fortschreibung.** Wird ein Sachverhalt in einer Folgeausgabe fortgeschrieben, nennt der Bewertungstext die wesentliche Änderung zur letzten Bewertung (Kennsatz `Änderung zur Vormeldung:`). Fehlende neue Erkenntnisse sind kein Beleg für Stabilisierung. Die bereits benannten Indikatoren (`Neubewertung bei:`) werden je Indikator mit „verändert“, „unverändert“ oder „nicht überprüfbar“ fortgeschrieben; der nächste Prüfpunkt wird in der Wiedervorlage der Redaktion festgehalten (Indikator, Quelle, Bearbeitung, Prüftermin oder Prüfanlass).

**A.8.2 Nachlauf und Abschluss.** Ereignis beendet heißt nicht Lage erledigt. Vor dem Herausnehmen eines Sachverhalts aus der laufenden Lagebild-Befassung prüfen: Ist der in D5 benannte Zielzustand erreicht? Bestehen noch bevölkerungsschutzrelevante Folgewirkungen, Notbetrieb oder Einschränkungen? Verbleibt ein Beobachtungsbedarf? Fehlende Folgemeldungen gelten nicht als Nachweis der Wiederherstellung. Die letzte Nennung trägt den sichtbaren Kennsatz `Abschluss im Lagebild:` mit Ende des Ereignisses, offen bleibenden Punkten (oder „nichts“) und der Stelle, bei der die Nachsorge liegt. Eine abgeklungene Lage wird nicht ohne Anlass weitergeführt; solange Folgewirkungen bestehen, genügt je Ausgabe ein Satz zum Stand des Wiederanlaufs.

**A.8.3 Rückblick.** Nach dem Abschluss eines als erheblich oder kritisch beurteilten Sachverhalts beantwortet die bearbeitende Person drei Fragen (höchstens 15 Minuten):

1. Wann lag die entscheidende Information erstmals vor, und wann stand sie im Lagebild?
2. Welche Folgewirkung oder abweichende Bewertung hat überrascht?
3. Welche Zeile der SOP oder welcher Ausfüllhinweis ändert sich deshalb?

Die Antworten gehen in Abschnitt 5 der betroffenen SOP („Inhaltlich offene Punkte“).

---

<a id="sop-01"></a>

## 01. SOP LEAD: Unwetter / Sturm

```yaml
lageart: "Unwetter / Sturm (Sturm, Orkan, Gewitter, Starkregen, Hagel, Tornado)"
art_vorschlag: ["Unwetter / Sturm"]
zweck: "Reproduzierbare Erfassung und Bewertung meteorologischer Unwetterlagen mit Schadens-, Versorgungs- und Betroffenenbezug für den deutschen Bevölkerungsschutz."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Sturm/Orkan, Gewitter, Starkregen, Hagel und Tornados einschließlich ihrer Folgen (Baum-, Leitungs-, Verkehrsschäden). Überflutungen durch Starkregen zusätzlich mit SOP 02, winterliche Lagen mit SOP 06. Beispiel dafür: Orkan mit flächigen Baumwürfen, Bahnsperrungen und regionalen Stromausfällen. Beispiel dagegen: Unwetterwarnung ohne gemeldete Schäden oder ein örtliches Ereignis ohne überörtliche Folgen.

**Befassungsanlässe:** DWD-Unwetterwarnung · bestätigte Schadenshäufung oder Außergewöhnliche Einsatzlage · länderübergreifende Folgen in Verkehr/Energie · Anfrage eines Landes · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welches Phänomen trifft welchen Raum und Zeitraum? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen | L; D1/D8 | Warngebiet ist kein bestätigtes Schadensgebiet. |
| R2 | Welche Schäden, Sperrungen und Verletzten sind bestätigt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | L/R; D1/D2 | Einsatzstellen ≠ Betroffene; Meldungen desselben Schadens nicht addieren; Länder melden in unterschiedlichem Rhythmus. |
| R3 | Welche Strom-, Verkehrs- und Telekommunikationsdienste sind beeinträchtigt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; DB-, Autobahn-, Flughafenmeldungen | R/I; D6 | Vorsorgliche Sperrung ≠ Schaden; frühe „keine größeren Störungen“ nicht als final werten. |
| R4 | Welche Warnungen und Schutzmaßnahmen gelten? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | M | Teilentwarnung ist keine Gesamtentwarnung. |
| R5 | Welche Hilfe ist tatsächlich angefordert oder eingesetzt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | M; D4 | Bereitschaft, Anforderung und Einsatz trennen. |
| R6 | Was ist über Folgewetter und Wiederherstellung bekannt? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen; Betreiberangaben | R/M; D5/D8 | Aufräum- und Reparaturdauer beim Betreiber belegen, nicht aus Wetterende ableiten. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Warnraum und belegter Wirkungsraum unterscheiden; nach Schadens- bzw. Einsatzraum kodieren.
- **D5:** Wetterende ist kein Zielzustand; Aufräumen und Wiederherstellung dauern oft Tage – Zielzustand benennen.
- **D8:** Nachlassender Wind bei fortbestehenden Ausfällen ist keine Stabilisierung der Gesamtlage; prüfen, was sich stabilisiert.

**Beurteilung/Tendenz:** Die DWD-Warnstufe ist keine Beurteilung. Abklingender Wind bedeutet bei fortdauernden Versorgungsstörungen noch keine Entspannung aller Folgen.

**Offenlassen:** D2 ohne belastbare Personenzahl; D5 ohne benannten Zielzustand und Wiederherstellungsprognose.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Wetterphase, belegte Schäden und Schwerpunkträume mit Zeitstand |
| Risiken & Auswirkungen | Folgegefahren für Versorgung, Zugänglichkeit und vulnerable Gruppen (Kliniken, Pflege) – belegt vs. Prognose |
| Maßnahmen & Handlungsempfehlungen | Geltende Warn-/Sperrmaßnahmen, länderübergreifende Hilfe, offene Informationsbedarfe |
| Abhängigkeiten & Interdependenzen | Wechselwirkung Verkehr – Strom – Kommunikation; belegte von möglichen Kopplungen trennen |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** DWD (Wetterprognose) · Lagezentren der Länder · Betreiber (Wiederherstellungsstatus) · GMLZ

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Abgrenzungsregel zu SOP 02 bei Sturzfluten konkretisieren

---

<a id="sop-02"></a>

## 02. SOP LEAD: Hochwasser / Überschwemmung

```yaml
lageart: "Hochwasser / Überschwemmung (Flusshochwasser, Sturzflut, Sturmflut)"
art_vorschlag: ["Hochwasser / Überschwemmung"]
zweck: "Reproduzierbare Erfassung und Bewertung von Fluss-, Starkregen- und Sturmflutereignissen mit Folgen für Bevölkerung, Einsatzwesen und KRITIS."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Flusshochwasser, Sturzfluten nach Starkregen und Sturmfluten mit belegter oder konkret prognostizierter Überflutung. Niedrigwasser gehört zu SOP 05. Beispiel dafür: Pegel über Meldestufe an mehreren Flüssen mit Evakuierungen. Beispiel dagegen: Pegelanstieg ohne Ausuferung.

**Befassungsanlässe:** Warnung der Landeshochwasserzentralen · BSH-Sturmflutwarnung · DWD-Warnung Dauer-/Starkregen · Lagemeldung eines Landes · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Pegel, Vorhersagen und Einzugsgebiete sind maßgeblich? | [Länderübergreifendes Hochwasserportal](https://hochwasserzentralen.de/), Landeshochwasserzentralen, PEGELONLINE (WSV); pegel- und produktabhängig | L; D1/D8 | Pegel nur mit Station, Zeit und Bezugssystem; Meldestufen sind landesspezifisch und nicht direkt vergleichbar. |
| R2 | Besteht eine Sturmflutlage? | BSH, Wasserstandsvorhersage und Sturmflutwarndienst | L/R | Tidebedingte Scheitelzeiten genau angeben. |
| R3 | Welche Überflutungsflächen und Evakuierungen sind bestätigt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; ggf. Copernicus EMS Rapid Mapping | L/R; D1/D2 | Warn-, Evakuierungs- und überflutete Fläche trennen; Evakuierte ≠ Betroffene. |
| R4 | Wie ist der Zustand der Deiche und Schutzanlagen? | Länder-Hochwasserberichte, Deichverbände | R; D8 | Deichverteidigung ist Kräfteeinsatz, kein Versagen – aber Verschärfungsindikator; Durchnässung senkt Deichsicherheit. |
| R5 | Welche Anlagen und Versorgungsfunktionen sind betroffen? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/I; D6 | Lage im Gefahrengebiet oder vorsorgliche Abschaltung belegt keinen Ausfall. |
| R6 | Welche Hilfe ist eingesetzt, welche Rückkehrbedingungen gelten? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; THW, Bundeswehr (Amtshilfe) | M; D4/D5 | Anforderung, Zusage und Einsatz sind verschiedene Zustände; sinkender Pegel bedeutet nicht Nutzbarkeit. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Nach tatsächlichem Überflutungs- und Einsatzraum kodieren, nicht nach Flusslänge mit Warnung oder Zahl berührter Länder.
- **D3:** Deich- und Gefahrenabwehrpflichten liegen bei Ländern/Kommunen; Bundesstellen (BfG, WSV) sind überwiegend fachlich bzw. für Bundeswasserstraßen zuständig.
- **D5:** Pegelrückgang, sichere Rückkehr und Wiederaufbau sind verschiedene Zielzustände – gemeinten benennen.

**Beurteilung/Tendenz:** Scheitel ist nicht Ende der Lage: unterliegende Abschnitte, Deichschäden, Trinkwasser- und Schadstofffolgen können nachwirken. Tendenz je Flussabschnitt prüfen, wenn gegenläufig.

**Offenlassen:** D2 bei bloßen Flächenangaben; D5 bei unklaren Rückkehr- oder Wiederherstellungsbedingungen.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Pegelentwicklung, Scheitelzeit und belegte Überflutungsräume je Gewässer mit Zeitstand |
| Risiken & Auswirkungen | Unterliegende Gebiete, Deichzustand, Folgerisiken (Trinkwasser, Schadstoffe, Strom) als Prognose kennzeichnen |
| Maßnahmen & Handlungsempfehlungen | Länderübergreifende Unterstützung (laufend/angefragt), Rückkehr- und Freigabefragen |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Strom, Trinkwasser, Abwasser, Verkehr und Telekommunikation belegt vs. möglich |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Landeshochwasserzentralen · BSH (Sturmflut) · Wasserstraßen- und Schifffahrtsverwaltung · Katastrophenschutzbehörden der Länder · GMLZ

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Umgang mit landesspezifischen Meldestufen in der Darstellung vereinheitlichen

---

<a id="sop-03"></a>

## 03. SOP LEAD: Waldbrand

```yaml
lageart: "Waldbrand (Wald-, Moor- und Vegetationsbrand)"
art_vorschlag: ["Waldbrand"]
zweck: "Reproduzierbare Erfassung und Bewertung von Wald- und Vegetationsbränden mit überörtlichem Kräftebedarf oder Gefährdung von Siedlungen und Infrastruktur."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "vor Saisonbeginn (März)"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Wald-, Moor- und Flächenbrände mit überörtlichem Kräftebedarf, Evakuierungen, Rauchbelastung oder Gefährdung von Infrastruktur; erhöhte Brandgefahr ist Frühwarnkontext. Trockenheit ohne Brand: SOP 05. Beispiel dafür: Großbrand auf munitionsbelasteter Fläche mit Luftunterstützung. Beispiel dagegen: örtlich rasch gelöschter Flächenbrand; Gebäudebrand ist kein Waldbrand.

**Befassungsanlässe:** hoher DWD-Waldbrandgefahrenindex · Lagemeldung eines Landes · Anforderung von Luftunterstützung · Monitoring (VOST, Satellitendaten). Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Wie hoch ist die Brandgefahr? | [DWD Waldbrandgefahrenindex](https://www.dwd.de/DE/leistungen/waldbrandgef/waldbrandgef.html); täglich | R; D8 | Index ist Tageswert und Gefahr, kein Brandnachweis. |
| R2 | Wo brennt es, wie entwickelt sich die Fläche? | Landesforstbehörde und Gefahrenabwehrbehörde; zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; EFFIS (Copernicus) | L; D1/D8 | Aktive, verbrannte und geschätzte Fläche trennen; Satellitendetektion ist unverifiziert. |
| R3 | Welche Menschen sind durch Feuer, Rauch oder Evakuierung betroffen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Luftqualitätsmeldungen der Länder/UBA | R; D2 | Rauch ist eigene Betroffenheitsdimension; Rauchfahne liefert aber keine Personenzahl. |
| R4 | Gibt es Sonderlagen (Munition, Moor)? | Kampfmittelräumdienst, Landesforst | R; D5 | Munitionsbelastung erzwingt Abstand und verlängert Bekämpfung und Nachlöschen erheblich. |
| R5 | Welche Kräfte sind überörtlich/international eingesetzt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; GMLZ, Bundeswehr/Bundespolizei (Luft), EU-Katastrophenschutzverfahren (rescEU) | M; D4 | Ausländische Luftfahrzeuge = international; nur tatsächlich eingesetzte Kräfte zählen. |
| R6 | Einordnung im Mehrjahresvergleich? | [Waldbrandatlas BKG](https://gdz.bkg.bund.de/index.php/default/waldbrandatlas.html) | L | Historische Häufung ist Einordnung, keine Prognose. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D4:** Waldbrände ziehen früh überörtliche und teils internationale Kräfte; D4 steigt oft vor D2 – nicht voneinander ableiten.
- **D5:** „Unter Kontrolle“, „gelöscht“, Glutnestbeseitigung und Rückkehr Evakuierter sind verschiedene Zielzustände.
- **D8:** Windwechsel und Brandsprünge sind beobachtbare Umschläge; Tagesprognose allein ist keine Dynamik.

**Beurteilung/Tendenz:** Fläche trägt die Beurteilung nicht allein: ein kleiner Brand am Siedlungsrand kann erheblich, ein großer in unbesiedeltem Gebiet geringfügig sein. Abnehmende Flammen bei fortdauernder Rauch- oder Glutproblematik sind nur Teil-Entspannung.

**Offenlassen:** D2 ohne belastbaren Personenkreis; D5 ohne fachliche Nachsorgeprognose.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Brandort, Fläche mit Zeitstempel, Ausbreitungsrichtung |
| Risiken & Auswirkungen | Gefährdung von Siedlungen und Infrastruktur, Rauchbelastung, Munitionslage; Boden- und Wasserrückhaltsfolgen als spätere Folgen getrennt |
| Maßnahmen & Handlungsempfehlungen | Eingesetzte und angeforderte Boden- und Luftunterstützung |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Verkehr (Sperrungen), Strom (Leitungen), Löschwasserentnahme |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Landesforstbehörden · Gefahrenabwehrbehörden der Länder · DWD · GMLZ

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Katalogzuordnung von Vegetationsbränden außerhalb des Waldes klären

---

<a id="sop-04"></a>

## 04. SOP LEAD: Erdbeben

```yaml
lageart: "Erdbeben (Inland sowie Auslandsbeben mit Deutschlandbezug)"
art_vorschlag: ["Erdbeben"]
zweck: "Reproduzierbare Einordnung schadensrelevanter Erdbeben in Deutschland und von Auslandsbeben mit deutschem Hilfe- oder Betroffenheitsbezug."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Beben mit Schadensmeldungen oder deutlicher Wahrnehmung in Deutschland sowie Auslandsbeben, bei denen deutsche Hilfe angefragt ist oder Deutsche betroffen sind. Beispiel dafür: Beben mit Gebäudeschäden in einer Region. Beispiel dagegen: verspürtes Beben ohne Schäden; Auslandsbeben ohne Deutschlandbezug.

**Befassungsanlässe:** Erdbebenmeldung BGR/Landeserdbebendienst · Schadensmeldung eines Landes · internationales Hilfeersuchen · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Lage, Tiefe und Magnitude sind bestätigt? | [BGR Erdbebenüberwachung](https://www.bgr.bund.de/DE/Themen/Erdbeben-Gefaehrdungsanalysen/Seismologie/Seismologie/seismologie_node.html), GFZ GEOFON, Landeserdbebendienste; ereignisbezogen | L | Automatische Erstlösungen werden revidiert – Stand angeben. |
| R2 | Wo bestehen Erschütterungs- und Schadenswirkungen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Bauaufsicht | L/R; D1 | Verspürt ≠ Schaden; Magnitude beschreibt keinen örtlichen Schaden; Erstmeldungen unvollständig. |
| R3 | Welche Menschen sind verletzt, vermisst oder ohne sichere Unterkunft? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R; D2 | Gruppen und Zeitstände trennen; Wahrnehmungsmeldungen sind keine Betroffenheit. |
| R4 | Welche Netze, Gebäude, Verkehrswege und Anlagen sind nutzbar? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/I; D6 | Kontrollbedingte Sperrung von bestätigter Beschädigung trennen. |
| R5 | Welche Nachbebeninformationen liegen vor? | BGR/GFZ-Fachauskunft, EMSC | R; D8 | Nachbebenwahrscheinlichkeit als Fachaussage übernehmen, keine eigene Vorhersage. |
| R6 | Ist deutsche Hilfe bei Auslandsbeben angefragt oder eingesetzt? | GMLZ, Auswärtiges Amt, THW, EU-Katastrophenschutzverfahren | M; D4 | Auslandshilfe betrifft deutsche Kräfte, nicht deutsche Betroffenheit. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Belegte Wirkungsräume in Deutschland unabhängig vom Epizentrum; ohne deutschen Wirkungsnachweis offen.
- **D3:** Schadensfeststellung und Gefahrenabwehr bei Ländern/Kommunen; BGR/GFZ sind fachlich-wissenschaftlich tätig.
- **D5:** Sichere Gebäudenutzung, Notversorgung und Wiederherstellung sind verschiedene Zielzustände.

**Beurteilung/Tendenz:** Magnitude ist keine Beurteilung. Bei Auslandsbeben die Schwere vor Ort nicht auf die deutsche Beurteilung übertragen; abnehmende Nachbeben ersetzen keine Bewertung fortdauernder Schäden.

**Offenlassen:** D1, D2, D5 ohne Schadensnachweis; bei Auslandsbeben alle Achsen ohne deutsches Bezugsobjekt.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Messdaten (mit Revisionsstand) und Schadensbild getrennt |
| Risiken & Auswirkungen | Nachbeben, Standsicherheit, Folgeschäden an Anlagen (Talsperren, Industrie, Leitungen) als Prognose |
| Maßnahmen & Handlungsempfehlungen | Begutachtungen, Sperrungen, Auslandseinsätze |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Wasser, Energie, Industrieanlagen belegt vs. möglich |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** BGR · Landeserdbebendienste · GFZ · Bauaufsicht der Länder · Auswärtiges Amt/GMLZ (Auslandsbeben)

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-05"></a>

## 05. SOP LEAD: Extremhitze / Dürre

```yaml
lageart: "Extremhitze / Dürre (Hitzeperioden; meteorologische, Boden- und hydrologische Trockenheit, Niedrigwasser)"
art_vorschlag: ["Extremhitze / Dürre"]
zweck: "Reproduzierbare Erfassung akuter Hitzeperioden und langsam verlaufender Trockenheit mit Folgen für Gesundheit, Wasserversorgung, Wasserstraßen und Vegetationsbrandgefahr."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "vor Saisonbeginn (30.04.2027)"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Hitzeperioden mit Gesundheitsfolgen sowie mehrmonatige Trockenheit, sinkende Grund- und Oberflächenwasserstände und Niedrigwasser – auch ohne akute Hitzewelle. Einschränkungen der Trinkwasserversorgung zusätzlich mit SOP 10. Beispiel dafür: Hitze mit geschätzter Übersterblichkeit und regionalen Entnahmeverboten; anhaltendes Niedrigwasser mit Transporteinschränkungen. Beispiel dagegen: Rohrbruch ohne Wetterbezug (SOP 10).

**Befassungsanlässe:** DWD-Hitzewarnung · RKI-Wochenbericht Hitzemortalität · Dürremonitor zeigt außergewöhnliche Dürre · Niedrigwasserwarnungen · kommunale Entnahmeverbote. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

**Vertiefung:** Für akute Hitzewellen mit Gesundheits- und Wasserkopplung kann eine vertiefende Themen-SOP ergänzt werden.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Hitzeintensität und -dauer sind prognostiziert? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen (Hitzewarnungen) | L/R; D1/D8 | Warnstufe ist Prognose, keine Mortalitätsaussage. |
| R2 | Welche hitzebedingte Mortalität wird geschätzt? | [RKI Hitzemortalität](https://www.rki.de/DE/Themen/Gesundheit-und-Gesellschaft/Gesundheitliche-Einflussfaktoren-A-Z/H/Hitze/Bericht_Hitzemortalitaet.html); saisonal wöchentlich; Destatis/EuroMOMO zum Vergleich | R; D2 | Schätzung mit Intervall, Bezugswoche und Revisionsstand; Meldeverzug beachten. |
| R3 | Welche Bodentrockenheit ist modelliert? | [UFZ-Dürremonitor](https://www.ufz.de/index.php?de=37937); täglich; [Dürreatlas BKG](https://gdz.bkg.bund.de/index.php/default/duerreatlas.html) zur Einordnung | L | Ober- und Gesamtboden trennen; Bodenfeuchte ist weder Grundwasserstand noch Trinkwassermangel. |
| R4 | Wie entwickeln sich Grundwasser und Pegel? | [BGR-GRUVO](https://gruvo.bgr.de/); [BfG Niedrigwasser/NIWIS](https://www.bafg.de/DE/05_Wissen/01_Infoplattformen/Niedrigwasser/niedrigwasser_node.html) | R/I; D5 | Grundwasser reagiert verzögert; Pegel, Abladetiefe und Transportfolge getrennt bewerten. |
| R5 | Welche Einschränkungen der Wasserbereitstellung bestehen? | Wasserversorger, Wasser-/Gesundheitsbehörden; fallbezogen | R/I; D6 | Entnahmeverbot für Oberflächenwasser ≠ Trinkwassereinschränkung; einzelne Kommunen ≠ Landeslage. |
| R6 | Welche Rettungs-, Pflege- und Versorgungsbelastungen sind belegt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Gesundheitsbehörden | R/M; D2/D4 | Einsatzaufkommen ≠ Personalüberlastung; Personalausfälle nur mit eigener Quelle. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Modellierte Todesfälle sind Schätzungen, keine beobachtete Personenzahl; nicht über die Intervalluntergrenze kodieren, bei unpassender Datengrundlage offen.
- **D5:** Temperaturentlastung, Wiederauffüllung der Wasserressourcen und Regelversorgung sind verschiedene Zielzustände.
- **D6:** Kopplungen zu Wasser, Gesundheit, Schifffahrt, Energie (Kühlung) und Landwirtschaft einzeln belegen; plausible nicht mit belegten Kopplungen verrechnen.

**Beurteilung/Tendenz:** Abkühlung kann die Gesundheitsbelastung senken, während Wasserdefizite fortbestehen; Tendenz mit Bezugsgröße und Horizont begründen. Erneute Verschärfung nur benennen, wenn Prognose oder belegte Saisonalität sie stützt.

**Offenlassen:** D2 bei unzureichender Datenbasis; D5 ohne definierten Zielzustand; D4 meist ohne Beleg für externe Hilfe.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Hitze- und Trockenheitskomponenten (Temperatur, Boden, Grundwasser, Pegel) mit Zeitstand, Kalenderwochenbezug |
| Risiken & Auswirkungen | Gesundheits- und Versorgungseffekte belegt vs. bedingt; unbelegte Risiken (z. B. Kühllastspitzen) als offen kennzeichnen |
| Maßnahmen & Handlungsempfehlungen | Bestehende Hitzeschutz- und Wassermaßnahmen; Datenlücken benennen statt schließen |
| Abhängigkeiten & Interdependenzen | Kopplung Gesundheit – Wasser – Energie – Ernährung – Transport im konkreten Fall |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** DWD · RKI · UFZ · BGR · Bundesanstalt für Gewässerkunde · Wasserbehörden und -versorger der Länder

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Übergaberegel zwischen dieser SOP und der Themen-SOP Hitzewelle festlegen

---

<a id="sop-06"></a>

## 06. SOP LEAD: Wintersturm / Schnee / Eis

```yaml
lageart: "Wintersturm / Schnee / Eis (Starkschneefall, Eisregen, Glatteis, Eislast)"
art_vorschlag: ["Wintersturm / Schnee / Eis"]
zweck: "Reproduzierbare Erfassung winterlicher Extremwetterlagen mit Folgen für Verkehr, Energie- und Wärmeversorgung sowie Erreichbarkeit."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "vor Saisonbeginn (Oktober)"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Starkschneefall, Eisregen, Glatteis und winterliche Sturmlagen mit Verkehrszusammenbrüchen, Leitungsausfällen oder Versorgungsengpässen; Stromausfälle zusätzlich mit SOP 08 (Referenzfall Münsterland 2005). Beispiel dafür: Eislast mit Mastbrüchen und gesperrten Autobahnen. Beispiel dagegen: übliche Winterwitterung ohne konkrete Folgen.

**Befassungsanlässe:** DWD-Unwetterwarnung Schnee/Glatteis · großflächige Verkehrs- oder Stromausfälle · Lagemeldung eines Landes · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Schneefall-, Eis- und Windphase ist zu erwarten? | [DWD](https://www.dwd.de/), Warnungen/Warnlagebericht; laufend; Ausgabe und Gültigkeit prüfen | L/R; D8 | Neuschnee, Schneehöhe und Eislast nicht gleichsetzen. |
| R2 | Welche Orte und Strecken sind abgeschnitten oder gesperrt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Autobahn GmbH, DB | L/R; D1/D2 | Sperrung einer Route belegt nicht Isolation; im Stau Eingeschlossene sind direkt Betroffene – nur mit Quelle zählen. |
| R3 | Welche Strom-, Wärme- und Kommunikationsdienste fallen aus? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/I; D6 | Eislast-Ausfälle ziehen nach; frühe Entwarnung nicht als final werten. |
| R4 | Welche Personen benötigen besondere Versorgung? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R/M; D2 | Heizungsausfall bei Frost ist gesundheitsrelevant; Einwohnerzahl ≠ Betroffene. |
| R5 | Welche Räum-, Transport- und Ersatzversorgungshilfe besteht? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; THW, Bundeswehr | M; D4 | Regulärer Winterdienst ≠ zusätzliche Hilfe; Nachbarschaftshilfe ist keine behördliche Mobilisierung. |
| R6 | Welche Wiederherstellung ist wann absehbar? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | M/R; D5 | Tauwetter kann neue Risiken erzeugen (Hochwasser, Dachlast) – bedingt formulieren. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D5:** Wiederzugänglichkeit und vollständige Regelversorgung unterscheiden; Tauwetter ist kein Zielzustand.
- **D6:** Kette Wetter → Strom → Wärme/Wasser/Kommunikation/Pflege ist typisch, aber je Glied zu belegen.
- **D8:** Wechsel Schneefall → Tauwetter → Nachtfrost ist ein echter Phasenwechsel; Umschläge einzeln belegen.

**Beurteilung/Tendenz:** Ende des Schneefalls belegt keine wiederhergestellte Erreichbarkeit oder Wärmeversorgung; ggf. Übergang zu SOP 02 bei Tauwetter.

**Offenlassen:** D2 ohne belegte direkte Versorgungslücke; D5 ohne Wiederherstellungsangabe.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Wetter-, Verkehrs- und Versorgungslage mit Zeitstempel getrennt |
| Risiken & Auswirkungen | Folgerisiken (Tauwetter, Dachlast, Kälte bei Stromausfall) als Prognose; vulnerable Gruppen |
| Maßnahmen & Handlungsempfehlungen | Räum-, Versorgungs- und Unterstützungsmaßnahmen |
| Abhängigkeiten & Interdependenzen | Kettenwirkungen Strom – Wärme – Kommunikation – Pflege belegt vs. möglich |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** DWD · Autobahn GmbH/Straßenbauverwaltungen · DB · Energieversorger/Netzbetreiber · Lagezentren der Länder

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-07"></a>

## 07. SOP LEAD: Industrieunfall / Chemieunfall

```yaml
lageart: "Industrieunfall / Chemieunfall (Störfall, Gefahrstofffreisetzung, Gefahrguttransport)"
art_vorschlag: ["Industrieunfall / Chemieunfall"]
zweck: "Reproduzierbare Erfassung von Störfällen und Gefahrstofffreisetzungen mit Wirkung über das Betriebsgelände hinaus."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Brände, Explosionen und Freisetzungen in Anlagen oder bei Gefahrguttransporten mit Außenwirkung. Vorsätzliche Taten zusätzlich mit SOP 16, wenn behördlich benannt. Beispiel dafür: Brand in einem Chemiepark mit Warnung „Fenster und Türen schließen“. Beispiel dagegen: Betriebsunfall ohne Freisetzung; unbestätigte Geruchswahrnehmung bleibt Prüfhinweis.

**Befassungsanlässe:** Warnung der Bevölkerungswarnung · Störfallmeldung · Lagemeldung eines Landes · Monitoring (VOST). Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist zu Anlage, Stoff, Menge und Ursache bestätigt? | Zuständige Immissionsschutz-/Störfallbehörde, Betreiber; zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | L; D3 | Frühe Stoff-, Mengen- und Ursachenangaben sind vorläufig. |
| R2 | Welche Gefahr geht vom Stoff aus? | GESTIS-Stoffdatenbank (IFA/DGUV); TUIS (VCI) für Transporte | R | Stoffeigenschaft ≠ gemessene Exposition. |
| R3 | Welche Messungen und Warn-/Sperrräume sind amtlich belegt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Messdienste (ABC-Erkundung), Umweltbehörden | L/R; D1 | Messung, Ausbreitungsmodell, Warnradius und Sperrraum trennen; keine Messung ≠ keine Belastung. |
| R4 | Welche Menschen sind exponiert, verletzt oder evakuiert? | Gesundheitsamt, zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R; D2 | Exponierte, Verletzte und Vorsorgeevakuierte getrennt. |
| R5 | Welche Umwelt- und Versorgungsfolgen bestehen? | Umwelt-/Wasserbehörden, Betreiber; bei Rhein ggf. internationale Warn- und Alarmpläne (IKSR) | R/I; D6 | Sekundärkontamination (Wasser, Boden, Lebensmittel) und Domino-Effekte eigens belegen; grenzüberschreitende Gewässerfolgen getrennt. |
| R6 | Welche Schutz- und Entwarnungshinweise gelten? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | M; D5 | Keine eigene toxikologische Handlungsanweisung; Produktionsfreigabe ≠ sichere Umgebung. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Was ist Mess-, Modell-, Warn- oder Sperrraum? Kodierung nach belegtem Wirkungsraum, Warnung als Maßnahme darstellen.
- **D3:** Betreiber trägt die betriebliche Gefahrenabwehr (Stufe 0 möglich); bei behördlicher Übernahme neu prüfen.
- **D7:** Ist die Informationslage eingeschränkt (widersprüchliche Angaben) oder nur die Stoffanalyse noch offen?

**Beurteilung/Tendenz:** Ende der Freisetzung und Aufhebung der Warnung sind nicht Entspannung aller Folgen; Kontamination kann nachwirken.

**Offenlassen:** D2 ohne abgestimmte Personendaten; D5 solange Stoff- und Freigabefragen keine Dauer erlauben.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Ereignis, Stoff, Messwerte und Warnung mit jeweiligem Zeitstand |
| Risiken & Auswirkungen | Gesundheits- und Umweltfolgen belegt vs. möglich; Folgekontamination eigens |
| Maßnahmen & Handlungsempfehlungen | Geltende Schutzmaßnahmen (Warnung, Evakuierung, Verzehrwarnungen) |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Trinkwasser, Verkehr, benachbarten Anlagen und Gewässern |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Zuständige Gefahrenabwehr-, Umwelt- und Gesundheitsbehörden · Betreiber · TUIS (VCI) · UBA/ZEMA (Einordnung) · [BBK Gefahrstoff-Freisetzung](https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Schutz-suchen/Gefahrstoff-Freisetzung/gefahrstoff-freisetzung_node.html) (Hintergrund)

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-08"></a>

## 08. SOP LEAD: Stromausfall / Blackout

```yaml
lageart: "Stromausfall / Blackout (großflächiger oder langandauernder Netzausfall)"
art_vorschlag: ["Stromausfall / Blackout"]
zweck: "Reproduzierbare Erfassung großflächiger oder langandauernder Stromausfälle und ihrer zeitverzögerten Kaskadeneffekte."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Stromausfälle, die nach Dauer, Fläche oder Folgewirkung über kurze örtliche Störungen hinausgehen, bis zur Systemstörung. Die Ursache wird zusätzlich über die jeweilige SOP geprüft (06, 15, 16). Beispiel dafür: mehrtägiger Ausfall nach Mastbruch (Münsterland 2005). Beispiel dagegen: Störung, die in wenigen Stunden ohne Folgeausfälle behoben ist; Strompreise allein belegen keinen Ausfall.

**Befassungsanlässe:** Störungsmeldung eines Netzbetreibers · Lagemeldung eines Landes/Außergewöhnliche Einsatzlage · BNetzA-Mitteilung · Monitoring (VOST). Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

**Vertiefung:** Empirische Lagenradar-Profile Münsterland 2005, Alsdorf 2018 und Berlin 2026 (Grundlagenbeitrag „Hybride Zwischenlagen“) als Vergleichsfolie nutzen, nicht als Vorgabewerte.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Netzbereiche sind seit wann ohne Versorgung? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen (Übertragungs-/Verteilnetz) | L; D1 | Nachlaufende Informationen verändern D1/D5; Stand angeben. |
| R2 | Wie viele Personen sind direkt betroffen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Netzbetreiber | R; D2 | Anschlüsse/Haushalte ≠ Personen; MW-Angaben ≠ Personen; Umrechnung nur mit offengelegter Basis. |
| R3 | Welche kritischen Dienste sind bereits eingeschränkt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Wasserversorger, TK-Anbieter, Kliniken | R/I; D6 | Folgen setzen zeitverzögert ein (Notstrom-, Wasser-, Akkureserven). |
| R4 | Welche Reserven und Ersatzversorgung tragen wie lange? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; Kliniken, Wasserversorger | R/M; D5 | Nennlaufzeit ist keine gesicherte Reichweite; Notstromfähigkeit ≠ funktionierende Versorgung. |
| R5 | Welche Mobilisierung und Warnung bestehen? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen; GMLZ, THW | M; D4 | Herkunft der eingesetzten Aggregate/Kräfte für D4 maßgeblich. |
| R6 | Welche Netz- und Systemeinordnung ist hilfreich? | [SMARD](https://www.smard.de/); ENTSO-E-Transparenzplattform; BNetzA | L/R | Markt- und Frequenzdaten ersetzen keine Störungs- und Wiederaufbaumeldung. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Personen nur mit Quelle oder offengelegter Umrechnung; sonst offen.
- **D5:** Technische Wiederversorgung ist nicht Folgenbeseitigung (Wasser, Telekommunikation, Verkehr) – Zielzustand benennen.
- **D6:** Mit zunehmender Dauer steigt der Kopplungsgrad (Reserven erschöpft) – zeitlich begründen, jedes Glied belegen.

**Beurteilung/Tendenz:** Dauer und Folgekette tragen die Beurteilung, nicht die Ausfallleistung: ein kurzer flächiger Ausfall ohne Folgen kann geringfügig, ein lokaler mehrtägiger erheblich sein. Teilwiederversorgung bei erschöpften Reserven ist nur begrenzte Entspannung.

**Offenlassen:** D2 ohne Personengrundlage; D5 ohne Betreiberprognose; fehlende Statusmeldungen nicht als Ende des Ausfalls lesen.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Raum, Anschlüsse/Personen, Ursache (belegt/vorläufig), Wiederversorgungsstand mit Zeitachse |
| Risiken & Auswirkungen | Kaskade mit Zeitverzug; vulnerable Gruppen (Heimbeatmung, Pflege) – belegt vs. mit Dauer erwartbar |
| Maßnahmen & Handlungsempfehlungen | Notstromversorgung kritischer Einrichtungen, Anlaufstellen, länderübergreifender Lageabgleich |
| Abhängigkeiten & Interdependenzen | Folgekette Strom → Wasser/Abwasser/TK/Gesundheit/Verkehr; Ursache-SOP benennen |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Übertragungs- und Verteilnetzbetreiber · BNetzA · Lagezentren der Länder · GMLZ · THW · BSI bei IT-Bezug

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-09"></a>

## 09. SOP LEAD: Gasversorgungsengpass

```yaml
lageart: "Gasversorgungsengpass (angespannte Versorgung, Stufen des Notfallplans Gas, regionale Einschränkungen)"
art_vorschlag: ["Gasversorgungsengpass"]
zweck: "Reproduzierbare Beobachtung der Gasversorgungslage von Frühwarnsignalen bis zu Versorgungseinschränkungen und ihrer Folgen für Wärme, Strom und Industrie."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "vor Heizperiode (September)"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Mengen- oder netzbedingte Einschränkungen der Gasversorgung auf Bundes- oder regionaler Ebene einschließlich Stufen des Notfallplans Gas. Physische Angriffe zusätzlich mit SOP 16. Beispiel dafür: Ausrufung einer Krisenstufe mit angeordneten Einschränkungen. Beispiel dagegen: Preisanstieg ohne physischen Mangel; lokaler Leitungsschaden mit kurzer Unterbrechung.

**Befassungsanlässe:** Ausrufung einer Stufe des Notfallplans Gas · BNetzA-Lagebericht mit Verschlechterung · regionale Abschaltungen · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Stufe des Notfallplans Gas gilt, wie ordnet die BNetzA die Lage ein? | [BNetzA Gasversorgung](https://www.bundesnetzagentur.de/DE/Gasversorgung/start.html); Bundesministerium für Wirtschaft und Energie; je Lagebericht | L/R; D3 | Stufen sind Schwellen des Fachrechts und gelten für das Marktgebiet – nicht automatisch in die Lagebild-Beurteilung oder auf jeden Haushalt übertragen. |
| R2 | Welche Flüsse, Speicher- und Verbrauchsdaten sind auffällig? | BNetzA-Lagebericht; AGSI+ (GIE) | L; D8 | Füllstand saisonal einordnen; Füllstand ist Vorsorgeanzeige, kein Versorgungsnachweis. |
| R3 | Welche regionalen Netze oder Verbraucher sind eingeschränkt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen (Fernleitungs-/Verteilnetz) | L/R; D1/D2 | Nationaler Engpass ≠ gleiche regionale Betroffenheit; Industrieabschaltung ist Steuerungsinstrument, keine Haushaltsbetroffenheit. |
| R4 | Welche Wärme-, Strom- und Produktionsfolgen sind belegt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; BNetzA | R/I; D6 | Gaskraftwerke/KWK koppeln zeitverzögert ins Stromnetz; wirtschaftliche Belastung ≠ Ausfall lebenswichtiger Versorgung. |
| R5 | Welche Schutzmaßnahmen für geschützte Kunden bestehen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Energieaufsicht der Länder | M; D3/D4 | Befugnis, Planung und angeordnete Maßnahme trennen; Ausbleiben von Haushaltsabschaltungen ist keine Entwarnung. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Haushalts- und Wärmeebene ist populationsrelevant, nicht die Marktebene; aus einer Stufenausrufung nicht auf D2 schließen.
- **D3:** Zurechnung ist stufenabhängig (Marktakteure, Netzbetreiber, BNetzA als Bundeslastverteiler in der Notfallstufe, Länder) – im Text begründen.
- **D8:** Schleichender Verlauf über Wochen kann durch Kälteeinbruch oder technische Störung plötzlich kippen; glatter Verlauf allein ist nicht „stabil“.

**Beurteilung/Tendenz:** Eine Frühwarnstufe begründet für sich keine erhebliche Lage; maßgeblich sind belegte oder konkret prognostizierte Folgen für die Bevölkerung. Preisentlastung, Speicheranstieg und Verbesserung der Versorgung sind verschiedene Befunde.

**Offenlassen:** D2 ohne direkt betroffenen Personenkreis; D4 ohne Mobilisierung; D5 ohne konkrete Engpass- oder Wiederherstellungsperspektive.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Stufe, Speicher- und Versorgungslage mit Ausgabestand |
| Risiken & Auswirkungen | Wärmeversorgung vulnerabler Gruppen, Strom, Industrie – belegt vs. Szenario der Fachbehörde |
| Maßnahmen & Handlungsempfehlungen | Maßnahmen des Notfallplans und der Länder; Vorsorge (z. B. Wärmeinseln) |
| Abhängigkeiten & Interdependenzen | Kopplung Gas – Strom – Fernwärme – Industrie – Lieferketten |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** BNetzA · Bundesministerium für Wirtschaft und Energie · Fernleitungs- und Verteilnetzbetreiber · Energieaufsicht und Katastrophenschutz der Länder

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Rechtsrahmen (Notfallplan Gas, EnSiG, EU-Gasversorgungssicherheitsverordnung) auf aktuellen Stand prüfen

---

<a id="sop-10"></a>

## 10. SOP LEAD: Trinkwasserversorgung

```yaml
lageart: "Trinkwasserversorgung (Unterbrechung, Mengeneinschränkung, Qualitätsproblem)"
art_vorschlag: ["Trinkwasserversorgung"]
zweck: "Reproduzierbare Erfassung von Unterbrechungen, Mengeneinschränkungen und Qualitätsproblemen der öffentlichen Trinkwasserversorgung (KRITIS-Sektor Wasser, Branche öffentliche Wasserversorgung)."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Versorgungsunterbrechungen, Abkochgebote, Nutzungsverbote und Verbrauchsbeschränkungen bei Gewinnung, Aufbereitung und Verteilung. Ursache zusätzlich über die jeweilige SOP (05, 02, 08, 07, 15, 16). Beispiel dafür: Abkochgebot für mehrere Gemeinden nach Verkeimung. Beispiel dagegen: Rohrbruch mit kurzer Unterbrechung weniger Haushalte; niedriger Flusspegel ohne Trinkwasserfolgen.

**Befassungsanlässe:** Abkochgebot oder Nutzungsverbot · Versorgungsunterbrechung · Lagemeldung eines Landes · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Zone und welche Art der Einschränkung sind bestätigt? | Wasserversorger, Gesundheitsamt; [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | L; D1 | Versorgungsgebiet, betroffene Zone und Warngebiet trennen; Abkochgebot, Nutzungsverbot und Verbrauchsbeschränkung nicht austauschen. |
| R2 | Welche Ursache und welche Mess- bzw. Mengengrundlage liegen vor? | Wasserversorger, Gesundheitsamt, Wasserbehörde | L/R | Einzelprobe ≠ Bewertung des Gesundheitsamts; Laborbefunde haben Zeitverzug; vermutete Ursache kennzeichnen. |
| R3 | Welche Personen und Einrichtungen sind direkt betroffen? | Wasserversorger, Gesundheitsamt | R; D2 | Einwohnerzahl des Gebiets ist Obergrenze; Zähler/Anschlüsse nicht unbelegt in Personen umrechnen. |
| R4 | Welche Ersatzversorgung besteht? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; THW, Trinkwassernotbrunnen (BBK) | M; D4 | Herkunft eingesetzter Ersatzversorgung für D4 maßgeblich. |
| R5 | Welche Reparatur- und Freigabeschritte sind bekannt? | Wasserversorger, Gesundheitsamt | M/R; D5 | Technische Reparatur beendet das Qualitätsproblem nicht; Freigabe erst durch Gesundheitsamt. |
| R6 | Welche fachlichen Anforderungen erklären die Bewertung? | [UBA Trinkwasser](https://www.umweltbundesamt.de/themen/wasser/trinkwasser); Fachgrundlage | R/I | Grundlagenwissen ersetzt keinen örtlichen Befund. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D3:** Versorger trägt die technische Behebung (Stufe 0 möglich), Gesundheitsamt/Kommune die Gefahrenabwehr – bewertete Funktion nennen.
- **D5:** Technische Wiederherstellung und hygienische Freigabe unterscheiden.
- **D6:** Trinkwasser ist Kern-KRITIS, D6 misst aber die konkrete Kopplung (Kliniken, Pflege, Lebensmittel, Abwasser, Strom für Pumpen).

**Beurteilung/Tendenz:** Wiederhergestellter Druck ist keine Freigabe; Entspannung erst bei Aufhebung der Einschränkung, nicht bei technischer Behebung.

**Offenlassen:** D2 ohne belastbaren Versorgungsbezug; D5 ohne Freigabeperspektive; D8 bei kurzem stabilem Verlauf.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Art der Einschränkung, Raum, Ursache (belegt/vermutet), Zeitstand |
| Risiken & Auswirkungen | Gesundheitliche Risiken; Versorgung vulnerabler Einrichtungen |
| Maßnahmen & Handlungsempfehlungen | Ersatzversorgung, Information der Bevölkerung, Aufhebungskriterien |
| Abhängigkeiten & Interdependenzen | Kopplung zu Strom, Abwasser, Lebensmittel, Gesundheit |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Wasserversorger · Gesundheitsämter · Wasserbehörden der Länder · BBK (Trinkwassernotversorgung) · UBA (Fachgrundlagen)

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-11"></a>

## 11. SOP LEAD: Gesundheitliche Lage / Epidemie

```yaml
lageart: "Gesundheitliche Lage / Epidemie (Infektionsgeschehen, gesundheitliche Versorgungslagen)"
art_vorschlag: ["Gesundheitliche Lage / Epidemie"]
zweck: "Reproduzierbare Erfassung gesundheitlicher Lagen mit möglichen übergreifenden Folgen für Bevölkerung und Gesundheitsversorgung; Dach für die Themen-SOPs."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Infektionsgeschehen im In- und Ausland mit Deutschlandbezug sowie gesundheitliche Versorgungslagen. Hitzebedingte Gesundheitsfolgen: SOP 05; Arzneimittelengpässe: Themen-SOP. Beispiel dafür: ungewöhnliche Fallhäufung oder belegter klinischer Versorgungsengpass. Beispiel dagegen: Einzelbefund ohne Häufungs- oder Versorgungsbezug.

**Befassungsanlässe:** RKI- oder Landesbewertung · ungewöhnliche Häufung · WHO-/ECDC-Signal mit Deutschlandbezug (z. B. PHEIC) · belegte Kapazitätsprobleme · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

**Vertiefung:** Themen-SOPs „Hochkontagiöse Infektionskrankheit – Auslandsausbruch“, „Lokale Infektionshäufung“ und „Zoonotische Tierseuche mit humanem Expositionsrisiko“.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Fälle, Definitionen und Zeiträume sind bestätigt? | [RKI](https://www.rki.de/), erregerspezifische Berichte; Landesgesundheitsbehörde; Datenstand prüfen | L; D1/D2 | Verdacht, Bestätigung und Modellschätzung trennen. |
| R2 | Welche Übertragung oder Ursache ist belegt? | Gesundheitsamt, Landesgesundheitsbehörde | L/R | Wahrscheinlicher Übertragungsweg ist keine gesicherte Quelle. |
| R3 | Welche deutsche Risiko- und Versorgungseinschätzung liegt vor? | RKI, BMG, Landesgesundheitsbehörden | R; D2/D6 | Fallzahlen messen keine Versorgungskapazität. |
| R4 | Welcher internationale Verlauf ist relevant? | [WHO Disease Outbreak News](https://www.who.int/emergencies/disease-outbreak-news); [ECDC](https://www.ecdc.europa.eu/) | R/I | Auslandsschwere nicht in die deutsche Beurteilung übertragen; Abweichungen nach Stichtag und Falldefinition auflösen. |
| R5 | Welche Maßnahmen und Ressourcen sind bestätigt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; STAKOB bei hochpathogenen Erregern | M; D3/D4 | Empfehlung, Anordnung und Umsetzung trennen; Sonderisolierkapazität ist Vorsorge, kein Ereignis. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Welche direkt Betroffenen deckt die Datengrundlage ab? Kontakte, Fälle und Versorgungsbetroffene nicht addieren; Stufe 0 (<10) nur mit belegter Zahl.
- **D5:** Ausbruchskontrolle, Versorgungsentlastung und Regelbetrieb sind verschiedene Zielzustände.
- **D8:** Ändert sich das Geschehen oder nur Test- und Meldepraxis?

**Beurteilung/Tendenz:** Individuelle Krankheitsschwere, Infektionsdynamik und Bevölkerungsschutzrelevanz eigenständig begründen. Bei Auslandsgeschehen kann die Tendenz den internationalen Frühwarntreiber abbilden – die Differenz zur deutschen Betroffenheit im Text benennen.

**Offenlassen:** D2 bei unvereinbaren Bezugsgruppen; D1 und D5 ohne deutsches Bezugsobjekt; Tendenz ohne vergleichbare Datenbasis.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Belegte gesundheitliche Lage nach Raum und Zeitraum; Ausland und Deutschland strikt trennen |
| Risiken & Auswirkungen | Folgen für vulnerable Gruppen und Versorgungskapazitäten, belegt vs. Szenario |
| Maßnahmen & Handlungsempfehlungen | Fachbehördliche Maßnahmen; Abstimmungs- oder Klärungsbedarf; keine eigene medizinische Empfehlung |
| Abhängigkeiten & Interdependenzen | Kopplung Gesundheitsämter – Kliniken – Labore – Rettungsdienst – Reise-/Amtshilfe |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** RKI (inkl. STAKOB) · Landesgesundheitsbehörden und Gesundheitsämter · BMG · Auswärtiges Amt (Auslandsbezug)

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-12"></a>

## 12. SOP LEAD: KRITIS-Ausfall

```yaml
lageart: "KRITIS-Ausfall (sektorübergreifend oder in Sektoren ohne eigene SOP)"
art_vorschlag: ["KRITIS-Ausfall"]
zweck: "Reproduzierbare Erfassung von Ausfällen kritischer Versorgungsfunktionen in Sektoren ohne eigene SOP (z. B. Telekommunikation, Verkehr, Finanzwesen, Ernährung, Abwasser) und sektorübergreifender Kaskaden."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Ausfall oder wesentliche Einschränkung kritischer Dienstleistungen einschließlich mehrerer Sektoren. Für Strom, Gas und Trinkwasser gelten SOP 08–10; Ursachen zusätzlich über SOP 15/16. Beispiel dafür: großflächiger Ausfall von Mobilfunk und Notruf; bundesweite Störung des Zahlungsverkehrs. Beispiel dagegen: kurze Störung eines Dienstes mit Ausweichmöglichkeit.

**Befassungsanlässe:** Lagemeldung eines Landes · Betreiber- oder Aufsichtsmitteilung · Ausfall von Notrufnummern · Monitoring (VOST). Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche konkrete Dienstleistung fällt seit wann wo aus? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; zuständige Aufsicht (z. B. BNetzA für Telekommunikation) | L; D1 | Sektorzugehörigkeit ist kein Funktionsausfall; Betreiberangaben zu Reichweite oft unvollständig. |
| R2 | Welche Menschen und Einrichtungen sind unmittelbar betroffen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R; D2 | Kunden- bzw. Nutzerzahl ≠ direkt betroffene Bevölkerung. |
| R3 | Welche Ersatzsysteme tragen mit welchen Grenzen? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/M; D5 | Redundanz nur bei nachgewiesener Nutzbarkeit annehmen. |
| R4 | Welche weiteren Dienste hängen davon ab? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; [BBK KRITIS](https://www.bbk.bund.de/) für Sektorstruktur | R/I; D6 | Abhängigkeit ≠ eingetretener Folgeausfall; Kettenwirkungen mit Zeitverzug belegen. |
| R5 | Ist Notruf oder Warnung der Bevölkerung betroffen? | Leitstellen, zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R/M | Ausfälle der Bevölkerungskommunikation im Text und bei D6 darstellen (Teil A.2, D7). |
| R6 | Welche Ursachen- und Wiederherstellungsinformationen sind verlässlich? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen; BSI bei IT-Bezug | L/M; D7/D8 | Ursache offenlassen bis belegt; unklare Ursache verhindert nicht die Beschreibung gesicherter Folgen. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Räumlicher Impact der Auswirkungen, nicht Sektorgröße: bundesweiter Dienstausfall ist bundesweit, regional begrenzter Dienst nicht.
- **D3:** Betreiberverantwortung, Aufsicht und Gefahrenabwehr unterscheiden; bewertete Funktion nennen.
- **D6:** Kernachse: nach belegter Zahl und Kopplung betroffener Sektoren, nicht nach KRITIS-Eigenschaft hochkodieren.

**Beurteilung/Tendenz:** Technisch wiederhergestellte Anlage und praktisch verfügbare Dienstleistung können auseinanderfallen. Kurze Ausfälle mit Ausweichmöglichkeit sind meist geringfügig.

**Offenlassen:** D2 ohne belastbare Nutzerzahlen; D5 ohne Wiederherstellungsprognose.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Betroffener Sektor/Dienst, Raum, Ursache (belegt/vorläufig), Zeitstand |
| Risiken & Auswirkungen | Folgeketten in andere Sektoren belegt vs. möglich |
| Maßnahmen & Handlungsempfehlungen | Ausweichwege (z. B. Notrufalternativen), Information der Bevölkerung |
| Abhängigkeiten & Interdependenzen | Sektorübergreifende Kopplung als Kern; Verweis auf Ursache- und Sektor-SOPs |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Betroffene Betreiber und Sektoraufsicht · BSI (IT-Bezug) · BBK (sektorübergreifende Grundlagen) · Lagezentren der Länder

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Aktuellen Stand von BSIG und KRITIS-Dachgesetz prüfen · prüfen, ob für Telekommunikation und Verkehr eigene Themen-SOPs sinnvoll sind

---

<a id="sop-13"></a>

## 13. SOP LEAD: Migrationslage

```yaml
lageart: "Migrationslage (Unterbringung, Versorgung, Aufnahmekapazitäten)"
art_vorschlag: ["Migrationslage"]
zweck: "Reproduzierbare Beobachtung von Schutz-, Unterbringungs- und Versorgungsbedarfen im Zusammenhang mit Fluchtbewegungen, soweit der Bevölkerungsschutz berührt ist."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Lagen, in denen Zugänge Schutzsuchender Unterstützungsbedarf für Unterbringung, Versorgung oder Gesundheitsversorgung erzeugen, der die Regelstrukturen erreicht oder übersteigt. Gegenstand ist die Bedarfsdeckung, nicht die Bewertung von Personengruppen; Ordnungs- und Grenzfragen sind nicht Gegenstand. Beispiel dafür: dokumentierte Kapazitätslücke mit Notunterkünften unter Beteiligung von Hilfsorganisationen und THW. Beispiel dagegen: steigende Antragszahlen innerhalb der regulären Kapazitäten.

**Befassungsanlässe:** Anfrage eines Landes zu Unterbringungsunterstützung · Einrichtung von Notunterkünften · internationale Fluchtbewegung mit absehbarem Deutschlandbezug · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Zugangs- und Bestandszahlen liegen mit welcher Definition vor? | [BAMF Asylgeschäftsstatistik](https://www.bamf.de/DE/Themen/Statistik/Asylzahlen/AsylGesStatistik/asylgeschaeftsstatistik-node.html); monatlich | L; D8 | Anträge, Einreisen, Aufnahmen und Bestände nicht gleichsetzen; Verwaltungsdaten mit Verzug. |
| R2 | Welche Unterbringungs- und Versorgungskapazitäten bestehen? | Aufnahme- und Sozialbehörden der Länder und Kommunen; je Kapazitätsmeldung | L/R; D1/D2 | Belegungsquote nur mit nutzbarer Kapazität und Stichtag; Notunterkunft ≠ Regelunterbringung. |
| R3 | Welche konkreten zusätzlichen Schutz- und Versorgungsbedarfe sind belegt? | Aufnahme- und Sozialbehörden; Gesundheitsämter | R/M; D2 | Bedarfe datenbasiert benennen; keine Gesundheits- oder Sicherheitsannahmen aus Herkunft ableiten. |
| R4 | Welche Unterstützung und Kapazitätserweiterung erfolgt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Hilfsorganisationen, THW | M; D3/D4 | Plan, Zusage und real nutzbare Kapazität trennen. |
| R5 | Welche internationale Entwicklung ist relevant? | UNHCR, Asylagentur der EU (EUAA) | R | Hintergrund; für die deutsche Lage nur mit belegtem Deutschlandbezug; keine lineare Fortschreibung. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D2:** Schutzsuchende sind nicht „Betroffene“ im Schadenssinn: Bezugsobjekt ist eine konkrete Schutz- oder Versorgungslücke (z. B. Personen ohne gesicherte Unterbringung); sonst offen.
- **D3:** Aufnahme und Unterbringung überwiegend Länder/Kommunen, Registrierung und Verteilung teils Bund – je Aspekt begründen.
- **D4:** Kernachse: tatsächlich mobilisierte überörtliche Unterstützung nach Herkunftsraum.

**Beurteilung/Tendenz:** Mehr Zugänge können bei wachsender Kapazität mit stabiler Versorgung einhergehen; Beurteilung und Tendenz auf Bedarfsdeckung beziehen, nicht auf Zugangszahlen. Sachliche, nicht stigmatisierende Sprache.

**Offenlassen:** D2 ohne passendes Bezugsobjekt; D5 ohne definierten Zielzustand (z. B. Rückbau von Notunterkünften); D6 ohne belegte kritische Versorgungsfunktion.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Zugänge, Kapazitäten und Unterstützungsbedarf mit Stichtag und Zählweise |
| Risiken & Auswirkungen | Versorgungsengpässe (Unterbringung, Gesundheit, Winterfestigkeit) belegt vs. absehbar |
| Maßnahmen & Handlungsempfehlungen | Angefragte und eingesetzte Unterstützung; Abstimmungsbedarf |
| Abhängigkeiten & Interdependenzen | Bindung von Kräften der Hilfsorganisationen/THW; Wechselwirkung mit anderen Lagen |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Aufnahme- und Sozialbehörden der Länder und Kommunen · BAMF (Statistikdefinitionen) · Hilfsorganisationen · THW

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Abgrenzung zu Zuständigkeiten der Aufnahme- und Ausländerbehörden im Text schärfen

---

<a id="sop-14"></a>

## 14. SOP LEAD: Sicherheitslage

```yaml
lageart: "Sicherheitslage (Bedrohungslagen, Großveranstaltungen, hybride Bedrohungen) – Bevölkerungsschutzfolgen"
art_vorschlag: ["Sicherheitslage"]
zweck: "Reproduzierbare Beobachtung behördlich belegter Sicherheitslagen ausschließlich im Hinblick auf Folgen und Vorsorgefragen für den Bevölkerungsschutz."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Polizeilich geführte Lagen, soweit sie Warnung, Evakuierung, Betreuung, Versorgung oder Schutz kritischer Infrastruktur berühren. Polizeiliche Einsatzführung und Ermittlungen sind nicht Gegenstand; eingetretene Anschläge und Sabotage: SOP 16. Beispiel dafür: Sperrmaßnahmen mit Versorgungsauswirkung. Beispiel dagegen: polizeiliche Routinelage ohne Bevölkerungsschutzbezug; politische Kontroverse oder Gerücht.

**Befassungsanlässe:** öffentlicher Gefährdungshinweis der Sicherheitsbehörden · Lagemeldung eines Landes · Anfrage zu Betreuungs- oder Evakuierungsunterstützung · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Ereignisse oder Gefährdungshinweise sind behördlich bestätigt? | [BKA Pressestelle](https://www.bka.de/DE/Presse/Pressestelle/pressestelle_node.html) und zuständige Landespolizei/Innenministerium; anlassbezogen; Zuständigkeit im Einzelfall prüfen; BMI | L | Nur veröffentlichte oder zur Weitergabe freigegebene Informationen; Aussagegrad nennen; keine eigene Gefährdungsbewertung. |
| R2 | Welche Räume und Schutzmaßnahmen sind betroffen? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | L/M; D1 | Sperr- oder Schutzraum ≠ Schadensraum; Absagen sind Vorsorge. |
| R3 | Welche Personenschäden oder Evakuierungen bestehen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R; D2 | Nicht alle Anwesenden oder von Maßnahmen Berührten als direkt betroffen zählen. |
| R4 | Welche Dienste, Transportwege oder Einrichtungen sind eingeschränkt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/I; D6 | Einschränkung und Grund getrennt belegen; Gefährdungshinweis ≠ Beeinträchtigung. |
| R5 | Welche nichtpolizeiliche Unterstützung ist mobilisiert? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | M; D3/D4 | Operative Führung nicht aus Medienpräsenz ableiten. |
| R6 | Welche Informationen kursieren öffentlich? | Medienauswertung (VOST) gegen amtliche Quellen | D7 | Gerüchte und Desinformation kennzeichnen, nicht weitertragen; Nichtveröffentlichung ist kein Kommunikationsausfall. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D3:** Polizeiliche Zuständigkeit (Land, Bund) von Bevölkerungsschutz-Zuständigkeit trennen; bewertete Funktion nennen.
- **D7:** Welche Lageinformationen fehlen tatsächlich? Behördliche Zurückhaltung aus Ermittlungsgründen ist institutionell, keine Kompetenzlücke – nicht wertend begründen.
- **D8:** Bestätigter Lagewechsel oder nur neue Berichterstattung?

**Beurteilung/Tendenz:** Mediale Aufmerksamkeit und Ereignisschwere getrennt bewerten; Rücknahme einer Maßnahme ist nur für ihren Geltungsbereich aussagekräftig. Keine Dramatisierung.

**Offenlassen:** Achsen ohne belegtes Bezugsobjekt im Bevölkerungsschutz, im Zweifel D1, D2, D5.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Öffentlich belegte Lage mit Quelle und Stand; keine Spekulation |
| Risiken & Auswirkungen | Mögliche Folgen für Bevölkerung und KRITIS als Szenario |
| Maßnahmen & Handlungsempfehlungen | Vorsorge- und Unterstützungsfragen des Bevölkerungsschutzes |
| Abhängigkeiten & Interdependenzen | Schnittstellen Polizei – Bevölkerungsschutz – Betreiber; Verweis auf SOP 15/16 bei Bezug |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Lagezentren der Innenministerien · zuständige Polizeibehörden · BMI · BBK

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Umgang mit eingestuften Informationen (VS) in der Lagebild-Darstellung klären

---

<a id="sop-15"></a>

## 15. SOP LEAD: Cyberangriff / IT-Sicherheitsvorfall

```yaml
lageart: "Cyberangriff / IT-Sicherheitsvorfall mit Folgen für Versorgung, KRITIS oder Verwaltung"
art_vorschlag: ["Cyberangriff / IT-Sicherheitsvorfall"]
zweck: "Reproduzierbare Erfassung von IT-Sicherheitsvorfällen, deren Folgen die Versorgung der Bevölkerung, KRITIS oder die Handlungsfähigkeit von Behörden berühren."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Bestätigte oder behördlich begründet vermutete Vorfälle (z. B. Ransomware, DDoS, Ausnutzung kritischer Schwachstellen) mit Funktions- oder Versorgungsbezug. Technische Vorfallsbewältigung und Attribution sind nicht Gegenstand; Folgeausfälle zusätzlich über SOP 08–12. Beispiel dafür: Ransomware mit Ausfall von Bürgerdiensten und Leitstelle. Beispiel dagegen: Schwachstellenwarnung ohne bekannte Ausnutzung.

**Befassungsanlässe:** BSI-Warnung oder -Mitteilung · öffentlich bekannter Vorfall bei Betreiber oder Behörde · Lagemeldung eines Landes · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist zu Vorfall, betroffenen Diensten und Bestätigungsgrad bekannt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | L; D1 | Störung, Angriff und vorsorgliche Abschaltung unterscheiden. |
| R2 | Welche Schwachstelle oder Bedrohung ist fachlich beschrieben? | [BSI Sicherheitshinweise und Warnungen](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Cyber-Sicherheitslage/Technische-Sicherheitshinweise-und-Warnungen/technische-sicherheitshinweise-und-warnungen_node.html); anlassbezogen | L/R | Technische Warnung ist kein Angriffsnachweis; BSI-Kommunikation ist oft anonymisiert. |
| R3 | Welche Leistungen sind für welche Personen nicht verfügbar? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; betroffene Organisation | R; D2 | Datensätze, Nutzerkonten und betroffene Personen nicht gleichsetzen. |
| R4 | Welche Ersatzverfahren und Folgewirkungen bestehen? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | M/R; D6 | Backup ist kein Nachweis erfolgreicher Wiederherstellung; Dienstleister-Kopplungen wirken verzögert. |
| R5 | Welche Unterstützung und Koordination bestehen? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; BSI, Cybersicherheitsstellen der Länder | M; D3/D4 | IT-Betrieb, Gefahrenabwehr und Ermittlungen getrennt zuordnen. |
| R6 | Welche Wiederanlauf- und Informationslage ist bestätigt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | M/R; D5/D7 | Keine Täter- oder Ursachenzuschreibung aus unbestätigten Behauptungen; Ausfall behördlicher Kommunikation wirkt auf die Informationslage. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Nach dem Raum der betroffenen Leistungen kodieren (z. B. Kreis der ausgefallenen Verwaltung), nicht nach Serverstandort oder Angriffsgröße.
- **D5:** Notbetrieb, Teildienste, vertrauenswürdiger Wiederanlauf und Vollbetrieb sind verschiedene Zielzustände; nach Ransomware oft Wochen bis Monate.
- **D7:** Nur belegte Informationsstörungen (z. B. ausgefallene Behördenkommunikation) kodieren, nicht fehlende Detailangaben.

**Beurteilung/Tendenz:** Beurteilung nach Folgen für Bevölkerung und Versorgung, nicht nach technischer Raffinesse; beendete Angriffsaktivität kann mit langem Wiederherstellungsbedarf einhergehen – Tendenz auf Leistungserbringung beziehen.

**Offenlassen:** D2 ohne belastbare Personenzahl; D4 ohne belegte externe Unterstützung.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Betroffene Organisation, ausgefallene Leistungen, Zeitstand; keine technischen Angriffsdetails |
| Risiken & Auswirkungen | Folgen für Versorgung, Notruf, Verwaltung; Ausweitung als Szenario |
| Maßnahmen & Handlungsempfehlungen | Notbetrieb, Ausweichverfahren, Information der Bevölkerung |
| Abhängigkeiten & Interdependenzen | Folgeausfälle in anderen Sektoren; Kopplung an Kommunikationswege |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Betroffene Betreiber/IT-Verantwortliche · BSI/zuständiges CERT · Cybersicherheitsstellen der Länder · Polizei bei Ermittlungsbezug

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren

---

<a id="sop-16"></a>

## 16. SOP LEAD: Sabotage / Anschlag / Terrorismus

```yaml
lageart: "Sabotage / Anschlag / Terrorismus – Folgen für Bevölkerung und KRITIS"
art_vorschlag: ["Sabotage / Anschlag / Terrorismus"]
zweck: "Reproduzierbare Erfassung behördlich bestätigter oder ausdrücklich als Verdacht benannter vorsätzlicher Schädigungen ausschließlich im Hinblick auf ihre Folgen."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Eingetretene Sabotageakte und Anschläge mit Folgen für Bevölkerung, Versorgung oder KRITIS. Ermittlungen, Motive und Täterschaft sind nicht Gegenstand; Gefährdungshinweise ohne Ereignis: SOP 14; Folgeausfälle über die Sektor-SOPs. Beispiel dafür: beschädigte Bahn- oder Stromtrasse mit behördlich benanntem Sabotageverdacht und großflächigen Ausfällen. Beispiel dagegen: technische Störung ohne behördlichen Hinweis auf Vorsatz (ursachenoffen); Vandalismus ohne Versorgungsfolgen.

**Befassungsanlässe:** Lagemeldung eines Landes · öffentliche Mitteilung von Polizei oder Generalbundesanwalt · Warnung der Bevölkerungswarnung · Monitoring (VOST). Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist Ereignisfakt, was behördlicher Verdacht? | [BKA Pressestelle](https://www.bka.de/DE/Presse/Pressestelle/pressestelle_node.html) und zuständige Landespolizei/Innenministerium; anlassbezogen; Zuständigkeit im Einzelfall prüfen; Generalbundesanwalt | L | Sabotage, Anschlag und Terrorismus nicht austauschbar verwenden; Einordnung erst nach amtlicher Aussage. |
| R2 | Welche Schäden und Funktionsausfälle sind unabhängig von der Ursache bestätigt? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | L/R; D1/D6 | Ungeklärte Täterschaft verhindert keine Auswirkungsanalyse. |
| R3 | Welche Menschen sind unmittelbar geschädigt oder evakuiert, welche Betreuung läuft? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen; Rettungsdienst, PSNV-Strukturen | R; D2 | Opferzahlen nur aus amtlicher Quelle mit Bezugszeit und Bestätigungsgrad. |
| R4 | Welche Schutz-, Sperr- und Verhaltenshinweise gelten? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen; Polizei | M; D1 | Keine operativen Schwachstellen ergänzen; Ausbleiben einer Warnung ist keine Entwarnung. |
| R5 | Welche Rettungs- und Ersatzversorgungshilfe besteht? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | M; D3/D4 | Ermittlungsführung und Versorgungswiederherstellung unterscheiden. |
| R6 | Welche Informationen kursieren? | Medienauswertung (VOST) gegen amtliche Quellen | D7 | Gerüchte, Falschmeldungen und unbelegte Täterangaben nicht übernehmen. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D3:** Ermittlungszuständigkeit (Polizei, ggf. GBA/BKA) und Folgenbewältigung (Land/Kommune, Betreiber) getrennt; bewertete Funktion begründen, nicht pauschal „Bund“.
- **D6:** Nach belegten Folgeausfällen kodieren, nicht nach Symbolwert des Ziels oder denkbarer Angriffswirkung.
- **D8:** Misst die Dynamik der eingetretenen Lage; Nachahmungs- oder Folgerisiken gehören in den Risikotext.

**Beurteilung/Tendenz:** Beurteilung nach Folgen für Bevölkerung und Versorgung; Ermittlungserfolg ersetzt keine Bewertung fortdauernder Versorgungsfolgen. Keine Spekulation über Motive oder Folgetaten; sachliche Sprache.

**Offenlassen:** Achsen, für die in der Frühphase keine gesicherten Angaben vorliegen – offen statt geschätzt.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Gesicherte Tatsachen mit Quelle und Stand; Ursache nur nach amtlicher Aussage |
| Risiken & Auswirkungen | Versorgungs- und KRITIS-Folgen belegt vs. möglich; Folgerisiken nur mit fachlicher Grundlage |
| Maßnahmen & Handlungsempfehlungen | Warnung, Betreuung (PSNV), Ersatzversorgung, Wiederherstellung |
| Abhängigkeiten & Interdependenzen | Folgeketten in Sektoren; Verweis auf Sektor-SOPs |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Lagezentren der Innenministerien · zuständige Polizei-/Ermittlungsbehörde (Bestätigungsgrad) · betroffene Betreiber · BBK

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · Freigabeweg für Informationen aus laufenden Ermittlungen klären

---

<a id="sop-17"></a>

## 17. SOP LEAD: Sonstiges

```yaml
lageart: "Sonstiges (Sachverhalte ohne ausreichend passende Katalogart)"
art_vorschlag: ["Sonstiges"]
zweck: "Reproduzierbare Prüfung und Meldung von Sachverhalten mit möglicher Bevölkerungsschutzrelevanz, die keiner spezifischen Katalogart ausreichend entsprechen."
version: "0.4"
stand: "10.10.2026"
basiert_auf_meldungsvorlage: "LEAD-Meldevorlage 1.0 (Schemakennung LEAD-Meldung-v1)"
kodierleitfaden: "LEAD v0.4"
pflegeverantwortlich: "[Funktion festlegen]"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Einzelquellen fallbezogen prüfen"
naechste_pruefung_faellig: "[Termin festlegen]"
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Auffangkategorie. Zuerst prüfen, ob eine spezifische Ereignisart (ggf. zusätzlich) passt; „Sonstiges“ kurz begründen. Beispiel dafür: Weltraumwetter-Frühwarnung ohne bestätigten Netzausfall; Arzneimittel-Versorgungsmangel. Beispiel dagegen: bestätigter Stromausfall – vorrangig SOP 08.

**Befassungsanlässe:** fachbehördliches Signal · neue sektorübergreifende Entwicklung · Anfrage ohne passende Kategorie · Monitoring. Ein Anlass eröffnet die Prüfung, keine Relevanzentscheidung.

**Vertiefung:** Themen-SOPs „Arzneimittel-Versorgungsmangel“ und „Weltraumwetter / geomagnetische Störungen“.

### 2. Erfassung: Recherchebausteine

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welcher konkrete Sachverhalt und welche Kataloglücke liegen vor? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | L; art | Sonstiges begründen; keine eigenen Kategorien erfinden. |
| R2 | Welche originäre Fachquelle bestätigt das Signal? | Zuständige Fachbehörde je Thema; [BBK](https://www.bbk.bund.de/) nur als Rechercheeinstieg | L/R | Primärquelle je Thema ermitteln; Grundlagenseiten bestätigen kein Ereignis. |
| R3 | Welche deutsche räumliche und personelle Wirkung ist belegt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | R; D1/D2 | Internationales Signal ist keine deutsche Direktbetroffenheit. |
| R4 | Welche konkreten Versorgungsabhängigkeiten bestehen? | Betroffener Betreiber, bestätigte Betriebs-/Störungsmeldung; anlassbezogen; fallbezogen ergänzen | R/I; D6 | Neue Hypothese nicht als belegte Kaskade darstellen. |
| R5 | Welche Maßnahmen und Fachzuständigkeiten sind benannt? | Zuständiges Land/Kreis, freigegebene Lage- und Behördenmeldungen; behördeninterne Lageberichte; anlassbezogen | M; D3/D4 | Fachquelle nicht automatisch als verantwortliche Ebene kodieren. |
| R6 | Welche Indikatoren würden die Bewertung verändern? | Zuständige Fachbehörde; Betreiber | R/M; D5/D8 | Beobachtungskriterium ist keine starre Meldeschwelle. |

Befundnachweis nach Teil A.3.

### 3. Auswertung: lageart-spezifische Prüfpunkte

**Ereignisart:** `art_vorschlag` ist Startpunkt, keine Checkliste; weitere Werte nur aus dem Katalog des Schemas. Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Ist der Wirkungsraum belegt oder nur potenziell?
- **D3:** Welcher konkrete Gegenstand lässt sich einer Verantwortungsebene zuordnen? Ohne Gegenstand offen.
- **D6:** Welche funktionale Abhängigkeit trägt den KRITIS-Bezug?

**Beurteilung/Tendenz:** Ungewöhnlichkeit und geringe Datenmenge begründen weder eine hohe noch eine geringe Beurteilung; Erkenntnisgrenzen ausdrücklich nennen.

**Offenlassen:** Jede Achse ohne geeigneten Bezugsgegenstand, besonders D5.

### 4. Darstellung: Übertrag in die Meldung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Was ist bestätigt, und warum passt keine spezifischere Kategorie? |
| Risiken & Auswirkungen | Beobachtete Folgen und prüfbedürftige Hypothesen getrennt |
| Maßnahmen & Handlungsempfehlungen | Gezielte Fachrecherche oder Abstimmung zur Verbesserung des Erkenntnisstands |
| Abhängigkeiten & Interdependenzen | Konkrete funktionale Abhängigkeiten statt allgemeiner Szenarien |

Bewertungstext, JSON-Konventionen und Abschlusscheck nach Teil A.4 und A.5.

### 5. Fachliche Rückfrage und Pflege

**Ansprechstellen:** Zuständige Fachstelle anhand des Gegenstands ermitteln und dokumentieren · BBK/Länder als Vermittlungsweg

**Inhaltlich offene Punkte:** Pflegefunktion und Prüftermin festlegen; örtliche Quellen fallbezogen konkretisieren · wiederkehrende Themen unter „Sonstiges“ für eine Katalogerweiterung sammeln

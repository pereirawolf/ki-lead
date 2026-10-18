# Kodierleitfaden LEAD – Lagenradar und Quellenkategorien

Beispielfassung für KI-LEAD · Fassung 1.1 vom 17.10.2026 · abgeleitet aus der Arbeitsfassung v0.4 · gilt für die LEAD-Meldevorlage 1.0 (Schemakennung `LEAD-Meldung-v1`), die SOP-LEAD-Sammelmappe (Beispielfassung) und die Arbeitsanweisung Erfassung

Dieser Leitfaden konkretisiert die Kodierregeln aus SOP-LEAD Teil A.2 und die Quellenregeln aus Teil A.3. Er legt die Auslegung der Achsen D1–D8 und die Quellenkategorien A/W/M/P fest. Das Lagenradar ist veröffentlicht als: Pereira Wolf, H. (2026). Hybride Zwischenlagen im Bevölkerungsschutz. https://doi.org/10.5281/zenodo.18305827

**Rangfolge bei Widersprüchen:** (1) Stufentexte der Darstellungsdatei, (2) dieser Kodierleitfaden, (3) SOP-LEAD Teil A, (4) lageartspezifische Hinweise der einzelnen SOP, (5) Arbeitsanweisung. Stellt jemand einen Widerspruch fest, wird er offen benannt und nicht stillschweigend aufgelöst.

---

## 1. Grundregeln

1. **Referenzraum und Zeitpunkt festlegen.** Vor der Kodierung werden der Referenzraum (in der Regel der deutsche Bevölkerungsschutz bzw. das meldende Land) und der Zeitpunkt t0 benannt. t0 ist der Meldezeitpunkt, nicht der Ereignisbeginn und nicht der Datenstand einer einzelnen Quelle. Kodiert wird der Ist-Zustand zu t0.
2. **Alle acht Achsen einzeln prüfen.** Jede Achse wird für sich kodiert. Die in einer SOP hervorgehobenen Achsen sind Stolperstellen, keine Auswahl.
3. **Höhere Zahl = stärkere, bedeutsamere oder ungünstigere Ausprägung.** Die Bedeutung einer Stufe ergibt sich ausschließlich aus dem Stufentext (Abschnitt 2).
4. **Stufe 0 ist eine inhaltliche Aussage, kein Leerwert.** Sie braucht einen Beleg wie jede andere Stufe.
5. **Offen statt geschätzt.** Fehlt ein Bezugsgegenstand oder ein tragfähiger Beleg, bleibt die Achse offen: in der Eingabemaske „keine Angabe“, im JSON `null`. Ein selbst erfundener Code wie „U“ ist unzulässig. Offen ist eine Information, keine Lücke.
6. **Konservativ einstufen.** Passen zwei Stufen belegbar, gilt die niedrigere; die Grenze wird im Bewertungstext benannt. Modellschätzungen werden nicht über ihre Untergrenze hinaus kodiert.
7. **Keine Zukunft im Ist-Wert.** Erwartete Entwicklungen gehören in „Risiken & Auswirkungen“ und in den Kennsatz `Neubewertung bei:`, nicht in die Radarwerte.
8. **Kein Gesamtscore.** Keine Summe, kein Mittelwert, keine Rangfolge zwischen Sachverhalten. Die Divergenz zwischen den Achsen ist der Erkenntnisgewinn.
9. **Begründungsmuster.** Jeder gesetzte Wert wird im Bewertungstext oder in den Analysefeldern so begründet:
   „D[n] = [Wert], weil [konkreter Indikator] laut [Q-Verweis, Datenstand] für [Raum/Zeitpunkt]; Abgrenzung zur Nachbarstufe: [Kriterium].“
   Nicht tragfähig: „vermutlich eher mittel“, „dürfte im oberen Bereich liegen“.
10. **Offene Achsen begründen.** Jede offene Achse erhält einen kurzen Grund („D5 offen: kein Zielzustand benannt“).

### Prüfreihenfolge je Achse

1. Gibt es für diese Achse einen **Bezugsgegenstand** im Referenzraum (eine Fläche, eine Personengruppe, eine steuernde Stelle, eine Unterstützungsleistung, einen Zielzustand, eine Kopplung, eine Lageinformation, eine beobachtete Veränderung)? – Nein: **offen**.
2. Gibt es einen **Beleg** zu diesem Gegenstand? – Nein: **offen**.
3. Welche **Stufe** trägt der Beleg nach dem Stufentext? – Bei zwei passenden Stufen: die **niedrigere**.
4. **Grenze zur Nachbarstufe** benennen.

---

## 2. Stufentexte (Referenz)

| Stufe | D1 Räumliche Auswirkung | D2 Personelle Direktbetroffenheit | D3 Verantwortungszurechnung | D4 Unterstützungsreichweite |
|---|---|---|---|---|
| 0 | punktuell/kleinflächig | unter 10 Personen | Betreiber | keine externe Hilfe |
| 1 | kommunal | 10–99 Personen | Kommune | örtlich |
| 2 | überörtlich (mehrere Kommunen/Kreis) | 100–999 Personen | Kreis/Bezirk | überörtlich |
| 3 | regional (mehrere Kreise/Region) | 1.000–9.999 Personen | Region/Regierungsbezirk | regional |
| 4 | landesweit | 10.000–99.999 Personen | Land | landesweit |
| 5 | bundesweit | 100.000–999.999 Personen | Bund | bundesweit |
| 6 | international | 1 Mio. oder mehr | International | international |

| Stufe | D5 Zeit bis Zielzustand | D6 KRITIS-Bezug | D7 Informationslage | D8 Dynamik |
|---|---|---|---|---|
| 0 | unter 6 Stunden | keine KRITIS-Bezüge | stabil/hoch verlässlich | stabil |
| 1 | 6–24 Stunden | peripher | leichte Verzögerungen | geringe Schwankungen |
| 2 | 1–3 Tage | sektoral begrenzt | relevante Lücken | einzelne Umschläge |
| 3 | 4–7 Tage | regional zentral | fragmentiert | wiederholte Phasenwechsel |
| 4 | 1–4 Wochen | sektorenübergreifend gekoppelt | stark eingeschränkt | hohe Planungsinstabilität |
| 5 | 1–3 Monate | multiple KRITIS-Sektoren | massiv eingeschränkt | sehr hohe Dynamik |
| 6 | mehr als 3 Monate | systemisch/überregional | nahezu ausgefallen | chaotisch |

---

## 3. Achsenregeln

### D1 Räumliche Auswirkung / Impact-Raum

- **Kodierfrage:** Wie weit reicht der belegte Wirkungsraum im Referenzraum zu t0?
- **Bezugsgegenstand:** Schadens-, Einsatz-, Versorgungs- oder Betroffenheitsraum.
- **Nicht:** Warngebiet, Prognoseraum, Summe früherer isolierter Fälle, Sitz der berichtenden Stelle.
- **Offen:** wenn nur ein potenzieller Raum beschrieben ist (z. B. Frühwarnung ohne Ereignis).

### D2 Personelle Direktbetroffenheit

- **Kodierfrage:** Wie viele Personen sind im Referenzraum zu t0 unmittelbar betroffen?
- **Direkt betroffen** sind Personen, deren Leben, Gesundheit, Unterkunft oder Grundversorgung durch das Ereignis selbst unmittelbar beeinträchtigt ist, etwa Verletzte, Erkrankte, Evakuierte oder Personen ohne Strom- oder Wasserversorgung. Nicht direkt betroffen sind Personen in einem Warngebiet ohne eingetretene Beeinträchtigung und mittelbar Betroffene, etwa durch Verkehrsbehinderungen.
- **Nullregel (vereinheitlicht):** Stufe 0 („unter 10 Personen“) ist zulässig, wenn **eine** der beiden Bedingungen belegt ist:
  - (a) eine belegte Zahl von 1 bis 9 direkt Betroffenen, oder
  - (b) ein Nullbefund aus einer aktiv laufenden, für den Sachverhalt einschlägigen Erhebung mit definierter Grundgesamtheit (Surveillance, Meldepflicht, Fallregister, Lagemeldung mit ausdrücklicher Fehlanzeige).
- **Offen:** wenn weder (a) noch (b) belegt ist, auch wenn eine Zahl von null plausibel erscheint. Unterschieden wird damit „belegte Kleinzahl oder belegte Null“ (0) von „keine beobachtbare Grundgesamtheit“ (offen).
- **Umrechnungen:** Anschlüsse, Haushalte oder Megawatt sind keine Personen. Eine Umrechnung ist nur mit offengelegtem Faktor und Quelle zulässig; dann gilt die Untergrenze.
- **Auslandslagen:** Ausländische Fallzahlen werden nicht auf D2 übertragen. Für Deutschland gilt die deutsche Betroffenheit.


### D3 Verantwortungszurechnung / Zurechnungszentrum

- **Kodierfrage:** Welche Ebene steuert oder trägt die bewertete Funktion zu t0?
- **Bewertete Funktion benennen:** Betrieb, Gefahrenabwehr, Fachaufsicht, Ermittlung oder Regulierung. Eine Quelleninstitution ist nicht automatisch das Zurechnungszentrum.
- **Mit Akutereignis:** Kodiert wird die Ebene, die Bewältigung oder Koordination tatsächlich steuert (z. B. Kreis als untere Katastrophenschutzbehörde = 2; Land bei landesweiter Koordinierung = 4).
- **Ohne Akutereignis (Vorsorge-, Beobachtungs-, Frühwarnsachverhalt):** Eine **strukturelle Zurechnung** ist zulässig, wenn ein konkreter Gegenstand benennbar ist, nämlich eine bestimmte Fach-, Regulierungs- oder Vorsorgeaufgabe, und die zuständige Ebene belegt ist. Dann wird diese Ebene kodiert, und der Bewertungstext erhält die Kennzeichnung „D3 strukturell: [Aufgabe], [Stelle]“.
- **Offen:** wenn auch die strukturelle Zuständigkeit für einen konkreten Gegenstand nicht belegbar ist. Eine fiktive Bündelung bei der Koordinierungsstelle ist ausgeschlossen. Die Koordinierungsstelle ist keine Zurechnungsebene.
- **Vorsorge vor einem Akutereignis:** Belegte Vorsorgemaßnahmen einer Stelle vor dem Eintritt (z. B. Sandsackausgabe, Sperrung, öffentliche Warnung), über die öffentlich berichtet wird, gelten als beobachtbare Zurechnung. Kodiert wird die Ebene der vorsorgenden Stelle (z. B. Stadt oder Gemeinde = 1). Der Bewertungstext nennt Maßnahme und Stelle („D3 Vorsorge: [Maßnahme], [Stelle]“).
- **Nicht:** Zuständigkeitsprüfung im Rechtssinn. D3 beschreibt die beobachtbare Zurechnung.


### D4 Unterstützungsreichweite / Mobilisierung

- **Kodierfrage:** Aus welchem Raum stammt die tatsächlich eingesetzte externe Unterstützung zu t0?
- Maßgeblich ist der **Herkunftsraum**, nicht Menge, Wert oder Organisationsform. Grenzüberschreitende Hilfe oder Beschaffung ist „international“, auch über ein deutsches Unternehmen.
- **Nicht:** Bereitschaft, Zusage, Anforderung ohne Einsatz, historische Unterstützung.
- **Stufe 0** („keine externe Hilfe“) nur mit Beleg, dass die Lage ohne externe Unterstützung bewältigt wird.

### D5 Zeit bis Zielzustand / Übergangsdauer

- **Kodierfrage:** Wie lange dauert es voraussichtlich ab t0, bis der benannte Zielzustand erreicht ist?
- **Zielzustand ausdrücklich benennen** (z. B. Gefahrenabwehr beendet, Versorgung wiederhergestellt, Freigabe erteilt). Wetterende oder technische Wiederversorgung sind nicht automatisch der Zielzustand.
- Grundlage ist eine belegte Prognose der zuständigen Stelle oder des Betreibers.
- **Offen:** ohne Zielzustand oder ohne belastbare Prognose, bei unbestimmten Trends.
- D5 ist **keine Dringlichkeitsskala**. Zeitkritischer Handlungsbedarf steht im Kennsatz `Handlungsrelevant bis:`.

### D6 KRITIS-Bezug / Interdependenzgrad

- **Kodierfrage:** Welche Kopplungen zu kritischen Infrastrukturen sind in der konkreten Lage zu t0 belegt?
- Kodiert wird nach **belegten Kopplungen**, nicht nach Sektorzugehörigkeit oder Listen denkbarer Folgen. Die KRITIS-Prüfung ist Pflicht bei jeder Meldung.
- **Wirkungskette:** Bei einer bewertungsrelevanten Folgekette die entscheidende Verbindung benennen: beeinträchtigte Funktion → Abhängigkeit → Bedingung → betroffener Bereich, mit Puffer und Reichweite (Notstrom, Vorräte, Speicher, Personal, Ausweichweg). Mögliche Folgeschritte als **Szenario** kennzeichnen. Sie ändern den Ist-Wert nicht.
- **Stufe 0** („keine KRITIS-Bezüge“) nur, wenn die Prüfung durchgeführt wurde und keine Kopplung ergab.
- Ausfälle der **Kommunikation mit der Bevölkerung** (Mobilfunk, Warnmittel) gehören als Kopplung hierher und in den Text, nicht zu D7.

### D7 Kommunikation / Informationslage

- **Kodierfrage:** Wie verfügbar, verlässlich und widerspruchsfrei ist die **Lageinformation der Befassung** zu t0?
- **Festlegung:** D7 bewertet ausschließlich die Informationslage der befassten Stellen, also ob zuständige Stellen und Primärquellen zentrale Lagefragen beantworten. Die Kommunikationslage der Bevölkerung wird in „Risiken & Auswirkungen“ und bei D6 dargestellt.
- **Erhöhte Stufe**, wenn für zentrale Fragen keine recherchierbaren Primärquellen bestehen, zuständige Stellen widersprüchlich oder verzögert informieren oder Meldewege gestört sind.
- **Keine erhöhte Stufe** wegen eigener Recherchegrenzen in der verfügbaren Zeit oder wegen unterschiedlicher Bewertungen derselben Informationen (SOP-LEAD A.7.2).
- **Widersprüchliche Vorhersagen:** Weichen Vorhersagen fachlich maßgeblicher Stellen für zentrale Lagefragen voneinander ab (z. B. Wasserstandsmodelle zweier Dienste), ist D7 = 1. Ist die Vorhersagelage eindeutig und übereinstimmend, ist D7 = 0.
- **Stufe 0** („stabil/hoch verlässlich“), wenn zuständige Stellen aktuell, konsistent und überprüfbar informieren.


### D8 Dynamik

- **Kodierfrage:** Wie stark hat sich die Lage im Referenzraum im zurückliegenden Beobachtungszeitraum tatsächlich verändert?
- Bewertet werden beobachtete Änderungen, nicht die Zahl eingehender Meldungen und nicht latente Folgerisiken.
- Internationale Veränderungen bei Auslandslagen werden als Frühwarnindikator im Text ausgewiesen, nicht als deutsche Dynamik.
- D8 ist **nicht die Tendenz**. Eine Lage kann sehr dynamisch sein und sich zugleich entspannen.

---

## 4. Bewertung und Tendenz

- **Bewertung** (`geringfügig` / `erheblich` / `kritisch`) wird eigenständig aus der belegten gegenwärtigen Relevanz für den Bevölkerungsschutz im Referenzraum abgeleitet, nicht aus dem höchsten Radarwert. Jede Stufe, auch „geringfügig“, braucht eine fachliche Begründung. Ist keine Stufe tragfähig: „keine Angabe“ (`""`).
- **Tendenz** (`Entspannung` / `Stabilisierung` / `Verschärfung`) wird mit ausdrücklich benanntem Bezugsraum und Zeitfenster begründet. Fehlende neue Erkenntnisse sind kein Beleg für Stabilisierung. Divergieren deutsche Lage und ausländischer Frühwarntreiber, wird das im Text erläutert, nicht in die Auswahl gezwungen.
- Der **Bewertungstext** beginnt mit der Kernaussage (SOP-LEAD A.4) und schließt mit den Kennsätzen, soweit sie vorliegen.

---

## 5. Quellenkategorien A/W/M/P

Jede Quelle im Feld **„Quellen & Referenzen“** erhält genau eine Kategorie. Die Kategorie bestimmt die Standardgewichtung bei widersprüchlichen Angaben.

| Kategorie | Bedeutung | Beispiele |
|---|---|---|
| **A** | amtlich/zwischenstaatlich | Bundes-, Landes- und Kommunalbehörden, Bundesoberbehörden, EU, WHO, ECDC; behördeninterne Lagemeldungen (z. B. Lagemeldung eines Landes) |
| **W** | wissenschaftlich | Forschungseinrichtungen, begutachtete Fachpublikationen, wissenschaftliche Datensätze; Preprints mit Kennzeichnung „Preprint“ |
| **M** | Medien | Redaktionen mit eigener Recherche, Nachrichtenagenturen |
| **P** | privat/wirtschaftlich | Unternehmen und Betreiber, Verbände, NGOs, Hilfsorganisationen (Eigenangaben), Beiträge in sozialen Medien (Behördenkonten = A) |

**Rangfolge:** A vor W vor M vor P. Weicht eine niedriger eingestufte von einer höher eingestuften Quelle ab, gilt grundsätzlich die höher eingestufte.

**Kompetenzausnahme:** Besitzt die niedriger eingestufte Quelle für die konkrete Aussage die überlegene fachliche Kompetenz (z. B. Betreiber für den eigenen Störungs- und Wiederversorgungsstand, Studie für ihre eigenen Primärdaten, Hilfsorganisation für ihre eigenen Tätigkeiten), gilt sie für diese Aussage. Beide Quellen werden genannt und die Abweichung von der Rangfolge im Text begründet.

**Ungeklärte Widersprüche** zwischen gleichrangigen Quellen: beide Werte mit Quelle nennen, nicht festlegen.

**Unabhängigkeit:** Mehrere Übernahmen derselben Meldung sind keine unabhängige Bestätigung. Die Kernaussage stützt sich nach Möglichkeit auf zwei unabhängige Quellen unterschiedlicher Kategorie. Gelingt das nicht, wird es offen benannt.

**Format im Feld „Quellen & Referenzen“** (ein Eintrag je Quelle, nummeriert in der Reihenfolge der ersten Nennung, Folgezeilen gehören zum vorherigen Eintrag):

```
[Q1] A – Herausgeber (TT.MM.JJJJ): Titel. Online abrufbar unter: URL [Zugriff: TT.MM.JJJJ]
[Q2] P – Netzbetreiber Y (09.10.2026): Störungsmeldung. Online abrufbar unter: https://… [Zugriff: 09.10.2026]. Datenstand: 09.10.2026, 12:00
[Q3] A – Lagezentrum Land X (09.10.2026): Lagemeldung Nr. 12 (behördenintern) [Zugriff: 09.10.2026]
[Q4] M – Redaktion Z (08.10.2026): Titel. Online abrufbar unter: https://… (Paywall) [Zugriff: 09.10.2026]
```

- Das Zugriffsdatum ist bei jeder Quelle anzugeben. Datenstand und Veröffentlichungsdatum werden getrennt geführt, soweit verfügbar.
- Eine Bezahlschranke wird mit „(Paywall)“ gekennzeichnet, eine unzugängliche Quelle mit „nicht ausgewertet“. Davon abhängige Aussagen gelten nicht als gesichert.
- **Verweise im Text:** `[Q1]`, `[Q2, Q4]` oder `[Q1–Q3]` in den Analysefeldern und im Bewertungstext. Das Quellenverzeichnis steht nicht mehr in „Lage & Ereignis“.
- Die App prüft automatisch: zitiert, aber nicht verzeichnet · verzeichnet, aber nicht zitiert · fehlende oder ungültige Kategorie · fehlendes Zugriffsdatum · doppelte Nummern · Quellenzeilen im Altformat.

---

## 6. Leerwerte und JSON

| Feld | Leerwert | Hinweis |
|---|---|---|
| `sofort.lagenradar.d1` … `d8` | `null` | nie `0`, nie Zeichenkette, nie „U“ |
| `sofort.beurteilung`, `sofort.tendenz` | `""` | Option „keine Angabe“ |
| Textfelder, Datumsfelder | `""` | Datum als `JJJJ-MM-TT`, Meldezeitpunkt als `JJJJ-MM-TTThh:mm` |

Struktur und Werte prüft das JSON-Schema der Meldung (Datei `meldung.schema.json`).

---

## 7. Kurzbeispiele zur Abgrenzung (fiktiv)

| Situation | Kodierung | Begründung |
|---|---|---|
| Frühwarnung Weltraumwetter, kein Ereignis in Deutschland | D1 offen, D2 offen, D3 strukturell nur bei belegter Fachaufgabe, sonst offen | kein Wirkungsraum, keine Grundgesamtheit (D2-Bedingung b nicht erfüllt) |
| Drei bestätigte Erkrankte einer meldepflichtigen Krankheit in einem Kreis | D2 = 0 | belegte Kleinzahl (Bedingung a) |
| Meldepflichtige Krankheit, Surveillance meldet für Deutschland keine Fälle | D2 = 0 | belegter Nullbefund (Bedingung b) |
| Stromausfall, 12.000 Anschlüsse ohne Versorgung, kein Umrechnungsfaktor belegt | D2 offen | Anschlüsse ≠ Personen |
| Landesweit zusammengezogene Kräfte im Einsatz, Hilfe aus Nachbarstaat nur zugesagt | D4 = 4 | Zusage zählt nicht; maßgeblich ist die Herkunft der eingesetzten Kräfte |
| Netzbetreiber nennt widersprüchliche Wiederversorgungszeiten, Land meldet verzögert | D7 = 2 oder 3 nach Belegen | Informationslage der Befassung eingeschränkt |
| Mobilfunk im Schadensgebiet ausgefallen, Lagezentrum gut informiert | D7 niedrig, D6 erfasst TK-Kopplung | Bevölkerungskommunikation gehört zu D6 und Text |
| Sturmflut erwartet; Stadt gibt vor dem Scheitel Sandsäcke aus, Medien berichten darüber | D3 = 1 | Vorsorge vor dem Akutereignis ist beobachtbare Zurechnung (Kommune) |
| Wasserstandsvorhersagen zweier Dienste weichen deutlich voneinander ab | D7 = 1 | widersprüchliche Vorhersagen; bei übereinstimmender Vorhersage D7 = 0 |

---

## 8. Pflege

Änderungen an Stufentexten, Achsenregeln oder Quellenkategorien werden in Kodierleitfaden, Darstellungsdatei und Arbeitsanweisung gemeinsam fortgeschrieben, damit Mensch und KI nach derselben Fassung kodieren. Die App prüft beim Import eines Profils, ob die Stufentexte der Darstellungsdatei wortgleich im Kodierleitfaden stehen.

**Änderungsprotokoll:**

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 17.10.2026 | Beispielfassung, abgeleitet aus der Arbeitsfassung v0.4 |
| 1.0.1 | 17.10.2026 | Autorenname im Zitat des Lagenradars korrigiert |
| 1.1 | 17.10.2026 | D3: berichtete Vorsorge vor dem Akutereignis als Zurechnung (Ebene der vorsorgenden Stelle); D7: widersprüchliche Vorhersagen = 1, eindeutige Lage = 0; zwei Kurzbeispiele |

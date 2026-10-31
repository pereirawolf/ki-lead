# Kodierleitfaden Lagebild Justiz – Funktionen, Status, Bewertung und Quellen

Erprobungsentwurf · Fassung 0.1.0 vom 31.10.2026 · gilt für das Schema `Lagebild-Justiz-Meldung-v1` und die Darstellungsdatei des Profils · abgestimmt auf Teil A, Fassung 0.1.0

Bei Widersprüchen gilt diese Rangfolge der Regelquellen: Schema und Darstellungsdatei, dieser Kodierleitfaden, Teil A, Arbeitsanweisungen. Thüringer Angaben sind als [TH] gekennzeichnete Beispiele; der Kern gilt länderübergreifend.

## 1. Grundregeln

1. **Funktion vor Ereignis.** Kodiert wird, welche Justizleistung für wen wie lange nicht gesichert ist. Die Ursache ist eine Ressource oder eine Abhängigkeit (Abschnitt 6), keine eigene Kategorie der Bewertung.
2. **Offen statt geschätzt.** Unbelegte Angaben bleiben leer (`""`) oder `null`. Es gibt keinen Ersatzcode und keine Vorsichtswahl.
3. **„gesichert“ ist eine Aussage.** Der Status „gesichert“ braucht eine positive Feststellung mit Quelle und Stand. Fehlende Hinweise auf eine Störung sind kein Beleg.
4. **Vier Merkmale getrennt.** Beurteilung, Dringlichkeit, Tendenz und Erkenntnissicherheit werden je für sich begründet. Keines wird aus einem anderen abgeleitet. „kritisch“ mit Erkenntnissicherheit „vorläufig“ ist zulässig.
5. **Kein Gesamtscore, kein Mittelwert.** Der schwerste belegte Einzelbefund bleibt sichtbar (Teil A, A.7 Nr. 3).
6. **Prognosen heben den Ist-Status nicht an.** Eine drohende Unterbrechung wirkt über die Dringlichkeit und den Kennsatz „Neubewertung bei:“, nicht über die Beurteilung des gegenwärtigen Zustands.
7. **Keine Personen, keine Einzelverfahren, keine Entscheidungsinhalte** (Teil A, A.1 Nr. 2 und A.2).

## 2. Funktionskatalog

Feld `funktionen` (alle betroffenen Funktionen) und Feld `primaerfunktion` (genau eine). Ein Befund hat genau eine primäre Funktion; die übrigen Funktionen sind Verweise. Eilrechtsschutz (F1) ist nicht dasselbe wie Bereitschaftsdienst (F2): Eilsachen gibt es auch während der regulären Dienstzeit.

Zeitanker sind **normativ**, wenn eine Norm oder tragende Rechtsprechung sie setzt, sonst **Vorschlag**. Vorschläge sind keine Mindestniveaus. Rechtsstand 31.10.2026; der Wortlaut der genannten Normen ist vor der fachlichen Abnahme am amtlichen Text zu prüfen (README).

| Funktion | Leistung, für wen | Zeithorizont | Zeitanker |
|---|---|---|---|
| F1 Rechtsschutz und Eilrechtsschutz | Zugang zum Gericht, Annahme von Eingängen, Bearbeitbarkeit von Eil- und Hauptsacheverfahren für Rechtsuchende in allen Gerichtsbarkeiten | Eilsachen Stunden bis Tage; Hauptsache Monate | normativ: Art. 19 Abs. 4 GG; Ersatzeinreichung bei technischer Störung nach der jeweiligen Verfahrensordnung (z. B. § 130d ZPO); überlange Verfahrensdauer § 198 GVG. Vorschlag: Eilsachen innerhalb von Tagen |
| F2 Richterlicher Bereitschaftsdienst | Erreichbarkeit und Arbeitsfähigkeit für unaufschiebbare richterliche Handlungen (Freiheitsentziehung, Durchsuchung, Fixierung) | Minuten bis Stunden | normativ: Art. 104 Abs. 2 und 3 GG; Erreichbarkeit jedenfalls 6 bis 21 Uhr nach der Rechtsprechung des Bundesverfassungsgerichts; Organisation nach § 22c GVG und Landesrecht |
| F3 Zeitkritische Strafverfolgung und Haftsachen | Vorführung, Haftbefehl, Haftprüfung, Aktenzugang, Beschleunigung in Haftsachen | Stunden bis Monate | normativ: Art. 104 GG; Haftfortdauer über sechs Monate nach § 121 StPO nur unter engen Voraussetzungen |
| F4 Sicherer und menschenwürdiger Vollzug | Unterbringung, Versorgung, Gesundheitsfürsorge, Sicherheit, Aufschluss, Behandlung, Transporte und rechtzeitige Entlassung | durchgehend | normativ: Art. 1 Abs. 1 GG und die Vollzugsgesetze der Länder; Vorschlag: keine Unterbrechung der Versorgung |
| F5 Register und sonstige Rechtspflege | Grundbuch, Handelsregister, Nachlass, Betreuung, Mahnverfahren und weitere Rechtspflegeleistungen für Bevölkerung und Wirtschaft | eilige Teilleistungen Stunden, sonst Tage bis Wochen | kein allgemeiner Anker; Vorschlag nach Teilleistung. Rechtspflegerinnen und Rechtspfleger sind sachlich unabhängig; das Lagebild steuert ihre Bearbeitung nicht |
| F6 Vollstreckung | Zivilvollstreckung (Gerichtsvollzieherdienst, Vollstreckungsgericht) und Strafvollstreckung | Tage bis Wochen | Vorschlag: Wochen; Verjährungs- und Vollstreckungsfristen nach Fachrecht |
| F7 Ambulante soziale Dienste | Bewährungshilfe, Führungsaufsicht, Gerichtshilfe und Übergänge; keine individuellen Risikoprofile | kritische Kontakte Stunden bis Tage, sonst Wochen | Vorschlag. [TH] Die Sozialen Dienste der Justiz sind beim Oberlandesgericht organisiert |
| F8 Ausbildung und Nachwuchssicherung | Theorie, Praxis und Prüfungen für Rechtspflege, Vollzug, Gerichtsvollzieherdienst, Justizfachwirte und Referendariat; Nachbesetzung | Wochen bis Jahre | Vorschlag. [TH] Die Theorie des Rechtspflegestudiums findet außerhalb des Landes statt; Abhängigkeit von Einrichtungen anderer Länder |
| Sonstiges | Auffangwert, wenn keine Funktion passt | – | – |

**Abgrenzung.** Vollstreckung (F6) und Vollzug (F4) werden nicht doppelt gezählt: Wird eine Strafe nicht angetreten, weil Haftplätze fehlen, ist F6 primär und F4 Verweis. Maßregelvollzug und Abschiebungshaft sind Schnittstellen (Teil A, A.1 Nr. 6); ein Engpass dort wird bei der betroffenen Justizfunktion kodiert, etwa bei F3.

## 3. Funktionsstatus (Funktionslage)

Die Funktionslage ist eine Matrix aus Funktion × Bereich mit Status, Erkenntnissicherheit und Stand. Bereich ist ein Bezirk, eine Gerichtsbarkeit, eine Institution oder „landesweit“.

| Status | Bedeutung |
|---|---|
| gesichert | im definierten Umfang und Zeitraum nach positiver Feststellung mit Quelle und Stand erbracht |
| eingeschränkt | begrenzte Einschränkung; zeitkritische Leistungen sind nachweislich gesichert, etwa über einen belegten Ersatzweg |
| erheblich eingeschränkt | wesentliche Leistungsteile sind nicht oder nur unzureichend verfügbar; zeitkritische Leistungen gelingen nur mit Verzug oder unsicherem Ersatz, der Zeitanker wird noch gehalten |
| kritisch | eine zeitkritische oder grundrechtlich wesentliche Leistung ist innerhalb ihres Zeitankers nachweislich nicht gesichert oder wurde verfehlt; ein Vollausfall der ganzen Institution ist nicht nötig |

**Nichtwerte.** Keiner dieser Werte bedeutet „gesichert“:

| Nichtwert | Bezug | Wer setzt ihn |
|---|---|---|
| nicht betroffen | eine bestimmte Störung berührt die Funktion in diesem Bereich nachweislich nicht | meldende Stelle |
| nicht zuständig | die Funktion gehört nicht zu den Aufgaben der meldenden Stelle | meldende Stelle |
| unbekannt | es liegt keine Erkenntnis vor | meldende Stelle |
| nicht gemeldet | eine erwartete Meldung ist bis zur Frist nicht eingegangen | nur die zusammenführende Stelle |

Eine **Fehlanzeige** bestätigt nur: Im genannten Umfang und Zeitraum wurde nach dem vereinbarten Prüfverfahren keine meldepflichtige Beeinträchtigung festgestellt. Sie führt die geprüften Funktionen mit „gesichert“ und Quelle oder mit „nicht zuständig“.

## 4. Beurteilung, Dringlichkeit, Tendenz und Erkenntnissicherheit

Diese vier Merkmale gelten je Sachverhalt (Feld `bewertung`).

**Beurteilung** (Auswirkung der Beeinträchtigung auf die primäre Funktion, aufsteigend):

- **geringfügig:** Die Leistung wird im Regelumfang erbracht. Es gibt Einschränkungen, aber kein Fristrisiko.
- **erheblich:** Priorisierte Leistungen gelingen nur mit Ersatzverfahren, Verlagerung oder Verzug. Der Zeitanker wird noch gehalten.
- **kritisch:** Eine priorisierte Leistung ist innerhalb ihres Zeitankers nicht gesichert oder wurde verfehlt.
- leer („keine Angabe“): keine belastbare Grundlage für eine Beurteilung.

**Dringlichkeit** (spätester Zeitpunkt, bis zu dem die Verwaltung handeln oder entscheiden muss): sofort, binnen 24 Stunden, binnen 72 Stunden, mittelfristig (Wochen), langfristig (Monate und Jahre). Die Dringlichkeit stützt sich auf Zeitanker, Entscheidungstermine oder belegte Prognosen. Eine geringfügige Beeinträchtigung kann dringlich sein, etwa wenn über einen Ausbildungsbeginn vor der Haushaltsaufstellung entschieden werden muss.

**Tendenz** mit Bezugsraum und Zeitfenster: Entspannung, Stabilisierung, Verschärfung, nicht bestimmbar. Fehlende neue Erkenntnisse sind kein Beleg für Stabilisierung.

**Erkenntnissicherheit:**

- bestätigt: durch eine zuständige Primärquelle mit aktuellem Stand belegt;
- vorläufig: erste Angaben, noch nicht bestätigt, oder nur Prognose;
- widersprüchlich: Quellen widersprechen sich, der Widerspruch ist ungelöst;
- unzureichend: zu wenig Angaben für eine belastbare Aussage.

Quellenkategorie und Erkenntnissicherheit sind nicht dasselbe: Eine amtliche Quelle kann vorläufig sein.

**Begründungsmuster im Bewertungstext:** „Kernaussage: …“, dann „Beurteilung „…“: …“, „Dringlichkeit „…“: …“, „Tendenz „…“: …“, „Erkenntnissicherheit „…“: …“, danach die Kennsätze je in eigener Zeile.

## 5. Quellenkategorien A/B/K/W/V/M/P

| Kategorie | Bedeutung |
|---|---|
| A | amtlich: Justizverwaltung, Gerichte, Staatsanwaltschaften, Vollzug, amtliche Statistik, Parlamentsdrucksachen, Rechnungshöfe, Normtexte und tragende Rechtsprechung |
| B | Betreiber: IT-Dienstleister, E-Akte-Verbünde, Betreiber von beA, beN und Mein Justizpostfach, Versorger; nur zu eigenen Systemen |
| K | Kammern: Rechtsanwalts- und Notarkammern (Selbstverwaltung) |
| W | wissenschaftlich: Forschung, Methodik, CEPEJ und andere internationale Gremien |
| V | Verbände: Richter-, Staatsanwalts- und Bedienstetenverbände, Verbandsumfragen |
| M | Medien |
| P | privat: sonstige private Angaben |

**Rangfolge bei widersprüchlichen Tatsachen:** A vor B vor K vor W vor V vor M vor P. Innerhalb derselben Kategorie geht die zuständige, jüngere Primärangabe vor. Zu Betriebszuständen eigener Systeme ist B oft näher am Sachverhalt als eine allgemeine Behördenmitteilung. Der Rang entscheidet dann nur, wenn beide dieselbe Tatsache mit gleichem Stand beschreiben.

**Normative Aussagen** (Fristen, Zuständigkeiten, Pflichten) stützen sich nur auf Normtext oder tragende Rechtsprechung (A). Die Rangfolge der Tatsachenquellen entscheidet keinen Normkonflikt und keine Bewertung.

**Amtlich heißt nicht bestätigt.** Eine Eigenangabe einer Behörde bleibt Eigenangabe; ihr Berichtszweck wird mitgedacht. Verbandsumfragen (V) und Presse (M) sind Hinweise und Tendenzbelege; für Bestandszahlen hat die amtliche Statistik Vorrang.

## 6. Ressourcen, Zeitstempel, Betriebsphase und Reichweite

**Ressourcen** (Feld `ressourcen`, Mehrfachauswahl): Personal; Gebäude und Liegenschaften; Energie; Kommunikation (Telefon, Fax, E-Mail); Justiz-IT und elektronischer Rechtsverkehr; Akten und Daten; Sicherheit; Gefangenentransporte; externe Dienste und Schnittstellen (z. B. Rechenzentrum, Netz, beA/beN, E-Akte-Verbund, medizinische Versorgung, Dolmetschdienste, Post, Ausbildungseinrichtungen anderer Länder, Maßregelvollzug).

**Zeitstempel:**

- `eintritt`: Beginn der Beeinträchtigung;
- `festgestellt`: Zeitpunkt der Feststellung;
- `notfall_ausgerufen`: nur wenn eine Notfallorganisation ausgerufen wurde. Eine Wiederanlaufzeit nach BCM-Planung zählt in der Regel ab diesem Zeitpunkt; sie wird nicht mit der Dauer seit `eintritt` verglichen.
- Jede Zahl trägt zusätzlich ihren eigenen Stand.

**Betriebsphase:**

- Normalbetrieb;
- Notbetrieb: Ersatzverfahren mit eingeschränktem Leistungsumfang;
- Wiederanlauf;
- Störbetrieb: Nacharbeit und Rückstände nach dem Ende des eigentlichen Ausfalls.

Ein akuter Ausfall läuft vom Notbetrieb über den Wiederanlauf in den Störbetrieb. Eine schleichende Beeinträchtigung entsteht im Normalbetrieb und zeigt sich über Tendenz und Belegwerte.

**Zeitliche Reichweite:** Stunden, Tage, Wochen, Monate, Jahre: wie lange die Beeinträchtigung einschließlich Folgerückständen voraussichtlich wirkt.

**Ersatzlösungen** gelten nur dann als entlastend, wenn ihre Nutzbarkeit belegt ist. Ein Ersatzraum hilft nur, wenn Personal, Akten, sichere Kommunikation und notwendige Verfahren dort zusammenkommen. Ein vorhandener Plan ist noch keine verfügbare Kapazität.

## 7. Belegwerte und Indikatorsteckbriefe

Belegwerte (Feld `indikatoren`) sind optional. Jeder trägt Wert, Einheit, **Wertart**, Stand und Quelle. Die Wertart ist eine der folgenden:

- beobachtet: gemessener oder gezählter Ist-Wert;
- BCM-Planwert: festgelegter Wert aus Notfall- oder Kontinuitätsplanung, mit Referenz und Freigabestand im Quellenverzeichnis;
- Prognose: mit Annahmen, Bandbreite und Zeitpunkt;
- normative Anforderung: nur mit Norm oder tragender Rechtsprechung.

Alle Schwellen in der folgenden Tabelle sind **Vorschläge** für die Erprobung, keine Vorgaben.

| Nr. | Indikator | Definition und Einheit | Datenquelle | Bewertungsvorschlag |
|---|---|---|---|---|
| I1 | Erreichbare Eilzugänge (F1) | getestete, funktionsfähige Zugangswege für Eilsachen je Institution; Anzahl | Geschäftsstelle, IT-Stelle | einziger geeigneter Zugang gescheitert → sofortiger Handlungsanlass |
| I2 | ERV-Funktionskette (F1) | Zustand von Versand, Annahme, Abruf, Zuordnung und Bereitstellung getrennt; Beginn und Dauer in Minuten | Betreiber (B) und lokale Bestätigung (A) | „Postfach erreichbar“ heißt nicht „bearbeitbar“; jede Stufe getrennt bewerten |
| I3 | Abdeckung des Bereitschaftsdienstes (F2) | Bereitschaftsbezirke mit besetztem und arbeitsfähigem Dienst im Zeitfenster; unbesetzte Bezirke | Präsidien, Gerichtsverwaltungen | ein unbesetzter Bezirk im Zeitfenster → kritisch |
| I4 | Bestandsentwicklung Staatsanwaltschaften (F3) | offene Ermittlungsverfahren zum Stichtag gegenüber Vorjahr; % | Geschäftsstatistik, Destatis (jährlich) | Anstieg und Erledigungsquote unter 100 % → Tendenz Verschärfung prüfen |
| I5 | Haftentlassungen wegen Verfahrensverzögerung (F3) | Fälle je Quartal | Haftprüfungsstatistik, Landtagsantworten | jeder Fall → Anlassmeldung; kein Urteil über eine Institution |
| I6 | Belegungsquote (F4) | Belegung durch Belegungsfähigkeit je Anstalt und Vollzugsart, nie nur als Landesmittel; % | Vollzugsverwaltung | über 100 % → mindestens erheblich (orientiert an SPACE I, keine Norm) |
| I7 | Personalbedingt eingeschränkter Aufschluss (F4) | Tage mit verlängertem Einschluss aus Personalgründen je Anstalt und Monat | Anstaltsleitung | jeder Tag → mindestens geringfügig |
| I8 | Rückstandsstruktur (F5, F6) | Bestand einer abgegrenzten Teilleistung nach Altersklassen; Zahl, Zu- und Abgänge | Geschäftsstatistik | Altersklassen sind Beobachtungsklassen, keine Rechtsfristen |
| I9 | Ausbildungsdurchführbarkeit (F8) | durchführbare Pflichtabschnitte und Prüfungen gegenüber Ausbildungsplan; Anzahl, erwartete Verzögerung | Ausbildungsleitung, externe Einrichtung | Prüfungsausfall → Dringlichkeit prüfen |
| I10 | Nutzbare Ersatzlösung (alle) | nachgewiesene Fähigkeit einer freigegebenen Ersatzlösung, die Funktion zu erbringen; Umfang, getesteter Zeitraum | BCM- oder Übungsnachweis und aktueller Stand | ohne Nachweis keine Entlastung |

Kennzahlen wie Erledigungsquote (Erledigungen durch Eingänge) oder rechnerische Verfahrensdauer (Bestand durch Erledigungen mal Tage) sind Kontext für Tendenzen, keine Statusgrundlage und keine Leistungsbewertung einzelner Personen.

## 8. Zeitstrahl, Sachverhaltskennung und Bezug

### 8.1 Sachverhaltskennung (`kennung`)

Die App vergibt die Kennung in der Form `Präfix-JJJJMMTT-XXXX`, z. B. `DE-TH-20261013-K7QM`. Bei der Fortschreibung bleibt sie gleich. In KI-Entwürfen stehen für neue Sachverhalte Platzhalter `NEU-1`, `NEU-2`; die App ersetzt sie.

### 8.2 Bezug (`bezug`)

Kennungen der Sachverhalte aus Eingangs- oder Vormeldungen, aus denen ein Sachverhalt hervorgeht (Verdichtung, Teilung). Ein verdichteter Sachverhalt nennt alle Eingangssachverhalte gleicher Ursache.

### 8.3 Zeitstrahl (`zeitstrahl`)

Je Zeile ein eingetretenes, belegtes Ereignis bis zum Meldezeitpunkt: `[Zn] JJJJ-MM-TT[Thh:mm] · Kennung · Typ – Kurztext [Qn]`. Die Typen sind:

- Ereignis;
- Störung: Beginn oder Ausweitung einer Beeinträchtigung;
- Maßnahme;
- Wendepunkt;
- Wiederherstellung;
- Bewertung: setzt die App bei Wechsel von Beurteilung oder Tendenz;
- Berichtigung: „zu [Zn]: …“.

Prognosen gehören nicht in den Zeitstrahl. Frühere Zeilen bleiben bei der Fortschreibung unverändert.

## 9. Leerwerte und JSON

- Auswahlfelder: leer `""` = keine Angabe. Zahlen in Belegwerten: `null`, wenn unbekannt.
- `funktionslage`: je Funktion und Bereich höchstens ein Element. Fehlt eine Funktion, gilt sie als nicht berichtet, nicht als gesichert.
- `meldeabdeckung` nur bei zusammenführenden Stellen; sonst weglassen.
- `primaerfunktion` muss in `funktionen` enthalten sein.
- Freitexte enthalten keine Personennamen, Aktenzeichen oder Anschriften.

## 10. Kurzbeispiele zur Abgrenzung (fiktiv)

1. Das EGVP nimmt seit 08:00 Uhr keine Nachrichten an, Fax und Post funktionieren, Eilsachen gehen per Fax ein (belegt). F1 ist „eingeschränkt“, nicht „kritisch“, denn der Zeitanker für Eilsachen wird über einen belegten Ersatzweg gehalten. Beurteilung „erheblich“, wenn auch die Bearbeitung in der E-Akte ausfällt.
2. Für einen Bereitschaftsbezirk ist am Samstag von 6 bis 21 Uhr niemand erreichbar (belegt). F2 ist „kritisch“, Dringlichkeit „sofort“.
3. Im Gerichtsvollzieherdienst steigt die Zahl der Bezirke in Vertretung, die Ausbildung ruht, die Leistung wird noch erbracht. F6: Beurteilung „geringfügig“, Tendenz „Verschärfung“, Dringlichkeit „mittelfristig“.
4. Eine Anstalt meldet für den nächsten Monat voraussichtlich zu wenig Personal (Prognose). Der Ist-Status bleibt wie belegt. Die Prognose steht als Belegwert mit Wertart „Prognose“ und im Kennsatz „Neubewertung bei:“.
5. Von acht erwarteten Stellen haben sechs gemeldet. Für die beiden fehlenden Stellen trägt die Funktionslage „nicht gemeldet“. Die Kernaussage nennt die Meldeabdeckung „6 von 8“.

## 11. Pflege

Der Herausgeber pflegt den Kodierleitfaden. Änderungen an Funktionen, Status, Skalen oder Zeitankern brauchen eine neue Fassung, einen Eintrag im `CHANGELOG.md` des Profils und Vergleichstests mit früheren Meldungen. Vor einer Fassung 1.0 sind die genannten Normen und Entscheidungen am amtlichen Text zu prüfen und die Bewertungsvorschläge fachlich abzunehmen.

### Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 0.1.0 | 31.10.2026 | Erprobungsentwurf |

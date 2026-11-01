<a id="teil-a"></a>

## Teil A – Gemeinsame Regeln Lagebild Justiz

**Gültigkeitsstand.** Erprobungsentwurf, Fassung 0.1.0 vom 31.10.2026. Gültig ist nur das folgende Paket. Die Regeln sind fachlich noch nicht abgenommen; sie dienen der Erprobung mit fiktiven oder offen zugänglichen Daten.

| Bestandteil | Fassung | Stand | Pflegeverantwortlich |
|---|---|---|---|
| Teil A – Gemeinsame Regeln (diese Datei) | 0.1.0 | 31.10.2026 | Herausgeber des Profils |
| Kodierleitfaden Lagebild Justiz | 0.1.0 | 31.10.2026 | Herausgeber des Profils |
| Arbeitsanweisungen Erfassung, Verdichtung, Kurzfassung | je 0.1.0 | 31.10.2026 | Herausgeber des Profils |
| Meldungsschema | `Lagebild-Justiz-Meldung-v1` | 31.10.2026 | Herausgeber des Profils |

Dieses Profil kennt keine ereignisbezogenen SOPs. Wo die App von „Ereignisart“ und „SOP“ spricht, gelten die Begriffsbestimmungen in A.1 Nr. 3.

### A.1 Anwendung

1. **Gegenstand.** Das Lagebild Justiz stellt dar, ob die Justiz eines Landes ihre Leistungen für Rechtsuchende, Betroffene, Gefangene und die Öffentlichkeit innerhalb der jeweils maßgeblichen Zeit erbringen kann, welche Voraussetzungen fehlen oder beeinträchtigt sind und welche Entscheidungen der Verwaltung daraus folgen. Gegenstand sind **Voraussetzungen und Beeinträchtigungen der Aufgabenerfüllung**: Personal, Gebäude, Energie, Kommunikation, Justiz-IT und elektronischer Rechtsverkehr, Akten und Daten, Sicherheit, Gefangenentransporte und externe Dienste.
2. **Ausgeschlossen** sind:
   - Inhalte richterlicher und rechtspflegerischer Entscheidungen, ihre Richtigkeit und Prognosen zum Ausgang von Verfahren;
   - einzelne Verfahren, Terminierungen, Beteiligte und Akteninhalte;
   - Leistung, Erledigungszahlen oder Verhalten einzelner Richterinnen, Richter, Rechtspflegerinnen, Rechtspfleger, Staatsanwältinnen, Staatsanwälte und Bediensteter;
   - Daten über Gefangene, Untergebrachte und Betreute als Einzelpersonen;
   - Sicherheitskonzepte, Schwachstellen, Lagepläne, Transportdaten und andere sicherheitskritische Betriebsdaten (A.9).
3. **Begriffe der App.** Die App fragt in Stufe S1 nach „Ereignisarten“ und „SOPs“. In diesem Profil gilt:
   - „Ereignisart“ ist die **Funktion** aus dem Funktionskatalog F1–F8 (Feld `funktionen`; Kodierleitfaden Abschnitt 2). „Sonstiges“ nur, wenn keine Funktion passt.
   - „SOP“ oder „Prüfbaustein“ meint einen Regelbaustein dieses Profils. Die Fassung 0.1.0 enthält nur diesen Teil A.
   - Eine „Mischlage“ ist eine Beeinträchtigung, die mehrere Funktionen trifft. Sie bleibt **ein** Sachverhalt mit einer primären Funktion und weiteren betroffenen Funktionen.
4. **Zuschnitt in S1.** Ein Sachverhalt ist eine Beeinträchtigung mit gemeinsamer Ursache oder gemeinsamer Wirkungskette in einem Bereich. Bereich ist ein Bezirk, eine Gerichtsbarkeit, eine Institution oder „landesweit“. Der Betrachtungshorizont richtet sich nach dem Berichtsmodus:
   - Funktionslagebild: Berichtszeitraum und die folgenden vier Wochen; für Personal und Nachwuchs bis 24 Monate.
   - Krisenlagebild: die nächsten Stunden, 24 und 72 Stunden sowie die erwartete Dauer der Beeinträchtigung.
5. **Rolle der meldenden Stelle.** Die meldende Stelle ergibt sich aus dem Profil bzw. aus der Meldung. Die Lagestelle der Justizverwaltung führt Meldungen zusammen; sie hat keine Befugnis gegenüber Spruchkörpern, keine Dienstaufsicht und keine Weisungsbefugnis in Einzelsachen. Gilt die Meldung einer anderen Stelle, ergibt sich ihre Rolle aus dem Feld „Art der meldenden Stelle“. Kammern und IT-Betreiber melden nur freiwillig oder nach Vereinbarung. Verfassungsgerichte stehen außerhalb des Geschäftsbereichs des Justizressorts und melden allenfalls freiwillig.
6. **Schnittstellen.** Maßregelvollzug, Abschiebungshaft, Rechtsanwaltschaft und Notariat, Bundesgerichte im Land sowie externe Betreiber sind **Schnittstellen**. Sie erscheinen als Abhängigkeit oder Ursache, wenn sie eine Justizfunktion beeinträchtigen, etwa bei fehlender Aufnahmemöglichkeit oder gestörtem Postfach. Sie sind kein eigener Beobachtungsgegenstand. Ressortzuständigkeit bedeutet nicht Funktionszugehörigkeit: Die Abschiebungshaft kann im Justizressort liegen und ist trotzdem kein Justizvollzug.
7. **Keine Meldepflicht unterstellt.** Systemrelevanz, Ressortzuständigkeit, Aufsicht und tatsächlicher Datenzugang sind verschiedene Dinge. Eine Meldung entsteht nur dort, wo ein Erlass, eine Vereinbarung oder eine freiwillige Beteiligung sie trägt. Fehlt eine Meldung, ist das eine Datenlücke, kein Befund.

### A.2 Leitplanken

1. **Beobachten, nicht steuern.** Das Lagebild bewertet Rahmenbedingungen, nie richterliche oder rechtspflegerische Sachentscheidungen. Hinweise richten sich an Verwaltung, Präsidien und Behördenleitungen und betreffen nur Rahmenbedingungen wie Personal, Räume, Technik oder Organisation. Das Lagebild verfügt keine Geschäftsverteilung und gibt keine Empfehlungen zur Bearbeitung einzelner Sachen.
2. **Keine Personen.** Werte für Gruppen unter zehn Personen werden nicht ausgewiesen. Krankenstand erscheint nur als Quote einer Einheit von mindestens zehn Personen, nie mit Namen, Diagnosen oder Gründen.
3. **Keine Einzelverfahren.** Zählwerte (etwa Haftsachen je Bezirk) sind zulässig, Angaben zu einzelnen Verfahren nicht. Einzelsachberichte der Staatsanwaltschaften fließen nicht ein.
4. **Integrität.** Eine Positivaussage („gesichert“) braucht Quelle und Stand. Ein unbelegtes „gesichert“ ist ein Fehler, weil ein falsch positives Lagebild Schaden anrichten kann.
5. **KI-Ausgaben sind Entwürfe.** Freigegeben wird durch eine Person. Ein KI-Entwurf schlägt den Wechsel zwischen Funktions- und Krisenlagebild höchstens vor; entscheiden muss eine Person.

### A.3 Befundnachweis

1. Jede Tatsachenaussage trägt einen Beleg [Qn]. Die Quellenkategorie bestimmt der Kodierleitfaden (Abschnitt 5).
2. **Wertarten trennen.** Beobachtete Werte, BCM-Planwerte, Prognosen und normative Anforderungen werden getrennt geführt (Kodierleitfaden Abschnitt 7). Ein Planwert ist keine Beobachtung, eine Prognose kein Ist-Befund. Eine normative Anforderung braucht eine Norm oder tragende Rechtsprechung; ohne Norm bleibt sie leer. Mindestniveaus werden nicht erfunden.
3. **Zeitbezug.** Jede Zahl trägt ihren Stand. Getrennt bleiben: Beginn der Beeinträchtigung (`eintritt`), Feststellung (`festgestellt`), gegebenenfalls Ausrufen des Notfalls (`notfall_ausgerufen`) und Stand der Angabe. Eine Dauer seit Beginn wird nicht mit einer Wiederanlaufzeit verglichen, die ab dem Ausrufen des Notfalls zählt.
4. **Zählen.** Summen nur bei gleicher Einheit, Definition und Zeitbasis und bei überschneidungsfreien Bereichen. Dieselbe Störung aus mehreren Meldungen zählt einmal. Die Zahl der Meldungen belegt keine Verschärfung.
5. **Widersprüche.** Widersprechen sich Quellen zu einer Tatsache, entscheidet die Rangfolge der Quellenkategorien. Bleibt der Widerspruch ungelöst, stehen beide Angaben mit Quelle nebeneinander, und die Erkenntnissicherheit lautet „widersprüchlich“. Er wird weder nach Mehrheit noch allein nach Buchstabe entschieden.

### A.4 Kernaussage und Leitungsbezug

1. Jeder Sachverhalt beginnt mit einer Kernaussage: Welche Justizleistung ist für wen, seit wann und bis wann voraussichtlich nicht oder nur eingeschränkt gesichert?
2. Danach folgen Folgen, Maßnahmen mit Status und zuständiger Stelle, Entscheidungsbedarf der Verwaltung mit Adressat und Frist sowie Abhängigkeiten.
3. Für Entscheidungen genügt „IT gestört“ nicht. Zu nennen sind betroffene Leistungen, belegte Ersatzwege, verfügbare Unterstützung und zuständige Stellen. Fehlende Angaben stehen als Erkenntnislücke im Kennsatz „Erkenntnislücke:“.

### A.5 Meldetakt, Fristen und Zeitfenster (Fristgrundlage)

1. **Funktionslagebild:** Regelmeldung monatlich. Arbeitsannahme für die Erprobung ist eine Meldung bis zum 5. Arbeitstag des Folgemonats; das ist ein Vorschlag, keine Vorgabe.
2. **Krisenlagebild:** je Lagezyklus. Als Testparameter dient ein Zyklus von vier Stunden; daneben gibt es Anlassmeldungen.
3. **Anlassmeldung:** unverzüglich bei neuer oder veränderter Beeinträchtigung. Akut erforderliche Hilfe wartet nie auf einen Berichtslauf.
4. **Fristgrundlage.** Rechtsfristen und verfassungsrechtliche Zeitanker (Kodierleitfaden Abschnitt 2) sind keine frei verfügbaren BCM-Toleranzen. Fristen im Kennsatz „Handlungsrelevant bis:“ nennen Datum, Uhrzeit, Aufgabe und Adressat. Sie leiten sich aus belegten Zeitankern, aus Entscheidungsterminen der Verwaltung oder aus belegten Prognosen ab. Eine erfundene Frist ist ein Fehler. Je Frist steht eine eigene Zeile „Handlungsrelevant bis:“; bei mehreren Fristen eines Sachverhalts steht die früheste zuerst.
5. **Zeitfenster der Darstellung:** Berichtszeitraum der Meldung. Ältere Angaben bleiben mit ihrem Stand erkennbar.

### A.6 Quellenregister

1. Das Quellenverzeichnis führt jede Quelle einmal, nummeriert in der Reihenfolge der ersten Nennung, bei einer Fortschreibung jedoch mit stabilen Nummern (die Einträge der eigenen Vormeldung behalten ihre Nummer, neue Quellen erhalten die nächste freie Nummer), im Format „[Qn] Kategorie – Herausgeber (Datum): Titel. Online abrufbar unter: URL [Zugriff: TT.MM.JJJJ]“.
2. Interne Unterlagen stehen als „Dokument ohne URL“ mit Herausgeber und Stand. Personen- und Verfahrensdaten gehören nicht ins Verzeichnis.
3. Nicht ausgewertete Quellen werden als „nicht ausgewertet“ markiert. Bezahlschranken werden mit „(Paywall)“ gekennzeichnet.

### A.7 Verdichtung

1. **Gliederung nach Sachverhalten, nicht nach Stellen.** Beschreiben mehrere Meldungen dieselbe Ursache, etwa eine Netzstörung beim Landes-IT-Dienstleister mit Folgen in mehreren Bezirken, ist das **ein** Sachverhalt. Unterschiedliche Ursachen bleiben getrennte Sachverhalte, auch wenn dieselbe Funktion betroffen ist.
2. **Zahl der Sachverhalte.** Die Richtzahl der App von „einer bis drei“ Sachverhalten gilt hier nur für die Bündelung gleicher Ursachen. Schleichende Einschränkungen verschiedener Funktionen mit verschiedenen Ursachen werden nicht zusammengezogen, um eine Zahl einzuhalten; jede Trennung wird begründet.
3. **Worst Case statt Mittelwert.** Die Landesmatrix nennt je Funktion den schwersten belegten Status und die Zahl der betroffenen Bereiche. Ein einzelner kritischer Bereich macht nicht das ganze Land kritisch. Viele unauffällige Bereiche verdecken ihn aber auch nicht. Mittelwert und Gesamtscore sind ausgeschlossen.
4. **Meldeabdeckung.** Die zusammenführende Stelle nennt erwartete und eingegangene Meldungen (Feld `meldeabdeckung`). Fehlende Stellen führt sie mit „nicht gemeldet“; ein alter Wert wird nicht fortgeschrieben.
5. **Abweichende Bewertungen** zwischen Institution und Ressort, zwischen Betreiber und Institution oder zwischen amtlicher und verbandlicher Sicht stehen nebeneinander, mit Kennsatz „Abweichende Bewertung:“.

#### A.7.1 Teilräume

Teilräume eines verdichteten Sachverhalts sind Bezirke, Gerichtsbarkeiten oder Institutionen. Sie bleiben in Feld `ort`, im Feld `institutionen` und in der Funktionslage getrennt auswertbar. Die Verdichtung entfernt die Bezüge Institution, Bereich, Funktion und zeitliche Reichweite nicht.

### A.8 Fortschreibung

1. Bei der Fortschreibung bleibt die Kennung eines Sachverhalts gleich. Was sich geändert hat, nennt der Kennsatz „Änderung zur Vormeldung:“. Frühere Zeilen im Zeitstrahl bleiben unverändert; ihre Quellenverweise behalten ihre Bedeutung, weil die Nummern der Vormeldung im Quellenverzeichnis stabil bleiben (A.6 Nr. 1).
2. **Datenalter.** Ist eine Angabe älter als ein Berichtsintervall, wird ihr Stand genannt und sie wird neu bewertet. Datenalter verschärft nicht automatisch und bestätigt nichts als unverändert.
3. **Prognosen** werden mit dem Eintreten oder Nichteintreten fortgeschrieben, nicht still ersetzt.

#### A.8.1 Indikatoren und Neubewertung

Neubewertungsbedingungen im Kennsatz „Neubewertung bei:“ werden bei jeder Fortschreibung geprüft und mit Ergebnis fortgeführt: eingetreten, nicht eingetreten oder nicht überprüfbar. Ohne Prüfung gelten sie als „nicht überprüfbar“.

#### A.8.2 Rückblick und Ausstieg aus dem Krisenlagebild

Das Krisenlagebild endet, wenn eine Person feststellt, dass die Funktionen wieder gesichert sind und die Folgerückstände erfasst sind. Offene Wiederherstellungsarbeiten und Rückstände (Störbetrieb) gehen in das Funktionslagebild über.

### A.9 Schutzbedarf und Datenregeln

| Stufe | Inhalt | Verarbeitung |
|---|---|---|
| 0 offen oder fiktiv | Testfälle, veröffentlichte Statistik, Parlamentsdrucksachen, Normen | einzige zulässige Stufe im Forschungsdemonstrator |
| 1 intern | aggregierte Funktions- und Kapazitätsdaten | nur im späteren Lagebetrieb, nach Entscheidung der verantwortlichen Stelle |
| 2 vertraulich | Einzelheiten zu IT-Störungen, standortbezogene Personalengpässe, Ersatzstandorte, Reichweiten | nicht mit externen KI-Diensten |
| 3 ausgeschlossen | Sicherheitskonzepte, Schwachstellen, Lagepläne, Transportdaten, Fall-, Gesundheits-, Personal-, Mandats- und Urkundendaten | nie im Lagebild |

Kleine Einheiten können trotz Aggregation Rückschlüsse auf Personen oder Verfahren erlauben (A.2 Nr. 2). Ein Schutzbedarfsvermerk im Text erzeugt keinen Zugriffsschutz.

### A.10 Abschlusscheck

- Ist jede Tatsachenaussage mit [Qn] belegt und jeder Wert mit Stand und Wertart versehen?
- Trägt jedes „gesichert“ eine positive Feststellung mit Quelle und Stand?
- Sind „unbekannt“, „nicht gemeldet“, „nicht betroffen“ und „nicht zuständig“ korrekt verwendet und nirgends als „gesichert“ gelesen?
- Sind Beurteilung, Dringlichkeit, Tendenz und Erkenntnissicherheit getrennt begründet? Hebt eine Prognose den Ist-Status nicht an?
- Ist kein Mittelwert und kein Gesamtscore gebildet, und bleibt jeder kritische Einzelbefund sichtbar?
- Enthält die Meldung keine Inhalte richterlicher Entscheidungen, keine Einzelverfahren, keine Personen und keine sicherheitskritischen Betriebsdaten?
- Nennt jede Frist Datum, Aufgabe und Adressat, und ist sie belegt?

### A.11 Pflege

Der Herausgeber pflegt diesen Teil A zusammen mit dem Kodierleitfaden und den Arbeitsanweisungen. Jede Änderung erhöht die Fassung und steht im `CHANGELOG.md` des Profils. Vor einer Fassung 1.0 sind eine fachliche Abnahme durch eine verantwortliche Stelle der Justizverwaltung und die Prüfung der Rechtsgrundlagen am amtlichen Text nötig (README, Abschnitt „Offene Punkte“).

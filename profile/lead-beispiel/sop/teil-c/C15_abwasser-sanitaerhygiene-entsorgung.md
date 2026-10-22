<a id="c15"></a>

## C15. Baustein LEAD: Abwasser, Sanitärhygiene und kritische Entsorgung

```yaml
kennung: "C15"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein unter bestehendem Dach"
lesegruppe: "Versorgung, Kommunikation und Logistik"
lageart: "Ausfall von Abwasserableitung, -transport oder -behandlung, nicht nutzbare Sanitärversorgung, kritischer Entsorgungsrückstau"
art_zuordnung: ["KRITIS-Ausfall", "Trinkwasserversorgung"]
art_hinweis: "„KRITIS-Ausfall“ bei belegtem Ausfall oder wesentlicher Einschränkung der Abwasser-, Sanitär- oder Entsorgungsfunktion (Sektor ohne eigene Dach-SOP, B12); „Trinkwasserversorgung“ nur bei tatsächlichem Trinkwasserbezug; sonst Prüfhilfe unter der Ereignisart der Ursache"
anschluss: "B10, B12; B02 bei Hochwasser, B08 bei Stromausfall; C08 bei Tierkörperbeseitigung; C09 bei Gesundheits- und Pflegeeinrichtungen; C13 Transport; C16 Unterkünfte"
zweck: "Erfassung von Entwässerungs-, Sanitär- und hygienisch relevanten Entsorgungsfolgen."
version: "1.1.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "22.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N08"
bisherige_ids: ["baustein-n08"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Drei fachliche Prüfpfade: (a) Abwasserableitung, -transport und -behandlung; (b) tatsächlich nutzbare Sanitär- und Hygieneleistung für Menschen und Einrichtungen; (c) kritische Sammlung, sichere Zwischenhaltung, Abfuhr und Behandlung von Abfällen einschließlich Tierkörperbeseitigung (C08). Eine Funktion kann ausfallen, während andere weiterlaufen: Intakte Trinkwasserabgabe belegt keine funktionierende Toilette, eine laufende Kläranlage keine örtliche Entwässerung, eine verschobene Müllabfuhr keine Gesundheitsgefahr. Relevant sind belegte Schutz- oder Versorgungsfolgen oder ein fachlich begründet drohender Ausfall mit konkretem Vorbereitungs- oder Abstimmungsbedarf (A.1 Nr. 1); nicht jedes Entsorgungsproblem ist eine Bevölkerungsschutzlage. Kontamination, Exposition und Gesundheitsrisiko nur nach zuständiger Fachbewertung und mit Aussagegrad; keine eigene hygienische, wasser- oder abfallrechtliche Freigabe. Abwassermonitoring als Surveillance-Instrument gehört zu B11 (R6), nicht hierher. Trinkwasser B10, Hochwasser B02, Stromausfall B08, medizinisch-pflegerische Folgen C09, Unterkunft C16, Transport C13.

**Befassungsanlässe:** Ausfall von Abwasserableitung, -transport oder -behandlung mit Gesundheits- bzw. Versorgungsfolgen · nicht nutzbare Sanitärversorgung in relevanten Räumen oder Einrichtungen · kritischer Entsorgungsrückstau · fachlich begründet drohender Ausfall mit konkretem Vorbereitungsbedarf.

**Zuordnung im Schema:** „KRITIS-Ausfall“ bei belegtem Ausfall oder wesentlicher Einschränkung der Abwasser-, Sanitär- oder Entsorgungsfunktion (B12); „Trinkwasserversorgung“ nur bei tatsächlichem Trinkwasserbezug; keine gesundheitliche Ereignisart allein aus einem hypothetischen Risiko.

### 2. Erfassung: Prüffragen

**Funktions- und Bedarfsprofil:** Benötigte Leistung, betroffenes Gebiet bzw. Einrichtung, Beginn und Stand, verbleibende Leistung, Ausweichmöglichkeit und Zeitfenster benennen. Abwasser: örtliche Ableitung bzw. Hebeanlage, Transport und Pumpwerk, Behandlung und Einleitung getrennt. Sanitär: nutzbare Toiletten und Waschmöglichkeiten einschließlich Zugang, Verbrauchsmitteln, Reinigung und anschließender Entsorgung. Abfall: konkret relevanter Stoffstrom, Erfassung, geeignete Zwischenhaltung, Abfuhr und bestätigte Annahme bzw. Behandlung. Eine nominelle Anlagen- oder Containerzahl belegt kein betriebenes Gesamtsystem; nur die entscheidenden Engpassglieder ausführen.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Entwässerungs-, Sanitär- oder Entsorgungsfunktion ist wie weit eingeschränkt? | Betreibermeldungen (A.3) (Abwasserbetriebe, Entsorger) | L; D1 | Leistungsgrad je Funktion angeben. |
| R2 | Welche Bevölkerungsgruppen und Einrichtungen können die Leistung nicht ersetzen? | Lagemeldungen (A.3); Gesundheitsamt | R; D2 | Besondere Bedarfe nach A.9.2. |
| R3 | Welche Einleitungen, Rückstau- oder Kontaminationsfolgen sind fachlich bestätigt? | Umwelt- und Wasserbehörden; [BBK: Sektor Wasser](https://www.bbk.bund.de/DE/Themen/Kritische-Infrastrukturen/Sektoren-Branchen/Wasser/Risiken/risiken_node.html) (Hintergrund) | R/I; D6 | Nur bestätigte Folgen; Vermutung kennzeichnen. |
| R4 | Welche Auswirkungen bestehen auf Roh- und Trinkwasser und auf die medizinisch-pflegerische Versorgung? | Gesundheitsamt; Wasserversorger (B) | R/I; D6 | Trinkwasserbezug nach B10. |
| R5 | Welche Ersatzlösungen sind tatsächlich eingerichtet und ausreichend betrieben? | Lagemeldungen (A.3) | M; D4 | Eingerichtet ≠ ausreichend betrieben. |
| R6 | Welche Wiederherstellungs- und gegebenenfalls hygienischen Freigabekriterien bestehen? | Betreibermeldungen (A.3); Gesundheitsamt; zuständige Wasser- oder Abfallbehörde | M; D5 | Technische Wiederherstellung ≠ fachliche Freigabe ≠ nutzbare Leistung; nicht jeder Pfad hat dieselbe Freigabepflicht. |

**Sanitärersatz und besondere Bedarfe:** Lagebezogen prüfen, ob die Ersatzlösung für die tatsächlich Betroffenen erreichbar, bedarfsgerecht, ausreichend betrieben und dauerhaft versorgt ist: Standort, Betreiber und Personal, Handhygiene und Betriebsstoffe, Reinigung, regelmäßige Entleerung bzw. Abfuhr und bestätigter Entsorgungsweg. Aufgestellte Einheit, betriebsbereite Kapazität, tatsächliche Nutzung und gedeckter Bedarf trennen. Pflege- und Gesundheitseinrichtungen, Gemeinschaftsunterkünfte und häusliches Umfeld nach tatsächlichem Bedarf, nicht nach Gruppenzugehörigkeit. Wasserlieferung allein behebt keine gestörte Abwasserentsorgung. Keine eigenen Bemessungszahlen, Hygieneprotokolle oder Entleerungsfristen.

**Einleitung, Kontakt und Folgewirkung:** Störung bzw. Überlastung, tatsächlich ausgetretenes oder eingeleitetes Material, Umweltbelastung, mögliche Exposition und fachlich bewertete Gesundheits- oder Versorgungsfolge getrennt führen. Ein bestätigter Einleitungsbefund belegt weder verunreinigtes Trinkwasser noch Erkrankungen. Eintragsweg, betroffenes Gewässer oder Objekt, Zeit- und Raumbezug, zuständige Bewertung und wirksame Schutzmaßnahme nur soweit belegt. Roh- und Trinkwasserbezug über konkrete Funktion und Betreiber- bzw. Fachangabe prüfen; ein fehlender Nachweis ist keine Entwarnung. Keine Infektionswahrscheinlichkeit, Konzentration oder Nutzungsempfehlung selbst ableiten.

**Kritischer Entsorgungspfad:** Relevanten Stoffstrom und Engpass konkret feststellen, z. B. hygienisch bedeutsame Abfälle aus Gesundheit und Pflege, verdorbene Lebensmittel, Hochwasserabfälle, Tierkörper oder fachlich eingestufte gefährliche Stoffe. Nicht alle Abfälle nach Hochwasser oder aus einer Klinik pauschal als gefährlich oder infektiös bezeichnen. Einstufung, geeignete Sammlung und Zwischenhaltung, zulässiger Transport, tatsächlich aufnahmefähige Behandlung und deren Kapazität nach zuständiger Fach- oder Betreiberangabe prüfen; Stoffströme und Anlagen sind nicht beliebig austauschbar, und die Abfuhr zu einem Zwischenstandort ist keine abgeschlossene Behandlung. Rückstau nach seiner Rückwirkung auf Schutz, Pflege und Behandlung, Lebensmittelabgabe oder Unterbringung bewerten. Keine eigene Abfalleinstufung, Ablagerungsanweisung oder Ausnahmegenehmigung.

### 3. Auswertung: Prüfpunkte

- **D1:** Wirkungsraum tatsächlich eingeschränkter Sanitär-, Schutz- oder Versorgungsleistung, nicht automatisch das gesamte Netz- oder Gemeindegebiet oder der Gewässerverlauf.
- **D2:** Tragfähige Zahl unmittelbar Betroffener nach Kodierleitfaden; Anschlüsse, potenzielle Nutzer, Abfallmengen und Einrichtungen sind keine Personenzahl. Tatsächliche Beeinträchtigung der Grundversorgung mit Zeit- und Raumbezug belegen.
- **D3:** Bewertete Funktion nennen, etwa Anlagenbetrieb, Fachüberwachung, Schutzentscheidung oder Ersatzversorgung; Eigentum an der Anlage bestimmt die Ebene nicht.
- **D4:** Tatsächlich eingesetzte ereignisbezogene externe Unterstützung, nicht Absichten, vorgehaltene Container oder reguläre Entsorgungsverträge.
- **D5:** Belastbare Restdauer bis zum benannten Ziel: Ableitung, notwendige Behandlung, betriebene Sanitärleistung oder gesicherter Entsorgungsweg. Technischer Wiederanlauf, gegebenenfalls erforderliche Freigabe und nutzbare Leistung getrennt; keine einheitliche hygienische Freigabepflicht für jeden Pfad unterstellen.
- **D6:** Belegte Kopplung zu Trinkwasser, Gesundheit und Pflege, Energie, Unterkunft oder einer anderen kritischen Funktion; allgemeine Netzabhängigkeit genügt nicht.
- **D7/D8:** Entscheidungsrelevante Informationslücken und beobachtete Veränderung; Geruch, Meldedichte oder eine verzögerte Erhebung belegen weder Kontamination noch Gesundheitsgefahr oder Dynamik.

**Beurteilung/Tendenz:** Nach verbleibender notwendiger Leistung, fachlich bewerteten Folgen, Ersatz, Zeitkritikalität und Verlauf im Referenzraum. Wenige Betroffene in einer Einrichtung können ohne Ersatz relevant sein; keine Schwellen aus Abfallmenge oder Ausfalldauer.

**Offenlassen:** D2 ohne tragfähige Zahl unmittelbar Betroffener; D5 ohne benanntes Funktionsziel und belastbare Prognose.

### 4. Darstellung

Nach B12 bzw. B10 oder der Dach-SOP der Ursache. „Lage & Ereignis“: Funktion und tatsächlicher Leistungsgrad, Raum und Stand. „Risiken & Auswirkungen“: bestätigte Folgen, fachlich bewertete Risiken und bedingte Folgeketten. „Maßnahmen & Handlungsempfehlungen“: betriebener Ersatz und zuständig adressierter Klärungsbedarf mit Status. „Abhängigkeiten & Interdependenzen“: die maßgebliche Abwasser-, Sanitär- oder Entsorgungskette. Die Kernaussage beantwortet: Welche notwendige Leistung fehlt für wen, welcher Ersatz trägt wie lange, und welche Abstimmung ist erforderlich? Neubewertung bei belegter Kapazitäts- oder Qualitätsänderung, erschöpfter Speicher- oder Zwischenhaltung, ausfallender Ersatzabfuhr, relevantem Fachbefund oder geänderter Wiederherstellungsprognose. Keine selbst berechneten Füll- oder Ausfalltermine; Fristen nach A.4, akuter Schutzbedarf nach A.7.3. Abschluss nach erreichtem Funktionsziel und geklärtem Nachlauf einschließlich fortbestehender Umwelt- oder Rückstaufolgen; wiederhergestellter Strom oder abgeholte Container genügen nicht (A.8.2).

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Abwasser- und Entsorgungsbetreiber sowie Einrichtungen zur eigenen Leistung (B) · zuständige Wasser-, Umwelt- und Abfallbehörden für ihre Fachentscheidung · Gesundheitsamt für einschlägige Hygienefragen · örtlich zuständige Gefahrenabwehr für Ersatz- und Schutzkoordination. Keine pauschale Zuständigkeit des Gesundheitsamts für jede Betriebsfreigabe und keine eigene wasser- oder abfallrechtliche Entscheidung der Koordinierungsstelle.

**Offene Punkte:** Abgrenzung zu B10 an einem Übungsfall prüfen. Fachmaterial von Bund und Ländern zu Abwasser und Abfall ist Rechercheeinstieg; aktuelle landes- und fallbezogene Geltung vor Übernahme prüfen (A.6). Pflegefunktion, Meldewege und erforderliche Freigaben je Prüfpfad festlegen. Übungsfälle zu laufendem Trinkwassernetz bei defekter Hebeanlage, Sanitärersatz ohne Entleerung, Rückstau von Klinikabfällen, Tierkörperbeseitigung bei einer Tierseuche und Abwassereintrag ohne nachgewiesene Trinkwasserbelastung.

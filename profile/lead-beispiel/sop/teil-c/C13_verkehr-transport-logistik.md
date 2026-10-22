<a id="c13"></a>

## C13. Baustein LEAD: Verkehr, Transport und kritische Logistik

```yaml
kennung: "C13"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein unter bestehendem Dach"
lesegruppe: "Versorgung, Kommunikation und Logistik"
lageart: "Ausfall oder deutliche Minderung kritischer Verkehrs-, Transport-, Umschlag- oder Verteilleistung auf Straße, Schiene, Wasser oder im Luftverkehr"
art_zuordnung: ["KRITIS-Ausfall"]
art_hinweis: "„KRITIS-Ausfall“ bei belegtem Ausfall oder wesentlicher Einschränkung einer kritischen Verkehrs- oder Logistikleistung; sonst als Prüfhilfe unter der Ereignisart der Ursache"
anschluss: "B12; Ursache nach Dach-SOP (u. a. B01, B02, B03, B05, B06); C02 bei Bauwerksversagen, C04 bei Vulkanasche; C09/C10, C12, C14, C16, C17 nach Folge"
zweck: "Einheitliche Bewertung von Dauer, verbleibender Transportleistung und versorgungsrelevanten Ausweichwegen."
version: "1.2.0"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "22.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N06"
bisherige_ids: ["baustein-n06"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Tatsächlicher Ausfall oder deutliche Minderung einer für Schutz oder Versorgung notwendigen Personen- oder Güterleistung auf Straße, Schiene, Wasser oder im Luftverkehr sowie an Umschlag-, Lager- und Verteilknoten bis zum Bedarfspunkt; dazu abgeschnittene Räume. Auch fehlende Transportmittel, Personal, Abfertigung, Energie oder IT können die Leistung trotz intakter Strecke verhindern. Eine einzelne Verspätung oder Sperrung ist noch keine Versorgungslücke; Relevanz folgt aus konkreter Funktion, benötigter Menge und Qualität, Zeitkritikalität und nutzbarem Ersatz. Entfernungen und theoretische Routen ersetzen keine bestätigte Nutzbarkeit. Frühe Befassung nach A.1 Nr. 1 bei fachlich begründet drohendem Ausfall mit benennbarem Vorbereitungs- oder Abstimmungsbedarf; das belegt noch keinen eingetretenen KRITIS-Ausfall. Unter einer Ursachen-SOP wird C13 als Prüfhilfe verwendet, ohne die Ereignisart „KRITIS-Ausfall“ automatisch hinzuzufügen; eine eingetretene wesentliche Einschränkung kritischer Leistung über B12. Bauwerksversagen von Brücken C02; grenzüberschreitende Korridore, Häfen und Flughäfen mit Deutschlandbezug nach A.1 Nr. 6. Folgebausteine C09/C10, C12, C14 oder C16 nur bei entsprechendem Bedarfspfad, C17 bei konkretem zivilem Verteidigungsbezug.

**Befassungsanlässe:** Bestätigter Ausfall oder deutliche Minderung kritischer Verkehrs- bzw. Logistikleistung · abgeschnittene Räume oder Störung unverzichtbarer Transportketten · fachlich begründet drohender Ausfall mit benennbarem Vorbereitungsbedarf.

**Zuordnung im Schema:** „KRITIS-Ausfall“ bei belegtem Ausfall oder wesentlicher Einschränkung einer kritischen Verkehrs- oder Logistikleistung; die Ursachenart nach belegtem Sachverhalt. Bei früher Befassung Prüfhilfe unter der Ursachen- bzw. Vorsorgebefassung, ohne einen eingetretenen KRITIS-Ausfall zu behaupten.

### 2. Erfassung: Prüffragen

**Transport- und Bedarfsprofil:** Was muss von wo nach wo, in welcher Menge und Qualität und bis wann tatsächlich verfügbar sein? Notwendige Personen- oder Güterleistung, kritischen Bedarfspunkt, Quelle, Stand und erforderliche Transport- und Umschlageigenschaften benennen. Strecke und Knoten, Transportmittel und Personal, Lager- und Umschlagfähigkeit sowie letzte Verteilung zum Bedarfspunkt als Kette prüfen, aber nur die maßgeblichen Engpässe ausführen. Nominale Netz- oder Fahrzeugkapazität, aktuell betriebsfähige Leistung, gebundene und zusätzlich zugesagte Kapazität trennen. Fahrten, Tonnen, Personen und versorgte Einrichtungen sind verschiedene Größen; keine ungeprüfte Umrechnung und keine Doppelzählung von Teiltransporten.

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Personen- bzw. Güterleistung wird benötigt, welche fällt tatsächlich aus? | Betreibermeldungen (A.3) (Infrastruktur-, Verkehrs- und Logistikbetreiber); Lagemeldungen (A.3) | L/R; D1 | Leistung, nicht nur Strecke beschreiben. |
| R2 | Welche kritischen Zufahrten, Brücken, Schienen-, Wasserstraßen-, Hafen-, Flughafen- oder Umschlagverbindungen sind betroffen? | Autobahn GmbH, Straßenbauverwaltungen, DB InfraGO, WSV (u. a. ELWIS), Flughafen- und Hafenbetreiber, Flugsicherung; Betreibermeldungen (A.3) | L; D1/D6 | Vorsorgliche Sperrung ≠ Schaden; Bauwerksversagen nach C02. |
| R3 | Sind Umleitungen praktisch nutzbar und für die erforderliche Transportart geeignet? | Betreibermeldungen (A.3); Lagemeldungen (A.3) | M; D5 | Gewichts-, Höhen- und Kapazitätsgrenzen beachten; nur bestätigte Nutzbarkeit (Absatz „Nutzbarer Ersatz“). |
| R4 | Welche Folgen bestehen für Rettung, Evakuierung, Personalwechsel, Kraftstoff, Lebensmittel oder Arzneimittel? | Lagemeldungen (A.3) | R/I; D6 | Folgebausteine C16, C12, C14, C10. |
| R5 | Wie lange tragen lokale Puffer, und welche Lieferungen können rechtzeitig eintreffen? | Betreibermeldungen (A.3) | R; D5 | Reichweiten nur nach Beleg (Absatz „Zeitkritikalität und Kaskade“). |
| R6 | Was ist zu Wiederfreigabe, Kapazitätsrückkehr und Rückstauabbau belegt? | Betreibermeldungen (A.3) | M; D5 | Freigabe ≠ volle Kapazität. |

**Nutzbarer Ersatz:** Eine bestätigte Route oder ein anderer Verkehrsträger muss für die tatsächlichen Last-, Höhen-, Gefahrgut-, Zeit-, Kühl- oder sonstigen Anforderungen geeignet und rechtzeitig verfügbar sein. Fahrzeuge, Personal, Umschlag, Anschlusskapazität und nötige Freigaben nach zuständiger Quelle prüfen; keine eigene Routengenehmigung. Eine Pkw-Umleitung kann für Tank-, Schwer- oder Spezialtransporte ungeeignet sein. Verlagerung auf Schiene, Straße oder Wasser ist keine sofort verfügbare Ersatzmenge; zusätzliche Engpässe und konkurrierende Bedarfe nach A.7.4. Verschiedene Routen oder Träger können denselben Knoten, Strom-, IT- oder Kraftstoffbezug teilen. Weglänge oder Navigationsvorschlag belegen keine Nutzbarkeit.

**Zeitkritikalität und Kaskade:** Beeinträchtigte Transportleistung → abhängiger Bedarfspunkt → nutzbarer örtlicher Bestand oder Ersatz → konkretes Ausfall- oder Verzögerungsrisiko mit Beleg verfolgen. Maßgeblich ist die Zeit bis zur Unterbrechung einer kritischen Leistung, nicht allein die Dauer der Sperre oder eine bundesweite Gütermenge. Ware im Zentrallager ist nicht verfügbar bei Pflegeeinrichtung, Tankstelle oder Klinik. Reichweite und Zuführung nur mit passendem Verbrauch, Zeitraum und Unsicherheit; keine Standardreichweiten. Eine plausible Kaskade bleibt Szenario, bis ihre Folge belegt ist. Der Pufferablauf dient der Risikobewertung und gegebenenfalls dem Kennsatz `Handlungsrelevant bis:` (A.4), nicht als D5-Wiederherstellungsdauer.

### 3. Auswertung: Prüfpunkte

- **D1:** Wirkungsraum tatsächlicher Schutz- und Versorgungsfolgen, nicht Länge der Strecke, Einzugsgebiet eines Hafens oder Sitz des Betreibers.
- **D2:** Unmittelbar Betroffene nach Kodierleitfaden, z. B. bei tatsächlichem Ausfall notwendiger Grundversorgung oder belegtem Unterkunfts- und Schutzbedarf. Physisches Abgeschnittensein ist weder Voraussetzung noch für sich ein Zählbeleg; verspätete Reisende, alle Fahrgäste oder potenzielle Güterempfänger nicht pauschal zählen.
- **D3:** Bewertete Funktion nennen: Infrastruktur- oder Transportbetrieb, Verkehrsregelung oder Versorgungskoordination; das Eigentum an der Strecke bestimmt die steuernde Ebene nicht.
- **D4:** Herkunft tatsächlich eingesetzter ereignisbezogener externer Unterstützung, nicht regulärer Warenverkehr, Herstellungsort oder Herkunft der Güter.
- **D5:** Belastbare Restdauer bis zum gewählten Ziel, etwa gesicherte kritische Lieferung oder benötigte Transportleistung; Freigabe, Teilkapazität, voller Betrieb und Rückstauabbau sind verschiedene Ziele.
- **D6:** Belegte Kopplung an eine kritische Funktion; Sektorzugehörigkeit und lange Staus legen keine Stufe fest.
- **D7/D8:** Entscheidungsrelevante Informationslücken und beobachtete Änderung der realen Leistung; veränderte Meldedichte oder eine neue Kartenansicht sind keine Dynamik.

**Beurteilung/Tendenz:** Nach benötigter Leistung, ungedecktem Bedarf, Zeitkritikalität, nutzbarem Ersatz und Verlauf im Referenzraum; Länge der Sperrung und Zahl ausgefallener Verbindungen sind keine Schwereklasse.

**Offenlassen:** D2 ohne tragfähige Zahl unmittelbar Betroffener nach Kodierleitfaden; D5 ohne benanntes Ziel und belastbare Prognose der benötigten Transport- oder Versorgungsleistung.

### 4. Darstellung

Nach B12 bzw. der Dach-SOP der Ursache. „Lage & Ereignis“: ausgefallene Leistung, Engpassknoten oder -abschnitt, Ursache soweit belegt, Raum und Stand. „Risiken & Auswirkungen“: tatsächliche Versorgungslücke, tragfähiger Puffer und bedingte Kaskaden getrennt. „Maßnahmen & Handlungsempfehlungen“: bestätigter Ersatz bzw. Zuführung mit Status und zuständig adressierte Klärung. „Abhängigkeiten & Interdependenzen“: die maßgebliche kritische Kette. Die Kernaussage beantwortet: Welche notwendige Leistung erreicht wen bis wann nicht, welcher Ersatz trägt, und welche Abstimmung fehlt? Neubewertung bei belegter Kapazitätsänderung, neuem kritischem Bedarf, geändertem Puffer- oder Zuführungsstand oder belastbarer Wiederanlaufprognose. Netzfreigabe, Aufnahme des Verkehrs und lokale Bedarfsdeckung getrennt fortschreiben; Abschluss erst bei erreichtem Ziel und geklärtem Rückstau (A.8.2).

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Zuständige Infrastruktur- und Verkehrsstellen · Transport-, Logistik- und Umschlagbetreiber · versorgungsabhängige Bedarfsträger; jeweils nach Aussagefunktion (eigene Betriebsangabe B, hoheitliche Anordnung A). Je nach Verkehrsträger Straßenbehörden und Betreiber, Eisenbahninfrastruktur- und Verkehrsunternehmen, WSV und Hafenbetreiber, Luftfahrtstellen, Flugsicherung und Flughafenbetreiber; die lokale Verteilung bis zum Bedarfspunkt einschließen.

**Offene Punkte:** Abgrenzung zu B01, B02 und B06 (wetterbedingte Sperrungen) an Rückblickfällen prüfen. Fachgrundlagen-Block nach A.6 ergänzen: Verkehrssicherstellungsgesetz (VerkSiG) als Maßnahmenrahmen für C17, Fundstelle vor Verwendung am Normtext prüfen und im Quellenregister nachweisen. Staatliche Verfahren zur Sicherstellung von Verkehrsleistungen nur bei belegtem Anlass, aktueller Rechtsgrundlage und tatsächlicher Aktivierung berichten; ihre Erwähnung schafft keinen aktivierten Rechtszustand und keine Anordnungsbefugnis der Koordinierungsstelle. Pflegefunktion, Meldewege und Prüfanlässe organisationsspezifisch festlegen. Übungsfälle zu gesperrter Brücke mit ungeeigneter Pkw-Umleitung, reduzierter Wasserstraßenleistung, ausgefallenem Umschlag trotz offener Strecke, kritischem Luftfrachtweg und Rückstau nach Freigabe.

# KI-LEAD – Spezifikation des Forschungsdemonstrators

Fassung 0.3 vom 18.10.2026, Heiko Pereira Wolf

Lizenzen: Code EUPL-1.2; Inhalte der Profilpakete und Schemata CC BY 4.0; begleitende Aufsätze CC BY-NC-ND 4.0.

Änderungen gegenüber 0.1: Lizenzaufteilung; Ausgabe „Management Summary“ als Klartext; eval-freie Schemaprüfung (Abschnitt 7); fiktiver Datensatz „Ilka“ als Abnahmegrundlage (Abschnitt 9).

---

## 1. Zweck und Abgrenzung

KI-LEAD ist ein Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und -darstellung). Die App erzeugt strukturierte Lagemeldungen nach einer hinterlegten Arbeitsanweisung, nach Standardvorgehensweisen (SOP) und nach einem Kodierleitfaden. Sie verdichtet außerdem eingehende Meldungen zu einer eigenen Meldung.

- **Kein Produktivsystem**, keine kommerzielle App.
- **Nur fiktive oder offen zugängliche Daten.** Keine personenbezogenen und keine eingestuften Inhalte (VS). Die App zeigt dazu einen Hinweis an.
- **Organisationsneutral.** Alles Organisationsspezifische steckt in einem austauschbaren Profilpaket (Abschnitt 4). Dazu gehören Schema, Kataloge, Stufentexte, Arbeitsanweisung, SOP, Kodierleitfaden und Kontakte. Die App selbst enthält nur die LEAD-Logik.
- **Privates Forschungsvorhaben:** Der Demonstrator ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Er nutzt nur eigene oder veröffentlichte Materialien. Die Abgrenzung steht in README und Impressum (siehe Abschnitt 10).

## 2. Betriebsmodell

- **Plattformen:** iPadOS und iOS als native App (Capacitor). Dieselbe Codebasis läuft als Android-App und als PWA.
- **Lokal:** Profile, Meldungen, Läufe und Einstellungen liegen ausschließlich auf dem Gerät. Es gibt keine eigene Serverkomponente, kein Konto, keine Telemetrie und kein CDN. Alle Bibliotheken sind gebündelt.
- **Einzige Netzverbindungen:** die KI-Schnittstellen von Anthropic (Claude) und OpenAI. Websuche und URL-Abruf laufen über die serverseitigen Werkzeuge des jeweiligen Anbieters.
- **Eigener API-Schlüssel (BYOK):** Jede Person trägt ihren eigenen Schlüssel ein. In der nativen App liegt er im iOS-Keychain bzw. im Android-Keystore. In der PWA ist er nur im Browserspeicher abgelegt, mit Warnhinweis.

## 3. Grundprinzip: rekursive Lagemeldung

Auf jeder Ebene gilt dieselbe Systematik. Die Meldungen nachgeordneter und lateraler Stellen ergeben die eigene Meldung. Diese wird wiederum von übergeordneten und lateralen Stellen genutzt.

```
Einsatzstelle ─┐
Kommune ───────┼─▶ Kreis ─┐
Betreiber ─────┘          ├─▶ Land ─┐
          (lateral) Kreis ┘         ├─▶ Bund / Koordinierungsstelle
                    (lateral) Land ─┘
```

Daraus folgen **zwei Eingangsmodi** mit **einem gemeinsamen Ausgabeformat** (dem Meldungsschema des Profils):

| Modus | Eingang | Ergebnis |
|---|---|---|
| **A – Erfassung** | Stichworte, URLs, Dokumente (DOCX, TXT, JSON, MD, PDF) | eigene Meldung |
| **B – Verdichtung** | Meldungen nachgeordneter/lateraler Stellen (JSON), optional ergänzt um Material wie in Modus A | eigene Meldung |

Für Modus B gelten folgende Regeln (abgeleitet aus Kodierleitfaden Abschnitt 1 und SOP-LEAD A.7):

1. **Referenzraum wechselt mit der Ebene.** Das Profil legt den eigenen Referenzraum fest. Das Lagenradar wird für diesen Raum neu kodiert. Werte der Eingangsmeldungen werden weder übernommen noch gemittelt, und es entsteht kein Gesamtscore.
2. **Zusammenhang prüfen (A.7.1).** Beschreiben mehrere Meldungen denselben Sachverhalt, wird er einmal dargestellt und nicht doppelt gezählt. Die Zahl der Meldungen belegt keine Verschärfung.
3. **Abweichende Bewertungen (A.7.2)** bleiben nebeneinander stehen, mit Urheber und tragendem Grund. Sie stehen im Kennsatz `Abweichende Bewertung:`.
4. **Eingangsmeldungen sind Quellen der Kategorie A** im Quellenverzeichnis der eigenen Meldung, zum Beispiel:
   `[Q3] A – Lagezentrum Land X (09.10.2026): Lagemeldung Nr. 12 (behördenintern) [Zugriff: 09.10.2026]`
   Dieses Format sieht Abschnitt 5 des Kodierleitfadens bereits vor.
5. **Zeitkritische Weitergabe (A.7.3):** Die App hebt Kennsätze `Handlungsrelevant bis:` hervor, deren Datum vor dem nächsten eigenen Meldetermin liegt.

## 4. Profilpaket

Ein Profilpaket ist ein Ordner oder eine ZIP-Datei mit der Endung `.leadprofil`. Es definiert eine Organisation bzw. Hierarchieebene vollständig. Die App kann mehrere Profile halten, genau eines ist aktiv.

### 4.1 Aufbau

```
lead-beispiel.leadprofil/
├── profil.json              Manifest (Pflicht)
├── meldung.schema.json      JSON-Schema der Meldung (Pflicht, unverändert aus der Organisation)
├── meldung.ui.json          Darstellung: Labels, Hinweise, Widgets, Stufentexte, Kennsätze (Pflicht)
├── anweisung-erfassung.md   Arbeitsanweisung Modus A (Pflicht)
├── anweisung-verdichtung.md Arbeitsanweisung Modus B (optional; sonst nur Aggregation ohne KI)
├── kodierleitfaden.md       (Pflicht)
├── sop/                     Sammelmappe und/oder Einzel-SOPs (optional, dringend empfohlen)
├── kontakte.json            Stellen und Adressen für Meldestatus und Erinnerung (optional)
└── beispiele/               Stil-Beispiele (JSON), nie Beleg- oder Skalenquelle (optional)
```

### 4.2 Manifest `profil.json` (Beispielprofil)

```json
{
  "format": "lead-profil/1",
  "id": "lead.beispiel.koordinierungsstelle",
  "name": "LEAD-Beispiel – Koordinierungsstelle",
  "version": "1.0.0",
  "ebene": "Bund",
  "referenzraum": "Bevölkerungsschutz in Deutschland",
  "variablen": {
    "land": "Bund",
    "meldende_stelle": "Koordinierungsstelle (Beispiel)",
    "zeitzone": "Europe/Berlin",
    "meldetakt": "wöchentlich"
  },
  "meldung": {
    "schema": "meldung.schema.json",
    "ui": "meldung.ui.json",
    "eingang_schema_ids": ["LEAD-Meldung-v1"]
  },
  "anweisungen": {
    "erfassung": "anweisung-erfassung.md",
    "verdichtung": "anweisung-verdichtung.md"
  },
  "sop": { "dateien": ["sop/SOP-LEAD_Sammelmappe.md"], "teil_gemeinsam": "teil-a" },
  "kodierleitfaden": "kodierleitfaden.md",
  "kontakte": "kontakte.json",
  "modelle": {
    "vorverarbeitung": "claude-haiku-5-5",
    "erfassung": "claude-sonnet-5-5",
    "verdichtung": "claude-opus-5-5"
  }
}
```

### 4.3 Darstellungsdatei `meldung.ui.json` (Auszug)

Die App leitet Ereignisartenkatalog, Länderliste und zulässige Werte direkt aus den Enums des Schemas ab. Die UI-Datei enthält nur, was das Schema nicht trägt.

```json
{
  "labels": { "lage_ereignis": "Lage & Ereignis", "bewertung_text": "Bewertung & Tendenz" },
  "hinweise": { "lage_ereignis": "Kernaussage zuerst, dann bestätigter Sachstand mit Datenstand …" },
  "widgets": {
    "sachverhalte[].art": "mehrfachauswahl",
    "sachverhalte[].sofort.beurteilung": "radio",
    "sachverhalte[].sofort.lagenradar": "radar"
  },
  "radar": {
    "max": 6,
    "achsen": [
      { "key": "d1", "label": "D1 Räumliche Auswirkung / Impact-Raum",
        "stufen": ["punktuell/kleinflächig", "kommunal", "überörtlich (mehrere Kommunen/Kreis)",
                   "regional (mehrere Kreise/Region)", "landesweit", "bundesweit", "international"] }
    ]
  },
  "kennsaetze": ["Neubewertung bei:", "Handlungsrelevant bis:", "Änderung zur Vormeldung:",
                 "Abweichende Bewertung:", "Abschluss im Lagebild:"],
  "quellen": {
    "feld": "quellen",
    "kategorien": { "A": "amtlich/zwischenstaatlich", "W": "wissenschaftlich", "M": "Medien", "P": "privat/wirtschaftlich" }
  },
  "status_feld": "_status",
  "entstehung_feld": "_entstehung",
  "dateiname": "LEAD-Meldung_{land}_{meldende_stelle}_{meldezeitpunkt}"
}
```

### 4.4 Arbeitsanweisungen mit Platzhaltern

Die Arbeitsanweisungen sind Markdown-Dateien mit Platzhaltern, die die App vor dem Aufruf ersetzt:

- `{{profil.*}}` – Variablen aus dem Manifest (z. B. `{{profil.meldende_stelle}}`, `{{profil.referenzraum}}`)
- `{{auftrag.*}}` – die Auftragsfelder aus der Eingabemaske (Sachverhalt/Erkenntnisinteresse, Ausgangsquellen, Stichtag, Prüffrage, Ereignisart/SOP)
- `{{jetzt}}` – aktueller Zeitpunkt in der Zeitzone des Profils

**Hinweise für eigene Arbeitsanweisungen:**
- Die technische Grundlage bilden das beigefügte JSON-Schema und die Darstellungsdatei, nicht eine HTML-Maske.
- Ebene und meldende Stelle stehen als Platzhalter in der Anweisung. Dieselbe Anweisung trägt so jede Ebene.
- Für Modus B (Verdichtung) gibt es eine eigene Arbeitsanweisung nach Abschnitt 3 dieser Spezifikation.

### 4.5 SOP-Erkennung

Die App zerlegt eine Sammelmappe an den Ankern (`<a id="sop-01">`, `<a id="teil-a">`) bzw. an den Überschriften der zweiten Ebene. Aus dem YAML-Block jeder SOP liest sie `lageart`, `art_vorschlag` und `version`. Teil A wird immer mitgegeben. In Stufe 2 werden nur die in Stufe 1 gewählten SOPs mitgegeben.

### 4.6 Profilverwaltung

- Import als ZIP oder Ordner (Dateien-App, AirDrop, Teilen-Menü), Export als ZIP.
- Beim Import prüft die App: Pflichtdateien vorhanden, Schema gültig, `ui.json` passt zum Schema, SOP-Anker erkennbar.
- Optional prüft sie, ob die Stufentexte in `ui.json` mit der Tabelle in Abschnitt 2 des Kodierleitfadens übereinstimmen. Weichen sie ab, gibt es einen Hinweis, aber keinen Abbruch.
- Jede Profilversion wird mit einem Hash ihrer Dateien gespeichert. Ältere Versionen bleiben erhalten, damit jedes Ergebnis seiner Regelgrundlage zugeordnet bleibt.
- Ein Update ersetzt einzelne Dateien manuell. Das ist der Weg für inhaltliche Fortschreibungen der Systematik. Die App zeigt dabei an, was sich geändert hat.
- Mitgeliefert werden das Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“ und ein schlankes Musterprofil. Eigene Profile können lokal im nicht eingecheckten Ordner `privat/profile/` liegen.

## 5. Funktionen

### 5.1 Modul „Meldung“ (Modus A, gestuft nach LEAD)

| Stufe | Inhalt | Ausführung | Ergebnis |
|---|---|---|---|
| **S0 Vorverarbeitung** | TXT/MD lesen, Text aus DOCX (eigener Leser für word/document.xml) ziehen, PDF unverändert als Dokument an das Modell geben. JSON prüfen: Ist es eine Meldung des Profils, gilt sie als Vormeldung zur Fortschreibung (A.8). URLs stehen im Nutzertext, damit das Abrufwerkzeug sie verwenden darf. | lokal | Eingangsmaterial |
| **S1 Gegenstand & SOP-Auswahl** | Sachverhalt, Stichtag, Referenzraum-Bezug, Horizont (A.1). Ereignisarten aus dem Katalog, SOPs inkl. Mischlage und Abgrenzung. Strukturierte Ausgabe (`output_config.format`) mit Enums aus Schema und SOP-Katalog. | KI, kleines Modell | strukturierter Vorschlag; **Person bestätigt oder ändert** |
| **S2 Recherche & Entwurf** | Recherche nach den Bausteinen R1–R6 der gewählten SOPs mit Websuche und Seitenabruf. Entwurf aller Felder, Radar Achse für Achse, Quellenverzeichnis. Ausgabe als Kurzantwort plus JSON-Codeblock (Ausgabevertrag der App), weil die strukturierte Ausgabe der API Schlüsselwörter wie `minLength` oder `if/then` nicht trägt. | KI, mittleres Modell, Websuche | JSON-Entwurf und Kurzantwort |
| **S3 Prüfung & Reparatur** | Die App setzt Schemakennung, Status „Entwurf“, Profilvariablen und `_entstehung`. Danach Schemaprüfung (eigener Prüfer, 2020-12), Quellenprüfung, Kennsätze und Ausfüllhinweise. Bei Schemafehlern höchstens zwei Reparaturaufrufe ohne Werkzeuge und ohne neue Recherche. | lokal und KI | geprüfter Entwurf mit Prüfbericht |
| **S4 Redaktion & Freigabe** | Formular aus Schema und `ui.json` (Radar, Mehrfachauswahl, Quellen-Editor). Das Feld `_entstehung` wird automatisch gefüllt und bleibt erhalten. Export als JSON/PDF. | lokal | Meldung (Entwurf/final) |
| **Management Summary** | Eine konsolidierte Fassung der fertigen Meldung für die Behördenleitung (Richtwert höchstens 150 bis 180 Wörter): Kernaussage in einem Satz, Kurztitel je Sachverhalt mit Beurteilung und Tendenz aus der Meldung, je Analysefeld des Profils höchstens zwei Sätze für die gesamte Lage, früheste Frist aus den Kennsätzen „Handlungsrelevant bis:“. Ohne Recherche und ohne Neubewertung; Arbeitsanweisung `anweisungen.kurzfassung`, strukturierte Ausgabe; die App prüft Länge und Satzzahl. Die Fassung wird je Profil gespeichert und als veraltet markiert, sobald sich der Inhalt der Meldung ändert. Ohne KI: Feldauszug als Klartext. | KI, mittleres Modell | Klartext zum Kopieren, TXT, Protokoll |

Jede Stufe wird mit Eingabe, Ausgabe, Modell, Tokens, Kosten und Dauer im Laufprotokoll gespeichert (PDF-Inhalte nur als Verweis). Schlägt S2 fehl, lässt sich S2 mit dem bestätigten Gegenstand erneut starten.

**Umsetzung M2 (Stand 17.10.2026):** Anthropic Messages API mit Streaming (SSE), Fortsetzung bei `pause_turn`, Wiederholung bei Überlastung, Websuche `web_search_20250305` (lokalisiert, Höchstzahl einstellbar), Seitenabruf `web_fetch_20250910`, Prompt-Caching für Profilgrundlagen und SOP-Block, Aufwand (`effort`) je Stufe. Vorgaben: S1 claude-haiku-5-5 (mittel), S2 claude-sonnet-5-5 (mittel, bis 128 000 Ausgabetoken; bei Abschneiden folgt eine Vervollständigung ohne Recherche), S3 claude-sonnet-5-5 (niedrig); das Profil kann andere Modelle vorgeben, die Einstellungen überschreiben beides.

### 5.2 Modul „Lagebild“ (Modus B)

- **Import** mehrerer Meldungen. Jede wird geprüft und gegebenenfalls migriert (profilgesteuert).
- **Ansichten:** Dashboard mit Meldestatus aus `kontakte.json`, Meldungen, Sachverhalte, Lagenradar je Sachverhalt (ohne Mittelwert), Rohtabelle, Redaktionscheck (A.3/A.4/A.7/A.8) und Kopiervorlage für Word.
- **Export:** PDF, CSV, Kopiervorlage.

**Umsetzung M3 (Stand 18.10.2026):** Ansicht „Lagebild“ (Name aus `ui.lagebild.titel`). Einlesen von JSON-Dateien und ZIP-Archiven; gleiche Dateiinhalte nur einmal; Migration und Schemaprüfung je Datei; Meldungen fremder Schemata werden an ihrer Grundform (Sachverhaltsliste plus Stelle oder Land) erkannt, bleiben aus den Auswertungen heraus und lassen sich an die KI-Erfassung übergeben. Der Stand wird je Profil im Gerät gespeichert. Übersicht mit Kennzahlen (Stufen aus `beurteilung_hoch`, Tendenz aus `tendenz_verschaerfung`), Meldestatus nach `kontakte.json` mit mailto-Erinnerung, Verteilungen. Redaktionscheck in fünf Abschnitten (Zeitfenster gegen die nächste Ausgabe; Zusammenhang und abweichende Bewertungen je Ereignisart mit Textbaustein A.7.2; Fortschreibung, Nachlauf, Abschluss und mehrere Meldungen derselben Stelle; Kernaussage bei hoher Beurteilung; Quellen, Schema, Status), Fundstellen aus `ui.lagebild.verweise`. Rohtabelle und CSV generisch aus dem Schema (eine Zeile je Sachverhalt, eine Spalte je Radarachse). Kopiervorlage als Word-kompatibles HTML mit Farbquadraten und Radar als PNG. PDF mit Übersicht nach Schwere und allen Meldungen. Jede Meldung lässt sich in der Maske öffnen. Beispieldatensätze kommen aus dem Profil (`beispiele`).
- **KI-Verdichtung:**
  1. Die KI schlägt eine Gruppierung nach Sachverhalten vor (A.7.1). Die Person bestätigt oder korrigiert die Zuordnung.
  2. Die KI erstellt je Gruppe einen Sachverhalt der eigenen Meldung: Radar neu für den eigenen Referenzraum, Abweichungen als Kennsatz, Eingangsmeldungen als A-Quellen.
  3. Danach folgen S3 und S4 wie in Modus A.

### 5.3 Bibliothek

Lokale Ablage aller Meldungen, Läufe und Profile, mit Suche und Filter nach Profil, Status und Ereignisart. Teilen über das System-Teilen-Menü (Dateien, Mail, AirDrop).

### 5.4 Einstellungen

- API-Schlüssel je Anbieter.
- Modell und Aufwand (Effort) je Stufe; die Voreinstellungen kommen aus dem Profil.
- Kostenanzeige je Lauf auf Basis der Token-Zählung.
- Datenhinweis und Sprache.

## 6. Forschungsfunktionen

- **Laufprotokoll:** Profil-ID, Version und Hash; Modell-ID und Parameter; vollständige Prompts und Rohantworten; Tokens; Dauer. Exportierbar als JSON-Forschungsdatensatz.
- **`_entstehung`:** Das Beispielschema lässt nur die Felder `verfahren`, `werkzeug`, `modell`, `sop`, `kodierleitfaden` und `erstellt` zu. Die App setzt `werkzeug` auf „KI-LEAD 0.3 · Profil <id> <version> · Lauf <lauf-id>“, dazu `modell` und `erstellt`. Die ausführliche Herkunft steht im Laufprotokoll, die Meldung verweist darauf.
- **Später (Architektur jetzt vorsehen):** Mehrfachläufe zum selben Sachverhalt mit Vergleich je Radarachse und Auswahlfeld sowie Konsolidierung nach dem Abschnitt „Konsolidierung bei mehreren Rechercheläufen“ der Arbeitsanweisung. Dafür ist ein Lauf eine eigene Entität, und eine Meldung referenziert einen oder mehrere Läufe.
- **Später:** Vergleich zwischen KI-Entwurf und manueller Meldung, etwa für das Kollegiumsexperiment zur Inter-Rater-Konsistenz.

## 7. Architektur und Technik

| Bereich | Wahl |
|---|---|
| Sprache/Build | TypeScript, Vite |
| UI | React (verbreitet, gut für KI-gestützte Entwicklung) |
| Native Hülle | Capacitor (iOS, Android); dieselbe Web-App als PWA |
| Schema | eigener, interpretierender Prüfer für Draft 2020-12 ohne Codeerzeugung (läuft unter strenger Content-Security-Policy); Ajv dient in den Tests als Referenz |
| Dokumente | DOCX-Text über JSZip, PDF direkt an das Modell; jsPDF und autotable für den Export |
| Speicher | Capacitor Filesystem (Meldungen und Profile als Dateien, transparent und exportierbar), Index in IndexedDB |
| Geheimnisse | Keychain bzw. Keystore über ein Secure-Storage-Plugin (ab M5); bis dahin IndexedDB des Browsers mit Warnhinweis |
| HTTP | im Browser direkt über `fetch` mit dem Kopf `anthropic-dangerous-direct-browser-access`; nativ später über CapacitorHttp |

**Anbieter-Abstraktion:** Eine gemeinsame Schnittstelle `LlmAnbieter` (`src/anbieter/typen.ts`) deckt Nachrichten, Werkzeuge (Websuche, URL-Abruf), strukturierte Ausgabe und Token-Zählung ab. Es gibt zwei Implementierungen: Anthropic Messages API und OpenAI Responses API. Die Profilinhalte (Anweisung, Teil A, SOPs, Kodierleitfaden, Schema) stehen am Anfang des Prompts und werden gecacht. Der Auftrag und das Material stehen am Ende.

**Code-Struktur (Vorschlag):**

```
src/
  kern/        Schemaprüfung, Migration, Quellen, Kennsätze, Redaktionscheck (profilgesteuert)
  profil/      Laden, Prüfen, Versionieren, SOP-Zerlegung, Platzhalter
  pipeline/    Stufen S0–S4, Laufprotokoll
  anbieter/    anthropic.ts, openai.ts, gemeinsame Schnittstelle
  dokumente/   Textextraktion, PDF-Export
  ui/          Formular aus Schema+UI, Radar, Lagebild-Ansichten
  speicher/    Dateien, Index, Schlüssel
profile/       Beispielprofil, Musterprofil
privat/        eigene Profile und Testdaten, nicht eingecheckt
```

## 8. Datenschutz und Sicherheit

- Ein Hinweis beim ersten Start und vor jedem KI-Lauf: nur fiktive oder offene Inhalte, keine personenbezogenen und keine eingestuften Daten.
- Inhalte gehen nur an den gewählten KI-Anbieter; dort gelten dessen API-Bedingungen. Es gibt keine weitere Übermittlung, keine Analytics und keine Absturzberichte an Dritte.
- Der API-Schlüssel verlässt das Gerät nur im Aufruf an den jeweiligen Anbieter.

## 9. Meilensteine und Abnahme

| M | Inhalt | Abnahme |
|---|---|---|
| **M0** | Rahmen: Apple Developer Account, GitHub-Repo (EUPL-1.2), Namensabgrenzung. Als wissenschaftliche Tätigkeit ist das Vorhaben genehmigungsfrei. | erledigt (17.10.2026) |
| **M1** | Web-Kern: Profil laden, Formular aus Schema und UI, Prüfung, Import/Export – ohne KI | Fiktiven Datensatz „Ilka“ (sieben Meldungen) laden, ohne Befund prüfen und unverändert wieder exportieren; ein zweites Profil mit anderem Schema darstellen |
| **M2** | KI-Pipeline Modus A (S0–S4), Anthropic | Drei fiktive Lagen erzeugen schemakonforme Entwürfe mit vollständigem Laufprotokoll |
| **M3** | Modul Lagebild: Aggregation und Redaktionscheck | Meldestatus, Sachverhalte, Radar je Sachverhalt, Redaktionscheck und Exporte |
| **M4** | KI-Verdichtung Modus B (vorläufige Fassung seit M2: Erkennung von Eingangsmeldungen, Gliederung nach Sachverhalten mit Zuordnung, t0, Zusatzanweisung A.7); OpenAI-Anbieter | Verdichtung der sechs fiktiven Ländermeldungen „Ilka“ zu einer Meldung der Koordinierungsstelle; Vergleich mit der vorhandenen Redaktionsfassung |
| **M5** | Capacitor-Builds: iOS (TestFlight), Android (APK), PWA (pereirawolf.de) | Installation und Offline-Betrieb auf iPad, iPhone und Android-Emulator |
| **M6** | Release 0.1 mit Zenodo-DOI (GitHub-Integration, Metadaten aus CITATION.cff); Erprobung im Testkreis | Release veröffentlicht, Rückmeldungen ausgewertet |

## 10. Offene Punkte

1. **Namensabgrenzung:** Zu klären ist, ob die ausdrückliche Abgrenzung im README genügt oder ein Zusatz („KI-LEAD Demonstrator“) hilft.
2. **Quellen bei Verdichtung:** Werden nur die Eingangsmeldungen als Quellen geführt, oder werden deren zentrale Primärquellen durchgereicht?
3. **`land`-Enum auf unteren Ebenen:** Für Kreis oder Einsatzstelle trägt `land` das Bundesland, `meldende_stelle` die Stelle. Zu prüfen ist, ob das für alle Ebenen genügt oder ob eine Ebene ein eigenes Schema braucht.
4. **Schema-Kompatibilität zwischen Ebenen:** Verwenden zwei Ebenen unterschiedliche Profilversionen, braucht die App eine Migrationsregel. Das Profilformat sieht dafür Migrationsregeln im Manifest vor.
5. **Arbeitsanweisung Modus B** ist neu zu schreiben (Abschnitt 4.4).
6. **Kosten und Laufzeiten** je Stufe im Pilot messen; danach die Modell-Voreinstellungen anpassen.

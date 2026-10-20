# KI-LEAD – Spezifikation des Forschungsdemonstrators

Fassung 0.4.20 vom 20.10.2026, Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“, Änderungen der App in [CHANGELOG.md](../CHANGELOG.md)

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

1. **Referenzraum wechselt mit der Ebene.** Das Profil legt den eigenen Referenzraum fest. Das Lagenradar wird für diesen Raum aus den zugrunde liegenden Zahlen und Zuständen neu kodiert. Radarwerte der Eingangsmeldungen sind kein Tatsachenbeleg; sie werden weder übernommen noch gemittelt, und es entsteht kein Gesamtscore.
2. **Zusammenhang prüfen (A.7.1).** Beschreiben mehrere Meldungen denselben Sachverhalt, wird er einmal dargestellt und nicht doppelt gezählt. Die Zahl der Meldungen belegt keine Verschärfung. Addiert wird nur bei gleicher Einheit, Definition und Zeitbasis ohne Überschneidung; ältere Angaben tragen den Ist-Wert zu t0 nur bei begründeter Fortgeltung. Eine jüngere Meldung derselben Stelle ersetzt ältere Angaben nur, soweit sie denselben Gegenstand aktualisiert, berichtigt oder aufhebt.
3. **Abweichende Bewertungen (A.7.2)** bleiben nebeneinander stehen, mit Urheber und tragendem Grund. Sie stehen im Kennsatz `Abweichende Bewertung:`.
4. **Eingangsmeldungen sind Quellen** im Quellenverzeichnis der eigenen Meldung, eine je Eingang; die Kategorie richtet sich nach der Rolle der meldenden Stelle (Behörden A, nichtbehördliche Stellen B oder P nach Kodierleitfaden Abschnitt 5), zum Beispiel:
   `[Q3] A – Lagezentrum Land X (09.10.2026): Lagemeldung Nr. 12 (behördenintern) [Zugriff: 09.10.2026]`
   Dieses Format sieht Abschnitt 5 des Kodierleitfadens bereits vor.
5. **Zeitkritische Weitergabe (A.7.3):** Die App hebt Kennsätze `Handlungsrelevant bis:` hervor, deren Datum vor dem nächsten eigenen Meldetermin liegt. Alle offenen Fristen bleiben in der Verdichtung erhalten, überfällige ohne Erledigungsnachweis werden gekennzeichnet; eine Weitergabe behauptet die KI nicht.

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
  "sop": { "dateien": ["sop/A_Gemeinsame-Regeln.md", "sop/teil-b/B01_unwetter-sturm.md", "…", "sop/teil-c/C17_zivile-verteidigung-zivile-folgen.md"], "teil_gemeinsam": "teil-a" },
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
    "kategorien": { "A": "amtlich/zwischenstaatlich", "B": "Betreiber", "W": "wissenschaftlich", "M": "Medien", "P": "sonstige private Quellen" },
    "rangfolge": ["A", "B", "W", "M", "P"]
  },
  "status_feld": "_status",
  "entstehung_feld": "_entstehung",
  "dateiname": "LEAD-Meldung_{land}_{meldende_stelle}_{meldezeitpunkt}"
}
```

**Dateinamen:** Alle Downloads beginnen mit dem Datum, damit sie im Ordner zeitlich sortiert stehen: `2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_ENTWURF.pdf`. Bei Meldungen und daraus abgeleiteten Dateien (Management Summary, Feldauszug, Protokoll) ist es der Meldezeitpunkt (Rolle `meldezeitpunkt`), ohne ihn der Exportzeitpunkt. Den Platzhalter `{meldezeitpunkt}` setzt die App unabhängig von seiner Stelle in der Vorlage nach vorn; ältere Vorlagen müssen nicht geändert werden. Lagebild-PDF und -CSV tragen den Exporttag (`2026-10-20_Lagebild.pdf`), Redaktionsbericht, Notfallsicherung, Profilpaket und Lesetexte den Exportzeitpunkt, Laufprotokoll und Vergleich ihren Erstellungszeitpunkt, jeweils in der Zeitzone des Profils. Lauf-IDs, Paketinhalte und Originalnamen bleiben unverändert hinter dem Datum.

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
- Die Profilansicht ist eine reine Leseansicht und zeigt die Profile untereinander. Im Kopf jeder Karte stehen der Name, beim verwendeten Profil die grüne Marke „✓ In Verwendung“, bei den übrigen der Knopf „Verwenden und Meldung öffnen“. Nur dieser Knopf aktiviert ein Profil. Darunter folgen Profilversion und Herkunft, Metadaten (Ebene, Referenzraum, Schema, SOPs und Bausteine, Herausgeber, Lizenz) und die Prüfsumme; sie ist kopierbar und lässt sich vollständig anzeigen.
- „Arbeitsanweisungen und Kodierleitfaden“ zeigt die vier Arbeitsgrundlagen in der Reihenfolge Erfassung, Verdichtung, Kurzfassung, Kodierleitfaden. Jede Zeile hat einen Zwecksatz und ein Tag mit der eigenen Fassung aus dem Kopfabsatz des Dokuments („Fassung nicht angegeben“, wenn keine erkennbar ist). Pfade kommen aus dem Manifest, Texte aus dem geladenen Paket. Fehlt einem Profil die Verdichtung oder die Kurzfassung, zeigt die Zeile die Standardfassung der App, die dann tatsächlich verwendet wird, gekennzeichnet als „kein Bestandteil des Profils“. Ein geöffnetes Dokument nennt Datei, Fassung, Stand und Profilversion. Bei Arbeitsanweisungen erklärt ein Hinweis, dass die App die hervorgehobenen Platzhalter erst beim KI-Lauf einsetzt.
- „Dokumentation lesen“ zeigt Übersicht und Änderungsverlauf der SOP-Sammlung sowie Beschreibung und Änderungsverlauf des Profils, jeweils nur, wenn vorhanden. Alle Lesetexte mit mindestens vier Überschriften (zweite und dritte Ebene) erhalten ein aufklappbares Inhaltsverzeichnis mit Sprüngen innerhalb des geöffneten Texts. Die Originaldatei lässt sich einzeln herunterladen; „Quelltext anzeigen“ zeigt die unveränderte Datei des Pakets. „SOP-Katalog lesen“ zeigt Teil A, die Dach-SOPs und die Leseblöcke der Bausteine. Jede Zeile trägt Kennung und Kurzname sowie ein neutrales Tag mit der Fassung des Dokuments (Teil A: „gilt immer“). Eine Suche findet Einträge über Kennung, Name und frühere Kennung, auf Wunsch auch im Text. Ein geöffneter Eintrag zeigt einen Steckbrief aus dem Kopf und den Text mit Tabellen. Rohes HTML wird nicht ausgeführt, Bilder werden nicht geladen. Der Renderer ist Teil der App und wird nicht nachgeladen; scheitert die Aufbereitung, nennt die Ansicht den Fehler und zeigt den Quelltext. Relative Links öffnen den Eintrag im selben Paket, nicht mitgelieferte Ziele sind als „nicht im Paket“ gekennzeichnet. Der Quelltext bleibt abrufbar.
- Jedes Profil hat seinen eigenen Meldungs-Zwischenstand, der beim Wechsel erhalten bleibt. Läuft gerade ein KI-Auftrag, fragt die App vor dem Wechsel nach, weil der Wechsel den Lauf abbricht. Nach einem Import nennt die App Name und Version des Profils und ob es schon in Verwendung ist, und bietet „Jetzt verwenden“ an.

## 5. Funktionen

### 5.1 Modul „Meldung“ (Modus A, gestuft nach LEAD)

| Stufe | Inhalt | Ausführung | Ergebnis |
|---|---|---|---|
| **S0 Vorverarbeitung** | TXT/MD lesen, Text aus DOCX (eigener Leser für word/document.xml) ziehen, PDF unverändert als Dokument an das Modell geben. JSON prüfen: Ist es eine Meldung des Profils, gilt sie als Vormeldung zur Fortschreibung (A.8). URLs stehen im Nutzertext, damit das Abrufwerkzeug sie verwenden darf. | lokal | Eingangsmaterial |
| **S1 Gegenstand & SOP-Auswahl** | Vor dem Start lassen sich die Modelle für S1, S2 und S3 für diesen Lauf abweichend von den Einstellungen wählen; das Laufprotokoll ist ab S1 exportierbar. Sachverhalt, Stichtag, Referenzraum-Bezug, Horizont (A.1). Ereignisarten aus dem Katalog, SOPs inkl. Mischlage und Abgrenzung. Strukturierte Ausgabe (`output_config.format`) mit Enums aus Schema und SOP-Katalog. Die App sichert zwei Felder ab: Bei einer Verdichtung ohne vorgegebenen t0 setzt sie t0 auf den jüngsten Eingang, wenn der Vorschlag davor oder mehr als 24 Stunden danach liegt, und nennt das unter „Hinweise der App“. Nennt der Auftrag keine Prüffrage, bleibt eine von S1 vorgeschlagene Prüffrage ein Vorschlag, den die Person übernehmen kann. | KI, kleines Modell | strukturierter Vorschlag; **Person bestätigt oder ändert** |
| **S2 Recherche & Entwurf** | Recherche nach den Bausteinen R1 ff. der gewählten SOPs und Bausteine mit Websuche und Seitenabruf. Entwurf aller Felder, Radar Achse für Achse, Quellenverzeichnis. Ausgabe als Kurzantwort plus JSON-Codeblock (Ausgabevertrag der App), weil die strukturierte Ausgabe der API Schlüsselwörter wie `minLength` oder `if/then` nicht trägt. | KI, mittleres Modell, Websuche | JSON-Entwurf und Kurzantwort |
| **S3 Prüfung & Reparatur** | Die App setzt Schemakennung, Status „Entwurf“, Profilvariablen und `_entstehung`. Danach Schemaprüfung (eigener Prüfer, 2020-12), Quellenprüfung, Kennsätze und Ausfüllhinweise. Bei Schemafehlern höchstens zwei Reparaturaufrufe ohne Werkzeuge und ohne neue Recherche. | lokal und KI | geprüfter Entwurf mit Prüfbericht |
| **S4 Redaktion & Freigabe** | Formular aus Schema und `ui.json` (Radar, Mehrfachauswahl, Quellen-Editor mit Baukasten für neue Zeilen aus Kategorie, Art und Zusätzen, auch aus Meldungen des gespeicherten Lagebilds; Zeitfelder mit „Jetzt“, „Nur Tag“ und „Leeren“). Das Feld `_entstehung` wird automatisch gefüllt und bleibt erhalten. Export als JSON/PDF. | lokal | Meldung (Entwurf/final) |
| **Management Summary** | Eine konsolidierte Fassung der fertigen Meldung für die Behördenleitung (Richtwert höchstens 150 bis 180 Wörter): Kernaussage in einem Satz, eigene Zeile „Bewertung & Tendenz“ mit den Werten aus der Meldung (bei mehreren Sachverhalten darunter je Sachverhalt ein Kurztitel mit Beurteilung und Tendenz), je Analysefeld des Profils höchstens zwei Sätze für die gesamte Lage, Fristen aus allen Kennsätzen „Handlungsrelevant bis:“ (vollständig bis zum Zeilenende ohne Quellenmarker und „Grundlage: …“, früheste zuerst, höchstens drei, vor dem Meldezeitpunkt abgelaufene als überfällig gekennzeichnet). Die Kopfzeile trägt bei nicht freigegebener Meldung den Vermerk „ENTWURF – Meldung nicht freigegeben“. Kurztitel werden nur bei passender Anzahl verwendet, sonst die Bezeichnungen der Meldung. Die KI erhält die Meldung ohne Quellenverzeichnis und eine Herkunftsliste (Nummer, Kategorie, Herausgeber, ohne URL) für sprechende Zuordnung. Ohne Recherche und ohne Neubewertung; Arbeitsanweisung `anweisungen.kurzfassung`, strukturierte Ausgabe; die App prüft Länge (Zielwert 150, Hinweis ab 180 Wörtern) und Satzlänge (Hinweis ab 30 Wörtern). Die Fassung entsteht nur auf Knopfdruck („Management Summary erstellen“), wird je Profil gespeichert und als veraltet markiert, sobald sich ihr Eingang ändert: Inhalt der Meldung, Herkunftsliste oder Arbeitsanweisung. Sie lässt sich von Hand leeren und wird automatisch geleert, wenn die Meldung in der Maske durch eine andere ersetzt wird (neue Meldung, Meldung öffnen, Übernahme eines KI-Entwurfs oder einer Meldung aus dem Lagebild) und wenn Meldungen an die KI-Verdichtung übergeben werden. Die Abschnitte der Fassung sind durch Leerzeilen getrennt. Ohne KI: Feldauszug als Klartext. | KI, mittleres Modell | Klartext zum Kopieren, TXT, Protokoll |

Jede Stufe wird mit Eingabe, Ausgabe, Modell, Tokens, Kosten und Dauer im Laufprotokoll gespeichert (PDF-Inhalte nur als Verweis). Kosten einer abgebrochenen oder fehlgeschlagenen Stufe gelten als nicht erfasst, außer es fehlte der API-Schlüssel und es wurde nichts gesendet (dann 0); der Lauf nennt in diesem Fall die erfassten Kosten als Untergrenze. Schlägt S2 fehl, lässt sich S2 mit dem bestätigten Gegenstand erneut starten.

**Umsetzung M2 (Stand 17.10.2026):** Anthropic Messages API mit Streaming (SSE), Fortsetzung bei `pause_turn`, Wiederholung bei Überlastung, Websuche `web_search_20250305` (lokalisiert, Höchstzahl einstellbar), Seitenabruf `web_fetch_20250910`, Prompt-Caching für Profilgrundlagen und SOP-Block, Aufwand (`effort`) je Stufe. Vorgaben: S1 claude-haiku-5-5 (seit 0.4.19 hoch, bis 16 000 Ausgabetoken), S2 claude-sonnet-5-5 (mittel, bis 128 000 Ausgabetoken; bei Abschneiden folgt eine Vervollständigung ohne Recherche), S3 claude-sonnet-5-5 (niedrig); das Profil kann andere Modelle vorgeben, die Einstellungen überschreiben beides.

### 5.2 Modul „Lagebild“ (Modus B)

- **Import** mehrerer Meldungen. Jede wird geprüft und gegebenenfalls migriert (profilgesteuert).
- **Ansichten:** Dashboard mit Meldestatus aus `kontakte.json`, Meldungen, Sachverhalte, Lagenradar je Sachverhalt (ohne Mittelwert), Rohtabelle, Redaktionscheck (A.3/A.4/A.7/A.8) und Kopiervorlage für Word.
- **Export:** PDF, CSV, Kopiervorlage.

**Umsetzung M4 (Stand 18.10.2026):** Übergabe aus dem Lagebild mit Auswahl und ausdrücklicher Rolle je Meldung („Als Eingang behandeln“ oder „Als Vormeldung behandeln“; eigene Meldungen vorab abgewählt, bei Auswahl als Vormeldung vorgeschlagen; nicht mögliche Rollen gesperrt und begründet; Rolle verbindlich bis S1/S2 und im Laufprotokoll). Eine Übergabe gilt nur für das Profil, unter dem sie entstand, und wird genau einmal übernommen; ein Profilwechsel verwirft eine noch nicht übernommene. Rolle „verdichtung“ mit eigenem Modell und Aufwand für S2, Arbeitsanweisung `anweisungen.verdichtung` aus dem Profil. Vor S1 und S2 erzeugt die App „Vermerke aus dem Redaktionscheck“ der Eingangsmeldungen (gleiche Logik wie das Lagebild, bezogen auf t0 und die nächste Ausgabe) und gibt sie als Arbeitshilfe mit. Nach S3 prüft sie, ob jede Eingangsmeldung im Quellenverzeichnis erkennbar ist. Vergleich mit einer Referenzfassung im Ergebnis (Zuordnung der Sachverhalte nach Ähnlichkeit, Kennzahlen je Achse ohne Gesamtwert), gespeichert im Laufprotokoll (`vergleich`), Export als CSV/JSON. OpenAI-Anbieter über die Responses API (Streaming, `web_search` mit `max_tool_calls`, Structured Outputs mit strengem Schema, `reasoning.effort`, `store: false`, PDF als `input_file`); Modelle gpt-6-luna, gpt-6.1-sol, gpt-6-astra; Auswahl des Anbieters nach Modellkennung, Schlüssel je Anbieter.

**Nacharbeiten nach Code-Review (18.10.2026):** Zwischenstände werden je Profil entprellt gespeichert und vor Profilwechsel oder Verlassen der Seite geschrieben; Speicherfehler werden angezeigt. Fehlerhafte Meldungen (falsche Datentypen, falsche Wurzel) werden vor der Übernahme gemeldet; eine Fehlergrenze mit Wiederherstellung fängt Darstellungsfehler ab. KI-Entwürfe tragen Land und meldende Stelle des Profils (Korrektur wird gemeldet). Schemaprüfung: `$ref` mit Geschwisterbedingungen, boolesche Ziele, strukturelle Gleichheit für `const`, `enum`, `uniqueItems`. Ungültige Datumsangaben in Kennsätzen werden verworfen. Eingangsmeldungen werden dem Quellenverzeichnis eins zu eins zugeordnet (Stelle, bei gleicher Stelle Uhrzeit, Kategorie A). Eigene Stelle nur bei exakter Übereinstimmung oder Alias (`eigene_stellen`), Einordnung im Material korrigierbar. Referenzvergleich mit Mindestähnlichkeit, nur beidseitig vorhandene Werte, manueller Zuordnung und Herkunftsangaben (Hash, Verfahren). SSE-Parser unabhängig von Chunk-Grenzen; CSV mit Schutz vor Formelinterpretation; eindeutige Namen gleichnamiger Dateien (Archivpfad); Strukturprüfung der Profile, Versionskonflikte mit Archiv; Wahrheitswerte und typisierte Auswahllisten im Formular; einheitliche Freigabeprüfung für finale JSON- und PDF-Ausgaben; Importgrenzen; laufende KI-Anfragen werden beim Profilwechsel abgebrochen.

**Umsetzung M3 (Stand 18.10.2026):** Ansicht „Lagebild“ (Name aus `ui.lagebild.titel`). Einlesen von JSON-Dateien und ZIP-Archiven; gleiche Dateiinhalte nur einmal; Migration und Schemaprüfung je Datei; Meldungen fremder Schemata werden an ihrer Grundform (Sachverhaltsliste plus Stelle oder Land) erkannt, bleiben aus den Auswertungen heraus und lassen sich an die KI-Erfassung übergeben. Der Stand wird je Profil im Gerät gespeichert. Übersicht mit Kennzahlen (Stufen aus `beurteilung_hoch`, Tendenz aus `tendenz_verschaerfung`), Meldestatus nach `kontakte.json` mit mailto-Erinnerung, Verteilungen. Redaktionscheck in fünf Abschnitten (Zeitfenster gegen die nächste Ausgabe, jede Zeile „Handlungsrelevant bis“ einzeln; Zusammenhang und abweichende Bewertungen je Ereignisart mit Textbaustein A.7.2, gegenläufige Tendenzen nur bei Entspannung und Verschärfung; Fortschreibung, Nachlauf, Abschluss und mehrere Meldungen derselben Stelle, leere oder offene Kennsätze als Befund; formale Vollständigkeit bei hoher Beurteilung; Quellen, Schema, Status, nicht prüfbare Quellenverweise als Warnung), Fundstellen aus `ui.lagebild.verweise`. Fristen, nächste Ausgabe (Datum, Uhrzeit optional) und Prüfzeitpunkt gelten in der Zeitzone des Profils (`variablen.zeitzone`); Uhrzeiten auch in der Form „um 8:00 Uhr“, ohne Uhrzeit gilt das Tagesende. Geprüft wird für „jetzt“ (laufend aktualisiert) oder einen gespeicherten Stichtag. Grenzfälle: Frist zeitgleich mit der Ausgabe ist zeitkritisch; eine Frist am Ausgabetag ohne bekannte Reihenfolge ist zu klären. Kopf mit Prüfstand, Zählung nach Einstufung (zeitkritisch, zu klären, Information; jeder Befund einzeln), Abdeckung (ausgewertete und fremde Meldungen, nicht konfigurierte Regeln, aus dem Schema abgeleitete Schwelle) und Sprungmarken je Abschnitt. Hohe Beurteilung ohne `beurteilung_hoch`: die beiden höchsten Stufen des Schemas, wie in den Kennzahlen. Jeder Befund führt zur Meldung in der Liste, ohne die Meldungsmaske zu ändern. Redaktionsbericht als TXT und JSON mit Prüfstand, Profilprüfsumme, Meldungen mit Inhaltskennung und allen Befunden. Rohtabelle und CSV generisch aus dem Schema (eine Zeile je Sachverhalt, eine Spalte je Radarachse). Kopiervorlage als Word-kompatibles HTML mit Farbquadraten und Radar als PNG. PDF mit Übersicht nach Schwere und allen Meldungen. Jede Meldung lässt sich in der Maske öffnen. Beispieldatensätze kommen aus dem Profil (`beispiele`).
- **KI-Verdichtung:**
  1. Die KI schlägt eine Gruppierung nach Sachverhalten vor (A.7.1). Die Person bestätigt oder korrigiert die Zuordnung.
  2. Die KI erstellt je Gruppe einen Sachverhalt der eigenen Meldung: Radar neu für den eigenen Referenzraum, Abweichungen als Kennsatz, Eingangsmeldungen als A-Quellen.
  3. Danach folgen S3 und S4 wie in Modus A.

### 5.3 Bibliothek

Lokale Ablage aller Meldungen, Läufe und Profile, mit Suche und Filter nach Profil, Status und Ereignisart. Teilen über das System-Teilen-Menü (Dateien, Mail, AirDrop).

### 5.4 Einstellungen

- Darstellung: Farbschema der Oberfläche – Automatisch (Standard, hell oder dunkel nach System, bei „mehr Kontrast“ das passende Kontrastschema), Neutral · Hell, Neutral · Night Mode, Kontrast · Hell, Kontrast · Dunkel (Text mindestens 7:1, kein Band), Bund, Bevölkerungsschutz, je ein Schema für jedes der 16 Länder, oder die Farben des aktiven Profils (`farbschema` in `profil.json` bzw. eigene Farben auf dem Gerät, an Profilschlüssel und Prüfsumme gebunden). Das Schema ändert nur Bildschirmfarben; Signalfarben der Bewertungen und das Lagenradar hängen nur von der Semantikbasis ab (hell, dunkel, Kontrast hell, Kontrast dunkel), erzwungene Systemfarben (`forced-colors`) gehen vor, Auswahl und Radarwerte sind nicht nur über Farbe erkennbar, Ausgaben (PDF, Word, CSV) behalten ihre Gestaltung. Katalog, Herkunft und Kontrastregeln: [farbschemas.md](farbschemas.md).
- API-Schlüssel je Anbieter.
- Modell und Aufwand (Effort) je Stufe; die Voreinstellungen kommen aus dem Profil.
- Kostenanzeige je Lauf auf Basis der Token-Zählung.
- Datenhinweis und Sprache.

## 6. Forschungsfunktionen

- **Laufprotokoll:** Profil-ID, Version und Hash; Modell-ID und Parameter; vollständige Prompts und Rohantworten; Tokens; Dauer. Exportierbar als JSON-Forschungsdatensatz.
- **`_entstehung`:** Das Beispielschema lässt nur die Felder `verfahren`, `werkzeug`, `modell`, `sop`, `kodierleitfaden` und `erstellt` zu. Die App setzt `werkzeug` auf „KI-LEAD 0.4.18 · Profil <id> <version> · Lauf <lauf-id>“, dazu `modell` und `erstellt`. `kodierleitfaden` setzt sie aus dem Kopf des Kodierleitfadens im Profil (Titel und „Fassung x.y“). In `sop` führt sie die tatsächlich beigefügten SOPs und Bausteine (Kennung mit gültiger Fassung, aus der zusammengestellten S2-Anfrage), unabhängig vom Antwortformat des Modells; das belegt den Kontext, nicht die fachliche Anwendung. Die Angabe des Modells zur Anwendung vergleicht sie damit und gibt Abweichungen als Prüfhinweis „SOP-Nachweis: …“ aus (fehlende Angabe, nicht beigefügte oder unbekannte Kennungen, beigefügte, aber nicht genannte). Prüfansicht, PDF, Lagebild-Karte und Rohtabelle/CSV („SOP (Entstehung)“) zeigen die gespeicherte Angabe; historische Kennungen bleiben unverändert. Die ausführliche Herkunft steht im Laufprotokoll, die Meldung verweist darauf.
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
2. **Quellen bei Verdichtung:** Vorläufig festgelegt (Arbeitsanweisung Verdichtung 1.0): Jede Eingangsmeldung ist eine A-Quelle; Primärquellen der Eingänge werden nur geführt, wenn sie selbst geprüft wurden. Offen ist, ob sich das in der Erprobung bewährt.
3. **`land`-Enum auf unteren Ebenen:** Für Kreis oder Einsatzstelle trägt `land` das Bundesland, `meldende_stelle` die Stelle. Zu prüfen ist, ob das für alle Ebenen genügt oder ob eine Ebene ein eigenes Schema braucht.
4. **Schema-Kompatibilität zwischen Ebenen:** Verwenden zwei Ebenen unterschiedliche Profilversionen, braucht die App eine Migrationsregel. Das Profilformat sieht dafür Migrationsregeln im Manifest vor.
5. **Arbeitsanweisung Modus B:** Fassung 1.0 im Beispielprofil seit 18.10.2026 (`anweisung-verdichtung.md`); Bewährung in der Abnahme M4 offen.
6. **Kosten und Laufzeiten** je Stufe im Pilot messen; danach die Modell-Voreinstellungen anpassen.

## 11. Änderungsverlauf

Fassungen der Spezifikation. Die Fassung folgt der App-Version, für die sie gilt; Korrekturen der Spezifikation ohne neue App-Funktion erhalten eine dritte Stelle.

| Fassung | Datum | Änderung |
|---|---|---|
| 0.1 | vor dem 17.10.2026 | Projektentwurf außerhalb des Repositorys |
| 0.2 | 17.10.2026 | Erste Fassung im Repository: Ziel, Grundsätze, Profilformat, Modus A (S0–S4), Modul Lagebild, Forschungsfunktionen, Architektur, Datenschutz, Meilensteine |
| 0.2 (fortgeschrieben) | 17.–18.10.2026 | Ohne neue Fassungsnummer ergänzt: Umsetzung M2 (Anbieter, Vorgaben, Laufprotokoll), Zeile Management Summary, vorläufige Verdichtung, t0, Vervollständigung bei Abschneiden, konsolidierte Leitungsfassung |
| 0.3 | 18.10.2026 | Umsetzung M3 (Lagebild, Redaktionscheck, Ausgaben) |
| 0.4 | 18.10.2026 | Umsetzung M4 (Verdichtung mit Redaktionsvermerken, Vergleich mit Referenzfassung, OpenAI) |
| 0.4.1 | 18.10.2026 | Nacharbeiten nach Code-Review; offene Punkte 2 und 5 fortgeschrieben; Änderungsverlauf und Verweis auf CHANGELOG.md eingeführt |
| 0.4.2 | 18.10.2026 | Rollenwahl je Meldung bei der Übergabe an die Verdichtung (Abschnitt 5.2, Umsetzung M4) |
| 0.4.3 | 18.10.2026 | PDF-Ausgaben enthalten das Lagenradar als Grafik neben den Achsenwerten |
| 0.4.4 | 18.10.2026 | PDF: Block „Freigabe & Versand“ am Ende; gegliederter Bewertungstext in PDF, Kopiervorlage und Lagebild-Tabelle |
| 0.4.5 | 18.10.2026 | Gegliederte Analysefelder in PDF, Kopiervorlage und Lagebild-Tabelle (Schlüsselsätze, Aufzählungen, kurze Aspektbegriffe) |
| 0.4.6 | 18.10.2026 | Management Summary: Erstellung nur auf Knopfdruck, Leeren von Hand und automatisch bei neuer oder ersetzter Meldung und bei Übergabe an die Verdichtung (Abschnitt 5) |
| 0.4.7 | 18.10.2026 | Management Summary: eigene Zeile „Bewertung & Tendenz“, Abschnitte durch Leerzeilen getrennt (Abschnitt 5) |
| 0.4.8 | 19.10.2026 | Quellenkategorien mit Rangfolge (`quellen.rangfolge`) im Profilbeispiel; Beispielprofil mit Betreiberkategorie B (A > B > W > M > P) und SOP-Sammelmappe 2.0 mit Bausteinen (Abschnitt 4) |
| 0.4.9 | 19.10.2026 | Modus-B-Regeln zu Fortgeltung, Zählen, Meldungsreihen und Quellenkategorie nach Rolle (Abschnitt 3); Management Summary mit allen Fristen, Entwurfsvermerk und Herkunftsliste (Abschnitt 5); `_entstehung` mit Kodierleitfaden-Fassung aus dem Profil (Abschnitt 6) |
| 0.4.10 | 19.10.2026 | SOP-Dateien je Abschnitt mit Kennungen B01–B17 und C01–C17; frühere IDs und Kennungen als Alias; Importprüfungen auf Text vor dem ersten Anker und doppelte IDs (Abschnitt 4) |
| 0.4.11 | 20.10.2026 | SOP-Nachweis in `_entstehung.sop` = beigefügte SOPs mit Abgleich der Modellangabe; gegliederte SOP-Auswahl, SOP-Angaben im Lagebild und CSV, SOP-Katalog als Lesehilfe (Abschnitte 5 und 6) |
| 0.4.12 | 20.10.2026 | Profilansicht: einspaltig, Aktivstatus im Kopf, Lesedokumente des Pakets, lesbare SOP-Darstellung mit Steckbrief, Versions-Tags und Suche, Nachfrage beim Profilwechsel während eines KI-Laufs (Abschnitt 4.6) |
| 0.4.13 | 20.10.2026 | Profilansicht: eigener Bereich „Arbeitsanweisungen und Kodierleitfaden“ mit Fassung und Zweck, Standardfassungen der App, Inhaltsverzeichnis, Einzeldownload (Abschnitt 4.6) |
| 0.4.14 | 20.10.2026 | Lesetexte der Profilansicht ohne nachgeladenen Renderer; Aufbereitungsfehler werden angezeigt (Abschnitt 4.6) |
| 0.4.15 | 20.10.2026 | Korrekturen aus dem Code-Review: Übergabe profilgebunden, Redaktionscheck mit allen Fristen, Management Summary veraltet auch bei geänderter Herkunft oder Anweisung, Kosten nicht erfasster Stufen als unbekannt (Abschnitte 5 und 5.2, Umsetzung M3/M4) |
| 0.4.16 | 20.10.2026 | Redaktionscheck: Zeitzone des Profils, Uhrzeit der Ausgabe, Echtzeit oder Stichtag, leere Kennsätze, nicht prüfbare Quellen, gegenläufige Tendenzen, gemeinsame Hoch-Schwelle, Prüfstand und Abdeckung, Redaktionsbericht (Umsetzung M3) |
| 0.4.17 | 20.10.2026 | Farbschemata der Oberfläche (Länder, Bund, Bevölkerungsschutz, neutral hell/dunkel, Profilfarben) (Abschnitt 5.4); Datum vorn in allen Dateinamen (Abschnitt 4.3) |
| 0.4.18 | 20.10.2026 | Barrierefreiheit der Darstellung: Kontrastschemata, Systemfarben und „mehr Kontrast“, Auswahl und Radarwerte nicht nur über Farbe (Abschnitt 5.4); Erfassung: Zeitfelder mit „Jetzt“, optionaler Uhrzeit und „Nur Tag“, Baukasten für Quellenzeilen (Abschnitt 5.1) |
| 0.4.19 | 20.10.2026 | S1: Aufwand „hoch“ und 16 000 Ausgabetoken als Vorgabe; t0-Absicherung bei Verdichtungen; Prüffrage aus S1 ohne Vorgabe im Auftrag nur als Vorschlag (Abschnitt 5.1, Umsetzung M2) |
| 0.4.20 | 20.10.2026 | Modellwahl je KI-Lauf (S1–S3, Management Summary); Laufprotokoll ab S1 exportierbar (Abschnitt 5.1) |

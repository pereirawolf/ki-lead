# KI-LEAD – Spezifikation des Forschungsdemonstrators

Fassung 0.5.10 vom 25.10.2026, Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“, Änderungen der App in [CHANGELOG.md](../CHANGELOG.md)

Lizenzen: Code unter EUPL-1.2 ([LICENSE](../LICENSE)); Beispielprofile, Evaluationsmaterial und Dokumentation unter CC BY 4.0, maschinenlesbare Dateien und die Vorlage zusätzlich unter CC0 1.0, mit den Ausnahmen in [LICENSE-CONTENT](../LICENSE-CONTENT). Begleitende Aufsätze außerhalb des Repositorys: CC BY-NC-ND 4.0.

Änderungen gegenüber 0.1: Lizenzaufteilung; Ausgabe „Management Summary“ als Klartext; eval-freie Schemaprüfung (Abschnitt 7); fiktiver Datensatz „Ilka“ als Abnahmegrundlage (Abschnitt 9).

---

## 1. Zweck und Abgrenzung

KI-LEAD ist ein Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und -darstellung). Die App erzeugt strukturierte Lagemeldungen nach einer hinterlegten Arbeitsanweisung, nach Standardvorgehensweisen (SOP) und nach einem Kodierleitfaden. Sie verdichtet außerdem eingehende Meldungen zu einer eigenen Meldung.

- **Kein Produktivsystem**, keine kommerzielle App.
- **Nur fiktive oder offen zugängliche Daten.** Keine personenbezogenen und keine eingestuften Inhalte (VS). Die App zeigt dazu einen Hinweis an.
- **Organisationsneutral.** Alles Organisationsspezifische steckt in einem austauschbaren Profilpaket (Abschnitt 4). Dazu gehören Schema, Kataloge, Stufentexte, Arbeitsanweisung, SOP, Kodierleitfaden und Kontakte. Die App selbst enthält nur die LEAD-Logik.
- **Privates Forschungsvorhaben:** Der Demonstrator ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Er nutzt nur eigene oder veröffentlichte Materialien. Die Abgrenzung steht im README und in der App unter „Einstellungen → Über KI-LEAD“.
- **Impressum und Kontakt:** auf der Website des Herausgebers ([pereirawolf.de/impressum.html](https://www.pereirawolf.de/impressum.html)), verlinkt aus dem README, aus dem Fuß der App und aus „Über KI-LEAD“. Die Links öffnen sich extern; die App ruft die Seite nicht selbst auf (Abschnitt 2). Rechtsgrundlage und Ergebnis der Prüfung: Abschnitt 10, Punkt 13.

## 2. Betriebsmodell

- **Plattformen:** iPadOS und iOS als native App (Capacitor). Dieselbe Codebasis läuft als Android-App und als PWA.
- **Lokal:** Profile, Meldungen, Läufe und Einstellungen liegen ausschließlich auf dem Gerät. Es gibt keine eigene Serverkomponente, kein Konto, keine Telemetrie und kein CDN. Alle Bibliotheken sind gebündelt.
- **Einzige Netzverbindungen:** die KI-Schnittstellen von Anthropic (Claude) und OpenAI. Websuche und URL-Abruf laufen über die serverseitigen Werkzeuge des jeweiligen Anbieters.
- **Eigener API-Schlüssel (BYOK):** Jede Person trägt ihren eigenen Schlüssel ein. Wo er liegt, wählt die Person: im Gerätespeicher der App (unverschlüsselt, mit Hinweis), nur für die laufende Sitzung oder in der nativen App im iOS-Keychain bzw. Android-Keystore. Mehrere gleichwertige Wege sichern, dass die App ohne einzelne Abhängigkeit nutzbar bleibt.

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
├── anweisung-verdichtung.md Arbeitsanweisung Modus B (optional; sonst Standardfassung der App)
├── anweisung-kurzfassung.md Management Summary (optional; sonst Standardfassung der App)
├── kodierleitfaden.md       (Pflicht)
├── sop/                     Sammelmappe und/oder Einzel-SOPs (optional, dringend empfohlen)
├── kontakte.json            Stellen und Adressen für Meldestatus und Erinnerung (optional)
└── beispiele/               Beispielmeldungen (JSON, z. B. fiktive Lage), im Lagebild ladbar, gehen nicht an KI-Modelle (optional)
```

### 4.2 Manifest `profil.json` (Beispielprofil, Auszug)

```json
{
  "format": "lead-profil/1",
  "id": "lead.beispiel.koordinierungsstelle",
  "name": "LEAD-Beispiel – Koordinierungsstelle",
  "version": "1.26.0",
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
    "schema_id": "LEAD-Meldung-v1",
    "eingang_schema_ids": ["LEAD-Meldung-v1"]
  },
  "anweisungen": {
    "erfassung": "anweisung-erfassung.md",
    "kurzfassung": "anweisung-kurzfassung.md",
    "verdichtung": "anweisung-verdichtung.md"
  },
  "sop": { "dateien": ["sop/A_Gemeinsame-Regeln.md", "sop/teil-b/B01_unwetter-sturm.md", "…", "sop/teil-c/C17_zivile-verteidigung-zivile-folgen.md"], "teil_gemeinsam": "teil-a" },
  "kodierleitfaden": "kodierleitfaden.md",
  "kontakte": "kontakte.json",
  "modelle": {
    "vorverarbeitung": "claude-haiku-5-5",
    "erfassung": "claude-opus-5-5",
    "verdichtung": "claude-opus-5-5"
  }
}
```

### 4.3 Darstellungsdatei `meldung.ui.json` (Auszug)

Die App leitet Ereignisartenkatalog, Länderliste und zulässige Werte direkt aus den Enums des Schemas ab. Die UI-Datei enthält nur, was das Schema nicht trägt.

```json
{
  "format": "lead-ui/1",
  "schritte": [ { "id": "meta", "titel": "Meldungsmetadaten", "felder": ["land", "meldende_stelle", "meldezeitpunkt", "meldezeitraum"] }, "…" ],
  "felder": {
    "sachverhalte[].art": { "label": "Art", "widget": "mehrfachauswahl" },
    "sachverhalte[].sofort.beurteilung": { "label": "Bewertung", "widget": "radio", "leer_label": "keine Angabe" },
    "sachverhalte[].sofort.lagenradar": { "label": "Lagenradar", "widget": "radar", "radar": "lagenradar" }
  },
  "radare": {
    "lagenradar": {
      "max": 6,
      "achsen": [
        { "key": "d1", "label": "D1 Räumliche Auswirkung / Impact-Raum",
          "stufen": ["punktuell/kleinflächig", "kommunal", "überörtlich (mehrere Kommunen/Kreis)",
                     "regional (mehrere Kreise/Region)", "landesweit", "bundesweit", "international"] }
      ]
    }
  },
  "rollen": { "status_feld": "_status", "entstehung_feld": "_entstehung", "quellen": "quellen", "sachverhalte": "sachverhalte", "…": "…" },
  "kennsaetze": { "neubewertung": "Neubewertung bei:", "handlungsrelevant": "Handlungsrelevant bis:", "aenderung": "Änderung zur Vormeldung:",
                  "abweichung": "Abweichende Bewertung:", "abschluss": "Abschluss im Lagebild:" },
  "quellen": {
    "kategorien": { "A": "amtlich/zwischenstaatlich – …", "B": "Betreiber – …", "W": "wissenschaftlich – …", "M": "Medien – …", "P": "sonstige private Quellen – …" },
    "rangfolge": ["A", "B", "W", "M", "P"]
  },
  "dateiname": "LEAD-Meldung_{land}_{meldende_stelle}_{meldezeitpunkt}"
}
```

Vollständige Beschreibung aller Abschnitte (u. a. `titel`, `ausblenden`, `lagebild`, `bewertung_gliederung`, `analyse_gliederung`, `kurzfassung`, `feldhilfen`): [PROFILFORMAT.md](PROFILFORMAT.md), „Darstellungsdatei“.

**Dateinamen:** Alle Downloads beginnen mit dem Datum, damit sie im Ordner zeitlich sortiert stehen: `2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_ENTWURF.pdf`. Bei Meldungen und daraus abgeleiteten Dateien (Management Summary, Feldauszug, Protokoll) ist es der Meldezeitpunkt (Rolle `meldezeitpunkt`), ohne ihn der Exportzeitpunkt. Den Platzhalter `{meldezeitpunkt}` setzt die App unabhängig von seiner Stelle in der Vorlage nach vorn; ältere Vorlagen müssen nicht geändert werden. Lagebild-PDF und -CSV tragen den Exporttag (`2026-10-20_Lagebild.pdf`), Redaktionsbericht, Notfallsicherung, Profilpaket und Lesetexte den Exportzeitpunkt, Laufprotokoll und Vergleich ihren Erstellungszeitpunkt, jeweils in der Zeitzone des Profils. Lauf-IDs, Paketinhalte und Originalnamen bleiben unverändert hinter dem Datum.

### 4.4 Arbeitsanweisungen mit Platzhaltern

Die Arbeitsanweisungen sind Markdown-Dateien mit Platzhaltern, die die App vor dem Aufruf ersetzt:

- `{{profil.*}}` – Variablen aus dem Manifest (z. B. `{{profil.meldende_stelle}}`, `{{profil.referenzraum}}`)
- `{{auftrag.*}}` – die Auftragsfelder aus der Eingabemaske (Sachverhalt/Erkenntnisinteresse, Ausgangsquellen, Stichtag, Prüffrage, Ereignisart/SOP)
- `{{jetzt}}` – tatsächlicher Bearbeitungszeitpunkt in der Zeitzone des Profils (die Uhrzeit des KI-Aufrufs, nie der Meldezeitpunkt t0; seit 0.4.28)

**Hinweise für eigene Arbeitsanweisungen:**
- Die technische Grundlage bilden das beigefügte JSON-Schema und die Darstellungsdatei, nicht eine HTML-Maske.
- Ebene und meldende Stelle stehen als Platzhalter in der Anweisung. Dieselbe Anweisung trägt so jede Ebene.
- Für Modus B (Verdichtung) gibt es eine eigene Arbeitsanweisung nach Abschnitt 3 dieser Spezifikation.

### 4.5 SOP-Erkennung

Die App zerlegt jede Datei aus `sop.dateien` an ihren Ankern (`<a id="teil-a">`, `<a id="b01">`); ohne Anker gilt eine Datei als eine SOP. Aus dem YAML-Kopf liest sie u. a. `kennung`, `lageart`, `art_vorschlag`, `version`, `typ`, `lesegruppe`, `status`, `bisherige_ids` und `bisherige_kennung` (Einzelheiten: [PROFILFORMAT.md](PROFILFORMAT.md), „SOP-Dateien“). Der in `sop.teil_gemeinsam` genannte Abschnitt (Teil A) wird immer mitgegeben. In Stufe 2 werden nur die in Stufe 1 gewählten SOPs mitgegeben.

### 4.6 Profilverwaltung

- Import als ZIP oder Ordner (Dateien-App, AirDrop, Teilen-Menü), Export als ZIP.
- Beim Import prüft die App: Pflichtdateien vorhanden, Schema gültig, `ui.json` passt zum Schema, SOP-Anker erkennbar.
- Optional prüft sie, ob die Stufentexte in `ui.json` mit der Tabelle in Abschnitt 2 des Kodierleitfadens übereinstimmen. Weichen sie ab, gibt es einen Hinweis, aber keinen Abbruch.
- Jede Profilversion wird mit einem Hash ihrer Dateien gespeichert. Ältere Versionen bleiben erhalten, damit jedes Ergebnis seiner Regelgrundlage zugeordnet bleibt.
- Ein Update ersetzt einzelne Dateien manuell. Das ist der Weg für inhaltliche Fortschreibungen der Systematik. Die App zeigt dabei an, was sich geändert hat.
- Mitgeliefert werden das Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“ und die „Vorlage – eigene Organisation“ (`profile/muster/`, schlankes Schema, Gerüst mit Platzhaltern, CC0 1.0). Eigene Profile können lokal im nicht eingecheckten Ordner `privat/profile/` liegen.
- Die Profilansicht ist eine reine Leseansicht und zeigt die Profile untereinander. Im Kopf jeder Karte stehen der Name, beim verwendeten Profil die grüne Marke „✓ In Verwendung“, bei den übrigen der Knopf „Verwenden und Meldung öffnen“. Nur dieser Knopf aktiviert ein Profil. Darunter folgen Profilversion und Herkunft, Metadaten (Ebene, Referenzraum, Schema, SOPs und Bausteine, Herausgeber, Lizenz) und die Prüfsumme; sie ist kopierbar und lässt sich vollständig anzeigen.
- „Arbeitsanweisungen und Kodierleitfaden“ zeigt die vier Arbeitsgrundlagen in der Reihenfolge Erfassung, Verdichtung, Kurzfassung, Kodierleitfaden. Jede Zeile hat einen Zwecksatz und ein Tag mit der eigenen Fassung aus dem Kopfabsatz des Dokuments („Fassung nicht angegeben“, wenn keine erkennbar ist). Pfade kommen aus dem Manifest, Texte aus dem geladenen Paket. Fehlt einem Profil die Verdichtung oder die Kurzfassung, zeigt die Zeile die Standardfassung der App, die dann tatsächlich verwendet wird, gekennzeichnet als „kein Bestandteil des Profils“. Ein geöffnetes Dokument nennt Datei, Fassung, Stand und Profilversion. Bei Arbeitsanweisungen erklärt ein Hinweis, dass die App die hervorgehobenen Platzhalter erst beim KI-Lauf einsetzt.
- „Dokumentation lesen“ zeigt Übersicht und Änderungsverlauf der SOP-Sammlung sowie Beschreibung und Änderungsverlauf des Profils, jeweils nur, wenn vorhanden. Alle Lesetexte mit mindestens vier Überschriften (zweite und dritte Ebene) erhalten ein aufklappbares Inhaltsverzeichnis mit Sprüngen innerhalb des geöffneten Texts. Die Originaldatei lässt sich einzeln herunterladen; „Quelltext anzeigen“ zeigt die unveränderte Datei des Pakets. „SOP-Katalog lesen“ zeigt Teil A, die Dach-SOPs und die Leseblöcke der Bausteine. Jede Zeile trägt Kennung und Kurzname sowie ein neutrales Tag mit der Fassung des Dokuments (Teil A: „gilt immer“). Eine Suche findet Einträge über Kennung, Name und frühere Kennung, auf Wunsch auch im Text. Ein geöffneter Eintrag zeigt einen Steckbrief aus dem Kopf und den Text mit Tabellen. Rohes HTML wird nicht ausgeführt, Bilder werden nicht geladen. Der Renderer ist Teil der App und wird nicht nachgeladen; scheitert die Aufbereitung, nennt die Ansicht den Fehler und zeigt den Quelltext. Relative Links öffnen den Eintrag im selben Paket, nicht mitgelieferte Ziele sind als „nicht im Paket“ gekennzeichnet. Der Quelltext bleibt abrufbar.
- Jedes Profil hat seinen eigenen Meldungs-Zwischenstand, der beim Wechsel erhalten bleibt. Läuft gerade ein KI-Auftrag, fragt die App vor dem Wechsel nach, weil der Wechsel den Lauf abbricht. Nach einem Import nennt die App Name und Version des Profils und ob es schon in Verwendung ist, und bietet „Jetzt verwenden“ an.

## 5. Funktionen

### 5.1 Modul „Meldung“ (Modus A, gestuft nach LEAD)

| Stufe | Inhalt | Ausführung | Ergebnis |
|---|---|---|---|
| **S0 Vorverarbeitung** | TXT/MD lesen, Text aus DOCX (eigener Leser für word/document.xml) ziehen, PDF unverändert als Dokument an das Modell geben. JSON prüfen: Ist es eine Meldung des Profils, gilt sie als Vormeldung zur Fortschreibung (A.8). URLs stehen im Nutzertext, damit das Abrufwerkzeug sie verwenden darf. | lokal | Eingangsmaterial |
| **S1 Gegenstand & SOP-Auswahl** | Vor dem Start lassen sich Modell und Aufwand für S1, S2 und S3 sowie bei Recherche die Höchstzahl der Websuchen für diesen Lauf abweichend von den Einstellungen wählen; das Laufprotokoll ist ab S1 exportierbar. Sachverhalt, Stichtag, Referenzraum-Bezug, Horizont (A.1). Ereignisarten aus dem Katalog, SOPs inkl. Mischlage und Abgrenzung. Strukturierte Ausgabe (`output_config.format`) mit Enums aus Schema und SOP-Katalog. Die App sichert zwei Felder ab. **t0** (seit 0.4.28 in fester Reihenfolge, Abweichungen vom S1-Vorschlag unter „Hinweise der App“; maßgeblich ist der Stichtag aus dem Auftrag, ein abweichender Stichtag aus S1 wird genannt; „heute“ gilt in der Zeitzone des Profils, auch für den vorbelegten Stichtag der Maske): (1) ein gültiges t0 aus dem Auftrag gilt, auch zurückliegend; (2) bei einer Verdichtung (Eingänge vorhanden) setzt die App t0 auf den jüngsten Eingang, wenn der Vorschlag davor oder mehr als 24 Stunden danach liegt (A.7); liegt zugleich eine eigene Vormeldung bei und landet t0 vor dem heutigen Stichtag, weist sie darauf hin; (3) bei Fortschreibung einer eigenen Vormeldung mit heutigem Stichtag ist t0 die aktuelle Zeit, der Stand der Vormeldung bleibt Ausgangspunkt (Hinweis, wenn der Vorschlag mehr als 15 Minuten abweicht); (4) sonst gilt bei heutigem Stichtag der Vorschlag, wenn er heute und nicht in der Zukunft liegt, andernfalls die aktuelle Zeit; (5) bei zurückliegendem Stichtag gilt der Vorschlag (Hinweis, wenn er nicht am Stichtag liegt), ein Stichtag in der Zukunft wird zur Prüfung gestellt. Einen Vorschlag in der Zukunft ersetzt die App durch die aktuelle Zeit; Ausnahmen sind eine Vorgabe im Auftrag und eine Verdichtung, deren jüngster Eingang selbst nach der aktuellen Zeit liegt. Kalendertag und Uhrzeit werden echt geprüft; ein unvollständiges t0 sperrt S2 im Bestätigungsschritt. Nach der Bestätigung korrigiert die App t0 nicht mehr. S1 erfährt den Recherchemodus aus dem Auftrag. Nennt der Auftrag keine Prüffrage, bleibt eine von S1 vorgeschlagene Prüffrage ein Vorschlag, den die Person übernehmen kann. | KI, kleines Modell | strukturierter Vorschlag; **Person bestätigt oder ändert** |
| **S2 Recherche & Entwurf** | Recherche nach den Bausteinen R1 ff. der gewählten SOPs und Bausteine mit Websuche und Seitenabruf. Seit 0.4.28 steht zuletzt im Systemauftrag die „Steuerung durch die App (verbindlich)“: Bearbeitungszeitpunkt, t0, Stichtag, Stand einer eigenen Vormeldung und der Recherchemodus aus dem Auftrag (erlaubt mit den wirksamen Höchstzahlen, nur Material, oder erlaubt ohne verfügbare Werkzeuge). Sie geht Angaben in Gegenstand, Vormeldung und Material vor; Werkzeuge werden nur bei erlaubter Recherche mit Höchstzahl über 0 angeboten. Seit 0.4.30 nennt der Block, dass das Abrufwerkzeug nur Adressen aus Auftrag oder Material, aus Suchergebnissen und von bereits abgerufenen Seiten öffnet (Vorgabe des Anbieters), und verlangt, andere Seiten zuerst über die Websuche zu finden. Ein ungültiges t0 bricht vor dem Aufruf ab. Die Vervollständigung in S3 erhält den Steuerungsblock nicht (sie recherchiert nicht), wohl aber t0 und Bearbeitungszeitpunkt. Redaktionsvermerke erhält S2 auch bei einer eigenen Vormeldung. Entwurf aller Felder, Radar Achse für Achse, Quellenverzeichnis. Ausgabe als Kurzantwort plus JSON-Codeblock (Ausgabevertrag der App), weil die strukturierte Ausgabe der API Schlüsselwörter wie `minLength` oder `if/then` nicht trägt. | KI, mittleres Modell, Websuche | JSON-Entwurf und Kurzantwort |
| **S3 Prüfung & Reparatur** | Die App setzt Schemakennung, Status „Entwurf“, Profilvariablen und `_entstehung`. Land und meldende Stelle stammen seit 0.4.30 aus der eigenen Vormeldung, wenn eine beiliegt (meldende Stelle = Stelle des Profils oder hinterlegter Zweitname; bei mehreren die jüngste), sonst aus dem Profil; eine als Vormeldung gewählte Meldung einer anderen Stelle ändert den Absender nicht (Warnung `VORMELDUNG_FREMDE_STELLE`, abweichende eigene Vormeldungen: Hinweis `VORMELDUNG_ABSENDER_ABWEICHEND`). Der Bestätigungsschritt und der Steuerungsblock nennen den Absender und seine Herkunft. Danach Schemaprüfung (eigener Prüfer, 2020-12), Quellenprüfung, Kennsätze und Ausfüllhinweise. Liegt das Lagenradar eindeutig eine Ebene zu hoch, setzt die App es vor der Prüfung an die vorgesehene Stelle und vermerkt das (seit 0.4.21). Konnte die Seite einer Auftrags-URL nicht abgerufen werden, warnt das Ergebnis und rät, den Inhalt als PDF oder Text beizufügen. Befunde zur Recherche (seit 0.4.28, mit `code`): `FORTSCHREIBUNG_OHNE_AKTUALISIERUNG` (Warnung) bei eigener Vormeldung, erlaubter Recherche und weder Websuche noch erfolgreichem Seitenabruf in S2 (Zähler des Anbieters oder dokumentierte Werkzeugblöcke, der höhere Wert gilt); `FORTSCHREIBUNG_RECHERCHE_NICHT_NACHWEISBAR` (Hinweis), wenn Nutzungszähler fehlen und auch keine Werkzeugblöcke dokumentiert sind; `RECHERCHE_NICHT_VERFUEGBAR` (Hinweis), wenn Recherche erlaubt war, beide Höchstzahlen aber 0 sind. Kein automatischer Folgeaufruf. Bei Schemafehlern höchstens zwei Reparaturaufrufe ohne Werkzeuge und ohne neue Recherche. | lokal und KI | geprüfter Entwurf mit Prüfbericht |
| **S4 Redaktion & Freigabe** | Formular aus Schema und `ui.json` (Radar, Mehrfachauswahl, Quellen-Editor mit Baukasten für neue Zeilen aus Kategorie, Art und Zusätzen, auch aus Meldungen des gespeicherten Lagebilds; Zeitfelder mit „Jetzt“, „Nur Tag“ und „Leeren“). Unter den Analysefeldern und dem Text „Bewertung & Tendenz“ ein zugeklappter Bereich „LEAD-Eingabehilfen“ (seit 0.4.24): Schaltflächen fügen vorhandene Satzanfänge und Kennsätze aus der Darstellungsdatei (`feldhilfen`) als Vorlage mit offenen Stellen ⟦…⟧ ein, ohne KI und ohne Netzwerkanfrage; es ändert sich nur der Text dieses Feldes, „Einfügung rückgängig“ stellt den vorherigen Wert wieder her. Offene Stellen ergeben Ausfüllhinweise, zählen im Redaktionscheck nicht als Vermerk und erscheinen nicht in der Management Summary. Das Feld `_entstehung` wird automatisch gefüllt und bleibt erhalten. Export als JSON/PDF. | lokal | Meldung (Entwurf/final) |
| **Management Summary** | Eine konsolidierte Fassung der fertigen Meldung für die Behördenleitung (Richtwert höchstens 150 bis 180 Wörter): Kernaussage in einem Satz, eigene Zeile „Bewertung & Tendenz“ mit den Werten aus der Meldung (bei mehreren Sachverhalten darunter je Sachverhalt ein Kurztitel mit Beurteilung und Tendenz), je Analysefeld des Profils höchstens zwei Sätze für die gesamte Lage, Fristen aus allen Kennsätzen „Handlungsrelevant bis:“ (vollständig bis zum Zeilenende ohne Quellenmarker und „Grundlage: …“, früheste zuerst, höchstens drei, vor dem Meldezeitpunkt abgelaufene als überfällig gekennzeichnet). Die Kopfzeile trägt bei nicht freigegebener Meldung den Vermerk „ENTWURF – Meldung nicht freigegeben“. Kurztitel werden nur bei passender Anzahl verwendet, sonst die Bezeichnungen der Meldung. Die KI erhält die Meldung ohne Quellenverzeichnis und eine Herkunftsliste (Nummer, Kategorie, Herausgeber, ohne URL) für sprechende Zuordnung. Ohne Recherche und ohne Neubewertung; Arbeitsanweisung `anweisungen.kurzfassung`, strukturierte Ausgabe; die App prüft Länge (Zielwert 150, Hinweis ab 180 Wörtern) und Satzlänge (Hinweis ab 30 Wörtern). Die Fassung entsteht nur auf Knopfdruck („Management Summary erstellen“), wird je Profil gespeichert und als veraltet markiert, sobald sich ihr Eingang ändert: Inhalt der Meldung, Herkunftsliste oder Arbeitsanweisung. Sie lässt sich von Hand leeren und wird automatisch geleert, wenn die Meldung in der Maske durch eine andere ersetzt wird (neue Meldung, Meldung öffnen, Übernahme eines KI-Entwurfs oder einer Meldung aus dem Lagebild) und wenn Meldungen an die KI-Verdichtung übergeben werden. Die Abschnitte der Fassung sind durch Leerzeilen getrennt. Ohne KI: Feldauszug als Klartext. | KI, mittleres Modell | Klartext zum Kopieren, TXT, Protokoll |

Jede Stufe wird mit Eingabe, Ausgabe, Modell, Tokens, Kosten und Dauer im Laufprotokoll gespeichert (PDF-Inhalte nur als Verweis). Kosten einer abgebrochenen oder fehlgeschlagenen Stufe gelten als nicht erfasst, außer es fehlte der API-Schlüssel und es wurde nichts gesendet (dann 0); der Lauf nennt in diesem Fall die erfassten Kosten als Untergrenze. Schlägt S2 fehl, lässt sich S2 mit dem bestätigten Gegenstand erneut starten.

**Umsetzung M2 (Stand 17.10.2026):** Anthropic Messages API mit Streaming (SSE), Fortsetzung bei `pause_turn`, Wiederholung bei Überlastung, Websuche `web_search_20250305` (lokalisiert, Höchstzahl einstellbar), Seitenabruf `web_fetch_20250910`, Prompt-Caching für Profilgrundlagen und SOP-Block, Aufwand (`effort`) je Stufe. Vorgaben: S1 claude-haiku-5-5 (seit 0.4.19 hoch; Denk- und Antworttoken zählen gemeinsam. Endet S1 an der Grenze ohne vollständigen, strukturell geprüften Vorschlag, bricht der Lauf mit Nennung von Grenze, Modell und Aufwand ab, ohne automatische Wiederholung; ein vollständiger Vorschlag an der Grenze geht mit Prüfhinweis zur Bestätigung), S2 Erfassung claude-opus-5-5 (seit 0.4.21, mittel; bei Abschneiden folgt eine Vervollständigung ohne Recherche), S2 Verdichtung claude-sonnet-5-5 (mittel; das Beispielprofil gibt claude-opus-5-5 vor), S3 claude-sonnet-5-5 (niedrig); das Profil kann andere Modelle vorgeben, die Einstellungen überschreiben beides. Die Höchstzahl Ausgabetoken stellt „Einstellungen › Recherche › Höchstzahl Ausgabetoken (S1, S2, S3)“ für jeden KI-Aufruf ein (S1, S2, S3, Management Summary; Vorgabe 128 000, 8 000–128 000; seit 0.4.26, vorher galt sie nur für S2 und S3). Vor jedem Start nennt die App voraussichtliche Dauer und Kosten je Stufe nach Modell und Aufwand: gemessene Spannen aus den Testläufen vom 18. bis 21.10.2026 und der Abnahme M4 vom 23.10.2026, auch für gpt-6-luna und gpt-6-astra (vorsichtig gerundet, `src/pipeline/schaetzung.ts`), für nicht gemessene Kombinationen nur die über den Listenpreis hochgerechneten Kosten, gekennzeichnet als „grob, ohne Messwert“.

### 5.2 Modul „Lagebild“ (Modus B)

- **Import** mehrerer Meldungen. Jede wird geprüft und gegebenenfalls migriert (profilgesteuert).
- **Ansichten:** Dashboard mit Meldestatus aus `kontakte.json`, Meldungen, Sachverhalte, Lagenradar je Sachverhalt (ohne Mittelwert), Rohtabelle, Redaktionscheck (A.3/A.4/A.7/A.8) und Kopiervorlage für Word.
- **Export:** PDF, CSV, Kopiervorlage. Gegliederte Ausgaben (PDF, Kopiervorlage) brechen eine Kennsatzzeile nicht an Signal-Satzanfängen um; ein Kennsatz reicht bis zum Zeilenende. Das PDF verwendet die Standardschrift (Windows-1252) und ersetzt andere Zeichen lesbar, etwa „→“ durch „->“ und „⟦…⟧“ durch „[[…]]“ (seit 0.4.29).

**Umsetzung M4 (Stand 18.10.2026):** Übergabe aus dem Lagebild mit Auswahl und ausdrücklicher Rolle je Meldung („Als Eingang behandeln“ oder „Als Vormeldung behandeln“; eigene Meldungen vorab abgewählt, bei Auswahl als Vormeldung vorgeschlagen; nicht mögliche Rollen gesperrt und begründet; Rolle verbindlich bis S1/S2 und im Laufprotokoll). Eine Übergabe gilt nur für das Profil, unter dem sie entstand, und wird genau einmal übernommen; ein Profilwechsel verwirft eine noch nicht übernommene. Rolle „verdichtung“ mit eigenem Modell und Aufwand für S2, Arbeitsanweisung `anweisungen.verdichtung` aus dem Profil. Vor S1 und S2 erzeugt die App „Vermerke aus dem Redaktionscheck“ der Eingangsmeldungen und seit 0.4.28 auch einer eigenen Vormeldung (gleiche Logik wie das Lagebild, bezogen auf t0 und die nächste Ausgabe) und gibt sie als Arbeitshilfe mit. Nach S3 prüft sie, ob jede Eingangsmeldung im Quellenverzeichnis erkennbar ist. Vergleich mit einer Referenzfassung im Ergebnis (Zuordnung der Sachverhalte nach Ähnlichkeit, Kennzahlen je Achse ohne Gesamtwert), gespeichert im Laufprotokoll (`vergleich`), Export als CSV/JSON. OpenAI-Anbieter über die Responses API (Streaming, `web_search` mit `max_tool_calls`, Structured Outputs mit strengem Schema, `reasoning.effort`, `store: false`, PDF als `input_file`); Modelle gpt-6-luna, gpt-6.1-sol, gpt-6-astra; Auswahl des Anbieters nach Modellkennung, Schlüssel je Anbieter.

**Nacharbeiten nach Code-Review (18.10.2026):** Zwischenstände werden je Profil entprellt gespeichert und vor Profilwechsel oder Verlassen der Seite geschrieben; Speicherfehler werden angezeigt. Fehlerhafte Meldungen (falsche Datentypen, falsche Wurzel) werden vor der Übernahme gemeldet; eine Fehlergrenze mit Wiederherstellung fängt Darstellungsfehler ab. KI-Entwürfe tragen Land und meldende Stelle des Profils (Korrektur wird gemeldet). Schemaprüfung: `$ref` mit Geschwisterbedingungen, boolesche Ziele, strukturelle Gleichheit für `const`, `enum`, `uniqueItems`. Ungültige Datumsangaben in Kennsätzen werden verworfen. Eingangsmeldungen werden dem Quellenverzeichnis eins zu eins zugeordnet (Stelle, bei gleicher Stelle Uhrzeit, Kategorie A). Eigene Stelle nur bei exakter Übereinstimmung oder Alias (`eigene_stellen`), Einordnung im Material korrigierbar. Referenzvergleich mit Mindestähnlichkeit, nur beidseitig vorhandene Werte, manueller Zuordnung und Herkunftsangaben (Hash, Verfahren). SSE-Parser unabhängig von Chunk-Grenzen; CSV mit Schutz vor Formelinterpretation; eindeutige Namen gleichnamiger Dateien (Archivpfad); Strukturprüfung der Profile, Versionskonflikte mit Archiv; Wahrheitswerte und typisierte Auswahllisten im Formular; einheitliche Freigabeprüfung für finale JSON- und PDF-Ausgaben; Importgrenzen; laufende KI-Anfragen werden beim Profilwechsel abgebrochen.

**Umsetzung M5, Teil PWA (Stand 23.10.2026, 0.5.0):** Web-App-Manifest (`public/manifest.webmanifest`: Name, relativer Start und Bereich `./`, eigenständige Anzeige, Symbole 192, 512, maskierbar und SVG; Lagenradar in den Farben des BBK-Farbschemas, Ausprägung nach Tief „Bernd“ 2021, siehe [app-symbol.md](app-symbol.md)) und Service Worker ohne zusätzliche Abhängigkeit. Der Build erzeugt `sw.js` aus `src/pwa/sw-vorlage.js` mit der Liste aller ausgelieferten Dateien (ohne Quellkarten) und einer Version aus App-Version und Prüfsumme über Dateinamen und ungehashte Inhalte. Der Service Worker hält bei der Installation alle Dateien vor, beantwortet Seitenaufrufe mit der vorgehaltenen `index.html` und eigene Dateien aus dem Cache; Anfragen an andere Adressen (KI-Anbieter) und andere Methoden als GET fängt er nicht ab und speichert sie nie. Eine neue Fassung wartet, bis die Person im Hinweis „Neu laden“ wählt oder alle Fenster geschlossen sind; der automatisch gesicherte Zwischenstand bleibt dabei erhalten. Ohne Netz zeigt ein Hinweis, was weiter funktioniert (Meldungen, Lagebild, Profile, Ausgaben) und was eine Verbindung braucht (KI-Funktionen). Anmeldung nur im Produktionsbuild, im sicheren Kontext und nicht in der nativen App. Geprüft im Browsertest: Offline-Start nach dem ersten Besuch, Beispiel im Lagebild und PDF-Ausgabe ohne Netz, keine Anfrage nach außen. Offen für M5: native Builds (Capacitor), Schlüssel im Keychain bzw. Keystore, Abnahme auf iPad, iPhone und Android.

**Umsetzung M5, Teil native Apps (Stand 23.10.2026, 0.5.1):** Capacitor 8.5 (MIT) mit App-Kennung `de.pereirawolf.kilead`; Projektordner `ios/` (Swift Package Manager) und `android/` im Repository, Versionen aus `package.json` (Buildnummer 0.5.1 → 501). Ablage der API-Schlüssel wählbar unter „Einstellungen“: Gerätespeicher der App (Vorgabe, wie bisher), nur für diese Sitzung oder Schlüsselbund des Systems (nur nativ; Präfix `ki-lead.`, ohne iCloud-Synchronisierung, unter iOS nur dieses Gerät und entsperrt). Ein Wechsel schreibt zuerst in die neue Ablage und entfernt dann aus der alten; scheitert das Schreiben, bleibt alles unverändert. Eine gespeicherte, hier nicht verfügbare Wahl fällt auf den Gerätespeicher zurück. Android schließt App-Daten von der Sicherung aus; iOS erklärt Standardverschlüsselung. App-Symbole und Startbildschirme sind festgeschrieben, Vorlage `public/icons/icon.svg` (seit dem Nachtrag vom 23.10.2026 zu 0.5.3; zuvor erzeugt von `scripts/app-symbol.py`). Anleitung und Abnahmepunkte: [NATIV.md](NATIV.md). Offen: Übersetzen der nativen Builds, TestFlight, Abnahme auf Geräten.

**Korrektur M5, Update der PWA (Stand 23.10.2026, 0.5.2):** Der Service Worker lädt bei der Installation am HTTP-Cache vorbei und installiert nur eine stimmige Fassung: `index.html` muss auf Dateien genau dieser Fassung verweisen, sonst scheitert die Installation und die bisherige bleibt. Eine abgebrochene Installation entfernt ihren Cache. Der Service Worker übernimmt nie von sich aus und lädt keine Fenster neu; eine neue Fassung wird aktiv mit „Neu laden“ (nur dieses Fenster lädt neu) oder wenn alle Fenster geschlossen sind, bei nachweislich gescheitertem Start auch über „Erneut laden“ der Startprüfung. Die Reparaturseite `reparatur.html` (eigenständig, ohne App-Bundle) entfernt nach Betätigung nur die Registrierung dieses Bereichs und die Caches mit dem Präfix `ki-lead-`; IndexedDB und localStorage bleiben unberührt. Eine Startprüfung ohne Abhängigkeit vom App-Bundle und eine Fehlergrenze an der Wurzel ersetzen leere Seiten durch einen Hinweis. Hintergrund, Grenzen und Schritte für Betroffene: [STARTPROBLEME.md](STARTPROBLEME.md).

**Umsetzung M3 (Stand 18.10.2026):** Ansicht „Lagebild“ (Name aus `ui.lagebild.titel`). Einlesen von JSON-Dateien und ZIP-Archiven; gleiche Dateiinhalte nur einmal; Migration und Schemaprüfung je Datei; Meldungen fremder Schemata werden an ihrer Grundform (Sachverhaltsliste plus Stelle oder Land) erkannt, bleiben aus den Auswertungen heraus und lassen sich an die KI-Erfassung übergeben. Der Stand wird je Profil im Gerät gespeichert. Übersicht mit Kennzahlen (Stufen aus `beurteilung_hoch`, Tendenz aus `tendenz_verschaerfung`), Meldestatus nach `kontakte.json` mit mailto-Erinnerung, Verteilungen. Redaktionscheck in fünf Abschnitten (Zeitfenster gegen die nächste Ausgabe, jede Zeile „Handlungsrelevant bis“ einzeln; Zusammenhang und abweichende Bewertungen je Ereignisart mit Textbaustein A.7.2, gegenläufige Tendenzen nur bei Entspannung und Verschärfung; Fortschreibung, Nachlauf, Abschluss und mehrere Meldungen derselben Stelle, leere oder offene Kennsätze als Befund; formale Vollständigkeit bei hoher Beurteilung; Quellen, Schema, Status, nicht prüfbare Quellenverweise als Warnung), Fundstellen aus `ui.lagebild.verweise`. Fristen, nächste Ausgabe (Datum, Uhrzeit optional) und Prüfzeitpunkt gelten in der Zeitzone des Profils (`variablen.zeitzone`); Uhrzeiten auch in der Form „um 8:00 Uhr“, ohne Uhrzeit gilt das Tagesende. Geprüft wird für „jetzt“ (laufend aktualisiert) oder einen gespeicherten Stichtag. Grenzfälle: Frist zeitgleich mit der Ausgabe ist zeitkritisch; eine Frist am Ausgabetag ohne bekannte Reihenfolge ist zu klären. Kopf mit Prüfstand, Zählung nach Einstufung (zeitkritisch, zu klären, Information; jeder Befund einzeln), Abdeckung (ausgewertete und fremde Meldungen, nicht konfigurierte Regeln, aus dem Schema abgeleitete Schwelle) und Sprungmarken je Abschnitt. Hohe Beurteilung ohne `beurteilung_hoch`: die beiden höchsten Stufen des Schemas, wie in den Kennzahlen. Jeder Befund führt zur Meldung in der Liste, ohne die Meldungsmaske zu ändern. Redaktionsbericht als TXT und JSON mit Prüfstand, Profilprüfsumme, Meldungen mit Inhaltskennung und allen Befunden. Rohtabelle und CSV generisch aus dem Schema (eine Zeile je Sachverhalt, eine Spalte je Radarachse). Kopiervorlage als Word-kompatibles HTML mit Farbquadraten und Radar als PNG. PDF mit Übersicht nach Schwere und allen Meldungen. Jede Meldung lässt sich in der Maske öffnen. Beispieldatensätze kommen aus dem Profil (`beispiele`).
- **KI-Verdichtung:**
  1. Die KI schlägt eine Gruppierung nach Sachverhalten vor (A.7.1). Die Person bestätigt oder korrigiert die Zuordnung.
  2. Die KI erstellt je Gruppe einen Sachverhalt der eigenen Meldung: Radar neu für den eigenen Referenzraum, Abweichungen als Kennsatz, Eingangsmeldungen als Quellen mit der Kategorie nach der Rolle der meldenden Stelle.
  3. Danach folgen S3 und S4 wie in Modus A.

### 5.3 Bibliothek

Lokale Ablage aller Meldungen, Läufe und Profile, mit Suche und Filter nach Profil, Status und Ereignisart. Teilen über das System-Teilen-Menü (Dateien, Mail, AirDrop).

### 5.4 Einstellungen

Seit 0.5.6 in sechs Bereichen mit Abschnittsnavigation wie bei Meldung und Lagebild (breite Ansicht: Leiste links, schmale Ansicht: waagerecht scrollbare Leiste über dem Inhalt). Es ist immer nur ein Bereich zu sehen; jeder Wert hat genau einen Einstellungsort. Der gewählte Bereich bleibt beim Wechsel der Ansicht erhalten (nicht über ein Neuladen hinweg); „Zu den Einstellungen“ aus der KI-Erfassung führt direkt zu „KI-Anbieter & API“. Gespeicherte Einstellungen, Vorgaben, Speicherorte und Schlüssel sind unverändert.

| Bereich | Inhalt |
|---|---|
| Übersicht (Start) | aktives Profil, Voreinstellung der Modelle, Ablage der Schlüssel, Recherchegrenzen; je Anbieter Schlüssel hinterlegt/fehlt und genutzte Aufgaben; je Aufgabe wirksames Modell, Aufwand und Herkunft (eigene Einstellung, Vorgabe des Profils, Vorgabe der App). Alles aus dem gespeicherten Stand berechnet, nichts zwischengespeichert |
| KI-Anbieter & API | Ablage der Schlüssel, Schlüssel je Anbieter mit Speichern, Verbindungstest und Löschen, aufklappbare Hinweise je Anbieter |
| Modelle & Verarbeitung | Voreinstellung und Modell und Aufwand je Aufgabe |
| Recherche & Grenzen | Websuchen, Seitenabrufe, Höchstlänge je Seite, Suchland, maximale Ausgabetoken je KI-Aufruf; Unterschiede der Anbieter |
| Darstellung | Farbschema |
| Über KI-LEAD | Version, Abgrenzung, Verweise |

- Darstellung: Farbschema der Oberfläche – Automatisch (Standard: Neutral · Hell oder Neutral · Night Mode nach System, bei „mehr Kontrast“ das passende Kontrastschema; kein eigenes Farbschema), Neutral · Hell, Neutral · Night Mode, Kontrast · Hell, Kontrast · Dunkel (Text mindestens 7:1, kein Band), Bund, Bevölkerungsschutz, je ein Schema für jedes der 16 Länder, oder die Farben des aktiven Profils (`farbschema` in `profil.json` bzw. eigene Farben auf dem Gerät, an Profilschlüssel und Prüfsumme gebunden). Das Schema ändert nur Bildschirmfarben; Signalfarben der Bewertungen und das Lagenradar hängen nur von der Semantikbasis ab (hell, dunkel, Kontrast hell, Kontrast dunkel), erzwungene Systemfarben (`forced-colors`) gehen vor, Auswahl und Radarwerte sind nicht nur über Farbe erkennbar, Ausgaben (PDF, Word, CSV) behalten ihre Gestaltung. Katalog, Herkunft und Kontrastregeln: [farbschemas.md](farbschemas.md).
- API-Schlüssel je Anbieter, mit wählbarer Ablage (seit 0.5.1).
- Modell und Aufwand (Effort) je Stufe; die Voreinstellungen kommen aus dem Profil. Seit 0.5.6 steht die Voreinstellung unter „Modelle & Verarbeitung“ (vorher als „Standard-Profil wählen“ im Abschnitt des jeweiligen API-Schlüssels, seit 0.5.1): „Vorgaben des aktiven Profils“ (Modellfelder leer, Aufwand nach den Vorgaben der App), Standard-Profil Anthropic, OpenAI oder Mistral, oder „Individuelle Modellkonfiguration“, die von selbst entsteht, sobald einzelne Aufgaben abweichen. Vor dem Überschreiben einer individuellen Konfiguration fragt die App nach. Standard-Profile: Anthropic S1 claude-haiku-5-5 (hoch), S2 Erfassung und Verdichtung claude-opus-5-5 (mittel), S3 Reparatur claude-sonnet-5-5 (niedrig), Management Summary claude-sonnet-5-5 (mittel); OpenAI mit den Gegenstücken gleicher Größe gpt-6-luna, gpt-6-astra und gpt-6.1-sol bei gleichem Aufwand, seit 0.5.10 aber Verdichtung mit gpt-6-astra (hoch); Mistral (seit 0.5.6) S1 und S3 mistral-small-2603, S2 und Management Summary mistral-medium-3-5, seit 0.5.10 mit „hoch“ statt „mittel“ (S3 niedrig). Die Wahl für OpenAI und Mistral folgt dem Vergleichslauf Ilka nach Plan `standardprofile-ilka` mit Anthropic als Bezug (offener Punkt 6). Die Vorgabe der App für Profile ohne eigene Modellvorgabe gleicht seit 0.5.10 dem Standard-Profil Anthropic (Verdichtung mit Opus statt Sonnet).
- Aufwand je Modell (seit 0.5.10): Zur Wahl stehen je Modell nur die Stufen, die der Anbieter anbietet (`src/anbieter/aufwand.ts`): Anthropic und OpenAI alle fünf, Mistral nur „niedrig – ohne Nachdenken“ (`none`) und „hoch – mit Nachdenken“ (`high`). Eine gespeicherte Stufe, die das wirksame Modell nicht anbietet, gilt als die nächsthöhere angebotene, ohne höhere als die nächstniedrigere; beim Modellwechsel passt die Auswahl sie sichtbar an. Pipeline, Schätzung, Vergleichslauf und Laufprotokoll verwenden die wirksame Stufe. Der Endpunkt von Mistral ist eine Einstellung unter „KI-Anbieter & API“: EU (Vorgabe, ohne Websuche) oder global (mit Websuche). Übrige Einstellungen bleiben; einzelne Aufgaben lassen sich danach weiter anpassen, Anbieter auch gemischt.
- Kostenanzeige je Lauf auf Basis der Token-Zählung. Die Schätzung vor dem Lauf beruht auf Messwerten aus mindestens drei Läufen je Kombination (`src/pipeline/schaetzung.ts`) und schlägt seit 0.5.10 wie die Ist-Kosten 10 % für den EU-Endpunkt von Mistral auf (Preisregel in `src/anbieter/preise.ts`).
- Vergleichslauf Ilka (seit 0.5.8) unter „Modelle & Verarbeitung“: Mit der angezeigten Konfiguration von Modell und Aufwand verdichtet die App den Standardfall `orkantief-ilka-verdichtung` (Beispielprofil, Koordinierungsstelle, t0 14.10.2026 14:00, ohne Websuche, S1-Vorschlag unverändert) 1- bis 10-mal (Vorgabe 3) und gibt Laufprotokolle, Entwürfe, Prüfpunkte T1–T8 der Abnahme M4, Vergleich mit der Redaktionsfassung und eine Übersicht als ZIP aus (`src/pipeline/vergleichslauf.ts`). Konfiguration aus den Einstellungen oder als Variante des Plans `standardprofile-ilka`; je Lauf Kennzahlen und eine Plausibilitätsprüfung der Zahlen (Summen in Klammern, D2-Stufe; seit 0.5.10 geht eine ausdrücklich genannte Summe vor), die nur hier läuft. Entschieden am 25.10.2026: In die App kommt sie als Hinweis an die Redaktion, sobald mindestens zehn Treffer von Hand geprüft sind und höchstens einer davon ein Fehlalarm ist; im ersten Plan waren es drei Treffer mit einem Fehlalarm. Die Zuordnung der Sachverhalte zur Redaktionsfassung berücksichtigt seit 0.5.10 auch die Kernaussage (`ki-lead-vergleich/3`). Auswertung mehrerer Reihen mit `npm run vergleichslauf:auswerten`, Bezug ist das Standard-Profil Anthropic; der Bericht nennt je Konfiguration die Zahl der verglichenen Achsen. Grundlage für Messwerte der Schätzung und für die Wahl der Standard-Profile je Anbieter (offener Punkt 6).
- Datenhinweis und Sprache.
- Über KI-LEAD (seit 0.5.5): Version, Abgrenzung, Herausgeber, Geltungsbereich der Lizenzen (seit 0.5.9: Code, mitgelieferte Beispielprofile, eigene und importierte Profile, Ausgaben); externe Verweise auf Impressum, Datenschutzerklärung, Lizenzhinweise für Inhalte, Drittkomponenten und Lizenzen, Quellcode, Rückmeldung und Erprobung (`src/ui/Ueber.tsx`, Adressen in `src/kern/herausgeber.ts`).

## 6. Forschungsfunktionen

- **Laufprotokoll:** Profil-ID, Version und Hash; Modell-ID und Parameter; vollständige Prompts und Rohantworten; Tokens; Dauer. Exportierbar als JSON-Forschungsdatensatz.
- **`_entstehung`:** Das Beispielschema lässt nur die Felder `verfahren`, `werkzeug`, `modell`, `sop`, `kodierleitfaden` und `erstellt` zu. Die App setzt `werkzeug` auf „KI-LEAD <App-Version> · Profil <id> <version> · Lauf <lauf-id>“; `<App-Version>` ist die zur Laufzeit tatsächlich verwendete Version der App (z. B. „KI-LEAD 0.4.30 · …“), kein literaler Platzhalter, dazu `modell` und `erstellt`. `kodierleitfaden` setzt sie aus dem Kopf des Kodierleitfadens im Profil (Titel und „Fassung x.y“). In `sop` führt sie die tatsächlich beigefügten SOPs und Bausteine (Kennung mit gültiger Fassung, aus der zusammengestellten S2-Anfrage), unabhängig vom Antwortformat des Modells; das belegt den Kontext, nicht die fachliche Anwendung. Die Angabe des Modells zur Anwendung vergleicht sie damit und gibt Abweichungen als Prüfhinweis „SOP-Nachweis: …“ aus (fehlende Angabe, nicht beigefügte oder unbekannte Kennungen, beigefügte, aber nicht genannte). Prüfansicht, PDF, Lagebild-Karte und Rohtabelle/CSV („SOP (Entstehung)“) zeigen die gespeicherte Angabe; historische Kennungen bleiben unverändert. Die ausführliche Herkunft steht im Laufprotokoll, die Meldung verweist darauf.
- **KI-Kennzeichnung der Ausgaben (seit 0.5.4):** Aus `_entstehung.verfahren` leitet die App die Herkunft ab („KI-Entwurf“ = `ki`, andere Angabe = `manuell`, keine = `unbekannt`; `src/dokumente/kennzeichnung.ts`). PDFs der Meldung und des Lagebilds tragen sie in XMP-Metadaten (bei `ki` mit IPTC Digital Source Type `compositeWithTrainedAlgorithmicMedia` und Modell), in den Dokumenteigenschaften (Ersteller „KI-LEAD <Version>“, Schlüsselwörter) und sichtbar in der Fußzeile („KI-generiert“); ein Lagebild gilt als `ki`, sobald eine enthaltene Meldung ein KI-Entwurf ist. Die Management Summary als TXT beginnt mit einer Kennzeichnungszeile mit Werkzeug und Modell. Hat ein Profil kein Entstehungsfeld, das „KI-Entwurf“ zulässt, meldet die Profilprüfung den Hinweis `KI_KENNZEICHNUNG_OHNE_ENTSTEHUNGSFELD`. Einordnung und Grenzen: [KI-VERORDNUNG.md](KI-VERORDNUNG.md), Abschnitt 6.1.
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
| Speicher | IndexedDB über `idb-keyval` (Einstellungen, Zwischenstände, Lagebild, Laufprotokolle, Profile); localStorage nur für das Farbschema vor dem ersten Zeichnen; Dateien nur beim Herunterladen und Exportieren. Ursprünglich geplant: Capacitor Filesystem (siehe Abschnitt 10) |
| Geheimnisse | Wählbare Ablage (`src/schluessel/ablage.ts`): Gerätespeicher (IndexedDB, Vorgabe), nur Sitzung (Arbeitsspeicher) oder in der nativen App Keychain bzw. Keystore über `@aparajita/capacitor-secure-storage` (MIT, gepinnt); Wechsel zieht die Schlüssel mit um |
| HTTP | im Browser direkt über `fetch` (Anthropic mit dem Kopf `anthropic-dangerous-direct-browser-access`); nativ später über CapacitorHttp. Ob `api.eu.mistral.ai` und `api.mistral.ai` Aufrufe direkt aus dem Browser zulassen (CORS), prüft die Mistral-Probe (offener Punkt 15) |
| Drittkomponenten | wenige, nur unter permissiven Lizenzen; Liste, Verträglichkeit und SBOM in [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md); Lizenztexte im Build (`lizenzen.md` über `build.license` von Vite, `public/lizenzen-ergaenzend.md`); Prüfung in `tests/lizenzen/` |

**Anbieter-Abstraktion:** Eine gemeinsame Schnittstelle `LlmAnbieter` (`src/anbieter/typen.ts`) deckt Nachrichten, Werkzeuge (Websuche, URL-Abruf), strukturierte Ausgabe und Token-Zählung ab. Es gibt drei Implementierungen: Anthropic Messages API, OpenAI Responses API und seit 0.5.6 Mistral. Mistral nutzt nach Wahl den regionalen EU-Endpunkt `api.eu.mistral.ai` mit Chat Completions (Vorgabe; Verarbeitung in EU und EFTA, 10 % Aufschlag, keine eingebauten Werkzeuge) oder `api.mistral.ai` mit der Conversations API (`/v1/conversations`, weil nur sie die eingebaute Websuche mit Fundstellen bietet; keine Höchstzahl der Websuchen je Anfrage, kein Abrufwerkzeug, die App zählt die Suchen). Die Pipeline rechnet für S2 mit den Werkzeugen, die Modell und Endpunkt tatsächlich bieten (`werkzeugeFuer`, `s2Grenzen`); der Steuerungsblock sagt dem Modell, wenn keine Recherche möglich ist. Nachdenken sendet die App an Mistral nur mit den dokumentierten Werten: „niedrig“ als `none`, alle anderen Stufen als `high` (seit 0.5.7). Lehnt ein Modell die Angabe ab, wiederholt die App einmal ohne sie; das Laufprotokoll nennt die wirksame und die abgelehnte Angabe. Fehlerlisten von Mistral (HTTP 422) gibt die App mit Ort und Text wieder. Die Profilinhalte (Anweisung, Teil A, SOPs, Kodierleitfaden, Schema) stehen am Anfang des Prompts und werden gecacht. Der Auftrag und das Material stehen am Ende.

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
profile/       Beispielprofil, Vorlage
privat/        eigene Profile und Testdaten, nicht eingecheckt
tests/         Funktions-, Komponenten- und Browsertests ohne echte KI-Aufrufe (docs/TESTS.md)
evaluation/    Fälle und Schema für die inhaltliche Bewertung von KI-Modellen, getrennt von den Tests
```

## 8. Datenschutz, Sicherheit, KI-Verordnung und Barrierefreiheit

- Ein Hinweis beim ersten Start und vor jedem KI-Lauf: nur fiktive oder offene Inhalte, keine personenbezogenen und keine eingestuften Daten.
- Inhalte gehen nur an den gewählten KI-Anbieter; dort gelten dessen API-Bedingungen. Es gibt keine weitere Übermittlung, keine Analytics und keine Absturzberichte an Dritte.
- Der API-Schlüssel verlässt das Gerät nur im Aufruf an den jeweiligen Anbieter. Die Ablage auf dem Gerät ist wählbar (Abschnitt 7, „Geheimnisse“).

Einzelheiten:

| Thema | Dokument |
|---|---|
| Datenschutzerklärung (Abschnitt 12), Verantwortlichkeit, Datenflüsse, Bedingungen der Anbieter, Speicherorte, Löschen, Store-Angaben, Vorlage zur Schwellwertanalyse | [DATENSCHUTZ.md](DATENSCHUTZ.md) |
| Bedrohungsmodell mit vorhandenen und offenen Maßnahmen | [SICHERHEIT.md](SICHERHEIT.md); Meldeweg für Schwachstellen in [SECURITY.md](../SECURITY.md) |
| Einordnung nach der KI-Verordnung, Kennzeichnung der Ausgaben, Systemkarte | [KI-VERORDNUNG.md](KI-VERORDNUNG.md) |
| Stand und Lücken der Barrierefreiheit, rechtliche Einordnung | [BARRIEREFREIHEIT.md](BARRIEREFREIHEIT.md) |
| Drittkomponenten, Lizenzen, Verträglichkeit, SBOM | [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) |
| Erprobung im Testkreis: Teilnahme, Bedingungen, Rückmeldung, Auswertung | [ERPROBUNG.md](ERPROBUNG.md) |

## 9. Meilensteine und Abnahme

| M | Inhalt | Abnahme |
|---|---|---|
| **M0** | Rahmen: Apple Developer Account, GitHub-Repo (EUPL-1.2), Namensabgrenzung. Als wissenschaftliche Tätigkeit ist das Vorhaben genehmigungsfrei. | erledigt (17.10.2026) |
| **M1** | Web-Kern: Profil laden, Formular aus Schema und UI, Prüfung, Import/Export – ohne KI | Fiktiven Datensatz „Ilka“ (sieben Meldungen) laden, ohne Befund prüfen und unverändert wieder exportieren; ein zweites Profil mit anderem Schema darstellen |
| **M2** | KI-Pipeline Modus A (S0–S4), Anthropic | Drei fiktive Lagen erzeugen schemakonforme Entwürfe mit vollständigem Laufprotokoll |
| **M3** | Modul Lagebild: Aggregation und Redaktionscheck | Meldestatus, Sachverhalte, Radar je Sachverhalt, Redaktionscheck und Exporte |
| **M4** | KI-Verdichtung Modus B (vorläufige Fassung seit M2: Erkennung von Eingangsmeldungen, Gliederung nach Sachverhalten mit Zuordnung, t0, Zusatzanweisung A.7); OpenAI-Anbieter | Verdichtung der sechs fiktiven Ländermeldungen „Ilka“ zu einer Meldung der Koordinierungsstelle; Vergleich mit der vorhandenen Redaktionsfassung – technisch abgenommen (23.10.2026, je drei Läufe mit Anthropic und OpenAI, [Ergebnis](../evaluation/abnahmen/2026-10-23-m4-ergebnis.md)) |
| **M5** | Capacitor-Builds: iOS (TestFlight), Android (APK), PWA (pereirawolf.de) | Installation und Offline-Betrieb auf iPad, iPhone und Android-Emulator – PWA umgesetzt (0.5.0, Offline-Start im Browsertest geprüft); native Projekte und Schlüsselbund angelegt (0.5.1); Builds und Abnahme auf Geräten offen |
| **M6** | Erprobung im Testkreis auf einem Release-Kandidaten (Git-Tag ohne DOI, [ERPROBUNG.md](ERPROBUNG.md)); danach erster Release mit Zenodo-DOI; die Versionsnummer wird bei der Freigabe festgelegt (GitHub-Integration, Metadaten aus CITATION.cff, SBOM als Anhang) | Erprobung nach festgelegtem Plan (`evaluation/plaene/`) durchgeführt; jede Rückmeldung gesichtet und zugeordnet (umgesetzt, eingeplant oder abgelehnt mit Grund); Ergebnis unter `evaluation/abnahmen/` veröffentlicht ([ERPROBUNG.md](ERPROBUNG.md), Abschnitt 8); danach Release veröffentlicht |

## 10. Offene Punkte

1. **Namensabgrenzung:** Zu klären ist, ob die ausdrückliche Abgrenzung im README genügt oder ein Zusatz („KI-LEAD Demonstrator“) hilft.
2. **Quellen bei Verdichtung:** Gelöst mit Arbeitsanweisung Verdichtung 2.0 (19.10.2026): Eingangsmeldungen werden nach der Rolle der meldenden Stelle eingeordnet (A, B oder P); aus der Herkunft einer Meldung folgt nicht ihre Beweisqualität. In der technischen Abnahme M4 (23.10.2026) erhielten in allen sechs Läufen beider Anbieter alle sechs Eingänge einen eigenen A-Eintrag; eine inhaltliche Bewährung steht aus.
3. **`land`-Enum auf unteren Ebenen:** Für Kreis oder Einsatzstelle trägt `land` das Bundesland, `meldende_stelle` die Stelle. Zu prüfen ist, ob das für alle Ebenen genügt oder ob eine Ebene ein eigenes Schema braucht.
4. **Schema-Kompatibilität zwischen Ebenen:** Verwenden zwei Ebenen unterschiedliche Profilversionen, braucht die App eine Migrationsregel. Das Profilformat sieht dafür Migrationsregeln im Manifest vor.
5. **Arbeitsanweisung Modus B:** Fassung 2.0.2 vom 23.10.2026 im Beispielprofil (`anweisung-verdichtung.md`); In der technischen Abnahme M4 (23.10.2026) wurden abweichende Bewertungen der Länder in allen sechs Läufen mit dem Textbaustein A.7.2 benannt; mehrfach stand „Handlungsrelevant bis“ auf t0 selbst (Kandidat für eine Präzisierung). Eine inhaltliche Bewährung steht aus.
6. **Kosten und Laufzeiten** je Stufe im Pilot messen; danach die Modell-Voreinstellungen anpassen. Für die Verdichtung bestätigt die Abnahme M4 die Schätzung mit Anthropic (1,86–1,94 USD und 552–565 s je Lauf mit Haiku „high“ und Opus „medium“); mit OpenAI (gpt-6-luna „high“, gpt-6-astra „medium“) wurden 1,19–1,24 USD und 176–214 s gemessen; beides ist seit 0.4.31 in der Schätzung der App hinterlegt. Weitere Reihen je Konfiguration liefert seit 0.5.8 der Vergleichslauf Ilka in den Einstellungen. Entschieden am 24.10.2026 (AV-2026-W43-04): Die Standard-Profile von OpenAI und Mistral werden nach dem Plan `standardprofile-ilka` so gewählt, dass sie der Anthropic-Reihe am nächsten kommen; über die App-Vorgabe der Verdichtung (Opus oder Sonnet, AV-2026-W43-10) entscheidet derselbe Plan (Varianten A und B). Ergebnis vom 25.10.2026 ([Bericht](../evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md), je drei Läufe, App 0.5.8): OpenAI verdichtet mit gpt-6-astra „hoch“ (näher an Anthropic als „mittel“, beide lassen D2 und D4 offen), Mistral weiter mit Medium 3.5 „hoch“ (näher als Large 4), die App-Vorgabe der Verdichtung ist Opus. Gemessen je Lauf: Anthropic 1,76–1,90 USD und 521–546 s, OpenAI „hoch“ 1,52–1,69 USD und 309–395 s, Mistral Medium 3.5 0,26–0,38 USD und 146–225 s (EU, inkl. Aufschlag); die Messwerte stehen seit 0.5.10 in der Schätzung und ersetzen die der Abnahme M4. Offen: Erfassung und Management Summary; eine Folgereihe mit gpt-6-astra „sehr hoch“.
7. **Rolle und Store-Angaben:** Verantwortlich für die Verarbeitung in der App ist die nutzende Person oder Stelle, nicht der Herausgeber ([DATENSCHUTZ.md](DATENSCHUTZ.md), Abschnitt 2). Die Angaben für App Store und Google Play folgen der vorsichtigen Lesart (Anhang A und B); bei der ersten Einreichung prüfen.
8. **Maschinenlesbare KI-Kennzeichnung (Art. 50 Abs. 2 KI-VO):** Seit 0.5.4 tragen PDFs XMP-Metadaten und Dokumenteigenschaften zur Herkunft, die Management Summary als TXT eine Kopfzeile, und die Profilprüfung weist auf ein fehlendes Entstehungsfeld hin ([KI-VERORDNUNG.md](KI-VERORDNUNG.md), Abschnitt 6.1). Offen: Signatur der Metadaten; Wasserzeichen im Text kann KI-LEAD nicht selbst erzeugen.
9. **Barrierefreiheit:** PDF-Ausgaben ohne Tags; keine Prüfung mit Screenreadern und auf Geräten; das Lagenradar ist seit 0.5.4 eine Radiogruppe mit Pfeiltasten ([BARRIEREFREIHEIT.md](BARRIEREFREIHEIT.md), Abschnitt 4).
10. **Sicherheit:** offene Maßnahmen nach [SICHERHEIT.md](SICHERHEIT.md): Domainbegrenzung beim Seitenabruf, Signatur importierter Profile, GitHub Actions per Commit-SHA, automatische Prüfung bekannter Schwachstellen.
11. **Daten löschen:** Ein Knopf „Alle Daten dieses Geräts löschen“ fehlt; heute geht das nur über die Browsereinstellungen oder die Deinstallation ([DATENSCHUTZ.md](DATENSCHUTZ.md), Abschnitt 10).
12. **Speicher und Bibliothek:** Abschnitt 7 sah Capacitor Filesystem, Abschnitt 5.3 eine Bibliothek mit Teilen-Menü vor. Umgesetzt ist die Ablage in IndexedDB; eine Bibliothek mit Suche und Filter gibt es nicht. Zu klären ist, ob beides noch gebraucht wird.
13. **Impressum:** Geklärt mit 0.5.5 (Einschätzung, keine Rechtsberatung). [§ 5 Abs. 1 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) gilt für „geschäftsmäßige, in der Regel gegen Entgelt angebotene“ digitale Dienste und greift für das unentgeltliche, werbefreie Forschungsvorhaben voraussichtlich nicht. [§ 18 Abs. 1 MStV](https://lxgesetze.de/mstv/18) verlangt Name und Anschrift für jedes Telemedium, das nicht ausschließlich persönlichen oder familiären Zwecken dient; das trifft auf die öffentlich abrufbare Web-App voraussichtlich zu. Ein ständig sichtbarer Link auf das Impressum des Herausgebers genügt (Abschnitt 1). Die Datenschutzerklärung für KI-LEAD steht im Repository ([DATENSCHUTZ.md](DATENSCHUTZ.md), Abschnitt 12) und verweist für Verantwortlichen und Kontakt auf das Impressum; die Website des Herausgebers bleibt unverändert.
14. **Lizenzhinweise der nativen Apps:** In `public/lizenzen-ergaenzend.md` mit Versionen aus `android/variables.gradle`. Offen: Die Version von KeychainSwift legt erst Xcode fest; nach dem ersten Build `Package.resolved` einchecken ([THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md), Abschnitt 4). Die SBOM erfasst nur npm-Pakete.

15. **Mistral (seit 0.5.6):** Die Anbindung folgt der Doku und den Typdefinitionen des SDK vom 24.10.2026 und ist in den gewöhnlichen Tests nur gegen Attrappen geprüft. Mit echten Läufen erprobt (Verdichtung Ilka, 24.10.2026, ohne Websuche): EU-Endpunkt 7 Läufe mit Small 4, Medium 3.5 und Large 4, globaler Endpunkt 3 Läufe; alle schemakonform, `reasoning_effort` „high“ angenommen. Noch nicht erprobt: Websuche, PDF und Nachdenken aus (`none`). Mit einem eigenen Schlüssel prüft sie die **Mistral-Probe** (Workflow `mistral-probe.yml`, Label „mistral-probe“ am Pull Request): (a) ob `api.eu.mistral.ai` und `api.mistral.ai` Aufrufe direkt aus dem Browser zulassen (CORS; geprüft von `localhost` aus, nicht von GitHub Pages und nicht aus der WebView), (b) welche der drei Modelle am EU-Endpunkt bereitstehen, (c) strukturierte Ausgabe mit `strict` und dem strengen Schema, (d) ob die Modelle `reasoning_effort` mit `high` und `none` annehmen (seit dem Lauf 20261024-195614-kyc1 sendet die App nur diese Werte), (e) PDF als `document_url` mit Data-URL, (f) Websuche und ob `connector_tokens` in `prompt_tokens` enthalten sind (heute vorsichtig addiert). Unbestätigt bleibt der Preis von 0,03 USD je Websuche. Entschieden am 24.10.2026: EU-Endpunkt als Vorgabe (regional, ohne Websuche), globaler Endpunkt mit Websuche wählbar. Offen: generischer, OpenAI-kompatibler Endpunkt (lokale oder deutsche Modelle), ebenfalls ohne Websuche.

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
| 0.4.21 | 21.10.2026 | S2 Erfassung mit claude-opus-5-5 als Vorgabe; voraussichtliche Dauer und Kosten je Stufe nach Modell; Lagenradar-Umhängung und Warnung bei nicht abrufbarer Auftrags-URL in S3; Hinweis auf Kennsätze im Fließtext (Abschnitt 5.1, Umsetzung M2) |
| 0.4.22 | 21.10.2026 | Wahl je Lauf um Aufwand je Stufe und Höchstzahl der Websuchen erweitert (Abschnitt 5.1); „Automatisch“ verwendet Neutral · Hell bzw. Neutral · Night Mode (Abschnitt 5.4) |
| 0.4.23 | 21.10.2026 | Abschnitt 7: Ordner `tests/` und `evaluation/` ergänzt (Neugliederung der Tests, Modellbewertung getrennt von den Regressionstests) |
| 0.4.24 | 21.10.2026 | LEAD-Eingabehilfen: Vorlagen vorhandener Satzanfänge und Kennsätze unter den Analysefeldern und dem Bewertungstext; offene Stellen ⟦…⟧ in Prüfung, Redaktionscheck und Management Summary (Abschnitt 5.1, S4) |
| 0.4.25 | 21.10.2026 | S1: Ausgabegrenze 128 000 Token für Claude-5.5-Modelle und Fable 5.1 (sonst 16 000), verständlicher Abbruch an der Grenze, Strukturprüfung des Vorschlags, vorläufige Schätzung für Haiku „high“ (Abschnitt 5.1, Umsetzung M2) |
| 0.4.26 | 21.10.2026 | Höchstzahl Ausgabetoken der Einstellungen gilt für jeden KI-Aufruf (S1, S2, S3, Management Summary) (Abschnitt 5.1, Umsetzung M2) |
| 0.4.27 | 21.10.2026 | Schätzung von Dauer und Kosten nach drei S1-Verdichtungen mit Haiku „high“ und einer Opus-Verdichtung mit 128 000 Token als Grenze (Abschnitt 5.1, Umsetzung M2) |
| 0.4.28 | 22.10.2026 | Fortschreibung: `{{jetzt}}` ist die Bearbeitungszeit, feste t0-Regeln, verbindlicher Steuerungsblock mit Recherchemodus für S2, Befunde zur Recherche, Redaktionsvermerke auch für eine eigene Vormeldung (Abschnitte 4.4 und 5.1, Umsetzung M4) |
| 0.4.29 | 22.10.2026 | PDF und Kopiervorlage: Kennsatzzeilen bleiben ungeteilt; Zeichen außerhalb der PDF-Standardschrift werden lesbar ersetzt (Abschnitt 5.1) |
| 0.4.30 | 22.10.2026 | Fortschreibung: Land und meldende Stelle aus der eigenen Vormeldung; Hinweis zum Seitenabruf im Steuerungsblock (Abschnitt 5.1) |
| 0.4.30 · Nachtrag | 23.10.2026 | Ohne Änderung der App: Abschnitte 4.1–4.3 und 4.5 an das tatsächliche Profilformat angeglichen, `werkzeug` mit der zur Laufzeit verwendeten App-Version (Abschnitt 6), Verdichtung mit Quellenkategorie nach Rolle, offene Punkte 2 und 5 (Konsistenzprüfung KW 43, KP-2026-W43-44 bis -47, -55) |
| 0.4.30 · Nachtrag 2 | 23.10.2026 | Ohne Änderung der App: Abnahme M4 technisch mit Anthropic und OpenAI (Abschnitt 9), M6 ohne vorab festgelegte Versionsnummer, offene Punkte 2, 5 und 6 fortgeschrieben |
| 0.4.31 | 23.10.2026 | Schätzung von Dauer und Kosten nach der Abnahme M4: Messwerte für gpt-6-luna (S1) und gpt-6-astra (Verdichtung), Obergrenze der Opus-Verdichtung 2,20 USD, Rundung der Kostenangabe ohne Gleitkommafehler (Abschnitt 5.1, Umsetzung M2) |
| 0.5.0 | 23.10.2026 | Beginn M5: installierbare PWA mit Manifest, Symbolen und Service Worker für den Offline-Start; Hinweise zu fehlendem Netz und neuer Fassung (Umsetzung M5, Abschnitt 9) |
| 0.5.1 | 23.10.2026 | Native Projekte mit Capacitor (iOS, Android), wählbare Ablage der API-Schlüssel mit Schlüsselbund des Systems (Abschnitte 2, 7 und 8, Umsetzung M5); Standard-Profil je Anbieter in den Einstellungen (Abschnitt 5.4) |
| 0.5.2 | 23.10.2026 | Korrektur des Updates der PWA: stimmige Fassung bei der Installation, keine ungefragte Übernahme, Neuladen nur im anfordernden Fenster, Reparaturseite, Startprüfung (Umsetzung M5) |
| 0.5.3 | 23.10.2026 | Farbschemata: Kopf in den Bund- und Länderschemata in der Farbe der Arbeitsfläche, gleiche Hintergrundfarbe ober- und unterhalb des Identitätsbands |
| 0.5.4 | 24.10.2026 | Maschinenlesbare KI-Kennzeichnung: PDF-Metadaten (XMP, IPTC Digital Source Type) und Dokumenteigenschaften, Kopfzeile der Management Summary als TXT, Hinweis bei Profilen ohne Entstehungsfeld (Abschnitt 6, offene Punkte 8 und 9); Lagenradar als Radiogruppe mit Pfeiltasten |
| 0.5.3 · Nachtrag | 24.10.2026 | Ohne Änderung der App: Abschnitt 8 verweist auf die neuen Dokumente DATENSCHUTZ.md, SICHERHEIT.md, KI-VERORDNUNG.md und BARRIEREFREIHEIT.md; Speicher in Abschnitt 7 an den Code angeglichen; Verweis auf ein Impressum in Abschnitt 1 berichtigt; offene Punkte 7–13 |
| 0.5.5 | 24.10.2026 | Impressum und Kontakt über die Website des Herausgebers, verlinkt aus Fuß und „Über KI-LEAD“; Datenschutzerklärung im Repository (Abschnitte 1, 5.4 und 8, offener Punkt 13 geklärt); Drittkomponenten mit Lizenzdateien im Build, Lizenzprüfung und SBOM (Abschnitte 7 und 8, offener Punkt 14); Erprobung im Testkreis und Abnahme M6 präzisiert (Abschnitte 8 und 9) |
| 0.5.6 | 24.10.2026 | Mistral als dritter Anbieter mit EU-Endpunkt als Vorgabe (Chat Completions, ohne Websuche) und globalem Endpunkt mit Websuche (Conversations API), Standard-Profil, Preise, Mistral-Probe (Abschnitte 5.4 und 7, offener Punkt 15); Einstellungen in sechs Bereichen mit Übersicht, Voreinstellung unter „Modelle & Verarbeitung“, Feld „Maximale Ausgabetoken je KI-Aufruf“ (Abschnitt 5.4) |
| 0.5.7 | 24.10.2026 | Mistral nach dem ersten echten Lauf: Nachdenken nur mit `none`/`high`, Rückfall ohne Angabe, lesbare Fehlerlisten, kompaktes Laufprotokoll; Abnahmeskript M4 mit Mistral; offener Punkt 15 fortgeschrieben (Abschnitt 7) |
| 0.5.8 | 24.10.2026 | Vergleichslauf Ilka unter „Modelle & Verarbeitung“: Reihe von Verdichtungen des Standardfalls mit der gewählten Konfiguration oder einer Variante des Plans `standardprofile-ilka`, Kennzahlen und Plausibilitätsprüfung je Lauf, Ergebnis als ZIP, Auswertung mehrerer Reihen gegen den Bezug Anthropic (Abschnitt 5.4, offener Punkt 6); Abnahmeskript M4 mit denselben Funktionen |
| 0.5.9 | 24.10.2026 | Lizenzen bestimmt: Fuß und „Über KI-LEAD“ nennen Code, mitgelieferte Beispielprofile mit Namensnennung, eigene und importierte Profile und Ausgaben; Lizenzangabe im Kopf vereinheitlicht; Musterprofil zur „Vorlage – eigene Organisation“ umgebaut (Abschnitte 4 und 5; KP-2026-W43-54 bis -60) |
| 0.5.10 | 25.10.2026 | Ergebnis des Vergleichslaufs Ilka nach Plan `standardprofile-ilka`: Standard-Profil OpenAI mit gpt-6-astra „hoch“ in der Verdichtung, Mistral mit „hoch“, App-Vorgabe der Verdichtung Opus; Aufwand je Modell; Messwerte und EU-Aufschlag in der Schätzung; Plausibilitätsprüfung mit Vorrang der Summe und Entscheidung zur Übernahme; Zuordnung mit Kernaussage (Abschnitt 5.4, offene Punkte 6 und 15; AV-2026-W43-01 bis -03, -05, -06, -09, -10, -12 bis -19) |

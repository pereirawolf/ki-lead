# Profilformat `lead-profil/1`

Beschreibung Fassung 1.6 vom 18.10.2026 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Ein Profilpaket beschreibt die Meldesystematik einer Organisation oder Ebene. Es ist ein Ordner oder eine ZIP-Datei mit der Endung `.leadprofil`. Alle Dateien sind Text (JSON oder Markdown).

## Dateien

| Datei | Pflicht | Inhalt |
|---|---|---|
| `profil.json` | ja | Manifest |
| Meldungsschema (z. B. `meldung.schema.json`) | ja | JSON Schema Draft 2020-12 der Meldung |
| Darstellungsdatei (z. B. `meldung.ui.json`) | ja | Schritte, Bezeichnungen, Widgets, Radare, Rollen, Kennsätze, Quellen |
| Arbeitsanweisung Erfassung | ja | Markdown mit Platzhaltern |
| Kodierleitfaden | ja | Markdown |
| SOP-Dateien | nein | Sammelmappe mit Ankern oder Einzel-SOPs |
| Kontakte | nein | Stellen und Erinnerungstext für den Meldestatus |
| Beispiele | nein | Ordner mit Beispielmeldungen (z. B. einer fiktiven Lage), im Lagebild per Knopf ladbar |

Eine Datei `kontakte.lokal.json` neben `kontakte.json` hat Vorrang und wird nicht eingecheckt. Dort stehen echte Adressen.

## Manifest `profil.json`

```json
{
  "format": "lead-profil/1",
  "id": "de.beispiel.kreis-x",
  "name": "Lagemeldung Kreis X",
  "version": "2026.10.1",
  "ebene": "Kreis",
  "referenzraum": "Kreisgebiet X",
  "variablen": { "land": "Thüringen", "meldende_stelle": "Stab Kreis X", "zeitzone": "Europe/Berlin" },
  "meldung": {
    "schema": "meldung.schema.json",
    "ui": "meldung.ui.json",
    "schema_id": "LEAD-Meldung-v1",
    "eingang_schema_ids": ["LEAD-Meldung-v1"]
  },
  "migrationen": [{ "von": "Alt-v1", "setze": { "schema": "Neu-v2" }, "ergaenze": { "quellen": "" }, "hinweis": "Altformat überführt." }],
  "anweisungen": { "erfassung": "anweisung-erfassung.md", "kurzfassung": "anweisung-kurzfassung.md" },
  "sop": { "dateien": ["sop/sammelmappe.md"], "teil_gemeinsam": "teil-a" },
  "kodierleitfaden": "kodierleitfaden.md",
  "kontakte": "kontakte.json",
  "beispiele": [{ "titel": "Übungslage (FIKTIV)", "ordner": "beispiele/uebung", "hinweis": "Erfundene Lage" }],
  "modelle": { "vorverarbeitung": "claude-haiku-5-5", "erfassung": "claude-sonnet-5-5", "verdichtung": "claude-opus-5-5" }
}
```

- `variablen`: Werte, die in neuen Meldungen vorbelegt werden, wenn das Schema ein gleichnamiges Feld der obersten Ebene hat, und die als `{{profil.<name>}}` in Arbeitsanweisungen zur Verfügung stehen. Zusätzlich gibt es `{{profil.referenzraum}}`, `{{profil.ebene}}` und `{{profil.name}}`.
- `eingang_schema_ids`: Schemakennungen, die die App beim Öffnen ohne Warnung annimmt.
- `migrationen`: einfache Überführungen älterer Schemakennungen. `setze` überschreibt Felder, `ergaenze` ergänzt fehlende Felder.
- `eigene_stellen`: weitere Bezeichnungen, unter denen die eigene Stelle meldet. Die App erkennt eigene Meldungen (Vormeldung statt Eingangsmeldung) nur bei exakter Übereinstimmung mit `variablen.meldende_stelle` oder einem dieser Namen, nach Angleichung von Groß-/Kleinschreibung und Leerraum. In KI-Entwürfen setzt sie Land und meldende Stelle aus dem Profil.
- `beispiele`: Ordner im Paket mit Meldungen als JSON. Das Lagebild bietet sie unter „Beispiel laden“ an; sie gehen nie an ein KI-Modell, solange man sie nicht selbst übergibt. Fiktive Daten im Titel und in jeder Meldung als solche kennzeichnen.

### `kontakte.json`

```json
{
  "format": "lead-kontakte/1",
  "stellen": [{ "name": "Hessen", "feld": "land", "email": "lage@beispiel.invalid" }],
  "erinnerung": { "betreff": "Erinnerung: {name}", "text": "… liegt noch keine Meldung aus {name} vor …" }
}
```

Eine Meldung zählt im Meldestatus für eine Stelle, wenn ihr Feld `feld` genau den Wert `name` hat. `{name}` wird im Erinnerungstext ersetzt.

## Darstellungsdatei

Die App leitet Feldtypen, Auswahllisten und Leerwerte aus dem Schema ab. Die Darstellungsdatei ergänzt nur, was das Schema nicht trägt.

### Pfade

Felder werden mit Punktpfaden angesprochen. `[]` steht für ein beliebiges Listenelement, `*` für einen beliebigen Feldnamen:

- `meldezeitraum.von`
- `sachverhalte[].sofort.beurteilung`
- `freigabe.*.datum`

### `schritte`

Die Reihenfolge der Bearbeitungsschritte. Jeder Schritt nennt die Felder der obersten Ebene, die er zeigt. Der Schritt mit `"pruefung": true` enthält Prüfung und Ausgabe.

### `felder`

| Eigenschaft | Bedeutung |
|---|---|
| `label` | Bezeichnung |
| `hinweis` | Ausfüllhinweis unter dem Feld |
| `platzhalter` | Platzhaltertext im Eingabefeld |
| `widget` | `text`, `text_lang`, `datum`, `datumzeit`, `auswahl`, `radio`, `mehrfachauswahl`, `radar`, `quellen` |
| `leer_label` | Beschriftung für den Leerwert einer Auswahl |
| `pflicht` | Hinweis „Pflicht für finale Meldung“ und Prüfung im letzten Schritt |
| `layout` | `zeile` oder `spalten` für Gruppen |
| `element_label`, `titel_feld`, `hinzufuegen` | Listen: Name eines Elements, Feld für dessen Überschrift, Text der Schaltfläche |
| `radar` | Name eines Radars aus `radare` |

### `radare`

Ein Radar ist ein Objekt mit ganzzahligen Achsen (`integer` oder `null`). `max` ist die höchste Stufe, jede Achse hat genau `max + 1` Stufentexte. `null` bedeutet „offen“ und wird anders dargestellt als Stufe 0.

### `rollen`

Rollen verbinden die LEAD-Logik mit den Feldnamen des Schemas. Pfade mit `sv_` gelten relativ zu einem Element der Sachverhaltsliste.

| Rolle | Verwendung |
|---|---|
| `schema_feld`, `status_feld`, `status_entwurf`, `status_final` | Schemakennung, Entwurf und finale Meldung |
| `entstehung_feld` | Herkunftsangaben bei KI-Entwürfen |
| `freigabe` | Freigabeblock; in PDF-Ausgaben als eigener Block am Ende (Matrix, wenn alle Unterfelder gleich aufgebaut sind) |
| `land`, `meldende_stelle`, `meldezeitpunkt` | Dateiname, Kurzfassung, Meldestatus |
| `quellen` | zentrales Quellenverzeichnis |
| `sachverhalte` | Liste der Sachverhalte |
| `sv_bezeichnung`, `sv_art`, `sv_ort`, `sv_eintritt` | Kopfdaten eines Sachverhalts |
| `sv_beurteilung`, `sv_tendenz`, `sv_bewertung_text` | Bewertung und Kennsätze |
| `sv_radar` | Radar des Sachverhalts |
| `sv_textfelder`, `sv_analysefelder` | Texte mit Quellenverweisen bzw. Analysefelder der Kurzfassung |
| `beurteilung_hoch`, `tendenz_entspannung`, `tendenz_verschaerfung` | Werte für Kennzahlen und Redaktionshinweise; ohne `tendenz_verschaerfung` gilt der letzte Wert der Aufzählung |

Die Reihenfolge der Aufzählung von `sv_beurteilung` im Schema gilt als aufsteigende Schwere: Das Lagebild sortiert danach und färbt die höchste Stufe rot, die zweithöchste orange, die dritthöchste gelb.

### Weitere Abschnitte

- `kennsaetze`: feste Satzanfänge (z. B. „Neubewertung bei:“), die die App in Bewertungstexten erkennt.
- `quellen`: Kategorien mit Erläuterung, Altkategorien und Vorlage für neue Einträge (`{n}`, `{heute}`).
- `dateiname`: Vorlage mit Feldnamen in geschweiften Klammern.
- `kurzfassung`: Titel und Kopfzeile der Klartext-Kurzfassung.
- `bewertung_gliederung`: Satzanfänge (reguläre Ausdrücke) zur Gliederung des Bewertungstexts in Ausgaben; `absatz` beginnt mit Leerzeile, `zeile` auf neuer Zeile. Kennsätze gliedert die App selbst. Beispiel: `{ "absatz": ["Kernaussage:", "Beurteilung „"], "zeile": ["D[2-9] (=|offen)"] }`.
- `analyse_gliederung`: dasselbe für die Analysefelder (Rolle `sv_analysefelder`). Ein Umbruch entsteht nur nach einem Satzende (`. ; ! ? ) ] “`), bei `zeile` auch nach einem Doppelpunkt, damit eine Aufzählung „Prüfbedarf: (1) … (2) …“ untereinander steht. Mit `kurzlabel: n` beginnt zusätzlich jeder kurze Aspektbegriff aus höchstens n Wörtern mit Doppelpunkt eine neue Zeile („Strom:“, „Verkehr → Versorgung:“, „Land (Behörde):“); Ordnungszahlen „(1)“ und „1.“ bleiben bei ihrem Begriff. `kurzlabel` gilt auch in `bewertung_gliederung`, Werte 0 bis 8, 0 oder fehlend schaltet es ab. Beispiel: `{ "absatz": ["Szenario:", "Einordnung „"], "zeile": ["\\(\\d+\\) "], "kurzlabel": 3 }`. Die Gliederung betrifft nur Ausgaben (PDF, Kopiervorlage, Lagebild-Tabelle), nie die gespeicherte Meldung.
- `lagebild`: `titel` (Name des Moduls in der Navigation), `ausgabe_label` und `ausgabe_tage` (Vorbelegung der nächsten Ausgabe im Redaktionscheck) und `verweise` mit Fundstellen der SOP je Prüfabschnitt (`zeitfenster`, `zusammenhang`, `fortschreibung`, `kernaussage`, `quellen`, `rueckblick`).

## Arbeitsanweisungen

Markdown mit Platzhaltern: `{{profil.*}}`, `{{auftrag.*}}` (Sachverhalt, Ausgangsquellen, Stichtag, Prüffrage, Ereignisarten), `{{jetzt}}` und `{{app.ausgabevertrag}}`. Den Ausgabevertrag setzt die App ein. Er beschreibt, in welcher technischen Form die KI antworten soll.

| Schlüssel in `anweisungen` | Verwendung |
|---|---|
| `erfassung` (Pflicht) | Modus A, Stufe S2 Recherche und Entwurf |
| `kurzfassung` (optional) | Management Summary aus der fertigen Meldung; ohne Datei nutzt die App eine knappe Standardanweisung. Die Absätze folgen `rollen.sv_analysefelder`. |
| `verdichtung` (optional) | Modus B: ergänzt die Erfassungsanweisung, sobald Eingangsmeldungen anderer Stellen im Material liegen; ohne Datei nutzt die App eine knappe Standardfassung |

Modelle je Rolle (`modelle`): `vorverarbeitung` (S1), `erfassung` (S2), `verdichtung` (S2 bei Verdichtung), `reparatur` (S3), `kurzfassung`. Erlaubt sind Kennungen von Anthropic (`claude-…`) und OpenAI (`gpt-…`); die App wählt den Anbieter nach der Kennung. Die Einstellungen auf dem Gerät gehen vor.

Die Variable `kurzname` (optional) steht für Einschätzungen im Fließtext, z. B. „Einschätzung (Koordinierungsstelle)“. Fehlt sie, setzt die App `meldende_stelle` ein.

## SOP-Dateien

Eine Sammelmappe wird an HTML-Ankern (`<a id="sop-01"></a>`) zerlegt. Ohne Anker gilt eine Datei als eine SOP. Aus dem YAML-Block oder Frontmatter liest die App `lageart`, `art_vorschlag` und `version`. Der in `teil_gemeinsam` genannte Abschnitt geht jeder KI-Anfrage mit.

## Prüfung beim Import

Die App prüft die Struktur von Manifest, Darstellungsdatei und Kontakten (u. a. mindestens ein Bearbeitungsschritt, Pflichtrollen als Text, Radare mit ganzzahligem `max` und vollständigen Achsen). Fehler verhindern die Aktivierung. Ein Paket mit gleicher ID und Version, aber anderem Inhalt gilt als Versionskonflikt; ersetzt man es trotzdem, bleibt der alte Stand im Gerät archiviert. Für geänderte Inhalte daher die Version erhöhen.


Die App meldet Fehler (Profil nicht verwendbar), Warnungen und Hinweise. Geprüft werden unter anderem: Pflichtdateien, gültiges JSON, verwendbares Schema, Felder und Rollen der Darstellungsdatei, Anzahl der Stufentexte, Platzhalter ohne Profilvariable, Erkennbarkeit des gemeinsamen SOP-Teils und die Übereinstimmung der Stufentexte mit dem Kodierleitfaden.

Jede Profilversion erhält eine Prüfsumme (SHA-256 über alle Dateien). Sie wird mit jedem KI-Lauf protokolliert, damit jedes Ergebnis seiner Regelgrundlage zugeordnet bleibt.

## Versionierung und Änderungsverlauf eines Profils

- `version` im Manifest folgt Semantic Versioning: erste Stelle bei inkompatiblen Schemaänderungen (Meldungen brauchen eine Migration), zweite bei neuen Inhalten oder geänderten Regeln, dritte bei Korrekturen ohne fachliche Wirkung. Geänderte Inhalte erhalten immer eine neue Version.
- Jedes Dokument (Arbeitsanweisungen, SOP, Kodierleitfaden) nennt im Kopf seine Fassung und deren Datum.
- Eine Datei `CHANGELOG.md` im Paket führt die Änderungen je Profilversion, mit Datum und Bezug auf die betroffenen Dokumente. Fachliche Festlegungen (z. B. Kodierregeln) stehen zusätzlich im Änderungsprotokoll des jeweiligen Dokuments.
- `CHANGELOG.md` wird nicht an KI-Modelle übergeben.

## Änderungsverlauf

Das Format bleibt `lead-profil/1`; alle Ergänzungen sind optional und rückwärtsverträglich. Ältere Pakete bleiben gültig, sofern sie die Strukturprüfung bestehen.

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 17.10.2026 | Erstfassung: Manifest, Schema, Darstellungsdatei mit Rollen, Kennsätzen und Quellenkategorien, Arbeitsanweisungen mit Platzhaltern, SOP-Dateien, Kodierleitfaden, Kontakte, Migrationen |
| 1.1 | 17.10.2026 | `anweisungen.kurzfassung` (Management Summary) beschrieben; Variable `kurzname`; Tabelle der Anweisungsschlüssel |
| 1.2 | 18.10.2026 | Darstellungsdatei: `lagebild` und Rolle `tendenz_verschaerfung`; Reihenfolge der Beurteilungsstufen als Schwere; Manifest: `beispiele`; Aufbau von `kontakte.json` |
| 1.3 | 18.10.2026 | `anweisungen.verdichtung` in Gebrauch (bisher „geplant“); Modellrollen einschließlich `verdichtung`, Modellkennungen von Anthropic und OpenAI |
| 1.4 | 18.10.2026 | Manifest: `eigene_stellen`; Strukturprüfung beim Import (Fehler verhindern die Aktivierung); Versionskonflikt bei gleicher Version mit anderem Inhalt; Abschnitt „Versionierung und Änderungsverlauf eines Profils“; Prüfsumme wird im Laufprotokoll geführt |
| 1.5 | 18.10.2026 | Rolle `freigabe`; Abschnitt `bewertung_gliederung` |
| 1.6 | 18.10.2026 | Abschnitt `analyse_gliederung`; Option `kurzlabel`; Prüfung beider Gliederungsabschnitte beim Import. Reihenfolge der Zeilen 1.4 und 1.5 in dieser Tabelle berichtigt |

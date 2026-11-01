# Profilformat `lead-profil/1`

Beschreibung Fassung 1.28 vom 01.11.2026 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

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

**Lesedokumente.** Die Profilansicht zeigt unter „Arbeitsanweisungen und Kodierleitfaden“ die im Manifest genannten Arbeitsanweisungen und den Kodierleitfaden. Unter „Dokumentation lesen“ zeigt sie, soweit das Paket sie enthält, `sop/README.md` (Übersicht der SOP-Sammlung), `sop/CHANGELOG.md`, `README.md` (Beschreibung des Profils) und `CHANGELOG.md`. Ein eigenes Manifestfeld ist dafür nicht nötig. Die eigene Fassung eines Dokuments liest die App aus dem ersten Absatz nach der ersten Überschrift, als erstes „Fassung X“ mit optionalem „vom TT.MM.JJJJ“; Fassungen anderer Dokumente, die dort zitiert werden, sollten danach stehen. Fehlen Verdichtung oder Kurzfassung, zeigt die Profilansicht die Standardfassung der App, die dann verwendet wird. README- und CHANGELOG-Dateien gehen nicht an KI-Modelle. Markdown wird ohne rohes HTML und ohne Bilder dargestellt; relative Links sollen auf Dateien im selben Paket zeigen.

## Manifest `profil.json`

```json
{
  "format": "lead-profil/1",
  "id": "de.beispiel.kreis-x",
  "name": "Lagemeldung Kreis X",
  "beschreibung": "Lagemeldungen des Stabes Kreis X",
  "version": "2026.10.1",
  "herausgeber": "Kreis X",
  "lizenz": "LicenseRef-intern",
  "ebene": "Kreis",
  "referenzraum": "Kreisgebiet X",
  "variablen": { "land": "Thüringen", "meldende_stelle": "Stab Kreis X", "zeitzone": "Europe/Berlin" },
  "meldung": {
    "schema": "meldung.schema.json",
    "ui": "meldung.ui.json",
    "schema_id": "LEAD-Meldung-v1",
    "eingang_schema_ids": ["LEAD-Meldung-v1"],
    "eingang_schemata": { "LEAD-Meldung-Land-v1": { "datei": "eingang/LEAD-Meldung-Land-v1.schema.json", "gebiet": "kreis" } }
  },
  "migrationen": [{ "von": "Alt-v1", "setze": { "schema": "Neu-v2" }, "ergaenze": { "quellen": "" }, "hinweis": "Altformat überführt." }],
  "anweisungen": { "erfassung": "anweisung-erfassung.md", "kurzfassung": "anweisung-kurzfassung.md" },
  "sop": { "dateien": ["sop/sammelmappe.md"], "teil_gemeinsam": "teil-a" },
  "kodierleitfaden": "kodierleitfaden.md",
  "kontakte": "kontakte.json",
  "beispiele": [{ "titel": "Übungslage (FIKTIV)", "ordner": "beispiele/uebung", "hinweis": "Erfundene Lage" }],
  "modelle": { "vorverarbeitung": "claude-haiku-5-5", "erfassung": "claude-opus-5-5", "verdichtung": "claude-opus-5-5" },
  "farbschema": { "basis": "de-th", "name": "Stab Kreis X", "farben": { "marke-akzent-1": "#0089C1", "marke-akzent-2": "#FFFFFF", "marke-akzent-3": "#D62B32" } }
}
```

- `variablen`: Werte, die in neuen Meldungen vorbelegt werden, wenn das Schema ein gleichnamiges Feld der obersten Ebene hat, und die als `{{profil.<name>}}` in Arbeitsanweisungen zur Verfügung stehen. Zusätzlich gibt es `{{profil.referenzraum}}`, `{{profil.ebene}}` und `{{profil.name}}`.
- `eingang_schema_ids`: Schemakennungen, die die App beim Öffnen ohne Warnung annimmt.
- `eingang_schemata` (optional, seit Fassung 1.27, App 0.6.19): Schemata anderer Stellen, gegen die das Lagebild deren Meldungen prüft. Je Schemakennung `datei` (Pfad einer Schemadatei im Paket) und optional `gebiet` (Feld, in dem die fremde Meldung ihr Gebiet nennt, etwa `kreis`). Die Meldungen bleiben fremd, gehen also nur in die KI-Verdichtung ein; das Lagebild zeigt ihre Schemabefunde („fremdes Schema ✓“ oder „fremdes Schema: n“) und ihr Gebiet. Eine fehlende oder unbrauchbare Datei, das eigene Schema oder eine abweichende Schemakennung in der Datei ergeben eine Warnung; das Profil bleibt nutzbar. Hintergrund: [AUSTAUSCH.md](AUSTAUSCH.md), Abschnitt 8.
- `migrationen`: einfache Überführungen älterer Schemakennungen. `setze` überschreibt Felder, `ergaenze` ergänzt fehlende Felder.
- `eigene_stellen`: weitere Bezeichnungen, unter denen die eigene Stelle meldet. Die App erkennt eigene Meldungen (Vormeldung statt Eingangsmeldung) nur bei exakter Übereinstimmung mit `variablen.meldende_stelle` oder einem dieser Namen, nach Angleichung von Groß-/Kleinschreibung und Leerraum. In KI-Entwürfen setzt sie Land und meldende Stelle aus dem Profil.
- `farbschema` (optional): Farbschema der Oberfläche, wenn unter „Einstellungen → Darstellung“ „Farben des aktiven Profils“ gewählt ist. `basis` ist eine Kennung des Katalogs (`neutral-hell`, `neutral-dunkel`, `kontrast-hell`, `kontrast-dunkel`, `bund`, `bevoelkerungsschutz`, `de-bw` … `de-th`; bei einer Kontrastbasis gilt für Text 7:1), `name` ein Text bis 80 Zeichen, `farben` einzelne Farbrollen als `#RRGGBB`. Signalfarben, Schrift und CSS sind nicht änderbar; Kontraste werden geprüft. Ein fehlerhaftes Farbschema ergibt eine Warnung und wird nicht verwendet, das Profil bleibt nutzbar. Einzelheiten: [farbschemas.md](farbschemas.md).
- `beispiele`: Ordner im Paket mit Meldungen als JSON. Das Lagebild bietet sie unter „Beispiel laden“ an; sie gehen nie an ein KI-Modell, solange man sie nicht selbst übergibt. Fiktive Daten im Titel und in jeder Meldung als solche kennzeichnen.
- `herausgeber`, `lizenz` (optional): wer das Profilpaket herausgibt und unter welcher Lizenz, als SPDX-Kennung (z. B. `CC-BY-4.0`, `CC0-1.0`) oder als Ausdruck (`CC-BY-4.0 OR CC0-1.0`); für nicht veröffentlichte Profile z. B. `LicenseRef-intern`. Die Profilansicht zeigt beide Angaben; die App prüft sie nicht. Wer ein Profil unter CC BY 4.0 bearbeitet, nennt den ursprünglichen Herausgeber weiter und vermerkt die Bearbeitung. Die mitgelieferte Vorlage (`profile/muster/`) steht unter CC0 1.0; wer sie übernimmt, setzt `herausgeber` und `lizenz` selbst.

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
| `label` | Bezeichnung. Ohne `label` gilt der Feldname. Seit Fassung 1.26 erscheinen Listen (außer der Rolle `sachverhalte`) und Objekte, die in einem anderen Objekt stehen, als Gruppe mit dieser Bezeichnung als Überschrift; Objekte der obersten Ebene und Listenelemente ohne `label` bleiben ohne Rahmen. Listen von Objekten stehen im PDF der Meldung als Zeilen „Liste n › Feld“, in Rohtabelle und CSV als Text je Element („Name n – Titel“, darunter „Feld: Wert“) |
| `hinweis` | Ausfüllhinweis zwischen Beschriftung und Eingabe (seit App 0.6.21; vorher unter dem Feld); bei einer Gruppe Einleitung unter ihrer Überschrift. Bewährt: Leitfrage zuerst, dann wenige Arbeitshinweise |
| `platzhalter` | Platzhaltertext im Eingabefeld |
| `widget` | `text`, `text_lang`, `datum` (Tag, Schaltfläche „Heute“), `datumzeit` (Tag und Uhrzeit, Uhrzeit nötig, „Jetzt“), `datum_uhrzeit` (Tag, Uhrzeit optional, „Jetzt“ und „Nur Tag“; Schema-Muster z. B. `^$\|^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$`), `auswahl`, `radio`, `mehrfachauswahl`, `radar`, `quellen`, seit Fassung 1.23 `zeitstrahl` (Textfeld mit Baukasten für Zeilen und „Chronologisch ordnen“), `kennung` (Textfeld mit „Kennung vergeben“, solange leer) und `kennungen` (Liste von Texten als eine Zeile, getrennt durch Komma, Semikolon oder Leerzeichen). Alle Zeitfelder haben „Leeren“; „Jetzt“ gilt in `variablen.zeitzone`. |
| `leer_label` | Beschriftung für den Leerwert einer Auswahl |
| `pflicht` | Hinweis „Pflicht für finale Meldung“ und Prüfung im letzten Schritt |
| `layout` | `zeile` oder `spalten` für Gruppen |
| `element_label`, `titel_feld`, `hinzufuegen` | Listen: Name eines Elements, Feld für dessen Überschrift, Text der Schaltfläche. Ohne `titel_feld` nimmt die App seit Fassung 1.26 den Wert eines einfachen Elements bzw. den ersten nicht leeren Text auf oberster Ebene eines Objekts (gekürzt auf 80 Zeichen); ein leeres `titel_feld` bleibt „ohne Bezeichnung“ |
| `radar` | Name eines Radars aus `radare` |
| `zeilen` | Höhe mehrzeiliger Eingabefelder in Zeilen |

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
| `herkunft`, `herkunft_standard`, `herkunft_kategorie` | Herkunftsrolle der meldenden Stelle im Lagebild (optional, seit Fassung 1.25): `herkunft` ist ein Pfad auf Meldungsebene (Text, z. B. `kritis.rolle`), `herkunft_standard` der Wert für Meldungen ohne Angabe in diesem Feld (Text, z. B. `Behörde`), `herkunft_kategorie` ordnet Werten eine Quellenkategorie aus `quellen.kategorien` zu (Objekt mit Texten, z. B. `{"Betreiber": "B", "Behörde": "A"}`). Siehe Absatz unter der Tabelle |
| `quellen` | zentrales Quellenverzeichnis |
| `zeitstrahl` | Zeitstrahl auf Meldungsebene (Text, eine Zeile je Ereignis, seit Fassung 1.23); setzt `sv_kennung` voraus, sonst Warnung `ZEITSTRAHL_OHNE_KENNUNG` |
| `sachverhalte` | Liste der Sachverhalte |
| `sv_kennung` | Sachverhaltskennung (Text); die App vergibt sie beim Anlegen und nach einem KI-Entwurf, bei der Fortschreibung bleibt sie gleich (seit Fassung 1.23) |
| `sv_bezug` | Kennungen der Sachverhalte, aus denen der Sachverhalt hervorgeht (Liste von Texten; Verdichtung, Teilung; seit Fassung 1.23) |
| `sv_bezeichnung`, `sv_art`, `sv_ort`, `sv_eintritt` | Kopfdaten eines Sachverhalts |
| `sv_beurteilung`, `sv_tendenz`, `sv_bewertung_text` | Bewertung und Kennsätze |
| `sv_radar` | Radar des Sachverhalts |
| `sv_textfelder`, `sv_analysefelder` | Texte mit Quellenverweisen bzw. Analysefelder der Kurzfassung |
| `sv_massnahmen` | Maßnahmenfeld eines Sachverhalts; der Redaktionscheck verlangt bei hoher Beurteilung Angaben |
| `beurteilung_hoch`, `tendenz_entspannung`, `tendenz_verschaerfung` | Werte für Kennzahlen und Redaktionshinweise; ohne `beurteilung_hoch` gelten die beiden höchsten Stufen des Schemas (der Redaktionscheck weist das aus), ohne `tendenz_verschaerfung` der letzte Wert der Aufzählung. Als gegenläufig gelten nur `tendenz_entspannung` und die Verschärfung |

**Herkunftsrolle (seit Fassung 1.25, App 0.6.13, Issue #114, A1).** Mit `herkunft` kennzeichnet das Lagebild jede Meldung und jeden Sachverhalt mit der Herkunft der meldenden Stelle, etwa Behörde oder Betreiber: Dateiliste, Karten unter „Meldungen“, Meldestatus, Tabelle „Sachverhalte“ (Spalte „Meldung“), Lagenradar und eine Verteilung „Herkunft (Meldungen)“ in der Übersicht. Ein Filter „Herkunft“ blendet Meldungen je Wert ein und aus; er gilt für Übersicht, Meldungen, Sachverhalte, Lagenradar, Kopiervorlage, Rohtabelle, PDF und CSV, nicht für Dateiliste, Meldestatus, Redaktionscheck und Übergabe an die KI-Verdichtung. Rohtabelle und CSV erhalten nach „Datei“ die Spalte „Herkunft“ und mit `herkunft_kategorie` die Spalte „Herkunft: Quellenkategorie“; die Kopiervorlage nennt die Herkunft in der Kopfzeile der Stelle, das Lagebild-PDF in einer Spalte der Übersicht, je Meldung und in einem Vermerk unter der Kopfzeile (Verteilung und gegebenenfalls die Auswahl des Filters). Ohne Wert und ohne `herkunft_standard` heißt die Herkunft „keine Angabe“. Ohne `herkunft` bleibt das Lagebild unverändert. Beim Laden prüft die App die Typen wie bei den übrigen Rollen (Fehler) und meldet als Warnung ein unbekanntes Feld, Kategorien, die `quellen.kategorien` nicht führt (`HERKUNFT_KATEGORIE_UNBEKANNT`), sowie `herkunft_standard` oder `herkunft_kategorie` ohne `herkunft` (`HERKUNFT_OHNE_ROLLE`). Die Rolle ist allgemein; welche Werte es gibt und wie sie im Schema stehen, legt das Profil fest. Ein Beispiel ist das Profilpaket `lead-kritis` des Schwesterdemonstrators [KRITIS-LEAD](https://github.com/pereirawolf/kritis-lead), das Betreibermeldungen neben Behördenmeldungen führt; KI-LEAD hängt nicht von ihm ab und lädt Regeln nie zur Laufzeit nach, sondern nur als importiertes, versioniertes Profilpaket.

Die Reihenfolge der Aufzählung von `sv_beurteilung` im Schema gilt als aufsteigende Schwere: Das Lagebild sortiert danach und färbt die höchste Stufe rot, die zweithöchste orange, die dritthöchste gelb. Dieselbe Zuordnung nach Rang gilt seit App 0.6.5 in der Meldungsmaske (gewählte Bewertung, Rand des Sachverhalts, Übersicht im Prüfschritt; Attribut `data-rang` 3, 2, 1, sonst 0); die gewählte Tendenz ist rot bei der Verschärfung und grün bei `tendenz_entspannung` (`data-tendenz`). Bis 0.6.4 hingen diese Farben an den Wörtern des Beispielprofils („geringfügig“, „erheblich“, „kritisch“), ein Profil mit anderen Stufen blieb ungefärbt.

### Weitere Abschnitte

- `format` (`lead-ui/1`), `titel`, `untertitel`: Kennung der Darstellungsdatei; `titel` ist der Titel des Produkts (Überschrift und Metadatentitel des Meldungs-PDF), `untertitel` eine optionale Ergänzung unter dem Kennsatz der Erfassung. Überschrift und Kennsatz der Bereiche legt seit App 0.6.10 die App fest; `ausblenden`: Felder der obersten Ebene, die das Formular nicht zeigt.
- `kennsaetze`: feste Satzanfänge (z. B. „Neubewertung bei:“), die die App in Bewertungstexten erkennt. Drei Schlüssel wertet die App selbst aus; sie sind seit Fassung 1.20 Pflicht (App 0.6.3, TP-2026-W44-27). Fehlt einer, lädt das Profil mit der Warnung `KENNSATZ_FEHLT` je Schlüssel:

  | Schlüssel | Auswertung der App | Vorschlag (Text des Beispielprofils) | ohne den Kennsatz |
  |---|---|---|---|
  | `handlungsrelevant` | Fristen für Management Summary (Fristenblock) und Redaktionscheck (zeitkritische Aufgaben) | „Handlungsrelevant bis:“ | keine Fristen erkannt |
  | `aenderung` | Änderungsvermerk einer Fortschreibung im Redaktionscheck | „Änderung zur Vormeldung:“ | keine Prüfung der Änderungsvermerke |
  | `abweichung` | abweichende Bewertungen im Redaktionscheck; Textbaustein „abweichende Bewertung“; Standardfassung Verdichtung | „Abweichende Bewertung:“ | Redaktionscheck erkennt keine abweichenden Bewertungen; Textbaustein und Standardfassung nehmen den Vorschlag als Ersatztext |

  Weitere Kennsätze (etwa `neubewertung`, `abschluss`) sind optional. Die Vorlage `profile/muster/` führt die drei Pflichtkennsätze mit den Texten des Beispielprofils.
- `quellen`: Kategorien mit Erläuterung (Kennung je ein Großbuchstabe), optional `rangfolge` (Quellenpriorität bei Widersprüchen, höchste zuerst, jede Kategorie genau einmal; z. B. `["A", "B", "W", "M", "P"]`), `rangfolge_hinweis`, Altkategorien und Vorlage für neue Einträge (`{n}`, `{heute}`). Die App zeigt die Kategorien in der Rangfolge an und prüft beim Import Kennungen und Rangfolge. Unter dem Quellenfeld stellt ein Baukasten neue Zeilen aus Kategorie, Art (Vorlage des Profils, Online-Quelle, Pressemitteilung, Lagebild, Meldung aus dem gespeicherten Lagebild, Datensatz, Beitrag in sozialen Medien, Auskunft, Dokument ohne URL) und Zusätzen (Datenstand, Paywall, nicht ausgewertet) zusammen; Zeilen haben die Form `[Qn] K – …`. Die Kategorie, die eine Art vorschlägt, leitet die App seit Fassung 1.20 aus den Kategorien des Profils ab (App 0.6.3, TP-2026-W44-27): die erste Kategorie der Rangfolge, deren Bezeichnung (Text vor „ – “) zur Rolle der Art passt – amtlich bzw. Behörde (Pressemitteilung, Lagebild, Meldung aus dem Lagebild), Betreiber (Auskunft), wissenschaftlich (Dokument ohne URL), privat (Beitrag in sozialen Medien); passt keine, schlägt sie keine vor. Ohne `vorlage` beginnt eine neue Zeile mit der ersten Kategorie der Rangfolge (bisher fest „A“).
- `kennung` (seit Fassung 1.23): `praefixe` ordnet dem Wert des Felds der Rolle `land` ein Präfix zu (z. B. `"Thüringen": "DE-TH"`), `standard` gilt für leere oder nicht genannte Werte (ohne Angabe „SV“). Ein Präfix besteht aus ein bis vier Segmenten aus Großbuchstaben und Ziffern (je bis acht Zeichen, getrennt durch „-“); die App prüft das beim Import. Eine Kennung hat die Form `Präfix-JJJJMMTT-XXXX`: Anlagedatum in der Zeitzone des Profils und vier Zufallszeichen aus dem Base32-Alphabet nach Crockford (ohne I, L, O, U). Sie ist ohne Register und ohne Zählerstand eindeutig. Wer die Form im Schema prüfen will, nimmt das Muster `^$|^[A-Z0-9]{1,8}(-[A-Z0-9]{1,8}){0,3}-[0-9]{8}-[0-9A-HJKMNP-TV-Z]{4}$`.
- `zeitstrahl` (seit Fassung 1.23): `typen` (Liste in der Reihenfolge der Auswahl, ohne „·“, „|“, „–“ und eckige Klammern), `typ_bewertung` (Typ der Bewertungszeilen, die die App bei der KI-Fortschreibung selbst setzt; ohne Quellenverweis zulässig), `typ_berichtigung` (Typ einer Korrektur, nennt die berichtigte Zeile mit „[Zn]“) und `richtwert_je_sachverhalt` (ganze Zahl, darüber ein Hinweis). Ohne Abschnitt gelten die Werte des Beispielprofils (Ereignis, Warnung, Maßnahme, Wendepunkt, Wiederherstellung, Bewertung, Berichtigung; Richtwert 12). Eine Zeile hat die Form `[Zn] JJJJ-MM-TT[Thh:mm] · Kennung · Typ – Kurztext [Qn] · aufgenommen JJJJ-MM-TTThh:mm` (auch „|“ statt „·“ und „-“ statt „–“ werden gelesen); die Kenntniszeit am Ende ist optional, die App setzt sie auf den Meldezeitpunkt der ersten Meldung mit der Zeile. Die App prüft Form, Zeitpunkt (kalendarisch, nicht nach dem Meldezeitpunkt), Kenntniszeit (gültig, nicht vor dem Ereignis, nicht nach dem Meldezeitpunkt; fehlend als Hinweis), Kennung eines Sachverhalts der Meldung, Typ, Quellenverweis außer bei `typ_bewertung`, doppelte Nummern, Reihenfolge, Berichtigung mit Bezug und Richtwert; Verweise im Zeitstrahl zählen im Quellenverzeichnis als Zitate. PDF, Kopiervorlage und Rohtabelle des Lagebilds zeigen den Zeitstrahl, die Management Summary erhält ihn nicht. Nach einem KI-Entwurf vergibt die App die Kennungen (Platzhalter `NEU-n` der KI), prüft den Bezug gegen Eingangs- und Vormeldungen, hält Zeilen der eigenen Vormeldung wortgleich, setzt die Kenntniszeit und trägt Wechsel von Beurteilung und Tendenz als Zeile vom Typ `typ_bewertung` ein (Spezifikation, Abschnitt „Zeitstrahl, Kennung und Bezug“).
- `dateiname`: Vorlage mit Feldnamen in geschweiften Klammern. Der Meldezeitpunkt steht im Dateinamen immer vorn (`2026-10-20T20-31_…`), auch wenn `{meldezeitpunkt}` in der Vorlage am Ende steht oder fehlt.
- `kurzfassung`: Titel und Kopfzeile der Klartext-Kurzfassung.
- `bewertung_gliederung`: Satzanfänge (reguläre Ausdrücke) zur Gliederung des Bewertungstexts in Ausgaben; `absatz` beginnt mit Leerzeile, `zeile` auf neuer Zeile. Kennsätze gliedert die App selbst. Beispiel: `{ "absatz": ["Kernaussage:", "Beurteilung „"], "zeile": ["D[2-9] (=|offen)"] }`.
- `analyse_gliederung`: dasselbe für die Analysefelder (Rolle `sv_analysefelder`). Ein Umbruch entsteht nur nach einem Satzende (`. ; ! ? ) ] “`), bei `zeile` auch nach einem Doppelpunkt, damit eine Aufzählung „Prüfbedarf: (1) … (2) …“ untereinander steht. Mit `kurzlabel: n` beginnt zusätzlich jeder kurze Aspektbegriff aus höchstens n Wörtern mit Doppelpunkt eine neue Zeile („Strom:“, „Verkehr → Versorgung:“, „Land (Behörde):“); Ordnungszahlen „(1)“ und „1.“ bleiben bei ihrem Begriff. `kurzlabel` gilt auch in `bewertung_gliederung`, Werte 0 bis 8, 0 oder fehlend schaltet es ab. Beispiel: `{ "absatz": ["Szenario:", "Einordnung „"], "zeile": ["\\(\\d+\\) "], "kurzlabel": 3 }`. Die Gliederung betrifft nur Ausgaben (PDF, Kopiervorlage, Lagebild-Tabelle), nie die gespeicherte Meldung.
- `lagebild`: `titel` (Titel des Produkts in Lagebild-PDF, Redaktionsbericht und Dateinamen; bis App 0.6.9 auch Name des Moduls in der Navigation, seit 0.6.10 heißt der Bereich „Auswertung“), `ausgabe_label` und `ausgabe_tage` (Vorbelegung der nächsten Ausgabe im Redaktionscheck; Fristen und Ausgabe gelten in der Zeitzone `variablen.zeitzone`, Standard Europe/Berlin) und `verweise` mit Fundstellen der SOP je Prüfabschnitt (`zeitfenster`, `zusammenhang`, `fortschreibung`, `kernaussage`, `quellen`, `rueckblick`).

### `feldhilfen` (LEAD-Eingabehilfen)

Optionale Vorlagen für die Textfelder eines Sachverhalts mit der Rolle `sv_analysefelder` oder `sv_bewertung_text`. Unter jedem konfigurierten Feld zeigt die App einen zugeklappten Bereich „LEAD-Eingabehilfen“; jede Schaltfläche fügt eine Vorlage mit offenen Stellen `⟦…⟧` in genau dieses Feld ein. Die Vorlagen sind freiwillige Eingabehilfen nach den bestehenden Regeln des Profils: Sie sollen nur Satzanfänge und Kennsätze verwenden, die das Profil schon führt (Gliederung, Kennsätze, Arbeitsanweisung), und begründen weder neue Kennsätze noch Pflichtangaben. Es gibt keine KI-Funktion und keine Netzwerkanfrage.

```json
"feldhilfen": {
  "format": "lead-feldhilfen/1",
  "felder": {
    "analyse.massnahmen_empfehlungen": {
      "vorlagen": [
        { "id": "massnahmen", "label": "Bestehende Maßnahmen:",
          "vorlage": "Bestehende Maßnahmen: ⟦verantwortliche Stelle⟧ – ⟦dokumentierte Maßnahme⟧; Status: ⟦Status auswählen⟧; Stand: ⟦Datenstand⟧; ⟦Quellenverweis⟧.",
          "status_auswahl": ["geplant", "angefordert", "angeordnet", "begonnen", "umgesetzt", "wirksam", "beendet"] }
      ]
    },
    "sofort.bewertung_text": {
      "vorlagen": [
        { "id": "beurteilung", "label": "Beurteilung „…“:", "position": "vor_kennsaetzen", "nur_mit_wert": "beurteilung",
          "vorlage": "Beurteilung „{{beurteilung}}“: ⟦bereits vorliegende Begründung im Referenzraum⟧." },
        { "id": "neubewertung", "label": "Neubewertung bei:", "kennsatz": "neubewertung",
          "vorlage": "⟦Indikator oder Bedingung, die eine Neubewertung erfordern würde⟧" }
      ]
    }
  }
}
```

Die Schlüssel unter `felder` sind Pfade relativ zum Sachverhalt, wie in den Rollen. Je Feld gibt es nur `vorlagen` (nicht leere Liste, Reihenfolge der Schaltflächen). Je Vorlage:

| Angabe | Bedeutung |
|---|---|
| `id` | eindeutig im Feld |
| `label` | Beschriftung der Schaltfläche (der Satzanfang) |
| `vorlage` | Klartext ohne spitze Klammern; offene Stellen als vollständiges `⟦…⟧` (1 bis 160 Zeichen, eine Zeile) |
| `hinweis` | optional; steht sichtbar neben der Schaltfläche |
| `position` | `anfang`, `vor_kennsaetzen` (vor den Block der Kennsatzzeilen am Textende) oder `ende` (Vorgabe); immer als eigener Absatz |
| `kennsatz` | Schlüssel aus `kennsaetze`, nur im Bewertungstext und nicht zusammen mit `position`: die App stellt den Satzanfang aus `kennsaetze` voran und fügt eine eigene Zeile im Kennsatzblock am Textende ein, in der Reihenfolge von `kennsaetze` |
| `status_auswahl` | Werte für `⟦Status auswählen⟧`; ohne Vorauswahl |
| `nur_mit_wert` | `beurteilung` oder `tendenz`: Pflicht, wenn die Vorlage `{{beurteilung}}` bzw. `{{tendenz}}` enthält; ohne gewählten Wert ist die Schaltfläche gesperrt und nennt den Grund |

Gelesene Werte (nur beim Einfügen, nie geschrieben): `{{beurteilung}}` und `{{tendenz}}` des Sachverhalts, `{{t0}}` aus der Rolle `meldezeitpunkt` als „TT.MM.JJJJ, HH:MM Uhr“ bzw. „TT.MM.JJJJ“, `{{kurzname}}` aus `variablen.kurzname`. Fehlt ein Wert, bleibt eine offene Stelle; das aktuelle Datum wird nie eingesetzt. `⟦Quellenverweis⟧` ersetzt die App nur, wenn in „Quelle“ ein vorhandener Eintrag `[Qn]` des Quellenverzeichnisses gewählt ist.

Beim Einfügen wird vorhandener Text nicht umformuliert oder umsortiert; nur die Leerzeilen um den eingefügten Absatz werden vereinheitlicht. Beginnt der Text schon mit dem Satzanfang einer `anfang`-Vorlage oder steht ein Kennsatz schon am Zeilenanfang, springt die App dorthin, statt zu doppeln; steht ein Kennsatz nur im Fließtext, fügt sie nichts ein und weist darauf hin. Nach dem Einfügen ist die erste offene Stelle des eingefügten Bausteins markiert; „Einfügung rückgängig“ stellt den vorherigen Wert wieder her, solange der Text seither nicht geändert wurde.

Offene Stellen ergeben in der Prüfung einen Ausfüllhinweis. Im Redaktionscheck zählt ein Kennsatz mit offener Stelle nicht als Vermerk, eine Frist mit offener Stelle gilt als unvollständig; die Management Summary übernimmt keine offenen Stellen und weist darauf hin. Gesperrte Schaltflächen (fehlender Auswahlwert, Rücknahme nach Handeingabe) bleiben erreichbar und nennen beim Betätigen den Grund.

Die App prüft den Abschnitt beim Laden: Format, zulässige Felder, unbekannte Angaben auf jeder Ebene, doppelte Kennungen, Werte in `{{…}}` (nur die vier genannten, ohne Leerzeichen), vollständige `⟦…⟧`, `position`, `kennsatz`, `status_auswahl` und `nur_mit_wert`. Bei einem Fehler bleibt das Profil nutzbar; die Eingabehilfen werden dann nicht verwendet, und die Profilprüfung nennt den Grund. Profile ohne `feldhilfen` zeigen keinen Bereich.

## Arbeitsanweisungen

Markdown mit Platzhaltern. Alle drei Anweisungen kennen dieselben Profilangaben (seit App 0.6.4): `{{profil.<variable>}}` für jede Variable, dazu `{{profil.referenzraum}}`, `{{profil.ebene}}`, `{{profil.name}}`, `{{profil.kurzname}}` (ohne Variable: `meldende_stelle`) und `{{profil.lageprodukt}}` (ohne Variable: „Lagebild“), außerdem `{{kennsatz.<schlüssel>}}` mit den Kennsätzen der Darstellungsdatei (fehlende Pflichtkennsätze mit den Ersatztexten der App). Nur in der Erfassung: `{{app.ausgabevertrag}}` (den Ausgabevertrag setzt die App ein; er beschreibt, in welcher technischen Form die KI antworten soll), `{{auftrag.*}}` (`sachverhalt`, `ausgangsquellen`, `stichtag`, `prueffrage`, `ereignisarten`) und `{{jetzt}}`.

**Laufabhängige Aussagen gehören in den Steuerungsblock.** Auftragsangaben, Bearbeitungszeitpunkt, Meldezeitpunkt und Recherchemodus setzt die App seit 0.6.4 im Steuerungsblock zuletzt in den Systemauftrag von S2. `{{auftrag.*}}` und `{{jetzt}}` gelten in der Erfassung weiter (fremde Profile bleiben nutzbar), werden aber nicht mehr empfohlen: Eine Anweisung mit diesen Platzhaltern ändert sich je Lauf, und die App kann sie nicht im Cache des Anbieters halten. Ohne sie ist die Anweisung statisch und wird wie Profilgrundlagen und SOPs gecacht.

**Prüfung der Platzhalter.** Beim Laden meldet die App Platzhalter, die sie in der jeweiligen Anweisung nicht füllt: `{{profil.*}}` ohne Variable als „Platzhalter ohne Profilvariable“, alle übrigen (etwa ein Tippfehler wie `{{auftrag.stichtaq}}` oder `{{auftrag.*}}` in der Verdichtung) seit 0.6.4 als Warnung `PLATZHALTER_UNBEKANNT`. Bleibt im Lauf ein Platzhalter offen, steht er im Protokolleintrag der Stufe (`offenePlatzhalter`), und das Ergebnis trägt die Warnung `ANWEISUNG_PLATZHALTER_OFFEN` (Management Summary: als Hinweis); im Prompt stand dann „[nicht angegeben]“.

| Schlüssel in `anweisungen` | Verwendung |
|---|---|
| `erfassung` (Pflicht) | Modus A, Stufe S2 Recherche und Entwurf |
| `kurzfassung` (optional) | Management Summary aus der fertigen Meldung; ohne Datei nutzt die App eine knappe Standardanweisung. Die Absätze folgen `rollen.sv_analysefelder`. |
| `verdichtung` (optional) | Modus B: ergänzt die Erfassungsanweisung, sobald Eingangsmeldungen anderer Stellen im Material liegen; ohne Datei nutzt die App eine knappe Standardfassung |

Die Standardfassungen der App für Verdichtung und Kurzfassung (`src/profil/standardtexte/*.md`, seit App 0.6.3) zitieren keine SOP und keine festen Quellenkategorien; Fundstellen einer SOP-Sammlung gehören in die Anweisungen des Profils. Den Kennsatz für abweichende Bewertungen setzt die App in der Standardfassung Verdichtung aus `kennsaetze.abweichung` ein.

Modelle je Rolle (`modelle`): `vorverarbeitung` (S1), `erfassung` (S2), `verdichtung` (S2 bei Verdichtung), `reparatur` (S3), `kurzfassung`. Erlaubt sind Kennungen von Anthropic (`claude-…`), OpenAI (`gpt-…`, `o…`, `chatgpt-…`), Mistral (`mistral-…`, `ministral-…`, `magistral-…`, `codestral-…`, `pixtral-…`, `open-mistral-…`; seit App 0.5.6) und lokale Modelle über Ollama (`ollama:<modell>`, etwa `ollama:llama3.1`; seit App 0.6.3, ohne Websuche, nicht erprobt); die App wählt den Anbieter nach der Kennung. Eine Kennung, die zu keinem Anbieter gehört, ergibt seit App 0.6.3 beim Laden die Warnung `MODELL_UNBEKANNT`, und für die Rolle gilt die Vorgabe der App (bis 0.6.2 fiel sie still auf Anthropic). Die Einstellungen auf dem Gerät gehen vor.

Die Variable `kurzname` (optional) steht für Einschätzungen im Fließtext, z. B. „Einschätzung (Koordinierungsstelle)“. Fehlt sie, setzt die App `meldende_stelle` ein.

## SOP-Dateien

`sop.dateien` nennt die SOP-Dateien in der Reihenfolge, in der sie im SOP-Katalog der Stufe S1 erscheinen. Eine Datei kann einen Abschnitt (empfohlen: eine Datei je SOP bzw. Baustein) oder mehrere enthalten. Jeder Abschnitt beginnt mit einem HTML-Anker (`<a id="b01"></a>`); die ID muss über alle Dateien eindeutig sein. Text vor dem ersten Anker einer Datei wird nicht verwendet; die App warnt beim Import. Ohne Anker gilt eine Datei als eine SOP (ID = Dateiname). Der in `teil_gemeinsam` genannte Abschnitt geht jeder KI-Anfrage mit.

Aus dem YAML-Block oder Frontmatter liest die App:

| Schlüssel | Verwendung |
|---|---|
| `kennung` | Kennung im Laufprotokoll und in `_entstehung.sop`, z. B. „B08“ → „SOP-LEAD B08 Stromausfall / Blackout v2.0.1“; fehlt sie, gilt die Nummer am Anfang der Überschrift („B08. SOP LEAD: …“) |
| `lageart`, `version` | Anzeige und Kennung |
| `art_vorschlag` | Ereignisarten, bei deren Wahl die App die SOP in S1 vorschlägt; Abschnitte ohne `art_vorschlag` (Bausteine) erscheinen im Katalog, werden aber nicht automatisch hinzugefügt |
| `bisherige_ids` | frühere IDs (z. B. `sop-08`); die App bildet sie in gespeicherten Läufen auf die aktuelle ID ab |
| `bisherige_kennung` | frühere Kennung (z. B. „08“, „N05“); die App erkennt sie in der SOP-Angabe des Modells beim Abgleich |
| `typ` | „Dach-SOP“ oder ein Bausteintyp (z. B. „Themenbaustein“, „Querschnittsbaustein“); gliedert Auswahl und Katalog in Dach-SOPs und ergänzende Bausteine (ohne `typ`: Abschnitte ohne `art_vorschlag` gelten als Bausteine) |
| `lesegruppe` | Leseblock der Bausteine in Auswahl und Katalog (nur Navigation) |
| `status` | Bearbeitungsstand; beginnt er mit „Inhaltsgerüst“, zeigt die App eine entsprechende Marke |

Weitere Schlüssel (z. B. `zweck`) gehen mit dem Abschnitt an die KI; für Auswahl und Katalog wertet die App sie nicht aus. Bedeutung und Pflicht von `art_zuordnung`, `art_hinweis`, `anschluss`, `pruefausloeser` und `quellen_geprueft_am` legt das Profil fest (im Beispielprofil SOP-LEAD Teil A, A.1 Nr. 7 und A.10.2). Mitgelieferte Profile bettet die App ohne `sop/archiv/` und Lesefassung ein. `sop/README.md` ist eingebettet und erscheint als Lesedokument. Nicht im Manifest genannte Dateien (z. B. `sop/archiv/`, `sop/README.md`, eine erzeugte Lesefassung) liest die App nicht als SOP. Die Profilansicht zeigt aus dem Kopf `version` als Tag sowie einen Steckbrief (u. a. `bausteintyp` vor `typ`, `lesegruppe`, `art_vorschlag` bzw. `art_zuordnung`, `art_hinweis`, `anschluss`, `status`, `stand`, `naechste_pruefung_faellig`, `pflegeverantwortlich`). Das Skript `scripts/sop-lesefassung.mjs` (`npm run sop:lesefassung`) erzeugt aus den Dateien in `sop.dateien` eine Lesefassung mit Inhaltsverzeichnis, Teilüberschriften und Leseblöcken (aus `lesegruppe`); mit `--check` prüft es, ob sie aktuell ist. Beim Import prüft sie zusätzlich: doppelte IDs (Fehler), doppelte Kennungen und Aliasse, die eine vorhandene ID verdecken (Warnung).

## Prüfung beim Import

Die App prüft die Struktur von Manifest, Darstellungsdatei und Kontakten (u. a. mindestens ein Bearbeitungsschritt, Pflichtrollen als Text, Radare mit ganzzahligem `max` und vollständigen Achsen). Im Manifest müssen `id`, `name` und `version` nicht leere Texte sein; Pfadangaben sind Texte, `sop.dateien` und `meldung.eingang_schema_ids` Listen von Texten, `anweisungen` ein Objekt mit Texten, `migrationen` eine Liste mit `von` (Text) und gegebenenfalls `setze`/`ergaenze` als Objekte. Im Meldungsschema prüft die App neben bekannten Schlüsselwörtern auch deren Werte (etwa `required` als Liste von Feldnamen, `properties` als Objekt mit Teilschemata, Längen als ganze Zahlen ab 0) sowie zyklische Verweise, auch über `allOf` und ähnliche Verknüpfungen. Formen älterer Entwürfe, die die Prüfung nicht auswertet (`items` als Liste, boolesches `exclusiveMinimum`), werden abgewiesen. Das Schlüsselwort `format` (etwa `date-time`, `email`) ist zugelassen, wird aber weder von der App noch von der Referenzprüfung geprüft; ein Profil mit `format` lädt mit einem Hinweis je Format und Stelle (seit App 0.6.2, TP-2026-W44-10). Wer einen Wert einschränken will, legt ein `pattern` fest. `null` bei optionalen Texten im Manifest gilt als fehlende Angabe. Fehler verhindern die Aktivierung. Ein Paket mit gleicher ID und Version, aber anderem Inhalt gilt als Versionskonflikt; ersetzt man es trotzdem, bleibt der alte Stand im Gerät archiviert. Für geänderte Inhalte daher die Version erhöhen.


Die App meldet Fehler (Profil nicht verwendbar), Warnungen und Hinweise. Geprüft werden unter anderem: Pflichtdateien, gültiges JSON, verwendbares Schema, Felder und Rollen der Darstellungsdatei, Anzahl der Stufentexte, Platzhalter ohne Profilvariable, Erkennbarkeit des gemeinsamen SOP-Teils und die Übereinstimmung der Stufentexte mit dem Kodierleitfaden.

Jede Profilversion erhält eine Prüfsumme (SHA-256 über alle Dateien). Sie wird mit jedem KI-Lauf protokolliert, damit jedes Ergebnis seiner Regelgrundlage zugeordnet bleibt.

## Versionierung und Änderungsverlauf eines Profils

- `version` im Manifest folgt Semantic Versioning: erste Stelle bei inkompatiblen Schemaänderungen (Meldungen brauchen eine Migration), zweite bei neuen Inhalten oder geänderten Regeln, dritte bei Korrekturen ohne fachliche Wirkung. Geänderte Inhalte erhalten immer eine neue Version.
- Jedes Dokument (Arbeitsanweisungen, SOP, Kodierleitfaden) nennt im Kopf seine Fassung und deren Datum; für versionierte fachliche Regelwerke ist das Pflicht, auch im Musterprofil.
- Eine Datei `CHANGELOG.md` im Paket führt die Änderungen je Profilversion, mit Datum und Bezug auf die betroffenen Dokumente. Fachliche Festlegungen (z. B. Kodierregeln) stehen zusätzlich im Änderungsprotokoll des jeweiligen Dokuments.
- `CHANGELOG.md` wird nicht an KI-Modelle übergeben.

## Änderungsverlauf

Das Format bleibt `lead-profil/1`; alle Ergänzungen sind optional und rückwärtsverträglich (die Pflichtkennsätze der Fassung 1.20 ergeben nur eine Warnung). Ältere Pakete bleiben gültig, sofern sie die Strukturprüfung bestehen.

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 17.10.2026 | Erstfassung: Manifest, Schema, Darstellungsdatei mit Rollen, Kennsätzen und Quellenkategorien, Arbeitsanweisungen mit Platzhaltern, SOP-Dateien, Kodierleitfaden, Kontakte, Migrationen |
| 1.1 | 17.10.2026 | `anweisungen.kurzfassung` (Management Summary) beschrieben; Variable `kurzname`; Tabelle der Anweisungsschlüssel |
| 1.2 | 18.10.2026 | Darstellungsdatei: `lagebild` und Rolle `tendenz_verschaerfung`; Reihenfolge der Beurteilungsstufen als Schwere; Manifest: `beispiele`; Aufbau von `kontakte.json` |
| 1.3 | 18.10.2026 | `anweisungen.verdichtung` in Gebrauch (bisher „geplant“); Modellrollen einschließlich `verdichtung`, Modellkennungen von Anthropic und OpenAI |
| 1.4 | 18.10.2026 | Manifest: `eigene_stellen`; Strukturprüfung beim Import (Fehler verhindern die Aktivierung); Versionskonflikt bei gleicher Version mit anderem Inhalt; Abschnitt „Versionierung und Änderungsverlauf eines Profils“; Prüfsumme wird im Laufprotokoll geführt |
| 1.5 | 18.10.2026 | Rolle `freigabe`; Abschnitt `bewertung_gliederung` |
| 1.6 | 18.10.2026 | Abschnitt `analyse_gliederung`; Option `kurzlabel`; Prüfung beider Gliederungsabschnitte beim Import. Reihenfolge der Zeilen 1.4 und 1.5 in dieser Tabelle berichtigt |
| 1.7 | 19.10.2026 | Darstellungsdatei: `quellen.rangfolge` (Quellenpriorität) und Strukturprüfung des Abschnitts `quellen`; SOP-Abschnitte ohne `art_vorschlag` (Bausteine) und Kennung „SOP-LEAD N01 …“ |
| 1.8 | 19.10.2026 | SOP-Dateien: eine Datei je Abschnitt, Reihenfolge von `sop.dateien`, Kopfschlüssel `kennung`, `bisherige_ids`, `bisherige_kennung`; Importprüfungen auf Text vor dem ersten Anker und doppelte IDs |
| 1.9 | 20.10.2026 | SOP-Kopfschlüssel `typ`, `lesegruppe`, `status` werden ausgewertet (Gliederung der Auswahl, Marke „Inhaltsgerüst“); eingebettete Profile ohne Archiv, Lesefassung und SOP-Übersicht |
| 1.10 | 20.10.2026 | Lesedokumente (README, CHANGELOG, Arbeitsanweisungen, Kodierleitfaden) in der Profilansicht; `sop/README.md` wieder eingebettet; Steckbrief aus weiteren Kopfschlüsseln |
| 1.11 | 20.10.2026 | Eigene Fassung eines Lesedokuments im ersten Absatz nach der Überschrift („Fassung X vom TT.MM.JJJJ“); Standardfassungen der App bei fehlender Verdichtung oder Kurzfassung sichtbar |
| 1.12 | 20.10.2026 | Importprüfung: Datentypen der Manifestangaben und Werte der Schema-Schlüsselwörter; zyklische Verweise (App 0.4.15) |
| 1.13 | 20.10.2026 | Redaktionscheck: `variablen.zeitzone` bestimmt die Lesart von Fristen und nächster Ausgabe; Ersatzregel für fehlendes `beurteilung_hoch` dokumentiert (App 0.4.16) |
| 1.14 | 20.10.2026 | Optionales `farbschema` im Manifest; Datum vorn im Dateinamen unabhängig von der Stellung von `{meldezeitpunkt}` (App 0.4.17) |
| 1.15 | 20.10.2026 | `farbschema.basis` auch `kontrast-hell` und `kontrast-dunkel`, dann Textkontrast mindestens 7:1; Widget `datum_uhrzeit` (Tag, Uhrzeit optional); Zeitfelder mit „Jetzt“/„Heute“, „Nur Tag“ und „Leeren“; Baukasten für Quellenzeilen (App 0.4.18) |
| 1.16 | 21.10.2026 | Darstellungsdatei: optionaler Abschnitt `feldhilfen` (LEAD-Eingabehilfen, `lead-feldhilfen/1`) mit Vorlagen vorhandener Satzanfänge und Kennsätze für Analysefelder und Bewertungstext; Prüfung beim Laden deaktiviert nur die Eingabehilfen (App 0.4.24) |
| 1.17 | 23.10.2026 | Ohne Formatänderung nachgetragen: oberste Schlüssel `format`, `titel`, `untertitel`, `ausblenden`, Feldangabe `zeilen`, Rolle `sv_massnahmen`, Manifestfelder `beschreibung`, `herausgeber`, `lizenz`; ausgewertete SOP-Kopfschlüssel im Steckbrief (`bausteintyp`, `art_hinweis`, `anschluss`); Fassungsangabe Pflicht für versionierte fachliche Regelwerke (Konsistenzprüfung KW 43, KP-2026-W43-51 bis -53) |
| 1.18 | 24.10.2026 | Ohne Formatänderung: Manifestfelder `herausgeber` und `lizenz` beschrieben (SPDX-Kennung, `LicenseRef-intern` im Beispiel „Kreis X“); Hinweis auf die Vorlage unter CC0 1.0 (KP-2026-W43-58, -60); Fassungsangabe im Kopf nachgezogen |
| 1.19 | 26.10.2026 | Ohne Formatänderung: `format` im Meldungsschema wird nicht geprüft und beim Laden als Hinweis gemeldet (App 0.6.2, TP-2026-W44-10) |
| 1.20 | 27.10.2026 | Kennsätze `handlungsrelevant`, `aenderung` und `abweichung` sind Pflicht; fehlt einer, lädt das Profil mit der Warnung `KENNSATZ_FEHLT` (ältere Pakete bleiben nutzbar). Ersatztexte und Auswertung der App dokumentiert. Kategorievorschlag des Quellen-Baukastens und Vorlage ohne `quellen.vorlage` aus den Kategorien des Profils statt fester Buchstaben; Standardfassungen der App ohne SOP-Zitate (TP-2026-W44-27). Modellkennungen: Mistral nachgetragen, `ollama:<modell>` neu, unbekannte Kennung als Warnung `MODELL_UNBEKANNT` (TP-2026-W44-26) (App 0.6.3) |
| 1.21 | 27.10.2026 | Ohne Formatänderung: gleiche Profilplatzhalter in allen drei Arbeitsanweisungen, Prüfung aller Platzhalter beim Laden (Warnung `PLATZHALTER_UNBEKANNT`), offene Platzhalter im Protokoll und als Befund `ANWEISUNG_PLATZHALTER_OFFEN` (TP-2026-W44-33); `{{auftrag.*}}` und `{{jetzt}}` gelten weiter, werden aber nicht mehr empfohlen, laufabhängige Aussagen gehören in den Steuerungsblock (TP-2026-W44-31) (App 0.6.4) |
| 1.22 | 27.10.2026 | Ohne Formatänderung: Farben der Bewertung in der Meldungsmaske nach dem Rang der Aufzählung von `sv_beurteilung` und nach `tendenz_entspannung`/Verschärfung statt nach festen Wörtern (TP-2026-W44-16) (App 0.6.5) |
| 1.23 | 29.10.2026 | Optionale Rollen `zeitstrahl`, `sv_kennung` und `sv_bezug`, Abschnitte `kennung` und `zeitstrahl`, Widgets `zeitstrahl`, `kennung` und `kennungen`; Prüfung beim Import (Präfixe, Typen, Rollenfelder im Schema, Warnung `ZEITSTRAHL_OHNE_KENNUNG`). Ältere Pakete laden unverändert (ZS-2026-W44-01 bis -04) (App 0.6.9) |
| 1.24 | 30.10.2026 | Ohne Formatänderung: `titel` und `lagebild.titel` benennen nur noch die Produkte (Meldung, Lagebild) in den Ausgaben; Bereichsnamen, Überschriften und Kennsätze legt die App fest, `untertitel` ergänzt den Kennsatz der Erfassung (App 0.6.10, OF-2026-W44-03) |
| 1.25 | 31.10.2026 | Optionale Rollen `herkunft`, `herkunft_standard` und `herkunft_kategorie`: Herkunft der meldenden Stelle im Lagebild mit Kennzeichen, Filter, Spalten in Rohtabelle und CSV, Kopiervorlage und PDF; Prüfung beim Import (Typen als Fehler, Warnungen `HERKUNFT_KATEGORIE_UNBEKANNT` und `HERKUNFT_OHNE_ROLLE`). Ältere Pakete laden unverändert (App 0.6.13, Issue #114, A1) |
| 1.26 | 31.10.2026 | Ohne Formatänderung: Gruppenüberschriften für Listen und verschachtelte Objekte ohne `label`, Elementtitel ohne `titel_feld`, Listen von Objekten in PDF, Rohtabelle und CSV als lesbarer Text statt JSON (App 0.6.14, Issue #114, A2) |
| 1.27 | 31.10.2026 | Optionales Feld `meldung.eingang_schemata`: Prüfung fremder Meldungen gegen ein mitgeliefertes Schema, Gebiet aus einem eigenen Feld (App 0.6.19, TP-2026-W44-59) |
| 1.28 | 01.11.2026 | Ohne Formatänderung: `hinweis` steht in der App zwischen Beschriftung und Eingabe, bei Gruppen als Einleitung (App 0.6.21) |

# LEAD-Meldung v2 – Meldungsformat (Entwurf)

Formatfassung 2.0 vom 01.11.2026, **Entwurf zur fachlichen Abnahme** · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Schemakennung `LEAD-Meldung-v2`. Dateien: [formate/lead-meldung-v2/](../formate/lead-meldung-v2/README.md). Werkzeug: `npm run meldung:v2` ([scripts/lead-meldung-v2.mjs](../scripts/lead-meldung-v2.mjs)).

**Stand:** Das Format liegt neben `LEAD-Meldung-v1`. App und Profile arbeiten weiter mit v1, bis die App v2 lesen, erfassen und ausgeben kann (Abschnitt 10). Abwärtskompatibilität zu v1 ist ausdrücklich kein Ziel (Vorgabe des Herausgebers vom 01.11.2026); v1-Meldungen werden einmalig überführt (Abschnitt 11).

**Anlass:** Die Regeln der LEAD-Systematik (Kodierleitfaden, SOP-LEAD Teil A) sind differenzierter als das Datenmodell von v1. Quellenverzeichnis und Zeitstrahl sind dort Zeichenketten; Fristen, Bewertungsgründe, Radarbegründungen, abweichende Bewertungen und Änderungen stehen als Kennsätze im Fließtext und werden von der App aus Satzanfängen rekonstruiert (`src/kern/quellen.ts`, `zeitstrahl.ts`, `kennsaetze.ts`). Eine finale v1-Meldung besteht die Schemaprüfung auch mit leeren Analysefeldern, leerem Quellenverzeichnis und leerem Freigabeblock. v2 macht das, was die Regeln bereits verlangen, eindeutig darstellbar und prüfbar, ohne den Erfassungsaufwand über das fachlich Verlangte zu heben.

**Grundlagen des Entwurfs:** Vorschläge im Chat vom 31.10.2026, eine unabhängige Prüfung durch eine andere KI vom 31.10.2026 (Stand `4d148d1`) und der Austauschvertrag [AUSTAUSCH.md](AUSTAUSCH.md) 0.1. Was übernommen, angepasst oder verworfen wurde, steht in Abschnitt 12.

---

## 1. Grundsätze

1. **Ein Ort je Angabe.** Was strukturiert erfasst wird (Quellen, Zeitstrahl, Radar, Maßnahmen, Empfehlungen, Fristen, Kennzahlen, Kennsätze), steht nur dort. Lesbare Absätze und Kennsätze erzeugt die Darstellung daraus. Freitext ordnet ein, er trägt keine zweite Fassung von Status, Adressat oder Termin.
2. **Kern und Fachmodule.** Der Kern gilt für jede Meldung nach LEAD-Systematik (Identität, Absender, Zeit und Raum, Quellen, Sachverhalte mit Analyse, Bewertung und Handlungsbedarf, Freigabe, Entstehung). Fachliches wie Ereigniskatalog und Lagenradar steht in Modulen mit eigener Kennung und Fassung (Abschnitt 7).
3. **Wertzustände.** Ein leerer Wert vertritt nicht mehrere fachliche Zustände:

   | Zustand | Darstellung |
   |---|---|
   | nicht erhoben, nicht bearbeitet | optionales Feld fehlt |
   | unbekannt, keine tragfähige Angabe | `null` (Zeitangaben, Stufen, Richtungen, Zugang, Kennzahlwert) |
   | noch nicht geschrieben | leerer Text `""` (nur Textfelder, nur im Entwurf zulässig, wo der Text Pflicht ist) |
   | nicht zutreffend | nur wo fachlich definiert: Radarachse `offen` mit `offen_grund` `kein_bezugsgegenstand` |
   | belegter Nullwert | Zahl `0` bzw. Radarstufe 0 mit Beleg |
   | kein meldepflichtiger Sachverhalt | Block `fehlanzeige` mit Umfang, Zeitraum und Erklärung, ohne Sachverhalt |

4. **Zeit.** Zeitpunkte nach RFC 3339 mit UTC-Versatz (`2026-10-14T10:30+02:00`); ein Kalendertag ohne Uhrzeit (`2026-10-14`) gilt in der Zeitzone der Meldung (`zeitzone`, IANA). Eine Uhrzeit steht nur, wenn sie belegt ist. Getrennt geführt werden: Meldezeitpunkt (t0), Ereigniszeit (Zeitstrahl, Eintritt), Datenstand (Quelle, Kennzahl), `bekannt_seit` (erstes Bekanntwerden) und `erstmals_gemeldet` (erste eigene Meldung mit der Zeitstrahlzeile, bisher „Kenntniszeit“).
5. **Identität.** Jede Meldungsfassung hat eine `meldung_id` (UUID, empfohlen Version 7). Eine freigegebene Fassung bleibt unverändert; Fortschreibung und Berichtigung erzeugen eine neue Fassung mit eigener ID und `beziehungen`. Sachverhalte behalten ihre lesbare `kennung` über Fortschreibungen; ein `bezug` kann Kennung und Meldungsfassung gemeinsam nennen.
6. **Drei Prüfebenen.** (1) Schema: Struktur, Datentypen, Werte, Vollständigkeit je Status. (2) Referenzprüfung: Verweise und Konsistenz, die ein JSON-Schema nicht ausdrücken kann. (3) Mensch: Inhalt und Freigabe. Eine bestandene Prüfung auf Ebene 1 oder 2 belegt nicht den Inhalt (SOP-LEAD A.5).
7. **Lesbarkeit bleibt.** Die vier Analysebereiche der Meldevorlage bleiben erhalten: drei als Texte, „Maßnahmen & Handlungsempfehlungen“ als Block `handlungsbedarf`. Belege stehen im Text weiter als `[Qn]`; die Referenzprüfung löst jeden Verweis gegen das Quellenverzeichnis auf.

## 2. Aufbau einer Meldung

| Feld | Pflicht | Inhalt |
|---|---|---|
| `schema` | ja | `"LEAD-Meldung-v2"` (Hauptversion; gleiche Hauptversion ist ohne Umbau lesbar) |
| `fassung` | ja | Formatfassung, `"2.0"` |
| `meldung_id` | ja | UUID dieser Meldungsfassung |
| `beziehungen` | – | `[{art: "fortschreibung_von" \| "berichtigung_von", meldung_id}]`; Fortschreibung = neuer Stand derselben Stelle, Berichtigung = ersetzt eine Fassung desselben Stands |
| `status` | ja | `entwurf`, `zur_freigabe`, `freigegeben`, `zurueckgezogen` |
| `absender` | ja | `stelle`, optional `stelle_id`, `ebene` (Bund, Land, Kreis, Gemeinde, Einsatzstelle, Betreiber, Sonstige), `gebiet {name, schluessel}`; ersetzt `land` bzw. `kreis` und `meldende_stelle` |
| `berichtsraum` | – | Raum des Meldungsauftrags: `beschreibung`, `gebiete[]` |
| `meldezeitpunkt` | ja | t0 mit Versatz; im Entwurf `null` zulässig |
| `zeitzone` | ja | IANA, z. B. `Europe/Berlin` |
| `meldezeitraum` | ja | `von`, `bis` (Tag oder Zeitpunkt, `null` = unbekannt) |
| `quellen` | ja | Liste der Quellen (Abschnitt 5) |
| `sachverhalte` | ja | Liste der Sachverhalte (Abschnitt 3); leer nur bei `fehlanzeige` |
| `fehlanzeige` | – | `umfang`, `zeitraum {von, bis}`, `erklaerung`; schließt Sachverhalte aus |
| `freigabe` | ja | `erfasst`, `freigegeben`: je `{name, funktion?, hz?, zeitpunkt}` |
| `entstehung` | ja | Herkunftsnachweis (Abschnitt 6) |

**Gebietsschlüssel** (`schluessel`, optional): ISO 3166-1/-2 (`DE`, `DE-TH`, auch Ausland) oder amtlicher Gemeinde- bzw. Regionalschlüssel (Ziffern, z. B. Kreisschlüssel `16072`). Nicht jeder Wirkungsraum folgt Verwaltungsgrenzen; dafür steht `raum.beschreibung`.

## 3. Sachverhalt

| Feld | Pflicht | Inhalt |
|---|---|---|
| `kennung` | ja | `Präfix-JJJJMMTT-Zufall` (Kodierleitfaden 8.1); Zufallsteil 4–8 Zeichen, neu vergebene Kennungen 6 Zeichen; im Entwurf auch `""` oder Platzhalter `NEU-n` |
| `bezug` | – | `[{kennung, meldung_id?, art?: verdichtung \| teilung \| zusammenfuehrung}]` |
| `bezeichnung` | ja | Kurztitel |
| `eintritt` | ja | `{zeit, genauigkeit: belegt \| ungefaehr \| unbekannt}`; `unbekannt` verlangt `zeit: null` |
| `bekannt_seit` | – | erstes Bekanntwerden, nicht der Beginn |
| `raum` | ja | `beschreibung` (bisher `ort`), `gebiete[]` |
| `analyse` | ja | `lage_ereignis`, `risiken_auswirkungen`, `abhaengigkeiten_interdependenzen` (Texte mit `[Qn]`) |
| `bewertung` | ja | Abschnitt 4.1 (bisher `sofort`) |
| `handlungsbedarf` | ja | Abschnitt 4.2 (bisher `analyse.massnahmen_empfehlungen` und Kennsatz „Handlungsrelevant bis:“) |
| `kennzahlen` | – | Abschnitt 4.3 |
| `zeitstrahl` | – | Abschnitt 5.2 (bisher meldungsweite Zeichenkette) |
| `module` | ja | Fachmodule, Schlüssel = Modulkennung (Abschnitt 7) |

## 4. Bewertung, Handlungsbedarf, Kennzahlen

### 4.1 Bewertung

| Feld | Inhalt | bisher |
|---|---|---|
| `kernaussage` | Bedeutung für den Bevölkerungsschutz, Veränderung, Prüf- oder Abstimmungsfrage (A.4) | erste Zeile `Kernaussage:` |
| `referenzraum` | Raum, für den bewertet und kodiert wird | Zeile `Referenzraum:` |
| `beurteilung` | `{stufe: geringfügig \| erheblich \| kritisch \| null, begruendung}` | `sofort.beurteilung` und Fließtext |
| `tendenz` | `{richtung: Entspannung \| Stabilisierung \| Verschärfung \| null, bezug, begruendung}`; `bezug` = Bezugsraum und Zeitfenster | `sofort.tendenz` und Fließtext |
| `erlaeuterung` | Achsendivergenzen, Einordnung | übriger Bewertungstext |
| `aenderung_zur_vormeldung` | wesentliche Änderung bei Fortschreibung (A.8.1) | Kennsatz `Änderung zur Vormeldung:` |
| `neubewertung_bei` | `[{indikator, stand?: neu \| veraendert \| unveraendert \| nicht_ueberpruefbar}]` | Kennsatz `Neubewertung bei:` |
| `abweichende_bewertungen` | `[{stelle, stufe, grund, ursache?, klaerend?, quellen}]` (A.7.2) | Kennsatz `Abweichende Bewertung:` |
| `erkenntnislage` | `{luecken[], widersprueche[{gegenstand, beschreibung, quellen}]}`; ungeklärte Widersprüche bleiben mit beiden Angaben sichtbar | Fließtext |
| `abschluss` | `{ende, offene_punkte, nachsorge}` (A.8.2) | Kennsatz `Abschluss im Lagebild:` |

Die Beurteilung wird eigenständig begründet, nicht aus dem höchsten Radarwert abgeleitet (Kodierleitfaden Abschnitt 4). Erkenntnislage und D7 bleiben getrennt: D7 bewertet die Informationslage der befassten Stellen.

### 4.2 Handlungsbedarf

| Liste | Felder | Regel |
|---|---|---|
| `massnahmen` | `id` (M1 …), `gegenstand`, `stelle`, `status`, `stand`, `quellen` | Status nach SOP-LEAD A.4: geplant, angefordert, angeordnet, begonnen, umgesetzt, wirksam (nur mit Wirkungsbeleg), beendet |
| `empfehlungen` | `id` (E1 …), `adressat`, `auftrag`, `anlass?`, `termin`, `bedingung?`, `quellen` | ohne belegten Termin `termin: null` und Bedingung oder nächster Prüfanlass; eine Empfehlung wird erst durch eine Entscheidung zur Maßnahme |
| `fristen` | `id` (F1 …), `bis`, `aufgabe`, `adressat`, `bedingung?`, `grundlage`, `empfehlung?`, `quellen` | zeitgebundener Handlungsbedarf (bisher `Handlungsrelevant bis:`, A.7.3); `grundlage` sagt, woraus die Frist folgt |
| `erlaeuterung` | Text | nur Einordnung |

Frist und Empfehlung sind verschieden: Die Frist beschreibt das Zeitfenster der Lage (etwa „Notstrom reicht bis 15.10. abends“), die Empfehlung den Auftrag an eine Stelle; `fristen[].empfehlung` verknüpft beide.

### 4.3 Kennzahlen (optional)

`id` (K1 …), `gegenstand`, `einheit` (Personen, Haushalte, Anschlüsse, Betten … – nicht ineinander umetikettieren), `art` (`bestand`, `kumuliert`, `kapazitaet`, `bedarf`; A.9.1), `wert` (Zahl oder `null`), `bandbreite {von, bis}`, `mindestwert`, `erhebung` (`gezaehlt`, `amtlich_gemeldet`, `geschaetzt`, `hochgerechnet`, `prognostiziert`), `raum`, `datenstand`, `teilmenge_von`, `quellen`.

Kennzahlen machen unzulässige Summen erkennbar (Einheit, Zeitbasis, Teilmenge, Erhebungsart), ersetzen aber nicht die Zählregeln der SOPs: Ob zwei Gruppen überschneidungsfrei sind, bleibt eine fachliche Feststellung.

## 5. Quellen und Zeitstrahl

### 5.1 Quelle

| Feld | Pflicht | Inhalt |
|---|---|---|
| `id` | ja | `Q1`, `Q2` … in der Reihenfolge der ersten Nennung |
| `kategorie` | ja | Buchstabe nach dem Kodierleitfaden des Profils (Rolle der Quelle für die Aussage); das Profil legt die zulässigen fest |
| `herausgeber`, `titel` | ja | |
| `veroeffentlicht` | – | Tag oder Zeitpunkt |
| `url` | – | |
| `zugriff` | ja | Tag des Abrufs, `null` = nicht angegeben |
| `datenstand` | – | Stand der Angaben, getrennt vom Veröffentlichungsdatum |
| `zugang` | ja | `oeffentlich`, `paywall`, `behoerdenintern`, `eingangsmaterial`, `eingangsmeldung`, `nicht_ausgewertet`, `null` |
| `meldung_id` | – | bei Eingangsmeldungen die verwendete Fassung |
| `ursprung` | – | Ursprungsquelle(n), wenn diese Quelle eine Angabe nur weiterverbreitet; Weiterverbreitungen sind keine unabhängige Bestätigung |
| `anmerkung` | – | |

Kategorie (Herkunft bzw. Rolle), Zugang und Aussagekompetenz sind verschiedene Dinge: Die Kategorie belegt keine Aussage, die Aussagekompetenz hängt an der konkreten Aussage (Kodierleitfaden Abschnitt 5) und bleibt eine Regel, kein Feld.

### 5.2 Zeitstrahl je Sachverhalt

`id` (`Z1` …, eindeutig in der Meldung), `zeit` (Ereigniszeit), `typ` (Ereignis, Warnung, Maßnahme, Wendepunkt, Wiederherstellung, Bewertung, Berichtigung), `text` (ein Satz ohne Verweis), `quellen` (Pflicht außer bei „Bewertung“), `erstmals_gemeldet` (setzt die App), `berichtigt` (Pflicht bei „Berichtigung“). Die übrigen Regeln (nur Eingetretenes bis t0, Auswahl, Fortschreibung, Verdichtung) bleiben im Kodierleitfaden, Abschnitt 8.

## 6. Status, Freigabe, Entstehung

- `entwurf`: Pflichtfelder vorhanden, Inhalte dürfen leer sein.
- `zur_freigabe` und `freigegeben`: Absender mit Stelle und Gebiet, Meldezeitpunkt, mindestens ein Sachverhalt mit Quellenverzeichnis **oder** eine Fehlanzeige; je Sachverhalt vergebene Kennung, Bezeichnung, Lagetext, Kernaussage, Referenzraum und eine Begründung, sobald eine Beurteilungsstufe gesetzt ist. Die Referenzprüfung verlangt zusätzlich je Radarachse eine Begründung und mindestens eine Ereignisart.
- `freigegeben`: zusätzlich `freigabe.freigegeben` mit Name und Zeitpunkt. Ein Name oder Handzeichen ist kein technischer Authentizitätsnachweis.
- `zurueckgezogen`: eine neue Fassung mit `beziehungen` `berichtigung_von`, die die frühere zurücknimmt.
- **Versand** gehört nicht mehr in die Meldung: Eine freigegebene Fassung ist unveränderlich, Versand und Empfang sind Ereignisse danach (offener Punkt 3).
- `entstehung`: `verfahren` (`manuell`, `KI-Entwurf`), `erstellt`, `werkzeug {name, version}`, `profil {id, version}`, `regelwerk {sop[{kennung, fassung?, bezeichnung?}], sammelmappe?, kodierleitfaden?, arbeitsanweisung?}`, `modelle[{stufe?, anbieter?, modell}]`, `lauf_id`, `anmerkung`, bei überführten Meldungen `migration {von, am, werkzeug, hinweise[]}`. Bisher stand das meiste als Text in `_entstehung.werkzeug`. Die KI-Kennzeichnung bleibt bei jeder Weiterverarbeitung erhalten ([KI-VERORDNUNG.md](KI-VERORDNUNG.md)).

## 7. Fachmodule

Ein Modul ist ein JSON-Schema für den Inhalt von `sachverhalte[].module.<kennung>`, mit Pflichtfeld `fassung`. Die Zusammenstellung eines Profils (Abschnitt 9) bindet bekannte Module ein und macht sie gegebenenfalls zur Pflicht. Unbekannte Module bleiben zulässig, gelten als ungeprüft und werden nicht auf eigene Kategorien abgebildet; die Referenzprüfung nennt sie als Hinweis.

**Modul `lead-bevoelkerungsschutz` 1.0** ([Schema](../formate/lead-meldung-v2/module/lead-bevoelkerungsschutz.schema.json)):

- `ereignisarten`: Werte des Ereigniskatalogs (SOP-LEAD B01–B17), unverändert gegenüber v1; Mehrfachauswahl bei Mischlagen.
- `lagenradar.d1` … `d8`: je Achse `{stufe, status, offen_grund?, begruendung, quellen}`.
  - `status` `belegt`: Stufe 0–6 nach Stufentext; 0 ist ein belegter Wert.
  - `status` `mindestwert`: bestätigte Mindestzahl bzw. Mindestprognose (Kodierleitfaden Grundregel 6, D5); bisher nur im Text erkennbar.
  - `status` `offen`: `stufe: null` und `offen_grund` nach der Prüfreihenfolge des Kodierleitfadens: `kein_bezugsgegenstand`, `kein_beleg`, `bandbreite_ueber_stufengrenze`, `sonstiges`.
  - `begruendung` nach Grundregeln 9 und 10, `quellen` als IDs.
- Kein Gesamtscore. Die Fassung der Kodierregeln steht in `entstehung.regelwerk.kodierleitfaden`, nicht je Achse.

Weitere Module (etwa Funktionsmatrix des Profils „Lagebild Justiz“, Betreiberangaben aus KRITIS-LEAD) folgen demselben Muster.

## 8. Prüfebenen im Einzelnen

| Ebene | prüft | Werkzeug |
|---|---|---|
| 1 Schema | Struktur, Typen, Aufzählungen, Muster für IDs und Zeiten, Bedingungen (offene Achse ohne Stufe, Berichtigung mit Bezug, Zeitstrahl mit Beleg, Fehlanzeige ohne Sachverhalt), Vollständigkeit je Status | zusammengestelltes Profilschema; Ajv oder der eigene, eval-freie Prüfer der App (`src/kern/validierung.ts`, die Tests prüfen den Gleichlauf) |
| 2 Referenzen | jeder `[Qn]` und jede Quellen-ID aufgelöst, Ursprung nicht auf sich selbst, IDs eindeutig, Kennungen eindeutig, Zeitstrahl nicht nach t0 und chronologisch, `erstmals_gemeldet` zwischen Ereignis und t0 (Zeitvergleiche nach Abschnitt 1 Nr. 4: Zeitpunkte absolut, Kalendertage in `zeitzone`; Tag und Zeitpunkt desselben Tags gelten für Vergleiche mit t0 und `erstmals_gemeldet` als nicht entscheidbar, für die Reihenfolge steht der Tag vor den Uhrzeiten desselben Tags, Kodierleitfaden Abschnitt 8.3 Regel 4), Berichtigung auf frühere Zeile, Frist auf vorhandene Empfehlung, Teilmenge auf andere Kennzahl, Mindestwert mit Wert, Datenstand von Quelle und Kennzahl nicht nach t0; ab `zur_freigabe` Radarbegründungen und Ereignisart; Hinweise auf unzitierte Quellen, unbekannte Module, mehr als 12 Zeitstrahlzeilen | `pruefeReferenzen()` in `scripts/lead-meldung-v2.mjs`; in der App später neben der Schemaprüfung |
| 3 Mensch | Inhalt, Belegqualität, Kodierung, Freigabe | Abschlusscheck SOP-LEAD A.5 |

## 9. Profile auf v2 aufbauen

Die App prüft nur selbsttragende Schemata mit internen Verweisen. Deshalb entsteht das Schema eines Profils aus einer **Zusammenstellung** (Format `lead-meldung-v2-zusammenstellung/1`):

```json
{
  "format": "lead-meldung-v2-zusammenstellung/1",
  "$id": "…/meldung.schema.json",
  "title": "…",
  "kern": "kern.schema.json",
  "module": { "lead-bevoelkerungsschutz": { "datei": "module/lead-bevoelkerungsschutz.schema.json", "pflicht": true } },
  "weitere_module": true,
  "einschraenkungen": { "absender_gebiete": ["…"], "ebenen": ["Land", "Kreis"], "quellenkategorien": ["A", "B", "W", "M", "P"] }
}
```

`npm run meldung:v2 -- schema <zusammenstellung.json> <ziel>` schreibt das Schema. Mitgeliefert sind die Zusammenstellungen für das Beispielprofil (Bund und Länder, [beispiel/meldung.schema.json](../formate/lead-meldung-v2/beispiel/meldung.schema.json)) und das Landesprofil Thüringen (Land und Kreise, [beispiel-land/meldung.schema.json](../formate/lead-meldung-v2/beispiel-land/meldung.schema.json)). Damit entfällt das eigens abgeleitete Schema `LEAD-Meldung-Land-v1`: Bund, Land und Kreis teilen eine Schemakennung und unterscheiden sich nur in den Einschränkungen. Ein neues Profil (etwa „Lagebild Justiz“) legt eine eigene Zusammenstellung mit eigenem Modul an.

**KI-Ausgabe:** Für Structured Outputs (OpenAI, Mistral) leitet die App heute ein strenges Schema ab (`src/anbieter/schema.ts`). Bedingungen (`if`/`then`/`else`, `allOf`) und Muster unterstützen die Anbieter nur eingeschränkt; das Ausgabeschema für die KI muss daher ohne Bedingungen abgeleitet und die Bedingungen nach der Antwort von der App geprüft werden (offener Punkt 2).

## 10. Umstellung der bestehenden Profile

Voraussetzung ist die Unterstützung von v2 in der App. Betroffen sind mindestens: Erfassungsmaske und Darstellungsdatei (Listen von Objekten statt Textfeldern), Prüfung und Hinweise (`kennsaetze.ts`, `quellen.ts`, `zeitstrahl.ts` werden zu Prüfungen auf Feldern), PDF und Kopiervorlage (Kennsätze und Quellenverzeichnis werden erzeugt), Lagebild und Redaktionscheck, KI-Pipeline (Ausgabeschema, Nachbearbeitung, Kennungsvergabe, `erstmals_gemeldet`, Bewertungszeilen), Management Summary, Migration beim Einlesen (`src/kern/migration.ts`).

Danach je Profil (`profile/lead-beispiel`, `profile/lead-thueringen`, `profile/muster`):

1. `meldung.schema.json` durch das zusammengestellte Schema ersetzen (Beispielprofil: `formate/lead-meldung-v2/beispiel/`, Landesprofil: `beispiel-land/`).
2. `profil.json`: `meldung.schema_id` `LEAD-Meldung-v2`; `eingang_schema_ids` und `eingang_schemata` entsprechend; Migration von `LEAD-Meldung-v1` und `LEAD-Meldung-Land-v1` eintragen.
3. `meldung.ui.json`: Rollen und Felder auf die neuen Pfade (`absender.stelle`, `sachverhalte[].bewertung.beurteilung.stufe`, `sachverhalte[].module.lead-bevoelkerungsschutz.lagenradar` …); `kennsaetze` werden Beschriftungen der Darstellung.
4. Kodierleitfaden (Abschnitte 6 und 8), SOP-LEAD Teil A (A.4, Kennsätze) und Arbeitsanweisungen auf die Felder umstellen (A.10.2: ein Ort, Verweise sonst).
5. Beispielmeldungen überführen: `npm run meldung:v2 -- migriere <dateien> --ziel <ordner>`, Hinweise abarbeiten, `npm run meldung:v2 -- pruefe <dateien> --schema <schema>`.
6. Profilversion mit neuer Hauptversion, Profil-`CHANGELOG.md`; im Landesprofil die Ableitung `npm run profil:land` auf die Zusammenstellung umstellen.

**Prüfsteine** (`evaluation/pruefsteine/`) bleiben nach ihrer README unverändert in v1; die Tests zeigen, dass sie sich überführen lassen.

## 11. Migration v1 → v2

`migriereV1()` bzw. `npm run meldung:v2 -- migriere` überführt `LEAD-Meldung-v1` und `LEAD-Meldung-Land-v1`. Grundsatz: **nichts erfinden.** Was der Text nicht sicher hergibt, bleibt Text oder `null` und steht als Hinweis in `entstehung.migration.hinweise`. Eine überführte Meldung ist zur Durchsicht bestimmt, keine neue Freigabe.

| v1 | v2 | Art |
|---|---|---|
| `schema`, `_status` | `schema`, `fassung`, `status` | „final“ → `freigegeben` nur mit Zeichnung und Datum der Freigabe, sonst `zur_freigabe` |
| `land` / `kreis`, `meldende_stelle` | `absender` | Schlüssel nur für Bund und Länder (ISO 3166-2); Ebene aus Gebiet und Schema |
| `meldezeitpunkt`, `meldezeitraum` | dieselben, mit Versatz der Zone | |
| `quellen` (Text) | `quellen[]` | Kategorie, Herausgeber, Datum, Titel, URL, Zugriff, Datenstand, Zugang aus Kennzeichen („(Paywall)“, „behördenintern“ …); Zugang ohne Kennzeichen und ohne URL `null` |
| `zeitstrahl` (Text) | `sachverhalte[].zeitstrahl[]` | Zuordnung über die Kennung; „aufgenommen“ → `erstmals_gemeldet`; „zu [Zn]“ → `berichtigt` |
| `sachverhalte[].ort` | `raum.beschreibung` | Gebiete leer |
| `eintritt` | `eintritt {zeit, genauigkeit}` | gesetzt → `belegt` (Regel v1), leer → `unbekannt` |
| `analyse.lage_ereignis` usw. | `analyse` | unverändert |
| `analyse.massnahmen_empfehlungen` | `handlungsbedarf` | nummerierte Punkte „(1) Adressat: …“ bzw. „Empfehlung 1: …“ → `empfehlungen`; übriger Text → `erlaeuterung`; Maßnahmen mit Status sind von Hand zu erfassen |
| `sofort.bewertung_text` | `bewertung` | Zeilen „Kernaussage:“, „Referenzraum:“, „Beurteilung „…““, „Tendenz „…“ (…)“, Radarzeilen, Kennsätze; Rest → `erlaeuterung` |
| `sofort.beurteilung`, `tendenz` | `beurteilung.stufe`, `tendenz.richtung` | `""` → `null` |
| `sofort.lagenradar` | `module.lead-bevoelkerungsschutz.lagenradar` | Stufe aus dem Radar, Begründung und Belege aus dem Text, „(Mindestwert)“ → `mindestwert`; Grund offener Achsen nach Stichworten, sonst `sonstiges` |
| `art` | `module.lead-bevoelkerungsschutz.ereignisarten` | unverändert |
| `kennung`, `bezug` | `kennung`, `bezug[{kennung}]` | Art des Bezugs und Meldungsfassung von Hand |
| `freigabe.erfassung`, `.freigabe` | `freigabe.erfasst`, `.freigegeben` | Datum als Zeitpunkt der Zeichnung |
| `freigabe.versand` | – | als Hinweis vermerkt |
| `_entstehung` | `entstehung` | „KI-LEAD x · Profil id v · Lauf l“ → `werkzeug`, `profil`, `lauf_id`; SOP „SOP-LEAD 01 … v2.0“ → `{kennung: "B01", fassung: "2.0"}` |

Die Tests überführen alle mitgelieferten v1-Meldungen (Orkantief „Ilka“, Hochwasser an der Saale, Musterfassung, Prüfsteine); alle Ergebnisse bestehen beide Prüfebenen. Ein vervollständigtes Beispiel zeigt, wie eine Meldung nach der Durchsicht aussieht ([formate/lead-meldung-v2/beispiele/](../formate/lead-meldung-v2/beispiele/)).

## 12. Abwägung der Vorschläge

| Vorschlag | Herkunft | Entscheidung im Entwurf |
|---|---|---|
| Meldungskennung, Versionsbeziehungen, typisierte Bezüge | Fremdprüfung 1, eigene 5, AUSTAUSCH §1 | übernommen: `meldung_id`, `beziehungen`, `bezug {kennung, meldung_id, art}`. **Nicht** übernommen: `meldereihe_id` – die Reihe ergibt sich aus Absender und Kette `fortschreibung_von`; ein eigenes Feld erst bei Bedarf in Teil C |
| größerer Zufallsraum für IDs | Fremdprüfung 1 | übernommen: `meldung_id` als UUID; Sachverhaltskennung künftig 6 statt 4 Zufallszeichen, bestehende bleiben gültig |
| Quellen und Zeitstrahl als Objekte | Fremdprüfung 2, eigene 1 | übernommen, mit `ursprung` für Weiterverbreitung. **Abweichend:** `[Qn]` bleibt im Text als geprüfter Verweis (sonst geht die Zuordnung auf Satzebene verloren); der Zeitstrahl steht im Sachverhalt statt meldungsweit mit Sachverhaltsbezug (keine verwaisten Zeilen). Keine Zerlegung in atomare Aussagen |
| Bewertung, Tendenz, Handlungsbedarf, Erkenntnislage trennen; `sofort` → `bewertung` | Fremdprüfung 3, eigene 2 | übernommen; Handlungsbedarf als eigener Block neben der Bewertung. **Nicht** übernommen: Feld „Bewertungsmaßstab“ (Maßstab sind Kodierleitfaden und Referenzraum) und eine Erkenntnissicherheit je Aussage (offener Punkt 4) |
| Radarachse als Objekt mit Status, Grund und Belegen | Fremdprüfung 4, eigene 3 | übernommen; `offen_grund` nach der Prüfreihenfolge. **Nicht** übernommen: Datenstand und Regelfassung je Achse (stehen an Quelle bzw. in `entstehung.regelwerk`) |
| Maßnahmen, Empfehlungen, Fristen, Neubewertungsanlässe als Listen | Fremdprüfung 5, eigene 2 und 8 | übernommen mit dem Statusvokabular aus A.4 und dem Fortschreibungsstand aus A.8.1; Frist und Empfehlung getrennt und verknüpfbar |
| strukturierte Kennzahlen | Fremdprüfung 6 | übernommen, optional |
| Absender, Berichtsraum, Wirkungsraum, Bewertungsraum trennen; Zeitzone; „Kenntniszeit“ präziser | Fremdprüfung 7, eigene 4 und 5, AUSTAUSCH §3–4 | übernommen; „aufgenommen“ heißt `erstmals_gemeldet`. Kein eigener Bewertungszeitpunkt: t0 ist der Meldezeitpunkt (Grundregel 1) |
| Wertzustände ausdrücklich; Fehlanzeige ohne Sachverhalt | Fremdprüfung 8, AUSTAUSCH §7 | übernommen als Konvention (Abschnitt 1) und Block `fehlanzeige`. **Nicht** übernommen: ein Zustandsobjekt je Feld (Erfassungsaufwand, KI-Ausgabe); „nicht zutreffend“ nur, wo die Fachregel es kennt |
| Status, Freigabe, Entstehung, Versand trennen | Fremdprüfung 9, AUSTAUSCH §2 und §6 | übernommen; Versandprotokoll noch nicht modelliert (offener Punkt 3) |
| Kern und Fachmodule | Fremdprüfung 10, eigene 9 | übernommen; Zusammenstellung erzeugt selbsttragende Profilschemata |
| Vollständigkeit erst ab Freigabe, drei Prüfebenen | Fremdprüfung (Befund Finalbedingungen, Schluss) | übernommen (Abschnitte 6 und 8) |
| Ereignisart in Ursache und betroffene Funktion trennen | eigene 6 | **verworfen** für v2: Das ist eine Katalogänderung, die nach A.10.4 ein eigener, abgestimmter Schritt ist; der Katalog bleibt unverändert |
| Risiken in „belegt“ und „Szenario“ teilen, Kopplungen strukturiert | eigene 8 | zurückgestellt: Die Gliederung bleibt im Text; strukturierte Kopplungen mit KRITIS-LEAD abstimmen |
| Schemakennung `lead-meldung/2` | eigene 5 | **nicht** übernommen: `LEAD-Meldung-v2` schließt an Dateinamen, Migrationsregeln und den Sprachgebrauch an; `fassung` trägt die Unterversion |
| tolerantere Regel für zusätzliche Felder | AUSTAUSCH §2 | gelöst über Module; der Kern bleibt geschlossen |

## 13. Offene Punkte

1. **App-Unterstützung** (Abschnitt 10) als Voraussetzung für die Umstellung der Profile; Reihenfolge und Umfang entscheidet der Herausgeber.
2. **Ausgabeschema für die KI:** Ableitung ohne Bedingungen, Prüfung danach; Kosten und Fehlerquote der tieferen Struktur in einem Vergleichslauf messen.
3. **Versand und Empfang** als eigenes Protokoll zur Meldungsfassung.
4. **Bestätigungsgrad je Aussage** (SOP-LEAD A.3): bisher nur über Kennzahl (`erhebung`), Quelle (`zugang`, `ursprung`) und Erkenntnislage abbildbar.
5. **Stellenkennung** (`stelle_id`): Register oder Schema der Kennungen.
6. **Gebietsschlüssel der Kreise:** Die Migration setzt nur Länderschlüssel; Kreisschlüssel im Landesprofil ergänzen und prüfen.
7. **Abstimmung in Teil C** nach [AUSTAUSCH.md](AUSTAUSCH.md); dieser Entwurf ist die Vorlage dafür.
8. **Module für „Lagebild Justiz“ und KRITIS-LEAD** nach dem Muster in Abschnitt 7.
9. **Lizenz:** Kern-, Modul- und zusammengestellte Schemata stehen wie die Meldungsschemata der Profile zusätzlich unter CC0 1.0 (LICENSE-CONTENT Nr. 2 e); zur Bestätigung durch den Herausgeber.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 2.0 (Entwurf), Nachtrag | 01.11.2026 | Referenzprüfung nach Abschnitt 8 vervollständigt, Format und Schemata unverändert: „Datenstand nicht nach t0“ auch für `quellen[].datenstand` (GK-2026-W44-03); Zeitvergleiche nach Abschnitt 1 Nr. 4 mit absoluten Zeitpunkten und Kalendertagen in `zeitzone`, Tag gegen Zeitpunkt desselben Tags nicht entscheidbar und ohne Befund (GK-2026-W44-04) |
| 2.0 (Entwurf) | 01.11.2026 | Erster Entwurf: Kernschema, Modul `lead-bevoelkerungsschutz` 1.0, Zusammenstellungen für Beispiel- und Landesprofil, Migration v1 → v2, Referenzprüfung, Beispiele |

# Änderungsverlauf KI-LEAD

Alle wesentlichen Änderungen an der App stehen hier, die jüngsten zuerst. Die Form folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/): Vor Version 1.0 steht die zweite Stelle (0.x) für einen Meilenstein und kann Änderungen am Verhalten bringen; die dritte Stelle steht für Korrekturen und kleinere Ergänzungen innerhalb eines Meilensteins.

Änderungen an Spezifikation, Profilformat und Profilinhalten haben eigene Verläufe:

- Spezifikation: [docs/SPEZIFIKATION.md](docs/SPEZIFIKATION.md), Abschnitt „Änderungsverlauf“
- Profilformat: [docs/PROFILFORMAT.md](docs/PROFILFORMAT.md), Abschnitt „Änderungsverlauf“
- Profile: `CHANGELOG.md` im jeweiligen Profilordner, z. B. [profile/lead-beispiel/CHANGELOG.md](profile/lead-beispiel/CHANGELOG.md)

**Vorgehen:** Jede Änderung wird im selben Commit im zutreffenden Verlauf eingetragen. Stände, die zwischen zwei Versionen ohne eigene Nummer veröffentlicht wurden, stehen bei der Version, unter der sie liefen, als „Nachtrag“ mit Datum und Commit. Jede Version entspricht einem Commit (letzter Stand der Version); Git-Tags `vX.Y.Z` folgen spätestens mit dem ersten Release:

| Version | Commit |
|---|---|
| 0.1.0 | 6bfa6fe |
| 0.2.0 | 8cb1dce |
| 0.3.0 | 3146797 |
| 0.4.0 | a6ed060 |
| 0.4.1 | 1704922 |
| 0.4.2 | 9f8ae9f |
| 0.4.3 | 9f8dca1 |
| 0.4.4 | 68ff2da |
| 0.4.5 | ea3a8a3 |
| 0.4.6 | 6636068 |
| 0.4.7 | 89bfa77 |
| 0.4.8 | Commit „SOP-LEAD 2.0: Befunde der unabhängigen Prüfung eingearbeitet“ |
| 0.4.9 | 99403c0 |
| 0.4.10 | 90ab407 (Nachtrag vom 20.10.2026: README) |
| 0.4.11 | 706be47 |
| 0.4.12 | ef5280b (Nachtrag vom 20.10.2026: Beispielprofil 1.7.0, ohne Änderung der App; Stand der Version selbst: 3d58abf) |
| 0.4.13 | bbf368b |
| 0.4.14 | Commit „SOP-LEAD C12 1.1.0: Kraftstoff- und Wärmeversorgung; Sammelmappe 3.2.0, Profil 1.8.0“ (Nachtrag vom 20.10.2026: Beispielprofil 1.8.0, ohne Änderung der App; Stand der Version selbst: c8406ab) |

## [0.4.14] – 20.10.2026

### Behoben

- Profile: Nach einer Neuveröffentlichung zeigte eine noch offene ältere Seite alle Lesetexte (SOPs, Arbeitsanweisungen, Kodierleitfaden, Übersichten) nur als Markdown-Quelltext. Die Seite verlangte den nachgeladenen Markdown-Renderer unter seinem alten Dateinamen, den es nicht mehr gab, und fiel stillschweigend auf den Quelltext zurück. Nachgestellt mit dem Stand 0.4.13: alle 47 Leseeinträge unformatiert. Der Renderer ist jetzt fest im Haupt-JavaScript enthalten (rund 98 KB mehr), und ein Fehler bei der Aufbereitung wird sichtbar gemeldet statt still übergangen.
- Andere nachgeladene Teile (PDF-Ausgabe) laden die Seite nach einer Neuveröffentlichung einmal neu (`vite:preloadError`), statt zu scheitern.

### Neu

- Test: Alle unter „Profile“ lesbaren Texte beider Profile werden formatiert (keine Markdown-Überschriften, -Tabellen, -Listen oder -Hervorhebungen als Fließtext; Überschriften gleich Inhaltsverzeichnis). Ein weiterer Test hält fest, dass der Renderer nicht nachgeladen wird.

## [0.4.13] – 20.10.2026

Grundlage: Prüfung „KI-LEAD_Profil_Arbeitsgrundlagen_2026-10-20“ und konsolidierter Vorschlag „KI-LEAD_Arbeitsgrundlagen_Vorschlag_konsolidiert_2026-10-20“ (PROFIL-DOK-01 bis -10; Entscheidungen E1–E4 wie empfohlen).

### Behoben

- Platzhalter in Arbeitsanweisungen wurden im Lesetext nicht hervorgehoben: Erkannt wurden nur Namen ohne Punkt. Jetzt gilt dieselbe Syntax wie beim Einsetzen (`{{profil.…}}`, `{{auftrag.…}}`, `{{app.…}}`, `{{jetzt}}`) [PROFIL-DOK-06].
- „Quelltext anzeigen“ zeigte bei SOPs den aufbereiteten Ausschnitt ohne Kopf; jetzt erscheint die unveränderte Datei des Pakets [PROFIL-DOK-04].

### Neu

- Profile: eigener Bereich „Arbeitsanweisungen und Kodierleitfaden“ vor dem SOP-Katalog. Er enthält Erfassung, Verdichtung, Kurzfassung und Kodierleitfaden, jeweils mit Zwecksatz und Tag der eigenen Fassung aus dem Kopf des Dokuments („Fassung nicht angegeben“ ohne erkennbare Angabe) [PROFIL-DOK-01 bis -03, E1].
- Fehlen Verdichtung oder Kurzfassung im Profil, zeigt die Zeile die Standardfassung der App, die dann an die KI geht, gekennzeichnet als „kein Bestandteil des Profils“ [PROFIL-DOK-08, E2].
- Geöffnete Dokumente: Kopfzeile mit Datei, Fassung, Stand, Profil und Profilversion; Hinweis zu Platzhaltern; Inhaltsverzeichnis für alle Lesetexte ab vier Überschriften, auch für Teil A und die SOPs, mit Sprung innerhalb des Texts; „Originaldatei herunterladen“ [PROFIL-DOK-05, -07, -10, E3, E4].
- Tests: Arbeitsgrundlagen beider Profile, Fassungserkennung (zitierte Fremdfassungen zählen nicht), Standardfassungen, Inhaltsverzeichnis in Übereinstimmung mit dem gerenderten Text, Platzhalter mit Punkt.

### Geändert

- „Dokumentation lesen“ enthält nur noch Übersichten und Änderungsverläufe und steht nach dem SOP-Katalog; die SOP-Übersicht trägt das Tag der Sammelmappen-Fassung.
- Spezifikation 0.4.13, Profilformat 1.11.

## [0.4.12] – 20.10.2026

Grundlage: Prüfung „KI-LEAD_Profile_Ergonomie_2026-10-20“ und konsolidierter Vorschlag „KI-LEAD_Profile_Ergonomie_Vorschlag_konsolidiert_2026-10-20“ (Kennungen PROFIL-UX-01 bis -16; Entscheidungen D1–D6 wie empfohlen).

### Neu

- Profilansicht: „Dokumentation lesen“ mit den Lesedokumenten des geladenen Pakets (SOP-Übersicht und -Änderungsverlauf, Profil-Beschreibung und -Änderungsverlauf, Arbeitsanweisungen, Kodierleitfaden), jeweils nur bei vorhandener Datei [PROFIL-UX-03, PROFIL-UX-15, D5].
- SOPs und Lesedokumente als lesbarer Text mit Überschriften, Listen und Tabellen (markdown-it 15.0.2, erst beim Öffnen nachgeladen; rohes HTML wird nicht ausgeführt, Bilder werden nicht geladen). SOPs mit Steckbrief aus dem Kopf, „Quelltext anzeigen“ und „Schließen“. Relative Links öffnen den Eintrag im selben Paket, fehlende Ziele sind als „nicht im Paket“ gekennzeichnet. Platzhalter der Arbeitsanweisungen sind hervorgehoben [PROFIL-UX-06, PROFIL-UX-11, D4].
- SOP-Katalog: Suche nach Kennung, Kurzname, früherer Kennung und früherer ID (z. B. „N02“ → C11), optional im Text, mit Trefferzahl und Zurücksetzen; „Alle schließen“ [PROFIL-UX-10, PROFIL-UX-11].
- Prüfsumme kopierbar und vollständig anzeigbar, ohne Hover [PROFIL-UX-09].
- Nach dem Import: Name, Profilversion, Verwendungszustand und Knopf „Jetzt verwenden“ [PROFIL-UX-13].
- Profilwechsel während eines laufenden KI-Auftrags nur nach Rückfrage, weil der Wechsel den Lauf abbricht [PROFIL-UX-12].
- Tests: Anzeigetitel und Tags aller 34 Fachzeilen, Steckbrief, Lesedokumente beider Profile, Linkauflösung, Suche, Markdown (Tabellen, kein HTML, keine Bilder, Linkziele, Platzhalter), Einbettung [PROFIL-UX-16].

### Geändert

- Profile stehen auf allen Bildschirmbreiten untereinander [PROFIL-UX-01].
- SOP-Zeilen zeigen Kennung und Kurzname sowie ein neutrales Versions-Tag aus der Fassung des Dokuments (Teil A: „gilt immer“, fehlende Fassung: „ohne Version“). Der Bearbeitungsstand steht im Steckbrief und einmal am Leseblock („Inhaltsgerüste: vor Verwendung konkretisieren“). Der Nachweis in `_entstehung.sop` bleibt unverändert, ebenso die Marke „Inhaltsgerüst“ in der KI-Erfassung [PROFIL-UX-02, D1, D3].
- „✓ In Verwendung“ steht grün im Kopf der Karte, die obere Kartenkante ist grün; Aufklapptitel der Profilansicht ebenfalls grün (Farbe von „Entspannung“), übrige App unverändert. Der Profil-Chip im App-Kopf zeigt die Profilversion [PROFIL-UX-04, PROFIL-UX-05, D2].
- Kopfaktion „Verwenden und Meldung öffnen“ statt „Verwenden“ am Kartenende; Export und Entfernen nachrangig am Ende [PROFIL-UX-07].
- Metadaten: „Profilversion … · Herkunft“, „SOPs und Bausteine“ mit Anzahl der Inhaltsgerüste, Herausgeber und Lizenz; kurze Erklärung von Profilversion, Tag und Prüfsumme in der Einleitung [PROFIL-UX-08].
- Prüfbericht und Dateien getrennt; Fehler und Warnungen im Kopf mit Sprung zum Bericht; „nicht verwendbar“ bei ungültigem Profil [PROFIL-UX-13].
- Bedienung: Aufklappzeilen und Knöpfe der Profilansicht mit 44 px Bedienhöhe bei Touch-Bedienung, sichtbare Fokusmarkierung, Tags dürfen umbrechen [PROFIL-UX-14].
- `sop/README.md` wird wieder eingebettet (Lesedokument); Beispielprofil 1.6.2; Spezifikation 0.4.12, Profilformat 1.10.

## [0.4.11] – 20.10.2026

Grundlage: Prüfung „KI-LEAD_SOP_Codepruefung_2026-10-20“ und konsolidierter Vorschlag „KI-LEAD_SOP_Integration_Vorschlag_konsolidiert_2026-10-20“ (Kennungen SOP-CODE-01 bis -09; Entscheidungen E1 und E2 wie empfohlen).

### Behoben

- SOP-Nachweis: Bei leerer bestätigter Auswahl übernahm die App vom Modell behauptete SOPs; `sopKennungenAbgleichen` filtert jetzt bei jeder übergebenen Menge, auch einer leeren, und normalisiert nur ohne Menge [SOP-CODE-01].
- SOP-Nachweis hing vom Antwortformat des Modells ab (fehlende Angabe: alle gewählten; leere Liste: keine; Teilmenge: ohne Hinweis). `_entstehung.sop` enthält jetzt immer die tatsächlich beigefügten SOPs und Bausteine aus der zusammengestellten Anfrage. Die Angabe des Modells zur Anwendung wird damit verglichen; fehlende Angabe, nicht beigefügte oder unbekannte Kennungen und nicht als angewandt genannte Abschnitte erscheinen als Prüfhinweis „SOP-Nachweis: …“. Kein neues Schemafeld [SOP-CODE-02, E1].

### Neu

- KI-Erfassung, Schritt „Gegenstand bestätigen“: Auswahl „SOPs und Bausteine für diesen Sachverhalt“ gegliedert in Dach-SOPs und die Leseblöcke der Bausteine, Marke „Inhaltsgerüst“, Hinweis, dass Teil A immer mitgeht, und aufklappbarer Anwendungsbereich der gewählten Abschnitte. Der Parser übernimmt `typ`, `lesegruppe` und `status` aus dem Kopf; Profile ohne diese Angaben erscheinen in einer neutralen Gruppe [SOP-CODE-03].
- Lagebild: aufklappbare Entstehung je Meldungskarte (Verfahren, Modell, SOP und Bausteine, Kodierleitfaden, Erstellt), Angaben wie gespeichert; Rohtabelle und CSV mit Spalte „SOP (Entstehung)“ („keine“ bzw. „nicht dokumentiert“ bei fehlender Angabe eines KI-Entwurfs) [SOP-CODE-04].
- Profile: „SOP-Katalog lesen“ mit gemeinsamen Regeln, Dach-SOPs und Bausteinen im Volltext, ohne KI und ohne Wirkung auf Meldungen; Anzahl getrennt nach SOPs und Bausteinen [SOP-CODE-03, SOP-CODE-06, E2].
- Tests: jede der 34 Einheiten der SOP-Übersicht einzeln (geladen, S1-Schema und -Katalog, S2-Block, Gruppe, Status), Grenzfälle des Nachweises, frühere Kennungen, Ereigniswechsel lässt Bausteine stehen, CSV-Spalte [SOP-CODE-07].

### Geändert

- Prüfansicht und PDF: „Beigefügte SOP und Bausteine (KI-Kontext)“ statt „Angewandte SOP“; „nicht dokumentiert“ bei KI-Entwürfen ohne Angabe [SOP-CODE-02].
- Eingebettete Profile ohne `sop/archiv/`, erzeugte Lesefassung und SOP-Übersicht; Haupt-JavaScript von 1,92 MB auf 1,38 MB [SOP-CODE-09].
- Ereigniswechsel in der SOP-Auswahl als prüfbare Funktion `sopsNachArtwechsel`.
- Beispielprofil 1.6.1 (Erfassung 1.3.2, Sammelmappe 3.0.1); Spezifikation 0.4.11, Profilformat 1.9.

## [0.4.10] – 19.10.2026

Grundlage: Strukturvorschlag „SOP-LEAD_Strukturvorschlag_Teil-B-C_2026-10-19“ (Kennungen S01–S12), abgeglichen mit dem Strukturvorschlag v2.1 und dessen Register (Abgleich „SOP-LEAD_Strukturabgleich_v2.1_PR4_2026-10-19“), freigegeben am 19.10.2026.

### Neu

- SOP-Abschnitte können eine Kennung im Kopf führen (`kennung`, z. B. „B08“); sie geht der Nummer in der Überschrift vor und bildet die Kennung „SOP-LEAD B08 … v2.0.1“ [S02, S07].
- Frühere IDs (`bisherige_ids`) und Kennungen (`bisherige_kennung`) im Kopf eines Abschnitts: Die App bildet frühere IDs in gespeicherten Läufen (Stufe S1 und S2) und frühere Kennungen in `_entstehung.sop` auf die aktuellen ab [S09].
- Lesefassung: `npm run sop:lesefassung` erzeugt aus den SOP-Einzeldateien eines Profils `sop/SOP-LEAD_Sammelmappe_Lesefassung.md` (Inhaltsverzeichnis, Teilüberschriften, Leseblöcke); ein Test prüft mit `--check`, dass sie aktuell ist.
- Importprüfungen: Warnung bei Text vor dem ersten Anker einer SOP-Datei (wurde bisher stillschweigend verworfen), Fehler bei doppelter SOP-ID über alle Dateien, Warnung bei doppelter Kennung und bei einem Alias, der eine vorhandene ID verdeckt [S10].

### Geändert

- Beispielprofil 1.6.0 mit SOP-LEAD-Sammelmappe 3.0: Teil A und je SOP bzw. Baustein eine Datei (35 Dateien unter `sop/teil-b/` und `sop/teil-c/`), Kennungen B01–B17 und C01–C17 in vier Leseblöcken nach Register v2.1, einheitliches Abschnittsschema, erzeugte Lesefassung; Arbeitsanweisungen redaktionell angepasst. Einzelheiten im Profilverlauf und im SOP-Verlauf. Profilformat 1.8, Spezifikation 0.4.10.

### Nachtrag vom 20.10.2026 (Commit „README nach Review überarbeitet“, ohne neue Versionsnummer)

- README nach dem Review „KI-LEAD_README_Review_2026-10-20“ und dessen konsolidierter Prüfung überarbeitet: Zweck mit drei Arbeitsprodukten, Schnellstart ohne KI, kompakte Funktionsübersicht mit Reichweite der Prüfungen, eigener Abschnitt zur Datenverarbeitung (Übermittlung an den KI-Anbieter, Websuche und Seitenabruf beim Anbieter), Wegweiser zu den maßgeblichen Dokumenten, SOP-Sammelmappe mit Teil A, B01–B17 und C01–C17, Pflegehinweise zu SOP-Einzeldateien und Lesefassung, Auslöser der Prüfung wie im Workflow, Fahrplan mit Stand. Berichtigt: Eingangsmeldungen nicht mehr pauschal als A-Quellen, JSON-Meldungen nicht mehr stets als Vormeldung, Websuche in S2 optional, „Release 0.1“ entfällt. Keine Änderung an App-, Profil- oder SOP-Fassungen.

## [0.4.9] – 19.10.2026

Grundlage: Prüfung des Fachreviews der drei Arbeitsanweisungen vom 19.10.2026 (Prüfbericht „KI-LEAD_Arbeitsanweisungen_Pruefung_und_Vorschlaege_2026-10-19“); Kennungen in eckigen Klammern.

### Neu

- Management Summary: alle Fristen aus den Kennsätzen „Handlungsrelevant bis:“ aller Sachverhalte (jede Zeile, nicht nur die erste), früheste zuerst, höchstens drei; der Kennsatz bleibt bis zum Zeilenende erhalten (bisher Kürzung an der ersten Klammer oder dem ersten Semikolon, wodurch Bedingungen verloren gingen); nur Quellenmarker und „Grundlage: …“ entfallen. Fristen vor dem Meldezeitpunkt werden als „vor dem Meldestand abgelaufen; Erledigung prüfen“ gekennzeichnet [K09, V06].
- Management Summary: Kopfzeile mit „ENTWURF – Meldung nicht freigegeben“, solange die Meldung nicht final ist [K08].
- Management Summary: Herkunftsliste der Quellen (Nummer, Kategorie, Herausgeber, ohne Titel und URL) als Teil der Anfrage, damit die KI sprechend zuordnen kann („laut Netzbetreiber“) [K06].
- `_entstehung`: Die App setzt `kodierleitfaden` aus dem Kopf des Kodierleitfadens im Profil und gleicht die SOP-Kennungen des Modells mit dem Profil ab (gültige Fassung; nicht beigefügte oder unbekannte SOPs entfallen) [E10].

### Geändert

- Management Summary: Kurztitel werden nur bei passender Anzahl verwendet; sonst stehen die Bezeichnungen der Meldung (bisher verschobene Zuordnung) [K10]. Richtwerte mit der Arbeitsanweisung abgestimmt: Zielwert 150 Wörter, Hinweis ab 180; Sätze möglichst 25 Wörter, Hinweis ab 30 [K02]. Ersatzanweisung ohne Profilanweisung an die neuen Regeln angeglichen [G02].
- Verdichtung: Ersatzanweisung `VERDICHTUNG_S2` ohne die Regeln „Werte der Eingänge dürfen als Belege dienen“ und „Jede Eingangsmeldung ist Kategorie A“; mit Fortgeltung, Zählregeln und Meldungsreihen [G02, V01–V04, X06]. Redaktionsvermerk „Meldungsreihen derselben Stelle“ statt „die jüngste gilt“ [V04]. Warnung zur Quellenkategorie einer Eingangsmeldung erläutert, dass Nicht-A nur bei nichtbehördlichen Stellen zulässig ist [X06].
- S2-Auftrag: Korrekturbedarf an der bestätigten Gliederung wird in der Kurzantwort benannt, ohne still umzuordnen [V05].
- Beispielprofil 1.5.0 mit Arbeitsanweisungen Erfassung 1.3, Verdichtung 2.0 und Kurzfassung 2.1 sowie SOP-LEAD-Sammelmappe 2.0.1; Einzelheiten im Profilverlauf. Spezifikation 0.4.9.

## [0.4.8] – 19.10.2026

### Neu

- Quellenkategorien mit Rangfolge: Die Darstellungsdatei kann unter `quellen.rangfolge` die Quellenpriorität angeben (höchste zuerst, z. B. `["A", "B", "W", "M", "P"]`). Das Quellenfeld zeigt die Kategorien in dieser Reihenfolge und darüber die Zeile „Quellenpriorität: A > B > W > M > P“; die Meldung zu fehlenden oder ungültigen Kategorien nennt die zulässigen Kategorien in derselben Reihenfolge. Fehlt `rangfolge`, bleibt es bei der Reihenfolge der Datei.
- Profilimport prüft den Abschnitt `quellen`: Kategorien als Objekt mit Erläuterungen, Kennungen aus je einem Großbuchstaben, `rangfolge` nennt jede Kategorie genau einmal und keine unbekannte; Verstöße verhindern die Aktivierung mit verständlichem Fehler.
- SOP-Bausteine: Abschnitte mit Titel „N01. Baustein LEAD: …“ erhalten die Kennung „SOP-LEAD N01 … v1.0“ (bisher nur „NN. SOP LEAD: …“). Abschnitte ohne `art_vorschlag` erscheinen im SOP-Katalog der Stufe S1, werden beim Wählen einer Ereignisart aber nicht automatisch ergänzt.

### Geändert

- Beispielprofil 1.4.0 mit Quellenkategorie B (Betreiber) und Priorität A > B > W > M > P, Kodierleitfaden 1.2, Arbeitsanweisung Erfassung 1.2 und SOP-LEAD-Sammelmappe 2.0 mit 17 Themen- und Querschnittsbausteinen; Musterprofil 0.2.0 mit Kategorie B. Einzelheiten: [profile/lead-beispiel/CHANGELOG.md](profile/lead-beispiel/CHANGELOG.md), SOP-Änderungen ausschließlich in [profile/lead-beispiel/sop/CHANGELOG.md](profile/lead-beispiel/sop/CHANGELOG.md).
- Profilformat 1.7 (Abschnitt `quellen.rangfolge`, SOP-Bausteine) und Spezifikation 0.4.8.

## [0.4.7] – 18.10.2026

### Geändert

- Management Summary: Beurteilung und Tendenz stehen in einer eigenen Zeile „Bewertung & Tendenz: geringfügig, Entspannung“ statt hinter dem Kurztitel des Sachverhalts; die Bezeichnung kommt aus den Feldbezeichnungen des Profils. Bei mehreren Sachverhalten folgt unter „Bewertung & Tendenz:“ je Sachverhalt eine Zeile mit Kurztitel, Beurteilung und Tendenz.
- Management Summary: Alle Abschnitte („Lage & Ereignis:“, „Risiken & Auswirkungen:“ …) sind durch Leerzeilen getrennt. Bereits erstellte Fassungen behalten ihre Form, bis sie neu erstellt werden.

## [0.4.6] – 18.10.2026

### Geändert

- Management Summary: Der Knopf heißt „Management Summary erstellen“ (bisher „Mit KI formulieren“ bzw. „Neu formulieren“); die Bezeichnung folgt dem Titel aus dem Profil. Die Fassung entsteht nur auf Knopfdruck.
- Management Summary: neuer Knopf „Leeren“ (mit Rückfrage). Automatisch geleert wird die Fassung, wenn die Meldung in der Maske durch eine andere ersetzt wird (Neue Meldung, Meldung öffnen, Übernahme eines KI-Entwurfs, Übernahme einer Meldung aus dem Lagebild, Neubeginn nach einem Fehler) und wenn Meldungen aus dem Lagebild an die KI-Verdichtung übergeben werden. Bearbeitungen der geöffneten Meldung leeren sie nicht; dann bleibt der Hinweis, dass die Fassung veraltet ist.

## [0.4.5] – 18.10.2026

### Geändert

- PDF, Kopiervorlage (HTML und Klartext) und Sachverhaltstabelle im Lagebild gliedern jetzt auch die Analysefelder (Lage & Ereignis, Risiken & Auswirkungen, Maßnahmen & Handlungsempfehlungen, Abhängigkeiten & Interdependenzen). Schlüsselsätze, die einen neuen Aspekt einleiten („Bestätigt ist …“, „Einordnung „…“:“, „Nicht belegt …“, „Mögliche Entwicklungen …“, „Szenario:“, „Belegte Kopplungen:“, „Möglich, aber nicht belegt …“, „Prüf- und Abstimmungsbedarf:“ …), beginnen mit Leerzeile; Aufzählungen („(1) …“, „Empfehlung 1:“, „Erstens, …“) und kurze Aspektbegriffe mit Doppelpunkt („Strom:“, „Verkehr → Versorgung:“, „Puffer:“) auf neuer Zeile. Die Satzanfänge kommen aus der Darstellungsdatei (neuer Abschnitt `analyse_gliederung`); gespeicherte Meldungen bleiben unverändert. Rückmeldung aus einem echten Lauf.
- Die Gliederung kennt die Option `kurzlabel` (höchstens so viele Wörter vor dem Doppelpunkt). Ordnungszahlen „(1)“ und „1.“ bleiben bei ihrem Aspektbegriff, Uhrzeiten und Daten lösen keinen Umbruch aus.
- Profilimport prüft `bewertung_gliederung` und `analyse_gliederung`: Listen von Texten, gültige reguläre Ausdrücke, `kurzlabel` von 0 bis 8.

## [0.4.4] – 18.10.2026

### Geändert

- PDF: Der Freigabeblock steht nicht mehr im Kopf „Meldung“, sondern als eigener Block „Freigabe & Versand“ am Ende zwischen „Quellen & Referenzen“ und „Entstehung“, als Tabelle mit Zeilen Erfassung, Freigabe, Versand und Spalten Name, Datum, Handzeichen; leere Felder bleiben zum Ausfüllen frei. Gesteuert über die neue Rolle `freigabe` der Darstellungsdatei.
- PDF, Kopiervorlage und Sachverhaltstabelle im Lagebild gliedern den Bewertungstext: Kernaussage, Referenzraum, Beurteilung, Tendenz, Achsenbegründungen und Kennsätze („Neubewertung bei:“, „Handlungsrelevant bis:“ …) beginnen auf eigener Zeile oder mit Leerzeile. Die Satzanfänge kommen aus der Darstellungsdatei (`bewertung_gliederung`); gespeicherte Meldungen bleiben unverändert.
- PDF: Abschnittsüberschriften stehen nicht mehr allein am Seitenende.

## [0.4.3] – 18.10.2026

### Behoben

- PDF-Ausgabe (Meldung und Lagebild): Das Lagenradar erscheint wieder als Grafik, als Vektorzeichnung links neben den Achsenwerten. Offene Achsen sind als hohle Punkte erkennbar, nicht als Stufe 0. Rückmeldung aus einem echten Lauf.

### Geändert

- PDF: Die Überschrift eines Sachverhalts läuft über die ganze Tabellenbreite; die Radarzeile wird nicht über einen Seitenumbruch geteilt.

## [0.4.2] – 18.10.2026

### Neu

- Rollenwahl bei der Übergabe an die KI-Verdichtung: Im Übergabedialog des Lagebilds wählt man je ausgewählter Meldung „Als Eingang behandeln“ (wird verdichtet) oder „Als Vormeldung behandeln“ (wird fortgeschrieben). Vorschlag aus der Erkennung der eigenen Stelle; nicht mögliche Rollen sind gesperrt und begründet (z. B. fremdes Schema nur als Eingang). Die Rolle bleibt beim Ab- und Wiederanwählen erhalten, gilt nur für den Auftrag und ändert die Originalmeldung nicht. Zusammenfassung mit Hinweisen bei mehreren Vormeldungen oder ohne Eingang; bedienbar per Tastatur und Screenreader (Optionsfelder je Meldung mit Gruppenbeschriftung).
- Die gewählte Rolle wird verbindlich in die KI-Erfassung übernommen, dort als „Rolle festgelegt“ bzw. „automatisch erkannt“ angezeigt, bleibt korrigierbar und wird im Laufprotokoll je Material festgehalten (`rolleGewaehlt`).

## [0.4.1] – 18.10.2026

Korrekturen nach einem unabhängigen Code-Review (Befunde F01–F15) und Einführung der Änderungsverläufe.

### Behoben

- Zwischenstand der Meldung: Speicherung je Profil; ausstehende Speicherungen werden vor einem Profilwechsel und beim Verlassen der Seite geschrieben; verspätete Ladevorgänge eines vorher aktiven Profils werden verworfen; Speicherfehler werden angezeigt (F01).
- Fehlerhafte Meldungen bringen die Oberfläche nicht mehr zum Absturz: Prüfung der Wurzel und Rückfrage bei falschen Datentypen vor der Übernahme, sichere Textanzeige, Fehlergrenze mit Sicherung als JSON und Neubeginn (F02).
- KI-Entwürfe tragen Land und meldende Stelle des eigenen Profils; die Korrektur eines fremden Absenders wird als Warnung gemeldet (F03).
- Schemaprüfung: `$ref` mit Geschwisterbedingungen (auch `allOf`), Verweise auf boolesche Schemata, strukturelle Gleichheit für `const`, `enum` und `uniqueItems`; Differenztests gegen Ajv (F04, F11).
- Ungültige Datumsangaben in Kennsätzen (z. B. 31.02., 25:99) ergeben keine Frist mehr (F05).
- Quellenprüfung der Verdichtung: jede Eingangsmeldung braucht einen eigenen Eintrag der Kategorie A; bei mehreren Meldungen derselben Stelle zusätzlich die Uhrzeit; schwache Treffer gelten als „unsicher“ (F06).
- Eigene Stelle nur bei exakter Übereinstimmung oder über Aliasnamen (`eigene_stellen`), nicht mehr über den Namensanfang; die Einordnung als Eingang oder Vormeldung ist in der KI-Erfassung korrigierbar (F07).
- Referenzvergleich: Mindestähnlichkeit auch bei nur einem Sachverhalt je Seite, nur beidseitig vorhandene Werte zählen, fehlende Angaben gesondert (F08).
- SSE-Parser unabhängig davon, wo ein Datenpaket Zeilenenden trennt (F09).
- Profile mit unbrauchbarer Struktur (z. B. ohne Bearbeitungsschritt, ohne Pflichtrollen) lassen sich nicht mehr aktivieren (F10).
- Formular: Wahrheitswerte als Kontrollkästchen bzw. Dreifachauswahl, Auswahllisten behalten den Datentyp der Werte (F12).
- CSV-Export schützt vor Formelinterpretation in Tabellenprogrammen (F13).
- Gleichnamige Dateien aus ZIP-Archiven behalten ihren Pfad; Materialnamen in der KI-Erfassung sind eindeutig (F14).
- Profilimport: gleiche ID und Version mit anderem Inhalt gilt als Versionskonflikt; beim Ersetzen wird der alte Stand im Gerät archiviert; Zwischenstände merken sich die Profilversion (F15).

### Geändert

- Finale JSON- und PDF-Ausgabe verlangen bei Schemaabweichungen dieselbe Bestätigung.
- Grenzen beim Einlesen (Anzahl, Größe je Datei, entpackte Gesamtgröße); PDF-Größe wird vor dem Einlesen geprüft.
- Laufende KI-Anfragen werden beim Profilwechsel abgebrochen.
- Referenzvergleich: Zuordnung der Sachverhalte von Hand änderbar; gespeichert werden Prüfsumme und Inhalt der Referenzfassung, Zuordnung und Verfahrenskennung `ki-lead-vergleich/2`.

### Neu

- Änderungsverläufe für App, Spezifikation, Profilformat und Profile; Git-Tags je Version.

## [0.4.0] – 18.10.2026 (Meilenstein 4)

### Neu

- Verdichtung von Meldungen zur Meldung der nächsten Ebene: Übergabe aus dem Lagebild mit Auswahl, eigene Rolle „Verdichtung“ mit Modell und Aufwand, Arbeitsanweisung aus dem Profil (`anweisungen.verdichtung`).
- Redaktionsvermerke: Die App wertet die Eingangsmeldungen vor S1 und S2 mit dem Redaktionscheck aus und gibt das Ergebnis der KI als Arbeitshilfe mit; nach S3 prüft sie die Quellenangaben der Eingänge.
- Vergleich eines KI-Entwurfs mit einer Referenzfassung (Beurteilung, Tendenz, Ereignisarten, Kennzahlen je Radarachse ohne Gesamtwert), gespeichert im Laufprotokoll, Export als CSV und JSON.
- Zweiter Anbieter OpenAI (Responses API, Websuche, strukturierte Ausgabe, `store: false`), Modelle gpt-6-luna, gpt-6.1-sol, gpt-6-astra; Auswahl des Anbieters nach Modellkennung, Schlüssel je Anbieter.

## [0.3.0] – 18.10.2026 (Meilenstein 3)

### Neu

- Modul „Lagebild“: Meldungen als JSON oder ZIP einlesen, prüfen und gemeinsam auswerten; Übersicht mit Kennzahlen, Meldestatus aus `kontakte.json` mit Erinnerungsmail, Verteilungen; Meldungen, Sachverhalte nach Schwere, Lagenradar je Sachverhalt ohne Mittelwert, Rohtabelle.
- Redaktionscheck nach SOP-LEAD A.3–A.8 (Zeitfenster, abweichende Bewertungen mit Textbaustein, Fortschreibung, Nachlauf, Abschluss, Mehrfachmeldungen, Kernaussage, Quellen, Schema, Status).
- Ausgabe als Kopiervorlage für Word, CSV und PDF; Übergabe an die KI-Erfassung.
- Beispieldatensatz „Ilka“ (FIKTIV) im Beispielprofil, in der App ladbar.

### Nachtrag vom 18.10.2026 (3146797, lief als 0.3.0)

- Lagenradar in Kopiervorlage und PDF mit Achsen- und Stufenbezeichnung je Zeile statt nur „D1: 4“.

## [0.2.0] – 17.10.2026 (Meilenstein 2)

### Neu

- Gestufte KI-Erfassung nach LEAD mit Anthropic: S1 Gegenstand und SOP-Auswahl mit Bestätigung, S2 Recherche und Entwurf mit Websuche und Seitenabruf, S3 Prüfung mit höchstens zwei Reparaturen; Laufprotokoll je Lauf mit Export.
- Einstellungen für Schlüssel, Modelle, Aufwand und Recherchegrenzen; Kostenschätzung nach Listenpreisen.

### Nachträge vom 17. und 18.10.2026 (liefen als 0.2.0)

- 17.10. (9263994): verweigerte Seitenabrufe werden angezeigt; Höchstlänge je abgerufener Seite; Profilvariable `kurzname`.
- 17.10. (8648e9a): Management Summary mit KI; Knopf „Neue KI-Erfassung“.
- 18.10. (c995bdc): Bildschirm bleibt während KI-Anfragen wach; abgerissene Verbindungen werden fortgesetzt oder neu gestellt.
- 18.10. (3633f7a): vorläufige Verdichtung von Eingangsmeldungen, Meldezeitpunkt t0, Websuche abschaltbar.
- 18.10. (b2bdd5d): S2 mit bis zu 128 000 Ausgabetoken und Vervollständigung bei Abschneiden; t0 mit Uhrzeit.
- 18.10. (8cb1dce): Management Summary als eine konsolidierte Leitungsfassung.

## [0.1.0] – 17.10.2026 (Meilenstein 1)

### Neu

- Web-Kern ohne KI: Profilpakete, Meldungsmaske aus Schema und Darstellungsdatei, Schemaprüfung ohne Codeerzeugung, Quellen- und Kennsatzprüfung, Migration, Ausgabe als JSON, PDF und Kurzfassung, Profilverwaltung.
- Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“, Musterprofil, fiktiver Datensatz „Ilka“.

### Nachtrag vom 17.10.2026 (6bfa6fe)

- Autorenname im Kodierleitfaden des Beispielprofils korrigiert.

[0.4.11]: https://github.com/pereirawolf/ki-lead/compare/90ab407...main
[0.4.10]: https://github.com/pereirawolf/ki-lead/compare/99403c0...90ab407
[0.4.9]: https://github.com/pereirawolf/ki-lead/compare/40cd5a9...99403c0
[0.4.8]: https://github.com/pereirawolf/ki-lead/compare/89bfa77...40cd5a9
[0.4.7]: https://github.com/pereirawolf/ki-lead/compare/6636068...89bfa77
[0.4.6]: https://github.com/pereirawolf/ki-lead/compare/ea3a8a3...6636068
[0.4.5]: https://github.com/pereirawolf/ki-lead/compare/68ff2da...ea3a8a3
[0.4.4]: https://github.com/pereirawolf/ki-lead/compare/9f8dca1...68ff2da
[0.4.3]: https://github.com/pereirawolf/ki-lead/compare/9f8ae9f...9f8dca1
[0.4.2]: https://github.com/pereirawolf/ki-lead/compare/1704922...9f8ae9f
[0.4.1]: https://github.com/pereirawolf/ki-lead/compare/a6ed060...1704922
[0.4.0]: https://github.com/pereirawolf/ki-lead/compare/3146797...a6ed060
[0.3.0]: https://github.com/pereirawolf/ki-lead/compare/8cb1dce...3146797
[0.2.0]: https://github.com/pereirawolf/ki-lead/compare/6bfa6fe...8cb1dce
[0.1.0]: https://github.com/pereirawolf/ki-lead/tree/6bfa6fe

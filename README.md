# KI-LEAD

Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und -darstellung) im Bevölkerungsschutz. KI-LEAD unterstützt drei Arbeitsprodukte: einen belegten **Meldungsentwurf** (Erfassung), eine **eigene Meldung aus mehreren Eingangsmeldungen** (Verdichtung) und eine **Kurzfassung für die Leitung** (Management Summary). Profile bündeln die dazugehörigen Regeln, Schemata und Darstellungen. Die fachliche Prüfung und Freigabe bleiben bei der bearbeitenden Person.

**Stand:** Version 0.6.2, Meilenstein 5 in Arbeit: installierbar als App (PWA) mit Offline-Start, native Projekte für iOS und Android angelegt; Meilenstein 4 technisch abgenommen; siehe [Fahrplan](#fahrplan).

## Abgrenzung

KI-LEAD ist ein privates Forschungsvorhaben von Heiko Pereira Wolf ([ORCID 0009-0004-0014-7616](https://orcid.org/0009-0004-0014-7616)). Es ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Die mitgelieferten Profile, Schemata und Daten sind Beispiele für Forschung und Erprobung; sie geben keine offiziellen Vorgaben wieder. Der Demonstrator nutzt nur eigene oder veröffentlichte Materialien.

**Impressum und Kontakt:** [pereirawolf.de/impressum.html](https://www.pereirawolf.de/impressum.html). Die App verweist darauf im Fuß und unter „Einstellungen → Über KI-LEAD“; Datenschutzerklärung: [docs/DATENSCHUTZ.md](docs/DATENSCHUTZ.md), Abschnitt 12.

Bitte nur fiktive oder offen zugängliche Inhalte verwenden, keine personenbezogenen und keine eingestuften Daten.

## Schnellstart

**Erster Versuch ohne KI**

1. Die App starten (lokal: siehe [Entwicklung und Mitwirken](#entwicklung-und-mitwirken)).
2. Das Profil „LEAD-Beispiel – Koordinierungsstelle“ wählen.
3. Im Lagebild „Beispiel laden“ wählen. Der Datensatz Orkantief „Ilka“ ist vollständig fiktiv.
4. Meldungen, Sachverhalte und Lagenradar ansehen, eine Meldung öffnen und als PDF oder JSON ausgeben.

**Als App:** Im Browser über „App installieren“ (Chrome, Edge) oder „Zum Home-Bildschirm“ (Safari) hinzufügen. Nach dem ersten Aufruf startet KI-LEAD auch ohne Netz; nur die KI-Funktionen brauchen eine Verbindung.

**Startet die App nicht** (leere Seite): alle Fenster mit KI-LEAD schließen und die App neu öffnen; eine bereits geladene neuere Fassung wird dann aktiv. Sonst die Reparaturseite `reparatur.html` im Ordner der App aufrufen (etwa `https://pereirawolf.github.io/ki-lead/reparatur.html`) und „Programmdateien zurücksetzen“ wählen. Meldungen, Profile, Einstellungen und API-Schlüssel bleiben dabei erhalten. Einzelheiten: [docs/STARTPROBLEME.md](docs/STARTPROBLEME.md).

**Mit KI:** In den Einstellungen unter „KI-Anbieter & API“ einen eigenen API-Schlüssel von Anthropic, OpenAI oder Mistral hinterlegen. In der KI-Erfassung dann Material bereitstellen und festlegen, ob Websuche und Seitenabruf erlaubt sind.

## Funktionen

- **Erfassung (gestuft nach LEAD):**
  1. *Auftrag und Material:* Sachverhalt, Stichworte, URLs und Dateien (TXT, MD, JSON, DOCX, PDF). Meldungen im Schema des Profils ordnet die App als eigene Vormeldung (wird fortgeschrieben) oder als Eingangsmeldung (wird ausgewertet) ein; die Rolle lässt sich je Meldung ändern.
  2. *S1 Gegenstand bestätigen:* Ein kleines Modell schlägt Gliederung, Ereignisarten und SOPs vor; die Person bestätigt oder korrigiert.
  3. *S2 Entwurf:* Die KI arbeitet mit dem Material und, sofern im Auftrag erlaubt, mit Websuche und Seitenabruf.
  4. *S3 Prüfung:* Die App prüft gegen das Schema und lässt Fehler höchstens zweimal ohne neue Recherche korrigieren. Der Entwurf geht in die Meldungsmaske.
- **Lagebild und Verdichtung:** Meldungen mehrerer Stellen (JSON-Dateien oder ZIP-Archive) zusammenführen, prüfen und darstellen: Übersicht, Meldestatus, Sachverhalte nach Schwere, Lagenradar je Sachverhalt ohne Mittelwert, Redaktionscheck; Ausgabe für Word, als CSV und als PDF. Ausgewählte Meldungen gehen an die Verdichtung, die den Sachverhalt für den eigenen Referenzraum neu bewertet; die Websuche ist dabei standardmäßig aus. Verwendete Eingangsmeldungen werden als Quellen nachgewiesen; ihre Kategorie richtet sich nach der Rolle der meldenden Stelle (z. B. Behörde A, Betreiber zum eigenen Betrieb B).
- **Management Summary:** eine Fassung der Meldung für die Leitung, lesbar in einer Minute. Beurteilung, Tendenz, Fristen und Entwurfsvermerk übernimmt die App aus der Meldung.
- **Profile:** Profile untereinander mit Aktivstatus, Metadaten und Prüfsumme. Arbeitsanweisungen und Kodierleitfaden (mit Fassung), SOP-Katalog mit Suche sowie Übersichten und Änderungsverläufe lassen sich ohne KI direkt in der App lesen, mit Inhaltsverzeichnis und Einzeldownload.
- **Drei Anbieter:** je Stufe ein Modell von Anthropic, OpenAI oder Mistral (Mistral seit 0.5.6, erprobt am 24.10.2026 mit der Verdichtung Ilka ohne Websuche; als Vorgabe über den EU-Endpunkt ohne Websuche, wahlweise global mit Websuche).
- **Darstellung:** Farbschema der Oberfläche nach Wahl: neutral hell oder dunkel, Bund, Bevölkerungsschutz, jedes der 16 Länder oder eigene Farben des Profils ([Farbschemata](docs/farbschemas.md)). Downloads tragen das Datum vorn im Dateinamen (`2026-10-20T20-31_LEAD-Meldung_…_ENTWURF.pdf`).
- **Forschungsfunktionen:** Laufprotokoll mit Prompts, Antworten, Token, Kosten und Dauer (Export als JSON); Vergleich eines Laufs mit einer Referenzfassung je Radarachse, ohne Gesamtwert.

Schema- und Redaktionsprüfungen unterstützen die Bearbeitung, belegen aber weder die sachliche Richtigkeit noch die Vollständigkeit einer Meldung. Ergebnisse bleiben bis zur fachlichen Prüfung und Freigabe Entwürfe. Einzelheiten zu allen Funktionen: [Spezifikation](docs/SPEZIFIKATION.md).

## Datenverarbeitung und Voraussetzungen

- KI-LEAD ist eine Browseranwendung für Desktop, Tablet und Smartphone und lässt sich als App installieren (PWA). Meldungen, Profile, Lagebild und Einstellungen speichert sie im Browser des Geräts. Ein Service Worker hält die Dateien der App vor, damit sie ohne Netz startet; Inhalte und Anfragen an die KI-Anbieter speichert er nicht. Die Apps für iOS und Android entstehen aus demselben Code mit Capacitor ([Anleitung](docs/NATIV.md)).
- Bei einer KI-Funktion übermittelt die App die dafür zusammengestellten Inhalte (Arbeitsanweisung, Profilregeln, Auftrag und Material) an den gewählten Anbieter. Websuche und Seitenabruf führt der Anbieter aus, nicht das Gerät.
- Für KI-Funktionen ist ein eigener API-Schlüssel von Anthropic, OpenAI oder Mistral nötig. Er geht nur an die Schnittstelle des jeweiligen Anbieters. Wo er liegt, wählt die Person selbst: im Gerätespeicher der App, nur für die laufende Sitzung oder in der App für iOS und Android im Schlüsselbund des Systems (Keychain, Keystore). Ein Ausgabenlimit beim Anbieter begrenzt das Risiko in jedem Fall.
- Einzelheiten zu Datenflüssen, Aufbewahrung bei den Anbietern, Protokollen und Löschen: [Datenschutzhinweise](docs/DATENSCHUTZ.md); Risiken und Maßnahmen: [Sicherheit](docs/SICHERHEIT.md).

## Dokumentation

| Wofür | Datei |
|---|---|
| Erfassung verstehen | [Arbeitsanweisung Erfassung](profile/lead-beispiel/anweisung-erfassung.md) |
| Eingänge verdichten | [Arbeitsanweisung Verdichtung](profile/lead-beispiel/anweisung-verdichtung.md) |
| Kurzfassung erstellen | [Arbeitsanweisung Kurzfassung](profile/lead-beispiel/anweisung-kurzfassung.md) |
| Lagenradar und Quellen kodieren | [Kodierleitfaden](profile/lead-beispiel/kodierleitfaden.md) |
| SOPs auswählen und bearbeiten | [SOP-Übersicht](profile/lead-beispiel/sop/README.md) |
| SOPs zusammenhängend lesen | [Lesefassung der Sammelmappe](profile/lead-beispiel/sop/SOP-LEAD_Sammelmappe_Lesefassung.md) |
| Eigene Profile entwickeln | [Profilformat](docs/PROFILFORMAT.md) |
| Technik und Funktionsumfang | [Spezifikation](docs/SPEZIFIKATION.md) |
| Datenschutzerklärung, Datenflüsse, Speicherorte, Store-Angaben | [Datenschutzhinweise](docs/DATENSCHUTZ.md) |
| Einordnung nach der KI-Verordnung, Systemkarte | [KI-Verordnung](docs/KI-VERORDNUNG.md) |
| Bedrohungsmodell, Schwachstellen melden | [Sicherheit](docs/SICHERHEIT.md), [SECURITY.md](SECURITY.md) |
| Stand und Lücken der Barrierefreiheit | [Barrierefreiheit](docs/BARRIEREFREIHEIT.md) |
| An der Erprobung teilnehmen, Rückmeldung geben | [Erprobung im Testkreis](docs/ERPROBUNG.md) |
| Drittkomponenten, Lizenzen, SBOM | [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) |

## Profile

Auf jeder Ebene gilt dieselbe Systematik: Die Meldungen nachgeordneter und lateraler Stellen ergeben die eigene Meldung, die wiederum übergeordnete und laterale Stellen nutzen. Alles Organisationsspezifische steckt deshalb in einem austauschbaren **Profilpaket**; die App selbst enthält nur die LEAD-Logik. Ein Profilpaket enthält:

- `profil.json`: Manifest mit Name, Version, Ebene, Referenzraum, Variablen und Dateiliste
- `meldung.schema.json`: das JSON-Schema der Meldung, unverändert aus der Organisation
- `meldung.ui.json`: Darstellung, also Schritte, Feldbezeichnungen, Hinweise, Radar-Stufentexte, Kennsätze und Quellenkategorien
- Arbeitsanweisungen für die KI mit Platzhaltern: Erfassung (Pflicht), optional Verdichtung und Kurzfassung
- `kodierleitfaden.md` sowie optional SOP-Dateien und Kontakte

Das Format beschreibt [docs/PROFILFORMAT.md](docs/PROFILFORMAT.md). Mitgeliefert werden:

- **`profile/lead-beispiel`:** fiktive Koordinierungsstelle auf Bundesebene mit LEAD-Meldevorlage, Kodierleitfaden mit Lagenradar, den drei Arbeitsanweisungen und der SOP-Sammelmappe: gemeinsame Regeln (Teil A), 17 Dach-SOPs zu den Ereignisarten (B01–B17) und 17 ergänzende Themen- und Querschnittsbausteine (C01–C17). Teil C ist als Inhaltsgerüst gekennzeichnet und dient bis zur fachlichen Konkretisierung und Freigabe als ergänzende Prüfhilfe.
- **`profile/muster`:** Vorlage für ein eigenes Profilpaket: alle Bestandteile als Gerüst mit Platzhaltern, schlankes Schema, CC0 1.0.

**Eigene Profile** legt man lokal in den Ordner `privat/profile/<name>/`. Der Ordner ist per `.gitignore` vom Repository ausgeschlossen. `npm run dev` lädt ihn mit, ein Produktionsbuild nur mit `KI_LEAD_PRIVAT=1 npm run build`. Alternativ importiert man ein Profil in der App als ZIP-Datei (`.leadprofil`). Kontaktadressen gehören in `kontakte.lokal.json`, das ebenfalls nicht eingecheckt wird.

## Entwicklung und Mitwirken

Voraussetzung ist Node.js 22.

```
npm ci                  # Abhängigkeiten nach package-lock.json (Node 22, siehe .nvmrc)
npm run dev             # Entwicklungsserver
npm test                # Tests (Kern, Profile, Pipeline, Anbieter, Oberfläche; KI-Anbieter simuliert)
npm run test:zufall     # dieselben Tests in zufälliger, fester Reihenfolge
npm run test:coverage   # Tests mit Abdeckung und Mindestwerten für src/kern, src/pipeline, src/anbieter
npm run lint            # ESLint (Fehler brechen ab; Warnungen wie no-explicit-any nicht)
npm run format:check    # Prettier-Prüfung (npm run format schreibt die Formatierung)
npm run typecheck       # Typprüfung von src, Konfiguration, Skripten und Tests
npm run test:browser    # Browsertests mit Playwright gegen den Build (einmalig: npx playwright install chromium)
npm run test:inhalt     # nur Profil-, Kern- und Evaluationstests (schnell, bei Arbeit an SOP und Profilen)
npm run build           # Produktionsbuild nach dist/
npm run sop:lesefassung # Lesefassung der SOP-Sammelmappe neu erzeugen
```

Die Schemaprüfung der App kommt ohne Codeerzeugung aus und läuft daher unter einer strengen Content-Security-Policy. Die Tests vergleichen ihr Urteil mit Ajv als Referenz. Aufbau, Hilfen und Regeln der Tests: [docs/TESTS.md](docs/TESTS.md); die inhaltliche Bewertung von KI-Modellen ist davon getrennt und in [evaluation/](evaluation/README.md) beschrieben.

**Testdaten:** Im Ordner `profile/lead-beispiel/beispiele/orkantief-ilka` liegt der **fiktive** Datensatz Orkantief „Ilka“ mit sechs Ländermeldungen und der daraus verdichteten Meldung einer Koordinierungsstelle; keine Meldung stammt von den darin genannten Stellen (siehe `LIESMICH.md` dort). Eigene Testdaten unter `privat/testdaten/<satz>/` prüft `npm test` mit, wenn dort eine Datei `profil.txt` den Profilordner nennt.

**Prüfung und Veröffentlichung:** GitHub Actions prüft Änderungen am Hauptzweig `main`, manuell gestartete Läufe und wöchentlich den ganzen Stand mit allen Tests (auch in zufälliger Reihenfolge), Build und Browsertests. Pull Requests werden gestaffelt geprüft: Tests und Build immer, Browsertests nur, wenn die Änderung mehr als reine Inhalte (Dokumentation, SOP, Bewertungsfälle) betrifft (siehe [docs/TESTS.md](docs/TESTS.md)). Die Veröffentlichung auf GitHub Pages ist gesondert konfiguriert und setzt die Repository-Variable `PAGES_AKTIV=true` sowie „GitHub Actions“ als Pages-Quelle voraus (`.github/workflows/pages.yml`).

**SOPs bearbeiten:** Maßgeblich sind die Einzeldateien unter `profile/lead-beispiel/sop/`; welche davon die App lädt, steht im Profilmanifest unter `sop.dateien`. Nach Änderungen `npm run sop:lesefassung` ausführen; die erzeugte Lesefassung und die Archivfassungen nicht von Hand bearbeiten. Fassungen und Gültigkeitsstand (Teil A) sowie die Änderungsverläufe nach den Pflegeregeln fortschreiben.

**Abhängigkeiten:** so wenige wie möglich. Eine neue Laufzeitabhängigkeit braucht eine Lizenz aus der Positivliste und einen Eintrag in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md); sonst scheitert `npm test` (`tests/lizenzen/`). Die CI legt bei jedem Lauf eine SBOM im Format CycloneDX als Artefakt ab und hängt sie an jeden Release.

**Rückmeldungen:** über die Issue-Vorlagen „Fehler“, „Fachrückmeldung“, „Barrierefreiheit“ und „Datenschutz“; Regeln für die Erprobung in [docs/ERPROBUNG.md](docs/ERPROBUNG.md). Sicherheitslücken vertraulich nach [SECURITY.md](SECURITY.md).

**Beiträge:** Änderungen in einem eigenen Zweig sammeln, `npm run lint`, `npm run format:check`, `npm test` und `npm run build` ausführen und als Pull Request gegen `main` zur Prüfung vorlegen. Die Versionsnummer der App steht in `package.json`; die App liest sie beim Build (`__APP_VERSION__`).

**TypeScript:** Typprüfung und Build laufen mit TypeScript 7 (`tsc`, Paket `@typescript/native`). Weil typescript-eslint die TypeScript-API braucht, die TypeScript 7 nicht mehr bietet, zeigt das Paket `typescript` auf `@typescript/typescript6` (Weg nach der Ankündigung von TypeScript 7.0).

## Versionen und Änderungen

App, Profil und Fachdokumente tragen eigene Fassungen: die App eine Versionsnummer (derzeit 0.6.2), jedes Profil eine eigene Version (Beispielprofil 1.30.0), die SOP-Sammelmappe und die Fachdokumente eigene Fassungen. Welche Fassungen zusammengehören, steht im Gültigkeitsstand am Anfang von Teil A der [SOP-Sammelmappe](profile/lead-beispiel/sop/A_Gemeinsame-Regeln.md).

Was sich wann geändert hat, steht in [CHANGELOG.md](CHANGELOG.md) (App), im Abschnitt „Änderungsverlauf“ der [Spezifikation](docs/SPEZIFIKATION.md) und des [Profilformats](docs/PROFILFORMAT.md), in der Datei `CHANGELOG.md` jedes Profils sowie für die SOPs in [profile/lead-beispiel/sop/CHANGELOG.md](profile/lead-beispiel/sop/CHANGELOG.md). Jede Änderung wird im selben Commit dort eingetragen; jede App-Version ist im Änderungsverlauf einem Commit zugeordnet. Das Laufprotokoll jedes KI-Laufs hält zusätzlich die Prüfsumme des verwendeten Profilstands fest.

## Fahrplan

| Meilenstein | Inhalt | Stand |
|---|---|---|
| M1 | Web-Kern ohne KI: Profile, Formular aus Schema, Prüfung, Import und Export | umgesetzt, Abnahme durch Regressionstests |
| M2 | KI-Pipeline für die Erfassung (gestuft nach LEAD), Anthropic | umgesetzt, erprobt in den Testreihen vom 18.–21.10.2026 |
| M3 | Modul Lagebild: Zusammenführung und Redaktionscheck | umgesetzt, Abnahme durch Regressionstests |
| M4 | KI-Verdichtung von Meldungen zur Meldung der nächsten Ebene; OpenAI | technisch abgenommen am 23.10.2026 mit Anthropic und OpenAI ([Ergebnis](evaluation/abnahmen/2026-10-23-m4-ergebnis.md)) |
| M5 | Apps für iOS (TestFlight) und Android, PWA | PWA umgesetzt (0.5.0); native Projekte und Schlüsselbund angelegt (0.5.1), Builds und Abnahme auf Geräten offen ([Anleitung](docs/NATIV.md)) |
| M6 | Erprobung im Testkreis auf einem Release-Kandidaten ([Konzept](docs/ERPROBUNG.md)), danach erster veröffentlichter Release mit DOI; die Versionsnummer wird bei der Freigabe festgelegt | geplant |

„Umgesetzt“ heißt: Funktion vorhanden und durch Regressionstests belegt. „Abgenommen“ heißt: Abnahmekriterium der Spezifikation mit echten KI-Läufen geprüft und dokumentiert. KI-LEAD bleibt ein Forschungsdemonstrator; eine Abnahme ist keine fachliche Freigabe der Methodik.

Einzelheiten stehen in der [Spezifikation](docs/SPEZIFIKATION.md).

## Lizenz

Code unter EUPL-1.2 ([LICENSE](LICENSE)); Beispielprofile, Evaluationsmaterial und Dokumentation unter CC BY 4.0, maschinenlesbare Dateien und die Vorlage zusätzlich unter CC0 1.0, mit den Ausnahmen in [LICENSE-CONTENT](LICENSE-CONTENT).

- **Code** (Quelltext, Tests, Skripte, Build- und Projektdateien, App): [EUPL-1.2](LICENSE)
- **Inhalte** in `profile/`, `evaluation/` und `docs/` (Arbeitsanweisungen, SOP, Kodierleitfaden, Darstellungsdateien, Bewertungsfälle, Prüfsteine, Dokumentation): [CC BY 4.0](LICENSE-CONTENT), Namensnennung: Heiko Pereira Wolf
- **Maschinenlesbare Dateien** (Meldungsschemata, Manifeste, Kontaktlisten, Quellenregister, JSON-Schemata der Modellbewertung) und die **Vorlage** `profile/muster/`: zusätzlich [CC0 1.0](LICENSE-CC0), damit Fachverfahren sie ohne Namensnennung übernehmen können
- **Ausgaben der App** (Meldungen, Lagebilder, Kurzfassungen): Profiltexte, die die App dorthin übernimmt, dürfen ohne Namensnennung verwendet werden; an Eingaben und Ergebnissen beansprucht der Herausgeber keine Rechte
- **Eigene und importierte Profile:** die Lizenz, die ihr Herausgeber im Manifest angibt
- Begleitende Aufsätze außerhalb des Repositorys (Zenodo, pereirawolf.de): CC BY-NC-ND 4.0
- Drittkomponenten (Bibliotheken, Schrift Atkinson Hyperlegible, native Plugins) mit Lizenz, Urheber und Verträglichkeit: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Der Build legt ihre Lizenztexte als `lizenzen.md` und `lizenzen-ergaenzend.md` in die App.

## Zitiervorschlag

Pereira Wolf, H. (2026). *KI-LEAD: Forschungsdemonstrator für die KI-gestützte Lageerfassung, -auswertung und -darstellung* (Version 0.6.2) [Software]. https://github.com/pereirawolf/ki-lead

Die Zitierangaben stehen maschinenlesbar in [CITATION.cff](CITATION.cff); GitHub zeigt sie unter „Cite this repository“ an. Eine DOI folgt mit dem ersten Release über Zenodo.

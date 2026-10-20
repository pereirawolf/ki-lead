# KI-LEAD

Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und -darstellung) im Bevölkerungsschutz. KI-LEAD unterstützt drei Arbeitsprodukte: einen belegten **Meldungsentwurf** (Erfassung), eine **eigene Meldung aus mehreren Eingangsmeldungen** (Verdichtung) und eine **Kurzfassung für die Leitung** (Management Summary). Profile bündeln die dazugehörigen Regeln, Schemata und Darstellungen. Die fachliche Prüfung und Freigabe bleiben bei der bearbeitenden Person.

**Stand:** Version 0.4.16, Meilenstein 4 (Verdichtung, zwei KI-Anbieter); siehe [Fahrplan](#fahrplan).

## Abgrenzung

KI-LEAD ist ein privates Forschungsvorhaben von Heiko Pereira Wolf ([ORCID 0009-0004-0014-7616](https://orcid.org/0009-0004-0014-7616)). Es ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Die mitgelieferten Profile, Schemata und Daten sind Beispiele für Forschung und Erprobung; sie geben keine offiziellen Vorgaben wieder. Der Demonstrator nutzt nur eigene oder veröffentlichte Materialien.

Bitte nur fiktive oder offen zugängliche Inhalte verwenden, keine personenbezogenen und keine eingestuften Daten.

## Schnellstart

**Erster Versuch ohne KI**

1. Die App starten (lokal: siehe [Entwicklung und Mitwirken](#entwicklung-und-mitwirken)).
2. Das Profil „LEAD-Beispiel – Koordinierungsstelle“ wählen.
3. Im Lagebild „Beispiel laden“ wählen. Der Datensatz Orkantief „Ilka“ ist vollständig fiktiv.
4. Meldungen, Sachverhalte und Lagenradar ansehen, eine Meldung öffnen und als PDF oder JSON ausgeben.

**Mit KI:** In den Einstellungen einen eigenen API-Schlüssel von Anthropic oder OpenAI hinterlegen. In der KI-Erfassung dann Material bereitstellen und festlegen, ob Websuche und Seitenabruf erlaubt sind.

## Funktionen

- **Erfassung (gestuft nach LEAD):**
  1. *Auftrag und Material:* Sachverhalt, Stichworte, URLs und Dateien (TXT, MD, JSON, DOCX, PDF). Meldungen im Schema des Profils ordnet die App als eigene Vormeldung (wird fortgeschrieben) oder als Eingangsmeldung (wird ausgewertet) ein; die Rolle lässt sich je Meldung ändern.
  2. *S1 Gegenstand bestätigen:* Ein kleines Modell schlägt Gliederung, Ereignisarten und SOPs vor; die Person bestätigt oder korrigiert.
  3. *S2 Entwurf:* Die KI arbeitet mit dem Material und, sofern im Auftrag erlaubt, mit Websuche und Seitenabruf.
  4. *S3 Prüfung:* Die App prüft gegen das Schema und lässt Fehler höchstens zweimal ohne neue Recherche korrigieren. Der Entwurf geht in die Meldungsmaske.
- **Lagebild und Verdichtung:** Meldungen mehrerer Stellen (JSON-Dateien oder ZIP-Archive) zusammenführen, prüfen und darstellen: Übersicht, Meldestatus, Sachverhalte nach Schwere, Lagenradar je Sachverhalt ohne Mittelwert, Redaktionscheck; Ausgabe für Word, als CSV und als PDF. Ausgewählte Meldungen gehen an die Verdichtung, die den Sachverhalt für den eigenen Referenzraum neu bewertet; die Websuche ist dabei standardmäßig aus. Verwendete Eingangsmeldungen werden als Quellen nachgewiesen; ihre Kategorie richtet sich nach der Rolle der meldenden Stelle (z. B. Behörde A, Betreiber zum eigenen Betrieb B).
- **Management Summary:** eine Fassung der Meldung für die Leitung, lesbar in einer Minute. Beurteilung, Tendenz, Fristen und Entwurfsvermerk übernimmt die App aus der Meldung.
- **Profile:** Profile untereinander mit Aktivstatus, Metadaten und Prüfsumme. Arbeitsanweisungen und Kodierleitfaden (mit Fassung), SOP-Katalog mit Suche sowie Übersichten und Änderungsverläufe lassen sich ohne KI direkt in der App lesen, mit Inhaltsverzeichnis und Einzeldownload.
- **Zwei Anbieter:** je Stufe ein Modell von Anthropic oder OpenAI.
- **Forschungsfunktionen:** Laufprotokoll mit Prompts, Antworten, Token, Kosten und Dauer (Export als JSON); Vergleich eines Laufs mit einer Referenzfassung je Radarachse, ohne Gesamtwert.

Schema- und Redaktionsprüfungen unterstützen die Bearbeitung, belegen aber weder die sachliche Richtigkeit noch die Vollständigkeit einer Meldung. Ergebnisse bleiben bis zur fachlichen Prüfung und Freigabe Entwürfe. Einzelheiten zu allen Funktionen: [Spezifikation](docs/SPEZIFIKATION.md).

## Datenverarbeitung und Voraussetzungen

- KI-LEAD ist eine Browseranwendung für Desktop, Tablet und Smartphone. Meldungen, Profile, Lagebild und Einstellungen speichert sie im Browser des Geräts. Eigene Apps für iOS und Android sind geplant (M5).
- Bei einer KI-Funktion übermittelt die App die dafür zusammengestellten Inhalte (Arbeitsanweisung, Profilregeln, Auftrag und Material) an den gewählten Anbieter. Websuche und Seitenabruf führt der Anbieter aus, nicht das Gerät.
- Für KI-Funktionen ist ein eigener API-Schlüssel von Anthropic oder OpenAI nötig. Er wird im Browser gespeichert und nur an die Schnittstelle des jeweiligen Anbieters gesendet.

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

## Profile

Auf jeder Ebene gilt dieselbe Systematik: Die Meldungen nachgeordneter und lateraler Stellen ergeben die eigene Meldung, die wiederum übergeordnete und laterale Stellen nutzen. Alles Organisationsspezifische steckt deshalb in einem austauschbaren **Profilpaket**; die App selbst enthält nur die LEAD-Logik. Ein Profilpaket enthält:

- `profil.json`: Manifest mit Name, Version, Ebene, Referenzraum, Variablen und Dateiliste
- `meldung.schema.json`: das JSON-Schema der Meldung, unverändert aus der Organisation
- `meldung.ui.json`: Darstellung, also Schritte, Feldbezeichnungen, Hinweise, Radar-Stufentexte, Kennsätze und Quellenkategorien
- Arbeitsanweisungen für die KI mit Platzhaltern: Erfassung (Pflicht), optional Verdichtung und Kurzfassung
- `kodierleitfaden.md` sowie optional SOP-Dateien und Kontakte

Das Format beschreibt [docs/PROFILFORMAT.md](docs/PROFILFORMAT.md). Mitgeliefert werden:

- **`profile/lead-beispiel`:** fiktive Koordinierungsstelle auf Bundesebene mit LEAD-Meldevorlage, Kodierleitfaden mit Lagenradar, den drei Arbeitsanweisungen und der SOP-Sammelmappe: gemeinsame Regeln (Teil A), 17 Dach-SOPs zu den Ereignisarten (B01–B17) und 17 ergänzende Themen- und Querschnittsbausteine (C01–C17). Teil C ist als Inhaltsgerüst gekennzeichnet und dient bis zur fachlichen Konkretisierung und Freigabe als ergänzende Prüfhilfe.
- **`profile/muster`:** schlankes Musterprofil als Vorlage.

**Eigene Profile** legt man lokal in den Ordner `privat/profile/<name>/`. Der Ordner ist per `.gitignore` vom Repository ausgeschlossen. `npm run dev` lädt ihn mit, ein Produktionsbuild nur mit `KI_LEAD_PRIVAT=1 npm run build`. Alternativ importiert man ein Profil in der App als ZIP-Datei (`.leadprofil`). Kontaktadressen gehören in `kontakte.lokal.json`, das ebenfalls nicht eingecheckt wird.

## Entwicklung und Mitwirken

Voraussetzung ist Node.js 22.

```
npm ci                  # Abhängigkeiten nach package-lock.json
npm run dev             # Entwicklungsserver
npm test                # Tests (Kern, Profile, Übungsdaten, Referenzvergleich mit Ajv, Anbieter und Pipeline mit Attrappe)
npm run build           # Produktionsbuild nach dist/
npm run sop:lesefassung # Lesefassung der SOP-Sammelmappe neu erzeugen
```

Die Schemaprüfung der App kommt ohne Codeerzeugung aus und läuft daher unter einer strengen Content-Security-Policy. Die Tests vergleichen ihr Urteil mit Ajv als Referenz.

**Testdaten:** Im Ordner `profile/lead-beispiel/beispiele/orkantief-ilka` liegt der **fiktive** Datensatz Orkantief „Ilka“ mit sechs Ländermeldungen und der daraus verdichteten Meldung einer Koordinierungsstelle; keine Meldung stammt von den darin genannten Stellen (siehe `LIESMICH.md` dort). Eigene Testdaten unter `privat/testdaten/<satz>/` prüft `npm test` mit, wenn dort eine Datei `profil.txt` den Profilordner nennt.

**Prüfung und Veröffentlichung:** GitHub Actions prüft Pull Requests, Änderungen am Hauptzweig `main` und manuell gestartete Läufe mit Tests und Build. Die Veröffentlichung auf GitHub Pages ist gesondert konfiguriert und setzt die Repository-Variable `PAGES_AKTIV=true` sowie „GitHub Actions“ als Pages-Quelle voraus (`.github/workflows/pages.yml`).

**SOPs bearbeiten:** Maßgeblich sind die Einzeldateien unter `profile/lead-beispiel/sop/`; welche davon die App lädt, steht im Profilmanifest unter `sop.dateien`. Nach Änderungen `npm run sop:lesefassung` ausführen; die erzeugte Lesefassung und die Archivfassungen nicht von Hand bearbeiten. Fassungen und Gültigkeitsstand (Teil A) sowie die Änderungsverläufe nach den Pflegeregeln fortschreiben.

**Beiträge:** Änderungen in einem eigenen Zweig sammeln, `npm test` und `npm run build` ausführen und als Pull Request gegen `main` zur Prüfung vorlegen.

## Versionen und Änderungen

App, Profil und Fachdokumente tragen eigene Fassungen: die App eine Versionsnummer (derzeit 0.4.16), jedes Profil eine eigene Version (Beispielprofil 1.8.0), die SOP-Sammelmappe und die Fachdokumente eigene Fassungen. Welche Fassungen zusammengehören, steht im Gültigkeitsstand am Anfang von Teil A der [SOP-Sammelmappe](profile/lead-beispiel/sop/A_Gemeinsame-Regeln.md).

Was sich wann geändert hat, steht in [CHANGELOG.md](CHANGELOG.md) (App), im Abschnitt „Änderungsverlauf“ der [Spezifikation](docs/SPEZIFIKATION.md) und des [Profilformats](docs/PROFILFORMAT.md), in der Datei `CHANGELOG.md` jedes Profils sowie für die SOPs in [profile/lead-beispiel/sop/CHANGELOG.md](profile/lead-beispiel/sop/CHANGELOG.md). Jede Änderung wird im selben Commit dort eingetragen; jede App-Version ist im Änderungsverlauf einem Commit zugeordnet. Das Laufprotokoll jedes KI-Laufs hält zusätzlich die Prüfsumme des verwendeten Profilstands fest.

## Fahrplan

| Meilenstein | Inhalt | Stand |
|---|---|---|
| M1 | Web-Kern ohne KI: Profile, Formular aus Schema, Prüfung, Import und Export | umgesetzt |
| M2 | KI-Pipeline für die Erfassung (gestuft nach LEAD), Anthropic | umgesetzt |
| M3 | Modul Lagebild: Zusammenführung und Redaktionscheck | umgesetzt |
| M4 | KI-Verdichtung von Meldungen zur Meldung der nächsten Ebene; OpenAI | umgesetzt |
| M5 | Apps für iOS (TestFlight) und Android, PWA | geplant |
| M6 | Erster veröffentlichter Release mit DOI und Erprobung im Testkreis; die Versionsnummer wird bei der Freigabe festgelegt | geplant |

Einzelheiten stehen in der [Spezifikation](docs/SPEZIFIKATION.md).

## Lizenz

- Code: [EUPL-1.2](LICENSE)
- Inhalte der Profilpakete im Ordner `profile/` (Arbeitsanweisungen, SOP, Kodierleitfaden, Schemata, Darstellungsdateien): [CC BY 4.0](LICENSE-CONTENT)

## Zitiervorschlag

Pereira Wolf, H. (2026). *KI-LEAD: Forschungsdemonstrator für die KI-gestützte Lageerfassung, -auswertung und -darstellung* (Version 0.4.16) [Software]. https://github.com/pereirawolf/ki-lead

Die Zitierangaben stehen maschinenlesbar in [CITATION.cff](CITATION.cff); GitHub zeigt sie unter „Cite this repository“ an. Eine DOI folgt mit dem ersten Release über Zenodo.

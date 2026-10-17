# KI-LEAD

Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und -darstellung) im Bevölkerungsschutz. Die App läuft vollständig auf dem Gerät (iPad, iPhone, Android, Browser). Netzverbindungen gibt es nur zu den KI-Schnittstellen von Anthropic (seit Meilenstein 2) und später OpenAI (Meilenstein 4).

**Stand: Meilenstein 3 (Lagebild).** Meldungen lassen sich nach einem hinterlegten Profil erfassen, öffnen, prüfen und als JSON, PDF oder Klartext-Kurzfassung ausgeben, mit KI-Unterstützung erstellen und im Modul Lagebild zusammenführen.

**Lagebild (M3):** Mehrere Meldungen (JSON-Dateien oder ZIP-Archive) werden nach dem Profil migriert und gegen das Schema geprüft; Meldungen in fremdem Schema werden erkannt und für die KI-Verdichtung vorgehalten. Ansichten: Übersicht mit Kennzahlen, Meldestatus aus `kontakte.json` (mit Erinnerungsmail) und Verteilungen; Meldungen; Sachverhalte nach Schwere; Lagenradar je Sachverhalt, bewusst ohne Mittelwert; Rohtabelle. Der **Redaktionscheck** prüft nach SOP-LEAD A.3 bis A.8: Zeitfenster „Handlungsrelevant bis:“ gegen die nächste Ausgabe, Zusammenhang und abweichende Bewertungen gleicher Ereignisarten mit Textbaustein, Fortschreibung, Nachlauf, Abschluss und mehrfache Meldungen derselben Stelle, fehlende Kernaussagen bei hoher Beurteilung, Quellen, Schema und Status. Ausgabe als Kopiervorlage für Word (Tabelle mit Radarbild), CSV (Semikolon, für Tabellenkalkulation in deutscher Einstellung) und PDF. Ein Knopf übergibt alle Meldungen an die KI-Erfassung zur Verdichtung. Das Beispielprofil bringt die fiktive Lage „Ilka“ zum Ausprobieren mit.

Die gestufte KI-Erfassung (M2):

1. **Auftrag und Material:** Sachverhalt, Stichworte, URLs, Dateien (TXT, MD, JSON, DOCX, PDF); eine Meldung als JSON gilt als Vormeldung zur Fortschreibung.
2. **S1 Gegenstand bestätigen:** Ein kleines Modell schlägt Gliederung, Ereignisarten und SOPs vor; die Person bestätigt oder korrigiert.
3. **S2 Recherche und Entwurf:** Ein mittleres Modell recherchiert mit Websuche und Seitenabruf nach den gewählten SOPs und schreibt den Entwurf.
4. **S3 Prüfung:** Die App prüft gegen das Schema und lässt Fehler höchstens zweimal ohne neue Recherche korrigieren. Der Entwurf geht in die Meldungsmaske; Freigabe bleibt Sache der Person.

**Verdichtung (vorläufig):** Erkennt die App unter den Dateien Meldungen anderer Stellen, auch in fremdem Schema, verdichtet sie diese zu einer eigenen Meldung: S1 gliedert nach Sachverhalten statt nach Stellen, ordnet die Eingangsmeldungen zu und schlägt den Meldezeitpunkt t0 vor; S2 kodiert das Radar für den eigenen Referenzraum neu (SOP-LEAD A.7). Die Websuche ist dabei standardmäßig aus. Die vollständige Verdichtung folgt mit Meilenstein 4.

**Management Summary:** Im Schritt „Prüfen & Exportieren“ fasst die KI die fertige Meldung zu einer einzigen Fassung für die Behördenleitung zusammen, lesbar in einer Minute: Kernaussage in einem Satz, je Sachverhalt ein Kurztitel mit Beurteilung und Tendenz, je Analysefeld höchstens zwei Sätze für die gesamte Lage und die früheste Frist. Beurteilung, Tendenz und Frist setzt die App aus der Meldung; sie entfernt Quellenverweise und weist auf zu lange Fassungen hin. Die Arbeitsanweisung steht in `anweisung-kurzfassung.md`. Ohne KI gibt es weiterhin einen Feldauszug als Klartext.

Jeder Lauf wird mit Prompts, Antworten, Token, Kosten und Dauer protokolliert und lässt sich als JSON exportieren. Für die KI-Erfassung braucht man einen eigenen API-Schlüssel von Anthropic (Einstellungen). Er bleibt im Browser des Geräts und geht nur an api.anthropic.com.

## Abgrenzung

KI-LEAD ist ein privates Forschungsvorhaben von Heiko Pereira Wolf ([ORCID 0009-0004-0014-7616](https://orcid.org/0009-0004-0014-7616)). Es ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Die mitgelieferten Profile, Schemata und Daten sind Beispiele für Forschung und Erprobung; sie geben keine offiziellen Vorgaben wieder. Der Demonstrator nutzt nur eigene oder veröffentlichte Materialien.

Bitte nur fiktive oder offen zugängliche Inhalte verwenden, keine personenbezogenen und keine eingestuften Daten.

## Grundidee

Auf jeder Ebene gilt dieselbe Systematik: Die Meldungen nachgeordneter und lateraler Stellen ergeben die eigene Meldung, die wiederum übergeordnete und laterale Stellen nutzen. Alles Organisationsspezifische steckt deshalb in einem austauschbaren **Profilpaket**. Die App selbst enthält nur die LEAD-Logik.

Ein Profilpaket enthält:

- `profil.json`: Manifest mit Name, Version, Ebene, Referenzraum und Variablen
- `meldung.schema.json`: das JSON-Schema der Meldung, unverändert aus der Organisation
- `meldung.ui.json`: Darstellung, also Schritte, Feldbezeichnungen, Hinweise, Radar-Stufentexte, Kennsätze und Quellenkategorien
- `anweisung-erfassung.md`: die Arbeitsanweisung für die KI, mit Platzhaltern
- `kodierleitfaden.md` sowie optional SOP-Dateien und Kontakte

Das Format ist in [docs/PROFILFORMAT.md](docs/PROFILFORMAT.md) beschrieben. Mitgeliefert werden das Beispielprofil `profile/lead-beispiel` (fiktive Koordinierungsstelle auf Bundesebene mit LEAD-Meldevorlage, Sammelmappe mit 17 SOP und Kodierleitfaden mit Lagenradar) und das schlanke `profile/muster`.

**Eigene Profile** legt man lokal in den Ordner `privat/profile/<name>/`. Der Ordner ist per `.gitignore` vom Repository ausgeschlossen. `npm run dev` lädt ihn mit; ein Produktionsbuild nur mit `KI_LEAD_PRIVAT=1 npm run build`. Alternativ importiert man ein Profil in der App als ZIP-Datei (`.leadprofil`). Kontaktadressen gehören in `kontakte.lokal.json`, das ebenfalls nicht eingecheckt wird.

## Ausprobieren

Jeder Push wird auf GitHub automatisch getestet und gebaut. Optional kann der Hauptzweig zusätzlich als Web-App auf GitHub Pages erscheinen (Einrichtung in `.github/workflows/pages.yml`). Die App läuft dann im Browser auf iPad, iPhone, Android und Desktop; alle Daten bleiben im Browser des jeweiligen Geräts.

## Entwicklung

Voraussetzung ist Node.js 22.

```
npm install
npm run dev        # Entwicklungsserver
npm test           # Tests (Kern, Profile, Übungsdaten, Referenzvergleich mit Ajv, Anbieter und Pipeline mit Attrappe)
npm run build      # Produktionsbuild nach dist/
```

Die Schemaprüfung der App kommt ohne Codeerzeugung aus und läuft daher unter einer strengen Content-Security-Policy. Die Tests vergleichen ihr Urteil mit Ajv als Referenz.

Testdaten: Im Ordner `profile/lead-beispiel/beispiele/orkantief-ilka` liegt der **fiktive** Datensatz Orkantief „Ilka“ mit sechs Ländermeldungen und der daraus verdichteten Meldung einer Koordinierungsstelle. Die Lage ist erfunden; keine Meldung stammt von den darin genannten Stellen (siehe `LIESMICH.md` dort). In der App lädt man ihn im Lagebild mit „Beispiel laden“. Eigene Testdaten unter `privat/testdaten/<satz>/` prüft `npm test` mit, wenn dort eine Datei `profil.txt` den Profilordner nennt.

## Fahrplan

| Meilenstein | Inhalt |
|---|---|
| M1 | Web-Kern ohne KI: Profile, Formular aus Schema, Prüfung, Import und Export |
| M2 | KI-Pipeline für die Erfassung (gestuft nach LEAD), Anthropic |
| M3 | Modul Lagebild: Zusammenführung und Redaktionscheck |
| M4 | KI-Verdichtung von Meldungen zur Meldung der nächsten Ebene; OpenAI |
| M5 | Apps für iOS (TestFlight) und Android, PWA |
| M6 | Release 0.1 mit DOI, Erprobung im Testkreis |

Einzelheiten stehen in der [Spezifikation](docs/SPEZIFIKATION.md).

## Lizenz

- Code: [EUPL-1.2](LICENSE)
- Inhalte der Profilpakete im Ordner `profile/` (Arbeitsanweisungen, SOP, Kodierleitfaden, Schemata, Darstellungsdateien): [CC BY 4.0](LICENSE-CONTENT)

## Zitiervorschlag

Pereira Wolf, H. (2026). *KI-LEAD: Forschungsdemonstrator für die KI-gestützte Lageerfassung, -auswertung und -darstellung* (Version 0.3) [Software]. https://github.com/pereirawolf/ki-lead

Die Zitierangaben stehen maschinenlesbar in [CITATION.cff](CITATION.cff); GitHub zeigt sie unter „Cite this repository“ an. Eine DOI folgt mit dem ersten Release über Zenodo.

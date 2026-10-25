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
| 0.4.15 | letzter Commit von Pull Request #12 „Korrekturen aus dem Code-Review vom 20.10.2026; 0.4.15“ |
| 0.4.16 | letzter Commit von Pull Request #13 „Redaktionscheck: Zeitlogik, Prüfstatus und Bedienung; 0.4.16“ |
| 0.4.17 | letzter Commit von Pull Request #14 „Farbschemata der Oberfläche und Datum vorn im Dateinamen; 0.4.17“ |
| 0.4.18 | letzter Commit von Pull Request #15 „Barrierefreiheit der Darstellung und Erfassungshilfen: Kontrastschemata, Systemfarben, Zeitfelder, Quellen-Baukasten; 0.4.18“ |
| 0.4.19 | letzter Commit von Pull Request #16 „S1: Aufwand, Ausgabegrenze, t0-Absicherung und Prüffrage-Vorschlag; 0.4.19“ |
| 0.4.20 | letzter Commit von Pull Request #18 „Aufräumen: SOP-Archiv in den Git-Verlauf, Beispielprofil 1.9.1“ (Nachtrag vom 21.10.2026: Beispielprofil 1.9.1, ohne Änderung der App; Stand der Version selbst: letzter Commit von Pull Request #17 „KI: Modell je Lauf wählen, Laufprotokoll schon nach S1; 0.4.20“) |
| 0.4.21 | letzter Commit von Pull Request #19 „Vorgaben nach der Testreihe der KI-Modelle; 0.4.21“ |
| 0.4.22 | letzter Commit von Pull Request #20 „Aufwand und Websuchen je Lauf, Automatisch = Neutral; 0.4.22“ |
| 0.4.23 | letzter Commit von Pull Request #21 „Tests konsolidieren und schärfen, Browsertests, Modellbewertung getrennt; 0.4.23“ |
| 0.4.24 | letzter Commit von Pull Request #22 „Manuelle LEAD-Eingabehilfen für Analysefelder und Bewertungstext; 0.4.24“ |
| 0.4.25 | letzter Commit von Pull Request #23 „S1: Ausgabegrenze 128 000 Token und verständlicher Abbruch an der Grenze; 0.4.25“ |
| 0.4.26 | letzter Commit von Pull Request #24 „Höchstzahl Ausgabetoken für jeden KI-Aufruf; 0.4.26“ |
| 0.4.27 | letzter Commit von Pull Request #33 „SOP B01/B02/B07/B09/B14 vertieft, Quellenregister, 40 Bewertungsfälle; Profil 1.20.0“ (Nachträge vom 21.10.2026: Beispielprofil 1.13.0 mit Pull Request #26, 1.14.0 mit #27, 1.15.0 mit #28, 1.16.0 mit #29, 1.17.0 mit #30, 1.18.0 mit #31, 1.19.0 mit #32 und 1.20.0 mit #33, außerdem 40 Bewertungsfälle unter `evaluation/` mit #33, jeweils ohne Änderung der App; Stand der Version selbst: letzter Commit von Pull Request #25 „Schätzung nach den Läufen vom 21.10.2026, SOP B15/C11 für Cyber-Vorsorgelagen; 0.4.27“) |
| 0.4.28 | letzter Commit des Pull Requests „Fortschreibung: Bearbeitungszeit, t0 und Rechercheauftrag von der App steuern; 0.4.28“ |
| 0.4.29 | letzter Commit des Pull Requests „PDF: Kennsatzzeilen ungeteilt, Pfeile lesbar; 0.4.29“ |
| 0.4.30 | letzter Commit des Pull Requests „Fortschreibung: Absender aus der eigenen Vormeldung, Hinweis zum Seitenabruf; 0.4.30“ (Nachtrag vom 22.10.2026: Beispielprofil 1.21.0 mit dem Pull Request „SOP-LEAD 3.12.0: Fachgrundlagen und Ebenenregel für die Steuerungsebene; Profil 1.21.0“ und 1.22.0 mit dem Pull Request „SOP-LEAD 3.13.0: Typologietabellen aus Fachgrundlagen in B07, B08, B11, B15, C10, C14, C17; Profil 1.22.0“, jeweils ohne Änderung der App) |
| 0.4.31 | letzter Commit von Pull Request #41 „Abnahme M4: technische Abnahme der Verdichtung“ |
| 0.5.0 | letzter Commit des Pull Requests „M5: installierbare PWA mit Offline-Start; 0.5.0“ |
| 0.5.1 | letzter Commit des Pull Requests „M5: native Projekte mit Capacitor, wählbare Ablage der API-Schlüssel; 0.5.1“ |
| 0.5.2 | letzter Commit des Pull Requests „PWA: Startfehler nach Update behoben, Reparaturseite; 0.5.2“ |
| 0.5.3 | letzter Commit des Pull Requests „Farbschemata: gleiche Hintergrundfarbe ober- und unterhalb des Identitätsbands; 0.5.3“ (Nachträge vom 23.10.2026: App-Symbole festgeschrieben, Favicon im Browser ergänzt, Python-Skript und Android-Vorlagentests entfernt; vom 24.10.2026: Grundlagendokumente zu Datenschutz, Sicherheit, KI-Verordnung und Barrierefreiheit, ohne Änderung der App) |
| 0.5.4 | letzter Commit des Pull Requests „KI-Kennzeichnung der Ausgaben und Lagenradar als Radiogruppe; 0.5.4“ (Nachtrag vom 24.10.2026: gestaffelte Prüfung und schnellere Tests, ohne Änderung der App) |
| 0.5.5 | letzter Commit des Pull Requests „Grundlagen Priorität 2: Drittkomponenten und Lizenzen, Erprobung, Impressum; 0.5.5“ |
| 0.5.6 | letzter Commit von Pull Request #53 „Mistral als dritter Anbieter, Einstellungen in Bereichen; 0.5.6“ (Nachtrag vom 24.10.2026: Radarerwartungen und Abwandlungen in Bewertungsfällen, Bewertungspläne, Mehrfachvergleich, ohne Änderung der App) |
| 0.5.7 | letzter Commit des Pull Requests „Mistral: Korrekturen nach dem ersten echten Lauf; 0.5.7“ (Nachtrag vom 24.10.2026: acht weitere fiktive Bewertungsfälle, ohne Änderung der App) |
| 0.5.8 | letzter Commit des Pull Requests „Vergleichslauf Ilka in den Einstellungen; 0.5.8“ |
| 0.5.9 | letzter Commit des Pull Requests „Lizenzen bestimmt, Vorlage – eigene Organisation; 0.5.9“ |
| 0.5.10 | letzter Commit des Pull Requests „Standard-Profile nach dem Vergleichslauf Ilka, Aufwand je Modell, Schätzung; 0.5.10“ |
| 0.5.11 | letzter Commit des Pull Requests „Folgereihe astra xhigh, Auswertung je Stufe, Plan anbietermix-ilka; 0.5.11“ (Nachträge vom 25.10.2026: Bewertungsmaßstab, fester S1-Gegenstand, Fälle zu Zählregeln und Bewertungspläne nach der Lernschleife; Musterfassung Ilka und Plan für die Management Summary; jeweils ohne Änderung der App) |
| 0.5.12 | letzter Commit des Pull Requests „Vergleichslauf Ilka: Umfang wählen, Musterfassung als Grundlage; 0.5.12“ |
| 0.5.13 | letzter Commit des Pull Requests „Prüffall Reparatur, Ergebnis Anbieter-Mix; 0.5.13“ |
| 0.5.14 | letzter Commit des Pull Requests „Plausibilität ohne Fehlalarme, Messwerte des Anbieter-Mix; 0.5.14“ |
| 0.5.15 | letzter Commit des Pull Requests „Mix-Profile, Reparatur mit Haiku, Ergebnisse MS und Prüffall Reparatur; 0.5.15“ |
| 0.5.16 | letzter Commit des Pull Requests „Nachreihen: Mistral-Reparatur mit Small, Klärungsbedarf in der MS; 0.5.16“ |
| 0.5.17 | letzter Commit des Pull Requests „Einstellungen: Modelle & Aufwand, Testläufe mit Archiv; Management Summary als eigener Schritt; 0.5.17“ |
| 0.5.18 | letzter Commit des Pull Requests „KI-Erfassung: verständliche Eingabefelder mit verknüpften Hilfetexten; 0.5.18“ |
| 0.5.19 | letzter Commit des Pull Requests „Recherche & Grenzen: Recherchetiefe, verständliche Felder, Höchstkosten; 0.5.19“ |
| 0.5.20 | letzter Commit des Pull Requests „Profilansicht übersichtlicher; 0.5.20“ |
| 0.5.21 | letzter Commit des Pull Requests „Kopfleiste: KI-Chip „KI offline/online“ statt Profil-Chip; 0.5.21“ |
| 0.5.22 | letzter Commit des Pull Requests „KI-Erfassung: Modelle und Recherche für diesen Lauf; 0.5.22“ |

## [0.5.22] – 25.10.2026

Grundlage: Vorschläge zu „KI-Erfassung → Auftrag und Material → Modelle für diesen Lauf“ vom 25.10.2026 im Anschluss an Pull Request #73, vom Herausgeber am selben Tag freigegeben (Punkte 1–10). Entschieden: Seitenabrufe und Lesemenge je Seite werden je Lauf wählbar (Punkt 8); die Vermerke zu den Modellen stammen aus den vergleichenden Testläufen (Punkt 4). Gespeicherte Einstellungen, Profile und Pipeline bleiben unverändert; neu ist nur, was ein einzelner Lauf abweichend wählen kann.

### Hinzugefügt

- **Angaben zu den Modellen** (`src/pipeline/modellkunde.ts`, Punkte 1 und 4): Anzeigenamen (z. B. „Opus 5.5“, „GPT-6 Luna“, „Mistral Small 4“), Kostenklasse nach dem Listenpreis der Ausgabetoken (bis 1 USD je Million niedrig, bis 12 mittel, bis 25 hoch, darüber sehr hoch) und Vermerke aus den Ergebnisberichten vom 25.10.2026: „im Test vorn“ (S1 GPT-6 Luna „hoch“, Verdichtung Opus „mittel“, Management Summary Sonnet „mittel“) und „im Test bewährt“ (u. a. S1 Haiku „hoch“, Verdichtung Sonnet „mittel“, Reparatur Haiku, GPT-6.1 Sol, Mistral Small und Medium „niedrig“). Für S2 Recherche und Entwurf gibt es noch keine Vergleichsläufe und daher keine Vermerke. Kennungen der Anbieter bleiben im Hilfetext und im Laufprotokoll.
- **KI-Profil für diesen Lauf** (Punkt 3): „Wie in den Einstellungen“, die Standard-Profile Anthropic, OpenAI und Mistral, die beiden Mix-Profile und „Einzeln anpassen“. Profile ohne nötigen Schlüssel sind gesperrt und nennen den fehlenden Schlüssel. Die Felder je Stufe erscheinen erst bei „Einzeln anpassen“.
- **Recherchetiefe für diesen Lauf** (Punkt 8): „Wie in den Einstellungen“, die übrigen Stufen („Sparsam“, „Standard“, „Gründlich“) und „Eigene Werte“ mit allen drei Feldern (Websuchen, ganz gelesene Seiten, Lesemenge je Seite) wie unter „Recherche & Grenzen“: Beschriftungen und verknüpfte Hilfetexte, Prüfung getippter Werte (ein geleertes Feld behält den Wert, Bereiche und ganze Zahlen), Umrechnung der Lesemenge, „Seiten nie kürzen“, Wirkung je Anbieter und Höchstkosten für das S2-Modell. Felder ohne Wirkung beim S2-Modell sind gesperrt (z. B. Lesemenge bei OpenAI); mit Mistral über den EU-Endpunkt entfällt die Wahl mit Hinweis. `ModellWahl` und `mitModellwahl` kennen dafür `abrufMax` und `abrufMaxTokens`.
- **Hinweis auf zusätzliche Anbieter** (Punkt 5): Schickt der Lauf Inhalte an einen Anbieter, der nach den Einstellungen keine bekäme, sagt das ein Hinweis direkt im Block.
- **Schätzung je Stufe und Anpassungshinweis** (Punkt 6): Unter dem Aufwand stehen ein Hilfetext und die voraussichtliche Dauer und Kosten der Stufe; passt die App die Stufe beim Modellwechsel an, nennt sie den Grund („Aufwand auf „hoch“ gesetzt: Mistral Small 4 bietet „mittel“ nicht an.“).
- **Zurücksetzen und Weg zu den Vorgaben** (Punkt 10): „Alles wie in den Einstellungen“ und „Vorgaben dauerhaft ändern“ (öffnet „Einstellungen → Modelle & Aufwand“). Abweichende Stufen und die Recherchetiefe tragen das Kennzeichen „abweichend“ und einen Rand in der Aktionsfarbe (bei erzwungenen Farben in Systemfarben).

### Geändert

- **Kopfzeile** (Punkte 1 und 2): Titel „Modelle und Recherche für diesen Lauf“ (bei nur einer Stufe „Modell für diesen Lauf“), Anzeigenamen statt Kennungen, Recherchetiefe und Schätzung des ganzen Laufs, z. B. „S1 Haiku 5.5 (hoch) · S2 Opus 5.5 (mittel) · Recherche Standard (bis 15 Websuchen) · ≈ 3–9 Minuten, 1,40–2,33 USD“; „abweichend“ als Kennzeichen statt Satz.
- **Auswahllisten** (Punkt 4): „Wie in den Einstellungen: …“ statt „Standard: …“; Modelle ohne Schlüssel sind gesperrt statt nur gekennzeichnet; je Modell Kostenklasse und Vermerk; der Hilfetext nennt Anbieter, Kennung, Listenpreis und Befund aus den Testläufen. Eine Wahl im Feld bleibt stehen, auch wenn sie den Einstellungen gleicht; ein KI-Profil setzt nur, was abweicht.
- **S3 Reparatur** (Punkt 7) steht unter „Weitere Stufe“ (zugeklappt, außer bei abweichender Wahl) und in der Kopfzeile nur, wenn abweichend.
- **Reihenfolge im Auftrag** (Punkt 9): Ein Rahmen enthält zuerst den Schalter „Websuche und Seitenabruf erlauben“, dann die Wahl für diesen Lauf, dann Recherchezeile und Schätzung; die Bestätigung zur Datenweitergabe folgt danach. Vor S2 enthält der Rahmen die Schätzung für S2.
- Das Eingabefeld der Recherchetiefe ist als `src/ui/GrenzFeld.tsx` ausgelagert und dient Einstellungen und Wahl je Lauf gemeinsam. Unter „Recherche & Grenzen“ heißt es im Hilfetext der Websuchen jetzt „In der KI-Erfassung lassen sich die drei Werte je Auftrag ändern.“
- `zuEinstellungen` der KI-Erfassung nimmt den Bereich der Einstellungen an (ohne Angabe wie bisher „KI-Anbieter & API“).
- Spezifikation 0.5.22 (Abschnitt 5.1, offener Punkt 17), `docs/TESTS.md`.

### Tests

- `tests/ui/modellwahl.test.ts` (11 Tests, vorher 3): Anzeigenamen, Kostenklasse, Vermerk und gesperrte Modelle in der Auswahl; Mistral mit Anpassungshinweis und Schätzung je Stufe; Aufwand und Recherchetiefe je Lauf bis S2, geleertes Feld behält den Wert; Kopfzeile mit Schätzung ohne S3, Rahmen vor der Bestätigung, S3 unter „Weitere Stufe“; „ohne Recherche“; Kennzeichnung, Zurücksetzen und Weg zu „Modelle & Aufwand“; KI-Profile gesperrt ohne Schlüssel, Mix-Profil mit Hinweis auf OpenAI und Wirkung im Lauf, Rückkehr zu den Einstellungen; Stufe „Gründlich“ mit Höchstkosten; gesperrte Felder bei OpenAI und Wegfall bei Mistral EU.
- `tests/pipeline/modellkunde.test.ts` (neu): Anzeigenamen, Grenzen der Kostenklassen, Vermerke nur nach den Berichten, Verweis auf vorhandene Berichte.
- `tests/pipeline/einstellungen.test.ts`: Recherchewerte je Lauf mit Bereichen und „abweichend“ nur bei Recherche.

## [0.5.21] – 25.10.2026

Grundlage: Entscheidung des Herausgebers vom 25.10.2026 zur Kopfleiste. An der prominenten Stelle rechts oben steht nur, ob gerade eine KI-Anfrage läuft. Lagezentren wechseln ihr Profil selten; Laufzeit und Kosten zeigt die KI-Erfassung; der Entwurfsstatus steht in Maske, Dateiname und PDF.

### Hinzugefügt

- **KI-Chip rechts oben** (`src/ui/KiSymbol.tsx`) in den Farben des Profils. In Ruhe „KI offline“: zarte Fläche, Rand und Schrift in der Aktionsfarbe. Solange eine KI-Anfrage läuft und noch nicht beendet ist (S1 oder S2 mit S3, in jeder Ansicht), „KI online“: Fläche in der Aktionsfarbe mit einem pulsierenden Ring; kein Logo oder Symbol. Nach S1 wartet die Erfassung auf die Bestätigung; der Chip steht dann wieder auf „KI offline“. Ein Klick führt zur KI-Erfassung.
- **Barrierefreiheit:** Der zugängliche Name beginnt mit dem sichtbaren Text und nennt die Stufe („KI online: Anfrage läuft, S2 Recherche und Entwurf. Zur KI-Erfassung“); Wechsel werden über eine unsichtbare Statusregion angesagt. Der Zustand ist am Text erkennbar, nicht nur an Farbe oder Bewegung; bei „Bewegung reduzieren“ entfällt der Ring; bei erzwungenen Farben ist „KI online“ in Systemfarben hervorgehoben. Gleiche Breite für beide Texte, damit die Kopfleiste beim Wechsel nicht springt.
- Die KI-Erfassung meldet über `laufStand` nur die laufende Stufe (keine Neuzeichnung der App beim Streaming).
- Tests: `tests/ui/kisymbol.test.ts`, `tests/browser/kisymbol.spec.ts`.

### Entfernt

- **Profil-Chip in der Kopfleiste.** Das Profil wird unter „Profile“ gewählt und dort als „✓ In Verwendung“ gekennzeichnet. Tests erkennen das geladene Profil am KI-Chip (`.kopf-ki`) bzw. an `data-profil` der Kopfleiste.

### Geändert

- Spezifikation 0.5.21 (Abschnitt 5.1), `docs/TESTS.md`.

## [0.5.20] – 25.10.2026

Grundlage: Vorschläge zur Übersichtlichkeit der Seite „Profile“, vom Herausgeber am 25.10.2026 freigegeben (Punkte 1–4 im ersten, 5–8 im zweiten Schritt). Nur Oberfläche (`src/ui/Profile.tsx`, `src/styles.css`): keine Änderung an Profilen, Profilformat, Prüfung, Aktivierung oder gespeicherten Daten. Die Profilansicht bleibt eine reine Leseansicht; aktiviert wird weiter nur über „Verwenden und Meldung öffnen“.

### Geändert

- **Verwendetes Profil zuerst und offen** (Punkt 1): Die Karte des verwendeten Profils steht oben und zeigt ihren Inhalt vollständig. Die übrigen Profile erscheinen als kompakte Zeile mit Name, Profilversion, Herkunft und „Verwenden und Meldung öffnen“; ihr Inhalt liegt hinter „Angaben, Lesetexte und Prüfung“. Ein Sprung zum Prüfbericht öffnet den zugeklappten Inhalt mit.
- **Fachliche und technische Angaben getrennt** (Punkt 2): Oben stehen Ebene, Referenzraum, SOPs und Bausteine und Herausgeber; Schema, Lizenz und Prüfsumme stehen unter „Prüfen“.
- **Zwei Gruppen „Lesen“ und „Prüfen“** (Punkt 3): „Lesen“ enthält „Arbeitsanweisungen und Kodierleitfaden lesen“ (vorher ohne „lesen“), „SOP-Katalog lesen“ und „Dokumentation lesen“ mit einem gemeinsamen Hinweis, dass Lesen nichts verändert; „Prüfen“ enthält die technischen Angaben, den Prüfbericht und die Dateiliste.
- **Kopf in einem Satz** (Punkt 4): Die Begriffserklärung „Profilversion = … · Tag an einer SOP = … · Prüfsumme = …“ entfällt im Kopf; Profilversion und Prüfsumme erklärt ein Satz unter „Prüfen“, das Tag an einer SOP ein Satz im SOP-Katalog.
- **Menü „Profil hinzufügen“** (Punkt 5): „Profilpaket importieren (ZIP)“ und „Ordner wählen“ stehen in einem Menü statt als zwei Knöpfe im Kopf. Menüs folgen dem Disclosure-Muster (Knopf mit `aria-expanded`, Liste gewöhnlicher Knöpfe), schließen nach der Auswahl, mit Escape (Fokus zurück auf den Knopf), beim Klick außerhalb und beim Verlassen mit dem Fokus; auf schmalen Bildschirmen richtet sich die Liste am linken Rand des Knopfs aus.
- **Menü „Mehr“ je Karte** (Punkt 6): „Als Paket exportieren“ und bei importierten Profilen „Entfernen“ stehen im Kopf der Karte unter „Mehr“ (zugänglicher Name „Mehr zu Profil „…““); der Kartenfuß entfällt.
- **Befundstatus als Chip** (Punkt 7): Am Titel steht immer ein Chip, der zum Prüfbericht führt: „✓ Geprüft“ ohne Fehler und Warnungen, sonst die Zahl („1 Fehler, 1 Warnung“) in der Farbe der schwersten Stufe. Bisher erschien nur bei Fehlern oder Warnungen ein Textverweis.
- **Sprungleiste in der Karte** (Punkt 8): „Angaben“, „Lesen“ und „Prüfen“ als Sprungverweise, die beim Scrollen unter dem Kopf der App stehen bleiben; der Sprung setzt den Fokus auf die Überschrift. Die fachlichen Angaben stehen dafür unter einer eigenen Überschrift „Angaben“. Die Höhe des Kopfs misst die Ansicht (`--kopf-hoehe`), weil er je nach Breite ein- oder zweizeilig ist.
- Spezifikation 0.5.20 (Abschnitt 4.6), `docs/TESTS.md`.

### Tests

- `tests/ui/profile.test.ts` (neu, 12 Tests): Reihenfolge mit dem verwendeten Profil zuerst, kompakte Zeilen mit zugeklapptem Inhalt, Aktivieren nur über den Knopf, Trennung fachlicher und technischer Angaben, Gruppen und Bezeichnungen, Sprung zum Prüfbericht eines zugeklappten Profils, Kopf in einem Satz; Menü „Profil hinzufügen“ mit Dateiauswahl, Escape mit Fokusrückgabe, Menü „Mehr“ mit „Entfernen“ nur bei importierten Profilen, Befund-Chip je Stufe, Sprungleiste mit Fokus auf der Überschrift.

## [0.5.19] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz-recherchegrenzen_2026-W43.json` (anlassbezogene Prüfung von Einstellungen → „Recherche & Grenzen“, Commit e5c974b), Befunde KP-2026-W43-69 bis -76, vom Herausgeber am 25.10.2026 freigegeben. Leitziel: IT-fachfremde Personen entscheiden über Gründlichkeit und Kosten der Recherche statt über technische Stellgrößen. Gespeichert werden weiter nur `websucheMax`, `abrufMax` und `abrufMaxTokens`; keine neue Einstellung, keine Umstellung der Fassung der gespeicherten Einstellungen, keine Änderung an der Pipeline (S2 erhält dieselben Grenzen).

### Hinzugefügt

- **Recherchetiefe** (KP-2026-W43-69, `src/ui/Einstellungen.tsx`, Logik in `src/pipeline/recherchetiefe.ts`): Auswahl „Sparsam“ (5 Websuchen, 3 Seiten, 8.000 Token je Seite), „Standard“ (Vorgaben der App: 15, 10, 15.000), „Gründlich“ (30, 20, 30.000) und „Eigene Werte“. Die Stufe ergibt sich aus den gespeicherten Werten; die Zahlenfelder erscheinen nur bei „Eigene Werte“. **Die Werte von „Sparsam“ und „Gründlich“ sind vorläufig** (Entscheidung des Herausgebers vom 25.10.2026) und über einen Testlauf zu prüfen.
- **Höchstkosten** (KP-2026-W43-72): Zeile unter der Auswahl mit den Höchstkosten für Suchen und Seitenlesen nach Listenpreis, berechnet für das S2-Modell (Opus 5.5: Sparsam etwa 0,15 USD, Standard 0,75 USD, Gründlich 2,70 USD); OpenAI mit Gebühren je Werkzeugaufruf, Mistral mit dem Hinweis, dass die Zahl der Suchen nicht begrenzt ist, über den EU-Endpunkt ohne Recherche.
- **Umrechnung der Lesemenge** (KP-2026-W43-71): „≈ rund 7.500 Wörter, etwa 19 Druckseiten“ für 15.000 Token (grobe Annahme: 0,5 Wörter je Token, 400 Wörter je Druckseite).
- **Wirkung je Anbieter am Feld** (KP-2026-W43-73) für die Anbieter der S2-Modelle; bei OpenAI zählen die Seiten zur gemeinsamen Höchstzahl mit den Suchen, bei Mistral wird die Zahl der Suchen nur gezählt. Die Liste „Unterschiede der Anbieter“ bleibt.

### Geändert

- **Beschriftungen und Hilfetexte** (KP-2026-W43-70): „Websuchen je Recherche (höchstens)“, „Seiten vollständig lesen je Recherche (höchstens)“ und „Lesemenge je Seite (höchstens, in Token)“ statt „Höchstzahl Websuchen je Lauf“, „Höchstzahl Seitenabrufe je Lauf“ und „Höchstlänge je abgerufener Seite (Token)“; Hilfetexte zwischen Beschriftung und Eingabe, mit Umrechnung, Vermerk und Korrekturhinweis per `aria-describedby` verknüpft.
- **Ein geleertes Feld schaltet nichts mehr ab** (KP-2026-W43-74): Werte gelten sofort, wenn sie gültig sind; ein leeres Feld behält beim Verlassen den bisherigen Wert und sagt, wie die Websuche bzw. der Seitenabruf abzuschalten ist. Bisher wurde ein geleertes Feld sofort als 0 gespeichert.
- **Bereiche werden durchgesetzt** (KP-2026-W43-75): Websuchen und Seiten 0–50, Lesemenge 1.000–100.000, ganze Zahlen; Abweichungen werden beim Verlassen des Feldes korrigiert und benannt. Bisher wurden eingetippte Werte wie 500 oder 2,5 unverändert gespeichert.
- **„Seiten nie kürzen“** (KP-2026-W43-76): eigenes Kästchen mit Kostenhinweis statt der Eingabe 0, die bei der Lesemenge „ohne Grenze“ hieß, bei den anderen Feldern aber „aus“. Gespeichert wird weiter 0; abgewählt gilt der Standard 15.000.
- **Akzentband:** doppelt so dick (8 statt 4 px). Ist eine Bandfarbe dieselbe Farbe wie der Kopf darüber oder der Seitengrund darunter (in zehn Länderschemata das Weiß), tönt die App beide ganz leicht in der Aktionsfarbe, damit das Weiß im Band sichtbar bleibt (`bandAbheben` in `src/darstellung/thema.ts`). Neutral- und Kontrastschemata bleiben unverändert; alle Kontrastregeln gelten weiter ([docs/farbschemas.md](docs/farbschemas.md)). (PR #72, bis zu dieser Version „Unveröffentlicht“)
- Spezifikation 0.5.19 (Abschnitt 5.4, offener Punkt 16), `docs/TESTS.md`.

### Tests

- `tests/pipeline/recherchetiefe.test.ts` (neu): Werte und Bereiche der Stufen, Stufe aus gespeicherten Werten, Prüfung getippter Werte (leer, Höchst- und Mindestwerte, Komma, keine Zahl), Umrechnung, Höchstkosten je Anbieter und Stufe, Wirkung je Anbieter (KP-2026-W43-69 bis -76).
- `tests/ui/recherchetiefe.test.ts` (neu): Auswahl der Stufen, „Eigene Werte“, Beschriftungen und verknüpfte Beschreibungen, Höchstkosten, geleertes Feld, Begrenzung beim Verlassen, Kästchen „Seiten nie kürzen“.
- `tests/darstellung/farbschemas.test.ts` (+5): Tönung genau bei den Schemata mit Weiß im Band, Neutral- und Kontrastschemata sowie Gelb auf Weiß unverändert, Kontrastregeln mit Tönung, Profilfarben mit weißer Akzentfarbe, Bandstärke 8 px.

## [0.5.18] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz-eingabemaske_2026-W43.json` (anlassbezogene Prüfung der Eingabemaske der KI-Erfassung, Commit ab361f1), Befunde KP-2026-W43-61 bis -68, vom Herausgeber am 25.10.2026 freigegeben. Leitziel: Nutzende erkennen ohne Kenntnis der LEAD-Systematik, welche Angabe in welches Feld gehört; das Erkenntnisinteresse ist die Perspektive der Recherche, keine zu klärende Frage. Nur Oberfläche: Speicherung, Prüfung, Übergabe an S1/S2 und die Bezeichnungen im Prompt bleiben unverändert (`src/pipeline/` und `profile/` unberührt); bei gleichen Eingaben ist die Anfrage an die KI dieselbe.

### Geändert

- **Auftrag und Material** (`src/ui/KiErfassung.tsx`): „Sachverhalt und Erkenntnisinteresse“ heißt „Untersuchungsgegenstand und Erkenntnisinteresse“ (KP-2026-W43-61), „Stichworte“ heißt „Ausgangsinformationen und Stichworte“ (KP-2026-W43-62), „URLs (eine je Zeile)“ heißt „Webseiten (eine Adresse je Zeile)“ (KP-2026-W43-63); alle drei mit Hilfetext, die ersten beiden mit neuen Beispielen als Platzhalter (nie als Feldwert). Sind Adressen eingetragen und Websuche und Seitenabruf ausgeschaltet, sagt ein zusätzlicher Hinweis am Feld, dass die Seiten nicht abgerufen werden (KP-2026-W43-63, Entscheidung des Herausgebers).
- **Stichtag** (KP-2026-W43-64): Die Gruppe heißt „Stichtag der Meldung“ statt „Meldezeitpunkt (t0)“; die Eingaben heißen „Stichtag“ und „Uhrzeit (optional)“ (vorher „Meldestichtag“ und „Uhrzeit t0“), der Hilfetext beschreibt die Eingabe statt der Ableitung von t0. Der Begriff t0 erscheint erst bei „Gegenstand bestätigen“, wo er erläutert wird.
- **Besondere Prüffrage** (KP-2026-W43-65): Hilfetext („Ein einzelner Punkt … oder ein gewünschter Beobachtungszeitraum“) und Beispiel als Platzhalter.
- **Gegenstand bestätigen:** „Gegenstand“ heißt „Untersuchungsgegenstand und Erkenntnisinteresse“, mit dem Hinweis, dass die Recherche sich nach diesem Text richtet (KP-2026-W43-66); Hilfetexte für „Betrachtungshorizont“ (KP-2026-W43-67) und „Bezug zum Referenzraum“ mit dem Referenzraum des aktiven Profils (KP-2026-W43-68).
- **Barrierefreiheit:** Hilfetexte stehen zwischen Beschriftung und Eingabe und sind per `aria-describedby` verknüpft, nicht Teil des zugänglichen Namens; Beschriftungen als `<label for>` (Komponente `HilfeFeld`, Texte in `TEXT_FELD`). Abstände in `src/styles.css` (`.feld-hilfe`, `.feld-zusatz`).

### Tests

- `tests/ui/ki-erfassung-felder.test.ts` (neu): Beschriftung, verknüpfter Hilfetext und Platzhalter je Feld, leere Feldwerte, bedingter Hinweis zu Webseiten ohne Websuche, Name der Stichtagsgruppe, Referenzraum des Beispielprofils im Hilfetext (KP-2026-W43-61 bis -68).
- `tests/pipeline/auftragsfelder.test.ts` (neu): Die Anfrage an S1 nennt weiter „Sachverhalt und Erkenntnisinteresse“, auch bei leerem Feld; Stichworte und Übersicht der Ausgangsquellen unverändert (KP-2026-W43-61, -62).
- Browsertests: `barrierefreiheit.spec.ts` prüft die Hilfetexte als zugängliche Beschreibung; `hauptablauf.spec.ts`, `abbruch.spec.ts` und `pwa-update.spec.ts` suchen das Feld unter der neuen Beschriftung.

## [0.5.17] – 25.10.2026

Grundlage: Vorschlag zur Neugliederung von „Einstellungen → Modelle & Verarbeitung“ und der Management Summary, vom Herausgeber am 25.10.2026 freigegeben (ein Formular für alle Testläufe, Begriff „Testlauf“ in Oberfläche, Dateinamen und Doku, Archiv bis zum Löschen, Schritt der Management Summary von der App angefügt). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, KI-Profilen, gespeicherten Einstellungen, Reihenformaten oder der Ablage der Schlüssel.

### Hinzugefügt

- **Bereich „Testläufe“ in den Einstellungen** (`src/ui/Testlaeufe.tsx`, vorher `Vergleichslauf.tsx` und `ReparaturPrueffall.tsx`): Vergleichslauf Ilka und Prüffall Reparatur in einem Formular. „Was wird getestet?“ mit sechs Testarten; der Prüffall ist jetzt „S3 Reparatur (aus Musterfassung)“, „MS (aus Musterfassung)“ heißt „Management Summary (aus Musterfassung)“. Ein Startknopf („Testlauf starten“), eine Ergebnisanzeige, einheitlich „Anzahl der Läufe“ (S3 Reparatur: Vorgabe 2, höchstens 5; ein Lauf umfasst alle fünf Defekte). Die Konfiguration „Aktuelle Einstellungen (Modelle & Aufwand)“ ersetzt den Verweis „Tabelle oben“. Die Erklärung des Testfalls ist aufklappbar; fehlt ein Schlüssel, führt ein Knopf zu „KI-Anbieter & API“.
- **Archiv der Testläufe** (`src/speicher/testlaufarchiv.ts`): Jeder Testlauf mit mindestens einem Ergebnis, auch ein abgebrochener, bleibt mit seiner ZIP-Datei in einer eigenen IndexedDB-Datenbank (`ki-lead-testlaeufe`), bis er gelöscht wird. Liste mit den jüngsten zuerst (Zeitpunkt, Testart, Konfiguration, Läufe, Kosten, Größe, App-Version) und Gesamtbelegung; Herunterladen je Eintrag; „Ausgewählte löschen“, „Alle auswählen“ und „Alle löschen“ mit Rückfrage. Scheitert das Ablegen, kommt die ZIP-Datei trotzdem, mit Hinweis.
- **Management Summary als fünfter Schritt der Meldung** (`src/ui/Meldung.tsx`): Die App fügt für jedes Profil nach „Prüfen & Exportieren“ den Schritt „Management Summary“ an (Titel aus `kurzfassung.titel`); KI-Fassung, Hinweis bei geänderter Meldung und Feldauszug ohne KI ziehen vollständig dorthin. „Prüfen & Exportieren“ behält Prüfung, Übersicht und JSON-/PDF-Ausgabe. Das Profilformat ändert sich nicht.

### Geändert

- **„Modelle & Verarbeitung“ heißt „Modelle & Aufwand“** und enthält nur noch die Wahl von KI-Profil, Modell und Aufwand, dazu einen Verweis auf die Testläufe. Aus „Voreinstellung“ wird „KI-Profil“ („KI-Profil Anthropic“, „KI-Profil OpenAI“, „KI-Profil Mistral“, „KI-Profil Mix: …“), aus „Individuelle Modellkonfiguration“ „Eigene Kombination“, auch in der Übersicht. Jede Option zeigt eine Kurzzeile, die Modelle je Aufgabe nur die gewählte; die Tabelle steht unter „Modell und Aufwand je Aufgabe“.
- **Dateinamen der ZIP-Dateien:** `KI-LEAD_Testlauf_Ilka_…` statt `KI-LEAD_Vergleichslauf_Ilka_…`, `KI-LEAD_Testlauf_Ilka_S3-Reparatur_…` statt `KI-LEAD_Prueffall_Reparatur_…`; erste Zeile im LIESMICH „KI-LEAD – Testlauf Ilka: …“. Reihenformate (`ki-lead-abnahme/1`, `ki-lead-kurzfassung-reihe/1`, `ki-lead-reparaturtest/1`), Code-Bezeichner und `npm run vergleichslauf:auswerten` bleiben; das Skript erkennt ZIP-Dateien an der Endung und liest alte wie neue.
- Spezifikation 0.5.17 (Abschnitte 5.1 und 5.4), Datenschutzhinweise 1.5 (Archiv der Testläufe, Löschen), `docs/TESTS.md`, `evaluation/README.md`.

### Tests

- `tests/ui/testlaeufe.test.ts` (vorher `vergleichslauf.test.ts`, mit `reparaturprueffall.test.ts` zusammengeführt): sechs Testarten, Wechsel der Anzahl zwischen Kette und S3 Reparatur, Varianten des Plans `reparatur-ilka` je Testart, neue Dateinamen und LIESMICH; Archiv mit Reihenfolge, nachträglichem Herunterladen, Löschen ausgewählter und aller Einträge nach Rückfrage, Fehler beim Ablegen.
- `tests/ui/meldung-schritte.test.ts` (neu): fünf Schritte im Beispielprofil und in der Vorlage, Management Summary nur im eigenen Schritt, ohne doppelte Überschrift.
- `tests/ui/einstellungen.test.ts`: sieben Bereiche, KI-Profil mit Kurzzeile und Modellen nur bei der gewählten Option, „Modelle & Aufwand“ ohne Testläufe mit Sprung zu „Testläufe“.
- Browsertests: `tests/browser/testlaeufe.spec.ts` (vorher `vergleichslauf.spec.ts` und `reparaturprueffall.spec.ts`) mit Archiv in der echten IndexedDB über ein Neuladen hinweg; `einstellungen.spec.ts` mit sieben Bereichen; `hauptablauf.spec.ts` mit dem Schritt „Management Summary“.
- `tests/support/speicher.ts`: Attrappe von idb-keyval mit `createStore`.
- `tests/pipeline/vergleichslauf.test.ts`, `vergleichslauf-umfang.test.ts`, `reparaturtest.test.ts`: neue Dateinamen und Titel der Testart „Management Summary (aus Musterfassung)“; `tests/ui/ueber.test.ts` folgt der Version 0.5.17.

## [0.5.16] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_nachreihen_2026-W43.json` (Nachreihen vom 25.10.2026 mit App 0.5.15, Commit c045584), Befunde AV-2026-W43-39 bis -42, vom Herausgeber am 25.10.2026 freigegeben. Ergebnisse als Nachträge in `evaluation/abnahmen/2026-10-25-reparatur-ilka-ergebnis.md` und `2026-10-25-management-summary-ilka-ergebnis.md`.

### Geändert

- **Reparatur Mistral wieder mit Small** (AV-2026-W43-39): Mit der Anweisung seit 0.5.15 reparierten mistral-small-2603 und mistral-medium-3-5 im Nachtest je 10/10 fehlerfrei; das Standard-Profil Mistral repariert wieder mit `mistral-small-2603` „niedrig“ (0,008 statt 0,10 USD je Fall).
- **Gespeicherte Einstellungen, Fassung 5:** Wer dem Mistral-Standard aus 0.5.15 folgt, folgt danach dem heutigen; eine abweichende Wahl bleibt (Entscheidung zu AV-2026-W43-39).
- **Beispielprofil 1.28.0** (AV-2026-W43-40): Arbeitsanweisung Kurzfassung 2.3.0, „Klärungsbedarf:“ nur bei einem wesentlichen Widerspruch der Meldung, nie für offene Prüfaufgaben oder Fristen; gleichlautend in der Standardfassung der App. SOP-Sammelmappe 3.17.2 (nur Gültigkeitsstand).
- **Vorprüfung der Management Summary** (AV-2026-W43-41, `src/pipeline/kurzfassungsreihe.ts`): neues Merkmal `klaerungsbedarf` (Kernaussage beginnt mit „Klärungsbedarf“) in Reihendatei, CSV und Auffälligkeiten; die Auffälligkeit zur Länge nennt „höchstens 180“ statt „Richtwert bis 180“.
- **Ergebnisse** (AV-2026-W43-42): Nachträge in beiden Ergebnisberichten; Spezifikation 0.5.16, Abschnitt 5.4 und offener Punkt 6.

### Tests

- `tests/pipeline/einstellungen.test.ts`: Umstellung Fassung 4 → 5 mit dem Mistral-Standard aus 0.5.15, Erhalt abweichender Wahl (AV-2026-W43-39).
- `tests/evaluation/kurzfassung-pruefung.test.ts`: Kennsatz „Klärungsbedarf“ nur am Anfang der Kernaussage, als Auffälligkeit benannt (AV-2026-W43-41).
- `tests/pipeline/kurzfassung.test.ts`: Arbeitsanweisung und Standardfassung beschränken „Klärungsbedarf“ auf Widersprüche (AV-2026-W43-40).
- Erwartungen an das Reparaturmodell Mistral in den Tests von Einstellungen und Vergleichslauf zurück auf Small.

## [0.5.15] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_profilauswahl_2026-W43.json` (Auswertung der Management Summary und des Prüffalls Reparatur vom 25.10.2026, Commit dbef59e), Befunde AV-2026-W43-31 bis -38, vom Herausgeber am 25.10.2026 freigegeben; AV-2026-W43-37 angepasst (Erfassung OpenAI auf „hoch“ statt nur Hinweis). Ergebnisse: `evaluation/abnahmen/2026-10-25-management-summary-ilka-ergebnis.md` und `2026-10-25-reparatur-ilka-ergebnis.md`.

### Hinzugefügt

- **Mix-Profile** (AV-2026-W43-31, löst AV-2026-W43-30 ab): unter „Modelle & Verarbeitung → Voreinstellung“ zwei weitere Profile neben den Standard-Profilen, „Mix: OpenAI S1 + Anthropic Opus“ (Plan-Variante M1) und „Mix: OpenAI S1 + Anthropic Sonnet“ (M2): S1 gpt-6-luna „hoch“, S2 Erfassung und Verdichtung Opus bzw. Sonnet „mittel“, Reparatur Haiku „niedrig“, Management Summary Sonnet „mittel“. Die Auswahl nennt die nötigen Schlüssel und den Datenweg an beide Anbieter. Keine Vorgabe der App (`MIX_PROFILE`, `mixProfilAnwenden`, `mixProfilAktiv` in `src/pipeline/einstellungen.ts`).
- **Prüffall Reparatur, Kennzahl „Stellen wie Original“** (AV-2026-W43-35): je Fall `stellen_wie_original`, in der Summe die Zahl solcher Fälle, Spalte in der Übersicht, Zeile im LIESMICH und in der Ergebnistabelle der App. Ein leerer Wert zählt nicht als Originalwert. Reihendateien vor 0.5.15 bleiben lesbar.

### Geändert

- **Reparatur Anthropic mit Haiku** (AV-2026-W43-32): App-Vorgabe und Standard-Profil Anthropic reparieren mit `claude-haiku-5-5` „niedrig“ statt Sonnet. Im Vergleichslauf folgt die Reparatur weiter dem Standard-Profil des S2-Anbieters und ist damit für Anthropic ebenfalls Haiku.
- **Reparatur Mistral mit Medium 3.5** (AV-2026-W43-33): Standard-Profil Mistral repariert mit `mistral-medium-3-5` „niedrig“ statt Small.
- **Erfassung OpenAI „hoch“** (AV-2026-W43-37): wie die Verdichtung; die Erfassung folgt in allen Profilen der Verdichtung (abgeleitet, nicht gemessen).
- **Gespeicherte Einstellungen, Fassung 4:** Wer genau einem Standard-Profil bis 0.5.14 folgt, folgt beim nächsten Start dem heutigen; eine abweichende Wahl bleibt (Entscheidung zu AV-2026-W43-32).
- **Anweisung der Reparatur** (AV-2026-W43-34, `reparaturSystem()` in `src/pipeline/stufen.ts`): Ein unzulässiger Radarwert, eine Beurteilung, Tendenz oder Ereignisart übernimmt den Wert aus der Begründung desselben Sachverhalts, sonst den Leerwert, nie den Skalenrand; nicht beanstandete Textfelder bleiben unverändert.
- **Beispielprofil 1.27.0** (AV-2026-W43-36): Arbeitsanweisung Kurzfassung 2.2.0 mit 180 Wörtern als Obergrenze und Kürzungsregel; SOP-Sammelmappe 3.17.1 (nur Gültigkeitsstand).
- **Pläne** (AV-2026-W43-38): `management-summary-ilka` mit Variante F (mistral-large-4 „hoch“), `reparatur-ilka` mit Variante R-F (mistral-medium-3-5 „niedrig“), jeweils als Fassung 2 im Hinweis vermerkt; Ergebnisberichte beider Pläne.
- **Management Summary der App** (Standardfassung für Profile ohne eigene Arbeitsanweisung, Hinweis bei Überlänge): „höchstens 180“ statt „Toleranz bis 180“, gleichlautend mit der Arbeitsanweisung (AV-2026-W43-36).
- **Schätzung:** Messwerte der Management Summary je Modell im Kommentar von `schaetzeKurzfassung()`; alle in den Spannen (AV-2026-W43-38).
- Spezifikation 0.5.15: Abschnitt 5.4 (Voreinstellung, Prüffall Reparatur), offener Punkt 6. Datenschutzhinweise 1.4: ein Lauf kann mehrere Anbieter nutzen.

### Tests

- `tests/pipeline/einstellungen.test.ts`: Mix-Profile vollständig und mit angebotenen Stufen, Anwenden und Erkennen invers, Umstellung der Fassung 3 je Anbieter und Erhalt abweichender Wahl (AV-2026-W43-31 bis -33, -37).
- `tests/pipeline/stufen.test.ts`: Anweisung der Reparatur nennt Begründung, Leerwert und Verbot von Skalenrand und Kürzung (AV-2026-W43-34).
- `tests/pipeline/reparaturtest.test.ts`: `stellenWieOriginal` mit Originalwert, Skalenrand und leerem Wert; Summe, Übersicht und LIESMICH (AV-2026-W43-35).
- `tests/ui/einstellungen.test.ts`: Auswahl eines Mix-Profils mit Hinweis auf zwei Schlüssel (AV-2026-W43-31).
- Erwartungen an das Reparaturmodell der Standard-Profile in den Tests von Vergleichslauf und Einstellungen angepasst; Browsertest `tests/browser/reparaturprueffall.spec.ts` mit Haiku als Vorgabe und „Stellen wie Original“.

## [0.5.14] – 25.10.2026

Grundlage: Befunddatei `ki-lead-befund_mixauswertung_2026-W43.json`, vom Herausgeber am 25.10.2026 entschieden: AV-2026-W43-27, -28 und -29 freigegeben; zu AV-2026-W43-30 keine Voreinstellung, M1 und M2 bleiben für weitere Testläufe im Vergleichslauf. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, Standard-Profilen, gespeicherten Einstellungen oder der Ablage der Schlüssel.

### Geändert

- **Plausibilitätsprüfung, Summen** (AV-2026-W43-27, `summanden()` in `src/pipeline/plausibilitaet.ts`): Ein Komma zwischen zwei Ziffern trennt keine Summanden mehr. Behebt den Fehlalarm in M1-8o79 („Haushaltsfaktor 1,9“ als Summe 10).
- **Plausibilitätsprüfung, D2** (AV-2026-W43-28, `d2Pruefen()`): Eine genannte Stufengrenze („Grenze zu 4 ist 10.000 Personen“, „die Schwelle liegt bei …“) zählt nicht als Personenzahl; „Summe der drei amtlichen Werte (20.700)“ gilt als ausdrücklich genannte Summe. In M2-67tj nennt der Befund damit die Summe 20.700 (Stufe 4 bei D2 = 3) statt der Stufengrenze. Über alle 27 Läufe der Vergleichsreihen A–G, M1 und M2 bleiben drei Treffer: die beiden aus dem Plan `standardprofile-ilka` (E-2hu5, F-7ngp) und M2-67tj.
- **Schätzung** (AV-2026-W43-29): Kommentare zu S1 gpt-6-luna „high“ und zur Verdichtung mit Opus und Sonnet „medium“ nennen die Läufe von M1 und M2; die Werte bleiben, weil alle Messungen in den Spannen liegen.
- Spezifikation 0.5.14: Abschnitt 5.4 (Plausibilität), offener Punkt 6 (Entscheidung zu AV-2026-W43-30); Nachtrag im Ergebnisbericht `anbietermix-ilka`.

### Tests

- `tests/pipeline/plausibilitaet.test.ts` (+1): Sätze aus M1-8o79 und M2-67tj, Aufzählung mit Komma, Stufengrenzen ohne Befund (AV-2026-W43-27, -28).
- `tests/pipeline/schaetzung.test.ts`: Messwerte von M1 und M2 als festes Soll in den Spannen (AV-2026-W43-29).

### Befundregister

- `evaluation/befunde/befundregister.json`: AV-2026-W43-27 bis -29 als umgesetzt, -30 als abgelehnt (keine Voreinstellung; M1 und M2 bleiben als Plan-Varianten).

## [0.5.13] – 25.10.2026

Grundlage: Vergleichsläufe Ilka nach dem Plan `anbietermix-ilka` (M1 und M2, je drei Läufe, App 0.5.10), vom Herausgeber am 25.10.2026 als ZIP-Dateien übergeben, und seine Freigabe vom selben Tag, die Läufe gegen A auszuwerten und einen Prüffall für S3 Reparatur anzulegen; Befunddatei `ki-lead-befund_mixauswertung_2026-W43.json` (AV-2026-W43-25 Wiedervorlage, -26 bis -30 neu). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Meldungsschemata, Standard-Profilen, gespeicherten Einstellungen oder der Ablage der Schlüssel. Laufprotokolle und Entwürfe sind nicht im Repository.

### Hinzugefügt

- **Prüffall Reparatur** (AV-2026-W43-25) unter „Einstellungen → Modelle & Verarbeitung“, nach dem Vergleichslauf Ilka (`src/pipeline/reparaturtest.ts`, `src/ui/ReparaturPrueffall.tsx`): Die App beschädigt die Musterfassung Ilka an festen Stellen (R1 Radarwert 7, R2 Beurteilung „hoch“, R3 Ereignisart „Orkan“, R4 Radarwert als Text, R5 alle drei ersten zugleich), spielt sie als Antwort von S2 ein (S1 fest nach Zuschnitt A; S1 und S2 ohne KI-Aufruf und ohne Kosten) und lässt S3 wie im normalen Lauf reparieren, höchstens zweimal. Vorher läuft der unbeschädigte Entwurf als Soll ohne Reparatur durch. Je Fall: schemakonform danach, Zahl der Reparaturen, Anteil der übrigen Inhalte, die unverändert bleiben, Werte an den beschädigten Stellen (unbeschädigt, präpariert, repariert), Kosten, Dauer und Ausgabetoken von S3. Reparaturmodell aus den Einstellungen oder als Variante des Plans `reparatur-ilka`; 1 bis 5 Durchgänge (Vorgabe 2); grobe Kostenschätzung nach Listenpreisen ohne Messwert; ZIP mit `reihe.json` (`ki-lead-reparaturtest/1`), `uebersicht.csv`, Laufprotokollen und reparierten Entwürfen.
- **Fall** `ilka-reparatur` und **Plan** `reparatur-ilka` (AV-2026-W43-25): fünf Reparaturmodelle, je „low“: Sonnet und gpt-6.1-sol (Standard-Profile Anthropic und OpenAI), mistral-small-2603 (Standard-Profil Mistral), Haiku und gpt-6-luna (günstigste Modelle); je zwei Durchgänge, Budget 10 USD, Prüfsummen von Musterfassung und S1-Gegenstand. `fall.schema.json`: `auftrag.reparatur`; `plan.schema.json`: Variante mit `reparatur`.
- **Ergebnisbericht** [evaluation/abnahmen/2026-10-25-anbietermix-ilka-ergebnis.md](evaluation/abnahmen/2026-10-25-anbietermix-ilka-ergebnis.md) (AV-2026-W43-26): Beide Mischungen mit gpt-6-luna „hoch“ in S1 gliedern wie die Redaktionsfassung in einen Sachverhalt und liegen in den Kennzahlen vor A und B; M1 (Opus) trifft Beurteilung und Tendenz 3/3 bei 1,48–1,54 USD und 354–377 s je Lauf, M2 (Sonnet) hat die kleinste Achsenabweichung (0,13) bei 0,69–0,77 USD und 279–306 s. Erste getrennte Messung der Wirkung von S1 auf dieselbe Verdichtung (A gegen M1, B gegen M2). Beide Plausibilitätsbefunde sind Fehlalarme (AV-2026-W43-27, -28, zur Entscheidung vorgelegt).

### Geändert

- **Gestaffelte Prüfung** (Folge von AV-2026-W43-25): Dateien unter `evaluation/`, die die App beim Build einbindet (Fall und Pläne des Vergleichslaufs, Plan und Material des Prüffalls), lösen die Kern-Browsertests aus (`IN_DER_APP` in `scripts/pruefumfang.mjs`, eingeführt mit 0.5.12): `plaene/reparatur-ilka.json` ergänzt; der Wächter prüft zusätzlich, dass jede Regel mindestens eine eingebundene Datei trifft.
- Spezifikation 0.5.13: Abschnitt 5.4 (Prüffall Reparatur), offener Punkt 6 (Ergebnis des Mix); `evaluation/README.md`, `evaluation/faelle/README.md`.

### Offen

- AV-2026-W43-27, -28 (Fehlalarme der Plausibilitätsprüfung), -29 (Lauf-IDs der Mix-Reihen in der Schätzung) und -30 (Voreinstellung „KI-Anbieter-Mix“), zur Entscheidung vorgelegt.

### Tests

- `tests/pipeline/reparaturtest.test.ts` (neu, 6): Defekte an festen Stellen, Musterfassung unverändert; Inhaltsvergleich ohne die beschädigten Stellen; jeder Defekt löst genau eine Reparatur aus, S1 und S2 ohne Anbieter, Inhalte voll erhalten, Laufprotokoll; Reparatur, die Inhalte verändert oder scheitert; Übersicht, Dateiname und ZIP; Plan, Einstellungen der Variante und Schätzung.
- `tests/ui/reparaturprueffall.test.ts` (neu, 3): Abschnitt nach dem Vergleichslauf mit Vorgabe aus den Einstellungen und zwei Durchgängen, fünf Varianten mit Mistral-Endpunkt und fehlendem Schlüssel, Ablauf mit Attrappe und ZIP.
- `tests/browser/reparaturprueffall.spec.ts` (neu): ein Durchgang mit simuliertem Anthropic-Anbieter, fünf Anfragen nur für S3, ZIP-Datei.
- `tests/evaluation/schemata.test.ts` (3 angepasst): Pläne mit fester Meldung oder festem S1-Gegenstand schließen `reparatur-ilka` ein; Fall mit `auftrag.reparatur`.
- `tests/ci/pruefumfang.test.ts` (+2): eingebundene Dateien unter `evaluation/` lösen die Kern-Browsertests aus, mit Wächter über die Importe in `src/`.

### Befundregister

- `evaluation/befunde/befundregister.json`: AV-2026-W43-25 und -26 als umgesetzt; -27 bis -30 bleiben offen.

## [0.5.12] – 25.10.2026

Grundlage: Auftrag des Herausgebers vom 25.10.2026, die Musterfassung Ilka (`evaluation/material/ilka-musterfassung.json`) unter „Einstellungen → Modelle & Verarbeitung“ als Grundlage für separate Vergleichsläufe zu nutzen, mit wählbarem Umfang. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, Standard-Profilen, gespeicherten Einstellungen, der Ablage der Schlüssel oder am Ablauf der KI-Erfassung außerhalb des Vergleichslaufs; Musterfassung und Zuschnitt sind unverändert (Prüfsummen wie in den Plänen).

### Hinzugefügt

- **Umfang des Vergleichslaufs Ilka** (`src/pipeline/vergleichsumfang.ts`): Radiogruppe „Was wird getestet?“ mit fünf Umfängen.
  - **S1 (aus Rohdaten):** nur S1 aus den sechs Eingängen; Prüfpunkte T1, T2, T4–T6 bezogen auf S1 und den Vorschlag; Vergleich mit dem Zuschnitt der Musterfassung (`s1_vergleich`: Zahl der Sachverhalte, Gliederung und Zuordnung der Eingänge wie die Musterfassung, Abdeckung der SOPs, zusätzliche und fehlende SOPs, Befunde wie beim festen Gegenstand). ZIP mit `s1/<lauf>.s1.json`, Übersicht je Sachverhalt des Vorschlags.
  - **S1 + S2 (aus Rohdaten):** wie die ganze Kette, aber ohne KI-Aufrufe in S3 (Option `ohneS3` von `stufe2und3`: keine Vervollständigung einer abgeschnittenen Antwort, keine Reparatur); Nachbearbeitung, Schema- und Quellenprüfung laufen, ein Schemafehler bleibt stehen (T3 nicht erfüllt).
  - **S1 + S2 + S3 (aus Rohdaten):** die ganze Kette wie bis 0.5.11; Vorgabe, Dateiname unverändert.
  - **S2 + S3 (aus Musterfassung):** der Zuschnitt der Musterfassung (`evaluation/material/ilka-s1-zuschnitt-a.json`) als fester S1-Gegenstand in jedem Lauf; Plan `s2-isoliert-ilka` jetzt auch in der App.
  - **MS (aus Musterfassung):** Management Summary mit der Musterfassung als einziger Eingabe (`src/pipeline/kurzfassungsreihe.ts`), ein Aufruf je Lauf über `kurzfassungErstellen`; Reihendatei `ki-lead-kurzfassung-reihe/1` mit Text, Struktur, Hinweisen der App, Vorprüfung und Auffälligkeiten in Worten; ZIP mit Übersicht, Texten und Protokollen (Prompt, Rohantwort, Token, Dauer, Kosten); Plan `management-summary-ilka` jetzt auch in der App. Die Vorprüfung ist Beobachtung für die Prüfung von Hand, keine Bewertung.
- **Musterfassung in der App** (`musterDatenEingebaut` in `src/pipeline/vergleichslauf-eingebaut.ts`): Musterfassung und Zuschnitt als Text eingebettet und vor dem ersten Aufruf gegen die Prüfsummen der Pläne `management-summary-ilka` und `s2-isoliert-ilka` geprüft; bei Abweichung bricht der Lauf ab und nennt den fortzuschreibenden Plan.
- **Schätzung der Management Summary** (`schaetzeKurzfassung`): grob über den Listenpreis (rund 12 000 Eingabetoken, Ausgabe nach Aufwand), ohne Dauer, gekennzeichnet als „grob, ohne Messwert“; EU-Aufschlag von Mistral eingerechnet.

### Geändert

- **Konfiguration je Umfang:** Die Auswahl zeigt nur die Bewertungspläne, die zum Umfang passen (Rohdaten: `standardprofile-ilka`, `anbietermix-ilka`; S2 + S3: `s2-isoliert-ilka`; MS: `management-summary-ilka`), und je Variante nur die genutzten Stufen. Eine gewählte Variante fällt weg, wenn ihr Plan nicht zum neuen Umfang passt. Konfigurationszeilen, Schlüsselprüfung, Schätzung, Fortschritt, Ergebnistabelle, LIESMICH und Dateiname (`…_S1_…`, `…_S1-S2_…`, `…_S2-S3-Muster_…`, `…_MS-Muster_…`) folgen dem Umfang.
- **Reihendatei** `ki-lead-abnahme/1` mit Feld `umfang` (ältere Dateien ohne Feld gelten als ganze Kette, mit `s1_fest` als „S2 + S3“), je Lauf `s1_vergleich`, wenn S1 lief; Übersicht der Entwürfe mit Spalte `umfang` am Ende. `PlanVariante` nennt S1, S2 und Management Summary jeweils optional; `einstellungenFuerVariante` übernimmt nur, was die Variante nennt.
- **Auswertung mehrerer Reihen** (`npm run vergleichslauf:auswerten`): Schlüssel der Konfiguration mit dem Umfang, wenn er nicht die ganze Kette ist; Kennung mit „@s1-s2“ (und „@s2-s3“ ohne Variante); Reihen im Umfang „S1“ werden mit Hinweis auf `s1_vergleich` abgewiesen.
- **Skript** `evaluation/abnahmen/kurzfassung.lauf.ts` nutzt dieselbe Reihe wie die App (`quelle: "skript"`, Budget des Plans) und schreibt zusätzlich die ZIP-Datei; die Vorprüfung liegt in `src/pipeline/kurzfassungsreihe.ts`, `evaluation/abnahmen/kurzfassung.pruefung.ts` verweist darauf.
- **Gestaffelte Prüfung** (`scripts/pruefumfang.mjs`): Dateien unter `evaluation/`, die die App einbettet (Fälle, Pläne und Material des Vergleichslaufs, darunter jetzt die Musterfassung), gelten nicht mehr als reiner Inhalt und lösen die Kern-Browsertests aus (`IN_DER_APP`).
- Hinweise der Pläne `s2-isoliert-ilka` und `management-summary-ilka` nennen den Weg über die App; Bewertungshilfe der Musterfassung, `evaluation/README.md`, Spezifikation 0.5.12 (Abschnitt 5.4), `docs/TESTS.md`.

### Tests

- `tests/pipeline/vergleichslauf-umfang.test.ts` (neu, 14): Umfänge und Rollen, Pläne je Umfang und Übernahme aus Varianten, Umfang gegen festen Gegenstand, eingebettete Musterfassung und Zuschnitt mit Prüfsummen der Pläne, Abbruch bei abweichender Prüfsumme, S1 mit Prüfpunkten, Vergleich zum Zuschnitt (Soll von Hand), ZIP und Übersicht, S1 + S2 ohne Reparatur und ohne Vervollständigung gegenüber der ganzen Kette mit Reparatur, S2 + S3 ohne S1-Aufruf, Management Summary mit Vorprüfung, Fehler, Abbruch, Mistral-Endpunkt und ZIP, Schätzung, Auswertung mit Umfang.
- `tests/ui/vergleichslauf.test.ts` (+5): Radiogruppe mit fünf Umfängen und Vorgabe, Konfigurationszeilen und Pläne je Umfang, Variante gilt nur für ihre Umfänge, Ablauf S1, MS und S2 + S3 mit Attrappe und ZIP-Datei.
- `tests/pipeline/vergleichslauf.test.ts` (1 angepasst): vier Pläne in `VERGLEICHS_PLAENE`, für die Rohdaten weiter zwei.
- `tests/ci/pruefumfang.test.ts` (+4): eingebettete Musterfassung und Bewertungsplan lösen die Kern-Browsertests aus, anderes Material nicht; Wächter für jeden Import aus `evaluation/` unter `src/`.
- Browsertest `tests/browser/vergleichslauf.spec.ts` unverändert (Vorgabe „S1 + S2 + S3“, Dateiname und Ergebniszeile wie bisher).

## [0.5.11] – 25.10.2026

Grundlage: Folgereihe des Vergleichslaufs Ilka mit gpt-6-astra „xhigh“ (drei Läufe, App 0.5.10) und Auftrag des Herausgebers vom 25.10.2026, die App danach zu aktualisieren und die beste Kombination aus Modell und Aufwand je Stufe als Vergleichslauf startbar zu machen; Befunddatei `ki-lead-befund_anbietermix_2026-W43.json` (AV-2026-W43-20 bis -25). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, Standard-Profilen, gespeicherten Einstellungen oder der Ablage der Schlüssel.

**Nachtrag vom 25.10.2026 (Befunde LS-2026-W43-14 bis -19 der Lernschleife, ohne Änderung der App):** Grundlage: Befunddatei `ki-lead-befund_testdatennutzung_2026-W43.json` zur produktiven Nutzung der 18 Vergleichsläufe, vom Herausgeber am 25.10.2026 freigegeben, mit Antworten auf die Entscheidungsfragen.

- **Bewertungsmaßstab Ilka** (LS-2026-W43-14): Der Muss-Punkt zu den Stromlosen in `orkantief-ilka-verdichtung` und `sop-verdichtung-ilka-vergleich` bindet die Zusammenführung an die Zählregeln der Arbeitsanweisung Verdichtung (Regeln 3 und 4); eine begründete Nichtaggregation erfüllt ihn ebenso. Neu: [Bewertungshilfe Ilka](evaluation/bewertungshilfen/orkantief-ilka.md) 1.0 (Entwurf zur fachlichen Abnahme) mit Beleglage und zulässigen Wegen für die Stromlosen, Einstufung offener Achsen (begründet offen, begründet gesetzt, unzureichend begründet) und Tendenz. Keine Radar-Sollwerte; die Redaktionsfassung bleibt unverändert. Datierter Nachtrag im Ergebnisbericht.
- **Fester S1-Gegenstand** (LS-2026-W43-15): `einLauf` und `vergleichsreihe` (`src/pipeline/vergleichslauf.ts`) nehmen wahlweise einen bestätigten S1-Gegenstand (`s1Fest`), geprüft mit `s1FestPruefen` gegen t0 und Eingänge des Falls; S1 entfällt, T5 prüft dann nur die Vermerke an S2, Datei und Prüfsumme stehen in Lauf und Reihendatei (`s1_fest`). Nur über das Abnahmeskript (`KI_LEAD_S1_FEST`, dazu `KI_LEAD_AUFWAND_S1`, `KI_LEAD_AUFWAND_S2`, `KI_LEAD_VARIANTE`); die App nutzt es nicht. `plan.schema.json` um `s1_fest` (Datei unter `evaluation/material/`, sha256) ergänzt. Neu: Gegenstand `evaluation/material/ilka-s1-zuschnitt-a.json` (Zuschnitt wie Bezug A, zwei Sachverhalte; vom Herausgeber noch fachlich zu bestätigen) und Plan [`s2-isoliert-ilka`](evaluation/plaene/s2-isoliert-ilka.json) mit sechs Varianten der Verdichtung (Budget 25 USD, Durchführung nur auf Auftrag). Der Bericht der Auswertung sagt, dass die Zahl der Sachverhalte S1 misst, oder nennt die Prüfsumme des festen Gegenstands.
- **Abdeckung bei anderem Zuschnitt** (LS-2026-W43-16): Prüfliste der Kernbefunde in der Bewertungshilfe, Abschnitt C; `npm run vergleichslauf:auswerten` nennt je Lauf die Sachverhalte ohne Gegenstück in der Redaktionsfassung (`ohne_gegenstueck`).
- **Fälle zu den Zählregeln** (LS-2026-W43-17): `zaehlregel-hochrechnung`, `-mittelbar`, `-teilmenge`, `-laenderzuordnung` und `-fortgeltung` mit Material unter `evaluation/material/`, vier davon mit Radarerwartung für D2; Personen gegenüber Anschlüssen decken vorhandene Fälle ab. Soll-Abdeckung fortgeschrieben (Stand 25.10.2026, 53 Fälle).
- **Nacharbeit messen** (LS-2026-W43-18): `bewertungsschema.json` um die optionalen Felder `korrekturen` (nach Art), `bearbeitungsdauer_min`, `verbleibende_unsicherheiten` und `verblindung` („blind“, „teilweise“, „offen“; nicht „blind“ bei `blind: false`) ergänzt; vorhandene Bewertungen bleiben gültig. Neu: [Plan Blindbewertung Ilka](evaluation/plaene/2026-10-25-blindbewertung-ilka.md) mit zwei Bewertenden und dem zweiten Lauf je Variante A–F.
- **Kontrollsatz** (LS-2026-W43-19): [Verfahren für Entwicklungs- und Kontrollsatz](evaluation/plaene/2026-10-25-kontrollsatz.md); der Kontrollsatz wird neu verfasst und bis zum Kontrolllauf zurückgehalten.
- Tests: `tests/pipeline/vergleichslauf.test.ts` (+8): fester Gegenstand im Repository passt zum Fall und zu den SOPs des Profils, fünf unbrauchbare Gegenstände, Lauf ohne S1-Aufruf mit allen Prüfpunkten, Abbruch vor jedem Modellaufruf. `tests/pipeline/vergleichsauswertung.test.ts` (+2): Sachverhalte ohne Gegenstück, Hinweis zu S1. `tests/evaluation/schemata.test.ts` (+4): Muss-Punkt beider Ilka-Fälle, `s1_fest` im Planschema, Prüfsumme der Datei, optionale Felder der Bewertung.
- Dokumente: [evaluation/README.md](evaluation/README.md) (Muss-Punkte, Zuschnitt und Abdeckung), [evaluation/faelle/README.md](evaluation/faelle/README.md), [docs/TESTS.md](docs/TESTS.md).

**Nachtrag vom 25.10.2026 (Musterfassung Ilka und Management Summary, ohne Änderung der App):** Grundlage: Auftrag des Herausgebers vom 25.10.2026, aus den Testläufen zu Ilka eine Referenzfassung als Muster zu konsolidieren und als Ausgangsfall für die Management Summary der KI-Profile zu hinterlegen; ZIP-Dateien der Varianten A–G (21 Läufe).

- **Musterfassung** `evaluation/material/ilka-musterfassung.json` (LEAD-Meldung-v1, zwei Sachverhalte wie Bezug A): Grundlage Lauf 20261024-234833-ikph, abgeglichen mit allen 21 Läufen und den sechs Eingängen; Sachsen-Anhalt im Stromausfall-Sachverhalt, Hochrechnung als Bandbreite, zwei ergänzte Prüfaufträge. Herkunft, Änderungen und Vorbehalte: [evaluation/bewertungshilfen/ilka-musterfassung.md](evaluation/bewertungshilfen/ilka-musterfassung.md) (Entwurf zur fachlichen Abnahme). Die Redaktionsfassung im Beispielprofil bleibt unverändert.
- **Fall** `ilka-management-summary` und **Plan** `management-summary-ilka` (fünf Varianten: Sonnet, Opus und Haiku, gpt-6.1-sol, Mistral Medium 3.5; je drei Läufe, Budget 5 USD, nur auf Auftrag). `fall.schema.json`: `auftrag.kurzfassung` und Materialrolle `meldung`; `plan.schema.json`: `meldung_fest` (Datei und Prüfsumme) und je Variante `kurzfassung`; `bewertungsschema.json`: Variante mit `kurzfassung` und Material `meldung`.
- **Skript** `evaluation/abnahmen/kurzfassung.lauf.ts` (`KI_LEAD_ANBIETER`, `KI_LEAD_MODELL_KURZFASSUNG`, `KI_LEAD_AUFWAND_KURZFASSUNG`, `KI_LEAD_VARIANTE`, `KI_LEAD_LAEUFE`; Trockenlauf mit `KI_LEAD_ATTRAPPE=1`) mit Vorprüfung `kurzfassung.pruefung.ts` (Wortzahl, Kurztitel, Mindestwert, ungekennzeichnete Hochrechnung, Nachbetankung als erledigt, Marker); Ergebnisse unter `privat/kurzfassung-ilka/`.
- Tests: `tests/evaluation/musterfassung.test.ts` (6): Schema, Quellen, Pflichtangaben, Plausibilität, Zuschnitt, Herkunft jeder mehrstelligen Zahl. `tests/evaluation/kurzfassung-pruefung.test.ts` (8). `tests/evaluation/schemata.test.ts` (+1): Prüfsumme der festen Meldung, Fall und Plan verweisen auf dieselbe Datei.
- Dokumente: [evaluation/README.md](evaluation/README.md), [evaluation/faelle/README.md](evaluation/faelle/README.md), [docs/TESTS.md](docs/TESTS.md).

### Hinzugefügt

- **Bewertungsplan** `evaluation/plaene/anbietermix-ilka.json` (AV-2026-W43-23): M1 S1 gpt-6-luna „hoch“ mit S2 claude-opus-5-5 „mittel“, M2 S1 gpt-6-luna „hoch“ mit S2 claude-sonnet-5-5 „mittel“; Reparatur nach dem S2-Anbieter (Sonnet „niedrig“); je drei Läufe, Budget 10 USD; Bezug Variante A des Plans `standardprofile-ilka`.
- **Vergleichslauf mit mehreren Plänen** (AV-2026-W43-24): Die Auswahl „Konfiguration“ zeigt je Bewertungsplan eine Gruppe (`VERGLEICHS_PLAENE`, Wert „<Plan>/<Kennung>“) mit einer kurzen Erklärung des gewählten Plans; Reihendatei und Dateiname nennen die Variante.
- **Messwert** gpt-6-astra „xhigh“ in der Verdichtung (AV-2026-W43-20): 330–540 s, 0,90–2,30 USD (gemessen 333–418 s, 0,93–1,84 USD); Lauf-IDs der Folgereihe auch beim S1-Eintrag gpt-6-luna „high“.
- **Nachtrag im Ergebnisbericht** [evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md](evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md) (AV-2026-W43-21, -22): Folgereihe „xhigh“ (kommt Anthropic nicht näher als „high“; Standard-Profil OpenAI bleibt) und Auswertung je Stufe: S1 am besten mit gpt-6-luna „hoch“, S2 mit Opus „mittel“ vor Sonnet „mittel“, S3 nicht bewertbar (in keinem Lauf nötig).

### Geändert

- Kommentar zu `STANDARD_PROFILE` nennt die Folgereihe „xhigh“ (AV-2026-W43-21).
- Spezifikation 0.5.11: Abschnitt 5.4 (Pläne im Vergleichslauf), offener Punkt 6; `evaluation/README.md`.

### Offen

- AV-2026-W43-25: Prüffall für S3 Reparatur (Wahl des Reparaturmodells), zur Entscheidung vorgelegt.

### Tests

- `tests/pipeline/vergleichslauf.test.ts` (+1): Plan `anbietermix-ilka`, Varianten über „Plan/Kennung“, Reparatur nach dem S2-Anbieter (AV-2026-W43-23, -24).
- `tests/ui/vergleichslauf.test.ts` (+1, 1 angepasst): beide Pläne in der Auswahl, Mix-Variante M1 mit Anbietern je Stufe und fehlendem OpenAI-Schlüssel (AV-2026-W43-24).
- `tests/pipeline/schaetzung.test.ts`: Messwerte der Folgereihe in den Spannen, Spanne gpt-6-astra „xhigh“ (AV-2026-W43-20).

### Befundregister

- `evaluation/befunde/befundregister.json`: AV-2026-W43-20 bis -24 als umgesetzt; AV-2026-W43-25 bleibt offen.

## [0.5.10] – 25.10.2026

Grundlage: Auswertung der Vergleichsläufe Ilka nach dem Bewertungsplan `standardprofile-ilka` (Varianten A–F, je drei Läufe, App 0.5.8, Profil 1.26.0), vom Herausgeber am 25.10.2026 als ZIP-Dateien übergeben; Befunddatei `ki-lead-befund_anbietervergleich_2026-W43.json` (AV-2026-W43-12 bis -19 neu, Wiedervorlage von AV-2026-W43-01 bis -03, -05, -06, -09 und -10 aus `ki-lead-befund_anbieter_2026-W43.json`), vom Herausgeber am selben Tag wie empfohlen freigegeben. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, gespeicherten Einstellungen oder der Ablage der Schlüssel. Laufprotokolle und Entwürfe sind nicht im Repository.

### Hinzugefügt

- **Ergebnisbericht** [evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md](evaluation/abnahmen/2026-10-25-standardprofile-ilka-ergebnis.md) (AV-2026-W43-12): Rahmen, Konfigurationen, Prüfpunkte T1–T8 (18 von 18 erfüllt), Kosten und Dauer je Lauf (zusammen 18,33 USD), Kennzahlen, Abstand zum Bezug mit Kontrollrechnung der Zuordnung, Plausibilitätsbefunde mit Fehlalarmquote (1 von 3), Muss-Punkte, Vorbehalte, Entscheidungen.
- **Aufwand je Modell** (AV-2026-W43-01, `src/anbieter/aufwand.ts`): Tabelle der Stufen, die jedes Modell anbietet (Anthropic und OpenAI alle fünf, Mistral nur „niedrig – ohne Nachdenken“ und „hoch – mit Nachdenken“; Quelle und Stand im Kommentar). Einstellungen und die Wahl je Lauf zeigen je Modell nur diese Stufen; der Hinweistext unter der Tabelle der Einstellungen ist entsprechend gekürzt.
- **Wirksame Stufe** (AV-2026-W43-02, `aufwandFuer`): Eine Stufe, die das wirksame Modell nicht anbietet, gilt als die nächsthöhere angebotene, ohne höhere als die nächstniedrigere (Mistral: „mittel“, „sehr hoch“, „maximal“ → „hoch“). S1, S2, S3, Management Summary, Schätzung, Vergleichslauf und Laufprotokoll verwenden sie; das Protokoll nennt damit die tatsächlich gesendete Stufe. Beim Modellwechsel passt die Auswahl eine nicht angebotene Stufe sichtbar an. Gespeicherte Einstellungen bleiben unverändert. An die Mistral-API gehen wie bisher nur `none` und `high` (`mistralAufwand`).
- **Messwerte** in `src/pipeline/schaetzung.ts` (AV-2026-W43-05, -15): neu gpt-6-astra „high“ (240–420 s, 1,50–2,15 USD), mistral-small-2603 „high“ in S1 (10–50 s, bis 0,02 USD), mistral-medium-3-5 „high“ (90–240 s, 0,20–0,45 USD) und mistral-large-4 „high“ (150–270 s, 0,10–0,25 USD) in der Verdichtung; Sonnet „medium“ in der Verdichtung erweitert auf 150–480 s und 0,55–1,25 USD, gpt-6-astra „medium“ ab 60 statt 90 s. Kommentare mit den Lauf-IDs des Vergleichslaufs statt der Werte der Abnahme M4; Rundungsregel im Kopfkommentar (nach außen gerundet, Obergrenze bei neuen oder überschrittenen Spannen größter Messwert plus 25 %, keine Verengung). Mistral-Werte ohne EU-Aufschlag.

### Geändert

- **Standard-Profil OpenAI** (AV-2026-W43-13): Verdichtung mit gpt-6-astra „hoch“ statt „mittel“ (Variante D näher an Anthropic als C in Radarabstand, Tendenz und Ähnlichkeit); Erfassung bleibt „mittel“. Gespeicherte Einstellungen mit dem bisherigen Profil gelten danach als individuelle Konfiguration.
- **Standard-Profil Mistral** (AV-2026-W43-03, -14): Aufwand „hoch“ statt „mittel“ für S1, S2 und Management Summary (an die API ging schon bisher `high`); Verdichtung weiter mit mistral-medium-3-5 (Variante E näher an Anthropic als Large 4). Begründung beider Wahlen mit zweitbester Option im Kommentar zu `STANDARD_PROFILE`.
- **App-Vorgabe der Verdichtung** (AV-2026-W43-10): Opus statt Sonnet, gleich dem Standard-Profil Anthropic; gilt für Profile ohne eigene Modellvorgabe (z. B. die Vorlage).
- **EU-Aufschlag in der Schätzung** (AV-2026-W43-06): Der Aufschlag von 10 % am EU-Endpunkt von Mistral ist Eigenschaft der Preisregel (`aufschlag` in `src/anbieter/preise.ts`); Ist-Kosten des Mistral-Anbieters und `schaetzeStufe` verwenden ihn gemeinsam. Die Schätzung nennt „inkl. 10 % EU-Aufschlag“.
- **Erprobungsstand Mistral** (AV-2026-W43-09) in den Hinweisen unter „KI-Anbieter & API“ statt „noch nicht erprobt“: EU-Endpunkt 7 Läufe, global 3 Läufe, ohne Websuche.
- **Zuordnung der Sachverhalte** im Vergleich (AV-2026-W43-18): mit der Kernaussage des Bewertungstextes (erste Zeile, ohne den Teil ab „Referenzraum:“); Verfahren `ki-lead-vergleich/3`, Mehrfachvergleich `ki-lead-mehrfachvergleich/2`. Im Vergleichslauf vom 24./25.10.2026 ordnete das Verfahren `/2` drei von 18 Läufen dem falschen Sachverhalt zu; `/3` ordnet alle drei dem Stromausfall zu und ändert keine andere Zuordnung.
- **Plausibilitätsprüfung D2** (AV-2026-W43-17): Eine ausdrücklich genannte Summe oder Gesamtzahl („Summe 19.600“, „zusammen …“, „insgesamt …“, „= mindestens …“) geht der größten Einzelzahl vor; behebt den einzigen Fehlalarm des Vergleichslaufs. Entscheidung (AV-2026-W43-16): Die Prüfung bleibt im Vergleichslauf; in die App kommt sie als Hinweis, sobald mindestens zehn Treffer von Hand geprüft sind und höchstens einer davon ein Fehlalarm ist.
- **Auswertung mehrerer Vergleichsläufe** (AV-2026-W43-19): Zahl der verglichenen Achsen je Konfiguration (`achsen_verglichen`), Erklärung, dass der Radarabstand nur gemeinsam gesetzte Achsen zählt, und zusätzlich Δ Tendenz gleich, Δ Achsenabweichung und Δ Achsen ≤ 1 im Bericht.
- Spezifikation 0.5.10: Abschnitt 5.4 (Standard-Profile, Aufwand je Modell, Schätzung, Plausibilität, Zuordnung), offene Punkte 6 und 15; `evaluation/README.md` verweist auf den Ergebnisbericht.

### Tests

- `tests/pipeline/aufwand.test.ts` (neu, 13): Stufen je Modell nach der Anbieterdokumentation, Auswahl mit Bezeichnung, Abbildung auf die Mistral-API, nächste angebotene Stufe, `aufwandFuer`, Laufprotokoll und Anfrage mit der gesendeten Stufe, Konfiguration des Vergleichslaufs, Standard-Profile nur mit angebotenen Stufen, OpenAI- und Mistral-Profil mit Begründung im Kommentar, App-Vorgabe gleich Standard-Profil Anthropic (AV-2026-W43-01 bis -03, -10, -13, -14).
- `tests/pipeline/schaetzung.test.ts` (+4): Messwerte des Vergleichslaufs als festes Soll liegen in den Spannen, neue Spannen von Hand nach der Regel, S1 und Verdichtung jedes Standard-Profils gemessen, EU-Aufschlag in Schätzung und Anzeige (AV-2026-W43-05, -06, -15); Untergrenze gpt-6-astra „medium“ angepasst.
- `tests/anbieter/preise.test.ts` (+1): Aufschlag 1,1 nur für Mistral am EU-Endpunkt (AV-2026-W43-06).
- `tests/pipeline/plausibilitaet.test.ts` (+1): Sätze aus dem Vergleichslauf mit Summe, Gesamtzahl und Einzelzahlen (AV-2026-W43-17).
- `tests/pipeline/vergleich.test.ts` (+1): Zuordnung eines zerlegten Entwurfs zum Stromausfall-Sachverhalt mit Kernaussage, ohne Kernaussage zum anderen (AV-2026-W43-18).
- `tests/pipeline/vergleichsauswertung.test.ts`: Zahl der verglichenen Achsen und neue Spalten des Berichts (AV-2026-W43-19).
- `tests/ui/einstellungen.test.ts` (+1, 1 angepasst) und `tests/ui/modellwahl.test.ts` (+1): Aufwand je Modell in Einstellungen und Wahl je Lauf, sichtbare Anpassung beim Modellwechsel; die Übersicht zeigt bei Mistral die wirksame Stufe „hoch“ statt „mittel“ (AV-2026-W43-01, -02).

### Befundregister

- `evaluation/befunde/befundregister.json`: AV-2026-W43-01 bis -03, -05, -06, -09, -10 und -12 bis -19 als umgesetzt; AV-2026-W43-07 und -08 bleiben offen.

## [0.5.9] – 24.10.2026

Grundlage: Lizenzprüfung vom 24.10.2026 (Befunddatei `ki-lead-befund_lizenzen_2026-W43.json`, Befunde KP-2026-W43-54 bis -60) mit Freigabe und Festlegungen des Herausgebers vom selben Tag. Grundsatz: Rechte werden bestätigt oder erweitert, nie beschränkt; für frühere Fassungen gelten die damals angegebenen Lizenzen weiter. Alle Inhalte sind im privaten Forschungsvorhaben entstanden. Keine Änderung am Beispielprofil, an SOPs, Arbeitsanweisungen oder Schemata des Beispielprofils, an der KI-Pipeline oder an gespeicherten Daten. Keine Rechtsberatung.

### Geändert

- **Fuß der App** (KP-2026-W43-54): statt „Profilinhalte unter CC BY 4.0“ jetzt „Code unter EUPL-1.2, mitgelieferte Beispielprofile unter CC BY 4.0 (Heiko Pereira Wolf), andere Profile unter der Lizenz ihres Herausgebers“ mit Verweis „Lizenzen“ auf `LICENSE-CONTENT`. Damit steht die von CC BY 4.0 verlangte Namensnennung im Fuß, wie THIRD-PARTY-NOTICES.md es bereits angab.
- **Über KI-LEAD** (KP-2026-W43-54): Lizenzpunkt nennt die Bestandteile der Beispielprofile, die Namensnennung, die zusätzliche CC0-Widmung, die Lizenz eigener und importierter Profile und dass Eingaben, Meldungen und Lagebilder nicht erfasst sind; neuer Verweis „Lizenzhinweise für Inhalte“ (`VERWEISE.inhaltslizenz`).
- **`LICENSE-CONTENT`** (KP-2026-W43-55, -56, -57): Präambel neu mit Copyright-Vermerk und Grundsatz; Nr. 1 CC BY 4.0 für alle Dateien in `profile/`, `evaluation/` und `docs/`; Nr. 2 zusätzlich CC0 1.0 für Meldungsschemata, Manifeste, Kontaktlisten, Quellenregister, die JSON-Schemata in `evaluation/` und die Vorlage (Darstellungsdateien des Beispielprofils wegen der Stufentexte des Lagenradars nur CC BY 4.0); Nr. 3 Profiltexte in Ausgaben der App ohne Namensnennung verwendbar; Nr. 4 Code; Nr. 5 Ausnahmen (eigene und importierte Profile, amtliche Werke nach § 5 UrhG und Auszüge Dritter, Marken, Aufsätze unter CC BY-NC-ND 4.0, nicht schutzfähige KI-Entwürfe); Nr. 6 Herkunft; Nr. 7 Namensnennung mit Bearbeitungsvermerk. Lizenztext unverändert.
- **Kurzsatz zu den Lizenzen** wortgleich in README.md, THIRD-PARTY-NOTICES.md, SPEZIFIKATION, ERPROBUNG und `public/lizenzen-ergaenzend.md`; README-Abschnitt „Lizenz“ nach Bereichen; `CITATION.cff` mit `EUPL-1.2` und `CC-BY-4.0`; Lizenzzeilen in `evaluation/README.md` und `evaluation/pruefsteine/README.md` (KP-2026-W43-59).
- **Musterprofil → „Vorlage – eigene Organisation“** (Profil 0.5.0, KP-2026-W43-58, -60): alle Bestandteile als Gerüst mit Platzhaltern in eckigen Klammern (Teil A, eine Dach-SOP als Inhaltsgerüst mit YAML-Kopf und fünf Abschnitten, Arbeitsanweisung Erfassung, Kodierleitfaden mit Stufentexten und Quellenkategorien, README zur Übernahme), Herausgeber „[Herausgeber]“, Lizenz CC0 1.0. Profil-ID, Schema und Schemakennung bleiben, gespeicherte Meldungen gültig. Verdichtung und Kurzfassung bleiben bewusst ohne eigene Datei: Die App nutzt ihre Standardfassungen, statt eine Anweisung mit Platzhaltern an die KI zu geben; die README der Vorlage erklärt, wie man eigene anlegt. Einzelheiten: [profile/muster/CHANGELOG.md](profile/muster/CHANGELOG.md).
- **PROFILFORMAT 1.18** (KP-2026-W43-58): Manifestfelder `herausgeber` und `lizenz` beschrieben (SPDX-Kennung oder Ausdruck, `LicenseRef-intern` für nicht veröffentlichte Profile, Bearbeitungsvermerk bei CC BY 4.0); Beispiel „Kreis X“ ohne CC-Lizenz.
- `scripts/pruefumfang.mjs`: `LICENSE-CC0` zählt wie die übrigen Lizenztexte als reiner Inhalt.

### Hinzugefügt

- **`LICENSE-CC0`**: Text CC0 1.0 Universal mit Kopf, der auf `LICENSE-CONTENT`, Nr. 2, verweist.

### Tests

- `tests/lizenzen/inhalte.test.ts` (neu, 18): Geltungsbereich und Abgrenzungen in `LICENSE-CONTENT` (KP-2026-W43-55); CC0-Widmung, gewidmete Dateiarten vorhanden, Darstellungsdateien nur CC BY 4.0 (-56); Kurzsatz wortgleich in fünf Dokumenten, `CITATION.cff`, Lizenzzeilen der Übersichten, kein „Profilinhalte“ mehr in `src/` (-59, -54); Lizenzangaben der mitgelieferten Profile und Beschreibung in PROFILFORMAT (-58).
- `tests/profil/vorlage.test.ts` (neu, 5): Vorlage lädt ohne Fehler und Warnungen, führt die Manifestfelder des Beispielprofils, die Pflegeschlüssel und die fünf Abschnitte jeder Dach-SOP des Beispielprofils, Platzhalter nur in eckigen Klammern, CC0 1.0 (KP-2026-W43-60).
- `tests/ui/ueber.test.ts`: Lizenzpunkt mit Namensnennung, eigenen Profilen und Ausgaben; Verweis „Lizenzhinweise für Inhalte“, sieben statt sechs Verweise; Fuß mit Namensnennung und Verweis „Lizenzen“ (KP-2026-W43-54).
- `tests/profil/profilansicht.test.ts`: Vorlage mit einer Dach-SOP und README; ein Paket ohne SOP und ohne Zusatzdokumentation weiterhin über abgeleitete Pakete geprüft; Fassung 0.5.
- `tests/ci/pruefumfang.test.ts`: Fall „Lizenztexte“.
- [docs/TESTS.md](docs/TESTS.md): Gliederung um Vorlage und Inhaltslizenzen ergänzt.

### Befundregister

- `evaluation/befunde/befundregister.json`: KP-2026-W43-54 bis -60 als umgesetzt mit Pull Request #58.

## [0.5.8] – 24.10.2026

Grundlage: Auftrag des Herausgebers vom 24.10.2026, die Konfigurationen von Modell und Aufwand der drei Anbieter mit dem Standardfall „Ilka“ per Schaltfläche vergleichbar zu machen, mit wählbarer Anzahl der Läufe (Vorauswahl 3) und dem Ergebnis als ZIP-Datei; dazu die Entscheidungen des Herausgebers vom selben Tag zu den Befunden AV-2026-W43-04 (Standard-Profile mit Anthropic als Bezug: ja), AV-2026-W43-10 (App-Vorgabe der Verdichtung erst nach Vergleich Opus/Sonnet) und AV-2026-W43-11 (Plausibilitätsprüfung: Entscheidung an Claude übertragen). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, gespeicherten Einstellungen oder der Ablage der Schlüssel; die Standard-Profile bleiben bis zur Auswertung der Vergleichsläufe unverändert.

### Hinzugefügt

- **Vergleichslauf Ilka** unter „Einstellungen → Modelle & Verarbeitung“ (`src/ui/Vergleichslauf.tsx`, `src/pipeline/vergleichslauf.ts`). Mit der dort angezeigten Konfiguration (S1, S2 Verdichtung, S3 Reparatur je mit Modell und Aufwand, bei Mistral mit Endpunkt) laufen 1 bis 10 Verdichtungen der sechs fiktiven Ilka-Eingänge (Vorauswahl 3) nacheinander:
  - fester Auftrag aus `evaluation/faelle/orkantief-ilka-verdichtung.json`: Beispielprofil mit der Koordinierungsstelle, Referenzraum Bevölkerungsschutz in Deutschland, Stichtag 14.10.2026, t0 14:00 Uhr, ohne Websuche;
  - S1-Vorschlag unverändert übernommen, keine vorgeschlagene Prüffrage, wie in der Abnahme M4;
  - je Lauf Quellenprüfung der Eingänge, Prüfpunkte T1–T8 der Abnahme M4 und Vergleich mit der Redaktionsfassung.
  - Vor dem Start nennt die App Schätzung von Dauer und Kosten je Lauf und zusammen sowie fehlende Schlüssel. Während des Laufs zeigt sie Lauf, Stufe, Zeichen und bisherige Kosten, hält den Bildschirm wach und lässt sich abbrechen (die bisherigen Läufe bleiben).
  - **Konfiguration** wahlweise aus den aktuellen Einstellungen oder als Variante des Bewertungsplans `standardprofile-ilka` (A Anthropic-Standard als Bezug, B Anthropic mit Sonnet in der Verdichtung, C OpenAI-Standard, D OpenAI mit astra „hoch“, E Mistral-Standard, F Mistral mit Large 4); die Einstellungen bleiben dabei unverändert, die Reparatur folgt dem Standard-Profil des S2-Anbieters.
  - **Kennzahlen je Lauf** (AV-2026-W43-04): Zahl der Sachverhalte, Anteil gesetzter Achsen und Tendenzen, Gleichheit von Beurteilung und Tendenz, Ähnlichkeit und Achsenabweichung gegenüber der Redaktionsfassung, Radarwerte je zugeordnetem Sachverhalt der Redaktionsfassung.
  - **Plausibilitätsprüfung der Zahlen** (AV-2026-W43-11, `src/pipeline/plausibilitaet.ts`): Summenangaben der Form „mindestens N … (Teilwerte)“ gegen die Summe der Klammerwerte, D2-Wert gegen die größte im D2-Satz genannte Personenzahl nach den Stufentexten des Kodierleitfadens. Entscheidung: zunächst nur im Vergleichslauf (Reihendatei, Übersicht, Ergebnistabelle); ob sie als Hinweis an die Redaktion in die App kommt, entscheidet die Quote falscher Treffer in den Vergleichsläufen. An den vier Mistral-Entwürfen vom 24.10.2026 fand sie die bekannten Summen- und D2-Fehler, an der Redaktionsfassung und den Beispielmeldungen des Profils nichts.
  - **ZIP-Datei** `KI-LEAD_Vergleichslauf_Ilka_[<Variante>_]<S2-Modell>-<Aufwand>_<Zeit>.zip`: `reihe.json` (Format `ki-lead-abnahme/1`, Feld `quelle: "app"`), `uebersicht.csv` (eine Zeile je Sachverhalt und Lauf mit Konfiguration, Dauer, Token, Kosten, Beurteilung, Tendenz, Radarwerten und Ähnlichkeit zur Redaktionsfassung; Semikolon, Dezimalkomma), `laeufe/*.lauf.json`, `meldungen/*.meldung.json` (für `npm run vergleich:mehrfach`), `vergleiche/*.vergleich.csv`, `LIESMICH.txt`. Die Läufe erscheinen nicht in der Läufe-Liste der KI-Erfassung.

- **Bewertungsplan** `evaluation/plaene/standardprofile-ilka.json` (AV-2026-W43-04, -10): sechs Varianten, je drei Läufe, Budgetgrenze 30 USD, Bezug Variante A.
- **Auswertung mehrerer Vergleichsläufe** (`src/pipeline/vergleichsauswertung.ts`, `npm run vergleichslauf:auswerten -- <ZIP-Dateien oder Ordner> [--bezug <kennung>] [--md <datei>] [--json <datei>]`): fasst die Reihen je Konfiguration zusammen (auch über mehrere Dateien) und stellt jede dem Bezug gegenüber, ohne Vorgabe dem Standard-Profil Anthropic; Radarabstand je Sachverhalt der Redaktionsfassung und Achse, Abstand der Anteile „offen“ und je Kennzahl. Kein Gesamtwert; sortiert nach dem Radarabstand.
- Kommentar zu `STANDARD_PROFILE`: Anthropic als Bezug der Standard-Profile (AV-2026-W43-04).

### Geändert

- **Abnahmeskript M4** (`evaluation/abnahmen/m4.lauf.ts`) nutzt Ablauf, Prüfpunkte und Reihendatei des Vergleichslaufs (`einLauf`, `pruefpunkte`, `reiheErstellen`); Ausgabe und Aufruf unverändert, die Reihendatei nennt zusätzlich `quelle: "skript"` und je Aufgabe den Anbieter, je Stufe die Eingabetoken.

### Tests

- `tests/pipeline/vergleichslauf.test.ts` (neu, 7): Vorgabe und Grenzen der Anzahl, Falldateien im Beispielprofil und in der eingebetteten Ausgabe, drei Läufe mit festem Auftrag und allen Prüfpunkten, Reihe ohne Mistral ohne Endpunkt, Inhalt der ZIP-Datei und der Übersicht, Abbruch im zweiten Lauf, Budgetgrenze.
- `tests/pipeline/vergleichslauf.test.ts` (+2): Kennzahlen und Plausibilität mit der Redaktionsfassung als Entwurf (Soll aus der Redaktionsfassung), Varianten des Plans mit Reparatur des S2-Anbieters und Variante im Dateinamen.
- `tests/pipeline/plausibilitaet.test.ts` (neu, 7): Summenwidersprüche, stimmige Summen, Rundung und Untergrenze, Klammern ohne Summanden (Datum, Uhrzeit, Spannen, anderer Bezug), D2-Stufen, D2-Widersprüche ohne Grenzangaben, Redaktionsfassung ohne Befund, Zuordnung zu Sachverhalt und Feld.
- `tests/pipeline/vergleichsauswertung.test.ts` (neu, 4): Zusammenfassung über mehrere Dateien, Abstand zum Bezug von Hand gerechnet, Wahl des Bezugs, Bericht.
- `tests/ui/vergleichslauf.test.ts` (neu, 3): Abschnitt unter „Modelle & Verarbeitung“ mit wirksamer Konfiguration, drei Läufen und fehlendem Schlüssel; Ablauf mit Mistral-Konfiguration, ZIP-Datei und erneutem Herunterladen; Auswahl einer Plan-Variante ohne Änderung der Einstellungen.
- `tests/browser/vergleichslauf.spec.ts` (neu, 1): zwei Läufe im Browser gegen eine simulierte Anthropic-API, ZIP-Datei, keine Anfrage nach außen.

## [0.5.7] – 24.10.2026

Grundlage: erster echter Lauf mit Mistral in der App (Laufprotokoll 20261024-195614-kyc1, Verdichtung Ilka über den globalen Endpunkt), vom Herausgeber am 24.10.2026 zur Prüfung übergeben. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, gespeicherten Einstellungen oder der Ablage der Schlüssel.

**Nachtrag vom 24.10.2026 (Befunde LS-2026-W43-06 bis -13 der Lernschleife, ohne Änderung der App):**

- **Acht weitere fiktive Bewertungsfälle** unter `evaluation/faelle/` mit Material unter `evaluation/material/` für bis dahin nur einmal abgedeckte SOPs und Bausteine: `sop-cyber-schutzabschaltung-kreis` (B15, C11, C17; LS-2026-W43-06), `sop-grossunfall-bahn-ursache-offen` (B17, C05, B16, C13, C16; -07), `sop-waldbrand-nachlauf-rueckkehr` (B03, C16; -08), `sop-migration-zuweisung-kapazitaet` (B13, C16; -09), `sop-erdbeben-inland-nachlauf` (B04, C02, C16; -10), `sop-tierseuche-grenznah-ausland` (B11, C08, C14; -11) sowie die Abwandlungen `sop-weltraumwetter-warnung-unbestaetigt` (Belegqualität; -12) und `sop-vulkanasche-transport-zeitluecke` (Zeitstand; -13). Alle mit erwarteten Radarwerten (`erwartungen.radar`); Streuung über Referenzraum, Schwierigkeit und Phase.
- Soll-Abdeckung `evaluation/plaene/2026-10-21-sop-abdeckung.json` fortgeschrieben (Stand 24.10.2026, 48 Fälle); C01 bleibt bei einem Fall. Die Fälle sind nicht Teil von Bewertungsplan 1; keine KI-Läufe.
- Dokument: [evaluation/faelle/README.md](evaluation/faelle/README.md).

### Korrigiert

Der Lauf (Verdichtung Ilka, globaler Endpunkt) scheiterte in S2 mit „Die Anfrage wurde von Mistral abgelehnt ([object Object],…)“; S1 mit `mistral-small-2603` lief durch.

- **Fehlermeldung lesbar:** Mistral liefert bei HTTP 422 eine Liste von Prüffehlern statt eines Textes. Die App nennt sie jetzt mit Ort und Text (z. B. „completion_args.reasoning_effort: …“) statt „[object Object]“ (`fehlerTextAus`).
- **Nachdenken nur mit dokumentierten Werten:** S1 („hoch“ → `high`) wurde angenommen, S2 („mittel“ → `medium`) abgelehnt; einziger Unterschied der beiden Anfragen außer dem Schema. Mistral dokumentiert für Small 4, Medium 3.5 und Large 4 nur `high` und `none`. Die App sendet deshalb nur diese beiden Werte. Der Rückfall bei Ablehnung prüft jetzt die ganze Fehlerantwort statt nur des Textes (vorher griff er wegen der Liste nicht) und wiederholt einmal ohne Angabe; das Laufprotokoll nennt dann `reasoning_effort_abgelehnt`. Ob `medium` die Ursache war, bestätigt erst die lesbare Meldung eines weiteren Laufs.
- **Laufprotokoll kompakt:** Statt jedes Stücks des Antwortstroms einzeln (1 364 Einträge in S1) stehen dort zusammengefasste Blöcke für Nachdenken und Text, Fundstellen, Werkzeugereignisse und der Abschluss mit `usage`; bei Chat Completions (EU) ebenso.

### Hinzugefügt

- **Abnahmeskript M4 mit Mistral** (`evaluation/abnahmen/m4.lauf.ts`): `KI_LEAD_ANBIETER=mistral` mit `KI_LEAD_MISTRAL_KEY` setzt das Standard-Profil Mistral (S1 Small 4, S2 Medium 3.5, Reparatur Small 4), Endpunkt EU oder mit `KI_LEAD_MISTRAL_ENDPUNKT=global` global. Die Reihendatei `ki-lead-abnahme/1` enthält je Lauf zusätzlich Kurzantwort und Entwurf, damit sie allein inhaltlich auswertbar ist.
- **Mistral-Probe erweitert:** Rohaufrufe aller Werte von `reasoning_effort` je Modell an beiden Endpunkten (mit dem Fehlertext von Mistral bei Ablehnung) und Nachstellung der gescheiterten S2-Anfrage (Medium 3.5, Aufwand „mittel“, 128 000 Ausgabetoken).

### Tests

- `tests/anbieter/mistral.test.ts` (+2, angepasst): Abbildung der Stufen auf `none`/`high`, 422 mit Liste in `message` lesbar, Rückfall ohne Angabe bei Ablehnung im Ort der Prüffehler, kein weiterer Rückfall ohne Angabe, zusammengefasstes Laufprotokoll für beide Endpunkte.

## [0.5.6] – 24.10.2026

Grundlage: Auftrag des Herausgebers vom 24.10.2026, Mistral als dritte Möglichkeit der API-Einbindung aufzunehmen, mit dem EU-Endpunkt als Vorgabe, und der Vorschlag zur Neustrukturierung der Einstellungen vom selben Tag (begutachtet; Abweichungen in der Beschreibung des Pull Requests). Schnittstelle von Mistral nach Doku und Typdefinitionen des SDK `@mistralai/mistralai` 3.2.0 vom 24.10.2026; **nicht mit einem echten Schlüssel geprüft**; dafür gibt es die Mistral-Probe ([Spezifikation](docs/SPEZIFIKATION.md), offener Punkt 15). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, gespeicherten Einstellungen oder der Ablage der Schlüssel; keine neue Abhängigkeit.

**Nachtrag vom 24.10.2026 (Befunde LS-2026-W43-01 bis -05 der Lernschleife, ohne Änderung der App):**

- **Erwartete Radarwerte in Bewertungsfällen** (LS-2026-W43-01): `fall.schema.json` um `erwartungen.radar` ergänzt; je Achse eine fachlich vertretbare Spanne `min`–`max` oder `offen`, jeweils mit `grund`; eine fehlende Achse heißt keine Erwartung. Gilt für Fälle mit genau einem erwarteten Sachverhalt. Punktwerte sind erst nach Überarbeitung des Kodierleitfadens vorgesehen. Pilot: `sop-gas-stabil` erwartet D2 offen.
- **Abwandlungen** (LS-2026-W43-02): `variante_von` und `abwandlung` kennzeichnen einen Fall als gezielte Abwandlung eines vorhandenen Falls; beide Felder nur gemeinsam.
- **Bewertungspläne** (LS-2026-W43-03): `evaluation/plaene/plan.schema.json` (`ki-lead-bewertungsplan/1`) mit Fragestellung, Fall-IDs, Varianten wie in der Bewertung, Wiederholungen und Budgetgrenze; Pläne kombinieren Fälle, ohne sie zu kopieren.
- **Mehrfachvergleich** (LS-2026-W43-04): `vergleicheMehrere` und `krippendorffAlphaOrdinal` in `src/pipeline/vergleich.ts` für mehrere Kodierungen derselben Lage; je Achse Werte, Anzahl mit Wert und offen, Median, Spannweite, Paare mit höchstens einer Stufe Abstand, Treffer der Erwartung und Krippendorffs Alpha (ordinal) über die Sachverhalte als Einheiten, stets mit Zahl der Einheiten. Kein Gesamtscore über Achsen. Aufruf über `npm run vergleich:mehrfach -- <ordner> [--profil …] [--fall …]` (`scripts/vergleich-mehrfach.mjs`); Meldungen bleiben außerhalb des Repositorys. Keine Oberfläche in der App.
- **Anleitung** (LS-2026-W43-05): Prüfliste „Neuen fiktiven Fall anlegen“ in [evaluation/faelle/README.md](evaluation/faelle/README.md).
- Tests: `tests/evaluation/schemata.test.ts` (+7): Radarerwartung je Achse (Spanne oder offen, Grund, d1–d8, Wertebereich), min ≤ max in allen Fällen, Pilotfall; Abwandlung nur mit Ausgangsfall, Verweis auf vorhandenen anderen Fall; Bewertungsplan gegen Schema, bekannte Formate unter `plaene/`, Verweise auf vorhandene Fälle (auch in der Abdeckungsdatei). `tests/pipeline/vergleich.test.ts` (+11): Alpha mit von Hand gerechnetem und unabhängig abgeglichenem Soll, Fälle ohne Aussage; Kennzahlen je Achse, Erwartung, Zuordnung mehrerer Sachverhalte.
- Dokumente: [evaluation/README.md](evaluation/README.md), [evaluation/faelle/README.md](evaluation/faelle/README.md), [docs/TESTS.md](docs/TESTS.md).

### Hinzugefügt

- **Mistral als dritter KI-Anbieter** (`src/anbieter/mistral.ts`) mit zwei Endpunkten, wählbar unter „KI-Anbieter & API“ (`mistralEndpunkt` in den Einstellungen, ohne gespeicherten Wert „eu“; keine Migration):
  - **EU (Vorgabe):** `api.eu.mistral.ai` mit Chat Completions (`POST /v1/chat/completions`). Verarbeitung in Rechenzentren in EU und EFTA, 10 % Aufschlag auf die Listenpreise (in den Kosten berücksichtigt). Regionale Endpunkte bieten keine eingebauten Werkzeuge; S2 arbeitet dann ohne Recherche. Die App sagt das dem Modell im Steuerungsblock, nennt es vor dem Lauf und als Befund `RECHERCHE_NICHT_VERFUEGBAR` mit Grund. Chat Completions fällt unter Mistrals Zero Data Retention (auf Antrag).
  - **Global:** `api.mistral.ai` mit der Conversations API (`POST /v1/conversations`), weil nur sie die eingebaute Websuche mit Fundstellen bietet.
- **Gemeinsam für beide Wege:** Streaming mit Fortschritt (Schreiben, Nachdenken, Suche), Fundstellen aus `tool_reference`, strukturierte Ausgabe über `response_format` mit dem strengen Schema wie bei OpenAI, Nachdenken über `reasoning_effort` („maximal“ wird zu „xhigh“), `store: false`, PDF als `document_url`. Wiederholungen, Abbruch und Neustart wie bei den anderen Adaptern. Lehnt ein Modell die Stufe des Nachdenkens ab, folgt genau ein Versuch mit „high“ bzw. „none“; die wirksame Stufe steht im Laufprotokoll (`ki-lead.parameter` am Anfang von `antwort.inhalt`). Die API meldet keinen Abbruchgrund; erreicht die Ausgabe die Höchstzahl, gilt die Antwort als abgeschnitten (`max_tokens`), damit die Pipeline wie gewohnt vervollständigt.
- **Grenzen bei Mistral:** EU ohne Werkzeuge; global keine Höchstzahl der Websuchen je Anfrage (die App zählt sie), kein eigenes Abrufwerkzeug, Höchstlänge je Seite ohne Wirkung. Die Pipeline rechnet mit den wirksamen Grenzen (`werkzeugeFuer`, `s2Grenzen`): Werkzeuge, Steuerungsblock und Befunde nennen nur, was das S2-Modell am gewählten Endpunkt kann. Hinweise unter „Recherche & Grenzen“, in der KI-Erfassung und bei den Anbieterhinweisen.
- **Mistral-Probe** (`.github/workflows/mistral-probe.yml`, `playwright.probe.config.ts`, `tests/probe/mistral.spec.ts`): echte Aufrufe mit dem Repository-Secret `MISTRAL_API_KEY`, gestartet über das Label „mistral-probe“ am Pull Request oder von Hand. Prüft Verbindungstest im Browser über beide Endpunkte (CORS), Modelle an beiden Endpunkten, Stufen des Nachdenkens, strukturierte Ausgabe, PDF und Websuche; Bericht in der Zusammenfassung des Laufs. Ohne Aufzeichnungen; nicht Teil der gewöhnlichen Tests.
- **Modelle und Standard-Profil Mistral:** wählbar `mistral-small-2603` (Small 4), `mistral-medium-3-5` (Medium 3.5), `mistral-large-4` (Large 4, Public Preview, deshalb nicht Vorgabe). Standard-Profil: S1 und S3 Small 4, S2 Erfassung, Verdichtung und Management Summary Medium 3.5, Aufwand wie bei den anderen Anbietern. Modelle beginnend mit `mistral-`, `ministral-`, `magistral-`, `codestral-`, `pixtral-` und `open-mistral-` gehen an Mistral.
- **Preise Mistral** (Stand 24.10.2026, USD je Million Token Eingabe/Ausgabe): Small 4 0,15/0,60, Medium 3.5 1,50/7,50, Large 4 1,36/4,18; Websuche 0,03 USD je Aufruf (Angabe aus einer Übersicht Dritter, unbestätigt). `connector_tokens` zählen vorsichtig zur Eingabe. Über den EU-Endpunkt × 1,1.
- **Schlüssel für Mistral** in derselben Ablage wie die anderen (`schluessel:mistral`); Content-Security-Policy um `https://api.eu.mistral.ai` und `https://api.mistral.ai` erweitert.

### Geändert

- **Einstellungen in sechs Bereichen** mit Abschnittsnavigation wie bei Meldung und Lagebild: Übersicht, KI-Anbieter & API, Modelle & Verarbeitung, Recherche & Grenzen, Darstellung, Über KI-LEAD. Breite Ansicht mit Leiste links, schmale mit waagerecht scrollbarer Leiste; immer nur ein Bereich sichtbar. Der Bereich bleibt beim Wechsel der Ansicht erhalten; „Zu den Einstellungen“ aus der KI-Erfassung führt zu „KI-Anbieter & API“. Reine Umgliederung: gleiche Werte, Vorgaben, Speicherorte und Schlüssel, keine Migration.
- **Übersicht (neu, Startbereich):** aktives Profil, Voreinstellung, Ablage, Recherchegrenzen; je Anbieter Schlüssel hinterlegt/fehlt und genutzte Aufgaben; je Aufgabe wirksames Modell, Aufwand und Herkunft (eigene Einstellung, Vorgabe des Profils, Vorgabe der App), stets aus dem gespeicherten Stand berechnet. Fehlt ein Schlüssel für einen genutzten Anbieter, führt ein Knopf direkt dorthin.
- **Voreinstellung unter „Modelle & Verarbeitung“** statt „Standard-Profil wählen“ im Schlüsselabschnitt: Vorgaben des aktiven Profils, Standard-Profil Anthropic, OpenAI oder Mistral; „Individuelle Modellkonfiguration“ entsteht von selbst. Vor dem Überschreiben einer individuellen Konfiguration fragt die App nach. Je Aufgabe nennt die Zeile Herkunft, Anbieter und einen fehlenden Schlüssel.
- **„Maximale Ausgabetoken je KI-Aufruf“** statt „Höchstzahl Ausgabetoken (S1, S2, S3)“; gespeichert wie bisher unter `maxTokensErfassung`.
- **Schlüsselabschnitte:** Speicherzustand sichtbar („Gespeichert.“, „Noch nicht gespeichert.“), aufklappbare Hinweise je Anbieter.
- Aufzählungen von Anbietern in der KI-Erfassung („Anthropic, OpenAI und Mistral“); Fuß nennt Mistral.
- Dokumente: README, Spezifikation 0.5.6 (Abschnitte 5.4, 7, offener Punkt 15), [DATENSCHUTZ.md](docs/DATENSCHUTZ.md) 1.3 (Mistral: EU-Endpunkt als Vorgabe, Training im kostenlosen Tarif, 30 Tage Aufbewahrung, Zero Data Retention nur für den EU-Weg), [SICHERHEIT.md](docs/SICHERHEIT.md) 1.2, [KI-VERORDNUNG.md](docs/KI-VERORDNUNG.md) 1.2, [NATIV.md](docs/NATIV.md), [ERPROBUNG.md](docs/ERPROBUNG.md), [TESTS.md](docs/TESTS.md).

### Tests

- `tests/anbieter/mistral.test.ts` (neu, 22): EU-Endpunkt als Vorgabe mit Chat Completions (Anfragekörper, Denken, Cache, 10 % Aufschlag, Laufprotokoll, `length`, Neustart, grobe Stufe, Fehlerobjekt im Strom, Host im Netzfehler); global: Anfragekörper (System, Nachrichten, PDF, Werkzeuge, Schema, Stufen), Stromauswertung mit Denken, Suche, Fundstellen, Nutzung und Kosten, Ausgabegrenze, Zählung aus `usage.connectors`, Fehlerereignis im Strom, flache und `detail`-Fehlerantworten, grobe Stufe einmal und nicht öfter, Neustart nach Abbruch und bei fehlendem Abschluss, Hinweis auf mögliche Browsersperre.
- `tests/anbieter/vertrag.test.ts`: Mistral EU und Mistral global im gemeinsamen Vertrag (Wiederholungen, retry-after, Schlüsselfehler, Abbruch; +16).
- `tests/anbieter/verteiler.test.ts` (+3): Zuordnung der Mistral-Modelle, Standard-Profile je Anbieter, Aufzählung, Standard-Fabrik ruft ohne Wahl und mit „eu“ `api.eu.mistral.ai/v1/chat/completions`, mit „global“ `api.mistral.ai/v1/conversations`.
- `tests/anbieter/preise.test.ts` (+2): Mistral-Preise, Websuche 0,03 USD.
- `tests/ui/einstellungen.test.ts` (neu gefasst, 11): sechs Bereiche, Start in der Übersicht, genau ein Bereich, Tastatur (Schaltflächen, Fokus bleibt), ohne Darstellung, von außen gehaltener Bereich; Übersicht mit Herkunft und fehlendem Schlüssel; drei Schlüsselfelder und unverändertes Speichern; Voreinstellung mit und ohne Rückfrage, Vorgaben des Profils, gemischte Konfiguration; Feldname und unveränderte Datenstruktur; Mistral-Endpunkt (Vorgabe EU, Wahl, Übersicht).
- `tests/pipeline/einstellungen.test.ts` (+2): Endpunkt ohne gespeicherten Wert „eu“, Werkzeuge je Modell und Endpunkt. `tests/pipeline/fortschreibung.test.ts` (+2): S2 mit Mistral EU ohne Werkzeuge (Anfrage, S1-Auftrag, Steuerung, Befund), global nur Websuche.
- `tests/browser/einstellungen.spec.ts` (neu, 5): zugängliche Namen in jedem Bereich, Tastatur, Smartphone (Leiste oben, eine Zeile, kein seitliches Scrollen), Bereich bleibt beim Wechsel, Mistral-Schlüssel nach Neuladen.
- Angepasst an die Bereiche: `tests/ui/farbschemas.test.ts`, `tests/ui/ueber.test.ts` (auch Content-Security-Policy), `tests/schluessel/ablage.test.ts`, `tests/browser/hilfen.ts`, Attrappen des Verteilers in `tests/ui/modellwahl.test.ts`, `fortschreibung.test.ts` und `s1-grenze.test.ts` (`Verteiler.fuer`); Schlüsselobjekte in weiteren Tests um `mistral` ergänzt.

## [0.5.5] – 24.10.2026

Grundlage: Befund „Grundlagen Priorität 2“ vom 24.10.2026 (Drittkomponenten und Lizenzen, Erprobungskonzept, Impressum) mit Freigabe des Herausgebers. Lizenz- und Rechtsfragen am 24.10.2026 recherchiert, mit Quellen; keine Rechtsberatung. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, KI-Pipeline oder gespeicherten Daten.

**Nachtrag vom 24.10.2026 (Befundregister und Prüfsteine, ohne Änderung der App):**

- **Befundregister** [evaluation/befunde/](evaluation/befunde/README.md): `befundregister.json` hält den Entscheidungsstand der Befunde aus den automatisierten Prüfläufen fest (`umgesetzt` mit Pull Request, `abgelehnt` und `ueberholt` mit Grund, `zurueckgestellt` mit Grund und Wiedervorlage); Format `ki-lead-befundregister/1` mit Schema. Prüfläufe lesen es vor der Prüfung, damit entschiedene Befunde nicht erneut vorgelegt werden. Die Befunddateien selbst bleiben außerhalb des Repositorys.
- Tests: `tests/evaluation/schemata.test.ts` (+2): Register gegen Schema, eindeutige IDs, Kalenderwoche von ID und Befunddatei, Entscheidungsdatum nicht nach Registerstand; Pflichtangaben je Status. Schlüsselprüfung schließt `evaluation/befunde/` ein.
- **Prüfsteine** [evaluation/pruefsteine/](evaluation/pruefsteine/README.md): Meldungen aus dem wöchentlichen Erfassungstest zu realen Lagen bleiben unverändert erhalten, auch mangelhafte; je Lage eine Begleitnotiz `ki-lead-pruefstein/1` mit Regelwerksstand, t0, Quellen, Einstufung, bekannten Mängeln und Befund-IDs. Kennzeichnung als KI-Entwurf ohne amtlichen Charakter ist Pflicht. Schemawandel wird in der Begleitnotiz dokumentiert, die Meldung nicht angepasst.
- **Eingang offener Befunde:** Prüfläufe legen ihre Befunddateien vor der Freigabe auf dem Daten-Branch `befunde/eingang` ab; offene Befunde arbeitet ein Freitagslauf gesammelt ab ([evaluation/befunde/README.md](evaluation/befunde/README.md)).
- Tests: `tests/evaluation/pruefsteine.test.ts` (neu, 3): Begleitnotiz gegen Schema, Ordnername, vorhandene Meldung, Kennzeichnung (Status, Verfahren, meldende Stelle, keine Zeichnungsnamen), aktuelles Meldungsschema oder dokumentierte Abweichung, Mängel mit Befund-ID in `befunde`; Pflichtangaben der Begleitnotiz.
- Dokumente: [evaluation/README.md](evaluation/README.md), [docs/TESTS.md](docs/TESTS.md).

### Hinzugefügt

- **Über KI-LEAD** in den Einstellungen: Version, Abgrenzung, Herausgeber und externe Verweise auf Impressum, Datenschutzerklärung, Drittkomponenten und Lizenzen, Quellcode, Rückmeldung und Erprobung (`src/ui/Ueber.tsx`, Adressen in `src/kern/herausgeber.ts`). Die Verweise öffnen sich in einem eigenen Fenster; die App ruft sie nicht auf, die Content-Security-Policy bleibt unverändert.
- **Datenschutzerklärung im Repository:** [docs/DATENSCHUTZ.md](docs/DATENSCHUTZ.md), neuer Abschnitt 12 nach Art. 13 DSGVO für die Verarbeitungen des Herausgebers (Aufruf über GitHub Pages, Speichern auf dem Gerät, Issues, Sicherheitsmeldungen, E-Mail), mit Verweis auf das Impressum für Verantwortlichen und Kontakt. Die Website des Herausgebers bleibt unverändert. Fuß und „Über KI-LEAD“ verweisen darauf.
- **Impressum und Datenschutz im Fuß** jeder Ansicht. Impressum nach § 18 Abs. 1 MStV auf der Website des Herausgebers; § 5 DDG greift für das unentgeltliche Vorhaben voraussichtlich nicht ([Spezifikation](docs/SPEZIFIKATION.md), offener Punkt 13).
- **Lizenztexte in der App:** Der Build schreibt `lizenzen.md` mit Name, Version, Lizenz und Lizenztext aller gebündelten Pakete (`build.license` von Vite, ohne neue Abhängigkeit); `public/lizenzen-ergaenzend.md` ergänzt die nativen Bibliotheken mit Apache-Lizenz und NOTICE von Cordova sowie die Pakete in den Bundles von JSZip und html2canvas. Beide liegen im Ordner der App (GitHub Pages) und gehen mit den nativen Apps aus. Bisher enthielt der minifizierte Build kaum Lizenzvermerke.
- **[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md):** alle Laufzeitkomponenten nach `package-lock.json` mit Version, Lizenz, gewählter Lizenz bei Wahllizenzen (JSZip MIT, DOMPurify Apache-2.0, rgbcolor MIT), Urheber und Einbindung; Schrift Atkinson Hyperlegible (OFL-1.1); native Komponenten; Entwicklungsabhängigkeiten getrennt; Verträglichkeit mit EUPL-1.2 und CC BY 4.0: kein Konflikt.
- **SBOM:** Die CI erzeugt bei jedem Lauf eine Stückliste im Format CycloneDX (`npm sbom`, ohne Entwicklungsabhängigkeiten) als Artefakt `ki-lead-sbom`; der neue Workflow „Release-Anhänge“ hängt sie an jeden veröffentlichten Release.
- **[docs/ERPROBUNG.md](docs/ERPROBUNG.md):** Erprobung im Testkreis (M6): Rahmen, Fragestellungen F1–F6, Teilnahmehinweise, Nutzungsbedingungen und Haftung, Rückmeldeweg, Umgang mit Laufprotokollen, Übergang in die Pflege nach Teil A, Auswertung als Abnahmekriterium. Issue-Vorlagen „Fehler“ und „Fachrückmeldung“; Verweis in `config.yml`.

### Geändert

- **Fuß der App:** Version aus `APP_KENNUNG` statt fest eingetragen (zeigte noch 0.5.2).
- Vorlage „Barrierefreiheit“: Fundort der Version „Einstellungen → Über KI-LEAD“.
- Abnahme M6: Erprobung auf einem Release-Kandidaten ohne DOI, Release mit DOI nach der Auswertung ([Spezifikation](docs/SPEZIFIKATION.md), Abschnitt 9).
- Dokumente: README (Abgrenzung mit Impressum, Dokumentation, Mitwirken, Lizenz, Fahrplan), Spezifikation 0.5.5 (Abschnitte 1, 5.4, 7–10), [DATENSCHUTZ.md](docs/DATENSCHUTZ.md) 1.2 (Abschnitte 2, 11 und 12), [SICHERHEIT.md](docs/SICHERHEIT.md) 1.1 (Abschnitt 3.7), [NATIV.md](docs/NATIV.md) (Lizenzhinweise, Abnahmepunkt), [TESTS.md](docs/TESTS.md), [evaluation/README.md](evaluation/README.md).

### Tests

- `tests/lizenzen/lizenzen.test.ts` (neu, 27): Prüfregel für Lizenzangaben (einfach, Wahl, Und-Verbindung, Copyleft, Verweis auf eigene Datei); jede Laufzeitkomponente mit Lizenz aus der Positivliste und vollständig in THIRD-PARTY-NOTICES.md; Entwicklungsabhängigkeiten; native Versionen gegen `android/variables.gradle` und `package.json`; NOTICE von Cordova; Lizenzdatei im Build; SBOM in CI und Release.
- `tests/ui/ueber.test.ts` (neu, 8): Version und Abgrenzung, Verweise mit Adresse, `target` und `rel`, Fuß mit Version und Links, keine feste Version im Fuß, Abschnitt in den Einstellungen, `APP_KENNUNG` und CITATION.cff gleich `package.json`, `connect-src` nur zu den KI-Anbietern.

## [0.5.4] – 24.10.2026

Grundlage: Befund zu den Grundlagendokumenten vom 24.10.2026 (K1: maschinenlesbare KI-Kennzeichnung nach Art. 50 Abs. 2 KI-Verordnung; Lagenradar nach [docs/BARRIEREFREIHEIT.md](docs/BARRIEREFREIHEIT.md)). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, KI-Pipeline oder gespeicherten Daten.

### Hinzugefügt

- **KI-Kennzeichnung im PDF:** Meldung und Lagebild tragen XMP-Metadaten mit der Herkunft aus `_entstehung.verfahren` (`ki`, `manuell`, `unbekannt`), bei einem KI-Entwurf mit IPTC Digital Source Type `compositeWithTrainedAlgorithmicMedia` und Modell; dazu Dokumenteigenschaften (Titel, Ersteller „KI-LEAD 0.5.4“, Schlüsselwörter „KI-generiert“ bzw. „manuell“), Dokumentsprache `de-DE` und in der Fußzeile „KI-generiert“. Ein Lagebild gilt als KI-generiert, sobald eine enthaltene Meldung ein KI-Entwurf ist. Die App erfindet keine Herkunft; ohne Angabe steht „unbekannt“ (`src/dokumente/kennzeichnung.ts`).
- **Kennzeichnung der Management Summary:** Die TXT-Datei beginnt mit „[KI-generiert mit KI-LEAD 0.5.4, Modell …; vor Verwendung fachlich prüfen]“. Der Text zum Kopieren bleibt unverändert.
- **Hinweis bei der Profilprüfung** (`KI_KENNZEICHNUNG_OHNE_ENTSTEHUNGSFELD`), wenn ein Profil kein Entstehungsfeld hat, dessen `verfahren` „KI-Entwurf“ zulässt. Das Profil bleibt ladbar.

### Geändert

- **Lagenradar als Radiogruppe:** Die Stufen einer Achse sind Optionen mit Rolle `radio` und `aria-checked` (vorher Schaltflächen mit `aria-pressed` in einer `radiogroup`), mit Namen wie „Stufe 2: regional“. Je Achse ein Tabstopp (vorher jede Stufe, bei acht Achsen rund 60); Pfeiltasten wählen um und nehmen den Fokus mit, Pos1 und Ende springen an Anfang und Ende. Liegt ein gespeicherter Wert außerhalb der Stufen, bleibt die Achse über „offen“ erreichbar. Darstellung unverändert.

### Tests

- `tests/dokumente/kennzeichnung.test.ts` (neu, 10): Herkunft aus dem Entstehungsfeld, Zusammenfassung mehrerer Meldungen, XMP mit Maskierung, PDF von KI-Entwurf und manueller Meldung, Lagebild gemischt und manuell, Kopfzeile der Management Summary.
- `tests/profil/ki-kennzeichnung.test.ts` (neu, 4): kein Hinweis für Beispiel- und Musterprofil; Hinweis ohne Rolle `entstehung_feld` und ohne „KI-Entwurf“ im Schema.
- `tests/ui/radar-tastatur.test.ts` (neu, 14): Rollen und Namen, ein Tabstopp je Achse, Wert außerhalb der Stufen, Pfeiltasten mit Fokus, Pos1/Ende, Klick.

### Nachtrag vom 24.10.2026 (ohne neue Versionsnummer)

Grundlage: Vorschläge zur Konsolidierung und Beschleunigung der Tests vom 24.10.2026. Gemessen vorher (2 Kerne): Vitest rund 42 s, davon `tests/ui/eingabehilfen.test.ts` 10,4 s; dieselbe Suite in zufälliger Reihenfolge noch einmal rund 42 s; Browsertests 82 s mit einem Worker, davon `pwa-update.spec.ts` rund 52 s. Keine Änderung an App, Profilen, SOPs, Arbeitsanweisungen, KI-Pipeline oder gespeicherten Daten; kein Test entfernt, keine Prüfung abgeschwächt.

#### Geändert

- **Gestaffelte Prüfung in GitHub Actions:** Auf `main`, im neuen wöchentlichen Volllauf und bei manuellem Start läuft weiterhin alles. Auf Pull Requests entscheidet `scripts/pruefumfang.mjs` anhand der geänderten Dateien: Die Kern-Browsertests entfallen nur, wenn ausschließlich reine Inhalte geändert sind (Dokumentation, Bewertungsfälle, SOP und Markdown-Texte der Profile); die PWA-Browsertests laufen, wenn PWA-Mechanismus oder Testumgebung betroffen sind. Im Zweifel und bei nicht ermittelbarer Dateiliste läuft alles. Der Wochenlauf veröffentlicht nichts.
- **Vitest auf Pull Requests einmal** in zufälliger, fester Reihenfolge; auf `main` und im Wochenlauf weiterhin zusätzlich in der gewöhnlichen Reihenfolge.
- **Browsertests in zwei Projekten** `kern` und `pwa` (beide Chromium), in der CI mit zwei Workern (gemessen 82 s → 52 s), gegen den eben erzeugten Build statt eines zweiten (`KI_LEAD_BUILD_VORHANDEN=1`), Chromium aus dem Cache der Actions.
- **Autospeichern ohne echte Wartezeit:** `takt()` in `tests/support/dom.ts` stellt unter `vi.useFakeTimers()` die gefälschte Uhr vor; `tests/ui/eingabehilfen.test.ts` nutzt das (10,4 s → rund 2,7 s). Geprüft wird weiterhin der tatsächlich gespeicherte Zwischenstand.
- Neue Befehle `npm run test:browser:kern`, `npm run test:browser:pwa` und `npm run test:inhalt`; [docs/TESTS.md](docs/TESTS.md) mit Abschnitt „Gestaffelte Prüfung“.

#### Tests

- `tests/ci/pruefumfang.test.ts` (neu, 31): Tabellenfälle für SOP, Arbeitsanweisungen, Dokumentation, Profiloberfläche, Code, PWA, Workflow und leere Liste; Aufruf als Skript; Wächter: genannte PWA-Dateien existieren, jede Quelldatei mit Service-Worker-Bezug löst die PWA-Browsertests aus, Zuordnung jeder `*.spec.ts`, keine Datei unter `src/`, `public/` oder `tests/` gilt als reiner Inhalt.

## [0.5.3] – 23.10.2026

Grundlage: Rückmeldung zum Schema „Thüringen“: Über dem Identitätsband stand der Kopf weiß, darunter die Arbeitsfläche im Farbton des Schemas. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, KI-Pipeline oder gespeicherten Daten.

### Geändert

- **Gleiche Hintergrundfarbe ober- und unterhalb des Identitätsbands:** In den Schemata „Bund“, „Bevölkerungsschutz“ und allen 16 Länderschemata übernimmt der Kopf (`header-hintergrund`) die Farbe der Arbeitsfläche (`papier`). Das Band steht damit auf einer durchgehenden Fläche; helle Bandstreifen (etwa Weiß im Thüringen-Band) bleiben sichtbar. Unverändert: „Neutral · Hell“, „Neutral · Night Mode“, „Kontrast · Hell“, „Kontrast · Dunkel“. Profilfarben können `header-hintergrund` weiterhin eigens setzen.

### Tests

- `tests/darstellung/farbschemas.test.ts` (+2): In allen Bund- und Länderschemata ist `header-hintergrund` gleich `papier`; Profilfarben können `header-hintergrund` weiterhin abweichend setzen.

### Nachtrag vom 24.10.2026 (ohne neue Versionsnummer)

Grundlage: Grundlagendokumente der Priorität 1 für den Testkreis (M6). Rechtsstand und Bedingungen der Anbieter am 24.10.2026 recherchiert, mit Quellen; keine Rechtsberatung. Keine Änderung an App, Profilen, SOPs, Arbeitsanweisungen, KI-Pipeline oder gespeicherten Daten.

- **[docs/DATENSCHUTZ.md](docs/DATENSCHUTZ.md):** Verantwortlichkeit (Herausgeber der Software; verantwortlich für die Verarbeitung in der App ist die nutzende Person oder Stelle), Speicherorte nach dem Code, Datenflüsse, Bedingungen von Anthropic und OpenAI (Aufbewahrung, kein Training, `store: false`), Übermittlung in die USA, Protokolle von GitHub Pages, Laufprotokolle, Schlüsselablage, Löschen; Anhänge mit Antworten für App Store und Google Play und einer Vorlage zur Schwellwertanalyse für testende Stellen.
- **[docs/KI-VERORDNUNG.md](docs/KI-VERORDNUNG.md):** Zweckbestimmung und Verwendungsgrenzen, Rollen, Ausnahmen nach Art. 2 Abs. 6, 8 und 12, Abgrenzung zu Anhang III Nr. 2 und Nr. 5 Buchst. d, Art. 50 mit Stand der Kennzeichnung, Art. 4, Fristen nach der Verordnung (EU) 2026/1744; Systemkarte mit Modellen je Stufe, menschlicher Aufsicht, Fehlerbildern aus der Abnahme M4 und Grenzen der Prüfungen.
- **[SECURITY.md](SECURITY.md) und [docs/SICHERHEIT.md](docs/SICHERHEIT.md):** vertraulicher Meldeweg über GitHub, unterstützte Versionen; schlankes Bedrohungsmodell mit vorhandenen und offenen Maßnahmen (Prompt-Injection, Schlüsselablage, Direktzugriff aus dem Browser, Content-Security-Policy, Profilintegrität, Service Worker, Lieferkette).
- **[docs/BARRIEREFREIHEIT.md](docs/BARRIEREFREIHEIT.md):** nach Art einer Erklärung zur Barrierefreiheit, ohne Konformität zu beanspruchen; geprüfter Stand, im Code geprüfte Lücken (Lagenradar, Screenreader, PDF), Rückmeldeweg, Einordnung nach BFSG und BITV 2.0.
- **Issue-Vorlagen** „Barrierefreiheit“ und „Datenschutz“ sowie Verweis auf den vertraulichen Meldeweg (`.github/ISSUE_TEMPLATE/`).
- **README:** Tabelle „Dokumentation“ und Abschnitt „Datenverarbeitung und Voraussetzungen“ verweisen auf die neuen Dokumente. **Spezifikation:** Nachtrag zu 0.5.3 (Abschnitte 1, 7, 8 und offene Punkte 7–13).

### Nachtrag vom 23.10.2026 (ohne neue Versionsnummer)

Grundlage: Prüfung der im Repository eingesetzten Programmiersprachen. Die Kodierung des Lagenradars nach Tief „Bernd“ für das App-Symbol ist abgeschlossen und muss nicht erneut berechnet werden. An der App ändert sich nur das Favicon im Browser; keine Änderung an Profilen, SOPs, Arbeitsanweisungen, KI-Pipeline oder gespeicherten Daten.

- **App-Symbole festgeschrieben:** `scripts/app-symbol.py` entfällt; das Repository enthält damit kein Python mehr und braucht kein Pillow. Die erzeugten Symbole und Startbildschirme für Web, iOS und Android bleiben unverändert als feste Dateien erhalten, Vorlage ist `public/icons/icon.svg`. Kodierung und Begründung stehen weiter in [docs/app-symbol.md](docs/app-symbol.md); Verweise in [docs/NATIV.md](docs/NATIV.md) und [docs/SPEZIFIKATION.md](docs/SPEZIFIKATION.md) angepasst.
- **Android-Vorlagentests entfernt:** `ExampleUnitTest.java` und `ExampleInstrumentedTest.java` aus der Capacitor-Vorlage (Paket `com.getcapacitor.myapp`) prüften nichts Eigenes; der Instrumented-Test erwartete die Kennung `com.getcapacitor.app` und wäre gegen `de.pereirawolf.kilead` gescheitert. Eigener Java- und Swift-Code beschränkt sich damit auf die Capacitor-Hülle.
- **Favicon im Browser:** `public/favicon.ico` (16, 32 und 48 Pixel, aus dem festgeschriebenen Symbol abgeleitet) ergänzt und in `index.html` und `reparatur.html` eingebunden. Damit zeigen auch Browser ohne SVG-Favicons (etwa Safari) und Lesezeichen- oder Verlaufsansichten, die nach `favicon.ico` fragen, das Lagenradar. Die Reparaturseite bindet jetzt wie die App zusätzlich das PNG-Favicon ein (bisher nur SVG). Die PWA hält die neue Datei vor; installierte Fassungen bieten deshalb einmal „Neu laden“ an.
- `tests/pwa/pwa.test.ts` (+1): Favicon-Verweise (ICO, SVG, PNG) auf App- und Reparaturseite, ICO-Datei mit drei Größen.
- `tests/nativ/projekt.test.ts`: Der Symboltest prüft jetzt, dass alle festgeschriebenen Symbol- und Startbilddateien für Web, iOS und Android vorhanden sind (bisher je eine Datei für iOS und Android).

## [0.5.2] – 23.10.2026

Grundlage: Meldung, dass https://pereirawolf.github.io/ki-lead/ seit 0.5.1 in Safari auf einem iPad leer bleibt (im privaten Fenster und in einem frischen Chrome lief die App). In Chromium nachgestellt mit einem Server wie GitHub Pages; Hintergrund und Schritte für Betroffene in [docs/STARTPROBLEME.md](docs/STARTPROBLEME.md). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, KI-Pipeline oder gespeicherten Daten.

### Behoben

- **Leere Seite nach einem Update der PWA:** Der Service Worker lud bei der Installation einer neuen Fassung seine Dateien über den HTTP-Cache. War dort noch die ältere `index.html` (GitHub Pages: zehn Minuten), geriet sie neben die neuen Programmdateien. Nach Ablauf des HTTP-Caches fehlte ihre Startdatei, und die App startete nicht mehr, auch nach Neustart. Jetzt lädt der Service Worker am HTTP-Cache vorbei und installiert nur eine stimmige Fassung; sonst bleibt die bisherige.
- **Gescheiterte Installation ohne Reste:** Bricht die Installation ab (etwa durch einen Netzfehler), entfernt sie ihren Cache wieder.
- **Keine ungefragte Übernahme:** Der Service Worker übernimmt nie von sich aus und lädt keine Fenster neu. Eine neue Fassung wird aktiv mit „Neu laden“ (nur dieses Fenster lädt neu; vorher reagierten alle Fenster auf den Wechsel) oder wenn alle Fenster geschlossen sind. Betroffene des Fehlers rufen die App nach der Veröffentlichung einmal auf, schließen alle KI-LEAD-Fenster und öffnen sie neu.

### Hinzugefügt

- **Reparaturseite** `reparatur.html` (eigenständig, ohne App-Bundle): entfernt nach Betätigung nur die Service-Worker-Registrierung von KI-LEAD und deren Caches (Präfix `ki-lead-`); IndexedDB, localStorage, fremde Registrierungen und Caches bleiben. Der Service Worker ersetzt sie nie durch `index.html`. Unter dem Service Worker von 0.5.0/0.5.1 ist sie nicht erreichbar; dort führt das Schließen aller Fenster nach der Veröffentlichung von 0.5.2 zur neuen Fassung.
- **Startprüfung** `start-pruefung.js` (klassisches Skript vor dem Hauptprogramm, ohne Inline-Code): Hinweis mit Weg zur Reparaturseite bei einem Ladefehler oder nach 20 Sekunden ohne Start; „Erneut laden“ übernimmt eine wartende Fassung, nur auf Klick; kein automatisches Neuladen.
- **Fehlergrenze an der Wurzel** (`src/ui/StartFehlergrenze.tsx`): Fehler beim ersten Zeichnen erscheinen als Hinweis statt als leere Seite.
- Der Build bricht ab, wenn `index.html` auf eine nicht vorgehaltene Datei verweist; `sw.js` wird ohne HTTP-Cache auf Aktualisierungen geprüft (`updateViaCache: "none"`).

### Tests

- `tests/browser/pwa-update.spec.ts` (10, neu): Fehler mit dem Service Worker von 0.5.1, Korrektur bei Update mit gültigem HTTP-Cache (danach Start nach Cache-Ablauf, erneut und offline), Installationsschutz bei fremder `index.html`, Wiederherstellung aus dem defekten Zustand mit erhaltenen IndexedDB-Daten und fremdem Cache, kein Neuladen eines noch laufenden Fensters mit ungespeicherten Eingaben, keine Übernahme durch Reste einer gescheiterten Installation, „Neu laden“ nur im anfordernden Fenster, Übernahme per Startprüfung nur auf Klick, Reparaturseite, Startprüfung ohne Neuladen. Gegenproben: Ohne `cache: "reload"` scheitert der Test zur Korrektur; mit dem Service Worker aus `3dd6df1` (automatische Übernahme) scheitern beide Regressionstests.
- `tests/pwa/pwa.test.ts` (+10): Verweise der `index.html`, unstimmige oder abgebrochene Installation samt Cache verworfen, keine Übernahme von sich aus, Neuladen nur im anfordernden Fenster, nur eigene Caches, Reparaturseite und Startprüfung ohne Datenzugriff und ohne automatisches Neuladen.
- `tests/ui/startfehler.test.ts` (2, neu): Fehlergrenze an der Wurzel.
- Nicht ausgeführt: WebKit/Safari (in der Entwicklungsumgebung nicht verfügbar).

## [0.5.1] – 23.10.2026

Fortsetzung von Meilenstein 5: native Projekte für iOS und Android und eine wählbare Ablage der API-Schlüssel. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata oder KI-Pipeline; bereits gespeicherte Schlüssel bleiben ohne Zutun gültig.

### Hinzugefügt

- **Ablage der API-Schlüssel wählbar** (Einstellungen): Gerätespeicher der App (Vorgabe, wie bisher), nur für diese Sitzung (nichts wird gespeichert) oder in der nativen App der Schlüsselbund des Systems (iOS-Keychain, Android-Keystore). Ein Wechsel zieht vorhandene Schlüssel mit um und entfernt sie aus der bisherigen Ablage; bei einem Fehler bleibt alles unverändert. Mehrere gleichwertige Wege statt einer festen Lösung, damit die App ohne einzelne Abhängigkeit nutzbar bleibt (`src/schluessel/ablage.ts`).
- **Native Projekte mit Capacitor 8.5** (MIT): `capacitor.config.json`, `ios/` (Swift Package Manager) und `android/` mit App-Kennung `de.pereirawolf.kilead`; Skripte `app:sync`, `app:ios`, `app:android`; Anleitung und Abnahmepunkte in [docs/NATIV.md](docs/NATIV.md).
- Schlüsselbund über `@aparajita/capacitor-secure-storage` 8.0.1 (MIT, Version fest), nur in der nativen App und erst bei Bedarf geladen: Präfix `ki-lead.`, ohne iCloud-Synchronisierung, unter iOS nur dieses Gerät und nur entsperrt.
- Native Symbole und Startbildschirme aus `scripts/app-symbol.py`; Android ohne Cloud-Sicherung der App-Daten, iOS mit Exportangabe zur Verschlüsselung.
- **Standard-Profil je Anbieter** (Einstellungen): In den Abschnitten „API-Schlüssel (Anthropic)“ und „API-Schlüssel (OpenAI)“ setzt „Standard-Profil wählen“ unter „Modelle und Aufwand“ Modell und Aufwand aller Aufgaben auf das Profil des Anbieters. Anthropic: S1 claude-haiku-5-5 (hoch), S2 Erfassung und Verdichtung claude-opus-5-5 (mittel), Reparatur und Management Summary claude-sonnet-5-5 (niedrig bzw. mittel). OpenAI: gpt-6-luna (hoch), gpt-6-astra (mittel), gpt-6.1-sol (niedrig bzw. mittel), wie in der Abnahme M4 erprobt. Die Schaltfläche nennt die Belegung und zeigt, welches Profil aktiv ist; übrige Einstellungen bleiben (`STANDARD_PROFILE`, `standardProfilAnwenden` in `src/pipeline/einstellungen.ts`).

### Tests

- `tests/schluessel/ablage.test.ts` (8, neu): bisherige Schlüssel gelten weiter, Verfügbarkeit je Umgebung, Umzug in die Sitzung und in den Schlüsselbund (Attrappe), Verweigerung außerhalb der nativen App, Fehler im Schlüsselbund, Rückfall bei nicht verfügbarer Wahl, Auswahl in den Einstellungen.
- `tests/pipeline/einstellungen.test.ts` (+3) und `tests/ui/einstellungen.test.ts` (+1): Standard-Profile nur mit Modellen des Anbieters und Preisangabe, Anthropic gleich den Vorgaben von App und Beispielprofil, nur Modell und Aufwand werden gesetzt, Anzeige des aktiven Profils, Wirkung in den Auswahlfeldern.
- `tests/nativ/projekt.test.ts` (5, neu): App-Kennung und Versionen in allen Projektdateien, Plugin auf beiden Plattformen eingebunden, Sicherung und Exportangabe, Symbole.

## [0.5.0] – 23.10.2026

Beginn von Meilenstein 5 (Spezifikation Abschnitt 9): KI-LEAD lässt sich als App installieren und startet nach dem ersten Aufruf ohne Netz. Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata, KI-Pipeline oder gespeicherten Daten.

### Hinzugefügt

- **Installierbare PWA:** Web-App-Manifest (`public/manifest.webmanifest`) mit relativem Start und Bereich, damit dieselbe Fassung unter GitHub Pages, pereirawolf.de und lokal läuft; App-Symbole (192, 512, maskierbar, SVG, Apple Touch): Lagenradar in den Farben des BBK-Farbschemas (Orange, Gerüst weiß, Innenfläche blau), ausgeprägt nach einer Kodierung der Lage bei Tief „Bernd“ 2021 ([docs/app-symbol.md](docs/app-symbol.md), Skript `scripts/app-symbol.py`).
- **Service Worker für den Offline-Start:** Der Build erzeugt `sw.js` mit der Liste aller ausgelieferten Dateien und einer Version aus App-Version und Prüfsumme (`src/pwa/precache.ts`, Vorlage `src/pwa/sw-vorlage.js`, Plugin in `vite.config.ts`, keine neue Abhängigkeit). Eigene Dateien kommen aus dem Cache; Anfragen an die KI-Anbieter fängt er nicht ab und speichert sie nie.
- **Hinweise:** Ohne Netz nennt ein Band, was weiter funktioniert und was eine Verbindung braucht. Eine neue Fassung wartet auf „Neu laden“, damit Seite und nachgeladene Dateien zusammenpassen.
- Anmeldung des Service Workers nur im Produktionsbuild, im sicheren Kontext und nicht in der nativen App (`src/pwa/registrieren.ts`).
- Spezifikation 0.5.0 (Umsetzung M5, Abschnitt 9), README (Installation als App).

### Tests

- `tests/pwa/pwa.test.ts` (8, neu): Dateiliste ohne Quellkarten und ohne sich selbst, Version, gültiges JavaScript nach dem Einsetzen, nur eigene GET-Anfragen, kein automatischer Fassungswechsel, Bedingungen der Anmeldung, Hinweise, Manifest und Symbole.
- `tests/browser/pwa.spec.ts` (2, neu): Offline-Start nach dem ersten Besuch mit Lagebild-Beispiel und PDF ohne Netz; Manifest, Symbole und `sw.js` werden ausgeliefert.

## [0.4.31] – 23.10.2026

Grundlage: technische Abnahme M4 vom 23.10.2026 (je drei Verdichtungen „Ilka“ mit Anthropic und OpenAI, [Ergebnis](evaluation/abnahmen/2026-10-23-m4-ergebnis.md)). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen, Schemata oder Modellvorgaben.

### Geändert

- **Schätzung von Dauer und Kosten:** Messwerte für OpenAI statt Hochrechnung über den Listenpreis: S1 `gpt-6-luna` „high“ bis 2 Minuten, bis 0,02 USD (gemessen 52–65 s, höchstens 0,008 USD); Verdichtung `gpt-6-astra` „medium“ 1–4 Minuten, 1,00–1,50 USD (gemessen 114–152 s, 1,18–1,23 USD). Verdichtung `claude-opus-5-5` „medium“ jetzt 1,20–2,20 USD statt 1,20–2,00 USD, weil die Abnahme bis 1,91 USD erreichte; Dauer und S1 Haiku „high“ unverändert (gemessen 428–459 s bzw. 101–136 s, 0,023–0,028 USD).
- Spezifikation 0.4.31 (Abschnitt 5.1, offener Punkt 6).

### Behoben

- **Rundung der Kostenangabe:** `kostenText` rundete Grenzen wegen Gleitkommafehlern um einen Cent nach außen (2,20 USD erschien als 2,21 USD, 0,29 USD als 0,28 USD). Die Rundung arbeitet jetzt mit einer kleinen Toleranz.

### Hinzugefügt

- Abnahme M4 unter `evaluation/`: Plan, Laufskript für Anthropic und OpenAI (`evaluation/abnahmen/m4.lauf.ts`, eigene Vitest-Konfiguration, nie Teil von `npm test`) und Ergebnis.

### Tests

- `tests/pipeline/schaetzung.test.ts`: Messwerte für gpt-6-luna und gpt-6-astra, neue Obergrenze der Opus-Verdichtung, Rundung an Centgrenzen.

## [0.4.30] – 22.10.2026

Grundlage: Lauf `20261022-073727-q2ex` (App 0.4.28). Die Vormeldung trug „Land: Thüringen“, der Auftrag verlangte, bearbeitende Stelle und Bezugsraum beizubehalten; die App setzte Land und meldende Stelle dennoch aus dem Profil („Bund“). Außerdem scheiterten zwei Seitenabrufe an selbst gebildeten Adressen (`url_not_in_prior_context`). Keine Änderung an Profilen, SOPs, Arbeitsanweisungen oder Schemata.

### Geändert

- **Absender aus der eigenen Vormeldung:** Liegt eine eigene Vormeldung bei, übernimmt die App deren Land und meldende Stelle in die neue Meldung, auch wenn der Entwurf die Profilangaben nennt. „Eigen“ heißt: Die meldende Stelle der Vormeldung ist die Stelle des Profils oder ein hinterlegter Zweitname (`eigene_stellen`). Bei mehreren eigenen Vormeldungen gilt die jüngste; abweichende Absender nennt ein Hinweis (`VORMELDUNG_ABSENDER_ABWEICHEND`). Eine als Vormeldung gewählte Meldung einer anderen Stelle ändert den Absender nicht; das Ergebnis warnt (`VORMELDUNG_FREMDE_STELLE`). Ohne Vormeldung gilt wie bisher das Profil.
- **Steuerungsblock:** nennt den Absender und seine Herkunft (gilt anstelle der Profilangaben in der Arbeitsanweisung) und bei erlaubtem Seitenabruf, dass nur Adressen aus Auftrag oder Material, aus Suchergebnissen und von bereits abgerufenen Seiten abrufbar sind. Andere Seiten soll die KI zuerst über die Websuche finden statt Adressen selbst zu bilden. Die Beschränkung selbst ist eine Vorgabe des Anbieters (Schutz vor Datenabfluss) und lässt sich in der App nicht aufheben.
- **Oberfläche:** Der Bestätigungsschritt zeigt „Absender: Land · Stelle (aus der eigenen Vormeldung | aus dem Profil)“.
- Spezifikation 0.4.30 (Abschnitt 5.1).

### Tests

- `tests/pipeline/fortschreibung.test.ts`: Absender aus der Vormeldung (Land Thüringen bei Bundesprofil), Zweitname der eigenen Stelle, fremde Meldung als Vormeldung, mehrere eigene Vormeldungen, Hinweis zum Seitenabruf.
- `tests/ui/fortschreibung.test.ts`: Absenderzeile im Bestätigungsschritt.

## [0.4.29] – 22.10.2026

Grundlage: PDF der Meldung aus Lauf `20261022-073727-q2ex` (App 0.4.28). Im Text „Bewertung & Tendenz“ war der Kennsatz „Änderung zur Vormeldung:“ mitten im Satz in zwei Absätze geteilt, und „→“ erschien als „!’“. Keine Änderung an Profilen, SOPs, Prompts, Schemata oder gespeicherten Meldungen.

### Behoben

- **Kennsatzzeilen bleiben ungeteilt:** Die Gliederung für PDF und Kopiervorlage setzte auch innerhalb einer Kennsatzzeile Absätze vor Signal-Satzanfängen, etwa vor „Beurteilung „erheblich“ → …“ im Kennsatz „Änderung zur Vormeldung:“. Ein Kennsatz reicht jetzt bis zum Zeilenende; ein Kennsatz mitten in einer Zeile beginnt weiterhin eine eigene Zeile, und außerhalb der Kennsätze gliedert die Ausgabe wie bisher.
- **Sonderzeichen im PDF:** Die Standardschrift des PDF (Helvetica, Windows-1252) kennt Zeichen wie „→“, „≥“ oder „⟦ ⟧“ nicht; jsPDF gab sie als Zeichensalat aus. Die App ersetzt sie jetzt in allen Tabellenzellen und Kopfzeilen lesbar („->“, „>=“, „[[ ]]“, schmale Leerzeichen als Leerzeichen); Buchstaben mit diakritischen Zeichen außerhalb des Zeichensatzes werden auf die Grundform zurückgeführt, übrige Zeichen durch „?“ ersetzt.
- Spezifikation 0.4.29 (Abschnitt 5.1, Export).

### Tests

- `tests/dokumente/pdf.test.ts`: Kennsatzzeile mit Signal-Satzanfängen bleibt eine Zeile, Ersatz der Sonderzeichen, Pfeil im erzeugten PDF als „->“.

## [0.4.28] – 22.10.2026

Grundlage: Lauf `20261022-060622-f7hb` (App 0.4.27, Profil 1.20.0), in dem eine eigene Meldung vom Vortag (t0 21.10.2026 19:40) auf den 22.10.2026 fortgeschrieben werden sollte, mit erlaubter Websuche. Befund: (1) S2 erhielt t0 als „Aktueller Zeitpunkt“ (21.10. 19:45 statt der tatsächlichen 22.10. 06:07) und hielt den Stichtag für Zukunft; (2) S1 schlug t0 kurz nach der Vormeldung vor, die App prüfte t0 nur bei Verdichtungen; (3) der Satz „nicht eine neue Recherche“ aus dem S1-Gegenstand blieb die einzige Aussage zum Arbeitsmodus, S2 suchte trotz angebotener Werkzeuge nicht (0 Websuchen, 0 Abrufe) und gab das als Vorgabe des Auftrags aus; (4) kein Befund machte das sichtbar. Profil, SOPs, Arbeitsanweisungen und Schema bleiben unverändert; die Steuerung liegt in der App. Die Originaldateien des Laufs sind nicht Teil des Repositorys; die Tests verwenden fiktives Material.

### Geändert

- **`{{jetzt}}` ist die Bearbeitungszeit:** Die Arbeitsanweisung in S2 erhält die tatsächliche Uhrzeit des Aufrufs, nicht mehr t0. t0 steht getrennt davon im Steuerungsblock.
- **Meldezeitpunkt t0 nach festen Regeln** (S1-Bereinigung): Vorgabe im Auftrag geht vor; Verdichtung wie bisher nach A.7 (mit Hinweis, wenn zugleich eine Vormeldung beiliegt und t0 vor dem heutigen Stichtag landet); Fortschreibung einer eigenen Vormeldung mit heutigem Stichtag: aktuelle Zeit, Hinweis bei mehr als 15 Minuten Abweichung vom S1-Vorschlag; sonst heutiger Vorschlag nur, wenn er nicht in der Zukunft liegt; zurückliegender Stichtag wie bisher mit Hinweis, wenn t0 nicht auf ihm liegt; Stichtag in der Zukunft wird zur Prüfung gestellt. Ein Vorschlag in der Zukunft wird durch die aktuelle Zeit ersetzt, auch bei Verdichtung, sofern der jüngste Eingang davor liegt. Maßgeblich ist der Stichtag aus dem Auftrag; schlägt S1 einen anderen vor, nennt die App das. Kalendertag und Uhrzeit werden echt geprüft (`gueltigerZeitpunkt`). Eine im Bestätigungsschritt gewählte Zeit korrigiert die App nicht mehr.
- **Steuerung durch die App (verbindlich):** neuer letzter Systemblock in S2 mit Bearbeitungszeitpunkt, t0, Stichtag, Stand einer eigenen Vormeldung und Recherchemodus aus dem Auftrag (erlaubt mit den wirksamen Höchstzahlen, nur Material, erlaubt ohne verfügbare Werkzeuge). Er geht Angaben in Gegenstand, Vormeldung und Material vor und verweist bei Fortschreibung auf A.8.1 und die Fristgrundlage in Teil A. Die bisherigen Zeilen zu t0, Vormeldung und Websuche in der Nutzeranfrage entfallen. Werkzeuge werden nur angeboten, wenn Recherche erlaubt ist und eine Höchstzahl über 0 liegt.
- **S1** erfährt den Recherchemodus im Auftrag. Die Feldbeschreibungen im S1-Schema sagen, dass t0 bei Fortschreibung auf heute die aktuelle Zeit ist und Arbeitsmodus und Zeitpunkte nicht in den Gegenstand gehören.
- **Redaktionsvermerke** erhalten S1 und S2 auch bei einer eigenen Vormeldung (Fristen, Kennsätze, Tendenzen), Überschrift „Vermerke der App aus dem Redaktionscheck des Materials“.
- **Ein ungültiges t0** sperrt im Bestätigungsschritt den Start von S2 mit sichtbarer Begründung; die Pipeline bricht zusätzlich vor dem Modellaufruf ab.
- **„Heute“ in der Zeitzone des Profils:** Die Maske belegt den Stichtag mit dem Tag in der Profilzeitzone vor (bisher Gerätezeit) und liest ihn beim Start von S1 neu, wenn er unverändert vorbelegt war (Seite über Mitternacht offen).
- **S3-Vervollständigung** erhält den Steuerungsblock nicht mehr (sie recherchiert nicht), aber t0 und Bearbeitungszeitpunkt im Zusatz.
- Der Steuerungsblock verwendet den Kennsatz „Änderung zur Vormeldung:“ aus der Darstellungsdatei des Profils.

### Hinzugefügt

- **Befunde zur Recherche** mit stabilem Feld `code`: `FORTSCHREIBUNG_OHNE_AKTUALISIERUNG` (Warnung: eigene Vormeldung, Recherche erlaubt, in S2 weder Websuche noch erfolgreicher Seitenabruf; gescheiterte Abrufe werden genannt), `FORTSCHREIBUNG_RECHERCHE_NICHT_NACHWEISBAR` (Hinweis: Nutzungszähler fehlen und keine Werkzeugblöcke dokumentiert), `RECHERCHE_NICHT_VERFUEGBAR` (Hinweis: Recherche erlaubt, beide Höchstzahlen 0). Kein automatischer Folgeaufruf, keine Zusatzkosten.
- **Oberfläche:** Vor S1 und vor S2 eine Zeile zum Recherchemodus mit Websuchen und Seitenabrufen (auch „in den Einstellungen nicht verfügbar“); am t0-Feld der Stand der Vormeldung „(Ausgangspunkt, nicht t0)“; im Ergebnis „Recherche in S2: n Websuchen, m Seitenabrufe“ bzw. „nicht nachweisbar“, mit derselben Zählung wie die Befunde.
- Spezifikation 0.4.28 (Abschnitte 4.4 und 5.1, Umsetzung M4).

### Tests

- `tests/pipeline/fortschreibung.test.ts` (neu): Fortschreibung auf heute mit getrennter Uhr für S1 und S2, Stichtag des Auftrags vor S1, Vervollständigung ohne Steuerungsblock, historisches t0 im Auftrag, manuelle Wahl, Toleranz, Vormeldung mit Eingang (A.7), Stichtag in der Zukunft, Seitenabruf als Recherche, gescheiterter Abruf, abgeschaltete Websuche, Höchstzahlen 0, fehlende Zähler, ungültiges t0 ohne Modellaufruf, Tageswechsel zwischen S1 und S2, Redaktionsvermerke für die Vormeldung.
- `tests/ui/fortschreibung.test.ts` (neu): Moduszeile und Stand der Vormeldung vor S2, Sperre bei unvollständigem t0, Recherchezeile und Warnung im Ergebnis.
- `tests/pipeline/kontext.test.ts`: Steuerungsblock in allen Modi, Feldbeschreibungen des S1-Schemas. `tests/kern/zeit.test.ts`: `gueltigerZeitpunkt`.
- `tests/pipeline/stufen.test.ts`: Der frühere Fall „t0 aus S1 bleibt unverändert“ prüft jetzt einen Vorschlag am heutigen Stichtag vor der Testuhr; neuer Fall für einen Vorschlag in der Zukunft. `tests/pipeline/verdichtung.test.ts`: Steuerungsblock und Bearbeitungszeit, t0 in der Zukunft. `tests/ui/modellwahl.test.ts`: neue Moduszeile. `tests/support/pipeline.ts`: Auftrag als `Partial<Auftrag>`, auch Stichtag und t0 überschreibbar.

## [0.4.27] – 21.10.2026

Grundlage: drei Verdichtungen „Ilka“ (sechs Eingänge, ohne Websuche) mit App 0.4.25 und der Ausgabegrenze von 128 000 Token: Läufe `20261021-163738-9s7d` und `20261021-164604-u1kb` (S1), `20261021-165220-1hmp` (S1 und S2 bis zur fertigen Meldung, schemakonform, ohne Reparatur). Keine Änderung am Verhalten der App außer der angezeigten Schätzung. Dazu das Beispielprofil 1.12.0 (SOP-Änderungen nach einer Cyber-Vorsorgelage vom 21.10.2026).

### Geändert

- **Schätzung vor dem Start, S1 mit Haiku „high“:** „bis 3 Minuten, bis 0,03 USD“ (Spanne 15–150 s, 0–0,03 USD) statt der vorläufigen „bis 3 Minuten, bis 0,05 USD“ aus 0.4.25. Gemessen: 88–95 s, 0,019–0,020 USD und 20 821–22 134 Ausgabetoken je Verdichtung, alle drei Läufe mit `end_turn` und vollständiger Zuordnung aller sechs Eingänge; Erfassungen bisher 18–37 s.
- **Schätzung S2 Verdichtung mit Opus „medium“:** Kosten 1,20–2,00 USD statt 1,20–1,75 USD; Dauer unverändert 5–9 Minuten. Gemessen: 408 s und 1,63 USD (50 071 Ausgabetoken, 80 118 Token neu in den Cache), bisher 298–410 s und 1,23–1,38 USD.
- Spezifikation 0.4.27 (Abschnitt 5.1, Umsetzung M2: Messgrundlage bis 21.10.2026).
- **Beispielprofil 1.12.0:** SOP-Sammelmappe 3.3.0 mit B15 2.1.0 (Vorsorgelagen und Schutzabschaltungen bei Schwachstellenwarnungen), C11 1.1.0 (öffentliche Informationsversorgung) und Teil A (A.3 „Teilzugriff“, A.4 „Fristgrundlage“). Einzelheiten im [Profilverlauf](profile/lead-beispiel/CHANGELOG.md).

### Tests

- `tests/pipeline/schaetzung.test.ts`: Spannen für S1 Haiku „high“ und Verdichtung Opus „medium“ mit festem Soll, Anzeige und Summe vor dem Start.
- `tests/pipeline/kontext.test.ts`, `tests/profil/profile.test.ts`, `tests/profil/profilansicht.test.ts`: Fassung von C11 jetzt 1.1.0.

## [0.4.26] – 21.10.2026

Grundlage: Anforderung vom 21.10.2026, die Einstellung zur Höchstzahl der Ausgabetoken für jeden KI-Aufruf zu verwenden. Keine Änderung an Profilen, SOPs, Prompts, Schemata oder Modellvorgaben.

### Geändert

- **„Einstellungen › Recherche“:** Das Feld „Höchstzahl Ausgabetoken (S2, S3)“ heißt jetzt „Höchstzahl Ausgabetoken (S1, S2, S3)“ und gilt für jeden KI-Aufruf der App: S1, S2 (Erfassung und Verdichtung), S3 (Vervollständigung und Reparatur) und die Management Summary. Vorgabe 128 000, zulässig 8 000 bis 128 000; ein leeres Feld setzt die Vorgabe (bisher 64 000). Ein Hinweis unter dem Feld erklärt Geltung und Wirkung.
- **S1** verwendet die Einstellung statt der festen Tabelle aus 0.4.25 (128 000 für Claude 5.5 und Fable 5.1, 16 000 für andere Modelle). Mit der Vorgabe ändert sich für Claude-Modelle nichts; für OpenAI-Modelle gilt in S1 jetzt wie in S2 der eingestellte Wert. Die Meldung bei Abbruch an der Grenze nennt den tatsächlich eingestellten Wert.
- **Management Summary:** bisher fest 16 000, jetzt der eingestellte Wert.
- Gespeicherte Einstellungen bleiben gültig; der interne Schlüssel `maxTokensErfassung` bleibt unverändert, eine Umstellung ist nicht nötig.
- Nicht betroffen ist die Schlüsselprüfung unter „Einstellungen“: Sie bleibt ein kleiner Testaufruf mit 64 (Anthropic) bzw. 400 (OpenAI) Ausgabetoken, damit sie nichts kostet.
- Spezifikation 0.4.26 (Abschnitt 5.1, Umsetzung M2).

### Tests

- `tests/pipeline/stufen.test.ts`: T01–T03 neu gefasst (Vorgabe 128 000, S1 folgt der Einstellung, für jedes Modell; Meldung nennt den gesetzten Wert).
- `tests/pipeline/kurzfassung.test.ts` (+1): Management Summary mit Vorgabe und mit abweichender Einstellung.
- `tests/ui/einstellungen.test.ts` (1, neu): Bezeichnung, Hinweis, Vorgabe und Grenzen der Eingabe.

## [0.4.25] – 21.10.2026

Grundlage: zwei Verdichtungen mit Haiku und Aufwand „high“ (Läufe `20261021-133605-75wi` und `20261021-133728-cvza`, sechs Ilka-Eingänge), die in S1 scheiterten, sowie der konsolidierte Vorschlag `2026-10-21_KI-LEAD_S1_Ausgabegrenze_Konsolidiert.json` aus zwei Vorschlägen gleichen Datums. Keine Änderung an Profilen, SOPs, Prompts, Schemata oder Modellvorgaben.

### Ursache

- S1 hatte eine feste Grenze von 16 000 Ausgabetoken. Bei Haiku 5.5 zählen Denk- und Antworttoken gemeinsam gegen diese Grenze. Beide Läufe endeten nach 69–72 s bei genau 16 000 Token mit `max_tokens`: einer nur mit Denkblock (Meldung „keinen JSON-Block“), einer mit 3 023 Zeichen abgebrochenem JSON („JSON unvollständig“). Die Meldungen nannten die Ursache nicht.

### Geändert

- **S1-Ausgabegrenze 128 000 Token** für `claude-haiku-5-5`, `claude-sonnet-5-5`, `claude-opus-5-5` und `claude-fable-5-1` (Höchstwert laut Herstellerdokumentation, nur genau diese Kennungen). Andere Modelle behalten 16 000. Modell und Aufwand bleiben unverändert (Vorgabe Haiku, „high“); die Grenze ist eine Obergrenze, berechnet wird nur die tatsächliche Ausgabe (Listenpreis Haiku: 128 000 Ausgabetoken kosten bei Prompts bis 100 000 Token rund 0,06 USD, darüber rund 0,32 USD). Die Grenze für S2 (`maxTokensErfassung`) wirkt nicht auf S1.
- **Ein Aufruf, keine automatische Wiederholung:** S1 startet direkt mit der vollen Grenze statt mit 32 000 und einem zweiten Versuch mit 64 000; so wird das Material nicht zweimal verarbeitet.
- **Verständlicher Abbruch an der Grenze:** Ohne vollständigen Vorschlag nennt die Meldung Grenze, Modell und Aufwand („S1 hat die Ausgabegrenze von 128.000 Token erreicht, bevor ein vollständiger Vorschlag vorlag …“); der Parserbefund steht nur ergänzend dahinter. Eine leere Antwort ohne `max_tokens` heißt „leere Antwort“, andere Abbruchgründe werden genannt. Das Laufprotokoll hält Grenze, Abbruchgrund, Nutzung, Kosten und eine Notiz fest; Auftrag und Material bleiben in der Maske.
- **Strukturprüfung vor der Bestätigung:** Nur ein JSON-Objekt mit mindestens einem Sachverhalt mit Titel geht zur Bestätigung; abgeschnittenes JSON wird nicht repariert, ein Teilvorschlag nicht übernommen. Endet ein technisch vollständiger Vorschlag an der Grenze, erscheint er mit Prüfhinweis zur Bestätigung. Nicht zugeordnete Eingänge zeigt die Bestätigung wie bisher an; die Person ordnet sie dort zu.
- **Schätzung S1 Haiku „high“:** vorläufig bis 3 Minuten und 0,05 USD statt „unter 1 Minute, bis 0,02 USD“, weil Verdichtungen schon bei 16 000 Token 69–72 s brauchten; nach der Abnahme anpassen.
- Spezifikation 0.4.25 (Abschnitt 5.1, Umsetzung M2).

### Tests

- `tests/pipeline/stufen.test.ts` (+16): Grenze je Modell und unabhängig von S2 (T01–T03), Abbruch nur mit Denkblock und mitten im JSON (T04, T05), strukturell unvollständige Vorschläge (T06), vollständiger Vorschlag an der Grenze (T07), übliche Bestätigung (T08), leere Antwort (T09), anderer Abbruchgrund, Protokoll (T14).
- `tests/anbieter/anthropic.test.ts` (+1, T13): `max_tokens` 128 000, `effort` high und Schema werden unverändert übertragen; Denken wird nicht abgeschaltet.
- `tests/ui/s1-grenze.test.ts` (1, neu): Meldung mit Grenze, Modell und Aufwand, Auftrag bleibt, genau ein Aufruf, Laufprotokoll mit Grenze und Notiz, ohne Schlüssel.
- `tests/pipeline/schaetzung.test.ts`: neue Spanne für S1 Haiku „high“.

### Offen

- Abnahme mit echten Läufen: dieselben sechs Ilka-Eingänge, Haiku „high“, drei Wiederholungen; festzuhalten sind Vollständigkeit, Zuordnung aller Eingänge, Ausgabetoken, Dauer, Kosten und Abbruchgrund. Die Offline-Tests belegen nur die Fehlerbehandlung, nicht den Erfolg mit 128 000 Token.

## [0.4.24] – 21.10.2026

Grundlage: Umsetzungsbeschreibung vom 21.10.2026 (`2026-10-21_KI-LEAD_Manuelle_LEAD-Eingabehilfen_Umsetzung_auf_main.json`), die einen Vorschlag gleichen Datums prüft und korrigiert. LEAD-Systematik, SOP-Regeln und -Inhalte, Kodierleitfaden, Arbeitsanweisungen und Meldungsschema sind unverändert.

### Hinzugefügt

- **LEAD-Eingabehilfen** unter den vier Analysefeldern und dem Text „Bewertung & Tendenz“: ein zugeklappter Bereich mit Schaltflächen, die vorhandene Satzanfänge und Kennsätze als Vorlage mit offenen Stellen ⟦…⟧ einfügen. Ohne KI, ohne API-Schlüssel, ohne Netzwerkanfrage.
  - **Nur vorhandene Satzanfänge:** Jede Vorlage beginnt mit einem Satzanfang aus den Gliederungsmustern oder den Kennsätzen des Profils; die Herkunft je Vorlage steht in der Umsetzungsbeschreibung. Kennsatzvorlagen folgen dem Fristformat aus A.4, dem Textbaustein aus A.7.2 und den Bestandteilen des Abschlusses aus A.8.2.
  - **Nur das Zielfeld ändert sich:** Beurteilung, Tendenz, Lagenradar, Quellenverzeichnis, Freigabe und andere Sachverhalte bleiben unverändert. „Beurteilung „…“:“ und „Tendenz „…“:“ übernehmen den gewählten Wert nur lesend und sind ohne gewählten Wert gesperrt (mit Grund).
  - **Einfügestellen:** Kernaussage vorn, Referenzraum und Begründungen vor dem Block der Kennsätze, sonst als neuer Absatz am Ende; Kennsätze als eigene Zeile am Textende in der Reihenfolge des Profils. Vorhandener Text wird nicht umformuliert oder umsortiert; nur die Leerzeilen um den eingefügten Absatz werden vereinheitlicht.
  - **Keine Dopplungen:** Eine vorhandene Kernaussage am Anfang und ein vorhandener Kennsatz werden angesprungen („Weitere Fristen in dieser Zeile ergänzen, die früheste zuerst.“). Steht ein Kennsatz nur im Fließtext, fügt die App nichts ein und weist darauf hin.
  - **Werte:** t0 kommt aus dem Meldezeitpunkt in der Form der Beispielmeldungen („t0: 14.10.2026, 10:15 Uhr“), der Kurzname aus dem Profil; der Referenzraum bleibt offen. Fehlt ein Wert, bleibt eine offene Stelle. Status (sieben Werte aus A.4) und Quelle (nur ein beim Einfügen noch vorhandener Marker `[Qn]`) ohne Vorauswahl.
  - **Bedienung:** Die erste offene Stelle des eingefügten Bausteins ist markiert, der Fokus liegt im Textfeld. „Einfügung rückgängig“ stellt den vorherigen Wert exakt wieder her, auch wenn ein Teil des Pfades vorher fehlte oder null war (bis 20 Einfügungen je Feld), und setzt den Fokus zurück ins Textfeld; nach einer Handeingabe ist es gesperrt und nennt den Grund. Der Verlauf gilt für die geöffnete Meldung, übersteht einen Wechsel der Ansicht und entfällt bei neuer oder geöffneter Meldung, Übernahme, Profilwechsel und geänderter Zahl der Sachverhalte. Ein Doppelklick fügt nur einmal ein.
  - **Barrierefreiheit:** Zugängliche Namen mit Feld und Sachverhalt, sichtbare und verknüpfte Hinweise, eine Live-Region je Feld (gleichlautende Meldungen werden erneut angesagt), vollständige Tastaturbedienung. Gesperrte Schaltflächen bleiben erreichbar (`aria-disabled`, sichtbar abgeschwächt wie gesperrte Schaltflächen) und sagen beim Betätigen ihren Grund an.
- **Offene Stellen ⟦…⟧:** Ausfüllhinweis je Feld in der Prüfung. Im Redaktionscheck zählt ein Kennsatz mit offener Stelle nicht als Vermerk (Abschluss, Änderung, Abweichung: „offen“; Neubewertung: fehlt), eine Frist mit offener Stelle gilt als „Angaben unvollständig“. Die Management Summary übernimmt keine offenen Stellen: Fristen erhalten „(Angaben unvollständig)“, offene Stellen in Kernaussage, Abschnitten und Kurztiteln der KI-Antwort werden entfernt und mit einem Prüfhinweis gemeldet.
- **Profilformat 1.16:** optionaler Abschnitt `feldhilfen` (`lead-feldhilfen/1`) mit Prüfung beim Laden; Fehler deaktivieren nur die Eingabehilfen. Spezifikation 0.4.24 (Abschnitt 5.1, S4).
- **Beispielprofil 1.11.0** mit 22 Vorlagen; SOP-Sammelmappe 3.2.4 (nur Gültigkeitsstand). Einzelheiten im [Profilverlauf](profile/lead-beispiel/CHANGELOG.md).

### Verworfen

- Die KI-Schreibhilfe aus dem ersten Stand dieses Pull Requests (Commit `27c8134`: Schaltfläche „KI-Unterstützung“, KI-Prüfstufen, Modellwahl für Feldhilfen) ist vollständig verworfen und nicht Teil der App. Ebenso entfallen die Satzanfänge „Erkenntnislücke:“, „Begründung der Beurteilung:“ und „Begründung der Tendenz:“ samt Gliederungsmustern, weil sie im Profil nicht belegt sind.

### Tests

- `tests/kern/feldhilfen.test.ts` (38, neu): Herkunft der Satzanfänge und Kennsätze mit festem Soll, Prüfregeln (auch Schreibweise der Werte), t0-Format, gesperrte Vorlagen, Status und Quelle, Einfügestellen, Markierung, Dopplungen, Ausfüllhinweise.
- `tests/profil/feldhilfen.test.ts` (2, neu): fehlerhafte Konfiguration deaktiviert nur die Eingabehilfen; Musterprofil ohne Eingabehilfen.
- `tests/lagebild/redaktionscheck.test.ts` (+2), `tests/pipeline/kurzfassung.test.ts` (+3): offene Stellen in Kennsätzen, Fristen und der KI-Antwort der Management Summary.
- `tests/ui/eingabehilfen.test.ts` (8, neu): zugeklappt und ohne Schlüssel bedienbar, keine KI-Schaltfläche, null Anbieteraufrufe und Abrufe, nur das Zielfeld ändert sich, Markierung, Rücknahme mit Fokus, bei fehlendem Pfad und bei null, gesperrte Vorlagen und Rücknahme mit angesagtem Grund, keine Dopplungen, Doppelklick, Verlauf beim Wechsel der Ansicht, bei neuer Meldung und bei geänderter Zahl der Sachverhalte.
- `tests/browser/eingabehilfen.spec.ts` (2, neu): Tastaturbedienung mit Fokus und Markierung, zugängliche Namen bei geöffneten Bereichen, keine Anfrage nach außen.

## [0.4.23] – 21.10.2026

Grundlage: Vorschläge einer weiteren KI zur Konsolidierung der Tests vom 21.10.2026 (`KI-LEAD_Tests_Konsolidierung_Vorschlaege_2026-10-21`, TEST-01 bis TEST-15), geprüft und übernommen wie unten beschrieben. **Keine Änderung am Verhalten der App**, an Vorgaben, Preisen, Profilen oder SOPs; nur die Versionsnummer ändert sich.

### Tests

- **Neu gegliedert nach Fachbereichen** (`tests/kern`, `profil`, `pipeline`, `anbieter`, `lagebild`, `dokumente`, `darstellung`, `ui`, `evaluation`, `browser`). Die Sammeldateien der Reviews (`korrekturen*.test.ts`), `standardwerte-testreihe`, `pipeline`, `kern`, `anbieter`, `openai`, `oberflaeche`, `erfassung-zeit-quellen` und `validierung` sind aufgeteilt. Alle 415 bisherigen Tests stehen unter unverändertem vollständigem Namen in der neuen Struktur; den Nachweis je Test enthält [docs/TESTZUORDNUNG.md](docs/TESTZUORDNUNG.md). Kennungen aus Reviews (F01–F13, RC, RV) bleiben im Namen, der Kopfkommentar jeder Datei nennt Review und Datum.
- **Gemeinsame Hilfen** unter `tests/support/`: Dateien und Profile (sortiert, Pflichtordner), Beispielmeldungen über ihr Kennzeichen statt über die Reihenfolge, skriptierter KI-Anbieter, SSE mit Teilung an Bytegrenzen, gefälschte Uhr für Wiederholungen, Speicherattrappe mit Schreibfehlern, DOM-Hilfen mit bedingtem Warten, Ajv-Referenzprüfer.
- **Schärfere Prüfungen:** Preisangaben der Schätzung werden tatsächlich geprüft; Nullable-Konvertierung für OpenAI mit festen Negativfällen statt `Math.random`; Ajv-Vergleiche mit benannten Varianten und unabhängigem Soll; SSE mit ausdrücklichem Soll.
- **Keine festen Pausen und keine echten Wartezeiten mehr:** Oberflächentests warten auf Zustände, Wiederholungen der Anbieter laufen mit gefälschter Uhr. Summe der Testzeit je Datei von rund 20 s auf rund 11 s.
- **Neue Fälle (28):** gemeinsamer Vertrag beider Anbieteradapter (Wartezeiten, Obergrenze für retry-after, kein Wiederholen bei Schlüssel oder fehlendem Guthaben, Abbruch vor dem Start, in der Wartezeit und im Strom); UTF-8 über Bytegrenzen, fehlendes Ende und Zeilenenden im Ereignisstrom; voller Gerätespeicher im Lagebild; API-Schlüssel je Anbieter getrennt; Schlüssel nie im Laufprotokoll; Zwischenstand bleibt beim Profilwechsel beim Profil; Schemata der Modellbewertung.
- **Browsertests mit Playwright** (`npm run test:browser`, nur Chromium, KI-Anbieter am Netzwerkrand simuliert, jede andere Anfrage nach außen wird abgebrochen): Meldung herunterladen und dieselbe Datei wieder öffnen, Lagebild mit Redaktionscheck und PDF, S1 bis zur Bestätigung, Abbruch, Wiederherstellung nach Neuladen, Speicherfehler, zugängliche Namen, Tastaturbedienung mit sichtbarem Fokus, erzwungene Farben. Neue Entwicklungsabhängigkeit `@playwright/test`.
- **Skripte:** `test:zufall` (zufällige, feste Reihenfolge), `test:ui`, `test:browser`; `pruefe-profile` prüft `tests/profil`. GitHub Actions führt zusätzlich `test:zufall` und die Browsertests aus.
- Beschreibung von Aufbau, Hilfen und Regeln: [docs/TESTS.md](docs/TESTS.md).

### Modellbewertung

- Neuer Ordner `evaluation/`: Vorgehen für die inhaltliche Bewertung von KI-Modellen getrennt von den Regressionstests (Plan vor dem Lauf, blinde Bewertung, Kriterien Belege, Zeit, Referenzraum, Unsicherheit, Radar, Empfehlungen, unbelegte Aussagen, Gesamturteil), Schemata für Fälle und Bewertungen, ein fiktiver Fall (Verdichtung Orkantief „Ilka“). Keine echten Läufe; keine urheberrechtlich geschützten Texte im Repository.
- Spezifikation 0.4.23 (Abschnitt 7).

## [0.4.22] – 21.10.2026

Grundlage: Anforderungen vom 21.10.2026 zur KI-Erfassung und zur Darstellung. Keine Änderung an Profilen, SOPs, Pipeline-Regeln oder Ausgaben.

### Geändert

- **„Modelle für diesen Lauf“ mit Aufwand:** Je Stufe stehen jetzt Modell und Aufwand nebeneinander („Standard: …“ an erster Stelle, dann niedrig bis maximal). Die Zusammenfassung nennt beides, z. B. „S2: claude-opus-5-5 (mittel)“. Die Wahl gilt nur für den Lauf, bleibt von S1 bis S2 erhalten und wirkt auch auf die Schätzung von Dauer und Kosten; das Laufprotokoll hält den Aufwand je Stufe fest. Gilt auch für die Management Summary.
- **Websuchen je Lauf:** Recherchiert der Lauf (Haken „Websuche und Seitenabruf erlauben“), lässt sich die Höchstzahl der Websuchen für S2 abweichend von den Einstellungen setzen (0–50, leer = Standard, 0 = keine Websuche). Die Hinweise vor S1 und vor S2 nennen den gewählten Wert.
- **Verdichtung:** Der Hinweis „Diese Funktion ist vorläufig; die vollständige Verdichtung folgt mit Meilenstein 4.“ entfällt.
- **Farbschema „Automatisch“** verwendet jetzt genau „Neutral · Hell“ oder „Neutral · Night Mode“ nach der Systemeinstellung hell oder dunkel (bei „mehr Kontrast“ wie bisher das Kontrastschema) statt der davon abweichenden Standarddarstellung. „Verwendet“ nennt das Schema, z. B. „Automatisch: Neutral · Night Mode (Systemeinstellung dunkel)“; ein Wechsel der Systemeinstellung wirkt ohne Neuladen.
- Spezifikation 0.4.22 (Abschnitte 5.1 und 5.4), `docs/farbschemas.md`.

### Tests

- `tests/modellwahl.test.ts` (+1, erweitert): Aufwand je Stufe und Websuchen je Lauf in der Oberfläche, Anfrage mit gewähltem Aufwand, Wahl bleibt bis S2, leeres Feld = Standard; `mitModellwahl` mit Aufwand und Grenzen der Websuchen.
- `tests/farbschemas.test.ts`, `tests/farbschemas-oberflaeche.test.ts`: „Automatisch“ ergibt dieselben Farben wie „Neutral · Hell“ bzw. „Neutral · Night Mode“.

## [0.4.21] – 21.10.2026

Grundlage: Testreihe der KI-Modelle vom 20.10.2026 (Auftrag „Ebola Nigeria“ als URL, drei S1- und drei S2-Varianten, 16 S1- und 13 S2-Läufe, verblindete Bewertung) mit zwei unabhängigen Prüfungen des Berichts und der Rohdaten. Konsolidierte Entscheidung: Die Umstellung der Erfassung auf Opus ist eine begründete Ermessensentscheidung, kein Ergebnis der vorab formulierten Auswahlregel (die keine Variante vollständig erfüllte). Ausschlaggebend ist die Recherche: Nur Opus mit Aufwand „medium“ rief bei gesperrter Auftrags-URL weitere Quellen erfolgreich ab (drei bis vier Seiten je Lauf, Sonnet und Opus „low“ keine) und belegte Zahlen mit Datenstand. Im ausgeglichenen 3×3-Raster: Opus „medium“ 4,67 Punkte (1,65 USD, 214 s), Opus „low“ 4,00 (0,56 USD, 76 s), Sonnet „medium“ 3,33 (0,35 USD, 69 s). Haiku „high“ bleibt in S1 vorläufig Vorgabe; einen Vorteil gegenüber „medium“ hat die Testreihe nicht gezeigt.

### Geändert

- **S2 Erfassung mit `claude-opus-5-5`** (Aufwand unverändert „medium“): Vorgabe der App (`APP_MODELLE.erfassung`), des Beispielprofils (1.10.0) und des Musterprofils (0.3.0). Eine Wahl unter „Einstellungen“ oder „Modelle für diesen Lauf“ geht weiter vor. Ein Lauf kostet damit etwa 1,40–2,30 USD und dauert 3–6 Minuten statt 0,15–0,60 USD und bis zu 3 Minuten. Verdichtung (Profil: Opus), S1 (Haiku, „high“) und S3 (Sonnet, „low“) bleiben unverändert.
- **Voraussichtliche Dauer und Kosten je Modell** statt fester Angaben („meist zwei bis sechs Minuten“, „einige Cent bis etwa einen US-Dollar“): Vor S1 nennt die App beide Stufen und die Summe, vor S2 die Stufe S2, während des Laufs die erwartete Dauer. Grundlage sind gemessene Spannen aus den Läufen vom 18. bis 20.10.2026, nach außen gerundet (`src/pipeline/schaetzung.ts`). Für nicht gemessene Modelle oder Aufwände rechnet die App nur die Kosten über den Listenpreis der ähnlichsten gemessenen Variante hoch und kennzeichnet sie als „grob, ohne Messwert“.
- **Lagenradar an der vorgesehenen Stelle:** Legt die KI das Radar eine Ebene zu hoch ab (in 4 von 13 Entwürfen der Testreihe, bisher jedes Mal ein Reparaturaufruf), setzt die App es vor der Schemaprüfung an `sofort.lagenradar` und vermerkt das im Prüfbericht. Nur bei eindeutiger Zuordnung: Das Schema kennt das Feld oben nicht, der Wert ist ein Objekt, und an der vorgesehenen Stelle steht nichts; ein vorhandener Wert wird nie überschrieben.
- **Warnung bei nicht abrufbarer Auftrags-URL:** Konnte S2 eine im Auftrag genannte Seite nicht abrufen (in der Testreihe zeit.de in allen 13 Läufen, „url_not_allowed“), nennt der Prüfbericht das als Warnung mit Grund und rät, den Inhalt als PDF oder Text beizufügen und S2 erneut zu starten.
- **Kennsätze im Fließtext:** Ein Kennsatz wie „Neubewertung bei:“, der nur mitten in einer Zeile steht, ergibt einen Ausfüllhinweis; Lagebild und Redaktionscheck erkennen Kennsätze nur am Zeilenanfang.
- **Beispielprofil 1.10.0:** Kodierleitfaden 1.2.2 mit einem Kurzbeispiel zu D8 bei Auslandslagen ohne deutsche Beobachtungsbasis (offen, nicht 0; Regel unverändert), SOP-Sammelmappe 3.2.3 (nur Gültigkeitsstand). Einzelheiten im [Profilverlauf](profile/lead-beispiel/CHANGELOG.md).
- Spezifikation 0.4.21 (Abschnitt 5.1), Profilformat-Beispiel.

### Tests

- `tests/standardwerte-testreihe.test.ts` (13, neu): Vorgaben; Radar-Umhängung (verschieben, nicht überschreiben, Nicht-Objekte, ohne Reparaturaufruf schemakonform); Zuordnung von Abruffehlern zur Auftrags-URL und Warnung; Kennsätze im Fließtext; Schätzung (Messwerte, Hochrechnung, unbekanntes Modell, Anzeige).
- `tests/erfassung-zeit-quellen.test.ts`: Versionsvergleich im Gültigkeitsstand numerisch („1.9.0“ vor „1.10.0“).

## [0.4.20] – 20.10.2026

Grundlage: Anforderung vom 20.10.2026, bei jedem Start einer KI-Stufe das Modell abweichend von der Standardeinstellung wählen und das Laufprotokoll schon nach S1 exportieren zu können. Baut auf 0.4.19 auf. Keine Änderung an Profilen, SOPs, Meldungen oder Ausgaben.

### Neu

- **Modell je Lauf wählen.** „Modelle für diesen Lauf“ (aufklappbar; die Zusammenfassung nennt die aktuelle Wahl) steht an jeder Startstelle einer KI-Stufe:
  - im Auftrag vor S1 für S1, S2 und S3 (Reparatur),
  - nach S1 beim Bestätigen noch für S2 und S3,
  - bei „S2 erneut starten“,
  - bei der Management Summary.

  Die Vorgabe steht als „Standard: …“ an erster Stelle; Modelle eines Anbieters ohne hinterlegten Schlüssel sind gekennzeichnet. Schlüsselprüfung und Datenhinweis („Die Inhalte gehen an …“) folgen der Wahl. Die Wahl gilt nur für den Lauf und wird nicht gespeichert; „Neue KI-Erfassung“ setzt sie zurück. Aufwand und übrige Einstellungen bleiben, wie unter „Einstellungen“ festgelegt. Das Laufprotokoll hält das verwendete Modell je Stufe fest.
- **Laufprotokoll schon nach S1:** „Laufprotokoll exportieren (S1)“ beim Bestätigen des Gegenstands; nach einem Abbruch oder Fehler in S1 steht der Export im Fehlerhinweis. Der Lauf erscheint nach S1 auch unter „Frühere Läufe“.

### Tests

- `tests/modellwahl.test.ts` (2, neu): Modellwahl je Lauf; S1 mit gewähltem Modell über eine Anbieter-Attrappe, Protokoll nach S1, S2-Modell vor dem Start änderbar.

### Nachtrag vom 21.10.2026 (Pull Request #18, ohne neue Versionsnummer)

- Beispielprofil 1.9.1: Ordner `sop/archiv/` entfernt (Sammelmappe 3.2.2), beide Fassungen bleiben im Git-Verlauf abrufbar. Die App ist unverändert; sie las das Archiv nie und bettet es weiterhin bei keinem Profil ein.

## [0.4.19] – 20.10.2026

Grundlage: Auswertung von sieben Laufprotokollen vom 18. bis 20.10.2026 (sechs Verdichtungen „Ilka“ mit Opus und Sonnet, eine Fortschreibung). Auffällig war nicht das Modell in S2, sondern Stufe S1: In vier von sechs Verdichtungen schlug S1 als t0 die aktuelle Uhrzeit vor, obwohl die Eingänge sechs Tage älter waren; S2 ließ daraufhin alle Radarachsen offen. In fünf von sechs Läufen trug S1 ohne Vorgabe im Auftrag eine Prüffrage ein, einmal eine Rückfrage an die Person. Ein S1-Aufruf erreichte 7 203 von 8 000 Ausgabetoken. Keine Änderung an Profil, SOPs und Schema.

### Geändert

- **S1 mit hohem Aufwand:** Die Vorgabe für die Rolle „vorverarbeitung“ ist jetzt „high“ statt „medium“ (Einstellungen, Fassung 3). Gespeicherte Einstellungen mit der alten Vorgabe „medium“ werden einmalig angehoben; eine andere bewusste Wahl bleibt stehen. Mehrkosten bei Haiku: Bruchteile eines Cents je Lauf.
- **S1 mit 16 000 Ausgabetoken** statt 8 000 (`MAX_TOKENS_S1`), damit S1 bei hohem Aufwand nicht abgeschnitten wird.
- **t0-Absicherung bei Verdichtungen:** Gibt der Auftrag keinen Meldezeitpunkt vor und liegt der Vorschlag aus S1 vor dem jüngsten Eingang oder mehr als 24 Stunden danach (`T0_SPIELRAUM_STUNDEN`), setzt die App t0 auf den jüngsten Eingang. Die Bestätigung zeigt das unter „Hinweise der App“ mit beiden Zeitpunkten; t0 bleibt dort änderbar. Erfassungen ohne Eingänge und ein im Auftrag vorgegebener t0 sind nicht betroffen.
- **Prüffrage aus S1 nur als Vorschlag:** Nennt der Auftrag keine Prüffrage, bleibt das Feld leer; eine von S1 vorgeschlagene Prüffrage erscheint darunter mit „Übernehmen“. Nennt der Auftrag eine, gilt wie bisher die von S1 geschärfte Fassung. Die Feldbeschreibung im S1-Schema sagt das jetzt ausdrücklich und verweist Rückfragen in die Hinweise.
- Laufprotokoll: Der S1-Vorschlag kann die neuen Felder `prueffrageVorschlag` und `appHinweise` tragen (optional, ältere Läufe bleiben lesbar).
- Spezifikation 0.4.19 (Abschnitt 5.1, Umsetzung M2).

### Tests

- `tests/pipeline.test.ts` (+8): S1-Aufruf mit Aufwand und Ausgabegrenze; t0-Absicherung (zu spät, zu früh, im Spielraum, Vorgabe im Auftrag, Erfassung ohne Eingänge); Prüffrage mit und ohne Vorgabe.
- `tests/einstellungen.test.ts` (5, neu): Vorgabe, Umstellung von Fassung 1 und 2, bewusste Wahl bleibt.

## [0.4.18] – 20.10.2026

Grundlage: Änderungsvorschläge „2026-10-20_KI-LEAD_Barrierefreiheit_Farbschemas_Aenderungsvorschlaege_65c278b“ (A11Y-01 bis A11Y-07), geprüft am Stand von 0.4.17 gegen die allgemeinen Anforderungen der [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (Erfolgskriterien 1.4.1, 1.4.3, 1.4.6, 1.4.11). Die Farbwerte der Kontrastschemata sind eigene Festlegungen; Paletten oder Bezeichnungen von Unternehmen oder Designsystemen werden nicht übernommen. Dazu Anforderungen vom 20.10.2026 zur Erfassung: Zeitfelder mit „Jetzt“, optionaler Uhrzeit und Zurücksetzen; Baukasten für Quellenzeilen. Keine Änderung an SOP-Regeln, SOPs und Bausteinen; im Beispielprofil (1.9.0) ist das Meldungsschema abwärtskompatibel erweitert (siehe unten).

### Neu

- **Zwei Kontrastschemata** unter „Einstellungen → Darstellung“, Gruppe „Kontrast“ [A11Y-01, A11Y-02]:
  - **Kontrast · Hell** (Schwarz auf Weiß) und **Kontrast · Dunkel** (Weiß auf Schwarz), eigene Graustufen und Signaltöne. Alle Textpaare einschließlich der Signalfarben erreichen mindestens 7:1, Konturen mindestens 3:1.
  - Ohne dekoratives Band, mit kräftigeren Rahmen (Eingaben, Chips, Stufen, Reiter 2 px; Hinweisfahnen mit Rahmen; gewählte Bewertung mit Innenrahmen; Schrittzähler der Meldung auf heller bzw. dunkler Fläche) und einem Radar ohne Füllung.
  - Eigene feste Signalpaletten gleicher Bedeutung für beide Kontrastschemata. Profilfarben bleiben auf Oberflächenrollen beschränkt; mit Kontrastbasis gilt auch für sie 7:1.
  - Mit dem Bevölkerungsschutz-Schema aus 0.4.17 umfasst der Katalog jetzt 22 Schemata.
- **„Automatisch“ folgt „mehr Kontrast“** [A11Y-04]: Ist im System „mehr Kontrast“ eingestellt (`prefers-contrast: more`), verwendet „Automatisch“ das passende Kontrastschema (hell oder dunkel nach System) und nennt das unter „Verwendet“. Die App übernimmt Änderungen der Systemeinstellung ohne Neuladen. Eine ausdrücklich gewählte Darstellung bleibt unberührt; „weniger“ oder „benutzerdefiniert“ lösen nichts aus.
- **Systemfarben** (`forced-colors`, z. B. Kontrastdesign von Windows) [A11Y-04]: Das System bestimmt die Farben, die App schaltet sie nirgends global ab. Hervorgehoben werden nur ausgewählte Navigation, Reiter, Segmente, Chips und Radarstufen (Systemfarbe `Highlight`). Marken und Hinweisfahnen erhalten einen Rahmen, Balken im Lagebild die Systemtextfarbe, das Radar zeichnet Linien in Systemfarben ohne Füllung, das Band entfällt.
- **Erfassung: Zeitfelder mit Schaltflächen.**
  - Datum und Uhrzeit stehen in getrennten Feldern; das Uhrzeitfeld ist erst nach dem Tag bedienbar.
  - „Jetzt“ setzt Tag und Uhrzeit auf die aktuelle Zeit in der Profilzeitzone, bei reinen Datumsfeldern „Heute“ den Tag.
  - „Nur Tag“ entfernt die Uhrzeit wieder, „Leeren“ setzt das Feld zurück.
  - Verlangt ein Feld eine Uhrzeit (Meldezeitpunkt), weist ein Hinweis auf eine fehlende Uhrzeit hin.
  - Gilt auch für den Meldezeitpunkt (t0) im Auftrag der KI-Erfassung.
- **Neues Widget `datum_uhrzeit`** (Tag, Uhrzeit optional). Im Beispielprofil 1.9.0 verwenden es Meldezeitraum (von, bis) und Eintritt eines Sachverhalts. Das Meldungsschema `LEAD-Meldung-v1` nimmt dort jetzt auch `JJJJ-MM-TTThh:mm` an (LEAD-Meldevorlage 1.1, abwärtskompatibel, keine Migration). Der Meldezeitpunkt verlangt weiterhin Tag und Uhrzeit.
- **Quellen: Baukasten für neue Zeilen.** Unter dem Quellenfeld lassen sich Kategorie (A, B, W, M, P aus dem Profil), Art und Zusätze per Klick kombinieren; eine Vorschau zeigt die Zeile, „Zeile anfügen“ setzt sie mit der nächsten freien Nummer ein und markiert den ersten Platzhalter zum direkten Überschreiben.
  - **Arten:** Allgemein (Vorlage des Profils), Online-Quelle (URL), Pressemitteilung, Lagebild/Lagebericht, Meldung aus dem Lagebild, Datensatz/Dashboard, Beitrag in sozialen Medien, Auskunft (Telefon, E-Mail), Dokument ohne URL.
  - Arten mit naheliegender Kategorie wählen sie vor (z. B. Pressemitteilung und Lagebild A, soziale Medien P, Auskunft B, Dokument W); die Kategorie bleibt änderbar.
  - **Meldung aus dem Lagebild:** Auswahl aus den im Lagebild gespeicherten Meldungen; die Zeile übernimmt Land, Stelle, Meldezeitpunkt, Entwurfsstatus und Dateiname in der Form des Kodierleitfadens (Abschnitt 5), z. B. `[Q2] A – Hessen, Hessisches Ministerium … (14.10.2026, 10:15 Uhr): Lagemeldung (behördenintern), Datei „…“ [Zugriff: 20.10.2026]`.
  - **Zusätze:** Datenstand, Paywall, nicht ausgewertet.
- Tests [A11Y-07]:
  - `tests/barrierefreiheit.test.ts` (4): Radarbeschreibung, Auswahl ohne Farbe, Systemfarbenregeln, Konturen im Kontrastschema.
  - `tests/farbschemas.test.ts` (+5): beide Kontrastschemata mit 7:1, Auflösung mit Systemeinstellung, Profilbasis mit 7:1, Anwenden und Rücksetzen von `data-kontrast`.
  - `tests/farbschemas-oberflaeche.test.ts` (+2): Editorvorschau mit Kontrastbasis, „mehr Kontrast“ in der App einschließlich Zurückschalten.
  - `tests/erfassung-zeit-quellen.test.ts` (11): Zeitwerte und Schema des Beispielprofils, Quellenzeilen je Art und Zusatz (mit Zugriffsdatum, ohne Hinweise der Quellenprüfung), erster Platzhalter, Bedienung in der Erfassungsmaske einschließlich unfertiger Eingaben und Meldung aus dem Lagebild, Gültigkeitsstand in Teil A gegen die Köpfe der Dokumente.

### Geändert

- **Auswahl nicht nur über Farbe** [A11Y-03]: Die aktive Hauptnavigation, der aktive Reiter im Lagebild, die gewählte Option in Auswahlfeldern (Segmente, auch Bewertungen) und die gewählte Radarstufe sind zusätzlich unterstrichen; die Hauptnavigation meldet die aktive Ansicht an Hilfstechnik (`aria-current`).
- **Lagenradar** [A11Y-05]: Der zugängliche Name nennt alle Achsen mit Wert, z. B. „D1 Räumliche Auswirkung / Impact-Raum: 4 von 6; …; D8 Dynamik: offen“, statt nur „Lagenradar“. „Offen“ bleibt von Stufe 0 unterschieden.
- Hinweistext der Darstellung: nennt das 7:1-Ziel und den Vorrang der Systemfarben. Die Option „Automatisch“ heißt jetzt „Automatisch (nach System: hell oder dunkel, bei „mehr Kontrast“ Kontrastschema)“.
- Quellenfeld: Die Schaltfläche „Eintrag anfügen“ ist im Baukasten aufgegangen („Zeile anfügen“ mit der Art „Allgemein“ ergibt dieselbe Zeile wie bisher).
- **Beispielprofil 1.9.0:** Meldungsschema (LEAD-Meldevorlage 1.1), Darstellungsdatei (`datum_uhrzeit` für Meldezeitraum und Eintritt), Arbeitsanweisung Erfassung 1.3.3 und Kodierleitfaden 1.2.1 (Uhrzeit nur bei belegter Uhrzeit) und SOP-Sammelmappe 3.2.1 (nur Gültigkeitsstand in Teil A). Einzelheiten im [Profilverlauf](profile/lead-beispiel/CHANGELOG.md).
- PDF-Ausgabe: Felder mit `datum_uhrzeit` erscheinen als „TT.MM.JJJJ“ bzw. „TT.MM.JJJJ, hh:mm Uhr“.
- Prüfung: Fehlt einem Zeitpunkt nur die Uhrzeit, meldet die Schemaprüfung „Uhrzeit fehlt (…, erwartet JJJJ-MM-TTThh:mm)“ statt „Format ungültig“.
- Dokumentation: [docs/farbschemas.md](docs/farbschemas.md) (Kontrastschemata mit Farbwerten und Kontrasten, Einschätzung der Vorschläge, offene Abnahmepunkte), Spezifikation Abschnitte 5.1 und 5.4, Profilformat 1.15 (`farbschema.basis` auch `kontrast-hell`/`kontrast-dunkel`, Widget `datum_uhrzeit`, Baukasten).

### Nicht übernommen

- **Fremde Fünffarbenpalette als Oberflächenschema** [A11Y-06]: Die vorgeschlagene qualitative Palette ist für voneinander unabhängige Datenreihen gedacht und liefert keine vollständigen Oberflächenrollen. Ihre hellste Farbe erreicht auf Weiß nur 1,8:1, keine 7:1; für die geordneten Schwereklassen fehlt ihr die Helligkeitsstufung. Für künftige Diagramme beschreibt die Doku stattdessen eine allgemeine Regel (eigene geprüfte Farben, immer mit Beschriftung, Marker oder Muster).
- **Eigene Themen je Farbsehschwäche** (Protanopie, Deuteranopie, Tritanopie): Nach WCAG 2.2, Erfolgskriterium 1.4.1, darf Information nicht allein über Farbe vermittelt werden. Ein solches Theme würde eine Sicherheit versprechen, die Farbe allein nicht bietet; die App setzt in jedem Schema auf Wörter, Unterstreichung, Konturen und Zahlen.
- **Formsymbole für Schwereklassen** (Raute, Dreieck, Kreis; A11Y-03, optional): Die Bewertungen stehen bereits überall als Wort; Symbole wären eine zusätzliche fachliche Kodierung und bleiben einer späteren Abstimmung vorbehalten.
- **`title`/`desc` mit eigenen IDs im Radar-SVG** (A11Y-05): Der zugängliche Name (`aria-label`) enthält die vollständige Wertetabelle und kann bei mehreren Radargrafiken nicht kollidieren.
- **Kontrastwahl beim ersten Start speichern** (A11Y-04): Stattdessen folgt „Automatisch“ der Systemeinstellung laufend. Wer „mehr Kontrast“ im System abschaltet, erhält die Standarddarstellung zurück.

### Hinweise

- Ohne Änderung der Systemeinstellungen und ohne eigene Schemawahl sieht die Oberfläche bis auf die Unterstreichung der aktiven Navigation, des aktiven Reiters, der gewählten Option in Auswahlfeldern und der gewählten Radarstufe aus wie in 0.4.17.
- Eine WCAG- oder BITV-Konformität wird nicht beansprucht. Offen sind die Sichtprüfung mit echtem Kontrastdesign unter Windows, Simulationen von Farbsehschwächen, 200 % Zoom und Prüfungen mit Betroffenen [A11Y-07].
- Meldungen mit Uhrzeit in Meldezeitraum oder Eintritt sind für Empfänger mit Beispielprofil 1.8.0 oder älter nicht schemakonform; Empfänger sollten auf 1.9.0 aktualisieren.

## [0.4.17] – 20.10.2026

Grundlage: Umsetzungsplan „2026-10-20_KI-LEAD_Farbschemas_Umsetzungsplan_65c278b“ (TH-01 bis TH-10, DN-01 bis DN-12), am Stand 65c278b geprüft und ergänzt um das Schema „Bevölkerungsschutz“. Keine Änderung an SOP-Inhalten, Arbeitsanweisungen oder Profilinhalten; Meldungsinhalte und Ausgaben sind bis auf die Dateinamen unverändert.

### Neu

- **Farbschema der Oberfläche** unter „Einstellungen → Darstellung“ [TH-01, TH-04, TH-05]:
  - **Auswahl:** Automatisch (bisherige Darstellung, hell oder dunkel nach System; Vorgabe), Neutral · Hell, Neutral · Night Mode, Bund, Bevölkerungsschutz (Orange und Blau des Zivilschutzzeichens), je ein Schema für alle 16 Länder sowie „Farben des aktiven Profils“.
  - **Gestaltung:** Die Landesfarben erscheinen als schmales Identitätsband unter dem Kopf und in den Aktionsfarben; die Arbeitsfläche bleibt hell.
  - **Bedienung:** Eine Vorschau zeigt Text, Link, Primärknopf, Auswahl und Signalfarbe. Die Auswahl wirkt sofort und gilt nach dem Neuladen ohne Aufblitzen, bei „Farben des aktiven Profils“ auch, bevor das Profil geladen ist.
- **Profilfarben** [TH-06, TH-07]:
  - Ein Profil kann in `profil.json` optional ein `farbschema` mitbringen (Basis aus dem Katalog, einzelne Farbrollen als `#RRGGBB`). Ein fehlerhaftes Farbschema ergibt eine Warnung, wird verworfen und sperrt das Profil nicht.
  - Unter „Eigene Farben für dieses Profil“ lassen sich Farben auf dem Gerät festlegen: Farbwähler und Hex-Feld, Vorschau und Kontrastprüfung. Sie sind an Profilschlüssel und Prüfsumme gebunden und lassen sich als Ausschnitt für `profil.json` kopieren.
- Katalog mit Herkunft, Quellen und Einschätzung je Palette: [docs/farbschemas.md](docs/farbschemas.md) [TH-10].
- Tests:
  - `tests/farbschemas.test.ts` (41): Katalog, Kontraste aller 20 Schemata, Vorrangregeln, Abwehr von CSS-Texten und unzulässigen Rollen, Anwenden und Rücksetzen, Profilimport.
  - `tests/farbschemas-oberflaeche.test.ts` (4): Auswahl, Ersatzdarstellung, eigene Farben, fehlerhaftes Profilfarbschema.
  - `tests/dateinamen.test.ts` (17): Beispiel der Anforderung, Vorlagenvarianten, Rückfall, Zeitzonen, Bereinigung, Sortierung.

### Geändert

- **Dateinamen: Datum immer vorn** [DN-01 bis DN-12]. Steuerzeichen werden entfernt, der Namensrumpf ist auf 150 Zeichen begrenzt:
  - **Meldungen:** `2026-10-20T20-31_LEAD-Meldung_Bund_THW_OV_Wesel_ENTWURF.pdf` statt `LEAD-Meldung_Bund_THW_OV_Wesel_2026-10-20T20-31_ENTWURF.pdf`, ebenso JSON, Management Summary, Protokoll und Feldauszug. Maßgeblich ist der Meldezeitpunkt. Die App setzt ihn unabhängig von der Stellung von `{meldezeitpunkt}` in der Vorlage nach vorn; ältere und importierte Profilvorlagen ergeben so ebenfalls das Datum vorn.
  - **Lagebild-PDF und -CSV:** `2026-10-20_Lagebild.pdf`.
  - **Redaktionsbericht:** `2026-10-20T08-00_Redaktionsbericht_Lagebild.json`.
  - **Laufprotokoll und Vergleich:** Erstellungszeitpunkt vor der unveränderten Lauf-ID.
  - **Notfallsicherung, Profilpaket und Lesetext-Downloads:** Exportzeitpunkt vorn.
  - **Zeitbasis:** Zeiten gelten in der Profilzeitzone; der Exportzeitpunkt wird je Aktion einmal erfasst. Paketinhalte, interne Pfade, Lauf-IDs und Importe bleiben unverändert.
- **Oberfläche: Farbrollen getrennt** [TH-03, TH-08]:
  - Text auf der Aktionsfarbe (`--auf-amt`), Links (`--link`), Fokus mit zweitem hellem Ring (`--fokus`, `--fokus-abstand`), Eingaberahmen mit mindestens 3:1 (`--eingabe-rand`), Kopfzeile, Lesebereiche der Profilansicht (`--lese-farbe`, `--lese-flaeche` statt Grün für „ok“) und Radarlinie (`--radar-linie`). In der Standarddarstellung („Automatisch“) ändern sich dadurch:
    - kräftigere Rahmen von Eingabefeldern, Chips und Radar-Stufen (mindestens 3:1),
    - ein zweiter heller Fokusring,
    - einige Texte auf heller Auswahlfläche in dunklerem Blau (Schrittnummer, Marken, Hinweisfahnen),
    - etwas dunklere Signalfarben „geringfügig“ und „erheblich“ (Kontrast, gleich in allen hellen Schemata),
    - dunklere Radarringe,
    - eine dunkle Browserleiste im Dunkelmodus.
  - Der orange Zähler am Redaktionscheck erreicht jetzt mindestens 4,5:1: im hellen Modus durch dunkleres Orange (vorher 4,41:1), im Dunkelmodus durch dunkle Schrift (vorher 2,3:1).
  - Die Kopfzeile der Meldungskarten im Lagebild ist nicht mehr halbtransparent.
  - Die Word-Kopiervorlage bleibt auch im Night Mode hell.
- Der automatische Dunkelmodus gilt nur ohne gewähltes Farbschema. Ein gewähltes Schema setzt alle Rollen einschließlich der Signalfarben selbst; die Browserleiste (`theme-color`) folgt dem Schema [TH-04].

### Nicht übernommen

- DN-03 (Dateinamenvorlagen der mitgelieferten Profile ändern): Die zentrale Namensbildung setzt das Datum ohnehin nach vorn. Eine Änderung von `meldung.ui.json` hätte neue Profilversionen und eine Anpassung des Gültigkeitsstands in Teil A der SOP-Sammelmappe erfordert.
- Beispiel-`farbschema` im Musterprofil (TH-06): Das Beispiel steht in der Dokumentation; die Profilinhalte bleiben unverändert.
- „Paket mit diesen Farben herunterladen“ (TH-07): Statt einer automatisch veränderten Paketkopie gibt es den kopierbaren Ausschnitt. Wer ihn übernimmt, erhöht die Profilversion bewusst selbst.

## [0.4.16] – 20.10.2026

Grundlage: Review „KI-LEAD_Redaktionscheck_Review_2026-10-20“ (Befunde RC02–RC08, Empfehlungen RV01–RV08; RC01 war mit 0.4.15 behoben), am Stand 7f727b4 nachvollzogen. Keine Änderung an SOP-Inhalten, Arbeitsanweisungen oder Profilinhalten; importierte Meldungen bleiben unverändert.

### Behoben

- Redaktionscheck: Fristen wurden nur neu eingestuft, wenn sich Meldungen, Profil oder Ausgabedatum änderten. Eine während der Sitzung fällige Frist blieb „vor der nächsten Ausgabe“. Jetzt wird im Modus „jetzt“ alle 30 Sekunden und bei Rückkehr zur Seite neu geprüft [RC02].
- Fristen wie „21.10.2026 um 08:00 Uhr“, „8 Uhr“ oder „8.30 Uhr“ wurden still auf 23:59 gesetzt. Sie werden jetzt gelesen. „24 Uhr“ bzw. „24:00“ gilt als Tagesende. Die Punktform („8.30“) gilt nur mit „Uhr“ als Uhrzeit, damit ein Folgedatum („20.10.2026, 21.10.2026“) oder ein Betrag nicht als Uhrzeit gelesen wird. Eine Zeitangabe in anderer Form („ab 08:00“) wird nicht geraten: Gewertet wird das Tagesende, mit Hinweis. Reine Datumsangaben zeigen „ohne Uhrzeit: Tagesende angenommen“ [RC03].
- Ein leerer Kennsatz „Abschluss im Lagebild:“ galt als Abschluss. Er unterdrückte Nachlauf- und Vollständigkeitshinweise und erschien grün. Leere Kennsätze (Abschluss, abweichende Bewertung, Änderung) und offene Abschlussangaben („nein“, „offen“, „nicht abgeschlossen“, „kein Abschluss“, „unklar“ …) sind jetzt eigene Befunde „Kennsatz ohne Inhalt/Aussage“. Sie verdecken keine Vollständigkeitsprüfung; bei Tendenz Entspannung schließt der Befund die Nachlauffrage ein (ein Befund statt zwei). Eine leere Zeile „Neubewertung bei:“ wird gemeldet [RC04].
- Quellen: Ein Text mit `[Q1]` und ein Quellenverzeichnis ohne lesbare Einträge erschienen unauffällig. Solche Verweise sind jetzt eine Warnung „nicht prüfbar“, auch in Meldungsmaske und Prüfansicht [RC05].
- Tendenzen: Stabilisierung und Verschärfung wurden als „gegenläufig“ bezeichnet, aber nicht gezählt. Jetzt heißen verschiedene Tendenzen „unterschiedlich“ (Information). „Gegenläufig“ gilt nur für Entspannung und Verschärfung, ist zu klären und wird gezählt [RC06].
- Ohne `beurteilung_hoch` im Profil prüfte der Redaktionscheck keinen Sachverhalt, während die Kennzahlen die beiden höchsten Schema-Stufen verwendeten. Beide nutzen jetzt dieselbe Regel; der Check weist die abgeleitete Schwelle aus [RC07].
- Fristen, Ausgabe und Prüfzeitpunkt wurden in der Gerätezeit gelesen. Ein anders eingestelltes Gerät bewertete dieselbe Frist um Stunden verschoben. Maßgeblich ist jetzt die Zeitzone des Profils (`variablen.zeitzone`, Standard Europe/Berlin), einschließlich Sommerzeitwechsel und Monatsende. Eine nicht lesbare nächste Ausgabe ergibt „Einstufung offen“ statt einer Ersatzzeit. Das gilt auch für die Fristen der Management Summary und die Vermerke an S1/S2 [RC08].

### Geändert

- Nächste Ausgabe mit optionaler Uhrzeit. Eine Frist vor der Ausgabe ist zeitkritisch, ebenso eine zeitgleiche. Eine Frist am Ausgabetag ohne bekannte Reihenfolge ist zu klären. Die Entwarnung lautet eng: „aus dieser Frist kein Anlass für eine frühere Weitergabe“ [RV01].
- Prüfstand „jetzt (laufend aktualisiert)“ oder „Stichtag“, z. B. für Übungen oder einen Rückblick. Der Stichtag wird mit dem Lagebild gespeichert. Damit er nicht unbemerkt weiterwirkt, ist er am Reiter („· Stichtag“) und durch einen Hinweis mit seinem Alter und „Auf ‚jetzt‘ umstellen“ sichtbar [RV01].
- Kopf des Redaktionschecks mit Zählung nach Einstufung (zeitkritisch, zu klären, Information). Gezählt wird jeder Befund einzeln, und die Zahlen ergeben sich aus der Befundliste. Dazu Abdeckung (ausgewertete und fremde Meldungen, nicht konfigurierte Regeln) und Sprungmarken mit Trefferzahl je Abschnitt; der Fokus folgt dem Sprung. Die Zahl am Reiter zählt jetzt auch leere Kennsätze, gegenläufige Tendenzen und nicht prüfbare Quellen [RV04, RV06, RV08].
- Abschnitt 4 heißt „Formale Vollständigkeit bei hoher Beurteilung“ und sagt, was geprüft wird: vorhandene Angaben, nicht die fachliche Tragfähigkeit. Leere Abschnitte sagen „Keine Befunde der automatischen Prüfungen dieses Abschnitts“ bzw. „Nicht geprüft“ bei fehlender Profilangabe [RV06].
- Befunde führen per „Meldung in der Liste zeigen“ zur markierten Meldung (nur lesen; die Meldungsmaske bleibt unberührt). Alle Schemaabweichungen sind lesbar: die ersten acht direkt, weitere aufklappbar statt nur gezählt [RV05].
- Zusammenhang: Die Vergleichstabelle zeigt den Stand je Meldung und die Tendenz. Der Textbaustein nennt je Aussage Sachverhalt und Stand und ist als Entwurf gekennzeichnet („nur verwenden, wenn derselbe Sachverhalt“). Gruppen ohne Abweichung heißen „Möglicher Zusammenhang“ [RV03].
- Mehrere Meldungen derselben Stelle: Der Hinweis sagt wie die Vermerke an S1/S2, dass eine jüngere Meldung ältere Angaben nur ersetzt, soweit sie denselben Gegenstand aktualisiert. Eigenständige Lagen bleiben nebeneinander gültig (statt „dann gilt die jüngste Meldung“) [RV02, teilweise].
- Exportknöpfe heißen „Lagebild als PDF“ und „Rohtabelle als CSV“ [RV07].
- Einstufungen sind auch ohne Farbe erkennbar (Text für Screenreader). Die Ansage nach Änderungen beschränkt sich auf die Zählzeile; die Knöpfe „Meldung in der Liste zeigen“ nennen ihren Bezug [RV08].

### Neu

- Redaktionsbericht als TXT und JSON: Prüfstand mit Zeitzone, Profil mit Prüfsumme, alle Meldungen mit Inhaltskennung und ob ausgewertet, Abdeckung und alle Befunde. Er dokumentiert den automatischen Check, keine fachliche Freigabe [RV07].
- Zeitmodul `kern/zeit.ts` (Wanduhrzeit in einer IANA-Zeitzone ↔ Zeitpunkt).
- Tests: `tests/redaktionscheck.test.ts` (38 Fälle zu RC02–RC08, RV01, RV03, RV04, RV06, RV07, darunter zwei Zeitzonen in getrennten Prozessen, Sommerzeitwechsel und Monatsende) und `tests/redaktionscheck-oberflaeche.test.ts` (6 Oberflächenfälle in jsdom: Fristablauf ohne Dateiänderung, Stichtag, Uhrzeit der Ausgabe, Übersicht und Sprungmarken, Sprung zur Meldung, Bericht).

### Nicht übernommen

- RV02 (Rolle je Meldung: aktuell, Vormeldung, Zusatz): Das braucht eine nachvollziehbare Zuordnung von Fassungen und ist eine eigene Produktentscheidung. Umgesetzt ist nur die zutreffende Formulierung des Hinweises.
- RV03 (Auswahl der Sachverhalte vor dem Baustein), RV04 (Filter) und RV05 (lokale Bearbeitungsstände mit Notiz): Sie bauen auf einem stabilen Befundmodell auf. `befundListe` liefert dafür jetzt die Grundlage.

## [0.4.15] – 20.10.2026

Grundlage: Code-Review „KI-LEAD_CodeReview_2026-10-20_2d49aca“ (Befunde F01–F13, Verbesserungen V03 und V04), vor der Umsetzung am Stand ca402d0 erneut nachvollzogen. SOP-Inhalte, Arbeitsanweisungen und Profilinhalte sind unverändert.

### Behoben

- Quellenprüfung: Ein Verweis mit sehr großer Nummer (ab 2^53, etwa `[Q9007199254740992]`) oder ein großer rückwärts geschriebener Bereich (`[Q100000000–Q1]`) hielt die Seite an. Bereiche umfassen jetzt in beide Richtungen höchstens 50 Nummern, und jede Eingabe wird in begrenzter Zeit gelesen [F01].
- KI-Erfassung: Eine Übergabe aus dem Lagebild wurde nach einem Profilwechsel unter dem neuen Profil erneut als Material übernommen. Eine Übergabe gilt jetzt nur für das Profil, unter dem sie entstand, wird genau einmal übernommen (auch im StrictMode) und beim Profilwechsel verworfen [F02].
- Lagebild: Meldungen, die vor Abschluss des ersten Ladens hinzugefügt wurden, verschwanden, sobald der gespeicherte Stand eintraf. Beide Stände werden jetzt zusammengeführt; ein verspätetes Ergebnis nach Wechsel wird verworfen. Scheitert das Laden, erscheint ein Hinweis mit „Erneut laden“, und der gespeicherte Stand wird nicht überschrieben [F03, F13].
- Schemaprüfung: Geerbte JavaScript-Namen wie `constructor` oder `toString` galten als vorhandene Felder. Zusatzfelder mit solchen Namen wurden bei `additionalProperties: false` übersehen, fehlende Pflichtfelder mit solchen Namen nicht gemeldet. Gezählt werden jetzt nur eigene Schlüssel [F04].
- Profilimport: Ein Manifest mit falschen Datentypen (etwa ein Objekt als `name`, eine Zahl als `sop.dateien`, `beispiele: [null]`) wurde aktiviert und scheiterte erst beim Anzeigen, oder der Import brach mit einer technischen Meldung ab. Das Manifest wird jetzt vor der weiteren Verarbeitung geprüft; Fehler nennen die betroffene Angabe. `null` bei optionalen Texten gilt weiterhin als fehlende Angabe [F05].
- Eignungsprüfung des Meldungsschemas: Werte bekannter Schlüsselwörter wurden nicht geprüft. `required` als Text galt als verwendbar, `properties: null` brach die Prüfung ab. Jetzt ergeben ungültige Werte, zyklische Verweise (auch über `allOf` oder `$ref` mit Nachbarschlüsseln) und eine Verschachtelung über 60 Ebenen lesbare Fehler. Bei der Prüfung von Meldungen bricht ein Zyklus mit einer Fehlermeldung ab statt mit einem Stapelüberlauf. **Achtung:** Schemata mit Formen älterer Entwürfe, die die Prüfung bisher still übergangen hat (`items` als Liste, `exclusiveMinimum: true`), werden jetzt abgewiesen. Bereits importierte Profile dieser Art erscheinen mit Befund in der Profilliste und lassen sich nicht aktivieren [F06].
- Redaktionscheck: Bei mehreren Zeilen „Handlungsrelevant bis“ in einem Sachverhalt wurde nur die erste ausgewertet; eine zweite, frühere Frist fehlte. Jede Zeile wird jetzt einzeln eingestuft, wie in der Management Summary. Lagebild-PDF, Kopiervorlage und Ausfüllhinweise berücksichtigen ebenfalls alle Zeilen. Das wirkt auch auf die „Vermerke aus dem Redaktionscheck“, die die KI-Erfassung bei der Verdichtung an S1 und S2 mitgibt. Bei mehreren Fristen enthalten sie mehr Zeilen, und die Zahl der Redaktionshinweise kann steigen [F07].
- Management Summary: Eine Änderung im Quellenverzeichnis, die die Herkunftsliste für die KI änderte (etwa ein anderer Herausgeber), ließ die gespeicherte Fassung als aktuell erscheinen. Der Änderungsnachweis umfasst jetzt Meldung, Herkunftsliste und Arbeitsanweisung. Bereits gespeicherte Fassungen erscheinen deshalb einmal als veraltet [F08].
- KI-Anbieter: Ein Abbruch kurz vor der Wartezeit vor einem neuen Versuch wirkte erst nach deren Ende (bis zu 60 Sekunden). Ein gemeinsamer Wartebaustein beendet bei bereits abgebrochenem Signal sofort und räumt Zeitgeber und Listener ab. Vor jedem Versuch wird das Signal geprüft [F09].
- PDF: Eine typfehlerhafte Meldung (etwa Sachverhalte als Text) ließ den PDF-Export ohne Datei und ohne Meldung scheitern. Das PDF enthält jetzt einen rot markierten Hinweis mit dem gefundenen Inhalt, statt die Angabe still zu übergehen. Fehler beim Erzeugen werden in Meldung und Lagebild angezeigt [F10].
- Kosten: Eine abgebrochene oder fehlgeschlagene Stufe ging mit 0 USD in die Summe ein. Sie gilt jetzt als nicht erfasst, außer es fehlte der API-Schlüssel und es wurde nichts gesendet (dann 0). Auch ein HTTP-Fehler zählt als nicht erfasst, weil er erst nach bereits berechneten Runden (Fortsetzung, Neustart) kommen kann. Der Lauf zeigt in diesem Fall „mindestens … (nicht alle Stufen erfasst)“ [F11].
- OpenAI: Die Umwandlung in ein strenges Schema machte optionale Felder mit `enum`, `const`, `$ref` oder `anyOf` nicht wirklich mit `null` belegbar. Solche Felder erhalten jetzt `anyOf: [Feld, null]`. Die derzeit gesendeten Schemata waren nicht betroffen [F12].
- Gerätespeicher: Lese- und Schreibfehler beim Start und bei Einstellungen blieben unbehandelt. Wenn importierte Profile nicht lesbar waren, fehlten auch die mitgelieferten. Jetzt bleiben mitgelieferte Profile verfügbar, ein einzelnes defektes Profil verdeckt die übrigen nicht, und Fehler beim Lesen oder Speichern von Einstellungen, Schlüsseln, Zwischenstand, Startprofil, Laufprotokollen (Speichern, Ändern, Löschen, Liste früherer Läufe) und gespeicherter Management Summary werden angezeigt [F13].

### Geändert

- Die PDF-Ausgabe wird erst bei Bedarf geladen, schon beim Zeigen auf eine PDF-Schaltfläche oder bei deren Fokus. So bleibt der Download auch in Safari eine Folge des Klicks. Das Haupt-JavaScript sinkt von rund 1,54 MB auf 1,12 MB, die Warnung zur Chunkgröße entfällt. Fehlt der nachgeladene Teil nach einer Neuveröffentlichung, greift das Neuladen über `vite:preloadError` aus 0.4.14 [V04].
- GitHub Actions: Jeder Pull Request und jeder Zweig hat eine eigene Concurrency-Gruppe. Ein Push auf einen Pull Request bricht keine Prüfung oder Veröffentlichung eines anderen Zweigs mehr ab. Auf `main` wird kein laufender Durchgang abgebrochen; ein noch wartender wird, wie bei GitHub üblich, durch einen neueren ersetzt. Die Veröffentlichung läuft in der Gruppe `pages`, ohne laufende Veröffentlichungen abzubrechen. Schreibrechte für Pages erhält nur der Veröffentlichungsjob [V03].

### Neu

- Komponententests der Oberfläche mit jsdom (`tests/oberflaeche.test.ts`, neue Entwicklungsabhängigkeit `jsdom`): Übergabe beim Profilwechsel, Laden des Lagebilds, Start bei gestörtem Gerätespeicher.
- Regressionstests zu F01 und F04–F12 (`tests/korrekturen-2026-10-20.test.ts`).

### Nicht übernommen

- V01 (Laufkonfiguration als unveränderlicher Snapshot): Das Laufprotokoll hält das tatsächlich verwendete Modell schon je Stufe fest. Ein Wechsel zwischen S1 und S2 kann gewollt sein.
- V02 (gemeinsame Importbudgets): Grenzen je Datei bestehen. Ein Gesamtbudget vor S1 bleibt als eigene Ergänzung offen.
- V05 (Signaturfragmente anhängen): Das offizielle Anthropic-SDK ersetzt die Signatur bei `signature_delta` ebenfalls. Das bisherige Verhalten entspricht dem.

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

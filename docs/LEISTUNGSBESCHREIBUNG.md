# KI-LEAD – Muster einer Leistungsbeschreibung (Lastenheft) für die Überführung in einen Wirkbetrieb

Fassung 0.2 vom 09.11.2026, gilt für App-Version 0.7.14 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Dieses Muster beschreibt, was eine Stelle beauftragen kann, um KI-LEAD in einen Wirkbetrieb zu überführen. Es folgt den Stufen, Arbeitspaketen und dem Betriebsmodell in [UEBERFUEHRUNG.md](UEBERFUEHRUNG.md). Felder in eckigen Klammern füllt die Stelle selbst.

**Lastenheft und Pflichtenheft:** Das Muster formuliert Anforderungen, also was die Stelle verlangt. Verbindlich sind die Grundsätze in Abschnitt 4.1. Der Referenzstand in Abschnitt 4.2 beschreibt die heutige Lösung; davon darf der Auftragnehmer begründet abweichen. Wie die Anforderungen umgesetzt werden, legt der Auftragnehmer im Pflichtenheft fest, das er auf Grundlage von L1 erstellt.

KI-LEAD ist ein **privates Forschungsvorhaben**. Das Muster ist keine Vorgabe einer Behörde oder Einrichtung ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 6), **keine Rechtsberatung** und hat keine rechtliche Verbindlichkeit. Es ersetzt nicht die Muster und Vergabeunterlagen der Stelle. Verfahrensart, Vertragstyp, Eignungs- und Zuschlagskriterien legt die Stelle fest. **Lizenz:** Das Muster steht nach Wahl auch unter CC0 1.0 ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 2 f). Eine Stelle kann es ohne Namensnennung übernehmen, ändern und weitergeben.

---

## 1. Ausgangslage

[Stelle] beabsichtigt, die Software KI-LEAD für die Lageerfassung, -auswertung und -darstellung nach der LEAD-Systematik in einen Wirkbetrieb zu überführen. KI-LEAD ist ein quelloffener Forschungsdemonstrator (EUPL-1.2), veröffentlicht unter https://github.com/pereirawolf/ki-lead.

**Referenzstand:** Version [0.7.14], Commit [fd452dc], Spezifikation in der Fassung dieses Commits ([SPEZIFIKATION.md](SPEZIFIKATION.md)). Der Referenzstand ist Bestandteil dieser Leistungsbeschreibung. Was dort als umgesetzt gilt, ist vorhanden; was nicht nachgewiesen ist ([UEBERFUEHRUNG.md](UEBERFUEHRUNG.md), Abschnitt 1), ist Prüf- oder Entwicklungsauftrag.

## 2. Ziel

Eine wartbare, geprüfte und betriebsfähige Fassung von KI-LEAD, die

- den Kernumfang nach Abschnitt 6 erfüllt,
- die Grundsätze nach Abschnitt 4.1 einhält und
- die Nachweise für Informationssicherheit, Datenschutz, Barrierefreiheit und KI-Verordnung ermöglicht.

## 3. Gegenstand und Abgrenzung

**Gegenstand:** die Leistungen L1 bis L5 nach Abschnitt 5. L1 ist gesondert beauftragbar. L2 bis L4 lassen sich stufenweise mit Abnahmen nach Abschnitt 9 beauftragen, L5 und die Optionen O1 und O2 nach Wahl der Stelle.

**Nicht Gegenstand:**

- fachliche Weiterentwicklung und Freigabe der LEAD-Systematik, der SOP, des Kodierleitfadens und der Profile;
- Verfassen des Kontrollsatzes, fachliche Bewertung der KI-Ergebnisse und Festlegung der Qualitätsschwellen;
- Schutzbedarfsfeststellung, Risikobehandlung und Freigaben;
- Beschaffung der Hardware und Betrieb des Rechenzentrums.

Diese Aufgaben liegen bei der Stelle (Abschnitt 8).

## 4. Rahmenbedingungen

### 4.1 Verbindliche Grundsätze

| Nr. | Grundsatz | Grund |
|---|---|---|
| G1 | **Dezentral:** kein zentraler Anwendungsserver, keine zentrale Datenhaltung, keine zentrale Benutzerverwaltung; keine Lösung darf solche Infrastruktur als Voraussetzung einführen | Resilienz, Datenhoheit |
| G2 | **Arbeit ohne KI:** Erfassung, Prüfung, Auswertung, Ausgabe und Export bleiben ohne KI vollständig nutzbar | Resilienz |
| G3 | **KI im Bereich der Stelle:** offene Modelle im Rechenzentrum der Stelle; lokal auf Geräten, soweit L3 die Machbarkeit belegt. Cloud-Anbieter sind [nicht vorgesehen / nur nach gesonderter Freigabe zulässig] | Datenschutz, Leistung, Resilienz |
| G4 | **Austauschformat:** Meldungen im Format LEAD-Meldung-v2 ([LEAD-MELDUNG-V2.md](LEAD-MELDUNG-V2.md)) in der von der Stelle festgelegten Fassung; Austausch über Dateien | Interoperabilität |
| G5 | **Quelloffenheit:** Änderungen am bestehenden Code bleiben mit der EUPL-1.2 vereinbar | Lizenz, Nachnutzung |
| G6 | **Menschliche Aufsicht:** KI-Ausgaben sind Entwürfe, gekennzeichnet und durch eine Person freizugeben | KI-Verordnung, fachliche Verantwortung |
| G7 | **Schutzbedarf:** [normal / hoch]; Verschlusssachen sind nicht Gegenstand. Informationssicherheit nach [IT-Grundschutz des BSI / Vorgaben der Stelle]; keine Telemetrie | Informationssicherheit |
| G8 | **Datenschutz:** DSGVO und [Landesdatenschutzgesetz]; Daten nur auf dem Gerät und in den von der Stelle bestimmten Ablagen | Datenschutz |
| G9 | **Barrierefreiheit:** [BITV 2.0 / Landesrecht] in Verbindung mit EN 301 549 | Barrierefreiheit |

### 4.2 Referenzstand (Abweichung begründet im Pflichtenheft zulässig)

| Nr. | Heutige Lösung |
|---|---|
| T1 | Auslieferung als statische Dateien mit Betreiberkonfiguration zur Build-Zeit ([BETRIEB.md](BETRIEB.md)) |
| T2 | Anbindung der Inferenz über eine OpenAI-kompatible Schnittstelle („Endpunkt der Stelle“), lokal über Ollama |
| T3 | installierbare Web-App (PWA) mit Offline-Start; native Apps über Capacitor (Option O1) |
| T4 | TypeScript und React; Tests mit Vitest und Playwright ([TESTS.md](TESTS.md)) |

## 5. Leistungen

Die Arbeitspakete und Orientierungswerte entsprechen [UEBERFUEHRUNG.md](UEBERFUEHRUNG.md), Abschnitt 4. Querschnittlich gehört zu jeder Leistung die Projektsteuerung.

### L1: Prüfung des Bestands (gesondert beauftragbar)

- Architektur, Modularität, technische Schulden, Abhängigkeiten
- Aussagekraft der Tests: Abdeckung, Stichprobe durch Mutationstests, Lücken
- Sicherheit: statische Analyse, Prüfung des Bedrohungsmodells ([SICHERHEIT.md](SICHERHEIT.md))
- Übereinstimmung von Spezifikation und Implementierung

**Ergebnis:** Prüfbericht mit priorisierten Befunden; Bewertung von Weiterentwicklung, Teilneubau und Neubau nach Kosten, Projektrisiko, Wartbarkeit und Nutzung des Bestands; Schätzung für L2 bis L4; Entwurf des Pflichtenhefts.

### L2: Konsolidierung

- Behebung der Befunde nach Priorität aus L1
- reproduzierbarer und signierter Release-Prozess mit Stückliste (SBOM)
- dokumentierte Entwicklungs- und Testumgebung
- Ergänzung der Tests; Abdeckung mindestens [Werte; Orientierung: Mindestwerte in TESTS.md]

**Ergebnis:** Release-Basis mit Übergabedokumentation.

### L3: KI-Betrieb und Pilot

- Anbindung der Inferenz im Rechenzentrum; Rückfall auf lokale Inferenz oder Arbeit ohne KI nach N2
- **Machbarkeitsprüfung lokaler Inferenz** je Plattform und Geräteklasse: Modellgröße, Arbeitsspeicher, Laufzeit, Energieverbrauch, Eignung je Stufe. Ergebnis kann sein, dass lokale Inferenz nur für bestimmte Geräte oder gar nicht vorgesehen wird
- Auswahl offener Modelle je Stufe (S1 bis S3, Verdichtung, Kurzfassung) mit Begründung
- Anpassung von Arbeitsanweisungen und Profilen, in Abstimmung mit der Stelle
- Qualitätsnachweis nach Abschnitt 7.1
- Prüfung ausgetauschter Meldungen nach F12
- konfigurierbare Laufprotokolle nach F10
- Begleitung des Pilotbetriebs über [Dauer] mit Fehleranalyse und Nachbesserung

**Ergebnis:** Pilotfassung, Bericht zur Machbarkeit lokaler Inferenz, Bericht zur Ergebnisqualität, Pilotbericht.

### L4: Wirkbetrieb

- Penetrationstest durch [unabhängige Dritte / den Auftragnehmer mit Nachweis der Unabhängigkeit] und Behebung der Befunde
- Barrierefreiheitsprüfung nach G9 und Behebung der Befunde
- Verteilung über [Webserver der Stelle / Mobilgeräteverwaltung]; Installations-, Update- und Wiederherstellungsverfahren
- Betriebs-, Administrations- und Anwenderhandbuch, Schulungsunterlagen
- Zuarbeit zu Sicherheitskonzept, Schwellwertanalyse und gegebenenfalls Datenschutz-Folgenabschätzung sowie zur Einordnung nach der KI-Verordnung
- Übergabe nach Abschnitt 10

**Ergebnis:** betriebsfähige Fassung mit Prüfberichten und Übergabe.

### L5: Pflege (optional)

- technische Pflege: Fehlerbehebung, Sicherheitsupdates, Aktualisierung der Abhängigkeiten, Kompatibilität mit Browsern und Betriebssystemen
- Modellpflege: Bewertung neuer Modellfassungen am Kontrollsatz vor dem Wechsel
- Funktionsausbau nur auf gesonderten Abruf
- optional: Reaktionszeiten [ ], Service-Level [ ], Release-Rhythmus [ ]

### Optionen

- **O1 native Apps:** Abnahme der Apps für iOS und Android auf [Geräteliste], Verteilung über [Mobilgeräteverwaltung / App-Stores].
- **O2 Recherchedienst:** Websuche und Seitenabruf im Rechenzentrum der Stelle mit Protokollierung und Begrenzung der Ziele. Ohne O2 arbeitet die KI nur mit bereitgestelltem Material.

## 6. Funktionale Anforderungen

Kern = für einen ersten Wirkbetrieb erforderlich; Option = nach Wahl der Stelle.

| Nr. | Anforderung | Umfang |
|---|---|---|
| F1 | Erfassung einer Meldung nach Profil mit Schema- und Redaktionsprüfung | Kern |
| F2 | KI-Erfassung in den Stufen S1 (Gegenstand bestätigen), S2 (Entwurf), S3 (Prüfung mit begrenzter Korrektur); Bestätigung durch die bearbeitende Person | Kern |
| F3 | Auswertung und Zusammenführung von Meldungen mehrerer Stellen; Lagebild mit Meldestatus, Sachverhalten nach Schwere und Lagenradar | Kern |
| F4 | Verdichtung ausgewählter Meldungen zur eigenen Meldung mit Quellennachweis | Kern |
| F5 | Kurzfassung für die Leitung mit Übernahme von Beurteilung, Tendenz und Fristen aus der Meldung | Kern |
| F6 | Zeitstrahl je Sachverhalt mit fortgeschriebener Sachverhaltskennung | Kern |
| F7 | Profile: Laden mit Prüfsumme, Lesen von Anweisungen, Kodierleitfaden und SOP in der App | Kern |
| F8a | Import von JSON und ZIP; Ausgabe als JSON und PDF | Kern |
| F8b | Import von TXT, MD, DOCX und PDF als Material; Ausgabe als CSV und für Word | [Kern / Option] |
| F9 | Kennzeichnung von KI-Ausgaben und Entwürfen | Kern |
| F10a | Laufprotokoll mit technischen Metadaten: Zeitpunkt, Stufe, Modell und Modellfassung, Fassungen von Arbeitsanweisung und Profil, Konfiguration, Token, Dauer, Ergebnis der Prüfungen | Kern |
| F10b | inhaltliche Protokolle mit Prompts und Antworten für Fehleranalyse und Qualitätssicherung; abschaltbar; Zweck, Umfang, Aufbewahrungsdauer und Zugriff legt die Stelle fest; im Forschungs- und im Wirkbetrieb getrennt konfigurierbar; keine Übermittlung an Dritte | Option |
| F11 | Forschungsfunktionen: Vergleichsläufe, Fallreihen | Option |
| F12 | Prüfung eingehender Meldungen: Schema und Fassung, Prüfsumme, Duplikate über Meldungskennung und Inhalt, widersprüchliche oder überholte Stände nach Bezug; Meldungen, die eine Prüfung nicht bestehen, werden gekennzeichnet und nicht ungeprüft ausgewertet; Inhalte und Anhänge gelten für die KI als Daten, nicht als Anweisungen | Kern |
| F13 | Signatur und Signaturprüfung von Meldungen mit vorhandener Infrastruktur der Stellen | Option nach Schutzbedarf |
| F14 | [weitere Anforderungen der Stelle] | |

Einzelheiten zu F1 bis F11 regelt die Spezifikation im Referenzstand. Abweichungen dokumentiert das Pflichtenheft.

## 7. Nichtfunktionale Anforderungen

| Nr. | Anforderung |
|---|---|
| N1 | **Offline-Start:** Die App startet ohne Netz. |
| N2 | **Offline-Arbeit und Rückfall:** Ohne Netz sind F1, F3, F6 bis F9 und F12 nutzbar, ohne KI-Funktionen. Ist ein KI-Endpunkt nicht erreichbar, meldet die App das und bietet nach Konfiguration den Rückfall auf lokale Inferenz oder Arbeit ohne KI an. Wiederholungen von KI-Aufträgen erfolgen höchstens [n]-mal und nicht stillschweigend. Abbrüche und Anwendungsfehler führen nicht zum Verlust erfasster Daten; Export ist jederzeit möglich. |
| N3 | **Leistung:** Antwortzeiten je Stufe [Vorgaben der Stelle, gemessen an den Fällen des Kontrollsatzes]. |
| N4 | **Plattformen:** [aktuelle Browser]; mit O1 [iOS ab …; Android ab …]. |
| N5 | **Sicherheit:** Inhaltssicherheitsrichtlinie, Schutz vor Prompt-Injection nach dem Bedrohungsmodell, sichere Ablage von Zugangsdaten; Transportverschlüsselung zum KI-Endpunkt; Verschlüsselung ausgetauschter Dateien nach Schutzbedarf. |
| N6 | **Wartbarkeit:** Typprüfung, Linting, automatisierte Tests in der CI, dokumentierte Architektur; deterministische Verarbeitungsschritte (Prüfungen, Import, Zusammenführung, Ausgabe) reproduzierbar getestet; Wartung durch andere Dienstleister möglich. |
| N7 | **Konfigurierbarkeit:** Endpunkte, Modelle, Rückfall, Protokollierung und Ablage ohne Codeänderung. |
| N8 | **Nachvollziehbarkeit:** Jede KI-Ausgabe ist ihrer Modellfassung, den Fassungen von Arbeitsanweisung und Profil und der Konfiguration zuzuordnen; Prüfsummen von Profilen und Material. Wortgleiche Wiederholung generativer Ausgaben wird nicht verlangt. |

### 7.1 Qualitätsnachweis der KI

- **Getrennte Prüfung:** technische Konformität (Schema, Prüfschritte) getrennt von fachlicher Ergebnisqualität.
- **Kontrollsatz:** neu verfasste, bis zum Nachweis zurückgehaltene Fälle nach dem [Verfahren des Demonstrators](../evaluation/plaene/2026-10-25-kontrollsatz.md); verfasst von der Stelle.
- **Kriterien:** die Kriterien des [Bewertungsverfahrens](../evaluation/README.md) (Belege, Zeit, Referenzraum, Unsicherheit, Radar, Empfehlungen); dazu sachliche Richtigkeit, Vollständigkeit der Kernbefunde und unbelegte Ergänzungen.
- **Schwere von Fehlern:** gering, erheblich, kritisch. Kritisch ist ein Fehler, der eine Beurteilung, Tendenz, Frist oder Empfehlung verfälscht.
- **Je Stufe getrennt:** S1 (Gliederung, Auswahl der SOP), S2, S3 (Wiederherstellung ohne neue Fehler), Verdichtung und Kurzfassung (Faktentreue, Umfang).
- **Wiederholbarkeit:** je Fall und Konfiguration mindestens [3] Läufe; berichtet werden Streuung und Häufigkeit der Fehler je Schwere, nicht nur Mittelwerte.
- **Versionsbindung:** Das Ergebnis gilt für die geprüfte Kombination aus Modellfassung, Arbeitsanweisung, Profil und Konfiguration. Ändert sich eine davon, ist der Nachweis nach L5 zu wiederholen.
- **Bewertung:** fachlich durch die Stelle, möglichst verblindet. Die Schwellen legt die Stelle fest [Schwellen, z. B. keine kritischen Fehler]. Ein Qualitätswert ersetzt weder die menschliche Aufsicht noch die Freigabe.

## 8. Mitwirkung der Stelle

Mitwirkungspflichten sind keine vertraglichen Leistungen des Auftragnehmers.

- fachliche Produktverantwortung mit Entscheidungsbefugnis
- Fachkollegium für Kontrollsatz, Bewertung und Pilot
- fachliche Freigabe von SOP, Kodierleitfaden, Profilen und Qualitätsschwellen
- Bereitstellung der Inferenz im Rechenzentrum und von Testgeräten
- nur synthetische oder freigegebene Testdaten
- Schutzbedarfsfeststellung, Risikobehandlung, Beteiligung von Informationssicherheit, Datenschutz und Personalvertretung ([VORLAGEN.md](VORLAGEN.md))

## 9. Abnahme und Entscheidungen

| Leistung | Technische Abnahme | Danach entscheidet die Stelle |
|---|---|---|
| L1 | Prüfbericht vollständig nach Abschnitt 5; Befunde belegt | Weg (Weiterentwicklung, Teilneubau, Neubau), Fortsetzung, Risikozuschlag |
| L2 | Befunde der Priorität [ ] behoben; Release reproduzierbar gebaut; Tests bestehen in der CI | Pilot |
| L3 | F2, F10, F12 und N2 erfüllt; Berichte zu lokaler Inferenz und Ergebnisqualität nach 7.1 liegen vor; Pilotbericht liegt vor | fachliche Einsatzfreigabe für die Vorbereitung des Wirkbetriebs |
| L4 | alle Kernanforderungen nach Abschnitt 6 und 7 erfüllt; keine offenen Befunde der Schwere [ ] aus Penetrationstest und Barrierefreiheitsprüfung; Handbücher und Übergabe vollständig | Freigaben für Informationssicherheit und Datenschutz; Wirkbetrieb |
| O1, O2 | Funktion auf [Geräten / im Rechenzentrum] nachgewiesen | Einsatz der Option |

Die technische Abnahme bestätigt die vertragsgemäße Leistung. Fachliche Einsatzfreigabe, Freigaben für Informationssicherheit und Datenschutz und die Entscheidung über den Wirkbetrieb trifft die zuständige Organisation. Offene kritische Befunde und akzeptierte Restrisiken dokumentiert die Stelle, etwa in V6 der [VORLAGEN.md](VORLAGEN.md).

## 10. Rechte und Übergabe

- **Übergabe:** Quellcode, Build-Skripte, Tests und Dokumentation in einem Repository [der Stelle / öffentlich]; reproduzierbarer Build; Beschreibung von Entwicklungs- und Testumgebung; Dokumentation der Schnittstellen und Datenformate; Installations-, Update- und Wiederherstellungsverfahren; Abhängigkeiten mit SBOM und Lizenzen der Drittkomponenten.
- **Wartbarkeit durch Dritte:** Die Übergabe ermöglicht einem anderen Dienstleister die Pflege ohne Mitwirkung des Auftragnehmers.
- **Rechte:** Nutzungsrechte an neuen Arbeitsergebnissen nach [Vertragstyp], vereinbar mit der EUPL-1.2, soweit sie den bestehenden Code ändern; Weitergabe an andere Stellen [zulässig / ausgeschlossen].
- **Veröffentlichung:** Rückführung von Änderungen in das öffentliche Repository [ja / nein]; eine Entscheidung der Stelle, unabhängig von der Nutzung unter der EUPL.
- **Inhalte:** Dokumentation unter [CC BY 4.0 / Vorgabe der Stelle]; für übernommene Inhalte gelten deren Lizenzen ([LICENSE-CONTENT](../LICENSE-CONTENT)).

## 11. Zeitrahmen und Mengengerüst

| Leistung | Zeitrahmen | Orientierung (Personentage, Kalenderdauer) |
|---|---|---|
| L1 | [ ] | 5–10 PT; 1–2 Monate |
| L2 | [ ] | 20–40 PT; 2–3 Monate |
| L3 | [ ] | 48–93 PT; 4–6 Monate |
| L4 | [ ] | 51–99 PT; 4–7 Monate |
| Projektsteuerung | – | etwa 10–15 % von L1 bis L4 |
| O1 | [ ] | 10–20 PT |
| O2 | [ ] | 20–40 PT |
| L5 | [ ] | technische Pflege jährlich etwa 10–15 % der Entwicklungskosten; Modellpflege 5–15 PT je Modellwechsel |

Die Orientierungswerte stammen aus [UEBERFUEHRUNG.md](UEBERFUEHRUNG.md), Abschnitte 4 bis 6. Sie sind keine Vorgabe für die Angebote.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 0.2 | 09.11.2026 | Nach externer Rückmeldung: verbindliche Grundsätze G1–G9 vom Referenzstand T1–T4 getrennt; Referenzstand mit Commit; Kernumfang und Optionen (O1 native Apps, O2 Recherchedienst, F8b, F10b, F11, F13); Prüfung eingehender Meldungen (F12); Laufprotokoll in Metadaten und inhaltliche Protokolle getrennt; Machbarkeitsprüfung lokaler Inferenz; Offline-Arbeit und Rückfall (N2); Reproduzierbarkeit und Versionsbindung (N6, N8); Qualitätsnachweis der KI (7.1) mit dreistufiger Fehlerschwere; Abnahme und Entscheidungen getrennt; Übergabe und Rechte präzisiert; Pflege differenziert |
| 0.1 | 09.11.2026 | Erste Fassung |

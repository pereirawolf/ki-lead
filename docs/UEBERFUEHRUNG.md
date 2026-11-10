# KI-LEAD – Überführung in einen Wirkbetrieb: Leistungen, Dauer und Kosten

Fassung 0.2 vom 09.11.2026, gilt für App-Version 0.7.14 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Dieses Dokument beschreibt, was nötig wäre, um aus dem Forschungsdemonstrator eine Anwendung im Wirkbetrieb zu machen: welche Leistungen anfallen, welche davon beauftragt werden und welche eine Stelle selbst erbringt, wie lange das dauert und in welchen Spannen die Kosten liegen. Ein Muster für die Leistungsbeschreibung steht in [LEISTUNGSBESCHREIBUNG.md](LEISTUNGSBESCHREIBUNG.md).

KI-LEAD ist ein **privates Forschungsvorhaben** ([README](../README.md#abgrenzung)). Die Angaben sind eine **Orientierungsrechnung**, keine Kostenberechnung, kein Angebot und keine Empfehlung. Eine Wirtschaftlichkeitsuntersuchung der Stelle ersetzen sie nicht.

---

## Auf einen Blick

- **Ausgangspunkt:** Funktionen, Fachkonzept, Spezifikation, Tests und Dokumentation sind vorhanden ([Abschnitt 1](#1-ausgangslage)). Eine Überführung beginnt deshalb mit einer Prüfung des Bestands, nicht bei null.
- **Betriebsmodell:** dezentral ohne zentralen Anwendungsserver; KI im eigenen Rechenzentrum und, soweit die Geräte es tragen, lokal; Arbeit ohne KI bleibt jederzeit möglich ([Abschnitt 2](#2-betriebsmodell)).
- **Aufwand des Auftragnehmers:** Kernumfang rund **135–280 Personentage**, das sind rund **0,14–0,35 Mio. € netto**, ohne Risikozuschlag. Optionen (native Apps, Recherchedienst) zusätzlich rund 30–60 Personentage ([Abschnitt 4](#4-stufen-arbeitspakete-und-aufwand)).
- **Dauer:** rund **15–30 Monate** von der Entscheidung bis zum Wirkbetrieb, einschließlich Vergabe und Freigaben ([Abschnitt 6](#6-dauer)).
- **Gesondert:** Eigenleistungen der Stelle, Hardware, Betrieb und Pflege ([Abschnitte 5 und 7](#5-kosten-im-überblick)).
- **Erster Schritt:** eine unabhängige Prüfung des Bestands, 5–10 Personentage. Erst sie entscheidet, ob der Code weiterentwickelt, teilweise neu gebaut oder nur als ausführbare Referenz genutzt wird ([Abschnitt 8](#8-alternativen)).

---

## 1. Ausgangslage

**Vorhanden** (Stand 0.7.14):

- **Anwendung:** Erfassung nach Profil mit Schema- und Redaktionsprüfung, KI-Erfassung in den Stufen S1 bis S3, Auswertung und Verdichtung von Meldungen mehrerer Stellen, Kurzfassung für die Leitung, Lagenradar, Zeitstrahl, Ausgabe als PDF, JSON, CSV und für Word ([SPEZIFIKATION.md](SPEZIFIKATION.md), Abschnitt 5).
- **Betrieb:** Auslieferung als statische Dateien mit Betreiberkonfiguration, Endpunkt der Stelle über eine OpenAI-kompatible Schnittstelle, lokales Modell über Ollama, installierbare App (PWA) mit Offline-Start, native Projekte für iOS und Android ([BETRIEB.md](BETRIEB.md), [NATIV.md](NATIV.md)).
- **Fachkonzept:** LEAD-Systematik mit SOP-Katalog, Arbeitsanweisungen, Kodierleitfaden und Beispielprofilen; Meldungsformat [LEAD-Meldung-v2](LEAD-MELDUNG-V2.md) als Entwurf.
- **Qualitätssicherung:** rund 41.500 Zeilen Programmcode und rund 26.600 Zeilen Tests; Typprüfung, Linting, Abdeckungsmindestwerte für die Kernbereiche, Browsertests mit Barrierefreiheitsprüfung, Lizenzabgleich nach REUSE, Stückliste (SBOM) je Release ([TESTS.md](TESTS.md)). Für die KI-Ergebnisse gibt es ein Bewertungsverfahren mit Kriterien, Blindbewertung und zurückgehaltenem Kontrollsatz ([evaluation/README.md](../evaluation/README.md)).
- **Vorarbeiten für Nachweise:** [Bedrohungsmodell](SICHERHEIT.md), [Datenschutzhinweise mit Vorlagen](DATENSCHUTZ.md), [Einordnung nach der KI-Verordnung](KI-VERORDNUNG.md), [Stand der Barrierefreiheit](BARRIEREFREIHEIT.md), [Vorlagen für eine Stelle](VORLAGEN.md) bis zur Entscheidungsvorlage V6. Sie erleichtern die Nachweise, ersetzen aber keine Prüfung.

**Nicht nachgewiesen** und deshalb in diesem Dokument als Prüf- oder Entwicklungsauftrag behandelt:

- Abnahme der nativen Apps auf Geräten (M5) und Erprobung im Testkreis (M6), siehe [Fahrplan](../README.md#fahrplan);
- Ergebnisqualität offener Modelle im eigenen Rechenzentrum und Machbarkeit lokaler Inferenz auf den Geräten einer Stelle; bisher nur mit Cloud-Anbietern erprobt, der Weg über Ollama ist nicht erprobt;
- Prüfung von Code, Architektur und Sicherheit durch Dritte;
- Vertrauenswürdigkeit ausgetauschter Meldungen über Schema und Inhaltskennung hinaus ([AUSTAUSCH.md](AUSTAUSCH.md));
- fachliche Freigabe von SOP, Kodierleitfaden und Profilen durch eine verantwortliche Stelle.

**Entstehung:** Der Herausgeber hat KI-LEAD allein und mit KI-Unterstützung entwickelt. Das ist weder ein Qualitätsnachweis noch ein Hindernis für eine Übernahme. Deshalb steht die Prüfung des Bestands am Anfang jeder Überführung.

## 2. Betriebsmodell

Die Angaben beruhen auf folgendem Betriebsmodell. Es ist eine Designentscheidung, keine Folge des heutigen Stands.

- **Dezentral:** Jede Stelle betreibt KI-LEAD selbst. Es gibt keinen zentralen Anwendungsserver, keine zentrale Datenhaltung und keine zentrale Benutzerverwaltung. Grund: Resilienz und Datenhoheit der einzelnen Stelle.
- **KI-Betrieb in drei Stufen:**
  1. **ohne KI:** Erfassung, Prüfung, Auswertung und Ausgabe funktionieren vollständig; die automatisierten Leistungen der KI ersetzt das nicht;
  2. **im eigenen Rechenzentrum:** offene Modelle für S1 bis S3, Verdichtung und Kurzfassung (Leitgedanken: Leistung und Datenschutz);
  3. **lokal auf dem Gerät:** ein kleines offenes Modell, etwa für S1, auch ohne Netz (Leitgedanke: Resilienz). Das ist eine **technische Hypothese**: Ob und auf welchen Geräteklassen sie trägt, klärt Stufe 3. Geräte ohne lokale KI arbeiten mit dem Rechenzentrum oder ohne KI.
- **Kein Widerspruch zur Dezentralität:** Die Inferenz im Rechenzentrum ist Infrastruktur der jeweiligen Stelle, kein Anwendungsserver. Die App speichert dort nichts und bleibt ohne sie arbeitsfähig. Dasselbe gilt für eine Signatur ausgetauschter Meldungen: Sie nutzt, wo der Schutzbedarf sie verlangt, vorhandene Infrastruktur der Stellen und führt keine neue zentrale Stelle ein.
- **Cloud-Anbieter** nutzt nur der Forschungsdemonstrator. Für den Wirkbetrieb sind sie nicht vorgesehen.
- **Austausch:** Meldungen gehen als Dateien im Meldungsformat über die Kanäle der Stellen. Eine formal gültige Datei gilt nicht schon deshalb als vertrauenswürdig. Unterschieden werden:

| Eigenschaft | Frage | Heute | Für den Wirkbetrieb |
|---|---|---|---|
| Gültigkeit | Passt die Datei zu Schema und Fassung? | Schemaprüfung beim Import | Fassung prüfen, ungültige Dateien kontrolliert abweisen |
| Integrität | Ist die Datei unverändert? | Inhaltskennung im Lagebild | Prüfsumme je Meldung |
| Authentizität | Stammt sie von der genannten Stelle? | nicht geprüft | Signatur als Option nach Schutzbedarf |
| Fachliche Freigabe | Hat die Stelle sie freigegeben? | Status in der Meldung | Nachweis nach [AUSTAUSCH.md](AUSTAUSCH.md), offen für die Abstimmung |
| Stand | Ist sie doppelt oder überholt? | Duplikate über die Inhaltskennung | Meldungskennung und Bezug nach LEAD-Meldung-v2; widersprüchliche Stände anzeigen |

Inhalte eingehender Meldungen und Anhänge sind für die KI Daten, keine Anweisungen ([SICHERHEIT.md](SICHERHEIT.md), Abschnitt 3.1). Meldungen, die eine Prüfung nicht bestehen, werden gekennzeichnet und nicht ungeprüft ausgewertet.

**Schutzbedarf:** Die Spannen gelten für normalen und hohen Schutzbedarf. Verschlusssachen sind ausgeschlossen; ihr Einsatz erfordert eine eigene Planung. Personenbezogene Daten liegen außerhalb der heutigen Verwendungsgrenzen ([KI-VERORDNUNG.md](KI-VERORDNUNG.md), Abschnitt 2); ob eine Datenschutz-Folgenabschätzung nötig ist, ergibt die Schwellwertanalyse ([DATENSCHUTZ.md](DATENSCHUTZ.md), Anhang C).

## 3. Was zur Aufnahme eines Wirkbetriebs notwendig ist

| Handlungsfeld | Leistungen | Erbracht durch |
|---|---|---|
| Bestand | unabhängige Prüfung von Architektur, Code, Testaussagekraft, Abhängigkeiten, Sicherheit und Übereinstimmung mit der Spezifikation | Auftrag (gesondert) |
| Software | Behebung der Befunde, reproduzierbarer und signierter Release-Prozess, Prüfung ausgetauschter Meldungen, konfigurierbare Laufprotokolle, Verteilung | Auftrag |
| KI-Betrieb | Anbindung der Inferenz, Machbarkeit lokaler Inferenz, Modellauswahl, Anpassung von Arbeitsanweisungen und Profilen, Durchführung des Qualitätsnachweises | Auftrag |
| KI-Bewertung | Kontrollsatz verfassen, Ergebnisse fachlich bewerten, Qualitätsschwellen festlegen | Stelle |
| Sicherheit und Datenschutz | Schutzbedarfsfeststellung und Risikobehandlung | Stelle |
| | Penetrationstest, Barrierefreiheitsprüfung, Zuarbeit zu den Konzepten | Auftrag |
| Fachlichkeit | Validierung und Freigabe von SOP, Kodierleitfaden, Profilen und Bewertungslogik | Stelle |
| Organisation | fachliche Produktverantwortung, Pflege von Meldungsformat und Profilen, Unterstützung der Nutzenden, Unterweisung, Beteiligung der Personalvertretung ([VORLAGEN.md](VORLAGEN.md)) | Stelle |
| Infrastruktur und Beschaffung | Inferenz im Rechenzentrum, Hardware, Vergabe | Stelle |

Ein Softwareunternehmen kann die LEAD-Systematik umsetzen und auf formale Konsistenz prüfen. Ob eine Beurteilung, eine SOP oder eine Kurzfassung fachlich angemessen ist, entscheidet die Stelle. Ein automatisierter Qualitätswert ersetzt weder die menschliche Aufsicht noch die Freigabe.

## 4. Stufen, Arbeitspakete und Aufwand

Personentage (PT) sind Arbeitsaufwand des Auftragnehmers, keine Kalenderdauer. Jedes Arbeitspaket ist genau einer Stufe zugeordnet. Optionen stehen getrennt.

| Stufe | Arbeitspaket | PT |
|---|---|---|
| **1 Prüfung des Bestands** | Architektur, Code, Abhängigkeiten | 2–4 |
| | Aussagekraft der Tests | 1–2 |
| | Sicherheit | 1–2 |
| | Abgleich mit der Spezifikation, Bericht, Bewertung der Alternativen (Abschnitt 8) | 1–2 |
| | **Summe Stufe 1** | **5–10** |
| **2 Konsolidierung** | Behebung der priorisierten Befunde aus Stufe 1 | 12–25 |
| | Release-Prozess: reproduzierbar, signiert, SBOM; dokumentierte Entwicklungsumgebung | 4–8 |
| | Tests ergänzen | 4–7 |
| | **Summe Stufe 2** | **20–40** |
| **3 KI-Betrieb und Pilot** | Anbindung der Inferenz im Rechenzentrum, Rückfallverhalten | 5–10 |
| | Machbarkeit lokaler Inferenz nach Geräteklassen | 5–8 |
| | Modellauswahl, Anpassung von Arbeitsanweisungen und Profilen | 10–20 |
| | Qualitätsnachweis am Kontrollsatz: Durchführung und Auswertung | 8–15 |
| | Prüfung ausgetauschter Meldungen (Abschnitt 2) | 5–10 |
| | konfigurierbare Laufprotokolle | 3–5 |
| | Begleitung des Pilotbetriebs, Fehleranalyse, Nachbesserung | 12–25 |
| | **Summe Stufe 3** | **48–93** |
| **4 Wirkbetrieb** | Penetrationstest durch Dritte | 8–12 |
| | Behebung der Befunde aus dem Penetrationstest | 8–20 |
| | Barrierefreiheitsprüfung | 4–8 |
| | Behebung der Befunde aus der Barrierefreiheitsprüfung | 8–15 |
| | Verteilung, Installation, Update und Wiederherstellung | 6–12 |
| | Betriebs-, Administrations- und Anwenderhandbuch, Schulungsunterlagen | 8–14 |
| | Zuarbeit zu Sicherheitskonzept, Datenschutz und Einordnung nach der KI-Verordnung | 6–12 |
| | Übergabe in die technische Verantwortung der Stelle | 3–6 |
| | **Summe Stufe 4** | **51–99** |
| **Querschnitt** | Projektsteuerung, etwa 10–15 % der Stufen 1–4 | 12–36 |
| **Kernumfang** | | **136–278** |
| **Option O1** | native Apps für iOS und Android: Abnahme auf Geräten, Verteilung | 10–20 |
| **Option O2** | Recherchedienst im Rechenzentrum für Websuche und Seitenabruf mit Protokollierung | 20–40 |

**Preisbasis:** Die Kosten beruhen auf einem **kalkulatorischen** Mischsatz von 1.000–1.250 € netto je Personentag. Er mittelt über die Rollen Architektur, Entwicklung, KI-Engineering, Qualitätssicherung, IT-Sicherheit und Projektsteuerung. Architektur, KI-Engineering und Sicherheitsprüfung liegen typischerweise über dem Mittel, Entwicklung und Dokumentation darunter. Der Satz ist eine Annahme des Herausgebers, kein Marktpreis.

| Stufe | PT | Kosten netto (gerundet) |
|---|---|---|
| 1 | 5–10 | 5–13 T€ |
| 2 | 20–40 | 20–50 T€ |
| 3 | 48–93 | 50–115 T€ |
| 4 | 51–99 | 50–125 T€ |
| Projektsteuerung | 12–36 | 12–45 T€ |
| **Kernumfang** | **136–278** | **rund 0,14–0,35 Mio. €** |
| Optionen O1 und O2 | 30–60 | 30–75 T€ |

Die Summe ist aus den Personentagen gerechnet, nicht aus den gerundeten Beträgen.

**Risikozuschlag:** Die Spannen enthalten **keine** Risikoreserve. Ein Zuschlag sollte gesondert und nach dem Ergebnis von Stufe 1 festgelegt werden.

**Wo die Spannen auseinandergehen:** Ergebnis der Prüfung des Bestands (gravierende Befunde bis hin zum Teilneubau), Ergebnisqualität offener Modelle (größere Modelle, mehr Anpassung), Zahl der Befunde aus Penetrationstest und Barrierefreiheitsprüfung, hoher Schutzbedarf.

## 5. Kosten im Überblick

| Kostenart | Inhalt | Spanne |
|---|---|---|
| Auftragnehmer, einmalig | Kernumfang nach Abschnitt 4 | rund 0,14–0,35 Mio. € |
| | Optionen O1 und O2 | 30–75 T€ |
| | Risikozuschlag | gesondert festzulegen |
| Eigenleistungen der Stelle | Abschnitt 7 | interne Personalkosten |
| Hardware, einmalig | Inferenz im Rechenzentrum: von einem einzelnen Server im unteren fünfstelligen Bereich bis zu Mehr-GPU-Systemen im sechsstelligen Bereich, abhängig von Modellgröße und gleichzeitiger Nutzung; Geräte nur, wo lokale Inferenz vorgesehen ist | nach Dimensionierung |
| Betrieb, laufend | Inferenz im Rechenzentrum: Strom, Wartung, Ersatz, Personalanteil | nach Dimensionierung |
| Pflege, laufend (Auftragnehmer) | technische Pflege: Fehlerbehebung, Sicherheitsupdates, Abhängigkeiten, Kompatibilität; grober Planungswert 10–15 % der Entwicklungskosten jährlich | rund 15–50 T€ jährlich |
| | Modellpflege: Bewertung neuer Modellfassungen am Kontrollsatz | 5–15 PT je Modellwechsel |
| | Funktionsausbau | nach Bedarf, gesondert |
| Nicht enthalten | Umsatzsteuer, Vergabekosten | – |

Die Hardware wird wirtschaftlicher, wenn mehrere Verfahren oder Stellen eine Plattform teilen, weil Lagearbeit schubweise anfällt. Reaktionszeiten, Service-Level und Release-Rhythmus der Pflege sind optionale Festlegungen ([LEISTUNGSBESCHREIBUNG.md](LEISTUNGSBESCHREIBUNG.md), L5).

## 6. Dauer

| Abschnitt | Kalenderdauer | Abhängig von |
|---|---|---|
| Vergabe Stufe 1 | wenige Wochen | Verfahren der Stelle |
| Stufe 1 | 1–2 Monate | Zugang zum Repository |
| Entscheidung, Vergabe Stufen 2–4 | 3–9 Monate | Verfahrensart; Bericht aus Stufe 1 |
| Stufe 2 | 2–3 Monate | Befunde aus Stufe 1 |
| Stufe 3 | 4–6 Monate | Inferenz im Rechenzentrum, Kontrollsatz und Bewertung durch das Fachkollegium, Pilotlaufzeit |
| Stufe 4 | 4–7 Monate | Prüftermine Dritter |
| Freigaben der Stelle | 1–2 Monate | Zuständigkeiten der Stelle |
| **Gesamt** | **rund 15–30 Monate** | |

**Parallel möglich:** Beschaffung und Bereitstellung der Inferenz während Stufe 2; Kontrollsatz während Stufe 2; Schutzbedarfsfeststellung und Schwellwertanalyse während Stufe 3; Handbücher neben den Prüfungen in Stufe 4. Kritisch für die Dauer sind die Bereitstellung im Rechenzentrum und die Verfügbarkeit des Fachkollegiums.

## 7. Eigenleistungen der Stelle

| Rolle | Stufe | Umfang (Orientierung) |
|---|---|---|
| Fachliche Produktverantwortung | 2–4 | 0,5–1 Vollzeitäquivalent; im Betrieb 0,25–0,5 |
| Fachkollegium: Kontrollsatz verfassen | 2–3 | 5–10 Personentage |
| Fachkollegium: Bewertung und Pilot | 3 | 30–60 Personentage, verteilt |
| Rechenzentrum: Bereitstellung der Inferenz | 2–3 | nach Plattform; danach laufender Betrieb |
| Informationssicherheit, Datenschutz, Personalvertretung | 3–4 | punktuell, Freigaben |
| Beschaffung | vor 1 und 2 | Vergabe |
| Pflege von Meldungsformat und Profilen | ab 3 | dauerhaft: Versionierung, Migration, Abstimmung mit anderen Stellen |

## 8. Alternativen

Die Prüfung des Bestands bewertet drei Wege. Keiner ist vorher festgelegt.

| | Weiterentwicklung | Teilneubau | Neubau |
|---|---|---|---|
| Übernommen | Code, Tests, Fachkonzept, Formate | Fachkonzept, Formate, Schemata, Tests als Referenz; Teile des Codes | Fachkonzept und Spezifikation; der Demonstrator dient als ausführbare Referenz |
| Kosten Software | wie Abschnitt 4 | höher, je nach Umfang des neu gebauten Teils | deutlich höher; ein Nachbau des heutigen Funktionsumfangs allein läge nach Annahme des Herausgebers bei grob 300–450 Personentagen |
| Projektrisiko | verdeckte Mängel im Bestand | Schnittstellen zwischen Alt und Neu | Anforderungen gehen beim Nachbau verloren |
| Wartbarkeit | hängt vom Ergebnis der Konsolidierung ab | gezielt verbesserbar | nach Wahl des Auftragnehmers |

Die Nachweise der Stufe 4, der KI-Betrieb und die Eigenleistungen fallen in allen drei Wegen an.

## 9. Beauftragung und Entscheidungen

**Beauftragung:** Stufe 1 lässt sich gesondert beauftragen. Ob die prüfende Stelle an späteren Stufen teilnehmen darf, entscheidet die Stelle. Die Stufen 2 bis 4 lassen sich stufenweise mit verbindlichen Abnahmen und Optionen beauftragen. Ergebnisbezogene Leistungen (Prüfbericht, Software) eignen sich eher für Werkverträge, begleitende Leistungen (Pilotbegleitung, Pflege) eher für Dienstverträge. Verfahrensart und Vertragstyp legt die Stelle fest.

**Entscheidungen nach jeder Stufe:**

| Nach | Grundlage | Entscheidung |
|---|---|---|
| Stufe 1 | Prüfbericht | Weg nach Abschnitt 8; Fortsetzung ja oder nein; Risikozuschlag |
| Stufe 2 | technische Abnahme der Release-Basis | Pilot ja oder nein |
| Stufe 3 | technische Abnahme, Pilotbericht, Ergebnis des Qualitätsnachweises gegen die Schwellen der Stelle | Vorbereitung des Wirkbetriebs ja oder nein |
| Stufe 4 | technische Abnahme, Prüfberichte, offene Befunde und akzeptierte Restrisiken | Wirkbetrieb ja oder nein |

Dabei sind getrennt: die **technische Abnahme** der vertraglichen Leistung, die **fachliche Einsatzfreigabe**, die **Freigaben für Informationssicherheit und Datenschutz** nach den Zuständigkeiten der Stelle und die **Entscheidung über den Wirkbetrieb**. Diese trifft die zuständige Organisation, nicht der Auftragnehmer. Offene kritische Befunde und akzeptierte Restrisiken werden dokumentiert. Als Vorlage eignet sich V6 in [VORLAGEN.md](VORLAGEN.md).

## 10. Rechte und Nachnutzung

- **Bestehender Code:** EUPL-1.2 ([LICENSE](../LICENSE)). Nutzen und ändern darf jede Stelle. Die Pflichten der Lizenz, insbesondere die Copyleft-Klausel, greifen, wenn sie Kopien oder geänderte Fassungen an Dritte weitergibt oder ihnen zugänglich macht.
- **Neue Arbeitsergebnisse:** Die Nutzungsrechte regelt der Vertrag. Er muss mit der EUPL vereinbar sein, soweit die Ergebnisse den bestehenden Code ändern.
- **Veröffentlichung und Rückführung** in das öffentliche Repository sind eine eigene Entscheidung der Stelle und keine Folge der Nutzung.
- **Inhalte:** Dokumentation und Beispielprofile unter CC BY 4.0, Vorlagen und maschinenlesbare Dateien zusätzlich unter CC0 1.0, [GRUNDLAGEN.md](GRUNDLAGEN.md) unter CC BY-NC-ND 4.0 ([LICENSE-CONTENT](../LICENSE-CONTENT)).
- **Drittkomponenten:** [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md), SBOM je Release, Lizenzabgleich nach REUSE.

KI-LEAD wird ohne Support und ohne Gewährleistung bereitgestellt. Beides wäre Gegenstand eines Pflegevertrags.

## 11. Methodik und Grenzen

- **Grundlage:** das Repository im Stand von Version 0.7.14 (Commit `fd452dc`), seine Spezifikation, Tests und Dokumentation.
- **Spannen:** Annahmen des Herausgebers zum Aufwand je Arbeitspaket und zum Tagessatz. Es liegen keine Angebote, keine Prüfung durch Dritte, keine Messung der Testaussagekraft und kein Sicherheitstest zugrunde.
- **Genauigkeit:** Die Spannen sind Größenordnungen. Eine belastbare Schätzung ist erst nach Stufe 1 möglich.
- **Fortschreibung:** mit dem Ergebnis der Erprobung im Testkreis (M6) und nach wesentlichen Änderungen am Betriebsmodell.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 0.2 | 09.11.2026 | Nach externer Rückmeldung: Aufwand nach Arbeitspaketen hergeleitet, Kernumfang 136–278 PT statt 205–360 PT, Optionen O1 und O2 getrennt, Projektsteuerung ausgewiesen; Preisbasis mit Rollen, Risikozuschlag gesondert, Kostenarten getrennt; Austausch und Vertrauenswürdigkeit von Meldungen; lokale Inferenz als Hypothese, Reihenfolge der KI-Stufen; Schutzbedarf und Schwellwertanalyse; Dauer mit Abhängigkeiten, 15–30 Monate; Eigenleistungen je Stufe; Alternativen; Beauftragung und Entscheidungen; Rechte präzisiert; Pflege differenziert |
| 0.1 | 09.11.2026 | Erste Fassung |

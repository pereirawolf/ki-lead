# Profil „Lagebild Justiz“ (Erprobungsentwurf)

Fassung 0.1.0 vom 31.10.2026 · Profilversion 0.1.0 · Schemakennung `Lagebild-Justiz-Meldung-v1` · Heiko Pereira Wolf · CC BY 4.0

Ein Landesprofil für ein Lagebild über die **Funktionsfähigkeit der Justiz eines Landes**, mit Thüringen als Beispiel. Erfasst werden Voraussetzungen und Beeinträchtigungen der Aufgabenerfüllung. Inhalte richterlicher Entscheidungen, einzelne Verfahren und die Leistung einzelner Personen gehören nicht dazu.

**Status:** Erprobungsentwurf für den Forschungsdemonstrator. Die Regeln sind **fachlich nicht abgenommen**. Das Profil ist nur für fiktive oder offen zugängliche Daten bestimmt ([Datenschutzhinweise](../../docs/DATENSCHUTZ.md), [KI-Verordnung](../../docs/KI-VERORDNUNG.md), Abschnitt 5). Die Beispielmeldungen sind erfunden; keine stammt von den genannten Stellen.

## Grundentscheidungen

Getroffen vom Herausgeber am 31.10.2026 auf Grundlage zweier Grundlagenberichte mit Grobkonzept und ihrer Konsolidierung. Diese Berichte liegen außerhalb des Repositorys.

| Thema | Entscheidung |
|---|---|
| Ansatz | ein Landesprofil mit Funktions- und Statusmatrix; kein Lagenradar D1–D8, keine ereignisbezogenen SOPs; Teil A als einziger Regelbaustein |
| Berichtsmodi | Funktionslagebild (monatlich) und Krisenlagebild (je Lagezyklus) im selben Schema; über den Wechsel entscheidet eine Person |
| Funktionen | F1 Rechtsschutz und Eilrechtsschutz, F2 Richterlicher Bereitschaftsdienst, F3 Zeitkritische Strafverfolgung und Haftsachen, F4 Sicherer und menschenwürdiger Vollzug, F5 Register und sonstige Rechtspflege, F6 Vollstreckung, F7 Ambulante soziale Dienste, F8 Ausbildung und Nachwuchssicherung, dazu „Sonstiges“ |
| Bewertung | Funktionslage in vier Stufen (gesichert, eingeschränkt, erheblich eingeschränkt, kritisch) plus Nichtwerte (nicht betroffen, nicht zuständig, unbekannt, nicht gemeldet); je Sachverhalt Beurteilung in drei Stufen, dazu Dringlichkeit, Tendenz und Erkenntnissicherheit getrennt; kein Mittelwert, kein Gesamtscore |
| Quellen | Kategorien A amtlich, B Betreiber, K Kammern, W wissenschaftlich, V Verbände, M Medien, P privat, in dieser Rangfolge; Normen unter A |
| Referenzraum | Thüringen; der fachliche Kern gilt länderübergreifend (Länderliste und Kennungspräfixe aller Länder) |
| Ablage | öffentliches Beispielprofil unter `profile/lead-justiz`, Version 0.1.0. Der Ordnername sortiert bewusst nach `lead-beispiel`: Die App aktiviert beim ersten Start das erste mitgelieferte Profil, und das soll das Beispielprofil bleiben |
| Anwendungskern | Pilot ohne Kernänderung; ein allgemeiner Kern-PR folgt nach den Testläufen und vor einer Fassung 1.0 |

## Dateien

| Datei | Inhalt | Geht an ein KI-Modell |
|---|---|---|
| `profil.json` | Manifest | nur einzelne Werte über Platzhalter |
| `meldung.schema.json` | Schema `Lagebild-Justiz-Meldung-v1` | ja (Erfassung, Verdichtung) |
| `meldung.ui.json` | Darstellungsdatei: Schritte, Rollen, Kennsätze, Quellenkategorien | ja (Erfassung, Verdichtung) |
| `kodierleitfaden.md` | Funktionskatalog, Status, Bewertung, Quellen, Belegwerte, Zeitstrahl | ja (Erfassung, Verdichtung) |
| `sop/A_Gemeinsame-Regeln.md` | Teil A: Gegenstand, Leitplanken, Befundnachweis, Fristgrundlage, Verdichtung, Fortschreibung, Schutzbedarf | ja (S1, Erfassung, Verdichtung) |
| `anweisung-erfassung.md`, `anweisung-verdichtung.md`, `anweisung-kurzfassung.md` | Arbeitsanweisungen | ja; die Kurzfassung sieht nur ihre Anweisung und die Meldung |
| `kontakte.json` | erwartete meldende Stellen für den Meldestatus (Adressen `.invalid`) | nein |
| `beispiele/fiktiv-2026-10/` | drei FIKTIVE Meldungen: akute ERV-Störung, schleichende Einschränkung im Gerichtsvollzieherdienst, Fehlanzeige | nein |
| `README.md`, `CHANGELOG.md` | diese Beschreibung, Änderungsverlauf | nein |

Regeln, die wirken sollen, stehen deshalb in Schema, Darstellungsdatei, Kodierleitfaden, Teil A oder den Arbeitsanweisungen, nie nur in dieser README.

## Kopplungen an den Anwendungskern

Der Kern enthält feste Begriffe aus dem Bevölkerungsschutz. Das Profil fängt sie für die Erprobung so ab:

| Stelle im Kern | Umgang im Profil |
|---|---|
| S1 fragt nach „Ereignisarten und SOPs“, nennt „SOP-LEAD A.1“, „Mischlage“, „Sonstiges“ | Teil A, A.1 Nr. 3 bestimmt: Ereignisart = Funktion, SOP = Regelbaustein; „Sonstiges“ ist Wert des Funktionskatalogs |
| fester Verdichtungstext in S1 mit „SOP-LEAD A.7“, Sturmtief-Beispiel und Richtzahl „einer bis drei“ Sachverhalte; vom Profil nicht überschreibbar | Teil A, A.7 und A.7.1 grenzen die Richtzahl auf gleiche Ursachen ein; Wirkung in den Testläufen prüfen |
| Fortschreibung verweist auf „SOP-LEAD A.8“, „A.8.1“ und „Teil A (Fristgrundlage)“ | Teil A führt A.8, A.8.1 und in A.5 die Fristgrundlage |
| feste Prüfungen auf Quellenkategorie A (amtlich) und A/B (Primärquelle) | A bleibt „amtlich“, B bleibt „Betreiber“ |
| Standardtexte für Verdichtung und Kurzfassung mit Radarbezug | durch eigene Arbeitsanweisungen ersetzt |
| Oberfläche: Reiter „Lagenradar“, Profilansicht „Lagenradar D1–D8“ | kein Radar im Profil; Oberflächentexte bleiben vorerst irreführend, aber ohne Wirkung auf Prompts |

## Offene Punkte vor einer Fassung 1.0

1. **Fachliche Abnahme** von Zweck, Funktionskatalog, Bewertungsstufen, Zeitankern und Bewertungsvorschlägen durch eine verantwortliche Stelle der Justizverwaltung, unter Beteiligung der Gerichtsbarkeiten, der Staatsanwaltschaften, des Vollzugs und der IT.
2. **Rechtsprüfung am amtlichen Text:** Art. 19, 97 und 104 GG, § 26 DRiG, §§ 21e, 22c, 146, 147, 198 GVG, § 9 RPflG, § 121 StPO, § 130d ZPO und die Parallelnormen, §§ 12 ff. EGGVG, die Thüringer Landesvorschriften (ThürDSG, ThürRiStAG, Vollzugsgesetze) sowie die Rechtsprechung zum Bereitschaftsdienst. In den Grundlagenberichten waren mehrere amtliche Portale nicht abrufbar.
3. **Prüfkorpus und Testläufe:** Normal-, Störungs- und Grenzfälle über mehrere Institutionen, mit fehlenden Meldungen, widersprüchlichen Quellen und gemeinsamen Ursachen; Erfassung, Verdichtung, Kurzfassung, Import und Export sowie Fortschreibung.
4. **Kern-PR** zu den Kopplungen oben (allgemein, nützlich auch für andere Fachprofile).
5. **BCM-Begriffe:** Abgleich mit der Endfassung des BSI-Standards 200-4.
6. **Meldewege und Datenzugänge** sind für einen späteren Lagebetrieb gesondert zu vereinbaren. Dieses Profil unterstellt keine Meldepflicht.

## Lizenz

Inhalte unter [CC BY 4.0](../../LICENSE-CONTENT), Namensnennung: Heiko Pereira Wolf. Maschinenlesbare Dateien (Schema, Manifest, Kontaktliste) nach [LICENSE-CONTENT](../../LICENSE-CONTENT) zusätzlich unter CC0 1.0.

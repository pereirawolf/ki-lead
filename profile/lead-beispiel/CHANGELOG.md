# Änderungsverlauf Profil „LEAD-Beispiel – Koordinierungsstelle“

Profil-ID `lead.beispiel.koordinierungsstelle`, Inhalte unter CC BY 4.0. Die jüngsten Änderungen stehen zuerst.

**Versionierung:** Die Profilversion in `profil.json` folgt Semantic Versioning. Die erste Stelle ändert sich bei inkompatiblen Schemaänderungen (Meldungen müssen migriert werden), die zweite bei neuen Inhalten oder geänderten Regeln, die dritte bei sprachlichen Korrekturen ohne fachliche Wirkung. Jedes Dokument trägt im Kopf zusätzlich seine eigene Fassung. Jede Profilversion hat außerdem eine Prüfsumme (SHA-256 über alle Dateien), die die App mit jedem KI-Lauf protokolliert; sie unterscheidet auch Stände, die versehentlich ohne neue Versionsnummer veröffentlicht wurden.

**SOP-Änderungen:** Ab Profilversion 1.4.0 stehen Änderungen an der SOP-Sammelmappe ausschließlich im eigenen Verlauf [`sop/CHANGELOG.md`](sop/CHANGELOG.md). Dieser Verlauf nennt dann nur, welche Fassung der Sammelmappe das Profil einbindet.

**Hinweis zur Nachvollziehbarkeit:** Zwischen dem 17. und 18.10.2026 wurden Inhalte geändert, ohne die Profilversion 1.0.0 anzuheben. Diese Änderungen sind in Version 1.1.0 mit Datum und Commit zusammengefasst. Läufe aus diesem Zeitraum lassen sich über die protokollierte Prüfsumme dem genauen Stand im Git-Verlauf zuordnen.

## 1.36.0 – 01.11.2026

Grundlage: Befunddatei `ki-lead-befund_gesamtkonsistenz_2026-W44.json` (Gesamtkonsistenzprüfung KW 44, Commit `02a6bd5`), freigegeben vom Herausgeber am 01.11.2026: GK-2026-W44-01 (Option A), -02 (Option A), -05. Zweite Stelle, weil sich die Regeln zum Fristenkennsatz und zur Quellennummerierung bei Fortschreibungen ändern; Schema unverändert, bestehende Meldungen werden nicht umkodiert.

- **Darstellungsdatei, Eingabehilfe „Handlungsrelevant bis:“ (GK-2026-W44-01):** Hinweis „Je Frist eine eigene Zeile, die früheste zuerst.“ statt „Mehrere Fristen in derselben Zeile …“.
- **Kodierleitfaden 1.8.0 (GK-2026-W44-02):** Abschnitt 5 Nummerierung nach erster Nennung nur für die Erstmeldung, bei Fortschreibungen stabile Nummern der eigenen Vormeldung und nächste freie Nummer für neue Quellen; Abschnitt 8.3, Regeln 5 und 8.
- **Arbeitsanweisung Erfassung 1.10.0:** 4.4 je Frist eine eigene Zeile (GK-2026-W44-01); 4.3 Einträge des Quellenverzeichnisses der Vormeldung behalten ihre Nummern (GK-2026-W44-02); Beispielwert `_entstehung.kodierleitfaden` „Kodierleitfaden LEAD 1.8.0“; Kopf nennt Sammelmappe ab 3.21.0, Kodierleitfaden ab 1.8.0 und Verdichtung ab 2.3.0.
- **Arbeitsanweisung Verdichtung 2.3.0:** Regel 8 je Frist eine eigene Zeile (GK-2026-W44-01); Kopf nennt Sammelmappe ab 3.21.0, Kodierleitfaden ab 1.8.0 und Erfassung ab 1.10.0.
- **SOP-LEAD-Sammelmappe 3.21.0:** Teil A, A.4, und Gültigkeitsstand (GK-2026-W44-01, -05). Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Erfassung und Verdichtung auf Grundlage von Teil A 3.21.0 und Kodierleitfaden 1.8.0 geprüft und angepasst; für die Quellennummern verweist die Verdichtung über Regel 15 auf die Erfassung (4.3), kein weiterer Anpassungsbedarf. Kurzfassung 2.4.1 geprüft, kein Anpassungsbedarf: Den Fristenblock setzt die App aus den Kennsätzen.
- Schema, Kontakte, Quellenregister, Beispiele und Bewertungsfälle sind unverändert; der Beispieldatensatz „Ilka“ führt je Frist bereits eine eigene Zeile.

## 1.35.1 – 01.11.2026

Grundlage: Beratung zu den Erklärtexten im Schritt „Ereignisse/Sachverhalte“, Entscheidungen des Herausgebers vom 01.11.2026 (Leitfrage und Arbeitshinweise wie in der KI-Erfassung, keine Platzhalter in den Analysefeldern, Hinweis auf die LEAD-Eingabehilfen). Dritte Stelle, weil nur die Hilfetexte der Darstellungsdatei sprachlich überarbeitet sind; keine neue Regel, die Arbeitsanweisungen bleiben maßgeblich. Die App zeigt die Texte seit 0.6.21 zwischen Beschriftung und Eingabe.

- **Darstellungsdatei, Analysebereich:** Gruppenhinweis neu („Vier Blickwinkel auf denselben Sachverhalt …“, mit Verweis auf die LEAD-Eingabehilfen). Hilfetexte von „Lage & Ereignis“, „Risiken & Auswirkungen“, „Maßnahmen & Handlungsempfehlungen“ und „Abhängigkeiten & Interdependenzen“ beginnen mit einer Leitfrage; „Lage & Ereignis“ nennt das Kennzeichnen vorläufiger oder widersprüchlicher Angaben (wie der Baustein „Bestätigt ist“), „Risiken & Auswirkungen“ die Bedingung möglicher Folgen und den Zeithorizont „soweit bekannt“ (wie der Baustein „Mögliche Entwicklungen:“). Bei den Maßnahmen entfällt die Liste der Status im Hilfetext, sie steht im Baustein „Bestehende Maßnahmen:“; der Hinweis auf D6 steht am Ende.
- **Darstellungsdatei, weitere Felder:** „Bewertung & Tendenz“ mit Leitfrage, Kennsätze unverändert; Kennung (mit „Kennung vergeben“), Bezug (mit Leitfrage) und Lagenradar (Verweis auf den Kodierleitfaden) sprachlich angeglichen.
- Schema, Arbeitsanweisungen, Kodierleitfaden, SOP-Sammelmappe, Eingabehilfen, Kontakte, Beispiele und Bewertungsfälle sind unverändert.

## 1.35.0 – 31.10.2026

Grundlage: Befunddatei `ki-lead-befund_technik_2026-W44-A6.json` (Arbeitspaket A6 „Austauschvertrag“, TP-2026-W44-60), freigegeben vom Herausgeber am 31.10.2026.

- **Eingangsschema `LEAD-Meldung-Land-v1`:** `meldung.eingang_schemata` nennt das Schema des Landesprofils (`eingang/LEAD-Meldung-Land-v1.schema.json`, von `npm run profil:land` aus dem Landesprofil geschrieben) mit dem Gebiet im Feld `kreis`. Das Lagebild prüft Landes- und Kreismeldungen dieses Schemas und zeigt ihr Gebiet; sie bleiben fremde Meldungen für die KI-Verdichtung.
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, SOP-Sammelmappe, Kontakte und Beispiele sind unverändert.

## 1.34.0 – 30.10.2026

Grundlage: Sammelbefunddatei `ki-lead-befund_offen_2026-W44.json` (Freitagslauf KW 44: offene Befunde der Konsistenzprüfung, des KI-Chip-Befunds und der Zeitstrahl-Beratung, dazu „Weitere Beobachtungen“ aus Erfassungstest KW 43 und Konsistenzprüfung KW 44), Entscheidungen des Herausgebers vom 26. und 30.10.2026. Zweite Stelle, weil neue Kodier- und Erfassungsregeln hinzukommen; Schema und Darstellungsdatei bleiben unverändert, bestehende Meldungen werden nicht umkodiert.

- **Kodierleitfaden 1.7.0:** D2 Verwaltungsleistungen allein keine Direktbetroffenheit (KP-2026-W44-02); D4 Standortregel für den Herkunftsort, Nachbarschaftshilfe überörtlich auch über Landesgrenzen, regulär beauftragte Dienstleister keine externe Unterstützung, fünf Kurzbeispiele (KP-2026-W44-03); D6 Abgrenzung Stufe 0/1 nach Verzögerung trotz Ersatzweg, zwei Kurzbeispiele (OB-2026-W44-02); Abschnitt 4 „Beurteilung und Tendenz“ (KP-2026-W44-04); Abschnitt 5 Sprachfassung zitierter Quellen (OB-2026-W44-03). Stufentexte und Quellenkategorien unverändert.
- **Arbeitsanweisung Erfassung 1.9.0:** `eintritt` bei nur eingegrenztem oder widersprüchlichem Beginn: Bezugspunkt Beginn der Wirkung, frühester noch angegebener Tag ohne Uhrzeit, Spanne in `lage_ereignis` (KP-2026-W44-07); Beispielwerte in `_entstehung.sop` mit „vX.Y.Z“ (OB-2026-W44-04), `kodierleitfaden` in der Form der App „Kodierleitfaden LEAD 1.7.0“; Kopf nennt Kodierleitfaden ab 1.7.0.
- **Arbeitsanweisung Kurzfassung 2.4.1:** gilt für die LEAD-Meldevorlage ab 1.2 statt ab 1.0 (OB-2026-W44-05), redaktionell.
- **SOP-Sammelmappe 3.20.2:** B09 2.2.1 (Prüftermin 31.12.2026 ohne sachliche Prüfung, OB-2026-W44-01), B15 2.5.1 (Verweis auf Kodierleitfaden D2), Teil A Verweis und Gültigkeitsstand. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Erfassung auf Grundlage von Kodierleitfaden 1.7.0 und Teil A 3.20.2 geprüft und angepasst (1.9.0; verweist für D2, D4, D6, Beurteilung und Quellen auf den Kodierleitfaden, kein weiterer Anpassungsbedarf). Verdichtung 2.2.0 geprüft, kein Anpassungsbedarf (verweist auf den Kodierleitfaden). Kurzfassung 2.4.1 geprüft, nur Mindestfassung der Meldevorlage angepasst. Darstellungsdatei geprüft, unverändert: die Beschriftung „Bewertung“ bleibt nach Entscheidung zu KP-2026-W44-04.
- Schema, Darstellungsdatei, Arbeitsanweisung Verdichtung, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Erwartungswerte D4 der Bewertungsfälle nach der neuen Standortregel geprüft: `sop-grossunfall-bahn-ursache-offen` und `sop-waldbrand-nachlauf-rueckkehr` (Kräfte aus Nachbarkreisen, erwartet 2–3) schließen den neuen Wert 2 ein, die übrigen erwarten D4 offen; kein Anpassungsbedarf, eine Einengung auf 2 bleibt der fachlichen Abnahme vorbehalten.

## 1.33.1 – 30.10.2026

Grundlage: Entscheidung des Herausgebers vom 30.10.2026 nach Beratung: die Bereiche der App einheitlich nach den Arbeitsschritten der LEAD-Systematik benennen (Erfassung, KI-Erfassung, Auswertung; die Darstellung ist das erzeugte Ergebnis), die Kennsätze parallel bauen und die Oberfläche neutral formulieren, ohne „du“ und ohne „Sie“. Die Arbeitsanweisungen an die KI-Modelle bleiben beim „du“. Anlasskennungen OF-2026-W44-01 (Bereichsnamen), -02 (Kennsätze), -03 (Produkttitel aus dem Profil, Bereichsnamen aus der App), -04 (neutrale Ansprache). Dritte Stelle, weil sich nur Bezeichnungen der Darstellungsdatei ändern; Regeln, Schema und Meldungen bleiben unverändert.

- **Darstellungsdatei (Profilversion 1.33.1):** `titel` „Meldung“ statt „LEAD-Meldevorlage“; er steht seit App 0.6.10 nur noch über der Meldung im PDF und in dessen Metadaten. `untertitel` („Meldung von Ereignissen/Sachverhalten (keine gesonderte Maßnahmenmeldung)“) entfällt; Überschrift und Kennsatz der Erfassung setzt die App. `lagebild.titel` bleibt „Lagebild“ und benennt das Produkt.
- **SOP-Sammelmappe 3.20.1:** nur Gültigkeitsstand in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Kodierleitfaden und Arbeitsanweisungen nicht betroffen; sie nennen die Darstellungsdatei nicht mit Titel. Der Name des Schemas („LEAD-Meldevorlage 1.2“, Schemakennung `LEAD-Meldung-v1`) bleibt unverändert.
- Schema, Kodierleitfaden, Arbeitsanweisungen, Quellenregister, Beispiele und Bewertungsfälle sind unverändert.

## 1.33.0 – 29.10.2026

Grundlage: Entscheidung des Herausgebers vom 29.10.2026, je Sachverhalt einen Zeitstrahl relevanter Ereignisse zu führen und bei Erfassung, Verdichtung und Fortschreibung fortzuschreiben, auf der Seite „Quellen & Referenzen“ als eigener Bereich in standardisierter Form, mit eindeutiger Sachverhaltskennung und Bezug (Anlasskennungen ZS-2026-W44-01 Zeitstrahl, -02 Sachverhaltskennung, -03 Bezug, -04 Bewertungszeilen der App, -05 Kenntniszeit je Zeile; -05 nach Beratung am 30.10.2026 zur Umsetzung freigegeben). Zweite Stelle, weil neue Felder und Regeln hinzukommen; die Schemaänderung ist abwärtskompatibel, bestehende Meldungen bleiben gültig und werden nicht migriert.

- **Meldungsschema (LEAD-Meldevorlage 1.2, Schemakennung unverändert `LEAD-Meldung-v1`):** optionales Feld `zeitstrahl` (Text) auf Meldungsebene nach `quellen`; je Sachverhalt optional `kennung` (Muster `Präfix-JJJJMMTT-XXXX` oder leer) und `bezug` (Liste gültiger Kennungen, ohne Doppelungen); gemeinsame Definition `$defs.kennung`.
- **Darstellungsdatei (Profilversion 1.33.0):** Rollen `zeitstrahl`, `sv_kennung`, `sv_bezug`; Schritt „Quellen & Referenzen“ mit dem Zeitstrahl als zweitem Feld und ergänzter Einleitung; Felder `zeitstrahl` (Widget `zeitstrahl`), `sachverhalte[].kennung` (Widget `kennung`), `sachverhalte[].bezug` (Widget `kennungen`); neue Abschnitte `kennung` (Präfixe nach ISO 3166: `DE` für den Bund, `DE-BW` bis `DE-TH` für die Länder) und `zeitstrahl` (sieben Typen, `typ_bewertung`, `typ_berichtigung`, Richtwert zwölf Zeilen je Sachverhalt). Stufentexte, Kennsätze und Quellenkategorien unverändert.
- **Kodierleitfaden 1.6.0:** neuer Abschnitt 8 „Zeitstrahl, Sachverhaltskennung und Bezug“ (Form mit Kenntniszeit „aufgenommen“, Vergabe, Typen, acht Regeln mit getrennter Ereignis- und Kenntniszeit, Beispiel aus dem Datensatz „Ilka“); Abschnitt 6 mit den Leerwerten der neuen Felder; Pflege jetzt Abschnitt 9; Titel und Einleitung ergänzt. Achsenregeln, Stufentexte und Quellenkategorien unverändert.
- **Arbeitsanweisung Erfassung 1.8.0:** Absatz „Zeitstrahl, Kennung und Bezug“ in 4.3 (Platzhalter `NEU-n`, Zeilen der Vormeldung wortgleich, Berichtigung statt Änderung, keine Bewertungszeilen und keine Kenntniszeit, Ereigniszeit); Prüfpunkt „Zeitstrahl“ in Abschnitt 5; Zeitstrahl zählt nicht zum Redaktionsmaßstab.
- **Arbeitsanweisung Verdichtung 2.2.0:** Regel 15 „Bezug und Zeitstrahl“ (eigene Platzhalter, Bezug auf alle eingehenden Sachverhalte, Zeitstrahl für den eigenen Referenzraum mit Wendepunkten, dasselbe Ereignis einmal, Kenntniszeit setzt die App).
- **SOP-Sammelmappe 3.20.0:** Teil A, A.4, A.7.1, A.8.1, A.8.3 und A.10.2. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Beispieldatensatz Orkantief „Ilka“:** Kennungen für alle acht Sachverhalte; die verdichtete Meldung nennt im Bezug die sieben Sachverhalte der Länder und führt einen Zeitstrahl mit acht Zeilen, jeweils mit der Kenntniszeit 14.10.2026 14:00 (Meldezeitpunkt der verdichteten Meldung); `LIESMICH.md` ergänzt. Übrige Inhalte und Entstehungsangaben unverändert.
- **Prüfvermerk nach A.10.2:** Erfassung (1.8.0) und Verdichtung (2.2.0) auf Grundlage von Teil A 3.20.0 und Kodierleitfaden 1.6.0 geprüft und angepasst. Kurzfassung 2.4.0 geprüft, kein Anpassungsbedarf: Die App gibt der Management Summary den Zeitstrahl nicht mit (wie das Quellenverzeichnis).
- Quellenregister und Bewertungsfälle sind unverändert.

## 1.32.0 – 29.10.2026

Grundlage: Rückmeldung des Herausgebers vom 29.10.2026: Die Kurzantwort der KI-Erfassung war zu ausführlich, unstrukturiert und eher an die Technik als an die prüfende Person gerichtet. Zweite Stelle, weil sich eine Ausgaberegel der Erfassung ändert. Damit wird die Form der Kurzantwort aus 1.31.0 (TP-2026-W44-32) ersetzt.

- **Arbeitsanweisung Erfassung 1.7.0:**
  - Kurzantwort als Prüfauftrag: was die prüfende Person vor der Freigabe wissen, bestätigen oder nachprüfen muss; kein Arbeitsprotokoll. Höchstens vier beschriftete Zeilen „Kernaussage“ (immer; mit Beurteilung und Bezugsraum), „Bitte bestätigen“, „Lücken“, „Nicht übernommen“; Zeilen ohne Inhalt entfallen statt „keine“.
  - Nicht mehr in der Kurzantwort: Angaben, die die App selbst anzeigt (Arbeits- und Zeitmodus, Meldezeitpunkt, Zahl der Suchen und Abrufe, Pflichtsuchen, nicht abrufbare Seiten, angewandte SOPs und Bausteine mit Fassung und Status, Kodierleitfaden), und Selbstauskünfte ohne Prüfwert. Den Arbeitsmodus nennt die Kurzantwort nur noch, wenn er Aussagen begrenzt.
  - Sprache: je Zeile höchstens zwei Sätze, insgesamt höchstens 120 Wörter; Radarachsen mit Nummer und Kurznamen, Prüffragen mit ihrem Gegenstand statt ihrer Kennung, keine Stufenkürzel (S1, S2, t0); bewusst offene Achsen nur, wenn eine Entscheidung zu bestätigen ist. Fiktives Beispiel ergänzt.
  - Alle bisherigen Zuweisungen an die Kurzantwort bleiben erhalten und stehen in der sachlich passenden Zeile: Abweichungen von der bestätigten Gliederung, Rangfolgefragen und Rollenunstimmigkeiten unter „Bitte bestätigen“; nicht zugängliche Prüffragen, nicht beigefügte SOPs, fehlende Fach-SOP und „nur Material“ unter „Lücken“; nicht befolgte Aufforderungen im Material unter „Nicht übernommen“; „Dringend prüfen:“ weiterhin davor.
- **SOP-Sammelmappe 3.19.1:** nur Gültigkeitsstand in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** keine Änderung an Teil A oder am Kodierleitfaden; Verdichtung 2.1.0 und Kurzfassung 2.4.0 nicht betroffen (die Verdichtung hat eine eigene Kurzantwort).
- Schema, Darstellungsdatei, Kodierleitfaden, Arbeitsanweisungen Verdichtung und Kurzfassung, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.31.0 – 27.10.2026

Grundlage: Befunddatei `ki-lead-befund_technik_2026-W44.json`, Befunde TP-2026-W44-28 bis -35 (Kategorie Arbeitsanweisungen), vom Herausgeber am 26.10.2026 freigegeben (TP-2026-W44-30, -31 und -32 mit Maßgabe angepasst). Zweite Stelle, weil sich Regeln und die Pflegesystematik ändern (Zählregeln in A.3, Ausnahme C09, ein Ort für Achsen- und Quellenregeln).

- **Kodierleitfaden 1.5.0** (TP-2026-W44-32): einziger Ort für Achsenregeln, Quellenkategorien und die Rangfolge bei Widersprüchen; Einleitung, Rangfolge und Pflege entsprechend gefasst. Übernommen, weil sie nur in Teil A oder der Erfassung standen: Aussagekompetenz der Quellen, Format für Eingangsmaterial ohne URL, Beispiel Lagebericht des GMLZ, frühere Kennung „J“, Beurteilung mit Unsicherheit und Handlungsbedarf, Erklärung bei unvollkommener Skala, Feld der Wirkungskette. Stufentexte, Achsenregeln und Quellenkategorien sonst unverändert.
- **Entscheidungen des Herausgebers vom 27.10.2026 zu TP-2026-W44-32** (im Kodierleitfaden 1.5.0, ohne neue Fassungsnummer): JSON-Schema der Meldung steht mit den Stufentexten auf Rang 1 der Rangfolge; Dateiformat und Bearbeitungsmodus sind für die Quellenkategorie unerheblich; bestehende Quelleneinträge werden in keiner Kategorie automatisch umgestuft; Aktualität gehört zur Kodierfrage von D7. Fassungstabelle des Kodierleitfadens aufsteigend sortiert. SOP-Sammelmappe bleibt 3.19.0.
- **Arbeitsanweisung Erfassung 1.6.0:**
  - Gliederung Rolle → Arbeitsprodukt → Grundlagen und Rangfolge → Regeln (4.1–4.4) → Ausgabe; Rangfolge, Quellentabelle, Zuordnungsregeln, Unabhängigkeit, Stolperstellen der Achsen, Begründungsmuster und Regeln zu Beurteilung und Tendenz durch verbindliche Verweise auf den Kodierleitfaden ersetzt; die Anweisung nennt nur Arbeitsschritte und Abweichungen der KI (TP-2026-W44-32).
  - Kurzantwort als acht beschriftete Zeilen (Kernaussage, Arbeitsmodus, SOPs, Abweichungen von S1, Beurteilung, Offene Achsen, Quellen, Nicht befolgte Aufforderungen) statt „höchstens acht Sätze“ (TP-2026-W44-32, achte Zeile TP-2026-W44-29).
  - Kein Verweis mehr auf ein Beispiel-JSON, das die App nie beilegt (Kopf und Rangfolge, TP-2026-W44-28).
  - Abschnitt „Auftrag“ ohne `{{auftrag.*}}` und `{{jetzt}}`: Auftragsangaben und Bearbeitungszeitpunkt stehen im Steuerungsblock der App; die Anweisung ist damit statisch und wird gecacht (TP-2026-W44-31).
  - Arbeitsmodus „Recherche gewählt, aber nicht verfügbar“ statt „Recherche technisch gescheitert“, wie im Steuerungsblock; `_entstehung`: `kodierleitfaden` setzt nur die App, Beispiel in ihrer Form („Kodierleitfaden LEAD 1.5.0“) (TP-2026-W44-35).
- **Arbeitsanweisung Verdichtung 2.1.0:** Regeln 3 und 4 verweisen auf A.3 und sind nummerierte Prüflisten (TP-2026-W44-30); Abschnitt „Beispiele“ mit zwei Positiv-/Negativpaaren (Zeitbezug, Rolle; TP-2026-W44-34); Geltungstabelle und Verweise auf die neue Gliederung der Erfassung (TP-2026-W44-32).
- **Arbeitsanweisung Kurzfassung 2.4.0:** Regel zu Bewertungs-, Tendenz- und Modalwörtern und zu Rollen mit zwei Positiv-/Negativpaaren (TP-2026-W44-34); die App weist auf Abweichungen hin.
- **Darstellungsdatei (Profilversion 1.31.0):** `quellen.kategorien` nur mit den Kategorienamen, `quellen.rangfolge_hinweis` als Kurzhinweis mit Verweis auf Kodierleitfaden Abschnitt 5 (TP-2026-W44-32). Stufentexte und Kennsätze unverändert.
- **SOP-Sammelmappe 3.19.0:** A.3 mit Zählregeln zu Zeitbezug, Teilmenge, Summe und Hochrechnung und zur Zuordnung zum Raum mit Ausnahme C09 (TP-2026-W44-30); A.2 und A.3 verweisen auf den Kodierleitfaden, Pflegeregel A.10.2 „ein Ort, Verweise sonst“ (TP-2026-W44-32); C09 1.3.0. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Erfassung (1.6.0), Verdichtung (2.1.0) und Kurzfassung (2.4.0) auf Grundlage von Teil A 3.19.0 und Kodierleitfaden 1.5.0 geprüft und angepasst.
- Schema, Stufentexte, Kennsätze, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.30.0 – 26.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz_2026-W44_lauf-9t2q.json`, Befunde KP-2026-W44-20 bis -24, vom Herausgeber am 26.10.2026 freigegeben. Zweite Stelle, weil die SOP-Sammelmappe neue Rechercheeinstiege und eine neue Prüffrage erhält.

- **SOP-Sammelmappe 3.18.0:** BSH und DWD als Recherchepunkte in B01, B02, B06 und C13; Quellenregister mit S068 und S073–S075. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Kodierleitfaden, Darstellungsdatei und Arbeitsanweisungen geprüft, kein Anpassungsbedarf; Kodier- und Quellenregeln unverändert.
- Schema, Darstellungsdatei, Kodierleitfaden, Arbeitsanweisungen, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.29.0 – 26.10.2026

Grundlage: Befunddatei `ki-lead-befund_konsistenz_2026-W44.json` (Anlass: Lauf 20261026-201050-q25q, Recherche gewählt, null Websuchen in S2), Befunde KP-2026-W44-01 und -10, vom Herausgeber am 26.10.2026 freigegeben. Zweite Stelle, weil sich eine Arbeitsregel ändert: Bei „Recherche durchführen“ ist die Recherche verbindlich.

- **Arbeitsanweisung Erfassung 1.5.0:** Arbeitsmodus „Recherche durchführen“ statt „Recherche erlaubt“. Abschnitt 3: zuerst die bestätigten Pflichtsuchen, Ergebnis einordnen (auch „gesucht, nichts gefunden“), danach Recherche im Rahmen der Recherchetiefe mit Mindestumfang je Sachverhalt (zuständige Primärquelle zum Kernbefund); Rechercheeinstiege aus der Orientierungssuche sind kein Beleg ohne eigene Prüfung; Aktualitätsprüfung der dynamischen Kernangaben verbindlich. Kurzantwort mit Zahl der Suchen, geprüften Primärquellen und der Unterscheidung „nicht gesucht“, „gesucht, nichts gefunden“, „nicht abrufbar“.
- **Arbeitsanweisung Verdichtung 2.0.3:** nur der Modusname im Geltungsbereich von Abschnitt 3 („Recherche durchführen“).
- **SOP-Sammelmappe 3.17.3:** nur Gültigkeitsstand in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Kodierleitfaden, Darstellungsdatei und Arbeitsanweisung Kurzfassung geprüft, kein Anpassungsbedarf; Achsenregeln und Quellenkategorien unverändert.
- Schema, Darstellungsdatei, Kodierleitfaden, Arbeitsanweisung Kurzfassung, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.28.0 – 25.10.2026

Grundlage: Nachreihe der Management Summary mit Arbeitsanweisung 2.2.0 (Befunddatei `ki-lead-befund_nachreihen_2026-W43.json`, Befund AV-2026-W43-40), vom Herausgeber am 25.10.2026 freigegeben.

- **Arbeitsanweisung Kurzfassung 2.3.0:** Der Kennsatz „Klärungsbedarf:“ steht nur bei einem wesentlichen Widerspruch der Meldung, nie für offene Prüfaufgaben oder Fristen; diese gehören in Maßnahmen & Handlungsempfehlungen. Anlass: Mit 2.2.0 begann Sonnet „mittel“ alle drei Kernaussagen mit „Klärungsbedarf“, obwohl die Musterfassung keinen Widerspruch enthält. Zweite Stelle, weil die Regel präzisiert wird.
- **SOP-Sammelmappe 3.17.2:** nur Gültigkeitsstand in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Teil A ändert nur den Gültigkeitsstand; Erfassung (1.4.0) und Verdichtung (2.0.2) geprüft, kein Anpassungsbedarf.
- Schema, Darstellungsdatei, Kodierleitfaden, Arbeitsanweisungen Erfassung und Verdichtung, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.27.0 – 25.10.2026

Grundlage: Auswertung der Management Summary und des Prüffalls Reparatur vom 25.10.2026 (Befunddatei `ki-lead-befund_profilauswahl_2026-W43.json`, Befund AV-2026-W43-36), vom Herausgeber am 25.10.2026 freigegeben.

- **Arbeitsanweisung Kurzfassung 2.2.0:** Länge als Obergrenze (rund 150, höchstens 180 Wörter) statt als Toleranz, mit Kürzungsregel: zuerst Einzelheiten zu Orten und Uhrzeiten, nie Kernaussage oder offene Prüfaufgaben. Anlass: Die Modelle von Anthropic überschritten 180 Wörter in 7 von 9 Läufen (Ergebnis `evaluation/abnahmen/2026-10-25-management-summary-ilka-ergebnis.md`).
- **SOP-Sammelmappe 3.17.1:** nur Gültigkeitsstand in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Prüfvermerk nach A.10.2:** Teil A ändert nur den Gültigkeitsstand; Erfassung (1.4.0) und Verdichtung (2.0.2) geprüft, kein Anpassungsbedarf.
- Schema, Darstellungsdatei, Kodierleitfaden, Arbeitsanweisungen Erfassung und Verdichtung, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.26.0 – 24.10.2026

Grundlage: Erfassungstest KW 43 (Befunddatei `ki-lead-befund_erfassungstest_2026-W43.json`, Befunde ET-2026-W43-01 bis -07), vom Herausgeber am 24.10.2026 freigegeben.

- **SOP-Sammelmappe 3.17.0:** B10 2.2.0, B15 2.5.0, C07 1.3.0, A.2 D5. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Kodierleitfaden 1.4.0:** Grundregel 1 (Ist-Kodierung nach Ende der Einschränkung), D5 (erreichter Zielzustand, Mindestprognose), drei Kurzbeispiele einschließlich D3 bei kreisfreien Städten (ET-2026-W43-01, -04, -06).
- **Prüfvermerk nach A.10.2 (Änderung an Teil A.2 D5):** Erfassung geprüft auf Grundlage 1.4.0, kein Anpassungsbedarf (Abschnitt 5 verweist für Achsenregeln auf den Kodierleitfaden). Verdichtung geprüft auf Grundlage 2.0.2, kein Anpassungsbedarf. Kurzfassung geprüft auf Grundlage 2.1.2, kein Anpassungsbedarf.
- Schema, Darstellungsdatei (Stufentexte unverändert), Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.25.0 – 23.10.2026

Grundlage: Konsistenzprüfung KW 43 (Befunddatei `ki-lead-befund_konsistenz_2026-W43.json`, Befunde KP-2026-W43-12 bis -55), vom Herausgeber am 23.10.2026 freigegeben; KP-2026-W43-17 und -49 zurückgestellt.

- **SOP-Sammelmappe 3.16.0:** Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Kodierleitfaden 1.3.0:** Mitfortschreibung von Teil A nach A.10.2: D2 (vollzogene Evakuierung, Verlegung, Schutzunterbringung), D3 (Funktionsliste beispielhaft), D6 (nicht allein Ausfalldauer), Rangfolge mit Beispielfassungen, Pflegeregel mit Teil A (KP-2026-W43-13, -33, -34, -38, -39).
- **Arbeitsanweisung Erfassung 1.4.0:** Vorrangregel für Beispielfassungen (A.1 Nr. 7), `art_zuordnung` nicht abschließend (A.4), Kennungen B06/B08 statt alter Nummern, Kopfzeile „ab Fassung …“ (KP-2026-W43-34, -35, -40, -43).
- **Arbeitsanweisung Verdichtung 2.0.2:** Satzanfang „Einschätzung ({{profil.kurzname}}):“ wie in Erfassung und Darstellungsdatei; Kennsatz „Handlungsrelevant bis:“ wie A.4; Kopfzeile „ab Fassung …“ (KP-2026-W43-36, -37, -43).
- **Arbeitsanweisung Kurzfassung 2.1.2:** Kopfzeile „ab Fassung …“ (KP-2026-W43-43).
- **Darstellungsdatei (Profilversion 1.25.0):** Quellenkategorie M „auch mit Betreiber- oder Behördenzitat“ wie Kodierleitfaden und Erfassung (KP-2026-W43-41).
- **Beispieldatensatz „Ilka“:** LIESMICH unterscheidet die historische Entstehungsangabe `"kodierleitfaden": "LEAD v2.0"` vom gültigen Regelwerk; die Meldungen bleiben unverändert (KP-2026-W43-48).
- **Prüfvermerk nach A.10.2 (Änderungen an Teil A 3.14.0–3.16.0):** Erfassung geprüft auf Grundlage 1.3.3, Anpassungsbedarf ja (umgesetzt in 1.4.0). Verdichtung geprüft auf Grundlage 2.0.1, Anpassungsbedarf ja (2.0.2). Kurzfassung geprüft auf Grundlage 2.1.1, Anpassungsbedarf nur Kopfzeile (2.1.2).
- Schema, Quellenregister und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.
- **Offen:** KP-2026-W43-49 (Quelle Q5 der NI-Meldung: reale Bezugsquelle oder fiktiv; danach Kennzeichnung und Zweckangabe im LIESMICH).

## 1.24.0 – 22.10.2026

Grundlage: Konsistenzprüfung KW 43 (Befunddatei `ki-lead-befund_konsistenz_2026-W43.json`, Befunde KP-2026-W43-01 bis -11), vom Herausgeber freigegeben.

- **SOP-Sammelmappe 3.15.0:** Bausteine an bestehende Regeln angeglichen: D6 in C06, D8 in B08 und C01, Offenlassen in C03, Kopfzeile der Fachgrundlagen in C01 und C12, Typologietabelle C10, Zitierweise C15, Kopfangaben C07 und C11, „KRITIS-Ausfall“ mit der Schwelle von B12 in C12, C13 und C14. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Quellenregister, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.23.0 – 22.10.2026

Grundlage: zwei unabhängig erstellte Vorschlagsdateien zur Sammelmappe 3.13.0 („KI-LEAD_SOP_PR-Vorschlaege_2026-10-22“, 19 Vorschläge; „sop-lead_pr-vorschlaege_2026-10-22“, 28 Vorschläge), gegeneinander geprüft und konsolidiert.

- **SOP-Sammelmappe 3.14.0:** Korrektur interner Bezüge (C10 Tabellenstellung, C07→B11, C17 Fundstellen, A.2 Fassungsangabe, Prüfvermerke) und fachliche Klarstellungen: Zählregel für Evakuierte (A.3, B02, C16), „KRITIS-Ausfall“ nur nach dem Funktionsdach B12 (C09, C10, C15, B17), D7 in C11 nach A.2, Vorrang bei Bausteinen im Status „Beispielfassung“ (A.1 Nr. 7), Landesprodukte als Ereignisbeleg (A.1 Nr. 8), Meldestufen nach § 32 BSIG als Verfahrensstand (B15), Rechtszustände in C17 (Art. 80a, 115a GG), medizinische Gase in C10. Geänderte Fassungen: B02, B03, B04, B06, B08, B14, B16, B17 (dritte Stelle), B07 2.2.1, B10 2.1.0, B15 2.3.0, C01 1.2.1, C07 1.1.1, C09 1.2.0, C10 1.3.0, C11 1.2.0, C13 1.1.1, C15 1.1.1, C16 1.2.0, C17 1.3.0. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Quellenregister: nur Zweckvermerk der BSIG-Fundstelle geändert; keine neuen Links.
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.22.0 – 22.10.2026

Grundlage: konsolidierter Vorschlag „KI-LEAD_SOP_Fachgrundlagen_PR-konsolidiert_2026-10-22“, Arbeitspaket AP2 (Rechts- und Feststellungsstufen mit Typologietabellen).

- **SOP-Sammelmappe 3.13.0:** Typologietabellen und Prüfpfade aus Fachgrundlagen des Bundes und der EU in B07 2.2.0 (Störfallrecht), B08 2.1.0 (Systemzustände, § 13 EnWG), B11 2.3.0 (amtliche Einstufungen), B15 2.2.0 (Meldestufen § 32 BSIG), C10 1.2.0 (Engpassstufen AMG), C14 1.2.0 (Versorgungskrise ESVG), C17 1.2.0 (Rechtszustände GG, Aufgabenfelder der Gesamtverteidigung); C01 1.2.0 mit korrigierter Abgrenzung des Referenzszenarios S14 (glaubhafte Drohung nach Anhang B.14 ANoPl-Bund); Quellenregister um 20 Einträge ergänzt. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.21.0 – 22.10.2026

Grundlage: konsolidierter Vorschlag „KI-LEAD_SOP_Fachgrundlagen_PR-konsolidiert_2026-10-22“. Er führt zwei Vorschläge zusammen: „2026-10-22_KI-LEAD_SOP_Amtliche_Fachstandards_PR-Vorschlag“ (34 Einzelvorschläge, 45 Quellen) und „fachstandard-vorschlaege-sop-lead“ (Fachstandards je SOP nach dem Muster von C01 und C12), geprüft auf Steuerungsebene, bundesweite Nutzbarkeit und Belegbarkeit.

- **SOP-Sammelmappe 3.12.0:** Teil A um die Ebenenregel (A.1 Nr. 8: Steuerungsebene, bundesweite Fachgrundlagen, kein Landesrecht, keine Einsatzvorschriften), die Regel „Fachgrundlagen“ (A.6) und das Format für Typologietabellen und gleichlautende Begriffe (A.10.1) ergänzt. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Teil B, Teil C, Quellenregister, Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Beispiele und Bewertungsfälle sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.20.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_Fachpruefung-B-Quellen-Evaluation_Vorschlag_konsolidiert_2026-10-21“ (priorisierte Prüfung der Bereiche mit Priorität über „Mittel“).

- **SOP-Sammelmappe 3.11.0:**
  - B09 2.2.0: rechtlicher Prüfpfad (Netzbetreiber, Krisenstufe, hoheitliche Lastverteilung), geschützte Kunden nach § 53a EnWG, Versorgungsprofil mit Frist; saisonale Rechtsprüfung 2026/27 als Teilprüfung dokumentiert, EU-Rahmen und Planfassung offen.
  - B01, B02, B07, B14 2.1.0: fachliche Vertiefung (Warnprodukte und B06-Übergang; Nord-/Ostsee, Abschaltungen, Ausweichweg, Nachlauf, Meldestufen-Muster; Mess- und Stoffprofil, Beendigung je Wirkung; Verwendungsgrenze und Schnittstelle Polizei/Gefahrenabwehr).
  - Teil A, A.6: Quellenabgleich mit neuem Quellenregister `sop/quellenregister.json` (alle URLs aus Teil A/B/C, zwei unabhängige Abrufprüfungen).
  - Umgezogene Rechercheeinstiege ersetzt: B05 2.1.1 (NIWIS), B09 (BNetzA-Lageseite), C14 1.1.1 (BMLEH), C16 1.1.1 (BBK-Betreuungsmodule).
  - Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Neuer Regressionstest: Jede URL aus Teil A/B/C hat einen Eintrag im Quellenregister.
- 40 fiktive Bewertungsfälle mit Material und ein Bewertungsplan unter `evaluation/` (außerhalb des Profilpakets); keine Modellläufe.
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.19.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_Querverweise-B-C_Vorschlag_konsolidiert_2026-10-21“ (Prüfung der Bezüge zwischen und innerhalb von Teil B und Teil C, ohne Anlassfall).

- **SOP-Sammelmappe 3.10.0:**
  - Teil A: Bedeutung von Verweisen und Funktionsdach B12 (A.1 Nr. 2), Routentabelle ergänzt (B10, B13, B14; C02, C05, C09, C17), Status je Dateikopf und Semantik von `art_zuordnung` und `anschluss` (A.1 Nr. 7), kombinierte SOPs in der Fortschreibung (A.8.1).
  - Teil B: B03, B05, B06 mit Vertiefung nach Wirkung; B04 D4 und B16 D6 an A.2 angeglichen; B06/B09 mit C12 für die Wärmefunktion; B12 gegenüber spezialisierten Versorgungs-SOPs abgegrenzt; B17 mit C17 als Querschnitt; B08, B10, B13 redaktionell.
  - Teil C: C16 und C17 als Querschnitte (Kopf, Zuordnung, Arbeitsteilung); C02, C04 mit bedingten Ursachenverweisen; C12 Kopf an Abschnitt 1 angeglichen.
  - Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Neue strukturelle Tests der Verweise (vorhandene Kennungen, keine alten Nummernlisten, Katalogwerte in `art_zuordnung`, Statusübersicht).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.18.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_C08_Vorschlag_konsolidiert_2026-10-21“ (allgemeine Überarbeitung ohne Anlassfall).

- **SOP-Sammelmappe 3.9.0:**
  - C08 1.1.0: Zuordnung im Beispielprofil festgelegt („Gesundheitliche Lage / Epidemie“ mit Tiergesundheitsbezug, ohne „Sonstiges“); drei Prüfpfade, Daten-, Human-, Personal-, Beseitigungs- und Versorgungspfad; Prüfpunkte D1–D8.
  - B11 2.2.0: Klarstellung des Anwendungsbereichs für Tierseuchen.
  - C08 bleibt Inhaltsgerüst. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert. Bestehende Meldungen werden nicht umkodiert.

## 1.17.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_C14-C15_Vorschlag_konsolidiert_2026-10-21“ (allgemeine Überarbeitung ohne Anlassfall).

- **SOP-Sammelmappe 3.8.0:**
  - C14 1.1.0: Leistungskette bis zur Abgabe, Eignung und Zugang, sichere Nutzbarkeit, Statuspfad für Ersatzversorgung und Reserven, Abgrenzung zu B11/C07 und C08, Prüfpunkte D1–D8.
  - C15 1.1.0: drei Prüfpfade, Sanitärersatz, Einleitung und Folgewirkung, kritischer Entsorgungspfad einschließlich Tierkörperbeseitigung, Prüfpunkte D1–D8.
  - Teil A, A.1 Nr. 2: Route B08 um C14 ergänzt.
  - Beide bleiben Inhaltsgerüste. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.16.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_C05-C06-C13_Vorschlag_konsolidiert_2026-10-21“ (allgemeine Überarbeitung ohne Anlassfall).

- **SOP-Sammelmappe 3.7.0:**
  - C05 1.1.0: Abgrenzung zu B07 und B16, `art_zuordnung` ergänzt; Personenprofil, Schutzentscheidungen, Zielzustand, psychosoziale Notfallversorgung; D2 nach Kodierleitfaden.
  - C06 1.1.0: Verdacht und kleine kritische Maßnahmen, Relevanz für die Wochenlage, Warnung, Rückkehr, Versorgungskette.
  - C13 1.1.0: Luftverkehr, Umschlag und Verteilung, Prüfhilfe unter der Ursachen-SOP, nutzbarer Ersatz, Zeitkritikalität; D2 nach Kodierleitfaden.
  - Alle bleiben Inhaltsgerüste. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.15.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_C02-C03-C04_Vorschlag_konsolidiert_2026-10-21“ (allgemeine Überarbeitung ohne Anlassfall).

- **SOP-Sammelmappe 3.6.0:**
  - C02 1.1.0: unabhängig von der Ursache, damit passend zur Route B04 → C02; Befundprofil, Spezialfähigkeiten, Schutzfolgen, Freigabe, Prüfpunkte D1–D8.
  - C03 1.1.0: D6 an den Kodierleitfaden angeglichen; Warn- und Messprofil, Funktionsprofil, unabhängige Redundanz, Prüfpunkte D1–D8.
  - C04 1.1.0: frühe Befassung, Höhen- und Bodenasche, Luftverkehrsstatus, Versorgungspfad, Prüffragen R4–R6, Prüfpunkte D1–D8.
  - Alle bleiben Inhaltsgerüste. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.14.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_C09-C10_Vorschlag_konsolidiert_2026-10-21“ (allgemeine Überarbeitung ohne Anlassfall).

- **SOP-Sammelmappe 3.5.0:** C09 1.1.0, neuer Titel „Medizinische und pflegerische Versorgungslage und MANV-Folgen“. Abgrenzung nach Versorgungsfunktion, häusliche Versorgung, Rettungsdienst, Verlegung und Evakuierung, Tragfähigkeit, Prüfpunkte D1–D8. C10 1.1.0: alle Produktgruppen einschließlich Impfstoffen, Blutprodukten und medizinischen Gasen, Quellen nach Produktgruppe (BfArM, PEI), Reserven, Nutzbarkeit, Reichweite, rechtliche Maßnahmen, Prüfpunkte D1–D8. Beide bleiben Inhaltsgerüste. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.13.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_B11-C07_Vorschlag_konsolidiert_2026-10-21“ (Kalibrierfall Ebola-Ausbruch, Beispielmeldung vom 21.10.2026).

- **SOP-Sammelmappe 3.4.0:** B11 2.1.0 (Tendenz bei Auslandsgeschehen an Kodierleitfaden Abschnitt 4 angeglichen, Abgleich epidemiologischer Angaben, erregerspezifische Fachangaben, IGV-Anlaufstelle), C07 1.1.0 (Deutschlandbezug und Sachverhaltsschnitt, Pfadarten, Fall- und Transferstatus, Reise- und Expositionskette, Fristen, Prüfpunkte D1–D7) und Teil A, A.4 (kein „offen“ als Zeitangabe in Empfehlungen). Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- **Darstellungsdatei, Eingabehilfe „Prüf- und Abstimmungsbedarf:“:** offene Stelle „⟦belegter Termin, Bedingung oder nächster Prüfanlass⟧“ statt „⟦belegter Termin oder offen⟧“, Hinweis ergänzt. Die alte Vorlage geht mit der Darstellungsdatei in die KI-Anfrage und führte in zwei Läufen zu „bis offen“. Satzanfang und übrige Vorlagen sind unverändert.
- Schema, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.12.0 – 21.10.2026

Grundlage: konsolidierter Vorschlag „SOP-LEAD_B15-C11_Vorschlag_konsolidiert_2026-10-21“ (Kalibrierfall Cyber-Vorsorgelage vom 21.10.2026).

- **SOP-Sammelmappe 3.3.0:** B15 2.1.0 (Vorsorgelagen und Schutzabschaltungen, Statusprofil, Prüffragen R7–R9, Prüfpunkte D1/D3/D5/D6/D7, Zeitfenster), C11 1.1.0 (öffentliche Informationsversorgung, Funktions- und Ersatzwegeprofil) und Teil A (A.3 „Teilzugriff“, A.4 „Fristgrundlage“). Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert; die neuen Regeln in Teil A wenden die geltenden Regeln von Kodierleitfaden und Arbeitsanweisung Erfassung an.

## 1.11.0 – 21.10.2026

Grundlage: Umsetzungsbeschreibung vom 21.10.2026 zu manuellen LEAD-Eingabehilfen (umgesetzt mit App 0.4.24).

- **Darstellungsdatei, neuer Abschnitt `feldhilfen`** (Format `lead-feldhilfen/1`): je Analysefeld und für den Text „Bewertung & Tendenz“ eine endliche Liste von Vorlagen mit offenen Stellen ⟦…⟧. Jede Vorlage beginnt mit einem Satzanfang, der schon vorher in `analyse_gliederung`, `bewertung_gliederung` oder `kennsaetze` stand; die Kennsatzvorlagen geben das Fristformat aus A.4, den Textbaustein aus A.7.2 und die Bestandteile des Abschlusses aus A.8.2 wieder. Die Satzanfänge im Einzelnen:
  - „Lage & Ereignis“: „Kernaussage:“, „Bestätigt ist“, „Einordnung „…“:“.
  - „Risiken & Auswirkungen“: „Eingetretene Wirkungen:“, „Mögliche Entwicklungen:“, „Szenario:“, „Einschätzung (…):“.
  - „Maßnahmen & Handlungsempfehlungen“: „Bestehende Maßnahmen:“ (mit den sieben Status aus A.4, ohne Vorauswahl), „Prüf- und Abstimmungsbedarf:“, „Abstimmungen“.
  - „Abhängigkeiten & Interdependenzen“: „Belegte Kopplungen:“, „Wirkungskette:“, „Szenario:“.
  - „Bewertung & Tendenz“: „Kernaussage:“, „Referenzraum:“ (Referenzraum offen, t0 aus dem Meldezeitpunkt in der Form der Beispielmeldungen), „Beurteilung „…“:“ und „Tendenz „…“:“ (nur mit gewähltem Wert) sowie die fünf Kennsätze `Neubewertung bei:`, `Handlungsrelevant bis:`, `Änderung zur Vormeldung:`, `Abweichende Bewertung:`, `Abschluss im Lagebild:`.
- Es gibt keine neuen Satzanfänge, Kennsätze, Gliederungsmuster, Feldhinweise oder Statuswerte. Die Vorlagen sind freiwillige Eingabehilfen; freie Formulierung bleibt zulässig.
- **SOP-Sammelmappe 3.2.4:** nur Gültigkeitsstand in Teil A fortgeschrieben (Darstellungsdatei jetzt Profilversion 1.11.0); Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Schema, Arbeitsanweisungen, Kodierleitfaden, SOP-Inhalte und Beispiele sind unverändert.

## 1.10.0 – 21.10.2026

Grundlage: Testreihe der KI-Modelle vom 20.10.2026 und zwei Prüfungen (umgesetzt mit App 0.4.21).

- **Modellvorgabe:** `modelle.erfassung` jetzt `claude-opus-5-5` (bisher `claude-sonnet-5-5`); S1 und Verdichtung unverändert. Begründete Ermessensentscheidung nach der Testreihe, Einzelheiten im [App-Verlauf](../../CHANGELOG.md).
- **Kodierleitfaden 1.2.2:** Kurzbeispiel zu D8 bei Auslandslagen ohne deutsche Beobachtungsbasis (offen, nicht 0). Die Regel in Abschnitt D8 ist unverändert; das Beispiel macht sie eindeutig, weil in der Testreihe zwei Entwürfe D8 = 0 für eine Auslandslage setzten.
- **SOP-Sammelmappe 3.2.3:** nur Gültigkeitsstand in Teil A fortgeschrieben (Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md)).
- Schema, Darstellungsdatei, Arbeitsanweisungen und Beispiele sind unverändert.

## 1.9.1 – 21.10.2026

Aufräumen, fachlich unverändert.

- **SOP-Sammelmappe 3.2.2:** Der Ordner `sop/archiv/` mit den Fassungen 1.0.1 und 2.0.1 ist entfernt; beide bleiben unverändert im Git-Verlauf abrufbar (Verweise mit Prüfsumme in `sop/README.md`). Gültigkeitsstand in Teil A fortgeschrieben, Lesefassung neu erzeugt. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Weil die eingebettete SOP-Übersicht `sop/README.md` sich ändert, ändert sich die Prüfsumme des Profils; deshalb die neue Profilversion. Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

## 1.9.0 – 20.10.2026

Grundlage: Anforderung vom 20.10.2026, Uhrzeiten in den Zeitfeldern der Meldung optional erfassen zu können (umgesetzt mit App 0.4.18).

- **Meldungsschema (LEAD-Meldevorlage 1.1, Schemakennung unverändert `LEAD-Meldung-v1`):** `meldezeitraum.von`, `meldezeitraum.bis` und `sachverhalte[].eintritt` nehmen neben dem Tag (`JJJJ-MM-TT`) auch Tag mit Uhrzeit an (`JJJJ-MM-TTThh:mm`, neue Definition `datumOptionalZeitOderLeer`). Die Erweiterung ist abwärtskompatibel: Alle bisherigen Meldungen bleiben gültig, eine Migration ist nicht nötig. Meldungen mit Uhrzeit in diesen Feldern sind für Empfänger mit Profilversion 1.8.0 oder älter nicht schemakonform.
- **Darstellungsdatei:** Diese drei Felder verwenden das Widget `datum_uhrzeit` (Tag, Uhrzeit optional, Schaltflächen „Jetzt“, „Nur Tag“, „Leeren“); Hinweis beim Meldezeitraum ergänzt.
- **Arbeitsanweisung Erfassung 1.3.3 und Kodierleitfaden 1.2.1 (Abschnitt 6):** Uhrzeit in `eintritt` und `meldezeitraum` nur, wenn das Material sie belegt.
- **SOP-Sammelmappe 3.2.1:** nur Gültigkeitsstand in Teil A fortgeschrieben (Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md)); Regeln, SOPs und Bausteine unverändert.
- Arbeitsanweisungen Verdichtung und Kurzfassung sowie die Beispiele sind unverändert; ihr Bezug auf die LEAD-Meldevorlage 1.0 bleibt zutreffend, weil 1.1 abwärtskompatibel ist.

## 1.8.0 – 20.10.2026

Grundlage: Vorschlag „SOP-LEAD_C12_Vorschlag_konsolidiert_2026-10-20“ (Entscheidungen E1–E3 wie empfohlen).

- **SOP-Sammelmappe 3.2.0** mit fachlich überarbeitetem Baustein C12 1.1.0 (Kraftstoff- und Wärmeversorgung). Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen und Schema sind unverändert.

## 1.7.0 – 20.10.2026

Grundlage: Vorschlag „SOP-LEAD_C01_Vorschlag_konsolidiert_2026-10-20“ (Entscheidungen E1–E4 wie empfohlen, E4 in neuer Fassung ohne Änderung der App).

- **SOP-Sammelmappe 3.1.0** mit fachlich überarbeitetem Baustein C01 1.1.0 (Referenzszenarien des ANoPl-Bund) und der Redaktionsregel zu Quellenverweisen in Teil A. Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).
- Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen und Schema sind unverändert.

## 1.6.2 – 20.10.2026

Grundlage: Vorschlag „KI-LEAD_Profile_Ergonomie_Vorschlag_konsolidiert_2026-10-20“ (Entscheidungen D1–D6 wie empfohlen). Fachlich unverändert.

- `sop/README.md` ist wieder in die App eingebettet; die Profilansicht zeigt sie als Lesedokument (nicht als SOP). Dadurch ändert sich die Prüfsumme des mitgelieferten Profils. Ohne neue Profilversion würde ein exportiertes 1.6.1-Paket beim Import als Versionskonflikt abgelehnt.
- `sop/README.md` (redaktionell): Hinweis, dass die App die Übersicht als Lesedokument zeigt. SOP-Sammelmappe bleibt Fassung 3.0.1; Teil A und alle SOP- und Bausteindateien sind unverändert. Die Darstellungsdatei bleibt auf dem Stand der Profilversion 1.6.1, wie im Gültigkeitsstand von Teil A angegeben.

## 1.6.1 – 20.10.2026

Grundlage: Vorschlag „KI-LEAD_SOP_Integration_Vorschlag_konsolidiert_2026-10-20“ (Entscheidungen E1 und E2 wie empfohlen).

- **SOP-Sammelmappe 3.0.1** (redaktionell; Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md)).
- **Arbeitsanweisung Erfassung 1.3.2** (redaktionell): `_entstehung.sop` nennt die angewandten unter den beigefügten SOPs; die App führt im Nachweis die beigefügten und weist Abweichungen als Prüfhinweis aus.
- In die App eingebettet werden nur noch die Dateien, die sie liest: `sop/archiv/`, die erzeugte Lesefassung und `sop/README.md` bleiben im Repository, aber außerhalb des Builds. Dadurch ändert sich die Prüfsumme des mitgelieferten Profils.

## 1.6.0 – 19.10.2026

Grundlage: Strukturvorschlag „SOP-LEAD_Strukturvorschlag_Teil-B-C_2026-10-19“, freigegeben am 19.10.2026. Nur Struktur, keine fachlichen Änderungen.

### SOP-Sammelmappe

- Das Manifest bindet die SOP-LEAD-Sammelmappe **Fassung 3.0** ein: `sop/A_Gemeinsame-Regeln.md`, `sop/teil-b/B01_…` bis `B17_…` und `sop/teil-c/C01_…` bis `C17_…` (35 Dateien in Katalog- bzw. Registerreihenfolge). Erzeugte Lesefassung `sop/SOP-LEAD_Sammelmappe_Lesefassung.md`. Übersicht und Konkordanz in `sop/README.md`, frühere Fassungen unter `sop/archiv/`. Einzelheiten ausschließlich in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).

### Arbeitsanweisungen

- **Erfassung 1.3.1** (redaktionell): Kennungen B01–B17 und C01–C17, „Prüffragen“ statt „Recherchebausteine“, Beispiel in `_entstehung` mit „SOP-LEAD B01 … v2.0.1“; Bezug auf Sammelmappe 3.0.
- **Verdichtung 2.0.1** und **Kurzfassung 2.1.1** (redaktionell): Bezug auf Sammelmappe 3.0 und die neuen Fassungen; „Prüffragen“.

### Manifest und Beispiele

- `profil.json`: Version 1.6.0; `sop.dateien` mit 35 Einträgen.
- Datensatz Orkantief „Ilka“ (FIKTIV): unverändert. Die Angaben in `_entstehung.sop` („SOP-LEAD 01 Unwetter / Sturm v2.0“) sind historische Herkunftsangaben und werden nicht umgeschrieben; die App bildet sie über `bisherige_kennung` auf die aktuellen Kennungen ab.

## 1.5.0 – 19.10.2026

Grundlage: Prüfung des Fachreviews der Arbeitsanweisungen vom 19.10.2026; Kennungen in eckigen Klammern (G = gemeinsam, E = Erfassung, V = Verdichtung, K = Kurzfassung, X = Streichung, O = ergänzende Vorschläge der Prüfung).

### SOP-Sammelmappe

- Das Manifest bindet weiterhin `sop/SOP-LEAD_Sammelmappe_v2.0.md` ein, jetzt in **Fassung 2.0.1** (Gültigkeitsstand, Maßnahmenstatus, Kennsatzformat); Einzelheiten in [`sop/CHANGELOG.md`](sop/CHANGELOG.md).

### Arbeitsanweisungen

- **Erfassung Fassung 1.3:** Abschnitt „Arbeitsprodukte, Material und Arbeitsmodus“ mit den drei Arbeitsprodukten [G01], Material als Datum statt Anweisung und Vorrang der bestätigten Rolle [G03], den Modi „Recherche erlaubt“, „nur Material“ und „Recherche gescheitert“ [E02] und drei Zeitmodi [E05]. Rollenprofil aus den neuen Profilvariablen `rollenprofil` und `rolle_beschreibung` statt fester Koordinierungsstellen-Sätze; Satz „weder eine Meldung eines Landes“ ersetzt [E01]. Recherchebausteine nach Anwendbarkeit (nicht anwendbar, nicht belegbar, nicht zugänglich) statt „Bearbeite jeden Baustein“ [E03]. Abweichung von S1, nicht beigefügte SOPs und fehlende Grundlagen geregelt [E04]. `eintritt` bleibt bei schleichenden Trends leer [E06, X01]. Zugriffsdatum nur aus tatsächlicher Einsicht oder Metadaten, keine Kategorienmischung als Beleganforderung [E07, X02]. Maßnahmenstatus um „angefordert“ und „wirksam“ ergänzt, Empfehlungen ohne Anordnungsstil [E08]. Kein erzwungener Inhalt ohne tragfähigen Gegenstand [E09]. „Keine schemafremden Felder“, Beispielwerte in `_entstehung` nicht ungeprüft übernehmen, Quellenprüfung einschließlich Bereichsverweisen [E10]. Achsenregeln nur noch als Stolperstellen mit Verweis auf den Kodierleitfaden [G05, X08]. Kennsatzformat „Handlungsrelevant bis: TT.MM.JJJJ HH:MM – Aufgabe, Adressat – Bedingung; Grundlage: Quelle“ [O05]. Redaktionsmaßstab: Querschnittsprüfungen und Bausteine erzeugen nur Text bei Relevanz [O11]. Kurzantwort mit Arbeits- und Zeitmodus und S1-Abweichungen.
- **Verdichtung Fassung 2.0** (vollständig neu gefasst): Geltungstabelle der Erfassungsabschnitte [G02]; Material und Rollen [G03]; 14 Regeln, darunter Gliederung mit sichtbarem Korrekturbedarf [V05], Neukodierung ohne Eingangscodes als Beleg [V02], Zeitbezug und Fortgeltung [V01, X04], Zählen und Addieren mit Mindestwert nach Kodierleitfaden 1.2 statt „Untergrenze“ [V03, G05], Meldungsreihen statt „die jüngste gilt“ [V04, X05], Quellenketten und Faktenwidersprüche [V07], alle offenen und überfälligen Fristen [V06], Mehrfachlagen und Querschnittsprüfungen [O03], Teilabschluss [V08], Fortschreibung mit Änderungsart [V08], Quellenkategorie nach Rolle der meldenden Stelle [G04, X06]; eigene Kurzantwort der Verdichtung [O02] mit „Dringend prüfen:“ bei akuter Gefahr [O04].
- **Kurzfassung Fassung 2.1:** Auswahl ohne Änderung der Aussagen [G01]; Status, Nichtwissen und Widersprüche bleiben erkennbar [K05, K07]; Risiko und Wirkungskette als Regelfall statt starrer Grenze [K01, X07]; Runden ohne Verlust von Mindestwerten und Schwellen [K03]; keine erfundenen Adressaten oder Fristen [K04]; sprechende Herkunft über die Herkunftsliste der App [K06, O08]; abweichende Bewertung und Abschluss bei Entscheidungsrelevanz [O07]; Zielwert 150 Wörter mit Toleranz bis 180, abgestimmt mit der App [K02]; genau ein Kurztitel je Sachverhalt, Ausgabe nur als JSON [K10]; Entwurfsvermerk und Fristen setzt die App [K08, K09].
- Alle drei Anweisungen nennen im Kopf die abgestimmten Fassungen von SOP-Sammelmappe, Kodierleitfaden und den jeweils anderen Anweisungen [O09].

### Manifest und Darstellung

- `profil.json`: Version 1.5.0; neue Variablen `rollenprofil` („übergreifende Redaktion“) und `rolle_beschreibung` [E01].
- Darstellungsdatei: Maßnahmenstatus mit „angefordert“ und „wirksam“, Kennsatzformat im Hinweis zum Bewertungstext [E08, O05].

### Offen

- **Informationsschutz:** Regeln zu Verschlusssachen, personenbezogenen Daten und zur Übergabe behördeninterner Lageinformationen an externe KI-Dienste fehlen weiterhin; zu entscheiden ist, ob sie in die Arbeitsanweisungen oder in eine Betriebsregel außerhalb des Profils gehören.
- **Prüffallsammlung:** Die Prüffälle T01–T33 des Fachreviews sind noch nicht als Datei im Profil abgelegt [O10]; die App-Anteile sind durch Tests abgedeckt.

## 1.4.0 – 19.10.2026

### SOP-Sammelmappe

- Das Manifest bindet die SOP-LEAD-Sammelmappe **Fassung 2.0** ein (`sop/SOP-LEAD_Sammelmappe_v2.0.md`, mit Bausteinen in Teil C). Die bisherige Datei `sop/SOP-LEAD_Sammelmappe.md` (Fassung 1.0.1) bleibt unverändert im Ordner und wird nicht mehr geladen. Inhaltliche Änderungen: [`sop/CHANGELOG.md`](sop/CHANGELOG.md).

### Fachliche Regeln

- **Quellenkategorie B (Betreiber):** Kategorien A/B/W/M/P mit der Quellenpriorität A > B > W > M > P. B steht für originäre Angaben eines Betreibers zum eigenen Netz, Standort, System oder zur eigenen Dienstleistung, unabhängig von der Trägerschaft; P umfasst nur noch sonstige private Quellen, deren Aussage keine Betreiberangabe ist. Die Kategorie kennzeichnet Herkunft bzw. Rolle für die verwendete Aussage; unterschiedliche Aussagegegenstände (Gefahrenlage der Behörde, Wiederherstellungsstand des Betreibers) sind kein Widerspruch. Bisherige Kompetenzausnahme „Betreiber für den eigenen Störungsstand“ ist darin aufgegangen.
- **Kodierleitfaden Fassung 1.2** (19.10.2026): Abschnitt 5 „Quellenkategorien A/B/W/M/P“ mit Zuordnungsregeln, neu gefasster Unabhängigkeitsregel (unterschiedliche Kategorien sind kein Unabhängigkeitsnachweis; ein zuständiger Primärbeleg kann tragfähig sein) und Bestätigungsgrad. Gemeinsam mit SOP-Teil A fortgeschrieben: Grundregel 6 „Keine unbelegte Präzision“ mit Mindestkodierung (ersetzt die Untergrenzenregel); Grundregel 7 mit D5 als Prognoseausnahme; D3 ausgewählte Funktion; D4 ohne reguläre Lieferungen und mit Regel zur Sonderbeschaffung; D7 ohne die pauschale Vorhersageregel aus Fassung 1.1, dafür mit fachlich erheblichen Lücken; D8 belegt stabiler Verlauf = 0; vier neue Kurzbeispiele, das Beispiel zu abweichenden Vorhersagen neu gefasst.
- **Arbeitsanweisung Erfassung Fassung 1.2** (19.10.2026): Quellentabelle A/B/W/M/P mit Rollen- und Prioritätsregeln; Bausteine aus Teil C; frühe Befassung; Maßnahmenstatus und adressierte Empfehlungen; Kodierhinweise zu Bandbreite, Mindestwert, D4, D5, D7, D8 wie im Kodierleitfaden 1.2; Beispielkennungen „v2.0“ und „Kodierleitfaden LEAD 1.2“.

- **Nachträge aus der unabhängigen Prüfung der SOP 2.0** (vor Freigabe, ohne neue Fassungsnummern): Kodierleitfaden 1.2 mit Rangfolge einschließlich der Bausteine aus Teil C, Belegregel statt Vorsichtsregel bei zwei passenden Stufen und drei fiktiven Zuordnungsbeispielen zu den Quellenkategorien; Arbeitsanweisung Erfassung 1.2 mit derselben Belegregel, „D3 Vorsorge“, Sonderbeschaffung bei D4, Inhaltsgerüsten als Prüfhinweis und dem Satzanfang „Dringend prüfen:“ für akute Gefahren in der Kurzantwort.

### Darstellung

- Darstellungsdatei: Hinweis zu „Maßnahmen & Handlungsempfehlungen“ nach SOP-LEAD A.4 (Maßnahmenstatus, adressierte Empfehlungen, Rollenprofil) statt „Keine Meldung eigener Einsatzmaßnahmen“; Untertitel „keine gesonderte Maßnahmenmeldung“; Hinweis zum Bewertungstext nennt alle fünf Kennsätze und das Format TT.MM.JJJJ HH:MM.
- Darstellungsdatei: Kategorie `B` und neu abgegrenzte Erläuterungen zu A, W, M und P; neue Angabe `quellen.rangfolge` (`["A", "B", "W", "M", "P"]`); neu gefasster `rangfolge_hinweis`; Feldhinweis nennt die zulässigen Kategorien.

### Beispiele

- Datensatz Orkantief „Ilka“ (FIKTIV): 15 Quelleneinträge einzeln geprüft und von P auf B umgestuft (Verteilnetz-, Mobilfunk-, Bahninfrastruktur-, Flughafen- und Wasserversorgungsbetreiber zum eigenen Betrieb). Kodierbegründungen und `_entstehung` auf SOP-LEAD 2.0 und Kodierleitfaden 1.2 angeglichen: Hochrechnung im Oberharz (NI) mit Bandbreite statt „Untergrenze“, Mindestwert für Südwestfalen (NW), Bundesmeldung mit gezählter Mindestzahl (mindestens 20.700, zusammen rund 29.000) statt einer Summe aus gezählten und umgerechneten Werten. Der Einsatzbericht der Bergwacht Harz bleibt P, weil er eine Tätigkeit beschreibt und keine Angabe zu einer selbst betriebenen Einrichtung ist. Sonst keine inhaltlichen Änderungen.

## 1.3.0 – 18.10.2026

### Darstellung

- Darstellungsdatei: Abschnitt `analyse_gliederung` für die Gliederung der Analysefelder in Ausgaben. Absätze vor Schlüsselsätzen (Kernaussage, „Bestätigt ist“, „Einordnung „…“:“, Eingetretene Wirkungen, Belegt/Belegte Kopplungen, Nicht belegt, Mögliche Entwicklungen, „Möglich, (aber) nicht belegt“, Szenario, Einschätzung, Bestehende Maßnahmen, Prüf- und Abstimmungsbedarf, Abstimmungen, Wirkungskette, Länderübergreifend); neue Zeile vor „(1) …“, „Empfehlung 1:“, „Erstens, …“ und vor kurzen Aspektbegriffen bis drei Wörter („Strom:“, „Puffer:“). Fachliche Regeln unverändert.

## 1.2.0 – 18.10.2026

### Darstellung

- Darstellungsdatei: Rolle `freigabe` (Freigabeblock in PDF-Ausgaben am Ende); Bezeichnung des Feldes „Freigabe & Versand“ statt „Freigabe“; Abschnitt `bewertung_gliederung` für die Gliederung des Bewertungstexts in Ausgaben (Kernaussage, Referenzraum, Beurteilung, Tendenz, Achsen D1–D8, Achsendivergenz, Einschätzung). Fachliche Regeln unverändert.

## 1.1.0 – 18.10.2026

### Fachliche Regeln

- Kodierleitfaden Fassung 1.1 (17.10.2026, 8648e9a): D3 – berichtete Vorsorge einer Stelle vor dem Akutereignis zählt als Zurechnung auf der Ebene der vorsorgenden Stelle (z. B. Stadt = 1); D7 – widersprüchliche Wasserstands- oder Vorhersagelage = 1, eindeutige Lage = 0; zwei Kurzbeispiele in Abschnitt 7.

### Neu

- Arbeitsanweisung Kurzfassung (Management Summary), Fassung 1.0 vom 17.10.2026 (8648e9a), neu gefasst als Fassung 2.0 vom 18.10.2026 (8cb1dce): eine konsolidierte Leitungsfassung statt Absätzen je Sachverhalt.
- Arbeitsanweisung Verdichtung, Fassung 1.0 vom 18.10.2026 (a6ed060), eingebunden über `anweisungen.verdichtung`.
- Darstellungsdatei: Abschnitt `lagebild` (Titel, nächste Ausgabe, SOP-Fundstellen des Redaktionschecks) und Rolle `tendenz_verschaerfung` (18.10.2026, 0921679).
- Beispieldatensatz Orkantief „Ilka“ (FIKTIV) im Ordner `beispiele/`, im Manifest unter `beispiele` (18.10.2026, 0921679); zuvor lag er unter `tests/daten/`.
- Manifest: `eigene_stellen` mit dem Alias „Koordinierungsstelle (Beispiel) – Redaktionskonferenz“ (18.10.2026, 4ce519f).
- Manifest: Variable `kurzname` „Koordinierungsstelle“ (17.10.2026, 9263994).

### Geändert

- Arbeitsanweisung Erfassung Fassung 1.1 (17.10.2026, be7fb0d und 9263994): „Leerwerte (Beispielschema)“ statt „Schema v4“; Einschätzungen als „Einschätzung ({{profil.kurzname}})“.
- SOP-LEAD-Sammelmappe Fassung 1.0.1 (17.10.2026, be7fb0d): grammatische Korrektur in Teil A („im Rahmen ihrer Koordinationsrolle“).
- Kodierleitfaden Fassung 1.0.1 (17.10.2026, 6bfa6fe): Autorenname im Zitat des Lagenradars („Pereira Wolf, H. (2026)“).

## 1.0.0 – 17.10.2026

- Erstfassung (07b9f29): Manifest, LEAD-Meldevorlage 1.0 (Schemakennung `LEAD-Meldung-v1`), Darstellungsdatei, Arbeitsanweisung Erfassung, SOP-LEAD-Sammelmappe mit 17 Ereignisarten, Kodierleitfaden mit Lagenradar D1–D8 und Quellenkategorien A/W/M/P, Kontaktliste mit Platzhalteradressen. Abgeleitet aus den Arbeitsfassungen SOP-LEAD v0.4 und Kodierleitfaden v0.4, organisationsneutral gefasst.

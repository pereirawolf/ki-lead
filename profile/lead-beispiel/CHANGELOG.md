# Änderungsverlauf Profil „LEAD-Beispiel – Koordinierungsstelle“

Profil-ID `lead.beispiel.koordinierungsstelle`, Inhalte unter CC BY 4.0. Die jüngsten Änderungen stehen zuerst.

**Versionierung:** Die Profilversion in `profil.json` folgt Semantic Versioning. Die erste Stelle ändert sich bei inkompatiblen Schemaänderungen (Meldungen müssen migriert werden), die zweite bei neuen Inhalten oder geänderten Regeln, die dritte bei sprachlichen Korrekturen ohne fachliche Wirkung. Jedes Dokument trägt im Kopf zusätzlich seine eigene Fassung. Jede Profilversion hat außerdem eine Prüfsumme (SHA-256 über alle Dateien), die die App mit jedem KI-Lauf protokolliert; sie unterscheidet auch Stände, die versehentlich ohne neue Versionsnummer veröffentlicht wurden.

**SOP-Änderungen:** Ab Profilversion 1.4.0 stehen Änderungen an der SOP-Sammelmappe ausschließlich im eigenen Verlauf [`sop/CHANGELOG.md`](sop/CHANGELOG.md). Dieser Verlauf nennt dann nur, welche Fassung der Sammelmappe das Profil einbindet.

**Hinweis zur Nachvollziehbarkeit:** Zwischen dem 17. und 18.10.2026 wurden Inhalte geändert, ohne die Profilversion 1.0.0 anzuheben. Diese Änderungen sind in Version 1.1.0 mit Datum und Commit zusammengefasst. Läufe aus diesem Zeitraum lassen sich über die protokollierte Prüfsumme dem genauen Stand im Git-Verlauf zuordnen.

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

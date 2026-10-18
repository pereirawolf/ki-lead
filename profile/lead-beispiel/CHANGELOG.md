# Änderungsverlauf Profil „LEAD-Beispiel – Koordinierungsstelle“

Profil-ID `lead.beispiel.koordinierungsstelle`, Inhalte unter CC BY 4.0. Die jüngsten Änderungen stehen zuerst.

**Versionierung:** Die Profilversion in `profil.json` folgt Semantic Versioning. Die erste Stelle ändert sich bei inkompatiblen Schemaänderungen (Meldungen müssen migriert werden), die zweite bei neuen Inhalten oder geänderten Regeln, die dritte bei sprachlichen Korrekturen ohne fachliche Wirkung. Jedes Dokument trägt im Kopf zusätzlich seine eigene Fassung. Jede Profilversion hat außerdem eine Prüfsumme (SHA-256 über alle Dateien), die die App mit jedem KI-Lauf protokolliert; sie unterscheidet auch Stände, die versehentlich ohne neue Versionsnummer veröffentlicht wurden.

**Hinweis zur Nachvollziehbarkeit:** Zwischen dem 17. und 18.10.2026 wurden Inhalte geändert, ohne die Profilversion 1.0.0 anzuheben. Diese Änderungen sind in Version 1.1.0 mit Datum und Commit zusammengefasst. Läufe aus diesem Zeitraum lassen sich über die protokollierte Prüfsumme dem genauen Stand im Git-Verlauf zuordnen.

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

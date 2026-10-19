<a id="c03"></a>

## C03. Baustein LEAD: Weltraumwetter und Störungen von Navigation und Zeitreferenz

```yaml
kennung: "C03"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein"
lesegruppe: "Besondere Ereignis- und Gefahrenlagen"
lageart: "Weltraumwetter mit konkretem deutschem Funktionsbezug; Navigations-, Zeitreferenz-, Funk- oder Netzstörungen"
art_zuordnung: ["Sonstiges", "KRITIS-Ausfall", "Stromausfall / Blackout"]
art_hinweis: "„Sonstiges“ bei Frühwarnung; „KRITIS-Ausfall“ oder „Stromausfall / Blackout“ nur bei entsprechendem Wirkungseintritt"
anschluss: "B17, B08, B12"
zweck: "Trennung von Vorwarnsignal und tatsächlicher Funktionsstörung bei Weltraumwetter."
version: "1.0.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N15"
bisherige_ids: ["baustein-n15"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Fachlich relevante Weltraumwettersignale mit konkretem deutschem Funktionsbezug und bestätigte Navigations-, Zeitreferenz-, Funk- oder Netzstörungen. Ein Index oder ein Polarlichtnachweis belegt keinen deutschen Netzausfall. Terrestrische GNSS-Manipulation wird nicht ohne Fachnachweis dem Weltraumwetter zugerechnet; sie passt je nach Befund zu B14, B15 oder einer ursachenoffenen KRITIS-Lage. Vulkanasche: C04.

**Befassungsanlässe:** Fachlich relevantes Weltraumwettersignal mit konkretem deutschem Funktionsbezug · bestätigte Navigations-, Zeitreferenz-, Funk- oder Netzstörung.

**Zuordnung im Schema:** „Sonstiges“ bei Frühwarnung; „KRITIS-Ausfall“ oder „Stromausfall / Blackout“ nur bei entsprechendem Wirkungseintritt.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Fachwarnung gilt für welchen Zeitraum und welche technische Wirkung? | [BKG: Weltraumwetter](https://www.bkg.bund.de/DE/Themen/Sicherheit-Weltraum/weltraumwetter/weltraumwetter.html); zuständige Fachdienste | L/R; D8 | Warnung ≠ Störung. |
| R2 | Welche deutsche Infrastruktur oder Dienstleistung ist nach Fach- oder Betreiberbewertung konkret exponiert? | Betreibermeldungen (A.3); Fachbehörden | R/I | Exposition nur nach Fach- oder Betreiberbewertung. |
| R3 | Welche Auswirkungen sind gemessen, welche nur prognostiziert? | Fachdienste; Betreibermeldungen (A.3) | L/R | Gemessen und prognostiziert trennen. |
| R4 | Welche Redundanz oder betriebliche Anpassung ist tatsächlich verfügbar bzw. umgesetzt? | Betreibermeldungen (A.3) | M; D5 | Vorhanden ≠ umgesetzt. |
| R5 | Welche Rolle spielen Navigation, Zeitreferenz, Kommunikation und Energie für die konkrete Folgekette? | Betreibermeldungen (A.3) | I; D6 | Wirkungskette nach A.2 belegen. |
| R6 | Welche fachlichen Entwarnungs- oder Neubewertungsindikatoren bestehen? | Fachdienste | M; D5/D8 | Für Kennsatz `Neubewertung bei:` verwenden. |

### 3. Auswertung: Prüfpunkte

- **D1/D2:** in der Frühwarnphase offen.
- **D6:** nur belegte Störungen.

**Offenlassen:** Die meisten Ist-Achsen in der Frühwarnphase (A.1 Nr. 1).

### 4. Darstellung

Nach B17; Warnung, gemessene Wirkung und Szenario getrennt.

### 5. Ansprechstellen und Pflege

**Offene Punkte:** Fachdienste für Weltraumwetterwarnungen mit Zuständigkeit konkretisieren.

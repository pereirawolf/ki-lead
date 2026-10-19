<a id="c01"></a>

## C01. Baustein LEAD: Radiologische / nukleare Lage

```yaml
kennung: "C01"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein (eigenständige Fach-SOP)"
lesegruppe: "Besondere Ereignis- und Gefahrenlagen"
lageart: "Radiologische / nukleare Lage (Ereignis, Verdacht oder Freisetzung im In- und Ausland mit Deutschlandbezug)"
art_zuordnung: ["Sonstiges", "KRITIS-Ausfall"]
art_hinweis: "„KRITIS-Ausfall“ nur bei belegtem Funktionsbezug; weitere zutreffende Folgenarten ergänzen"
anschluss: "B07, B17"
zweck: "Erfassung und Verdichtung radiologischer Lagen im Anschluss an das maßgebliche radiologische Lagebild, ohne eigene Dosismodellierung oder Schutzempfehlung."
version: "1.0.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N01"
bisherige_ids: ["baustein-n01"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Radiologische Ereignisse, konkrete Verdachtslagen und Freisetzungen im In- und Ausland mit fachlich begründetem Deutschlandbezug (A.1 Nr. 6). Für radiologische Gefahren gelten besondere Fachquellen, Messgrößen und das maßgebliche radiologische Lagebild nach Zuständigkeit von Bund und Ländern. Radiologische Lagen werden nicht als Chemieunfall (B07) umetikettiert. Keine eigene Dosismodellierung und keine eigene Empfehlung zu Jodeinnahme, Evakuierung oder Verzehr.

**Befassungsanlässe:** Zuständige Fachbehörde meldet radiologisches Ereignis oder konkreten Verdacht · überregionales Ereignis im Ausland mit fachlich begründetem Deutschlandbezug · amtliche Schutz- oder Kontrollmaßnahme.

**Zuordnung im Schema:** „Sonstiges“ als Ursachenart; zusätzlich zutreffende Folgenarten (z. B. „KRITIS-Ausfall“ nur bei belegtem Funktionsbezug). Eine eigene Katalogart wird nur nach A.10.4 eingeführt.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist Ereignis, Verdacht, Freisetzung und fachlich bestätigter Stoff- bzw. Anlagenzustand? | Zuständige Fach- und Aufsichtsbehörde; Betreiberangaben (B) getrennt von amtlicher Bewertung (A) | L; D3 | Betreiberangaben zum Anlagenzustand sind B, die Schutzbewertung ist A (A.3). |
| R2 | Welche Fassung des maßgeblichen radiologischen Lagebilds und welche zuständigen Fachinformationen liegen vor? | [BMUKN: Notfallschutz](https://www.bundesumweltministerium.de/themen/strahlenschutz/radiologischer-notfallschutz/notfallschutz) (radiologisches Lagebild des Bundes); Landesbehörden nach Zuständigkeit | L/R | Ausgabestand des Lagebilds angeben; Bundes- und Landeszuständigkeit unterscheiden. |
| R3 | Welche Messwerte, Einheiten, Messorte, Zeiten und fachlichen Bewertungen sind verfügbar? | Messnetze und Messstellen von Bund und Ländern (z. B. Ortsdosisleistungs-Messnetz des BfS); fallbezogen | L; D1/D8 | Messwert ≠ Dosis ≠ Gesundheitswirkung; Einheiten und Zeitbezug erhalten; keine eigene Bewertung. |
| R4 | Welche Räume sind prognostiziert betroffen und welche durch Messungen belegt? | Radiologisches Lagebild; Katastrophenschutzbehörden der Länder | L/R; D1/D2 | Prognostizierte Gefahrenzone, angeordneter Maßnahmenraum und nachgewiesene Betroffenheit unterscheiden; D1/D2 nicht allein aus einem Warnradius ableiten. |
| R5 | Welche amtlichen Schutzmaßnahmen, Lebensmittel- und Wasservorgaben und Freigaben gelten? | Warnung über das Modulare Warnsystem; zuständige Behörden | M; D5 | Nur amtliche Anordnungen mit Geltungsbereich und Stand wiedergeben (A.9.3). |
| R6 | Welche Folgen für Betreuung, Gesundheitsversorgung und andere kritische Dienstleistungen sind belegt oder bedingt zu erwarten? | Lagemeldungen (A.3); Betreibermeldungen (A.3) | R/I; D6 | Belegte Folgen und Szenario trennen; Betreuung nach C16, medizinische Versorgung nach C09. |

### 3. Auswertung: Prüfpunkte

- **D1/D2:** D1 nach belegtem Wirkungsraum bzw. tatsächlich umgesetzter Maßnahme (z. B. durchgeführte Evakuierung, nachgewiesene Kontamination); D2 nur nach gezählten oder amtlich gemeldeten Betroffenen. Ein angeordneter Maßnahmenraum, die Entfernung zur Anlage oder ein Warnradius tragen allein keinen Wert.
- **D3:** Betrieb, Aufsicht und Katastrophenschutz getrennt; bewertete Funktion nennen.
- **D5:** Zielzustand je Maßnahme benennen (z. B. Aufhebung einer Aufenthaltsempfehlung, Freigabe von Lebensmitteln).
- **D7:** nur entscheidungsrelevante Lücken der Lageinformation, nicht die Komplexität der Fachfrage.

**Offenlassen:** D2 ohne amtliche Angabe zu betroffenen Personen; D5 ohne Maßnahmenprognose.

### 4. Darstellung

Nach B07 bzw. B17; zusätzlich Ausgabestand des radiologischen Lagebilds, Messbasis und Maßnahmenraum je getrennt ausweisen.

### 5. Ansprechstellen und Pflege

**Offene Punkte:** Fachquellen (Bundes- und Landeslagebild, Messnetze) mit der zuständigen Stelle konkretisieren; Abgrenzung zu B07 an einem Übungsfall prüfen.

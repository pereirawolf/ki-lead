<a id="c15"></a>

## C15. Baustein LEAD: Arzneimittel und kritisches medizinisches Material

```yaml
kennung: "C15"
typ: "Gesundheitsbaustein"
lageart: "Engpässe bei Arzneimitteln und kritischem medizinischem Material mit relevanten Versorgungsfolgen"
art_zuordnung: ["Gesundheitliche Lage / Epidemie", "KRITIS-Ausfall"]
art_hinweis: "„KRITIS-Ausfall“ bei belegtem Dienstleistungsausfall"
anschluss: "B11, B17"
zweck: "Abgrenzung zwischen Herstellerlieferproblem, therapeutischer Ersatzmöglichkeit und tatsächlich ungedeckter Patientenversorgung."
version: "1.0.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N12"
bisherige_ids: ["baustein-n12"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Fachlich bewertete Engpässe bei Arzneimitteln und Medizinprodukten mit relevanten Versorgungsfolgen. Die Zahl der Datenbankeinträge ist kein Schweregrad. Alternativen nur fachlich belegt nennen; keine eigene Arzneimittelsubstitution empfehlen.

**Befassungsanlässe:** BfArM- bzw. zuständige Fachbewertung eines Engpasses mit relevanten Versorgungsfolgen · bestätigte Unterbrechung kritischer medizinischer Materialversorgung.

**Zuordnung im Schema:** „Gesundheitliche Lage / Epidemie“; „KRITIS-Ausfall“ bei belegtem Dienstleistungsausfall.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welcher Wirkstoff, welche Darreichungsform oder welches Material ist in welcher Versorgungskette betroffen? | [BfArM](https://www.bfarm.de/DE/) (Lieferengpassinformationen); zuständige Fachbehörden | L | Konkrete Produktmeldung und Fachbewertung erforderlich. |
| R2 | Was ist Lieferproblem, vor Ort fehlende Verfügbarkeit und tatsächliche Versorgungslücke? | BfArM; Landesbehörden; Krankenhausträger (B) | L/R; D2 | Lieferengpassmeldung ≠ Versorgungsmangel bei Patientinnen und Patienten. |
| R3 | Welche fachlich anerkannten und tatsächlich verfügbaren Alternativen bestehen? | Zuständige Fachbehörden | R/M | Nur fachlich belegt wiedergeben. |
| R4 | Welche Einrichtungen oder Patientengruppen können ihren Bedarf nicht decken? | Lagemeldungen (A.3); Gesundheitsbehörden | R; D2 | Bedarfsdeckung nach A.9.1. |
| R5 | Welche Bestände, Verteilung und Nachlieferung sind belastbar bestätigt? | Betreibermeldungen (A.3) (Hersteller, Großhandel, Krankenhausapotheken) | M; D5 | Ankündigung ≠ Lieferung. |
| R6 | Welche behördlichen Maßnahmen und Wiederherstellungsprognosen bestehen? | BfArM; zuständige Behörden | M; D5 | Prognosegeber und Stand nennen. |

### 3. Auswertung: Prüfpunkte

- **D2:** nur belegt unversorgte Personen bzw. Patientengruppen mit Zahl.
- **D6:** Kopplung zu Krankenhausversorgung und Pflege belegen.

**Offenlassen:** D2 ohne bezifferte Versorgungslücke; D5 ohne Lieferprognose.

### 4. Darstellung

Nach B11; Lieferproblem, Verfügbarkeit vor Ort und Versorgungslücke getrennt.

### 5. Ansprechstellen und Pflege

**Offene Punkte:** Zuständige Landesbehörden für Arzneimittelversorgung organisationsspezifisch benennen.

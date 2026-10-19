<a id="c11"></a>

## C11. Baustein LEAD: Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit

```yaml
kennung: "C11"
typ: "Themenbaustein"
bausteintyp: "Themenbaustein unter bestehendem Dach"
lesegruppe: "Versorgung, Kommunikation und Logistik"
lageart: "Ausfall oder Störung von Telefonie, Daten, Notruf 110/112, Leitstellen, BOS-Funk oder Warnmitteln"
art_zuordnung: ["KRITIS-Ausfall", "Cyberangriff / IT-Sicherheitsvorfall"]
art_hinweis: "„Cyberangriff / IT-Sicherheitsvorfall“ nur bei entsprechend belegtem Vorfall"
anschluss: "B12, B15, A.9.3"
zweck: "Getrennte Erfassung von Netzzugang, Notrufvermittlung, Leitstelle, BOS-Funk, Warnung und Informationsversorgung."
version: "1.0.1"
status: "Inhaltsgerüst – vor Verwendung Quellen, Fachzuständigkeit und organisationsspezifische Verfahren konkretisieren"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
naechste_pruefung_faellig: "31.03.2027"
bisherige_kennung: "N02"
bisherige_ids: ["baustein-n02"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Einschränkungen von 110/112, Telefonie und Datendiensten, Leitstellen, BOS-Funk und Warnmitteln (einschließlich technisch ausgefallener Warnmittel). 110/112, BOS-Kommunikation und öffentliche Warnung haben unterschiedliche Zuständigkeiten. D7 nur nach Auswirkung auf die Lageinformation der Befassung; die Kommunikation mit der Bevölkerung gehört in den Folgentext und zu D6 (A.2). Ursache zusätzlich über B08, B15 oder B16.

**Befassungsanlässe:** Bestätigter Ausfall eines Notruf- oder Leitstellenwegs · Störung von TK- oder BOS-Diensten oder Warnmitteln mit Schutzbezug.

**Zuordnung im Schema:** „KRITIS-Ausfall“; „Cyberangriff / IT-Sicherheitsvorfall“ zusätzlich nur bei entsprechend belegtem Vorfall.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Welche Funktion ist seit wann in welchem Raum eingeschränkt: 110/112, Telefonie, Daten, Leitstelle, BOS-Funk oder Warnkanal? | Betreibermeldungen (A.3); Leitstellen; Lagemeldungen (A.3) | L; D1 | Teilstörung ≠ Totalausfall; Funktion einzeln benennen. |
| R2 | Welche Trägernetze und gemeinsamen Abhängigkeiten sind betroffen? | Betreibermeldungen (A.3); BNetzA (Telekommunikation) | R/I; D6 | Gemeinsame Abhängigkeiten (Strom, Transportnetz, IT-Dienstleister) belegen. |
| R3 | Sind Auslösung, Übertragung und tatsächliche Erreichbarkeit einer Warnung zu unterscheiden? | [BBK: So werden Sie gewarnt](https://www.bbk.bund.de/DE/Warnung-Vorsorge/Warnung-in-Deutschland/So-werden-Sie-gewarnt/so-werden-sie-gewarnt_node.html); herausgebende Behörde | R/M | Ausgelöst ≠ übertragen ≠ wahrgenommen (A.9.3). |
| R4 | Welche amtlich kommunizierten Alternativen sind tatsächlich erreichbar und wie belastbar? | Lagemeldungen (A.3); zuständige Gefahrenabwehrbehörde | M | Ersatzkontakte nur mit bestätigter Erreichbarkeit und Zuständigkeit wiedergeben; keine ungeprüften Notrufalternativen veröffentlichen. |
| R5 | Welche Folgen bestehen für Rettung, häusliche Versorgung, Warnung und Lageübermittlung? | Lagemeldungen (A.3) | R; D6/D7 | Anrufversuche sind keine Zahl individuell betroffener Personen; aus fehlenden Anrufen folgt keine Schadensfreiheit. |
| R6 | Welche Entstörprognose und welche Reserven sind belegt? | Betreibermeldungen (A.3) | M/R; D5 | Akku- und Notstromreserven mit Reichweite nur nach Betreiberangabe. |

### 3. Auswertung: Prüfpunkte

- **D2:** nur mit belegter Personenzahl; Anrufversuche, Mobilfunkverträge oder Anschlüsse sind keine Personen.
- **D6:** Kernachse; Funktion der Gefahrenabwehr und Warnfähigkeit als Kopplungsobjekt.
- **D7:** nur, wenn die Lageinformation der befassten Stellen selbst betroffen ist (z. B. gestörte Meldewege der Leitstellen).

**Offenlassen:** D2 ohne belegte Personengrundlage; D5 ohne Entstörprognose.

### 4. Darstellung

Nach B12; je Funktion (Notruf, Leitstelle, BOS-Funk, Warnung, Telefonie/Daten) Status, Ersatzweg und Prognose getrennt.

### 5. Ansprechstellen und Pflege

**Offene Punkte:** Zuständige Ansprechstellen für BOS-Funk und Leitstellen organisationsspezifisch festlegen.

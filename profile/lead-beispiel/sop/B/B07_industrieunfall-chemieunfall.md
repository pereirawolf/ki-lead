<a id="b07"></a>

## B07. SOP LEAD: Industrieunfall / Chemieunfall

```yaml
kennung: "B07"
typ: "Ereignis-SOP"
lageart: "Industrieunfall / Chemieunfall (Störfall, Gefahrstofffreisetzung, Gefahrguttransport, industrieller Großbrand)"
art_vorschlag: ["Industrieunfall / Chemieunfall"]
zweck: "Reproduzierbare Erfassung von Störfällen, Gefahrstofffreisetzungen, industriellen Bränden und Explosionen mit Wirkung über das Betriebsgelände hinaus."
version: "2.0.1"
status: "Beispielfassung"
stand: "19.10.2026"
pflegeverantwortlich: "Herausgeber der Beispielfassung (bei Übernahme: fachlich zuständige Funktion eintragen)"
quellen_geprueft_am: "Rechercheeinstiege 26.09.2026 teilweise; Ergänzungen 19.10.2026 vor Erstverwendung prüfen (A.6)"
naechste_pruefung_faellig: "31.03.2027"
pruefausloeser: "Rückblick nach A.8.3; Änderung von Kodierleitfaden, Darstellungsdatei oder Schema"
bisherige_kennung: "07"
bisherige_ids: ["sop-07"]
```

### 1. Anwendungsbereich und Befassungsanlässe

**Umfasst / grenzt ab von:** Brände, Explosionen und Freisetzungen in Anlagen oder bei Gefahrguttransporten mit Außenwirkung, einschließlich Großbränden (z. B. in Batterie-, Lager- oder Recyclinganlagen) mit relevanter Außenwirkung. Industrielle Brände und Explosionen können auch ohne nachgewiesene Freisetzung relevant sein, wenn überörtlicher Rettungs-, Schutz- oder Versorgungsbedarf besteht. Vorsätzliche Taten zusätzlich mit B16, wenn behördlich benannt. Radiologische und nukleare Ereignisse: Baustein C01; sie werden nicht als Chemieunfall umetikettiert. Beispiel dafür: Brand in einem Chemiepark mit Warnung „Fenster und Türen schließen“. Beispiel dagegen: Betriebsunfall ohne Außenwirkung und ohne überörtlichen Bedarf; unbestätigte Geruchswahrnehmung bleibt Prüfhinweis.

**Befassungsanlässe:** Warnung über das Modulare Warnsystem · Störfallmeldung · Lagemeldung eines Landes · Monitoring: Warnungen über das Modulare Warnsystem und VOST-Auswertung.

### 2. Erfassung: Prüffragen

| ID | Leitfrage | Quelle & Aktualität | Prüfen für | Hinweis/Stolperstelle |
|---|---|---|---|---|
| R1 | Was ist zu Anlage, Stoff, Menge und Ursache bestätigt? | Zuständige Immissionsschutz-/Störfallbehörde; Betreibermeldungen und Lagemeldungen (A.3) | L; D3 | Frühe Stoff-, Mengen- und Ursachenangaben sind vorläufig; Betreiberangaben (B) von amtlicher Gefahrenbewertung (A) trennen. |
| R2 | Welche Gefahr geht vom Stoff aus? | GESTIS-Stoffdatenbank (IFA/DGUV); [TUIS (VCI)](https://www.vci.de/themen/logistik-verkehr/tuis/uebersichtsseite.jsp) bei Transport- und Lagerunfällen mit Chemikalien | R | Stoffeigenschaft ≠ gemessene Exposition; keine eigene toxikologische Bewertung. |
| R3 | Welche Messungen und Warn-/Sperrräume sind amtlich belegt? | Lagemeldungen (A.3); Messdienste (ABC-Erkundung, analytische Fachunterstützung wie die Analytische Task Force), Umweltbehörden | L/R; D1 | Stoffidentität, Freisetzung, Messwert, Ausbreitungsmodell, Exposition und beobachtete Gesundheitswirkung trennen; keine Messung ≠ keine Belastung. |
| R4 | Welche Menschen sind exponiert, verletzt oder evakuiert? | Gesundheitsamt; Lagemeldungen (A.3) | R; D2 | Exponierte, Verletzte und Vorsorgeevakuierte getrennt (A.3 Zählregeln). |
| R5 | Welche Umwelt- und Versorgungsfolgen bestehen? | Umwelt-/Wasserbehörden; Betreibermeldungen (A.3); bei Rhein ggf. internationale Warn- und Alarmpläne (IKSR) | R/I; D6 | Sekundärkontamination (Wasser, Boden, Lebensmittel), Löschwasserrückhaltung und Domino-Effekte eigens belegen; grenzüberschreitende Gewässerfolgen getrennt. |
| R6 | Welche Schutz- und Entwarnungshinweise gelten? | [Warnportal des Bundes](https://warnung.bund.de/) und herausgebende Behörde; anlassbezogen | M; D5 | Keine eigene toxikologische Handlungsanweisung; Produktionsfreigabe ≠ sichere Umgebung; Warnlage nach A.9.3. |

### 3. Auswertung: Prüfpunkte

Alle acht Achsen nach Teil A.2 prüfen; hier besonders:

- **D1:** Was ist Mess-, Modell-, Warn- oder Sperrraum? Kodierung nach belegtem Wirkungsraum, Warnung als Maßnahme darstellen.
- **D3:** Betreiber trägt die betriebliche Gefahrenabwehr (Stufe 0 möglich); bei behördlicher Übernahme neu prüfen. Rechtskategorie einer Anlage (z. B. Störfallbetrieb) und eingesetzte Spezialressource bestimmen keinen Radarwert automatisch.
- **D7:** Fehlende Stoffidentifikation kann eine wesentliche Informationslücke sein, wenn sie Schutzentscheidungen betrifft (A.2 D7); widersprüchliche Angaben ebenso. Eine ausstehende Detailanalyse ohne Entscheidungsrelevanz erhöht D7 nicht.

**Beurteilung/Tendenz:** Ende der Freisetzung und Aufhebung der Warnung sind nicht Entspannung aller Folgen; Kontamination kann nachwirken.

**Offenlassen:** D2 ohne abgestimmte Personendaten; D5 solange Stoff- und Freigabefragen keine Dauer erlauben.

### 4. Darstellung

| Meldungsbereich | Lageart-spezifische Leitfrage |
|---|---|
| Lage & Ereignis | Ereignis, Stoff, Messwerte und Warnung mit jeweiligem Zeitstand und Bestätigungsgrad |
| Risiken & Auswirkungen | Gesundheits- und Umweltfolgen belegt vs. möglich; Folgekontamination eigens |
| Maßnahmen & Handlungsempfehlungen | Geltende Schutzmaßnahmen (Warnung, Evakuierung, Verzehrwarnungen) mit Status; eingesetzte Fachunterstützung |
| Abhängigkeiten & Interdependenzen | Kopplungen zu Trinkwasser, Verkehr, benachbarten Anlagen und Gewässern |

Übertrag, Abschlusscheck und Querschnittsprüfungen nach Teil A.4, A.5 und A.9.

### 5. Ansprechstellen und Pflege

**Ansprechstellen:** Zuständige Gefahrenabwehr-, Umwelt- und Gesundheitsbehörden · Betreiber · TUIS (VCI) · UBA/ZEMA (Einordnung) · [BBK Gefahrstoff-Freisetzung](https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Schutz-suchen/Gefahrstoff-Freisetzung/gefahrstoff-freisetzung_node.html) (Hintergrund)

**Offene Punkte:** Abgrenzung industrieller Großbrände ohne Gefahrstoffbezug zu B17 an Übungsfällen prüfen.

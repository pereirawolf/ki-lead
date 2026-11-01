# Änderungsverlauf Profil „LEAD-Beispiel – Land Thüringen (fiktive Inhalte)“

Profil-ID `lead.beispiel.thueringen`, Inhalte unter CC BY 4.0. Die jüngsten Änderungen stehen zuerst.

**Versionierung:** wie beim Beispielprofil der Koordinierungsstelle (Semantic Versioning). **Abgeleitete Dateien:** Schema, Darstellungsdatei, Kontakte, Arbeitsanweisungen und Kodierleitfaden entstehen mit `npm run profil:land` aus dem Beispielprofil (`scripts/landesprofil.mjs`); ein Test prüft, dass sie aktuell sind. Ändert sich eine dieser Dateien im Beispielprofil, wird das Landesprofil neu abgeleitet und hier mit einer neuen Version vermerkt. **SOP-Sammelmappe:** geteilt mit dem Beispielprofil; Änderungen stehen in dessen `sop/CHANGELOG.md`.

## 1.0.1 – 01.11.2026

- **Darstellungsdatei** neu abgeleitet aus dem Beispielprofil 1.35.1 (`npm run profil:land`): Erklärtexte im Analysebereich mit Leitfrage, Gruppenhinweis auf die LEAD-Eingabehilfen, „Bewertung & Tendenz“, Kennung, Bezug und Lagenradar sprachlich angeglichen. Adressaten der Empfehlungen wie bisher mit Kreisen und kreisfreien Städten.
- Schema, Arbeitsanweisungen, Kodierleitfaden, Kontakte und Beispiellage sind unverändert.

## 1.0.0 – 31.10.2026

Grundlage: Befunddatei `ki-lead-befund_technik_2026-W44-A4.json` (Arbeitspaket A4 „Profil Landesebene“), freigegeben vom Herausgeber am 31.10.2026 mit den Entscheidungen: reales Land Thüringen mit fiktiven Inhalten, SOP-Sammelmappe geteilt, Beispiellage Hochwasser; Perspektive nach Entscheidung E1 (wöchentlich, mittel- bis langfristig wie SOP-LEAD A.1 Nr. 1; Meldetakt als Variable änderbar).

- **Profil:** Ebene Land, Referenzraum „Bevölkerungsschutz in Thüringen“, meldende Stelle „Lagezentrum des Landes (Beispiel)“ ohne Weisungsbefugnis gegenüber den Kreisen. Keine Vorgabe des Freistaats Thüringen oder einer seiner Behörden, ohne landesrechtliche Bezüge.
- **Schema `LEAD-Meldung-Land-v1`:** aus `LEAD-Meldung-v1` (LEAD-Meldevorlage 1.2) mit dem Feld `kreis` statt `land` (Land Thüringen, 17 Landkreise, 5 kreisfreie Städte); Eingang und Ausgabe. Kennungspräfixe `DE-TH` für das Land und `DE-TH-<Kfz-Kennzeichen>` für Kreise und kreisfreie Städte; Kontakte je Kreis für den Meldestatus.
- **Arbeitsanweisungen und Kodierleitfaden:** wie im Beispielprofil (Erfassung 1.9.0, Verdichtung, Kurzfassung 2.4.1, Kodierleitfaden 1.7.0) mit Kreisen statt Ländern in Beispielen und Regeln zur Rolle.
- **Beispiellage „Hochwasser an der Saale“ (FIKTIV):** drei Kreismeldungen (Landkreis Saalfeld-Rudolstadt, Saale-Holzland-Kreis, Stadt Jena) und die verdichtete Meldung des Landes mit Bezug und Zeitstrahl.

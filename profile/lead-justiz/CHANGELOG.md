# Änderungsverlauf Profil „Lagebild Justiz“

Profil-ID `lead.justiz.landeslagebild`. Inhalte unter CC BY 4.0, maschinenlesbare Dateien zusätzlich unter CC0 1.0, siehe `LICENSE-CONTENT`. Versionierung nach Semantic Versioning ([Profilformat](../../docs/PROFILFORMAT.md), Abschnitt „Versionierung und Änderungsverlauf eines Profils“).

## 0.1.0 – 31.10.2026

Erprobungsentwurf. Grundlage sind zwei Grundlagenberichte mit Grobkonzept und ihre Konsolidierung (außerhalb des Repositorys) sowie die Entscheidungen des Herausgebers vom 31.10.2026 (README, Abschnitt „Grundentscheidungen“). Fachlich nicht abgenommen.

### Neu

- Manifest `profil.json` (Ebene Land, Referenzraum Thüringen, Lizenz CC BY 4.0).
- Schema `Lagebild-Justiz-Meldung-v1`:
  - Meldungskopf mit Art der meldenden Stelle (Rolle `herkunft`), Meldeart und Berichtsmodus;
  - Funktionslage als Funktions- und Statusmatrix;
  - Meldeabdeckung;
  - Sachverhalte mit betroffenen Funktionen und primärer Funktion, Ressourcen, Zeitstempeln (Beginn, Feststellung, Notfallausruf), Betriebsphase, zeitlicher Reichweite, vier Analysefeldern, Belegwerten mit Wertart sowie getrennter Beurteilung, Dringlichkeit, Tendenz und Erkenntnissicherheit.
- Darstellungsdatei `meldung.ui.json`:
  - Rollen;
  - Pflichtkennsätze sowie die Kennsätze „Neubewertung bei:“ und „Erkenntnislücke:“;
  - Quellenkategorien A/B/K/W/V/M/P mit Rangfolge;
  - Kennungspräfixe aller Länder;
  - Zeitstrahltypen mit „Störung“;
  - Leitungskurzfassung.
- Kodierleitfaden Lagebild Justiz 0.1.0, Teil A – Gemeinsame Regeln 0.1.0 und die Arbeitsanweisungen Erfassung, Verdichtung und Kurzfassung, jeweils 0.1.0.
- `kontakte.json` mit acht erwarteten Stellen (Adressen `.invalid`).
- Drei FIKTIVE Beispielmeldungen in `beispiele/fiktiv-2026-10/`.

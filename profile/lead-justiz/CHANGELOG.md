# Änderungsverlauf Profil „Lagebild Justiz“

Profil-ID `lead.justiz.landeslagebild`. Inhalte unter CC BY 4.0, maschinenlesbare Dateien zusätzlich unter CC0 1.0, siehe `LICENSE-CONTENT`. Versionierung nach Semantic Versioning ([Profilformat](../../docs/PROFILFORMAT.md), Abschnitt „Versionierung und Änderungsverlauf eines Profils“).

## 0.3.1 – 11.11.2026

Grundlage: Entscheidung des Herausgebers vom 11.11.2026 zur Darstellung der Schrittleiste (Grunddesign 1.7, Regel LD-T05; App 0.7.17). Dritte Stelle: nur Beschriftung der Oberfläche, Feldnamen, Schema, Arbeitsanweisungen, Kodierleitfaden und SOPs unverändert.

- **Darstellungsdatei** (`meldung.ui.json`): Schrittnamen „Beeinträchtigungen und Sachverhalte“, „Quellen und Referenzen“ und „Prüfen und Exportieren“ (bisher mit „/“ bzw. „&“); Feldnamen unverändert.

## 0.3.0 – 05.11.2026

Grundlage: Entscheidung des Herausgebers vom 05.11.2026 nach dem Anbietervergleich vom 04.11.2026 (AV-2026-W45-01 bis -03) und seiner Folgereihe vom 05.11.2026 (drei interne Erfassungsläufe mit demselben Material, sechs Sachverhalte, ohne Recherche: Läufe 20261105-141838-pyor, -143746-5iuf, -150440-l8af). Material, Laufprotokolle und Inhalte der Läufe bleiben intern; hier stehen nur Kenndaten. Zweite Stelle, weil sich die Modellvorgabe des Profils ändert; Regeln, Schema, Darstellungsdatei und Inhalte bleiben unverändert.

- **Modellvorgabe:** `modelle.vorverarbeitung` jetzt `claude-sonnet-5-5` (bisher `claude-haiku-5-5`), wie Standard-Profil und Vorgabe der App seit App 0.7.13; Aufwand nach der Vorgabe der App „mittel“. Erfassung und Verdichtung unverändert. Einzelheiten im [App-Verlauf](../../CHANGELOG.md). Fachlich weiterhin nicht abgenommen.

## 0.2.0 – 02.11.2026

Grundlage: Befunddatei `ki-lead-befund_gesamtkonsistenz_2026-W44-b.json`, Befund GK-2026-W44-08 (Option A), freigegeben vom Herausgeber am 01.11.2026. Zweite Stelle: zwei Regeln in Teil A neu; fachlich weiterhin nicht abgenommen.

- **Teil A 0.2.0:** A.5 Nr. 4 je Frist eine eigene Zeile „Handlungsrelevant bis:“, die früheste zuerst; A.6 Nr. 1 stabile Quellennummern bei der Fortschreibung (Einträge der eigenen Vormeldung behalten ihre Nummer, neue Quellen erhalten die nächste freie); A.8 Nr. 1 Quellenverweise übernommener Zeitstrahlzeilen behalten ihre Bedeutung. Damit gelten die Prüfungen der App (Kennzeichnung von Zeilen mit mehreren Fristen, Warnung `ZEITSTRAHL_QUELLE`) und der Steuerungssatz von S2 auch nach dem Teil A dieses Profils.
- **Kodierleitfaden 0.1.1, Arbeitsanweisungen Erfassung, Verdichtung und Kurzfassung je 0.1.1:** nur die Abstimmungsvermerke im Kopf nennen Teil A 0.2.0; Inhalte unverändert.
- Schema, Darstellungsdatei und Beispiele sind unverändert.

## 0.1.2 – 01.11.2026

Grundlage: Befunddatei `ki-lead-befund_gesamtkonsistenz_2026-W44.json`, Befund GK-2026-W44-06, freigegeben vom Herausgeber am 01.11.2026. Dritte Stelle: nur redaktionell.

- **README, Kopfzeile (Fassung 0.1.1):** verweist für die Profilversion auf `profil.json`, statt den Paketstand doppelt zu führen; die veraltete Angabe „Profilversion 0.1.0“ entfällt.
- Schema, Darstellungsdatei, Arbeitsanweisungen, Kodierleitfaden, Teil A und Beispiele sind unverändert.

## 0.1.1 – 01.11.2026

Grundlage: Entscheidung des Herausgebers vom 01.11.2026, die Erklärtexte der Analysefelder wie im Beispielprofil zu fassen (Leitfrage, dann Arbeitshinweise). Nur sprachlich; fachlich weiterhin nicht abgenommen.

- **Darstellungsdatei, Analysebereich:** „Lage & Funktionsfolgen“, „Risiken & Folgen“, „Maßnahmen & Entscheidungsbedarf“ und „Abhängigkeiten & Ersatzlösungen“ beginnen mit einer Leitfrage. „Lage & Funktionsfolgen“ nennt das Kennzeichnen vorläufiger oder widersprüchlicher Angaben; bei den Ersatzlösungen heißt es „als entlastend werten“ statt „als positiv“, wie im Kodierleitfaden, mit Verweis auf Indikator I10.
- Schema, Arbeitsanweisungen, Kodierleitfaden und Beispiele sind unverändert.

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

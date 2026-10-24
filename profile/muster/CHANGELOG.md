# Änderungsverlauf Vorlage – eigene Organisation

Profil-ID `muster.einsatzstelle` (bis 0.4.0 „Musterprofil – Einsatzstelle (leer)“). Inhalte unter CC0 1.0 und CC BY 4.0 nach Wahl, siehe `LICENSE-CONTENT`, Nr. 2c; die Vorlage darf ohne Namensnennung übernommen werden. Versionierung wie im Beispielprofil beschrieben (Semantic Versioning, Prüfsumme je Stand). Bei Übernahme `herausgeber` und `lizenz` in `profil.json` selbst setzen.

## 0.5.0 – 24.10.2026

Anlass: Befunde KP-2026-W43-58 und -60 der Lizenzprüfung, vom Herausgeber am 24.10.2026 freigegeben.

- Umbau zur **Vorlage – eigene Organisation**: alle Bestandteile eines Profilpakets als Gerüst mit Platzhaltern in eckigen Klammern; Profil-ID, Schema und Schemakennung `Muster-LEAD-Meldung-v1` unverändert, gespeicherte Meldungen bleiben gültig.
- Manifest: `herausgeber` „[Herausgeber]“, `lizenz` „CC0-1.0“, `ebene`, `referenzraum` und Variablen als Platzhalter, neue Variablen `kurzname`, `meldetakt`, `lageprodukt`; SOP-Sammlung mit gemeinsamem Teil `teil-a`.
- Neu: `sop/A_Gemeinsame-Regeln.md` (Teil A mit Gültigkeitsstand, A.1–A.5), `sop/teil-b/B01_lageart.md` (Dach-SOP als Inhaltsgerüst mit YAML-Kopf und den fünf Abschnitten des Beispielprofils), `README.md` (Übernahme in vier Schritten, Hinweis auf die Standardfassungen für Verdichtung und Kurzfassung).
- Arbeitsanweisung Erfassung und Kodierleitfaden: Fassung 0.5, Gliederung wie im Beispielprofil mit Platzhaltern; Kodierleitfaden mit Stufentexten und Quellenkategorien aus der Darstellungsdatei.
- Darstellungsdatei: Titel „Lagemeldung (Vorlage)“, Untertitel angepasst; sonst unverändert.

## 0.4.0 – 23.10.2026

- Kodierleitfaden: Belegregel statt Vorsichtsregel bei zwei passenden Stufen, wie im Beispielprofil (KP-2026-W43-50).
- Kodierleitfaden und Arbeitsanweisung tragen eine Fassungszeile („Musterfassung · Fassung 0.4 vom 23.10.2026“); die Fassungsangabe ist für versionierte fachliche Regelwerke Pflicht (KP-2026-W43-51).

## 0.3.0 – 21.10.2026

- Modellvorgabe `modelle.erfassung` jetzt `claude-opus-5-5` wie im Beispielprofil 1.10.0 (Testreihe der KI-Modelle vom 20.10.2026, siehe App-Verlauf 0.4.21).

## 0.2.0 – 19.10.2026

- Darstellungsdatei: Quellenkategorie `B` (Betreiber, Angaben zum eigenen Betrieb) und Quellenpriorität `quellen.rangfolge` A > B > W > M > P; „P“ heißt jetzt „sonstige private Quellen“.

## 0.1.0 – 17.10.2026

- Erstfassung (07b9f29): schlankes Schema ohne Länderliste und Freigabeblock, Darstellungsdatei, Arbeitsanweisung und Kodierleitfaden als Mindestumfang eines Profilpakets.

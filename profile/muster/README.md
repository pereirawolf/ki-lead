# Vorlage – eigene Organisation

Fassung 0.5 vom 24.10.2026 · Lizenz CC0 1.0: ohne Namensnennung übernehmbar

Diese Vorlage zeigt alle Bestandteile eines Profilpakets als Gerüst. Platzhalter stehen in eckigen Klammern, etwa [Meldende Stelle]. Das Schema ist ein schlankes Beispiel einer Einsatzstelle ohne Länderliste und ohne Freigabeblock. Ein ausgearbeitetes Profil mit vollständiger SOP-Sammlung ist das Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“.

## Übernehmen

1. Ordner kopieren und in `profil.json` eine eigene `id` vergeben (z. B. `de.beispiel.kreis-x`), dazu `name`, `herausgeber`, `lizenz`, `ebene`, `referenzraum` und `variablen` setzen.
2. Schema (`meldung.schema.json`) und Darstellungsdatei (`meldung.ui.json`) an die eigene Meldung anpassen; die Stufentexte des Kodierleitfadens müssen wortgleich in der Darstellungsdatei stehen.
3. Arbeitsanweisung, Kodierleitfaden, Teil A und SOPs ausfüllen; für jede weitere Lageart eine Datei nach dem Muster von `sop/teil-b/B01_lageart.md` anlegen und in `sop.dateien` eintragen.
4. Jede Änderung in `CHANGELOG.md` festhalten und die Version erhöhen.

## Verdichtung und Kurzfassung

Die Vorlage enthält keine eigenen Arbeitsanweisungen für Verdichtung und Kurzfassung. Die App verwendet dann ihre Standardfassungen; die Profilansicht zeigt sie unter „Arbeitsanweisungen und Kodierleitfaden“. Eine eigene Fassung als Datei anlegen und unter `anweisungen.verdichtung` bzw. `anweisungen.kurzfassung` im Manifest eintragen; als Ausgangspunkt eignen sich die Fassungen im Beispielprofil.

## Lizenz

CC0 1.0 Universal (Datei `LICENSE-CC0` im Repository): Die Vorlage darf ohne Namensnennung übernommen und unter eigener Lizenz weitergegeben werden.

# Vorlage – eigene Organisation

Fassung 1.0 vom 14.11.2026 · Lizenz CC0 1.0: ohne Namensnennung übernehmbar

Diese Vorlage zeigt alle Bestandteile eines Profilpakets als Gerüst. Platzhalter stehen in eckigen Klammern, etwa [Meldende Stelle]. Das Schema folgt LEAD-Meldung-v2 ([docs/LEAD-MELDUNG-V2.md](../../docs/LEAD-MELDUNG-V2.md)): Kernschema mit einem eigenen, schlanken Fachmodul (Arten und Lageprofil mit drei Achsen) einer Einsatzstelle, ohne Liste der Gebiete und Ebenen; es entsteht aus der Zusammenstellung `zusammenstellung.json` (Abschnitt 9 der Beschreibung). Ein ausgearbeitetes Profil mit vollständiger SOP-Sammlung ist das Beispielprofil „LEAD-Beispiel – Koordinierungsstelle“.

## Übernehmen

1. Ordner kopieren und in `profil.json` eine eigene `id` vergeben (z. B. `de.beispiel.kreis-x`), dazu `name`, `herausgeber`, `lizenz`, `ebene`, `referenzraum` und `variablen` setzen.
2. Eigenes Fachmodul (`module/muster-lageprofil.schema.json`: Arten, Achsen, Stufen) und Zusammenstellung (`zusammenstellung.json`: Module, Einschränkungen wie Gebiete, Ebenen und Quellenkategorien) anpassen, das Schema mit `npm run meldung:v2 -- schema <ordner>/zusammenstellung.json <ordner>/meldung.schema.json` erzeugen und die Darstellungsdatei (`meldung.ui.json`) nachziehen; die Stufentexte des Kodierleitfadens müssen wortgleich in der Darstellungsdatei stehen. Das Schema wird nicht von Hand geändert.
3. Arbeitsanweisung, Kodierleitfaden, Teil A und SOPs ausfüllen; für jede weitere Lageart eine Datei nach dem Muster von `sop/teil-b/B01_lageart.md` anlegen und in `sop.dateien` eintragen.
4. Jede Änderung in `CHANGELOG.md` festhalten und die Version erhöhen.

## Kennsätze

In LEAD-Meldung-v2 sind die bisherigen Kennsätze Felder der Meldung (Fristen im Handlungsbedarf, Änderung zur Vormeldung, abweichende Bewertungen, Neubewertung, Abschluss). Die Darstellungsdatei nennt unter `kennsaetze` nur noch ihre Beschriftungen; sie sind optional (Profilformat 1.33), ohne Angabe verwendet die App die Texte des Beispielprofils.

## Zeitstrahl, Kennung und Bezug

Zeitstrahl, Sachverhaltskennung und Bezug gehören in LEAD-Meldung-v2 zum Kernschema: Der Zeitstrahl (`zeitstrahl`) steht je Sachverhalt, die Kennung vergibt die App (Rolle `sv_kennung`; ohne Länderliste mit dem Präfix aus `kennung.standard`, in der Vorlage „SV“, z. B. durch ein eigenes Kürzel ersetzen), der Bezug (Rolle `sv_bezug`) nennt Kennung, Fassung und Art. Regeln zu Form und Typen stehen im Kodierleitfaden des Beispielprofils, Abschnitt 8.

## Verdichtung und Kurzfassung

Die Vorlage enthält keine eigenen Arbeitsanweisungen für Verdichtung und Kurzfassung. Die App verwendet dann ihre Standardfassungen; die Profilansicht zeigt sie unter „Arbeitsanweisungen und Kodierleitfaden“. Eine eigene Fassung als Datei anlegen und unter `anweisungen.verdichtung` bzw. `anweisungen.kurzfassung` im Manifest eintragen; als Ausgangspunkt eignen sich die Fassungen im Beispielprofil.

## Lizenz

CC0 1.0 Universal (Datei `LICENSE-CC0` im Repository): Die Vorlage darf ohne Namensnennung übernommen und unter eigener Lizenz weitergegeben werden.

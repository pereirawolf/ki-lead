# Arbeitsanweisung Kurzfassung: Management Summary

Beispielfassung für KI-LEAD · gilt für die LEAD-Meldevorlage 1.0 (Schemakennung `LEAD-Meldung-v1`)

## Auftrag

Du formulierst aus der beigefügten Meldung eine Management Summary für die Leitung. So würde eine Redaktionskonferenz für das {{profil.lageprodukt}} sie für die Behördenleitung ausfertigen. Die Leitung liest sie in zwei Minuten und weiß danach: Was ist los, was kann daraus werden, wer sollte was tun, und was hängt daran.

## Grundlage

- Einzige Grundlage ist die beigefügte Meldung ({{profil.meldende_stelle}}, Referenzraum {{profil.referenzraum}}). Du recherchierst nicht und ergänzt keine Fakten, Zahlen oder Bewertungen.
- Kernaussage, Beurteilung und Tendenz übernimmst du sinngemäß aus der Meldung. Du bewertest nicht neu. Widersprechen sich Analysefelder und Bewertungstext, folgst du dem Bewertungstext.
- Was die Meldung als Prognose, Szenario, Einschätzung oder unbestätigt kennzeichnet, bleibt sprachlich als solches erkennbar („erwartet“, „möglich“, „nicht bestätigt“).

## Aufbau

Für jeden Sachverhalt der Meldung, in derselben Reihenfolge, genau vier Absätze:

1. **Lage & Ereignis:** Der erste Satz ist die Kernaussage. Danach folgt der bestätigte Sachstand mit Ort und Zeit und den ein oder zwei Zahlen, auf die es ankommt, jeweils mit Stand.
2. **Risiken & Auswirkungen:** Zuerst das Eingetretene, dann das, was in welchem Zeitfenster droht.
3. **Maßnahmen & Handlungsempfehlungen:** Wer sollte was bis wann tun oder prüfen? Das sind Empfehlungen an zuständige Stellen, keine Weisungen. Ein Kennsatz „Handlungsrelevant bis:“ erscheint als Frist, „Neubewertung bei:“ als Anlass für eine erneute Befassung.
4. **Abhängigkeiten & Interdependenzen:** Nur belegte Kopplungen und die eine Wirkungskette, die für die Leitung zählt. Gibt es keine belegte Kopplung, sagst du das in einem Satz.

## Sprache

- Je Absatz zwei bis fünf kurze, klare Hauptsätze, möglichst nicht mehr als 20 Wörter je Satz. Aktiv, konkret, ohne Verschachtelung.
- Keine Aufzählungszeichen, keine Zwischenüberschriften, keine Füllformeln („Es ist festzustellen, dass …“).
- Keine Quellenverweise wie [Q1], keine URLs, keine Feldnamen, keine Radarachsen oder Stufenwerte (D1–D8). Fachkürzel bei der ersten Nennung auflösen; geläufige Behördennamen sind erlaubt.
- Zahlen mit Einheit und Stand, Datumsangaben als TT.MM.JJJJ, Uhrzeiten mit „Uhr“.
- Sachlicher Ton: keine Dramatisierung und keine Entwarnung, die die Meldung nicht trägt.
- Enthält ein Analysefeld nichts Verwertbares, schreibst du: „Die Meldung enthält dazu keine Angaben.“

## Ausgabe

Antworte im vorgegebenen JSON-Format: je Sachverhalt der Titel und die vier Absätze. Kopfzeile, Beurteilung und Tendenz setzt die App selbst davor.

# Prüfsteine

Meldungen, die im wöchentlichen **Erfassungstest** zu realen Lagen entstehen, werden hier unverändert aufbewahrt – gerade auch die mangelhaften, unvollständigen oder widersprüchlichen. Zusammen bilden sie einen Korpus, an dem sich spätere Fassungen der LEAD-Systematik messen lassen: Löst eine Regeländerung eine frühere Stolperstelle, oder verschiebt sie sie nur?

**Prüfsteine sind keine Musterlösungen und keine amtlichen Meldungen.** Sie sind KI-Entwürfe zum Stand eines bestimmten Regelwerks. Was an ihnen falsch ist, steht in der Begleitnotiz.

## Aufbau

Je Lage ein Ordner `<JJJJ>-W<KW>_<kurzname>/` mit

- `meldung.json`: die Meldung im Schema `LEAD-Meldung-v1`, so wie sie im Lauf entstanden ist; sie wird nachträglich nicht korrigiert
- `pruefstein.json`: Begleitnotiz nach [`pruefstein.schema.json`](pruefstein.schema.json) (`ki-lead-pruefstein/1`) mit Regelwerksstand (Commit und Fassungen), Lage, t0, Referenzraum, Quellen mit Abrufzeit, Einstufung, bekannten Mängeln und Verweisen auf die Befund-IDs (ET-…)

## Kennzeichnung (Pflicht, per Test geprüft)

- `_status`: `Entwurf`; `_entstehung.verfahren`: `KI-Entwurf`
- `meldende_stelle` beginnt mit „KI-LEAD Erfassungstest – keine amtliche Meldung“
- Zeichnungen unter `freigabe` ohne Namen
- Begleitnotiz mit festem Hinweistext

## Inhalt und Rechte

- Nur öffentlich zugängliche, vorrangig amtliche Quellen; Inhalte in eigenen Worten, Auszüge höchstens 25 Wörter, keine Artikeltexte.
- Keine personenbezogenen Daten über Funktionsbezeichnungen und Behördennamen hinaus.
- Lizenz wie die übrigen Inhalte: CC BY 4.0, siehe `LICENSE-CONTENT`.

## Verwendung

- **Schemawandel:** Ein Test prüft jede Meldung gegen das aktuelle Meldungsschema des Beispielprofils. Passt eine ältere Meldung nicht mehr, wird nicht die Meldung angepasst, sondern in der Begleitnotiz `schemaabweichung` dokumentiert.
- **Regelwandel:** Bei Änderungen an Kodierleitfaden oder SOP können Prüfläufe die betroffenen Prüfsteine heranziehen und prüfen, ob die dokumentierten Mängel nach neuer Fassung noch entstünden.

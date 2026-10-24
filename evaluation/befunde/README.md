# Befundregister

Die automatisierten Prüfläufe (Prüfung wöchentlich, Erfassungstest) legen Änderungsbedarf als Befunddatei im Format `ki-lead-befund/1` vor. Die Befunddateien selbst liegen nicht im Repository. [`befundregister.json`](befundregister.json) hält fest, **wie über einen Befund entschieden wurde**, damit spätere Läufe Bekanntes nicht erneut vorlegen. Format: [`befundregister.schema.json`](befundregister.schema.json) (`ki-lead-befundregister/1`).

## Status

| Status | Bedeutung | Pflichtangaben |
|---|---|---|
| `umgesetzt` | mit Pull Request eingearbeitet (auch angepasst) | `pr` |
| `abgelehnt` | bewusst nicht übernommen | `grund` |
| `zurueckgestellt` | später erneut vorlegen | `grund`, `wieder_vorlegen_ab` |
| `ueberholt` | Fundstelle hat sich vor der Umsetzung geändert, Befund trifft nicht mehr zu | `grund` |

Offene, noch nicht entschiedene Befunde stehen nicht im Register.

## Eingang und offene Befunde

Jeder Prüflauf legt seine Befunddatei vor der Freigabefrage auf dem Branch `befunde/eingang` ab (Ordner `eingang/`, Erfassungstest zusätzlich `eingang/pruefsteine/`). Der Branch enthält nur Daten, wird nie gemergt und berührt `main` nicht. **Offen** ist ein Befund, der dort liegt, aber im Register nicht entschieden ist; dazu zählen Befunde aus Läufen ohne oder mit unvollständiger Freigabe, „Weitere Beobachtungen“ jenseits der Obergrenze eines Laufs, zurückgestellte Befunde ab `wieder_vorlegen_ab` und unbeantwortete Entscheidungsfragen. Der Freitagslauf führt sie zusammen, legt sie gesammelt zur Freigabe vor und setzt sie in einem Pull Request um.

## Regeln

1. **Fortschreibung:** Der Pull Request, der Befunde umsetzt, trägt im selben Zug alle Befunde derselben Befunddatei ein, auch abgelehnte und zurückgestellte. Werden Befunde nur abgelehnt, genügt ein Pull Request mit der Registeränderung.
2. **Prüfläufe** lesen das Register vor der Prüfung: `abgelehnt` und `ueberholt` werden nur mit neuer Erkenntnis und Verweis auf die alte ID erneut vorgelegt; `zurueckgestellt` erst ab `wieder_vorlegen_ab`.
3. **Begründungen** kurz und sachlich. Eine Ablehnung aus fachlicher Abwägung des Herausgebers ist ein Grund; sie wird nicht weiter begründet als nötig, damit ein späterer Lauf sie einordnen kann.
4. Keine Volltexte und keine Auszüge externer Quellen im Register; Fundstellen nur als Datei und Stelle.

# Orkantief „Ilka“ – FIKTIVER Datensatz

Alle Dateien in diesem Ordner beschreiben eine **erfundene Lage**. Das Orkantief „Ilka“ hat es nicht gegeben. Keine der Meldungen wurde von den darin genannten Stellen erstellt, abgegeben oder freigegeben. Behörden, Unternehmen und Orte sind nur genannt, damit der Datensatz realistisch durchgespielt werden kann.

Inhalt: sechs Ländermeldungen (HE, NI, NW, RP, ST, TH) und die daraus verdichtete Meldung einer Koordinierungsstelle auf Bundesebene, jeweils im Schema `LEAD-Meldung-v2` des Beispielprofils `profile/lead-beispiel` (bis Profilversion 1.44.0 `LEAD-Meldung-v1`). Jeder Sachverhalt beginnt mit „FIKTIV“, Quellen und Zeichnungen tragen den Vermerk „FIKTIV“.

Zweck: Demonstration und automatisierte Tests von KI-LEAD (Prüfung, Export, später Verdichtung).

**Kennungen, Bezug und Zeitstrahl** (ergänzt am 29.10.2026 mit Profilversion 1.33.0, LEAD-Meldevorlage 1.2): Jeder Sachverhalt trägt eine Kennung, etwa `DE-TH-20261014-K7QM`. Die verdichtete Meldung der Koordinierungsstelle (`DE-20261014-7QKD`) nennt im Bezug die sieben Sachverhalte der Länder und führt einen Zeitstrahl mit acht Zeilen; ihre Kenntniszeit ist der Meldezeitpunkt dieser Meldung (14.10.2026, 14:00). Die übrigen Inhalte sind unverändert.

**Entstehungsangaben:** `entstehung` (v1: `_entstehung`) gibt die Entstehung der Meldungen wieder und wird nicht nachträglich umgeschrieben. Die Angabe `"kodierleitfaden": "LEAD v2.0"` entspricht keiner Fassung des Kodierleitfadens; nach `werkzeug` wurden die Meldungen mit dem Kodierleitfaden 1.2 angeglichen. Gültig ist das Regelwerk im Gültigkeitsstand von SOP-LEAD Teil A.

**LEAD-Meldung-v2** (seit 14.11.2026, Profilversion 2.0.0, App 0.9.0): Die Meldungen sind mit `scripts/lead-meldung-v2.mjs` aus der v1-Fassung überführt und pflichtnah ergänzt: feste `meldung_id`, Zugang jeder Quelle, Meldungen anderer Stellen als Eingangsmeldung mit `meldung_id`, Gebiete mit amtlichem Schlüssel, Maßnahmen mit Status (nur wo der Text ihn nennt), Fristen und Empfehlungen mit Adressat, Bezug mit Art und `meldung_id`. Dateinamen und Sachverhaltskennungen sind unverändert; `entstehung.migration` nennt Werkzeug und offene Hinweise der Migration. Die v1-Fassung steht im Git-Verlauf und eingefroren unter `tests/fixtures/`.

Lizenz: CC BY 4.0, siehe `LICENSE-CONTENT`.

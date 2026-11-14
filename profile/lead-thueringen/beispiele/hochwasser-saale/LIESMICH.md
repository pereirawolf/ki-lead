# Hochwasser an der Saale – FIKTIVER Datensatz

Alle Dateien in diesem Ordner beschreiben eine **erfundene Lage**. Das Hochwasser an der Saale vom Oktober 2026 hat es nicht gegeben. Keine der Meldungen wurde von den darin genannten Stellen erstellt, abgegeben oder freigegeben. Behörden, Unternehmen, Orte und Pegel sind nur genannt, damit der Datensatz realistisch durchgespielt werden kann; die Zahlen sind erfunden.

Inhalt: drei Kreismeldungen (Landkreis Saalfeld-Rudolstadt, Saale-Holzland-Kreis, Stadt Jena) und die daraus verdichtete Meldung des Lagezentrums des Landes, jeweils im Schema `LEAD-Meldung-v2` des Profils `profile/lead-thueringen` (bis Profilversion 1.10.0 `LEAD-Meldung-Land-v1`). Jeder Sachverhalt beginnt mit „FIKTIV“, Quellen und Zeichnungen tragen den Vermerk „FIKTIV“. Die verdichtete Meldung nennt im Bezug die drei Sachverhalte der Kreise und führt einen Zeitstrahl. Für die Verdichtung angelegt: Die Sperrung der B 88 melden zwei Kreise für je ihren Abschnitt; die Landesmeldung zählt sie einmal.

Zweck: Demonstration und automatisierte Tests von KI-LEAD (Prüfung, Lagebild, Verdichtung). Der Kontrollsatz der Erprobung verwendet eine andere Ereignisart.

**LEAD-Meldung-v2** (seit 14.11.2026, Profilversion 2.0.0, App 0.9.0): Die Meldungen sind mit `scripts/lead-meldung-v2.mjs` aus der v1-Fassung überführt und pflichtnah ergänzt: feste `meldung_id`, Zugang jeder Quelle, Meldungen anderer Stellen als Eingangsmeldung mit `meldung_id`, Gebiete mit amtlichem Schlüssel, Maßnahmen mit Status (nur wo der Text ihn nennt), Fristen und Empfehlungen mit Adressat, Bezug mit Art und `meldung_id`. Dateinamen und Sachverhaltskennungen sind unverändert; `entstehung.migration` nennt Werkzeug und offene Hinweise der Migration. Die v1-Fassung steht im Git-Verlauf und eingefroren unter `tests/fixtures/`. Die Kreismeldungen tragen Ebene „Kreis“ und den amtlichen Kreisschlüssel.

Lizenz: CC BY 4.0, siehe `LICENSE-CONTENT`.

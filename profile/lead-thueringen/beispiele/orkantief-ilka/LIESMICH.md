# Orkantief „Ilka“ mit Kräftelage der Feuerwehren – FIKTIVER Datensatz

Alle Dateien in diesem Ordner beschreiben eine **erfundene Lage**. Das Orkantief „Ilka“ vom Oktober 2026 hat es nicht gegeben. Keine der Meldungen wurde von den darin genannten Stellen erstellt, abgegeben oder freigegeben. Behörden, Unternehmen, Orte, Strecken und Einrichtungen sind nur genannt, damit der Datensatz realistisch durchgespielt werden kann; die Zahlen sind erfunden.

Inhalt: drei Kreismeldungen mit Meldezeitpunkt 14.10.2026, 10:00 Uhr (Ilm-Kreis, Landkreis Hildburghausen, Landkreis Sonneberg) und die daraus verdichtete Meldung des Lagezentrums des Landes um 10:30 Uhr, jeweils im Schema `LEAD-Meldung-Land-v1` des Profils `profile/lead-thueringen`. Jeder Sachverhalt beginnt mit „FIKTIV“, Quellen und Zeichnungen tragen den Vermerk „FIKTIV“. Die verdichtete Meldung nennt im Bezug die vier Sachverhalte der Kreise und führt einen Zeitstrahl.

Kräftelage der Feuerwehren: Die Kreismeldungen und die Landesmeldung geben Zahlen aus fiktiven Kennzahlen-Bausteinen des Demonstrators [Thessa](https://github.com/pereirawolf/thessa) wieder (Quelle „Kräftelage der Feuerwehren aus … Einsatzmitteln, Thessa“). Die Werte stehen unverändert mit Einheit und Datenstand im Text. Kennzahlen verschiedener Einheiten (Einsatzmittel, Einsätze) und verschiedener Datenstände (Kreise 10:00 Uhr, Land 10:30 Uhr) sind nicht zusammengezählt. Der Baustein des Landes ist ein Ausschnitt aus fünf Kreisen; die Landesmeldung kennzeichnet ihn so und nennt keine landesweite Zahl. Die Bausteine liegen unverändert im Begleitordner [`../orkantief-ilka-thessa/`](../orkantief-ilka-thessa/LIESMICH.md).

Bezug zur Thüringer Meldung im Beispielprofil der Koordinierungsstelle (`profile/lead-beispiel/beispiele/orkantief-ilka`, 10:30 Uhr, Länderperspektive):

- Die Landesmeldung führt dieselben Sachverhaltskennungen (`DE-TH-20261014-K7QM` Sturm, `DE-TH-20261014-P5VN` Stromausfall) und dieselben Kernaussagen und Zahlen (rund 9.800 Personen ohne Strom, zwei Pflegeheime mit zusammen 146 Bewohnerinnen und Bewohnern, Notruf aus vier Gemeinden eingeschränkt, Wiederversorgung 16.10.). Auf diese Kennungen verweisen auch die Einsatzmeldungen in Thessa (`bezug_lead`).
- Grundlage für den Landkreis Sonneberg ist hier dessen Lagemeldung Nr. 5 um 10:00 Uhr nach LEAD-Meldevorlage. Sie schreibt die Tatsachen der Lagemeldung Nr. 4 des Krisenstabs fort (Datenstand 08:00 Uhr), die die Thüringer Meldung im Beispielprofil zitiert, und ergänzt die Kräftelage.
- Die beiden THW-Ortsverbände aus Oberfranken stammen in diesem Datensatz aus den an Sonneberg angrenzenden Landkreisen Coburg und Kronach. Nach Kodierleitfaden 1.8.1 (D4, Herkunftsort; Hilfe aus angrenzenden Kreisen ist überörtlich, auch über eine Landesgrenze) ergibt das D4 = 2. Die Meldung im Beispielprofil folgt dem Kodierleitfaden 1.2 und kodiert D4 = 4.
- Der Landkreis Sonneberg bewertet den Stromausfall „kritisch“, das Lagezentrum „erheblich“; die Landesmeldung vermerkt das als abweichende Bewertung.
- Die Landesmeldung nennt landesweit rund 1.400 Einsätze nach der Lageübersicht des Lagezentrums; Thessa bildet davon nur einen Ausschnitt mit wenigen Feuerwehren je Kreis ab.

Zweck: Demonstration und automatisierte Tests von KI-LEAD (Prüfung, Lagebild, Verdichtung) und der Übergabe von Kennzahlen aus Thessa. Der Kontrollsatz der Erprobung verwendet eine andere Ereignisart.

Lizenz: CC BY 4.0, siehe `LICENSE-CONTENT`.

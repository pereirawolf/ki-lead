# Arbeitsanweisung Verdichtung (Modus B): Lagebild Justiz

Erprobungsentwurf · Fassung 0.1.1 vom 02.11.2026 · gilt für das Schema `Lagebild-Justiz-Meldung-v1` · abgestimmt auf Teil A, Fassung 0.2.0, den Kodierleitfaden und die Arbeitsanweisung Erfassung Lagebild Justiz, jeweils Fassung 0.1.1

## Auftrag

Das Material enthält Meldungen anderer Stellen (Eingangsmeldungen) der Gerichte, Staatsanwaltschaften, des Vollzugs, der Sozialen Dienste, der IT-Stelle oder freiwillig meldender Stellen. Du verdichtest sie zu einer eigenen Meldung von {{profil.meldende_stelle}} für den Referenzraum „{{profil.referenzraum}}“. Die Verdichtung ist eine eigene Lagebewertung auf Landesebene, keine Aneinanderreihung der Eingänge. Es gelten die Arbeitsanweisung Erfassung, Teil A und der Kodierleitfaden; widerspricht diese Anweisung dem Kodierleitfaden, gilt der Kodierleitfaden.

## Regeln

1. **Gliederung nach Ursache.** Eingänge mit derselben Ursache bilden einen Sachverhalt. Die betroffenen Bezirke und Institutionen erscheinen darin als Teilräume (Teil A, A.7.1), in `ort`, `institutionen` und in der Funktionslage. Unterschiedliche Ursachen bleiben getrennt, auch wenn sie dieselbe Funktion treffen. Die Richtzahl der App von „einer bis drei“ Sachverhalten gilt nur für gleiche Ursachen (Teil A, A.7 Nr. 2); jede Trennung begründest du.
2. **Bezug.** Jeder verdichtete Sachverhalt nennt in `bezug` die Kennungen der Eingangssachverhalte, die in ihn eingehen. Jeder Eingangssachverhalt geht in mindestens einen Sachverhalt ein; eine Fehlanzeige geht nur in die Funktionslage ein.
3. **Landesmatrix nach Worst Case.** Die Funktionslage der Landesmeldung führt je Funktion und Bereich den schwersten belegten Status mit Stand und Quelle. Für die Landesebene nennst du zusätzlich je Funktion die Zahl der betroffenen Bereiche. Mittelwert und Gesamtscore sind ausgeschlossen. Ein einzelner kritischer Bereich macht nicht das Land kritisch; er bleibt aber sichtbar.
4. **Meldeabdeckung.** Fülle `meldeabdeckung` (erwartet, eingegangen, fehlend). Für fehlende Stellen setzt du in der Funktionslage „nicht gemeldet“. Einen Wert aus einer älteren Meldung schreibst du nicht als aktuell fort.
5. **Keine Doppelzählung.** Betreiber- und Institutionsmeldungen zur selben Störung sind verschiedene Sichten auf ein Ereignis, nicht zwei Ereignisse. Meldungsreihen derselben Stelle zählen einmal; die jüngere Fassung ersetzt die ältere nur für denselben Gegenstand.
6. **Bewertung neu auf Landesebene.** Beurteilung, Dringlichkeit, Tendenz und Erkenntnissicherheit bewertest du für den Referenzraum neu, aus den belegten Zuständen der Eingänge. Du übernimmst die Bewertungen der Eingänge nicht ungeprüft und mittelst sie nicht. Weichen Bewertungen ab, stehen sie mit Kennsatz „{{kennsatz.abweichung}}“ nebeneinander.
7. **Datenalter.** Nenne den Stand jeder übernommenen Angabe. Ist ein Eingang älter als ein Berichtsintervall, bewertest du ihn neu (Teil A, A.8 Nr. 2); das Datenalter allein verschärft nicht und bestätigt nicht.
8. **Abhängigkeiten.** Gemeinsame Ursachen außerhalb des Ressorts benennst du ausdrücklich, etwa Rechenzentrum, Netz, E-Akte-Verbund, beA/beN, Maßregelvollzug oder Ausbildungseinrichtungen anderer Länder.
9. **Entscheidungsbedarf.** Was die Ressortleitung oder die zuständigen Leitungen bis wann entscheiden müssen, steht unter „Maßnahmen & Entscheidungsbedarf“. Es hat einen Adressaten, keine Spruchkörper und keine Einzelsachen.

## Kurzantwort der Verdichtung

Nenne in der Kurzantwort: die Meldeabdeckung („n von m Stellen“), die Zuordnung der Eingänge zu Sachverhalten, begründete Trennungen, abweichende Bewertungen, ungelöste Widersprüche und Erkenntnislücken.

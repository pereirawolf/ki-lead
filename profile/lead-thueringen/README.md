# LEAD-Beispiel – Land Thüringen (fiktive Inhalte)

Beispielprofil auf Landesebene: Ein Lagezentrum des Landes führt die Lagemeldungen der 17 Landkreise und 5 kreisfreien Städte zu einem landesweiten Lagebild zusammen. Gebietsnamen sind real, alle Inhalte erfunden. Das Profil ist keine Vorgabe des Freistaats Thüringen oder einer seiner Behörden und bezieht kein Landesrecht ein.

- **Arbeitsweise:** wie im Beispielprofil der Koordinierungsstelle (`profile/lead-beispiel`): LEAD-Meldevorlage 1.2, Lagenradar, wöchentliche, mittel- bis langfristige Perspektive (SOP-LEAD A.1 Nr. 1); der Meldetakt ist unter `variablen.meldetakt` änderbar.
- **Meldung:** Schema `LEAD-Meldung-Land-v1`; das Feld `kreis` nennt die meldende Gebietskörperschaft, bei der eigenen Meldung das Land.
- **Abgeleitet:** Schema, Darstellungsdatei, Kontakte, Arbeitsanweisungen und Kodierleitfaden erzeugt `npm run profil:land` aus dem Beispielprofil; nicht von Hand ändern.
- **SOP-Sammelmappe:** liegt nicht in diesem Ordner. Die App ergänzt sie beim Laden aus `profile/lead-beispiel/sop/` (`src/profil/geteilt.ts`); ein Export des Profils aus der App enthält sie vollständig.
- **Beispiel:** `beispiele/hochwasser-saale` (FIKTIV), im Lagebild ladbar.

Lizenz: CC BY 4.0 (`LICENSE-CONTENT`); Schema, Manifest und Kontakte zusätzlich CC0 1.0.

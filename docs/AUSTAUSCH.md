# KI-LEAD – Austauschvertrag für LEAD-Meldungen (Entwurf)

Fassung 0.2 vom 01.11.2026, **Entwurf, nicht abgestimmt** · gilt für App-Version 0.6.19 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

LEAD folgt einem rekursiven Prinzip: Die Meldungen nachgeordneter und lateraler Stellen ergeben die eigene Meldung, die wiederum andere Stellen nutzen ([SPEZIFIKATION.md](SPEZIFIKATION.md), Abschnitt 3). Dafür muss eine Meldung mehr tragen als ihren Inhalt. Dieser Entwurf beschreibt, was eine Meldung mitbringen soll, damit eine andere Stelle oder ein anderes System sie verlässlich übernehmen kann. Er beschreibt zuerst, wie KI-LEAD heute arbeitet, und macht dann Vorschläge. Abgestimmt wird er erst in der Erprobung mit anderen Stellen (Teil C des Arbeitskonzepts). Bis dahin ändern seine Vorschläge keine Schemata.

**Seit Fassung 0.2:** Die Vorschläge dieses Entwurfs sind in den Entwurf des Meldungsformats `LEAD-Meldung-v2` eingegangen ([LEAD-MELDUNG-V2.md](LEAD-MELDUNG-V2.md), Abwägung in Abschnitt 12): Meldungskennung und Beziehungen (Abschnitt 1), Profil und Version in der Entstehung (2), Gebietsschlüssel (3), Zeitzone und UTC-Versatz (4), Ursprungsquellen (5), vierstufiger Status ohne Versand (6), Wertzustände und Fehlanzeige (7), Fachmodule statt offener Zusatzfelder (2, 8). Für die Abstimmung in Teil C ist v2 die Vorlage; die Beschreibung des heutigen Stands unten gilt für v1.

**Beteiligte Meldungsarten (Stand 0.6.19):** `LEAD-Meldung-v1` (Beispielprofil der Koordinierungsstelle, Bundesebene), `LEAD-Meldung-Land-v1` (Landesprofil Thüringen mit fiktiven Inhalten, Kreise und Land), `Lagebild-Justiz-Meldung-v1` (Profil „Lagebild Justiz“, Erprobungsentwurf) und die Betreibermeldungen des Schwesterprojekts KRITIS-LEAD.

**Grundsätze:**

1. Eine übernommene Meldung bleibt der abgebenden Stelle zugeordnet. Die empfangende Stelle deutet sie nicht still um; abweichende Bewertungen stehen nebeneinander (SOP-LEAD A.7.2).
2. Die empfangende Stelle übernimmt nur, was sie prüfen kann. Was sie nicht prüfen kann, kennzeichnet sie als ungeprüft.
3. Ein fehlender Wert ist etwas anderes als ein belegter Nullwert (Abschnitt 7).

---

## 1. Kennungen

**Heute.** Jede Meldung nennt ihre Schemakennung im Feld der Rolle `schema_feld` (`schema`); das Schema legt sie als Konstante fest, die Hauptversion steht im Namen (`-v1`). Sachverhalte tragen eine Kennung der Form `Präfix-JJJJMMTT-XXXX` und im Feld `bezug` die Kennungen, aus denen sie hervorgehen (Kodierleitfaden, Abschnitt 8; `src/kern/kennung.ts`). Eine Kennung der Meldung selbst gibt es nicht. Das Lagebild erkennt doppelte Dateien nur lokal über eine Inhaltskennung (`src/lagebild/lagebild.ts`, `inhaltsKennung`). Bei KI-Entwürfen steht die Laufkennung als Text in `_entstehung.werkzeug`.

**Vorschlag.** Eine optionale Meldungskennung `meldung_id` und für Fortschreibungen `bezug_meldung_id`, wie im Datenmodell von KRITIS-LEAD. Form wie die Sachverhaltskennung, damit dieselben Präfixe gelten. Die Sachverhaltskennung bleibt die Einheit des Austauschs; die Meldungskennung macht Fortschreibungen und Rückfragen eindeutig.

**Offen für Teil C:** Pflicht oder optional; wer die Kennung vergibt, wenn eine Meldung außerhalb von KI-LEAD entsteht.

## 2. Versionen

**Heute.** Die Schemakennung trägt die Hauptversion. Neue optionale Felder bleiben abwärtskompatibel (LEAD-Meldevorlage 1.1 und 1.2 ohne Migration). Profil-ID, Profilversion und App-Version stehen bei KI-Entwürfen als Text in `_entstehung.werkzeug` („KI-LEAD 0.6.19 · Profil … · Lauf …“); bei manuell erfassten Meldungen fehlen sie. Ältere Schemakennungen überführt ein Profil mit `migrationen`.

**Vorschlag.** Gleiche Hauptversion bedeutet: Die empfangende Stelle kann die Meldung ohne Umbau lesen. Eine neue Hauptversion braucht eine Migration im empfangenden Profil. Profil und Version, nach denen eine Meldung entstanden ist, stehen künftig strukturiert in `_entstehung` (etwa `profil`, `profil_version`), nicht nur im Text.

**Offen für Teil C:** Umgang mit zusätzlichen Feldern. Die Beispielschemata schließen unbekannte Felder aus (`additionalProperties: false`); für den Austausch wäre eine tolerantere Regel denkbar.

## 3. Bezugsraum

**Heute.** Das Gebiet der meldenden Stelle steht im Feld der Rolle `land` (Bundesprofil `land`, Landesprofil `kreis`), daneben `meldende_stelle`. Den Bezugsraum einer Bewertung nennt die Zeile „Referenzraum:“ im Bewertungstext; maschinenlesbar ist er nicht. Seit 0.6.19 kann ein empfangendes Profil für ein fremdes Schema angeben, in welchem Feld das Gebiet steht (`meldung.eingang_schemata`, `gebiet`; [PROFILFORMAT.md](PROFILFORMAT.md)).

**Vorschlag.** Neben dem Namen optional eine Gebietskennung nach festem Schlüssel: ISO 3166-2 für Länder (wie die Kennungspräfixe `DE-TH`) und der amtliche Kreisschlüssel für Kreise. Der Bezugsraum der Bewertung bleibt Text, weil er sich nicht mit Gebietsgrenzen deckt.

**Offen für Teil C:** Gebietsschlüssel für Stellen ohne Gebiet (Betreiber, Bundesbehörden, Justiz).

## 4. Zeitstände

**Heute.** `meldezeitpunkt` ist Wanduhrzeit ohne Zeitzone; die Zone steht nur im Profil (`variablen.zeitzone`). `meldezeitraum` grenzt den Berichtszeitraum ein. Datenstände stehen je Quelle im Quellenverzeichnis („Datenstand: …“), Kenntniszeiten je Zeile im Zeitstrahl. Bei der Verdichtung gilt der jüngste Eingang als t0; einen deutlich späteren oder früheren Vorschlag setzt die App zurück (`src/pipeline/s1.ts`, 24 Stunden Spielraum).

**Vorschlag.** Die Zeitzone (IANA, etwa `Europe/Berlin`) steht in der Meldung, wie bei KRITIS-LEAD. Fehlt sie, nimmt die empfangende Stelle ihre eigene Profilzone an und vermerkt das. Der Datenstand bleibt je Quelle Pflicht; er ist für den Vergleich von Eingängen wichtiger als der Meldezeitpunkt.

**Offen für Teil C:** Eingänge aus verschiedenen Zeitzonen (Ausland, Betreiber mit UTC-Systemen).

## 5. Quellen

**Heute.** Jede Meldung führt ein Quellenverzeichnis `[Qn] Kategorie – Herausgeber (Datum): Titel …` mit Datenstand. Eine verarbeitete Eingangsmeldung ist eine eigene Quelle mit Vermerk „Eingangsmeldung“ bzw. „behördenintern“ (Arbeitsanweisung Verdichtung, Regel 12). Die Kategorien unterscheiden sich je Profil: A/B/W/M/P im Bundes- und Landesprofil, A/B/K/W/V/M/P im Profil Justiz.

**Vorschlag.** Quellenverweise einer Eingangsmeldung werden nicht ungeprüft übernommen; die empfangende Stelle zitiert die Eingangsmeldung und, wo sie eine Angabe selbst geprüft hat, die Originalquelle. Für unterschiedliche Kategoriesysteme legt der Vertrag eine Abbildung fest (etwa K und V auf P, solange das empfangende Profil sie nicht kennt).

**Offen für Teil C:** gemeinsamer Kern der Kategorien; Umgang mit behördeninternen Quellen, die die empfangende Stelle nicht einsehen kann.

## 6. Freigabestatus

**Heute.** `_status` unterscheidet „Entwurf“ und „final“; nur „final“ verlangt die Pflichtangaben des Schemas. Der Freigabeblock nennt Erfassung, Freigabe und Versand. KI-Entwürfe tragen `_entstehung.verfahren` „KI-Entwurf“; das Lagebild zeigt Entwürfe und KI-Entwürfe mit Marke.

**Vorschlag.** Übermittelt werden nur finale Meldungen; ein Entwurf geht nur mit deutlicher Kennzeichnung und Zweck („zur Abstimmung“) an andere Stellen. Die KI-Kennzeichnung bleibt bei jeder Weiterverarbeitung erhalten, auch wenn die empfangende Stelle von Hand verdichtet ([KI-VERORDNUNG.md](KI-VERORDNUNG.md)).

**Offen für Teil C:** Nachweis der Freigabe außerhalb von KI-LEAD (Zeichnung, Signatur).

## 7. Unbekannte Werte

**Heute.** Ein leerer Text bedeutet „nicht erfasst“ oder „unbekannt“; im Lagenradar bedeutet `null` „offen“ (keine tragfähige Grundlage), `0` einen belegten Kleinwert oder eine belegte Fehlanzeige (Nullregel, Kodierleitfaden Abschnitte 3 und 6). Werte außerhalb der eigenen Aufzählung (Ereignisarten, Gebiete) weist die Schemaprüfung zurück.

**Vorschlag.** Drei Fälle werden im Austausch unterschieden: unbekannt (leer bzw. `null`), nicht zutreffend (ausdrücklich, etwa „entfällt“) und belegt null (Fehlanzeige mit Beleg). Werte einer fremden Aufzählung bleiben stehen und werden als „nicht abgebildet“ gekennzeichnet, statt sie auf den nächsten eigenen Wert zu ziehen.

**Offen für Teil C:** Abbildung der Ereignisarten zwischen Profilen (das Profil Justiz arbeitet mit einem Funktionskatalog statt der Ereignisarten).

## 8. Fremde Schemata

**Heute.** Ein Profil kennt vier Wege:

| Weg | Wirkung | Fundstelle |
|---|---|---|
| eigene Schemakennung | voll verwendet und geprüft | `meldung.schema_id` |
| `eingang_schema_ids` | wie eigene Meldungen behandelt | `src/kern/migration.ts` |
| `migrationen` | überführt, dann wie eigene Meldungen | `src/kern/migration.ts` |
| sonst | fremde Meldung, nur für die KI-Verdichtung, an der Grundform erkannt (Sachverhalte und Stelle) | `src/kern/eingang.ts` |

Seit 0.6.19 (TP-2026-W44-59) prüft das Lagebild fremde Meldungen gegen ein Schema, das das empfangende Profil unter `meldung.eingang_schemata` mitbringt, und zeigt die Befunde („fremdes Schema ✓“ oder „fremdes Schema: n“). Ohne Eintrag bleibt eine fremde Meldung ungeprüft („fremdes Schema“). Beispiel: Das Beispielprofil der Koordinierungsstelle prüft Meldungen nach `LEAD-Meldung-Land-v1` und liest ihr Gebiet aus `kreis` (TP-2026-W44-60); damit ist der Weg Kreis → Land → Bund mit den mitgelieferten Profilen durchgängig.

**Vorschlag.** Jede Stelle, die Meldungen abgibt, veröffentlicht ihr Schema mit Kennung und Version. Empfangende Profile nehmen es unter `eingang_schemata` auf. Nächste Kandidaten sind das Schema von KRITIS-LEAD (Landesprofil) und das Schema des Profils Justiz (Landesprofil, gegebenenfalls Bundesprofil).

**Offen für Teil C:** Ort und Pflege der veröffentlichten Schemata; ob eine geprüfte fremde Meldung mehr kann als die KI-Verdichtung (etwa Kennzahlen im Lagebild).

## Anhang: Mindestinhalt einer austauschfähigen Meldung (Entwurf)

| Angabe | heute | Vorschlag |
|---|---|---|
| Schemakennung mit Hauptversion | Pflicht | Pflicht |
| meldende Stelle | Pflicht bei „final“ | Pflicht |
| Gebiet (Name) | Pflicht bei „final“ | Pflicht, dazu optional Gebietsschlüssel |
| Meldezeitpunkt | Pflicht bei „final“ | Pflicht, mit Zeitzone |
| Status (Entwurf/final) | Pflicht | Pflicht; übermittelt wird „final“ |
| Sachverhalte mit Kennung | Kennung optional | Kennung Pflicht |
| Bezug zu Vorgänger-Sachverhalten | optional | Pflicht bei Verdichtung und Teilung |
| Quellenverzeichnis mit Datenstand | Pflicht (Feld), Datenstand empfohlen | Datenstand Pflicht |
| Entstehung (manuell/KI-Entwurf) | optional | Pflicht |
| Meldungskennung, Bezug zur Vormeldung | — | optional |

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 0.1 | 31.10.2026 | Erster Entwurf (App 0.6.19, TP-2026-W44-58); Abstimmung in Teil C |
| 0.2 | 01.11.2026 | Verweis auf den Entwurf des Meldungsformats `LEAD-Meldung-v2`, der die Vorschläge aufnimmt; Inhalt sonst unverändert |

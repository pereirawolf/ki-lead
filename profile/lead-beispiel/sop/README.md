# SOP-LEAD – Standardvorgehensweisen (Beispielfassung)

Beispielfassung für KI-LEAD · Fassung 3.14.0 vom 22.10.2026 · Änderungen im Änderungsverlauf [`CHANGELOG.md`](CHANGELOG.md)

Die Mappe enthält gemeinsame Regeln (Teil A), je Ereignisart des Katalogs eine Dach-SOP nach dem LEAD-Schema (Teil B) sowie Themen- und Querschnittsbausteine, die unter den bestehenden Ereignisarten verwendet werden (Teil C). Gemeinsame Regeln stehen einmal in Teil A und gelten für jede SOP und jeden Baustein; Teil B und Teil C nennen nur ihre lageartspezifischen Abweichungen, Prüffragen und Stolperstellen. Die Rolle „Koordinierungsstelle“ steht beispielhaft für eine Stelle, die Meldungen mehrerer Stellen zu einem übergreifenden Lagebild zusammenführt.

**Quelle und Lesefassung.** Gepflegt werden ausschließlich die Einzeldateien. Die Lesefassung [`SOP-LEAD_Sammelmappe_Lesefassung.md`](SOP-LEAD_Sammelmappe_Lesefassung.md) wird daraus erzeugt (`npm run sop:lesefassung`) und nicht von Hand bearbeitet; ein Test prüft, dass sie zum Stand der Einzeldateien passt. Das Quellenregister [`quellenregister.json`](quellenregister.json) weist jede URL aus Teil A, B und C mit Prüfergebnis und offener Nachprüfung nach (Teil A, A.6). Als SOP liest die App nur die in `profil.json` unter `sop.dateien` genannten Dateien, nicht diese Übersicht, das Quellenregister, die Lesefassung oder das Archiv. Diese Übersicht zeigt sie in der Profilansicht als Lesedokument; Lesefassung und Archiv sind nicht in die App eingebettet.

Der **Gültigkeitsstand** (welche Fassungen von SOPs, Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen und Schema zusammengehören) steht am Anfang von Teil A, damit er jeder KI-Anfrage beiliegt. Gliederung, Zitierweise und feste Kennungen regelt Teil A, A.10.1.

## Aufbau

Jede Datei beginnt mit ihrem Anker; jede SOP und jeder Baustein hat dieselben fünf Abschnitte: 1. Anwendungsbereich und Befassungsanlässe · 2. Erfassung: Prüffragen · 3. Auswertung: Prüfpunkte · 4. Darstellung · 5. Ansprechstellen und Pflege. Zitierweise: „C17, Abschnitt 3“, Prüffrage „C17/R2“.

**Feste Kennungen:** Kennungen werden nicht neu vergeben. Neue SOPs und Bausteine erhalten die nächste freie Nummer (B18, C18) und werden über ihre Lesegruppe einsortiert; stillgelegte Kennungen werden nicht wieder belegt.

### Teil A – Gemeinsame Regeln

| Kennung | Inhalt | Datei |
|---|---|---|
| A.1–A.10 | Anwendung, Kodierregeln, Befundnachweis, Übertrag, Abschlusscheck, Quellenstatus, Redaktion des Lagebilds, Fortschreibung, Querschnittsprüfungen, Pflege | [`A_Gemeinsame-Regeln.md`](A_Gemeinsame-Regeln.md) |

### Teil B – Dach-SOPs je Ereignisart

| Kennung | Ereignisart | Datei | Fassung | bisher |
|---|---|---|---|---|
| B01 | Unwetter / Sturm | [`teil-b/B01_unwetter-sturm.md`](teil-b/B01_unwetter-sturm.md) | 2.1.0 | 01 |
| B02 | Hochwasser / Überschwemmung | [`teil-b/B02_hochwasser-ueberschwemmung.md`](teil-b/B02_hochwasser-ueberschwemmung.md) | 2.1.1 | 02 |
| B03 | Waldbrand | [`teil-b/B03_waldbrand.md`](teil-b/B03_waldbrand.md) | 2.1.1 | 03 |
| B04 | Erdbeben | [`teil-b/B04_erdbeben.md`](teil-b/B04_erdbeben.md) | 2.1.1 | 04 |
| B05 | Extremhitze / Dürre | [`teil-b/B05_extremhitze-duerre.md`](teil-b/B05_extremhitze-duerre.md) | 2.1.1 | 05 |
| B06 | Wintersturm / Schnee / Eis | [`teil-b/B06_wintersturm-schnee-eis.md`](teil-b/B06_wintersturm-schnee-eis.md) | 2.1.1 | 06 |
| B07 | Industrieunfall / Chemieunfall | [`teil-b/B07_industrieunfall-chemieunfall.md`](teil-b/B07_industrieunfall-chemieunfall.md) | 2.2.1 | 07 |
| B08 | Stromausfall / Blackout | [`teil-b/B08_stromausfall-blackout.md`](teil-b/B08_stromausfall-blackout.md) | 2.1.1 | 08 |
| B09 | Gasversorgungsengpass | [`teil-b/B09_gasversorgungsengpass.md`](teil-b/B09_gasversorgungsengpass.md) | 2.2.0 | 09 |
| B10 | Trinkwasserversorgung | [`teil-b/B10_trinkwasserversorgung.md`](teil-b/B10_trinkwasserversorgung.md) | 2.1.0 | 10 |
| B11 | Gesundheitliche Lage / Epidemie | [`teil-b/B11_gesundheitliche-lage-epidemie.md`](teil-b/B11_gesundheitliche-lage-epidemie.md) | 2.3.0 | 11 |
| B12 | KRITIS-Ausfall | [`teil-b/B12_kritis-ausfall.md`](teil-b/B12_kritis-ausfall.md) | 2.1.0 | 12 |
| B13 | Migrationslage | [`teil-b/B13_migrationslage.md`](teil-b/B13_migrationslage.md) | 2.0.2 | 13 |
| B14 | Sicherheitslage | [`teil-b/B14_sicherheitslage.md`](teil-b/B14_sicherheitslage.md) | 2.1.1 | 14 |
| B15 | Cyberangriff / IT-Sicherheitsvorfall | [`teil-b/B15_cyberangriff-it-sicherheitsvorfall.md`](teil-b/B15_cyberangriff-it-sicherheitsvorfall.md) | 2.3.0 | 15 |
| B16 | Sabotage / Anschlag / Terrorismus | [`teil-b/B16_sabotage-anschlag-terrorismus.md`](teil-b/B16_sabotage-anschlag-terrorismus.md) | 2.1.1 | 16 |
| B17 | Sonstiges | [`teil-b/B17_sonstiges.md`](teil-b/B17_sonstiges.md) | 2.1.1 | 17 |

### Teil C – Themen- und Querschnittsbausteine (keine eigenen Ereignisarten)

Jeder Baustein trägt seinen Status im Dateikopf: C01 und C12 liegen als ausgearbeitete Beispielfassung vor, die übrigen als Inhaltsgerüst. Inhaltsgerüste ergänzen die Dach-SOP als Prüfhinweise, bis sie fachlich konkretisiert und freigegeben sind; auch eine Beispielfassung ist vor Verwendung organisationsspezifisch zu konkretisieren und fachlich zu prüfen (Teil A, A.1 Nr. 7). Verweise zwischen SOPs und Bausteinen sind bedingte Prüfhinweise ohne automatische Mitwahl (A.1 Nr. 2). Die Leseblöcke dienen der Navigation; sie sind keine Zuständigkeiten und keine zweite Nummernebene.

**Leseblock: Besondere Ereignis- und Gefahrenlagen**

| Kennung | Thema | Typ | Datei | Fassung | bisher |
|---|---|---|---|---|---|
| C01 | Radiologische / nukleare Lage | Themenbaustein | [`teil-c/C01_radiologische-nukleare-lage.md`](teil-c/C01_radiologische-nukleare-lage.md) | 1.2.1 | N01 |
| C02 | Massenbewegungen, Bodenversagen und Gebäudeeinsturz | Themenbaustein | [`teil-c/C02_massenbewegungen-bodenversagen-gebaeudeeinsturz.md`](teil-c/C02_massenbewegungen-bodenversagen-gebaeudeeinsturz.md) | 1.2.0 | N09 |
| C03 | Weltraumwetter und Störungen von Navigation und Zeitreferenz | Themenbaustein | [`teil-c/C03_weltraumwetter-navigation-zeitreferenz.md`](teil-c/C03_weltraumwetter-navigation-zeitreferenz.md) | 1.1.0 | N15 |
| C04 | Vulkanasche mit Deutschland- oder Versorgungsbezug | Themenbaustein | [`teil-c/C04_vulkanasche.md`](teil-c/C04_vulkanasche.md) | 1.1.1 | N18 |
| C05 | Großunfall und überörtliche Unfallfolgen | Themenbaustein | [`teil-c/C05_grossunfall-unfallfolgen.md`](teil-c/C05_grossunfall-unfallfolgen.md) | 1.1.0 | N16 |
| C06 | Kampfmittelfund mit Räumung oder Versorgungsauswirkung | Themenbaustein | [`teil-c/C06_kampfmittelfund.md`](teil-c/C06_kampfmittelfund.md) | 1.1.0 | N17 |

**Leseblock: Gesundheit und medizinische Versorgung**

| Kennung | Thema | Typ | Datei | Fassung | bisher |
|---|---|---|---|---|---|
| C07 | Infektionslagen – Auslandsausbruch und lokale Häufung | Themenbaustein | [`teil-c/C07_infektionslagen.md`](teil-c/C07_infektionslagen.md) | 1.1.1 | N11 |
| C08 | Tierseuchen und zoonotische Expositionslagen | Themenbaustein | [`teil-c/C08_tierseuchen-zoonotische-expositionslagen.md`](teil-c/C08_tierseuchen-zoonotische-expositionslagen.md) | 1.1.0 | N10 |
| C09 | Medizinische und pflegerische Versorgungslage und MANV-Folgen | Themenbaustein | [`teil-c/C09_medizinische-versorgung-manv.md`](teil-c/C09_medizinische-versorgung-manv.md) | 1.2.0 | N04 |
| C10 | Arzneimittel und kritisches medizinisches Material | Themenbaustein | [`teil-c/C10_arzneimittel-medizinisches-material.md`](teil-c/C10_arzneimittel-medizinisches-material.md) | 1.3.0 | N12 |

**Leseblock: Versorgung, Kommunikation und Logistik**

| Kennung | Thema | Typ | Datei | Fassung | bisher |
|---|---|---|---|---|---|
| C11 | Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit | Themenbaustein | [`teil-c/C11_telekommunikation-notruf-bos-warnfaehigkeit.md`](teil-c/C11_telekommunikation-notruf-bos-warnfaehigkeit.md) | 1.2.0 | N02 |
| C12 | Kraftstoff- und Wärmeversorgung | Themenbaustein | [`teil-c/C12_kraftstoff-waerme.md`](teil-c/C12_kraftstoff-waerme.md) | 1.1.1 | N05 |
| C13 | Verkehr, Transport und kritische Logistik | Themenbaustein | [`teil-c/C13_verkehr-transport-logistik.md`](teil-c/C13_verkehr-transport-logistik.md) | 1.1.1 | N06 |
| C14 | Lebensmittelversorgung | Themenbaustein | [`teil-c/C14_lebensmittelversorgung.md`](teil-c/C14_lebensmittelversorgung.md) | 1.2.0 | N07 |
| C15 | Abwasser, Sanitärhygiene und kritische Entsorgung | Themenbaustein | [`teil-c/C15_abwasser-sanitaerhygiene-entsorgung.md`](teil-c/C15_abwasser-sanitaerhygiene-entsorgung.md) | 1.1.1 | N08 |

**Leseblock: Lageübergreifende Querschnitte**

| Kennung | Thema | Typ | Datei | Fassung | bisher |
|---|---|---|---|---|---|
| C16 | Evakuierung, Schutzunterbringung und Betreuung | Querschnittsbaustein | [`teil-c/C16_evakuierung-schutzunterbringung-betreuung.md`](teil-c/C16_evakuierung-schutzunterbringung-betreuung.md) | 1.2.0 | N03 |
| C17 | Zivile Verteidigung – zivile Schutz- und Versorgungsfolgen | Querschnittsbaustein | [`teil-c/C17_zivile-verteidigung-zivile-folgen.md`](teil-c/C17_zivile-verteidigung-zivile-folgen.md) | 1.3.0 | N13 |

Mehrfachlagen und gemeinsame Engpassressourcen (Review-Kennung N14) sowie Notbetrieb und Kalibrierung (P01, P02) sind Redaktionsregeln in Teil A (A.7.4, A.7.5, A.10.3), keine Bausteine; deshalb gab es bis Fassung 2.0.1 keinen Baustein N14, und die Lücke wird nicht durch einen weiteren Baustein gefüllt.

## Konkordanz bis Fassung 2.0.1 → ab Fassung 3.0

Die App löst frühere technische IDs in gespeicherten Läufen und frühere Kennungen in `_entstehung.sop` über `bisherige_ids` und `bisherige_kennung` im Kopf jedes Abschnitts auf. Ältere Meldungen und Review-Dokumente behalten ihre historischen Angaben.

| bisher | bisherige ID | neu | neue ID |
|---|---|---|---|
| 01 | `sop-01` | B01 | `b01` |
| 02 | `sop-02` | B02 | `b02` |
| 03 | `sop-03` | B03 | `b03` |
| 04 | `sop-04` | B04 | `b04` |
| 05 | `sop-05` | B05 | `b05` |
| 06 | `sop-06` | B06 | `b06` |
| 07 | `sop-07` | B07 | `b07` |
| 08 | `sop-08` | B08 | `b08` |
| 09 | `sop-09` | B09 | `b09` |
| 10 | `sop-10` | B10 | `b10` |
| 11 | `sop-11` | B11 | `b11` |
| 12 | `sop-12` | B12 | `b12` |
| 13 | `sop-13` | B13 | `b13` |
| 14 | `sop-14` | B14 | `b14` |
| 15 | `sop-15` | B15 | `b15` |
| 16 | `sop-16` | B16 | `b16` |
| 17 | `sop-17` | B17 | `b17` |
| N01 | `baustein-n01` | C01 | `c01` |
| N09 | `baustein-n09` | C02 | `c02` |
| N15 | `baustein-n15` | C03 | `c03` |
| N18 | `baustein-n18` | C04 | `c04` |
| N16 | `baustein-n16` | C05 | `c05` |
| N17 | `baustein-n17` | C06 | `c06` |
| N11 | `baustein-n11` | C07 | `c07` |
| N10 | `baustein-n10` | C08 | `c08` |
| N04 | `baustein-n04` | C09 | `c09` |
| N12 | `baustein-n12` | C10 | `c10` |
| N02 | `baustein-n02` | C11 | `c11` |
| N05 | `baustein-n05` | C12 | `c12` |
| N06 | `baustein-n06` | C13 | `c13` |
| N07 | `baustein-n07` | C14 | `c14` |
| N08 | `baustein-n08` | C15 | `c15` |
| N03 | `baustein-n03` | C16 | `c16` |
| N13 | `baustein-n13` | C17 | `c17` |
| Teil A | `teil-a` | Teil A | `teil-a` |

## Archiv

Frühere Fassungen liegen seit Fassung 3.2.2 nicht mehr in diesem Ordner. Sie bleiben unverändert im Git-Verlauf abrufbar, zuletzt im Stand von Commit `7f88cab` (App 0.4.20, Profil 1.9.0); die Prüfsummen belegen die Unverändertheit.

| Datei (Git-Verlauf) | Fassung | SHA-256 |
|---|---|---|
| [`archiv/SOP-LEAD_Sammelmappe_v1.0.1.md`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v1.0.1.md) | 1.0.1 vom 17.10.2026 (bis 19.10.2026 `SOP-LEAD_Sammelmappe.md`) | `6c4d27a42845758661ae285837585373f8122e5481e4017b61d929dddb4b0626` |
| [`archiv/SOP-LEAD_Sammelmappe_v2.0.1.md`](https://github.com/pereirawolf/ki-lead/blob/7f88cabb4f5c6f3594608d75b710fa22cef46a83/profile/lead-beispiel/sop/archiv/SOP-LEAD_Sammelmappe_v2.0.1.md) | 2.0.1 vom 19.10.2026 (bis 19.10.2026 `SOP-LEAD_Sammelmappe_v2.0.md`; Fassung 2.0 auf `main` bis Commit 1852d49) | `f2ebf614ea54cf977173d0026f2ee2e501467b53646fac2c25b5a089289a9b93` |

Lizenz: CC BY 4.0.

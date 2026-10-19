# SOP-LEAD – Standardvorgehensweisen (Beispielfassung)

Beispielfassung für KI-LEAD · Fassung 3.0 vom 19.10.2026 · Änderungen im Änderungsverlauf [`CHANGELOG.md`](CHANGELOG.md)

Die Mappe enthält gemeinsame Regeln (Teil A), je Ereignisart des Katalogs eine Standardvorgehensweise (SOP) nach dem LEAD-Schema (Teil B) sowie Themen- und Querschnittsbausteine, die unter den bestehenden Ereignisarten verwendet werden (Teil C). Gemeinsame Regeln stehen einmal in Teil A und gelten für jede SOP und jeden Baustein; Teil B und Teil C nennen nur ihre lageartspezifischen Abweichungen, Prüffragen und Stolperstellen. Die Rolle „Koordinierungsstelle“ steht beispielhaft für eine Stelle, die Meldungen mehrerer Stellen zu einem übergreifenden Lagebild zusammenführt.

Diese Übersicht ist für Menschen bestimmt; die App liest sie nicht. Welche Dateien die App lädt, legt `profil.json` unter `sop.dateien` fest. Der **Gültigkeitsstand** (welche Fassungen von SOPs, Kodierleitfaden, Darstellungsdatei, Arbeitsanweisungen und Schema zusammengehören) steht am Anfang von Teil A, damit er jeder KI-Anfrage beiliegt. Gliederung und Kennungen regelt Teil A, A.10.1.

## Aufbau

Jede Datei beginnt mit ihrem Anker; jede SOP und jeder Baustein hat dieselben fünf Abschnitte: 1. Anwendungsbereich und Befassungsanlässe · 2. Erfassung: Prüffragen · 3. Auswertung: Prüfpunkte · 4. Darstellung · 5. Ansprechstellen und Pflege. Prüffragen werden mit Kennung und Zeile zitiert, z. B. „B05-R3“.

### Teil A – Gemeinsame Regeln

| Kennung | Inhalt | Datei |
|---|---|---|
| A.1–A.10 | Anwendung, Kodierregeln, Befundnachweis, Übertrag, Abschlusscheck, Quellenstatus, Redaktion des Lagebilds, Fortschreibung, Querschnittsprüfungen, Pflege | [`A_gemeinsame-regeln.md`](A_gemeinsame-regeln.md) |

### Teil B – SOPs je Ereignisart

| Kennung | Ereignisart | Datei | Fassung | bisher |
|---|---|---|---|---|
| B01 | Unwetter / Sturm | [`B/B01_unwetter-sturm.md`](B/B01_unwetter-sturm.md) | 2.0.1 | 01 |
| B02 | Hochwasser / Überschwemmung | [`B/B02_hochwasser-ueberschwemmung.md`](B/B02_hochwasser-ueberschwemmung.md) | 2.0.1 | 02 |
| B03 | Waldbrand | [`B/B03_waldbrand.md`](B/B03_waldbrand.md) | 2.0.1 | 03 |
| B04 | Erdbeben | [`B/B04_erdbeben.md`](B/B04_erdbeben.md) | 2.0.1 | 04 |
| B05 | Extremhitze / Dürre | [`B/B05_extremhitze-duerre.md`](B/B05_extremhitze-duerre.md) | 2.0.1 | 05 |
| B06 | Wintersturm / Schnee / Eis | [`B/B06_wintersturm-schnee-eis.md`](B/B06_wintersturm-schnee-eis.md) | 2.0.1 | 06 |
| B07 | Industrieunfall / Chemieunfall | [`B/B07_industrieunfall-chemieunfall.md`](B/B07_industrieunfall-chemieunfall.md) | 2.0.1 | 07 |
| B08 | Stromausfall / Blackout | [`B/B08_stromausfall-blackout.md`](B/B08_stromausfall-blackout.md) | 2.0.1 | 08 |
| B09 | Gasversorgungsengpass | [`B/B09_gasversorgungsengpass.md`](B/B09_gasversorgungsengpass.md) | 2.0.1 | 09 |
| B10 | Trinkwasserversorgung | [`B/B10_trinkwasserversorgung.md`](B/B10_trinkwasserversorgung.md) | 2.0.1 | 10 |
| B11 | Gesundheitliche Lage / Epidemie | [`B/B11_gesundheitliche-lage-epidemie.md`](B/B11_gesundheitliche-lage-epidemie.md) | 2.0.1 | 11 |
| B12 | KRITIS-Ausfall | [`B/B12_kritis-ausfall.md`](B/B12_kritis-ausfall.md) | 2.0.1 | 12 |
| B13 | Migrationslage | [`B/B13_migrationslage.md`](B/B13_migrationslage.md) | 2.0.1 | 13 |
| B14 | Sicherheitslage | [`B/B14_sicherheitslage.md`](B/B14_sicherheitslage.md) | 2.0.1 | 14 |
| B15 | Cyberangriff / IT-Sicherheitsvorfall | [`B/B15_cyberangriff-it-sicherheitsvorfall.md`](B/B15_cyberangriff-it-sicherheitsvorfall.md) | 2.0.1 | 15 |
| B16 | Sabotage / Anschlag / Terrorismus | [`B/B16_sabotage-anschlag-terrorismus.md`](B/B16_sabotage-anschlag-terrorismus.md) | 2.0.1 | 16 |
| B17 | Sonstiges | [`B/B17_sonstiges.md`](B/B17_sonstiges.md) | 2.0.1 | 17 |

### Teil C – Themen- und Querschnittsbausteine (keine eigenen Ereignisarten)

Alle Bausteine haben den Status „Inhaltsgerüst“: Sie ergänzen die Dach-SOP als Prüfhinweise, bis sie fachlich konkretisiert und freigegeben sind (Teil A, A.1 Nr. 7).

**Ereignisbausteine – Ursachen und Ereignisse ohne eigene Katalogart**

| Kennung | Thema | Datei | Fassung | bisher |
|---|---|---|---|---|
| C01 | Radiologische / nukleare Lage | [`C/C01_radiologische-nukleare-lage.md`](C/C01_radiologische-nukleare-lage.md) | 1.0.1 | N01 |
| C02 | Massenbewegungen, Bodenversagen und Gebäudeeinsturz | [`C/C02_massenbewegungen-bodenversagen.md`](C/C02_massenbewegungen-bodenversagen.md) | 1.0.1 | N09 |
| C03 | Weltraumwetter und Störungen von Navigation und Zeitreferenz | [`C/C03_weltraumwetter-und-stoerungen.md`](C/C03_weltraumwetter-und-stoerungen.md) | 1.0.1 | N15 |
| C04 | Großunfall und überörtliche Unfallfolgen | [`C/C04_grossunfall-und-ueberoertliche.md`](C/C04_grossunfall-und-ueberoertliche.md) | 1.0.1 | N16 |
| C05 | Kampfmittelfund mit Räumung oder Versorgungsauswirkung | [`C/C05_kampfmittelfund-mit-raeumung.md`](C/C05_kampfmittelfund-mit-raeumung.md) | 1.0.1 | N17 |
| C06 | Vulkanasche mit Deutschland- oder Versorgungsbezug | [`C/C06_vulkanasche-mit-deutschland.md`](C/C06_vulkanasche-mit-deutschland.md) | 1.0.1 | N18 |

**Versorgungsbausteine – kritische Funktionen und Versorgungsleistungen**

| Kennung | Thema | Datei | Fassung | bisher |
|---|---|---|---|---|
| C07 | Telekommunikation, Notruf, BOS-Kommunikation und Warnfähigkeit | [`C/C07_telekommunikation-notruf-bos.md`](C/C07_telekommunikation-notruf-bos.md) | 1.0.1 | N02 |
| C08 | Kraftstoff- und Wärmeversorgung | [`C/C08_kraftstoff-und-waermeversorgung.md`](C/C08_kraftstoff-und-waermeversorgung.md) | 1.0.1 | N05 |
| C09 | Verkehr, Transport und kritische Logistik | [`C/C09_verkehr-transport-und-kritische-logistik.md`](C/C09_verkehr-transport-und-kritische-logistik.md) | 1.0.1 | N06 |
| C10 | Lebensmittelversorgung | [`C/C10_lebensmittelversorgung.md`](C/C10_lebensmittelversorgung.md) | 1.0.1 | N07 |
| C11 | Abwasser, Sanitärhygiene und kritische Entsorgung | [`C/C11_abwasser-sanitaerhygiene-und-kritische.md`](C/C11_abwasser-sanitaerhygiene-und-kritische.md) | 1.0.1 | N08 |

**Gesundheitsbausteine – Vertiefungen unter B11**

| Kennung | Thema | Datei | Fassung | bisher |
|---|---|---|---|---|
| C12 | Nichtinfektiöse medizinische Versorgungslage und MANV-Folgen | [`C/C12_nichtinfektioese-medizinische.md`](C/C12_nichtinfektioese-medizinische.md) | 1.0.1 | N04 |
| C13 | Infektionslagen – Auslandsausbruch und lokale Häufung | [`C/C13_infektionslagen-auslandsausbruch.md`](C/C13_infektionslagen-auslandsausbruch.md) | 1.0.1 | N11 |
| C14 | Tierseuchen und zoonotische Expositionslagen | [`C/C14_tierseuchen-und-zoonotische.md`](C/C14_tierseuchen-und-zoonotische.md) | 1.0.1 | N10 |
| C15 | Arzneimittel und kritisches medizinisches Material | [`C/C15_arzneimittel-und-kritisches.md`](C/C15_arzneimittel-und-kritisches.md) | 1.0.1 | N12 |

**Querschnittsbausteine – lageartübergreifende Schutz- und Betreuungsfragen**

| Kennung | Thema | Datei | Fassung | bisher |
|---|---|---|---|---|
| C16 | Evakuierung, Schutzunterbringung und Betreuung | [`C/C16_evakuierung-schutzunterbringung.md`](C/C16_evakuierung-schutzunterbringung.md) | 1.0.1 | N03 |
| C17 | Zivile Verteidigung – zivile Schutz- und Versorgungsfolgen | [`C/C17_zivile-verteidigung-zivile-schutz.md`](C/C17_zivile-verteidigung-zivile-schutz.md) | 1.0.1 | N13 |

Mehrfachlagen und gemeinsame Engpassressourcen (Review-Kennung N14) sowie Notbetrieb und Kalibrierung (P01, P02) sind Redaktionsregeln in Teil A (A.7.4, A.7.5, A.10.3), keine Bausteine; deshalb gab es bis Fassung 2.0.1 keinen Baustein N14.

## Konkordanz bis Fassung 2.0.1 → ab Fassung 3.0

Die App löst die bisherigen technischen Kennungen und Kennungen in gespeicherten Läufen und Meldungen über `bisherige_ids` und `bisherige_kennung` im Kopf jedes Abschnitts auf.

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
| N16 | `baustein-n16` | C04 | `c04` |
| N17 | `baustein-n17` | C05 | `c05` |
| N18 | `baustein-n18` | C06 | `c06` |
| N02 | `baustein-n02` | C07 | `c07` |
| N05 | `baustein-n05` | C08 | `c08` |
| N06 | `baustein-n06` | C09 | `c09` |
| N07 | `baustein-n07` | C10 | `c10` |
| N08 | `baustein-n08` | C11 | `c11` |
| N04 | `baustein-n04` | C12 | `c12` |
| N11 | `baustein-n11` | C13 | `c13` |
| N10 | `baustein-n10` | C14 | `c14` |
| N12 | `baustein-n12` | C15 | `c15` |
| N03 | `baustein-n03` | C16 | `c16` |
| N13 | `baustein-n13` | C17 | `c17` |
| Teil A | `teil-a` | Teil A | `teil-a` |

## Archiv

Frühere Fassungen liegen unverändert in [`archiv/`](archiv/); die App liest sie nicht.

| Datei | Fassung | SHA-256 |
|---|---|---|
| `archiv/SOP-LEAD_Sammelmappe_v1.0.1.md` | 1.0.1 vom 17.10.2026 (bis 19.10.2026 `SOP-LEAD_Sammelmappe.md`) | `6c4d27a42845758661ae285837585373f8122e5481e4017b61d929dddb4b0626` |
| `archiv/SOP-LEAD_Sammelmappe_v2.0.1.md` | 2.0.1 vom 19.10.2026 (bis 19.10.2026 `SOP-LEAD_Sammelmappe_v2.0.md`) | `f2ebf614ea54cf977173d0026f2ee2e501467b53646fac2c25b5a089289a9b93` |

Lizenz: CC BY 4.0.

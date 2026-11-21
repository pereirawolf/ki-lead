# Gebietsverzeichnis aus dem Gemeindeverzeichnis GV-ISys

Amtliche Schlüssel und Namen für die Gebietssuche der App (seit 0.9.8). Herausgeber der Daten: Statistische Ämter des Bundes und der Länder, Gemeindeverzeichnis-Informationssystem GV-ISys. Gebietsstand und Ausgabe stehen in jeder Datei unter `stand` und `quelle`.

| Datei | Inhalt | Laden in der App |
|---|---|---|
| `gebiete-kern.json` | Bund (`DE`), Länder (2 Stellen), Regierungsbezirke bzw. Statistische Regionen (3), Kreise und kreisfreie Städte (5) | mit der App |
| `gebiete-gemeinden.json` | Gemeinden und gemeindefreie Gebiete, Amtlicher Gemeindeschlüssel (8 Stellen) | erst bei Bedarf (ab dem dritten Zeichen einer Suche, in der KI-Nachbearbeitung) |

Format `ki-lead-gebiete/1`: `format`, `stand` (JJJJ-MM-TT), `quelle`, `rechte`, `inhalt` und `eintraege` als Liste von `[Schlüssel, Name, Ebene]` mit einer Zeile je Eintrag, damit eine neue Ausgabe im Git-Verlauf lesbar ist. Gemeindeverbände und die Regionen in Baden-Württemberg bleiben außen vor, weil sie nicht im Präfix der Gemeindeschlüssel liegen. Kreise tragen ihre Art vorn („Landkreis Sonneberg“, „Kreisfreie Stadt Erfurt“), Gemeinden den Namen der Ausgabe („Sonneberg, Stadt“).

## Erneuern

Quartals- oder Jahresausgabe im Excel-Format („Alle politisch selbständigen Gemeinden …“) laden und das Skript aufrufen:

```
node scripts/gebietsverzeichnis.mjs AuszugGV3QAktuell.xlsx
```

Das Skript schreibt beide Dateien neu. Danach `npm test` ausführen: `tests/kern/gebiete.test.ts` nennt die Zahl der Einträge der Ausgabe zum 30.09.2026 und ist mit einer neuen Ausgabe anzupassen. Gebietsänderungen (etwa Gemeindefusionen zum Jahresbeginn) sind im Unterschied der Dateien zu sehen.

## Rechte

© Daten (im Auftrag der Herausgebergemeinschaft Statistische Ämter des Bundes und der Länder) Statistisches Bundesamt (Destatis), 2026. Vervielfältigung und Verbreitung, auch auszugsweise, mit Quellenangabe gestattet. Siehe `LICENSE-CONTENT`, Nr. 5 f, und `LICENSES/LicenseRef-Destatis-Quellenangabe.txt`. Diese Beschreibung steht wie der übrige Ordner `formate/` unter CC BY 4.0.

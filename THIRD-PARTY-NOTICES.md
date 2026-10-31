# Drittkomponenten und Lizenzen

Stand: 24.10.2026, App 0.5.9; Nachtrag 28.10.2026: Gradle-Wrapper und Vorlagen der Capacitor-CLI (Abschnitt 4) · Keine Rechtsberatung. Die Einschätzung beruht auf den Lizenzangaben der Pakete und den unten genannten Quellen.

Code unter EUPL-1.2 ([LICENSE](LICENSE)); Beispielprofile, Evaluationsmaterial und Dokumentation unter CC BY 4.0, maschinenlesbare Dateien und die Vorlage zusätzlich unter CC0 1.0, mit den Ausnahmen in [LICENSE-CONTENT](LICENSE-CONTENT). Diese Datei nennt alle fremden Komponenten, die mit der App ausgeliefert werden, und getrennt davon die Werkzeuge, die nur beim Entwickeln gebraucht werden.

## 1. Grundsatz

- **Wenig Abhängigkeiten.** Eine neue Bibliothek kommt nur hinzu, wenn sie eine Funktion trägt, die sich nicht schlank selbst umsetzen lässt.
- **Keine Lizenzkonflikte.** Ausgeliefert werden nur Komponenten unter permissiven Lizenzen (Positivliste in Abschnitt 7). Bei Wahllizenzen gilt der permissive Zweig.
- **Hinweise gehen mit.** Jede Kopie der App enthält die Lizenztexte (Abschnitt 7).

## 2. Ausgelieferte Laufzeitkomponenten (npm)

Alle Pakete, die `npm ci` ohne Entwicklungsabhängigkeiten nach `package-lock.json` installiert. „Lizenz (Paket)“ ist die Angabe im Lockfile, „Gewählt“ die Lizenz, unter der KI-LEAD die Komponente nutzt.

Einbindung:

- **Web-Build:** im Programmcode der App (`dist/assets/`), auch in der PWA und den nativen Apps.
- **nachgeladen:** eigener Teil des Web-Builds, den jsPDF nur bei Bedarf lädt; der Service Worker hält ihn vor.
- **im JSZip-Bundle / im html2canvas-Bundle:** im vorgebauten Paket der genannten Bibliothek enthalten.
- **nativ:** nur in den Apps für Android und iOS (Abschnitt 4).
- **nicht ausgeliefert:** installiert, aber nicht Teil der App (Typdefinitionen, Teile nur für Node.js, nicht eingebundene Plugins).

| Paket | Version | Lizenz (Paket) | Gewählt | Urheber | Einbindung |
|---|---|---|---|---|---|
| `@aparajita/capacitor-secure-storage` | 8.0.1 | MIT | MIT | Aparajita Fishman | Web-Build, nativ |
| `@babel/runtime` | 7.29.10 | MIT | MIT | Sebastian McKenzie und Mitwirkende | Web-Build |
| `@capacitor/android` | 8.5.3 | MIT | MIT | Drifty Co. (Ionic) | nativ |
| `@capacitor/app` | 8.1.2 | MIT | MIT | Ionic | nicht ausgeliefert |
| `@capacitor/core` | 8.5.3 | MIT | MIT | Drifty Co. (Ionic) | Web-Build |
| `@capacitor/ios` | 8.5.3 | MIT | MIT | Drifty Co. (Ionic) | nativ |
| `@capacitor/keyboard` | 8.0.6 | MIT | MIT | Ionic | nicht ausgeliefert |
| `@fontsource/atkinson-hyperlegible` | 5.3.0 | OFL-1.1 | OFL-1.1 | Braille Institute of America, Inc. (Schrift) | Web-Build |
| `@types/pako` | 2.0.4 | MIT | MIT | Microsoft Corporation | nicht ausgeliefert |
| `@types/raf` | 3.4.3 | MIT | MIT | Microsoft Corporation | nicht ausgeliefert |
| `@types/trusted-types` | 2.0.7 | MIT | MIT | Microsoft Corporation | nicht ausgeliefert |
| `argparse` | 3.0.3 | PSF-2.0 | PSF-2.0 | Python Software Foundation | nicht ausgeliefert |
| `base64-arraybuffer` | 1.0.2 | MIT | MIT | Niklas von Hertzen | im html2canvas-Bundle |
| `canvg` | 3.0.11 | MIT | MIT | Gabe Lerner | nachgeladen |
| `core-js` | 3.50.0 | MIT | MIT | Denis Pushkarev | nachgeladen |
| `core-util-is` | 1.0.3 | MIT | MIT | Node.js contributors | nicht ausgeliefert |
| `css-line-break` | 2.1.0 | MIT | MIT | Niklas von Hertzen | im html2canvas-Bundle |
| `dompurify` | 3.4.17 | (MPL-2.0 OR Apache-2.0) | Apache-2.0 | Cure53 und Mitwirkende | nachgeladen |
| `entities` | 8.1.0 | BSD-2-Clause | BSD-2-Clause | Felix Böhm | Web-Build |
| `fast-png` | 6.4.0 | MIT | MIT | Michaël Zasso | Web-Build |
| `fflate` | 0.8.3 | MIT | MIT | Arjun Barrett | Web-Build |
| `html2canvas` | 1.4.1 | MIT | MIT | Niklas von Hertzen | nachgeladen |
| `idb-keyval` | 6.3.0 | Apache-2.0 | Apache-2.0 | Jake Archibald | Web-Build |
| `immediate` | 3.0.6 | MIT | MIT | Barnesandnoble.com, Donavon West, Domenic Denicola, Brian Cavalier | im JSZip-Bundle |
| `inherits` | 2.0.4 | ISC | ISC | Isaac Z. Schlueter | nicht ausgeliefert |
| `iobuffer` | 5.4.0 | MIT | MIT | Michaël Zasso | Web-Build |
| `isarray` | 1.0.0 | MIT | MIT | Julian Gruber | nicht ausgeliefert |
| `js-tokens` | 4.0.0 | MIT | MIT | Simon Lydell | nicht ausgeliefert |
| `js-yaml` | 5.5.0 | MIT | MIT | Vitaly Puzrin | Web-Build |
| `jspdf` | 4.2.1 | MIT | MIT | James Hall, yWorks GmbH | Web-Build |
| `jspdf-autotable` | 5.0.9 | MIT | MIT | Simon Bengtsson | Web-Build |
| `jszip` | 3.10.2 | (MIT OR GPL-3.0-or-later) | MIT | Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso | Web-Build |
| `jszip/node_modules/pako` | 1.0.11 | (MIT AND Zlib) | MIT AND Zlib | Vitaly Puzrin, Andrei Tuputcyn | im JSZip-Bundle |
| `lie` | 3.3.0 | MIT | MIT | Calvin Metcalf, Jordan Harband | im JSZip-Bundle |
| `linkify-it` | 6.1.0 | MIT | MIT | Vitaly Puzrin | Web-Build |
| `loose-envify` | 1.4.0 | MIT | MIT | Andres Suarez | nicht ausgeliefert |
| `markdown-it` | 15.0.3 | MIT | MIT | Vitaly Puzrin, Alex Kocharin | Web-Build |
| `mdurl` | 2.1.0 | MIT | MIT | Vitaly Puzrin, Alex Kocharin | Web-Build |
| `pako` | 2.2.0 | (MIT AND Zlib) | MIT AND Zlib | Vitaly Puzrin, Andrei Tuputcyn | Web-Build |
| `performance-now` | 2.1.0 | MIT | MIT | Braveg1rl | nachgeladen |
| `process-nextick-args` | 2.0.1 | MIT | MIT | Calvin Metcalf | nicht ausgeliefert |
| `punycode.js` | 2.3.1 | MIT | MIT | Mathias Bynens | Web-Build |
| `raf` | 3.4.1 | MIT | MIT | Chris Dickinson | nachgeladen |
| `react` | 18.3.1 | MIT | MIT | Facebook, Inc. and its affiliates | Web-Build |
| `react-dom` | 18.3.1 | MIT | MIT | Facebook, Inc. and its affiliates | Web-Build |
| `readable-stream` | 2.3.8 | MIT | MIT | Node.js contributors | nicht ausgeliefert |
| `regenerator-runtime` | 0.13.11 | MIT | MIT | Facebook, Inc. | nicht ausgeliefert |
| `rgbcolor` | 1.0.1 | MIT OR SEE LICENSE IN FEEL-FREE.md | MIT | Stoyan Stefanov | nachgeladen |
| `safe-buffer` | 5.1.2 | MIT | MIT | Feross Aboukhadijeh | nicht ausgeliefert |
| `scheduler` | 0.23.2 | MIT | MIT | Facebook, Inc. and its affiliates | Web-Build |
| `setimmediate` | 1.0.5 | MIT | MIT | Barnesandnoble.com, Donavon West, Domenic Denicola | im JSZip-Bundle |
| `stackblur-canvas` | 2.7.0 | MIT | MIT | Mario Klingemann | nachgeladen |
| `string_decoder` | 1.1.1 | MIT | MIT | Node.js contributors | nicht ausgeliefert |
| `svg-pathdata` | 6.0.3 | MIT | MIT | Nicolas Froidure | nachgeladen |
| `text-segmentation` | 1.0.3 | MIT | MIT | Niklas von Hertzen | im html2canvas-Bundle |
| `tslib` | 2.8.1 | 0BSD | 0BSD | Microsoft Corporation | nicht ausgeliefert |
| `uc.micro` | 3.0.0 | MIT | MIT | Mathias Bynens | Web-Build |
| `util-deprecate` | 1.0.2 | MIT | MIT | Nathan Rajlich | nicht ausgeliefert |
| `utrie` | 1.0.2 | MIT | MIT | Niklas von Hertzen | im html2canvas-Bundle |

Bemerkungen:

- `@capacitor/app` und `@capacitor/keyboard` verlangt das Schlüsselbund-Plugin als Abhängigkeit. KI-LEAD bindet sie weder im Web-Build noch in den nativen Projekten ein (`android/capacitor.settings.gradle`, `ios/App/CapApp-SPM/Package.swift`).
- `argparse` gehört zur Kommandozeile von js-yaml, `loose-envify` und `js-tokens` zur Build-Umwandlung von React, der Strom-Zweig (`readable-stream` und Folgepakete) zu JSZip unter Node.js. Keines davon gelangt in die App.

## 3. Schrift

**Atkinson Hyperlegible** (Normal und Fett, Teilmengen Latin und Latin Extended), © 2020 Braille Institute of America, Inc., [SIL Open Font License 1.1](https://scripts.sil.org/OFL) (OFL-1.1). Eingebunden über `@fontsource/atkinson-hyperlegible` in `src/main.tsx`, ausgeliefert als WOFF2 und WOFF. Die Schrift hat keinen reservierten Namen. Sie wird nicht verändert und nicht einzeln weitergegeben, nur mit der App. In PDF-Ausgaben ist sie nicht eingebettet; jsPDF nutzt Standardschriften.

## 4. Native Apps (Android, iOS)

Nicht im npm-Lockfile, sondern in den nativen Projekten festgelegt. Die Versionen für Android stehen in `android/variables.gradle`.

| Komponente | Version | Lizenz | Urheber | Plattform |
|---|---|---|---|---|
| Capacitor (Android) | 8.5.3 | MIT | Drifty Co. (Ionic) | Android |
| Capacitor (iOS, über `capacitor-swift-pm`) | 8.5.3 | MIT; enthält Teile von Apache Cordova iOS unter Apache-2.0 | Drifty Co. (Ionic); The Apache Software Foundation | iOS |
| Schlüsselbund-Plugin `@aparajita/capacitor-secure-storage` | 8.0.1 | MIT | Aparajita Fishman | Android, iOS |
| KeychainSwift | ab 21.0.0, nicht festgelegt | MIT | Evgenii Neumerzhitckii (evgenyneu) | iOS |
| Apache Cordova Android framework (`org.apache.cordova:framework`) | 14.0.1 | Apache-2.0 | The Apache Software Foundation | Android |
| AndroidX AppCompat (`androidx.appcompat:appcompat`) | 1.7.1 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX Core (`androidx.core:core`) | 1.17.0 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX Activity (`androidx.activity:activity`) | 1.11.0 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX Fragment (`androidx.fragment:fragment`) | 1.8.9 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX CoordinatorLayout (`androidx.coordinatorlayout:coordinatorlayout`) | 1.3.0 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX WebKit (`androidx.webkit:webkit`) | 1.14.0 | Apache-2.0 | The Android Open Source Project | Android |
| AndroidX Core SplashScreen (`androidx.core:core-splashscreen`) | 1.2.0 | Apache-2.0 | The Android Open Source Project | Android |

Die AndroidX-Bibliotheken ziehen weitere AndroidX- und Kotlin-Bibliotheken nach, ebenfalls unter Apache-2.0. Eine vollständige Liste liefert erst der Gradle-Build (`./gradlew :app:dependencies`).

**Im Projekt, nicht in der App:** Der Gradle-Wrapper (`android/gradlew`, `android/gradlew.bat`, `android/gradle/wrapper/gradle-wrapper.jar`) stammt von Gradle Inc. und steht unter Apache-2.0 (Kennung in den Skripten); er lädt Gradle 8.14.3 (`gradle-wrapper.properties`) und wird nur zum Bauen gebraucht. Die Grundstruktur von `android/` und `ios/` hat die Capacitor-CLI aus ihren Vorlagen erzeugt (MIT, Drifty Co. (Ionic)). Beides fällt nicht unter die EUPL-1.2 des Projekts ([LICENSE-CONTENT](LICENSE-CONTENT), Nr. 4).

**NOTICE von Apache Cordova** (Apache-2.0, Abschnitt 4 Buchst. d):

```
Apache Cordova
Copyright 2015-2020 The Apache Software Foundation

This product includes software developed at
The Apache Software Foundation (http://www.apache.org/).
```

**Offen:** Die Version von KeychainSwift legt erst Xcode beim ersten Build fest. Danach `Package.resolved` einchecken und die Version hier und in `public/lizenzen-ergaenzend.md` eintragen.

## 5. Entwicklungsabhängigkeiten (nicht ausgeliefert)

Werkzeuge für Build, Tests und Formatierung. Sie gelangen nicht in die App; ihre Lizenzen berühren die Lizenz von KI-LEAD deshalb nicht. Aufgeführt sind die direkten Abhängigkeiten aus `package.json`; ihre eigenen Abhängigkeiten stehen im Lockfile.

| Paket | Version | Lizenz | Zweck |
|---|---|---|---|
| `@axe-core/playwright` | 4.14.0 | MPL-2.0 | Browsertests: automatische Prüfung der Barrierefreiheit mit axe-core (seit 0.6.5; MPL-2.0 wie axe-core, nur im Test, nicht ausgeliefert) |
| `@capacitor/cli` | 8.5.3 | MIT | native Projekte erzeugen und abgleichen |
| `@playwright/test` | 1.57.0 | Apache-2.0 | Browsertests |
| `@types/js-yaml` | 4.0.9 | MIT | Typdefinitionen |
| `@types/node` | 26.6.5 | MIT | Typdefinitionen |
| `@types/react` | 18.3.31 | MIT | Typdefinitionen |
| `@types/react-dom` | 18.3.7 | MIT | Typdefinitionen |
| `@typescript/native` | 7.0.2 | Apache-2.0 | Typprüfung (`tsc`, TypeScript 7; Alias auf das Paket `typescript`, seit 0.6.2) |
| `@vitejs/plugin-react` | 6.1.2 | MIT | Build |
| `@vitest/coverage-v8` | 5.0.5 | MIT | Testabdeckung (`npm run test:coverage`, seit 0.6.2) |
| `ajv` | 8.20.0 | MIT | Referenz für die Schemaprüfung in Tests |
| `eslint` | 10.13.0 | MIT | Linting (seit 0.6.2) |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT | Linting: Regeln für React-Hooks (seit 0.6.2) |
| `globals` | 17.13.0 | MIT | Linting: globale Namen von Browser und Node (seit 0.6.2) |
| `jsdom` | 30.1.3 | MIT | Oberflächentests |
| `prettier` | 3.9.10 | MIT | Formatierung |
| `typescript` | 6.0.2 | Apache-2.0 | TypeScript-API für typescript-eslint (Alias auf `@typescript/typescript6`, seit 0.6.2; vorher TypeScript 7.0.2 direkt) |
| `typescript-eslint` | 8.72.1 | MIT | Linting mit Typinformationen (seit 0.6.2) |
| `vite` | 8.3.4 | MIT | Build, Lizenzdatei im Build |
| `vitest` | 5.0.5 | MIT | Tests |

Gradle, das Android-Gradle-Plugin und Xcode sind ebenfalls nur Werkzeuge.

## 6. Verträglichkeit

**Code unter EUPL-1.2.** Alle ausgelieferten Komponenten stehen unter permissiven Lizenzen (MIT, ISC, BSD-2-Clause, 0BSD, Zlib, Apache-2.0) oder lassen einen permissiven Zweig zu. Solche Komponenten dürfen Teil eines Werks unter der EUPL sein, solange ihre Copyright- und Lizenzhinweise erhalten bleiben; die Kompatibilitätsmatrix der Europäischen Kommission stuft MIT, BSD und Apache so ein (Europäische Kommission, o. J. a). Die Kompatibilitätsklausel der EUPL (Art. 5 mit Anhang) betrifft das Verbinden mit Copyleft-Lizenzen und wird hier nicht gebraucht.

Festlegungen bei Wahllizenzen:

- **JSZip** (MIT oder GPL-3.0-or-later): MIT. Die GPL-Wahl würde Pflichten für das ganze Werk auslösen.
- **DOMPurify** (MPL-2.0 oder Apache-2.0): Apache-2.0. Die MPL-2.0 wäre mit der EUPL verträglich (Europäische Kommission, o. J. b), verlangt aber die Bereitstellung des Quelltexts der MPL-Dateien; Apache-2.0 ist schlanker.
- **rgbcolor** (MIT oder eigene Lizenzdatei): MIT.

Apache-2.0 verlangt, eine Kopie der Lizenz und eine vorhandene NOTICE-Datei mitzugeben (Abschnitt 4). idb-keyval und DOMPurify haben keine NOTICE-Datei; die von Apache Cordova steht in Abschnitt 4.

**Schrift unter OFL-1.1.** Die OFL erlaubt, die Schrift mit Software jeder Lizenz zu bündeln und als Webfont auszuliefern; nur der Verkauf der Schrift allein ist ausgeschlossen. Copyright und Lizenz müssen mitgehen. Die Lizenz der App und der erzeugten Dokumente ändert sich dadurch nicht (SIL International, 2009).

**Inhalte unter CC BY 4.0, maschinenlesbare Dateien zusätzlich unter CC0 1.0.** Keine Drittkomponente fließt in die Inhalte ein; ausgenommen sind nur amtliche Werke nach § 5 UrhG (zitierte Normtexte) und kurze Auszüge aus Quellen Dritter (LICENSE-CONTENT, Nr. 5). Code und Inhalte liegen in der App nur nebeneinander; jede Lizenz gilt für ihren Teil. Die Namensnennung steht in [LICENSE-CONTENT](LICENSE-CONTENT), im Fuß der App und unter „Über KI-LEAD“.

**Ergebnis:** kein Lizenzkonflikt.

## 7. Hinweise in der App, SBOM, Prüfung neuer Abhängigkeiten

- **Lizenzdatei im Build:** `npm run build` schreibt mit `build.license` von Vite die Datei `dist/lizenzen.md` mit Name, Version, Lizenz und Lizenztext jedes gebündelten Pakets, die Schrift eingeschlossen. Sie geht mit der PWA und den nativen Apps aus.
- **Ergänzende Datei:** `public/lizenzen-ergaenzend.md` enthält die Hinweise, die Vite nicht erfasst: die nativen Komponenten (Abschnitt 4) mit Apache-Lizenz und NOTICE sowie die Pakete in den vorgebauten Bundles von JSZip und html2canvas.
- **SBOM:** Die CI erzeugt bei jedem Lauf eine Stückliste im Format CycloneDX (`npm sbom --omit dev --sbom-format cyclonedx`) und legt sie als Artefakt `ki-lead-sbom` ab; bei einem Release wird sie als `ki-lead-<Version>-sbom.cdx.json` angehängt. Sie erfasst die npm-Pakete, nicht die nativen Bibliotheken aus Abschnitt 4.
- **Prüfung:** `tests/lizenzen/lizenzen.test.ts` liest `package-lock.json` und scheitert, wenn eine Laufzeitkomponente keine zulässige Lizenz hat oder in Abschnitt 2 fehlt, mit Paketname und Lizenz in der Meldung. Positivliste: MIT, MIT-0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Zlib, Apache-2.0, PSF-2.0, OFL-1.1, Unlicense, CC0-1.0. Eine andere Lizenz kommt nur nach Prüfung und mit Begründung in dieser Datei hinzu.

**Neue Abhängigkeit aufnehmen:** Lizenz prüfen, Zeile in Abschnitt 2 (bei nativen Komponenten Abschnitt 4 und `public/lizenzen-ergaenzend.md`) ergänzen, `npm test` ausführen.

## Quellen

- Europäische Kommission (o. J. a): EUPL compatible open source licences. Online abrufbar unter: https://interoperable-europe.ec.europa.eu/page/eupl-compatible-open-source-licences [Zugriff: 24.10.2026]
- Europäische Kommission (o. J. b): Licence comparison: MIT, Apache-2.0, MPL-2.0, EUPL-1.2, GPL-3.0-or-later. Online abrufbar unter: https://interoperable-europe.ec.europa.eu/licence/compare/MIT;Apache-2.0;MPL-2.0;EUPL-1.2;GPL-3.0-or-later [Zugriff: 24.10.2026]
- npm (o. J.): npm sbom. Online abrufbar unter: https://docs.npmjs.com/cli/v11/commands/npm-sbom [Zugriff: 24.10.2026]
- SIL International (2009): OFL FAQ, Version 1.1-update1. Online abrufbar unter: https://fontlibrary.org/files/BSozoo/130/OFL-FAQ.txt [Zugriff: 24.10.2026]

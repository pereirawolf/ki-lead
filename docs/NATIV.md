# Native Apps (iOS, iPadOS, Android)

KI-LEAD läuft als native App über [Capacitor](https://capacitorjs.com/) (MIT). Dieselbe Web-App wie im Browser wird in eine native Hülle eingebettet; es gibt keinen getrennten Quellcode für die Apps. App-Kennung: `de.pereirawolf.kilead`.

## Was die native App zusätzlich kann

- **Schlüsselbund des Systems:** Unter „Einstellungen → Ablage der API-Schlüssel“ lässt sich der iOS-Keychain bzw. der Android-Keystore wählen (Plugin [`@aparajita/capacitor-secure-storage`](https://github.com/aparajita/capacitor-secure-storage), MIT, Version fest auf 8.0.1). Einträge tragen das Präfix `ki-lead.`, werden nie in die iCloud synchronisiert und sind unter iOS nur auf diesem Gerät und nur entsperrt lesbar.
- Alle anderen Ablagen (Gerätespeicher, nur Sitzung) gibt es wie im Browser. Ist der Schlüsselbund nicht verfügbar, bleibt die App mit den anderen Ablagen voll nutzbar.
- Android sichert keine App-Daten in die Cloud (`allowBackup="false"`), damit Meldungen und Schlüssel nicht unbemerkt das Gerät verlassen.

Die Dateien der App liegen in der App selbst; ein Service Worker wird dort nicht angemeldet. Die KI-Funktionen rufen wie im Browser direkt `api.anthropic.com` bzw. `api.openai.com` auf.

## Ordner im Repository

| Ordner | Inhalt |
|---|---|
| `capacitor.config.json` | App-Kennung, Name, Webordner `dist` |
| `ios/` | Xcode-Projekt (Swift Package Manager, kein CocoaPods) |
| `android/` | Gradle-Projekt (minSdk 24, targetSdk 36) |
| `scripts/app-symbol.py` | erzeugt Web-, iOS- und Android-Symbole sowie Startbildschirme ([app-symbol.md](app-symbol.md)) |

Build-Ergebnisse, kopierte Webdateien und lokale Einstellungen schließt `.gitignore` aus.

## Versionen

Die Version der Apps folgt `package.json`: Versionsname wie die App (`0.5.1`), Buildnummer daraus abgeleitet (0.5.1 → 501). Bei einer neuen Version sind `android/app/build.gradle` (`versionName`, `versionCode`) und im Xcode-Projekt `MARKETING_VERSION` und `CURRENT_PROJECT_VERSION` anzupassen; `tests/nativ/projekt.test.ts` prüft die Übereinstimmung.

## iOS und iPadOS (Mac)

Voraussetzungen: macOS mit aktuellem Xcode, Node.js 22 oder neuer, Apple-Developer-Konto.

1. `npm ci`
2. `npm run app:ios` baut die Web-App, überträgt sie ins Xcode-Projekt und öffnet Xcode.
3. In Xcode unter „Signing & Capabilities“ das eigene Team wählen (Kennung `de.pereirawolf.kilead` bleibt).
4. Auf einem Simulator oder angeschlossenen Gerät starten und die Abnahmepunkte unten prüfen.
5. Für TestFlight: „Product → Archive“, dann „Distribute App → App Store Connect“. Die Angabe zur Verschlüsselung ist gesetzt (nur Standard-HTTPS, `ITSAppUsesNonExemptEncryption = false`).

## Android

Voraussetzungen: Android Studio mit Android SDK, JDK 21, Node.js 22 oder neuer.

1. `npm ci`
2. `npm run app:android` baut die Web-App, überträgt sie ins Gradle-Projekt und öffnet Android Studio.
3. Im Emulator oder auf einem Gerät starten.
4. Für eine APK: „Build → Build App Bundle(s) / APK(s) → Build APK(s)“; für eine veröffentlichte Fassung mit eigenem Signaturschlüssel signieren.

Nach jeder Änderung an der Web-App genügt `npm run app:sync`.

## Abnahme M5 (Spezifikation Abschnitt 9)

Je auf iPad, iPhone und Android-Emulator:

- Installation und Start; Symbol und Startbildschirm erscheinen
- Offline: im Flugmodus starten, Profil wählen, Lagebild-Beispiel laden, PDF ausgeben
- Unter „Einstellungen“ die Ablage „Schlüsselbund des Systems“ wählen, Schlüssel speichern, App beenden und neu starten: Schlüssel ist noch da, „Verbindung prüfen“ gelingt (mit Netz)
- Ablage zurück auf „Gerätespeicher“: Schlüssel zieht mit um
- Eine KI-Erfassung mit Anthropic und eine mit OpenAI bis S1

Nicht hier geprüft: Die nativen Builds selbst wurden in der Entwicklungsumgebung nicht übersetzt (kein Xcode, kein Android SDK); die Projektdateien prüfen die Regressionstests.

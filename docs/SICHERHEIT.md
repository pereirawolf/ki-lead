# KI-LEAD – Bedrohungsmodell

Fassung 1.2 vom 24.10.2026, gilt für App-Version 0.5.6 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Ein schlankes Bedrohungsmodell für den Forschungsdemonstrator. Es ist **kein Sicherheitskonzept nach IT-Grundschutz** und ersetzt keines. Eine Stelle, die KI-LEAD dienstlich erprobt, bewertet es in ihrem eigenen Rahmen. Schwachstellen melden: [SECURITY.md](../SECURITY.md).

---

## 1. Annahmen

- Verarbeitet werden nur fiktive oder offen zugängliche Inhalte, keine personenbezogenen und keine eingestuften Daten ([DATENSCHUTZ.md](DATENSCHUTZ.md)).
- Die Person nutzt ein eigenes, gesperrtes Gerät und einen eigenen API-Schlüssel mit Ausgabenlimit.
- Es gibt keinen Server des Herausgebers. Verbindungen gehen nur an GitHub Pages (Programmdateien) und an die KI-Anbieter.
- Jeder KI-Entwurf wird vor Verwendung von einer Person geprüft.

## 2. Schutzgüter

| Schutzgut | Warum |
|---|---|
| API-Schlüssel | verursacht Kosten beim Anbieter, gibt Zugang zum Anbieterkonto |
| Lokale Daten (Meldungen, Lagebild, Laufprotokolle, Profile) | Arbeitsstand der Person |
| Integrität der Entwürfe | ein verfälschter Entwurf kann eine falsche Lagebewertung nahelegen |
| Integrität der ausgelieferten App | manipulierter Code könnte Schlüssel und Inhalte abgreifen |

## 3. Risiken und Maßnahmen

### 3.1 Prompt-Injection über Websuche, Seitenabruf, Dateien und Eingangsmeldungen

Material, Suchergebnisse, abgerufene Seiten und Eingangsmeldungen können Text enthalten, der wie eine Anweisung an das Modell wirkt. Anthropic weist für den Seitenabruf ausdrücklich auf das Risiko eines Datenabflusses hin, wenn nicht vertrauenswürdige Eingaben auf sensible Daten treffen (Anthropic, o. J.).

| vorhanden | offen |
|---|---|
| Recherche nur, wenn der Auftrag sie erlaubt; Höchstzahlen für Suchen und Abrufe; Verdichtung startet ohne Websuche | keine Begrenzung auf bestimmte Domains beim Abruf (`allowed_domains`) |
| Seitenabruf nur für Adressen, die schon im Auftrag, im Material oder in Ergebnissen standen (Vorgabe des Anbieters) | keine Erkennung eingeschleuster Anweisungen |
| S3 (Reparatur) und Management Summary ohne Werkzeuge | |
| Schema-, Quellen- und Redaktionsprüfung; Freigabe durch eine Person; Laufprotokoll zeigt Prompts und Antworten | |
| nur fiktive oder offene Inhalte: ein Abfluss träfe keine schutzbedürftigen Daten | |

### 3.2 Ablage des API-Schlüssels

| vorhanden | offen |
|---|---|
| Ablage wählbar: Gerätespeicher (mit Hinweis „unverschlüsselt“), nur Sitzung, Schlüsselbund des Systems in der nativen App (`src/schluessel/ablage.ts`) | im Gerätespeicher unverschlüsselt in IndexedDB; lesbar bei Zugriff auf das entsperrte Gerät oder bei einer Lücke für Skripteinschleusung (3.4) |
| Keychain mit `whenUnlockedThisDeviceOnly`, keine iCloud-Synchronisierung; Android ohne Sicherung der App-Daten (`allowBackup="false"`) | iOS: nicht geprüft, ob IndexedDB der App in Gerätesicherungen landet (betrifft die Ablage „Gerätespeicher“) |
| Schlüssel in keinem Export und keinem Laufprotokoll (Tests prüfen das) | |
| Wechsel der Ablage entfernt den Schlüssel aus der alten | |

### 3.3 Kopfzeile `anthropic-dangerous-direct-browser-access`

Anthropic verlangt diese Kopfzeile, wenn der Browser die API direkt aufruft. Sie zeigt an, dass der Schlüssel im Browser liegt. Das ist bei KI-LEAD gewollt: Es gibt keinen Server, der den Schlüssel stellvertretend halten könnte (BYOK).

| vorhanden | offen |
|---|---|
| Schlüssel geht nur an `api.anthropic.com`, `api.openai.com`, `api.eu.mistral.ai` bzw. `api.mistral.ai`; die Content-Security-Policy lässt keine anderen Ziele zu | Risiko trägt die Person; Empfehlung: Ausgabenlimit, eigener Schlüssel nur für KI-LEAD, bei Anthropic in einem eigenen Workspace |

### 3.4 Skripteinschleusung und fremder Code

| vorhanden | offen |
|---|---|
| Content-Security-Policy in `index.html`: `script-src 'self'`, `connect-src` nur eigene Adresse und die drei Anbieter | `style-src 'unsafe-inline'` |
| Schemaprüfung ohne Codeerzeugung (kein `eval`, `src/kern/validierung.ts`) | Policy nur als Meta-Element; `frame-ancestors` lässt sich so nicht setzen, GitHub Pages erlaubt keine eigenen Kopfzeilen |
| Lesetexte mit markdown-it ohne HTML (`html: false`), keine Bilder | |
| alle Bibliotheken gebündelt, kein CDN | |

### 3.5 Integrität importierter Profile

Ein Profil enthält Arbeitsanweisungen, also die Prompts der KI-Läufe. Ein manipuliertes Profil kann Entwürfe gezielt verfälschen.

| vorhanden | offen |
|---|---|
| Strukturprüfung beim Import (Pflichtdateien, Schema, Darstellung, SOP-Anker) | keine Signatur und keine Herkunftsprüfung |
| Prüfsumme SHA-256 je Profilstand, angezeigt und im Laufprotokoll | Abgleich der Prüfsumme mit einer veröffentlichten Referenz nur von Hand |
| frühere Fassungen bleiben im Archiv; Profilansicht zeigt alle Texte lesbar | |

### 3.6 Service Worker und Reparaturseite

| vorhanden | offen |
|---|---|
| Service Worker hält nur eigene Dateien vor, fängt Anfragen an die Anbieter nie ab | – |
| installiert nur eine stimmige Fassung, übernimmt nie von sich aus (`src/pwa/sw-vorlage.js`) | |
| Reparaturseite ohne App-Bundle mit eigener Policy; entfernt nur Registrierung und Caches `ki-lead-…`, keine Daten | |
| Browsertests zu Update, Wiederherstellung und Offline-Start | |

### 3.7 Lieferkette

| vorhanden | offen |
|---|---|
| `npm ci` installiert genau nach `package-lock.json` | übrige Abhängigkeiten in `package.json` mit Bereichsangabe (`^`); fest ist nur der Lockfile |
| Capacitor und das Plugin für den Schlüsselbund exakt gepinnt | GitHub Actions per Versionsmarke (`@v4`) statt Commit-SHA |
| CI mit Grundrecht `contents: read`; Schreibrechte für Pages nur im Veröffentlichungsjob | keine automatische Prüfung bekannter Schwachstellen (Dependabot, `npm audit` im CI) |
| Veröffentlichung nur von `main` nach Tests, Build und Browsertests | Version von KeychainSwift nicht festgelegt, bis `Package.resolved` eingecheckt ist |
| Wenige Abhängigkeiten, nur permissive Lizenzen; `tests/lizenzen/` scheitert bei unzulässiger Lizenz oder fehlendem Eintrag in [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) | SBOM erfasst nur npm-Pakete, nicht die nativen Bibliotheken |
| SBOM im Format CycloneDX bei jedem CI-Lauf (Artefakt) und als Anhang jedes Releases | |

## 4. Hinweise für Nutzende

- Beim Anbieter ein **Ausgabenlimit** setzen und einen **eigenen Schlüssel** nur für KI-LEAD anlegen.
- Auf geteilten Geräten die Ablage **„Nur für diese Sitzung“** wählen.
- Recherche nur erlauben, wenn sie gebraucht wird.
- Profile nur aus vertrauenswürdiger Quelle importieren und die Prüfsumme vergleichen.
- Jeden Entwurf vor Verwendung fachlich prüfen.

---

## Quellen

- Anthropic (o. J.): Web fetch tool. Online abrufbar unter: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool [Zugriff: 24.10.2026]

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |
| 1.1 | 24.10.2026 | Abschnitt 3.7: Lizenzprüfung, SBOM, offene Festlegung von KeychainSwift (App 0.5.5) |
| 1.2 | 24.10.2026 | Mistral als dritter Anbieter: Schlüsselziel und Content-Security-Policy um `api.eu.mistral.ai` und `api.mistral.ai` erweitert; Mistral-Probe mit Testschlüssel als Repository-Secret, nur auf Anforderung, ohne Aufzeichnungen (App 0.5.6) |

# KI-LEAD – Selbstbetrieb und Betreiberkonfiguration

Fassung 1.0 vom 31.10.2026, gilt für App-Version 0.6.17 und folgende · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Dieses Dokument richtet sich an den IT-Betrieb einer Stelle, die KI-LEAD selbst ausliefern will, statt die öffentliche Fassung auf GitHub Pages zu nutzen. Es beschreibt die Betreiberkonfiguration, das Bauen mit ihr, den Endpunkt der Stelle und die Auslieferung als statische Dateien. Es ist keine Freigabe und kein Sicherheitskonzept; dafür sind [V3 in den Vorlagen](VORLAGEN.md#v3-steckbrief-für-die-it-freigabe) und [SICHERHEIT.md](SICHERHEIT.md) da.

---

## 1. Überblick

KI-LEAD hat keinen Server. Eine Stelle liefert dieselben statischen Dateien aus wie GitHub Pages; was die App darf, legt sie **zur Build-Zeit** in einer Betreiberkonfiguration fest:

- welche KI-Anbieter die App nutzen darf (Anthropic, OpenAI, Mistral, Ollama, ein eigener Endpunkt),
- ob es einen **Endpunkt der Stelle** gibt, einen KI-Dienst mit der Schnittstelle Chat Completions, den die Stelle betreibt oder beauftragt,
- welche Ablage der API-Schlüssel vorgegeben ist.

Aus der Konfiguration entstehen die Content-Security-Policy (`connect-src` in `index.html`) und die Zulassung der Anbieter in der App aus **einer** Quelle (`src/anbieter/betrieb.ts`). Nicht freigegebene Anbieter fehlen in der Oberfläche; Anfragen an sie weist die App ab, und der Browser würde sie wegen der Policy ohnehin sperren. Ohne Konfiguration entsteht der öffentliche Build, unverändert.

## 2. Betreiberkonfiguration

Eine JSON-Datei im Format `ki-lead-betrieb/1`, beschrieben in [betrieb/betrieb.schema.json](../betrieb/betrieb.schema.json). Maßgeblich ist die Prüfung beim Bauen; eine ungültige Datei bricht den Build mit einer Liste der Fehler ab.

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `format` | ja | `"ki-lead-betrieb/1"` |
| `bezeichnung` | ja | Name des Builds, 1–120 Zeichen; erscheint unter „Einstellungen → Über KI-LEAD“, in der Übersicht der Einstellungen und in jedem Laufprotokoll |
| `anbieter` | ja | freigegebene Anbieter in der Reihenfolge der Oberfläche: `anthropic`, `openai`, `mistral` (EU-Endpunkt und global), `ollama` (nur `localhost`/`127.0.0.1`, Port 11434), `stelle` |
| `stelle` | wenn `stelle` freigegeben | `basisUrl` (nur `https://`, ohne Abfrage und Anker; die App hängt `/chat/completions` an), `modell` (Kennung beim Dienst), optional `name` (Anzeige) und `preise` (`eingabe`, `ausgabe` in USD je 1 Mio. Token) |
| `schluesselablage` | nein | Vorgabe: `geraet` (Gerätespeicher, unverschlüsselt; ohne Angabe), `sitzung`, `passphrase`, `system` (nur native App). Eine Wahl der Person geht vor. |

Beispiele im Repository:

- [betrieb/beispiel-stelle.json](../betrieb/beispiel-stelle.json): eigener KI-Dienst der Stelle, Mistral als Rückfall, Schlüssel nur für die Sitzung.
- [betrieb/probe-mistral-eu.json](../betrieb/probe-mistral-eu.json): nur der Endpunkt der Stelle, gespielt vom EU-Endpunkt von Mistral; damit prüft die Mistral-Probe den Weg mit echten Aufrufen ([TESTS.md](TESTS.md)).

## 3. Bauen

**Mit Node.js (22 oder neuer):**

```sh
npm ci
KI_LEAD_BETRIEB=betrieb/meine-stelle.json npm run build
```

Das Ergebnis liegt in `dist/`. Ohne `KI_LEAD_BETRIEB` entsteht der öffentliche Build.

**Ohne eigene Node-Umgebung:** Repository forken, die Konfiguration unter `betrieb/` ablegen und unter „Actions“ → „Betreiberbuild“ → „Run workflow“ ihren Pfad angeben. Der Workflow baut, legt Konfiguration (`betrieb.json`) und Prüfsumme (`betrieb.sha256`) bei und stellt `dist/` als Artefakt `ki-lead-<version>-betrieb` bereit (30 Tage). Er startet nur von Hand, hat nur Leserechte und veröffentlicht nichts.

**Prüfen nach dem Bauen:**

- `dist/index.html`: `connect-src` nennt nur die freigegebenen Ziele.
- In der App unter „Einstellungen → Über KI-LEAD“: Bezeichnung, Verbindungsziele und SHA-256 der Konfiguration. Die Prüfsumme muss zur verwendeten Datei passen (`sha256sum`).
- Jedes Laufprotokoll trägt im Feld `betrieb` Bezeichnung und Prüfsumme.

## 4. Endpunkt der Stelle

Die App spricht den Endpunkt über **Chat Completions** an (Entscheidung E3 im Arbeitskonzept; die Responses API erst, wenn eine Stelle sie braucht):

- `POST <basisUrl>/chat/completions` mit `Authorization: Bearer <Schlüssel>`, `stream: true` (Server-Sent Events, Abschluss mit `[DONE]` oder `finish_reason`).
- Strukturierte Ausgabe über `response_format` mit `json_schema` und `strict: true`; das Schema ist geschlossen (alle Felder Pflicht, optionale als nullable).
- `max_tokens` wie bei den anderen Anbietern; kein `reasoning_effort`, keine Werkzeuge.
- Nutzungsangaben (`usage`) im letzten Stück des Stroms; ohne sie zeigt die App Tokens und Kosten als unbekannt.
- Inhalte gehen als Text. **PDF-Material weist die App ab**; Text aus PDFs lässt sich in die Stichworte übernehmen.
- Keine Websuche und kein Seitenabruf: Die Recherchegrenzen wirken bei diesem Anbieter nicht.

**Voraussetzungen beim Dienst:** erreichbar über HTTPS aus dem Browser der Nutzenden; CORS für die Herkunft der App (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers: authorization, content-type`, Vorabanfrage `OPTIONS`). Braucht der Dienst keine Anmeldung, genügt ein beliebiger Wert als Schlüssel.

**Erprobt:** mit dem EU-Endpunkt von Mistral (`https://api.eu.mistral.ai/v1`) über die Mistral-Probe. Andere Dienste mit Chat Completions (etwa vLLM oder ein Gateway) sind nicht erprobt; Abweichungen zeigen sich am ehesten bei `response_format` und bei den Nutzungsangaben im Strom.

## 5. Auslieferung als statische Dateien

Der Inhalt von `dist/` ist eine Einzelseiten-App mit Service Worker. Er braucht nur einen Webserver für statische Dateien.

- **Eigene Herkunft je Build.** Ein Betreiberbuild braucht eine eigene Herkunft (Schema, Host, Port), etwa `https://ki-lead.stelle.example`. Zwei Builds auf derselben Herkunft teilen sich Gerätespeicher und Schlüssel, und der Service Worker des einen beantwortet Seitenaufrufe des anderen. Ein Unterverzeichnis (`/ki-lead/`) ist möglich, wenn auf derselben Herkunft kein anderer KI-LEAD-Build liegt.
- **HTTPS ist Pflicht.** Ohne sicheren Kontext gibt es weder Service Worker noch die Verschlüsselung der Schlüsselablage mit Passphrase.
- **Kopfzeilen:** Die Policy steht als Meta-Element in `index.html`. Als Kopfzeile kann der Server sie verschärfen, etwa um `frame-ancestors 'none'`, das als Meta-Element nicht wirkt; `connect-src` muss dann **wörtlich** der Meta-Angabe entsprechen, sonst gilt die strengere Schnittmenge.
- **Zwischenspeicher:** `index.html`, `sw.js`, `manifest.webmanifest`, `start-pruefung.js`, `reparatur.html` und `reparatur.js` ohne langes Zwischenspeichern ausliefern (`Cache-Control: no-cache`); die Dateien mit Prüfsumme im Namen unter `assets/` dürfen lange gelten.
- **Dateitypen:** `.webmanifest` als `application/manifest+json`, `.js` als `text/javascript`, `.svg` als `image/svg+xml`.

Beispiel für Apache 2.4 (`.htaccess` im Verzeichnis der App; `mod_headers`, `mod_mime`; die Zeile mit der Policy aus `dist/index.html` übernehmen und um `frame-ancestors 'none'` ergänzen):

```apache
AddType application/manifest+json .webmanifest
AddType text/javascript .js

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "no-referrer"
  # Header always set Content-Security-Policy "default-src 'self'; …; connect-src 'self' https://ki.example.de; …; frame-ancestors 'none'"

  <FilesMatch "^(index\.html|sw\.js|manifest\.webmanifest|start-pruefung\.js|reparatur\.(html|js))$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <If "%{REQUEST_URI} =~ m#/assets/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
</IfModule>
```

## 6. Grenzen

- **Native Apps:** Ein Betreiberbuild lässt sich wie der öffentliche mit Capacitor verpacken ([NATIV.md](NATIV.md)); erprobt ist das nicht.
- **Ollama** bleibt auf `localhost` bzw. `127.0.0.1` mit Port 11434 beschränkt; ein Ollama im Netz der Stelle wäre ein Endpunkt der Stelle (Chat Completions unter `/v1`).
- **Updates:** Jede neue Fassung der App ist mit derselben Konfiguration neu zu bauen. Die Prüfsumme der Konfiguration bleibt dabei gleich, die App-Version steht in „Über KI-LEAD“ und im Laufprotokoll.
- **Verantwortung:** Für einen Betreiberbuild und den Endpunkt der Stelle ist die Stelle verantwortlich, auch datenschutzrechtlich ([DATENSCHUTZ.md](DATENSCHUTZ.md), Abschnitte 2 und 4).

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 31.10.2026 | Erste Fassung (App 0.6.17, TP-2026-W44-48 bis -52) |

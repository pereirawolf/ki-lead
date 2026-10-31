# KI-LEAD – Datenschutzerklärung, Datenschutzhinweise und Verarbeitungsbeschreibung

Fassung 1.10 vom 30.10.2026, gilt für App-Version 0.6.15 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Diese Hinweise beschreiben, welche Daten KI-LEAD wo verarbeitet und wohin sie gehen. **Die Datenschutzerklärung nach Art. 13 DSGVO für alles, was der Herausgeber selbst verantwortet, steht in [Abschnitt 12](#12-datenschutzerklärung).** Verantwortlicher und Kontakt: [Impressum](https://www.pereirawolf.de/impressum.html). Die Hinweise sind keine Rechtsberatung. Wer KI-LEAD dienstlich erprobt, prüft die Einordnung mit der eigenen Datenschutzbeauftragten oder dem eigenen Datenschutzbeauftragten.

---

## 1. Grundsatz

KI-LEAD ist ein Forschungsdemonstrator. Er ist für **fiktive oder offen zugängliche Inhalte** gedacht, nicht für personenbezogene und nicht für eingestufte Daten. Die App weist beim Start und vor jedem KI-Lauf darauf hin; vor einem KI-Lauf bestätigt die Person das ausdrücklich.

Werden nur fiktive oder offen zugängliche Inhalte ohne Personenbezug verwendet, verarbeitet KI-LEAD außer technischen Verbindungsdaten keine personenbezogenen Daten. Die übrigen Abschnitte beschreiben trotzdem alle Datenflüsse, damit eine nutzende Stelle das selbst beurteilen kann.

## 2. Wer verantwortlich ist

| Rolle | Wer | Wofür |
|---|---|---|
| Herausgeber der Software | Heiko Pereira Wolf, privates Forschungsvorhaben ([ORCID 0009-0004-0014-7616](https://orcid.org/0009-0004-0014-7616)); Anschrift und Kontakt im [Impressum](https://www.pereirawolf.de/impressum.html) | Quellcode, Profile, diese Hinweise; Betrieb der Seite auf GitHub Pages; Rückmeldungen im Repository (Abschnitt 12) |
| Verantwortlicher für die Verarbeitung in der App | die nutzende Person oder Stelle | was sie in die App eingibt, speichert, an einen KI-Anbieter sendet und exportiert |
| KI-Anbieter | Anthropic, OpenAI oder Mistral, nach Wahl der nutzenden Person; das Modell ist je Aufgabe wählbar, ein Lauf kann deshalb mehrere Anbieter nutzen (etwa die Mix-Profile seit 0.5.15: OpenAI und Anthropic). Seit 0.6.3 auch ein lokales Modell über Ollama auf dem eigenen Gerät; dann ist kein Drittanbieter beteiligt (Abschnitt 5) | Verarbeitung der Anfragen nach dem eigenen API-Vertrag der nutzenden Person oder Stelle; bei Ollama durch die nutzende Person oder Stelle selbst |
| Hosting der Web-App | GitHub (GitHub Pages) | Auslieferung der Programmdateien, Verbindungsprotokolle |

KI-LEAD hat **keinen eigenen Server**. Inhalte gehen vom Gerät direkt an den gewählten Anbieter, mit dem API-Schlüssel der nutzenden Person. Der Herausgeber erhält weder Inhalte noch Schlüssel, Protokolle oder Nutzungsdaten. Er kann deshalb auch keine Auskunft über die Verarbeitung in der App geben und nichts löschen.

Nutzt eine Behörde KI-LEAD, ist sie Verantwortliche für ihre Verarbeitung. Sie führt das Verzeichnis der Verarbeitungstätigkeiten (Vorlage in Anhang D) und entscheidet über eine Datenschutz-Folgenabschätzung (Anhang C).

## 3. Was wo gespeichert wird

Alles, was die App speichert, liegt **auf dem Gerät**: im Browser (IndexedDB, für das Farbschema auch localStorage) oder, bei der App für iOS und Android, im Speicher der App-WebView. Eine Datei im Dateisystem legt die App nur an, wenn die Person etwas herunterlädt oder exportiert.

| Was | Speicherschlüssel | Inhalt | Dauer |
|---|---|---|---|
| Einstellungen | `einstellungen` | Modelle, Aufwand, Höchstzahlen | bis zur Änderung oder Löschung |
| Farbschema | `darstellung`, `darstellung:profil:…`; zusätzlich localStorage `ki-lead-darstellung` | gewähltes Schema und eigene Profilfarben (localStorage nur, damit das Schema vor dem ersten Zeichnen gilt) | bis zur Änderung oder Löschung |
| Zwischenstand der Meldung | `entwurf:<profil>` | die gerade bearbeitete Meldung | bis zur Änderung oder Löschung |
| Lagebild | `lagebild:<profil>` | eingelesene Meldungen, Prüfstand | bis zur Änderung oder Löschung |
| Laufprotokolle | `lauf:<id>` | siehe Abschnitt 8 | bis zur Löschung durch die Person |
| Profile und Profilarchiv | `aktives-profil`, `profilarchiv:…` | importierte Profile mit Prüfsumme | bis zur Löschung |
| Management Summary | je Profil | zuletzt erstellte Fassung | bis zum Leeren oder Ersetzen |
| Archiv der Testläufe | eigene Datenbank `ki-lead-testlaeufe`: `eintrag:<id>`, `zip:<id>` | ZIP-Datei je Testlauf am fiktiven Fall „Ilka“ mit Laufprotokollen (seit 0.5.17) | bis zur Löschung durch die Person |
| API-Schlüssel | `schluessel:<anbieter>`, verschlüsselt `schluessel-verschluesselt:<anbieter>` mit `schluessel-passphrase` (Salz, Iterationen, Prüfwert; keine Passphrase) oder Schlüsselbund | siehe Abschnitt 9 | bis zur Löschung |
| Sicherung (nur auf Wunsch) | Datei `<Datum>_KI-LEAD_Sicherung.json` im Download-Ordner | alle Einträge der Zeilen oben außer API-Schlüsseln und ihrer Ablage (seit 0.6.15) | bis die Person die Datei löscht; sie liegt außerhalb der App und enthält die Inhalte im Klartext |
| Programmdateien (nur PWA) | Caches `ki-lead-…` | HTML, Skripte, Symbole der App | bis zur nächsten Fassung |

Der Service Worker der PWA hält nur Programmdateien vor. Inhalte und Anfragen an die KI-Anbieter fängt er nicht ab und speichert er nie (`src/pwa/sw-vorlage.js`).

## 4. Datenflüsse

```
Gerät ──(nur bei einer KI-Funktion, HTTPS)──▶ api.anthropic.com, api.openai.com, api.eu.mistral.ai  oder  api.mistral.ai
  │                                               │
  │                                               └─(nur wenn im Auftrag erlaubt)─▶ Websuche und Seitenabruf
  │                                                                                  beim Anbieter → Suchdienste, Webseiten
  └──(nur bei einem Modell „ollama:…“, seit 0.6.3)──▶ localhost:11434 bzw. 127.0.0.1:11434 (Ollama auf demselben Gerät)
Browser ──(Aufruf der Web-App)──▶ GitHub Pages (Programmdateien)
```

- **Andere Verbindungen gibt es nicht.** Die Content-Security-Policy der App (`index.html`) erlaubt Verbindungen nur zur eigenen Adresse, zu den drei Cloud-Anbietern und seit 0.6.3 zu Ollama auf dem eigenen Gerät (`http://localhost:11434`, `http://127.0.0.1:11434`; Begründung in [SICHERHEIT.md](SICHERHEIT.md), Abschnitt 3.9). Es gibt keine Telemetrie, keine Analytics, keine Absturzberichte, kein CDN und keine nachgeladenen Schriften; alle Bibliotheken und die Schrift sind gebündelt.
- **Was an den Anbieter geht:** die für die Stufe zusammengestellten Inhalte. Das sind Arbeitsanweisung, Profilregeln, gewählte SOPs, Kodierleitfaden, Schema, der Auftrag und das bereitgestellte Material. PDF-Dateien gehen unverändert als Dokument mit, DOCX-Dateien als Text. Die App begrenzt PDF auf 30 MB und andere Dateien auf 20 MB (`src/pipeline/material.ts`).
- **Websuche und Seitenabruf** führt der Anbieter aus, nicht das Gerät. Suchanfragen gehen an den Anbieter und gegebenenfalls an dessen Suchdienst. Abgerufene Webseiten sehen eine Anfrage des Anbieters. Anthropic weist darauf hin, dass Seitenbetreiber abgerufene Adressen und Anfragedaten nach eigenen Regeln speichern können (Anthropic, o. J. a). Recherche ist nur aktiv, wenn der Auftrag sie erlaubt; die Verdichtung startet ohne Websuche.
- **Erinnerungen an meldende Stellen** öffnen nur das Mailprogramm des Geräts (mailto). Die App versendet selbst nichts. Kontaktadressen stammen aus `kontakte.json` des Profils oder aus der nicht eingecheckten `kontakte.lokal.json`.

## 5. Bedingungen der KI-Anbieter

Es gelten die Bedingungen, die die nutzende Person oder Stelle mit dem Anbieter vereinbart hat. Der folgende Stand ist am 24.10.2026 geprüft. Er kann sich ändern; maßgeblich sind die verlinkten Seiten.

### Anthropic

- **Vertrag:** Die API unterliegt den kommerziellen Nutzungsbedingungen. Sie sind ausdrücklich nicht für Verbraucher bestimmt. Ein Auftragsverarbeitungsvertrag (Data Processing Addendum) ist durch Verweis Bestandteil (Anthropic, 2025).
- **Kein Training:** Anthropic darf Modelle nicht mit Kundeninhalten aus den Diensten trainieren (Anthropic, 2025).
- **Aufbewahrung:** Ein- und Ausgaben der API werden binnen 30 Tagen gelöscht. Verstoßen Inhalte gegen die Nutzungsrichtlinie, können Ein- und Ausgaben bis zu zwei Jahre, Klassifikationswerte bis zu sieben Jahre aufbewahrt werden. Längere Fristen sind auch zur Erfüllung gesetzlicher Pflichten möglich (Anthropic, 2026).
- **Prompt-Caching**, das KI-LEAD für Profilgrundlagen nutzt, speichert keine Prompts und Ausgaben, sondern kurzzeitig technische Zwischenwerte (Anthropic, o. J. b).

### OpenAI

- **Kein Training:** Daten, die an die API gesendet werden, nutzt OpenAI ohne ausdrückliche Zustimmung nicht zum Training (OpenAI, o. J.).
- **Aufbewahrung:** Protokolle zur Missbrauchsüberwachung bis zu 30 Tage, sofern nicht gesetzlich länger geboten (OpenAI, o. J.).
- **`store: false`:** KI-LEAD sendet jede Anfrage mit `store: false` (`src/anbieter/openai.ts`). Damit speichert OpenAI keinen Anwendungszustand der Antwort; ausgenommen ist das Prompt-Caching mit bis zu 24 Stunden (OpenAI, o. J.).
- **Dateien:** PDF-Material geht inline mit der Anfrage, nicht über den Dateispeicher `/v1/files`. OpenAI prüft eingehende Dateien automatisch auf Darstellungen sexuellen Kindesmissbrauchs; Treffer werden zur manuellen Prüfung aufbewahrt (OpenAI, o. J.).

### Mistral (seit App 0.5.6)

- **Anbieter:** Mistral AI SAS, Paris. Der globale Endpunkt verarbeitet Anfragen standardmäßig in der EU (Wavect, 2026). KI-LEAD nutzt als Vorgabe den regionalen EU-Endpunkt `api.eu.mistral.ai`: Mistral verarbeitet Ein- und Ausgaben dort in Rechenzentren in EU und EFTA; Kontoverwaltung, Schlüssel, Abrechnung und Nutzungsauswertung können außerhalb liegen (Mistral AI, o. J. d). Über diesen Endpunkt gibt es keine Websuche. Wer in den Einstellungen den globalen Endpunkt `api.mistral.ai` wählt, erhält die Websuche, ohne regionale Festlegung. Für einzelne Funktionen dokumentiert Mistral Übermittlungen an Unterauftragnehmer (Wavect, 2026); ob das die Websuche betrifft, ist nicht geprüft.
- **Training:** Im kostenlosen Tarif darf Mistral Ein- und Ausgaben zum Training nutzen; im Tarif mit Abrechnung nach Verbrauch liegt die Entscheidung bei der Kundin oder dem Kunden. Abschalten lässt sich das jederzeit in der Verwaltung unter „Privacy“, „Anonymous improvement data“ (Mistral AI, o. J. a; o. J. b). KI-LEAD weist in den Einstellungen darauf hin.
- **Aufbewahrung:** Ein- und Ausgaben der API bewahrt Mistral zur Missbrauchsüberwachung 30 Tage auf (Open Terms Archive, 2024). Eine Löschung ohne Aufbewahrung (Zero Data Retention) gibt es auf Antrag nur für zustandslose Aufrufe. Chat Completions, die KI-LEAD über den EU-Endpunkt nutzt, gehören dazu; die Conversations-API für die Websuche am globalen Endpunkt ist ausdrücklich ausgenommen (Mistral AI, o. J. c).
- **`store: false`:** Am globalen Endpunkt sendet KI-LEAD jede Anfrage mit `store: false` (`src/anbieter/mistral.ts`), damit keine abrufbare Unterhaltung angelegt wird; Chat Completions am EU-Endpunkt legen keine an. PDF-Material geht inline mit der Anfrage, nicht über `/v1/files`.

### Ollama, lokal (seit App 0.6.3)

- **Kein Drittanbieter.** Mit einem Modell „ollama:…“ gehen die Inhalte eines Laufs an Ollama auf demselben Gerät (Loopback-Schnittstelle, Port 11434), nicht an einen Anbieter im Netz. Es gibt keinen API-Schlüssel, keinen Vertrag mit einem Anbieter und keine Übermittlung in ein Drittland durch KI-LEAD. Ollama und das lokale Modell betreibt die nutzende Person oder Stelle selbst; was Ollama protokolliert oder speichert, richtet sich nach dessen Einstellungen.
- **Keine Websuche, kein Seitenabruf.** Die App sendet an Ollama keine Werkzeuge; S2 arbeitet nur mit dem Material.
- **Herunterladen der Modelle** (`ollama pull`) ist ein Vorgang außerhalb von KI-LEAD.
- Die Ergebnisqualität lokaler Modelle ist in KI-LEAD nicht erprobt.

### Übermittlung in Drittländer

Anthropic und OpenAI verarbeiten Anfragen in den USA. Das ist eine Übermittlung in ein Drittland im Sinne von Kapitel V DSGVO, sofern personenbezogene Daten enthalten sind. Mistral verarbeitet über den EU-Endpunkt (Vorgabe in KI-LEAD) in EU und EFTA, über den globalen Endpunkt standardmäßig in der EU; ob Unterauftragnehmer einzelner Funktionen Daten außerhalb der EU verarbeiten, regelt der Vertrag mit Mistral. Die Rechtsgrundlage der Übermittlung regelt der Auftragsverarbeitungsvertrag des jeweiligen Anbieters mit der nutzenden Person oder Stelle. Wer personenbezogene Daten verarbeiten will, prüft diesen Vertrag selbst. Für KI-LEAD gilt unabhängig davon: keine personenbezogenen Daten.

## 6. Keine Verarbeitung beim Herausgeber

Der Herausgeber betreibt keinen Dienst, über den Inhalte laufen. Er sieht nicht, wer KI-LEAD nutzt, mit welchem Anbieter oder mit welchen Inhalten. Die Kosten der KI-Läufe trägt die nutzende Person über ihr eigenes Konto beim Anbieter.

## 7. GitHub Pages

Die Web-App wird über GitHub Pages ausgeliefert (`https://pereirawolf.github.io/ki-lead/`). Beim Aufruf protokolliert und speichert GitHub die IP-Adresse der Besucherin oder des Besuchers zu Sicherheitszwecken, auch ohne Anmeldung bei GitHub (GitHub, o. J.). Darauf hat der Herausgeber keinen Einfluss und keinen Zugriff. Einzelheiten stehen in der Datenschutzerklärung von GitHub.

Nach dem ersten Aufruf startet die installierte PWA aus dem Gerät. GitHub wird dann nur noch nach neuen Programmfassungen gefragt. Die Apps für iOS und Android rufen GitHub nicht auf; ihre Programmdateien liegen in der App.

## 8. Laufprotokolle

Jeder KI-Lauf wird auf dem Gerät protokolliert (Format `src/pipeline/lauf.ts`, Ablage seit 0.6.3 `src/speicher/laufSpeicher.ts`). Ein Laufprotokoll enthält:

- Profil-ID, Profilversion und Prüfsumme
- je Stufe Modell, Parameter, **vollständige Prompts** einschließlich Auftrag und Material sowie die **Rohantworten**
- Token, Kosten und Dauer
- PDF-Inhalte nur als Verweis, nicht als Datei

Protokolle bleiben, bis die Person sie löscht; jedes lässt sich in der KI-Erfassung einzeln löschen. Ein exportiertes Protokoll (`ki-lead-lauf/1`, JSON) enthält dasselbe. Es ist wie das verwendete Material zu behandeln. Der API-Schlüssel steht nie in einem Protokoll oder Export; die Tests prüfen das.

## 9. API-Schlüssel

Der Schlüssel geht nur im Aufruf an die Schnittstelle des jeweiligen Anbieters. Wo er auf dem Gerät liegt, wählt die Person unter „Einstellungen“ (`src/schluessel/ablage.ts`):

| Ablage | Wo | Schutz |
|---|---|---|
| Gerätespeicher der App (Vorgabe) | IndexedDB | unverschlüsselt; lesbar für jeden mit Zugriff auf das entsperrte Gerät |
| Nur für diese Sitzung | Arbeitsspeicher | nach Schließen oder Neuladen weg |
| Gerätespeicher, mit Passphrase verschlüsselt (seit 0.6.2) | IndexedDB, nur verschlüsselt | AES-GCM mit einem Schlüssel, den die App per PBKDF2 (SHA-256, 600 000 Iterationen, zufälliges Salz) aus einer Passphrase ableitet; Passphrase und abgeleiteter Schlüssel nur im Arbeitsspeicher, je Sitzung neu einzugeben; ohne Passphrase nicht lesbar. Vergessene Passphrase: die verschlüsselten Schlüssel lassen sich nur verwerfen |
| Schlüsselbund des Systems (nur iOS und Android) | Keychain bzw. Keystore | verschlüsselt, nur dieses Gerät, nie in der iCloud; iOS nur entsperrt |

Die App für Android schließt App-Daten von der Sicherung aus (`android:allowBackup="false"`). Ein Ausgabenlimit beim Anbieter begrenzt das Risiko eines verlorenen Schlüssels in jedem Fall. Weiteres in [SICHERHEIT.md](SICHERHEIT.md).

## 10. Löschen

| Was | Wie |
|---|---|
| ein Laufprotokoll | KI-Erfassung, Liste der Läufe, „Löschen“ |
| Management Summary | „Leeren“ in der Ansicht |
| archivierte Testläufe | Einstellungen, „Testläufe“, Archiv: „Ausgewählte löschen“ oder „Alle löschen“ |
| API-Schlüssel | Feld leeren und speichern; bei Wechsel der Ablage zieht er um und wird in der alten entfernt |
| alle Daten dieses Geräts (seit 0.6.15) | Einstellungen, „Daten“, „Alle Daten dieses Geräts löschen“: Gerätespeicher einschließlich API-Schlüssel, Testlaufarchiv, Farbschema, in der nativen App auch der Schlüsselbund; vorher lässt sich der Stand sichern |
| alle Daten der Web-App | auch: Websitedaten von `pereirawolf.github.io` in den Browsereinstellungen löschen |
| alle Daten der nativen App | App deinstallieren |
| Daten beim KI-Anbieter | nach dessen Fristen (Abschnitt 5); Anfragen dazu an den Anbieter |

Die Reparaturseite `reparatur.html` entfernt nur Programmdateien und die Service-Worker-Registrierung. Sie löscht ausdrücklich keine Meldungen, Profile, Einstellungen oder Schlüssel; das tut „Alle Daten dieses Geräts löschen“ unter „Einstellungen → Daten“ (seit 0.6.15, TP-2026-W44-45). Eine Sicherung des Gerätestands enthält keine API-Schlüssel, aber alle Inhalte im Klartext; sie ist wie das verwendete Material zu behandeln (TP-2026-W44-44).

## 11. Fragen und Hinweise

Fragen und Hinweise zu diesen Datenschutzhinweisen über ein [Issue im Repository](https://github.com/pereirawolf/ki-lead/issues/new/choose) (Vorlage „Datenschutz“). Issues sind öffentlich; bitte keine personenbezogenen Daten hineinschreiben. Fragen zur Verarbeitung beim KI-Anbieter richten sich an den Anbieter.

**Rückmeldungen aus der Erprobung** ([ERPROBUNG.md](ERPROBUNG.md)) gehen ebenfalls nur über Issues. Dort verarbeitet GitHub den Beitrag und den Benutzernamen nach seinen eigenen Bedingungen; der Herausgeber liest die Beiträge, um sie auszuwerten. Laufprotokolle und Meldungen werden nur angehängt, wenn ihr Inhalt fiktiv oder selbst verfasst ist (ERPROBUNG.md, Abschnitt 6). Der Herausgeber übernimmt sie nicht ins Repository und entfernt Beiträge mit unzulässigen Inhalten. Einen anderen Rückmeldeweg, etwa per E-Mail, gibt es für die Erprobung nicht.

**Impressum und Kontakt:** [pereirawolf.de/impressum.html](https://www.pereirawolf.de/impressum.html). Die Verweise in der App öffnen sich extern; die App ruft die Seite nicht selbst auf.

## 12. Datenschutzerklärung

Diese Erklärung informiert nach Art. 13 DSGVO über die Verarbeitung personenbezogener Daten, für die der Herausgeber verantwortlich ist. Sie gilt für KI-LEAD: die Web-App auf GitHub Pages (`https://pereirawolf.github.io/ki-lead/`), die Apps für iOS und Android und das Repository `github.com/pereirawolf/ki-lead`. Die Website pereirawolf.de ist ein eigenes Angebot; diese Erklärung gilt für sie nicht.

### 12.1 Verantwortlicher

Heiko Pereira Wolf. Anschrift und E-Mail-Adresse stehen im [Impressum](https://www.pereirawolf.de/impressum.html). Ein Datenschutzbeauftragter ist nicht benannt.

Für die Verarbeitung in der App ist der Herausgeber nicht verantwortlich, sondern die nutzende Person oder Stelle; für die Verarbeitung beim KI-Anbieter gelten dessen Bedingungen (Abschnitte 2 und 5).

### 12.2 Verarbeitungen

| Vorgang | Daten | Zweck | Rechtsgrundlage | Empfänger | Speicherdauer |
|---|---|---|---|---|---|
| Aufruf der Web-App | IP-Adresse, Zeitpunkt, aufgerufene Datei, Browserangaben; erhoben von GitHub | Auslieferung und Sicherheit der Programmdateien | Art. 6 Abs. 1 Buchst. f DSGVO; berechtigtes Interesse: unentgeltliche, sichere Bereitstellung des Forschungsdemonstrators | GitHub, Inc. (Hosting); der Herausgeber erhält diese Daten nicht | nach den Bedingungen von GitHub (Abschnitt 7) |
| Speichern auf dem Gerät (IndexedDB, localStorage, Service Worker) | Einstellungen, Profile, Meldungen, Laufprotokolle, Schlüssel nach Wahl (Abschnitt 3) | Funktion der App | § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für den ausdrücklich gewünschten Dienst) | niemand; die Daten verlassen das Gerät nur bei einem KI-Lauf an den gewählten Anbieter | bis zur Löschung durch die Person (Abschnitt 10) |
| Issues, Kommentare und Pull Requests im Repository | GitHub-Benutzername, Inhalt des Beitrags, Zeitpunkt, Anhänge | Bearbeitung von Fehlermeldungen und Hinweisen, Auswertung der Erprobung ([ERPROBUNG.md](ERPROBUNG.md)) | Art. 6 Abs. 1 Buchst. f DSGVO; berechtigtes Interesse: Weiterentwicklung und Erprobung des Forschungsvorhabens | öffentlich sichtbar; GitHub, Inc. | solange das Repository besteht; Beiträge werden auf Anfrage entfernt, soweit GitHub das zulässt; Auswertungen enthalten keine Namen |
| Vertrauliche Sicherheitsmeldung über GitHub ([SECURITY.md](../SECURITY.md)) | GitHub-Benutzername, Inhalt der Meldung | Behebung der Schwachstelle | Art. 6 Abs. 1 Buchst. f DSGVO; berechtigtes Interesse: Sicherheit der Software | GitHub, Inc. | bis zum Abschluss; danach nach den Regeln von GitHub für Sicherheitsmeldungen |
| Kontakt per E-Mail (Adresse im Impressum) | E-Mail-Adresse, Name, Inhalt | Beantwortung der Anfrage | Art. 6 Abs. 1 Buchst. f DSGVO; berechtigtes Interesse: Beantwortung von Anfragen | E-Mail-Dienst des Herausgebers | bis die Anfrage erledigt ist |

Der Herausgeber setzt **keine Cookies, kein Tracking, keine Analyse- und keine Werbedienste** ein. Er erhält keine Inhalte, Schlüssel, Laufprotokolle oder Nutzungsdaten aus der App (Abschnitt 6). Laufprotokolle und Meldungen bitte nicht per E-Mail senden (Abschnitt 11).

### 12.3 Übermittlung in Drittländer

GitHub, Inc. hat seinen Sitz in den USA und verarbeitet Daten auch dort. GitHub stützt Übermittlungen aus der EU nach eigener Angabe auf das EU-U.S. Data Privacy Framework und auf Standardvertragsklauseln (GitHub, 2026).

### 12.4 Pflicht zur Bereitstellung, automatisierte Entscheidungen

Niemand ist verpflichtet, dem Herausgeber Daten bereitzustellen. Die App ist ohne Rückmeldung voll nutzbar; ohne Aufruf von GitHub Pages lässt sich nur die Web-App nicht laden. Der Herausgeber trifft keine automatisierten Entscheidungen und betreibt kein Profiling.

### 12.5 Rechte der betroffenen Personen

Betroffene Personen haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Gegen Verarbeitungen auf Grundlage berechtigter Interessen können sie aus Gründen, die sich aus ihrer besonderen Situation ergeben, Widerspruch einlegen (Art. 21). Anfragen gehen an die Kontaktdaten im [Impressum](https://www.pereirawolf.de/impressum.html). Für Daten, die nur GitHub oder ein KI-Anbieter verarbeitet, sind diese die richtigen Ansprechpartner.

Jede betroffene Person kann sich bei einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere im Mitgliedstaat ihres Aufenthaltsorts, ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes (Art. 77 DSGVO).

### 12.6 Änderungen

Diese Erklärung wird mit KI-LEAD fortgeschrieben. Die geltende Fassung steht im Kopf dieses Dokuments, frühere Fassungen im Änderungsverlauf und im Git-Verlauf.

---

## Anhang A: Datenschutzangaben im App Store (Apple)

Antworten für „App Privacy“ in App Store Connect. Gewählt ist die vorsichtige Lesart: Apple versteht unter „Collect“ die Übermittlung vom Gerät, wenn Daten länger gespeichert werden, als es die Bearbeitung der Anfrage in Echtzeit erfordert, auch durch Partner (Apple, o. J.). Die Anbieter bewahren Anfragen bis zu 30 Tage auf. Die Ausnahme für optionale Angaben greift nicht, weil die KI-Funktionen zur Hauptfunktion gehören.

| Frage | Antwort |
|---|---|
| Do you or your third-party partners collect data from this app? | Yes |
| Datenart | User Content → Other User Content (Auftrag, Material, Profiltexte an den KI-Anbieter) |
| Zweck | App Functionality |
| Linked to the user? | Yes (Anfragen laufen über das Anbieterkonto der Person) |
| Used for tracking? | No |
| Weitere Datenarten (Kontakt, Standort, Kennungen, Nutzungsdaten, Diagnose) | nicht erhoben |

Hinweis für die Beschreibung im Store: KI-Funktionen senden Inhalte mit dem eigenen API-Schlüssel der Person an Anthropic, OpenAI oder Mistral; ohne Schlüssel arbeitet die App vollständig lokal.

## Anhang B: Datensicherheit bei Google Play

Antworten für das Formular „Data safety“. Google versteht unter Erhebung jede Übermittlung vom Gerät; Weitergabe an Dritte muss nicht angegeben werden, wenn sie auf einer bestimmten Handlung der Person beruht, bei der sie die Weitergabe erwartet (Google, o. J.).

| Frage | Antwort |
|---|---|
| Does your app collect or share any of the required user data types? | Yes |
| Erhobene Datenarten | App activity → Other user-generated content; Files and docs (nur wenn die Person Dateien als Material wählt) |
| Zweck | App functionality |
| Erhebung optional? | Ja: nur bei KI-Funktionen, die die Person selbst startet |
| Weitergabe (sharing) | Nein: Übermittlung an den KI-Anbieter löst die Person selbst aus und erwartet sie |
| Is all of the user data collected by your app encrypted in transit? | Yes (nur HTTPS; gemischte Inhalte gesperrt) |
| Do you provide a way for users to request that their data is deleted? | Ja: Daten auf dem Gerät löscht die Person selbst; beim Anbieter werden API-Daten nach dessen Fristen gelöscht (Abschnitt 5) |
| Datenschutzerklärung | Link auf diese Datei im Repository |

<!-- SPDX-SnippetBegin -->
<!-- SPDX-SnippetCopyrightText: 2026 Heiko Pereira Wolf <https://www.pereirawolf.de> -->
<!-- SPDX-License-Identifier: CC-BY-4.0 OR CC0-1.0 -->
<!-- Nach Wahl auch CC0 1.0: LICENSE-CONTENT, Nr. 2 d -->

## Anhang C: Vorlage Schwellwertanalyse zur Datenschutz-Folgenabschätzung

Für Stellen, die KI-LEAD erproben. Die Vorlage hilft bei der Frage, ob eine Datenschutz-Folgenabschätzung (DSFA) nach Art. 35 DSGVO nötig ist. **DSFA und Verzeichnis der Verarbeitungstätigkeiten bleiben bei der nutzenden Stelle.** Eine Vorlage für den Eintrag im Verzeichnis steht in Anhang D. Die Vorlage ersetzt keine Beratung durch die eigene Datenschutzbeauftragte oder den eigenen Datenschutzbeauftragten. Sie steht nach Wahl auch unter CC0 1.0 ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 2 d) und kann ohne Namensnennung übernommen werden.

**Stelle:** … **Vorhaben:** Erprobung von KI-LEAD, Version … **Ausgefüllt von / am:** …

### Schritt 1: Personenbezug

| Frage | Antwort | Begründung |
|---|---|---|
| Werden personenbezogene Daten eingegeben, als Material bereitgestellt oder in Profilen (z. B. `kontakte.json`) gespeichert? | ja / nein | |
| Wenn nein: Wie ist sichergestellt, dass nur fiktive oder offen zugängliche Inhalte ohne Personenbezug verwendet werden? | | z. B. Dienstanweisung zur Erprobung, fiktive Testlagen |

Lautet die Antwort „nein“ und ist sie begründet, ist keine DSFA nötig. Ergebnis unter Schritt 3 festhalten und Schritt 2 überspringen.

### Schritt 2: Prüfung, falls personenbezogene Daten verarbeitet werden

**a) Muss-Liste.** Prüfen, ob die Verarbeitung unter eine Liste von Verarbeitungsvorgängen nach Art. 35 Abs. 4 DSGVO fällt, für die eine DSFA durchzuführen ist. Die bundesweit abgestimmte Liste der Datenschutzkonferenz gilt für den nicht-öffentlichen Bereich (Datenschutzkonferenz, 2018); öffentliche Stellen ziehen die Liste ihrer zuständigen Aufsichtsbehörde heran, soweit vorhanden. Ergebnis: …

**b) Kriterien.** Die Leitlinien der Artikel-29-Datenschutzgruppe (2017) nennen neun Kriterien. Treffen zwei oder mehr zu, ist in der Regel eine DSFA durchzuführen.

| Kriterium | Hinweis zu KI-LEAD | trifft zu? | Begründung |
|---|---|---|---|
| 1. Bewerten oder Einstufen (Scoring, Profiling) | KI-LEAD bewertet Lagen, nicht Personen | | |
| 2. Automatisierte Entscheidung mit Rechtswirkung | nein: Entwürfe, Freigabe durch eine Person | | |
| 3. Systematische Überwachung | nein | | |
| 4. Sensible oder höchstpersönliche Daten | nur, wenn sie im Material stehen | | |
| 5. Verarbeitung in großem Umfang | Erprobung, kleiner Kreis | | |
| 6. Abgleich oder Zusammenführen von Datensätzen | Verdichtung führt Meldungen zusammen | | |
| 7. Daten schutzbedürftiger Betroffener | nur, wenn sie im Material stehen | | |
| 8. Innovative Nutzung neuer Technologien | ja: generative KI | | |
| 9. Verarbeitung hindert Betroffene an der Ausübung von Rechten | nein | | |

**c) Zusätzlich beachten:** Übermittlung in die USA (Abschnitt 5); Laufprotokolle enthalten vollständige Prompts und Material (Abschnitt 8); Aufbewahrung beim Anbieter bis zu 30 Tage, bei Verstößen länger.

### Schritt 3: Ergebnis

- [ ] Keine personenbezogenen Daten; keine DSFA erforderlich.
- [ ] Personenbezogene Daten; keine DSFA erforderlich, weil: …
- [ ] DSFA erforderlich.

Datum, Unterschrift, Beteiligung der oder des Datenschutzbeauftragten: …

## Anhang D: Vorlage Eintrag im Verzeichnis von Verarbeitungstätigkeiten

Für Stellen, die KI-LEAD erproben oder einsetzen und dabei personenbezogene Daten verarbeiten. Die Vorlage übernimmt die Angaben dieses Dokuments je Pflichtfeld und verweist auf den Abschnitt, in dem sie stehen. Felder in eckigen Klammern füllt die Stelle selbst. **Das Verzeichnis führt die nutzende Stelle** (Abschnitt 2). Die Vorlage ersetzt nicht das Muster der eigenen Stelle oder der zuständigen Aufsichtsbehörde und keine Beratung durch die eigene Datenschutzbeauftragte oder den eigenen Datenschutzbeauftragten. Sie steht nach Wahl auch unter CC0 1.0 ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 2 d) und kann ohne Namensnennung übernommen werden.

Werden nach Anhang C, Schritt 1, keine personenbezogenen Daten verarbeitet, ist kein Eintrag nötig. Das begründete Ergebnis von Schritt 1 dokumentiert dann die Festlegung.

### Rechtsrahmen

| Bereich | Maßgeblich | Folge für den Eintrag |
|---|---|---|
| Verwaltung im Allgemeinen, auch Brand- und Katastrophenschutz | Art. 30 Abs. 1 DSGVO | Pflichtangaben D1 bis D7 |
| Landesrecht | [Landesdatenschutzgesetz, z. B. Thüringer Datenschutzgesetz (ThürDSG)], [Fachgesetz], [Vorgaben der Aufsichtsbehörde oder hausinternes Muster] | zusätzliche Angaben unter D8 |
| Polizei, Strafverfolgung und Gefahrenabwehr im Anwendungsbereich der Richtlinie (EU) 2016/680 | Bund: § 70 BDSG (Bundesministerium der Justiz, o. J.); Länder: eigenes Umsetzungsrecht, in Thüringen das ThürDSG und das jeweilige Fachgesetz (§ 1 Abs. 2 ThürDSG; Verzeichnis: § 50 ThürDSG, mit Rechtsgrundlage und Profiling wie § 70 BDSG; Freistaat Thüringen, 2018; Haufe, o. J.) | Rechtsgrundlage ist Pflichtangabe; zusätzlich Angabe zum Profiling (D9) |

Art. 30 DSGVO verlangt keine Angabe der Rechtsgrundlage. Aufsichtsbehörden empfehlen sie, öffentliche Stellen sollen spezialgesetzliche Grundlagen nennen (TLfDI, o. J.). Die Vorlage sieht das Feld deshalb immer vor (D2).

**Kopf**

| Angabe | Eintrag |
|---|---|
| Bezeichnung der Verarbeitungstätigkeit | [z. B. Erfassung und Verdichtung von Lagemeldungen mit KI-Unterstützung (KI-LEAD)] |
| Laufende Nummer im Verzeichnis der Stelle | [ ] |
| Eingesetzte Fassung | KI-LEAD [App-Version], Profil [Profil-ID, Profilversion] (beides steht in jedem Laufprotokoll, Abschnitt 8) |
| Einsatzbeginn, Stand des Eintrags | [Datum], [Datum] |

### D1 Verantwortlicher (Art. 30 Abs. 1 Buchst. a DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| Verantwortlich ist die nutzende Stelle (Abschnitt 2). Der Herausgeber ist weder Verantwortlicher noch Auftragsverarbeiter: Er betreibt keinen Dienst und erhält keine Inhalte (Abschnitte 6 und 12.1). | [Behörde, Anschrift], [verantwortliche Organisationseinheit], [gemeinsam Verantwortliche, falls ja], [Datenschutzbeauftragte oder Datenschutzbeauftragter mit Kontakt] |

### D2 Zwecke und Rechtsgrundlage (Art. 30 Abs. 1 Buchst. b DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| KI-LEAD unterstützt die Erfassung von Lagemeldungen nach dem gewählten Profil, ihre Prüfung und Verdichtung zu einem Lagebild sowie eine Management Summary. Die KI erstellt Entwürfe; eine Person prüft und gibt frei (Anhang C, Kriterium 2). | [konkreter Zweck der Stelle, z. B. Erprobung im Rahmen von …; Sammelbegriffe vermeiden (TLfDI, o. J.)] |
| Eine Rechtsgrundlage kann der Herausgeber nicht vorgeben. | [Rechtsgrundlage, z. B. Art. 6 Abs. 1 Buchst. e, Abs. 3 DSGVO in Verbindung mit … (Fachgesetz)] |

### D3 Betroffene Personen und Datenkategorien (Art. 30 Abs. 1 Buchst. c DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| Bei bestimmungsgemäßer Nutzung keine personenbezogenen Daten (Abschnitt 1). Personenbezug kann entstehen durch: Angaben in Auftrag, Material, Meldungen und Profiltexten; Kontaktadressen meldender Stellen in `kontakte.json` oder `kontakte.lokal.json` (Abschnitt 4); Laufprotokolle mit vollständigen Prompts, Material und Rohantworten (Abschnitt 8). Speicherorte auf dem Gerät: Abschnitt 3. | [Kategorien betroffener Personen, z. B. in Meldungen genannte Personen, Ansprechpersonen meldender Stellen, Beschäftigte der Stelle] |
| | [Datenkategorien]; besondere Kategorien nach Art. 9 DSGVO: [ja / nein, Begründung] |

### D4 Empfänger (Art. 30 Abs. 1 Buchst. d DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| KI-Anbieter nach Wahl, je Aufgabe auch mehrere: Anthropic, OpenAI, Mistral, als Auftragsverarbeiter nach dem Vertrag der Stelle (Abschnitte 2 und 5). Bei Ollama kein externer Empfänger (Abschnitt 5). Bei erlaubter Recherche sehen Suchdienste und Webseiten Anfragen des Anbieters (Abschnitt 4). GitHub als Hosting der Web-App für Verbindungsdaten (Abschnitt 7). Erinnerungen per E-Mail gehen über das Mailprogramm des Geräts an die meldenden Stellen (Abschnitt 4). Der Herausgeber ist kein Empfänger (Abschnitt 6). | [genutzte Anbieter und Verträge], [interne Empfänger, z. B. Stab, Lagezentrum], [Zugriffsberechtigte nach Rolle] |

### D5 Übermittlung in Drittländer (Art. 30 Abs. 1 Buchst. e DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| Anthropic und OpenAI: USA. Mistral über den EU-Endpunkt (Vorgabe): EU und EFTA; Kontoverwaltung, Abrechnung und Auswertung können außerhalb liegen. Ollama: keine Übermittlung (Abschnitt 5, „Übermittlung in Drittländer“). GitHub: USA (Abschnitt 12.3). Die Grundlage der Übermittlung regelt der Vertrag des Anbieters mit der Stelle. | [Drittländer der genutzten Anbieter], [Garantie: Angemessenheitsbeschluss, Standardvertragsklauseln oder …, geprüft am …] |

### D6 Löschfristen (Art. 30 Abs. 1 Buchst. f DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| Auf dem Gerät bleibt alles bis zur Löschung durch die Person; die App löscht nichts selbsttätig (Abschnitte 3 und 10). Beim Anbieter: bis 30 Tage, bei Verstößen gegen dessen Richtlinien länger (Abschnitt 5). Exportierte Laufprotokolle sind wie das verwendete Material zu behandeln (Abschnitt 8). | [Frist der Stelle, z. B. Laufprotokolle und Lagebilder löschen nach …], [Zuständigkeit für die Löschung], [Aufbewahrung nach Aktenordnung oder Fachrecht] |

### D7 Technische und organisatorische Maßnahmen (Art. 30 Abs. 1 Buchst. g, Art. 32 DSGVO)

| Vorbefüllung | Eintrag der Stelle |
|---|---|
| Kein eigener Server; Verbindungen nur über HTTPS und nur zu den in der Content-Security-Policy erlaubten Zielen; keine Telemetrie (Abschnitt 4). Bestätigung vor jedem KI-Lauf, dass keine personenbezogenen oder eingestuften Daten verwendet werden (Abschnitt 1). Ablage der API-Schlüssel wählbar, auch mit Passphrase verschlüsselt oder im Schlüsselbund des Systems; Android-Sicherung ausgeschlossen (Abschnitt 9). Prüfsumme importierter Profile, Schutz gegen Prompt-Injection und Lieferkettenrisiken: [SICHERHEIT.md](SICHERHEIT.md). | [Gerätesicherheit, Benutzer- und Zugriffsschutz], [gewählte Schlüsselablage], [Ausgabenlimit und Kontoverwaltung beim Anbieter], [Dienstanweisung zur Erprobung, Unterweisung] |

### D8 Ergänzende Angaben (Landesrecht, Empfehlungen)

| Angabe | Eintrag der Stelle |
|---|---|
| Ergebnis der Schwellwertanalyse oder DSFA (Anhang C) | [Datum, Ergebnis, Fundstelle] |
| Auftragsverarbeitungsverträge | [Anbieter, Vertragsstand, Fundstelle] |
| Landesrechtliche Zusatzangaben | [nach Landesdatenschutzgesetz oder Muster der Stelle] |

### D9 Nur im Anwendungsbereich der Richtlinie (EU) 2016/680

| Angabe | Vorbefüllung | Eintrag der Stelle |
|---|---|---|
| Profiling (§ 70 Abs. 1 Nr. 5 BDSG; § 50 Abs. 1 Nr. 5 ThürDSG; sonst Landesrecht) | KI-LEAD bewertet Lagen, nicht Personen (Anhang C, Kriterium 1). | [nein / ja, Beschreibung] |
| Rechtsgrundlage (§ 70 Abs. 1 Nr. 7 BDSG; § 50 Abs. 1 Nr. 7 ThürDSG; sonst Landesrecht) | siehe D2 | [Vorschrift] |

**Ausgefüllt von / am:** … **Beteiligung der oder des Datenschutzbeauftragten:** … **Überprüfung:** bei jeder neuen App- oder Profilversion, spätestens [Datum]

---

<!-- SPDX-SnippetEnd -->

## Quellen

Zugriff, soweit nicht anders angegeben, am 24.10.2026.

- Anthropic (2025): Commercial Terms of Service. Online abrufbar unter: https://www.anthropic.com/legal/commercial-terms [Zugriff: 24.10.2026]
- Anthropic (2026): How long do you store my organization's data? Online abrufbar unter: https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data [Zugriff: 24.10.2026]
- Anthropic (o. J. a): Web fetch tool. Online abrufbar unter: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool [Zugriff: 24.10.2026]
- Anthropic (o. J. b): API and data retention. Online abrufbar unter: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention [Zugriff: 24.10.2026]
- Apple (o. J.): App privacy details on the App Store. Online abrufbar unter: https://developer.apple.com/support/app-privacy-on-the-app-store/ [Zugriff: 24.10.2026]
- Artikel-29-Datenschutzgruppe (2017): Guidelines on Data Protection Impact Assessment (DPIA) and determining whether processing is "likely to result in a high risk" for the purposes of Regulation 2016/679 (WP 248 rev.01), vom Europäischen Datenschutzausschuss bestätigt. Online abrufbar unter: http://ec.europa.eu/newsroom/article29/item-detail.cfm?item_id=611236 [Zugriff: 24.10.2026]
- Bundesministerium der Justiz (o. J.): § 70 Bundesdatenschutzgesetz (BDSG) – Verzeichnis von Verarbeitungstätigkeiten. Online abrufbar unter: https://www.gesetze-im-internet.de/bdsg_2018/__70.html [Zugriff: 28.10.2026]
- Datenschutzkonferenz (2018): Liste von Verarbeitungsvorgängen nach Art. 35 Abs. 4 DS-GVO – DSFA-Liste Deutschland, nicht-öffentlicher Bereich, Version 1.1 vom 17.10.2018. Online abrufbar unter: https://datenschutz-hamburg.de/fileadmin/user_upload/HmbBfDI/Datenschutz/Informationen/DSFA_Muss-Liste_fuer_den_nicht-oeffentlicher_Bereich_-_Stand_17.10.2018.pdf [Zugriff: 24.10.2026]
- Freistaat Thüringen (2018): Thüringer Datenschutzgesetz (ThürDSG) vom 6. Juni 2018, Artikel 1 des Thüringer Datenschutz-Anpassungs- und -Umsetzungsgesetzes EU, GVBl. Nr. 6/2018, S. 229. Online abrufbar unter: https://parldok.thueringer-landtag.de/ParlDok/dokument/67333/gesetz_und_verordnungsblatt_nr_6_2018.pdf [Zugriff: 28.10.2026]
- GitHub (2026): GitHub General Privacy Statement, gültig ab 27.04.2026. Online abrufbar unter: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement [Zugriff: 24.10.2026]
- GitHub (o. J.): About GitHub Pages. Online abrufbar unter: https://docs.github.com/en/articles/about-github-pages [Zugriff: 24.10.2026]
- Google (o. J.): Provide information for Google Play's Data safety section. Online abrufbar unter: https://support.google.com/googleplay/android-developer/answer/10787469 [Zugriff: 24.10.2026]
- Haufe (o. J.): Thüringer Datenschutzgesetz, § 50 Verzeichnis von Verarbeitungstätigkeiten (Artikel 24 der Richtlinie (EU) 2016/680). Online abrufbar unter: https://www.haufe.de/id/norm/thueringer-datenschutzgesetz-50-verzeichnis-von-verarbeitungstaetigkeiten-artikel-24-der-richtlinie-eu-2016680-HI11798656_p50.html [Zugriff: 28.10.2026]
- lxgesetze (o. J.): § 25 Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz (TDDDG). Online abrufbar unter: https://lxgesetze.de/tdddg/25 [Zugriff: 24.10.2026]
- Mistral AI (o. J. a): Do you use my user data to train your artificial intelligence models? Online abrufbar unter: https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models [Zugriff: 24.10.2026]
- Mistral AI (o. J. b): Can I opt out of my input or output data being used for training? Online abrufbar unter: https://help.mistral.ai/en/articles/347614-can-i-opt-out-of-my-input-or-output-data-being-used-for-training [Zugriff: 24.10.2026]
- Mistral AI (o. J. c): Zero data retention. Online abrufbar unter: https://docs.mistral.ai/admin/monitor-comply/zero-data-retention [Zugriff: 24.10.2026]
- Mistral AI (o. J. d): Regional inference. Online abrufbar unter: https://docs.mistral.ai/inference/regional-inference [Zugriff: 24.10.2026]
- Open Terms Archive (2024): Mistral AI retains API prompts and outputs for 30 days. Online abrufbar unter: https://opentermsarchive.org/en/memos/mistral-ai-retains-api-prompts-and-outputs-for-30-days/ [Zugriff: 24.10.2026]
- OpenAI (o. J.): Data controls in the OpenAI platform. Online abrufbar unter: https://developers.openai.com/api/docs/guides/your-data [Zugriff: 24.10.2026]
- TLfDI – Thüringer Landesbeauftragter für den Datenschutz und die Informationsfreiheit (o. J.): Hinweise zum Anwendungsbeispiel für ein Verzeichnis von Verarbeitungstätigkeiten gem. Art. 30 DS-GVO. Online abrufbar unter: https://tlfdi.de/fileadmin/tlfdi/datenschutz/hinweise_verarbeitungsverzeichnis.pdf [Zugriff: 28.10.2026]
- Wavect (2026): EU Data Residency for AI APIs 2026: Provider Guide. Online abrufbar unter: https://wavect.io/blog/eu-data-residency-ai-apps-2026/ [Zugriff: 24.10.2026]

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |
| 1.1 | 24.10.2026 | Abschnitt 11: Rückmeldungen aus der Erprobung, Laufprotokolle in Issues, Impressum (App 0.5.5) |
| 1.2 | 24.10.2026 | Abschnitt 12: Datenschutzerklärung nach Art. 13 DSGVO für die Verarbeitungen des Herausgebers, mit Verweis auf das Impressum; Abschnitt 2 mit Kontakt (App 0.5.5) |
| 1.3 | 24.10.2026 | Mistral als dritter KI-Anbieter mit EU-Endpunkt als Vorgabe: Abschnitte 2, 4 und 5 (Endpunkte, Training, Aufbewahrung, Zero Data Retention, `store: false`), Drittlandübermittlung, Anhang A (App 0.5.6) |
| 1.4 | 25.10.2026 | Abschnitt 2: Modell je Aufgabe wählbar, ein Lauf kann mehrere Anbieter nutzen (Mix-Profile, App 0.5.15; AV-2026-W43-31) |
| 1.5 | 25.10.2026 | Abschnitte 3 und 10: Archiv der Testläufe auf dem Gerät mit Löschen (App 0.5.17) |
| 1.6 | 26.10.2026 | Abschnitte 3 und 9: Ablage der API-Schlüssel mit Passphrase verschlüsselt (App 0.6.2, TP-2026-W44-09) |
| 1.7 | 27.10.2026 | Abschnitte 2, 4 und 5: lokales Modell über Ollama ohne Drittanbieter, Datenfluss nur zum eigenen Gerät, Content-Security-Policy; Abschnitt 8: Ablage der Laufprotokolle in `src/speicher/laufSpeicher.ts` (App 0.6.3, TP-2026-W44-24, -26) |
| 1.8 | 28.10.2026 | Anhang D: Vorlage für einen Eintrag im Verzeichnis von Verarbeitungstätigkeiten nach Art. 30 DSGVO mit Vorbefüllung und Platzhaltern, Hinweisen zu Landesrecht (ThürDSG) und zu § 70 BDSG; Verweise in Abschnitt 2 und Anhang C; Quellen ergänzt (ohne Änderung der App) |
| 1.9 | 28.10.2026 | Anhang C und D zusätzlich unter CC0 1.0 (LICENSE-CONTENT, Nr. 2 d; ohne Änderung der App) |
| 1.10 | 30.10.2026 | Abschnitte 3 und 10: Sicherung des Gerätestands ohne API-Schlüssel und „Alle Daten dieses Geräts löschen“ unter „Einstellungen → Daten“ (TP-2026-W44-44, -45; App 0.6.15) |
| 1.10 · Nachtrag | 31.10.2026 | Ohne inhaltliche Änderung: Anhang C und D als SPDX-Snippet mit CC0 1.0 nach Wahl markiert (unsichtbarer Kommentar, REUSE, Issue #89) |
